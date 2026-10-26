<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    activeNav?: string;
    style?: string;
    onNavigate?: (href: string) => void;
    children?: Snippet;
  }

  let {
    title = 'Dashboard',
    activeNav = 'dashboard',
    style = '',
    onNavigate,
    children
  }: Props = $props();

  const navItems = [
    { id: 'dashboard', label: 'Overview', href: '/dashboard' },
    { id: 'settings', label: 'Settings', href: '/dashboard/settings' },
    { id: 'home', label: 'Public Site', href: '/' }
  ];

  function handleNav(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<div style="display: flex; min-height: 100vh; background-color: var(--md-sys-color-surface-container-low); {style}">
  <aside style="width: 16rem; border-right: 1px solid var(--md-sys-color-outline-variant); background-color: var(--md-sys-color-surface); padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
    <div style="padding: 0 0.75rem 1.25rem; border-bottom: 1px solid var(--md-sys-color-outline-variant); margin-bottom: 0.75rem;">
      <a href="/" onclick={(e) => handleNav(e, '/')} class="md-title-medium" style="text-decoration: none; color: var(--md-sys-color-primary); display: flex; align-items: center; gap: 0.5rem;">
        <span style="width: 1.5rem; height: 1.5rem; border-radius: 0.375rem; background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">A</span>
        Acme Console
      </a>
    </div>
    <nav style="display: flex; flex-direction: column; gap: 0.25rem;">
      {#each navItems as item (item.id)}
        <a
          href={item.href}
          onclick={(e) => handleNav(e, item.href)}
          class="md-label-large"
          style="padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-full); text-decoration: none; transition: background-color 150ms; background-color: {activeNav === item.id ? 'var(--md-sys-color-secondary-container)' : 'transparent'}; color: {activeNav === item.id ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)'};"
        >
          {item.label}
        </a>
      {/each}
    </nav>
  </aside>
  <div style="flex: 1; display: flex; flex-direction: column;">
    <header style="height: 4rem; border-bottom: 1px solid var(--md-sys-color-outline-variant); background-color: var(--md-sys-color-surface); display: flex; align-items: center; justify-content: space-between; padding: 0 2rem;">
      <h1 class="md-title-large" style="margin: 0;">{title}</h1>
      <span class="md-badge">Material Design 3</span>
    </header>
    <div style="padding: 2rem; flex: 1;">
      {@render children?.()}
    </div>
  </div>
</div>
