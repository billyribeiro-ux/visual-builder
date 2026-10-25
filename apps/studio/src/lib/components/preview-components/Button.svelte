<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated' | 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    class?: string;
    style?: string;
    onclick?: (e: MouseEvent) => void;
    onNavigate?: (path: string) => void;
    children?: Snippet;
  }

  let {
    variant = 'filled',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    class: customClass = '',
    style = '',
    onclick,
    onNavigate,
    children
  }: Props = $props();

  const variantClass = $derived.by(() => {
    if (variant === 'primary' || variant === 'filled') return 'md-btn--filled';
    if (variant === 'secondary' || variant === 'tonal') return 'md-btn--tonal';
    if (variant === 'outline' || variant === 'outlined') return 'md-btn--outlined';
    if (variant === 'ghost' || variant === 'text') return 'md-btn--text';
    return 'md-btn--filled';
  });

  function handleClick(e: MouseEvent) {
    if (href && onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    } else if (onclick) {
      onclick(e);
    }
  }
</script>

{#if href}
  <a
    {href}
    onclick={handleClick}
    class="md-btn md-btn--{size} {variantClass} {customClass}"
    {style}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    {type}
    {disabled}
    onclick={handleClick}
    class="md-btn md-btn--{size} {variantClass} {customClass}"
    {style}
  >
    {@render children?.()}
  </button>
{/if}
