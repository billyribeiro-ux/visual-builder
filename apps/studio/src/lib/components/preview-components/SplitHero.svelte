<script lang="ts">
  import Button from './Button.svelte';
  import Container from './Container.svelte';

  interface Props {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    badgeText?: string;
    align?: 'left' | 'center' | 'right';
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    eyebrow = 'Next-Gen Platform',
    title = 'Build Faster Svelte Applications with Visual Clarity',
    subtitle = 'The modern visual development studio designed for Svelte 5 and SvelteKit 3 with Google Material Design 3.',
    primaryCtaText = 'Get Started Free',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = 'Explore Features',
    secondaryCtaHref = '#features',
    badgeText = 'v3.1 Stable Cutoff',
    align = 'left',
    style = '',
    onNavigate
  }: Props = $props();

  const isCentered = $derived(align === 'center' || style.includes('text-align: center'));
</script>

<section class="md-hero" {style}>
  <Container maxWidth="xl">
    <div
      class="md-hero__grid"
      style={isCentered ? 'grid-template-columns: 1fr; text-align: center; justify-items: center;' : ''}
    >
      <div style={isCentered ? 'display: flex; flex-direction: column; align-items: center; max-width: 760px; margin: 0 auto;' : ''}>
        {#if badgeText}
          <div class="md-hero__badge">
            <span>✨</span>
            <span>{badgeText}</span>
          </div>
        {/if}
        {#if eyebrow}
          <div style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-primary); margin-bottom: 0.75rem;">
            {eyebrow}
          </div>
        {/if}
        <h1 class="md-hero__title">{title}</h1>
        <p class="md-hero__subtitle" style={isCentered ? 'margin-left: auto; margin-right: auto;' : ''}>{subtitle}</p>
        <div class="md-hero__actions" style={isCentered ? 'justify-content: center;' : ''}>
          <Button href={primaryCtaHref} size="lg" {onNavigate}>{primaryCtaText}</Button>
          {#if secondaryCtaText}
            <Button href={secondaryCtaHref} size="lg" variant="outlined" {onNavigate}>{secondaryCtaText}</Button>
          {/if}
        </div>
      </div>
      <div style={isCentered ? 'width: 100%; max-width: 720px; margin: 0 auto;' : ''}>
        <div class="md-card md-card--elevated" style="aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; background: var(--md-sys-color-surface-container);">
          <div style="text-align: center; color: var(--md-sys-color-on-surface-variant);">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚀</div>
            <div style="font-weight: 600; font-size: 1.125rem; color: var(--md-sys-color-on-surface);">Modern Interactive Web App</div>
            <div style="font-size: 0.875rem; margin-top: 0.5rem;">Svelte 5 + Google MD3 Design System</div>
          </div>
        </div>
      </div>
    </div>
  </Container>
</section>
