<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { getManifest } from '@app-viz/components';
  import type { BreakpointKey } from '@app-viz/schema';

  let activeTab = $state<'props' | 'style' | 'interactions'>('props');

  const selectedNode = $derived(editor.selectedNode);
  const manifest = $derived(selectedNode ? getManifest(selectedNode.componentType) : null);

  function updateProp(key: string, val: any) {
    if (!selectedNode) return;
    editor.dispatch({
      type: 'UPDATE_PROPS',
      nodeId: selectedNode.id,
      props: { [key]: val }
    });
  }

  function updateStyle(propName: string, val: string, bp: BreakpointKey | 'base' = 'base') {
    if (!selectedNode) return;
    editor.dispatch({
      type: 'UPDATE_STYLES',
      nodeId: selectedNode.id,
      breakpoint: bp,
      styles: { [propName]: val }
    });
  }
</script>

<aside class="studio-inspector">
  {#if selectedNode}
    <!-- Node Header -->
    <div class="inspector-header">
      <div>
        <div class="header-row">
          <span class="node-name">{selectedNode.name}</span>
          <span class="node-type-badge">
            {selectedNode?.componentType ? (selectedNode.componentType.split('/')[1] || selectedNode.componentType) : ''}
          </span>
        </div>
        <div class="node-id truncate">
          {selectedNode.id}
        </div>
      </div>

      <div class="header-actions">
        <button
          type="button"
          title="Duplicate"
          onclick={() => editor.dispatch({ type: 'DUPLICATE_NODE', nodeId: selectedNode.id })}
          class="action-btn"
        >
          ⧉
        </button>
        <button
          type="button"
          title="Delete"
          onclick={() => {
            editor.dispatch({ type: 'DELETE_NODE', nodeId: selectedNode.id });
            editor.selectNode(null);
          }}
          class="action-btn action-btn--danger"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Inspector Tabs -->
    <div class="studio-tabs">
      <button
        type="button"
        onclick={() => (activeTab = 'props')}
        class="studio-tab {activeTab === 'props' ? 'studio-tab--active' : ''}"
      >
        Content
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'style')}
        class="studio-tab {activeTab === 'style' ? 'studio-tab--active' : ''}"
      >
        Styles
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'interactions')}
        class="studio-tab {activeTab === 'interactions' ? 'studio-tab--active' : ''}"
      >
        Events
      </button>
    </div>

    <!-- Tab 1: Content & Props -->
    {#if activeTab === 'props'}
      <div class="studio-panel-content flow-v">
        {#each Object.entries(selectedNode.props || {}) as [propKey, propVal] (propKey)}
          <div class="field-item">
            <label for="prop-{propKey}" class="field-label">{propKey}</label>
            {#if typeof propVal === 'boolean'}
              <label class="checkbox-row">
                <input
                  id="prop-{propKey}"
                  type="checkbox"
                  checked={propVal}
                  onchange={(e) => updateProp(propKey, (e.target as HTMLInputElement).checked)}
                  class="studio-checkbox"
                />
                <span class="checkbox-text">Enable {propKey}</span>
              </label>
            {:else if typeof propVal === 'number'}
              <input
                id="prop-{propKey}"
                type="number"
                value={propVal}
                oninput={(e) => updateProp(propKey, parseFloat((e.target as HTMLInputElement).value) || 0)}
                class="studio-input"
              />
            {:else if Array.isArray(propVal) || typeof propVal === 'object'}
              <textarea
                id="prop-{propKey}"
                rows="4"
                value={JSON.stringify(propVal, null, 2)}
                onchange={(e) => {
                  try {
                    const parsed = JSON.parse((e.target as HTMLTextAreaElement).value);
                    updateProp(propKey, parsed);
                  } catch (err) {
                    console.error('Invalid JSON', err);
                  }
                }}
                class="studio-textarea font-mono"
              ></textarea>
            {:else}
              <input
                id="prop-{propKey}"
                type="text"
                value={propVal}
                oninput={(e) => updateProp(propKey, (e.target as HTMLInputElement).value)}
                class="studio-input"
              />
            {/if}
          </div>
        {/each}
      </div>

    <!-- Tab 2: Visual Styles -->
    {:else if activeTab === 'style'}
      <div class="studio-panel-content flow-v">
        <div class="section-title">Breakpoint: {editor.activeBreakpoint}</div>

        <div class="field-item">
          <label for="style-padding" class="field-label">Padding</label>
          <input
            id="style-padding"
            type="text"
            placeholder="e.g. 1rem or 16px"
            value={selectedNode.styles?.[editor.activeBreakpoint]?.padding || selectedNode.styles?.base?.padding || ''}
            onchange={(e) => updateStyle('padding', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <label for="style-margin" class="field-label">Margin</label>
          <input
            id="style-margin"
            type="text"
            placeholder="e.g. 0 auto or 2rem"
            value={selectedNode.styles?.[editor.activeBreakpoint]?.margin || selectedNode.styles?.base?.margin || ''}
            onchange={(e) => updateStyle('margin', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <label for="style-bg" class="field-label">Background Color</label>
          <input
            id="style-bg"
            type="text"
            placeholder="e.g. #ffffff or var(--md-sys-color-surface)"
            value={selectedNode.styles?.[editor.activeBreakpoint]?.backgroundColor || selectedNode.styles?.base?.backgroundColor || ''}
            onchange={(e) => updateStyle('backgroundColor', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <label for="style-color" class="field-label">Text Color</label>
          <input
            id="style-color"
            type="text"
            placeholder="e.g. var(--md-sys-color-on-surface)"
            value={selectedNode.styles?.[editor.activeBreakpoint]?.color || selectedNode.styles?.base?.color || ''}
            onchange={(e) => updateStyle('color', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <label for="style-radius" class="field-label">Border Radius</label>
          <input
            id="style-radius"
            type="text"
            placeholder="e.g. 12px or var(--md-sys-shape-corner-medium)"
            value={selectedNode.styles?.[editor.activeBreakpoint]?.borderRadius || selectedNode.styles?.base?.borderRadius || ''}
            onchange={(e) => updateStyle('borderRadius', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <label for="style-display" class="field-label">Display</label>
          <select
            id="style-display"
            value={selectedNode.styles?.[editor.activeBreakpoint]?.display || selectedNode.styles?.base?.display || ''}
            onchange={(e) => updateStyle('display', (e.target as HTMLSelectElement).value, editor.activeBreakpoint)}
            class="studio-select"
          >
            <option value="">(Default)</option>
            <option value="flex">flex</option>
            <option value="grid">grid</option>
            <option value="block">block</option>
            <option value="inline-block">inline-block</option>
            <option value="none">none</option>
          </select>
        </div>
      </div>

    <!-- Tab 3: Interactions & Events -->
    {:else if activeTab === 'interactions'}
      <div class="studio-panel-content flow-v">
        <div class="section-title">Interactions & Routing</div>
        <p class="panel-sub">Configure live navigation, modal dialog triggers, and form submit handlers.</p>

        <div class="field-item">
          <label for="click-action" class="field-label">Click Action Target</label>
          <select id="click-action" class="studio-select">
            <option value="none">None (Static Element)</option>
            <option value="navigate">Navigate to Page</option>
            <option value="modal">Open Modal Dialog</option>
            <option value="submit">Submit Form</option>
          </select>
        </div>

        <div class="field-item">
          <label for="target-route" class="field-label">Target Page Route</label>
          <select id="target-route" class="studio-select">
            {#each editor.blueprint.pages as p (p.id)}
              <option value={p.path}>{p.path} ({p.title})</option>
            {/each}
          </select>
        </div>
      </div>
    {/if}
  {:else}
    <!-- Empty State -->
    <div class="empty-state">
      <div class="empty-icon">👆</div>
      <div class="empty-title">No Element Selected</div>
      <p class="empty-desc">Click any component on the visual canvas to inspect and edit its content, responsive styles, and interactions.</p>
    </div>
  {/if}
</aside>

<style>
  .inspector-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .header-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .node-name {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
  }
  .node-type-badge {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    padding: 0.125rem 0.375rem;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .node-id {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    color: var(--md-sys-color-outline);
    margin-top: 0.125rem;
    max-width: 180px;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  .action-btn {
    padding: 0.25rem 0.375rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    transition: all var(--md-sys-motion-duration-short);
  }
  .action-btn:hover {
    color: var(--md-sys-color-on-surface);
    background-color: rgba(255, 255, 255, 0.08);
  }
  .action-btn--danger:hover {
    color: var(--md-sys-color-error);
  }
  .flow-v {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .field-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .field-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: capitalize;
    color: var(--md-sys-color-on-surface-variant);
  }
  .checkbox-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface);
    cursor: pointer;
  }
  .studio-checkbox {
    width: 16px;
    height: 16px;
    accent-color: var(--md-sys-color-primary);
  }
  .checkbox-text {
    user-select: none;
  }
  .font-mono {
    font-family: var(--md-sys-font-mono);
    font-size: 0.6875rem;
  }
  .section-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--md-sys-color-on-surface-variant);
  }
  .panel-sub {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.4;
  }
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }
  .empty-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
    opacity: 0.6;
  }
  .empty-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
    margin-bottom: 0.5rem;
  }
  .empty-desc {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.5;
  }
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
