import { describe, it, expect } from 'vitest';
import { COMPONENT_REGISTRY, getAllManifests } from '../src/index.js';

describe('Component Registry', () => {
  it('contains valid manifests where defaultProps pass propsSchema', () => {
    const manifests = getAllManifests();
    expect(manifests.length).toBeGreaterThanOrEqual(10);

    for (const manifest of manifests) {
      expect(manifest.type).toBeDefined();
      expect(manifest.displayName).toBeDefined();
      expect(manifest.category).toBeDefined();

      // Ensure defaultProps validate against the schema
      const parsed = manifest.propsSchema.parse(manifest.defaultProps);
      expect(parsed).toBeDefined();
    }
  });

  it('provides key sections like split hero, pricing, navbar and dashboard shell', () => {
    expect(COMPONENT_REGISTRY['hero/split-hero']).toBeDefined();
    expect(COMPONENT_REGISTRY['navigation/navbar']).toBeDefined();
    expect(COMPONENT_REGISTRY['marketing/pricing-table']).toBeDefined();
    expect(COMPONENT_REGISTRY['app/dashboard-shell']).toBeDefined();
  });
});
