<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    text?: string;
    tone?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'warning';
    /** Leading status dot. */
    dot?: boolean;
    class?: string;
  }

  let { text = 'New', tone = 'primary', dot = false, class: className = '', ...rest }: Props = $props();
</script>

<span {...rest} class={['md-badge', `tone-${tone}`, className]}>
  {#if dot}<span class="md-dot" aria-hidden="true"></span>{/if}
  <span data-prop="text">{text}</span>
</span>

<style>
  .tone-primary {
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 20%, transparent);
  }
  .tone-secondary {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
    border-color: var(--md-sys-color-outline-variant);
  }
  .tone-tertiary {
    background-color: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    border-color: color-mix(in srgb, var(--md-sys-color-tertiary) 22%, transparent);
  }
  .tone-success {
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
    border-color: color-mix(in srgb, var(--md-sys-color-success) 22%, transparent);
  }
  .tone-warning {
    background-color: var(--md-sys-color-warning-container);
    color: var(--md-sys-color-on-warning-container);
    border-color: color-mix(in srgb, var(--md-sys-color-warning) 24%, transparent);
  }
  .tone-error {
    background-color: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
    border-color: color-mix(in srgb, var(--md-sys-color-error) 22%, transparent);
  }
</style>
