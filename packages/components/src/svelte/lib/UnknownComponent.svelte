<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    /** The unregistered component type, shown verbatim (never silently dropped). */
    type: string;
    class?: string;
    children?: Snippet;
  }

  let { type, class: className = '', children, ...rest }: Props = $props();
</script>

<div {...rest} class={['unknown', className]} role="note">
  <p class="message">Unknown component <code>{type}</code></p>
  {@render children?.()}
</div>

<style>
  .unknown {
    margin: 0.5rem 0;
    padding: 0.75rem 1rem;
    border: 2px solid #D92D20;
    border-radius: 8px;
    background: #FEF3F2;
    color: #912018;
  }
  .message {
    font-size: 0.875rem;
    font-weight: 600;
  }
  code {
    font-family: var(--md-sys-font-mono, monospace);
  }
</style>
