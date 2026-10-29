<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface FeatureRow {
    eyebrow?: string;
    title?: string;
    description?: string;
    bullets?: string[];
    imageUrl?: string;
    imageAlt?: string;
    ctaText?: string;
    ctaHref?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    items?: FeatureRow[];
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'How it works',
    sectionDescription = '',
    items = [],
    class: className = '',
    ...rest
  }: Props = $props();

  /** Decorative motif values for the visual placeholders. */
  const BOARD = [
    [72, 48, 60],
    [56, 80],
    [64, 44, 52]
  ];
  const TIMELINE = [
    [4, 42],
    [22, 36],
    [38, 30],
    [12, 58],
    [52, 40]
  ];
  const METRIC_BARS = [34, 48, 42, 58, 52, 66, 61, 74, 70, 82];

  const rows = $derived(
    (Array.isArray(items) ? items : []).map((item) => ({
      eyebrow: String(item?.eyebrow ?? ''),
      title: String(item?.title ?? ''),
      description: String(item?.description ?? ''),
      bullets: (Array.isArray(item?.bullets) ? item.bullets : []).map((b) => String(b)),
      image: safeSrc(item?.imageUrl),
      imageAlt: String(item?.imageAlt ?? ''),
      ctaText: String(item?.ctaText ?? ''),
      ctaHref: String(item?.ctaHref ?? '')
    }))
  );
</script>

<section {...rest} class={['features', className]}>
  <div class="md-container md-container--xl">
    {#if sectionEyebrow || sectionTitle || sectionDescription}
      <div class="header">
        {#if sectionEyebrow}
          <p class="md-eyebrow eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
        {/if}
        <h2 class="heading" data-prop="sectionTitle">{sectionTitle}</h2>
        {#if sectionDescription}
          <p class="description" data-prop="sectionDescription">{sectionDescription}</p>
        {/if}
      </div>
    {/if}

    <div class="rows">
      {#each rows as row, index (index)}
        <article class={['row', index % 2 === 1 && 'row--reverse']}>
          <div class="copy">
            {#if row.eyebrow}
              <p class="row-eyebrow" data-prop={`items.${index}.eyebrow`}>{row.eyebrow}</p>
            {/if}
            <h3 class="row-title" data-prop={`items.${index}.title`}>{row.title}</h3>
            {#if row.description}
              <p class="row-description" data-prop={`items.${index}.description`}>{row.description}</p>
            {/if}
            {#if row.bullets.length > 0}
              <ul class="bullets">
                {#each row.bullets as bullet, bulletIndex (bulletIndex)}
                  <li class="bullet">
                    <span class="bullet-icon"><Icon name="Check" size={13} /></span>
                    <span data-prop={`items.${index}.bullets.${bulletIndex}`}>{bullet}</span>
                  </li>
                {/each}
              </ul>
            {/if}
            {#if row.ctaText}
              <a href={safeHref(row.ctaHref)} class="row-cta">
                <span data-prop={`items.${index}.ctaText`}>{row.ctaText}</span>
                <Icon name="ArrowRight" size={16} />
              </a>
            {/if}
          </div>

          <div class="visual">
            {#if row.image}
              <img src={row.image} alt={row.imageAlt} width="960" height="720" loading="lazy" class="image" />
            {:else}
              <div class={['motif', `motif--${index % 3}`]} aria-hidden="true">
                <div class="panel">
                  {#if index % 3 === 0}
                    <div class="board">
                      {#each BOARD as column, columnIndex (columnIndex)}
                        <div class="board-column">
                          <span class={['board-head', `tone-${columnIndex}`]}></span>
                          {#each column as width, cardIndex (cardIndex)}
                            <div class={['board-card', columnIndex === 1 && cardIndex === 0 && 'board-card--active']}>
                              <span class="line" style:width="{width}%"></span>
                              <span class="line line--faint" style:width="{width - 18}%"></span>
                              <span class="board-meta"><span class="dot"></span><span class="chip"></span></span>
                            </div>
                          {/each}
                        </div>
                      {/each}
                    </div>
                  {:else if index % 3 === 1}
                    <div class="timeline">
                      <div class="timeline-scale">
                        {#each [0, 1, 2, 3, 4, 5] as tick (tick)}<span></span>{/each}
                      </div>
                      {#each TIMELINE as [start, width], rowIndex (rowIndex)}
                        <div class="timeline-row">
                          <span class="line line--label"></span>
                          <span class="track">
                            <span class={['span', `tone-${rowIndex % 3}`]} style:left="{start}%" style:width="{width}%"></span>
                          </span>
                        </div>
                      {/each}
                      <span class="today" aria-hidden="true"></span>
                    </div>
                  {:else}
                    <div class="metrics">
                      <div class="stat-row">
                        <div class="stat">
                          <span class="line line--xs"></span>
                          <span class="stat-value"></span>
                          <span class="stat-delta"></span>
                        </div>
                        <div class="stat">
                          <span class="line line--xs"></span>
                          <span class="stat-value stat-value--short"></span>
                          <span class="stat-delta stat-delta--muted"></span>
                        </div>
                      </div>
                      <div class="metric-chart">
                        {#each METRIC_BARS as height, barIndex (barIndex)}
                          <span class={['metric-bar', barIndex === METRIC_BARS.length - 1 && 'metric-bar--accent']} style:height="{height}%"></span>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>

<style>
  .features {
    padding: 6rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .header {
    max-width: 44rem;
    margin: 0 auto 5rem;
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

  .rows {
    display: flex;
    flex-direction: column;
    gap: 6rem;
  }
  .row {
    display: grid;
    gap: 2.5rem;
    align-items: center;
  }
  @media (min-width: 1024px) {
    .row {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
      gap: 5rem;
    }
    .row--reverse {
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    }
    .row--reverse .copy {
      order: 2;
    }
  }

  .row-eyebrow {
    margin-bottom: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--md-sys-color-primary);
  }
  .row-title {
    font-size: clamp(1.5rem, 1.15rem + 1.1vw, 2rem);
    line-height: 1.2;
    font-weight: 700;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }
  .row-description {
    margin-top: 1rem;
    font-size: 1.0625rem;
    line-height: 1.7;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .bullets {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.5rem;
    list-style: none;
  }
  .bullet {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.9375rem;
    line-height: 1.5rem;
    font-weight: 500;
  }
  .bullet-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    margin-top: 0.125rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
    color: var(--md-sys-color-primary);
  }
  .row-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    margin-top: 1.75rem;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
  }
  .row-cta :global(.icon) {
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .row-cta:hover :global(.icon) {
    transform: translateX(3px);
  }

  /* ---------------------------------------------------------------- visuals */
  .image {
    width: 100%;
    height: auto;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    box-shadow: 0 24px 56px -28px rgba(0, 0, 0, 0.28);
  }
  .motif {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 4 / 3;
    padding: 9%;
    overflow: hidden;
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    background-color: var(--md-sys-color-surface-container-low);
    background-image:
      radial-gradient(ellipse 70% 60% at 100% 0%, color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent), transparent 70%),
      radial-gradient(ellipse 60% 50% at 0% 100%, color-mix(in srgb, var(--md-sys-color-tertiary) 10%, transparent), transparent 70%);
  }
  .motif--1 {
    background-image:
      radial-gradient(ellipse 70% 60% at 0% 0%, color-mix(in srgb, var(--md-sys-color-secondary) 14%, transparent), transparent 70%),
      radial-gradient(ellipse 60% 50% at 100% 100%, color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent), transparent 70%);
  }
  .panel {
    width: 100%;
    height: 100%;
    padding: 1.25rem;
    border-radius: 14px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 20px 48px -20px rgba(0, 0, 0, 0.22);
  }
  .line {
    display: block;
    height: 7px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 16%, transparent);
  }
  .line--faint {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  }
  .line--xs {
    width: 40%;
  }
  .line--label {
    flex-shrink: 0;
    width: 18%;
  }
  .tone-0 {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent);
  }
  .tone-1 {
    background-color: color-mix(in srgb, var(--md-sys-color-tertiary) 55%, transparent);
  }
  .tone-2 {
    background-color: color-mix(in srgb, var(--md-sys-color-secondary) 55%, transparent);
  }

  /* board */
  .board {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    height: 100%;
  }
  .board-column {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 0.625rem;
    border-radius: 10px;
    background-color: var(--md-sys-color-surface-container-low);
  }
  .board-head {
    display: block;
    width: 45%;
    height: 8px;
    margin: 0.125rem 0 0.25rem;
    border-radius: 4px;
  }
  .board-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.625rem;
    border-radius: 8px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .board-card--active {
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent);
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent),
      0 12px 24px -12px rgba(0, 0, 0, 0.25);
    transform: rotate(-2deg) translateY(-2px);
  }
  .board-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.125rem;
  }
  .dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent),
      color-mix(in srgb, var(--md-sys-color-tertiary) 40%, transparent)
    );
  }
  .chip {
    width: 28px;
    height: 10px;
    border-radius: 999px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  }

  /* timeline */
  .timeline {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    height: 100%;
  }
  .timeline-scale {
    display: flex;
    justify-content: space-between;
    padding-left: 22%;
  }
  .timeline-scale span {
    width: 18px;
    height: 6px;
    border-radius: 3px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent);
  }
  .timeline-row {
    display: flex;
    align-items: center;
    gap: 4%;
  }
  .track {
    position: relative;
    flex: 1;
    height: 22px;
    border-radius: 6px;
    background-image: repeating-linear-gradient(
      to right,
      color-mix(in srgb, var(--md-sys-color-outline-variant) 50%, transparent) 0 1px,
      transparent 1px 20%
    );
  }
  .span {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
  }
  .today {
    position: absolute;
    top: 0.5rem;
    bottom: 0.25rem;
    left: 64%;
    width: 2px;
    border-radius: 1px;
    background-color: var(--md-sys-color-error);
    opacity: 0.7;
  }

  /* metrics */
  .metrics {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;
  }
  .stat-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding: 0.875rem;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
  }
  .stat-value {
    width: 70%;
    height: 18px;
    border-radius: 5px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 24%, transparent);
  }
  .stat-value--short {
    width: 52%;
  }
  .stat-delta {
    width: 36%;
    height: 7px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--md-sys-color-success) 50%, transparent);
  }
  .stat-delta--muted {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  }
  .metric-chart {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 5%;
    min-height: 0;
    padding: 0.75rem;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    background-image: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent) 1px,
      transparent 1px
    );
    background-size: 100% 25%;
    background-origin: content-box;
  }
  .metric-bar {
    flex: 1;
    border-radius: 4px 4px 0 0;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--md-sys-color-primary) 25%, transparent),
      color-mix(in srgb, var(--md-sys-color-primary) 50%, transparent)
    );
  }
  .metric-bar--accent {
    background: linear-gradient(to top, color-mix(in srgb, var(--md-sys-color-primary) 70%, transparent), var(--md-sys-color-primary));
  }

  @media (max-width: 767px) {
    .features {
      padding: 4rem 0;
    }
    .header {
      margin-bottom: 3rem;
    }
    .rows {
      gap: 4rem;
    }
    .motif {
      padding: 6%;
    }
    .panel {
      padding: 0.875rem;
    }
    .board {
      gap: 0.5rem;
    }
    .board-column {
      padding: 0.375rem;
      gap: 0.375rem;
    }
    .board-card {
      padding: 0.5rem;
      gap: 0.375rem;
    }
    .board-column .board-card:nth-child(n + 4) {
      display: none;
    }
  }
</style>
