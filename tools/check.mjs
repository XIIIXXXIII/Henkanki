import { access, readFile, writeFile, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

// Required files check
const required = [
  'README.md',
  'package.json',
  'henkanki.config.json',
  'apps/web/index.html',
  'apps/cli/henkanki.mjs',
  'packages/core/src/index.mjs',
  'packages/converters/src/index.mjs',
  'packages/converters/src/text.mjs',
  'packages/formats/src/formats.json',
];

console.log('🔍 Checking required files...');
for (const file of required) {
  try {
    await access(file);
    console.log(`  ✅ ${file}`);
  } catch {
    console.log(`  ❌ ${file} is missing!`);
    process.exit(1);
  }
}

console.log('\n📋 Testing CLI commands...');

// Test: henkanki formats
try {
  await exec('node', ['apps/cli/henkanki.mjs', 'formats']);
  console.log('  ✅ henkanki formats');
} catch (error) {
  console.log(`  ❌ henkanki formats failed: ${error.message}`);
  process.exit(1);
}

// Test: henkanki info
try {
  await exec('node', ['apps/cli/henkanki.mjs', 'info', 'package.json']);
  console.log('  ✅ henkanki info');
} catch (error) {
  console.log(`  ❌ henkanki info failed: ${error.message}`);
  process.exit(1);
}

console.log('\n🔄 Testing conversions...');

// Test conversions
const testCases = [
  { from: 'json', to: 'yaml', input: '{"name":"Henkanki","version":"0.1.0"}', expected: 'name: Henkanki' },
  { from: 'yaml', to: 'json', input: 'name: Henkanki\nversion: 0.1.0', expected: '"name"' },
  { from: 'csv', to: 'json', input: 'name,version\nHenkanki,0.1.0', expected: '"name"' },
  { from: 'md', to: 'html', input: '# Hello\n\nWorld', expected: '<h1>' },
  { from: 'html', to: 'md', input: '<h1>Hello</h1>\n<p>World</p>', expected: '# Hello' },
  { from: 'json', to: 'txt', input: '{"test":"value"}', expected: '[' },
  { from: 'txt', to: 'json', input: 'line1\nline2', expected: '[' },
  { from: 'csv', to: 'txt', input: 'a,b\n1,2', expected: 'a,b' },
];

for (const { from, to, input, expected } of testCases) {
  try {
    const inputFile = `/tmp/henkanki-test-${from}.${from}`;
    const outputFile = `/tmp/henkanki-test-${to}.${to}`;
    
    await writeFile(inputFile, input);
    await exec('node', ['apps/cli/henkanki.mjs', 'convert', inputFile, outputFile, '--from', from, '--to', to]);
    
    const result = await readFile(outputFile, 'utf8');
    if (result.includes(expected)) {
      console.log(`  ✅ ${from} -> ${to}`);
    } else {
      console.log(`  ❌ ${from} -> ${to}: expected to contain "${expected}", got "${result.slice(0, 50)}"`);
      process.exit(1);
    }
    
    await unlink(inputFile);
    await unlink(outputFile);
  } catch (error) {
    console.log(`  ❌ ${from} -> ${to} failed: ${error.message}`);
    process.exit(1);
  }
}

console.log('\n✨ All Henkanki checks passed!');
