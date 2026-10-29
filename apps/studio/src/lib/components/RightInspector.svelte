<script lang="ts">
  import type { Component } from 'svelte';
  import PencilSimpleLineIcon from 'phosphor-svelte/lib/PencilSimpleLineIcon';
  import PaintBrushIcon from 'phosphor-svelte/lib/PaintBrushIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import { editor } from '../state/editor.svelte.js';
  import InspectorHeader from './inspector/InspectorHeader.svelte';
  import ContentTab from './inspector/ContentTab.svelte';
  import StyleTab from './inspector/StyleTab.svelte';
  import AdvancedTab from './inspector/AdvancedTab.svelte';
  import PageSettings from './inspector/PageSettings.svelte';
  import { inspectorUi, type InspectorTab } from './inspector/lib/ui-state.svelte.js';

  const TABS: ReadonlyArray<{ id: InspectorTab; label: string; icon: Component<{ size?: number | string }> }> = [
    { id: 'content', label: 'Content', icon: PencilSimpleLineIcon },
    { id: 'style', label: 'Style', icon: PaintBrushIcon },
    { id: 'advanced', label: 'Advanced', icon: GearSixIcon }
  ];

  const uid = $props.id();
  const node = $derived(editor.selectedNode);
  /** Developer notes live in the Advanced tab; flag them on the tab so they are never missed. */
  const hasNote = $derived(Boolean(node && editor.blueprint.notes?.[`node:${node.id}`]?.trim()));

  function selectTab(id: InspectorTab, focus = false) {
    inspectorUi.tab = id;
    if (focus) document.getElementById(`${uid}-tab-${id}`)?.focus();
  }

  function onTabKeydown(e: KeyboardEvent) {
    const order = TABS.map((t) => t.id);
    const i = order.indexOf(inspectorUi.tab);
    const next =
      e.key === 'ArrowRight' ? order[(i + 1) % order.length] : e.key === 'ArrowLeft' ? order[(i - 1 + order.length) % order.length] : e.key === 'Home' ? order[0] : e.key === 'End' ? order[order.length - 1] : null;
    if (!next) return;
    e.preventDefault();
    selectTab(next, true);
  }

  /** Continuous edits (scrubbing, typing, picking colors) end on release / blur / commit. */
  const endEdit = () => editor.endContinuousEdit();

  function unlock() {
    if (!node) return;
    editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { locked: false } }, { coalesce: false });
  }
</script>

<aside class="sx-panel insp" aria-label="Inspector" onpointerup={endEdit} onfocusout={endEdit} onchange={endEdit}>
  {#if node}
    <InspectorHeader {node} />

    <div class="sx-tabs" role="tablist" aria-label="Inspector sections">
      {#each TABS as tab (tab.id)}
        {@const Icon = tab.icon}
        <button
          type="button"
          role="tab"
          id="{uid}-tab-{tab.id}"
          class="sx-tab"
          aria-selected={inspectorUi.tab === tab.id}
          aria-controls="{uid}-panel"
          tabindex={inspectorUi.tab === tab.id ? 0 : -1}
          onclick={() => selectTab(tab.id)}
          onkeydown={onTabKeydown}
        >
          <Icon size={15} />
          {tab.label}
          {#if tab.id === 'advanced' && hasNote}
            <span class="insp__tab-dot" aria-label="Has developer notes"></span>
          {/if}
        </button>
      {/each}
    </div>

    {#if node.locked}
      <div class="insp__locked" role="status">
        <LockSimpleIcon size={14} weight="bold" />
        <span class="insp__locked-text"><strong>Locked.</strong> Unlock to edit this element.</span>
        <button type="button" class="sx-btn sx-btn--sm" onclick={unlock}>Unlock</button>
      </div>
    {/if}

    <div class="sx-panel__body" role="tabpanel" id="{uid}-panel" aria-labelledby="{uid}-tab-{inspectorUi.tab}">
      <fieldset class="insp__fields" disabled={node.locked}>
        <legend class="insp__sr">{node.name} — {TABS.find((t) => t.id === inspectorUi.tab)?.label}</legend>
        {#key node.id}
          {#if inspectorUi.tab === 'content'}
            <ContentTab {node} />
          {:else if inspectorUi.tab === 'style'}
            <StyleTab {node} />
          {:else}
            <AdvancedTab {node} />
          {/if}
        {/key}
      </fieldset>
    </div>
  {:else if editor.activePage}
    <PageSettings page={editor.activePage} />
  {:else}
    <div class="sx-empty insp__empty">
      <span class="sx-empty__icon"><CursorClickIcon size={18} /></span>
      <span class="sx-empty__title">Nothing selected</span>
      <span class="sx-help">Select an element on the canvas to edit it.</span>
    </div>
  {/if}
</aside>

<style>
  .insp {
    height: 100%;
    min-width: 0;
    border-left: 1px solid var(--sx-border);
    overflow: hidden;
  }
  .insp .sx-panel__body {
    padding-bottom: 24px;
  }
  .insp__fields {
    min-width: 0;
    min-inline-size: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .insp__fields:disabled {
    opacity: 0.55;
    pointer-events: none;
  }
  .insp__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }
  .insp__locked {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 8px 8px 14px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-warning-soft);
    color: var(--sx-warning);
    flex-shrink: 0;
  }
  .insp__locked-text {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-sm);
    color: var(--sx-text);
  }
  .insp__empty {
    margin: auto 0;
  }
  .insp__tab-dot {
    width: 6px;
    height: 6px;
    margin-left: -2px;
    border-radius: 50%;
    background: var(--sx-accent);
    align-self: flex-start;
    margin-top: 12px;
  }
</style>
