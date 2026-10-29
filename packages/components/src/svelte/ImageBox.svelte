<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  type Ratio = '1:1' | '4:3' | '3:2' | '16:9' | '4:5';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    imageUrl?: string;
    imageAlt?: string;
    aspectRatio?: Ratio;
    title?: string;
    description?: string;
    ctaText?: string;
    ctaHref?: string;
    variant?: 'plain' | 'card' | 'overlay';
    class?: string;
  }

  let {
    imageUrl = '',
    imageAlt = '',
    aspectRatio = '3:2',
    title = 'Collaborate in real time',
    description = '',
    ctaText = '',
    ctaHref = '',
    variant = 'card',
    class: className = '',
    ...rest
  }: Props = $props();

  const RATIOS: Record<Ratio, [number, number]> = { '1:1': [1, 1], '4:3': [4, 3], '3:2': [3, 2], '16:9': [16, 9], '4:5': [4, 5] };

  const src = $derived(safeSrc(imageUrl));
  let failedSrc = $state<string | null>(null);
  const showImage = $derived(src !== '' && failedSrc !== src);
  const ratio = $derived(RATIOS[aspectRatio] ?? RATIOS['3:2']);
  const kind = $derived(variant === 'plain' || variant === 'overlay' ? variant : 'card');
</script>

<article {...rest} class={['image-box', `variant-${kind}`, className]} style:--ratio="{ratio[0]} / {ratio[1]}">
  <div class="media">
    {#if showImage}
      <img
        {src}
        alt={imageAlt}
        width={1200}
        height={Math.round((1200 * ratio[1]) / ratio[0])}
        loading="lazy"
        decoding="async"
        class="img"
        onerror={() => (failedSrc = src)}
      />
    {:else}
      <div class="placeholder" role={imageAlt ? 'img' : undefined} aria-label={imageAlt || undefined}>
        <span class="ph-icon"><Icon name="Image" size={22} /></span>
        <span class="ph-label" data-prop="imageAlt">{imageAlt || 'Add an image'}</span>
      </div>
    {/if}
  </div>
  <div class="content">
    {#if title}
      <h3 class="title" data-prop="title">{title}</h3>
    {/if}
    {#if description}
      <p class="description" data-prop="description">{description}</p>
    {/if}
    {#if ctaText}
      <a href={safeHref(ctaHref)} class="cta">
        <span data-prop="ctaText">{ctaText}</span>
        <Icon name="ArrowRight" size={16} class="arrow" />
      </a>
    {/if}
  </div>
</article>

<style>
  .image-box {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .media {
    position: relative;
    overflow: hidden;
    aspect-ratio: var(--ratio, 3 / 2);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    width: 100%;
    height: 100%;
    padding: 1rem;
    text-align: center;
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container-low);
    background-image: radial-gradient(color-mix(in srgb, var(--md-sys-color-outline) 22%, transparent) 1px, transparent 1.5px);
    background-size: 18px 18px;
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
  .content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .title {
    font-size: 1.1875rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.012em;
  }
  .description {
    font-size: 0.9375rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-primary);
  }
  .cta :global(.arrow) {
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .cta:hover :global(.arrow) {
    transform: translateX(3px);
  }
  .cta:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
    border-radius: var(--md-sys-shape-corner-extra-small, 4px);
  }

  /* Plain: rounded image, copy below. */
  .variant-plain .media {
    border-radius: var(--md-sys-shape-corner-large, 16px);
  }
  .variant-plain .content {
    padding-top: 1.25rem;
  }

  /* Card: bordered surface, image flush on top. */
  .variant-card {
    overflow: hidden;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .variant-card .media {
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
  }
  .variant-card .content {
    flex: 1 1 auto;
    padding: 1.5rem;
  }
  /* Overlay: copy on the image over a bottom scrim (white text stays AA on any image). */
  .variant-overlay {
    justify-content: flex-end;
    overflow: hidden;
    aspect-ratio: var(--ratio, 3 / 2);
    min-height: 320px;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    color: #ffffff;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 90%, var(--md-sys-color-primary));
  }
  .variant-overlay .media {
    position: absolute;
    inset: 0;
    aspect-ratio: auto;
    background-color: transparent;
  }
  .variant-overlay .media::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.86) 0%,
      rgba(0, 0, 0, 0.7) 40%,
      rgba(0, 0, 0, 0.25) 75%,
      rgba(0, 0, 0, 0.05) 100%
    );
    pointer-events: none;
  }
  .variant-overlay .placeholder {
    justify-content: flex-start;
    padding-top: 2rem;
    color: rgba(255, 255, 255, 0.78);
    background-color: transparent;
    background-image: radial-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1.5px);
  }
  .variant-overlay .ph-icon {
    color: #ffffff;
    background-color: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
  .variant-overlay .content {
    position: relative;
    z-index: 1;
    padding: 1.75rem;
  }
  .variant-overlay .description {
    color: rgba(255, 255, 255, 0.88);
  }
  .variant-overlay .cta {
    color: #ffffff;
  }
  .variant-overlay .cta:focus-visible {
    outline-color: #ffffff;
  }

</style>
