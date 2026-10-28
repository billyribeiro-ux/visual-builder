<script lang="ts">
  interface TabItem {
    /** Registry fields: label, title, content. `id` is tolerated for legacy blueprints. */
    id?: string;
    label: string;
    title?: string;
    content: string;
  }

  interface Props {
    tabs?: TabItem[];
    style?: string;
  }

  let { tabs = [], style = '' }: Props = $props();
  const uid = $props.id();
  let selectedIndex = $state(0);
  const activeIndex = $derived(
    tabs.length === 0 ? -1 : Math.min(Math.max(selectedIndex, 0), tabs.length - 1)
  );
  const activeTab = $derived(activeIndex >= 0 ? tabs[activeIndex] : undefined);

  function handleTabKeyDown(e: KeyboardEvent, idx: number) {
    if (tabs.length === 0) return;
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    selectedIndex = next;
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }
</script>

<div class="md-card md-card-outlined" style="padding: 0; overflow: hidden; {style}">
  <div
    role="tablist"
    style="display: flex; flex-wrap: wrap; border-bottom: 1px solid var(--md-sys-color-outline-variant); background-color: var(--md-sys-color-surface-container-low);"
  >
    {#each tabs as tab, idx (idx)}
      <button
        type="button"
        role="tab"
        id="{uid}-tab-{idx}"
        aria-selected={activeIndex === idx}
        aria-controls="{uid}-panel"
        tabindex={activeIndex === idx ? 0 : -1}
        onclick={() => (selectedIndex = idx)}
        onkeydown={(e) => handleTabKeyDown(e, idx)}
        class="md-label-large"
        style="padding: 0.875rem 1.5rem; background: transparent; border: none; border-bottom: 2px solid {activeIndex === idx ? 'var(--md-sys-color-primary)' : 'transparent'}; color: {activeIndex === idx ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}; cursor: pointer;"
      >
        {tab.label}
      </button>
    {/each}
  </div>
  {#if activeTab}
    <div
      role="tabpanel"
      id="{uid}-panel"
      aria-labelledby="{uid}-tab-{activeIndex}"
      tabindex="0"
      style="padding: 1.5rem;"
    >
      {#if activeTab.title}
        <h3 class="md-title-large" style="margin: 0 0 0.5rem 0; color: var(--md-sys-color-on-surface);">{activeTab.title}</h3>
      {/if}
      <p class="md-body-large" style="margin: 0; color: var(--md-sys-color-on-surface-variant);">{activeTab.content}</p>
    </div>
  {/if}
</div>
