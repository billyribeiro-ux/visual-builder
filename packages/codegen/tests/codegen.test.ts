import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject, createPageFromTemplate, PAGE_TEMPLATE_CATALOG } from '@app-viz/schema';
import { executeCommand } from '@app-viz/engine';
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

  it('includes unified MD3 utility classes, responsive/hover rules, and supports all page templates', () => {
    let project = createDefaultAcmeSaaSProject();
    const heroNodeId = '30000000-0000-0000-0000-000000000002';

    // Add responsive and hover styles to a node
    project = executeCommand(project, {
      type: 'UPDATE_STYLES',
      nodeId: heroNodeId,
      breakpoint: 'tablet',
      styles: { paddingBottom: '40px' }
    });
    project = executeCommand(project, {
      type: 'UPDATE_STYLES',
      nodeId: heroNodeId,
      breakpoint: 'hover',
      styles: { opacity: '0.96' }
    });

    // Add pages from all 6 templates in PAGE_TEMPLATE_CATALOG
    expect(PAGE_TEMPLATE_CATALOG.length).toBeGreaterThanOrEqual(6);
    for (const tpl of PAGE_TEMPLATE_CATALOG) {
      const page = createPageFromTemplate(tpl.key, `/tpl-${tpl.key}`, `Test ${tpl.label}`);
      project = executeCommand(project, { type: 'ADD_PAGE', page });
    }

    const result = generateFullExport(project);
    const appCss = result.files['generated-app/src/app.css'];

    // Verify both single-hyphen and double-hyphen MD3 classes and typography scales exist
    expect(appCss).toContain('.md-section');
    expect(appCss).toContain('.md-grid');
    expect(appCss).toContain('.md-grid-cols-3');
    expect(appCss).toContain('.md-btn-filled');
    expect(appCss).toContain('.md-btn--filled');
    expect(appCss).toContain('.md-card-outlined');
    expect(appCss).toContain('.md-card--outlined');
    expect(appCss).toContain('.md-container-xl');
    expect(appCss).toContain('.md-container--xl');
    expect(appCss).toContain('.md-headline-large');
    expect(appCss).toContain('.md-title-medium');
    expect(appCss).toContain('.md-body-medium');
    expect(appCss).toContain('.md-label-large');
    expect(appCss).toContain('.md-badge');

    // Verify responsive and stateful node rules are emitted into app.css and node wrapper has data-node-id
    expect(appCss).toContain(`[data-node-id="${heroNodeId}"]:hover { opacity: 0.96 !important; }`);
    expect(appCss).toContain(`[data-node-id="${heroNodeId}"] { padding-bottom: 40px !important; }`);
    expect(result.files['generated-app/src/routes/+page.svelte']).toContain(`data-node-id="${heroNodeId}"`);

    // Verify bundled static SVG assets are emitted into generated-app/static/assets/
    expect(result.files['generated-app/static/assets/analytics-pulse.svg']).toContain('<svg');
    expect(result.files['generated-app/static/assets/ai-agent-flow.svg']).toContain('<svg');
  });

  it('emits multi-state interactive runtime (openModal, toggleDrawer, showToast, setState) when rules exist', () => {
    let project = createDefaultAcmeSaaSProject();
    const heroNodeId = '30000000-0000-0000-0000-000000000002';

    project = executeCommand(project, {
      type: 'UPDATE_INTERACTIONS',
      nodeId: heroNodeId,
      interactions: [
        {
          id: '77777777-0000-4000-8000-000000000001',
          name: 'Open Demo Modal',
          trigger: 'onClick',
          actionType: 'openModal',
          payload: {
            modalTitle: 'Live Product Walkthrough',
            modalBody: 'Interactive modal emitted by codegen.',
            modalCta: 'Launch Now'
          }
        }
      ]
    });

    const result = generateFullExport(project);
    const homeSvelte = result.files['generated-app/src/routes/+page.svelte'];
    expect(homeSvelte).toContain('let activeModal = $state');
    expect(homeSvelte).toContain('let activeDrawer = $state');
    expect(homeSvelte).toContain('let activeToast = $state');
    expect(homeSvelte).toContain('Live Product Walkthrough');
  });
});
