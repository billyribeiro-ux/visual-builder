<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import type { BlueprintNode } from '@app-viz/schema';

  let editingNodeId = $state<string | null>(null);
  let editingName = $state<string>('');
  let searchFilter = $state<string>('');

  function startRename(node: BlueprintNode) {
    editingNodeId = node.id;
    editingName = node.name;
  }

  function commitRename(nodeId: string) {
    if (editingName.trim()) {
      editor.dispatch({
        type: 'UPDATE_NODE_META',
        nodeId,
        meta: { name: editingName.trim() }
      });
    }
    editingNodeId = null;
  }

  function matchesFilter(node: BlueprintNode, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.toLowerCase();
    if (
      node.name.toLowerCase().includes(lower) ||
      node.componentType.toLowerCase().includes(lower)
    ) {
      return true;
    }
    return (node.children || []).some((c) => matchesFilter(c, q));
  }
</script>

{#snippet navTreeNode(node: BlueprintNode, depth: number)}
  {#if matchesFilter(node, searchFilter)}
    {@const isSelected = editor.selectedNodeId === node.id}
    {@const hasChildren = Boolean(node.children && node.children.length > 0)}
    <div class="nav-node-group">
      <div
        class="nav-row {isSelected ? 'nav-row--selected' : ''} {node.hidden ? 'nav-row--hidden' : ''}"
        style="padding-left: {depth * 14 + 10}px;"
      >
        <button
          type="button"
          class="nav-select-btn"
          onclick={() => editor.selectNode(node.id)}
          ondblclick={() => startRename(node)}
          title="Click to select • Double-click to rename"
        >
          <span class="nav-icon">
            {hasChildren ? '▾' : '•'}
          </span>
          {#if editingNodeId === node.id}
            <input
              type="text"
              aria-label="Rename element"
              bind:value={editingName}
              onclick={(e) => e.stopPropagation()}
              onkeydown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commitRename(node.id);
                if (e.key === 'Escape') editingNodeId = null;
              }}
              onblur={() => commitRename(node.id)}
              class="nav-rename-input"
            />
          {:else}
            <span class="nav-name">{node.name}</span>
          {/if}
          <span class="nav-type-tag">{node.componentType.split('/')[1] || node.componentType}</span>
        </button>

        <div class="nav-actions">
          <button
            type="button"
            onclick={() =>
              editor.dispatch({
                type: 'REORDER_NODE',
                nodeId: node.id,
                direction: 'up'
              })}
            title="Move Up"
            class="nav-act-btn"
          >
            ↑
          </button>
          <button
            type="button"
            onclick={() =>
              editor.dispatch({
                type: 'REORDER_NODE',
                nodeId: node.id,
                direction: 'down'
              })}
            title="Move Down"
            class="nav-act-btn"
          >
            ↓
          </button>
          <button
            type="button"
            onclick={() =>
              editor.dispatch({
                type: 'UPDATE_NODE_META',
                nodeId: node.id,
                meta: { locked: !node.locked }
              })}
            title={node.locked ? 'Unlock Element' : 'Lock Element'}
            class="nav-act-btn {node.locked ? 'nav-act-btn--active' : ''}"
          >
            {node.locked ? '🔒' : '🔓'}
          </button>
          <button
            type="button"
            onclick={() =>
              editor.dispatch({
                type: 'UPDATE_NODE_META',
                nodeId: node.id,
                meta: { hidden: !node.hidden }
              })}
            title={node.hidden ? 'Show Element' : 'Hide Element'}
            class="nav-act-btn {node.hidden ? 'nav-act-btn--active' : ''}"
          >
            {node.hidden ? '🚫' : '👁'}
          </button>
        </div>
      </div>

      {#if hasChildren}
        {#each node.children as child (child.id)}
          {@render navTreeNode(child, depth + 1)}
        {/each}
      {/if}
    </div>
  {/if}
{/snippet}

{#if editor.showNavigator && !editor.isInteractiveMode}
  <aside
    class="el-navigator-panel"
    aria-label="Elementor Structure Navigator"
  >
    <div class="el-navigator-header">
      <div class="el-navigator-title-row">
        <span class="el-navigator-icon">📑</span>
        <div>
          <div class="el-navigator-title">Structure Navigator</div>
          <div class="el-navigator-sub">Double-click any layer to rename</div>
        </div>
      </div>
      <button
        type="button"
        onclick={() => (editor.showNavigator = false)}
        class="el-navigator-close"
        aria-label="Close Structure Navigator"
      >
        ✕
      </button>
    </div>

    <div class="el-navigator-search">
      <input
        type="search"
        bind:value={searchFilter}
        placeholder="Filter structure layers..."
        aria-label="Filter structure layers"
        class="studio-input"
      />
    </div>

    <div class="el-navigator-body">
      {#if editor.activeLayout}
        <div class="nav-section-label">GLOBAL THEME SHELL ({editor.activeLayout.name})</div>
        {@render navTreeNode(editor.activeLayout.rootNode, 0)}
      {/if}

      {#if editor.activePage}
        <div class="nav-section-label">PAGE CONTENT ({editor.activePage.path})</div>
        {@render navTreeNode(editor.activePage.rootNode, 0)}
      {/if}
    </div>

    <div class="el-navigator-footer">
      <span>Shortcut: <code>⌘I</code></span>
      {#if editor.selectedNodeId}
        <button
          type="button"
          onclick={() => editor.duplicateSelectedNode()}
          class="studio-btn"
          style="font-size: 0.6875rem; padding: 2px 8px;"
        >
          ⧉ Duplicate Selected
        </button>
      {/if}
    </div>
  </aside>
{/if}

<style>
  .el-navigator-panel {
    position: fixed;
    bottom: 20px;
    right: 348px;
    width: 310px;
    max-height: 72vh;
    background-color: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 14px;
    box-shadow: 0 16px 42px rgba(0, 0, 0, 0.45);
    z-index: 95;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .el-navigator-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.85rem;
    background-color: var(--md-sys-color-surface-container-highest);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .el-navigator-title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .el-navigator-icon {
    font-size: 1rem;
  }
  .el-navigator-title {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .el-navigator-sub {
    font-size: 0.625rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .el-navigator-close {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    color: var(--md-sys-color-on-surface-variant);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .el-navigator-close:hover {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
  }
  .el-navigator-search {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .el-navigator-body {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0.35rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-section-label {
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    color: var(--md-sys-color-primary);
    padding: 0.45rem 0.5rem 0.2rem 0.5rem;
    text-transform: uppercase;
  }
  .nav-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 6px;
    padding-right: 4px;
    transition: background-color 120ms ease;
  }
  .nav-row:hover {
    background-color: var(--md-sys-color-surface-container-highest);
  }
  .nav-row--selected {
    background-color: var(--md-sys-color-primary-container) !important;
    color: var(--md-sys-color-on-primary-container);
  }
  .nav-row--hidden {
    opacity: 0.5;
  }
  .nav-select-btn {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.25rem;
    text-align: left;
    color: inherit;
    font-size: 0.73rem;
  }
  .nav-icon {
    font-size: 0.65rem;
    color: var(--md-sys-color-outline);
    width: 10px;
  }
  .nav-name {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav-type-tag {
    font-size: 0.58rem;
    font-family: var(--md-sys-font-mono);
    color: var(--md-sys-color-outline);
    margin-left: auto;
    padding-right: 4px;
  }
  .nav-rename-input {
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-primary);
    border-radius: 4px;
    font-size: 0.72rem;
    padding: 1px 4px;
    width: 110px;
  }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 1px;
    opacity: 0.75;
  }
  .nav-row:hover .nav-actions {
    opacity: 1;
  }
  .nav-act-btn {
    font-size: 0.65rem;
    padding: 2px 4px;
    border-radius: 4px;
    color: inherit;
  }
  .nav-act-btn:hover {
    background-color: rgba(255, 255, 255, 0.12);
  }
  .nav-act-btn--active {
    color: var(--md-sys-color-primary);
  }
  .el-navigator-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.45rem 0.75rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container);
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
