import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STUDIO = path.join(ROOT, 'apps/studio');
const RENDERER = path.join(STUDIO, 'src/lib/components/PreviewRenderer.svelte');
const CANVAS_DIR = path.join(STUDIO, 'src/lib/canvas');
const PREVIEW_ROUTE = path.join(STUDIO, 'src/routes/preview/+page.svelte');

const req = createRequire(path.join(STUDIO, 'package.json'));
const svelteCompiler = await import(pathToFileURL(req.resolve('svelte/compiler')).href);

function read(file: string): string {
  return fs.readFileSync(file, 'utf8');
}

function canvasFiles(): string[] {
  return [
    RENDERER,
    PREVIEW_ROUTE,
    ...fs.readdirSync(CANVAS_DIR).map((f) => path.join(CANVAS_DIR, f))
  ].filter((f) => /\.(svelte|ts)$/.test(f));
}

/** Collects the `type` of every template node in a modern Svelte AST. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nodeTypes(node: any, out: Array<{ type: string; name?: string }> = []): Array<{ type: string; name?: string }> {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    node.forEach((n) => nodeTypes(n, out));
    return out;
  }
  if (typeof node.type === 'string') out.push({ type: node.type, name: node.name });
  for (const key of ['fragment', 'nodes', 'consequent', 'alternate', 'body', 'fallback']) {
    if (node[key]) nodeTypes(node[key], out);
  }
  return out;
}

describe('wrapper-less canvas renderer', () => {
  const source = read(RENDERER);

  it('never renders wrapper elements: the template contains components only (no HTML elements)', () => {
    expect(source).not.toContain('preview-node');
    const ast = svelteCompiler.parse(source, { modern: true });
    const types = nodeTypes(ast.fragment);
    const elements = types.filter((t) => t.type === 'RegularElement' || t.type === 'SvelteElement');
    expect(elements, JSON.stringify(elements)).toEqual([]);
    const components = new Set(types.filter((t) => t.type === 'Component').map((t) => t.name));
    expect([...components].sort()).toEqual(['Comp', 'EmptyContainerSlot', 'PreviewRenderer', 'UnknownComponent']);
    // Node identity lands on the canonical component root through its rest props.
    expect(source).toContain('data-node-id={node.id}');
    expect(source).toMatch(/<Comp \{\.\.\.renderProps\} \{\.\.\.rootAttrs\} data-node-id=\{node\.id\}/);
  });

  it('shows the empty-container placeholder in design mode only', () => {
    expect(source).toMatch(/\{#if designMode\}\s*<EmptyContainerSlot/);
  });

  it('the duplicated preview-components folder is gone and nothing imports it', () => {
    expect(fs.existsSync(path.join(STUDIO, 'src/lib/components/preview-components'))).toBe(false);
    for (const file of canvasFiles()) expect(read(file), file).not.toContain('preview-components');
  });

  it('maps component types through manifest.component and the canonical component folder', () => {
    const map = read(path.join(CANVAS_DIR, 'component-map.ts'));
    expect(map).toContain("import.meta.glob<{ default: SiteComponent }>('../../../../../packages/components/src/svelte/*.svelte'");
    expect(map).toContain('getManifest(componentType)?.component');
  });
});

describe('canvas chrome hygiene', () => {
  it('uses deep phosphor imports only (never the barrel), zero emoji, no native dialogs', () => {
    for (const file of canvasFiles()) {
      const src = read(file);
      expect(src, file).not.toMatch(/from\s+['"]phosphor-svelte['"]/);
      for (const m of src.matchAll(/from\s+['"](phosphor-svelte\/[^'"]+)['"]/g)) {
        expect(m[1], file).toMatch(/^phosphor-svelte\/lib\/[A-Za-z0-9]+Icon$/);
      }
      expect(src, file).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(src, file).not.toMatch(/window\.(alert|confirm|prompt)\(|\b(alert|confirm|prompt)\(/);
    }
  });

  it('the preview route loads the site runtime itself and keeps the link guard + interaction runtime', () => {
    const route = read(PREVIEW_ROUTE);
    expect(route).toContain("import '@app-viz/components/svelte/runtime.css';");
    expect(route).toContain('{@attach linkGuard}');
    expect(route).toContain('<InteractionLayer rules={interactionRules}');
    expect(route).toContain('compileNodeCss(renderedRoots, { layoutInner: isLayoutInnerType })');
    expect(route).not.toMatch(/resolveEffectiveStyles|activeBreakpoint\s*=/);
  });
});
