<script lang="ts">
  // Site runtime: the same stylesheet every exported app ships (scoped under .site-root).
  import '@app-viz/components/svelte/runtime.css';
  import { onMount } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import {
    type ProjectBlueprint,
    ProjectBlueprintSchema,
    createDefaultAcmeSaaSProject
  } from '@app-viz/schema';
  import { compileNodeCss, compileTokenCss, findNodeInBlueprint, googleFontsHref } from '@app-viz/engine';
  import {
    NAVIGATE_EVENT,
    collectInteractionRules,
    isContainerType,
    isLayoutInnerType,
    type NavigateEventDetail
  } from '@app-viz/components';
  import InteractionLayer from '@app-viz/components/svelte/lib/InteractionLayer.svelte';
  import PreviewRenderer from '#lib/components/PreviewRenderer.svelte';
  import EditorOverlay, { type OverlayNodeInfo } from '#lib/canvas/EditorOverlay.svelte';
  import ContextMenu from '#lib/canvas/ContextMenu.svelte';
  import StructurePicker from '#lib/canvas/StructurePicker.svelte';
  import AddSectionZone from '#lib/canvas/AddSectionZone.svelte';
  import { setCanvasActions } from '#lib/canvas/canvas-context.js';
  import { buildAssetUrlMap, rewriteCssAssetUrls, setAssetUrls } from '#lib/canvas/assets.js';
  import { createGalleryBlueprint } from '#lib/canvas/gallery.js';
  import {
    NON_MUTATING_NODE_ACTIONS,
    classifyHref,
    parseParentMessage,
    type DropPosition,
    type KeyShortcut,
    type NodeQuickAction,
    type PreviewToParentMessage
  } from '#lib/canvas/messages.js';

  // Replaced wholesale on every SYNC_STATE, never mutated in place.
  const standaloneParams = window.parent === window ? new URLSearchParams(window.location.search) : null;
  let blueprint = $state.raw<ProjectBlueprint>(
    standaloneParams?.has('gallery') ? createGalleryBlueprint(standaloneParams.get('category')) : createDefaultAcmeSaaSProject()
  );
  /**
   * Standalone only: `/preview?path=/pricing` opens that page of the demo project (used by the
   * visual parity script). Inside the studio, SYNC_STATE always decides the page.
   */
  function initialPageId(): string {
    const fallback = blueprint.pages[0]?.id ?? '';
    if (window.parent !== window) return fallback;
    const wanted = new URLSearchParams(window.location.search).get('path');
    return (wanted && blueprint.pages.find((p) => p.path === wanted)?.id) || fallback;
  }
  let activePageId = $state<string>(initialPageId());
  let selectedNodeId = $state<string | null>(null);
  let externalHoverNodeId = $state<string | null>(null);
  // Standalone (/preview opened directly, no studio parent) there is nothing to edit with, so it
  // behaves as a live site preview; inside the studio iframe SYNC_STATE drives the mode.
  let isInteractiveMode = $state(window.parent === window);
  let revision = $state(0);

  let contextMenu = $state<{ nodeId: string; x: number; y: number } | null>(null);
  let picker = $state<{ targetNodeId: string | null; anchor: { top: number; left: number; bottom: number; width: number } } | null>(null);
  let notice = $state<string | null>(null);
  let noticeTimer: ReturnType<typeof setTimeout> | null = null;

  const designMode = $derived(!isInteractiveMode);
  const activePage = $derived(blueprint.pages.find((p) => p.id === activePageId) || blueprint.pages[0]);
  const activeLayout = $derived(
    activePage?.layoutId ? blueprint.layouts.find((l) => l.id === activePage.layoutId) : undefined
  );
  const renderedRoots = $derived([activeLayout?.rootNode, activePage?.rootNode]);
  const rootIds = $derived(new Set(renderedRoots.filter((n) => n !== undefined).map((n) => n.id)));

  /** Uploaded assets: `/assets/…` paths → data URLs (canvas only; the export ships the files). */
  const assetUrls = $derived(buildAssetUrlMap(blueprint.assets));
  setAssetUrls(() => assetUrls);

  /** Same compilers as the SvelteKit export: tokens + node styles, applied with native media queries. */
  const stylesheet = $derived(
    rewriteCssAssetUrls(
      `${compileTokenCss(blueprint.tokens)}\n${compileNodeCss(renderedRoots, { layoutInner: isLayoutInnerType })}`,
      assetUrls
    )
  );
  const interactionRules = $derived(collectInteractionRules(renderedRoots, blueprint.interactions));
  /** Same web-font URL the export's app.html loads for these tokens. */
  const fontsHref = $derived(googleFontsHref(blueprint.tokens.fonts));
  const contextNode = $derived(contextMenu ? getNodeInfo(contextMenu.nodeId) : null);

  /**
   * Attachment: writes the compiled stylesheet into one <style> element in <head> (via
   * textContent, so it is never parsed as HTML). Re-runs whenever `stylesheet` changes.
   */
  const applyStylesheet: Attachment = () => {
    let styleTag = document.getElementById('app-viz-node-styles');
    if (!(styleTag instanceof HTMLStyleElement)) {
      styleTag = document.createElement('style');
      styleTag.id = 'app-viz-node-styles';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = stylesheet;
  };

  setCanvasActions({
    openStructurePicker(targetNodeId, anchor) {
      contextMenu = null;
      picker = { targetNodeId, anchor: { top: anchor.top, left: anchor.left, bottom: anchor.bottom, width: anchor.width } };
    }
  });

  /* ------------------------------------------------------------------------------------ */
  /* Parent messaging                                                                     */
  /* ------------------------------------------------------------------------------------ */

  /** Typed, origin-pinned message to the studio. No-op when /preview is opened standalone. */
  function postToParent(message: PreviewToParentMessage) {
    if (window.parent === window) return;
    window.parent.postMessage(message, window.location.origin);
  }

  function sendShortcut(shortcut: KeyShortcut) {
    postToParent({ type: 'KEY_SHORTCUT', shortcut });
  }

  function handleParentMessage(event: MessageEvent) {
    if (event.origin !== window.location.origin) return;
    if (window.parent === window || event.source !== window.parent) return;
    const message = parseParentMessage(event.data);
    if (!message) return;

    if (message.type === 'PING') {
      postToParent({ type: 'PREVIEW_READY' });
      return;
    }

    const parsed = ProjectBlueprintSchema.safeParse(message.blueprint);
    if (!parsed.success) {
      console.warn('[preview] Ignoring SYNC_STATE with invalid blueprint', parsed.error.issues);
      return;
    }
    blueprint = parsed.data;
    activePageId = message.activePageId;
    selectedNodeId = message.selectedNodeId;
    externalHoverNodeId = message.hoverNodeId ?? null;
    isInteractiveMode = message.isInteractiveMode;
    revision += 1;
    if (isInteractiveMode) {
      contextMenu = null;
      picker = null;
    }
  }

  /* ------------------------------------------------------------------------------------ */
  /* Node lookups & editor actions                                                        */
  /* ------------------------------------------------------------------------------------ */

  function getNodeInfo(nodeId: string): OverlayNodeInfo | null {
    const found = findNodeInBlueprint(blueprint, nodeId);
    if (!found) return null;
    const node = found.node;
    return {
      id: node.id,
      name: node.name,
      componentType: node.componentType,
      locked: node.locked === true,
      isContainer: isContainerType(node.componentType),
      hasChildren: (node.children ?? []).length > 0,
      isRoot: rootIds.has(node.id)
    };
  }

  function isLocked(nodeId: string | null): boolean {
    return nodeId ? getNodeInfo(nodeId)?.locked === true : false;
  }

  function handleSelectNode(nodeId: string) {
    contextMenu = null;
    picker = null;
    selectedNodeId = nodeId;
    postToParent({ type: 'SELECT_NODE', nodeId });
  }

  function handleNodeAction(nodeId: string, action: NodeQuickAction) {
    contextMenu = null;
    if (!NON_MUTATING_NODE_ACTIONS.has(action) && isLocked(nodeId)) return;
    postToParent({ type: 'NODE_ACTION', nodeId, action });
  }

  function handleOpenMenu(nodeId: string, x: number, y: number) {
    picker = null;
    contextMenu = { nodeId, x, y };
  }

  function handleDrop(payload: { componentType?: string; nodeId?: string }, targetNodeId: string, position: DropPosition) {
    postToParent({
      type: 'DROP_ITEM',
      componentType: payload.componentType,
      draggedNodeId: payload.nodeId,
      targetNodeId,
      position
    });
  }

  function handleInlineEdit(nodeId: string, propKey: string, value: string) {
    if (isLocked(nodeId)) return;
    postToParent({ type: 'INLINE_PROP_EDIT', nodeId, propKey, value, final: true });
  }

  function handleResize(nodeId: string, styles: Record<string, string>) {
    if (isLocked(nodeId)) return;
    postToParent({ type: 'RESIZE_NODE_STYLE', nodeId, styles });
  }

  function handleInsertStructure(structureId: string) {
    const target = picker?.targetNodeId ?? activePage?.rootNode.id;
    picker = null;
    if (target) postToParent({ type: 'INSERT_STRUCTURE', structureId, targetNodeId: target });
  }

  function handleInsertComponent(componentType: string) {
    const target = picker?.targetNodeId ?? activePage?.rootNode.id;
    picker = null;
    if (target) postToParent({ type: 'DROP_ITEM', componentType, targetNodeId: target, position: 'inside' });
  }

  /* ------------------------------------------------------------------------------------ */
  /* Navigation (interactive mode) & link safety                                          */
  /* ------------------------------------------------------------------------------------ */

  function showNotice(message: string, durationMs = 3200) {
    if (noticeTimer !== null) clearTimeout(noticeTimer);
    notice = message;
    noticeTimer = setTimeout(() => {
      notice = null;
      noticeTimer = null;
    }, durationMs);
  }

  /** Navigates to an internal page. Returns false when no page matches `path`. */
  function navigateToPage(path: string): boolean {
    const targetPage = blueprint.pages.find((p) => p.path === path);
    if (!targetPage) return false;
    activePageId = targetPage.id;
    window.scrollTo({ top: 0 });
    postToParent({ type: 'NAVIGATE_PAGE', path });
    return true;
  }

  function scrollToFragment(fragment: string) {
    if (!fragment) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    let id = fragment;
    try {
      id = decodeURIComponent(fragment);
    } catch {
      // Malformed escape sequence: fall back to the raw fragment.
    }
    const target = document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Follows an href inside the canvas without ever navigating the iframe away. */
  function followHref(href: string | null) {
    const link = classifyHref(href);
    switch (link.kind) {
      case 'internal':
        if (!navigateToPage(link.path)) showNotice(`No page exists for route "${link.path}"`);
        else if (link.fragment) requestAnimationFrame(() => scrollToFragment(link.fragment));
        break;
      case 'hash':
        scrollToFragment(link.fragment);
        break;
      case 'external':
        window.open(link.url, '_blank', 'noopener,noreferrer');
        break;
      case 'blocked':
        showNotice(`Blocked unsafe link (${link.reason})`);
        break;
      case 'empty':
        break;
    }
  }

  /**
   * Link safety: no <a> inside the canvas may ever navigate the iframe away. Runs in the
   * capture phase on the canvas root, before any component handler.
   */
  function handleLinkClickCapture(event: MouseEvent) {
    const anchor = (event.target as Element | null)?.closest?.('a');
    if (!anchor || anchor.closest('[data-canvas-ui]')) return;
    // Never let the browser follow the link (covers modifier-clicks / middle-clicks too).
    event.preventDefault();
    if (designMode) return; // design mode: the click only selects (EditorOverlay)
    event.stopPropagation();
    contextMenu = null;
    if (event.type === 'click') followHref(anchor.getAttribute('href'));
  }

  /** Attachment: capture-phase link interception on the canvas root. */
  function linkGuard(root: HTMLElement) {
    root.addEventListener('click', handleLinkClickCapture, { capture: true });
    root.addEventListener('auxclick', handleLinkClickCapture, { capture: true });
    return () => {
      root.removeEventListener('click', handleLinkClickCapture, { capture: true });
      root.removeEventListener('auxclick', handleLinkClickCapture, { capture: true });
    };
  }

  /** Programmatic navigation requested by a component (e.g. the sign-in card after submit). */
  function handleNavigateIntent(event: Event) {
    event.preventDefault();
    if (designMode) return;
    followHref((event as CustomEvent<NavigateEventDetail>).detail?.href ?? null);
  }

  /* ------------------------------------------------------------------------------------ */
  /* Keyboard                                                                             */
  /* ------------------------------------------------------------------------------------ */

  function isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable));
  }

  /** True when the user has a non-empty text selection inside the canvas. */
  function hasCanvasTextSelection(): boolean {
    const selection = window.getSelection();
    return Boolean(selection && !selection.isCollapsed && selection.toString().trim().length > 0);
  }

  /** Closes the canvas' own transient UI (topmost first). Returns true if something closed. */
  function closeLocalOverlay(): boolean {
    if (contextMenu) {
      contextMenu = null;
      return true;
    }
    if (picker) {
      picker = null;
      return true;
    }
    return false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    const mod = event.metaKey || event.ctrlKey;
    const key = event.key.toLowerCase();

    if (mod && key === 'k') {
      event.preventDefault();
      sendShortcut('command-palette');
      return;
    }
    if (mod && key === 'i') {
      event.preventDefault();
      sendShortcut('navigator');
      return;
    }
    if (mod && key === 's') {
      event.preventDefault();
      sendShortcut('save');
      return;
    }
    if (mod && key === 'e') {
      event.preventDefault();
      sendShortcut('export');
      return;
    }
    if (mod && (key === '=' || key === '+' || key === '-')) {
      event.preventDefault();
      sendShortcut(key === '-' ? 'zoom-out' : 'zoom-in');
      return;
    }
    if (event.key === 'Escape') {
      // Interactive dialogs (InteractionLayer) and inline editing handle Escape first.
      if (event.defaultPrevented) return;
      if (closeLocalOverlay()) {
        event.preventDefault();
        return;
      }
      if (isEditableTarget(event.target)) return;
      sendShortcut('escape');
      return;
    }

    if (isEditableTarget(event.target)) return;

    // Design-mode navigation and single-key studio shortcuts (never in interactive mode, where
    // keys belong to the site being previewed).
    if (designMode && !mod && !event.altKey) {
      if (event.key === 'Enter' && selectedNodeId) {
        event.preventDefault();
        sendShortcut(event.shiftKey ? 'select-parent' : 'select-child');
        return;
      }
      if (event.key === 'Tab' && selectedNodeId) {
        event.preventDefault();
        sendShortcut(event.shiftKey ? 'select-prev' : 'select-next');
        return;
      }
      if (event.shiftKey && (event.code === 'Digit1' || event.code === 'Digit0')) {
        event.preventDefault();
        sendShortcut(event.code === 'Digit1' ? 'zoom-fit' : 'zoom-100');
        return;
      }
      if (event.key === '?') {
        event.preventDefault();
        sendShortcut('show-shortcuts');
        return;
      }
      if (!event.shiftKey) {
        const single = ({ p: 'toggle-preview', a: 'panel-elements', l: 'panel-layers', g: 'panel-pages', m: 'panel-assets', s: 'panel-styles' } as const)[
          key as 'p' | 'a' | 'l' | 'g' | 'm' | 's'
        ];
        if (single) {
          event.preventDefault();
          sendShortcut(single);
          return;
        }
      }
    }

    if (mod && key === 'z') {
      event.preventDefault();
      sendShortcut(event.shiftKey ? 'redo' : 'undo');
    } else if (mod && key === 'y') {
      event.preventDefault();
      sendShortcut('redo');
    } else if (mod && key === 'd') {
      event.preventDefault();
      sendShortcut('duplicate');
    } else if (mod && key === 'c') {
      if (hasCanvasTextSelection()) return; // let the browser copy real text selections
      event.preventDefault();
      sendShortcut(event.shiftKey ? 'copy-style' : 'copy');
    } else if (mod && key === 'v') {
      if (hasCanvasTextSelection()) return;
      event.preventDefault();
      sendShortcut(event.shiftKey ? 'paste-style' : 'paste');
    } else if (event.altKey && !mod && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      if (designMode && selectedNodeId && !isLocked(selectedNodeId)) {
        event.preventDefault();
        sendShortcut(event.key === 'ArrowUp' ? 'move-up' : 'move-down');
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (designMode && selectedNodeId && !isLocked(selectedNodeId)) {
        event.preventDefault();
        sendShortcut('delete');
      }
    }
  }

  /** Clicking anywhere outside an open menu/picker closes it. */
  function handlePointerDownCapture(event: PointerEvent) {
    const target = event.target as Element | null;
    if (target?.closest?.('.cv-menu, .cv-picker')) return;
    contextMenu = null;
    picker = null;
  }

  onMount(() => {
    window.addEventListener('message', handleParentMessage);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDownCapture, { capture: true });
    document.addEventListener(NAVIGATE_EVENT, handleNavigateIntent);
    // Announce readiness eagerly; the parent also PINGs until it hears PREVIEW_READY.
    postToParent({ type: 'PREVIEW_READY' });
    return () => {
      window.removeEventListener('message', handleParentMessage);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDownCapture, { capture: true });
      document.removeEventListener(NAVIGATE_EVENT, handleNavigateIntent);
      if (noticeTimer !== null) clearTimeout(noticeTimer);
    };
  });
</script>

<svelte:head>
  <title>{activePage?.title || 'Preview'}</title>
  {#if fontsHref}
    <link rel="stylesheet" href={fontsHref} />
  {/if}
</svelte:head>

<div class={['site-root', designMode && 'is-designing']} {@attach linkGuard} {@attach applyStylesheet}>
  {#if activePage}
    <main class="site-main">
      {#if activeLayout}
        <PreviewRenderer node={activeLayout.rootNode} slotNode={activePage.rootNode} {designMode} />
      {:else}
        <PreviewRenderer node={activePage.rootNode} {designMode} />
      {/if}
    </main>

    {#if designMode}
      <AddSectionZone
        rootNodeId={activePage.rootNode.id}
        onOpenStructurePicker={(anchor) => {
          contextMenu = null;
          picker = { targetNodeId: null, anchor: { top: anchor.top, left: anchor.left, bottom: anchor.bottom, width: anchor.width } };
        }}
        onOpenLibrary={() => postToParent({ type: 'OPEN_BLOCK_LIBRARY' })}
        onDrop={handleDrop}
      />
    {:else}
      <InteractionLayer rules={interactionRules} onNavigate={followHref} />
    {/if}
  {/if}
</div>

<EditorOverlay
  enabled={designMode}
  {selectedNodeId}
  {externalHoverNodeId}
  {revision}
  {getNodeInfo}
  onSelect={handleSelectNode}
  onAction={handleNodeAction}
  onOpenMenu={handleOpenMenu}
  onDrop={handleDrop}
  onInlineEdit={handleInlineEdit}
  onResize={handleResize}
/>

{#if contextMenu && contextNode && designMode}
  <ContextMenu node={contextNode} x={contextMenu.x} y={contextMenu.y} onAction={(action) => handleNodeAction(contextNode.id, action)} />
{/if}

{#if picker && designMode}
  <StructurePicker
    anchor={picker.anchor}
    onInsertStructure={handleInsertStructure}
    onInsertComponent={handleInsertComponent}
    onClose={() => (picker = null)}
  />
{/if}

{#if notice}
  <div class="canvas-notice" data-canvas-ui role="status" aria-live="polite">{notice}</div>
{/if}

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
  }
  /* Embedded players/maps must not swallow the clicks that select their element while designing. */
  .is-designing :global(iframe) {
    pointer-events: none;
  }
  .is-designing {
    user-select: none;
    -webkit-user-select: none;
  }
  .canvas-notice {
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 2147483600;
    max-width: 360px;
    padding: 10px 14px;
    border-radius: 8px;
    background: #101828;
    color: #FFFFFF;
    font: 500 13px/1.4 Inter, system-ui, sans-serif;
    box-shadow: 0 12px 32px rgba(16, 24, 40, 0.24);
  }
</style>
