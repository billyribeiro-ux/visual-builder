<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
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

  // Synchronize blueprint state with iframe via postMessage
  $effect(() => {
    if (iframeElement && iframeElement.contentWindow && isIframeLoaded) {
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
      } else if (data.type === 'NODE_ACTION') {
        const { nodeId, action } = data;
        if (action === 'up' || action === 'down') {
          editor.dispatch({ type: 'REORDER_NODE', nodeId, direction: action });
        } else if (action === 'duplicate') {
          editor.dispatch({ type: 'DUPLICATE_NODE', nodeId });
        } else if (action === 'delete') {
          editor.dispatch({ type: 'DELETE_NODE', nodeId });
          if (editor.selectedNodeId === nodeId) editor.selectNode(null);
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
      {editor.activeBreakpoint.toUpperCase()} • {canvasWidth}
    </span>
    <span class="dot-separator">•</span>
    <span class="mode-text">
      {editor.isInteractiveMode ? 'Interactive Preview (Live App)' : 'Design Mode (Click to Inspect)'}
    </span>

    {#if editor.selectedNodeBreadcrumb.length > 0 && !editor.isInteractiveMode}
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
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface);
  }
  .dot-separator {
    color: var(--md-sys-color-outline);
  }
  .mode-text {
    font-weight: 500;
  }
  .breadcrumb-nav {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-full);
    padding: 0.125rem 0.5rem;
  }
  .breadcrumb-sep {
    color: var(--md-sys-color-outline);
    font-size: 0.75rem;
  }
  .breadcrumb-btn {
    background: transparent;
    border: none;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    padding: 0.125rem 0.375rem;
    border-radius: var(--md-sys-shape-corner-full);
    cursor: pointer;
  }
  .breadcrumb-btn:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high);
  }
  .breadcrumb-btn--active {
    color: var(--md-sys-color-primary);
    font-weight: 600;
  }
  .canvas-iframe {
    width: 100%;
    height: 100%;
    min-height: 85vh;
    border: none;
    background-color: #FFFFFF;
    display: block;
  }
</style>
