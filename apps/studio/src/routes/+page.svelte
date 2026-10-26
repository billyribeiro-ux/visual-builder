<script lang="ts">
  import TopToolbar from '#lib/components/TopToolbar.svelte';
  import LeftSidebar from '#lib/components/LeftSidebar.svelte';
  import CanvasArea from '#lib/components/CanvasArea.svelte';
  import RightInspector from '#lib/components/RightInspector.svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { onMount } from 'svelte';

  function isFormInputFocused(target: EventTarget | null): boolean {
    if (!target || !(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  }

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (isFormInputFocused(e.target)) return;
        e.preventDefault();
        if (e.shiftKey) {
          editor.redo();
        } else {
          editor.undo();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        if (isFormInputFocused(e.target)) return;
        e.preventDefault();
        editor.redo();
        return;
      }

      if (isFormInputFocused(e.target)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        editor.duplicateSelectedNode();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        editor.copySelectedNode();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        editor.pasteNode();
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        editor.reorderSelectedNode('up');
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        editor.reorderSelectedNode('down');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (editor.selectedNodeId && !editor.isInteractiveMode) {
          e.preventDefault();
          editor.deleteSelectedNode();
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
