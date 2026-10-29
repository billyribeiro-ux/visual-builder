<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface NavLink {
    label: string;
    href: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    brandName?: string;
    logoUrl?: string;
    links?: NavLink[];
    ctaText?: string;
    ctaHref?: string;
    class?: string;
  }

  let {
    brandName = 'Halden',
    logoUrl = '',
    links = [],
    ctaText = 'Get started',
    ctaHref = '/dashboard',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  let menuOpen = $state(false);
  /** Current URL path (client only); the matching link gets aria-current="page". */
  let currentPath = $state('');
  const logoSrc = $derived(safeSrc(logoUrl));

  function pathOf(href: string): string {
    const url = safeHref(href);
    if (!url.startsWith('/')) return '';
    return url.split(/[?#]/)[0] || '/';
  }

  function isActive(href: string): boolean {
    const path = pathOf(href);
    return path !== '' && path === currentPath;
  }

  // Track the browser location (SSR-safe: effects only run in the browser).
  $effect(() => {
    const sync = () => (currentPath = window.location.pathname);
    sync();
    window.addEventListener('popstate', sync);
    const nav = (window as Window & { navigation?: EventTarget }).navigation;
    nav?.addEventListener('currententrychange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      nav?.removeEventListener('currententrychange', sync);
    };
  });

  function choose(href: string) {
    const path = pathOf(href);
    if (path) currentPath = path;
    menuOpen = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && menuOpen) {
      menuOpen = false;
      document.getElementById(`${uid}-menu-button`)?.focus();
    }
  }
</script>

<header {...rest} class={['navbar', menuOpen && 'navbar--open', className]} onkeydown={handleKeydown}>
  <div class="inner">
    <a href="/" class="brand">
      {#if logoSrc}
        <img src={logoSrc} alt={brandName} width="112" height="28" class="logo" />
      {:else}
        <span class="mark" aria-hidden="true">{brandName.charAt(0)}</span>
      {/if}
      <span class="brand-name" data-prop="brandName">{brandName}</span>
    </a>

    {#if links.length > 0}
      <nav class="links" aria-label="Primary">
        {#each links as link, index (index)}
          {@const active = isActive(link.href)}
          <a
            href={safeHref(link.href)}
            class={['link', active && 'link--active']}
            aria-current={active ? 'page' : undefined}
            onclick={() => choose(link.href)}
            data-prop={`links.${index}.label`}>{link.label}</a
          >
        {/each}
      </nav>
    {/if}

    <div class="actions">
      {#if ctaText}
        <a href={safeHref(ctaHref)} class="md-btn md-btn--sm md-btn--filled cta" data-prop="ctaText">{ctaText}</a>
      {/if}
      {#if links.length > 0}
        <button
          type="button"
          id="{uid}-menu-button"
          class="menu-button"
          aria-expanded={menuOpen}
          aria-controls="{uid}-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onclick={() => (menuOpen = !menuOpen)}
        >
          <Icon name={menuOpen ? 'X' : 'List'} size={20} />
        </button>
      {/if}
    </div>
  </div>

  {#if links.length > 0}
    <nav id="{uid}-menu" class="mobile-menu" aria-label="Mobile" hidden={!menuOpen}>
      <ul class="mobile-list">
        {#each links as link, index (index)}
          {@const active = isActive(link.href)}
          <li>
            <a
              href={safeHref(link.href)}
              class={['mobile-link', active && 'mobile-link--active']}
              aria-current={active ? 'page' : undefined}
              onclick={() => choose(link.href)}
            >
              {link.label}
              <Icon name="CaretRight" size={16} class="mobile-caret" />
            </a>
          </li>
        {/each}
      </ul>
      {#if ctaText}
        <a href={safeHref(ctaHref)} class="md-btn md-btn--md md-btn--filled md-btn--block" onclick={() => (menuOpen = false)}>{ctaText}</a>
      {/if}
    </nav>
  {/if}
</header>

<style>
  .navbar {
    position: sticky;
    top: 0;
    z-index: 40;
    width: 100%;
    background-color: color-mix(in srgb, var(--md-sys-color-surface) 82%, transparent);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    backdrop-filter: saturate(180%) blur(14px);
    -webkit-backdrop-filter: saturate(180%) blur(14px);
  }
  .navbar--open {
    background-color: var(--md-sys-color-surface);
  }
  .inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    width: 100%;
    max-width: 1280px;
    /* 64px bar including the 1px bottom border */
    height: 63px;
    margin: 0 auto;
    padding: 0 var(--md-sys-container-padding, 1.5rem);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    margin-right: auto;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    color: var(--md-sys-color-on-surface);
  }
  .brand-name {
    font-family: var(--md-sys-font-heading);
    font-size: 1.0625rem;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .logo {
    height: 28px;
    width: auto;
    max-width: 160px;
    object-fit: contain;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 8px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 60%),
      var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
    box-shadow:
      inset 0 0 0 1px rgba(0, 0, 0, 0.08),
      0 1px 2px rgba(15, 23, 42, 0.16);
    font-size: 0.875rem;
    font-weight: 700;
    line-height: 1;
  }
  .links {
    display: none;
    align-items: center;
    gap: 0.25rem;
  }
  .link {
    display: inline-flex;
    align-items: center;
    height: 36px;
    padding: 0 0.75rem;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    transition:
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container);
  }
  .link--active,
  .link--active:hover {
    color: var(--md-sys-color-on-surface);
    background-color: var(--md-sys-color-surface-container);
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;
  }
  .menu-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--md-sys-color-outline-variant);
    border-radius: var(--md-sys-shape-corner-medium, 10px);
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
  }
  .menu-button:hover {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .mobile-menu {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 0.5rem var(--md-sys-container-padding, 1.25rem) 1.25rem;
    border-top: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface);
  }
  .mobile-menu[hidden] {
    display: none;
  }
  .mobile-list {
    list-style: none;
  }
  .mobile-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 48px;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    font-size: 1rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface);
  }
  .mobile-link :global(.mobile-caret) {
    color: var(--md-sys-color-on-surface-variant);
  }
  .mobile-link--active {
    color: var(--md-sys-color-primary);
  }
  @media (max-width: 479px) {
    .cta {
      display: none;
    }
  }
  @media (min-width: 768px) {
    .brand {
      margin-right: 0;
    }
    .links {
      display: flex;
      margin-left: 1.5rem;
    }
    .menu-button,
    .mobile-menu {
      display: none;
    }
  }
</style>
