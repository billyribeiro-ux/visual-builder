<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface PricingPlan {
    name: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    ctaText?: string;
    ctaHref?: string;
    isPopular?: boolean;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    /** Badge text on the highlighted plan. */
    popularLabel?: string;
    plans?: PricingPlan[];
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Transparent pricing',
    sectionDescription = '',
    popularLabel = 'Most popular',
    plans = [],
    class: className = '',
    ...rest
  }: Props = $props();

  /** One column per plan on desktop (1–4). */
  const planCols = $derived(Math.min(4, Math.max(1, plans.length)));

  /** `per month` / `forever` render verbatim; bare units (`mo`, `month`) render as `/ mo`. */
  function formatPeriod(period: string | undefined): string {
    const p = (period ?? '').trim();
    if (!p) return '';
    if (/^(\/|per\b|forever\b|one[- ]?time\b|once\b|billed\b)/i.test(p)) return p;
    return `/ ${p}`;
  }
</script>

<section {...rest} class={['pricing', className]}>
  <div class="md-container md-container--xl">
    <div class="md-section-header">
      {#if sectionEyebrow}
        <p class="md-eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
      {/if}
      <h2 class="md-section-title" data-prop="sectionTitle">{sectionTitle}</h2>
      {#if sectionDescription}
        <p class="md-section-description" data-prop="sectionDescription">{sectionDescription}</p>
      {/if}
    </div>

    <div class="plans" style:--plan-cols={planCols}>
      {#each plans as plan, index (index)}
        {@const period = formatPeriod(plan.period)}
        <article class={['plan', plan.isPopular && 'plan--popular']}>
          <div class="plan-head">
            <h3 class="plan-name" data-prop={`plans.${index}.name`}>{plan.name}</h3>
            {#if plan.isPopular && popularLabel}
              <span class="md-badge md-badge--primary" data-prop="popularLabel">{popularLabel}</span>
            {/if}
          </div>
          {#if plan.description}
            <p class="plan-description" data-prop={`plans.${index}.description`}>{plan.description}</p>
          {/if}
          <p class="price">
            <span class="amount" data-prop={`plans.${index}.price`}>{plan.price}</span>
            {#if period}
              <span class="period">{period}</span>
            {/if}
          </p>
          <a
            href={safeHref(plan.ctaHref || '/dashboard')}
            class={['md-btn', 'md-btn--md', 'md-btn--block', plan.isPopular ? 'md-btn--filled' : 'md-btn--outlined']}
            data-prop={`plans.${index}.ctaText`}
          >
            {plan.ctaText || 'Select plan'}
          </a>
          {#if plan.features.length > 0}
            <ul class="feature-list">
              {#each plan.features as feature, featureIndex (featureIndex)}
                <li class="feature">
                  <span class="check" aria-hidden="true"><Icon name="Check" size={12} /></span>
                  <span data-prop={`plans.${index}.features.${featureIndex}`}>{feature}</span>
                </li>
              {/each}
            </ul>
          {/if}
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .pricing {
    padding: var(--md-sys-section-space, 6rem) 0;
    background-color: var(--md-sys-color-surface);
  }
  .plans {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
    max-width: 32rem;
    margin: 0 auto;
  }
  @media (min-width: 1024px) {
    .plans {
      grid-template-columns: repeat(var(--plan-cols, 3), minmax(0, 1fr));
      max-width: none;
      align-items: stretch;
    }
  }
  .plan {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: clamp(1.5rem, 1.1rem + 1.2vw, 2rem);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1);
  }
  .plan--popular {
    border-color: var(--md-sys-color-primary);
    box-shadow:
      0 0 0 1px var(--md-sys-color-primary),
      0 0 0 6px color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent),
      var(--md-sys-elevation-level4);
  }
  .plan-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem 0.75rem;
    min-height: 1.75rem;
  }
  .plan-name {
    font-size: 1.0625rem;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    color: var(--md-sys-color-on-surface);
  }
  .plan--popular .plan-name {
    color: var(--md-sys-color-primary);
  }
  .plan-description {
    margin-top: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.55;
    color: var(--md-sys-color-on-surface-variant);
  }
  @media (min-width: 1024px) {
    /* Two-line slot keeps prices and CTAs aligned across cards. */
    .plan-description {
      min-height: 3.1em;
    }
  }
  .price {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.375rem;
    margin: 1.75rem 0 1.5rem;
  }
  .amount {
    font-family: var(--md-sys-font-heading);
    font-size: 3rem;
    line-height: 1;
    font-weight: 700;
    letter-spacing: var(--md-sys-tracking-tighter, -0.035em);
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface);
  }
  .period {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
  .feature-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    margin-top: 1.75rem;
    padding-top: 1.75rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    font-size: 0.9375rem;
    line-height: 1.45;
    color: var(--md-sys-color-on-surface);
  }
  .feature {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }
  .check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.0625rem;
    border-radius: 9999px;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-primary);
  }
</style>
