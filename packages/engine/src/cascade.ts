import type { ResponsiveStyle, BreakpointKey, CSSProperties, BlueprintNode, DesignTokens } from '@app-viz/schema';
import { sanitizeCssDeclarations, sanitizeCssValue, sanitizeNodeId, cssKeyToProperty } from './css-safety.js';

/**
 * Responsive cascade contract — the ONE definition used by the studio canvas (native media
 * queries inside the preview iframe), the SvelteKit export (`src/lib/styles/nodes.css`) and
 * the Claude build spec:
 *
 *   base     applies at every width
 *   tablet   applies at <= 1023px  (tablet AND mobile — Elementor-style, desktop-first)
 *   mobile   applies at <= 767px   (wins over tablet)
 *   desktop  applies at >= 1024px
 *   wide     applies at >= 1440px  (wins over desktop)
 *
 * Canvas device widths are mobile 375, tablet 768, desktop 1280 and wide 1440, so each device
 * preview receives exactly the buckets listed in {@link BREAKPOINT_CASCADE}.
 * Device visibility toggles (hideOnMobile/Tablet/Desktop) are exact ranges, not cascades.
 */
export const BREAKPOINT_MEDIA = {
  tablet: '(max-width: 1023px)',
  mobile: '(max-width: 767px)',
  desktop: '(min-width: 1024px)',
  wide: '(min-width: 1440px)'
} as const;

export const VISIBILITY_MEDIA = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)'
} as const;

/** Device widths the canvas iframe uses for each breakpoint preview. */
export const CANVAS_DEVICE_WIDTHS: Record<BreakpointKey, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1280,
  wide: 1440
};

/** Which override buckets apply (in order) when previewing a given breakpoint. */
export const BREAKPOINT_CASCADE: Record<BreakpointKey, BreakpointKey[]> = {
  mobile: ['tablet', 'mobile'],
  tablet: ['tablet'],
  desktop: ['desktop'],
  wide: ['desktop', 'wide']
};

/**
 * Resolves effective CSS styles for a node given the active breakpoint and an optional
 * engaged state variant (hover, focus, active). Used by the inspector to show the values that
 * apply at the previewed breakpoint; rendering itself always goes through {@link compileNodeCss}.
 */
export function resolveEffectiveStyles(
  style: ResponsiveStyle | undefined,
  activeBreakpoint: BreakpointKey = 'desktop',
  activeState?: 'hover' | 'focus' | 'active'
): CSSProperties {
  if (!style) return {};
  const result: CSSProperties = { ...(style.base || {}) };

  for (const bp of BREAKPOINT_CASCADE[activeBreakpoint] ?? []) {
    const bpStyles = style[bp];
    if (bpStyles) Object.assign(result, bpStyles);
  }

  if (activeState && style[activeState]) {
    Object.assign(result, style[activeState]);
  }

  return result;
}

/** Serializes CSSProperties into a declaration list. Does NOT sanitize — prefer `safeStyleString`. */
export function cssPropertiesToString(props: CSSProperties, important = false): string {
  const suffix = important ? ' !important' : '';
  return Object.entries(props)
    .filter(([, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => `${cssKeyToProperty(key)}: ${val}${suffix};`)
    .join(' ');
}

/* ------------------------------------------------------------------------------------------ */
/* Node stylesheet compiler                                                                   */
/* ------------------------------------------------------------------------------------------ */

/**
 * Style keys that describe how a container lays out its children. For components whose
 * manifest sets `layoutInner` (e.g. Section, Dashboard Shell) these are routed to the inner
 * element carrying `data-layout-of="<id>"` instead of the component root.
 */
export const LAYOUT_STYLE_KEYS: ReadonlySet<string> = new Set([
  'display',
  'flexDirection',
  'flexWrap',
  'justifyContent',
  'alignItems',
  'alignContent',
  'gap',
  'rowGap',
  'columnGap',
  'gridTemplateColumns',
  'gridTemplateRows',
  'gridAutoFlow',
  'textAlign'
]);

export interface CompileNodeCssOptions {
  /** Returns true when layout keys of this component type target its `[data-layout-of]` element. */
  layoutInner?: (componentType: string) => boolean;
}

const ENTRANCE_DURATIONS: Record<string, string> = { fast: '220ms', normal: '460ms', slow: '760ms' };
const EASE = 'cubic-bezier(0.2, 0, 0, 1)';

const HOVER_TRANSFORM_RULES: Record<string, string> = {
  lift: 'transform: translateY(-5px) !important; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14) !important;',
  scale: 'transform: scale(1.02) !important;',
  glow: 'box-shadow: 0 0 0 2px var(--md-sys-color-primary, #0B57D0), 0 10px 28px rgba(11, 87, 208, 0.22) !important;',
  tilt: 'transform: perspective(800px) rotateX(2deg) translateY(-3px) !important;'
};

function declarations(pairs: Array<[string, string]>): string {
  return pairs.map(([prop, value]) => `${prop}: ${value} !important;`).join(' ');
}

/** Custom-CSS tokens that are never emitted (script URLs, IE expressions, remote imports, bindings). */
const BLOCKED_CUSTOM_CSS = ['javascript:', 'vbscript:', 'expression(', '@import', '-moz-binding', 'behavior:'];

function bracesBalanced(css: string): boolean {
  let depth = 0;
  for (const ch of css) {
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/**
 * Scopes a node's custom CSS: every `selector` token becomes the node selector. Blocks that
 * contain blocked tokens, unbalanced braces/quotes or unterminated comments are dropped and a
 * visible comment explains why (fail loud, never emit a half-sanitized block). `<` is escaped
 * as `\3c ` so the stylesheet can never terminate an enclosing `<style>` element.
 */
export function scopeCustomCss(css: string, nodeId: string): string {
  const id = sanitizeNodeId(nodeId);
  const trimmed = css.trim();
  if (!trimmed) return '';
  const normalized = trimmed.toLowerCase().replace(/[\s'"\\]/g, '');
  const blocked = BLOCKED_CUSTOM_CSS.find((token) => normalized.includes(token.replace(/\s/g, '')));
  if (blocked) return `/* custom CSS of node ${id} dropped: contains a blocked token */`;
  const opens = trimmed.split('/*').length - 1;
  const closes = trimmed.split('*/').length - 1;
  if (opens !== closes) return `/* custom CSS of node ${id} dropped: unterminated comment */`;
  const withoutComments = trimmed.replace(/\/\*[\s\S]*?\*\//g, '');
  if (!bracesBalanced(withoutComments)) return `/* custom CSS of node ${id} dropped: unbalanced braces */`;
  if ((withoutComments.match(/"/g)?.length ?? 0) % 2 || (withoutComments.match(/'/g)?.length ?? 0) % 2) {
    return `/* custom CSS of node ${id} dropped: unbalanced quotes */`;
  }
  return trimmed.replace(/</g, '\\3c ').replace(/\bselector\b/g, `[data-node-id="${id}"]`);
}

const SCROLL_INTENSITY = { subtle: 0.5, medium: 1, strong: 1.8 } as const;

/** Keyframes for `el-scroll-<effect>-<intensity>` (deterministic, only emitted when used). */
export function scrollKeyframesCss(name: string): string {
  const match = /^el-scroll-(parallax|fade|scale|blur|rotate)-(subtle|medium|strong)$/.exec(name);
  if (!match) return '';
  const k = SCROLL_INTENSITY[match[2] as keyof typeof SCROLL_INTENSITY];
  const r = (n: number) => Math.round(n * 100) / 100;
  switch (match[1]) {
    case 'parallax':
      return `@keyframes ${name} { from { transform: translateY(${r(48 * k)}px); } to { transform: translateY(${r(-48 * k)}px); } }`;
    case 'fade':
      return `@keyframes ${name} { 0% { opacity: ${r(Math.max(0, 1 - 0.8 * k))}; } 30%, 70% { opacity: 1; } 100% { opacity: ${r(Math.max(0, 1 - 0.8 * k))}; } }`;
    case 'scale':
      return `@keyframes ${name} { 0% { transform: scale(${r(1 - 0.12 * k)}); } 40%, 100% { transform: scale(1); } }`;
    case 'blur':
      return `@keyframes ${name} { 0% { filter: blur(${r(8 * k)}px); } 40%, 100% { filter: blur(0); } }`;
    case 'rotate':
      return `@keyframes ${name} { 0% { transform: rotate(${r(-6 * k)}deg); } 50%, 100% { transform: rotate(0deg); } }`;
    default:
      return '';
  }
}

interface Buckets {
  base: string[];
  tablet: string[];
  mobile: string[];
  desktop: string[];
  wide: string[];
  states: string[];
  motion: string[];
  /** Scroll-timeline rules, emitted inside `@supports (animation-timeline: view())`. */
  scrollDriven: string[];
  /** Scroll-effect keyframe names actually used (emitted once each). */
  keyframes: Set<string>;
  reducedMotion: string[];
  hideMobile: string[];
  hideTablet: string[];
  hideDesktop: string[];
  custom: string[];
}

/**
 * Compiles every visible node of the given trees into ONE stylesheet. This is the only way
 * node styles reach the DOM, in the canvas and in the export alike. Rules are keyed
 * `[data-node-id="<id>"]` (or `[data-layout-of="<id>"]` for layout keys of `layoutInner`
 * components) and every declaration is `!important`, so inspector styles always beat a
 * component's own scoped defaults.
 *
 * Emission order (later wins at equal specificity):
 *   1. base
 *   2. media buckets: tablet, mobile, desktop, wide (see {@link BREAKPOINT_MEDIA})
 *   3. states: :hover, :focus-visible / :focus-within, :active, :disabled
 *   4. motion effects: sticky, entrance animation, hover transforms (+ prefers-reduced-motion)
 *   5. device visibility (exact ranges, see {@link VISIBILITY_MEDIA})
 *   6. scoped custom CSS (`selector` → the node selector)
 *
 * Output is deterministic: same trees → byte-identical CSS.
 */
export function compileNodeCss(
  roots: ReadonlyArray<BlueprintNode | undefined | null>,
  options: CompileNodeCssOptions = {}
): string {
  const b: Buckets = {
    base: [],
    tablet: [],
    mobile: [],
    desktop: [],
    wide: [],
    states: [],
    motion: [],
    scrollDriven: [],
    keyframes: new Set<string>(),
    reducedMotion: [],
    hideMobile: [],
    hideTablet: [],
    hideDesktop: [],
    custom: []
  };

  function walk(node: BlueprintNode | undefined | null) {
    if (!node || node.hidden) return;
    // A layout slot is replaced by the page content and renders no element of its own.
    if (node.componentType === 'structure/slot') return;

    const id = sanitizeNodeId(node.id);
    if (id) compileNode(node, id);

    for (const child of node.children || []) walk(child);
  }

  function compileNode(node: BlueprintNode, id: string) {
    const sel = `[data-node-id="${id}"]`;
    const innerSel = `[data-layout-of="${id}"]`;
    const inner = options.layoutInner?.(node.componentType) === true;
    const s = node.styles;
    const m = node.motionEffects;

    /** Splits a bucket into root/inner declaration lists. `display: none` always hides the root. */
    function split(css: Record<string, unknown> | undefined): { root: Array<[string, string]>; inner: Array<[string, string]> } {
      const rootCss: Record<string, unknown> = {};
      const innerCss: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(css ?? {})) {
        const hideRoot = key === 'display' && typeof value === 'string' && value.trim() === 'none';
        if (inner && LAYOUT_STYLE_KEYS.has(key) && !hideRoot) innerCss[key] = value;
        else rootCss[key] = value;
      }
      return { root: sanitizeCssDeclarations(rootCss), inner: sanitizeCssDeclarations(innerCss) };
    }

    function push(target: string[], selector: string, pairs: Array<[string, string]>, indent = '') {
      if (pairs.length) target.push(`${indent}${selector} { ${declarations(pairs)} }`);
    }

    const hasHoverStyles = Boolean(s?.hover && Object.keys(s.hover).length);
    const hoverTransform = m?.hoverTransform && m.hoverTransform !== 'none' ? m.hoverTransform : null;

    // 1. base (+ an automatic transition when the node animates on hover and sets none itself)
    const base = split(s?.base);
    const userSetsTransition = Boolean(s?.base && 'transition' in s.base);
    if ((hasHoverStyles || hoverTransform) && !userSetsTransition) {
      base.root.unshift([
        'transition',
        hasHoverStyles ? `all 180ms ${EASE}` : `transform 220ms ${EASE}, box-shadow 220ms ${EASE}`
      ]);
    }
    push(b.base, sel, base.root);
    push(b.base, innerSel, base.inner);

    // 2. media buckets
    for (const bucket of ['tablet', 'mobile', 'desktop', 'wide'] as const) {
      const parts = split(s?.[bucket]);
      push(b[bucket], sel, parts.root, '  ');
      push(b[bucket], innerSel, parts.inner, '  ');
    }

    // 3. states
    const states: Array<[keyof ResponsiveStyle, string[]]> = [
      ['hover', [':hover']],
      ['focus', [':focus-visible', ':focus-within']],
      ['active', [':active']],
      ['disabled', [':disabled', '[aria-disabled="true"]']]
    ];
    for (const [key, pseudos] of states) {
      const parts = split(s?.[key] as Record<string, unknown> | undefined);
      push(b.states, pseudos.map((p) => `${sel}${p}`).join(', '), parts.root);
      push(b.states, pseudos.map((p) => `${sel}${p} ${innerSel}`).join(', '), parts.inner);
    }

    // 4. motion effects
    if (m) {
      if (m.sticky === 'top') {
        b.motion.push(`${sel} { position: sticky !important; top: 0 !important; z-index: 45 !important; }`);
      } else if (m.sticky === 'bottom') {
        b.motion.push(`${sel} { position: sticky !important; bottom: 0 !important; z-index: 45 !important; }`);
      }
      const entrance = m.entranceAnimation && m.entranceAnimation !== 'none' ? m.entranceAnimation : null;
      const scroll = m.scrollEffect && m.scrollEffect !== 'none' ? m.scrollEffect : null;
      const scrollKeyframes = scroll ? `el-scroll-${scroll}-${m.scrollIntensity ?? 'medium'}` : null;
      if (scrollKeyframes) b.keyframes.add(scrollKeyframes);
      if (entrance) {
        const duration = ENTRANCE_DURATIONS[m.animationDuration || 'normal'] ?? ENTRANCE_DURATIONS.normal;
        // Time-based fallback everywhere; browsers with view timelines get scroll-triggered entrances.
        b.motion.push(`${sel} { animation: el-${entrance} ${duration} ${EASE} both !important; }`);
      }
      if (entrance && m.entranceTrigger !== 'load') {
        const anims = [`el-${entrance} linear both`, ...(scrollKeyframes ? [`${scrollKeyframes} linear both`] : [])];
        const timelines = ['view()', ...(scrollKeyframes ? ['view()'] : [])];
        const ranges = ['entry 0% entry 100%', ...(scrollKeyframes ? ['cover 0% cover 100%'] : [])];
        b.scrollDriven.push(
          `  ${sel} { animation: ${anims.join(', ')} !important; animation-timeline: ${timelines.join(', ')} !important; animation-range: ${ranges.join(', ')} !important; }`
        );
      } else if (scrollKeyframes) {
        const anims = [...(entrance ? [`el-${entrance} ${ENTRANCE_DURATIONS[m.animationDuration || 'normal'] ?? ENTRANCE_DURATIONS.normal} ${EASE} both`] : []), `${scrollKeyframes} linear both`];
        const timelines = [...(entrance ? ['auto'] : []), 'view()'];
        const ranges = [...(entrance ? ['normal'] : []), 'cover 0% cover 100%'];
        b.scrollDriven.push(
          `  ${sel} { animation: ${anims.join(', ')} !important; animation-timeline: ${timelines.join(', ')} !important; animation-range: ${ranges.join(', ')} !important; }`
        );
      }
      if (hoverTransform && HOVER_TRANSFORM_RULES[hoverTransform]) {
        b.motion.push(`${sel}:hover { ${HOVER_TRANSFORM_RULES[hoverTransform]} }`);
      }
      if (entrance || hoverTransform || scroll) {
        b.reducedMotion.push(`  ${sel} { animation: none !important; transition-duration: 0.01ms !important; }`);
        if (hoverTransform && hoverTransform !== 'glow') {
          b.reducedMotion.push(`  ${sel}:hover { transform: none !important; }`);
        }
      }

      // 5. device visibility
      if (m.hideOnMobile) b.hideMobile.push(`  ${sel} { display: none !important; }`);
      if (m.hideOnTablet) b.hideTablet.push(`  ${sel} { display: none !important; }`);
      if (m.hideOnDesktop) b.hideDesktop.push(`  ${sel} { display: none !important; }`);
    }

    // 6. scoped custom CSS
    if (node.customCss && node.customCss.trim()) {
      b.custom.push(scopeCustomCss(node.customCss, node.id));
    }
  }

  for (const root of roots) walk(root);

  const blocks: string[] = [];
  const media = (query: string, rules: string[]) => {
    if (rules.length) blocks.push(`@media ${query} {\n${rules.join('\n')}\n}`);
  };
  blocks.push(...b.base);
  media(BREAKPOINT_MEDIA.tablet, b.tablet);
  media(BREAKPOINT_MEDIA.mobile, b.mobile);
  media(BREAKPOINT_MEDIA.desktop, b.desktop);
  media(BREAKPOINT_MEDIA.wide, b.wide);
  blocks.push(...b.states);
  blocks.push(...b.motion);
  for (const name of [...b.keyframes].sort()) blocks.push(scrollKeyframesCss(name));
  if (b.scrollDriven.length) {
    blocks.push(`@supports (animation-timeline: view()) {\n${b.scrollDriven.join('\n')}\n}`);
  }
  media('(prefers-reduced-motion: reduce)', b.reducedMotion);
  media(VISIBILITY_MEDIA.mobile, b.hideMobile);
  media(VISIBILITY_MEDIA.tablet, b.hideTablet);
  media(VISIBILITY_MEDIA.desktop, b.hideDesktop);
  blocks.push(...b.custom);
  return blocks.join('\n');
}

/* ------------------------------------------------------------------------------------------ */
/* Design tokens                                                                              */
/* ------------------------------------------------------------------------------------------ */

const TOKEN_NAME_RE = /^[a-zA-Z0-9-]+$/;

/**
 * Compiles project design tokens into custom properties on `.site-root`. The runtime declares
 * its defaults on `:where(.site-root)` (zero specificity), so these always win regardless of
 * stylesheet order. Unsafe names/values are dropped.
 */
export function compileTokenCss(tokens: DesignTokens): string {
  const lines: string[] = [];
  const group = (prefix: string, record: Record<string, string> | undefined) => {
    for (const [name, raw] of Object.entries(record ?? {}).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))) {
      if (!TOKEN_NAME_RE.test(name)) continue;
      const value = sanitizeCssValue(raw);
      if (value) lines.push(`  --${prefix}-${name}: ${value};`);
    }
  };
  group('md-sys-color', tokens.colors);
  const fonts = tokens.fonts ?? ({} as DesignTokens['fonts']);
  for (const key of ['heading', 'body', 'mono'] as const) {
    const value = sanitizeCssValue(fonts[key]);
    if (value) lines.push(`  --md-sys-font-${key}: ${value};`);
  }
  group('md-sys-shape-corner', tokens.radii);
  group('md-sys-elevation', tokens.shadows);
  group('md-sys-spacing', tokens.spacing);
  return `.site-root {\n${lines.join('\n')}\n}\n`;
}
