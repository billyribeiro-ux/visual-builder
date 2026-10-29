<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    spacing?: 'sm' | 'md' | 'lg';
    label?: string;
    class?: string;
  }

  let { spacing = 'md', label = '', class: className = '', ...rest }: Props = $props();
</script>

<div {...rest} class={['divider', `space-${spacing}`, className]}>
  <hr class="rule" />
  {#if label}
    <span class="label" data-prop="label">{label}</span>
    <hr class="rule" />
  {/if}
</div>

<style>
  .divider {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .space-sm { padding: 1rem 0; }
  .space-md { padding: 2rem 0; }
  .space-lg { padding: 3.5rem 0; }
  .rule {
    flex: 1;
    height: 0;
    border: none;
    border-top: 1px solid var(--md-sys-color-outline-variant);
  }
  .label {
    flex-shrink: 0;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
