<script lang="ts">
  import type { Snippet } from 'svelte';
  import Field from '../../../ui/Field.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  interface Props {
    label: string;
    /** Style keys this field edits; drives the modified state and the reset action. */
    keys: readonly string[];
    layout?: 'row' | 'stack';
    help?: string;
    for?: string;
    adornment?: Snippet;
    children: Snippet;
  }

  let { label, keys, layout = 'row', help, for: forId, adornment, children }: Props = $props();

  const s = getStyleTarget();
  const modified = $derived(s.anySet(keys));
</script>

<Field {label} {layout} {help} for={forId} {modified} {adornment} onreset={() => s.reset(keys)}>
  {@render children()}
</Field>
