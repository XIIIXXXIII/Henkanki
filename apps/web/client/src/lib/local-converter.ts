/** Kanso Industrial: browser-local conversion primitives, never a server upload path. */
import * as YAML from "js-yaml";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const markdown = new MarkdownIt({ html: false, linkify: true, typographer: true });
const aliases: Record<string, string> = { txt: "text", md: "markdown", yml: "yaml", jsonl: "ndjson", b64: "base64" };
const canonical = (value: string) => aliases[value.toLowerCase()] ?? value.toLowerCase();
const finish = (value: string) => `${value.replace(/\s+$/, "")}\n`;

function csvRows(input: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index]; const next = input[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') index += 1; row.push(cell); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  row.push(cell); if (row.some(Boolean)) rows.push(row); return rows;
}

function parseCsvInBrowser(input: string) {
  const [head, ...body] = csvRows(input); if (!head?.length) return [];
  return body.map((row) => Object.fromEntries(head.map((column, index) => [column, row[index] ?? ""])));
}

function quoteCsv(value: unknown) { const text = String(value ?? ""); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function stringifyCsvInBrowser(data: unknown) {
  const rows = Array.isArray(data) ? data as Record<string, unknown>[] : [data as Record<string, unknown>]; const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return [headers.map(quoteCsv).join(','), ...rows.map((row) => headers.map((header) => quoteCsv(row[header])).join(','))].join('\n');
}

export type BrowserFormat = "json" | "yaml" | "csv" | "markdown" | "html" | "text" | "base64" | "url" | "hex";
export const browserFormats: { id: BrowserFormat; label: string; family: string }[] = [
  { id: "json", label: "JSON", family: "Structured" },
  { id: "yaml", label: "YAML", family: "Structured" },
  { id: "csv", label: "CSV", family: "Structured" },
  { id: "markdown", label: "Markdown", family: "Text" },
  { id: "html", label: "HTML", family: "Text" },
  { id: "text", label: "Plain text", family: "Text" },
  { id: "base64", label: "Base64", family: "Codec" },
  { id: "url", label: "URL encoded", family: "Codec" },
  { id: "hex", label: "Hex", family: "Codec" },
];

function parseData(input: string, format: BrowserFormat) {
  if (format === "json") return JSON.parse(input);
  if (format === "yaml") return YAML.load(input, { json: true });
  if (format === "csv") return parseCsvInBrowser(input);
  throw new Error(`No structured parser for ${format}.`);
}

function renderData(data: unknown, format: BrowserFormat) {
  if (format === "json") return finish(JSON.stringify(data, null, 2));
  if (format === "yaml") return finish(YAML.dump(data, { noRefs: true, lineWidth: 100 }));
  if (format === "csv") return finish(stringifyCsvInBrowser(data));
  if (format === "text") return finish(typeof data === "string" ? data : JSON.stringify(data, null, 2));
  throw new Error(`No structured serializer for ${format}.`);
}

export function detectBrowserFormat(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "text";
  return canonical(extension) as BrowserFormat;
}

export function planBrowserRoute(from: string, to: string) {
  const source = canonical(from); const target = canonical(to);
  const supported = browserFormats.some((item) => item.id === source) && browserFormats.some((item) => item.id === target);
  if (!supported) return { status: "optional dependency", message: "This route is available through the desktop or CLI engine when its local adapter is installed." };
  if (["json", "yaml", "csv"].includes(source) && ["json", "yaml", "csv", "text"].includes(target)) return { status: "available", message: "Parsed and converted entirely in this browser." };
  if (["markdown", "html", "text", "base64", "url", "hex"].includes(source) || ["markdown", "html", "text", "base64", "url", "hex"].includes(target)) return { status: "available", message: "Converted entirely in this browser." };
  return { status: "unavailable", message: "No verified browser route is registered for this pair." };
}

export function convertInBrowser(input: string, rawFrom: string, rawTo: string) {
  const from = canonical(rawFrom) as BrowserFormat; const to = canonical(rawTo) as BrowserFormat;
  if (from === to) return finish(input);
  if (["json", "yaml", "csv"].includes(from) && ["json", "yaml", "csv", "text"].includes(to)) return renderData(parseData(input, from), to);
  if (from === "markdown" && to === "html") return finish(markdown.render(input));
  if (from === "markdown" && to === "text") return finish(sanitizeHtml(markdown.render(input), { allowedTags: [], allowedAttributes: {} }));
  if (from === "html" && to === "text") return finish(sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} }));
  if (from === "html" && to === "markdown") return finish(sanitizeHtml(input, { allowedTags: ["h1", "h2", "h3", "p", "strong", "em", "li", "br"], allowedAttributes: {} })
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n").replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<strong>(.*?)<\/strong>/gi, "**$1**").replace(/<em>(.*?)<\/em>/gi, "*$1*")
    .replace(/<li>(.*?)<\/li>/gi, "- $1\n").replace(/<br\s*\/?>(\s*)/gi, "\n").replace(/<[^>]*>/g, ""));
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
