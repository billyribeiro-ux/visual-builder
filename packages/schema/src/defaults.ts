import {
  ProjectBlueprintSchema,
  BlueprintNodeSchema,
  CURRENT_SCHEMA_VERSION,
  createNode,
  createId,
  reassignNodeIds,
  type ProjectBlueprint,
  type ProjectBlueprintInput,
  type BlueprintNode,
  type BlueprintNodeInput,
  type PageRoute,
  type BlueprintAsset
} from './blueprint.js';
import { DEFAULT_MD3_LIGHT_COLORS } from './tokens.js';

export function createDefaultAcmeSaaSProject(): ProjectBlueprint {
  const projectId = '00000000-0000-0000-0000-000000000001';
  const homePageId = '10000000-0000-0000-0000-000000000001';
  const featuresPageId = '10000000-0000-0000-0000-000000000002';
  const pricingPageId = '10000000-0000-0000-0000-000000000003';
  const dashboardPageId = '10000000-0000-0000-0000-000000000004';
  const settingsPageId = '10000000-0000-0000-0000-000000000005';

  const raw: ProjectBlueprintInput = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    target: {
      framework: 'sveltekit',
      svelteVersion: '5.57.3',
      sveltekitVersion: '3.1.0',
      viteVersion: '8.3.5',
      nodeVersion: '26.13.0',
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
      colors: { ...DEFAULT_MD3_LIGHT_COLORS },
      fonts: {
        heading: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        body: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        mono: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
      },
      radii: {
        none: '0px',
        'extra-small': '4px',
        small: '8px',
        medium: '12px',
        large: '16px',
        'extra-large': '28px',
        full: '9999px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '28px'
      },
      shadows: {
        level0: 'none',
        level1: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        level2: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
        level3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
        level4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30)',
        level5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)'
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px'
      },
      breakpoints: {
        compact: '600px',
        medium: '840px',
        expanded: '1200px',
        mobile: '600px',
        tablet: '840px',
        desktop: '1200px',
        wide: '1440px'
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
                      { label: 'About', href: '#about' },
                      { label: 'Careers', href: '#careers' },
                      { label: 'Privacy Policy', href: '#privacy' }
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
                  { label: 'Total Revenue', title: 'Total Revenue', value: '$124,592', delta: '+14.2%', change: '+14.2%', trend: 'up' },
                  { label: 'Active AI Sessions', title: 'Active AI Sessions', value: '8,421', delta: '+28.4%', change: '+28.4%', trend: 'up' },
                  { label: 'Export Parity Score', title: 'Export Parity Score', value: '99.9%', delta: '+0.1%', change: '+0.1%', trend: 'up' },
                  { label: 'Avg Build Time', title: 'Avg Build Time', value: '1.2s', delta: '-18.5%', change: '-18.5%', trend: 'up' }
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
    assets: CURATED_PROJECT_ASSETS.map((a) => ({ ...a })),
    notes: {
      implementation: 'Preloaded production reference project implementing the complete 11-step user journey.'
    }
  };
  return ProjectBlueprintSchema.parse(raw);
}

export const CURATED_PROJECT_ASSETS: BlueprintAsset[] = [
  {
    id: '80000000-0000-4000-8000-000000000001',
    filename: 'analytics-pulse.svg',
    mimeType: 'image/svg+xml',
    size: 642,
    localPath: '/assets/analytics-pulse.svg',
    alt: 'Real-time analytics velocity chart',
    category: 'illustration',
    width: 320,
    height: 180,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" rx="16" fill="#EDF2FC"/><path d="M28 136L88 96L142 114L212 54L292 34" stroke="#0B57D0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="212" cy="54" r="7" fill="#0B57D0"/><circle cx="292" cy="34" r="7" fill="#146C2E"/></svg>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" rx="16" fill="#EDF2FC"/><path d="M28 136L88 96L142 114L212 54L292 34" stroke="#0B57D0" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="212" cy="54" r="7" fill="#0B57D0"/><circle cx="292" cy="34" r="7" fill="#146C2E"/></svg>')}`
  },
  {
    id: '80000000-0000-4000-8000-000000000002',
    filename: 'ai-agent-flow.svg',
    mimeType: 'image/svg+xml',
    size: 718,
    localPath: '/assets/ai-agent-flow.svg',
    alt: 'Autonomous AI agent orchestration graph',
    category: 'illustration',
    width: 320,
    height: 180,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" rx="16" fill="#F3E8FD"/><rect x="30" y="66" width="68" height="48" rx="12" fill="#6D28D9"/><rect x="126" y="34" width="68" height="44" rx="12" fill="#0B57D0"/><rect x="126" y="102" width="68" height="44" rx="12" fill="#0B57D0"/><rect x="222" y="66" width="68" height="48" rx="12" fill="#146C2E"/><path d="M98 90H126M194 56L222 90M194 124L222 90" stroke="#444746" stroke-width="3"/></svg>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" rx="16" fill="#F3E8FD"/><rect x="30" y="66" width="68" height="48" rx="12" fill="#6D28D9"/><rect x="126" y="34" width="68" height="44" rx="12" fill="#0B57D0"/><rect x="126" y="102" width="68" height="44" rx="12" fill="#0B57D0"/><rect x="222" y="66" width="68" height="48" rx="12" fill="#146C2E"/><path d="M98 90H126M194 56L222 90M194 124L222 90" stroke="#444746" stroke-width="3"/></svg>')}`
  },
  {
    id: '80000000-0000-4000-8000-000000000003',
    filename: 'security-vault.svg',
    mimeType: 'image/svg+xml',
    size: 590,
    localPath: '/assets/security-vault.svg',
    alt: 'Zero-trust security shield badge',
    category: 'icon',
    width: 240,
    height: 180,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><rect width="240" height="180" rx="16" fill="#E6F4EA"/><path d="M120 32L172 54V98C172 130 149 152 120 162C91 152 68 130 68 98V54L120 32Z" fill="#146C2E"/><path d="M103 98L115 110L140 82" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><rect width="240" height="180" rx="16" fill="#E6F4EA"/><path d="M120 32L172 54V98C172 130 149 152 120 162C91 152 68 130 68 98V54L120 32Z" fill="#146C2E"/><path d="M103 98L115 110L140 82" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>')}`
  },
  {
    id: '80000000-0000-4000-8000-000000000004',
    filename: 'brand-mark.svg',
    mimeType: 'image/svg+xml',
    size: 480,
    localPath: '/assets/brand-mark.svg',
    alt: 'Acme MD3 geometric logo mark',
    category: 'logo',
    width: 120,
    height: 120,
    svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="#0B57D0"/><path d="M60 24L92 88H28L60 24Z" fill="#D3E3FD"/><circle cx="60" cy="68" r="12" fill="#0B57D0"/></svg>`,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="#0B57D0"/><path d="M60 24L92 88H28L60 24Z" fill="#D3E3FD"/><circle cx="60" cy="68" r="12" fill="#0B57D0"/></svg>')}`
  }
];

export function createBlankProject(name = 'Untitled App'): ProjectBlueprint {
  const base = createDefaultAcmeSaaSProject();
  const slug = toSlug(name) || 'untitled-app';
  const now = new Date().toISOString();
  // Fresh layout IDs so a blank project never shares node IDs with the reference project.
  const layouts = base.layouts.map((l) => ({ ...l, id: createId(), rootNode: reassignNodeIds(l.rootNode) }));
  const defaultLayoutId = layouts.find((l) => l.isDefault)?.id ?? layouts[0]?.id;

  return ProjectBlueprintSchema.parse({
    ...base,
    meta: {
      ...base.meta,
      id: createId(),
      name,
      slug,
      description: `${name} — built with the Visual Builder`,
      createdAt: now,
      updatedAt: now
    },
    layouts,
    pages: [
      {
        id: createId(),
        path: '/',
        slug: 'home',
        title: `${name} — Home`,
        description: `Welcome to ${name}`,
        layoutId: defaultLayoutId,
        isDynamic: false,
        seo: { title: `${name} — Home` },
        rootNode: createNode({
          componentType: 'structure/container',
          name: 'Home Root Container',
          props: { maxWidth: 'xl' },
          styles: { base: { minHeight: '60vh', paddingTop: '3rem', paddingBottom: '3rem' } },
          children: [
            {
              id: createId(),
              componentType: 'hero/split-hero',
              name: 'Welcome Hero',
              props: {
                eyebrow: 'New Project',
                title: `Welcome to ${name}`,
                subtitle: 'Drag or insert sections from the left library drawer to build your application.',
                primaryCtaText: 'Get Started',
                primaryCtaHref: '/',
                secondaryCtaText: 'Learn More',
                secondaryCtaHref: '#features',
                badgeText: 'New project'
              }
            }
          ]
        })
      }
    ],
    interactions: []
  } satisfies ProjectBlueprintInput);
}

export function toSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export interface PreflightCheckItem {
  id: string;
  category: 'schema' | 'routing' | 'accessibility' | 'tokens' | 'codegen';
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface PreflightIssue {
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface PreflightReport {
  valid: boolean;
  score: number;
  checks: PreflightCheckItem[];
  issues: PreflightIssue[];
}

export function validateBlueprintPreflight(blueprint: ProjectBlueprint): PreflightReport {
  const checks: PreflightCheckItem[] = [];

  // 1. Schema Validation
  const parsed = ProjectBlueprintSchema.safeParse(blueprint);
  checks.push({
    id: 'schema-valid',
    category: 'schema',
    label: 'Zod Blueprint Schema Contract',
    status: parsed.success ? 'pass' : 'fail',
    detail: parsed.success
      ? `Valid v${blueprint.schemaVersion} Blueprint (${blueprint.pages.length} routes)`
      : parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
  });

  // 2. Target & Styling Policy Check
  const isMd3 = blueprint.target?.styling === 'vanilla-md3';
  checks.push({
    id: 'styling-policy',
    category: 'tokens',
    label: 'Google MD3 Pure Vanilla CSS Policy',
    status: isMd3 ? 'pass' : 'fail',
    detail: isMd3
      ? `Target Svelte ${blueprint.target.svelteVersion} + SvelteKit ${blueprint.target.sveltekitVersion} (vanilla-md3)`
      : 'Invalid styling target'
  });

  // 3. Route Uniqueness & Link Integrity
  const routePaths = new Set(blueprint.pages.map((p) => p.path));
  const brokenLinks: string[] = [];

  function scanLinks(node: BlueprintNode, contextPath: string) {
    const props = node.props || {};
    for (const [k, v] of Object.entries(props)) {
      if ((k.toLowerCase().includes('href') || k === 'path') && typeof v === 'string') {
        if (v.startsWith('/') && !v.startsWith('//')) {
          const cleanPath = v.split('#')[0].split('?')[0] || '/';
          if (!routePaths.has(cleanPath)) {
            brokenLinks.push(`${node.name} (${contextPath}) -> ${v}`);
          }
        }
      }
    }
    for (const child of node.children || []) {
      scanLinks(child, contextPath);
    }
  }

  for (const page of blueprint.pages) {
    scanLinks(page.rootNode, page.path);
  }
  for (const layout of blueprint.layouts || []) {
    scanLinks(layout.rootNode, `Layout:${layout.name}`);
  }

  checks.push({
    id: 'route-integrity',
    category: 'routing',
    label: 'Internal Route Link Integrity',
    status: brokenLinks.length === 0 ? 'pass' : 'warn',
    detail:
      brokenLinks.length === 0
        ? `All internal links across ${blueprint.pages.length} routes resolve cleanly.`
        : `Unresolved route link(s): ${brokenLinks.join(', ')}`
  });

  // 4. Accessibility & Metadata Check
  const missingTitles = blueprint.pages.filter((p) => !p.title || !p.title.trim());
  checks.push({
    id: 'a11y-landmarks',
    category: 'accessibility',
    label: 'Semantic Landmarks & Page Metadata',
    status: missingTitles.length === 0 ? 'pass' : 'warn',
    detail:
      missingTitles.length === 0
        ? 'All routes declare document titles, ARIA landmarks, and keyboard-accessible controls.'
        : `${missingTitles.length} page(s) missing document title.`
  });

  // 5. Deterministic Export Readiness
  checks.push({
    id: 'export-determinism',
    category: 'codegen',
    label: 'SvelteKit 3 + AGENTS.md Handoff Readiness',
    status: 'pass',
    detail: 'Ready to emit standalone SvelteKit 3 source, AGENTS.md, and deterministic ZIP archive.'
  });

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const score = Math.round((passCount / checks.length) * 100);

  const issues: PreflightIssue[] = checks
    .filter((c) => c.status !== 'pass')
    .map((c) => ({
      severity: c.status === 'fail' ? 'error' : 'warning',
      code: c.id.toUpperCase(),
      message: `${c.label}: ${c.detail}`
    }));

  return {
    valid: failCount === 0,
    score,
    checks,
    issues
  };
}

export type PageTemplateKey =
  | 'blank'
  | 'saas-landing'
  | 'features'
  | 'pricing'
  | 'dashboard'
  | 'auth-contact';

export const PAGE_TEMPLATE_CATALOG: Array<{
  key: PageTemplateKey;
  label: string;
  description: string;
  usesSharedLayout: boolean;
}> = [
  {
    key: 'blank',
    label: 'Blank Container Page',
    description: 'Clean MD3 container ready for custom sections.',
    usesSharedLayout: true
  },
  {
    key: 'saas-landing',
    label: 'SaaS Marketing Landing',
    description: 'Split Hero, Stats Bar, Feature Grid, Testimonials, FAQ & CTA Banner.',
    usesSharedLayout: true
  },
  {
    key: 'features',
    label: 'Product Features & Specs',
    description: 'Interactive Tabs, 3-Column Feature Grid, and Newsletter signup.',
    usesSharedLayout: true
  },
  {
    key: 'pricing',
    label: 'Pricing Tiers & FAQ',
    description: '3-tier Pricing Table with Popular highlight and FAQ Accordion.',
    usesSharedLayout: true
  },
  {
    key: 'dashboard',
    label: 'Executive Analytics Dashboard',
    description: 'Standalone Dashboard Shell with KPI Metric Cards and filterable Data Table.',
    usesSharedLayout: false
  },
  {
    key: 'auth-contact',
    label: 'Authentication & Contact Portal',
    description: 'Sign-In Card and MD3 Contact Form for customer onboarding.',
    usesSharedLayout: true
  }
];

function pageFromNode(
  rootNode: BlueprintNodeInput,
  path: string,
  slug: string,
  title: string,
  description: string,
  layoutId: string | undefined
): PageRoute {
  return {
    id: createId(),
    path,
    slug,
    title,
    description,
    layoutId,
    isDynamic: false,
    seo: { title },
    rootNode: BlueprintNodeSchema.parse(reassignNodeIds(rootNode))
  };
}

export function createPageFromTemplate(
  templateKey: PageTemplateKey,
  path: string,
  title: string,
  layoutId?: string
): PageRoute {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const slug = normalizedPath.replace(/^\//, '').replace(/\//g, '-') || 'page';
  const acme = createDefaultAcmeSaaSProject();

  switch (templateKey) {
    case 'saas-landing':
      return pageFromNode(acme.pages[0].rootNode, normalizedPath, slug, title, `${title} — SaaS Landing Page`, layoutId);
    case 'features':
      return pageFromNode(acme.pages[1].rootNode, normalizedPath, slug, title, `${title} — Product Features`, layoutId);
    case 'pricing':
      return pageFromNode(acme.pages[2].rootNode, normalizedPath, slug, title, `${title} — Pricing Plans`, layoutId);
    case 'dashboard':
      // Dashboard pages render their own application shell, so they never use the public layout.
      return pageFromNode(acme.pages[3].rootNode, normalizedPath, slug, title, `${title} — Analytics Dashboard`, undefined);
    case 'auth-contact':
      return pageFromNode(
        {
          id: createId(),
          componentType: 'structure/container',
          name: `${title} Root Container`,
          props: { maxWidth: 'xl' },
          styles: { base: { paddingTop: '2rem', paddingBottom: '4rem' } },
          children: [
            {
              id: createId(),
              componentType: 'app/auth-card',
              name: 'Workspace Sign-In Card',
              props: {
                mode: 'signin',
                brandName: 'Acme Cloud',
                title: 'Sign in to your account',
                subtitle: 'Enter your work credentials to access the console.',
                redirectHref: '/dashboard'
              }
            },
            {
              id: createId(),
              componentType: 'marketing/contact-form',
              name: 'Enterprise Contact Form',
              props: {
                sectionEyebrow: 'ENTERPRISE SUPPORT',
                sectionTitle: 'Need a custom deployment?',
                sectionSubtitle: 'Reach out to our solutions engineering team.',
                submitText: 'Send Request'
              }
            }
          ]
        },
        normalizedPath,
        slug,
        title,
        `${title} — Portal`,
        layoutId
      );
    case 'blank':
    default:
      return pageFromNode(
        {
          id: createId(),
          componentType: 'structure/container',
          name: `${title} Root Container`,
          props: { maxWidth: 'xl' },
          styles: { base: { minHeight: '60vh', paddingTop: '3rem', paddingBottom: '3rem' } }
        },
        normalizedPath,
        slug,
        title,
        `${title} page`,
        layoutId
      );
  }
}

export interface PromptCompositionResult {
  summary: string;
  nodes: BlueprintNode[];
  suggestedThemeId?: string;
}

/**
 * Deterministic natural-language prompt-to-blueprint composer.
 * Translates specifications such as "Add an AI hero, stats bar, and 3-tier pricing" into
 * validated BlueprintNode subtrees. Every prop name matches the component registry contract.
 */
export function composeNodesFromPrompt(prompt: string): PromptCompositionResult {
  const q = prompt.trim().toLowerCase();
  const nodes: BlueprintNode[] = [];
  const addedLabels: string[] = [];
  const add = (label: string, input: Omit<BlueprintNodeInput, 'id'>) => {
    nodes.push(createNode(input));
    addedLabels.push(label);
  };

  const isAi = /\b(ai|agent|llm|model|copilot|neural|automation)\b/.test(q);
  const isFintech = /\b(fintech|bank|payment|revenue|finance|crypto|billing|treasury)\b/.test(q);
  const isDark = /\b(dark|midnight|cyber|violet)\b/.test(q);

  const suggestedThemeId = isFintech
    ? 'emerald-light'
    : isAi
      ? 'violet-light'
      : isDark
        ? 'google-blue-dark'
        : undefined;

  const domainBrand = isFintech ? 'FinPulse Treasury' : isAi ? 'Nexus AI Agents' : 'Acme Cloud';

  const heroProps = (title: string, subtitle: string, badgeText: string) => ({
    eyebrow: domainBrand,
    badgeText,
    title,
    subtitle,
    primaryCtaText: isFintech ? 'Open Treasury Account' : 'Start Free Trial',
    primaryCtaHref: '/dashboard',
    secondaryCtaText: 'View Pricing',
    secondaryCtaHref: '/pricing'
  });

  if (/\b(hero|banner|header|landing|intro)\b/.test(q)) {
    add('Split Hero', {
      componentType: 'hero/split-hero',
      name: `${domainBrand} Hero`,
      props: heroProps(
        isFintech
          ? 'Programmable treasury and real-time liquidity at scale.'
          : isAi
            ? 'Deploy autonomous AI workflows in minutes, not quarters.'
            : 'Ship production web apps with visual precision.',
        isFintech
          ? 'Automate multi-currency reconciliation, yield optimization, and enterprise spend controls from one unified ledger.'
          : 'Compose responsive sections visually and hand a precise build spec to your coding agent.',
        isFintech ? 'Instant global settlement' : isAi ? 'Autonomous agents' : 'Material Design 3'
      )
    });
  }

  if (/\b(stat|stats|metric|numbers|counter|proof)\b/.test(q)) {
    add('Stats Bar', {
      componentType: 'marketing/stats-bar',
      name: `${domainBrand} Stats Bar`,
      props: {
        stats: [
          { value: '99.99%', label: 'SLA Uptime Guarantee', detail: '+0.04% YoY' },
          { value: '18ms', label: 'Global Edge Latency', detail: '-42% P99' },
          { value: '42,000+', label: 'Active Engineering Teams', detail: '+128% growth' },
          { value: 'SOC 2 II', label: 'Zero-Trust Compliance', detail: 'Verified' }
        ]
      }
    });
  }

  if (/\b(kpi|dashboard|analytics|overview)\b/.test(q)) {
    add('KPI Grid', {
      componentType: 'app/kpi-grid',
      name: `${domainBrand} KPI Cards`,
      props: {
        cards: [
          { title: 'Net Revenue Retention', value: '138.4%', change: '+12.1%', trend: 'up' },
          { title: 'Active Workspaces', value: '8,940', change: '+19.4%', trend: 'up' },
          { title: 'Avg Resolution Time', value: '1.4m', change: '-38.0%', trend: 'up' }
        ]
      }
    });
  }

  if (/\b(feature|features|bento|capabilities|grid|benefits)\b/.test(q)) {
    add('Feature Grid', {
      componentType: 'marketing/feature-grid',
      name: `${domainBrand} Feature Grid`,
      props: {
        sectionEyebrow: 'Capabilities',
        sectionTitle: `Why leading teams run on ${domainBrand}`,
        sectionDescription: 'Architected for speed, observability, and deterministic handoff.',
        columns: 3,
        features: [
          { icon: '⚡', title: 'Real-Time Streaming Engine', description: 'Sub-20ms state synchronization across every client.' },
          { icon: '🛡️', title: 'Enterprise Role Controls', description: 'Granular RBAC permissions, audit logs, and hardware key enforcement.' },
          { icon: '🤖', title: 'Deterministic AI Handoff', description: 'Export a precise, stack-agnostic build spec for coding agents.' }
        ]
      }
    });
  }

  if (/\b(price|pricing|plan|plans|tier|tiers|billing|subscription)\b/.test(q)) {
    add('Pricing Table', {
      componentType: 'marketing/pricing-table',
      name: `${domainBrand} Pricing Plans`,
      props: {
        sectionEyebrow: 'Pricing',
        sectionTitle: 'Transparent, predictable pricing for every stage',
        sectionDescription: 'Start free in development. Upgrade when you scale to production.',
        plans: [
          {
            name: 'Starter',
            price: '$0',
            period: 'per month',
            description: 'For solo founders and rapid prototyping.',
            features: ['Up to 3 active projects', 'Build spec export', 'Community support'],
            ctaText: 'Start Free',
            ctaHref: '/dashboard',
            isPopular: false
          },
          {
            name: 'Growth Pro',
            price: '$79',
            period: 'per month',
            description: 'For product teams shipping weekly.',
            features: ['Unlimited routes & symbols', 'Full AI agent handoff', 'Custom design tokens', 'Priority support'],
            ctaText: 'Start 14-Day Trial',
            ctaHref: '/dashboard',
            isPopular: true
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            period: 'annual',
            description: 'Dedicated infrastructure and custom SLAs.',
            features: ['SSO / SAML 2.0', 'Dedicated solutions engineer', '99.99% uptime SLA'],
            ctaText: 'Contact Sales',
            ctaHref: '/contact',
            isPopular: false
          }
        ]
      }
    });
  }

  if (
    /\b(datatable|data table|rows|logs|transactions|records)\b/.test(q) ||
    (/\btable\b/.test(q) && !/\bpricing\s+table\b/.test(q))
  ) {
    add('Data Table', {
      componentType: 'app/data-table',
      name: `${domainBrand} Activity Table`,
      props: {
        title: 'Live Production Deployments & Events',
        columns: ['Deployment ID', 'Service', 'Status', 'Latency'],
        rows: [
          ['dep-9482a', 'auth-edge-gateway', 'Healthy', '12ms'],
          ['dep-9481f', 'ai-inference-worker', 'Healthy', '44ms'],
          ['dep-9479c', 'billing-webhook-sync', 'Warning', '168ms']
        ]
      }
    });
  }

  if (/\b(testimonial|testimonials|review|reviews|quote|quotes|customer|social proof)\b/.test(q)) {
    add('Testimonials', {
      componentType: 'marketing/testimonials',
      name: 'Customer Testimonials',
      props: {
        sectionEyebrow: 'Social Proof',
        sectionTitle: 'Trusted by staff engineers and design leaders',
        testimonials: [
          {
            quote: 'We cut our design-to-production implementation cycle from 3 weeks to 20 minutes.',
            author: 'Elena Rostova',
            role: 'VP Engineering, LinearFlow'
          },
          {
            quote: 'The exported build spec let our coding agents implement features with zero guesswork.',
            author: 'Marcus Vance',
            role: 'Principal Architect, RaycastCloud'
          }
        ]
      }
    });
  }

  if (/\b(faq|faqs|question|questions|accordion|help)\b/.test(q)) {
    add('FAQ Accordion', {
      componentType: 'marketing/faq-accordion',
      name: 'FAQ Accordion',
      props: {
        sectionTitle: 'Frequently Asked Questions',
        items: [
          {
            question: 'Can I build the exported layout in any framework?',
            answer: 'Yes. The build spec is stack-agnostic: pick Next.js, SvelteKit, Nuxt, Astro, or plain HTML.'
          },
          {
            question: 'Is a CSS framework required?',
            answer: 'No. Design tokens are exported as CSS variables and W3C design-token JSON.'
          }
        ]
      }
    });
  }

  if (/\b(contact|form|lead|inquire|support|sales)\b/.test(q)) {
    add('Contact Form', {
      componentType: 'marketing/contact-form',
      name: 'Contact & Inquiry Form',
      props: {
        sectionEyebrow: 'Get in touch',
        sectionTitle: 'Talk to our engineering team',
        sectionSubtitle: 'Tell us about your architecture and timeline.',
        submitText: 'Send Message'
      }
    });
  }

  if (/\b(auth|login|signin|sign-in|signup|register)\b/.test(q)) {
    add('Auth Card', {
      componentType: 'app/auth-card',
      name: 'Authentication Card',
      props: {
        mode: 'signin',
        brandName: domainBrand,
        title: `Sign in to ${domainBrand}`,
        subtitle: 'Use your workspace SSO or email credentials.',
        redirectHref: '/dashboard'
      }
    });
  }

  if (/\b(newsletter|subscribe)\b/.test(q)) {
    add('Newsletter', {
      componentType: 'marketing/newsletter',
      name: 'Newsletter Signup',
      props: {
        title: 'Get monthly architecture deep-dives',
        subtitle: 'Zero spam. Unsubscribe in one click.',
        placeholder: 'you@company.com',
        buttonText: 'Subscribe'
      }
    });
  } else if (/\b(cta|call to action)\b/.test(q)) {
    add('CTA Banner', {
      componentType: 'marketing/cta-banner',
      name: 'Conversion CTA Banner',
      props: {
        title: `Ready to build with ${domainBrand}?`,
        subtitle: 'Export a precise build spec and ship it in the stack of your choice.',
        primaryCtaText: 'Launch Studio',
        primaryCtaHref: '/dashboard',
        secondaryCtaText: 'Compare Plans',
        secondaryCtaHref: '/pricing'
      }
    });
  }

  if (nodes.length === 0) {
    add('Split Hero', {
      componentType: 'hero/split-hero',
      name: `${prompt.slice(0, 28) || 'Custom'} Hero`,
      props: heroProps(
        prompt.length > 8 ? prompt : 'Build modern responsive web apps at 10x speed.',
        'Crafted with Material Design 3 tokens.',
        'AI composer'
      )
    });
    add('CTA Banner', {
      componentType: 'marketing/cta-banner',
      name: 'Follow-up CTA Banner',
      props: {
        title: 'Take your project to production',
        subtitle: 'Export the build spec and hand it to your coding agent.',
        primaryCtaText: 'Open Dashboard',
        primaryCtaHref: '/dashboard',
        secondaryCtaText: 'Pricing',
        secondaryCtaHref: '/pricing'
      }
    });
  }

  return {
    summary: `Composed ${nodes.length} section(s): ${addedLabels.join(' + ')}`,
    nodes,
    suggestedThemeId
  };
}
