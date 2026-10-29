/**
 * Path safety helpers for exported static assets (shared by the SvelteKit export and the build spec).
 */

function normalizeAssetSegment(raw: string): string {
  const seg = raw.trim();
  if (!seg || seg === '.' || seg === '..') return '';
  return seg
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+/, '') // no hidden files / leading dashes
    .replace(/[.-]+$/, '');
}

/**
 * Normalizes a static asset path (relative to `static/`). Same rules as routes,
 * except case and `.` inside file names are preserved (e.g. `assets/Logo.svg`).
 */
export function normalizeAssetPath(path: string): string {
  return String(path ?? '')
    .replace(/\\/g, '/')
    .split(/[?#]/)[0]
    .split('/')
    .map(normalizeAssetSegment)
    .filter(Boolean)
    .join('/');
}

/**
 * Deterministically de-duplicates normalized paths: the first occurrence keeps
 * its path, later collisions get `-2`, `-3`, ... appended to the last segment
 * (before the file extension when `keepExtension` is set).
 */
export function dedupePaths(paths: string[], keepExtension = false): string[] {
  const used = new Set<string>();
  return paths.map((path) => {
    const key = path.toLowerCase();
    if (!used.has(key)) {
      used.add(key);
      return path;
    }
    const base = path || 'index';
    const slash = base.lastIndexOf('/');
    const dir = slash === -1 ? '' : base.slice(0, slash + 1);
    const last = base.slice(slash + 1);
    const dot = keepExtension ? last.lastIndexOf('.') : -1;
    const stem = dot > 0 ? last.slice(0, dot) : last;
    const ext = dot > 0 ? last.slice(dot) : '';
    for (let n = 2; ; n++) {
      const candidate = `${dir}${stem}-${n}${ext}`;
      if (!used.has(candidate.toLowerCase())) {
        used.add(candidate.toLowerCase());
        return candidate;
      }
    }
  });
}
