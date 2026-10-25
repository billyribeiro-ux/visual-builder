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

<aside class="w-80 border-l border-[var(--color-studio-border)] bg-[var(--color-studio-panel)] flex flex-col h-[calc(100vh-3.5rem)] select-none">
  {#if selectedNode}
    <!-- Node Header -->
    <div class="p-4 border-b border-[var(--color-studio-border)] flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-white">{selectedNode.name}</span>
          <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
            {selectedNode.componentType.split('/')[1] || selectedNode.componentType}
          </span>
        </div>
        <div class="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[180px]">
          {selectedNode.id}
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          title="Duplicate"
          onclick={() => editor.dispatch({ type: 'DUPLICATE_NODE', nodeId: selectedNode.id })}
          class="p-1 text-slate-400 hover:text-white text-xs rounded hover:bg-slate-800"
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
          class="p-1 text-slate-400 hover:text-red-400 text-xs rounded hover:bg-slate-800"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Inspector Tabs -->
    <div class="flex border-b border-[var(--color-studio-border)] bg-slate-900/60 text-xs">
      <button
        type="button"
        onclick={() => (activeTab = 'props')}
        class="flex-1 py-2 font-medium border-b-2 transition-colors {activeTab === 'props' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
      >
        Content
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'style')}
        class="flex-1 py-2 font-medium border-b-2 transition-colors {activeTab === 'style' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
      >
        Styles
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'interactions')}
        class="flex-1 py-2 font-medium border-b-2 transition-colors {activeTab === 'interactions' ? 'border-blue-500 text-blue-400 bg-slate-800/40' : 'border-transparent text-slate-400 hover:text-slate-200'}"
      >
        Events
      </button>
    </div>

    <!-- Tab 1: Content & Props -->
    {#if activeTab === 'props'}
      <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {#each Object.entries(selectedNode.props || {}) as [propKey, propVal]}
          <div>
            <label for="prop-{propKey}" class="block text-slate-400 capitalize font-medium mb-1">
              {propKey.replace(/([A-Z])/g, ' $1')}
            </label>

            {#if typeof propVal === 'string'}
              {#if propVal.length > 50}
                <textarea
                  id="prop-{propKey}"
                  rows="3"
                  value={propVal}
                  oninput={(e) => updateProp(propKey, (e.target as HTMLTextAreaElement).value)}
                  class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                ></textarea>
              {:else}
                <input
                  id="prop-{propKey}"
                  type="text"
                  value={propVal}
                  oninput={(e) => updateProp(propKey, (e.target as HTMLInputElement).value)}
                  class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                />
              {/if}
            {:else if typeof propVal === 'number'}
              <input
                id="prop-{propKey}"
                type="number"
                value={propVal}
                oninput={(e) => updateProp(propKey, Number((e.target as HTMLInputElement).value))}
                class="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            {:else if typeof propVal === 'boolean'}
              <label class="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={propVal}
                  onchange={(e) => updateProp(propKey, (e.target as HTMLInputElement).checked)}
                  class="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span class="text-slate-300">Enabled</span>
              </label>
            {:else}
              <div class="text-[11px] text-slate-500 font-mono bg-slate-900 p-2 rounded border border-slate-800 truncate">
                {JSON.stringify(propVal)}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <!-- Tab 2: Style & Responsive Overrides -->
    {#if activeTab === 'style'}
      <div class="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        <!-- Active Breakpoint Context Indicator -->
        <div class="flex items-center justify-between p-2 rounded bg-slate-800/80 border border-slate-700">
          <span class="text-slate-400">Target Breakpoint:</span>
          <span class="font-bold text-blue-400 uppercase tracking-wider">{editor.activeBreakpoint}</span>
        </div>

        <!-- Spacing Controls -->
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Padding & Margin</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="style-padding-top" class="text-slate-400 text-[11px] block mb-0.5">Top Padding</label>
              <input
                id="style-padding-top"
                type="text"
                placeholder="4rem"
                value={selectedNode.styles?.base?.paddingTop || ''}
                oninput={(e) => updateStyle('paddingTop', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
                class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>
            <div>
              <label for="style-padding-bottom" class="text-slate-400 text-[11px] block mb-0.5">Bottom Padding</label>
              <input
                id="style-padding-bottom"
                type="text"
                placeholder="4rem"
                value={selectedNode.styles?.base?.paddingBottom || ''}
                oninput={(e) => updateStyle('paddingBottom', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
                class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        <!-- Colors & Background -->
        <div class="border-t border-slate-800 pt-4">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Background & Fill</span>
          <div class="space-y-2">
            <div>
              <label for="style-background" class="text-slate-400 text-[11px] block mb-0.5">Background CSS</label>
              <input
                id="style-background"
                type="text"
                placeholder="transparent or var(--color-muted)"
                value={selectedNode.styles?.base?.background || ''}
                oninput={(e) => updateStyle('background', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
                class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        <!-- Border Radius & Shadows -->
        <div class="border-t border-slate-800 pt-4">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Border & Radius</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label for="style-border-radius" class="text-slate-400 text-[11px] block mb-0.5">Border Radius</label>
              <input
                id="style-border-radius"
                type="text"
                placeholder="0.5rem"
                value={selectedNode.styles?.base?.borderRadius || ''}
                oninput={(e) => updateStyle('borderRadius', (e.target as HTMLInputElement).value, editor.activeBreakpoint)}
                class="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Tab 3: Declarative Interactions -->
    {#if activeTab === 'interactions'}
      <div class="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Interactions</span>
          <p class="text-slate-400 text-[11px] leading-relaxed mb-3">
            Wire visual user actions (e.g. click to navigate, open modal, submit form) without writing custom code.
          </p>

          <div class="rounded border border-slate-800 bg-slate-900 p-3 space-y-2">
            <div class="font-semibold text-white">Add Navigation Trigger</div>
            <div class="flex gap-2">
              <input
                type="text"
                placeholder="/dashboard"
                value="/dashboard"
                id="nav-dest-input"
                class="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
              />
              <button
                type="button"
                onclick={() => {
                  const dest = (document.getElementById('nav-dest-input') as HTMLInputElement)?.value || '/dashboard';
                  editor.dispatch({
                    type: 'ADD_INTERACTION',
                    interaction: {
                      id: crypto.randomUUID(),
                      name: `Navigate to ${dest}`,
                      sourceNodeId: selectedNode.id,
                      trigger: 'click',
                      action: { type: 'navigate', payload: { targetPath: dest } }
                    }
                  });
                }}
                class="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-semibold"
              >
                Wire Link
              </button>
            </div>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <!-- Empty State -->
    <div class="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
      <div class="text-3xl mb-2">🎯</div>
      <div class="font-medium text-xs text-slate-400">No Component Selected</div>
      <p class="text-[11px] text-slate-500 mt-1 max-w-[180px]">
        Click any section or element on the canvas to inspect and edit its properties.
      </p>
    </div>
  {/if}
</aside>
