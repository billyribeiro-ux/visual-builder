<script lang="ts">
  import Dialog from './ui/Dialog.svelte';
  import { editor } from '../state/editor.svelte.js';
  import {
    generateBuildSpec,
    createDeterministicZip,
    STACK_PRESETS,
    type StackId,
    type StylingId,
    type BuildSpecResult
  } from '@app-viz/codegen';
  import type { ProjectBlueprint } from '@app-viz/schema';

  const PREFS_KEY = 'app-viz-export-prefs-v1';
  const STACK_ORDER: StackId[] = ['nextjs', 'sveltekit', 'nuxt', 'astro', 'react-router', 'html', 'custom'];
  const STYLING_LABELS: Record<StylingId, string> = {
    tailwind: 'Tailwind CSS v4',
    'css-variables': 'CSS custom properties',
    'css-modules': 'CSS Modules'
  };

  interface Prefs {
    stack: StackId;
    styling: StylingId | '';
    extra: string;
    custom: string;
    scope: 'project' | 'page';
  }

  function loadPrefs(): Prefs {
    const fallback: Prefs = { stack: 'nextjs', styling: '', extra: '', custom: '', scope: 'project' };
    try {
      const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null');
      if (parsed && STACK_ORDER.includes(parsed.stack)) return { ...fallback, ...parsed };
    } catch {
      // ignore malformed prefs
    }
    return fallback;
  }

  const initial = loadPrefs();
  let stack = $state<StackId>(initial.stack);
  let styling = $state<StylingId | ''>(initial.styling);
  let extra = $state(initial.extra);
  let custom = $state(initial.custom);
  let scope = $state<'project' | 'page'>(initial.scope);
  let previewFile = $state('CLAUDE.md');
  let busy = $state(false);
  let copied = $state(false);

  const preset = $derived(STACK_PRESETS[stack]);
  const effectiveStyling = $derived<StylingId>(
    styling && preset.supportedStyling.includes(styling) ? styling : preset.defaultStyling
  );

  const result = $derived.by<{ ok: true; spec: BuildSpecResult } | { ok: false; error: string }>(() => {
    if (!editor.showExportDialog) return { ok: false, error: '' };
    try {
      const spec = generateBuildSpec($state.snapshot(editor.blueprint) as ProjectBlueprint, {
        stack,
        styling: effectiveStyling,
        customStackDescription: custom,
        extraInstructions: extra,
        scope: scope === 'page' && editor.activePage ? { type: 'page', pageId: editor.activePage.id } : { type: 'project' }
      });
      return { ok: true, spec };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

  const fileList = $derived(result.ok ? Object.keys(result.spec.files).sort((a, b) => (a === 'CLAUDE.md' ? -1 : b === 'CLAUDE.md' ? 1 : a.localeCompare(b))) : []);
  const previewText = $derived(result.ok ? (result.spec.files[previewFile] ?? result.spec.files['CLAUDE.md']) : '');
  const needsCustom = $derived(stack === 'custom' && !custom.trim());

  $effect(() => {
    const prefs: Prefs = { stack, styling, extra, custom, scope };
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // non-critical
    }
  });

  function fileBase(): string {
    const page = scope === 'page' && editor.activePage ? `-${editor.activePage.slug || 'page'}` : '';
    return `${editor.blueprint.meta.slug}${page}-${stack}-build-spec`;
  }

  function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function downloadZip() {
    if (!result.ok || needsCustom) return;
    busy = true;
    try {
      await editor.flushSave();
      const files = { ...result.spec.files, '.nvmrc': '26.13.0\n', '.node-version': '26.13.0\n' };
      const bytes = await createDeterministicZip({ files });
      download(new Blob([bytes as BlobPart], { type: 'application/zip' }), `${fileBase()}.zip`);
      editor.notify('success', 'Build spec downloaded. Unzip it into an empty folder and run `claude` there.');
    } catch (e) {
      editor.notify('error', `Export failed: ${(e as Error).message}`);
    } finally {
      busy = false;
    }
  }

  function downloadPrompt() {
    if (!result.ok || needsCustom) return;
    download(new Blob([result.spec.prompt], { type: 'text/markdown' }), `${fileBase()}.md`);
  }

  async function copyPrompt() {
    if (!result.ok || needsCustom) return;
    try {
      await navigator.clipboard.writeText(result.spec.prompt);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      editor.notify('error', 'Clipboard access was blocked. Use “Download prompt (.md)” instead.');
    }
  }

  async function downloadSvelteKit() {
    busy = true;
    try {
      await editor.exportHandoffPackage();
    } finally {
      busy = false;
    }
  }
</script>

<Dialog
  open={editor.showExportDialog}
  title="Export for Claude Code"
  description="Generate a precise, stack-agnostic build spec from your saved layout. Claude Code reads CLAUDE.md and builds it in the stack you choose."
  size="xl"
  onclose={() => (editor.showExportDialog = false)}
>
  <div class="xp">
    <section class="xp__config" aria-label="Export options">
      <fieldset class="xp__group">
        <legend class="xp__label">1. Target stack</legend>
        <div class="xp__stacks">
          {#each STACK_ORDER as id (id)}
            {@const p = STACK_PRESETS[id]}
            <label class="xp__stack {stack === id ? 'xp__stack--active' : ''}">
              <input type="radio" name="stack" value={id} bind:group={stack} />
              <span class="xp__stack-name">{p.label}</span>
              <span class="xp__stack-tag">{p.tagline}</span>
            </label>
          {/each}
        </div>
      </fieldset>

      {#if stack === 'custom'}
        <label class="xp__group">
          <span class="xp__label">Describe your stack <span class="xp__req">required</span></span>
          <input class="studio-input" bind:value={custom} placeholder="e.g. Hono SSR + htmx + UnoCSS, deployed to Cloudflare Workers" />
        </label>
      {/if}

      <div class="xp__row">
        <label class="xp__group">
          <span class="xp__label">2. Styling</span>
          <select class="studio-select" bind:value={styling}>
            <option value="">Stack default ({STYLING_LABELS[preset.defaultStyling]})</option>
            {#each preset.supportedStyling as s (s)}
              <option value={s}>{STYLING_LABELS[s]}</option>
            {/each}
          </select>
        </label>
        <fieldset class="xp__group">
          <legend class="xp__label">3. Scope</legend>
          <div class="xp__seg" role="radiogroup">
            <label class={scope === 'project' ? 'on' : ''}>
              <input type="radio" name="scope" value="project" bind:group={scope} />Whole project ({editor.blueprint.pages.length} pages)
            </label>
            <label class={scope === 'page' ? 'on' : ''}>
              <input type="radio" name="scope" value="page" bind:group={scope} />Current page ({editor.activePage?.path})
            </label>
          </div>
        </fieldset>
      </div>

      <label class="xp__group">
        <span class="xp__label">4. Extra requirements for Claude <span class="xp__opt">optional</span></span>
        <textarea
          class="studio-textarea"
          rows="4"
          bind:value={extra}
          placeholder={'e.g.\n- Use shadcn/ui for primitives\n- Drizzle ORM + Postgres for the dashboard data\n- Deploy target: Vercel'}
        ></textarea>
      </label>

      {#if result.ok}
        <dl class="xp__stats">
          <div><dt>Pages</dt><dd>{result.spec.stats.pages}</dd></div>
          <div><dt>Elements</dt><dd>{result.spec.stats.sections}</dd></div>
          <div><dt>Components</dt><dd>{result.spec.stats.components}</dd></div>
          <div><dt>Interactions</dt><dd>{result.spec.stats.interactions}</dd></div>
        </dl>
        {#if result.spec.stats.hiddenOmitted}
          <p class="xp__note">{result.spec.stats.hiddenOmitted} hidden element(s) are intentionally left out of the spec.</p>
        {/if}
      {:else if result.error}
        <p class="xp__error" role="alert">{result.error}</p>
      {/if}

      <div class="xp__howto">
        <strong>How to use with Claude Code</strong>
        <ol>
          <li>Download the ZIP and unzip it into an empty folder.</li>
          <li>Run <code>claude</code> in that folder.</li>
          <li>Say: <em>“Read CLAUDE.md and build the project.”</em></li>
        </ol>
        <span>Or paste the single-file prompt into any coding agent.</span>
      </div>
    </section>

    <section class="xp__preview" aria-label="Spec preview">
      <div class="xp__preview-head">
        <label class="xp__label" for="xp-file">Preview</label>
        <select id="xp-file" class="studio-select" bind:value={previewFile}>
          {#each fileList as f (f)}<option value={f}>{f}</option>{/each}
        </select>
      </div>
      <pre class="xp__code" aria-label="Preview of {previewFile}">{previewText}</pre>
    </section>
  </div>

  {#snippet footer()}
    <button type="button" class="studio-btn" onclick={downloadSvelteKit} disabled={busy} title="Runnable SvelteKit reference implementation">
      SvelteKit reference app (.zip)
    </button>
    <span class="xp__spacer"></span>
    <button type="button" class="studio-btn" onclick={downloadPrompt} disabled={!result.ok || needsCustom}>Download prompt (.md)</button>
    <button type="button" class="studio-btn" onclick={copyPrompt} disabled={!result.ok || needsCustom}>
      {copied ? '✓ Copied' : 'Copy single-file prompt'}
    </button>
    <button type="button" class="studio-btn studio-btn--primary" data-autofocus onclick={downloadZip} disabled={!result.ok || needsCustom || busy}>
      {busy ? 'Preparing…' : 'Download build spec (.zip)'}
    </button>
  {/snippet}
</Dialog>

<style>
  .xp {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 1.25rem;
    min-height: 0;
  }
  @media (max-width: 960px) {
    .xp { grid-template-columns: 1fr; }
  }
  .xp__config { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
  .xp__group { display: flex; flex-direction: column; gap: 0.4rem; border: 0; padding: 0; margin: 0; min-width: 0; }
  .xp__label { font-size: 0.75rem; font-weight: 700; color: var(--md-sys-color-on-surface-variant); text-transform: uppercase; letter-spacing: 0.04em; }
  .xp__req, .xp__opt { font-weight: 600; text-transform: none; letter-spacing: 0; margin-left: 0.25rem; }
  .xp__req { color: var(--md-sys-color-error); }
  .xp__opt { color: var(--md-sys-color-outline); }
  .xp__stacks { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 0.5rem; }
  .xp__stack {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: 14px;
    background: var(--md-sys-color-surface-container-low);
    cursor: pointer;
    transition: border-color 120ms ease, background-color 120ms ease;
  }
  .xp__stack:hover { border-color: var(--md-sys-color-primary); }
  .xp__stack:focus-within { outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px; }
  .xp__stack input { position: absolute; opacity: 0; pointer-events: none; }
  .xp__stack--active { border-color: var(--md-sys-color-primary); background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); }
  .xp__stack-name { font-size: 0.8125rem; font-weight: 700; }
  .xp__stack-tag { font-size: 0.6875rem; opacity: 0.8; }
  .xp__row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 0.75rem; }
  .xp__seg { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .xp__seg label {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 0.75rem;
    border-radius: 9999px;
    border: 1px solid var(--md-sys-color-outline-variant);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
  }
  .xp__seg label:focus-within { outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px; }
  .xp__seg label.on { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); border-color: transparent; }
  .xp__seg input { position: absolute; opacity: 0; pointer-events: none; }
  .xp__stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin: 0; }
  .xp__stats div { background: var(--md-sys-color-surface-container); border-radius: 12px; padding: 0.5rem 0.65rem; }
  .xp__stats dt { font-size: 0.6875rem; color: var(--md-sys-color-on-surface-variant); }
  .xp__stats dd { margin: 0; font-size: 1.125rem; font-weight: 700; }
  .xp__note { margin: 0; font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); }
  .xp__error { margin: 0; font-size: 0.8125rem; color: var(--md-sys-color-error); }
  .xp__howto {
    font-size: 0.75rem;
    line-height: 1.5;
    padding: 0.75rem 0.9rem;
    border-radius: 14px;
    background: var(--md-sys-color-surface-container-low);
    border: 1px dashed var(--md-sys-color-outline-variant);
  }
  .xp__howto ol { margin: 0.35rem 0; padding-left: 1.1rem; }
  .xp__howto code { font-family: var(--md-sys-font-mono); background: var(--md-sys-color-surface-container-high); padding: 0 0.3rem; border-radius: 4px; }
  .xp__preview { display: flex; flex-direction: column; gap: 0.5rem; min-width: 0; min-height: 0; }
  .xp__preview-head { display: flex; align-items: center; gap: 0.5rem; }
  .xp__preview-head .studio-select { flex: 1; }
  .xp__code {
    flex: 1;
    min-height: 420px;
    max-height: 56vh;
    margin: 0;
    overflow: auto;
    padding: 0.9rem 1rem;
    border-radius: 14px;
    background: var(--md-sys-color-surface-container);
    border: 1px solid var(--md-sys-color-outline-variant);
    font-family: var(--md-sys-font-mono);
    font-size: 0.72rem;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .xp__spacer { flex: 1; }
</style>
