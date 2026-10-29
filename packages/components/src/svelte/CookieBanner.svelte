<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    message?: string;
    policyText?: string;
    policyHref?: string;
    acceptText?: string;
    declineText?: string;
    position?: 'bottom' | 'bottom-left';
    class?: string;
  }

  let {
    title = 'Cookie preferences',
    message = 'We use cookies to improve your experience.',
    policyText = 'Cookie policy',
    policyHref = '/legal/cookies',
    acceptText = 'Accept all',
    declineText = 'Essential only',
    position = 'bottom',
    class: className = '',
    ...rest
  }: Props = $props();

  const fallbackId = $props.id();
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `cookie-${nodeId}` : fallbackId;
  });

  /**
   * Local, per-visit state only. Nothing is stored and no cookies are set here: the real
   * implementation must persist the choice and gate non-essential scripts on it.
   */
  let choice = $state<'accepted' | 'declined' | null>(null);
</script>

<section
  {...rest}
  class={['cookie', `cookie--${position}`, className]}
  aria-labelledby="{uid}-title"
  aria-describedby="{uid}-message"
  hidden={choice !== null}
>
  <div class="panel">
    <div class="copy">
      <span class="icon-tile" aria-hidden="true"><Icon name="ShieldCheck" size={20} /></span>
      <div class="text">
        <h2 class="title" id="{uid}-title" data-prop="title">{title}</h2>
        <p class="message" id="{uid}-message">
          <span data-prop="message">{message}</span>
          {#if policyText}
            <a href={safeHref(policyHref)} class="policy" data-prop="policyText">{policyText}</a>
          {/if}
        </p>
      </div>
    </div>
    <div class="actions">
      {#if declineText}
        <button type="button" class="md-btn md-btn--md decline" onclick={() => (choice = 'declined')}>
          <span data-prop="declineText">{declineText}</span>
        </button>
      {/if}
      <button type="button" class="md-btn md-btn--md md-btn--filled accept" onclick={() => (choice = 'accepted')}>
        <span data-prop="acceptText">{acceptText}</span>
      </button>
    </div>
  </div>
</section>

<style>
  .cookie {
    position: fixed;
    z-index: 900;
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    pointer-events: none;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
    animation: cookie-in var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .cookie[hidden] {
    display: none;
  }
  .panel {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    margin: 0 auto;
    max-width: 72rem;
    padding: 1rem 1rem 1rem 1.25rem;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 24px 56px -20px rgba(0, 0, 0, 0.3);
  }
  .copy {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    min-width: 0;
  }
  .icon-tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 11px;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
    color: var(--md-sys-color-primary);
  }
  .text {
    min-width: 0;
  }
  .title {
    font-size: 0.9375rem;
    line-height: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.01em;
  }
  .message {
    margin-top: 0.125rem;
    font-size: 0.875rem;
    line-height: 1.375rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .policy {
    margin-left: 0.25rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, currentColor 35%, transparent);
    text-underline-offset: 3px;
  }
  .policy:hover {
    text-decoration-color: currentColor;
  }
  .actions {
    display: flex;
    flex-shrink: 0;
    gap: 0.5rem;
  }
  .decline,
  .accept {
    font-weight: 600;
  }
  .decline {
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 95%, transparent);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
  }
  .decline:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }

  /* bottom-left: a compact card */
  .cookie--bottom-left {
    right: auto;
    width: min(24rem, calc(100% - 2rem));
  }
  .cookie--bottom-left .panel {
    flex-direction: column;
    align-items: stretch;
    gap: 1.25rem;
    padding: 1.25rem;
  }
  .cookie--bottom-left .actions .md-btn {
    flex: 1;
  }

  @media (max-width: 767px) {
    .cookie,
    .cookie--bottom-left {
      left: 0.75rem;
      right: 0.75rem;
      bottom: 0.75rem;
      width: auto;
    }
    .panel {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
      padding: 1.125rem;
    }
    .actions .md-btn {
      flex: 1;
      height: 44px;
      padding: 0 1rem;
    }
  }

  @keyframes cookie-in {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
