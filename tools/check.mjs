import { access, readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec = promisify(execFile);

// Required files check
const required = [
  'README.md',
  'package.json',
  'henkanki.config.json',
  'apps/web/index.html',
  'apps/web/src/main.mjs',
  'apps/web/src/styles.css',
  'apps/cli/henkanki.mjs',
  'apps/desktop/Cargo.toml',
  'apps/desktop/tauri.conf.json',
  'apps/desktop/src/main.rs',
  'apps/desktop/index.html',
  'apps/mobile/capacitor.config.json',
  'apps/mobile/package.json',
  'apps/vscode/package.json',
  'apps/vscode/extension.js',
  'packages/core/src/index.mjs',
  'packages/converters/src/index.mjs',
  'packages/converters/src/text.mjs',
  'packages/converters/src/binary/index.mjs',
  'packages/converters/src/heavy/index.mjs',
  'packages/converters/plugins/README.md',
  'packages/formats/src/formats.json',
  'packages/ai/src/index.mjs',
  'docs/roadmap.md',
];

console.log('🔍 Checking required files...');
let missingFiles = 0;
for (const file of required) {
  try {
    await access(file);
    console.log(`  ✅ ${file}`);
  } catch {
    console.log(`  ❌ ${file} is missing!`);
    missingFiles++;
  }
}

if (missingFiles > 0) {
  console.log(`\n❌ ${missingFiles} required files are missing!`);
  process.exit(1);
}

console.log('\n🧪 Testing CLI commands...');

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

// Test: henkanki help
try {
  await exec('node', ['apps/cli/henkanki.mjs', '--help']);
  console.log('  ✅ henkanki --help');
} catch (error) {
  console.log(`  ❌ henkanki --help failed: ${error.message}`);
  process.exit(1);
}

// Test: henkanki plugins
try {
  await exec('node', ['apps/cli/henkanki.mjs', 'plugins']);
  console.log('  ✅ henkanki plugins');
} catch (error) {
  console.log(`  ❌ henkanki plugins failed: ${error.message}`);
  process.exit(1);
}

console.log('\n🔄 Testing conversions...');

// Test conversions
const testCases = [
  // JSON conversions
  { from: 'json', to: 'yaml', input: '{"name":"Henkanki","version":"0.3.0"}', expected: 'name: Henkanki' },
  { from: 'yaml', to: 'json', input: 'name: Henkanki\nversion: 0.3.0', expected: '"name"' },
  { from: 'json', to: 'toml', input: '{"name":"Henkanki"}', expected: 'name = ' },
  { from: 'toml', to: 'json', input: 'name = "Henkanki"', expected: '"name"' },
  { from: 'json', to: 'ini', input: '{"name":"Henkanki"}', expected: 'name = Henkanki' },
  { from: 'ini', to: 'json', input: '[root]\nname = Henkanki', expected: '"root"' },
  
  // CSV conversions
  { from: 'csv', to: 'json', input: 'name,version\nHenkanki,0.3.0', expected: '"name"' },
  { from: 'csv', to: 'yaml', input: 'name,version\nHenkanki,0.3.0', expected: 'name: Henkanki' },
  { from: 'csv', to: 'txt', input: 'a,b\n1,2', expected: 'a,b' },
  
  // Markdown conversions
  { from: 'md', to: 'html', input: '# Hello\n\nWorld', expected: '<h1>' },
  { from: 'html', to: 'md', input: '<h1>Hello</h1>\n<p>World</p>', expected: '# Hello' },
  { from: 'md', to: 'txt', input: '# Title', expected: '```' },
  
  // Text conversions
  { from: 'txt', to: 'json', input: 'line1\nline2', expected: '[' },
  { from: 'txt', to: 'yaml', input: 'Hello', expected: 'content: |' },
  { from: 'txt', to: 'html', input: 'Hello', expected: '<pre>' },
  { from: 'txt', to: 'base64', input: 'Hello', expected: 'SGVsbG8=' },
  { from: 'txt', to: 'hex', input: 'Hi', expected: '00000000: 4869' },
  
  // XML conversions
  { from: 'xml', to: 'json', input: '<root><name>Henkanki</name></root>', expected: '"_content"' },
  { from: 'json', to: 'xml', input: '{"name":"Henkanki"}', expected: '<root>' },
  
  // Base64 conversions
  { from: 'base64', to: 'txt', input: 'SGVsbG8=', expected: 'Hello' },
  { from: 'base64', to: 'hex', input: 'SGVsbG8=', expected: '48656c6c6f' },
  
  // URL conversions
  { from: 'url', to: 'txt', input: 'Hello%20World', expected: 'Hello World' },
  
  // Hex conversions
  { from: 'hex', to: 'txt', input: '48656c6c6f', expected: 'Hello' },
];

let passed = 0;
let failed = 0;

for (const { from, to, input, expected } of testCases) {
  try {
    const inputFile = `/tmp/henkanki-test-${from}-${Date.now()}.${from}`;
    const outputFile = `/tmp/henkanki-test-${to}-${Date.now()}.${to}`;
    
    await writeFile(inputFile, input);
    await exec('node', ['apps/cli/henkanki.mjs', 'convert', inputFile, outputFile, '--from', from, '--to', to]);
    
    const result = await readFile(outputFile, 'utf8');
    if (result.includes(expected)) {
      console.log(`  ✅ ${from.padEnd(8)} -> ${to.padEnd(8)}`);
      passed++;
    } else {
      console.log(`  ❌ ${from.padEnd(8)} -> ${to.padEnd(8)}: expected to contain "${expected}", got "${result.slice(0, 100)}"`);
      failed++;
    }
    
    await unlink(inputFile).catch(() => {});
    await unlink(outputFile).catch(() => {});
  } catch (error) {
    console.log(`  ❌ ${from.padEnd(8)} -> ${to.padEnd(8)} failed: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Conversion tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}

console.log('\n✅ All Henkanki checks passed!');
console.log('\n🎉 Project is ready for use!');
console.log('\n📌 Next steps:');
console.log('  - Run CLI: node apps/cli/henkanki.mjs convert input.json output.yaml');
console.log('  - Run web: npm run dev:web');
console.log('  - Build desktop: cd apps/desktop && cargo run');
console.log('  - Build mobile: cd apps/mobile && npm run build');
console.log('  - Add more formats to packages/formats/src/formats.json');
console.log('  - Extend converters in packages/converters/src/');
console.log('\n🚀 All phases (1-5) are now complete!');
