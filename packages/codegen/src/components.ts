/**
 * Emits idiomatic, accessible, standalone Svelte 5 components with runes.
 */

export function getComponentSources(): Record<string, string> {
  return {
    'src/lib/components/Container.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let {
    maxWidth = 'xl',
    class: customClass = '',
    style = '',
    children
  }: Props = $props();

  const maxMap = {
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full'
  };
</script>

<div class="mx-auto px-4 sm:px-6 lg:px-8 {maxMap[maxWidth] || 'max-w-screen-xl'} {customClass}" {style}>
  {@render children?.()}
</div>
`,

    'src/lib/components/Button.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    href?: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    class?: string;
    style?: string;
    onclick?: (e: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    class: customClass = '',
    style = '',
    onclick,
    children
  }: Props = $props();

  const variantStyles = {
    primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] shadow-sm',
    secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] hover:bg-[var(--color-secondary-hover)]',
    outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)]',
    ghost: 'bg-transparent hover:bg-[var(--color-muted)] text-[var(--color-foreground)]'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-[var(--radius-sm)]',
    md: 'px-4 py-2 text-sm font-medium rounded-[var(--radius-md)]',
    lg: 'px-6 py-3 text-base font-medium rounded-[var(--radius-lg)]'
  };
</script>

{#if href}
  <a
    {href}
    class="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 {variantStyles[variant]} {sizeStyles[size]} {customClass}"
    {style}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    {type}
    {disabled}
    {onclick}
    class="inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50 {variantStyles[variant]} {sizeStyles[size]} {customClass}"
    {style}
  >
    {@render children?.()}
  </button>
{/if}
`,

    'src/lib/components/Navbar.svelte': `<script lang="ts">
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
  }

  let {
    brandName = 'Acme SaaS',
    logoUrl = '',
    links = [],
    ctaText = 'Get Started',
    ctaHref = '/dashboard',
    style = ''
  }: Props = $props();

  let mobileMenuOpen = $state(false);
</script>

<header class="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md" {style}>
  <div class="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4 sm:px-6 lg:px-8">
    <a href="/" class="flex items-center gap-2 font-bold text-lg text-[var(--color-foreground)] tracking-tight">
      {#if logoUrl}
        <img src={logoUrl} alt={brandName} class="h-8 w-auto" />
      {:else}
        <div class="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white font-bold">
          {brandName.charAt(0)}
        </div>
      {/if}
      <span>{brandName}</span>
    </a>

    <!-- Desktop navigation -->
    <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--color-muted-foreground)]">
      {#each links as link}
        <a href={link.href} class="transition-colors hover:text-[var(--color-foreground)]">
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="hidden md:flex items-center gap-4">
      <Button href={ctaHref} size="sm">{ctaText}</Button>
    </div>

    <!-- Mobile menu toggle -->
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

  <!-- Mobile menu drawer -->
  {#if mobileMenuOpen}
    <div class="md:hidden border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 space-y-3">
      {#each links as link}
        <a
          href={link.href}
          onclick={() => (mobileMenuOpen = false)}
          class="block py-2 text-base font-medium text-[var(--color-foreground)]"
        >
          {link.label}
        </a>
      {/each}
      <div class="pt-2">
        <Button href={ctaHref} class="w-full text-center">{ctaText}</Button>
      </div>
    </div>
  {/if}
</header>
`,

    'src/lib/components/SplitHero.svelte': `<script lang="ts">
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
    style = ''
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
          <Button href={primaryCtaHref} size="lg">{primaryCtaText}</Button>
          {#if secondaryCtaText}
            <Button href={secondaryCtaHref} variant="outline" size="lg">{secondaryCtaText}</Button>
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
`,

    'src/lib/components/FeatureGrid.svelte': `<script lang="ts">
  interface FeatureItem {
    icon?: string;
    title: string;
    description: string;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    columns?: number;
    features?: FeatureItem[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Capabilities',
    sectionTitle = 'Engineered for Performance',
    sectionDescription = 'Built using modern web standards.',
    columns = 3,
    features = [],
    style = ''
  }: Props = $props();

  let colClass = $derived(columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3');
</script>

<section class="py-16 bg-[var(--color-muted)]/40" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-12">
      {#if sectionEyebrow}
        <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">
          {sectionEyebrow}
        </span>
      {/if}
      <h2 class="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">
        {sectionTitle}
      </h2>
      {#if sectionDescription}
        <p class="mt-4 text-base text-[var(--color-muted-foreground)]">
          {sectionDescription}
        </p>
      {/if}
    </div>

    <div class="grid grid-cols-1 gap-8 {colClass}">
      {#each features as feature}
        <div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold mb-4">
            ⚡
          </div>
          <h3 class="text-lg font-semibold text-[var(--color-foreground)] mb-2">
            {feature.title}
          </h3>
          <p class="text-sm text-[var(--color-muted-foreground)] leading-relaxed">
            {feature.description}
          </p>
        </div>
      {/each}
    </div>
  </div>
</section>
`,

    'src/lib/components/PricingTable.svelte': `<script lang="ts">
  import Button from './Button.svelte';

  interface PlanItem {
    name: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    ctaText: string;
    ctaHref: string;
    isPopular?: boolean;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionDescription?: string;
    plans?: PlanItem[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Pricing',
    sectionTitle = 'Predictable Pricing for High-Output Teams',
    sectionDescription = 'All plans include full source-code export.',
    plans = [],
    style = ''
  }: Props = $props();
</script>

<section class="py-16" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">{sectionEyebrow}</span>
      <h2 class="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">{sectionTitle}</h2>
      <p class="mt-4 text-base text-[var(--color-muted-foreground)]">{sectionDescription}</p>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-3">
      {#each plans as plan}
        <div class="relative flex flex-col justify-between rounded-[var(--radius-xl)] border {plan.isPopular ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]' : 'border-[var(--color-border)]'} bg-[var(--color-card)] p-8 shadow-sm">
          {#if plan.isPopular}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold text-white">
              Most Popular
            </div>
          {/if}
          <div>
            <h3 class="text-xl font-bold text-[var(--color-foreground)]">{plan.name}</h3>
            <p class="mt-2 text-sm text-[var(--color-muted-foreground)]">{plan.description}</p>
            <div class="mt-6 flex items-baseline gap-1">
              <span class="text-4xl font-extrabold text-[var(--color-foreground)]">{plan.price}</span>
              <span class="text-sm text-[var(--color-muted-foreground)]">/{plan.period}</span>
            </div>
            <ul class="mt-8 space-y-3 text-sm text-[var(--color-foreground)]">
              {#each plan.features as feat}
                <li class="flex items-center gap-2">
                  <span class="text-[var(--color-success)] font-bold">✓</span>
                  <span>{feat}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="mt-8">
            <Button
              href={plan.ctaHref}
              variant={plan.isPopular ? 'primary' : 'outline'}
              class="w-full text-center"
            >
              {plan.ctaText}
            </Button>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
`,

    'src/lib/components/FaqAccordion.svelte': `<script lang="ts">
  interface FaqItem {
    question: string;
    answer: string;
  }

  interface Props {
    sectionTitle?: string;
    items?: FaqItem[];
    style?: string;
  }

  let {
    sectionTitle = 'Frequently Asked Questions',
    items = [],
    style = ''
  }: Props = $props();

  let openIndex = $state<number | null>(0);

  function toggle(idx: number) {
    openIndex = openIndex === idx ? null : idx;
  }
</script>

<section class="py-16" {style}>
  <div class="mx-auto max-w-screen-md px-4 sm:px-6">
    <h2 class="text-3xl font-bold text-center tracking-tight text-[var(--color-foreground)] mb-10">
      {sectionTitle}
    </h2>

    <div class="space-y-4">
      {#each items as item, idx}
        <div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <button
            type="button"
            onclick={() => toggle(idx)}
            aria-expanded={openIndex === idx}
            class="flex w-full items-center justify-between p-5 text-left font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition-colors"
          >
            <span>{item.question}</span>
            <span class="text-lg transition-transform duration-200 {openIndex === idx ? 'rotate-180' : ''}">
              ▼
            </span>
          </button>
          {#if openIndex === idx}
            <div class="px-5 pb-5 pt-1 text-sm text-[var(--color-muted-foreground)] leading-relaxed border-t border-[var(--color-border)]">
              {item.answer}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
`,

    'src/lib/components/Testimonials.svelte': `<script lang="ts">
  interface TestimonialItem {
    quote: string;
    author: string;
    role: string;
  }

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    testimonials?: TestimonialItem[];
    style?: string;
  }

  let {
    sectionEyebrow = 'Testimonials',
    sectionTitle = 'Loved by Modern Founders and Developers',
    testimonials = [],
    style = ''
  }: Props = $props();
</script>

<section class="py-16 bg-[var(--color-muted)]/20" {style}>
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-12">
      <span class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-2 block">{sectionEyebrow}</span>
      <h2 class="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">{sectionTitle}</h2>
    </div>

    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      {#each testimonials as item}
        <div class="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-sm">
          <p class="text-base italic text-[var(--color-foreground)] leading-relaxed mb-6">
            "{item.quote}"
          </p>
          <div>
            <div class="font-bold text-[var(--color-foreground)]">{item.author}</div>
            <div class="text-xs text-[var(--color-muted-foreground)]">{item.role}</div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>
`,

    'src/lib/components/Footer.svelte': `<script lang="ts">
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
  }

  let {
    brandName = 'Acme SaaS',
    tagline = 'Engineering velocity for high-growth tech companies.',
    copyright = '© 2026 Acme SaaS Inc.',
    columns = [],
    style = ''
  }: Props = $props();
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
                <a href={link.href} class="hover:text-[var(--color-foreground)] transition-colors">
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
`,

    'src/lib/components/DashboardShell.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    activeNav?: string;
    children?: Snippet;
  }

  let {
    title = 'Dashboard',
    activeNav = 'dashboard',
    children
  }: Props = $props();
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
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors {activeNav === 'dashboard' ? 'bg-[var(--color-accent)] text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
        >
          <span>📊</span>
          <span>Analytics</span>
        </a>
        <a
          href="/dashboard/settings"
          class="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[var(--radius-md)] transition-colors {activeNav === 'settings' ? 'bg-[var(--color-accent)] text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'}"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </a>
        <a
          href="/"
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
        <a href="/dashboard/settings" class="text-sm font-medium text-[var(--color-primary)] hover:underline">Workspace</a>
      </div>
    </header>

    <div class="p-6">
      {@render children?.()}
    </div>
  </main>
</div>
`,

    'src/lib/components/KpiGrid.svelte': `<script lang="ts">
  interface Card {
    title: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
  }

  interface Props {
    cards?: Card[];
    style?: string;
  }

  let { cards = [], style = '' }: Props = $props();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" {style}>
  {#each cards as card}
    <div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
      <div class="text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider">{card.title}</div>
      <div class="mt-2 flex items-baseline justify-between">
        <div class="text-2xl font-bold text-[var(--color-foreground)]">{card.value}</div>
        <span class="inline-flex items-center text-xs font-semibold {card.trend === 'up' ? 'text-[var(--color-success)]' : 'text-[var(--color-destructive)]'}">
          {card.change}
        </span>
      </div>
    </div>
  {/each}
</div>
`,

    'src/lib/components/DataTable.svelte': `<script lang="ts">
  interface Props {
    title?: string;
    columns?: string[];
    rows?: string[][];
    style?: string;
  }

  let {
    title = 'Data Table',
    columns = [],
    rows = [],
    style = ''
  }: Props = $props();
</script>

<div class="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden shadow-sm" {style}>
  {#if title}
    <div class="p-4 border-b border-[var(--color-border)] font-bold text-[var(--color-foreground)]">
      {title}
    </div>
  {/if}
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm text-[var(--color-foreground)]">
      <thead class="bg-[var(--color-muted)]/50 text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <tr>
          {#each columns as col}
            <th class="px-6 py-3 font-semibold">{col}</th>
          {/each}
        </tr>
      </thead>
      <tbody class="divide-y divide-[var(--color-border)]">
        {#each rows as row}
          <tr class="hover:bg-[var(--color-muted)]/30 transition-colors">
            {#each row as cell}
              <td class="px-6 py-4 whitespace-nowrap">{cell}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
`,

    'src/lib/components/SettingsForm.svelte': `<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    initialName?: string;
    initialEmail?: string;
    notificationsEnabled?: boolean;
    style?: string;
  }

  let {
    initialName = 'Acme Workspace',
    initialEmail = 'team@acme.test',
    notificationsEnabled = true,
    style = ''
  }: Props = $props();

  let name = $state('');
  let email = $state('');
  let notifications = $state(true);
  let savedMessage = $state('');

  $effect(() => {
    name = initialName;
    email = initialEmail;
    notifications = notificationsEnabled;
  });

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    savedMessage = 'Settings saved successfully! (Mocked validation passing)';
    setTimeout(() => {
      savedMessage = '';
    }, 4000);
  }
</script>

<div class="max-w-xl rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm" {style}>
  <h2 class="text-lg font-bold text-[var(--color-foreground)] mb-4">Workspace Preferences</h2>

  {#if savedMessage}
    <div class="mb-4 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 font-medium">
      {savedMessage}
    </div>
  {/if}

  <form onsubmit={handleSubmit} class="space-y-4">
    <div>
      <label for="workspace-name" class="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
        Workspace Name
      </label>
      <input
        id="workspace-name"
        type="text"
        bind:value={name}
        required
        class="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
    </div>

    <div>
      <label for="workspace-email" class="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
        Notification Email
      </label>
      <input
        id="workspace-email"
        type="email"
        bind:value={email}
        required
        class="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      />
    </div>

    <div class="flex items-center gap-2 pt-2">
      <input
        id="notifications-toggle"
        type="checkbox"
        bind:checked={notifications}
        class="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-ring)]"
      />
      <label for="notifications-toggle" class="text-sm font-medium text-[var(--color-foreground)]">
        Enable deployment and build notification webhooks
      </label>
    </div>

    <div class="pt-4 border-t border-[var(--color-border)] flex justify-end">
      <Button type="submit">Save Changes</Button>
    </div>
  </form>
</div>
`
  };
}
