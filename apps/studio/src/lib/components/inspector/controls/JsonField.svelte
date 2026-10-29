<script lang="ts">
  import AutoTextarea from './AutoTextarea.svelte';
  import InlineMessage from './InlineMessage.svelte';

  interface Props {
    value: unknown;
    onchange: (value: unknown) => void;
    ariaLabel: string;
    id?: string;
    /** Require the parsed value to be an array (list props). */
    expectArray?: boolean;
  }

  let { value, onchange, ariaLabel, id, expectArray = false }: Props = $props();

  let draft = $state<string | null>(null);
  let error = $state('');
  const text = $derived(draft ?? JSON.stringify(value ?? null, null, 2));

  function commit() {
    if (draft === null) return;
    try {
      const parsed: unknown = JSON.parse(draft);
      if (expectArray && !Array.isArray(parsed)) throw new Error('Expected a JSON array ([ … ]).');
      error = '';
      draft = null;
      onchange(parsed);
    } catch (e) {
      error = `Not saved — ${(e as Error).message}`;
    }
  }
</script>

<div class="json" onfocusout={commit}>
  <AutoTextarea {id} {ariaLabel} value={text} mono minRows={4} oninput={(v) => (draft = v)} />
  {#if error}<InlineMessage message={error} />{:else if draft !== null}<p class="sx-help">Changes apply when you leave the field.</p>{/if}
</div>

<style>
  .json {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
</style>
