/**
 * Emits idiomatic Svelte 5 components with Google Material Design 3 (MD3) styling.
 * Pure Vanilla CSS: No Tailwind, no external runtime.
 */

export function getComponentSources(): Record<string, string> {
  return {
    'src/lib/components/Container.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    direction?: string;
    justify?: string;
    align?: string;
    textAlign?: string;
    gap?: string;
    class?: string;
    style?: string;
    children?: Snippet;
  }

  let {
    maxWidth = 'xl',
    direction = '',
    justify = '',
    align = '',
    textAlign = '',
    gap = '',
    class: customClass = '',
    style = '',
    children
  }: Props = $props();

  const computedFlexStyle = $derived.by(() => {
    const parts: string[] = [];
    if (direction || justify || align || gap) {
      parts.push('display: flex');
      parts.push(\`flex-direction: \${direction || 'column'}\`);
    }
    if (justify) parts.push(\`justify-content: \${justify}\`);
    if (align) parts.push(\`align-items: \${align}\`);
    if (gap) parts.push(\`gap: \${gap}\`);
    if (textAlign) parts.push(\`text-align: \${textAlign}\`);
    if (style) parts.push(style);
    return parts.join('; ');
  });
</script>

<div class="md-container md-container--{maxWidth} {customClass}" style={computedFlexStyle}>
  {@render children?.()}
</div>
`,

    'src/lib/components/Button.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated' | 'primary' | 'secondary' | 'outline' | 'ghost';
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
    variant = 'filled',
    size = 'md',
    href,
    type = 'button',
    disabled = false,
    class: customClass = '',
    style = '',
    onclick,
    children
  }: Props = $props();

  // Normalize legacy names to MD3 variant classes
  const variantClass = $derived.by(() => {
    if (variant === 'primary' || variant === 'filled') return 'md-btn--filled';
    if (variant === 'secondary' || variant === 'tonal') return 'md-btn--tonal';
    if (variant === 'outline' || variant === 'outlined') return 'md-btn--outlined';
    if (variant === 'ghost' || variant === 'text') return 'md-btn--text';
    return 'md-btn--filled';
  });
</script>

{#if href}
  <a
    {href}
    class="md-btn md-btn--{size} {variantClass} {customClass}"
    {style}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    {type}
    {disabled}
    {onclick}
    class="md-btn md-btn--{size} {variantClass} {customClass}"
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

  let mobileOpen = $state(false);
</script>

<header class="md-navbar" {style}>
  <div class="md-navbar__inner">
    <a href="/" class="md-navbar__brand">
      {#if logoUrl}
        <img src={logoUrl} alt={brandName} style="height: 32px; width: auto;" />
      {:else}
        <div style="height: 32px; width: 32px; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); display: flex; align-items: center; justify-content: center; font-weight: 700;">
          {brandName.charAt(0)}
        </div>
      {/if}
      <span>{brandName}</span>
    </a>

    <nav class="md-navbar__nav">
      {#each links as link, idx (idx)}
        <a href={link.href} class="md-navbar__link">
          {link.label}
        </a>
      {/each}
    </nav>

    <div style="display: flex; align-items: center; gap: 1rem;">
      <Button href={ctaHref} size="sm">{ctaText}</Button>
    </div>
  </div>
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
    align?: 'left' | 'center';
    style?: string;
  }

  let {
    eyebrow = '',
    title = 'Design Visually. Export Pure SvelteKit 3.',
    subtitle = 'The first visual development platform that creates verifiable, versioned blueprints and runnable Svelte 5 code for AI coding agents.',
    primaryCtaText = 'Get Started Free',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = 'View Pricing',
    secondaryCtaHref = '/pricing',
    badgeText = 'Google MD3 Native',
    align = 'left',
    style = ''
  }: Props = $props();

  const isCentered = $derived(align === 'center' || style.includes('text-align: center'));
</script>

<section class="md-hero" {style}>
  <div class="md-container md-container--xl">
    <div
      class="md-hero__grid"
      style={isCentered ? 'grid-template-columns: 1fr; text-align: center; justify-items: center;' : ''}
    >
      <div style={isCentered ? 'display: flex; flex-direction: column; align-items: center; max-width: 760px; margin: 0 auto;' : ''}>
        {#if badgeText}
          <div class="md-hero__badge">
            <span style="height: 8px; width: 8px; border-radius: 50%; background-color: var(--md-sys-color-primary);"></span>
            {badgeText}
          </div>
        {/if}
        {#if eyebrow}
          <div style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--md-sys-color-primary); margin-bottom: 0.75rem;">
            {eyebrow}
          </div>
        {/if}
        <h1 class="md-hero__title">
          {title}
        </h1>
        <p class="md-hero__subtitle" style={isCentered ? 'margin-left: auto; margin-right: auto;' : ''}>
          {subtitle}
        </p>
        <div class="md-hero__actions" style={isCentered ? 'justify-content: center;' : ''}>
          <Button href={primaryCtaHref} size="lg">{primaryCtaText}</Button>
          {#if secondaryCtaText}
            <Button href={secondaryCtaHref} variant="outlined" size="lg">{secondaryCtaText}</Button>
          {/if}
        </div>
      </div>

      <div style={isCentered ? 'width: 100%; max-width: 720px; margin: 0 auto;' : ''}>
        <div class="md-card md-card--elevated" style="padding: 2rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--md-sys-color-outline-variant); padding-bottom: 0.75rem; margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 6px;">
              <span style="height: 12px; width: 12px; border-radius: 50%; background-color: #EF4444;"></span>
              <span style="height: 12px; width: 12px; border-radius: 50%; background-color: #F59E0B;"></span>
              <span style="height: 12px; width: 12px; border-radius: 50%; background-color: #10B981;"></span>
            </div>
            <span style="font-size: 0.75rem; font-family: var(--md-sys-font-mono); color: var(--md-sys-color-on-surface-variant);">Acme Studio M3</span>
          </div>
          <div style="padding: 1.5rem; background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); border-radius: var(--md-sys-shape-corner-small, 8px); font-family: var(--md-sys-font-mono); font-size: 0.8125rem;">
            $state(&#123; designSystem: 'google-md3', styling: 'vanilla-css' &#125;)
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
    sectionDescription = 'Built using Google MD3 design tokens.',
    columns = 3,
    features = [],
    style = ''
  }: Props = $props();

  let colClass = $derived(columns === 2 ? 'md-feature-grid__cols--2' : 'md-feature-grid__cols--3');
</script>

<section class="md-feature-grid" {style}>
  <div class="md-container md-container--xl">
    <div class="md-feature-grid__header">
      {#if sectionEyebrow}
        <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--md-sys-color-primary); display: block; margin-bottom: 0.5rem;">
          {sectionEyebrow}
        </span>
      {/if}
      <h2 style="font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem;">
        {sectionTitle}
      </h2>
      {#if sectionDescription}
        <p style="color: var(--md-sys-color-on-surface-variant);">
          {sectionDescription}
        </p>
      {/if}
    </div>

    <div class="md-feature-grid__cols {colClass}">
      {#each features as feature, idx (idx)}
        <div class="md-card md-card--outlined">
          <div style="height: 40px; width: 40px; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 1rem;">
            ⚡
          </div>
          <h3 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem;">
            {feature.title}
          </h3>
          <p style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.6;">
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

<section class="md-pricing" {style}>
  <div class="md-container md-container--xl">
    <div class="md-pricing__header">
      <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--md-sys-color-primary); display: block; margin-bottom: 0.5rem;">{sectionEyebrow}</span>
      <h2 style="font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem;">{sectionTitle}</h2>
      <p style="color: var(--md-sys-color-on-surface-variant);">{sectionDescription}</p>
    </div>

    <div class="md-pricing__grid">
      {#each plans as plan, idx (idx)}
        <div class="md-card md-pricing__card {plan.isPopular ? 'md-pricing__card--popular md-card--elevated' : 'md-card--outlined'}">
          {#if plan.isPopular}
            <div class="md-pricing__popular-badge">
              Most Popular
            </div>
          {/if}
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 700;">{plan.name}</h3>
            <p style="font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); margin-top: 0.5rem;">{plan.description}</p>
            <div class="md-pricing__price">
              <span>{plan.price}</span>
              <span style="font-size: 0.875rem; font-weight: 400; color: var(--md-sys-color-on-surface-variant);">/{plan.period}</span>
            </div>
            <ul style="list-style: none; padding: 0; margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.875rem;">
              {#each plan.features as feat, fIdx (fIdx)}
                <li style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="color: var(--md-sys-color-success); font-weight: 700;">✓</span>
                  <span>{feat}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div style="margin-top: 2rem;">
            <Button
              href={plan.ctaHref}
              variant={plan.isPopular ? 'filled' : 'outlined'}
              style="width: 100%;"
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

<section class="md-accordion" {style}>
  <div class="md-container md-container--md">
    <h2 style="font-size: 2.25rem; font-weight: 700; text-align: center; margin-bottom: 2.5rem;">
      {sectionTitle}
    </h2>

    <div>
      {#each items as item, idx (idx)}
        <div class="md-accordion__item">
          <button
            type="button"
            onclick={() => toggle(idx)}
            aria-expanded={openIndex === idx}
            class="md-accordion__trigger"
          >
            <span>{item.question}</span>
            <span style="transition: transform 200ms ease; transform: {openIndex === idx ? 'rotate(180deg)' : 'rotate(0)'};">
              ▼
            </span>
          </button>
          {#if openIndex === idx}
            <div class="md-accordion__content">
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
    sectionTitle = 'Loved by Modern Software Teams',
    testimonials = [],
    style = ''
  }: Props = $props();
</script>

<section style="padding: 4rem 0; background-color: var(--md-sys-color-surface-container-low); {style}">
  <div class="md-container md-container--xl">
    <div style="text-align: center; max-width: 680px; margin: 0 auto 3rem auto;">
      <span style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--md-sys-color-primary); display: block; margin-bottom: 0.5rem;">{sectionEyebrow}</span>
      <h2 style="font-size: 2.25rem; font-weight: 700;">{sectionTitle}</h2>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
      {#each testimonials as item, idx (idx)}
        <div class="md-card md-card--elevated">
          <p style="font-size: 1rem; font-style: italic; color: var(--md-sys-color-on-surface); line-height: 1.6; margin-bottom: 1.5rem;">
            "{item.quote}"
          </p>
          <div>
            <div style="font-weight: 700; color: var(--md-sys-color-on-surface);">{item.author}</div>
            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">{item.role}</div>
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

<footer class="md-footer" {style}>
  <div class="md-container md-container--xl">
    <div class="md-footer__grid">
      <div>
        <div style="display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1.25rem;">
          <div style="height: 32px; width: 32px; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); display: flex; align-items: center; justify-content: center; font-size: 0.875rem;">
            {brandName.charAt(0)}
          </div>
          <span>{brandName}</span>
        </div>
        <p style="margin-top: 1rem; font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant); max-width: 360px;">
          {tagline}
        </p>
        <p style="margin-top: 1.5rem; font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant);">
          {copyright}
        </p>
      </div>

      {#each columns as col, cIdx (cIdx)}
        <div>
          <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1rem;">
            {col.title}
          </h4>
          <ul style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.875rem; color: var(--md-sys-color-on-surface-variant);">
            {#each col.links as link, lIdx (lIdx)}
              <li>
                <a href={link.href} style="transition: color 150ms ease;">
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
    style?: string;
    children?: Snippet;
  }

  let {
    title = 'Dashboard',
    activeNav = 'dashboard',
    style = '',
    children
  }: Props = $props();
</script>

<div class="md-dashboard" {style}>
  <aside class="md-dashboard__sidebar">
    <div>
      <div style="display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1.25rem; margin-bottom: 2rem;">
        <div style="height: 32px; width: 32px; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary); display: flex; align-items: center; justify-content: center;">A</div>
        <span>Acme SaaS</span>
      </div>

      <nav style="display: flex; flex-direction: column; gap: 0.25rem;">
        <a
          href="/dashboard"
          style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); font-size: 0.875rem; font-weight: 500; background-color: {activeNav === 'dashboard' ? 'var(--md-sys-color-secondary-container)' : 'transparent'}; color: {activeNav === 'dashboard' ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)'};"
        >
          <span>📊</span>
          <span>Analytics</span>
        </a>
        <a
          href="/dashboard/settings"
          style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); font-size: 0.875rem; font-weight: 500; background-color: {activeNav === 'settings' ? 'var(--md-sys-color-secondary-container)' : 'transparent'}; color: {activeNav === 'settings' ? 'var(--md-sys-color-on-secondary-container)' : 'var(--md-sys-color-on-surface-variant)'};"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </a>
        <a
          href="/"
          style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); font-size: 0.875rem; font-weight: 500; color: var(--md-sys-color-on-surface-variant);"
        >
          <span>🌐</span>
          <span>Public Site</span>
        </a>
      </nav>
    </div>

    <div style="border-top: 1px solid var(--md-sys-color-outline-variant); padding-top: 1rem;">
      <div style="font-size: 0.75rem; font-weight: 600; color: var(--md-sys-color-on-surface);">Google MD3 Standard</div>
      <div style="font-size: 0.6875rem; color: var(--md-sys-color-on-surface-variant);">SvelteKit 3.1.0</div>
    </div>
  </aside>

  <main class="md-dashboard__main">
    <header class="md-dashboard__header">
      <h1 style="font-size: 1.25rem; font-weight: 700;">{title}</h1>
      <a href="/dashboard/settings" style="font-size: 0.875rem; font-weight: 500; color: var(--md-sys-color-primary);">Workspace Settings</a>
    </header>

    <div class="md-dashboard__content">
      {@render children?.()}
    </div>
  </main>
</div>
`,

    'src/lib/components/KpiGrid.svelte': `<script lang="ts">
  interface Card {
    label?: string;
    title?: string;
    value: string;
    delta?: string;
    change?: string;
    trend?: 'up' | 'down' | string;
  }

  interface Props {
    cards?: Card[];
    style?: string;
  }

  let { cards = [], style = '' }: Props = $props();
</script>

<div class="md-kpi-grid" {style}>
  {#each cards as card, idx (idx)}
    <div class="md-card md-card--elevated">
      <div class="md-kpi-card__title">{card.label || card.title || 'Metric'}</div>
      <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 0.5rem;">
        <div class="md-kpi-card__val">{card.value}</div>
        <span style="font-size: 0.75rem; font-weight: 600; color: {card.trend === 'up' ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'};">
          {card.delta || card.change || ''}
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

  let filterText = $state('');

  const filteredRows = $derived.by(() => {
    if (!filterText.trim()) return rows;
    const q = filterText.toLowerCase();
    return rows.filter((r) => r.some((cell) => String(cell).toLowerCase().includes(q)));
  });
</script>

<div class="md-table-container" {style}>
  <div style="padding: 1rem 1.5rem; border-bottom: 1px solid var(--md-sys-color-outline-variant); display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;">
    {#if title}
      <div style="font-weight: 700; font-size: 1rem;">{title}</div>
    {/if}
    <input
      type="search"
      bind:value={filterText}
      placeholder="Filter records..."
      aria-label="Filter table records"
      class="md-input"
      style="max-width: 240px; padding: 0.4rem 0.75rem; font-size: 0.8125rem;"
    />
  </div>
  <div style="overflow-x: auto;">
    <table class="md-table">
      <thead>
        <tr>
          {#each columns as col, cIdx (cIdx)}
            <th>{col}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each filteredRows as row, rIdx (rIdx)}
          <tr>
            {#each row as cell, cIdx (cIdx)}
              <td>{cell}</td>
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
    savedMessage = 'Settings saved successfully! (Google MD3 Form Validation passed)';
    setTimeout(() => {
      savedMessage = '';
    }, 4000);
  }
</script>

<div class="md-card md-card--outlined" style="max-width: 580px; {style}">
  <h2 style="font-size: 1.125rem; font-weight: 700; margin-bottom: 1.25rem;">Workspace Preferences</h2>

  {#if savedMessage}
    <div style="margin-bottom: 1.25rem; padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); font-size: 0.875rem; font-weight: 500;">
      {savedMessage}
    </div>
  {/if}

  <form onsubmit={handleSubmit}>
    <div class="md-form-group">
      <label for="workspace-name" class="md-label">Workspace Name</label>
      <input
        id="workspace-name"
        type="text"
        bind:value={name}
        required
        class="md-input"
      />
    </div>

    <div class="md-form-group">
      <label for="workspace-email" class="md-label">Notification Email</label>
      <input
        id="workspace-email"
        type="email"
        bind:value={email}
        required
        class="md-input"
      />
    </div>

    <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; margin-bottom: 1.5rem;">
      <input
        id="notifications-toggle"
        type="checkbox"
        bind:checked={notifications}
        style="height: 18px; width: 18px; accent-color: var(--md-sys-color-primary);"
      />
      <label for="notifications-toggle" style="font-size: 0.875rem;">
        Enable deployment and build notification webhooks
      </label>
    </div>

    <div style="border-top: 1px solid var(--md-sys-color-outline-variant); padding-top: 1rem; display: flex; justify-content: flex-end;">
      <Button type="submit">Save Changes</Button>
    </div>
  </form>
</div>
`,

    'src/lib/components/Section.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Legacy alias for surfaceTone (kept for older blueprints). */
    variant?: string;
    surfaceTone?: 'surface' | 'low' | 'container' | 'high' | 'primary-container' | string;
    paddingY?: 'sm' | 'md' | 'lg' | 'xl' | string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
    direction?: 'column' | 'row' | 'column-reverse' | 'row-reverse' | string;
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly' | string;
    align?: 'stretch' | 'flex-start' | 'center' | 'flex-end' | string;
    textAlign?: 'left' | 'center' | 'right' | string;
    gap?: string;
    style?: string;
    /** Layout styles (display/flex/grid/gap/text-align) applied to the inner container. */
    contentStyle?: string;
    children?: Snippet;
  }

  let {
    variant = 'surface',
    surfaceTone = '',
    paddingY = 'lg',
    maxWidth = 'xl',
    direction = '',
    justify = '',
    align = '',
    textAlign = '',
    gap = '',
    style = '',
    contentStyle = '',
    children
  }: Props = $props();

  const bgMap: Record<string, string> = {
    surface: 'var(--md-sys-color-surface)',
    low: 'var(--md-sys-color-surface-container-low)',
    'surface-low': 'var(--md-sys-color-surface-container-low)',
    container: 'var(--md-sys-color-surface-container)',
    high: 'var(--md-sys-color-surface-container-high)',
    'surface-high': 'var(--md-sys-color-surface-container-high)',
    'primary-container': 'var(--md-sys-color-primary-container)'
  };

  const padMap: Record<string, string> = {
    sm: '2rem 0',
    md: '3.5rem 0',
    lg: '5rem 0',
    xl: '7rem 0'
  };

  const effectiveBg = $derived(bgMap[surfaceTone || variant] || bgMap.surface);

  const innerFlexStyle = $derived.by(() => {
    const parts: string[] = [];
    const hasFlexProp = Boolean(direction || justify || align || gap);
    if (hasFlexProp) {
      parts.push('display: flex');
      parts.push(\`flex-direction: \${direction || 'column'}\`);
    }
    if (justify) parts.push(\`justify-content: \${justify}\`);
    if (align) parts.push(\`align-items: \${align}\`);
    if (gap) parts.push(\`gap: \${gap}\`);
    if (textAlign) parts.push(\`text-align: \${textAlign}\`);
    if (contentStyle) parts.push(contentStyle);
    return parts.join('; ');
  });
</script>

<section
  class="md-section"
  style="background-color: {effectiveBg}; padding: {padMap[paddingY] || padMap.lg}; {style}"
>
  <div class="md-container md-container--{maxWidth}" style={innerFlexStyle}>
    {@render children?.()}
  </div>
</section>
`,

    'src/lib/components/Grid.svelte': `<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    columns?: number;
    /** Spacing token (sm | md | lg) or any raw CSS length. */
    gap?: 'sm' | 'md' | 'lg' | string;
    alignItems?: 'stretch' | 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | string;
    justifyItems?: 'stretch' | 'start' | 'center' | 'end' | 'flex-start' | 'flex-end' | string;
    textAlign?: 'left' | 'center' | 'right' | string;
    style?: string;
    children?: Snippet;
  }

  let {
    columns = 3,
    gap = 'md',
    alignItems = 'stretch',
    justifyItems = 'stretch',
    textAlign = '',
    style = '',
    children
  }: Props = $props();

  const gapMap: Record<string, string> = {
    sm: '1rem',
    md: '1.5rem',
    lg: '2.5rem'
  };

  // Responsive column count (1-4); collapses to a single column on small screens via app.css.
  const cols = $derived(Math.min(4, Math.max(1, Math.round(Number(columns) || 1))));
  const resolvedGap = $derived(gapMap[gap] || gap || '1.5rem');
</script>

<div
  class="md-grid md-grid-cols-{cols}"
  style="gap: {resolvedGap}; align-items: {alignItems}; justify-items: {justifyItems}; {textAlign ? \`text-align: \${textAlign};\` : ''} {style}"
  data-cols={cols}
>
  {@render children?.()}
</div>
`,

    'src/lib/components/Divider.svelte': `<script lang="ts">
  interface Props {
    spacing?: 'sm' | 'md' | 'lg';
    label?: string;
    style?: string;
  }

  let { spacing = 'md', label = '', style = '' }: Props = $props();

  const padMap: Record<string, string> = {
    sm: '1rem 0',
    md: '2rem 0',
    lg: '3.5rem 0'
  };
</script>

<div style="padding: {padMap[spacing] || padMap.md}; display: flex; align-items: center; gap: 1rem; {style}">
  <hr style="flex: 1; border: none; border-top: 1px solid var(--md-sys-color-outline-variant); margin: 0;" />
  {#if label}
    <span class="md-label-medium" style="color: var(--md-sys-color-on-surface-variant);">{label}</span>
    <hr style="flex: 1; border: none; border-top: 1px solid var(--md-sys-color-outline-variant); margin: 0;" />
  {/if}
</div>
`,

    'src/lib/components/CtaBanner.svelte': `<script lang="ts">
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
    style?: string;
  }

  let {
    eyebrow = '',
    title = 'Ready to accelerate your Svelte 5 workflow?',
    subtitle = 'Export a deterministic, self-contained SvelteKit 3 handoff package for your AI coding agents in one click.',
    primaryCtaText = 'Launch Studio Free',
    primaryCtaHref = '/dashboard',
    secondaryCtaText = 'Compare Plans',
    secondaryCtaHref = '/pricing',
    style = ''
  }: Props = $props();
</script>

<section class="md-section" {style}>
  <Container maxWidth="xl">
    <div style="border-radius: var(--md-sys-shape-corner-extra-large, 28px); background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container); padding: 3.5rem 2.5rem; text-align: center; box-shadow: var(--md-sys-elevation-level1);">
      {#if eyebrow}
        <p class="md-label-large" style="margin: 0 0 0.75rem 0; opacity: 0.85;">{eyebrow}</p>
      {/if}
      <h2 class="md-headline-large" style="margin: 0 0 1rem 0;">{title}</h2>
      {#if subtitle}
        <p class="md-body-large" style="max-width: 38rem; margin: 0 auto 2rem auto; opacity: 0.9;">{subtitle}</p>
      {/if}
      <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;">
        <Button href={primaryCtaHref} size="lg" variant="filled">{primaryCtaText}</Button>
        {#if secondaryCtaText}
          <Button href={secondaryCtaHref} size="lg" variant="outlined">{secondaryCtaText}</Button>
        {/if}
      </div>
    </div>
  </Container>
</section>
`,

    'src/lib/components/StatsBar.svelte': `<script lang="ts">
  import Container from './Container.svelte';

  interface StatItem {
    value: string;
    label: string;
    detail?: string;
  }

  interface Props {
    stats?: StatItem[];
    style?: string;
  }

  let { stats = [], style = '' }: Props = $props();
</script>

<section style="padding: 3.5rem 0; background-color: var(--md-sys-color-surface-container); border-top: 1px solid var(--md-sys-color-outline-variant); border-bottom: 1px solid var(--md-sys-color-outline-variant); {style}">
  <Container maxWidth="xl">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: center;">
      {#each stats as stat, idx (idx)}
        <div>
          <div style="font-size: 2.5rem; font-weight: 800; color: var(--md-sys-color-primary); letter-spacing: -0.02em;">{stat.value}</div>
          <div style="font-size: 0.9375rem; font-weight: 700; color: var(--md-sys-color-on-surface); margin-top: 0.25rem;">{stat.label}</div>
          {#if stat.detail}
            <div style="font-size: 0.75rem; color: var(--md-sys-color-on-surface-variant); margin-top: 0.25rem;">{stat.detail}</div>
          {/if}
        </div>
      {/each}
    </div>
  </Container>
</section>
`,

    'src/lib/components/Newsletter.svelte': `<script lang="ts">
  import Button from './Button.svelte';
  import Container from './Container.svelte';

  interface Props {
    title?: string;
    subtitle?: string;
    placeholder?: string;
    buttonText?: string;
    style?: string;
  }

  let {
    title = 'Stay ahead of the Svelte 5 ecosystem',
    subtitle = 'Receive monthly architecture deep-dives, MD3 design token updates, and AI agent patterns.',
    placeholder = 'engineer@company.com',
    buttonText = 'Subscribe',
    style = ''
  }: Props = $props();

  let email = $state('');
  let subscribed = $state(false);

  function handleSubscribe(e: SubmitEvent) {
    e.preventDefault();
    if (email.trim()) {
      subscribed = true;
      email = '';
    }
  }
</script>

<section style="padding: 4rem 0; background-color: var(--md-sys-color-surface-container-low); {style}">
  <Container maxWidth="md">
    <div class="md-card md-card--outlined" style="text-align: center; padding: 2.5rem;">
      <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem;">{title}</h2>
      <p style="color: var(--md-sys-color-on-surface-variant); font-size: 0.9375rem; margin-bottom: 1.75rem;">{subtitle}</p>
      {#if subscribed}
        <div style="padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); font-weight: 600; font-size: 0.875rem;">
          ✓ Subscribed! Check your inbox for confirmation.
        </div>
      {:else}
        <form onsubmit={handleSubscribe} style="display: flex; gap: 0.75rem; max-width: 460px; margin: 0 auto; flex-wrap: wrap;">
          <input
            type="email"
            required
            bind:value={email}
            {placeholder}
            aria-label="Email address"
            class="md-input"
            style="flex: 1; min-width: 200px;"
          />
          <Button type="submit">{buttonText}</Button>
        </form>
      {/if}
    </div>
  </Container>
</section>
`,

    'src/lib/components/ContactForm.svelte': `<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    sectionEyebrow?: string;
    sectionTitle?: string;
    sectionSubtitle?: string;
    submitText?: string;
    style?: string;
  }

  let {
    sectionEyebrow = 'Contact',
    sectionTitle = 'Talk to our Architecture Team',
    sectionSubtitle = '',
    submitText = 'Send Message',
    style = ''
  }: Props = $props();

  let fullName = $state('');
  let email = $state('');
  let message = $state('');
  let sent = $state(false);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    sent = true;
    setTimeout(() => (sent = false), 4000);
  }
</script>

<section class="md-section" {style}>
  <div class="md-container md-container--md">
    <div style="text-align: center; margin-bottom: 2.5rem;">
      {#if sectionEyebrow}
        <p class="md-label-large" style="color: var(--md-sys-color-primary); margin: 0 0 0.5rem 0;">{sectionEyebrow}</p>
      {/if}
      <h2 class="md-headline-large" style="margin: 0 0 0.75rem 0;">{sectionTitle}</h2>
      {#if sectionSubtitle}
        <p class="md-body-large" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">{sectionSubtitle}</p>
      {/if}
    </div>
    <form onsubmit={handleSubmit} class="md-card md-card--outlined" style="padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem;">
      <div>
        <label for="contact-name" class="md-label-large" style="display: block; margin-bottom: 0.5rem;">Full Name</label>
        <input id="contact-name" type="text" required bind:value={fullName} placeholder="Jane Doe" class="md-input" />
      </div>
      <div>
        <label for="contact-email" class="md-label-large" style="display: block; margin-bottom: 0.5rem;">Work Email</label>
        <input id="contact-email" type="email" required bind:value={email} placeholder="jane@company.com" class="md-input" />
      </div>
      <div>
        <label for="contact-message" class="md-label-large" style="display: block; margin-bottom: 0.5rem;">Message</label>
        <textarea id="contact-message" rows={4} required bind:value={message} placeholder="How can we help?" class="md-input"></textarea>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <Button type="submit">{submitText}</Button>
        {#if sent}
          <span class="md-label-large" role="status" style="color: var(--md-sys-color-primary);">Message received! We'll reply shortly.</span>
        {/if}
      </div>
    </form>
  </div>
</section>
`,

    'src/lib/components/AuthCard.svelte': `<script lang="ts">
  import Button from './Button.svelte';

  interface Props {
    /** Initial mode; the user can still toggle between sign-in and sign-up. */
    mode?: 'signin' | 'signup';
    brandName?: string;
    title?: string;
    subtitle?: string;
    redirectHref?: string;
    style?: string;
  }

  let {
    mode = 'signin',
    brandName = 'Acme Cloud',
    title = 'Welcome back',
    subtitle = 'Sign in to access your workspace',
    redirectHref = '/dashboard',
    style = ''
  }: Props = $props();

  // User toggle overrides the initial mode prop without copying the prop into state.
  let modeOverride = $state<'signin' | 'signup' | null>(null);
  const currentMode = $derived(modeOverride ?? (mode === 'signup' ? 'signup' : 'signin'));
  const heading = $derived(
    modeOverride && modeOverride !== mode
      ? modeOverride === 'signup'
        ? \`Create your \${brandName} account\`
        : \`Welcome back to \${brandName}\`
      : title
  );

  let email = $state('');
  let password = $state('');
  let authStatus = $state('');

  function handleAuth(e: SubmitEvent) {
    e.preventDefault();
    authStatus =
      currentMode === 'signin'
        ? \`Authenticated! Redirecting to \${redirectHref}...\`
        : 'Account created! Initializing studio...';
  }
</script>

<section class="md-section" style="min-height: 75vh; display: flex; align-items: center; justify-content: center; {style}">
  <div class="md-card md-card--outlined" style="width: 100%; max-width: 26rem; padding: 2.25rem;">
    <div style="text-align: center; margin-bottom: 1.75rem;">
      {#if brandName}
        <span class="md-badge" style="margin-bottom: 0.75rem;">{brandName}</span>
      {/if}
      <h2 class="md-headline-small" style="margin: 0 0 0.5rem 0;">{heading}</h2>
      {#if subtitle}
        <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0;">{subtitle}</p>
      {/if}
    </div>

    {#if authStatus}
      <div role="status" style="margin-bottom: 1.25rem; padding: 0.75rem 1rem; border-radius: var(--md-sys-shape-corner-small, 8px); background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container); font-size: 0.875rem; font-weight: 600;">
        ✓ {authStatus}
      </div>
    {/if}

    <form onsubmit={handleAuth} style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <label for="auth-email" class="md-label-large" style="display: block; margin-bottom: 0.375rem;">Email</label>
        <input id="auth-email" type="email" required bind:value={email} class="md-input" placeholder="you@company.com" />
      </div>
      <div>
        <label for="auth-pass" class="md-label-large" style="display: block; margin-bottom: 0.375rem;">Password</label>
        <input id="auth-pass" type="password" required bind:value={password} class="md-input" placeholder="••••••••" />
      </div>
      <div style="margin-top: 0.5rem;">
        <Button type="submit" style="width: 100%;">{currentMode === 'signup' ? 'Create Account' : 'Sign In'}</Button>
      </div>
    </form>

    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--md-sys-color-outline-variant); text-align: center; font-size: 0.8125rem; color: var(--md-sys-color-on-surface-variant);">
      {#if currentMode === 'signin'}
        New to {brandName}?
        <button type="button" onclick={() => (modeOverride = 'signup')} style="background: transparent; border: none; cursor: pointer; color: var(--md-sys-color-primary); font-weight: 700; margin-left: 0.25rem;">Create an account</button>
      {:else}
        Already have an account?
        <button type="button" onclick={() => (modeOverride = 'signin')} style="background: transparent; border: none; cursor: pointer; color: var(--md-sys-color-primary); font-weight: 700; margin-left: 0.25rem;">Sign in</button>
      {/if}
    </div>
  </div>
</section>
`,

    'src/lib/components/Badge.svelte': `<script lang="ts">
  interface Props {
    text?: string;
    tone?: 'primary' | 'secondary' | 'tertiary' | 'error' | 'success' | 'outline';
    style?: string;
  }

  let { text = 'MD3 Verified', tone = 'primary', style = '' }: Props = $props();

  const toneStyles: Record<string, string> = {
    primary: 'background-color: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container);',
    secondary: 'background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container);',
    tertiary: 'background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);',
    success: 'background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container);',
    error: 'background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);',
    outline: 'border: 1px solid var(--md-sys-color-outline); color: var(--md-sys-color-on-surface);'
  };
</script>

<span style="display: inline-flex; align-items: center; padding: 0.25rem 0.75rem; border-radius: var(--md-sys-shape-corner-small, 8px); font-size: 0.75rem; font-weight: 600; {toneStyles[tone] || toneStyles.primary} {style}">
  {text}
</span>
`,

    'src/lib/components/Card.svelte': `<script lang="ts">
  interface Props {
    variant?: 'elevated' | 'filled' | 'outlined';
    eyebrow?: string;
    title?: string;
    body?: string;
    ctaText?: string;
    ctaHref?: string;
    /** Legacy aliases of ctaText / ctaHref (older blueprints). */
    actionText?: string;
    actionHref?: string;
    align?: 'left' | 'center' | 'right';
    style?: string;
  }

  let {
    variant = 'elevated',
    eyebrow = '',
    title = 'Card Title',
    body = '',
    ctaText = '',
    ctaHref = '#',
    actionText = '',
    actionHref = '',
    align = 'left',
    style = ''
  }: Props = $props();

  const resolvedCtaText = $derived(ctaText || actionText);
  const resolvedCtaHref = $derived(ctaHref && ctaHref !== '#' ? ctaHref : actionHref || ctaHref || '#');
  const alignStyle = $derived(
    align === 'center'
      ? 'text-align: center; display: flex; flex-direction: column; align-items: center;'
      : align === 'right'
        ? 'text-align: right; display: flex; flex-direction: column; align-items: flex-end;'
        : ''
  );
</script>

<div class="md-card md-card--{variant}" style="{alignStyle} {style}">
  {#if eyebrow}
    <div class="md-label-medium" style="color: var(--md-sys-color-primary); margin-bottom: 0.5rem;">{eyebrow}</div>
  {/if}
  {#if title}
    <h3 class="md-title-large" style="margin: 0 0 0.5rem 0;">{title}</h3>
  {/if}
  {#if body}
    <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.25rem 0;">{body}</p>
  {/if}
  {#if resolvedCtaText}
    <a href={resolvedCtaHref} class="md-btn md-btn--tonal md-btn--sm">
      {resolvedCtaText}
    </a>
  {/if}
</div>
`,

    'src/lib/components/Alert.svelte': `<script lang="ts">
  interface Props {
    tone?: 'info' | 'success' | 'warning' | 'error';
    title?: string;
    message?: string;
    dismissible?: boolean;
    style?: string;
  }

  let {
    tone = 'info',
    title = 'System Notice',
    message = '',
    dismissible = false,
    style = ''
  }: Props = $props();

  let dismissed = $state(false);

  // Mirrors the studio preview palette so exported alerts match the canvas.
  const toneStyles: Record<string, string> = {
    info: 'background-color: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container);',
    success: 'background-color: var(--md-sys-color-success-container); color: var(--md-sys-color-on-success-container);',
    warning: 'background-color: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container);',
    error: 'background-color: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container);'
  };
</script>

{#if !dismissed}
  <div
    role="alert"
    class="md-card"
    style="padding: 1rem 1.25rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; {toneStyles[tone] || toneStyles.info} {style}"
  >
    <div>
      {#if title}
        <div class="md-title-medium" style="margin-bottom: 0.25rem;">{title}</div>
      {/if}
      {#if message}
        <div class="md-body-medium">{message}</div>
      {/if}
    </div>
    {#if dismissible}
      <button
        type="button"
        aria-label="Dismiss alert"
        onclick={() => (dismissed = true)}
        style="background: transparent; border: none; color: inherit; cursor: pointer; font-size: 1.125rem; line-height: 1; padding: 0.25rem;"
      >
        ✕
      </button>
    {/if}
  </div>
{/if}
`,

    'src/lib/components/Tabs.svelte': `<script lang="ts">
  import Container from './Container.svelte';

  interface TabItem {
    label: string;
    title: string;
    content: string;
  }

  interface Props {
    tabs?: TabItem[];
    style?: string;
  }

  let { tabs = [], style = '' }: Props = $props();
  let activeIndex = $state(0);
</script>

<section style="padding: 3.5rem 0; {style}">
  <Container maxWidth="lg">
    <div style="display: flex; border-bottom: 1px solid var(--md-sys-color-outline-variant); gap: 0.5rem; margin-bottom: 1.75rem; overflow-x: auto;" role="tablist">
      {#each tabs as tab, idx (idx)}
        <button
          type="button"
          role="tab"
          aria-selected={activeIndex === idx}
          onclick={() => (activeIndex = idx)}
          style="padding: 0.875rem 1.25rem; font-size: 0.875rem; font-weight: 600; border-bottom: 3px solid {activeIndex === idx ? 'var(--md-sys-color-primary)' : 'transparent'}; color: {activeIndex === idx ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)'}; transition: all 150ms ease;"
        >
          {tab.label}
        </button>
      {/each}
    </div>
    {#if tabs[activeIndex]}
      <div class="md-card md-card--outlined" role="tabpanel" style="padding: 2rem;">
        <h3 style="font-size: 1.375rem; font-weight: 700; margin-bottom: 0.75rem;">{tabs[activeIndex].title}</h3>
        <p style="font-size: 0.9375rem; color: var(--md-sys-color-on-surface-variant); line-height: 1.6;">{tabs[activeIndex].content}</p>
      </div>
    {/if}
  </Container>
</section>
`
  };
}
