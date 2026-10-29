<script lang="ts" module>
  const BARS = [28, 36, 33, 45, 41, 52, 49, 61, 58, 70, 76, 88];
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface Stat {
    value: string;
    label?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    stats?: Stat[];
    ctaText?: string;
    ctaHref?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    stats = [],
    ctaText = '',
    ctaHref = '',
    imageUrl = '',
    imagePosition = 'right',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const list = $derived((Array.isArray(stats) ? stats : []).filter((s) => s && typeof s === 'object'));
  const src = $derived(safeSrc(imageUrl));
</script>

<section {...rest} class={['stats-split', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
  <div class="md-container md-container--xl">
    <div class={['layout', imagePosition === 'left' && 'layout--media-left']}>
      <div class="copy">
        {#if eyebrow}
          <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        {#if heading}
          <h2 id="{uid}-heading" class="heading" data-prop="heading">{heading}</h2>
        {/if}
        {#if subheading}
          <p class="subheading" data-prop="subheading">{subheading}</p>
        {/if}

        {#if list.length > 0}
          <dl class="stats">
            {#each list as stat, i (i)}
              <div class="stat">
                <dt class="label" data-prop={`stats.${i}.label`}>{stat.label}</dt>
                <dd class="value" data-prop={`stats.${i}.value`}>{stat.value}</dd>
              </div>
            {/each}
          </dl>
        {/if}

        {#if ctaText}
          <a href={safeHref(ctaHref)} class="cta">
            <span data-prop="ctaText">{ctaText}</span>
            <Icon name="ArrowRight" size={16} />
          </a>
        {/if}
      </div>

      <div class="visual">
        {#if src}
          <img src={src} alt="" width="1200" height="1200" loading="lazy" />
        {:else}
          <div class="placeholder" aria-hidden="true">
            <div class="chart-card">
              <div class="chart-head">
                <span class="ln ln--title"></span>
                <span class="chip"><Icon name="TrendUp" size={12} /><span class="ln ln--chip"></span></span>
              </div>
              <span class="big-number"></span>
              <div class="bars">
                {#each BARS as h, n (n)}
                  <span class={['bar', n >= BARS.length - 3 && 'bar--accent']} style:height="{h}%"></span>
                {/each}
              </div>
              <div class="axis">
                {#each [0, 1, 2, 3, 4, 5] as n (n)}
                  <span></span>
                {/each}
              </div>
            </div>
            <div class="kpi-card">
              <span class="kpi-icon"><Icon name="Lightning" size={16} /></span>
              <span class="kpi-text"><span class="ln ln--strong"></span><span class="ln ln--xs"></span></span>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .stats-split {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-tint: color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent);
    padding: clamp(4rem, 3rem + 4vw, 6.5rem) 0;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 3rem;
    align-items: center;
  }
  @media (min-width: 1024px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: clamp(3rem, 1rem + 4vw, 5.5rem);
    }
    .layout--media-left .visual {
      order: -1;
    }
  }

  /* Copy ------------------------------------------------------------------- */
  .copy {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.875rem;
    min-width: 0;
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
    max-width: 34rem;
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 2rem;
    width: 100%;
    margin-top: 1.75rem;
  }
  .stat {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
    gap: 0.375rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--sc-border);
  }
  .value {
    font-size: clamp(2rem, 1.5rem + 1.6vw, 2.75rem);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.035em;
    color: var(--md-sys-color-on-surface);
    font-variant-numeric: tabular-nums;
  }
  .label {
    font-size: 0.9375rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 40px;
    margin-top: 1.25rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
  }
  .cta :global(svg) {
    transition: transform 150ms ease;
  }
  .cta:hover :global(svg) {
    transform: translateX(3px);
  }

  /* Visual ----------------------------------------------------------------- */
  .visual {
    position: relative;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border-radius: 1.5rem;
    background-color: var(--md-sys-color-surface-container-low);
  }
  @media (min-width: 1024px) {
    .visual {
      aspect-ratio: 1 / 1;
    }
  }
  .visual img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .placeholder {
    position: absolute;
    inset: 0;
    border: 1px solid var(--sc-border);
    border-radius: inherit;
    background:
      radial-gradient(100% 80% at 100% 0%, var(--sc-tint), transparent 60%),
      radial-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px) 0 0 / 18px 18px;
  }
  .chart-card {
    position: absolute;
    top: 14%;
    left: 10%;
    right: 10%;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    padding: 1.25rem 1.25rem 1rem;
    border: 1px solid var(--sc-border);
    border-radius: 1rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.05),
      0 24px 60px rgba(0, 0, 0, 0.12);
  }
  .chart-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ln {
    display: block;
    height: 7px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-high);
  }
  .ln--title {
    width: 34%;
    height: 9px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .ln--chip {
    width: 22px;
    height: 6px;
    background-color: currentColor;
    opacity: 0.5;
  }
  .ln--strong {
    width: 72px;
    height: 9px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .ln--xs {
    width: 48px;
    height: 6px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    background-color: var(--md-sys-color-success-container, var(--md-sys-color-tertiary-container));
    color: var(--md-sys-color-on-success-container, var(--md-sys-color-on-tertiary-container));
  }
  .big-number {
    width: 36%;
    height: 14px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-on-surface);
    opacity: 0.72;
  }
  .bars {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    height: clamp(56px, 16vw, 170px);
    padding-top: 0.5rem;
  }
  .bar {
    flex: 1;
    border-radius: 5px 5px 2px 2px;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
  }
  .bar--accent {
    background-color: var(--md-sys-color-primary);
  }
  .axis {
    display: flex;
    justify-content: space-between;
    padding-top: 0.25rem;
    border-top: 1px solid var(--sc-border);
  }
  .axis span {
    width: 18px;
    height: 5px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-high);
  }
  .kpi-card {
    position: absolute;
    bottom: 10%;
    left: 6%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.125rem 0.875rem 0.875rem;
    border: 1px solid var(--sc-border);
    border-radius: 0.875rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.06),
      0 16px 40px rgba(0, 0, 0, 0.12);
  }
  @media (max-width: 639px) {
    .chart-card {
      top: 10%;
      left: 8%;
      right: 8%;
    }
    .kpi-card {
      display: none;
    }
  }
  .kpi-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 0.625rem;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .kpi-text {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
</style>
