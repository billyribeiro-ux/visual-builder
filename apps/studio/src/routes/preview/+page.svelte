<script lang="ts">
  import { onMount } from 'svelte';
  import {
    type ProjectBlueprint,
    type BlueprintNode,
    createDefaultAcmeSaaSProject
  } from '@app-viz/schema';
  import { compileNodeScopedCss } from '@app-viz/engine';
  import PreviewRenderer, {
    type NodeQuickAction
  } from '#lib/components/PreviewRenderer.svelte';

  let blueprint = $state<ProjectBlueprint>(createDefaultAcmeSaaSProject());
  let activePageId = $state<string>('10000000-0000-0000-0000-000000000001');
  let activeBreakpoint = $state<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop');
  let selectedNodeId = $state<string | null>(null);
  let isInteractiveMode = $state<boolean>(false);

  let contextMenu = $state<{
    node: BlueprintNode;
    x: number;
    y: number;
  } | null>(null);

  const activePage = $derived(
    blueprint.pages.find((p) => p.id === activePageId) || blueprint.pages[0]
  );

  const activeLayout = $derived(
    activePage?.layoutId
      ? blueprint.layouts.find((l) => l.id === activePage.layoutId)
      : undefined
  );

  // Injects CSS variables for MD3 design tokens + interactive state rules (:hover, :focus, :active)
  $effect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [key, val] of Object.entries(blueprint.tokens.colors || {})) {
        root.style.setProperty(`--md-sys-color-${key}`, val);
      }
      for (const [key, val] of Object.entries(blueprint.tokens.radii || {})) {
        root.style.setProperty(`--md-sys-shape-corner-${key}`, val);
      }
      root.style.setProperty(
        '--md-sys-font-heading',
        blueprint.tokens.fonts?.heading || 'Roboto, sans-serif'
      );
      root.style.setProperty(
        '--md-sys-font-body',
        blueprint.tokens.fonts?.body || 'Roboto, sans-serif'
      );

      let styleTag = document.getElementById('app-viz-state-styles') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'app-viz-state-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = compileNodeScopedCss(
        [activeLayout?.rootNode, activePage?.rootNode],
        { includeMediaQueries: false, includeStates: true }
      );
    }
  });

  onMount(() => {
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    function handleParentMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'SYNC_STATE') {
        blueprint = data.blueprint;
        activePageId = data.activePageId;
        if (data.activeBreakpoint) activeBreakpoint = data.activeBreakpoint;
        selectedNodeId = data.selectedNodeId;
        isInteractiveMode = data.isInteractiveMode;
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        window.parent.postMessage(
          { type: 'KEY_SHORTCUT', shortcut: e.shiftKey ? 'redo' : 'undo' },
          window.location.origin
        );
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        window.parent.postMessage({ type: 'KEY_SHORTCUT', shortcut: 'duplicate' }, window.location.origin);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        window.parent.postMessage({ type: 'KEY_SHORTCUT', shortcut: 'copy' }, window.location.origin);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        window.parent.postMessage({ type: 'KEY_SHORTCUT', shortcut: 'paste' }, window.location.origin);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInteractiveMode && selectedNodeId) {
          e.preventDefault();
          window.parent.postMessage({ type: 'KEY_SHORTCUT', shortcut: 'delete' }, window.location.origin);
        }
      } else if (e.key === 'Escape') {
        contextMenu = null;
        window.parent.postMessage({ type: 'KEY_SHORTCUT', shortcut: 'escape' }, window.location.origin);
      }
    }

    function handleGlobalClick() {
      contextMenu = null;
    }

    window.addEventListener('message', handleParentMessage);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('message', handleParentMessage);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleGlobalClick);
    };
  });

  function handleSelectNode(nodeId: string) {
    contextMenu = null;
    selectedNodeId = nodeId;
    window.parent.postMessage({ type: 'SELECT_NODE', nodeId }, window.location.origin);
  }

  function handleNavigate(path: string) {
    const targetPage = blueprint.pages.find((p) => p.path === path);
    if (targetPage) {
      activePageId = targetPage.id;
      window.parent.postMessage({ type: 'NAVIGATE_PAGE', path }, window.location.origin);
    }
  }

  function handleNodeAction(nodeId: string, action: NodeQuickAction) {
    contextMenu = null;
    window.parent.postMessage({ type: 'NODE_ACTION', nodeId, action }, window.location.origin);
  }

  function handleDropItem(
    payload: { componentType?: string; nodeId?: string },
    targetNodeId: string,
    position: 'before' | 'inside' | 'after'
  ) {
    window.parent.postMessage(
      {
        type: 'DROP_ITEM',
        componentType: payload.componentType,
        draggedNodeId: payload.nodeId,
        targetNodeId,
        position
      },
      window.location.origin
    );
  }

  function handleContextMenuNode(node: BlueprintNode, x: number, y: number) {
    const safeX = Math.min(x, Math.max(20, window.innerWidth - 220));
    const safeY = Math.min(y, Math.max(20, window.innerHeight - 280));
    contextMenu = { node, x: safeX, y: safeY };
  }
</script>

<svelte:head>
  <title>{activePage?.title || 'Preview'}</title>
</svelte:head>

<div class="preview-root">
  {#if activePage}
    {#if activeLayout}
      <PreviewRenderer
        node={activeLayout.rootNode}
        slotNode={activePage.rootNode}
        {activeBreakpoint}
        {selectedNodeId}
        {isInteractiveMode}
        onSelectNode={handleSelectNode}
        onNavigate={handleNavigate}
        onNodeAction={handleNodeAction}
        onDropItem={handleDropItem}
        onContextMenuNode={handleContextMenuNode}
      />
    {:else}
      <PreviewRenderer
        node={activePage.rootNode}
        {activeBreakpoint}
        {selectedNodeId}
        {isInteractiveMode}
        onSelectNode={handleSelectNode}
        onNavigate={handleNavigate}
        onNodeAction={handleNodeAction}
        onDropItem={handleDropItem}
        onContextMenuNode={handleContextMenuNode}
      />
    {/if}
  {/if}

  {#if contextMenu && !isInteractiveMode}
    <div
      class="canvas-context-menu"
      style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
      role="menu"
    >
      <div class="ctx-header">{contextMenu.node.name}</div>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'up')}>
        <span>↑ Move Up</span><span class="ctx-kbd">Alt+↑</span>
      </button>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'down')}>
        <span>↓ Move Down</span><span class="ctx-kbd">Alt+↓</span>
      </button>
      <div class="ctx-sep"></div>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'wrap-section')}>
        <span>📦 Wrap in Section</span>
      </button>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'wrap-container')}>
        <span>📦 Wrap in Container</span>
      </button>
      {#if contextMenu.node.children && contextMenu.node.children.length > 0}
        <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'unwrap')}>
          <span>📤 Unwrap Children</span>
        </button>
      {/if}
      <div class="ctx-sep"></div>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'duplicate')}>
        <span>⧉ Duplicate</span><span class="ctx-kbd">⌘D</span>
      </button>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'copy')}>
        <span>📋 Copy</span><span class="ctx-kbd">⌘C</span>
      </button>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'paste')}>
        <span>📌 Paste After</span><span class="ctx-kbd">⌘V</span>
      </button>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'save-symbol')}>
        <span>★ Save as Reusable Symbol</span>
      </button>
      <div class="ctx-sep"></div>
      <button type="button" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'hide')}>
        <span>👁 Hide Element</span>
      </button>
      <button type="button" class="ctx-item ctx-item--danger" onclick={() => handleNodeAction(contextMenu!.node.id, 'delete')}>
        <span>✕ Delete</span><span class="ctx-kbd">⌫</span>
      </button>
    </div>
  {/if}
</div>

<style>
  .preview-root {
    min-height: 100vh;
    background-color: var(--md-sys-color-surface, #FAF9FD);
    color: var(--md-sys-color-on-surface, #1B1B1F);
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
    user-select: none;
  }
  .canvas-context-menu {
    position: fixed;
    z-index: 9999;
    width: 210px;
    background-color: #1D2024;
    color: #E2E2E6;
    border: 1px solid #44474F;
    border-radius: 8px;
    padding: 4px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    display: flex;
    flex-direction: column;
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
  }
  .ctx-header {
    padding: 6px 10px;
    font-size: 0.6875rem;
    font-weight: 700;
    color: #A8C7FA;
    border-bottom: 1px solid #32353A;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ctx-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    font-size: 0.75rem;
    color: #E2E2E6;
    border-radius: 4px;
    text-align: left;
  }
  .ctx-item:hover {
    background-color: #32353A;
  }
  .ctx-item--danger {
    color: #FFB4AB;
  }
  .ctx-item--danger:hover {
    background-color: #93000A;
    color: #FFDAD6;
  }
  .ctx-kbd {
    font-family: var(--md-sys-font-mono, monospace);
    font-size: 0.625rem;
    color: #8E9199;
  }
  .ctx-sep {
    height: 1px;
    background-color: #32353A;
    margin: 3px 0;
  }
</style>
