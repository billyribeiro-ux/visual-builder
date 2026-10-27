<script lang="ts">
  interface TabItem {
    id: string;
    label: string;
    content: string;
  }

  interface Props {
    tabs?: TabItem[];
    style?: string;
  }

  let { tabs = [], style = '' }: Props = $props();
  let selectedId = $state<string | null>(null);
  let activeId = $derived(selectedId ?? tabs[0]?.id ?? '');
</script>

<div class="md-card md-card-outlined" style="padding: 0; overflow: hidden; {style}">
  <div
    role="tablist"
    style="display: flex; border-bottom: 1px solid var(--md-sys-color-outline-variant); background-color: var(--md-sys-color-surface-container-low);"
  >
    {#each tabs as tab, idx (idx)}
      <button
        type="button"
        role="tab"
        aria-selected={activeId === tab.id}
        onclick={() => (selectedId = tab.id)}
        class="md-label-large"
        style="padding: 0.875rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid {activeId === tab.id ? 'var(--md-sys-color-primary)' : 'transparent'}; color: {activeId === tab.id ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}; cursor: pointer;"
      >
        {tab.label}
      </button>
    {/each}
  </div>
  <div role="tabpanel" style="padding: 1.5rem;">
    {#each tabs as tab, idx (idx)}
      {#if activeId === tab.id}
        <p class="md-body-large" style="margin: 0; color: var(--md-sys-color-on-surface);">{tab.content}</p>
      {/if}
    {/each}
  </div>
</div>
