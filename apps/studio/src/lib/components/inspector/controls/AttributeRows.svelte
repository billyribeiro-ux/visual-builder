<script lang="ts">
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import { isSafeAttributeName } from '@app-viz/schema';
  import IconButton from '../../../ui/IconButton.svelte';
  import InlineMessage from './InlineMessage.svelte';

  interface Row {
    id: string;
    name: string;
    value: string;
  }

  interface Props {
    attributes: Record<string, string> | undefined;
    onchange: (next: Record<string, string> | undefined) => void;
  }

  let { attributes, onchange }: Props = $props();

  const MAX_ROWS = 24;
  const MAX_VALUE = 500;
  let seq = 0;
  const newId = () => `a${++seq}`;

  /**
   * Rows being edited, tagged with the stored attributes they were derived from. When the
   * stored attributes change elsewhere (undo, paste style) the rows are rebuilt from them;
   * otherwise typed text — including invalid rows that are not saved — stays on screen.
   */
  const storedSig = $derived(JSON.stringify(attributes ?? {}));
  let local = $state<{ sig: string; rows: Row[] } | null>(null);
  const rows = $derived<Row[]>(
    local && local.sig === storedSig
      ? local.rows
      : Object.entries(attributes ?? {}).map(([name, value]) => ({ id: `s-${name}`, name, value }))
  );

  function rowError(row: Row, index: number, all: readonly Row[]): string {
    const name = row.name.trim().toLowerCase();
    if (!name) return row.value ? 'Add an attribute name.' : '';
    if (!isSafeAttributeName(name)) {
      return `“${row.name.trim()}” is not allowed. Use data-*, aria-*, role, title, lang, dir, tabindex, translate or spellcheck.`;
    }
    if (all.findIndex((r) => r.name.trim().toLowerCase() === name) !== index) return `“${name}” is already set above.`;
    if (name === 'tabindex' && !/^-?(?:0|1)$/.test(row.value.trim())) return 'tabindex must be 0, 1 or -1.';
    if (name === 'dir' && !['ltr', 'rtl', 'auto'].includes(row.value.trim())) return 'dir must be ltr, rtl or auto.';
    if (row.value.length > MAX_VALUE) return `Values are limited to ${MAX_VALUE} characters.`;
    if (/\p{Cc}/u.test(row.value)) return 'Values cannot contain control characters.';
    return '';
  }

  const errors = $derived(rows.map((r, i) => rowError(r, i, rows)));

  /** Saves every valid, named row; invalid rows stay visible with their error and are not saved. */
  function commit(next: Row[]) {
    const record: Record<string, string> = {};
    next.forEach((r, i) => {
      const name = r.name.trim().toLowerCase();
      if (name && !rowError(r, i, next)) record[name] = r.value.trim();
    });
    const sig = JSON.stringify(record);
    local = { sig, rows: next };
    if (sig !== storedSig) onchange(Object.keys(record).length ? record : undefined);
  }

  function update(index: number, patch: Partial<Row>) {
    local = { sig: storedSig, rows: rows.map((r, i) => (i === index ? { ...r, ...patch } : r)) };
  }
</script>

<div class="attrs">
  {#if rows.length > 0}
    <div class="attrs__head" aria-hidden="true">
      <span>Name</span><span>Value</span>
    </div>
    <ul class="attrs__list">
      {#each rows as row, i (row.id)}
        <li class="attrs__row">
          <input
            class={['sx-input', 'sx-input--mono', errors[i] && 'is-invalid']}
            aria-label="Attribute {i + 1} name"
            aria-invalid={errors[i] ? 'true' : undefined}
            placeholder="data-track"
            spellcheck="false"
            autocomplete="off"
            value={row.name}
            oninput={(e) => update(i, { name: e.currentTarget.value })}
            onchange={() => commit(rows)}
          />
          <input
            class="sx-input"
            aria-label="Attribute {i + 1} value"
            placeholder="value"
            spellcheck="false"
            value={row.value}
            oninput={(e) => update(i, { value: e.currentTarget.value })}
            onchange={() => commit(rows)}
          />
          <IconButton
            label="Remove attribute {row.name || i + 1}"
            icon={XIcon}
            size="sm"
            iconSize={12}
            tone="danger"
            onclick={() => commit(rows.filter((_, idx) => idx !== i))}
          />
        </li>
        {#if errors[i]}<InlineMessage message={errors[i]} />{/if}
      {/each}
    </ul>
  {/if}
  <button
    type="button"
    class="sx-btn sx-btn--sm sx-btn--ghost attrs__add"
    disabled={rows.length >= MAX_ROWS}
    onclick={() => (local = { sig: storedSig, rows: [...rows, { id: newId(), name: '', value: '' }] })}
  >
    <PlusIcon size={13} weight="bold" /> Add attribute
  </button>
</div>

<style>
  .attrs {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .attrs__head,
  .attrs__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 24px;
    gap: 4px;
    align-items: center;
  }
  .attrs__head {
    font-size: var(--sx-text-xs);
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--sx-text-3);
  }
  .attrs__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .attrs__add {
    align-self: flex-start;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
</style>
