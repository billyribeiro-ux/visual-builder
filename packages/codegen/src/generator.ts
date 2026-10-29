import type { ProjectBlueprint } from '@app-viz/schema';
import { generateAppCss, generateNodesCss } from './tokens.js';
import {
  generatePackageJson,
  generateViteConfig,
  generateTsConfig,
  generateAppHtml
} from './project-files.js';
import { getComponentSources } from './components.js';
import { normalizeAssetPath, dedupePaths } from './paths.js';
import { collectAssetFiles } from './assets.js';
import { generatePageRoute, generateRootLayout, generateErrorRoute } from './routes.js';
import {
  generateAgentsMarkdown,
  generateReadme,
  generateProjectOverview,
  generateImplementationSpec,
  generateRoutesAndFlows,
  generateInteractions,
  generateDesignSystem,
  generateDataAndIntegrations,
  generateA11yAndTesting,
  generateKnownGaps,
  generateAcceptanceCriteria,
  generateDependencyCompatibility,
  collectComponentManifest,
  collectInteractionGraph,
  generateManifest
} from './docs.js';

export { normalizeAssetPath, dedupePaths } from './paths.js';

export interface GeneratedProject {
  files: Record<string, string>;
  /** Binary files (uploaded raster images), keyed like `files`. */
  binaryFiles?: Record<string, Uint8Array>;
}

/* ==========================================================================
   Path safety: page paths and asset localPaths become ZIP entry paths, so
   they must never contain `..`, absolute prefixes, or unexpected characters.
   ========================================================================== */

/** SvelteKit param segment: [id], [[optional]], [...rest] (identifier chars only). */
const DYNAMIC_SEGMENT_RE = /^(\[\[[a-z_][a-z0-9_]*\]\]|\[(\.\.\.)?[a-z_][a-z0-9_]*\])$/;

function normalizeRouteSegment(raw: string): string {
  const seg = raw.trim().toLowerCase();
  if (!seg || seg === '.' || seg === '..') return '';
  if (DYNAMIC_SEGMENT_RE.test(seg)) return seg;
  const hasBrackets = /[[\]]/.test(seg);
  let cleaned = seg.replace(/[^a-z0-9\-_[\]]+/g, '-');
  if (hasBrackets) {
    // Keep a single well-formed [param] if present, otherwise strip brackets entirely.
    const inner = /^\[+([a-z_][a-z0-9_]*)\]+$/.exec(cleaned.replace(/-/g, '_'));
    cleaned = inner ? `[${inner[1]}]` : cleaned.replace(/[[\]]/g, '');
  }
  cleaned = cleaned.replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
  return cleaned;
}

/**
 * Normalizes a page path into a safe SvelteKit route directory (no leading or
 * trailing slash; '' means the root route). Lowercases segments, collapses
 * `//`, drops `.` / `..` segments, and restricts each segment to
 * `[a-z0-9-_[\]]` (well-formed SvelteKit dynamic segments are preserved).
 */
export function normalizeRoutePath(path: string): string {
  return String(path ?? '')
    .replace(/\\/g, '/')
    .split(/[?#]/)[0]
    .split('/')
    .map(normalizeRouteSegment)
    .filter(Boolean)
    .join('/');
}


export function generateFullExport(blueprint: ProjectBlueprint): GeneratedProject {
  const files: Record<string, string> = {};
  const routeDirs = dedupePaths(blueprint.pages.map((p) => normalizeRoutePath(p.path)));
  const routeUrl = (idx: number) => `/${routeDirs[idx]}`;

  // 1. Root Agent & Human Documentation
  files['AGENTS.md'] = generateAgentsMarkdown(blueprint);
  files['README.md'] = generateReadme(blueprint);
  files['PROJECT_OVERVIEW.md'] = generateProjectOverview(blueprint);
  files['IMPLEMENTATION_SPEC.md'] = generateImplementationSpec(blueprint);
  files['ROUTES_AND_FLOWS.md'] = generateRoutesAndFlows(blueprint);
  files['INTERACTIONS.md'] = generateInteractions(blueprint);
  files['DESIGN_SYSTEM.md'] = generateDesignSystem(blueprint);
  files['DATA_AND_INTEGRATIONS.md'] = generateDataAndIntegrations(blueprint);
  files['ACCESSIBILITY_AND_TESTING.md'] = generateA11yAndTesting();
  files['KNOWN_GAPS.md'] = generateKnownGaps();

  // 2. Machine-Readable Blueprint Files
  files['blueprint/project.blueprint.json'] = JSON.stringify(blueprint, null, 2);
  files['blueprint/routes.json'] = JSON.stringify(
    blueprint.pages.map((p, idx) => ({
      path: routeUrl(idx),
      slug: p.slug,
      title: p.title,
      layoutId: p.layoutId || null
    })),
    null,
    2
  );
  files['blueprint/component-manifest.json'] = collectComponentManifest(blueprint);
  files['blueprint/interaction-graph.json'] = collectInteractionGraph(blueprint);
  files['blueprint/data-contracts.json'] = JSON.stringify(
    {
      schemaVersion: blueprint.schemaVersion,
      collections: [
        {
          name: 'WorkspaceActivity',
          fields: ['Workspace', 'Status', 'MRR', 'Region', 'Updated']
        },
        {
          name: 'UserProfile',
          fields: ['name', 'email', 'notificationsEnabled']
        }
      ]
    },
    null,
    2
  );
  files['blueprint/schema-version.json'] = JSON.stringify(
    { version: blueprint.schemaVersion, target: blueprint.target },
    null,
    2
  );

  // 3. Acceptance & Compatibility Artifacts
  files['acceptance/acceptance-criteria.md'] = generateAcceptanceCriteria(blueprint);
  files['acceptance/scenarios.json'] = JSON.stringify(
    {
      scenarios: blueprint.pages.map((p, idx) => ({
        id: `route-${p.slug}`,
        path: routeUrl(idx),
        expectedTitle: p.title,
        expectedStatus: 200
      }))
    },
    null,
    2
  );
  files['acceptance/dependency-compatibility.md'] = generateDependencyCompatibility();

  // 4. Generated SvelteKit 3 Application
  const appPrefix = 'generated-app/';
  files[`${appPrefix}package.json`] = generatePackageJson(blueprint);
  files[`${appPrefix}vite.config.ts`] = generateViteConfig();
  files[`${appPrefix}tsconfig.json`] = generateTsConfig();
  files[`${appPrefix}src/app.html`] = generateAppHtml(blueprint);
  files[`${appPrefix}src/app.css`] = generateAppCss(blueprint.tokens);
  files[`${appPrefix}src/lib/styles/nodes.css`] = generateNodesCss(blueprint);
  files[`${appPrefix}src/routes/+layout.svelte`] = generateRootLayout(blueprint);
  files[`${appPrefix}src/routes/+error.svelte`] = generateErrorRoute();

  // Add individual page routes (normalized + de-duplicated; never overwrite)
  blueprint.pages.forEach((page, idx) => {
    const routeDir = routeDirs[idx];
    const routeFile = routeDir ? `src/routes/${routeDir}/+page.svelte` : 'src/routes/+page.svelte';
    files[`${appPrefix}${routeFile}`] = generatePageRoute(page, blueprint);
  });

  // Canonical site components (the exact files the studio canvas renders)
  const components = getComponentSources();
  for (const [compPath, source] of Object.entries(components)) {
    files[`${appPrefix}${compPath}`] = source;
  }

  // Project assets (uploaded images, SVGs) → generated-app/static/<normalized path>
  const assets = collectAssetFiles(blueprint);
  for (const [rel, content] of Object.entries(assets.text)) files[`${appPrefix}static/${rel}`] = content;
  const binaryFiles: Record<string, Uint8Array> = {};
  for (const [rel, bytes] of Object.entries(assets.binary)) binaryFiles[`${appPrefix}static/${rel}`] = bytes;

  // 5. Parity and Audit Report
  files['reference/preview-parity-report.json'] = JSON.stringify(
    {
      projectId: blueprint.meta.id,
      pageCount: blueprint.pages.length,
      componentFileCount: Object.keys(components).length,
      componentSource: 'packages/components/src/svelte (shared with the studio canvas)',
      nodeStyles: 'src/lib/styles/nodes.css (compileNodeCss, shared with the studio canvas)',
      generatedAt: '2026-10-28T12:00:00.000Z'
    },
    null,
    2
  );

  // 6. Final Manifest with total file count
  files['MANIFEST.json'] = generateManifest(blueprint, Object.keys(files).length + Object.keys(binaryFiles).length + 1);

  return Object.keys(binaryFiles).length > 0 ? { files, binaryFiles } : { files };
}
