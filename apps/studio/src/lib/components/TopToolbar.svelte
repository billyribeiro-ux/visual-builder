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

  let showPreflightModal = $state(false);
  let showCodeModal = $state(false);
  let activeCodeTab = $state<'page' | 'css' | 'agents' | 'blueprint'>('page');
  let copySuccess = $state(false);

  const saveLabel = $derived.by(() => {
    switch (editor.saveStatus) {
      case 'saving':
        return 'Saving…';
      case 'dirty':
        return 'Unsaved changes';
      case 'error':
        return 'Not saved — click for details';
      case 'saved':
        return editor.lastSavedAt
          ? `Saved ${new Date(editor.lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Saved';
      default:
        return editor.ready ? 'All changes saved' : 'Loading…';
    }
  });

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
    showPreflightModal = false;
    showCodeModal = false;
  }

  async function handleCopyCode() {
    if (!liveCodeOutput || typeof navigator === 'undefined') return;
    await navigator.clipboard.writeText(liveCodeOutput);
    copySuccess = true;
    setTimeout(() => (copySuccess = false), 2000);
  }

</script>

<header class="studio-topbar">
  <!-- Left: Brand, Editable Project Name, Templates, Save Status & History -->
  <div class="studio-topbar__left">
    <div class="brand">
      <div class="brand-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="9" height="9" rx="3" fill="#4285F4" />
          <rect x="13" y="2" width="9" height="9" rx="4.5" fill="#EA4335" />
          <rect x="2" y="13" width="9" height="9" rx="4.5" fill="#FBBC04" />
          <rect x="13" y="13" width="9" height="9" rx="3" fill="#34A853" />
        </svg>
      </div>
      <span class="google-md3-pill">MD3</span>
      <input
        type="text"
        aria-label="Project name"
        value={editor.blueprint.meta.name}
        onchange={(e) => editor.renameProject((e.target as HTMLInputElement).value)}
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
        editor.showNavigator = !editor.showNavigator;
      }}
      class="studio-btn {editor.showNavigator ? 'studio-btn--active' : 'top-pill-btn'}"
      title="Toggle Floating Structure Navigator (⌘I)"
    >
      📑 Structure
    </button>

    <button
      type="button"
      onclick={() => {
        editor.isInteractiveMode = false;
        editor.activeLeftTab = 'tokens';
      }}
      class="studio-btn {editor.activeLeftTab === 'tokens' && !editor.isInteractiveMode ? 'studio-btn--active' : 'top-pill-btn'}"
      title="Global Colors, Fonts & MD3 Design System (Site Settings)"
    >
      🎨 Site Settings
    </button>

    <button
      type="button"
      onclick={() => {
        closeAllModals();
        editor.showProjectLibrary = true;
      }}
      class="studio-btn top-pill-btn"
      title="Open, create, duplicate, import or export projects"
    >
      🗂 Projects
    </button>

    <div class="divider"></div>

    <button
      type="button"
      class="status-indicator status-btn"
      aria-live="polite"
      title={editor.saveError ?? 'Autosaved to this browser'}
      onclick={() => (editor.saveStatus === 'error' ? editor.saveNow() : (editor.showProjectLibrary = true))}
    >
      <span class="status {editor.saveStatus === 'error' ? 'status--error' : editor.saveStatus === 'saving' || editor.saveStatus === 'dirty' ? 'status--saving' : 'status--saved'}">
        <span class="status-dot {editor.saveStatus === 'saving' ? 'status-dot--pulse' : ''}"></span>
        {saveLabel}
      </span>
    </button>

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
          closeAllModals();
          editor.showProjectLibrary = true;
        }}
        title="Version history"
        aria-label="Version history ({editor.snapshots.length} saved versions)"
        class="studio-btn"
      >
        🕒 {editor.snapshots.length}
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

    <!-- Google MD3 Light / Dark Studio Theme Toggle -->
    <button
      type="button"
      onclick={() => editor.toggleStudioTheme()}
      title="Switch Google MD3 Studio Chrome ({editor.studioTheme === 'light' ? 'Dark' : 'Light'} Mode)"
      class="studio-btn json-btn"
      aria-label="Toggle Studio Light or Dark Theme"
    >
      {editor.studioTheme === 'light' ? '🌙' : '☀️'}
    </button>

    <!-- Interactive Mode Toggle (Full-Screen Preview like Elementor Eye Icon) -->
    <button
      type="button"
      onclick={() => editor.toggleInteractiveMode()}
      class="studio-btn mode-btn {editor.isInteractiveMode ? 'mode-btn--interactive' : ''}"
    >
      <span>{editor.isInteractiveMode ? '✏️ Back to Editor' : '👁 Preview'}</span>
    </button>

    <!-- Export build spec for Claude Code (any stack) -->
    <button
      type="button"
      onclick={() => {
        closeAllModals();
        editor.showExportDialog = true;
      }}
      class="studio-btn studio-btn--primary export-btn"
      title="Export a build spec for Claude Code (⌘E)"
    >
      <span>⚡</span>
      <span>Export for Claude Code</span>
    </button>
  </div>
</header>

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
    gap: 0.45rem;
  }
  .brand-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
    box-shadow: var(--md-sys-elevation-level1);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .google-md3-pill {
    font-family: var(--md-sys-font-heading);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.04em;
    padding: 0.15rem 0.45rem;
    border-radius: var(--md-sys-shape-corner-full);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .brand-name-input {
    font-family: var(--md-sys-font-heading);
    font-weight: 700;
    font-size: 0.875rem;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 0.2rem 0.45rem;
    width: 9rem;
  }
  .brand-name-input:hover,
  .brand-name-input:focus {
    border-color: var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
    outline: none;
  }
  .top-pill-btn {
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
    font-size: 0.75rem;
  }
  .divider {
    width: 1px;
    height: 18px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .status-indicator {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    font-weight: 600;
  }
  .status {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .status-btn {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
  }
  .status--error {
    color: var(--md-sys-color-error);
    font-weight: 700;
  }
  .status--error .status-dot {
    background-color: var(--md-sys-color-error);
  }
  .status--saved {
    color: var(--md-sys-color-success);
  }
  .status--saving {
    color: var(--md-sys-color-primary);
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
    border-radius: var(--md-sys-shape-corner-full);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .preflight-btn {
    font-size: 0.6875rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .preflight-btn--ok {
    color: var(--md-sys-color-success);
  }
  .preflight-btn--warn {
    color: var(--md-sys-color-error);
  }
  .mode-btn {
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .mode-btn--interactive {
    background-color: var(--md-sys-color-success-container) !important;
    color: var(--md-sys-color-on-success-container) !important;
    border-color: var(--md-sys-color-success) !important;
  }
  .json-btn {
    border: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .export-btn {
    font-size: 0.8125rem;
    letter-spacing: 0.01em;
  }
  .topbar-modal {
    position: fixed;
    top: 64px;
    left: 50%;
    transform: translateX(-50%);
    width: 560px;
    max-width: 94vw;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-extra-large, 28px);
    box-shadow: var(--md-sys-elevation-level4);
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
