<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';
  import { safeCssValue } from './lib/css.js';

  interface IconListItem {
    icon?: string;
    text?: string;
    href?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    items?: IconListItem[];
    layout?: 'vertical' | 'inline';
    iconTone?: 'default' | 'muted' | 'primary';
    divider?: boolean;
    gap?: string;
    class?: string;
  }

  let {
    items = [],
    layout = 'vertical',
    iconTone = 'primary',
    divider = false,
    gap = '0.75rem',
    class: className = '',
    ...rest
  }: Props = $props();

  const list = $derived(Array.isArray(items) ? items.filter((item) => item && typeof item === 'object') : []);
  const gapValue = $derived(safeCssValue(gap) ?? '0.75rem');
</script>

<ul
  {...rest}
  class={['icon-list', layout === 'inline' ? 'layout-inline' : 'layout-vertical', `icon-tone-${iconTone}`, divider && 'has-divider', className]}
  style:--list-gap={gapValue}
>
  {#each list as item, index (index)}
    <li class="item">
      <span class="icon"><Icon name={item.icon || 'CheckCircle'} size={20} /></span>
      {#if item.href}
        <a href={safeHref(item.href)} class="text link" data-prop={`items.${index}.text`}>{item.text ?? ''}</a>
      {:else}
        <span class="text" data-prop={`items.${index}.text`}>{item.text ?? ''}</span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .icon-list {
    list-style: none;
    display: flex;
    font-size: 1rem;
    line-height: 1.5;
  }
  .layout-vertical {
    flex-direction: column;
    gap: var(--list-gap, 0.75rem);
  }
  .layout-inline {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    column-gap: calc(var(--list-gap, 0.75rem) * 2);
    row-gap: var(--list-gap, 0.75rem);
  }
  .item {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    min-width: 0;
  }
  .icon {
    display: inline-flex;
    flex-shrink: 0;
    /* Centers the 20px glyph on the first line of 1.5 line-height text. */
    margin-top: 0.125rem;
  }
  .icon-tone-primary .icon {
    color: var(--md-sys-color-primary);
  }
  .icon-tone-muted .icon {
    color: var(--md-sys-color-on-surface-variant);
  }
  .text {
    min-width: 0;
    overflow-wrap: break-word;
  }
  .link {
    color: inherit;
    text-decoration-line: underline;
    text-decoration-color: color-mix(in srgb, currentColor 30%, transparent);
    text-underline-offset: 0.2em;
    transition: text-decoration-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover {
    text-decoration-color: currentColor;
  }
  .has-divider.layout-vertical .item + .item {
    padding-top: var(--list-gap, 0.75rem);
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .has-divider.layout-inline .item + .item {
    position: relative;
  }
  .has-divider.layout-inline .item + .item::before {
    content: '';
    position: absolute;
    left: calc(var(--list-gap, 0.75rem) * -1);
    top: 15%;
    bottom: 15%;
    width: 1px;
    background-color: var(--md-sys-color-outline-variant);
  }
  @media (max-width: 479px) {
    .layout-inline {
      flex-direction: column;
      align-items: flex-start;
    }
    .has-divider.layout-inline .item + .item::before {
      display: none;
    }
  }
</style>
