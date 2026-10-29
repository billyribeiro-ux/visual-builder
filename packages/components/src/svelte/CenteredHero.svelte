<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    badgeText?: string;
    badgeIcon?: string;
    badgeHref?: string;
    title?: string;
    /** Part of the title rendered with the accent gradient (shown on its own line when it is not found in the title). */
    highlight?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    mediaType?: 'none' | 'image' | 'product-mock' | 'video-poster';
    mediaUrl?: string;
    videoLabel?: string;
    videoHref?: string;
    background?: 'plain' | 'grid' | 'gradient-glow' | 'dots';
    trustText?: string;
    trustLogos?: string[];
    class?: string;
  }

  let {
    badgeText = '',
    badgeIcon = 'none',
    badgeHref = '',
    title = 'Build something people love',
    highlight = '',
    subtitle = '',
    primaryCtaText = 'Get started',
    primaryCtaHref = '/signup',
    secondaryCtaText = '',
    secondaryCtaHref = '',
    mediaType = 'none',
    mediaUrl = '',
    videoLabel = '',
    videoHref = '',
    background = 'plain',
    trustText = '',
    trustLogos = [],
    class: className = '',
    ...rest
  }: Props = $props();

  /** Decorative bar heights (percent) for the product mock chart. */
  const BARS = [38, 52, 44, 63, 58, 71, 66, 79, 74, 86, 81, 94];
  const SIDE_ROWS = [0, 1, 2, 3, 4, 5];
  const KPIS = [0, 1, 2];
  const LIST_ROWS = [0, 1, 2, 3];

  const parts = $derived.by(() => {
    const h = highlight.trim();
    if (!h) return { before: title, match: '', after: '', appended: '' };
    const at = title.indexOf(h);
    if (at === -1) return { before: title, match: '', after: '', appended: h };
    return { before: title.slice(0, at), match: h, after: title.slice(at + h.length), appended: '' };
  });
  const media = $derived(safeSrc(mediaUrl));
  const showIcon = $derived(badgeIcon.trim() !== '' && badgeIcon !== 'none');
  const logos = $derived((Array.isArray(trustLogos) ? trustLogos : []).map((l) => String(l)).filter((l) => l.trim() !== ''));
</script>

{#snippet badgeContent()}
  {#if showIcon}
    <span class="badge-icon"><Icon name={badgeIcon} size={13} /></span>
  {/if}
  <span data-prop="badgeText">{badgeText}</span>
  {#if badgeHref}
    <Icon name="ArrowRight" size={14} class="badge-arrow" />
  {/if}
{/snippet}

{#snippet productMock()}
  <div class="mock" aria-hidden="true">
    <div class="mock-top">
      <span class="mock-dot"></span><span class="mock-dot"></span><span class="mock-dot"></span>
      <span class="mock-url"></span>
    </div>
    <div class="mock-body">
      <div class="mock-side">
        <span class="side-brand"></span>
        {#each SIDE_ROWS as row (row)}
          <span class={['side-row', row === 1 && 'is-active']}></span>
        {/each}
      </div>
      <div class="mock-main">
        <div class="mock-head">
          <span class="line line--title"></span>
          <span class="mock-button"></span>
        </div>
        <div class="kpis">
          {#each KPIS as kpi (kpi)}
            <div class="kpi">
              <span class="line line--xs"></span>
              <span class="kpi-value"></span>
              <span class={['kpi-delta', kpi === 2 && 'kpi-delta--muted']}></span>
            </div>
          {/each}
        </div>
        <div class="mock-grid">
          <div class="chart">
            <span class="line line--sm"></span>
            <div class="bars">
              {#each BARS as height, index (index)}
                <span class={['bar', index === BARS.length - 1 && 'bar--accent']} style:height="{height}%"></span>
              {/each}
            </div>
          </div>
          <div class="rows">
            {#each LIST_ROWS as row (row)}
              <div class="row">
                <span class="avatar"></span>
                <span class="line"></span>
                <span class={['tag', row % 2 === 0 && 'tag--accent']}></span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/snippet}

<section {...rest} class={['hero', `bg-${background}`, className]}>
  {#if background !== 'plain'}
    <div class="backdrop" aria-hidden="true"></div>
  {/if}

  <div class="md-container md-container--xl inner">
    <div class="copy">
      {#if badgeText}
        {#if badgeHref}
          <a href={safeHref(badgeHref)} class="badge badge--link">{@render badgeContent()}</a>
        {:else}
          <span class="badge">{@render badgeContent()}</span>
        {/if}
      {/if}

      <h1 class="title">
        <span data-prop="title">{parts.before}{#if parts.match}<span class="highlight" data-prop="highlight">{parts.match}</span>{/if}{parts.after}</span>{#if parts.appended}<span class="highlight highlight--line" data-prop="highlight">{parts.appended}</span>{/if}
      </h1>

      {#if subtitle}
        <p class="subtitle" data-prop="subtitle">{subtitle}</p>
      {/if}

      {#if primaryCtaText || secondaryCtaText}
        <div class="actions">
          {#if primaryCtaText}
            <a href={safeHref(primaryCtaHref)} class="md-btn md-btn--lg md-btn--filled cta">
              <span data-prop="primaryCtaText">{primaryCtaText}</span>
              <Icon name="ArrowRight" size={18} />
            </a>
          {/if}
          {#if secondaryCtaText}
            <a href={safeHref(secondaryCtaHref)} class="md-btn md-btn--lg secondary-cta">
              <span data-prop="secondaryCtaText">{secondaryCtaText}</span>
            </a>
          {/if}
        </div>
      {/if}
    </div>

    {#if mediaType !== 'none'}
      <div class={['media', `media--${mediaType}`]}>
        <div class="media-glow" aria-hidden="true"></div>
        <div class="frame">
          {#if mediaType === 'product-mock'}
            {@render productMock()}
          {:else if media}
            <img src={media} alt="" width="1280" height="800" class="media-image" />
          {:else if mediaType === 'video-poster'}
            {@render productMock()}
          {:else}
            <div class="placeholder">
              <span class="placeholder-icon"><Icon name="Image" size={28} /></span>
              <span class="placeholder-text">Product screenshot</span>
            </div>
          {/if}

          {#if mediaType === 'video-poster'}
            <div class="poster-overlay">
              {#if videoHref}
                <a href={safeHref(videoHref)} class="play">
                  <span class="play-icon"><Icon name="Play" size={20} /></span>
                  <span data-prop="videoLabel">{videoLabel || 'Play video'}</span>
                </a>
              {:else}
                <span class="play">
                  <span class="play-icon"><Icon name="Play" size={20} /></span>
                  <span data-prop="videoLabel">{videoLabel || 'Play video'}</span>
                </span>
              {/if}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if trustText || logos.length > 0}
      <div class="trust">
        {#if trustText}
          <p class="trust-text" data-prop="trustText">{trustText}</p>
        {/if}
        {#if logos.length > 0}
          <ul class="logos">
            {#each logos as logo, index (index)}
              <li class={['wordmark', `wordmark--${index % 6}`]} data-prop={`trustLogos.${index}`}>{logo}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</section>

<style>
  .hero {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding: 7rem 0 5rem;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }

  /* ---------------------------------------------------------------- backgrounds */
  .backdrop {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }
  .bg-grid .backdrop {
    background-image:
      linear-gradient(to right, color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent) 1px, transparent 1px),
      linear-gradient(to bottom, color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent) 1px, transparent 1px);
    background-size: 64px 64px;
    background-position: center top;
    mask-image: radial-gradient(ellipse 75% 55% at 50% 0%, black 30%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 75% 55% at 50% 0%, black 30%, transparent 100%);
  }
  .bg-dots .backdrop {
    background-image: radial-gradient(color-mix(in srgb, var(--md-sys-color-on-surface) 16%, transparent) 1px, transparent 1.6px);
    background-size: 22px 22px;
    mask-image: radial-gradient(ellipse 70% 55% at 50% 0%, black 35%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 70% 55% at 50% 0%, black 35%, transparent 100%);
  }
  .bg-gradient-glow .backdrop {
    background:
      radial-gradient(ellipse 55% 45% at 50% -8%, color-mix(in srgb, var(--md-sys-color-primary) 24%, transparent), transparent 70%),
      radial-gradient(ellipse 35% 30% at 82% 6%, color-mix(in srgb, var(--md-sys-color-tertiary) 16%, transparent), transparent 70%),
      radial-gradient(ellipse 35% 30% at 18% 10%, color-mix(in srgb, var(--md-sys-color-secondary) 14%, transparent), transparent 70%);
  }

  /* ---------------------------------------------------------------- copy */
  .inner {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 52rem;
    text-align: center;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 32px;
    margin-bottom: 1.75rem;
    padding: 0.25rem 0.875rem 0.25rem 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 85%, transparent);
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 80%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.25rem;
    color: var(--md-sys-color-on-surface);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .badge:not(:has(.badge-icon)) {
    padding-left: 0.875rem;
  }
  .badge--link {
    transition:
      border-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .badge--link:hover {
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 40%, transparent);
    box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.12);
  }
  .badge-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
  }
  .badge :global(.badge-arrow) {
    color: var(--md-sys-color-on-surface-variant);
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .badge--link:hover :global(.badge-arrow) {
    transform: translateX(2px);
  }

  .title {
    font-size: clamp(2.5rem, 1.6rem + 3.6vw, 4.5rem);
    line-height: 1.04;
    font-weight: 700;
    letter-spacing: -0.04em;
    text-wrap: balance;
  }
  .highlight {
    background-image: linear-gradient(
      100deg,
      var(--md-sys-color-primary) 0%,
      color-mix(in oklab, var(--md-sys-color-primary) 55%, var(--md-sys-color-tertiary)) 55%,
      var(--md-sys-color-tertiary) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
  .highlight--line {
    display: block;
  }
  .subtitle {
    max-width: 40rem;
    margin-top: 1.5rem;
    font-size: 1.1875rem;
    line-height: 1.6;
    color: var(--md-sys-color-on-surface-variant);
    text-wrap: pretty;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 2.25rem;
  }
  .cta {
    font-weight: 600;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.12),
      0 8px 20px -8px color-mix(in srgb, var(--md-sys-color-primary) 60%, transparent);
  }
  .secondary-cta {
    font-weight: 600;
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .secondary-cta:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }

  /* ---------------------------------------------------------------- media */
  .media {
    position: relative;
    width: 100%;
    max-width: 68rem;
    margin-top: 4rem;
  }
  .media-glow {
    position: absolute;
    inset: 8% 6% -4%;
    z-index: -1;
    border-radius: 40px;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--md-sys-color-primary) 26%, transparent),
      color-mix(in srgb, var(--md-sys-color-tertiary) 10%, transparent) 55%,
      transparent 75%
    );
    filter: blur(40px);
  }
  .frame {
    position: relative;
    overflow: hidden;
    padding: 0.5rem;
    border-radius: 20px;
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-lowest) 70%, transparent);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 75%, transparent);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.05),
      0 24px 64px -24px rgba(0, 0, 0, 0.25);
  }
  .media-image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 14px;
  }
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    aspect-ratio: 16 / 10;
    border-radius: 14px;
    background:
      radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent), transparent 70%),
      var(--md-sys-color-surface-container-low);
    border: 1px dashed color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
    color: var(--md-sys-color-on-surface-variant);
  }
  .placeholder-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid var(--md-sys-color-outline-variant);
    box-shadow: 0 4px 12px -6px rgba(0, 0, 0, 0.16);
  }
  .placeholder-text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .poster-overlay {
    position: absolute;
    inset: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.02));
  }
  .play {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 52px;
    padding: 0.375rem 1.25rem 0.375rem 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: rgba(255, 255, 255, 0.94);
    color: rgba(17, 17, 20, 0.92);
    font-size: 0.9375rem;
    font-weight: 600;
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.1),
      0 16px 40px -12px rgba(0, 0, 0, 0.4);
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  a.play:hover {
    transform: scale(1.03);
  }
  .play-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }

  /* product mock (decorative) */
  .mock {
    overflow: hidden;
    border-radius: 14px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
  }
  .mock-top {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 36px;
    padding: 0 14px;
    border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    background-color: var(--md-sys-color-surface-container-low);
  }
  .mock-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 90%, transparent);
  }
  .mock-url {
    width: 32%;
    height: 18px;
    margin: 0 auto;
    border-radius: 6px;
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
  }
  .mock-body {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    aspect-ratio: 16 / 9.2;
  }
  .mock-side {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 16px;
    border-right: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 55%, transparent);
    background-color: color-mix(in srgb, var(--md-sys-color-surface-container-low) 60%, transparent);
  }
  .side-brand {
    width: 60%;
    height: 14px;
    margin-bottom: 10px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 22%, transparent);
  }
  .side-row {
    height: 26px;
    border-radius: 7px;
    background:
      linear-gradient(
        to right,
        color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent) 0 14px,
        transparent 14px 24px,
        color-mix(in srgb, var(--md-sys-color-on-surface) 9%, transparent) 24px 70%,
        transparent 70%
      )
      no-repeat 8px center / calc(100% - 16px) 8px;
  }
  .side-row.is-active {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent);
  }
  .mock-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    padding: 20px 22px;
  }
  .mock-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .line {
    display: block;
    height: 8px;
    width: 55%;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 10%, transparent);
  }
  .line--title {
    width: 28%;
    height: 14px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 22%, transparent);
  }
  .line--xs {
    width: 40%;
    height: 7px;
  }
  .line--sm {
    width: 30%;
  }
  .mock-button {
    width: 88px;
    height: 26px;
    border-radius: 999px;
    background-color: var(--md-sys-color-primary);
    opacity: 0.9;
  }
  .kpis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .kpi {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
  }
  .kpi-value {
    width: 62%;
    height: 16px;
    border-radius: 5px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 26%, transparent);
  }
  .kpi-delta {
    width: 34%;
    height: 7px;
    border-radius: 4px;
    background-color: color-mix(in srgb, var(--md-sys-color-success) 45%, transparent);
  }
  .kpi-delta--muted {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  }
  .mock-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 12px;
    flex: 1;
    min-height: 0;
  }
  .chart,
  .rows {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border-radius: 10px;
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 65%, transparent);
    min-height: 0;
  }
  .bars {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 6%;
    min-height: 0;
    padding: 0 2px;
    background-image: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--md-sys-color-outline-variant) 45%, transparent) 1px,
      transparent 1px
    );
    background-size: 100% 25%;
  }
  .bar {
    flex: 1;
    border-radius: 4px 4px 0 0;
    background: linear-gradient(
      to top,
      color-mix(in srgb, var(--md-sys-color-primary) 30%, transparent),
      color-mix(in srgb, var(--md-sys-color-primary) 55%, transparent)
    );
  }
  .bar--accent {
    background: linear-gradient(to top, color-mix(in srgb, var(--md-sys-color-primary) 70%, transparent), var(--md-sys-color-primary));
  }
  .rows {
    justify-content: space-around;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .row .line {
    flex: 1;
  }
  .avatar {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent),
      color-mix(in srgb, var(--md-sys-color-tertiary) 35%, transparent)
    );
  }
  .tag {
    flex-shrink: 0;
    width: 36px;
    height: 14px;
    border-radius: 999px;
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
  }
  .tag--accent {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent);
  }

  /* ---------------------------------------------------------------- trust */
  .trust {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
    width: 100%;
    margin-top: 4.5rem;
  }
  .trust-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
  }
  .logos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 1.25rem 3rem;
    list-style: none;
  }
  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--md-sys-font-heading);
    font-size: 1.25rem;
    line-height: 1;
    color: color-mix(in srgb, var(--md-sys-color-on-surface) 58%, transparent);
    white-space: nowrap;
  }
  .wordmark::before {
    content: '';
    display: inline-block;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    background-color: currentColor;
  }
  .wordmark--0 {
    font-weight: 800;
    letter-spacing: -0.04em;
  }
  .wordmark--0::before {
    border-radius: 50%;
  }
  .wordmark--1 {
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .wordmark--1::before {
    width: 14px;
    height: 14px;
    transform: rotate(45deg);
    border-radius: 2px;
  }
  .wordmark--2 {
    font-weight: 500;
    letter-spacing: -0.02em;
  }
  .wordmark--2::before {
    background: none;
    border: 3px solid currentColor;
    border-radius: 50%;
  }
  .wordmark--3 {
    font-family: var(--md-sys-font-mono);
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.03em;
  }
  .wordmark--3::before {
    width: 16px;
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }
  .wordmark--4 {
    font-weight: 700;
    letter-spacing: -0.03em;
    text-transform: lowercase;
  }
  .wordmark--4::before {
    width: 20px;
    height: 12px;
    border-radius: 6px;
  }
  .wordmark--5 {
    font-weight: 600;
    font-style: italic;
    letter-spacing: -0.02em;
  }
  .wordmark--5::before {
    width: 16px;
    height: 16px;
    border-radius: 4px 50% 4px 50%;
  }

  /* ---------------------------------------------------------------- responsive */
  @media (max-width: 1023px) {
    .mock-body {
      grid-template-columns: 150px minmax(0, 1fr);
    }
  }
  @media (max-width: 767px) {
    .hero {
      padding: 4.5rem 0 3.5rem;
    }
    .subtitle {
      font-size: 1.0625rem;
    }
    .actions {
      flex-direction: column;
      align-self: stretch;
    }
    .actions :global(.md-btn) {
      width: 100%;
    }
    .media {
      margin-top: 3rem;
    }
    .frame {
      padding: 0.3125rem;
      border-radius: 14px;
    }
    .mock-body {
      grid-template-columns: minmax(0, 1fr);
      aspect-ratio: 4 / 3.4;
    }
    .mock-side {
      display: none;
    }
    .mock-main {
      padding: 14px;
      gap: 12px;
    }
    .kpi {
      padding: 10px;
    }
    .mock-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    .rows {
      display: none;
    }
    .play {
      min-height: 44px;
      font-size: 0.875rem;
    }
    .trust {
      margin-top: 3.5rem;
    }
    .logos {
      gap: 1rem 2rem;
    }
    .wordmark {
      font-size: 1.0625rem;
    }
  }
</style>
