import type { ColorSwatch } from '../../../ui/ColorField.svelte';

/** `on-primary-container` → `On primary container`. */
function tokenLabel(key: string): string {
  const s = key.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Global color swatches from the project's design tokens. Picking one writes the token's CSS
 * variable (so the element follows theme changes), the chip shows the concrete color.
 */
export function colorSwatches(colors: Record<string, string> | undefined): ColorSwatch[] {
  return Object.entries(colors ?? {})
    .filter(([key]) => !key.endsWith('-hover'))
    .map(([key, color]) => ({ name: tokenLabel(key), color, value: `var(--md-sys-color-${key})` }));
}
