<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  type Trend = 'up' | 'down' | 'flat';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    label?: string;
    value?: string;
    delta?: string;
    trend?: Trend;
    /** When false, an upward trend is bad (e.g. churn, latency) and is coloured as negative. */
    upIsGood?: boolean;
    period?: string;
    sparkline?: number[];
    icon?: string;
    variant?: 'plain' | 'card';
    class?: string;
  }

  let {
    label = 'Metric',
    value = '',
    delta = '',
    trend = 'flat',
    upIsGood = true,
    period = '',
    sparkline = [],
    icon = '',
    variant = 'card',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();

  const safeTrend = $derived<Trend>(trend === 'up' || trend === 'down' ? trend : 'flat');
  /** Sentiment = direction × whether up is good. */
  const sentiment = $derived(safeTrend === 'flat' ? 'neutral' : (safeTrend === 'up') === upIsGood ? 'positive' : 'negative');
  const trendIcon = $derived(safeTrend === 'up' ? 'TrendUp' : safeTrend === 'down' ? 'TrendDown' : 'Minus');
  const trendText = $derived(safeTrend === 'up' ? 'Increased by' : safeTrend === 'down' ? 'Decreased by' : 'Unchanged:');

  /** Sparkline on a 100×32 box (stretched horizontally; strokes stay 2px via non-scaling-stroke). */
  const spark = $derived.by(() => {
    const points = (Array.isArray(sparkline) ? sparkline : []).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const coords = points.map((v, i) => ({
      x: Math.round((i / (points.length - 1)) * 10000) / 100,
      y: Math.round((2 + (1 - (v - min) / span) * 28) * 100) / 100
    }));
    const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join('');
    const last = coords[coords.length - 1];
    return {
      line,
      area: `${line}L100,32L0,32Z`,
      endX: last.x,
      endY: (last.y / 32) * 100,
      first: points[0],
      last: points[points.length - 1],
      count: points.length
    };
  });
</script>

<div {...rest} class={['stat', `stat--${variant === 'plain' ? 'plain' : 'card'}`, `tone-${sentiment}`, className]}>
  <div class="head">
    <p class="label" data-prop="label">{label}</p>
    {#if icon}
      <span class="icon-tile"><Icon name={icon} size={18} /></span>
    {/if}
  </div>

  <p class="value" data-prop="value">{value}</p>

  <div class="foot">
    <div class="meta">
      {#if delta}
        <span class="delta">
          <Icon name={trendIcon} size={14} />
          <span class="sr-only">{trendText}</span>
          <span data-prop="delta">{delta}</span>
        </span>
      {/if}
      {#if period}
        <span class="period" data-prop="period">{period}</span>
      {/if}
    </div>

    {#if spark}
      <div class="spark" role="img" aria-label="Trend over {spark.count} periods, from {spark.first} to {spark.last}">
        <svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true" class="spark-svg">
          <defs>
            <linearGradient id="{uid}-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" class="spark-stop" stop-opacity="0.2" />
              <stop offset="100%" class="spark-stop" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d={spark.area} fill="url(#{uid}-spark)" />
          <path d={spark.line} class="spark-line" vector-effect="non-scaling-stroke" />
        </svg>
        <span class="spark-dot" style:left="{spark.endX}%" style:top="{spark.endY}%" aria-hidden="true"></span>
      </div>
    {/if}
  </div>
</div>

<style>
  .stat {
    --stat-accent: var(--md-sys-color-outline);
    --stat-chip-bg: var(--md-sys-color-surface-container-high);
    --stat-chip-fg: var(--md-sys-color-on-surface-variant);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    color: var(--md-sys-color-on-surface);
  }
  .stat--card {
    padding: 1.25rem;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .tone-positive {
    --stat-accent: var(--md-sys-color-success);
    --stat-chip-bg: var(--md-sys-color-success-container);
    --stat-chip-fg: var(--md-sys-color-on-success-container);
  }
  .tone-negative {
    --stat-accent: var(--md-sys-color-error);
    --stat-chip-bg: var(--md-sys-color-error-container);
    --stat-chip-fg: var(--md-sys-color-on-error-container);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 2rem;
  }
  .label {
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    color: var(--md-sys-color-on-surface-variant);
  }
  .icon-tile {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
  }
  .value {
    font-family: var(--md-sys-font-heading);
    font-size: 1.875rem;
    font-weight: 650;
    line-height: 1.15;
    letter-spacing: -0.02em;
    overflow-wrap: anywhere;
  }
  .foot {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 0.25rem;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.5rem;
    min-width: 0;
  }
  .delta {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.125rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--stat-chip-bg);
    color: var(--stat-chip-fg);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.25rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .period {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .spark {
    position: relative;
    flex: 0 0 auto;
    width: 6.5rem;
    height: 2rem;
  }
  .spark-svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .spark-stop {
    stop-color: var(--stat-accent);
  }
  .spark-line {
    fill: none;
    stroke: var(--stat-accent);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .spark-dot {
    position: absolute;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background-color: var(--stat-accent);
    box-shadow: 0 0 0 2px var(--md-sys-color-surface-container-lowest);
    transform: translate(-50%, -50%);
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
</style>
