<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    tone?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message?: string;
    dismissible?: boolean;
    class?: string;
  }

  let { tone = 'info', title = '', message = '', dismissible = false, class: className = '', ...rest }: Props = $props();

  let dismissed = $state(false);
  const role = $derived(tone === 'warning' || tone === 'error' ? 'alert' : 'status');

  const TONE_ICON: Record<string, string> = {
    info: 'Info',
    success: 'CheckCircle',
    warning: 'Warning',
    error: 'WarningOctagon'
  };
</script>

{#if !dismissed}
  <div {...rest} {role} class={['alert', `tone-${tone}`, className]}>
    <span class="icon"><Icon name={TONE_ICON[tone] ?? 'Info'} size={20} /></span>
    <div class="content">
      {#if title}
        <p class="title" data-prop="title">{title}</p>
      {/if}
      {#if message}
        <p class="message" data-prop="message">{message}</p>
      {/if}
    </div>
    {#if dismissible}
      <button type="button" class="dismiss" aria-label="Dismiss alert" onclick={() => (dismissed = true)}>
        <Icon name="X" size={16} />
      </button>
    {/if}
  </div>
{/if}

<style>
  .alert {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border: 1px solid var(--tone-border);
    border-radius: var(--md-sys-shape-corner-medium, 10px);
    background-color: var(--tone-bg);
    color: var(--tone-fg);
  }
  .tone-info {
    --tone-bg: var(--md-sys-color-primary-container);
    --tone-fg: var(--md-sys-color-on-primary-container);
    --tone-icon: var(--md-sys-color-primary);
    --tone-border: color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
  }
  .tone-success {
    --tone-bg: var(--md-sys-color-success-container);
    --tone-fg: var(--md-sys-color-on-success-container);
    --tone-icon: var(--md-sys-color-success);
    --tone-border: color-mix(in srgb, var(--md-sys-color-success) 24%, transparent);
  }
  .tone-warning {
    --tone-bg: var(--md-sys-color-warning-container, var(--md-sys-color-tertiary-container));
    --tone-fg: var(--md-sys-color-on-warning-container, var(--md-sys-color-on-tertiary-container));
    --tone-icon: var(--md-sys-color-warning, var(--md-sys-color-tertiary));
    --tone-border: color-mix(in srgb, var(--md-sys-color-warning, var(--md-sys-color-tertiary)) 26%, transparent);
  }
  .tone-error {
    --tone-bg: var(--md-sys-color-error-container);
    --tone-fg: var(--md-sys-color-on-error-container);
    --tone-icon: var(--md-sys-color-error);
    --tone-border: color-mix(in srgb, var(--md-sys-color-error) 24%, transparent);
  }
  .icon {
    display: inline-flex;
    flex-shrink: 0;
    margin-top: 1px;
    color: var(--tone-icon);
  }
  .content {
    flex: 1;
    min-width: 0;
  }
  .title {
    font-size: 0.9375rem;
    line-height: 1.4;
    font-weight: 600;
  }
  .title + .message {
    margin-top: 0.25rem;
  }
  .message {
    font-size: 0.875rem;
    line-height: 1.55;
  }
  .dismiss {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    margin: -6px -6px -6px 0;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    color: inherit;
  }
  .dismiss:hover {
    background-color: rgba(0, 0, 0, 0.06);
  }
</style>
