<script lang="ts">
  import type { Component } from 'svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { pageDisplayName } from '#lib/state/page-name.js';
  import { getAllManifests } from '@app-viz/components';
  import { MD3_THEME_PRESETS, type BlueprintNode, type BreakpointKey } from '@app-viz/schema';
  import Toggle from '#lib/ui/Toggle.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import NewPageDialog from './panels/NewPageDialog.svelte';
  import { componentLabel, neutralize, themePresetName } from './dialogs/copy.js';
  import { shortcutKeys } from './dialogs/shortcuts.js';
  import { focusScope, trapTab } from './dialogs/focus-trap.js';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import FloppyDiskIcon from 'phosphor-svelte/lib/FloppyDiskIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import ExportIcon from 'phosphor-svelte/lib/ExportIcon';
  import FolderOpenIcon from 'phosphor-svelte/lib/FolderOpenIcon';
  import BooksIcon from 'phosphor-svelte/lib/BooksIcon';
  import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
  import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
  import KeyboardIcon from 'phosphor-svelte/lib/KeyboardIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrowIcon';
  import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
  import DeviceTabletIcon from 'phosphor-svelte/lib/DeviceTabletIcon';
  import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
  import CornersOutIcon from 'phosphor-svelte/lib/CornersOutIcon';
  import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
  import SunIcon from 'phosphor-svelte/lib/SunIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import BookmarkSimpleIcon from 'phosphor-svelte/lib/BookmarkSimpleIcon';
  import FilePlusIcon from 'phosphor-svelte/lib/FilePlusIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
  import PaletteIcon from 'phosphor-svelte/lib/PaletteIcon';
  import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
  import StackIcon from 'phosphor-svelte/lib/StackIcon';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import RowsIcon from 'phosphor-svelte/lib/RowsIcon';
  import LayoutIcon from 'phosphor-svelte/lib/LayoutIcon';
  import MegaphoneIcon from 'phosphor-svelte/lib/MegaphoneIcon';
  import ChartBarIcon from 'phosphor-svelte/lib/ChartBarIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import ListIcon from 'phosphor-svelte/lib/ListIcon';
  import SelectionIcon from 'phosphor-svelte/lib/SelectionIcon';

  type IconC = Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;
  type Group = 'Compose' | 'Actions' | 'Pages' | 'Insert element' | 'Layers' | 'Theme';

  interface Item {
    id: string;
    group: Group;
    label: string;
    hint?: string;
    keys?: string[];
    icon: IconC;
    keywords?: string;
    run: () => void;
  }

  const GROUP_ORDER: Group[] = ['Compose', 'Actions', 'Pages', 'Insert element', 'Layers', 'Theme'];
  const LIMITS: Record<Group, number> = { Compose: 4, Actions: 8, Pages: 6, 'Insert element': 6, Layers: 6, Theme: 4 };
  const EXAMPLES = [
    'Add a hero, stats bar and 3-tier pricing table',
    'KPI dashboard with a data table',
    'Testimonials, FAQ accordion and newsletter signup',
    'Contact form and sign-in card'
  ];
  const CATEGORY_ICONS: Record<string, IconC> = {
    structure: RowsIcon,
    navigation: ListIcon,
    hero: LayoutIcon,
    marketing: MegaphoneIcon,
    app: ChartBarIcon,
    ui: CursorClickIcon,
    media: ImageIcon
  };
  const VIEWPORTS: Array<{ key: BreakpointKey; label: string; width: number; icon: IconC }> = [
    { key: 'desktop', label: 'Desktop', width: 1280, icon: MonitorIcon },
    { key: 'wide', label: 'Wide', width: 1440, icon: MonitorIcon },
    { key: 'tablet', label: 'Tablet', width: 768, icon: DeviceTabletIcon },
    { key: 'mobile', label: 'Mobile', width: 375, icon: DeviceMobileIcon }
  ];

  const uid = $props.id();
  let query = $state('');
  let active = $state(0);
  let applyTheme = $state(true);
  let showNewPage = $state(false);
  let listEl: HTMLElement | null = null;

  const open = $derived(editor.showCommandPalette);
  const q = $derived(query.trim().toLowerCase());
  const looksLikePrompt = $derived(q.split(/\s+/).filter(Boolean).length >= 3 || /^(add|create|build|make|compose|generate)\b/.test(q));

  function close() {
    editor.showCommandPalette = false;
    query = '';
    active = 0;
  }

  function act(fn: () => void) {
    return () => {
      close();
      fn();
    };
  }

  /** `openLeftTab` toggles; these commands must only ever show the panel. */
  function showPanel(tab: typeof editor.activeLeftTab) {
    if (editor.activeLeftTab !== tab || !editor.leftPanelOpen) editor.openLeftTab(tab);
  }

  function compose(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    close();
    const res = editor.composeFromPrompt(prompt, applyTheme);
    if (res.count > 0) editor.notify('success', neutralize(res.summary));
    else editor.notify('warning', 'Nothing was added — open a page first.');
  }

  function flatten(root: BlueprintNode | undefined, out: BlueprintNode[] = []): BlueprintNode[] {
    if (!root) return out;
    out.push(root);
    for (const c of root.children ?? []) flatten(c, out);
    return out;
  }

  const items = $derived.by<Item[]>(() => {
    if (!open) return [];
    const list: Item[] = [];
    const sel = editor.selectedNode;

    // Actions
    const k = (id: string) => shortcutKeys(id);
    list.push(
      { id: 'new-page', group: 'Actions', label: 'New page…', icon: FilePlusIcon, keywords: 'add route create', run: act(() => (showNewPage = true)) },
      { id: 'export', group: 'Actions', label: 'Export…', keys: k('export'), icon: ExportIcon, keywords: 'claude build spec zip download', run: act(() => (editor.showExportDialog = true)) },
      { id: 'library', group: 'Actions', label: 'Open template library', icon: BooksIcon, keywords: 'blocks sections kits saved', run: act(() => (editor.showBlockLibraryModal = true)) },
      { id: 'projects', group: 'Actions', label: 'Open projects…', icon: FolderOpenIcon, keywords: 'import duplicate versions', run: act(() => (editor.showProjectLibrary = true)) },
      { id: 'preflight', group: 'Actions', label: 'Run preflight checks', icon: ShieldCheckIcon, keywords: 'validate audit links', run: act(() => (editor.showPreflight = true)) },
      { id: 'code', group: 'Actions', label: 'View generated code', icon: CodeIcon, keywords: 'svelte css agents json', run: act(() => (editor.showCodeView = true)) },
      { id: 'preview', group: 'Actions', label: editor.isInteractiveMode ? 'Exit preview' : 'Preview site', keys: k('preview'), icon: PlayIcon, keywords: 'interactive live', run: act(() => editor.toggleInteractiveMode()) },
      { id: 'shortcuts', group: 'Actions', label: 'Keyboard shortcuts', keys: k('shortcuts'), icon: KeyboardIcon, keywords: 'keys help', run: act(() => (editor.showShortcuts = true)) },
      { id: 'undo', group: 'Actions', label: 'Undo', keys: k('undo'), icon: ArrowCounterClockwiseIcon, run: act(() => editor.undo()) },
      { id: 'redo', group: 'Actions', label: 'Redo', keys: k('redo'), icon: ArrowClockwiseIcon, run: act(() => editor.redo()) },
      {
        id: 'save',
        group: 'Actions',
        label: 'Save now',
        keys: k('save'),
        icon: FloppyDiskIcon,
        run: act(() => void editor.saveNow().then(() => editor.saveStatus === 'saved' && editor.notify('success', 'Saved.', 1500)))
      },
      { id: 'snapshot', group: 'Actions', label: 'Save version', icon: ClockCounterClockwiseIcon, keywords: 'snapshot history', run: act(() => void editor.createSnapshot()) },
      { id: 'navigator', group: 'Actions', label: editor.showNavigator ? 'Hide navigator' : 'Show navigator', keys: k('navigator'), icon: TreeStructureIcon, keywords: 'structure tree', run: act(() => (editor.showNavigator = !editor.showNavigator)) },
      {
        id: 'flow',
        group: 'Actions',
        label: editor.canvasViewMode === 'flow' ? 'Back to canvas' : 'Open route & flow map',
        icon: FlowArrowIcon,
        keywords: 'graph routes interactions',
        run: act(() => (editor.canvasViewMode = editor.canvasViewMode === 'flow' ? 'canvas' : 'flow'))
      },
      { id: 'fit', group: 'Actions', label: 'Zoom to fit', keys: k('zoom-fit'), icon: CornersOutIcon, run: act(() => editor.zoomToFit()) },
      { id: 'zoom100', group: 'Actions', label: 'Zoom to 100%', keys: k('zoom-100'), icon: CornersOutIcon, run: act(() => editor.setZoom(100)) },
      {
        id: 'theme',
        group: 'Actions',
        label: editor.studioTheme === 'light' ? 'Switch to dark interface' : 'Switch to light interface',
        icon: editor.studioTheme === 'light' ? MoonIcon : SunIcon,
        keywords: 'appearance mode',
        run: act(() => editor.toggleStudioTheme())
      },
      { id: 'panel-elements', group: 'Actions', label: 'Show elements', keys: k('panel-elements'), icon: SquaresFourIcon, keywords: 'panel add', run: act(() => showPanel('library')) },
      { id: 'panel-layers', group: 'Actions', label: 'Show layers', keys: k('panel-layers'), icon: StackIcon, keywords: 'panel tree', run: act(() => showPanel('layers')) },
      { id: 'panel-pages', group: 'Actions', label: 'Show pages', keys: k('panel-pages'), icon: FileIcon, keywords: 'panel routes', run: act(() => showPanel('pages')) },
      { id: 'panel-assets', group: 'Actions', label: 'Show assets', keys: k('panel-assets'), icon: ImageIcon, keywords: 'panel media images upload', run: act(() => showPanel('assets')) },
      { id: 'panel-styles', group: 'Actions', label: 'Show global styles', keys: k('panel-styles'), icon: PaletteIcon, keywords: 'panel tokens colors fonts theme', run: act(() => showPanel('tokens')) }
    );
    for (const vp of VIEWPORTS) {
      list.push({ id: `vp-${vp.key}`, group: 'Actions', label: `Viewport: ${vp.label}`, hint: `${vp.width}px`, icon: vp.icon, keywords: 'breakpoint device', run: act(() => editor.setBreakpoint(vp.key)) });
    }
    if (sel) {
      list.push(
        { id: 'dup', group: 'Actions', label: `Duplicate ${sel.name}`, keys: k('duplicate'), icon: CopyIcon, keywords: 'element copy', run: act(() => editor.duplicateSelectedNode()) },
        { id: 'save-sym', group: 'Actions', label: `Save ${sel.name} as template`, icon: BookmarkSimpleIcon, keywords: 'symbol reusable saved', run: act(() => editor.saveSelectedNodeAsSymbol()) },
        { id: 'del', group: 'Actions', label: `Delete ${sel.name}`, keys: k('delete'), icon: TrashIcon, keywords: 'remove element', run: act(() => editor.deleteSelectedNode()) }
      );
    }

    // Pages
    for (const p of editor.blueprint.pages) {
      list.push({
        id: `page-${p.id}`,
        group: 'Pages',
        label: pageDisplayName(p),
        hint: p.path,
        icon: p.path === '/' ? HouseSimpleIcon : FileIcon,
        keywords: `${p.title} go to page route`,
        run: act(() => {
          editor.setActivePage(p.id);
          editor.canvasViewMode = 'canvas';
        })
      });
    }

    // Insert
    for (const m of getAllManifests()) {
      list.push({
        id: `insert-${m.type}`,
        group: 'Insert element',
        label: componentLabel(m.displayName),
        hint: m.category,
        icon: CATEGORY_ICONS[m.category] ?? SquaresFourIcon,
        keywords: `insert add ${m.type} ${neutralize(m.description)}`,
        run: act(() => editor.insertComponent(m.type))
      });
    }

    // Layers (search only)
    if (q) {
      const nodes = [...flatten(editor.activeLayout?.rootNode), ...flatten(editor.activePage?.rootNode)];
      for (const n of nodes) {
        list.push({
          id: `layer-${n.id}`,
          group: 'Layers',
          label: n.name,
          hint: n.componentType.split('/')[1] ?? n.componentType,
          icon: SelectionIcon,
          keywords: `select ${n.componentType}`,
          run: act(() => editor.selectNode(n.id))
        });
      }
    }

    // Theme presets
    for (const [key, preset] of Object.entries(MD3_THEME_PRESETS)) {
      list.push({
        id: `theme-${key}`,
        group: 'Theme',
        label: `Apply ${themePresetName(key, preset.label)} theme`,
        icon: PaletteIcon,
        keywords: 'colors palette preset',
        run: act(() => editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { colors: { ...preset.colors } } }))
      });
    }
    return list;
  });

  const QUIET_ACTIONS = new Set(['new-page', 'export', 'library', 'projects', 'preflight', 'code', 'preview', 'shortcuts']);

  const results = $derived.by<Item[]>(() => {
    if (!open) return [];
    const out: Item[] = [];
    if (!q) {
      for (const g of ['Actions', 'Pages'] as Group[]) {
        const inGroup = items.filter((i) => i.group === g && (g !== 'Actions' || QUIET_ACTIONS.has(i.id)));
        out.push(...inGroup.slice(0, LIMITS[g]));
      }
      EXAMPLES.forEach((text, i) =>
        out.push({ id: `example-${i}`, group: 'Compose', label: text, icon: SparkleIcon, run: () => compose(text) })
      );
      return out;
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    const scored = items
      .map((item) => {
        const hay = `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''} ${item.group}`.toLowerCase();
        if (!tokens.every((t) => hay.includes(t))) return null;
        const label = item.label.toLowerCase();
        const score = label.startsWith(q) ? 3 : label.includes(q) ? 2 : 1;
        return { item, score };
      })
      .filter((x): x is { item: Item; score: number } => x !== null);
    if (looksLikePrompt) {
      out.push({ id: 'compose', group: 'Compose', label: 'Compose sections from description', hint: `“${query.trim()}”`, icon: SparkleIcon, run: () => compose(query) });
    }
    for (const g of GROUP_ORDER) {
      const inGroup = scored.filter((s) => s.item.group === g).sort((a, b) => b.score - a.score);
      out.push(...inGroup.slice(0, LIMITS[g]).map((s) => s.item));
    }
    if (!looksLikePrompt && out.length === 0) {
      out.push({ id: 'compose', group: 'Compose', label: 'Compose sections from description', hint: `“${query.trim()}”`, icon: SparkleIcon, run: () => compose(query) });
    }
    return out;
  });

  const activeIndex = $derived(Math.min(active, Math.max(0, results.length - 1)));
  const activeItem = $derived(results[activeIndex]);
  const composeActive = $derived(activeItem?.group === 'Compose');

  function move(delta: number) {
    if (results.length === 0) return;
    active = (activeIndex + delta + results.length) % results.length;
    queueMicrotask(() => listEl?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' }));
  }

  function onKeydown(event: KeyboardEvent) {
    const onButton = (event.target as HTMLElement).tagName === 'BUTTON';
    if (onButton && event.key !== 'Escape' && event.key !== 'Tab') return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      move(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'Home' && event.target === event.currentTarget) {
      active = 0;
    } else if (event.key === 'Enter') {
      event.preventDefault();
      activeItem?.run();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (query) {
        query = '';
        active = 0;
      } else close();
    } else {
      trapTab(event, event.currentTarget as HTMLElement);
    }
  }
</script>

{#if open}
  <div
    class="sx-dialog-scrim cp-scrim"
    role="presentation"
    onpointerdown={(e) => {
      if (e.target === e.currentTarget) close();
    }}
  >
    <div class="cp" role="dialog" aria-modal="true" aria-label="Command menu" tabindex="-1" onkeydown={onKeydown} {@attach focusScope({ initial: `#${uid}-input` })}>
      <div class="cp__search">
        {#if composeActive}<SparkleIcon size={18} />{:else}<MagnifyingGlassIcon size={18} />{/if}
        <input
          id="{uid}-input"
          class="cp__input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="{uid}-list"
          aria-activedescendant={activeItem ? `${uid}-opt-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autocomplete="off"
          spellcheck="false"
          placeholder="Search actions, pages and elements, or describe sections to add…"
          bind:value={query}
          oninput={() => (active = 0)}
        />
        <kbd class="sx-kbd">Esc</kbd>
      </div>

      <div class="cp__list" id="{uid}-list" role="listbox" aria-label="Results" {@attach (el) => ((listEl = el), () => (listEl = null))}>
        {#each results as item, i (item.id)}
          {@const Icon = item.icon}
          {#if i === 0 || results[i - 1].group !== item.group}
            <div class="cp__group" role="presentation">{item.group === 'Compose' && !q ? 'Compose from a description' : item.group}</div>
          {/if}
          <div
            id="{uid}-opt-{i}"
            data-index={i}
            role="option"
            tabindex="-1"
            aria-selected={i === activeIndex}
            class={['cp__item', i === activeIndex && 'cp__item--on', item.group === 'Compose' && 'cp__item--compose']}
            onpointermove={() => (active = i)}
            onclick={() => item.run()}
            onkeydown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              e.stopPropagation();
              item.run();
            }}
          >
            <span class="cp__icon"><Icon size={16} /></span>
            <span class="cp__label">{item.label}</span>
            {#if item.hint}<span class="cp__hint">{item.hint}</span>{/if}
            {#if item.keys}
              <span class="cp__keys">
                {#each item.keys as key, ki (ki)}<kbd class="sx-kbd">{key}</kbd>{/each}
              </span>
            {/if}
          </div>
        {:else}
          <div class="cp__empty">No results for “{query}”.</div>
        {/each}
      </div>

      <div class="cp__foot">
        {#if composeActive}
          <span class="cp__note" {@attach tooltip('Matches keywords such as hero, pricing, stats, FAQ, testimonials or contact')}>Local keyword composer — no AI model is called.</span>
          <label class="cp__toggle">
            <span>Apply suggested theme</span>
            <Toggle checked={applyTheme} label="Apply suggested theme" onchange={(v) => (applyTheme = v)} />
          </label>
        {:else}
          <span class="cp__nav"><kbd class="sx-kbd">↑</kbd><kbd class="sx-kbd">↓</kbd> Navigate</span>
          <span class="cp__nav"><kbd class="sx-kbd">↵</kbd> Run</span>
          <span class="cp__nav"><kbd class="sx-kbd">Esc</kbd> {query ? 'Clear' : 'Close'}</span>
        {/if}
      </div>
    </div>
  </div>
{/if}

{#if showNewPage}
  <NewPageDialog onclose={() => (showNewPage = false)} />
{/if}

<style>
  .cp-scrim {
    place-items: start center;
    padding-top: 12vh;
    background: color-mix(in srgb, var(--sx-scrim) 70%, transparent);
    animation: cp-fade 140ms var(--sx-ease);
  }
  .cp {
    display: flex;
    flex-direction: column;
    width: min(640px, calc(100vw - 32px));
    max-height: min(560px, 76vh);
    background: var(--sx-panel-raised);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-lg);
    box-shadow: var(--sx-shadow-lg);
    overflow: hidden;
    outline: none;
    animation: cp-pop 160ms var(--sx-ease);
  }
  .cp__search {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    height: 52px;
    padding: 0 14px 0 16px;
    color: var(--sx-text-3);
    border-bottom: 1px solid var(--sx-border);
  }
  .cp__input {
    flex: 1;
    min-width: 0;
    height: 44px;
    font-size: var(--sx-text-lg);
    color: var(--sx-text);
    background: transparent;
    border: 0;
    outline: none;
  }
  .cp__input::placeholder {
    color: var(--sx-text-3);
  }
  .cp__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 8px 8px;
    scroll-padding: 28px 0 8px;
  }
  .cp__group {
    padding: 10px 8px 4px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--sx-text-3);
  }
  .cp__item {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 36px;
    padding: 0 10px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text);
    cursor: pointer;
  }
  .cp__item--on {
    background: var(--sx-hover);
  }
  .cp__icon {
    display: grid;
    place-items: center;
    width: 20px;
    color: var(--sx-text-2);
    flex-shrink: 0;
  }
  .cp__item--compose .cp__icon {
    color: var(--sx-violet);
  }
  .cp__label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cp__hint {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cp__label + .cp__keys {
    margin-left: auto;
  }
  .cp__keys {
    display: inline-flex;
    gap: 3px;
    flex-shrink: 0;
  }
  .cp__empty {
    padding: 28px 12px;
    text-align: center;
    color: var(--sx-text-2);
  }
  .cp__foot {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
    min-height: 40px;
    padding: 6px 14px 6px 16px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    border-top: 1px solid var(--sx-border);
    background: var(--sx-subtle);
  }
  .cp__nav {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .cp__note {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
  }
  .cp__toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    color: var(--sx-text-2);
    cursor: pointer;
  }
  @keyframes cp-fade {
    from {
      opacity: 0;
    }
  }
  @keyframes cp-pop {
    from {
      opacity: 0;
      transform: scale(0.98) translateY(-4px);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .cp-scrim,
    .cp {
      animation: none;
    }
  }
</style>
