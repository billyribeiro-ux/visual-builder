<script lang="ts">
  interface Props {
    title?: string;
    columns?: string[];
    rows?: string[][];
    style?: string;
  }

  let {
    title = 'Data Table',
    columns = [],
    rows = [],
    style = ''
  }: Props = $props();
</script>

<div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm" {style}>
  {#if title}
    <div class="p-4 border-b border-[var(--color-border)] font-bold text-[var(--color-foreground)]">
      {title}
    </div>
  {/if}
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-[var(--color-foreground)]">
      <thead class="bg-[var(--color-muted)]/50 text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <tr>
          {#each columns as col}
            <th class="px-6 py-3 font-semibold">{col}</th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--color-border)]">
        {#each rows as row}
          <tr class="hover:bg-[var(--color-muted)]/30 transition-colors">
            {#each row as cell}
              <td class="px-6 py-4 whitespace-nowrap">{cell}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
