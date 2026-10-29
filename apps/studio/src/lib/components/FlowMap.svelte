<script lang="ts">
  import type { BlueprintNode, PageRoute } from '@app-viz/schema';
  import { editor } from '../state/editor.svelte.js';
  import HouseSimpleIcon from 'phosphor-svelte/lib/HouseSimpleIcon';
  import FileIcon from 'phosphor-svelte/lib/FileIcon';
  import BrowserIcon from 'phosphor-svelte/lib/BrowserIcon';
  import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRightIcon';
  import LightningIcon from 'phosphor-svelte/lib/LightningIcon';
  import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
  import WarningIcon from 'phosphor-svelte/lib/WarningIcon';

  interface RouteSummary {
    page: PageRoute;
    layoutName: string | null;
    nodeCount: number;
    sections: { id: string; name: string }[];
    outgoing: { path: string; exists: boolean }[];
    actions: string[];
  }

  function countNodes(node: BlueprintNode): number {
    return 1 + (node.children ?? []).reduce((n, c) => n + countNodes(c), 0);
  }

  function collect(node: BlueprintNode, routes: Set<string>, actions: string[]) {
    for (const [k, v] of Object.entries(node.props ?? {})) {
      if ((/href$/i.test(k) || k === 'path') && typeof v === 'string' && v.startsWith('/') && !v.startsWith('//')) {
        routes.add(v.split('#')[0] || '/');
      }
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item && typeof item === 'object') {
            for (const [ik, iv] of Object.entries(item as Record<string, unknown>)) {
              if (/href$/i.test(ik) && typeof iv === 'string' && iv.startsWith('/') && !iv.startsWith('//')) {
                routes.add(iv.split('#')[0] || '/');
              }
            }
          }
        }
      }
    }
    for (const rule of node.interactions ?? []) {
      const act = rule.actionType || rule.action?.type;
      const p = (rule.payload || rule.action?.payload || {}) as Record<string, string>;
      if (act === 'navigate' && (p.path || p.targetPath)) {
        routes.add(p.path || p.targetPath);
        actions.push(`${node.name} navigates to ${p.path || p.targetPath}`);
      } else if (act === 'openModal' || act === 'open_modal') {
        actions.push(`${node.name} opens “${p.modalTitle || 'Dialog'}”`);
      } else if (act === 'toggleDrawer') {
        actions.push(`${node.name} toggles “${p.drawerTitle || 'Drawer'}”`);
      } else if (act === 'showToast' || act === 'show_toast') {
        actions.push(`${node.name} shows a toast`);
      } else if (act === 'setState' || act === 'toggle_state') {
        actions.push(`${node.name} sets state “${p.stateKey || 'status'}”`);
      }
    }
    for (const c of node.children ?? []) collect(c, routes, actions);
  }

  const summaries = $derived.by<RouteSummary[]>(() => {
    const known = new Set(editor.blueprint.pages.map((p) => p.path));
    return editor.blueprint.pages.map((page) => {
      const layout = page.layoutId ? editor.blueprint.layouts.find((l) => l.id === page.layoutId) : undefined;
      const routes = new Set<string>();
      const actions: string[] = [];
      collect(page.rootNode, routes, actions);
      if (layout) collect(layout.rootNode, routes, actions);
      routes.delete(page.path);
      return {
        page,
        layoutName: layout?.name ?? null,
        nodeCount: countNodes(page.rootNode),
        sections: (page.rootNode.children ?? []).map((c) => ({ id: c.id, name: c.name })),
        outgoing: [...routes].sort().map((path) => ({ path, exists: known.has(path) })),
        actions
      };
    });
  });

  function openPage(pageId: string, nodeId?: string) {
    editor.setActivePage(pageId);
    if (nodeId) editor.selectNode(nodeId);
    editor.canvasViewMode = 'canvas';
  }
</script>

<div class="fm">
  <header class="fm__head">
    <div>
      <h2 class="fm__title">Routes & flows</h2>
      <p class="fm__sub">{editor.blueprint.pages.length} pages · {editor.blueprint.layouts.length} shared layouts. Links and click actions are derived from the blueprint.</p>
    </div>
  </header>

  {#if editor.blueprint.layouts.length > 0}
    <div class="fm__layouts">
      {#each editor.blueprint.layouts as layout (layout.id)}
        <div class="fm__layout">
          <span class="fm__layout-icon"><BrowserIcon size={16} /></span>
          <div class="fm__layout-text">
            <span class="fm__layout-name">{layout.name}</span>
            <span class="fm__muted">Shared layout · {(layout.rootNode.children ?? []).map((c) => c.name).join(' · ') || 'empty'}</span>
          </div>
          <span class="sx-badge">{editor.blueprint.pages.filter((p) => p.layoutId === layout.id).length} pages</span>
        </div>
      {/each}
    </div>
  {/if}

  <div class="fm__grid">
    {#each summaries as s (s.page.id)}
      <article class={['fm__card', s.page.id === editor.activePageId && 'fm__card--active']}>
        <div class="fm__card-head">
          <span class="fm__card-icon">
            {#if s.page.path === '/'}<HouseSimpleIcon size={16} />{:else}<FileIcon size={16} />{/if}
          </span>
          <div class="fm__card-title">
            <h3>{s.page.title}</h3>
            <code>{s.page.path}</code>
          </div>
          <button type="button" class="sx-btn sx-btn--sm" onclick={() => openPage(s.page.id)}>
            <PencilSimpleIcon size={12} />Edit
          </button>
        </div>

        <div class="fm__meta">
          <span class="sx-badge">{s.layoutName ?? 'No layout'}</span>
          <span class="sx-badge">{s.nodeCount} nodes</span>
          <span class="sx-badge">{s.sections.length} sections</span>
        </div>

        {#if s.sections.length > 0}
          <div class="fm__block">
            <div class="fm__label">Sections</div>
            <div class="fm__chips">
              {#each s.sections as sec (sec.id)}
                <button type="button" class="fm__chip" onclick={() => openPage(s.page.id, sec.id)}>{sec.name}</button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="fm__block">
          <div class="fm__label">Links out</div>
          {#if s.outgoing.length > 0}
            <div class="fm__links">
              {#each s.outgoing as link (link.path)}
                {@const target = editor.blueprint.pages.find((p) => p.path === link.path)}
                <button
                  type="button"
                  class={['fm__link', !link.exists && 'fm__link--broken']}
                  disabled={!target}
                  onclick={() => target && openPage(target.id)}
                >
                  {#if link.exists}<ArrowRightIcon size={12} />{:else}<WarningIcon size={12} />{/if}
                  <code>{link.path}</code>
                  {#if !link.exists}<span>no page</span>{/if}
                </button>
              {/each}
            </div>
          {:else}
            <span class="fm__muted">No outgoing links</span>
          {/if}
        </div>

        {#if s.actions.length > 0}
          <div class="fm__block">
            <div class="fm__label">Click actions</div>
            <ul class="fm__actions">
              {#each s.actions as act, i (i)}
                <li><LightningIcon size={12} />{act}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </article>
    {/each}
  </div>
</div>

<style>
  .fm {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px 28px 48px;
  }
  .fm__head {
    margin-bottom: 16px;
  }
  .fm__title {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  .fm__sub,
  .fm__muted {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .fm__muted {
    color: var(--sx-text-3);
  }
  .fm__layouts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }
  .fm__layout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--sx-panel);
    border: 1px dashed var(--sx-border-strong);
    border-radius: var(--sx-radius-md);
  }
  .fm__layout-icon,
  .fm__card-icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: var(--sx-radius-sm);
    background: var(--sx-hover);
    color: var(--sx-text-2);
    flex-shrink: 0;
  }
  .fm__layout-text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .fm__layout-text .fm__muted {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fm__layout-name {
    font-weight: 600;
  }
  .fm__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 12px;
  }
  .fm__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    background: var(--sx-panel);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-lg);
    box-shadow: var(--sx-shadow-sm);
  }
  .fm__card--active {
    border-color: var(--sx-accent);
    box-shadow: 0 0 0 3px var(--sx-accent-soft);
  }
  .fm__card-head {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .fm__card-title {
    flex: 1;
    min-width: 0;
  }
  .fm__card-title h3 {
    font-size: var(--sx-text-lg);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .fm__card-title code,
  .fm__link code {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
  .fm__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .fm__block {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .fm__label {
    font-size: var(--sx-text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--sx-text-3);
  }
  .fm__chips,
  .fm__links {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .fm__chip,
  .fm__link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 24px;
    padding: 0 8px;
    font-size: var(--sx-text-sm);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
    background: var(--sx-subtle);
    color: var(--sx-text);
  }
  .fm__chip:hover,
  .fm__link:hover:not(:disabled) {
    border-color: var(--sx-accent);
    color: var(--sx-accent-text);
  }
  .fm__link--broken {
    color: var(--sx-warning);
    border-color: var(--sx-warning);
    background: var(--sx-warning-soft);
  }
  .fm__link--broken code {
    color: inherit;
  }
  .fm__actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .fm__actions li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .fm__actions :global(svg) {
    color: var(--sx-violet);
    flex-shrink: 0;
  }
</style>
