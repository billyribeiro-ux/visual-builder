<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import NotesSection from './advanced/NotesSection.svelte';
  import ElementSection from './advanced/ElementSection.svelte';
  import MotionSection from './advanced/MotionSection.svelte';
  import VisibilitySection from './advanced/VisibilitySection.svelte';
  import InteractionsSection from './advanced/InteractionsSection.svelte';
  import CustomCssSection from './advanced/CustomCssSection.svelte';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();
</script>

<NotesSection {node} />
<ElementSection {node} />
<MotionSection {node} />
<VisibilitySection {node} />
<InteractionsSection {node} />
<CustomCssSection {node} />
