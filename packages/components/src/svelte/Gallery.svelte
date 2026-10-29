<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';
  import { safeCssValue } from './lib/css.js';

  interface GalleryImage {
    src?: string;
    alt?: string;
    caption?: string;
  }

  type Ratio = 'auto' | '1:1' | '4:3' | '3:2' | '16:9' | '4:5';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    images?: GalleryImage[];
    columns?: number;
    gap?: string;
    aspectRatio?: Ratio;
    layout?: 'grid' | 'masonry';
    lightbox?: boolean;
    class?: string;
  }

  let {
    images = [],
    columns = 3,
    gap = '1rem',
    aspectRatio = '4:3',
    layout = 'grid',
    lightbox = true,
    class: className = '',
    ...rest
  }: Props = $props();

  const RATIOS: Record<Exclude<Ratio, 'auto'>, [number, number]> = { '1:1': [1, 1], '4:3': [4, 3], '3:2': [3, 2], '16:9': [16, 9], '4:5': [4, 5] };
  /** Placeholder rhythm for masonry tiles without an image, so the staggered layout stays visible. */
  const MASONRY_RHYTHM: Array<[number, number]> = [[4, 5], [1, 1], [4, 3], [3, 4], [3, 2], [1, 1]];

  const items = $derived(
    (Array.isArray(images) ? images : [])
      .filter((image) => image && typeof image === 'object')
      .map((image) => ({ src: safeSrc(image.src), alt: image.alt ?? '', caption: image.caption ?? '' }))
  );
  const cols = $derived(Math.min(6, Math.max(2, Math.round(Number(columns) || 3))));
  const gapValue = $derived(safeCssValue(gap) ?? '1rem');
  const masonry = $derived(layout === 'masonry');
  let failed = $state<Record<string, true>>({});

  /** Tile ratio, or null for the image's natural ratio (masonry images and grid `auto`). */
  function ratioFor(index: number, hasImage: boolean): [number, number] | null {
    if (masonry) return hasImage ? null : MASONRY_RHYTHM[index % MASONRY_RHYTHM.length];
    if (aspectRatio === 'auto') return hasImage ? null : RATIOS['4:3'];
    return RATIOS[aspectRatio] ?? RATIOS['4:3'];
  }

  function visible(src: string): boolean {
    return src !== '' && !failed[src];
  }

  // ----- Lightbox (native modal <dialog>: focus containment, Esc and inert page come built in) -----
  const uid = $props.id();
  let dialog: HTMLDialogElement | undefined;
  let open = $state(false);
  let current = $state(0);
  let returnFocus: HTMLElement | null = null;
  const active = $derived(items[Math.min(current, Math.max(0, items.length - 1))]);

  function openAt(index: number, trigger: HTMLElement) {
    if (!dialog || items.length === 0) return;
    current = index;
    returnFocus = trigger;
    dialog.showModal();
    open = true;
  }

  function step(delta: number) {
    if (items.length === 0) return;
    current = (current + delta + items.length) % items.length;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') step(1);
    else if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'Home') current = 0;
    else if (event.key === 'End') current = items.length - 1;
    else return;
    event.preventDefault();
  }

  function handleClose() {
    open = false;
    returnFocus?.focus();
    returnFocus = null;
  }

  function handleBackdropClick(event: MouseEvent) {
    // Clicks on the dialog element itself (not its content) land on the backdrop area.
    if (event.target === dialog) dialog?.close();
  }

  // Keeps the page behind the lightbox from scrolling while it is open.
  $effect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  });
</script>

{#snippet tile(item: { src: string; alt: string; caption: string }, index: number)}
  {@const ratio = ratioFor(index, visible(item.src))}
  {#if visible(item.src)}
    <img
      class="img"
      src={item.src}
      alt={item.alt}
      width={1200}
      height={ratio ? Math.round((1200 * ratio[1]) / ratio[0]) : 900}
      loading="lazy"
      decoding="async"
      style:aspect-ratio={ratio ? `${ratio[0]} / ${ratio[1]}` : undefined}
      onerror={() => (failed = { ...failed, [item.src]: true })}
    />
  {:else}
    <span class="placeholder" style:aspect-ratio={ratio ? `${ratio[0]} / ${ratio[1]}` : '4 / 3'}>
      <span class="ph-icon"><Icon name="Image" size={20} /></span>
      <span class="ph-label" data-prop={`images.${index}.alt`}>{item.alt || 'Add an image'}</span>
    </span>
  {/if}
{/snippet}

<div {...rest} class={['gallery', className]}>
  <ul
    class={['items', masonry ? 'layout-masonry' : 'layout-grid']}
    style:--cols={cols}
    style:--cols-tablet={Math.min(cols, 3)}
    style:--cols-mobile={2}
    style:--gallery-gap={gapValue}
  >
    {#each items as item, index (index)}
      <li class="item">
        <figure class="figure">
          {#if lightbox}
            <button
              type="button"
              class="thumb"
              aria-haspopup="dialog"
              aria-label={`Open image ${index + 1} of ${items.length}${item.alt ? `: ${item.alt}` : ''}`}
              onclick={(event) => openAt(index, event.currentTarget)}
            >
              {@render tile(item, index)}
              <span class="zoom" aria-hidden="true"><Icon name="MagnifyingGlassPlus" size={18} /></span>
            </button>
          {:else}
            <div class="thumb thumb--static">{@render tile(item, index)}</div>
          {/if}
          {#if item.caption}
            <figcaption class="caption" data-prop={`images.${index}.caption`}>{item.caption}</figcaption>
          {/if}
        </figure>
      </li>
    {/each}
  </ul>

  {#if lightbox}
    <dialog
      {@attach (el) => {
        dialog = el;
        return () => (dialog = undefined);
      }}
      class="lightbox"
      aria-labelledby="{uid}-counter"
      onclose={handleClose}
      onkeydown={handleKeydown}
      onclick={handleBackdropClick}
    >
      {#if open && active}
        <div class="lb-header">
          <p id="{uid}-counter" class="lb-counter" aria-live="polite">Image {current + 1} of {items.length}</p>
          <button type="button" class="lb-button" aria-label="Close" onclick={() => dialog?.close()}>
            <Icon name="X" size={22} />
          </button>
        </div>
        <div class="lb-stage">
          {#if items.length > 1}
            <button type="button" class="lb-button lb-nav lb-nav--prev" aria-label="Previous image" onclick={() => step(-1)}>
              <Icon name="CaretLeft" size={24} />
            </button>
          {/if}
          <figure class="lb-figure">
            {#if visible(active.src)}
              <img class="lb-img" src={active.src} alt={active.alt} width="1600" height="1200" />
            {:else}
              <span class="placeholder lb-placeholder">
                <span class="ph-icon"><Icon name="Image" size={24} /></span>
                <span class="ph-label">{active.alt || 'Add an image'}</span>
              </span>
            {/if}
            {#if active.caption}
              <figcaption class="lb-caption">{active.caption}</figcaption>
            {/if}
          </figure>
          {#if items.length > 1}
            <button type="button" class="lb-button lb-nav lb-nav--next" aria-label="Next image" onclick={() => step(1)}>
              <Icon name="CaretRight" size={24} />
            </button>
          {/if}
        </div>
      {/if}
    </dialog>
  {/if}
</div>

<style>
  .gallery {
    width: 100%;
  }
  .items {
    list-style: none;
  }
  .layout-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr));
    gap: var(--gallery-gap, 1rem);
  }
  .layout-masonry {
    column-count: var(--cols, 3);
    column-gap: var(--gallery-gap, 1rem);
  }
  .layout-masonry .item {
    break-inside: avoid;
    margin-bottom: var(--gallery-gap, 1rem);
  }
  @media (max-width: 1023px) {
    .layout-grid {
      grid-template-columns: repeat(var(--cols-tablet, 3), minmax(0, 1fr));
    }
    .layout-masonry {
      column-count: var(--cols-tablet, 3);
    }
  }
  @media (max-width: 767px) {
    .layout-grid {
      grid-template-columns: repeat(var(--cols-mobile, 2), minmax(0, 1fr));
    }
    .layout-masonry {
      column-count: var(--cols-mobile, 2);
    }
  }
  @media (max-width: 359px) {
    .layout-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .layout-masonry {
      column-count: 1;
    }
  }
  .figure {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .thumb {
    position: relative;
    display: block;
    width: 100%;
    padding: 0;
    overflow: hidden;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    background-color: var(--md-sys-color-surface-container-low);
  }
  button.thumb {
    cursor: zoom-in;
  }
  .thumb:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  button.thumb:hover .img {
    transform: scale(1.03);
  }
  .zoom {
    position: absolute;
    right: 0.625rem;
    bottom: 0.625rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--md-sys-color-on-surface);
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 92%, transparent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  button.thumb:hover .zoom,
  button.thumb:focus-visible .zoom {
    opacity: 1;
    transform: translateY(0);
  }
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container-low);
    background-image: radial-gradient(color-mix(in srgb, var(--md-sys-color-outline) 22%, transparent) 1px, transparent 1.5px);
    background-size: 18px 18px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: inherit;
  }
  .ph-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
  }
  .ph-label {
    max-width: 28ch;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .caption {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Lightbox */
  .lightbox {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: 0;
    border: 0;
    color: rgb(255, 255, 255);
    background: transparent;
    overflow: hidden;
  }
  .lightbox[open] {
    display: flex;
    flex-direction: column;
  }
  .lightbox::backdrop {
    background-color: rgba(8, 9, 12, 0.92);
  }
  .lb-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0.75rem 0.75rem 1.25rem;
  }
  .lb-counter {
    font-size: 0.875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.78);
    font-variant-numeric: tabular-nums;
  }
  .lb-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: rgb(255, 255, 255);
    background-color: rgba(255, 255, 255, 0.08);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .lb-button:hover {
    background-color: rgba(255, 255, 255, 0.18);
  }
  .lb-button:focus-visible {
    outline: 2px solid rgb(255, 255, 255);
    outline-offset: 2px;
  }
  .lb-stage {
    position: relative;
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    min-height: 0;
    padding: 0 1rem 1.5rem;
  }
  .lb-figure {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.875rem;
    min-width: 0;
    max-width: min(1200px, 100%);
    max-height: 100%;
  }
  .lb-img {
    display: block;
    width: auto;
    max-width: 100%;
    height: auto;
    max-height: calc(100dvh - 9rem);
    object-fit: contain;
    border-radius: var(--md-sys-shape-corner-small, 8px);
  }
  .lb-placeholder {
    width: min(960px, 80vw);
    aspect-ratio: 4 / 3;
    max-height: calc(100dvh - 9rem);
    border-radius: var(--md-sys-shape-corner-medium, 12px);
  }
  .lb-caption {
    max-width: 70ch;
    font-size: 0.9375rem;
    line-height: 1.5;
    text-align: center;
    color: rgba(255, 255, 255, 0.82);
  }
  @media (max-width: 767px) {
    .items .ph-icon {
      width: 32px;
      height: 32px;
    }
    .items .ph-label {
      font-size: 0.75rem;
    }
    .lb-stage {
      padding: 0 0.5rem 5rem;
    }
    .lb-nav {
      position: absolute;
      bottom: 1rem;
    }
    .lb-nav--prev {
      left: calc(50% - 52px);
    }
    .lb-nav--next {
      right: calc(50% - 52px);
    }
    .lb-placeholder {
      width: 100%;
    }
  }
</style>
