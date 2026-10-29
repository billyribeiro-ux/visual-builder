<script lang="ts" module>
  /** FNV-1a hash: the same name always maps to the same avatar colors (SSR and client). */
  function hashName(name: string): number {
    let hash = 2166136261;
    for (const ch of name) {
      hash ^= ch.codePointAt(0) ?? 0;
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = Array.from(parts[0])[0] ?? '';
    const last = parts.length > 1 ? (Array.from(parts[parts.length - 1])[0] ?? '') : '';
    return (first + last).toUpperCase();
  }

  /** Curated hues (blues, violets, pinks, teals): no muddy yellows or browns. */
  const AVATAR_HUES = [256, 290, 20, 315, 175, 345, 205, 230, 150, 270];

  /** Perceptually even OKLCH gradient (white initials keep >= 4.5:1 contrast for every hue). */
  function avatarGradient(name: string): string {
    const hue = AVATAR_HUES[hashName(name || '?') % AVATAR_HUES.length];
    return `linear-gradient(135deg, oklch(0.54 0.12 ${hue}), oklch(0.44 0.13 ${(hue + 20) % 360}))`;
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';
  import { MediaQuery } from 'svelte/reactivity';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';

  interface Testimonial {
    quote: string;
    author: string;
    role?: string;
    company?: string;
    avatarSrc?: string;
    rating?: number;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    testimonials?: Testimonial[];
    variant?: 'single-large' | 'cards-row';
    autoplay?: boolean;
    interval?: number;
    showRating?: boolean;
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'center',
    testimonials = [],
    variant = 'single-large',
    autoplay = false,
    interval = 6000,
    showRating = true,
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const reducedMotion = new MediaQuery('prefers-reduced-motion: reduce', false);
  const tablet = new MediaQuery('min-width: 768px', true);
  const desktop = new MediaQuery('min-width: 1024px', true);

  const items = $derived((Array.isArray(testimonials) ? testimonials : []).filter((t) => t && typeof t === 'object'));
  const count = $derived(items.length);
  const isRow = $derived(variant === 'cards-row');
  const centered = $derived(align === 'center');
  /** Cards visible at once (mirrors the CSS breakpoints of the cards-row track). */
  const perView = $derived(isRow ? Math.min(count, desktop.current ? 3 : tablet.current ? 2 : 1) || 1 : 1);
  const pages = $derived(Math.max(1, count - perView + 1));
  const pageIndexes = $derived(Array.from({ length: pages }, (_, i) => i));

  let selected = $state(0);
  const active = $derived(Math.min(Math.max(selected, 0), pages - 1));

  let userPaused = $state(false);
  let hovered = $state(false);
  let focused = $state(false);

  const autoplayEnabled = $derived(autoplay && pages > 1 && !reducedMotion.current);
  const rotating = $derived(autoplayEnabled && !userPaused && !hovered && !focused);
  const delay = $derived(Math.min(20000, Math.max(3000, Math.round(Number(interval) || 6000))));

  $effect(() => {
    if (!rotating) return;
    const next = (active + 1) % pages;
    const timer = setTimeout(() => {
      selected = next;
    }, delay);
    return () => clearTimeout(timer);
  });

  function go(index: number) {
    selected = (index + pages) % pages;
  }

  function ratingOf(item: Testimonial): number {
    const value = Math.round(Number(item.rating ?? 0));
    return Number.isFinite(value) ? Math.min(5, Math.max(0, value)) : 0;
  }

  /** Pause while hovered or while keyboard focus is inside (except on the rotation control). */
  const pauseOnInteraction: Attachment<HTMLElement> = (node) => {
    const enter = () => (hovered = true);
    const leave = () => (hovered = false);
    const focusIn = (event: FocusEvent) => {
      focused = !(event.target instanceof Element && event.target.closest('[data-rotation-control]'));
    };
    const focusOut = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !node.contains(event.relatedTarget)) focused = false;
    };
    node.addEventListener('mouseenter', enter);
    node.addEventListener('mouseleave', leave);
    node.addEventListener('focusin', focusIn);
    node.addEventListener('focusout', focusOut);
    return () => {
      node.removeEventListener('mouseenter', enter);
      node.removeEventListener('mouseleave', leave);
      node.removeEventListener('focusin', focusIn);
      node.removeEventListener('focusout', focusOut);
    };
  };

  /** Horizontal touch / pen swipes (> 40px) move to the next or previous position. */
  const swipe: Attachment<HTMLElement> = (node) => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') return;
      tracking = true;
      startX = event.clientX;
      startY = event.clientY;
    };
    const up = (event: PointerEvent) => {
      if (!tracking) return;
      tracking = false;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(active + (dx < 0 ? 1 : -1));
    };
    const cancel = () => (tracking = false);
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

<section {...rest} class={['tcar', `tcar--${isRow ? 'row' : 'single'}`, className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
  <div class="md-container md-container--xl">
    {#if eyebrow || heading || subheading}
      <header class={['head', centered && 'head--center']}>
        {#if eyebrow}
          <p class="md-eyebrow eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        {#if heading}
          <h2 id="{uid}-heading" class="heading" data-prop="heading">{heading}</h2>
        {/if}
        {#if subheading}
          <p class="subheading" data-prop="subheading">{subheading}</p>
        {/if}
      </header>
    {/if}

    {#if count > 0}
      <div
        class={['carousel', centered && 'carousel--center']}
        role="region"
        aria-roledescription="carousel"
        aria-label={heading || 'Testimonials'}
        {@attach pauseOnInteraction}
      >
        <div id="{uid}-slides" class="viewport" aria-live={rotating ? 'off' : 'polite'} {@attach swipe}>
          <div class="track" style:--index={active} style:--count={count}>
            {#each items as item, i (i)}
              {@const visible = i >= active && i < active + perView}
              {@const rating = ratingOf(item)}
              {@const avatar = safeSrc(item.avatarSrc)}
              <div
                class={['slide', visible && 'slide--active']}
                role="group"
                aria-roledescription="slide"
                aria-label="{i + 1} of {count}"
                aria-hidden={visible ? undefined : 'true'}
                inert={!visible}
              >
                <figure class="card">
                  {#if !isRow && !(showRating && rating > 0)}
                    <span class="quote-mark"><Icon name="Quotes" size={40} /></span>
                  {/if}
                  {#if showRating && rating > 0}
                    <div class="stars" role="img" aria-label="Rated {rating} out of 5">
                      {#each [1, 2, 3, 4, 5] as n (n)}
                        <span class={['star', n <= rating && 'star--on']}></span>
                      {/each}
                    </div>
                  {/if}
                  <blockquote class="quote">
                    <p data-prop={`testimonials.${i}.quote`}>{item.quote}</p>
                  </blockquote>
                  <figcaption class="person">
                    {#if avatar}
                      <img class="avatar" src={avatar} alt="" width="48" height="48" loading="lazy" />
                    {:else}
                      <span class="avatar avatar--initials" style:background-image={avatarGradient(item.author ?? '')} aria-hidden="true">
                        {initialsOf(item.author ?? '')}
                      </span>
                    {/if}
                    <span class="person-text">
                      <span class="name" data-prop={`testimonials.${i}.author`}>{item.author}</span>
                      {#if item.role || item.company}
                        <span class="meta">
                          {#if item.role}<span data-prop={`testimonials.${i}.role`}>{item.role}</span>{/if}{#if item.role && item.company},
                          {/if}{#if item.company}<span data-prop={`testimonials.${i}.company`}>{item.company}</span>{/if}
                        </span>
                      {/if}
                    </span>
                  </figcaption>
                </figure>
              </div>
            {/each}
          </div>
        </div>

        {#if pages > 1}
          <div class="controls">
            {#if autoplayEnabled}
              <button
                type="button"
                class="ctrl"
                data-rotation-control
                aria-label={userPaused ? 'Start automatic slide show' : 'Stop automatic slide show'}
                onclick={() => (userPaused = !userPaused)}
              >
                <Icon name={userPaused ? 'Play' : 'Pause'} size={16} />
              </button>
            {/if}
            <button type="button" class="ctrl" aria-controls="{uid}-slides" aria-label="Previous testimonial" onclick={() => go(active - 1)}>
              <Icon name="ArrowLeft" size={18} />
            </button>
            <div class="dots">
              {#each pageIndexes as p (p)}
                <button
                  type="button"
                  class={['dot', p === active && 'dot--active']}
                  aria-controls="{uid}-slides"
                  aria-label="Show testimonial {p + 1} of {pages}"
                  aria-current={p === active ? 'true' : undefined}
                  onclick={() => go(p)}
                ></button>
              {/each}
            </div>
            <button type="button" class="ctrl" aria-controls="{uid}-slides" aria-label="Next testimonial" onclick={() => go(active + 1)}>
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .tcar {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    padding: clamp(4rem, 3rem + 4vw, 6.5rem) 0;
  }

  /* Section header ------------------------------------------------------- */
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    max-width: 44rem;
    margin-bottom: clamp(2.5rem, 2rem + 2vw, 3.75rem);
  }
  .head--center {
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }
  .heading {
    font-size: clamp(1.875rem, 1.35rem + 1.9vw, 2.75rem);
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.025em;
    color: var(--md-sys-color-on-surface);
    text-wrap: balance;
  }
  .subheading {
    font-size: 1.0625rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  /* Viewport + track ------------------------------------------------------ */
  .viewport {
    position: relative;
    overflow: hidden;
    touch-action: pan-y;
  }
  .tcar--single .track {
    display: grid;
  }
  .tcar--single .slide {
    grid-area: 1 / 1;
    opacity: 0;
    visibility: hidden;
    transition:
      opacity 450ms var(--sc-ease),
      visibility 0s linear 450ms;
  }
  .tcar--single .slide--active {
    opacity: 1;
    visibility: visible;
    transition: opacity 450ms var(--sc-ease);
  }

  .tcar--row .viewport {
    /* Room for card shadows inside the clipped viewport. */
    padding: 0.5rem;
    margin: -0.5rem;
  }
  .tcar--row .track {
    --gap: 1.5rem;
    --per-view: 1;
    --pv: min(var(--per-view), var(--count));
    display: flex;
    gap: var(--gap);
    transform: translateX(calc(var(--index) * -1 * (100% + var(--gap)) / var(--pv)));
    transition: transform 550ms var(--sc-ease);
  }
  .tcar--row .slide {
    display: flex;
    flex: 0 0 calc((100% - (var(--pv) - 1) * var(--gap)) / var(--pv));
    min-width: 0;
  }
  @media (min-width: 768px) {
    .tcar--row .track {
      --per-view: 2;
    }
  }
  @media (min-width: 1024px) {
    .tcar--row .track {
      --gap: 2rem;
      --per-view: 3;
    }
  }

  /* Single large quote ---------------------------------------------------- */
  .tcar--single .card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1.75rem;
    max-width: 60rem;
    margin: 0 auto;
    padding: clamp(2rem, 1.25rem + 3.5vw, 4rem);
    border: 1px solid var(--sc-border);
    border-radius: 1.5rem;
    background-color: var(--md-sys-color-surface-container-low);
  }
  .tcar--single .carousel--center .card {
    align-items: center;
    text-align: center;
  }
  .quote-mark {
    display: inline-flex;
    color: var(--md-sys-color-primary);
    opacity: 0.9;
    margin-bottom: -0.5rem;
  }
  .tcar--single .quote {
    font-size: clamp(1.25rem, 1rem + 1vw, 1.75rem);
    line-height: 1.45;
    font-weight: 500;
    letter-spacing: -0.015em;
    color: var(--md-sys-color-on-surface);
    text-wrap: pretty;
  }

  /* Row of cards ---------------------------------------------------------- */
  .tcar--row .card {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    width: 100%;
    padding: 1.75rem;
    border: 1px solid var(--sc-border);
    border-radius: 1rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 4px 16px rgba(0, 0, 0, 0.04);
  }
  .tcar--row .quote {
    flex: 1;
    font-size: 1rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface);
  }
  .tcar--row .person {
    padding-top: 1.25rem;
    border-top: 1px solid var(--sc-border);
  }

  /* Shared pieces --------------------------------------------------------- */
  .stars {
    display: inline-flex;
    gap: 3px;
  }
  .star {
    width: 18px;
    height: 18px;
    background-color: var(--md-sys-color-outline-variant);
    clip-path: polygon(50% 0%, 61.8% 35.3%, 98% 35.3%, 68.5% 57.1%, 79.4% 91.2%, 50% 70.4%, 20.6% 91.2%, 31.5% 57.1%, 2% 35.3%, 38.2% 35.3%);
  }
  .star--on {
    background-color: var(--md-sys-color-primary);
  }
  .person {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    text-align: left;
  }
  .avatar {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    object-fit: cover;
  }
  .avatar--initials {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .person-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
  }
  .meta {
    font-size: 0.875rem;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* Controls -------------------------------------------------------------- */
  .controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 2rem;
  }
  .carousel--center .controls {
    justify-content: center;
  }
  .ctrl {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: 1px solid var(--sc-border);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    transition:
      background-color 150ms var(--sc-ease),
      border-color 150ms var(--sc-ease);
  }
  .ctrl:hover {
    background-color: var(--md-sys-color-surface-container);
    border-color: var(--md-sys-color-outline-variant);
  }
  .dots {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding: 0 0.25rem;
  }
  .dot {
    position: relative;
    width: 28px;
    height: 40px;
  }
  .dot::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-outline-variant);
    transform: translate(-50%, -50%);
    transition:
      width 250ms var(--sc-ease),
      background-color 250ms var(--sc-ease);
  }
  .dot:hover::before {
    background-color: var(--md-sys-color-outline);
  }
  .dot--active::before,
  .dot--active:hover::before {
    width: 22px;
    background-color: var(--md-sys-color-primary);
  }
</style>
