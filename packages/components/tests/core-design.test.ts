/**
 * Core design system: default theme + presets (tokens.ts) stay in sync with the site runtime
 * defaults (runtime.css), every preset passes WCAG AA for its text roles, fonts load the same in
 * canvas and export, and the 25 core components server-render accessible, escaped markup.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import {
  DEFAULT_LIGHT_COLORS,
  DEFAULT_DARK_COLORS,
  DEFAULT_FONTS,
  DEFAULT_RADII,
  DEFAULT_SHADOWS,
  DEFAULT_SPACING,
  DesignTokensSchema,
  THEME_PRESETS,
  MD3_THEME_PRESETS,
  LEGACY_THEME_PRESET_IDS,
  createDefaultAcmeSaaSProject,
  composeNodesFromPrompt
} from '@app-viz/schema';
import { googleFontsHref } from '@app-viz/engine';
import { CORE_MANIFESTS } from '../src/manifests/core.js';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVELTE_DIR = path.join(PKG_ROOT, 'src/svelte');
const RUNTIME = fs.readFileSync(path.join(SVELTE_DIR, 'runtime.css'), 'utf8');

/* -------------------------------------------------------------------------- */
/* Contrast helpers (WCAG 2.x relative luminance)                              */
/* -------------------------------------------------------------------------- */

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`Not a 6-digit hex color: ${hex}`);
  const n = Number.parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Runtime default `--md-sys-<prefix>-<name>: value;` declarations from the first :where(.site-root) block. */
function runtimeDefaults(prefix: string): Record<string, string> {
  const block = RUNTIME.slice(RUNTIME.indexOf(':where(.site-root) {'), RUNTIME.indexOf('}', RUNTIME.indexOf(':where(.site-root) {')));
  const out: Record<string, string> = {};
  for (const m of block.matchAll(new RegExp(`--md-sys-${prefix}-([a-z0-9-]+):\\s*([^;]+);`, 'g'))) {
    if (prefix === 'font' && !['heading', 'body', 'mono'].includes(m[1])) continue;
    out[m[1]] = m[2].trim();
  }
  return out;
}

describe('default theme', () => {
  it('runtime.css defaults mirror tokens.ts exactly (colors, fonts, radii, shadows, spacing)', () => {
    expect(runtimeDefaults('color')).toEqual(DEFAULT_LIGHT_COLORS);
    expect(runtimeDefaults('shape-corner')).toEqual(DEFAULT_RADII);
    expect(runtimeDefaults('elevation')).toEqual(DEFAULT_SHADOWS);
    expect(runtimeDefaults('spacing')).toEqual(DEFAULT_SPACING);
    expect(runtimeDefaults('font')).toEqual({ ...DEFAULT_FONTS });
  });

  it('schema defaults and the demo project use the default theme', () => {
    const parsed = DesignTokensSchema.parse({});
    expect(parsed.colors).toEqual(DEFAULT_LIGHT_COLORS);
    expect(parsed.fonts).toEqual({ ...DEFAULT_FONTS });
    const demo = createDefaultAcmeSaaSProject().tokens;
    expect(demo.colors).toEqual(DEFAULT_LIGHT_COLORS);
    expect(demo.fonts).toEqual({ ...DEFAULT_FONTS });
    expect(demo.radii).toEqual(DEFAULT_RADII);
    expect(demo.shadows).toEqual(DEFAULT_SHADOWS);
  });

  it('uses Inter (optical sizes, variable weights) + JetBrains Mono from the same URL in canvas and export', () => {
    expect(googleFontsHref(DEFAULT_FONTS)).toBe(
      'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&family=JetBrains+Mono:wght@400;500;600&display=swap'
    );
    expect(DEFAULT_FONTS.heading.startsWith('Inter,')).toBe(true);
    expect(DEFAULT_FONTS.body).toContain('system-ui');
  });

  it('keeps project tokens authoritative: runtime defaults are zero-specificity', () => {
    expect(RUNTIME.trimStart().startsWith('/*')).toBe(true);
    expect(RUNTIME).toMatch(/^:where\(\.site-root\) \{\n {2}\/\* Color roles/m);
    expect(RUNTIME).not.toMatch(/^\.site-root\s*\{/m);
    // No legacy brand values left in the runtime.
    expect(RUNTIME).not.toMatch(/0B57D0|Roboto|Material Design|MD3/i);
  });
});

describe('theme presets', () => {
  const presets = Object.entries(THEME_PRESETS);

  it('lists six distinct, neutrally named presets with complete role maps', () => {
    expect(presets.map(([, p]) => p.label)).toEqual(['Neutral', 'Midnight', 'Emerald', 'Violet', 'Sunset', 'Graphite']);
    const keys = Object.keys(DEFAULT_LIGHT_COLORS).sort();
    for (const [id, preset] of presets) {
      expect(Object.keys(preset.colors).sort(), id).toEqual(keys);
      expect(`${preset.label} ${preset.description ?? ''}`, id).not.toMatch(/Google|Material|MD3|Elementor/i);
    }
    expect(new Set(presets.map(([, p]) => p.colors.primary)).size).toBe(presets.length);
    expect(THEME_PRESETS.midnight.colors).toBe(DEFAULT_DARK_COLORS);
  });

  it('keeps legacy preset ids resolvable but out of preset pickers', () => {
    for (const [legacy, id] of Object.entries(LEGACY_THEME_PRESET_IDS)) {
      expect(THEME_PRESETS[legacy], legacy).toBe(THEME_PRESETS[id]);
      expect(Object.keys(THEME_PRESETS)).not.toContain(legacy);
    }
    expect(MD3_THEME_PRESETS).toBe(THEME_PRESETS);
    const suggested = composeNodesFromPrompt('AI agent hero with pricing').suggestedThemeId;
    expect(suggested && THEME_PRESETS[suggested]).toBeTruthy();
  });

  /** [foreground, background, minimum ratio] role pairs every preset must satisfy. */
  const PAIRS: Array<[string, string, number]> = [
    ['on-surface', 'surface', 4.5],
    ['on-surface', 'surface-container-low', 4.5],
    ['on-surface', 'surface-container-high', 4.5],
    ['on-surface-variant', 'surface', 4.5],
    ['on-surface-variant', 'surface-container-low', 4.5],
    ['on-surface-variant', 'surface-container', 4.5],
    ['primary', 'surface', 4.5],
    ['primary', 'surface-container-low', 4.5],
    ['on-primary', 'primary', 4.5],
    ['on-primary', 'primary-hover', 4.5],
    ['on-primary-container', 'primary-container', 4.5],
    ['on-secondary', 'secondary', 4.5],
    ['on-secondary-container', 'secondary-container', 4.5],
    ['on-tertiary', 'tertiary', 4.5],
    ['on-tertiary-container', 'tertiary-container', 4.5],
    ['on-error', 'error', 4.5],
    ['on-error-container', 'error-container', 4.5],
    ['error', 'surface', 4.5],
    ['on-success', 'success', 4.5],
    ['on-success-container', 'success-container', 4.5],
    ['on-warning', 'warning', 4.5],
    ['on-warning-container', 'warning-container', 4.5],
    ['inverse-on-surface', 'inverse-surface', 4.5],
    ['outline-strong', 'surface', 3],
    ['outline-strong', 'surface-container-low', 3]
  ];

  for (const [id, preset] of Object.entries(THEME_PRESETS)) {
    it(`${preset.label} passes WCAG AA for text and control roles`, () => {
      for (const [fg, bg, min] of PAIRS) {
        const ratio = contrast(preset.colors[fg], preset.colors[bg]);
        expect(ratio, `${id}: ${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
      }
    });
  }
});

/* -------------------------------------------------------------------------- */
/* Server-render harness (compiles the canonical .svelte files to a temp dir)  */
/* -------------------------------------------------------------------------- */

const req = createRequire(path.join(PKG_ROOT, 'package.json'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compiler = req('svelte/compiler') as typeof import('svelte/compiler');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'appviz-core-ssr-'));
const compiled = new Map<string, string>();

function compileToTemp(relFile: string): string {
  const cached = compiled.get(relFile);
  if (cached) return cached;
  const source = fs.readFileSync(path.join(SVELTE_DIR, relFile), 'utf8');
  const { js } = compiler.compile(source, { generate: 'server', filename: path.basename(relFile), runes: true });
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
const modules = new Map<string, Component<any>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function load(name: string): Promise<Component<any>> {
  const hit = modules.get(name);
  if (hit) return hit;
  const mod = (await import(/* @vite-ignore */ pathToFileURL(compileToTemp(`${name}.svelte`)).href)) as { default: Component };
  modules.set(name, mod.default);
  return mod.default;
}

async function ssr(type: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const manifest = CORE_MANIFESTS[type];
  const component = await load(manifest.component);
  const props = { ...structuredClone(manifest.defaultProps), ...overrides, 'data-node-id': 'node-1' };
  return render(component, { props }).body;
}

/** Replaces every string leaf with `text`, and every *Href / *Url leaf with `url`. */
function poison(value: unknown, text: string, url: string, key = ''): unknown {
  if (typeof value === 'string') return /href$|url$/i.test(key) ? url : text;
  if (Array.isArray(value)) return value.map((v) => poison(v, text, url, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, poison(v, text, url, k)]));
  }
  return value;
}

const ENUM_KEYS = new Set(['align', 'visual', 'variant', 'size', 'tone', 'mode', 'maxWidth', 'direction', 'justify', 'textAlign', 'alignItems', 'justifyItems', 'surfaceTone', 'paddingY', 'spacing', 'trend', 'gap', 'activeNav', 'icon']);

describe('core components (server render)', () => {
  it.each(Object.keys(CORE_MANIFESTS))('%s renders defaults with data-node-id on the root and escapes hostile text', async (type) => {
    const html = await ssr(type);
    expect(html).toContain('data-node-id="node-1"');
    expect(html).not.toMatch(/\p{Emoji_Presentation}/u);

    const manifest = CORE_MANIFESTS[type];
    const hostile = poison(structuredClone(manifest.defaultProps), '<img src=x onerror=alert(1)>', 'javascript:alert(1)') as Record<string, unknown>;
    for (const key of Object.keys(hostile)) if (ENUM_KEYS.has(key)) hostile[key] = manifest.defaultProps[key];
    const evil = await ssr(type, hostile);
    expect(evil).not.toContain('<img src=x');
    expect(evil.toLowerCase()).not.toContain('javascript:');
    if (Object.entries(manifest.defaultProps).some(([k, v]) => !ENUM_KEYS.has(k) && typeof v === 'string' && v !== '' && !/href$|url$/i.test(k))) {
      expect(evil).toContain('&lt;img src=x onerror=alert(1)>');
    }
  });

  it('SplitHero: h1, badge, reassurance line, CTAs and an aria-hidden product preview with a unique gradient id', async () => {
    const html = await ssr('hero/split-hero');
    expect(html).toMatch(/<section[^>]*data-node-id="node-1"/);
    expect(html).toMatch(/<h1[^>]*data-prop="title"[^>]*>Know what changed/);
    expect(html).toContain('data-prop="badgeText"');
    expect(html).toContain('data-prop="proofText"');
    expect(html).toMatch(/class="visual[^"]*" aria-hidden="true"/);
    expect(html).toMatch(/<a href="\/dashboard" class="md-btn md-btn--lg md-btn--filled[^"]*"/);
    expect(html).toMatch(/<a href="\/pricing" class="md-btn md-btn--lg md-btn--outlined[^"]*"/);
    const gradient = /linearGradient id="([^"]+)-fill"/.exec(html)?.[1];
    expect(gradient).toBeTruthy();
    expect(html).toContain(`url(#${gradient}-fill)`);
    // The preview is decorative: it contains no text nodes.
    const visual = html.slice(html.lastIndexOf('<', html.indexOf('class="visual')), html.lastIndexOf('</section>'));
    expect(visual.replace(/<[^>]+>/g, '').replace(/<!--[\s\S]*?-->/g, '').trim()).toBe('');

    const plain = await ssr('hero/split-hero', { visual: 'none', badgeText: '', proofText: '' });
    expect(plain).not.toContain('linearGradient');
    expect(plain).not.toContain('data-prop="badgeText"');
    expect(plain).not.toContain('data-prop="proofText"');
  });

  it('Navbar: labelled primary nav, collapsed mobile disclosure and sanitized links', async () => {
    const html = await ssr('navigation/navbar');
    expect(html).toMatch(/<header[^>]*data-node-id="node-1"/);
    expect(html).toContain('aria-label="Primary"');
    expect(html).toMatch(/aria-expanded="false"[^>]*aria-controls="[^"]+-menu"/);
    expect(html).toMatch(/<nav id="[^"]+-menu" class="mobile-menu[^"]*" aria-label="Mobile" hidden/);
    expect(html).toContain('data-prop="links.0.label"');
    const evil = await ssr('navigation/navbar', { links: [{ label: 'x', href: 'javascript:alert(1)' }], logoUrl: 'data:text/html,x' });
    expect(evil).toContain('href="#"');
    expect(evil).not.toContain('<img');
  });

  it('FeatureGrid: section header and one card per feature with icon tile', async () => {
    const html = await ssr('marketing/feature-grid');
    expect(html).toMatch(/<h2 class="md-section-title"[^>]*>Everything your team needs/);
    expect(html.match(/<article class="card/g)?.length).toBe(3);
    expect(html.match(/md-icon-tile/g)?.length).toBe(3);
    expect(html).toContain('data-prop="features.2.description"');
  });

  it('Button: link vs button, trailing icon, variant classes', async () => {
    expect(await ssr('ui/button')).toMatch(/<button[^>]*type="button" class="md-btn md-btn--md md-btn--filled/);
    const link = await ssr('ui/button', { href: '/pricing', variant: 'outline', size: 'lg', icon: 'ArrowRight' });
    expect(link).toMatch(/<a[^>]*href="\/pricing" class="md-btn md-btn--lg md-btn--outlined/);
    expect(link).toContain('<svg');
    expect(await ssr('ui/button', { href: 'javascript:alert(1)' })).toContain('href="#"');
  });

  it('Badge, Alert, Card, Divider, Tabs render their accessible structure', async () => {
    expect(await ssr('ui/badge', { tone: 'success', dot: true })).toMatch(/class="md-badge tone-success[^"]*"[\s\S]*class="md-dot"/);
    expect(await ssr('ui/alert', { tone: 'error' })).toMatch(/role="alert"/);
    expect(await ssr('ui/alert', { tone: 'info' })).toMatch(/role="status"/);
    expect(await ssr('ui/alert', { dismissible: true })).toContain('aria-label="Dismiss alert"');
    const card = await ssr('ui/card');
    expect(card).toContain('md-icon-tile');
    expect(card).toMatch(/<a href="\/features" class="cta/);
    expect(await ssr('ui/card', { icon: '' })).not.toContain('md-icon-tile');
    expect(await ssr('structure/divider', { label: 'or' })).toContain('data-prop="label"');
    const tabs = await ssr('ui/tabs');
    expect(tabs).toContain('role="tablist"');
    expect(tabs.match(/role="tab"/g)?.length).toBe(3);
    expect(tabs).toMatch(/aria-selected="true"[^>]*tabindex="0"/);
    expect(tabs).toContain('role="tabpanel"');
  });

  it('Section supports the inverse tone and keeps layout styles on the inner container', async () => {
    const html = await ssr('structure/section', { surfaceTone: 'inverse' });
    expect(html).toMatch(/<section[^>]*class="section tone-inverse pad-lg/);
    expect(html).toContain('data-layout-of="node-1"');
  });
});
