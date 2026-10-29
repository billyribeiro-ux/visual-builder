<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import { getManifest } from '@app-viz/components';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import ClipboardTextIcon from 'phosphor-svelte/lib/ClipboardTextIcon';
  import BookmarkSimpleIcon from 'phosphor-svelte/lib/BookmarkSimpleIcon';
  import DotsThreeIcon from 'phosphor-svelte/lib/DotsThreeIcon';
  import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import SelectionPlusIcon from 'phosphor-svelte/lib/SelectionPlusIcon';
  import CopySimpleIcon from 'phosphor-svelte/lib/CopySimpleIcon';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import LockSimpleOpenIcon from 'phosphor-svelte/lib/LockSimpleOpenIcon';
  import EyeIcon from 'phosphor-svelte/lib/EyeIcon';
  import EyeSlashIcon from 'phosphor-svelte/lib/EyeSlashIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import IconButton from '../../ui/IconButton.svelte';
  import Popover from '../../ui/Popover.svelte';
  import { editor } from '../../state/editor.svelte.js';
  import NodeIcon from './NodeIcon.svelte';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const uid = $props.id();
  const manifest = $derived(getManifest(node.componentType));
  const shortType = $derived(node.componentType.split('/')[1] ?? node.componentType);

  let nameDraft = $state<string | null>(null);
  let menuOpen = $state(false);
  let menuAnchor = $state<HTMLElement | null>(null);
  let saveOpen = $state(false);
  let saveAnchor = $state<HTMLElement | null>(null);
  let templateName = $state('');
  let templateError = $state('');

  function commitName(input: HTMLInputElement) {
    const t = input.value.trim();
    nameDraft = null;
    if (!t) {
      input.value = node.name;
      editor.notify('warning', 'An element name cannot be empty — kept the previous name.');
      return;
    }
    if (t !== node.name) editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { name: t } }, { coalesce: false });
  }

  function copyStyle() {
    editor.copyNodeStyle(node.id);
    editor.notify('success', `Copied the style of “${node.name}”.`, 1800);
  }

  function openSave() {
    templateName = node.name;
    templateError = '';
    saveOpen = true;
  }

  function saveTemplate() {
    const t = templateName.trim();
    if (!t) {
      templateError = 'Give the template a name.';
      return;
    }
    editor.saveSelectedNodeAsSymbol(t);
    saveOpen = false;
  }

  function run(action: () => void) {
    menuOpen = false;
    action();
  }

  const anchorTo = (set: (el: HTMLElement) => void) => (el: HTMLElement) => {
    set(el);
  };
</script>

<header class="hdr">
  <span class="hdr__tile" title={manifest?.displayName ?? node.componentType}>
    <NodeIcon componentType={node.componentType} size={14} />
  </span>
  <div class="hdr__text">
    <input
      id="{uid}-name"
      class="hdr__name"
      aria-label="Element name"
      spellcheck="false"
      value={nameDraft ?? node.name}
      oninput={(e) => (nameDraft = e.currentTarget.value)}
      onchange={(e) => commitName(e.currentTarget)}
      onkeydown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          nameDraft = null;
          e.currentTarget.value = node.name;
          e.currentTarget.blur();
        }
      }}
    />
    <span class="hdr__meta">
      <span class="sx-badge sx-badge--mono hdr__type" title={node.componentType}>{shortType}</span>
      {#if node.locked}<span class="sx-badge hdr__flag"><LockSimpleIcon size={10} weight="bold" /> Locked</span>{/if}
      {#if node.hidden}<span class="sx-badge hdr__flag"><EyeSlashIcon size={10} weight="bold" /> Hidden</span>{/if}
    </span>
  </div>
  <div class="hdr__actions">
    <IconButton label="Copy style" kbd="⌘⇧C" icon={CopyIcon} iconSize={15} onclick={copyStyle} />
    <IconButton
      label="Paste style"
      kbd="⌘⇧V"
      icon={ClipboardTextIcon}
      iconSize={15}
      disabled={!editor.clipboardStyles || node.locked}
      onclick={() => editor.pasteNodeStyle(node.id)}
    />
    <IconButton
      label="Save as template"
      icon={BookmarkSimpleIcon}
      iconSize={15}
      active={saveOpen}
      aria-haspopup="dialog"
      aria-expanded={saveOpen}
      {@attach anchorTo((el) => (saveAnchor = el))}
      onclick={() => (saveOpen ? (saveOpen = false) : openSave())}
    />
    <IconButton
      label="More actions"
      icon={DotsThreeIcon}
      iconSize={16}
      weight="bold"
      active={menuOpen}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      {@attach anchorTo((el) => (menuAnchor = el))}
      onclick={() => (menuOpen = !menuOpen)}
    />
  </div>
</header>

<Popover open={saveOpen} anchor={saveAnchor} onclose={() => (saveOpen = false)} placement="bottom-end" width={260} role="dialog" label="Save as template">
  <form
    class="save"
    onsubmit={(e) => {
      e.preventDefault();
      saveTemplate();
    }}
  >
    <p class="save__title">Save as template</p>
    <p class="sx-help">Saves this element and everything inside it to your template library.</p>
    <label class="sx-label" for="{uid}-template">Template name</label>
    <input
      id="{uid}-template"
      class={['sx-input', templateError && 'is-invalid']}
      aria-invalid={templateError ? 'true' : undefined}
      bind:value={templateName}
      {@attach (el) => {
        el.focus();
        el.select();
      }}
    />
    {#if templateError}<p class="save__error" role="alert">{templateError}</p>{/if}
    <div class="save__actions">
      <button type="button" class="sx-btn sx-btn--sm sx-btn--ghost" onclick={() => (saveOpen = false)}>Cancel</button>
      <button type="submit" class="sx-btn sx-btn--sm sx-btn--primary">Save template</button>
    </div>
  </form>
</Popover>

<Popover open={menuOpen} anchor={menuAnchor} onclose={() => (menuOpen = false)} placement="bottom-end" width={232} label="Element actions">
  <button type="button" role="menuitem" class="sx-menu-item" disabled={node.locked} onclick={() => run(() => editor.dispatch({ type: 'REORDER_NODE', nodeId: node.id, direction: 'up' }))}>
    <ArrowUpIcon size={15} /><span class="sx-menu-item__label">Move up</span><span class="sx-menu-item__hint">⌥↑</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" disabled={node.locked} onclick={() => run(() => editor.dispatch({ type: 'REORDER_NODE', nodeId: node.id, direction: 'down' }))}>
    <ArrowDownIcon size={15} /><span class="sx-menu-item__label">Move down</span><span class="sx-menu-item__hint">⌥↓</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" disabled={node.locked} onclick={() => run(() => editor.wrapNode(node.id, 'structure/section'))}>
    <SelectionPlusIcon size={15} /><span class="sx-menu-item__label">Wrap in section</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => editor.dispatch({ type: 'DUPLICATE_NODE', nodeId: node.id }))}>
    <CopySimpleIcon size={15} /><span class="sx-menu-item__label">Duplicate</span><span class="sx-menu-item__hint">⌘D</span>
  </button>
  <div class="sx-menu-sep" role="separator"></div>
  <button type="button" role="menuitem" class="sx-menu-item" disabled={node.locked} onclick={() => run(() => editor.resetNodeStyle(node.id))}>
    <ArrowCounterClockwiseIcon size={15} /><span class="sx-menu-item__label">Reset all styling</span>
  </button>
  <button
    type="button"
    role="menuitem"
    class="sx-menu-item"
    onclick={() => run(() => editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { locked: !node.locked } }, { coalesce: false }))}
  >
    {#if node.locked}<LockSimpleOpenIcon size={15} />{:else}<LockSimpleIcon size={15} />{/if}
    <span class="sx-menu-item__label">{node.locked ? 'Unlock' : 'Lock'}</span>
  </button>
  <button
    type="button"
    role="menuitem"
    class="sx-menu-item"
    onclick={() => run(() => editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { hidden: !node.hidden } }, { coalesce: false }))}
  >
    {#if node.hidden}<EyeIcon size={15} />{:else}<EyeSlashIcon size={15} />{/if}
    <span class="sx-menu-item__label">{node.hidden ? 'Show' : 'Hide'}</span>
  </button>
  <div class="sx-menu-sep" role="separator"></div>
  <button type="button" role="menuitem" class="sx-menu-item sx-menu-item--danger" disabled={node.locked} onclick={() => run(() => editor.deleteSelectedNode())}>
    <TrashIcon size={15} /><span class="sx-menu-item__label">Delete</span><span class="sx-menu-item__hint">⌫</span>
  </button>
</Popover>

<style>
  .hdr {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 52px;
    padding: 0 8px 0 14px;
    border-bottom: 1px solid var(--sx-border);
    flex-shrink: 0;
  }
  .hdr__tile {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text-2);
    background: var(--sx-hover);
    flex-shrink: 0;
  }
  .hdr__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .hdr__name {
    width: 100%;
    min-width: 0;
    height: 22px;
    margin-left: -5px;
    padding: 0 4px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--sx-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--sx-radius-xs);
    outline: none;
    text-overflow: ellipsis;
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      background-color var(--sx-dur) var(--sx-ease);
  }
  .hdr__name:hover {
    border-color: var(--sx-border);
  }
  .hdr__name:focus {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .hdr__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .hdr__type {
    height: 16px;
    padding: 0 5px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--sx-text-3);
  }
  .hdr__flag {
    height: 16px;
    padding: 0 5px;
    color: var(--sx-warning);
    background: var(--sx-warning-soft);
  }
  .hdr__actions {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
  }
  .save {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px;
  }
  .save__title {
    font-size: var(--sx-text-md);
    font-weight: 600;
  }
  .save__error {
    font-size: var(--sx-text-sm);
    color: var(--sx-danger);
  }
  .save__actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 4px;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
  .sx-menu-item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
