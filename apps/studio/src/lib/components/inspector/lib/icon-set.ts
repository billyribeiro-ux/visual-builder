/**
 * The site icon set shared with generated sites (`ICON_PATHS` / aliases from
 * `@app-viz/components`). Paths are drawn on a 256×256 viewBox, filled with currentColor.
 */
import { ICON_PATHS, resolveIconName } from '@app-viz/components';

const paths: Record<string, readonly string[]> = ICON_PATHS ?? {};

export const iconSetAvailable = Object.keys(paths).length > 0;
export const iconViewBox = '0 0 256 256';
export const iconNames: readonly string[] = Object.keys(paths).sort();

/** Canonical icon name for a stored value (handles legacy aliases), or null when unknown. */
export function resolveIcon(name: string | null | undefined): string | null {
  if (!name) return null;
  if (name in paths) return name;
  return resolveIconName(name);
}

export function iconPathsFor(name: string | null | undefined): readonly string[] | null {
  const resolved = resolveIcon(name);
  return resolved ? (paths[resolved] ?? null) : null;
}
