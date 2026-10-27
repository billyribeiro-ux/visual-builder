<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import type { BlueprintNode, PageRoute } from '@app-viz/schema';
  import { onMount } from 'svelte';

  let iframeElement: HTMLIFrameElement | null = $state(null);
  let isIframeLoaded = $state(false);

  const breakpointWidths = {
    mobile: '375px',
    tablet: '768px',
    desktop: '1280px',
    wide: '1440px'
  };

  const canvasWidth = $derived(breakpointWidths[editor.activeBreakpoint] || '1280px');

  interface RouteFlowSummary {
    page: PageRoute;
    layoutName: string | null;
    componentCount: number;
    topSections: { id: string; name: string; type: string }[];
    outgoingRoutes: string[];
    interactiveActions: string[];
  }

  function countNodes(node: BlueprintNode): number {
    let total = 1;
    for (const c of node.children || []) {
      total += countNodes(c);
    }
    return total;
  }

  function collectRouteConnections(
    node: BlueprintNode,
    routes: Set<string>,
    actions: string[]
  ) {
    const props = node.props || {};
    for (const [k, v] of Object.entries(props)) {
      if ((k.toLowerCase().includes('href') || k === 'path') && typeof v === 'string') {
        if (v.startsWith('/') && !v.startsWith('//')) {
          routes.add(v.split('#')[0] || '/');
        }
      }
      if (k === 'links' && Array.isArray(v)) {
        for (const item of v) {
          if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).href === 'string') {
            const href = (item as Record<string, string>).href;
            if (href.startsWith('/')) routes.add(href.split('#')[0] || '/');
          }
        }
      }
    }

    for (const rule of node.interactions || []) {
      const act = rule.actionType || rule.action?.type;
      const p = (rule.payload || rule.action?.payload || {}) as Record<string, string>;
      if (act === 'navigate' && (p.path || p.targetPath)) {
        routes.add(p.path || p.targetPath);
        actions.push(`${node.name} → Navigate (${p.path || p.targetPath})`);
      } else if (act === 'openModal' || act === 'open_modal') {
        actions.push(`${node.name} → Modal (${p.modalTitle || 'Dialog'})`);
      } else if (act === 'toggleDrawer') {
        actions.push(`${node.name} → Drawer (${p.drawerTitle || 'Sheet'})`);
      } else if (act === 'showToast' || act === 'show_toast') {
        actions.push(`${node.name} → Toast`);
      } else if (act === 'setState' || act === 'toggle_state') {
        actions.push(`${node.name} → State (${p.stateKey || 'status'})`);
      }
    }

    for (const c of node.children || []) {
      collectRouteConnections(c, routes, actions);
    }
  }

  const routeFlowSummaries = $derived.by<RouteFlowSummary[]>(() => {
    return editor.blueprint.pages.map((page) => {
      const layout = page.layoutId
        ? editor.blueprint.layouts.find((l) => l.id === page.layoutId)
        : undefined;
      const routes = new Set<string>();
      const actions: string[] = [];
      collectRouteConnections(page.rootNode, routes, actions);
      if (layout) {
        collectRouteConnections(layout.rootNode, routes, actions);
      }
      routes.delete(page.path);

      return {
        page,
        layoutName: layout ? layout.name : null,
        componentCount: countNodes(page.rootNode),
        topSections: (page.rootNode.children || []).map((c) => ({
          id: c.id,
          name: c.name,
          type: c.componentType
        })),
        outgoingRoutes: Array.from(routes),
        interactiveActions: actions
      };
    });
  });

  // Synchronize blueprint state with iframe via postMessage
  $effect(() => {
    if (iframeElement && iframeElement.contentWindow && isIframeLoaded && editor.canvasViewMode === 'canvas') {
      iframeElement.contentWindow.postMessage(
        {
          type: 'SYNC_STATE',
          blueprint: $state.snapshot(editor.blueprint),
          activePageId: editor.activePageId,
          selectedNodeId: editor.selectedNodeId,
          isInteractiveMode: editor.isInteractiveMode,
          activeBreakpoint: editor.activeBreakpoint
        },
        window.location.origin
      );
    }
  });

  onMount(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'PREVIEW_READY') {
        isIframeLoaded = true;
      } else if (data.type === 'SELECT_NODE') {
        editor.selectNode(data.nodeId);
      } else if (data.type === 'NAVIGATE_PAGE') {
        const targetPage = editor.blueprint.pages.find((p) => p.path === data.path);
        if (targetPage) {
          editor.setActivePage(targetPage.id);
        }
      } else if (data.type === 'INLINE_PROP_EDIT') {
        const { nodeId, propKey, value } = data;
        if (nodeId && propKey && typeof value === 'string') {
          editor.dispatch({
            type: 'UPDATE_PROPS',
            nodeId,
            props: { [propKey]: value }
          });
        }
      } else if (data.type === 'RESIZE_NODE_STYLE') {
        const { nodeId, styles } = data;
        if (nodeId && styles && typeof styles === 'object') {
          editor.dispatch({
            type: 'UPDATE_STYLES',
            nodeId,
            breakpoint: 'base',
            styles
          });
        }
      } else if (data.type === 'NODE_ACTION') {
        const { nodeId, action } = data;
        if (action === 'up' || action === 'down') {
          editor.dispatch({ type: 'REORDER_NODE', nodeId, direction: action });
        } else if (action === 'duplicate') {
          editor.dispatch({ type: 'DUPLICATE_NODE', nodeId });
        } else if (action === 'delete') {
          editor.dispatch({ type: 'DELETE_NODE', nodeId });
          if (editor.selectedNodeId === nodeId) editor.selectNode(null);
        } else if (action === 'wrap-section') {
          editor.wrapNode(nodeId, 'structure/section');
        } else if (action === 'wrap-container') {
          editor.wrapNode(nodeId, 'structure/container');
        } else if (action === 'unwrap') {
          editor.unwrapNode(nodeId);
        } else if (action === 'copy') {
          editor.selectNode(nodeId);
          editor.copySelectedNode();
        } else if (action === 'paste') {
          editor.pasteNode(nodeId);
        } else if (action === 'save-symbol') {
          editor.selectNode(nodeId);
          editor.saveSelectedNodeAsSymbol();
        } else if (action === 'hide') {
          editor.dispatch({ type: 'UPDATE_NODE_META', nodeId, meta: { hidden: true } });
        }
      } else if (data.type === 'DROP_ITEM') {
        const { componentType, draggedNodeId, targetNodeId, position } = data;
        if (componentType) {
          editor.dropComponentOnTarget(componentType, targetNodeId, position);
        } else if (draggedNodeId) {
          editor.dropNodeOnTarget(draggedNodeId, targetNodeId, position);
        }
      } else if (data.type === 'KEY_SHORTCUT') {
        const { shortcut } = data;
        if (shortcut === 'undo') editor.undo();
        else if (shortcut === 'redo') editor.redo();
        else if (shortcut === 'duplicate') editor.duplicateSelectedNode();
        else if (shortcut === 'copy') editor.copySelectedNode();
        else if (shortcut === 'paste') editor.pasteNode();
        else if (shortcut === 'delete') editor.deleteSelectedNode();
        else if (shortcut === 'escape') editor.selectNode(null);
        else if (shortcut === 'command-palette') {
          editor.showCommandPalette = !editor.showCommandPalette;
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  });
</script>

<main class="studio-canvas-area">
  <!-- Viewport Rulers, Breadcrumb Bar & Mode Indicator -->
  <div class="canvas-badge-bar">
    <span class="viewport-badge">
      {editor.canvasViewMode === 'flow'
        ? `APP FLOW MAP • ${editor.blueprint.pages.length} ROUTES`
        : `${editor.activeBreakpoint.toUpperCase()} • ${canvasWidth}`}
    </span>
    <span class="dot-separator">•</span>
    <span class="mode-text">
      {#if editor.canvasViewMode === 'flow'}
        Visual Route Architecture, Shared Layouts &amp; Declarative Navigation Graph
      {:else if editor.isInteractiveMode}
        Interactive Preview (Live App — Click Links, Modals, Drawers &amp; Forms)
      {:else}
        Design Mode (Click to Select • Double-Click Text to Edit Inline • Drag Handles to Resize)
      {/if}
    </span>

    {#if editor.selectedNodeBreadcrumb.length > 0 && !editor.isInteractiveMode && editor.canvasViewMode === 'canvas'}
      <span class="dot-separator">•</span>
      <nav aria-label="Selected element path" class="breadcrumb-nav">
        {#each editor.selectedNodeBreadcrumb as crumb, idx (crumb.id)}
          {#if idx > 0}
            <span class="breadcrumb-sep">›</span>
          {/if}
          <button
            type="button"
            onclick={() => editor.selectNode(crumb.id)}
            class="breadcrumb-btn {crumb.id === editor.selectedNodeId ? 'breadcrumb-btn--active' : ''}"
          >
            {crumb.name}
          </button>
        {/each}
      </nav>
    {/if}
  </div>

  {#if editor.canvasViewMode === 'flow'}
    <!-- Interactive App Route & Architecture Flow Map -->
    <div class="flow-map-container">
      <!-- Shared Layouts Banner -->
      <div class="flow-layouts-row">
        {#each editor.blueprint.layouts as layout (layout.id)}
          <div class="flow-layout-card">
            <div class="flow-layout-header">
              <span class="flow-badge flow-badge--layout">SHARED LAYOUT</span>
              <span class="flow-layout-title">{layout.name}</span>
            </div>
            <p class="flow-layout-sub">
              Wraps public routes automatically via <code>&lt;Slot name="children" /&gt;</code>
            </p>
            <div class="flow-section-pills">
              {#each layout.rootNode.children || [] as lChild (lChild.id)}
                <button
                  type="button"
                  onclick={() => {
                    editor.selectNode(lChild.id);
                    editor.canvasViewMode = 'canvas';
                  }}
                  class="flow-node-pill"
                >
                  {lChild.name} (<code>{lChild.componentType}</code>)
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>

      <!-- Page Routes Graph Grid -->
      <div class="flow-routes-grid">
        {#each routeFlowSummaries as item (item.page.id)}
          {@const isActive = item.page.id === editor.activePageId}
          <div class="flow-route-card {isActive ? 'flow-route-card--active' : ''}">
            <div class="flow-route-top">
              <div>
                <span class="flow-route-path">{item.page.path}</span>
                <h3 class="flow-route-title">{item.page.title}</h3>
              </div>
              <button
                type="button"
                onclick={() => {
                  editor.setActivePage(item.page.id);
                  editor.canvasViewMode = 'canvas';
                }}
                class="studio-btn studio-btn--primary flow-open-btn"
              >
                Edit Canvas →
              </button>
            </div>

            <div class="flow-meta-row">
              <span class="flow-badge">
                {item.layoutName ? `Layout: ${item.layoutName}` : 'Standalone App Shell'}
              </span>
              <span class="flow-badge">{item.componentCount} nodes</span>
            </div>

            <div class="flow-subsection">
              <div class="flow-subtitle">Page Sections ({item.topSections.length})</div>
              <div class="flow-section-pills">
                {#each item.topSections as sec (sec.id)}
                  <button
                    type="button"
                    onclick={() => {
                      editor.setActivePage(item.page.id);
                      editor.selectNode(sec.id);
                      editor.canvasViewMode = 'canvas';
                    }}
                    class="flow-node-pill"
                  >
                    {sec.name}
                  </button>
                {/each}
              </div>
            </div>

            <div class="flow-subsection">
              <div class="flow-subtitle">Outgoing Route Links ({item.outgoingRoutes.length})</div>
              <div class="flow-edge-list">
                {#each item.outgoingRoutes as targetPath (targetPath)}
                  <button
                    type="button"
                    onclick={() => {
                      const targetPage = editor.blueprint.pages.find((p) => p.path === targetPath);
                      if (targetPage) {
                        editor.setActivePage(targetPage.id);
                      }
                    }}
                    class="flow-edge-chip"
                  >
                    ↪ {targetPath}
                  </button>
                {:else}
                  <span class="flow-empty-text">Terminal route</span>
                {/each}
              </div>
            </div>

            {#if item.interactiveActions.length > 0}
              <div class="flow-subsection">
                <div class="flow-subtitle">Declarative Interactions</div>
                <div class="flow-edge-list">
                  {#each item.interactiveActions as act (act)}
                    <span class="flow-action-chip">⚡ {act}</span>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Resizable Responsive Frame -->
    <div
      class="studio-canvas-frame"
      style="width: {canvasWidth}; min-height: 85vh; transform: scale({editor.zoom / 100}); transform-origin: top center;"
    >
      <iframe
        bind:this={iframeElement}
        src="/preview"
        title="Live Svelte 5 Preview Canvas"
        class="canvas-iframe"
      ></iframe>
    </div>
  {/if}
</main>

<style>
  .canvas-badge-bar {
    margin-bottom: 0.75rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.625rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    user-select: none;
  }
  .viewport-badge {
    font-family: var(--md-sys-font-mono);
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    color: var(--md-sys-color-on-surface);
  }
  .dot-separator {
    color: var(--md-sys-color-outline);
  }
  .mode-text {
    color: var(--md-sys-color-on-surface-variant);
  }
  .breadcrumb-nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    padding: 0.125rem 0.5rem;
    border-radius: 6px;
  }
  .breadcrumb-sep {
    color: var(--md-sys-color-outline);
    font-size: 0.75rem;
  }
  .breadcrumb-btn {
    background: transparent;
    border: none;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
  }
  .breadcrumb-btn:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high);
  }
  .breadcrumb-btn--active {
    color: var(--md-sys-color-on-primary-container);
    background-color: var(--md-sys-color-primary-container);
    font-weight: 600;
  }
  .canvas-iframe {
    width: 100%;
    height: 85vh;
    border: 0;
    display: block;
  }
  .flow-map-container {
    width: 100%;
    max-width: 1240px;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding-bottom: 2rem;
  }
  .flow-layouts-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .flow-layout-card {
    background: var(--md-sys-color-surface-container);
    border: 1px dashed var(--md-sys-color-primary);
    border-radius: 14px;
    padding: 1rem 1.25rem;
  }
  .flow-layout-header {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin-bottom: 0.25rem;
  }
  .flow-layout-title {
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .flow-layout-sub {
    margin: 0 0 0.75rem 0;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .flow-routes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1rem;
  }
  .flow-route-card {
    background: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 16px;
    padding: 1.125rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    box-shadow: var(--md-sys-elevation-level1);
  }
  .flow-route-card--active {
    border-color: var(--md-sys-color-primary);
    box-shadow: 0 0 0 2px var(--md-sys-color-primary-container);
  }
  .flow-route-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .flow-route-path {
    display: inline-block;
    font-family: var(--md-sys-font-mono);
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--md-sys-color-primary);
    background: var(--md-sys-color-surface-container-highest);
    padding: 0.125rem 0.5rem;
    border-radius: 6px;
    margin-bottom: 0.25rem;
  }
  .flow-route-title {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .flow-open-btn {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    flex-shrink: 0;
  }
  .flow-meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .flow-badge {
    font-size: 0.6875rem;
    font-weight: 600;
    padding: 0.125rem 0.5rem;
    border-radius: 9999px;
    background: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
  }
  .flow-badge--layout {
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .flow-subsection {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .flow-subtitle {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--md-sys-color-on-surface-variant);
  }
  .flow-section-pills,
  .flow-edge-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .flow-node-pill {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
  }
  .flow-node-pill:hover {
    border-color: var(--md-sys-color-primary);
  }
  .flow-edge-chip {
    font-size: 0.75rem;
    font-family: var(--md-sys-font-mono);
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--md-sys-color-primary);
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    cursor: pointer;
  }
  .flow-action-chip {
    font-size: 0.6875rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  .flow-empty-text {
    font-size: 0.75rem;
    color: var(--md-sys-color-outline);
    font-style: italic;
  }
</style>
