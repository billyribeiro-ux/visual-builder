<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** Total number of items. */
    total?: number;
    pageSize?: number;
    /** Initially selected page (1-based). */
    current?: number;
    /** Pages shown on each side of the current page (numbered variant). */
    siblingCount?: number;
    variant?: 'numbered' | 'simple';
    showSummary?: boolean;
    /** Noun used in the summary, e.g. "results", "invoices". */
    itemLabel?: string;
    class?: string;
  }

  let {
    total = 0,
    pageSize = 10,
    current = 1,
    siblingCount = 1,
    variant = 'numbered',
    showSummary = true,
    itemLabel = 'results',
    class: className = '',
    ...rest
  }: Props = $props();

  type PageItem = { kind: 'page'; page: number; edge: boolean } | { kind: 'gap'; key: string };

  const safeTotal = $derived(Math.max(0, Math.floor(Number(total) || 0)));
  const safeSize = $derived(Math.max(1, Math.floor(Number(pageSize) || 10)));
  const totalPages = $derived(Math.max(1, Math.ceil(safeTotal / safeSize)));
  const siblings = $derived(Math.min(3, Math.max(0, Math.floor(Number(siblingCount) || 0))));

  /** Local page: initialised from `current` (clamped), re-initialised when the props change. */
  let page = $derived(Math.min(Math.max(1, Math.floor(Number(current) || 1)), totalPages));

  const rangeStart = $derived(safeTotal === 0 ? 0 : (page - 1) * safeSize + 1);
  const rangeEnd = $derived(Math.min(page * safeSize, safeTotal));

  /**
   * Always shows first and last page, the current page and `siblings` pages around it.
   * A gap of exactly one page is filled with that page instead of an ellipsis.
   */
  const items = $derived.by((): PageItem[] => {
    const slots = siblings * 2 + 5;
    if (totalPages <= slots) {
      return Array.from({ length: totalPages }, (_, i) => ({ kind: 'page', page: i + 1, edge: i === 0 || i === totalPages - 1 }));
    }
    const left = Math.max(page - siblings, 1);
    const right = Math.min(page + siblings, totalPages);
    const showLeftGap = left > 3;
    const showRightGap = right < totalPages - 2;
    const out: PageItem[] = [];
    const push = (p: number) => out.push({ kind: 'page', page: p, edge: p === 1 || p === totalPages });
    if (!showLeftGap && showRightGap) {
      for (let p = 1; p <= 3 + siblings * 2; p++) push(p);
      out.push({ kind: 'gap', key: 'right' });
      push(totalPages);
    } else if (showLeftGap && !showRightGap) {
      push(1);
      out.push({ kind: 'gap', key: 'left' });
      for (let p = totalPages - (2 + siblings * 2); p <= totalPages; p++) push(p);
    } else {
      push(1);
      out.push({ kind: 'gap', key: 'left' });
      for (let p = left; p <= right; p++) push(p);
      out.push({ kind: 'gap', key: 'right' });
      push(totalPages);
    }
    return out;
  });

  function goTo(next: number) {
    page = Math.min(Math.max(1, next), totalPages);
  }

  function formatCount(value: number): string {
    return value.toLocaleString('en-US');
  }
</script>

<nav {...rest} class={['pagination', `pagination--${variant === 'simple' ? 'simple' : 'numbered'}`, className]} aria-label="Pagination">
  {#if showSummary}
    <p class="summary" aria-live="polite">
      {#if safeTotal === 0}
        No <span data-prop="itemLabel">{itemLabel}</span>
      {:else}
        Showing <strong>{formatCount(rangeStart)}</strong>–<strong>{formatCount(rangeEnd)}</strong> of
        <strong>{formatCount(safeTotal)}</strong> <span data-prop="itemLabel">{itemLabel}</span>
      {/if}
    </p>
  {/if}

  <ul class="controls">
    <li>
      <button type="button" class="btn btn--step" disabled={page <= 1} onclick={() => goTo(page - 1)} aria-label="Go to previous page">
        <Icon name="CaretLeft" size={16} />
        <span class="step-label">Previous</span>
      </button>
    </li>

    {#if variant === 'simple'}
      <li class="page-of" aria-live="polite">Page {page} of {totalPages}</li>
    {:else}
      {#each items as item (item.kind === 'page' ? `p${item.page}` : item.key)}
        {#if item.kind === 'gap'}
          <li class="gap" aria-hidden="true">…</li>
        {:else}
          <li class={['page-item', !item.edge && item.page !== page && 'is-sibling']}>
            <button
              type="button"
              class={['btn', 'btn--page', item.page === page && 'is-current']}
              aria-label="Page {item.page}"
              aria-current={item.page === page ? 'page' : undefined}
              onclick={() => goTo(item.page)}
            >
              {item.page}
            </button>
          </li>
        {/if}
      {/each}
    {/if}

    <li>
      <button type="button" class="btn btn--step" disabled={page >= totalPages} onclick={() => goTo(page + 1)} aria-label="Go to next page">
        <span class="step-label">Next</span>
        <Icon name="CaretRight" size={16} />
      </button>
    </li>
  </ul>
</nav>

<style>
  .pagination {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem 1.5rem;
    min-width: 0;
    color: var(--md-sys-color-on-surface);
  }
  .summary {
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
  }
  .summary strong {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    list-style: none;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-width: 2.25rem;
    height: 2.25rem;
    padding: 0 0.625rem;
    border: 1px solid transparent;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.875rem;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease, color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .btn:hover:not(:disabled) {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
  }
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .btn--step {
    border-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
  }
  .btn--page.is-current {
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent);
    color: var(--md-sys-color-primary);
    font-weight: 650;
  }
  .gap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2rem;
    color: var(--md-sys-color-on-surface-variant);
    user-select: none;
  }
  .page-of {
    padding: 0 0.75rem;
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  @media (max-width: 767px) {
    .pagination {
      justify-content: center;
    }
    .summary {
      width: 100%;
      text-align: center;
    }
    .btn {
      min-width: 2.5rem;
      height: 2.5rem;
    }
    .pagination--numbered .step-label {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
    .pagination--numbered .btn--step {
      padding: 0;
    }
    .is-sibling {
      display: none;
    }
  }
</style>
