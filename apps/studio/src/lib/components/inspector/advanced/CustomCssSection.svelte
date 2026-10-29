<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import CaretDownIcon from 'phosphor-svelte/lib/CaretDownIcon';
  import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Popover from '../../../ui/Popover.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import CodeEditor from '../controls/CodeEditor.svelte';
  import InlineMessage from '../controls/InlineMessage.svelte';
  import { customCssError } from '../lib/css-values.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const uid = $props.id();

  const SNIPPETS = [
    {
      label: 'Frosted glass',
      code: 'selector {\n  backdrop-filter: blur(16px);\n  background: rgba(255, 255, 255, 0.72);\n  border: 1px solid rgba(16, 24, 40, 0.08);\n  border-radius: 16px;\n}'
    },
    {
      label: 'Hover lift',
      code: 'selector {\n  transition: transform 0.25s ease, box-shadow 0.25s ease;\n}\nselector:hover {\n  transform: translateY(-4px);\n  box-shadow: 0 12px 24px rgba(16, 24, 40, 0.12);\n}'
    },
    {
      label: 'Accent bar',
      code: 'selector {\n  border-left: 4px solid var(--md-sys-color-primary);\n  padding-left: 1rem;\n}'
    },
    {
      label: 'Child elements',
      code: 'selector h2 {\n  letter-spacing: -0.02em;\n}\nselector p {\n  max-width: 60ch;\n}'
    }
  ];

  let draft = $state<string | null>(null);
  let error = $state('');
  let menuOpen = $state(false);
  let menuAnchor = $state<HTMLElement | null>(null);

  const saved = $derived(node.customCss || '');
  const text = $derived(draft ?? saved);
  const dirty = $derived(draft !== null && draft !== saved);

  function commit(css = text) {
    const problem = customCssError(css);
    if (problem) {
      error = `Not saved — ${problem}`;
      return;
    }
    error = '';
    draft = null;
    if (css !== saved) {
      editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { customCss: css } }, { coalesce: false });
    }
  }

  function insertSnippet(code: string) {
    menuOpen = false;
    const base = text.trimEnd();
    commit(base ? `${base}\n\n${code}` : code);
  }
</script>

<PanelSection id="adv-css" title="Custom CSS" modified={saved.trim().length > 0}>
  {#snippet actions()}
    <button
      type="button"
      class="css__snippets"
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      {@attach (el) => {
        menuAnchor = el;
      }}
      onclick={() => (menuOpen = !menuOpen)}
    >
      <CodeIcon size={13} /> Snippets <CaretDownIcon size={10} weight="bold" />
    </button>
  {/snippet}

  <p class="sx-help">Styles for this element only. Target it with <code>selector</code>, e.g. <code>selector:hover</code>.</p>
  <div class="css__editor" onfocusout={() => dirty && commit()}>
    <CodeEditor
      id="{uid}-css"
      ariaLabel="Custom CSS for this element"
      placeholder={'selector {\n  border-radius: 16px;\n}'}
      value={text}
      invalid={Boolean(error)}
      describedby={error ? `${uid}-css-error` : undefined}
      oninput={(v) => {
        draft = v;
        if (error) error = '';
      }}
      onsubmit={() => commit()}
    />
  </div>
  {#if error}
    <InlineMessage id="{uid}-css-error" message={error} />
  {:else}
    <div class="css__status">
      <span class="sx-help">{dirty ? 'Unsaved — applies when you leave the editor (⌘↵ to apply now).' : saved ? 'Applied.' : 'No custom CSS.'}</span>
      {#if saved && !dirty}
        <button
          type="button"
          class="sx-btn sx-btn--sm sx-btn--ghost"
          onclick={() => editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta: { customCss: '' } }, { coalesce: false })}
        >
          Clear
        </button>
      {/if}
    </div>
  {/if}
</PanelSection>

<Popover open={menuOpen} anchor={menuAnchor} onclose={() => (menuOpen = false)} placement="bottom-end" width={200} label="CSS snippets">
  <div class="sx-menu-heading">Insert snippet</div>
  {#each SNIPPETS as s (s.label)}
    <button type="button" role="menuitem" class="sx-menu-item" onclick={() => insertSnippet(s.code)}>
      <span class="sx-menu-item__label">{s.label}</span>
    </button>
  {/each}
</Popover>

<style>
  .sx-help code {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    padding: 0 3px;
    border-radius: 3px;
    background: var(--sx-hover);
    color: var(--sx-text-2);
  }
  .css__editor {
    width: 100%;
  }
  .css__snippets {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 24px;
    padding: 0 6px;
    border-radius: var(--sx-radius-xs);
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text-2);
  }
  .css__snippets:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .css__status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: -4px;
  }
</style>
