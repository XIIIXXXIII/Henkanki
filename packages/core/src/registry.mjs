import path from 'node:path';
import { formats } from './formats.mjs';
import { error } from './errors.mjs';
import { detectContentFormat, inspectContentFormat } from './detection.mjs';

const aliases = { txt: 'text', md: 'markdown', mdown: 'markdown', yml: 'yaml', jpg: 'jpeg', jpeg: 'jpeg', jsonl: 'ndjson', b64: 'base64', urlenc: 'url' };
const normalize = (value) => aliases[String(value || '').trim().toLowerCase().replace(/^\./, '')] || String(value || '').trim().toLowerCase().replace(/^\./, '');
const byId = new Map(formats.map((format) => [format.id, format]));
const byExtension = new Map(formats.flatMap((format) => format.extensions.map((extension) => [normalize(extension), format])));

export function listFormats({ family, support } = {}) {
  return formats.filter((format) => (!family || format.family === family) && (!support || format.support === support));
}

export function getFormat(id) {
  const format = byId.get(normalize(id));
  if (!format) throw error('UNKNOWN_FORMAT', `Unknown format: ${id}`, { format: id });
  return format;
}

export function detectFormat(fileName, content = '') {
  const extension = normalize(path.extname(fileName));
  const detected = detectContentFormat(fileName, content);
  if (byId.has(detected.formatId) && (detected.method !== 'fallback' || !byExtension.has(extension))) return { format: getFormat(detected.formatId), confidence: detected.confidence, method: detected.method, evidence: detected.evidence };
  if (byExtension.has(extension)) return { format: byExtension.get(extension), confidence: 0.45, method: 'extension-hint', evidence: `.${extension}` };
  return { format: getFormat(detected.formatId), confidence: detected.confidence, method: detected.method, evidence: detected.evidence };
}

export async function inspectFormat(fileName, content = '') {
  const detected = await inspectContentFormat(fileName, content);
  const extension = normalize(path.extname(fileName));
  if (byId.has(detected.formatId) && (detected.method !== 'fallback' || !byExtension.has(extension))) return { format: getFormat(detected.formatId), confidence: detected.confidence, method: detected.method, evidence: detected.evidence };
  return detectFormat(fileName, content);
}

export function extensionFor(formatId) { return getFormat(formatId).extensions[0]; }
