/** Henkanki v1 plugin SDK — one contract for built-in and external conversion adapters. */
export const PLUGIN_API_VERSION = '1.0';

export function definePlugin(manifest, handlers = {}) {
  if (!manifest?.id || !manifest?.version || !Array.isArray(manifest.operations)) throw new TypeError('A plugin manifest requires id, version and operations.');
  return Object.freeze({ manifest: Object.freeze({ apiVersion: PLUGIN_API_VERSION, ...manifest }), handlers: Object.freeze(handlers) });
}

export function validateManifest(manifest) {
  const errors = [];
  if (manifest?.apiVersion !== PLUGIN_API_VERSION) errors.push(`Plugin API ${manifest?.apiVersion || 'missing'} is incompatible with ${PLUGIN_API_VERSION}.`);
  if (!/^[a-z0-9-]+$/.test(manifest?.id || '')) errors.push('Plugin id must be lowercase kebab-case.');
  if (!Array.isArray(manifest?.operations) || !manifest.operations.length) errors.push('Plugin must declare at least one operation.');
  return { valid: errors.length === 0, errors };
}

export function createProgressReporter(emit = () => {}) {
  return (completed, total, detail = '') => emit({ completed, total, percent: total ? Math.round((completed / total) * 100) : 0, detail });
}
