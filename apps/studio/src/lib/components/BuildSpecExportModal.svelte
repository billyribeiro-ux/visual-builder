<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity';
  import { editor } from '#lib/state/editor.svelte.js';
  import { pageDisplayName } from '#lib/state/page-name.js';
  import { generateBuildSpec, createDeterministicZip, STACK_PRESETS, type StackId, type StylingId, type BuildSpecResult } from '@app-viz/codegen';
  import type { BlueprintNode, ProjectBlueprint } from '@app-viz/schema';
  import Dialog from './ui/Dialog.svelte';
  import Segmented from '#lib/ui/Segmented.svelte';
  import { tooltip } from '#lib/ui/tooltip.js';
  import CodeBlock from './dialogs/CodeBlock.svelte';
  import StackGlyph from './dialogs/StackGlyph.svelte';
  import { langFromFilename } from './dialogs/highlight.js';
  import { formatBytes, pluralize } from './dialogs/format.js';
  import ExportIcon from 'phosphor-svelte/lib/ExportIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import FileMdIcon from 'phosphor-svelte/lib/FileMdIcon';
  import FileCssIcon from 'phosphor-svelte/lib/FileCssIcon';
  import BracketsCurlyIcon from 'phosphor-svelte/lib/BracketsCurlyIcon';
  import FolderSimpleIcon from 'phosphor-svelte/lib/FolderSimpleIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';
  import TerminalWindowIcon from 'phosphor-svelte/lib/TerminalWindowIcon';

  /** v2: the SvelteKit + Rust preset became the default; older stored choices start fresh once. */
  const PREFS_KEY = 'app-viz-export-prefs-v2';
  const DEFAULT_STACK: StackId = 'sveltekit-rust';
  const STACK_ORDER: StackId[] = ['sveltekit-rust', 'sveltekit', 'nextjs', 'nuxt', 'astro', 'react-router', 'html', 'custom'];
  const STACK_NAMES: Record<StackId, string> = {
    'sveltekit-rust': 'SvelteKit + Rust',
    nextjs: 'Next.js',
    sveltekit: 'SvelteKit',
    nuxt: 'Nuxt',
    astro: 'Astro',
    'react-router': 'React Router',
    html: 'HTML + CSS',
    custom: 'Custom stack'
  };
  const STYLING_LABELS: Record<StylingId, string> = {
    tailwind: 'Tailwind CSS v4',
    'css-variables': 'CSS custom properties',
    'css-modules': 'CSS Modules'
  };
  const NODE_FILES = { '.nvmrc': '26.13.0\n', '.node-version': '26.13.0\n' };

  interface Prefs {
    stack: StackId;
    styling: StylingId | '';
    extra: string;
    custom: string;
    scope: 'project' | 'page';
  }

  interface TreeNode {
    name: string;
    path: string;
    size?: number;
    children?: TreeNode[];
  }

  function loadPrefs(): Prefs {
    const fallback: Prefs = { stack: DEFAULT_STACK, styling: '', extra: '', custom: '', scope: 'project' };
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PREFS_KEY);
    } catch {
      return fallback; // storage blocked (private mode); defaults are correct behaviour
    }
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw) as Partial<Prefs>;
      return parsed && parsed.stack && STACK_ORDER.includes(parsed.stack) ? { ...fallback, ...parsed } : fallback;
    } catch {
      return fallback; // malformed prefs from an older build are ignored and overwritten
    }
  }

  const uid = $props.id();
  const initial = loadPrefs();
  let stack = $state<StackId>(initial.stack);
  let styling = $state<StylingId | ''>(initial.styling);
  let extra = $state(initial.extra);
  let custom = $state(initial.custom);
  let scope = $state<'project' | 'page'>(initial.scope);
  let previewFile = $state('CLAUDE.md');
  let busy = $state<null | 'zip' | 'app'>(null);
  let copied = $state(false);
  let prefsWarned = false;
  const collapsed = new SvelteSet<string>();

  const open = $derived(editor.showExportDialog);
  const preset = $derived(STACK_PRESETS[stack]);
  const effectiveStyling = $derived<StylingId>(styling && preset.supportedStyling.includes(styling) ? styling : preset.defaultStyling);
  const needsCustom = $derived(stack === 'custom' && !custom.trim());

  const result = $derived.by<{ ok: true; spec: BuildSpecResult } | { ok: false; error: string }>(() => {
    if (!open) return { ok: false, error: '' };
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
      return { ok: false, error: (e as Error).message || 'The build spec could not be generated.' };
    }
  });

  const files = $derived<Record<string, string>>(result.ok ? { ...result.spec.files, ...NODE_FILES } : {});
  const sizes = $derived.by(() => {
    const enc = new TextEncoder();
    return Object.fromEntries(Object.entries(files).map(([p, c]) => [p, enc.encode(c).length])) as Record<string, number>;
  });
  const totalSize = $derived(Object.values(sizes).reduce((a, b) => a + b, 0));
  const tree = $derived(buildTree(Object.keys(files)));
  const activeFile = $derived(files[previewFile] !== undefined ? previewFile : 'CLAUDE.md');
  const previewText = $derived(files[activeFile] ?? '');
  const canExport = $derived(result.ok && !needsCustom);

  /** Non-empty notes (`project`, `page:<id>`, `node:<id>`) that fall inside the export scope. */
  const noteCount = $derived.by(() => {
    if (!open) return 0;
    const bp = editor.blueprint;
    const notes = bp.notes ?? {};
    const pages = scope === 'page' && editor.activePage ? [editor.activePage] : bp.pages;
    const layoutIds = pages.map((p) => p.layoutId).filter(Boolean);
    const nodeIds: Record<string, true> = {};
    const walk = (n: BlueprintNode) => {
      nodeIds[n.id] = true;
      for (const c of n.children ?? []) walk(c);
    };
    for (const p of pages) walk(p.rootNode);
    for (const l of bp.layouts) if (layoutIds.includes(l.id)) walk(l.rootNode);
    const pageIds = pages.map((p) => p.id);
    return Object.entries(notes).filter(([key, text]) => {
      if (!text?.trim()) return false;
      if (key === 'project') return true;
      if (key.startsWith('page:')) return pageIds.includes(key.slice(5));
      if (key.startsWith('node:')) return nodeIds[key.slice(5)] === true;
      return false;
    }).length;
  });

  /** Remembers the options for next time. Called from the option controls' input/change events. */
  function persist() {
    queueMicrotask(() => {
      const prefs: Prefs = { stack, styling, extra, custom, scope };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch (e) {
        if (!prefsWarned) {
          prefsWarned = true;
          editor.notify('warning', `Export settings will not be remembered (${(e as Error).message}).`);
        }
      }
    });
  }

  function buildTree(paths: string[]): TreeNode[] {
    const root: TreeNode = { name: '', path: '', children: [] };
    for (const path of paths) {
      const parts = path.split('/');
      let node = root;
      parts.forEach((part, i) => {
        const sub = parts.slice(0, i + 1).join('/');
        let child = node.children?.find((c) => c.name === part);
        if (!child) {
          child = i === parts.length - 1 ? { name: part, path: sub } : { name: part, path: sub, children: [] };
          node.children?.push(child);
        }
        node = child;
      });
    }
    const sort = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .sort((a, b) => {
          if (a.name === 'CLAUDE.md') return -1;
          if (b.name === 'CLAUDE.md') return 1;
          if (Boolean(a.children) !== Boolean(b.children)) return a.children ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map((n) => (n.children ? { ...n, children: sort(n.children) } : n));
    return sort(root.children ?? []);
  }

  function fileIcon(name: string) {
    if (name.endsWith('.md')) return FileMdIcon;
    if (name.endsWith('.css')) return FileCssIcon;
    if (name.endsWith('.json')) return BracketsCurlyIcon;
    return FileIcon;
  }

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
    if (!result.ok || needsCustom || busy) return;
    busy = 'zip';
    try {
      await editor.flushSave();
      // Uploaded images travel as binary files under spec/static/.
      const bytes = await createDeterministicZip({ files, binaryFiles: result.ok ? result.spec.binaryFiles : undefined });
      download(new Blob([bytes as BlobPart], { type: 'application/zip' }), `${fileBase()}.zip`);
      editor.notify('success', 'Build spec downloaded. Unzip it into an empty folder and run `claude` there.');
    } catch (e) {
      editor.notify('error', `Export failed: ${(e as Error).message}`);
    } finally {
      busy = null;
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
      setTimeout(() => (copied = false), 1800);
    } catch (e) {
      editor.notify('error', `Clipboard access was blocked (${(e as Error).message}). Use “Download prompt” instead.`);
    }
  }

  async function downloadSvelteKit() {
    if (busy) return;
    busy = 'app';
    try {
      await editor.exportHandoffPackage();
      editor.notify('success', 'SvelteKit app downloaded.');
    } catch (e) {
      editor.notify('error', `SvelteKit export failed: ${(e as Error).message}`);
    } finally {
      busy = null;
    }
  }

  function onStackKeydown(event: KeyboardEvent) {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const idx = STACK_ORDER.indexOf(stack);
    const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    stack = STACK_ORDER[(idx + step + STACK_ORDER.length) % STACK_ORDER.length];
    persist();
    (event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-stack="${stack}"]`)?.focus();
  }
</script>

{#snippet treeNodes(nodes: TreeNode[], depth: number)}
  {#each nodes as node (node.path)}
    {#if node.children}
      <li>
        <button
          type="button"
          class="tree__row tree__row--dir"
          style:--depth={depth}
          aria-expanded={!collapsed.has(node.path)}
          onclick={() => (collapsed.has(node.path) ? collapsed.delete(node.path) : collapsed.add(node.path))}
        >
          <span class={['caret', !collapsed.has(node.path) && 'caret--open']}><CaretRightIcon size={9} weight="bold" /></span>
          <FolderSimpleIcon size={14} />
          <span class="tree__name">{node.name}</span>
        </button>
        {#if !collapsed.has(node.path)}
          <ul>{@render treeNodes(node.children, depth + 1)}</ul>
        {/if}
      </li>
    {:else}
      {@const Icon = fileIcon(node.name)}
      <li>
        <button
          type="button"
          class={['tree__row', activeFile === node.path && 'tree__row--on']}
          style:--depth={depth}
          aria-current={activeFile === node.path ? 'true' : undefined}
          onclick={() => (previewFile = node.path)}
        >
          <span class="caret" aria-hidden="true"></span>
          <Icon size={14} />
          <span class="tree__name">{node.name}</span>
          <span class="tree__size">{formatBytes(sizes[node.path])}</span>
        </button>
      </li>
    {/if}
  {/each}
{/snippet}

<Dialog
  {open}
  title="Export"
  subtitle="Generate a precise build spec for Claude Code in the stack you choose, or download the SvelteKit app."
  size="full"
  height="min(820px, calc(100vh - 48px))"
  icon={ExportIcon}
  flush
  onclose={() => (editor.showExportDialog = false)}
>
  <div class="xp">
    <section class="xp__config" aria-label="Export options" oninput={persist} onchange={persist}>
      <div class="sx-section-label xp__label" id="{uid}-stack">Target stack</div>
      <div class="stacks" role="radiogroup" aria-labelledby="{uid}-stack" tabindex="-1" onkeydown={onStackKeydown}>
        {#each STACK_ORDER as id (id)}
          {@const p = STACK_PRESETS[id]}
          {@const on = stack === id}
          <button
            type="button"
            role="radio"
            aria-checked={on}
            tabindex={on ? 0 : -1}
            data-stack={id}
            class={['stack', on && 'stack--on']}
            onclick={() => {
              stack = id;
              persist();
            }}
            {@attach tooltip(p.label)}
          >
            <StackGlyph {id} size={30} />
            <span class="stack__text">
              <span class="stack__name">{STACK_NAMES[id]}</span>
              <span class="stack__tag">{p.tagline}</span>
            </span>
          </button>
        {/each}
      </div>

      {#if stack === 'custom'}
        <div class="field">
          <label class="sx-label" for="{uid}-custom">Describe your stack <span class="req">Required</span></label>
          <input id="{uid}-custom" class="sx-input" bind:value={custom} placeholder="e.g. Hono SSR + htmx + UnoCSS on Cloudflare Workers" />
        </div>
      {/if}

      <div class="field">
        <label class="sx-label" for="{uid}-styling">Styling</label>
        <select id="{uid}-styling" class="sx-select" bind:value={styling}>
          <option value="">{STYLING_LABELS[preset.defaultStyling]} (stack default)</option>
          {#each preset.supportedStyling as s (s)}
            <option value={s}>{STYLING_LABELS[s]}</option>
          {/each}
        </select>
      </div>

      <div class="field">
        <span class="sx-label">Scope</span>
        <Segmented
          block
          ariaLabel="Export scope"
          value={scope}
          onchange={(v) => {
            scope = v;
            persist();
          }}
          options={[
            { value: 'project', label: 'Whole project' },
            { value: 'page', label: 'Current page' }
          ]}
        />
        <p class="sx-help">
          {#if scope === 'page' && editor.activePage}
            {pageDisplayName(editor.activePage)} (<code class="inline-code">{editor.activePage.path}</code>) and its shared layout.
          {:else}
            All {pluralize(editor.blueprint.pages.length, 'page')} and {pluralize(editor.blueprint.layouts.length, 'shared layout')}.
          {/if}
        </p>
      </div>

      <div class="field">
        <label class="sx-label" for="{uid}-extra">Additional instructions <span class="opt">Optional</span></label>
        <textarea
          id="{uid}-extra"
          class="sx-textarea"
          rows="4"
          bind:value={extra}
          placeholder="e.g.&#10;- Use shadcn/ui for primitives&#10;- Drizzle ORM + Postgres for dashboard data&#10;- Deploy to Vercel"
        ></textarea>
      </div>

      <div class="howto">
        <div class="howto__head"><TerminalWindowIcon size={15} /> Use with Claude Code</div>
        <ol>
          <li>Download the .zip and unzip it into an empty folder.</li>
          <li>Run <code>claude</code> in that folder.</li>
          <li>Say “Read CLAUDE.md and build the project.”</li>
        </ol>
        <p>Or copy the single-file prompt into any coding agent.</p>
      </div>
    </section>

    <section class="xp__out" aria-label="Output">
      {#if result.ok}
        <div class="stats">
          <div class="stat"><span class="stat__num">{result.spec.stats.pages}</span><span class="stat__label">Pages</span></div>
          <div class="stat"><span class="stat__num">{result.spec.stats.sections}</span><span class="stat__label">Sections</span></div>
          <div class="stat"><span class="stat__num">{result.spec.stats.components}</span><span class="stat__label">Components</span></div>
          <div class="stat"><span class="stat__num">{result.spec.stats.interactions}</span><span class="stat__label">Interactions</span></div>
          <div class="stat" {@attach tooltip('Project, page and element notes included in the spec')}>
            <span class="stat__num">{noteCount}</span><span class="stat__label">Notes</span>
          </div>
        </div>
        {#if result.spec.stats.hiddenOmitted}
          <p class="note">{pluralize(result.spec.stats.hiddenOmitted, 'hidden element')} {result.spec.stats.hiddenOmitted === 1 ? 'is' : 'are'} intentionally left out of the spec.</p>
        {/if}

        <div class="files">
          <div class="files__tree">
            <div class="files__head">
              <span>Files</span>
              <span class="files__meta">{Object.keys(files).length} · {formatBytes(totalSize)}</span>
            </div>
            <ul class="tree" aria-label="Files in the build spec">
              {@render treeNodes(tree, 0)}
            </ul>
          </div>
          <div class="files__preview">
            <div class="files__head files__head--preview">
              <span class="files__path">{activeFile}</span>
              <span class="files__meta">{formatBytes(sizes[activeFile])}</span>
            </div>
            <div class="files__code">
              <CodeBlock code={previewText} lang={langFromFilename(activeFile)} label="Preview of {activeFile}" />
            </div>
          </div>
        </div>
      {:else if result.error}
        <div class="sx-empty xp__error" role="alert">
          <span class="sx-empty__icon"><WarningCircleIcon size={20} /></span>
          <span class="sx-empty__title">The build spec could not be generated</span>
          <code class="xp__error-msg">{result.error}</code>
        </div>
      {/if}
    </section>
  </div>

  {#snippet footer()}
    <button type="button" class="sx-btn" onclick={downloadSvelteKit} disabled={busy !== null} {@attach tooltip('Runnable SvelteKit reference implementation')}>
      <StackGlyph id="sveltekit-app" size={18} />
      {busy === 'app' ? 'Preparing…' : 'SvelteKit app (.zip)'}
    </button>
    <button type="button" class="sx-btn" onclick={() => editor.downloadBlueprintJson()} {@attach tooltip('Portable project file (.appviz.json)')}>
      <StackGlyph id="json" size={18} />
      Blueprint JSON
    </button>
    <span class="xp__spacer"></span>
    {#if needsCustom}<span class="xp__hint">Describe your stack to export.</span>{/if}
    <button type="button" class="sx-btn" onclick={downloadPrompt} disabled={!canExport}>Download prompt (.md)</button>
    <button type="button" class="sx-btn xp__copy" onclick={copyPrompt} disabled={!canExport} aria-live="polite">
      {#if copied}<CheckIcon size={14} weight="bold" /> Copied{:else}<CopyIcon size={14} /> Copy prompt{/if}
    </button>
    <button type="button" class="sx-btn sx-btn--primary" data-autofocus onclick={downloadZip} disabled={!canExport || busy !== null}>
      <DownloadSimpleIcon size={14} weight="bold" />
      {busy === 'zip' ? 'Preparing…' : 'Download .zip'}
    </button>
  {/snippet}
</Dialog>

<style>
  .xp {
    display: grid;
    grid-template-columns: 404px minmax(0, 1fr);
    flex: 1;
    min-height: 0;
  }
  .xp__config {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 20px 20px;
    border-right: 1px solid var(--sx-border);
  }
  .xp__label {
    padding: 12px 0 0;
    margin-bottom: -8px;
  }
  .stacks {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    outline: none;
  }
  .stack {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 0;
    padding: 8px 10px 8px 8px;
    text-align: left;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease),
      background-color var(--sx-dur) var(--sx-ease);
  }
  .stack:hover {
    border-color: var(--sx-border-strong);
  }
  .stack--on,
  .stack--on:hover {
    border-color: var(--sx-accent);
    box-shadow: 0 0 0 1px var(--sx-accent);
    background: var(--sx-accent-soft);
  }
  .stack--on :global(.glyph) {
    color: var(--sx-accent-text);
    border-color: color-mix(in srgb, var(--sx-accent) 35%, var(--sx-border));
  }
  .stack__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  .stack__name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .stack__tag {
    font-size: var(--sx-text-xs);
    line-height: 1.35;
    color: var(--sx-text-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: calc(2 * 1.35em);
  }
  .inline-code {
    font-family: var(--sx-font-mono);
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .req,
  .opt {
    margin-left: 4px;
    font-weight: 500;
    font-size: var(--sx-text-xs);
  }
  .req {
    color: var(--sx-danger);
  }
  .opt {
    color: var(--sx-text-3);
  }
  .howto {
    padding: 12px 14px;
    font-size: var(--sx-text-sm);
    line-height: 1.55;
    color: var(--sx-text-2);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
  }
  .howto__head {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-weight: 600;
    color: var(--sx-text);
  }
  .howto ol {
    padding-left: 18px;
    list-style: decimal;
  }
  .howto code {
    padding: 0 4px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    border-radius: 3px;
  }
  .howto p {
    margin-top: 6px;
    color: var(--sx-text-3);
  }
  .xp__out {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
    min-width: 0;
    padding: 16px 20px 20px;
    background: var(--sx-subtle);
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
  }
  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 10px 12px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
  }
  .stat__num {
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }
  .stat__label {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .note {
    margin-top: -4px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .files {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    flex: 1;
    min-height: 0;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
    overflow: hidden;
  }
  .files__tree {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-right: 1px solid var(--sx-border);
  }
  .files__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-shrink: 0;
    height: 36px;
    padding: 0 12px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
    border-bottom: 1px solid var(--sx-border);
  }
  .files__head--preview {
    text-transform: none;
    letter-spacing: 0;
  }
  .files__path {
    min-width: 0;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .files__meta {
    font-size: var(--sx-text-xs);
    font-weight: 500;
    color: var(--sx-text-3);
    text-transform: none;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .tree {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 6px;
  }
  .tree__row {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    height: 26px;
    padding: 0 6px 0 calc(4px + var(--depth) * 14px);
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    text-align: left;
    border-radius: var(--sx-radius-xs);
  }
  .tree__row:hover {
    background: var(--sx-hover);
    color: var(--sx-text);
  }
  .tree__row--on,
  .tree__row--on:hover {
    background: var(--sx-accent-soft);
    color: var(--sx-accent-text);
  }
  .tree__row--dir {
    color: var(--sx-text);
    font-weight: 500;
  }
  .tree__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tree__size {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
  }
  .caret {
    display: grid;
    place-items: center;
    width: 10px;
    flex-shrink: 0;
    color: var(--sx-text-3);
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .caret--open {
    transform: rotate(90deg);
  }
  .files__preview {
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
  }
  .files__code {
    flex: 1;
    min-height: 0;
  }
  .xp__error {
    flex: 1;
    justify-content: center;
  }
  .xp__error-msg {
    max-width: 520px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    color: var(--sx-danger);
    white-space: pre-wrap;
  }
  .xp__spacer {
    flex: 1;
  }
  .xp__hint {
    font-size: var(--sx-text-sm);
    color: var(--sx-danger);
  }
  .xp__copy {
    min-width: 112px;
  }
</style>
