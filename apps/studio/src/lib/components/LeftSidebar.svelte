<script lang="ts">
  import { editor, isContainerComponent } from '../state/editor.svelte.js';
  import { getAllManifests, getManifestsByCategory } from '@app-viz/components';
  import {
    MD3_THEME_PRESETS,
    PAGE_TEMPLATE_CATALOG,
    createPageFromTemplate,
    type PageTemplateKey,
    type BlueprintNode
  } from '@app-viz/schema';

  let searchQuery = $state('');
  let newPagePath = $state('/solutions');
  let newPageTitle = $state('Solutions');
  let selectedPageTemplate = $state<PageTemplateKey>('saas-landing');
  let usePublicLayout = $state(true);
  let showAddPageModal = $state(false);
  let dragOverLayerId = $state<string | null>(null);
  let dragOverPosition = $state<'before' | 'inside' | 'after'>('after');

  const categories = [
    { key: 'all', label: 'All (25)' },
    { key: 'favorites', label: '★ Favorites' },
    { key: 'hero', label: 'Hero' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'navigation', label: 'Navigation' },
    { key: 'app', label: 'Web-App UI' },
    { key: 'structure', label: 'Structure' },
    { key: 'ui', label: 'Primitives' }
  ];
  let selectedCategory = $state('all');

  const filteredComponents = $derived.by(() => {
    let list =
      selectedCategory === 'all'
        ? getAllManifests()
        : selectedCategory === 'favorites'
          ? getAllManifests().filter((m) => editor.favoriteComponents.includes(m.type))
          : getManifestsByCategory(selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q)
      );
    }
    return list;
  });

  function insertComponent(componentType: string) {
    if (!editor.activePage) return;
    const manifest = getAllManifests().find((m) => m.type === componentType);
    if (!manifest) return;

    const newNode: BlueprintNode = {
      id: crypto.randomUUID(),
      componentType: manifest.type,
      name: manifest.displayName,
      props: JSON.parse(JSON.stringify(manifest.defaultProps)),
      styles: { base: {} },
      interactions: [],
      children: [],
      locked: false,
      hidden: false,
      customClasses: ''
    };

    const selected = editor.selectedNode;
    const targetParentId =
      selected && isContainerComponent(selected.componentType)
        ? selected.id
        : editor.activePage.rootNode.id;

    editor.dispatch({
      type: 'INSERT_NODE',
      targetParentId,
      node: newNode
    });
    editor.selectNode(newNode.id);
  }

  function createNewPage() {
    const defaultLayout =
      editor.blueprint.layouts.find((l) => l.isDefault) || editor.blueprint.layouts[0];
    const tplMeta = PAGE_TEMPLATE_CATALOG.find((t) => t.key === selectedPageTemplate);
    const shouldAttachLayout =
      tplMeta && !tplMeta.usesSharedLayout
        ? undefined
        : usePublicLayout && defaultLayout
          ? defaultLayout.id
          : undefined;

    const newPage = createPageFromTemplate(
      selectedPageTemplate,
      newPagePath,
      newPageTitle,
      shouldAttachLayout
    );

    editor.dispatch({
      type: 'ADD_PAGE',
      page: newPage
    });
    editor.setActivePage(newPage.id);
    showAddPageModal = false;
  }

  function applyThemePreset(colors: Record<string, string>) {
    editor.dispatch({
      type: 'UPDATE_TOKENS',
      tokens: {
        colors: { ...colors }
      }
    });
  }

  function handleLibDragStart(e: DragEvent, componentType: string) {
    e.dataTransfer?.setData('application/x-app-viz-component', componentType);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
  }

  function handleLayerDragStart(e: DragEvent, nodeId: string) {
    e.stopPropagation();
    e.dataTransfer?.setData('application/x-app-viz-node-id', nodeId);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function handleLayerDragOver(e: DragEvent, node: BlueprintNode) {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const ratio = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
    dragOverLayerId = node.id;

    if (isContainerComponent(node.componentType) && ratio > 0.25 && ratio < 0.75) {
      dragOverPosition = 'inside';
    } else if (ratio < 0.5) {
      dragOverPosition = 'before';
    } else {
      dragOverPosition = 'after';
    }
  }

  function handleLayerDrop(e: DragEvent, targetNode: BlueprintNode) {
    e.preventDefault();
    e.stopPropagation();
    const pos = dragOverPosition;
    dragOverLayerId = null;

    const componentType = e.dataTransfer?.getData('application/x-app-viz-component');
    const draggedNodeId = e.dataTransfer?.getData('application/x-app-viz-node-id');

    if (componentType) {
      editor.dropComponentOnTarget(componentType, targetNode.id, pos);
    } else if (draggedNodeId && draggedNodeId !== targetNode.id) {
      editor.dropNodeOnTarget(draggedNodeId, targetNode.id, pos);
    }
  }
</script>

{#snippet layerTreeItem(node: BlueprintNode, depth: number, isRoot: boolean)}
  <div
    class="layer-item {editor.selectedNodeId === node.id ? 'layer-item--selected' : ''} {node.hidden ? 'layer-item--hidden' : ''} {dragOverLayerId === node.id ? `layer-item--drop-${dragOverPosition}` : ''}"
    style="padding-left: {0.625 + depth * 0.875}rem;"
    draggable={!isRoot && !node.locked && node.componentType !== 'structure/slot'}
    ondragstart={(e) => handleLayerDragStart(e, node.id)}
    ondragover={(e) => handleLayerDragOver(e, node)}
    ondragleave={() => {
      if (dragOverLayerId === node.id) dragOverLayerId = null;
    }}
    ondrop={(e) => handleLayerDrop(e, node)}
    onclick={() => editor.selectNode(node.id)}
    role="button"
    tabindex="0"
    onkeydown={(e) => e.key === 'Enter' && editor.selectNode(node.id)}
  >
    <div class="layer-info">
      <span class="layer-bullet">{node.children && node.children.length > 0 ? '▾' : '•'}</span>
      <span class="layer-name truncate">{node.name}</span>
      {#if isRoot}
        <span class="layer-badge">root</span>
      {:else if node.componentType === 'structure/slot'}
        <span class="layer-badge">slot</span>
      {/if}
    </div>
    {#if !isRoot && node.componentType !== 'structure/slot'}
      <div class="layer-actions">
        <button
          type="button"
          title="Move Up"
          aria-label="Move layer up"
          onclick={(e) => {
            e.stopPropagation();
            editor.dispatch({ type: 'REORDER_NODE', nodeId: node.id, direction: 'up' });
          }}
          class="action-icon"
        >↑</button>
        <button
          type="button"
          title="Move Down"
          aria-label="Move layer down"
          onclick={(e) => {
            e.stopPropagation();
            editor.dispatch({ type: 'REORDER_NODE', nodeId: node.id, direction: 'down' });
          }}
          class="action-icon"
        >↓</button>
        <button
          type="button"
          title="Wrap in Section"
          aria-label="Wrap layer in section"
          onclick={(e) => {
            e.stopPropagation();
            editor.wrapNode(node.id, 'structure/section');
          }}
          class="action-icon"
        >📦</button>
        <button
          type="button"
          title={node.hidden ? 'Show Layer' : 'Hide Layer'}
          aria-label="Toggle layer visibility"
          onclick={(e) => {
            e.stopPropagation();
            editor.dispatch({
              type: 'UPDATE_NODE_META',
              nodeId: node.id,
              meta: { hidden: !node.hidden }
            });
          }}
          class="action-icon"
        >{node.hidden ? '🙈' : '👁'}</button>
        <button
          type="button"
          title="Duplicate"
          aria-label="Duplicate layer"
          onclick={(e) => {
            e.stopPropagation();
            editor.dispatch({ type: 'DUPLICATE_NODE', nodeId: node.id });
          }}
          class="action-icon"
        >⧉</button>
        <button
          type="button"
          title="Delete"
          aria-label="Delete layer"
          onclick={(e) => {
            e.stopPropagation();
            editor.dispatch({ type: 'DELETE_NODE', nodeId: node.id });
            if (editor.selectedNodeId === node.id) editor.selectNode(null);
          }}
          class="action-icon action-icon--danger"
        >✕</button>
      </div>
    {/if}
  </div>
  {#each node.children || [] as child (child.id)}
    {@render layerTreeItem(child, depth + 1, false)}
  {/each}
{/snippet}

<aside class="studio-sidebar">
  <!-- Tabs Navigation Header -->
  <div class="studio-tabs">
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'pages')}
      class="studio-tab {editor.activeLeftTab === 'pages' ? 'studio-tab--active' : ''}"
    >
      Pages
    </button>
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'layers')}
      class="studio-tab {editor.activeLeftTab === 'layers' ? 'studio-tab--active' : ''}"
    >
      Layers
    </button>
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'library')}
      class="studio-tab {editor.activeLeftTab === 'library' ? 'studio-tab--active' : ''}"
    >
      Library
    </button>
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'tokens')}
      class="studio-tab {editor.activeLeftTab === 'tokens' ? 'studio-tab--active' : ''}"
    >
      Tokens
    </button>
  </div>

  <!-- Tab Content: Pages -->
  {#if editor.activeLeftTab === 'pages'}
    <div class="studio-panel-content flow-v">
      <div class="panel-header">
        <span class="panel-title">Project Routes ({editor.blueprint.pages.length})</span>
        <button
          type="button"
          onclick={() => (showAddPageModal = !showAddPageModal)}
          class="studio-btn studio-btn--primary sm-btn"
        >
          + Add Page
        </button>
      </div>

      {#if showAddPageModal}
        <div class="modal-card">
          <div class="modal-title">Create Page from Template</div>
          <div class="field-group">
            <label for="page-template-select" class="field-label">Whole-Page Template</label>
            <select
              id="page-template-select"
              bind:value={selectedPageTemplate}
              class="studio-select"
            >
              {#each PAGE_TEMPLATE_CATALOG as tpl (tpl.key)}
                <option value={tpl.key}>{tpl.label}</option>
              {/each}
            </select>
            <span class="tpl-hint">
              {PAGE_TEMPLATE_CATALOG.find((t) => t.key === selectedPageTemplate)?.description}
            </span>
          </div>
          <div class="field-group">
            <label for="route-path-input" class="field-label">Route Path (e.g. /solutions)</label>
            <input
              id="route-path-input"
              type="text"
              bind:value={newPagePath}
              class="studio-input"
            />
          </div>
          <div class="field-group">
            <label for="page-title-input" class="field-label">Page Title</label>
            <input
              id="page-title-input"
              type="text"
              bind:value={newPageTitle}
              class="studio-input"
            />
          </div>
          {#if selectedPageTemplate !== 'dashboard'}
            <label class="checkbox-row">
              <input type="checkbox" bind:checked={usePublicLayout} />
              <span>Wrap in Shared Public Layout (Navbar + Footer)</span>
            </label>
          {/if}
          <div class="modal-actions">
            <button
              type="button"
              onclick={() => (showAddPageModal = false)}
              class="studio-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={createNewPage}
              class="studio-btn studio-btn--primary sm-btn"
            >
              Create Page
            </button>
          </div>
        </div>
      {/if}

      <div class="list-stack">
        {#each editor.blueprint.pages as page (page.id)}
          <div
            class="route-item {editor.activePageId === page.id ? 'route-item--active' : ''}"
            onclick={() => editor.setActivePage(page.id)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && editor.setActivePage(page.id)}
          >
            <div class="route-item__info">
              <span class="route-icon">📄</span>
              <div class="route-text">
                <div class="route-path">{page.path}</div>
                <div class="route-title">
                  {page.title} {page.layoutId ? '• Shared Layout' : '• Standalone'}
                </div>
              </div>
            </div>

            {#if editor.blueprint.pages.length > 1}
              <button
                type="button"
                onclick={(e) => {
                  e.stopPropagation();
                  editor.dispatch({ type: 'DELETE_PAGE', pageId: page.id });
                }}
                class="del-btn"
                title="Delete Page"
              >
                ✕
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

  <!-- Tab Content: Layers (Recursive DOM Tree with Drag & Drop) -->
  {:else if editor.activeLeftTab === 'layers'}
    <div class="studio-panel-content flow-v">
      <div class="panel-header">
        <span class="panel-title">Page Tree: {editor.activePage?.path}</span>
        <button
          type="button"
          onclick={() => editor.selectNode(null)}
          class="studio-btn text-link"
        >
          Page Settings
        </button>
      </div>

      {#if editor.activePage}
        <div class="list-stack">
          {@render layerTreeItem(editor.activePage.rootNode, 0, true)}
        </div>
      {/if}

      {#if editor.activeLayout}
        <div
          class="panel-header"
          style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--md-sys-color-outline-variant);"
        >
          <span class="panel-title">Shared Layout: {editor.activeLayout.name}</span>
        </div>
        <div class="list-stack">
          {@render layerTreeItem(editor.activeLayout.rootNode, 0, true)}
        </div>
      {/if}
    </div>

  <!-- Tab Content: Component & Pattern Library + Reusable Symbols -->
  {:else if editor.activeLeftTab === 'library'}
    <div class="studio-panel-content library-container">
      <!-- Reusable Symbols Section -->
      <div class="symbols-box">
        <div class="panel-header">
          <span class="panel-title">Reusable Symbols ({editor.customSymbols.length})</span>
          {#if editor.selectedNode}
            <button
              type="button"
              onclick={() => editor.saveSelectedNodeAsSymbol()}
              class="studio-btn text-link"
              title="Save current selection as reusable symbol"
            >
              + Save Selected
            </button>
          {/if}
        </div>
        {#if editor.customSymbols.length > 0}
          <div class="symbol-list">
            {#each editor.customSymbols as sym (sym.id)}
              <div class="symbol-row">
                <span class="truncate" style="font-size: 0.75rem; font-weight: 600;">★ {sym.name}</span>
                <div style="display: flex; gap: 0.25rem;">
                  <button
                    type="button"
                    onclick={() => editor.insertSymbol(sym.id)}
                    class="studio-btn studio-btn--primary"
                    style="padding: 0.15rem 0.5rem; font-size: 0.6875rem;"
                  >
                    Insert
                  </button>
                  <button
                    type="button"
                    onclick={() => editor.deleteSymbol(sym.id)}
                    class="action-icon action-icon--danger"
                  >✕</button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <div class="library-search">
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search 25 MD3 components..."
          aria-label="Search components"
          class="studio-input"
        />
      </div>

      <div class="category-pills">
        {#each categories as cat (cat.key)}
          <button
            type="button"
            onclick={() => (selectedCategory = cat.key)}
            class="pill-btn {selectedCategory === cat.key ? 'pill-btn--active' : ''}"
          >
            {cat.label}
          </button>
        {/each}
      </div>

      <div class="cards-grid">
        {#each filteredComponents as item (item.type)}
          {@const isFav = editor.favoriteComponents.includes(item.type)}
          <div
            class="lib-card"
            draggable="true"
            ondragstart={(e) => handleLibDragStart(e, item.type)}
            role="listitem"
          >
            <div class="lib-card__header">
              <div style="display: flex; align-items: center; gap: 0.375rem;">
                <span class="drag-grip" title="Drag onto canvas">⋮⋮</span>
                <span class="lib-card__title">{item.displayName}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.25rem;">
                <button
                  type="button"
                  onclick={() => editor.toggleFavorite(item.type)}
                  aria-label="Toggle favorite"
                  class="fav-btn {isFav ? 'fav-btn--active' : ''}"
                >
                  {isFav ? '★' : '☆'}
                </button>
                <span class="lib-card__category">{item.category}</span>
              </div>
            </div>
            <p class="lib-card__desc">{item.description}</p>
            <button
              type="button"
              onclick={() => insertComponent(item.type)}
              class="studio-btn studio-btn--primary lib-card__btn"
            >
              + Insert or Drag to Canvas
            </button>
          </div>
        {/each}
      </div>
    </div>

  <!-- Tab Content: Design Tokens & Theme -->
  {:else if editor.activeLeftTab === 'tokens'}
    <div class="studio-panel-content flow-v">
      <span class="panel-title">MD3 Theme Presets</span>
      <div class="preset-grid">
        {#each Object.entries(MD3_THEME_PRESETS) as [key, preset] (key)}
          <button
            type="button"
            onclick={() => applyThemePreset(preset.colors)}
            class="preset-btn"
          >
            <span
              class="preset-dot"
              style="background-color: {preset.colors.primary}; border: 2px solid {preset.colors['primary-container']};"
            ></span>
            <span class="truncate">{preset.label}</span>
          </button>
        {/each}
      </div>

      <span class="panel-title" style="margin-top: 0.25rem;">Color Roles (MD3 System)</span>

      {#each [
        { key: 'primary', label: 'Primary (--md-sys-color-primary)' },
        { key: 'primary-container', label: 'Primary Container' },
        { key: 'secondary-container', label: 'Secondary Container' },
        { key: 'surface', label: 'Surface Background' },
        { key: 'on-surface', label: 'On Surface (Text)' },
        { key: 'outline-variant', label: 'Outline Variant (Borders)' }
      ] as role (role.key)}
        <div class="token-group">
          <label class="field-label" for="color-{role.key}">{role.label}</label>
          <div class="color-picker-row">
            <input
              id="color-{role.key}"
              type="color"
              value={editor.blueprint.tokens.colors?.[role.key] || '#0B57D0'}
              onchange={(e) =>
                editor.dispatch({
                  type: 'UPDATE_TOKENS',
                  tokens: {
                    colors: {
                      ...editor.blueprint.tokens.colors,
                      [role.key]: (e.target as HTMLInputElement).value
                    }
                  }
                })}
              class="color-swatch"
            />
            <span class="color-val">{editor.blueprint.tokens.colors?.[role.key] || ''}</span>
          </div>
        </div>
      {/each}

      <div class="token-group">
        <label class="field-label" for="font-heading">Heading Font Family</label>
        <input
          id="font-heading"
          type="text"
          value={editor.blueprint.tokens.fonts?.heading || 'Roboto, sans-serif'}
          onchange={(e) =>
            editor.dispatch({
              type: 'UPDATE_TOKENS',
              tokens: {
                fonts: {
                  ...editor.blueprint.tokens.fonts,
                  heading: (e.target as HTMLInputElement).value
                }
              }
            })}
          class="studio-input"
        />
      </div>

      <div class="token-group">
        <label class="field-label" for="font-body">Body Font Family</label>
        <input
          id="font-body"
          type="text"
          value={editor.blueprint.tokens.fonts?.body || 'Roboto, sans-serif'}
          onchange={(e) =>
            editor.dispatch({
              type: 'UPDATE_TOKENS',
              tokens: {
                fonts: {
                  ...editor.blueprint.tokens.fonts,
                  body: (e.target as HTMLInputElement).value
                }
              }
            })}
          class="studio-input"
        />
      </div>

      <div class="token-group">
        <label class="field-label" for="radius-md">MD3 Medium Corner Radius</label>
        <input
          id="radius-md"
          type="text"
          value={editor.blueprint.tokens.radii?.medium || '12px'}
          onchange={(e) =>
            editor.dispatch({
              type: 'UPDATE_TOKENS',
              tokens: {
                radii: {
                  ...editor.blueprint.tokens.radii,
                  medium: (e.target as HTMLInputElement).value,
                  md: (e.target as HTMLInputElement).value
                }
              }
            })}
          class="studio-input"
        />
      </div>
    </div>
  {/if}
</aside>

<style>
  .flow-v {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .panel-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--md-sys-color-on-surface-variant);
  }
  .sm-btn {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
  }
  .modal-card {
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-primary);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .modal-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .tpl-hint {
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.3;
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .field-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    padding-top: 0.25rem;
  }
  .list-stack {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .route-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    border: 1px solid transparent;
    cursor: pointer;
    background-color: transparent;
    transition: all var(--md-sys-motion-duration-short);
  }
  .route-item:hover {
    background-color: rgba(255, 255, 255, 0.04);
  }
  .route-item--active {
    background-color: rgba(168, 199, 250, 0.12);
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
  }
  .route-item__info {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
  }
  .route-icon {
    font-size: 0.875rem;
  }
  .route-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .route-path {
    font-size: 0.75rem;
    font-family: var(--md-sys-font-mono);
    color: var(--md-sys-color-on-surface);
  }
  .route-title {
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .del-btn {
    opacity: 0.5;
    padding: 0.25rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-outline);
    transition: all var(--md-sys-motion-duration-short);
  }
  .del-btn:hover {
    opacity: 1;
    color: var(--md-sys-color-error);
  }
  .text-link {
    font-size: 0.6875rem;
    color: var(--md-sys-color-primary);
  }
  .layer-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    cursor: pointer;
    background-color: transparent;
    transition: background-color var(--md-sys-motion-duration-short);
    color: var(--md-sys-color-on-surface);
  }
  .layer-item:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
  .layer-item--selected {
    background-color: var(--md-sys-color-primary-container) !important;
    color: var(--md-sys-color-on-primary-container) !important;
    font-weight: 600;
  }
  .layer-item--hidden {
    opacity: 0.45;
  }
  .layer-item--drop-before {
    border-top: 2px solid var(--md-sys-color-primary);
  }
  .layer-item--drop-after {
    border-bottom: 2px solid var(--md-sys-color-primary);
  }
  .layer-item--drop-inside {
    outline: 1px dashed var(--md-sys-color-success);
  }
  .layer-info {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
  }
  .layer-bullet {
    color: var(--md-sys-color-outline);
    font-size: 0.6875rem;
  }
  .layer-name {
    font-size: 0.75rem;
  }
  .layer-badge {
    font-size: 0.5625rem;
    font-family: var(--md-sys-font-mono);
    padding: 0.0625rem 0.3125rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface-variant);
  }
  .layer-actions {
    display: flex;
    align-items: center;
    gap: 0.125rem;
  }
  .action-icon {
    font-size: 0.6875rem;
    padding: 0.125rem 0.25rem;
    color: var(--md-sys-color-on-surface-variant);
    border-radius: 3px;
  }
  .action-icon:hover {
    color: var(--md-sys-color-on-surface);
    background-color: rgba(255, 255, 255, 0.1);
  }
  .action-icon--danger:hover {
    color: var(--md-sys-color-error);
  }
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .library-container {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .symbols-box {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .symbol-list {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .symbol-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.35rem 0.5rem;
    border-radius: 4px;
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .category-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3125rem;
  }
  .pill-btn {
    white-space: nowrap;
    padding: 0.25rem 0.5rem;
    font-size: 0.6875rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
    transition: all var(--md-sys-motion-duration-short);
  }
  .pill-btn:hover {
    color: var(--md-sys-color-on-surface);
  }
  .pill-btn--active {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-weight: 600;
  }
  .cards-grid {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
  .lib-card {
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-small, 8px);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    cursor: grab;
    transition: border-color var(--md-sys-motion-duration-short);
  }
  .lib-card:hover {
    border-color: var(--md-sys-color-primary);
  }
  .lib-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .drag-grip {
    color: var(--md-sys-color-outline);
    font-size: 0.75rem;
  }
  .fav-btn {
    font-size: 0.8125rem;
    color: var(--md-sys-color-outline);
    padding: 0 0.2rem;
  }
  .fav-btn--active {
    color: #FBBF24;
  }
  .lib-card__title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .lib-card__category {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    text-transform: uppercase;
    padding: 0.125rem 0.375rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-outline);
  }
  .lib-card__desc {
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.35;
    margin: 0;
  }
  .lib-card__btn {
    width: 100%;
    margin-top: 0.25rem;
    padding: 0.375rem;
    font-size: 0.75rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
  }
  .preset-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.375rem;
  }
  .preset-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.5rem;
    font-size: 0.6875rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-surface);
    text-align: left;
  }
  .preset-btn:hover {
    border-color: var(--md-sys-color-primary);
  }
  .preset-dot {
    width: 12px;
    height: 12px;
    border-radius: 9999px;
    flex-shrink: 0;
  }
  .token-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .color-picker-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .color-swatch {
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    cursor: pointer;
    background: none;
  }
  .color-val {
    font-family: var(--md-sys-font-mono);
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface);
  }
</style>
