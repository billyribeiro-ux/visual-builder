<script lang="ts">
  import { pageDisplayName } from '../../state/page-name.js';
  import type { PageRoute } from '@app-viz/schema';
  import { normalizePagePath } from '@app-viz/engine';
  import FileTextIcon from 'phosphor-svelte/lib/FileTextIcon';
  import EyeSlashIcon from 'phosphor-svelte/lib/EyeSlashIcon';
  import LockSimpleIcon from 'phosphor-svelte/lib/LockSimpleIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import StackIcon from 'phosphor-svelte/lib/StackIcon';
  import PanelSection from '../../ui/PanelSection.svelte';
  import Field from '../../ui/Field.svelte';
  import { editor } from '../../state/editor.svelte.js';
  import AutoTextarea from './controls/AutoTextarea.svelte';
  import AssetPicker from './controls/AssetPicker.svelte';
  import InlineMessage from './controls/InlineMessage.svelte';
  import NodeIcon from './NodeIcon.svelte';
  import NoteField from './controls/NoteField.svelte';

  interface Props {
    page: PageRoute;
  }

  let { page }: Props = $props();

  const uid = $props.id();

  const TITLE_MAX = 60;
  const DESC_MIN = 50;
  const DESC_MAX = 160;

  let titleDraft = $state<string | null>(null);
  let titleError = $state('');
  let pathDraft = $state<string | null>(null);
  let pathError = $state('');
  let seoTitleDraft = $state<string | null>(null);
  let descDraft = $state<string | null>(null);

  const seo = $derived(page.seo ?? {});
  const seoTitle = $derived(seoTitleDraft ?? seo.title ?? '');
  const description = $derived(descDraft ?? seo.metaDescription ?? page.description ?? '');
  const effectiveTitle = $derived(seoTitle.trim() || page.title);
  const sections = $derived(page.rootNode?.children ?? []);

  const pathPreview = $derived.by(() => {
    if (pathDraft === null) return '';
    const normalized = normalizePagePath(pathDraft);
    return normalized !== pathDraft.trim() ? normalized : '';
  });

  function meta(patch: Partial<Pick<PageRoute, 'title' | 'path' | 'description' | 'seo' | 'layoutId'>>) {
    editor.dispatch({ type: 'UPDATE_PAGE_META', pageId: page.id, meta: patch }, { coalesce: false });
  }

  function commitTitle(text: string) {
    const t = text.trim();
    if (!t) {
      titleError = 'A page title is required.';
      return;
    }
    titleError = '';
    titleDraft = null;
    if (t !== page.title) meta({ title: t });
  }

  function commitPath(text: string) {
    const normalized = normalizePagePath(text);
    const clash = editor.blueprint.pages.find((p) => p.id !== page.id && p.path === normalized);
    if (clash) {
      pathError = `“${normalized}” is already used by “${clash.title}”.`;
      return;
    }
    pathError = '';
    pathDraft = null;
    if (normalized !== page.path) meta({ path: normalized });
  }

  function commitSeoTitle() {
    if (seoTitleDraft === null) return;
    const t = seoTitleDraft.trim();
    seoTitleDraft = null;
    if (t !== (seo.title ?? '')) meta({ seo: { ...seo, title: t || undefined } });
  }

  function commitDescription() {
    if (descDraft === null) return;
    const d = descDraft.trim();
    descDraft = null;
    if (d !== (seo.metaDescription ?? page.description ?? '')) {
      // The export's <meta name="description"> reads `description`; the build spec prefers
      // `seo.metaDescription`. Keep both in step so they can never disagree.
      meta({ description: d, seo: { ...seo, metaDescription: d || undefined } });
    }
  }
</script>

<header class="ph">
  <span class="ph__tile"><FileTextIcon size={14} /></span>
  <div class="ph__text">
    <span class="ph__title" title={page.title}>{pageDisplayName(page)}</span>
    <span class="sx-badge sx-badge--mono ph__path">{page.path}</span>
  </div>
  <span class="ph__kicker">Page</span>
</header>

<div class="sx-panel__body">
  <PanelSection id="page-general" title="Page">
    <Field label="Title" for="{uid}-title">
      <input
        id="{uid}-title"
        class={['sx-input', titleError && 'is-invalid']}
        aria-invalid={titleError ? 'true' : undefined}
        value={titleDraft ?? page.title}
        oninput={(e) => (titleDraft = e.currentTarget.value)}
        onchange={(e) => commitTitle(e.currentTarget.value)}
      />
    </Field>
    {#if titleError}<InlineMessage message={titleError} indent />{/if}

    <Field label="Route" for="{uid}-path">
      <input
        id="{uid}-path"
        class={['sx-input', 'sx-input--mono', pathError && 'is-invalid']}
        aria-invalid={pathError ? 'true' : undefined}
        spellcheck="false"
        value={pathDraft ?? page.path}
        oninput={(e) => {
          pathDraft = e.currentTarget.value;
          pathError = '';
        }}
        onchange={(e) => commitPath(e.currentTarget.value)}
      />
    </Field>
    {#if pathError}
      <InlineMessage message={pathError} indent />
    {:else if pathPreview}
      <InlineMessage tone="info" message="Will be saved as {pathPreview}" indent />
    {/if}

    <Field label="Layout" for="{uid}-layout" help="Shared header and footer wrapped around this page.">
      <select
        id="{uid}-layout"
        class="sx-select"
        value={page.layoutId ?? ''}
        onchange={(e) => meta({ layoutId: e.currentTarget.value || undefined })}
      >
        <option value="">None (standalone)</option>
        {#each editor.blueprint.layouts as layout (layout.id)}
          <option value={layout.id}>{layout.name}</option>
        {/each}
      </select>
    </Field>
  </PanelSection>

  <PanelSection id="page-seo" title="Search & social">
    <Field label="SEO title" layout="stack" for="{uid}-seo-title">
      {#snippet adornment()}
        <span class={['ph__count', effectiveTitle.length > TITLE_MAX && 'ph__count--over']}>{effectiveTitle.length} / {TITLE_MAX}</span>
      {/snippet}
      <input
        id="{uid}-seo-title"
        class="sx-input"
        placeholder={page.title}
        value={seoTitle}
        oninput={(e) => (seoTitleDraft = e.currentTarget.value)}
        onchange={commitSeoTitle}
      />
    </Field>
    {#if effectiveTitle.length > TITLE_MAX}
      <InlineMessage tone="warning" message="Search engines usually cut titles after about {TITLE_MAX} characters." />
    {/if}

    <Field label="Meta description" layout="stack" for="{uid}-desc">
      {#snippet adornment()}
        <span class={['ph__count', (description.length > DESC_MAX || (description.length > 0 && description.length < DESC_MIN)) && 'ph__count--over']}>
          {description.length} / {DESC_MAX}
        </span>
      {/snippet}
      <div class="ph__area" onfocusout={commitDescription}>
        <AutoTextarea id="{uid}-desc" value={description} placeholder="Summarize the page in one or two sentences." oninput={(v) => (descDraft = v)} />
      </div>
    </Field>
    {#if description.length > DESC_MAX}
      <InlineMessage tone="warning" message="Longer than {DESC_MAX} characters — search results will truncate it." />
    {:else if description.length > 0 && description.length < DESC_MIN}
      <InlineMessage tone="warning" message="Aim for at least {DESC_MIN} characters so search engines use it." />
    {/if}

    <Field label="Social image" layout="stack" help="Stored as the page’s Open Graph image (1200×630 recommended).">
      <AssetPicker value={seo.ogImage ?? ''} label="Social image" onchange={(v) => meta({ seo: { ...seo, ogImage: v || undefined } })} />
    </Field>

    <div class="serp" aria-label="Search result preview">
      <span class="serp__label">Search preview</span>
      <span class="serp__url">{page.path}</span>
      <span class="serp__title">{effectiveTitle}</span>
      <span class={['serp__desc', !description && 'serp__desc--empty']}>{description || 'No meta description — search engines will pick text from the page.'}</span>
    </div>
  </PanelSection>

  <PanelSection
    id="page-notes"
    title="Notes for developer"
    modified={Boolean(editor.blueprint.notes?.[`page:${page.id}`]?.trim() || editor.blueprint.notes?.project?.trim())}
  >
    <NoteField
      noteKey="page:{page.id}"
      label="Page notes"
      placeholder="Purpose of this page, data it loads, auth rules, edge cases… Included in the build spec."
    />
    <NoteField
      noteKey="project"
      label="Project notes"
      placeholder="Conventions, integrations, environments, anything every page should follow… Included in the build spec."
    />
  </PanelSection>

  <PanelSection id="page-sections" title="Sections on this page">
    {#snippet actions()}
      <span class="sx-badge ph__badge">{sections.length}</span>
    {/snippet}
    {#if sections.length > 0}
      <ul class="secs">
        {#each sections as section (section.id)}
          <li>
            <button
              type="button"
              class={['secs__row', editor.hoverNodeId === section.id && 'secs__row--hover']}
              onclick={() => editor.selectNode(section.id)}
              onpointerenter={() => editor.hoverNode(section.id)}
              onpointerleave={() => editor.hoverNode(null)}
              onfocus={() => editor.hoverNode(section.id)}
              onblur={() => editor.hoverNode(null)}
            >
              <span class="secs__icon"><NodeIcon componentType={section.componentType} size={14} /></span>
              <span class="secs__text">
                <span class="secs__name">{section.name}</span>
                <span class="secs__type">{section.componentType.split('/')[1] ?? section.componentType}</span>
              </span>
              {#if section.hidden}<EyeSlashIcon size={13} aria-label="Hidden" />{/if}
              {#if section.locked}<LockSimpleIcon size={13} aria-label="Locked" />{/if}
              <span class="secs__go"><CaretRightIcon size={12} /></span>
            </button>
          </li>
        {/each}
      </ul>
    {:else}
      <div class="sx-empty">
        <span class="sx-empty__icon"><StackIcon size={18} /></span>
        <span class="sx-empty__title">This page is empty</span>
        <span class="sx-help">Add sections from the element library.</span>
      </div>
    {/if}
  </PanelSection>
</div>

<style>
  .ph {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 52px;
    padding: 0 14px;
    border-bottom: 1px solid var(--sx-border);
    flex-shrink: 0;
  }
  .ph__tile {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text-2);
    background: var(--sx-hover);
    flex-shrink: 0;
  }
  .ph__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .ph__title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: -0.005em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ph__path {
    align-self: flex-start;
    height: 16px;
    padding: 0 5px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--sx-text-3);
  }
  .ph__kicker {
    font-size: var(--sx-text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--sx-text-3);
  }
  .ph__count {
    margin-left: auto;
    font-size: var(--sx-text-xs);
    font-variant-numeric: tabular-nums;
    color: var(--sx-text-3);
  }
  .ph__count--over {
    color: var(--sx-warning);
  }
  .ph__area {
    width: 100%;
  }
  .ph__badge {
    font-variant-numeric: tabular-nums;
  }
  .serp {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
  }
  .serp__label {
    margin-bottom: 4px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--sx-text-3);
  }
  .serp__url {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
  }
  .serp__title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
    color: var(--sx-accent-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .serp__desc {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: var(--sx-text-sm);
    line-height: 1.45;
    color: var(--sx-text-2);
  }
  .serp__desc--empty {
    color: var(--sx-text-3);
    font-style: italic;
  }
  .secs {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 -6px;
  }
  .secs__row {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 40px;
    padding: 0 6px;
    border-radius: var(--sx-radius-sm);
    text-align: left;
    color: var(--sx-text-3);
  }
  .secs__row:hover,
  .secs__row--hover {
    background: var(--sx-hover);
  }
  .secs__icon {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-2);
    background: var(--sx-subtle);
    box-shadow: inset 0 0 0 1px var(--sx-border);
    flex-shrink: 0;
  }
  .secs__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .secs__name {
    font-size: var(--sx-text-md);
    font-weight: 500;
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .secs__type {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .secs__go {
    display: grid;
    place-items: center;
    opacity: 0;
  }
  .secs__row:hover .secs__go,
  .secs__row:focus-visible .secs__go {
    opacity: 1;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
</style>
