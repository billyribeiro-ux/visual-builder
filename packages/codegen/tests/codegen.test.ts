import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject } from '@app-viz/schema';
import { generateFullExport, createDeterministicZip } from '../src/index.js';

describe('Codegen Engine', () => {
  it('generates complete self-contained AI Agent handoff and SvelteKit 3 app', async () => {
    const project = createDefaultAcmeSaaSProject();
    const result = generateFullExport(project);

    // Verify Agent docs
    expect(result.files['AGENTS.md']).toContain('Svelte 5.57.2 + SvelteKit 3.1.0');
    expect(result.files['AGENTS.md']).toContain('/dashboard');
    expect(result.files['README.md']).toBeDefined();
    expect(result.files['MANIFEST.json']).toBeDefined();
    expect(result.files['blueprint/project.blueprint.json']).toBeDefined();

    // Verify SvelteKit 3 project files
    expect(result.files['generated-app/package.json']).toContain('"@sveltejs/kit": "^3.1.0"');
    expect(result.files['generated-app/vite.config.ts']).toContain('sveltekit()');
    expect(result.files['generated-app/src/app.css']).toContain('@import "tailwindcss";');
    expect(result.files['generated-app/src/routes/+layout.svelte']).toContain('{@render children?.()}');

    // Verify all 5 routes
    expect(result.files['generated-app/src/routes/+page.svelte']).toBeDefined();
    expect(result.files['generated-app/src/routes/features/+page.svelte']).toBeDefined();
    expect(result.files['generated-app/src/routes/pricing/+page.svelte']).toBeDefined();
    expect(result.files['generated-app/src/routes/dashboard/+page.svelte']).toBeDefined();
    expect(result.files['generated-app/src/routes/dashboard/settings/+page.svelte']).toBeDefined();

    // Verify library components
    expect(result.files['generated-app/src/lib/components/Container.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/SplitHero.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Button.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/DashboardShell.svelte']).toBeDefined();
  });

  it('produces bit-for-bit deterministic ZIP archives', async () => {
    const project = createDefaultAcmeSaaSProject();
    const result1 = generateFullExport(project);
    const result2 = generateFullExport(project);

    const zip1 = await createDeterministicZip(result1);
    const zip2 = await createDeterministicZip(result2);

    expect(zip1.byteLength).toBeGreaterThan(1000);
    expect(zip1.byteLength).toBe(zip2.byteLength);

    // Verify byte-level equality
    for (let i = 0; i < zip1.length; i++) {
      expect(zip1[i]).toBe(zip2[i]);
    }
  });
});
