<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children' | 'title'> {
    title?: string;
    /** Highlighted navigation item: "dashboard", "settings" or "home". */
    activeNav?: string;
    brandName?: string;
    /** Signed-in user shown as initials in the header avatar and the sidebar footer. */
    userName?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    title = 'Analytics overview',
    activeNav = 'dashboard',
    brandName = 'Halden',
    userName = '',
    class: className = '',
    children,
    ...rest
  }: Props = $props();

  const uid = $props.id();

  /** Node id of this shell: layout styles target the main content region. */
  const nodeId = $derived(rest['data-node-id']);

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview', href: '/dashboard', icon: 'SquaresFour' },
    { id: 'settings', label: 'Settings', href: '/dashboard/settings', icon: 'Gear' },
    { id: 'home', label: 'Public site', href: '/', icon: 'ArrowSquareOut' }
  ] as const;

  /** First letters of the first two words ("Jordan Lee" → "JL"). */
  const initials = $derived(
    userName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
  );
  const brandInitial = $derived(brandName.trim().charAt(0).toUpperCase() || 'A');
</script>

<div {...rest} class={['shell', className]}>
  <aside class="sidebar">
    <div class="brand-row">
      <a href="/" class="brand">
        <span class="brand-mark" aria-hidden="true">{brandInitial}</span>
        <span class="brand-name" data-prop="brandName">{brandName}</span>
      </a>
    </div>
    <nav class="nav" aria-label="Dashboard">
      {#each NAV_ITEMS as item (item.id)}
        {@const active = activeNav === item.id}
        <a href={item.href} class={['nav-item', active && 'nav-item--active']} aria-current={active ? 'page' : undefined}>
          <Icon name={item.icon} size={18} class="nav-icon" />
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
    <div class="side-footer">
      <span class="md-avatar avatar avatar--sm" aria-hidden="true">
        {#if initials}{initials}{:else}<Icon name="User" size={16} />{/if}
      </span>
      {#if userName}
        <span class="side-user" data-prop="userName">{userName}</span>
      {:else}
        <span class="side-user side-user--muted">Account</span>
      {/if}
    </div>
  </aside>

  <div class="main">
    <header class="header">
      <h1 class="title" data-prop="title">{title}</h1>
      <div class="header-tools">
        <div class="search" role="search">
          <label for="{uid}-search" class="md-visually-hidden">Search</label>
          <Icon name="MagnifyingGlass" size={16} class="search-icon" />
          <input id="{uid}-search" type="search" placeholder="Search…" autocomplete="off" class="md-input search-input" />
        </div>
        <span class="md-avatar avatar" role="img" aria-label={userName ? `Signed in as ${userName}` : 'Account'}>
          {#if initials}{initials}{:else}<Icon name="User" size={18} />{/if}
        </span>
      </div>
    </header>
    <div class="content" data-layout-of={nodeId}>
      {@render children?.()}
    </div>
  </div>
</div>

<style>
  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
  }

  /* ---------------------------------------------------------------- sidebar */
  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem var(--md-sys-container-padding, 1.25rem) 0.625rem;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface-container-low);
    min-width: 0;
  }
  .brand-row {
    display: flex;
    align-items: center;
    min-height: 40px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    border-radius: var(--md-sys-shape-corner-small, 6px);
    color: var(--md-sys-color-on-surface);
  }
  .brand-mark {
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
  .brand-name {
    font-family: var(--md-sys-font-heading);
    font-size: 1rem;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav {
    display: flex;
    gap: 0.25rem;
    margin: 0 calc(var(--md-sys-container-padding, 1.25rem) * -1);
    padding: 0.125rem var(--md-sys-container-padding, 1.25rem) 0.25rem;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar {
    display: none;
  }
  .nav-item {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    flex-shrink: 0;
    height: 40px;
    padding: 0 0.875rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    transition:
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .nav-item :global(.nav-icon) {
    color: var(--md-sys-color-on-surface-variant);
  }
  .nav-item:hover {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
  }
  .nav-item--active,
  .nav-item--active:hover {
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    box-shadow:
      var(--md-sys-elevation-level1),
      0 0 0 1px var(--md-sys-color-outline-variant);
  }
  .nav-item--active :global(.nav-icon) {
    color: var(--md-sys-color-primary);
  }
  .side-footer {
    display: none;
  }

  /* ------------------------------------------------------------------ main */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    height: 64px;
    padding: 0 var(--md-sys-container-padding, 1.25rem);
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    background-color: var(--md-sys-color-surface);
  }
  .title {
    min-width: 0;
    font-family: var(--md-sys-font-heading);
    font-size: 1.125rem;
    line-height: 1.3;
    font-weight: 650;
    letter-spacing: var(--md-sys-tracking-snug, -0.011em);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .header-tools {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }
  .search {
    position: relative;
    display: none;
    align-items: center;
  }
  .search :global(.search-icon) {
    position: absolute;
    left: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    pointer-events: none;
  }
  .search-input {
    width: 16rem;
    min-height: 38px;
    height: 38px;
    padding: 0 0.75rem 0 2.25rem;
    font-size: 0.875rem;
    background-color: var(--md-sys-color-surface-container-low);
    box-shadow: none;
    border-color: var(--md-sys-color-outline);
  }
  .search-input:focus {
    background-color: var(--md-sys-color-surface-container-lowest);
  }
  .avatar {
    width: 36px;
    height: 36px;
    font-size: 0.8125rem;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-sys-color-primary) 18%, transparent);
  }
  .avatar--sm {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }
  .content {
    flex: 1;
    min-width: 0;
    padding: 1.25rem var(--md-sys-container-padding, 1.25rem) 2rem;
    background-color: var(--md-sys-color-surface-container-low);
  }

  @media (min-width: 640px) {
    .search {
      display: flex;
    }
  }
  @media (min-width: 768px) {
    .content {
      padding: 2rem;
    }
    .header {
      padding: 0 2rem;
    }
  }
  @media (min-width: 1024px) {
    .shell {
      flex-direction: row;
    }
    .sidebar {
      position: sticky;
      top: 0;
      align-self: flex-start;
      width: 15rem;
      height: 100vh;
      flex-shrink: 0;
      gap: 0;
      padding: 0 0.75rem 0.75rem;
      border-bottom: none;
      border-right: 1px solid var(--md-sys-color-outline-variant);
    }
    .brand-row {
      height: 64px;
      padding: 0 0.5rem;
      margin-bottom: 0.75rem;
    }
    .nav {
      flex-direction: column;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      overflow: visible;
    }
    .nav-item {
      height: 36px;
      padding: 0 0.625rem;
      border-radius: 8px;
    }
    .side-footer {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-top: auto;
      padding: 0.75rem 0.5rem 0.25rem;
      border-top: 1px solid var(--md-sys-color-outline-variant);
    }
    .side-user {
      min-width: 0;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--md-sys-color-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .side-user--muted {
      color: var(--md-sys-color-on-surface-variant);
    }
  }
</style>
