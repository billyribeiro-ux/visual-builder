<script lang="ts">
  import { getAllManifests } from '@app-viz/components';
  import type { ComponentManifest } from '@app-viz/schema';
  import { editor } from '../../state/editor.svelte.js';
  import IconButton from '../../ui/IconButton.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import { tooltip } from '../../ui/tooltip.js';
  import { resolveWidgetIcon } from '../../ui/widget-icons.js';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import BooksIcon from 'phosphor-svelte/lib/BooksIcon';
  import StarIcon from 'phosphor-svelte/lib/StarIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import BookmarkSimpleIcon from 'phosphor-svelte/lib/BookmarkSimpleIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';

  type Manifest = ComponentManifest & { icon?: string; keywords?: string[] };

  /** Display order + labels for registry categories; unknown categories are appended. */
  const CATEGORY_META: Record<string, { label: string; order: number }> = {
    structure: { label: 'Layout', order: 0 },
    basic: { label: 'Basic', order: 1 },
    ui: { label: 'General', order: 2 },
    media: { label: 'Media', order: 3 },
    forms: { label: 'Forms', order: 4 },
    navigation: { label: 'Navigation', order: 5 },
    site: { label: 'Site', order: 6 },
    hero: { label: 'Heroes', order: 7 },
    marketing: { label: 'Marketing', order: 8 },
    app: { label: 'App & Dashboard', order: 9 }
  };

  const STRUCTURES: { id: string; label: string; cols: number[] }[] = [
    { id: 'flex-1col', label: 'One column', cols: [1] },
    { id: 'flex-2col-50-50', label: 'Two columns 50 / 50', cols: [1, 1] },
    { id: 'flex-2col-33-67', label: 'Two columns 33 / 67', cols: [1, 2] },
    { id: 'flex-2col-67-33', label: 'Two columns 67 / 33', cols: [2, 1] },
    { id: 'flex-3col', label: 'Three columns', cols: [1, 1, 1] },
    { id: 'flex-4col', label: 'Four columns', cols: [1, 1, 1, 1] }
  ];

  let view = $state<'elements' | 'saved'>('elements');
  let query = $state('');
  let collapsed = $state<Record<string, boolean>>({});

  const manifests = $derived(getAllManifests() as Manifest[]);

  function matches(m: Manifest, q: string): boolean {
    if (!q) return true;
    const hay = [m.displayName, m.description, m.type, m.category, ...(m.keywords ?? [])].join(' ').toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every((term) => hay.includes(term));
  }

  const groups = $derived.by(() => {
    const q = query.trim();
    const byCat = new Map<string, Manifest[]>();
    for (const m of manifests) {
      if (!matches(m, q)) continue;
      const list = byCat.get(m.category) ?? [];
      list.push(m);
      byCat.set(m.category, list);
    }
    const out = [...byCat.entries()].map(([key, items]) => ({
      key,
      label: CATEGORY_META[key]?.label ?? key.charAt(0).toUpperCase() + key.slice(1),
      order: CATEGORY_META[key]?.order ?? 99,
      items: items.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }));
    out.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    const favs = manifests.filter((m) => editor.favoriteComponents.includes(m.type) && matches(m, q));
    if (favs.length > 0) out.unshift({ key: '__favorites', label: 'Favorites', order: -1, items: favs });
    return out;
  });

  const resultCount = $derived(groups.filter((g) => g.key !== '__favorites').reduce((n, g) => n + g.items.length, 0));

  function onDragStart(e: DragEvent, type: string) {
    if (!e.dataTransfer) return;
    e.dataTransfer.setData('application/x-app-viz-component', type);
    e.dataTransfer.effectAllowed = 'copy';
  }

  function insert(type: string) {
    const id = editor.insertComponent(type);
    if (!id) editor.notify('error', `Could not insert ${type}.`);
  }

  function toggleGroup(key: string) {
    collapsed = { ...collapsed, [key]: !collapsed[key] };
  }
</script>

<div class="sx-panel">
  <div class="sx-panel__header">
    <h2 class="sx-panel__title">Add elements</h2>
    <IconButton label="Template library" icon={BooksIcon} onclick={() => (editor.showBlockLibraryModal = true)} />
  </div>

  <div class="ep__controls">
    <div class="sx-search">
      <MagnifyingGlassIcon size={14} />
      <input
        class="sx-input"
        type="search"
        placeholder="Search elements"
        aria-label="Search elements"
        bind:value={query}
      />
    </div>
    <Segmented
      ariaLabel="Element source"
      block
      value={view}
      onchange={(v) => (view = v)}
      options={[
        { value: 'elements', label: 'Elements' },
        { value: 'saved', label: `Saved${editor.customSymbols.length ? ` · ${editor.customSymbols.length}` : ''}` }
      ]}
    />
  </div>

  <div class="sx-panel__body">
    {#if view === 'elements'}
      {#if !query.trim()}
        <div class="sx-section-label">Structure</div>
        <div class="ep__structures">
          {#each STRUCTURES as s (s.id)}
            <button
              type="button"
              class="ep__structure"
              aria-label="Insert {s.label}"
              {@attach tooltip(s.label)}
              onclick={() => editor.insertContainerStructure(s.id)}
            >
              <span class="ep__structure-cols">
                {#each s.cols as flex, i (i)}
                  <span style:flex-grow={flex}></span>
                {/each}
              </span>
            </button>
          {/each}
        </div>
      {/if}

      {#each groups as group (group.key)}
        {@const isCollapsed = collapsed[group.key] && !query.trim()}
        <section class="ep__group">
          <button type="button" class="ep__group-head" aria-expanded={!isCollapsed} onclick={() => toggleGroup(group.key)}>
            <span class={['ep__caret', !isCollapsed && 'ep__caret--open']}><CaretRightIcon size={10} weight="bold" /></span>
            <span>{group.label}</span>
            <span class="ep__count">{group.items.length}</span>
          </button>
          {#if !isCollapsed}
            <div class="ep__grid">
              {#each group.items as m (m.type)}
                {@const Icon = resolveWidgetIcon(m.icon, m.category)}
                {@const fav = editor.favoriteComponents.includes(m.type)}
                <div class="ep__tile-wrap">
                  <button
                    type="button"
                    class="ep__tile"
                    draggable="true"
                    aria-label="Insert {m.displayName}"
                    {@attach tooltip(m.description)}
                    ondragstart={(e) => onDragStart(e, m.type)}
                    onclick={() => insert(m.type)}
                  >
                    <span class="ep__tile-icon"><Icon size={20} weight="light" /></span>
                    <span class="ep__tile-name">{m.displayName}</span>
                  </button>
                  <button
                    type="button"
                    class={['ep__fav', fav && 'ep__fav--on']}
                    aria-label={fav ? `Remove ${m.displayName} from favorites` : `Add ${m.displayName} to favorites`}
                    aria-pressed={fav}
                    onclick={() => editor.toggleFavorite(m.type)}
                  >
                    <StarIcon size={11} weight={fav ? 'fill' : 'bold'} />
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </section>
      {:else}
        <div class="sx-empty">
          <span class="sx-empty__icon"><MagnifyingGlassIcon size={18} /></span>
          <span class="sx-empty__title">No elements match “{query}”</span>
          <span>Try a broader term, or browse the template library.</span>
          <button type="button" class="sx-btn sx-btn--sm" onclick={() => (query = '')}><XIcon size={12} />Clear search</button>
        </div>
      {/each}

      {#if query.trim() && resultCount > 0}
        <p class="ep__hint">{resultCount} {resultCount === 1 ? 'element' : 'elements'} — click to insert or drag onto the canvas.</p>
      {/if}
    {:else}
      <div class="ep__saved-head">
        <span class="sx-help">Reusable blocks saved from your selections. Stored in this browser.</span>
        <button
          type="button"
          class="sx-btn sx-btn--sm"
          disabled={!editor.selectedNode}
          {@attach tooltip(editor.selectedNode ? `Save “${editor.selectedNode.name}” as a reusable block` : 'Select an element on the canvas first')}
          onclick={() => editor.saveSelectedNodeAsSymbol()}
        >
          <PlusIcon size={12} />Save selection
        </button>
      </div>
      {#each editor.customSymbols as sym (sym.id)}
        {@const Icon = resolveWidgetIcon((getAllManifests() as Manifest[]).find((m) => m.type === sym.componentType)?.icon)}
        <div class="ep__saved-row">
          <button
            type="button"
            class="ep__saved-main"
            draggable="false"
            aria-label="Insert {sym.name}"
            onclick={() => editor.insertSymbol(sym.id)}
          >
            <span class="ep__saved-icon"><Icon size={16} /></span>
            <span class="ep__saved-text">
              <span class="ep__saved-name">{sym.name}</span>
              <span class="ep__saved-meta">{sym.componentType} · {new Date(sym.createdAt).toLocaleDateString()}</span>
            </span>
          </button>
          <IconButton label="Delete {sym.name}" icon={TrashIcon} size="sm" iconSize={14} tone="danger" onclick={() => editor.deleteSymbol(sym.id)} />
        </div>
      {:else}
        <div class="sx-empty">
          <span class="sx-empty__icon"><BookmarkSimpleIcon size={18} /></span>
          <span class="sx-empty__title">No saved blocks yet</span>
          <span>Select a section on the canvas and choose “Save selection” to reuse it on any page.</span>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .ep__controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--sx-border);
  }
  .ep__structures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 0 12px 6px;
  }
  .ep__structure {
    display: grid;
    place-items: center;
    height: 40px;
    padding: 0 8px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
    background: var(--sx-panel);
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      background-color var(--sx-dur) var(--sx-ease);
  }
  .ep__structure:hover {
    border-color: var(--sx-accent);
    background: var(--sx-accent-soft);
  }
  .ep__structure-cols {
    display: flex;
    gap: 3px;
    width: 100%;
    height: 18px;
  }
  .ep__structure-cols span {
    flex-basis: 0;
    border-radius: 2px;
    background: var(--sx-border-strong);
  }
  .ep__structure:hover .ep__structure-cols span {
    background: var(--sx-accent);
    opacity: 0.55;
  }
  .ep__group {
    padding-bottom: 4px;
  }
  .ep__group-head {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 32px;
    padding: 0 12px 0 8px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-2);
  }
  .ep__group-head:hover {
    color: var(--sx-text);
  }
  .ep__caret {
    display: grid;
    place-items: center;
    width: 14px;
    color: var(--sx-text-3);
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .ep__caret--open {
    transform: rotate(90deg);
  }
  .ep__count {
    margin-left: auto;
    font-weight: 500;
    color: var(--sx-text-3);
    letter-spacing: 0;
  }
  .ep__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 0 12px 8px;
  }
  .ep__tile-wrap {
    position: relative;
  }
  .ep__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 76px;
    padding: 8px 4px 6px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
    color: var(--sx-text);
    cursor: grab;
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease),
      transform var(--sx-dur) var(--sx-ease);
  }
  .ep__tile:hover {
    border-color: var(--sx-border-strong);
    box-shadow: var(--sx-shadow-md);
  }
  .ep__tile:active {
    cursor: grabbing;
    transform: scale(0.98);
  }
  .ep__tile-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    color: var(--sx-text-2);
  }
  .ep__tile:hover .ep__tile-icon {
    color: var(--sx-accent);
  }
  .ep__tile-name {
    display: -webkit-box;
    width: 100%;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.25;
    text-align: center;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .ep__fav {
    position: absolute;
    top: 4px;
    right: 4px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 4px;
    color: var(--sx-text-3);
    opacity: 0;
    transition: opacity var(--sx-dur) var(--sx-ease);
  }
  .ep__tile-wrap:hover .ep__fav,
  .ep__fav:focus-visible,
  .ep__fav--on {
    opacity: 1;
  }
  .ep__fav:hover {
    background: var(--sx-hover);
    color: var(--sx-text);
  }
  .ep__fav--on {
    color: #f79009;
  }
  .ep__hint {
    padding: 4px 14px 16px;
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
  .ep__saved-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px 14px;
  }
  .ep__saved-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0 8px 0 6px;
  }
  .ep__saved-main {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    padding: 6px 8px;
    border-radius: var(--sx-radius-sm);
    text-align: left;
  }
  .ep__saved-main:hover {
    background: var(--sx-hover);
  }
  .ep__saved-icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: var(--sx-radius-sm);
    background: var(--sx-hover);
    color: var(--sx-text-2);
    flex-shrink: 0;
  }
  .ep__saved-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ep__saved-name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ep__saved-meta {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    font-family: var(--sx-font-mono);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
