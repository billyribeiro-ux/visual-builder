<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import { editor } from '../../state/editor.svelte.js';
  import { inspectorUi } from './lib/ui-state.svelte.js';
  import { createStyleTarget, setStyleTarget, type StyleBucket } from './lib/style-target.svelte.js';
  import StyleContextBar from './StyleContextBar.svelte';
  import LayoutSection from './style/LayoutSection.svelte';
  import SizeSection from './style/SizeSection.svelte';
  import SpacingSection from './style/SpacingSection.svelte';
  import PositionSection from './style/PositionSection.svelte';
  import TypographySection from './style/TypographySection.svelte';
  import BackgroundSection from './style/BackgroundSection.svelte';
  import BorderSection from './style/BorderSection.svelte';
  import EffectsSection from './style/EffectsSection.svelte';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  /**
   * Bucket written by every Style control: a state bucket when a state is chosen, otherwise the
   * shared base ("All devices") or the previewed breakpoint's bucket ("<Device> only").
   */
  const bucket = $derived<StyleBucket>(
    inspectorUi.state !== 'normal' ? inspectorUi.state : inspectorUi.scope === 'device' ? editor.activeBreakpoint : 'base'
  );

  setStyleTarget(
    createStyleTarget(
      () => node,
      () => bucket
    )
  );
</script>

<StyleContextBar {node} {bucket} />
<LayoutSection {node} />
<SizeSection />
<SpacingSection />
<PositionSection {node} />
<TypographySection />
<BackgroundSection />
<BorderSection />
<EffectsSection />
