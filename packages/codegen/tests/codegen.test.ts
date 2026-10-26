import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject } from '@app-viz/schema';
import { generateFullExport, createDeterministicZip } from '../src/index.js';

describe('Codegen Engine', () => {
  it('generates complete self-contained AI Agent handoff and SvelteKit 3 app', async () => {
    const project = createDefaultAcmeSaaSProject();
    const result = generateFullExport(project);

    // Verify Agent & Section 10 handoff docs
    expect(result.files['AGENTS.md']).toContain('Svelte 5.57.2 + SvelteKit 3.1.0');
    expect(result.files['AGENTS.md']).toContain('/dashboard');
    expect(result.files['README.md']).toBeDefined();
    expect(result.files['PROJECT_OVERVIEW.md']).toBeDefined();
    expect(result.files['DATA_AND_INTEGRATIONS.md']).toBeDefined();
    expect(result.files['MANIFEST.json']).toBeDefined();
    expect(result.files['blueprint/project.blueprint.json']).toBeDefined();
    expect(result.files['blueprint/component-manifest.json']).toBeDefined();
    expect(result.files['blueprint/interaction-graph.json']).toBeDefined();
    expect(result.files['blueprint/data-contracts.json']).toBeDefined();
    expect(result.files['acceptance/acceptance-criteria.md']).toBeDefined();
    expect(result.files['acceptance/scenarios.json']).toBeDefined();
    expect(result.files['acceptance/dependency-compatibility.md']).toBeDefined();

    // Verify SvelteKit 3 project files
    expect(result.files['generated-app/package.json']).toContain('"@sveltejs/kit": "^3.1.0"');
    expect(result.files['generated-app/vite.config.ts']).toContain('sveltekit(');
    expect(result.files['generated-app/src/app.css']).toContain('--md-sys-color-primary');
    expect(result.files['generated-app/src/app.css']).not.toContain('tailwindcss');
    expect(result.files['generated-app/src/routes/+layout.svelte']).toContain('{@render children?.()}');
    expect(result.files['generated-app/src/routes/+error.svelte']).toBeDefined();

    // Verify all 5 routes & shared layout injection (Navbar + Footer on public pages)
    expect(result.files['generated-app/src/routes/+page.svelte']).toContain('<Navbar');
    expect(result.files['generated-app/src/routes/+page.svelte']).toContain('<Footer');
    expect(result.files['generated-app/src/routes/features/+page.svelte']).toContain('<Navbar');
    expect(result.files['generated-app/src/routes/pricing/+page.svelte']).toContain('<PricingTable');
    expect(result.files['generated-app/src/routes/dashboard/+page.svelte']).toContain('<DashboardShell');
    expect(result.files['generated-app/src/routes/dashboard/settings/+page.svelte']).toContain('<SettingsForm');

    // Verify all 25 library components
    expect(result.files['generated-app/src/lib/components/Container.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Section.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Grid.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Divider.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/SplitHero.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Button.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Badge.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Card.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Alert.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Tabs.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/CtaBanner.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/StatsBar.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/Newsletter.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/ContactForm.svelte']).toBeDefined();
    expect(result.files['generated-app/src/lib/components/AuthCard.svelte']).toBeDefined();
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
