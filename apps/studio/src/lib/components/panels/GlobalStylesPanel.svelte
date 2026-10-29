<script lang="ts">
  import { editor } from '#lib/state/editor.svelte.js';
  import { DesignTokensSchema, MD3_THEME_PRESETS, type DesignTokens } from '@app-viz/schema';
  import IconButton from '#lib/ui/IconButton.svelte';
  import PanelSection from '#lib/ui/PanelSection.svelte';
  import ColorField from '#lib/ui/ColorField.svelte';
  import UnitInput from '#lib/ui/UnitInput.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import InlineConfirm from '../dialogs/InlineConfirm.svelte';
  import { humanizeKey, themePresetName } from '../dialogs/copy.js';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';

  type TokenGroup = 'colors' | 'radii' | 'shadows' | 'spacing';

  const tokens = $derived(editor.blueprint.tokens);
  const colors = $derived(tokens.colors ?? {});
  let confirmReset = $state(false);

  /* ------------------------------------------------------------------ presets */

  const presets = Object.entries(MD3_THEME_PRESETS).map(([key, preset]) => ({
    key,
    name: themePresetName(key, preset.label),
    colors: preset.colors,
    dark: luminance(preset.colors.surface ?? '#ffffff') < 0.4
  }));

  function luminance(hex: string): number {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return 1;
    const n = Number.parseInt(m[1], 16);
    return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }

  const activePreset = $derived(
    presets.find((p) => Object.entries(p.colors).every(([k, v]) => (colors[k] ?? '').toLowerCase() === v.toLowerCase()))?.key ?? null
  );

  function applyPreset(presetColors: Record<string, string>) {
    editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { colors: { ...presetColors } } });
  }

  /* ------------------------------------------------------------------- colors */

  const COLOR_GROUPS: Array<{ id: string; title: string; test: (key: string) => boolean }> = [
    { id: 'text', title: 'Text & outline', test: (k) => /^on-surface|^outline/.test(k) },
    { id: 'surface', title: 'Surface', test: (k) => /^surface/.test(k) },
    { id: 'brand', title: 'Brand', test: (k) => /^(on-)?(primary|secondary|tertiary)\b/.test(k) },
    { id: 'feedback', title: 'Feedback', test: (k) => /^(on-)?(error|success|warning|info)\b/.test(k) }
  ];
  const GROUP_ORDER = ['brand', 'surface', 'text', 'feedback', 'other'];

  const colorGroups = $derived.by(() => {
    const buckets: Record<string, string[]> = { brand: [], surface: [], text: [], feedback: [], other: [] };
    for (const key of Object.keys(colors)) {
      const group = COLOR_GROUPS.find((g) => g.test(key))?.id ?? 'other';
      buckets[group].push(key);
    }
    const titles: Record<string, string> = { brand: 'Brand', surface: 'Surface', text: 'Text & outline', feedback: 'Feedback', other: 'Other' };
    return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((id) => ({ id, title: titles[id], keys: buckets[id] }));
  });

  /** Native color pickers fire continuously; batch writes per animation frame. */
  let pending: Partial<Record<TokenGroup, Record<string, string>>> = {};
  let frame = 0;

  function queue(group: TokenGroup, key: string, value: string) {
    pending[group] = { ...pending[group], [key]: value };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const batch = pending;
      pending = {};
      const next: Partial<DesignTokens> = {};
      for (const [g, values] of Object.entries(batch) as Array<[TokenGroup, Record<string, string>]>) {
        next[g] = { ...($state.snapshot(editor.blueprint.tokens[g]) as Record<string, string>), ...values };
      }
      editor.dispatch({ type: 'UPDATE_TOKENS', tokens: next });
    });
  }

  function setColor(key: string, value: string) {
    const v = value.trim();
    if (!v) {
      editor.notify('warning', `${humanizeKey(key)} needs a color; tokens cannot be empty.`);
      return;
    }
    if (!CSS.supports('color', v)) {
      editor.notify('error', `“${v}” is not a valid CSS color.`);
      return;
    }
    queue('colors', key, v);
  }

  /* ------------------------------------------------------------- typography */

  const SANS = [
    { label: 'Inter', value: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif' },
    { label: 'Roboto', value: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    { label: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif' },
    { label: 'System UI', value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    { label: 'Georgia (serif)', value: 'Georgia, Cambria, "Times New Roman", serif' }
  ];
  const MONO = [
    { label: 'JetBrains Mono', value: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace' },
    { label: 'Roboto Mono', value: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
    { label: 'System mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }
  ];
  const FONT_ROWS = [
    { key: 'heading', label: 'Headings', options: SANS },
    { key: 'body', label: 'Body', options: SANS },
    { key: 'mono', label: 'Code', options: MONO }
  ] as const;

  function setFont(key: 'heading' | 'body' | 'mono', value: string) {
    const v = value.trim();
    if (!v) {
      editor.notify('warning', 'A font stack cannot be empty.');
      return;
    }
    if (!CSS.supports('font-family', v)) {
      editor.notify('error', `“${v}” is not a valid font-family list.`);
      return;
    }
    editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { fonts: { ...($state.snapshot(tokens.fonts) as DesignTokens['fonts']), [key]: v } } });
  }

  /* ------------------------------------------------------- radii / shadows / spacing */

  /** Short aliases mirror their canonical key while they still hold the same value. */
  const RADIUS_ALIASES: Record<string, string> = { 'extra-small': 'sm', medium: 'md', large: 'lg', 'extra-large': 'xl' };

  function setRadius(key: string, value: string) {
    const v = value.trim() || '0px';
    if (!CSS.supports('border-radius', v)) {
      editor.notify('error', `“${v}” is not a valid radius.`);
      return;
    }
    const radii = $state.snapshot(tokens.radii) as Record<string, string>;
    const next = { ...radii, [key]: v };
    const alias = RADIUS_ALIASES[key];
    if (alias && radii[alias] === radii[key]) next[alias] = v;
    editor.dispatch({ type: 'UPDATE_TOKENS', tokens: { radii: next } });
  }

  function setShadow(key: string, value: string) {
    const v = value.trim() || 'none';
    if (!CSS.supports('box-shadow', v)) {
      editor.notify('error', `“${v}” is not a valid box-shadow.`);
      return;
    }
    queue('shadows', key, v);
  }

  function setSpacing(key: string, value: string) {
    const v = value.trim();
    if (!v || !CSS.supports('padding', v)) {
      editor.notify('error', `“${v || 'empty'}” is not a valid length.`);
      return;
    }
    queue('spacing', key, v);
  }

  function pxValue(value: string): number {
    const n = Number.parseFloat(value);
    if (!Number.isFinite(n)) return 0;
    return value.trim().endsWith('rem') ? n * 16 : n;
  }

  const maxSpacing = $derived(Math.max(1, ...Object.values(tokens.spacing ?? {}).map(pxValue)));

  function resetAll() {
    const defaults = DesignTokensSchema.parse({});
    editor.dispatch({ type: 'UPDATE_TOKENS', tokens: defaults });
    confirmReset = false;
    editor.notify('info', 'Global styles reset to defaults. Press ⌘Z to undo.');
  }
</script>

<div class="sx-panel gs">
  <div class="sx-panel__header">
    <h2 class="sx-panel__title">Global styles</h2>
    <IconButton label="Reset to defaults" icon={ArrowCounterClockwiseIcon} active={confirmReset} onclick={() => (confirmReset = !confirmReset)} />
  </div>

  {#if confirmReset}
    <div class="gs__confirm">
      <InlineConfirm message="Reset every token?" confirmLabel="Reset" onconfirm={resetAll} oncancel={() => (confirmReset = false)} />
    </div>
  {/if}

  <div class="sx-panel__body">
    <PanelSection id="gs-presets" title="Theme presets">
      <div class="presets" role="group" aria-label="Theme presets">
        {#each presets as preset (preset.key)}
          {@const on = activePreset === preset.key}
          <button type="button" class={['preset', on && 'preset--on']} aria-pressed={on} onclick={() => applyPreset(preset.colors)}>
            <span class="preset__canvas" style:background={preset.colors.surface}>
              <span class="preset__bar" style:background={preset.colors.primary}></span>
              <span class="preset__lines">
                <span style:background={preset.colors['on-surface']}></span>
                <span style:background={preset.colors['outline-variant'] ?? preset.colors.outline}></span>
              </span>
              <span class="preset__chips">
                <span style:background={preset.colors.primary}></span>
                <span style:background={preset.colors['primary-container']}></span>
                <span style:background={preset.colors['secondary-container'] ?? preset.colors.secondary}></span>
              </span>
              {#if on}<span class="preset__check"><CheckIcon size={10} weight="bold" /></span>{/if}
            </span>
            <span class="preset__meta">
              <span class="preset__name">{preset.name}</span>
              <span class="preset__mode">{preset.dark ? 'Dark' : 'Light'}</span>
            </span>
          </button>
        {/each}
      </div>
      {#if !activePreset}
        <p class="sx-help">Custom palette — applying a preset replaces every color token.</p>
      {/if}
    </PanelSection>

    <PanelSection id="gs-colors" title="Colors">
      {#each colorGroups as group (group.id)}
        <div class="group">
          <div class="group__title">{group.title}</div>
          {#each group.keys as key (key)}
            <div class="crow">
              <span class="crow__label" {@attach tooltip(`--md-sys-color-${key}`)}>{humanizeKey(key)}</span>
              <div class="crow__field">
                <ColorField value={colors[key]} ariaLabel={humanizeKey(key)} onchange={(v) => setColor(key, v)} />
              </div>
            </div>
          {/each}
        </div>
      {/each}
    </PanelSection>

    <PanelSection id="gs-type" title="Typography">
      <div class="specimen">
        <span class="specimen__heading" style:font-family={tokens.fonts?.heading}>Build with clarity</span>
        <span class="specimen__body" style:font-family={tokens.fonts?.body}>Body copy sets the reading rhythm for every page, card and form.</span>
        <code class="specimen__mono" style:font-family={tokens.fonts?.mono}>const total = items.length;</code>
      </div>
      {#each FONT_ROWS as row (row.key)}
        {@const current = tokens.fonts?.[row.key] ?? ''}
        {@const known = row.options.find((o) => o.value === current)}
        <div class="font">
          <label class="font__label" for="gs-font-{row.key}">{row.label}</label>
          <select
            id="gs-font-{row.key}"
            class="sx-select"
            value={known ? known.value : '__custom'}
            onchange={(e) => {
              const v = (e.currentTarget as HTMLSelectElement).value;
              if (v !== '__custom') setFont(row.key, v);
            }}
          >
            {#each row.options as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
            {#if !known}<option value="__custom">Custom stack</option>{/if}
          </select>
          <input
            class="sx-input sx-input--mono font__stack"
            aria-label="{row.label} font stack"
            spellcheck="false"
            value={current}
            onchange={(e) => setFont(row.key, (e.currentTarget as HTMLInputElement).value)}
          />
        </div>
      {/each}
    </PanelSection>

    <PanelSection id="gs-radii" title="Corner radius" defaultOpen={false}>
      {#each Object.entries(tokens.radii ?? {}) as [key, value] (key)}
        <div class="trow">
          <span class="radius-swatch" style:border-radius={value} aria-hidden="true"></span>
          <span class="trow__label" {@attach tooltip(`--md-sys-shape-corner-${key}`)}>{humanizeKey(key)}</span>
          <div class="trow__field">
            <UnitInput {value} ariaLabel="{humanizeKey(key)} radius" units={['px', 'rem', '%']} min={0} onchange={(v) => setRadius(key, v)} />
          </div>
        </div>
      {/each}
    </PanelSection>

    <PanelSection id="gs-shadows" title="Shadows" defaultOpen={false}>
      {#each Object.entries(tokens.shadows ?? {}) as [key, value] (key)}
        <div class="shadow">
          <span class="shadow__stage" aria-hidden="true"><span class="shadow__card" style:box-shadow={value}></span></span>
          <div class="shadow__fields">
            <span class="trow__label" {@attach tooltip(`--md-sys-elevation-${key}`)}>{humanizeKey(key.replace(/^level/, 'level-'))}</span>
            <input
              class="sx-input sx-input--mono"
              aria-label="{humanizeKey(key)} box-shadow"
              spellcheck="false"
              {value}
              onchange={(e) => setShadow(key, (e.currentTarget as HTMLInputElement).value)}
            />
          </div>
        </div>
      {/each}
    </PanelSection>

    <PanelSection id="gs-spacing" title="Spacing scale" defaultOpen={false}>
      {#each Object.entries(tokens.spacing ?? {}) as [key, value] (key)}
        <div class="trow">
          <span class="space__key" {@attach tooltip(`--md-sys-spacing-${key}`)}>{key}</span>
          <span class="space__track" aria-hidden="true">
            <span class="space__bar" style:width="{Math.max(4, (pxValue(value) / maxSpacing) * 100)}%"></span>
          </span>
          <div class="trow__field">
            <UnitInput {value} ariaLabel="Spacing {key}" units={['px', 'rem']} min={0} onchange={(v) => setSpacing(key, v)} />
          </div>
        </div>
      {/each}
    </PanelSection>
  </div>
</div>

<style>
  .gs {
    height: 100%;
  }
  .gs__confirm {
    padding: 8px 12px 8px 14px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-danger-soft);
  }
  .presets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }
  .preset {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 4px 6px;
    text-align: left;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease);
  }
  .preset:hover {
    border-color: var(--sx-border-strong);
  }
  .preset--on,
  .preset--on:hover {
    border-color: var(--sx-accent);
    box-shadow: 0 0 0 1px var(--sx-accent);
  }
  .preset__canvas {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 56px;
    padding: 8px;
    border-radius: 5px;
    box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.08);
    overflow: hidden;
  }
  .preset__bar {
    width: 38%;
    height: 6px;
    border-radius: 3px;
  }
  .preset__lines {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .preset__lines span {
    height: 3px;
    border-radius: 2px;
    opacity: 0.7;
  }
  .preset__lines span:first-child {
    width: 80%;
  }
  .preset__lines span:last-child {
    width: 56%;
  }
  .preset__chips {
    display: flex;
    gap: 4px;
    margin-top: auto;
  }
  .preset__chips span {
    width: 14px;
    height: 10px;
    border-radius: 3px;
    box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.1);
  }
  .preset__check {
    position: absolute;
    top: 6px;
    right: 6px;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    color: #fff;
    background: var(--sx-accent);
  }
  .preset__meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 6px;
    padding: 0 3px;
  }
  .preset__name {
    font-size: var(--sx-text-sm);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .preset__mode {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
  .group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .group + .group {
    margin-top: 6px;
  }
  .group__title {
    padding: 2px 0 4px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
  }
  .crow {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 132px;
    align-items: center;
    gap: 8px;
    min-height: 28px;
  }
  .crow__label,
  .trow__label {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .crow__field {
    min-width: 0;
  }
  /* Tokens can never be empty, so the field's clear affordance is hidden here. */
  .crow__field :global(.color__clear) {
    display: none;
  }
  .crow__field :global(.color__input) {
    padding-right: 8px;
  }
  .specimen {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
  }
  .specimen__heading {
    font-size: 19px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.01em;
    color: var(--sx-text);
  }
  .specimen__body {
    font-size: 12.5px;
    line-height: 1.55;
    color: var(--sx-text-2);
  }
  .specimen__mono {
    font-size: 11.5px;
    color: var(--sx-text-2);
  }
  .font {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    align-items: center;
    gap: 6px 8px;
  }
  .font__label {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .font__stack {
    grid-column: 2;
    height: var(--sx-control-h-sm);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
  }
  .trow {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) 104px;
    align-items: center;
    gap: 8px;
    min-height: 28px;
  }
  .trow__field {
    min-width: 0;
  }
  .radius-swatch {
    width: 22px;
    height: 22px;
    border: 1.5px solid var(--sx-text-2);
    border-right-color: transparent;
    border-bottom-color: transparent;
    background: linear-gradient(135deg, var(--sx-accent-soft), transparent 70%);
  }
  .shadow {
    display: grid;
    grid-template-columns: 56px minmax(0, 1fr);
    gap: 10px;
    align-items: center;
  }
  .shadow__stage {
    display: grid;
    place-items: center;
    height: 48px;
    border-radius: var(--sx-radius-sm);
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
  }
  .shadow__card {
    width: 30px;
    height: 22px;
    border-radius: 4px;
    background: #fff;
  }
  .shadow__fields {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .shadow__fields .sx-input {
    height: var(--sx-control-h-sm);
    font-size: var(--sx-text-xs);
  }
  .space__key {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
  }
  .space__track {
    display: block;
    height: 6px;
    border-radius: 3px;
    background: var(--sx-hover);
    overflow: hidden;
  }
  .space__bar {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--sx-accent);
    opacity: 0.55;
  }
</style>
