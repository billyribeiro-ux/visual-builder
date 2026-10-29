import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createDefaultAcmeSaaSProject, createNode, type BlueprintNode, type PageRoute, type ProjectBlueprint } from '@app-viz/schema';
import { getAllManifests } from '@app-viz/components';
import { COMPONENT_SOURCES, generateFullExport, generatePageRoute } from '../src/index.js';
import {
  GENERATED_MODULE_PATH,
  collectComponentSources,
  generateComponentSourcesModule,
  stripDataPropAttributes
} from '../../../scripts/sync-component-sources.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let svelteCompiler: any = null;
try {
  const req = createRequire(new URL('../../../apps/studio/package.json', import.meta.url));
  svelteCompiler = await import(pathToFileURL(req.resolve('svelte/compiler')).href);
} catch {
  svelteCompiler = null;
}

const NODE_ID = '7a7a7a7a-0000-4000-8000-000000000001';

function pageWith(root: BlueprintNode): { page: PageRoute; project: ProjectBlueprint } {
  const base = createDefaultAcmeSaaSProject();
  const page = {
    id: '7a7a7a7a-0000-4000-8000-0000000000ff',
    path: '/fixture',
    slug: 'fixture',
    title: 'Fixture',
    description: '',
    isDynamic: false,
    rootNode: root,
    seo: {}
  } as PageRoute;
  return { page, project: { ...base, pages: [...base.pages, page] } };
}

interface AttrInfo {
  element: string;
  name: string;
  kind: 'static' | 'expression' | 'other';
  literal?: unknown;
  raw: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function collectAttributes(node: any, source: string, out: AttrInfo[] = []): AttrInfo[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const n of node) collectAttributes(n, source, out);
    return out;
  }
  if (Array.isArray(node.attributes)) {
    for (const attr of node.attributes) {
      if (attr.type !== 'Attribute') continue;
      const raw = source.slice(attr.start, attr.end);
      const value = attr.value;
      if (value === true || (Array.isArray(value) && value.every((v: { type: string }) => v.type === 'Text'))) {
        out.push({ element: node.name, name: attr.name, kind: 'static', raw });
      } else if (!Array.isArray(value) && value?.type === 'ExpressionTag') {
        const expr = value.expression;
        out.push({ element: node.name, name: attr.name, kind: 'expression', literal: expr.type === 'Literal' ? expr.value : undefined, raw });
      } else {
        out.push({ element: node.name, name: attr.name, kind: 'other', raw });
      }
    }
  }
  for (const key of ['fragment', 'nodes', 'children', 'body', 'consequent', 'alternate']) {
    if (node[key]) collectAttributes(node[key], source, out);
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* (b) generated component sources are fresh                                  */
/* -------------------------------------------------------------------------- */

describe('COMPONENT_SOURCES (generated from packages/components/src/svelte)', () => {
  it('is fresh: regenerating in memory matches the committed module (run pnpm sync:components)', () => {
    expect(fs.readFileSync(GENERATED_MODULE_PATH, 'utf8')).toBe(generateComponentSourcesModule());
    expect(COMPONENT_SOURCES).toEqual(collectComponentSources());
  });

  it('ships every canonical file without editor-only data-prop attributes', () => {
    const keys = Object.keys(COMPONENT_SOURCES);
    for (const manifest of getAllManifests()) expect(keys).toContain(`${manifest.component}.svelte`);
    for (const helper of ['lib/Icon.svelte', 'lib/icons.ts', 'lib/href.ts', 'lib/InteractionLayer.svelte', 'runtime.css']) {
      expect(keys).toContain(helper);
    }
    for (const [key, source] of Object.entries(COMPONENT_SOURCES)) {
      expect(source, key).not.toContain('data-prop');
      // Icon path data is extracted from phosphor (MIT, attributed in a comment); nothing imports it.
      expect(source, key).not.toMatch(/from\s+['"]phosphor-svelte/);
    }
  });

  it('stripDataPropAttributes handles quoted, expression and template-literal values', () => {
    const input = [
      '<h1 class="t" data-prop="title">{title}</h1>',
      '<p data-prop={`features.${i}.title`} class="x">{f.title}</p>',
      '<a',
      '  href={safeHref(x)}',
      "  data-prop='cta'",
      '>go</a>',
      '<span data-prop-like="keep" metadata-prop="keep">k</span>'
    ].join('\n');
    expect(stripDataPropAttributes(input)).toBe(
      ['<h1 class="t">{title}</h1>', '<p class="x">{f.title}</p>', '<a', '  href={safeHref(x)}', '>go</a>', '<span data-prop-like="keep" metadata-prop="keep">k</span>'].join(
        '\n'
      )
    );
    expect(() => stripDataPropAttributes('<p data-prop={`a.${i}`>')).toThrow();
  });

  it('the export writes components to src/lib/components and has no phosphor-svelte dependency', () => {
    const { files } = generateFullExport(createDefaultAcmeSaaSProject());
    for (const key of Object.keys(COMPONENT_SOURCES)) {
      if (key === 'runtime.css') continue;
      expect(files[`generated-app/src/lib/components/${key}`], key).toBe(COMPONENT_SOURCES[key]);
    }
    const pkg = JSON.parse(files['generated-app/package.json']);
    expect({ ...pkg.dependencies, ...pkg.devDependencies }['phosphor-svelte']).toBeUndefined();
    for (const [file, content] of Object.entries(files)) {
      if (file.startsWith('generated-app/')) expect(content, file).not.toMatch(/from\s+['"]phosphor-svelte/);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* (c) every registry type is emitted through the generic, manifest-driven path */
/* -------------------------------------------------------------------------- */

describe('generic emitter', () => {
  it.each(getAllManifests().map((m) => [m.type, m] as const))('%s with default props', (_type, manifest) => {
    const node = createNode({ id: NODE_ID, componentType: manifest.type, name: manifest.displayName, props: structuredClone(manifest.defaultProps) });
    const { page, project } = pageWith(node);
    const out = generatePageRoute(page, project);
    expect(out).toContain(`import ${manifest.component} from '#lib/components/${manifest.component}.svelte';`);
    expect(out).toMatch(new RegExp(`<${manifest.component}\\s+data-node-id="${NODE_ID}"`));
    expect(out).not.toContain('<UnknownComponent');
    if (svelteCompiler) expect(() => svelteCompiler.compile(out, { generate: 'server', filename: 'Page.svelte' })).not.toThrow();
  });

  it('renders container children and unknown types visibly (never silently dropped)', () => {
    const child = createNode({ id: '7a7a7a7a-0000-4000-8000-000000000002', componentType: 'ui/badge', name: 'Badge', props: { text: 'Child' } });
    const unknown = createNode({ id: '7a7a7a7a-0000-4000-8000-000000000003', componentType: 'custom/widget', name: 'Mystery', props: {} });
    const root = createNode({ id: NODE_ID, componentType: 'structure/section', name: 'Section', children: [child, unknown] });
    const { page, project } = pageWith(root);
    const out = generatePageRoute(page, project);
    expect(out).toMatch(/<Section[\s\S]*<Badge\s+data-node-id="7a7a7a7a-0000-4000-8000-000000000002"\s+text=\{"Child"\}/);
    expect(out).toContain("import UnknownComponent from '#lib/components/lib/UnknownComponent.svelte';");
    expect(out).toContain('type={"custom/widget"}');
  });
});

/* -------------------------------------------------------------------------- */
/* (d) security fuzz across every string prop of every component              */
/* -------------------------------------------------------------------------- */

const PAYLOADS = ['"><script>alert(1)</script>', '{alert(1)}', 'javascript:alert(1)', '</style><script>alert(1)</script>'];

/** Replaces every string leaf (top-level and nested) with the payload. */
function poison(value: unknown, payload: string): unknown {
  if (typeof value === 'string') return payload;
  if (Array.isArray(value)) return value.map((v) => poison(v, payload));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, poison(v, payload)]));
  }
  return value;
}

function stringKeys(manifest: ReturnType<typeof getAllManifests>[number]): string[] {
  const shape = (manifest.propsSchema as unknown as { shape: Record<string, { safeParse(v: unknown): { success: boolean } }> }).shape;
  // Free-text string props accept arbitrary text (enums and CSS-valued props reject it).
  return Object.keys(shape).filter(
    (key) => shape[key].safeParse('{free} "text" <value>').success && typeof manifest.defaultProps[key] === 'string'
  );
}

describe('security fuzz', () => {
  for (const manifest of getAllManifests()) {
    for (const payload of PAYLOADS) {
      it(`${manifest.type} ← ${JSON.stringify(payload)}`, () => {
        const props = poison(structuredClone(manifest.defaultProps), payload) as Record<string, unknown>;
        const node = createNode({ id: NODE_ID, componentType: manifest.type, name: payload, props, customClasses: payload });
        const { page, project } = pageWith(node);
        const out = generatePageRoute(page, project);

        expect(out.toLowerCase()).not.toContain('<script>alert');
        expect(out.toLowerCase()).not.toContain('javascript:');
        expect(out.toLowerCase()).not.toContain('</style');
        expect(out.match(/<\/script/gi)?.length).toBe(1);

        // Text only ever appears inside JS string / JSON expressions.
        const body = out
          .replace(/\{"(?:[^"\\]|\\.)*"\}/g, '{STR}')
          .replace(/=\{[[{].*[\]}]\}$/gm, '={JSON}');
        expect(body).not.toContain('alert(1)');

        if (!svelteCompiler) return;
        svelteCompiler.compile(out, { generate: 'server', filename: 'Fuzz.svelte' });
        const attrs = collectAttributes(svelteCompiler.parse(out, { modern: true }).fragment, out);
        const own = attrs.filter((a) => a.element === manifest.component);
        expect(own.length).toBeGreaterThan(0);
        for (const a of own) {
          if (a.name === 'data-node-id' || a.name === 'class') {
            expect(a.raw).toMatch(/^(class="[A-Za-z0-9_\- ]*"|data-node-id="[A-Za-z0-9_-]+")$/);
          } else {
            expect(a.kind, a.raw).toBe('expression');
          }
        }
        // Free-text props round-trip exactly; URL props are sanitized (links → '#', media → '').
        for (const key of stringKeys(manifest)) {
          const attr = own.find((a) => a.name === key);
          expect(attr, `${manifest.type}.${key}`).toBeDefined();
          if (/href$/i.test(key) || /url$/i.test(key) || key === 'src') {
            expect(attr!.literal, `${manifest.type}.${key}`).toBe(/href$/i.test(key) ? '#' : '');
          } else {
            expect(attr!.literal, `${manifest.type}.${key}`).toBe(payload);
          }
        }
      });
    }
  }
});

describe('element CSS ID and custom attributes', () => {
  it('emits a validated id and allow-listed attributes on the component root, dropping unsafe ones', async () => {
    const { createDefaultAcmeSaaSProject } = await import('@app-viz/schema');
    const { generatePageRoute } = await import('../src/index.js');
    const bp = createDefaultAcmeSaaSProject();
    const home = bp.pages.find((p) => p.path === '/')!;
    const hero = home.rootNode.children[0];
    (hero as Record<string, unknown>).htmlId = 'pricing-anchor';
    (hero as Record<string, unknown>).attributes = {
      'data-track': 'hero" onload="x',
      'aria-label': 'Hero',
      onclick: 'alert(1)',
      style: 'color:red',
      href: 'javascript:alert(1)'
    };
    const out = generatePageRoute(home, bp);
    expect(out).toContain('id="pricing-anchor"');
    expect(out).toContain('data-track={"hero\\" onload=\\"x"}');
    expect(out).toContain('aria-label={"Hero"}');
    expect(out).not.toMatch(/onclick=/);
    expect(out).not.toMatch(/\sstyle=\{"color:red"\}/);
    expect(out).not.toContain('javascript:');
  });

  it('drops an invalid htmlId instead of emitting it', async () => {
    const { createDefaultAcmeSaaSProject, ProjectBlueprintSchema } = await import('@app-viz/schema');
    const raw = createDefaultAcmeSaaSProject() as unknown as Record<string, any>;
    raw.pages[0].rootNode.children[0].htmlId = '"><script>';
    const parsed = ProjectBlueprintSchema.parse(raw);
    expect(parsed.pages[0].rootNode.children[0].htmlId).toBeUndefined();
  });
});
