import type { Attachment } from 'svelte/attachments';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipOptions {
  /** Keyboard shortcut rendered after the label, e.g. "⌘Z". */
  kbd?: string;
  placement?: TooltipPlacement;
}

const SHOW_DELAY_MS = 380;
const GAP = 8;

let tipEl: HTMLDivElement | null = null;
let owner: HTMLElement | null = null;
let showTimer: ReturnType<typeof setTimeout> | null = null;
/** After one tooltip has shown, neighbours show instantly (like native toolbars). */
let warmUntil = 0;

function ensureTip(): HTMLDivElement {
  if (tipEl && tipEl.isConnected) return tipEl;
  tipEl = document.createElement('div');
  tipEl.className = 'sx-tooltip';
  tipEl.setAttribute('role', 'tooltip');
  tipEl.id = 'sx-tooltip';
  document.body.appendChild(tipEl);
  return tipEl;
}

function position(el: HTMLElement, tip: HTMLDivElement, placement: TooltipPlacement) {
  const r = el.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let p = placement;
  if (p === 'bottom' && r.bottom + GAP + t.height > vh) p = 'top';
  if (p === 'top' && r.top - GAP - t.height < 0) p = 'bottom';
  if (p === 'right' && r.right + GAP + t.width > vw) p = 'left';
  if (p === 'left' && r.left - GAP - t.width < 0) p = 'right';

  let x: number;
  let y: number;
  if (p === 'top' || p === 'bottom') {
    x = r.left + r.width / 2 - t.width / 2;
    y = p === 'top' ? r.top - GAP - t.height : r.bottom + GAP;
  } else {
    y = r.top + r.height / 2 - t.height / 2;
    x = p === 'left' ? r.left - GAP - t.width : r.right + GAP;
  }
  x = Math.max(6, Math.min(x, vw - t.width - 6));
  y = Math.max(6, Math.min(y, vh - t.height - 6));
  tip.style.left = `${Math.round(x)}px`;
  tip.style.top = `${Math.round(y)}px`;
}

function hideTip(from?: HTMLElement) {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (from && owner !== from) return;
  if (tipEl) tipEl.dataset.show = 'false';
  if (owner) {
    owner.removeAttribute('aria-describedby');
    warmUntil = Date.now() + 300;
  }
  owner = null;
}

/**
 * Accessible hover/focus tooltip. One shared element for the whole studio.
 * The trigger must still carry its own `aria-label`; the tooltip is supplementary.
 */
export function tooltip(label: string | null | undefined, options: TooltipOptions = {}): Attachment<HTMLElement> {
  return (el) => {
    if (!label) return;
    const placement = options.placement ?? 'bottom';

    const show = () => {
      const tip = ensureTip();
      tip.replaceChildren();
      tip.append(document.createTextNode(label));
      if (options.kbd) {
        const k = document.createElement('span');
        k.className = 'sx-tooltip__kbd';
        k.textContent = options.kbd;
        tip.append(k);
      }
      owner = el;
      el.setAttribute('aria-describedby', tip.id);
      tip.dataset.show = 'false';
      position(el, tip, placement);
      requestAnimationFrame(() => {
        if (owner === el) tip.dataset.show = 'true';
      });
    };

    const schedule = () => {
      if (showTimer) clearTimeout(showTimer);
      const delay = Date.now() < warmUntil ? 0 : SHOW_DELAY_MS;
      showTimer = setTimeout(show, delay);
    };

    const onEnter = () => schedule();
    const onLeave = () => hideTip(el);
    const onFocus = (e: FocusEvent) => {
      if ((e.target as HTMLElement).matches(':focus-visible')) schedule();
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointerdown', onLeave);
    el.addEventListener('focus', onFocus);
    el.addEventListener('blur', onLeave);

    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onLeave);
      el.removeEventListener('focus', onFocus);
      el.removeEventListener('blur', onLeave);
      if (owner === el) hideTip(el);
    };
  };
}
