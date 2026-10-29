<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import Icon from './Icon.svelte';
  import { findRuleForTarget, type InteractionRuntimeRule } from './interactions.js';

  interface Props {
    /** Executable click rules (payloads already sanitized by the builder). */
    rules: InteractionRuntimeRule[];
    /** Navigation handler. Defaults to a full browser navigation. */
    onNavigate?: (path: string) => void;
  }

  let { rules, onNavigate }: Props = $props();

  let modal = $state<{ title: string; body: string; ctaText: string } | null>(null);
  let drawer = $state<{ title: string; body: string } | null>(null);
  let toast = $state<string | null>(null);
  let appState = $state<Record<string, string>>({});
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  function showToast(message: string, durationMs: number) {
    clearTimeout(toastTimer);
    toast = message;
    toastTimer = setTimeout(() => (toast = null), durationMs);
  }

  function navigate(path: string) {
    if (onNavigate) onNavigate(path);
    else if (path && path !== '#') window.location.assign(path);
  }

  function handleClick(event: MouseEvent) {
    if (event.defaultPrevented) return;
    const rule = findRuleForTarget(event.target, rules);
    if (!rule) return;
    event.preventDefault();
    const p = rule.payload;
    switch (rule.actionType) {
      case 'navigate':
        navigate(p.path || p.targetPath || '/');
        break;
      case 'openModal':
        modal = {
          title: p.modalTitle || 'Dialog',
          body: p.modalBody || 'This dialog was opened by a click interaction.',
          ctaText: p.modalCta || 'Confirm'
        };
        break;
      case 'closeModal':
        modal = null;
        break;
      case 'toggleDrawer':
        drawer = drawer
          ? null
          : { title: p.drawerTitle || 'Details', body: p.drawerBody || 'Additional details for this section.' };
        break;
      case 'showToast':
        showToast(p.toastMessage || 'Action completed', 3500);
        break;
      case 'setState': {
        const key = p.stateKey || 'status';
        appState[key] = p.stateValue || 'active';
        showToast(`State "${key}" set to "${appState[key]}"`, 2800);
        break;
      }
      case 'submitForm':
        showToast(p.toastMessage || 'Form submitted', 3200);
        break;
      case 'scrollTo': {
        const anchor = (p.anchor || p.targetId || '').replace(/^#/, '');
        const target =
          (anchor && document.getElementById(anchor)) ||
          (p.targetNodeId ? document.querySelector(`[data-node-id="${CSS.escape(p.targetNodeId)}"]`) : null);
        if (target) {
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        } else {
          showToast(`Nothing to scroll to: no element with id "${anchor || p.targetNodeId || ''}"`, 3200);
        }
        break;
      }
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (modal) {
      modal = null;
      event.preventDefault();
    } else if (drawer) {
      drawer = null;
      event.preventDefault();
    }
  }

  /** Moves focus into an opened dialog and restores it to the previously focused element on close. */
  const focusOnOpen: Attachment<HTMLElement> = (element) => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element.focus();
    return () => previous?.focus();
  };

  onDestroy(() => clearTimeout(toastTimer));
</script>

<svelte:window onclick={handleClick} onkeydown={handleKeydown} />

{#if modal}
  <div class="backdrop backdrop--center">
    <div
      class="md-card md-card--elevated dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appviz-modal-title"
      tabindex="-1"
      {@attach focusOnOpen}
    >
      <h3 id="appviz-modal-title" class="md-headline-small">{modal.title}</h3>
      <p class="md-body-medium muted">{modal.body}</p>
      <div class="dialog-actions">
        <button type="button" class="md-btn md-btn--outlined" onclick={() => (modal = null)}>Dismiss</button>
        <button type="button" class="md-btn md-btn--filled" onclick={() => (modal = null)}>{modal.ctaText}</button>
      </div>
    </div>
  </div>
{/if}

{#if drawer}
  <div class="backdrop backdrop--end">
    <aside class="md-card drawer" aria-labelledby="appviz-drawer-title" tabindex="-1" {@attach focusOnOpen}>
      <div>
        <div class="drawer-header">
          <h3 id="appviz-drawer-title" class="md-title-large">{drawer.title}</h3>
          <button type="button" class="md-btn md-btn--text icon-btn" aria-label="Close drawer" onclick={() => (drawer = null)}>
            <Icon name="X" size={18} />
          </button>
        </div>
        <p class="md-body-medium muted">{drawer.body}</p>
      </div>
      <button type="button" class="md-btn md-btn--tonal" onclick={() => (drawer = null)}>Close</button>
    </aside>
  </div>
{/if}

{#if toast}
  <div class="toast" role="status" aria-live="polite">
    <span>{toast}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification" onclick={() => (toast = null)}>
      <Icon name="X" size={16} />
    </button>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    padding: 1.5rem;
  }
  .backdrop--center {
    z-index: 90;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.55);
  }
  .backdrop--end {
    z-index: 85;
    justify-content: flex-end;
    padding: 0;
    background: rgba(0, 0, 0, 0.4);
  }
  .dialog {
    width: 100%;
    max-width: 28rem;
    padding: 1.75rem;
    outline: none;
  }
  .dialog h3 {
    margin-bottom: 0.75rem;
  }
  .muted {
    color: var(--md-sys-color-on-surface-variant);
  }
  .dialog .muted {
    margin-bottom: 1.5rem;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
  }
  .drawer {
    width: min(24rem, 90vw);
    height: 100%;
    border-radius: 16px 0 0 16px;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    outline: none;
  }
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  .icon-btn {
    padding: 0 10px;
  }
  .toast {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 95;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    border-radius: 12px;
    background: #1D2024;
    color: #E2E2E6;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  }
  .toast-close {
    display: inline-flex;
    color: inherit;
  }
</style>
