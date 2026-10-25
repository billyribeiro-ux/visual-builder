<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { getAllManifests, getManifestsByCategory } from '@app-viz/components';
  import type { BlueprintNode, PageRoute } from '@app-viz/schema';

  let searchQuery = $state('');
  let newPagePath = $state('/about');
  let newPageTitle = $state('About Us');
  let showAddPageModal = $state(false);

  const categories = [
    { key: 'all', label: 'All Patterns' },
    { key: 'hero', label: 'Hero Sections' },
    { key: 'marketing', label: 'Marketing & Sales' },
    { key: 'navigation', label: 'Navigation' },
    { key: 'app', label: 'Web-App UI' },
    { key: 'structure', label: 'Structure & Layout' },
    { key: 'ui', label: 'Base Primitives' }
  ];
  let selectedCategory = $state('all');

  const filteredComponents = $derived(() => {
    let list = selectedCategory === 'all' ? getAllManifests() : getManifestsByCategory(selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((m) => m.displayName.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
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
      children: []
    };

    editor.dispatch({
      type: 'INSERT_NODE',
      targetParentId: editor.activePage.rootNode.id,
      node: newNode
    });
    editor.selectNode(newNode.id);
  }

  function createNewPage() {
    if (!newPagePath.startsWith('/')) {
      newPagePath = '/' + newPagePath;
    }
    const slug = newPagePath.replace(/^\//, '').replace(/\//g, '-') || 'page';
    const newPage: PageRoute = {
      id: crypto.randomUUID(),
      path: newPagePath,
      slug,
      title: newPageTitle,
      description: `${newPageTitle} page`,
      isDynamic: false,
      rootNode: {
        id: crypto.randomUUID(),
        componentType: 'structure/container',
        name: `${newPageTitle} Root Container`,
        props: { maxWidth: 'xl' },
        styles: { base: { minHeight: '60vh', paddingTop: '4rem', paddingBottom: '4rem' } },
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
</script>

<aside class="w-80 border-r border-[var(--color-studio-border)] bg-[var(--color-studio-panel)] flex flex-col h-[calc(100vh-3.5rem)] select-none">
  <!-- Tabs Navigation Header -->
  <div class="flex border-b border-[var(--color-studio-border)] bg-slate-900/60">
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'pages')}
      class="flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors {editor.activeLeftTab === 'pages' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
    >
      Pages
    </button>
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'layers')}
      class="flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors {editor.activeLeftTab === 'layers' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
    >
      Layers
    </button>
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'library')}
      class="flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors {editor.activeLeftTab === 'library' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
    >
      Library
    </button>
    <button
      type="button"
      onclick={() => (editor.activeLeftTab = 'tokens')}
      class="flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors {editor.activeLeftTab === 'tokens' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
    >
      Tokens
    </button>
  </div>

  <!-- Tab Content: Pages -->
  {#if editor.activeLeftTab === 'pages'}
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="flex items-center justify-between">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Project Routes ({editor.blueprint.pages.length})</span>
        <button
          type="button"
          onclick={() => (showAddPageModal = true)}
          class="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
        >
          + Add Page
        </button>
      </div>

      {#if showAddPageModal}
        <div class="rounded border border-blue-500/40 bg-slate-800 p-3 space-y-2 text-xs">
          <div class="font-bold text-white">Create New Page Route</div>
          <div>
            <label for="route-path-input" class="text-slate-400 block mb-0.5">Route Path (e.g. /about)</label>
            <input
              id="route-path-input"
              type="text"
              bind:value={newPagePath}
              class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
            />
          </div>
          <div>
            <label for="page-title-input" class="text-slate-400 block mb-0.5">Page Title</label>
            <input
              id="page-title-input"
              type="text"
              bind:value={newPageTitle}
              class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white"
            />
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onclick={() => (showAddPageModal = false)}
              class="px-2 py-1 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={createNewPage}
              class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-semibold"
            >
              Create
            </button>
          </div>
        </div>
      {/if}

      <div class="space-y-1">
        {#each editor.blueprint.pages as page}
          <div
            class="flex items-center justify-between px-3 py-2.5 rounded border transition-colors cursor-pointer {editor.activePageId === page.id ? 'bg-blue-600/20 border-blue-500 text-white font-medium' : 'border-transparent text-slate-300 hover:bg-slate-800/60'}"
            onclick={() => editor.setActivePage(page.id)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && editor.setActivePage(page.id)}
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <span class="text-sm">📄</span>
              <div class="truncate">
                <div class="text-xs font-mono">{page.path}</div>
                <div class="text-[11px] text-slate-400 truncate">{page.title}</div>
              </div>
            </div>

            {#if editor.blueprint.pages.length > 1}
              <button
                type="button"
                onclick={(e) => {
                  e.stopPropagation();
                  editor.dispatch({ type: 'DELETE_PAGE', pageId: page.id });
                }}
                class="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 p-1"
                title="Delete Page"
              >
                ✕
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Tab Content: Layers (DOM Tree) -->
  {#if editor.activeLeftTab === 'layers'}
    <div class="flex-1 overflow-y-auto p-4 space-y-2">
      <div class="flex items-center justify-between pb-2 border-b border-slate-800">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Outline: {editor.activePage?.path}</span>
        <button
          type="button"
          onclick={() => editor.selectNode(null)}
          class="text-[11px] text-slate-400 hover:text-white"
        >
          Deselect
        </button>
      </div>

      {#if editor.activePage}
        <div class="space-y-1 text-xs">
          <!-- Root Container -->
          <div
            class="flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors {editor.selectedNodeId === editor.activePage.rootNode.id ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 text-slate-300'}"
            onclick={() => editor.selectNode(editor.activePage.rootNode.id)}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && editor.selectNode(editor.activePage.rootNode.id)}
          >
            <span class="font-mono text-[11px]">📦 {editor.activePage.rootNode.name}</span>
          </div>

          <!-- Children -->
          {#each editor.activePage.rootNode.children || [] as child, idx}
            <div
              class="flex items-center justify-between pl-6 pr-2 py-1.5 rounded cursor-pointer transition-colors {editor.selectedNodeId === child.id ? 'bg-blue-600 text-white font-medium shadow-sm' : 'hover:bg-slate-800 text-slate-300'}"
              onclick={() => editor.selectNode(child.id)}
              role="button"
              tabindex="0"
              onkeydown={(e) => e.key === 'Enter' && editor.selectNode(child.id)}
            >
              <div class="flex items-center gap-1.5 truncate">
                <span class="text-xs">❖</span>
                <span class="truncate">{child.name}</span>
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  title="Duplicate Section"
                  onclick={(e) => {
                    e.stopPropagation();
                    editor.dispatch({ type: 'DUPLICATE_NODE', nodeId: child.id });
                  }}
                  class="text-slate-400 hover:text-white p-1 text-[11px]"
                >
                  ⧉
                </button>
                <button
                  type="button"
                  title="Delete Section"
                  onclick={(e) => {
                    e.stopPropagation();
                    editor.dispatch({ type: 'DELETE_NODE', nodeId: child.id });
                  }}
                  class="text-slate-400 hover:text-red-400 p-1 text-[11px]"
                >
                  ✕
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Tab Content: Library (50+ Components Catalog) -->
  {#if editor.activeLeftTab === 'library'}
    <div class="flex-1 flex flex-col overflow-hidden p-4">
      <div class="space-y-2 mb-3">
        <input
          type="text"
          placeholder="Search components & sections..."
          bind:value={searchQuery}
          class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />

        <div class="flex gap-1 overflow-x-auto pb-1 text-[11px]">
          {#each categories as cat}
            <button
              type="button"
              onclick={() => (selectedCategory = cat.key)}
              class="whitespace-nowrap px-2 py-0.5 rounded transition-colors {selectedCategory === cat.key ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}"
            >
              {cat.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {#each filteredComponents() as comp}
          <div class="rounded border border-[var(--color-studio-border)] bg-slate-800/80 p-3 hover:border-blue-500/80 transition-all flex flex-col justify-between group">
            <div>
              <div class="flex items-center justify-between">
                <span class="font-bold text-xs text-white">{comp.displayName}</span>
                <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  {comp.category}
                </span>
              </div>
              <p class="mt-1 text-[11px] text-slate-400 leading-snug line-clamp-2">
                {comp.description}
              </p>
            </div>
            <button
              type="button"
              onclick={() => insertComponent(comp.type)}
              class="mt-3 w-full py-1 text-xs font-semibold rounded bg-slate-700 hover:bg-blue-600 text-slate-200 hover:text-white transition-colors"
            >
              + Insert Into Page
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Tab Content: Global Tokens -->
  {#if editor.activeLeftTab === 'tokens'}
    <div class="flex-1 overflow-y-auto p-4 space-y-5">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Color Palette</span>
        <div class="space-y-2 text-xs">
          {#each Object.entries(editor.blueprint.tokens.colors || {}) as [tokenName, tokenVal]}
            <div class="flex items-center justify-between">
              <span class="text-slate-300 font-mono text-[11px]">{tokenName}</span>
              <div class="flex items-center gap-2">
                <input
                  type="color"
                  value={tokenVal.startsWith('#') ? tokenVal : '#2563EB'}
                  onchange={(e) => {
                    const nextColors = { ...editor.blueprint.tokens.colors, [tokenName]: (e.target as HTMLInputElement).value };
                    editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { colors: nextColors } });
                  }}
                  class="h-6 w-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                />
                <span class="text-slate-400 font-mono text-[11px]">{tokenVal}</span>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="border-t border-slate-800 pt-4">
        <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">Font Families</span>
        <div class="space-y-3 text-xs">
          <div>
            <label for="font-heading-input" class="text-slate-400 block mb-1">Heading Font</label>
            <input
              id="font-heading-input"
              type="text"
              value={editor.blueprint.tokens.fonts?.heading}
              onchange={(e) => {
                const nextFonts = { ...editor.blueprint.tokens.fonts, heading: (e.target as HTMLInputElement).value };
                editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { fonts: nextFonts } });
              }}
              class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-[11px]"
            />
          </div>
          <div>
            <label for="font-body-input" class="text-slate-400 block mb-1">Body Font</label>
            <input
              id="font-body-input"
              type="text"
              value={editor.blueprint.tokens.fonts?.body}
              onchange={(e) => {
                const nextFonts = { ...editor.blueprint.tokens.fonts, body: (e.target as HTMLInputElement).value };
                editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { fonts: nextFonts } });
              }}
              class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono text-[11px]"
            />
          </div>
        </div>
      </div>
    </div>
  {/if}
</aside>
