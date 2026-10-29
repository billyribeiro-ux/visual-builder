import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  breakpointRange,
  cssSafeImageUrl,
  cssValueError,
  customCssError,
  expandSides,
  normalizeLength,
  parseBackgroundImage,
  parseBorder,
  parseFilter,
  parseGradient,
  parseShadow,
  parseTransform,
  parseTransition,
  serializeBackgroundImage,
  serializeFilter,
  serializeGradient,
  serializeShadow,
  serializeTransform
} from './css-values.js';
import { describeItemFields, describeProps, groupSpecs, humanizeKey, itemTitle, newListItem, singularize } from './prop-schema.js';
import type { ComponentManifest } from '@app-viz/schema';

describe('css-values', () => {
  it('expands box shorthands', () => {
    expect(expandSides('8px')).toEqual(['8px', '8px', '8px', '8px']);
    expect(expandSides('8px 16px')).toEqual(['8px', '16px', '8px', '16px']);
    expect(expandSides('1px calc(2px + 1rem) 3px')).toEqual(['1px', 'calc(2px + 1rem)', '3px', 'calc(2px + 1rem)']);
    expect(expandSides('')).toBeNull();
  });

  it('normalizes typed lengths', () => {
    expect(normalizeLength('24')).toBe('24px');
    expect(normalizeLength('0')).toBe('0');
    expect(normalizeLength('1.5rem')).toBe('1.5rem');
    expect(normalizeLength('auto')).toBe('auto');
  });

  it('refuses values the stylesheet sanitizer would drop', () => {
    expect(cssValueError('12px')).toBeNull();
    expect(cssValueError('red; background: url(x)')).toMatch(/not allowed/);
    expect(cssValueError('url(javascript:alert(1))')).toBeTruthy();
    expect(customCssError('selector { color: red; }')).toBeNull();
    expect(customCssError('selector { color: red;')).toMatch(/closing brace/);
    expect(customCssError('@import url(x.css);')).toMatch(/@import/);
  });

  it('round-trips gradients', () => {
    const g = parseGradient('linear-gradient(135deg, #2F6BFF 0%, #7A5AF8 100%)');
    expect(g).toEqual({ type: 'linear', angle: 135, stops: [{ color: '#2F6BFF', pos: 0 }, { color: '#7A5AF8', pos: 100 }] });
    expect(serializeGradient(g!)).toBe('linear-gradient(135deg, #2F6BFF 0%, #7A5AF8 100%)');
    const r = parseGradient('radial-gradient(circle at center, rgba(0, 0, 0, 0.5), white)');
    expect(r?.type).toBe('radial');
    expect(r?.stops.map((s) => s.pos)).toEqual([0, 100]);
    expect(parseGradient('linear-gradient(to right, red, blue)')?.angle).toBe(90);
  });

  it('classifies background layers incl. overlays', () => {
    const v = serializeBackgroundImage('/hero.png', 'rgba(0, 0, 0, 0.4)');
    expect(v).toBe('linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("/hero.png")');
    expect(parseBackgroundImage(v)).toEqual({ kind: 'image', url: '/hero.png', overlay: 'rgba(0, 0, 0, 0.4)' });
    expect(parseBackgroundImage('linear-gradient(red, blue)').kind).toBe('gradient');
    expect(cssSafeImageUrl('data:image/svg+xml;utf8,%3Csvg%3E').url).toBe('data:image/svg+xml,%3Csvg%3E');
    expect(cssSafeImageUrl('data:image/png;base64,AAAA').error).toBeTruthy();
  });

  it('parses shadows, transforms, filters, transitions and borders', () => {
    const [layer] = parseShadow('inset 0 4px 12px -2px rgba(16, 24, 40, 0.12)')!;
    expect(layer).toEqual({ inset: true, x: '0', y: '4px', blur: '12px', spread: '-2px', color: 'rgba(16, 24, 40, 0.12)' });
    expect(serializeShadow(layer)).toBe('inset 0 4px 12px -2px rgba(16, 24, 40, 0.12)');
    const t = parseTransform('translate(10px, 20%) rotate(5deg) skewX(3deg)');
    expect([t.translateX, t.translateY, t.rotate]).toEqual(['10px', '20%', '5deg']);
    expect(serializeTransform({ ...t, scale: '1.05' })).toBe('translate(10px, 20%) rotate(5deg) scale(1.05) skewX(3deg)');
    const f = parseFilter('blur(4px) drop-shadow(0 0 2px red)');
    expect(serializeFilter({ ...f.values, brightness: '110%' }, f.rest)).toBe('blur(4px) brightness(110%) drop-shadow(0 0 2px red)');
    expect(parseTransition('all 250ms cubic-bezier(0.2, 0, 0, 1)')).toEqual({ property: 'all', duration: '250ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    expect(parseBorder('1px solid var(--md-sys-color-outline)')).toEqual({ width: '1px', style: 'solid', color: 'var(--md-sys-color-outline)' });
  });

  it('derives breakpoint labels from the engine media queries', () => {
    expect(breakpointRange('tablet')).toBe('≤1023px');
    expect(breakpointRange('desktop')).toBe('≥1024px');
  });
});

describe('prop-schema', () => {
  const manifest = {
    type: 'test/x',
    displayName: 'X',
    category: 'marketing',
    description: '',
    icon: 'Cube',
    component: 'X',
    slots: [],
    propsSchema: z.object({
      sectionTitle: z.string().default('T'),
      subtitle: z.string().default(''),
      primaryCtaHref: z.string().default('/'),
      logoUrl: z.string().default(''),
      align: z.enum(['left', 'center']).default('left'),
      columns: z.number().min(1).max(4).default(3),
      dismissible: z.boolean().default(false),
      features: z.array(z.object({ icon: z.string().default('Zap'), title: z.string(), description: z.string() })).default([]),
      tags: z.array(z.string()).default([]),
      rows: z.array(z.array(z.string())).default([])
    }),
    defaultProps: { sectionTitle: 'T', columns: 3 }
  } as unknown as ComponentManifest;

  it('classifies props into controls and groups', () => {
    const specs = describeProps(manifest, { extra: 'kept', features: [{ icon: 'Zap', title: 'A', description: 'B' }] });
    const kind = Object.fromEntries(specs.map((s) => [s.key, s.kind]));
    expect(kind).toMatchObject({
      sectionTitle: 'text',
      subtitle: 'textarea',
      primaryCtaHref: 'link',
      logoUrl: 'asset',
      align: 'enum',
      columns: 'number',
      dismissible: 'boolean',
      features: 'objectList',
      tags: 'stringList',
      rows: 'matrix',
      extra: 'text'
    });
    const columns = specs.find((s) => s.key === 'columns')!;
    expect([columns.min, columns.max]).toEqual([1, 4]);
    expect(groupSpecs(specs).map((g) => g.id)).toEqual(['content', 'buttons', 'items', 'settings']);
  });

  it('labels, titles and new items', () => {
    expect(humanizeKey('primaryCtaHref')).toBe('Primary CTA link');
    expect(humanizeKey('sectionTitle')).toBe('Title');
    expect(humanizeKey('isPopular')).toBe('Popular');
    expect(singularize('Testimonials')).toBe('testimonial');
    expect(itemTitle({ icon: 'Zap', href: '/x', title: 'Hello' })).toBe('Hello');
    const features = describeProps(manifest, {}).find((s) => s.key === 'features')!;
    expect(newListItem(features, [])).toEqual({ icon: 'Zap', title: 'New title', description: 'New description' });
  });

  it('handles the shapes of the new component manifests', () => {
    const m = {
      ...manifest,
      propsSchema: z.object({
        series: z.array(z.object({ name: z.string().default(''), values: z.array(z.number()).default([]) })).default([]),
        board: z
          .array(z.object({ title: z.string(), cards: z.array(z.object({ title: z.string(), tone: z.enum(['info', 'warn']) })).default([]) }))
          .default([]),
        rows: z.array(z.object({ feature: z.string(), basic: z.union([z.boolean(), z.string()]) })).default([]),
        startDate: z.string().default('2026-10-28'),
        network: z.enum(['x', 'github', 'linkedin']).nullable().optional(),
        limit: z.union([z.number(), z.string()]).optional(),
        speed: z.number().default(300),
        heading: z.string().default('')
      }),
      propControls: {
        speed: { type: 'number', min: 100, max: 2000, step: 50, unit: 'ms', group: 'Animation' },
        heading: { type: 'code', group: 'settings' }
      }
    } as unknown as ComponentManifest;
    const specs = describeProps(m, {});
    const by = Object.fromEntries(specs.map((s) => [s.key, s]));
    expect(by.series.kind).toBe('objectList');
    expect(describeItemFields(by.series.itemSchema, { name: 'A', values: [1, 2] }).find((f) => f.key === 'values')?.kind).toBe('numberList');
    const card = describeItemFields(by.board.itemSchema, { title: 'Todo', cards: [] }).find((f) => f.key === 'cards')!;
    expect(card.kind).toBe('objectList');
    expect(describeItemFields(card.itemSchema, {}).find((f) => f.key === 'tone')?.kind).toBe('enum');
    expect(describeItemFields(by.rows.itemSchema, { feature: 'SSO', basic: true }).find((f) => f.key === 'basic')?.kind).toBe('boolOrText');
    expect(by.startDate.kind).toBe('date');
    expect(by.network.kind).toBe('enum');
    expect(by.limit.kind).toBe('numberOrText');
    expect([by.speed.min, by.speed.max, by.speed.step, by.speed.unit, by.speed.group]).toEqual([100, 2000, 50, 'ms', 'Animation']);
    expect([by.heading.kind, by.heading.group]).toEqual(['code', 'settings']);
    expect(groupSpecs(specs).map((g) => g.title)).toEqual(['Content', 'Items', 'Settings', 'Animation']);
    expect(newListItem(card, [])).toEqual({ title: 'New title', tone: 'info' });
  });
});
