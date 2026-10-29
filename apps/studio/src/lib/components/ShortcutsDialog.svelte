<script lang="ts">
  import { editor } from '#lib/state/editor.svelte.js';
  import Dialog from './ui/Dialog.svelte';
  import { SHORTCUT_GROUPS } from './dialogs/shortcuts.js';
  import KeyboardIcon from 'phosphor-svelte/lib/KeyboardIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';

  let query = $state('');

  const groups = $derived.by(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHORTCUT_GROUPS;
    return SHORTCUT_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q) || g.title.toLowerCase().includes(q) || i.keys.join('').toLowerCase().includes(q))
    })).filter((g) => g.items.length > 0);
  });

  function close() {
    editor.showShortcuts = false;
    query = '';
  }
</script>

{#snippet keycaps(keys: string[])}
  <span class="keys">
    {#each keys as key, i (i)}
      <kbd class={['sx-kbd', key.length > 2 && 'kbd--word']}>{key}</kbd>
    {/each}
  </span>
{/snippet}

<Dialog
  open={editor.showShortcuts}
  title="Keyboard shortcuts"
  subtitle="Mac keys shown — use Ctrl in place of ⌘ on Windows and Linux."
  size="xl"
  icon={KeyboardIcon}
  onclose={close}
>
  <label class="sx-search search">
    <MagnifyingGlassIcon size={14} />
    <input class="sx-input" type="search" placeholder="Search shortcuts" aria-label="Search shortcuts" data-autofocus bind:value={query} />
  </label>

  {#if groups.length === 0}
    <div class="sx-empty">
      <span class="sx-empty__title">No shortcut matches “{query}”</span>
    </div>
  {:else}
    <div class="groups">
      {#each groups as group (group.title)}
        <section class="group" aria-label={group.title}>
          <h3 class="group__title">{group.title}</h3>
          <ul class="rows">
            {#each group.items as item (item.id)}
              <li class="row">
                <span class="row__label">{item.label}</span>
                <span class="row__keys">
                  {@render keycaps(item.keys)}
                  {#if item.alt}
                    <span class="row__or">or</span>
                    {@render keycaps(item.alt)}
                  {/if}
                </span>
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</Dialog>

<style>
  .search {
    margin-bottom: 16px;
  }
  .groups {
    columns: 2 300px;
    column-gap: 32px;
  }
  .group {
    break-inside: avoid;
    margin-bottom: 20px;
  }
  .group__title {
    padding-bottom: 6px;
    margin-bottom: 2px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
    border-bottom: 1px solid var(--sx-border);
  }
  .rows {
    display: flex;
    flex-direction: column;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 32px;
  }
  .row + .row {
    border-top: 1px solid color-mix(in srgb, var(--sx-border) 60%, transparent);
  }
  .row__label {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-md);
    color: var(--sx-text);
  }
  .row__keys {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .keys {
    display: inline-flex;
    gap: 3px;
  }
  .keys .sx-kbd {
    min-width: 20px;
    height: 20px;
    font-size: 11px;
  }
  .keys .kbd--word {
    padding: 0 6px;
    font-size: var(--sx-text-xs);
  }
  .row__or {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
</style>
