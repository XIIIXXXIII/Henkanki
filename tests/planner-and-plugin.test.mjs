import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPlanned, planConversion } from '../packages/core/src/index.mjs';
import { definePlugin, validateManifest } from '../packages/plugin-sdk/src/index.mjs';

test('planner reports missing PDF extraction capability before converting', () => {
  const plan = planConversion('pdf', 'text', { tools: { pdftotext: { available: false } } });
  assert.equal(plan.status, 'optional-dependency'); assert.deepEqual(plan.missing, ['pdftotext']);
  assert.throws(() => assertPlanned(plan), { code: 'MISSING_DEPENDENCY' });
});

test('planner communicates lossy image output', () => {
  const plan = planConversion('png', 'webp', { tools: { ffmpeg: { available: true } } });
  assert.equal(plan.status, 'available'); assert.match(plan.warnings[0], /lossy/i);
});

test('plugin manifests require a stable API and declared operation', () => {
  const plugin = definePlugin({ id: 'local-audio', version: '1.0.0', operations: ['audio'] });
  assert.equal(validateManifest(plugin.manifest).valid, true);
  assert.equal(validateManifest({ id: 'BAD name', apiVersion: '0', operations: [] }).valid, false);
});
