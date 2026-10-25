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
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  });
</script>

<main class="flex-1 bg-slate-950 flex flex-col items-center justify-start p-6 overflow-auto relative">
  <!-- Viewport Rulers & Dimensions Badge -->
  <div class="mb-3 flex items-center gap-3 text-xs text-slate-400 select-none">
    <span class="font-mono bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[11px]">
      Viewport: {canvasWidth} × 100%
    </span>
    <span class="text-slate-600">•</span>
    <span>{editor.isInteractiveMode ? 'Interactions Active (Real Click & Scroll)' : 'Edit Mode (Click to Select Elements)'}</span>
  </div>

  <!-- Resizable Responsive Frame -->
  <div
    class="bg-white rounded-lg shadow-2xl transition-all duration-200 overflow-hidden border border-slate-800 relative"
    style="width: {canvasWidth}; min-height: 85vh; transform: scale({editor.zoom / 100}); transform-origin: top center;"
  >
    <iframe
      bind:this={iframeElement}
      src="/preview"
      title="Live Svelte 5 Preview Canvas"
      class="w-full h-full min-h-[85vh] border-0 bg-white"
    ></iframe>
  </div>
</main>
