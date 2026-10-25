import type { ProjectBlueprint } from '@app-viz/schema';

export function generatePackageJson(blueprint: ProjectBlueprint): string {
  const pkg = {
    name: blueprint.meta.slug || 'svelte-app',
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
    dependencies: {
      '@tailwindcss/vite': '^4.3.0',
      'bits-ui': '^2.20.0',
      'clsx': '^2.1.1',
      'lucide-svelte': '^1.0.1',
      'tailwind-merge': '^3.0.2',
      'tailwindcss': '^4.3.0'
    },
    devDependencies: {
      '@sveltejs/adapter-auto': '^8.0.0',
      '@sveltejs/kit': '^3.1.0',
      '@sveltejs/vite-plugin-svelte': '^7.3.1',
      '@types/node': '^24.10.0',
      'svelte': '^5.57.2',
      'svelte-check': '^4.7.0',
      'typescript': '^5.8.0',
      'vite': '^8.3.0'
    },
    engines: {
      node: '>=22.17.0'
    }
  };

  return JSON.stringify(pkg, null, 2);
}

export function generateViteConfig(): string {
  return `import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-auto';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

// SvelteKit 3 configuration is declared directly in vite.config.ts via the sveltekit() plugin.
export default defineConfig({
  plugins: [
    tailwindcss(),
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
    <title>${blueprint.meta.name}</title>
    <meta name="description" content="${blueprint.meta.description || 'Built with Svelte Visual Studio'}" />
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`;
}
