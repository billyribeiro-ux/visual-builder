<script lang="ts">
  interface Props {
    message: string;
    confirmLabel?: string;
    onconfirm: () => void | Promise<void>;
    oncancel: () => void;
    /** `compact` drops the message to a single short line for dense rows. */
    compact?: boolean;
  }

  let { message, confirmLabel = 'Delete', onconfirm, oncancel, compact = false }: Props = $props();

  let busy = $state(false);

  async function confirm() {
    if (busy) return;
    busy = true;
    try {
      await onconfirm();
    } finally {
      busy = false;
    }
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      oncancel();
    }
  }
</script>

<div class={['confirm', compact && 'confirm--compact']} role="alertdialog" aria-label={message} tabindex="-1" onkeydown={onKeydown}>
  <span class="confirm__msg">{message}</span>
  <div class="confirm__actions">
    <button
      type="button"
      class="sx-btn sx-btn--sm sx-btn--ghost"
      {@attach (el) => {
        el.focus({ preventScroll: true });
      }}
      onclick={(e) => {
        e.stopPropagation();
        oncancel();
      }}>Cancel</button
    >
    <button
      type="button"
      class="sx-btn sx-btn--sm confirm__go"
      disabled={busy}
      onclick={(e) => {
        e.stopPropagation();
        void confirm();
      }}>{confirmLabel}</button
    >
  </div>
</div>

<style>
  .confirm {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    width: 100%;
    outline: none;
  }
  .confirm__msg {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-danger);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .confirm--compact .confirm__msg {
    font-size: var(--sx-text-xs);
  }
  .confirm__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .confirm__go {
    color: #fff;
    background: var(--sx-danger);
    border-color: transparent;
  }
  .confirm__go:hover:not(:disabled) {
    background: color-mix(in srgb, var(--sx-danger) 88%, #000);
  }
</style>
