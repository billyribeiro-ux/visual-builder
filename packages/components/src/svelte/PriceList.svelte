<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeSrc } from './lib/href.js';

  interface PriceItem {
    name: string;
    description?: string;
    price?: string;
    badge?: string;
    imageSrc?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    items?: PriceItem[];
    leader?: boolean;
    columns?: number;
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'center',
    items = [],
    leader = true,
    columns = 2,
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(items) ? items : []).filter((item) => item && typeof item === 'object'));
  const twoColumns = $derived(Math.round(Number(columns) || 2) >= 2);
  const centered = $derived(align === 'center');
</script>

<section {...rest} class={['price-list', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
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
      <ul class={['items', twoColumns ? 'items--2' : 'items--1', centered && 'items--center', !leader && 'items--ruled']}>
        {#each list as item, i (i)}
          {@const thumb = safeSrc(item.imageSrc)}
          <li class={['item', thumb && 'item--thumb']}>
            {#if thumb}
              <img class="thumb" src={thumb} alt="" width="64" height="64" loading="lazy" />
            {/if}
            <div class="main">
              <div class="line">
                <h3 class="name">
                  <span data-prop={`items.${i}.name`}>{item.name}</span>
                  {#if item.badge}
                    <span class="badge" data-prop={`items.${i}.badge`}>{item.badge}</span>
                  {/if}
                </h3>
                <span class={['fill', leader && 'fill--leader']} aria-hidden="true"></span>
                {#if item.price}
                  <p class="price" data-prop={`items.${i}.price`}>{item.price}</p>
                {/if}
              </div>
              {#if item.description}
                <p class="description" data-prop={`items.${i}.description`}>{item.description}</p>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>

<style>
  .price-list {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    padding: clamp(4rem, 3rem + 4vw, 6.5rem) 0;
  }

  /* Section header ------------------------------------------------------- */
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    max-width: 44rem;
    margin-bottom: clamp(2.5rem, 2rem + 2vw, 3.75rem);
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

  /* List ------------------------------------------------------------------- */
  .items {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
    list-style: none;
  }
  .items--1 {
    max-width: 48rem;
  }
  .items--1.items--center {
    margin-left: auto;
    margin-right: auto;
  }
  @media (min-width: 768px) {
    .items--2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(2.5rem, 1rem + 4vw, 5rem);
    }
  }
  .item {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    column-gap: 1rem;
    align-items: start;
    padding: 1.25rem 0;
  }
  .items--ruled .item {
    border-bottom: 1px solid var(--sc-border);
  }
  .item--thumb {
    grid-template-columns: 64px minmax(0, 1fr);
  }
  .thumb {
    width: 64px;
    height: 64px;
    border-radius: 0.75rem;
    object-fit: cover;
    background-color: var(--md-sys-color-surface-container);
  }
  .main {
    min-width: 0;
  }
  .line {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }
  .name {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 0.625rem;
    min-width: 0;
    font-size: 1.0625rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    line-height: 1.4;
  }
  .fill {
    flex: 1 1 1.5rem;
    min-width: 1.5rem;
  }
  .fill--leader {
    /* An empty flex item's synthesized baseline is its bottom edge: the dots sit on the text baseline. */
    height: 0;
    border-bottom: 2px dotted color-mix(in srgb, var(--md-sys-color-outline) 45%, transparent);
  }
  .price {
    flex-shrink: 0;
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .description {
    margin-top: 0.375rem;
    max-width: 34rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
</style>
