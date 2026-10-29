# Architecture

## 1. Invariants

1. **One source of truth.** The `ProjectBlueprint` (zod schema in `packages/schema`) is the only
   authoritative description of a project. Every editor action is a typed `EditorCommand`
   (`packages/engine/src/commands.ts`) applied by a pure reducer with undo/redo history.
2. **One component source.** Each site component exists exactly once, as
   `packages/components/src/svelte/<Name>.svelte`. The studio canvas renders that file, and the
   SvelteKit export copies it verbatim (minus editor-only `data-prop` attributes) through
   `pnpm sync:components` → `packages/codegen/src/generated/component-sources.ts`. A test fails if the
   generated module is stale.
3. **One style compiler.** Node styles reach the DOM only through `compileNodeCss`
   (`packages/engine/src/cascade.ts`): `[data-node-id]` rules, all `!important`, emitted in a fixed order
   (base → tablet → mobile → desktop → wide → states → motion → scroll-driven motion → reduced motion →
   device visibility → scoped custom CSS). The canvas injects the result into the iframe; the export
   writes it to `src/lib/styles/nodes.css`.
4. **Real media queries.** The canvas iframe is rendered at the exact device width (375 / 768 / 1280 /
   1440) and scaled with a CSS transform, so breakpoints behave exactly like the exported site.
   Contract: tablet ≤1023px, mobile ≤767px, desktop ≥1024px, wide ≥1440px.
5. **Same validation everywhere.** Component props go through `resolveComponentProps` (manifest zod
   schema, per-prop fallback to defaults), URLs through `safeHref`/`safeSrc`, CSS through the shared
   sanitizer in `packages/engine/src/css-safety.ts`, ids/attributes through
   `packages/schema/src/attributes.ts` — in the canvas and in the export alike.
6. **Deterministic export.** Same blueprint → byte-identical files and ZIP (normalized dates, sorted keys).

Parity is measured, not assumed: `pnpm test:parity:visual` exports the demo, builds and serves the
generated app, and pixel-diffs it against the studio canvas for every route at 375/768/1280/1440
(`scripts/visual-parity.ts`).

## 2. Packages

| Package | Responsibility |
|---|---|
| `packages/schema` | Blueprint schema + migrations, design tokens and theme presets, demo project and page templates, preflight checks, element id/attribute rules |
| `packages/engine` | Commands, reducer, labelled undo/redo history with coalescing and transactions, lock rules, style cascade + `compileNodeCss`, CSS safety, font loading |
| `packages/components` | Component manifests (`src/manifests/*.ts`, merged by `src/registry.ts`), canonical Svelte components (`src/svelte/`), site runtime CSS, inline icon set, prop resolution, interaction rule collection |
| `packages/codegen` | SvelteKit app export, AI handoff docs, and the stack-agnostic **Claude Code build spec** (`src/spec/`) with stack presets (incl. SvelteKit 3 + Rust/Axum/sqlx/Postgres) |
| `apps/studio` | The editor: shell (`routes/+page.svelte`), canvas iframe (`routes/preview`), panels, inspector, dialogs, design system (`src/lib/styles/studio.css`, `src/lib/ui/*`) |

## 3. Studio ↔ canvas bridge

The canvas is a same-origin iframe (`/preview`). Messages are zod-validated in both directions
(`apps/studio/src/lib/canvas/messages.ts`); both sides check `event.origin` and `event.source`.

- **Studio → canvas:** `PING`, `SYNC_STATE` (blueprint, active page, selection, hover, mode, breakpoint).
- **Canvas → studio:** `PREVIEW_READY`, `SELECT_NODE`, `NAVIGATE_PAGE`, `INLINE_PROP_EDIT` (dot paths such
  as `features.0.title`), `RESIZE_NODE_STYLE` (allow-listed length keys), `NODE_ACTION`,
  `INSERT_STRUCTURE`, `DROP_ITEM`, `KEY_SHORTCUT`, `OPEN_BLOCK_LIBRARY`.

There are no per-node wrapper elements: components spread `data-node-id` onto their root, and
`EditorOverlay.svelte` draws hover/selection/drop affordances in a single measured overlay layer. In
design mode every `<a>` click is intercepted (links never navigate the iframe away); in interactive mode
internal links switch pages inside the canvas.

## 4. Editor features (where they live)

- History: labelled steps (`HistoryManager.undoLabels/redoLabels`), history popover in the top bar,
  named versions (snapshots) in IndexedDB.
- Persistence: IndexedDB project library with autosave, cross-tab change detection, import/export of
  `.appviz.json`, a clipboard shared across tabs/projects (localStorage).
- Inspector: schema-driven Content tab, Style tab per device bucket and per state, Advanced tab
  (developer notes, CSS ID, classes, attributes, motion incl. scroll-driven effects, visibility,
  click interactions, scoped custom CSS).
- Designer notes (`SET_NOTE`, keys `project` / `page:<id>` / `node:<id>`) are emitted into the build
  spec as requirements.

## 5. Security model

| Threat | Mitigation |
|---|---|
| Stored XSS via props | Svelte escapes text; codegen emits string props only as JSON string expressions; no `{@html}` for user content |
| CSS injection | Keys/values validated by `css-safety.ts`; unsafe declarations are dropped, custom CSS with blocked tokens/unbalanced braces is dropped with a comment |
| Dangerous URLs | `safeHref`/`safeSrc`: relative URLs, http(s), mailto, tel only |
| Attribute injection | `htmlId` regex-validated; custom attributes allow-listed (`data-*`, `aria-*`, role, title, lang, dir, tabindex, translate, spellcheck) |
| postMessage spoofing | Origin + source checks and zod schemas on every message |
| Zip slip | Normalized, de-duplicated export paths; no `..` or absolute segments |
| Code execution from blueprints | Interactions are declarative (navigate, scroll to, modal, drawer, toast, set state, mock submit); nothing is evaluated |
| Untrusted video embeds | Only YouTube (`youtube-nocookie.com`) and Vimeo IDs parsed by strict regex are embedded |

## 6. Known gaps

- Interactions run on click only (no hover/submit/load triggers).
- Mock flows (forms, auth, data) are honest mocks; the build spec tells the implementing agent to wire
  real endpoints.
- The full icon set ships with every export (dynamic icon names make safe pruning impossible).
