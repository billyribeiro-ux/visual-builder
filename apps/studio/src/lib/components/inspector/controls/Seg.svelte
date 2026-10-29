<script module lang="ts">
  import type { Component } from 'svelte';
  import type { GlyphName } from './Glyph.svelte';

  export interface SegOption<V extends string = string> {
    value: V;
    label?: string;
    /** Tooltip + accessible name for icon-only items. */
    title?: string;
    icon?: Component<{ size?: number | string }>;
    glyph?: GlyphName;
  }
</script>

<script lang="ts" generics="T extends string">
  import { tooltip } from '../../../ui/tooltip.js';
  import Glyph from './Glyph.svelte';

  interface Props {
    options: readonly SegOption<T>[];
    /** Selected value; '' / undefined selects nothing. */
    value: T | '' | undefined;
    /** True when `value` is inherited rather than set on the edited bucket (rendered muted). */
    inherited?: boolean;
    onchange: (value: T) => void;
    ariaLabel: string;
    block?: boolean;
    /** Hide text labels and show icons/glyphs only. */
    iconOnly?: boolean;
    /** Glyph rotation in degrees (for column / reversed flex axes). */
    rotate?: number;
  }

  let { options, value, inherited = false, onchange, ariaLabel, block = true, iconOnly = false, rotate = 0 }: Props = $props();
</script>

<div class={['sx-seg', block && 'sx-seg--block', 'seg', inherited && 'seg--inherited']} role="group" aria-label={ariaLabel}>
  {#each options as option (option.value)}
    {@const Icon = option.icon}
    {@const visual = Boolean(option.glyph || Icon)}
    {@const showLabel = Boolean(option.label) && !(iconOnly && visual)}
    {@const name = option.title ?? option.label ?? option.value}
    <button
      type="button"
      class="sx-seg__item"
      aria-pressed={value === option.value}
      aria-label={showLabel ? undefined : name}
      {@attach !showLabel || option.title ? tooltip(name) : undefined}
      onclick={() => onchange(option.value)}
    >
      {#if option.glyph}
        <Glyph name={option.glyph} {rotate} />
      {:else if Icon}
        <Icon size={14} />
      {/if}
      {#if showLabel}<span>{option.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .seg .sx-seg__item {
    min-width: 0;
    padding: 0 6px;
  }
  .seg--inherited .sx-seg__item[aria-pressed='true'] {
    color: var(--sx-text-2);
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--sx-border-strong);
  }
</style>
