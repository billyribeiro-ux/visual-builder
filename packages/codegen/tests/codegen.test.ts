import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject, createPageFromTemplate, PAGE_TEMPLATE_CATALOG } from '@app-viz/schema';
import { executeCommand } from '@app-viz/engine';
import { generateFullExport, createDeterministicZip, COMPONENT_SOURCES } from '../src/index.js';

describe('Codegen Engine', () => {
  it('generates complete self-contained AI Agent handoff and SvelteKit 3 app', async () => {
    const project = createDefaultAcmeSaaSProject();
    const result = generateFullExport(project);

    // Verify Agent & Section 10 handoff docs
    expect(result.files['AGENTS.md']).toMatch(/Svelte 5\.57\.\d+ \+ SvelteKit 3\.1\.\d+/);
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
    const nodesCss = result.files['generated-app/src/lib/styles/nodes.css'];

    // app.css = shared site runtime (verbatim) + project tokens, all scoped under .site-root.
    expect(appCss).toContain(COMPONENT_SOURCES['runtime.css'].trim());
    for (const cls of ['.md-container', '.md-btn', '.md-btn--filled', '.md-card--outlined', '.md-badge', '.md-headline-large', '.md-title-medium', '.md-body-medium', '.md-label-large', '.el-glass']) {
      expect(appCss).toContain(cls);
    }
    expect(appCss).toContain('@keyframes el-fadeInUp');
    expect(appCss).toContain('.site-root {\n  --md-sys-color-');

    // Node styles are compiled into ONE stylesheet with the canvas' compiler; the root layout imports it.
    expect(nodesCss).toContain(`[data-node-id="${heroNodeId}"]:hover { opacity: 0.96 !important; }`);
    expect(nodesCss).toContain(`@media (max-width: 1023px) {\n  [data-node-id="${heroNodeId}"] { padding-bottom: 40px !important; }`);
    expect(result.files['generated-app/src/routes/+layout.svelte']).toContain("import '../lib/styles/nodes.css';");
    expect(result.files['generated-app/src/routes/+layout.svelte']).toContain('<div class="site-root">');
    expect(result.files['generated-app/src/routes/+page.svelte']).toContain(`data-node-id="${heroNodeId}"`);

    // Every page template renders (no unknown component placeholders in the seed templates).
    for (const tpl of PAGE_TEMPLATE_CATALOG) {
      const file = result.files[`generated-app/src/routes/tpl-${tpl.key}/+page.svelte`];
      expect(file, tpl.key).toBeDefined();
      expect(file, tpl.key).not.toContain('<UnknownComponent');
    }

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
    // The page mounts the shared interaction runtime with its sanitized rules…
    expect(homeSvelte).toContain("import InteractionLayer from '#lib/components/lib/InteractionLayer.svelte';");
    expect(homeSvelte).toContain('<InteractionLayer rules={interactionRules} />');
    const rulesLine = homeSvelte.split('\n').find((l) => l.includes('const interactionRules'));
    expect(rulesLine).toContain(`"nodeId":"${heroNodeId}"`);
    expect(rulesLine).toContain('"actionType":"openModal"');
    expect(rulesLine).toContain('Live Product Walkthrough');
    // …and that runtime (shipped in the app) implements modal, drawer, toast and state actions.
    const runtime = result.files['generated-app/src/lib/components/lib/InteractionLayer.svelte'];
    expect(runtime).toContain('let modal = $state');
    expect(runtime).toContain('let drawer = $state');
    expect(runtime).toContain('let toast = $state');
    expect(runtime).toContain('let appState = $state');
    for (const action of ['navigate', 'openModal', 'toggleDrawer', 'showToast', 'setState']) {
      expect(runtime).toContain(`case '${action}':`);
    }
  });
});
