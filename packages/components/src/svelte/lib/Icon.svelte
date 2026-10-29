<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements';
  import { ICON_VIEWBOX, iconPaths } from './icons.js';

  interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'name' | 'class'> {
    /** Icon name (Phosphor name, Lucide-style alias or legacy emoji). Unknown names render a sparkle. */
    name: string;
    size?: number | string;
    /** Accessible label. Without it the icon is decorative (aria-hidden). */
    label?: string;
    class?: string;
  }

  let { name, size = 24, label, class: className = '', ...rest }: Props = $props();

  const paths = $derived(iconPaths(name));
</script>

<svg
  {...rest}
  xmlns="http://www.w3.org/2000/svg"
  viewBox={ICON_VIEWBOX}
  width={size}
  height={size}
  fill="currentColor"
  focusable="false"
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  class={['icon', className]}
>
  {#each paths as d, i (i)}
    <path {d} />
  {/each}
</svg>

<style>
  .icon {
    display: inline-block;
    flex-shrink: 0;
    vertical-align: middle;
  }
</style>
