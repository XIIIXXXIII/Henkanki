import {
  // JSON conversions
  jsonToYaml,
  jsonToCsv,
  jsonToToml,
  jsonToIni,
  jsonToJson5,
  jsonToHjson,
  jsonToXml,
  
  // YAML conversions
  yamlToJson,
  
  // CSV conversions
  csvToJson,
  
  // Markdown conversions
  markdownToHtml,
  
  // HTML conversions
  htmlToMarkdown,
  
  // Text conversions
  textToJson,
  textToYaml,
  textToMarkdown,
  textToHtml,
  textToCsv,
  textToToml,
  textToIni,
  textToXml,
  textToBase64,
  textToUrl,
  
  // XML conversions
  xmlToJson,
  
  // TOML conversions
  tomlToJson,
  
  // INI conversions
  iniToJson,
  
  // JSON5 conversions
  json5ToJson,
  
  // HJSON conversions
  hjsonToJson,
  
  // Base64 conversions
  base64ToText,
  base64ToJson,
  base64ToYaml,
  
  // URL conversions
  urlToText,
  urlToJson,
} from './text.mjs';

import {
  pdfToText,
  pdfToBase64,
  pdfToImage,
  imageToBase64,
  imageToText,
  imageToImage,
  binaryToHex,
  hexToBinary,
  getBinaryMimeType,
  getBinaryExtension,
} from './binary/index.mjs';

import {
  videoGetMetadata,
  videoToAudio,
  videoToImages,
  videoToVideo,
  audioGetMetadata,
  audioToAudio,
  audioToWaveform,
  docxToText,
  docxToPdf,
  xlsxToText,
  xlsxToCsv,
  pptxToText,
  pptxToPdf,
  archiveExtract,
  archiveCreate,
  archiveToArchive,
  getHeavyMimeType,
  getHeavyExtension,
  initializeWasm,
  isWasmAvailable,
} from './heavy/index.mjs';

// Initialize WASM modules (for heavy formats)
let wasmInitialized = false;
async function ensureWasm() {
  if (!wasmInitialized) {
    await initializeWasm();
    wasmInitialized = true;
  }
}

// Map of supported conversions: 'from->to' -> converter function
const textConverters = {
  // JSON conversions
  'json->yaml': jsonToYaml,
  'json->csv': jsonToCsv,
  'json->txt': textToJson,
  'json->toml': jsonToToml,
  'json->ini': jsonToIni,
  'json->json5': jsonToJson5,
  'json->hjson': jsonToHjson,
  'json->xml': jsonToXml,
  'json->base64': (text) => {
    try {
      const data = JSON.parse(text);
      return textToBase64(JSON.stringify(data));
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // YAML conversions
  'yaml->json': yamlToJson,
  'yaml->txt': textToYaml,
  'yaml->csv': (text) => {
    try {
      const json = yamlToJson(text);
      return jsonToCsv(json);
    } catch (e) {
      return textToCsv(text);
    }
  },
  'yaml->toml': (text) => {
    try {
      const json = yamlToJson(text);
      return jsonToToml(json);
    } catch (e) {
      return textToToml(text);
    }
  },
  'yaml->ini': (text) => {
    try {
      const json = yamlToJson(text);
      return jsonToIni(json);
    } catch (e) {
      return textToIni(text);
    }
  },
  'yaml->xml': (text) => {
    try {
      const json = yamlToJson(text);
      return jsonToXml(json);
    } catch (e) {
      return textToXml(text);
    }
  },
  'yaml->base64': (text) => {
    try {
      const json = yamlToJson(text);
      return textToBase64(json);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // CSV conversions
  'csv->json': csvToJson,
  'csv->yaml': (text) => {
    try {
      const json = csvToJson(text);
      return jsonToYaml(json);
    } catch (e) {
      return textToYaml(text);
    }
  },
  'csv->txt': textToCsv,
  'csv->md': textToMarkdown,
  'csv->toml': (text) => {
    try {
      const json = csvToJson(text);
      return jsonToToml(json);
    } catch (e) {
      return textToToml(text);
    }
  },
  'csv->xml': (text) => {
    try {
      const json = csvToJson(text);
      return jsonToXml(json);
    } catch (e) {
      return textToXml(text);
    }
  },
  'csv->base64': (text) => {
    try {
      const json = csvToJson(text);
      return textToBase64(json);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // Markdown conversions
  'md->html': markdownToHtml,
  'md->txt': textToMarkdown,
  'md->json': (text) => {
    try {
      const html = markdownToHtml(text);
      return textToJson(html);
    } catch (e) {
      return textToJson(text);
    }
  },
  'md->base64': (text) => {
    try {
      const html = markdownToHtml(text);
      return textToBase64(html);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // HTML conversions
  'html->md': htmlToMarkdown,
  'html->txt': textToHtml,
  'html->json': (text) => {
    try {
      const md = htmlToMarkdown(text);
      return textToJson(md);
    } catch (e) {
      return textToJson(text);
    }
  },
  'html->base64': (text) => {
    try {
      const md = htmlToMarkdown(text);
      return textToBase64(md);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // Text conversions
  'txt->json': textToJson,
  'txt->yaml': textToYaml,
  'txt->md': textToMarkdown,
  'txt->html': textToHtml,
  'txt->csv': textToCsv,
  'txt->toml': textToToml,
  'txt->ini': textToIni,
  'txt->xml': textToXml,
  'txt->base64': textToBase64,
  'txt->url': textToUrl,
  'txt->hex': (text) => binaryToHex(Buffer.from(text, 'utf8')),
  
  // XML conversions
  'xml->json': xmlToJson,
  'xml->yaml': (text) => {
    try {
      const json = xmlToJson(text);
      return jsonToYaml(json);
    } catch (e) {
      return textToYaml(text);
    }
  },
  'xml->txt': (text) => {
    try {
      const json = xmlToJson(text);
      return textToJson(json);
    } catch (e) {
      return textToJson(text);
    }
  },
  'xml->toml': (text) => {
    try {
      const json = xmlToJson(text);
      return jsonToToml(json);
    } catch (e) {
      return textToToml(text);
    }
  },
  'xml->base64': (text) => {
    try {
      const json = xmlToJson(text);
      return textToBase64(json);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // TOML conversions
  'toml->json': tomlToJson,
  'toml->yaml': (text) => {
    try {
      const json = tomlToJson(text);
      return jsonToYaml(json);
    } catch (e) {
      return textToYaml(text);
    }
  },
  'toml->txt': textToToml,
  'toml->ini': (text) => {
    try {
      const json = tomlToJson(text);
      return jsonToIni(json);
    } catch (e) {
      return textToIni(text);
    }
  },
  'toml->base64': (text) => {
    try {
      const json = tomlToJson(text);
      return textToBase64(json);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // INI conversions
  'ini->json': iniToJson,
  'ini->yaml': (text) => {
    try {
      const json = iniToJson(text);
      return jsonToYaml(json);
    } catch (e) {
      return textToYaml(text);
    }
  },
  'ini->txt': textToIni,
  'ini->toml': (text) => {
    try {
      const json = iniToJson(text);
      return jsonToToml(json);
    } catch (e) {
      return textToToml(text);
    }
  },
  'ini->base64': (text) => {
    try {
      const json = iniToJson(text);
      return textToBase64(json);
    } catch (e) {
      return textToBase64(text);
    }
  },
  
  // JSON5 conversions
  'json5->json': json5ToJson,
  'json5->yaml': (text) => {
    try {
      const json = json5ToJson(text);
      return jsonToYaml(json);
    } catch (e) {
      return textToYaml(text);
    }
  },
  
  // HJSON conversions
  'hjson->json': hjsonToJson,
  'hjson->yaml': (text) => {
    try {
      const json = hjsonToJson(text);
      return jsonToYaml(json);
    } catch (e) {
      return textToYaml(text);
    }
  },
  
  // Base64 conversions
  'base64->txt': base64ToText,
  'base64->json': base64ToJson,
  'base64->yaml': base64ToYaml,
  'base64->png': async (text) => Buffer.from(text.trim(), 'base64'),
  'base64->jpg': async (text) => Buffer.from(text.trim(), 'base64'),
  'base64->pdf': async (text) => Buffer.from(text.trim(), 'base64'),
  'base64->hex': async (text) => binaryToHex(Buffer.from(text.trim(), 'base64')),
  
  // URL conversions
  'url->txt': urlToText,
  'url->json': urlToJson,
  
  // Hex conversions
  'hex->txt': async (text) => (await hexToBinary(text)).toString('utf8'),
  'hex->base64': async (text) => (await hexToBinary(text)).toString('base64'),
};

// Binary converters (async)
const binaryConverters = {
  // PDF conversions
  'pdf->txt': pdfToText,
  'pdf->base64': pdfToBase64,
  'pdf->png': (buffer) => pdfToImage(buffer, 'png'),
  'pdf->jpg': (buffer) => pdfToImage(buffer, 'jpg'),
  
  // Image conversions
  'png->base64': imageToBase64,
  'png->txt': imageToText,
  'png->jpg': (buffer) => imageToImage(buffer, 'png', 'jpg'),
  'png->webp': (buffer) => imageToImage(buffer, 'png', 'webp'),
  
  'jpg->base64': imageToBase64,
  'jpg->txt': imageToText,
  'jpg->png': (buffer) => imageToImage(buffer, 'jpg', 'png'),
  'jpg->webp': (buffer) => imageToImage(buffer, 'jpg', 'webp'),
  
  'webp->base64': imageToBase64,
  'webp->txt': imageToText,
  'webp->png': (buffer) => imageToImage(buffer, 'webp', 'png'),
  'webp->jpg': (buffer) => imageToImage(buffer, 'webp', 'jpg'),
  
  // Hex conversions
  'hex->png': async (text) => hexToBinary(text),
  'hex->jpg': async (text) => hexToBinary(text),
  'hex->pdf': async (text) => hexToBinary(text),
};

// Heavy format converters (async)
const heavyConverters = {
  // Video conversions
  'mp4->mp3': async (buffer) => await videoToAudio(buffer, 'mp3'),
  'mp4->wav': async (buffer) => await videoToAudio(buffer, 'wav'),
  'mp4->webm': async (buffer) => await videoToVideo(buffer, 'mp4', 'webm'),
  'mp4->txt': async (buffer) => {
    const metadata = await videoGetMetadata(buffer);
    return Buffer.from(JSON.stringify(metadata, null, 2), 'utf8');
  },
  'webm->mp4': async (buffer) => await videoToVideo(buffer, 'webm', 'mp4'),
  'webm->mp3': async (buffer) => await videoToAudio(buffer, 'mp3'),
  
  // Audio conversions
  'mp3->wav': async (buffer) => await audioToAudio(buffer, 'mp3', 'wav'),
  'mp3->ogg': async (buffer) => await audioToAudio(buffer, 'mp3', 'ogg'),
  'wav->mp3': async (buffer) => await audioToAudio(buffer, 'wav', 'mp3'),
  'wav->txt': async (buffer) => {
    const metadata = await audioGetMetadata(buffer);
    return Buffer.from(JSON.stringify(metadata, null, 2), 'utf8');
  },
  
  // Document conversions
  'docx->txt': docxToText,
  'docx->pdf': docxToPdf,
  'docx->md': async (buffer) => {
    const text = await docxToText(buffer);
    return Buffer.from(text.toString('utf8'), 'utf8');
  },
  
  'xlsx->txt': xlsxToText,
  'xlsx->csv': xlsxToCsv,
  'xlsx->json': async (buffer) => {
    const csv = await xlsxToCsv(buffer);
    return Buffer.from(csv.toString('utf8'), 'utf8');
  },
  
  'pptx->txt': pptxToText,
  'pptx->pdf': pptxToPdf,
  'pptx->md': async (buffer) => {
    const text = await pptxToText(buffer);
    return Buffer.from(text.toString('utf8'), 'utf8');
  },
  
  // Archive conversions
  'zip->tar': async (buffer) => await archiveToArchive(buffer, 'zip', 'tar'),
  'zip->txt': async (buffer) => {
    const files = await archiveExtract(buffer, 'zip');
    const contents = files.map(f => `=== ${f.name} ===\n${f.data.toString('utf8')}`).join('\n\n');
    return Buffer.from(contents, 'utf8');
  },
  
  'tar->zip': async (buffer) => await archiveToArchive(buffer, 'tar', 'zip'),
  'tar->txt': async (buffer) => {
    const files = await archiveExtract(buffer, 'tar');
    const contents = files.map(f => `=== ${f.name} ===\n${f.data.toString('utf8')}`).join('\n\n');
    return Buffer.from(contents, 'utf8');
  },
};

// Add reverse conversions for symmetric formats
const symmetricConversions = [
  ['json', 'yaml'],
  ['json', 'toml'],
  ['json', 'ini'],
  ['json', 'json5'],
  ['json', 'hjson'],
  ['md', 'html'],
  ['png', 'jpg'],
  ['png', 'webp'],
  ['jpg', 'webp'],
  ['mp4', 'webm'],
  ['mp3', 'wav'],
  ['zip', 'tar'],
];

for (const [a, b] of symmetricConversions) {
  const forward = `${a}->${b}`;
  const backward = `${b}->${a}`;
  if (textConverters[forward] && !textConverters[backward]) {
    textConverters[backward] = async (text) => {
      const forwardConverter = textConverters[forward];
      const intermediate = await forwardConverter(text);
      return intermediate;
    };
  }
  if (binaryConverters[forward] && !binaryConverters[backward]) {
    binaryConverters[backward] = async (buffer) => {
      const forwardConverter = binaryConverters[forward];
      const intermediate = await forwardConverter(buffer);
      return intermediate;
    };
  }
  if (heavyConverters[forward] && !heavyConverters[backward]) {
    heavyConverters[backward] = async (buffer) => {
      const forwardConverter = heavyConverters[forward];
      const intermediate = await forwardConverter(buffer);
      return intermediate;
    };
  }
}

export async function convertText(input, from, to) {
  const pair = `${from}->${to}`;
  
  // Direct conversion
  if (textConverters[pair]) {
    const converter = textConverters[pair];
    return converter(input);
  }
  
  // If converting to txt and no direct converter, just return as text
  if (to === 'txt') {
    return input;
  }
  
  // If from and to are the same, return as-is
  if (from === to) {
    return input;
  }
  
  // Try to find a path through JSON (common intermediate format)
  if (from !== 'json' && to !== 'json') {
    try {
      const toJson = textConverters[`${from}->json`];
      const fromJson = textConverters[`json->${to}`];
      if (toJson && fromJson) {
        const json = await toJson(input);
        return await fromJson(json);
      }
    } catch (e) {
      // Ignore and try other methods
    }
  }
  
  throw new Error(`No text converter for ${pair}`);
}

export async function convertBinary(inputBuffer, from, to) {
  const pair = `${from}->${to}`;
  
  // Direct conversion
  if (binaryConverters[pair]) {
    const converter = binaryConverters[pair];
    return await converter(inputBuffer);
  }
  
  // Check heavy converters
  if (heavyConverters[pair]) {
    await ensureWasm();
    const converter = heavyConverters[pair];
    return await converter(inputBuffer);
  }
  
  // If converting to base64 and no direct converter
  if (to === 'base64') {
    return inputBuffer.toString('base64');
  }
  
  // If from and to are the same, return as-is
  if (from === to) {
    return inputBuffer;
  }
  
  // Try to convert through text
  if (from !== 'txt' && to !== 'txt') {
    try {
      const toText = binaryConverters[`${from}->txt`] || heavyConverters[`${from}->txt`];
      const fromText = textConverters[`txt->${to}`];
      if (toText && fromText) {
        const text = (await toText(inputBuffer)).toString('utf8');
        return Buffer.from(await fromText(text), 'utf8');
      }
    } catch (e) {
      // Ignore and try other methods
    }
  }
  
  throw new Error(`No binary converter for ${pair}`);
}

export async function convert(input, from, to) {
  // Determine if this is a text, binary, or heavy conversion
  const textFormats = ['json', 'yaml', 'csv', 'md', 'html', 'txt', 'xml', 'toml', 'ini', 'json5', 'hjson', 'base64', 'url', 'hex'];
  const binaryFormats = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'];
  const heavyFormats = ['mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'm4a', 'docx', 'xlsx', 'pptx', 'zip', 'tar', 'gz', '7z'];
  
  if (textFormats.includes(from) && textFormats.includes(to)) {
    return await convertText(input, from, to);
  }
  
  if (binaryFormats.includes(from) || binaryFormats.includes(to) || heavyFormats.includes(from) || heavyFormats.includes(to)) {
    // Ensure input is a buffer for binary conversions
    const inputBuffer = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
    return await convertBinary(inputBuffer, from, to);
  }
  
  // Fallback to text conversion
  return await convertText(input, from, to);
}

export function listTextConverters() {
  return Object.keys(textConverters);
}

export function listBinaryConverters() {
  return Object.keys(binaryConverters);
}

export function listHeavyConverters() {
  return Object.keys(heavyConverters);
}

export function canConvertText(from, to) {
  const pair = `${from}->${to}`;
  return pair in textConverters || from === to;
}

export function canConvertBinary(from, to) {
  const pair = `${from}->${to}`;
  return pair in binaryConverters || pair in heavyConverters || from === to;
}

export function canConvert(from, to) {
  return canConvertText(from, to) || canConvertBinary(from, to);
}

export { getBinaryMimeType, getBinaryExtension, getHeavyMimeType, getHeavyExtension, isWasmAvailable };
