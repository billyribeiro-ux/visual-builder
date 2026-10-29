<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDownIcon';
  import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeftIcon';
  import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUpIcon';
  import AlignLeftIcon from 'phosphor-svelte/lib/AlignLeftIcon';
  import AlignCenterHorizontalIcon from 'phosphor-svelte/lib/AlignCenterHorizontalIcon';
  import AlignRightIcon from 'phosphor-svelte/lib/AlignRightIcon';
  import ArrowsOutLineHorizontalIcon from 'phosphor-svelte/lib/ArrowsOutLineHorizontalIcon';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Field from '../../../ui/Field.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import Seg, { type SegOption } from '../controls/Seg.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import StyleLength from '../controls/StyleLength.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const s = getStyleTarget();
  const uid = $props.id();

  const KEYS = [
    'display',
    'flexDirection',
    'flexWrap',
    'justifyContent',
    'alignItems',
    'gap',
    'gridTemplateColumns',
    'gridTemplateRows',
    'justifyItems',
    'alignSelf',
    'flex'
  ] as const;

  const FLEX_LAYOUT_TYPES = new Set(['structure/container', 'structure/section']);
  const isFlexContainerType = $derived(FLEX_LAYOUT_TYPES.has(node.componentType));
  /** Container/Section props mirror their base layout styles (the component renders from both). */
  const syncProps = $derived(isFlexContainerType && s.bucket === 'base');

  /** Display the component renders with when no style sets one. */
  const impliedDisplay = $derived.by(() => {
    if (node.componentType === 'structure/grid') return 'grid';
    const p = node.props ?? {};
    if (isFlexContainerType && (p.direction || p.justify || p.align || p.gap)) return 'flex';
    return '';
  });
  const ownDisplay = $derived(s.get('display'));
  const display = $derived(s.effective('display') || impliedDisplay);
  const displayInherited = $derived(!ownDisplay);
  const isFlex = $derived(display === 'flex' || display === 'inline-flex');
  const isGrid = $derived(display === 'grid' || display === 'inline-grid');

  const direction = $derived(s.effective('flexDirection') || (isFlexContainerType ? String(node.props?.direction ?? '') : '') || 'row');
  const justifyRotate = $derived(
    direction === 'column' ? 90 : direction === 'column-reverse' ? 270 : direction === 'row-reverse' ? 180 : 0
  );
  const alignRotate = $derived(direction.startsWith('column') ? -90 : 0);

  /** Parent layout decides whether "align self" / flex child sizing mean anything. */
  const parent = $derived(editor.selectedNodeBreadcrumb.at(-2));
  const parentDisplay = $derived.by(() => {
    if (!parent) return '';
    const own = String(parent.styles?.base?.display ?? '');
    if (own) return own;
    if (parent.componentType === 'structure/grid') return 'grid';
    if (FLEX_LAYOUT_TYPES.has(parent.componentType)) return 'flex';
    return '';
  });
  const parentIsFlex = $derived(parentDisplay === 'flex' || parentDisplay === 'inline-flex');
  const parentIsGrid = $derived(parentDisplay === 'grid' || parentDisplay === 'inline-grid');
  const parentDirection = $derived(
    String(parent?.styles?.base?.flexDirection ?? (parent && FLEX_LAYOUT_TYPES.has(parent.componentType) ? (parent.props?.direction ?? 'column') : 'row'))
  );

  const DISPLAY_OPTIONS: SegOption<string>[] = [
    { value: 'block', label: 'Block', title: 'Block — stacks on its own line' },
    { value: 'flex', label: 'Flex', title: 'Flex — lay children out in a row or column' },
    { value: 'grid', label: 'Grid', title: 'Grid — lay children out in columns and rows' },
    { value: 'inline-block', label: 'Inline', title: 'Inline block — flows with surrounding text' },
    { value: 'none', label: 'None', title: 'Hidden — removed from the layout' }
  ];

  const DIRECTION_OPTIONS: SegOption<string>[] = [
    { value: 'row', title: 'Row', icon: ArrowRightIcon },
    { value: 'column', title: 'Column', icon: ArrowDownIcon },
    { value: 'row-reverse', title: 'Row reverse', icon: ArrowLeftIcon },
    { value: 'column-reverse', title: 'Column reverse', icon: ArrowUpIcon }
  ];

  const WRAP_OPTIONS: SegOption<string>[] = [
    { value: 'nowrap', label: 'No wrap' },
    { value: 'wrap', label: 'Wrap' }
  ];

  const JUSTIFY_OPTIONS: SegOption<string>[] = [
    { value: 'flex-start', title: 'Start', glyph: 'justify-start' },
    { value: 'center', title: 'Center', glyph: 'justify-center' },
    { value: 'flex-end', title: 'End', glyph: 'justify-end' },
    { value: 'space-between', title: 'Space between', glyph: 'justify-between' },
    { value: 'space-around', title: 'Space around', glyph: 'justify-around' },
    { value: 'space-evenly', title: 'Space evenly', glyph: 'justify-evenly' }
  ];

  const ALIGN_OPTIONS: SegOption<string>[] = [
    { value: 'flex-start', title: 'Start', glyph: 'align-start' },
    { value: 'center', title: 'Center', glyph: 'align-center' },
    { value: 'flex-end', title: 'End', glyph: 'align-end' },
    { value: 'stretch', title: 'Stretch', glyph: 'align-stretch' },
    { value: 'baseline', title: 'Baseline', glyph: 'align-baseline' }
  ];

  const GRID_ALIGN_OPTIONS: SegOption<string>[] = [
    { value: 'start', title: 'Start', glyph: 'align-start' },
    { value: 'center', title: 'Center', glyph: 'align-center' },
    { value: 'end', title: 'End', glyph: 'align-end' },
    { value: 'stretch', title: 'Stretch', glyph: 'align-stretch' }
  ];

  const SELF_OPTIONS: SegOption<string>[] = [
    { value: 'flex-start', title: 'Start', glyph: 'align-start' },
    { value: 'center', title: 'Center', glyph: 'align-center' },
    { value: 'flex-end', title: 'End', glyph: 'align-end' },
    { value: 'stretch', title: 'Stretch', glyph: 'align-stretch' }
  ];

  const FLEX_CHILD_OPTIONS: SegOption<string>[] = [
    { value: '0 1 auto', label: 'Shrink', title: 'Shrink if needed (flex: 0 1 auto)' },
    { value: '1 1 0%', label: 'Grow', title: 'Grow to fill the space (flex: 1 1 0%)' },
    { value: '0 0 auto', label: 'Fixed', title: "Don't grow or shrink (flex: 0 0 auto)" }
  ];

  const QUICK_ALIGN: SegOption<'left' | 'center' | 'right' | 'stretch'>[] = [
    { value: 'left', title: 'Align left', icon: AlignLeftIcon },
    { value: 'center', title: 'Center', icon: AlignCenterHorizontalIcon },
    { value: 'right', title: 'Align right', icon: AlignRightIcon },
    { value: 'stretch', title: 'Stretch to fill', icon: ArrowsOutLineHorizontalIcon }
  ];

  /** Quick align always writes the base bucket (see editor.alignNode). */
  const quickAlign = $derived.by(() => {
    const base = node.styles?.base ?? {};
    const ai = String(base.alignItems ?? '');
    const ta = String(base.textAlign ?? '');
    if (ai === 'stretch') return 'stretch';
    if (ai === 'center' || (!ai && ta === 'center')) return 'center';
    if (ai === 'flex-end' || (!ai && ta === 'right')) return 'right';
    if (ai === 'flex-start' && (ta === 'left' || !ta)) return 'left';
    return '';
  });

  const normalizeAxis = (v: string) => (v === 'start' ? 'flex-start' : v === 'end' ? 'flex-end' : v);

  const gridColumnCount = $derived.by(() => {
    const m = /^repeat\(\s*(\d+)\s*,\s*(?:minmax\(\s*0(?:px)?\s*,\s*1fr\s*\)|1fr)\s*\)$/.exec(s.effective('gridTemplateColumns'));
    return m ? m[1] : '';
  });

  const COLUMN_PRESETS: SegOption<string>[] = ['1', '2', '3', '4', '5', '6'].map((n) => ({
    value: n,
    label: n,
    title: `${n} equal ${n === '1' ? 'column' : 'columns'}`
  }));

  const modified = $derived(s.anySet(KEYS));

  /** Writes a layout style; for Container/Section on the base bucket also mirrors the prop. */
  function setLayout(key: string, value: string, propKey?: string) {
    if (syncProps && propKey) {
      editor.transact(() => {
        s.setMany({ display: s.get('display') || 'flex', [key]: value });
        editor.dispatch({ type: 'UPDATE_PROPS', nodeId: node.id, props: { [propKey]: value } });
      });
    } else {
      s.set(key, value);
    }
  }

  let gridTemplateDraft = $state<string | null>(null);
  let gridRowsDraft = $state<string | null>(null);
</script>

<PanelSection id="style-layout" title="Layout" {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset layout" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}

  <Field label="Align" help={s.bucket !== 'base' ? 'Quick align always edits all devices.' : undefined}>
    <Seg options={QUICK_ALIGN} value={quickAlign} iconOnly ariaLabel="Quick align" onchange={(v) => editor.alignNode(node.id, v)} />
  </Field>

  <StyleField label="Display" keys={['display']} layout="stack">
    <Seg
      options={DISPLAY_OPTIONS}
      value={display}
      inherited={displayInherited}
      ariaLabel="Display"
      onchange={(v) => s.set('display', v)}
    />
  </StyleField>
  {#if display && !DISPLAY_OPTIONS.some((o) => o.value === display)}
    <p class="sx-help layout__note">Current display: <code>{display}</code></p>
  {/if}

  {#if isFlex}
    <div class="layout__group">
      <StyleField label="Direction" keys={['flexDirection']}>
        <Seg
          options={DIRECTION_OPTIONS}
          value={direction}
          inherited={!s.isSet('flexDirection')}
          iconOnly
          ariaLabel="Flex direction"
          onchange={(v) => setLayout('flexDirection', v, 'direction')}
        />
      </StyleField>
      <StyleField label="Justify" keys={['justifyContent']}>
        <Seg
          options={JUSTIFY_OPTIONS}
          value={normalizeAxis(s.effective('justifyContent') || (syncProps ? String(node.props?.justify ?? '') : ''))}
          inherited={!s.isSet('justifyContent')}
          iconOnly
          rotate={justifyRotate}
          ariaLabel="Justify content"
          onchange={(v) => setLayout('justifyContent', v, 'justify')}
        />
      </StyleField>
      <StyleField label="Align" keys={['alignItems']}>
        <Seg
          options={ALIGN_OPTIONS}
          value={normalizeAxis(s.effective('alignItems') || (syncProps ? String(node.props?.align ?? '') : ''))}
          inherited={!s.isSet('alignItems')}
          iconOnly
          rotate={alignRotate}
          ariaLabel="Align items"
          onchange={(v) => setLayout('alignItems', v, 'align')}
        />
      </StyleField>
      <StyleField label="Wrap" keys={['flexWrap']}>
        <Seg
          options={WRAP_OPTIONS}
          value={s.effective('flexWrap') || 'nowrap'}
          inherited={!s.isSet('flexWrap')}
          ariaLabel="Flex wrap"
          onchange={(v) => s.set('flexWrap', v)}
        />
      </StyleField>
      {#if syncProps}
        <StyleField label="Gap" keys={['gap']}>
          <LengthInput
            value={s.get('gap')}
            placeholder={s.inheritedOf('gap') || String(node.props?.gap ?? '') || '—'}
            ariaLabel="Gap"
            keywords={['normal']}
            onchange={(v) => setLayout('gap', v, 'gap')}
          />
        </StyleField>
      {:else}
        <StyleLength prop="gap" label="Gap" keywords={['normal']} />
      {/if}
    </div>
  {:else if isGrid}
    <div class="layout__group">
      <StyleField label="Columns" keys={['gridTemplateColumns']}>
        <Seg
          options={COLUMN_PRESETS}
          value={gridColumnCount}
          inherited={!s.isSet('gridTemplateColumns')}
          ariaLabel="Equal columns"
          onchange={(n) => s.set('gridTemplateColumns', `repeat(${n}, minmax(0, 1fr))`)}
        />
      </StyleField>
      <StyleField label="Template" keys={['gridTemplateColumns']} for="{uid}-cols">
        <input
          id="{uid}-cols"
          class="sx-input sx-input--mono"
          spellcheck="false"
          placeholder={s.inheritedOf('gridTemplateColumns') || 'e.g. 1fr 2fr'}
          value={gridTemplateDraft ?? s.get('gridTemplateColumns')}
          oninput={(e) => (gridTemplateDraft = e.currentTarget.value)}
          onchange={(e) => {
            gridTemplateDraft = null;
            s.set('gridTemplateColumns', e.currentTarget.value);
          }}
        />
      </StyleField>
      <StyleField label="Rows" keys={['gridTemplateRows']} for="{uid}-rows">
        <input
          id="{uid}-rows"
          class="sx-input sx-input--mono"
          spellcheck="false"
          placeholder={s.inheritedOf('gridTemplateRows') || 'auto'}
          value={gridRowsDraft ?? s.get('gridTemplateRows')}
          oninput={(e) => (gridRowsDraft = e.currentTarget.value)}
          onchange={(e) => {
            gridRowsDraft = null;
            s.set('gridTemplateRows', e.currentTarget.value);
          }}
        />
      </StyleField>
      <StyleLength prop="gap" label="Gap" keywords={['normal']} />
      <StyleField label="Align" keys={['alignItems']}>
        <Seg
          options={GRID_ALIGN_OPTIONS}
          value={s.effective('alignItems') || String(node.props?.alignItems ?? '')}
          inherited={!s.isSet('alignItems')}
          iconOnly
          ariaLabel="Align items in cells"
          onchange={(v) => s.set('alignItems', v)}
        />
      </StyleField>
      <StyleField label="Justify" keys={['justifyItems']}>
        <Seg
          options={GRID_ALIGN_OPTIONS}
          value={s.effective('justifyItems') || String(node.props?.justifyItems ?? '')}
          inherited={!s.isSet('justifyItems')}
          iconOnly
          rotate={-90}
          ariaLabel="Justify items in cells"
          onchange={(v) => s.set('justifyItems', v)}
        />
      </StyleField>
    </div>
  {/if}

  {#if parentIsFlex || parentIsGrid}
    <div class="layout__group">
      <p class="sx-section-label layout__sub" title="Applies inside {parent?.name ?? 'the parent'}">{parentIsFlex ? 'Flex child' : 'Grid child'}</p>
      <StyleField label="Align self" keys={['alignSelf']}>
        <Seg
          options={SELF_OPTIONS}
          value={normalizeAxis(s.effective('alignSelf'))}
          inherited={!s.isSet('alignSelf')}
          iconOnly
          rotate={parentIsFlex && parentDirection.startsWith('row') ? 0 : -90}
          ariaLabel="Align self"
          onchange={(v) => s.set('alignSelf', v)}
        />
      </StyleField>
      {#if parentIsFlex}
        <StyleField label="Sizing" keys={['flex']}>
          <Seg
            options={FLEX_CHILD_OPTIONS}
            value={s.effective('flex')}
            inherited={!s.isSet('flex')}
            ariaLabel="Flex child sizing"
            onchange={(v) => s.set('flex', v)}
          />
        </StyleField>
      {/if}
    </div>
  {/if}
</PanelSection>

<style>
  .layout__group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 10px;
    border-top: 1px dashed var(--sx-border);
  }
  .layout__sub {
    padding: 0;
  }
  .layout__note {
    margin-top: -4px;
  }
  .layout__note code {
    font-family: var(--sx-font-mono);
  }
</style>
