<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import Popover from '../../../ui/Popover.svelte';
  import { tooltip } from '../../../ui/tooltip.js';
  import SvgIcon from './SvgIcon.svelte';
  import InlineMessage from './InlineMessage.svelte';
  import { iconNames, iconSetAvailable, resolveIcon } from '../lib/icon-set.js';

  interface Props {
    value: string;
    onchange: (value: string) => void;
    label: string;
    id?: string;
  }

  let { value, onchange, label, id }: Props = $props();

  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);
  let query = $state('');

  const resolved = $derived(resolveIcon(value));
  const isAlias = $derived(Boolean(resolved && resolved !== value));
  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return q ? iconNames.filter((n) => n.toLowerCase().includes(q)) : iconNames;
  });

  const COLUMNS = 8;

  /** Arrow keys move focus through the icon grid. */
  const gridNav: Attachment<HTMLElement> = (grid) => {
    const onKeydown = (e: KeyboardEvent) => {
      const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: COLUMNS, ArrowUp: -COLUMNS };
      const delta = keys[e.key];
      if (!delta) return;
      const buttons = Array.from(grid.querySelectorAll<HTMLButtonElement>('button'));
      const idx = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (idx < 0) return;
      e.preventDefault();
      buttons[Math.min(buttons.length - 1, Math.max(0, idx + delta))]?.focus();
    };
    grid.addEventListener('keydown', onKeydown);
    return () => grid.removeEventListener('keydown', onKeydown);
  };

  function pick(name: string) {
    onchange(name);
    open = false;
    query = '';
  }
</script>

{#if iconSetAvailable}
  <div class="ip">
    <button
      {id}
      type="button"
      class="ip__trigger"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label="{label}: {value || 'none'}. Choose icon"
      {@attach (el) => {
        anchor = el;
      }}
      onclick={() => (open = !open)}
    >
      <span class="ip__preview">
        {#if resolved}<SvgIcon name={resolved} size={16} />{/if}
      </span>
      <span class="ip__name">{value || 'Choose an icon'}</span>
      <CaretDownIcon size={12} />
    </button>
    {#if value && !resolved}
      <InlineMessage tone="warning" message="“{value}” is not in the icon set; a fallback icon will render." />
    {:else if isAlias}
      <p class="sx-help">Legacy name — renders as {resolved}.</p>
    {/if}
  </div>

  <Popover {open} {anchor} onclose={() => (open = false)} placement="bottom-start" width={284} role="dialog" label="Choose an icon">
    <div class="ip__pop">
      <div class="sx-search">
        <MagnifyingGlassIcon size={14} />
        <input class="sx-input" type="search" placeholder="Search {iconNames.length} icons" aria-label="Search icons" bind:value={query} />
      </div>
      {#if filtered.length}
        <div class="ip__grid" role="group" aria-label="Icons" {@attach gridNav}>
          {#each filtered as name (name)}
            <button
              type="button"
              class={['ip__cell', name === resolved && 'ip__cell--on']}
              aria-label={name}
              aria-pressed={name === resolved}
              {@attach tooltip(name, { placement: 'top' })}
              onclick={() => pick(name)}
            >
              <SvgIcon {name} size={18} />
            </button>
          {/each}
        </div>
      {:else}
        <p class="sx-help ip__empty">No icons match “{query}”.</p>
      {/if}
    </div>
  </Popover>
{:else}
  <input
    {id}
    class="sx-input sx-input--mono"
    aria-label={label}
    spellcheck="false"
    placeholder="Icon name"
    {value}
    onchange={(e) => onchange(e.currentTarget.value.trim())}
  />
{/if}

<style>
  .ip {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    min-width: 0;
  }
  .ip__trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: var(--sx-control-h);
    padding: 0 8px 0 4px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
    background: var(--sx-subtle);
    color: var(--sx-text-3);
    text-align: left;
  }
  .ip__trigger:hover {
    border-color: var(--sx-border-strong);
  }
  .ip__preview {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text);
    background: var(--sx-panel);
    box-shadow: inset 0 0 0 1px var(--sx-border);
    flex-shrink: 0;
  }
  .ip__name {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-md);
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ip__pop {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px;
  }
  .ip__grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 2px;
    max-height: 248px;
    overflow-y: auto;
  }
  .ip__cell {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-2);
  }
  .ip__cell:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .ip__cell--on {
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
  }
  .ip__empty {
    padding: 12px 4px;
    text-align: center;
  }
</style>
