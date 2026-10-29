<script lang="ts">
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import GlobeIcon from 'phosphor-svelte/lib/GlobeIcon';
  import HashIcon from 'phosphor-svelte/lib/HashIcon';
  import { isValidHtmlId } from '@app-viz/schema';
  import { editor } from '../../../state/editor.svelte.js';
  import { classifyHref } from '../../../canvas/messages.js';
  import { collectHtmlIds } from '../lib/html-ids.js';
  import Seg, { type SegOption } from './Seg.svelte';
  import InlineMessage from './InlineMessage.svelte';

  type Mode = 'page' | 'url' | 'anchor';

  interface Props {
    value: string;
    onchange: (value: string) => void;
    /** Accessible name of the link field, e.g. "Primary CTA link". */
    label: string;
    id?: string;
  }

  let { value, onchange, label, id }: Props = $props();

  const uid = $props.id();
  const baseId = $derived(id ?? uid);

  const pages = $derived(editor.blueprint.pages);
  const link = $derived(classifyHref(value));
  const pageMatch = $derived(link.kind === 'internal' ? pages.find((p) => p.path === link.path) : undefined);
  const detected = $derived<Mode>(
    !value.trim() ? 'page' : link.kind === 'hash' ? 'anchor' : link.kind === 'internal' && pageMatch ? 'page' : 'url'
  );
  let chosen = $state<Mode | null>(null);
  const mode = $derived(chosen ?? detected);

  const MODES: SegOption<Mode>[] = [
    { value: 'page', label: 'Page', icon: FileIcon, title: 'Link to a page in this project' },
    { value: 'url', label: 'URL', icon: GlobeIcon, title: 'Link to any URL' },
    { value: 'anchor', label: 'Section', icon: HashIcon, title: 'Scroll to a section on the current page' }
  ];

  let urlDraft = $state<string | null>(null);
  let anchorDraft = $state<string | null>(null);
  let fragmentDraft = $state<string | null>(null);
  let error = $state('');

  const fragment = $derived(link.kind === 'internal' ? link.fragment : '');

  /** CSS IDs on the page being edited (incl. its shared layout): `#anchor` targets. */
  const uniq = (ids: string[]) => [...new Set(ids)];
  const currentAnchors = $derived(
    uniq(collectHtmlIds(editor.activePage?.rootNode, editor.activeLayout?.rootNode).map((e) => e.id))
  );
  /** CSS IDs on the page a link points to, offered for its `#section` field. */
  const targetAnchors = $derived.by(() => {
    if (!pageMatch) return [];
    const layout = pageMatch.layoutId ? editor.blueprint.layouts.find((l) => l.id === pageMatch.layoutId) : undefined;
    return uniq(collectHtmlIds(pageMatch.rootNode, layout?.rootNode).map((e) => e.id));
  });
  const ID_RULE = 'Section ids start with a letter and use letters, numbers, - or _ (max 64).';

  const warning = $derived.by(() => {
    if (error) return '';
    if (link.kind === 'internal' && !pageMatch) return `No page uses “${link.path}”. Visitors would get a 404.`;
    if (link.kind === 'blocked') return `This link is blocked (${link.reason}).`;
    if (link.kind === 'hash' && link.fragment && !currentAnchors.includes(link.fragment)) {
      return `No element on this page has the CSS ID “${link.fragment}”. Set one in Advanced › Element.`;
    }
    if (link.kind === 'internal' && pageMatch && link.fragment && !targetAnchors.includes(link.fragment)) {
      return `“${pageMatch.title}” has no element with the CSS ID “${link.fragment}”.`;
    }
    return '';
  });

  // Drafts are cleared only on success: rejected input stays on screen next to its error.
  function commitUrl(text: string) {
    const t = text.trim();
    const c = classifyHref(t);
    if (c.kind === 'blocked') {
      error = c.dangerous ? `${c.reason}s are not allowed — they can run scripts.` : `Not a valid link (${c.reason}).`;
      return;
    }
    error = '';
    urlDraft = null;
    onchange(t);
  }

  function commitAnchor(text: string) {
    const t = text.trim().replace(/^#/, '');
    if (t && !isValidHtmlId(t)) {
      error = ID_RULE;
      return;
    }
    error = '';
    anchorDraft = null;
    onchange(t ? `#${t}` : '');
  }

  function commitPage(path: string, frag: string) {
    const f = frag.trim().replace(/^#/, '');
    if (f && !isValidHtmlId(f)) {
      error = ID_RULE;
      return;
    }
    error = '';
    fragmentDraft = null;
    onchange(path ? `${path}${f ? `#${f}` : ''}` : '');
  }
</script>

<div class="link">
  <Seg options={MODES} value={mode} ariaLabel="{label} type" onchange={(m) => {
      chosen = m;
      error = '';
    }} />

  {#if mode === 'page'}
    <div class="link__row">
      <select
        id="{baseId}-page"
        class="sx-select"
        aria-label="{label}: page"
        value={pageMatch?.path ?? ''}
        onchange={(e) => commitPage(e.currentTarget.value, fragment)}
      >
        <option value="">Choose a page…</option>
        {#each pages as p (p.id)}
          <option value={p.path}>{p.path} · {p.title}</option>
        {/each}
      </select>
      <div class="link__frag">
        <span aria-hidden="true">#</span>
        <input
          class="sx-input sx-input--mono"
          aria-label="{label}: section on that page (optional)"
          placeholder="section"
          spellcheck="false"
          disabled={!pageMatch}
          list={targetAnchors.length ? `${baseId}-frag-ids` : undefined}
          value={fragmentDraft ?? fragment}
          oninput={(e) => (fragmentDraft = e.currentTarget.value)}
          onchange={(e) => commitPage(pageMatch?.path ?? '', e.currentTarget.value)}
        />
        {#if targetAnchors.length}
          <datalist id="{baseId}-frag-ids">
            {#each targetAnchors as a (a)}<option value={a}></option>{/each}
          </datalist>
        {/if}
      </div>
    </div>
  {:else if mode === 'url'}
    <input
      id="{baseId}-url"
      class={['sx-input', 'sx-input--mono', error && 'is-invalid']}
      aria-label="{label}: URL"
      aria-invalid={error ? 'true' : undefined}
      placeholder="https://example.com or /path"
      spellcheck="false"
      value={urlDraft ?? value}
      oninput={(e) => (urlDraft = e.currentTarget.value)}
      onchange={(e) => commitUrl(e.currentTarget.value)}
    />
  {:else}
    <div class="link__anchor">
      <span aria-hidden="true">#</span>
      <input
        id="{baseId}-anchor"
        class={['sx-input', 'sx-input--mono', error && 'is-invalid']}
        aria-label="{label}: section id"
        aria-invalid={error ? 'true' : undefined}
        placeholder="pricing"
        spellcheck="false"
        value={anchorDraft ?? (link.kind === 'hash' ? link.fragment : '')}
        oninput={(e) => (anchorDraft = e.currentTarget.value)}
        onchange={(e) => commitAnchor(e.currentTarget.value)}
      />
    </div>
    {#if currentAnchors.length}
      <div class="link__ids" role="group" aria-label="CSS IDs on this page">
        {#each currentAnchors as a (a)}
          <button
            type="button"
            class={['link__id', link.kind === 'hash' && link.fragment === a && 'link__id--on']}
            aria-pressed={link.kind === 'hash' && link.fragment === a}
            onclick={() => commitAnchor(a)}>#{a}</button
          >
        {/each}
      </div>
    {:else}
      <p class="sx-help">No element on this page has a CSS ID yet. Add one in Advanced › Element.</p>
    {/if}
  {/if}

  {#if error}
    <InlineMessage message={error} />
  {:else if warning}
    <InlineMessage tone="warning" message={warning} />
  {:else if link.kind === 'external' && mode === 'url'}
    <InlineMessage tone="info" message="Opens an external site." />
  {/if}
</div>

<style>
  .link {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .link__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 84px;
    gap: 6px;
  }
  .link__frag,
  .link__anchor {
    position: relative;
    display: flex;
    align-items: center;
  }
  .link__frag span,
  .link__anchor span {
    position: absolute;
    left: 8px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    pointer-events: none;
  }
  .link__frag .sx-input,
  .link__anchor .sx-input {
    padding-left: 20px;
  }
  .link__frag .sx-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
  .link__ids {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .link__id {
    height: 22px;
    padding: 0 7px;
    border-radius: var(--sx-radius-xs);
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
    background: var(--sx-hover);
  }
  .link__id:hover {
    color: var(--sx-text);
    background: var(--sx-active);
  }
  .link__id--on {
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
  }
</style>
