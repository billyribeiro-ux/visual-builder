<script lang="ts">
  import { tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import type { HTMLAttributes } from 'svelte/elements';
  import Icon from './lib/Icon.svelte';
  import { safeHref } from './lib/href.js';

  interface NavChild {
    label?: string;
    href?: string;
    description?: string;
    icon?: string;
  }

  interface NavItem {
    label?: string;
    href?: string;
    children?: NavChild[];
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'class' | 'children'> {
    items?: NavItem[];
    orientation?: 'horizontal' | 'vertical';
    align?: 'start' | 'center' | 'end';
    variant?: 'plain' | 'underline' | 'pills';
    /** Visible label of the mobile menu button; also the navigation landmark's accessible name. */
    menuLabel?: string;
    /** The item whose href equals this value is marked as the current page. */
    currentHref?: string;
    /** Component-only (not a blueprint prop): collapse into a drawer below 768px. */
    collapse?: boolean;
    /** Component-only (not a blueprint prop): inline-edit path prefix when embedded in another component. */
    propBase?: string;
    class?: string;
  }

  let {
    items = [],
    orientation = 'horizontal',
    align = 'start',
    variant = 'plain',
    menuLabel = 'Menu',
    currentHref = '',
    collapse = true,
    propBase = 'items',
    class: className = '',
    ...rest
  }: Props = $props();

  const fallbackId = $props.id();
  /** Stable, readable ids derived from the node id (falls back to a hydration-safe component id). */
  const uid = $derived.by(() => {
    const nodeId = String(rest['data-node-id'] ?? '')
      .replace(/[^A-Za-z0-9_-]/g, '')
      .slice(0, 40);
    return nodeId ? `nav-${nodeId}` : fallbackId;
  });

  const list = $derived(
    (Array.isArray(items) ? items : []).map((item) => {
      const children = (Array.isArray(item?.children) ? item.children : []).map((child) => ({
        label: String(child?.label ?? ''),
        href: String(child?.href ?? ''),
        description: String(child?.description ?? ''),
        icon: String(child?.icon ?? '')
      }));
      return {
        label: String(item?.label ?? ''),
        href: String(item?.href ?? ''),
        children,
        mega: children.some((child) => child.description.trim() !== '')
      };
    })
  );

  const horizontal = $derived(orientation !== 'vertical');
  const collapsible = $derived(collapse && horizontal);
  const current = $derived(currentHref.trim());

  let openIndex = $state<number | null>(null);
  let drawerOpen = $state(false);
  /** The list is only a drawer below 768px; above that `drawerOpen` has no effect. */
  const mobile = new MediaQuery('(max-width: 767px)', false);
  const drawerActive = $derived(collapsible && drawerOpen && mobile.current);
  let navEl: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  function isCurrent(href: string): boolean {
    return current !== '' && href.trim() === current;
  }

  function panelLinks(index: number): HTMLElement[] {
    const panel = navEl?.querySelector(`#${CSS.escape(`${uid}-panel-${index}`)}`);
    return panel ? Array.from(panel.querySelectorAll<HTMLElement>('a[href]')) : [];
  }

  function focusTrigger(index: number) {
    navEl?.querySelector<HTMLElement>(`#${CSS.escape(`${uid}-trigger-${index}`)}`)?.focus();
  }

  function toggle(index: number) {
    openIndex = openIndex === index ? null : index;
  }

  async function openAndFocus(index: number, which: 'first' | 'last') {
    openIndex = index;
    await tick();
    const links = panelLinks(index);
    (which === 'first' ? links[0] : links[links.length - 1])?.focus();
  }

  async function setDrawer(open: boolean, restoreFocus = false) {
    drawerOpen = open;
    if (!open) openIndex = null;
    await tick();
    if (open) {
      navEl?.querySelector<HTMLElement>('.drawer-close')?.focus();
    } else if (restoreFocus) {
      toggleEl?.focus();
    }
  }

  function drawerFocusables(): HTMLElement[] {
    const wrap = navEl?.querySelector('.list-wrap');
    if (!wrap) return [];
    return Array.from(wrap.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (event.key === 'Escape') {
      if (openIndex !== null) {
        const index = openIndex;
        openIndex = null;
        focusTrigger(index);
        event.stopPropagation();
      } else if (drawerOpen) {
        setDrawer(false, true);
        event.stopPropagation();
      }
      return;
    }

    if (event.key === 'Tab' && drawerActive) {
      const focusables = drawerFocusables();
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (!target || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const triggerIndex = target.dataset.navTrigger;
    if (triggerIndex !== undefined) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        openAndFocus(Number(triggerIndex), event.key === 'ArrowDown' ? 'first' : 'last');
      }
      return;
    }

    const panelIndex = target.dataset.navPanelLink;
    if (panelIndex !== undefined) {
      const links = panelLinks(Number(panelIndex));
      const position = links.indexOf(target);
      if (position === -1) return;
      event.preventDefault();
      const next =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? links.length - 1
            : (position + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links[next]?.focus();
    }
  }

  function handleFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (openIndex === null || !next) return;
    const item = navEl?.querySelector(`[data-nav-item="${openIndex}"]`);
    if (item && !item.contains(next)) openIndex = null;
  }

  function handleDocumentPointerDown(event: PointerEvent) {
    if (!navEl || navEl.contains(event.target as Node)) return;
    if (openIndex !== null) openIndex = null;
    if (drawerOpen) setDrawer(false);
  }

  function closeAll() {
    openIndex = null;
    if (drawerOpen) drawerOpen = false;
  }

  // Lock page scroll while the mobile drawer is open.
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

<svelte:document onpointerdown={handleDocumentPointerDown} />

<nav
  {...rest}
  bind:this={navEl}
  class={[
    'nav',
    `nav--${horizontal ? 'horizontal' : 'vertical'}`,
    `nav--${variant}`,
    `nav--align-${align}`,
    collapsible && 'nav--collapsible',
    drawerOpen && 'nav--drawer-open',
    className
  ]}
  aria-label={menuLabel.trim() || 'Menu'}
  onkeydown={handleKeydown}
  onfocusout={handleFocusOut}
>
  {#if collapsible}
    <button
      type="button"
      class="toggle"
      bind:this={toggleEl}
      aria-expanded={drawerOpen}
      aria-controls="{uid}-list"
      onclick={() => setDrawer(!drawerOpen)}
    >
      <Icon name="List" size={20} />
      <span data-prop="menuLabel">{menuLabel}</span>
    </button>
    <div class="backdrop" aria-hidden="true"></div>
  {/if}

  <div class="list-wrap" id="{uid}-list">
    {#if collapsible}
      <div class="drawer-head">
        <span class="drawer-title">{menuLabel}</span>
        <button type="button" class="drawer-close" aria-label="Close menu" onclick={() => setDrawer(false, true)}>
          <Icon name="X" size={20} />
        </button>
      </div>
    {/if}
    <ul class="list">
      {#each list as item, index (index)}
        {@const open = openIndex === index}
        <li class={['item', item.children.length > 0 && 'item--parent']} data-nav-item={index}>
          {#if item.children.length > 0}
            <button
              type="button"
              id="{uid}-trigger-{index}"
              class={['link', 'trigger', open && 'is-open']}
              aria-expanded={open}
              aria-controls="{uid}-panel-{index}"
              data-nav-trigger={index}
              onclick={() => toggle(index)}
            >
              <span data-prop={`${propBase}.${index}.label`}>{item.label}</span>
              <Icon name="CaretDown" size={14} class="caret" />
            </button>
            <div id="{uid}-panel-{index}" class={['panel', item.mega && 'panel--mega']} hidden={!open}>
              <ul class="panel-list">
                {#each item.children as child, childIndex (childIndex)}
                  <li>
                    <a
                      href={safeHref(child.href)}
                      class="panel-link"
                      aria-current={isCurrent(child.href) ? 'page' : undefined}
                      data-nav-panel-link={index}
                      onclick={closeAll}
                    >
                      {#if item.mega || child.icon}
                        <span class="panel-icon"><Icon name={child.icon || 'Sparkle'} size={18} /></span>
                      {/if}
                      <span class="panel-text">
                        <span class="panel-label" data-prop={`${propBase}.${index}.children.${childIndex}.label`}>{child.label}</span>
                        {#if child.description}
                          <span class="panel-description" data-prop={`${propBase}.${index}.children.${childIndex}.description`}>
                            {child.description}
                          </span>
                        {/if}
                      </span>
                    </a>
                  </li>
                {/each}
              </ul>
            </div>
          {:else}
            <a
              href={safeHref(item.href)}
              class={['link', isCurrent(item.href) && 'is-current']}
              aria-current={isCurrent(item.href) ? 'page' : undefined}
              onclick={closeAll}
              data-prop={`${propBase}.${index}.label`}
            >
              {item.label}
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</nav>

<style>
  .nav {
    position: relative;
    font-family: var(--md-sys-font-body);
    color: var(--md-sys-color-on-surface);
  }

  /* ---------------------------------------------------------------- list */
  .list-wrap {
    display: flex;
  }
  .list {
    display: flex;
    list-style: none;
    gap: 0.25rem;
    width: 100%;
  }
  .nav--horizontal .list {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }
  .nav--vertical .list {
    flex-direction: column;
    align-items: stretch;
  }
  .nav--horizontal.nav--align-center .list {
    justify-content: center;
  }
  .nav--horizontal.nav--align-end .list {
    justify-content: flex-end;
  }
  .nav--vertical.nav--align-center .list {
    align-items: center;
    text-align: center;
  }
  .nav--vertical.nav--align-end .list {
    align-items: flex-end;
    text-align: right;
  }
  .item {
    position: relative;
  }

  /* ---------------------------------------------------------------- links */
  .link {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    min-height: 40px;
    padding: 0.5rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.25rem;
    letter-spacing: -0.005em;
    color: var(--md-sys-color-on-surface-variant);
    white-space: nowrap;
    transition:
      color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease),
      background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .nav--vertical .link {
    width: 100%;
    justify-content: space-between;
  }
  .nav--vertical.nav--align-center .link {
    justify-content: center;
  }
  .link:hover,
  .link.is-open {
    color: var(--md-sys-color-on-surface);
  }
  .link.is-current,
  .link[aria-current='page'] {
    color: var(--md-sys-color-on-surface);
    font-weight: 600;
  }
  .link :global(.caret) {
    opacity: 0.7;
    transition: transform var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .link.is-open :global(.caret) {
    transform: rotate(180deg);
  }

  /* plain */
  .nav--plain .link:hover,
  .nav--plain .link.is-open {
    background-color: color-mix(in srgb, var(--md-sys-color-on-surface) 5%, transparent);
  }

  /* underline */
  .nav--underline .link::after {
    content: '';
    position: absolute;
    left: 0.75rem;
    right: 0.75rem;
    bottom: 0.25rem;
    height: 2px;
    border-radius: 2px;
    background-color: var(--md-sys-color-primary);
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
  }
  .nav--underline .link:hover::after,
  .nav--underline .link.is-open::after,
  .nav--underline .link[aria-current='page']::after {
    transform: scaleX(1);
  }
  .nav--vertical.nav--underline .link::after {
    left: 0;
    right: auto;
    top: 0.5rem;
    bottom: 0.5rem;
    width: 2px;
    height: auto;
    transform: scaleY(0);
    transform-origin: center top;
  }
  .nav--vertical.nav--underline .link:hover::after,
  .nav--vertical.nav--underline .link.is-open::after,
  .nav--vertical.nav--underline .link[aria-current='page']::after {
    transform: scaleY(1);
  }

  /* pills */
  .nav--pills .link {
    border-radius: var(--md-sys-shape-corner-full, 9999px);
    padding: 0.5rem 1rem;
  }
  .nav--pills .link:hover,
  .nav--pills .link.is-open {
    background-color: var(--md-sys-color-surface-container);
  }
  .nav--pills .link[aria-current='page'] {
    background-color: var(--md-sys-color-secondary-container);
    color: var(--md-sys-color-on-secondary-container);
  }

  /* ---------------------------------------------------------------- dropdown panels */
  .panel {
    z-index: 60;
    animation: nav-panel-in var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .panel[hidden] {
    display: none;
  }
  .nav--horizontal .panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 15rem;
    max-width: calc(100vw - 2rem);
    padding: 0.5rem;
    border-radius: var(--md-sys-shape-corner-large, 16px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 70%, transparent);
    box-shadow:
      0 16px 40px -12px rgba(0, 0, 0, 0.18),
      0 4px 12px -4px rgba(0, 0, 0, 0.08);
  }
  .nav--horizontal.nav--align-end .panel {
    left: auto;
    right: 0;
  }
  .nav--horizontal.nav--align-center .panel {
    left: 50%;
    transform: translateX(-50%);
  }
  .nav--horizontal .panel--mega {
    width: 36rem;
    padding: 0.75rem;
  }
  .panel-list {
    list-style: none;
    display: grid;
    gap: 0.125rem;
  }
  .nav--horizontal .panel--mega .panel-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.25rem;
  }
  .panel-link {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    min-height: 40px;
    padding: 0.625rem 0.75rem;
    border-radius: var(--md-sys-shape-corner-medium, 12px);
    color: var(--md-sys-color-on-surface);
    transition: background-color var(--md-sys-motion-duration-short, 150ms) var(--md-sys-motion-easing-standard, ease);
  }
  .panel-link:hover,
  .panel-link:focus-visible {
    background-color: var(--md-sys-color-surface-container-low);
  }
  .panel-link[aria-current='page'] .panel-label {
    color: var(--md-sys-color-primary);
  }
  .panel-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border-radius: var(--md-sys-shape-corner-small, 8px);
    background-color: var(--md-sys-color-surface-container-lowest);
    border: 1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 80%, transparent);
    color: var(--md-sys-color-primary);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  .panel-link:hover .panel-icon {
    border-color: color-mix(in srgb, var(--md-sys-color-primary) 35%, transparent);
  }
  .panel-text {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;
    padding-top: 0.0625rem;
  }
  .panel-label {
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.25rem;
  }
  .panel-description {
    font-size: 0.8125rem;
    line-height: 1.125rem;
    color: var(--md-sys-color-on-surface-variant);
  }
  .panel--mega .panel-link {
    padding: 0.75rem;
  }

  /* Vertical menus expand children inline (footer / sidebar use). */
  .nav--vertical .panel {
    padding: 0.25rem 0 0.5rem 0.75rem;
  }
  .nav--vertical.nav--align-center .panel,
  .nav--vertical.nav--align-end .panel {
    padding-left: 0;
  }
  .nav--vertical .panel-link {
    padding: 0.5rem 0.75rem;
  }
  .nav--vertical .panel-icon {
    width: 32px;
    height: 32px;
  }

  /* ---------------------------------------------------------------- mobile toggle + drawer */
  .toggle,
  .drawer-head,
  .backdrop {
    display: none;
  }

  @media (max-width: 767px) {
    .nav--collapsible .toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 44px;
      padding: 0 1rem 0 0.75rem;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      border: 1px solid var(--md-sys-color-outline-variant);
      background-color: var(--md-sys-color-surface-container-lowest);
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface);
    }
    .nav--collapsible .list-wrap {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 1001;
      display: none;
      flex-direction: column;
      width: min(22rem, 88vw);
      padding: 0 1rem 1.5rem;
      overflow-y: auto;
      background-color: var(--md-sys-color-surface-container-lowest);
      border-left: 1px solid var(--md-sys-color-outline-variant);
      box-shadow: -24px 0 48px -24px rgba(0, 0, 0, 0.28);
    }
    .nav--collapsible.nav--drawer-open .list-wrap {
      display: flex;
      animation: nav-drawer-in var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
    }
    .nav--collapsible.nav--drawer-open .backdrop {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 1000;
      background-color: rgba(0, 0, 0, 0.36);
      animation: nav-fade-in var(--md-sys-motion-duration-medium, 300ms) var(--md-sys-motion-easing-standard, ease);
    }
    .nav--collapsible .drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 64px;
      margin-bottom: 0.5rem;
      border-bottom: 1px solid var(--md-sys-color-surface-variant);
    }
    .drawer-title {
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      color: var(--md-sys-color-on-surface-variant);
    }
    .drawer-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      margin-right: -0.5rem;
      border-radius: var(--md-sys-shape-corner-full, 9999px);
      color: var(--md-sys-color-on-surface);
    }
    .drawer-close:hover {
      background-color: var(--md-sys-color-surface-container);
    }
    .nav--collapsible .list {
      flex-direction: column;
      align-items: stretch;
      flex-wrap: nowrap;
      gap: 0.125rem;
    }
    .nav--collapsible .link {
      width: 100%;
      min-height: 48px;
      justify-content: space-between;
      font-size: 1rem;
    }
    .nav--collapsible.nav--underline .link::after {
      display: none;
    }
    .nav--collapsible .panel {
      position: static;
      width: auto;
      min-width: 0;
      max-width: none;
      transform: none;
      padding: 0 0 0.5rem 0.5rem;
      border: none;
      box-shadow: none;
      background: none;
      animation: none;
    }
    .nav--collapsible .panel--mega .panel-list {
      grid-template-columns: 1fr;
    }
  }

  @keyframes nav-panel-in {
    from {
      opacity: 0;
      translate: 0 -4px;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }
  @keyframes nav-drawer-in {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
  @keyframes nav-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
