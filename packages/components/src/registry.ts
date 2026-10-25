import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';

export const COMPONENT_REGISTRY: Record<string, ComponentManifest<any>> = {
  'structure/container': {
    type: 'structure/container',
    displayName: 'Container',
    category: 'structure',
    description: 'Responsive centered container with standard screen margins and max width.',
    icon: 'Box',
    propsSchema: z.object({
      maxWidth: z.enum(['sm', 'md', 'lg', 'xl', '2xl', 'full']).default('xl')
    }),
    defaultProps: {
      maxWidth: 'xl'
    },
    slots: [{ name: 'children', displayName: 'Container Content' }]
  },

  'hero/split-hero': {
    type: 'hero/split-hero',
    displayName: 'Split Hero Section',
    category: 'hero',
    description: 'High-impact split layout hero with badge, headline, subtitle, dual CTAs, and interactive preview mockup.',
    icon: 'LayoutTemplate',
    isSection: true,
    propsSchema: z.object({
      eyebrow: z.string().default(''),
      title: z.string().default('Design Visually. Export Pure SvelteKit 3.'),
      subtitle: z.string().default('Build full-stack Svelte apps visually and export machine-readable packages for AI agents.'),
      primaryCtaText: z.string().default('Launch Dashboard'),
      primaryCtaHref: z.string().default('/dashboard'),
      secondaryCtaText: z.string().default('View Pricing'),
      secondaryCtaHref: z.string().default('/pricing'),
      badgeText: z.string().default('Svelte 5 Runes Native')
    }),
    defaultProps: {
      eyebrow: 'Introducing Acme SaaS 2.0',
      title: 'Design Visually. Export Pure SvelteKit 3.',
      subtitle: 'The first visual development platform that creates verifiable, versioned blueprints and runnable Svelte 5 code for AI coding agents.',
      primaryCtaText: 'Launch Dashboard',
      primaryCtaHref: '/dashboard',
      secondaryCtaText: 'View Pricing',
      secondaryCtaHref: '/pricing',
      badgeText: 'Built for Svelte 5 Runes'
    },
    slots: []
  },

  'marketing/feature-grid': {
    type: 'marketing/feature-grid',
    displayName: 'Feature Grid',
    category: 'marketing',
    description: 'Multi-column grid presenting key capabilities, cards, and icons.',
    icon: 'Grid',
    isSection: true,
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Platform Capabilities'),
      sectionDescription: z.string().default(''),
      columns: z.number().min(1).max(4).default(3),
      features: z.array(z.object({
        icon: z.string().default('Zap'),
        title: z.string(),
        description: z.string()
      })).default([])
    }),
    defaultProps: {
      sectionEyebrow: 'Capabilities',
      sectionTitle: 'Everything required to build modern web applications',
      sectionDescription: 'From responsive layouts to declarative interactions and full AI agent documentation packages.',
      columns: 3,
      features: [
        { icon: 'Layers', title: 'Svelte 5 Runes Native', description: 'Reactive state management with $state, $derived, and snippets.' },
        { icon: 'Cpu', title: 'Deterministic AI Handoff', description: 'Generates comprehensive AGENTS.md, IMPLEMENTATION_SPEC.md, and blueprints.' },
        { icon: 'ShieldCheck', title: '100% Preview Parity', description: 'What you see in the studio preview is bit-for-bit identical to the generated app.' }
      ]
    },
    slots: []
  },

  'marketing/pricing-table': {
    type: 'marketing/pricing-table',
    displayName: 'Pricing Table',
    category: 'marketing',
    description: 'Tiered subscription cards with feature lists, highlighted popular badge, and checkout CTA buttons.',
    icon: 'CreditCard',
    isSection: true,
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Transparent Pricing'),
      sectionDescription: z.string().default(''),
      plans: z.array(z.object({
        name: z.string(),
        price: z.string(),
        period: z.string(),
        description: z.string(),
        features: z.array(z.string()),
        ctaText: z.string(),
        ctaHref: z.string(),
        isPopular: z.boolean().default(false)
      })).default([])
    }),
    defaultProps: {
      sectionEyebrow: 'Simple Pricing',
      sectionTitle: 'Invest in engineering velocity',
      sectionDescription: 'Choose the tier that matches your team size. All plans include full AI Agent ZIP export.',
      plans: [
        {
          name: 'Starter',
          price: '$0',
          period: 'forever',
          description: 'Perfect for individual founders and prototypes.',
          features: ['Up to 5 Pages', 'Export to SvelteKit 3', '50+ Component Library'],
          ctaText: 'Start Free',
          ctaHref: '/dashboard',
          isPopular: false
        },
        {
          name: 'Pro',
          price: '$49',
          period: 'per month',
          description: 'Designed for high-output engineering teams.',
          features: ['Unlimited Pages', 'Full AI Agent Handoff Package', 'Visual Parity Suite'],
          ctaText: 'Upgrade to Pro',
          ctaHref: '/dashboard',
          isPopular: true
        }
      ]
    },
    slots: []
  },

  'marketing/faq-accordion': {
    type: 'marketing/faq-accordion',
    displayName: 'FAQ Accordion',
    category: 'marketing',
    description: 'Accessible expandable accordion list for frequently asked questions.',
    icon: 'HelpCircle',
    isSection: true,
    propsSchema: z.object({
      sectionTitle: z.string().default('Frequently Asked Questions'),
      items: z.array(z.object({
        question: z.string(),
        answer: z.string()
      })).default([])
    }),
    defaultProps: {
      sectionTitle: 'Frequently Asked Questions',
      items: [
        { question: 'How does the AI Agent handoff package work?', answer: 'The export contains a complete SvelteKit 3 app, a validated blueprint, and AGENTS.md instructions.' },
        { question: 'Can I run the generated code locally?', answer: 'Yes! The generated SvelteKit 3 application has zero external runtime dependencies.' }
      ]
    },
    slots: []
  },

  'marketing/testimonials': {
    type: 'marketing/testimonials',
    displayName: 'Testimonial Cards',
    category: 'marketing',
    description: 'Customer quotes and social proof cards.',
    icon: 'MessageSquare',
    isSection: true,
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Trusted by software teams'),
      testimonials: z.array(z.object({
        quote: z.string(),
        author: z.string(),
        role: z.string()
      })).default([])
    }),
    defaultProps: {
      sectionEyebrow: 'Social Proof',
      sectionTitle: 'Trusted by world-class software teams',
      testimonials: [
        { quote: 'This visual builder eliminated days of back-and-forth between design and engineering.', author: 'Sarah Chen', role: 'VP of Product at ScaleFlow' },
        { quote: 'We fed the exported ZIP directly to an AI agent, and it implemented our payment integrations in 20 minutes.', author: 'Marcus Vance', role: 'Founder at HyperStack' }
      ]
    },
    slots: []
  },

  'navigation/navbar': {
    type: 'navigation/navbar',
    displayName: 'Site Navbar',
    category: 'navigation',
    description: 'Sticky header navigation bar with logo, responsive links, and primary action button.',
    icon: 'Navigation',
    propsSchema: z.object({
      brandName: z.string().default('Acme SaaS'),
      logoUrl: z.string().default(''),
      links: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
      ctaText: z.string().default('Get Started'),
      ctaHref: z.string().default('/dashboard')
    }),
    defaultProps: {
      brandName: 'Acme SaaS',
      logoUrl: '',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Dashboard', href: '/dashboard' }
      ],
      ctaText: 'Get Started',
      ctaHref: '/dashboard'
    },
    slots: []
  },

  'marketing/footer': {
    type: 'marketing/footer',
    displayName: 'Site Footer',
    category: 'marketing',
    description: 'Multi-column site footer with brand overview and categorized links.',
    icon: 'PanelBottom',
    propsSchema: z.object({
      brandName: z.string().default('Acme SaaS'),
      tagline: z.string().default(''),
      copyright: z.string().default(''),
      columns: z.array(z.object({
        title: z.string(),
        links: z.array(z.object({ label: z.string(), href: z.string() }))
      })).default([])
    }),
    defaultProps: {
      brandName: 'Acme SaaS',
      tagline: 'Engineering velocity for high-growth tech companies.',
      copyright: '© 2026 Acme SaaS Inc. All rights reserved.',
      columns: [
        {
          title: 'Product',
          links: [
            { label: 'Features', href: '/features' },
            { label: 'Pricing', href: '/pricing' }
          ]
        }
      ]
    },
    slots: []
  },

  'ui/button': {
    type: 'ui/button',
    displayName: 'Button',
    category: 'ui',
    description: 'Interactive button or link styled according to design tokens.',
    icon: 'Square',
    propsSchema: z.object({
      text: z.string().default('Button'),
      variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      href: z.string().default('')
    }),
    defaultProps: {
      text: 'Click Me',
      variant: 'primary',
      size: 'md',
      href: ''
    },
    slots: []
  },

  'app/dashboard-shell': {
    type: 'app/dashboard-shell',
    displayName: 'Dashboard Shell',
    category: 'app',
    description: 'Complete web application shell with sidebar navigation, user badge, and top navigation header.',
    icon: 'LayoutDashboard',
    isSection: true,
    propsSchema: z.object({
      title: z.string().default('Analytics Overview'),
      activeNav: z.string().default('dashboard')
    }),
    defaultProps: {
      title: 'Analytics Overview',
      activeNav: 'dashboard'
    },
    slots: [{ name: 'children', displayName: 'Dashboard Content' }]
  },

  'app/kpi-grid': {
    type: 'app/kpi-grid',
    displayName: 'KPI Metrics Grid',
    category: 'app',
    description: 'Grid of key performance indicator cards with trend indicators.',
    icon: 'TrendingUp',
    isSection: true,
    propsSchema: z.object({
      cards: z.array(z.object({
        title: z.string(),
        value: z.string(),
        change: z.string(),
        trend: z.enum(['up', 'down'])
      })).default([])
    }),
    defaultProps: {
      cards: [
        { title: 'Total Revenue', value: '$124,592', change: '+14.2%', trend: 'up' },
        { title: 'Active AI Sessions', value: '8,421', change: '+28.4%', trend: 'up' },
        { title: 'Export Parity Score', value: '99.9%', change: '+0.1%', trend: 'up' }
      ]
    },
    slots: []
  },

  'app/data-table': {
    type: 'app/data-table',
    displayName: 'Data Table',
    category: 'app',
    description: 'Responsive tabular data presentation with headers and rows.',
    icon: 'Table',
    isSection: true,
    propsSchema: z.object({
      title: z.string().default('Data Table'),
      columns: z.array(z.string()).default([]),
      rows: z.array(z.array(z.string())).default([])
    }),
    defaultProps: {
      title: 'Recent Production Deployments',
      columns: ['Project Name', 'Framework', 'Pages', 'Status'],
      rows: [
        ['Acme SaaS Production', 'SvelteKit 3.1.0', '5 pages', 'Active'],
        ['Developer Docs Hub', 'SvelteKit 3.1.0', '18 pages', 'Active']
      ]
    },
    slots: []
  },

  'app/settings-form': {
    type: 'app/settings-form',
    displayName: 'Settings Form',
    category: 'app',
    description: 'Interactive account preferences form with client-side validation and feedback.',
    icon: 'Sliders',
    isSection: true,
    propsSchema: z.object({
      initialName: z.string().default('Acme Workspace'),
      initialEmail: z.string().default('team@acme.test'),
      notificationsEnabled: z.boolean().default(true)
    }),
    defaultProps: {
      initialName: 'Acme Workspace',
      initialEmail: 'team@acme.test',
      notificationsEnabled: true
    },
    slots: []
  }
};

export function getManifest(type: string): ComponentManifest<any> | undefined {
  return COMPONENT_REGISTRY[type];
}

export function getAllManifests(): ComponentManifest<any>[] {
  return Object.values(COMPONENT_REGISTRY);
}

export function getManifestsByCategory(category: string): ComponentManifest<any>[] {
  return Object.values(COMPONENT_REGISTRY).filter((m) => m.category === category);
}
