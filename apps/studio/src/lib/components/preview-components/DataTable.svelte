<script lang="ts">
  interface Column {
    key: string;
    label: string;
  }

  interface Props {
    title?: string;
    columns?: Column[];
    rows?: Record<string, any>[];
    style?: string;
  }

  let {
    title = 'Recent Transactions',
    columns = [],
    rows = [],
    style = ''
  }: Props = $props();
</script>

<div class="md-table-container" {style}>
  {#if title}
    <div style="padding: 1.25rem 1.5rem; font-weight: 700; font-size: 1.125rem; border-bottom: 1px solid var(--md-sys-color-outline-variant);">
      {title}
    </div>
  {/if}
  <div style="overflow-x: auto;">
    <table class="md-table">
      <thead>
        <tr>
          {#each columns as col (col.key)}
            <th>{col.label}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, rIdx (rIdx)}
          <tr>
            {#each columns as col (col.key)}
              <td>{row[col.key]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
