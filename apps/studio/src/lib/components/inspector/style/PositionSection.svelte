<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import StyleSelect from '../controls/StyleSelect.svelte';
  import StyleLength from '../controls/StyleLength.svelte';
  import InlineMessage from '../controls/InlineMessage.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const s = getStyleTarget();

  const KEYS = ['position', 'top', 'right', 'bottom', 'left', 'inset', 'zIndex'] as const;
  const modified = $derived(s.anySet(KEYS));

  const POSITIONS = [
    { value: 'static', label: 'Static' },
    { value: 'relative', label: 'Relative' },
    { value: 'absolute', label: 'Absolute' },
    { value: 'fixed', label: 'Fixed' },
    { value: 'sticky', label: 'Sticky' }
  ];

  const position = $derived(s.effective('position') || 'static');
  const showInset = $derived(position !== 'static');
  const SIDES = [
    { key: 'top', scrub: 'T', label: 'Top' },
    { key: 'right', scrub: 'R', label: 'Right' },
    { key: 'bottom', scrub: 'B', label: 'Bottom' },
    { key: 'left', scrub: 'L', label: 'Left' }
  ] as const;
  const motionSticky = $derived(node.motionEffects?.sticky && node.motionEffects.sticky !== 'none' ? node.motionEffects.sticky : '');
</script>

<PanelSection id="style-position" title="Position" defaultOpen={false} {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset position" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}

  <StyleSelect prop="position" label="Position" options={POSITIONS} />
  {#if motionSticky}
    <InlineMessage tone="info" indent message="Motion › Sticky ({motionSticky}) also positions this element." />
  {/if}

  {#if showInset}
    <StyleField label="Offsets" keys={['top', 'right', 'bottom', 'left']}>
      <div class="quad">
        {#each SIDES as side (side.key)}
          <LengthInput
            value={s.get(side.key)}
            placeholder={s.inheritedOf(side.key) || '—'}
            ariaLabel="{side.label} offset"
            scrub={side.scrub}
            keywords={['auto']}
            onchange={(v) => s.set(side.key, v)}
          />
        {/each}
      </div>
    </StyleField>
  {/if}

  <StyleLength prop="zIndex" label="Z-index" unitless step={1} keywords={['auto']} />
</PanelSection>

<style>
  .quad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
</style>
