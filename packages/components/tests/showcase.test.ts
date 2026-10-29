import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { SHOWCASE_MANIFESTS } from '../src/manifests/showcase.js';
import { getManifest, resolveComponentProps, resolveIconName } from '../src/index.js';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVELTE_DIR = path.join(PKG_ROOT, 'src/svelte');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
const PHOSPHOR_LIB = path.join(REPO_ROOT, 'apps/studio/node_modules/phosphor-svelte/lib');
const req = createRequire(path.join(PKG_ROOT, 'package.json'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compiler = req('svelte/compiler') as typeof import('svelte/compiler');

/* -------------------------------------------------------------------------- */
/* Server-render harness: compile the canonical .svelte files (generate:       */
/* 'server') into a temp dir with absolute imports so svelte/server can render */
/* them without a Vite Svelte plugin.                                          */
/* -------------------------------------------------------------------------- */

const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'appviz-showcase-ssr-'));
const compiled = new Map<string, string>();

function compileToTemp(relFile: string): string {
  const cached = compiled.get(relFile);
  if (cached) return cached;
  const source = fs.readFileSync(path.join(SVELTE_DIR, relFile), 'utf8');
  const { js, warnings } = compiler.compile(source, { generate: 'server', filename: path.basename(relFile), runes: true });
  if (warnings.length) throw new Error(`${relFile}: ${warnings.map((w) => w.code).join(', ')}`);
  const outFile = path.join(OUT_DIR, `${relFile.replace(/[\\/]/g, '__')}.js`);
  compiled.set(relFile, outFile);
  const code = js.code.replace(/(from\s+|import\s+)(['"])([^'"]+)\2/g, (_m, lead: string, quote: string, spec: string) => {
    let target: string;
    if (spec.startsWith('.')) {
      const rel = path.join(path.dirname(relFile), spec);
      target = spec.endsWith('.svelte') ? compileToTemp(rel) : path.join(SVELTE_DIR, rel.replace(/\.js$/, '.ts'));
    } else {
      target = req.resolve(spec);
    }
    return `${lead}${quote}${target}${quote}`;
  });
  fs.writeFileSync(outFile, code);
  return outFile;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = { default: Component<any> };
const modules = new Map<string, AnyModule>();

async function load(name: string): Promise<AnyModule> {
  const hit = modules.get(name);
  if (hit) return hit;
  const mod = (await import(/* @vite-ignore */ pathToFileURL(compileToTemp(`${name}.svelte`)).href)) as AnyModule;
  modules.set(name, mod);
  return mod;
}

const NODE_ID = '5c5c5c5c-0000-4000-8000-000000000001';

/** Server-renders a showcase type with validated props (as canvas and export do). */
async function ssr(type: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const manifest = SHOWCASE_MANIFESTS[type];
  const result = resolveComponentProps(type, { ...structuredClone(manifest.defaultProps), ...overrides });
  if (!result) throw new Error(`unknown type ${type}`);
  const mod = await load(manifest.component);
  // Hydration markers and scoped-style hash classes are irrelevant to these assertions.
  return render(mod.default, { props: { ...result.props, 'data-node-id': NODE_ID } })
    .body.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/ ?\bsvelte-[a-z0-9]{4,}\b/g, '')
    .replace(/ class=""/g, '')
    .replace(/class=" /g, 'class="');
}

function count(haystack: string, needle: string | RegExp): number {
  const re = typeof needle === 'string' ? new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : needle;
  return haystack.match(re)?.length ?? 0;
}

/** The opening tag of the first element carrying `data-node-id` (the component root). */
function rootTag(html: string): string {
  return /<[a-z]+[^>]*data-node-id="[^"]+"[^>]*>/.exec(html)?.[0] ?? '';
}

const EXPECTED = {
  'marketing/testimonial-carousel': 'TestimonialCarousel',
  'marketing/team': 'Team',
  'marketing/steps': 'Steps',
  'marketing/timeline': 'Timeline',
  'marketing/price-list': 'PriceList',
  'ui/flip-box': 'FlipBox',
  'ui/cta-box': 'CtaBox',
  'marketing/marquee': 'Marquee',
  'marketing/feature-tabs': 'FeatureTabs',
  'marketing/stats-split': 'StatsSplit',
  'marketing/faq-split': 'FaqSplit'
} as const;
const TYPES = Object.keys(EXPECTED) as Array<keyof typeof EXPECTED>;

beforeAll(async () => {
  for (const name of Object.values(EXPECTED)) await load(name);
});

afterAll(() => {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
});

/* -------------------------------------------------------------------------- */
/* Manifests                                                                   */
/* -------------------------------------------------------------------------- */

describe('showcase manifests', () => {
  it('registers exactly the eleven showcase types with matching components', () => {
    expect(Object.keys(SHOWCASE_MANIFESTS).sort()).toEqual([...TYPES].sort());
    for (const type of TYPES) {
      const manifest = getManifest(type)!;
      expect(manifest, type).toBe(SHOWCASE_MANIFESTS[type]);
      expect(manifest.component).toBe(EXPECTED[type]);
      expect(fs.existsSync(path.join(SVELTE_DIR, `${manifest.component}.svelte`)), type).toBe(true);
      expect(manifest.category).toBe(type.startsWith('ui/') ? 'ui' : 'marketing');
      expect(manifest.isSection === true, type).toBe(!type.startsWith('ui/'));
    }
  });

  it('uses studio icons that exist in phosphor-svelte 3.1.1', () => {
    for (const type of TYPES) {
      const icon = SHOWCASE_MANIFESTS[type].icon;
      expect(fs.existsSync(path.join(PHOSPHOR_LIB, `${icon}Icon.svelte`)), `${type}: ${icon}`).toBe(true);
    }
  });

  it('default props are schema-valid, resolve without issues and are fully populated', () => {
    for (const type of TYPES) {
      const manifest = SHOWCASE_MANIFESTS[type];
      const parsed = manifest.propsSchema.safeParse(manifest.defaultProps);
      expect(parsed.success, type).toBe(true);
      const result = resolveComponentProps(type, structuredClone(manifest.defaultProps))!;
      expect(result.issues, type).toEqual([]);
      expect(result.props, type).toEqual(manifest.defaultProps);
      // Every schema key has an explicit default in defaultProps (the inspector shows it).
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, unknown> }).shape;
      expect(Object.keys(manifest.defaultProps).sort(), type).toEqual(Object.keys(shape).sort());
    }
  });

  it('propControls only reference real props, and every select lists exactly the enum values', () => {
    for (const type of TYPES) {
      const manifest = SHOWCASE_MANIFESTS[type];
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, { safeParse(v: unknown): { success: boolean } }> }).shape;
      for (const [key, control] of Object.entries(manifest.propControls ?? {})) {
        expect(shape[key], `${type}.${key}`).toBeDefined();
        if (control.type === 'select') {
          for (const option of control.options ?? []) expect(shape[key].safeParse(option.value).success, `${type}.${key}=${option.value}`).toBe(true);
        }
      }
    }
  });

  it('tolerates empty, partial and hostile input (per-prop fallback, invalid items dropped)', () => {
    for (const type of TYPES) {
      const empty = resolveComponentProps(type, {})!;
      expect(empty.issues, type).toEqual([]);
      for (const value of Object.values(empty.props)) expect(value, type).not.toBeUndefined();
    }
    const r = resolveComponentProps('marketing/testimonial-carousel', {
      testimonials: [{ quote: 'Kept', author: 'A' }, 'nope', { quote: 1 }],
      interval: 5,
      variant: 'sideways'
    })!;
    expect(r.props.testimonials).toEqual([{ quote: 'Kept', author: 'A', role: '', company: '', avatarSrc: '', rating: 5 }]);
    expect(r.props.interval).toBe(6000);
    expect(r.props.variant).toBe('single-large');
    expect(resolveComponentProps('marketing/team', { columns: 9 })!.props.columns).toBe(4);
    expect(resolveComponentProps('marketing/team', { members: [{ name: 'X', links: [{ network: 'myspace', href: '/' }] }] })!.props.members).toEqual([]);
  });

  it('top-level image URLs must be safe; icon tokens must exist in the site icon set', () => {
    const cta = (imageUrl: unknown) => resolveComponentProps('ui/cta-box', { imageUrl })!;
    expect(cta('https://images.example.com/team.jpg').props.imageUrl).toBe('https://images.example.com/team.jpg');
    expect(cta('/media/hero.webp').props.imageUrl).toBe('/media/hero.webp');
    expect(cta('javascript:alert(1)').props.imageUrl).toBe('');
    expect(cta('javascript:alert(1)').issues.length).toBe(1);
    expect(cta('data:image/svg+xml,<svg onload=alert(1)>').props.imageUrl).toBe('');
    expect(resolveComponentProps('marketing/stats-split', { imageUrl: '//evil.example/x.png' })!.props.imageUrl).toBe('');

    const flip = (frontIcon: unknown) => resolveComponentProps('ui/flip-box', { frontIcon })!;
    expect(flip('Rocket').props.frontIcon).toBe('Rocket');
    expect(flip('Zap').props.frontIcon).toBe('Zap');
    expect(resolveIconName(flip('Zap').props.frontIcon as string)).toBe('Lightning');
    expect(flip('not-an-icon').props.frontIcon).toBe('Lightning');
    expect(flip('not-an-icon').issues.length).toBe(1);
  });

  it('every icon used by default content exists in the site icon set', () => {
    const icons = [
      ...SHOWCASE_MANIFESTS['marketing/steps'].defaultProps.steps.map((s: { icon: string }) => s.icon),
      ...SHOWCASE_MANIFESTS['marketing/feature-tabs'].defaultProps.tabs.map((t: { icon: string }) => t.icon),
      SHOWCASE_MANIFESTS['ui/flip-box'].defaultProps.frontIcon,
      // Icons rendered internally by the components.
      'Quotes', 'Pause', 'Play', 'ArrowLeft', 'ArrowRight', 'ArrowUpRight', 'ArrowsClockwise', 'LinkedinLogo', 'XLogo',
      'GithubLogo', 'DribbbleLogo', 'InstagramLogo', 'Globe', 'EnvelopeSimple', 'Sparkle', 'Star', 'Diamond', 'Hexagon',
      'Circle', 'Triangle', 'Square', 'Atom', 'Cube', 'Planet', 'Leaf', 'Lightning', 'GitBranch', 'CheckCircle', 'TrendUp',
      'ChatCircleText', 'Plus', 'Minus'
    ];
    for (const name of icons) expect(resolveIconName(name), name).not.toBeNull();
  });

  it('default copy uses no placeholder text, emoji or Acme jokes', () => {
    const text = JSON.stringify(TYPES.map((t) => SHOWCASE_MANIFESTS[t].defaultProps));
    expect(text).not.toMatch(/lorem|ipsum|acme|\p{Extended_Pictographic}/iu);
  });
});

/* -------------------------------------------------------------------------- */
/* Server render                                                               */
/* -------------------------------------------------------------------------- */

describe('showcase server render (defaults)', () => {
  it.each(TYPES)('%s renders its root with data-node-id and no raw template syntax', async (type) => {
    const html = await ssr(type);
    expect(count(html, `data-node-id="${NODE_ID}"`), type).toBe(1);
    expect(rootTag(html), type).toMatch(type.startsWith('ui/') ? /^<div / : /^<section /);
    expect(html).not.toMatch(/\{[a-z]+\.[a-z]+\}|undefined|NaN|\[object Object\]/);
  });

  it('sections are labelled by their heading', async () => {
    for (const type of TYPES.filter((t) => !t.startsWith('ui/') && t !== 'marketing/marquee')) {
      const html = await ssr(type);
      const id = /aria-labelledby="([^"]+)"/.exec(rootTag(html))?.[1];
      expect(id, type).toBeTruthy();
      expect(html, type).toMatch(new RegExp(`<h2[^>]*id="${id}"`));
    }
  });

  it('testimonial carousel: WAI-ARIA carousel, one visible slide, controls, initials avatars, ratings', async () => {
    const html = await ssr('marketing/testimonial-carousel');
    expect(html).toContain('role="region" aria-roledescription="carousel"');
    expect(count(html, 'aria-roledescription="slide"')).toBe(4);
    expect(html).toContain('aria-label="1 of 4"');
    expect(count(html, /class="slide[^"]*slide--active/g)).toBe(1);
    expect(count(html, ' inert')).toBe(3);
    expect(count(html, 'aria-label="Rated 5 out of 5"')).toBe(4);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-label="Previous testimonial"');
    expect(html).toContain('aria-label="Next testimonial"');
    expect(count(html, 'aria-label="Show testimonial')).toBe(4);
    expect(count(html, 'aria-current="true"')).toBe(1);
    expect(html).not.toContain('automatic slide show');
    expect(html).toContain('>MO<');
    expect(html).toMatch(/background-image: linear-gradient\(135deg, oklch\(0\.54 0\.12 \d+\)/);
    for (const key of ['quote', 'author', 'role', 'company']) expect(html).toContain(`data-prop="testimonials.0.${key}"`);
    for (const key of ['eyebrow', 'heading', 'subheading']) expect(html).toContain(`data-prop="${key}"`);
  });

  it('testimonial carousel: autoplay renders the rotation control first and aria-live off', async () => {
    const html = await ssr('marketing/testimonial-carousel', { autoplay: true });
    expect(html).toContain('aria-label="Stop automatic slide show"');
    expect(html.indexOf('automatic slide show')).toBeLessThan(html.indexOf('Previous testimonial'));
    expect(html).toContain('aria-live="off"');
    const noStars = await ssr('marketing/testimonial-carousel', { showRating: false });
    expect(noStars).not.toContain('Rated 5 out of 5');
    const row = await ssr('marketing/testimonial-carousel', { variant: 'cards-row' });
    expect(row).toContain('tcar--row');
    expect(row).not.toContain('class="quote-mark"');
  });

  it('team: list of members, deterministic gradient initials, labelled social links', async () => {
    const html = await ssr('marketing/team');
    expect(count(html, '<li class="member"')).toBe(4);
    expect(html).toContain('>EM<');
    expect(html).toContain('aria-label="Elena Marsh on LinkedIn"');
    expect(html).toContain('aria-label="Tomás Alvarez on GitHub"');
    const again = await ssr('marketing/team');
    expect(again).toBe(html);
    const gradients = [...html.matchAll(/style="background-image: ([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(gradients).size).toBe(4);
    for (const variant of ['minimal', 'overlay']) {
      const v = await ssr('marketing/team', { variant });
      expect(v).toContain(`team--${variant}`);
      expect(v).toContain('data-prop="members.0.name"');
    }
    const photo = await ssr('marketing/team', { members: [{ name: 'Ada Park', photoSrc: '/team/ada.jpg' }] });
    expect(photo).toMatch(/<img src="\/team\/ada\.jpg" alt="Ada Park" width="640" height="800"/);
  });

  it('steps: ordered list with numbers or icons', async () => {
    const html = await ssr('marketing/steps');
    expect(html).toMatch(/<ol class="steps steps--horizontal steps--many steps--center" style="--count: 4;"/);
    expect(count(html, '<li class="step"')).toBe(4);
    expect(html).toContain('data-prop="steps.3.description"');
    const icons = await ssr('marketing/steps', { numbering: 'icons', layout: 'vertical' });
    expect(icons).toContain('steps--vertical');
    expect(count(icons, '<svg')).toBe(4);
    expect(icons).toContain('Step 01');
  });

  it('timeline: ordered list with dots, dates and tags', async () => {
    const html = await ssr('marketing/timeline');
    expect(html).toContain('timeline--alt');
    expect(count(html, '<li class="event')).toBe(5);
    expect(count(html, 'class="dot" aria-hidden="true"')).toBe(5);
    expect(html).toContain('data-prop="events.0.date"');
    expect(html).toContain('data-prop="events.4.tag"');
    expect(await ssr('marketing/timeline', { layout: 'left' })).not.toContain('timeline--alt');
  });

  it('price list: names, badges, prices and an aria-hidden dotted leader', async () => {
    const html = await ssr('marketing/price-list');
    expect(count(html, '<li class="item')).toBe(6);
    expect(count(html, 'fill fill--leader" aria-hidden="true"')).toBe(6);
    expect(html).toContain('data-prop="items.1.badge"');
    expect(html).not.toContain('<img');
    const plain = await ssr('marketing/price-list', { leader: false, columns: 1 });
    expect(plain).toContain('items--1');
    expect(plain).toContain('items--ruled');
    expect(plain).not.toContain('fill--leader');
  });

  it('flip box: both faces in the accessibility tree, aria-pressed toggle, sanitized CTA', async () => {
    const html = await ssr('ui/flip-box');
    expect(html).toContain('face face--front');
    expect(html).toContain('face face--back');
    expect(html).not.toMatch(/face--(front|back)"[^>]*aria-hidden/);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('Flip card: Instant answers');
    expect(html).toContain('style="--flip-height: 320px;"');
    expect(html).toContain('href="/features"');
    for (const key of ['frontTitle', 'frontText', 'backTitle', 'backText', 'ctaText']) expect(html).toContain(`data-prop="${key}"`);
    const click = await ssr('ui/flip-box', { trigger: 'click', direction: 'vertical', height: 9999 });
    expect(click).toContain('flip--click');
    expect(click).toContain('flip--vertical');
    expect(click).toContain('--flip-height: 320px');
  });

  it('cta box: placeholder visual by default, every image position and the ribbon', async () => {
    const html = await ssr('ui/cta-box');
    expect(html).toContain('cta-box--right');
    expect(html).toContain('class="placeholder" aria-hidden="true"');
    expect(html).toMatch(/<h2 class="title" data-prop="title">/);
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/pricing"');
    expect(html).not.toContain('ribbon');
    const ribbon = await ssr('ui/cta-box', { ribbon: 'Limited offer', variant: 'dark', imagePosition: 'none' });
    expect(ribbon).toContain('data-prop="ribbon">Limited offer<');
    expect(ribbon).toContain('cta-box--dark');
    expect(ribbon).not.toContain('class="media');
    const bg = await ssr('ui/cta-box', { imagePosition: 'background', imageUrl: 'https://cdn.example.com/office.jpg' });
    expect(bg).toMatch(/<div class="backdrop" aria-hidden="true"><img src="https:\/\/cdn\.example\.com\/office\.jpg" alt=""/);
  });

  it('marquee: duplicated track with an aria-hidden copy and editable first copy only', async () => {
    const html = await ssr('marketing/marquee');
    expect(count(html, '<ul class="group"')).toBe(2);
    expect(count(html, 'class="group" aria-hidden="true"')).toBe(1);
    expect(count(html, 'data-prop="items.0"')).toBe(1);
    expect(count(html, 'Real-time collaboration')).toBe(2);
    expect(html).toContain('style="--duration: 32s;"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('marquee--fade');
    const logos = await ssr('marketing/marquee', { variant: 'logos', direction: 'right', speed: 'fast', fadeEdges: false });
    expect(count(logos, 'class="wordmark"')).toBe(16);
    expect(logos).toContain('marquee--reverse');
    expect(logos).toContain('--duration: 20s');
    expect(logos).not.toContain('marquee--fade');
  });

  it('feature tabs: vertical tablist with roving tabindex and one visible panel', async () => {
    const html = await ssr('marketing/feature-tabs');
    expect(html).toContain('role="tablist" aria-orientation="vertical"');
    expect(count(html, 'role="tab"')).toBe(4);
    expect(count(html, 'aria-selected="true"')).toBe(1);
    expect(count(html, 'tabindex="-1"')).toBe(3);
    expect(count(html, 'role="tabpanel"')).toBe(4);
    expect(count(html, /role="tabpanel"[^>]*hidden/g)).toBe(3);
    expect(html).toContain('role="img" aria-label="Plan in one place: illustrative product preview"');
    expect(html).toContain('data-prop="tabs.0.description"');
    const image = await ssr('marketing/feature-tabs', { tabs: [{ title: 'Roadmaps', imageSrc: '/shots/roadmap.png' }] });
    expect(image).toMatch(/<img src="\/shots\/roadmap\.png" alt="Roadmaps"/);
  });

  it('stats split: description list of stats, link and visual', async () => {
    const html = await ssr('marketing/stats-split');
    expect(html).toContain('<dl class="stats">');
    expect(count(html, '<dt class="label"')).toBe(4);
    expect(count(html, '<dd class="value"')).toBe(4);
    expect(html).toContain('href="/features"');
    expect(html).toContain('class="placeholder" aria-hidden="true"');
    expect(await ssr('marketing/stats-split', { imagePosition: 'left' })).toContain('layout--media-left');
  });

  it('faq split: accordion with the first item open and labelled regions', async () => {
    const html = await ssr('marketing/faq-split');
    expect(count(html, '<h3 class="question">')).toBe(5);
    expect(count(html, 'aria-expanded="true"')).toBe(1);
    expect(count(html, 'aria-expanded="false"')).toBe(4);
    expect(count(html, 'role="region"')).toBe(5);
    expect(count(html, /role="region"[^>]*hidden/g)).toBe(4);
    expect(html).toContain('href="mailto:support@example.com"');
  });
});

/* -------------------------------------------------------------------------- */
/* Generated avatar colors                                                     */
/* -------------------------------------------------------------------------- */

/** OKLCH → relative luminance (sRGB, gamut-clipped like a browser would). */
function oklchLuminance(l: number, c: number, hDeg: number): number {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (v: number) => Math.min(1, Math.max(0, v));
  const r = clip(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_);
  const g = clip(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_);
  const bl = clip(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_);
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

const contrastWithWhite = (y: number) => 1.05 / (y + 0.05);
const NAMES = ['Maya Okafor', 'Daniel Reyes', 'Priya Natarajan', 'Jonas Whitfield', 'Elena Marsh', 'Tomás Alvarez', 'Aisha Bello', 'Kenji Morita', 'Zoë Kowalski', 'Li Wei', 'Omar Haddad', 'Sofia Rossi', 'Noah Kim', 'Amara Nwosu', 'Lucas Martin', 'Hana Sato'];

describe('generated initials backgrounds', () => {
  it('testimonial avatars keep >= 4.5:1 contrast for white initials on every stop', async () => {
    const html = await ssr('marketing/testimonial-carousel', { testimonials: NAMES.map((author) => ({ quote: 'q', author })), variant: 'cards-row' });
    const stops = [...html.matchAll(/oklch\(([\d.]+) ([\d.]+) (\d+)\)/g)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    expect(stops.length).toBe(NAMES.length * 2);
    for (const [l, c, h] of stops) expect(contrastWithWhite(oklchLuminance(l, c, h)), `oklch(${l} ${c} ${h})`).toBeGreaterThanOrEqual(4.5);
    expect(new Set(stops.map((s) => s[2])).size).toBeGreaterThan(4);
  });

  it('team placeholders keep >= 3:1 (large text) contrast on both gradient stops and are deterministic', async () => {
    const members = NAMES.map((name) => ({ name }));
    const html = await ssr('marketing/team', { members });
    const stops = [...html.matchAll(/linear-gradient\(150deg, oklch\(([\d.]+) ([\d.]+) (\d+)\), oklch\(([\d.]+) ([\d.]+) (\d+)\)\)/g)];
    expect(stops.length).toBe(NAMES.length);
    for (const m of stops) {
      expect(contrastWithWhite(oklchLuminance(Number(m[1]), Number(m[2]), Number(m[3]))), m[0]).toBeGreaterThanOrEqual(3);
      expect(contrastWithWhite(oklchLuminance(Number(m[4]), Number(m[5]), Number(m[6]))), m[0]).toBeGreaterThanOrEqual(3);
    }
    expect(await ssr('marketing/team', { members })).toBe(html);
  });
});

/* -------------------------------------------------------------------------- */
/* Security                                                                    */
/* -------------------------------------------------------------------------- */

const HOSTILE = '<script>alert(1)</script><img src=x onerror=alert(1)>';

describe('showcase security', () => {
  it.each(TYPES)('%s escapes hostile text in every string prop', async (type) => {
    const manifest = SHOWCASE_MANIFESTS[type];
    const poison = (value: unknown, key = ''): unknown => {
      if (typeof value === 'string') return /href$|src$|url$|icon$/i.test(key) ? value : HOSTILE;
      if (Array.isArray(value)) return value.map((v) => poison(v, key));
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, poison(v, k)]));
      return value;
    };
    const html = await ssr(type, poison(structuredClone(manifest.defaultProps)) as Record<string, unknown>);
    expect(html).not.toContain('<script>alert');
    expect(html).not.toMatch(/<img src=x/);
    expect(html).toContain('&lt;script>alert(1)&lt;/script>');
  });

  it('sanitizes every href and image URL', async () => {
    const js = 'javascript:alert(1)';
    const outputs = await Promise.all([
      ssr('ui/flip-box', { ctaHref: js }),
      ssr('ui/cta-box', { primaryCtaHref: js, secondaryCtaHref: 'vbscript:x', imageUrl: js }),
      ssr('marketing/stats-split', { ctaHref: '//evil.example', imageUrl: js }),
      ssr('marketing/faq-split', { ctaHref: js }),
      ssr('marketing/team', { members: [{ name: 'Eve', photoSrc: js, links: [{ network: 'x', href: js }] }] }),
      ssr('marketing/testimonial-carousel', { testimonials: [{ quote: 'q', author: 'Eve', avatarSrc: js }] }),
      ssr('marketing/price-list', { items: [{ name: 'n', price: '$1', imageSrc: js }] }),
      ssr('marketing/feature-tabs', { tabs: [{ title: 't', imageSrc: 'data:image/svg+xml,<svg onload=alert(1)>' }] }),
      ssr('marketing/marquee', { variant: 'logos', logos: [{ name: 'L', imageUrl: js }] })
    ]);
    for (const html of outputs) {
      expect(html.toLowerCase()).not.toContain('javascript:');
      expect(html.toLowerCase()).not.toContain('vbscript:');
      expect(html).not.toContain('//evil.example');
      expect(html).not.toContain('onload=');
      expect(html).not.toMatch(/<img[^>]*src=""/);
    }
    expect(outputs[0]).toContain('href="#"');
    expect(outputs[4]).toContain('href="#"');
    expect(outputs[4]).toContain('>E<');
  });
});
