<script lang="ts">
  interface Props {
    value: string;
    oninput: (value: string) => void;
    /** Ctrl/Cmd + Enter. */
    onsubmit?: () => void;
    id?: string;
    ariaLabel: string;
    placeholder?: string;
    invalid?: boolean;
    describedby?: string;
    minLines?: number;
  }

  let { value, oninput, onsubmit, id, ariaLabel, placeholder, invalid = false, describedby, minLines = 8 }: Props = $props();

  let scrollTop = $state(0);
  const lineCount = $derived(Math.max(minLines, value.split('\n').length));

  /** Tab indents with two spaces instead of leaving the field (Esc then Tab still moves focus). */
  function onKeydown(e: KeyboardEvent) {
    const el = e.currentTarget as HTMLTextAreaElement;
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onsubmit?.();
      return;
    }
    if (e.key === 'Escape') {
      el.dataset.escaped = 'true';
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && el.dataset.escaped !== 'true') {
      e.preventDefault();
      const { selectionStart: a, selectionEnd: b } = el;
      const next = `${el.value.slice(0, a)}  ${el.value.slice(b)}`;
      el.value = next;
      el.selectionStart = el.selectionEnd = a + 2;
      oninput(next);
      return;
    }
    delete el.dataset.escaped;
  }
</script>

<div class={['code', invalid && 'code--invalid']} style:--lines={minLines}>
  <div class="code__gutter" aria-hidden="true">
    <div class="code__nums" style:transform="translateY({-scrollTop}px)">
      {#each { length: lineCount }, i}
        <span>{i + 1}</span>
      {/each}
    </div>
  </div>
  <textarea
    {id}
    class="code__area"
    spellcheck="false"
    autocomplete="off"
    autocapitalize="off"
    wrap="off"
    aria-label={ariaLabel}
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={describedby}
    {placeholder}
    {value}
    oninput={(e) => oninput(e.currentTarget.value)}
    onkeydown={onKeydown}
    onscroll={(e) => (scrollTop = e.currentTarget.scrollTop)}
  ></textarea>
</div>

<style>
  .code {
    --line: 18px;
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    height: calc(var(--lines) * var(--line) + 16px);
    min-height: 120px;
    overflow: hidden;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    line-height: var(--line);
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    resize: vertical;
  }
  .code:focus-within {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .code--invalid,
  .code--invalid:focus-within {
    border-color: var(--sx-danger);
  }
  .code__gutter {
    overflow: hidden;
    padding: 8px 0;
    border-right: 1px solid var(--sx-border);
    background: var(--sx-hover);
    color: var(--sx-text-3);
    text-align: right;
    user-select: none;
  }
  .code__nums {
    display: flex;
    flex-direction: column;
    padding-right: 8px;
    font-variant-numeric: tabular-nums;
  }
  .code__area {
    width: 100%;
    height: 100%;
    padding: 8px 10px;
    font: inherit;
    line-height: var(--line);
    color: var(--sx-text);
    background: transparent;
    border: 0;
    outline: none;
    resize: none;
    white-space: pre;
    overflow: auto;
    tab-size: 2;
  }
  .code__area::placeholder {
    color: var(--sx-text-3);
  }
</style>
