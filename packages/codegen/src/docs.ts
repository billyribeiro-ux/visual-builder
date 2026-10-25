import type { ProjectBlueprint } from '@app-viz/schema';

export function generateAgentsMarkdown(blueprint: ProjectBlueprint): string {
  const pageList = blueprint.pages
    .map((p) => `- \`${p.path}\` (${p.slug}): ${p.title}`)
    .join('\n');

  return `# AGENTS.md — Canonical AI Coding Agent Instructions

> **Project Target**: Svelte 5.57.2 + SvelteKit 3.1.0 + Vite 8.0.12 + Google Material Design 3 (MD3)  
> **Schema Version**: ${blueprint.schemaVersion}  
> **Project Name**: ${blueprint.meta.name}  
> **Generation Date**: 2026-10-25T12:00:00Z  

## 1. Operating Instructions for Coding Agents
You are an autonomous AI coding agent tasked with implementing, verifying, or extending this application.
- **Do not invent arbitrary layouts or diverge from design tokens**: The project blueprint in \`blueprint/project.blueprint.json\` is the single versioned source of truth.
- **Framework Constraints**:
  - Svelte 5 runes (\`$state\`, \`$derived\`, \`$props\`, \`$effect\`) MUST be used exclusively.
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
├── IMPLEMENTATION_SPEC.md             # Technical architecture
├── ROUTES_AND_FLOWS.md                # Route contracts & transitions
├── INTERACTIONS.md                    # Event triggers and mock states
├── DESIGN_SYSTEM.md                   # Token references & theme variables
├── ACCESSIBILITY_AND_TESTING.md       # A11y standards & Playwright guidance
├── KNOWN_GAPS.md                      # Checklist of mocked integrations
├── MANIFEST.json                      # Build manifest & hashes
├── blueprint/
│   ├── project.blueprint.json         # Single Source of Truth
│   └── routes.json                    # Serialized route tree
└── generated-app/                     # Fully compilable SvelteKit 3 application
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    └── src/
        ├── app.css                    # Google MD3 pure Vanilla CSS tokens & components
        ├── routes/                    # File-based routes
        └── lib/components/            # Pure Svelte 5 rune components
\`\`\`

## 4. Routes Defined in Blueprint
${pageList}

## 5. What is Implemented vs. What is Intentionally Mocked
- **Implemented**: Complete responsive page templates, design tokens, navbar, split hero, feature grids, pricing table, FAQ accordion, testimonials, dashboard shell, KPI metrics, data tables, and settings forms.
- **Mocked Integrations**:
  - Authentication: Currently simulated in the UI; replace with Better Auth or verified session provider.
  - Database Persistence: Currently rendered with typed mock datasets; replace with Drizzle ORM queries in \`+page.server.ts\`.
  - Email / Notifications: Form submissions display local success feedback; connect to transactional email provider.

## 6. Definition of Done
Any change you implement must:
1. Pass \`pnpm check\` with 0 TypeScript or Svelte errors.
2. Pass \`pnpm build\` without warnings.
3. Preserve design token variable usage in \`src/app.css\` without hardcoding arbitrary hex codes.
`;
}

export function generateReadme(blueprint: ProjectBlueprint): string {
  return `# ${blueprint.meta.name}

> Exported from Svelte Visual App Builder on 2026-10-25.

This is a self-contained, production-ready Svelte 5 and SvelteKit 3 application with an AI Agent handoff package.

## Quickstart

\`\`\`bash
cd generated-app
pnpm install
pnpm dev
\`\`\`

Open [http://localhost:4173](http://localhost:4173) in your browser.

## AI Agent Integration

Coding agents should review \`AGENTS.md\` and \`blueprint/project.blueprint.json\` before making modifications.
`;
}

export function generateImplementationSpec(blueprint: ProjectBlueprint): string {
  return `# IMPLEMENTATION_SPEC.md — Architectural Blueprint

## 1. Specification Overview
- **Project Name**: ${blueprint.meta.name}
- **Target Platform**: Svelte 5.57.2, SvelteKit 3.1.0, Vite 8.0.12, Node >=22.17.0
- **Styling**: Google Material Design 3 (MD3) pure Vanilla CSS with CSS Custom Properties

## 2. State & Reactivity Architecture
All components use Svelte 5 signals:
- Reactive variables declared with \`$state(initialValue)\`
- Derived computations declared with \`$derived(expression)\`
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

export function generateInteractions(blueprint: ProjectBlueprint): string {
  return `# INTERACTIONS.md — Declarative Interaction Graph

## Supported Interactive Behaviors
1. **FAQ Accordion**: Single-open animated accordion with ARIA expanded states.
2. **Settings Form**: Client-side validated form submission with status feedback.
3. **Mobile Navigation Drawer**: Responsive toggle menu with keyboard escape support.
4. **CTA Routing**: Internal routing across project pages via SvelteKit standard \`<a>\` links.
`;
}

export function generateDesignSystem(blueprint: ProjectBlueprint): string {
  const colors = Object.entries(blueprint.tokens.colors || {})
    .map(([k, v]) => `- \`--color-${k}\`: \`${v}\``)
    .join('\n');

  return `# DESIGN_SYSTEM.md — Design Tokens & Styling Specs

## Color Palette Tokens
${colors}

## Breakpoints
- **Mobile**: ${blueprint.tokens.breakpoints?.mobile || '640px'}
- **Tablet**: ${blueprint.tokens.breakpoints?.tablet || '768px'}
- **Desktop**: ${blueprint.tokens.breakpoints?.desktop || '1024px'}
- **Wide**: ${blueprint.tokens.breakpoints?.wide || '1280px'}
`;
}

export function generateA11yAndTesting(): string {
  return `# ACCESSIBILITY_AND_TESTING.md

## Accessibility Standards
- **ARIA**: All interactive controls implement appropriate ARIA roles (\`aria-expanded\`, \`role="region"\`).
- **Focus Rings**: Visual focus visible outlines using \`--color-ring\`.
- **Contrast**: Palette verified for WCAG AA (>= 4.5:1 ratio for normal body copy).

## Testing Commands
\`\`\`bash
# Run unit and svelte checks
pnpm check

# Run e2e tests
pnpm test
\`\`\`
`;
}

export function generateKnownGaps(): string {
  return `# KNOWN_GAPS.md — Explicit Implementation Checklist

The following items are intentionally mocked in the initial export and ready for live integration:

- [ ] Connect \`src/lib/components/SettingsForm.svelte\` to real database endpoint.
- [ ] Configure live authentication (e.g. Better Auth or OAuth2).
- [ ] Set up production domain DNS and SSL certificates.
`;
}

export function generateManifest(blueprint: ProjectBlueprint, fileCount: number): string {
  return JSON.stringify(
    {
      schemaVersion: blueprint.schemaVersion,
      projectId: blueprint.meta.id,
      projectName: blueprint.meta.name,
      generatedAt: '2026-10-25T12:00:00.000Z',
      framework: 'sveltekit-3',
      fileCount,
      targetVersions: blueprint.target
    },
    null,
    2
  );
}
