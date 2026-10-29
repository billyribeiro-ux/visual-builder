import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MotionEffectsSchema } from '@app-viz/schema';
import {
  getAllManifests,
  getManifest,
  isContainerType,
  componentNameFor,
  resolveComponentProps,
  resolveIconName,
  ICON_PATHS,
  safeHref,
  safeSrc,
  collectInteractionRules
} from '../src/index.js';
import { createNode } from '@app-viz/schema';

const SVELTE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/svelte');

function read(rel: string): string {
  return fs.readFileSync(path.join(SVELTE_DIR, rel), 'utf8');
}

function topLevelSvelteFiles(): string[] {
  return fs
    .readdirSync(SVELTE_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.svelte'))
    .map((e) => e.name)
    .sort();
}

function allSvelteFiles(dir = SVELTE_DIR, base = SVELTE_DIR): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return allSvelteFiles(full, base);
    return e.name.endsWith('.svelte') ? [path.relative(base, full)] : [];
  });
}

/** Unwraps zod default/optional wrappers to the inner def type. */
function zodType(schema: unknown): string {
  let current = schema as { _zod?: { def?: { type?: string; innerType?: unknown } } };
  while (current?._zod?.def?.innerType && ['default', 'optional', 'nullable'].includes(current._zod.def.type ?? '')) {
    current = current._zod.def.innerType as typeof current;
  }
  return current?._zod?.def?.type ?? 'unknown';
}

/** Splits a selector list on top-level commas (not those inside `:where(...)`). */
function splitSelectorList(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of list) {
    if (ch === '(') depth += 1;
    if (ch === ')') depth -= 1;
    if (ch === ',' && depth === 0) {
      out.push(current.trim());
      current = '';
    } else current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const NON_TEXT_STRING_PROPS = new Set(['activeNav', 'initialName', 'initialEmail', 'placeholder', 'gap']);
/** Inspector control types that edit a non-copy string (never inline-editable on the canvas). */
const NON_TEXT_CONTROLS = new Set(['icon', 'image', 'url', 'date', 'code', 'select', 'color', 'number']);

function isNonTextStringProp(manifest: { propControls?: Record<string, { type?: string }> }, key: string): boolean {
  return (
    /(href|url|src|icon)$/i.test(key) ||
    NON_TEXT_STRING_PROPS.has(key) ||
    NON_TEXT_CONTROLS.has(manifest.propControls?.[key]?.type ?? '')
  );
}

describe('canonical component files', () => {
  it('every manifest names a component whose .svelte file exists', () => {
    for (const manifest of getAllManifests()) {
      expect(manifest.component, manifest.type).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      expect(fs.existsSync(path.join(SVELTE_DIR, `${manifest.component}.svelte`)), manifest.type).toBe(true);
      expect(componentNameFor(manifest.type)).toBe(manifest.component);
    }
  });

  it('every top-level .svelte file is referenced by exactly one manifest (lib/ holds helpers only)', () => {
    const referenced = getAllManifests().map((m) => `${m.component}.svelte`);
    expect(new Set(referenced).size).toBe(referenced.length);
    expect(topLevelSvelteFiles()).toEqual([...referenced].sort());
  });

  it('contains zero emoji in any rendered source', () => {
    for (const file of allSvelteFiles()) {
      expect(read(file), file).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });

  it('follows the component contract (runes, rest on root, no studio imports, no onNavigate)', () => {
    for (const manifest of getAllManifests()) {
      const src = read(`${manifest.component}.svelte`);
      const file = manifest.component;
      expect(src, file).toContain('interface Props');
      expect(src, file).toContain('$props()');
      expect(src, file).toMatch(/\.\.\.rest\s*\}: Props = \$props\(\)/);
      expect(src, file).toContain('{...rest}');
      expect(src, file).toContain('class: className');
      expect(src, file).not.toMatch(/onNavigate|apps\/studio|#lib\/|\$app\//);
      expect(src, file).not.toMatch(/export let |\$:\s|on:click|<slot/);
      if (manifest.isContainer) {
        expect(src, file).toContain('children?: Snippet');
        expect(src, file).toContain('{@render children?.()}');
      } else {
        expect(src, file).not.toContain('{@render children');
      }
      if (manifest.layoutInner) expect(src, file).toContain('data-layout-of={nodeId}');
      // Links always go through the shared URL policy.
      for (const match of src.matchAll(/\shref=\{([^}]*)\}/g)) {
        expect(match[1], `${file}: ${match[0]}`).toMatch(/^safeHref\(|^item\.href$/);
      }
      expect(src, file).not.toMatch(/\{@html/);
    }
  });

  it('marks every editable top-level text prop with data-prop', () => {
    let checked = 0;
    for (const manifest of getAllManifests()) {
      const src = read(`${manifest.component}.svelte`);
      const shape = (manifest.propsSchema as unknown as { shape: Record<string, unknown> }).shape;
      for (const [key, field] of Object.entries(shape)) {
        if (zodType(field) !== 'string') continue;
        if (isNonTextStringProp(manifest, key)) continue;
        expect(src, `${manifest.component}.${key}`).toContain(`data-prop="${key}"`);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(40);
  });

  it('every manifest carries studio metadata (icon, behaviour, keywords)', () => {
    for (const manifest of getAllManifests()) {
      expect(manifest.icon, manifest.type).toMatch(/^[A-Z][A-Za-z0-9]*$/);
      expect(manifest.icon.endsWith('Icon'), manifest.type).toBe(false);
      expect(manifest.behaviour?.length, manifest.type).toBeGreaterThan(0);
      expect(manifest.keywords?.length, manifest.type).toBeGreaterThan(0);
      expect(`${manifest.displayName} ${manifest.description}`, manifest.type).not.toMatch(/MD3|Google|Material|Elementor|\bPro\b|\bV4\b|\p{Extended_Pictographic}/u);
    }
    expect(isContainerType('structure/section')).toBe(true);
    expect(isContainerType('app/dashboard-shell')).toBe(true);
    expect(isContainerType('ui/button')).toBe(false);
    expect(isContainerType('unknown/type')).toBe(false);
  });
});

describe('site runtime', () => {
  const runtime = read('runtime.css');

  it('defines every entrance-animation keyframe the node compiler references', () => {
    const animations = MotionEffectsSchema.shape.entranceAnimation.unwrap().options.filter((a) => a !== 'none');
    expect(animations.length).toBeGreaterThan(3);
    for (const name of animations) expect(runtime).toContain(`@keyframes el-${name} `);
  });

  it('scopes every selector under .site-root (except keyframes) so it never leaks into editor chrome', () => {
    const withoutComments = runtime.replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...withoutComments.matchAll(/(^|\})\s*([^{}@]+)\{/g)]
      .map((m) => m[2].trim())
      .filter((sel) => sel && !/^(from|to|\d+%)$/.test(sel));
    expect(selectors.length).toBeGreaterThan(30);
    for (const group of selectors) {
      for (const selector of splitSelectorList(group)) {
        expect(selector, selector).toMatch(/^:where\(\.site-root\)/);
      }
    }
    expect(runtime).toContain('prefers-reduced-motion');
    for (const cls of ['el-glass', 'el-gradient-border', 'el-shadow-float', 'el-surface-tint', 'el-border-glow']) {
      expect(runtime).toContain(`.${cls} {`);
    }
  });
});

describe('resolveComponentProps', () => {
  it('validates, fills defaults and drops unknown keys', () => {
    const r = resolveComponentProps('ui/button', { text: 'Go', bogus: 1 })!;
    expect(r.issues).toEqual([]);
    expect(r.props).toEqual({ text: 'Go', variant: 'primary', size: 'md', href: '' });
  });

  it('maps legacy aliases before validation', () => {
    expect(resolveComponentProps('ui/card', { actionText: 'A', actionHref: '/a' })!.props).toMatchObject({ ctaText: 'A', ctaHref: '/a' });
    expect(resolveComponentProps('structure/section', { variant: 'surface-high' })!.props.surfaceTone).toBe('high');
    expect(resolveComponentProps('marketing/stats-bar', { stats: [{ value: '1', label: 'x', subtext: 'old' }] })!.props.stats).toEqual([
      { value: '1', label: 'x', detail: 'old' }
    ]);
    expect(resolveComponentProps('app/kpi-grid', { cards: [{ label: 'L', value: '1', delta: '+1', isPositive: false }] })!.props.cards).toEqual([
      { title: 'L', value: '1', change: '+1', trend: 'down' }
    ]);
  });

  it('falls back per prop and drops invalid array items instead of inventing sample data', () => {
    const r = resolveComponentProps('marketing/feature-grid', {
      sectionTitle: 'Real title',
      columns: 99,
      features: [{ title: 'Kept', description: 'ok' }, 'not-an-object', { title: 42 }]
    })!;
    expect(r.props.sectionTitle).toBe('Real title');
    expect(r.props.columns).toBe(3);
    expect(r.props.features).toEqual([{ icon: 'Sparkle', title: 'Kept', description: 'ok' }]);
    expect(r.issues.length).toBe(3);
  });

  it('rejects unsafe CSS-valued props', () => {
    const r = resolveComponentProps('structure/container', { gap: '1rem; background: url(javascript:alert(1))' })!;
    expect(r.props.gap).toBeUndefined();
    expect(resolveComponentProps('structure/grid', { gap: '2px}' })!.props.gap).toBe('1.5rem');
  });

  it('returns null for unknown types', () => {
    expect(resolveComponentProps('nope/nope', {})).toBeNull();
    expect(getManifest('__proto__')).toBeUndefined();
  });
});

describe('icons, URLs and interactions', () => {
  it('resolves canonical names, Lucide-style aliases and legacy emoji', () => {
    expect(Object.keys(ICON_PATHS).length).toBeGreaterThanOrEqual(80);
    expect(resolveIconName('Lightning')).toBe('Lightning');
    expect(resolveIconName('Zap')).toBe('Lightning');
    expect(resolveIconName('Layers')).toBe('Stack');
    expect(resolveIconName('shield-check')).toBe('ShieldCheck');
    expect(resolveIconName('Grid')).toBe('SquaresFour');
    expect(resolveIconName('\u{1F916}')).toBe('Robot');
    expect(resolveIconName('\u{1F6E1}\u{FE0F}')).toBe('ShieldCheck');
    expect(resolveIconName('definitely-not-an-icon')).toBeNull();
    for (const paths of Object.values(ICON_PATHS)) {
      for (const d of paths) expect(d).toMatch(/^[MmLlHhVvCcSsQqTtAaZz0-9.,\-\s]+$/);
    }
  });

  it('safeHref/safeSrc follow the codegen URL policy', () => {
    expect(safeHref('/pricing')).toBe('/pricing');
    expect(safeHref('mailto:a@b.c')).toBe('mailto:a@b.c');
    expect(safeHref('')).toBe('#');
    expect(safeHref('javascript:alert(1)')).toBe('#');
    expect(safeHref('java\tscript:alert(1)')).toBe('#');
    expect(safeHref('//evil.example')).toBe('#');
    expect(safeSrc('data:image/svg+xml,<svg onload=alert(1)>')).toBe('');
    expect(safeSrc('tel:123')).toBe('');
    expect(safeSrc('https://cdn.example/logo.svg')).toBe('https://cdn.example/logo.svg');
  });

  it('collects click rules with sanitized payloads and drops unsupported actions', () => {
    const root = createNode({
      id: '00000000-0000-4000-8000-0000000000aa',
      componentType: 'structure/container',
      name: 'root',
      interactions: [
        { id: 'a', trigger: 'onClick', actionType: 'navigate', payload: { path: 'javascript:alert(1)' } },
        { id: 'b', trigger: 'onHover', actionType: 'showToast', payload: { toastMessage: 'hover' } },
        { id: 'c', trigger: 'click', action: { type: 'show_toast', payload: { toastMessage: 'hi', count: 2 } } },
        { id: 'd', trigger: 'click', actionType: 'scroll_to', payload: { anchor: 'pricing' } },
        { id: 'e', trigger: 'click', actionType: 'set_tab', payload: {} }
      ]
    });
    expect(collectInteractionRules([root])).toEqual([
      { nodeId: root.id, actionType: 'navigate', payload: { path: '#' } },
      { nodeId: root.id, actionType: 'showToast', payload: { toastMessage: 'hi', count: '2' } },
      { nodeId: root.id, actionType: 'scrollTo', payload: { anchor: 'pricing' } }
    ]);
  });

  it('includes project-level rules for visible source nodes only', () => {
    const child = createNode({ id: '00000000-0000-4000-8000-0000000000bb', componentType: 'ui/button', name: 'cta' });
    const hidden = createNode({ id: '00000000-0000-4000-8000-0000000000cc', componentType: 'ui/button', name: 'gone', hidden: true });
    const root = createNode({ id: '00000000-0000-4000-8000-0000000000aa', componentType: 'structure/container', name: 'root', children: [child, hidden] });
    const rules = collectInteractionRules(
      [root],
      [
        { id: 'p1', sourceNodeId: child.id, trigger: 'click', action: { type: 'navigate', payload: { targetPath: '/pricing' } } },
        { id: 'p2', sourceNodeId: hidden.id, trigger: 'click', action: { type: 'navigate', payload: { targetPath: '/x' } } },
        { id: 'p3', sourceNodeId: 'missing', trigger: 'click', action: { type: 'navigate', payload: { targetPath: '/y' } } }
      ]
    );
    expect(rules).toEqual([{ nodeId: child.id, actionType: 'navigate', payload: { targetPath: '/pricing' } }]);
  });
});
