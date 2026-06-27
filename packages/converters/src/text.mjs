export function jsonToYaml(text) {
  const data = JSON.parse(text);
  return objectToYaml(data).trimEnd() + '\n';
}
export function yamlToJson(text) {
  const result = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    result[key] = parseScalar(value);
  }
  return JSON.stringify(result, null, 2) + '\n';
}
export function csvToJson(text) {
  const rows = text.trim().split(/\r?\n/).map(parseCsvLine);
  const headers = rows.shift() || [];
  return JSON.stringify(rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))), null, 2) + '\n';
}
export function markdownToHtml(text) {
  return text.split(/\r?\n/).map((line) => {
    if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
    if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
    if (!line.trim()) return '';
    return `<p>${escapeHtml(line)}</p>`;
  }).join('\n') + '\n';
}
function objectToYaml(value, indent = 0) {
  if (Array.isArray(value)) return value.map((item) => `${' '.repeat(indent)}- ${formatYamlValue(item, indent)}`).join('\n');
  if (value && typeof value === 'object') return Object.entries(value).map(([k, v]) => `${' '.repeat(indent)}${k}: ${formatYamlValue(v, indent)}`).join('\n');
  return String(value);
}
function formatYamlValue(value, indent) { return value && typeof value === 'object' ? `\n${objectToYaml(value, indent + 2)}` : String(value); }
function parseScalar(value) { if (value === 'true') return true; if (value === 'false') return false; if (!Number.isNaN(Number(value)) && value !== '') return Number(value); return value.replace(/^['"]|['"]$/g, ''); }
function parseCsvLine(line) { return line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, '')); }
function escapeHtml(text) { return text.replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
