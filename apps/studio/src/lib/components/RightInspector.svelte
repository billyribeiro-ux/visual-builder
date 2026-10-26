<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { getManifest } from '@app-viz/components';
  import type { BreakpointKey, InteractionRule } from '@app-viz/schema';

  let activeTab = $state<'props' | 'style' | 'interactions'>('props');
  let styleTargetMode = $state<'base' | 'breakpoint'>('base');

  const selectedNode = $derived(editor.selectedNode);
  const manifest = $derived(selectedNode ? getManifest(selectedNode.componentType) : null);
  const effectiveStyleBucket = $derived<'base' | BreakpointKey>(
    styleTargetMode === 'base' ? 'base' : editor.activeBreakpoint
  );

  const clickRule = $derived.by<InteractionRule | undefined>(() => {
    if (!selectedNode) return undefined;
    return (selectedNode.interactions || []).find((r) => r.trigger === 'onClick');
  });

  function updateProp(key: string, val: unknown) {
    if (!selectedNode) return;
    editor.dispatch({
      type: 'UPDATE_PROPS',
      nodeId: selectedNode.id,
      props: { [key]: val }
    });
  }

  function updateStyle(propName: string, val: string) {
    if (!selectedNode) return;
    editor.dispatch({
      type: 'UPDATE_STYLES',
      nodeId: selectedNode.id,
      breakpoint: effectiveStyleBucket,
      styles: { [propName]: val }
    });
  }

  function readStyle(propName: string): string {
    if (!selectedNode) return '';
    const bucket = selectedNode.styles?.[effectiveStyleBucket] as Record<string, string> | undefined;
    const baseBucket = selectedNode.styles?.base as Record<string, string> | undefined;
    return bucket?.[propName] ?? baseBucket?.[propName] ?? '';
  }

  function setClickInteraction(actionType: 'none' | 'navigate' | 'openModal' | 'submitForm', path?: string) {
    if (!selectedNode) return;
    const otherRules = (selectedNode.interactions || []).filter((r) => r.trigger !== 'onClick');
    if (actionType === 'none') {
      editor.dispatch({
        type: 'UPDATE_INTERACTIONS',
        nodeId: selectedNode.id,
        interactions: otherRules
      });
      return;
    }

    const newRule: InteractionRule = {
      id: clickRule?.id || crypto.randomUUID(),
      trigger: 'onClick',
      actionType,
      payload: {
        path: path || (clickRule?.payload?.path as string) || editor.blueprint.pages[0]?.path || '/'
      }
    };

    editor.dispatch({
      type: 'UPDATE_INTERACTIONS',
      nodeId: selectedNode.id,
      interactions: [...otherRules, newRule]
    });
  }
</script>

<aside class="studio-inspector">
  {#if selectedNode}
    <!-- Node Header -->
    <div class="inspector-header">
      <div style="min-width: 0; flex: 1;">
        <div class="header-row">
          <input
            type="text"
            aria-label="Component display name"
            value={selectedNode.name}
            onchange={(e) =>
              editor.dispatch({
                type: 'UPDATE_NODE_META',
                nodeId: selectedNode.id,
                meta: { name: (e.target as HTMLInputElement).value }
              })}
            class="node-name-input"
          />
          <span class="node-type-badge">
            {selectedNode?.componentType
              ? selectedNode.componentType.split('/')[1] || selectedNode.componentType
              : ''}
          </span>
        </div>
        <div class="node-id truncate">
          {selectedNode.componentType} • {selectedNode.id.slice(0, 8)}
        </div>
      </div>

      <div class="header-actions">
        <button
          type="button"
          title="Move Up"
          onclick={() =>
            editor.dispatch({ type: 'REORDER_NODE', nodeId: selectedNode.id, direction: 'up' })}
          class="action-btn"
        >
          ↑
        </button>
        <button
          type="button"
          title="Move Down"
          onclick={() =>
            editor.dispatch({ type: 'REORDER_NODE', nodeId: selectedNode.id, direction: 'down' })}
          class="action-btn"
        >
          ↓
        </button>
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

    <!-- Tab 1: Content & Schema Props -->
    {#if activeTab === 'props'}
      <div class="studio-panel-content flow-v">
        {#each Object.entries(selectedNode.props || {}) as [propKey, propVal] (propKey)}
          {@const controlMeta = manifest?.propControls?.[propKey]}
          <div class="field-item">
            <label for="prop-{propKey}" class="field-label">
              {controlMeta?.label || propKey}
            </label>

            {#if controlMeta?.type === 'select' && controlMeta.options}
              <select
                id="prop-{propKey}"
                value={String(propVal ?? '')}
                onchange={(e) => updateProp(propKey, (e.target as HTMLSelectElement).value)}
                class="studio-select"
              >
                {#each controlMeta.options as opt (opt.value)}
                  <option value={opt.value}>{opt.label}</option>
                {/each}
              </select>
            {:else if typeof propVal === 'boolean'}
              <label class="checkbox-row">
                <input
                  id="prop-{propKey}"
                  type="checkbox"
                  checked={propVal}
                  onchange={(e) => updateProp(propKey, (e.target as HTMLInputElement).checked)}
                  class="studio-checkbox"
                />
                <span class="checkbox-text">Enabled</span>
              </label>
            {:else if typeof propVal === 'number'}
              <input
                id="prop-{propKey}"
                type="number"
                value={propVal}
                oninput={(e) =>
                  updateProp(propKey, parseFloat((e.target as HTMLInputElement).value) || 0)}
                class="studio-input"
              />
            {:else if Array.isArray(propVal) || typeof propVal === 'object'}
              <textarea
                id="prop-{propKey}"
                rows={5}
                value={JSON.stringify(propVal, null, 2)}
                onchange={(e) => {
                  try {
                    const parsed = JSON.parse((e.target as HTMLTextAreaElement).value);
                    updateProp(propKey, parsed);
                  } catch {
                    // Keep valid state on syntax error
                  }
                }}
                class="studio-textarea font-mono"
              ></textarea>
            {:else}
              <input
                id="prop-{propKey}"
                type="text"
                value={String(propVal ?? '')}
                oninput={(e) => updateProp(propKey, (e.target as HTMLInputElement).value)}
                class="studio-input"
              />
            {/if}
          </div>
        {/each}
      </div>

    <!-- Tab 2: Visual Styles (MD3 & Responsive Cascade) -->
    {:else if activeTab === 'style'}
      <div class="studio-panel-content flow-v">
        <div class="bp-target-bar">
          <button
            type="button"
            onclick={() => (styleTargetMode = 'base')}
            class="bp-target-btn {styleTargetMode === 'base' ? 'bp-target-btn--active' : ''}"
          >
            Base (All Screens)
          </button>
          <button
            type="button"
            onclick={() => (styleTargetMode = 'breakpoint')}
            class="bp-target-btn {styleTargetMode === 'breakpoint' ? 'bp-target-btn--active' : ''}"
          >
            Override: {editor.activeBreakpoint}
          </button>
        </div>

        <div class="section-title">Layout & Flex/Grid</div>
        <div class="grid-2">
          <div class="field-item">
            <label for="style-display" class="field-label">Display</label>
            <select
              id="style-display"
              value={readStyle('display')}
              onchange={(e) => updateStyle('display', (e.target as HTMLSelectElement).value)}
              class="studio-select"
            >
              <option value="">(Default)</option>
              <option value="block">block</option>
              <option value="flex">flex</option>
              <option value="grid">grid</option>
              <option value="inline-flex">inline-flex</option>
              <option value="none">none</option>
            </select>
          </div>
          <div class="field-item">
            <label for="style-gap" class="field-label">Gap</label>
            <input
              id="style-gap"
              type="text"
              placeholder="e.g. 1.5rem"
              value={readStyle('gap')}
              onchange={(e) => updateStyle('gap', (e.target as HTMLInputElement).value)}
              class="studio-input"
            />
          </div>
        </div>

        <div class="section-title">Spacing & Dimensions</div>
        <div class="grid-2">
          <div class="field-item">
            <label for="style-padding" class="field-label">Padding</label>
            <input
              id="style-padding"
              type="text"
              placeholder="e.g. 2rem 1.5rem"
              value={readStyle('padding')}
              onchange={(e) => updateStyle('padding', (e.target as HTMLInputElement).value)}
              class="studio-input"
            />
          </div>
          <div class="field-item">
            <label for="style-margin" class="field-label">Margin</label>
            <input
              id="style-margin"
              type="text"
              placeholder="e.g. 0 auto"
              value={readStyle('margin')}
              onchange={(e) => updateStyle('margin', (e.target as HTMLInputElement).value)}
              class="studio-input"
            />
          </div>
          <div class="field-item">
            <label for="style-width" class="field-label">Width</label>
            <input
              id="style-width"
              type="text"
              placeholder="e.g. 100%"
              value={readStyle('width')}
              onchange={(e) => updateStyle('width', (e.target as HTMLInputElement).value)}
              class="studio-input"
            />
          </div>
          <div class="field-item">
            <label for="style-min-height" class="field-label">Min Height</label>
            <input
              id="style-min-height"
              type="text"
              placeholder="e.g. 60vh"
              value={readStyle('minHeight')}
              onchange={(e) => updateStyle('minHeight', (e.target as HTMLInputElement).value)}
              class="studio-input"
            />
          </div>
        </div>

        <div class="section-title">MD3 Surface, Color & Shape</div>
        <div class="field-item">
          <label for="style-bg" class="field-label">Background Color</label>
          <input
            id="style-bg"
            type="text"
            placeholder="var(--md-sys-color-surface-container)"
            value={readStyle('backgroundColor')}
            onchange={(e) => updateStyle('backgroundColor', (e.target as HTMLInputElement).value)}
            class="studio-input"
          />
        </div>
        <div class="field-item">
          <label for="style-color" class="field-label">Text Color</label>
          <input
            id="style-color"
            type="text"
            placeholder="var(--md-sys-color-on-surface)"
            value={readStyle('color')}
            onchange={(e) => updateStyle('color', (e.target as HTMLInputElement).value)}
            class="studio-input"
          />
        </div>
        <div class="grid-2">
          <div class="field-item">
            <label for="style-radius" class="field-label">Corner Radius</label>
            <input
              id="style-radius"
              type="text"
              placeholder="16px"
              value={readStyle('borderRadius')}
              onchange={(e) => updateStyle('borderRadius', (e.target as HTMLInputElement).value)}
              class="studio-input"
            />
          </div>
          <div class="field-item">
            <label for="style-align" class="field-label">Text Align</label>
            <select
              id="style-align"
              value={readStyle('textAlign')}
              onchange={(e) => updateStyle('textAlign', (e.target as HTMLSelectElement).value)}
              class="studio-select"
            >
              <option value="">(Default)</option>
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
            </select>
          </div>
        </div>
      </div>

    <!-- Tab 3: Declarative Interactions & Routing -->
    {:else if activeTab === 'interactions'}
      <div class="studio-panel-content flow-v">
        <div class="section-title">Declarative Event Rules</div>
        <p class="panel-sub">
          Rules defined here are stored in `node.interactions`, executed in Interactive Mode, and exported to `blueprint/interaction-graph.json`.
        </p>

        <div class="field-item">
          <label for="click-action" class="field-label">On Click Action</label>
          <select
            id="click-action"
            value={clickRule?.actionType || 'none'}
            onchange={(e) =>
              setClickInteraction(
                (e.target as HTMLSelectElement).value as 'none' | 'navigate' | 'openModal' | 'submitForm'
              )}
            class="studio-select"
          >
            <option value="none">None (Component Default)</option>
            <option value="navigate">Navigate to Page Route</option>
            <option value="openModal">Open Modal Dialog</option>
            <option value="submitForm">Submit Form Action</option>
          </select>
        </div>

        {#if clickRule?.actionType === 'navigate'}
          <div class="field-item">
            <label for="target-route" class="field-label">Target Page Route</label>
            <select
              id="target-route"
              value={(clickRule.payload?.path as string) || '/'}
              onchange={(e) =>
                setClickInteraction('navigate', (e.target as HTMLSelectElement).value)}
              class="studio-select"
            >
              {#each editor.blueprint.pages as p (p.id)}
                <option value={p.path}>{p.path} ({p.title})</option>
              {/each}
            </select>
          </div>
        {/if}

        <div class="section-title" style="margin-top: 0.5rem;">Visibility & Lock State</div>
        <label class="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(selectedNode.locked)}
            onchange={(e) =>
              editor.dispatch({
                type: 'UPDATE_NODE_META',
                nodeId: selectedNode.id,
                meta: { locked: (e.target as HTMLInputElement).checked }
              })}
            class="studio-checkbox"
          />
          <span class="checkbox-text">Lock element on canvas</span>
        </label>
      </div>
    {/if}
  {:else}
    <!-- Empty State -->
    <div class="empty-state">
      <div class="empty-icon">👆</div>
      <div class="empty-title">No Element Selected</div>
      <p class="empty-desc">
        Click any component on the visual canvas or in the Layers tree to inspect and edit its props, responsive MD3 styles, and interactions.
      </p>
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
    gap: 0.5rem;
  }
  .header-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }
  .node-name-input {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--md-sys-color-on-surface);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 4px;
    padding: 0.125rem 0.25rem;
    min-width: 0;
    width: 8.5rem;
  }
  .node-name-input:hover,
  .node-name-input:focus {
    border-color: var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container);
    outline: none;
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
    gap: 0.125rem;
  }
  .action-btn {
    padding: 0.25rem 0.35rem;
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
    gap: 0.875rem;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }
  .bp-target-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.25rem;
    background-color: var(--md-sys-color-surface-container);
    padding: 0.25rem;
    border-radius: var(--md-sys-shape-corner-extra-small);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .bp-target-btn {
    font-size: 0.6875rem;
    padding: 0.3rem 0.5rem;
    border-radius: 3px;
    color: var(--md-sys-color-on-surface-variant);
  }
  .bp-target-btn--active {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-weight: 600;
  }
  .field-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .field-label {
    font-size: 0.6875rem;
    font-weight: 600;
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
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--md-sys-color-on-surface-variant);
    padding-top: 0.25rem;
  }
  .panel-sub {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    line-height: 1.4;
    margin: 0;
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
