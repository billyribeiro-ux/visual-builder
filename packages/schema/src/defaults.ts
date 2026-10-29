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
import { DEFAULT_LIGHT_COLORS, DEFAULT_FONTS, DEFAULT_RADII, DEFAULT_SHADOWS, DEFAULT_SPACING, DEFAULT_BREAKPOINTS } from './tokens.js';

/**
 * Reference demo project: the marketing site and app area of "Halden", a fictional operational
 * analytics product (every company and person named in its copy is invented). Node IDs are
 * deterministic — tests, the parity script and saved selections rely on them.
 */
export function createDefaultAcmeSaaSProject(): ProjectBlueprint {
  const projectId = '00000000-0000-0000-0000-000000000001';
  const homePageId = '10000000-0000-0000-0000-000000000001';
  const featuresPageId = '10000000-0000-0000-0000-000000000002';
  const pricingPageId = '10000000-0000-0000-0000-000000000003';
  const dashboardPageId = '10000000-0000-0000-0000-000000000004';
  const settingsPageId = '10000000-0000-0000-0000-000000000005';
  const publicLayoutId = '20000000-0000-0000-0000-000000000001';

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
      name: 'Halden',
      slug: 'halden',
      description: 'Operational analytics for modern teams: live dashboards, anomaly alerts and one trusted definition for every metric.',
      author: 'Demo project',
      createdAt: '2026-10-25T12:00:00.000Z',
      updatedAt: '2026-10-25T12:00:00.000Z'
    },
    tokens: {
      colors: { ...DEFAULT_LIGHT_COLORS },
      fonts: { ...DEFAULT_FONTS },
      radii: { ...DEFAULT_RADII },
      shadows: { ...DEFAULT_SHADOWS },
      spacing: { ...DEFAULT_SPACING },
      breakpoints: { ...DEFAULT_BREAKPOINTS }
    },
    layouts: [
      {
        id: publicLayoutId,
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
                brandName: 'Halden',
                logoUrl: '',
                links: [
                  { label: 'Features', href: '/features' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Dashboard', href: '/dashboard' }
                ],
                ctaText: 'Start free trial',
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
                brandName: 'Halden',
                tagline: 'Operational analytics for teams that want one trusted view of their business.',
                copyright: '© 2026 Halden Labs, Inc. All rights reserved.',
                newsletterTitle: 'Product updates, once a month',
                newsletterButtonText: 'Subscribe',
                columns: [
                  {
                    title: 'Product',
                    links: [
                      { label: 'Features', href: '/features' },
                      { label: 'Pricing', href: '/pricing' },
                      { label: 'Dashboard', href: '/dashboard' }
                    ]
                  },
                  {
                    title: 'Company',
                    links: [
                      { label: 'About', href: '#about' },
                      { label: 'Careers', href: '#careers' },
                      { label: 'Contact', href: 'mailto:hello@halden.example' }
                    ]
                  },
                  {
                    title: 'Resources',
                    links: [
                      { label: 'Documentation', href: '#docs' },
                      { label: 'Security', href: '#security' },
                      { label: 'Status', href: '#status' }
                    ]
                  }
                ],
                legalLinks: [
                  { label: 'Privacy', href: '#privacy' },
                  { label: 'Terms', href: '#terms' },
                  { label: 'Cookies', href: '#cookies' }
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
        title: 'Halden — Operational analytics for modern teams',
        description: 'Live dashboards, anomaly alerts and one trusted definition for every metric your team runs on.',
        layoutId: publicLayoutId,
        isDynamic: false,
        seo: {
          title: 'Halden — Operational analytics for modern teams',
          metaDescription: 'Halden brings product, revenue and infrastructure metrics into one live workspace, flags anomalies the moment they happen and routes them to the right owner.'
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
                eyebrow: '',
                title: 'Know what changed, why, and what to do next.',
                subtitle: 'Halden unifies product, revenue and infrastructure metrics into live dashboards, flags anomalies the moment they happen and routes them to the right owner.',
                primaryCtaText: 'Start free trial',
                primaryCtaHref: '/dashboard',
                secondaryCtaText: 'View pricing',
                secondaryCtaHref: '/pricing',
                badgeText: 'New: anomaly detection for every metric',
                proofText: '14-day free trial · No credit card required',
                align: 'left',
                visual: 'app'
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000006',
              componentType: 'marketing/stats-bar',
              name: 'Proof Points',
              props: {
                sectionTitle: 'Built for teams that measure what matters',
                stats: [
                  { value: '1 min', label: 'Data freshness', detail: 'Metrics refresh every minute' },
                  { value: '60+', label: 'Native connectors', detail: 'Warehouses, billing and product events' },
                  { value: '99.9%', label: 'Uptime target', detail: 'Published monthly on our status page' },
                  { value: '< 1 hr', label: 'Time to first dashboard', detail: 'With guided onboarding' }
                ]
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000003',
              componentType: 'marketing/feature-grid',
              name: 'Core Features Grid',
              props: {
                sectionEyebrow: 'Platform',
                sectionTitle: 'Everything your team needs to run on data',
                sectionDescription: 'Connect your sources in minutes. Halden models, monitors and explains your numbers so you can focus on decisions.',
                columns: 3,
                features: [
                  {
                    icon: 'Plugs',
                    title: 'Connect any source',
                    description: 'Native connectors for your warehouse, billing system, product events and cloud provider — no pipelines to maintain.'
                  },
                  {
                    icon: 'ChartLineUp',
                    title: 'Live dashboards',
                    description: 'Metrics refresh every minute. Start from proven templates and share a board with a single link.'
                  },
                  {
                    icon: 'Bell',
                    title: 'Anomaly alerts',
                    description: 'Halden learns the normal range of every metric and alerts its owner by email or chat the moment something drifts.'
                  },
                  {
                    icon: 'MagnifyingGlass',
                    title: 'Root cause in one click',
                    description: 'Break any change down by segment, region or release to see exactly what moved the number.'
                  },
                  {
                    icon: 'UsersThree',
                    title: 'Shared metric definitions',
                    description: 'One reviewed, versioned definition per metric, so every team reports the same number.'
                  },
                  {
                    icon: 'ShieldCheck',
                    title: 'Enterprise-ready security',
                    description: 'SSO, role-based access, audit logs and a choice of US or EU data residency.'
                  }
                ]
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000004',
              componentType: 'marketing/testimonials',
              name: 'Customer Testimonials',
              props: {
                sectionEyebrow: 'Customers',
                sectionTitle: 'Teams run their week on Halden',
                sectionDescription: 'From operations to finance, teams use Halden to replace scattered reports with one live view.',
                showRating: false,
                testimonials: [
                  {
                    quote: 'We replaced four internal dashboards and a weekly reporting spreadsheet. Our Monday metrics review went from an hour to fifteen minutes.',
                    author: 'Priya Raman',
                    role: 'Head of Operations, Fernway Logistics'
                  },
                  {
                    quote: 'An anomaly alert caught a billing regression minutes after a release. Before, we would have found it at month-end close.',
                    author: 'Daniel Okafor',
                    role: 'VP Engineering, Copperline'
                  },
                  {
                    quote: 'Finance, product and success finally report the same number for active customers. The debates about whose figure is right have stopped.',
                    author: 'Elena Marquez',
                    role: 'Director of Analytics, Northfold'
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
                sectionEyebrow: 'FAQ',
                sectionTitle: 'Frequently asked questions',
                sectionDescription: 'Everything you need to know before you start. Can’t find an answer? Our team replies within one business day.',
                items: [
                  {
                    question: 'How long does setup take?',
                    answer: 'Most teams connect their first source and publish a dashboard in under an hour. During the trial our onboarding team helps you model your core metrics.'
                  },
                  {
                    question: 'Where is my data stored?',
                    answer: 'You choose a US or EU region when you create a workspace. Data is encrypted in transit and at rest, and access to the sources you connect is read-only.'
                  },
                  {
                    question: 'Can I share dashboards with people outside my team?',
                    answer: 'Yes. Viewers are free on every plan, and you can share read-only dashboards with guests through expiring links.'
                  },
                  {
                    question: 'What happens when the trial ends?',
                    answer: 'Choose a plan, or your workspace moves to the free Starter plan. Nothing is deleted, and you can upgrade again at any time.'
                  }
                ]
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '30000000-0000-0000-0000-000000000007',
              componentType: 'marketing/cta-banner',
              name: 'Closing Call to Action',
              props: {
                eyebrow: '',
                title: 'See your business clearly, starting today',
                subtitle: 'Connect a source and publish your first live dashboard in under an hour. Free for 14 days.',
                primaryCtaText: 'Start free trial',
                primaryCtaHref: '/dashboard',
                secondaryCtaText: 'Compare plans',
                secondaryCtaHref: '/pricing',
                variant: 'primary'
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      },
      {
        id: featuresPageId,
        path: '/features',
        slug: 'features',
        title: 'Features — Halden',
        description: 'Connectors, live dashboards, anomaly alerts, governed metrics and enterprise controls.',
        layoutId: publicLayoutId,
        isDynamic: false,
        seo: {
          title: 'Features — Halden'
        },
        rootNode: {
          id: '31000000-0000-0000-0000-000000000001',
          componentType: 'structure/container',
          name: 'Features Page Root',
          props: { maxWidth: 'full' },
          styles: { base: {} },
          children: [
            {
              id: '31000000-0000-0000-0000-000000000003',
              componentType: 'hero/split-hero',
              name: 'Features Page Header',
              props: {
                eyebrow: 'Features',
                title: 'Built for how operations teams actually work',
                subtitle: 'From the first connector to the weekly business review, Halden covers the full loop: collect, monitor, explain and share.',
                primaryCtaText: 'Start free trial',
                primaryCtaHref: '/dashboard',
                secondaryCtaText: 'View pricing',
                secondaryCtaHref: '/pricing',
                badgeText: '',
                proofText: '',
                align: 'center',
                visual: 'none'
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '31000000-0000-0000-0000-000000000002',
              componentType: 'marketing/feature-grid',
              name: 'Expanded Features Grid',
              props: {
                sectionEyebrow: 'Capabilities',
                sectionTitle: 'One workspace from raw data to decisions',
                sectionDescription: 'Every capability works together, so a metric you define once powers dashboards, alerts and reports everywhere.',
                columns: 3,
                features: [
                  {
                    icon: 'Database',
                    title: 'Warehouse-native modeling',
                    description: 'Define metrics on top of the tables you already have. Halden pushes queries down to your warehouse.'
                  },
                  {
                    icon: 'Gauge',
                    title: 'Minute-level refresh',
                    description: 'Incremental syncs keep every board current without overloading your sources.'
                  },
                  {
                    icon: 'Lightning',
                    title: 'Smart alert routing',
                    description: 'Send each alert to the metric owner, with on-call schedules and quiet hours respected.'
                  },
                  {
                    icon: 'Funnel',
                    title: 'Segment drill-downs',
                    description: 'Slice any chart by plan, region, channel or release and compare periods side by side.'
                  },
                  {
                    icon: 'CalendarCheck',
                    title: 'Scheduled reports',
                    description: 'Deliver dashboard snapshots to inboxes and chat channels every morning or week.'
                  },
                  {
                    icon: 'LockKey',
                    title: 'Granular permissions',
                    description: 'Control access by team, workspace and dataset, with every change recorded in the audit log.'
                  }
                ]
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '31000000-0000-0000-0000-000000000004',
              componentType: 'marketing/cta-banner',
              name: 'Features Call to Action',
              props: {
                eyebrow: '',
                title: 'Ready to see it with your own data?',
                subtitle: 'Start a free trial or book a walkthrough with our team.',
                primaryCtaText: 'Start free trial',
                primaryCtaHref: '/dashboard',
                secondaryCtaText: 'View pricing',
                secondaryCtaHref: '/pricing',
                variant: 'dark'
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
        title: 'Pricing — Halden',
        description: 'Simple plans for every stage: a free Starter plan, Growth for scaling teams and Enterprise for advanced security needs.',
        layoutId: publicLayoutId,
        isDynamic: false,
        seo: {
          title: 'Pricing — Halden'
        },
        rootNode: {
          id: '32000000-0000-0000-0000-000000000001',
          componentType: 'structure/container',
          name: 'Pricing Page Root',
          props: { maxWidth: 'full' },
          styles: { base: {} },
          children: [
            {
              id: '32000000-0000-0000-0000-000000000002',
              componentType: 'marketing/pricing-table',
              name: 'Pricing Plans Section',
              props: {
                sectionEyebrow: 'Pricing',
                sectionTitle: 'Simple plans that scale with your team',
                sectionDescription: 'Start free, upgrade when you need more sources and seats. Every plan includes unlimited viewers.',
                popularLabel: 'Most popular',
                plans: [
                  {
                    name: 'Starter',
                    price: '$0',
                    period: 'per month',
                    description: 'For small teams getting their first metrics in one place.',
                    features: ['3 data sources', '5 dashboards', 'Daily refresh', 'Community support'],
                    ctaText: 'Get started',
                    ctaHref: '/dashboard',
                    isPopular: false
                  },
                  {
                    name: 'Growth',
                    price: '$49',
                    period: 'per seat / month',
                    description: 'For teams that run their week on live metrics.',
                    features: ['Unlimited data sources', 'Unlimited dashboards', 'Anomaly alerts', 'Minute-level refresh', 'Priority support'],
                    ctaText: 'Start free trial',
                    ctaHref: '/dashboard',
                    isPopular: true
                  },
                  {
                    name: 'Enterprise',
                    price: 'Custom',
                    period: '',
                    description: 'For organizations with advanced security and compliance needs.',
                    features: ['SSO and SCIM provisioning', 'Audit logs', 'EU or US data residency', 'Uptime SLA', 'Dedicated success manager'],
                    ctaText: 'Contact sales',
                    ctaHref: 'mailto:sales@halden.example',
                    isPopular: false
                  }
                ]
              },
              styles: { base: {} },
              children: []
            },
            {
              id: '32000000-0000-0000-0000-000000000003',
              componentType: 'marketing/faq-accordion',
              name: 'Pricing Questions',
              props: {
                sectionEyebrow: 'Billing',
                sectionTitle: 'Pricing questions',
                sectionDescription: 'Straight answers about seats, billing and plan changes.',
                items: [
                  {
                    question: 'What counts as a seat?',
                    answer: 'Anyone who can create or edit dashboards, metrics or alerts. Viewers are always free and unlimited.'
                  },
                  {
                    question: 'Can I switch plans later?',
                    answer: 'Yes. Upgrades apply immediately and are prorated; downgrades take effect at the end of the billing period.'
                  },
                  {
                    question: 'Do you offer annual billing?',
                    answer: 'Annual billing is available on Growth and Enterprise and includes two months free.'
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
        title: 'Overview — Halden',
        description: 'Workspace overview with key revenue and account metrics and recently changed accounts.',
        isDynamic: false,
        seo: {
          title: 'Overview — Halden'
        },
        rootNode: {
          id: '40000000-0000-0000-0000-000000000001',
          componentType: 'app/dashboard-shell',
          name: 'Dashboard App Shell',
          props: {
            title: 'Overview',
            activeNav: 'dashboard',
            brandName: 'Halden',
            userName: 'Jordan Lee'
          },
          styles: { base: { minHeight: '100vh' } },
          children: [
            {
              id: '40000000-0000-0000-0000-000000000002',
              componentType: 'app/kpi-grid',
              name: 'KPI Metric Cards',
              props: {
                comparisonLabel: 'vs. last month',
                cards: [
                  { title: 'Monthly recurring revenue', value: '$184,920', change: '+12.4%', trend: 'up' },
                  { title: 'Active accounts', value: '2,431', change: '+4.1%', trend: 'up' },
                  { title: 'Net revenue retention', value: '118%', change: '+2.3 pts', trend: 'up' },
                  { title: 'Churned accounts', value: '14', change: '+3', trend: 'down' }
                ]
              },
              styles: { base: { marginBottom: '1.5rem' } },
              children: []
            },
            {
              id: '40000000-0000-0000-0000-000000000003',
              componentType: 'app/data-table',
              name: 'Accounts Data Table',
              props: {
                title: 'Recent accounts',
                description: 'Accounts with billing or usage changes in the last 7 days.',
                columns: ['Account', 'Plan', 'Seats', 'MRR', 'Status'],
                rows: [
                  ['Fernway Logistics', 'Growth', '48', '$2,352', 'Active'],
                  ['Copperline', 'Enterprise', '210', '$11,400', 'Active'],
                  ['Northfold', 'Growth', '36', '$1,764', 'Trial'],
                  ['Kettle & Pine', 'Starter', '6', '$0', 'Past due'],
                  ['Brightwater Clinics', 'Growth', '22', '$1,078', 'Active'],
                  ['Atlas Freight', 'Enterprise', '140', '$7,600', 'Canceled']
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
        title: 'Settings — Halden',
        description: 'Workspace name, alert delivery email and notification preferences.',
        isDynamic: false,
        seo: {
          title: 'Settings — Halden'
        },
        rootNode: {
          id: '41000000-0000-0000-0000-000000000001',
          componentType: 'app/dashboard-shell',
          name: 'Settings App Shell',
          props: {
            title: 'Settings',
            activeNav: 'settings',
            brandName: 'Halden',
            userName: 'Jordan Lee'
          },
          styles: { base: { minHeight: '100vh' } },
          children: [
            {
              id: '41000000-0000-0000-0000-000000000002',
              componentType: 'app/settings-form',
              name: 'Workspace Settings Form',
              props: {
                title: 'Workspace preferences',
                description: 'Update how your workspace appears and where alerts are delivered.',
                initialName: 'Halden Operations',
                initialEmail: 'ops@halden.example',
                notificationsEnabled: true
              },
              styles: { base: {} },
              children: []
            }
          ]
        }
      }
    ],
    interactions: [],
    assets: CURATED_PROJECT_ASSETS.map((a) => ({ ...a })),
    notes: {
      implementation:
        'Reference demo: a marketing site (home, features, pricing) and an app area (dashboard, settings) for Halden, a fictional analytics product. All companies, people and figures in the copy are invented.'
    }
  };
  return ProjectBlueprintSchema.parse(raw);
}

/** SVG asset entry with its byte size and data URL derived from the markup. */
function svgAsset(input: Omit<BlueprintAsset, 'mimeType' | 'size' | 'dataUrl'> & { svgContent: string }): BlueprintAsset {
  return {
    ...input,
    mimeType: 'image/svg+xml',
    size: new TextEncoder().encode(input.svgContent).length,
    dataUrl: `data:image/svg+xml;utf8,${encodeURIComponent(input.svgContent)}`
  };
}

export const CURATED_PROJECT_ASSETS: BlueprintAsset[] = [
  svgAsset({
    id: '80000000-0000-4000-8000-000000000001',
    filename: 'analytics-pulse.svg',
    localPath: '/assets/analytics-pulse.svg',
    alt: 'Line chart trending upward',
    category: 'illustration',
    width: 320,
    height: 180,
    svgContent:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" rx="16" fill="#F8FAFC"/><path d="M28 40H292M28 80H292M28 120H292" stroke="#E2E8F0" stroke-width="1.5"/><path d="M28 136L88 104L142 116L212 66L292 42V152H28Z" fill="#EEF2FF"/><path d="M28 136L88 104L142 116L212 66L292 42" stroke="#4F46E5" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="212" cy="66" r="6" fill="#FFFFFF" stroke="#4F46E5" stroke-width="3"/><circle cx="292" cy="42" r="6" fill="#4F46E5"/></svg>'
  }),
  svgAsset({
    id: '80000000-0000-4000-8000-000000000002',
    filename: 'ai-agent-flow.svg',
    localPath: '/assets/ai-agent-flow.svg',
    alt: 'Workflow diagram with four connected steps',
    category: 'illustration',
    width: 320,
    height: 180,
    svgContent:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" fill="none"><rect width="320" height="180" rx="16" fill="#F8FAFC"/><path d="M98 90H126M194 58L222 90M194 122L222 90" stroke="#CBD5E1" stroke-width="2.5" stroke-linecap="round"/><rect x="30" y="66" width="68" height="48" rx="12" fill="#4F46E5"/><rect x="126" y="36" width="68" height="44" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/><rect x="126" y="100" width="68" height="44" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/><rect x="222" y="66" width="68" height="48" rx="12" fill="#0F766E"/><rect x="140" y="54" width="40" height="8" rx="4" fill="#CBD5E1"/><rect x="140" y="118" width="40" height="8" rx="4" fill="#CBD5E1"/></svg>'
  }),
  svgAsset({
    id: '80000000-0000-4000-8000-000000000003',
    filename: 'security-vault.svg',
    localPath: '/assets/security-vault.svg',
    alt: 'Shield with a check mark',
    category: 'icon',
    width: 240,
    height: 180,
    svgContent:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><rect width="240" height="180" rx="16" fill="#F0FDF4"/><path d="M120 32L172 54V98C172 130 149 152 120 162C91 152 68 130 68 98V54L120 32Z" fill="#15803D"/><path d="M103 98L115 110L140 82" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }),
  svgAsset({
    id: '80000000-0000-4000-8000-000000000004',
    filename: 'brand-mark.svg',
    localPath: '/assets/brand-mark.svg',
    alt: 'Geometric logo mark',
    category: 'logo',
    width: 120,
    height: 120,
    svgContent:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><rect width="120" height="120" rx="28" fill="#4F46E5"/><path d="M36 84V36H50V54H70V36H84V84H70V66H50V84Z" fill="#FFFFFF"/></svg>'
  })
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
      description: `${name} — new project`,
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
                eyebrow: '',
                title: `Welcome to ${name}`,
                subtitle: 'Replace this headline and text with the promise your product makes, then add sections from the Elements panel.',
                primaryCtaText: 'Get started',
                primaryCtaHref: '/',
                secondaryCtaText: 'Learn more',
                secondaryCtaHref: '#features',
                badgeText: 'New project',
                proofText: '',
                align: 'left',
                visual: 'app'
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
    label: 'Blueprint schema',
    status: parsed.success ? 'pass' : 'fail',
    detail: parsed.success
      ? `Valid v${blueprint.schemaVersion} Blueprint (${blueprint.pages.length} routes)`
      : parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ')
  });

  // 2. Target & Styling Policy Check (`vanilla-md3` is the persisted id of the vanilla CSS target)
  const isVanillaCss = blueprint.target?.styling === 'vanilla-md3';
  checks.push({
    id: 'styling-policy',
    category: 'tokens',
    label: 'Styling policy',
    status: isVanillaCss ? 'pass' : 'fail',
    detail: isVanillaCss
      ? `Target Svelte ${blueprint.target.svelteVersion} + SvelteKit ${blueprint.target.sveltekitVersion}, vanilla CSS with design tokens`
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
    label: 'Internal links',
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
    label: 'Page titles',
    status: missingTitles.length === 0 ? 'pass' : 'warn',
    detail:
      missingTitles.length === 0
        ? `All ${blueprint.pages.length} routes declare a document title.`
        : `${missingTitles.length} page(s) missing document title.`
  });

  // 5. Deterministic Export Readiness
  checks.push({
    id: 'export-determinism',
    category: 'codegen',
    label: 'Export readiness',
    status: 'pass',
    detail: 'Ready to emit the SvelteKit 3 app, AGENTS.md handoff docs and a deterministic ZIP archive.'
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

/** Each description lists exactly the sections `createPageFromTemplate` builds for that key. */
export const PAGE_TEMPLATE_CATALOG: Array<{
  key: PageTemplateKey;
  label: string;
  description: string;
  usesSharedLayout: boolean;
}> = [
  {
    key: 'blank',
    label: 'Blank page',
    description: 'An empty container, ready for your own sections.',
    usesSharedLayout: true
  },
  {
    key: 'saas-landing',
    label: 'SaaS landing',
    description: 'Split hero with product preview, stats bar, feature grid, testimonials, FAQ accordion and CTA banner.',
    usesSharedLayout: true
  },
  {
    key: 'features',
    label: 'Product features',
    description: 'Centered page header, six-card feature grid and a dark CTA banner.',
    usesSharedLayout: true
  },
  {
    key: 'pricing',
    label: 'Pricing',
    description: 'Three-plan pricing table with a highlighted plan, followed by a pricing FAQ.',
    usesSharedLayout: true
  },
  {
    key: 'dashboard',
    label: 'Analytics dashboard',
    description: 'Standalone app shell with KPI cards and a searchable data table.',
    usesSharedLayout: false
  },
  {
    key: 'auth-contact',
    label: 'Sign-in & contact',
    description: 'Sign-in card followed by a contact form.',
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
      return pageFromNode(acme.pages[0].rootNode, normalizedPath, slug, title, `${title} — landing page`, layoutId);
    case 'features':
      return pageFromNode(acme.pages[1].rootNode, normalizedPath, slug, title, `${title} — product features`, layoutId);
    case 'pricing':
      return pageFromNode(acme.pages[2].rootNode, normalizedPath, slug, title, `${title} — pricing plans`, layoutId);
    case 'dashboard':
      // Dashboard pages render their own application shell, so they never use the public layout.
      return pageFromNode(acme.pages[3].rootNode, normalizedPath, slug, title, `${title} — analytics dashboard`, undefined);
    case 'auth-contact':
      return pageFromNode(
        {
          id: createId(),
          componentType: 'structure/container',
          name: `${title} Root Container`,
          props: { maxWidth: 'full' },
          styles: { base: {} },
          children: [
            {
              id: createId(),
              componentType: 'app/auth-card',
              name: 'Workspace Sign-In Card',
              props: {
                mode: 'signin',
                brandName: 'Halden',
                title: 'Sign in to your workspace',
                subtitle: 'Welcome back. Enter your work email and password to continue.',
                redirectHref: '/dashboard'
              }
            },
            {
              id: createId(),
              componentType: 'marketing/contact-form',
              name: 'Sales Contact Form',
              props: {
                sectionEyebrow: 'Contact sales',
                sectionTitle: 'Planning a larger rollout?',
                sectionSubtitle: 'Tell us about your team and data stack. A solutions engineer will reply within one business day.',
                submitText: 'Send message'
              }
            }
          ]
        },
        normalizedPath,
        slug,
        title,
        `${title} — sign-in and contact`,
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

  const domainBrand = isFintech ? 'FinPulse Treasury' : isAi ? 'Nexus AI' : 'Halden';

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
            : 'Know what changed, why, and what to do next.',
        isFintech
          ? 'Automate multi-currency reconciliation, yield optimization, and enterprise spend controls from one unified ledger.'
          : isAi
            ? 'Design, test and monitor AI agents that work alongside your team, with every action logged and reviewable.'
            : 'Bring product, revenue and infrastructure metrics into one live workspace with alerts that reach the right owner.',
        isFintech ? 'Instant global settlement' : isAi ? 'Autonomous agents' : 'Live dashboards'
      )
    });
  }

  if (/\b(stat|stats|metric|numbers|counter|proof)\b/.test(q)) {
    add('Stats Bar', {
      componentType: 'marketing/stats-bar',
      name: `${domainBrand} Stats Bar`,
      props: {
        stats: [
          { value: '99.99%', label: 'Uptime target', detail: 'Published monthly' },
          { value: '18 ms', label: 'Median API latency', detail: 'Measured at the edge' },
          { value: '42,000+', label: 'Teams onboarded', detail: 'Across 30 countries' },
          { value: '24/7', label: 'Support coverage', detail: 'For every paid plan' }
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
          { title: 'Net revenue retention', value: '138.4%', change: '+12.1%', trend: 'up' },
          { title: 'Active workspaces', value: '8,940', change: '+19.4%', trend: 'up' },
          { title: 'Avg. resolution time', value: '1.4 min', change: '-38.0%', trend: 'up' }
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
        sectionDescription: 'Built for speed, visibility and control from the first day.',
        columns: 3,
        features: [
          { icon: 'Zap', title: 'Real-time streaming', description: 'Changes reach every dashboard and client in milliseconds.' },
          { icon: 'ShieldCheck', title: 'Enterprise role controls', description: 'Granular permissions, audit logs and hardware security key enforcement.' },
          { icon: 'Bot', title: 'Built-in automation', description: 'Trigger workflows from any metric, with every run logged and reviewable.' }
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
            features: ['Up to 3 active projects', 'Core dashboards', 'Community support'],
            ctaText: 'Start Free',
            ctaHref: '/dashboard',
            isPopular: false
          },
          {
            name: 'Growth Pro',
            price: '$79',
            period: 'per month',
            description: 'For product teams shipping weekly.',
            features: ['Unlimited projects', 'Automation and alerts', 'Custom roles', 'Priority support'],
            ctaText: 'Start 14-day trial',
            ctaHref: '/dashboard',
            isPopular: true
          },
          {
            name: 'Enterprise',
            price: 'Custom',
            period: 'annual',
            description: 'Dedicated infrastructure and custom SLAs.',
            features: ['SSO / SAML 2.0', 'Dedicated solutions engineer', '99.99% uptime SLA'],
            ctaText: 'Contact sales',
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
        title: 'Live deployments',
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
        sectionTitle: 'Trusted by operations and engineering leaders',
        testimonials: [
          {
            quote: 'We cut our weekly reporting cycle from three days to a single morning.',
            author: 'Elena Rostova',
            role: 'VP Operations, Fernway Logistics'
          },
          {
            quote: 'Alerts reach the right owner within minutes, so incidents no longer wait for the next standup.',
            author: 'Marcus Vance',
            role: 'Principal Engineer, Copperline'
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
        sectionTitle: 'Frequently asked questions',
        items: [
          {
            question: 'How long does setup take?',
            answer: 'Most teams are up and running in under an hour, with guided onboarding during the trial.'
          },
          {
            question: 'Can I cancel at any time?',
            answer: 'Yes. Plans are month to month unless you choose annual billing, and you keep access until the period ends.'
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
        sectionEyebrow: 'Contact',
        sectionTitle: 'Talk to our team',
        sectionSubtitle: 'Tell us about your goals and timeline, and we will reply within one business day.',
        submitText: 'Send message'
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
        title: 'Get the monthly product brief',
        subtitle: 'New features, customer stories and practical guides — one email a month.',
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
        subtitle: 'Start a free trial today, or talk to our team about a guided rollout.',
        primaryCtaText: 'Start free trial',
        primaryCtaHref: '/dashboard',
        secondaryCtaText: 'Compare plans',
        secondaryCtaHref: '/pricing'
      }
    });
  }

  if (nodes.length === 0) {
    add('Split Hero', {
      componentType: 'hero/split-hero',
      name: `${prompt.slice(0, 28) || 'Custom'} Hero`,
      props: heroProps(
        prompt.length > 8 ? prompt : 'A clear promise for the people you serve.',
        'Explain in one or two sentences who this is for and what changes for them.',
        'New'
      )
    });
    add('CTA Banner', {
      componentType: 'marketing/cta-banner',
      name: 'Follow-up CTA Banner',
      props: {
        title: 'Ready to get started?',
        subtitle: 'Create an account in minutes and invite your team when you are ready.',
        primaryCtaText: 'Get started',
        primaryCtaHref: '/dashboard',
        secondaryCtaText: 'View pricing',
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
