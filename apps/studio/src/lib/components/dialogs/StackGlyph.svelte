<script lang="ts">
  /**
   * Simple monochrome glyph tiles for export targets. These are neutral geometric marks drawn
   * with `currentColor` — not vendor logos.
   */
  interface Props {
    id: string;
    size?: number;
  }

  let { id, size = 32 }: Props = $props();
</script>

<span class="glyph" style:width="{size}px" style:height="{size}px" aria-hidden="true">
  <svg width={Math.round(size * 0.56)} height={Math.round(size * 0.56)} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
    {#if id === 'nextjs'}
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 16V8l6 8.5" />
      <path d="M15 8v4.5" />
    {:else if id === 'sveltekit'}
      <path d="M15.8 6.6c-1.9-1.6-5-1.3-6.2.6-1.1 1.8 0 3.3 2.1 4.4 2.2 1.1 3.3 2.7 2.2 4.5-1.2 1.9-4.3 2.2-6.2.6" />
    {:else if id === 'sveltekit-rust'}
      <path d="M11 5.6c-1.5-1.2-3.9-1-4.8.5-.9 1.4 0 2.6 1.6 3.4 1.7.9 2.6 2.1 1.7 3.5-.9 1.5-3.3 1.7-4.8.5" />
      <path d="M17 11.2l3.2 1.85v3.7L17 18.6l-3.2-1.85v-3.7Z" />
      <circle cx="17" cy="14.9" r="1.1" />
    {:else if id === 'nuxt'}
      <path d="M2.5 18 9 6.5 15.5 18Z" />
      <path d="M13.4 14.3 16.5 9l5 9h-6" />
    {:else if id === 'astro'}
      <path d="M7.5 18.5 12 4.5l4.5 14" />
      <path d="M9.2 13.5h5.6" />
    {:else if id === 'react-router'}
      <circle cx="5.5" cy="16" r="2.2" />
      <circle cx="12" cy="8" r="2.2" />
      <circle cx="18.5" cy="16" r="2.2" />
      <path d="M7 14.2 10.6 9.8M13.4 9.8 17 14.2" />
    {:else if id === 'html'}
      <path d="M8 7.5 3.5 12 8 16.5M16 7.5l4.5 4.5-4.5 4.5M13.6 5.5l-3.2 13" />
    {:else if id === 'sveltekit-app'}
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 8.5h17M8 13l-2 1.8L8 16.5M16 13l2 1.8-2 1.7" />
    {:else if id === 'json'}
      <path d="M8.5 4.5c-2 0-2.5 1-2.5 2.5v2.5c0 1.2-.8 2.5-2 2.5 1.2 0 2 1.3 2 2.5V17c0 1.5.5 2.5 2.5 2.5M15.5 4.5c2 0 2.5 1 2.5 2.5v2.5c0 1.2.8 2.5 2 2.5-1.2 0-2 1.3-2 2.5V17c0 1.5-.5 2.5-2.5 2.5" />
    {:else}
      <path d="M4 7.5h16M4 16.5h16" />
      <circle cx="9" cy="7.5" r="2.2" fill="var(--glyph-bg, #fff)" />
      <circle cx="15" cy="16.5" r="2.2" fill="var(--glyph-bg, #fff)" />
    {/if}
  </svg>
</span>

<style>
  .glyph {
    --glyph-bg: var(--sx-panel);
    display: inline-grid;
    place-items: center;
    flex-shrink: 0;
    color: var(--sx-text);
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    box-shadow: var(--sx-shadow-sm);
  }
</style>
