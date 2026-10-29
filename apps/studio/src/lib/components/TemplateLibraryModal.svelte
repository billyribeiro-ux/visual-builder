<script lang="ts">
  import type { Component } from 'svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { googleFontsHref } from '@app-viz/engine';

  const thumbnailFontsHref = $derived(googleFontsHref(editor.blueprint.tokens.fonts));
  import { getAllManifests } from '@app-viz/components';
  import { PAGE_TEMPLATE_CATALOG, createPageFromTemplate, type BlueprintNode, type PageTemplateKey } from '@app-viz/schema';
  import Dialog from './ui/Dialog.svelte';
  import IconButton from '#lib/ui/IconButton.svelte';
  import BlockThumbnail from './dialogs/BlockThumbnail.svelte';
  import InlineConfirm from './dialogs/InlineConfirm.svelte';
  import NewPageDialog from './panels/NewPageDialog.svelte';
  import { componentLabel, neutralize, pageTemplateCopy } from './dialogs/copy.js';
  import { relativeTime } from './dialogs/format.js';
  import BooksIcon from 'phosphor-svelte/lib/BooksIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
  import LayoutIcon from 'phosphor-svelte/lib/LayoutIcon';
  import ListIcon from 'phosphor-svelte/lib/ListIcon';
  import MegaphoneIcon from 'phosphor-svelte/lib/MegaphoneIcon';
  import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import ColumnsIcon from 'phosphor-svelte/lib/ColumnsIcon';
  import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';
  import BookmarkSimpleIcon from 'phosphor-svelte/lib/BookmarkSimpleIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import TextboxIcon from 'phosphor-svelte/lib/TextboxIcon';
  import TextTIcon from 'phosphor-svelte/lib/TextTIcon';

  type IconC = Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;
  type Kind = 'section' | 'structure' | 'page' | 'saved';
  type CategoryKey =
    | 'all'
    | 'hero'
    | 'navigation'
    | 'site'
    | 'marketing'
    | 'app'
    | 'forms'
    | 'basic'
    | 'ui'
    | 'media'
    | 'structure'
    | 'pages'
    | 'saved';

  interface LibItem {
    key: string;
    kind: Kind;
    category: CategoryKey;
    title: string;
    description: string;
    badge: string;
    node?: BlueprintNode;
    componentType?: string;
    columns?: number[];
    savedId?: string;
    action: string;
    run: () => void;
  }

  const CATEGORY_META: Record<Exclude<CategoryKey, 'all' | 'pages' | 'saved'>, { label: string; icon: IconC }> = {
    hero: { label: 'Hero', icon: LayoutIcon },
    navigation: { label: 'Navigation', icon: ListIcon },
    site: { label: 'Site', icon: BrowserIcon },
    marketing: { label: 'Marketing', icon: MegaphoneIcon },
    app: { label: 'App UI', icon: ChartBarIcon },
    forms: { label: 'Forms', icon: TextboxIcon },
    basic: { label: 'Basic', icon: TextTIcon },
    ui: { label: 'General', icon: CursorClickIcon },
    media: { label: 'Media', icon: ImageIcon },
    structure: { label: 'Layout structures', icon: ColumnsIcon }
  };

  /** Column ratios drawn as schematic thumbnails (they are empty containers until you fill them). */
  const STRUCTURES: Array<{ id: string; title: string; columns: number[] }> = [
    { id: 'flex-1col', title: 'One column', columns: [1] },
    { id: 'flex-2col-50-50', title: 'Two columns · 50 / 50', columns: [1, 1] },
    { id: 'flex-2col-33-67', title: 'Two columns · 33 / 67', columns: [1, 2] },
    { id: 'flex-2col-67-33', title: 'Two columns · 67 / 33', columns: [2, 1] },
    { id: 'flex-3col', title: 'Three columns', columns: [1, 1, 1] },
    { id: 'flex-4col', title: 'Four columns', columns: [1, 1, 1, 1] }
  ];

  const open = $derived(editor.showBlockLibraryModal);
  let category = $state<CategoryKey>('all');
  let query = $state('');
  let confirmDeleteId = $state<string | null>(null);
  let newPageKit = $state<PageTemplateKey | null>(null);

  function close() {
    editor.showBlockLibraryModal = false;
    confirmDeleteId = null;
  }

  function insertSection(type: string) {
    if (editor.insertComponent(type)) close();
  }

  const sectionItems = $derived.by<LibItem[]>(() => {
    if (!open) return [];
    return getAllManifests()
      .filter((m) => m.category !== 'structure')
      .map((m) => ({
        key: `section:${m.type}`,
        kind: 'section' as const,
        category: m.category as CategoryKey,
        title: componentLabel(m.displayName),
        description: neutralize(m.description),
        badge: CATEGORY_META[m.category as keyof typeof CATEGORY_META]?.label ?? m.category,
        componentType: m.type,
        action: 'Insert',
        run: () => insertSection(m.type)
      }));
  });

  const structureItems = $derived<LibItem[]>(
    STRUCTURES.map((s) => ({
      key: `structure:${s.id}`,
      kind: 'structure',
      category: 'structure',
      title: s.title,
      description: 'Section with flex columns, ready for content.',
      badge: 'Layout',
      columns: s.columns,
      action: 'Insert',
      run: () => {
        editor.insertContainerStructure(s.id);
        close();
      }
    }))
  );

  /** Each kit instantiated once per open, purely for its preview (never inserted). */
  const pageItems = $derived.by<LibItem[]>(() => {
    if (!open) return [];
    return PAGE_TEMPLATE_CATALOG.map((t) => {
      const copy = pageTemplateCopy(t.key, t.label, t.description);
      return {
        key: `page:${t.key}`,
        kind: 'page' as const,
        category: 'pages' as const,
        title: copy.label,
        description: copy.description,
        badge: t.usesSharedLayout ? 'Shared layout' : 'App shell',
        node: createPageFromTemplate(t.key, '/preview', 'Preview').rootNode,
        action: 'Use kit',
        run: () => {
          close();
          newPageKit = t.key;
        }
      };
    });
  });

  const savedItems = $derived<LibItem[]>(
    editor.customSymbols.map((sym) => ({
      key: `saved:${sym.id}`,
      kind: 'saved',
      category: 'saved',
      title: sym.name,
      description: `Saved ${relativeTime(sym.createdAt)}`,
      badge: componentLabel(getAllManifests().find((m) => m.type === sym.componentType)?.displayName ?? sym.componentType),
      node: sym.node,
      savedId: sym.id,
      action: 'Insert',
      run: () => {
        editor.insertSymbol(sym.id);
        close();
      }
    }))
  );

  const allSections = $derived([...sectionItems, ...structureItems]);

  const nav = $derived([
    { heading: 'Sections', items: [
      { key: 'all' as CategoryKey, label: 'All sections', icon: SquaresFourIcon, count: allSections.length },
      ...(Object.keys(CATEGORY_META) as Array<keyof typeof CATEGORY_META>)
        .map((k) => ({ key: k as CategoryKey, label: CATEGORY_META[k].label, icon: CATEGORY_META[k].icon, count: allSections.filter((i) => i.category === k).length }))
        .filter((c) => c.count > 0)
    ] },
    { heading: 'Pages', items: [{ key: 'pages' as CategoryKey, label: 'Page kits', icon: BrowserIcon, count: pageItems.length }] },
    { heading: 'Your library', items: [{ key: 'saved' as CategoryKey, label: 'Saved templates', icon: BookmarkSimpleIcon, count: savedItems.length }] }
  ]);

  const groups = $derived.by<Array<{ title: string; items: LibItem[] }>>(() => {
    const q = query.trim().toLowerCase();
    const match = (i: LibItem) => !q || `${i.title} ${i.description} ${i.badge}`.toLowerCase().includes(q);
    if (q) {
      return [
        { title: 'Sections', items: allSections.filter(match) },
        { title: 'Page kits', items: pageItems.filter(match) },
        { title: 'Saved templates', items: savedItems.filter(match) }
      ].filter((g) => g.items.length > 0);
    }
    if (category === 'pages') return [{ title: 'Page kits', items: pageItems }];
    if (category === 'saved') return [{ title: 'Saved templates', items: savedItems }];
    if (category === 'all') return [{ title: 'All sections', items: allSections }];
    return [{ title: CATEGORY_META[category].label, items: allSections.filter((i) => i.category === category) }];
  });

  const total = $derived(groups.reduce((n, g) => n + g.items.length, 0));
  const heading = $derived(query.trim() ? `Results for “${query.trim()}”` : groups[0]?.title ?? 'Library');
</script>

<svelte:head>
  <!-- Live thumbnails render site components in the studio document: load the project's fonts. -->
  {#if editor.showBlockLibraryModal && thumbnailFontsHref}
    <link rel="stylesheet" href={thumbnailFontsHref} />
  {/if}
</svelte:head>

{#snippet structureThumb(columns: number[])}
  <span class="schema" aria-hidden="true">
    <span class="schema__section">
      {#each columns as c, i (i)}
        <span class="schema__col" style:flex-grow={c}></span>
      {/each}
    </span>
  </span>
{/snippet}

<Dialog
  {open}
  title="Library"
  subtitle="Insert sections, start pages from kits, or reuse your saved templates."
  size="full"
  height="min(820px, calc(100vh - 48px))"
  icon={BooksIcon}
  flush
  initialFocus="#library-search"
  onclose={close}
>
  <div class="lib">
    <nav class="lib__nav" aria-label="Library categories">
      <label class="sx-search lib__search">
        <MagnifyingGlassIcon size={14} />
        <input id="library-search" class="sx-input" type="search" placeholder="Search library" aria-label="Search library" bind:value={query} />
      </label>
      {#each nav as section (section.heading)}
        <div class="lib__heading">{section.heading}</div>
        {#each section.items as item (item.key)}
          {@const Icon = item.icon}
          {@const on = !query.trim() && category === item.key}
          <button
            type="button"
            class={['lib__cat', on && 'lib__cat--on']}
            aria-current={on ? 'true' : undefined}
            onclick={() => {
              category = item.key;
              query = '';
            }}
          >
            <Icon size={15} weight={on ? 'fill' : 'regular'} />
            <span class="lib__cat-label">{item.label}</span>
            <span class="lib__cat-count">{item.count}</span>
          </button>
        {/each}
      {/each}
    </nav>

    <div class="lib__main">
      <div class="lib__bar">
        <h3 class="lib__title">{heading}</h3>
        <span class="lib__count">{total} {total === 1 ? 'item' : 'items'}</span>
        <span class="lib__spacer"></span>
        {#if category === 'saved' && !query.trim() && editor.selectedNode}
          <button type="button" class="sx-btn sx-btn--sm" onclick={() => editor.saveSelectedNodeAsSymbol()}>
            <PlusIcon size={13} weight="bold" /> Save “{editor.selectedNode.name}”
          </button>
        {/if}
      </div>

      <div class="lib__scroll">
        {#if total === 0}
          {#if !query.trim() && category === 'saved'}
            <div class="sx-empty lib__empty">
              <span class="sx-empty__icon"><BookmarkSimpleIcon size={20} /></span>
              <span class="sx-empty__title">No saved templates yet</span>
              <span>Select a section on the canvas and save it here to reuse it on any page.</span>
              {#if editor.selectedNode}
                <button type="button" class="sx-btn sx-btn--primary" onclick={() => editor.saveSelectedNodeAsSymbol()}>Save “{editor.selectedNode.name}”</button>
              {/if}
            </div>
          {:else}
            <div class="sx-empty lib__empty">
              <span class="sx-empty__icon"><MagnifyingGlassIcon size={20} /></span>
              <span class="sx-empty__title">Nothing matches “{query}”</span>
              <span>Try a section type such as hero, pricing or form.</span>
            </div>
          {/if}
        {/if}

        {#each groups as group (group.title)}
          {#if query.trim()}<div class="lib__group">{group.title}</div>{/if}
          <ul class="grid">
            {#each group.items as item (item.key)}
              <li class="card">
                <button type="button" class="card__hit" aria-label="{item.action}: {item.title}" onclick={item.run}>
                  <span class="card__thumb">
                    {#if item.columns}
                      {@render structureThumb(item.columns)}
                    {:else}
                      <BlockThumbnail node={item.node} componentType={item.componentType} ratio={item.kind === 'page' ? 0.68 : 0.56} />
                    {/if}
                    <span class="card__cta"><span class="sx-btn sx-btn--primary sx-btn--sm">{item.action}</span></span>
                  </span>
                </button>
                <div class="card__body">
                  {#if confirmDeleteId === item.savedId && item.savedId}
                    <InlineConfirm
                      message="Delete template?"
                      compact
                      onconfirm={() => {
                        if (item.savedId) editor.deleteSymbol(item.savedId);
                        confirmDeleteId = null;
                      }}
                      oncancel={() => (confirmDeleteId = null)}
                    />
                  {:else}
                    <div class="card__text">
                      <span class="card__title">{item.title}</span>
                      <span class="card__desc">{item.description}</span>
                    </div>
                    {#if item.savedId}
                      <IconButton size="sm" tone="danger" label="Delete template" icon={TrashIcon} iconSize={14} onclick={() => (confirmDeleteId = item.savedId ?? null)} />
                    {:else}
                      <span class="sx-badge">{item.badge}</span>
                    {/if}
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        {/each}
      </div>
    </div>
  </div>
</Dialog>

{#if newPageKit}
  <NewPageDialog initialTemplate={newPageKit} onclose={() => (newPageKit = null)} />
{/if}

<style>
  .lib {
    display: grid;
    grid-template-columns: 232px minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }
  .lib__nav {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 10px;
    border-right: 1px solid var(--sx-border);
    background: var(--sx-subtle);
  }
  .lib__search {
    margin-bottom: 6px;
  }
  .lib__search .sx-input {
    background: var(--sx-panel);
  }
  .lib__heading {
    padding: 14px 8px 6px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
  }
  .lib__cat {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 30px;
    padding: 0 8px;
    color: var(--sx-text-2);
    border-radius: var(--sx-radius-sm);
    text-align: left;
  }
  .lib__cat:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .lib__cat--on,
  .lib__cat--on:hover {
    color: var(--sx-text);
    font-weight: 600;
    background: var(--sx-panel);
    box-shadow: var(--sx-shadow-sm), 0 0 0 1px var(--sx-border);
  }
  .lib__cat--on :global(svg) {
    color: var(--sx-accent);
  }
  .lib__cat-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lib__cat-count {
    font-size: var(--sx-text-xs);
    font-weight: 500;
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
  }
  .lib__main {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .lib__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    height: 52px;
    padding: 0 24px;
  }
  .lib__title {
    font-size: var(--sx-text-lg);
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .lib__count {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
  }
  .lib__spacer {
    flex: 1;
  }
  .lib__scroll {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 0 24px 24px;
  }
  .lib__group {
    padding: 8px 0 10px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
  }
  .lib__group:not(:first-child) {
    padding-top: 20px;
  }
  .lib__empty {
    padding-top: 80px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(256px, 1fr));
    gap: 16px;
  }
  .card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
    overflow: hidden;
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease);
  }
  .card:hover,
  .card:focus-within {
    border-color: var(--sx-border-strong);
    box-shadow: var(--sx-shadow-md);
  }
  .card__hit {
    display: block;
    width: 100%;
    text-align: left;
  }
  .card__hit:focus-visible {
    box-shadow: inset var(--sx-focus);
  }
  .card__thumb {
    position: relative;
    display: block;
    border-bottom: 1px solid var(--sx-border);
  }
  .card__cta {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--sx-panel) 30%, transparent);
    opacity: 0;
    transition: opacity var(--sx-dur) var(--sx-ease);
  }
  .card__hit:hover .card__cta,
  .card__hit:focus-visible .card__cta {
    opacity: 1;
  }
  .card__cta .sx-btn {
    box-shadow: var(--sx-shadow-md);
  }
  .card__body {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    padding: 8px 10px 8px 12px;
  }
  .card__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .card__title {
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .card__desc {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .schema {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 0.56;
    padding: 18% 10%;
    background: var(--sx-subtle);
  }
  .schema__section {
    display: flex;
    gap: 6px;
    width: 100%;
    height: 100%;
    padding: 8px;
    border: 1.5px dashed var(--sx-border-strong);
    border-radius: 6px;
  }
  .schema__col {
    flex-basis: 0;
    border-radius: 4px;
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    box-shadow: var(--sx-shadow-sm);
  }
</style>
