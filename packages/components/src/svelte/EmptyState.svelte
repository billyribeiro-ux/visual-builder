<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    icon?: string;
    title?: string;
    description?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    variant?: 'plain' | 'dashed-border';
    class?: string;
  }

  let {
    icon = 'Tray',
    title = 'Nothing here yet',
    description = '',
    primaryCtaText = '',
    primaryCtaHref = '',
    secondaryCtaText = '',
    secondaryCtaHref = '',
    variant = 'dashed-border',
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<section {...rest} class={['empty', variant === 'plain' ? 'empty--plain' : 'empty--dashed', className]}>
  <div class="visual" aria-hidden="true">
    <span class="ring ring--outer"></span>
    <span class="ring ring--inner"></span>
    <span class="icon-tile"><Icon name={icon || 'Tray'} size={24} /></span>
  </div>
  <h3 class="title" data-prop="title">{title}</h3>
  {#if description}
    <p class="description" data-prop="description">{description}</p>
  {/if}
  {#if primaryCtaText || secondaryCtaText}
    <div class="actions">
      {#if primaryCtaText}
        <a class="md-btn md-btn--filled btn" href={safeHref(primaryCtaHref)}>
          <span data-prop="primaryCtaText">{primaryCtaText}</span>
        </a>
      {/if}
      {#if secondaryCtaText}
        <a class="md-btn md-btn--outlined btn btn--secondary" href={safeHref(secondaryCtaHref)}>
          <span data-prop="secondaryCtaText">{secondaryCtaText}</span>
        </a>
      {/if}
    </div>
  {/if}
</section>

<style>
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 3.5rem 1.5rem;
    color: var(--md-sys-color-on-surface);
  }
  .empty--dashed {
    border: 1.5px dashed var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-low) 55%, transparent);
  }
  .visual {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5.5rem;
    height: 5.5rem;
    margin-bottom: 1.25rem;
  }
  .ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
  }
  .ring--outer {
    inset: 0;
    opacity: 0.6;
  }
  .ring--inner {
    inset: 0.875rem;
  }
  .icon-tile {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-variant);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05);
  }
  .title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
  }
  .description {
    max-width: 28rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1.75rem;
  }
  .btn {
    min-height: 2.5rem;
  }
  .btn--secondary {
    color: var(--md-sys-color-on-surface);
    border-color: var(--md-sys-color-outline-variant);
  }
  @media (max-width: 767px) {
    .empty {
      padding: 2.5rem 1.25rem;
    }
    .actions {
      flex-direction: column;
      align-self: stretch;
    }
    .btn {
      width: 100%;
    }
  }
</style>
