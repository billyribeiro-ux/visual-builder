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
</script>

<div class="md-container md-container--{maxWidth} {customClass}" {style}>
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
      {#each links as link (link.href)}
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
    badgeText = 'Google MD3 Native',
    style = ''
  }: Props = $props();
</script>

<section class="md-hero" {style}>
  <div class="md-container md-container--xl">
    <div class="md-hero__grid">
      <div>
        {#if badgeText}
          <div class="md-hero__badge">
            <span style="height: 8px; width: 8px; border-radius: 50%; background-color: var(--md-sys-color-primary);"></span>
            {badgeText}
          </div>
        {/if}
        <h1 class="md-hero__title">
          {title}
        </h1>
        <p class="md-hero__subtitle">
          {subtitle}
        </p>
        <div class="md-hero__actions">
          <Button href={primaryCtaHref} size="lg">{primaryCtaText}</Button>
          {#if secondaryCtaText}
            <Button href={secondaryCtaHref} variant="outlined" size="lg">{secondaryCtaText}</Button>
          {/if}
        </div>
      </div>

      <div>
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
      {#each plans as plan (plan.name)}
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
            {#each col.links as link (link.href)}
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
    children?: Snippet;
  }

  let {
    title = 'Dashboard',
    activeNav = 'dashboard',
    children
  }: Props = $props();
</script>

<div class="md-dashboard">
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

<div class="md-kpi-grid" {style}>
  {#each cards as card, idx (idx)}
    <div class="md-card md-card--elevated">
      <div class="md-kpi-card__title">{card.title}</div>
      <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 0.5rem;">
        <div class="md-kpi-card__val">{card.value}</div>
        <span style="font-size: 0.75rem; font-weight: 600; color: {card.trend === 'up' ? 'var(--md-sys-color-success)' : 'var(--md-sys-color-error)'};">
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

<div class="md-table-container" {style}>
  {#if title}
    <div style="padding: 1rem 1.5rem; font-weight: 700; border-bottom: 1px solid var(--md-sys-color-outline-variant);">
      {title}
    </div>
  {/if}
  <div style="overflow-x: auto;">
    <table class="md-table">
      <thead>
        <tr>
          {#each columns as col (col)}
            <th>{col}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each rows as row, rIdx (rIdx)}
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
`
  };
}
