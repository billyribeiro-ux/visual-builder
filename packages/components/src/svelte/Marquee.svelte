<script lang="ts" module>
  const SEPARATOR_ICONS: Record<string, string> = { sparkle: 'Sparkle', star: 'Star', diamond: 'Diamond' };
  const SECONDS_PER_ITEM: Record<string, number> = { slow: 6, normal: 4, fast: 2.5 };
  const WORDMARK_GLYPHS = ['Hexagon', 'Circle', 'Triangle', 'Diamond', 'Square', 'Atom', 'Cube', 'Planet', 'Leaf', 'Lightning'];

  /** Deterministic glyph per wordmark name (same name, same mark). */
  function glyphFor(name: string): string {
    let hash = 2166136261;
    for (const ch of name) {
      hash ^= ch.codePointAt(0) ?? 0;
      hash = Math.imul(hash, 16777619);
    }
    return WORDMARK_GLYPHS[(hash >>> 0) % WORDMARK_GLYPHS.length];
  }
</script>

<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';

  interface Logo {
    name: string;
    imageUrl?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    align?: 'left' | 'center';
    variant?: 'text' | 'logos';
    items?: string[];
    logos?: Logo[];
    speed?: 'slow' | 'normal' | 'fast';
    direction?: 'left' | 'right';
    pauseOnHover?: boolean;
    separator?: 'none' | 'dot' | 'sparkle' | 'star' | 'diamond' | 'slash';
    size?: 'sm' | 'md' | 'lg';
    fadeEdges?: boolean;
    class?: string;
  }

  let {
    eyebrow = '',
    heading = '',
    subheading = '',
    align = 'center',
    variant = 'text',
    items = [],
    logos = [],
    speed = 'normal',
    direction = 'left',
    pauseOnHover = true,
    separator = 'sparkle',
    size = 'md',
    fadeEdges = true,
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  let paused = $state(false);

  const isLogos = $derived(variant === 'logos');
  const phrases = $derived((Array.isArray(items) ? items : []).filter((t) => typeof t === 'string'));
  const marks = $derived((Array.isArray(logos) ? logos : []).filter((l) => l && typeof l === 'object'));
  const count = $derived(isLogos ? marks.length : phrases.length);
  const duration = $derived(Math.max(8, count * (SECONDS_PER_ITEM[speed] ?? 4)));
  const sizeClass = $derived(size === 'sm' || size === 'lg' ? size : 'md');
  const centered = $derived(align === 'center');
</script>

<section {...rest} class={['marquee-section', className]} aria-labelledby={heading ? `${uid}-heading` : undefined}>
  {#if eyebrow || heading || subheading}
    <div class="md-container md-container--xl">
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
    </div>
  {/if}

  {#if count > 0}
    <div class={['wrap', paused && 'wrap--paused']}>
      <div
        class={[
          'marquee',
          `marquee--${sizeClass}`,
          direction === 'right' && 'marquee--reverse',
          pauseOnHover && 'marquee--hover-pause',
          fadeEdges && 'marquee--fade',
          isLogos && 'marquee--logos'
        ]}
        style:--duration="{duration}s"
      >
        {#each [0, 1] as copy (copy)}
          <ul class="group" aria-hidden={copy === 1 ? 'true' : undefined}>
            {#if isLogos}
              {#each marks as logo, i (i)}
                {@const src = safeSrc(logo.imageUrl)}
                <li class="item">
                  {#if src}
                    <img class="logo" src={src} alt={copy === 0 ? logo.name : ''} width="128" height="32" loading="lazy" />
                  {:else}
                    <span class="wordmark">
                      <Icon name={glyphFor(logo.name ?? '')} size={24} />
                      <span data-prop={copy === 0 ? `logos.${i}.name` : undefined}>{logo.name}</span>
                    </span>
                  {/if}
                </li>
              {/each}
            {:else}
              {#each phrases as text, i (i)}
                <li class="item">
                  <span class="phrase" data-prop={copy === 0 ? `items.${i}` : undefined}>{text}</span>
                  {#if separator !== 'none'}
                    <span class={['sep', `sep--${separator}`]} aria-hidden="true">
                      {#if SEPARATOR_ICONS[separator]}
                        <Icon name={SEPARATOR_ICONS[separator]} size={sizeClass === 'lg' ? 26 : 18} />
                      {:else if separator === 'slash'}
                        /
                      {/if}
                    </span>
                  {/if}
                </li>
              {/each}
            {/if}
          </ul>
        {/each}
      </div>
      <button type="button" class="toggle" aria-pressed={paused} onclick={() => (paused = !paused)}>
        <Icon name={paused ? 'Play' : 'Pause'} size={14} />
        <span class="sr-only">Pause scrolling</span>
      </button>
    </div>
  {/if}
</section>

<style>
  .marquee-section {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    padding: clamp(2.5rem, 2rem + 2vw, 4rem) 0;
    overflow: hidden;
  }

  /* Section header ------------------------------------------------------- */
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
    max-width: 44rem;
    margin-bottom: clamp(2rem, 1.5rem + 1.5vw, 3rem);
  }
  .head--center {
    align-items: center;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }
  .heading {
    font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem);
    font-weight: 700;
    line-height: 1.15;
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

  /* Track ------------------------------------------------------------------ */
  .wrap {
    position: relative;
  }
  .marquee {
    --gap: 2rem;
    display: flex;
    gap: var(--gap);
    overflow: hidden;
    user-select: none;
  }
  .marquee--sm {
    --gap: 1.75rem;
  }
  .marquee--lg {
    --gap: 2.5rem;
  }
  @media (min-width: 768px) {
    .marquee {
      --gap: 2.5rem;
    }
    .marquee--sm {
      --gap: 2rem;
    }
    .marquee--lg {
      --gap: 3rem;
    }
  }
  .marquee--fade {
    mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  }
  .group {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-around;
    gap: var(--gap);
    min-width: 100%;
    list-style: none;
    animation: marquee-scroll var(--duration, 32s) linear infinite;
  }
  .marquee--reverse .group {
    animation-direction: reverse;
  }
  .marquee--hover-pause:hover .group,
  .marquee:focus-within .group,
  .wrap--paused .group {
    animation-play-state: paused;
  }
  @keyframes marquee-scroll {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(calc(-100% - var(--gap)));
    }
  }

  /* Items ------------------------------------------------------------------ */
  .item {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: var(--gap);
    white-space: nowrap;
  }
  .phrase {
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    color: var(--md-sys-color-on-surface-variant);
  }
  .marquee--sm .phrase {
    font-size: 0.9375rem;
    font-weight: 500;
    letter-spacing: 0;
  }
  .marquee--lg .phrase {
    font-size: clamp(1.5rem, 1rem + 2vw, 2.25rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--md-sys-color-on-surface);
  }
  .sep {
    display: inline-flex;
    align-items: center;
    color: var(--md-sys-color-primary);
  }
  .sep--dot::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background-color: currentColor;
    opacity: 0.6;
  }
  .sep--slash {
    font-size: 1.25em;
    font-weight: 300;
    color: var(--md-sys-color-outline-variant);
  }
  .marquee--lg .sep--slash {
    font-size: 2rem;
  }
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.375rem;
    font-weight: 700;
    letter-spacing: -0.035em;
    color: var(--md-sys-color-on-surface-variant);
    opacity: 0.78;
  }
  .logo {
    width: auto;
    max-width: 160px;
    height: 32px;
    object-fit: contain;
    filter: grayscale(1);
    opacity: 0.72;
    transition:
      filter 200ms ease,
      opacity 200ms ease;
  }
  .logo:hover {
    filter: none;
    opacity: 1;
  }

  /* Pause toggle (WCAG 2.2.2) ------------------------------------------------ */
  .toggle {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--sc-border);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    opacity: 0;
    transform: translateY(-50%);
    transition: opacity 150ms ease;
  }
  .wrap:hover .toggle,
  .wrap--paused .toggle,
  .toggle:focus-visible {
    opacity: 1;
  }
  @media (hover: none) {
    .toggle {
      opacity: 1;
    }
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* Reduced motion: static, wrapped row ------------------------------------ */
  @media (prefers-reduced-motion: reduce) {
    .marquee {
      overflow: visible;
      justify-content: center;
      padding: 0 1.5rem;
      mask-image: none;
      -webkit-mask-image: none;
    }
    .group {
      flex-shrink: 1;
      flex-wrap: wrap;
      justify-content: center;
      row-gap: 1rem;
      min-width: 0;
      animation: none;
    }
    .group[aria-hidden='true'],
    .toggle {
      display: none;
    }
    .item {
      white-space: normal;
    }
    .item:last-child .sep {
      display: none;
    }
  }
</style>
