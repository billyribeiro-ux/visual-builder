<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import TextAlignLeftIcon from 'phosphor-svelte/lib/TextAlignLeftIcon';
  import TextAlignCenterIcon from 'phosphor-svelte/lib/TextAlignCenterIcon';
  import TextAlignRightIcon from 'phosphor-svelte/lib/TextAlignRightIcon';
  import TextAlignJustifyIcon from 'phosphor-svelte/lib/TextAlignJustifyIcon';
  import TextTIcon from 'phosphor-svelte/lib/TextTIcon';
  import TextItalicIcon from 'phosphor-svelte/lib/TextItalicIcon';
  import TextUnderlineIcon from 'phosphor-svelte/lib/TextUnderlineIcon';
  import TextStrikethroughIcon from 'phosphor-svelte/lib/TextStrikethroughIcon';
  import MinusIcon from 'phosphor-svelte/lib/MinusIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import Seg, { type SegOption } from '../controls/Seg.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import StyleLength from '../controls/StyleLength.svelte';
  import StyleSelect from '../controls/StyleSelect.svelte';
  import StyleColor from '../controls/StyleColor.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  const s = getStyleTarget();
  const uid = $props.id();

  const KEYS = [
    'fontFamily',
    'fontWeight',
    'fontSize',
    'lineHeight',
    'letterSpacing',
    'color',
    'textAlign',
    'fontStyle',
    'textDecoration',
    'textDecorationLine',
    'textTransform'
  ] as const;
  const modified = $derived(s.anySet(KEYS));

  const fonts = $derived(editor.blueprint.tokens?.fonts);

  /** Only stacks that are guaranteed to render: the project's theme fonts and system stacks. */
  const FONT_GROUPS = $derived([
    {
      label: 'Theme',
      options: [
        { value: 'var(--md-sys-font-heading)', label: `Heading${fonts?.heading ? ` · ${firstFamily(fonts.heading)}` : ''}` },
        { value: 'var(--md-sys-font-body)', label: `Body${fonts?.body ? ` · ${firstFamily(fonts.body)}` : ''}` },
        { value: 'var(--md-sys-font-mono)', label: `Mono${fonts?.mono ? ` · ${firstFamily(fonts.mono)}` : ''}` }
      ]
    },
    {
      label: 'System',
      options: [
        { value: "system-ui, -apple-system, 'Segoe UI', sans-serif", label: 'System sans-serif' },
        { value: "Georgia, 'Times New Roman', serif", label: 'System serif' },
        { value: 'ui-monospace, SFMono-Regular, Menlo, monospace', label: 'System monospace' }
      ]
    }
  ]);

  function firstFamily(stack: string): string {
    return stack.split(',')[0]?.trim().replace(/^["']|["']$/g, '') ?? stack;
  }

  const fontFamily = $derived(s.get('fontFamily'));
  const fontInherited = $derived(s.inheritedOf('fontFamily'));
  const allFontOptions = $derived(FONT_GROUPS.flatMap((g) => g.options));

  const WEIGHTS = [
    { value: '100', label: '100 · Thin' },
    { value: '200', label: '200 · Extra light' },
    { value: '300', label: '300 · Light' },
    { value: '400', label: '400 · Regular' },
    { value: '500', label: '500 · Medium' },
    { value: '600', label: '600 · Semibold' },
    { value: '700', label: '700 · Bold' },
    { value: '800', label: '800 · Extra bold' },
    { value: '900', label: '900 · Black' }
  ];

  const ALIGN: SegOption<string>[] = [
    { value: 'left', title: 'Align left', icon: TextAlignLeftIcon },
    { value: 'center', title: 'Align center', icon: TextAlignCenterIcon },
    { value: 'right', title: 'Align right', icon: TextAlignRightIcon },
    { value: 'justify', title: 'Justify', icon: TextAlignJustifyIcon }
  ];

  const STYLE: SegOption<string>[] = [
    { value: 'normal', title: 'Regular', icon: TextTIcon },
    { value: 'italic', title: 'Italic', icon: TextItalicIcon }
  ];

  const DECORATION: SegOption<string>[] = [
    { value: 'none', title: 'No decoration', icon: MinusIcon },
    { value: 'underline', title: 'Underline', icon: TextUnderlineIcon },
    { value: 'line-through', title: 'Strikethrough', icon: TextStrikethroughIcon }
  ];

  const CASE: SegOption<string>[] = [
    { value: 'none', label: '—', title: 'As typed' },
    { value: 'uppercase', label: 'AA', title: 'Uppercase' },
    { value: 'capitalize', label: 'Aa', title: 'Capitalize' },
    { value: 'lowercase', label: 'aa', title: 'Lowercase' }
  ];

  const decoration = $derived.by(() => {
    const raw = s.effective('textDecorationLine') || s.effective('textDecoration');
    return raw.split(/\s+/)[0] ?? '';
  });
  const decorationKey = $derived(s.isSet('textDecorationLine') ? 'textDecorationLine' : 'textDecoration');
</script>

<PanelSection id="style-typography" title="Typography" {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset typography" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}

  <StyleField label="Font" keys={['fontFamily']} for="{uid}-font">
    <select id="{uid}-font" class="sx-select" value={fontFamily} onchange={(e) => s.set('fontFamily', e.currentTarget.value)}>
      <option value="">
        {fontInherited ? `Inherited · ${allFontOptions.find((o) => o.value === fontInherited)?.label ?? firstFamily(fontInherited)}` : 'Default'}
      </option>
      {#each FONT_GROUPS as group (group.label)}
        <optgroup label={group.label}>
          {#each group.options as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
        </optgroup>
      {/each}
      {#if fontFamily && !allFontOptions.some((o) => o.value === fontFamily)}
        <option value={fontFamily}>{firstFamily(fontFamily)}</option>
      {/if}
    </select>
  </StyleField>

  <StyleSelect prop="fontWeight" label="Weight" options={WEIGHTS} />

  <StyleLength prop="fontSize" label="Size" min={0} units={['px', 'rem', 'em', '%', 'vw']} />
  <StyleLength prop="lineHeight" label="Line height" min={0} step={0.1} units={['', 'px', 'em', 'rem', '%']} keywords={['normal']} />
  <StyleLength prop="letterSpacing" label="Tracking" units={['px', 'em', 'rem']} step={0.1} keywords={['normal']} />

  <StyleColor prop="color" label="Color" />

  <StyleField label="Align" keys={['textAlign']}>
    <Seg
      options={ALIGN}
      value={s.effective('textAlign')}
      inherited={!s.isSet('textAlign')}
      iconOnly
      ariaLabel="Text align"
      onchange={(v) => s.set('textAlign', v)}
    />
  </StyleField>

  <StyleField label="Style" keys={['fontStyle', 'textDecoration', 'textDecorationLine']}>
    <div class="style-row">
      <Seg
        options={STYLE}
        value={s.effective('fontStyle') || 'normal'}
        inherited={!s.isSet('fontStyle')}
        iconOnly
        ariaLabel="Font style"
        onchange={(v) => s.set('fontStyle', v)}
      />
      <Seg
        options={DECORATION}
        value={decoration || 'none'}
        inherited={!s.isSet('textDecoration') && !s.isSet('textDecorationLine')}
        iconOnly
        ariaLabel="Text decoration"
        onchange={(v) => s.set(decorationKey, v)}
      />
    </div>
  </StyleField>

  <StyleField label="Case" keys={['textTransform']}>
    <Seg
      options={CASE}
      value={s.effective('textTransform') || 'none'}
      inherited={!s.isSet('textTransform')}
      ariaLabel="Text case"
      onchange={(v) => s.set('textTransform', v)}
    />
  </StyleField>
</PanelSection>

<style>
  .style-row {
    display: grid;
    grid-template-columns: 2fr 3fr;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
</style>
