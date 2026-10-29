<script lang="ts">
  import type { BreakpointKey } from '@app-viz/schema';
  import { editor } from '../state/editor.svelte.js';
  import { pageDisplayName } from '../state/page-name.js';
  import IconButton from '../ui/IconButton.svelte';
  import Popover from '../ui/Popover.svelte';
  import { tooltip } from '../ui/tooltip.js';
  import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import MinusIcon from 'phosphor-svelte/lib/MinusIcon';
  import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
  import DesktopIcon from 'phosphor-svelte/lib/DesktopIcon';
  import DeviceTabletIcon from 'phosphor-svelte/lib/DeviceTabletIcon';
  import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwiseIcon';
  import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
  import ShieldWarningIcon from 'phosphor-svelte/lib/ShieldWarningIcon';
  import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
  import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
  import MoonIcon from 'phosphor-svelte/lib/MoonIcon';
  import SunIcon from 'phosphor-svelte/lib/SunIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
  import ExportIcon from 'phosphor-svelte/lib/ExportIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';
  import FolderOpenIcon from 'phosphor-svelte/lib/FolderOpenIcon';
  import FolderSimplePlusIcon from 'phosphor-svelte/lib/FolderSimplePlusIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import KeyboardIcon from 'phosphor-svelte/lib/KeyboardIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
  import GearSixIcon from 'phosphor-svelte/lib/GearSixIcon';

  const devices: { key: BreakpointKey; label: string; width: number; icon: typeof DesktopIcon }[] = [
    { key: 'wide', label: 'Wide', width: 1440, icon: MonitorIcon },
    { key: 'desktop', label: 'Desktop', width: 1280, icon: DesktopIcon },
    { key: 'tablet', label: 'Tablet', width: 768, icon: DeviceTabletIcon },
    { key: 'mobile', label: 'Mobile', width: 375, icon: DeviceMobileIcon }
  ];

  let menuAnchor = $state<HTMLElement | null>(null);
  let pageAnchor = $state<HTMLElement | null>(null);
  let zoomAnchor = $state<HTMLElement | null>(null);
  let exportAnchor = $state<HTMLElement | null>(null);
  let historyAnchor = $state<HTMLElement | null>(null);
  let openMenu = $state<'main' | 'page' | 'zoom' | 'export' | 'history' | null>(null);

  /** Newest first, as shown in the history panel. */
  const undoSteps = $derived([...editor.undoLabels].reverse());
  /** Furthest redo step first, so the list reads top (future) → bottom (oldest). */
  const redoSteps = $derived([...editor.redoLabels].reverse());

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? '⌘' : 'Ctrl+';

  const zoomLabel = $derived(`${Math.round(editor.zoomMode === 'fit' ? editor.effectiveZoom : editor.zoom)}%`);
  const issueCount = $derived(editor.preflightReport.issues.length);
  const preflightClean = $derived(editor.preflightReport.valid && issueCount === 0);

  const save = $derived.by(() => {
    switch (editor.saveStatus) {
      case 'saving':
        return { tone: 'busy', text: 'Saving…' };
      case 'dirty':
        return { tone: 'busy', text: 'Unsaved' };
      case 'error':
        return { tone: 'error', text: 'Not saved' };
      case 'saved':
        return { tone: 'ok', text: 'Saved' };
      default:
        return { tone: 'ok', text: editor.ready ? 'Saved' : 'Loading…' };
    }
  });

  const saveTitle = $derived(
    editor.saveStatus === 'error'
      ? `Save failed: ${editor.saveError ?? 'unknown error'} — click to retry`
      : editor.lastSavedAt
        ? `Autosaved to this browser at ${new Date(editor.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : 'Autosaved to this browser'
  );

  function anchorTo(setter: (el: HTMLElement) => void) {
    return (el: HTMLElement) => {
      setter(el);
    };
  }

  function toggle(menu: NonNullable<typeof openMenu>) {
    openMenu = openMenu === menu ? null : menu;
  }

  function run(fn: () => void) {
    openMenu = null;
    fn();
  }

</script>

<header class="tb">
  <!-- Left: workspace menu, project, page -->
  <div class="tb__group tb__group--left">
    <button
      type="button"
      class="tb__logo"
      aria-label="Studio menu"
      aria-haspopup="menu"
      aria-expanded={openMenu === 'main'}
      {@attach anchorTo((el) => (menuAnchor = el))}
      onclick={() => toggle('main')}
    >
      <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M5 5h9v9H5zM18 5h9v9h-9zM5 18h9v9H5z" fill="currentColor" />
        <path d="M18 18h9v9h-9z" fill="var(--sx-accent)" />
      </svg>
      <CaretDownIcon size={10} weight="bold" />
    </button>

    <div class="tb__project">
      <input
        class="tb__project-name"
        type="text"
        aria-label="Project name"
        spellcheck="false"
        value={editor.blueprint.meta.name}
        onchange={(e) => editor.renameProject((e.currentTarget as HTMLInputElement).value)}
        onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      />
      <button
        type="button"
        class={['tb__save', `tb__save--${save.tone}`]}
        aria-live="polite"
        {@attach tooltip(saveTitle)}
        onclick={() => (editor.saveStatus === 'error' ? void editor.saveNow() : (editor.showProjectLibrary = true))}
      >
        <span class="tb__save-dot"></span>{save.text}
      </button>
    </div>

    <span class="sx-divider-v"></span>

    <button
      type="button"
      class="tb__page"
      aria-haspopup="menu"
      aria-expanded={openMenu === 'page'}
      {@attach anchorTo((el) => (pageAnchor = el))}
      {@attach tooltip('Switch page')}
      onclick={() => toggle('page')}
    >
      {#if editor.activePage?.path === '/'}
        <HouseSimpleIcon size={14} />
      {:else}
        <FileIcon size={14} />
      {/if}
      <span class="tb__page-title">{editor.activePage ? pageDisplayName(editor.activePage) : 'No page'}</span>
      <span class="tb__page-path">{editor.activePage?.path}</span>
      <CaretDownIcon size={10} weight="bold" />
    </button>
  </div>

  <!-- Center: devices, zoom, view -->
  <div class="tb__group tb__group--center">
    <div class="sx-seg" role="group" aria-label="Canvas device">
      {#each devices as d (d.key)}
        {@const Icon = d.icon}
        <button
          type="button"
          class="sx-seg__item tb__device"
          aria-pressed={editor.activeBreakpoint === d.key}
          aria-label="{d.label} {d.width}px"
          {@attach tooltip(`${d.label} · ${d.width}px`)}
          onclick={() => editor.setBreakpoint(d.key)}
        >
          <Icon size={15} />
        </button>
      {/each}
    </div>

    <div class="tb__zoom">
      <IconButton label="Zoom out" icon={MinusIcon} iconSize={12} size="sm" kbd="{mod}−" onclick={() => editor.stepZoom(-1)} />
      <button
        type="button"
        class="tb__zoom-value"
        aria-label="Zoom options, current {zoomLabel}"
        aria-haspopup="menu"
        aria-expanded={openMenu === 'zoom'}
        {@attach anchorTo((el) => (zoomAnchor = el))}
        onclick={() => toggle('zoom')}
      >
        {zoomLabel}
      </button>
      <IconButton label="Zoom in" icon={PlusIcon} iconSize={12} size="sm" kbd="{mod}+" onclick={() => editor.stepZoom(1)} />
    </div>

    <IconButton
      label={editor.canvasViewMode === 'flow' ? 'Back to canvas' : 'Route & flow map'}
      icon={TreeStructureIcon}
      active={editor.canvasViewMode === 'flow'}
      aria-pressed={editor.canvasViewMode === 'flow'}
      onclick={() => (editor.canvasViewMode = editor.canvasViewMode === 'flow' ? 'canvas' : 'flow')}
    />
  </div>

  <!-- Right: history, checks, tools, preview, export -->
  <div class="tb__group tb__group--right">
    <IconButton label="Undo" icon={ArrowCounterClockwiseIcon} kbd="{mod}Z" disabled={!editor.canUndo} onclick={() => editor.undo()} />
    <IconButton label="Redo" icon={ArrowClockwiseIcon} kbd={isMac ? '⇧⌘Z' : 'Ctrl+Y'} disabled={!editor.canRedo} onclick={() => editor.redo()} />
    <span class="tb__history-anchor" {@attach anchorTo((el) => (historyAnchor = el))}>
      <IconButton
        label="History"
        icon={ClockCounterClockwiseIcon}
        active={openMenu === 'history'}
        aria-haspopup="menu"
        aria-expanded={openMenu === 'history'}
        onclick={() => toggle('history')}
      />
    </span>

    <span class="sx-divider-v"></span>

    <button
      type="button"
      class={['tb__check', preflightClean ? 'tb__check--ok' : 'tb__check--warn']}
      aria-label={preflightClean ? 'Export checks passed' : `${issueCount} export issues`}
      {@attach tooltip(preflightClean ? `Export checks passed · ${editor.preflightReport.score}%` : `${issueCount} export ${issueCount === 1 ? 'issue' : 'issues'} — review before export`)}
      onclick={() => (editor.showPreflight = true)}
    >
      {#if preflightClean}
        <ShieldCheckIcon size={15} />
      {:else}
        <ShieldWarningIcon size={15} />
        <span>{issueCount}</span>
      {/if}
    </button>
    <IconButton label="View generated code" icon={CodeIcon} onclick={() => (editor.showCodeView = true)} />
    <IconButton label="Command menu & compose" icon={SparkleIcon} kbd="{mod}K" onclick={() => (editor.showCommandPalette = true)} />
    <IconButton
      label={editor.studioTheme === 'light' ? 'Dark interface' : 'Light interface'}
      icon={editor.studioTheme === 'light' ? MoonIcon : SunIcon}
      onclick={() => editor.toggleStudioTheme()}
    />

    <span class="sx-divider-v"></span>

    <button
      type="button"
      class={['sx-btn', editor.isInteractiveMode ? 'sx-btn--primary' : '']}
      aria-pressed={editor.isInteractiveMode}
      {@attach tooltip(editor.isInteractiveMode ? 'Return to the editor' : 'Use the site like a visitor', { kbd: 'P' })}
      onclick={() => editor.toggleInteractiveMode()}
    >
      {#if editor.isInteractiveMode}
        <PencilSimpleIcon size={14} />Edit
      {:else}
        <PlayIcon size={13} weight="fill" />Preview
      {/if}
    </button>

    <div class="tb__export">
      <button
        type="button"
        class="sx-btn sx-btn--primary tb__export-main"
        {@attach tooltip('Export a build spec for Claude Code', { kbd: `${mod}E` })}
        onclick={() => (editor.showExportDialog = true)}
      >
        <ExportIcon size={14} />Export
      </button>
      <button
        type="button"
        class="sx-btn sx-btn--primary tb__export-more"
        aria-label="More export options"
        aria-haspopup="menu"
        aria-expanded={openMenu === 'export'}
        {@attach anchorTo((el) => (exportAnchor = el))}
        onclick={() => toggle('export')}
      >
        <CaretDownIcon size={11} weight="bold" />
      </button>
    </div>
  </div>
</header>

<!-- Studio menu -->
<Popover open={openMenu === 'main'} anchor={menuAnchor} onclose={() => (openMenu = null)} width={248} label="Studio menu">
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => (editor.showProjectLibrary = true))}>
    <FolderOpenIcon size={16} /><span class="sx-menu-item__label">Projects…</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => void editor.newProject('blank'))}>
    <FolderSimplePlusIcon size={16} /><span class="sx-menu-item__label">New blank project</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => void editor.duplicateProject())}>
    <CopyIcon size={16} /><span class="sx-menu-item__label">Duplicate project</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => editor.exportProjectFile())}>
    <DownloadSimpleIcon size={16} /><span class="sx-menu-item__label">Download project file</span>
  </button>
  <div class="sx-menu-sep"></div>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => void editor.createSnapshot())}>
    <ClockCounterClockwiseIcon size={16} /><span class="sx-menu-item__label">Save version</span>
    <span class="sx-menu-item__hint">{editor.snapshots.length}</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => editor.openLeftTab('tokens'))}>
    <GearSixIcon size={16} /><span class="sx-menu-item__label">Global styles</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => (editor.showShortcuts = true))}>
    <KeyboardIcon size={16} /><span class="sx-menu-item__label">Keyboard shortcuts</span>
    <span class="sx-menu-item__hint">?</span>
  </button>
</Popover>

<!-- Page switcher -->
<Popover open={openMenu === 'page'} anchor={pageAnchor} onclose={() => (openMenu = null)} width={300} label="Pages">
  <div class="sx-menu-heading">Pages</div>
  {#each editor.blueprint.pages as page (page.id)}
    <button
      type="button"
      role="menuitemradio"
      aria-checked={page.id === editor.activePageId}
      class="sx-menu-item"
      onclick={() => run(() => editor.setActivePage(page.id))}
    >
      {#if page.path === '/'}<HouseSimpleIcon size={16} />{:else}<FileIcon size={16} />{/if}
      <span class="sx-menu-item__label">{pageDisplayName(page)}</span>
      <span class="sx-menu-item__hint tb__mono">{page.path}</span>
      {#if page.id === editor.activePageId}<CheckIcon size={14} />{/if}
    </button>
  {/each}
  <div class="sx-menu-sep"></div>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => editor.openLeftTab('pages'))}>
    <PlusIcon size={16} /><span class="sx-menu-item__label">Manage pages…</span>
  </button>
</Popover>

<!-- Zoom -->
<Popover open={openMenu === 'zoom'} anchor={zoomAnchor} onclose={() => (openMenu = null)} width={180} placement="bottom" label="Zoom">
  <button type="button" role="menuitemradio" aria-checked={editor.zoomMode === 'fit'} class="sx-menu-item" onclick={() => run(() => editor.zoomToFit())}>
    <span class="sx-menu-item__label">Zoom to fit</span><span class="sx-menu-item__hint">{isMac ? '⇧1' : 'Shift+1'}</span>
  </button>
  <div class="sx-menu-sep"></div>
  {#each [50, 75, 100, 125, 150] as z (z)}
    <button
      type="button"
      role="menuitemradio"
      aria-checked={editor.zoomMode === 'manual' && editor.zoom === z}
      class="sx-menu-item"
      onclick={() => run(() => editor.setZoom(z))}
    >
      <span class="sx-menu-item__label">{z}%</span>
      {#if z === 100}<span class="sx-menu-item__hint">{isMac ? '⇧0' : 'Shift+0'}</span>{/if}
    </button>
  {/each}
</Popover>

<!-- History -->
<Popover open={openMenu === 'history'} anchor={historyAnchor} onclose={() => (openMenu = null)} width={320} placement="bottom-end" label="History">
  <div class="sx-menu-heading tb__hist-head">
    <span>History</span>
    <span class="tb__hist-count">{editor.undoCount} {editor.undoCount === 1 ? 'step' : 'steps'}</span>
  </div>
  <div class="tb__hist-list">
    {#each redoSteps as label, i (`r${i}`)}
      {@const offset = redoSteps.length - i}
      <button type="button" role="menuitem" class="sx-menu-item tb__hist-item tb__hist-item--future" onclick={() => run(() => editor.travelHistory(offset))}>
        <span class="tb__hist-dot"></span><span class="sx-menu-item__label">{label}</span><span class="sx-menu-item__hint">Redo</span>
      </button>
    {/each}
    {#each undoSteps as label, i (`u${i}`)}
      <button
        type="button"
        role="menuitem"
        class={['sx-menu-item tb__hist-item', i === 0 && 'tb__hist-item--current']}
        onclick={() => run(() => editor.travelHistory(-i))}
      >
        <span class="tb__hist-dot"></span><span class="sx-menu-item__label">{label}</span>
        {#if i === 0}<span class="sx-menu-item__hint">Current</span>{/if}
      </button>
    {/each}
    <button
      type="button"
      role="menuitem"
      class={['sx-menu-item tb__hist-item', undoSteps.length === 0 && 'tb__hist-item--current']}
      onclick={() => run(() => editor.travelHistory(-undoSteps.length))}
    >
      <span class="tb__hist-dot"></span><span class="sx-menu-item__label">Opened project</span>
      {#if undoSteps.length === 0}<span class="sx-menu-item__hint">Current</span>{/if}
    </button>
  </div>
  <div class="sx-menu-sep"></div>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => void editor.createSnapshot())}>
    <ClockCounterClockwiseIcon size={16} /><span class="sx-menu-item__label">Save named version</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => (editor.showProjectLibrary = true))}>
    <FolderOpenIcon size={16} /><span class="sx-menu-item__label">Versions & projects…</span>
    <span class="sx-menu-item__hint">{editor.snapshots.length}</span>
  </button>
</Popover>

<!-- Export options -->
<Popover open={openMenu === 'export'} anchor={exportAnchor} onclose={() => (openMenu = null)} width={280} placement="bottom-end" label="Export options">
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => (editor.showExportDialog = true))}>
    <ExportIcon size={16} /><span class="sx-menu-item__label">Build spec for Claude Code…</span><span class="sx-menu-item__hint">{mod}E</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => void editor.exportHandoffPackage())}>
    <DownloadSimpleIcon size={16} /><span class="sx-menu-item__label">SvelteKit app (.zip)</span>
  </button>
  <button type="button" role="menuitem" class="sx-menu-item" onclick={() => run(() => editor.downloadBlueprintJson())}>
    <CodeIcon size={16} /><span class="sx-menu-item__label">Blueprint JSON</span>
  </button>
</Popover>

<style>
  .tb {
    position: relative;
    z-index: 40;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    height: var(--sx-topbar-h);
    padding: 0 10px 0 8px;
    background: var(--sx-panel);
    border-bottom: 1px solid var(--sx-border);
    user-select: none;
  }
  .tb__group {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .tb__group--center {
    gap: 10px;
  }
  .tb__group--right {
    justify-content: flex-end;
  }
  .tb__logo {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 32px;
    padding: 0 6px 0 8px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text);
  }
  .tb__logo:hover,
  .tb__logo[aria-expanded='true'] {
    background: var(--sx-hover);
  }
  .tb__logo :global(svg:last-child) {
    color: var(--sx-text-3);
  }
  .tb__project {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    margin-left: 2px;
  }
  .tb__project-name {
    width: 180px;
    max-width: 22vw;
    height: 20px;
    padding: 0 4px;
    margin-left: -4px;
    font-size: var(--sx-text-md);
    font-weight: 600;
    letter-spacing: -0.005em;
    color: var(--sx-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--sx-radius-xs);
    outline: none;
    text-overflow: ellipsis;
  }
  .tb__project-name:hover {
    border-color: var(--sx-border);
  }
  .tb__project-name:focus {
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
    background: var(--sx-panel);
  }
  .tb__save {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    width: fit-content;
    height: 14px;
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
  .tb__save:hover {
    color: var(--sx-text-2);
  }
  .tb__save-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sx-success);
  }
  .tb__save--busy .tb__save-dot {
    background: var(--sx-warning);
    animation: tb-pulse 1s ease-in-out infinite;
  }
  .tb__save--error {
    color: var(--sx-danger);
    font-weight: 600;
  }
  .tb__save--error .tb__save-dot {
    background: var(--sx-danger);
  }
  @keyframes tb-pulse {
    50% {
      opacity: 0.35;
    }
  }
  .tb__page {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 280px;
    height: 30px;
    padding: 0 8px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text);
    font-weight: 500;
  }
  .tb__page:hover,
  .tb__page[aria-expanded='true'] {
    background: var(--sx-hover);
  }
  .tb__page > :global(svg:first-child) {
    color: var(--sx-text-2);
    flex-shrink: 0;
  }
  .tb__page > :global(svg:last-child) {
    color: var(--sx-text-3);
    flex-shrink: 0;
  }
  .tb__page-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tb__page-path,
  .tb__mono {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    white-space: nowrap;
  }
  .tb__device {
    width: 32px;
    padding: 0;
  }
  .tb__zoom {
    display: inline-flex;
    align-items: center;
    gap: 1px;
  }
  .tb__zoom-value {
    min-width: 46px;
    height: 24px;
    padding: 0 4px;
    border-radius: var(--sx-radius-xs);
    font-size: var(--sx-text-sm);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--sx-text);
  }
  .tb__zoom-value:hover,
  .tb__zoom-value[aria-expanded='true'] {
    background: var(--sx-hover);
  }
  .tb__check {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 28px;
    min-width: 28px;
    padding: 0 6px;
    border-radius: var(--sx-radius-sm);
    font-size: var(--sx-text-sm);
    font-weight: 600;
    justify-content: center;
  }
  .tb__check--ok {
    color: var(--sx-success);
  }
  .tb__check--warn {
    color: var(--sx-warning);
    background: var(--sx-warning-soft);
  }
  .tb__check:hover {
    filter: brightness(0.95);
    background: var(--sx-hover);
  }
  .tb__history-anchor {
    display: inline-flex;
  }
  .tb__hist-head {
    display: flex;
    justify-content: space-between;
  }
  .tb__hist-count {
    text-transform: none;
    letter-spacing: 0;
    font-weight: 500;
  }
  .tb__hist-list {
    max-height: 360px;
    overflow-y: auto;
  }
  .tb__hist-item {
    position: relative;
  }
  .tb__hist-dot {
    width: 7px;
    height: 7px;
    margin: 0 4px 0 3px;
    border-radius: 50%;
    border: 1.5px solid var(--sx-text-3);
    flex-shrink: 0;
  }
  .tb__hist-item--current {
    color: var(--sx-accent-text);
    font-weight: 500;
  }
  .tb__hist-item--current .tb__hist-dot {
    border-color: var(--sx-accent);
    background: var(--sx-accent);
  }
  .tb__hist-item--future {
    color: var(--sx-text-3);
  }
  .tb__export {
    display: inline-flex;
    margin-left: 2px;
  }
  .tb__export-main {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
  .tb__export-more {
    width: 26px;
    padding: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    border-left: 1px solid rgba(255, 255, 255, 0.22);
  }
  @media (max-width: 1280px) {
    .tb__page-path {
      display: none;
    }
  }
</style>
