<script module lang="ts">
  import { SvelteSet } from 'svelte/reactivity';

  /** Session-wide placement and expansion so reopening the navigator restores it. */
  const frame = $state({ x: -1, y: -1, w: 320, h: 480 });
  const collapsed = new SvelteSet<string>();
</script>

<script lang="ts">
  import { untrack, type Component } from 'svelte';
  import { editor, isContainerComponent } from '#lib/state/editor.svelte.js';
  import { getManifest } from '@app-viz/components';
  import type { BlueprintNode } from '@app-viz/schema';
  import IconButton from '#lib/ui/IconButton.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import EyeIcon from 'phosphor-svelte/lib/EyeIcon';
  import EyeSlashIcon from 'phosphor-svelte/lib/EyeSlashIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import LockSimpleOpenIcon from 'phosphor-svelte/lib/LockSimpleOpenIcon';
  import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import RowsIcon from 'phosphor-svelte/lib/RowsIcon';
  import SquareIcon from 'phosphor-svelte/lib/SquareIcon';
  import GridFourIcon from 'phosphor-svelte/lib/GridFourIcon';
  import MinusIcon from 'phosphor-svelte/lib/MinusIcon';
  import ListIcon from 'phosphor-svelte/lib/ListIcon';
  import LayoutIcon from 'phosphor-svelte/lib/LayoutIcon';
  import MegaphoneIcon from 'phosphor-svelte/lib/MegaphoneIcon';
  import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import CircleDashedIcon from 'phosphor-svelte/lib/CircleDashedIcon';
  import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import DotsSixVerticalIcon from 'phosphor-svelte/lib/DotsSixVerticalIcon';

  type IconC = Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;
  type DropPos = 'before' | 'inside' | 'after';

  const TYPE_ICONS: Record<string, IconC> = {
    'structure/section': RowsIcon,
    'structure/container': SquareIcon,
    'structure/grid': GridFourIcon,
    'structure/divider': MinusIcon,
    'structure/slot': CircleDashedIcon
  };
  const CATEGORY_ICONS: Record<string, IconC> = {
    navigation: ListIcon,
    hero: LayoutIcon,
    marketing: MegaphoneIcon,
    app: ChartBarIcon,
    ui: CursorClickIcon,
    media: ImageIcon
  };

  let query = $state('');
  let renamingId = $state<string | null>(null);
  let renameText = $state('');
  let drop = $state<{ id: string; pos: DropPos } | null>(null);

  const open = $derived(editor.showNavigator && !editor.isInteractiveMode);
  const q = $derived(query.trim().toLowerCase());
  const sel = $derived(editor.selectedNode);

  function iconFor(node: BlueprintNode): IconC {
    return TYPE_ICONS[node.componentType] ?? CATEGORY_ICONS[getManifest(node.componentType)?.category ?? ''] ?? SquareIcon;
  }

  function matches(node: BlueprintNode): boolean {
    if (!q) return true;
    if (node.name.toLowerCase().includes(q) || node.componentType.toLowerCase().includes(q)) return true;
    return (node.children ?? []).some(matches);
  }

  function close() {
    editor.showNavigator = false;
  }

  function startRename(node: BlueprintNode) {
    renamingId = node.id;
    renameText = node.name;
  }

  function commitRename(nodeId: string) {
    const name = renameText.trim();
    if (name) editor.dispatch({ type: 'UPDATE_NODE_META', nodeId, meta: { name } });
    renamingId = null;
  }

  function toggleMeta(node: BlueprintNode, key: 'hidden' | 'locked') {
    editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { [key]: !node[key] } });
  }

  /* ---------------------------------------------------------------- placement */

  /** Clamps the remembered frame into the viewport on open. Untracked: it writes `frame`. */
  function place(el: HTMLElement) {
    return untrack(() => placeNow(el));
  }

  function placeNow(el: HTMLElement) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    frame.w = Math.min(frame.w, vw - 16);
    frame.h = Math.min(frame.h, vh - 72);
    if (frame.x < 0 || frame.y < 0) {
      frame.x = Math.max(8, vw - frame.w - 320);
      frame.y = 64;
    }
    frame.x = Math.min(Math.max(8, frame.x), vw - frame.w - 8);
    frame.y = Math.min(Math.max(56, frame.y), vh - 120);
    const onResize = () => {
      frame.x = Math.min(frame.x, window.innerWidth - frame.w - 8);
      frame.y = Math.min(frame.y, window.innerHeight - 120);
    };
    window.addEventListener('resize', onResize);
    el.focus({ preventScroll: true });
    return () => window.removeEventListener('resize', onResize);
  }

  function dragHandle(handle: HTMLElement) {
    let start: { px: number; py: number; x: number; y: number } | null = null;
    const move = (e: PointerEvent) => {
      if (!start) return;
      frame.x = Math.min(Math.max(8, start.x + e.clientX - start.px), window.innerWidth - frame.w - 8);
      frame.y = Math.min(Math.max(56, start.y + e.clientY - start.py), window.innerHeight - 48);
    };
    const up = (e: PointerEvent) => {
      start = null;
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      start = { px: e.clientX, py: e.clientY, x: frame.x, y: frame.y };
      handle.setPointerCapture(e.pointerId);
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    };
    handle.addEventListener('pointerdown', down);
    return () => handle.removeEventListener('pointerdown', down);
  }

  function resizeHandle(handle: HTMLElement) {
    let start: { px: number; py: number; w: number; h: number } | null = null;
    const move = (e: PointerEvent) => {
      if (!start) return;
      frame.w = Math.min(Math.max(280, start.w + e.clientX - start.px), window.innerWidth - frame.x - 8);
      frame.h = Math.min(Math.max(280, start.h + e.clientY - start.py), window.innerHeight - frame.y - 8);
    };
    const up = (e: PointerEvent) => {
      start = null;
      handle.releasePointerCapture(e.pointerId);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      start = { px: e.clientX, py: e.clientY, w: frame.w, h: frame.h };
      handle.setPointerCapture(e.pointerId);
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', up);
    };
    handle.addEventListener('pointerdown', down);
    return () => handle.removeEventListener('pointerdown', down);
  }

  /* ------------------------------------------------------------- drag reorder */

  function onDragStart(e: DragEvent, node: BlueprintNode) {
    e.stopPropagation();
    e.dataTransfer?.setData('application/x-app-viz-node-id', node.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e: DragEvent, node: BlueprintNode) {
    const types = Array.from(e.dataTransfer?.types ?? []);
    if (!types.includes('application/x-app-viz-node-id') && !types.includes('application/x-app-viz-component')) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0.5;
    const pos: DropPos = isContainerComponent(node.componentType) && ratio > 0.25 && ratio < 0.75 ? 'inside' : ratio < 0.5 ? 'before' : 'after';
    if (drop?.id !== node.id || drop.pos !== pos) drop = { id: node.id, pos };
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

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (event.defaultPrevented) return;
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  }

  function scrollIntoView(el: HTMLElement) {
    el.scrollIntoView({ block: 'nearest' });
  }
</script>

{#snippet tree(node: BlueprintNode, depth: number, isRoot: boolean)}
  {#if matches(node)}
    {@const selected = editor.selectedNodeId === node.id}
    {@const hasChildren = node.children.length > 0}
    {@const expanded = Boolean(q) || !collapsed.has(node.id)}
    {@const isSlot = node.componentType === 'structure/slot'}
    {@const Icon = iconFor(node)}
    <li role="treeitem" aria-selected={selected} aria-expanded={hasChildren ? expanded : undefined}>
      <div
        class={[
          'node',
          selected && 'node--on',
          node.hidden && 'node--hidden',
          drop?.id === node.id && `node--drop-${drop.pos}`
        ]}
        style:--depth={depth}
        draggable={!isRoot && !node.locked && !isSlot && renamingId !== node.id}
        role="presentation"
        ondragstart={(e) => onDragStart(e, node)}
        ondragover={(e) => onDragOver(e, node)}
        ondragleave={() => drop?.id === node.id && (drop = null)}
        ondrop={(e) => onDrop(e, node)}
        onpointerenter={() => editor.hoverNode(node.id)}
        onpointerleave={() => editor.hoverNode(null)}
        {@attach selected && scrollIntoView}
      >
        {#if hasChildren}
          <button
            type="button"
            class="node__caret"
            tabindex="-1"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onclick={() => (collapsed.has(node.id) ? collapsed.delete(node.id) : collapsed.add(node.id))}
          >
            <span class={['caret', expanded && 'caret--open']}><CaretRightIcon size={9} weight="bold" /></span>
          </button>
        {:else}
          <span class="node__caret" aria-hidden="true"></span>
        {/if}
        {#if renamingId === node.id}
          <span class="node__icon"><Icon size={14} /></span>
          <input
            class="node__rename"
            aria-label="Rename {node.name}"
            bind:value={renameText}
            {@attach (el) => {
              el.focus();
              el.select();
            }}
            onkeydown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commitRename(node.id);
              if (e.key === 'Escape') {
                e.preventDefault();
                renamingId = null;
              }
            }}
            onblur={() => renamingId === node.id && commitRename(node.id)}
          />
        {:else}
          <button type="button" class="node__main" onclick={() => editor.selectNode(node.id)} ondblclick={() => !isSlot && startRename(node)}>
            <span class="node__icon"><Icon size={14} weight={selected ? 'fill' : 'regular'} /></span>
            <span class="node__name">{node.name}</span>
          </button>
        {/if}
        {#if !isSlot && renamingId !== node.id}
          <span class={['node__flags', (node.hidden || node.locked) && 'node__flags--set']}>
            <button
              type="button"
              class={['flag', node.locked && 'flag--on']}
              aria-label={node.locked ? `Unlock ${node.name}` : `Lock ${node.name}`}
              aria-pressed={node.locked}
              {@attach tooltip(node.locked ? 'Unlock' : 'Lock')}
              onclick={() => toggleMeta(node, 'locked')}
            >
              {#if node.locked}<LockSimpleIcon size={13} weight="fill" />{:else}<LockSimpleOpenIcon size={13} />{/if}
            </button>
            <button
              type="button"
              class={['flag', node.hidden && 'flag--on']}
              aria-label={node.hidden ? `Show ${node.name}` : `Hide ${node.name}`}
              aria-pressed={node.hidden}
              {@attach tooltip(node.hidden ? 'Show' : 'Hide')}
              onclick={() => toggleMeta(node, 'hidden')}
            >
              {#if node.hidden}<EyeSlashIcon size={13} />{:else}<EyeIcon size={13} />{/if}
            </button>
          </span>
        {/if}
      </div>
      {#if hasChildren && expanded}
        <ul role="group">
          {#each node.children as child (child.id)}
            {@render tree(child, depth + 1, false)}
          {/each}
        </ul>
      {/if}
    </li>
  {/if}
{/snippet}

{#if open}
  <div
    class="nav"
    role="dialog"
    aria-label="Navigator"
    tabindex="-1"
    style:left="{frame.x}px"
    style:top="{frame.y}px"
    style:width="{frame.w}px"
    style:height="{frame.h}px"
    onkeydown={onKeydown}
    {@attach place}
  >
    <header class="nav__head" {@attach dragHandle}>
      <span class="nav__grip" aria-hidden="true"><DotsSixVerticalIcon size={14} weight="bold" /></span>
      <TreeStructureIcon size={15} />
      <span class="nav__title">Navigator</span>
      <kbd class="sx-kbd">⌘I</kbd>
      <IconButton size="sm" label="Close navigator" icon={XIcon} iconSize={13} onclick={close} />
    </header>

    <div class="nav__search">
      <label class="sx-search">
        <MagnifyingGlassIcon size={14} />
        <input class="sx-input" type="search" placeholder="Filter layers" aria-label="Filter layers" bind:value={query} />
      </label>
    </div>

    <div class="nav__body">
      {#if editor.activeLayout}
        <div class="nav__section"><BrowserIcon size={12} /> Layout · {editor.activeLayout.name}</div>
        <ul class="tree" role="tree" aria-label="Layout {editor.activeLayout.name}">
          {@render tree(editor.activeLayout.rootNode, 0, true)}
        </ul>
      {/if}
      {#if editor.activePage}
        <div class="nav__section"><FileIcon size={12} /> Page · {editor.activePage.path}</div>
        <ul class="tree" role="tree" aria-label="Page {editor.activePage.path}">
          {@render tree(editor.activePage.rootNode, 0, true)}
        </ul>
      {/if}
      {#if q && !(editor.activeLayout && matches(editor.activeLayout.rootNode)) && !(editor.activePage && matches(editor.activePage.rootNode))}
        <div class="sx-empty"><span class="sx-empty__title">No layers match “{query}”</span></div>
      {/if}
    </div>

    <footer class="nav__foot">
      <span class="nav__sel">{sel ? sel.name : 'Nothing selected'}</span>
      <IconButton size="sm" label="Move up" kbd="⌥↑" icon={ArrowUpIcon} iconSize={13} disabled={!sel} onclick={() => editor.reorderSelectedNode('up')} />
      <IconButton size="sm" label="Move down" kbd="⌥↓" icon={ArrowDownIcon} iconSize={13} disabled={!sel} onclick={() => editor.reorderSelectedNode('down')} />
      <IconButton size="sm" label="Duplicate" kbd="⌘D" icon={CopyIcon} iconSize={13} disabled={!sel} onclick={() => editor.duplicateSelectedNode()} />
    </footer>

    <span class="nav__resize" aria-hidden="true" {@attach resizeHandle}></span>
  </div>
{/if}

<style>
  .nav {
    position: fixed;
    z-index: 250;
    display: flex;
    flex-direction: column;
    min-width: 280px;
    min-height: 280px;
    background: var(--sx-panel-raised);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-lg);
    box-shadow: var(--sx-shadow-lg);
    overflow: hidden;
    outline: none;
    animation: nav-in 160ms var(--sx-ease);
  }
  .nav__head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    height: 40px;
    padding: 0 6px 0 8px;
    color: var(--sx-text-2);
    border-bottom: 1px solid var(--sx-border);
    cursor: grab;
    user-select: none;
    touch-action: none;
  }
  .nav__head:active {
    cursor: grabbing;
  }
  .nav__grip {
    display: grid;
    color: var(--sx-text-3);
  }
  .nav__title {
    flex: 1;
    font-weight: 600;
    color: var(--sx-text);
  }
  .nav__search {
    flex-shrink: 0;
    padding: 8px 8px 4px;
  }
  .nav__body {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0 4px 8px;
  }
  .nav__section {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 8px 4px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    color: var(--sx-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .node {
    position: relative;
    display: flex;
    align-items: center;
    height: 28px;
    padding-left: calc(2px + var(--depth) * 12px);
    padding-right: 4px;
    border-radius: var(--sx-radius-sm);
  }
  .node:hover {
    background: var(--sx-hover);
  }
  .node--on,
  .node--on:hover {
    background: var(--sx-accent-soft);
  }
  .node--hidden .node__name,
  .node--hidden .node__icon {
    opacity: 0.45;
  }
  .node--drop-before::before,
  .node--drop-after::after {
    content: '';
    position: absolute;
    left: calc(20px + var(--depth) * 12px);
    right: 4px;
    height: 2px;
    border-radius: 1px;
    background: var(--sx-accent);
    pointer-events: none;
  }
  .node--drop-before::before {
    top: -1px;
  }
  .node--drop-after::after {
    bottom: -1px;
  }
  .node--drop-inside {
    box-shadow: inset 0 0 0 1.5px var(--sx-accent);
  }
  .node__caret {
    display: grid;
    place-items: center;
    width: 16px;
    height: 24px;
    flex-shrink: 0;
    color: var(--sx-text-3);
  }
  button.node__caret:hover {
    color: var(--sx-text);
  }
  .caret {
    display: grid;
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .caret--open {
    transform: rotate(90deg);
  }
  .node__main {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    height: 100%;
    text-align: left;
    border-radius: var(--sx-radius-xs);
  }
  .node__icon {
    display: grid;
    place-items: center;
    width: 18px;
    flex-shrink: 0;
    color: var(--sx-text-3);
  }
  .node--on .node__icon {
    color: var(--sx-accent);
  }
  .node__name {
    min-width: 0;
    font-size: var(--sx-text-md);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .node--on .node__name {
    font-weight: 600;
    color: var(--sx-accent-text);
  }
  .node__rename {
    flex: 1;
    min-width: 0;
    height: 22px;
    margin-left: 6px;
    padding: 0 6px;
    font-size: var(--sx-text-md);
    color: var(--sx-text);
    background: var(--sx-panel);
    border: 1px solid var(--sx-accent);
    border-radius: var(--sx-radius-xs);
    box-shadow: var(--sx-focus);
    outline: none;
  }
  .node__flags {
    display: none;
    align-items: center;
    flex-shrink: 0;
  }
  .node:hover .node__flags,
  .node:focus-within .node__flags,
  .node__flags--set {
    display: flex;
  }
  .flag {
    display: grid;
    place-items: center;
    width: 22px;
    height: 22px;
    color: var(--sx-text-3);
    border-radius: var(--sx-radius-xs);
  }
  .flag:hover {
    color: var(--sx-text);
    background: var(--sx-active);
  }
  .node__flags--set .flag:not(.flag--on) {
    visibility: hidden;
  }
  .node:hover .node__flags--set .flag {
    visibility: visible;
  }
  .flag--on {
    color: var(--sx-text-2);
  }
  .nav__foot {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    height: 36px;
    padding: 0 6px 0 12px;
    border-top: 1px solid var(--sx-border);
    background: var(--sx-subtle);
  }
  .nav__sel {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .nav__resize {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 14px;
    height: 14px;
    cursor: nwse-resize;
    touch-action: none;
    background:
      linear-gradient(135deg, transparent 55%, var(--sx-border-strong) 55%, var(--sx-border-strong) 62%, transparent 62%),
      linear-gradient(135deg, transparent 75%, var(--sx-border-strong) 75%, var(--sx-border-strong) 82%, transparent 82%);
  }
  @keyframes nav-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .nav {
      animation: none;
    }
  }
</style>
