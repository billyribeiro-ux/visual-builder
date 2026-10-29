<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import SquareIcon from 'phosphor-svelte/lib/SquareIcon';
  import FrameCornersIcon from 'phosphor-svelte/lib/FrameCornersIcon';
  import BoundingBoxIcon from 'phosphor-svelte/lib/BoundingBoxIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import ColorField from '../../../ui/ColorField.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import Seg, { type SegOption } from '../controls/Seg.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';
  import { colorSwatches } from '../lib/swatches.js';
  import { expandSides, parseBorder } from '../lib/css-values.js';

  const s = getStyleTarget();
  const swatches = $derived(colorSwatches(editor.blueprint.tokens?.colors));

  const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const;
  const CORNERS = [
    { key: 'borderTopLeftRadius', scrub: 'TL', label: 'Top left' },
    { key: 'borderTopRightRadius', scrub: 'TR', label: 'Top right' },
    { key: 'borderBottomRightRadius', scrub: 'BR', label: 'Bottom right' },
    { key: 'borderBottomLeftRadius', scrub: 'BL', label: 'Bottom left' }
  ] as const;
  const SIDE_WIDTH_KEYS = SIDES.map((side) => `border${side}Width`);
  const CORNER_KEYS = CORNERS.map((c) => c.key);
  const BORDER_KEYS = ['border', 'borderWidth', 'borderStyle', 'borderColor', ...SIDE_WIDTH_KEYS];
  const RADIUS_KEYS = ['borderRadius', ...CORNER_KEYS];
  const KEYS = [...BORDER_KEYS, ...RADIUS_KEYS];
  const modified = $derived(s.anySet(KEYS));

  const STYLES: SegOption<string>[] = [
    { value: 'none', title: 'No border', glyph: 'border-none' },
    { value: 'solid', title: 'Solid', glyph: 'border-solid' },
    { value: 'dashed', title: 'Dashed', glyph: 'border-dashed' },
    { value: 'dotted', title: 'Dotted', glyph: 'border-dotted' }
  ];

  /** Parts of a legacy `border` shorthand: own (edited bucket) and effective. */
  const ownShort = $derived(parseBorder(s.get('border')));
  const effShort = $derived(parseBorder(s.effective('border')));

  const width = $derived({ own: s.get('borderWidth') || ownShort.width, eff: s.effective('borderWidth') || effShort.width });
  const style = $derived({ own: s.get('borderStyle') || ownShort.style, eff: s.effective('borderStyle') || effShort.style });
  const color = $derived({ own: s.get('borderColor') || ownShort.color, eff: s.effective('borderColor') || effShort.color });

  let sidesOpen = $state(false);
  let cornersOpen = $state(false);
  const showSides = $derived(sidesOpen || SIDE_WIDTH_KEYS.some((k) => s.effective(k)));
  const radiusParts = $derived(expandSides(s.effective('borderRadius')));
  const showCorners = $derived(
    cornersOpen || CORNER_KEYS.some((k) => s.effective(k)) || Boolean(radiusParts && new Set(radiusParts).size > 1)
  );

  /** Writes border parts; a `border` shorthand in the edited bucket is expanded first. */
  function setBorder(patch: Record<string, string>) {
    const p: Record<string, string> = { ...patch };
    if (s.get('border')) {
      p.border = '';
      if (!('borderWidth' in p) && ownShort.width) p.borderWidth = ownShort.width;
      if (!('borderStyle' in p) && ownShort.style) p.borderStyle = ownShort.style;
      if (!('borderColor' in p) && ownShort.color) p.borderColor = ownShort.color;
    }
    // A width without a style renders nothing; default to solid so the edit is visible.
    if (p.borderWidth && !style.eff && !p.borderStyle) p.borderStyle = 'solid';
    s.setMany(p);
  }

  function setCorner(key: string, value: string) {
    const p: Record<string, string> = { [key]: value };
    const own = s.get('borderRadius');
    if (own) {
      const parts = expandSides(own) ?? [own, own, own, own];
      p.borderRadius = '';
      CORNERS.forEach((c, i) => {
        if (c.key !== key) p[c.key] = s.get(c.key) || parts[i];
      });
    }
    s.setMany(p);
  }

  function cornerValue(key: string, i: number): { value: string; placeholder: string } {
    const own = s.get(key) || (s.get('borderRadius') ? (expandSides(s.get('borderRadius'))?.[i] ?? '') : '');
    const inherited = s.inheritedOf(key) || (s.inheritedOf('borderRadius') ? (expandSides(s.inheritedOf('borderRadius'))?.[i] ?? '') : '');
    return { value: own, placeholder: inherited || '—' };
  }
</script>

<PanelSection id="style-border" title="Border" defaultOpen={false} {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset border" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}

  <StyleField label="Style" keys={['borderStyle', 'border']}>
    <Seg
      options={STYLES}
      value={style.eff}
      inherited={!style.own}
      iconOnly
      ariaLabel="Border style"
      onchange={(v) => setBorder({ borderStyle: v })}
    />
  </StyleField>

  <StyleField label="Width" keys={['borderWidth', ...SIDE_WIDTH_KEYS]}>
    <div class="with-toggle">
      <LengthInput
        value={width.own}
        placeholder={width.eff || '—'}
        ariaLabel="Border width"
        min={0}
        units={['px', 'rem', 'em']}
        onchange={(v) => setBorder({ borderWidth: v })}
      />
      <IconButton
        label={showSides ? 'Hide individual sides' : 'Edit sides individually'}
        icon={BoundingBoxIcon}
        size="sm"
        iconSize={14}
        active={showSides}
        aria-pressed={showSides}
        onclick={() => (sidesOpen = !showSides)}
      />
    </div>
  </StyleField>
  {#if showSides}
    <StyleField label="Sides" keys={SIDE_WIDTH_KEYS}>
      <div class="quad">
        {#each SIDES as side (side)}
          <LengthInput
            value={s.get(`border${side}Width`)}
            placeholder={s.inheritedOf(`border${side}Width`) || width.eff || '—'}
            ariaLabel="Border {side.toLowerCase()} width"
            scrub={side.charAt(0)}
            min={0}
            units={['px', 'rem', 'em']}
            onchange={(v) => setBorder({ [`border${side}Width`]: v })}
          />
        {/each}
      </div>
    </StyleField>
  {/if}

  <StyleField label="Color" keys={['borderColor']}>
    <ColorField
      value={color.own}
      placeholder={color.eff || 'None'}
      ariaLabel="Border color"
      {swatches}
      onchange={(v) => setBorder({ borderColor: v })}
    />
  </StyleField>

  <StyleField label="Radius" keys={RADIUS_KEYS}>
    <div class="with-toggle">
      <LengthInput
        value={showCorners ? '' : s.get('borderRadius')}
        placeholder={showCorners ? 'Mixed' : s.inheritedOf('borderRadius') || '—'}
        ariaLabel="Corner radius"
        min={0}
        units={['px', '%', 'rem']}
        onchange={(v) => s.setMany({ borderRadius: v, ...Object.fromEntries(CORNER_KEYS.map((k) => [k, ''])) })}
      />
      <IconButton
        label={showCorners ? 'Use one radius for all corners' : 'Edit corners individually'}
        icon={showCorners ? FrameCornersIcon : SquareIcon}
        size="sm"
        iconSize={14}
        active={showCorners}
        aria-pressed={showCorners}
        onclick={() => (cornersOpen = !showCorners)}
      />
    </div>
  </StyleField>
  {#if showCorners}
    <StyleField label="Corners" keys={CORNER_KEYS}>
      <div class="quad">
        {#each CORNERS as corner, i (corner.key)}
          {@const v = cornerValue(corner.key, i)}
          <LengthInput
            value={v.value}
            placeholder={v.placeholder}
            ariaLabel="{corner.label} radius"
            scrub={corner.scrub}
            min={0}
            units={['px', '%', 'rem']}
            onchange={(val) => setCorner(corner.key, val)}
          />
        {/each}
      </div>
    </StyleField>
  {/if}
</PanelSection>

<style>
  .with-toggle {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    min-width: 0;
  }
  .quad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
</style>
