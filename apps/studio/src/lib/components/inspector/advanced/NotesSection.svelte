<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import NoteField from '../controls/NoteField.svelte';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const key = $derived(`node:${node.id}`);
  const hasNote = $derived(Boolean(editor.blueprint.notes?.[key]?.trim()));
</script>

<PanelSection id="adv-notes" title="Notes for developer" modified={hasNote}>
  <NoteField
    noteKey={key}
    label="Element notes"
    placeholder="Behaviour, data source, edge cases… This goes into the build spec for the implementing agent."
  />
</PanelSection>
