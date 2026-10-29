import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile } from 'svelte/compiler';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { getManifest, resolveComponentProps } from '../src/index.js';

/* -------------------------------------------------------------------------------------------- */
/* SSR harness: compiles the canonical .svelte files (and their lib/ helpers) to server modules   */
/* in a cache directory, so the tests render exactly the files the canvas and the export use.     */
/* -------------------------------------------------------------------------------------------- */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SVELTE_DIR = path.resolve(HERE, '../src/svelte');
const CACHE_DIR = path.resolve(HERE, '../node_modules/.cache/appviz-basic-media-ssr');

const compiled = new Map<string, string>();

function compileToServer(rel: string): string {
  const cached = compiled.get(rel);
  if (cached) return cached;
  const file = path.join(SVELTE_DIR, rel);
  const out = path.join(CACHE_DIR, `${rel}.js`);
  compiled.set(rel, out);
  const { js } = compile(fs.readFileSync(file, 'utf8'), { generate: 'server', filename: path.basename(rel) });
  const code = js.code.replace(/from\s+(['"])(\.{1,2}\/[^'"]+)\1/g, (_match, quote: string, spec: string) => {
    const abs = path.resolve(path.dirname(file), spec);
    const target = spec.endsWith('.svelte') ? compileToServer(path.relative(SVELTE_DIR, abs)) : abs.replace(/\.js$/, '.ts');
    return `from ${quote}${target}${quote}`;
  });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, code);
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const components: Record<string, Component<any>> = {};

async function load(name: string) {
  if (!components[name]) components[name] = (await import(/* @vite-ignore */ compileToServer(`${name}.svelte`))).default;
  return components[name];
}

/** Validated props exactly as the canvas/export pass them, then a server render of the canonical file. */
async function ssr(type: string, raw: Record<string, unknown> = {}, nodeId = 'node-1'): Promise<string> {
  const resolved = resolveComponentProps(type, raw);
  if (!resolved) throw new Error(`Unknown type ${type}`);
  const Comp = await load(resolved.manifest.component);
  // Hydration markers are irrelevant to these assertions.
  return render(Comp, { props: { ...resolved.props, 'data-node-id': nodeId } }).body.replace(/<!--[\s\S]*?-->/g, '');
}

async function ssrDefaults(type: string): Promise<string> {
  return ssr(type, structuredClone(getManifest(type)!.defaultProps));
}

const TYPES = [
  'basic/heading',
  'basic/text',
  'basic/image',
  'basic/icon',
  'basic/spacer',
  'basic/icon-list',
  'basic/icon-box',
  'basic/image-box',
  'basic/blockquote',
  'basic/code-block',
  'media/video',
  'media/gallery',
  'media/carousel',
  'media/map',
  'media/logo-cloud'
] as const;

const HOSTILE = '"><script>alert(1)</script><img src=x onerror=alert(1)>';

beforeAll(async () => {
  for (const type of TYPES) await load(getManifest(type)!.component);
});

/* -------------------------------------------------------------------------------------------- */

describe('basic + media manifests', () => {
  it('registers all 15 types with the expected canonical component', () => {
    const expected: Record<string, string> = {
      'basic/heading': 'Heading',
      'basic/text': 'Text',
      'basic/image': 'Image',
      'basic/icon': 'IconElement',
      'basic/spacer': 'Spacer',
      'basic/icon-list': 'IconList',
      'basic/icon-box': 'IconBox',
      'basic/image-box': 'ImageBox',
      'basic/blockquote': 'Blockquote',
      'basic/code-block': 'CodeBlock',
      'media/video': 'Video',
      'media/gallery': 'Gallery',
      'media/carousel': 'Carousel',
      'media/map': 'MapEmbed',
      'media/logo-cloud': 'LogoCloud'
    };
    for (const type of TYPES) {
      const manifest = getManifest(type);
      expect(manifest, type).toBeDefined();
      expect(manifest!.component, type).toBe(expected[type]);
      expect(manifest!.category, type).toBe(type.split('/')[0]);
      expect(fs.existsSync(path.join(SVELTE_DIR, `${manifest!.component}.svelte`)), type).toBe(true);
    }
  });

  it('defaultProps are valid against their schema and resolve without issues', () => {
    for (const type of TYPES) {
      const manifest = getManifest(type)!;
      const parsed = manifest.propsSchema.safeParse(manifest.defaultProps);
      expect(parsed.success, type).toBe(true);
      expect(resolveComponentProps(type, manifest.defaultProps)!.issues, type).toEqual([]);
      // An empty node (no props at all) is also valid: every prop has a schema default.
      expect(resolveComponentProps(type, {})!.issues, type).toEqual([]);
    }
  });

  it('propControls only describe real props and select options match the schema enums', () => {
    for (const type of TYPES) {
      const manifest = getManifest(type)!;
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, { safeParse(v: unknown): { success: boolean } }> }).shape;
      for (const [key, control] of Object.entries(manifest.propControls ?? {})) {
        expect(shape[key], `${type}.${key}`).toBeDefined();
        for (const option of control.options ?? []) {
          expect(shape[key].safeParse(option.value).success, `${type}.${key}=${option.value}`).toBe(true);
        }
      }
    }
  });

  it('marks every top-level string prop with data-prop (same rule as the canonical contract test)', () => {
    /** Unwraps zod default/optional/nullable wrappers to the inner def type. */
    const zodType = (schema: unknown): string => {
      let current = schema as { _zod?: { def?: { type?: string; innerType?: unknown } } };
      while (current?._zod?.def?.innerType && ['default', 'optional', 'nullable'].includes(current._zod.def.type ?? '')) {
        current = current._zod.def.innerType as typeof current;
      }
      return current?._zod?.def?.type ?? 'unknown';
    };
    for (const type of TYPES) {
      const manifest = getManifest(type)!;
      const src = fs.readFileSync(path.join(SVELTE_DIR, `${manifest.component}.svelte`), 'utf8');
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, unknown> }).shape;
      for (const [key, field] of Object.entries(shape)) {
        if (zodType(field) !== 'string' || /href$|url$/i.test(key) || key === 'gap') continue;
        expect(src, `${manifest.component}.${key}`).toContain(`data-prop="${key}"`);
      }
    }
  });

  it('rejects unsafe media URLs and canonicalises icon aliases', () => {
    expect(resolveComponentProps('basic/image', { imageUrl: 'javascript:alert(1)' })!.props.imageUrl).toBe('');
    expect(resolveComponentProps('basic/image', { imageUrl: 'data:image/svg+xml,<svg onload=alert(1)>' })!.props.imageUrl).toBe('');
    expect(resolveComponentProps('basic/image', { imageUrl: '/images/hero.jpg' })!.props.imageUrl).toBe('/images/hero.jpg');
    expect(resolveComponentProps('media/video', { url: 'javascript:alert(1)' })!.props.url).toBe('');
    expect(resolveComponentProps('media/gallery', { images: [{ src: 'vbscript:x', alt: 'a' }, { src: 'https://cdn.example/a.jpg', alt: 'b' }] })!.props.images).toEqual([
      { src: 'https://cdn.example/a.jpg', alt: 'b', caption: '' }
    ]);
    expect(resolveComponentProps('basic/icon', { name: 'Zap' })!.props.name).toBe('Lightning');
    expect(resolveComponentProps('basic/icon-box', { icon: 'shield-check' })!.props.icon).toBe('ShieldCheck');
    expect(resolveComponentProps('basic/icon', { name: 'not-an-icon' })!.props.name).toBe('not-an-icon');
    expect(resolveComponentProps('basic/spacer', { height: -5 })!.props.height).toBe(64);
    expect(resolveComponentProps('basic/icon-list', { gap: '1rem; color: red' })!.props.gap).toBe('0.75rem');
  });
});

/* -------------------------------------------------------------------------------------------- */

describe('server render with default props', () => {
  it('every component renders its root with data-node-id and no unresolved template output', async () => {
    for (const type of TYPES) {
      const html = await ssrDefaults(type);
      expect(html, type).toContain('data-node-id="node-1"');
      expect(html, type).not.toMatch(/undefined|\[object Object\]|NaN/);
    }
  });

  it('Heading renders the semantic level independently of the visual size', async () => {
    expect(await ssrDefaults('basic/heading')).toMatch(/<h2 class="title[^"]*"><span data-prop="text">Build something people love<\/span><\/h2>/);
    expect(await ssrDefaults('basic/heading')).toMatch(/^<div data-node-id="node-1" class="heading size-xl/);
    const html = await ssr('basic/heading', { text: 'Pricing', level: 'h1', size: 'sm', eyebrow: 'Plans', href: '/pricing' });
    expect(html).toMatch(/<h1 class="title[^"]*">/);
    expect(html).toContain('size-sm');
    expect(html).toContain('data-prop="eyebrow"');
    expect(html).toMatch(/<a href="\/pricing"[^>]*data-prop="text"/);
  });

  it('Text splits paragraphs on blank lines and keeps single newlines as line breaks', async () => {
    const html = await ssr('basic/text', { content: 'First line\nsecond line\n\nNew paragraph' });
    expect(html.match(/<p[\s>]/g)?.length).toBe(2);
    expect(html).toMatch(/First line<br\/?>\s*second line/);
    expect(html).toContain('data-prop="content"');
  });

  it('Image always reserves its ratio and falls back to a labelled placeholder', async () => {
    const empty = await ssrDefaults('basic/image');
    expect(empty).toContain('class="placeholder');
    expect(empty).toContain('aspect-ratio: 16 / 9');
    expect(empty).toContain('data-prop="alt"');
    expect(empty).not.toContain('<img');
    const html = await ssr('basic/image', { imageUrl: 'https://cdn.example/team.jpg', alt: 'Team at work', aspectRatio: '4:3', caption: 'Our team', href: '/about' });
    expect(html).toMatch(/<img[^>]*src="https:\/\/cdn.example\/team.jpg"[^>]*alt="Team at work"[^>]*width="1600"[^>]*height="1200"/);
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('href="/about"');
    expect(html).toContain('data-prop="caption"');
    const decorative = await ssr('basic/image', { imageUrl: 'https://cdn.example/x.jpg', alt: 'ignored', decorative: true });
    expect(decorative).toContain('alt=""');
  });

  it('Icon is decorative without a label and named when linked', async () => {
    const plain = await ssrDefaults('basic/icon');
    expect(plain).toContain('aria-hidden="true"');
    expect(plain).not.toContain('<a');
    const linked = await ssr('basic/icon', { name: 'GithubLogo', href: 'https://github.com/example' });
    expect(linked).toMatch(/<a href="https:\/\/github.com\/example"/);
    expect(linked).toMatch(/data-prop="label">Github logo</);
  });

  it('Spacer is an empty, hidden box with a mobile override', async () => {
    const html = await ssr('basic/spacer', { height: 96, mobileHeight: 32, unit: 'px' });
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('--spacer-height: 96px');
    expect(html).toContain('--spacer-height-mobile: 32px');
  });

  it('list and card elements render semantic markup with data-prop paths', async () => {
    const list = await ssrDefaults('basic/icon-list');
    expect(list).toMatch(/^<ul/);
    expect(list.match(/<li/g)?.length).toBe(4);
    expect(list).toContain('data-prop="items.3.text"');

    const box = await ssrDefaults('basic/icon-box');
    expect(box).toMatch(/<h3 class="title[^"]*" data-prop="title">/);
    expect(box).toContain('data-prop="description"');
    expect(box).toContain('data-prop="linkText"');

    const imageBox = await ssr('basic/image-box', { ...structuredClone(getManifest('basic/image-box')!.defaultProps), variant: 'overlay' });
    expect(imageBox).toContain('variant-overlay');
    expect(imageBox).toContain('data-prop="ctaText"');

    const quote = await ssrDefaults('basic/blockquote');
    expect(quote).toMatch(/^<figure/);
    expect(quote).toContain('<blockquote');
    expect(quote).toContain('<figcaption');
    expect(quote).toMatch(/aria-hidden="true">ML</);
    expect(quote).toContain('data-prop="author"');
    expect(quote).toContain('data-prop="role"');
  });

  it('Code block escapes code, numbers lines and labels the copy button', async () => {
    const html = await ssr('basic/code-block', { content: 'const a = 1;\n</code><script>alert(1)</script>\n', filename: 'a.ts' });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;/code>&lt;script>');
    expect(html.match(/class="line-number[^"]*"/g)?.length).toBe(2);
    expect(html).toMatch(/<button type="button" class="copy[^"]*"[^>]*>/);
    expect(html).toContain('role="region"');
    expect(html).toContain('data-prop="filename"');
    expect(html).toContain('data-prop="language"');
  });
});

/* -------------------------------------------------------------------------------------------- */

describe('media embeds', () => {
  it('Video parses YouTube strictly and embeds youtube-nocookie only', async () => {
    const facade = await ssr('media/video', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42' });
    expect(facade).toMatch(/<button type="button" class="facade[^"]*" aria-label="Play video: Product walkthrough \(loads YouTube\)"/);
    expect(facade).toContain('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
    expect(facade).not.toContain('<iframe');
    for (const url of ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ']) {
      const html = await ssr('media/video', { url, autoplay: true });
      expect(html, url).toMatch(/<iframe[^>]*src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?autoplay=1&amp;rel=0&amp;playsinline=1&amp;mute=1"/);
      expect(html, url).toContain('referrerpolicy="strict-origin-when-cross-origin"');
      expect(html, url).toContain('loading="lazy"');
    }
  });

  it('Video parses Vimeo and direct files, and refuses everything else', async () => {
    const vimeo = await ssr('media/video', { url: 'https://vimeo.com/76979871', autoplay: true, loop: true });
    expect(vimeo).toMatch(/src="https:\/\/player\.vimeo\.com\/video\/76979871\?autoplay=1&amp;dnt=1&amp;muted=1&amp;loop=1"/);
    const file = await ssr('media/video', { url: '/media/demo.webm', captionsUrl: '/media/demo.vtt' });
    expect(file).toMatch(/<video[^>]*src="\/media\/demo.webm"/);
    expect(file).toContain('<track kind="captions" src="/media/demo.vtt"');
    for (const url of [
      'https://evil.example/embed/dQw4w9WgXcQ',
      'https://www.youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=short',
      'https://vimeo.com/channels/staffpicks',
      'https://cdn.example/clip.exe'
    ]) {
      const html = await ssr('media/video', { url, autoplay: true });
      expect(html, url).not.toContain('<iframe');
      expect(html, url).not.toContain('<video');
      expect(html, url).toContain('Unsupported video URL');
    }
    expect(await ssrDefaults('media/video')).toContain('data-prop="title"');
  });

  it('Gallery renders a native dialog lightbox and responsive column variables', async () => {
    const html = await ssrDefaults('media/gallery');
    expect(html.match(/aria-haspopup="dialog"/g)?.length).toBe(6);
    expect(html).toContain('<dialog');
    expect(html).toContain('--cols: 3');
    expect(html).toContain('data-prop="images.5.alt"');
    const noLightbox = await ssr('media/gallery', { lightbox: false, images: [{ src: 'https://cdn.example/a.jpg', alt: 'A', caption: 'Cap' }] });
    expect(noLightbox).not.toContain('<dialog');
    expect(noLightbox).toContain('data-prop="images.0.caption"');
  });

  it('Carousel follows the WAI-ARIA carousel pattern', async () => {
    const html = await ssrDefaults('media/carousel');
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html.match(/aria-roledescription="slide"/g)?.length).toBe(3);
    expect(html.match(/role="tab"/g)?.length).toBe(3);
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('aria-label="Previous slide"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('data-prop="slides.2.title"');
    const auto = await ssr('media/carousel', { ...structuredClone(getManifest('media/carousel')!.defaultProps), autoplay: true });
    expect(auto).toContain('Stop automatic slide show');
    expect(auto).toContain('aria-live="off"');
  });

  it('Map encodes user input and needs coordinates for OpenStreetMap', async () => {
    const osm = await ssrDefaults('media/map');
    expect(osm).toMatch(/src="https:\/\/www\.openstreetmap\.org\/export\/embed\.html\?bbox=[-0-9.,]+&amp;layer=mapnik&amp;marker=37\.795500,-122\.393700"/);
    expect(osm).toContain('data-prop="query"');
    const google = await ssr('media/map', { provider: 'google', query: 'Main St & 5th "Ave" <b>' });
    expect(google).toContain('src="https://www.google.com/maps?q=Main%20St%20%26%205th%20%22Ave%22%20%3Cb%3E&amp;z=15&amp;output=embed"');
    const missing = await ssr('media/map', { provider: 'openstreetmap', query: 'Somewhere' });
    expect(missing).not.toContain('<iframe');
    expect(missing).toContain('Map location needed');
  });

  it('Logo cloud renders text wordmarks when a logo has no image', async () => {
    const html = await ssrDefaults('media/logo-cloud');
    expect(html).not.toContain('<img');
    expect(html.match(/class="wordmark/g)?.length).toBe(6);
    expect(html).toContain('data-prop="logos.0.name"');
    const withImage = await ssr('media/logo-cloud', { logos: [{ name: 'Example', src: 'https://cdn.example/logo.svg', href: '' }] });
    expect(withImage).toMatch(/<img[^>]*alt="Example"/);
  });
});

/* -------------------------------------------------------------------------------------------- */

describe('hostile input', () => {
  /** Replaces every string leaf with the payload (URL-ish values are then rejected or sanitized). */
  function poison(value: unknown): unknown {
    if (typeof value === 'string') return HOSTILE;
    if (Array.isArray(value)) return value.map(poison);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, poison(v)]));
    return value;
  }

  it('escapes hostile text in every component', async () => {
    for (const type of TYPES) {
      const html = await ssr(type, poison(structuredClone(getManifest(type)!.defaultProps)) as Record<string, unknown>);
      expect(html, type).not.toContain('<script>');
      expect(html, type).not.toMatch(/<img src=x/i);
      // No hostile attribute ever lands inside a real tag.
      expect(html, type).not.toMatch(/<[^>]*\son[a-z]+=alert/i);
    }
  });

  it('sanitizes every href and media URL', async () => {
    const js = 'javascript:alert(1)';
    const cases: Array<[string, Record<string, unknown>]> = [
      ['basic/heading', { href: js }],
      ['basic/image', { href: js, imageUrl: 'https://cdn.example/a.jpg' }],
      ['basic/icon', { href: js }],
      ['basic/icon-list', { items: [{ icon: 'Check', text: 'x', href: js }] }],
      ['basic/icon-box', { href: js, linkText: 'More' }],
      ['basic/image-box', { ctaHref: js, ctaText: 'More' }],
      ['media/carousel', { slides: [{ title: 't', ctaText: 'Go', ctaHref: js }] }],
      ['media/logo-cloud', { logos: [{ name: 'A', href: js }] }]
    ];
    for (const [type, props] of cases) {
      const html = await ssr(type, props);
      expect(html, type).not.toContain('javascript:');
      expect(html, type).toMatch(/href="#"/);
    }
    // Media URLs inside arrays are validated per item; protocol-relative and data: URLs never render.
    const gallery = await ssr('media/gallery', { images: [{ src: '//evil.example/x.jpg', alt: 'x' }] });
    expect(gallery).not.toContain('evil.example');
  });
});
