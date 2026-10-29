<script lang="ts">
  import type { BlueprintAsset } from '@app-viz/schema';
  import ImageIcon from 'phosphor-svelte/lib/ImageIcon';
  import ImagesIcon from 'phosphor-svelte/lib/ImagesIcon';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import MagnifyingGlassIcon from 'phosphor-svelte/lib/MagnifyingGlassIcon';
  import Popover from '../../../ui/Popover.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import InlineMessage from './InlineMessage.svelte';

  interface Props {
    value: string;
    onchange: (value: string) => void;
    /** Accessible name, e.g. "Logo image". */
    label: string;
    id?: string;
    /** Maps a picked asset to the stored value (default: embedded data URL, else its path). */
    resolveAsset?: (asset: BlueprintAsset) => { value: string; error?: string };
    /** Whether typed `data:image/…` URLs are accepted. */
    allowDataUrls?: boolean;
    placeholder?: string;
  }

  let {
    value,
    onchange,
    label,
    id,
    resolveAsset = (a) => ({ value: a.localPath || a.dataUrl || '' }),
    allowDataUrls = true,
    placeholder = 'https://… or /path/image.png'
  }: Props = $props();

  const uid = $props.id();
  const inputId = $derived(id ?? `${uid}-url`);

  let open = $state(false);
  let anchor = $state<HTMLElement | null>(null);
  let query = $state('');
  let draft = $state<string | null>(null);
  let error = $state('');
  let thumbFailedFor = $state<string | null>(null);

  const assets = $derived((editor.blueprint.assets ?? []).filter((a) => a.mimeType.startsWith('image/')));
  const filtered = $derived(
    query.trim()
      ? assets.filter((a) => `${a.filename} ${a.alt} ${a.category ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()))
      : assets
  );

  /** Strip the optional `;utf8` parameter so CSS-safe variants still match their asset. */
  const canonical = (v: string) => v.replace(/^data:image\/svg\+xml(;charset=utf-?8|;utf-?8)?,/i, 'data:image/svg+xml,');
  const current = $derived(value.trim());
  const matched = $derived(
    current
      ? assets.find((a) => a.localPath === current || (a.dataUrl && canonical(a.dataUrl) === canonical(current)))
      : undefined
  );
  const isEmbedded = $derived(/^data:/i.test(current));
  const thumbSrc = $derived(matched?.dataUrl || (current && !current.startsWith('/') ? current : '') || '');
  const showThumb = $derived(Boolean(thumbSrc) && thumbFailedFor !== thumbSrc);
  const title = $derived(matched?.filename ?? (isEmbedded ? 'Embedded image' : current ? current.split('/').pop() || current : 'No image'));
  const meta = $derived(
    matched
      ? [matched.width && matched.height ? `${matched.width}×${matched.height}` : '', matched.mimeType.replace('image/', '').replace('+xml', '').toUpperCase()]
          .filter(Boolean)
          .join(' · ')
      : isEmbedded
        ? 'Data URL'
        : current
          ? 'URL'
          : 'Not set'
  );

  function validateUrl(text: string): string | null {
    const t = text.replace(/\p{Cc}/gu, '').trim();
    if (!t) return null;
    const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(t)?.[1]?.toLowerCase();
    if (scheme === 'data') {
      if (!allowDataUrls) return 'Embedded data URLs are not supported here. Use a hosted image URL.';
      return /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i.test(t) ? null : 'Only image data URLs are allowed.';
    }
    if (scheme && scheme !== 'http' && scheme !== 'https') return `${scheme}: URLs are not allowed for images.`;
    if (t.startsWith('//')) return 'Protocol-relative URLs are not allowed. Start with https://.';
    return null;
  }

  function commitUrl(text: string) {
    const problem = validateUrl(text);
    if (problem) {
      error = problem;
      return;
    }
    error = '';
    draft = null;
    onchange(text.trim());
  }

  function pick(asset: BlueprintAsset) {
    const resolved = resolveAsset(asset);
    if (resolved.error) {
      error = resolved.error;
      return;
    }
    error = '';
    onchange(resolved.value);
    open = false;
  }
</script>

<div class="asset">
  <div class="asset__card">
    <span class="asset__thumb">
      {#if showThumb}
        <img src={thumbSrc} alt="" width="40" height="40" onerror={() => (thumbFailedFor = thumbSrc)} />
      {:else}
        <ImageIcon size={16} />
      {/if}
    </span>
    <span class="asset__text">
      <span class="asset__title">{title}</span>
      <span class="asset__meta">{meta}</span>
    </span>
    <button
      type="button"
      class="sx-btn sx-btn--sm"
      aria-haspopup="dialog"
      aria-expanded={open}
      {@attach (el) => {
        anchor = el;
      }}
      onclick={() => (open = !open)}
    >
      <ImagesIcon size={13} /> Browse
    </button>
    {#if current}
      <IconButton label="Remove {label.toLowerCase()}" icon={XIcon} size="sm" iconSize={12} onclick={() => onchange('')} />
    {/if}
  </div>
  {#if !isEmbedded}
    <input
      id={inputId}
      class={['sx-input', 'sx-input--mono', error && 'is-invalid']}
      type="text"
      spellcheck="false"
      aria-label="{label} URL"
      aria-invalid={error ? 'true' : undefined}
      {placeholder}
      value={draft ?? current}
      oninput={(e) => (draft = e.currentTarget.value)}
      onchange={(e) => commitUrl(e.currentTarget.value)}
    />
  {/if}
  {#if error}<InlineMessage message={error} />{/if}
</div>

<Popover {open} {anchor} onclose={() => (open = false)} placement="bottom-end" width={288} role="dialog" label="Project assets">
  <div class="picker">
    <div class="sx-search">
      <MagnifyingGlassIcon size={14} />
      <input class="sx-input" type="search" placeholder="Search assets" aria-label="Search assets" bind:value={query} />
    </div>
    {#if filtered.length > 0}
      <div class="picker__grid">
        {#each filtered as asset (asset.id)}
          <button
            type="button"
            class={['picker__tile', matched?.id === asset.id && 'picker__tile--on']}
            aria-label="Use {asset.filename}"
            aria-pressed={matched?.id === asset.id}
            onclick={() => pick(asset)}
          >
            <span class="picker__img">
              {#if asset.dataUrl}
                <img src={asset.dataUrl} alt={asset.alt} width="80" height="56" loading="lazy" />
              {:else}
                <ImageIcon size={18} />
              {/if}
            </span>
            <span class="picker__name">{asset.filename}</span>
          </button>
        {/each}
      </div>
    {:else}
      <div class="sx-empty picker__empty">
        <span class="sx-empty__icon"><ImagesIcon size={18} /></span>
        <span class="sx-empty__title">{assets.length ? 'No matching assets' : 'No images in this project'}</span>
        <span class="sx-help">{assets.length ? 'Try a different search.' : 'Upload images in the Assets panel, or paste a URL.'}</span>
      </div>
    {/if}
  </div>
</Popover>

<style>
  .asset {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .asset__card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-subtle);
  }
  .asset__thumb {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    overflow: hidden;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-text-3);
    background:
      repeating-conic-gradient(var(--sx-hover) 0% 25%, var(--sx-panel) 0% 50%) 0 0 / 10px 10px;
    box-shadow: inset 0 0 0 1px var(--sx-border);
  }
  .asset__thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .asset__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .asset__title {
    font-size: var(--sx-text-md);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .asset__meta {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
  .picker {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 4px;
  }
  .picker__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    max-height: 280px;
    overflow-y: auto;
  }
  .picker__tile {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 4px;
    border-radius: var(--sx-radius-sm);
    text-align: left;
    border: 1px solid transparent;
  }
  .picker__tile:hover {
    background: var(--sx-hover);
  }
  .picker__tile--on {
    border-color: var(--sx-accent);
    background: var(--sx-accent-soft);
  }
  .picker__img {
    display: grid;
    place-items: center;
    height: 56px;
    overflow: hidden;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-3);
    background: var(--sx-subtle);
    box-shadow: inset 0 0 0 1px var(--sx-border);
  }
  .picker__img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .picker__name {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .picker__empty {
    padding: 20px 12px;
  }
</style>
