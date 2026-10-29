<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  type Ratio = 'auto' | '1:1' | '4:3' | '3:2' | '16:9' | '21:9';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    imageUrl?: string;
    alt?: string;
    /** Purely visual image: empty alt and hidden from assistive technology. */
    decorative?: boolean;
    caption?: string;
    href?: string;
    aspectRatio?: Ratio;
    fit?: 'cover' | 'contain';
    radius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
    shadow?: boolean;
    loading?: 'lazy' | 'eager';
    class?: string;
  }

  let {
    imageUrl = '',
    alt = '',
    decorative = false,
    caption = '',
    href = '',
    aspectRatio = '16:9',
    fit = 'cover',
    radius = 'md',
    shadow = false,
    loading = 'lazy',
    class: className = '',
    ...rest
  }: Props = $props();

  /** `"4:3"` → `[4, 3]`; anything else (including `"auto"`) → null. */
  function parseRatio(value: string): [number, number] | null {
    const match = /^(\d{1,2}):(\d{1,2})$/.exec(value);
    if (!match) return null;
    const w = Number(match[1]);
    const h = Number(match[2]);
    return w > 0 && h > 0 ? [w, h] : null;
  }

  const src = $derived(safeSrc(imageUrl));
  /** The URL that failed to load (a new URL gets a fresh attempt). */
  let failedSrc = $state<string | null>(null);
  const showImage = $derived(src !== '' && failedSrc !== src);
  const ratio = $derived(parseRatio(aspectRatio));
  const cssRatio = $derived(ratio ? `${ratio[0]} / ${ratio[1]}` : undefined);
  // Intrinsic size hints: the browser reserves this ratio before the image loads (no layout shift).
  const width = 1600;
  const height = $derived(ratio ? Math.round((width * ratio[1]) / ratio[0]) : 900);
  const altText = $derived(decorative ? '' : alt);
</script>

{#snippet media()}
  {#if showImage}
    <img
      {src}
      alt={altText}
      {width}
      {height}
      {loading}
      fetchpriority={loading === 'eager' ? 'high' : undefined}
      decoding="async"
      class={['img', fit === 'contain' ? 'fit-contain' : 'fit-cover']}
      style:aspect-ratio={cssRatio}
      onerror={() => (failedSrc = src)}
    />
  {:else}
    <div
      class="placeholder"
      style:aspect-ratio={cssRatio ?? '16 / 9'}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : alt || 'Image placeholder'}
      aria-hidden={decorative ? 'true' : undefined}
    >
      <span class="ph-icon"><Icon name="Image" size={22} /></span>
      <span class="ph-label" data-prop="alt">{alt || 'Add an image'}</span>
    </div>
  {/if}
{/snippet}

<figure {...rest} class={['image', `radius-${radius}`, shadow && 'has-shadow', className]}>
  {#if href}
    <a href={safeHref(href)} class="frame frame--link">{@render media()}</a>
  {:else}
    <div class="frame">{@render media()}</div>
  {/if}
  {#if caption}
    <figcaption class="caption" data-prop="caption">{caption}</figcaption>
  {/if}
</figure>

<style>
  .image {
    display: block;
    width: 100%;
  }
  .frame {
    display: block;
    position: relative;
    overflow: hidden;
    border-radius: var(--frame-radius, 0px);
    background-color: var(--md-sys-color-surface-container-low);
    isolation: isolate;
  }
  .radius-none {
    --frame-radius: 0px;
  }
  .radius-sm {
    --frame-radius: var(--md-sys-shape-corner-small, 8px);
  }
  .radius-md {
    --frame-radius: var(--md-sys-shape-corner-medium, 12px);
  }
  .radius-lg {
    --frame-radius: var(--md-sys-shape-corner-extra-large, 28px);
  }
  .radius-full {
    --frame-radius: var(--md-sys-shape-corner-full, 9999px);
  }
  .has-shadow .frame {
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.06),
      0 12px 32px -8px rgba(0, 0, 0, 0.18);
  }
  .img {
    display: block;
    width: 100%;
    height: auto;
  }
  .fit-cover {
    object-fit: cover;
  }
  .fit-contain {
    object-fit: contain;
  }
  .frame--link .img {
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .frame--link:hover .img {
    transform: scale(1.02);
  }
  .frame--link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 3px;
  }
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    width: 100%;
    padding: 1rem;
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container-low);
    background-image: radial-gradient(color-mix(in srgb, var(--md-sys-color-outline) 22%, transparent) 1px, transparent 1.5px);
    background-size: 18px 18px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: inherit;
    text-align: center;
  }
  .ph-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .ph-label {
    max-width: 32ch;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }
  .caption {
    margin-top: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
