<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: number;
    gap?: 'sm' | 'md' | 'lg' | string;
    alignItems?: 'stretch' | 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | string;
    justifyItems?: 'stretch' | 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | string;
    textAlign?: 'left' | 'center' | 'right' | string;
    style?: string;
    children?: Snippet;
  }

  let {
    columns = 3,
    gap = 'md',
    alignItems = 'stretch',
    justifyItems = 'stretch',
    textAlign = '',
    style = '',
    children
  }: Props = $props();

  const gapMap: Record<string, string> = {
    sm: '1rem',
    md: '1.5rem',
    lg: '2.5rem'
  };
</script>

<div
  class="md-grid md-grid-cols-{columns}"
  style="gap: {gapMap[gap] || gap || '1.5rem'}; align-items: {alignItems}; justify-items: {justifyItems}; {textAlign ? `text-align: ${textAlign};` : ''} {style}"
>
  {@render children?.()}
</div>
