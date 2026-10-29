<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { onDestroy } from 'svelte';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'content'> {
    /** The code, rendered as escaped plain text. */
    content?: string;
    /** Display label only (no syntax highlighting). */
    language?: string;
    filename?: string;
    showLineNumbers?: boolean;
    theme?: 'dark' | 'light';
    class?: string;
  }

  let {
    content = '',
    language = 'TypeScript',
    filename = '',
    showLineNumbers = true,
    theme = 'dark',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  type CopyStatus = 'idle' | 'copied' | 'manual';
  let status = $state<CopyStatus>('idle');
  let manualKeys = $state('Ctrl+C');
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const code = $derived(String(content ?? '').replace(/\r\n?/g, '\n'));
  /** Line numbers (a trailing newline does not add an empty numbered line). */
  const lineNumbers = $derived(
    Array.from({ length: Math.max(1, code.replace(/\n$/, '').split('\n').length) }, (_, i) => i + 1)
  );
  const regionLabel = $derived(`${filename || language || 'Code'} code`);

  function selectCode(codeEl: Element | null | undefined) {
    const selection = window.getSelection();
    if (!codeEl || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(codeEl);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /** Shows a confirmation, then returns the button to its idle label. */
  function flash(next: CopyStatus) {
    status = next;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (status = 'idle'), next === 'copied' ? 2000 : 5000);
  }

  async function copy(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
    const codeEl = event.currentTarget.closest('.code-block')?.querySelector('code');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(code);
      flash('copied');
    } catch {
      // No clipboard access (insecure context, permissions, old browser): select the text instead.
      manualKeys = /Mac|iPhone|iPad/i.test(navigator.userAgent) ? 'Cmd+C' : 'Ctrl+C';
      selectCode(codeEl);
      flash('manual');
    }
  }

  onDestroy(() => clearTimeout(resetTimer));
</script>

<div {...rest} class={['code-block', theme === 'light' ? 'theme-light' : 'theme-dark', className]}>
  <div class="header">
    <span class="file">
      <Icon name={filename ? 'FileText' : 'Code'} size={16} class="file-icon" />
      {#if filename}
        <span class="filename" data-prop="filename">{filename}</span>
      {:else}
        <span class="filename" data-prop="language">{language}</span>
      {/if}
    </span>
    <span class="actions">
      {#if filename && language}
        <span class="language" data-prop="language">{language}</span>
      {/if}
      <button type="button" class={['copy', status !== 'idle' && `copy--${status}`]} onclick={copy} aria-describedby="{uid}-status">
        <Icon name={status === 'copied' ? 'Check' : 'Copy'} size={16} />
        <span>{status === 'copied' ? 'Copied' : status === 'manual' ? `Press ${manualKeys}` : 'Copy'}</span>
      </button>
    </span>
  </div>
  <!-- Scrollable regions must be reachable by keyboard (WCAG 2.1.1, axe scrollable-region-focusable). -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="scroll" role="region" aria-label={regionLabel} tabindex="0">
    <div class={['inner', showLineNumbers && 'inner--numbered']}>
      {#if showLineNumbers}
        <span class="gutter" aria-hidden="true">
          {#each lineNumbers as n (n)}
            <span class="line-number">{n}</span>
          {/each}
        </span>
      {/if}
      <pre class="pre"><code class="code" data-prop="content">{code}</code></pre>
    </div>
  </div>
  <span id="{uid}-status" class="visually-hidden" role="status">
    {status === 'copied' ? 'Code copied to clipboard' : status === 'manual' ? `Code selected. Press ${manualKeys} to copy.` : ''}
  </span>
</div>

<style>
  .code-block {
    --code-bg: color-mix(in srgb, var(--md-sys-color-primary) 6%, rgb(13, 14, 18));
    --code-fg: rgba(255, 255, 255, 0.9);
    --code-muted: rgba(255, 255, 255, 0.6);
    --code-faint: rgba(255, 255, 255, 0.34);
    --code-line: rgba(255, 255, 255, 0.08);
    --code-header: rgba(255, 255, 255, 0.03);
    --code-hover: rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    overflow: hidden;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    border: 1px solid var(--code-line);
    background-color: var(--code-bg);
    color: var(--code-fg);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.08),
      0 16px 40px -20px rgba(0, 0, 0, 0.35);
  }
  .theme-light {
    --code-bg: var(--md-sys-color-surface-container-low);
    --code-fg: var(--md-sys-color-on-surface);
    --code-muted: var(--md-sys-color-on-surface-variant);
    --code-faint: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 60%, transparent);
    --code-line: var(--md-sys-color-outline-variant);
    --code-header: var(--md-sys-color-surface-container);
    --code-hover: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 44px;
    padding: 0.375rem 0.5rem 0.375rem 1rem;
    border-bottom: 1px solid var(--code-line);
    background-color: var(--code-header);
  }
  .file {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    color: var(--code-muted);
  }
  .file :global(.file-icon) {
    flex-shrink: 0;
  }
  .filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--md-sys-font-mono);
    font-size: 0.8125rem;
  }
  .actions {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
  }
  .language {
    padding: 0.125rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid var(--code-line);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--code-muted);
  }
  .copy {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    height: 32px;
    padding: 0 0.75rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--code-muted);
    transition:
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .copy:hover {
    background-color: var(--code-hover);
    color: var(--code-fg);
  }
  .copy:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 1px;
  }
  .copy--copied {
    color: var(--code-fg);
  }
  .scroll {
    overflow: auto;
    max-height: 36rem;
    overscroll-behavior-x: contain;
  }
  .scroll:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
  .inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    min-width: max-content;
    font-family: var(--md-sys-font-mono);
    font-size: 0.8125rem;
    line-height: 1.75;
  }
  .inner--numbered {
    grid-template-columns: auto minmax(0, 1fr);
  }
  .gutter {
    position: sticky;
    left: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 1rem 0.75rem 1rem 1rem;
    background-color: var(--code-bg);
    color: var(--code-faint);
    user-select: none;
    -webkit-user-select: none;
    font-variant-numeric: tabular-nums;
  }
  .pre {
    margin: 0;
    padding: 1rem 1.25rem;
    font: inherit;
    white-space: pre;
    tab-size: 2;
  }
  .inner--numbered .pre {
    padding-left: 0.5rem;
  }
  .code {
    font: inherit;
  }
  .code::selection {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
  }
  .visually-hidden {
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
  @media (min-width: 768px) {
    .inner {
      font-size: 0.875rem;
    }
  }
  @media (max-width: 767px) {
    .copy {
      height: 40px;
    }
  }
  @media (max-width: 479px) {
    .language {
      display: none;
    }
  }
</style>
