/**
 * Canonical site component sources for the SvelteKit export.
 *
 * There are NO hand-maintained template strings here: `COMPONENT_SOURCES` is generated from
 * `packages/components/src/svelte/**` (the exact files the studio canvas renders) by
 * `pnpm sync:components`.
 */
import { COMPONENT_SOURCES } from './generated/component-sources.js';

export { COMPONENT_SOURCES };

/** Key of the global site runtime stylesheet inside {@link COMPONENT_SOURCES}. */
export const RUNTIME_CSS_KEY = 'runtime.css';

/** Global site runtime CSS (tokens defaults, scoped reset, MD3 primitives, utilities, keyframes). */
export function getRuntimeCss(): string {
  const css = COMPONENT_SOURCES[RUNTIME_CSS_KEY];
  if (typeof css !== 'string') throw new Error('COMPONENT_SOURCES is missing runtime.css — run pnpm sync:components');
  return css;
}

/**
 * Component files for the generated app, keyed by their path inside `generated-app/`
 * (`src/lib/components/<relative path>`). `runtime.css` is excluded: it is inlined into
 * `src/app.css` instead.
 */
export function getComponentSources(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const key of Object.keys(COMPONENT_SOURCES).sort()) {
    if (key === RUNTIME_CSS_KEY) continue;
    files[`src/lib/components/${key}`] = COMPONENT_SOURCES[key];
  }
  return files;
}
