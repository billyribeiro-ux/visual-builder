<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface AccordionItem {
    title: string;
    content: string;
  }

  type HeadingLevel = 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    items?: AccordionItem[];
    /** When false, opening a panel closes the others. */
    allowMultiple?: boolean;
    /** 0-based index of the panel open on load; -1 starts with every panel closed. */
    defaultOpen?: number;
    variant?: 'separated' | 'bordered' | 'minimal';
    iconStyle?: 'chevron' | 'plus';
    headingLevel?: HeadingLevel;
    class?: string;
  }

  let {
    items = [],
    allowMultiple = false,
    defaultOpen = 0,
    variant = 'separated',
    iconStyle = 'chevron',
    headingLevel = 'h3',
    class: className = '',
    ...rest
  }: Props = $props();

  const HEADING_LEVELS: readonly HeadingLevel[] = ['h2', 'h3', 'h4', 'h5', 'h6'];

  const uid = $props.id();
  const tag = $derived(HEADING_LEVELS.includes(headingLevel) ? headingLevel : 'h3');

  // Writable derived: user toggles override it until `defaultOpen` / `allowMultiple` change.
  let openIndices = $derived.by<number[]>(() => {
    void allowMultiple;
    return Number.isInteger(defaultOpen) && defaultOpen >= 0 ? [defaultOpen] : [];
  });

  function toggle(index: number) {
    const isOpen = openIndices.includes(index);
    if (allowMultiple) {
      openIndices = isOpen ? openIndices.filter((i) => i !== index) : [...openIndices, index];
    } else {
      openIndices = isOpen ? [] : [index];
    }
  }

  function handleKeydown(event: KeyboardEvent, index: number) {
    const count = items.length;
    if (count === 0) return;
    let next: number;
    if (event.key === 'ArrowDown') next = (index + 1) % count;
    else if (event.key === 'ArrowUp') next = (index - 1 + count) % count;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = count - 1;
    else return;
    event.preventDefault();
    document.getElementById(`${uid}-trigger-${next}`)?.focus();
  }
</script>

<div {...rest} class={['accordion', `accordion--${variant}`, className]}>
  {#each items as item, index (index)}
    {@const open = openIndices.includes(index)}
    <div class={['item', open && 'item--open']}>
      <svelte:element this={tag} class="heading">
        <button
          type="button"
          id="{uid}-trigger-{index}"
          class="trigger"
          aria-expanded={open}
          aria-controls="{uid}-panel-{index}"
          onclick={() => toggle(index)}
          onkeydown={(event) => handleKeydown(event, index)}
        >
          <span class="title" data-prop={`items.${index}.title`}>{item.title}</span>
          <span class={['indicator', `indicator--${iconStyle}`]} aria-hidden="true">
            {#if iconStyle === 'plus'}
              <span class="glyph glyph--plus"><Icon name="Plus" size={16} /></span>
              <span class="glyph glyph--minus"><Icon name="Minus" size={16} /></span>
            {:else}
              <span class="glyph glyph--chevron"><Icon name="CaretDown" size={16} /></span>
            {/if}
          </span>
        </button>
      </svelte:element>
      <div id="{uid}-panel-{index}" class="panel" role="region" aria-labelledby="{uid}-trigger-{index}">
        <div class="panel-clip">
          <p class="content" data-prop={`items.${index}.content`}>{item.content}</p>
        </div>
      </div>
    </div>
  {/each}
</div>

<style>
  .accordion {
    --accordion-duration: 260ms;
    --accordion-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    display: flex;
    flex-direction: column;
    width: 100%;
    color: var(--md-sys-color-on-surface);
  }

  /* ---- Variants -------------------------------------------------------- */
  .accordion--separated {
    gap: 0.75rem;
  }
  .accordion--separated .item {
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition: box-shadow var(--accordion-duration) var(--accordion-ease),
      border-color var(--accordion-duration) var(--accordion-ease);
  }
  .accordion--separated .item--open {
    border-color: color-mix(in srgb, var(--md-sys-color-outline) 45%, var(--md-sys-color-outline-variant));
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px -12px rgba(0, 0, 0, 0.14);
  }

  .accordion--bordered {
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    overflow: hidden;
  }
  .accordion--bordered .item + .item {
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  .accordion--minimal .item {
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .accordion--minimal .item:first-child {
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }

  /* ---- Trigger --------------------------------------------------------- */
  .heading {
    margin: 0;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
  }
  .trigger {
    display: flex;
    width: 100%;
    min-height: 3.5rem;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.125rem 1.25rem;
    border-radius: inherit;
    font-family: var(--md-sys-font-heading, inherit);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: -0.005em;
    text-align: left;
    color: var(--md-sys-color-on-surface);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) var(--accordion-ease);
  }
  .accordion--separated .item .trigger {
    border-radius: calc(var(--md-sys-shape-corner-medium, 12px) - 1px);
  }
  .accordion--separated .item--open .trigger {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
  .accordion--bordered .trigger {
    border-radius: 0;
  }
  .accordion--minimal .trigger {
    padding-left: 0.125rem;
    padding-right: 0.125rem;
    border-radius: 0;
  }
  .trigger:hover {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 3.5%, transparent);
  }
  .accordion--minimal .trigger:hover {
    background-color: transparent;
    color: var(--md-sys-color-primary);
  }
  .trigger:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
  .title {
    flex: 1 1 auto;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  /* ---- Indicator ------------------------------------------------------- */
  .indicator {
    position: relative;
    display: inline-grid;
    flex: 0 0 auto;
    width: 1.75rem;
    height: 1.75rem;
    place-items: center;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container);
    transition: background-color var(--accordion-duration) var(--accordion-ease),
      color var(--accordion-duration) var(--accordion-ease);
  }
  .accordion--minimal .indicator {
    background-color: transparent;
  }
  .item--open .indicator {
    color: var(--md-sys-color-primary);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  }
  .glyph {
    grid-area: 1 / 1;
    display: inline-flex;
    transition: transform var(--accordion-duration) var(--accordion-ease),
      opacity var(--accordion-duration) var(--accordion-ease);
  }
  .item--open .glyph--chevron {
    transform: rotate(180deg);
  }
  .glyph--minus {
    opacity: 0;
    transform: rotate(-90deg);
  }
  .item--open .glyph--plus {
    opacity: 0;
    transform: rotate(90deg);
  }
  .item--open .glyph--minus {
    opacity: 1;
    transform: rotate(0deg);
  }

  /* ---- Panel (animated height via grid rows) --------------------------- */
  .panel {
    display: grid;
    grid-template-rows: 0fr;
    visibility: hidden;
    transition: grid-template-rows var(--accordion-duration) var(--accordion-ease),
      visibility 0s linear var(--accordion-duration);
  }
  .item--open .panel {
    grid-template-rows: 1fr;
    visibility: visible;
    transition: grid-template-rows var(--accordion-duration) var(--accordion-ease), visibility 0s linear 0s;
  }
  .panel-clip {
    min-height: 0;
    overflow: hidden;
  }
  .content {
    padding: 0 1.25rem 1.25rem 1.25rem;
    max-width: 72ch;
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .accordion--minimal .content {
    padding-left: 0.125rem;
    padding-right: 2.5rem;
  }

  @media (max-width: 767px) {
    .trigger {
      padding: 1rem;
      font-size: 0.9375rem;
    }
    .content {
      padding: 0 1rem 1.125rem 1rem;
    }
    .accordion--minimal .trigger {
      padding-left: 0;
      padding-right: 0;
    }
    .accordion--minimal .content {
      padding-left: 0;
      padding-right: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .panel,
    .item--open .panel,
    .glyph,
    .indicator {
      transition: none;
    }
  }
</style>
