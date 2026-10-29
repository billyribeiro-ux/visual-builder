<script lang="ts">
  import { tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import NavMenu from './NavMenu.svelte';
  import { safeHref, safeSrc } from './lib/href.js';

  interface HeaderChild {
    label?: string;
    href?: string;
    description?: string;
    icon?: string;
  }

  interface HeaderLink {
    label?: string;
    href?: string;
    children?: HeaderChild[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    brandName?: string;
    brandHref?: string;
    logoUrl?: string;
    links?: HeaderLink[];
    ctaText?: string;
    ctaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    layout?: 'logo-left' | 'centered-logo' | 'split';
    sticky?: boolean;
    transparent?: boolean;
    announcement?: string;
    announcementLinkText?: string;
    announcementHref?: string;
    class?: string;
  }

  let {
    brandName = 'Halden',
    brandHref = '/',
    logoUrl = '',
    links = [],
    ctaText = 'Start free trial',
    ctaHref = '/signup',
    secondaryCtaText = 'Sign in',
    secondaryCtaHref = '/login',
    layout = 'logo-left',
    sticky = true,
    transparent = false,
    announcement = '',
    announcementLinkText = '',
    announcementHref = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const fallbackId = $props.id();
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `hdr-${nodeId}` : fallbackId;
  });

  const logo = $derived(safeSrc(logoUrl));
  const initial = $derived(brandName.trim().charAt(0).toUpperCase() || 'F');
  const navLinks = $derived(Array.isArray(links) ? links : []);

  let scrollY = $state(0);
  const scrolled = $derived(scrollY > 8);

  let drawerOpen = $state(false);
  /** The bar collapses into a drawer below 1024px; above that `drawerOpen` has no effect. */
  const compact = new MediaQuery('(max-width: 1023px)', false);
  const drawerActive = $derived(drawerOpen && compact.current);

  let drawerEl: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  async function setDrawer(open: boolean, restoreFocus = false) {
    drawerOpen = open;
    await tick();
    if (open) drawerEl?.querySelector<HTMLElement>('.drawer-close')?.focus();
    else if (restoreFocus) toggleEl?.focus();
  }

  function focusables(): HTMLElement[] {
    if (!drawerEl) return [];
    return Array.from(drawerEl.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
      (el) => el.offsetParent !== null
    );
  }

  function handleDrawerKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      // Nested dropdowns handle their own Escape first (they stop propagation).
      event.stopPropagation();
      setDrawer(false, true);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleDrawerClick(event: MouseEvent) {
    // Following any link inside the drawer closes it.
    if ((event.target as Element | null)?.closest?.('a[href]')) drawerOpen = false;
  }

  // Lock page scroll while the drawer is open.
  $effect(() => {
    if (!drawerActive) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  });
</script>

<svelte:window bind:scrollY />

<header
  {...rest}
  class={[
    'site-header',
    `layout-${layout}`,
    sticky && 'is-sticky',
    transparent && 'is-transparent',
    scrolled && 'is-scrolled',
    announcement && 'has-announcement',
    className
  ]}
>
  {#if announcement}
    <div class="announcement">
      <div class="md-container md-container--xl announcement-inner">
        <p class="announcement-text">
          <span data-prop="announcement">{announcement}</span>
          {#if announcementLinkText}
            <a href={safeHref(announcementHref)} class="announcement-link">
              <span data-prop="announcementLinkText">{announcementLinkText}</span>
              <Icon name="ArrowRight" size={14} />
            </a>
          {/if}
        </p>
      </div>
    </div>
  {/if}

  <div class="bar">
    <div class="md-container md-container--xl bar-inner">
      <a href={safeHref(brandHref)} class="brand">
        {#if logo}
          <img src={logo} alt="" width="32" height="32" class="logo" />
        {:else}
          <span class="mark" aria-hidden="true">{initial}</span>
        {/if}
        <span class="brand-name" data-prop="brandName">{brandName}</span>
      </a>

      {#if navLinks.length > 0}
        <div class="desktop-nav">
          <NavMenu
            items={navLinks}
            orientation="horizontal"
            align={layout === 'split' ? 'center' : 'start'}
            variant="plain"
            menuLabel="Primary"
            collapse={false}
            propBase="links"
          />
        </div>
      {/if}

      <div class="actions">
        {#if secondaryCtaText}
          <a href={safeHref(secondaryCtaHref)} class="secondary-cta" data-prop="secondaryCtaText">{secondaryCtaText}</a>
        {/if}
        {#if ctaText}
          <a href={safeHref(ctaHref)} class="md-btn md-btn--sm md-btn--filled primary-cta">
            <span data-prop="ctaText">{ctaText}</span>
          </a>
        {/if}
        <button
          type="button"
          class="menu-button"
          bind:this={toggleEl}
          aria-expanded={drawerOpen}
          aria-controls="{uid}-drawer"
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          onclick={() => setDrawer(!drawerOpen)}
        >
          <Icon name={drawerOpen ? 'X' : 'List'} size={22} />
        </button>
      </div>
    </div>
  </div>

  <!-- Drawer (below 1024px). A modal dialog: focus is trapped while open and restored on close. -->
  <div class={['drawer-layer', drawerOpen && 'is-open']}>
    <button type="button" class="drawer-backdrop" tabindex="-1" aria-label="Close menu" onclick={() => setDrawer(false, true)}></button>
    <div
      bind:this={drawerEl}
      id="{uid}-drawer"
      class="drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      tabindex="-1"
      onkeydown={handleDrawerKeydown}
      onclick={handleDrawerClick}
    >
      <div class="drawer-head">
        <span class="drawer-brand">
          {#if logo}
            <img src={logo} alt="" width="28" height="28" class="logo logo--sm" />
          {:else}
            <span class="mark mark--sm" aria-hidden="true">{initial}</span>
          {/if}
          {brandName}
        </span>
        <button type="button" class="drawer-close" aria-label="Close menu" onclick={() => setDrawer(false, true)}>
          <Icon name="X" size={22} />
        </button>
      </div>
      {#if navLinks.length > 0}
        <div class="drawer-nav">
          <NavMenu items={navLinks} orientation="vertical" variant="plain" menuLabel="Mobile" collapse={false} propBase="links" />
        </div>
      {/if}
      {#if ctaText || secondaryCtaText}
        <div class="drawer-actions">
          {#if secondaryCtaText}
            <a href={safeHref(secondaryCtaHref)} class="md-btn md-btn--lg md-btn--outlined md-btn--block">{secondaryCtaText}</a>
          {/if}
          {#if ctaText}
            <a href={safeHref(ctaHref)} class="md-btn md-btn--lg md-btn--filled md-btn--block">{ctaText}</a>
          {/if}
        </div>
      {/if}
    </div>
  </div>
</header>

<style>
  .site-header {
    --bar-height: 64px;
    --strip-height: 40px;
    position: relative;
    z-index: 50;
    width: 100%;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }
  .is-sticky {
    position: sticky;
    top: 0;
  }
  /* The announcement strip scrolls away; only the bar stays pinned. */
  .is-sticky.has-announcement {
    top: calc(var(--strip-height) * -1);
  }
  /* Transparent headers overlay the next section (e.g. a hero) instead of pushing it down. */
  .is-transparent {
    margin-bottom: calc(var(--bar-height) * -1);
  }

  /* ---------------------------------------------------------------- announcement */
  .announcement {
    height: var(--strip-height);
    display: flex;
    align-items: center;
    background-color: var(--md-sys-color-on-surface);
    color: var(--md-sys-color-surface);
    font-size: 0.8125rem;
    line-height: 1.25rem;
  }
  .announcement-inner {
    display: flex;
    justify-content: center;
    min-width: 0;
  }
  .announcement-text {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    white-space: nowrap;
  }
  .announcement-text > span {
    overflow: hidden;
    text-overflow: ellipsis;
    opacity: 0.88;
  }
  .announcement-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
    font-weight: 600;
  }
  .announcement-link:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* ---------------------------------------------------------------- bar */
  .bar {
    position: relative;
    height: var(--bar-height);
    background-color: color-mix(in srgb, var(--md-sys-color-surface) 86%, transparent);
    border-bottom: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    backdrop-filter: saturate(1.6) blur(14px);
    -webkit-backdrop-filter: saturate(1.6) blur(14px);
    transition:
      background-color var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease),
      border-color var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease),
      box-shadow var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .is-sticky.is-scrolled .bar {
    box-shadow: 0 8px 24px -16px rgba(0, 0, 0, 0.18);
  }
  .is-transparent .bar {
    background-color: transparent;
    border-bottom-color: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  .is-transparent.is-sticky.is-scrolled .bar {
    background-color: color-mix(in srgb, var(--md-sys-color-surface) 86%, transparent);
    border-bottom-color: color-mix(in srgb, var(--md-sys-color-outline-variant) 60%, transparent);
    backdrop-filter: saturate(1.6) blur(14px);
    -webkit-backdrop-filter: saturate(1.6) blur(14px);
  }
  .bar-inner {
    display: flex;
    align-items: center;
    gap: 1rem;
    height: 100%;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    flex-shrink: 0;
    min-height: 40px;
    font-family: var(--md-sys-font-heading);
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--md-sys-color-on-surface);
  }
  .logo {
    height: 32px;
    width: auto;
    max-width: 140px;
    object-fit: contain;
  }
  .logo--sm {
    height: 28px;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--md-sys-color-primary) 78%, white),
      var(--md-sys-color-primary) 55%,
      color-mix(in srgb, var(--md-sys-color-primary) 70%, black)
    );
    color: var(--md-sys-color-on-primary);
    font-size: 0.9375rem;
    font-weight: 800;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.28),
      0 1px 2px rgba(0, 0, 0, 0.18);
  }
  .mark--sm {
    width: 28px;
    height: 28px;
    font-size: 0.8125rem;
    border-radius: 8px;
  }

  .desktop-nav {
    display: none;
    min-width: 0;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-left: auto;
  }
  .secondary-cta {
    display: none;
    align-items: center;
    min-height: 40px;
    padding: 0 0.75rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    transition: color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .secondary-cta:hover {
    color: var(--md-sys-color-on-surface);
  }
  .primary-cta {
    display: none;
    height: 36px;
    padding: 0 1rem;
    font-weight: 600;
  }
  .menu-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-right: -0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    color: var(--md-sys-color-on-surface);
  }
  .menu-button:hover {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 6%, transparent);
  }

  @media (min-width: 560px) {
    .primary-cta {
      display: inline-flex;
    }
  }

  @media (min-width: 1024px) {
    .desktop-nav {
      display: block;
    }
    .secondary-cta {
      display: inline-flex;
    }
    .menu-button,
    .drawer-layer {
      display: none !important;
    }
    .layout-logo-left .desktop-nav {
      margin-left: 1.5rem;
    }
    .layout-split .bar-inner,
    .layout-centered-logo .bar-inner {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    }
    .layout-split .desktop-nav {
      justify-self: center;
    }
    .layout-centered-logo .desktop-nav {
      grid-column: 1;
      grid-row: 1;
      justify-self: start;
      margin-left: -0.75rem;
    }
    .layout-centered-logo .brand {
      grid-column: 2;
      grid-row: 1;
      justify-self: center;
    }
    .layout-centered-logo .actions {
      grid-column: 3;
      grid-row: 1;
    }
  }

  /* ---------------------------------------------------------------- drawer */
  .drawer-layer {
    display: none;
  }
  .drawer-layer.is-open {
    display: block;
  }
  .drawer-backdrop {
    position: fixed;
    inset: 0;
    z-index: 1000;
    width: 100%;
    background-color: rgba(0, 0, 0, 0.36);
    cursor: default;
    animation: header-fade-in var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .drawer {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    width: min(24rem, 90vw);
    padding: 0 1.25rem 1.5rem;
    overflow-y: auto;
    background-color: var(--md-sys-color-surface-container-lowest);
    border-left: 1px solid var(--md-sys-color-outline-variant);
    box-shadow: -24px 0 48px -24px rgba(0, 0, 0, 0.3);
    outline: none;
    animation: header-drawer-in var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: var(--bar-height);
    margin-bottom: 0.5rem;
    border-bottom: 1px solid var(--md-sys-color-surface-variant);
  }
  .drawer-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    font-family: var(--md-sys-font-heading);
    font-size: 1.0625rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .drawer-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    margin-right: -0.5rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
  }
  .drawer-close:hover {
    background-color: var(--md-sys-color-surface-container);
  }
  .drawer-nav {
    flex: 1;
  }
  .drawer-nav :global(.link) {
    min-height: 48px;
    font-size: 1rem;
  }
  .drawer-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-top: 1.25rem;
    margin-top: 1rem;
    border-top: 1px solid var(--md-sys-color-surface-variant);
  }

  @media (max-width: 767px) {
    .announcement-text {
      gap: 0.5rem;
    }
    .announcement-text > span {
      max-width: 52vw;
    }
  }

  @keyframes header-drawer-in {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes header-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
