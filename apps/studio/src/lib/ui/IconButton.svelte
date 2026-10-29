<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { tooltip, type TooltipPlacement } from './tooltip.js';

  interface Props extends Omit<HTMLButtonAttributes, 'children'> {
    /** Accessible name; also used as the tooltip text. */
    label: string;
    icon: Component<{ size?: number | string; weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone' }>;
    iconSize?: number;
    weight?: 'regular' | 'bold' | 'fill' | 'light' | 'thin' | 'duotone';
    kbd?: string;
    active?: boolean;
    size?: 'sm' | 'md';
    tone?: 'default' | 'danger';
    placement?: TooltipPlacement;
    /** Set false to suppress the tooltip (e.g. when a visible label is already shown). */
    showTooltip?: boolean;
    children?: Snippet;
  }

  let {
    label,
    icon: Icon,
    iconSize = 16,
    weight = 'regular',
    kbd,
    active = false,
    size = 'md',
    tone = 'default',
    placement = 'bottom',
    showTooltip = true,
    class: className = '',
    type = 'button',
    children,
    ...rest
  }: Props = $props();
</script>

<button
  {type}
  aria-label={label}
  class={['sx-icon-btn', size === 'sm' && 'sx-icon-btn--sm', active && 'sx-icon-btn--active', tone === 'danger' && 'sx-icon-btn--danger', className]}
  {@attach showTooltip ? tooltip(label, { kbd, placement }) : undefined}
  {...rest}
>
  <Icon size={iconSize} {weight} />
  {@render children?.()}
</button>
