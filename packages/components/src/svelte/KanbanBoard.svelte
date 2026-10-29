<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'violet';

  interface KanbanCard {
    title: string;
    tag?: string;
    assignee?: string;
    /** YYYY-MM-DD */
    due?: string;
  }

  interface KanbanColumn {
    title: string;
    tone?: Tone;
    cards: KanbanCard[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    columns?: KanbanColumn[];
    class?: string;
  }

  let { columns = [], class: className = '', ...rest }: Props = $props();

  interface BoardCard extends KanbanCard {
    id: string;
    /** Prop path of the source item, so inline editing targets the original data after a move. */
    path: string;
  }
  interface BoardColumn {
    title: string;
    tone: Tone;
    cards: BoardCard[];
  }

  const uid = $props.id();
  const TONES: readonly Tone[] = ['primary', 'success', 'warning', 'danger', 'neutral', 'violet'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function initBoard(source: KanbanColumn[]): BoardColumn[] {
    return (Array.isArray(source) ? source : []).map((col, ci) => ({
      title: col?.title ?? '',
      tone: TONES.includes(col?.tone as Tone) ? (col.tone as Tone) : 'neutral',
      cards: (Array.isArray(col?.cards) ? col.cards : []).map((card, k) => ({ ...card, id: `c${ci}-${k}`, path: `columns.${ci}.cards.${k}` }))
    }));
  }

  /** Local board state: initialised from props, re-initialised whenever `columns` changes. */
  let board = $derived(initBoard(columns));

  /** Element refs used only inside pointer handlers (not reactive). */
  let root: HTMLElement | undefined;
  let scroller: HTMLElement | undefined;

  function trackRoot(node: HTMLElement) {
    root = node;
    return () => (root = undefined);
  }

  function trackScroller(node: HTMLElement) {
    scroller = node;
    return () => (scroller = undefined);
  }
  let announcement = $state('');

  /* ------------------------------------------------------------------ helpers */

  function locateCard(state: BoardColumn[], id: string): { col: number; index: number } | null {
    for (let col = 0; col < state.length; col++) {
      const index = state[col].cards.findIndex((c) => c.id === id);
      if (index !== -1) return { col, index };
    }
    return null;
  }

  function moveCard(state: BoardColumn[], id: string, toCol: number, toIndex: number): BoardColumn[] {
    const from = locateCard(state, id);
    if (!from || toCol < 0 || toCol >= state.length) return state;
    const card = state[from.col].cards[from.index];
    const next = state.map((col) => ({ ...col, cards: col.cards.filter((c) => c.id !== id) }));
    const target = next[toCol].cards;
    target.splice(Math.max(0, Math.min(toIndex, target.length)), 0, card);
    return next;
  }

  function position(state: BoardColumn[], id: string): string {
    const at = locateCard(state, id);
    if (!at) return '';
    const col = state[at.col];
    return `${col.title || `Column ${at.col + 1}`}, position ${at.index + 1} of ${col.cards.length}`;
  }

  function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  function formatDue(value: string | undefined): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
    if (!match) return '';
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (month < 0 || month > 11 || day < 1 || day > 31) return '';
    return `${MONTHS[month]} ${day}`;
  }

  async function focusCard(id: string) {
    await tick();
    document.getElementById(`${uid}-${id}`)?.focus();
  }

  /* ------------------------------------------------------------------ keyboard */

  let grabbed = $state<{ id: string; snapshot: BoardColumn[] } | null>(null);

  function handleCardKeydown(event: KeyboardEvent, card: BoardCard) {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (!grabbed) {
        grabbed = { id: card.id, snapshot: board };
        announcement = `Picked up ${card.title}. ${position(board, card.id)}. Use the arrow keys to move, Space to drop, Escape to cancel.`;
      } else if (grabbed.id === card.id) {
        announcement = `Dropped ${card.title}. ${position(board, card.id)}.`;
        grabbed = null;
      }
      return;
    }
    if (!grabbed || grabbed.id !== card.id) return;
    if (event.key === 'Escape' || event.key === 'Tab') {
      if (event.key === 'Escape') event.preventDefault();
      board = grabbed.snapshot;
      grabbed = null;
      announcement = `Move cancelled. ${card.title} returned to ${position(board, card.id)}.`;
      if (event.key === 'Escape') focusCard(card.id);
      return;
    }
    const at = locateCard(board, card.id);
    if (!at) return;
    let toCol = at.col;
    let toIndex = at.index;
    if (event.key === 'ArrowLeft') toCol = Math.max(0, at.col - 1);
    else if (event.key === 'ArrowRight') toCol = Math.min(board.length - 1, at.col + 1);
    else if (event.key === 'ArrowUp') toIndex = Math.max(0, at.index - 1);
    else if (event.key === 'ArrowDown') toIndex = Math.min(board[at.col].cards.length - 1, at.index + 1);
    else return;
    event.preventDefault();
    if (toCol !== at.col) toIndex = Math.min(at.index, board[toCol].cards.length);
    if (toCol === at.col && toIndex === at.index) return;
    board = moveCard(board, card.id, toCol, toIndex);
    announcement = `${card.title} moved to ${position(board, card.id)}.`;
    focusCard(card.id);
  }

  /* ------------------------------------------------------------------ pointer drag */

  let drag = $state<{ id: string; dx: number; dy: number; overCol: number | null; overIndex: number; fromCol: number; fromIndex: number } | null>(null);
  let stopDrag: (() => void) | null = null;

  onDestroy(() => stopDrag?.());

  /** Column + insertion index (among the other cards) under the pointer. */
  function dropTarget(x: number, y: number, id: string): { col: number; index: number } | null {
    const colEl = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-kanban-col]');
    if (!colEl || !root?.contains(colEl)) return null;
    const col = Number(colEl.dataset.kanbanCol);
    let index = 0;
    for (const cardEl of colEl.querySelectorAll<HTMLElement>('[data-kanban-card]')) {
      if (cardEl.dataset.kanbanCard === id) continue;
      const rect = cardEl.getBoundingClientRect();
      if (y > rect.top + rect.height / 2) index += 1;
    }
    return { col, index };
  }

  function handlePointerDown(event: PointerEvent, card: BoardCard) {
    if (event.button !== 0 || grabbed) return;
    const target = event.target as Element;
    // Touch drags start from the grip only, so swiping a card still scrolls the board.
    if (event.pointerType === 'touch' && !target.closest('.grip')) return;
    const at = locateCard(board, card.id);
    if (!at) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let started = false;

    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!started) {
        if (Math.hypot(dx, dy) < 5) return;
        started = true;
      }
      ev.preventDefault();
      if (scroller) {
        const r = scroller.getBoundingClientRect();
        if (ev.clientX < r.left + 48) scroller.scrollLeft -= 14;
        else if (ev.clientX > r.right - 48) scroller.scrollLeft += 14;
      }
      const over = dropTarget(ev.clientX, ev.clientY, card.id);
      drag = { id: card.id, dx, dy, overCol: over?.col ?? null, overIndex: over?.index ?? 0, fromCol: at.col, fromIndex: at.index };
    };
    const finish = (commit: boolean) => {
      stopDrag?.();
      const current = drag;
      drag = null;
      if (!commit || !started || !current || current.overCol === null) return;
      if (current.overCol === current.fromCol && current.overIndex === current.fromIndex) return;
      board = moveCard(board, card.id, current.overCol, current.overIndex);
      announcement = `${card.title} moved to ${position(board, card.id)}.`;
    };
    const up = () => finish(true);
    const cancel = () => finish(false);
    const key = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') finish(false);
    };
    stopDrag?.();
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('keydown', key);
    stopDrag = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('keydown', key);
      stopDrag = null;
    };
  }

  /** Index (excluding the dragged card) at which the drop placeholder renders in a column, or -1. */
  function placeholderAt(colIndex: number): number {
    if (!drag || drag.overCol !== colIndex) return -1;
    if (drag.overCol === drag.fromCol && drag.overIndex === drag.fromIndex) return -1;
    return drag.overIndex;
  }
</script>

<div {...rest} class={['kanban', className]} {@attach trackRoot}>
  <p id="{uid}-instructions" class="sr-only">
    Press Space or Enter to pick up a card. While a card is picked up, use the arrow keys to move it between columns and positions, Space or Enter to drop it, and Escape to cancel.
  </p>
  <div class="sr-only" aria-live="assertive" aria-atomic="true">{announcement}</div>

  <div class="board" {@attach trackScroller}>
    {#each board as column, ci (ci)}
      {@const slot = placeholderAt(ci)}
      {@const draggedHere = drag && drag.fromCol === ci ? 1 : 0}
      <section class={['column', drag?.overCol === ci && 'is-over']} data-kanban-col={ci} aria-labelledby="{uid}-col-{ci}">
        <header class="column-header">
          <span class={['dot', `tone-${column.tone}`]} aria-hidden="true"></span>
          <h3 class="column-title" id="{uid}-col-{ci}" data-prop={`columns.${ci}.title`}>{column.title}</h3>
          <span class="count" aria-label="{column.cards.length} cards">{column.cards.length}</span>
        </header>

        <ul class="cards">
          {#each column.cards as card, k (card.id)}
            {@const visibleIndex = drag && drag.fromCol === ci && k > drag.fromIndex ? k - 1 : k}
            {#if slot === visibleIndex && card.id !== drag?.id}
              <li class="placeholder" aria-hidden="true"></li>
            {/if}
            <li class="card-slot" data-kanban-card={card.id}>
              <div
                id="{uid}-{card.id}"
                class={['card', drag?.id === card.id && 'is-dragging', grabbed?.id === card.id && 'is-grabbed']}
                style:transform={drag?.id === card.id ? `translate(${drag.dx}px, ${drag.dy}px) rotate(1.5deg)` : undefined}
                role="button"
                tabindex="0"
                aria-roledescription="draggable card"
                aria-describedby="{uid}-instructions"
                aria-pressed={grabbed?.id === card.id}
                onpointerdown={(event) => handlePointerDown(event, card)}
                onkeydown={(event) => handleCardKeydown(event, card)}
              >
                <div class="card-top">
                  {#if card.tag}
                    <span class="tag" data-prop={`${card.path}.tag`}>{card.tag}</span>
                  {/if}
                  <span class="grip" aria-hidden="true"><span class="grip-dots"></span></span>
                </div>
                <p class="card-title" data-prop={`${card.path}.title`}>{card.title}</p>
                {#if formatDue(card.due) || card.assignee}
                  <div class="card-meta">
                    {#if formatDue(card.due)}
                      <span class="due">
                        <Icon name="CalendarBlank" size={14} />
                        <time datetime={card.due}>{formatDue(card.due)}</time>
                      </span>
                    {/if}
                    {#if card.assignee}
                      <span class="assignee" title={card.assignee}>
                        <span class="sr-only">Assigned to</span>
                        <span class="assignee-avatar" aria-hidden="true">{initials(card.assignee)}</span>
                        <span class="sr-only">{card.assignee}</span>
                      </span>
                    {/if}
                  </div>
                {/if}
              </div>
            </li>
          {/each}
          {#if slot !== -1 && slot >= column.cards.length - draggedHere}
            <li class="placeholder" aria-hidden="true"></li>
          {/if}
          {#if column.cards.length === 0 && slot === -1}
            <li class="empty">No cards</li>
          {/if}
        </ul>
      </section>
    {/each}
  </div>
</div>

<style>
  .kanban {
    --kanban-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    position: relative;
    min-width: 0;
    color: var(--md-sys-color-on-surface);
  }
  .board {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(16.5rem, 1fr);
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scroll-snap-type: x proximity;
    overscroll-behavior-x: contain;
  }
  .column {
    display: flex;
    flex-direction: column;
    min-width: 0;
    padding: 0.75rem;
    border: 1px solid var(--kanban-border);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-low);
    scroll-snap-align: start;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease, border-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .column.is-over {
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 45%, transparent);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 5%, var(--md-sys-color-surface-container-low));
  }
  .column-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.125rem 0.25rem 0.75rem;
  }
  .dot {
    flex-shrink: 0;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
  }
  .tone-primary { background-color: var(--md-sys-color-primary); }
  .tone-success { background-color: var(--md-sys-color-success); }
  .tone-warning { background-color: var(--md-sys-color-warning, #B26A00); }
  .tone-danger { background-color: var(--md-sys-color-error); }
  .tone-neutral { background-color: var(--md-sys-color-outline); }
  .tone-violet { background-color: var(--md-sys-color-violet, #6E56CF); }
  .column-title {
    flex: 1;
    min-width: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .count {
    min-width: 1.5rem;
    padding: 0 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.25rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-height: 4rem;
    list-style: none;
  }
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0.75rem 0.75rem 0.875rem;
    border: 1px solid var(--kanban-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    transition: box-shadow var(--md-sys-motion-duration-short, 150ms) ease, border-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .card:hover {
    border-color: var(--md-sys-color-outline-variant);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  .card:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
  .card.is-dragging {
    z-index: 5;
    cursor: grabbing;
    pointer-events: none;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.08);
    transition: none;
  }
  .card.is-grabbed {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 1px var(--md-sys-color-primary), 0 8px 24px rgba(0, 0, 0, 0.12);
  }
  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 1.25rem;
  }
  .tag {
    padding: 0 0.5rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.25rem;
    letter-spacing: 0.01em;
  }
  .grip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    margin: -0.25rem -0.375rem -0.25rem auto;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    color: var(--md-sys-color-outline);
    opacity: 0;
    touch-action: none;
    transition: opacity var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .grip-dots {
    width: 0.625rem;
    height: 1rem;
    background-image: radial-gradient(circle, currentColor 1.25px, transparent 1.75px);
    background-size: 5px 5.33px;
  }
  .card:hover .grip,
  .card:focus-visible .grip,
  .card.is-grabbed .grip {
    opacity: 1;
  }
  @media (hover: none) {
    .grip {
      opacity: 1;
      width: 2.5rem;
      height: 2.5rem;
      margin: -0.625rem -0.625rem -0.625rem auto;
    }
  }
  .card-title {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }
  .card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.75rem;
  }
  .due {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-variant-numeric: tabular-nums;
  }
  .assignee {
    margin-left: auto;
  }
  .assignee-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    font-size: 0.625rem;
    font-weight: 650;
  }
  .placeholder {
    flex-shrink: 0;
    height: 4.5rem;
    border: 1.5px dashed color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent);
  }
  .empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 4.5rem;
    border: 1.5px dashed var(--kanban-border);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.8125rem;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  @media (max-width: 767px) {
    .board {
      grid-auto-columns: 85%;
      scroll-snap-type: x mandatory;
    }
  }
</style>
