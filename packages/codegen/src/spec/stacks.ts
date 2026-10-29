/**
 * Target-stack presets for the Claude Code build spec.
 *
 * The blueprint is framework-agnostic; a preset only tells the coding agent how to map the
 * spec onto a concrete stack (routing files, layout files, component files, styling, and
 * where interactivity lives). Versions were verified against the npm registry on 2026-10-28.
 */

export type StackId =
  | 'nextjs'
  | 'sveltekit'
  | 'sveltekit-rust'
  | 'nuxt'
  | 'astro'
  | 'react-router'
  | 'html'
  | 'custom';

export type StylingId = 'tailwind' | 'css-variables' | 'css-modules';

export interface StackPreset {
  id: StackId;
  label: string;
  tagline: string;
  /** Install / scaffold guidance. */
  scaffold: string;
  /** Pinned core versions (latest stable as of the spec date). */
  versions: Record<string, string>;
  defaultStyling: StylingId;
  supportedStyling: StylingId[];
  /** Maps a URL path (e.g. "/pricing", "/blog/[slug]") to the file the agent should create. */
  routeFile: (path: string) => string;
  layoutFile: (layoutSlug: string) => string;
  componentFile: (componentName: string) => string;
  /** How client-side interactivity (accordions, tabs, forms, modals) must be implemented. */
  interactivity: string;
  /** Extra stack-specific conventions. */
  conventions: string[];
  verifyCommands: string[];
}

export const SPEC_DATE = '2026-10-28';
export const NODE_LTS = '26.13.0';

const segs = (path: string) => path.replace(/^\/+|\/+$/g, '');

export const STACK_PRESETS: Record<StackId, StackPreset> = {
  nextjs: {
    id: 'nextjs',
    label: 'Next.js (App Router) + React',
    tagline: 'React Server Components, file-based routing in app/',
    scaffold: 'pnpm create next-app@latest --ts --app --eslint --src-dir --import-alias "@/*"',
    versions: { next: '16.4.3', react: '19.3.1', 'react-dom': '19.3.1', typescript: '7.0.2', tailwindcss: '4.3.3' },
    defaultStyling: 'tailwind',
    supportedStyling: ['tailwind', 'css-modules', 'css-variables'],
    routeFile: (p) => (segs(p) ? `src/app/(site)/${segs(p)}/page.tsx` : 'src/app/(site)/page.tsx'),
    layoutFile: (slug) => `src/app/(site)/layout.tsx   // layout: ${slug}`,
    componentFile: (name) => `src/components/${name}.tsx`,
    interactivity:
      'Pages and static sections are Server Components. Only components with state (accordion, tabs, forms, modals, drawers, toasts, mobile nav) get "use client" and must be leaf components. Use next/link for internal links.',
    conventions: [
      'Export `metadata` (title, description) from every page.tsx using the page SEO values in the spec.',
      'Pages that do not use the shared layout live in a separate route group (e.g. src/app/(app)/dashboard/page.tsx) with its own layout.',
      'Put design tokens in src/app/globals.css (`@theme` block when using Tailwind v4).'
    ],
    verifyCommands: ['pnpm lint', 'pnpm exec tsc --noEmit', 'pnpm build']
  },
  sveltekit: {
    id: 'sveltekit',
    label: 'SvelteKit + Svelte 5 (runes)',
    tagline: 'File-based routing in src/routes, runes for state',
    scaffold: 'pnpm dlx sv create my-app --template minimal --types ts',
    versions: { svelte: '5.57.3', '@sveltejs/kit': '3.1.0', vite: '8.3.5', typescript: '6.0.3' },
    defaultStyling: 'css-variables',
    supportedStyling: ['css-variables', 'tailwind'],
    routeFile: (p) => (segs(p) ? `src/routes/(site)/${segs(p)}/+page.svelte` : 'src/routes/(site)/+page.svelte'),
    layoutFile: (slug) => `src/routes/(site)/+layout.svelte   // layout: ${slug}`,
    componentFile: (name) => `src/lib/components/${name}.svelte`,
    interactivity:
      'Use Svelte 5 runes only ($state, $derived, $props, $effect, snippets with {@render}). No legacy `export let`, stores for local state, or `on:` directives.',
    conventions: [
      'Set <svelte:head> title and meta description per page from the spec.',
      'TypeScript is pinned to 6.x because @sveltejs/kit 3.1 and svelte-check 4.7 peer on ^6 (TS 7 is published but not yet supported).'
    ],
    verifyCommands: ['pnpm check', 'pnpm build']
  },
  'sveltekit-rust': {
    id: 'sveltekit-rust',
    label: 'SvelteKit 3 + Rust (Axum, sqlx, PostgreSQL)',
    tagline: 'Svelte 5 runes frontend; typed Rust API service with Postgres',
    scaffold:
      'Monorepo: `apps/web` via `pnpm dlx sv create web --template minimal --types ts` (SvelteKit 3, config in vite.config.ts, `#lib` subpath imports) and `services/api` via `cargo new api` (Axum + Tokio + sqlx with the postgres, runtime-tokio and macros features).',
    versions: {
      svelte: '5.57.3',
      '@sveltejs/kit': '3.1.0',
      vite: '8.3.5',
      typescript: '6.0.3',
      rust: '1.99.1',
      axum: '0.8.9',
      tokio: '1.54.1',
      sqlx: '0.9.0',
      'tower-http': '0.7.1',
      serde: '1.0.229'
    },
    defaultStyling: 'css-variables',
    supportedStyling: ['css-variables', 'tailwind'],
    routeFile: (p) => (segs(p) ? `apps/web/src/routes/(site)/${segs(p)}/+page.svelte` : 'apps/web/src/routes/(site)/+page.svelte'),
    layoutFile: (slug) => `apps/web/src/routes/(site)/+layout.svelte   // layout: ${slug}`,
    componentFile: (name) => `apps/web/src/lib/components/${name}.svelte`,
    interactivity:
      'UI state lives in Svelte 5 runes ($state, $derived, $props, snippets with {@render}); no legacy `export let`, stores for local state, or `on:` directives. Anything that persists or needs a server (form submissions, auth, data tables, settings) goes through typed JSON endpoints on the Axum service — never fake persistence in the browser.',
    conventions: [
      'Set <svelte:head> title and meta description per page from the spec.',
      'Every `*_cents` money value is i64 in Rust, BIGINT in Postgres and number in TS — never i32.',
      'Database changes are forward-only, idempotent sqlx migrations (`CREATE INDEX IF NOT EXISTS`).',
      'Conditional updates are a single atomic `UPDATE … WHERE … RETURNING` (no select-then-update races).',
      'Password hashing (argon2) runs in `tokio::task::spawn_blocking`; every outbound HTTP client sets both `.timeout()` and `.connect_timeout()`.',
      'Where the spec says a form or flow is a mock, implement the UI exactly and expose a clearly named Axum endpoint stub that returns a typed response; list each stub in the final report.'
    ],
    verifyCommands: [
      'pnpm --dir apps/web check',
      'pnpm --dir apps/web build',
      'cargo fmt --check --manifest-path services/api/Cargo.toml',
      'cargo clippy --manifest-path services/api/Cargo.toml --all-targets -- -D warnings',
      'cargo test --manifest-path services/api/Cargo.toml'
    ]
  },
  nuxt: {
    id: 'nuxt',
    label: 'Nuxt + Vue 3',
    tagline: 'File-based routing in app/pages, auto-imported components',
    scaffold: 'pnpm create nuxt@latest my-app',
    versions: { nuxt: '4.6.3', vue: '3.5.44', typescript: '7.0.2', tailwindcss: '4.3.3' },
    defaultStyling: 'css-variables',
    supportedStyling: ['css-variables', 'tailwind'],
    routeFile: (p) => (segs(p) ? `app/pages/${segs(p)}.vue` : 'app/pages/index.vue'),
    layoutFile: (slug) => `app/layouts/${slug}.vue`,
    componentFile: (name) => `app/components/${name}.vue`,
    interactivity: 'Use <script setup lang="ts"> with ref/computed. Interactive widgets are regular SFCs; no Options API.',
    conventions: ['Use useSeoMeta() per page with the spec SEO values.', 'Use <NuxtLink> for internal links.'],
    verifyCommands: ['pnpm nuxi typecheck', 'pnpm build']
  },
  astro: {
    id: 'astro',
    label: 'Astro (static-first, islands)',
    tagline: 'Zero-JS by default, interactive islands only where needed',
    scaffold: 'pnpm create astro@latest my-app -- --template minimal --typescript strict',
    versions: { astro: '7.4.3', typescript: '7.0.2' },
    defaultStyling: 'css-variables',
    supportedStyling: ['css-variables', 'tailwind'],
    routeFile: (p) => (segs(p) ? `src/pages/${segs(p)}.astro` : 'src/pages/index.astro'),
    layoutFile: (slug) => `src/layouts/${slug}.astro`,
    componentFile: (name) => `src/components/${name}.astro`,
    interactivity:
      'Static sections are .astro components with no client JS. Stateful widgets (accordion, tabs, forms, modals) are small islands hydrated with client:visible (or client:idle for above-the-fold).',
    conventions: ['Pass title/description into the layout <head> per page.'],
    verifyCommands: ['pnpm astro check', 'pnpm build']
  },
  'react-router': {
    id: 'react-router',
    label: 'React Router (framework mode) + React',
    tagline: 'Formerly Remix; routes declared in app/routes.ts',
    scaffold: 'pnpm create react-router@latest my-app',
    versions: { 'react-router': '8.5.1', '@react-router/dev': '8.5.1', react: '19.3.1', typescript: '7.0.2', tailwindcss: '4.3.3' },
    defaultStyling: 'tailwind',
    supportedStyling: ['tailwind', 'css-modules', 'css-variables'],
    routeFile: (p) => (segs(p) ? `app/routes/${segs(p).replace(/\//g, '.')}.tsx` : 'app/routes/home.tsx'),
    layoutFile: (slug) => `app/routes/_${slug}.tsx   // layout route`,
    componentFile: (name) => `app/components/${name}.tsx`,
    interactivity: 'Use React state in components; use route `meta` exports for SEO and <Link> for navigation. Forms use <Form> + actions.',
    conventions: ['Register every route in app/routes.ts.'],
    verifyCommands: ['pnpm typecheck', 'pnpm build']
  },
  html: {
    id: 'html',
    label: 'Plain HTML + CSS (+ tiny vanilla JS)',
    tagline: 'No framework; one HTML file per route',
    scaffold: 'No scaffold needed. Create the files below; optionally serve with `npx serve .`.',
    versions: {},
    defaultStyling: 'css-variables',
    supportedStyling: ['css-variables'],
    routeFile: (p) => (segs(p) ? `${segs(p)}/index.html` : 'index.html'),
    layoutFile: () => 'partials are duplicated into each page (header/footer)',
    componentFile: (name) => `css/components/${name}.css`,
    interactivity: 'Use semantic HTML first (<details> for accordions, <dialog> for modals). Add a single deferred js/main.js for tabs, nav toggle and form validation.',
    conventions: ['All styles in css/tokens.css + css/main.css. No inline styles.'],
    verifyCommands: ['npx html-validate "**/*.html"']
  },
  custom: {
    id: 'custom',
    label: 'Custom stack (describe it)',
    tagline: 'You describe the stack; the spec stays the same',
    scaffold: 'Follow the stack description provided by the user below.',
    versions: {},
    defaultStyling: 'css-variables',
    supportedStyling: ['tailwind', 'css-variables', 'css-modules'],
    routeFile: (p) => `<route file for "${p || '/'}" per the chosen stack>`,
    layoutFile: (slug) => `<layout file for "${slug}" per the chosen stack>`,
    componentFile: (name) => `<component file for ${name} per the chosen stack>`,
    interactivity: 'Use the idiomatic client-state mechanism of the chosen stack; keep static sections free of client JS where the stack allows it.',
    conventions: [],
    verifyCommands: ['<the stack\'s typecheck command>', '<the stack\'s production build command>']
  }
};

export const STYLING_GUIDANCE: Record<StylingId, string> = {
  tailwind:
    'Tailwind CSS v4. Map every design token from spec/design-tokens.json into the CSS-first `@theme` block (e.g. --color-primary, --radius-md) and use those utilities. Do not use arbitrary hex values in class names.',
  'css-variables':
    'Plain CSS with custom properties. Import spec/tokens.css as the single source of colors, radii, shadows, spacing and fonts. Components reference only var(--…) tokens — never raw hex values.',
  'css-modules':
    'CSS Modules per component. Global tokens come from spec/tokens.css; module files reference only var(--…) tokens.'
};
