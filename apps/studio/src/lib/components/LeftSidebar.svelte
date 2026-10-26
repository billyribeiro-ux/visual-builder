<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { getAllManifests, getManifestsByCategory } from '@app-viz/components';
  import { MD3_THEME_PRESETS, type BlueprintNode, type PageRoute } from '@app-viz/schema';

  let searchQuery = $state('');
  let newPagePath = $state('/about');
  let newPageTitle = $state('About Us');
  let usePublicLayout = $state(true);
  let showAddPageModal = $state(false);

  const categories = [
    { key: 'all', label: 'All (25)' },
    { key: 'hero', label: 'Hero' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'navigation', label: 'Navigation' },
    { key: 'app', label: 'Web-App UI' },
    { key: 'structure', label: 'Structure' },
    { key: 'ui', label: 'Primitives' }
  ];
  let selectedCategory = $state('all');

  const filteredComponents = $derived.by(() => {
    let list = selectedCategory === 'all' ? getAllManifests() : getManifestsByCategory(selectedCategory);
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

  function canAcceptChildren(componentType: string): boolean {
    return (
      componentType === 'structure/container' ||
      componentType === 'structure/section' ||
      componentType === 'structure/grid' ||
      componentType === 'app/dashboard-shell'
    );
  }

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
      children: []
    };

    const selected = editor.selectedNode;
    const targetParentId =
      selected && canAcceptChildren(selected.componentType)
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
    if (!newPagePath.startsWith('/')) {
      newPagePath = '/' + newPagePath;
    }
    const slug = newPagePath.replace(/^\//, '').replace(/\//g, '-') || 'page';
    const defaultLayout = editor.blueprint.layouts.find((l) => l.isDefault) || editor.blueprint.layouts[0];

    const newPage: PageRoute = {
      id: crypto.randomUUID(),
      path: newPagePath,
      slug,
      title: newPageTitle,
      description: `${newPageTitle} page`,
      layoutId: usePublicLayout && defaultLayout ? defaultLayout.id : undefined,
      isDynamic: false,
      rootNode: {
        id: crypto.randomUUID(),
        componentType: 'structure/container',
        name: `${newPageTitle} Root Container`,
        props: { maxWidth: 'xl' },
        styles: { base: { minHeight: '60vh', paddingTop: '3rem', paddingBottom: '3rem' } },
        children: []
      }
    };

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
</script>

{#snippet layerTreeItem(node: BlueprintNode, depth: number, isRoot: boolean)}
  <div
    class="layer-item {editor.selectedNodeId === node.id ? 'layer-item--selected' : ''} {node.hidden ? 'layer-item--hidden' : ''}"
    style="padding-left: {0.625 + depth * 0.875}rem;"
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
          title={node.hidden ? 'Show Layer' : 'Hide Layer'}
          aria-label="Toggle layer visibility"
          onclick={(e) => {
            e.stopPropagation();
            editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { hidden: !node.hidden } });
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
          onclick={() => (showAddPageModal = true)}
          class="studio-btn studio-btn--primary sm-btn"
        >
          + Add Page
        </button>
      </div>

      {#if showAddPageModal}
        <div class="modal-card">
          <div class="modal-title">Create New Page Route</div>
          <div class="field-group">
            <label for="route-path-input" class="field-label">Route Path (e.g. /about)</label>
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
          <label class="checkbox-row">
            <input type="checkbox" bind:checked={usePublicLayout} />
            <span>Wrap in Shared Public Site Layout (Navbar + Footer)</span>
          </label>
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
              Create
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

  <!-- Tab Content: Layers (Recursive DOM Tree) -->
  {:else if editor.activeLeftTab === 'layers'}
    <div class="studio-panel-content flow-v">
      <div class="panel-header">
        <span class="panel-title">Page Tree: {editor.activePage?.path}</span>
        <button
          type="button"
          onclick={() => editor.selectNode(null)}
          class="studio-btn text-link"
        >
          Deselect
        </button>
      </div>

      {#if editor.activePage}
        <div class="list-stack">
          {@render layerTreeItem(editor.activePage.rootNode, 0, true)}
        </div>
      {/if}

      {#if editor.activeLayout}
        <div class="panel-header" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--md-sys-color-outline-variant);">
          <span class="panel-title">Shared Layout: {editor.activeLayout.name}</span>
        </div>
        <div class="list-stack">
          {@render layerTreeItem(editor.activeLayout.rootNode, 0, true)}
        </div>
      {/if}
    </div>

  <!-- Tab Content: Component & Pattern Library -->
  {:else if editor.activeLeftTab === 'library'}
    <div class="studio-panel-content library-container">
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
          <div class="lib-card">
            <div class="lib-card__header">
              <span class="lib-card__title">{item.displayName}</span>
              <span class="lib-card__category">{item.category}</span>
            </div>
            <p class="lib-card__desc">{item.description}</p>
            <button
              type="button"
              onclick={() => insertComponent(item.type)}
              class="studio-btn studio-btn--primary lib-card__btn"
            >
              + Insert Component
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
