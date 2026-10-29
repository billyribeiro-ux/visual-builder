<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface DetailItem {
    term: string;
    detail: string;
    copyable?: boolean;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    description?: string;
    items?: DetailItem[];
    columns?: number;
    class?: string;
  }

  let { title = '', description = '', items = [], columns = 2, class: className = '', ...rest }: Props = $props();

  const cols = $derived(Number(columns) === 1 ? 1 : 2);
  const safeItems = $derived(Array.isArray(items) ? items.filter((item) => item && typeof item.term === 'string') : []);

  /** Copy feedback per row: 'copied' | 'failed'. */
  let feedback = $state<{ index: number; status: 'copied' | 'failed' } | null>(null);
  let status = $state('');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => clearTimeout(resetTimer));

  async function copy(index: number, item: DetailItem) {
    clearTimeout(resetTimer);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(item.detail ?? '');
      feedback = { index, status: 'copied' };
      status = `${item.term} copied to clipboard.`;
    } catch {
      feedback = { index, status: 'failed' };
      status = `Could not copy ${item.term}. Select the text and copy it manually.`;
    }
    resetTimer = setTimeout(() => {
      feedback = null;
      status = '';
    }, 2000);
  }
</script>

<section {...rest} class={['details', className]}>
  {#if title || description}
    <header class="header">
      {#if title}<h3 class="title" data-prop="title">{title}</h3>{/if}
      {#if description}<p class="description" data-prop="description">{description}</p>{/if}
    </header>
  {/if}

  <dl class={['list', `list--${cols}`]}>
    {#each safeItems as item, index (index)}
      <div class="row">
        <dt class="term" data-prop={`items.${index}.term`}>{item.term}</dt>
        <dd class="detail">
          <span class={['detail-text', item.copyable && 'is-mono']} data-prop={`items.${index}.detail`}>{item.detail}</span>
          {#if item.copyable}
            {@const copyState = feedback?.index === index ? feedback.status : null}
            <button
              type="button"
              class={['copy', copyState && `is-${copyState}`]}
              aria-label={copyState === 'copied' ? `${item.term} copied` : `Copy ${item.term}`}
              onclick={() => copy(index, item)}
            >
              <Icon name={copyState === 'copied' ? 'Check' : copyState === 'failed' ? 'WarningCircle' : 'Copy'} size={15} />
              <span class="copy-text" aria-hidden="true">{copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}</span>
            </button>
          {/if}
        </dd>
      </div>
    {/each}
  </dl>
  <p class="sr-only" role="status">{status}</p>
</section>

<style>
  .details {
    --dl-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    position: relative;
    min-width: 0;
    border: 1px solid var(--dl-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
  .header {
    padding: 1.125rem 1.5rem;
    border-bottom: 1px solid var(--dl-border);
  }
  .title {
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
  }
  .description {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .row {
    min-width: 0;
    padding: 0.875rem 1.5rem;
    border-top: 1px solid var(--dl-border);
  }
  .row:first-child {
    border-top: 0;
  }
  .term {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
  .detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
    min-height: 2rem;
    margin-top: 0.125rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .detail-text {
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .detail-text.is-mono {
    font-family: var(--md-sys-font-mono);
    font-size: 0.8125rem;
  }
  .copy {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 0.3125rem;
    min-height: 2rem;
    padding: 0 0.625rem;
    border: 1px solid var(--dl-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.75rem;
    font-weight: 600;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease, color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .copy:hover {
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
  }
  .copy.is-copied {
    border-color: color-mix(in srgb, var(--md-sys-color-success) 40%, transparent);
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
  }
  .copy.is-failed {
    border-color: color-mix(in srgb, var(--md-sys-color-error) 40%, transparent);
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
  /* One column: term and detail side by side from tablet up. */
  @media (min-width: 768px) {
    .list--1 .row {
      display: grid;
      grid-template-columns: minmax(10rem, 1fr) 2fr;
      align-items: center;
      gap: 1.5rem;
    }
    .list--1 .detail {
      margin-top: 0;
    }
    .list--2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .list--2 .row:nth-child(2) {
      border-top: 0;
    }
    .list--2 .row:nth-child(even) {
      border-left: 1px solid var(--dl-border);
    }
  }
  @media (max-width: 767px) {
    .header,
    .row {
      padding-left: 1.25rem;
      padding-right: 1.25rem;
    }
    .copy {
      min-height: 2.5rem;
      min-width: 2.5rem;
      justify-content: center;
    }
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
