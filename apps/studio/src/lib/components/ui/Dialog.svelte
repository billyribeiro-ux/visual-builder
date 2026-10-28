<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    title: string;
    description?: string;
    size?: 'md' | 'lg' | 'xl';
    onclose: () => void;
    children: Snippet;
    footer?: Snippet;
  }

  let { open, title, description, size = 'lg', onclose, children, footer }: Props = $props();

  let panel = $state<HTMLDivElement | null>(null);
  const titleId = `dlg-${Math.random().toString(36).slice(2, 9)}`;

  const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  $effect(() => {
    if (!open || !panel) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const first = panel.querySelector<HTMLElement>('[data-autofocus]') ?? panel.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel).focus();

    function onKeydown(event: KeyboardEvent) {
      if (!panel) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onclose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    document.addEventListener('keydown', onKeydown, true);
    return () => {
      document.removeEventListener('keydown', onKeydown, true);
      previouslyFocused?.focus?.();
    };
  });
</script>

{#if open}
  <div class="dlg-backdrop" role="presentation" onclick={(e) => e.target === e.currentTarget && onclose()}>
    <div
      bind:this={panel}
      class="dlg dlg--{size}"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
    >
      <header class="dlg__header">
        <div>
          <h2 id={titleId} class="dlg__title">{title}</h2>
          {#if description}<p class="dlg__desc">{description}</p>{/if}
        </div>
        <button type="button" class="dlg__close" aria-label="Close dialog" onclick={onclose}>✕</button>
      </header>
      <div class="dlg__body">
        {@render children()}
      </div>
      {#if footer}
        <footer class="dlg__footer">{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dlg-backdrop {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(15, 20, 30, 0.42);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .dlg {
    width: 100%;
    max-height: min(88vh, 900px);
    display: flex;
    flex-direction: column;
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-large, 28px);
    box-shadow: var(--md-sys-elevation-level4, 0 16px 40px rgba(0, 0, 0, 0.2));
    outline: none;
    overflow: hidden;
  }
  .dlg--md { max-width: 34rem; }
  .dlg--lg { max-width: 52rem; }
  .dlg--xl { max-width: 72rem; }
  .dlg__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 1.5rem 0.75rem;
  }
  .dlg__title {
    margin: 0;
    font-family: var(--md-sys-font-heading);
    font-size: 1.25rem;
    font-weight: 700;
  }
  .dlg__desc {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .dlg__close {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 9999px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .dlg__close:hover,
  .dlg__close:focus-visible {
    background: var(--md-sys-color-surface-container-high);
  }
  .dlg__body {
    padding: 0.5rem 1.5rem 1.25rem;
    overflow: auto;
  }
  .dlg__footer {
    display: flex;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container-low);
  }
</style>
