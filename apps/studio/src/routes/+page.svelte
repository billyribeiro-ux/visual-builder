<script lang="ts">
  import '#lib/styles/studio.css';
  import TopToolbar from '#lib/components/TopToolbar.svelte';
  import LeftSidebar from '#lib/components/LeftSidebar.svelte';
  import CanvasArea from '#lib/components/CanvasArea.svelte';
  import RightInspector from '#lib/components/RightInspector.svelte';
  import CommandPalette from '#lib/components/CommandPalette.svelte';
  import TemplateLibraryModal from '#lib/components/TemplateLibraryModal.svelte';
  import NavigatorModal from '#lib/components/NavigatorModal.svelte';
  import BuildSpecExportModal from '#lib/components/BuildSpecExportModal.svelte';
  import ProjectLibraryModal from '#lib/components/ProjectLibraryModal.svelte';
  import PreflightDialog from '#lib/components/PreflightDialog.svelte';
  import CodeViewDialog from '#lib/components/CodeViewDialog.svelte';
  import ShortcutsDialog from '#lib/components/ShortcutsDialog.svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { onMount } from 'svelte';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';

  const NOTICE_ICONS = {
    success: CheckCircleIcon,
    error: WarningCircleIcon,
    warning: WarningIcon,
    info: InfoIcon
  } as const;

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
    if (editor.showShortcuts) return !(editor.showShortcuts = false);
    if (editor.showCodeView) return !(editor.showCodeView = false);
    if (editor.showPreflight) return !(editor.showPreflight = false);
    if (editor.showExportDialog) return !(editor.showExportDialog = false);
    if (editor.showProjectLibrary) return !(editor.showProjectLibrary = false);
    if (editor.showCommandPalette) return !(editor.showCommandPalette = false);
    if (editor.showBlockLibraryModal) return !(editor.showBlockLibraryModal = false);
    if (editor.showNavigator) return !(editor.showNavigator = false);
    return false;
  }

  const anyOverlayOpen = $derived(
    editor.showShortcuts ||
      editor.showCodeView ||
      editor.showPreflight ||
      editor.showExportDialog ||
      editor.showProjectLibrary ||
      editor.showCommandPalette ||
      editor.showBlockLibraryModal
  );

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
    if (mod && (key === '=' || key === '+')) {
      e.preventDefault();
      editor.stepZoom(1);
      return;
    }
    if (mod && key === '-') {
      e.preventDefault();
      editor.stepZoom(-1);
      return;
    }
    if (e.key === 'Escape') {
      if (closeTopOverlay()) {
        e.preventDefault();
        return;
      }
      if (editor.isInteractiveMode && !isEditableTarget(e.target)) {
        editor.toggleInteractiveMode();
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

    // Single-key and shifted shortcuts (never while typing; never while a dialog is open).
    if (!mod && !e.altKey && !anyOverlayOpen) {
      if (e.shiftKey && e.code === 'Digit1') {
        e.preventDefault();
        editor.zoomToFit();
        return;
      }
      if (e.shiftKey && e.code === 'Digit0') {
        e.preventDefault();
        editor.setZoom(100);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        editor.showShortcuts = true;
        return;
      }
      // Tree navigation only when nothing in the chrome has focus (Tab stays a focus key there).
      if (e.key === 'Enter' && editor.selectedNodeId && document.activeElement === document.body && !editor.isInteractiveMode) {
        e.preventDefault();
        if (e.shiftKey) editor.selectParent();
        else editor.selectFirstChild();
        return;
      }
      if (!e.shiftKey) {
        const panel = ({ a: 'library', l: 'layers', g: 'pages', m: 'assets', s: 'tokens' } as const)[key as 'a' | 'l' | 'g' | 'm' | 's'];
        if (panel) {
          e.preventDefault();
          editor.openLeftTab(panel);
          return;
        }
        if (key === 'p') {
          e.preventDefault();
          editor.toggleInteractiveMode();
          return;
        }
      }
    }

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

  onMount(() => {
    void editor.init();
  });
</script>

<svelte:window onkeydown={handleKeyDown} />

<svelte:head>
  <title>{editor.blueprint.meta.name} · Studio</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    rel="stylesheet"
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
  />
</svelte:head>

<div class="sx" data-theme={editor.studioTheme}>
  <TopToolbar />

  {#if editor.ready}
    <div class={['sx-workspace', editor.isInteractiveMode && 'sx-workspace--preview']}>
      {#if !editor.isInteractiveMode}
        <LeftSidebar />
      {/if}
      <CanvasArea />
      {#if !editor.isInteractiveMode}
        <RightInspector />
      {/if}
    </div>
  {:else}
    <div class="sx-boot" aria-busy="true" aria-live="polite">
      <span class="sx-boot__spinner"></span>
      <span>Opening your workspace…</span>
    </div>
  {/if}

  <CommandPalette />
  <TemplateLibraryModal />
  <NavigatorModal />
  <BuildSpecExportModal />
  <ProjectLibraryModal />
  <PreflightDialog />
  <CodeViewDialog />
  <ShortcutsDialog />

  <div class="sx-toasts" aria-live="polite" aria-relevant="additions">
    {#each editor.notices as notice (notice.id)}
      {@const Icon = NOTICE_ICONS[notice.kind]}
      <div class={['sx-toast', `sx-toast--${notice.kind}`]} role={notice.kind === 'error' ? 'alert' : 'status'}>
        <span class="sx-toast__icon"><Icon size={16} weight="fill" /></span>
        <span class="sx-toast__msg">{notice.message}</span>
        <button type="button" class="sx-icon-btn sx-icon-btn--sm" aria-label="Dismiss notification" onclick={() => editor.dismissNotice(notice.id)}>
          <XIcon size={12} />
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  .sx-boot {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--sx-text-2);
    font-size: var(--sx-text-md);
  }
  .sx-boot__spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--sx-border-strong);
    border-top-color: var(--sx-accent);
    animation: sx-spin 0.8s linear infinite;
  }
  @keyframes sx-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
