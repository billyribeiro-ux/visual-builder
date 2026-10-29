import { describe, it, expect } from 'vitest';
import { createNode, type BlueprintNode, createDefaultAcmeSaaSProject } from '@app-viz/schema';
import {
  BREAKPOINT_MEDIA,
  VISIBILITY_MEDIA,
  CANVAS_DEVICE_WIDTHS,
  BREAKPOINT_CASCADE,
  compileNodeCss,
  compileTokenCss,
  scopeCustomCss,
  sanitizeCssValue,
  isSafeCssKey,
  resolveEffectiveStyles
} from '../src/index.js';

const ID = '11111111-2222-4333-8444-555555555555';
const SEL = `[data-node-id="${ID}"]`;
const INNER = `[data-layout-of="${ID}"]`;

function node(input: Partial<Parameters<typeof createNode>[0]> & { componentType?: string } = {}): BlueprintNode {
  return createNode({ id: ID, name: 'Fixture', componentType: 'ui/card', ...input });
}

/** Parses `max-width: Npx` / `min-width: Npx` media queries for a viewport width check. */
function mediaMatches(query: string, width: number): boolean {
  return query.split(' and ').every((part) => {
    const m = /\((min|max)-width:\s*(\d+)px\)/.exec(part);
    if (!m) throw new Error(`Unsupported query ${part}`);
    return m[1] === 'min' ? width >= Number(m[2]) : width <= Number(m[2]);
  });
}

describe('breakpoint contract', () => {
  it('uses tablet ≤1023, mobile ≤767, desktop ≥1024, wide ≥1440', () => {
    expect(BREAKPOINT_MEDIA).toEqual({
      tablet: '(max-width: 1023px)',
      mobile: '(max-width: 767px)',
      desktop: '(min-width: 1024px)',
      wide: '(min-width: 1440px)'
    });
  });

  it('native media queries at each canvas device width apply exactly BREAKPOINT_CASCADE', () => {
    for (const [device, width] of Object.entries(CANVAS_DEVICE_WIDTHS) as Array<[keyof typeof CANVAS_DEVICE_WIDTHS, number]>) {
      const applied = (['tablet', 'mobile', 'desktop', 'wide'] as const).filter((bucket) =>
        mediaMatches(BREAKPOINT_MEDIA[bucket], width)
      );
      expect(applied, `${device} @ ${width}px`).toEqual(BREAKPOINT_CASCADE[device]);
    }
    // Regression: the 1280px desktop canvas must NOT receive wide overrides.
    expect(mediaMatches(BREAKPOINT_MEDIA.wide, CANVAS_DEVICE_WIDTHS.desktop)).toBe(false);
    expect(mediaMatches(BREAKPOINT_MEDIA.wide, CANVAS_DEVICE_WIDTHS.wide)).toBe(true);
  });

  it('visibility ranges are exclusive', () => {
    for (const width of [375, 768, 1023, 1024, 1280, 1440]) {
      const hits = Object.values(VISIBILITY_MEDIA).filter((q) => mediaMatches(q, width));
      expect(hits.length, `${width}px`).toBe(1);
    }
  });

  it('resolveEffectiveStyles mirrors the cascade for the inspector', () => {
    const style = { base: { gap: '1px' }, desktop: { gap: '2px' }, wide: { gap: '3px' } };
    expect(resolveEffectiveStyles(style, 'desktop').gap).toBe('2px');
    expect(resolveEffectiveStyles(style, 'wide').gap).toBe('3px');
  });
});

describe('compileNodeCss', () => {
  const styled = node({
    styles: {
      base: { color: 'red', paddingTop: 10 },
      tablet: { color: 'green' },
      mobile: { color: 'blue' },
      desktop: { color: 'purple' },
      wide: { color: 'orange' },
      hover: { color: 'black' },
      focus: { outline: '2px solid red' },
      active: { opacity: 0.5 },
      disabled: { opacity: 0.3 }
    },
    motionEffects: {
      entranceAnimation: 'fadeIn',
      animationDuration: 'slow',
      hoverTransform: 'scale',
      sticky: 'top',
      hideOnDesktop: false,
      hideOnTablet: true,
      hideOnMobile: false
    },
    customCss: 'selector { letter-spacing: 1px; }'
  });
  const css = compileNodeCss([styled]);

  it('marks every compiled declaration !important (custom CSS stays verbatim)', () => {
    const declarations = css
      .split('\n')
      .filter((line) => line.includes('{') && line.includes('}') && !line.includes('letter-spacing'))
      .flatMap((line) => line.slice(line.indexOf('{') + 1, line.lastIndexOf('}')).split(';'))
      .map((d) => d.trim())
      .filter(Boolean);
    expect(declarations.length).toBeGreaterThan(10);
    for (const d of declarations) expect(d, d).toMatch(/!important$/);
    expect(css).toContain(`${SEL} { letter-spacing: 1px; }`);
  });

  it('emits base → tablet → mobile → desktop → wide → states → motion → visibility → custom', () => {
    const order = [
      `${SEL} { transition`,
      `@media ${BREAKPOINT_MEDIA.tablet}`,
      `@media ${BREAKPOINT_MEDIA.mobile}`,
      `@media ${BREAKPOINT_MEDIA.desktop}`,
      `@media ${BREAKPOINT_MEDIA.wide}`,
      `${SEL}:hover { color: black !important; }`,
      `${SEL}:focus-visible, ${SEL}:focus-within`,
      `${SEL}:active { opacity: 0.5 !important; }`,
      `${SEL}:disabled, ${SEL}[aria-disabled="true"]`,
      `${SEL} { position: sticky !important;`,
      `${SEL} { animation: el-fadeIn 760ms`,
      `${SEL}:hover { transform: scale(1.02) !important; }`,
      '@media (prefers-reduced-motion: reduce)',
      `@media ${VISIBILITY_MEDIA.tablet}`,
      `${SEL} { letter-spacing: 1px; }`
    ];
    let last = -1;
    for (const marker of order) {
      const index = css.indexOf(marker);
      expect(index, marker).toBeGreaterThan(last);
      last = index;
    }
  });

  it('serializes numbers as-is and kebab-cases keys', () => {
    expect(css).toContain('padding-top: 10 !important;');
    expect(compileNodeCss([node({ styles: { base: { WebkitLineClamp: 2, '--brand-tint': '#fff' } } })])).toContain(
      `${SEL} { -webkit-line-clamp: 2 !important; --brand-tint: #fff !important; }`
    );
  });

  it('routes layout keys of layoutInner components to [data-layout-of]', () => {
    const section = node({
      componentType: 'structure/section',
      styles: {
        base: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'center', paddingTop: '10px' },
        tablet: { gridTemplateColumns: '1fr' },
        hover: { gap: '3rem' }
      }
    });
    const out = compileNodeCss([section], { layoutInner: (t) => t === 'structure/section' });
    expect(out).toContain(`${INNER} { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 2rem !important; text-align: center !important; }`);
    expect(out).toContain(`${SEL} { transition: all 180ms cubic-bezier(0.2, 0, 0, 1) !important; padding-top: 10px !important; }`);
    expect(out).toContain(`  ${INNER} { grid-template-columns: 1fr !important; }`);
    expect(out).toContain(`${SEL}:hover ${INNER} { gap: 3rem !important; }`);
    // Without the option everything targets the root.
    expect(compileNodeCss([section])).not.toContain('data-layout-of');
  });

  it('keeps display:none on the root of layoutInner components (hides the whole element)', () => {
    const hidden = node({ componentType: 'structure/section', styles: { base: {}, mobile: { display: 'none' } } });
    const out = compileNodeCss([hidden], { layoutInner: () => true });
    expect(out).toContain(`  ${SEL} { display: none !important; }`);
    expect(out).not.toContain(INNER);
  });

  it('drops unsafe keys and values', () => {
    const evil = node({
      styles: {
        base: {
          color: 'red',
          width: '1px}</style><script>alert(1)</script>',
          height: 'expression(alert(1))',
          background: 'url(javascript:alert(1))',
          margin: '0; position: fixed',
          'bad key': 'red',
          'x{': 'red',
          border: '1px solid red /* unterminated',
          content: '"unbalanced',
          top: 'calc(100% - 1px) !important'
        }
      }
    });
    const out = compileNodeCss([evil]);
    expect(out).toBe(`${SEL} { color: red !important; top: calc(100% - 1px) !important; }`);
    for (const bad of ['<', 'script', 'expression(', 'javascript:', 'position: fixed', 'bad key', '/*']) {
      expect(out).not.toContain(bad);
    }
  });

  it('scopes custom CSS and drops blocks with blocked tokens or broken syntax', () => {
    expect(scopeCustomCss('selector:hover .x { color: red; }', ID)).toBe(`${SEL}:hover .x { color: red; }`);
    expect(scopeCustomCss('selector { background: url(javascript:alert(1)); }', ID)).toMatch(/^\/\* custom CSS of node .* dropped/);
    expect(scopeCustomCss('@import url(https://evil.example/x.css);', ID)).toMatch(/dropped/);
    expect(scopeCustomCss('selector { color: red;', ID)).toMatch(/unbalanced braces/);
    expect(scopeCustomCss('selector { color: red; } /* open', ID)).toMatch(/unterminated comment/);
    expect(scopeCustomCss('selector { content: "</style><script>"; }', ID)).not.toContain('<');
  });

  it('skips hidden subtrees and layout slots; walks visible children', () => {
    const child = createNode({ id: '22222222-2222-4333-8444-555555555555', name: 'c', componentType: 'ui/badge', styles: { base: { color: 'red' } } });
    const hiddenChild = createNode({
      id: '33333333-2222-4333-8444-555555555555',
      name: 'h',
      componentType: 'ui/badge',
      hidden: true,
      styles: { base: { color: 'blue' } }
    });
    const slot = createNode({ id: '44444444-2222-4333-8444-555555555555', name: 's', componentType: 'structure/slot', styles: { base: { flex: '1' } } });
    const out = compileNodeCss([node({ componentType: 'structure/container', children: [child, hiddenChild, slot] })]);
    expect(out).toContain('[data-node-id="22222222-2222-4333-8444-555555555555"] { color: red !important; }');
    expect(out).not.toContain('33333333');
    expect(out).not.toContain('44444444');
  });

  it('is deterministic for the whole default project', () => {
    const p = createDefaultAcmeSaaSProject();
    const roots = [...p.layouts.map((l) => l.rootNode), ...p.pages.map((pg) => pg.rootNode)];
    expect(compileNodeCss(roots)).toBe(compileNodeCss(roots));
  });
});

describe('css sanitizer & tokens', () => {
  it('sanitizeCssValue / isSafeCssKey', () => {
    expect(sanitizeCssValue('  1.5rem ')).toBe('1.5rem');
    expect(sanitizeCssValue(12)).toBe('12');
    expect(sanitizeCssValue(Number.NaN)).toBe('');
    expect(sanitizeCssValue('red; color: blue')).toBe('');
    expect(sanitizeCssValue('{}')).toBe('');
    expect(sanitizeCssValue('red !important')).toBe('red');
    expect(isSafeCssKey('backgroundColor')).toBe(true);
    expect(isSafeCssKey('--x')).toBe(true);
    expect(isSafeCssKey('a b')).toBe(false);
    expect(isSafeCssKey('}a')).toBe(false);
  });

  it('compileTokenCss scopes tokens to .site-root and drops unsafe entries', () => {
    const tokens = createDefaultAcmeSaaSProject().tokens;
    const css = compileTokenCss({
      ...tokens,
      colors: { ...tokens.colors, primary: '#123456', 'evil}': 'red', bad: 'red;}</style>' }
    });
    expect(css.startsWith('.site-root {')).toBe(true);
    expect(css).toContain('--md-sys-color-primary: #123456;');
    expect(css).toContain('--md-sys-font-heading:');
    expect(css).not.toContain('evil');
    expect(css).not.toContain('</style>');
    expect(css).not.toContain('--md-sys-color-bad');
  });
});

describe('googleFontsHref (shared by the canvas head and the export app.html)', () => {
  it('requests allowlisted token families with the weights components use', async () => {
    const { googleFontsHref, primaryFontFamily } = await import('../src/index.js');
    expect(primaryFontFamily('"Roboto Mono", ui-monospace')).toBe('Roboto Mono');
    expect(googleFontsHref({ heading: 'Plus Jakarta Sans, sans-serif', body: 'Roboto, sans-serif', mono: '"Roboto Mono", monospace' })).toBe(
      'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Roboto:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;600&display=swap'
    );
    // Unknown or system families never trigger a request.
    expect(googleFontsHref({ heading: 'Comic Neue Custom', body: '-apple-system, sans-serif', mono: 'monospace' })).toBeNull();
    expect(googleFontsHref({ heading: '"><script>', body: '', mono: '' })).toBeNull();
  });
});

describe('scroll-driven motion', () => {
  const nodeWith = (motionEffects: Record<string, unknown>) =>
    ({
      id: '11111111-1111-4111-8111-111111111111',
      componentType: 'ui/card',
      name: 'Card',
      props: {},
      styles: { base: {} },
      interactions: [],
      children: [],
      locked: false,
      hidden: false,
      customClasses: '',
      customCss: '',
      motionEffects: {
        entranceAnimation: 'none',
        animationDuration: 'normal',
        entranceTrigger: 'scroll',
        scrollEffect: 'none',
        scrollIntensity: 'medium',
        hoverTransform: 'none',
        sticky: 'none',
        hideOnDesktop: false,
        hideOnTablet: false,
        hideOnMobile: false,
        ...motionEffects
      }
    }) as never;

  it('plays scroll-triggered entrances on a view timeline with a time-based fallback', () => {
    const css = compileNodeCss([nodeWith({ entranceAnimation: 'fadeInUp' })]);
    expect(css).toContain('animation: el-fadeInUp 460ms');
    expect(css).toMatch(/@supports \(animation-timeline: view\(\)\) \{[\s\S]*animation-timeline: view\(\) !important/);
    expect(css).toContain('animation-range: entry 0% entry 100% !important');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
  });

  it('keeps load-triggered entrances time-based only', () => {
    const css = compileNodeCss([nodeWith({ entranceAnimation: 'zoomIn', entranceTrigger: 'load' })]);
    expect(css).toContain('animation: el-zoomIn');
    expect(css).not.toContain('animation-timeline');
  });

  it('emits used scroll-effect keyframes once, deterministically, and combines with entrances', () => {
    const a = compileNodeCss([nodeWith({ scrollEffect: 'parallax', scrollIntensity: 'strong', entranceAnimation: 'fadeIn' })]);
    expect(a).toContain('@keyframes el-scroll-parallax-strong { from { transform: translateY(86.4px); }');
    expect(a).toContain('animation: el-fadeIn linear both, el-scroll-parallax-strong linear both !important');
    expect(a).toContain('animation-timeline: view(), view() !important');
    expect(a.match(/@keyframes el-scroll-parallax-strong/g)).toHaveLength(1);
    expect(compileNodeCss([nodeWith({ scrollEffect: 'parallax', scrollIntensity: 'strong', entranceAnimation: 'fadeIn' })])).toBe(a);
  });
});
