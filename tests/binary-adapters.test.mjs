import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { PDFDocument, rgb } from 'pdf-lib';
import { convert } from '../packages/converters/src/index.mjs';

const command = (file, args, cwd) => new Promise((resolve, reject) => {
  const child = spawn(file, args, { cwd, shell: false }); let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject); child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${file}: ${stderr}`)));
});

async function generatedPng(directory) {
  const source = path.join(directory, 'source.png');
  await command('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=8x8:d=0.1', '-frames:v', '1', source]);
  return readFile(source);
}

test('PNG → PDF creates a valid PDF rather than placeholder text', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'henkanki-png-'));
  try {
    const result = await convert(await generatedPng(directory), 'png', 'pdf');
    assert.ok(Buffer.isBuffer(result.output)); assert.match(result.output.subarray(0, 5).toString(), /%PDF-/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('PDF → text uses a local PDF extractor', async () => {
  const document = await PDFDocument.create(); const page = document.addPage(); page.drawText('Henkanki local proof', { x: 48, y: 740, color: rgb(0, 0, 0) });
  const result = await convert(Buffer.from(await document.save()), 'pdf', 'text');
  assert.match(result.output.toString(), /Henkanki local proof/);
});

test('image conversion produces a decodable raster file', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'henkanki-image-'));
  try {
    const result = await convert(await generatedPng(directory), 'png', 'webp');
    assert.ok(result.output.byteLength > 16); assert.equal(result.output.subarray(0, 4).toString(), 'RIFF');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('ZIP listing reads actual entries', async () => {
  const zip = new JSZip(); zip.file('notes/local-first.txt', 'Henkanki');
  const result = await convert(await zip.generateAsync({ type: 'nodebuffer' }), 'zip', 'text');
  assert.match(result.output.toString(), /notes\/local-first\.txt/);
});

test('media adapter transcodes a locally generated WAV', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'henkanki-test-'));
  try {
    const source = path.join(directory, 'tone.wav'); await command('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.1', source]);
    const result = await convert(await readFile(source), 'wav', 'mp3');
    assert.match(result.output.subarray(0, 3).toString(), /ID3|\xff/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('Office adapter converts a locally generated document', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'henkanki-office-'));
  try {
    const source = path.join(directory, 'local.txt'); await writeFile(source, 'Henkanki office proof');
    await command('libreoffice', ['--headless', '--convert-to', 'docx', '--outdir', directory, source]);
    const result = await convert(await readFile(path.join(directory, 'local.docx')), 'docx', 'pdf');
    assert.match(result.output.subarray(0, 5).toString(), /%PDF-/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
