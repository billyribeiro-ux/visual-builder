<script lang="ts">
  interface Props {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    style?: string;
    onNavigate?: (href: string) => void;
  }

  let {
    eyebrow = '',
    title = '',
    subtitle = '',
    primaryCtaText = 'Get Started',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = '',
    secondaryCtaHref = '#',
    style = '',
    onNavigate
  }: Props = $props();

  function handleNav(e: MouseEvent, href: string) {
    if (onNavigate && href.startsWith('/')) {
      e.preventDefault();
      onNavigate(href);
    }
  }
</script>

<section class="md-section" style={style}>
  <div class="md-container md-container-xl">
    <div
      class="md-card md-card-filled"
      style="background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: 3.5rem 2.5rem; border-radius: var(--md-sys-shape-corner-extra-large); text-align: center;"
    >
      {#if eyebrow}
        <p class="md-label-large" style="margin: 0 0 0.75rem 0; opacity: 0.85;">{eyebrow}</p>
      {/if}
      <h2 class="md-headline-large" style="margin: 0 0 1rem 0;">{title}</h2>
      {#if subtitle}
        <p class="md-body-large" style="max-width: 38rem; margin: 0 auto 2rem auto; opacity: 0.9;">{subtitle}</p>
      {/if}
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem;">
        <a
          href={primaryCtaHref}
          onclick={(e) => handleNav(e, primaryCtaHref)}
          class="md-btn md-btn-filled md-btn-lg"
        >
          {primaryCtaText}
        </a>
        {#if secondaryCtaText}
          <a
            href={secondaryCtaHref}
            onclick={(e) => handleNav(e, secondaryCtaHref)}
            class="md-btn md-btn-outlined md-btn-lg"
          >
            {secondaryCtaText}
          </a>
        {/if}
      </div>
    </div>
  </div>
</section>
