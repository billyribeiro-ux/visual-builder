<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    description?: string;
    columns?: string[];
    rows?: string[][];
    class?: string;
  }

  let { title = '', description = '', columns = [], rows = [], class: className = '', ...rest }: Props = $props();

  const uid = $props.id();
  let filterText = $state('');

  const filteredRows = $derived.by(() => {
    const query = filterText.trim().toLowerCase();
    const indexed = rows.map((cells, index) => ({ cells, index }));
    if (!query) return indexed;
    return indexed.filter((row) => row.cells.some((cell) => String(cell).toLowerCase().includes(query)));
  });

  /** Columns whose header names a status/state render their cells as tone pills. */
  const statusColumns = $derived(new Set(columns.flatMap((column, i) => (/status|state/i.test(column) ? [i] : []))));
  /** Columns whose every non-empty cell looks numeric/monetary are right-aligned. */
  const numericColumns = $derived(
    new Set(
      columns.flatMap((_, i) => {
        const values = rows.map((r) => String(r[i] ?? '').trim()).filter(Boolean);
        return values.length > 0 && values.every((v) => /^[-+]?[$€£¥]?\s?[\d.,]+\s?(%|[kKmMbB]|pts?)?$/.test(v)) ? [i] : [];
      })
    )
  );
  const columnCount = $derived(Math.max(columns.length, 1));

  const SUCCESS = /\b(active|healthy|paid|live|completed?|resolved|enabled|operational|online|success(ful)?|approved|done)\b/i;
  const WARNING = /\b(trial|pending|review|degraded|paused|past due|at risk|warning|processing|scheduled)\b/i;
  const ERROR = /\b(failed|error|down|overdue|cancell?ed|critical|offline|blocked|churned|declined)\b/i;

  function tone(value: string): 'success' | 'warning' | 'error' | 'neutral' {
    if (ERROR.test(value)) return 'error';
    if (WARNING.test(value)) return 'warning';
    if (SUCCESS.test(value)) return 'success';
    return 'neutral';
  }
</script>

<div {...rest} class={['md-card', 'table-card', className]}>
  <div class="toolbar">
    {#if title || description}
      <div class="heading">
        {#if title}
          <h3 class="title" id="{uid}-title" data-prop="title">{title}</h3>
        {/if}
        {#if description}
          <p class="description" data-prop="description">{description}</p>
        {/if}
      </div>
    {/if}
    <div class="search">
      <label for="{uid}-search" class="md-visually-hidden">Filter rows</label>
      <Icon name="MagnifyingGlass" size={16} class="search-icon" />
      <input
        id="{uid}-search"
        type="search"
        placeholder="Filter rows…"
        autocomplete="off"
        bind:value={filterText}
        class="md-input search-input"
      />
    </div>
  </div>
  <div class="scroll">
    <table class="table" aria-labelledby={title ? `${uid}-title` : undefined} aria-label={title ? undefined : 'Data table'}>
      <thead>
        <tr>
          {#each columns as column, columnIndex (columnIndex)}
            <th scope="col" class={[numericColumns.has(columnIndex) && 'num']} data-prop={`columns.${columnIndex}`}>{column}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#if filteredRows.length === 0}
          <tr class="empty-row">
            <td colspan={columnCount}>
              <div class="empty">
                <span class="empty-icon"><Icon name="Tray" size={20} /></span>
                <span class="empty-title">No matching records</span>
                <span class="empty-hint">{rows.length === 0 ? 'Rows you add will appear here.' : 'Try a different search term.'}</span>
              </div>
            </td>
          </tr>
        {:else}
          {#each filteredRows as row (row.index)}
            <tr>
              {#each row.cells as cell, cellIndex (cellIndex)}
                {#if statusColumns.has(cellIndex)}
                  <td>
                    <span class={['md-badge', 'status', `status--${tone(cell)}`]}>
                      <span class="md-dot"></span>
                      <span data-prop={`rows.${row.index}.${cellIndex}`}>{cell}</span>
                    </span>
                  </td>
                {:else}
                  <td class={[cellIndex === 0 && 'primary-cell', numericColumns.has(cellIndex) && 'num']} data-prop={`rows.${row.index}.${cellIndex}`}>{cell}</td>
                {/if}
              {/each}
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
  <div class="footer" aria-live="polite">
    Showing <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong>
    {rows.length === 1 ? 'record' : 'records'}
  </div>
</div>

<style>
  .table-card {
    overflow: hidden;
    padding: 0;
    box-shadow: var(--md-sys-elevation-level1);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.875rem 1.5rem;
    padding: 1.125rem 1.25rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .heading {
    min-width: 0;
    flex: 1 1 16rem;
  }
  .title {
    font-family: var(--md-sys-font-heading);
    font-size: 1rem;
    line-height: 1.4;
    font-weight: 600;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    color: var(--md-sys-color-on-surface);
  }
  .description {
    margin-top: 0.125rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
  .search {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1 1 100%;
  }
  .search :global(.search-icon) {
    position: absolute;
    left: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    pointer-events: none;
  }
  .search-input {
    min-height: 40px;
    height: 40px;
    padding: 0 0.75rem 0 2.25rem;
    font-size: 0.875rem;
    box-shadow: none;
    border-color: var(--md-sys-color-outline);
  }
  @media (min-width: 640px) {
    .search {
      flex: 0 1 16rem;
    }
  }
  .scroll {
    overflow-x: auto;
  }
  .table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }
  th {
    padding: 0.625rem 1.25rem;
    font-size: 0.75rem;
    line-height: 1.25rem;
    font-weight: 550;
    letter-spacing: 0.01em;
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container-low);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    white-space: nowrap;
  }
  td {
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
  }
  .primary-cell {
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }
  .num {
    text-align: right;
  }
  td.num {
    color: var(--md-sys-color-on-surface);
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:not(.empty-row):hover td {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .status {
    height: 1.375rem;
    padding: 0 0.5rem;
  }
  .status--success {
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
    border-color: color-mix(in srgb, var(--md-sys-color-success) 22%, transparent);
  }
  .status--warning {
    background-color: var(--md-sys-color-warning-container);
    color: var(--md-sys-color-on-warning-container);
    border-color: color-mix(in srgb, var(--md-sys-color-warning) 24%, transparent);
  }
  .status--error {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
    border-color: color-mix(in srgb, var(--md-sys-color-error) 22%, transparent);
  }
  .status--neutral {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }
  .empty-row td {
    white-space: normal;
  }
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 2.5rem 1rem;
    text-align: center;
  }
  .empty-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 0.5rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium, 10px);
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface-variant);
  }
  .empty-title {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .empty-hint {
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .footer {
    padding: 0.75rem 1.25rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
  .footer strong {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
</style>
