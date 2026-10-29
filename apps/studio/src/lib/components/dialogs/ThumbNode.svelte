<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import { resolveComponentProps } from '@app-viz/components';
  import { sanitizeClassList } from '@app-viz/engine';
  import UnknownComponent from '@app-viz/components/svelte/lib/UnknownComponent.svelte';
  import { componentForType } from '../../canvas/component-map.js';
  import ThumbNode from './ThumbNode.svelte';

  /**
   * Read-only twin of the canvas renderer for library thumbnails: the same canonical site
   * components and prop resolution, with no editor chrome, placeholders or context.
   */
  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const resolved = $derived(resolveComponentProps(node.componentType, node.props));
  const Comp = $derived(componentForType(node.componentType));
  const children = $derived((node.children ?? []).filter((c) => !c.hidden));
  const className = $derived(sanitizeClassList(node.customClasses) || undefined);
</script>

{#if !node.hidden && node.componentType !== 'structure/slot'}
  {#if Comp && resolved}
    {#if resolved.manifest.isContainer === true}
      <Comp {...resolved.props} data-node-id={node.id} class={className}>
        {#each children as child (child.id)}
          <ThumbNode node={child} />
        {/each}
      </Comp>
    {:else}
      <Comp {...resolved.props} data-node-id={node.id} class={className} />
    {/if}
  {:else}
    <UnknownComponent type={node.componentType} data-node-id={node.id} class={className}>
      {#each children as child (child.id)}
        <ThumbNode node={child} />
      {/each}
    </UnknownComponent>
  {/if}
{/if}
