<script lang="ts">
  import TopToolbar from '#lib/components/TopToolbar.svelte';
  import LeftSidebar from '#lib/components/LeftSidebar.svelte';
  import CanvasArea from '#lib/components/CanvasArea.svelte';
  import RightInspector from '#lib/components/RightInspector.svelte';
  import CommandPalette from '#lib/components/CommandPalette.svelte';
  import TemplateLibraryModal from '#lib/components/TemplateLibraryModal.svelte';
  import NavigatorModal from '#lib/components/NavigatorModal.svelte';
  import BuildSpecExportModal from '#lib/components/BuildSpecExportModal.svelte';
  import ProjectLibraryModal from '#lib/components/ProjectLibraryModal.svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { onMount } from 'svelte';

  /** True when focus is in a control that owns its own keyboard behaviour. */
  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function isInteractiveTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && (isEditableTarget(target) || target.tagName === 'BUTTON' || target.tagName === 'A');
  }

  function hasTextSelection(): boolean {
    const sel = window.getSelection();
    return Boolean(sel && !sel.isCollapsed && sel.toString().trim());
  }

  /** Closes the top-most overlay. Returns true if something was closed. */
  function closeTopOverlay(): boolean {
    if (editor.showExportDialog) return !(editor.showExportDialog = false);
    if (editor.showProjectLibrary) return !(editor.showProjectLibrary = false);
    if (editor.showCommandPalette) return !(editor.showCommandPalette = false);
    if (editor.showBlockLibraryModal) return !(editor.showBlockLibraryModal = false);
    if (editor.showNavigator) return !(editor.showNavigator = false);
    return false;
  }

  onMount(() => {
    void editor.init();

    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'k') {
        e.preventDefault();
        editor.showCommandPalette = !editor.showCommandPalette;
        return;
      }
      if (mod && key === 's') {
        e.preventDefault();
        void editor.saveNow().then(() => editor.saveStatus === 'saved' && editor.notify('success', 'Saved.', 1500));
        return;
      }
      if (mod && key === 'e') {
        e.preventDefault();
        editor.showExportDialog = true;
        return;
      }
      if (mod && key === 'i') {
        e.preventDefault();
        editor.showNavigator = !editor.showNavigator;
        return;
      }
      if (e.key === 'Escape') {
        if (closeTopOverlay()) {
          e.preventDefault();
          return;
        }
        if (!isEditableTarget(e.target)) editor.selectNode(null);
        return;
      }

      if (mod && key === 'z') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        if (e.shiftKey) editor.redo();
        else editor.undo();
        return;
      }
      if (mod && key === 'y') {
        if (isEditableTarget(e.target)) return;
        e.preventDefault();
        editor.redo();
        return;
      }

      if (isEditableTarget(e.target)) return;

      if (mod && key === 'd') {
        e.preventDefault();
        editor.duplicateSelectedNode();
      } else if (mod && key === 'c') {
        if (hasTextSelection()) return; // let the browser copy selected text
        e.preventDefault();
        if (e.shiftKey) editor.copyNodeStyle();
        else editor.copySelectedNode();
      } else if (mod && key === 'v') {
        e.preventDefault();
        if (e.shiftKey) editor.pasteNodeStyle();
        else editor.pasteNode();
      } else if (e.altKey && e.key === 'ArrowUp') {
        e.preventDefault();
        editor.reorderSelectedNode('up');
      } else if (e.altKey && e.key === 'ArrowDown') {
        e.preventDefault();
        editor.reorderSelectedNode('down');
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && !isInteractiveTarget(e.target)) {
        if (editor.selectedNodeId && !editor.isInteractiveMode) {
          e.preventDefault();
          editor.deleteSelectedNode();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });
</script>

<svelte:head>
  <title>{editor.blueprint.meta.name} — Visual Builder</title>
</svelte:head>

<div class="studio-app studio-app--{editor.studioTheme}">
  <TopToolbar />

  {#if editor.externalChange}
    <div class="studio-banner" role="status">
      <span>This project was changed in another tab.</span>
      <button type="button" class="studio-btn" onclick={() => editor.reloadFromStorage()}>Load latest</button>
      <button type="button" class="studio-btn" onclick={() => { editor.externalChange = false; void editor.saveNow(); }}>Keep mine</button>
    </div>
  {/if}

  {#if editor.ready}
    <div class="studio-workspace" style={editor.isInteractiveMode ? 'grid-template-columns: 1fr;' : ''}>
      {#if !editor.isInteractiveMode}
        <LeftSidebar />
      {/if}
      <CanvasArea />
      {#if !editor.isInteractiveMode}
        <RightInspector />
      {/if}
    </div>
  {:else}
    <div class="studio-loading" aria-busy="true" aria-live="polite">Loading your projects…</div>
  {/if}

  <CommandPalette />
  <TemplateLibraryModal />
  <NavigatorModal />
  <BuildSpecExportModal />
  <ProjectLibraryModal />

  <div class="studio-notices" aria-live="polite" aria-relevant="additions">
    {#each editor.notices as notice (notice.id)}
      <div class="studio-notice studio-notice--{notice.kind}" role={notice.kind === 'error' ? 'alert' : 'status'}>
        <span>{notice.message}</span>
        <button type="button" aria-label="Dismiss notification" onclick={() => editor.dismissNotice(notice.id)}>✕</button>
      </div>
    {/each}
  </div>
</div>

<style>
  .studio-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 8px 8px;
    padding: 0.5rem 0.9rem;
    border-radius: 14px;
    font-size: 0.8125rem;
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  .studio-loading {
    flex: 1;
    display: grid;
    place-items: center;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.875rem;
  }
  .studio-notices {
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 300;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(36rem, calc(100vw - 2rem));
    pointer-events: none;
  }
  .studio-notice {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.9rem 0.7rem 1rem;
    border-radius: 14px;
    font-size: 0.8125rem;
    background: var(--md-sys-color-inverse-surface, #2f3033);
    color: var(--md-sys-color-inverse-on-surface, #f1f0f4);
    box-shadow: var(--md-sys-elevation-level3, 0 8px 24px rgba(0, 0, 0, 0.25));
  }
  .studio-notice--error {
    background: var(--md-sys-color-error-container);
    color: var(--md-sys-color-on-error-container);
  }
  .studio-notice--warning {
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
  }
  .studio-notice button {
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    color: inherit;
    flex-shrink: 0;
  }
</style>
