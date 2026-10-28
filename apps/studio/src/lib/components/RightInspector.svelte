<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { getManifest } from '@app-viz/components';
  import type { BreakpointKey, InteractionRule } from '@app-viz/schema';

  let activeTab = $state<'props' | 'style' | 'interactions'>('props');
  let styleTargetMode = $state<'base' | 'breakpoint' | 'hover' | 'focus' | 'active'>('base');
  let rawJsonToggles = $state<Record<string, boolean>>({});

  function humanizeLabel(raw: string): string {
    return raw
      .replace(/([A-Z])/g, ' $1')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .replace(/\bCta\b/g, 'CTA')
      .replace(/\bUrl\b/g, 'URL')
      .replace(/\bId\b/g, 'ID')
      .trim();
  }

  const quickBgSwatches = [
    { label: 'White', val: '#FFFFFF' },
    { label: 'Surface', val: '#FAF9FD' },
    { label: 'Soft Gray', val: '#F0F4F9' },
    { label: 'Blue Tint', val: '#EDF2FC' },
    { label: 'Violet Tint', val: '#F3E8FD' },
    { label: 'Mint Tint', val: '#E6F4EA' },
    { label: 'Dark Slate', val: '#111318' }
  ];

  const quickTextSwatches = [
    { label: 'Ink Dark', val: '#1B1B1F' },
    { label: 'Muted Slate', val: '#444746' },
    { label: 'MD3 Blue', val: '#0B57D0' },
    { label: 'Violet', val: '#6750A4' },
    { label: 'Emerald', val: '#146C2E' },
    { label: 'Pure White', val: '#FFFFFF' }
  ];

  const atomicV4Classes = [
    { cls: 'el-glass', label: 'Glass Blur' },
    { cls: 'el-gradient-border', label: 'Primary Border' },
    { cls: 'el-shadow-float', label: 'Float Shadow' },
    { cls: 'el-surface-tint', label: 'Primary Tint' },
    { cls: 'el-border-glow', label: 'Glow Ring' }
  ];

  const ENUM_PROP_OPTIONS: Record<string, Array<{ value: string; label: string }>> = {
    maxWidth: [
      { value: 'sm', label: 'Small (640px)' },
      { value: 'md', label: 'Medium (768px)' },
      { value: 'lg', label: 'Large (1024px)' },
      { value: 'xl', label: 'Extra Large (1280px)' },
      { value: '2xl', label: '2XL Wide (1536px)' },
      { value: 'full', label: 'Full Bleed (100%)' }
    ],
    paddingY: [
      { value: 'sm', label: 'Small (2rem)' },
      { value: 'md', label: 'Medium (3.5rem)' },
      { value: 'lg', label: 'Large (5rem)' },
      { value: 'xl', label: 'Extra Large (7rem)' }
    ],
    surfaceTone: [
      { value: 'surface', label: 'Default Surface' },
      { value: 'low', label: 'Surface Container Low' },
      { value: 'container', label: 'Surface Container' },
      { value: 'high', label: 'Surface Container High' },
      { value: 'primary-container', label: 'MD3 Primary Container' }
    ],
    direction: [
      { value: 'column', label: '↓ Column (Vertical Stack)' },
      { value: 'row', label: '→ Row (Horizontal)' },
      { value: 'column-reverse', label: '↑ Column Reverse' },
      { value: 'row-reverse', label: '← Row Reverse' }
    ],
    justify: [
      { value: 'flex-start', label: 'Start (flex-start)' },
      { value: 'center', label: '⬌ Center (center)' },
      { value: 'flex-end', label: 'End (flex-end)' },
      { value: 'space-between', label: 'Space Between' },
      { value: 'space-around', label: 'Space Around' },
      { value: 'space-evenly', label: 'Space Evenly' }
    ],
    align: [
      { value: 'stretch', label: 'Stretch Full Width' },
      { value: 'flex-start', label: '⬅ Start (Left / Top)' },
      { value: 'center', label: '⬌ Center' },
      { value: 'flex-end', label: '➡ End (Right / Bottom)' }
    ],
    alignItems: [
      { value: 'stretch', label: 'Stretch' },
      { value: 'start', label: 'Start' },
      { value: 'center', label: '⬌ Center' },
      { value: 'end', label: 'End' }
    ],
    justifyItems: [
      { value: 'stretch', label: 'Stretch' },
      { value: 'start', label: 'Start' },
      { value: 'center', label: '⬌ Center' },
      { value: 'end', label: 'End' }
    ],
    textAlign: [
      { value: 'left', label: '⬅ Left' },
      { value: 'center', label: '⬌ Center' },
      { value: 'right', label: '➡ Right' }
    ],
    size: [
      { value: 'sm', label: 'Small (sm)' },
      { value: 'md', label: 'Medium (md)' },
      { value: 'lg', label: 'Large (lg)' }
    ],
    tone: [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'success', label: 'Success' },
      { value: 'error', label: 'Error' },
      { value: 'info', label: 'Info' },
      { value: 'outline', label: 'Outline' }
    ]
  };

  const customCssSnippets = [
    {
      label: 'Glass Card',
      code: 'selector {\n  backdrop-filter: blur(16px);\n  border: 1px solid rgba(11, 87, 208, 0.25);\n  border-radius: 16px;\n}'
    },
    {
      label: 'Hover Float',
      code: 'selector {\n  transition: transform 0.25s ease;\n}\nselector:hover {\n  transform: translateY(-6px);\n}'
    },
    {
      label: 'Accent Bar',
      code: 'selector {\n  border-left: 4px solid var(--md-sys-color-primary);\n  padding-left: 1rem;\n}'
    }
  ];

  const selectedNode = $derived(editor.selectedNode);
  const manifest = $derived(selectedNode ? getManifest(selectedNode.componentType) : null);
  const effectiveStyleBucket = $derived<
    'base' | BreakpointKey | 'hover' | 'focus' | 'active'
  >(styleTargetMode === 'breakpoint' ? editor.activeBreakpoint : styleTargetMode);

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

  function updateArrayItemField(
    propKey: string,
    arr: Record<string, unknown>[],
    index: number,
    fieldKey: string,
    fieldVal: unknown
  ) {
    const next = arr.map((item, idx) =>
      idx === index ? { ...item, [fieldKey]: fieldVal } : item
    );
    updateProp(propKey, next);
  }

  function moveArrayItem(propKey: string, arr: unknown[], index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    const next = [...arr];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    updateProp(propKey, next);
  }

  function removeArrayItem(propKey: string, arr: unknown[], index: number) {
    const next = arr.filter((_, idx) => idx !== index);
    updateProp(propKey, next);
  }

  function addArrayItem(propKey: string, arr: unknown[]) {
    if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null && !Array.isArray(arr[0])) {
      const sample = arr[arr.length - 1] as Record<string, unknown>;
      const fresh: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(sample)) {
        if (typeof v === 'boolean') fresh[k] = false;
        else if (typeof v === 'number') fresh[k] = 0;
        else if (Array.isArray(v)) fresh[k] = [...v];
        else if (k === 'id') fresh[k] = `tab-${arr.length + 1}`;
        else fresh[k] = `New ${k}`;
      }
      updateProp(propKey, [...arr, fresh]);
    } else if (arr.length > 0 && Array.isArray(arr[0])) {
      const cols = (arr[0] as unknown[]).length;
      updateProp(propKey, [...arr, Array(cols).fill('New Cell')]);
    } else {
      updateProp(propKey, [...arr, 'New Item']);
    }
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
    const bucket = selectedNode.styles?.[effectiveStyleBucket] as
      | Record<string, string>
      | undefined;
    const baseBucket = selectedNode.styles?.base as Record<string, string> | undefined;
    return bucket?.[propName] ?? (effectiveStyleBucket === 'base' ? '' : baseBucket?.[propName] ?? '');
  }

  function hasBucketOverrides(
    bucketKey: 'base' | BreakpointKey | 'hover' | 'focus' | 'active'
  ): boolean {
    if (!selectedNode?.styles) return false;
    const bucket = selectedNode.styles[bucketKey] as Record<string, unknown> | undefined;
    return Boolean(bucket && Object.values(bucket).some((v) => v !== undefined && v !== ''));
  }

  function toggleAtomicClass(clsName: string) {
    if (!selectedNode) return;
    const current = (selectedNode.customClasses || '')
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const next = current.includes(clsName)
      ? current.filter((c) => c !== clsName)
      : [...current, clsName];
    editor.dispatch({
      type: 'UPDATE_NODE_META',
      nodeId: selectedNode.id,
      meta: { customClasses: next.join(' ') }
    });
  }

  function updateMotionEffect(patch: Record<string, unknown>) {
    if (!selectedNode) return;
    const prev = selectedNode.motionEffects || {
      entranceAnimation: 'none',
      animationDuration: 'normal',
      hoverTransform: 'none',
      sticky: 'none',
      hideOnDesktop: false,
      hideOnTablet: false,
      hideOnMobile: false
    };
    editor.dispatch({
      type: 'UPDATE_NODE_META',
      nodeId: selectedNode.id,
      meta: {
        motionEffects: {
          ...prev,
          ...patch
        } as NonNullable<typeof selectedNode.motionEffects>
      }
    });
  }

  function setClickInteraction(
    actionType:
      | 'none'
      | 'navigate'
      | 'openModal'
      | 'toggleDrawer'
      | 'showToast'
      | 'setState'
      | 'submitForm',
    payloadPatch: Record<string, string> = {}
  ) {
    if (!selectedNode) return;
    const otherRules = (selectedNode.interactions || []).filter(
      (r) => r.trigger !== 'onClick' && r.trigger !== 'click'
    );
    if (actionType === 'none') {
      editor.dispatch({
        type: 'UPDATE_INTERACTIONS',
        nodeId: selectedNode.id,
        interactions: otherRules
      });
      return;
    }

    const existingPayload = (clickRule?.payload || {}) as Record<string, string>;
    const newRule: InteractionRule = {
      id: clickRule?.id || crypto.randomUUID(),
      name: `${selectedNode.name} (${actionType})`,
      trigger: 'onClick',
      actionType,
      payload: {
        path: existingPayload.path || editor.blueprint.pages[0]?.path || '/',
        modalTitle: existingPayload.modalTitle || `${selectedNode.name} Details`,
        modalBody:
          existingPayload.modalBody ||
          'Configure this Google MD3 modal dialog in the Interactions tab.',
        modalCta: existingPayload.modalCta || 'Confirm',
        drawerTitle: existingPayload.drawerTitle || 'Workspace Sheet',
        drawerBody:
          existingPayload.drawerBody || 'Contextual side drawer triggered via declarative rule.',
        toastMessage: existingPayload.toastMessage || 'Action completed!',
        stateKey: existingPayload.stateKey || 'planTier',
        stateValue: existingPayload.stateValue || 'enterprise',
        ...payloadPatch
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
          title="Move Up (Alt+↑)"
          onclick={() =>
            editor.dispatch({ type: 'REORDER_NODE', nodeId: selectedNode.id, direction: 'up' })}
          class="action-btn"
        >
          ↑
        </button>
        <button
          type="button"
          title="Move Down (Alt+↓)"
          onclick={() =>
            editor.dispatch({ type: 'REORDER_NODE', nodeId: selectedNode.id, direction: 'down' })}
          class="action-btn"
        >
          ↓
        </button>
        <button
          type="button"
          title="Wrap in Section"
          onclick={() => editor.wrapNode(selectedNode.id, 'structure/section')}
          class="action-btn"
        >
          📦
        </button>
        <button
          type="button"
          title="Save as Symbol"
          onclick={() => editor.saveSelectedNodeAsSymbol()}
          class="action-btn"
        >
          ★
        </button>
        <button
          type="button"
          title="Duplicate (⌘D)"
          onclick={() => editor.dispatch({ type: 'DUPLICATE_NODE', nodeId: selectedNode.id })}
          class="action-btn"
        >
          ⧉
        </button>
        <button
          type="button"
          title="Delete (⌫)"
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

    <!-- Elementor Pro Inspector Tabs (Content | Style | Advanced) -->
    <div class="studio-tabs">
      <button
        type="button"
        onclick={() => (activeTab = 'props')}
        class="studio-tab {activeTab === 'props' ? 'studio-tab--active' : ''}"
      >
        ✏️ Content
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'style')}
        class="studio-tab {activeTab === 'style' ? 'studio-tab--active' : ''}"
      >
        🎨 Style
      </button>
      <button
        type="button"
        onclick={() => (activeTab = 'interactions')}
        class="studio-tab {activeTab === 'interactions' ? 'studio-tab--active' : ''}"
      >
        ⚙️ Advanced
      </button>
    </div>

    <!-- Tab 1: Content & Schema Props (With Visual Array Repeaters) -->
    {#if activeTab === 'props'}
      <div class="studio-panel-content flow-v">
        <!-- Elementor Flexbox Container & Quick Centering Controls -->
        <div class="repeater-card" style="background: var(--md-sys-color-surface-container-low); border-color: var(--md-sys-color-primary);">
          <div class="field-label-row">
            <span class="field-label" style="color: var(--md-sys-color-primary); font-weight: 700;">
              🎯 {selectedNode.componentType === 'structure/container' || selectedNode.componentType === 'structure/section' || selectedNode.componentType === 'structure/grid' ? 'Container Content Alignment' : 'Element Alignment & Centering'}
            </span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
            <button
              type="button"
              onclick={() => editor.alignNode(selectedNode.id, 'left')}
              class="bp-target-btn {(selectedNode.props?.textAlign === 'left' || readStyle('textAlign') === 'left') && readStyle('alignItems') === 'flex-start' ? 'bp-target-btn--active' : ''}"
              title="Align Left"
            >
              ⬅ Left
            </button>
            <button
              type="button"
              onclick={() => editor.alignNode(selectedNode.id, 'center')}
              class="bp-target-btn {selectedNode.props?.align === 'center' || selectedNode.props?.textAlign === 'center' || readStyle('alignItems') === 'center' || readStyle('textAlign') === 'center' ? 'bp-target-btn--active' : ''}"
              title="Center Everything Inside Container / Parent"
            >
              ⬌ Center
            </button>
            <button
              type="button"
              onclick={() => editor.alignNode(selectedNode.id, 'right')}
              class="bp-target-btn {selectedNode.props?.align === 'flex-end' || selectedNode.props?.textAlign === 'right' || readStyle('alignItems') === 'flex-end' || readStyle('textAlign') === 'right' ? 'bp-target-btn--active' : ''}"
              title="Align Right"
            >
              ➡ Right
            </button>
            <button
              type="button"
              onclick={() => editor.alignNode(selectedNode.id, 'stretch')}
              class="bp-target-btn {selectedNode.props?.align === 'stretch' && readStyle('alignItems') === 'stretch' ? 'bp-target-btn--active' : ''}"
              title="Stretch Full Width"
            >
              ↔ Stretch
            </button>
          </div>

          {#if selectedNode.componentType === 'structure/container' || selectedNode.componentType === 'structure/section'}
            <div class="sub-field" style="margin-top: 0.25rem;">
              <span class="sub-label">Flex Direction (Items Flow)</span>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                {#each [
                  { val: 'column', label: '↓ Col' },
                  { val: 'row', label: '→ Row' },
                  { val: 'column-reverse', label: '↑ Col Rev' },
                  { val: 'row-reverse', label: '← Row Rev' }
                ] as dir (dir.val)}
                  <button
                    type="button"
                    onclick={() => {
                      updateProp('direction', dir.val);
                      updateStyle('display', 'flex');
                      updateStyle('flexDirection', dir.val);
                    }}
                    class="bp-target-btn {(selectedNode.props?.direction || readStyle('flexDirection') || 'column') === dir.val ? 'bp-target-btn--active' : ''}"
                  >
                    {dir.label}
                  </button>
                {/each}
              </div>
            </div>

            <div class="sub-field">
              <span class="sub-label">Align Items (Cross Axis / Horizontal in Column)</span>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
                {#each [
                  { val: 'flex-start', label: 'Start' },
                  { val: 'center', label: '⬌ Center' },
                  { val: 'flex-end', label: 'End' },
                  { val: 'stretch', label: 'Stretch' }
                ] as al (al.val)}
                  <button
                    type="button"
                    onclick={() => {
                      updateProp('align', al.val);
                      updateStyle('display', 'flex');
                      updateStyle('alignItems', al.val);
                      if (al.val === 'center') {
                        updateProp('textAlign', 'center');
                        updateStyle('textAlign', 'center');
                      }
                    }}
                    class="bp-target-btn {(selectedNode.props?.align || readStyle('alignItems') || 'stretch') === al.val ? 'bp-target-btn--active' : ''}"
                  >
                    {al.label}
                  </button>
                {/each}
              </div>
            </div>

            <div class="sub-field">
              <span class="sub-label">Justify Content (Main Axis / Distribution)</span>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;">
                {#each [
                  { val: 'flex-start', label: 'Start' },
                  { val: 'center', label: '⬌ Center' },
                  { val: 'flex-end', label: 'End' },
                  { val: 'space-between', label: 'Between' },
                  { val: 'space-around', label: 'Around' },
                  { val: 'space-evenly', label: 'Evenly' }
                ] as jc (jc.val)}
                  <button
                    type="button"
                    onclick={() => {
                      updateProp('justify', jc.val);
                      updateStyle('display', 'flex');
                      updateStyle('justifyContent', jc.val);
                    }}
                    class="bp-target-btn {(selectedNode.props?.justify || readStyle('justifyContent') || 'flex-start') === jc.val ? 'bp-target-btn--active' : ''}"
                  >
                    {jc.label}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        {#each Object.entries(selectedNode.props || {}) as [propKey, propVal] (propKey)}
          {@const controlMeta = manifest?.propControls?.[propKey]}
          {@const enumOptions = controlMeta?.options || ENUM_PROP_OPTIONS[propKey]}
          <div class="field-item">
            <div class="field-label-row">
              <label for="prop-{propKey}" class="field-label">
                {controlMeta?.label || humanizeLabel(propKey)}
              </label>
              {#if Array.isArray(propVal)}
                <button
                  type="button"
                  onclick={() =>
                    (rawJsonToggles = {
                      ...rawJsonToggles,
                      [propKey]: !rawJsonToggles[propKey]
                    })}
                  class="json-toggle-btn"
                >
                  {rawJsonToggles[propKey] ? 'Visual List' : '{ } JSON'}
                </button>
              {/if}
            </div>

            {#if enumOptions}
              <select
                id="prop-{propKey}"
                value={String(propVal ?? '')}
                onchange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  updateProp(propKey, val);
                  if (propKey === 'direction') {
                    updateStyle('display', 'flex');
                    updateStyle('flexDirection', val);
                  } else if (propKey === 'align') {
                    updateStyle('display', 'flex');
                    updateStyle('alignItems', val);
                  } else if (propKey === 'justify') {
                    updateStyle('display', 'flex');
                    updateStyle('justifyContent', val);
                  } else if (propKey === 'textAlign') {
                    updateStyle('textAlign', val);
                  }
                }}
                class="studio-select"
              >
                {#each enumOptions as opt (opt.value)}
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
            {:else if Array.isArray(propVal) && !rawJsonToggles[propKey]}
              <!-- Visual Repeater Editor for Array Props -->
              <div class="repeater-stack">
                {#each propVal as item, idx (idx)}
                  <div class="repeater-card">
                    <div class="repeater-card__header">
                      <span class="repeater-card__title">
                        #{idx + 1}
                        {typeof item === 'object' && item !== null
                          ? (item as Record<string, unknown>).label ||
                            (item as Record<string, unknown>).title ||
                            (item as Record<string, unknown>).name ||
                            (item as Record<string, unknown>).question ||
                            ''
                          : ''}
                      </span>
                      <div class="repeater-card__actions">
                        <button
                          type="button"
                          onclick={() => moveArrayItem(propKey, propVal, idx, -1)}
                          class="rep-btn"
                          title="Move Up"
                        >↑</button>
                        <button
                          type="button"
                          onclick={() => moveArrayItem(propKey, propVal, idx, 1)}
                          class="rep-btn"
                          title="Move Down"
                        >↓</button>
                        <button
                          type="button"
                          onclick={() => removeArrayItem(propKey, propVal, idx)}
                          class="rep-btn rep-btn--danger"
                          title="Remove Item"
                        >✕</button>
                      </div>
                    </div>

                    {#if typeof item === 'object' && item !== null && !Array.isArray(item)}
                      <div class="repeater-fields">
                        {#each Object.entries(item as Record<string, unknown>) as [subKey, subVal] (subKey)}
                          {#if typeof subVal === 'boolean'}
                            <label class="checkbox-row">
                              <input
                                type="checkbox"
                                checked={subVal}
                                onchange={(e) =>
                                  updateArrayItemField(
                                    propKey,
                                    propVal as Record<string, unknown>[],
                                    idx,
                                    subKey,
                                    (e.target as HTMLInputElement).checked
                                  )}
                                class="studio-checkbox"
                              />
                              <span class="checkbox-text">{subKey}</span>
                            </label>
                          {:else if Array.isArray(subVal)}
                            <div class="sub-field">
                              <span class="sub-label">{subKey} (comma-separated)</span>
                              <input
                                type="text"
                                aria-label="{subKey} list"
                                value={subVal
                                  .map((v) =>
                                    typeof v === 'object' && v !== null
                                      ? JSON.stringify(v)
                                      : String(v)
                                  )
                                  .join(', ')}
                                onchange={(e) => {
                                  const rawParts = (e.target as HTMLInputElement).value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                                  updateArrayItemField(
                                    propKey,
                                    propVal as Record<string, unknown>[],
                                    idx,
                                    subKey,
                                    rawParts
                                  );
                                }}
                                class="studio-input"
                              />
                            </div>
                          {:else}
                            <div class="sub-field">
                              <span class="sub-label">{subKey}</span>
                              <input
                                type="text"
                                aria-label={subKey}
                                value={String(subVal ?? '')}
                                oninput={(e) =>
                                  updateArrayItemField(
                                    propKey,
                                    propVal as Record<string, unknown>[],
                                    idx,
                                    subKey,
                                    (e.target as HTMLInputElement).value
                                  )}
                                class="studio-input"
                              />
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {:else if Array.isArray(item)}
                      <input
                        type="text"
                        aria-label="Row {idx + 1} cells"
                        value={item.join(' | ')}
                        onchange={(e) => {
                          const cells = (e.target as HTMLInputElement).value
                            .split('|')
                            .map((s) => s.trim());
                          const next = [...propVal];
                          next[idx] = cells;
                          updateProp(propKey, next);
                        }}
                        class="studio-input"
                      />
                    {:else}
                      <input
                        type="text"
                        aria-label="Item {idx + 1}"
                        value={String(item ?? '')}
                        oninput={(e) => {
                          const next = [...propVal];
                          next[idx] = (e.target as HTMLInputElement).value;
                          updateProp(propKey, next);
                        }}
                        class="studio-input"
                      />
                    {/if}
                  </div>
                {/each}
                <button
                  type="button"
                  onclick={() => addArrayItem(propKey, propVal)}
                  class="studio-btn add-item-btn"
                >
                  + Add Item to {controlMeta?.label || propKey}
                </button>
              </div>
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

    <!-- Tab 2: Visual Styles (MD3, Responsive Cascade & Stateful Variants) -->
    {:else if activeTab === 'style'}
      <div class="studio-panel-content flow-v">
        <!-- Elementor Pro Copy / Paste / Reset Style Toolbar -->
        <div class="spacing-pill-row" style="margin-top: 0;">
          <button
            type="button"
            onclick={() => editor.copyNodeStyle(selectedNode.id)}
            class="spacing-pill"
            title="Copy Element Style (⌘⇧C)"
          >
            🎨 Copy Style
          </button>
          <button
            type="button"
            disabled={!editor.clipboardStyles}
            onclick={() => editor.pasteNodeStyle(selectedNode.id)}
            class="spacing-pill"
            title="Paste Copied Style (⌘⇧V)"
          >
            🖌️ Paste Style
          </button>
          <button
            type="button"
            onclick={() => editor.resetNodeStyle(selectedNode.id)}
            class="spacing-pill"
            title="Reset All Styles on Element"
          >
            ↺ Reset
          </button>
        </div>

        <!-- Elementor V4 Atomic Classes & Global Class Chips -->
        <div class="field-item">
          <label for="el-v4-classes" class="field-label">Elementor V4 Classes (Local &amp; Global)</label>
          <div class="spacing-pill-row" style="margin-bottom: 0.25rem;">
            {#each atomicV4Classes as item (item.cls)}
              {@const isApplied = (selectedNode.customClasses || '').split(/\s+/).includes(item.cls)}
              <button
                type="button"
                onclick={() => toggleAtomicClass(item.cls)}
                class="spacing-pill"
                style={isApplied ? 'background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); border-color: var(--md-sys-color-primary); font-weight: 700;' : ''}
              >
                .{item.cls}
              </button>
            {/each}
          </div>
          <input
            id="el-v4-classes"
            type="text"
            placeholder="e.g. el-glass el-shadow-float"
            value={selectedNode.customClasses || ''}
            onchange={(e) =>
              editor.dispatch({
                type: 'UPDATE_NODE_META',
                nodeId: selectedNode.id,
                meta: { customClasses: (e.target as HTMLInputElement).value }
              })}
            class="studio-input font-mono"
          />
        </div>

        <div class="bp-target-bar">
          <button
            type="button"
            onclick={() => (styleTargetMode = 'base')}
            class="bp-target-btn {styleTargetMode === 'base' ? 'bp-target-btn--active' : ''}"
          >
            Normal{hasBucketOverrides('base') ? ' •' : ''}
          </button>
          <button
            type="button"
            onclick={() => (styleTargetMode = 'breakpoint')}
            class="bp-target-btn {styleTargetMode === 'breakpoint' ? 'bp-target-btn--active' : ''}"
          >
            @{editor.activeBreakpoint}{hasBucketOverrides(editor.activeBreakpoint) ? ' •' : ''}
          </button>
          <button
            type="button"
            onclick={() => (styleTargetMode = 'hover')}
            class="bp-target-btn {styleTargetMode === 'hover' ? 'bp-target-btn--active' : ''}"
          >
            :hover{hasBucketOverrides('hover') ? ' •' : ''}
          </button>
          <button
            type="button"
            onclick={() => (styleTargetMode = 'focus')}
            class="bp-target-btn {styleTargetMode === 'focus' ? 'bp-target-btn--active' : ''}"
          >
            :focus{hasBucketOverrides('focus') ? ' •' : ''}
          </button>
          <button
            type="button"
            onclick={() => (styleTargetMode = 'active')}
            class="bp-target-btn {styleTargetMode === 'active' ? 'bp-target-btn--active' : ''}"
          >
            :active{hasBucketOverrides('active') ? ' •' : ''}
          </button>
        </div>

        <div class="section-title">Layout, Centering &amp; Flex/Grid Matrix</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px;">
          <button
            type="button"
            onclick={() => editor.alignNode(selectedNode.id, 'left')}
            class="bp-target-btn {readStyle('textAlign') === 'left' && readStyle('alignItems') === 'flex-start' ? 'bp-target-btn--active' : ''}"
          >
            ⬅ Left
          </button>
          <button
            type="button"
            onclick={() => editor.alignNode(selectedNode.id, 'center')}
            class="bp-target-btn {readStyle('alignItems') === 'center' || readStyle('textAlign') === 'center' ? 'bp-target-btn--active' : ''}"
          >
            ⬌ Center
          </button>
          <button
            type="button"
            onclick={() => editor.alignNode(selectedNode.id, 'right')}
            class="bp-target-btn {readStyle('alignItems') === 'flex-end' || readStyle('textAlign') === 'right' ? 'bp-target-btn--active' : ''}"
          >
            ➡ Right
          </button>
          <button
            type="button"
            onclick={() => editor.alignNode(selectedNode.id, 'stretch')}
            class="bp-target-btn {readStyle('alignItems') === 'stretch' ? 'bp-target-btn--active' : ''}"
          >
            ↔ Stretch
          </button>
        </div>
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
            <label for="style-direction" class="field-label">Flex Direction</label>
            <select
              id="style-direction"
              value={readStyle('flexDirection')}
              onchange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                updateStyle('display', 'flex');
                updateStyle('flexDirection', val);
                if (selectedNode.componentType === 'structure/container' || selectedNode.componentType === 'structure/section') {
                  updateProp('direction', val);
                }
              }}
              class="studio-select"
            >
              <option value="">(Default)</option>
              <option value="column">↓ column</option>
              <option value="row">→ row</option>
              <option value="column-reverse">↑ column-reverse</option>
              <option value="row-reverse">← row-reverse</option>
            </select>
          </div>
          <div class="field-item">
            <label for="style-justify" class="field-label">Justify Content</label>
            <select
              id="style-justify"
              value={readStyle('justifyContent')}
              onchange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                updateStyle('display', 'flex');
                updateStyle('justifyContent', val);
                if (selectedNode.componentType === 'structure/container' || selectedNode.componentType === 'structure/section') {
                  updateProp('justify', val);
                }
              }}
              class="studio-select"
            >
              <option value="">(Default)</option>
              <option value="flex-start">flex-start</option>
              <option value="center">⬌ center</option>
              <option value="flex-end">flex-end</option>
              <option value="space-between">space-between</option>
              <option value="space-around">space-around</option>
              <option value="space-evenly">space-evenly</option>
            </select>
          </div>
          <div class="field-item">
            <label for="style-align-items" class="field-label">Align Items</label>
            <select
              id="style-align-items"
              value={readStyle('alignItems')}
              onchange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                updateStyle('display', 'flex');
                updateStyle('alignItems', val);
                if (selectedNode.componentType === 'structure/container' || selectedNode.componentType === 'structure/section') {
                  updateProp('align', val);
                }
              }}
              class="studio-select"
            >
              <option value="">(Default)</option>
              <option value="stretch">stretch</option>
              <option value="flex-start">flex-start</option>
              <option value="center">⬌ center</option>
              <option value="flex-end">flex-end</option>
            </select>
          </div>
          <div class="field-item">
            <label for="style-gap" class="field-label">Gap</label>
            <input
              id="style-gap"
              type="text"
              placeholder="e.g. 1.5rem"
              value={readStyle('gap')}
              onchange={(e) => {
                const val = (e.target as HTMLInputElement).value;
                updateStyle('gap', val);
                if (selectedNode.componentType === 'structure/container' || selectedNode.componentType === 'structure/section') {
                  updateProp('gap', val);
                }
              }}
              class="studio-input"
            />
          </div>
        </div>

        <div class="section-title">Visual CSS Box Model (Margin &amp; Padding)</div>
        <div class="box-model-outer">
          <span class="box-model-tag">MARGIN</span>
          <input
            type="text"
            aria-label="Margin top"
            placeholder="0"
            value={readStyle('marginTop')}
            onchange={(e) => updateStyle('marginTop', (e.target as HTMLInputElement).value)}
            class="box-input box-input--top"
          />
          <div class="box-model-mid">
            <input
              type="text"
              aria-label="Margin left"
              placeholder="0"
              value={readStyle('marginLeft')}
              onchange={(e) => updateStyle('marginLeft', (e.target as HTMLInputElement).value)}
              class="box-input"
            />
            <div class="box-model-inner">
              <span class="box-model-tag box-model-tag--pad">PADDING</span>
              <input
                type="text"
                aria-label="Padding top"
                placeholder="24px"
                value={readStyle('paddingTop')}
                onchange={(e) => updateStyle('paddingTop', (e.target as HTMLInputElement).value)}
                class="box-input"
              />
              <div class="box-model-core-row">
                <input
                  type="text"
                  aria-label="Padding left"
                  placeholder="24px"
                  value={readStyle('paddingLeft')}
                  onchange={(e) => updateStyle('paddingLeft', (e.target as HTMLInputElement).value)}
                  class="box-input"
                />
                <span class="box-core-badge">{selectedNode.componentType.split('/')[1]}</span>
                <input
                  type="text"
                  aria-label="Padding right"
                  placeholder="24px"
                  value={readStyle('paddingRight')}
                  onchange={(e) => updateStyle('paddingRight', (e.target as HTMLInputElement).value)}
                  class="box-input"
                />
              </div>
              <input
                type="text"
                aria-label="Padding bottom"
                placeholder="24px"
                value={readStyle('paddingBottom')}
                onchange={(e) => updateStyle('paddingBottom', (e.target as HTMLInputElement).value)}
                class="box-input"
              />
            </div>
            <input
              type="text"
              aria-label="Margin right"
              placeholder="0"
              value={readStyle('marginRight')}
              onchange={(e) => updateStyle('marginRight', (e.target as HTMLInputElement).value)}
              class="box-input"
            />
          </div>
          <input
            type="text"
            aria-label="Margin bottom"
            placeholder="0"
            value={readStyle('marginBottom')}
            onchange={(e) => updateStyle('marginBottom', (e.target as HTMLInputElement).value)}
            class="box-input box-input--bottom"
          />
        </div>

        <div class="spacing-Scale-pills">
          <span class="sub-label">Quick Vertical Padding:</span>
          <div class="spacing-pill-row">
            {#each ['0px', '16px', '24px', '48px', '64px', '96px'] as sp (sp)}
              <button
                type="button"
                onclick={() => {
                  updateStyle('paddingTop', sp);
                  updateStyle('paddingBottom', sp);
                }}
                class="spacing-pill"
              >
                {sp}
              </button>
            {/each}
          </div>
        </div>

        <div class="section-title">Shorthand Spacing &amp; Dimensions</div>
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

        <div class="section-title">Colors &amp; Surface Swatches</div>
        <div class="field-item">
          <div class="field-header-row">
            <label for="style-bg" class="field-label">Background Color</label>
            <input
              type="color"
              aria-label="Pick background color"
              value={readStyle('backgroundColor').startsWith('#') ? readStyle('backgroundColor') : '#FAF9FD'}
              oninput={(e) => updateStyle('backgroundColor', (e.target as HTMLInputElement).value)}
              style="width: 24px; height: 22px; border: none; background: transparent; cursor: pointer;"
            />
          </div>
          <div class="spacing-pill-row" style="margin-bottom: 0.35rem;">
            {#each quickBgSwatches as sw (sw.label)}
              <button
                type="button"
                onclick={() => updateStyle('backgroundColor', sw.val)}
                title="{sw.label} ({sw.val})"
                style="width: 22px; height: 22px; border-radius: 6px; background: {sw.val}; border: 1px solid var(--md-sys-color-outline-variant); cursor: pointer;"
              ></button>
            {/each}
            <button
              type="button"
              onclick={() => updateStyle('backgroundColor', '')}
              class="spacing-pill"
            >Reset</button>
          </div>
          <input
            id="style-bg"
            type="text"
            placeholder="Default surface"
            value={readStyle('backgroundColor')}
            onchange={(e) => updateStyle('backgroundColor', (e.target as HTMLInputElement).value)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <div class="field-header-row">
            <label for="style-color" class="field-label">Text Color</label>
            <input
              type="color"
              aria-label="Pick text color"
              value={readStyle('color').startsWith('#') ? readStyle('color') : '#1B1B1F'}
              oninput={(e) => updateStyle('color', (e.target as HTMLInputElement).value)}
              style="width: 24px; height: 22px; border: none; background: transparent; cursor: pointer;"
            />
          </div>
          <div class="spacing-pill-row" style="margin-bottom: 0.35rem;">
            {#each quickTextSwatches as sw (sw.label)}
              <button
                type="button"
                onclick={() => updateStyle('color', sw.val)}
                title="{sw.label} ({sw.val})"
                style="width: 22px; height: 22px; border-radius: 6px; background: {sw.val}; border: 1px solid var(--md-sys-color-outline-variant); cursor: pointer;"
              ></button>
            {/each}
            <button
              type="button"
              onclick={() => updateStyle('color', '')}
              class="spacing-pill"
            >Reset</button>
          </div>
          <input
            id="style-color"
            type="text"
            placeholder="Default text color"
            value={readStyle('color')}
            onchange={(e) => updateStyle('color', (e.target as HTMLInputElement).value)}
            class="studio-input"
          />
        </div>

        <div class="field-item">
          <span class="field-label">Text Alignment</span>
          <div class="bp-target-bar">
            {#each [
              { val: 'left', label: '⬅ Left' },
              { val: 'center', label: '⬌ Center' },
              { val: 'right', label: '➡ Right' }
            ] as al (al.val)}
              <button
                type="button"
                onclick={() => updateStyle('textAlign', al.val)}
                class="bp-target-btn {readStyle('textAlign') === al.val ? 'bp-target-btn--active' : ''}"
              >
                {al.label}
              </button>
            {/each}
          </div>
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
            <label for="style-shadow" class="field-label">Shadow Elevation</label>
            <select
              id="style-shadow"
              value={readStyle('boxShadow')}
              onchange={(e) => updateStyle('boxShadow', (e.target as HTMLSelectElement).value)}
              class="studio-select"
            >
              <option value="">(Default)</option>
              <option value="none">None (Flat)</option>
              <option value="var(--md-sys-elevation-level1)">Soft</option>
              <option value="var(--md-sys-elevation-level2)">Medium</option>
              <option value="var(--md-sys-elevation-level3)">Floating</option>
            </select>
          </div>
        </div>
      </div>

    <!-- Tab 3: Elementor Pro Advanced (Motion Effects, Sticky, Device Visibility, Custom CSS & Interactions) -->
    {:else if activeTab === 'interactions'}
      <div class="studio-panel-content flow-v">
        <div class="section-title">✨ Motion Effects &amp; Sticky (Elementor Pro)</div>
        <div class="grid-2">
          <div class="field-item">
            <label for="adv-entrance" class="field-label">Entrance Animation</label>
            <select
              id="adv-entrance"
              value={selectedNode.motionEffects?.entranceAnimation || 'none'}
              onchange={(e) =>
                updateMotionEffect({
                  entranceAnimation: (e.target as HTMLSelectElement).value
                })}
              class="studio-select"
            >
              <option value="none">None</option>
              <option value="fadeIn">Fade In</option>
              <option value="fadeInUp">Fade In Up</option>
              <option value="fadeInDown">Fade In Down</option>
              <option value="zoomIn">Zoom In</option>
              <option value="slideInLeft">Slide In Left</option>
              <option value="slideInRight">Slide In Right</option>
            </select>
          </div>
          <div class="field-item">
            <label for="adv-duration" class="field-label">Animation Speed</label>
            <select
              id="adv-duration"
              value={selectedNode.motionEffects?.animationDuration || 'normal'}
              onchange={(e) =>
                updateMotionEffect({
                  animationDuration: (e.target as HTMLSelectElement).value
                })}
              class="studio-select"
            >
              <option value="fast">Fast (220ms)</option>
              <option value="normal">Normal (460ms)</option>
              <option value="slow">Slow (760ms)</option>
            </select>
          </div>
          <div class="field-item">
            <label for="adv-hover-fx" class="field-label">Hover Transform</label>
            <select
              id="adv-hover-fx"
              value={selectedNode.motionEffects?.hoverTransform || 'none'}
              onchange={(e) =>
                updateMotionEffect({
                  hoverTransform: (e.target as HTMLSelectElement).value
                })}
              class="studio-select"
            >
              <option value="none">None</option>
              <option value="lift">Float Up (-5px)</option>
              <option value="scale">Scale (1.02x)</option>
              <option value="glow">Primary Glow</option>
              <option value="tilt">3D Tilt</option>
            </select>
          </div>
          <div class="field-item">
            <label for="adv-sticky" class="field-label">Sticky Position</label>
            <select
              id="adv-sticky"
              value={selectedNode.motionEffects?.sticky || 'none'}
              onchange={(e) =>
                updateMotionEffect({
                  sticky: (e.target as HTMLSelectElement).value
                })}
              class="studio-select"
            >
              <option value="none">None</option>
              <option value="top">Sticky Top</option>
              <option value="bottom">Sticky Bottom</option>
            </select>
          </div>
        </div>

        <div class="section-title" style="margin-top: 0.25rem;">📱 Responsive Device Visibility</div>
        <div class="repeater-card">
          <label class="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(selectedNode.motionEffects?.hideOnDesktop)}
              onchange={(e) =>
                updateMotionEffect({
                  hideOnDesktop: (e.target as HTMLInputElement).checked
                })}
              class="studio-checkbox"
            />
            <span class="checkbox-text">🖥️ Hide on Desktop (≥1024px)</span>
          </label>
          <label class="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(selectedNode.motionEffects?.hideOnTablet)}
              onchange={(e) =>
                updateMotionEffect({
                  hideOnTablet: (e.target as HTMLInputElement).checked
                })}
              class="studio-checkbox"
            />
            <span class="checkbox-text">💻 Hide on Tablet (768px–1023px)</span>
          </label>
          <label class="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(selectedNode.motionEffects?.hideOnMobile)}
              onchange={(e) =>
                updateMotionEffect({
                  hideOnMobile: (e.target as HTMLInputElement).checked
                })}
              class="studio-checkbox"
            />
            <span class="checkbox-text">📱 Hide on Mobile (&lt;768px)</span>
          </label>
        </div>

        <div class="section-title" style="margin-top: 0.25rem;">💻 Custom CSS (Elementor Pro `selector`)</div>
        <div class="field-item">
          <div class="spacing-pill-row" style="margin-top: 0; margin-bottom: 0.25rem;">
            {#each customCssSnippets as snip (snip.label)}
              <button
                type="button"
                onclick={() =>
                  editor.dispatch({
                    type: 'UPDATE_NODE_META',
                    nodeId: selectedNode.id,
                    meta: { customCss: snip.code }
                  })}
                class="spacing-pill"
              >
                + {snip.label}
              </button>
            {/each}
            {#if selectedNode.customCss}
              <button
                type="button"
                onclick={() =>
                  editor.dispatch({
                    type: 'UPDATE_NODE_META',
                    nodeId: selectedNode.id,
                    meta: { customCss: '' }
                  })}
                class="spacing-pill"
              >
                Clear
              </button>
            {/if}
          </div>
          <textarea
            id="adv-custom-css"
            aria-label="Elementor Pro Scoped Custom CSS"
            rows={4}
            placeholder={"selector {\n  border-radius: 16px;\n}"}
            value={selectedNode.customCss || ''}
            onchange={(e) =>
              editor.dispatch({
                type: 'UPDATE_NODE_META',
                nodeId: selectedNode.id,
                meta: { customCss: (e.target as HTMLTextAreaElement).value }
              })}
            class="studio-textarea font-mono"
          ></textarea>
          <span class="sub-label">Use <code>selector</code> to target this specific element cleanly.</span>
        </div>

        <div class="section-title" style="margin-top: 0.25rem;">⚡ Popup, Off-Canvas &amp; Click Actions</div>
        <p class="panel-sub">
          Trigger Popups, Off-Canvas Drawers, Route Navigation, or Reactive State changes on click.
        </p>

        <div class="field-item">
          <label for="click-action" class="field-label">On Click Action</label>
          <select
            id="click-action"
            value={clickRule?.actionType || 'none'}
            onchange={(e) =>
              setClickInteraction(
                (e.target as HTMLSelectElement).value as
                  | 'none'
                  | 'navigate'
                  | 'openModal'
                  | 'toggleDrawer'
                  | 'showToast'
                  | 'setState'
                  | 'submitForm'
              )}
            class="studio-select"
          >
            <option value="none">None (Component Default)</option>
            <option value="navigate">Navigate to Page Route</option>
            <option value="openModal">Open MD3 Modal Dialog</option>
            <option value="toggleDrawer">Toggle Slide-Over Sheet Drawer</option>
            <option value="showToast">Show MD3 Snackbar Toast</option>
            <option value="setState">Set Reactive App State</option>
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
                setClickInteraction('navigate', {
                  path: (e.target as HTMLSelectElement).value
                })}
              class="studio-select"
            >
              {#each editor.blueprint.pages as p (p.id)}
                <option value={p.path}>{p.path} ({p.title})</option>
              {/each}
            </select>
          </div>
        {:else if clickRule?.actionType === 'openModal'}
          <div class="field-item">
            <label for="modal-title-in" class="field-label">Modal Headline</label>
            <input
              id="modal-title-in"
              type="text"
              value={(clickRule.payload?.modalTitle as string) || ''}
              onchange={(e) =>
                setClickInteraction('openModal', {
                  modalTitle: (e.target as HTMLInputElement).value
                })}
              class="studio-input"
            />
          </div>
          <div class="field-item">
            <label for="modal-body-in" class="field-label">Modal Body Copy</label>
            <textarea
              id="modal-body-in"
              rows="2"
              value={(clickRule.payload?.modalBody as string) || ''}
              onchange={(e) =>
                setClickInteraction('openModal', {
                  modalBody: (e.target as HTMLTextAreaElement).value
                })}
              class="studio-textarea"
            ></textarea>
          </div>
        {:else if clickRule?.actionType === 'toggleDrawer'}
          <div class="field-item">
            <label for="drawer-title-in" class="field-label">Drawer Sheet Title</label>
            <input
              id="drawer-title-in"
              type="text"
              value={(clickRule.payload?.drawerTitle as string) || ''}
              onchange={(e) =>
                setClickInteraction('toggleDrawer', {
                  drawerTitle: (e.target as HTMLInputElement).value
                })}
              class="studio-input"
            />
          </div>
          <div class="field-item">
            <label for="drawer-body-in" class="field-label">Drawer Sheet Content</label>
            <textarea
              id="drawer-body-in"
              rows="2"
              value={(clickRule.payload?.drawerBody as string) || ''}
              onchange={(e) =>
                setClickInteraction('toggleDrawer', {
                  drawerBody: (e.target as HTMLTextAreaElement).value
                })}
              class="studio-textarea"
            ></textarea>
          </div>
        {:else if clickRule?.actionType === 'showToast'}
          <div class="field-item">
            <label for="toast-msg-in" class="field-label">Toast Notification Message</label>
            <input
              id="toast-msg-in"
              type="text"
              value={(clickRule.payload?.toastMessage as string) || ''}
              onchange={(e) =>
                setClickInteraction('showToast', {
                  toastMessage: (e.target as HTMLInputElement).value
                })}
              class="studio-input"
            />
          </div>
        {:else if clickRule?.actionType === 'setState'}
          <div class="grid-2">
            <div class="field-item">
              <label for="state-key-in" class="field-label">State Variable Key</label>
              <input
                id="state-key-in"
                type="text"
                value={(clickRule.payload?.stateKey as string) || 'planTier'}
                onchange={(e) =>
                  setClickInteraction('setState', {
                    stateKey: (e.target as HTMLInputElement).value
                  })}
                class="studio-input font-mono"
              />
            </div>
            <div class="field-item">
              <label for="state-val-in" class="field-label">New Value</label>
              <input
                id="state-val-in"
                type="text"
                value={(clickRule.payload?.stateValue as string) || 'enterprise'}
                onchange={(e) =>
                  setClickInteraction('setState', {
                    stateValue: (e.target as HTMLInputElement).value
                  })}
                class="studio-input font-mono"
              />
            </div>
          </div>
        {/if}

        {#if clickRule}
          <button
            type="button"
            onclick={() => {
              editor.isInteractiveMode = true;
            }}
            class="studio-btn add-item-btn"
          >
            ▶ Switch to Interactive Mode to Test Rule
          </button>
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
  {:else if editor.activePage}
    <!-- Active Page Route & SEO Inspector when no node is selected -->
    <div class="inspector-header">
      <div>
        <div class="header-row">
          <span style="font-size: 0.8125rem; font-weight: 700;">📄 Page & SEO Settings</span>
          <span class="node-type-badge">route</span>
        </div>
        <div class="node-id">{editor.activePage.path}</div>
      </div>
    </div>

    <div class="studio-panel-content flow-v">
      <div class="field-item">
        <label for="page-meta-title" class="field-label">Document Title (&lt;title&gt;)</label>
        <input
          id="page-meta-title"
          type="text"
          value={editor.activePage.title}
          onchange={(e) =>
            editor.dispatch({
              type: 'UPDATE_PAGE_META',
              pageId: editor.activePage!.id,
              meta: { title: (e.target as HTMLInputElement).value }
            })}
          class="studio-input"
        />
      </div>

      <div class="field-item">
        <label for="page-meta-path" class="field-label">Route Path</label>
        <input
          id="page-meta-path"
          type="text"
          value={editor.activePage.path}
          onchange={(e) =>
            editor.dispatch({
              type: 'UPDATE_PAGE_META',
              pageId: editor.activePage!.id,
              meta: { path: (e.target as HTMLInputElement).value }
            })}
          class="studio-input"
        />
      </div>

      <div class="field-item">
        <label for="page-meta-desc" class="field-label">Meta Description (SEO)</label>
        <textarea
          id="page-meta-desc"
          rows={3}
          value={editor.activePage.description || ''}
          onchange={(e) =>
            editor.dispatch({
              type: 'UPDATE_PAGE_META',
              pageId: editor.activePage!.id,
              meta: { description: (e.target as HTMLTextAreaElement).value }
            })}
          class="studio-textarea"
        ></textarea>
      </div>

      <div class="field-item">
        <label for="page-meta-layout" class="field-label">Shared Layout Wrapper</label>
        <select
          id="page-meta-layout"
          value={editor.activePage.layoutId || ''}
          onchange={(e) => {
            const val = (e.target as HTMLSelectElement).value;
            editor.dispatch({
              type: 'UPDATE_PAGE_META',
              pageId: editor.activePage!.id,
              meta: { layoutId: val ? val : undefined }
            });
          }}
          class="studio-select"
        >
          <option value="">Standalone (No Shared Header/Footer)</option>
          {#each editor.blueprint.layouts as layout (layout.id)}
            <option value={layout.id}>{layout.name}</option>
          {/each}
        </select>
      </div>

      <div class="section-title" style="margin-top: 0.5rem;">Sections on This Page</div>
      <div class="repeater-stack">
        {#each editor.activePage.rootNode.children || [] as section (section.id)}
          <button
            type="button"
            onclick={() => editor.selectNode(section.id)}
            class="page-sec-btn"
          >
            <span>{section.name}</span>
            <span class="node-type-badge">{section.componentType.split('/')[1]}</span>
          </button>
        {/each}
      </div>
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
    width: 7.5rem;
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
    gap: 0.1rem;
  }
  .action-btn {
    padding: 0.2rem 0.3rem;
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
    transition: all var(--md-sys-motion-duration-short);
  }
  .action-btn:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-high);
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
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
    background-color: var(--md-sys-color-surface-container);
    padding: 3px;
    border-radius: var(--md-sys-shape-corner-extra-small);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .bp-target-btn {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    padding: 0.3rem 0.2rem;
    border-radius: 3px;
    color: var(--md-sys-color-on-surface-variant);
    text-align: center;
  }
  .bp-target-btn--active {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-weight: 700;
  }
  .field-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .field-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .field-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface-variant);
  }
  .json-toggle-btn {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    color: var(--md-sys-color-primary);
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .repeater-stack {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .repeater-card {
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 6px;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }
  .repeater-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding-bottom: 0.35rem;
  }
  .repeater-card__title {
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--md-sys-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 170px;
  }
  .repeater-card__actions {
    display: flex;
    gap: 0.15rem;
  }
  .rep-btn {
    font-size: 0.6875rem;
    padding: 0.1rem 0.3rem;
    color: var(--md-sys-color-on-surface-variant);
    border-radius: 3px;
  }
  .rep-btn:hover {
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
  }
  .rep-btn--danger:hover {
    color: var(--md-sys-color-error);
  }
  .repeater-fields {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .sub-field {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .sub-label {
    font-size: 0.625rem;
    color: var(--md-sys-color-outline);
    text-transform: capitalize;
  }
  .add-item-btn {
    width: 100%;
    border: 1px dashed var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
    padding: 0.4rem;
    font-size: 0.6875rem;
    font-weight: 600;
  }
  .page-sec-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    background-color: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    color: var(--md-sys-color-on-surface);
    font-size: 0.75rem;
    text-align: left;
  }
  .page-sec-btn:hover {
    border-color: var(--md-sys-color-primary);
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
    width: 15px;
    height: 15px;
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
  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .box-model-outer {
    position: relative;
    background: var(--md-sys-color-surface-container);
    border: 1px dashed var(--md-sys-color-outline);
    border-radius: 10px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }
  .box-model-tag {
    position: absolute;
    top: 4px;
    left: 6px;
    font-size: 0.5625rem;
    font-family: var(--md-sys-font-mono);
    font-weight: 700;
    color: var(--md-sys-color-outline);
  }
  .box-model-tag--pad {
    color: var(--md-sys-color-primary);
  }
  .box-model-mid {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
  }
  .box-model-inner {
    position: relative;
    flex: 1;
    background: var(--md-sys-color-surface-container-high);
    border: 1px solid var(--md-sys-color-primary);
    border-radius: 8px;
    padding: 0.45rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
  }
  .box-model-core-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.25rem;
  }
  .box-core-badge {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    background: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    padding: 0.125rem 0.375rem;
    border-radius: 4px;
    max-width: 72px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .box-input {
    width: 44px;
    text-align: center;
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    background: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 4px;
    padding: 2px 3px;
  }
  .spacing-pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }
  .spacing-pill {
    font-size: 0.625rem;
    font-family: var(--md-sys-font-mono);
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    border: 1px solid var(--md-sys-color-outline-variant);
    background: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface-variant);
    cursor: pointer;
  }
  .spacing-pill:hover {
    border-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-primary);
  }
</style>
