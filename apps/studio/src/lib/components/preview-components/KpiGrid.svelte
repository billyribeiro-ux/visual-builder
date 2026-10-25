<script lang="ts">
  interface Card {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
  }

  interface Props {
    cards?: Card[];
    style?: string;
  }

  let { cards = [], style = '' }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" {style}>
  {#each cards as card}
    <div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
      <div class="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">{card.title}</div>
      <div class="mt-2 flex items-baseline justify-between">
        <div class="text-2xl font-bold text-[var(--color-foreground)]">{card.value}</div>
        <span class="inline-flex items-center text-xs font-semibold {card.trend === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-destructive)]'}">
          {card.change}
        </span>
      </div>
    </div>
  {/each}
</div>
