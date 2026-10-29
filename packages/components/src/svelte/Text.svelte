<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'content'> {
    /** Plain text. Blank lines separate paragraphs; single newlines become line breaks. */
    content?: string;
    size?: 'lead' | 'md' | 'sm';
    align?: 'left' | 'center' | 'right';
    tone?: 'default' | 'muted' | 'primary';
    maxWidth?: 'none' | 'prose' | 'narrow';
    class?: string;
  }

  let {
    content = 'Plan, build and launch from a single workspace. Every page you design here exports as clean, typed components your team can extend with confidence.',
    size = 'md',
    align = 'left',
    tone = 'muted',
    maxWidth = 'prose',
    class: className = '',
    ...rest
  }: Props = $props();

  // Literal newline text nodes keep the inline-edited text identical to `content`
  // (between block/line-break elements they render as collapsed whitespace).
  const PARAGRAPH_BREAK = '\n\n';
  const LINE_BREAK = '\n';

  /** Paragraphs (split on blank lines), each a list of lines (split on single newlines). */
  const paragraphs = $derived(
    String(content ?? '')
      .replace(/\r\n?/g, '\n')
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/^\n+|\n+$/g, ''))
      .filter((paragraph) => paragraph.trim() !== '')
      .map((paragraph) => paragraph.split('\n'))
  );
</script>

<div {...rest} class={['text', `size-${size}`, `tone-${tone}`, `align-${align}`, `measure-${maxWidth}`, className]} data-prop="content">
  {#each paragraphs as lines, p (p)}
    {#if p > 0}{PARAGRAPH_BREAK}{/if}<p>{#each lines as line, l (l)}{#if l > 0}<br />{LINE_BREAK}{/if}{line}{/each}</p>
  {/each}
</div>

<style>
  .text {
    font-family: var(--md-sys-font-body);
    overflow-wrap: break-word;
    text-wrap: pretty;
  }
  .text p + p {
    margin-top: 1em;
  }
  .size-lead {
    font-size: 1.125rem;
    line-height: 1.6;
    letter-spacing: -0.006em;
  }
  .size-md {
    font-size: 1rem;
    line-height: 1.7;
  }
  .size-sm {
    font-size: 0.875rem;
    line-height: 1.6;
  }
  @media (min-width: 768px) {
    .size-lead {
      font-size: 1.25rem;
    }
  }
  .tone-muted {
    color: var(--md-sys-color-on-surface-variant);
  }
  .tone-primary {
    color: var(--md-sys-color-primary);
  }
  .align-left {
    text-align: left;
  }
  .align-center {
    text-align: center;
  }
  .align-right {
    text-align: right;
  }
  .measure-prose {
    max-width: 65ch;
  }
  .measure-narrow {
    max-width: 45ch;
  }
  .align-center:not(.measure-none) {
    margin-left: auto;
    margin-right: auto;
  }
  .align-right:not(.measure-none) {
    margin-left: auto;
  }
</style>
