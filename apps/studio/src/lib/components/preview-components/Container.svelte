<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let {
    maxWidth = 'xl',
    class: customClass = '',
    style = '',
    children
  }: Props = $props();

  const maxMap = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full'
  };
</script>

<div class="mx-auto px-4 sm:px-6 lg:px-8 {maxMap[maxWidth] || 'max-w-screen-xl'} {customClass}" {style}>
  {@render children?.()}
</div>
