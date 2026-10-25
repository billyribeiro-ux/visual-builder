import { describe, it, expect } from 'vitest';
import {
  ProjectBlueprintSchema,
  createDefaultAcmeSaaSProject,
  migrateBlueprint
} from '../src/index.js';

describe('ProjectBlueprintSchema & Validation', () => {
  it('validates canonical Acme SaaS seed project successfully', () => {
    const defaultProject = createDefaultAcmeSaaSProject();
    const parsed = ProjectBlueprintSchema.parse(defaultProject);

    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.meta.name).toBe('Acme SaaS');
    expect(parsed.pages.length).toBe(5);
    expect(parsed.layouts.length).toBe(1);
    expect(parsed.target.framework).toBe('sveltekit');
    expect(parsed.target.sveltekitVersion).toBe('3.1.0');
  });

  it('rejects invalid blueprints with wrong schema version', () => {
    const defaultProject = createDefaultAcmeSaaSProject();
    const invalid = { ...defaultProject, schemaVersion: '99.0.0' };

    expect(() => ProjectBlueprintSchema.parse(invalid)).toThrow();
  });

  it('runs migration pipeline smoothly', () => {
    const defaultProject = createDefaultAcmeSaaSProject();
    const migrated = migrateBlueprint(defaultProject);

    expect(migrated.meta.name).toBe('Acme SaaS');
    expect(migrated.schemaVersion).toBe('1.0.0');
  });

  it('preserves recursive children in BlueprintNodeSchema', () => {
    const defaultProject = createDefaultAcmeSaaSProject();
    const homePage = defaultProject.pages.find((p) => p.path === '/');
    expect(homePage).toBeDefined();
    expect(homePage?.rootNode.children.length).toBeGreaterThan(0);
  });
});
