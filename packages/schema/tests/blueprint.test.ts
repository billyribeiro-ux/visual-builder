import { describe, expect, it } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  createDefaultAcmeSaaSProject,
  createNode,
  migrateBlueprint,
  migrateBlueprintWithReport,
  reassignNodeIds
} from '../src/index.js';

describe('@app-viz/schema blueprint & migration', () => {
  it('creates a valid default Acme SaaS project at schemaVersion 1.1.0', () => {
    const bp = createDefaultAcmeSaaSProject();
    expect(bp.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(bp.target.svelteVersion).toBe('5.57.3');
    expect(bp.target.sveltekitVersion).toBe('3.1.0');
    expect(bp.target.viteVersion).toBe('8.3.5');
    expect(bp.target.nodeVersion).toBe('26.13.0');
    expect(bp.pages.length).toBeGreaterThanOrEqual(5);
  });

  it('migrates a v1.0.0 blueprint to v1.1.0 and normalizes legacy prop aliases', () => {
    const legacy = createDefaultAcmeSaaSProject() as unknown as Record<string, unknown>;
    legacy.schemaVersion = '1.0.0';
    legacy.target = {
      framework: 'sveltekit',
      svelteVersion: '5.57.2',
      sveltekitVersion: '3.1.0',
      viteVersion: '8.0.12',
      nodeVersion: '22.17.0',
      styling: 'vanilla-md3'
    };

    const legacySection = createNode({
      componentType: 'structure/section',
      name: 'Legacy Section',
      props: {
        variant: 'low',
        paddingY: 'lg'
      },
      children: [
        createNode({
          componentType: 'ui/card',
          name: 'Legacy Card',
          props: {
            title: 'Card Title',
            actionText: 'Learn More',
            actionHref: '/features'
          }
        })
      ]
    });

    const pages = legacy.pages as Array<Record<string, unknown>>;
    pages[0] = {
      ...pages[0],
      rootNode: legacySection
    };

    const report = migrateBlueprintWithReport(legacy);
    expect(report.appliedSteps.length).toBe(1);
    expect(report.fromVersion).toBe('1.0.0');
    expect(report.toVersion).toBe('1.1.0');
    expect(report.blueprint.schemaVersion).toBe('1.1.0');
    expect(report.blueprint.target.nodeVersion).toBe('26.13.0');

    const rootProps = report.blueprint.pages[0].rootNode.props;
    expect(rootProps.surfaceTone).toBe('low');
    expect(rootProps.variant).toBeUndefined();

    const cardProps = report.blueprint.pages[0].rootNode.children[0].props;
    expect(cardProps.ctaText).toBe('Learn More');
    expect(cardProps.ctaHref).toBe('/features');
    expect(cardProps.actionText).toBeUndefined();
  });

  it('reassignNodeIds generates fresh unique IDs across the entire subtree and interaction rules', () => {
    const original = createNode({
      componentType: 'structure/section',
      name: 'Root',
      interactions: [
        {
          id: '00000000-0000-4000-8000-000000000999',
          name: 'Click rule',
          trigger: 'onClick',
          actionType: 'navigate',
          payload: { path: '/pricing' }
        }
      ],
      children: [
        createNode({
          componentType: 'ui/button',
          name: 'CTA',
          props: { label: 'Start' }
        })
      ]
    });

    const cloned = reassignNodeIds(original);
    expect(cloned.id).not.toBe(original.id);
    expect(cloned.children[0].id).not.toBe(original.children[0].id);
    expect(cloned.interactions[0].id).not.toBe(original.interactions[0].id);
    expect(migrateBlueprint(createDefaultAcmeSaaSProject()).schemaVersion).toBe('1.1.0');
  });
});
