<script lang="ts">
  import type { BlueprintAsset } from '@app-viz/schema';
  import Dialog from '../ui/Dialog.svelte';
  import { sanitizeSvg, svgDataUrl, svgMarkupToAsset } from './asset-utils.js';
  import FileCodeIcon from 'phosphor-svelte/lib/FileCodeIcon';

  interface Props {
    takenNames: string[];
    onclose: () => void;
    oncreate: (asset: BlueprintAsset) => void;
  }

  let { takenNames, onclose, oncreate }: Props = $props();

  const uid = $props.id();

  let filename = $state('illustration.svg');
  let alt = $state('');
  let markup = $state(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140">\n  <rect width="240" height="140" rx="14" fill="#EEF3FF"/>\n  <circle cx="120" cy="70" r="36" fill="#2F6BFF"/>\n</svg>'
  );

  const preview = $derived.by<{ ok: true; url: string } | { ok: false; error: string }>(() => {
    if (!markup.trim()) return { ok: false, error: 'Paste SVG markup to preview it.' };
    try {
      return { ok: true, url: svgDataUrl(sanitizeSvg(markup)) };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  });

  let submitError = $state('');

  function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!preview.ok) return;
    try {
      oncreate(svgMarkupToAsset(filename, alt, markup, takenNames));
    } catch (e) {
      submitError = (e as Error).message;
    }
  }
</script>

<Dialog open title="Add SVG from code" subtitle="Scripts, event handlers and external references are removed before saving." size="lg" icon={FileCodeIcon} {onclose}>
  <form id="{uid}-form" class="svg" onsubmit={submit}>
    <div class="svg__fields">
      <div class="svg__row">
        <div class="svg__field">
          <label class="sx-label" for="{uid}-name">File name</label>
          <input id="{uid}-name" class="sx-input sx-input--mono" spellcheck="false" bind:value={filename} />
        </div>
        <div class="svg__field">
          <label class="sx-label" for="{uid}-alt">Alt text</label>
          <input id="{uid}-alt" class="sx-input" placeholder="Describe the image" bind:value={alt} />
        </div>
      </div>
      <div class="svg__field svg__field--grow">
        <label class="sx-label" for="{uid}-markup">SVG markup</label>
        <textarea id="{uid}-markup" class="sx-textarea svg__code" spellcheck="false" rows="9" data-autofocus bind:value={markup}></textarea>
      </div>
    </div>
    <div class="svg__preview-wrap">
      <span class="sx-label">Preview</span>
      <div class="svg__preview">
        {#if preview.ok}
          <img src={preview.url} alt={alt || 'SVG preview'} width="240" height="140" />
        {:else}
          <span class="svg__error" role="status">{preview.error}</span>
        {/if}
      </div>
      {#if submitError}<p class="svg__error" role="alert">{submitError}</p>{/if}
    </div>
  </form>

  {#snippet footer()}
    <button type="button" class="sx-btn" onclick={onclose}>Cancel</button>
    <button type="submit" form="{uid}-form" class="sx-btn sx-btn--primary" disabled={!preview.ok}>Add asset</button>
  {/snippet}
</Dialog>

<style>
  .svg {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 220px;
    gap: 16px;
  }
  .svg__fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
  }
  .svg__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .svg__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }
  .svg__code {
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    line-height: 1.55;
    min-height: 180px;
  }
  .svg__preview-wrap {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .svg__preview {
    display: grid;
    place-items: center;
    flex: 1;
    min-height: 180px;
    padding: 12px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background-color: var(--sx-subtle);
    background-image:
      linear-gradient(45deg, var(--sx-hover) 25%, transparent 25%),
      linear-gradient(-45deg, var(--sx-hover) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--sx-hover) 75%),
      linear-gradient(-45deg, transparent 75%, var(--sx-hover) 75%);
    background-size: 12px 12px;
    background-position:
      0 0,
      0 6px,
      6px -6px,
      -6px 0;
  }
  .svg__preview img {
    max-width: 100%;
    height: auto;
  }
  .svg__error {
    font-size: var(--sx-text-sm);
    color: var(--sx-danger);
    text-align: center;
    line-height: 1.5;
  }
</style>
