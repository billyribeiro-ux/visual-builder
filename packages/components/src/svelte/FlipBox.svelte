<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Attachment } from 'svelte/attachments';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    frontIcon?: string;
    frontTitle?: string;
    frontText?: string;
    backTitle?: string;
    backText?: string;
    ctaText?: string;
    ctaHref?: string;
    trigger?: 'hover' | 'click';
    direction?: 'horizontal' | 'vertical';
    height?: number;
    class?: string;
  }

  let {
    frontIcon = 'Lightning',
    frontTitle = '',
    frontText = '',
    backTitle = '',
    backText = '',
    ctaText = '',
    ctaHref = '',
    trigger = 'hover',
    direction = 'horizontal',
    height = 320,
    class: className = '',
    ...rest
  }: Props = $props();

  let flipped = $state(false);
  const boxHeight = $derived(Math.min(640, Math.max(200, Math.round(Number(height) || 320))));
  const clickMode = $derived(trigger === 'click');
  const vertical = $derived(direction === 'vertical');

  /**
   * Pointer + keyboard wiring on the root: click mode (or any tap on touch devices) toggles the
   * card; Escape returns to the front; focusing the back CTA reveals the back.
   */
  const interactions: Attachment<HTMLElement> = (node) => {
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('a, button')) return;
      const touch = window.matchMedia('(hover: none)').matches;
      if (trigger === 'click' || touch) flipped = !flipped;
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !flipped) return;
      flipped = false;
      node.querySelector<HTMLButtonElement>('.toggle')?.focus();
    };
    const onFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Element && event.target.closest('.face--back')) flipped = true;
    };
    node.addEventListener('click', onClick);
    node.addEventListener('keydown', onKeydown);
    node.addEventListener('focusin', onFocusIn);
    return () => {
      node.removeEventListener('click', onClick);
      node.removeEventListener('keydown', onKeydown);
      node.removeEventListener('focusin', onFocusIn);
    };
  };
</script>

<div
  {...rest}
  class={['flip', clickMode ? 'flip--click' : 'flip--hover', vertical && 'flip--vertical', flipped && 'flip--flipped', className]}
  style:--flip-height="{boxHeight}px"
  {@attach interactions}
>
  <div class="card">
    <div class="face face--front">
      <span class="icon-tile"><Icon name={frontIcon || 'Lightning'} size={26} /></span>
      <h3 class="title" data-prop="frontTitle">{frontTitle}</h3>
      {#if frontText}
        <p class="text" data-prop="frontText">{frontText}</p>
      {/if}
      {#if !clickMode}
        <span class="hint" aria-hidden="true"><Icon name="ArrowsClockwise" size={16} /></span>
      {/if}
    </div>
    <div class="face face--back">
      {#if backTitle}
        <h3 class="title" data-prop="backTitle">{backTitle}</h3>
      {/if}
      {#if backText}
        <p class="text" data-prop="backText">{backText}</p>
      {/if}
      {#if ctaText}
        <a href={safeHref(ctaHref)} class="cta" data-prop="ctaText">
          {ctaText}
          <Icon name="ArrowRight" size={16} />
        </a>
      {/if}
    </div>
  </div>
  <button type="button" class="toggle" aria-pressed={flipped} onclick={() => (flipped = !flipped)}>
    <Icon name="ArrowsClockwise" size={18} />
    <span class="sr-only">Flip card: {frontTitle || backTitle}</span>
  </button>
</div>

<style>
  .flip {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    position: relative;
    width: 100%;
    max-width: 28rem;
    margin-left: auto;
    margin-right: auto;
    height: var(--flip-height, 320px);
    perspective: 1600px;
  }
  .flip--click {
    cursor: pointer;
  }
  .card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 600ms var(--sc-ease);
  }
  .face {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 2rem;
    overflow: hidden;
    border-radius: 1.25rem;
    text-align: center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .face--front {
    border: 1px solid var(--sc-border);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 8px 24px rgba(0, 0, 0, 0.06);
  }
  .face--back {
    background:
      radial-gradient(120% 80% at 100% 0%, rgba(255, 255, 255, 0.16), transparent 55%),
      var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
    transform: rotateY(180deg);
  }
  .flip--vertical .face--back {
    transform: rotateX(180deg);
  }
  .flip--flipped .card {
    transform: rotateY(180deg);
  }
  .flip--vertical.flip--flipped .card {
    transform: rotateX(180deg);
  }
  @media (hover: hover) {
    .flip--hover:hover .card {
      transform: rotateY(180deg);
    }
    .flip--hover.flip--vertical:hover .card {
      transform: rotateX(180deg);
    }
  }

  /* Content ---------------------------------------------------------------- */
  .icon-tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    margin-bottom: 0.5rem;
    border-radius: 1rem;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .title {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.015em;
  }
  .text {
    max-width: 22rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    text-wrap: pretty;
  }
  .face--front .text {
    color: var(--md-sys-color-on-surface-variant);
  }
  .face--back .text {
    color: color-mix(in srgb, var(--md-sys-color-on-primary) 88%, transparent);
  }
  .hint {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    display: inline-flex;
    color: var(--md-sys-color-outline);
  }
  .cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    height: 40px;
    margin-top: 0.75rem;
    padding: 0 1.25rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-on-primary);
    color: var(--md-sys-color-primary);
    font-size: 0.875rem;
    font-weight: 600;
    transition: box-shadow 150ms var(--sc-ease);
  }
  .cta:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  }
  .cta:focus-visible {
    outline-color: var(--md-sys-color-on-primary);
  }

  /* Toggle ----------------------------------------------------------------- */
  .toggle {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--sc-border);
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface-variant);
    transition:
      background-color 200ms var(--sc-ease),
      color 200ms var(--sc-ease),
      border-color 200ms var(--sc-ease);
  }
  .flip--flipped .toggle {
    border-color: rgba(255, 255, 255, 0.28);
    background-color: rgba(255, 255, 255, 0.14);
    color: var(--md-sys-color-on-primary);
  }
  .flip--hover .toggle:not(:focus-visible) {
    /* Hover mode: the toggle exists for keyboard and screen reader users only. */
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    border: 0;
    white-space: nowrap;
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

  /* Reduced motion: crossfade instead of a 3D rotation --------------------- */
  @media (prefers-reduced-motion: reduce) {
    .card,
    .flip--flipped .card,
    .flip--hover:hover .card {
      transform: none !important;
      transition: none;
    }
    .face {
      backface-visibility: visible;
      -webkit-backface-visibility: visible;
      transition: opacity 200ms ease !important;
    }
    .face--back,
    .flip--vertical .face--back {
      transform: none;
      opacity: 0;
      pointer-events: none;
    }
    .flip--flipped .face--back {
      opacity: 1;
      pointer-events: auto;
    }
    .flip--flipped .face--front {
      opacity: 0;
      pointer-events: none;
    }
  }
  @media (prefers-reduced-motion: reduce) and (hover: hover) {
    .flip--hover:hover .face--back {
      opacity: 1;
      pointer-events: auto;
    }
    .flip--hover:hover .face--front {
      opacity: 0;
    }
  }
</style>
