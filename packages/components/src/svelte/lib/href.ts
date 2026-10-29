/**
 * URL policy for every link/media URL rendered by a site component (canvas and export).
 * Allowed: relative URLs (`/path`, `#hash`, `?query`, `./x`, `x/y`) and the http(s):,
 * mailto: and tel: schemes. Everything else — javascript:, data:, vbscript:, protocol-relative
 * `//host`, backslash tricks, URLs containing `< > " \` { }` — is replaced by the fallback.
 */
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/** Returns the cleaned URL, `''` for an empty input, or `fallback` when the URL is unsafe. */
export function sanitizeUrl(value: unknown, fallback = '#'): string {
  if (typeof value !== 'string') return fallback;
  // Browsers ignore ASCII control characters / whitespace while parsing a scheme.
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) return '';
  // Characters that are never valid unencoded in a URL (RFC 3986) are a sign of injection.
  if (/[<>"`{}]/.test(cleaned)) return fallback;
  if (cleaned.startsWith('#') || cleaned.startsWith('?')) return cleaned;
  if (cleaned.startsWith('/')) return /^\/[/\\]/.test(cleaned) ? fallback : cleaned;
  if (cleaned.startsWith('\\')) return fallback;
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
  if (scheme) return SAFE_SCHEMES.has(scheme[1].toLowerCase()) ? cleaned : fallback;
  // No scheme: only a pure relative path (no ':' before the first / ? #) is accepted.
  const firstDelimiter = cleaned.search(/[/?#]/);
  const head = firstDelimiter === -1 ? cleaned : cleaned.slice(0, firstDelimiter);
  return head.includes(':') ? fallback : cleaned;
}

/** Render-safe `href`: unsafe or empty URLs become `#`. */
export function safeHref(value: unknown): string {
  return sanitizeUrl(value, '#') || '#';
}

/**
 * Inline images the studio canvas resolves project assets to. Only raster/SVG image types,
 * base64 or percent-encoded, size-capped. SVG inside <img> cannot run script.
 */
const DATA_IMAGE_RE = /^data:image\/(?:png|jpeg|jpg|gif|webp|avif|svg\+xml)(?:;charset=[\w-]+)?(?:;base64)?,[A-Za-z0-9+/=%._~!$&'()*,;:@-]*$/i;
const MAX_DATA_IMAGE_LENGTH = 6_000_000;

/** Render-safe image/media `src`: unsafe, empty, mailto: and tel: URLs become `''`; inline image data URLs are kept. */
export function safeSrc(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^data:/i.test(trimmed)) {
      return trimmed.length <= MAX_DATA_IMAGE_LENGTH && DATA_IMAGE_RE.test(trimmed) ? trimmed : '';
    }
  }
  const url = sanitizeUrl(value, '');
  return /^(mailto|tel):/i.test(url) ? '' : url;
}
