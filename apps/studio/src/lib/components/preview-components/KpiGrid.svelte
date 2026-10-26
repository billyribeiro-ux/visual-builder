<script lang="ts">
  interface KpiCard {
    label: string;
    value: string;
    delta: string;
    trend?: 'up' | 'down' | string;
    isPositive?: boolean;
  }

  interface Props {
    cards?: KpiCard[];
    style?: string;
  }

  let { cards = [], style = '' }: Props = $props();
</script>

<div class="md-grid md-grid-cols-3" style="margin-bottom: 2rem; {style}">
  {#each cards as c, idx (idx)}
    {@const positive = c.trend ? c.trend === 'up' : c.isPositive !== false}
    <div class="md-card md-card-outlined">
      <div class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant); margin-bottom: 0.5rem;">{c.label}</div>
      <div style="display: flex; align-items: baseline; justify-content: space-between;">
        <span class="md-headline-medium">{c.value}</span>
        {#if c.delta}
          <span
            class="md-label-medium"
            style="padding: 0.125rem 0.5rem; border-radius: var(--md-sys-shape-corner-full); background-color: {positive ? 'var(--md-sys-color-secondary-container)' : 'var(--md-sys-color-error-container)'}; color: {positive ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-error-container)'};"
          >
            {c.delta}
          </span>
        {/if}
      </div>
    </div>
  {/each}
</div>
