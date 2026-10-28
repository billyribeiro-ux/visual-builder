import type { ProjectBlueprint } from '@app-viz/schema';

/** npm package names: lowercase, url-safe, max 214 chars. */
function toPackageName(slug: unknown): string {
  const name = String(slug ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+/, '')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .slice(0, 214);
  return name || 'svelte-app';
}

/** HTML-escapes text for app.html (also neutralizes SvelteKit `%placeholder%` tokens). */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/%/g, '&#37;');
}

export function generatePackageJson(blueprint: ProjectBlueprint): string {
  const pkg = {
    name: toPackageName(blueprint.meta.slug),
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite dev --port 4173',
      build: 'vite build',
      preview: 'vite preview --port 4173',
      check: 'svelte-check --tsconfig ./tsconfig.json'
    },
    imports: {
      '#lib/*': './src/lib/*'
    },
    // The generated app ships zero runtime dependencies: every component is
    // plain Svelte 5 + vanilla MD3 CSS. Toolchain pinned 2026-10-28.
    dependencies: {},
    devDependencies: {
      '@sveltejs/adapter-auto': '^8.0.0',
      '@sveltejs/kit': '^3.1.0',
      '@sveltejs/vite-plugin-svelte': '^7.3.1',
      '@types/node': '^26.6.6',
      'svelte': '^5.57.3',
      'svelte-check': '^4.7.7',
      // TypeScript 7.0.2 exists, but SvelteKit 3.1 peers on typescript ^6.
      'typescript': '^6.0.3',
      'vite': '^8.3.5'
    },
    engines: {
      // Node 26 is the current LTS line.
      node: '>=26.13.0'
    }
  };

  return JSON.stringify(pkg, null, 2);
}

export function generateViteConfig(): string {
  return `import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-auto';
import { defineConfig } from 'vite';

// SvelteKit 3 configuration with pure Vanilla CSS (Google MD3 Design System)
export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter()
    })
  ],
  server: {
    port: 4173,
    strictPort: true
  }
});
`;
}

export function generateTsConfig(): string {
  return `{
  "extends": "$app/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "paths": {
      "#lib/*": ["./src/lib/*"]
    }
  },
  "include": ["src/**/*"]
}
`;
}

export function generateAppHtml(blueprint: ProjectBlueprint): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(blueprint.meta.name)}</title>
    <meta name="description" content="${escapeHtml(blueprint.meta.description || 'Built with Svelte Visual Studio')}" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`;
}
