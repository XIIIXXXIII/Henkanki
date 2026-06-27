import { csvToJson, jsonToYaml, markdownToHtml, yamlToJson } from './text.mjs';
export async function convertText(input, from, to) {
  const pair = `${from}->${to}`;
  if (pair === 'json->yaml') return jsonToYaml(input);
  if (pair === 'yaml->json') return yamlToJson(input);
  if (pair === 'csv->json') return csvToJson(input);
  if (pair === 'md->html') return markdownToHtml(input);
  if (to === 'txt') return input;
  throw new Error(`No text converter for ${pair}`);
}
