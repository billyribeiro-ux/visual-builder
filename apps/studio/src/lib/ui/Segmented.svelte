<script lang="ts" generics="T extends string">
  import type { Component } from 'svelte';
  import { tooltip } from './tooltip.js';

  interface Option {
    value: T;
    label?: string;
    title?: string;
    icon?: Component<{ size?: number | string }>;
  }

  interface Props {
    options: Option[];
    value: T | undefined;
    onchange: (value: T) => void;
    ariaLabel: string;
    block?: boolean;
    iconOnly?: boolean;
    class?: string;
  }

  let { options, value, onchange, ariaLabel, block = false, iconOnly = false, class: className = '' }: Props = $props();
</script>

<div class={['sx-seg', block && 'sx-seg--block', className]} role="group" aria-label={ariaLabel}>
  {#each options as option (option.value)}
    {@const Icon = option.icon}
    <button
      type="button"
      class="sx-seg__item"
      aria-pressed={value === option.value}
      aria-label={iconOnly ? (option.title ?? option.label ?? option.value) : undefined}
      {@attach iconOnly || option.title ? tooltip(option.title ?? option.label ?? option.value) : undefined}
      onclick={() => onchange(option.value)}
    >
      {#if Icon}<Icon size={14} />{/if}
      {#if !iconOnly && option.label}<span>{option.label}</span>{/if}
    </button>
  {/each}
</div>
