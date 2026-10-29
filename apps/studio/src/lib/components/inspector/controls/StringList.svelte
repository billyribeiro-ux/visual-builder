<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import DotsSixVerticalIcon from 'phosphor-svelte/lib/DotsSixVerticalIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import IconButton from '../../../ui/IconButton.svelte';
  import { startListDrag, reorder } from './list-drag.js';

  interface Props {
    items: readonly string[];
    onchange: (next: string[]) => void;
    /** Singular noun for labels, e.g. "feature". */
    noun?: string;
  }

  let { items, onchange, noun = 'item' }: Props = $props();

  /**
   * Strings have no identity, so the list keeps a parallel array of stable keys updated by
   * every local operation (focus survives typing, reordering moves the right row). Lengths
   * changed elsewhere (undo, canvas edits) fall back to deterministic positional keys.
   */
  let keyStore = $state<string[]>([]);
  const keys = $derived(items.map((_, i) => keyStore[i] ?? `p${i}`));
  let seq = 0;
  const newKey = () => `s${++seq}-${Math.random().toString(36).slice(2, 7)}`;

  let listEl: HTMLElement | null = null;
  let dragFrom = $state<number | null>(null);
  let dropAt = $state<number | null>(null);
  /** Key of a freshly inserted row that should receive focus once it mounts. */
  let focusKey: string | null = null;

  function commit(next: string[], nextKeys: string[]) {
    keyStore = nextKeys;
    onchange(next);
  }

  function insertAfter(i: number) {
    const k = newKey();
    focusKey = k;
    const next = [...items];
    next.splice(i + 1, 0, '');
    const nk = [...keys];
    nk.splice(i + 1, 0, k);
    commit(next, nk);
  }

  function remove(i: number) {
    commit(
      items.filter((_, idx) => idx !== i),
      keys.filter((_, idx) => idx !== i)
    );
  }

  function move(from: number, insertAt: number) {
    commit(reorder(items, from, insertAt), reorder(keys, from, insertAt));
  }

  const focusIfNew =
    (key: string): Attachment<HTMLInputElement> =>
    (el) => {
      if (key === focusKey) {
        focusKey = null;
        el.focus();
      }
    };

  const bindList: Attachment<HTMLElement> = (el) => {
    listEl = el;
    return () => {
      listEl = null;
    };
  };
</script>

<div class="sl">
  {#if items.length > 0}
    <ul class="sl__list" {@attach bindList}>
      {#each items as item, i (keys[i])}
        <li
          class={[
            'sl__row',
            dragFrom === i && 'sl__row--dragging',
            dropAt === i && dragFrom !== null && dropAt !== dragFrom && dropAt !== dragFrom + 1 && 'sl__row--drop-before',
            i === items.length - 1 && dropAt === items.length && dragFrom !== null && dragFrom !== i && 'sl__row--drop-after'
          ]}
          data-sl-row
        >
          <button
            type="button"
            class="sl__grip"
            aria-label="Reorder {noun} {i + 1}. Drag, or use the arrow keys."
            onpointerdown={(e) =>
              startListDrag(e, listEl, ':scope > [data-sl-row]', i, {
                onhover: (at) => {
                  dragFrom = i;
                  dropAt = at;
                },
                ondrop: move,
                onend: () => {
                  dragFrom = null;
                  dropAt = null;
                }
              })}
            onkeydown={(e) => {
              if (e.key === 'ArrowUp' && i > 0) {
                e.preventDefault();
                move(i, i - 1);
              } else if (e.key === 'ArrowDown' && i < items.length - 1) {
                e.preventDefault();
                move(i, i + 2);
              }
            }}
          >
            <DotsSixVerticalIcon size={14} weight="bold" />
          </button>
          <input
            class="sx-input"
            aria-label="{noun} {i + 1}"
            value={item}
            {@attach focusIfNew(keys[i])}
            oninput={(e) => {
              const next = [...items];
              next[i] = e.currentTarget.value;
              keyStore = keys;
              onchange(next);
            }}
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                insertAfter(i);
              }
            }}
          />
          <IconButton label="Remove {noun} {i + 1}" icon={XIcon} size="sm" iconSize={12} tone="danger" onclick={() => remove(i)} />
        </li>
      {/each}
    </ul>
  {/if}
  <button type="button" class="sx-btn sx-btn--sm sx-btn--ghost sl__add" onclick={() => insertAfter(items.length - 1)}>
    <PlusIcon size={13} weight="bold" /> Add {noun}
  </button>
</div>

<style>
  .sl {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .sl__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .sl__row {
    position: relative;
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) 24px;
    align-items: center;
    gap: 4px;
  }
  .sl__row--dragging {
    opacity: 0.45;
  }
  .sl__row--drop-before::before,
  .sl__row--drop-after::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    border-radius: 2px;
    background: var(--sx-accent);
  }
  .sl__row--drop-before::before {
    top: -3px;
  }
  .sl__row--drop-after::after {
    bottom: -3px;
  }
  .sl__grip {
    display: grid;
    place-items: center;
    height: 24px;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-3);
    cursor: grab;
    touch-action: none;
  }
  .sl__grip:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .sl__add {
    align-self: flex-start;
    margin-left: 14px;
  }
</style>
