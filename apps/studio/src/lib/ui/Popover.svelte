<script lang="ts">
  import type { Snippet } from 'svelte';

  export type PopoverPlacement = 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'right-start' | 'left-start';

  interface Props {
    open: boolean;
    anchor: HTMLElement | null | undefined;
    onclose: () => void;
    placement?: PopoverPlacement;
    width?: number;
    offset?: number;
    label?: string;
    role?: 'menu' | 'dialog' | 'listbox';
    class?: string;
    children: Snippet;
  }

  let {
    open,
    anchor,
    onclose,
    placement = 'bottom-start',
    width,
    offset = 6,
    label,
    role = 'menu',
    class: className = '',
    children
  }: Props = $props();

  let x = $state(0);
  let y = $state(0);
  let measured = $state(false);

  function place(el: HTMLElement) {
    if (!anchor) return;
    const a = anchor.getBoundingClientRect();
    const p = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left: number;
    let top: number;
    switch (placement) {
      case 'bottom-end':
        left = a.right - p.width;
        top = a.bottom + offset;
        break;
      case 'bottom':
        left = a.left + a.width / 2 - p.width / 2;
        top = a.bottom + offset;
        break;
      case 'top-start':
        left = a.left;
        top = a.top - offset - p.height;
        break;
      case 'top-end':
        left = a.right - p.width;
        top = a.top - offset - p.height;
        break;
      case 'right-start':
        left = a.right + offset;
        top = a.top;
        break;
      case 'left-start':
        left = a.left - offset - p.width;
        top = a.top;
        break;
      default:
        left = a.left;
        top = a.bottom + offset;
    }
    // Flip vertically when the popover would leave the viewport.
    if (top + p.height > vh - 8 && placement.startsWith('bottom')) top = Math.max(8, a.top - offset - p.height);
    if (top < 8 && placement.startsWith('top')) top = a.bottom + offset;
    x = Math.round(Math.max(8, Math.min(left, vw - p.width - 8)));
    y = Math.round(Math.max(8, Math.min(top, vh - p.height - 8)));
    measured = true;
  }

  /** Positions on mount, keeps position on resize/scroll, closes on outside pointer/Escape. */
  function popover(el: HTMLElement) {
    measured = false;
    place(el);
    const reposition = () => place(el);
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (el.contains(target) || anchor?.contains(target)) return;
      onclose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onclose();
        anchor?.focus();
      }
    };
    const ro = new ResizeObserver(reposition);
    ro.observe(el);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKey, true);
    const first = el.querySelector<HTMLElement>('[role="menuitem"], [role="menuitemradio"], button, input, [tabindex]');
    if (role === 'menu') first?.focus({ preventScroll: true });
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }

  function onMenuKeydown(e: KeyboardEvent) {
    if (role !== 'menu' || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
    const root = e.currentTarget as HTMLElement;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]')).filter(
      (i) => !i.hasAttribute('disabled')
    );
    if (items.length === 0) return;
    e.preventDefault();
    const idx = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
    items[next]?.focus();
  }
</script>

{#if open && anchor}
  <div
    class={['sx-popover', className]}
    {role}
    aria-label={label}
    tabindex="-1"
    style:left="{x}px"
    style:top="{y}px"
    style:width={width ? `${width}px` : undefined}
    style:visibility={measured ? 'visible' : 'hidden'}
    onkeydown={onMenuKeydown}
    {@attach popover}
  >
    {@render children()}
  </div>
{/if}
