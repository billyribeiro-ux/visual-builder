<script lang="ts">
  import TopToolbar from '#lib/components/TopToolbar.svelte';
  import LeftSidebar from '#lib/components/LeftSidebar.svelte';
  import CanvasArea from '#lib/components/CanvasArea.svelte';
  import RightInspector from '#lib/components/RightInspector.svelte';
  import CommandPalette from '#lib/components/CommandPalette.svelte';
  import TemplateLibraryModal from '#lib/components/TemplateLibraryModal.svelte';
  import NavigatorModal from '#lib/components/NavigatorModal.svelte';
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        editor.showCommandPalette = !editor.showCommandPalette;
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        editor.showNavigator = !editor.showNavigator;
        return;
      }

      if (e.key === 'Escape' && (editor.showCommandPalette || editor.showBlockLibraryModal)) {
        e.preventDefault();
        editor.showCommandPalette = false;
        editor.showBlockLibraryModal = false;
        return;
      }

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
        if (e.shiftKey) {
          editor.copyNodeStyle();
        } else {
          editor.copySelectedNode();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        if (e.shiftKey) {
          editor.pasteNodeStyle();
        } else {
          editor.pasteNode();
        }
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

  <!-- Main Studio Workspace Grid (Full-Screen Canvas in Interactive Preview Mode) -->
  <div
    class="studio-workspace"
    style={editor.isInteractiveMode ? 'grid-template-columns: 1fr;' : ''}
  >
    {#if !editor.isInteractiveMode}
      <!-- Left Elementor Widget & Route Drawer -->
      <LeftSidebar />
    {/if}

    <!-- Center Interactive Responsive Canvas -->
    <CanvasArea />

    {#if !editor.isInteractiveMode}
      <!-- Right Content / Style / Advanced Inspector -->
      <RightInspector />
    {/if}
  </div>

  <!-- Universal Cmd+K Command Palette & AI Section Composer -->
  <CommandPalette />

  <!-- Elementor Pro Block & Page Template Library Modal -->
  <TemplateLibraryModal />

  <!-- Elementor Pro Floating Structure Navigator (Cmd+I) -->
  <NavigatorModal />
</div>
