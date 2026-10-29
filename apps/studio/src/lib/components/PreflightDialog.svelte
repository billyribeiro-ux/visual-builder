<script lang="ts">
  import { editor } from '#lib/state/editor.svelte.js';
  import { pageDisplayName } from '#lib/state/page-name.js';
  import type { BlueprintNode, PreflightCheckItem } from '@app-viz/schema';
  import Dialog from './ui/Dialog.svelte';
  import { humanizeKey, neutralize, preflightLabel } from './dialogs/copy.js';
  import { pluralize } from './dialogs/format.js';
  import ShieldCheckIcon from 'phosphor-svelte/lib/ShieldCheckIcon';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';
  import XCircleIcon from 'phosphor-svelte/lib/XCircleIcon';
  import CaretRightIcon from 'phosphor-svelte/lib/CaretRightIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';

  interface BrokenLink {
    key: string;
    nodeId: string;
    nodeName: string;
    href: string;
    pageId?: string;
    layoutId?: string;
    where: string;
  }

  const open = $derived(editor.showPreflight);
  const report = $derived(editor.preflightReport);
  const bp = $derived(editor.blueprint);

  const failed = $derived(report.checks.filter((c) => c.status === 'fail'));
  const warned = $derived(report.checks.filter((c) => c.status === 'warn'));
  const passed = $derived(report.checks.filter((c) => c.status === 'pass'));
  const attention = $derived([...failed, ...warned]);
  let showPassed = $state(false);

  const verdict = $derived(
    failed.length > 0
      ? { tone: 'danger', title: 'Fix errors before exporting', text: 'The export would be incomplete or invalid.' }
      : warned.length > 0
        ? { tone: 'warning', title: 'Ready, with warnings', text: 'The export works; review the items below first.' }
        : { tone: 'success', title: 'Ready to export', text: 'Every check passed for the current blueprint.' }
  );

  /** Mirrors the link scan in `validateBlueprintPreflight` so each warning can point at its element. */
  const brokenLinks = $derived.by<BrokenLink[]>(() => {
    if (!open) return [];
    const routes = new Set(bp.pages.map((p) => p.path));
    const out: BrokenLink[] = [];
    const scan = (node: BlueprintNode, ctx: { pageId?: string; layoutId?: string; where: string }) => {
      for (const [k, v] of Object.entries(node.props ?? {})) {
        if ((k.toLowerCase().includes('href') || k === 'path') && typeof v === 'string' && v.startsWith('/') && !v.startsWith('//')) {
          const clean = v.split('#')[0].split('?')[0] || '/';
          if (!routes.has(clean)) out.push({ key: `${node.id}:${k}`, nodeId: node.id, nodeName: node.name, href: v, ...ctx });
        }
      }
      for (const child of node.children ?? []) scan(child, ctx);
    };
    for (const page of bp.pages) scan(page.rootNode, { pageId: page.id, where: pageDisplayName(page) });
    for (const layout of bp.layouts) scan(layout.rootNode, { layoutId: layout.id, where: layout.name });
    return out;
  });

  const untitledPages = $derived(bp.pages.filter((p) => !p.title?.trim()));

  function close() {
    editor.showPreflight = false;
  }

  function goToNode(link: BrokenLink) {
    const pageId = link.pageId ?? (editor.activePage?.layoutId === link.layoutId ? editor.activePageId : bp.pages.find((p) => p.layoutId === link.layoutId)?.id);
    if (pageId && pageId !== editor.activePageId) editor.setActivePage(pageId);
    editor.selectNode(link.nodeId);
    close();
  }

  function goToPage(pageId: string) {
    editor.setActivePage(pageId);
    editor.selectNode(null);
    if (editor.activeLeftTab !== 'pages' || !editor.leftPanelOpen) editor.openLeftTab('pages');
    close();
  }

  function openExport() {
    close();
    editor.showExportDialog = true;
  }

  const ICONS = { pass: CheckCircleIcon, warn: WarningIcon, fail: XCircleIcon } as const;
  const CIRC = 2 * Math.PI * 22;
</script>

{#snippet checkRow(check: PreflightCheckItem)}
  {@const Icon = ICONS[check.status]}
  <li class={['check', `check--${check.status}`]}>
    <span class="check__icon"><Icon size={16} weight="fill" /></span>
    <div class="check__body">
      <div class="check__head">
        <span class="check__label">{preflightLabel(check.id, check.label)}</span>
        <span class="sx-badge sx-badge--mono">{check.category}</span>
      </div>
      {#if check.id === 'route-integrity' && check.status !== 'pass' && brokenLinks.length > 0}
        <p class="check__detail">{pluralize(brokenLinks.length, 'link')} point to a route that does not exist.</p>
        <ul class="fixes">
          {#each brokenLinks as link (link.key)}
            <li class="fix">
              <span class="fix__text">
                <span class="fix__name">{link.nodeName}</span>
                <span class="fix__where">in {link.where}</span>
                <ArrowRightIcon size={11} />
                <code class="fix__href">{link.href}</code>
              </span>
              <button type="button" class="sx-btn sx-btn--sm" onclick={() => goToNode(link)}>
                <CursorClickIcon size={13} /> Select
              </button>
            </li>
          {/each}
        </ul>
      {:else if check.id === 'a11y-landmarks' && check.status !== 'pass' && untitledPages.length > 0}
        <p class="check__detail">{pluralize(untitledPages.length, 'page')} without a document title.</p>
        <ul class="fixes">
          {#each untitledPages as page (page.id)}
            <li class="fix">
              <span class="fix__text"><code class="fix__href">{page.path}</code></span>
              <button type="button" class="sx-btn sx-btn--sm" onclick={() => goToPage(page.id)}>Open page</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class={['check__detail', check.id === 'schema-valid' && check.status !== 'pass' && 'check__detail--mono']}>{neutralize(check.detail)}</p>
      {/if}
    </div>
  </li>
{/snippet}

<Dialog {open} title="Preflight" subtitle="Live checks against the current blueprint before you export." size="lg" icon={ShieldCheckIcon} onclose={close}>
  <section class={['summary', `summary--${verdict.tone}`]} aria-label="Summary">
    <div class="ring" role="img" aria-label="Score {report.score} out of 100">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
        <circle cx="28" cy="28" r="22" class="ring__track" />
        <circle cx="28" cy="28" r="22" class="ring__value" stroke-dasharray={CIRC} stroke-dashoffset={CIRC * (1 - report.score / 100)} />
      </svg>
      <span class="ring__num">{report.score}</span>
    </div>
    <div class="summary__text">
      <span class="summary__title">{verdict.title}</span>
      <span class="summary__sub">{verdict.text}</span>
      <div class="summary__counts">
        <span class="sx-badge sx-badge--success">{passed.length} passed</span>
        {#if warned.length > 0}<span class="sx-badge sx-badge--warning">{pluralize(warned.length, 'warning')}</span>{/if}
        {#if failed.length > 0}<span class="sx-badge sx-badge--danger">{failed.length} failed</span>{/if}
      </div>
    </div>
    <dl class="facts">
      <div><dt>Pages</dt><dd>{bp.pages.length}</dd></div>
      <div><dt>Layouts</dt><dd>{bp.layouts.length}</dd></div>
      <div><dt>Target</dt><dd>Svelte {bp.target.svelteVersion} · Kit {bp.target.sveltekitVersion}</dd></div>
      <div><dt>Styling</dt><dd>{humanizeKey(neutralize(bp.target.styling))}</dd></div>
    </dl>
  </section>

  {#if attention.length > 0}
    <div class="sx-section-label list-label">Needs attention</div>
    <ul class="checks">
      {#each attention as check (check.id)}
        {@render checkRow(check)}
      {/each}
    </ul>
  {/if}

  {#if passed.length > 0}
    <button type="button" class="sx-section-label list-label list-toggle" aria-expanded={showPassed || attention.length === 0} onclick={() => (showPassed = !showPassed)}>
      <span class={['caret', (showPassed || attention.length === 0) && 'caret--open']}><CaretRightIcon size={9} weight="bold" /></span>
      Passed · {passed.length}
    </button>
    {#if showPassed || attention.length === 0}
      <ul class="checks">
        {#each passed as check (check.id)}
          {@render checkRow(check)}
        {/each}
      </ul>
    {/if}
  {/if}

  {#snippet footer()}
    <span class="foot-note">Updates automatically as you edit.</span>
    <button type="button" class="sx-btn" onclick={close}>Close</button>
    <button type="button" class="sx-btn sx-btn--primary" data-autofocus onclick={openExport}>Continue to export</button>
  {/snippet}
</Dialog>

<style>
  .summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
  }
  .ring {
    position: relative;
    width: 56px;
    height: 56px;
  }
  .ring svg {
    transform: rotate(-90deg);
  }
  .ring__track {
    fill: none;
    stroke: var(--sx-border);
    stroke-width: 5;
  }
  .ring__value {
    fill: none;
    stroke-width: 5;
    stroke-linecap: round;
    transition: stroke-dashoffset 400ms var(--sx-ease);
  }
  .summary--success .ring__value {
    stroke: var(--sx-success);
  }
  .summary--warning .ring__value {
    stroke: var(--sx-warning);
  }
  .summary--danger .ring__value {
    stroke: var(--sx-danger);
  }
  .ring__num {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: var(--sx-text-lg);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .summary__text {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .summary__title {
    font-size: var(--sx-text-lg);
    font-weight: 600;
  }
  .summary__sub {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .summary__counts {
    display: flex;
    gap: 6px;
    margin-top: 6px;
  }
  .facts {
    display: grid;
    grid-template-columns: auto auto;
    gap: 4px 14px;
    padding-left: 16px;
    border-left: 1px solid var(--sx-border);
    font-size: var(--sx-text-sm);
  }
  .facts div {
    display: contents;
  }
  .facts dt {
    color: var(--sx-text-3);
  }
  .facts dd {
    margin: 0;
    color: var(--sx-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .list-label {
    padding: 18px 0 8px;
  }
  .list-toggle {
    display: flex;
    justify-content: flex-start;
    gap: 6px;
    width: 100%;
  }
  .list-toggle:hover {
    color: var(--sx-text-2);
  }
  .caret {
    display: grid;
    transition: transform var(--sx-dur) var(--sx-ease);
  }
  .caret--open {
    transform: rotate(90deg);
  }
  .checks {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    overflow: hidden;
  }
  .check {
    display: flex;
    gap: 12px;
    padding: 12px 14px;
  }
  .check + .check {
    border-top: 1px solid var(--sx-border);
  }
  .check__icon {
    flex-shrink: 0;
    margin-top: 1px;
  }
  .check--pass .check__icon {
    color: var(--sx-success);
  }
  .check--warn .check__icon {
    color: var(--sx-warning);
  }
  .check--fail .check__icon {
    color: var(--sx-danger);
  }
  .check__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .check__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .check__label {
    font-weight: 600;
  }
  .check__detail {
    font-size: var(--sx-text-sm);
    line-height: 1.5;
    color: var(--sx-text-2);
    overflow-wrap: anywhere;
  }
  .check__detail--mono {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    white-space: pre-wrap;
  }
  .fixes {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;
  }
  .fix {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 2px 4px 2px 10px;
    border-radius: var(--sx-radius-sm);
    background: var(--sx-subtle);
  }
  .fix__text {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    white-space: nowrap;
    overflow: hidden;
  }
  .fix__name {
    color: var(--sx-text);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fix__where {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fix__href {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
  }
  .foot-note {
    flex: 1;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
  }
</style>
