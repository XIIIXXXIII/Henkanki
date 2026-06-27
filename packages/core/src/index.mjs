import formats from '../../formats/src/formats.json' with { type: 'json' };

export const SUPPORT_LEVELS = ['official', 'supported', 'experimental', 'legacy', 'historical'];
export const EDITIONS = ['core', 'web', 'desktop', 'cli', 'mobile', 'lite', 'retro'];

export function listFormats() { return formats; }
export function findFormat(idOrExt) {
  const value = String(idOrExt).toLowerCase().replace(/^\./, '');
  return formats.find((f) => f.id === value || f.extension === value || f.mime === value);
}
export function extensionOf(path) {
  const match = String(path).toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}
export function detectFormat(fileNameOrType) {
  return findFormat(fileNameOrType) || findFormat(extensionOf(fileNameOrType));
}
export function canConvert(from, to) {
  const source = findFormat(from);
  const target = findFormat(to);
  return Boolean(source && target && source.outputs.includes(target.id));
}
export function planConversion(from, to) {
  if (canConvert(from, to)) return { possible: true, path: [findFormat(from).id, findFormat(to).id] };
  return { possible: false, path: [], reason: `No local converter registered for ${from} -> ${to}` };
}
