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

  function handleLink(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<header class="md-navbar" {style}>
  <div class="md-navbar__inner">
    <a
      href="/"
      onclick={(e) => handleLink(e, '/')}
      class="md-navbar__brand"
    >
      {#if logoUrl}
        <img src={logoUrl} alt={brandName} style="height: 32px; width: auto;" />
      {:else}
        <div style="width: 36px; height: 36px; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); display: flex; align-items: center; justify-content: center; font-weight: 700;">
          {brandName.charAt(0)}
        </div>
      {/if}
      <span>{brandName}</span>
    </a>

    <!-- Desktop Navigation Links -->
    <nav class="md-navbar__nav">
      {#each links as link (link.href)}
        <a
          href={link.href}
          onclick={(e) => handleLink(e, link.href)}
          class="md-navbar__link"
        >
          {link.label}
        </a>
      {/each}
    </nav>

    <div>
      <Button href={ctaHref} size="sm" {onNavigate}>{ctaText}</Button>
    </div>
  </div>
</header>
