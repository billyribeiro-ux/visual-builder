<script lang="ts">
  import type { Snippet } from 'svelte';

  // No global stylesheet here on purpose: the studio route imports `#lib/styles/studio.css`
  // (editor chrome) and the canvas route imports the site runtime CSS, so neither can leak
  // into the other.
  let { children }: { children?: Snippet } = $props();
</script>

{@render children?.()}
