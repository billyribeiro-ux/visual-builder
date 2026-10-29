<script module lang="ts">
  import { SvelteMap } from 'svelte/reactivity';

  /** Remembers open/closed state per section id for the whole session. */
  const remembered = new SvelteMap<string, boolean>();
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';

  interface Props {
    id: string;
    title: string;
    defaultOpen?: boolean;
    /** Shows a small accent dot when the section contains non-default values. */
    modified?: boolean;
    actions?: Snippet;
    children: Snippet;
  }

  let { id, title, defaultOpen = true, modified = false, actions, children }: Props = $props();

  const open = $derived(remembered.get(id) ?? defaultOpen);

  function toggle() {
    remembered.set(id, !open);
  }
</script>

<section class={["ps", open && "ps--open"]}>
  <div class="ps__header">
    <button type="button" class="ps__toggle" aria-expanded={open} onclick={toggle}>
      <span class="ps__caret"><CaretRightIcon size={10} weight="bold" /></span>
      <span class="ps__title">{title}</span>
      {#if modified}<span class="ps__dot" aria-label="Has custom values"></span>{/if}
    </button>
    {#if actions}<div class="ps__actions">{@render actions()}</div>{/if}
  </div>
  {#if open}
    <div class="ps__body">{@render children()}</div>
  {/if}
</section>

<style>
  .ps {
    border-bottom: 1px solid var(--sx-border);
  }
  .ps__header {
    display: flex;
    align-items: center;
    padding-right: 8px;
  }
  .ps__toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    height: 38px;
    padding: 0 14px 0 10px;
    font-size: var(--sx-text-md);
    font-weight: 600;
    color: var(--sx-text);
    text-align: left;
  }
  .ps__toggle:hover .ps__title {
    color: var(--sx-text);
  }
  .ps__caret {
    display: grid;
    place-items: center;
    width: 14px;
    color: var(--sx-text-3);
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .ps--open .ps__caret {
    transform: rotate(90deg);
  }
  .ps__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ps__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sx-accent);
    flex-shrink: 0;
  }
  .ps__actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .ps__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 2px 14px 16px;
  }
</style>
