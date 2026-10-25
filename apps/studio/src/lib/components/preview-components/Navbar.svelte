<script lang="ts">
  import Button from './Button.svelte';

  interface NavLink {
    label: string;
    href: string;
  }

  interface Props {
    brandName?: string;
    logoUrl?: string;
    links?: NavLink[];
    ctaText?: string;
    ctaHref?: string;
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    brandName = 'Acme SaaS',
    logoUrl = '',
    links = [],
    ctaText = 'Get Started',
    ctaHref = '/dashboard',
    style = '',
    onNavigate
  }: Props = $props();

  let mobileMenuOpen = $state(false);

  function handleLink(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<header class="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md" {style}>
  <div class="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <a
      href="/"
      onclick={(e) => handleLink(e, '/')}
      class="flex items-center gap-2 font-bold text-lg text-[var(--color-foreground)] tracking-tight"
    >
      {#if logoUrl}
        <img src={logoUrl} alt={brandName} class="h-8 w-auto" />
      {:else}
        <div class="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-bold">
          {brandName.charAt(0)}
        </div>
      {/if}
      <span>{brandName}</span>
    </a>

    <!-- Desktop links -->
    <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-muted-foreground)]">
      {#each links as link}
        <a
          href={link.href}
          onclick={(e) => handleLink(e, link.href)}
          class="transition-colors hover:text-[var(--color-foreground)]"
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="hidden md:flex items-center gap-4">
      <Button href={ctaHref} size="sm" {onNavigate}>{ctaText}</Button>
    </div>

    <!-- Mobile button -->
    <button
      type="button"
      onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
      aria-label="Toggle Navigation Menu"
      class="md:hidden p-2 text-[var(--color-foreground)]"
    >
      <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {#if mobileMenuOpen}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        {/if}
      </svg>
    </button>
  </div>

  {#if mobileMenuOpen}
    <div class="md:hidden border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 space-y-3">
      {#each links as link}
        <a
          href={link.href}
          onclick={(e) => {
            mobileMenuOpen = false;
            handleLink(e, link.href);
          }}
          class="block py-2 text-base font-medium text-[var(--color-foreground)]"
        >
          {link.label}
        </a>
      {/each}
      <div class="pt-2">
        <Button href={ctaHref} class="w-full text-center" {onNavigate}>{ctaText}</Button>
      </div>
    </div>
  {/if}
</header>
