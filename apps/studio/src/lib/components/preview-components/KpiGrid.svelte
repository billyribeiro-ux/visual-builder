<script lang="ts">
  interface KpiCard {
    title: string;
    value: string;
    change: string;
    isPositive?: boolean;
  }

  interface Props {
    cards?: KpiCard[];
    style?: string;
  }

  let {
    cards = [],
    style = ''
  }: Props = $props();
</script>

<div class="md-kpi-grid" {style}>
  {#each cards as c, idx (idx)}
    <div class="md-card md-card--elevated">
      <div class="md-kpi-card__title">{c.title}</div>
      <div class="md-kpi-card__val">{c.value}</div>
      <div style="font-size: 0.75rem; font-weight: 600; margin-top: 0.5rem; color: {c.isPositive ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'};">
        {c.change} vs last month
      </div>
    </div>
  {/each}
</div>
