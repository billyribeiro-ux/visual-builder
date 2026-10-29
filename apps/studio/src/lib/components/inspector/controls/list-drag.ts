/**
 * Pointer-driven vertical reordering shared by the repeater and the string list.
 * The handle captures the pointer; rows are measured once at drag start, so the computed drop
 * index is stable while the list re-renders its indicator.
 */
export interface ListDragCallbacks {
  /** Called while dragging with the insertion index (0…n) the pointer is over. */
  onhover: (insertAt: number) => void;
  /** Called on release when the pointer actually moved. */
  ondrop: (from: number, insertAt: number) => void;
  /** Called on release / cancel regardless of movement. */
  onend: () => void;
}

export function startListDrag(
  event: PointerEvent,
  list: HTMLElement | null,
  rowSelector: string,
  from: number,
  callbacks: ListDragCallbacks
): void {
  if (event.button !== 0 || !list) return;
  const handle = event.currentTarget as HTMLElement;
  const rects = Array.from(list.querySelectorAll<HTMLElement>(rowSelector)).map((r) => r.getBoundingClientRect());
  const startY = event.clientY;
  const pointerId = event.pointerId;
  let moved = false;
  let insertAt = from;

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    if (!moved && Math.abs(e.clientY - startY) < 4) return;
    moved = true;
    insertAt = rects.length;
    for (let i = 0; i < rects.length; i++) {
      if (e.clientY < rects[i].top + rects[i].height / 2) {
        insertAt = i;
        break;
      }
    }
    callbacks.onhover(insertAt);
  };
  const finish = (e: PointerEvent) => {
    if (e.pointerId !== pointerId) return;
    handle.releasePointerCapture(pointerId);
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', finish);
    handle.removeEventListener('pointercancel', finish);
    document.body.style.cursor = '';
    if (moved && e.type === 'pointerup') callbacks.ondrop(from, insertAt);
    callbacks.onend();
  };

  event.preventDefault();
  handle.setPointerCapture(pointerId);
  document.body.style.cursor = 'grabbing';
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', finish);
  handle.addEventListener('pointercancel', finish);
}

/** Moves `items[from]` so it lands before the element that was at `insertAt`. */
export function reorder<T>(items: readonly T[], from: number, insertAt: number): T[] {
  const to = insertAt > from ? insertAt - 1 : insertAt;
  const next = [...items];
  if (to === from || to < 0 || to >= next.length) return next;
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
