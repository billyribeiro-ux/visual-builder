<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    activeNav?: string;
    children?: Snippet;
    onNavigate?: (path: string) => void;
  }

  let {
    title = 'Dashboard',
    activeNav = 'dashboard',
    children,
    onNavigate
  }: Props = $props();

  function handleNav(e: MouseEvent, path: string) {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  }
</script>

<div class="flex min-h-screen bg-[var(--color-background)]">
  <!-- Sidebar -->
  <aside class="w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] p-4 flex flex-col justify-between hidden md:flex">
    <div>
      <div class="flex items-center gap-2 font-bold text-lg text-[var(--color-foreground)] px-2 py-3 mb-6">
        <div class="h-8 w-8 rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white flex items-center justify-center font-bold">A</div>
        <span>Acme SaaS</span>
      </div>

      <nav class="space-y-1">
        <a
          href="/dashboard"
          onclick={(e) => handleNav(e, '/dashboard')}
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors {activeNav === 'dashboard' ? 'bg-[var(--color-accent)] text-[var(--color-primary)] font-bold' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
        >
          <span>📊</span>
          <span>Analytics</span>
        </a>
        <a
          href="/dashboard/settings"
          onclick={(e) => handleNav(e, '/dashboard/settings')}
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors {activeNav === 'settings' ? 'bg-[var(--color-accent)] text-[var(--color-primary)] font-bold' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </a>
        <a
          href="/"
          onclick={(e) => handleNav(e, '/')}
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
        >
          <span>🌐</span>
          <span>Public Site</span>
        </a>
      </nav>
    </div>

    <div class="border-t border-[var(--color-border)] pt-4 px-2">
      <div class="flex items-center gap-3">
        <div class="h-8 w-8 rounded-full bg-[var(--color-muted)] flex items-center justify-center font-semibold text-xs">AI</div>
        <div>
          <div class="text-xs font-semibold text-[var(--color-foreground)]">Developer Mode</div>
          <div class="text-[10px] text-[var(--color-muted-foreground)]">SvelteKit 3.1.0</div>
        </div>
      </div>
    </div>
  </aside>

  <!-- Main Content -->
  <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
    <header class="h-16 border-b border-[var(--color-border)] bg-[var(--color-card)] flex items-center justify-between px-6">
      <h1 class="text-xl font-bold text-[var(--color-foreground)]">{title}</h1>
      <div class="flex items-center gap-3">
        <a
          href="/dashboard/settings"
          onclick={(e) => handleNav(e, '/dashboard/settings')}
          class="text-sm font-medium text-[var(--color-primary)] hover:underline"
        >
          Workspace
        </a>
      </div>
    </header>

    <div class="p-6">
      {@render children?.()}
    </div>
  </main>
</div>
