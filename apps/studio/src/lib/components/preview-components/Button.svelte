<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
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
    variant = 'primary',
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

  const variantStyles = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm',
    secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]',
    outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)]',
    ghost: 'bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)]'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
    md: 'px-4 py-2 text-sm font-medium rounded-[var(--radius-md)]',
    lg: 'px-6 py-3 text-base font-medium rounded-[var(--radius-lg)]'
  };

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
    class="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 {variantStyles[variant]} {sizeStyles[size]} {customClass}"
    {style}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    {type}
    {disabled}
    onclick={handleClick}
    class="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 {variantStyles[variant]} {sizeStyles[size]} {customClass}"
    {style}
  >
    {@render children?.()}
  </button>
{/if}
