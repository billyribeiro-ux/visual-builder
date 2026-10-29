<script lang="ts">
  import { untrack } from 'svelte';
  import { editor } from '#lib/state/editor.svelte.js';
  import { PAGE_TEMPLATE_CATALOG, createPageFromTemplate, toSlug, type BlueprintNode, type PageTemplateKey } from '@app-viz/schema';
  import { normalizePagePath, uniquePagePath } from '@app-viz/engine';
  import { getManifest } from '@app-viz/components';
  import Dialog from '../ui/Dialog.svelte';
  import Toggle from '#lib/ui/Toggle.svelte';
  import BlockThumbnail from '../dialogs/BlockThumbnail.svelte';
  import { componentLabel, pageTemplateCopy } from '../dialogs/copy.js';
  import FilePlusIcon from 'phosphor-svelte/lib/FilePlusIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';

  interface Props {
    onclose: () => void;
    initialTemplate?: PageTemplateKey;
  }

  let { onclose, initialTemplate = 'saas-landing' }: Props = $props();

  const uid = $props.id();
  const defaultLayout = editor.blueprint.layouts.find((l) => l.isDefault) ?? editor.blueprint.layouts[0];

  let template = $state<PageTemplateKey>(untrack(() => initialTemplate));
  let title = $state('');
  let path = $state('');
  let pathTouched = $state(false);
  let useLayout = $state(true);
  let layoutId = $state(defaultLayout?.id ?? '');

  /** Static previews: each template instantiated once (fresh ids, never inserted). */
  const templates = PAGE_TEMPLATE_CATALOG.map((t) => ({
    ...t,
    copy: pageTemplateCopy(t.key, t.label, t.description),
    root: createPageFromTemplate(t.key, '/preview', 'Preview').rootNode
  }));

  function sectionLabels(root: BlueprintNode): string[] {
    const out: string[] = [];
    const walk = (n: BlueprintNode, depth: number) => {
      if (!n.componentType.startsWith('structure/') && depth <= 3) {
        const label = componentLabel(getManifest(n.componentType)?.displayName ?? n.name);
        if (!out.includes(label)) out.push(label);
      }
      for (const c of n.children) walk(c, depth + 1);
    };
    walk(root, 0);
    return out;
  }

  const selected = $derived(templates.find((t) => t.key === template) ?? templates[0]);
  const includes = $derived(sectionLabels(selected.root));
  const layoutAllowed = $derived(selected.usesSharedLayout && editor.blueprint.layouts.length > 0);
  const attachLayout = $derived(layoutAllowed && useLayout && Boolean(layoutId));
  const typedPath = $derived(pathTouched ? path : title.trim() ? `/${toSlug(title)}` : '');
  const finalPath = $derived(uniquePagePath(editor.blueprint, normalizePagePath(typedPath || '/new-page')));
  const pathAdjusted = $derived(Boolean(typedPath) && normalizePagePath(typedPath) !== finalPath);
  const canCreate = $derived(title.trim().length > 0);

  function create(event: SubmitEvent) {
    event.preventDefault();
    if (!canCreate) return;
    const page = createPageFromTemplate(template, finalPath, title.trim(), attachLayout ? layoutId : undefined);
    if (editor.dispatch({ type: 'ADD_PAGE', page })) {
      editor.setActivePage(page.id);
      editor.notify('success', `Created “${title.trim()}” at ${finalPath}.`);
      onclose();
    }
  }

  function onTemplateKeydown(event: KeyboardEvent) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const idx = templates.findIndex((t) => t.key === template);
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowDown' ? 3 : -3;
    const next = templates[(idx + step + templates.length) % templates.length];
    template = next.key;
    (event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-key="${next.key}"]`)?.focus();
  }
</script>

<Dialog open title="New page" subtitle="Start from a template. Everything can be edited after it is created." size="xl" icon={FilePlusIcon} flush initialFocus="#{uid}-title" {onclose}>
  <form id="{uid}-form" class="np" onsubmit={create}>
    <div class="np__templates">
      <div class="sx-section-label np__label" id="{uid}-tpl-label">Template</div>
      <div class="np__grid" role="radiogroup" aria-labelledby="{uid}-tpl-label" tabindex="-1" onkeydown={onTemplateKeydown}>
        {#each templates as t (t.key)}
          {@const on = t.key === template}
          <button
            type="button"
            role="radio"
            aria-checked={on}
            tabindex={on ? 0 : -1}
            data-key={t.key}
            class={['card', on && 'card--on']}
            onclick={() => (template = t.key)}
          >
            <span class="card__thumb">
              <BlockThumbnail node={t.root} ratio={0.62} />
              {#if on}<span class="card__check"><CheckIcon size={11} weight="bold" /></span>{/if}
            </span>
            <span class="card__body">
              <span class="card__title">{t.copy.label}</span>
              <span class="card__desc">{t.copy.description}</span>
            </span>
          </button>
        {/each}
      </div>
    </div>

    <aside class="np__side">
      <div class="np__field">
        <label class="sx-label" for="{uid}-title">Page name</label>
        <input id="{uid}-title" class="sx-input" placeholder="e.g. Solutions" autocomplete="off" bind:value={title} />
      </div>

      <div class="np__field">
        <label class="sx-label" for="{uid}-path">Route path</label>
        <input
          id="{uid}-path"
          class="sx-input sx-input--mono"
          spellcheck="false"
          autocomplete="off"
          placeholder="/new-page"
          value={typedPath}
          oninput={(e) => {
            pathTouched = true;
            path = (e.currentTarget as HTMLInputElement).value;
          }}
        />
        <p class="sx-help">
          {#if pathAdjusted}
            Will be created at <code class="np__code">{finalPath}</code> — that path is taken or gets normalised.
          {:else}
            Will be created at <code class="np__code">{finalPath}</code>
          {/if}
        </p>
      </div>

      {#if editor.blueprint.layouts.length > 0}
        <div class="np__field">
          <div class="np__toggle-row">
            <label class="sx-label" for="{uid}-layout-toggle">Use shared layout</label>
            <Toggle checked={layoutAllowed && useLayout} disabled={!layoutAllowed} label="Use shared layout" onchange={(v) => (useLayout = v)} />
          </div>
          {#if !selected.usesSharedLayout}
            <p class="sx-help">This template renders its own app shell, so it never uses the shared header and footer.</p>
          {:else if editor.blueprint.layouts.length > 1}
            <select id="{uid}-layout-toggle" class="sx-select" bind:value={layoutId} disabled={!useLayout} aria-label="Layout">
              {#each editor.blueprint.layouts as layout (layout.id)}
                <option value={layout.id}>{layout.name}</option>
              {/each}
            </select>
          {:else}
            <p class="sx-help">Wraps the page in {defaultLayout?.name ?? 'the shared layout'} (navigation and footer).</p>
          {/if}
        </div>
      {/if}

      <div class="np__includes">
        <div class="sx-label">Includes</div>
        {#if includes.length > 0}
          <ul class="np__list">
            {#each includes as label (label)}
              <li>{label}</li>
            {/each}
          </ul>
        {:else}
          <p class="sx-help">An empty container — add sections from the Elements panel or the library.</p>
        {/if}
      </div>
    </aside>
  </form>

  {#snippet footer()}
    <button type="button" class="sx-btn" onclick={onclose}>Cancel</button>
    <button type="submit" form="{uid}-form" class="sx-btn sx-btn--primary" disabled={!canCreate}>Create page</button>
  {/snippet}
</Dialog>

<style>
  .np {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 288px;
    min-height: 0;
    flex: 1;
    max-height: min(640px, calc(100vh - 200px));
  }
  .np__templates {
    min-height: 0;
    overflow-y: auto;
    padding: 4px 20px 20px;
  }
  .np__label {
    padding-left: 0;
    padding-right: 0;
  }
  .np__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    outline: none;
  }
  .card {
    display: flex;
    flex-direction: column;
    min-width: 0;
    text-align: left;
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    overflow: hidden;
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease);
  }
  .card:hover {
    border-color: var(--sx-border-strong);
    box-shadow: var(--sx-shadow-md);
  }
  .card--on,
  .card--on:hover {
    border-color: var(--sx-accent);
    box-shadow: 0 0 0 1px var(--sx-accent);
  }
  .card__thumb {
    position: relative;
    display: block;
    border-bottom: 1px solid var(--sx-border);
  }
  .card__check {
    position: absolute;
    top: 8px;
    right: 8px;
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    color: #fff;
    background: var(--sx-accent);
    box-shadow: 0 0 0 2px var(--sx-panel);
  }
  .card__body {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 10px 12px 12px;
  }
  .card__title {
    font-size: var(--sx-text-md);
    font-weight: 600;
    color: var(--sx-text);
  }
  .card__desc {
    font-size: var(--sx-text-sm);
    line-height: 1.45;
    color: var(--sx-text-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(2 * 1.45em);
  }
  .np__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    overflow-y: auto;
    padding: 18px 20px 20px;
    border-left: 1px solid var(--sx-border);
    background: var(--sx-subtle);
  }
  .np__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .np__toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .np__code {
    font-family: var(--sx-font-mono);
    color: var(--sx-text-2);
  }
  .np__includes {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-top: 14px;
    border-top: 1px solid var(--sx-border);
  }
  .np__list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .np__list li {
    position: relative;
    padding-left: 14px;
    font-size: var(--sx-text-md);
    color: var(--sx-text);
  }
  .np__list li::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 7px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--sx-text-3);
  }
  @media (max-width: 900px) {
    .np {
      grid-template-columns: 1fr;
    }
    .np__grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
