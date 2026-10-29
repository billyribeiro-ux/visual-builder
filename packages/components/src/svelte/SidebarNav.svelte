<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface NavItem {
    label: string;
    href?: string;
    icon?: string;
    badge?: string;
    active?: boolean;
  }

  interface NavSection {
    title?: string;
    items: NavItem[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    brandName?: string;
    sections?: NavSection[];
    footerUserName?: string;
    footerUserEmail?: string;
    class?: string;
  }

  let {
    brandName = 'Workspace',
    sections = [],
    footerUserName = '',
    footerUserEmail = '',
    class: className = '',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  /** Desktop/tablet: icon-only rail. */
  let collapsed = $state(false);
  /** Mobile: navigation disclosure (closed by default). */
  let mobileOpen = $state(false);

  const safeSections = $derived(
    (Array.isArray(sections) ? sections : []).map((section) => ({
      title: section?.title ?? '',
      items: Array.isArray(section?.items) ? section.items : []
    }))
  );

  const brandInitial = $derived((brandName.trim()[0] ?? 'W').toUpperCase());
  const userInitials = $derived.by(() => {
    const words = footerUserName.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '';
    return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0]).toUpperCase();
  });
</script>

<aside {...rest} class={['sidebar', collapsed && 'is-collapsed', mobileOpen && 'is-open', className]}>
  <div class="top">
    <a class="brand" href="/">
      <span class="brand-mark" aria-hidden="true">{brandInitial}</span>
      <span class="brand-name label-text" data-prop="brandName">{brandName}</span>
    </a>
    <button
      type="button"
      class="icon-btn collapse-btn"
      aria-expanded={!collapsed}
      aria-controls="{uid}-nav"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      onclick={() => (collapsed = !collapsed)}
    >
      <Icon name="SidebarSimple" size={18} />
    </button>
    <button
      type="button"
      class="icon-btn menu-btn"
      aria-expanded={mobileOpen}
      aria-controls="{uid}-nav"
      aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      onclick={() => (mobileOpen = !mobileOpen)}
    >
      <Icon name={mobileOpen ? 'X' : 'List'} size={20} />
    </button>
  </div>

  <div class="panel" id="{uid}-nav">
    <nav class="nav" aria-label={brandName ? `${brandName} navigation` : 'Sidebar navigation'}>
      {#each safeSections as section, si (si)}
        <div class="section">
          {#if section.title}
            <p class="section-title label-text" data-prop={`sections.${si}.title`}>{section.title}</p>
          {/if}
          <ul class="items">
            {#each section.items as item, ii (ii)}
              <li>
                <a
                  href={safeHref(item.href)}
                  class={['item', item.active && 'is-active']}
                  aria-current={item.active ? 'page' : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <span class="item-icon"><Icon name={item.icon || 'Circle'} size={18} /></span>
                  <span class="item-label label-text" data-prop={`sections.${si}.items.${ii}.label`}>{item.label}</span>
                  {#if item.badge}
                    <span class="item-badge" data-prop={`sections.${si}.items.${ii}.badge`}>{item.badge}</span>
                  {/if}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>

    {#if footerUserName || footerUserEmail}
      <div class="footer">
        <span class="user-avatar" aria-hidden="true">{userInitials || '?'}</span>
        <span class="user-text label-text">
          <span class="user-name" data-prop="footerUserName">{footerUserName}</span>
          <span class="user-email" data-prop="footerUserEmail">{footerUserEmail}</span>
        </span>
      </div>
    {/if}
  </div>
</aside>

<style>
  .sidebar {
    --sidebar-border: color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    --sidebar-width: 16rem;
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 0;
    background-color: var(--md-sys-color-surface-container-lowest);
    color: var(--md-sys-color-on-surface);
    border-bottom: 1px solid var(--sidebar-border);
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 3.75rem;
    padding: 0.75rem 1rem;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    border-radius: var(--md-sys-shape-corner-small, 8px);
  }
  .brand-mark {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 0.5rem;
    background: linear-gradient(135deg, var(--md-sys-color-primary), color-mix(in srgb, var(--md-sys-color-primary) 65%, black));
    color: var(--md-sys-color-on-primary);
    font-size: 0.8125rem;
    font-weight: 700;
  }
  .brand-name {
    font-size: 0.9375rem;
    font-weight: 650;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icon-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .icon-btn:hover {
    background-color: var(--md-sys-color-surface-container);
    color: var(--md-sys-color-on-surface);
  }
  .collapse-btn {
    display: none;
  }
  .panel {
    display: none;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }
  .is-open .panel {
    display: flex;
  }
  .nav {
    flex: 1;
    padding: 0.25rem 0.75rem 0.75rem;
  }
  .section + .section {
    margin-top: 1.25rem;
  }
  .section-title {
    padding: 0 0.625rem 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
  }
  .items {
    display: grid;
    gap: 0.125rem;
    list-style: none;
  }
  .item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    min-height: 2.5rem;
    padding: 0.4375rem 0.625rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.875rem;
    font-weight: 500;
    transition: background-color var(--md-sys-motion-duration-short, 150ms) ease, color var(--md-sys-motion-duration-short, 150ms) ease;
  }
  .item:hover {
    background-color: var(--md-sys-color-surface-container-low);
    color: var(--md-sys-color-on-surface);
  }
  .item.is-active {
    background-color: color-mix(in srgb, var(--md-sys-color-primary) 9%, transparent);
    color: var(--md-sys-color-primary);
    font-weight: 600;
  }
  .item-icon {
    flex-shrink: 0;
    display: inline-flex;
    width: 1.25rem;
    justify-content: center;
  }
  .item-label {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .item-badge {
    flex-shrink: 0;
    min-width: 1.375rem;
    padding: 0 0.375rem;
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    font-weight: 600;
    line-height: 1.25rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .item.is-active .item-badge {
    background-color: var(--md-sys-color-primary);
    color: var(--md-sys-color-on-primary);
  }
  .footer {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    margin: 0 0.75rem 0.75rem;
    padding: 0.75rem 0.625rem 0;
    border-top: 1px solid var(--sidebar-border);
  }
  .user-avatar {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    background-color: var(--md-sys-color-surface-container-high);
    color: var(--md-sys-color-on-surface-variant);
    font-size: 0.6875rem;
    font-weight: 650;
  }
  .user-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
    line-height: 1.3;
  }
  .user-name {
    font-size: 0.8125rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .user-email {
    font-size: 0.75rem;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Tablet and up: vertical rail, collapsible to icons only. */
  @media (min-width: 768px) {
    .sidebar {
      width: var(--sidebar-width);
      min-height: 36rem;
      height: 100%;
      border-bottom: 0;
      border-right: 1px solid var(--sidebar-border);
      transition: width var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
    }
    .sidebar.is-collapsed {
      width: 4.5rem;
    }
    .menu-btn {
      display: none;
    }
    .collapse-btn {
      display: inline-flex;
    }
    .panel {
      display: flex;
    }
    .footer {
      margin-top: auto;
    }
    .is-collapsed .top {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    .is-collapsed .nav {
      padding: 0.25rem 0.75rem 0.75rem;
    }
    .is-collapsed .label-text {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .is-collapsed .section + .section {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--sidebar-border);
    }
    .is-collapsed .item {
      justify-content: center;
      padding: 0.4375rem;
    }
    .is-collapsed .item-badge {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      min-width: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      padding: 0;
      font-size: 0;
      line-height: 0;
      background-color: var(--md-sys-color-primary);
      box-shadow: 0 0 0 2px var(--md-sys-color-surface-container-lowest);
    }
    .is-collapsed .footer {
      justify-content: center;
      padding: 0.75rem 0 0;
    }
  }
</style>
