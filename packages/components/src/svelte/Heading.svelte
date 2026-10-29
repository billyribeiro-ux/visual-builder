<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeHref } from './lib/href.js';

  type Level = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  type Size = 'display' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    text?: string;
    eyebrow?: string;
    level?: Level;
    size?: Size;
    align?: 'left' | 'center' | 'right';
    tone?: 'default' | 'muted' | 'primary';
    href?: string;
    class?: string;
  }

  let {
    text = 'Build something people love',
    eyebrow = '',
    level = 'h2',
    size = 'xl',
    align = 'left',
    tone = 'default',
    href = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const LEVELS: readonly Level[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const SIZES: readonly Size[] = ['display', 'xl', 'lg', 'md', 'sm', 'xs'];

  const tag = $derived(LEVELS.includes(level) ? level : 'h2');
  const scale = $derived(SIZES.includes(size) ? size : 'xl');
</script>

<div {...rest} class={['heading', `size-${scale}`, `tone-${tone}`, `align-${align}`, className]}>
  {#if eyebrow}
    <p class="eyebrow" data-prop="eyebrow">{eyebrow}</p>
  {/if}
  <svelte:element this={tag} class="title">
    {#if href}
      <a href={safeHref(href)} class="link" data-prop="text">{text}</a>
    {:else}
      <span data-prop="text">{text}</span>
    {/if}
  </svelte:element>
</div>

<style>
  .heading {
    font-family: var(--md-sys-font-heading);
    font-weight: 700;
    text-wrap: balance;
    overflow-wrap: break-word;
  }
  .title {
    font: inherit;
    letter-spacing: inherit;
    color: inherit;
  }
  .size-display {
    font-size: clamp(2.5rem, 1.75rem + 3.2vw, 4.5rem);
    line-height: 1.04;
    letter-spacing: -0.035em;
  }
  .size-xl {
    font-size: clamp(2rem, 1.6rem + 1.7vw, 3rem);
    line-height: 1.1;
    letter-spacing: -0.03em;
  }
  .size-lg {
    font-size: clamp(1.625rem, 1.4rem + 0.95vw, 2.25rem);
    line-height: 1.15;
    letter-spacing: -0.024em;
  }
  .size-md {
    font-size: clamp(1.375rem, 1.27rem + 0.45vw, 1.75rem);
    line-height: 1.25;
    letter-spacing: -0.018em;
    font-weight: 650;
  }
  .size-sm {
    font-size: 1.25rem;
    line-height: 1.35;
    letter-spacing: -0.012em;
    font-weight: 600;
  }
  .size-xs {
    font-size: 1.0625rem;
    line-height: 1.45;
    letter-spacing: -0.006em;
    font-weight: 600;
  }
  .tone-muted {
    color: var(--md-sys-color-on-surface-variant);
  }
  .tone-primary {
    color: var(--md-sys-color-primary);
  }
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
  .eyebrow {
    margin-bottom: 0.75rem;
    font-family: var(--md-sys-font-body);
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--md-sys-color-primary);
  }
  .link {
    color: inherit;
    text-decoration-line: underline;
    text-decoration-color: transparent;
    text-decoration-thickness: 0.06em;
    text-underline-offset: 0.16em;
    transition: text-decoration-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover {
    text-decoration-color: currentColor;
  }
  .link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 4px;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
  }
</style>
