<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface TimelineEvent {
    date?: string;
    title: string;
    description?: string;
    tag?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    events?: TimelineEvent[];
    layout?: 'alternating' | 'left';
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'center',
    events = [],
    layout = 'alternating',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(events) ? events : []).filter((e) => e && typeof e === 'object'));
  const centered = $derived(align === 'center');
</script>

<section {...rest} class={['timeline-section', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
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

    {#if list.length > 0}
      <ol class={['timeline', layout === 'alternating' && 'timeline--alt', centered && 'timeline--center']}>
        {#each list as event, i (i)}
          <li class={['event', i % 2 === 1 && 'event--flip']}>
            <span class="dot" aria-hidden="true"></span>
            {#if event.date}
              <p class="date" data-prop={`events.${i}.date`}>{event.date}</p>
            {/if}
            <div class="card">
              {#if event.tag}
                <span class="tag" data-prop={`events.${i}.tag`}>{event.tag}</span>
              {/if}
              <h3 class="title" data-prop={`events.${i}.title`}>{event.title}</h3>
              {#if event.description}
                <p class="description" data-prop={`events.${i}.description`}>{event.description}</p>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</section>

<style>
  .timeline-section {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-line: var(--md-sys-color-outline-variant);
    --sc-dot: 13px;
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

  /* Left layout (base, and alternating below 1024px) --------------------- */
  .timeline {
    position: relative;
    display: grid;
    gap: 2rem;
    max-width: 46rem;
    list-style: none;
  }
  .timeline--center {
    margin-left: auto;
    margin-right: auto;
  }
  .timeline::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(var(--sc-dot) / 2 - 0.5px);
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--sc-line) 2rem, var(--sc-line) calc(100% - 2rem), transparent);
  }
  .event {
    position: relative;
    display: grid;
    gap: 0.625rem;
    padding-left: 2.5rem;
  }
  .dot {
    position: absolute;
    top: 0.25rem;
    left: 0;
    width: var(--sc-dot);
    height: var(--sc-dot);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
  }

  @media (min-width: 768px) {
    .card {
      padding: 1.375rem 1.5rem 1.5rem;
    }
  }

  /* Alternating ------------------------------------------------------------ */
  @media (min-width: 1024px) {
    .timeline--alt {
      max-width: 66rem;
      margin-left: auto;
      margin-right: auto;
      gap: 2rem;
    }
    .timeline--alt::before {
      left: calc(50% - 0.5px);
    }
    .timeline--alt .event {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      column-gap: 4.5rem;
      align-items: start;
      padding-left: 0;
    }
    .timeline--alt .dot {
      top: 1.375rem;
      left: calc(50% - var(--sc-dot) / 2);
    }
    .timeline--alt .date {
      grid-row: 1;
      grid-column: 1;
      padding-top: 1.125rem;
      text-align: right;
    }
    .timeline--alt .card {
      grid-row: 1;
      grid-column: 2;
    }
    .timeline--alt .event--flip .date {
      grid-column: 2;
      text-align: left;
    }
    .timeline--alt .event--flip .card {
      grid-column: 1;
    }
  }

  /* Content ---------------------------------------------------------------- */
  .date {
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--md-sys-color-primary);
    font-variant-numeric: tabular-nums;
  }
  .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 1.125rem 1.25rem 1.25rem;
    border: 1px solid var(--sc-border);
    border-radius: 0.875rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 16px rgba(0, 0, 0, 0.04);
  }
  .tag {
    display: inline-flex;
    align-items: center;
    margin-bottom: 0.75rem;
    padding: 0.1875rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.01em;
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
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
</style>
