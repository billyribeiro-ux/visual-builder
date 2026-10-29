<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    /** primary: brand-colored band · dark: inverse band · soft: brand tint. */
    variant?: 'primary' | 'dark' | 'soft';
    class?: string;
  }

  let {
    eyebrow = '',
    title = 'Ready to accelerate your workflow?',
    subtitle = '',
    primaryCtaText = 'Get started',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = '',
    secondaryCtaHref = '',
    variant = 'primary',
    class: className = '',
    ...rest
  }: Props = $props();

  const tone = $derived(variant === 'dark' || variant === 'soft' ? variant : 'primary');
  const primaryClass = $derived(tone === 'primary' ? 'md-btn--on-primary' : 'md-btn--filled');
  const secondaryClass = $derived(
    tone === 'primary' ? 'md-btn--on-primary-outlined' : tone === 'dark' ? 'btn-dark-outlined' : 'md-btn--outlined'
  );
</script>

<section {...rest} class={['cta-section', className]}>
  <div class="md-container md-container--xl">
    <div class={['banner', `banner--${tone}`]}>
      <div class="texture" aria-hidden="true"></div>
      <div class="content">
        {#if eyebrow}
          <p class="eyebrow" data-prop="eyebrow">{eyebrow}</p>
        {/if}
        <h2 class="title" data-prop="title">{title}</h2>
        {#if subtitle}
          <p class="subtitle" data-prop="subtitle">{subtitle}</p>
        {/if}
        {#if primaryCtaText || secondaryCtaText}
          <div class="actions">
            {#if primaryCtaText}
              <a href={safeHref(primaryCtaHref)} class={['md-btn', 'md-btn--lg', primaryClass]}>
                <span data-prop="primaryCtaText">{primaryCtaText}</span>
                <Icon name="ArrowRight" size={16} />
              </a>
            {/if}
            {#if secondaryCtaText}
              <a href={safeHref(secondaryCtaHref)} class={['md-btn', 'md-btn--lg', secondaryClass]} data-prop="secondaryCtaText">{secondaryCtaText}</a>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</section>

<style>
  .cta-section {
    width: 100%;
    padding: var(--md-sys-section-space, 6rem) 0;
    background-color: var(--md-sys-color-surface);
  }
  .banner {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    padding: clamp(3rem, 2rem + 4vw, 5rem) clamp(1.5rem, 0.5rem + 4vw, 4rem);
    border-radius: clamp(var(--md-sys-shape-corner-large, 14px), 1rem + 1vw, 24px);
    text-align: center;
  }
  .texture {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
  }
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 44rem;
    margin: 0 auto;
  }
  .eyebrow {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 600;
  }
  .title {
    font-size: var(--md-sys-font-size-h2, 2.5rem);
    line-height: 1.12;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-tight, -0.022em);
    text-wrap: balance;
  }
  .subtitle {
    max-width: 36rem;
    margin-top: 1rem;
    font-size: var(--md-sys-font-size-lead, 1.125rem);
    line-height: 1.6;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 2.25rem;
  }

  /* primary: brand band with soft radial highlights and a faint grid texture */
  .banner--primary {
    background:
      radial-gradient(80% 120% at 0% 0%, color-mix(in srgb, var(--md-sys-color-primary) 80%, #FFFFFF) 0%, transparent 55%),
      radial-gradient(70% 110% at 100% 100%, color-mix(in srgb, var(--md-sys-color-primary) 72%, #000000) 0%, transparent 60%),
      var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      var(--md-sys-elevation-level4);
  }
  .banner--primary .texture {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.07) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(65% 75% at 50% 40%, #000 0%, transparent 80%);
    -webkit-mask-image: radial-gradient(65% 75% at 50% 40%, #000 0%, transparent 80%);
  }
  .banner--primary .eyebrow,
  .banner--primary .subtitle {
    color: color-mix(in srgb, var(--md-sys-color-on-primary) 90%, var(--md-sys-color-primary));
  }

  /* dark: inverse surface with a primary glow */
  .banner--dark {
    background:
      radial-gradient(60% 90% at 50% 0%, color-mix(in srgb, var(--md-sys-color-primary) 38%, transparent) 0%, transparent 70%),
      radial-gradient(40% 60% at 100% 100%, color-mix(in srgb, var(--md-sys-color-tertiary) 18%, transparent) 0%, transparent 70%),
      var(--md-sys-color-inverse-surface);
    color: var(--md-sys-color-inverse-on-surface);
    box-shadow: var(--md-sys-elevation-level4);
  }
  .banner--dark .texture {
    background-image:
      linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 44px 44px;
    mask-image: radial-gradient(60% 70% at 50% 30%, #000 0%, transparent 80%);
    -webkit-mask-image: radial-gradient(60% 70% at 50% 30%, #000 0%, transparent 80%);
  }
  .banner--dark .eyebrow {
    color: var(--md-sys-color-inverse-primary);
  }
  .banner--dark .subtitle {
    color: color-mix(in srgb, var(--md-sys-color-inverse-on-surface) 74%, var(--md-sys-color-inverse-surface));
  }
  .banner--dark :global(.md-btn--filled:focus-visible),
  .banner--dark .btn-dark-outlined:focus-visible {
    outline-color: var(--md-sys-color-inverse-on-surface);
  }
  .btn-dark-outlined {
    background-color: transparent;
    color: var(--md-sys-color-inverse-on-surface);
    border-color: color-mix(in srgb, var(--md-sys-color-inverse-on-surface) 30%, transparent);
  }
  .btn-dark-outlined:hover {
    background-color: color-mix(in srgb, var(--md-sys-color-inverse-on-surface) 10%, transparent);
    border-color: color-mix(in srgb, var(--md-sys-color-inverse-on-surface) 55%, transparent);
  }

  /* soft: brand tint with a hairline border */
  .banner--soft {
    background:
      radial-gradient(60% 90% at 50% 0%, color-mix(in srgb, var(--md-sys-color-primary) 10%, transparent) 0%, transparent 70%),
      var(--md-sys-color-primary-container);
    color: var(--md-sys-color-on-primary-container);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
  }
  .banner--soft .eyebrow {
    color: var(--md-sys-color-primary);
  }
  .banner--soft .title {
    color: var(--md-sys-color-on-surface);
  }
  .banner--soft .subtitle {
    color: var(--md-sys-color-on-surface-variant);
  }

  @media (max-width: 479px) {
    .actions {
      width: 100%;
    }
    .actions .md-btn {
      flex: 1 1 100%;
    }
  }
</style>
