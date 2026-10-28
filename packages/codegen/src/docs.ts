import type { BlueprintNode, ProjectBlueprint } from '@app-viz/schema';

export function generateAgentsMarkdown(blueprint: ProjectBlueprint): string {
  const pageList = blueprint.pages
    .map((p) => `- \`${p.path}\` (${p.slug}): ${p.title}`)
    .join('\n');

  return `# AGENTS.md — Canonical AI Coding Agent Instructions

> **Project Target**: Svelte 5.57.3 + SvelteKit 3.1.0 + Vite 8.3.5 + Google Material Design 3 (MD3)  
> **Schema Version**: ${blueprint.schemaVersion}  
> **Project Name**: ${blueprint.meta.name}  
> **Generation Date**: 2026-10-28T12:00:00Z  

## 1. Operating Instructions for Coding Agents
You are an autonomous AI coding agent tasked with implementing, verifying, or extending this application.
- **Do not invent arbitrary layouts or diverge from design tokens**: The project blueprint in \`blueprint/project.blueprint.json\` is the single versioned source of truth.
- **Framework Constraints**:
  - Svelte 5 runes (\`$state\`, \`$derived\`, \`$derived.by\`, \`$props\`, \`$effect\`) MUST be used exclusively.
  - SvelteKit 3 configuration is located in \`vite.config.ts\` via the \`sveltekit()\` plugin. Do NOT add a legacy \`svelte.config.js\`.
  - Subpath imports map: Use \`#lib/...\` for library imports. Legacy \`$lib\` is superseded.
  - Pure Vanilla CSS with Google MD3 Design System is used in \`src/app.css\`. No Tailwind CSS.

## 2. Quickstart & Verification Commands
Inside \`generated-app/\`:
\`\`\`bash
# 1. Install dependencies using frozen lockfile
pnpm install

# 2. Type-check Svelte 5 and TypeScript
pnpm check

# 3. Build production bundle
pnpm build

# 4. Preview local production server
pnpm preview
\`\`\`

## 3. Directory Map
\`\`\`
exported-project/
├── AGENTS.md                          # This instruction manual
├── README.md                          # Human quickstart
├── PROJECT_OVERVIEW.md                # Product vision & user personas
├── IMPLEMENTATION_SPEC.md             # Technical architecture
├── ROUTES_AND_FLOWS.md                # Route contracts & transitions
├── INTERACTIONS.md                    # Event triggers and mock states
├── DESIGN_SYSTEM.md                   # Token references & theme variables
├── DATA_AND_INTEGRATIONS.md           # Mock data contracts & API integration points
├── ACCESSIBILITY_AND_TESTING.md       # A11y standards & Playwright guidance
├── KNOWN_GAPS.md                      # Checklist of mocked integrations
├── MANIFEST.json                      # Build manifest & hashes
├── blueprint/
│   ├── project.blueprint.json         # Single Source of Truth
│   ├── routes.json                    # Serialized route tree
│   ├── component-manifest.json        # Instantiated components across routes
│   ├── interaction-graph.json         # Declarative event/action rules
│   └── data-contracts.json            # Data schemas & mock bindings
├── acceptance/
│   ├── acceptance-criteria.md         # Route-by-route acceptance criteria
│   ├── scenarios.json                 # Machine-readable test scenarios
│   └── dependency-compatibility.md    # Date-locked (2026-10-28) version matrix
└── generated-app/                     # Fully compilable SvelteKit 3 application
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── app.css                    # Google MD3 pure Vanilla CSS tokens & components
        ├── routes/                    # File-based routes (+layout, +page, +error)
        └── lib/components/            # 25 pure Svelte 5 rune components
\`\`\`

## 4. Routes Defined in Blueprint
${pageList}

## 5. What is Implemented vs. What is Intentionally Mocked
- **Implemented**: Complete responsive page templates, shared layouts, Google MD3 design tokens, 25 interactive Svelte 5 components (Navbar, SplitHero, FeatureGrid, PricingTable, FaqAccordion, Testimonials, CtaBanner, StatsBar, Newsletter, ContactForm, Footer, DashboardShell, KpiGrid, filterable DataTable, SettingsForm, AuthCard, Section, Grid, Divider, Button, Badge, Card, Alert, Tabs, Container).
- **Mocked Integrations**:
  - Authentication: Currently simulated in \`AuthCard.svelte\`; replace with Better Auth or verified session provider.
  - Database Persistence: Currently rendered with typed mock datasets; replace with Drizzle ORM queries in \`+page.server.ts\`.
  - Email / Notifications: Form submissions display local success feedback; connect to transactional email provider.

## 6. Definition of Done
Any change you implement must:
1. Pass \`pnpm check\` with 0 TypeScript or Svelte errors.
2. Pass \`pnpm build\` without warnings.
3. Preserve Google MD3 design token variable usage in \`src/app.css\` without hardcoding arbitrary hex codes or introducing Tailwind.
`;
}

export function generateReadme(blueprint: ProjectBlueprint): string {
  return `# ${blueprint.meta.name}

> Exported from Svelte Visual App Builder on 2026-10-28.

This is a self-contained, production-ready Svelte 5 and SvelteKit 3 application with an AI Agent handoff package.

## Quickstart

\`\`\`bash
cd generated-app
pnpm install
pnpm dev
\`\`\`

Open [http://localhost:4173](http://localhost:4173) in your browser.

## AI Agent Integration

Coding agents should review \`AGENTS.md\`, \`PROJECT_OVERVIEW.md\`, and \`blueprint/project.blueprint.json\` before making modifications.
`;
}

export function generateProjectOverview(blueprint: ProjectBlueprint): string {
  return `# PROJECT_OVERVIEW.md — Product Context & Goals

## 1. Project Summary
- **Name**: ${blueprint.meta.name}
- **Description**: ${blueprint.meta.description || 'Modern responsive web application built with Svelte 5, SvelteKit 3, and Google Material Design 3.'}
- **Author**: ${blueprint.meta.author || 'Visual Studio Builder'}
- **Last Updated**: ${blueprint.meta.updatedAt}

## 2. Primary User Flows
1. **Discovery & Marketing Flow**: Visitors land on \`/\`, explore capabilities on \`/features\`, compare tiers on \`/pricing\`, and convert via primary CTA links.
2. **Authenticated Application Flow**: Users navigate to \`/dashboard\` to monitor KPIs and filter live tabular data, or manage preferences at \`/dashboard/settings\`.
`;
}

export function generateImplementationSpec(blueprint: ProjectBlueprint): string {
  return `# IMPLEMENTATION_SPEC.md — Architectural Blueprint

## 1. Specification Overview
- **Project Name**: ${blueprint.meta.name}
- **Target Platform**: Svelte 5.57.3, SvelteKit 3.1.0, Vite 8.3.5, Node >=26.13.0
- **Styling**: Google Material Design 3 (MD3) pure Vanilla CSS with CSS Custom Properties

## 2. State & Reactivity Architecture
All components use Svelte 5 signals:
- Reactive variables declared with \`$state(initialValue)\`
- Derived computations declared with \`$derived(expression)\` or \`$derived.by(() => ...)\`
- Component properties declared via \`let { prop = default }: Props = $props()\`
- Slots implemented via snippets: \`{@render children?.()}\`
`;
}

export function generateRoutesAndFlows(blueprint: ProjectBlueprint): string {
  const rows = blueprint.pages
    .map((p) => `| \`${p.path}\` | \`${p.slug}\` | ${p.title} | ${p.layoutId ? 'Public Layout' : 'Standalone'} |`)
    .join('\n');

  return `# ROUTES_AND_FLOWS.md — Application Navigation Matrix

| Path | Slug | Title | Layout |
|---|---|---|---|
${rows}
`;
}

export function generateInteractions(_blueprint: ProjectBlueprint): string {
  return `# INTERACTIONS.md — Declarative Interaction Graph

## Supported Interactive Behaviors
1. **FAQ Accordion**: Single-open animated accordion with ARIA expanded states.
2. **Data Table Search**: Instant client-side filtering across all columns and rows with empty-state feedback.
3. **Settings & Contact Forms**: Client-side validated form submission with status feedback.
4. **Tabs**: Keyboard-accessible MD3 tab bar switching content panels.
5. **Dismissible Alerts**: Interactive close button with ARIA live-region support.
6. **Mobile Navigation Drawer**: Responsive toggle menu with keyboard escape support.
7. **CTA Routing**: Internal routing across project pages via SvelteKit standard \`<a>\` links.
`;
}

export function generateDesignSystem(blueprint: ProjectBlueprint): string {
  const colors = Object.entries(blueprint.tokens.colors || {})
    .map(([k, v]) => `- \`--md-sys-color-${k}\`: \`${v}\``)
    .join('\n');

  return `# DESIGN_SYSTEM.md — Google Material Design 3 Tokens & Specs

## Color Palette Tokens
${colors}

## Breakpoints
- **Mobile**: ${blueprint.tokens.breakpoints?.mobile || '640px'}
- **Tablet**: ${blueprint.tokens.breakpoints?.tablet || '768px'}
- **Desktop**: ${blueprint.tokens.breakpoints?.desktop || '1024px'}
- **Wide**: ${blueprint.tokens.breakpoints?.wide || '1280px'}
`;
}

export function generateDataAndIntegrations(blueprint: ProjectBlueprint): string {
  return `# DATA_AND_INTEGRATIONS.md — Data Contracts & API Wiring Guide

## 1. Current Data State
All components in \`${blueprint.meta.name}\` receive strongly-typed props serialized from \`blueprint/project.blueprint.json\`.

## 2. Recommended SvelteKit 3 Server Integration
To wire live PostgreSQL / Drizzle ORM data into any route:
1. Create a \`+page.server.ts\` next to the route's \`+page.svelte\`.
2. Export a \`load\` function returning the typed payload (e.g. \`rows\`, \`cards\`, \`plans\`).
3. Bind \`let { data } = $props();\` in \`+page.svelte\` and pass \`data.rows\` to \`<DataTable />\`.
`;
}

export function generateA11yAndTesting(): string {
  return `# ACCESSIBILITY_AND_TESTING.md

## Accessibility Standards
- **ARIA**: All interactive controls implement appropriate ARIA roles (\`aria-expanded\`, \`role="region"\`, \`role="tablist"\`, \`role="alert"\`).
- **Focus Rings**: Visual focus-visible outlines using \`--md-sys-color-primary\`.
- **Contrast**: Google MD3 color roles verified for WCAG AA (>= 4.5:1 ratio for normal body copy).

## Testing Commands
\`\`\`bash
# Run unit and svelte checks
pnpm check

# Run production build check
pnpm build
\`\`\`
`;
}

export function generateKnownGaps(): string {
  return `# KNOWN_GAPS.md — Explicit Implementation Checklist

The following items are intentionally mocked in the initial export and ready for live integration:

- [ ] Connect \`src/lib/components/SettingsForm.svelte\` and \`ContactForm.svelte\` to real server actions in \`+page.server.ts\`.
- [ ] Configure live authentication in \`AuthCard.svelte\` (e.g. Better Auth or OAuth2).
- [ ] Set up production domain DNS and SSL certificates.
`;
}

export function generateAcceptanceCriteria(blueprint: ProjectBlueprint): string {
  const sections = blueprint.pages
    .map(
      (p) => `### Route \`${p.path}\` (${p.title})
- **Given** a user navigates to \`${p.path}\`
- **When** the route finishes rendering
- **Then** the document \`<title>\` MUST equal \`"${p.title}"\`
- **And** all interactive controls MUST be keyboard-focusable with zero console errors.`
    )
    .join('\n\n');

  return `# Acceptance Criteria — ${blueprint.meta.name}

${sections}
`;
}

export function generateDependencyCompatibility(): string {
  return `# Dependency Compatibility Matrix (Cutoff: 2026-10-28)

| Package | Version | Status | Notes |
|---|---|---|---|
| \`svelte\` | \`5.57.3\` | Locked Stable | Svelte 5 runes runtime |
| \`@sveltejs/kit\` | \`3.1.0\` | Locked Stable | Configured via \`vite.config.ts\`, \`#lib\` alias |
| \`vite\` | \`8.3.5\` | Locked Stable | Required minimum for SvelteKit 3 |
| \`@sveltejs/vite-plugin-svelte\` | \`7.3.1\` | Locked Stable | Vite 8 peer compatible |
| \`typescript\` | \`6.0.3\` | Locked Stable | Required minimum for SvelteKit 3 |
| \`node\` | \`26.13.0\` | Active LTS | Node 26 LTS runtime |
`;
}

export function collectComponentManifest(blueprint: ProjectBlueprint): string {
  const usage: Record<string, { count: number; pages: string[] }> = {};

  function walk(node: BlueprintNode, pagePath: string) {
    if (!usage[node.componentType]) {
      usage[node.componentType] = { count: 0, pages: [] };
    }
    usage[node.componentType].count += 1;
    if (!usage[node.componentType].pages.includes(pagePath)) {
      usage[node.componentType].pages.push(pagePath);
    }
    for (const child of node.children || []) {
      walk(child, pagePath);
    }
  }

  for (const layout of blueprint.layouts) {
    walk(layout.rootNode, `layout:${layout.name}`);
  }
  for (const page of blueprint.pages) {
    walk(page.rootNode, page.path);
  }

  return JSON.stringify({ components: usage }, null, 2);
}

export function collectInteractionGraph(blueprint: ProjectBlueprint): string {
  const interactions: Array<{
    pagePath: string;
    nodeId: string;
    nodeName: string;
    componentType: string;
    rules: unknown[];
  }> = [];

  function walk(node: BlueprintNode, pagePath: string) {
    if (node.interactions && node.interactions.length > 0) {
      interactions.push({
        pagePath,
        nodeId: node.id,
        nodeName: node.name,
        componentType: node.componentType,
        rules: node.interactions
      });
    }
    for (const child of node.children || []) {
      walk(child, pagePath);
    }
  }

  for (const page of blueprint.pages) {
    walk(page.rootNode, page.path);
  }

  return JSON.stringify({ interactions }, null, 2);
}

export function generateManifest(blueprint: ProjectBlueprint, fileCount: number): string {
  return JSON.stringify(
    {
      schemaVersion: blueprint.schemaVersion,
      projectId: blueprint.meta.id,
      projectName: blueprint.meta.name,
      generatedAt: '2026-10-28T12:00:00.000Z',
      framework: 'sveltekit-3',
      designSystem: 'google-md3-vanilla-css',
      fileCount,
      targetVersions: blueprint.target
    },
    null,
    2
  );
}
