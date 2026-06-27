#!/usr/bin/env node
import { readFile, writeFile, stat } from 'node:fs/promises';
import { basename } from 'node:path';
import { canConvert, detectFormat, listFormats } from '../../packages/core/src/index.mjs';
import { convertText } from '../../packages/converters/src/index.mjs';

const [, , command, ...args] = process.argv;
try { await main(command, args); } catch (error) { console.error(`Henkanki error: ${error.message}`); process.exit(1); }

async function main(cmd, args) {
  if (!cmd || ['help','--help','-h'].includes(cmd)) return help();
  if (cmd === 'formats') return console.log(listFormats().map((f) => `${f.id}\t${f.mime}\t-> ${f.outputs.join(', ')}`).join('\n'));
  if (cmd === 'info') return info(args[0]);
  if (cmd === 'convert') return convert(args);
  throw new Error(`Unknown command: ${cmd}`);
}

async function info(file) {
  if (!file) throw new Error('Usage: henkanki info <file>');
  const s = await stat(file);
  const format = detectFormat(file);
  console.log(JSON.stringify({ file: basename(file), bytes: s.size, format: format?.id ?? 'unknown', mime: format?.mime ?? 'unknown' }, null, 2));
}

async function convert(args) {
  const [input, output] = args;
  const to = valueAfter(args, '--to') || detectFormat(output)?.id;
  const from = valueAfter(args, '--from') || detectFormat(input)?.id;
  if (!input || !output || !from || !to) throw new Error('Usage: henkanki convert <input> <output> [--from fmt] [--to fmt]');
  if (!canConvert(from, to)) throw new Error(`Conversion not registered: ${from} -> ${to}`);
  const text = await readFile(input, 'utf8');
  const result = await convertText(text, from, to);
  await writeFile(output, result);
  console.log(`${input} -> ${output} (${from} -> ${to})`);
}

function valueAfter(args, key) { const i = args.indexOf(key); return i === -1 ? undefined : args[i + 1]; }
function help() { console.log(`Henkanki CLI\n\nCommands:\n  henkanki formats\n  henkanki info <file>\n  henkanki convert <input> <output> [--from fmt] [--to fmt]\n`); }
