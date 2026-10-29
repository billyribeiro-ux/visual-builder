<script lang="ts">
  import InlineMessage from './InlineMessage.svelte';

  interface Props {
    values: readonly number[];
    onchange: (next: number[]) => void;
    ariaLabel: string;
    id?: string;
  }

  let { values, onchange, ariaLabel, id }: Props = $props();

  let draft = $state<string | null>(null);
  let error = $state('');

  const text = $derived(draft ?? values.join(', '));

  /** Comma/space separated numbers; any token that is not a finite number refuses the edit. */
  function commit() {
    if (draft === null) return;
    const tokens = draft.split(/[\s,;]+/).filter(Boolean);
    const bad = tokens.find((t) => !Number.isFinite(Number(t)));
    if (bad !== undefined) {
      error = `“${bad}” is not a number. Separate values with commas, e.g. 12, 18.5, 9.`;
      return;
    }
    error = '';
    draft = null;
    onchange(tokens.map(Number));
  }
</script>

<div class="nl">
  <input
    {id}
    class={['sx-input', 'sx-input--mono', error && 'is-invalid']}
    inputmode="decimal"
    spellcheck="false"
    aria-label={ariaLabel}
    aria-invalid={error ? 'true' : undefined}
    placeholder="e.g. 12, 18.5, 9"
    value={text}
    oninput={(e) => (draft = e.currentTarget.value)}
    onchange={commit}
    onkeydown={(e) => {
      if (e.key === 'Enter') commit();
    }}
  />
  {#if error}<InlineMessage message={error} />{/if}
</div>

<style>
  .nl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
</style>
