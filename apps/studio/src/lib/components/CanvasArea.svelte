<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { findNodeInBlueprint } from '@app-viz/engine';
  import { getManifest } from '@app-viz/components';
  import { onMount, untrack } from 'svelte';
  import FlowMap from './FlowMap.svelte';
  import { pageDisplayName } from '../state/page-name.js';
  import { resolveWidgetIcon } from '../ui/widget-icons.js';
  import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
  import DesktopIcon from 'phosphor-svelte/lib/DesktopIcon';
  import DeviceTabletIcon from 'phosphor-svelte/lib/DeviceTabletIcon';
  import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import ArrowsClockwiseIcon from 'phosphor-svelte/lib/ArrowsClockwiseIcon';
  import {
    NON_MUTATING_NODE_ACTIONS,
    parsePreviewMessage,
    sanitizeResizeStyles,
    type KeyShortcut,
    type NodeQuickAction,
    type ParentToPreviewMessage,
    type PreviewToParentMessage
  } from '../canvas/messages.js';

  let iframeElement: HTMLIFrameElement | null = null;

  /* ---------------------------------------------------------------------------------------- */
  /* Iframe handshake                                                                         */
  /*                                                                                          */
  /* PREVIEW_READY may fire before our listener exists, and the iframe remounts whenever we   */
  /* switch flow → canvas. So readiness is owned by the parent: it is reset whenever the      */
  /* iframe element mounts/unmounts or fires `load`, and we PING until the preview answers.   */
  /* ---------------------------------------------------------------------------------------- */

  const PING_INTERVAL_MS = 250;
  const MAX_PING_ATTEMPTS = 40;

  let isPreviewReady = $state(false);
  let handshakeFailed = $state(false);
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let pingAttempts = 0;

  function postToPreview(message: ParentToPreviewMessage) {
    const target = iframeElement?.contentWindow;
    if (!target) return;
    target.postMessage(message, window.location.origin);
  }

  function stopPinging() {
    if (pingTimer !== null) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  function sendPing() {
    pingAttempts += 1;
    postToPreview({ type: 'PING', attempt: pingAttempts });
  }

  function startHandshake() {
    stopPinging();
    isPreviewReady = false;
    handshakeFailed = false;
    pingAttempts = 0;
    sendPing();
    pingTimer = setInterval(() => {
      if (isPreviewReady) {
        stopPinging();
      } else if (pingAttempts >= MAX_PING_ATTEMPTS) {
        stopPinging();
        handshakeFailed = true;
      } else {
        sendPing();
      }
    }, PING_INTERVAL_MS);
  }

  function retryHandshake() {
    if (!iframeElement) return;
    // Reloading fires `load`, which restarts the handshake.
    isPreviewReady = false;
    handshakeFailed = false;
    iframeElement.src = '/preview';
  }

  /** Attachment: runs on every iframe mount, cleans up on unmount. */
  function previewFrame(el: HTMLIFrameElement) {
    return untrack(() => {
      iframeElement = el;
      isPreviewReady = false;
      const onLoad = () => startHandshake();
      el.addEventListener('load', onLoad);
      // The iframe may already be (partially) loaded; start pinging right away. The `load`
      // event restarts the handshake against the final document.
      startHandshake();

      return () => {
        el.removeEventListener('load', onLoad);
        stopPinging();
        isPreviewReady = false;
        handshakeFailed = false;
        if (iframeElement === el) iframeElement = null;
      };
    });
  }

  function buildSyncMessage(): ParentToPreviewMessage {
    return {
      type: 'SYNC_STATE',
      blueprint: $state.snapshot(editor.blueprint),
      activePageId: editor.activePageId,
      selectedNodeId: editor.selectedNodeId,
      isInteractiveMode: editor.isInteractiveMode,
      activeBreakpoint: editor.activeBreakpoint,
      hoverNodeId: editor.hoverNodeId
    } as ParentToPreviewMessage;
  }

  // Synchronize blueprint state with the iframe once (and whenever) the handshake completes.
  $effect(() => {
    if (!isPreviewReady || editor.canvasViewMode !== 'canvas') return;
    postToPreview(buildSyncMessage());
  });

  function isLockedNode(nodeId: string): boolean {
    return findNodeInBlueprint(editor.blueprint, nodeId)?.node.locked === true;
  }

  function handlePreviewMessage(message: PreviewToParentMessage) {
    switch (message.type) {
      case 'PREVIEW_READY': {
        stopPinging();
        handshakeFailed = false;
        if (!isPreviewReady) {
          // Flipping readiness triggers the sync effect, which sends a full SYNC_STATE.
          isPreviewReady = true;
        } else {
          // Already ready (e.g. a late answer to an earlier PING): resend full state anyway.
          postToPreview(buildSyncMessage());
        }
        break;
      }
      case 'SELECT_NODE':
        editor.selectNode(message.nodeId);
        break;
      case 'NAVIGATE_PAGE': {
        const targetPage = editor.blueprint.pages.find((p) => p.path === message.path);
        if (targetPage) editor.setActivePage(targetPage.id);
        break;
      }
      case 'INLINE_PROP_EDIT': {
        if (isLockedNode(message.nodeId)) break;
        if (!editor.setPropPath(message.nodeId, message.propKey, message.value)) {
          editor.notify('warning', `Could not apply the inline edit to “${message.propKey}”.`);
        }
        if (message.final) editor.endContinuousEdit();
        break;
      }
      case 'RESIZE_NODE_STYLE': {
        if (isLockedNode(message.nodeId)) break;
        const styles = sanitizeResizeStyles(message.styles);
        if (!styles) break;
        editor.dispatch({
          type: 'UPDATE_STYLES',
          nodeId: message.nodeId,
          breakpoint: 'base',
          styles
        });
        break;
      }
      case 'NODE_ACTION':
        handleNodeAction(message.nodeId, message.action);
        break;
      case 'INSERT_STRUCTURE':
        editor.insertContainerStructure(message.structureId, message.targetNodeId);
        break;
      case 'DROP_ITEM': {
        const { componentType, draggedNodeId, targetNodeId, position } = message;
        if (componentType) {
          editor.dropComponentOnTarget(componentType, targetNodeId, position);
        } else if (draggedNodeId && draggedNodeId !== targetNodeId) {
          editor.dropNodeOnTarget(draggedNodeId, targetNodeId, position);
        }
        break;
      }
      case 'KEY_SHORTCUT':
        handleShortcut(message.shortcut);
        break;
      case 'OPEN_BLOCK_LIBRARY':
        editor.showBlockLibraryModal = true;
        break;
    }
  }

  function handleNodeAction(nodeId: string, action: NodeQuickAction) {
    if (!NON_MUTATING_NODE_ACTIONS.has(action) && isLockedNode(nodeId)) return;
    switch (action) {
      case 'up':
      case 'down':
        editor.dispatch({ type: 'REORDER_NODE', nodeId, direction: action });
        break;
      case 'duplicate':
        editor.dispatch({ type: 'DUPLICATE_NODE', nodeId });
        break;
      case 'delete':
        editor.dispatch({ type: 'DELETE_NODE', nodeId });
        if (editor.selectedNodeId === nodeId) editor.selectNode(null);
        break;
      case 'wrap-section':
        editor.wrapNode(nodeId, 'structure/section');
        break;
      case 'wrap-container':
        editor.wrapNode(nodeId, 'structure/container');
        break;
      case 'unwrap':
        editor.unwrapNode(nodeId);
        break;
      case 'copy':
        editor.selectNode(nodeId);
        editor.copySelectedNode();
        break;
      case 'paste':
        editor.pasteNode(nodeId);
        break;
      case 'copy-style':
        editor.selectNode(nodeId);
        editor.copyNodeStyle(nodeId);
        break;
      case 'paste-style':
        editor.selectNode(nodeId);
        editor.pasteNodeStyle(nodeId);
        break;
      case 'reset-style':
        editor.selectNode(nodeId);
        editor.resetNodeStyle(nodeId);
        break;
      case 'save-symbol':
        editor.selectNode(nodeId);
        editor.saveSelectedNodeAsSymbol();
        break;
      case 'hide':
        editor.dispatch({ type: 'UPDATE_NODE_META', nodeId, meta: { hidden: true } });
        break;
      case 'align-left':
        editor.selectNode(nodeId);
        editor.alignNode(nodeId, 'left');
        break;
      case 'align-center':
        editor.selectNode(nodeId);
        editor.alignNode(nodeId, 'center');
        break;
      case 'align-right':
        editor.selectNode(nodeId);
        editor.alignNode(nodeId, 'right');
        break;
    }
  }

  function handleShortcut(shortcut: KeyShortcut) {
    const selectedId = editor.selectedNodeId;
    const selectedLocked = selectedId ? isLockedNode(selectedId) : false;
    switch (shortcut) {
      case 'undo':
        editor.undo();
        break;
      case 'redo':
        editor.redo();
        break;
      case 'duplicate':
        editor.duplicateSelectedNode();
        break;
      case 'copy':
        editor.copySelectedNode();
        break;
      case 'paste':
        editor.pasteNode();
        break;
      case 'copy-style':
        editor.copyNodeStyle();
        break;
      case 'paste-style':
        if (!selectedLocked) editor.pasteNodeStyle();
        break;
      case 'navigator':
        editor.showNavigator = !editor.showNavigator;
        break;
      case 'delete':
        if (!selectedLocked) editor.deleteSelectedNode();
        break;
      case 'escape':
        editor.selectNode(null);
        break;
      case 'command-palette':
        editor.showCommandPalette = !editor.showCommandPalette;
        break;
      case 'move-up':
        if (!selectedLocked) editor.reorderSelectedNode('up');
        break;
      case 'move-down':
        if (!selectedLocked) editor.reorderSelectedNode('down');
        break;
      case 'select-parent':
        editor.selectParent();
        break;
      case 'select-child':
        editor.selectFirstChild();
        break;
      case 'select-next':
        editor.selectSibling(1);
        break;
      case 'select-prev':
        editor.selectSibling(-1);
        break;
      case 'toggle-preview':
        editor.toggleInteractiveMode();
        break;
      case 'zoom-fit':
        editor.zoomToFit();
        break;
      case 'zoom-100':
        editor.setZoom(100);
        break;
      case 'zoom-in':
        editor.stepZoom(1);
        break;
      case 'zoom-out':
        editor.stepZoom(-1);
        break;
      case 'show-shortcuts':
        editor.showShortcuts = true;
        break;
      case 'save':
        void editor.saveNow().then(() => editor.saveStatus === 'saved' && editor.notify('success', 'Saved.', 1500));
        break;
      case 'export':
        editor.showExportDialog = true;
        break;
      case 'panel-elements':
        editor.openLeftTab('library');
        break;
      case 'panel-layers':
        editor.openLeftTab('layers');
        break;
      case 'panel-pages':
        editor.openLeftTab('pages');
        break;
      case 'panel-assets':
        editor.openLeftTab('assets');
        break;
      case 'panel-styles':
        editor.openLeftTab('tokens');
        break;
    }
  }

  onMount(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      // Only accept messages from OUR preview iframe (not other frames / windows / extensions).
      const frameWindow = iframeElement?.contentWindow;
      if (!frameWindow || event.source !== frameWindow) return;
      const message = parsePreviewMessage(event.data);
      if (!message) return;
      handlePreviewMessage(message);
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      stopPinging();
    };
  });

  /* ---------------------------------------------------------------------------------------- */
  /* Stage measurement → zoom to fit                                                          */
  /* ---------------------------------------------------------------------------------------- */

  const FRAME_TOP = 36; // device label row above the frame
  const FRAME_BOTTOM = 20;

  function measureStage(el: HTMLElement) {
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect;
      editor.stageWidth = Math.floor(box.width);
      editor.stageHeight = Math.floor(box.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }

  const DEVICE_META = {
    wide: { label: 'Wide', icon: MonitorIcon, range: '≥ 1440px' },
    desktop: { label: 'Desktop', icon: DesktopIcon, range: '1024 – 1439px' },
    tablet: { label: 'Tablet', icon: DeviceTabletIcon, range: '768 – 1023px' },
    mobile: { label: 'Mobile', icon: DeviceMobileIcon, range: '≤ 767px' }
  } as const;

  const device = $derived(DEVICE_META[editor.activeBreakpoint]);
  const scale = $derived(editor.effectiveZoom / 100);
  const frameWidth = $derived(Math.round(editor.deviceWidth * scale));
  const frameHeight = $derived(Math.max(320, editor.stageHeight - FRAME_TOP - FRAME_BOTTOM));
  const iframeHeight = $derived(Math.round(frameHeight / scale));
  const pageNodeCount = $derived.by(() => {
    const count = (n: { children?: unknown[] } | undefined): number =>
      n ? 1 + ((n.children ?? []) as { children?: unknown[] }[]).reduce((t, c) => t + count(c), 0) : 0;
    return count(editor.activePage?.rootNode) - 1;
  });
</script>

<main class="cv" aria-label="Canvas">
  {#if editor.externalChange}
    <div class="cv__banner" role="status">
      <ArrowsClockwiseIcon size={14} />
      <span>This project was changed in another tab.</span>
      <button type="button" class="sx-btn sx-btn--sm" onclick={() => editor.reloadFromStorage()}>Load latest</button>
      <button
        type="button"
        class="sx-btn sx-btn--sm sx-btn--ghost"
        onclick={() => {
          editor.externalChange = false;
          void editor.saveNow();
        }}>Keep mine</button
      >
    </div>
  {/if}

  {#if editor.canvasViewMode === 'flow'}
    <div class="cv__flow">
      <FlowMap />
    </div>
  {:else}
    <div class={['cv__stage', editor.zoomMode === 'manual' && scale > 1 && 'cv__stage--overflow']} {@attach measureStage}>
      <div class="cv__frame-wrap" style:width="{frameWidth}px">
        <div class="cv__frame-label">
          <span class="cv__device">
            <device.icon size={13} />
            {device.label}
            <span class="cv__muted">{editor.deviceWidth}px</span>
          </span>
          <span class="cv__url">
            {#if editor.isInteractiveMode}<PlayIcon size={10} weight="fill" />{/if}
            {editor.activePage?.path ?? '/'}
          </span>
          <span class="cv__muted cv__zoom">{editor.effectiveZoom}%</span>
        </div>
        <div class={['cv__frame', editor.isInteractiveMode && 'cv__frame--live']} style:height="{frameHeight}px">
          <iframe
            {@attach previewFrame}
            src="/preview"
            title="Page canvas"
            class="cv__iframe"
            style:width="{editor.deviceWidth}px"
            style:height="{iframeHeight}px"
            style:transform="scale({scale})"
          ></iframe>
          {#if !isPreviewReady}
            <div class="cv__overlay" role="status" aria-live="polite">
              {#if handshakeFailed}
                <div class="cv__error">
                  <WarningCircleIcon size={22} />
                  <strong>The canvas didn't respond</strong>
                  <span>The preview frame failed to start. Reloading usually fixes it.</span>
                  <button type="button" class="sx-btn sx-btn--primary sx-btn--sm" onclick={retryHandshake}>
                    <ArrowClockwiseIcon size={13} />Reload canvas
                  </button>
                </div>
              {:else}
                <div class="cv__skeleton" aria-label="Loading canvas">
                  <span class="cv__sk cv__sk--nav"></span>
                  <span class="cv__sk cv__sk--hero"></span>
                  <span class="cv__sk-row"><span class="cv__sk"></span><span class="cv__sk"></span><span class="cv__sk"></span></span>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}

  <footer class="cv__status">
    {#if editor.canvasViewMode === 'flow'}
      <span class="cv__muted">Routes & flows</span>
    {:else if editor.isInteractiveMode}
      <span class="cv__mode cv__mode--live"><PlayIcon size={10} weight="fill" />Preview — links, forms and interactions are live</span>
    {:else if editor.selectedNodeBreadcrumb.length > 0}
      <nav class="cv__crumbs" aria-label="Selected element path">
        {#each editor.selectedNodeBreadcrumb as crumb, idx (crumb.id)}
          {@const m = getManifest(crumb.componentType) as { icon?: string; category?: string } | undefined}
          {@const Icon = resolveWidgetIcon(m?.icon, m?.category)}
          {#if idx > 0}<CaretRightIcon size={9} weight="bold" />{/if}
          <button
            type="button"
            class={['cv__crumb', crumb.id === editor.selectedNodeId && 'cv__crumb--on']}
            onclick={() => editor.selectNode(crumb.id)}
            onpointerenter={() => editor.hoverNode(crumb.id)}
            onpointerleave={() => editor.hoverNode(null)}
          >
            {#if idx > 0}<Icon size={12} />{/if}
            {idx === 0 ? (editor.activePage ? pageDisplayName(editor.activePage) : 'Page') : crumb.name}
          </button>
        {/each}
      </nav>
    {:else}
      <span class="cv__mode"><CursorClickIcon size={12} />Click to select · double-click text to edit · drag to reorder</span>
    {/if}
    <span class="cv__status-right">
      <span>{pageNodeCount} elements</span>
      <span class="cv__dot"></span>
      <span>{device.label} {device.range}</span>
    </span>
  </footer>
</main>

<style>
  .cv {
    position: relative;
    display: grid;
    grid-template-rows: minmax(0, 1fr) var(--sx-statusbar-h);
    min-width: 0;
    min-height: 0;
    background-color: var(--sx-canvas-bg);
    background-image: radial-gradient(var(--sx-canvas-dot) 1px, transparent 1px);
    background-size: 16px 16px;
  }
  .cv__stage {
    position: relative;
    min-height: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    padding: 0 0 20px;
  }
  .cv__stage--overflow {
    overflow: auto;
    justify-content: flex-start;
  }
  .cv__flow {
    min-height: 0;
    overflow: auto;
  }
  .cv__frame-wrap {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    margin: 0 auto;
  }
  .cv__frame-label {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 36px;
    padding: 0 2px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    user-select: none;
  }
  .cv__device {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
    color: var(--sx-text);
  }
  .cv__url {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin: 0 auto;
    padding: 0 10px;
    height: 22px;
    max-width: 50%;
    border-radius: 999px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cv__muted {
    color: var(--sx-text-3);
    font-weight: 400;
  }
  .cv__zoom {
    font-variant-numeric: tabular-nums;
  }
  .cv__frame {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #fff;
    border-radius: 6px;
    box-shadow: var(--sx-shadow-frame);
    transition: box-shadow 200ms var(--sx-ease);
  }
  .cv__frame--live {
    box-shadow:
      0 0 0 2px var(--sx-accent),
      var(--sx-shadow-frame);
  }
  .cv__iframe {
    display: block;
    border: 0;
    transform-origin: 0 0;
    background: #fff;
  }
  .cv__overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: #fff;
  }
  .cv__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    max-width: 320px;
    text-align: center;
    font-size: var(--sx-text-md);
    color: #475467;
  }
  .cv__error :global(svg:first-child) {
    color: #d92d20;
  }
  .cv__error strong {
    color: #101828;
    font-size: 14px;
  }
  .cv__skeleton {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 18px 24px;
  }
  .cv__sk {
    display: block;
    border-radius: 6px;
    background: linear-gradient(90deg, #f2f4f7 0%, #e9ecf1 40%, #f2f4f7 80%);
    background-size: 200% 100%;
    animation: cv-shimmer 1.2s linear infinite;
  }
  .cv__sk--nav {
    height: 36px;
  }
  .cv__sk--hero {
    height: 42%;
  }
  .cv__sk-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    height: 22%;
  }
  @keyframes cv-shimmer {
    to {
      background-position: -200% 0;
    }
  }
  .cv__banner {
    position: absolute;
    top: 44px;
    left: 50%;
    z-index: 5;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 6px 6px 12px;
    font-size: var(--sx-text-md);
    background: var(--sx-panel-raised);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    box-shadow: var(--sx-shadow-lg);
  }
  .cv__banner > :global(svg) {
    color: var(--sx-warning);
  }
  .cv__status {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 0 10px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    background: var(--sx-panel);
    border-top: 1px solid var(--sx-border);
    user-select: none;
  }
  .cv__mode {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--sx-text-3);
  }
  .cv__mode--live {
    color: var(--sx-accent-text);
    font-weight: 500;
  }
  .cv__crumbs {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    overflow: hidden;
    color: var(--sx-text-3);
  }
  .cv__crumb {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 20px;
    padding: 0 6px;
    border-radius: 4px;
    color: var(--sx-text-2);
    white-space: nowrap;
  }
  .cv__crumb:hover {
    background: var(--sx-hover);
    color: var(--sx-text);
  }
  .cv__crumb--on {
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
    font-weight: 500;
  }
  .cv__status-right {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
    color: var(--sx-text-3);
    white-space: nowrap;
  }
  .cv__dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--sx-text-3);
  }
</style>
