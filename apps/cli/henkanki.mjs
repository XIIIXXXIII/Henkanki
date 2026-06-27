#!/usr/bin/env node
import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { basename, extname, join, dirname } from 'node:path';
import { canConvert, detectFormat, listFormats, findFormat } from '../../packages/core/src/index.mjs';
import { convert, listTextConverters, listBinaryConverters, canConvertText, canConvertBinary, getBinaryMimeType, getBinaryExtension } from '../../packages/converters/src/index.mjs';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

const colorize = (text, color) => color + text + colors.reset;

const [, , command, ...args] = process.argv;
try { await main(command, args); } catch (error) { 
  console.error(colorize(`Henkanki error: ${error.message}`, colors.red));
  process.exit(1); 
}

async function main(cmd, args) {
  if (!cmd || ['help','--help','-h'].includes(cmd)) return help();
  if (cmd === 'formats') return await listAllFormats();
  if (cmd === 'info') return await info(args[0]);
  if (cmd === 'convert') return await convertFile(args);
  if (cmd === 'batch') return await batchConvert(args);
  if (cmd === 'interactive') return await interactiveMode();
  if (cmd === 'plugins') return await listPlugins();
  throw new Error(`Unknown command: ${cmd}`);
}

async function listAllFormats() {
  const formats = listFormats();
  console.log(colorize('Available Formats:', colors.bold));
  console.log(colorize('='.repeat(80), colors.gray));
  
  // Group by category
  const categories = {};
  for (const fmt of formats) {
    if (!categories[fmt.category]) categories[fmt.category] = [];
    categories[fmt.category].push(fmt);
  }
  
  for (const [category, categoryFormats] of Object.entries(categories)) {
    console.log(colorize(`\n${category.toUpperCase()}:`, colors.cyan));
    for (const fmt of categoryFormats) {
      const outputs = fmt.outputs.join(', ');
      console.log(`  ${colorize(fmt.id.padEnd(12), colors.green)} ${colorize(fmt.mime.padEnd(30), colors.yellow)} -> ${outputs}`);
    }
  }
  
  console.log(colorize(`\nTotal: ${formats.length} formats`, colors.bold));
  console.log(colorize(`\nText converters: ${listTextConverters().length}`, colors.bold));
  console.log(colorize(`Binary converters: ${listBinaryConverters().length}`, colors.bold));
}

async function info(file) {
  if (!file) throw new Error('Usage: henkanki info <file>');
  const s = await stat(file);
  const format = detectFormat(file);
  const content = await readFile(file);
  
  console.log(colorize('File Information:', colors.bold));
  console.log(colorize('-'.repeat(40), colors.gray));
  console.log(`  ${colorize('File:', colors.cyan)} ${basename(file)}`);
  console.log(`  ${colorize('Size:', colors.cyan)} ${formatBytes(s.size)}`);
  console.log(`  ${colorize('Format:', colors.cyan)} ${format?.id || 'unknown'}`);
  console.log(`  ${colorize('MIME:', colors.cyan)} ${format?.mime || 'unknown'}`);
  console.log(`  ${colorize('Extension:', colors.cyan)} ${extname(file) || 'none'}`);
  
  // Show possible conversions
  if (format) {
    const possibleOutputs = format.outputs;
    console.log(`\n${colorize('Possible Conversions:', colors.bold)}`);
    console.log(`  ${possibleOutputs.join(', ')}`);
  }
  
  // For binary files, show additional info
  if (format?.category === 'binary' || format?.category === 'image') {
    console.log(`\n${colorize('Binary File Info:', colors.bold)}`);
    console.log(`  ${colorize('Type:', colors.cyan)} ${format?.category || 'binary'}`);
    console.log(`  ${colorize('Buffer size:', colors.cyan)} ${content.length} bytes`);
  }
}

async function convertFile(args) {
  const [input, output] = args;
  const to = valueAfter(args, '--to') || detectFormat(output)?.id;
  const from = valueAfter(args, '--from') || detectFormat(input)?.id;
  
  if (!input || !output) {
    throw new Error('Usage: henkanki convert <input> <output> [--from fmt] [--to fmt]');
  }
  
  if (!from) {
    throw new Error(`Cannot detect input format for: ${input}. Use --from to specify.`);
  }
  
  if (!to) {
    throw new Error(`Cannot detect output format for: ${output}. Use --to to specify.`);
  }
  
  if (!canConvert(from, to)) {
    throw new Error(`Conversion not supported: ${from} -> ${to}`);
  }
  
  // Check if input is a directory (batch mode)
  const inputStat = await stat(input);
  if (inputStat.isDirectory()) {
    await batchConvert([input, output, '--from', from, '--to', to]);
    return;
  }
  
  // Read input file
  const inputBuffer = await readFile(input);
  const inputText = inputBuffer.toString('utf8');
  
  console.log(colorize(`Converting: ${basename(input)} (${from}) -> ${basename(output)} (${to})`, colors.yellow));
  
  // Determine if this is a binary or text conversion
  const binaryFormats = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
  const isBinary = binaryFormats.includes(from) || binaryFormats.includes(to);
  
  let result;
  if (isBinary) {
    result = await convert(inputBuffer, from, to);
  } else {
    result = await convert(inputText, from, to);
  }
  
  // Write output
  if (typeof result === 'string') {
    await writeFile(output, result);
  } else if (result instanceof Buffer) {
    await writeFile(output, result);
  } else {
    await writeFile(output, String(result));
  }
  
  const inputSize = formatBytes(inputStat.size);
  const outputStat = await stat(output);
  const outputSize = formatBytes(outputStat.size);
  
  console.log(colorize(`✓ Success!`, colors.green));
  console.log(`  ${colorize('Input:', colors.cyan)} ${inputSize}`);
  console.log(`  ${colorize('Output:', colors.cyan)} ${outputSize}`);
}

async function batchConvert(args) {
  let inputDir = args[0];
  let outputDir = args[1];
  const to = valueAfter(args, '--to');
  const from = valueAfter(args, '--from');
  
  if (!inputDir || !outputDir) {
    throw new Error('Usage: henkanki batch <inputDir> <outputDir> [--from fmt] [--to fmt]');
  }
  
  // Auto-detect if not provided
  const files = await readdir(inputDir);
  let processed = 0;
  let skipped = 0;
  
  console.log(colorize(`Batch Conversion: ${inputDir} -> ${outputDir}`, colors.bold));
  console.log(colorize('-'.repeat(60), colors.gray));
  
  for (const file of files) {
    const inputPath = join(inputDir, file);
    const fileStat = await stat(inputPath);
    
    if (fileStat.isDirectory()) {
      skipped++;
      continue;
    }
    
    const detectedFrom = from || detectFormat(inputPath)?.id;
    const fileExt = extname(file).slice(1);
    const outputExt = to || (detectedFrom === from ? getBinaryExtension(to) || findFormat(to)?.extension.slice(1) : fileExt);
    const outputFile = basename(file, extname(file)) + (outputExt ? `.${outputExt}` : '');
    const outputPath = join(outputDir, outputFile);
    
    if (!detectedFrom) {
      console.log(colorize(`  ⊘ Skipped: ${file} (unknown format)`, colors.gray));
      skipped++;
      continue;
    }
    
    if (!canConvert(detectedFrom, to || outputExt)) {
      console.log(colorize(`  ⊘ Skipped: ${file} (${detectedFrom} -> ${to || outputExt} not supported)`, colors.gray));
      skipped++;
      continue;
    }
    
    try {
      const inputBuffer = await readFile(inputPath);
      const binaryFormats = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
      const isBinary = binaryFormats.includes(detectedFrom) || binaryFormats.includes(to || outputExt);
      
      let result;
      if (isBinary) {
        result = await convert(inputBuffer, detectedFrom, to || outputExt);
      } else {
        result = await convert(inputBuffer.toString('utf8'), detectedFrom, to || outputExt);
      }
      
      if (typeof result === 'string') {
        await writeFile(outputPath, result);
      } else if (result instanceof Buffer) {
        await writeFile(outputPath, result);
      } else {
        await writeFile(outputPath, String(result));
      }
      
      console.log(colorize(`  ✓ ${file} -> ${outputFile}`, colors.green));
      processed++;
    } catch (e) {
      console.log(colorize(`  ✗ ${file}: ${e.message}`, colors.red));
      skipped++;
    }
  }
  
  console.log(colorize(`\nBatch complete: ${processed} processed, ${skipped} skipped`, colors.bold));
}

async function interactiveMode() {
  console.log(colorize('\nHenkanki Interactive Mode', colors.bold));
  console.log(colorize('='.repeat(40), colors.gray));
  
  const { default: prompts } = await import('prompts');
  
  const { file } = await prompts({
    type: 'text',
    name: 'file',
    message: 'Enter input file path:',
    validate: (value) => {
      try {
        const stats = statSync(value);
        return stats.isFile();
      } catch {
        return 'File not found';
      }
    },
  });
  
  if (!file) {
    console.log(colorize('Cancelled.', colors.yellow));
    return;
  }
  
  const format = detectFormat(file);
  const { from } = await prompts({
    type: 'text',
    name: 'from',
    message: 'Input format:',
    initial: format?.id || '',
  });
  
  const allFormats = listFormats();
  const possibleOutputs = format?.outputs || allFormats.map(f => f.id);
  
  const { to } = await prompts({
    type: 'select',
    name: 'to',
    message: 'Output format:',
    choices: possibleOutputs.map(f => ({ title: f, value: f })),
  });
  
  const { output } = await prompts({
    type: 'text',
    name: 'output',
    message: 'Output file path:',
    initial: `${basename(file, extname(file))}.${to}`,
  });
  
  if (!output) {
    console.log(colorize('Cancelled.', colors.yellow));
    return;
  }
  
  await convertFile([file, output, '--from', from, '--to', to]);
}

async function listPlugins() {
  console.log(colorize('\nPlugins System', colors.bold));
  console.log(colorize('='.repeat(40), colors.gray));
  console.log(colorize('\nPlugin system is ready for implementation!', colors.yellow));
  console.log('\nTo add plugins:');
  console.log('  1. Create a plugin directory in packages/converters/plugins/');
  console.log('  2. Add a manifest.json with plugin metadata');
  console.log('  3. Implement converter functions');
  console.log('  4. Register the plugin in packages/converters/src/index.mjs');
}

// Helper functions
function valueAfter(args, key) { 
  const i = args.indexOf(key); 
  return i === -1 ? undefined : args[i + 1]; 
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function help() {
  console.log(`
${colorize('Henkanki CLI', colors.bold)} - Local-first universal file conversion tool

${colorize('Usage:', colors.cyan)}
  henkanki <command> [options]

${colorize('Commands:', colors.cyan)}
  ${colorize('formats', colors.green)}           List all supported formats
  ${colorize('info <file>', colors.green)}        Show file information
  ${colorize('convert <input> <output>', colors.green)} Convert a file
  ${colorize('batch <inputDir> <outputDir>', colors.green)} Batch convert files
  ${colorize('interactive', colors.green)}      Interactive mode
  ${colorize('plugins', colors.green)}          List available plugins

${colorize('Options for convert:', colors.cyan)}
  --from <fmt>   Specify input format
  --to <fmt>     Specify output format

${colorize('Examples:', colors.cyan)}
  henkanki convert data.json data.yaml
  henkanki convert README.md README.html --from md --to html
  henkanki convert image.png image.jpg --from png --to jpg
  henkanki convert document.pdf document.txt --from pdf --to txt
  henkanki batch ./input ./output --from json --to yaml
  henkanki info data.json
  henkanki formats

${colorize('Supported Formats:', colors.cyan)}
  Text: json, yaml, csv, md, html, txt, xml, toml, ini, json5, hjson, base64, url, hex
  Binary: png, jpg, jpeg, webp, pdf, gif
`);
}

// Sync version of stat for validation
import { statSync } from 'node:fs';
