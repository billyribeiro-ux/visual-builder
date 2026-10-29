<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeSrc } from './lib/href.js';

  type BentoSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall';

  interface BentoItem {
    title?: string;
    description?: string;
    icon?: string;
    size?: BentoSize;
    imageUrl?: string;
    accent?: boolean;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    items?: BentoItem[];
    class?: string;
  }

  let {
    sectionEyebrow = '',
    sectionTitle = 'Everything in one place',
    sectionDescription = '',
    items = [],
    class: className = '',
    ...rest
  }: Props = $props();

  const SIZES: ReadonlyArray<BentoSize> = ['sm', 'md', 'lg', 'wide', 'tall'];
  const BARS = [30, 46, 38, 58, 50, 66, 60, 74, 68, 84, 78, 92];
  const CHIP_ICONS = ['Lightning', 'ChatCircleText', 'CheckCircle'];

  const cards = $derived(
    (Array.isArray(items) ? items : []).map((item) => ({
      title: String(item?.title ?? ''),
      description: String(item?.description ?? ''),
      icon: String(item?.icon ?? '') || 'Sparkle',
      size: (SIZES.includes(item?.size as BentoSize) ? item.size : 'sm') as BentoSize,
      image: safeSrc(item?.imageUrl),
      accent: item?.accent === true
    }))
  );
</script>

<section {...rest} class={['bento', className]}>
  <div class="md-container md-container--xl">
    {#if sectionEyebrow || sectionTitle || sectionDescription}
      <div class="header">
        {#if sectionEyebrow}
          <p class="md-eyebrow eyebrow" data-prop="sectionEyebrow">{sectionEyebrow}</p>
        {/if}
        <h2 class="heading" data-prop="sectionTitle">{sectionTitle}</h2>
        {#if sectionDescription}
          <p class="description" data-prop="sectionDescription">{sectionDescription}</p>
        {/if}
      </div>
    {/if}

    <ul class="grid">
      {#each cards as card, index (index)}
        <li class={['card', `card--${card.size}`, card.accent && 'card--accent', card.image && 'card--image']}>
          <div class="content">
            <span class="icon-tile"><Icon name={card.icon} size={20} /></span>
            <h3 class="card-title" data-prop={`items.${index}.title`}>{card.title}</h3>
            {#if card.description}
              <p class="card-description" data-prop={`items.${index}.description`}>{card.description}</p>
            {/if}
          </div>

          {#if card.image}
            <div class="visual visual--image">
              <img src={card.image} alt="" width="800" height="500" loading="lazy" />
            </div>
          {:else if card.size === 'lg'}
            <div class="visual visual--orbit" aria-hidden="true">
              <span class="ring ring--1"></span>
              <span class="ring ring--2"></span>
              <span class="ring ring--3"></span>
              <span class="orbit-core"><Icon name={card.icon} size={26} /></span>
              {#each CHIP_ICONS as chip, chipIndex (chip)}
                <span class={['orbit-chip', `orbit-chip--${chipIndex}`]}><Icon name={chip} size={16} /></span>
              {/each}
            </div>
          {:else if card.size === 'tall'}
            <div class="visual visual--stack" aria-hidden="true">
              <span class="stack-card stack-card--3"></span>
              <span class="stack-card stack-card--2"></span>
              <span class="stack-card stack-card--1">
                <span class="stack-check"><Icon name="Check" size={14} /></span>
                <span class="stack-lines"><span></span><span></span></span>
              </span>
            </div>
          {:else if card.size === 'wide'}
            <div class="visual visual--bars" aria-hidden="true">
              {#each BARS as height, barIndex (barIndex)}
                <span class={['bar', barIndex === BARS.length - 1 && 'bar--accent']} style:height="{height}%"></span>
              {/each}
            </div>
          {:else}
            <div class={['visual', 'visual--glow', card.size === 'md' && 'visual--grid']} aria-hidden="true"></div>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .bento {
    padding: 6rem 0;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .header {
    max-width: 44rem;
    margin: 0 auto 3.5rem;
    text-align: center;
  }
  .eyebrow {
    margin-bottom: 0.75rem;
  }
  .heading {
    font-size: clamp(1.875rem, 1.3rem + 1.9vw, 2.75rem);
    line-height: 1.12;
    font-weight: 700;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  .description {
    margin-top: 1rem;
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }

  /* ---------------------------------------------------------------- grid */
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
    list-style: none;
  }
  @media (min-width: 768px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-flow: row dense;
    }
    .card--lg,
    .card--wide {
      grid-column: span 2;
    }
    .card--tall {
      grid-row: span 2;
    }
  }
  @media (min-width: 1024px) {
    .grid {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      grid-auto-rows: minmax(15rem, auto);
      gap: 1.25rem;
    }
    .card--sm {
      grid-column: span 2;
    }
    .card--md {
      grid-column: span 3;
    }
    .card--lg {
      grid-column: span 4;
      grid-row: span 2;
    }
    .card--wide {
      grid-column: span 4;
    }
    .card--tall {
      grid-column: span 2;
      grid-row: span 2;
    }
  }

  /* ---------------------------------------------------------------- card */
  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 1.5rem;
    min-width: 0;
    overflow: hidden;
    isolation: isolate;
    padding: 1.75rem;
    border-radius: 20px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    transition:
      border-color var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .card:hover {
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 28%, var(--md-sys-color-outline-variant));
    box-shadow: 0 18px 40px -24px rgba(0, 0, 0, 0.25);
  }
  .card--accent {
    background:
      radial-gradient(ellipse 80% 70% at 100% 0%, color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent), transparent 70%),
      linear-gradient(
        160deg,
        color-mix(in srgb, var(--md-sys-color-primary-container) 75%, var(--md-sys-color-surface-container-lowest)),
        var(--md-sys-color-surface-container-lowest) 75%
      );
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
  }
  .content {
    position: relative;
    z-index: 1;
    max-width: 30rem;
  }
  .icon-tile {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-bottom: 1.25rem;
    border-radius: 11px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    color: var(--md-sys-color-primary);
    box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.1);
  }
  .card--accent .icon-tile {
    background-color: var(--md-sys-color-primary);
    border-color: transparent;
    color: var(--md-sys-color-on-primary);
  }
  .card-title {
    font-size: 1.125rem;
    line-height: 1.4;
    font-weight: 650;
    letter-spacing: -0.015em;
  }
  .card--lg .card-title {
    font-size: 1.5rem;
    line-height: 1.25;
    letter-spacing: -0.025em;
  }
  .card-description {
    margin-top: 0.5rem;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
  }

  /* ---------------------------------------------------------------- visuals */
  .visual {
    position: relative;
    min-height: 0;
  }
  .visual--image {
    margin: 0 -1.75rem -1.75rem;
    flex: 1;
    min-height: 10rem;
  }
  .visual--image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-top: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
  }

  /* orbit (large) */
  .visual--orbit {
    flex: 1;
    min-height: 13rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ring {
    position: absolute;
    left: 50%;
    top: 50%;
    border-radius: 50%;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 22%, transparent);
    transform: translate(-50%, -50%);
  }
  .ring--1 {
    width: 7rem;
    height: 7rem;
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 6%, transparent);
  }
  .ring--2 {
    width: 12rem;
    height: 12rem;
    border-style: dashed;
  }
  .ring--3 {
    width: 17rem;
    height: 17rem;
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
  }
  .orbit-core {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow:
      0 0 0 6px color-mix(in srgb, var(--md-sys-color-primary) 14%, transparent),
      0 16px 32px -12px color-mix(in srgb, var(--md-sys-color-primary) 70%, transparent);
  }
  .orbit-chip {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 11px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    color: var(--md-sys-color-primary);
    box-shadow: 0 8px 20px -10px rgba(0, 0, 0, 0.3);
  }
  .orbit-chip--0 {
    left: calc(50% - 6.6rem);
    top: calc(50% - 3.2rem);
  }
  .orbit-chip--1 {
    left: calc(50% + 4.6rem);
    top: calc(50% - 4.4rem);
  }
  .orbit-chip--2 {
    left: calc(50% + 2.4rem);
    top: calc(50% + 3.6rem);
  }

  /* stacked cards (tall) */
  .visual--stack {
    flex: 1;
    min-height: 11rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .stack-card {
    position: absolute;
    left: 50%;
    width: 78%;
    height: 4.25rem;
    border-radius: 14px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    transform: translateX(-50%);
  }
  .stack-card--3 {
    top: calc(50% - 4rem);
    width: 62%;
    opacity: 0.55;
  }
  .stack-card--2 {
    top: calc(50% - 3rem);
    width: 70%;
    opacity: 0.8;
    box-shadow: 0 8px 20px -14px rgba(0, 0, 0, 0.3);
  }
  .stack-card--1 {
    top: calc(50% - 1.75rem);
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0 1rem;
    box-shadow: 0 18px 36px -18px rgba(0, 0, 0, 0.35);
  }
  .stack-check {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: var(--md-sys-color-success-container);
    color: var(--md-sys-color-on-success-container);
  }
  .stack-lines {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
  }
  .stack-lines span {
    height: 7px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 16%, transparent);
  }
  .stack-lines span:last-child {
    width: 60%;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  }

  /* bars (wide) */
  .visual--bars {
    display: flex;
    align-items: flex-end;
    gap: 2.5%;
    height: 6.5rem;
    padding-top: 0.5rem;
    background-image: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent) 1px,
      transparent 1px
    );
    background-size: 100% 33.33%;
  }
  .bar {
    flex: 1;
    border-radius: 5px 5px 0 0;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent),
      color-mix(in srgb, var(--md-sys-color-primary) 42%, transparent)
    );
  }
  .bar--accent {
    background: linear-gradient(to top, color-mix(in srgb, var(--md-sys-color-primary) 65%, transparent), var(--md-sys-color-primary));
  }

  /* glow / grid (small and medium) */
  .visual--glow {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: radial-gradient(
      circle at 100% 100%,
      color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent),
      transparent 55%
    );
  }
  .visual--grid {
    background:
      radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--md-sys-color-tertiary) 12%, transparent), transparent 55%),
      linear-gradient(to right, color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent) 1px, transparent 1px) 0 0 / 28px 28px,
      linear-gradient(to bottom, color-mix(in srgb, var(--md-sys-color-outline-variant) 40%, transparent) 1px, transparent 1px) 0 0 / 28px 28px;
    mask-image: linear-gradient(to top left, black, transparent 65%);
    -webkit-mask-image: linear-gradient(to top left, black, transparent 65%);
  }

  @media (max-width: 767px) {
    .bento {
      padding: 4rem 0;
    }
    .header {
      margin-bottom: 2.5rem;
    }
    .card {
      padding: 1.5rem;
    }
    .visual--image {
      margin: 0 -1.5rem -1.5rem;
    }
    .visual--orbit {
      min-height: 11rem;
    }
    .ring--3 {
      display: none;
    }
    .visual--stack {
      min-height: 9rem;
    }
  }
</style>
