<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    text?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    /** When set the button renders as a link. */
    href?: string;
    /** Optional trailing icon name (e.g. "ArrowRight"). */
    icon?: string;
    class?: string;
  }

  let { text = 'Button', variant = 'primary', size = 'md', href = '', icon, class: className = '', ...rest }: Props = $props();

  const VARIANT_CLASS: Record<string, string> = {
    primary: 'md-btn--filled',
    secondary: 'md-btn--tonal',
    outline: 'md-btn--outlined',
    ghost: 'md-btn--ghost'
  };
  const classes = $derived(['md-btn', `md-btn--${size}`, VARIANT_CLASS[variant] ?? 'md-btn--filled', className]);
  const iconSize = $derived(size === 'lg' ? 18 : 16);
</script>

{#if href}
  <a {...rest} href={safeHref(href)} class={classes}>
    <span data-prop="text">{text || 'Button'}</span>
    {#if icon}<Icon name={icon} size={iconSize} />{/if}
  </a>
{:else}
  <button {...rest} type="button" class={classes}>
    <span data-prop="text">{text || 'Button'}</span>
    {#if icon}<Icon name={icon} size={iconSize} />{/if}
  </button>
{/if}
