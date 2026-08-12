/**
 * Kanso Industrial: external tools are invoked with argument arrays only.
 * Every adapter uses a private temporary directory and cleans it afterwards.
 */
import { mkdtemp, writeFile, readFile, rm, mkdir, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { error } from '../../core/src/errors.mjs';

const aliases = { jpg: 'jpeg', tif: 'tiff', oga: 'ogg' };
const formatId = (value) => aliases[String(value).toLowerCase()] || String(value).toLowerCase();
const maxInputBytes = 512 * 1024 * 1024;

function run(command, args, { cwd, signal } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, signal, shell: false, windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (cause) => reject(error('TOOL_START_FAILED', `Unable to start ${command}.`, { command, cause: cause.message })));
    child.on('close', (code) => code === 0 ? resolve() : reject(error('TOOL_FAILED', `${command} exited with code ${code}.`, { command, args, code, stderr: stderr.slice(-4000) })));
  });
}

function runCapture(command, args, { cwd, signal } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, signal, shell: false, windowsHide: true });
    const stdout = []; let stderr = '';
    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (cause) => reject(error('TOOL_START_FAILED', `Unable to start ${command}.`, { command, cause: cause.message })));
    child.on('close', (code) => code === 0 ? resolve(Buffer.concat(stdout)) : reject(error('TOOL_FAILED', `${command} exited with code ${code}.`, { command, args, code, stderr: stderr.slice(-4000) })));
  });
}

async function inTemporaryDirectory(task) {
  const directory = await mkdtemp(path.join(tmpdir(), 'henkanki-'));
  try { return await task(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}

async function writeInput(directory, content, extension) {
  const source = path.join(directory, `input.${extension}`);
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (buffer.byteLength > maxInputBytes) throw error('INPUT_TOO_LARGE', `Input exceeds ${maxInputBytes} byte local safety limit.`, { bytes: buffer.byteLength });
  await writeFile(source, buffer); return source;
}

async function imageConvert(content, from, to, options) {
  return inTemporaryDirectory(async (directory) => {
    const source = await writeInput(directory, content, from); const target = path.join(directory, `output.${to}`);
    await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', source, '-frames:v', '1', target], options);
    return { output: await readFile(target), diagnostics: to === 'jpeg' || to === 'webp' || to === 'avif' ? ['The selected image format can be lossy.'] : [] };
  });
}

async function pdfConvert(content, from, to, options) {
  return inTemporaryDirectory(async (directory) => {
    if (from === 'pdf' && to === 'text') {
      const source = await writeInput(directory, content, 'pdf'); const target = path.join(directory, 'output.txt');
      await run('pdftotext', [source, target], options); return { output: await readFile(target), diagnostics: [] };
    }
    if (from === 'pdf' && ['png', 'jpeg'].includes(to)) {
      const source = await writeInput(directory, content, 'pdf'); const prefix = path.join(directory, 'page');
      await run('pdftoppm', [to === 'png' ? '-png' : '-jpeg', '-f', '1', '-singlefile', source, prefix], options);
      return { output: await readFile(`${prefix}.${to === 'jpeg' ? 'jpg' : 'png'}`), diagnostics: [] };
    }
    if (['png', 'jpeg'].includes(from) && to === 'pdf') {
      const document = await PDFDocument.create(); const image = from === 'png' ? await document.embedPng(content) : await document.embedJpg(content);
      const page = document.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      return { output: Buffer.from(await document.save()), diagnostics: [] };
    }
    throw error('UNSUPPORTED_ROUTE', `No verified PDF route from ${from} to ${to}.`);
  });
}

async function mediaConvert(content, from, to, options) {
  return inTemporaryDirectory(async (directory) => {
    const source = await writeInput(directory, content, from); const extension = to === 'png' ? 'png' : to; const target = path.join(directory, `output.${extension}`);
    const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', source];
    if (to === 'png') args.push('-frames:v', '1');
    args.push(target); await run('ffmpeg', args, options);
    return { output: await readFile(target), diagnostics: [] };
  });
}

async function officeConvert(content, from, to, options) {
  return inTemporaryDirectory(async (directory) => {
    const source = await writeInput(directory, content, from); const out = path.join(directory, 'out'); await mkdir(out);
    const targetFormat = to === 'text' ? 'txt:Text' : 'pdf';
    await run('libreoffice', ['--headless', '--convert-to', targetFormat, '--outdir', out, source], options);
    const files = await readdir(out); const target = files.find((file) => file.endsWith(to === 'text' ? '.txt' : '.pdf'));
    if (!target) throw error('NO_OUTPUT', `LibreOffice did not produce a ${to} output.`, { from, to });
    return { output: await readFile(path.join(out, target)), diagnostics: [] };
  });
}

async function archiveConvert(content, from, to, options) {
  return inTemporaryDirectory(async (directory) => {
    const source = await writeInput(directory, content, from);
    if (to === 'text') {
      if (from === 'zip') {
        const zip = await JSZip.loadAsync(content); return { output: Buffer.from(`${Object.keys(zip.files).join('\n')}\n`), diagnostics: [] };
      }
      const listing = await runCapture('tar', ['-tf', source], options).catch((cause) => { throw error('ARCHIVE_LIST_FAILED', 'Unable to inspect this archive.', { cause: cause.message, from }); });
      return { output: listing, diagnostics: [] };
    }
    const extract = path.join(directory, 'extract'); await mkdir(extract);
    if (from === 'zip') await run('unzip', ['-qq', source, '-d', extract], options);
    else await run('tar', ['-xf', source, '-C', extract], options);
    const target = path.join(directory, to === 'gz' ? 'output.tar.gz' : `output.${to}`);
    if (to === 'zip') await run('zip', ['-qr', target, '.'], { ...options, cwd: extract });
    else if (to === 'gz') await run('tar', ['-czf', target, '-C', extract, '.'], options);
    else if (to === 'tar') await run('tar', ['-cf', target, '-C', extract, '.'], options);
    else throw error('UNSUPPORTED_ROUTE', `No verified archive route to ${to}.`);
    return { output: await readFile(target), diagnostics: [] };
  });
}

export async function convertBinary(input, fromValue, toValue, options = {}) {
  const from = formatId(fromValue); const to = formatId(toValue); const operation = options.plan?.operation;
  if (operation === 'image') return imageConvert(input, from, to, options);
  if (operation === 'pdf') return pdfConvert(input, from, to, options);
  if (operation === 'media') return mediaConvert(input, from, to, options);
  if (operation === 'office') return officeConvert(input, from, to, options);
  if (operation === 'archive') return archiveConvert(input, from, to, options);
  throw error('UNSUPPORTED_ROUTE', `No verified binary converter for ${from} -> ${to}.`, { from, to });
}
