<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    text?: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    modalTitle?: string;
    modalBody?: string;
    confirmText?: string;
    /** When set the confirm action is a link; otherwise it closes the dialog. */
    confirmHref?: string;
    /** Cancel button label; hidden when empty. */
    cancelText?: string;
    class?: string;
  }

  let {
    text = 'See how it works',
    variant = 'primary',
    size = 'md',
    modalTitle = 'How it works',
    modalBody = 'Connect your data sources, choose the metrics that matter and share live dashboards with your team. Setup takes minutes and needs no engineering time.',
    confirmText = 'Explore features',
    confirmHref = '/features',
    cancelText = 'Close',
    class: className = '',
    ...rest
  }: Props = $props();

  const VARIANT_CLASS: Record<string, string> = {
    primary: 'md-btn--filled',
    secondary: 'md-btn--tonal',
    outline: 'md-btn--outlined',
    ghost: 'md-btn--text'
  };

  const uid = $props.id();
  const triggerClasses = $derived(['md-btn', `md-btn--${size}`, VARIANT_CLASS[variant] ?? 'md-btn--filled', 'trigger']);

  let previousOverflow: string | null = null;
  let pressedOnBackdrop = false;

  function dialogElement(): HTMLDialogElement | null {
    const el = document.getElementById(`${uid}-dialog`);
    return el instanceof HTMLDialogElement ? el : null;
  }

  function lockScroll() {
    if (previousOverflow !== null) return;
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (previousOverflow === null) return;
    document.documentElement.style.overflow = previousOverflow;
    previousOverflow = null;
  }

  function openDialog() {
    const dialog = dialogElement();
    if (!dialog || dialog.open) return;
    dialog.showModal();
    lockScroll();
  }

  function closeDialog(reason: string) {
    dialogElement()?.close(reason);
  }

  /** Fires for every way of closing (Escape, buttons, backdrop): restore scroll and focus. */
  function handleClose() {
    unlockScroll();
    document.getElementById(`${uid}-trigger`)?.focus();
  }

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /** Strict focus trap: Tab / Shift+Tab wrap inside the dialog (also when embedded in an iframe). */
  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const dialog = event.currentTarget as HTMLDialogElement;
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handlePointerDown(event: PointerEvent) {
    pressedOnBackdrop = event.target === event.currentTarget;
  }

  function handleDialogClick(event: MouseEvent) {
    // Only the backdrop targets the <dialog> itself (the surface fills its box).
    if (pressedOnBackdrop && event.target === event.currentTarget) closeDialog('dismiss');
    pressedOnBackdrop = false;
  }

  /** Releases the scroll lock if the component unmounts while the dialog is open. */
  const releaseOnDestroy: Attachment = () => () => unlockScroll();
</script>

<div {...rest} class={['modal-button', className]}>
  <button
    type="button"
    id="{uid}-trigger"
    class={triggerClasses}
    aria-haspopup="dialog"
    aria-controls="{uid}-dialog"
    onclick={openDialog}
    data-prop="text">{text || 'Open'}</button
  >
  <dialog
    id="{uid}-dialog"
    class="dialog"
    aria-labelledby="{uid}-title"
    aria-describedby={modalBody ? `${uid}-body` : undefined}
    onclose={handleClose}
    onkeydown={handleKeydown}
    onpointerdown={handlePointerDown}
    onclick={handleDialogClick}
    {@attach releaseOnDestroy}
  >
    <div class="surface">
      <div class="head">
        <h2 class="title" id="{uid}-title" data-prop="modalTitle">{modalTitle}</h2>
        <button type="button" class="close" aria-label="Close dialog" onclick={() => closeDialog('close')}>
          <Icon name="X" size={18} />
        </button>
      </div>
      {#if modalBody}
        <p class="body" id="{uid}-body" data-prop="modalBody">{modalBody}</p>
      {/if}
      <div class="actions">
        {#if cancelText}
          <button type="button" class="md-btn md-btn--md md-btn--outlined action" onclick={() => closeDialog('cancel')} data-prop="cancelText"
            >{cancelText}</button
          >
        {/if}
        {#if confirmHref}
          <a class="md-btn md-btn--md md-btn--filled action" href={safeHref(confirmHref)} data-prop="confirmText">{confirmText || 'Continue'}</a>
        {:else}
          <button type="button" class="md-btn md-btn--md md-btn--filled action" onclick={() => closeDialog('confirm')} data-prop="confirmText"
            >{confirmText || 'Continue'}</button
          >
        {/if}
      </div>
    </div>
  </dialog>
</div>

<style>
  .modal-button {
    display: inline-flex;
    max-width: 100%;
  }
  .trigger {
    max-width: 100%;
  }

  .dialog {
    width: min(32rem, calc(100vw - 2rem));
    max-width: none;
    max-height: calc(100dvh - 2rem);
    margin: auto;
    padding: 0;
    overflow: auto;
    border: 0;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.06), 0 24px 48px -12px rgba(0, 0, 0, 0.28);
    overscroll-behavior: contain;
  }
  .dialog[open] {
    animation: modal-in 200ms var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
  }
  .dialog::backdrop {
    background-color: rgba(15, 17, 21, 0.48);
    backdrop-filter: blur(2px);
  }
  .dialog[open]::backdrop {
    animation: modal-backdrop-in 200ms ease-out;
  }

  .surface {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
  }
  .head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .title {
    margin: 0;
    padding-top: 0.25rem;
    font-family: var(--md-sys-font-heading, inherit);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: -0.015em;
    overflow-wrap: anywhere;
  }
  .close {
    display: inline-flex;
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    margin: -0.375rem -0.5rem 0 0;
    align-items: center;
    justify-content: center;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--md-sys-color-on-surface-variant);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease, color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .close:hover {
    color: var(--md-sys-color-on-surface);
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 7%, transparent);
  }
  .close:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
  .body {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  @keyframes modal-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes modal-backdrop-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (max-width: 479px) {
    .surface {
      padding: 1.25rem;
    }
    .actions {
      flex-direction: column-reverse;
    }
    .action {
      width: 100%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dialog[open],
    .dialog[open]::backdrop {
      animation: none;
    }
  }
</style>
