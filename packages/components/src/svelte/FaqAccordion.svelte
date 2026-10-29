<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface FaqItem {
    question: string;
    answer: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    items?: FaqItem[];
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Frequently asked questions',
    sectionDescription = '',
    items = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  let openIndex = $state<number | null>(0);

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }
</script>

<section {...rest} class={['faq', className]}>
  <div class="md-container md-container--xl">
    <div class="layout">
      <div class="header">
        {#if sectionEyebrow}
          <p class="md-eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
        {/if}
        <h2 class="md-section-title title" data-prop="sectionTitle">{sectionTitle}</h2>
        {#if sectionDescription}
          <p class="description" data-prop="sectionDescription">{sectionDescription}</p>
        {/if}
      </div>

      <div class="list">
        {#each items as item, index (index)}
          {@const open = openIndex === index}
          <div class={['item', open && 'item--open']}>
            <h3 class="item-heading">
              <button
                type="button"
                id="{uid}-trigger-{index}"
                class="trigger"
                aria-expanded={open}
                aria-controls="{uid}-panel-{index}"
                onclick={() => toggle(index)}
              >
                <span class="question" data-prop={`items.${index}.question`}>{item.question}</span>
                <span class="chevron" aria-hidden="true"><Icon name="CaretDown" size={16} /></span>
              </button>
            </h3>
            <div id="{uid}-panel-{index}" class="panel" role="region" aria-labelledby="{uid}-trigger-{index}">
              <div class="panel-inner">
                <p class="answer" data-prop={`items.${index}.answer`}>{item.answer}</p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</section>

<style>
  .faq {
    padding: var(--md-sys-section-space, 6rem) 0;
    background-color: var(--md-sys-color-surface);
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
  }
  .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
    max-width: 40rem;
  }
  .description {
    font-size: var(--md-sys-font-size-lead, 1.125rem);
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
      gap: 4rem;
      align-items: start;
    }
    .header {
      position: sticky;
      top: 6rem;
    }
    .description {
      font-size: 1.0625rem;
    }
  }
  .list {
    min-width: 0;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .item {
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .item-heading {
    font: inherit;
    letter-spacing: normal;
  }
  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    width: 100%;
    min-height: 56px;
    padding: 1.25rem 0;
    text-align: left;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    color: var(--md-sys-color-on-surface);
  }
  .question {
    font-family: var(--md-sys-font-heading);
    font-size: 1rem;
    line-height: 1.5;
    font-weight: 600;
    letter-spacing: -0.006em;
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .trigger:hover .question {
    color: var(--md-sys-color-primary);
  }
  .chevron {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-variant);
    transition:
      transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-emphasized, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .item--open .chevron {
    transform: rotate(180deg);
    border-color: transparent;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
  }
  /* Height animates via grid rows; closed panels are visibility-hidden (out of the a11y tree). */
  .panel {
    display: grid;
    grid-template-rows: 0fr;
    visibility: hidden;
    transition:
      grid-template-rows var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-emphasized, ease),
      visibility 0s linear var(--md-sys-motion-duration-medium, 300ms);
  }
  .item--open .panel {
    grid-template-rows: 1fr;
    visibility: visible;
    transition:
      grid-template-rows var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-emphasized, ease),
      visibility 0s linear 0s;
  }
  .panel-inner {
    min-height: 0;
    overflow: hidden;
  }
  .answer {
    padding: 0 3.25rem 1.5rem 0;
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--md-sys-color-on-surface-variant);
  }
  @media (max-width: 639px) {
    .answer {
      padding-right: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .panel,
    .item--open .panel,
    .chevron {
      transition: none;
    }
  }
</style>
