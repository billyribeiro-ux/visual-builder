<script lang="ts">
  import { editor, isContainerComponent } from '../state/editor.svelte.js';
  import { getAllManifests } from '@app-viz/components';
  import {
    PAGE_TEMPLATE_CATALOG,
    createPageFromTemplate,
    type PageTemplateKey,
    type BlueprintNode
  } from '@app-viz/schema';

  let activeTab = $state<'blocks' | 'pages' | 'saved'>('blocks');
  let blockCategory = $state<'all' | 'hero' | 'marketing' | 'app'>('all');
  let search = $state('');

  const blockIcons: Record<string, string> = {
    'hero/split-hero': '🦸',
    'marketing/feature-grid': '✨',
    'marketing/pricing-table': '💎',
    'marketing/stats-bar': '📈',
    'marketing/testimonials': '💬',
    'marketing/faq-accordion': '❓',
    'marketing/cta-banner': '📣',
    'marketing/newsletter': '✉️',
    'marketing/contact-form': '📞',
    'marketing/footer': '🦶',
    'navigation/navbar': '🧭',
    'app/dashboard-shell': '🖥️',
    'app/kpi-grid': '📊',
    'app/data-table': '📋',
    'app/settings-form': '⚙️',
    'app/auth-card': '🔐'
  };

  const featuredBlocks = $derived.by(() => {
    const all = getAllManifests().filter(
      (m) => m.category === 'hero' || m.category === 'marketing' || m.category === 'app'
    );
    return all.filter((m) => {
      if (blockCategory !== 'all' && m.category !== blockCategory) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.displayName.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  });

  function insertBlock(componentType: string) {
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
    editor.showBlockLibraryModal = false;
  }

  function addPageFromKit(key: PageTemplateKey, label: string) {
    const defaultLayout =
      editor.blueprint.layouts.find((l) => l.isDefault) || editor.blueprint.layouts[0];
    const tplMeta = PAGE_TEMPLATE_CATALOG.find((t) => t.key === key);
    const slug = `${key}-${editor.blueprint.pages.length + 1}`;
    const newPage = createPageFromTemplate(
      key,
      `/${slug}`,
      label,
      tplMeta?.usesSharedLayout && defaultLayout ? defaultLayout.id : undefined
    );
    editor.dispatch({ type: 'ADD_PAGE', page: newPage });
    editor.setActivePage(newPage.id);
    editor.showBlockLibraryModal = false;
  }
</script>

{#if editor.showBlockLibraryModal}
  <div
    class="el-lib-backdrop"
    role="dialog"
    aria-modal="true"
    aria-label="Elementor Pro Block and Template Library"
  >
    <div class="el-lib-modal">
      <!-- Top Bar -->
      <div class="el-lib-header">
        <div class="el-lib-brand">
          <span class="el-lib-logo">📁</span>
          <span>Template &amp; Block Library</span>
        </div>

        <div class="el-lib-tabs">
          <button
            type="button"
            onclick={() => (activeTab = 'blocks')}
            class="el-lib-tab {activeTab === 'blocks' ? 'el-lib-tab--active' : ''}"
          >
            🧩 Section Blocks ({featuredBlocks.length})
          </button>
          <button
            type="button"
            onclick={() => (activeTab = 'pages')}
            class="el-lib-tab {activeTab === 'pages' ? 'el-lib-tab--active' : ''}"
          >
            📄 Full Page Kits ({PAGE_TEMPLATE_CATALOG.length})
          </button>
          <button
            type="button"
            onclick={() => (activeTab = 'saved')}
            class="el-lib-tab {activeTab === 'saved' ? 'el-lib-tab--active' : ''}"
          >
            ★ Saved Templates ({editor.customSymbols.length})
          </button>
        </div>

        <button
          type="button"
          onclick={() => (editor.showBlockLibraryModal = false)}
          class="el-lib-close"
          aria-label="Close Template Library"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      {#if activeTab === 'blocks'}
        <div class="el-lib-toolbar">
          <div class="el-lib-filters">
            {#each [
              { key: 'all', label: 'All Blocks' },
              { key: 'hero', label: 'Heroes' },
              { key: 'marketing', label: 'Marketing & Conversion' },
              { key: 'app', label: 'Dashboard & App UI' }
            ] as cat (cat.key)}
              <button
                type="button"
                onclick={() => (blockCategory = cat.key as 'all' | 'hero' | 'marketing' | 'app')}
                class="el-filter-pill {blockCategory === cat.key ? 'el-filter-pill--active' : ''}"
              >
                {cat.label}
              </button>
            {/each}
          </div>
          <input
            type="search"
            placeholder="Search pre-built blocks..."
            bind:value={search}
            class="studio-input el-lib-search"
          />
        </div>

        <div class="el-lib-grid">
          {#each featuredBlocks as block (block.type)}
            <div class="el-block-card">
              <div class="el-block-preview">
                <span class="el-block-icon">{blockIcons[block.type] || '🧩'}</span>
                <span class="el-block-cat">{block.category}</span>
              </div>
              <div class="el-block-body">
                <div class="el-block-title">{block.displayName}</div>
                <p class="el-block-desc">{block.description}</p>
                <button
                  type="button"
                  onclick={() => insertBlock(block.type)}
                  class="studio-btn studio-btn--primary el-insert-btn"
                >
                  + Insert into Page
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else if activeTab === 'pages'}
        <div class="el-lib-grid" style="padding-top: 1.25rem;">
          {#each PAGE_TEMPLATE_CATALOG as tpl (tpl.key)}
            <div class="el-block-card">
              <div class="el-block-preview el-block-preview--page">
                <span class="el-block-icon">📄</span>
                <span class="el-block-cat">{tpl.usesSharedLayout ? 'Public Layout' : 'App Shell'}</span>
              </div>
              <div class="el-block-body">
                <div class="el-block-title">{tpl.label}</div>
                <p class="el-block-desc">{tpl.description}</p>
                <button
                  type="button"
                  onclick={() => addPageFromKit(tpl.key, tpl.label)}
                  class="studio-btn studio-btn--primary el-insert-btn"
                >
                  + Create Page from Kit
                </button>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="el-lib-grid" style="padding-top: 1.25rem;">
          {#each editor.customSymbols as sym (sym.id)}
            <div class="el-block-card">
              <div class="el-block-preview">
                <span class="el-block-icon">★</span>
                <span class="el-block-cat">Saved</span>
              </div>
              <div class="el-block-body">
                <div class="el-block-title">{sym.name}</div>
                <p class="el-block-desc">Saved at {sym.createdAt} ({sym.componentType})</p>
                <button
                  type="button"
                  onclick={() => {
                    editor.insertSymbol(sym.id);
                    editor.showBlockLibraryModal = false;
                  }}
                  class="studio-btn studio-btn--primary el-insert-btn"
                >
                  + Insert Saved Block
                </button>
              </div>
            </div>
          {:else}
            <div class="el-empty-state">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">★</div>
              <div style="font-weight: 700; margin-bottom: 0.25rem;">No Saved Templates Yet</div>
              <p style="color: var(--md-sys-color-on-surface-variant); font-size: 0.8125rem; margin-bottom: 0.875rem;">
                Select any section on the canvas and click "Save as Reusable Symbol" to save it here.
              </p>
              {#if editor.selectedNode}
                <button
                  type="button"
                  onclick={() => editor.saveSelectedNodeAsSymbol()}
                  class="studio-btn studio-btn--primary"
                >
                  ★ Save "{editor.selectedNode.name}" Now
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .el-lib-backdrop {
    position: fixed;
    inset: 0;
    z-index: 130;
    background: rgba(10, 12, 16, 0.72);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .el-lib-modal {
    width: min(64rem, 95vw);
    max-height: 86vh;
    background: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-large, 28px);
    box-shadow: var(--md-sys-elevation-level4);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .el-lib-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.25rem;
    background: var(--md-sys-color-surface-container-low);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .el-lib-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .el-lib-logo {
    font-size: 1.125rem;
  }
  .el-lib-tabs {
    display: flex;
    gap: 0.375rem;
  }
  .el-lib-tab {
    padding: 0.45rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.8125rem;
    font-weight: 600;
    cursor: pointer;
  }
  .el-lib-tab--active {
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    border-color: var(--md-sys-color-primary);
  }
  .el-lib-close {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background: transparent;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
    font-size: 0.875rem;
  }
  .el-lib-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.875rem 1.25rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .el-lib-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }
  .el-filter-pill {
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
  }
  .el-filter-pill--active {
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    border-color: var(--md-sys-color-primary);
  }
  .el-lib-search {
    max-width: 16rem;
  }
  .el-lib-grid {
    padding: 1.25rem;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1rem;
  }
  .el-block-card {
    background: var(--md-sys-color-surface-container-low);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: transform 150ms ease, border-color 150ms ease;
  }
  .el-block-card:hover {
    border-color: var(--md-sys-color-primary);
    transform: translateY(-2px);
  }
  .el-block-preview {
    height: 92px;
    background: linear-gradient(135deg, rgba(11, 87, 208, 0.16), rgba(103, 80, 164, 0.14));
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }
  .el-block-preview--page {
    background: linear-gradient(135deg, rgba(20, 108, 46, 0.18), rgba(11, 87, 208, 0.18));
  }
  .el-block-icon {
    font-size: 2.25rem;
  }
  .el-block-cat {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-primary);
  }
  .el-block-body {
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.375rem;
  }
  .el-block-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .el-block-desc {
    margin: 0;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.4;
    flex: 1;
  }
  .el-insert-btn {
    margin-top: 0.5rem;
    width: 100%;
    padding: 0.45rem;
    font-size: 0.75rem;
  }
  .el-empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 1rem;
  }
</style>
