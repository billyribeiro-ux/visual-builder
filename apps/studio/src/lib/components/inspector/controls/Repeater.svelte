<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import { SvelteSet } from 'svelte/reactivity';
  import DotsSixVerticalIcon from 'phosphor-svelte/lib/DotsSixVerticalIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import CopySimpleIcon from 'phosphor-svelte/lib/CopySimpleIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import IconButton from '../../../ui/IconButton.svelte';
  import PropField from './PropField.svelte';
  import SvgIcon from './SvgIcon.svelte';
  import { startListDrag, reorder } from './list-drag.js';
  import { describeItemFields, itemTitle, newListItem, singularize, type PropSpec } from '../lib/prop-schema.js';
  import { resolveIcon } from '../lib/icon-set.js';

  interface Props {
    items: readonly unknown[];
    spec: PropSpec;
    onchange: (next: unknown[]) => void;
    /** Column labels for matrix (array-of-arrays) items, e.g. a data table's `columns` prop. */
    columns?: readonly string[];
    depth?: number;
  }

  let { items, spec, onchange, columns, depth = 0 }: Props = $props();

  const uid = $props.id();
  const noun = $derived(singularize(spec.label) || 'item');

  /**
   * Array items carry no ids, and every edit produces new objects (the reducer deep-clones), so
   * identity can't be used as a key. A parallel key array is maintained by every local
   * operation; lengths changed elsewhere (undo, canvas edits) fall back to positional keys.
   */
  let keyStore = $state<string[]>([]);
  const keys = $derived(items.map((_, i) => keyStore[i] ?? `p${i}`));
  let seq = 0;
  const newKey = () => `r${++seq}-${Math.random().toString(36).slice(2, 7)}`;

  const open = new SvelteSet<string>();
  let dragFrom = $state<number | null>(null);
  let dropAt = $state<number | null>(null);
  let listEl: HTMLElement | null = null;

  const plain = <T,>(v: T): T => structuredClone($state.snapshot(v)) as T;

  function commit(next: unknown[], nextKeys: string[]) {
    keyStore = nextKeys;
    onchange(plain(next));
  }

  function add() {
    const k = newKey();
    open.add(k);
    commit([...items, newListItem(spec, items, columns?.length)], [...keys, k]);
  }

  function duplicate(i: number) {
    const k = newKey();
    open.add(k);
    const next = [...items];
    next.splice(i + 1, 0, plain(items[i]));
    const nk = [...keys];
    nk.splice(i + 1, 0, k);
    commit(next, nk);
  }

  function remove(i: number) {
    open.delete(keys[i]);
    commit(
      items.filter((_, idx) => idx !== i),
      keys.filter((_, idx) => idx !== i)
    );
  }

  function move(from: number, insertAt: number) {
    commit(reorder(items, from, insertAt), reorder(keys, from, insertAt));
  }

  function updateItem(i: number, nextItem: unknown) {
    commit(
      items.map((it, idx) => (idx === i ? nextItem : it)),
      keys
    );
  }

  function toggle(key: string) {
    if (open.has(key)) open.delete(key);
    else open.add(key);
  }

  const bindList: Attachment<HTMLElement> = (el) => {
    listEl = el;
    return () => {
      listEl = null;
    };
  };

  function cellLabel(ci: number): string {
    return columns?.[ci]?.trim() || `Column ${ci + 1}`;
  }
</script>

<div class={['rep', depth > 0 && 'rep--nested']}>
  {#if items.length > 0}
    <ul class="rep__list" {@attach bindList}>
      {#each items as item, i (keys[i])}
        {@const key = keys[i]}
        {@const isOpen = open.has(key)}
        {@const title = itemTitle(item)}
        {@const icon = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>).icon : undefined}
        <li
          class={[
            'rep__item',
            isOpen && 'rep__item--open',
            dragFrom === i && 'rep__item--dragging',
            dropAt === i && dragFrom !== null && dropAt !== dragFrom && dropAt !== dragFrom + 1 && 'rep__item--drop-before',
            i === items.length - 1 && dropAt === items.length && dragFrom !== null && dragFrom !== i && 'rep__item--drop-after'
          ]}
          data-rep-item
        >
          <div class="rep__head">
            <button
              type="button"
              class="rep__grip"
              aria-label="Reorder {noun} {i + 1}. Drag, or use the arrow keys."
              onpointerdown={(e) =>
                startListDrag(e, listEl, ':scope > [data-rep-item]', i, {
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
            <button
              type="button"
              class="rep__toggle"
              aria-expanded={isOpen}
              aria-controls="{uid}-{key}"
              onclick={() => toggle(key)}
            >
              <span class="rep__caret"><CaretRightIcon size={10} weight="bold" /></span>
              {#if typeof icon === 'string' && resolveIcon(icon)}
                <span class="rep__icon"><SvgIcon name={icon} size={14} /></span>
              {/if}
              <span class={['rep__title', !title && 'rep__title--empty']}>{title || `${noun.charAt(0).toUpperCase()}${noun.slice(1)} ${i + 1}`}</span>
            </button>
            <div class="rep__actions">
              <IconButton label="Duplicate {noun} {i + 1}" icon={CopySimpleIcon} size="sm" iconSize={13} onclick={() => duplicate(i)} />
              <IconButton label="Delete {noun} {i + 1}" icon={TrashIcon} size="sm" iconSize={13} tone="danger" onclick={() => remove(i)} />
            </div>
          </div>
          {#if isOpen}
            <div class="rep__body" id="{uid}-{key}">
              {#if Array.isArray(item)}
                {#each item as cell, ci (ci)}
                  <!-- Cells are positional by definition (column index), so index keys are correct here. -->
                  <label class="rep__cell">
                    <span class="sx-label">{cellLabel(ci)}</span>
                    <input
                      class="sx-input"
                      value={String(cell ?? '')}
                      oninput={(e) => {
                        const nextRow = [...item];
                        nextRow[ci] = e.currentTarget.value;
                        updateItem(i, nextRow);
                      }}
                    />
                  </label>
                {/each}
              {:else if item && typeof item === 'object'}
                {#each describeItemFields(spec.itemSchema, item) as field (field.key)}
                  <PropField
                    spec={field}
                    value={(item as Record<string, unknown>)[field.key]}
                    depth={depth + 1}
                    onchange={(v) => updateItem(i, { ...plain(item as Record<string, unknown>), [field.key]: v })}
                  />
                {/each}
              {:else}
                <input
                  class="sx-input"
                  aria-label="{noun} {i + 1}"
                  value={String(item ?? '')}
                  oninput={(e) => updateItem(i, e.currentTarget.value)}
                />
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="rep__empty">No {spec.label.toLowerCase()} yet.</p>
  {/if}
  <button type="button" class="sx-btn sx-btn--sm rep__add" onclick={add}>
    <PlusIcon size={13} weight="bold" /> Add {noun}
  </button>
</div>

<style>
  .rep {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
  .rep__list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .rep__item {
    position: relative;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease);
  }
  .rep__item:hover {
    border-color: var(--sx-border-strong);
  }
  .rep__item--open {
    border-color: var(--sx-border-strong);
    box-shadow: var(--sx-shadow-sm);
  }
  .rep__item--dragging {
    opacity: 0.45;
  }
  .rep__item--drop-before::before,
  .rep__item--drop-after::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    border-radius: 2px;
    background: var(--sx-accent);
  }
  .rep__item--drop-before::before {
    top: -4px;
  }
  .rep__item--drop-after::after {
    bottom: -4px;
  }
  .rep__head {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 32px;
    padding: 0 4px 0 2px;
  }
  .rep__grip {
    display: grid;
    place-items: center;
    width: 18px;
    height: 24px;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-3);
    cursor: grab;
    touch-action: none;
    flex-shrink: 0;
  }
  .rep__grip:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .rep__toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    height: 28px;
    padding: 0 4px;
    border-radius: var(--sx-radius-xs);
    text-align: left;
  }
  .rep__caret {
    display: grid;
    place-items: center;
    width: 12px;
    color: var(--sx-text-3);
    transition: transform var(--sx-dur) var(--sx-ease);
    flex-shrink: 0;
  }
  .rep__item--open > .rep__head .rep__caret {
    transform: rotate(90deg);
  }
  .rep__icon {
    display: grid;
    place-items: center;
    color: var(--sx-text-2);
    flex-shrink: 0;
  }
  .rep__title {
    font-size: var(--sx-text-md);
    font-weight: 500;
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .rep__title--empty {
    color: var(--sx-text-3);
  }
  .rep__actions {
    display: flex;
    gap: 0;
    opacity: 0;
    transition: opacity var(--sx-dur) var(--sx-ease);
  }
  .rep__item:hover > .rep__head .rep__actions,
  .rep__head:focus-within .rep__actions,
  .rep__item--open > .rep__head .rep__actions {
    opacity: 1;
  }
  .rep__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 4px 10px 12px 12px;
    border-top: 1px solid var(--sx-border);
    padding-top: 10px;
  }
  .rep__cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .rep--nested .rep__item {
    background: var(--sx-subtle);
  }
  .rep__empty {
    padding: 10px;
    border: 1px dashed var(--sx-border-strong);
    border-radius: var(--sx-radius-md);
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    text-align: center;
  }
  .rep__add {
    align-self: stretch;
  }
</style>
