import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-auto';
import { defineConfig } from 'vite';

// SvelteKit 3 configuration with pure Vanilla CSS (No Tailwind)
export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter()
    })
  ],
  server: {
    port: 5173,
    strictPort: true
  }
});
