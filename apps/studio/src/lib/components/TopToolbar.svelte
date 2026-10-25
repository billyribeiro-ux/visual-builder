<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import type { BreakpointKey } from '@app-viz/schema';

  const breakpoints: { key: BreakpointKey; label: string; icon: string; width: string }[] = [
    { key: 'mobile', label: 'Mobile', icon: '📱', width: '375px' },
    { key: 'tablet', label: 'Tablet', icon: '💻', width: '768px' },
    { key: 'desktop', label: 'Desktop', icon: '🖥️', width: '1280px' }
  ];

  let isExporting = $state(false);

  async function handleExport() {
    isExporting = true;
    try {
      await editor.exportHandoffPackage();
    } finally {
      isExporting = false;
    }
  }
</script>

<header class="studio-topbar">
  <!-- Left: Brand, Project Name & Save Status -->
  <div class="studio-topbar__left">
    <div class="brand">
      <div class="brand-icon">⚡</div>
      <span class="brand-name">{editor.blueprint.meta.name}</span>
    </div>

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
          Saved ({editor.lastSavedAt})
        </span>
      {/if}
    </div>

    <!-- Undo / Redo -->
    <div class="studio-btn-group">
      <button
        type="button"
        onclick={() => editor.undo()}
        disabled={!editor.canUndo}
        title="Undo (Ctrl+Z)"
        class="studio-btn"
      >
        ↺
      </button>
      <button
        type="button"
        onclick={() => editor.redo()}
        disabled={!editor.canRedo}
        title="Redo (Ctrl+Shift+Z)"
        class="studio-btn"
      >
        ↻
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
        class="studio-btn"
      >
        -
      </button>
      <span class="zoom-level">{editor.zoom}%</span>
      <button
        type="button"
        onclick={() => editor.setZoom(editor.zoom + 10)}
        class="studio-btn"
      >
        +
      </button>
    </div>
  </div>

  <!-- Right: Page Switcher, Mode Toggle & AI Export -->
  <div class="studio-topbar__right">
    <!-- Page Selector -->
    <select
      value={editor.activePageId}
      onchange={(e) => editor.setActivePage((e.target as HTMLSelectElement).value)}
      class="studio-select page-select"
    >
      {#each editor.blueprint.pages as page (page.id)}
        <option value={page.id}>{page.path} ({page.title.slice(0, 20)}...)</option>
      {/each}
    </select>

    <!-- Interactive Mode Toggle -->
    <button
      type="button"
      onclick={() => editor.toggleInteractiveMode()}
      class="studio-btn mode-btn {editor.isInteractiveMode ? 'mode-btn--interactive' : ''}"
    >
      <span>{editor.isInteractiveMode ? '▶ Interactive' : '✏️ Edit Mode'}</span>
    </button>

    <!-- Download Blueprint JSON -->
    <button
      type="button"
      onclick={() => editor.downloadBlueprintJson()}
      title="Download raw project.blueprint.json"
      class="studio-btn json-btn"
    >
      JSON
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
  .brand-name {
    font-weight: 700;
    font-size: 0.875rem;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface);
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
    min-width: 150px;
    max-width: 200px;
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
</style>
