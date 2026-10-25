<script lang="ts">
  interface FooterCol {
    title: string;
    links: { label: string; href: string }[];
  }

  interface Props {
    brandName?: string;
    tagline?: string;
    copyright?: string;
    columns?: FooterCol[];
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    brandName = 'Acme SaaS',
    tagline = 'Engineering velocity for high-growth tech companies.',
    copyright = '© 2026 Acme SaaS Inc.',
    columns = [],
    style = '',
    onNavigate
  }: Props = $props();

  function handleLink(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<footer class="border-t border-[var(--color-border)] bg-[var(--color-card)] py-12" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <div class="lg:col-span-2">
        <div class="flex items-center gap-2 font-bold text-lg text-[var(--color-foreground)]">
          <div class="flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white text-sm">
            {brandName.charAt(0)}
          </div>
          <span>{brandName}</span>
        </div>
        <p class="mt-4 max-w-sm text-sm text-[var(--color-muted-foreground)]">
          {tagline}
        </p>
        <p class="mt-6 text-xs text-[var(--color-muted-foreground)]">
          {copyright}
        </p>
      </div>

      {#each columns as col}
        <div>
          <h4 class="text-sm font-semibold uppercase tracking-wider text-[var(--color-foreground)] mb-4">
            {col.title}
          </h4>
          <ul class="space-y-2 text-sm text-[var(--color-muted-foreground)]">
            {#each col.links as link}
              <li>
                <a
                  href={link.href}
                  onclick={(e) => handleLink(e, link.href)}
                  class="hover:text-[var(--color-foreground)] transition-colors"
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</footer>
