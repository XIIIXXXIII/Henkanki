import test from 'node:test';
import assert from 'node:assert/strict';
import { convertText } from '../packages/converters/src/text.mjs';

test('JSON ↔ YAML preserves nested data', () => {
  const source = '{"project":"Henkanki","ports":["FreeBSD","Haiku"],"local":true}';
  const yaml = convertText(source, 'json', 'yaml');
  const restored = JSON.parse(convertText(yaml, 'yaml', 'json'));
  assert.deepEqual(restored, { project: 'Henkanki', ports: ['FreeBSD', 'Haiku'], local: true });
});

test('CSV quotation is parsed rather than split manually', () => {
  const output = JSON.parse(convertText('name,quote\nAda,"hello, world"\n', 'csv', 'json'));
  assert.deepEqual(output, [{ name: 'Ada', quote: 'hello, world' }]);
});

test('JSON5, HJSON and TOML serialize through valid JSON', () => {
  assert.equal(JSON.parse(convertText('{ enabled: true, }', 'json5', 'json')).enabled, true);
  assert.equal(JSON.parse(convertText('enabled: true', 'hjson', 'json')).enabled, true);
  assert.equal(JSON.parse(convertText('name = "Henkanki"', 'toml', 'json')).name, 'Henkanki');
});

test('Markdown output is sanitized and URL codec round-trips', () => {
  assert.match(convertText('# Local first', 'markdown', 'html'), /<h1>Local first<\/h1>/);
  assert.equal(convertText(convertText('変換', 'text', 'url'), 'url', 'text').trim(), '変換');
});
