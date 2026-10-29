<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    imageUrl?: string;
    imagePosition?: 'none' | 'left' | 'right' | 'top' | 'background';
    eyebrow?: string;
    title?: string;
    description?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    ribbon?: string;
    variant?: 'light' | 'dark' | 'primary';
    class?: string;
  }

  let {
    imageUrl = '',
    imagePosition = 'right',
    eyebrow = '',
    title = '',
    description = '',
    primaryCtaText = '',
    primaryCtaHref = '',
    secondaryCtaText = '',
    secondaryCtaHref = '',
    ribbon = '',
    variant = 'light',
    class: className = '',
    ...rest
  }: Props = $props();

  const src = $derived(safeSrc(imageUrl));
  const position = $derived(['none', 'left', 'right', 'top', 'background'].includes(imagePosition) ? imagePosition : 'right');
  const tone = $derived(variant === 'dark' || variant === 'primary' ? variant : 'light');
  const split = $derived(position === 'left' || position === 'right');
</script>

<div
  {...rest}
  class={['cta-box', `cta-box--${tone}`, `cta-box--${position}`, position === 'background' && !src && 'cta-box--bg-empty', className]}
>
  {#if ribbon}
    <div class="ribbon-wrap"><span class="ribbon" data-prop="ribbon">{ribbon}</span></div>
  {/if}

  {#if position === 'background'}
    <div class="backdrop" aria-hidden="true">
      {#if src}
        <img src={src} alt="" width="1600" height="900" loading="lazy" />
      {/if}
    </div>
  {:else if position !== 'none'}
    <div class={['media', split && 'media--split']}>
      {#if src}
        <img src={src} alt="" width="1200" height="900" loading="lazy" />
      {:else}
        <div class="placeholder" aria-hidden="true">
          <div class="mock">
            <div class="mock-bar"><span></span><span></span><span></span></div>
            <div class="mock-body">
              <span class="mock-line mock-line--strong"></span>
              <span class="mock-line"></span>
              <div class="mock-bars">
                <span style:height="38%"></span>
                <span style:height="56%"></span>
                <span style:height="44%"></span>
                <span style:height="72%"></span>
                <span style:height="64%"></span>
                <span style:height="88%"></span>
              </div>
              <span class="mock-pill"><Icon name="ArrowUpRight" size={12} /></span>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}

  <div class="content">
    {#if eyebrow}
      <p class="eyebrow" data-prop="eyebrow">{eyebrow}</p>
    {/if}
    {#if title}
      <h2 class="title" data-prop="title">{title}</h2>
    {/if}
    {#if description}
      <p class="description" data-prop="description">{description}</p>
    {/if}
    {#if primaryCtaText || secondaryCtaText}
      <div class="actions">
        {#if primaryCtaText}
          <a href={safeHref(primaryCtaHref)} class="btn btn--primary" data-prop="primaryCtaText">{primaryCtaText}</a>
        {/if}
        {#if secondaryCtaText}
          <a href={safeHref(secondaryCtaHref)} class="btn btn--secondary" data-prop="secondaryCtaText">{secondaryCtaText}</a>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .cta-box {
    --sc-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    --sc-ease: var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1));
    --cta-fg: var(--md-sys-color-on-surface);
    --cta-muted: var(--md-sys-color-on-surface-variant);
    --cta-accent: var(--md-sys-color-primary);
    --cta-btn-bg: var(--md-sys-color-primary);
    --cta-btn-fg: var(--md-sys-color-on-primary);
    --cta-btn2-border: var(--md-sys-color-outline-variant);
    --cta-btn2-fg: var(--md-sys-color-on-surface);
    --cta-btn2-hover: var(--md-sys-color-surface-container);
    --cta-pattern: rgba(0, 0, 0, 0.07);
    --cta-media-bg: var(--md-sys-color-surface-container-low);
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
    max-width: 72rem;
    margin-left: auto;
    margin-right: auto;
    overflow: hidden;
    border: 1px solid var(--sc-border);
    border-radius: 1.5rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--cta-fg);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.04),
      0 12px 32px rgba(0, 0, 0, 0.06);
  }
  .cta-box--dark {
    --cta-fg: var(--md-sys-color-surface);
    --cta-muted: color-mix(in srgb, var(--md-sys-color-surface) 72%, transparent);
    --cta-accent: var(--md-sys-color-primary-container);
    --cta-btn-bg: var(--md-sys-color-surface);
    --cta-btn-fg: var(--md-sys-color-on-surface);
    --cta-btn2-border: rgba(255, 255, 255, 0.24);
    --cta-btn2-fg: var(--md-sys-color-surface);
    --cta-btn2-hover: rgba(255, 255, 255, 0.08);
    --cta-pattern: rgba(255, 255, 255, 0.08);
    --cta-media-bg: rgba(255, 255, 255, 0.04);
    border-color: transparent;
    background-color: var(--md-sys-color-on-surface);
  }
  .cta-box--primary {
    --cta-fg: var(--md-sys-color-on-primary);
    --cta-muted: color-mix(in srgb, var(--md-sys-color-on-primary) 84%, transparent);
    --cta-accent: color-mix(in srgb, var(--md-sys-color-on-primary) 80%, transparent);
    --cta-btn-bg: var(--md-sys-color-on-primary);
    --cta-btn-fg: var(--md-sys-color-primary);
    --cta-btn2-border: color-mix(in srgb, var(--md-sys-color-on-primary) 40%, transparent);
    --cta-btn2-fg: var(--md-sys-color-on-primary);
    --cta-btn2-hover: rgba(255, 255, 255, 0.1);
    --cta-pattern: rgba(255, 255, 255, 0.12);
    --cta-media-bg: rgba(255, 255, 255, 0.06);
    border-color: transparent;
    background:
      radial-gradient(90% 120% at 100% 0%, rgba(255, 255, 255, 0.14), transparent 60%),
      var(--md-sys-color-primary);
  }
  .cta-box--background {
    --cta-fg: #fff;
    --cta-muted: rgba(255, 255, 255, 0.82);
    --cta-accent: rgba(255, 255, 255, 0.86);
    --cta-btn-bg: #fff;
    --cta-btn-fg: var(--md-sys-color-on-surface);
    --cta-btn2-border: rgba(255, 255, 255, 0.42);
    --cta-btn2-fg: #fff;
    --cta-btn2-hover: rgba(255, 255, 255, 0.12);
    border-color: transparent;
    min-height: 360px;
    align-items: end;
  }

  /* Layouts --------------------------------------------------------------- */
  @media (min-width: 768px) {
    .cta-box--left,
    .cta-box--right {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .cta-box--right .media {
      order: 2;
    }
  }
  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 0.875rem;
    padding: clamp(1.75rem, 1rem + 3vw, 3.25rem);
  }
  .cta-box--background .content {
    max-width: 40rem;
  }

  /* Media ----------------------------------------------------------------- */
  .media {
    position: relative;
    aspect-ratio: 16 / 10;
    background-color: var(--cta-media-bg);
  }
  @media (min-width: 768px) {
    .media--split {
      aspect-ratio: auto;
      min-height: 320px;
    }
  }
  .media img,
  .backdrop img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .backdrop {
    position: absolute;
    inset: 0;
  }
  .backdrop::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.78), rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0.2));
  }
  .cta-box--bg-empty .backdrop {
    background:
      radial-gradient(80% 120% at 85% 10%, rgba(255, 255, 255, 0.22), transparent 55%),
      linear-gradient(135deg, var(--md-sys-color-primary), color-mix(in srgb, var(--md-sys-color-primary) 55%, black));
  }
  .cta-box--bg-empty .backdrop::after {
    background: linear-gradient(to top, rgba(0, 0, 0, 0.35), transparent 70%);
  }

  /* Placeholder visual ------------------------------------------------------ */
  .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background-image: radial-gradient(var(--cta-pattern) 1px, transparent 1px);
    background-size: 16px 16px;
  }
  .mock {
    width: min(100%, 280px);
    overflow: hidden;
    border: 1px solid var(--sc-border);
    border-radius: 0.875rem;
    background-color: var(--md-sys-color-surface-container-lowest);
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.06),
      0 18px 40px rgba(0, 0, 0, 0.14);
    transform: rotate(-2deg);
  }
  .mock-bar {
    display: flex;
    gap: 5px;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--sc-border);
  }
  .mock-bar span {
    width: 8px;
    height: 8px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .mock-body {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 1rem;
  }
  .mock-line {
    width: 70%;
    height: 7px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-surface-container-high);
  }
  .mock-line--strong {
    width: 45%;
    height: 9px;
    background-color: var(--md-sys-color-outline-variant);
  }
  .mock-bars {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 0 0.25rem;
    height: clamp(48px, 14vw, 84px);
    margin-top: 0.5rem;
  }
  .mock-bars span {
    flex: 1;
    border-radius: 4px 4px 2px 2px;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
  }
  .mock-bars span:last-child {
    background-color: var(--md-sys-color-primary);
  }
  .mock-pill {
    position: absolute;
    top: 0.875rem;
    right: 1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 9999px;
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }

  /* Copy ------------------------------------------------------------------ */
  .eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--cta-accent);
  }
  .title {
    font-size: clamp(1.5rem, 1.1rem + 1.4vw, 2.125rem);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--cta-fg);
    text-wrap: balance;
  }
  .description {
    max-width: 32rem;
    font-size: 1rem;
    line-height: 1.6;
    color: var(--cta-muted);
    text-wrap: pretty;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    padding: 0 1.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.9375rem;
    font-weight: 600;
    white-space: nowrap;
    transition:
      background-color 150ms var(--sc-ease),
      box-shadow 150ms var(--sc-ease),
      filter 150ms var(--sc-ease);
  }
  .btn--primary {
    background-color: var(--cta-btn-bg);
    color: var(--cta-btn-fg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  }
  .btn--primary:hover {
    filter: brightness(0.94);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
  }
  .btn--secondary {
    border: 1px solid var(--cta-btn2-border);
    color: var(--cta-btn2-fg);
  }
  .btn--secondary:hover {
    background-color: var(--cta-btn2-hover);
  }
  .cta-box--dark .btn:focus-visible,
  .cta-box--primary .btn:focus-visible,
  .cta-box--background .btn:focus-visible {
    outline-color: var(--cta-fg);
  }

  /* Ribbon ----------------------------------------------------------------- */
  .ribbon-wrap {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 2;
    width: 140px;
    height: 140px;
    overflow: hidden;
    pointer-events: none;
  }
  .ribbon {
    position: absolute;
    top: 28px;
    right: -46px;
    width: 190px;
    padding: 0.375rem 0;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-align: center;
    text-transform: uppercase;
    transform: rotate(45deg);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.16);
    pointer-events: auto;
  }
  .cta-box--primary .ribbon {
    background-color: var(--md-sys-color-on-primary);
    color: var(--md-sys-color-primary);
  }
</style>
