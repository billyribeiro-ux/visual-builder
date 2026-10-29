import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { GENERAL_MANIFESTS, SOCIAL_NETWORKS, ANNOUNCEMENT_ICONS } from '../src/manifests/general.js';
import { ICON_PATHS, getManifest, resolveComponentProps } from '../src/index.js';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVELTE_DIR = path.join(PKG_ROOT, 'src/svelte');
const REPO_ROOT = path.resolve(PKG_ROOT, '../..');
const PHOSPHOR_LIB = path.join(REPO_ROOT, 'apps/studio/node_modules/phosphor-svelte/lib');
const req = createRequire(path.join(PKG_ROOT, 'package.json'));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const compiler = req('svelte/compiler') as typeof import('svelte/compiler');

/* -------------------------------------------------------------------------- */
/* Server-render harness: compiles the canonical .svelte files with the Svelte */
/* compiler (generate: 'server') into a temp dir, rewriting imports to absolute */
/* paths, so `svelte/server` can render them without a Vite Svelte plugin.      */
/* -------------------------------------------------------------------------- */

const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'appviz-general-ssr-'));
const compiled = new Map<string, string>();

function compileToTemp(relFile: string): string {
  const cachedPath = compiled.get(relFile);
  if (cachedPath) return cachedPath;
  const source = fs.readFileSync(path.join(SVELTE_DIR, relFile), 'utf8');
  const { js } = compiler.compile(source, { generate: 'server', filename: path.basename(relFile), runes: true });
  const outFile = path.join(OUT_DIR, `${relFile.replace(/[\\/]/g, '__')}.js`);
  compiled.set(relFile, outFile);
  const code = js.code.replace(/(from\s+|import\s+)(['"])([^'"]+)\2/g, (_match, lead: string, quote: string, spec: string) => {
    let target: string;
    if (spec.startsWith('.')) {
      const rel = path.join(path.dirname(relFile), spec);
      if (spec.endsWith('.svelte')) target = compileToTemp(rel);
      else target = path.join(SVELTE_DIR, rel.replace(/\.js$/, '.ts'));
    } else {
      target = req.resolve(spec);
    }
    return `${lead}${quote}${target}${quote}`;
  });
  fs.writeFileSync(outFile, code);
  return outFile;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModule = { default: Component<any> } & Record<string, unknown>;
const modules = new Map<string, AnyModule>();

async function load(name: string): Promise<AnyModule> {
  const hit = modules.get(name);
  if (hit) return hit;
  const mod = (await import(/* @vite-ignore */ pathToFileURL(compileToTemp(`${name}.svelte`)).href)) as AnyModule;
  modules.set(name, mod);
  return mod;
}

async function ssr(name: string, props: Record<string, unknown> = {}): Promise<string> {
  const mod = await load(name);
  // Hydration markers (<!--[-->, <!--$s1-->) are irrelevant to these assertions.
  return render(mod.default, { props }).body.replace(/<!--[\s\S]*?-->/g, '');
}

/** Validated props, exactly as the canvas and the export feed them to the component. */
function resolved(type: string, raw: Record<string, unknown>): Record<string, unknown> {
  const result = resolveComponentProps(type, raw);
  if (!result) throw new Error(`unknown type ${type}`);
  return result.props;
}

function defaults(type: string): Record<string, unknown> {
  return structuredClone(GENERAL_MANIFESTS[type].defaultProps) as Record<string, unknown>;
}

async function ssrDefaults(type: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const manifest = GENERAL_MANIFESTS[type];
  return ssr(manifest.component, resolved(type, { ...defaults(type), ...overrides }));
}

function count(haystack: string, needle: string | RegExp): number {
  const re = typeof needle === 'string' ? new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g') : needle;
  return haystack.match(re)?.length ?? 0;
}

function attr(html: string, name: string, value: string): boolean {
  return html.includes(`${name}="${value}"`);
}

beforeAll(async () => {
  // Compile everything once up front so a compile error fails loudly here.
  for (const manifest of Object.values(GENERAL_MANIFESTS)) await load(manifest.component);
});

afterAll(() => {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
});

const EXPECTED = {
  'ui/accordion': 'Accordion',
  'ui/counter': 'Counter',
  'ui/progress-bar': 'ProgressBar',
  'ui/star-rating': 'StarRating',
  'ui/social-icons': 'SocialIcons',
  'ui/countdown': 'Countdown',
  'ui/animated-headline': 'AnimatedHeadline',
  'navigation/breadcrumbs': 'Breadcrumbs',
  'site/announcement-bar': 'AnnouncementBar',
  'ui/billing-toggle': 'BillingToggle',
  'ui/modal-button': 'ModalButton'
} as const;

/* -------------------------------------------------------------------------- */
/* Manifests                                                                   */
/* -------------------------------------------------------------------------- */

describe('general manifests', () => {
  it('registers exactly the eleven general components with matching files', () => {
    expect(Object.keys(GENERAL_MANIFESTS).sort()).toEqual(Object.keys(EXPECTED).sort());
    for (const [type, component] of Object.entries(EXPECTED)) {
      const manifest = getManifest(type);
      expect(manifest, type).toBeDefined();
      expect(manifest!.component).toBe(component);
      expect(type.startsWith(`${manifest!.category}/`), type).toBe(true);
      expect(fs.existsSync(path.join(SVELTE_DIR, `${component}.svelte`)), component).toBe(true);
    }
  });

  it('defaultProps validate, and an empty props object resolves without issues', () => {
    for (const [type, manifest] of Object.entries(GENERAL_MANIFESTS)) {
      const parsed = manifest.propsSchema.safeParse(manifest.defaultProps);
      expect(parsed.success, type).toBe(true);
      expect(parsed.data, type).toEqual(manifest.defaultProps);
      const empty = resolveComponentProps(type, {})!;
      expect(empty.issues, type).toEqual([]);
      // Every default prop key is declared in the schema.
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, unknown> }).shape;
      for (const key of Object.keys(manifest.defaultProps)) expect(Object.keys(shape), `${type}.${key}`).toContain(key);
    }
  });

  it('studio icons exist in phosphor-svelte and propControls only reference schema keys', () => {
    for (const [type, manifest] of Object.entries(GENERAL_MANIFESTS)) {
      if (fs.existsSync(PHOSPHOR_LIB)) {
        expect(fs.existsSync(path.join(PHOSPHOR_LIB, `${manifest.icon}Icon.svelte`)), `${type} icon ${manifest.icon}`).toBe(true);
      }
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, unknown> }).shape;
      for (const [key, control] of Object.entries(manifest.propControls ?? {})) {
        expect(Object.keys(shape), `${type}.propControls.${key}`).toContain(key);
        for (const option of control.options ?? []) expect(option.label.length, `${type}.${key}`).toBeGreaterThan(0);
      }
      expect(manifest.behaviour!.length, type).toBeGreaterThanOrEqual(2);
    }
  });

  it('falls back per prop instead of crashing on hostile or partial input', () => {
    const r = resolveComponentProps('ui/progress-bar', { value: 250, tone: 'rainbow', label: 'Kept' })!;
    expect(r.props).toMatchObject({ value: 72, tone: 'primary', label: 'Kept' });
    const a = resolveComponentProps('ui/accordion', { items: [{ title: 'Only title' }, 'junk', { content: 7 }] })!;
    expect(a.props.items).toEqual([{ title: 'Only title', content: '' }]);
    const s = resolveComponentProps('ui/social-icons', { items: [{ network: 'myspace', href: '/x' }, { network: 'github' }] })!;
    expect(s.props.items).toEqual([{ network: 'github', href: '', label: '' }]);
    expect(resolveComponentProps('ui/counter', { end: Number.POSITIVE_INFINITY })!.props.end).toBe(12500);
    expect(resolveComponentProps('ui/star-rating', { max: 0 })!.props.max).toBe(5);
  });

  it('every inline icon a component can render exists in lib/icons.ts', () => {
    const used = [
      'CaretDown',
      'Plus',
      'Minus',
      'X',
      'ArrowRight',
      'DotsThree',
      'House',
      'CaretRight',
      'LinkedinLogo',
      'XLogo',
      'GithubLogo',
      'YoutubeLogo',
      'InstagramLogo',
      'FacebookLogo',
      'TiktokLogo',
      'DribbbleLogo',
      'DiscordLogo',
      'SlackLogo',
      'MediumLogo',
      'ThreadsLogo',
      'EnvelopeSimple',
      'Globe',
      'Rss',
      ...ANNOUNCEMENT_ICONS.filter((name) => name !== 'none')
    ];
    for (const name of used) expect(ICON_PATHS[name], name).toBeDefined();
    expect(SOCIAL_NETWORKS.length).toBe(15);
  });
});

/* -------------------------------------------------------------------------- */
/* Server render with defaults                                                 */
/* -------------------------------------------------------------------------- */

describe('Accordion', () => {
  it('renders the WAI-ARIA accordion pattern with the first panel open', async () => {
    const html = await ssrDefaults('ui/accordion');
    expect(count(html, '<h3')).toBe(3);
    expect(count(html, 'aria-expanded="true"')).toBe(1);
    expect(count(html, 'aria-expanded="false"')).toBe(2);
    expect(count(html, 'role="region"')).toBe(3);
    // aria-controls points at the panel and the panel is labelled by its trigger.
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)].map((m) => m[1]);
    const triggers = [...html.matchAll(/<button[^>]*\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(controls.length).toBe(3);
    for (const [i, id] of controls.entries()) {
      expect(html).toContain(`id="${id}"`);
      expect(html).toContain(`aria-labelledby="${triggers[i]}"`);
    }
    expect(html).toContain('data-prop="items.0.title"');
    expect(html).toContain('data-prop="items.2.content"');
    expect(html).toContain('How long does onboarding take?');
  });

  it('supports defaultOpen -1, heading level and the plus indicator', async () => {
    const html = await ssrDefaults('ui/accordion', { defaultOpen: -1, headingLevel: 'h4', iconStyle: 'plus', variant: 'minimal' });
    expect(count(html, 'aria-expanded="true"')).toBe(0);
    expect(count(html, '<h4')).toBe(3);
    expect(html).toContain('glyph--minus');
    expect(html).toContain('accordion--minimal');
    expect(await ssrDefaults('ui/accordion', { defaultOpen: 9 })).not.toContain('aria-expanded="true"');
    expect(await ssr('Accordion', { items: undefined })).toContain('class="accordion');
  });
});

describe('Counter', () => {
  it('server-renders the formatted final value, label and affixes', async () => {
    const html = await ssrDefaults('ui/counter');
    expect(html).toContain('12,500');
    expect(html).not.toMatch(/>0</);
    expect(html).toContain('data-prop="suffix"');
    expect(html).toContain('data-prop="label"');
    expect(html).toContain('Teams onboarded');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('visually-hidden');
  });

  it('formats separators, decimals, prefixes and negatives deterministically', async () => {
    expect(await ssrDefaults('ui/counter', { end: 12500.5, decimals: 2, separator: 'period', prefix: '$' })).toContain('12.500,50');
    expect(await ssrDefaults('ui/counter', { end: 1234567, separator: 'space' })).toContain('1 234 567');
    expect(await ssrDefaults('ui/counter', { end: 98.6, decimals: 1, separator: 'none', suffix: '%' })).toContain('98.6');
    expect(await ssrDefaults('ui/counter', { end: -4200, separator: 'apostrophe' })).toContain('-4’200');
    expect(await ssrDefaults('ui/counter', { prefix: '$' })).toContain('data-prop="prefix"');
  });
});

describe('ProgressBar', () => {
  it('renders an accessible progressbar labelled by the visible label', async () => {
    const html = await ssrDefaults('ui/progress-bar');
    expect(html).toContain('role="progressbar"');
    expect(attr(html, 'aria-valuenow', '72')).toBe(true);
    expect(attr(html, 'aria-valuemin', '0')).toBe(true);
    expect(attr(html, 'aria-valuemax', '100')).toBe(true);
    expect(attr(html, 'aria-valuetext', '72%')).toBe(true);
    const labelId = /<span class="label[^"]*" id="([^"]+)"/.exec(html)?.[1];
    expect(labelId).toBeTruthy();
    expect(html).toContain(`aria-labelledby="${labelId}"`);
    expect(html).toContain('width: 72%');
    expect(html).toContain('data-prop="label"');
  });

  it('clamps out-of-range values when used directly and falls back to aria-label without a label', async () => {
    expect(await ssr('ProgressBar', { value: 180 })).toContain('aria-valuenow="100"');
    expect(await ssr('ProgressBar', { value: -20 })).toContain('aria-valuenow="0"');
    expect(await ssr('ProgressBar', { value: Number.NaN })).toContain('aria-valuenow="0"');
    const unlabelled = await ssr('ProgressBar', { label: '', showValue: false });
    expect(unlabelled).toContain('aria-label="Progress"');
    expect(unlabelled).not.toContain('aria-labelledby');
    expect(await ssrDefaults('ui/progress-bar', { striped: true, tone: 'warning' })).toMatch(/progress--striped[\s\S]*tone-warning|tone-warning[\s\S]*progress--striped/);
  });
});

describe('StarRating', () => {
  it('renders partial fills with a text alternative', async () => {
    const html = await ssrDefaults('ui/star-rating');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Rated 4.8 out of 5 stars"');
    expect(count(html, /class="star[\s"]/g)).toBe(5);
    expect(html).toContain('width: 80%');
    expect(count(html, 'width: 100%')).toBe(4);
    expect(html).toContain('data-prop="label"');
  });

  it('clamps the rating and star count', async () => {
    expect(await ssr('StarRating', { rating: 9, max: 5, label: '' })).toContain('Rated 5 out of 5 stars');
    expect(await ssr('StarRating', { rating: -3 })).toContain('Rated 0 out of 5 stars');
    const ten = await ssr('StarRating', { rating: 7.5, max: 10 });
    expect(count(ten, /class="star[\s"]/g)).toBe(10);
    expect(ten).toContain('width: 50%');
    expect(await ssr('StarRating', { max: 40 })).toContain('out of 10 stars');
  });
});

describe('SocialIcons', () => {
  it('renders named links that open external profiles safely in a new tab', async () => {
    const html = await ssrDefaults('ui/social-icons');
    expect(html).toContain('aria-label="Social links"');
    expect(count(html, '<a ')).toBe(4);
    expect(count(html, 'target="_blank"')).toBe(4);
    expect(count(html, 'rel="noopener noreferrer"')).toBe(4);
    expect(html).toContain('aria-label="LinkedIn (opens in a new tab)"');
    expect(html).toContain('aria-label="GitHub (opens in a new tab)"');
    expect(count(html, '<svg')).toBe(4);
  });

  it('keeps mailto and relative links in place, honours labels and sanitizes hrefs', async () => {
    const html = await ssrDefaults('ui/social-icons', {
      items: [
        { network: 'email', href: 'mailto:hello@example.com', label: 'Email our team' },
        { network: 'rss', href: '/feed.xml', label: '' },
        { network: 'x', href: 'javascript:alert(1)', label: '' }
      ],
      brandColors: true,
      variant: 'solid'
    });
    expect(html).not.toContain('target="_blank"');
    expect(html).toContain('aria-label="Email our team"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).toContain('aria-label="RSS feed"');
    expect(html).toContain('href="/feed.xml"');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="#"');
    expect(html).toContain('social--brand');
  });
});

describe('Countdown', () => {
  it('server-renders stable placeholders inside a timer with editable unit labels', async () => {
    const html = await ssrDefaults('ui/countdown');
    expect(html).toContain('role="timer"');
    expect(count(html, '>--<')).toBe(4);
    expect(count(html, 'value--pending')).toBe(4);
    for (const key of ['daysLabel', 'hoursLabel', 'minutesLabel', 'secondsLabel']) expect(html).toContain(`data-prop="${key}"`);
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain('data-prop="target"');
  });

  it('only renders the toggled units', async () => {
    const html = await ssrDefaults('ui/countdown', { showDays: false, showSeconds: false, variant: 'minimal' });
    expect(count(html, '>--<')).toBe(2);
    expect(html).not.toContain('data-prop="daysLabel"');
    expect(count(html, 'class="colon')).toBe(1);
  });

  it('shows an honest inline message (escaped) for an invalid target', async () => {
    const html = await ssrDefaults('ui/countdown', { target: 'next <b>friday</b>' });
    expect(html).toContain('role="note"');
    expect(html).toContain('data-prop="target"');
    expect(html).toContain('next &lt;b>friday&lt;/b>');
    expect(html).not.toContain('role="timer"');
  });

  it('parses ISO 8601 strictly and splits the remaining time over visible units', async () => {
    const mod = await load('Countdown');
    const parse = mod.parseCountdownTarget as (v: unknown) => number | null;
    const split = mod.splitRemaining as (ms: number, v: Record<string, boolean>) => Array<{ unit: string; value: number }>;
    expect(parse('2026-12-31T17:00:00Z')).toBe(Date.UTC(2026, 11, 31, 17));
    expect(parse('2026-12-31T09:00:00-08:00')).toBe(Date.UTC(2026, 11, 31, 17));
    expect(parse('2026-12-31T22:30+0530')).toBe(Date.UTC(2026, 11, 31, 17));
    expect(parse('2026-12-31T17:00')).toBe(Date.UTC(2026, 11, 31, 17));
    expect(parse('2026-12-31')).toBe(Date.UTC(2026, 11, 31));
    expect(parse('2026-12-31T17:00:00.250Z')).toBe(Date.UTC(2026, 11, 31, 17, 0, 0, 250));
    for (const bad of ['', 'tomorrow', '2026-02-30', '2026-13-01', '2026-12-31T24:00Z', '31/12/2026', '2026-12-31T17:00+25:00', 42, null]) {
      expect(parse(bad), String(bad)).toBeNull();
    }
    const all = { days: true, hours: true, minutes: true, seconds: true };
    const ms = ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000 + 999;
    expect(split(ms, all)).toEqual([
      { unit: 'days', value: 2 },
      { unit: 'hours', value: 3 },
      { unit: 'minutes', value: 4 },
      { unit: 'seconds', value: 5 }
    ]);
    expect(split(ms, { days: false, hours: true, minutes: true, seconds: false })).toEqual([
      { unit: 'hours', value: 51 },
      { unit: 'minutes', value: 4 }
    ]);
    expect(split(-5000, all).every((p) => p.value === 0)).toBe(true);
    expect(split(ms, { days: false, hours: false, minutes: false, seconds: false }).length).toBe(4);
  });
});

describe('AnimatedHeadline', () => {
  it('renders a heading whose full phrase is available to screen readers', async () => {
    const html = await ssrDefaults('ui/animated-headline');
    expect(html).toMatch(/^<h2[\s>]/);
    expect(html).toContain('Build a website that converts, scales, performs');
    expect(html).toContain('class="visual');
    expect(html).toMatch(/class="visual[^"]*" aria-hidden="true"|aria-hidden="true"[^>]*class="visual/);
    expect(html).toContain('data-prop="before"');
    expect(html).toContain('data-prop="words.0"');
    expect(html).toContain('data-prop="words.2"');
    expect(count(html, 'word--active')).toBe(1);
  });

  it('honours level, after text and the typing animation (first word server-rendered)', async () => {
    const html = await ssrDefaults('ui/animated-headline', { level: 'h1', after: 'for you.', animation: 'typing' });
    expect(html).toMatch(/^<h1[\s>]/);
    expect(html).toContain('data-prop="after"');
    expect(html).toContain('>converts<');
    expect(html).toContain('class="caret');
    expect(html).toContain('Build a website that converts, scales, performs for you.');
  });
});

describe('Breadcrumbs', () => {
  it('renders a labelled nav with an ordered list and an unlinked current page', async () => {
    const html = await ssrDefaults('navigation/breadcrumbs');
    expect(html).toMatch(/^<nav[^>]*aria-label="Breadcrumb"/);
    expect(html).toContain('<ol');
    expect(count(html, '<a ')).toBe(3);
    expect(html).toContain('href="/resources/guides"');
    expect(count(html, 'aria-current="page"')).toBe(1);
    expect(html).toMatch(/aria-current="page"[\s\S]*Setting up your workspace/);
    expect(html).not.toMatch(/<a[^>]*aria-current/);
    expect(html).toContain('data-prop="items.3.label"');
    // Collapsible middle on mobile: a disclosure button for the hidden levels.
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('Show full path (1 more level)');
    expect(count(html, 'crumb--collapsed')).toBe(1);
  });

  it('skips the collapse button for short trails and sanitizes hrefs', async () => {
    const html = await ssrDefaults('navigation/breadcrumbs', {
      items: [
        { label: 'Home', href: 'javascript:alert(1)' },
        { label: 'Docs', href: '//evil.example' },
        { label: 'Current', href: '/ignored' }
      ],
      separator: 'slash',
      showHomeIcon: false
    });
    expect(html).not.toContain('aria-expanded');
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('evil.example');
    expect(html).not.toContain('/ignored');
    expect(count(html, 'href="#"')).toBe(2);
  });
});

describe('AnnouncementBar', () => {
  it('renders a labelled region with message, link and dismiss button', async () => {
    const html = await ssrDefaults('site/announcement-bar');
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Announcement"');
    expect(html).toContain('data-prop="text"');
    expect(html).toContain('data-prop="linkText"');
    expect(html).toContain('href="/features"');
    expect(html).toContain('aria-label="Dismiss announcement"');
    expect(count(html, '<svg')).toBe(3);
  });

  it('hides optional parts and sanitizes the link', async () => {
    const html = await ssrDefaults('site/announcement-bar', { linkText: '', icon: 'none', dismissible: false });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<svg');
    expect(await ssrDefaults('site/announcement-bar', { href: 'javascript:alert(1)' })).toContain('href="#"');
  });
});

describe('BillingToggle', () => {
  it('renders a labelled radio group with the default period selected', async () => {
    const html = await ssrDefaults('ui/billing-toggle');
    expect(html).toContain('<fieldset');
    expect(html).toContain('Billing period</legend>');
    expect(count(html, 'type="radio"')).toBe(2);
    const names = [...html.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(names).size).toBe(1);
    expect(html).toMatch(/value="monthly"[^>]*checked/);
    expect(html).toContain('data-period="monthly"');
    for (const key of ['monthlyLabel', 'yearlyLabel', 'badgeText']) expect(html).toContain(`data-prop="${key}"`);
  });

  it('starts on yearly when configured and hides an empty badge', async () => {
    const html = await ssrDefaults('ui/billing-toggle', { defaultPeriod: 'yearly', badgeText: '' });
    expect(html).toMatch(/value="yearly"[^>]*checked/);
    expect(html).not.toMatch(/value="monthly"[^>]*checked/);
    expect(html).toContain('data-period="yearly"');
    expect(html).not.toContain('class="badge');
  });
});

describe('ModalButton', () => {
  it('renders a dialog trigger and a labelled, closed native dialog', async () => {
    const html = await ssrDefaults('ui/modal-button');
    expect(html).toContain('aria-haspopup="dialog"');
    const dialogId = /<dialog[^>]*id="([^"]+)"/.exec(html)?.[1];
    expect(dialogId).toBeTruthy();
    expect(html).toContain(`aria-controls="${dialogId}"`);
    expect(html).not.toMatch(/<dialog[^>]*\sopen/);
    const titleId = /<h2[^>]*id="([^"]+)"/.exec(html)?.[1];
    expect(html).toContain(`aria-labelledby="${titleId}"`);
    expect(html).toContain('aria-label="Close dialog"');
    expect(html).toContain('href="/features"');
    for (const key of ['text', 'modalTitle', 'modalBody', 'confirmText', 'cancelText']) expect(html).toContain(`data-prop="${key}"`);
  });

  it('uses a closing button when no confirm link is set and hides an empty cancel', async () => {
    const html = await ssrDefaults('ui/modal-button', { confirmHref: '', cancelText: '', variant: 'outline', size: 'lg' });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('data-prop="cancelText"');
    expect(html).toContain('md-btn--outlined');
    expect(html).toContain('md-btn--lg');
    expect(await ssrDefaults('ui/modal-button', { confirmHref: 'javascript:alert(1)' })).toContain('href="#"');
  });
});

/* -------------------------------------------------------------------------- */
/* Hostile strings and URLs                                                    */
/* -------------------------------------------------------------------------- */

const HOSTILE = '"><script>alert(1)</script><img src=x onerror=alert(1)>';

function poisonStrings(value: unknown): unknown {
  if (typeof value === 'string') return HOSTILE;
  if (Array.isArray(value)) return value.map(poisonStrings);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, poisonStrings(v)]));
  }
  return value;
}

describe('escaping and URL policy', () => {
  it.each(Object.keys(EXPECTED))('%s escapes hostile text and never emits javascript: URLs', async (type) => {
    const raw = poisonStrings(defaults(type)) as Record<string, unknown>;
    const html = await ssr(GENERAL_MANIFESTS[type].component, resolved(type, raw));
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('<img src=x');
    expect(html.toLowerCase()).not.toContain('javascript:');
    const jsUrls = poisonStrings(defaults(type)) as Record<string, unknown>;
    const withJs = JSON.parse(JSON.stringify(jsUrls).replaceAll(JSON.stringify(HOSTILE).slice(1, -1), 'javascript:alert(1)'));
    const html2 = await ssr(GENERAL_MANIFESTS[type].component, resolved(type, withJs));
    expect(html2).not.toMatch(/href="javascript:/i);
  });
});
