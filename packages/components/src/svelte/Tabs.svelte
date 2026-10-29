<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface TabItem {
    label: string;
    title?: string;
    content: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    tabs?: TabItem[];
    class?: string;
  }

  let { tabs = [], class: className = '', ...rest }: Props = $props();

  const uid = $props.id();
  let selectedIndex = $state(0);
  const activeIndex = $derived(tabs.length === 0 ? -1 : Math.min(Math.max(selectedIndex, 0), tabs.length - 1));
  const activeTab = $derived(activeIndex >= 0 ? tabs[activeIndex] : undefined);

  function handleTabKeydown(event: KeyboardEvent, index: number) {
    if (tabs.length === 0) return;
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    selectedIndex = next;
    document.getElementById(`${uid}-tab-${next}`)?.focus();
  }
</script>

<div {...rest} class={['tabs', className]}>
  <div class="bar">
    <div class="tablist" role="tablist">
      {#each tabs as tab, index (index)}
        <button
          type="button"
          role="tab"
          id="{uid}-tab-{index}"
          class={['tab', activeIndex === index && 'tab--active']}
          aria-selected={activeIndex === index}
          aria-controls="{uid}-panel"
          tabindex={activeIndex === index ? 0 : -1}
          onclick={() => (selectedIndex = index)}
          onkeydown={(event) => handleTabKeydown(event, index)}
          data-prop={`tabs.${index}.label`}
        >
          {tab.label}
        </button>
      {/each}
    </div>
  </div>
  {#if activeTab}
    <div class="panel" role="tabpanel" id="{uid}-panel" aria-labelledby="{uid}-tab-{activeIndex}" tabindex="0">
      {#if activeTab.title}
        <h3 class="panel-title" data-prop={`tabs.${activeIndex}.title`}>{activeTab.title}</h3>
      {/if}
      <p class="panel-content" data-prop={`tabs.${activeIndex}.content`}>{activeTab.content}</p>
    </div>
  {/if}
</div>

<style>
  .tabs {
    overflow: hidden;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 14px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: var(--md-sys-elevation-level1);
  }
  .bar {
    padding: 0.75rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
    overflow-x: auto;
  }
  .tablist {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.25rem;
    border-radius: var(--md-sys-shape-corner-medium, 10px);
    background-color: var(--md-sys-color-surface-container);
  }
  .tab {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 0.875rem;
    border-radius: 7px;
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    color: var(--md-sys-color-on-surface-variant);
    transition:
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .tab:hover {
    color: var(--md-sys-color-on-surface);
  }
  .tab--active,
  .tab--active:hover {
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow:
      var(--md-sys-elevation-level1),
      0 0 0 1px var(--md-sys-color-outline-variant);
  }
  .panel {
    padding: 1.5rem;
  }
  @media (min-width: 768px) {
    .panel {
      padding: 2rem;
    }
  }
  .panel-title {
    margin-bottom: 0.5rem;
    font-size: 1.25rem;
    line-height: 1.35;
    font-weight: 600;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    color: var(--md-sys-color-on-surface);
  }
  .panel-content {
    max-width: 44rem;
    font-size: 0.9375rem;
    line-height: 1.7;
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
