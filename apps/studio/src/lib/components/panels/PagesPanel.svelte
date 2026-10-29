<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { editor } from '#lib/state/editor.svelte.js';
  import { pageDisplayName } from '#lib/state/page-name.js';
  import { cloneSubtreeWithNewIds } from '@app-viz/engine';
  import { createId, type PageRoute } from '@app-viz/schema';
  import IconButton from '#lib/ui/IconButton.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import InlineConfirm from '../dialogs/InlineConfirm.svelte';
  import NewPageDialog from './NewPageDialog.svelte';
  import PageSettingsPopover from './PageSettingsPopover.svelte';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';

  interface TreeItem {
    key: string;
    segment: string;
    page?: PageRoute;
    children: TreeItem[];
  }

  let query = $state('');
  let showNewPage = $state(false);
  let confirmDeleteId = $state<string | null>(null);
  let settings = $state<{ pageId: string; anchor: HTMLElement } | null>(null);
  const collapsed = new SvelteSet<string>();

  const pages = $derived(editor.blueprint.pages);
  const layoutNames = $derived(Object.fromEntries(editor.blueprint.layouts.map((l) => [l.id, l.name])) as Record<string, string>);
  const canDelete = $derived(pages.length > 1);
  const settingsPage = $derived(settings ? pages.find((p) => p.id === settings?.pageId) : undefined);
  const settingsAnchor = $derived(settings?.anchor ?? null);

  /** Path hierarchy: "/docs/api" nests under "/docs" (a page or a virtual folder). Home first. */
  const tree = $derived.by<TreeItem[]>(() => {
    const roots: TreeItem[] = [];
    const byKey: Record<string, TreeItem> = {};
    for (const page of pages) {
      const segments = page.path.split('/').filter(Boolean);
      if (segments.length === 0) {
        roots.unshift({ key: page.id, segment: '/', page, children: [] });
        continue;
      }
      let level = roots;
      let key = '';
      segments.forEach((segment, i) => {
        key += `/${segment}`;
        const last = i === segments.length - 1;
        let item: TreeItem | undefined = byKey[key];
        if (!item) {
          item = { key: `path:${key}`, segment, children: [] };
          byKey[key] = item;
          level.push(item);
        }
        if (last) {
          if (item.page) {
            // Two pages normalised to the same path (should not happen; reducer dedupes) — list both.
            const twin: TreeItem = { key: page.id, segment, page, children: [] };
            level.push(twin);
          } else {
            item.page = page;
            item.key = page.id;
          }
        }
        level = item.children;
      });
    }
    return roots;
  });

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return pages.filter((p) => pageDisplayName(p).toLowerCase().includes(q) || p.path.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
  });

  function open(page: PageRoute) {
    editor.setActivePage(page.id);
  }

  function duplicate(page: PageRoute) {
    const snap = $state.snapshot(page) as PageRoute;
    const short = pageDisplayName(snap);
    const sep = /\s[—|·-]\s/.exec(snap.title);
    const title = `${short} copy${sep ? snap.title.slice(sep.index) : ''}`;
    const base = snap.path === '/' ? '/home' : snap.path;
    const root = cloneSubtreeWithNewIds(snap.rootNode);
    const copy: PageRoute = {
      ...structuredClone(snap),
      id: createId(),
      path: `${base}-copy`,
      slug: '',
      title,
      seo: { ...snap.seo, title: snap.seo?.title ? `${snap.seo.title} (copy)` : undefined },
      rootNode: { ...root, name: snap.rootNode.name }
    };
    if (editor.dispatch({ type: 'ADD_PAGE', page: copy })) {
      editor.setActivePage(copy.id);
      editor.notify('success', `Duplicated “${short}”.`);
    }
  }

  function remove(page: PageRoute) {
    const name = pageDisplayName(page);
    confirmDeleteId = null;
    if (editor.dispatch({ type: 'DELETE_PAGE', pageId: page.id })) editor.notify('info', `Deleted “${name}”. Press ⌘Z to undo.`);
  }

  /** ↑/↓ move between page rows like a native tree. */
  function onListKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const root = event.currentTarget as HTMLElement;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-row]'));
    const idx = rows.indexOf(document.activeElement as HTMLElement);
    if (idx === -1) return;
    event.preventDefault();
    rows[event.key === 'ArrowDown' ? Math.min(rows.length - 1, idx + 1) : Math.max(0, idx - 1)]?.focus();
  }
</script>

{#snippet pageRow(page: PageRoute, depth: number, hasChildren: boolean, itemKey: string)}
  {@const active = editor.activePageId === page.id}
  {@const isHome = page.path === '/'}
  {@const Icon = isHome ? HouseSimpleIcon : FileIcon}
  {@const standalone = !page.layoutId}
  <li class={['row', active && 'row--active', settings?.pageId === page.id && 'row--focus']} style:--depth={depth}>
    {#if confirmDeleteId === page.id}
      <div class="row__confirm">
        <InlineConfirm message="Delete “{pageDisplayName(page)}”?" onconfirm={() => remove(page)} oncancel={() => (confirmDeleteId = null)} />
      </div>
    {:else}
      {#if hasChildren}
        <button
          type="button"
          class="row__caret"
          aria-label={collapsed.has(itemKey) ? 'Expand' : 'Collapse'}
          aria-expanded={!collapsed.has(itemKey)}
          onclick={() => (collapsed.has(itemKey) ? collapsed.delete(itemKey) : collapsed.add(itemKey))}
        >
          <span class={['caret', !collapsed.has(itemKey) && 'caret--open']}><CaretRightIcon size={10} weight="bold" /></span>
        </button>
      {:else}
        <span class="row__caret" aria-hidden="true"></span>
      {/if}
      <button
        type="button"
        class="row__main"
        data-row
        aria-current={active ? 'page' : undefined}
        onclick={() => open(page)}
        ondblclick={(e) => {
          const btn = e.currentTarget as HTMLElement;
          settings = { pageId: page.id, anchor: btn.closest<HTMLElement>('li') ?? btn };
        }}
      >
        <span class="row__icon"><Icon size={15} weight={active ? 'fill' : 'regular'} /></span>
        <span class="row__text">
          <span class="row__name">{pageDisplayName(page)}</span>
          <span class="row__meta">
            <span class="row__path">{page.path}</span>
            {#if standalone}
              <span class="row__tag" {@attach tooltip('Renders without the shared layout')}>Standalone</span>
            {:else if editor.blueprint.layouts.length > 1}
              <span class="row__layout">· {layoutNames[page.layoutId ?? ''] ?? 'Layout'}</span>
            {/if}
          </span>
        </span>
      </button>
      <div class="row__actions">
        <IconButton
          size="sm"
          label="Page settings"
          icon={GearSixIcon}
          iconSize={14}
          onclick={(e: MouseEvent) => {
            e.stopPropagation();
            const btn = e.currentTarget as HTMLElement;
            const anchor = btn.closest<HTMLElement>('li') ?? btn;
            settings = settings?.pageId === page.id ? null : { pageId: page.id, anchor };
          }}
        />
        <IconButton size="sm" label="Duplicate page" icon={CopyIcon} iconSize={14} onclick={() => duplicate(page)} />
        <IconButton
          size="sm"
          tone="danger"
          label={canDelete ? 'Delete page' : 'A project needs at least one page'}
          icon={TrashIcon}
          iconSize={14}
          disabled={!canDelete}
          onclick={() => (confirmDeleteId = page.id)}
        />
      </div>
    {/if}
  </li>
{/snippet}

{#snippet treeItem(item: TreeItem, depth: number)}
  {#if item.page}
    {@render pageRow(item.page, depth, item.children.length > 0, item.key)}
  {:else}
    <li class="row row--folder" style:--depth={depth}>
      <button
        type="button"
        class="row__caret"
        aria-label={collapsed.has(item.key) ? `Expand ${item.segment}` : `Collapse ${item.segment}`}
        aria-expanded={!collapsed.has(item.key)}
        onclick={() => (collapsed.has(item.key) ? collapsed.delete(item.key) : collapsed.add(item.key))}
      >
        <span class={['caret', !collapsed.has(item.key) && 'caret--open']}><CaretRightIcon size={10} weight="bold" /></span>
      </button>
      <span class="row__main row__main--static">
        <span class="row__icon"><FolderSimpleIcon size={15} /></span>
        <span class="row__text">
          <span class="row__name">{item.segment}</span>
          <span class="row__meta"><span class="row__path">Folder · no page at this path</span></span>
        </span>
      </span>
    </li>
  {/if}
  {#if item.children.length > 0 && !collapsed.has(item.key)}
    {#each item.children as child (child.key)}
      {@render treeItem(child, depth + 1)}
    {/each}
  {/if}
{/snippet}

<div class="sx-panel pages">
  <div class="sx-panel__header">
    <h2 class="sx-panel__title">Pages</h2>
    <span class="sx-badge" aria-label="{pages.length} pages">{pages.length}</span>
    <IconButton label="New page" icon={PlusIcon} onclick={() => (showNewPage = true)} />
  </div>

  {#if pages.length > 6}
    <div class="pages__search">
      <label class="sx-search">
        <MagnifyingGlassIcon size={14} />
        <input class="sx-input" type="search" placeholder="Filter pages" aria-label="Filter pages" bind:value={query} />
      </label>
    </div>
  {/if}

  <div class="sx-panel__body">
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <ul class="list" aria-label="Pages" onkeydown={onListKeydown}>
      {#if filtered}
        {#each filtered as page (page.id)}
          {@render pageRow(page, 0, false, page.id)}
        {:else}
          <li class="sx-empty">
            <span class="sx-empty__title">No matching pages</span>
            <span>Try a path such as <code class="mono">/pricing</code>.</span>
          </li>
        {/each}
      {:else}
        {#each tree as item (item.key)}
          {@render treeItem(item, 0)}
        {/each}
      {/if}
    </ul>

    <button type="button" class="new-row" onclick={() => (showNewPage = true)}>
      <span class="new-row__icon"><PlusIcon size={13} weight="bold" /></span>
      New page
    </button>

    {#if editor.blueprint.layouts.length > 0}
      <div class="sx-section-label">Shared layouts</div>
      <ul class="layouts">
        {#each editor.blueprint.layouts as layout (layout.id)}
          {@const used = pages.filter((p) => p.layoutId === layout.id).length}
          <li class="layout">
            <span class="row__icon"><BrowserIcon size={15} /></span>
            <span class="row__text">
              <span class="row__name">{layout.name}</span>
              <span class="layout__meta">{layout.isDefault ? 'Default · ' : ''}Used by {used} {used === 1 ? 'page' : 'pages'}</span>
            </span>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>

{#if settingsPage && settingsAnchor}
  <PageSettingsPopover page={settingsPage} anchor={settingsAnchor} onclose={() => (settings = null)} />
{/if}

{#if showNewPage}
  <NewPageDialog onclose={() => (showNewPage = false)} />
{/if}

<style>
  .pages {
    height: 100%;
  }
  .pages__search {
    padding: 10px 12px 2px;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 8px 6px 4px;
  }
  .row {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 44px;
    padding-left: calc(var(--depth) * 16px);
    border-radius: var(--sx-radius-sm);
    transition: background-color var(--sx-dur) var(--sx-ease);
  }
  .row:hover,
  .row--focus {
    background: var(--sx-hover);
  }
  .row--active,
  .row--active:hover {
    background: var(--sx-accent-soft);
  }
  .row__caret {
    display: grid;
    place-items: center;
    width: 18px;
    height: 28px;
    flex-shrink: 0;
    color: var(--sx-text-3);
    border-radius: var(--sx-radius-xs);
  }
  button.row__caret:hover {
    color: var(--sx-text);
  }
  .caret {
    display: grid;
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .caret--open {
    transform: rotate(90deg);
  }
  .row__main {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0;
    align-self: stretch;
    padding: 0 6px 0 0;
    text-align: left;
    border-radius: var(--sx-radius-sm);
  }
  .row__main:focus-visible {
    box-shadow: var(--sx-focus);
  }
  .row__icon {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    color: var(--sx-text-2);
    border-radius: var(--sx-radius-sm);
  }
  .row--active .row__icon {
    color: var(--sx-accent);
  }
  .row__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
  }
  .row__name {
    font-size: var(--sx-text-md);
    font-weight: 500;
    color: var(--sx-text);
    line-height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row--active .row__name {
    font-weight: 600;
    color: var(--sx-accent-text);
  }
  .row__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    line-height: 14px;
  }
  .row__path {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row--folder .row__path {
    font-family: var(--sx-font);
  }
  .row__layout {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .row__tag {
    flex-shrink: 0;
    padding: 0 5px;
    font-size: 10px;
    font-weight: 600;
    line-height: 15px;
    color: var(--sx-violet);
    background: var(--sx-violet-soft);
    border-radius: 3px;
  }
  .row__actions {
    display: none;
    align-items: center;
    gap: 0;
    padding-right: 4px;
  }
  .row:hover .row__actions,
  .row:focus-within .row__actions,
  .row--focus .row__actions {
    display: flex;
  }
  .row__confirm {
    flex: 1;
    min-width: 0;
    padding: 0 6px 0 10px;
  }
  .new-row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: calc(100% - 12px);
    height: 36px;
    margin: 2px 6px 0;
    padding: 0 8px 0 24px;
    font-size: var(--sx-text-md);
    font-weight: 500;
    color: var(--sx-text-2);
    border-radius: var(--sx-radius-sm);
  }
  .new-row:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .new-row__icon {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border: 1px dashed var(--sx-border-strong);
    border-radius: var(--sx-radius-sm);
  }
  .layouts {
    display: flex;
    flex-direction: column;
    padding: 0 6px 12px;
  }
  .layout {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 0 8px 0 18px;
  }
  .layout__meta {
    font-size: var(--sx-text-xs);
    line-height: 14px;
    color: var(--sx-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mono {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
  }
</style>
