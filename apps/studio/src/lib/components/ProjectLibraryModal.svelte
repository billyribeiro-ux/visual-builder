<script lang="ts">
  import Dialog from './ui/Dialog.svelte';
  import { editor } from '../state/editor.svelte.js';

  let tab = $state<'projects' | 'versions'>('projects');
  let newName = $state('');
  let versionLabel = $state('');
  let filter = $state('');
  let pendingDelete = $state<string | null>(null);
  let importError = $state('');
  let fileInput = $state<HTMLInputElement | null>(null);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  function relative(iso: string | null | undefined): string {
    if (!iso) return '—';
    const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
    return new Date(iso).toLocaleDateString();
  }

  const visibleProjects = $derived(
    editor.projects.filter((p) => !filter.trim() || p.name.toLowerCase().includes(filter.trim().toLowerCase()))
  );

  async function handleImport(event: Event) {
    importError = '';
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      importError = 'File is larger than 50 MB.';
      return;
    }
    const res = await editor.importProjectFile(await file.text());
    if (!res.ok) importError = res.error ?? 'Could not import file.';
  }

  async function create(template: 'blank' | 'acme-saas') {
    await editor.newProject(template, newName);
    newName = '';
    editor.showProjectLibrary = false;
  }

  async function open(id: string) {
    if (await editor.openProject(id)) editor.showProjectLibrary = false;
  }
</script>

<Dialog
  open={editor.showProjectLibrary}
  title="Projects"
  description={editor.storageDurable
    ? 'Every project autosaves to this browser (IndexedDB). Export a project file to back up or move it between machines.'
    : 'Storage is unavailable in this browser session — export a project file to keep your work.'}
  size="lg"
  onclose={() => (editor.showProjectLibrary = false)}
>
  <div class="pl-tabs" role="tablist">
    <button type="button" role="tab" aria-selected={tab === 'projects'} class:on={tab === 'projects'} onclick={() => (tab = 'projects')}>
      Saved projects ({editor.projects.length})
    </button>
    <button type="button" role="tab" aria-selected={tab === 'versions'} class:on={tab === 'versions'} onclick={() => (tab = 'versions')}>
      Version history ({editor.snapshots.length})
    </button>
  </div>

  {#if tab === 'projects'}
    <div class="pl-current">
      <label class="pl-field">
        <span>Current project name</span>
        <input
          class="studio-input"
          value={editor.blueprint.meta.name}
          onchange={(e) => editor.renameProject((e.currentTarget as HTMLInputElement).value)}
        />
      </label>
      <div class="pl-actions">
        <button type="button" class="studio-btn" onclick={() => editor.duplicateProject()}>Duplicate</button>
        <button type="button" class="studio-btn" onclick={() => editor.exportProjectFile()}>Export file (.appviz.json)</button>
        <button type="button" class="studio-btn" onclick={() => fileInput?.click()}>Import file…</button>
        <input bind:this={fileInput} type="file" accept=".json,application/json" hidden onchange={handleImport} />
      </div>
      {#if importError}<p class="pl-error" role="alert">{importError}</p>{/if}
    </div>

    <div class="pl-new">
      <input class="studio-input" bind:value={newName} placeholder="New project name" aria-label="New project name" />
      <button type="button" class="studio-btn studio-btn--primary" onclick={() => create('blank')}>+ Blank project</button>
      <button type="button" class="studio-btn" onclick={() => create('acme-saas')}>+ From SaaS template</button>
    </div>

    {#if editor.projects.length > 6}
      <input class="studio-input pl-filter" type="search" bind:value={filter} placeholder="Filter projects…" aria-label="Filter projects" />
    {/if}

    <ul class="pl-list">
      {#each visibleProjects as p (p.id)}
        {@const isOpen = p.id === editor.blueprint.meta.id}
        <li class="pl-item {isOpen ? 'pl-item--open' : ''}">
          <div class="pl-item__main">
            <span class="pl-item__name">{p.name}{#if isOpen}<span class="pl-badge">Open</span>{/if}</span>
            <span class="pl-item__meta">{p.pageCount} pages · {p.nodeCount} elements · edited {relative(p.updatedAt)}</span>
          </div>
          <div class="pl-item__actions">
            {#if pendingDelete === p.id}
              <span class="pl-confirm">Delete permanently?</span>
              <button type="button" class="studio-btn pl-danger" onclick={async () => { await editor.deleteProject(p.id); pendingDelete = null; }}>Delete</button>
              <button type="button" class="studio-btn" onclick={() => (pendingDelete = null)}>Cancel</button>
            {:else}
              {#if !isOpen}<button type="button" class="studio-btn studio-btn--primary" onclick={() => open(p.id)}>Open</button>{/if}
              <button type="button" class="studio-btn" onclick={() => editor.duplicateProject(p.id)}>Duplicate</button>
              <button type="button" class="studio-btn" aria-label="Delete {p.name}" onclick={() => (pendingDelete = p.id)}>Delete</button>
            {/if}
          </div>
        </li>
      {:else}
        <li class="pl-empty">No saved projects yet.</li>
      {/each}
    </ul>
  {:else}
    <div class="pl-new">
      <input class="studio-input" bind:value={versionLabel} placeholder="Version name (e.g. Before pricing redesign)" aria-label="Version name" />
      <button
        type="button"
        class="studio-btn studio-btn--primary"
        onclick={async () => { await editor.createSnapshot(versionLabel); versionLabel = ''; }}
      >
        Save version
      </button>
    </div>
    <ul class="pl-list">
      {#each editor.snapshots as snap (snap.id)}
        <li class="pl-item">
          <div class="pl-item__main">
            <span class="pl-item__name">{snap.label}</span>
            <span class="pl-item__meta">{new Date(snap.createdAt).toLocaleString()} · {snap.blueprint.pages.length} pages</span>
          </div>
          <div class="pl-item__actions">
            <button type="button" class="studio-btn studio-btn--primary" onclick={() => { editor.restoreSnapshot(snap.id); editor.showProjectLibrary = false; }}>Restore</button>
            <button type="button" class="studio-btn" aria-label="Delete version {snap.label}" onclick={() => editor.deleteSnapshot(snap.id)}>Delete</button>
          </div>
        </li>
      {:else}
        <li class="pl-empty">No saved versions for this project. Restoring a version is undoable with ⌘Z.</li>
      {/each}
    </ul>
  {/if}
</Dialog>

<style>
  .pl-tabs { display: flex; gap: 0.35rem; margin-bottom: 1rem; }
  .pl-tabs button {
    padding: 0.45rem 0.9rem;
    border-radius: 9999px;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
  }
  .pl-tabs button.on { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); }
  .pl-current {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.9rem;
    border-radius: 16px;
    background: var(--md-sys-color-surface-container-low);
    margin-bottom: 0.75rem;
  }
  .pl-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.75rem; font-weight: 600; color: var(--md-sys-color-on-surface-variant); }
  .pl-actions, .pl-new { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
  .pl-new { margin-bottom: 0.75rem; }
  .pl-new .studio-input { flex: 1; min-width: 12rem; }
  .pl-filter { margin-bottom: 0.5rem; }
  .pl-error { margin: 0; color: var(--md-sys-color-error); font-size: 0.75rem; }
  .pl-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .pl-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.7rem 0.85rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 14px;
  }
  .pl-item--open { border-color: var(--md-sys-color-primary); background: color-mix(in srgb, var(--md-sys-color-primary-container) 35%, transparent); }
  .pl-item__main { display: flex; flex-direction: column; min-width: 0; }
  .pl-item__name { font-weight: 700; font-size: 0.875rem; display: flex; align-items: center; gap: 0.4rem; }
  .pl-item__meta { font-size: 0.72rem; color: var(--md-sys-color-on-surface-variant); }
  .pl-item__actions { display: flex; gap: 0.35rem; flex-shrink: 0; align-items: center; }
  .pl-badge {
    font-size: 0.625rem;
    font-weight: 700;
    padding: 0.1rem 0.45rem;
    border-radius: 9999px;
    background: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .pl-confirm { font-size: 0.75rem; color: var(--md-sys-color-error); font-weight: 600; }
  .pl-danger { background: var(--md-sys-color-error); color: var(--md-sys-color-on-error); }
  .pl-empty { font-size: 0.8125rem; color: var(--md-sys-color-on-surface-variant); padding: 1rem 0; }
</style>
