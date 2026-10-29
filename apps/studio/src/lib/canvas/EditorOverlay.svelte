<script lang="ts" module>
  export interface OverlayNodeInfo {
    id: string;
    name: string;
    componentType: string;
    locked: boolean;
    isContainer: boolean;
    hasChildren: boolean;
    /** Page or layout root: drops are always `inside`, it cannot be reordered. */
    isRoot: boolean;
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import DotsThreeIcon from 'phosphor-svelte/lib/DotsThreeIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import {
    closestNodeElement,
    computeDropPosition,
    findNodeElement,
    isEditorChrome,
    isMultilinePropPath,
    measureBox,
    sameBox,
    type Box
  } from './dom.js';
  import type { DropPosition, NodeQuickAction } from './messages.js';
  import { typeIconFor } from './type-icons.js';

  /**
   * Editing affordances for the wrapper-less canvas, drawn in ONE fixed, pointer-events:none
   * layer that measures `[data-node-id]` elements. Events are delegated at document level.
   * Design mode only (`enabled`).
   */
  interface Props {
    enabled: boolean;
    selectedNodeId: string | null;
    /** Node hovered in the studio (layers panel), outlined like a canvas hover. */
    externalHoverNodeId?: string | null;
    /** Bumped on every state sync so the layer re-measures after re-renders. */
    revision: number;
    getNodeInfo: (nodeId: string) => OverlayNodeInfo | null;
    onSelect: (nodeId: string) => void;
    onAction: (nodeId: string, action: NodeQuickAction) => void;
    onOpenMenu: (nodeId: string, x: number, y: number) => void;
    onDrop: (payload: { componentType?: string; nodeId?: string }, targetNodeId: string, position: DropPosition) => void;
    onInlineEdit: (nodeId: string, propKey: string, value: string) => void;
    onResize: (nodeId: string, styles: Record<string, string>) => void;
  }

  let {
    enabled,
    selectedNodeId,
    externalHoverNodeId = null,
    revision,
    getNodeInfo,
    onSelect,
    onAction,
    onOpenMenu,
    onDrop,
    onInlineEdit,
    onResize
  }: Props = $props();

  const COMPONENT_MIME = 'application/x-app-viz-component';
  const NODE_MIME = 'application/x-app-viz-node-id';
  const TAB_HEIGHT = 22;

  let hoverNodeId = $state<string | null>(null);
  let drop = $state<{ nodeId: string; position: DropPosition } | null>(null);
  let selectedBox = $state.raw<Box | null>(null);
  let hoverBox = $state.raw<Box | null>(null);
  let dropBox = $state.raw<Box | null>(null);
  let viewport = $state.raw({ width: 0, height: 0 });
  let tabWidth = $state(0);
  let editingNodeId = $state<string | null>(null);
  let resizing = $state<{ side: 'top' | 'bottom' | 'both'; px: number } | null>(null);

  let draggingNodeId: string | null = null;

  const shownHoverId = $derived(externalHoverNodeId ?? hoverNodeId);
  const selectedInfo = $derived(enabled && selectedNodeId ? getNodeInfo(selectedNodeId) : null);
  const dropInfo = $derived(drop ? getNodeInfo(drop.nodeId) : null);
  const TypeIcon = $derived(typeIconFor(selectedInfo?.componentType ?? ''));

  /* ------------------------------------------------------------------------------------ */
  /* Measurement (rAF-throttled)                                                          */
  /* ------------------------------------------------------------------------------------ */

  let frame = 0;

  function schedule() {
    if (!frame) frame = requestAnimationFrame(measure);
  }

  function measure() {
    frame = 0;
    const nextSelected = enabled && selectedNodeId ? measureBox(findNodeElement(selectedNodeId)) : null;
    const hoverId = enabled && shownHoverId && shownHoverId !== selectedNodeId ? shownHoverId : null;
    const nextHover = hoverId ? measureBox(findNodeElement(hoverId)) : null;
    const nextDrop = enabled && drop ? measureBox(findNodeElement(drop.nodeId)) : null;
    if (!sameBox(nextSelected, selectedBox)) selectedBox = nextSelected;
    if (!sameBox(nextHover, hoverBox)) hoverBox = nextHover;
    if (!sameBox(nextDrop, dropBox)) dropBox = nextDrop;
    if (viewport.width !== window.innerWidth || viewport.height !== window.innerHeight) {
      viewport = { width: window.innerWidth, height: window.innerHeight };
    }
  }

  /** Attachment: re-measures whenever what we draw (or the rendered page) changes. */
  const remeasureOnChange: Attachment = () => {
    void [selectedNodeId, shownHoverId, drop, revision];
    schedule();
  };

  /** Attachment: viewport listeners and page observers while the overlay is mounted (design mode). */
  const trackLayout: Attachment = () => {
    const onLayoutChange = () => schedule();
    window.addEventListener('scroll', onLayoutChange, { capture: true, passive: true });
    window.addEventListener('resize', onLayoutChange);
    const siteRoot = document.querySelector('.site-root') ?? document.body;
    const mutations = new MutationObserver(onLayoutChange);
    mutations.observe(siteRoot, { subtree: true, childList: true, attributes: true, characterData: true });
    const sizes = new ResizeObserver(onLayoutChange);
    sizes.observe(siteRoot);
    return () => {
      window.removeEventListener('scroll', onLayoutChange, { capture: true });
      window.removeEventListener('resize', onLayoutChange);
      mutations.disconnect();
      sizes.disconnect();
      // Leaving design mode clears every transient editing state.
      finishInlineEdit(false);
      stopResize?.();
      hoverNodeId = null;
      drop = null;
    };
  };

  /** Attachment: tracks size changes of the selected element itself (re-found after every sync). */
  const observeSelected: Attachment = () => {
    void revision;
    const el = selectedNodeId ? findNodeElement(selectedNodeId) : null;
    if (!el) return;
    const sizes = new ResizeObserver(() => schedule());
    sizes.observe(el);
    return () => sizes.disconnect();
  };

  onDestroy(() => {
    if (frame) cancelAnimationFrame(frame);
    finishInlineEdit(false);
    stopResize?.();
  });

  /* ------------------------------------------------------------------------------------ */
  /* Selection, hover, context menu                                                       */
  /* ------------------------------------------------------------------------------------ */

  function handleClickCapture(event: MouseEvent) {
    if (!enabled) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (inlineEdit && inlineEdit.el.contains(target)) return;
    const chrome = target.closest('[data-canvas-ui]');
    if (chrome) {
      // Clicking an empty-container placeholder (not its button) selects that container.
      const container = chrome.closest('[data-empty-container]') ? closestNodeElement(chrome) : null;
      if (container && !target.closest('button')) {
        const id = container.getAttribute('data-node-id');
        if (id) onSelect(id);
      }
      return;
    }
    // Disclosure widgets (tabs, accordions, menus) stay operable while designing; everything
    // else (links, submits, custom handlers) is suppressed so a click only selects.
    if (!target.closest('button[aria-expanded], [role="tab"]')) {
      event.preventDefault();
      event.stopPropagation();
    }
    const nodeEl = closestNodeElement(target);
    const id = nodeEl?.getAttribute('data-node-id');
    if (id) onSelect(id);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!enabled || drop) return;
    if (isEditorChrome(event.target) && !(event.target as Element).closest('[data-empty-container]')) return;
    const id = closestNodeElement(event.target)?.getAttribute('data-node-id') ?? null;
    if (id !== hoverNodeId) hoverNodeId = id;
  }

  function handleMouseOut(event: MouseEvent) {
    if (!event.relatedTarget) hoverNodeId = null;
  }

  function handleContextMenu(event: MouseEvent) {
    if (!enabled || isEditorChrome(event.target)) return;
    const id = closestNodeElement(event.target)?.getAttribute('data-node-id');
    if (!id) return;
    event.preventDefault();
    onSelect(id);
    onOpenMenu(id, event.clientX, event.clientY);
  }

  /* ------------------------------------------------------------------------------------ */
  /* Inline text editing (contenteditable on the element carrying data-prop)              */
  /* ------------------------------------------------------------------------------------ */

  interface InlineEdit {
    el: HTMLElement;
    nodeId: string;
    propKey: string;
    startValue: string;
    multiline: boolean;
    restore: () => void;
    detach: () => void;
  }

  let inlineEdit: InlineEdit | null = null;

  function handleDblClick(event: MouseEvent) {
    if (!enabled || isEditorChrome(event.target) || !(event.target instanceof Element)) return;
    const propEl = event.target.closest('[data-prop]');
    if (!(propEl instanceof HTMLElement)) return;
    const owner = closestNodeElement(propEl);
    const nodeId = owner?.getAttribute('data-node-id');
    const propKey = propEl.dataset.prop;
    if (!nodeId || !propKey) return;
    const info = getNodeInfo(nodeId);
    if (!info || info.locked) return;
    event.preventDefault();
    event.stopPropagation();
    onSelect(nodeId);
    startInlineEdit(propEl, nodeId, propKey);
  }

  function startInlineEdit(el: HTMLElement, nodeId: string, propKey: string) {
    finishInlineEdit(true);
    // Snapshot the nodes Svelte rendered so they can be put back untouched afterwards.
    const originalNodes = Array.from(el.childNodes);
    const originalText = originalNodes.map((n) => (n.nodeType === Node.TEXT_NODE ? (n as Text).data : null));
    const multiline = isMultilinePropPath(propKey);

    const onKeydown = (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        finishInlineEdit(false);
      } else if (event.key === 'Enter' && (!multiline || event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        finishInlineEdit(true);
      }
    };
    const onBlur = () => finishInlineEdit(true);

    el.setAttribute('contenteditable', 'plaintext-only');
    el.setAttribute('data-inline-editing', '');
    el.setAttribute('spellcheck', 'true');
    el.addEventListener('keydown', onKeydown);
    el.addEventListener('blur', onBlur);

    inlineEdit = {
      el,
      nodeId,
      propKey,
      startValue: (el.textContent ?? '').trim(),
      multiline,
      restore: () => {
        el.replaceChildren(...originalNodes);
        originalNodes.forEach((n, i) => {
          if (originalText[i] !== null) (n as Text).data = originalText[i] as string;
        });
      },
      detach: () => {
        el.removeEventListener('keydown', onKeydown);
        el.removeEventListener('blur', onBlur);
        el.removeAttribute('contenteditable');
        el.removeAttribute('data-inline-editing');
        el.removeAttribute('spellcheck');
      }
    };
    editingNodeId = nodeId;

    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function finishInlineEdit(commit: boolean) {
    const edit = inlineEdit;
    if (!edit) return;
    inlineEdit = null;
    editingNodeId = null;
    const raw = (edit.el.textContent ?? '').replace(/\r/g, '');
    const value = (edit.multiline ? raw : raw.replace(/\s*\n+\s*/g, ' ')).trim();
    edit.detach();
    // Put Svelte's own text nodes back; the committed value arrives with the next state sync.
    edit.restore();
    window.getSelection()?.removeAllRanges();
    if (commit && value !== edit.startValue) onInlineEdit(edit.nodeId, edit.propKey, value);
  }

  /* ------------------------------------------------------------------------------------ */
  /* Drag & drop (library items and existing nodes)                                       */
  /* ------------------------------------------------------------------------------------ */

  function isOurDrag(event: DragEvent): boolean {
    const types = event.dataTransfer?.types ?? [];
    return types.includes(COMPONENT_MIME) || types.includes(NODE_MIME);
  }

  /** Nearest unlocked node under the pointer (locked nodes pass the drop to their ancestors). */
  function resolveDropTarget(event: DragEvent): { el: HTMLElement; info: OverlayNodeInfo } | null {
    let el = closestNodeElement(event.target);
    while (el) {
      const id = el.getAttribute('data-node-id');
      const info = id ? getNodeInfo(id) : null;
      if (info && !info.locked) return { el, info };
      el = el.parentElement ? closestNodeElement(el.parentElement) : null;
    }
    return null;
  }

  function handleDragOver(event: DragEvent) {
    if (!enabled || !isOurDrag(event)) return;
    const target = resolveDropTarget(event);
    if (!target) {
      drop = null;
      return;
    }
    if (draggingNodeId) {
      const dragged = findNodeElement(draggingNodeId);
      if (dragged && dragged.contains(target.el)) {
        // A node cannot be dropped onto itself or into its own subtree.
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'none';
        drop = null;
        return;
      }
    }
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = draggingNodeId ? 'move' : 'copy';
    const overPlaceholder = event.target instanceof Element && event.target.closest('[data-empty-container]');
    const position: DropPosition =
      target.info.isRoot || overPlaceholder
        ? 'inside'
        : computeDropPosition(target.el.getBoundingClientRect(), event.clientY, target.info.isContainer);
    if (drop?.nodeId !== target.info.id || drop.position !== position) {
      drop = { nodeId: target.info.id, position };
    }
  }

  function handleDragLeave(event: DragEvent) {
    if (!event.relatedTarget) drop = null;
  }

  function handleDrop(event: DragEvent) {
    if (!enabled || !isOurDrag(event)) return;
    event.preventDefault();
    const current = drop;
    drop = null;
    if (!current) return;
    const componentType = event.dataTransfer?.getData(COMPONENT_MIME) || '';
    const draggedNodeId = event.dataTransfer?.getData(NODE_MIME) || '';
    if (componentType) onDrop({ componentType }, current.nodeId, current.position);
    else if (draggedNodeId && draggedNodeId !== current.nodeId) onDrop({ nodeId: draggedNodeId }, current.nodeId, current.position);
  }

  function handleDragEnd() {
    draggingNodeId = null;
    drop = null;
  }

  function handleTabDragStart(event: DragEvent) {
    const info = selectedInfo;
    if (!info || info.locked || info.isRoot || !event.dataTransfer) {
      event.preventDefault();
      return;
    }
    finishInlineEdit(true);
    event.dataTransfer.setData(NODE_MIME, info.id);
    event.dataTransfer.effectAllowed = 'move';
    const el = findNodeElement(info.id);
    if (el) event.dataTransfer.setDragImage(el, 16, 16);
    draggingNodeId = info.id;
  }

  /* ------------------------------------------------------------------------------------ */
  /* Padding resize handles                                                               */
  /* ------------------------------------------------------------------------------------ */

  let stopResize: (() => void) | null = null;

  function readPadding(el: HTMLElement, side: 'top' | 'bottom'): number {
    const value = parseFloat(getComputedStyle(el)[side === 'top' ? 'paddingTop' : 'paddingBottom']);
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  function stylesFor(side: 'top' | 'bottom' | 'both', px: number): Record<string, string> {
    if (side === 'both') return { paddingTop: `${px}px`, paddingBottom: `${px}px` };
    return side === 'top' ? { paddingTop: `${px}px` } : { paddingBottom: `${px}px` };
  }

  function startResize(event: PointerEvent, side: 'top' | 'bottom') {
    const info = selectedInfo;
    if (!info || info.locked || event.button !== 0) return;
    const el = findNodeElement(info.id);
    if (!el) return;
    event.preventDefault();
    event.stopPropagation();
    stopResize?.();

    const handle = event.currentTarget as HTMLElement;
    const pointerId = event.pointerId;
    const startY = event.clientY;
    const mode: 'top' | 'bottom' | 'both' = event.altKey ? 'both' : side;
    const startPx = readPadding(el, side);
    const nodeId = info.id;
    let pending: number | null = null;
    let raf = 0;
    resizing = { side: mode, px: startPx };
    try {
      handle.setPointerCapture(pointerId);
    } catch {
      // The pointer may already be released (synthetic events); the listeners below still clean up.
    }

    const flush = () => {
      raf = 0;
      if (pending === null) return;
      onResize(nodeId, stylesFor(mode, pending));
      pending = null;
    };
    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const next = Math.max(0, Math.min(400, startPx + Math.round(ev.clientY - startY)));
      if (next === resizing?.px) return;
      resizing = { side: mode, px: next };
      pending = next;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId === pointerId) cleanup(true);
    };
    const cleanup = (commit: boolean) => {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      handle.removeEventListener('lostpointercapture', onEnd);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (commit) flush();
      pending = null;
      try {
        if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      } catch {
        // Handle may already be detached.
      }
      resizing = null;
      if (stopResize === cancel) stopResize = null;
    };
    const cancel = () => cleanup(false);

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
    handle.addEventListener('lostpointercapture', onEnd);
    stopResize = cancel;
  }

  function handleResizeKeydown(event: KeyboardEvent, side: 'top' | 'bottom') {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    event.stopPropagation();
    const info = selectedInfo;
    const el = info && !info.locked ? findNodeElement(info.id) : null;
    if (!info || !el) return;
    const step = event.shiftKey ? 16 : 4;
    const next = Math.max(0, Math.min(400, readPadding(el, side) + (event.key === 'ArrowDown' ? step : -step)));
    onResize(info.id, stylesFor(event.altKey ? 'both' : side, next));
  }

  /** Attachment: aborts an in-flight resize when its handle disappears (deselect / lock / edit). */
  const abortResizeOnRemoval: Attachment = () => () => stopResize?.();

  /* ------------------------------------------------------------------------------------ */
  /* Toolbar actions                                                                      */
  /* ------------------------------------------------------------------------------------ */

  function act(event: MouseEvent, action: NodeQuickAction) {
    event.preventDefault();
    event.stopPropagation();
    if (selectedInfo) onAction(selectedInfo.id, action);
  }

  function openMoreMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!selectedInfo) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    onOpenMenu(selectedInfo.id, rect.left, rect.bottom + 4);
  }

  /* ------------------------------------------------------------------------------------ */
  /* Geometry                                                                             */
  /* ------------------------------------------------------------------------------------ */

  const tabPosition = $derived.by(() => {
    if (!selectedBox) return null;
    if (selectedBox.top + selectedBox.height <= 0 || selectedBox.top >= viewport.height) return null;
    const outside = selectedBox.top >= TAB_HEIGHT;
    const top = outside ? selectedBox.top - TAB_HEIGHT : Math.max(selectedBox.top, 0);
    const maxLeft = Math.max(0, viewport.width - tabWidth);
    const left = Math.min(Math.max(selectedBox.left, 0), maxLeft);
    return { top, left, inside: !outside };
  });

  const dropLabel = $derived(
    drop && dropInfo ? `Drop ${drop.position === 'inside' ? 'inside' : drop.position} ${dropInfo.name}` : ''
  );
</script>

<svelte:document
  onclickcapture={handleClickCapture}
  ondblclick={handleDblClick}
  oncontextmenu={handleContextMenu}
  onpointermove={handlePointerMove}
  onmouseout={handleMouseOut}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  ondragend={handleDragEnd}
/>

{#if enabled}
  <div class="cv-overlay" data-canvas-ui {@attach trackLayout} {@attach remeasureOnChange} {@attach observeSelected}>
    {#if hoverBox}
      <div
        class="cv-hover"
        style:top="{hoverBox.top}px"
        style:left="{hoverBox.left}px"
        style:width="{hoverBox.width}px"
        style:height="{hoverBox.height}px"
      ></div>
    {/if}

    {#if drop && dropBox}
      {#if drop.position === 'inside'}
        <div
          class="cv-drop-inside"
          style:top="{dropBox.top}px"
          style:left="{dropBox.left}px"
          style:width="{dropBox.width}px"
          style:height="{dropBox.height}px"
        >
          <span class="cv-pill cv-pill--inside">{dropLabel}</span>
        </div>
      {:else}
        {@const lineTop = drop.position === 'before' ? dropBox.top : dropBox.top + dropBox.height}
        <div
          class="cv-drop-line"
          style:top="{lineTop - 1}px"
          style:left="{dropBox.left}px"
          style:width="{dropBox.width}px"
        >
          <span class="cv-cap cv-cap--start"></span>
          <span class="cv-cap cv-cap--end"></span>
          <span class={['cv-pill', drop.position === 'before' && lineTop > 26 ? 'cv-pill--above' : 'cv-pill--below']}>
            {dropLabel}
          </span>
        </div>
      {/if}
    {/if}

    {#if selectedBox && selectedInfo}
      <div
        class={['cv-selection', selectedInfo.locked && 'cv-selection--locked']}
        style:top="{selectedBox.top}px"
        style:left="{selectedBox.left}px"
        style:width="{selectedBox.width}px"
        style:height="{selectedBox.height}px"
      >
        <span class="cv-corner cv-corner--tl"></span>
        <span class="cv-corner cv-corner--tr"></span>
        <span class="cv-corner cv-corner--bl"></span>
        <span class="cv-corner cv-corner--br"></span>

        {#if !selectedInfo.locked && editingNodeId !== selectedInfo.id}
          {#each ['top', 'bottom'] as const as side (side)}
            <button
              type="button"
              class={['cv-resize', `cv-resize--${side}`, resizing && 'cv-resize--active']}
              aria-label="Adjust {side} padding (drag, or use the arrow keys; hold Alt for both sides)"
              title="Drag to adjust {side} padding. Alt adjusts top and bottom together."
              onpointerdown={(event) => startResize(event, side)}
              onkeydown={(event) => handleResizeKeydown(event, side)}
              {@attach abortResizeOnRemoval}
            ></button>
          {/each}
        {/if}

        {#if resizing}
          <span class="cv-pill cv-pill--metric">
            {resizing.side === 'both' ? 'Padding Y' : resizing.side === 'top' ? 'Padding top' : 'Padding bottom'} · {resizing.px}px
          </span>
        {/if}
      </div>

      {#if tabPosition}
        <div
          class={['cv-tab', selectedInfo.locked && 'cv-tab--locked', tabPosition.inside && 'cv-tab--inside']}
          style:top="{tabPosition.top}px"
          style:left="{tabPosition.left}px"
          role="toolbar"
          aria-label="{selectedInfo.name} actions"
          tabindex="-1"
          draggable={!selectedInfo.locked && !selectedInfo.isRoot}
          ondragstart={handleTabDragStart}
          ondragend={handleDragEnd}
          bind:offsetWidth={tabWidth}
        >
          <span class="cv-tab-label" title={selectedInfo.locked ? `${selectedInfo.name} (locked)` : `Drag to move ${selectedInfo.name}`}>
            {#if selectedInfo.locked}
              <LockSimpleIcon size={14} />
            {/if}
            <TypeIcon size={14} />
            <span class="cv-tab-name">{selectedInfo.name}</span>
          </span>
          <span class="cv-tab-divider" aria-hidden="true"></span>
          {#if !selectedInfo.locked && !selectedInfo.isRoot}
            <button type="button" class="cv-tab-btn" aria-label="Move up" title="Move up (Alt+↑)" onclick={(e) => act(e, 'up')}>
              <ArrowUpIcon size={14} />
            </button>
            <button type="button" class="cv-tab-btn" aria-label="Move down" title="Move down (Alt+↓)" onclick={(e) => act(e, 'down')}>
              <ArrowDownIcon size={14} />
            </button>
          {/if}
          {#if !selectedInfo.isRoot}
            <button type="button" class="cv-tab-btn" aria-label="Duplicate" title="Duplicate (⌘D)" onclick={(e) => act(e, 'duplicate')}>
              <CopyIcon size={14} />
            </button>
          {/if}
          {#if !selectedInfo.locked && !selectedInfo.isRoot}
            <button type="button" class="cv-tab-btn" aria-label="Delete" title="Delete (⌫)" onclick={(e) => act(e, 'delete')}>
              <TrashIcon size={14} />
            </button>
          {/if}
          <button type="button" class="cv-tab-btn" aria-label="More actions" title="More actions" onclick={openMoreMenu}>
            <DotsThreeIcon size={14} weight="bold" />
          </button>
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .cv-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483000;
    pointer-events: none;
    font: 500 11px/1 Inter, system-ui, sans-serif;
  }
  .cv-hover,
  .cv-selection,
  .cv-drop-inside {
    position: fixed;
    box-sizing: border-box;
    pointer-events: none;
  }
  .cv-hover {
    border: 1px solid rgba(47, 107, 255, 0.55);
  }
  .cv-selection {
    border: 1.5px solid #2F6BFF;
  }
  .cv-selection--locked {
    border-color: #475467;
  }
  .cv-corner {
    position: absolute;
    width: 6px;
    height: 6px;
    box-sizing: border-box;
    background: #FFFFFF;
    border: 1px solid #2F6BFF;
  }
  .cv-selection--locked .cv-corner {
    border-color: #475467;
  }
  .cv-corner--tl { top: -3.75px; left: -3.75px; }
  .cv-corner--tr { top: -3.75px; right: -3.75px; }
  .cv-corner--bl { bottom: -3.75px; left: -3.75px; }
  .cv-corner--br { bottom: -3.75px; right: -3.75px; }

  .cv-resize {
    position: absolute;
    left: 50%;
    width: 28px;
    height: 8px;
    margin-left: -14px;
    padding: 0;
    box-sizing: border-box;
    border: 1px solid #2F6BFF;
    border-radius: 4px;
    background: #FFFFFF;
    cursor: ns-resize;
    pointer-events: auto;
    touch-action: none;
  }
  .cv-resize--top { top: -4.75px; }
  .cv-resize--bottom { bottom: -4.75px; }
  .cv-resize:hover,
  .cv-resize--active {
    background: #2F6BFF;
  }
  .cv-resize:focus-visible {
    outline: 2px solid #2F6BFF;
    outline-offset: 2px;
  }

  .cv-drop-inside {
    border: 1.5px dashed #2F6BFF;
    background: rgba(47, 107, 255, 0.04);
  }
  .cv-drop-line {
    position: fixed;
    height: 2px;
    background: #2F6BFF;
    pointer-events: none;
  }
  .cv-cap {
    position: absolute;
    top: -2px;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: #2F6BFF;
  }
  .cv-cap--start { left: -3px; }
  .cv-cap--end { right: -3px; }

  .cv-pill {
    position: absolute;
    left: 8px;
    padding: 4px 8px;
    border-radius: 9999px;
    background: #2F6BFF;
    color: #FFFFFF;
    font: 500 11px/1 Inter, system-ui, sans-serif;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(16, 24, 40, 0.16);
  }
  .cv-pill--above { bottom: 8px; }
  .cv-pill--below { top: 8px; }
  .cv-pill--inside { top: 8px; }
  .cv-pill--metric {
    top: auto;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
  }

  .cv-tab {
    position: fixed;
    display: flex;
    align-items: center;
    gap: 2px;
    height: 22px;
    max-width: calc(100vw - 8px);
    padding: 0 2px 0 6px;
    box-sizing: border-box;
    border-radius: 4px 4px 0 0;
    background: #2F6BFF;
    color: #FFFFFF;
    font: 500 11px/1 Inter, system-ui, sans-serif;
    white-space: nowrap;
    pointer-events: auto;
    cursor: grab;
    user-select: none;
  }
  .cv-tab:active {
    cursor: grabbing;
  }
  .cv-tab--inside {
    border-radius: 0 0 4px 0;
  }
  .cv-tab--locked {
    background: #475467;
    cursor: default;
  }
  .cv-tab-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    padding-right: 4px;
  }
  .cv-tab-name {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cv-tab-divider {
    width: 1px;
    height: 12px;
    margin: 0 2px;
    background: rgba(255, 255, 255, 0.25);
  }
  .cv-tab-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .cv-tab-btn:hover {
    background: rgba(255, 255, 255, 0.18);
  }
  .cv-tab-btn:focus-visible {
    outline: 1.5px solid #FFFFFF;
    outline-offset: -2px;
  }

  :global([data-inline-editing]) {
    outline: 2px solid #2F6BFF !important;
    outline-offset: 2px;
    border-radius: 2px;
    cursor: text;
    user-select: text !important;
    -webkit-user-select: text !important;
  }
</style>
