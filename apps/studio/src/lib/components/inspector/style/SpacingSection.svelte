<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import BoxModel from '../controls/BoxModel.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  const s = getStyleTarget();

  const KEYS = ['Top', 'Right', 'Bottom', 'Left'].flatMap((side) => [`margin${side}`, `padding${side}`]).concat(['margin', 'padding']);
  const modified = $derived(s.anySet(KEYS));
</script>

<PanelSection id="style-spacing" title="Spacing" {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset spacing" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}
  <BoxModel />
</PanelSection>
