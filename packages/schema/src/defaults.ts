import type { ProjectBlueprint } from './blueprint.js';

export function createDefaultAcmeSaaSProject(): ProjectBlueprint {
  const projectId = '00000000-0000-0000-0000-000000000001';
  const homePageId = '10000000-0000-0000-0000-000000000001';
  const featuresPageId = '10000000-0000-0000-0000-000000000002';
  const pricingPageId = '10000000-0000-0000-0000-000000000003';
  const dashboardPageId = '10000000-0000-0000-0000-000000000004';
  const settingsPageId = '10000000-0000-0000-0000-000000000005';

  return {
    schemaVersion: '1.0.0',
    target: {
      framework: 'sveltekit',
      svelteVersion: '5.57.2',
      sveltekitVersion: '3.1.0',
      viteVersion: '8.0.12',
      nodeVersion: '24.22.0',
      styling: 'vanilla-md3'
    },
    meta: {
      id: projectId,
      name: 'Acme SaaS',
      slug: 'acme-saas',
      description: 'Production-ready AI-powered analytics platform for modern engineering teams.',
      author: 'Principal Studio Architect',
      createdAt: '2026-10-25T12:00:00.000Z',
      updatedAt: '2026-10-25T12:00:00.000Z'
    },
    tokens: {
      colors: {
        primary: '#2563EB',
        'primary-hover': '#1D4ED8',
        'primary-foreground': '#FFFFFF',
        secondary: '#475569',
        'secondary-hover': '#334155',
        'secondary-foreground': '#F8FAFC',
        background: '#FFFFFF',
        foreground: '#0F172A',
        muted: '#F8FAFC',
        'muted-foreground': '#64748B',
        accent: '#EFF6FF',
        'accent-foreground': '#1D4ED8',
        card: '#FFFFFF',
        'card-foreground': '#0F172A',
        border: '#E2E8F0',
        ring: '#2563EB',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        success: '#10B981',
        'success-foreground': '#FFFFFF'
      },
      fonts: {
        heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      },
      radii: {
        none: '0px',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        full: '9999px'
      },
      shadows: {
        none: 'none',
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem'
      },
      breakpoints: {
        compact: '600px',
        medium: '840px',
        expanded: '1200px',
        mobile: '640px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1280px'
      }
    },
    layouts: [
      {
        id: '20000000-0000-0000-0000-000000000001',
        name: 'Public Site Layout',
        isDefault: true,
        rootNode: {
          id: '21000000-0000-0000-0000-000000000001',
          componentType: 'structure/container',
          name: 'Public Layout Root',
          props: { maxWidth: 'full' },
          styles: { base: { minHeight: '100vh', display: 'flex', flexDirection: 'column' } },
          children: [
            {
              id: '21000000-0000-0000-0000-000000000002',
              componentType: 'navigation/navbar',
              name: 'Site Navbar',
              props: {
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
              styles: { base: {} },
              children: []
            },
            {
              id: '21000000-0000-0000-0000-000000000003',
              componentType: 'structure/slot',
              name: 'Page Content Slot',
              props: { name: 'children' },
              styles: { base: { flex: '1 1 auto' } },
              children: []
            },
            {
              id: '21000000-0000-0000-0000-000000000004',
              componentType: 'marketing/footer',
              name: 'Site Footer',
              props: {
                brandName: 'Acme SaaS',
                tagline: 'Engineering velocity for high-growth tech companies.',
                copyright: '© 2026 Acme SaaS Inc. All rights reserved.',
                columns: [
                  {
                    title: 'Product',
                    links: [
                      { label: 'Features', href: '/features' },
                      { label: 'Pricing', href: '/pricing' },
                      { label: 'Changelog', href: '/features#changelog' }
                    ]
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#' },
                      { label: 'Careers', href: '#' },
                      { label: 'Privacy Policy', href: '#' }
                    ]
                  }
                ]
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      }
    ],
    pages: [
      {
        id: homePageId,
        path: '/',
        slug: 'home',
        title: 'Acme SaaS — Visual Development for AI Coding Agents',
        description: 'Build full-stack Svelte apps visually and export machine-readable packages for AI agents.',
        layoutId: '20000000-0000-0000-0000-000000000001',
        isDynamic: false,
        seo: {
          title: 'Acme SaaS — Build Svelte Applications at the Speed of Thought',
          metaDescription: 'Visual editor delivering pixel-perfect Svelte 5 and SvelteKit 3 handoffs for AI coding agents.'
        },
        rootNode: {
          id: '30000000-0000-0000-0000-000000000001',
          componentType: 'structure/container',
          name: 'Home Page Root',
          props: { maxWidth: 'full' },
          styles: { base: {} },
          children: [
            {
              id: '30000000-0000-0000-0000-000000000002',
              componentType: 'hero/split-hero',
              name: 'Hero Section',
              props: {
                eyebrow: 'Introducing Acme SaaS 2.0',
                title: 'Design Visually. Export Pure SvelteKit 3.',
                subtitle: 'The first visual development platform that creates verifiable, versioned blueprints and runnable Svelte 5 code for AI coding agents.',
                primaryCtaText: 'Launch Dashboard',
                primaryCtaHref: '/dashboard',
                secondaryCtaText: 'View Pricing',
                secondaryCtaHref: '/pricing',
                badgeText: 'Built for Svelte 5 Runes'
              },
              styles: {
                base: {
                  paddingTop: '4rem',
                  paddingBottom: '4rem'
                }
              },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000003',
              componentType: 'marketing/feature-grid',
              name: 'Core Features Grid',
              props: {
                sectionEyebrow: 'Capabilities',
                sectionTitle: 'Everything required to build modern web applications',
                sectionDescription: 'From responsive layouts to declarative interactions and full AI agent documentation packages.',
                columns: 3,
                features: [
                  {
                    icon: 'Layers',
                    title: 'Svelte 5 Runes Native',
                    description: 'Reactive state management with $state, $derived, and snippets. No virtual DOM overhead.'
                  },
                  {
                    icon: 'Cpu',
                    title: 'Deterministic AI Handoff',
                    description: 'Generates comprehensive AGENTS.md, IMPLEMENTATION_SPEC.md, and machine-readable blueprints.'
                  },
                  {
                    icon: 'ShieldCheck',
                    title: '100% Preview-Export Parity',
                    description: 'What you see in the studio preview is bit-for-bit identical to the generated SvelteKit project.'
                  }
                ]
              },
              styles: { base: { paddingTop: '3rem', paddingBottom: '3rem' } },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000004',
              componentType: 'marketing/testimonials',
              name: 'Customer Testimonials',
              props: {
                sectionEyebrow: 'Social Proof',
                sectionTitle: 'Trusted by world-class software teams',
                testimonials: [
                  {
                    quote: 'This visual builder eliminated days of back-and-forth between design and engineering. The AI agent export is incredible.',
                    author: 'Sarah Chen',
                    role: 'VP of Product at ScaleFlow'
                  },
                  {
                    quote: 'We fed the exported ZIP directly to an AI agent, and it implemented our payment integrations in 20 minutes without visual drift.',
                    author: 'Marcus Vance',
                    role: 'Founder at HyperStack'
                  }
                ]
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000005',
              componentType: 'marketing/faq-accordion',
              name: 'Frequently Asked Questions',
              props: {
                sectionTitle: 'Frequently Asked Questions',
                items: [
                  {
                    question: 'How does the AI Agent handoff package work?',
                    answer: 'The export contains a complete SvelteKit 3 app, a validated project.blueprint.json, and comprehensive AGENTS.md documentation instructing coding agents on requirements, contracts, and test gates.'
                  },
                  {
                    question: 'Can I run the generated code locally without an internet connection?',
                    answer: 'Yes! The generated SvelteKit 3 application has zero external runtime dependencies on the builder backend and compiles completely offline.'
                  },
                  {
                    question: 'Does this support responsive breakpoints?',
                    answer: 'Yes, full cascading responsive overrides for Mobile (640px), Tablet (768px), and Desktop (1024px) are supported.'
                  }
                ]
              },
              styles: { base: { paddingBottom: '4rem' } },
              children: []
            }
          ]
        }
      },
      {
        id: featuresPageId,
        path: '/features',
        slug: 'features',
        title: 'Features — Acme SaaS',
        description: 'Deep dive into our visual builder capabilities, component registry, and AI code generation.',
        layoutId: '20000000-0000-0000-0000-000000000001',
        isDynamic: false,
        seo: {
          title: 'Features & Architecture — Acme SaaS'
        },
        rootNode: {
          id: '31000000-0000-0000-0000-000000000001',
          componentType: 'structure/container',
          name: 'Features Page Root',
          props: { maxWidth: 'full' },
          styles: { base: { paddingTop: '3rem', paddingBottom: '4rem' } },
          children: [
            {
              id: '31000000-0000-0000-0000-000000000002',
              componentType: 'marketing/feature-grid',
              name: 'Expanded Features Grid',
              props: {
                sectionEyebrow: 'Architectural Excellence',
                sectionTitle: 'Built on the SvelteKit 3 & Vite 8 standard',
                sectionDescription: 'Every component complies with modern TypeScript, Google Material Design 3 (MD3) Pure Vanilla CSS, and WCAG AA accessibility standards.',
                columns: 2,
                features: [
                  {
                    icon: 'Palette',
                    title: 'Google MD3 Pure Vanilla CSS',
                    description: 'Zero external CSS runtime. Built on Google Material Design 3 design system tokens with native CSS custom properties.'
                  },
                  {
                    icon: 'Code',
                    title: 'Subpath Imports with #lib',
                    description: 'Modern Node & SvelteKit 3 imports map standard replacing legacy $lib.'
                  },
                  {
                    icon: 'Zap',
                    title: 'Fine-Grained Signals',
                    description: 'Svelte 5 runes provide instantaneous UI updates even with hundreds of nested layer nodes.'
                  },
                  {
                    icon: 'Lock',
                    title: 'Security-Hardened Runtime',
                    description: 'CSS sanitization, safe zip archive extraction, and origin-verified postMessage communication.'
                  }
                ]
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      },
      {
        id: pricingPageId,
        path: '/pricing',
        slug: 'pricing',
        title: 'Pricing Plans — Acme SaaS',
        description: 'Transparent pricing plans for solo founders, growing startups, and enterprise engineering teams.',
        layoutId: '20000000-0000-0000-0000-000000000001',
        isDynamic: false,
        seo: {
          title: 'Pricing — Acme SaaS'
        },
        rootNode: {
          id: '32000000-0000-0000-0000-000000000001',
          componentType: 'structure/container',
          name: 'Pricing Page Root',
          props: { maxWidth: 'full' },
          styles: { base: { paddingTop: '3rem', paddingBottom: '4rem' } },
          children: [
            {
              id: '32000000-0000-0000-0000-000000000002',
              componentType: 'marketing/pricing-table',
              name: 'Pricing Plans Section',
              props: {
                sectionEyebrow: 'Simple Pricing',
                sectionTitle: 'Invest in engineering velocity',
                sectionDescription: 'Choose the tier that matches your team size. All plans include full AI Agent ZIP export.',
                plans: [
                  {
                    name: 'Starter',
                    price: '$0',
                    period: 'forever',
                    description: 'Perfect for individual founders and prototypes.',
                    features: ['Up to 5 Pages', 'Export to SvelteKit 3', '50+ Component Library', 'Community Support'],
                    ctaText: 'Start Free',
                    ctaHref: '/dashboard',
                    isPopular: false
                  },
                  {
                    name: 'Pro',
                    price: '$49',
                    period: 'per month',
                    description: 'Designed for high-output engineering teams.',
                    features: ['Unlimited Pages', 'Full AI Agent Handoff Package', 'Custom Design Tokens', 'Visual Parity Regression Suite', 'Priority Support'],
                    ctaText: 'Upgrade to Pro',
                    ctaHref: '/dashboard',
                    isPopular: true
                  },
                  {
                    name: 'Enterprise',
                    price: '$199',
                    period: 'per month',
                    description: 'For organizations building multi-brand design systems.',
                    features: ['Custom Component Manifests', 'Self-hosted On-Premises Option', 'SLA Guarantee', 'Dedicated Architect'],
                    ctaText: 'Contact Sales',
                    ctaHref: 'mailto:sales@acme.test',
                    isPopular: false
                  }
                ]
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      },
      {
        id: dashboardPageId,
        path: '/dashboard',
        slug: 'dashboard',
        title: 'Analytics Dashboard — Acme SaaS',
        description: 'Interactive SaaS dashboard with KPI metrics, real-time activity table, and filtering.',
        isDynamic: false,
        seo: {
          title: 'Dashboard — Acme SaaS'
        },
        rootNode: {
          id: '40000000-0000-0000-0000-000000000001',
          componentType: 'app/dashboard-shell',
          name: 'Dashboard App Shell',
          props: {
            title: 'Analytics Overview',
            activeNav: 'dashboard'
          },
          styles: { base: { minHeight: '100vh' } },
          children: [
            {
              id: '40000000-0000-0000-0000-000000000002',
              componentType: 'app/kpi-grid',
              name: 'KPI Metric Cards',
              props: {
                cards: [
                  { title: 'Total Revenue', value: '$124,592', change: '+14.2%', trend: 'up' },
                  { title: 'Active AI Sessions', value: '8,421', change: '+28.4%', trend: 'up' },
                  { title: 'Export Parity Score', value: '99.9%', change: '+0.1%', trend: 'up' },
                  { title: 'Avg Build Time', value: '1.2s', change: '-18.5%', trend: 'up' }
                ]
              },
              styles: { base: { marginBottom: '1.5rem' } },
              children: []
            },
            {
              id: '40000000-0000-0000-0000-000000000003',
              componentType: 'app/data-table',
              name: 'Projects Data Table',
              props: {
                title: 'Recent Production Deployments',
                columns: ['Project Name', 'Framework', 'Pages', 'Status', 'Last Exported'],
                rows: [
                  ['Acme SaaS Production', 'SvelteKit 3.1.0', '5 pages', 'Active', '2 mins ago'],
                  ['Developer Docs Hub', 'SvelteKit 3.1.0', '18 pages', 'Active', '1 hour ago'],
                  ['Mobile Billing Portal', 'SvelteKit 3.1.0', '3 pages', 'Active', 'Yesterday']
                ]
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      },
      {
        id: settingsPageId,
        path: '/dashboard/settings',
        slug: 'settings',
        title: 'Workspace Settings — Acme SaaS',
        description: 'Configure workspace preferences, API keys, and notification channels.',
        isDynamic: false,
        seo: {
          title: 'Settings — Acme SaaS'
        },
        rootNode: {
          id: '41000000-0000-0000-0000-000000000001',
          componentType: 'app/dashboard-shell',
          name: 'Settings App Shell',
          props: {
            title: 'Workspace Settings',
            activeNav: 'settings'
          },
          styles: { base: { minHeight: '100vh' } },
          children: [
            {
              id: '41000000-0000-0000-0000-000000000002',
              componentType: 'app/settings-form',
              name: 'Account & Integration Settings Form',
              props: {
                initialName: 'Acme SaaS Engineering',
                initialEmail: 'engineering@acme.test',
                notificationsEnabled: true
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      }
    ],
    interactions: [
      {
        id: '50000000-0000-0000-0000-000000000001',
        name: 'Launch Dashboard CTA Navigation',
        sourceNodeId: '30000000-0000-0000-0000-000000000002',
        trigger: 'click',
        action: {
          type: 'navigate',
          payload: { targetPath: '/dashboard' }
        }
      }
    ],
    assets: [],
    notes: {
      implementation: 'Preloaded production reference project implementing the complete 11-step user journey.'
    }
  };
}
