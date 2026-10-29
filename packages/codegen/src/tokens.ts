import type { DesignTokens, ProjectBlueprint } from '@app-viz/schema';
import { compileNodeCss, compileTokenCss } from '@app-viz/engine';
import { isLayoutInnerType } from '@app-viz/components';
import { getRuntimeCss } from './components.js';

/**
 * Global stylesheet of the generated app (`src/app.css`):
 *   1. a minimal document reset (export only — the canvas iframe applies the same),
 *   2. the shared site runtime (`packages/components/src/svelte/runtime.css`, verbatim),
 *   3. the project's design tokens compiled onto `.site-root`.
 *
 * Node styles are NOT here: they live in `src/lib/styles/nodes.css` ({@link generateNodesCss}).
 * The `blueprint` parameter is accepted for backwards compatibility and ignored.
 */
export function generateAppCss(tokens: DesignTokens, _blueprint?: ProjectBlueprint): string {
  return `/* ==========================================================================
   Global styles — generated. Edit design tokens in the builder, not here.
   ========================================================================== */

html,
body {
  margin: 0;
  padding: 0;
}

${getRuntimeCss().trim()}

/* --------------------------------------------------------------------------
   Project design tokens
   -------------------------------------------------------------------------- */
${compileTokenCss(tokens)}`;
}

/**
 * Compiled node stylesheet for every page and layout of the project
 * (`src/lib/styles/nodes.css`). Produced by the same `compileNodeCss` the studio canvas uses,
 * with the same breakpoints, so the export matches the canvas at every device width.
 */
export function generateNodesCss(blueprint: ProjectBlueprint): string {
  const css = compileNodeCss(
    [...blueprint.layouts.map((l) => l.rootNode), ...blueprint.pages.map((p) => p.rootNode)],
    { layoutInner: isLayoutInnerType }
  );
  return `/* Node styles compiled from the blueprint — generated, do not edit. */\n${css}\n`;
}
