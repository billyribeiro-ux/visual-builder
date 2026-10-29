<script lang="ts">
  import StyleField from './StyleField.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  interface Props {
    prop: string;
    label: string;
    options: ReadonlyArray<{ value: string; label: string }>;
    layout?: 'row' | 'stack';
    help?: string;
  }

  let { prop, label, options, layout = 'row', help }: Props = $props();

  const id = $props.id();
  const s = getStyleTarget();
  const current = $derived(s.get(prop));
  const inherited = $derived(s.inheritedOf(prop));
  const unsetLabel = $derived(
    inherited ? `Inherited · ${options.find((o) => o.value === inherited)?.label ?? inherited}` : 'Default'
  );
</script>

<StyleField {label} keys={[prop]} {layout} {help} for={id}>
  <select {id} class="sx-select" value={current} onchange={(e) => s.set(prop, e.currentTarget.value)}>
    <option value="">{unsetLabel}</option>
    {#each options as o (o.value)}
      <option value={o.value}>{o.label}</option>
    {/each}
    {#if current && !options.some((o) => o.value === current)}
      <option value={current}>{current}</option>
    {/if}
  </select>
</StyleField>
