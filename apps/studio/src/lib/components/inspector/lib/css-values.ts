/**
 * Pure CSS value helpers for the inspector: tokenizing, parsing and serializing the compound
 * values the style controls edit (box sides, shadows, gradients, transforms, filters,
 * transitions, background layers). No Svelte, no editor state — everything here is unit-testable.
 */
import { isDangerousCssValue, BREAKPOINT_MEDIA } from '@app-viz/engine';
import type { BreakpointKey } from '@app-viz/schema';

/* ------------------------------------------------------------------------------------------ */
/* Tokenizing                                                                                 */
/* ------------------------------------------------------------------------------------------ */

/** Splits on a separator that is not nested inside parentheses or quotes. */
function splitTopLevel(value: string, isSep: (ch: string) => boolean): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const ch of value) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (depth === 0 && isSep(ch)) {
      if (current.trim()) out.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

export const splitSpaces = (value: string): string[] => splitTopLevel(value, (ch) => /\s/.test(ch));
export const splitCommas = (value: string): string[] => splitTopLevel(value, (ch) => ch === ',');

const NUM_RE = /^(-?\d*\.?\d+)([a-z%]*)$/i;

export interface ParsedLength {
  num: number;
  unit: string;
}

/** `24px` → {24,'px'}, `1.5` → {1.5,''}, `auto`/`calc()` → null. */
export function parseLength(value: string | undefined | null): ParsedLength | null {
  const m = NUM_RE.exec(String(value ?? '').trim());
  return m ? { num: Number(m[1]), unit: m[2].toLowerCase() } : null;
}

export function round(n: number, places = 2): number {
  const f = 10 ** places;
  return Math.round(n * f) / f;
}

/** Compact display of a length: `24px` → `24`, `1.5rem` → `1.5rem`, keywords verbatim. */
export function compactLength(value: string): string {
  const p = parseLength(value);
  if (!p) return value;
  return p.unit === 'px' || p.unit === '' ? String(round(p.num, 3)) : `${round(p.num, 3)}${p.unit}`;
}

/**
 * Normalizes typed text into a CSS length: bare numbers get `defaultUnit`, keywords and CSS
 * functions pass through. Returns '' for empty input.
 */
export function normalizeLength(text: string, defaultUnit = 'px'): string {
  const t = text.trim();
  if (!t) return '';
  const p = parseLength(t);
  if (!p) return t;
  return `${round(p.num, 3)}${p.unit || (p.num === 0 ? '' : defaultUnit)}`;
}

/* ------------------------------------------------------------------------------------------ */
/* Validation                                                                                 */
/* ------------------------------------------------------------------------------------------ */

/**
 * Mirrors the engine's stylesheet sanitizer (which silently DROPS unsafe values) so the
 * inspector can refuse them up front with a visible message instead.
 */
export function cssValueError(value: string): string | null {
  const v = value.trim();
  if (!v || !isDangerousCssValue(v)) return null;
  if (/[;{}<]/.test(v)) return 'remove the ; { } < characters — they are not allowed in a style value';
  if (v.includes('/*') || v.includes('*/')) return 'comments are not allowed in a style value';
  if (/\\\s*$/.test(v)) return 'a value cannot end with a backslash';
  if ((v.match(/"/g)?.length ?? 0) % 2 || (v.match(/'/g)?.length ?? 0) % 2) return 'quotes are unbalanced';
  return 'script URLs and expressions are not allowed';
}

const CUSTOM_CSS_BLOCKED = ['javascript:', 'vbscript:', 'expression(', '@import', '-moz-binding', 'behavior:'];

/** Same acceptance rules the engine applies before emitting a node's scoped custom CSS. */
export function customCssError(css: string): string | null {
  const t = css.trim();
  if (!t) return null;
  if (t.includes('<')) return 'The < character is not allowed in custom CSS.';
  const normalized = t.toLowerCase().replace(/[\s'"\\]/g, '');
  const blocked = CUSTOM_CSS_BLOCKED.find((token) => normalized.includes(token.replace(/\s/g, '')));
  if (blocked) return `“${blocked}” is not allowed in custom CSS.`;
  const opens = t.split('/*').length - 1;
  const closes = t.split('*/').length - 1;
  if (opens !== closes) return 'A comment is not closed.';
  const noComments = t.replace(/\/\*[\s\S]*?\*\//g, '');
  let depth = 0;
  for (const ch of noComments) {
    if (ch === '{') depth += 1;
    else if (ch === '}' && --depth < 0) return 'There is a closing brace without a matching opening brace.';
  }
  if (depth !== 0) return 'A rule is missing its closing brace.';
  if ((noComments.match(/"/g)?.length ?? 0) % 2 || (noComments.match(/'/g)?.length ?? 0) % 2) {
    return 'Quotes are unbalanced.';
  }
  return null;
}

/** `backgroundColor` → `Background color`. */
export function humanizeCssKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/* ------------------------------------------------------------------------------------------ */
/* Breakpoints                                                                                */
/* ------------------------------------------------------------------------------------------ */

/** `(max-width: 1023px)` → `≤1023px`; derived from the engine so labels never drift. */
export function breakpointRange(bp: BreakpointKey): string {
  const query = BREAKPOINT_MEDIA[bp] ?? '';
  const m = /\((min|max)-width:\s*([\d.]+px)\)/.exec(query);
  if (!m) return '';
  return `${m[1] === 'max' ? '≤' : '≥'}${m[2]}`;
}

export const BREAKPOINT_NAMES: Record<BreakpointKey, string> = {
  mobile: 'Mobile',
  tablet: 'Tablet',
  desktop: 'Desktop',
  wide: 'Wide'
};

/* ------------------------------------------------------------------------------------------ */
/* Box sides (margin / padding / inset / radius shorthands)                                   */
/* ------------------------------------------------------------------------------------------ */

export type Sides = [string, string, string, string];

/** Expands a 1–4 value shorthand into [top, right, bottom, left]. */
export function expandSides(value: string | undefined | null): Sides | null {
  const parts = splitSpaces(String(value ?? '').trim());
  if (parts.length === 0 || parts.length > 4) return null;
  const [a, b = a, c = a, d = b] = parts;
  return [a, b, c, d];
}

/* ------------------------------------------------------------------------------------------ */
/* Box shadow                                                                                 */
/* ------------------------------------------------------------------------------------------ */

export interface ShadowLayer {
  inset: boolean;
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
}

const LENGTH_TOKEN = /^-?(\d*\.?\d+)([a-z%]*)$/i;

export function parseShadow(value: string | undefined | null): ShadowLayer[] | null {
  const v = String(value ?? '').trim();
  if (!v || v === 'none') return [];
  const layers: ShadowLayer[] = [];
  for (const layer of splitCommas(v)) {
    const tokens = splitSpaces(layer);
    let inset = false;
    const lengths: string[] = [];
    const colorParts: string[] = [];
    for (const tok of tokens) {
      if (tok.toLowerCase() === 'inset') inset = true;
      else if (LENGTH_TOKEN.test(tok) && lengths.length < 4) lengths.push(tok);
      else colorParts.push(tok);
    }
    if (lengths.length < 2) return null;
    layers.push({
      inset,
      x: lengths[0],
      y: lengths[1],
      blur: lengths[2] ?? '0',
      spread: lengths[3] ?? '0',
      color: colorParts.join(' ') || 'rgba(16, 24, 40, 0.12)'
    });
  }
  return layers;
}

export function serializeShadow(layer: ShadowLayer): string {
  const len = (v: string) => normalizeLength(v || '0') || '0';
  return `${layer.inset ? 'inset ' : ''}${len(layer.x)} ${len(layer.y)} ${len(layer.blur)} ${len(layer.spread)} ${layer.color.trim() || 'rgba(16, 24, 40, 0.12)'}`;
}

/* ------------------------------------------------------------------------------------------ */
/* Gradients                                                                                  */
/* ------------------------------------------------------------------------------------------ */

export interface GradientStop {
  color: string;
  /** 0–100 */
  pos: number;
}

export interface Gradient {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

const SIDE_ANGLES: Record<string, number> = {
  'to top': 0,
  'to top right': 45,
  'to right top': 45,
  'to right': 90,
  'to bottom right': 135,
  'to right bottom': 135,
  'to bottom': 180,
  'to bottom left': 225,
  'to left bottom': 225,
  'to left': 270,
  'to top left': 315,
  'to left top': 315
};

/** Parses the first `linear-gradient()` / `radial-gradient()` in a value (null when absent). */
export function parseGradient(value: string | undefined | null): Gradient | null {
  const first = findGradientLayer(String(value ?? '').trim());
  const m = /^(repeating-)?(linear|radial)-gradient\(([\s\S]*)\)$/i.exec(first);
  if (!m) return null;
  const type = m[2].toLowerCase() as Gradient['type'];
  const args = splitCommas(m[3]);
  let angle = 180;
  if (args.length && type === 'linear') {
    const a = args[0].trim().toLowerCase();
    const deg = /^(-?[\d.]+)deg$/.exec(a);
    if (deg) {
      angle = Number(deg[1]);
      args.shift();
    } else if (a in SIDE_ANGLES) {
      angle = SIDE_ANGLES[a];
      args.shift();
    }
  } else if (args.length && type === 'radial' && !looksLikeColorStop(args[0])) {
    args.shift();
  }
  const raw = args.map((arg) => {
    const parts = splitSpaces(arg);
    const last = parts[parts.length - 1] ?? '';
    const pct = /^(-?[\d.]+)%$/.exec(last);
    return pct && parts.length > 1
      ? { color: parts.slice(0, -1).join(' '), pos: Number(pct[1]) as number | null }
      : { color: arg, pos: null as number | null };
  });
  if (raw.length < 2) return null;
  const stops = raw.map((s, i) => ({
    color: s.color,
    pos: s.pos ?? round((i / (raw.length - 1)) * 100, 1)
  }));
  return { type, angle: ((angle % 360) + 360) % 360, stops };
}

const RADIAL_SHAPE_WORDS = ['circle', 'ellipse', 'closest-side', 'closest-corner', 'farthest-side', 'farthest-corner', 'at'];

function looksLikeColorStop(arg: string): boolean {
  const head = splitSpaces(arg)[0]?.toLowerCase() ?? '';
  if (/^(#|rgb|hsl|oklch|oklab|lab|lch|color\(|var\()/.test(head)) return true;
  return /^[a-z]+$/.test(head) && !RADIAL_SHAPE_WORDS.includes(head);
}

/** Background layers are comma separated at the top level; returns the first gradient layer. */
function findGradientLayer(value: string): string {
  return splitCommas(value).find((layer) => /gradient\(/i.test(layer)) ?? value;
}

export function serializeGradient(g: Gradient): string {
  const stops = [...g.stops]
    .sort((a, b) => a.pos - b.pos)
    .map((s) => `${s.color.trim()} ${round(s.pos, 1)}%`)
    .join(', ');
  return g.type === 'radial'
    ? `radial-gradient(circle at center, ${stops})`
    : `linear-gradient(${Math.round(g.angle)}deg, ${stops})`;
}

/* ------------------------------------------------------------------------------------------ */
/* Background layers                                                                          */
/* ------------------------------------------------------------------------------------------ */

export interface BackgroundImageInfo {
  kind: 'none' | 'gradient' | 'image';
  url: string;
  overlay: string;
}

/** Classifies `background-image`: a gradient, an image (optionally under a flat overlay), or none. */
export function parseBackgroundImage(value: string | undefined | null): BackgroundImageInfo {
  const v = String(value ?? '').trim();
  if (!v || v === 'none') return { kind: 'none', url: '', overlay: '' };
  const layers = splitCommas(v);
  const urlLayer = layers.find((l) => /^url\(/i.test(l));
  if (urlLayer) {
    const m = /^url\(\s*(['"]?)([\s\S]*?)\1\s*\)$/i.exec(urlLayer);
    let overlay = '';
    const first = layers[0];
    if (first !== urlLayer) {
      const g = parseGradient(first);
      if (g && g.stops.length === 2 && g.stops[0].color === g.stops[1].color) overlay = g.stops[0].color;
    }
    return { kind: 'image', url: m ? m[2] : '', overlay };
  }
  if (layers.some((l) => /gradient\(/i.test(l))) return { kind: 'gradient', url: '', overlay: '' };
  return { kind: 'none', url: '', overlay: '' };
}

export function serializeBackgroundImage(url: string, overlay: string): string {
  const u = url.trim();
  if (!u) return '';
  const img = `url("${u.replace(/"/g, '%22')}")`;
  const o = overlay.trim();
  return o ? `linear-gradient(${o}, ${o}), ${img}` : img;
}

/**
 * CSS backgrounds can only reference URLs without `;` (the stylesheet sanitizer drops any value
 * containing one). UTF-8 SVG data URLs are rewritten without their optional `;utf8` parameter;
 * base64 data URLs cannot be expressed and return an error.
 */
export function cssSafeImageUrl(url: string): { url: string; error?: string } {
  const u = url.trim();
  if (!/^data:/i.test(u)) return { url: u };
  const svg = /^data:image\/svg\+xml(;charset=utf-?8|;utf-?8)?,/i.exec(u);
  if (svg) return { url: `data:image/svg+xml,${u.slice(svg[0].length)}` };
  return {
    url: '',
    error: 'Embedded (base64) images cannot be used as a CSS background. Use a hosted image URL instead.'
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Function lists: transform / filter                                                         */
/* ------------------------------------------------------------------------------------------ */

export interface CssFunction {
  name: string;
  args: string;
}

export function parseFunctions(value: string | undefined | null): CssFunction[] {
  const v = String(value ?? '').trim();
  if (!v || v === 'none') return [];
  return splitSpaces(v)
    .map((tok) => /^([a-z-]+[a-z0-9]*)\(([\s\S]*)\)$/i.exec(tok))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ name: m[1], args: m[2].trim() }));
}

export function serializeFunctions(fns: CssFunction[]): string {
  return fns.map((f) => `${f.name}(${f.args})`).join(' ');
}

export interface TransformParts {
  translateX: string;
  translateY: string;
  rotate: string;
  scale: string;
  /** Unrecognized functions (skew, perspective…) preserved verbatim. */
  rest: CssFunction[];
}

export function parseTransform(value: string | undefined | null): TransformParts {
  const parts: TransformParts = { translateX: '', translateY: '', rotate: '', scale: '', rest: [] };
  for (const fn of parseFunctions(value)) {
    const args = splitCommas(fn.args);
    switch (fn.name) {
      case 'translate':
        parts.translateX = args[0] ?? '';
        parts.translateY = args[1] ?? '';
        break;
      case 'translateX':
        parts.translateX = args[0] ?? '';
        break;
      case 'translateY':
        parts.translateY = args[0] ?? '';
        break;
      case 'rotate':
        parts.rotate = args[0] ?? '';
        break;
      case 'scale':
        parts.scale = args.length === 1 || args[0] === args[1] ? (args[0] ?? '') : fn.args;
        break;
      default:
        parts.rest.push(fn);
    }
  }
  return parts;
}

export function serializeTransform(p: TransformParts): string {
  const fns: CssFunction[] = [];
  if (p.translateX || p.translateY) fns.push({ name: 'translate', args: `${p.translateX || '0'}, ${p.translateY || '0'}` });
  if (p.rotate) fns.push({ name: 'rotate', args: p.rotate });
  if (p.scale) fns.push({ name: 'scale', args: p.scale });
  return serializeFunctions([...fns, ...p.rest]);
}

export const FILTER_FUNCTIONS = ['blur', 'brightness', 'contrast', 'grayscale', 'saturate'] as const;
export type FilterName = (typeof FILTER_FUNCTIONS)[number];

export function parseFilter(value: string | undefined | null): { values: Partial<Record<FilterName, string>>; rest: CssFunction[] } {
  const values: Partial<Record<FilterName, string>> = {};
  const rest: CssFunction[] = [];
  for (const fn of parseFunctions(value)) {
    if ((FILTER_FUNCTIONS as readonly string[]).includes(fn.name)) values[fn.name as FilterName] = fn.args;
    else rest.push(fn);
  }
  return { values, rest };
}

export function serializeFilter(values: Partial<Record<FilterName, string>>, rest: CssFunction[]): string {
  const fns: CssFunction[] = [];
  for (const name of FILTER_FUNCTIONS) {
    const v = values[name]?.trim();
    if (v) fns.push({ name, args: v });
  }
  return serializeFunctions([...fns, ...rest]);
}

/* ------------------------------------------------------------------------------------------ */
/* Transition                                                                                 */
/* ------------------------------------------------------------------------------------------ */

export interface TransitionParts {
  property: string;
  duration: string;
  easing: string;
}

export function parseTransition(value: string | undefined | null): TransitionParts | null {
  const v = String(value ?? '').trim();
  if (!v || v === 'none') return null;
  const first = splitCommas(v)[0] ?? '';
  const tokens = splitSpaces(first);
  const parts: TransitionParts = { property: 'all', duration: '', easing: 'ease' };
  for (const tok of tokens) {
    if (/^[\d.]+m?s$/i.test(tok)) {
      if (!parts.duration) parts.duration = tok;
    } else if (/^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)$/i.test(tok) || /^(cubic-bezier|steps)\(/i.test(tok)) {
      parts.easing = tok;
    } else {
      parts.property = tok;
    }
  }
  return parts.duration ? parts : null;
}

export function serializeTransition(p: TransitionParts): string {
  return `${p.property || 'all'} ${p.duration} ${p.easing || 'ease'}`;
}

/* ------------------------------------------------------------------------------------------ */
/* Border shorthand                                                                           */
/* ------------------------------------------------------------------------------------------ */

const BORDER_STYLES = new Set(['none', 'hidden', 'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset']);

/** `1px solid #E4E7EC` → { width, style, color } (missing parts are ''). */
export function parseBorder(value: string | undefined | null): { width: string; style: string; color: string } {
  const out = { width: '', style: '', color: '' };
  const colorParts: string[] = [];
  for (const tok of splitSpaces(String(value ?? '').trim())) {
    const t = tok.toLowerCase();
    if (!out.width && (LENGTH_TOKEN.test(tok) || t === 'thin' || t === 'medium' || t === 'thick')) out.width = tok;
    else if (!out.style && BORDER_STYLES.has(t)) out.style = t;
    else colorParts.push(tok);
  }
  out.color = colorParts.join(' ');
  return out;
}
