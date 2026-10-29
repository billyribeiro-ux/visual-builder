<script lang="ts">
  import LengthInput from '../../../ui/UnitInput.svelte';
  import ColorField, { type ColorSwatch } from '../../../ui/ColorField.svelte';
  import Field from '../../../ui/Field.svelte';
  import Seg, { type SegOption } from './Seg.svelte';
  import InlineMessage from './InlineMessage.svelte';
  import { parseShadow, serializeShadow, type ShadowLayer } from '../lib/css-values.js';

  interface Props {
    /** Current `box-shadow` value ('' / 'none' start from a neutral default). */
    value: string;
    onchange: (css: string) => void;
    swatches?: ColorSwatch[];
  }

  let { value, onchange, swatches = [] }: Props = $props();

  const DEFAULT: ShadowLayer = { inset: false, x: '0px', y: '4px', blur: '12px', spread: '0px', color: 'rgba(16, 24, 40, 0.12)' };

  const layers = $derived(parseShadow(value));
  const layer = $derived(layers && layers.length > 0 ? layers[0] : DEFAULT);
  const multi = $derived((layers?.length ?? 0) > 1);
  const unparsable = $derived(value.trim() !== '' && value.trim() !== 'none' && layers === null);

  const KIND: SegOption<'outer' | 'inner'>[] = [
    { value: 'outer', label: 'Drop', title: 'Drop shadow (outside)' },
    { value: 'inner', label: 'Inner', title: 'Inner shadow (inset)' }
  ];

  const FIELDS = [
    { key: 'x', scrub: 'X', label: 'Horizontal offset' },
    { key: 'y', scrub: 'Y', label: 'Vertical offset' },
    { key: 'blur', scrub: 'B', label: 'Blur radius' },
    { key: 'spread', scrub: 'S', label: 'Spread' }
  ] as const;

  function update(patch: Partial<ShadowLayer>) {
    onchange(serializeShadow({ ...layer, ...patch }));
  }
</script>

<div class="shadow">
  {#if multi}
    <InlineMessage tone="info" message="This shadow has {layers?.length} layers; editing keeps only the first." />
  {:else if unparsable}
    <InlineMessage tone="warning" message="This shadow uses syntax the editor can’t read. Editing replaces it." />
  {/if}
  <Field label="Type">
    <Seg options={KIND} value={layer.inset ? 'inner' : 'outer'} ariaLabel="Shadow type" onchange={(k) => update({ inset: k === 'inner' })} />
  </Field>
  <Field label="Offset, blur & spread" layout="stack">
    <div class="quad">
      {#each FIELDS as f (f.key)}
        <LengthInput
          value={layer[f.key]}
          ariaLabel={f.label}
          scrub={f.scrub}
          min={f.key === 'blur' ? 0 : undefined}
          units={['px', 'rem', 'em']}
          onchange={(v) => update({ [f.key]: v || '0px' })}
        />
      {/each}
    </div>
  </Field>
  <Field label="Color">
    <ColorField value={layer.color} ariaLabel="Shadow color" {swatches} onchange={(c) => update({ color: c || DEFAULT.color })} />
  </Field>
</div>

<style>
  .shadow {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
  }
  .quad {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
</style>
