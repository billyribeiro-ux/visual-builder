<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'surface' | 'surface-low' | 'surface-high' | 'primary-container';
    paddingY?: 'sm' | 'md' | 'lg' | 'xl';
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    style?: string;
    children?: Snippet;
  }

  let {
    variant = 'surface',
    paddingY = 'lg',
    maxWidth = 'xl',
    style = '',
    children
  }: Props = $props();

  const bgMap: Record<string, string> = {
    surface: 'var(--md-sys-color-surface)',
    'surface-low': 'var(--md-sys-color-surface-container-low)',
    'surface-high': 'var(--md-sys-color-surface-container-high)',
    'primary-container': 'var(--md-sys-color-primary-container)'
  };

  const padMap: Record<string, string> = {
    sm: '2rem 0',
    md: '3.5rem 0',
    lg: '5rem 0',
    xl: '7rem 0'
  };
</script>

<section
  class="md-section"
  style="background-color: {bgMap[variant] || bgMap.surface}; padding: {padMap[paddingY] || padMap.lg}; {style}"
>
  <div class="md-container md-container-{maxWidth}">
    {@render children?.()}
  </div>
</section>
