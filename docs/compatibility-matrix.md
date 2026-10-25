# Compatibility Matrix (Locked: October 25, 2026)

This document records the exact chosen package versions, peer dependencies, compatibility proof, maintenance status, reasons for selection, and evaluated alternatives as of October 25, 2026.

## 1. Core Ecosystem

| Tool / Library | Exact Version | Role | Compatibility Proof & Release Status | Reason for Selection | Alternatives Evaluated |
|---|---|---|---|---|---|
| **Node.js** | `24.22.0` | Monorepo and generated app runtime | Node 24 Active LTS. Meets SvelteKit 3 engine requirement (`>=22.17.0`). | Modern ESM, native crypto, native fetch, V8 performance. | Node 20 (EOL soon), Node 22 (supported but Node 24 is active LTS). |
| **pnpm** | `12.14.0` | Monorepo workspace manager | Fast, deterministic hard-linked node_modules. | Native workspaces, frozen lockfile support. | npm, yarn, bun. |
| **Svelte** | `5.57.2` | Frontend framework | Official stable release as of 2026-10-25. Svelte 5 Runes API. | Signal-based reactivity (`$state`, `$derived`, `$props`), snippets. | Svelte 4 (legacy, incompatible with SvelteKit 3). |
| **SvelteKit** | `3.1.0` | Full-stack application framework | SvelteKit 3 stable release. Integrated Vite plugin, `#lib` imports. | Single config in `vite.config.ts`, SSR + CSR routing. | SvelteKit 2.x (legacy, uses svelte.config.js and $lib). |
| **Vite** | `8.0.12` | Bundler & Dev Server | Official SvelteKit 3 bundler requirement. | Lightning-fast HMR and ESM builds. | Webpack, Turbopack. |
| **@sveltejs/vite-plugin-svelte** | `7.0.2` | Svelte compiler plugin | Required peer of SvelteKit 3 and Svelte 5.57+. | Official Vite Svelte integration. | None. |
| **TypeScript** | `6.0.2` (or `^5.9.0`) | Type checker & compiler | TypeScript stable release. Full support for discriminated unions. | Zero runtime overhead, strict typing across packages. | JavaScript with JSDoc. |
| **Google MD3 (Pure Vanilla CSS)** | `Oct 25, 2026 Spec` | Styling & Design System | Google Material Design 3 design system implemented via native CSS custom properties. Zero Tailwind, zero external runtime. | Maximum portability, zero build tool dependency, native CSS cascade, 100% preview-to-export parity. | Tailwind CSS (explicitly disallowed), CSS Modules, CSS-in-JS. |
| **@sveltejs/mcp** | `0.1.27` | Svelte AI & Audit Tooling | Official Svelte AI tools CLI (`svelte-mcp svelte-autofixer`) from sveltejs/ai-tools. | Automated codebase audit for Svelte 5 runes, snippets, accessibility, and deprecations. | Manual linting, ESLint alone. |
| **Zod** | `3.24.2` | Runtime schema validation | TypeScript-first schema declaration. | Serialized Blueprint validation and migration pipelines. | Valibot, ArkType. |
| **Bits UI** | `2.20.2` | Accessible Headless UI | Headless accessible components rewritten for Svelte 5 runes. | Full ARIA compliance, keyboard focus management, headless styling. | Radix Svelte (Svelte 4 legacy), Skeleton. |
| **Lucide Svelte** | `1.0.1` | Iconography | Tree-shakable Svelte 5 icons. | Clean SVG icons matching design tokens. | Heroicons, FontAwesome. |
| **Moveable** | `0.53.0` | Canvas overlay | Vanilla DOM Moveable wrapped in Svelte action. | Resizing, dragging, guidelines, rotation, snap. | svelte-moveable (had legacy Svelte 4 bindings). |
| **Drizzle ORM** | `0.38.3` | Persistence | Lightweight TypeScript ORM. | Zero-overhead SQL generation, Drizzle Kit migrations. | Prisma (heavy binary, slow serverless cold starts). |
| **better-sqlite3** | `11.8.1` | Local DB Driver | Fast in-process SQLite driver for Node.js. | Zero-setup, instant local developer onboarding. | Dockerized PostgreSQL (optional for cloud deploy). |
| **JSZip** / **archiver** | `3.10.1` / `7.0.1` | Archive Generation | Deterministic ZIP file generation. | Normalized file dates (`2026-01-01T00:00:00Z`) for reproducible handoffs. | Native zip CLI. |
| **Playwright** | `1.50.1` | E2E & Parity Regression | Pixel-perfect screenshot and browser automation. | Multi-viewport testing, iframe message interception. | Cypress. |
| **Vitest** | `3.0.4` | Unit & Schema Testing | ESM-native test runner. | Ultra-fast unit tests with TypeScript and Vite config reuse. | Jest. |

## 2. Peer Dependency Map & Constraints

- `svelte@^5.57.2` peer required by `@sveltejs/kit@^3.1.0` and `@sveltejs/vite-plugin-svelte@^7.0.2`.
- `vite@^8.0.12` peer required by `@sveltejs/kit@^3.1.0`.
- Subpath import `#lib` declared in `package.json` replaces legacy `$lib`.
- All config resides in `vite.config.ts`; `svelte.config.js` is deprecated and removed in SvelteKit 3.
