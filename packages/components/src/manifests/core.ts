import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';
import { cssValue, isRecord, alias, MAX_WIDTHS, DIRECTIONS, JUSTIFY, ALIGN, TEXT_ALIGN, linkSchema } from './shared.js';

/** Trailing icons offered on buttons. */
export const BUTTON_ICONS = ['ArrowRight', 'ArrowUpRight', 'CaretRight', 'ArrowSquareOut', 'Plus', 'Check', 'DownloadSimple', 'PlayCircle', 'Sparkle'] as const;
/** Icons offered in the card icon tile. */
export const CARD_ICONS = [
  'ChartLineUp', 'ChartBar', 'ChartPie', 'Lightning', 'Sparkle', 'Rocket', 'Target', 'ShieldCheck', 'LockKey', 'Bell',
  'Users', 'UsersThree', 'Globe', 'Gear', 'Database', 'Cloud', 'Code', 'Plugs', 'MagnifyingGlass', 'Clock',
  'CalendarCheck', 'CreditCard', 'EnvelopeSimple', 'ChatCircleText', 'Lifebuoy', 'Briefcase', 'BookOpen', 'Cube', 'Heart', 'Star'
] as const;

/** The original 25 core components (layout, heroes, marketing sections, app UI). */
export const CORE_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'structure/container': {
    type: 'structure/container',
    displayName: 'Container',
    category: 'structure',
    description: 'A centered, width-limited flex box for grouping and aligning nested elements.',
    icon: 'BoundingBox',
    component: 'Container',
    isContainer: true,
    keywords: ['box', 'wrapper', 'flex', 'column', 'row', 'stack', 'layout'],
    propsSchema: z.object({
      maxWidth: z.enum(MAX_WIDTHS).default('xl'),
      // Layout props are optional: when none is set the container is a plain block.
      direction: z.enum(DIRECTIONS).optional(),
      justify: z.enum(JUSTIFY).optional(),
      align: z.enum(ALIGN).optional(),
      textAlign: z.enum(TEXT_ALIGN).optional(),
      gap: cssValue().optional()
    }),
    defaultProps: {
      maxWidth: 'xl',
      direction: 'column',
      justify: 'flex-start',
      align: 'stretch',
      textAlign: 'left',
      gap: '1rem'
    },
    propControls: {
      maxWidth: {
        label: 'Max width',
        options: [
          { value: 'sm', label: 'Small (640px)' },
          { value: 'md', label: 'Medium (768px)' },
          { value: 'lg', label: 'Large (1024px)' },
          { value: 'xl', label: 'Extra large (1280px)' },
          { value: '2xl', label: 'Wide (1536px)' },
          { value: 'full', label: 'Full width' }
        ]
      },
      gap: { label: 'Gap', help: 'Space between children, e.g. 1rem or 24px.' }
    },
    slots: [{ name: 'children', displayName: 'Container content' }],
    behaviour: [
      'Centered wrapper with a max width (sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px) and responsive horizontal padding (20px below 640px, 24px from 640px, 32px from 1024px); `full` is edge to edge (100% width, no side padding) for page roots and full-bleed bands.',
      'When any of `direction`, `justify`, `align` or `gap` is set it becomes a flex container (direction defaults to column); otherwise it is a plain block.'
    ]
  },

  'hero/split-hero': {
    type: 'hero/split-hero',
    displayName: 'Split Hero',
    category: 'hero',
    description: 'A page opener with announcement badge, headline, supporting copy, two calls to action and a product preview.',
    icon: 'Layout',
    component: 'SplitHero',
    isSection: true,
    keywords: ['hero', 'header', 'banner', 'landing', 'headline', 'cta', 'product preview'],
    propsSchema: z.object({
      eyebrow: z.string().default(''),
      title: z.string().default('Know what changed, why, and what to do next.'),
      subtitle: z.string().default('Bring product, revenue and infrastructure metrics into one live workspace.'),
      primaryCtaText: z.string().default('Start free trial'),
      primaryCtaHref: z.string().default('/dashboard'),
      secondaryCtaText: z.string().default('View pricing'),
      secondaryCtaHref: z.string().default('/pricing'),
      badgeText: z.string().default(''),
      proofText: z.string().default(''),
      align: z.enum(['left', 'center']).default('left'),
      visual: z.enum(['app', 'none']).default('app')
    }),
    defaultProps: {
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
    propControls: {
      badgeText: { label: 'Announcement badge', help: 'Short pill above the headline. Leave empty to hide it.', group: 'Content' },
      eyebrow: { label: 'Eyebrow', help: 'Small label above the headline. Leave empty to hide it.', group: 'Content' },
      proofText: { label: 'Reassurance line', help: 'Small line under the buttons, e.g. trial terms. Leave empty to hide it.', group: 'Content' },
      align: {
        label: 'Layout',
        options: [
          { value: 'left', label: 'Split (copy left, preview right)' },
          { value: 'center', label: 'Centered (preview below)' }
        ],
        group: 'Settings'
      },
      visual: {
        label: 'Product preview',
        options: [
          { value: 'app', label: 'App window illustration' },
          { value: 'none', label: 'None' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'Two columns from 1024px (copy left, product preview right); stacked below 1024px with the preview under the copy.',
      '`align: "center"` renders a centered copy column with the preview below it (max width 1040px).',
      'Optional announcement badge (soft primary pill with a sparkle icon) above an optional eyebrow and the h1 headline; supporting copy in the muted lead style.',
      'The primary CTA is a filled button with a trailing arrow icon, the secondary CTA an outlined button; both are plain links. An optional reassurance line with a check icon sits under the buttons.',
      '`visual: "app"` renders a decorative, aria-hidden app-window illustration built from CSS shapes and an inline SVG area chart in the theme colors (window chrome, sidebar, KPI tiles, chart, table rows); it contains no text. The sidebar of the illustration is hidden below 640px. `visual: "none"` hides it.',
      'Background: a soft radial primary glow and a faint grid pattern behind the content.'
    ]
  },

  'marketing/feature-grid': {
    type: 'marketing/feature-grid',
    displayName: 'Feature Grid',
    category: 'marketing',
    description: 'A titled grid of icon cards for presenting product capabilities.',
    icon: 'GridFour',
    component: 'FeatureGrid',
    isSection: true,
    keywords: ['features', 'benefits', 'capabilities', 'cards', 'icons'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Platform capabilities'),
      sectionDescription: z.string().default(''),
      columns: z.number().int().min(1).max(4).default(3),
      features: z
        .array(
          z.object({
            icon: z.string().default('Sparkle'),
            title: z.string().default(''),
            description: z.string().default('')
          })
        )
        .default([])
    }),
    defaultProps: {
      sectionEyebrow: 'Platform',
      sectionTitle: 'Everything your team needs to run on data',
      sectionDescription: 'Connect your sources in minutes. Halden models, monitors and explains your numbers so you can focus on decisions.',
      columns: 3,
      features: [
        { icon: 'Plugs', title: 'Connect any source', description: 'Native connectors for your warehouse, billing system, product events and cloud provider — no pipelines to maintain.' },
        { icon: 'ChartLineUp', title: 'Live dashboards', description: 'Metrics refresh every minute. Start from proven templates and share a board with one link.' },
        { icon: 'Bell', title: 'Anomaly alerts', description: 'Halden learns the normal range of every metric and alerts its owner the moment something drifts.' }
      ]
    },
    propControls: {
      columns: { label: 'Columns', min: 1, max: 4, step: 1, help: 'Columns on desktop. Mobile always shows one column.' },
      features: { label: 'Features', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Centered section header (eyebrow, h2 title, muted description) above a grid of feature cards: 1 column on mobile, `columns` from 768px (3 and 4 columns show as 2 until 1024px).',
      'Each card has a 1px hairline border and lifts 2px with a soft shadow on hover (no movement with reduced motion).',
      'Each feature `icon` is an icon name (Phosphor names or Lucide-style aliases such as "Layers", "ShieldCheck", "Zap") rendered as an inline SVG in a primary-tinted rounded tile above the title; unknown names render a sparkle icon.'
    ]
  },

  'marketing/pricing-table': {
    type: 'marketing/pricing-table',
    displayName: 'Pricing Table',
    category: 'marketing',
    description: 'Side-by-side plan cards with prices, feature lists and checkout calls to action.',
    icon: 'CurrencyDollar',
    component: 'PricingTable',
    isSection: true,
    keywords: ['pricing', 'plans', 'tiers', 'subscription', 'checkout'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Transparent pricing'),
      sectionDescription: z.string().default(''),
      popularLabel: z.string().default('Most popular'),
      plans: z
        .array(
          z.object({
            name: z.string().default(''),
            price: z.string().default(''),
            period: z.string().default(''),
            description: z.string().default(''),
            features: z.array(z.string()).default([]),
            ctaText: z.string().default(''),
            ctaHref: z.string().default(''),
            isPopular: z.boolean().default(false)
          })
        )
        .default([])
    }),
    defaultProps: {
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
          features: ['SSO and SCIM provisioning', 'Audit logs', 'EU or US data residency', 'Dedicated success manager'],
          ctaText: 'Contact sales',
          ctaHref: 'mailto:sales@halden.example',
          isPopular: false
        }
      ]
    },
    propControls: {
      popularLabel: { label: 'Highlight label', help: 'Badge text on the highlighted plan.', group: 'Content' },
      plans: { label: 'Plans', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Plans render as equal-height cards: a single centered column (max 32rem) below 1024px; from 1024px one column per plan (up to 4).',
      'A plan with `isPopular: true` gets a primary border with a soft primary ring and shadow, a `popularLabel` badge next to its name and a filled CTA; other plans use a hairline card and an outlined CTA.',
      'Each card shows name, description, price in large tabular numerals with the period beside it, a full-width CTA, then the feature list with check icons.',
      'Bare periods ("mo", "month") render as "/ mo"; periods starting with "per", "/", "forever", "one-time", "once" or "billed" render verbatim; an empty period renders nothing.'
    ]
  },

  'marketing/faq-accordion': {
    type: 'marketing/faq-accordion',
    displayName: 'FAQ Accordion',
    category: 'marketing',
    description: 'An accessible single-open accordion for frequently asked questions.',
    icon: 'Question',
    component: 'FaqAccordion',
    isSection: true,
    keywords: ['faq', 'questions', 'accordion', 'collapse', 'help'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Frequently asked questions'),
      sectionDescription: z.string().default(''),
      items: z
        .array(z.object({ question: z.string().default(''), answer: z.string().default('') }))
        .default([])
    }),
    defaultProps: {
      sectionEyebrow: 'FAQ',
      sectionTitle: 'Frequently asked questions',
      sectionDescription: 'Everything you need to know about getting started. Can’t find an answer? Our team replies within one business day.',
      items: [
        { question: 'How long does setup take?', answer: 'Most teams connect their first source and publish a dashboard in under an hour. During the trial our onboarding team helps you model your core metrics.' },
        { question: 'Where is my data stored?', answer: 'You choose a US or EU region when you create a workspace. Data is encrypted in transit and at rest, and access is read-only on the sources you connect.' },
        { question: 'Can I share dashboards with people outside my team?', answer: 'Yes. Viewers are free on every plan, and you can share read-only dashboards with guests through expiring links.' }
      ]
    },
    propControls: {
      items: { label: 'Questions', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'From 1024px a two-column layout: the header (optional eyebrow, h2 title, optional description) on the left, the accordion on the right; stacked below 1024px.',
      'Single-open accordion separated by hairline rules; the first item is open initially and clicking the open item closes it. The chevron rotates 180° when open and the panel height animates (instant with reduced motion).',
      'Each trigger is a <button> with aria-expanded and aria-controls; each panel is a region labelled by its trigger. Closed panels are visibility-hidden (removed from the accessibility tree and tab order).'
    ]
  },

  'marketing/testimonials': {
    type: 'marketing/testimonials',
    displayName: 'Testimonials',
    category: 'marketing',
    description: 'Customer quote cards that add social proof to a page.',
    icon: 'ChatCircleText',
    component: 'Testimonials',
    isSection: true,
    keywords: ['quotes', 'reviews', 'social proof', 'customers'],
    upgradeProps: (props) => {
      if (!Array.isArray(props.testimonials)) return props;
      return {
        ...props,
        testimonials: props.testimonials.map((item) => {
          if (!isRecord(item) || typeof item.company !== 'string' || !item.company) return item;
          const { company, ...rest } = item;
          return { ...rest, role: [rest.role, company].filter(Boolean).join(', ') };
        })
      };
    },
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Trusted by software teams'),
      sectionDescription: z.string().default(''),
      showRating: z.boolean().default(false),
      testimonials: z
        .array(z.object({ quote: z.string().default(''), author: z.string().default(''), role: z.string().default('') }))
        .default([])
    }),
    defaultProps: {
      sectionEyebrow: 'Customers',
      sectionTitle: 'Teams run their week on Halden',
      sectionDescription: '',
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
    propControls: {
      showRating: { label: 'Show star rating', help: 'Adds a five-star row above each quote.', group: 'Settings' },
      testimonials: { label: 'Quotes', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Centered section header above quote cards: 1 column on mobile, 2 columns from 768px (an odd last card spans the full width), an auto-fit grid (minimum card width 300px) from 1024px.',
      'Each card shows a primary quote-mark tile, the quote, and (below a hairline) an author row with an initials avatar (first letters of the first two words of `author`), name and role; cards are equal height. `showRating` adds a five-star row in the primary color (role="img", aria-label "Rated 5 out of 5").'
    ]
  },

  'navigation/navbar': {
    type: 'navigation/navbar',
    displayName: 'Navbar',
    category: 'navigation',
    description: 'A sticky site header with brand, navigation links and a primary call to action.',
    icon: 'Compass',
    component: 'Navbar',
    keywords: ['header', 'navigation', 'menu', 'nav', 'top bar', 'logo'],
    propsSchema: z.object({
      brandName: z.string().default('Halden'),
      logoUrl: z.string().default(''),
      links: z.array(linkSchema).default([]),
      ctaText: z.string().default('Get started'),
      ctaHref: z.string().default('/dashboard')
    }),
    defaultProps: {
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
    propControls: {
      logoUrl: { label: 'Logo image', type: 'image', help: 'Replaces the letter mark. Shown at 28px height.' },
      links: { label: 'Links', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Sticky 64px top bar with a translucent surface background and backdrop blur, and a hairline bottom border: brand mark (logo image or initial) and name on the left, links in the middle, primary CTA on the right.',
      'The link matching the current URL path gets aria-current="page" and the active style (read from location on mount, on history navigation and on link clicks).',
      'Below 768px the links collapse behind a 40px menu button that toggles a disclosure panel (aria-expanded, aria-controls) listing the links and the CTA; Escape closes it and returns focus to the button, and choosing a link closes it.'
    ]
  },

  'marketing/footer': {
    type: 'marketing/footer',
    displayName: 'Footer',
    category: 'marketing',
    description: 'A multi-column site footer with brand summary, link groups, optional newsletter signup and a bottom bar.',
    icon: 'SquareHalfBottom',
    component: 'Footer',
    keywords: ['footer', 'links', 'copyright', 'sitemap', 'newsletter'],
    propsSchema: z.object({
      brandName: z.string().default('Halden'),
      tagline: z.string().default(''),
      copyright: z.string().default(''),
      newsletterTitle: z.string().default(''),
      newsletterButtonText: z.string().default('Subscribe'),
      columns: z
        .array(z.object({ title: z.string().default(''), links: z.array(linkSchema).default([]) }))
        .default([]),
      legalLinks: z.array(linkSchema).default([])
    }),
    defaultProps: {
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
        }
      ],
      legalLinks: [
        { label: 'Privacy', href: '#privacy' },
        { label: 'Terms', href: '#terms' }
      ]
    },
    propControls: {
      newsletterTitle: { label: 'Newsletter heading', help: 'Shows an email signup under the tagline. Leave empty to hide it.', group: 'Newsletter' },
      newsletterButtonText: { label: 'Newsletter button', group: 'Newsletter' },
      columns: { label: 'Link columns', group: 'Items' },
      legalLinks: { label: 'Bottom bar links', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Brand column (letter mark, name, tagline and an optional newsletter signup when `newsletterTitle` is set) followed by link columns: one row from 1024px (brand column wider); below 1024px the brand column spans the full width above the link columns — one row of link columns (up to 4) from 640px, two per row below.',
      'The newsletter signup is an email input plus button; on submit a confirmation replaces the form. No network request is made — connect it to your email provider.',
      'A bottom bar separated by a hairline shows `copyright` on the left and `legalLinks` on the right (stacked on mobile).'
    ]
  },

  'ui/button': {
    type: 'ui/button',
    displayName: 'Button',
    category: 'ui',
    description: 'A call-to-action button that links to a page or URL.',
    icon: 'CursorClick',
    component: 'Button',
    keywords: ['button', 'cta', 'link', 'action'],
    propsSchema: z.object({
      text: z.string().default('Button'),
      variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      href: z.string().default(''),
      // Optional (no default) so existing buttons keep their exact resolved props.
      icon: z.enum(BUTTON_ICONS).optional()
    }),
    defaultProps: {
      text: 'Get started',
      variant: 'primary',
      size: 'md',
      href: ''
    },
    propControls: {
      variant: {
        label: 'Style',
        options: [
          { value: 'primary', label: 'Primary (filled)' },
          { value: 'secondary', label: 'Secondary (tonal)' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Ghost' }
        ]
      },
      size: {
        label: 'Size',
        options: [
          { value: 'sm', label: 'Small (40px)' },
          { value: 'md', label: 'Medium (44px)' },
          { value: 'lg', label: 'Large (48px)' }
        ]
      },
      icon: {
        label: 'Trailing icon',
        type: 'select',
        options: BUTTON_ICONS.map((name) => ({ value: name, label: name.replace(/([a-z])([A-Z])/g, '$1 $2') })),
        help: 'Optional icon after the label.'
      }
    },
    slots: [],
    behaviour: [
      'Renders a link when `href` is set, otherwise a <button type="button">. Variants: primary (filled primary with a subtle inner highlight), secondary (neutral tonal), outline (hairline border), ghost (transparent). Heights: sm 40px, md 44px, lg 48px; 10px corner radius.',
      'An optional `icon` (one of a curated set such as ArrowRight) renders after the label.'
    ]
  },

  'app/dashboard-shell': {
    type: 'app/dashboard-shell',
    displayName: 'Dashboard Shell',
    category: 'app',
    description: 'An application frame with sidebar navigation, a header with search and account avatar, and a content area for nested sections.',
    icon: 'SidebarSimple',
    component: 'DashboardShell',
    isSection: true,
    isContainer: true,
    layoutInner: true,
    keywords: ['dashboard', 'app shell', 'sidebar', 'admin', 'console'],
    propsSchema: z.object({
      title: z.string().default('Analytics overview'),
      activeNav: z.string().default('dashboard'),
      brandName: z.string().default('Halden'),
      userName: z.string().default('')
    }),
    defaultProps: {
      title: 'Overview',
      activeNav: 'dashboard',
      brandName: 'Halden',
      userName: 'Jordan Lee'
    },
    propControls: {
      activeNav: {
        label: 'Active item',
        type: 'select',
        options: [
          { value: 'dashboard', label: 'Overview' },
          { value: 'settings', label: 'Settings' },
          { value: 'home', label: 'Public site' }
        ]
      },
      userName: { label: 'Signed-in user', help: 'Name shown as initials in the header avatar and in the sidebar footer.' }
    },
    slots: [{ name: 'children', displayName: 'Dashboard content' }],
    behaviour: [
      'Left sidebar (15rem) with the brand mark and name, navigation with icons — Overview (/dashboard), Settings (/dashboard/settings), Public site (/) — and the signed-in user at the bottom; `activeNav` ("dashboard" | "settings" | "home") highlights the current item with aria-current="page".',
      'Below 1024px the sidebar becomes a top bar with the brand and a horizontally scrollable row of navigation pills.',
      'A 64px header shows `title` (h1), a search field (labelled "Search"; not wired — connect it to your search) hidden below 640px, and an initials avatar for `userName` (a user icon when empty). The main region renders the child nodes on the low surface tone.'
    ]
  },

  'app/kpi-grid': {
    type: 'app/kpi-grid',
    displayName: 'KPI Grid',
    category: 'app',
    description: 'A row of metric cards showing key values and their change.',
    icon: 'TrendUp',
    component: 'KpiGrid',
    isSection: true,
    keywords: ['kpi', 'metrics', 'stats', 'analytics', 'cards'],
    upgradeProps: (props) => {
      if (!Array.isArray(props.cards)) return props;
      return {
        ...props,
        cards: props.cards.map((card) => {
          if (!isRecord(card)) return card;
          const out = alias(card, [
            ['label', 'title'],
            ['delta', 'change']
          ]);
          if (out.trend === undefined && typeof out.isPositive === 'boolean') out.trend = out.isPositive ? 'up' : 'down';
          delete out.isPositive;
          return out;
        })
      };
    },
    propsSchema: z.object({
      comparisonLabel: z.string().default(''),
      cards: z
        .array(
          z.object({
            title: z.string().default(''),
            value: z.string().default(''),
            change: z.string().default(''),
            trend: z.enum(['up', 'down']).default('up')
          })
        )
        .default([])
    }),
    defaultProps: {
      comparisonLabel: 'vs. last month',
      cards: [
        { title: 'Monthly recurring revenue', value: '$184,920', change: '+12.4%', trend: 'up' },
        { title: 'Active accounts', value: '2,431', change: '+4.1%', trend: 'up' },
        { title: 'Net revenue retention', value: '118%', change: '+2.3 pts', trend: 'up' },
        { title: 'Open incidents', value: '3', change: '-2', trend: 'up' }
      ]
    },
    propControls: {
      comparisonLabel: { label: 'Comparison label', help: 'Muted text after each change chip, e.g. "vs. last month".' },
      cards: { label: 'Metrics', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Metric cards laid out by the width of the component itself (container queries): 1 column below 32rem, 2 columns from 32rem, 4 columns from 56rem.',
      'Each card shows the title, the value in large tabular numerals and a change chip whose arrow follows the sign of `change` (a leading + points up, - points down, otherwise `trend`) and whose color follows `trend` (good/bad): "up" uses the success container, "down" the error container; `comparisonLabel` follows the chip in muted text.'
    ]
  },

  'app/data-table': {
    type: 'app/data-table',
    displayName: 'Data Table',
    category: 'app',
    description: 'A titled, searchable table for tabular records with status pills.',
    icon: 'Table',
    component: 'DataTable',
    isSection: true,
    keywords: ['table', 'grid', 'rows', 'records', 'search', 'filter'],
    propsSchema: z.object({
      title: z.string().default(''),
      description: z.string().default(''),
      columns: z.array(z.string()).default([]),
      rows: z.array(z.array(z.string())).default([])
    }),
    defaultProps: {
      title: 'Recent accounts',
      description: 'Accounts with billing or usage changes in the last 7 days.',
      columns: ['Account', 'Plan', 'Seats', 'MRR', 'Status'],
      rows: [
        ['Fernway Logistics', 'Growth', '48', '$2,352', 'Active'],
        ['Copperline', 'Enterprise', '210', '$11,400', 'Active'],
        ['Northfold', 'Growth', '36', '$1,764', 'Trial'],
        ['Kettle & Pine', 'Starter', '6', '$0', 'Past due']
      ]
    },
    propControls: {
      description: { label: 'Description', help: 'Muted line under the title. Leave empty to hide it.' },
      columns: { label: 'Columns', group: 'Items' },
      rows: { label: 'Rows', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'A card with a toolbar (title, optional description and a search input) above the table; the table scrolls horizontally on narrow screens.',
      'The search input filters rows client-side (case-insensitive substring match on any cell); a footer shows "Showing X of Y" and an empty state is shown when no rows match. The table is labelled with the title.',
      'Cells in a column whose header contains "status" or "state" render as pills with a dot: error tone for failed/error/down/overdue/canceled/cancelled/critical/offline/blocked/churned/declined, otherwise warning tone for trial/pending/review/degraded/paused/past due/at risk/warning/processing/scheduled, otherwise success tone for active/healthy/paid/live/complete(d)/resolved/enabled/operational/online/success(ful)/approved/done, neutral otherwise. Columns whose cells are all numeric or currency values are right-aligned.'
    ]
  },

  'app/settings-form': {
    type: 'app/settings-form',
    displayName: 'Settings Form',
    category: 'app',
    description: 'An account preferences form with name, email and notification settings.',
    icon: 'SlidersHorizontal',
    component: 'SettingsForm',
    isSection: true,
    keywords: ['settings', 'preferences', 'account', 'profile', 'form'],
    propsSchema: z.object({
      title: z.string().default('Workspace preferences'),
      description: z.string().default(''),
      initialName: z.string().default(''),
      initialEmail: z.string().default(''),
      notificationsEnabled: z.boolean().default(true)
    }),
    defaultProps: {
      title: 'Workspace preferences',
      description: 'Update how your workspace appears and where alerts are delivered.',
      initialName: 'Halden Operations',
      initialEmail: 'ops@halden.example',
      notificationsEnabled: true
    },
    propControls: {
      initialName: { label: 'Display name (initial value)' },
      initialEmail: { label: 'Notification email (initial value)' },
      notificationsEnabled: { label: 'Email digest on by default' }
    },
    slots: [],
    behaviour: [
      'A card with a header (`title`, optional `description`) and setting rows (label and hint beside the control from 640px): a required display name, a notification email (native email validation) and an "Email digest and alerts" switch (role="switch", aria-checked), plus a footer bar with Reset and Save changes.',
      'Controlled form initialised from props (re-initialised when the props change). "Reset" restores the initial values; on submit an inline success message is shown for 3 seconds. No network request is made — connect it to a real endpoint.'
    ]
  },

  'structure/section': {
    type: 'structure/section',
    displayName: 'Section',
    category: 'structure',
    description: 'A full-width page band with background tone, vertical spacing and an aligned content area.',
    icon: 'Rows',
    component: 'Section',
    isSection: true,
    isContainer: true,
    layoutInner: true,
    keywords: ['section', 'band', 'block', 'background', 'wrapper', 'layout'],
    upgradeProps: (props) => {
      const out = alias(props, [['variant', 'surfaceTone']]);
      if (out.surfaceTone === 'surface-low') out.surfaceTone = 'low';
      if (out.surfaceTone === 'surface-high') out.surfaceTone = 'high';
      return out;
    },
    propsSchema: z.object({
      surfaceTone: z.enum(['surface', 'low', 'container', 'high', 'primary-container', 'inverse']).default('surface'),
      paddingY: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
      maxWidth: z.enum(MAX_WIDTHS).default('xl'),
      // Layout props are optional: when none is set the content area is a plain block.
      direction: z.enum(DIRECTIONS).optional(),
      justify: z.enum(JUSTIFY).optional(),
      align: z.enum(ALIGN).optional(),
      textAlign: z.enum(TEXT_ALIGN).optional(),
      gap: cssValue().optional()
    }),
    defaultProps: {
      surfaceTone: 'low',
      paddingY: 'lg',
      maxWidth: 'xl',
      direction: 'column',
      justify: 'flex-start',
      align: 'stretch',
      textAlign: 'left',
      gap: '1.5rem'
    },
    propControls: {
      surfaceTone: {
        label: 'Background',
        options: [
          { value: 'surface', label: 'Page surface' },
          { value: 'low', label: 'Subtle' },
          { value: 'container', label: 'Muted' },
          { value: 'high', label: 'Strong' },
          { value: 'primary-container', label: 'Brand tint' },
          { value: 'inverse', label: 'Inverse (dark band)' }
        ]
      },
      paddingY: {
        label: 'Vertical spacing',
        options: [
          { value: 'sm', label: 'Small (48px)' },
          { value: 'md', label: 'Medium (64px)' },
          { value: 'lg', label: 'Large (64 / 80 / 96px)' },
          { value: 'xl', label: 'Extra large (96 / 128px)' }
        ]
      },
      gap: { label: 'Gap', help: 'Space between children, e.g. 1.5rem.' }
    },
    slots: [{ name: 'children', displayName: 'Section content' }],
    behaviour: [
      'Full-width <section> whose background follows `surfaceTone` (surface, low, container, high → the matching surface-container token; primary-container; inverse → inverse-surface with inverse-on-surface text).',
      'Vertical padding `paddingY`: sm 3rem, md 4rem, lg 4rem on mobile / 5rem from 768px / 6rem from 1024px, xl 6rem on mobile / 8rem from 1024px.',
      'Children render inside a centered container (`maxWidth`); flex props and layout style overrides apply to that inner content area.'
    ]
  },

  'structure/grid': {
    type: 'structure/grid',
    displayName: 'Grid',
    category: 'structure',
    description: 'A responsive multi-column grid for arranging cards, buttons and other blocks.',
    icon: 'SquaresFour',
    component: 'Grid',
    isContainer: true,
    keywords: ['grid', 'columns', 'stack', 'layout', 'cards'],
    propsSchema: z.object({
      columns: z.number().int().min(1).max(4).default(2),
      gap: cssValue().default('1.5rem'),
      alignItems: z.enum(['stretch', 'start', 'center', 'end']).default('stretch'),
      justifyItems: z.enum(['stretch', 'start', 'center', 'end']).default('stretch'),
      textAlign: z.enum(TEXT_ALIGN).default('left')
    }),
    defaultProps: {
      columns: 2,
      gap: '1.5rem',
      alignItems: 'stretch',
      justifyItems: 'stretch',
      textAlign: 'left'
    },
    propControls: {
      columns: { label: 'Columns', min: 1, max: 4, step: 1, help: 'Columns from 768px; mobile always stacks.' },
      gap: { label: 'Gap', help: 'sm (1rem), md (1.5rem), lg (2.5rem) or any CSS length.' }
    },
    slots: [{ name: 'children', displayName: 'Grid items' }],
    behaviour: [
      'CSS grid: 1 column on mobile, `columns` (1–4) from 768px (3 and 4 columns show as 2 until 1024px).',
      '`gap` accepts the tokens sm (1rem), md (1.5rem), lg (2.5rem) or any CSS length.'
    ]
  },

  'structure/divider': {
    type: 'structure/divider',
    displayName: 'Divider',
    category: 'structure',
    description: 'A horizontal rule with optional centered label for separating content.',
    icon: 'Minus',
    component: 'Divider',
    keywords: ['divider', 'separator', 'rule', 'line', 'hr'],
    propsSchema: z.object({
      spacing: z.enum(['sm', 'md', 'lg']).default('md'),
      label: z.string().default('')
    }),
    defaultProps: {
      spacing: 'md',
      label: ''
    },
    propControls: {
      spacing: {
        label: 'Spacing',
        options: [
          { value: 'sm', label: 'Small (16px)' },
          { value: 'md', label: 'Medium (32px)' },
          { value: 'lg', label: 'Large (56px)' }
        ]
      },
      label: { label: 'Label', help: 'Optional text centered on the rule, e.g. "or".' }
    },
    slots: [],
    behaviour: ['Hairline rule in the outline-variant color with vertical padding sm 1rem, md 2rem, lg 3.5rem; a non-empty `label` is centered between two rules in small muted text.']
  },

  'marketing/cta-banner': {
    type: 'marketing/cta-banner',
    displayName: 'CTA Banner',
    category: 'marketing',
    description: 'A high-contrast banner with headline, supporting copy and up to two calls to action.',
    icon: 'Megaphone',
    component: 'CtaBanner',
    isSection: true,
    keywords: ['cta', 'call to action', 'banner', 'conversion', 'signup'],
    propsSchema: z.object({
      eyebrow: z.string().default(''),
      title: z.string().default('Ready to accelerate your workflow?'),
      subtitle: z.string().default(''),
      primaryCtaText: z.string().default('Get started'),
      primaryCtaHref: z.string().default('/dashboard'),
      secondaryCtaText: z.string().default(''),
      secondaryCtaHref: z.string().default(''),
      variant: z.enum(['primary', 'dark', 'soft']).default('primary')
    }),
    defaultProps: {
      eyebrow: '',
      title: 'See your business clearly, starting today',
      subtitle: 'Connect a source and publish your first live dashboard in under an hour. Free for 14 days.',
      primaryCtaText: 'Start free trial',
      primaryCtaHref: '/dashboard',
      secondaryCtaText: 'Talk to sales',
      secondaryCtaHref: '/pricing',
      variant: 'primary'
    },
    propControls: {
      variant: {
        label: 'Style',
        options: [
          { value: 'primary', label: 'Brand gradient' },
          { value: 'dark', label: 'Inverse band (dark on light themes)' },
          { value: 'soft', label: 'Soft tint' }
        ]
      }
    },
    slots: [],
    behaviour: [
      'A rounded banner inside the page container with a centered optional eyebrow, h2 headline, optional subtitle and up to two CTAs (plain links).',
      '`variant`: "primary" — primary-colored band with a soft radial highlight and a faint grid texture, on-primary buttons (solid + outlined); "dark" — inverse-surface band (dark on light themes, light on dark themes) with a primary glow, filled primary + outlined buttons in the inverse text color; "soft" — primary-container band with a hairline border, filled primary + outlined buttons.',
      'The primary CTA has a trailing arrow icon; below 480px both buttons are full width.'
    ]
  },

  'marketing/stats-bar': {
    type: 'marketing/stats-bar',
    displayName: 'Stats Bar',
    category: 'marketing',
    description: 'A band of headline metrics with labels for proof points and benchmarks.',
    icon: 'ChartBar',
    component: 'StatsBar',
    isSection: true,
    keywords: ['stats', 'metrics', 'numbers', 'counters', 'proof'],
    upgradeProps: (props) => {
      if (!Array.isArray(props.stats)) return props;
      return { ...props, stats: props.stats.map((s) => (isRecord(s) ? alias(s, [['subtext', 'detail']]) : s)) };
    },
    propsSchema: z.object({
      sectionTitle: z.string().default(''),
      stats: z
        .array(z.object({ value: z.string().default(''), label: z.string().default(''), detail: z.string().default('') }))
        .default([])
    }),
    defaultProps: {
      sectionTitle: 'Built for teams that measure what matters',
      stats: [
        { value: '1 min', label: 'Data freshness', detail: 'Metrics refresh every minute' },
        { value: '60+', label: 'Native connectors', detail: 'Warehouses, billing and product events' },
        { value: '99.9%', label: 'Uptime target', detail: 'Published monthly on our status page' },
        { value: '< 1 hr', label: 'Time to first dashboard', detail: 'With guided onboarding' }
      ]
    },
    propControls: {
      sectionTitle: { label: 'Caption', help: 'Small centered line above the metrics. Leave empty to hide it.' },
      stats: { label: 'Metrics', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'Optional centered caption above one bordered panel of metrics separated by hairline dividers: 1 column below 640px, 2 columns from 640px, 4 columns from 1024px.',
      'Each metric shows a large tabular value, a label and an optional muted detail line.'
    ]
  },

  'marketing/newsletter': {
    type: 'marketing/newsletter',
    displayName: 'Newsletter Signup',
    category: 'marketing',
    description: 'An email capture block with headline, input and subscribe button.',
    icon: 'EnvelopeSimple',
    component: 'Newsletter',
    isSection: true,
    keywords: ['newsletter', 'email', 'subscribe', 'signup', 'capture'],
    propsSchema: z.object({
      title: z.string().default('Subscribe to product updates'),
      subtitle: z.string().default(''),
      placeholder: z.string().default('you@company.com'),
      buttonText: z.string().default('Subscribe'),
      note: z.string().default('')
    }),
    defaultProps: {
      title: 'Get the monthly operations brief',
      subtitle: 'Practical playbooks on metrics, alerting and reporting — one email a month.',
      placeholder: 'you@company.com',
      buttonText: 'Subscribe',
      note: 'No spam. Unsubscribe at any time.'
    },
    propControls: {
      placeholder: { label: 'Input placeholder' },
      note: { label: 'Fine print', help: 'Small muted line under the form. Leave empty to hide it.' }
    },
    slots: [],
    behaviour: [
      'A tinted card: copy on the left and the form on the right from 1024px, stacked below; the input and button sit side by side from 640px.',
      'The browser validates the email format. On submit a confirmation with a check icon appears below the form and the input is cleared. No network request is made — connect it to your email provider.'
    ]
  },

  'marketing/contact-form': {
    type: 'marketing/contact-form',
    displayName: 'Contact Form',
    category: 'marketing',
    description: 'A titled contact form with name, email and message fields.',
    icon: 'PaperPlaneTilt',
    component: 'ContactForm',
    isSection: true,
    keywords: ['contact', 'form', 'inquiry', 'support', 'message'],
    upgradeProps: (props) =>
      alias(props, [
        ['title', 'sectionTitle'],
        ['subtitle', 'sectionSubtitle']
      ]),
    propsSchema: z.object({
      sectionEyebrow: z.string().default('Contact'),
      sectionTitle: z.string().default('Get in touch'),
      sectionSubtitle: z.string().default(''),
      submitText: z.string().default('Send message')
    }),
    defaultProps: {
      sectionEyebrow: 'Contact',
      sectionTitle: 'Talk to our team',
      sectionSubtitle: 'Questions about plans, security reviews or a custom rollout? Send us a note and we will reply within one business day.',
      submitText: 'Send message'
    },
    slots: [],
    behaviour: [
      'From 1024px the header (eyebrow, h2 title, subtitle) sits left of the form card; stacked below 1024px.',
      'Fields: full name and work email (side by side from 640px) and message — all required, email format validated natively. On submit an inline confirmation is shown for 4 seconds. No network request is made — wire it to a real endpoint or server action.'
    ]
  },

  'app/auth-card': {
    type: 'app/auth-card',
    displayName: 'Sign-in Card',
    category: 'app',
    description: 'A sign-in / sign-up card with email and password fields and a mode switch.',
    icon: 'LockKey',
    component: 'AuthCard',
    isSection: true,
    keywords: ['auth', 'login', 'sign in', 'sign up', 'register', 'account'],
    propsSchema: z.object({
      mode: z.enum(['signin', 'signup']).default('signin'),
      brandName: z.string().default('Halden'),
      title: z.string().default('Welcome back'),
      subtitle: z.string().default(''),
      redirectHref: z.string().default('/dashboard')
    }),
    defaultProps: {
      mode: 'signin',
      brandName: 'Halden',
      title: 'Sign in to your workspace',
      subtitle: 'Welcome back. Enter your work email and password to continue.',
      redirectHref: '/dashboard'
    },
    propControls: {
      mode: {
        label: 'Initial mode',
        options: [
          { value: 'signin', label: 'Sign in' },
          { value: 'signup', label: 'Create account' }
        ]
      },
      redirectHref: { label: 'After submit, go to' }
    },
    slots: [],
    behaviour: [
      'A centered card (max 26rem) with the brand mark and name, title, optional subtitle, fields and a full-width submit button, on a softly tinted band.',
      'Sign in / sign up switch (initial state from `mode`); sign up adds a full-name field. Email and password are required.',
      'On submit it shows a confirmation and then navigates to `redirectHref`. No authentication is performed — integrate a real auth provider.'
    ]
  },

  'ui/badge': {
    type: 'ui/badge',
    displayName: 'Badge',
    category: 'ui',
    description: 'A small pill label for statuses, versions and categories.',
    icon: 'Tag',
    component: 'Badge',
    keywords: ['badge', 'chip', 'pill', 'label', 'tag', 'status'],
    propsSchema: z.object({
      text: z.string().default('New'),
      tone: z.enum(['primary', 'secondary', 'tertiary', 'error', 'success', 'warning']).default('primary'),
      dot: z.boolean().default(false)
    }),
    defaultProps: {
      text: 'New',
      tone: 'primary',
      dot: false
    },
    propControls: {
      tone: {
        label: 'Tone',
        options: [
          { value: 'primary', label: 'Brand' },
          { value: 'secondary', label: 'Neutral' },
          { value: 'tertiary', label: 'Accent' },
          { value: 'success', label: 'Success' },
          { value: 'warning', label: 'Warning' },
          { value: 'error', label: 'Error' }
        ]
      },
      dot: { label: 'Status dot' }
    },
    slots: [],
    behaviour: ['24px pill with a hairline border using the container color of its `tone` (primary → brand, secondary → neutral, tertiary → accent, success, warning, error). `dot` adds a small leading status dot.']
  },

  'ui/card': {
    type: 'ui/card',
    displayName: 'Card',
    category: 'ui',
    description: 'A content card with optional icon, eyebrow, title, body text and link.',
    icon: 'Cards',
    component: 'Card',
    keywords: ['card', 'tile', 'panel', 'content'],
    upgradeProps: (props) =>
      alias(props, [
        ['actionText', 'ctaText'],
        ['actionHref', 'ctaHref']
      ]),
    propsSchema: z.object({
      variant: z.enum(['elevated', 'filled', 'outlined']).default('elevated'),
      icon: z.enum(CARD_ICONS).optional(),
      eyebrow: z.string().default(''),
      title: z.string().default('Card title'),
      body: z.string().default(''),
      ctaText: z.string().default(''),
      ctaHref: z.string().default(''),
      align: z.enum(TEXT_ALIGN).default('left')
    }),
    defaultProps: {
      align: 'left',
      variant: 'elevated',
      icon: 'ChartLineUp',
      eyebrow: 'Reporting',
      title: 'Scheduled reports',
      body: 'Send a snapshot of any dashboard to email or chat every morning, with the changes that matter highlighted.',
      ctaText: 'Learn more',
      ctaHref: '/features'
    },
    propControls: {
      variant: {
        label: 'Style',
        options: [
          { value: 'elevated', label: 'Elevated (border + shadow)' },
          { value: 'outlined', label: 'Outlined' },
          { value: 'filled', label: 'Filled' }
        ]
      },
      icon: {
        label: 'Icon',
        type: 'select',
        options: CARD_ICONS.map((name) => ({ value: name, label: name.replace(/([a-z])([A-Z])/g, '$1 $2') })),
        help: 'Optional icon tile above the text.'
      }
    },
    slots: [],
    behaviour: [
      'Surface card with a hairline border: elevated adds a soft shadow, outlined has none, filled uses the subtle surface tone.',
      'Optional icon tile, eyebrow, title, body and a text link with a trailing arrow. `align` sets text and item alignment.'
    ]
  },

  'ui/alert': {
    type: 'ui/alert',
    displayName: 'Alert',
    category: 'ui',
    description: 'A status banner for informational, success, warning or error messages.',
    icon: 'WarningCircle',
    component: 'Alert',
    keywords: ['alert', 'notice', 'banner', 'message', 'status', 'warning'],
    propsSchema: z.object({
      tone: z.enum(['info', 'success', 'warning', 'error']).default('info'),
      title: z.string().default(''),
      message: z.string().default(''),
      dismissible: z.boolean().default(false)
    }),
    defaultProps: {
      tone: 'info',
      title: 'Scheduled maintenance',
      message: 'Dashboards may refresh more slowly on Sunday between 02:00 and 03:00 UTC.',
      dismissible: false
    },
    propControls: {
      tone: {
        label: 'Tone',
        options: [
          { value: 'info', label: 'Info' },
          { value: 'success', label: 'Success' },
          { value: 'warning', label: 'Warning' },
          { value: 'error', label: 'Error' }
        ]
      }
    },
    slots: [],
    behaviour: [
      'Tinted banner with a hairline border and a tone icon (info, check, warning, error) beside the title and message.',
      'role="status" for info/success and role="alert" for warning/error. When `dismissible` is true a close button removes the alert.'
    ]
  },

  'ui/tabs': {
    type: 'ui/tabs',
    displayName: 'Tabs',
    category: 'ui',
    description: 'Tabbed panels for switching between related pieces of content.',
    icon: 'Tabs',
    component: 'Tabs',
    isSection: true,
    keywords: ['tabs', 'panels', 'switcher', 'segmented'],
    propsSchema: z.object({
      tabs: z
        .array(z.object({ label: z.string().default(''), title: z.string().default(''), content: z.string().default('') }))
        .default([])
    }),
    defaultProps: {
      tabs: [
        {
          label: 'Monitor',
          title: 'Every metric, watched around the clock',
          content: 'Halden learns the normal range of each metric and flags unusual changes within minutes, with the segment that moved highlighted.'
        },
        {
          label: 'Investigate',
          title: 'Find the cause in one click',
          content: 'Break any change down by region, plan, release or channel to see exactly what moved the number and when.'
        },
        {
          label: 'Share',
          title: 'Keep everyone on the same page',
          content: 'Schedule dashboard snapshots to email or chat, and share read-only boards with guests through expiring links.'
        }
      ]
    },
    propControls: {
      tabs: { label: 'Tabs', group: 'Items' }
    },
    slots: [],
    behaviour: [
      'A card with a segmented tab control above the active panel (title + text).',
      'WAI-ARIA tabs pattern: role=tablist/tab/tabpanel, Arrow/Home/End keys with roving tabindex; the first tab is active initially.'
    ]
  }
};
