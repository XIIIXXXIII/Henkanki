/**
 * Kanso Industrial: Henkanki's text engine is intentionally quiet and exact.
 * A conversion either parses and serializes valid data, or it reports an error.
 */
import YAML from 'js-yaml';
import TOML from '@iarna/toml';
import JSON5 from 'json5';
import HJSON from 'hjson';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { parse as parseCsv } from 'csv-parse/sync';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const aliases = { txt: 'text', md: 'markdown', yml: 'yaml', jpg: 'jpeg', jsonl: 'ndjson', b64: 'base64', urlenc: 'url' };
const normal = (format) => aliases[String(format).trim().toLowerCase()] || String(format).trim().toLowerCase();
const finish = (value) => `${String(value).replace(/\s+$/, '')}\n`;
const structured = new Set(['json', 'json5', 'hjson', 'yaml', 'toml', 'ini', 'xml', 'csv', 'tsv', 'ndjson', 'properties', 'env', 'plist', 'openapi']);

function parseIni(input) {
  const root = {}; let section = root;
  for (const raw of input.split(/\r?\n/)) {
    const row = raw.trim();
    if (!row || row.startsWith(';') || row.startsWith('#')) continue;
    if (/^\[.+\]$/.test(row)) {
      section = root;
      for (const name of row.slice(1, -1).split('.')) section = section[name] ||= {};
      continue;
    }
    const at = row.indexOf('='); if (at < 0) continue;
    const key = row.slice(0, at).trim(); const rawValue = row.slice(at + 1).trim();
    section[key] = /^true$/i.test(rawValue) ? true : /^false$/i.test(rawValue) ? false : /^-?\d+(\.\d+)?$/.test(rawValue) ? Number(rawValue) : rawValue.replace(/^(["'])(.*)\1$/, '$2');
  }
  return root;
}

function stringifyIni(data, prefix = '') {
  const value = data || {}; const lines = [];
  const scalarEntries = Object.entries(value).filter(([, current]) => current === null || typeof current !== 'object' || Array.isArray(current));
  if (prefix) lines.push(`[${prefix}]`);
  for (const [key, current] of scalarEntries) lines.push(`${key} = ${Array.isArray(current) ? current.join(',') : current ?? ''}`);
  for (const [key, current] of Object.entries(value).filter(([, current]) => current && typeof current === 'object' && !Array.isArray(current))) {
    if (lines.length) lines.push('');
    lines.push(stringifyIni(current, prefix ? `${prefix}.${key}` : key));
  }
  return lines.filter(Boolean).join('\n');
}

function parseAssignments(input) {
  const result = {};
  for (const raw of input.split(/\r?\n/)) {
    const row = raw.trim(); if (!row || row.startsWith('#') || row.startsWith(';')) continue;
    const at = row.indexOf('='); if (at < 0) continue;
    result[row.slice(0, at).trim()] = row.slice(at + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return result;
}

const stringifyAssignments = (data) => Object.entries(data || {}).map(([key, value]) => `${key}=${String(value ?? '')}`).join('\n');
const xmlParser = () => new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_', parseTagValue: true });
const xmlBuilder = () => new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: '@_', format: true });

function toPlainHtmlText(input) {
  return finish(sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }).replace(/\s*\n\s*/g, '\n'));
}

function toMarkdown(input) {
  const clean = sanitizeHtml(input, { allowedTags: ['h1', 'h2', 'h3', 'p', 'strong', 'em', 'code', 'pre', 'a', 'ul', 'ol', 'li', 'br'], allowedAttributes: { a: ['href'] } });
  return finish(clean
    .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*')
    .replace(/<code>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '').replace(/\n{3,}/g, '\n\n'));
}

function rtfToText(input) { return finish(input.replace(/\\par[d]?/g, '\n').replace(/\\'[0-9a-f]{2}/gi, '').replace(/\\[a-z]+-?\d* ?/gi, '').replace(/[{}]/g, '')); }

export function parseStructured(input, format) {
  const id = normal(format); const text = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
  switch (id) {
    case 'json': return JSON.parse(text);
    case 'json5': return JSON5.parse(text);
    case 'hjson': return HJSON.parse(text);
    case 'yaml': return YAML.load(text, { json: true });
    case 'toml': return TOML.parse(text);
    case 'ini': return parseIni(text);
    case 'xml': case 'plist': return xmlParser().parse(text);
    case 'csv': return parseCsv(text, { columns: true, skip_empty_lines: true, relax_column_count: false });
    case 'tsv': return parseCsv(text, { columns: true, skip_empty_lines: true, delimiter: '\t', relax_column_count: false });
    case 'ndjson': return text.split(/\r?\n/).filter(Boolean).map((row) => JSON.parse(row));
    case 'properties': case 'env': return parseAssignments(text);
    case 'openapi': return /^\s*[{[]/.test(text) ? JSON.parse(text) : YAML.load(text, { json: true });
    default: throw new Error(`No structured parser for ${format}.`);
  }
}

export function serializeStructured(data, format) {
  const id = normal(format);
  switch (id) {
    case 'json': return finish(JSON.stringify(data, null, 2));
    case 'json5': return finish(JSON5.stringify(data, null, 2));
    case 'hjson': return finish(HJSON.stringify(data, { quotes: 'strings', separator: true }));
    case 'yaml': return finish(YAML.dump(data, { noRefs: true, lineWidth: 100 }));
    case 'toml': return finish(TOML.stringify(data));
    case 'ini': return finish(stringifyIni(data));
    case 'xml': case 'plist': return finish(xmlBuilder().build(data));
    case 'csv': return finish(stringifyCsv(Array.isArray(data) ? data : [data], { header: true }));
    case 'tsv': return finish(stringifyCsv(Array.isArray(data) ? data : [data], { header: true, delimiter: '\t' }));
    case 'ndjson': return finish((Array.isArray(data) ? data : [data]).map((entry) => JSON.stringify(entry)).join('\n'));
    case 'properties': case 'env': return finish(stringifyAssignments(data));
    case 'openapi': return finish(JSON.stringify(data, null, 2));
    case 'text': return finish(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    default: throw new Error(`No structured serializer for ${format}.`);
  }
}

export function convertText(input, from, to) {
  const source = normal(from); const target = normal(to); const text = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
  if (source === target) return finish(text);
  if (structured.has(source) && structured.has(target)) return serializeStructured(parseStructured(text, source), target);
  if (structured.has(source) && target === 'text') return serializeStructured(parseStructured(text, source), 'text');
  if (source === 'markdown' && target === 'html') return finish(markdown.render(text));
  if (source === 'markdown' && target === 'text') return toPlainHtmlText(markdown.render(text));
  if (source === 'html' && target === 'markdown') return toMarkdown(text);
  if (source === 'html' && target === 'text') return toPlainHtmlText(text);
  if (source === 'rtf' && target === 'text') return rtfToText(text);
  if (source === 'text' && target === 'markdown') return finish(`\`\`\`text\n${text.replace(/\s+$/, '')}\n\`\`\``);
  if (source === 'text' && target === 'html') return finish(`<pre>${sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })}</pre>`);
  if (source === 'text' && structured.has(target)) return serializeStructured({ content: text.replace(/\s+$/, '') }, target);
  if (source === 'text' && target === 'base64') return finish(Buffer.from(text, 'utf8').toString('base64'));
  if (source === 'base64' && target === 'text') return finish(Buffer.from(text.trim(), 'base64').toString('utf8'));
  if (source === 'text' && target === 'url') return finish(encodeURIComponent(text.replace(/\s+$/, '')));
  if (source === 'url' && target === 'text') return finish(decodeURIComponent(text.trim()));
  if (source === 'text' && target === 'hex') return finish(Buffer.from(text, 'utf8').toString('hex'));
  if (source === 'hex' && target === 'text') return finish(Buffer.from(text.replace(/\s/g, ''), 'hex').toString('utf8'));
  throw new Error(`No verified text converter for ${from} -> ${to}.`);
}

export function isTextRoute(from, to) {
  const source = normal(from); const target = normal(to);
  return structured.has(source) || structured.has(target) || ['text', 'markdown', 'html', 'rtf', 'base64', 'url', 'hex'].includes(source) || ['text', 'markdown', 'html', 'base64', 'url', 'hex'].includes(target);
}
