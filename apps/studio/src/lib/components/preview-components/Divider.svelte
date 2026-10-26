<script lang="ts">
  interface Props {
    spacing?: 'sm' | 'md' | 'lg';
    label?: string;
    style?: string;
  }

  let { spacing = 'md', label = '', style = '' }: Props = $props();

  const padMap: Record<string, string> = {
    sm: '1rem 0',
    md: '2rem 0',
    lg: '3.5rem 0'
  };
</script>

<div style="padding: {padMap[spacing] || padMap.md}; display: flex; align-items: center; gap: 1rem; {style}">
  <hr style="flex: 1; border: none; border-top: 1px solid var(--md-sys-color-outline-variant); margin: 0;" />
  {#if label}
    <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">{label}</span>
    <hr style="flex: 1; border: none; border-top: 1px solid var(--md-sys-color-outline-variant); margin: 0;" />
  {/if}
</div>
