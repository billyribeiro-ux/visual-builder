<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: number;
    gap?: 'sm' | 'md' | 'lg';
    style?: string;
    children?: Snippet;
  }

  let { columns = 3, gap = 'md', style = '', children }: Props = $props();

  const gapMap: Record<string, string> = {
    sm: '1rem',
    md: '1.5rem',
    lg: '2.5rem'
  };
</script>

<div
  class="md-grid md-grid-cols-{columns}"
  style="gap: {gapMap[gap] || gapMap.md}; {style}"
>
  {@render children?.()}
</div>
