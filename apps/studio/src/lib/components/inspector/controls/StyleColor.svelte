<script lang="ts">
  import ColorField from '../../../ui/ColorField.svelte';
  import StyleField from './StyleField.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';
  import { colorSwatches } from '../lib/swatches.js';
  import { editor } from '../../../state/editor.svelte.js';

  interface Props {
    prop: string;
    label: string;
    layout?: 'row' | 'stack';
  }

  let { prop, label, layout = 'row' }: Props = $props();

  const s = getStyleTarget();
  const swatches = $derived(colorSwatches(editor.blueprint.tokens?.colors));
</script>

<StyleField {label} keys={[prop]} {layout}>
  <ColorField
    value={s.get(prop)}
    placeholder={s.inheritedOf(prop) || 'None'}
    onchange={(v) => s.set(prop, v)}
    ariaLabel={label}
    {swatches}
  />
</StyleField>
