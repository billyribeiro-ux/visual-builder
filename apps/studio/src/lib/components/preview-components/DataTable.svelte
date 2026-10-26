<script lang="ts">
  interface Props {
    title?: string;
    columns?: string[];
    rows?: string[][];
    style?: string;
  }

  let { title = '', columns = [], rows = [], style = '' }: Props = $props();
  let filterText = $state('');

  const filteredRows = $derived.by(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.some((cell) => cell.toLowerCase().includes(q)));
  });
</script>

<div class="md-card md-card-outlined" style="overflow: hidden; padding: 0; {style}">
  <div style="padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--md-sys-color-outline-variant); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem;">
    {#if title}
      <h3 class="md-title-medium" style="margin: 0;">{title}</h3>
    {/if}
    <input
      type="search"
      placeholder="Filter rows..."
      bind:value={filterText}
      aria-label="Filter table rows"
      class="md-input"
      style="max-width: 15rem; padding: 0.4rem 0.75rem;"
    />
  </div>
  <div style="overflow-x: auto;">
    <table class="md-table">
      <thead>
        <tr>
          {#each columns as col, cIdx (cIdx)}
            <th>{col}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if filteredRows.length === 0}
          <tr>
            <td colspan={Math.max(columns.length, 1)} style="text-align: center; color: var(--md-sys-color-on-surface-variant); padding: 2rem;">
              No matching records found.
            </td>
          </tr>
        {:else}
          {#each filteredRows as row, rIdx (rIdx)}
            <tr>
              {#each row as cell, cIdx (cIdx)}
                <td>{cell}</td>
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
