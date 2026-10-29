<script lang="ts">
  import { editor } from '#lib/state/editor.svelte.js';
  import { CURATED_PROJECT_ASSETS, type BlueprintAsset } from '@app-viz/schema';
  import type { EditorCommand } from '@app-viz/engine';
  import IconButton from '#lib/ui/IconButton.svelte';
  import Popover from '#lib/ui/Popover.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import InlineConfirm from '../dialogs/InlineConfirm.svelte';
  import AddSvgDialog from './AddSvgDialog.svelte';
  import { ACCEPT_ATTR, assetKind, fileToAsset } from './asset-utils.js';
  import { formatBytes } from '../dialogs/format.js';
  import UploadSimpleIcon from 'phosphor-svelte/lib/UploadSimpleIcon';
  import DotsThreeIcon from 'phosphor-svelte/lib/DotsThreeIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import FileCodeIcon from 'phosphor-svelte/lib/FileCodeIcon';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import CloudArrowUpIcon from 'phosphor-svelte/lib/CloudArrowUpIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';

  let query = $state('');
  let selectedId = $state<string | null>(null);
  let confirmDelete = $state(false);
  let menuOpen = $state(false);
  let menuAnchor = $state<HTMLElement | null>(null);
  let showSvgDialog = $state(false);
  let dragDepth = $state(0);
  let uploading = $state(0);
  let fileInput: HTMLInputElement | null = null;
  /** Measured sizes for assets saved without width/height (older projects, curated data). */
  let measured = $state<Record<string, { w: number; h: number }>>({});

  const assets = $derived(editor.blueprint.assets ?? []);
  const visible = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return assets;
    return assets.filter((a) => a.filename.toLowerCase().includes(q) || a.alt.toLowerCase().includes(q) || (a.category ?? '').toLowerCase().includes(q));
  });
  const selected = $derived(assets.find((a) => a.id === selectedId) ?? null);
  const missingCurated = $derived(CURATED_PROJECT_ASSETS.filter((c) => !assets.some((a) => a.id === c.id)));
  const applyLabel = $derived(editor.selectedNode ? `Apply to ${editor.selectedNode.name}` : 'Insert as card');

  function dims(a: BlueprintAsset): string | null {
    const w = a.width ?? measured[a.id]?.w;
    const h = a.height ?? measured[a.id]?.h;
    return w && h ? `${w} × ${h}` : null;
  }

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    uploading += list.length;
    const taken = assets.map((a) => a.filename);
    const created: BlueprintAsset[] = [];
    for (const file of list) {
      try {
        const asset = await fileToAsset(file, taken);
        taken.push(asset.filename);
        created.push(asset);
      } catch (e) {
        editor.notify('error', (e as Error).message);
      } finally {
        uploading -= 1;
      }
    }
    if (created.length === 0) return;
    editor.dispatch({ type: 'BATCH', label: 'Upload assets', commands: created.map((asset) => ({ type: 'ADD_ASSET' as const, asset })) });
    selectedId = created[created.length - 1].id;
    editor.notify('success', created.length === 1 ? `Added “${created[0].filename}”.` : `Added ${created.length} assets.`);
  }

  /** There is no UPDATE_ASSET command: re-append the edited asset and everything after it in one undo step, preserving order. */
  function updateAsset(id: string, patch: Partial<BlueprintAsset>) {
    const idx = assets.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const tail = assets.slice(idx).map((a) => $state.snapshot(a) as BlueprintAsset);
    tail[0] = { ...tail[0], ...patch };
    const commands: EditorCommand[] = [
      ...tail.map((a) => ({ type: 'DELETE_ASSET' as const, assetId: a.id })),
      ...tail.map((a) => ({ type: 'ADD_ASSET' as const, asset: a }))
    ];
    editor.dispatch({ type: 'BATCH', label: 'Edit asset', commands });
  }

  function remove(asset: BlueprintAsset) {
    editor.deleteAsset(asset.id);
    confirmDelete = false;
    selectedId = null;
    editor.notify('info', `Removed “${asset.filename}”. Press ⌘Z to undo.`);
  }

  function restoreCurated() {
    menuOpen = false;
    if (missingCurated.length === 0) return;
    editor.dispatch({
      type: 'BATCH',
      label: 'Restore sample assets',
      commands: missingCurated.map((c) => ({ type: 'ADD_ASSET' as const, asset: structuredClone(c) }))
    });
    editor.notify('success', `Restored ${missingCurated.length} sample ${missingCurated.length === 1 ? 'asset' : 'assets'}.`);
  }

  async function copyPath(asset: BlueprintAsset) {
    try {
      await navigator.clipboard.writeText(asset.localPath);
      editor.notify('success', `Copied ${asset.localPath}`, 1800);
    } catch (e) {
      editor.notify('error', `Clipboard access was blocked (${(e as Error).message}).`);
    }
  }

  function hasFiles(e: DragEvent) {
    return Array.from(e.dataTransfer?.types ?? []).includes('Files');
  }
</script>

<div
  class={['sx-panel', 'assets', dragDepth > 0 && 'assets--drag']}
  role="region"
  aria-label="Assets"
  ondragenter={(e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth += 1;
  }}
  ondragover={(e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  }}
  ondragleave={(e) => {
    if (!hasFiles(e)) return;
    dragDepth = Math.max(0, dragDepth - 1);
  }}
  ondrop={(e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth = 0;
    if (e.dataTransfer?.files) void upload(e.dataTransfer.files);
  }}
>
  <div class="sx-panel__header">
    <h2 class="sx-panel__title">Assets</h2>
    <span class="sx-badge" aria-label="{assets.length} assets">{assets.length}</span>
    <IconButton label="Upload files" icon={UploadSimpleIcon} onclick={() => fileInput?.click()} />
    <IconButton
      label="More"
      icon={DotsThreeIcon}
      weight="bold"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      active={menuOpen}
      {@attach (el) => {
        menuAnchor = el;
      }}
      onclick={() => (menuOpen = !menuOpen)}
    />
  </div>

  <input
    class="assets__file"
    type="file"
    multiple
    accept={ACCEPT_ATTR}
    tabindex="-1"
    aria-hidden="true"
    {@attach (el) => {
      fileInput = el;
      return () => (fileInput = null);
    }}
    onchange={(e) => {
      const input = e.currentTarget as HTMLInputElement;
      if (input.files) void upload(input.files);
      input.value = '';
    }}
  />

  <div class="sx-panel__body assets__body">
    {#if assets.length === 0}
      <div class="drop drop--empty">
        <span class="sx-empty__icon"><CloudArrowUpIcon size={20} /></span>
        <span class="sx-empty__title">No assets yet</span>
        <span class="drop__text">Drop images here or upload PNG, JPG, GIF, WebP, AVIF or SVG files up to 2 MB.</span>
        <div class="drop__actions">
          <button type="button" class="sx-btn sx-btn--primary" onclick={() => fileInput?.click()}>
            <UploadSimpleIcon size={14} /> Upload files
          </button>
          {#if missingCurated.length > 0}
            <button type="button" class="sx-btn" onclick={restoreCurated}>Restore samples</button>
          {/if}
        </div>
      </div>
    {:else}
      <div class="assets__tools">
        <label class="sx-search">
          <MagnifyingGlassIcon size={14} />
          <input class="sx-input" type="search" placeholder="Search assets" aria-label="Search assets" bind:value={query} />
        </label>
        <button type="button" class="drop" onclick={() => fileInput?.click()}>
          <CloudArrowUpIcon size={16} />
          <span class="drop__label">
            {#if uploading > 0}
              Uploading {uploading}…
            {:else}
              Drop files or <span class="drop__link">browse</span>
            {/if}
          </span>
          <span class="drop__hint">2 MB max</span>
        </button>
      </div>

      {#if visible.length === 0}
        <div class="sx-empty">
          <span class="sx-empty__title">No matching assets</span>
          <span>Search matches file names, alt text and categories.</span>
        </div>
      {:else}
        <ul class="grid" aria-label="Project assets">
          {#each visible as asset (asset.id)}
            {@const on = asset.id === selectedId}
            <li>
              <button
                type="button"
                class={['tile', on && 'tile--on']}
                aria-pressed={on}
                aria-label="{asset.filename}, {assetKind(asset)}, {formatBytes(asset.size)}"
                onclick={() => {
                  selectedId = on ? null : asset.id;
                  confirmDelete = false;
                }}
              >
                <span class="tile__img checker">
                  {#if asset.dataUrl}
                    <img
                      src={asset.dataUrl}
                      alt={asset.alt}
                      width={asset.width ?? 120}
                      height={asset.height ?? 120}
                      loading="lazy"
                      decoding="async"
                      onload={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!asset.width || !asset.height) measured[asset.id] = { w: img.naturalWidth, h: img.naturalHeight };
                      }}
                    />
                  {:else}
                    <ImageIcon size={20} />
                  {/if}
                </span>
                <span class="tile__name">{asset.filename}</span>
                <span class="tile__meta">{assetKind(asset)} · {formatBytes(asset.size)}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>

  {#if selected}
    <section class="details" aria-label="Asset details">
      <header class="details__head">
        <span class="details__title" {@attach tooltip(selected.filename)}>{selected.filename}</span>
        <IconButton size="sm" label="Close details" icon={XIcon} iconSize={12} onclick={() => (selectedId = null)} />
      </header>
      <div class="details__preview checker">
        {#if selected.dataUrl}
          <img src={selected.dataUrl} alt={selected.alt} width={selected.width ?? 240} height={selected.height ?? 140} />
        {/if}
      </div>
      <dl class="details__meta">
        <div><dt>Type</dt><dd>{assetKind(selected)}</dd></div>
        <div><dt>Size</dt><dd>{formatBytes(selected.size)}</dd></div>
        <div><dt>Dimensions</dt><dd>{dims(selected) ?? '—'}</dd></div>
        <div><dt>Path</dt><dd class="mono" {@attach tooltip('Bundled into static/ on export')}>{selected.localPath}</dd></div>
      </dl>
      <div class="details__field">
        <label class="sx-label" for="asset-alt-{selected.id}">Alt text</label>
        <input
          id="asset-alt-{selected.id}"
          class="sx-input"
          value={selected.alt}
          placeholder="Describe the image for screen readers"
          onchange={(e) => updateAsset(selected.id, { alt: (e.currentTarget as HTMLInputElement).value.trim() })}
        />
      </div>
      {#if confirmDelete}
        <InlineConfirm message="Remove this asset?" confirmLabel="Remove" onconfirm={() => remove(selected)} oncancel={() => (confirmDelete = false)} />
      {:else}
        <div class="details__actions">
          <button type="button" class="sx-btn sx-btn--primary details__apply" onclick={() => editor.applyAssetToSelectedNode($state.snapshot(selected) as BlueprintAsset)}>
            <span class="details__apply-label">{applyLabel}</span>
          </button>
          <IconButton label="Copy path" icon={CopyIcon} onclick={() => copyPath(selected)} />
          <IconButton label="Remove asset" tone="danger" icon={TrashIcon} onclick={() => (confirmDelete = true)} />
        </div>
      {/if}
    </section>
  {/if}

  {#if dragDepth > 0}
    <div class="overlay" aria-hidden="true">
      <CloudArrowUpIcon size={24} />
      <span>Drop to upload</span>
    </div>
  {/if}
</div>

<Popover open={menuOpen} anchor={menuAnchor} onclose={() => (menuOpen = false)} placement="bottom-end" width={232} label="Asset actions">
  <button
    type="button"
    class="sx-menu-item"
    role="menuitem"
    onclick={() => {
      menuOpen = false;
      showSvgDialog = true;
    }}
  >
    <FileCodeIcon size={15} />
    <span class="sx-menu-item__label">Add SVG from code…</span>
  </button>
  <button type="button" class="sx-menu-item" role="menuitem" disabled={missingCurated.length === 0} onclick={restoreCurated}>
    <ArrowCounterClockwiseIcon size={15} />
    <span class="sx-menu-item__label">Restore sample assets</span>
    {#if missingCurated.length > 0}<span class="sx-menu-item__hint">{missingCurated.length}</span>{/if}
  </button>
</Popover>

{#if showSvgDialog}
  <AddSvgDialog
    takenNames={assets.map((a) => a.filename)}
    onclose={() => (showSvgDialog = false)}
    oncreate={(asset) => {
      editor.addAsset(asset);
      selectedId = asset.id;
      showSvgDialog = false;
      editor.notify('success', `Added “${asset.filename}”.`);
    }}
  />
{/if}

<style>
  .assets {
    position: relative;
    height: 100%;
  }
  .assets__file {
    display: none;
  }
  .assets__tools {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 12px 4px;
  }
  .checker {
    background-color: var(--sx-subtle);
    background-image:
      linear-gradient(45deg, var(--sx-hover) 25%, transparent 25%),
      linear-gradient(-45deg, var(--sx-hover) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--sx-hover) 75%),
      linear-gradient(-45deg, transparent 75%, var(--sx-hover) 75%);
    background-size: 12px 12px;
    background-position:
      0 0,
      0 6px,
      6px -6px,
      -6px 0;
  }
  .drop {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 36px;
    padding: 0 10px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    border: 1px dashed var(--sx-border-strong);
    border-radius: var(--sx-radius-sm);
    text-align: left;
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      background-color var(--sx-dur) var(--sx-ease);
  }
  .drop:hover {
    border-color: var(--sx-accent);
    background: var(--sx-accent-soft);
    color: var(--sx-text);
  }
  .drop__label {
    flex: 1;
  }
  .drop__link {
    color: var(--sx-accent-text);
    font-weight: 500;
  }
  .drop__hint {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
  .drop--empty {
    flex-direction: column;
    justify-content: center;
    height: auto;
    margin: 16px 12px;
    padding: 28px 16px;
    gap: 8px;
    text-align: center;
    cursor: default;
  }
  .drop--empty:hover {
    border-color: var(--sx-border-strong);
    background: none;
  }
  .drop__text {
    max-width: 210px;
    font-size: var(--sx-text-sm);
    line-height: 1.5;
    color: var(--sx-text-2);
  }
  .drop__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-top: 6px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 8px 12px 16px;
  }
  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 100%;
    padding: 4px 4px 7px;
    text-align: left;
    border: 1px solid transparent;
    border-radius: var(--sx-radius-md);
    transition:
      background-color var(--sx-dur) var(--sx-ease),
      border-color var(--sx-dur) var(--sx-ease);
  }
  .tile:hover {
    background: var(--sx-hover);
  }
  .tile--on,
  .tile--on:hover {
    background: var(--sx-accent-soft);
    border-color: var(--sx-accent);
  }
  .tile__img {
    position: relative;
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    margin-bottom: 4px;
    overflow: hidden;
    color: var(--sx-text-3);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
  }
  .tile__img img {
    max-width: 82%;
    max-height: 82%;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .tile__name {
    padding: 0 2px;
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tile__meta {
    padding: 0 2px;
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
    max-height: 56%;
    overflow-y: auto;
    padding: 0 12px 12px;
    border-top: 1px solid var(--sx-border);
    background: var(--sx-panel);
  }
  .details__head {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    margin-bottom: -4px;
  }
  .details__title {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-md);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .details__preview {
    display: grid;
    place-items: center;
    height: 112px;
    padding: 10px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
  }
  .details__preview img {
    max-width: 100%;
    max-height: 92px;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .details__meta {
    display: grid;
    gap: 4px;
  }
  .details__meta div {
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr);
    gap: 8px;
    font-size: var(--sx-text-sm);
    line-height: 18px;
  }
  .details__meta dt {
    color: var(--sx-text-3);
  }
  .details__meta dd {
    margin: 0;
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .details__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .details__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .details__apply {
    flex: 1;
    min-width: 0;
  }
  .details__apply-label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .mono {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
  }
  .overlay {
    position: absolute;
    inset: 44px 0 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 8px;
    font-size: var(--sx-text-md);
    font-weight: 600;
    color: var(--sx-accent-text);
    background: color-mix(in srgb, var(--sx-accent-soft) 85%, transparent);
    border: 1.5px dashed var(--sx-accent);
    border-radius: var(--sx-radius-md);
    pointer-events: none;
  }
</style>
