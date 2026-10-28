import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject, createNode, type BlueprintNode } from '@app-viz/schema';
import { generateBuildSpec, STACK_PRESETS, type StackId } from '../src/index.js';

function allVisibleNodes(root: BlueprintNode, out: BlueprintNode[] = []): BlueprintNode[] {
  if (root.hidden) return out;
  if (root.componentType !== 'structure/slot') out.push(root);
  root.children.forEach((c) => allVisibleNodes(c, out));
  return out;
}

describe('generateBuildSpec', () => {
  it('is deterministic (byte-identical for identical input)', () => {
    const a = generateBuildSpec(createDefaultAcmeSaaSProject(), { stack: 'nextjs' });
    const b = generateBuildSpec(createDefaultAcmeSaaSProject(), { stack: 'nextjs' });
    expect(a.files).toEqual(b.files);
    expect(a.prompt).toBe(b.prompt);
  });

  it('produces the full package for every stack preset', () => {
    for (const stack of Object.keys(STACK_PRESETS) as StackId[]) {
      const { files } = generateBuildSpec(createDefaultAcmeSaaSProject(), {
        stack,
        customStackDescription: stack === 'custom' ? 'Hono + htmx' : undefined
      });
      for (const required of [
        'CLAUDE.md',
        'spec/overview.md',
        'spec/components.md',
        'spec/layouts.md',
        'spec/interactions.md',
        'spec/responsive.md',
        'spec/acceptance.md',
        'spec/tokens.css',
        'spec/design-tokens.json',
        'spec/blueprint.json',
        'spec/components.schema.json'
      ]) {
        expect(files[required], `${stack}: ${required}`).toBeTruthy();
      }
      expect(files['CLAUDE.md']).toContain('26.13.0');
      JSON.parse(files['spec/design-tokens.json']);
      JSON.parse(files['spec/components.schema.json']);
    }
  });

  it('specifies every visible node of every page and layout', () => {
    const bp = createDefaultAcmeSaaSProject();
    const { files } = generateBuildSpec(bp, { stack: 'sveltekit' });
    const corpus = Object.values(files).join('\n');
    const nodes = [...bp.pages.map((p) => p.rootNode), ...bp.layouts.map((l) => l.rootNode)].flatMap((r) => allVisibleNodes(r));
    for (const node of nodes) expect(corpus, node.name).toContain(node.id);
  });

  it('carries copy verbatim and maps routes to stack files', () => {
    const bp = createDefaultAcmeSaaSProject();
    const { files } = generateBuildSpec(bp, { stack: 'nextjs' });
    const hero = bp.pages[0].rootNode.children[0];
    expect(files['spec/pages/home.md']).toContain(JSON.stringify(hero.props.title));
    expect(files['spec/overview.md']).toContain('src/app/(site)/pricing/page.tsx');
    expect(files['spec/acceptance.md']).toContain(`“${hero.props.title}”`);
  });

  it('scopes to a single page and only includes that page\'s layout', () => {
    const bp = createDefaultAcmeSaaSProject();
    const dashboard = bp.pages.find((p) => p.path === '/dashboard')!;
    const result = generateBuildSpec(bp, { stack: 'astro', scope: { type: 'page', pageId: dashboard.id } });
    expect(result.stats.pages).toBe(1);
    expect(Object.keys(result.files).filter((f) => f.startsWith('spec/pages/'))).toEqual(['spec/pages/dashboard.md']);
    const scoped = JSON.parse(result.files['spec/blueprint.json']);
    expect(scoped.pages).toHaveLength(1);
    expect(scoped.layouts.every((l: { id: string }) => l.id === dashboard.layoutId)).toBe(true);
  });

  it('omits hidden nodes and reports them', () => {
    const bp = createDefaultAcmeSaaSProject();
    const secret = createNode({ componentType: 'ui/badge', name: 'Secret Badge', props: { text: 'TOP-SECRET-COPY' }, hidden: true });
    bp.pages[0].rootNode.children.push(secret);
    const result = generateBuildSpec(bp, { stack: 'html', scope: { type: 'page', pageId: bp.pages[0].id } });
    expect(result.files['spec/pages/home.md']).not.toContain('TOP-SECRET-COPY');
    expect(result.stats.hiddenOmitted).toBeGreaterThanOrEqual(1);
  });

  it('cannot be broken out of code fences or tables by user content', () => {
    const bp = createDefaultAcmeSaaSProject();
    const evil = createNode({
      componentType: 'ui/card',
      name: 'Evil | name\nwith newline',
      props: { title: '```\n# Injected heading\n```', body: 'pipe | char' },
      customCss: 'selector { color: red; } /* ``` */'
    });
    bp.pages[0].rootNode.children.push(evil);
    const page = generateBuildSpec(bp, { stack: 'nextjs' }).files['spec/pages/home.md'];
    // Content containing ``` is fenced with ~~~~ so it cannot terminate the block.
    expect(page).toContain('~~~~json');
    expect(page).not.toMatch(/^# Injected heading$/m);
    expect(page).toContain('Evil \\| name with newline');
  });

  it('includes extra owner instructions and custom stack descriptions', () => {
    const { files } = generateBuildSpec(createDefaultAcmeSaaSProject(), {
      stack: 'custom',
      customStackDescription: 'Hono SSR + htmx + UnoCSS',
      extraInstructions: 'Use Drizzle with Postgres.'
    });
    expect(files['CLAUDE.md']).toContain('Hono SSR + htmx + UnoCSS');
    expect(files['CLAUDE.md']).toContain('Use Drizzle with Postgres.');
  });
});
