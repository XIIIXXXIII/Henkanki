import { getFormat } from './registry.mjs';
import { error } from './errors.mjs';

export const operationCatalog = Object.freeze([
  { id: 'structured', family: 'structured', from: ['json', 'json5', 'hjson', 'yaml', 'toml', 'ini', 'xml', 'csv', 'tsv', 'ndjson'], to: ['json', 'yaml', 'toml', 'ini', 'xml', 'csv', 'tsv', 'ndjson', 'text'], support: 'official' },
  { id: 'text-codec', family: 'text', from: ['text', 'base64', 'url', 'hex'], to: ['text', 'base64', 'url', 'hex'], support: 'official' },
  { id: 'markup', family: 'text', from: ['markdown', 'html', 'rtf'], to: ['html', 'markdown', 'text'], support: 'official' },
  { id: 'developer', family: 'developer', from: ['properties', 'env', 'plist', 'sql', 'openapi'], to: ['json', 'yaml', 'text', 'properties', 'env', 'plist'], support: 'official' },
  { id: 'image', family: 'image', from: ['png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'avif'], to: ['png', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'ico', 'avif'], support: 'supported', requires: ['ffmpeg'], engine: 'ffmpeg' },
  { id: 'pdf', family: 'document', from: ['pdf', 'png', 'jpeg'], to: ['text', 'png', 'jpeg', 'pdf'], support: 'supported', engine: 'pdftotext/pdftoppm/pdf-lib' },
  { id: 'office', family: 'document', from: ['docx', 'xlsx', 'pptx', 'odt', 'ods', 'odp'], to: ['pdf', 'text'], support: 'supported', requires: ['libreoffice'] },
  { id: 'audio', family: 'media', from: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'opus', 'aiff'], to: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'opus', 'aiff'], support: 'supported', requires: ['ffmpeg'], engine: 'ffmpeg' },
  { id: 'video', family: 'media', from: ['mp4', 'mkv', 'webm', 'mov', 'avi', '3gp', 'mpeg', 'ts'], to: ['mp3', 'wav', 'flac', 'ogg', 'm4a', 'aac', 'opus', 'aiff', 'mp4', 'mkv', 'webm', 'mov', 'avi', '3gp', 'mpeg', 'ts', 'png', 'gif'], support: 'supported', requires: ['ffmpeg'], engine: 'ffmpeg' },
  { id: 'archive', family: 'archive', from: ['zip', 'tar', 'gz', 'bz2', 'xz'], to: ['zip', 'tar', 'gz', 'bz2', 'xz', 'text'], support: 'supported', requires: ['tar'], engine: 'tar/unzip' }
]);

export function planConversion(fromId, toId, capabilities = { tools: {} }) {
  const from = getFormat(fromId);
  const to = getFormat(toId);
  if (from.id === to.id) return { status: 'available', from, to, operation: 'identity', warnings: [] };
  const operation = operationCatalog.find((candidate) => candidate.from.includes(from.id) && candidate.to.includes(to.id));
  if (!operation) return { status: 'unavailable', from, to, warnings: [`No verified conversion route from ${from.id} to ${to.id}.`] };
  const dynamicRequirements = operation.id === 'pdf'
    ? (from.id === 'pdf' && to.id === 'text' ? ['pdftotext'] : from.id === 'pdf' ? ['pdftoppm'] : [])
    : operation.requires || [];
  const missing = dynamicRequirements.filter((tool) => !capabilities.tools?.[tool]?.available);
  return {
    status: missing.length ? 'optional-dependency' : 'available',
    from, to, operation: operation.id, support: operation.support, engine: operation.engine,
    requirements: dynamicRequirements, missing,
    warnings: (operation.id === 'image' && ['jpeg', 'webp', 'avif'].includes(to.id)) || (operation.id === 'video' && ['mp3', 'aac', 'm4a', 'opus', 'ogg', 'wav', 'flac', 'aiff'].includes(to.id)) ? ['The selected output can be lossy.'] : []
  };
}

export function assertPlanned(plan) {
  if (plan.status === 'unavailable') throw error('UNSUPPORTED_ROUTE', plan.warnings[0], { from: plan.from.id, to: plan.to.id });
  if (plan.status === 'optional-dependency') throw error('MISSING_DEPENDENCY', `Missing required local tool: ${plan.missing.join(', ')}.`, { missing: plan.missing });
  return plan;
}
