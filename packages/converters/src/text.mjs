// Text-based converters for Henkanki

// JSON <-> YAML
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

// CSV <-> JSON
export function csvToJson(text) {
  const rows = text.trim().split(/\r?\n/).map(parseCsvLine);
  const headers = rows.shift() || [];
  return JSON.stringify(
    rows.map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))),
    null,
    2
  ) + '\n';
}

export function jsonToCsv(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) {
    // If it's an object, treat it as a single row
    const headers = Object.keys(data);
    const rows = [Object.values(data)];
    return [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n') + '\n';
  }
  // If it's an array of objects
  const headers = Object.keys(data[0] || {});
  const rows = data.map((obj) => headers.map((h) => obj[h] ?? ''));
  return [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n') + '\n';
}

// Markdown <-> HTML
export function markdownToHtml(text) {
  return text
    .split(/\r?\n/)
    .map((line) => {
      if (line.startsWith('# ')) return `<h1>${escapeHtml(line.slice(2))}</h1>`;
      if (line.startsWith('## ')) return `<h2>${escapeHtml(line.slice(3))}</h2>`;
      if (line.startsWith('### ')) return `<h3>${escapeHtml(line.slice(4))}</h3>`;
      if (line.startsWith('#### ')) return `<h4>${escapeHtml(line.slice(5))}</h4>`;
      if (line.startsWith('##### ')) return `<h5>${escapeHtml(line.slice(6))}</h5>`;
      if (line.startsWith('###### ')) return `<h6>${escapeHtml(line.slice(7))}</h6>`;
      if (line.startsWith('> ')) return `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
      if (line.startsWith('---')) return '<hr>';
      if (line.startsWith('***') || line.startsWith('---')) return '<hr>';
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('+ '))
        return `<li>${escapeHtml(line.slice(2))}</li>`;
      if (line.startsWith('```')) {
        if (line.endsWith('```')) return `<pre><code>${escapeHtml(line.slice(3, -3))}</code></pre>`;
        return `<pre><code>${escapeHtml(line.slice(3))}</code></pre>`;
      }
      if (line.startsWith('**') && line.endsWith('**'))
        return `<p><strong>${escapeHtml(line.slice(2, -2))}</strong></p>`;
      if (line.startsWith('*') && line.endsWith('*'))
        return `<p><em>${escapeHtml(line.slice(1, -1))}</em></p>`;
      if (line.trim() === '') return '';
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join('\n') + '\n';
}

export function htmlToMarkdown(text) {
  // Simple HTML to Markdown converter
  return text
    .replace(/<h1>(.*?)<\/h1>/g, '# $1')
    .replace(/<h2>(.*?)<\/h2>/g, '## $1')
    .replace(/<h3>(.*?)<\/h3>/g, '### $1')
    .replace(/<h4>(.*?)<\/h4>/g, '#### $1')
    .replace(/<h5>(.*?)<\/h5>/g, '##### $1')
    .replace(/<h6>(.*?)<\/h6>/g, '###### $1')
    .replace(/<p>(.*?)<\/p>/g, '$1')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<blockquote>(.*?)<\/blockquote>/g, '> $1')
    .replace(/<hr\s*\/>/g, '---')
    .replace(/<br\s*\/>/g, '\n')
    .replace(/<li>(.*?)<\/li>/g, '- $1')
    .replace(/<pre><code>(.*?)<\/code><\/pre>/g, '```\n$1\n```')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<a\s+href="(.*?)">(.*?)<\/a>/g, '[$2]($1)')
    .replace(/<img\s+src="(.*?)"\s*alt="(.*?)"\s*\/>/g, '![$2]($1)')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim() + '\n';
}

// TXT conversions (identity or simple formatting)
export function textToJson(text) {
  // Treat each line as a string in an array
  const lines = text.trim().split(/\r?\n/);
  return JSON.stringify(lines, null, 2) + '\n';
}

export function textToYaml(text) {
  // Treat as a multi-line string
  return `content: |\n${text.trim().split(/\r?\n/).map((line) => `  ${line}`).join('\n')}\n`;
}

export function textToMarkdown(text) {
  // Wrap in a code block
  return '```\n' + text.trim() + '\n```\n';
}

export function textToHtml(text) {
  // Wrap in <pre> tags
  return `<pre>${escapeHtml(text.trim())}</pre>\n`;
}

export function textToCsv(text) {
  // Treat each line as a CSV row with one column
  return text.trim().split(/\r?\n/).map((line) => escapeCsv(line)).join('\n') + '\n';
}

// Helper functions
function objectToYaml(value, indent = 0) {
  if (Array.isArray(value))
    return value.map((item) => `${' '.repeat(indent)}- ${formatYamlValue(item, indent)}`).join('\n');
  if (value && typeof value === 'object')
    return Object.entries(value)
      .map(([k, v]) => `${' '.repeat(indent)}${k}: ${formatYamlValue(v, indent)}`)
      .join('\n');
  return String(value);
}

function formatYamlValue(value, indent) {
  if (value && typeof value === 'object') return `\n${objectToYaml(value, indent + 2)}`;
  if (typeof value === 'string' && value.includes('\n'))
    return `\n${' '.repeat(indent + 2)}|\n${value.split('\n').map((line) => ' '.repeat(indent + 2) + line).join('\n')}`;
  if (typeof value === 'string' && (value.includes(':') || value.includes('#') || value.includes('"')))
    return `"${value}"`;
  return String(value);
}

function parseScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!Number.isNaN(Number(value)) && value !== '') return Number(value);
  return value.replace(/^['"]|['"]$/g, '');
}

function parseCsvLine(line) {
  return line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''));
}

function escapeCsv(value) {
  if (typeof value !== 'string') return String(value);
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}
