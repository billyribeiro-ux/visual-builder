<script lang="ts">
  import { iconPathsFor, iconViewBox } from '../lib/icon-set.js';

  interface Props {
    /** Icon name from the site icon set (aliases resolve). */
    name: string | null | undefined;
    size?: number;
  }

  let { name, size = 16 }: Props = $props();

  const paths = $derived(iconPathsFor(name));
</script>

{#if paths}
  <svg width={size} height={size} viewBox={iconViewBox} fill="currentColor" aria-hidden="true" focusable="false">
    {#each paths as d (d)}<path {d} />{/each}
  </svg>
{/if}
