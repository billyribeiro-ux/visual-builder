<script lang="ts">
  import { editor } from '#lib/state/editor.svelte.js';
  import { pageDisplayName } from '#lib/state/page-name.js';
  import { generatePageRoute, generateAppCss, generateAgentsMarkdown, normalizeRoutePath } from '@app-viz/codegen';
  import type { ProjectBlueprint } from '@app-viz/schema';
  import Dialog from './ui/Dialog.svelte';
  import CodeBlock from './dialogs/CodeBlock.svelte';
  import { formatBytes, pluralize } from './dialogs/format.js';
  import type { CodeLang } from './dialogs/highlight.js';
  import CodeIcon from 'phosphor-svelte/lib/CodeIcon';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import CheckIcon from 'phosphor-svelte/lib/CheckIcon';
  import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimpleIcon';
  import FileCodeIcon from 'phosphor-svelte/lib/FileCodeIcon';
  import FileCssIcon from 'phosphor-svelte/lib/FileCssIcon';
  import FileMdIcon from 'phosphor-svelte/lib/FileMdIcon';
  import BracketsCurlyIcon from 'phosphor-svelte/lib/BracketsCurlyIcon';
  import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircleIcon';

  type Tab = 'page' | 'css' | 'agents' | 'blueprint';

  const TABS = [
    { id: 'page', label: '+page.svelte', icon: FileCodeIcon, lang: 'svelte' },
    { id: 'css', label: 'app.css', icon: FileCssIcon, lang: 'css' },
    { id: 'agents', label: 'AGENTS.md', icon: FileMdIcon, lang: 'markdown' },
    { id: 'blueprint', label: 'blueprint.json', icon: BracketsCurlyIcon, lang: 'json' }
  ] as const satisfies ReadonlyArray<{ id: Tab; label: string; icon: unknown; lang: CodeLang }>;

  const uid = $props.id();
  const open = $derived(editor.showCodeView);

  let tab = $state<Tab>('page');
  let pickedPageId = $state<string | null>(null);
  let copied = $state(false);
  let copyTimer: ReturnType<typeof setTimeout> | undefined;

  const pageId = $derived(pickedPageId && editor.blueprint.pages.some((p) => p.id === pickedPageId) ? pickedPageId : editor.activePageId);
  const page = $derived(editor.blueprint.pages.find((p) => p.id === pageId) ?? editor.blueprint.pages[0]);
  const lang = $derived(TABS.find((t) => t.id === tab)?.lang ?? 'text');

  const filePath = $derived.by(() => {
    if (tab === 'css') return 'src/app.css';
    if (tab === 'agents') return 'AGENTS.md';
    if (tab === 'blueprint') return 'blueprint/project.blueprint.json';
    const dir = page ? normalizeRoutePath(page.path) : '';
    return dir ? `src/routes/${dir}/+page.svelte` : 'src/routes/+page.svelte';
  });

  const output = $derived.by<{ ok: true; code: string } | { ok: false; error: string }>(() => {
    if (!open) return { ok: true, code: '' };
    try {
      const bp = $state.snapshot(editor.blueprint) as ProjectBlueprint;
      if (tab === 'css') return { ok: true, code: generateAppCss(bp.tokens, bp) };
      if (tab === 'agents') return { ok: true, code: generateAgentsMarkdown(bp) };
      if (tab === 'blueprint') return { ok: true, code: JSON.stringify(bp, null, 2) };
      const target = bp.pages.find((p) => p.id === pageId) ?? bp.pages[0];
      return { ok: true, code: generatePageRoute(target, bp) };
    } catch (e) {
      return { ok: false, error: (e as Error).message || 'The generator failed.' };
    }
  });

  const code = $derived(output.ok ? output.code : '');
  const stats = $derived(`${pluralize(code ? code.split('\n').length : 0, 'line')} · ${formatBytes(new Blob([code]).size)}`);

  function close() {
    editor.showCodeView = false;
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1800);
    } catch (e) {
      editor.notify('error', `Clipboard access was blocked (${(e as Error).message}). Use Download instead.`);
    }
  }

  function download() {
    if (!code) return;
    const name = filePath.split('/').pop() ?? 'file.txt';
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function onTabKeydown(event: KeyboardEvent) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const idx = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(idx + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length];
    tab = next.id;
    (event.currentTarget as HTMLElement).querySelector<HTMLElement>(`[data-tab="${next.id}"]`)?.focus();
  }
</script>

<Dialog
  {open}
  title="Code"
  subtitle="Read-only output of the SvelteKit generator for the current blueprint."
  size="full"
  height="min(820px, calc(100vh - 48px))"
  icon={CodeIcon}
  flush
  initialFocus='[role="tab"][aria-selected="true"]'
  onclose={close}
>
  <div class="cv">
    <div class="cv__bar">
      <div class="cv__tabs" role="tablist" aria-label="Generated files" tabindex="-1" onkeydown={onTabKeydown}>
        {#each TABS as t (t.id)}
          {@const Icon = t.icon}
          <button
            type="button"
            role="tab"
            id="{uid}-tab-{t.id}"
            data-tab={t.id}
            aria-selected={tab === t.id}
            aria-controls="{uid}-panel"
            tabindex={tab === t.id ? 0 : -1}
            class="sx-tab cv__tab"
            onclick={() => (tab = t.id)}
          >
            <Icon size={14} />
            {t.label}
          </button>
        {/each}
      </div>
    </div>

    <div class="cv__file">
      <span class="cv__path" title={filePath}>{filePath}</span>
      <span class="cv__stats">{stats}</span>
      <span class="cv__spacer"></span>
      {#if tab === 'page'}
        <select class="sx-select cv__page" aria-label="Page" value={pageId} onchange={(e) => (pickedPageId = (e.currentTarget as HTMLSelectElement).value)}>
          {#each editor.blueprint.pages as p (p.id)}
            <option value={p.id}>{pageDisplayName(p)} · {p.path}</option>
          {/each}
        </select>
      {/if}
      <button type="button" class="sx-btn sx-btn--sm" onclick={download} disabled={!code}>
        <DownloadSimpleIcon size={13} /> Download
      </button>
      <button type="button" class="sx-btn sx-btn--sm sx-btn--primary cv__copy" onclick={copy} disabled={!code} aria-live="polite">
        {#if copied}<CheckIcon size={13} weight="bold" /> Copied{:else}<CopyIcon size={13} /> Copy{/if}
      </button>
    </div>

    <div class="cv__code" id="{uid}-panel" role="tabpanel" aria-labelledby="{uid}-tab-{tab}">
      {#if output.ok}
        <CodeBlock {code} {lang} label={filePath} />
      {:else}
        <div class="sx-empty cv__error" role="alert">
          <span class="sx-empty__icon"><WarningCircleIcon size={20} /></span>
          <span class="sx-empty__title">The generator could not produce this file</span>
          <code class="cv__error-msg">{output.error}</code>
        </div>
      {/if}
    </div>
  </div>
</Dialog>

<style>
  .cv {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .cv__bar {
    flex-shrink: 0;
    border-bottom: 1px solid var(--sx-border);
  }
  .cv__tabs {
    display: flex;
    gap: 4px;
    padding: 0 12px;
    outline: none;
  }
  .cv__tab {
    flex: none;
    padding: 0 10px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
  }
  .cv__file {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    height: 44px;
    padding: 0 12px 0 20px;
    border-bottom: 1px solid var(--sx-border);
    background: var(--sx-panel);
  }
  .cv__path {
    min-width: 0;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cv__stats {
    flex-shrink: 0;
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
  }
  .cv__spacer {
    flex: 1;
  }
  .cv__page {
    width: auto;
    max-width: 240px;
    height: var(--sx-control-h-sm);
    font-size: var(--sx-text-sm);
  }
  .cv__copy {
    min-width: 76px;
  }
  .cv__code {
    flex: 1;
    min-height: 0;
  }
  .cv__error {
    height: 100%;
    justify-content: center;
  }
  .cv__error-msg {
    max-width: 560px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    color: var(--sx-danger);
    white-space: pre-wrap;
  }
</style>
