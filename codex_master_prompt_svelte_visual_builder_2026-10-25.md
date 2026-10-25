# CODEX MASTER PROMPT — SVELTE VISUAL APP BUILDER

## 0. YOUR ROLE AND OPERATING MODE

You are Codex acting as principal software architect, staff full-stack engineer, design-systems architect, visual-editor engineer, code-generation engineer, security reviewer, and technical project lead.

**Begin in PLAN MODE.** Inspect the current repository before proposing a solution. If it is empty, design a new production-oriented monorepo. Produce a specific, prioritized, dependency-aware implementation plan with architecture diagrams (text/Mermaid), actual folders/modules, data contracts, milestones, acceptance tests, decision log, and risk register. Do NOT begin modifying code in Plan Mode. After the plan is approved and execution mode is enabled, implement the entire product in iterative, demonstrably working milestones. At each milestone, run checks, show the working vertical slice, document what exists, and continue on the agreed roadmap. Never confuse a roadmap entry or a UI mockup with an implemented feature.

Act autonomously on non-critical implementation details, selecting sensible defaults rather than repeatedly asking questions. When a decision changes cost, security, export fidelity, or the core architecture, explain the tradeoff in the plan. Do not claim that unfinished features work.

## 1. PRODUCT VISION AND NON-NEGOTIABLE PRIORITY

Build a polished, simple-to-use, WordPress Elementor-like + Figma-like VISUAL WEBSITE, WEB APP, AND RESPONSIVE APP DESIGN BUILDER, designed to make building real Svelte applications with AI coding agents as close as possible to a 1-2-3 workflow.

The primary workflow must be:

1. Create or open a project; add and connect real pages, routes, shared layouts, and app states.
2. Drag and drop from a large, searchable gallery of real, fully customizable sections, component variants, patterns, interactions, and page templates; fine-tune properties with visual controls; interact with the result in a genuine, responsive LIVE website/app preview.
3. Click **Export for AI Agents** and receive a portable, versioned, self-contained, exceptionally detailed handoff file/package plus independently runnable Svelte 5/SvelteKit 3 project source. Another AI agent must be able to take the export and implement or extend the app without guessing the design, behavior, architecture, routes, styling, assets, or acceptance criteria.

This is NOT merely a mockup app, screenshot generator, static page creator, AI chat interface, or Figma canvas that produces an image. It must produce a faithful, semantic, accessible, interactive runtime and deterministic machine-readable specification. **Export quality and preview-to-export fidelity are the defining features.**

Target users are nontechnical or semi-technical builders, founders, designers, and developers. The interface should feel much easier than Figma or Elementor while providing fine-grained design control.

Target deliverable = responsive websites, web apps, dashboards, SaaS interfaces, and mobile-style web/PWA experiences. Do not falsely promise native iOS/Android compilation in version one.

## 2. DATE-LOCKED TECHNICAL POLICY (OCTOBER 25, 2026)

Treat **2026-10-25** as the technology cutoff. Consult CURRENT OFFICIAL documentation and release metadata available as of that date before choosing or installing ANY dependency. Do not rely on older examples in model training. Do not silently use a library version released after the cutoff. Record exact selected versions, peer dependencies, compatibility proof, maintenance status, reason for selection, and alternatives in `docs/compatibility-matrix.md`. Prefer the newest STABLE version proven compatible on that date; do not chase beta/RC versions for convenience. Commit a single frozen lockfile and include Node/package-manager constraints.

The generated-app target MUST use Svelte 5 and SvelteKit 3 (prefer SvelteKit 3.1.x where it is confirmed stable as of the cutoff). Official SvelteKit 3 migration minimums: Node 22.17+, TypeScript 6+, Svelte 5.57.1+, Vite 8.0.12+, and @sveltejs/vite-plugin-svelte 7+. Evidence available for Svelte 5.57.2 and SvelteKit 3.1.0 at the cutoff; independently verify release dates and choose latest valid stable patches. SvelteKit 3 configuration belongs in `vite.config.ts` via its plugin, NOT legacy `svelte.config.js`; `#lib` replaces `$lib`. Use modern Svelte 5 runes (`$state`, `$derived`, `$props`, etc.), snippets, proper TypeScript, current SvelteKit 3 route/navigation/environment APIs, and modern accessible patterns. Check the migration guide before copying any code.

The BUILDER ITSELF may use the framework Codex can implement most reliably, including React 19 / Next.js 16.x if a disciplined analysis proves the editor ecosystem materially superior. **However, strongly prefer Svelte 5/SvelteKit 3 end to end** because sharing actual Svelte component definitions between the live preview and the generated SvelteKit app reduces framework-translation errors. In Plan Mode compare:

A. Entire builder + iframe preview + export runtime in Svelte 5/SvelteKit 3.
B. React/Next.js editor shell with a genuinely running SvelteKit 3 renderer/preview and Svelte-specific export engine.

Score both on (i) preview/export fidelity (highest importance), (ii) complexity/time, (iii) editor drag/drop/resize ecosystem compatibility, (iv) Codex implementation reliability, (v) maintainability, (vi) performance, and (vii) long-term portability. Choose one, justify it, and NEVER build a fake React preview that is only later approximated in Svelte. Shared schemas and Svelte runtime must remain the source of truth in either approach.

Recommended candidates to evaluate, not blindly install: Svelte CLI `sv`; Tailwind CSS 4; shadcn-svelte and Bits UI; Lucide Svelte icons; accessible drag/drop through `svelte-dnd-action` or a verified alternative; `moveable` / `svelte-moveable` ONLY if verified compatible with Svelte 5, otherwise a framework-neutral Moveable wrapper; PostgreSQL + Drizzle ORM; Better Auth or a comparably verified auth solution; Zod-compatible versioned schemas; server-side archive generation; Playwright; Vitest; ESLint; Prettier. Test actual installation before committing. Use first-party web standards and low-dependency approaches where practical.

Use official references first:
- https://svelte.dev/blog/sveltekit-3-is-here
- https://svelte.dev/docs/kit/migrating-to-sveltekit-3
- https://svelte.dev/docs/svelte/overview
- https://svelte.dev/docs/kit/introduction
- https://svelte.dev/packages
- https://shadcn-svelte.com/docs

## 3. FIRST-CLASS EDITOR EXPERIENCE

Build a usable, premium, responsive studio with these zones:

- Top toolbar: project title, saved state, undo/redo, device/breakpoint selector, canvas zoom, edit vs interact/preview mode, page selector, quick commands, export button.
- Left sidebar: pages/routes tree, layer/DOM tree, design system/tokens, component/section library, whole-page templates, assets/media, reusable global sections and custom reusable symbols, search and favorites.
- Center: actual website/app rendered on an editable responsive canvas, with overlays for selection, handles, insert indicators, drop zones, guides, rulers, zoom, pan, visual breakpoints and interactions.
- Right sidebar: context-sensitive property inspector with categories such as Content, Layout, Size, Spacing, Typography, Fill/Border/Shadow, Effects, Responsive, Interactions, Accessibility, Data/Bindings, and Advanced.

Studio must include excellent empty states, onboarding and a preloaded demo project; keyboard shortcuts; accessible tooltips; breadcrumbs for nesting; theme switch; project saving and restore; sensible defaults; search over thousands of conceptual library items without making the interface intimidating.

Interactions in edit mode must not unintentionally navigate away. Preview mode must allow real clicking, scrolling, form interaction, open/close behaviors, and navigation across project pages like a normal functioning app.

## 4. CANVAS AND LOW-LEVEL EDITING REQUIREMENTS

Implement reliable structural drag/drop: add, reposition, reorder, nest, duplicate, delete, lock, hide, copy/paste and wrap/unwrap components; insert before/after/inside valid parents; keyboard move/reorder; deterministic selection; contextual right-click menu; clear drop indicators; rejected drop feedback; no phantom or duplicate nodes. Undo/redo must handle edits, drag/drop, nested structure, deletion and page updates.

Support per-component resizing and precision controls: width/height/min/max; px/%/rem/vw/vh/auto where valid; aspect ratio; flexbox and CSS grid; alignment, direction, wrap, justify, order, gap; margin/padding four sides; z-index, position, overflow; borders, radii, box shadows; background colors/images/gradients; text content and rich-text formatting; colors, font family/weight/size/line height/letter spacing; opacity; transforms when sensible; cursor; transitions; responsive overrides. Prefer flow/flex/grid editing over absolutely positioning everything. Persist semantic CSS/design data, not accidental canvas-screen coordinates.

Stateful style variants: default, hover, focus-visible, active, disabled, selected, loading, checked where relevant. Provide prebuilt button styles, link styles, card effects, image-hover styles, menu/dropdown patterns, microinteractions, transition presets, and animation settings, with a safe reduced-motion fallback. Hover must be inspectable without the selected-state overlay obscuring it.

Responsive design: desktop/tablet/mobile presets plus configurable custom breakpoints; resize preview and edit independently per breakpoint; inherit from wider/narrower styles with clearly shown overrides; enforce reasonable cascade; support true responsive flex/grid behavior and route-level layout. Preview should reproduce actual viewport rendering, not a screenshot scaled to fit.

Accessibility: logical markup and heading hierarchy, focus states, keyboard navigation, labels/alt text, minimum hit-target checks, color contrast warnings, semantic buttons/links, aria behavior for interactive components, reduced motion, and accessibility-oriented validation before export.

## 5. PAGE, ROUTE, AND APP-WIDE STRUCTURE

A project is a complete multipage APPLICATION, not a single canvas. Create/rename/duplicate/reorder/delete pages, specify route path, slug, SEO metadata, page type, dynamic route placeholders when supported, and publish visibility. Support nested routes, shared headers/footers, sidebars, reusable layouts, 404, loading/error/empty/success states. Provide a page tree, route map, link picker, nav menu builder, and route validation to prevent broken internal links.

Support REAL TIME navigation across pages in preview mode with persisted UI state where appropriate. Demo at least one marketing website and one dashboard/SaaS app with interconnected pages, tabs, drawers, editable forms, mock records, data tables, state changes, and basic conditional visibility. Distinguish browser navigation from simulated preview routes and prove the export behaves the same way.

## 6. EXTENSIVE, ACTUAL EDITABLE COMPONENT LIBRARY

Every library entry must be a LIVE reusable component with a manifest, preview, properties, variants, allowed nesting, editable slots/children, state definitions, responsive defaults, and export implementation. Do not pad the library count with empty thumbnails or shallow copies. Build at least 50 meaningfully distinct, usable component/section patterns across multiple categories by the feature-complete beta; aim for 100+ across later milestones. Start with a smaller HIGH-QUALITY working registry and expand systematically.

Categories and examples:
- Page structure: section, stack, container, grid, column, split layout, spacer, divider, sticky bar.
- Site navigation: announcement bar, navbars, mega menu, sidebar, breadcrumbs, pagination, tabs.
- Hero library: centered, split image, video/background, gradient, product, SaaS, app, editorial, dashboard showcase, animated highlights.
- Marketing: feature grids, alternating features, statistics, logos, benefits, steps, service cards, product showcases, case studies, galleries, testimonial sliders, pricing tables, FAQs, CTAs, contact, blog listing, newsletter, footers.
- Interactive UI: primary/secondary/ghost/outline/icon buttons, badges, tooltips, accordions, dropdowns, popovers, modals, sheets/drawers, toast messages, tables, pagination, command/search, alerts, progress bars, skeletons, empty states.
- Web-app UI: dashboard shells, sidebars, KPI cards, data tables, filters, chart shells or working charts, settings, profile, user menu, form layouts, login/sign-up mock states, wizard/stepper, calendar/date controls where library support is verified.
- Media: image, responsive gallery, carousel, video/embed, icon, SVG asset, illustration containers.

Offer dozens of curated whole-page templates (landing, docs, login, dashboard, pricing, contact, settings, blog) and coherent starter-site kits. Preserve original licenses/attribution of any third-party assets; never scrape or copy Elementor/Figma proprietary code or commercial templates.

Provide search/filter by purpose and style, quick hover preview, insert anywhere, favorites, and saved user-created reusable components.

## 7. CORE ARCHITECTURE — SINGLE VERSIONED SOURCE OF TRUTH

Design a formal, documented, **versioned, serializable Project Blueprint**. Never store the product's meaning solely in DOM elements or handcrafted static HTML strings. At minimum model:

- project metadata, schema version, target platform/framework and pinned compatibility versions;
- pages, route definitions, page titles, metadata, layouts and route-to-page mapping;
- an ID-based semantic component tree or normalized graph with parent/child ordering, named slots, typed component registry IDs, props, text, reusable symbol references, media IDs, style declarations, breakpoint overrides, state variants and per-node metadata;
- global design tokens: palette, font families/scales, spacing, radii, shadows, grid widths, breakpoints, motion;
- assets with original filenames, normalized IDs, mime, dimensions, safe path, attribution/license, alt text, and integrity hashes;
- interaction/state graph: event, source node, guard, action, target, destination, state transition, validation and animation;
- typed mock data resources, data-binding references, configurable real backend integration contracts, forms and field schemas;
- reusable global sections/components, libraries/variants and resolved version identifiers;
- requirements, design notes, page descriptions, acceptance scenarios, unresolved integration TODOs.

Use validated schema definitions (e.g., Zod), strong TypeScript discriminated unions, stable UUID/ULID IDs, explicit migrations between blueprint versions, deterministic serialization, schema validation on read/write, and compatibility validation before export. Plan a data model with PostgreSQL/Drizzle for project metadata, user/access management, saved blueprints and snapshots; object storage for media. Store normalized history/versions or JSONB snapshots as appropriate, and explain the tradeoffs.

Every manipulation in the editor must update the Blueprint through typed commands; canvas rendering and code export derive from the same state. Establish a component registry API (`type`, `displayName`, `category`, `propsSchema`, `defaultProps`, `slots`, `allowedParents/Children`, `editableStates`, `responsiveCapabilities`, `renderer`, `exporter`, `thumbnail`, `migrations`). Test that every component registry entry has a valid exporter and editable preview.

No divergence between an internal 'design' representation and a separately hand-maintained runtime. Avoid a one-off, one-way Figma-like export converter.

## 8. LIVE PREVIEW AND INTERACTION ENGINE

Implement a real Svelte runtime renderer using the same validated Blueprint and component registry semantics as the exported app. Prefer a dedicated iframe preview with safe message passing (origin validation and explicit message types). Edit canvas must overlay selection/drop guides without altering the underlying output markup/CSS. Distinguish editable vs interactive preview modes; include full-screen preview and true desktop/tablet/mobile viewports.

Navigation must work between pages without leaving the project context; test open modal, tabs, accordion, dropdown, hover state, theme toggle, scroll-to-anchor, show/hide, form validation, mock submit/success/error, menus, and at least one realistic dashboard flow. Model these as typed, declarative events/actions/state rather than untrusted arbitrary JavaScript snippets.

A preview must not falsely pretend a real database, authentication service, payment service, email sender or third-party API exists. Use clearly tagged, realistic mock adapters for demo flows, with replaceable, typed integration contracts and transparent export TODOs for any feature requiring credentials/infrastructure. Make it possible to attach actual integrations in future without redesigning the state model.

Architect a regression test that opens a sample project in the studio's live preview, exports it, serves the generated SvelteKit project, and compares functionality, DOM-level semantics and Playwright screenshots at multiple viewports/states. Define tolerances, font loading conditions, deterministic seed data and known browser differences. Make **preview/export parity measurable** and block release on regressions.

## 9. EDITABLE DESIGN SYSTEM, MEDIA, AND CONTENT

Create a global design-token editor and per-element property panel; support custom theme presets (light/dark/brand), reusable text styles, color palettes, icon sets, shadows and motion. Changing a token should update all linked components and render instantly; breaking a link must be explicit. Include image upload, image cropping/fit/position, safe responsive formats, compression, font management using permitted licenses, icon picker, asset search, naming and replacement, alt text, and file safety checks.

Provide inline text editing without destructive HTML injection. Add heading, paragraph, list, link, button, icon, image, background and content-editing controls that save back to the versioned blueprint. Support copy/paste sections within a project and portable copy/paste between compatible projects, including asset reference handling.

## 10. THE MOST IMPORTANT FEATURE: AI AGENT HANDOFF + CODE EXPORT

The primary artifact is a **self-contained AI-READY HANDOFF ZIP**. Include (a) a machine-readable `project.blueprint.json`, (b) a fully compilable Svelte 5 / SvelteKit 3 application inside `generated-app/`, and (c) detailed and concise agent instructions. Also allow downloading the blueprint JSON and generated app ZIP separately.

Suggested package layout (refine without reducing coverage):

```
exported-project/
  AGENTS.md
  README.md
  IMPLEMENTATION_SPEC.md
  PROJECT_OVERVIEW.md
  ROUTES_AND_FLOWS.md
  INTERACTIONS.md
  DATA_AND_INTEGRATIONS.md
  DESIGN_SYSTEM.md
  ACCESSIBILITY_AND_TESTING.md
  KNOWN_GAPS.md
  MANIFEST.json
  blueprint/
    project.blueprint.json
    schema-version.json
    component-manifest.json
    routes.json
    interaction-graph.json
    data-contracts.json
  assets/
    ...all referenced, licensed local assets...
  reference/
    screenshots/desktop/
    screenshots/tablet/
    screenshots/mobile/
    preview-parity-report.json
  generated-app/
    package.json
    pnpm-lock.yaml
    vite.config.ts
    tsconfig.json
    src/
      routes/...real SvelteKit 3 +page.svelte, +layout.svelte, +page.ts or server files when needed...
      lib/...component source, typed data, actual reusable patterns, styles...
    static/...assets...
    tests/...Playwright and/or unit smoke tests...
  acceptance/
    acceptance-criteria.md
    scenarios.json
    dependency-compatibility.md
```

`AGENTS.md` MUST provide agents with: exact product requirements and constraints, build commands, target versions and migrations, directory map, schema interpretation, routes and linking behavior, original design tokens and state variants, interaction contracts, what is already implemented vs intentionally mocked, how to replace mocks, test commands, visual regression references, done criteria, and strict instructions to preserve design fidelity. Include no secrets or machine-local paths.

The export must be **deterministic**: equivalent Blueprints at identical versions produce logically identical source assets/manifests; generated output is reproducible, stable, formatted, and human-readable. Prefer idiomatic Svelte component source and readable routes, not a giant opaque runtime that depends on the builder SaaS, serialized DOM dumps, or a single `eval`-like interpreter. Generated source must compile independently and work offline locally wherever backend integrations are not required. No hidden request to your builder's server at runtime.

Generated app must use current SvelteKit 3 file routing, valid Vite/SvelteKit configuration, `#lib` alias, typed props, correct runes/reactivity, CSS tokens, SSR/hydration-safe code, properly scoped styles or deterministic utility classes, imported assets, sensible layouts, semantic HTML, and secure code practices. It must pass install/typecheck/build/test against the lockfile, and must render identically to the preview within documented tolerances.

The generator MUST handle every supported component and interaction. Unsupported features are explicitly rejected or flagged BEFORE export with node/route references and concrete resolution instructions; never silently omit functionality or draw a false placeholder.

Include a straightforward **one-file-for-agents entry point** such as `AGENTS.md` that links to the full handoff details, plus the self-contained `project.blueprint.json` as the formal source of truth. The ZIP is the easiest handoff; the JSON is the canonical portable model.

## 11. PERSISTENCE, AUTH, DATA AND PROJECT MANAGEMENT

Provide a polished project home with create/duplicate/delete/rename, starter templates, recent projects, autosave indicator, revisions/history with restore, import/export and sensible error recovery. Implement secure user ownership and authorization, durable project storage, authenticated media handling, and privacy-safe asset URLs. Initial release can be single-user accounts / private projects; multiplayer real-time collaboration is NOT a launch blocker.

User-generated styles/URLs/media must be validated and sanitized. Prevent stored XSS, unsafe CSS/URL injection, path traversal in ZIPs, SSRF via asset fetchers, zip bombs, CSRF, authorization bypass, supply-chain/license violations, and arbitrary server-side code execution from imported Blueprints. Restrict or sandbox execution as appropriate, validate postMessage origin and payloads, apply CSP, impose file-size limits, and never execute exported source on a privileged server without a trust boundary. Secrets must not leak into handoff packages.

Provide local development via environment templates, migrations, seed data, predictable sample projects and scripted startup. Prefer simple and portable deployment; clearly document production dependencies and asset storage strategy.

## 12. QUALITY, TESTS, PERFORMANCE, AND ACCESSIBILITY

Build with comprehensive automated tests, not only superficial visual checks:

- Schema validation and migration round trips.
- Component registry completeness and serializable/default-props tests.
- Command reducer/editor undo-redo behavior, nested drag/drop, selection and clipboard.
- Pages and route/link resolution, shared layouts, responsive overrides and global token propagation.
- Declarative interaction state machine and preview-vs-export behavior.
- Deterministic generator snapshots and complete generated-app install/typecheck/build tests.
- Playwright E2E on desktop/tablet/mobile, keyboard navigation, editing, autosave/reload, navigation, export, mock form flow, interaction controls.
- Visual parity reference screenshots for core sections and multi-page sample apps.
- Accessibility checks using established tooling when compatible and manual keyboard verification.
- Performance profiling on a representative project containing ~200 nodes with multiple pages; avoid pathological re-renders and laggy drag interactions.
- Security and authorization tests, import validation, asset sanitation, ZIP safety.

Required scripts should include development, typecheck, lint, format check, unit tests, E2E, build, fixture seed, export smoke test and CI equivalents. No `any` abuse, deprecated API reliance, unexplained suppression, broken buttons or placeholder controls disguised as finished work.

## 13. SPECIFIC USER JOURNEY THAT MUST PASS

Build and automate this acceptance demo:

1. Sign in/open studio and create a project called `Acme SaaS` from a blank or SaaS starter.
2. Create pages `/`, `/features`, `/pricing`, `/dashboard`, `/dashboard/settings` and a not-found state.
3. Insert a split hero, sticky header, feature grid, product screenshot, testimonials, pricing section, FAQs and footer from the library.
4. Customize hero text, gradient, fonts, section width, button dimensions, shadows, border radii, spacing, link destination, hover scale/easing and breakpoint-specific alignment from inspector controls.
5. Create dashboard layout using side navigation, cards, table, tabs, profile and a settings form with validation and mock save feedback.
6. Wire navigation, CTA button, tab changes, FAQ accordion, modal, toast, and a form success/error path using visual interaction controls.
7. Preview all pages in full-screen desktop/tablet/mobile, navigate links and interact without editor artifacts.
8. Reload studio, confirm autosaved project intact. Use undo/redo and restore a prior snapshot.
9. Export the AI handoff package and SvelteKit 3 source, extract the generated project outside this repository, run dependency installation using the lockfile, typecheck, production build and dev server.
10. Run parity E2E and screenshot comparisons: generated app must have equivalent content, routes, styles, responsive behavior, hover states, mock interactions and accessibility semantics.
11. Show resulting `AGENTS.md` and one canonical `project.blueprint.json` to demonstrate that a separate coding agent can take over without interpreting screenshots.

Do not mark the end-to-end product ready until this scenario passes.

## 14. IMPLEMENTATION ROADMAP AND STAGED EXECUTION

Implement vertical slices rather than dozens of disconnected screens. Mandatory phase order, refine after repository inspection:

**Phase 0 — Research/architecture:** inspect repository; verify package versions and peer compat; decide Svelte-only vs hybrid; document design; schema draft, data/interaction contracts, registry, codegen pipeline, threat model, repo structure; write detailed plan, tests and risks.

**Phase 1 — The golden vertical slice (MUST INCLUDE EXPORT):** scaffold app; seed project; working page creation; one editable hero, text, button and shared layout; properties editing, node selection, persistence, preview page navigation; export Blueprint and actually installable generated SvelteKit 3 app; demonstrate screenshot parity. This phase proves the architectural hypothesis before scaling the library.

**Phase 2 — Professional editor engine:** layers/tree, drop zones and nested DnD, resize, flex/grid controls, multi-breakpoint styles, selected/hover effects, shortcuts, undo/redo, robust autosave/history, design tokens, media manager.

**Phase 3 — Library and multi-page/site templates:** production-quality section registry, styles/variants, navigation, 50+ functional patterns, categories/search/favorites, global components, reusable symbols, multi-page templates and a website sample.

**Phase 4 — Web-app interactions and data:** typed visual interaction editor; navigation, dialogs, accordions, tabs, form validation and mocked data flows; dashboards, auth UI patterns, settings, table filters, theme, multi-page SaaS sample; preserve export parity.

**Phase 5 — AI handoff sophistication:** full documentation pack, readable codegen, component manifests, route and interaction graphs, assets, automated acceptance scenarios, preflight validation, unsupported-feature reporting, screenshot references, determinism tests and optional separate ZIP/JSON downloads.

**Phase 6 — Production hardening:** security review, performance, keyboard/A11y, test coverage, error recovery, install and onboarding docs, seeded demos, release checklist, deployment instructions, accessibility and visual-regression CI.

Later/optional (design extension points but do NOT let these delay MVP): real-time multiplayer, marketplace/community plugin system, collaborative comments, AI generation inside the editor, direct deployment integrations, live backend connectors, CMS, Git sync, code-import round-trip, native mobile packaging, custom freehand vector editing or Figma file import.

At EACH phase provide: specific shipped features; key files; migrations; test results; screenshot/demo notes; known limitations; remaining risks; exact pass/fail status. Do not advance from Phase 1 until generated-code fidelity has been demonstrated.

## 15. EXACT REQUIRED OUTPUT FROM CODEX PLAN MODE

Your FIRST response must be a buildable PLAN (not a generic essay), containing in this order:

1. Executive summary and the product's key invariant: blueprint → Svelte preview → independent SvelteKit 3 export.
2. Verified as-of-2026-10-25 dependency compatibility matrix with source URLs and exact stable version choices.
3. Side-by-side Svelte-first vs React-editor/Svelte-runtime architecture scorecard; explicit selected stack and justification.
4. System architecture diagram (modules, boundaries, persistence, preview iframe, component registry, export pipeline, tests).
5. Concrete proposed monorepo folder tree with responsibilities, deployment topology and internal packages.
6. Versioned Blueprint schema, component registry type contracts, command/history model, interaction graph, responsive style cascade, route data model and export manifest (include short typed examples).
7. Preview/export parity strategy, realistic limitations and how to measure them.
8. Functional UX wireframe description for studio, component browser, inspector, page navigator and preview; user workflow.
9. Milestone-by-milestone engineering plan with dependencies, named deliverables, runnable acceptance gates, testing and rough effort/risk levels. Prioritize Phase 1 proof of real SvelteKit export.
10. Security, accessibility, licensing, performance and deployment plan; clear MVP vs later-phase scoping.
11. First 10-20 actionable implementation tasks in strict order with expected files and test commands.
12. Critical open questions ONLY if truly blocking. Otherwise state defaults and proceed once the plan is approved.

**Then STOP at the end of Plan Mode.** Await approval to switch to implementation mode. In implementation mode, build the approved architecture and all agreed phases, test each, and correct failures; do not provide a cosmetic mockup as the final deliverable.

## 16. FINAL SUCCESS CRITERIA

The finished builder must enable a person with little coding knowledge to assemble a genuinely interactive, responsive, multipage website or webapp from reusable, customizable sections; preview the same layouts and interactions with high fidelity; press Export; and give another AI coding agent a complete portable handoff package plus working Svelte 5/SvelteKit 3 source that can be installed, built and extended directly.

Design is code-ready. Preview is real. Export is complete. Nothing important is left for the next agent to guess.

Start by inspecting the repository and producing the rigorous Plan Mode response described above.
