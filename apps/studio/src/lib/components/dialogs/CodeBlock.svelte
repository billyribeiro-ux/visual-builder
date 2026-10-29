<script lang="ts">
  import { paintTokens, tokenizeCode, type CodeLang } from './highlight.js';

  interface Props {
    code: string;
    lang: CodeLang;
    /** Accessible label for the scroll region, e.g. the file name. */
    label: string;
  }

  let { code, lang, label }: Props = $props();

  const lineCount = $derived(code.length === 0 ? 1 : code.split('\n').length);
  const gutter = $derived(Array.from({ length: lineCount }, (_, i) => i + 1).join('\n'));
  const tokens = $derived(tokenizeCode(code, lang));
</script>

<div class="code" role="region" aria-label={label} tabindex="-1" style:--digits={String(lineCount).length}>
  <pre class="code__gutter" aria-hidden="true">{gutter}</pre>
  <pre class="code__pre"><code {@attach (el) => paintTokens(el, tokens)}></code></pre>
</div>

<style>
  .code {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    min-height: 0;
    height: 100%;
    overflow: auto;
    font-family: var(--sx-font-mono);
    font-size: 12px;
    line-height: 18px;
    font-variant-ligatures: none;
    tab-size: 2;
    background: var(--sx-panel);
    color: var(--sx-text);
    outline: none;
  }
  pre {
    margin: 0;
    font: inherit;
    white-space: pre;
  }
  .code__gutter {
    position: sticky;
    left: 0;
    z-index: 1;
    min-width: calc(var(--digits) * 1ch + 28px);
    min-height: 100%;
    padding: 12px 12px 16px 16px;
    text-align: right;
    color: var(--sx-text-3);
    background: var(--sx-subtle);
    border-right: 1px solid var(--sx-border);
    user-select: none;
  }
  .code__pre {
    padding: 12px 20px 16px 16px;
    min-width: max-content;
  }
  .code :global(.tk-com) {
    color: var(--sx-text-3);
    font-style: italic;
  }
  .code :global(.tk-str) {
    color: #0b7a4b;
  }
  .code :global(.tk-num),
  .code :global(.tk-lit) {
    color: #b54708;
  }
  .code :global(.tk-kw) {
    color: #7a5af8;
  }
  .code :global(.tk-tag) {
    color: #1d4ed8;
  }
  .code :global(.tk-attr),
  .code :global(.tk-prop),
  .code :global(.tk-key) {
    color: #9e3c8f;
  }
  .code :global(.tk-var),
  .code :global(.tk-fn) {
    color: #0e7490;
  }
  .code :global(.tk-punc) {
    color: var(--sx-text-2);
  }
  .code :global(.tk-head),
  .code :global(.tk-strong) {
    color: var(--sx-text);
    font-weight: 600;
  }
  .code :global(.tk-code) {
    color: #0e7490;
  }
  .code :global(.tk-link) {
    color: var(--sx-accent-text);
  }
  :global(.sx[data-theme='dark']) .code :global(.tk-str) {
    color: #6fcf97;
  }
  :global(.sx[data-theme='dark']) .code :global(.tk-num),
  :global(.sx[data-theme='dark']) .code :global(.tk-lit) {
    color: #f5b971;
  }
  :global(.sx[data-theme='dark']) .code :global(.tk-kw) {
    color: #b4a3ff;
  }
  :global(.sx[data-theme='dark']) .code :global(.tk-tag) {
    color: #8fb0ff;
  }
  :global(.sx[data-theme='dark']) .code :global(.tk-attr),
  :global(.sx[data-theme='dark']) .code :global(.tk-prop),
  :global(.sx[data-theme='dark']) .code :global(.tk-key) {
    color: #e59ad6;
  }
  :global(.sx[data-theme='dark']) .code :global(.tk-var),
  :global(.sx[data-theme='dark']) .code :global(.tk-fn),
  :global(.sx[data-theme='dark']) .code :global(.tk-code) {
    color: #67d4e8;
  }
</style>
