<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    variant?: 'elevated' | 'filled' | 'outlined';
    /** Optional icon name shown in a tile above the text. */
    icon?: string;
    eyebrow?: string;
    title?: string;
    body?: string;
    ctaText?: string;
    ctaHref?: string;
    align?: 'left' | 'center' | 'right';
    class?: string;
  }

  let {
    variant = 'elevated',
    icon,
    eyebrow = '',
    title = 'Card title',
    body = '',
    ctaText = '',
    ctaHref = '',
    align = 'left',
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<div {...rest} class={['md-card', `md-card--${variant}`, 'card', `align-${align}`, className]}>
  {#if icon}
    <span class="md-icon-tile tile"><Icon name={icon} size={20} /></span>
  {/if}
  {#if eyebrow}
    <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
  {/if}
  {#if title}
    <h3 class="title" data-prop="title">{title}</h3>
  {/if}
  {#if body}
    <p class="body" data-prop="body">{body}</p>
  {/if}
  {#if ctaText}
    <a href={safeHref(ctaHref)} class="cta">
      <span data-prop="ctaText">{ctaText}</span>
      <Icon name="ArrowRight" size={16} class="cta-icon" />
    </a>
  {/if}
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .align-center {
    align-items: center;
    text-align: center;
  }
  .align-right {
    align-items: flex-end;
    text-align: right;
  }
  .tile {
    margin-bottom: 1.25rem;
  }
  .eyebrow {
    margin-bottom: 0.375rem;
    font-size: 0.8125rem;
  }
  .title {
    font-size: 1.125rem;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    color: var(--md-sys-color-on-surface);
  }
  .body {
    margin-top: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    margin-top: 1rem;
    margin-bottom: -0.5rem;
    font-size: 0.9375rem;
    font-weight: 550;
    color: var(--md-sys-color-primary);
    border-radius: var(--md-sys-shape-corner-small, 6px);
  }
  .cta :global(.cta-icon) {
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .cta:hover :global(.cta-icon) {
    transform: translateX(2px);
  }
  @media (prefers-reduced-motion: reduce) {
    .cta:hover :global(.cta-icon) {
      transform: none;
    }
  }
</style>
