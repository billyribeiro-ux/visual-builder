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
</script>

<div class="md-container md-container--{maxWidth} {customClass}" {style}>
  {@render children?.()}
</div>
