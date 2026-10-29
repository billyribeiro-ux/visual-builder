<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import { getManifest } from '@app-viz/components';
  import SlidersHorizontalIcon from 'phosphor-svelte/lib/SlidersHorizontalIcon';
  import PanelSection from '../../ui/PanelSection.svelte';
  import { editor } from '../../state/editor.svelte.js';
  import PropField from './controls/PropField.svelte';
  import InlineMessage from './controls/InlineMessage.svelte';
  import { describeProps, groupSpecs } from './lib/prop-schema.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const manifest = $derived(getManifest(node.componentType));
  const specs = $derived(describeProps(manifest, node.props));
  const groups = $derived(groupSpecs(specs));

  /**
   * Layout props of containers are rendered by the component AND mirrored in base styles (the
   * Style tab edits the style side). Keep both in step, as the previous inspector did.
   */
  const FLEX_SYNC: Record<string, string> = { direction: 'flexDirection', align: 'alignItems', justify: 'justifyContent', textAlign: 'textAlign' };
  const GRID_SYNC: Record<string, string> = { alignItems: 'alignItems', justifyItems: 'justifyItems', textAlign: 'textAlign' };

  function styleSync(key: string, value: unknown): Record<string, string> | null {
    if (typeof value !== 'string' || !value) return null;
    if (node.componentType === 'structure/container' || node.componentType === 'structure/section') {
      const css = FLEX_SYNC[key];
      if (!css) return null;
      return css === 'textAlign' ? { textAlign: value } : { display: 'flex', [css]: value };
    }
    if (node.componentType === 'structure/grid') {
      const css = GRID_SYNC[key];
      return css ? { [css]: value } : null;
    }
    return null;
  }

  function update(key: string, value: unknown) {
    const sync = styleSync(key, value);
    if (!sync) {
      editor.dispatch({ type: 'UPDATE_PROPS', nodeId: node.id, props: { [key]: value } });
      return;
    }
    editor.transact(() => {
      editor.dispatch({ type: 'UPDATE_PROPS', nodeId: node.id, props: { [key]: value } });
      editor.dispatch({ type: 'UPDATE_STYLES', nodeId: node.id, breakpoint: 'base', styles: sync });
    });
  }

  /** Data tables label row cells with their column names. */
  const columnNames = $derived(
    Array.isArray(node.props?.columns) && node.props.columns.every((c: unknown) => typeof c === 'string')
      ? (node.props.columns as string[])
      : undefined
  );
</script>

{#if !manifest}
  <div class="content__note">
    <InlineMessage tone="warning" message="“{node.componentType}” is not in the component registry. Showing its raw properties." />
  </div>
{/if}

{#if groups.length === 0}
  <div class="sx-empty">
    <span class="sx-empty__icon"><SlidersHorizontalIcon size={18} /></span>
    <span class="sx-empty__title">No content settings</span>
    <span class="sx-help">{manifest?.displayName ?? 'This element'} is configured entirely in Style and Advanced.</span>
  </div>
{:else}
  {#each groups as group (group.id)}
    <PanelSection id="content-{group.id}" title={group.title}>
      {#each group.specs as spec (spec.key)}
        <PropField
          {spec}
          value={node.props?.[spec.key]}
          columns={spec.kind === 'matrix' ? columnNames : undefined}
          onchange={(v) => update(spec.key, v)}
        />
      {/each}
    </PanelSection>
  {/each}
{/if}

<style>
  .content__note {
    padding: 12px 14px 0;
  }
</style>
