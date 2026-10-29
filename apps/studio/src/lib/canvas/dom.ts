/**
 * DOM helpers for the canvas editor overlay. The canvas renders NO wrapper elements: every node
 * is identified by the `data-node-id` attribute its canonical component spreads onto its root.
 */
import type { DropPosition } from './messages.js';

/** Editor chrome (overlay, menus, add-section zone, empty-container placeholders). */
export const EDITOR_CHROME_SELECTOR = '[data-canvas-ui]';

export function isEditorChrome(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(EDITOR_CHROME_SELECTOR) !== null;
}

/** Element rendered for a node id inside the site root (never editor chrome). */
export function findNodeElement(nodeId: string, root: ParentNode = document): HTMLElement | null {
  const el = root.querySelector(`[data-node-id="${CSS.escape(nodeId)}"]`);
  return el instanceof HTMLElement && !el.closest(EDITOR_CHROME_SELECTOR) ? el : null;
}

/**
 * Nearest node element (innermost first) containing the event target. Empty-container
 * placeholders carry no node id, so they resolve to their container.
 */
export function closestNodeElement(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  const el = target.closest('[data-node-id]');
  return el instanceof HTMLElement ? el : null;
}

/**
 * Drop position from the pointer's vertical position over a node: containers accept `inside`
 * in the middle 50% band; otherwise the upper half means `before` and the lower half `after`.
 */
export function computeDropPosition(
  rect: { top: number; height: number },
  clientY: number,
  isContainer: boolean
): DropPosition {
  const ratio = rect.height > 0 ? (clientY - rect.top) / rect.height : 0.5;
  if (isContainer && ratio >= 0.25 && ratio <= 0.75) return 'inside';
  return ratio < 0.5 ? 'before' : 'after';
}

/** Prop paths whose text is multi-line: Enter inserts a newline and Cmd/Ctrl+Enter commits. */
export function isMultilinePropPath(path: string): boolean {
  const last = path.split('.').filter((segment) => !/^\d+$/.test(segment)).pop() ?? path;
  return /(description|subtitle|body|content|answer|quote|message|tagline|code|bio|excerpt|summary)$/i.test(last);
}

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Viewport box of an element, or null when it is not rendered (display: none / zero size). */
export function measureBox(el: Element | null): Box | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function sameBox(a: Box | null, b: Box | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}
