<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { tick } from 'svelte';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Crumb {
    label: string;
    href?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Trail from the root to the current page; the last item is the current page. */
    items?: Crumb[];
    separator?: 'chevron' | 'slash' | 'dot';
    showHomeIcon?: boolean;
    class?: string;
  }

  let { items = [], separator = 'chevron', showHomeIcon = true, class: className = '', ...rest }: Props = $props();

  const uid = $props.id();
  let expanded = $state(false);

  /** Middle items (all but the first and the last two) collapse on small screens. */
  const collapsible = $derived(items.length > 3);
  const hiddenCount = $derived(collapsible ? items.length - 3 : 0);

  function isCollapsed(index: number): boolean {
    return collapsible && !expanded && index > 0 && index < items.length - 2;
  }

  async function expand() {
    expanded = true;
    await tick();
    document.getElementById(`${uid}-crumb-1`)?.focus();
  }
</script>

<nav {...rest} class={['breadcrumbs', `breadcrumbs--${separator}`, className]} aria-label="Breadcrumb">
  <ol class="list">
    {#each items as item, index (index)}
      {@const isCurrent = index === items.length - 1}
      {#if index === 1 && collapsible && !expanded}
        <li class="crumb crumb--more">
          {@render divider()}
          <button
            type="button"
            class="more"
            aria-expanded={expanded}
            aria-label="Show full path ({hiddenCount} more {hiddenCount === 1 ? 'level' : 'levels'})"
            onclick={expand}
          >
            <Icon name="DotsThree" size={18} />
          </button>
        </li>
      {/if}
      <li class={['crumb', isCollapsed(index) && 'crumb--collapsed', isCurrent && 'crumb--current']}>
        {#if index > 0}
          {@render divider()}
        {/if}
        {#if isCurrent}
          <span class="current" aria-current="page">
            {#if index === 0 && showHomeIcon}<Icon name="House" size={16} />{/if}
            <span class="text" data-prop={`items.${index}.label`}>{item.label}</span>
          </span>
        {:else}
          <a class="link" id="{uid}-crumb-{index}" href={safeHref(item.href)}>
            {#if index === 0 && showHomeIcon}<Icon name="House" size={16} />{/if}
            <span class="text" data-prop={`items.${index}.label`}>{item.label}</span>
          </a>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

{#snippet divider()}
  <span class="separator" aria-hidden="true">
    {#if separator === 'chevron'}
      <Icon name="CaretRight" size={14} />
    {:else if separator === 'slash'}
      /
    {:else}
      <span class="dot"></span>
    {/if}
  </span>
{/snippet}

<style>
  .breadcrumbs {
    display: block;
    min-width: 0;
    font-size: 0.875rem;
    line-height: 1.4;
    color: var(--md-sys-color-on-surface-variant);
  }
  .list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    row-gap: 0.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .crumb {
    display: inline-flex;
    align-items: center;
    min-width: 0;
  }
  .crumb--more {
    display: none;
  }

  .separator {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    padding: 0 0.25rem;
    color: var(--md-sys-color-outline);
    user-select: none;
  }
  .breadcrumbs--slash .separator {
    min-width: 1.25rem;
    font-size: 1rem;
    font-weight: 300;
    color: var(--md-sys-color-outline-variant);
  }
  .dot {
    width: 3px;
    height: 3px;
    border-radius: 9999px;
    background-color: currentColor;
  }

  .link,
  .current {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
  }
  .link {
    padding: 0.125rem 0.25rem;
    margin: 0 -0.25rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover {
    color: var(--md-sys-color-on-surface);
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 5%, transparent);
  }
  .link:focus-visible,
  .more:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 1px;
  }
  .current {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .text {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .more {
    display: inline-flex;
    width: 2rem;
    height: 1.75rem;
    align-items: center;
    justify-content: center;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
  }
  .more:hover {
    color: var(--md-sys-color-on-surface);
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent);
  }

  @media (max-width: 767px) {
    .crumb--more {
      display: inline-flex;
    }
    .crumb--collapsed {
      display: none;
    }
    .link {
      min-height: 2.5rem;
    }
    .more {
      width: 2.5rem;
      height: 2.5rem;
    }
    /* The current page truncates in place while at least ~7rem is left, then wraps. */
    .crumb--current {
      flex: 1 1 7rem;
      max-width: 100%;
    }
    .crumb--current .current {
      min-width: 0;
      max-width: 100%;
    }
    .crumb--current .text {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow-wrap: normal;
    }
  }
</style>
