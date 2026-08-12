import path from 'node:path';
import { formats } from './formats.mjs';
import { error } from './errors.mjs';

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
  if (byExtension.has(extension)) return { format: byExtension.get(extension), confidence: 0.99, method: 'extension' };
  const sample = Buffer.isBuffer(content) ? content.subarray(0, 32).toString('utf8') : String(content).slice(0, 1000);
  if (/^\s*[\[{]/.test(sample)) return { format: getFormat('json'), confidence: 0.55, method: 'content' };
  if (/^\s*<\?xml|^\s*<[A-Za-z][\s\S]*>/.test(sample)) return { format: getFormat('xml'), confidence: 0.7, method: 'content' };
  if (/^\s*#\s|^\s*[-*+]\s/.m.test(sample)) return { format: getFormat('markdown'), confidence: 0.55, method: 'content' };
  return { format: getFormat('text'), confidence: 0.2, method: 'fallback' };
}

export function extensionFor(formatId) { return getFormat(formatId).extensions[0]; }
