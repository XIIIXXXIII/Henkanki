#!/usr/bin/env node
/** Henkanki v1 CLI — local-first, capability-aware, and scriptable. */
import { readFile, writeFile, stat, readdir, mkdir } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { detectFormat, discoverCapabilities, extensionFor, listFormats, planConversion, HenkankiError } from '../../packages/core/src/index.mjs';
import { convert, getPlan } from '../../packages/converters/src/index.mjs';

const [, , command = 'help', ...raw] = process.argv;
const flags = new Set(raw.filter((entry) => entry.startsWith('--')));
const jsonMode = flags.has('--json');
const text = { red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m', reset: '\x1b[0m' };
const paint = (color, value) => process.stdout.isTTY && !jsonMode ? `${text[color]}${value}${text.reset}` : value;
const valueAfter = (key) => { const at = raw.indexOf(key); return at >= 0 ? raw[at + 1] : undefined; };
const positional = raw.filter((entry, index) => !entry.startsWith('--') && raw[index - 1] !== '--from' && raw[index - 1] !== '--to');
const emit = (value) => jsonMode ? console.log(JSON.stringify(value, null, 2)) : typeof value === 'string' ? console.log(value) : console.log(JSON.stringify(value, null, 2));

function detected(file) { return detectFormat(file).format.id; }
function presentPlan(plan) {
  if (jsonMode) return emit(plan);
  console.log(`${paint('bold', `${plan.from.id} → ${plan.to.id}`)}  ${paint(plan.status === 'available' ? 'green' : 'yellow', plan.status)}`);
  if (plan.requirements?.length) console.log(`  local tools: ${plan.requirements.join(', ')}`);
  for (const warning of plan.warnings || []) console.log(`  ${paint('yellow', 'warning:')} ${warning}`);
}

async function convertOne(input, output, from, to, { dryRun = false } = {}) {
  const plan = getPlan(from, to);
  if (dryRun) return { input, output, plan, dryRun: true };
  if (plan.status !== 'available') throw new HenkankiError(plan.status === 'optional-dependency' ? 'MISSING_DEPENDENCY' : 'UNSUPPORTED_ROUTE', plan.warnings?.[0] || `Cannot convert ${from} to ${to}.`, plan);
  const source = await readFile(input); const started = performance.now();
  const result = await convert(source, from, to); await mkdir(dirname(output), { recursive: true });
  await writeFile(output, result.output); const outputInfo = await stat(output);
  return { input, output, from, to, bytesIn: source.byteLength, bytesOut: outputInfo.size, elapsedMs: Math.round(performance.now() - started), plan, diagnostics: result.diagnostics };
}

async function commandConvert() {
  const [input, output] = positional; if (!input || !output) throw new Error('Usage: henkanki convert <input> <output> [--from format] [--to format] [--dry-run] [--json]');
  const from = valueAfter('--from') || detected(input); const to = valueAfter('--to') || detected(output);
  const result = await convertOne(resolve(input), resolve(output), from, to, { dryRun: flags.has('--dry-run') });
  if (jsonMode) return emit(result);
  if (result.dryRun) return presentPlan(result.plan);
  console.log(`${paint('green', 'done')} ${basename(input)} → ${basename(output)} ${paint('dim', `(${result.bytesIn} B → ${result.bytesOut} B, ${result.elapsedMs} ms)`)}`);
  for (const diagnostic of result.diagnostics || []) console.log(`  ${paint('yellow', 'warning:')} ${diagnostic}`);
}

async function commandBatch() {
  const [sourceDirectory, outputDirectory] = positional; const forcedFrom = valueAfter('--from'); const to = valueAfter('--to');
  if (!sourceDirectory || !outputDirectory || !to) throw new Error('Usage: henkanki batch <input-dir> <output-dir> --to format [--from format] [--dry-run] [--json]');
  const entries = await readdir(sourceDirectory, { withFileTypes: true }); const outcomes = [];
  for (const entry of entries.filter((entry) => entry.isFile())) {
    const input = join(sourceDirectory, entry.name); const from = forcedFrom || detected(entry.name); const output = join(outputDirectory, `${basename(entry.name, extname(entry.name))}.${extensionFor(to)}`);
    try { outcomes.push({ ok: true, ...(await convertOne(input, output, from, to, { dryRun: flags.has('--dry-run') })) }); }
    catch (cause) { outcomes.push({ ok: false, input, from, to, error: cause.message, code: cause.code || 'CONVERSION_FAILED' }); }
  }
  const summary = { processed: outcomes.filter((result) => result.ok).length, failed: outcomes.filter((result) => !result.ok).length, outcomes };
  if (jsonMode) return emit(summary);
  console.log(`${paint('bold', 'Batch summary:')} ${paint('green', summary.processed)} completed, ${summary.failed ? paint('red', summary.failed) : 0} failed.`);
  for (const item of outcomes) console.log(item.ok ? `  ${paint('green', '✓')} ${basename(item.input)}` : `  ${paint('red', '×')} ${basename(item.input)} — ${item.error}`);
}

async function commandFormats() {
  const family = valueAfter('--family'); const support = valueAfter('--support'); const formats = listFormats({ family, support });
  if (jsonMode) return emit(formats);
  for (const [group, entries] of Object.entries(Object.groupBy(formats, (format) => format.family))) {
    console.log(`\n${paint('cyan', group.toUpperCase())}`);
    for (const format of entries) console.log(`  ${format.id.padEnd(12)} ${format.extensions.map((extension) => `.${extension}`).join(', ').padEnd(22)} ${paint(format.support === 'official' ? 'green' : 'yellow', format.support)}`);
  }
}

async function commandInspect() {
  const [file] = positional; if (!file) throw new Error('Usage: henkanki inspect <file> [--json]');
  const info = await stat(file); const detection = detectFormat(file); const capabilities = discoverCapabilities();
  const routes = listFormats().map((format) => planConversion(detection.format.id, format.id, capabilities)).filter((plan) => plan.status !== 'unavailable');
  const report = { file: resolve(file), size: info.size, detection, routes };
  if (jsonMode) return emit(report);
  console.log(`${paint('bold', basename(file))}  ${paint('cyan', detection.format.id)}  ${info.size} B`);
  console.log(`Detected by ${detection.method}; ${routes.length} verified or optional routes available.`);
}

function commandPlan() {
  const [from, to] = positional; if (!from || !to) throw new Error('Usage: henkanki plan <from> <to> [--json]');
  presentPlan(getPlan(from, to));
}

function commandDoctor() {
  const report = discoverCapabilities(); if (jsonMode) return emit(report);
  console.log(paint('bold', `Henkanki doctor — ${report.platform}/${report.arch}`));
  for (const [id, tool] of Object.entries(report.tools)) console.log(`  ${tool.available ? paint('green', '✓') : paint('yellow', '○')} ${id.padEnd(12)} ${tool.description}`);
}

async function commandPlugins() {
  const root = new URL('../../plugins/official/', import.meta.url); const names = await readdir(root, { withFileTypes: true });
  const manifests = await Promise.all(names.filter((entry) => entry.isDirectory()).map(async (entry) => JSON.parse(await readFile(new URL(`${entry.name}/manifest.json`, root), 'utf8'))));
  emit(manifests);
}

function help() {
  emit(`
${paint('bold', 'Henkanki v1')} — files stay local; routes are planned before they run.

  convert <input> <output> [--from fmt] [--to fmt] [--dry-run] [--json]
  batch <input-dir> <output-dir> --to fmt [--from fmt] [--dry-run] [--json]
  inspect <file> [--json]          plan routes from an input file
  plan <from> <to> [--json]        inspect a conversion route
  formats [--family name] [--support level] [--json]
  doctor [--json]                  discover optional local tools
  plugins [--json]                 list installed official plugin manifests

Examples:
  henkanki convert profile.json profile.yaml
  henkanki plan pdf text
  henkanki batch ./incoming ./converted --to webp
  henkanki doctor
`);
}

try {
  if (['help', '--help', '-h'].includes(command)) help();
  else if (command === 'convert') await commandConvert();
  else if (command === 'batch') await commandBatch();
  else if (command === 'formats') await commandFormats();
  else if (['inspect', 'info'].includes(command)) await commandInspect();
  else if (command === 'plan') commandPlan();
  else if (command === 'doctor') commandDoctor();
  else if (command === 'plugins') await commandPlugins();
  else throw new Error(`Unknown command: ${command}`);
} catch (cause) {
  const report = { error: cause.message, code: cause.code || 'HENKANKI_ERROR', details: cause.details || {} };
  if (jsonMode) emit(report); else console.error(`${paint('red', report.code)} ${report.error}`);
  process.exitCode = 1;
}
