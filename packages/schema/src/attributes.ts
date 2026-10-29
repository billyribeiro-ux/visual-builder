/**
 * Element identity & custom attributes ("CSS ID" and "Attributes" in the Advanced tab).
 *
 * Both the studio canvas and the SvelteKit export render these on the component root, so the
 * same validation runs everywhere. Invalid input is DROPPED, never repaired.
 */

/** HTML id usable as an in-page anchor (`#pricing`) and CSS selector without escaping. */
export const HTML_ID_RE = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export function isValidHtmlId(value: unknown): value is string {
  return typeof value === 'string' && HTML_ID_RE.test(value);
}

/**
 * Attribute names users may add. Event handlers (`on*`), `style`, `class`, `id`, URL-bearing
 * attributes (`href`, `src`, `action`, `formaction`, `srcset`, `xlink:href`) are never allowed —
 * those are owned by the component and its props.
 */
const ATTRIBUTE_KEY_RE = /^(?:data-[a-z0-9][a-z0-9-]{0,47}|aria-[a-z]{2,24}|role|title|lang|dir|tabindex|translate|spellcheck)$/;
const MAX_ATTRIBUTES = 24;
const MAX_VALUE_LENGTH = 500;

export function isSafeAttributeName(name: string): boolean {
  return ATTRIBUTE_KEY_RE.test(name);
}

/** Returns only the allowed, well-formed attributes (control characters stripped, length-capped). */
export function sanitizeNodeAttributes(input: unknown): Record<string, string> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out: Record<string, string> = {};
  let count = 0;
  for (const [rawKey, rawValue] of Object.entries(input as Record<string, unknown>)) {
    if (count >= MAX_ATTRIBUTES) break;
    const key = rawKey.trim().toLowerCase();
    if (!isSafeAttributeName(key)) continue;
    if (typeof rawValue !== 'string' && typeof rawValue !== 'number' && typeof rawValue !== 'boolean') continue;
    // eslint-disable-next-line no-control-regex
    const value = String(rawValue).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, MAX_VALUE_LENGTH);
    if (key === 'tabindex' && !/^-?(?:0|1)$/.test(value)) continue;
    if (key === 'dir' && !['ltr', 'rtl', 'auto'].includes(value)) continue;
    out[key] = value;
    count += 1;
  }
  return out;
}
