/**
 * Canonical site components for the canvas, keyed by PascalCase name (`manifest.component`).
 *
 * These are the exact files in `packages/components/src/svelte/` that the SvelteKit export
 * copies into every generated app, so the canvas renders what the export renders.
 */
import type { Component } from 'svelte';
import { getManifest } from '@app-viz/components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteComponent = Component<any>;

const modules = import.meta.glob<{ default: SiteComponent }>('../../../../../packages/components/src/svelte/*.svelte', {
  eager: true
});

export const COMPONENT_MAP: Readonly<Record<string, SiteComponent>> = Object.freeze(
  Object.fromEntries(
    Object.entries(modules).map(([path, mod]) => [path.slice(path.lastIndexOf('/') + 1, -'.svelte'.length), mod.default])
  )
);

/** The canonical component for a registry type, or `null` when the type (or its file) is unknown. */
export function componentForType(componentType: string): SiteComponent | null {
  const name = getManifest(componentType)?.component;
  return name ? (COMPONENT_MAP[name] ?? null) : null;
}
