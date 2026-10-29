<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface FaqItem {
    question: string;
    answer?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    ctaText?: string;
    ctaHref?: string;
    items?: FaqItem[];
    allowMultiple?: boolean;
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    ctaText = '',
    ctaHref = '',
    items = [],
    allowMultiple = false,
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(items) ? items : []).filter((item) => item && typeof item === 'object'));
  let openItems = $state<number[]>([0]);

  function toggle(index: number) {
    if (openItems.includes(index)) openItems = openItems.filter((i) => i !== index);
    else openItems = allowMultiple ? [...openItems, index] : [index];
  }
</script>

<section {...rest} class={['faq-split', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
  <div class="md-container md-container--xl">
    <div class="layout">
      <div class="intro">
        {#if eyebrow}
          <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        {#if heading}
          <h2 id="{uid}-heading" class="heading" data-prop="heading">{heading}</h2>
        {/if}
        {#if subheading}
          <p class="subheading" data-prop="subheading">{subheading}</p>
        {/if}
        {#if ctaText}
          <a href={safeHref(ctaHref)} class="cta">
            <Icon name="ChatCircleText" size={18} />
            <span data-prop="ctaText">{ctaText}</span>
          </a>
        {/if}
      </div>

      {#if list.length > 0}
        <div class="accordion">
          {#each list as item, i (i)}
            {@const open = openItems.includes(i)}
            <div class={['item', open && 'item--open']}>
              <h3 class="question">
                <button
                  type="button"
                  id="{uid}-trigger-{i}"
                  class="trigger"
                  aria-expanded={open}
                  aria-controls="{uid}-panel-{i}"
                  onclick={() => toggle(i)}
                >
                  <span class="question-text" data-prop={`items.${i}.question`}>{item.question}</span>
                  <span class="toggle-icon" aria-hidden="true"><Icon name={open ? 'Minus' : 'Plus'} size={16} /></span>
                </button>
              </h3>
              <div id="{uid}-panel-{i}" class="panel" role="region" aria-labelledby="{uid}-trigger-{i}" hidden={!open}>
                <p class="answer" data-prop={`items.${i}.answer`}>{item.answer}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</section>

<style>
  .faq-split {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    padding: clamp(4rem, 3rem + 4vw, 6.5rem) 0;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
    align-items: start;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: clamp(3rem, 1rem + 4vw, 5.5rem);
    }
    .intro {
      position: sticky;
      top: 6rem;
    }
  }

  /* Intro ------------------------------------------------------------------ */
  .intro {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
  }
  .heading {
    font-size: clamp(1.875rem, 1.35rem + 1.9vw, 2.75rem);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.025em;
    color: var(--md-sys-color-on-surface);
    text-wrap: balance;
  }
  .subheading {
    max-width: 30rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 44px;
    margin-top: 0.75rem;
    padding: 0 1.25rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    font-size: 0.9375rem;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    transition:
      background-color 150ms var(--sc-ease),
      border-color 150ms var(--sc-ease);
  }
  .cta:hover {
    border-color: var(--md-sys-color-outline);
    background-color: var(--md-sys-color-surface-container-low);
  }

  /* Accordion -------------------------------------------------------------- */
  .accordion {
    border-top: 1px solid var(--sc-border);
  }
  .item {
    border-bottom: 1px solid var(--sc-border);
  }
  .question {
    font-size: inherit;
    font-weight: inherit;
  }
  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    width: 100%;
    min-height: 44px;
    padding: 1.375rem 0;
    text-align: left;
    color: var(--md-sys-color-on-surface);
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.45;
    letter-spacing: -0.01em;
  }
  .trigger:hover .question-text {
    color: var(--md-sys-color-primary);
  }
  .question-text {
    transition: color 150ms var(--sc-ease);
  }
  .toggle-icon {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--sc-border);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--md-sys-color-on-surface-variant);
    transition:
      background-color 200ms var(--sc-ease),
      color 200ms var(--sc-ease),
      border-color 200ms var(--sc-ease);
  }
  .item--open .toggle-icon {
    border-color: transparent;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .panel {
    padding: 0 3.5rem 1.5rem 0;
    animation: answer-in 250ms var(--sc-ease);
  }
  .panel[hidden] {
    display: none;
  }
  @keyframes answer-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .answer {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  @media (max-width: 767px) {
    .panel {
      padding-right: 0;
    }
  }
</style>
