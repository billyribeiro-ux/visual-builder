<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Plan {
    name?: string;
    price?: string;
    period?: string;
    highlight?: boolean;
    ctaText?: string;
    ctaHref?: string;
  }

  interface Row {
    feature?: string;
    group?: string;
    values?: Array<boolean | string>;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    featureLabel?: string;
    highlightLabel?: string;
    plans?: Plan[];
    rows?: Row[];
    /** Distance (px) the sticky header keeps from the top of the viewport, e.g. a sticky site header's height. */
    stickyOffset?: number;
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Compare plans',
    sectionDescription = '',
    featureLabel = 'Features',
    highlightLabel = 'Most popular',
    plans = [],
    rows = [],
    stickyOffset = 0,
    class: className = '',
    ...rest
  }: Props = $props();

  const fallbackId = $props.id();
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `cmp-${nodeId}` : fallbackId;
  });

  const columns = $derived(
    (Array.isArray(plans) ? plans : []).map((plan) => ({
      name: String(plan?.name ?? ''),
      price: String(plan?.price ?? ''),
      period: String(plan?.period ?? ''),
      highlight: plan?.highlight === true,
      ctaText: String(plan?.ctaText ?? ''),
      ctaHref: String(plan?.ctaHref ?? '')
    }))
  );

  /** Consecutive rows with the same `group` share one group heading row. */
  const groups = $derived.by(() => {
    const out: Array<{ name: string; rows: Array<{ index: number; feature: string; values: Array<boolean | string> }> }> = [];
    (Array.isArray(rows) ? rows : []).forEach((row, index) => {
      const name = String(row?.group ?? '').trim();
      const entry = { index, feature: String(row?.feature ?? ''), values: Array.isArray(row?.values) ? row.values : [] };
      const last = out[out.length - 1];
      if (last && last.name === name) last.rows.push(entry);
      else out.push({ name, rows: [entry] });
    });
    return out;
  });

  const offset = $derived(Number.isFinite(Number(stickyOffset)) ? Math.min(400, Math.max(0, Number(stickyOffset))) : 0);
</script>

<section {...rest} class={['comparison', className]} style:--sticky-offset="{offset}px">
  <div class="md-container md-container--xl">
    <div class="header">
      {#if sectionEyebrow}
        <p class="md-eyebrow eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
      {/if}
      <h2 class="heading" id="{uid}-title" data-prop="sectionTitle">{sectionTitle}</h2>
      {#if sectionDescription}
        <p class="description" data-prop="sectionDescription">{sectionDescription}</p>
      {/if}
    </div>

    <!-- Scrollable on small screens: focusable + labelled so keyboard users can scroll it (WCAG 2.1.1). -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="scroller" role="region" aria-labelledby="{uid}-title" tabindex="0">
      <table class="table" style:--plan-count={columns.length}>
        <caption class="sr-only">{sectionTitle}</caption>
        <colgroup>
          <col class="col-feature" />
          {#each columns as _plan, index (index)}
            <col />
          {/each}
        </colgroup>
        <thead>
          <tr>
            <th scope="col" class="corner">
              <span class="corner-label" data-prop="featureLabel">{featureLabel}</span>
            </th>
            {#each columns as plan, index (index)}
              <th scope="col" class={['plan', plan.highlight && 'plan--highlight']}>
                <div class="plan-inner">
                  {#if plan.highlight && highlightLabel}
                    <span class="plan-badge" data-prop="highlightLabel">{highlightLabel}</span>
                  {/if}
                  <span class="plan-name" data-prop={`plans.${index}.name`}>{plan.name}</span>
                  <span class="plan-price">
                    <span data-prop={`plans.${index}.price`}>{plan.price}</span>
                    {#if plan.period}
                      <span class="plan-period" data-prop={`plans.${index}.period`}>{plan.period}</span>
                    {/if}
                  </span>
                  {#if plan.ctaText}
                    <a
                      href={safeHref(plan.ctaHref)}
                      class={['md-btn', 'md-btn--sm', 'md-btn--block', 'plan-cta', plan.highlight ? 'md-btn--filled' : 'plan-cta--outline']}
                      data-prop={`plans.${index}.ctaText`}
                    >
                      {plan.ctaText}
                    </a>
                  {/if}
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        {#each groups as group, groupIndex (groupIndex)}
          <tbody>
            {#if group.name}
              <tr class="group-row">
                <th scope="colgroup" colspan={columns.length + 1} class="group">
                  <span class="group-label" data-prop={`rows.${group.rows[0].index}.group`}>{group.name}</span>
                </th>
              </tr>
            {/if}
            {#each group.rows as row (row.index)}
              <tr class="row">
                <th scope="row" class="feature" data-prop={`rows.${row.index}.feature`}>{row.feature}</th>
                {#each columns as plan, planIndex (planIndex)}
                  {@const value = row.values[planIndex]}
                  <td class={['cell', plan.highlight && 'cell--highlight']}>
                    {#if value === true}
                      <span class="yes"><Icon name="Check" size={16} label="Included" /></span>
                    {:else if typeof value !== 'string' || value.trim() === ''}
                      <span class="no"><Icon name="Minus" size={16} label="Not included" /></span>
                    {:else}
                      <span class="text" data-prop={`rows.${row.index}.values.${planIndex}`}>{value}</span>
                    {/if}
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        {/each}
      </table>
    </div>
  </div>
</section>

<style>
  .comparison {
    padding: 6rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .header {
    max-width: 44rem;
    margin: 0 auto 3rem;
    text-align: center;
  }
  .eyebrow {
    margin-bottom: 0.75rem;
  }
  .heading {
    font-size: clamp(1.875rem, 1.3rem + 1.9vw, 2.75rem);
    line-height: 1.12;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  .description {
    margin-top: 1rem;
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  /* ---------------------------------------------------------------- table */
  .scroller {
    position: relative;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .scroller:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    font-size: 0.9375rem;
  }
  .col-feature {
    width: 32%;
  }

  thead th {
    background-color: var(--md-sys-color-surface-container-lowest);
    border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    vertical-align: bottom;
  }
  thead th:first-child {
    border-top-left-radius: 20px;
  }
  thead th:last-child {
    border-top-right-radius: 20px;
  }
  .corner {
    padding: 1.5rem;
    text-align: left;
  }
  .corner-label {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
  }
  .plan {
    padding: 1.5rem 1.25rem 1.25rem;
    text-align: left;
    font-weight: 400;
  }
  .plan--highlight {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 5%, var(--md-sys-color-surface-container-lowest));
    box-shadow: inset 0 2px 0 var(--md-sys-color-primary);
  }
  .plan-inner {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.375rem;
  }
  .plan-badge {
    margin-bottom: 0.25rem;
    padding: 0.0625rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.125rem;
    text-transform: uppercase;
  }
  .plan-name {
    font-size: 1rem;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .plan-price {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.375rem;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1.2;
  }
  .plan-period {
    font-size: 0.8125rem;
    font-weight: 500;
    letter-spacing: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
  .plan-cta {
    margin-top: 0.75rem;
    font-weight: 600;
  }
  .plan-cta--outline {
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 95%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
  }
  .plan-cta--outline:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }

  .group {
    padding: 1.75rem 1.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
  }
  .group-label {
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: -0.005em;
    color: var(--md-sys-color-on-surface);
  }
  .feature,
  .cell {
    padding: 0.9375rem 1.25rem;
    border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent);
    vertical-align: middle;
  }
  .feature {
    padding-left: 1.5rem;
    text-align: left;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .cell {
    text-align: left;
    color: var(--md-sys-color-on-surface-variant);
  }
  .cell--highlight {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 4%, transparent);
  }
  tbody:last-child .row:last-child .feature,
  tbody:last-child .row:last-child .cell {
    border-bottom: none;
  }
  tbody:last-child .row:last-child .feature {
    border-bottom-left-radius: 20px;
  }
  tbody:last-child .row:last-child .cell:last-child {
    border-bottom-right-radius: 20px;
  }
  .row:hover .feature,
  .row:hover .cell {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 3%, var(--md-sys-color-surface-container-lowest));
  }
  .yes,
  .no {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
  }
  .yes {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    color: var(--md-sys-color-primary);
  }
  .no {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 60%, transparent);
  }
  .text {
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }

  /* Desktop: the plan header sticks while the page scrolls past the table. */
  @media (min-width: 1024px) {
    thead th {
      position: sticky;
      top: var(--sticky-offset, 0px);
      z-index: 2;
    }
  }

  /* Mobile + tablet: horizontal scroll inside the card, feature column pinned. */
  @media (max-width: 1023px) {
    .scroller {
      overflow-x: auto;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
    }
    .table {
      min-width: calc(11rem + var(--plan-count, 3) * 9.5rem);
      table-layout: auto;
    }
    .col-feature {
      width: 11rem;
    }
    .corner,
    .feature {
      position: sticky;
      left: 0;
      z-index: 1;
    }
    .group-label {
      position: sticky;
      left: 1rem;
    }
    .corner,
    .feature {
      box-shadow: 1px 0 0 color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    }
    .corner {
      padding: 1rem;
    }
    .feature {
      padding-left: 1rem;
      min-width: 11rem;
    }
    .group {
      padding-left: 1rem;
    }
    .plan {
      min-width: 9.5rem;
      padding: 1rem;
    }
    .plan-price {
      font-size: 1.375rem;
    }
    .cell {
      padding: 0.875rem 1rem;
    }
  }
  @media (max-width: 767px) {
    .comparison {
      padding: 4rem 0;
    }
    .header {
      margin-bottom: 2rem;
    }
    .scroller {
      border-radius: 16px;
    }
  }
</style>
