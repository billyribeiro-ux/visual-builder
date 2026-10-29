<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  interface Props {
    value: string;
    oninput: (value: string) => void;
    id?: string;
    ariaLabel?: string;
    placeholder?: string;
    minRows?: number;
    maxHeight?: number;
    mono?: boolean;
  }

  let { value, oninput, id, ariaLabel, placeholder, minRows = 2, maxHeight = 320, mono = false }: Props = $props();

  /** Grows with its content (re-measured whenever the value changes, including undo/redo). */
  const autosize: Attachment<HTMLTextAreaElement> = (el) => {
    void value;
    el.style.height = 'auto';
    el.style.height = `${Math.min(maxHeight, el.scrollHeight + 2)}px`;
  };
</script>

<textarea
  {id}
  class={['sx-textarea', 'auto', mono && 'sx-input--mono']}
  rows={minRows}
  aria-label={ariaLabel}
  {placeholder}
  {value}
  oninput={(e) => oninput(e.currentTarget.value)}
  {@attach autosize}
></textarea>

<style>
  .auto {
    min-height: 0;
    resize: none;
    overflow-y: auto;
  }
</style>
