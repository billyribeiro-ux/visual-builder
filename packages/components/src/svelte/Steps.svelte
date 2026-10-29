<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Step {
    title: string;
    description?: string;
    icon?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    steps?: Step[];
    layout?: 'horizontal' | 'vertical';
    numbering?: 'numbers' | 'icons';
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'center',
    steps = [],
    layout = 'horizontal',
    numbering = 'numbers',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(steps) ? steps : []).filter((s) => s && typeof s === 'object'));
  const count = $derived(list.length);
  const horizontal = $derived(layout !== 'vertical');
  const icons = $derived(numbering === 'icons');
  const centered = $derived(align === 'center');
</script>

<section {...rest} class={['steps-section', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
  <div class="md-container md-container--xl">
    {#if eyebrow || heading || subheading}
      <header class={['head', centered && 'head--center']}>
        {#if eyebrow}
          <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        {#if heading}
          <h2 id="{uid}-heading" class="heading" data-prop="heading">{heading}</h2>
        {/if}
        {#if subheading}
          <p class="subheading" data-prop="subheading">{subheading}</p>
        {/if}
      </header>
    {/if}

    {#if count > 0}
      <ol
        class={[
          'steps',
          horizontal ? 'steps--horizontal' : 'steps--vertical',
          horizontal && count > 3 && 'steps--many',
          centered && 'steps--center',
          icons && 'steps--icons'
        ]}
        style:--count={count}
      >
        {#each list as step, i (i)}
          <li class="step">
            <span class="marker" aria-hidden="true">
              {#if icons}
                <Icon name={step.icon || 'Sparkle'} size={22} />
              {:else}
                {i + 1}
              {/if}
            </span>
            <div class="body">
              {#if icons}
                <p class="kicker" aria-hidden="true">Step {String(i + 1).padStart(2, '0')}</p>
              {/if}
              <h3 class="title" data-prop={`steps.${i}.title`}>{step.title}</h3>
              {#if step.description}
                <p class="description" data-prop={`steps.${i}.description`}>{step.description}</p>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</section>

<style>
  .steps-section {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-line: var(--md-sys-color-outline-variant);
    --sc-marker: 48px;
    --sc-col-gap: 2rem;
    padding: clamp(4rem, 3rem + 4vw, 6.5rem) 0;
  }

  /* Section header ------------------------------------------------------- */
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    max-width: 44rem;
    margin-bottom: clamp(2.5rem, 2rem + 2vw, 4rem);
  }
  .head--center {
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
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
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  /* Vertical (base, and horizontal on small screens) --------------------- */
  .steps {
    display: grid;
    list-style: none;
    max-width: 40rem;
  }
  .steps--center {
    margin-left: auto;
    margin-right: auto;
  }
  .step {
    position: relative;
    display: grid;
    grid-template-columns: var(--sc-marker) minmax(0, 1fr);
    align-content: start;
    column-gap: 1.25rem;
    padding-bottom: 2.25rem;
  }
  .step:last-child {
    padding-bottom: 0;
  }
  .step:not(:last-child)::before {
    content: '';
    position: absolute;
    top: calc(var(--sc-marker) + 0.5rem);
    bottom: 0.5rem;
    left: calc(var(--sc-marker) / 2 - 0.5px);
    width: 1px;
    background-color: var(--sc-line);
  }
  .body {
    padding-top: 0.625rem;
    min-width: 0;
  }
  .steps--icons .body {
    padding-top: 0;
  }

  /* Horizontal ------------------------------------------------------------ */
  @media (min-width: 768px) {
    .steps--horizontal:not(.steps--many) {
      max-width: none;
      grid-template-columns: repeat(var(--count), minmax(0, 1fr));
      column-gap: var(--sc-col-gap);
    }
    .steps--horizontal:not(.steps--many) .step {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 1.5rem;
      padding-bottom: 0;
    }
    .steps--horizontal:not(.steps--many) .step:not(:last-child)::before {
      top: calc(var(--sc-marker) / 2);
      bottom: auto;
      left: calc(var(--sc-marker) + 1rem);
      right: calc(1rem - var(--sc-col-gap));
      width: auto;
      height: 1px;
    }
    .steps--horizontal.steps--center:not(.steps--many) .step {
      justify-items: center;
      text-align: center;
    }
    .steps--horizontal.steps--center:not(.steps--many) .step:not(:last-child)::before {
      left: calc(50% + var(--sc-marker) / 2 + 1rem);
      right: calc(-50% - var(--sc-col-gap) + var(--sc-marker) / 2 + 1rem);
    }
    .steps--horizontal:not(.steps--many) .body {
      padding-top: 0;
    }
  }
  @media (min-width: 1024px) {
    .steps--horizontal.steps--many {
      max-width: none;
      grid-template-columns: repeat(var(--count), minmax(0, 1fr));
      column-gap: var(--sc-col-gap);
    }
    .steps--horizontal.steps--many .step {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 1.5rem;
      padding-bottom: 0;
    }
    .steps--horizontal.steps--many .step:not(:last-child)::before {
      top: calc(var(--sc-marker) / 2);
      bottom: auto;
      left: calc(var(--sc-marker) + 1rem);
      right: calc(1rem - var(--sc-col-gap));
      width: auto;
      height: 1px;
    }
    .steps--horizontal.steps--center.steps--many .step {
      justify-items: center;
      text-align: center;
    }
    .steps--horizontal.steps--center.steps--many .step:not(:last-child)::before {
      left: calc(50% + var(--sc-marker) / 2 + 1rem);
      right: calc(-50% - var(--sc-col-gap) + var(--sc-marker) / 2 + 1rem);
    }
    .steps--horizontal.steps--many .body {
      padding-top: 0;
    }
  }

  /* Markers --------------------------------------------------------------- */
  .marker {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--sc-marker);
    height: var(--sc-marker);
    border: 1px solid var(--sc-border);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-primary);
    font-size: 1.0625rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 7%, transparent);
  }
  .steps--icons .marker {
    border-color: transparent;
    border-radius: 0.875rem;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    box-shadow: none;
  }

  /* Text ------------------------------------------------------------------ */
  .kicker {
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--md-sys-color-primary);
  }
  .title {
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface);
  }
  .description {
    margin-top: 0.5rem;
    max-width: 26rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
</style>
