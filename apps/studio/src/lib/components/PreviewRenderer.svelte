<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import type { BlueprintNode, InteractionRule } from '@app-viz/schema';
  import { cssPropertiesToString, resolveEffectiveStyles } from '@app-viz/engine';
  import type { DropPosition, NodeQuickAction as QuickAction } from '../canvas/messages.js';
  import Container from './preview-components/Container.svelte';
  import Section from './preview-components/Section.svelte';
  import Grid from './preview-components/Grid.svelte';
  import Divider from './preview-components/Divider.svelte';
  import Button from './preview-components/Button.svelte';
  import Badge from './preview-components/Badge.svelte';
  import Card from './preview-components/Card.svelte';
  import Alert from './preview-components/Alert.svelte';
  import Tabs from './preview-components/Tabs.svelte';
  import Navbar from './preview-components/Navbar.svelte';
  import SplitHero from './preview-components/SplitHero.svelte';
  import FeatureGrid from './preview-components/FeatureGrid.svelte';
  import PricingTable from './preview-components/PricingTable.svelte';
  import FaqAccordion from './preview-components/FaqAccordion.svelte';
  import Testimonials from './preview-components/Testimonials.svelte';
  import CtaBanner from './preview-components/CtaBanner.svelte';
  import StatsBar from './preview-components/StatsBar.svelte';
  import Newsletter from './preview-components/Newsletter.svelte';
  import ContactForm from './preview-components/ContactForm.svelte';
  import Footer from './preview-components/Footer.svelte';
  import DashboardShell from './preview-components/DashboardShell.svelte';
  import KpiGrid from './preview-components/KpiGrid.svelte';
  import DataTable from './preview-components/DataTable.svelte';
  import SettingsForm from './preview-components/SettingsForm.svelte';
  import AuthCard from './preview-components/AuthCard.svelte';
  import PreviewRenderer from './PreviewRenderer.svelte';

  /** Re-exported for backwards compatibility; the canonical list lives in `canvas/messages.ts`. */
  export type NodeQuickAction = QuickAction;

  interface Props {
    node: BlueprintNode;
    slotNode?: BlueprintNode;
    activeBreakpoint?: 'mobile' | 'tablet' | 'desktop' | 'wide';
    selectedNodeId: string | null;
    isInteractiveMode: boolean;
    onSelectNode?: (id: string) => void;
    onNavigate?: (path: string) => void;
    onNodeAction?: (nodeId: string, action: NodeQuickAction) => void;
    onDropItem?: (
      payload: { componentType?: string; nodeId?: string },
      targetNodeId: string,
      position: DropPosition
    ) => void;
    onContextMenuNode?: (node: BlueprintNode, x: number, y: number) => void;
    /** `final` is true for the committed value sent when the input loses focus. */
    onInlinePropEdit?: (nodeId: string, propKey: string, value: string, final?: boolean) => void;
    onResizeNodeStyle?: (nodeId: string, styles: Record<string, string>) => void;
    onTriggerInteraction?: (rule: InteractionRule, sourceNode: BlueprintNode) => void;
  }

  let {
    node,
    slotNode,
    activeBreakpoint = 'desktop',
    selectedNodeId,
    isInteractiveMode,
    onSelectNode,
    onNavigate,
    onNodeAction,
    onDropItem,
    onContextMenuNode,
    onInlinePropEdit,
    onResizeNodeStyle,
    onTriggerInteraction
  }: Props = $props();

  const isSelected = $derived(selectedNodeId === node.id);
  const isLocked = $derived(node.locked === true);
  /** Components only navigate in interactive mode; in design mode a click just selects. */
  const componentNavigate = $derived(isInteractiveMode ? onNavigate : undefined);
  const effectiveCss = $derived(resolveEffectiveStyles(node.styles, activeBreakpoint));
  const inlineStyle = $derived(cssPropertiesToString(effectiveCss));
  const sectionInnerLayoutStyle = $derived(
    cssPropertiesToString({
      display: effectiveCss.display,
      flexDirection: effectiveCss.flexDirection,
      justifyContent: effectiveCss.justifyContent,
      alignItems: effectiveCss.alignItems,
      flexWrap: effectiveCss.flexWrap,
      gap: effectiveCss.gap,
      gridTemplateColumns: effectiveCss.gridTemplateColumns,
      textAlign: effectiveCss.textAlign
    })
  );
  const isContainer = $derived(
    node.componentType === 'structure/container' ||
      node.componentType === 'structure/section' ||
      node.componentType === 'structure/grid' ||
      node.componentType === 'app/dashboard-shell'
  );
  const outerWrapperStyle = $derived(
    node.componentType === 'structure/container' ||
      node.componentType === 'structure/section' ||
      node.componentType === 'structure/grid'
      ? cssPropertiesToString({
          flex: effectiveCss.flex,
          alignSelf: effectiveCss.alignSelf,
          width: effectiveCss.width,
          margin: effectiveCss.margin,
          marginTop: effectiveCss.marginTop,
          marginBottom: effectiveCss.marginBottom,
          marginLeft: effectiveCss.marginLeft,
          marginRight: effectiveCss.marginRight
        })
      : inlineStyle
  );

  /**
   * Canvas wrapper semantics. INTERACTIVE mode: a plain element (the real app controls are the
   * tab stops). DESIGN mode: one focusable `group` per node (never role=button, because nodes
   * contain real buttons/links).
   */
  const wrapperA11yAttrs = $derived<Record<string, string | number | undefined>>(
    isInteractiveMode
      ? {}
      : {
          role: 'group',
          tabindex: 0,
          'aria-label': `${node.name}${isLocked ? ' (locked)' : ''}`,
          'aria-roledescription': 'canvas element',
          'aria-current': isSelected ? 'true' : undefined
        }
  );

  const editableTextProps = $derived.by<Array<{ key: string; val: string }>>(() => {
    const entries: Array<{ key: string; val: string }> = [];
    const skipKeys = new Set([
      'variant',
      'size',
      'tone',
      'mode',
      'maxWidth',
      'paddingY',
      'gap',
      'spacing',
      'activeNav',
      'primaryCtaHref',
      'secondaryCtaHref',
      'ctaHref',
      'actionHref',
      'redirectHref',
      'href',
      'logoUrl',
      'align',
      'textAlign',
      'direction',
      'justify',
      'alignItems',
      'justifyItems',
      'surfaceTone'
    ]);
    for (const [k, v] of Object.entries(node.props || {})) {
      if (typeof v === 'string' && !skipKeys.has(k)) {
        entries.push({ key: k, val: v });
      }
    }
    return entries;
  });

  let dropZone = $state<DropPosition | null>(null);
  let showInlineEditor = $state(false);
  let isResizingPadding = $state(false);
  let livePaddingPx = $state<number | null>(null);

  const inlineEditorOpen = $derived(
    showInlineEditor && isSelected && !isInteractiveMode && !isLocked && editableTextProps.length > 0
  );

  /* ---------------------------------------------------------------------------------------- */
  /* Inline text editor: while an input is focused we keep a local draft and never rebind its */
  /* value from props (late SYNC_STATE echoes would otherwise reset the caret mid-typing).    */
  /* ---------------------------------------------------------------------------------------- */

  let focusedPropKey = $state<string | null>(null);
  let draftValue = $state('');

  function inlineInputValue(key: string, propValue: string): string {
    return focusedPropKey === key ? draftValue : propValue;
  }

  function handleInlineFocus(key: string, e: FocusEvent) {
    draftValue = (e.currentTarget as HTMLInputElement).value;
    focusedPropKey = key;
  }

  function handleInlineInput(key: string, e: Event) {
    if (isLocked) return;
    const value = (e.currentTarget as HTMLInputElement).value;
    draftValue = value;
    onInlinePropEdit?.(node.id, key, value, false);
  }

  function handleInlineBlur(key: string, propValue: string, e: FocusEvent) {
    const value = (e.currentTarget as HTMLInputElement).value;
    if (focusedPropKey === key) focusedPropKey = null;
    if (!isLocked && value !== propValue) {
      onInlinePropEdit?.(node.id, key, value, true);
    }
  }

  function handleInlineKeyDown(e: KeyboardEvent) {
    e.stopPropagation();
    const input = e.currentTarget as HTMLInputElement;
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      input.blur();
      showInlineEditor = false;
    }
  }

  // Close the inline editor whenever it can no longer be used (deselected, locked, interactive).
  $effect(() => {
    if (!isSelected || isLocked || isInteractiveMode) {
      untrack(() => {
        showInlineEditor = false;
        focusedPropKey = null;
      });
    }
  });

  /* ---------------------------------------------------------------------------------------- */
  /* Padding drag handle (pointer events + pointer capture, always cleaned up)                */
  /* ---------------------------------------------------------------------------------------- */

  let stopPaddingResize: (() => void) | null = null;

  function readStartPadding(): number {
    const currentRaw = String(effectiveCss.paddingBottom || effectiveCss.paddingTop || '24px');
    const parsedStart = parseInt(currentRaw, 10);
    return Number.isFinite(parsedStart) ? parsedStart : 24;
  }

  function emitPadding(nodeId: string, px: number) {
    onResizeNodeStyle?.(nodeId, { paddingTop: `${px}px`, paddingBottom: `${px}px` });
  }

  function startPaddingResize(e: PointerEvent) {
    if (isInteractiveMode || isLocked || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    stopPaddingResize?.();

    const handle = e.currentTarget as HTMLElement;
    const pointerId = e.pointerId;
    const nodeId = node.id;
    const startY = e.clientY;
    const startPx = readStartPadding();
    let pendingPx: number | null = null;
    let frame = 0;

    isResizingPadding = true;
    livePaddingPx = startPx;

    try {
      handle.setPointerCapture(pointerId);
    } catch {
      // Pointer may already be released (e.g. synthetic events); listeners still clean up.
    }

    function flush() {
      frame = 0;
      if (pendingPx === null) return;
      const px = pendingPx;
      pendingPx = null;
      emitPadding(nodeId, px);
    }

    function onMove(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      const delta = Math.round((ev.clientY - startY) / 2);
      const nextPx = Math.max(0, Math.min(200, startPx + delta));
      if (nextPx === livePaddingPx) return;
      livePaddingPx = nextPx;
      pendingPx = nextPx;
      if (!frame) frame = requestAnimationFrame(flush);
    }

    function onEnd(ev: PointerEvent) {
      if (ev.pointerId !== pointerId) return;
      cleanup(true);
    }

    function cleanup(commitPending: boolean) {
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onEnd);
      handle.removeEventListener('pointercancel', onEnd);
      handle.removeEventListener('lostpointercapture', onEnd);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      if (commitPending) flush();
      pendingPx = null;
      try {
        if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      } catch {
        // Element may be detached already.
      }
      isResizingPadding = false;
      if (stopPaddingResize === cancel) stopPaddingResize = null;
    }

    function cancel() {
      cleanup(false);
    }

    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onEnd);
    handle.addEventListener('pointercancel', onEnd);
    handle.addEventListener('lostpointercapture', onEnd);
    stopPaddingResize = cancel;
  }

  function handlePaddingKeyDown(e: KeyboardEvent) {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    e.stopPropagation();
    if (isInteractiveMode || isLocked) return;
    const step = e.shiftKey ? 16 : 4;
    const base = livePaddingPx ?? readStartPadding();
    const nextPx = Math.max(0, Math.min(200, base + (e.key === 'ArrowDown' ? step : -step)));
    livePaddingPx = nextPx;
    emitPadding(node.id, nextPx);
  }

  // Abort an in-flight drag if the handle disappears (deselect / lock / mode switch)…
  $effect(() => {
    if (!isSelected || isLocked || isInteractiveMode) {
      untrack(() => stopPaddingResize?.());
    }
  });
  // …and always on destroy.
  onDestroy(() => stopPaddingResize?.());

  /* ---------------------------------------------------------------------------------------- */
  /* Selection, context menu, drag & drop                                                     */
  /* ---------------------------------------------------------------------------------------- */

  function handleClick(e: MouseEvent) {
    if (!isInteractiveMode) {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
      return;
    }

    const clickRule = (node.interactions || []).find(
      (r) => r.trigger === 'onClick' || r.trigger === 'click'
    );
    if (clickRule) {
      e.preventDefault();
      e.stopPropagation();
      if (onTriggerInteraction) {
        onTriggerInteraction(clickRule, node);
      } else if (
        clickRule.actionType === 'navigate' &&
        typeof clickRule.payload?.path === 'string'
      ) {
        onNavigate?.(clickRule.payload.path);
      }
    }
  }

  function handleDblClick(e: MouseEvent) {
    if (isInteractiveMode || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectNode?.(node.id);
    if (editableTextProps.length > 0) {
      showInlineEditor = true;
    }
  }

  function handleContextMenu(e: MouseEvent) {
    if (isInteractiveMode) return;
    e.preventDefault();
    e.stopPropagation();
    onSelectNode?.(node.id);
    onContextMenuNode?.(node, e.clientX, e.clientY);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (isInteractiveMode) return;
    // Only react when the wrapper itself is focused, never for keys typed in nested controls.
    if (e.target !== e.currentTarget) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onSelectNode?.(node.id);
    }
  }

  function handleDragStart(e: DragEvent) {
    if (isInteractiveMode || isLocked) return;
    e.stopPropagation();
    e.dataTransfer?.setData('application/x-app-viz-node-id', node.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: DragEvent) {
    // Locked nodes are not drop targets: let the event bubble to the nearest unlocked ancestor.
    if (isInteractiveMode || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const ratio = rect.height > 0 ? relY / rect.height : 0.5;

    if (isContainer && ratio > 0.22 && ratio < 0.78) {
      dropZone = 'inside';
    } else if (ratio < 0.5) {
      dropZone = 'before';
    } else {
      dropZone = 'after';
    }
  }

  function handleDragLeave(e: DragEvent) {
    if (isLocked) return;
    e.stopPropagation();
    dropZone = null;
  }

  function handleDrop(e: DragEvent) {
    if (isInteractiveMode || isLocked) return;
    e.preventDefault();
    e.stopPropagation();
    const targetZone = dropZone || (isContainer ? 'inside' : 'after');
    dropZone = null;

    const componentType = e.dataTransfer?.getData('application/x-app-viz-component');
    const draggedNodeId = e.dataTransfer?.getData('application/x-app-viz-node-id');

    if (componentType) {
      onDropItem?.({ componentType }, node.id, targetZone);
    } else if (draggedNodeId && draggedNodeId !== node.id) {
      onDropItem?.({ nodeId: draggedNodeId }, node.id, targetZone);
    }
  }

  function triggerAction(e: MouseEvent, action: NodeQuickAction) {
    e.preventDefault();
    e.stopPropagation();
    onNodeAction?.(node.id, action);
  }
</script>

{#if !node.hidden}
  {#if node.componentType === 'structure/slot'}
    {#if slotNode}
      <PreviewRenderer
        node={slotNode}
        {activeBreakpoint}
        {selectedNodeId}
        {isInteractiveMode}
        {onSelectNode}
        {onNavigate}
        {onNodeAction}
        {onDropItem}
        {onContextMenuNode}
        {onInlinePropEdit}
        {onResizeNodeStyle}
        {onTriggerInteraction}
      />
    {/if}
  {:else}
    <div
      data-node-id={node.id}
      data-node-type={node.componentType}
      data-locked={isLocked ? 'true' : undefined}
      {...wrapperA11yAttrs}
      draggable={!isInteractiveMode && !isLocked && !inlineEditorOpen}
      ondragstart={handleDragStart}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      onclick={handleClick}
      ondblclick={handleDblClick}
      oncontextmenu={handleContextMenu}
      onkeydown={handleKeyDown}
      class="preview-node {!isInteractiveMode ? 'preview-node--editable' : ''} {isSelected && !isInteractiveMode ? 'preview-node--selected' : ''} {isLocked && !isInteractiveMode ? 'preview-node--locked' : ''} {dropZone ? `preview-node--drop-${dropZone}` : ''} {node.customClasses || ''}"
      style={outerWrapperStyle}
    >
      {#if dropZone && !isInteractiveMode}
        <div class="drop-indicator drop-indicator--{dropZone}">
          {dropZone === 'inside' ? `Drop inside ${node.name}` : `Insert ${dropZone} ${node.name}`}
        </div>
      {/if}

      {#if isSelected && !isInteractiveMode}
        <div class="preview-node__toolbar {isLocked ? 'preview-node__toolbar--locked' : ''}">
          {#if isLocked}
            <span class="preview-node__lock" title="Locked — editing is disabled" aria-label="Locked">🔒</span>
          {/if}
          <span class="preview-node__badge-text">{node.name}</span>
          {#if onNodeAction}
            <div class="preview-node__actions">
              {#if !isLocked}
                {#if editableTextProps.length > 0}
                  <button
                    type="button"
                    class="preview-node__action-btn"
                    title="Inline Text Edit (Double-Click)"
                    aria-label="Inline edit text"
                    aria-pressed={inlineEditorOpen}
                    onclick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      showInlineEditor = !showInlineEditor;
                    }}
                  >✏️</button>
                {/if}
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Align Left"
                  aria-label="Align left"
                  onclick={(e) => triggerAction(e, 'align-left')}
                >⬅</button>
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Center Content / Element"
                  aria-label="Center content"
                  onclick={(e) => triggerAction(e, 'align-center')}
                >⬌</button>
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Align Right"
                  aria-label="Align right"
                  onclick={(e) => triggerAction(e, 'align-right')}
                >➡</button>
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Move Up (Alt+↑)"
                  aria-label="Move node up"
                  onclick={(e) => triggerAction(e, 'up')}
                >↑</button>
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Move Down (Alt+↓)"
                  aria-label="Move node down"
                  onclick={(e) => triggerAction(e, 'down')}
                >↓</button>
                <button
                  type="button"
                  class="preview-node__action-btn"
                  title="Wrap in Section"
                  aria-label="Wrap node in section"
                  onclick={(e) => triggerAction(e, 'wrap-section')}
                >📦</button>
              {/if}
              <button
                type="button"
                class="preview-node__action-btn"
                title="Duplicate (Cmd+D)"
                aria-label="Duplicate node"
                onclick={(e) => triggerAction(e, 'duplicate')}
              >⧉</button>
              {#if !isLocked}
                <button
                  type="button"
                  class="preview-node__action-btn preview-node__action-btn--danger"
                  title="Delete (Backspace)"
                  aria-label="Delete node"
                  onclick={(e) => triggerAction(e, 'delete')}
                >✕</button>
              {/if}
            </div>
          {/if}
        </div>

        {#if inlineEditorOpen}
          <!-- On-Canvas Inline Quick Text Editor Popover -->
          <div
            class="inline-editor-popover"
            role="region"
            aria-label="Inline text editor"
          >
            <div class="inline-editor-header">
              <span>✏️ Inline Copy Editor ({node.name})</span>
              <button
                type="button"
                class="inline-editor-close"
                onclick={(e) => {
                  e.stopPropagation();
                  showInlineEditor = false;
                }}
              >Done</button>
            </div>
            <div class="inline-editor-fields">
              {#each editableTextProps as item (item.key)}
                <label class="inline-editor-field">
                  <span class="inline-editor-label">{item.key}</span>
                  <input
                    type="text"
                    value={inlineInputValue(item.key, item.val)}
                    onclick={(e) => e.stopPropagation()}
                    ondblclick={(e) => e.stopPropagation()}
                    onkeydown={handleInlineKeyDown}
                    onfocus={(e) => handleInlineFocus(item.key, e)}
                    oninput={(e) => handleInlineInput(item.key, e)}
                    onblur={(e) => handleInlineBlur(item.key, item.val, e)}
                    class="inline-editor-input"
                  />
                </label>
              {/each}
            </div>
          </div>
        {/if}

        {#if !isLocked}
          <!-- Interactive On-Canvas Vertical Spacing Drag Handle (drag or ↑/↓ keys) -->
          <button
            type="button"
            class="resize-padding-handle {isResizingPadding ? 'resize-padding-handle--active' : ''}"
            title="Drag vertically (or use ↑/↓) to resize top & bottom padding"
            aria-label="Resize vertical padding"
            onpointerdown={startPaddingResize}
            onkeydown={handlePaddingKeyDown}
            onclick={(e) => e.stopPropagation()}
          >
            ↕ {isResizingPadding && livePaddingPx !== null
              ? `Padding: ${livePaddingPx}px`
              : effectiveCss.paddingBottom || 'Drag Padding'}
          </button>
        {/if}
      {/if}

      {#if node.componentType === 'structure/container'}
        <Container
          maxWidth={node.props.maxWidth || 'xl'}
          direction={node.props.direction}
          justify={node.props.justify}
          align={node.props.align}
          textAlign={node.props.textAlign}
          gap={node.props.gap}
          style={inlineStyle}
        >
          {#if (!node.children || node.children.length === 0) && !isInteractiveMode}
            <div class="el-empty-column-slot">
              <span class="el-empty-column-plus">+</span>
              <span class="el-empty-column-text">{node.name} — Drag widget here</span>
            </div>
          {:else}
            {#each node.children || [] as child (child.id)}
              <PreviewRenderer
                node={child}
                {slotNode}
                {activeBreakpoint}
                {selectedNodeId}
                {isInteractiveMode}
                {onSelectNode}
                {onNavigate}
                {onNodeAction}
                {onDropItem}
                {onContextMenuNode}
                {onInlinePropEdit}
                {onResizeNodeStyle}
                {onTriggerInteraction}
              />
            {/each}
          {/if}
        </Container>
      {:else if node.componentType === 'structure/section'}
        <Section
          variant={node.props.variant}
          surfaceTone={node.props.surfaceTone}
          paddingY={node.props.paddingY}
          maxWidth={node.props.maxWidth}
          direction={node.props.direction}
          justify={node.props.justify}
          align={node.props.align}
          textAlign={node.props.textAlign}
          gap={node.props.gap}
          style={inlineStyle}
          contentStyle={sectionInnerLayoutStyle}
        >
          {#if (!node.children || node.children.length === 0) && !isInteractiveMode}
            <div class="el-empty-column-slot">
              <span class="el-empty-column-plus">+</span>
              <span class="el-empty-column-text">{node.name} — Drag widget here</span>
            </div>
          {:else}
            {#each node.children || [] as child (child.id)}
              <PreviewRenderer
                node={child}
                {slotNode}
                {activeBreakpoint}
                {selectedNodeId}
                {isInteractiveMode}
                {onSelectNode}
                {onNavigate}
                {onNodeAction}
                {onDropItem}
                {onContextMenuNode}
                {onInlinePropEdit}
                {onResizeNodeStyle}
                {onTriggerInteraction}
              />
            {/each}
          {/if}
        </Section>
      {:else if node.componentType === 'structure/grid'}
        <Grid
          columns={node.props.columns}
          gap={node.props.gap}
          alignItems={node.props.alignItems}
          justifyItems={node.props.justifyItems}
          textAlign={node.props.textAlign}
          style={inlineStyle}
        >
          {#if (!node.children || node.children.length === 0) && !isInteractiveMode}
            <div class="el-empty-column-slot">
              <span class="el-empty-column-plus">+</span>
              <span class="el-empty-column-text">{node.name} — Drag widget here</span>
            </div>
          {:else}
            {#each node.children || [] as child (child.id)}
              <PreviewRenderer
                node={child}
                {slotNode}
                {activeBreakpoint}
                {selectedNodeId}
                {isInteractiveMode}
                {onSelectNode}
                {onNavigate}
                {onNodeAction}
                {onDropItem}
                {onContextMenuNode}
                {onInlinePropEdit}
                {onResizeNodeStyle}
                {onTriggerInteraction}
              />
            {/each}
          {/if}
        </Grid>
      {:else if node.componentType === 'structure/divider'}
        <Divider spacing={node.props.spacing} label={node.props.label} />
      {:else if node.componentType === 'hero/split-hero'}
        <SplitHero
          eyebrow={node.props.eyebrow}
          title={node.props.title}
          subtitle={node.props.subtitle}
          primaryCtaText={node.props.primaryCtaText}
          primaryCtaHref={node.props.primaryCtaHref}
          secondaryCtaText={node.props.secondaryCtaText}
          secondaryCtaHref={node.props.secondaryCtaHref}
          badgeText={node.props.badgeText}
          align={node.props.align}
          style={inlineStyle}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'marketing/feature-grid'}
        <FeatureGrid
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          sectionDescription={node.props.sectionDescription}
          columns={node.props.columns}
          features={node.props.features}
        />
      {:else if node.componentType === 'marketing/pricing-table'}
        <PricingTable
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          sectionDescription={node.props.sectionDescription}
          plans={node.props.plans}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'marketing/faq-accordion'}
        <FaqAccordion
          sectionTitle={node.props.sectionTitle}
          items={node.props.items}
        />
      {:else if node.componentType === 'marketing/testimonials'}
        <Testimonials
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          testimonials={node.props.testimonials}
        />
      {:else if node.componentType === 'marketing/cta-banner'}
        <CtaBanner
          eyebrow={node.props.eyebrow}
          title={node.props.title}
          subtitle={node.props.subtitle}
          primaryCtaText={node.props.primaryCtaText}
          primaryCtaHref={node.props.primaryCtaHref}
          secondaryCtaText={node.props.secondaryCtaText}
          secondaryCtaHref={node.props.secondaryCtaHref}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'marketing/stats-bar'}
        <StatsBar stats={node.props.stats} />
      {:else if node.componentType === 'marketing/newsletter'}
        <Newsletter
          title={node.props.title}
          subtitle={node.props.subtitle}
          placeholder={node.props.placeholder}
          buttonText={node.props.buttonText}
        />
      {:else if node.componentType === 'marketing/contact-form'}
        <ContactForm
          sectionEyebrow={node.props.sectionEyebrow}
          sectionTitle={node.props.sectionTitle}
          sectionSubtitle={node.props.sectionSubtitle}
          submitText={node.props.submitText}
        />
      {:else if node.componentType === 'marketing/footer'}
        <Footer
          brandName={node.props.brandName}
          tagline={node.props.tagline}
          copyright={node.props.copyright}
          columns={node.props.columns}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'navigation/navbar'}
        <Navbar
          brandName={node.props.brandName}
          logoUrl={node.props.logoUrl}
          links={node.props.links}
          ctaText={node.props.ctaText}
          ctaHref={node.props.ctaHref}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'app/dashboard-shell'}
        <DashboardShell
          title={node.props.title}
          activeNav={node.props.activeNav}
          onNavigate={componentNavigate}
        >
          {#each node.children || [] as child (child.id)}
            <PreviewRenderer
              node={child}
              {slotNode}
              {activeBreakpoint}
              {selectedNodeId}
              {isInteractiveMode}
              {onSelectNode}
              {onNavigate}
              {onNodeAction}
              {onDropItem}
              {onContextMenuNode}
              {onInlinePropEdit}
              {onResizeNodeStyle}
              {onTriggerInteraction}
            />
          {/each}
        </DashboardShell>
      {:else if node.componentType === 'app/kpi-grid'}
        <KpiGrid cards={node.props.cards} />
      {:else if node.componentType === 'app/data-table'}
        <DataTable
          title={node.props.title}
          columns={node.props.columns}
          rows={node.props.rows}
        />
      {:else if node.componentType === 'app/settings-form'}
        <SettingsForm
          initialName={node.props.initialName}
          initialEmail={node.props.initialEmail}
          notificationsEnabled={node.props.notificationsEnabled}
        />
      {:else if node.componentType === 'app/auth-card'}
        <AuthCard
          mode={node.props.mode}
          brandName={node.props.brandName}
          title={node.props.title}
          subtitle={node.props.subtitle}
          redirectHref={node.props.redirectHref}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'ui/button'}
        <Button
          variant={node.props.variant}
          size={node.props.size}
          href={node.props.href}
          onNavigate={componentNavigate}
        >
          {node.props.text || 'Button'}
        </Button>
      {:else if node.componentType === 'ui/badge'}
        <Badge text={node.props.text} tone={node.props.tone} />
      {:else if node.componentType === 'ui/card'}
        <Card
          variant={node.props.variant}
          eyebrow={node.props.eyebrow}
          title={node.props.title}
          body={node.props.body}
          actionText={node.props.actionText}
          actionHref={node.props.actionHref}
          ctaText={node.props.ctaText}
          ctaHref={node.props.ctaHref}
          align={node.props.align}
          style={inlineStyle}
          onNavigate={componentNavigate}
        />
      {:else if node.componentType === 'ui/alert'}
        <Alert
          tone={node.props.tone}
          title={node.props.title}
          message={node.props.message}
          dismissible={node.props.dismissible}
        />
      {:else if node.componentType === 'ui/tabs'}
        <Tabs tabs={node.props.tabs} />
      {:else}
        <div>
          {#each node.children || [] as child (child.id)}
            <PreviewRenderer
              node={child}
              {slotNode}
              {activeBreakpoint}
              {selectedNodeId}
              {isInteractiveMode}
              {onSelectNode}
              {onNavigate}
              {onNodeAction}
              {onDropItem}
              {onContextMenuNode}
              {onInlinePropEdit}
              {onResizeNodeStyle}
              {onTriggerInteraction}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  .inline-editor-popover {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 60;
    width: min(24rem, 92vw);
    background: var(--md-sys-color-surface-container-lowest, #FFFFFF);
    color: var(--md-sys-color-on-surface, #1B1B1F);
    border: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
    border-radius: 16px;
    padding: 0.75rem 0.875rem;
    box-shadow: 0 8px 28px rgba(11, 87, 208, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08);
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
  }
  .inline-editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--md-sys-color-primary, #0B57D0);
    margin-bottom: 0.5rem;
  }
  .inline-editor-close {
    background: var(--md-sys-color-primary, #0B57D0);
    color: var(--md-sys-color-on-primary, #FFFFFF);
    border: none;
    border-radius: 9999px;
    padding: 3px 10px;
    font-size: 0.6875rem;
    font-weight: 600;
    cursor: pointer;
  }
  .inline-editor-fields {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    max-height: 13rem;
    overflow-y: auto;
  }
  .inline-editor-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .inline-editor-label {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono, monospace);
    color: var(--md-sys-color-on-surface-variant, #444746);
    text-transform: uppercase;
  }
  .inline-editor-input {
    background: var(--md-sys-color-surface-container-low, #F8FAFD);
    border: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
    color: var(--md-sys-color-on-surface, #1B1B1F);
    border-radius: 8px;
    padding: 5px 8px;
    font-size: 0.75rem;
  }
  .resize-padding-handle {
    position: absolute;
    bottom: -11px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 35;
    background: #0B57D0;
    color: #FFFFFF;
    border: 1px solid #FFFFFF;
    border-radius: 9999px;
    padding: 1px 10px;
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono, monospace);
    font-weight: 600;
    cursor: ns-resize;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    touch-action: none;
    user-select: none;
  }
  .resize-padding-handle--active {
    background: #146C2E;
  }
  .resize-padding-handle:focus-visible {
    outline: 2px solid #FFFFFF;
    outline-offset: 2px;
  }
  .preview-node {
    position: relative;
    transition: outline 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  .preview-node--editable:hover {
    outline: 1px dashed var(--md-sys-color-primary, #0B57D0);
  }
  .preview-node--editable:focus-visible {
    outline: 2px dashed var(--md-sys-color-primary, #0B57D0);
    outline-offset: 2px;
  }
  .preview-node--locked {
    cursor: not-allowed;
  }
  .preview-node--selected {
    outline: 2px solid var(--md-sys-color-primary, #0B57D0) !important;
    z-index: 10;
  }
  .preview-node--drop-before {
    box-shadow: inset 0 4px 0 0 #0B57D0;
  }
  .preview-node--drop-after {
    box-shadow: inset 0 -4px 0 0 #0B57D0;
  }
  .preview-node--drop-inside {
    outline: 2px dashed #146C2E !important;
    background-color: rgba(20, 108, 46, 0.04);
  }
  .drop-indicator {
    position: absolute;
    left: 12px;
    z-index: 40;
    background-color: #0B57D0;
    color: #FFFFFF;
    font-size: 0.6875rem;
    font-family: var(--md-sys-font-mono, monospace);
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 9999px;
    pointer-events: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }
  .drop-indicator--before {
    top: -10px;
  }
  .drop-indicator--after {
    bottom: -10px;
  }
  .drop-indicator--inside {
    top: 8px;
    background-color: #146C2E;
  }
  .preview-node__toolbar {
    position: absolute;
    top: -28px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #0B57D0;
    color: #FFFFFF;
    font-size: 0.72rem;
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
    padding: 3px 10px;
    border-radius: 8px 8px 0 0;
    font-weight: 600;
    z-index: 30;
    white-space: nowrap;
    box-shadow: 0 -2px 10px rgba(11, 87, 208, 0.28);
  }
  .preview-node__toolbar--locked {
    background-color: #5E5E62;
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  }
  .preview-node__lock {
    font-size: 0.6875rem;
    line-height: 1;
  }
  .preview-node__badge-text {
    padding-right: 4px;
  }
  .preview-node__actions {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    border-left: 1px solid rgba(255, 255, 255, 0.25);
    padding-left: 4px;
  }
  .preview-node__action-btn {
    background: transparent;
    border: none;
    color: inherit;
    font-size: 0.6875rem;
    line-height: 1;
    padding: 2px 4px;
    border-radius: 3px;
    cursor: pointer;
  }
  .preview-node__action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  .preview-node__action-btn--danger:hover {
    background: #B3261E;
    color: #FFFFFF;
  }
  .el-empty-column-slot {
    min-height: 92px;
    border: 1.5px dashed rgba(11, 87, 208, 0.45);
    border-radius: 10px;
    background: rgba(11, 87, 208, 0.03);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 1rem;
    color: #0B57D0;
    transition: background-color 140ms ease, border-color 140ms ease;
  }
  .el-empty-column-slot:hover {
    border-color: #0B57D0;
    background: rgba(11, 87, 208, 0.07);
  }
  .el-empty-column-plus {
    width: 28px;
    height: 28px;
    border-radius: 9999px;
    background: rgba(11, 87, 208, 0.12);
    color: #0B57D0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .el-empty-column-text {
    font-size: 0.72rem;
    font-weight: 600;
    opacity: 0.85;
  }
</style>
