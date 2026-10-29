/**
 * Web-font loading for site typography, shared by the studio canvas (preview route
 * `<svelte:head>`) and the SvelteKit export (`src/app.html`) so both load the exact same font
 * files and weights. Only families on a known Google Fonts allowlist are requested; any other
 * family renders with its declared fallback stack (no request is invented for it).
 */

/** Families known to be served by Google Fonts with the weights requested below. */
const GOOGLE_FONT_FAMILIES: ReadonlySet<string> = new Set([
  'DM Sans',
  'Figtree',
  'Fira Code',
  'Geist',
  'Geist Mono',
  'IBM Plex Mono',
  'IBM Plex Sans',
  'Inter',
  'Inter Tight',
  'JetBrains Mono',
  'Lato',
  'Manrope',
  'Montserrat',
  'Nunito',
  'Open Sans',
  'Outfit',
  'Plus Jakarta Sans',
  'Poppins',
  'Raleway',
  'Roboto',
  'Roboto Mono',
  'Sora',
  'Source Sans 3',
  'Space Grotesk',
  'Work Sans'
]);

/** Weights the site components use (text 400–800, code 400–600). */
const TEXT_WEIGHTS = '400;500;600;700;800';
const MONO_WEIGHTS = '400;500;600';

/**
 * Families requested as one variable font instead of static weights. Inter (the default theme
 * font) also gets its optical-size axis, so large headings use the tighter display cut while body
 * text keeps the text cut (`font-optical-sizing: auto`), and intermediate weights such as 550/650
 * render exactly.
 */
const VARIABLE_AXES: Readonly<Record<string, string>> = {
  Inter: 'opsz,wght@14..32,400..800'
};

/** First family of a CSS font-family stack, unquoted (`"Roboto Mono", monospace` → `Roboto Mono`). */
export function primaryFontFamily(stack: string | undefined | null): string | null {
  const first = String(stack ?? '').split(',')[0]?.trim().replace(/^["']|["']$/g, '').trim();
  return first ? first : null;
}

/**
 * Google Fonts stylesheet URL for the token fonts, or `null` when none of them is a known
 * Google Fonts family. Deterministic (families sorted).
 */
export function googleFontsHref(fonts: { heading?: string; body?: string; mono?: string } | undefined): string | null {
  const families = new Map<string, string>();
  for (const key of ['heading', 'body'] as const) {
    const family = primaryFontFamily(fonts?.[key]);
    if (family && GOOGLE_FONT_FAMILIES.has(family)) families.set(family, TEXT_WEIGHTS);
  }
  const mono = primaryFontFamily(fonts?.mono);
  if (mono && GOOGLE_FONT_FAMILIES.has(mono) && !families.has(mono)) families.set(mono, MONO_WEIGHTS);
  if (families.size === 0) return null;
  const params = [...families.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([family, weights]) => `family=${family.replace(/ /g, '+')}:${VARIABLE_AXES[family] ?? `wght@${weights}`}`);
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}
