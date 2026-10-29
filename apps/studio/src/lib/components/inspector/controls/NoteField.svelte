<script lang="ts">
  import { editor } from '../../../state/editor.svelte.js';
  import AutoTextarea from './AutoTextarea.svelte';

  interface Props {
    /** `node:<id>`, `page:<id>` or `project`. */
    noteKey: string;
    label: string;
    placeholder: string;
    id?: string;
  }

  let { noteKey, label, placeholder, id }: Props = $props();

  const uid = $props.id();
  const fieldId = $derived(id ?? `${uid}-note`);
  const MAX = 20_000;

  const value = $derived(editor.blueprint.notes?.[noteKey] ?? '');

  /** `SET_NOTE` (empty value clears the note); the editor coalesces consecutive edits of one key. */
  function setNote(next: string) {
    editor.dispatch({ type: 'SET_NOTE', key: noteKey, value: next.slice(0, MAX) });
  }
</script>

<div class="note">
  <div class="note__head">
    <label class="sx-label" for={fieldId}>{label}</label>
    <span class={['note__count', value.length > MAX * 0.9 && 'note__count--warn']}>
      {value.length.toLocaleString()} / {MAX.toLocaleString()}
    </span>
  </div>
  <div class="note__box" onfocusout={() => editor.endContinuousEdit()}>
    <AutoTextarea id={fieldId} {value} {placeholder} minRows={3} oninput={setNote} />
  </div>
</div>

<style>
  .note {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .note__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .note__count {
    font-size: var(--sx-text-xs);
    font-variant-numeric: tabular-nums;
    color: var(--sx-text-3);
  }
  .note__count--warn {
    color: var(--sx-warning);
  }
  .note__box {
    width: 100%;
  }
</style>
