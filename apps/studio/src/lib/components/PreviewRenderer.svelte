<script lang="ts">
  import { isValidHtmlId, sanitizeNodeAttributes, type BlueprintNode } from '@app-viz/schema';
  import { resolveComponentProps } from '@app-viz/components';
  import { sanitizeClassList } from '@app-viz/engine';
  import UnknownComponent from '@app-viz/components/svelte/lib/UnknownComponent.svelte';
  import { componentForType } from '../canvas/component-map.js';
  import EmptyContainerSlot from '../canvas/EmptyContainerSlot.svelte';
  import { getAssetUrls, resolveAssetRefs } from '../canvas/assets.js';
  import PreviewRenderer from './PreviewRenderer.svelte';

  /**
   * Generic canvas renderer: one canonical component per node, with NO wrapper element.
   * `data-node-id` and `class` land on the component root (it spreads its rest props there);
   * node styles reach it through the compiled node stylesheet, editing affordances through the
   * EditorOverlay. Props are validated exactly like the SvelteKit export does.
   */
  interface Props {
    node: BlueprintNode;
    /** Page root rendered in place of a layout's `structure/slot`. */
    slotNode?: BlueprintNode;
    /** Design mode shows editor-only placeholders (never in interactive mode). */
    designMode: boolean;
  }

  let { node, slotNode, designMode }: Props = $props();

  const assetUrls = getAssetUrls();
  const resolved = $derived(resolveComponentProps(node.componentType, node.props));
  /** Validated props with project asset paths swapped for displayable URLs (canvas only). */
  const renderProps = $derived(resolved ? resolveAssetRefs(resolved.props, assetUrls()) : {});
  const Comp = $derived(componentForType(node.componentType));
  const isContainer = $derived(resolved?.manifest.isContainer === true);
  const visibleChildren = $derived((node.children ?? []).filter((child) => !child.hidden));
  const className = $derived(sanitizeClassList(node.customClasses) || undefined);
  /** "CSS ID" + allow-listed custom attributes, validated exactly like the export. */
  const rootAttrs = $derived({
    ...sanitizeNodeAttributes(node.attributes),
    ...(isValidHtmlId(node.htmlId) ? { id: node.htmlId } : {})
  });
</script>

{#if !node.hidden}
  {#if node.componentType === 'structure/slot'}
    {#if slotNode}
      <PreviewRenderer node={slotNode} {designMode} />
    {/if}
  {:else if Comp && resolved}
    {#if isContainer}
      <Comp {...renderProps} {...rootAttrs} data-node-id={node.id} class={className}>
        {#if visibleChildren.length === 0}
          {#if designMode}
            <EmptyContainerSlot nodeId={node.id} />
          {/if}
        {:else}
          {#each visibleChildren as child (child.id)}
            <PreviewRenderer node={child} {slotNode} {designMode} />
          {/each}
        {/if}
      </Comp>
    {:else}
      <Comp {...renderProps} {...rootAttrs} data-node-id={node.id} class={className} />
    {/if}
  {:else}
    <UnknownComponent type={node.componentType} {...rootAttrs} data-node-id={node.id} class={className}>
      {#each visibleChildren as child (child.id)}
        <PreviewRenderer node={child} {slotNode} {designMode} />
      {/each}
    </UnknownComponent>
  {/if}
{/if}
