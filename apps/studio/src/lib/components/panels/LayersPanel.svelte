<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import { getAllManifests } from '@app-viz/components';
  import { editor, isContainerComponent } from '../../state/editor.svelte.js';
  import IconButton from '../../ui/IconButton.svelte';
  import { resolveWidgetIcon } from '../../ui/widget-icons.js';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import EyeIcon from 'phosphor-svelte/lib/EyeIcon';
  import EyeSlashIcon from 'phosphor-svelte/lib/EyeSlashIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import LockSimpleOpenIcon from 'phosphor-svelte/lib/LockSimpleOpenIcon';
  import ArrowsInSimpleIcon from 'phosphor-svelte/lib/ArrowsInSimpleIcon';
  import ArrowsOutSimpleIcon from 'phosphor-svelte/lib/ArrowsOutSimpleIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';
  import ArrowSquareInIcon from 'phosphor-svelte/lib/ArrowSquareInIcon';
  import NoteIcon from 'phosphor-svelte/lib/NoteIcon';

  type DropPos = 'before' | 'inside' | 'after';

  const iconByType = $derived(
    new Map(getAllManifests().map((m) => [m.type, { icon: (m as { icon?: string }).icon, category: m.category as string }]))
  );

  let query = $state('');
  let collapsedIds = $state<Record<string, boolean>>({});
  let renamingId = $state<string | null>(null);
  let drop = $state<{ id: string; pos: DropPos } | null>(null);

  const layout = $derived(editor.activeLayout);
  const page = $derived(editor.activePage);

  /** Ids on the path to the selection are always expanded so the selected row is visible. */
  const selectionPath = $derived(new Set(editor.selectedNodeBreadcrumb.map((n) => n.id)));

  function matchesQuery(node: BlueprintNode, q: string): boolean {
    if (!q) return true;
    if (node.name.toLowerCase().includes(q) || node.componentType.toLowerCase().includes(q)) return true;
    return (node.children ?? []).some((c) => matchesQuery(c, q));
  }

  function isExpanded(node: BlueprintNode): boolean {
    if (query.trim()) return true;
    if (selectionPath.has(node.id) && node.id !== editor.selectedNodeId) return true;
    return !collapsedIds[node.id];
  }

  function toggle(node: BlueprintNode) {
    collapsedIds = { ...collapsedIds, [node.id]: isExpanded(node) };
  }

  function setAll(collapsed: boolean) {
    const next: Record<string, boolean> = {};
    const walk = (n: BlueprintNode | undefined) => {
      if (!n) return;
      if ((n.children ?? []).length > 0) next[n.id] = collapsed;
      n.children?.forEach(walk);
    };
    walk(page?.rootNode);
    walk(layout?.rootNode);
    collapsedIds = next;
  }

  function onDragStart(e: DragEvent, node: BlueprintNode) {
    if (!e.dataTransfer) return;
    e.stopPropagation();
    e.dataTransfer.setData('application/x-app-viz-node-id', node.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, node: BlueprintNode, isRoot: boolean) {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
    let pos: DropPos = ratio < 0.5 ? 'before' : 'after';
    if (isRoot || (isContainerComponent(node.componentType) && ratio > 0.25 && ratio < 0.75)) pos = 'inside';
    drop = { id: node.id, pos };
  }

  function onDrop(e: DragEvent, node: BlueprintNode) {
    e.preventDefault();
    e.stopPropagation();
    const pos = drop?.pos ?? 'after';
    drop = null;
    const componentType = e.dataTransfer?.getData('application/x-app-viz-component');
    const draggedId = e.dataTransfer?.getData('application/x-app-viz-node-id');
    if (componentType) editor.dropComponentOnTarget(componentType, node.id, pos);
    else if (draggedId && draggedId !== node.id) editor.dropNodeOnTarget(draggedId, node.id, pos);
  }

  function commitRename(node: BlueprintNode, value: string) {
    renamingId = null;
    const name = value.trim();
    if (name && name !== node.name) editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { name } }, { coalesce: false });
  }

  function focusAndSelect(el: HTMLInputElement) {
    el.focus();
    el.select();
  }

  function onRowKeydown(e: KeyboardEvent, node: BlueprintNode) {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor.selectNode(node.id);
    } else if (e.key === 'F2') {
      e.preventDefault();
      renamingId = node.id;
    } else if (e.key === 'ArrowRight' && (node.children ?? []).length > 0 && !isExpanded(node)) {
      e.preventDefault();
      toggle(node);
    } else if (e.key === 'ArrowLeft' && (node.children ?? []).length > 0 && isExpanded(node)) {
      e.preventDefault();
      toggle(node);
    }
  }
</script>

{#snippet row(node: BlueprintNode, depth: number, isRoot: boolean, rootLabel?: string)}
  {@const q = query.trim().toLowerCase()}
  {#if matchesQuery(node, q)}
    {@const meta = iconByType.get(node.componentType)}
    {@const Icon = isRoot ? (rootLabel === 'Layout' ? BrowserIcon : FileIcon) : node.componentType === 'structure/slot' ? ArrowSquareInIcon : resolveWidgetIcon(meta?.icon, meta?.category)}
    {@const hasKids = (node.children ?? []).length > 0}
    {@const open = isExpanded(node)}
    {@const selected = editor.selectedNodeId === node.id}
    {@const isSlot = node.componentType === 'structure/slot'}
    <div
      class={[
        'lp__row',
        selected && 'lp__row--selected',
        node.hidden && 'lp__row--hidden',
        isRoot && 'lp__row--root',
        drop?.id === node.id && `lp__row--drop-${drop.pos}`
      ]}
      style:--depth={depth}
      role="treeitem"
      aria-selected={selected}
      aria-expanded={hasKids ? open : undefined}
      aria-level={depth + 1}
      tabindex={selected ? 0 : -1}
      draggable={!isRoot && !node.locked && !isSlot && renamingId !== node.id}
      ondragstart={(e) => onDragStart(e, node)}
      ondragover={(e) => onDragOver(e, node, isRoot)}
      ondragleave={() => drop?.id === node.id && (drop = null)}
      ondrop={(e) => onDrop(e, node)}
      onclick={() => !isRoot && editor.selectNode(node.id)}
      ondblclick={() => !isRoot && !isSlot && (renamingId = node.id)}
      onpointerenter={() => !isRoot && editor.hoverNode(node.id)}
      onpointerleave={() => editor.hoverNodeId === node.id && editor.hoverNode(null)}
      onkeydown={(e) => onRowKeydown(e, node)}
    >
      <button
        type="button"
        class={['lp__caret', open && 'lp__caret--open', !hasKids && 'lp__caret--none']}
        tabindex="-1"
        aria-label={open ? 'Collapse' : 'Expand'}
        onclick={(e) => {
          e.stopPropagation();
          if (hasKids) toggle(node);
        }}
      >
        {#if hasKids}<CaretRightIcon size={9} weight="bold" />{/if}
      </button>
      <span class="lp__icon"><Icon size={14} weight={isRoot ? 'regular' : 'regular'} /></span>
      {#if renamingId === node.id}
        <input
          class="lp__rename"
          aria-label="Layer name"
          value={node.name}
          {@attach focusAndSelect}
          onclick={(e) => e.stopPropagation()}
          onblur={(e) => commitRename(node, (e.currentTarget as HTMLInputElement).value)}
          onkeydown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commitRename(node, (e.currentTarget as HTMLInputElement).value);
            if (e.key === 'Escape') renamingId = null;
          }}
        />
      {:else}
        <span class="lp__name">{isRoot ? `${rootLabel} · ${node.name}` : node.name}</span>
      {/if}
      {#if isSlot}<span class="sx-badge">Page content</span>{/if}
      {#if !isRoot && editor.blueprint.notes?.[`node:${node.id}`]}
        <span class="lp__note" title="Has developer notes" aria-label="Has developer notes"><NoteIcon size={12} /></span>
      {/if}
      {#if !isRoot && !isSlot}
        <span class={['lp__actions', (node.hidden || node.locked) && 'lp__actions--sticky']}>
          <button
            type="button"
            class={['lp__act', node.locked && 'lp__act--on']}
            aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`}
            aria-pressed={node.locked}
            tabindex="-1"
            onclick={(e) => {
              e.stopPropagation();
              editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { locked: !node.locked } }, { coalesce: false });
            }}
          >
            {#if node.locked}<LockSimpleIcon size={12} />{:else}<LockSimpleOpenIcon size={12} />{/if}
          </button>
          <button
            type="button"
            class={['lp__act', node.hidden && 'lp__act--on']}
            aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`}
            aria-pressed={node.hidden}
            tabindex="-1"
            onclick={(e) => {
              e.stopPropagation();
              editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { hidden: !node.hidden } }, { coalesce: false });
            }}
          >
            {#if node.hidden}<EyeSlashIcon size={12} />{:else}<EyeIcon size={12} />{/if}
          </button>
        </span>
      {/if}
    </div>
    {#if hasKids && open}
      {#each node.children as child (child.id)}
        {@render row(child, depth + 1, false)}
      {/each}
    {/if}
  {/if}
{/snippet}

<div class="sx-panel">
  <div class="sx-panel__header">
    <h2 class="sx-panel__title">Layers</h2>
    <IconButton label="Expand all" icon={ArrowsOutSimpleIcon} iconSize={14} onclick={() => setAll(false)} />
    <IconButton label="Collapse all" icon={ArrowsInSimpleIcon} iconSize={14} onclick={() => setAll(true)} />
  </div>
  <div class="lp__search">
    <div class="sx-search">
      <MagnifyingGlassIcon size={14} />
      <input class="sx-input" type="search" placeholder="Filter layers" aria-label="Filter layers" bind:value={query} />
    </div>
  </div>
  <div class="sx-panel__body lp__body" role="tree" aria-label="Page layers">
    {#if layout}
      {@render row(layout.rootNode, 0, true, 'Layout')}
      <div class="lp__gap"></div>
    {/if}
    {#if page}
      {@render row(page.rootNode, 0, true, 'Page')}
    {/if}
  </div>
  <div class="lp__foot">
    <span>Drag to reorder · Double-click to rename · Hover highlights on canvas</span>
  </div>
</div>

<style>
  .lp__search {
    padding: 10px 12px;
    border-bottom: 1px solid var(--sx-border);
  }
  .lp__body {
    padding: 6px 6px 12px;
  }
  .lp__gap {
    height: 8px;
  }
  .lp__row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    padding-left: calc(4px + var(--depth) * 14px);
    padding-right: 4px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text);
    cursor: default;
    outline: none;
  }
  .lp__row:hover {
    background: var(--sx-hover);
  }
  .lp__row:focus-visible {
    box-shadow: inset 0 0 0 2px var(--sx-accent);
  }
  .lp__row--selected,
  .lp__row--selected:hover {
    background: var(--sx-accent-soft);
    color: var(--sx-accent-text);
  }
  .lp__row--root {
    font-weight: 600;
    color: var(--sx-text-2);
  }
  .lp__row--root:hover {
    background: transparent;
  }
  .lp__row--hidden .lp__name,
  .lp__row--hidden .lp__icon {
    opacity: 0.45;
  }
  .lp__row--drop-before::before,
  .lp__row--drop-after::after {
    content: '';
    position: absolute;
    left: calc(4px + var(--depth) * 14px);
    right: 4px;
    height: 2px;
    border-radius: 2px;
    background: var(--sx-accent);
  }
  .lp__row--drop-before::before {
    top: -1px;
  }
  .lp__row--drop-after::after {
    bottom: -1px;
  }
  .lp__row--drop-inside {
    box-shadow: inset 0 0 0 1.5px var(--sx-accent);
    background: var(--sx-accent-soft);
  }
  .lp__caret {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: var(--sx-text-3);
    flex-shrink: 0;
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .lp__caret:hover {
    color: var(--sx-text);
  }
  .lp__caret--open {
    transform: rotate(90deg);
  }
  .lp__caret--none {
    pointer-events: none;
  }
  .lp__icon {
    display: grid;
    place-items: center;
    width: 18px;
    color: var(--sx-text-2);
    flex-shrink: 0;
  }
  .lp__row--selected .lp__icon {
    color: var(--sx-accent-text);
  }
  .lp__name {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-md);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .lp__rename {
    flex: 1;
    min-width: 0;
    height: 22px;
    padding: 0 4px;
    font-size: var(--sx-text-md);
    border: 1px solid var(--sx-accent);
    border-radius: var(--sx-radius-xs);
    box-shadow: var(--sx-focus);
    background: var(--sx-panel);
    color: var(--sx-text);
    outline: none;
  }
  .lp__note {
    display: grid;
    place-items: center;
    color: var(--sx-warning);
    flex-shrink: 0;
  }
  .lp__actions {
    display: flex;
    gap: 1px;
    opacity: 0;
  }
  .lp__row:hover .lp__actions,
  .lp__actions--sticky {
    opacity: 1;
  }
  .lp__act {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    color: var(--sx-text-3);
  }
  .lp__act:hover {
    color: var(--sx-text);
    background: var(--sx-active);
  }
  .lp__actions--sticky .lp__act:not(.lp__act--on) {
    visibility: hidden;
  }
  .lp__row:hover .lp__actions--sticky .lp__act {
    visibility: visible;
  }
  .lp__act--on {
    color: var(--sx-text-2);
  }
  .lp__foot {
    padding: 8px 14px;
    border-top: 1px solid var(--sx-border);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
</style>
