<script lang="ts">
  import { onMount } from 'svelte';
  import { type ProjectBlueprint, createDefaultAcmeSaaSProject } from '@app-viz/schema';
  import PreviewRenderer from '#lib/components/PreviewRenderer.svelte';

  let blueprint = $state<ProjectBlueprint>(createDefaultAcmeSaaSProject());
  let activePageId = $state<string>('10000000-0000-0000-0000-000000000001');
  let selectedNodeId = $state<string | null>(null);
  let isInteractiveMode = $state<boolean>(false);

  const activePage = $derived(
    blueprint.pages.find((p) => p.id === activePageId) || blueprint.pages[0]
  );

  // Injects CSS variables for design tokens dynamically into :root
  $effect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [key, val] of Object.entries(blueprint.tokens.colors || {})) {
        root.style.setProperty(`--color-${key}`, val);
      }
      for (const [key, val] of Object.entries(blueprint.tokens.radii || {})) {
        root.style.setProperty(`--radius-${key}`, val);
      }
      root.style.setProperty('--font-heading', blueprint.tokens.fonts?.heading || 'sans-serif');
      root.style.setProperty('--font-body', blueprint.tokens.fonts?.body || 'sans-serif');
    }
  });

  onMount(() => {
    // Notify parent studio that preview iframe is ready
    window.parent.postMessage({ type: 'PREVIEW_READY' }, window.location.origin);

    function handleParentMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'SYNC_STATE') {
        blueprint = data.blueprint;
        activePageId = data.activePageId;
        selectedNodeId = data.selectedNodeId;
        isInteractiveMode = data.isInteractiveMode;
      }
    }

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  });

  function handleSelectNode(nodeId: string) {
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
</script>

<svelte:head>
  <title>{activePage?.title || 'Preview'}</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] select-none">
  {#if activePage}
    <PreviewRenderer
      node={activePage.rootNode}
      {selectedNodeId}
      {isInteractiveMode}
      onSelectNode={handleSelectNode}
      onNavigate={handleNavigate}
    />
  {/if}
</div>
