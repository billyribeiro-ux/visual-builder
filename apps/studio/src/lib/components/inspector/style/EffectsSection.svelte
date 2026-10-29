<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import SlidersHorizontalIcon from 'phosphor-svelte/lib/SlidersHorizontalIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import Seg, { type SegOption } from '../controls/Seg.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import StyleSelect from '../controls/StyleSelect.svelte';
  import ShadowEditor from '../controls/ShadowEditor.svelte';
  import SliderField from '../controls/SliderField.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';
  import { colorSwatches } from '../lib/swatches.js';
  import {
    parseFilter,
    serializeFilter,
    parseTransform,
    serializeTransform,
    parseTransition,
    serializeTransition,
    type FilterName,
    type TransformParts
  } from '../lib/css-values.js';

  const s = getStyleTarget();
  const swatches = $derived(colorSwatches(editor.blueprint.tokens?.colors));

  const KEYS = ['boxShadow', 'opacity', 'filter', 'backdropFilter', 'transform', 'transition', 'cursor', 'mixBlendMode'] as const;
  const modified = $derived(s.anySet(KEYS));

  /* Shadow ---------------------------------------------------------------------------------- */

  const SHADOWS: Record<string, string> = {
    none: 'none',
    xs: '0 1px 2px rgba(16, 24, 40, 0.05)',
    sm: '0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06)',
    md: '0 4px 8px -2px rgba(16, 24, 40, 0.1), 0 2px 4px -2px rgba(16, 24, 40, 0.06)',
    lg: '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)',
    xl: '0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)'
  };
  const SHADOW_OPTIONS: SegOption<string>[] = [
    { value: 'none', label: 'None', title: 'No shadow' },
    { value: 'xs', label: 'XS', title: 'Extra small' },
    { value: 'sm', label: 'SM', title: 'Small' },
    { value: 'md', label: 'MD', title: 'Medium' },
    { value: 'lg', label: 'LG', title: 'Large' },
    { value: 'xl', label: 'XL', title: 'Extra large' }
  ];
  const normalizeShadow = (v: string) => v.replace(/\s+/g, ' ').replace(/,\s*/g, ', ').trim().toLowerCase();
  const shadow = $derived(s.effective('boxShadow'));
  const shadowPreset = $derived(Object.entries(SHADOWS).find(([, v]) => normalizeShadow(v) === normalizeShadow(shadow))?.[0] ?? '');

  /** Theme elevation levels exposed by the token stylesheet as `--md-sys-elevation-<key>`. */
  const elevationOptions = $derived(
    Object.keys(editor.blueprint.tokens?.shadows ?? {})
      .filter((k) => /^level[1-5]$/.test(k))
      .sort()
      .map((k) => ({ value: `var(--md-sys-elevation-${k})`, label: k.replace('level', ''), title: `Theme elevation ${k.replace('level', '')}` }))
  );
  const elevation = $derived(elevationOptions.find((o) => o.value === shadow)?.value ?? '');
  let customShadow = $state(false);
  const showCustom = $derived(customShadow || (shadow !== '' && !shadowPreset && !elevation));

  /* Opacity --------------------------------------------------------------------------------- */

  const toPct = (v: string): number | null => {
    if (!v) return null;
    const n = v.endsWith('%') ? Number(v.slice(0, -1)) : Number(v) * 100;
    return Number.isFinite(n) ? Math.round(n) : null;
  };
  const opacity = $derived(toPct(s.get('opacity')));
  const opacityInherited = $derived(toPct(s.inheritedOf('opacity')));

  /* Filters --------------------------------------------------------------------------------- */

  const FILTERS: ReadonlyArray<{ name: FilterName; label: string; units: string[]; min: number }> = [
    { name: 'blur', label: 'Blur', units: ['px'], min: 0 },
    { name: 'brightness', label: 'Brightness', units: ['%'], min: 0 },
    { name: 'contrast', label: 'Contrast', units: ['%'], min: 0 },
    { name: 'grayscale', label: 'Grayscale', units: ['%'], min: 0 },
    { name: 'saturate', label: 'Saturation', units: ['%'], min: 0 }
  ];
  const filterOwn = $derived(parseFilter(s.get('filter')));
  const filterInherited = $derived(parseFilter(s.inheritedOf('filter')));

  function setFilter(name: FilterName, value: string) {
    const values = { ...filterOwn.values, [name]: value };
    s.set('filter', serializeFilter(values, filterOwn.rest));
  }

  const backdropOwn = $derived(parseFilter(s.get('backdropFilter')));
  const backdropInherited = $derived(parseFilter(s.inheritedOf('backdropFilter')));

  /* Transform ------------------------------------------------------------------------------- */

  const transformOwn = $derived(parseTransform(s.get('transform')));
  const transformInherited = $derived(parseTransform(s.inheritedOf('transform')));
  function setTransform(patch: Partial<TransformParts>) {
    s.set('transform', serializeTransform({ ...transformOwn, ...patch }));
  }

  /* Transition ------------------------------------------------------------------------------ */

  const DURATIONS: SegOption<string>[] = [
    { value: 'none', label: 'Off', title: 'No transition' },
    { value: '150ms', label: '150', title: '150 ms — fast' },
    { value: '250ms', label: '250', title: '250 ms — standard' },
    { value: '400ms', label: '400', title: '400 ms — slow' }
  ];
  const EASINGS = [
    { value: 'cubic-bezier(0.2, 0, 0, 1)', label: 'Standard' },
    { value: 'ease', label: 'Ease' },
    { value: 'ease-out', label: 'Ease out' },
    { value: 'ease-in-out', label: 'Ease in-out' },
    { value: 'linear', label: 'Linear' }
  ];
  const transition = $derived(parseTransition(s.effective('transition')));
  const transitionValue = $derived(s.effective('transition') === 'none' ? 'none' : (transition?.duration ?? ''));

  function setTransition(patch: { duration?: string; easing?: string }) {
    if (patch.duration === 'none') {
      s.set('transition', 'none');
      return;
    }
    const base = transition ?? { property: 'all', duration: '250ms', easing: 'cubic-bezier(0.2, 0, 0, 1)' };
    s.set('transition', serializeTransition({ ...base, ...patch }));
  }

  const CURSORS = [
    { value: 'auto', label: 'Auto' },
    { value: 'default', label: 'Arrow' },
    { value: 'pointer', label: 'Pointer (link)' },
    { value: 'text', label: 'Text' },
    { value: 'move', label: 'Move' },
    { value: 'grab', label: 'Grab' },
    { value: 'not-allowed', label: 'Not allowed' },
    { value: 'help', label: 'Help' }
  ];

  const BLENDS = [
    'normal',
    'multiply',
    'screen',
    'overlay',
    'darken',
    'lighten',
    'color-dodge',
    'color-burn',
    'difference',
    'exclusion',
    'hue',
    'saturation',
    'color',
    'luminosity'
  ].map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1).replace('-', ' ') }));
</script>

<PanelSection id="style-effects" title="Effects" defaultOpen={false} {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset effects" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}

  <StyleField label="Shadow" keys={['boxShadow']} layout="stack">
    {#snippet adornment()}
      <button
        type="button"
        class="fx__link"
        aria-pressed={showCustom}
        onclick={() => (customShadow = !showCustom)}
      >
        <SlidersHorizontalIcon size={12} /> {showCustom ? 'Presets' : 'Customize'}
      </button>
    {/snippet}
    <Seg
      options={SHADOW_OPTIONS}
      value={shadowPreset}
      inherited={!s.isSet('boxShadow')}
      ariaLabel="Shadow preset"
      onchange={(k) => {
        customShadow = false;
        s.set('boxShadow', SHADOWS[k]);
      }}
    />
  </StyleField>
  {#if elevationOptions.length > 0}
    <StyleField label="Elevation" keys={[]}>
      <Seg
        options={elevationOptions}
        value={elevation}
        inherited={!s.isSet('boxShadow')}
        ariaLabel="Theme elevation"
        onchange={(v) => s.set('boxShadow', v)}
      />
    </StyleField>
  {/if}
  {#if showCustom}
    <ShadowEditor value={shadow} {swatches} onchange={(css) => s.set('boxShadow', css)} />
  {/if}

  <StyleField label="Opacity" keys={['opacity']}>
    <SliderField
      value={opacity}
      placeholder={opacityInherited ?? 100}
      ariaLabel="Opacity"
      onchange={(n) => s.set('opacity', n === null ? '' : String(Math.round(n) / 100))}
      onend={s.endEdit}
    />
  </StyleField>
  <StyleSelect prop="mixBlendMode" label="Blend" options={BLENDS} />

  <p class="sx-section-label fx__sub">Filters</p>
  {#each FILTERS as f (f.name)}
    <StyleField label={f.label} keys={['filter']}>
      <LengthInput
        value={filterOwn.values[f.name] ?? ''}
        placeholder={filterInherited.values[f.name] || '—'}
        ariaLabel="{f.label} filter"
        units={f.units}
        min={f.min}
        onchange={(v) => setFilter(f.name, v)}
      />
    </StyleField>
  {/each}
  <StyleField label="Backdrop" keys={['backdropFilter']}>
    <LengthInput
      value={backdropOwn.values.blur ?? ''}
      placeholder={backdropInherited.values.blur || '—'}
      ariaLabel="Backdrop blur"
      units={['px']}
      min={0}
      onchange={(v) => s.set('backdropFilter', serializeFilter({ ...backdropOwn.values, blur: v }, backdropOwn.rest))}
    />
  </StyleField>

  <p class="sx-section-label fx__sub">Transform</p>
  <StyleField label="Move" keys={['transform']}>
    <div class="pair">
      <LengthInput
        value={transformOwn.translateX}
        placeholder={transformInherited.translateX || '—'}
        ariaLabel="Move horizontally"
        scrub="X"
        units={['px', '%', 'rem']}
        onchange={(v) => setTransform({ translateX: v })}
      />
      <LengthInput
        value={transformOwn.translateY}
        placeholder={transformInherited.translateY || '—'}
        ariaLabel="Move vertically"
        scrub="Y"
        units={['px', '%', 'rem']}
        onchange={(v) => setTransform({ translateY: v })}
      />
    </div>
  </StyleField>
  <StyleField label="Rotate" keys={['transform']}>
    <LengthInput
      value={transformOwn.rotate}
      placeholder={transformInherited.rotate || '—'}
      ariaLabel="Rotate"
      units={['deg', 'turn']}
      onchange={(v) => setTransform({ rotate: v })}
    />
  </StyleField>
  <StyleField label="Scale" keys={['transform']}>
    <LengthInput
      value={transformOwn.scale}
      placeholder={transformInherited.scale || '—'}
      ariaLabel="Scale"
      unitless
      min={0}
      step={0.05}
      onchange={(v) => setTransform({ scale: v })}
    />
  </StyleField>

  <p class="sx-section-label fx__sub">Interaction</p>
  <StyleField label="Transition" keys={['transition']}>
    <Seg
      options={DURATIONS}
      value={transitionValue}
      inherited={!s.isSet('transition')}
      ariaLabel="Transition duration (ms)"
      onchange={(d) => setTransition({ duration: d })}
    />
  </StyleField>
  {#if transition}
    <StyleField label="Easing" keys={['transition']}>
      <select
        class="sx-select"
        aria-label="Transition easing"
        value={EASINGS.some((e) => e.value === transition.easing) ? transition.easing : '__custom'}
        onchange={(e) => e.currentTarget.value !== '__custom' && setTransition({ easing: e.currentTarget.value })}
      >
        {#each EASINGS as e (e.value)}<option value={e.value}>{e.label}</option>{/each}
        {#if !EASINGS.some((e) => e.value === transition.easing)}<option value="__custom">{transition.easing}</option>{/if}
      </select>
    </StyleField>
  {/if}
  <StyleSelect prop="cursor" label="Cursor" options={CURSORS} />
</PanelSection>

<style>
  .fx__sub {
    padding: 6px 0 0;
  }
  .fx__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    height: 18px;
    padding: 0 6px;
    border-radius: var(--sx-radius-xs);
    font-size: var(--sx-text-xs);
    font-weight: 600;
    color: var(--sx-accent-text);
  }
  .fx__link:hover {
    background: var(--sx-accent-soft);
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
</style>
