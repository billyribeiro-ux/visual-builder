<script lang="ts">
  interface Props {
    tone?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message?: string;
    dismissible?: boolean;
    style?: string;
  }

  let {
    tone = 'info',
    title = 'System Notice',
    message = '',
    dismissible = true,
    style = ''
  }: Props = $props();

  let dismissed = $state(false);

  const toneStyles: Record<string, string> = {
    info: 'background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container);',
    success: 'background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);',
    warning: 'background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);',
    error: 'background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);'
  };
</script>

{#if !dismissed}
  <div
    role="alert"
    class="md-card"
    style="padding: 1rem 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; {toneStyles[tone] || toneStyles.info} {style}"
  >
    <div>
      {#if title}
        <div class="md-title-medium" style="margin-bottom: 0.25rem;">{title}</div>
      {/if}
      {#if message}
        <div class="md-body-medium">{message}</div>
      {/if}
    </div>
    {#if dismissible}
      <button
        type="button"
        aria-label="Dismiss alert"
        onclick={() => (dismissed = true)}
        style="background: transparent; border: none; color: inherit; cursor: pointer; font-size: 1.125rem; line-height: 1; padding: 0.25rem;"
      >
        ✕
      </button>
    {/if}
  </div>
{/if}
