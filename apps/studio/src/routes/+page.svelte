<script lang="ts">
  import TopToolbar from '#lib/components/TopToolbar.svelte';
  import LeftSidebar from '#lib/components/LeftSidebar.svelte';
  import CanvasArea from '#lib/components/CanvasArea.svelte';
  import RightInspector from '#lib/components/RightInspector.svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { onMount } from 'svelte';

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
      } else if (e.key === 'Escape') {
        editor.selectNode(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<svelte:head>
  <title>Svelte Visual Studio — {editor.blueprint.meta.name}</title>
</svelte:head>

<div class="studio-app">
  <!-- Top Control Bar -->
  <TopToolbar />

  <!-- Main Studio Workspace Grid -->
  <div class="studio-workspace">
    <!-- Left Navigation & Library Drawer -->
    <LeftSidebar />

    <!-- Center Interactive Responsive Canvas -->
    <CanvasArea />

    <!-- Right Property & Event Inspector -->
    <RightInspector />
  </div>
</div>
