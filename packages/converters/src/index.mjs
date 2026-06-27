import {
  csvToJson,
  jsonToYaml,
  jsonToCsv,
  markdownToHtml,
  htmlToMarkdown,
  yamlToJson,
  textToJson,
  textToYaml,
  textToMarkdown,
  textToHtml,
  textToCsv,
} from './text.mjs';

// Map of supported conversions: 'from->to' -> converter function
const textConverters = {
  // JSON conversions
  'json->yaml': jsonToYaml,
  'json->txt': textToJson,
  'json->csv': jsonToCsv,
  
  // YAML conversions
  'yaml->json': yamlToJson,
  'yaml->txt': textToYaml,
  
  // CSV conversions
  'csv->json': csvToJson,
  'csv->txt': textToCsv,
  'csv->md': textToMarkdown,
  
  // Markdown conversions
  'md->html': markdownToHtml,
  'md->txt': textToMarkdown,
  
  // HTML conversions
  'html->md': htmlToMarkdown,
  'html->txt': textToHtml,
  
  // Text conversions (identity or simple)
  'txt->json': textToJson,
  'txt->yaml': textToYaml,
  'txt->md': textToMarkdown,
  'txt->html': textToHtml,
  'txt->csv': textToCsv,
};

export async function convertText(input, from, to) {
  const pair = `${from}->${to}`;
  
  // Direct conversion
  if (textConverters[pair]) {
    return textConverters[pair](input);
  }
  
  // If converting to txt and no direct converter, just return as text
  if (to === 'txt') {
    return input;
  }
  
  // If from and to are the same, return as-is
  if (from === to) {
    return input;
  }
  
  throw new Error(`No text converter for ${pair}`);
}

export function listTextConverters() {
  return Object.keys(textConverters);
}
