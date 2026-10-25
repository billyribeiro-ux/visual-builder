<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
    primaryCtaText?: string;
    primaryCtaHref?: string;
    secondaryCtaText?: string;
    secondaryCtaHref?: string;
    badgeText?: string;
    style?: string;
    onNavigate?: (path: string) => void;
  }

  let {
    eyebrow = 'Introducing Platform 2.0',
    title = 'Design Visually. Export Pure SvelteKit 3.',
    subtitle = 'The first visual development platform that creates verifiable, versioned blueprints and runnable Svelte 5 code for AI coding agents.',
    primaryCtaText = 'Get Started Free',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = 'View Pricing',
    secondaryCtaHref = '/pricing',
    badgeText = 'Svelte 5 Runes Native',
    style = '',
    onNavigate
  }: Props = $props();
</script>

<section class="relative overflow-hidden py-16 md:py-24" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        {#if badgeText}
          <div class="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)] mb-6">
            <span class="flex h-2 w-2 rounded-full bg-[var(--color-primary)]"></span>
            {badgeText}
          </div>
        {/if}
        <h1 class="text-4xl font-extrabold tracking-tight text-[var(--color-foreground)] sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p class="mt-6 text-lg text-[var(--color-muted-foreground)] leading-relaxed">
          {subtitle}
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <Button href={primaryCtaHref} size="lg" {onNavigate}>{primaryCtaText}</Button>
          {#if secondaryCtaText}
            <Button href={secondaryCtaHref} variant="outline" size="lg" {onNavigate}>{secondaryCtaText}</Button>
          {/if}
        </div>
      </div>

      <div class="relative">
        <div class="relative mx-auto max-w-md lg:max-w-none rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-xl">
          <div class="flex items-center justify-between border-b border-[var(--color-border)] pb-3 px-2">
            <div class="flex gap-2">
              <div class="h-3 w-3 rounded-full bg-red-400"></div>
              <div class="h-3 w-3 rounded-full bg-amber-400"></div>
              <div class="h-3 w-3 rounded-full bg-emerald-400"></div>
            </div>
            <span class="text-xs font-mono text-[var(--color-muted-foreground)]">Acme SaaS Studio</span>
          </div>
          <div class="p-6 space-y-4">
            <div class="h-8 w-3/4 rounded bg-[var(--color-muted)] animate-pulse"></div>
            <div class="h-24 w-full rounded bg-[var(--color-accent)] border border-[var(--color-border)] p-4 text-xs font-mono text-[var(--color-primary)]">
              $state(&#123; mode: 'ai-handoff', target: 'sveltekit-3' &#125;)
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="h-16 rounded bg-[var(--color-muted)]"></div>
              <div class="h-16 rounded bg-[var(--color-muted)]"></div>
              <div class="h-16 rounded bg-[var(--color-muted)]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
