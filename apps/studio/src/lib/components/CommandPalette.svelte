<script lang="ts">
  import { editor, isContainerComponent } from '../state/editor.svelte.js';
  import { getAllManifests } from '@app-viz/components';
  import { MD3_THEME_PRESETS, type BlueprintNode } from '@app-viz/schema';

  let query = $state('');
  let activeMode = $state<'commands' | 'composer'>('composer');
  let aiPrompt = $state('');
  let applySuggestedTheme = $state(true);
  let lastComposedMessage = $state('');

  const quickPromptPresets = [
    'Add an AI agent hero, stats bar, and 3-tier pricing table',
    'Build a FinTech KPI dashboard with live data table',
    'Add customer testimonials, FAQ accordion, and newsletter signup',
    'Create an enterprise contact form and SSO authentication card'
  ];

  interface CommandItem {
    id: string;
    group: string;
    label: string;
    hint: string;
    run: () => void;
  }

  const allCommands = $derived.by<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Canvas & View Commands
    items.push(
      {
        id: 'view-flow',
        group: 'View & Mode',
        label:
          editor.canvasViewMode === 'flow'
            ? 'Switch to Responsive Page Canvas'
            : 'Open App Route & Interaction Flow Map',
        hint: 'Architecture Graph',
        run: () => {
          editor.canvasViewMode = editor.canvasViewMode === 'flow' ? 'canvas' : 'flow';
          editor.showCommandPalette = false;
        }
      },
      {
        id: 'view-interactive',
        group: 'View & Mode',
        label: editor.isInteractiveMode
          ? 'Switch to Design / Edit Mode'
          : 'Switch to Interactive Live App Preview',
        hint: 'Toggle Preview',
        run: () => {
          editor.isInteractiveMode = !editor.isInteractiveMode;
          editor.showCommandPalette = false;
        }
      },
      {
        id: 'bp-mobile',
        group: 'Viewport',
        label: 'Viewport: Mobile (375px)',
        hint: 'Breakpoint',
        run: () => {
          editor.setBreakpoint('mobile');
          editor.showCommandPalette = false;
        }
      },
      {
        id: 'bp-tablet',
        group: 'Viewport',
        label: 'Viewport: Tablet (768px)',
        hint: 'Breakpoint',
        run: () => {
          editor.setBreakpoint('tablet');
          editor.showCommandPalette = false;
        }
      },
      {
        id: 'bp-desktop',
        group: 'Viewport',
        label: 'Viewport: Desktop (1280px)',
        hint: 'Breakpoint',
        run: () => {
          editor.setBreakpoint('desktop');
          editor.showCommandPalette = false;
        }
      }
    );

    // 2. Page Routes
    for (const p of editor.blueprint.pages) {
      items.push({
        id: `route-${p.id}`,
        group: 'Navigate to Route',
        label: `${p.path} — ${p.title}`,
        hint: 'Route',
        run: () => {
          editor.setActivePage(p.id);
          editor.canvasViewMode = 'canvas';
          editor.showCommandPalette = false;
        }
      });
    }

    // 3. MD3 Theme Presets
    for (const [presetKey, preset] of Object.entries(MD3_THEME_PRESETS)) {
      items.push({
        id: `theme-${presetKey}`,
        group: 'Google MD3 Theme',
        label: `Apply Theme: ${preset.label}`,
        hint: presetKey,
        run: () => {
          editor.dispatch({
            type: 'UPDATE_TOKENS',
            tokens: { colors: { ...preset.colors } }
          });
          editor.showCommandPalette = false;
        }
      });
    }

    // 4. All 25 Library Components
    for (const m of getAllManifests()) {
      items.push({
        id: `insert-${m.type}`,
        group: 'Insert Component',
        label: `Insert ${m.displayName}`,
        hint: m.type,
        run: () => {
          if (!editor.activePage) return;
          const newNode: BlueprintNode = {
            id: crypto.randomUUID(),
            componentType: m.type,
            name: m.displayName,
            props: JSON.parse(JSON.stringify(m.defaultProps)),
            styles: { base: {} },
            interactions: [],
            children: [],
            locked: false,
            hidden: false,
            customClasses: ''
          };
          const selected = editor.selectedNode;
          const targetParentId =
            selected && isContainerComponent(selected.componentType)
              ? selected.id
              : editor.activePage.rootNode.id;

          editor.dispatch({
            type: 'INSERT_NODE',
            targetParentId,
            node: newNode
          });
          editor.selectNode(newNode.id);
          editor.showCommandPalette = false;
        }
      });
    }

    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q) ||
        i.hint.toLowerCase().includes(q)
    );
  });

  function handleRunCompose() {
    if (!aiPrompt.trim()) return;
    const res = editor.composeFromPrompt(aiPrompt, applySuggestedTheme);
    lastComposedMessage = res.summary;
    aiPrompt = '';
    setTimeout(() => {
      editor.showCommandPalette = false;
      lastComposedMessage = '';
    }, 650);
  }
</script>

{#if editor.showCommandPalette}
  <div class="cmd-backdrop" role="dialog" aria-modal="true" aria-label="Command Palette and AI Section Composer">
    <div class="cmd-modal">
      <div class="cmd-header">
        <div class="cmd-tabs">
          <button
            type="button"
            onclick={() => (activeMode = 'composer')}
            class="cmd-tab {activeMode === 'composer' ? 'cmd-tab--active' : ''}"
          >
            ✨ AI Prompt Composer
          </button>
          <button
            type="button"
            onclick={() => (activeMode = 'commands')}
            class="cmd-tab {activeMode === 'commands' ? 'cmd-tab--active' : ''}"
          >
            ⚡ Quick Commands ({allCommands.length})
          </button>
        </div>
        <button
          type="button"
          onclick={() => (editor.showCommandPalette = false)}
          class="cmd-close"
          aria-label="Close Command Palette"
        >
          ESC ✕
        </button>
      </div>

      {#if activeMode === 'composer'}
        <div class="cmd-composer-body">
          <label for="ai-prompt-input" class="cmd-label">
            Describe the sections, metrics, or layout you want to add to <strong>{editor.activePage?.path}</strong>:
          </label>
          <div class="cmd-prompt-row">
            <input
              id="ai-prompt-input"
              type="text"
              placeholder="e.g. Add an AI agent hero, stats bar, and 3-tier pricing table..."
              bind:value={aiPrompt}
              onkeydown={(e) => {
                if (e.key === 'Enter') handleRunCompose();
              }}
              class="studio-input cmd-prompt-input"
            />
            <button
              type="button"
              onclick={handleRunCompose}
              disabled={!aiPrompt.trim()}
              class="studio-btn studio-btn--primary"
            >
              Compose ↵
            </button>
          </div>

          <label class="cmd-checkbox-row">
            <input type="checkbox" bind:checked={applySuggestedTheme} />
            <span>Automatically apply matching Google MD3 domain theme preset (AI Violet / FinTech Emerald)</span>
          </label>

          {#if lastComposedMessage}
            <div class="cmd-toast">
              ✓ {lastComposedMessage}
            </div>
          {/if}

          <div class="cmd-presets">
            <div class="cmd-presets-title">1-Click Prompt Presets</div>
            <div class="cmd-preset-grid">
              {#each quickPromptPresets as preset (preset)}
                <button
                  type="button"
                  onclick={() => {
                    aiPrompt = preset;
                    handleRunCompose();
                  }}
                  class="cmd-preset-chip"
                >
                  ✨ {preset}
                </button>
              {/each}
            </div>
          </div>
        </div>
      {:else}
        <div class="cmd-search-bar">
          <input
            type="search"
            aria-label="Search commands, routes, themes, or components"
            placeholder="Filter routes, view modes, MD3 themes, or 25 components..."
            bind:value={query}
            class="studio-input"
          />
        </div>
        <div class="cmd-list">
          {#each allCommands as item (item.id)}
            <button type="button" onclick={item.run} class="cmd-item">
              <div class="cmd-item-left">
                <span class="cmd-item-group">{item.group}</span>
                <span class="cmd-item-label">{item.label}</span>
              </div>
              <span class="cmd-item-hint">{item.hint}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .cmd-backdrop {
    position: fixed;
    inset: 0;
    z-index: 120;
    background: rgba(0, 0, 0, 0.62);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  }
  .cmd-modal {
    width: min(40rem, 94vw);
    background: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 16px;
    box-shadow: var(--md-sys-elevation-level4);
    overflow: hidden;
  }
  .cmd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.875rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container-low);
  }
  .cmd-tabs {
    display: flex;
    gap: 0.375rem;
  }
  .cmd-tab {
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
  }
  .cmd-tab--active {
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    border-color: var(--md-sys-color-primary);
  }
  .cmd-close {
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background: transparent;
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    font-family: var(--md-sys-font-mono);
    cursor: pointer;
  }
  .cmd-composer-body {
    padding: 1.125rem;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  .cmd-label {
    font-size: 0.8125rem;
    color: var(--md-sys-color-on-surface);
  }
  .cmd-prompt-row {
    display: flex;
    gap: 0.5rem;
  }
  .cmd-prompt-input {
    flex: 1;
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
  }
  .cmd-checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
  }
  .cmd-toast {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    background: var(--md-sys-color-tertiary-container);
    color: var(--md-sys-color-on-tertiary-container);
    font-size: 0.75rem;
    font-weight: 600;
  }
  .cmd-presets-title {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--md-sys-color-on-surface-variant);
    margin-bottom: 0.5rem;
  }
  .cmd-preset-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .cmd-preset-chip {
    text-align: left;
    padding: 0.5rem 0.625rem;
    border-radius: 10px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
    font-size: 0.75rem;
    line-height: 1.35;
    cursor: pointer;
    transition: border-color 140ms ease, background-color 140ms ease;
  }
  .cmd-preset-chip:hover {
    border-color: var(--md-sys-color-primary);
    background: var(--md-sys-color-surface-container-high);
  }
  .cmd-search-bar {
    padding: 0.75rem 0.875rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .cmd-list {
    max-height: 20rem;
    overflow-y: auto;
    padding: 0.375rem;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .cmd-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.625rem;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--md-sys-color-on-surface);
    text-align: left;
    cursor: pointer;
  }
  .cmd-item:hover {
    background: var(--md-sys-color-surface-container-high);
  }
  .cmd-item-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .cmd-item-group {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    background: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-primary);
  }
  .cmd-item-label {
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .cmd-item-hint {
    font-size: 0.6875rem;
    font-family: var(--md-sys-font-mono);
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
