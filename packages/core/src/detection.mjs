/**
 * Content-first identification for Henkanki.
 * A filename is a hint only; signatures and parseable content always take precedence.
 */
import JSZip from 'jszip';

const byte = (buffer, index) => buffer[index];
const starts = (buffer, values) => values.every((value, index) => byte(buffer, index) === value);
const ascii = (buffer, start, length) => buffer.subarray(start, start + length).toString('ascii');
const text = (content, limit = 16000) => Buffer.isBuffer(content) ? content.subarray(0, limit).toString('utf8') : String(content).slice(0, limit);
const ext = (fileName = '') => String(fileName).toLowerCase().split('.').pop() || '';

function containerHint(fileName, allowed, fallback) {
  const hint = ext(fileName);
  return allowed.includes(hint) ? hint : fallback;
}

function magic(content, fileName) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (buffer.length < 4) return null;
  if (starts(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return ['png', 1, 'magic-bytes', 'PNG signature'];
  if (starts(buffer, [0xff, 0xd8, 0xff])) return ['jpeg', 1, 'magic-bytes', 'JPEG signature'];
  if (ascii(buffer, 0, 3) === 'GIF') return ['gif', 1, 'magic-bytes', 'GIF header'];
  if (ascii(buffer, 0, 2) === 'BM') return ['bmp', 1, 'magic-bytes', 'BMP header'];
  if (ascii(buffer, 0, 4) === '%PDF') return ['pdf', 1, 'magic-bytes', 'PDF header'];
  if (ascii(buffer, 0, 4) === 'PK\x03\x04' || ascii(buffer, 0, 4) === 'PK\x05\x06') return [containerHint(fileName, ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp', 'epub'], 'zip'), 0.86, 'container-signature', 'ZIP family container'];
  if (starts(buffer, [0x1f, 0x8b])) return ['gz', 1, 'magic-bytes', 'gzip signature'];
  if (ascii(buffer, 0, 3) === 'BZh') return ['bz2', 1, 'magic-bytes', 'bzip2 signature'];
  if (starts(buffer, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0x00])) return ['xz', 1, 'magic-bytes', 'xz signature'];
  if (starts(buffer, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return ['7z', 1, 'magic-bytes', '7z signature'];
  if (ascii(buffer, 0, 4) === 'OggS') return ['ogg', 1, 'magic-bytes', 'Ogg container'];
  if (ascii(buffer, 0, 4) === 'fLaC') return ['flac', 1, 'magic-bytes', 'FLAC signature'];
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 4) === 'WAVE') return ['wav', 1, 'magic-bytes', 'WAVE container'];
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 4) === 'AVI ') return ['avi', 1, 'magic-bytes', 'AVI container'];
  if (starts(buffer, [0x1a, 0x45, 0xdf, 0xa3])) return [containerHint(fileName, ['webm', 'mkv'], 'mkv'), 0.92, 'magic-bytes', 'Matroska/EBML container'];
  if (ascii(buffer, 4, 4) === 'ftyp') {
    const brand = ascii(buffer, 8, 4).toLowerCase();
    if (brand.includes('avif') || brand === 'avis') return ['avif', 0.98, 'magic-bytes', `ISO base media brand ${brand}`];
    if (brand.includes('heic') || brand.includes('heix') || brand.includes('mif1')) return [containerHint(fileName, ['heic', 'heif'], 'heic'), 0.94, 'magic-bytes', `HEIF family brand ${brand}`];
    return [containerHint(fileName, ['mp4', 'm4a', 'mov'], 'mp4'), 0.9, 'magic-bytes', `ISO base media brand ${brand}`];
  }
  if (starts(buffer, [0x49, 0x49, 0x2a, 0x00]) || starts(buffer, [0x4d, 0x4d, 0x00, 0x2a])) return ['tiff', 1, 'magic-bytes', 'TIFF header'];
  if (starts(buffer, [0x00, 0x00, 0x01, 0x00])) return ['ico', 0.98, 'magic-bytes', 'ICO header'];
  if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 4) === 'WEBP') return ['webp', 1, 'magic-bytes', 'WebP container'];
  if (ascii(buffer, 0, 3) === 'ID3' || (byte(buffer, 0) === 0xff && (byte(buffer, 1) & 0xe0) === 0xe0)) return ['mp3', 0.96, 'magic-bytes', 'MPEG audio frame'];
  if (ascii(buffer, 0, 5) === '{\\rtf') return ['rtf', 1, 'magic-bytes', 'RTF header'];
  return null;
}

function contentSignature(content) {
  const sample = text(content).replace(/^\uFEFF/, '').trimStart();
  if (!sample) return ['text', 0.3, 'empty-content', 'Empty text'];
  if (/^<svg\b/i.test(sample)) return ['svg', 0.98, 'content', 'SVG root element'];
  if (/^<!doctype\s+html|^<html[\s>]/i.test(sample)) return ['html', 0.98, 'content', 'HTML document'];
  if (/^<\?xml\b|^<[A-Za-z][\w:.-]*(?:\s[^>]*)?>/.test(sample)) return ['xml', 0.82, 'content', 'XML-like markup'];
  try { JSON.parse(sample); return ['json', 0.92, 'parse', 'Valid JSON']; } catch { /* keep testing */ }
  const lines = sample.split(/\r?\n/).filter(Boolean);
  if (lines.length > 1 && lines.every((line) => { try { JSON.parse(line); return true; } catch { return false; } })) return ['ndjson', 0.9, 'parse', 'Valid NDJSON rows'];
  if (/^\s*\[[^\]\n]+\]\s*(?:\r?\n|$)|^\s*[A-Za-z_][\w.-]*\s*=\s*.+/m.test(sample)) return ['toml', 0.7, 'content', 'TOML assignments'];
  if (/^\s*[-\w.]+\s*:\s*.+/m.test(sample)) return ['yaml', 0.62, 'content', 'YAML mapping'];
  if (lines.length > 1 && lines.every((line) => line.includes('\t'))) return ['tsv', 0.72, 'content', 'Tabular text'];
  if (lines.length > 1 && lines.every((line) => line.includes(','))) return ['csv', 0.62, 'content', 'Comma-delimited text'];
  if (/^#{1,6}\s|^\s*[-*+]\s|```/m.test(sample)) return ['markdown', 0.62, 'content', 'Markdown markers'];
  return ['text', 0.4, 'fallback', 'Readable text'];
}

/** Returns a synchronous best effort result suitable for streams and CLI preflight. */
export function detectContentFormat(fileName = '', content = Buffer.alloc(0)) {
  const found = magic(content, fileName) || contentSignature(content);
  return { formatId: found[0], confidence: found[1], method: found[2], evidence: found[3] };
}

/** Inspects ZIP containers by their internal files when an entire file is available. */
export async function inspectContentFormat(fileName = '', content = Buffer.alloc(0)) {
  const initial = detectContentFormat(fileName, content);
  if (initial.formatId !== 'zip' && initial.method !== 'container-signature') return initial;
  try {
    const zip = await JSZip.loadAsync(content);
    const names = Object.keys(zip.files);
    const has = (name) => names.includes(name);
    if (has('word/document.xml')) return { formatId: 'docx', confidence: 1, method: 'container-inspection', evidence: 'word/document.xml' };
    if (has('xl/workbook.xml')) return { formatId: 'xlsx', confidence: 1, method: 'container-inspection', evidence: 'xl/workbook.xml' };
    if (has('ppt/presentation.xml')) return { formatId: 'pptx', confidence: 1, method: 'container-inspection', evidence: 'ppt/presentation.xml' };
    if (has('content.xml')) {
      const mime = has('mimetype') ? await zip.file('mimetype').async('string') : '';
      if (mime.includes('opendocument.text')) return { formatId: 'odt', confidence: 1, method: 'container-inspection', evidence: 'OpenDocument mimetype' };
      if (mime.includes('opendocument.spreadsheet')) return { formatId: 'ods', confidence: 1, method: 'container-inspection', evidence: 'OpenDocument mimetype' };
      if (mime.includes('opendocument.presentation')) return { formatId: 'odp', confidence: 1, method: 'container-inspection', evidence: 'OpenDocument mimetype' };
    }
    if (has('mimetype') && (await zip.file('mimetype').async('string')).includes('application/epub+zip')) return { formatId: 'epub', confidence: 1, method: 'container-inspection', evidence: 'EPUB mimetype' };
  } catch { /* A valid-looking ZIP with unreadable central directory remains a ZIP. */ }
  return initial;
}
