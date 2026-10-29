<script lang="ts">
  import type { Snippet } from 'svelte';
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import { tooltip } from './tooltip.js';

  interface Props {
    label: string;
    /** `row`: label left, control right (compact). `stack`: label above control. */
    layout?: 'row' | 'stack';
    help?: string;
    /** Shows an accent label + reset button when the value differs from inherited/default. */
    modified?: boolean;
    onreset?: () => void;
    /** Optional small adornment after the label (e.g. a breakpoint icon). */
    adornment?: Snippet;
    for?: string;
    children: Snippet;
  }

  let { label, layout = 'row', help, modified = false, onreset, adornment, for: forId, children }: Props = $props();
</script>

<div class={['field', `field--${layout}`]}>
  <div class="field__label-row">
    <label class={['field__label', modified && 'field__label--modified']} for={forId}>{label}</label>
    {#if adornment}{@render adornment()}{/if}
    {#if modified && onreset}
      <button type="button" class="field__reset" aria-label="Reset {label}" {@attach tooltip(`Reset ${label}`)} onclick={onreset}>
        <ArrowCounterClockwiseIcon size={11} weight="bold" />
      </button>
    {/if}
  </div>
  <div class="field__control">{@render children()}</div>
  {#if help}<p class="sx-help field__help">{help}</p>{/if}
</div>

<style>
  .field {
    display: grid;
    gap: 6px;
    min-width: 0;
  }
  .field--row {
    grid-template-columns: 92px minmax(0, 1fr);
    align-items: center;
    column-gap: 8px;
  }
  .field--row .field__help {
    grid-column: 2;
  }
  .field__label-row {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .field__label {
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .field__label--modified {
    color: var(--sx-accent-text);
  }
  .field__reset {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: var(--sx-text-3);
  }
  .field__reset:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .field__control {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
</style>
