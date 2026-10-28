<script lang="ts">
  import { onMount } from 'svelte';
  import {
    type ProjectBlueprint,
    type BlueprintNode,
    type InteractionRule,
    ProjectBlueprintSchema,
    createDefaultAcmeSaaSProject
  } from '@app-viz/schema';
  import { compileNodeScopedCss, findNodeInBlueprint } from '@app-viz/engine';
  import PreviewRenderer from '#lib/components/PreviewRenderer.svelte';
  import {
    NON_MUTATING_NODE_ACTIONS,
    classifyHref,
    parseParentMessage,
    type KeyShortcut,
    type NodeQuickAction,
    type PreviewToParentMessage
  } from '#lib/canvas/messages.js';

  let blueprint = $state<ProjectBlueprint>(createDefaultAcmeSaaSProject());
  let activePageId = $state<string>('10000000-0000-0000-0000-000000000001');
  let activeBreakpoint = $state<'mobile' | 'tablet' | 'desktop' | 'wide'>('desktop');
  let selectedNodeId = $state<string | null>(null);
  let isInteractiveMode = $state<boolean>(false);

  let contextMenu = $state<{
    node: BlueprintNode;
    x: number;
    y: number;
  } | null>(null);

  let activeModal = $state<{ title: string; body: string; ctaText: string } | null>(null);
  let activeDrawer = $state<{ title: string; body: string } | null>(null);
  let activeToast = $state<string | null>(null);
  let customAppState = $state<Record<string, string>>({});
  let showStructurePicker = $state(false);
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  /** Typed, origin-pinned message to the studio. No-op when /preview is opened standalone. */
  function postToParent(message: PreviewToParentMessage) {
    if (window.parent === window) return;
    window.parent.postMessage(message, window.location.origin);
  }

  function sendShortcut(shortcut: KeyShortcut) {
    postToParent({ type: 'KEY_SHORTCUT', shortcut });
  }

  function showToast(message: string, durationMs = 3200) {
    if (toastTimer !== null) clearTimeout(toastTimer);
    activeToast = message;
    toastTimer = setTimeout(() => {
      activeToast = null;
      toastTimer = null;
    }, durationMs);
  }

  function findNode(nodeId: string | null): BlueprintNode | null {
    if (!nodeId) return null;
    return findNodeInBlueprint(blueprint, nodeId)?.node ?? null;
  }

  const contextNodeLocked = $derived(contextMenu ? findNode(contextMenu.node.id)?.locked === true : false);

  const containerStructurePresets = [
    { id: 'flex-1col', label: '1 Col (100%)', cols: ['100%'] },
    { id: 'flex-2col-50-50', label: '2 Cols (50 / 50)', cols: ['50%', '50%'] },
    { id: 'flex-2col-33-67', label: 'Sidebar Left (33 / 67)', cols: ['33%', '67%'] },
    { id: 'flex-2col-67-33', label: 'Sidebar Right (67 / 33)', cols: ['67%', '33%'] },
    { id: 'flex-3col', label: '3 Cols (33 × 3)', cols: ['33%', '33%', '33%'] },
    { id: 'flex-4col', label: '4 Cols (25 × 4)', cols: ['25%', '25%', '25%', '25%'] }
  ];

  const quickStructurePresets = [
    { type: 'hero/split-hero', icon: '🦸', label: 'Hero Banner' },
    { type: 'marketing/feature-grid', icon: '✨', label: '3-Col Features' },
    { type: 'marketing/pricing-table', icon: '💎', label: 'Pricing Table' },
    { type: 'marketing/stats-bar', icon: '📈', label: 'Stats Counter' },
    { type: 'app/kpi-grid', icon: '📊', label: 'KPI Metrics' },
    { type: 'marketing/testimonials', icon: '💬', label: 'Testimonials' },
    { type: 'marketing/faq-accordion', icon: '❓', label: 'FAQ Accordion' },
    { type: 'marketing/cta-banner', icon: '📣', label: 'CTA Banner' },
    { type: 'marketing/contact-form', icon: '📞', label: 'Contact Form' },
    { type: 'ui/tabs', icon: '🗂️', label: 'Nested Tabs' }
  ];

  function handleInsertStructure(structureId: string) {
    if (!activePage) return;
    showStructurePicker = false;
    postToParent({
      type: 'INSERT_STRUCTURE',
      structureId,
      targetNodeId: activePage.rootNode.id
    });
  }

  function handleQuickInsertOnCanvas(componentType: string) {
    if (!activePage) return;
    showStructurePicker = false;
    postToParent({
      type: 'DROP_ITEM',
      componentType,
      targetNodeId: activePage.rootNode.id,
      position: 'inside'
    });
  }

  function handleOpenTemplateModal() {
    postToParent({ type: 'OPEN_BLOCK_LIBRARY' });
  }

  function handleOpenAiComposer() {
    sendShortcut('command-palette');
  }

  const activePage = $derived(
    blueprint.pages.find((p) => p.id === activePageId) || blueprint.pages[0]
  );

  const activeLayout = $derived(
    activePage?.layoutId
      ? blueprint.layouts.find((l) => l.id === activePage.layoutId)
      : undefined
  );

  // Injects CSS variables for MD3 design tokens + interactive state rules (:hover, :focus, :active)
  $effect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [key, val] of Object.entries(blueprint.tokens.colors || {})) {
        root.style.setProperty(`--md-sys-color-${key}`, val);
      }
      for (const [key, val] of Object.entries(blueprint.tokens.radii || {})) {
        root.style.setProperty(`--md-sys-shape-corner-${key}`, val);
      }
      root.style.setProperty(
        '--md-sys-font-heading',
        blueprint.tokens.fonts?.heading || 'Roboto, sans-serif'
      );
      root.style.setProperty(
        '--md-sys-font-body',
        blueprint.tokens.fonts?.body || 'Roboto, sans-serif'
      );

      let styleTag = document.getElementById('app-viz-state-styles') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'app-viz-state-styles';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = compileNodeScopedCss(
        [activeLayout?.rootNode, activePage?.rootNode],
        { includeMediaQueries: false, includeStates: true }
      );
    }
  });

  function isEditableTarget(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    return Boolean(
      el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
    );
  }

  /** True when the user has a non-empty text selection inside the canvas. */
  function hasCanvasTextSelection(): boolean {
    const sel = window.getSelection();
    return Boolean(sel && !sel.isCollapsed && sel.toString().trim().length > 0);
  }

  /** Closes the preview's own transient UI (topmost first). Returns true if something closed. */
  function closeLocalOverlay(): boolean {
    if (contextMenu) {
      contextMenu = null;
      return true;
    }
    if (activeModal) {
      activeModal = null;
      return true;
    }
    if (activeDrawer) {
      activeDrawer = null;
      return true;
    }
    if (showStructurePicker) {
      showStructurePicker = false;
      return true;
    }
    return false;
  }

  function handleKeyDown(e: KeyboardEvent) {
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    if (mod && key === 'k') {
      e.preventDefault();
      sendShortcut('command-palette');
      return;
    }

    if (mod && key === 'i') {
      e.preventDefault();
      sendShortcut('navigator');
      return;
    }

    if (e.key === 'Escape') {
      // Close preview-local overlays first; only forward when nothing local was open.
      if (closeLocalOverlay()) {
        e.preventDefault();
        return;
      }
      if (isEditableTarget(e.target)) return;
      sendShortcut('escape');
      return;
    }

    if (isEditableTarget(e.target)) return;

    if (mod && key === 'z') {
      e.preventDefault();
      sendShortcut(e.shiftKey ? 'redo' : 'undo');
    } else if (mod && key === 'y') {
      e.preventDefault();
      sendShortcut('redo');
    } else if (mod && key === 'd') {
      e.preventDefault();
      sendShortcut('duplicate');
    } else if (mod && key === 'c') {
      // Let the browser copy real text selections.
      if (hasCanvasTextSelection()) return;
      e.preventDefault();
      sendShortcut(e.shiftKey ? 'copy-style' : 'copy');
    } else if (mod && key === 'v') {
      if (hasCanvasTextSelection()) return;
      e.preventDefault();
      sendShortcut(e.shiftKey ? 'paste-style' : 'paste');
    } else if (e.altKey && !mod && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      if (!isInteractiveMode && selectedNodeId && !findNode(selectedNodeId)?.locked) {
        e.preventDefault();
        sendShortcut(e.key === 'ArrowUp' ? 'move-up' : 'move-down');
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!isInteractiveMode && selectedNodeId && !findNode(selectedNodeId)?.locked) {
        e.preventDefault();
        sendShortcut('delete');
      }
    }
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
      // keep raw fragment
    }
    const target = document.getElementById(id) ?? document.getElementsByName(id)[0] ?? null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Link safety: no <a> inside the canvas may ever navigate the iframe away. Runs in the
   * capture phase on the preview root, before any component handler.
   */
  function handleLinkClickCapture(e: MouseEvent) {
    const origin = e.target as Element | null;
    const anchor = origin?.closest?.('a');
    if (!anchor) return;

    // Never let the browser follow the link (covers modifier-clicks / middle-clicks too).
    e.preventDefault();

    if (!isInteractiveMode) {
      // Design mode: the click only selects the node (handled by PreviewRenderer).
      return;
    }

    // Interactive mode: we own the navigation, so stop component-level handlers from
    // double-handling it.
    e.stopPropagation();
    contextMenu = null;
    if (e.type !== 'click') return;

    const link = classifyHref(anchor.getAttribute('href'));
    switch (link.kind) {
      case 'internal':
        if (!handleNavigate(link.path)) {
          showToast(`No page exists for route "${link.path}"`);
        } else if (link.fragment) {
          requestAnimationFrame(() => scrollToFragment(link.fragment));
        }
        break;
      case 'hash':
        scrollToFragment(link.fragment);
        break;
      case 'external':
        window.open(link.url, '_blank', 'noopener,noreferrer');
        break;
      case 'blocked':
        showToast(`Blocked unsafe link (${link.reason})`);
        break;
      case 'empty':
        break;
    }
  }

  /** Attachment: capture-phase link interception on the preview root. */
  function linkGuard(root: HTMLElement) {
    root.addEventListener('click', handleLinkClickCapture, { capture: true });
    root.addEventListener('auxclick', handleLinkClickCapture, { capture: true });
    return () => {
      root.removeEventListener('click', handleLinkClickCapture, { capture: true });
      root.removeEventListener('auxclick', handleLinkClickCapture, { capture: true });
    };
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

    if (message.type === 'SYNC_STATE') {
      const parsed = ProjectBlueprintSchema.safeParse(message.blueprint);
      if (!parsed.success) {
        console.warn('[preview] Ignoring SYNC_STATE with invalid blueprint', parsed.error.issues);
        return;
      }
      blueprint = parsed.data;
      activePageId = message.activePageId;
      activeBreakpoint = message.activeBreakpoint;
      selectedNodeId = message.selectedNodeId;
      isInteractiveMode = message.isInteractiveMode;
      if (isInteractiveMode) {
        contextMenu = null;
        showStructurePicker = false;
      }
    }
  }

  onMount(() => {
    function handleGlobalClick() {
      contextMenu = null;
    }

    window.addEventListener('message', handleParentMessage);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleGlobalClick);
    // Announce readiness eagerly; the parent also PINGs until it hears PREVIEW_READY.
    postToParent({ type: 'PREVIEW_READY' });
    return () => {
      window.removeEventListener('message', handleParentMessage);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleGlobalClick);
      if (toastTimer !== null) clearTimeout(toastTimer);
    };
  });

  function handleSelectNode(nodeId: string) {
    contextMenu = null;
    selectedNodeId = nodeId;
    postToParent({ type: 'SELECT_NODE', nodeId });
  }

  /** Navigates to an internal page. Returns false when no page matches `path`. */
  function handleNavigate(path: string): boolean {
    const targetPage = blueprint.pages.find((p) => p.path === path);
    if (!targetPage) return false;
    activePageId = targetPage.id;
    window.scrollTo({ top: 0 });
    postToParent({ type: 'NAVIGATE_PAGE', path });
    return true;
  }

  function handleNodeAction(nodeId: string, action: NodeQuickAction) {
    contextMenu = null;
    if (!NON_MUTATING_NODE_ACTIONS.has(action) && findNode(nodeId)?.locked) return;
    postToParent({ type: 'NODE_ACTION', nodeId, action });
  }

  function handleDropItem(
    payload: { componentType?: string; nodeId?: string },
    targetNodeId: string,
    position: 'before' | 'inside' | 'after'
  ) {
    postToParent({
      type: 'DROP_ITEM',
      componentType: payload.componentType,
      draggedNodeId: payload.nodeId,
      targetNodeId,
      position
    });
  }

  function handleContextMenuNode(node: BlueprintNode, x: number, y: number) {
    const safeX = Math.min(x, Math.max(20, window.innerWidth - 220));
    const safeY = Math.min(y, Math.max(20, window.innerHeight - 280));
    contextMenu = { node, x: safeX, y: safeY };
  }

  function handleInlinePropEdit(nodeId: string, propKey: string, value: string, final = false) {
    postToParent({ type: 'INLINE_PROP_EDIT', nodeId, propKey, value, final });
  }

  function handleResizeNodeStyle(nodeId: string, styles: Record<string, string>) {
    postToParent({ type: 'RESIZE_NODE_STYLE', nodeId, styles });
  }

  function handleTriggerInteraction(rule: InteractionRule, sourceNode: BlueprintNode) {
    const act = rule.actionType || rule.action?.type || 'navigate';
    const p = (rule.payload || rule.action?.payload || {}) as Record<string, string>;

    if (act === 'navigate') {
      const targetPath = p.path || p.targetPath || '/';
      handleNavigate(targetPath);
    } else if (act === 'openModal' || act === 'open_modal') {
      activeModal = {
        title: p.modalTitle || `${sourceNode.name} Dialog`,
        body:
          p.modalBody ||
          'This interactive MD3 modal was triggered by a declarative onClick rule.',
        ctaText: p.modalCta || 'Confirm'
      };
    } else if (act === 'toggleDrawer') {
      activeDrawer = activeDrawer
        ? null
        : {
            title: p.drawerTitle || `${sourceNode.name} Details Drawer`,
            body:
              p.drawerBody ||
              'Inspect contextual workspace details and quick actions in this slide-over sheet.'
          };
    } else if (act === 'showToast' || act === 'show_toast') {
      showToast(p.toastMessage || `Triggered action from ${sourceNode.name}`, 3500);
    } else if (act === 'setState' || act === 'toggle_state') {
      const k = p.stateKey || 'status';
      const v = p.stateValue || 'active';
      customAppState[k] = v;
      showToast(`State "${k}" updated to "${v}"`, 2800);
    } else if (act === 'submitForm' || act === 'submit_mock_form') {
      showToast(p.toastMessage || 'Form submitted successfully!', 3200);
    }
  }
</script>

<svelte:head>
  <title>{activePage?.title || 'Preview'}</title>
</svelte:head>

<div class="preview-root" {@attach linkGuard}>
  {#if activePage}
    {#if activeLayout}
      <PreviewRenderer
        node={activeLayout.rootNode}
        slotNode={activePage.rootNode}
        {activeBreakpoint}
        {selectedNodeId}
        {isInteractiveMode}
        onSelectNode={handleSelectNode}
        onNavigate={handleNavigate}
        onNodeAction={handleNodeAction}
        onDropItem={handleDropItem}
        onContextMenuNode={handleContextMenuNode}
        onInlinePropEdit={handleInlinePropEdit}
        onResizeNodeStyle={handleResizeNodeStyle}
        onTriggerInteraction={handleTriggerInteraction}
      />
    {:else}
      <PreviewRenderer
        node={activePage.rootNode}
        {activeBreakpoint}
        {selectedNodeId}
        {isInteractiveMode}
        onSelectNode={handleSelectNode}
        onNavigate={handleNavigate}
        onNodeAction={handleNodeAction}
        onDropItem={handleDropItem}
        onContextMenuNode={handleContextMenuNode}
        onInlinePropEdit={handleInlinePropEdit}
        onResizeNodeStyle={handleResizeNodeStyle}
        onTriggerInteraction={handleTriggerInteraction}
      />
    {/if}

    {#if !isInteractiveMode}
      <!-- Elementor Pro Signature On-Canvas "+ Add Section / Template / AI" Dropzone -->
      <section class="el-canvas-add-zone" aria-label="Add new section to page">
        {#if !showStructurePicker}
          <div class="el-canvas-add-buttons">
            <button
              type="button"
              onclick={() => (showStructurePicker = true)}
              class="el-circle-btn el-circle-btn--primary"
              title="Add New Section or Structure"
            >
              +
            </button>
            <button
              type="button"
              onclick={handleOpenTemplateModal}
              class="el-circle-btn el-circle-btn--secondary"
              title="Browse Pre-Built Section & Page Library"
            >
              📁
            </button>
            <button
              type="button"
              onclick={handleOpenAiComposer}
              class="el-circle-btn el-circle-btn--ai"
              title="Compose Sections with AI Prompt (Cmd+K)"
            >
              ✨
            </button>
          </div>
          <p class="el-canvas-add-hint">
            Drag a widget here, click <strong>+</strong> to pick a section structure, or click <strong>📁</strong> for pre-built templates
          </p>
        {:else}
          <div class="el-structure-picker">
            <div class="el-structure-header">
              <span>1. Select Flexbox / Grid Container Structure</span>
              <button
                type="button"
                onclick={() => (showStructurePicker = false)}
                class="el-structure-close"
              >
                ✕
              </button>
            </div>
            <div class="el-structure-grid" style="margin-bottom: 1.25rem;">
              {#each containerStructurePresets as st (st.id)}
                <button
                  type="button"
                  onclick={() => handleInsertStructure(st.id)}
                  class="el-structure-card"
                >
                  <div class="el-col-wireframe">
                    {#each st.cols as w, cIdx (cIdx)}
                      <span class="el-col-bar" style="width: {w};"></span>
                    {/each}
                  </div>
                  <span class="el-structure-label">{st.label}</span>
                </button>
              {/each}
            </div>

            <div class="el-structure-header" style="margin-bottom: 0.65rem;">
              <span>2. Or Insert a Pre-Built Ready Section</span>
            </div>
            <div class="el-structure-grid">
              {#each quickStructurePresets as preset (preset.type)}
                <button
                  type="button"
                  onclick={() => handleQuickInsertOnCanvas(preset.type)}
                  class="el-structure-card"
                >
                  <span class="el-structure-icon">{preset.icon}</span>
                  <span class="el-structure-label">{preset.label}</span>
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </section>
    {/if}
  {/if}

  {#if activeModal}
    <div style="position: fixed; inset: 0; z-index: 9500; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 1.5rem;">
      <div class="md-card md-card-elevated" role="dialog" aria-modal="true" aria-label={activeModal.title} style="max-width: 28rem; width: 100%; padding: 1.75rem;">
        <h3 class="md-headline-small" style="margin: 0 0 0.75rem 0;">{activeModal.title}</h3>
        <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.5rem 0;">{activeModal.body}</p>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="md-btn md-btn-outlined" onclick={() => (activeModal = null)}>Dismiss</button>
          <button type="button" class="md-btn md-btn-filled" onclick={() => (activeModal = null)}>{activeModal.ctaText}</button>
        </div>
      </div>
    </div>
  {/if}

  {#if activeDrawer}
    <div style="position: fixed; inset: 0; z-index: 9400; background: rgba(0,0,0,0.4); display: flex; justify-content: flex-end;">
      <aside class="md-card" aria-label={activeDrawer.title} style="width: min(24rem, 90vw); height: 100%; border-radius: 16px 0 0 16px; padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
            <h3 class="md-title-large" style="margin: 0;">{activeDrawer.title}</h3>
            <button type="button" class="md-btn md-btn-text" onclick={() => (activeDrawer = null)}>✕</button>
          </div>
          <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">{activeDrawer.body}</p>
        </div>
        <button type="button" class="md-btn md-btn-tonal" onclick={() => (activeDrawer = null)}>Close Drawer</button>
      </aside>
    </div>
  {/if}

  {#if activeToast}
    <div role="status" aria-live="polite" style="position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9600; background: #1D2024; color: #E2E2E6; padding: 0.875rem 1.25rem; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 0.75rem;">
      <span>{activeToast}</span>
      <button type="button" style="background: transparent; border: none; color: inherit; cursor: pointer; font-weight: 700;" onclick={() => (activeToast = null)}>✕</button>
    </div>
  {/if}

  {#if contextMenu && !isInteractiveMode}
    <div
      class="canvas-context-menu"
      style="top: {contextMenu.y}px; left: {contextMenu.x}px;"
      role="menu"
    >
      <div class="ctx-header">
        {#if contextNodeLocked}<span aria-label="Locked">🔒 </span>{/if}{contextMenu.node.name}
      </div>
      {#if !contextNodeLocked}
        <div class="ctx-align-row">
          <button type="button" role="menuitem" class="ctx-item ctx-item--align" onclick={() => handleNodeAction(contextMenu!.node.id, 'align-left')} title="Align Left">
            ⬅ Left
          </button>
          <button type="button" role="menuitem" class="ctx-item ctx-item--align ctx-item--align-center" onclick={() => handleNodeAction(contextMenu!.node.id, 'align-center')} title="Center Content / Element">
            ⬌ Center
          </button>
          <button type="button" role="menuitem" class="ctx-item ctx-item--align" onclick={() => handleNodeAction(contextMenu!.node.id, 'align-right')} title="Align Right">
            ➡ Right
          </button>
        </div>
        <div class="ctx-sep"></div>
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'up')}>
          <span>↑ Move Up</span><span class="ctx-kbd">Alt+↑</span>
        </button>
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'down')}>
          <span>↓ Move Down</span><span class="ctx-kbd">Alt+↓</span>
        </button>
        <div class="ctx-sep"></div>
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'wrap-section')}>
          <span>📦 Wrap in Section</span>
        </button>
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'wrap-container')}>
          <span>📦 Wrap in Container</span>
        </button>
        {#if contextMenu.node.children && contextMenu.node.children.length > 0}
          <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'unwrap')}>
            <span>📤 Unwrap Children</span>
          </button>
        {/if}
        <div class="ctx-sep"></div>
      {/if}
      <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'duplicate')}>
        <span>⧉ Duplicate</span><span class="ctx-kbd">⌘D</span>
      </button>
      <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'copy')}>
        <span>📋 Copy</span><span class="ctx-kbd">⌘C</span>
      </button>
      {#if !contextNodeLocked}
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'paste')}>
          <span>📌 Paste After</span><span class="ctx-kbd">⌘V</span>
        </button>
      {/if}
      <div class="ctx-sep"></div>
      <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'copy-style')}>
        <span>🎨 Copy Style</span><span class="ctx-kbd">⌘⇧C</span>
      </button>
      {#if !contextNodeLocked}
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'paste-style')}>
          <span>🖌️ Paste Style</span><span class="ctx-kbd">⌘⇧V</span>
        </button>
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'reset-style')}>
          <span>↺ Reset Style</span>
        </button>
      {/if}
      <div class="ctx-sep"></div>
      <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'save-symbol')}>
        <span>★ Save as Reusable Symbol</span>
      </button>
      {#if !contextNodeLocked}
        <div class="ctx-sep"></div>
        <button type="button" role="menuitem" class="ctx-item" onclick={() => handleNodeAction(contextMenu!.node.id, 'hide')}>
          <span>👁 Hide Element</span>
        </button>
        <button type="button" role="menuitem" class="ctx-item ctx-item--danger" onclick={() => handleNodeAction(contextMenu!.node.id, 'delete')}>
          <span>✕ Delete</span><span class="ctx-kbd">⌫</span>
        </button>
      {:else}
        <div class="ctx-locked-note">Element is locked — unlock it to edit.</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .preview-root {
    min-height: 100vh;
    background-color: var(--md-sys-color-surface, #FAF9FD);
    color: var(--md-sys-color-on-surface, #1B1B1F);
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
    user-select: none;
  }
  .canvas-context-menu {
    position: fixed;
    z-index: 9999;
    width: 224px;
    background-color: var(--md-sys-color-surface-container-lowest, #FFFFFF);
    color: var(--md-sys-color-on-surface, #1B1B1F);
    border: 1px solid var(--md-sys-color-outline-variant, #C4C6D0);
    border-radius: 16px;
    padding: 6px;
    box-shadow: 0 8px 28px rgba(11, 87, 208, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    font-family: var(--md-sys-font-body, Roboto, sans-serif);
  }
  .ctx-header {
    padding: 6px 10px;
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--md-sys-color-primary, #0B57D0);
    border-bottom: 1px solid var(--md-sys-color-outline-variant, #E0E2EC);
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ctx-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface, #1B1B1F);
    border-radius: 8px;
    text-align: left;
    transition: background-color 120ms ease;
  }
  .ctx-item:hover {
    background-color: var(--md-sys-color-secondary-container, #C2E7FF);
    color: var(--md-sys-color-on-secondary-container, #001D35);
  }
  .ctx-item--danger {
    color: var(--md-sys-color-error, #B3261E);
  }
  .ctx-item--danger:hover {
    background-color: var(--md-sys-color-error-container, #F9DEDC);
    color: var(--md-sys-color-on-error-container, #410E0B);
  }
  .ctx-align-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 2px 4px 4px 4px;
  }
  .ctx-item--align {
    justify-content: center;
    font-weight: 700;
  }
  .ctx-item--align-center {
    background: var(--md-sys-color-primary-container, #D3E3FD);
    color: var(--md-sys-color-on-primary-container, #041E49);
  }
  .ctx-locked-note {
    padding: 6px 10px;
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant, #444746);
  }
  .ctx-kbd {
    font-family: var(--md-sys-font-mono, monospace);
    font-size: 0.625rem;
    color: var(--md-sys-color-outline, #747775);
  }
  .ctx-sep {
    height: 1px;
    background-color: var(--md-sys-color-outline-variant, #E0E2EC);
    margin: 4px 0;
  }
  .el-canvas-add-zone {
    max-width: 960px;
    margin: 2.5rem auto 4rem auto;
    padding: 2.25rem 1.5rem;
    border: 2px dashed rgba(11, 87, 208, 0.32);
    border-radius: 24px;
    background: var(--md-sys-color-surface-container-low, #F8FAFD);
    text-align: center;
    transition: border-color 160ms ease, background-color 160ms ease;
  }
  .el-canvas-add-zone:hover {
    border-color: #0B57D0;
    background: #F0F4F9;
  }
  .el-canvas-add-buttons {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }
  .el-circle-btn {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    border: none;
    font-size: 1.35rem;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(11, 87, 208, 0.14);
    transition: transform 150ms cubic-bezier(0.2, 0, 0, 1), box-shadow 150ms cubic-bezier(0.2, 0, 0, 1);
  }
  .el-circle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(11, 87, 208, 0.22);
  }
  .el-circle-btn--primary {
    background: #0B57D0;
    color: #FFFFFF;
  }
  .el-circle-btn--secondary {
    background: #C2E7FF;
    color: #001D35;
  }
  .el-circle-btn--ai {
    background: #D3E3FD;
    color: #041E49;
  }
  .el-canvas-add-hint {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface-variant, #444746);
  }
  .el-structure-picker {
    max-width: 760px;
    margin: 0 auto;
  }
  .el-structure-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: #0B57D0;
  }
  .el-structure-close {
    background: transparent;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    padding: 2px 8px;
    cursor: pointer;
  }
  .el-structure-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
    gap: 0.625rem;
  }
  .el-structure-card {
    background: #FFFFFF;
    border: 1px solid rgba(11, 87, 208, 0.22);
    border-radius: 10px;
    padding: 0.75rem 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    transition: transform 130ms ease, border-color 130ms ease;
  }
  .el-structure-card:hover {
    border-color: #0B57D0;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(11, 87, 208, 0.12);
  }
  .el-structure-icon {
    font-size: 1.5rem;
  }
  .el-structure-label {
    font-size: 0.72rem;
    font-weight: 600;
    color: #1B1B1F;
  }
  .el-col-wireframe {
    width: 100%;
    height: 28px;
    display: flex;
    gap: 3px;
    padding: 2px;
  }
  .el-col-bar {
    height: 100%;
    background: rgba(11, 87, 208, 0.22);
    border: 1.5px solid #0B57D0;
    border-radius: 4px;
  }
</style>
