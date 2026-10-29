<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import RowsIcon from 'phosphor-svelte/lib/RowsIcon';
  import BoundingBoxIcon from 'phosphor-svelte/lib/BoundingBoxIcon';
  import ArrowsOutSimpleIcon from 'phosphor-svelte/lib/ArrowsOutSimpleIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import ClipboardTextIcon from 'phosphor-svelte/lib/ClipboardTextIcon';
  import ClipboardIcon from 'phosphor-svelte/lib/ClipboardIcon';
  import PaintBrushIcon from 'phosphor-svelte/lib/PaintBrushIcon';
  import PaintBucketIcon from 'phosphor-svelte/lib/PaintBucketIcon';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import StarIcon from 'phosphor-svelte/lib/StarIcon';
  import EyeSlashIcon from 'phosphor-svelte/lib/EyeSlashIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import TextAlignLeftIcon from 'phosphor-svelte/lib/TextAlignLeftIcon';
  import TextAlignCenterIcon from 'phosphor-svelte/lib/TextAlignCenterIcon';
  import TextAlignRightIcon from 'phosphor-svelte/lib/TextAlignRightIcon';
  import type { NodeQuickAction } from './messages.js';
  import type { OverlayNodeInfo } from './EditorOverlay.svelte';

  interface Props {
    node: OverlayNodeInfo;
    x: number;
    y: number;
    onAction: (action: NodeQuickAction) => void;
  }

  let { node, x, y, onAction }: Props = $props();

  type Item = {
    action: NodeQuickAction;
    label: string;
    icon: typeof CopyIcon;
    shortcut?: string;
    danger?: boolean;
  };

  const groups = $derived.by<Item[][]>(() => {
    const editable = !node.locked;
    const movable = editable && !node.isRoot;
    const structure: Item[] = movable
      ? [
          { action: 'up', label: 'Move up', icon: ArrowUpIcon, shortcut: 'Alt+↑' },
          { action: 'down', label: 'Move down', icon: ArrowDownIcon, shortcut: 'Alt+↓' }
        ]
      : [];
    const wrapping: Item[] = movable
      ? [
          { action: 'wrap-section', label: 'Wrap in section', icon: RowsIcon },
          { action: 'wrap-container', label: 'Wrap in container', icon: BoundingBoxIcon },
          ...(node.hasChildren ? [{ action: 'unwrap' as const, label: 'Unwrap children', icon: ArrowsOutSimpleIcon }] : [])
        ]
      : [];
    const clipboard: Item[] = [
      ...(node.isRoot ? [] : [{ action: 'duplicate' as const, label: 'Duplicate', icon: CopyIcon, shortcut: '⌘D' }]),
      { action: 'copy', label: 'Copy', icon: ClipboardTextIcon, shortcut: '⌘C' },
      ...(editable ? [{ action: 'paste' as const, label: 'Paste after', icon: ClipboardIcon, shortcut: '⌘V' }] : [])
    ];
    const style: Item[] = [
      { action: 'copy-style', label: 'Copy style', icon: PaintBrushIcon, shortcut: '⌘⇧C' },
      ...(editable
        ? [
            { action: 'paste-style' as const, label: 'Paste style', icon: PaintBucketIcon, shortcut: '⌘⇧V' },
            { action: 'reset-style' as const, label: 'Reset style', icon: ArrowCounterClockwiseIcon }
          ]
        : [])
    ];
    const library: Item[] = [{ action: 'save-symbol', label: 'Save as reusable block', icon: StarIcon }];
    const destructive: Item[] = movable
      ? [
          { action: 'hide', label: 'Hide', icon: EyeSlashIcon },
          { action: 'delete', label: 'Delete', icon: TrashIcon, shortcut: '⌫', danger: true }
        ]
      : [];
    return [structure, wrapping, clipboard, style, library, destructive].filter((group) => group.length > 0);
  });

  const alignments = [
    { action: 'align-left' as const, label: 'Align left', icon: TextAlignLeftIcon },
    { action: 'align-center' as const, label: 'Align center', icon: TextAlignCenterIcon },
    { action: 'align-right' as const, label: 'Align right', icon: TextAlignRightIcon }
  ];

  let width = $state(0);
  let height = $state(0);
  const left = $derived(Math.max(8, Math.min(x, window.innerWidth - width - 8)));
  const top = $derived(Math.max(8, Math.min(y, window.innerHeight - height - 8)));

  function menuItems(menu: HTMLElement): HTMLElement[] {
    return Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }

  /** Focuses the first item when the menu opens. */
  const focusFirst: Attachment<HTMLElement> = (menu) => {
    menuItems(menu)[0]?.focus({ preventScroll: true });
  };

  function handleKeydown(event: KeyboardEvent) {
    const menu = event.currentTarget as HTMLElement;
    const items = menuItems(menu);
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = items.length - 1;
    if (next >= 0) {
      event.preventDefault();
      event.stopPropagation();
      items[next]?.focus();
    }
  }
</script>

<div
  class="cv-menu"
  data-canvas-ui
  role="menu"
  aria-label="{node.name} actions"
  tabindex="-1"
  style:left="{left}px"
  style:top="{top}px"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
  onkeydown={handleKeydown}
  {@attach focusFirst}
>
  <div class="cv-menu-header">
    {#if node.locked}<LockSimpleIcon size={14} />{/if}
    <span class="cv-menu-title">{node.name}</span>
  </div>

  {#if !node.locked}
    <div class="cv-menu-align" role="group" aria-label="Alignment">
      {#each alignments as item (item.action)}
        <button type="button" role="menuitem" class="cv-menu-align-btn" aria-label={item.label} title={item.label} onclick={() => onAction(item.action)}>
          <item.icon size={16} />
        </button>
      {/each}
    </div>
    <div class="cv-menu-sep" role="separator"></div>
  {/if}

  {#each groups as group, groupIndex (groupIndex)}
    {#if groupIndex > 0}
      <div class="cv-menu-sep" role="separator"></div>
    {/if}
    {#each group as item (item.action)}
      <button type="button" role="menuitem" class={['cv-menu-item', item.danger && 'cv-menu-item--danger']} onclick={() => onAction(item.action)}>
        <item.icon size={16} />
        <span class="cv-menu-label">{item.label}</span>
        {#if item.shortcut}<span class="cv-menu-shortcut">{item.shortcut}</span>{/if}
      </button>
    {/each}
  {/each}

  {#if node.locked}
    <div class="cv-menu-sep" role="separator"></div>
    <p class="cv-menu-note">This element is locked. Unlock it in the Layers panel to edit it.</p>
  {/if}
</div>

<style>
  .cv-menu {
    position: fixed;
    z-index: 2147483600;
    width: 240px;
    padding: 4px;
    box-sizing: border-box;
    border: 1px solid #EAECF0;
    border-radius: 8px;
    background: #FFFFFF;
    color: #101828;
    box-shadow: 0 12px 32px rgba(16, 24, 40, 0.14);
    font: 400 13px/1.2 Inter, system-ui, sans-serif;
    outline: none;
  }
  .cv-menu-header {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    padding: 0 8px;
    color: #475467;
    font-size: 12px;
    font-weight: 600;
  }
  .cv-menu-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cv-menu-align {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 2px 4px 4px;
  }
  .cv-menu-align-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    border: 1px solid #EAECF0;
    border-radius: 6px;
    background: #FFFFFF;
    color: #344054;
    cursor: pointer;
  }
  .cv-menu-align-btn:hover,
  .cv-menu-align-btn:focus-visible {
    background: #F2F4F7;
    outline: none;
  }
  .cv-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    height: 30px;
    padding: 0 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #344054;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .cv-menu-item:hover,
  .cv-menu-item:focus-visible {
    background: #F2F4F7;
    outline: none;
  }
  .cv-menu-item--danger {
    color: #D92D20;
  }
  .cv-menu-item--danger:hover,
  .cv-menu-item--danger:focus-visible {
    background: #FEF3F2;
  }
  .cv-menu-label {
    flex: 1;
  }
  .cv-menu-shortcut {
    color: #98A2B3;
    font-size: 12px;
  }
  .cv-menu-sep {
    height: 1px;
    margin: 4px 0;
    background: #F2F4F7;
  }
  .cv-menu-note {
    margin: 0;
    padding: 6px 8px;
    color: #667085;
    font-size: 12px;
    line-height: 1.4;
  }
</style>
