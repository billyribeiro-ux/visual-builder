<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    icon?: string;
    title?: string;
    description?: string;
    linkText?: string;
    href?: string;
    layout?: 'top' | 'left';
    align?: 'left' | 'center' | 'right';
    variant?: 'plain' | 'card';
    class?: string;
  }

  let {
    icon = 'Lightning',
    title = 'Ship in minutes, not weeks',
    description = '',
    linkText = '',
    href = '',
    layout = 'top',
    align = 'left',
    variant = 'plain',
    class: className = '',
    ...rest
  }: Props = $props();

  const side = $derived(layout === 'left');
</script>

<div
  {...rest}
  class={['icon-box', side ? 'layout-left' : 'layout-top', !side && `align-${align}`, variant === 'card' && 'is-card', className]}
>
  <span class="tile"><Icon name={icon || 'Lightning'} size={24} /></span>
  <div class="body">
    {#if title}
      <h3 class="title" data-prop="title">{title}</h3>
    {/if}
    {#if description}
      <p class="description" data-prop="description">{description}</p>
    {/if}
    {#if linkText}
      <a href={safeHref(href)} class="link">
        <span data-prop="linkText">{linkText}</span>
        <Icon name="ArrowRight" size={16} class="arrow" />
      </a>
    {/if}
  </div>
</div>

<style>
  .icon-box {
    display: flex;
    gap: 1.25rem;
  }
  .layout-top {
    flex-direction: column;
  }
  .layout-left {
    flex-direction: row;
    align-items: flex-start;
  }
  .align-left {
    align-items: flex-start;
    text-align: left;
  }
  .align-center {
    align-items: center;
    text-align: center;
  }
  .align-right {
    align-items: flex-end;
    text-align: right;
  }
  .is-card {
    padding: 1.75rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .is-card:hover {
    border-color: color-mix(in srgb, var(--md-sys-color-outline) 60%, var(--md-sys-color-outline-variant));
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 8px 24px -12px rgba(0, 0, 0, 0.16);
  }
  .tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    color: var(--md-sys-color-primary);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
  .layout-left .body {
    flex: 1 1 auto;
    padding-top: 0.125rem;
  }
  .align-center .body {
    align-items: center;
  }
  .align-right .body {
    align-items: flex-end;
  }
  .title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }
  .description {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    max-width: 60ch;
  }
  .link {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    margin-top: -0.25rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
  }
  .link :global(.arrow) {
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover :global(.arrow) {
    transform: translateX(3px);
  }
  .link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
  }
</style>
