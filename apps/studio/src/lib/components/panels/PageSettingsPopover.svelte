<script lang="ts">
  import type { PageRoute } from '@app-viz/schema';
  import { editor } from '#lib/state/editor.svelte.js';
  import { pageDisplayName } from '#lib/state/page-name.js';
  import Popover from '#lib/ui/Popover.svelte';
  import { focusScope } from '../dialogs/focus-trap.js';

  interface Props {
    page: PageRoute;
    anchor: HTMLElement | null;
    onclose: () => void;
  }

  let { page, anchor, onclose }: Props = $props();

  const uid = $props.id();

  function update(meta: Partial<Pick<PageRoute, 'title' | 'path' | 'description' | 'layoutId'>>) {
    editor.dispatch({ type: 'UPDATE_PAGE_META', pageId: page.id, meta });
  }

  function commitPath(input: HTMLInputElement) {
    const raw = input.value.trim();
    if (!raw || raw === page.path) {
      input.value = page.path;
      return;
    }
    update({ path: raw });
    // The reducer normalises ("Pricing Page" -> "/pricing-page") and de-duplicates; reflect it.
    input.value = editor.blueprint.pages.find((p) => p.id === page.id)?.path ?? page.path;
  }
</script>

<Popover open {anchor} {onclose} placement="right-start" offset={8} width={300} role="dialog" label="Settings for {pageDisplayName(page)}">
  <form class="ps" onsubmit={(e) => e.preventDefault()} {@attach focusScope({ restore: false })}>
    <header class="ps__head">
      <span class="ps__title">{pageDisplayName(page)}</span>
      <span class="ps__sub">Page settings</span>
    </header>

    <div class="ps__field">
      <label class="sx-label" for="{uid}-title">Document title</label>
      <input
        id="{uid}-title"
        class="sx-input"
        value={page.title}
        data-autofocus
        onchange={(e) => update({ title: (e.currentTarget as HTMLInputElement).value })}
      />
    </div>

    <div class="ps__field">
      <label class="sx-label" for="{uid}-path">Route path</label>
      <input
        id="{uid}-path"
        class="sx-input sx-input--mono"
        value={page.path}
        spellcheck="false"
        autocomplete="off"
        onchange={(e) => commitPath(e.currentTarget as HTMLInputElement)}
      />
      <p class="sx-help">Lowercase and hyphenated on save. Paths already in use get a numeric suffix.</p>
    </div>

    <div class="ps__field">
      <label class="sx-label" for="{uid}-layout">Layout</label>
      <select
        id="{uid}-layout"
        class="sx-select"
        value={page.layoutId ?? ''}
        onchange={(e) => {
          const v = (e.currentTarget as HTMLSelectElement).value;
          update({ layoutId: v ? v : undefined });
        }}
      >
        <option value="">None — standalone page</option>
        {#each editor.blueprint.layouts as layout (layout.id)}
          <option value={layout.id}>{layout.name}</option>
        {/each}
      </select>
    </div>

    <div class="ps__field">
      <label class="sx-label" for="{uid}-desc">Meta description</label>
      <textarea
        id="{uid}-desc"
        class="sx-textarea"
        rows="3"
        value={page.description}
        placeholder="Shown by search engines and link previews"
        onchange={(e) => update({ description: (e.currentTarget as HTMLTextAreaElement).value })}
      ></textarea>
    </div>
  </form>
</Popover>

<style>
  .ps {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 8px 10px;
  }
  .ps__head {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--sx-border);
    margin: 0 -8px;
    padding-left: 8px;
    padding-right: 8px;
  }
  .ps__title {
    font-size: var(--sx-text-lg);
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ps__sub {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
  }
  .ps__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ps__field .sx-help {
    margin-top: -1px;
  }
</style>
