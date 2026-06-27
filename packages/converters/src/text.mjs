// Text-based converters for Henkanki
// Supports: JSON, YAML, CSV, Markdown, HTML, TXT, XML, TOML, INI, JSON5, HJSON, Base64, URL

// ============================================
// JSON <-> YAML
// ============================================

export function jsonToYaml(text) {
  const data = JSON.parse(text);
  return objectToYaml(data).trimEnd() + '\n';
}

export function yamlToJson(text) {
  const result = {};
  let currentObj = result;
  const stack = [{ obj: result, indent: 0 }];

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const indent = line.search(/\S/);
    const content = line.slice(indent);

    // Pop stack until we find parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].obj;

    if (content.startsWith('- ')) {
      // Array item
      const key = stack.length > 1 ? stack[stack.length - 1].key : null;
      const value = parseScalar(content.slice(2).trim());
      if (!parent[key]) parent[key] = [];
      parent[key].push(value);
    } else {
      const idx = content.indexOf(':');
      if (idx === -1) continue;

      const key = content.slice(0, idx).trim();
      const value = content.slice(idx + 1).trim();

      if (value === '' || value.startsWith('#')) {
        // Object or empty
        parent[key] = {};
        stack.push({ obj: parent[key], indent: indent + 2, key });
      } else {
        parent[key] = parseScalar(value);
      }
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

// ============================================
// JSON <-> TOML
// ============================================

export function jsonToToml(text) {
  const data = JSON.parse(text);
  return objectToToml(data);
}

export function tomlToJson(text) {
  const result = {};
  let currentObj = result;
  const stack = [{ obj: result }];

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      // Section
      const path = trimmed.slice(1, -1).split('.').map(s => s.trim());
      let target = result;
      for (const p of path) {
        if (!target[p]) target[p] = {};
        target = target[p];
      }
      stack.push({ obj: target });
    } else if (trimmed.includes('=')) {
      const [key, value] = trimmed.split('=').map(s => s.trim());
      const current = stack[stack.length - 1].obj;
      current[key] = parseTomlValue(value);
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

function parseTomlValue(value) {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Number
  if (!isNaN(Number(value))) return Number(value);
  // Date
  if (value.match(/^\d{4}-\d{2}-\d{2}/)) return new Date(value).toISOString();
  return value;
}

function objectToToml(data, prefix = '') {
  let result = '';
  for (const [key, value] of Object.entries(data)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result += `[${fullKey}]\n`;
      result += objectToToml(value, '');
    } else if (Array.isArray(value)) {
      result += `${key} = [${value.map(v => formatTomlValue(v)).join(', ')}]\n`;
    } else {
      result += `${key} = ${formatTomlValue(value)}\n`;
    }
  }
  return result + '\n';
}

function formatTomlValue(value) {
  if (typeof value === 'string') {
    // Escape special characters
    const escaped = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t');
    return `"${escaped}"`;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value === null) return '""';
  return String(value);
}

// ============================================
// JSON <-> INI
// ============================================

export function jsonToIni(text) {
  const data = JSON.parse(text);
  return objectToIni(data);
}

export function iniToJson(text) {
  const result = {};
  let currentSection = result;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const section = trimmed.slice(1, -1).trim();
      if (!result[section]) result[section] = {};
      currentSection = result[section];
    } else if (trimmed.includes('=')) {
      const [key, value] = trimmed.split('=').map(s => s.trim());
      currentSection[key] = parseIniValue(value);
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

function parseIniValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value))) return Number(value);
  return value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

function objectToIni(data, section = '') {
  let result = '';
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const newSection = section ? `${section}.${key}` : key;
      result += `[${newSection}]\n`;
      result += objectToIni(value, '');
    } else {
      result += `${key} = ${formatIniValue(value)}\n`;
    }
  }
  return result + '\n';
}

function formatIniValue(value) {
  if (typeof value === 'string') {
    if (value.includes(' ') || value.includes('=') || value.includes(';')) {
      return `"${value}"`;
    }
    return value;
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

// ============================================
// JSON <-> JSON5
// ============================================

export function jsonToJson5(text) {
  const data = JSON.parse(text);
  return JSON.stringify(data, null, 2).replace(/"([^"\\]+)":/g, '$1:') + '\n';
}

export function json5ToJson(text) {
  // Simple JSON5 to JSON converter (remove comments, unquote keys)
  const cleaned = text
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":');
  return JSON.stringify(JSON.parse(cleaned), null, 2) + '\n';
}

// ============================================
// JSON <-> HJSON
// ============================================

export function jsonToHjson(text) {
  const data = JSON.parse(text);
  return JSON.stringify(data, null, 2)
    .replace(/"([^"\\]+)":/g, '$1:')
    .replace(/"/g, '')
    .replace(/true/g, 'true')
    .replace(/false/g, 'false')
    .replace(/null/g, 'null') + '\n';
}

export function hjsonToJson(text) {
  // Simple HJSON to JSON converter
  const cleaned = text
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/([{,])\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":')
    .replace(/([,:])\s*\n/g, '$1')
    .replace(/\n\s+/g, ' ');
  return JSON.stringify(JSON.parse(cleaned), null, 2) + '\n';
}

// ============================================
// CSV <-> JSON (already exists, but improved)
// ============================================

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
    const headers = Object.keys(data);
    const rows = [Object.values(data)];
    return [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n') + '\n';
  }
  const headers = Object.keys(data[0] || {});
  const rows = data.map((obj) => headers.map((h) => obj[h] ?? ''));
  return [headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n') + '\n';
}

// ============================================
// XML <-> JSON
// ============================================

export function xmlToJson(text) {
  const parseXml = (xml) => {
    const result = {};
    const stack = [{ obj: result, tag: null }];
    let current = result;
    let i = 0;

    while (i < xml.length) {
      if (xml[i] === '<') {
        if (xml[i + 1] === '/') {
          // Closing tag
          const j = xml.indexOf('>', i);
          const tag = xml.slice(i + 2, j).trim();
          stack.pop();
          current = stack[stack.length - 1].obj;
          i = j + 1;
        } else {
          // Opening tag
          const j = xml.indexOf('>', i);
          const tagContent = xml.slice(i + 1, j);
          const spaceIdx = tagContent.indexOf(' ');
          const tag = spaceIdx === -1 ? tagContent : tagContent.slice(0, spaceIdx);
          const attrs = spaceIdx === -1 ? {} : parseXmlAttributes(tagContent.slice(spaceIdx + 1));

          const newObj = { _attrs: attrs, _content: '' };
          if (!current[tag]) {
            current[tag] = newObj;
          } else if (Array.isArray(current[tag])) {
            current[tag].push(newObj);
          } else {
            current[tag] = [current[tag], newObj];
          }

          stack.push({ obj: newObj, tag });
          current = newObj;
          i = j + 1;
        }
      } else {
        const j = xml.indexOf('<', i);
        if (j === -1) break;
        const content = xml.slice(i, j).trim();
        if (content) {
          if (current._content) {
            current._content += content;
          } else {
            current._content = content;
          }
        }
        i = j;
      }
    }
    return result;
  };

  const parseXmlAttributes = (attrStr) => {
    const attrs = {};
    const parts = attrStr.split(/\s+/);
    for (let k = 0; k < parts.length; k += 2) {
      if (k + 1 < parts.length) {
        attrs[parts[k]] = parts[k + 1].replace(/^"|"$/g, '');
      }
    }
    return attrs;
  };

  const parsed = parseXml(text);
  return JSON.stringify(parsed, null, 2) + '\n';
}

export function jsonToXml(text, rootTag = 'root') {
  const data = JSON.parse(text);
  return objectToXml(data, rootTag);
}

function objectToXml(data, tag) {
  if (typeof data === 'string') return escapeXml(data);
  if (typeof data === 'number' || typeof data === 'boolean') return String(data);
  if (data === null) return '';
  if (Array.isArray(data)) {
    return data.map(item => objectToXml(item, tag)).join('');
  }
  let result = `<${tag}`;
  if (data._attrs) {
    for (const [key, value] of Object.entries(data._attrs)) {
      result += ` ${key}="${value}"`;
    }
    delete data._attrs;
  }
  result += '>';
  if (data._content) {
    result += escapeXml(data._content);
    delete data._content;
  }
  for (const [key, value] of Object.entries(data)) {
    result += objectToXml(value, key);
  }
  result += `</${tag}>`;
  return result;
}

function escapeXml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================
// Markdown <-> HTML
// ============================================

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
      if (line.startsWith('---') || line.startsWith('***')) return '<hr>';
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
      if (line.startsWith('`') && line.endsWith('`'))
        return `<code>${escapeHtml(line.slice(1, -1))}</code>`;
      if (line.trim() === '') return '';
      return `<p>${escapeHtml(line)}</p>`;
    })
    .join('\n') + '\n';
}

export function htmlToMarkdown(text) {
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

// ============================================
// TXT conversions
// ============================================

export function textToJson(text) {
  const lines = text.trim().split(/\r?\n/);
  return JSON.stringify(lines, null, 2) + '\n';
}

export function textToYaml(text) {
  return `content: |\n${text.trim().split(/\r?\n/).map((line) => `  ${line}`).join('\n')}\n`;
}

export function textToMarkdown(text) {
  return '```\n' + text.trim() + '\n```\n';
}

export function textToHtml(text) {
  return `<pre>${escapeHtml(text.trim())}</pre>\n`;
}

export function textToCsv(text) {
  return text.trim().split(/\r?\n/).map((line) => escapeCsv(line)).join('\n') + '\n';
}

export function textToToml(text) {
  return `content = """\n${text.trim()}\n"""\n`;
}

export function textToIni(text) {
  return `[content]\nvalue = """${text.trim()}"""\n`;
}

export function textToXml(text) {
  return `<root>${escapeXml(text.trim())}</root>\n`;
}

export function textToBase64(text) {
  return Buffer.from(text.trim(), 'utf8').toString('base64') + '\n';
}

export function textToUrl(text) {
  return encodeURIComponent(text.trim()) + '\n';
}

// ============================================
// Base64 conversions
// ============================================

export function base64ToText(text) {
  return Buffer.from(text.trim(), 'base64').toString('utf8') + '\n';
}

export function base64ToJson(text) {
  const decoded = Buffer.from(text.trim(), 'base64').toString('utf8');
  try {
    const data = JSON.parse(decoded);
    return JSON.stringify(data, null, 2) + '\n';
  } catch {
    return JSON.stringify(decoded, null, 2) + '\n';
  }
}

export function base64ToYaml(text) {
  const decoded = Buffer.from(text.trim(), 'base64').toString('utf8');
  return `content: |\n${decoded.split(/\r?\n/).map((line) => `  ${line}`).join('\n')}\n`;
}

// ============================================
// URL conversions
// ============================================

export function urlToText(text) {
  return decodeURIComponent(text.trim()) + '\n';
}

export function urlToJson(text) {
  const decoded = decodeURIComponent(text.trim());
  return JSON.stringify(decoded, null, 2) + '\n';
}

// ============================================
// Helper functions
// ============================================

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
