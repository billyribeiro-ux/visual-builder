<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface KpiCard {
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down';
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Muted text after each change chip, e.g. "vs. last month". */
    comparisonLabel?: string;
    cards?: KpiCard[];
    class?: string;
  }

  let { comparisonLabel = '', cards = [], class: className = '', ...rest }: Props = $props();

  /** Arrow direction follows the sign of the change ("+3" points up even when it is bad news). */
  function direction(card: KpiCard): 'up' | 'down' {
    const change = (card.change ?? '').trim();
    if (/^[-\u2212]/.test(change)) return 'down';
    if (change.startsWith('+')) return 'up';
    return card.trend === 'down' ? 'down' : 'up';
  }
</script>

<div {...rest} class={['kpis', className]}>
  <div class="grid">
    {#each cards as card, index (index)}
      {@const down = card.trend === 'down'}
      {@const falling = direction(card) === 'down'}
      <div class="card">
        <div class="label" data-prop={`cards.${index}.title`}>{card.title || 'Metric'}</div>
        <div class="value" data-prop={`cards.${index}.value`}>{card.value}</div>
        {#if card.change || comparisonLabel}
          <div class="meta">
            {#if card.change}
              <span class={['chip', down ? 'chip--down' : 'chip--up']}>
                <Icon name={falling ? 'TrendDown' : 'TrendUp'} size={14} label={falling ? 'Decrease' : 'Increase'} />
                <span data-prop={`cards.${index}.change`}>{card.change}</span>
              </span>
            {/if}
            {#if comparisonLabel}
              <span class="comparison" data-prop="comparisonLabel">{comparisonLabel}</span>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  .kpis {
    container-type: inline-size;
    width: 100%;
  }
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
  @container (min-width: 32rem) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @container (min-width: 56rem) {
    .grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1.25rem;
    }
  }
  .card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
    padding: 1.25rem 1.25rem 1.125rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1);
  }
  .label {
    font-size: 0.875rem;
    line-height: 1.4;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .value {
    font-family: var(--md-sys-font-heading);
    font-size: 1.875rem;
    line-height: 1.15;
    font-weight: 700;
    letter-spacing: var(--md-sys-tracking-tight, -0.022em);
    font-variant-numeric: tabular-nums;
    color: var(--md-sys-color-on-surface);
    overflow-wrap: anywhere;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem 0.5rem;
    margin-top: 0.125rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    height: 1.375rem;
    padding: 0 0.4375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.75rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .chip--up {
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-success) 20%, transparent);
  }
  .chip--down {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-error) 20%, transparent);
  }
  .comparison {
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
  }
</style>
