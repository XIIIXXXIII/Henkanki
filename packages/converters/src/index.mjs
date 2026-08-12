import { discoverCapabilities, planConversion, assertPlanned } from '../../core/src/index.mjs';
import { convertText, isTextRoute } from './text.mjs';

export { convertText, parseStructured, serializeStructured } from './text.mjs';

export function getPlan(from, to, capabilities = discoverCapabilities()) {
  return planConversion(from, to, capabilities);
}

export async function convert(input, from, to, options = {}) {
  const capabilities = options.capabilities || discoverCapabilities();
  const plan = assertPlanned(planConversion(from, to, capabilities));
  if (plan.operation === 'identity') return { output: input, plan, diagnostics: [] };
  if (['structured', 'text-codec', 'markup', 'developer'].includes(plan.operation) && isTextRoute(from, to)) {
    return { output: convertText(input, from, to), plan, diagnostics: plan.warnings || [] };
  }
  const { convertBinary } = await import('./binary-adapters.mjs');
  return convertBinary(input, from, to, { ...options, plan, capabilities });
}

export function listAvailableRoutes(capabilities = discoverCapabilities()) {
  return ['json', 'yaml', 'toml', 'ini', 'xml', 'csv', 'tsv', 'ndjson', 'text', 'markdown', 'html', 'base64', 'url', 'hex']
    .flatMap((from) => ['json', 'yaml', 'toml', 'ini', 'xml', 'csv', 'tsv', 'ndjson', 'text', 'markdown', 'html', 'base64', 'url', 'hex']
      .map((to) => getPlan(from, to, capabilities)).filter((plan) => plan.status === 'available'));
}
