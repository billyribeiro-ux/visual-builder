import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import { getManifest, getManifestsByCategory, resolveComponentProps, resolveIconName } from '../src/index.js';

const SVELTE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/svelte');
const PHOSPHOR_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../apps/studio/node_modules/phosphor-svelte/lib');
const req = createRequire(import.meta.url);

/* -------------------------------------------------------------------------- */
/* Minimal SSR loader: compiles canonical .svelte files (generate: 'server')  */
/* into a temp dir, rewriting imports so they resolve outside the repo.       */
/* -------------------------------------------------------------------------- */

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'appviz-app-ssr-'));
const compiled = new Map<string, string>();

function resolveSpecifier(spec: string, fromFile: string): string {
  if (spec.startsWith('.')) {
    const target = path.resolve(path.dirname(fromFile), spec);
    if (target.endsWith('.svelte')) return pathToFileURL(compileToTmp(target)).href;
    return pathToFileURL(target.replace(/\.js$/, '.ts')).href;
  }
  if (spec === 'svelte' || spec.startsWith('svelte/')) return pathToFileURL(req.resolve(spec)).href;
  return spec;
}

function compileToTmp(file: string): string {
  const existing = compiled.get(file);
  if (existing) return existing;
  const out = path.join(TMP, `${path.relative(SVELTE_DIR, file).replace(/[\\/]/g, '__')}.js`);
  compiled.set(file, out);
  const { js } = compile(fs.readFileSync(file, 'utf8'), { generate: 'server', filename: file });
  const code = js.code.replace(/(\bfrom\s*|\bimport\s*)(['"])([^'"]+)\2/g, (_m, kw: string, q: string, spec: string) => `${kw}${q}${resolveSpecifier(spec, file)}${q}`);
  fs.writeFileSync(out, code);
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function load(name: string): Promise<any> {
  const mod = await import(/* @vite-ignore */ pathToFileURL(compileToTmp(path.join(SVELTE_DIR, `${name}.svelte`))).href);
  return mod.default;
}

async function ssr(name: string, props: Record<string, unknown> = {}): Promise<string> {
  const Component = await load(name);
  return render(Component, { props }).body;
}


/** Renders a registry type exactly like the canvas/export: raw props → resolveComponentProps → component. */
async function renderType(type: string, raw?: Record<string, unknown>): Promise<string> {
  const manifest = getManifest(type)!;
  const resolved = resolveComponentProps(type, raw ?? structuredClone(manifest.defaultProps))!;
  return ssr(manifest.component, { ...resolved.props, 'data-node-id': 'node-1' });
}

function count(html: string, needle: string | RegExp): number {
  return typeof needle === 'string' ? html.split(needle).length - 1 : (html.match(needle) ?? []).length;
}

const APP_TYPES = [
  'app/chart',
  'app/stat-card',
  'app/activity-feed',
  'app/empty-state',
  'app/profile-card',
  'app/sidebar-nav',
  'app/kanban',
  'app/calendar',
  'app/pagination',
  'app/stepper',
  'app/description-list',
  'app/notification-list'
] as const;

/** Every string leaf of `value` replaced by `payload` (top level and nested). */
function poison(value: unknown, payload: string): unknown {
  if (typeof value === 'string') return payload;
  if (Array.isArray(value)) return value.map((v) => poison(v, payload));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, poison(v, payload)]));
  }
  return value;
}

/** Every string leaf whose key ends in `href` replaced by `payload`. */
function poisonHrefs(value: unknown, payload: string, key = ''): unknown {
  if (typeof value === 'string') return /href$/i.test(key) ? payload : value;
  if (Array.isArray(value)) return value.map((v) => poisonHrefs(v, payload, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, poisonHrefs(v, payload, k)]));
  }
  return value;
}

describe('app manifests', () => {
  it('registers all twelve app components in the app category', () => {
    const types = getManifestsByCategory('app').map((m) => m.type);
    for (const type of APP_TYPES) expect(types, type).toContain(type);
  });

  it.each(APP_TYPES)('%s: defaults validate cleanly and every field has a schema default', (type) => {
    const manifest = getManifest(type)!;
    const resolved = resolveComponentProps(type, structuredClone(manifest.defaultProps))!;
    expect(resolved.issues).toEqual([]);
    expect(resolved.props).toEqual(manifest.defaultProps);
    const empty = resolveComponentProps(type, {})!;
    expect(empty.issues).toEqual([]);
    expect(Object.keys(empty.props).sort()).toEqual(Object.keys(manifest.defaultProps).sort());
  });

  it.each(APP_TYPES)('%s: studio icon exists in phosphor-svelte 3.1.1 and metadata is complete', (type) => {
    const manifest = getManifest(type)!;
    expect(fs.existsSync(path.join(PHOSPHOR_DIR, `${manifest.icon}Icon.svelte`)), manifest.icon).toBe(true);
    expect(fs.existsSync(path.join(SVELTE_DIR, `${manifest.component}.svelte`))).toBe(true);
    expect(manifest.behaviour?.length).toBeGreaterThan(0);
    expect(manifest.keywords?.length).toBeGreaterThan(3);
    for (const key of Object.keys(manifest.propControls ?? {})) {
      expect(Object.keys(manifest.defaultProps), `${type} propControls.${key}`).toContain(key);
    }
  });

  it('every icon name used by default props resolves to a bundled site icon', () => {
    const icons: string[] = [];
    const collect = (value: unknown, key = '') => {
      if (typeof value === 'string' && key === 'icon' && value) icons.push(value);
      else if (Array.isArray(value)) value.forEach((v) => collect(v, key));
      else if (value && typeof value === 'object') Object.entries(value).forEach(([k, v]) => collect(v, k));
    };
    for (const type of APP_TYPES) collect(getManifest(type)!.defaultProps);
    expect(icons.length).toBeGreaterThan(15);
    for (const icon of icons) expect(resolveIconName(icon), icon).not.toBeNull();
  });

  it('non-text string props (dates, months, icons) fall back to defaults when invalid', () => {
    const cal = resolveComponentProps('app/calendar', { month: '2026-13', today: 'tomorrow' })!;
    expect(cal.props.month).toBe('2026-10');
    expect(cal.props.today).toBe('2026-10-28');
    expect(cal.issues.length).toBe(2);
    expect(resolveComponentProps('app/calendar', { month: '2027-02' })!.props.month).toBe('2027-02');
    expect(resolveComponentProps('app/stat-card', { icon: 'Users' })!.props.icon).toBe('Users');
  });
});

describe('server render with defaults', () => {
  it('Chart: figure + caption, role="img" summary, roving focus points, legend and hidden data table', async () => {
    const html = await renderType('app/chart');
    expect(html).toMatch(/^<!--\[--><!--\$s\d+--><figure data-node-id="node-1" class="chart /);
    expect(html).toContain('<figcaption');
    expect(html).toContain('data-prop="title">Net revenue</h3>');
    expect(html).toContain('data-prop="subtitle"');
    expect(html).toContain('role="img" aria-label="Bar chart: Net revenue. 6 points from May to Oct. This year: lowest $42.1k (May), highest $58.9k (Oct), latest $58.9k.');
    // Nice-number ticks with affixes.
    for (const tick of ['$0k', '$20k', '$40k', '$60k']) expect(html).toContain(`>${tick}</text>`);
    expect(count(html, 'class="hit svelte-')).toBe(6);
    expect(count(html, 'tabindex="0"')).toBe(1);
    expect(html).toContain('aria-label="Oct: This year $58.9k, Last year $46.1k"');
    expect(html).toContain('data-prop="series.0.name"');
    expect(html).toMatch(/<table class="sr-only[^"]*"><caption>Net revenue<\/caption>/);
    expect(count(html, /<th scope="row"/g)).toBe(6);
    expect(count(html, /class="bar svelte-/g)).toBe(12);
  });

  it.each(['line', 'area', 'stacked-bar', 'donut'])('Chart renders type "%s" with a summary and table', async (type) => {
    const html = await renderType('app/chart', { ...getManifest('app/chart')!.defaultProps, type });
    expect(html).toContain('role="img"');
    expect(html).toContain('<table class="sr-only');
    if (type === 'donut') {
      expect(html).toContain('aria-label="Donut chart: Net revenue. Total $297.9k.');
      expect(count(html, /class="slice svelte-/g)).toBe(6);
      expect(html).toContain('>Total</text>');
    }
    if (type === 'area') expect(html).toContain('<linearGradient');
    if (type === 'stacked-bar') expect(html).toContain('Total $105k');
  });

  it('Chart truncates mismatched lengths to the shortest, drops non-finite values and shows an honest empty state', async () => {
    const html = await ssr('Chart', {
      labels: ['A', 'B', 'C', 'D'],
      series: [
        { name: 'One', values: [1, Number.NaN, 3, 4, 5], tone: 'primary' },
        { name: 'Two', values: [2, 2, Number.POSITIVE_INFINITY], tone: 'violet' }
      ]
    });
    expect(count(html, /<th scope="row"/g)).toBe(3);
    expect(html).toContain('<td>No data</td>');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
    const empty = await ssr('Chart', { title: 'Empty', labels: [], series: [] });
    expect(empty).toContain('No data to display');
    expect(empty).not.toContain('<table');
  });

  it('Chart folds more than six donut segments into "Other"', async () => {
    const html = await ssr('Chart', {
      type: 'donut',
      labels: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      series: [{ name: 'Share', values: [8, 7, 6, 5, 4, 3, 2, 1] }]
    });
    expect(count(html, /class="slice svelte-/g)).toBe(6);
    expect(html).toContain('<th scope="row">Other</th>');
    expect(html).toContain('var(--md-sys-color-outline)');
  });

  it('StatCard: data-prop text, sentiment from trend × upIsGood, sr text and sparkline', async () => {
    const html = await renderType('app/stat-card');
    for (const key of ['label', 'value', 'delta', 'period']) expect(html).toContain(`data-prop="${key}"`);
    expect(html).toContain('tone-positive');
    expect(html).toContain('<span class="sr-only svelte-');
    expect(html).toContain('Increased by');
    expect(html).toContain('role="img" aria-label="Trend over 12 periods, from 31.2 to 48.3"');
    const bad = await renderType('app/stat-card', { ...getManifest('app/stat-card')!.defaultProps, upIsGood: false });
    expect(bad).toContain('tone-negative');
    const flat = await renderType('app/stat-card', { label: 'Uptime', value: '99.98%', trend: 'flat', delta: '0.0%', sparkline: [1] });
    expect(flat).toContain('tone-neutral');
    expect(flat).not.toContain('class="spark');
  });

  it('ActivityFeed: ordered list, deterministic relative <time> from `now`, view-all link', async () => {
    const html = await renderType('app/activity-feed');
    expect(html).toContain('<ol class="list');
    expect(count(html, /<li class="item/g)).toBe(5);
    expect(html).toContain('<time class="time svelte-1b0wbe5" datetime="2026-10-28T11:48:00.000Z" title="Oct 28, 2026, 11:48 UTC">12 min ago</time>'.replace('svelte-1b0wbe5', html.match(/class="time (svelte-[a-z0-9]+)"/)![1]));
    expect(html).toContain('>2 hours ago</time>');
    expect(html).toContain('>20 hours ago</time>');
    expect(html).toContain('>2 days ago</time>');
    expect(html).toContain('data-prop="items.0.actor"');
    expect(html).toContain('data-prop="viewAllText"');
    expect(html).toContain('href="/activity"');
    expect(await renderType('app/activity-feed')).toBe(html);
    const later = await renderType('app/activity-feed', { ...getManifest('app/activity-feed')!.defaultProps, now: '2026-11-20T12:00:00Z' });
    expect(later).toContain('>Oct 28</time>');
  });

  it('EmptyState: heading, description and both calls to action', async () => {
    const html = await renderType('app/empty-state');
    expect(html).toContain('data-prop="title">No projects yet</h3>');
    expect(html).toContain('data-prop="description"');
    expect(html).toContain('href="/projects/new"');
    expect(html).toContain('href="/projects/import"');
    expect(html).toContain('empty--dashed');
    const plain = await renderType('app/empty-state', { title: 'No results', variant: 'plain' });
    expect(plain).toContain('empty--plain');
    expect(plain).not.toContain('<a ');
  });

  it('ProfileCard: initials fallback, stats list, actions and badges', async () => {
    const html = await renderType('app/profile-card');
    expect(html).toContain('>AM</span>');
    expect(html).not.toContain('<img');
    expect(html).toContain('<dl class="stats');
    expect(count(html, /<dt /g)).toBe(3);
    expect(html).toContain('data-prop="badges.1">On call</li>');
    expect(html).toContain('href="/team/avery-morgan"');
    const withAvatar = await renderType('app/profile-card', { name: 'Jo Doe', avatarSrc: 'https://cdn.example/jo.png' });
    expect(withAvatar).toContain('src="https://cdn.example/jo.png" alt="Jo Doe" width="80" height="80"');
  });

  it('SidebarNav: labelled nav, aria-current page, collapse + mobile disclosure buttons', async () => {
    const html = await renderType('app/sidebar-nav');
    expect(html).toMatch(/^<!--\[--><!--\$s\d+--><aside data-node-id="node-1"/);
    expect(html).toContain('aria-label="Meridian navigation"');
    expect(count(html, 'aria-current="page"')).toBe(1);
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-label="Collapse sidebar"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Open navigation"');
    expect(count(html, /<a href="\/(dashboard|projects|deployments|analytics|team|billing|settings)"/g)).toBe(7);
    expect(html).toContain('data-prop="sections.0.items.1.badge">12</span>');
    expect(html).toContain('data-prop="footerUserEmail">avery@example.com</span>');
  });

  it('KanbanBoard: draggable cards with instructions, live region and source-path data-props', async () => {
    const html = await renderType('app/kanban');
    expect(count(html, 'role="button"')).toBe(6);
    expect(count(html, 'aria-roledescription="draggable card"')).toBe(6);
    expect(html).toContain('aria-live="assertive"');
    expect(html).toMatch(/aria-describedby="[^"]+-instructions"/);
    expect(count(html, 'data-kanban-col=')).toBe(4);
    expect(html).toContain('data-prop="columns.0.title">Backlog</h3>');
    expect(html).toContain('data-prop="columns.1.cards.0.title">SAML single sign-on</p>');
    expect(html).toContain('<time datetime="2026-11-12">Nov 12</time>');
    const empty = await renderType('app/kanban', { columns: [{ title: 'Todo', cards: [] }] });
    expect(empty).toContain('No cards');
  });

  it('CalendarMonth: accessible grid with roving focus, today marker and agenda list', async () => {
    const html = await renderType('app/calendar');
    expect(html).toContain('role="grid"');
    expect(html).toContain('>October 2026</h3>');
    expect(count(html, 'role="columnheader"')).toBe(7);
    expect(count(html, 'role="gridcell"')).toBe(35);
    expect(count(html, 'aria-current="date"')).toBe(1);
    expect(count(html, 'tabindex="0"')).toBe(1);
    expect(html).toContain('aria-label="Wednesday, October 28, 2026, today, 3 events: Design critique, Incident retrospective, Hiring sync"');
    expect(html).toContain('+1 more');
    expect(html).toContain('aria-label="Previous month"');
    expect(html).toContain('Events in October');
    const monday = await renderType('app/calendar', { month: '2026-02', weekStartsOn: 'monday' });
    expect(monday).toContain('>February 2026</h3>');
    expect(monday).toMatch(/role="columnheader"><abbr title="Monday"[^>]*>Mon<\/abbr>/);
    // Feb 1 2026 is a Sunday: 6 leading days with a Monday start, none with a Sunday start.
    expect(count(monday, 'role="gridcell"')).toBe(35);
    expect(count(await renderType('app/calendar', { month: '2026-02' }), 'role="gridcell"')).toBe(28);
  });

  it('Pagination: nav landmark, ellipses, aria-current and summary', async () => {
    const html = await renderType('app/pagination');
    expect(html).toMatch(/<nav data-node-id="node-1" class="pagination [^"]*" aria-label="Pagination">/);
    expect(html.replace(/ class="svelte-[a-z0-9]+"/g, '')).toMatch(/Showing <strong>41<\/strong>–<strong>50<\/strong> of\s*<strong>248<\/strong>/);
    expect(count(html, '…')).toBe(2);
    expect(html).toMatch(/aria-label="Page 5" aria-current="page"/);
    for (const page of [1, 4, 6, 25]) expect(html).toContain(`aria-label="Page ${page}"`);
    expect(html).not.toContain('aria-label="Page 3"');
    const simple = await renderType('app/pagination', { total: 248, current: 99, variant: 'simple' });
    expect(simple).toContain('Page 25 of 25');
    expect(simple).toMatch(/disabled[^>]*aria-label="Go to next page"/);
    const none = await renderType('app/pagination', { total: 0 });
    expect(none).toContain('No <span data-prop="itemLabel">results</span>');
  });

  it('Stepper: progress indicator, labelled fields and actions', async () => {
    const html = await renderType('app/stepper');
    expect(html).toContain('aria-label="Progress"');
    expect(count(html, 'aria-current="step"')).toBe(1);
    expect(count(html, /<li class="indicator-step/g)).toBe(4);
    expect(html).toContain('Review &amp; submit');
    expect(count(html, /<input /g)).toBe(2);
    const ids = [...html.matchAll(/<label class="md-field-label label svelte-[a-z0-9]+" for="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.length).toBe(2);
    for (const id of ids) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('data-prop="steps.0.fields.0.label"');
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('>Back');
  });

  it('DescriptionList: dl with copy buttons for copyable rows', async () => {
    const html = await renderType('app/description-list');
    expect(html).toContain('<dl class="list');
    expect(count(html, /<dt /g)).toBe(6);
    expect(count(html, 'class="copy svelte-')).toBe(3);
    expect(html).toContain('aria-label="Copy Workspace ID"');
    expect(html).toContain('role="status"');
    expect(html).toContain('list--2');
    expect(await renderType('app/description-list', { items: [], columns: 1 })).toContain('list--1');
  });

  it('NotificationList: tabs, unread count and items', async () => {
    const html = await renderType('app/notification-list');
    expect(html).toContain('role="tablist"');
    expect(count(html, 'role="tab"')).toBe(2);
    expect(html).toMatch(/role="tab"[^>]*aria-selected="true"[^>]*>All/);
    expect(html).toContain('role="tabpanel"');
    expect(html).toMatch(/class="tab-count[^"]*">3<\/span>/);
    expect(count(html, /<li class="item/g)).toBe(5);
    expect(count(html, /is-unread/g)).toBe(3);
    expect(html).toContain('>8m ago</time>');
    expect(html).toContain('>3d ago</time>');
    expect(html).toContain('data-prop="items.0.body"');
  });
});

describe('hostile input', () => {
  const PAYLOADS = ['"><script>alert(1)</script>', '<img src=x onerror=alert(1)>', '{alert(1)}'];

  it.each(APP_TYPES)('%s escapes hostile strings in every prop', async (type) => {
    for (const payload of PAYLOADS) {
      const raw = poison(structuredClone(getManifest(type)!.defaultProps), payload) as Record<string, unknown>;
      const html = await renderType(type, raw);
      expect(html.toLowerCase()).not.toContain('<script>alert');
      expect(html.toLowerCase()).not.toContain('<img src=x');
      // No tag carries an injected inline event handler (escaped text content is fine).
      // Quoted attribute values cannot contain a raw `"` (Svelte escapes it), so blank them first.
      expect(html.replace(/"[^"]*"/g, '""')).not.toMatch(/<[a-z][^<>]*\son[a-z]+=/i);
    }
  });

  it.each(APP_TYPES)('%s sanitizes every href and image URL', async (type) => {
    const raw = poisonHrefs(structuredClone(getManifest(type)!.defaultProps), 'javascript:alert(1)') as Record<string, unknown>;
    if ('avatarSrc' in raw) raw.avatarSrc = 'javascript:alert(1)';
    const html = await renderType(type, raw);
    expect(html.toLowerCase()).not.toContain('javascript:');
  });
});
