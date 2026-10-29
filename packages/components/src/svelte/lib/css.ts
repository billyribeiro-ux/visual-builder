/**
 * Defense in depth for CSS-valued props (e.g. a Container `gap`). Props are already validated by
 * the manifest schema before they reach a component; this guard keeps a component safe even when
 * it is used directly with unvalidated input. Returns `undefined` (no declaration) when unsafe.
 */
export function safeCssValue(value: unknown): string | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : undefined;
  if (typeof value !== 'string') return undefined;
  const v = value.trim();
  if (!v || /[<{};]|\/\*|\*\/|\\\s*$/.test(v)) return undefined;
  const n = v.toLowerCase().replace(/[\s'"\\]/g, '');
  if (n.includes('javascript:') || n.includes('vbscript:') || n.includes('expression(')) return undefined;
  if ((v.match(/"/g)?.length ?? 0) % 2 || (v.match(/'/g)?.length ?? 0) % 2) return undefined;
  return v;
}
