import { z } from 'zod';
import type { ComponentManifest, PropControl } from '@app-viz/schema';
import { safeSrc } from '../svelte/lib/href.js';
import { resolveIconName } from '../svelte/lib/icons.js';

/**
 * Showcase sections: testimonial carousel, team, steps, timeline, price list, flip box, call to
 * action box, marquee, feature tabs, stats with media and two-column FAQ.
 */

const SECTION_ALIGN = ['left', 'center'] as const;

/**
 * Top-level image URL: empty, or a URL the site runtime will render (`safeSrc`). Unsafe values
 * (javascript:, data:, protocol-relative…) fail validation and fall back to the default.
 */
const imageUrl = () =>
  z.string().refine((v) => v.trim() === '' || safeSrc(v) !== '', { message: 'Unsafe or unsupported image URL' });

/**
 * Icon token from the shared site icon set (Phosphor names or aliases). Not free text: unknown
 * names fail validation and fall back to the default icon.
 */
const iconToken = () =>
  z.string().pipe(z.custom<string>((v) => typeof v === 'string' && resolveIconName(v) !== null, { message: 'Unknown icon name' }));

interface HeaderDefaults {
  eyebrow: string;
  heading: string;
  subheading: string;
  align?: (typeof SECTION_ALIGN)[number];
}

/** Optional section header shared by every showcase section (empty strings hide a line). */
function headerFields(d: HeaderDefaults, withAlign = true) {
  return {
    eyebrow: z.string().default(d.eyebrow),
    heading: z.string().default(d.heading),
    subheading: z.string().default(d.subheading),
    ...(withAlign ? { align: z.enum(SECTION_ALIGN).default(d.align ?? 'center') } : {})
  };
}

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' }
];

function headerControls(withAlign = true): Record<string, PropControl> {
  return {
    eyebrow: { label: 'Eyebrow', help: 'Short label above the heading. Leave empty to hide it.', group: 'Content' },
    heading: { label: 'Heading', help: 'Leave empty to hide it.', group: 'Content' },
    subheading: { label: 'Subheading', type: 'textarea', help: 'Supporting sentence under the heading.', group: 'Content' },
    ...(withAlign ? { align: { label: 'Header alignment', type: 'select', options: ALIGN_OPTIONS, group: 'Settings' } as PropControl } : {})
  };
}

const HEADER_BEHAVIOUR =
  'Optional section header (eyebrow, h2 heading, subheading); each line is omitted when its text is empty, and the section is labelled by the heading.';

/* -------------------------------------------------------------------------- */
/* Default content (fictional people and companies only)                      */
/* -------------------------------------------------------------------------- */

const TESTIMONIALS = [
  {
    quote:
      'We replaced three internal tools in the first month. Releases that used to need a week of coordination now go out on a Tuesday afternoon without a single meeting.',
    author: 'Maya Okafor',
    role: 'VP of Engineering',
    company: 'Corvid Logistics',
    avatarSrc: '',
    rating: 5
  },
  {
    quote:
      'The smoothest onboarding I have seen in ten years of buying software. Our designers were productive on day one and nobody had to read a manual.',
    author: 'Daniel Reyes',
    role: 'Head of Design',
    company: 'Fernhill Health',
    avatarSrc: '',
    rating: 5
  },
  {
    quote:
      'Support answers in minutes, not days, and the roadmap reflects what customers actually ask for. It feels like an extension of our own team.',
    author: 'Priya Natarajan',
    role: 'Director of Operations',
    company: 'Tidewater Analytics',
    avatarSrc: '',
    rating: 5
  },
  {
    quote:
      'Our month-end reporting went from five days to one. Finance finally trusts the numbers because every team works from the same source of truth.',
    author: 'Jonas Whitfield',
    role: 'Chief Financial Officer',
    company: 'Halcyon Retail',
    avatarSrc: '',
    rating: 5
  }
];

const TEAM = [
  {
    name: 'Elena Marsh',
    role: 'Co-founder & CEO',
    photoSrc: '',
    bio: 'Previously led product at two B2B startups. Spends weekends restoring old film cameras.',
    links: [
      { network: 'linkedin', href: '#' },
      { network: 'x', href: '#' }
    ]
  },
  {
    name: 'Tomás Alvarez',
    role: 'Co-founder & CTO',
    photoSrc: '',
    bio: 'A decade of building distributed systems. Cares deeply about fast, boring infrastructure.',
    links: [
      { network: 'linkedin', href: '#' },
      { network: 'github', href: '#' }
    ]
  },
  {
    name: 'Aisha Bello',
    role: 'Head of Design',
    photoSrc: '',
    bio: 'Designs calm interfaces for complex workflows. Former design systems lead.',
    links: [
      { network: 'linkedin', href: '#' },
      { network: 'dribbble', href: '#' }
    ]
  },
  {
    name: 'Kenji Morita',
    role: 'Head of Customer Success',
    photoSrc: '',
    bio: 'Makes sure every team sees value in week one. Runs the customer advisory board.',
    links: [
      { network: 'linkedin', href: '#' },
      { network: 'email', href: '#' }
    ]
  }
];

const STEPS = [
  { title: 'Connect your tools', description: 'Link your existing apps in a few clicks. Data syncs in the background, no engineering time required.', icon: 'Plugs' },
  { title: 'Set up your workspace', description: 'Start from a proven template, then tailor fields, views and permissions to the way your team works.', icon: 'SlidersHorizontal' },
  { title: 'Invite your team', description: 'Bring everyone in with single sign-on. Roles and access rules apply automatically from day one.', icon: 'UsersThree' },
  { title: 'Ship with confidence', description: 'Track progress in real time and get alerted before deadlines slip, not after.', icon: 'RocketLaunch' }
];

const TIMELINE = [
  { date: 'March 2019', title: 'Founded in a two-room office', description: 'Three engineers set out to make planning software that teams actually enjoy using.', tag: 'Company' },
  { date: 'October 2020', title: 'First 100 customers', description: 'Word of mouth carried us from a private beta to paying teams on four continents.', tag: 'Milestone' },
  { date: 'June 2022', title: 'Series A and a second office', description: 'New funding let us double the product team and open a support hub in Lisbon.', tag: 'Funding' },
  { date: 'February 2024', title: 'SOC 2 Type II and EU data residency', description: 'Enterprise-grade security and regional hosting became standard on every plan.', tag: 'Security' },
  { date: 'September 2026', title: '10,000 teams and counting', description: 'Today, product teams of every size plan, build and launch with us every day.', tag: 'Today' }
];

const PRICE_ITEMS = [
  { name: 'Brand strategy workshop', description: 'A two-day working session to define positioning, audience and voice.', price: '$2,400', badge: '', imageSrc: '' },
  { name: 'Website design', description: 'Up to eight responsive pages, designed in your component library.', price: '$8,500', badge: 'Popular', imageSrc: '' },
  { name: 'Design system audit', description: 'A review of tokens, components and accessibility, with a prioritized plan.', price: '$3,200', badge: '', imageSrc: '' },
  { name: 'Product design retainer', description: 'A senior designer embedded with your team, billed monthly.', price: '$6,000/mo', badge: '', imageSrc: '' },
  { name: 'Usability testing round', description: 'Five moderated sessions with recruited participants and a findings report.', price: '$1,900', badge: 'New', imageSrc: '' },
  { name: 'Launch support', description: 'Two weeks of hands-on QA, asset production and go-live coordination.', price: '$2,800', badge: '', imageSrc: '' }
];

const MARQUEE_ITEMS = [
  'Real-time collaboration',
  'SOC 2 Type II',
  '99.99% uptime SLA',
  'SAML SSO & SCIM',
  'Granular permissions',
  'Audit logs',
  'EU & US data residency',
  '24/7 human support'
];

const MARQUEE_LOGOS = [
  { name: 'Corvid', imageUrl: '' },
  { name: 'Fernhill', imageUrl: '' },
  { name: 'Tidewater', imageUrl: '' },
  { name: 'Halcyon', imageUrl: '' },
  { name: 'Ironbark', imageUrl: '' },
  { name: 'Quarry', imageUrl: '' },
  { name: 'Solstice', imageUrl: '' },
  { name: 'Northfield', imageUrl: '' }
];

const FEATURE_TABS = [
  {
    title: 'Plan in one place',
    description: 'Roadmaps, sprints and specs live side by side, so priorities stay visible to everyone.',
    icon: 'Kanban',
    imageSrc: ''
  },
  {
    title: 'Automate the busywork',
    description: 'Rules route requests, update statuses and notify owners the moment work changes hands.',
    icon: 'Lightning',
    imageSrc: ''
  },
  {
    title: 'Measure what matters',
    description: 'Live dashboards show cycle time, throughput and risk without exporting a single spreadsheet.',
    icon: 'ChartLineUp',
    imageSrc: ''
  },
  {
    title: 'Stay secure by default',
    description: 'Single sign-on, audit logs and fine-grained permissions come standard on every plan.',
    icon: 'ShieldCheck',
    imageSrc: ''
  }
];

const STATS = [
  { value: '4.2M', label: 'Tasks automated every week' },
  { value: '99.99%', label: 'Uptime over the last 12 months' },
  { value: '38%', label: 'Average reduction in cycle time' },
  { value: '140+', label: 'Countries with active teams' }
];

const FAQ = [
  { question: 'How long does it take to get started?', answer: 'Most teams are up and running in under an hour. Import your existing work, invite teammates and start from one of our templates.' },
  { question: 'Can I change plans later?', answer: 'Yes. Upgrade, downgrade or cancel at any time from your billing settings. Changes are prorated to the day.' },
  { question: 'Is my data secure?', answer: 'All data is encrypted in transit and at rest. We are SOC 2 Type II certified and offer EU and US data residency.' },
  { question: 'Do you offer discounts for nonprofits and education?', answer: 'We offer 50% off every paid plan for registered nonprofits and accredited schools. Contact our team to apply.' },
  { question: 'What kind of support is included?', answer: 'Every plan includes email support with a one-business-day response time. Business plans add live chat and a named success manager.' }
];

/* -------------------------------------------------------------------------- */
/* Manifests                                                                   */
/* -------------------------------------------------------------------------- */

export const SHOWCASE_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'marketing/testimonial-carousel': {
    type: 'marketing/testimonial-carousel',
    displayName: 'Testimonial Carousel',
    category: 'marketing',
    description: 'Customer quotes in an accessible carousel with arrows, dots, ratings and optional autoplay.',
    icon: 'Quotes',
    component: 'TestimonialCarousel',
    isSection: true,
    keywords: ['testimonials', 'reviews', 'quotes', 'slider', 'carousel', 'social proof', 'customers', 'rating'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'Customer stories', heading: 'Loved by teams who ship every day', subheading: '' }),
      testimonials: z
        .array(
          z.object({
            quote: z.string().default(''),
            author: z.string().default(''),
            role: z.string().default(''),
            company: z.string().default(''),
            avatarSrc: z.string().default(''),
            rating: z.number().int().min(0).max(5).default(5)
          })
        )
        .default([]),
      variant: z.enum(['single-large', 'cards-row']).default('single-large'),
      autoplay: z.boolean().default(false),
      interval: z.number().int().min(3000).max(20000).default(6000),
      showRating: z.boolean().default(true)
    }),
    defaultProps: {
      eyebrow: 'Customer stories',
      heading: 'Loved by teams who ship every day',
      subheading: 'Product, design and operations leaders on what changed after they switched.',
      align: 'center',
      testimonials: TESTIMONIALS,
      variant: 'single-large',
      autoplay: false,
      interval: 6000,
      showRating: true
    },
    propControls: {
      ...headerControls(),
      testimonials: { label: 'Testimonials', help: 'Leave the avatar empty to show initials on a generated gradient. Rating 0 hides the stars.', group: 'Items' },
      variant: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'single-large', label: 'Single large quote' },
          { value: 'cards-row', label: 'Row of cards' }
        ],
        group: 'Settings'
      },
      autoplay: { label: 'Autoplay', help: 'Advances automatically; pauses on hover or focus and never runs for visitors who prefer reduced motion.', group: 'Settings' },
      interval: { label: 'Autoplay interval', type: 'number', min: 3000, max: 20000, step: 500, unit: 'ms', group: 'Settings' },
      showRating: { label: 'Show star rating', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'WAI-ARIA carousel: a region with aria-roledescription="carousel"; each testimonial is a group with aria-roledescription="slide" and aria-label "N of M". Slides that are not visible are aria-hidden and inert.',
      '`variant: "single-large"` shows one large quote at a time in a soft panel and crossfades between slides. `variant: "cards-row"` shows 1 card per view on mobile, 2 from 768px and 3 from 1024px, and slides the row by one card.',
      'Previous / next buttons wrap around; one dot button per position (aria-current on the active one). Horizontal swipes of more than 40px on touch devices move to the next or previous slide. Controls are hidden when everything fits in one view.',
      'With `autoplay` the carousel advances every `interval` ms (clamped to 3000–20000). Rotation pauses while the pointer is over the carousel or keyboard focus is inside it, and resumes when it leaves. A pause / play button (first control) stops rotation until pressed again. The slide container is aria-live="off" while rotating and "polite" otherwise.',
      'When the visitor prefers reduced motion autoplay never runs and the pause button is not rendered.',
      'Each testimonial shows an optional star row (rating 1–5, "Rated N out of 5" for screen readers; hidden when `showRating` is false or rating is 0), the quote, and the author with role and company. An empty `avatarSrc` renders the author initials on a gradient derived deterministically from the author name.'
    ]
  },

  'marketing/team': {
    type: 'marketing/team',
    displayName: 'Team',
    category: 'marketing',
    description: 'A grid of team members with photos, roles, short bios and social links.',
    icon: 'UsersThree',
    component: 'Team',
    isSection: true,
    keywords: ['team', 'people', 'staff', 'about', 'members', 'founders', 'employees', 'leadership'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'Our team', heading: 'The people behind the product', subheading: '' }),
      members: z
        .array(
          z.object({
            name: z.string().default(''),
            role: z.string().default(''),
            photoSrc: z.string().default(''),
            bio: z.string().default(''),
            links: z
              .array(
                z.object({
                  network: z.enum(['linkedin', 'x', 'github', 'dribbble', 'instagram', 'website', 'email']).default('website'),
                  href: z.string().default('')
                })
              )
              .default([])
          })
        )
        .default([]),
      columns: z.number().int().min(2).max(4).default(4),
      variant: z.enum(['cards', 'minimal', 'overlay']).default('cards')
    }),
    defaultProps: {
      eyebrow: 'Our team',
      heading: 'The people behind the product',
      subheading: 'A small, senior team of builders who have shipped software used by millions.',
      align: 'center',
      members: TEAM,
      columns: 4,
      variant: 'cards'
    },
    propControls: {
      ...headerControls(),
      members: { label: 'Members', help: 'Leave the photo empty to show initials on a gradient generated from the name.', group: 'Items' },
      columns: { label: 'Columns', type: 'number', min: 2, max: 4, step: 1, help: 'Columns on desktop. Tablets show 2 (minimal: 3), phones 1 (minimal: 2).', group: 'Settings' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'cards', label: 'Cards' },
          { value: 'minimal', label: 'Minimal (round avatars)' },
          { value: 'overlay', label: 'Photo overlay' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'Members render as a list: 1 column on mobile, 2 from 768px, `columns` (2–4) from 1024px. The minimal style shows 2 per row on mobile and up to 3 on tablet.',
      '`variant: "cards"` is a bordered card with a 4:3 photo on top; `"minimal"` is a centered round 112px avatar with text below; `"overlay"` places name, role and links on a 4:5 photo over a dark gradient scrim, with the bio below the photo.',
      'An empty `photoSrc` renders the initials (first and last name) on a gradient whose hue is derived deterministically from the name, so the same name always gets the same colors.',
      'Each social link is an icon link (LinkedIn, X, GitHub, Dribbble, Instagram, website, email) with an accessible name such as "Elena Marsh on LinkedIn"; hrefs pass the URL policy.'
    ]
  },

  'marketing/steps': {
    type: 'marketing/steps',
    displayName: 'Steps',
    category: 'marketing',
    description: 'A numbered process that explains how something works, step by step.',
    icon: 'Footprints',
    component: 'Steps',
    isSection: true,
    keywords: ['steps', 'process', 'how it works', 'workflow', 'onboarding', 'numbered', 'stages'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'How it works', heading: 'Up and running in an afternoon', subheading: '' }),
      steps: z
        .array(z.object({ title: z.string().default(''), description: z.string().default(''), icon: z.string().default('Sparkle') }))
        .default([]),
      layout: z.enum(['horizontal', 'vertical']).default('horizontal'),
      numbering: z.enum(['numbers', 'icons']).default('numbers')
    }),
    defaultProps: {
      eyebrow: 'How it works',
      heading: 'Up and running in an afternoon',
      subheading: 'No migration project, no consultants. Four steps take your team from sign-up to shipping.',
      align: 'center',
      steps: STEPS,
      layout: 'horizontal',
      numbering: 'numbers'
    },
    propControls: {
      ...headerControls(),
      steps: { label: 'Steps', group: 'Items' },
      layout: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ],
        help: 'Horizontal steps stack vertically on phones.',
        group: 'Settings'
      },
      numbering: {
        label: 'Markers',
        type: 'select',
        options: [
          { value: 'numbers', label: 'Numbers' },
          { value: 'icons', label: 'Icons' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'Steps are an ordered list (<ol>). Each step has a 48px marker (its number, or its icon when `numbering: "icons"`), a title (h3) and a description; markers are joined by 1px connector lines.',
      '`layout: "horizontal"` places steps in one row (from 768px for up to 3 steps, from 1024px for 4 or more) with horizontal connectors; below that, and for `layout: "vertical"`, steps stack with a vertical connector running from marker to marker.',
      'Header `align: "center"` also centers horizontal steps (markers centered above the text); vertical steps are always left-aligned within a centered column.'
    ]
  },

  'marketing/timeline': {
    type: 'marketing/timeline',
    displayName: 'Timeline',
    category: 'marketing',
    description: 'A vertical timeline of dated milestones for company history, roadmaps or changelogs.',
    icon: 'ClockCounterClockwise',
    component: 'Timeline',
    isSection: true,
    keywords: ['timeline', 'history', 'milestones', 'roadmap', 'changelog', 'story', 'events', 'chronology'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'Our story', heading: 'From a two-room office to 10,000 teams', subheading: '' }),
      events: z
        .array(
          z.object({
            date: z.string().default(''),
            title: z.string().default(''),
            description: z.string().default(''),
            tag: z.string().default('')
          })
        )
        .default([]),
      layout: z.enum(['alternating', 'left']).default('alternating')
    }),
    defaultProps: {
      eyebrow: 'Our story',
      heading: 'From a two-room office to 10,000 teams',
      subheading: 'The milestones that shaped the company, and the customers who got us here.',
      align: 'center',
      events: TIMELINE,
      layout: 'alternating'
    },
    propControls: {
      ...headerControls(),
      events: { label: 'Events', help: 'Dates are free text, e.g. "Q3 2025" or "March 2019".', group: 'Items' },
      layout: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'alternating', label: 'Alternating' },
          { value: 'left', label: 'Left aligned' }
        ],
        help: 'Alternating falls back to left aligned below 1024px.',
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'Events are an ordered list (<ol>) along a 1px vertical line; each event has a primary dot on the line, the date, an optional tag pill, a title (h3) and a description in a bordered card.',
      '`layout: "alternating"` (from 1024px) centers the line and alternates cards right and left of it, with the date shown on the opposite side of the dot. Below 1024px, and for `layout: "left"`, the line sits on the left and every card is to its right with the date above the card.'
    ]
  },

  'marketing/price-list': {
    type: 'marketing/price-list',
    displayName: 'Price List',
    category: 'marketing',
    description: 'A menu-style list of services or products with descriptions, prices and badges.',
    icon: 'Receipt',
    component: 'PriceList',
    isSection: true,
    keywords: ['price list', 'menu', 'services', 'rates', 'pricing', 'restaurant', 'catalog', 'leader'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'Services', heading: 'Simple, transparent rates', subheading: '' }),
      items: z
        .array(
          z.object({
            name: z.string().default(''),
            description: z.string().default(''),
            price: z.string().default(''),
            badge: z.string().default(''),
            imageSrc: z.string().default('')
          })
        )
        .default([]),
      leader: z.boolean().default(true),
      columns: z.number().int().min(1).max(2).default(2)
    }),
    defaultProps: {
      eyebrow: 'Services',
      heading: 'Simple, transparent rates',
      subheading: 'Fixed prices for well-defined engagements. Every project starts with a free scoping call.',
      align: 'center',
      items: PRICE_ITEMS,
      leader: true,
      columns: 2
    },
    propControls: {
      ...headerControls(),
      items: { label: 'Items', help: 'Badge and image are optional; prices are free text such as "$1,200" or "from $90/h".', group: 'Items' },
      leader: { label: 'Dotted leader', help: 'Draws a dotted line between each name and its price.', group: 'Settings' },
      columns: { label: 'Columns', type: 'number', min: 1, max: 2, step: 1, help: 'Two columns from 768px; always one on phones.', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'Items are a list: 1 column on mobile; `columns: 2` shows two columns from 768px.',
      'Each item shows an optional 64px rounded thumbnail (only when `imageSrc` is set), the name (h3) with an optional badge pill, the price aligned right on the same baseline, and the description below.',
      'With `leader: true` a dotted line fills the space between name and price; it is decorative (aria-hidden).'
    ]
  },

  'ui/flip-box': {
    type: 'ui/flip-box',
    displayName: 'Flip Box',
    category: 'ui',
    description: 'A card that flips on hover or click to reveal details and a call to action on its back.',
    icon: 'CardsThree',
    component: 'FlipBox',
    keywords: ['flip', 'flip box', 'card', 'hover', 'reveal', 'rotate', 'back', '3d'],
    propsSchema: z.object({
      frontIcon: iconToken().default('Lightning'),
      frontTitle: z.string().default('Instant answers'),
      frontText: z.string().default(''),
      backTitle: z.string().default(''),
      backText: z.string().default(''),
      ctaText: z.string().default(''),
      ctaHref: z.string().default(''),
      trigger: z.enum(['hover', 'click']).default('hover'),
      direction: z.enum(['horizontal', 'vertical']).default('horizontal'),
      height: z.number().int().min(200).max(640).default(320)
    }),
    defaultProps: {
      frontIcon: 'Lightning',
      frontTitle: 'Instant answers',
      frontText: 'Search every document, ticket and conversation your team has ever written.',
      backTitle: 'Find anything in seconds',
      backText: 'Results rank by relevance and recency, respect permissions, and link straight to the source.',
      ctaText: 'Explore search',
      ctaHref: '/features',
      trigger: 'hover',
      direction: 'horizontal',
      height: 320
    },
    propControls: {
      frontIcon: { label: 'Front icon', type: 'icon', group: 'Front' },
      frontTitle: { label: 'Front title', group: 'Front' },
      frontText: { label: 'Front text', type: 'textarea', group: 'Front' },
      backTitle: { label: 'Back title', group: 'Back' },
      backText: { label: 'Back text', type: 'textarea', group: 'Back' },
      ctaText: { label: 'Button text', help: 'Leave empty to hide the button.', group: 'Back' },
      ctaHref: { label: 'Button link', type: 'url', group: 'Back' },
      trigger: {
        label: 'Flip on',
        type: 'select',
        options: [
          { value: 'hover', label: 'Hover' },
          { value: 'click', label: 'Click' }
        ],
        help: 'Touch devices always flip on tap; keyboard users use the flip button.',
        group: 'Settings'
      },
      direction: {
        label: 'Flip direction',
        type: 'select',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ],
        group: 'Settings'
      },
      height: { label: 'Height', type: 'number', min: 200, max: 640, step: 10, unit: 'px', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'A card of fixed `height` (px, 200–640) and full available width (max 28rem) with two faces. Front: icon tile, title, text. Back (primary color): title, text and an optional CTA link.',
      '`trigger: "hover"`: on devices with a hover-capable pointer the card flips while hovered. `trigger: "click"`: a click anywhere on the card flips it and a second click flips it back. On touch devices (hover: none) a tap toggles in both modes.',
      'A full-card toggle button (aria-pressed, label "Flip card: <front title>") handles Enter / Space for keyboard users in both modes; Escape flips back to the front. Focusing the back CTA flips the card so the focused link is visible.',
      'Both faces stay in the accessibility tree (neither is aria-hidden), so screen readers can read front and back content regardless of the flip state.',
      '`direction: "horizontal"` rotates around the vertical axis, `"vertical"` around the horizontal axis (600ms). With prefers-reduced-motion the faces swap with a short opacity crossfade instead of a 3D rotation.'
    ]
  },

  'ui/cta-box': {
    type: 'ui/cta-box',
    displayName: 'Call to Action Box',
    category: 'ui',
    description: 'A promotional card with optional image, headline, supporting copy, ribbon and two buttons.',
    icon: 'CursorClick',
    component: 'CtaBox',
    keywords: ['cta', 'call to action', 'promo', 'offer', 'banner', 'card', 'ribbon', 'signup'],
    propsSchema: z.object({
      imageUrl: imageUrl().default(''),
      imagePosition: z.enum(['none', 'left', 'right', 'top', 'background']).default('right'),
      eyebrow: z.string().default(''),
      title: z.string().default('Start building today'),
      description: z.string().default(''),
      primaryCtaText: z.string().default('Get started'),
      primaryCtaHref: z.string().default('/dashboard'),
      secondaryCtaText: z.string().default(''),
      secondaryCtaHref: z.string().default(''),
      ribbon: z.string().default(''),
      variant: z.enum(['light', 'dark', 'primary']).default('light')
    }),
    defaultProps: {
      imageUrl: '',
      imagePosition: 'right',
      eyebrow: 'Free for 14 days',
      title: 'Start building with your whole team today',
      description: 'Unlimited projects, real-time collaboration and priority support. No credit card required.',
      primaryCtaText: 'Start free trial',
      primaryCtaHref: '/dashboard',
      secondaryCtaText: 'Compare plans',
      secondaryCtaHref: '/pricing',
      ribbon: '',
      variant: 'light'
    },
    propControls: {
      imageUrl: { label: 'Image', type: 'image', help: 'Decorative image. Leave empty to show a neutral placeholder visual.', group: 'Media' },
      imagePosition: {
        label: 'Image position',
        type: 'select',
        options: [
          { value: 'none', label: 'No image' },
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' },
          { value: 'top', label: 'Top' },
          { value: 'background', label: 'Background with scrim' }
        ],
        group: 'Media'
      },
      eyebrow: { label: 'Eyebrow', help: 'Leave empty to hide it.', group: 'Content' },
      title: { label: 'Title', group: 'Content' },
      description: { label: 'Description', type: 'textarea', group: 'Content' },
      ribbon: { label: 'Ribbon', help: 'Corner ribbon text such as "New" or "Limited offer". Leave empty to hide it.', group: 'Content' },
      primaryCtaText: { label: 'Primary button text', group: 'Buttons' },
      primaryCtaHref: { label: 'Primary button link', type: 'url', group: 'Buttons' },
      secondaryCtaText: { label: 'Secondary button text', help: 'Leave empty to hide it.', group: 'Buttons' },
      secondaryCtaHref: { label: 'Secondary button link', type: 'url', group: 'Buttons' },
      variant: {
        label: 'Color',
        type: 'select',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'primary', label: 'Primary' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'A rounded card: eyebrow, title (h2), description and up to two buttons (primary filled, secondary outlined; a button is omitted when its text is empty).',
      '`imagePosition` "left" / "right" splits the card into copy and media columns from 768px (media stacks above the copy below 768px); "top" places a 16:9 media band above the copy; "background" covers the card with the image under a dark gradient scrim and switches text to white; "none" renders copy only.',
      'The image is decorative (empty alt). Without `imageUrl` the media area shows a neutral placeholder frame with an icon (for "background", a primary gradient).',
      '`variant`: "light" (white surface, 1px border), "dark" (near-black surface, light text) or "primary" (primary color, on-primary text); button colors adapt to the surface.',
      'A non-empty `ribbon` shows a diagonal corner ribbon in the top-right corner.'
    ]
  },

  'marketing/marquee': {
    type: 'marketing/marquee',
    displayName: 'Marquee',
    category: 'marketing',
    description: 'A continuously scrolling ticker of short phrases or logo wordmarks.',
    icon: 'ArrowsHorizontal',
    component: 'Marquee',
    isSection: true,
    keywords: ['marquee', 'ticker', 'scrolling', 'logos', 'logo cloud', 'trusted by', 'carousel', 'banner'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: '', heading: '', subheading: '' }),
      variant: z.enum(['text', 'logos']).default('text'),
      items: z.array(z.string()).default([]),
      logos: z.array(z.object({ name: z.string().default(''), imageUrl: z.string().default('') })).default([]),
      speed: z.enum(['slow', 'normal', 'fast']).default('normal'),
      direction: z.enum(['left', 'right']).default('left'),
      pauseOnHover: z.boolean().default(true),
      separator: z.enum(['none', 'dot', 'sparkle', 'star', 'diamond', 'slash']).default('sparkle'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      fadeEdges: z.boolean().default(true)
    }),
    defaultProps: {
      eyebrow: '',
      heading: '',
      subheading: '',
      align: 'center',
      variant: 'text',
      items: MARQUEE_ITEMS,
      logos: MARQUEE_LOGOS,
      speed: 'normal',
      direction: 'left',
      pauseOnHover: true,
      separator: 'sparkle',
      size: 'md',
      fadeEdges: true
    },
    propControls: {
      ...headerControls(),
      variant: {
        label: 'Content',
        type: 'select',
        options: [
          { value: 'text', label: 'Text phrases' },
          { value: 'logos', label: 'Logos' }
        ],
        group: 'Settings'
      },
      items: { label: 'Phrases', help: 'Shown when Content is "Text phrases".', group: 'Items' },
      logos: { label: 'Logos', help: 'Shown when Content is "Logos". Without an image the name renders as a wordmark.', group: 'Items' },
      speed: {
        label: 'Speed',
        type: 'select',
        options: [
          { value: 'slow', label: 'Slow' },
          { value: 'normal', label: 'Normal' },
          { value: 'fast', label: 'Fast' }
        ],
        group: 'Settings'
      },
      direction: {
        label: 'Direction',
        type: 'select',
        options: [
          { value: 'left', label: 'Right to left' },
          { value: 'right', label: 'Left to right' }
        ],
        group: 'Settings'
      },
      pauseOnHover: { label: 'Pause on hover', group: 'Settings' },
      separator: {
        label: 'Separator',
        type: 'select',
        options: [
          { value: 'none', label: 'None' },
          { value: 'dot', label: 'Dot' },
          { value: 'sparkle', label: 'Sparkle' },
          { value: 'star', label: 'Star' },
          { value: 'diamond', label: 'Diamond' },
          { value: 'slash', label: 'Slash' }
        ],
        group: 'Settings'
      },
      size: {
        label: 'Text size',
        type: 'select',
        options: [
          { value: 'sm', label: 'Small' },
          { value: 'md', label: 'Medium' },
          { value: 'lg', label: 'Large' }
        ],
        group: 'Settings'
      },
      fadeEdges: { label: 'Fade edges', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'Pure CSS infinite scroll: the item list is rendered twice side by side (the duplicate is aria-hidden) and both copies translate by their own width plus the gap, so the loop is seamless. One loop takes the number of items × 6s (slow), 4s (normal) or 2.5s (fast).',
      '`variant: "text"` shows `items` (strings) with the chosen `separator` icon between them; `variant: "logos"` shows `logos` as images (max height 32px, alt = name) or, without an image, as a wordmark of the name.',
      '`direction: "left"` scrolls right-to-left, `"right"` left-to-right. `pauseOnHover` pauses the animation while hovered; keyboard focus inside also pauses it.',
      'A pause / play toggle (aria-pressed) is visible on touch devices and appears on hover or keyboard focus elsewhere (WCAG 2.2.2).',
      '`fadeEdges` masks both edges with a transparent gradient. With prefers-reduced-motion there is no animation: the duplicate is removed and the items wrap into a static centered row.'
    ]
  },

  'marketing/feature-tabs': {
    type: 'marketing/feature-tabs',
    displayName: 'Feature Tabs',
    category: 'marketing',
    description: 'A vertical list of features that switches a large media panel, built on the accessible tabs pattern.',
    icon: 'SidebarSimple',
    component: 'FeatureTabs',
    isSection: true,
    keywords: ['features', 'tabs', 'showcase', 'product tour', 'media', 'screenshots', 'switcher', 'benefits'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'Platform', heading: 'One workspace for the entire workflow', subheading: '', align: 'left' }),
      tabs: z
        .array(
          z.object({
            title: z.string().default(''),
            description: z.string().default(''),
            icon: z.string().default('Sparkle'),
            imageSrc: z.string().default('')
          })
        )
        .default([])
    }),
    defaultProps: {
      eyebrow: 'Platform',
      heading: 'One workspace for the entire workflow',
      subheading: 'Plan, automate and measure without switching tools. Everything stays connected, so nothing falls through the cracks.',
      align: 'left',
      tabs: FEATURE_TABS
    },
    propControls: {
      ...headerControls(),
      tabs: { label: 'Tabs', help: 'Each tab switches the media panel. Without an image the panel shows an illustrative product preview.', group: 'Items' }
    },
    slots: [],
    behaviour: [
      HEADER_BEHAVIOUR,
      'Two columns from 1024px: a vertical tab list (5/12) and a media panel (7/12); stacked below 1024px with the tab list first.',
      'WAI-ARIA tabs pattern with automatic activation: role=tablist (aria-orientation="vertical") / tab / tabpanel, roving tabindex, ArrowUp/ArrowLeft and ArrowDown/ArrowRight move to the previous / next tab (wrapping), Home / End jump to the first / last. The first tab is selected initially.',
      'Each tab shows its icon and title; the selected tab is highlighted with an accent bar and expands to reveal its description.',
      'The panel shows the selected tab image (alt = tab title, 4:3, object-fit cover) or, without an image, an illustrative product-window placeholder (role="img", labelled with the tab title).'
    ]
  },

  'marketing/stats-split': {
    type: 'marketing/stats-split',
    displayName: 'Stats with Media',
    category: 'marketing',
    description: 'A headline, paragraph and 2×2 grid of big numbers next to an image or visual.',
    icon: 'ChartLineUp',
    component: 'StatsSplit',
    isSection: true,
    keywords: ['stats', 'numbers', 'metrics', 'kpi', 'results', 'proof', 'split', 'image'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'By the numbers', heading: 'Built for scale, trusted in production', subheading: '' }, false),
      stats: z.array(z.object({ value: z.string().default(''), label: z.string().default('') })).default([]),
      ctaText: z.string().default(''),
      ctaHref: z.string().default(''),
      imageUrl: imageUrl().default(''),
      imagePosition: z.enum(['left', 'right']).default('right')
    }),
    defaultProps: {
      eyebrow: 'By the numbers',
      heading: 'Built for scale, trusted in production',
      subheading: 'From fast-growing startups to global enterprises, teams rely on the platform for the work that matters most.',
      stats: STATS,
      ctaText: 'Read customer stories',
      ctaHref: '/features',
      imageUrl: '',
      imagePosition: 'right'
    },
    propControls: {
      ...headerControls(false),
      stats: { label: 'Stats', help: 'Four stats fill the 2×2 grid; values are free text such as "38%" or "4.2M".', group: 'Items' },
      ctaText: { label: 'Link text', help: 'Leave empty to hide the link.', group: 'Buttons' },
      ctaHref: { label: 'Link', type: 'url', group: 'Buttons' },
      imageUrl: { label: 'Image', type: 'image', help: 'Decorative image. Leave empty to show an illustrative chart visual.', group: 'Media' },
      imagePosition: {
        label: 'Image side',
        type: 'select',
        options: [
          { value: 'left', label: 'Left' },
          { value: 'right', label: 'Right' }
        ],
        group: 'Media'
      }
    },
    slots: [],
    behaviour: [
      'Two columns from 1024px (copy and visual; `imagePosition` picks the visual side); stacked below 1024px with the copy first.',
      'Copy column: optional eyebrow, heading (h2), subheading, a 2-column grid of stats (a <dl>: big value with its label below, separated by 1px top rules), and an optional text link with an arrow.',
      'Visual column: the image (decorative, empty alt, 4:5 on desktop, object-fit cover, rounded) or, without `imageUrl`, an illustrative chart placeholder that is aria-hidden.'
    ]
  },

  'marketing/faq-split': {
    type: 'marketing/faq-split',
    displayName: 'FAQ Two-Column',
    category: 'marketing',
    description: 'A two-column FAQ with heading and support link on the left and an accordion on the right.',
    icon: 'SealQuestion',
    component: 'FaqSplit',
    isSection: true,
    keywords: ['faq', 'questions', 'accordion', 'help', 'support', 'answers', 'two column', 'split'],
    propsSchema: z.object({
      ...headerFields({ eyebrow: 'Support', heading: 'Frequently asked questions', subheading: '' }, false),
      ctaText: z.string().default(''),
      ctaHref: z.string().default(''),
      items: z.array(z.object({ question: z.string().default(''), answer: z.string().default('') })).default([]),
      allowMultiple: z.boolean().default(false)
    }),
    defaultProps: {
      eyebrow: 'Support',
      heading: 'Frequently asked questions',
      subheading: 'Can’t find the answer you’re looking for? Our support team replies within one business day.',
      ctaText: 'Contact support',
      ctaHref: 'mailto:support@example.com',
      items: FAQ,
      allowMultiple: false
    },
    propControls: {
      ...headerControls(false),
      ctaText: { label: 'Support button text', help: 'Leave empty to hide the button.', group: 'Buttons' },
      ctaHref: { label: 'Support button link', type: 'url', group: 'Buttons' },
      items: { label: 'Questions', group: 'Items' },
      allowMultiple: { label: 'Allow several open', help: 'When off, opening a question closes the others.', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Two columns from 1024px (5/12 intro, 7/12 accordion; the intro column is sticky while scrolling); stacked below 1024px.',
      'Intro column: optional eyebrow, heading (h2), subheading and an outlined support button (omitted when `ctaText` is empty).',
      'Accordion: each question is an h3 containing a <button> with aria-expanded and aria-controls; each answer is a region labelled by its button and hidden when closed. The first item is open initially. With `allowMultiple: false` opening an item closes the others; clicking an open item closes it.'
    ]
  }
};
