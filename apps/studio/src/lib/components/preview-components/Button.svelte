<script lang="ts">
  import type { Snippet } from 'svelte';
  import { sanitizeHref } from '../../canvas/messages.js';

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

  const safeHref = $derived(href ? sanitizeHref(href) : '');

  function handleClick(e: MouseEvent) {
    if (safeHref && onNavigate && safeHref.startsWith('/') && !safeHref.startsWith('//')) {
      e.preventDefault();
      onNavigate(safeHref);
    } else if (onclick) {
      onclick(e);
    }
  }
</script>

{#if safeHref}
  <a
    href={safeHref}
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
