/**
 * Wave 2 forms + site components: schema/default validity, real server rendering (svelte/server)
 * of every component with its manifest defaults, escaping of hostile strings and URL sanitizing.
 *
 * The components are compiled with the Svelte compiler (generate: 'server') into a temp folder
 * so they can be rendered without a Vite Svelte plugin.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compile } from 'svelte/compiler';
import { FORMS_MANIFESTS } from '../src/manifests/forms.js';
import { SITE_MANIFESTS } from '../src/manifests/site.js';
import { getManifest, resolveComponentProps } from '../src/index.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SVELTE_DIR = path.resolve(HERE, '../src/svelte');
const requireFromPkg = createRequire(path.resolve(HERE, '../package.json'));

const NODE_ID = '5e5e5e5e-0000-4000-8000-00000000abcd';
const NODE_KEY = NODE_ID.replace(/[^A-Za-z0-9_-]/g, '');
const XSS = '<img src=x onerror=alert(1)>';

const MANIFESTS = { ...FORMS_MANIFESTS, ...SITE_MANIFESTS };
const TYPES = Object.keys(MANIFESTS);

type Rendered = { body: string };
type RenderFn = (component: unknown, options: { props: Record<string, unknown> }) => Rendered;

let tmpDir = '';
let render: RenderFn;
const components = new Map<string, unknown>();

/** Rewrites compiled-module imports: svelte → resolved files, .svelte → compiled .js, lib .js → .ts sources. */
function rewriteImports(code: string, rel: string): string {
  const fromDir = path.dirname(path.join(SVELTE_DIR, rel));
  return code.replace(/(from\s+|import\s+)(['"])([^'"]+)\2/g, (whole, lead: string, quote: string, spec: string) => {
    if (spec === 'svelte' || spec.startsWith('svelte/')) {
      return `${lead}${quote}${pathToFileURL(requireFromPkg.resolve(spec)).href}${quote}`;
    }
    if (spec.startsWith('.') && spec.endsWith('.svelte')) {
      return `${lead}${quote}${spec.replace(/\.svelte$/, '.svelte.js')}${quote}`;
    }
    if (spec.startsWith('.') && spec.endsWith('.js')) {
      const ts = path.resolve(fromDir, spec.replace(/\.js$/, '.ts'));
      return `${lead}${quote}${pathToFileURL(ts).href}${quote}`;
    }
    return whole;
  });
}

function compileTree(): void {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith('.svelte')) files.push(path.relative(SVELTE_DIR, full));
    }
  };
  walk(SVELTE_DIR);
  for (const rel of files) {
    const source = fs.readFileSync(path.join(SVELTE_DIR, rel), 'utf8');
    const { js } = compile(source, { generate: 'server', filename: path.basename(rel) });
    const out = path.join(tmpDir, `${rel}.js`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, rewriteImports(js.code, rel));
  }
}

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'appviz-forms-site-'));
  compileTree();
  render = (await import(pathToFileURL(requireFromPkg.resolve('svelte/server')).href)).render as RenderFn;
  for (const manifest of Object.values(MANIFESTS)) {
    const mod = await import(pathToFileURL(path.join(tmpDir, `${manifest.component}.svelte.js`)).href);
    components.set(manifest.type, mod.default);
  }
});

afterAll(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Renders a registry type through the same prop resolution the canvas and the export use. */
function renderType(type: string, raw: Record<string, unknown> = {}, nodeId: string | null = NODE_ID): string {
  const resolved = resolveComponentProps(type, raw);
  if (!resolved) throw new Error(`unknown type ${type}`);
  const props = nodeId ? { ...resolved.props, 'data-node-id': nodeId } : { ...resolved.props };
  // Hydration markers (<!--[-->, <!--]-->) are irrelevant to these assertions.
  return render(components.get(type), { props }).body.replace(/<!--[\s\S]*?-->/g, '');
}

function renderDefaults(type: string): string {
  return renderType(type, structuredClone(MANIFESTS[type].defaultProps));
}

/** Every `href="…"` value in the rendered HTML. */
function hrefs(html: string): string[] {
  return [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
}

describe('forms + site manifests', () => {
  it('registers all 13 components in the global registry', () => {
    expect(TYPES.sort()).toEqual(
      [
        'forms/form',
        'forms/login-form',
        'forms/search-bar',
        'hero/centered-hero',
        'hero/form-hero',
        'marketing/bento-grid',
        'marketing/blog-grid',
        'marketing/comparison-table',
        'marketing/feature-alternating',
        'marketing/portfolio-grid',
        'navigation/nav-menu',
        'site/cookie-banner',
        'site/header'
      ].sort()
    );
    for (const type of TYPES) expect(getManifest(type)).toBe(MANIFESTS[type]);
  });

  it.each(TYPES)('%s: defaultProps are complete and valid; an empty object resolves to schema defaults', (type) => {
    const manifest = MANIFESTS[type];
    const parsed = manifest.propsSchema.safeParse(structuredClone(manifest.defaultProps));
    expect(parsed.success).toBe(true);
    // defaultProps already contain every key with its final value (no hidden schema-only defaults).
    expect(parsed.success && parsed.data).toEqual(manifest.defaultProps);
    expect(manifest.propsSchema.safeParse({}).success).toBe(true);
    expect(resolveComponentProps(type, {})!.issues).toEqual([]);
  });

  it.each(TYPES)('%s: never crashes on garbage props (per-prop fallback)', (type) => {
    const shape = (MANIFESTS[type].propsSchema as unknown as { shape: Record<string, unknown> }).shape;
    const garbage = Object.fromEntries(Object.keys(shape).map((key) => [key, { nope: true }]));
    const resolved = resolveComponentProps(type, garbage)!;
    expect(resolved.issues.length).toBeGreaterThan(0);
    expect(() => renderType(type, garbage)).not.toThrow();
  });

  it.each(TYPES)('%s: propControls only describe real props; select options match the enum', (type) => {
    const manifest = MANIFESTS[type];
    const shape = (manifest.propsSchema as unknown as { shape: Record<string, { safeParse(v: unknown): { success: boolean } }> }).shape;
    for (const [key, control] of Object.entries(manifest.propControls ?? {})) {
      expect(Object.keys(shape), `${type}.${key}`).toContain(key);
      for (const option of control.options ?? []) {
        expect(shape[key].safeParse(option.value).success, `${type}.${key}=${option.value}`).toBe(true);
      }
    }
  });

  it('media URL props reject unsafe schemes at the schema level', () => {
    expect(resolveComponentProps('hero/centered-hero', { mediaUrl: 'javascript:alert(1)' })!.props.mediaUrl).toBe('');
    expect(resolveComponentProps('site/header', { logoUrl: 'data:image/svg+xml,<svg onload=alert(1)>' })!.props.logoUrl).toBe('');
    expect(resolveComponentProps('hero/centered-hero', { mediaUrl: 'https://cdn.example/shot.png' })!.props.mediaUrl).toBe('https://cdn.example/shot.png');
  });
});

describe('server render with defaults', () => {
  it.each(TYPES)('%s renders, puts data-node-id on the root and only emits safe hrefs', (type) => {
    const html = renderDefaults(type);
    expect(html.length).toBeGreaterThan(200);
    // Root element carries the node id (first element in the output).
    expect(html).toMatch(new RegExp(`^<[a-z]+[^>]*data-node-id="${NODE_ID}"`));
    for (const href of hrefs(html)) expect(href).toMatch(/^(\/|#|\?|https?:|mailto:|tel:)/);
    expect(html).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('forms/form: labelled fields with slugified unique names, node-derived ids and required markers', () => {
    const html = renderDefaults('forms/form');
    expect(html).toContain('<section');
    expect(html).toMatch(/<form[^>]*aria-labelledby="form-[^"]+-title"[^>]*novalidate/);
    expect(html).toContain(`id="form-${NODE_KEY}-first_name"`);
    expect(html).toContain(`for="form-${NODE_KEY}-first_name"`);
    for (const name of ['first_name', 'last_name', 'email', 'company', 'team_size', 'phone', 'message', 'updates']) {
      expect(html).toContain(`name="${name}"`);
    }
    expect(html).toMatch(/<select[^>]*name="team_size"[^>]*required/);
    expect(html).toMatch(/<option value=""[^>]*>Select team size<\/option>/);
    expect(html).toMatch(/<textarea[^>]*name="message"/);
    expect(html).toMatch(/type="checkbox"[^>]*name="updates"/);
    expect(html).toContain(`id="form-${NODE_KEY}-phone-help"`);
    expect(html).toContain(`aria-describedby="form-${NODE_KEY}-phone-help"`);
    for (const prop of ['title', 'description', 'submitText', 'fields.0.label', 'fields.5.helpText']) {
      expect(html).toContain(`data-prop="${prop}"`);
    }
    // No error summary or success state before interaction.
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain('role="status"');
  });

  it('forms/form: names are slugified from labels and de-duplicated; radios share one group', () => {
    const html = renderType('forms/form', {
      fields: [
        { type: 'text', label: 'Full Name' },
        { type: 'text', label: 'Full name!' },
        { type: 'email', name: 'E-mail Address', label: 'Email' },
        { type: 'radio', label: 'Plan', options: ['Starter', 'Team'], required: true },
        { type: 'text', label: '' },
        { type: 'text', name: '2nd', label: 'Second' }
      ]
    });
    expect(html).toContain('name="full_name"');
    expect(html).toContain('name="full_name_2"');
    expect(html).toContain('name="e_mail_address"');
    expect(html.match(/type="radio"[^>]*name="plan"/g)?.length).toBe(2);
    expect(html).toMatch(/<fieldset[^>]*role="radiogroup"[^>]*aria-required="true"/);
    expect(html).toContain('<legend');
    expect(html).toContain('name="field_5"');
    expect(html).toContain('name="field_2nd"');
  });

  it('forms/form: ids fall back to a hydration-safe component id without a node id', () => {
    const html = renderType('forms/form', {}, null);
    expect(html).not.toContain('id="form-');
    expect(html).toMatch(/aria-labelledby="[^"]+-title"/);
  });

  it('forms/search-bar: role=search form with a label, sanitized action and the query param', () => {
    const html = renderDefaults('forms/search-bar');
    expect(html).toMatch(/<form[^>]*role="search"/);
    expect(html).toMatch(/action="\/search"/);
    expect(html).toMatch(/method="get"/);
    expect(html).toMatch(new RegExp(`<label for="search-${NODE_KEY}-input"[^>]*>Search</label>`));
    expect(html).toMatch(/<input[^>]*type="search"[^>]*name="q"/);
    expect(html).toContain('data-prop="buttonText"');
    expect(html).toContain('data-prop="suggestionsLabel"');
    expect(html).toContain('data-prop="suggestions.3"');
    const evil = renderType('forms/search-bar', { actionHref: 'javascript:alert(1)', paramName: 'q"><script>' });
    expect(evil).not.toContain('action="javascript');
    expect(evil).not.toMatch(/\saction=/);
    expect(evil).toContain('name="q"');
  });

  it('forms/login-form: social providers with logo icons, labelled fields and links', () => {
    const html = renderDefaults('forms/login-form');
    expect(html).toContain('Continue with Google');
    expect(html).toContain('Continue with Microsoft');
    expect(html).toMatch(new RegExp(`<label for="login-${NODE_KEY}-email"`));
    expect(html).toMatch(/type="email"[^>]*autocomplete="email"/);
    expect(html).toMatch(/type="password"[^>]*autocomplete="current-password"/);
    expect(html).toMatch(/aria-label="Show password"[^>]*aria-pressed="false"/);
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain('href="/signup"');
    expect(html).toContain('role="status"');
    for (const prop of ['title', 'subtitle', 'dividerText', 'emailLabel', 'passwordLabel', 'rememberText', 'forgotText', 'submitText', 'footerText', 'signupText']) {
      expect(html).toContain(`data-prop="${prop}"`);
    }
    // Unknown providers are dropped by the schema instead of rendering a broken button.
    const resolved = resolveComponentProps('forms/login-form', { socialProviders: [{ provider: 'myspace', label: 'x' }, { provider: 'github' }] })!;
    expect(resolved.props.socialProviders).toEqual([{ provider: 'github', label: '' }]);
    expect(renderType('forms/login-form', { socialProviders: [{ provider: 'github' }] })).toContain('Continue with GitHub');
    // No providers: no divider.
    expect(renderType('forms/login-form', { socialProviders: [] })).not.toContain('role="separator"');
  });

  it('navigation/nav-menu: disclosure buttons, hidden panels, mega panel and node-derived ids', () => {
    const html = renderDefaults('navigation/nav-menu');
    expect(html).toMatch(/<nav[^>]*aria-label="Menu"/);
    expect(html).toMatch(new RegExp(`<button[^>]*id="nav-${NODE_KEY}-trigger-0"[^>]*aria-expanded="false"[^>]*aria-controls="nav-${NODE_KEY}-panel-0"`));
    expect(html).toMatch(new RegExp(`id="nav-${NODE_KEY}-panel-0" class="[^"]*panel--mega[^"]*"[^>]*hidden`));
    expect(html).toMatch(new RegExp(`id="nav-${NODE_KEY}-panel-1" class="panel[^"]*"[^>]*hidden`));
    expect(html).not.toMatch(new RegExp(`id="nav-${NODE_KEY}-panel-1" class="[^"]*panel--mega`));
    expect(html).toContain('href="/pricing"');
    expect(html).toContain('data-prop="items.0.children.1.description"');
    expect(html).toContain('data-prop="menuLabel"');
    expect(html).toMatch(/class="toggle[^"]*"[^>]*aria-expanded="false"/);
    const current = renderType('navigation/nav-menu', { items: [{ label: 'Pricing', href: '/pricing' }], currentHref: '/pricing' });
    expect(current).toContain('aria-current="page"');
    const vertical = renderType('navigation/nav-menu', { orientation: 'vertical' });
    expect(vertical).toContain('nav--vertical');
    expect(vertical).not.toContain('class="toggle');
  });

  it('site/header: banner landmark, announcement, desktop nav with links.* paths, drawer dialog', () => {
    const html = renderDefaults('site/header');
    expect(html).toMatch(/^<header/);
    expect(html).toContain('is-sticky');
    expect(html).toContain('data-prop="announcement"');
    expect(html).toContain('href="/changelog"');
    expect(html).toContain('data-prop="links.0.label"');
    expect(html).toContain('data-prop="links.0.children.0.description"');
    expect(html).toMatch(/aria-label="Primary"/);
    expect(html).toMatch(new RegExp(`aria-controls="hdr-${NODE_KEY}-drawer"`));
    expect(html).toMatch(/role="dialog"[^>]*aria-modal="true"/);
    expect(html).toContain('data-prop="ctaText"');
    expect(html).toContain('data-prop="secondaryCtaText"');
    expect(html).toMatch(/<span class="mark[^"]*" aria-hidden="true">H<\/span>/);
    const transparent = renderType('site/header', { transparent: true, sticky: false, announcement: '' });
    expect(transparent).toContain('is-transparent');
    expect(transparent).not.toContain('is-sticky');
    expect(transparent).not.toContain('class="announcement"');
    const logo = renderType('site/header', { logoUrl: '/logo.svg' });
    expect(logo).toMatch(/<img src="\/logo.svg" alt=""/);
  });

  it('hero/centered-hero: h1 with the gradient highlight, CTAs, decorative mock and wordmarks', () => {
    const html = renderDefaults('hero/centered-hero');
    expect(html).toMatch(/<h1 class="title[^"]*">/);
    expect(html).toMatch(/Every metric that matters, <span class="highlight[^"]*" data-prop="highlight">in one live view<\/span>/);
    expect(html).toContain('href="/changelog"');
    expect(html).toContain('href="/signup"');
    expect(html).toContain('href="/demo"');
    expect(html).toMatch(/class="mock[^"]*" aria-hidden="true"/);
    expect(html).toContain('data-prop="trustLogos.5"');
    expect(html).toContain('bg-grid');
    // Highlight not contained in the title: rendered on its own line.
    const appended = renderType('hero/centered-hero', { title: 'Ship faster', highlight: 'with less code' });
    expect(appended).toMatch(/Ship faster<\/span><span class="highlight highlight--line[^"]*" data-prop="highlight">with less code<\/span>/);
    // Image mode without a URL shows the placeholder; with a URL an image.
    expect(renderType('hero/centered-hero', { mediaType: 'image' })).toContain('class="placeholder');
    expect(renderType('hero/centered-hero', { mediaType: 'image', mediaUrl: '/shot.png' })).toMatch(/<img src="\/shot.png" alt=""/);
    const poster = renderType('hero/centered-hero', { mediaType: 'video-poster', videoHref: '/tour', videoLabel: 'Watch' });
    expect(poster).toMatch(/<a href="\/tour" class="play[^"]*">/);
  });

  it('hero/form-hero: labelled lead form and benefits list', () => {
    const html = renderDefaults('hero/form-hero');
    expect(html).toMatch(/<h1 class="title[^"]*" data-prop="title">/);
    expect(html).toMatch(new RegExp(`<label for="lead-${NODE_KEY}-name"`));
    expect(html).toMatch(new RegExp(`<label for="lead-${NODE_KEY}-email"`));
    expect(html).toMatch(/<form[^>]*novalidate/);
    expect(html).toContain('data-prop="benefits.2"');
    for (const prop of ['eyebrow', 'subtitle', 'formTitle', 'formDescription', 'nameLabel', 'emailLabel', 'submitText', 'privacyText']) {
      expect(html).toContain(`data-prop="${prop}"`);
    }
  });

  it('marketing/feature-alternating: alternating rows with motif placeholders and images when set', () => {
    const html = renderDefaults('marketing/feature-alternating');
    expect(html.match(/<article class="row/g)?.length).toBe(3);
    expect(html.match(/row--reverse/g)?.length).toBe(1);
    for (const motif of ['motif--0', 'motif--1', 'motif--2']) expect(html).toContain(motif);
    expect(html).toContain('data-prop="items.1.bullets.2"');
    const withImage = renderType('marketing/feature-alternating', { items: [{ title: 'A', imageUrl: '/a.png', imageAlt: 'Alt text' }] });
    expect(withImage).toMatch(/<img src="\/a.png" alt="Alt text"/);
  });

  it('marketing/bento-grid: size classes and per-size motifs', () => {
    const html = renderDefaults('marketing/bento-grid');
    for (const size of ['card--lg', 'card--tall', 'card--md', 'card--wide', 'card--sm']) expect(html).toContain(size);
    expect(html).toContain('card--accent');
    for (const motif of ['visual--orbit', 'visual--stack', 'visual--bars', 'visual--grid']) expect(html).toContain(motif);
    expect(html).toContain('data-prop="items.4.description"');
  });

  it('marketing/blog-grid: deterministic UTC dates, stretched title links and variants', () => {
    const html = renderDefaults('marketing/blog-grid');
    expect(html).toContain('<time datetime="2026-10-14" class="meta-item');
    expect(html).toContain('>Oct 14, 2026</time>');
    expect(html).toContain('>Sep 21, 2026</time>');
    expect(html).toContain('href="/blog/faster-queries"');
    expect(html).toContain('href="/blog"');
    expect(html).toContain('data-prop="posts.0.title"');
    expect(html).toContain('>ML</span>');
    // Late-evening offsets are formatted in UTC (no server/browser drift).
    expect(renderType('marketing/blog-grid', { posts: [{ title: 'x', date: '2026-01-31T23:30:00-05:00' }] })).toContain('Feb 1, 2026');
    expect(renderType('marketing/blog-grid', { posts: [{ title: 'x', date: 'Spring 2026' }] })).toContain('>Spring 2026</time>');
    const defaults = structuredClone(MANIFESTS['marketing/blog-grid'].defaultProps);
    const featured = renderType('marketing/blog-grid', { ...defaults, variant: 'featured-first' });
    expect(featured.match(/post--featured/g)?.length).toBe(1);
    expect(renderType('marketing/blog-grid', { ...defaults, variant: 'list' })).toContain('blog--list');
  });

  it('marketing/portfolio-grid: accessible filter chips derived from categories', () => {
    const html = renderDefaults('marketing/portfolio-grid');
    expect(html).toMatch(/role="group" aria-label="Filter projects by category"/);
    expect(html.match(/aria-pressed="true"/g)?.length).toBe(1);
    expect(html.match(/aria-pressed="false"/g)?.length).toBe(3);
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('Showing 6 projects');
    expect(html.match(/class="project[ "]/g)?.length).toBe(6);
    expect(html).toContain('data-prop="projects.5.title"');
    // A single category hides the filters.
    expect(renderType('marketing/portfolio-grid', { projects: [{ title: 'A', category: 'Web' }, { title: 'B', category: 'Web' }] })).not.toContain('role="group"');
  });

  it('marketing/comparison-table: semantic table, grouped rows, accessible check/dash icons', () => {
    const html = renderDefaults('marketing/comparison-table');
    expect(html).toContain('<table');
    expect(html).toMatch(/<caption class="sr-only[^"]*">/);
    expect(html.match(/<th scope="col"/g)?.length).toBe(4);
    expect(html.match(/scope="colgroup"/g)?.length).toBe(3);
    expect(html.match(/<th scope="row"/g)?.length).toBe(12);
    expect(html).toContain('aria-label="Included"');
    expect(html).toContain('aria-label="Not included"');
    expect(html).toMatch(/role="region"[^>]*aria-labelledby="cmp-[^"]+-title"[^>]*tabindex="0"/);
    expect(html).toContain('data-prop="highlightLabel"');
    expect(html).toContain('data-prop="rows.10.values.2"');
    expect(html).toContain('--sticky-offset: 0px');
    expect(renderType('marketing/comparison-table', { stickyOffset: 64 })).toContain('--sticky-offset: 64px');
  });

  it('site/cookie-banner: labelled region with both choices', () => {
    const html = renderDefaults('site/cookie-banner');
    expect(html).toMatch(new RegExp(`<section[^>]*aria-labelledby="cookie-${NODE_KEY}-title"[^>]*aria-describedby="cookie-${NODE_KEY}-message"`));
    expect(html).toContain('href="/legal/cookies"');
    expect(html).toContain('data-prop="acceptText"');
    expect(html).toContain('data-prop="declineText"');
    expect(html).not.toMatch(/<section[^>]*hidden/);
    expect(renderType('site/cookie-banner', { position: 'bottom-left' })).toContain('cookie--bottom-left');
  });
});

describe('hostile input', () => {
  /** Replaces every string leaf of the defaults (keeping enums valid by skipping keys that reject it). */
  function poisoned(type: string, payload: string): Record<string, unknown> {
    const poison = (value: unknown): unknown => {
      if (typeof value === 'string') return payload;
      if (Array.isArray(value)) return value.map(poison);
      if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, poison(v)]));
      return value;
    };
    return poison(structuredClone(MANIFESTS[type].defaultProps)) as Record<string, unknown>;
  }

  it.each(TYPES)('%s escapes markup in every text prop', (type) => {
    const html = renderType(type, poisoned(type, XSS));
    expect(html).not.toContain('<img src=x');
    // No element gets a real onerror attribute (attribute values are blanked before matching).
    const tags = html.replace(/="[^"]*"/g, '=""').match(/<[a-z][^>]*>/gi) ?? [];
    expect(tags.length).toBeGreaterThan(5);
    for (const tag of tags) expect(tag).not.toMatch(/\sonerror=/i);
    if (type !== 'forms/search-bar') expect(html).toContain('&lt;img src=x onerror=alert(1)>');
  });

  it.each(TYPES)('%s sanitizes javascript: URLs in every href', (type) => {
    const html = renderType(type, poisoned(type, 'javascript:alert(1)'));
    expect(html.toLowerCase()).not.toMatch(/href="\s*javascript:/);
    expect(html.toLowerCase()).not.toMatch(/src="\s*javascript:/);
    expect(html.toLowerCase()).not.toMatch(/action="\s*javascript:/);
    for (const href of hrefs(html)) expect(href).toMatch(/^(\/|#|\?|https?:|mailto:|tel:)/);
  });

  it('nested hrefs (menus, posts, projects, plans) go through safeHref', () => {
    const nav = renderType('navigation/nav-menu', {
      items: [{ label: 'A', href: 'javascript:alert(1)' }, { label: 'B', children: [{ label: 'C', href: '//evil.example' }] }]
    });
    expect(hrefs(nav)).toEqual(['#', '#']);
    const blog = renderType('marketing/blog-grid', { viewAllText: '', posts: [{ title: 'x', href: 'vbscript:msgbox(1)', imageUrl: 'javascript:alert(1)' }] });
    expect(hrefs(blog)).toEqual(['#']);
    expect(blog).not.toMatch(/<img src="javascript/);
    const table = renderType('marketing/comparison-table', { plans: [{ name: 'A', ctaText: 'Go', ctaHref: 'data:text/html,<script>' }] });
    expect(hrefs(table)).toEqual(['#']);
  });
});
