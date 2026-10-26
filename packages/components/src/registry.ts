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
  },

  'structure/section': {
    type: 'structure/section',
    displayName: 'MD3 Surface Section',
    category: 'structure',
    description: 'Semantic page section with configurable MD3 surface container tone and vertical spacing.',
    icon: 'Layout',
    isSection: true,
    propsSchema: z.object({
      surfaceTone: z.enum(['surface', 'low', 'container', 'high', 'primary-container']).default('surface'),
      paddingY: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
      maxWidth: z.enum(['sm', 'md', 'lg', 'xl', '2xl', 'full']).default('xl')
    }),
    defaultProps: {
      surfaceTone: 'low',
      paddingY: 'lg',
      maxWidth: 'xl'
    },
    slots: [{ name: 'children', displayName: 'Section Content' }]
  },

  'structure/grid': {
    type: 'structure/grid',
    displayName: 'Responsive Grid / Stack',
    category: 'structure',
    description: 'Flexible multi-column grid or stack container for nesting cards, buttons, and UI blocks.',
    icon: 'Columns',
    propsSchema: z.object({
      columns: z.number().min(1).max(4).default(2),
      gap: z.string().default('1.5rem'),
      alignItems: z.enum(['stretch', 'start', 'center', 'end']).default('stretch')
    }),
    defaultProps: {
      columns: 2,
      gap: '1.5rem',
      alignItems: 'stretch'
    },
    slots: [{ name: 'children', displayName: 'Grid Items' }]
  },

  'structure/divider': {
    type: 'structure/divider',
    displayName: 'MD3 Divider',
    category: 'structure',
    description: 'Material Design 3 horizontal outline-variant divider line with configurable spacing.',
    icon: 'Minus',
    propsSchema: z.object({
      inset: z.boolean().default(false),
      spacingY: z.string().default('2rem')
    }),
    defaultProps: {
      inset: false,
      spacingY: '2rem'
    },
    slots: []
  },

  'marketing/cta-banner': {
    type: 'marketing/cta-banner',
    displayName: 'Call-to-Action Banner',
    category: 'marketing',
    description: 'High-impact MD3 primary container call-to-action banner with headline, subtitle, and dual actions.',
    icon: 'Megaphone',
    isSection: true,
    propsSchema: z.object({
      title: z.string().default('Ready to accelerate your Svelte 5 workflow?'),
      subtitle: z.string().default('Export a deterministic, self-contained SvelteKit 3 handoff package for your AI coding agents in one click.'),
      primaryCtaText: z.string().default('Launch Studio Free'),
      primaryCtaHref: z.string().default('/dashboard'),
      secondaryCtaText: z.string().default('Compare Plans'),
      secondaryCtaHref: z.string().default('/pricing')
    }),
    defaultProps: {
      title: 'Ready to accelerate your Svelte 5 workflow?',
      subtitle: 'Export a deterministic, self-contained SvelteKit 3 handoff package for your AI coding agents in one click.',
      primaryCtaText: 'Launch Studio Free',
      primaryCtaHref: '/dashboard',
      secondaryCtaText: 'Compare Plans',
      secondaryCtaHref: '/pricing'
    },
    slots: []
  },

  'marketing/stats-bar': {
    type: 'marketing/stats-bar',
    displayName: 'Metrics & Stats Bar',
    category: 'marketing',
    description: 'Horizontal band showcasing key product metrics, benchmarks, and social proof numbers.',
    icon: 'BarChart2',
    isSection: true,
    propsSchema: z.object({
      stats: z.array(z.object({
        value: z.string(),
        label: z.string(),
        detail: z.string().default('')
      })).default([])
    }),
    defaultProps: {
      stats: [
        { value: '100%', label: 'Preview-to-Export Parity', detail: 'Zero runtime translation drift' },
        { value: '5.57.2', label: 'Svelte 5 Runes Target', detail: 'Modern signal reactivity' },
        { value: '0 KB', label: 'External CSS Runtime', detail: 'Pure Google MD3 Vanilla CSS' },
        { value: '< 1.2s', label: 'Production Build Time', detail: 'Powered by Vite 8 & SvelteKit 3' }
      ]
    },
    slots: []
  },

  'marketing/newsletter': {
    type: 'marketing/newsletter',
    displayName: 'Newsletter Capture',
    category: 'marketing',
    description: 'Interactive email subscription section with validation and confirmation state.',
    icon: 'Mail',
    isSection: true,
    propsSchema: z.object({
      title: z.string().default('Stay ahead of the Svelte 5 ecosystem'),
      subtitle: z.string().default('Receive monthly architecture deep-dives, MD3 design token updates, and AI agent patterns.'),
      placeholder: z.string().default('engineer@company.com'),
      buttonText: z.string().default('Subscribe')
    }),
    defaultProps: {
      title: 'Stay ahead of the Svelte 5 ecosystem',
      subtitle: 'Receive monthly architecture deep-dives, MD3 design token updates, and AI agent patterns.',
      placeholder: 'engineer@company.com',
      buttonText: 'Subscribe'
    },
    slots: []
  },

  'marketing/contact-form': {
    type: 'marketing/contact-form',
    displayName: 'Contact & Inquiry Form',
    category: 'marketing',
    description: 'Multi-field enterprise contact section with interactive validation and submission state.',
    icon: 'Send',
    isSection: true,
    propsSchema: z.object({
      title: z.string().default('Talk to our Architecture Team'),
      subtitle: z.string().default('Questions about custom component registries, enterprise handoffs, or self-hosted deployments?'),
      submitText: z.string().default('Send Message')
    }),
    defaultProps: {
      title: 'Talk to our Architecture Team',
      subtitle: 'Questions about custom component registries, enterprise handoffs, or self-hosted deployments?',
      submitText: 'Send Message'
    },
    slots: []
  },

  'app/auth-card': {
    type: 'app/auth-card',
    displayName: 'SaaS Auth Card (Sign In / Up)',
    category: 'app',
    description: 'Interactive authentication card supporting Sign-In and Sign-Up state switching and form validation.',
    icon: 'Lock',
    isSection: true,
    propsSchema: z.object({
      title: z.string().default('Welcome back to Acme SaaS'),
      subtitle: z.string().default('Sign in to your workspace to manage visual blueprints and deployments.'),
      redirectHref: z.string().default('/dashboard')
    }),
    defaultProps: {
      title: 'Welcome back to Acme SaaS',
      subtitle: 'Sign in to your workspace to manage visual blueprints and deployments.',
      redirectHref: '/dashboard'
    },
    slots: []
  },

  'ui/badge': {
    type: 'ui/badge',
    displayName: 'MD3 Chip Badge',
    category: 'ui',
    description: 'Material Design 3 pill badge for status labels, version tags, and category chips.',
    icon: 'Tag',
    propsSchema: z.object({
      text: z.string().default('MD3 Verified'),
      tone: z.enum(['primary', 'secondary', 'success', 'error', 'outline']).default('primary')
    }),
    defaultProps: {
      text: 'MD3 Verified',
      tone: 'primary'
    },
    slots: []
  },

  'ui/card': {
    type: 'ui/card',
    displayName: 'MD3 Content Card',
    category: 'ui',
    description: 'Material Design 3 card (elevated, filled, or outlined) with title, body, and optional action.',
    icon: 'CreditCard',
    propsSchema: z.object({
      variant: z.enum(['elevated', 'filled', 'outlined']).default('elevated'),
      eyebrow: z.string().default('Feature Module'),
      title: z.string().default('Composable Architecture'),
      body: z.string().default('Built with pure Vanilla CSS and Google Material Design 3 tokens for zero runtime overhead.'),
      ctaText: z.string().default('Learn more'),
      ctaHref: z.string().default('/features')
    }),
    defaultProps: {
      variant: 'elevated',
      eyebrow: 'Feature Module',
      title: 'Composable Architecture',
      body: 'Built with pure Vanilla CSS and Google Material Design 3 tokens for zero runtime overhead.',
      ctaText: 'Learn more',
      ctaHref: '/features'
    },
    slots: []
  },

  'ui/alert': {
    type: 'ui/alert',
    displayName: 'MD3 Status Alert',
    category: 'ui',
    description: 'Semantic alert banner for informational, success, or error callouts.',
    icon: 'AlertCircle',
    propsSchema: z.object({
      tone: z.enum(['info', 'success', 'error']).default('info'),
      title: z.string().default('System Status Nominal'),
      message: z.string().default('All SvelteKit 3 routes and Google MD3 design tokens are synchronized.')
    }),
    defaultProps: {
      tone: 'info',
      title: 'System Status Nominal',
      message: 'All SvelteKit 3 routes and Google MD3 design tokens are synchronized.'
    },
    slots: []
  },

  'ui/tabs': {
    type: 'ui/tabs',
    displayName: 'MD3 Interactive Tabs',
    category: 'ui',
    description: 'Accessible tabbed interface with interactive panel switching.',
    icon: 'Folder',
    isSection: true,
    propsSchema: z.object({
      tabs: z.array(z.object({
        label: z.string(),
        title: z.string(),
        content: z.string()
      })).default([])
    }),
    defaultProps: {
      tabs: [
        {
          label: '1. Design Visually',
          title: 'Compose Multi-Page Flows on a Live Svelte 5 Canvas',
          content: 'Assemble responsive marketing pages and SaaS dashboards using 25+ Google MD3 sections, live breakpoint controls, and real-time token cascading.'
        },
        {
          label: '2. Inspect & Wire',
          title: 'Fine-Tune Properties, Responsive Overrides, and Events',
          content: 'Every edit dispatches a typed command to the immutable HistoryManager, enabling instant Undo/Redo, localStorage autosave, and named snapshots.'
        },
        {
          label: '3. Export for AI Agents',
          title: 'Deterministic Handoff ZIP + Standalone SvelteKit 3 Source',
          content: 'Download a bit-exact archive containing AGENTS.md, project.blueprint.json, and a complete SvelteKit 3 application with zero external runtime lock-in.'
        }
      ]
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
