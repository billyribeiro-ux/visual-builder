<script lang="ts">
  import Container from './Container.svelte';

  interface FooterColumn {
    title: string;
    links: { label: string; href: string }[];
  }

  interface Props {
    brandName?: string;
    tagline?: string;
    copyright?: string;
    columns?: FooterColumn[];
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    brandName = 'Acme SaaS',
    tagline = 'Modern visual web engineering studio for Svelte 5 and SvelteKit 3.',
    copyright = '© 2026 Acme Corp. All rights reserved.',
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

<footer class="md-footer" {style}>
  <Container maxWidth="xl">
    <div class="md-footer__grid">
      <div>
        <div style="font-weight: 800; font-size: 1.25rem; margin-bottom: 0.75rem;">{brandName}</div>
        <p style="color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem; max-width: 320px; line-height: 1.5;">{tagline}</p>
      </div>

      {#each columns as col, cIdx (cIdx)}
        <div>
          <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em;">{col.title}</div>
          <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.625rem; font-size: 0.875rem;">
            {#each col.links as link (link.href)}
              <li>
                <a
                  href={link.href}
                  onclick={(e) => handleLink(e, link.href)}
                  style="color: var(--md-sys-color-on-surface-variant); text-decoration: none;"
                >
                  {link.label}
                </a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>

    <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--md-sys-color-outline-variant); font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); text-align: center;">
      {copyright}
    </div>
  </Container>
</footer>
