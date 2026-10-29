<script lang="ts">
  import { editor } from '#lib/state/editor.svelte.js';
  import { MAX_SNAPSHOTS_PER_PROJECT } from '#lib/persistence/project-store.js';
  import Dialog from './ui/Dialog.svelte';
  import IconButton from '#lib/ui/IconButton.svelte';
  import Popover from '#lib/ui/Popover.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import InlineConfirm from './dialogs/InlineConfirm.svelte';
  import { absoluteTime, pluralize, relativeTime } from './dialogs/format.js';
  import FolderOpenIcon from 'phosphor-svelte/lib/FolderOpenIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import UploadSimpleIcon from 'phosphor-svelte/lib/UploadSimpleIcon';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwiseIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import FileDashedIcon from 'phosphor-svelte/lib/FileDashedIcon';
  import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';

  const uid = $props.id();
  const open = $derived(editor.showProjectLibrary);

  let tab = $state<'projects' | 'versions'>('projects');
  let query = $state('');
  let pendingDelete = $state<string | null>(null);
  let pendingSnapshotDelete = $state<string | null>(null);
  let versionLabel = $state('');
  let importError = $state('');
  let newMenuOpen = $state(false);
  let newMenuAnchor = $state<HTMLElement | null>(null);
  let newName = $state('');
  let busy = $state(false);
  let now = $state(Date.now());
  let fileInput: HTMLInputElement | null = null;

  const currentId = $derived(editor.blueprint.meta.id);
  const current = $derived(editor.projects.find((p) => p.id === currentId));
  const visible = $derived.by(() => {
    const q = query.trim().toLowerCase();
    const list = [...editor.projects].sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : b.updatedAt.localeCompare(a.updatedAt)));
    return q ? list.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)) : list;
  });
  const saveText = $derived(
    editor.saveStatus === 'saving'
      ? 'Saving…'
      : editor.saveStatus === 'dirty'
        ? 'Unsaved changes'
        : editor.saveStatus === 'error'
          ? 'Not saved'
          : editor.lastSavedAt
            ? `Saved ${relativeTime(editor.lastSavedAt, now)}`
            : 'Saved'
  );

  function close() {
    editor.showProjectLibrary = false;
    pendingDelete = null;
    pendingSnapshotDelete = null;
    importError = '';
  }

  async function run(task: () => Promise<unknown>) {
    if (busy) return;
    busy = true;
    try {
      await task();
    } catch (e) {
      editor.notify('error', (e as Error).message || 'Something went wrong.');
    } finally {
      busy = false;
    }
  }

  function create(template: 'blank' | 'acme-saas') {
    newMenuOpen = false;
    void run(async () => {
      await editor.newProject(template, newName);
      newName = '';
      close();
    });
  }

  function openProject(id: string) {
    void run(async () => {
      if (await editor.openProject(id)) close();
    });
  }

  async function handleImport(event: Event) {
    importError = '';
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      importError = `“${file.name}” is larger than 50 MB.`;
      return;
    }
    await run(async () => {
      const res = await editor.importProjectFile(await file.text());
      if (!res.ok) importError = res.error ?? 'The file could not be imported.';
      else close();
    });
  }

  function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '·';
  }

  /** Keeps relative timestamps fresh while the dialog is open. */
  function ticker() {
    now = Date.now();
    const id = setInterval(() => (now = Date.now()), 30_000);
    return () => clearInterval(id);
  }
</script>

<Dialog
  {open}
  title="Projects"
  subtitle={editor.storageDurable
    ? 'Projects autosave to this browser. Export a project file to back up or move work between machines.'
    : 'Browser storage is unavailable in this session.'}
  size="xl"
  height="min(640px, calc(100vh - 48px))"
  icon={FolderOpenIcon}
  flush
  onclose={close}
>
  {#snippet headerActions()}
    <button type="button" class="sx-btn" onclick={() => fileInput?.click()} disabled={busy}>
      <UploadSimpleIcon size={14} /> Import
    </button>
    <button
      type="button"
      class="sx-btn sx-btn--primary"
      aria-haspopup="dialog"
      aria-expanded={newMenuOpen}
      {@attach (el) => {
        newMenuAnchor = el;
      }}
      onclick={() => (newMenuOpen = !newMenuOpen)}
    >
      <PlusIcon size={14} weight="bold" /> New project
    </button>
  {/snippet}

  <input
    class="pl__file"
    type="file"
    accept=".json,application/json"
    tabindex="-1"
    aria-hidden="true"
    {@attach (el) => {
      fileInput = el;
      return () => (fileInput = null);
    }}
    onchange={handleImport}
  />

  <div class="pl" {@attach ticker}>
    <div class="pl__bar">
      <div class="pl__tabs" role="tablist" aria-label="Library sections">
        <button type="button" role="tab" class="sx-tab pl__tab" aria-selected={tab === 'projects'} onclick={() => (tab = 'projects')}>
          Projects <span class="pl__count">{editor.projects.length}</span>
        </button>
        <button type="button" role="tab" class="sx-tab pl__tab" aria-selected={tab === 'versions'} onclick={() => (tab = 'versions')}>
          Version history <span class="pl__count">{editor.snapshots.length}</span>
        </button>
      </div>
      {#if tab === 'projects'}
        <label class="sx-search pl__search">
          <MagnifyingGlassIcon size={14} />
          <input class="sx-input" type="search" placeholder="Search projects" aria-label="Search projects" data-autofocus bind:value={query} />
        </label>
      {/if}
    </div>

    <div class="pl__body">
      {#if !editor.storageDurable}
        <div class="banner banner--warning" role="alert">
          <WarningIcon size={16} weight="fill" />
          <span>Changes in this session will not persist after you close the tab. Export a project file to keep your work.</span>
          <button type="button" class="sx-btn sx-btn--sm" onclick={() => editor.exportProjectFile()}>Export file</button>
        </div>
      {/if}
      {#if importError}
        <div class="banner banner--danger" role="alert">
          <WarningCircleIcon size={16} weight="fill" />
          <span>{importError}</span>
          <IconButton size="sm" label="Dismiss" icon={XIcon} iconSize={12} onclick={() => (importError = '')} />
        </div>
      {/if}

      {#if tab === 'projects'}
        <section class="current" aria-label="Open project">
          <span class="avatar avatar--lg">{initials(editor.blueprint.meta.name)}</span>
          <div class="current__main">
            <label class="sr-only" for="{uid}-name">Project name</label>
            <input
              id="{uid}-name"
              class="current__name"
              value={editor.blueprint.meta.name}
              spellcheck="false"
              onchange={(e) => editor.renameProject((e.currentTarget as HTMLInputElement).value)}
              onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
            />
            <span class="current__meta">
              <span class={['dot', `dot--${editor.saveStatus}`]}></span>
              {saveText} · {pluralize(editor.blueprint.pages.length, 'page')} · {pluralize(current?.nodeCount ?? 0, 'element')}
            </span>
          </div>
          <div class="current__actions">
            <button type="button" class="sx-btn" disabled={busy} onclick={() => run(() => editor.duplicateProject())}>
              <CopyIcon size={14} /> Duplicate
            </button>
            <button type="button" class="sx-btn" onclick={() => editor.exportProjectFile()} {@attach tooltip('Download a portable .appviz.json file')}>
              <DownloadSimpleIcon size={14} /> Export file
            </button>
          </div>
        </section>

        <div class="table" role="table" aria-label="All projects">
          <div class="table__head" role="row">
            <span role="columnheader">Name</span>
            <span role="columnheader" class="num">Pages</span>
            <span role="columnheader" class="num">Elements</span>
            <span role="columnheader">Last saved</span>
            <span role="columnheader" class="sr-only">Actions</span>
          </div>
          {#each visible as p (p.id)}
            {@const isOpen = p.id === currentId}
            {@const edited = isOpen && editor.lastSavedAt ? editor.lastSavedAt : p.updatedAt}
            <div class={['table__row', isOpen && 'table__row--open', pendingDelete === p.id && 'table__row--danger']} role="row">
              <span class="cell-name" role="cell">
                <span class="avatar">{initials(p.name)}</span>
                <span class="cell-name__text">{p.name}</span>
                {#if isOpen}<span class="sx-badge sx-badge--accent">Open</span>{/if}
              </span>
              <span role="cell" class="num">{p.pageCount}</span>
              <span role="cell" class="num">{p.nodeCount}</span>
              <span role="cell" class="muted" title={absoluteTime(edited)}>{relativeTime(edited, now)}</span>
              <span role="cell" class="cell-actions">
                {#if pendingDelete === p.id}
                  <InlineConfirm
                    message="Delete permanently?"
                    compact
                    onconfirm={async () => {
                      await run(() => editor.deleteProject(p.id));
                      pendingDelete = null;
                    }}
                    oncancel={() => (pendingDelete = null)}
                  />
                {:else}
                  {#if !isOpen}
                    <button type="button" class="sx-btn sx-btn--sm" disabled={busy} onclick={() => openProject(p.id)}>Open</button>
                  {/if}
                  <IconButton size="sm" label="Duplicate" icon={CopyIcon} iconSize={14} disabled={busy} onclick={() => run(() => editor.duplicateProject(p.id))} />
                  <IconButton size="sm" tone="danger" label="Delete project" icon={TrashIcon} iconSize={14} onclick={() => (pendingDelete = p.id)} />
                {/if}
              </span>
            </div>
          {:else}
            <div class="sx-empty">
              <span class="sx-empty__icon"><FileDashedIcon size={20} /></span>
              {#if query.trim()}
                <span class="sx-empty__title">No projects match “{query}”</span>
              {:else}
                <span class="sx-empty__title">No saved projects yet</span>
                <span>Your work autosaves here as soon as you edit.</span>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <form
          class="snap-form"
          onsubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await editor.createSnapshot(versionLabel);
              versionLabel = '';
            });
          }}
        >
          <input class="sx-input" placeholder="Version name, e.g. Before pricing redesign" aria-label="Version name" data-autofocus bind:value={versionLabel} />
          <button type="submit" class="sx-btn sx-btn--primary" disabled={busy}>Save version</button>
        </form>
        <p class="sx-help snap-help">Snapshots of “{editor.blueprint.meta.name}”. Restoring is undoable with ⌘Z; the newest {MAX_SNAPSHOTS_PER_PROJECT} versions are kept.</p>

        <ul class="snaps">
          {#each editor.snapshots as snap (snap.id)}
            <li class={['snap', pendingSnapshotDelete === snap.id && 'snap--danger']}>
              <span class="snap__icon"><ClockCounterClockwiseIcon size={15} /></span>
              <span class="snap__main">
                <span class="snap__label">{snap.label}</span>
                <span class="snap__meta" title={absoluteTime(snap.createdAt)}>{relativeTime(snap.createdAt, now)} · {pluralize(snap.blueprint.pages.length, 'page')}</span>
              </span>
              <span class="snap__actions">
                {#if pendingSnapshotDelete === snap.id}
                  <InlineConfirm
                    message="Delete this version?"
                    compact
                    onconfirm={async () => {
                      await run(() => editor.deleteSnapshot(snap.id));
                      pendingSnapshotDelete = null;
                    }}
                    oncancel={() => (pendingSnapshotDelete = null)}
                  />
                {:else}
                  <button
                    type="button"
                    class="sx-btn sx-btn--sm"
                    onclick={() => {
                      editor.restoreSnapshot(snap.id);
                      close();
                    }}>Restore</button
                  >
                  <IconButton size="sm" tone="danger" label="Delete version" icon={TrashIcon} iconSize={14} onclick={() => (pendingSnapshotDelete = snap.id)} />
                {/if}
              </span>
            </li>
          {:else}
            <li class="sx-empty">
              <span class="sx-empty__icon"><ClockCounterClockwiseIcon size={20} /></span>
              <span class="sx-empty__title">No saved versions</span>
              <span>Save a version before a big change so you can return to it later.</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</Dialog>

<Popover open={newMenuOpen} anchor={newMenuAnchor} onclose={() => (newMenuOpen = false)} placement="bottom-end" width={280} role="dialog" label="New project">
  <form
    class="newp"
    onsubmit={(e) => {
      e.preventDefault();
      create('blank');
    }}
  >
    <label class="sx-label" for="{uid}-new">Project name</label>
    <input
      id="{uid}-new"
      class="sx-input"
      placeholder="Untitled App"
      bind:value={newName}
      {@attach (el) => {
        requestAnimationFrame(() => el.focus());
      }}
    />
    <div class="newp__options">
      <button type="submit" class="newp__opt">
        <span class="newp__icon"><FileDashedIcon size={16} /></span>
        <span class="newp__text"><span class="newp__title">Blank project</span><span class="newp__sub">One empty home page</span></span>
      </button>
      <button type="button" class="newp__opt" onclick={() => create('acme-saas')}>
        <span class="newp__icon"><BrowserIcon size={16} /></span>
        <span class="newp__text"><span class="newp__title">Sample SaaS project</span><span class="newp__sub">Landing, features, pricing and dashboard</span></span>
      </button>
    </div>
  </form>
</Popover>

<style>
  .pl__file {
    display: none;
  }
  .pl {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .pl__bar {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
    padding-right: 16px;
    border-bottom: 1px solid var(--sx-border);
  }
  .pl__tabs {
    display: flex;
    gap: 4px;
    padding: 0 12px;
    flex: 1;
  }
  .pl__tab {
    flex: none;
    padding: 0 8px;
  }
  .pl__count {
    font-size: var(--sx-text-xs);
    font-weight: 600;
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
  }
  .pl__search {
    width: 240px;
  }
  .pl__body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 16px 20px 20px;
  }
  .banner {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    padding: 8px 8px 8px 12px;
    font-size: var(--sx-text-sm);
    border-radius: var(--sx-radius-md);
  }
  .banner span {
    flex: 1;
  }
  .banner--warning {
    color: var(--sx-text);
    background: var(--sx-warning-soft);
    border: 1px solid color-mix(in srgb, var(--sx-warning) 30%, transparent);
  }
  .banner--warning > :global(svg) {
    color: var(--sx-warning);
  }
  .banner--danger {
    color: var(--sx-text);
    background: var(--sx-danger-soft);
    border: 1px solid color-mix(in srgb, var(--sx-danger) 30%, transparent);
  }
  .banner--danger > :global(svg) {
    color: var(--sx-danger);
  }
  .current {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    margin-bottom: 20px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
  }
  .current__main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .current__name {
    width: 100%;
    max-width: 420px;
    height: 28px;
    margin-left: -6px;
    padding: 0 6px;
    font-size: var(--sx-text-lg);
    font-weight: 600;
    color: var(--sx-text);
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--sx-radius-sm);
    outline: none;
  }
  .current__name:hover {
    border-color: var(--sx-border);
  }
  .current__name:focus {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .current__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sx-success);
  }
  .dot--dirty,
  .dot--saving {
    background: var(--sx-warning);
  }
  .dot--error {
    background: var(--sx-danger);
  }
  .current__actions {
    display: flex;
    gap: 6px;
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    font-size: var(--sx-text-xs);
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--sx-text-2);
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
  }
  .avatar--lg {
    width: 40px;
    height: 40px;
    font-size: var(--sx-text-md);
    border-radius: var(--sx-radius-md);
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
    border-color: transparent;
  }
  .table {
    display: flex;
    flex-direction: column;
  }
  .table__head,
  .table__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px 84px 120px 196px;
    align-items: center;
    gap: 12px;
    padding: 0 8px 0 10px;
  }
  .table__head {
    height: 32px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
    border-bottom: 1px solid var(--sx-border);
  }
  .table__row {
    min-height: 48px;
    border-bottom: 1px solid var(--sx-border);
    transition: background-color var(--sx-dur) var(--sx-ease);
  }
  .table__row:hover {
    background: var(--sx-subtle);
  }
  .table__row--danger,
  .table__row--danger:hover {
    background: var(--sx-danger-soft);
  }
  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .muted {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    white-space: nowrap;
  }
  .cell-name {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  .cell-name__text {
    min-width: 0;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cell-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
  }
  .cell-actions .sx-btn {
    margin-right: 4px;
  }
  .snap-form {
    display: flex;
    gap: 8px;
  }
  .snap-help {
    margin: 8px 0 16px;
  }
  .snaps {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    overflow: hidden;
  }
  .snap {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 52px;
    padding: 0 10px 0 14px;
  }
  .snap + .snap {
    border-top: 1px solid var(--sx-border);
  }
  .snap:hover {
    background: var(--sx-subtle);
  }
  .snap--danger,
  .snap--danger:hover {
    background: var(--sx-danger-soft);
  }
  .snap__icon {
    color: var(--sx-text-3);
  }
  .snap__main {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .snap__label {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .snap__meta {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .snap__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .newp {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px;
  }
  .newp__options {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 6px -4px -4px;
    padding-top: 6px;
    border-top: 1px solid var(--sx-border);
  }
  .newp__opt {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    text-align: left;
    border-radius: var(--sx-radius-sm);
  }
  .newp__opt:hover,
  .newp__opt:focus-visible {
    background: var(--sx-hover);
  }
  .newp__icon {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    color: var(--sx-text-2);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
    background: var(--sx-panel);
  }
  .newp__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .newp__title {
    font-weight: 600;
  }
  .newp__sub {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
