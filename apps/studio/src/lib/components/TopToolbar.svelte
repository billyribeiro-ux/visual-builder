<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import type { BreakpointKey } from '@app-viz/schema';
  import {
    generatePageRoute,
    generateAppCss,
    generateAgentsMarkdown
  } from '@app-viz/codegen';

  const breakpoints: { key: BreakpointKey; label: string; icon: string; width: string }[] = [
    { key: 'mobile', label: 'Mobile', icon: '📱', width: '375px' },
    { key: 'tablet', label: 'Tablet', icon: '💻', width: '768px' },
    { key: 'desktop', label: 'Desktop', icon: '🖥️', width: '1280px' },
    { key: 'wide', label: 'Wide', icon: '🖵', width: '1440px' }
  ];

  let isExporting = $state(false);
  let showTemplateModal = $state(false);
  let showSnapshotsModal = $state(false);
  let showPreflightModal = $state(false);
  let showCodeModal = $state(false);
  let activeCodeTab = $state<'page' | 'css' | 'agents' | 'blueprint'>('page');
  let copySuccess = $state(false);

  let snapshotLabel = $state('');
  let importJsonText = $state('');
  let importError = $state('');

  const liveCodeOutput = $derived.by(() => {
    if (!showCodeModal) return '';
    if (activeCodeTab === 'page' && editor.activePage) {
      return generatePageRoute(editor.activePage, editor.blueprint);
    }
    if (activeCodeTab === 'css') {
      return generateAppCss(editor.blueprint.tokens, editor.blueprint);
    }
    if (activeCodeTab === 'agents') {
      return generateAgentsMarkdown(editor.blueprint);
    }
    return JSON.stringify(editor.blueprint, null, 2);
  });

  function closeAllModals() {
    showTemplateModal = false;
    showSnapshotsModal = false;
    showPreflightModal = false;
    showCodeModal = false;
  }

  async function handleExport() {
    isExporting = true;
    try {
      await editor.exportHandoffPackage();
    } finally {
      isExporting = false;
    }
  }

  async function handleCopyCode() {
    if (!liveCodeOutput || typeof navigator === 'undefined') return;
    await navigator.clipboard.writeText(liveCodeOutput);
    copySuccess = true;
    setTimeout(() => (copySuccess = false), 2000);
  }

  function handleSaveSnapshot() {
    editor.createSnapshot(snapshotLabel);
    snapshotLabel = '';
  }

  function handleImportJson() {
    importError = '';
    if (!importJsonText.trim()) return;
    const res = editor.importBlueprintJson(importJsonText);
    if (!res.ok) {
      importError = res.error || 'Invalid blueprint JSON';
    } else {
      importJsonText = '';
      showTemplateModal = false;
    }
  }
</script>

<header class="studio-topbar">
  <!-- Left: Brand, Editable Project Name, Templates, Save Status & History -->
  <div class="studio-topbar__left">
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <input
        type="text"
        aria-label="Project name"
        value={editor.blueprint.meta.name}
        onchange={(e) =>
          editor.dispatch({
            type: 'UPDATE_PROJECT_META',
            meta: { name: (e.target as HTMLInputElement).value }
          })}
        class="brand-name-input"
      />
    </div>

    <button
      type="button"
      onclick={() => {
        closeAllModals();
        editor.showBlockLibraryModal = true;
      }}
      class="studio-btn top-pill-btn"
      title="Open Elementor Pro Block & Page Library"
    >
      📁 Library
    </button>

    <button
      type="button"
      onclick={() => {
        const next = !showTemplateModal;
        closeAllModals();
        showTemplateModal = next;
      }}
      class="studio-btn top-pill-btn"
      title="Switch starter project or import JSON"
    >
      Starter ▾
    </button>

    <div class="divider"></div>

    <div class="status-indicator">
      {#if editor.isSaving}
        <span class="status status--saving">
          <span class="status-dot status-dot--pulse"></span>
          Saving...
        </span>
      {:else}
        <span class="status status--saved">
          <span class="status-dot"></span>
          {editor.lastSavedAt}
        </span>
      {/if}
    </div>

    <!-- Undo / Redo + Snapshots -->
    <div class="studio-btn-group">
      <button
        type="button"
        onclick={() => editor.undo()}
        disabled={!editor.canUndo}
        title="Undo ({editor.undoCount} steps)"
        class="studio-btn"
      >
        ↺
      </button>
      <button
        type="button"
        onclick={() => editor.redo()}
        disabled={!editor.canRedo}
        title="Redo ({editor.redoCount} steps)"
        class="studio-btn"
      >
        ↻
      </button>
      <button
        type="button"
        onclick={() => {
          const next = !showSnapshotsModal;
          closeAllModals();
          showSnapshotsModal = next;
        }}
        title="Project Snapshots & Restore"
        class="studio-btn"
      >
        🕒 ({editor.snapshots.length})
      </button>
    </div>
  </div>

  <!-- Center: Viewport Breakpoint Switcher & Zoom -->
  <div class="studio-topbar__center">
    <div class="studio-btn-group">
      {#each breakpoints as bp (bp.key)}
        <button
          type="button"
          onclick={() => editor.setBreakpoint(bp.key)}
          class="studio-btn {editor.activeBreakpoint === bp.key ? 'studio-btn--active' : ''}"
        >
          <span>{bp.icon}</span>
          <span>{bp.label}</span>
          <span class="bp-width">({bp.width})</span>
        </button>
      {/each}
    </div>

    <div class="studio-btn-group zoom-group">
      <button
        type="button"
        onclick={() => editor.setZoom(editor.zoom - 10)}
        aria-label="Zoom out"
        class="studio-btn"
      >
        -
      </button>
      <span class="zoom-level">{editor.zoom}%</span>
      <button
        type="button"
        onclick={() => editor.setZoom(editor.zoom + 10)}
        aria-label="Zoom in"
        class="studio-btn"
      >
        +
      </button>
    </div>
  </div>

  <!-- Right: Page Switcher, Preflight Badge, Code View, Mode Toggle & AI Export -->
  <div class="studio-topbar__right">
    <select
      aria-label="Active page route"
      value={editor.activePageId}
      onchange={(e) => editor.setActivePage((e.target as HTMLSelectElement).value)}
      class="studio-select page-select"
    >
      {#each editor.blueprint.pages as page (page.id)}
        <option value={page.id}>{page.path} — {page.title}</option>
      {/each}
    </select>

    <!-- Preflight Check Badge -->
    <button
      type="button"
      onclick={() => {
        closeAllModals();
        editor.showCommandPalette = !editor.showCommandPalette;
      }}
      title="Open AI Section Composer & Quick Commands (Cmd/Ctrl+K)"
      class="studio-btn json-btn"
    >
      ✨ ⌘K AI
    </button>

    <!-- Route & Interaction Flow Map Toggle -->
    <button
      type="button"
      onclick={() => {
        editor.canvasViewMode = editor.canvasViewMode === 'flow' ? 'canvas' : 'flow';
      }}
      title="Toggle App Route & Interaction Flow Map"
      class="studio-btn {editor.canvasViewMode === 'flow' ? 'studio-btn--active' : 'json-btn'}"
    >
      🗺️ {editor.canvasViewMode === 'flow' ? 'Canvas' : 'Flow Map'}
    </button>

    <button
      type="button"
      onclick={() => {
        const next = !showPreflightModal;
        closeAllModals();
        showPreflightModal = next;
      }}
      class="studio-btn preflight-btn {editor.preflightReport.valid && editor.preflightReport.issues.length === 0 ? 'preflight-btn--ok' : 'preflight-btn--warn'}"
      title="Inspect Preflight & Export Readiness"
    >
      {#if editor.preflightReport.valid && editor.preflightReport.issues.length === 0}
        ✓ MD3 ({editor.preflightReport.score}%)
      {:else}
        ⚠ {editor.preflightReport.issues.length} Notice(s)
      {/if}
    </button>

    <!-- Live Svelte 5 Code Inspector -->
    <button
      type="button"
      onclick={() => {
        const next = !showCodeModal;
        closeAllModals();
        showCodeModal = next;
      }}
      title="Inspect Live Generated Svelte 5 & MD3 CSS Code"
      class="studio-btn json-btn"
    >
      &lt;/&gt; Code
    </button>

    <!-- Interactive Mode Toggle (Full-Screen Preview like Elementor Eye Icon) -->
    <button
      type="button"
      onclick={() => editor.toggleInteractiveMode()}
      class="studio-btn mode-btn {editor.isInteractiveMode ? 'mode-btn--interactive' : ''}"
    >
      <span>{editor.isInteractiveMode ? '✏️ Back to Editor' : '👁 Preview'}</span>
    </button>

    <!-- Export for AI Agents ZIP Button -->
    <button
      type="button"
      onclick={handleExport}
      disabled={isExporting}
      class="studio-btn studio-btn--primary export-btn"
    >
      <span>⚡</span>
      <span>{isExporting ? 'Generating ZIP...' : 'Export for AI Agents'}</span>
    </button>
  </div>
</header>

{#if showTemplateModal}
  <div class="topbar-modal" role="dialog" aria-label="Project Templates and Import">
    <div class="topbar-modal__header">
      <span class="topbar-modal__title">Project Templates & Blueprint Import</span>
      <button type="button" class="studio-btn" onclick={() => (showTemplateModal = false)}>✕</button>
    </div>
    <div class="topbar-modal__body">
      <div class="template-grid">
        <div class="template-card">
          <div class="template-card__title">Acme Cloud SaaS (5-Route Starter)</div>
          <p class="template-card__desc">Full Google MD3 SaaS marketing site + interactive analytics dashboard & settings.</p>
          <button
            type="button"
            class="studio-btn studio-btn--primary"
            onclick={() => {
              editor.loadStarterTemplate('acme-saas');
              showTemplateModal = false;
            }}
          >
            Load Acme SaaS Starter
          </button>
        </div>
        <div class="template-card">
          <div class="template-card__title">Blank MD3 Project</div>
          <p class="template-card__desc">Clean slate with shared Navbar/Footer layout and Google Material Design 3 tokens.</p>
          <button
            type="button"
            class="studio-btn"
            style="border: 1px solid var(--md-sys-color-outline-variant);"
            onclick={() => {
              editor.loadStarterTemplate('blank');
              showTemplateModal = false;
            }}
          >
            Start Blank Project
          </button>
        </div>
      </div>

      <div class="import-box">
        <label for="import-blueprint-json" class="import-label">Or Paste `project.blueprint.json` to Import:</label>
        <textarea
          id="import-blueprint-json"
          rows={3}
          bind:value={importJsonText}
          placeholder="Paste serialized blueprint JSON here..."
          class="studio-textarea"
        ></textarea>
        {#if importError}
          <div class="import-error">{importError}</div>
        {/if}
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
          <button type="button" class="studio-btn" onclick={() => editor.downloadBlueprintJson()}>
            ⬇ Download Current JSON
          </button>
          <button type="button" class="studio-btn studio-btn--primary" onclick={handleImportJson}>
            Import JSON Blueprint
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if showSnapshotsModal}
  <div class="topbar-modal" role="dialog" aria-label="Version Snapshots">
    <div class="topbar-modal__header">
      <span class="topbar-modal__title">Version Snapshots ({editor.snapshots.length})</span>
      <button type="button" class="studio-btn" onclick={() => (showSnapshotsModal = false)}>✕</button>
    </div>
    <div class="topbar-modal__body">
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
        <input
          type="text"
          bind:value={snapshotLabel}
          placeholder="Snapshot label (e.g. Before Pricing Redesign)"
          aria-label="Snapshot label"
          class="studio-input"
        />
        <button type="button" class="studio-btn studio-btn--primary" onclick={handleSaveSnapshot}>
          + Save Snapshot
        </button>
      </div>
      {#if editor.snapshots.length === 0}
        <p style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin: 0;">
          No named snapshots saved yet. Create a checkpoint anytime to restore with one click.
        </p>
      {:else}
        <div class="snapshot-list">
          {#each editor.snapshots as snap (snap.id)}
            <div class="snapshot-row">
              <div>
                <div style="font-size: 0.75rem; font-weight: 600;">{snap.label}</div>
                <div style="font-size: 0.6875rem; color: var(--md-sys-color-on-surface-variant);">{snap.createdAt}</div>
              </div>
              <button
                type="button"
                class="studio-btn studio-btn--primary"
                onclick={() => {
                  editor.restoreSnapshot(snap.id);
                  showSnapshotsModal = false;
                }}
              >
                Restore
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if showPreflightModal}
  <div class="topbar-modal" role="dialog" aria-label="Preflight Audit Report">
    <div class="topbar-modal__header">
      <span class="topbar-modal__title">Export Preflight & Google MD3 Audit ({editor.preflightReport.score}%)</span>
      <button type="button" class="studio-btn" onclick={() => (showPreflightModal = false)}>✕</button>
    </div>
    <div class="topbar-modal__body">
      <div class="preflight-summary">
        <span>Routes: <strong>{editor.blueprint.pages.length}</strong></span>
        <span>Layouts: <strong>{editor.blueprint.layouts.length}</strong></span>
        <span>Target: <strong>Svelte {editor.blueprint.target.svelteVersion} / Kit {editor.blueprint.target.sveltekitVersion}</strong></span>
        <span>CSS Policy: <strong>Pure Vanilla MD3</strong></span>
      </div>
      <div class="snapshot-list">
        {#each editor.preflightReport.checks as check (check.id)}
          <div class="snapshot-row">
            <div>
              <span class="issue-badge issue-badge--{check.status}">{check.status.toUpperCase()}</span>
              <span style="font-size: 0.75rem; font-weight: 600; margin-left: 0.5rem;">{check.label}</span>
              <div style="font-size: 0.6875rem; color: var(--md-sys-color-on-surface-variant); margin-top: 0.2rem;">
                {check.detail}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
{/if}

{#if showCodeModal}
  <div class="topbar-modal topbar-modal--wide" role="dialog" aria-label="Live Generated Svelte 5 Code">
    <div class="topbar-modal__header">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="topbar-modal__title">Live Code & AI Handoff Preview</span>
        <div class="studio-btn-group">
          <button
            type="button"
            onclick={() => (activeCodeTab = 'page')}
            class="studio-btn {activeCodeTab === 'page' ? 'studio-btn--active' : ''}"
          >
            +page.svelte ({editor.activePage?.path})
          </button>
          <button
            type="button"
            onclick={() => (activeCodeTab = 'css')}
            class="studio-btn {activeCodeTab === 'css' ? 'studio-btn--active' : ''}"
          >
            src/app.css (MD3)
          </button>
          <button
            type="button"
            onclick={() => (activeCodeTab = 'agents')}
            class="studio-btn {activeCodeTab === 'agents' ? 'studio-btn--active' : ''}"
          >
            AGENTS.md
          </button>
          <button
            type="button"
            onclick={() => (activeCodeTab = 'blueprint')}
            class="studio-btn {activeCodeTab === 'blueprint' ? 'studio-btn--active' : ''}"
          >
            project.blueprint.json
          </button>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <button type="button" class="studio-btn studio-btn--primary" onclick={handleCopyCode}>
          {copySuccess ? '✓ Copied!' : '📋 Copy Code'}
        </button>
        <button type="button" class="studio-btn" onclick={() => (showCodeModal = false)}>✕</button>
      </div>
    </div>
    <div class="topbar-modal__body">
      <pre class="code-preview-block"><code>{liveCodeOutput}</code></pre>
    </div>
  </div>
{/if}

<style>
  .brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .brand-icon {
    width: 28px;
    height: 28px;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
  }
  .brand-name-input {
    font-weight: 700;
    font-size: 0.875rem;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 0.125rem 0.375rem;
    width: 9rem;
  }
  .brand-name-input:hover,
  .brand-name-input:focus {
    border-color: var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container);
    outline: none;
  }
  .top-pill-btn {
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-high);
    font-size: 0.75rem;
  }
  .divider {
    width: 1px;
    height: 16px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .status-indicator {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .status--saved {
    color: var(--md-sys-color-success);
  }
  .status--saving {
    color: #FBBF24;
  }
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: currentColor;
  }
  .status-dot--pulse {
    animation: status-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  @keyframes status-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .4; }
  }
  .bp-width {
    font-size: 0.625rem;
    opacity: 0.65;
  }
  .zoom-group {
    padding: 0 4px;
  }
  .zoom-level {
    font-family: var(--md-sys-font-mono);
    font-size: 0.75rem;
    padding: 0 0.5rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .page-select {
    width: auto;
    min-width: 135px;
    max-width: 180px;
  }
  .preflight-btn {
    font-size: 0.6875rem;
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .preflight-btn--ok {
    color: var(--md-sys-color-success);
  }
  .preflight-btn--warn {
    color: #FBBF24;
  }
  .mode-btn {
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-high);
  }
  .mode-btn--interactive {
    background-color: var(--md-sys-color-success-container) !important;
    color: var(--md-sys-color-on-success-container) !important;
    border-color: var(--md-sys-color-success) !important;
  }
  .json-btn {
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-high);
  }
  .export-btn {
    font-size: 0.8125rem;
    letter-spacing: 0.02em;
  }
  .topbar-modal {
    position: fixed;
    top: 56px;
    left: 50%;
    transform: translateX(-50%);
    width: 540px;
    max-width: 94vw;
    background-color: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium);
    box-shadow: var(--md-sys-elevation-level3);
    z-index: 100;
    overflow: hidden;
  }
  .topbar-modal--wide {
    width: 820px;
  }
  .topbar-modal__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .topbar-modal__title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .topbar-modal__body {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .code-preview-block {
    background-color: #0C0E12;
    color: #D5E3FF;
    font-family: var(--md-sys-font-mono);
    font-size: 0.75rem;
    line-height: 1.5;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid var(--md-sys-color-outline-variant);
    max-height: 68vh;
    overflow: auto;
    margin: 0;
  }
  .template-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
  .template-card {
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-small);
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 0.625rem;
  }
  .template-card__title {
    font-size: 0.8125rem;
    font-weight: 700;
  }
  .template-card__desc {
    font-size: 0.6875rem;
    color: var(--md-sys-color-on-surface-variant);
    margin: 0;
    line-height: 1.4;
  }
  .import-box {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    padding-top: 0.75rem;
  }
  .import-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
  }
  .import-error {
    font-size: 0.6875rem;
    color: var(--md-sys-color-error);
  }
  .snapshot-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 260px;
    overflow-y: auto;
  }
  .snapshot-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-extra-small);
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .preflight-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .issue-badge {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    font-weight: 700;
  }
  .issue-badge--pass {
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
  }
  .issue-badge--fail, .issue-badge--error {
    background-color: var(--md-sys-color-error);
    color: #fff;
  }
  .issue-badge--warn, .issue-badge--warning {
    background-color: #FBBF24;
    color: #1B1B1F;
  }
</style>
