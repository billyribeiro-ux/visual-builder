<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  interface Props {
    title?: string;
    activeNav?: string;
    style?: string;
    onNavigate?: (path: string) => void;
    children?: Snippet;
  }

  let {
    title = 'Analytics Overview',
    activeNav = 'overview',
    style = '',
    onNavigate,
    children
  }: Props = $props();

  const navItems = [
    { key: 'overview', label: 'Overview', href: '/dashboard' },
    { key: 'performance', label: 'Performance', href: '/dashboard' },
    { key: 'settings', label: 'Settings', href: '/dashboard' }
  ];

  function handleLink(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<div class="md-dashboard" {style}>
  <aside class="md-dashboard__sidebar">
    <div>
      <div style="font-weight: 800; font-size: 1.125rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.5rem;">
        <span style="color: var(--md-sys-color-primary);">⚡</span> Acme SaaS
      </div>

      <nav style="display: flex; flex-direction: column; gap: 0.375rem;">
        {#each navItems as item (item.key)}
          <a
            href={item.href}
            onclick={(e) => handleLink(e, item.href)}
            style="padding: 0.625rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); font-size: 0.875rem; font-weight: 600; text-decoration: none; color: {activeNav === item.key ? 'var(--md-sys-color-on-primary-container)' : 'var(--md-sys-color-on-surface-variant)'}; background-color: {activeNav === item.key ? 'var(--md-sys-color-primary-container)' : 'transparent'};"
          >
            {item.label}
          </a>
        {/each}
      </nav>
    </div>

    <div>
      <a
        href="/"
        onclick={(e) => handleLink(e, '/')}
        style="font-size: 0.8125rem; color: var(--md-sys-color-primary); text-decoration: none;"
      >
        ← Back to Landing
      </a>
    </div>
  </aside>

  <div class="md-dashboard__main">
    <header class="md-dashboard__header">
      <h1 style="font-size: 1.25rem; font-weight: 700;">{title}</h1>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <Button size="sm" variant="tonal">Download Report</Button>
      </div>
    </header>

    <div class="md-dashboard__content">
      {@render children?.()}
    </div>
  </div>
</div>
