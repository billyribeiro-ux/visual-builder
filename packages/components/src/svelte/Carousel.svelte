<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';
  import { MediaQuery } from 'svelte/reactivity';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface Slide {
    src?: string;
    alt?: string;
    title?: string;
    text?: string;
    ctaText?: string;
    ctaHref?: string;
  }

  type Ratio = '21:9' | '16:9' | '3:2' | '4:3' | '1:1';
  type Overlay = 'gradient' | 'center' | 'below' | 'none';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    slides?: Slide[];
    autoplay?: boolean;
    /** Milliseconds per slide while autoplaying (clamped to 2000–30000). */
    interval?: number;
    showArrows?: boolean;
    showDots?: boolean;
    loop?: boolean;
    aspectRatio?: Ratio;
    /** How slide copy is presented: over a bottom gradient, centered over a tint, below the image, or hidden. */
    overlay?: Overlay;
    class?: string;
  }

  let {
    slides = [],
    autoplay = false,
    interval = 6000,
    showArrows = true,
    showDots = true,
    loop = true,
    aspectRatio = '16:9',
    overlay = 'gradient',
    class: className = '',
    ...rest
  }: Props = $props();

  const RATIOS: Record<Ratio, [number, number]> = { '21:9': [21, 9], '16:9': [16, 9], '3:2': [3, 2], '4:3': [4, 3], '1:1': [1, 1] };
  const OVERLAYS: readonly Overlay[] = ['gradient', 'center', 'below', 'none'];

  const uid = $props.id();
  const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)', false);

  let index = $state(0);
  let userPaused = $state(false);
  let hovered = $state(false);
  let focusWithin = $state(false);
  let failed = $state<Record<string, true>>({});

  const list = $derived(
    (Array.isArray(slides) ? slides : [])
      .filter((slide) => slide && typeof slide === 'object')
      .map((slide) => ({
        src: safeSrc(slide.src),
        alt: slide.alt ?? '',
        title: slide.title ?? '',
        text: slide.text ?? '',
        ctaText: slide.ctaText ?? '',
        ctaHref: slide.ctaHref ?? ''
      }))
  );
  const count = $derived(list.length);
  const active = $derived(count === 0 ? 0 : Math.min(Math.max(index, 0), count - 1));
  const mode = $derived(OVERLAYS.includes(overlay) ? overlay : 'gradient');
  const ratio = $derived(RATIOS[aspectRatio] ?? RATIOS['16:9']);
  const canRotate = $derived(autoplay && count > 1 && !reducedMotion.current);
  /** Without looping, rotation ends on the last slide. */
  const atEnd = $derived(!loop && active >= count - 1);
  /** Rotation is on unless the visitor paused it; hover and keyboard focus suspend it temporarily. */
  const rotating = $derived(canRotate && !userPaused && !atEnd);
  const ticking = $derived(rotating && !hovered && !focusWithin);
  const delay = $derived(Math.min(30000, Math.max(2000, Math.round(Number(interval) || 6000))));

  function goTo(target: number) {
    if (count === 0) return;
    if (loop) index = (target + count) % count;
    else index = Math.min(Math.max(target, 0), count - 1);
  }

  const canPrev = $derived(loop || active > 0);
  const canNext = $derived(loop || active < count - 1);

  // Autoplay timer: re-created whenever rotation starts/stops or the slide changes.
  $effect(() => {
    if (!ticking) return;
    const timer = setTimeout(() => goTo(active + 1), delay);
    return () => clearTimeout(timer);
  });

  function toggleRotation() {
    if (rotating) {
      userPaused = true;
      return;
    }
    if (atEnd) goTo(0);
    userPaused = false;
  }

  /** Tablist keyboard model: arrows move (and activate) the selected slide, Home/End jump. */
  function handleTabKeydown(event: KeyboardEvent) {
    let target: number;
    if (event.key === 'ArrowRight') target = active + 1;
    else if (event.key === 'ArrowLeft') target = active - 1;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = count - 1;
    else return;
    event.preventDefault();
    const next = loop ? (target + count) % count : Math.min(Math.max(target, 0), count - 1);
    goTo(next);
    const tabs = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs?.[next]?.focus();
  }

  function handleArrowKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' && canNext) goTo(active + 1);
    else if (event.key === 'ArrowLeft' && canPrev) goTo(active - 1);
    else return;
    event.preventDefault();
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !(event.currentTarget as HTMLElement).contains(next)) focusWithin = false;
  }

  /** Touch / pen swipe of 48px or more changes the slide (mouse users have the arrows). */
  const swipe: Attachment<HTMLElement> = (node) => {
    let startX: number | null = null;
    const down = (event: PointerEvent) => {
      startX = event.pointerType === 'mouse' ? null : event.clientX;
    };
    const up = (event: PointerEvent) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) < 48) return;
      if (dx < 0 && canNext) goTo(active + 1);
      if (dx > 0 && canPrev) goTo(active - 1);
    };
    const cancel = () => (startX = null);
    node.addEventListener('pointerdown', down);
    node.addEventListener('pointerup', up);
    node.addEventListener('pointercancel', cancel);
    return () => {
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', cancel);
    };
  };
</script>

<section
  {...rest}
  class={['carousel', `overlay-${mode}`, className]}
  aria-roledescription="carousel"
  aria-label="Highlights"
  onmouseenter={() => (hovered = true)}
  onmouseleave={() => (hovered = false)}
  onfocusin={() => (focusWithin = true)}
  onfocusout={handleFocusOut}
>
  {#if canRotate}
    <button
      type="button"
      class="rotation"
      aria-label={rotating ? 'Stop automatic slide show' : 'Start automatic slide show'}
      onclick={toggleRotation}
    >
      <Icon name={rotating ? 'Pause' : 'Play'} size={18} />
    </button>
  {/if}

  <div
    class="viewport"
    style:--ratio="{ratio[0]} / {ratio[1]}"
    style:--ratio-inverse={ratio[1] / ratio[0]}
    {@attach swipe}
  >
    <div id="{uid}-slides" class="track" aria-live={ticking ? 'off' : 'polite'} style:transform="translateX({active * -100}%)">
      {#each list as slide, i (i)}
        {@const hasCopy = mode !== 'none' && Boolean(slide.title || slide.text || slide.ctaText)}
        {@const showImage = slide.src !== '' && !failed[slide.src]}
        <div
          id="{uid}-slide-{i}"
          class="slide"
          role={showDots && count > 1 ? 'tabpanel' : 'group'}
          aria-roledescription="slide"
          aria-label="{i + 1} of {count}"
          aria-hidden={i !== active}
          inert={i !== active}
        >
          <div class="media">
            {#if showImage}
              <img
                class="img"
                src={slide.src}
                alt={slide.alt}
                width={1600}
                height={Math.round((1600 * ratio[1]) / ratio[0])}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onerror={() => (failed = { ...failed, [slide.src]: true })}
              />
            {:else}
              <div class="placeholder" role={slide.alt ? 'img' : undefined} aria-label={slide.alt || undefined}>
                <span class="ph-icon"><Icon name="Image" size={22} /></span>
                <span class="ph-label" data-prop={`slides.${i}.alt`}>{slide.alt || 'Add an image'}</span>
              </div>
            {/if}
          </div>
          {#if hasCopy}
            <div class="copy">
              {#if slide.title}
                <h3 class="title" data-prop={`slides.${i}.title`}>{slide.title}</h3>
              {/if}
              {#if slide.text}
                <p class="text" data-prop={`slides.${i}.text`}>{slide.text}</p>
              {/if}
              {#if slide.ctaText}
                <a href={safeHref(slide.ctaHref)} class="cta">
                  <span data-prop={`slides.${i}.ctaText`}>{slide.ctaText}</span>
                  <Icon name="ArrowRight" size={16} />
                </a>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    {#if showArrows && count > 1}
      <button
        type="button"
        class="arrow arrow--prev"
        aria-label="Previous slide"
        aria-controls="{uid}-slides"
        disabled={!canPrev}
        onclick={() => goTo(active - 1)}
        onkeydown={handleArrowKeydown}
      >
        <Icon name="CaretLeft" size={20} />
      </button>
      <button
        type="button"
        class="arrow arrow--next"
        aria-label="Next slide"
        aria-controls="{uid}-slides"
        disabled={!canNext}
        onclick={() => goTo(active + 1)}
        onkeydown={handleArrowKeydown}
      >
        <Icon name="CaretRight" size={20} />
      </button>
    {/if}
  </div>

  {#if showDots && count > 1}
    <div class="dots" role="tablist" aria-label="Choose slide">
      {#each list as slide, i (i)}
        <button
          type="button"
          role="tab"
          class="dot"
          aria-selected={i === active}
          aria-controls="{uid}-slide-{i}"
          aria-label={`Slide ${i + 1}${slide.title ? `: ${slide.title}` : ''}`}
          tabindex={i === active ? 0 : -1}
          onclick={() => goTo(i)}
          onkeydown={handleTabKeydown}
        >
          <span class="dot-mark" aria-hidden="true"></span>
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .carousel {
    position: relative;
    width: 100%;
  }
  .viewport {
    position: relative;
    overflow: hidden;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    container-type: inline-size;
    touch-action: pan-y;
  }
  .overlay-below .viewport {
    border-radius: 0;
  }
  .track {
    display: flex;
    align-items: stretch;
    transition: transform 520ms var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    will-change: transform;
  }
  .slide {
    position: relative;
    flex: 0 0 100%;
    min-width: 0;
    display: grid;
  }
  .media {
    position: relative;
    grid-area: 1 / 1;
    /* Items with an aspect-ratio do not stretch by default; the image must fill a slide grown by its copy. */
    align-self: stretch;
    overflow: hidden;
    aspect-ratio: var(--ratio, 16 / 9);
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 90%, var(--md-sys-color-primary));
  }
  .img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    padding: 1rem;
    text-align: center;
    color: rgba(255, 255, 255, 0.72);
    background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1.5px);
    background-size: 20px 20px;
  }
  .ph-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: rgb(255, 255, 255);
    background-color: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }
  .ph-label {
    max-width: 32ch;
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
  }
  /* Copy over the image: the gradient keeps white text at WCAG AA contrast on any photo. */
  .overlay-gradient .media::after,
  .overlay-center .media::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .overlay-gradient .media::after {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.62) 38%, rgba(0, 0, 0, 0.12) 72%, rgba(0, 0, 0, 0) 100%);
  }
  .overlay-center .media::after {
    background-color: rgba(0, 0, 0, 0.55);
  }
  .overlay-gradient .placeholder {
    justify-content: flex-start;
    padding-top: clamp(1.5rem, 6cqw, 3.5rem);
  }
  .overlay-center .placeholder .ph-label,
  .overlay-gradient .placeholder .ph-label {
    display: none;
  }
  .copy {
    position: relative;
    z-index: 1;
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
    padding: clamp(1.25rem, 5cqw, 3.5rem);
    padding-bottom: clamp(2.75rem, 6cqw, 3.75rem);
    color: rgb(255, 255, 255);
  }
  .overlay-gradient .copy {
    align-self: end;
    max-width: 46rem;
  }
  .overlay-center .copy {
    align-self: center;
    justify-self: center;
    align-items: center;
    max-width: 44rem;
    text-align: center;
  }
  .overlay-below .media {
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .overlay-below .placeholder,
  .overlay-none .placeholder {
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container-low);
    background-image: radial-gradient(color-mix(in srgb, var(--md-sys-color-outline) 22%, transparent) 1px, transparent 1.5px);
    background-size: 18px 18px;
  }
  .overlay-below .ph-icon,
  .overlay-none .ph-icon {
    color: var(--md-sys-color-on-surface-variant);
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow: inset 0 0 0 1px var(--md-sys-color-outline-variant);
  }
  .overlay-none .media {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .overlay-below .slide {
    grid-template-rows: auto auto;
  }
  .overlay-below .copy {
    grid-area: 2 / 1;
    padding: 1.25rem 0 0;
    color: inherit;
  }
  .title {
    font-size: clamp(1.375rem, 0.9rem + 2.4cqw, 2.25rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.024em;
    text-wrap: balance;
  }
  .overlay-below .title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.012em;
  }
  .text {
    max-width: 52ch;
    font-size: clamp(0.9375rem, 0.85rem + 0.5cqw, 1.125rem);
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.88);
  }
  .overlay-below .text {
    font-size: 0.9375rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    margin-top: 0.5rem;
    padding: 0 1.25rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.9375rem;
    font-weight: 600;
    color: rgb(17, 17, 20);
    background-color: rgb(255, 255, 255);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .cta:hover {
    transform: translateY(-1px);
  }
  .cta:focus-visible {
    outline: 2px solid rgb(255, 255, 255);
    outline-offset: 3px;
  }
  .overlay-below .cta {
    margin-top: 0.25rem;
    padding: 0;
    min-height: 40px;
    color: var(--md-sys-color-primary);
    background-color: transparent;
    box-shadow: none;
  }
  .overlay-below .cta:focus-visible {
    outline-color: var(--md-sys-color-primary);
  }
  .arrow {
    position: absolute;
    z-index: 2;
    top: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-top: -22px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: rgb(17, 17, 20);
    background-color: rgba(255, 255, 255, 0.92);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.12),
      0 6px 16px rgba(0, 0, 0, 0.18);
    transition:
      opacity var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .overlay-below .arrow {
    /* Centered on the image, not on image + copy. */
    top: calc(100cqw * var(--ratio-inverse, 0.5625) / 2);
  }
  .arrow--prev {
    left: 1rem;
  }
  .arrow--next {
    right: 1rem;
  }
  .arrow:hover:not(:disabled) {
    transform: scale(1.05);
  }
  .arrow:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .arrow:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
  .rotation {
    position: absolute;
    z-index: 3;
    top: 0.875rem;
    left: 0.875rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: rgb(255, 255, 255);
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(6px);
  }
  .rotation:focus-visible {
    outline: 2px solid rgb(255, 255, 255);
    outline-offset: 2px;
  }
  .dots {
    display: flex;
    justify-content: center;
    gap: 0.25rem;
    margin-top: 0.75rem;
  }
  .dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
  }
  .dot-mark {
    width: 8px;
    height: 8px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 24%, transparent);
    transition:
      width var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .dot:hover .dot-mark {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 45%, transparent);
  }
  .dot[aria-selected='true'] .dot-mark {
    width: 24px;
    background-color: var(--md-sys-color-primary);
  }
  .dot:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: -2px;
  }
  @media (max-width: 767px) {
    .overlay-gradient .slide,
    .overlay-center .slide {
      min-height: 22rem;
    }
    .arrow {
      width: 40px;
      height: 40px;
      margin-top: -20px;
    }
    .arrow--prev {
      left: 0.5rem;
    }
    .arrow--next {
      right: 0.5rem;
    }
    .overlay-gradient .arrow,
    .overlay-center .arrow {
      top: 2.25rem;
      margin-top: 0;
    }
    .overlay-gradient .arrow--prev,
    .overlay-center .arrow--prev {
      left: auto;
      right: 3.25rem;
    }
    .dot {
      width: 40px;
      height: 40px;
    }
    .copy {
      padding-right: 1.25rem;
    }
  }
</style>
