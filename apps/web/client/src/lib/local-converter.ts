/** Utility Frame: browser-local identification and text conversion; binary routes stay explicitly native. */
import * as YAML from "js-yaml";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const aliases: Record<string, string> = { txt: "text", md: "markdown", yml: "yaml", jsonl: "ndjson", b64: "base64", jpg: "jpeg", tif: "tiff", oga: "ogg" };
const canonical = (value: string) => aliases[value.toLowerCase()] ?? value.toLowerCase();
const finish = (value: string) => `${value.replace(/\s+$/, "")}\n`;

function csvRows(input: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]; const next = input[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") index += 1; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell); if (row.some(Boolean)) rows.push(row); return rows;
}

function parseCsvInBrowser(input: string) { const [head, ...body] = csvRows(input); if (!head?.length) return []; return body.map((row) => Object.fromEntries(head.map((column, index) => [column, row[index] ?? ""]))); }
function quoteCsv(value: unknown) { const text = String(value ?? ""); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function stringifyCsvInBrowser(data: unknown) { const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [data as Record<string, unknown>]; const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))); return [headers.map(quoteCsv).join(","), ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(","))].join("\n"); }

export type BrowserFormat = "json" | "yaml" | "csv" | "markdown" | "html" | "text" | "base64" | "url" | "hex";
export type NativeFormat = "png" | "jpeg" | "webp" | "gif" | "bmp" | "tiff" | "ico" | "avif" | "pdf" | "docx" | "xlsx" | "pptx" | "odt" | "ods" | "odp" | "epub" | "mp3" | "wav" | "flac" | "ogg" | "m4a" | "aac" | "opus" | "aiff" | "mp4" | "mkv" | "webm" | "mov" | "avi" | "3gp" | "mpeg" | "ts" | "zip" | "tar" | "gz" | "bz2" | "xz" | "7z";
export type PwaFormat = BrowserFormat | NativeFormat;
export type BrowserDetection = { format: PwaFormat; confidence: number; method: "magic bytes" | "content parsing" | "extension hint" | "fallback"; evidence: string };

export const browserFormats: { id: BrowserFormat; label: string; family: string; mode: "browser" }[] = [
  { id: "json", label: "JSON", family: "Structured", mode: "browser" }, { id: "yaml", label: "YAML", family: "Structured", mode: "browser" }, { id: "csv", label: "CSV", family: "Structured", mode: "browser" },
  { id: "markdown", label: "Markdown", family: "Text", mode: "browser" }, { id: "html", label: "HTML", family: "Text", mode: "browser" }, { id: "text", label: "Plain text", family: "Text", mode: "browser" },
  { id: "base64", label: "Base64", family: "Codec", mode: "browser" }, { id: "url", label: "URL encoded", family: "Codec", mode: "browser" }, { id: "hex", label: "Hex", family: "Codec", mode: "browser" }
];
export const nativeFormats: { id: NativeFormat; label: string; family: string; mode: "native" }[] = [
  ...(["png", "jpeg", "webp", "gif", "bmp", "tiff", "ico", "avif"] as const).map((id) => ({ id, label: id.toUpperCase(), family: "Images", mode: "native" as const })),
  ...(["pdf", "docx", "xlsx", "pptx", "odt", "ods", "odp", "epub"] as const).map((id) => ({ id, label: id.toUpperCase(), family: "Documents", mode: "native" as const })),
  ...(["mp3", "wav", "flac", "ogg", "m4a", "aac", "opus", "aiff", "mp4", "mkv", "webm", "mov", "avi", "3gp", "mpeg", "ts"] as const).map((id) => ({ id, label: id.toUpperCase(), family: "Audio & video", mode: "native" as const })),
  ...(["zip", "tar", "gz", "bz2", "xz", "7z"] as const).map((id) => ({ id, label: id.toUpperCase(), family: "Archives", mode: "native" as const }))
];
export const formatOptions = [...browserFormats, ...nativeFormats];
const browserFormatSet = new Set<string>(browserFormats.map((format) => format.id));

function parseData(input: string, format: BrowserFormat) { if (format === "json") return JSON.parse(input); if (format === "yaml") return YAML.load(input, { json: true }); if (format === "csv") return parseCsvInBrowser(input); throw new Error(`No structured parser for ${format}.`); }
function renderData(data: unknown, format: BrowserFormat) { if (format === "json") return finish(JSON.stringify(data, null, 2)); if (format === "yaml") return finish(YAML.dump(data, { noRefs: true, lineWidth: 100 })); if (format === "csv") return finish(stringifyCsvInBrowser(data)); if (format === "text") return finish(typeof data === "string" ? data : JSON.stringify(data, null, 2)); throw new Error(`No structured serializer for ${format}.`); }
const starts = (bytes: Uint8Array, pattern: number[]) => pattern.every((value, index) => bytes[index] === value);
const ascii = (bytes: Uint8Array, start: number, length: number) => new TextDecoder("ascii").decode(bytes.slice(start, start + length));
const known = new Set(formatOptions.map((format) => format.id));

function textDetection(sample: string): BrowserDetection {
  const value = sample.replace(/^\uFEFF/, "").trimStart();
  if (!value) return { format: "text", confidence: 0.3, method: "fallback", evidence: "empty text" };
  if (/^<svg\b/i.test(value)) return { format: "text", confidence: 0.75, method: "content parsing", evidence: "SVG is native-only in the browser workspace" };
  if (/^<!doctype\s+html|^<html[\s>]/i.test(value)) return { format: "html", confidence: 0.98, method: "content parsing", evidence: "HTML document" };
  if (/^<\?xml\b|^<[A-Za-z][\w:.-]*(?:\s[^>]*)?>/.test(value)) return { format: "text", confidence: 0.72, method: "content parsing", evidence: "XML is available through CLI/Desktop" };
  try { JSON.parse(value); return { format: "json", confidence: 0.92, method: "content parsing", evidence: "valid JSON" }; } catch { /* continue */ }
  const lines = value.split(/\r?\n/).filter(Boolean);
  if (/^\s*[-\w.]+\s*:\s*.+/m.test(value)) return { format: "yaml", confidence: 0.62, method: "content parsing", evidence: "YAML mapping" };
  if (lines.length > 1 && lines.every((line) => line.includes(","))) return { format: "csv", confidence: 0.62, method: "content parsing", evidence: "comma-delimited rows" };
  if (/^#{1,6}\s|^\s*[-*+]\s|```/m.test(value)) return { format: "markdown", confidence: 0.62, method: "content parsing", evidence: "Markdown markers" };
  return { format: "text", confidence: 0.4, method: "fallback", evidence: "readable text" };
}

/** Detects the selected browser File from bytes first, then content, and finally an extension hint. */
export async function detectBrowserFile(file: File): Promise<BrowserDetection> {
  const bytes = new Uint8Array(await file.slice(0, 256).arrayBuffer()); const extension = canonical(file.name.split(".").pop() || "");
  const direct: [number[], PwaFormat, string][] = [
    [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "png", "PNG signature"], [[0xff, 0xd8, 0xff], "jpeg", "JPEG signature"], [[0x25, 0x50, 0x44, 0x46], "pdf", "PDF header"], [[0x1f, 0x8b], "gz", "gzip signature"], [[0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], "7z", "7z signature"], [[0x1a, 0x45, 0xdf, 0xa3], extension === "webm" ? "webm" : "mkv", "Matroska container"], [[0x49, 0x49, 0x2a, 0x00], "tiff", "TIFF header"], [[0x4d, 0x4d, 0x00, 0x2a], "tiff", "TIFF header"]
  ];
  for (const [signature, format, evidence] of direct) if (starts(bytes, signature)) return { format, confidence: 1, method: "magic bytes", evidence };
  if (ascii(bytes, 0, 3) === "GIF") return { format: "gif", confidence: 1, method: "magic bytes", evidence: "GIF header" };
  if (ascii(bytes, 0, 2) === "BM") return { format: "bmp", confidence: 1, method: "magic bytes", evidence: "BMP header" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") return { format: "wav", confidence: 1, method: "magic bytes", evidence: "WAVE container" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "AVI ") return { format: "avi", confidence: 1, method: "magic bytes", evidence: "AVI container" };
  if (ascii(bytes, 0, 4) === "OggS") return { format: "ogg", confidence: 1, method: "magic bytes", evidence: "Ogg container" };
  if (ascii(bytes, 0, 4) === "fLaC") return { format: "flac", confidence: 1, method: "magic bytes", evidence: "FLAC signature" };
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return { format: "webp", confidence: 1, method: "magic bytes", evidence: "WebP container" };
  if (ascii(bytes, 0, 4) === "PK\x03\x04") return { format: (["docx", "xlsx", "pptx", "odt", "ods", "odp", "epub"].includes(extension) ? extension : "zip") as PwaFormat, confidence: 0.9, method: "magic bytes", evidence: "ZIP family container" };
  if (ascii(bytes, 4, 4) === "ftyp") return { format: (["mp4", "m4a", "mov", "avif"].includes(extension) ? extension : "mp4") as PwaFormat, confidence: 0.9, method: "magic bytes", evidence: "ISO base media container" };
  if (file.type.startsWith("text/") || bytes.every((value) => value === 9 || value === 10 || value === 13 || value >= 32)) return textDetection(await file.slice(0, 16000).text());
  if (known.has(extension as PwaFormat)) return { format: extension as PwaFormat, confidence: 0.45, method: "extension hint", evidence: `.${extension}` };
  return { format: "text", confidence: 0.1, method: "fallback", evidence: "unknown binary or text" };
}

export function planBrowserRoute(from: string, to: string) {
  const source = canonical(from); const target = canonical(to);
  if (!browserFormatSet.has(source) || !browserFormatSet.has(target)) return { status: "native", message: "This route is detected locally, but runs through the CLI/Desktop native engine and its checked local dependencies." };
  if (["json", "yaml", "csv"].includes(source) && ["json", "yaml", "csv", "text"].includes(target)) return { status: "available", message: "Parsed and converted entirely in this browser." };
  if (["markdown", "html", "text", "base64", "url", "hex"].includes(source) || ["markdown", "html", "text", "base64", "url", "hex"].includes(target)) return { status: "available", message: "Converted entirely in this browser." };
  return { status: "unavailable", message: "No verified browser route is registered for this pair." };
}

export function convertInBrowser(input: string, rawFrom: string, rawTo: string) {
  const from = canonical(rawFrom) as BrowserFormat; const to = canonical(rawTo) as BrowserFormat;
  if (!browserFormatSet.has(from) || !browserFormatSet.has(to)) throw new Error("This binary or document route requires the local CLI/Desktop engine.");
  if (from === to) return finish(input);
  if (["json", "yaml", "csv"].includes(from) && ["json", "yaml", "csv", "text"].includes(to)) return renderData(parseData(input, from), to);
  if (from === "markdown" && to === "html") return finish(markdown.render(input));
  if (from === "markdown" && to === "text") return finish(sanitizeHtml(markdown.render(input), { allowedTags: [], allowedAttributes: {} }));
  if (from === "html" && to === "text") return finish(sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }));
  if (from === "html" && to === "markdown") return finish(sanitizeHtml(input, { allowedTags: ["h1", "h2", "h3", "p", "strong", "em", "li", "br"], allowedAttributes: {} }).replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n").replace(/<strong>(.*?)<\/strong>/gi, "**$1**").replace(/<em>(.*?)<\/em>/gi, "*$1*").replace(/<li>(.*?)<\/li>/gi, "- $1\n").replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<[^>]*>/g, ""));
  if (from === "text" && to === "markdown") return finish(`\`\`\`text\n${input.replace(/\s+$/, "")}\n\`\`\``);
  if (from === "text" && to === "html") return finish(`<pre>${sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })}</pre>`);
  if (from === "text" && to === "base64") return finish(btoa(unescape(encodeURIComponent(input))));
  if (from === "base64" && to === "text") return finish(decodeURIComponent(escape(atob(input.trim()))));
  if (from === "text" && to === "url") return finish(encodeURIComponent(input.replace(/\s+$/, "")));
  if (from === "url" && to === "text") return finish(decodeURIComponent(input.trim()));
  if (from === "text" && to === "hex") return finish(Array.from(new TextEncoder().encode(input)).map((value) => value.toString(16).padStart(2, "0")).join(""));
  if (from === "hex" && to === "text") return finish(new TextDecoder().decode(Uint8Array.from(input.replace(/\s/g, "").match(/.{1,2}/g) || [], (pair) => parseInt(pair, 16))));
  throw new Error(`No verified browser conversion from ${from} to ${to}.`);
}
