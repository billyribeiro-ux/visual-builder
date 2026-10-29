<script lang="ts">
  import { editor } from '../state/editor.svelte.js';
  import { tooltip } from '../ui/tooltip.js';
  import ElementsPanel from './panels/ElementsPanel.svelte';
  import LayersPanel from './panels/LayersPanel.svelte';
  import PagesPanel from './panels/PagesPanel.svelte';
  import AssetsPanel from './panels/AssetsPanel.svelte';
  import GlobalStylesPanel from './panels/GlobalStylesPanel.svelte';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import StackIcon from 'phosphor-svelte/lib/StackIcon';
  import FilesIcon from 'phosphor-svelte/lib/FilesIcon';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import PaletteIcon from 'phosphor-svelte/lib/PaletteIcon';
  import BooksIcon from 'phosphor-svelte/lib/BooksIcon';
  import SparkleIcon from 'phosphor-svelte/lib/SparkleIcon';
  import KeyboardIcon from 'phosphor-svelte/lib/KeyboardIcon';
  import TreeStructureIcon from 'phosphor-svelte/lib/TreeStructureIcon';

  type Tab = typeof editor.activeLeftTab;

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  const mod = isMac ? '⌘' : 'Ctrl+';

  const tabs: { key: Tab; label: string; icon: typeof PlusIcon; kbd: string }[] = [
    { key: 'library', label: 'Add elements', icon: PlusIcon, kbd: 'A' },
    { key: 'layers', label: 'Layers', icon: StackIcon, kbd: 'L' },
    { key: 'pages', label: 'Pages', icon: FilesIcon, kbd: 'G' },
    { key: 'assets', label: 'Assets', icon: ImageIcon, kbd: 'M' },
    { key: 'tokens', label: 'Global styles', icon: PaletteIcon, kbd: 'S' }
  ];
</script>

<aside class="ls" aria-label="Editor sidebar">
  <nav class="ls__rail" aria-label="Sidebar sections">
    {#each tabs as tab (tab.key)}
      {@const Icon = tab.icon}
      {@const on = editor.activeLeftTab === tab.key && editor.leftPanelOpen}
      <button
        type="button"
        class={['ls__rail-btn', on && 'ls__rail-btn--on']}
        aria-label={tab.label}
        aria-pressed={on}
        {@attach tooltip(tab.label, { kbd: tab.kbd, placement: 'right' })}
        onclick={() => editor.openLeftTab(tab.key)}
      >
        <Icon size={18} weight={on ? 'fill' : 'regular'} />
      </button>
    {/each}

    <span class="ls__rail-sep"></span>

    <button
      type="button"
      class="ls__rail-btn"
      aria-label="Template library"
      {@attach tooltip('Template library', { placement: 'right' })}
      onclick={() => (editor.showBlockLibraryModal = true)}
    >
      <BooksIcon size={18} />
    </button>
    <button
      type="button"
      class={['ls__rail-btn', editor.showNavigator && 'ls__rail-btn--on']}
      aria-label="Floating navigator"
      aria-pressed={editor.showNavigator}
      {@attach tooltip('Floating navigator', { kbd: `${mod}I`, placement: 'right' })}
      onclick={() => (editor.showNavigator = !editor.showNavigator)}
    >
      <TreeStructureIcon size={18} />
    </button>
    <button
      type="button"
      class="ls__rail-btn"
      aria-label="Compose with AI"
      {@attach tooltip('Command menu & compose', { kbd: `${mod}K`, placement: 'right' })}
      onclick={() => (editor.showCommandPalette = true)}
    >
      <SparkleIcon size={18} />
    </button>

    <span class="ls__rail-spacer"></span>

    <button
      type="button"
      class="ls__rail-btn"
      aria-label="Keyboard shortcuts"
      {@attach tooltip('Keyboard shortcuts', { kbd: '?', placement: 'right' })}
      onclick={() => (editor.showShortcuts = true)}
    >
      <KeyboardIcon size={18} />
    </button>
  </nav>

  {#if editor.leftPanelOpen}
    <div class="ls__panel">
      {#if editor.activeLeftTab === 'library'}
        <ElementsPanel />
      {:else if editor.activeLeftTab === 'layers'}
        <LayersPanel />
      {:else if editor.activeLeftTab === 'pages'}
        <PagesPanel />
      {:else if editor.activeLeftTab === 'assets'}
        <AssetsPanel />
      {:else if editor.activeLeftTab === 'tokens'}
        <GlobalStylesPanel />
      {/if}
    </div>
  {/if}
</aside>

<style>
  .ls {
    display: flex;
    min-height: 0;
    background: var(--sx-panel);
    border-right: 1px solid var(--sx-border);
  }
  .ls__rail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: var(--sx-rail-w);
    padding: 8px 0;
    border-right: 1px solid var(--sx-border);
    flex-shrink: 0;
  }
  .ls__rail-btn {
    position: relative;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: var(--sx-radius-md);
    color: var(--sx-text-2);
    transition:
      background-color var(--sx-dur) var(--sx-ease),
      color var(--sx-dur) var(--sx-ease);
  }
  .ls__rail-btn:hover {
    background: var(--sx-hover);
    color: var(--sx-text);
  }
  .ls__rail-btn--on {
    background: var(--sx-accent-soft);
    color: var(--sx-accent-text);
  }
  .ls__rail-btn--on:hover {
    background: var(--sx-accent-soft);
    color: var(--sx-accent-text);
  }
  .ls__rail-sep {
    width: 20px;
    height: 1px;
    margin: 6px 0;
    background: var(--sx-border);
  }
  .ls__rail-spacer {
    flex: 1;
  }
  .ls__panel {
    display: flex;
    flex-direction: column;
    width: var(--sx-panel-w);
    min-height: 0;
  }
  .ls__panel > :global(.sx-panel) {
    flex: 1;
  }
</style>
