/**
 * CSS output-safety rules shared by the studio canvas and the SvelteKit export.
 *
 * Every user-controlled CSS key/value that is written into a stylesheet (the canvas'
 * `<style>` element, the exported `src/lib/styles/nodes.css`, the token block in `app.css`)
 * goes through these helpers. A value that fails validation is DROPPED (never "repaired"),
 * so a malicious or malformed declaration can never break out of its rule.
 */

/** `color`, `backgroundColor`, `-webkit-line-clamp`, `--brand-color`, `WebkitTransform`. */
const CSS_KEY_RE = /^-{0,2}[a-zA-Z][a-zA-Z0-9-]*$/;

export function isSafeCssKey(key: string): boolean {
  return CSS_KEY_RE.test(key);
}

function normalizeForCheck(value: string): string {
  return value.toLowerCase().replace(/[\s'"\\]/g, '');
}

function hasBalancedQuotes(value: string): boolean {
  return (value.match(/"/g)?.length ?? 0) % 2 === 0 && (value.match(/'/g)?.length ?? 0) % 2 === 0;
}

/**
 * True when a CSS value could break out of its declaration/rule or execute script:
 * `<`, `{`, `}`, `;`, comment delimiters, unbalanced quotes, a trailing backslash,
 * `javascript:` / `vbscript:` URLs and IE `expression(`.
 */
export function isDangerousCssValue(value: string): boolean {
  if (/[<{};]/.test(value)) return true;
  if (value.includes('/*') || value.includes('*/')) return true;
  if (/\\\s*$/.test(value)) return true;
  if (!hasBalancedQuotes(value)) return true;
  const n = normalizeForCheck(value);
  return n.includes('javascript:') || n.includes('vbscript:') || n.includes('expression(');
}

/** True for a non-empty value that passes {@link isDangerousCssValue}. Used by zod refinements. */
export function isSafeCssValue(value: unknown): boolean {
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v.length > 0 && !isDangerousCssValue(v);
}

/**
 * Sanitizes a single CSS value. Finite numbers are stringified, a trailing `!important`
 * is removed (the compiler adds its own), and any unsafe value becomes `''`.
 */
export function sanitizeCssValue(value: unknown): string {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value !== 'string') return '';
  const v = value.replace(/!\s*important\s*$/i, '').trim();
  if (!v || isDangerousCssValue(v)) return '';
  return v;
}

/** camelCase style key → CSS property (`backgroundColor` → `background-color`). Custom properties are kept verbatim. */
export function cssKeyToProperty(key: string): string {
  if (key.startsWith('--')) return key;
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/** Filters a style object down to safe `[property, value]` pairs (unsafe keys/values are dropped). */
export function sanitizeCssDeclarations(css: Record<string, unknown> | undefined | null): Array<[string, string]> {
  if (!css) return [];
  const out: Array<[string, string]> = [];
  for (const [key, raw] of Object.entries(css)) {
    if (!isSafeCssKey(key)) continue;
    const value = sanitizeCssValue(raw);
    if (!value) continue;
    out.push([cssKeyToProperty(key), value]);
  }
  return out;
}

/** Safe inline declaration list (`a: b; c: d;`). Unsafe keys/values are dropped. */
export function safeStyleString(css: Record<string, unknown> | undefined | null): string {
  return sanitizeCssDeclarations(css)
    .map(([prop, value]) => `${prop}: ${value};`)
    .join(' ');
}

/** Node ids become `[data-node-id="…"]` selectors: restrict them to `[A-Za-z0-9_-]`. */
export function sanitizeNodeId(id: unknown): string {
  return String(id ?? '').replace(/[^A-Za-z0-9_-]/g, '');
}

/** Restricts class lists to `[A-Za-z0-9_\- ]` (used for `customClasses`). */
export function sanitizeClassList(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^A-Za-z0-9_\- ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
