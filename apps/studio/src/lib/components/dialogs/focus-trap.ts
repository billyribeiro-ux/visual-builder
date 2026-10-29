import type { Attachment } from 'svelte/attachments';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]'
].join(',');

/** Visible, focusable descendants of `root` in DOM order. */
export function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest('[inert]') && el.getClientRects().length > 0
  );
}

export interface FocusScopeOptions {
  /** CSS selector of the element to focus first; falls back to `[data-autofocus]`, then the first focusable. */
  initial?: string;
  /** Restore focus to the previously focused element when the scope is removed (default true). */
  restore?: boolean;
}

/**
 * Moves focus into the element on mount and restores it to the previously focused element on
 * removal. Pair with `trapTab` on the same element's keydown handler to keep Tab inside.
 */
export function focusScope(options: FocusScopeOptions = {}): Attachment<HTMLElement> {
  return (node) => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusInitial = () => {
      if (node.contains(document.activeElement)) return;
      const target =
        (options.initial ? node.querySelector<HTMLElement>(options.initial) : null) ??
        node.querySelector<HTMLElement>('[data-autofocus]') ??
        focusableWithin(node)[0] ??
        node;
      target.focus({ preventScroll: true });
    };
    // Focus now so an immediate keypress lands inside; retry next frame in case a closing
    // surface restored focus elsewhere during the same update.
    focusInitial();
    const frame = requestAnimationFrame(focusInitial);
    return () => {
      cancelAnimationFrame(frame);
      if (options.restore === false || !previous?.isConnected) return;
      const active = document.activeElement;
      // Never pull focus back out of a surface that has since taken it (e.g. a follow-up dialog).
      if (!active || active === document.body || node.contains(active)) previous.focus({ preventScroll: true });
    };
  };
}

/** Keeps Tab / Shift+Tab cycling inside `root`. Call from the container's keydown handler. */
export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
  if (event.key !== 'Tab') return;
  const items = focusableWithin(root);
  if (items.length === 0) {
    event.preventDefault();
    root.focus();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !root.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !root.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}
