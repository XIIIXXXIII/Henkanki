import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { detectFormat, inspectFormat } from '../packages/core/src/index.mjs';

test('content signature overrides a misleading filename extension', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  const result = detectFormat('invoice.txt', png);
  assert.equal(result.format.id, 'png');
  assert.equal(result.method, 'magic-bytes');
});

test('text formats are identified by parseable content before their extension', () => {
  const result = detectFormat('unknown.data', '{"local":true}\n');
  assert.equal(result.format.id, 'json');
  assert.equal(result.method, 'parse');
});

test('OOXML is identified from ZIP container contents', async () => {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types/>');
  zip.file('word/document.xml', '<w:document/>');
  const result = await inspectFormat('renamed.bin', await zip.generateAsync({ type: 'nodebuffer' }));
  assert.equal(result.format.id, 'docx');
  assert.equal(result.method, 'container-inspection');
});
