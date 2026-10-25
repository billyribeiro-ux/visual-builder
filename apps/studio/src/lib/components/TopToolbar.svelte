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

<header class="h-14 border-b border-[var(--color-studio-border)] bg-[var(--color-studio-panel)] px-4 flex items-center justify-between z-30 select-none">
  <!-- Left: Brand, Project Name & Save Status -->
  <div class="flex items-center gap-4">
    <div class="flex items-center gap-2">
      <div class="h-7 w-7 rounded bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow">
        ⚡
      </div>
      <span class="font-bold text-sm tracking-tight text-white">{editor.blueprint.meta.name}</span>
    </div>

    <div class="h-4 w-[1px] bg-[var(--color-studio-border)]"></div>

    <div class="flex items-center gap-2 text-xs">
      {#if editor.isSaving}
        <span class="flex items-center gap-1.5 text-amber-400">
          <span class="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
          Saving...
        </span>
      {:else}
        <span class="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Saved ({editor.lastSavedAt})
        </span>
      {/if}
    </div>

    <!-- Undo / Redo -->
    <div class="flex items-center bg-slate-800/80 rounded border border-[var(--color-studio-border)] p-0.5">
      <button
        type="button"
        onclick={() => editor.undo()}
        disabled={!editor.canUndo}
        title="Undo (Ctrl+Z)"
        class="px-2 py-1 text-xs rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200"
      >
        ↺
      </button>
      <button
        type="button"
        onclick={() => editor.redo()}
        disabled={!editor.canRedo}
        title="Redo (Ctrl+Shift+Z)"
        class="px-2 py-1 text-xs rounded hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200"
      >
        ↻
      </button>
    </div>
  </div>

  <!-- Center: Viewport Breakpoint Switcher & Zoom -->
  <div class="flex items-center gap-4">
    <div class="flex items-center bg-slate-800/80 rounded border border-[var(--color-studio-border)] p-0.5">
      {#each breakpoints as bp}
        <button
          type="button"
          onclick={() => editor.setBreakpoint(bp.key)}
          class="flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors {editor.activeBreakpoint === bp.key ? 'bg-blue-600 text-white font-semibold shadow' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}"
        >
          <span>{bp.icon}</span>
          <span>{bp.label}</span>
          <span class="text-[10px] opacity-60">({bp.width})</span>
        </button>
      {/each}
    </div>

    <div class="flex items-center bg-slate-800/80 rounded border border-[var(--color-studio-border)] p-0.5 text-xs text-slate-300">
      <button
        type="button"
        onclick={() => editor.setZoom(editor.zoom - 10)}
        class="px-2 py-1 hover:bg-slate-700 rounded"
      >
        -
      </button>
      <span class="px-2 font-mono text-[11px]">{editor.zoom}%</span>
      <button
        type="button"
        onclick={() => editor.setZoom(editor.zoom + 10)}
        class="px-2 py-1 hover:bg-slate-700 rounded"
      >
        +
      </button>
    </div>
  </div>

  <!-- Right: Page Switcher, Mode Toggle & AI Export -->
  <div class="flex items-center gap-3">
    <!-- Page Selector -->
    <select
      value={editor.activePageId}
      onchange={(e) => editor.setActivePage((e.target as HTMLSelectElement).value)}
      class="bg-slate-800 border border-[var(--color-studio-border)] rounded text-xs px-2.5 py-1.5 text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {#each editor.blueprint.pages as page}
        <option value={page.id}>{page.path} ({page.title.slice(0, 20)}...)</option>
      {/each}
    </select>

    <!-- Interactive Mode Toggle -->
    <button
      type="button"
      onclick={() => editor.toggleInteractiveMode()}
      class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded font-medium border transition-colors {editor.isInteractiveMode ? 'bg-emerald-600 border-emerald-500 text-white shadow' : 'bg-slate-800 border-[var(--color-studio-border)] text-slate-300 hover:bg-slate-700'}"
    >
      <span>{editor.isInteractiveMode ? '▶ Interactive' : '✏️ Edit Mode'}</span>
    </button>

    <!-- Download Blueprint JSON -->
    <button
      type="button"
      onclick={() => editor.downloadBlueprintJson()}
      title="Download raw project.blueprint.json"
      class="px-2.5 py-1.5 text-xs rounded border border-[var(--color-studio-border)] bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
    >
      JSON
    </button>

    <!-- Export for AI Agents ZIP Button -->
    <button
      type="button"
      onclick={handleExport}
      disabled={isExporting}
      class="flex items-center gap-2 px-4 py-1.5 text-xs rounded font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md transition-all active:scale-95 disabled:opacity-50"
    >
      <span>⚡</span>
      <span>{isExporting ? 'Generating ZIP...' : 'Export for AI Agents'}</span>
    </button>
  </div>
</header>
