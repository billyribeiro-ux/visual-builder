<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { safeHref, safeSrc } from './lib/href.js';

  interface Logo {
    name?: string;
    src?: string;
    href?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    heading?: string;
    logos?: Logo[];
    /** Desaturated logos that regain color on hover. */
    grayscale?: boolean;
    /** Logos per row on desktop (3–6). */
    columns?: number;
    variant?: 'grid' | 'marquee-static';
    class?: string;
  }

  let {
    heading = 'Trusted by product teams at fast-growing companies',
    logos = [],
    grayscale = true,
    columns = 6,
    variant = 'grid',
    class: className = '',
    ...rest
  }: Props = $props();

  /** Wordmark treatments cycle so text-only logos read as distinct marks (never imitations of real brands). */
  const WORDMARK_STYLES = ['wm-a', 'wm-b', 'wm-c', 'wm-d', 'wm-e', 'wm-f'];

  const items = $derived(
    (Array.isArray(logos) ? logos : [])
      .filter((logo) => logo && typeof logo === 'object')
      .map((logo) => ({ name: logo.name ?? '', src: safeSrc(logo.src), href: logo.href ?? '' }))
  );
  const cols = $derived(Math.min(6, Math.max(3, Math.round(Number(columns) || 6))));
  const marquee = $derived(variant === 'marquee-static');
  let failed = $state<Record<string, true>>({});
</script>

{#snippet mark(logo: { name: string; src: string; href: string }, index: number)}
  {#if logo.src && !failed[logo.src]}
    <img
      class="logo-img"
      src={logo.src}
      alt={logo.name}
      width="160"
      height="48"
      loading="lazy"
      decoding="async"
      onerror={() => (failed = { ...failed, [logo.src]: true })}
    />
  {:else}
    <span class={['wordmark', WORDMARK_STYLES[index % WORDMARK_STYLES.length]]} data-prop={`logos.${index}.name`}>{logo.name}</span>
  {/if}
{/snippet}

<section {...rest} class={['logo-cloud', grayscale && 'is-grayscale', className]}>
  {#if heading}
    <p class="heading" data-prop="heading">{heading}</p>
  {/if}
  <ul class={['logos', marquee ? 'variant-marquee' : 'variant-grid']} style:--cols={cols} style:--cols-tablet={Math.min(cols, 3)}>
    {#each items as logo, index (index)}
      <li class="logo">
        {#if logo.href}
          <a href={safeHref(logo.href)} class="logo-link" aria-label={logo.src && !failed[logo.src] ? undefined : logo.name || undefined}>
            {@render mark(logo, index)}
          </a>
        {:else}
          {@render mark(logo, index)}
        {/if}
      </li>
    {/each}
  </ul>
</section>

<style>
  .logo-cloud {
    width: 100%;
  }
  .heading {
    margin-bottom: 2rem;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.5;
    text-align: center;
    text-wrap: balance;
    color: var(--md-sys-color-on-surface-variant);
  }
  .logos {
    list-style: none;
  }
  .variant-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 6), minmax(0, 1fr));
    gap: 1rem 2rem;
    align-items: center;
  }
  .variant-marquee {
    display: flex;
    align-items: center;
    gap: 3.5rem;
    width: max-content;
    max-width: 100%;
    margin: 0 auto;
    padding: 0.25rem 2rem;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, transparent 0, rgb(0, 0, 0) 2rem, rgb(0, 0, 0) calc(100% - 2rem), transparent 100%);
  }
  .variant-marquee::-webkit-scrollbar {
    display: none;
  }
  .variant-marquee .logo {
    flex: 0 0 auto;
    scroll-snap-align: center;
  }
  @media (max-width: 1023px) {
    .variant-grid {
      grid-template-columns: repeat(var(--cols-tablet, 3), minmax(0, 1fr));
    }
  }
  @media (max-width: 767px) {
    .variant-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.5rem 1.5rem;
    }
    .variant-marquee {
      gap: 2.5rem;
    }
  }
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 64px;
  }
  .logo-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.25rem 0.5rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
  }
  .logo-link:focus-visible {
    outline: 2px solid var(--md-sys-color-primary);
    outline-offset: 2px;
  }
  .logo-img {
    display: block;
    width: auto;
    max-width: 100%;
    height: 32px;
    object-fit: contain;
    transition:
      filter var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease),
      opacity var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .is-grayscale .logo-img {
    filter: grayscale(1);
    opacity: 0.64;
  }
  .is-grayscale .logo:hover .logo-img,
  .is-grayscale .logo-link:focus-visible .logo-img {
    filter: none;
    opacity: 1;
  }
  .wordmark {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    /* Room for italic overhang, which overflow: hidden would otherwise clip. */
    padding: 0 0.12em;
    white-space: nowrap;
    font-family: var(--md-sys-font-heading);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.03em;
    color: var(--md-sys-color-on-surface);
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .is-grayscale .wordmark {
    color: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 82%, transparent);
  }
  .is-grayscale .logo:hover .wordmark {
    color: var(--md-sys-color-on-surface);
  }
  .wm-b {
    font-family: var(--md-sys-font-body);
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .wm-c {
    font-size: 1.375rem;
    font-weight: 500;
    letter-spacing: -0.045em;
  }
  .wm-d {
    font-family: var(--md-sys-font-mono);
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .wm-e {
    font-size: 1.3125rem;
    font-weight: 800;
    font-style: italic;
    letter-spacing: -0.04em;
  }
  .wm-f {
    font-family: var(--md-sys-font-body);
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: lowercase;
  }
</style>
