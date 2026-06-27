// AI-powered features for Henkanki
// Note: All AI features are optional and opt-in for privacy

import { Buffer } from 'node:buffer';

// ============================================
// Format Detection
// ============================================

/**
 * Smart format detection using content analysis
 * Falls back to extension-based detection
 */
export async function smartDetectFormat(content, filename = '') {
  // First, try extension-based detection
  if (filename) {
    const ext = filename.slice(filename.lastIndexOf('.') + 1).toLowerCase();
    const extensionMap = {
      json: 'json',
      yaml: 'yaml',
      yml: 'yaml',
      csv: 'csv',
      md: 'md',
      html: 'html',
      htm: 'html',
      txt: 'txt',
      xml: 'xml',
      toml: 'toml',
      ini: 'ini',
      pdf: 'pdf',
      png: 'png',
      jpg: 'jpg',
      jpeg: 'jpg',
      webp: 'webp',
      gif: 'gif',
      mp4: 'mp4',
      webm: 'webm',
      mov: 'mov',
      avi: 'avi',
      mp3: 'mp3',
      wav: 'wav',
      ogg: 'ogg',
      docx: 'docx',
      xlsx: 'xlsx',
      pptx: 'pptx',
      zip: 'zip',
      tar: 'tar',
      gz: 'gz',
    };
    
    if (extensionMap[ext]) {
      return { format: extensionMap[ext], confidence: 0.9, method: 'extension' };
    }
  }
  
  // Then, try magic number detection
  const magicResults = detectMagicNumbers(content);
  if (magicResults.confidence > 0.8) {
    return magicResults;
  }
  
  // Finally, try content analysis
  return await analyzeContent(content);
}

/**
 * Detect format using magic numbers
 */
function detectMagicNumbers(content) {
  if (!content || content.length < 4) {
    return { format: 'txt', confidence: 0.5, method: 'magic' };
  }
  
  // Check if content is a buffer or string
  const buffer = content instanceof Buffer ? content : Buffer.from(content, 'utf8');
  
  // Magic number signatures
  const signatures = [
    // Images
    { bytes: [0x89, 0x50, 0x4E, 0x47], format: 'png', confidence: 1.0 },
    { bytes: [0xFF, 0xD8, 0xFF], format: 'jpg', confidence: 1.0 },
    { bytes: [0x52, 0x49, 0x46, 0x46], format: 'webp', confidence: 1.0 },
    { bytes: [0x47, 0x49, 0x46, 0x38], format: 'gif', confidence: 1.0 },
    
    // PDF
    { bytes: [0x25, 0x50, 0x44, 0x46], format: 'pdf', confidence: 1.0 },
    
    // ZIP (also used by DOCX, XLSX, PPTX)
    { bytes: [0x50, 0x4B, 0x03, 0x04], format: 'zip', confidence: 0.9 },
    
    // Video
    { bytes: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], format: 'mp4', confidence: 0.9 },
    { bytes: [0x1A, 0x45, 0xDF, 0xA3], format: 'webm', confidence: 0.9 },
    
    // Audio
    { bytes: [0x49, 0x44, 0x33], format: 'mp3', confidence: 0.8 },
    { bytes: [0x52, 0x49, 0x46, 0x46], format: 'wav', confidence: 0.8 },
    { bytes: [0x4F, 0x67, 0x67, 0x53], format: 'ogg', confidence: 0.8 },
    
    // TAR
    { bytes: [0x75, 0x73, 0x74, 0x61, 0x72], format: 'tar', confidence: 0.9 },
    
    // GZIP
    { bytes: [0x1F, 0x8B], format: 'gz', confidence: 0.9 },
    
    // 7z
    { bytes: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], format: '7z', confidence: 0.9 },
  ];
  
  for (const sig of signatures) {
    let matches = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[i] !== sig.bytes[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { format: sig.format, confidence: sig.confidence, method: 'magic' };
    }
  }
  
  return { format: 'txt', confidence: 0.5, method: 'magic' };
}

/**
 * Analyze content to detect format
 */
async function analyzeContent(content) {
  if (!content || typeof content !== 'string') {
    return { format: 'txt', confidence: 0.5, method: 'content' };
  }
  
  // Check for JSON
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      JSON.parse(content);
      return { format: 'json', confidence: 0.95, method: 'content' };
    } catch (e) {
      // Not JSON
    }
  }
  
  // Check for YAML
  if (content.includes(': ') && !content.includes('{') && !content.includes('}')) {
    const lines = content.split('\n');
    const yamlLines = lines.filter(line => line.includes(': ') && !line.trim().startsWith('#'));
    if (yamlLines.length >= 2) {
      return { format: 'yaml', confidence: 0.85, method: 'content' };
    }
  }
  
  // Check for CSV
  if (content.includes(',') && !content.includes('{') && !content.includes('}')) {
    const lines = content.split('\n');
    const csvLines = lines.filter(line => line.includes(','));
    if (csvLines.length >= 2) {
      return { format: 'csv', confidence: 0.8, method: 'content' };
    }
  }
  
  // Check for Markdown
  if (content.includes('# ') || content.includes('## ') || content.includes('---')) {
    return { format: 'md', confidence: 0.75, method: 'content' };
  }
  
  // Check for HTML
  if (content.includes('<html') || content.includes('<!DOCTYPE') || content.includes('<body')) {
    return { format: 'html', confidence: 0.9, method: 'content' };
  }
  
  // Check for XML
  if (content.trim().startsWith('<?xml') || content.includes('<') && content.includes('>')) {
    return { format: 'xml', confidence: 0.8, method: 'content' };
  }
  
  // Check for TOML
  if (content.includes('=') && !content.includes('{') && !content.includes('}')) {
    const lines = content.split('\n');
    const tomlLines = lines.filter(line => line.includes('=') && !line.trim().startsWith('#'));
    if (tomlLines.length >= 2) {
      return { format: 'toml', confidence: 0.75, method: 'content' };
    }
  }
  
  // Check for INI
  if (content.includes('[') && content.includes(']') && content.includes('=')) {
    return { format: 'ini', confidence: 0.7, method: 'content' };
  }
  
  // Default to text
  return { format: 'txt', confidence: 0.6, method: 'content' };
}

// ============================================
// Conversion Suggestions
// ============================================

/**
 * Suggest common conversions based on format
 */
export function suggestConversions(format) {
  const suggestions = {
    json: ['yaml', 'toml', 'csv', 'xml'],
    yaml: ['json', 'toml', 'ini'],
    csv: ['json', 'yaml', 'xml'],
    md: ['html', 'pdf', 'txt'],
    html: ['md', 'pdf', 'txt'],
    txt: ['json', 'yaml', 'md', 'html'],
    xml: ['json', 'yaml', 'toml'],
    toml: ['json', 'yaml', 'ini'],
    ini: ['json', 'yaml', 'toml'],
    pdf: ['txt', 'png', 'jpg'],
    png: ['jpg', 'webp', 'pdf', 'base64'],
    jpg: ['png', 'webp', 'pdf', 'base64'],
    webp: ['png', 'jpg', 'pdf', 'base64'],
    mp4: ['mp3', 'wav', 'webm'],
    webm: ['mp4', 'mp3', 'wav'],
    mp3: ['wav', 'ogg', 'm4a'],
    wav: ['mp3', 'ogg', 'm4a'],
    docx: ['pdf', 'txt', 'md'],
    xlsx: ['csv', 'json', 'txt'],
    pptx: ['pdf', 'txt', 'md'],
    zip: ['tar', 'gz'],
    tar: ['zip', 'gz'],
  };
  
  return suggestions[format] || [];
}

/**
 * Suggest conversion based on content
 */
export async function suggestConversionFromContent(content, currentFormat) {
  const detected = await smartDetectFormat(content);
  
  if (detected.format !== currentFormat) {
    return {
      suggestion: `Format appears to be ${detected.format}, not ${currentFormat}`,
      confidence: detected.confidence,
      action: 'change_format'
    };
  }
  
  // Analyze content for suggestions
  if (content.length > 1000000) {
    return {
      suggestion: 'Large file detected - consider streaming conversion',
      confidence: 0.9,
      action: 'streaming_suggestion'
    };
  }
  
  if (content.includes('\u0000') || content.includes('\x00')) {
    return {
      suggestion: 'Binary content detected - ensure correct format is selected',
      confidence: 0.8,
      action: 'binary_warning'
    };
  }
  
  return null;
}

// ============================================
// Quality Assessment
// ============================================

/**
 * Assess conversion quality
 */
export function assessConversionQuality(from, to, input, output) {
  const assessments = {
    // Lossless conversions
    'json->yaml': { lossless: true, quality: 1.0, note: 'Lossless conversion' },
    'yaml->json': { lossless: true, quality: 1.0, note: 'Lossless conversion' },
    'csv->json': { lossless: true, quality: 1.0, note: 'Lossless conversion' },
    'json->csv': { lossless: false, quality: 0.9, note: 'May lose data structure' },
    'md->html': { lossless: false, quality: 0.8, note: 'May lose some formatting' },
    'html->md': { lossless: false, quality: 0.7, note: 'May lose complex HTML' },
    
    // Image conversions
    'png->jpg': { lossless: false, quality: 0.8, note: 'JPEG is lossy' },
    'jpg->png': { lossless: true, quality: 0.9, note: 'PNG is lossless' },
    'png->webp': { lossless: true, quality: 1.0, note: 'WebP can be lossless' },
    
    // Video conversions
    'mp4->webm': { lossless: false, quality: 0.9, note: 'Re-encoding may lose quality' },
    'mp4->mp3': { lossless: false, quality: 0.8, note: 'Audio extraction only' },
    
    // Audio conversions
    'mp3->wav': { lossless: false, quality: 0.9, note: 'WAV is uncompressed' },
    'wav->mp3': { lossless: false, quality: 0.8, note: 'MP3 is lossy' },
    
    // Document conversions
    'docx->pdf': { lossless: false, quality: 0.95, note: 'May lose some formatting' },
    'xlsx->csv': { lossless: false, quality: 0.9, note: 'Only first sheet' },
    'pptx->pdf': { lossless: false, quality: 0.9, note: 'May lose animations' },
  };
  
  const key = `${from}->${to}`;
  return assessments[key] || {
    lossless: false,
    quality: 0.5,
    note: 'Quality assessment not available'
  };
}

/**
 * Check if conversion is lossless
 */
export function isLosslessConversion(from, to) {
  const assessment = assessConversionQuality(from, to, '', '');
  return assessment.lossless;
}

// ============================================
// Content Analysis
// ============================================

/**
 * Analyze content structure
 */
export function analyzeContentStructure(content) {
  if (!content || typeof content !== 'string') {
    return { type: 'unknown', complexity: 0 };
  }
  
  // Check for structured data
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const data = JSON.parse(content);
      return {
        type: 'json',
        complexity: countComplexity(data),
        depth: calculateDepth(data)
      };
    } catch (e) {
      // Not JSON
    }
  }
  
  // Check for YAML
  if (content.includes(': ') && !content.includes('{')) {
    return {
      type: 'yaml',
      complexity: content.split('\n').length,
      depth: 1
    };
  }
  
  // Check for CSV
  if (content.includes(',') && !content.includes('{')) {
    const rows = content.split('\n');
    const cols = rows[0]?.split(',').length || 0;
    return {
      type: 'csv',
      complexity: rows.length * cols,
      depth: 1
    };
  }
  
  // Check for Markdown
  if (content.includes('# ') || content.includes('## ')) {
    const headings = (content.match(/^#+ /gm) || []).length;
    const links = (content.match(/\]\(/g) || []).length;
    return {
      type: 'markdown',
      complexity: headings + links,
      depth: headings
    };
  }
  
  // Check for HTML
  if (content.includes('<') && content.includes('>')) {
    const tags = (content.match(/<[^>]+>/g) || []).length;
    return {
      type: 'html',
      complexity: tags,
      depth: 1
    };
  }
  
  // Default to text
  return {
    type: 'text',
    complexity: content.length,
    depth: 0
  };
}

function countComplexity(data) {
  if (Array.isArray(data)) {
    return data.reduce((sum, item) => sum + countComplexity(item), 1);
  }
  if (typeof data === 'object' && data !== null) {
    return Object.values(data).reduce((sum, value) => sum + countComplexity(value), 1);
  }
  return 1;
}

function calculateDepth(data, depth = 1) {
  if (Array.isArray(data)) {
    if (data.length === 0) return depth;
    return Math.max(...data.map(item => calculateDepth(item, depth + 1)));
  }
  if (typeof data === 'object' && data !== null) {
    if (Object.keys(data).length === 0) return depth;
    return Math.max(...Object.values(data).map(value => calculateDepth(value, depth + 1)));
  }
  return depth;
}

// ============================================
// Privacy Features
// ============================================

/**
 * Check if content contains sensitive data (placeholder)
 * In production, this would use pattern matching
 */
export function checkForSensitiveData(content) {
  if (!content || typeof content !== 'string') {
    return { hasSensitiveData: false, warnings: [] };
  }
  
  const warnings = [];
  
  // Check for common sensitive patterns
  const patterns = [
    { pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, name: 'Credit card number' },
    { pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, name: 'Social security number' },
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, name: 'Email address' },
    { pattern: /\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*\b/g, name: 'URL' },
    { pattern: /\b(?:password|passwd|pwd)\b/i, name: 'Password keyword' },
  ];
  
  for (const { pattern, name } of patterns) {
    if (pattern.test(content)) {
      warnings.push({ type: name, severity: 'warning' });
    }
  }
  
  return {
    hasSensitiveData: warnings.length > 0,
    warnings,
    recommendation: warnings.length > 0 ? 'Review content before sharing' : 'No sensitive data detected'
  };
}

/**
 * Anonymize content (placeholder)
 */
export function anonymizeContent(content) {
  if (!content || typeof content !== 'string') {
    return content;
  }
  
  // Replace email addresses
  content = content.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Replace URLs
  content = content.replace(/\b(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*\b/g, '[URL]');
  
  // Replace credit card numbers
  content = content.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CC]');
  
  return content;
}

// ============================================
// Export all functions
// ============================================

export {
  detectMagicNumbers,
  analyzeContent,
  smartDetectFormat as detectFormat,
};
