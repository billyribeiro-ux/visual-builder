<script lang="ts">
  import LengthInput from '../../../ui/UnitInput.svelte';
  import StyleField from './StyleField.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  interface Props {
    /** camelCase CSS property, e.g. `gap`, `minHeight`. */
    prop: string;
    label: string;
    units?: string[];
    keywords?: string[];
    scrub?: string;
    min?: number;
    max?: number;
    step?: number;
    unitless?: boolean;
    layout?: 'row' | 'stack';
    help?: string;
  }

  let { prop, label, units, keywords, scrub, min, max, step, unitless, layout = 'row', help }: Props = $props();

  const s = getStyleTarget();
</script>

<StyleField {label} keys={[prop]} {layout} {help}>
  <LengthInput
    value={s.get(prop)}
    placeholder={s.inheritedOf(prop) || '—'}
    onchange={(v) => s.set(prop, v)}
    ariaLabel={label}
    {units}
    {keywords}
    {scrub}
    {min}
    {max}
    {step}
    {unitless}
  />
</StyleField>
