# Compatibility matrix (verified 2026-10-28)

Versions below are the ones actually installed from `pnpm-lock.yaml` on 2026-10-28. Anything not
listed here is **not** a dependency of the studio or of generated apps.

## Toolchain

| Tool | Version | Notes |
|---|---|---|
| Node.js | 26.13.0 | `.nvmrc` / `.node-version`; `engines.node >= 26.13.0` everywhere |
| pnpm | 12.16.1 | `packageManager` field; workspace = `packages/*`, `apps/*` |
| TypeScript | 6.0.3 | SvelteKit 3.1 and svelte-check 4.7 peer on TS 6 |

## Studio (`apps/studio`) and shared packages

| Package | Version | Role |
|---|---|---|
| svelte | 5.57.3 | Runes-only components (studio chrome + canonical site components) |
| @sveltejs/kit | 3.1.0 | Studio app; config lives in `vite.config.ts` (no `svelte.config.js`), `#lib` subpath import |
| vite | 8.3.5 | Dev server / bundler |
| @sveltejs/vite-plugin-svelte | 7.3.1 | Required by SvelteKit 3 |
| @sveltejs/adapter-auto | 8.0.0 | Studio deployment adapter |
| svelte-check | 4.7.7 | Type/a11y checks (`pnpm --filter @app-viz/studio check`) |
| zod | 4.6.7 | Blueprint schema, component prop schemas, postMessage protocol |
| phosphor-svelte | 3.1.1 | Studio UI icons only — always deep-imported (`phosphor-svelte/lib/<Name>Icon`). Generated sites never depend on it |
| jszip | 3.10.2 | Deterministic export ZIPs (normalized dates) |
| vitest | 5.0.5 | Unit tests (`npx vitest run` from the repo root) |
| @playwright/test | 1.64.1 | Browser checks; driven with the system Chrome (`channel: 'chrome'`), no browser downloads |
| tsx | 4.23.15 | Repo scripts (`pnpm sync:components`, icon extraction, parity script) |

## Generated SvelteKit app (`generated-app/`)

Declared by `packages/codegen/src/project-files.ts` as caret ranges from these floors: svelte ^5.57.3,
@sveltejs/kit ^3.1.0, vite ^8.3.5, @sveltejs/vite-plugin-svelte ^7.3.1, @sveltejs/adapter-auto ^8.0.0,
TypeScript ^6.0.3, svelte-check ^4.7.7. The export does not ship a lockfile. **No runtime dependencies**:
components, the inline SVG icon set (380 Phosphor-derived icons, MIT) and the site runtime CSS are
copied as source.

## Build-spec stack presets (`packages/codegen/src/spec/stacks.ts`)

Version pins for other stacks (Next.js, Nuxt, Astro, React Router, SvelteKit + Rust) are guidance for the
implementing agent and live in that file; the Rust crate versions in the `sveltekit-rust` preset were read
from crates.io on 2026-10-28 (axum 0.8.9, tokio 1.54.1, sqlx 0.9.0, tower-http 0.7.1, serde 1.0.229).

## Licences

- Phosphor Icons (studio UI via phosphor-svelte; site icon paths extracted into `packages/components/src/svelte/lib/icons.ts`): MIT.
- Inter, JetBrains Mono and the site fonts are loaded from Google Fonts (SIL OFL). The export loads web fonts only for families on the allowlist in `packages/engine/src/fonts.ts`; this is a third-party request in generated sites.
