import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';
import { safeSrc } from '../svelte/lib/href.js';

/**
 * Site structure: navigation menu, site header, centered and form heroes, alternating features,
 * bento, blog and portfolio grids, comparison table and cookie consent bar.
 */

/** Media URL: empty, or a URL the runtime renders (relative or http/https). Unsafe values fall back to the default. */
const mediaUrl = () => z.string().refine((v) => v.trim() === '' || safeSrc(v) !== '', { message: 'Unsafe or unsupported media URL' });

const navChildSchema = z.object({
  label: z.string().default(''),
  href: z.string().default(''),
  description: z.string().default(''),
  icon: z.string().default('')
});

const navItemSchema = z.object({
  label: z.string().default(''),
  href: z.string().default(''),
  children: z.array(navChildSchema).default([])
});

export const HERO_BADGE_ICONS = ['none', 'Sparkle', 'Lightning', 'RocketLaunch', 'Megaphone', 'Star', 'Gift', 'ShieldCheck'] as const;
export const BENTO_SIZES = ['sm', 'md', 'lg', 'wide', 'tall'] as const;

const PRODUCT_MENU = [
  { label: 'Dashboards', href: '/product/dashboards', description: 'Live metrics for every team, always current.', icon: 'ChartLineUp' },
  { label: 'Anomaly alerts', href: '/product/alerts', description: 'Know the moment a number drifts.', icon: 'Bell' },
  { label: 'Data sources', href: '/integrations', description: 'Connect 120+ tools in a few clicks.', icon: 'Plugs' },
  { label: 'Governance', href: '/product/governance', description: 'Shared definitions, access and audit logs.', icon: 'ShieldCheck' }
];

const SECTION_HEADER_CONTROLS = {
  sectionEyebrow: { label: 'Eyebrow', group: 'Header' },
  sectionTitle: { label: 'Title', group: 'Header' },
  sectionDescription: { label: 'Description', type: 'textarea' as const, group: 'Header' }
};

export const SITE_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'navigation/nav-menu': {
    type: 'navigation/nav-menu',
    displayName: 'Nav Menu',
    category: 'navigation',
    description: 'A standalone horizontal or vertical menu with dropdown and mega-menu panels for headers, footers and sidebars.',
    icon: 'ListDashes',
    component: 'NavMenu',
    keywords: ['menu', 'navigation', 'nav', 'links', 'dropdown', 'mega menu', 'submenu', 'sidebar menu', 'hamburger'],
    propsSchema: z.object({
      items: z.array(navItemSchema).default([]),
      orientation: z.enum(['horizontal', 'vertical']).default('horizontal'),
      align: z.enum(['start', 'center', 'end']).default('start'),
      variant: z.enum(['plain', 'underline', 'pills']).default('plain'),
      menuLabel: z.string().default('Menu'),
      currentHref: z.string().default('')
    }),
    defaultProps: {
      items: [
        { label: 'Product', href: '', children: PRODUCT_MENU },
        {
          label: 'Resources',
          href: '',
          children: [
            { label: 'Documentation', href: '/docs', description: '', icon: '' },
            { label: 'Guides', href: '/guides', description: '', icon: '' },
            { label: 'Changelog', href: '/changelog', description: '', icon: '' },
            { label: 'System status', href: '/status', description: '', icon: '' }
          ]
        },
        { label: 'Customers', href: '/customers', children: [] },
        { label: 'Pricing', href: '/pricing', children: [] }
      ],
      orientation: 'horizontal',
      align: 'start',
      variant: 'plain',
      menuLabel: 'Menu',
      currentHref: ''
    },
    propControls: {
      items: {
        label: 'Menu items',
        help: 'Items with children open a dropdown; when any child has a description the dropdown becomes a two-column mega panel with icons.',
        group: 'Items'
      },
      orientation: {
        label: 'Orientation',
        type: 'select',
        options: [
          { value: 'horizontal', label: 'Horizontal' },
          { value: 'vertical', label: 'Vertical' }
        ],
        group: 'Settings'
      },
      align: {
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'start', label: 'Start' },
          { value: 'center', label: 'Center' },
          { value: 'end', label: 'End' }
        ],
        group: 'Settings'
      },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'plain', label: 'Plain' },
          { value: 'underline', label: 'Underline' },
          { value: 'pills', label: 'Pills' }
        ],
        group: 'Settings'
      },
      menuLabel: { label: 'Menu label', help: 'Shown on the mobile menu button and used as the navigation landmark name.', group: 'Content' },
      currentHref: { label: 'Current page link', type: 'url', help: 'The item with this link is highlighted and marked aria-current="page".', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'A <nav> landmark (aria-label = `menuLabel`) containing a list of links. Horizontal menus wrap and align start/center/end; vertical menus stack (footer/sidebar use) and expand children inline.',
      'Styles: "plain" shows a soft hover background; "underline" draws a 2px primary bar under the hovered/current link (a left bar when vertical); "pills" uses rounded pill hovers and a secondary-container pill for the current link. The link whose href equals `currentHref` gets aria-current="page".',
      'An item with children renders as a disclosure <button aria-expanded aria-controls> with a rotating caret (its own href is not used); the panel below lists the children. If any child has a description the panel becomes a 36rem two-column mega panel where each link shows an icon tile, label and description; otherwise it is a compact list.',
      'Keyboard/pointer (WAI-ARIA disclosure navigation pattern): only one panel is open at a time; Escape closes it and returns focus to its button; ArrowDown/ArrowUp on a button opens the panel and focuses the first/last link; arrows, Home and End move between links inside a panel; moving focus out of the item or pressing outside the menu closes the panel.',
      'Below 768px a horizontal menu collapses into a "Menu" button (aria-expanded) that opens a right-hand drawer (min(22rem, 88vw)) over a dimmed backdrop: focus moves to the close button, Tab is trapped inside, Escape or an outside press closes it and focus returns to the menu button, page scroll is locked while open, and dropdowns become inline accordions. Animations collapse with prefers-reduced-motion.'
    ]
  },

  'site/header': {
    type: 'site/header',
    displayName: 'Header',
    category: 'site',
    description: 'A full site header with logo, dropdown navigation, two calls to action, an optional announcement strip and a mobile drawer.',
    icon: 'Browser',
    component: 'SiteHeader',
    keywords: ['header', 'navbar', 'navigation', 'top bar', 'menu', 'logo', 'sticky header', 'announcement', 'mega menu'],
    propsSchema: z.object({
      brandName: z.string().default('Halden'),
      brandHref: z.string().default('/'),
      logoUrl: mediaUrl().default(''),
      links: z.array(navItemSchema).default([]),
      ctaText: z.string().default('Get started'),
      ctaHref: z.string().default('/signup'),
      secondaryCtaText: z.string().default(''),
      secondaryCtaHref: z.string().default('/login'),
      layout: z.enum(['logo-left', 'centered-logo', 'split']).default('logo-left'),
      sticky: z.boolean().default(true),
      transparent: z.boolean().default(false),
      announcement: z.string().default(''),
      announcementLinkText: z.string().default(''),
      announcementHref: z.string().default('')
    }),
    defaultProps: {
      brandName: 'Halden',
      brandHref: '/',
      logoUrl: '',
      links: [
        { label: 'Product', href: '', children: PRODUCT_MENU },
        {
          label: 'Solutions',
          href: '',
          children: [
            { label: 'Product teams', href: '/solutions/product', description: '', icon: '' },
            { label: 'Finance', href: '/solutions/finance', description: '', icon: '' },
            { label: 'Operations', href: '/solutions/operations', description: '', icon: '' },
            { label: 'Engineering', href: '/solutions/engineering', description: '', icon: '' }
          ]
        },
        { label: 'Customers', href: '/customers', children: [] },
        { label: 'Pricing', href: '/pricing', children: [] },
        { label: 'Docs', href: '/docs', children: [] }
      ],
      ctaText: 'Start free trial',
      ctaHref: '/signup',
      secondaryCtaText: 'Sign in',
      secondaryCtaHref: '/login',
      layout: 'logo-left',
      sticky: true,
      transparent: false,
      announcement: 'Halden 3.0 is here: plain-English questions and a 4x faster query engine.',
      announcementLinkText: 'See what’s new',
      announcementHref: '/changelog'
    },
    propControls: {
      brandName: { label: 'Brand name', group: 'Brand' },
      brandHref: { label: 'Brand link', type: 'url', group: 'Brand' },
      logoUrl: { label: 'Logo', type: 'image', help: 'Square or wide logo shown 32px tall before the brand name. Empty shows a monogram.', group: 'Brand' },
      links: {
        label: 'Navigation links',
        help: 'Links with children open a dropdown; children with descriptions create a mega panel.',
        group: 'Navigation'
      },
      ctaText: { label: 'Primary button', group: 'Buttons' },
      ctaHref: { label: 'Primary button link', type: 'url', group: 'Buttons' },
      secondaryCtaText: { label: 'Secondary link', help: 'e.g. Sign in. Leave empty to hide.', group: 'Buttons' },
      secondaryCtaHref: { label: 'Secondary link URL', type: 'url', group: 'Buttons' },
      layout: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'logo-left', label: 'Logo left, links beside it' },
          { value: 'split', label: 'Logo left, links centered' },
          { value: 'centered-logo', label: 'Links left, logo centered' }
        ],
        group: 'Settings'
      },
      sticky: { label: 'Sticky', help: 'Keeps the bar pinned to the top while scrolling.', group: 'Settings' },
      transparent: { label: 'Transparent over hero', help: 'Overlays the next section; turns solid once the page scrolls (when sticky).', group: 'Settings' },
      announcement: { label: 'Announcement', help: 'Optional strip above the bar. Leave empty to hide.', group: 'Announcement' },
      announcementLinkText: { label: 'Announcement link text', group: 'Announcement' },
      announcementHref: { label: 'Announcement link', type: 'url', group: 'Announcement' }
    },
    slots: [],
    behaviour: [
      'A <header> with an optional 40px announcement strip (inverted colors, centered text + link with an arrow) above a 64px bar. The bar has a translucent surface background with backdrop blur and a hairline bottom border; the brand link shows `logoUrl` (32px tall) or a gradient monogram of the first letter, followed by `brandName`.',
      'Layouts from 1024px: "logo-left" = brand, links beside it, actions right; "split" = brand left, links centered, actions right (3-column grid); "centered-logo" = links left, brand centered, actions right. Actions: the secondary link as quiet text and the primary CTA as a small filled button.',
      'Links reuse the Nav Menu behaviour: links with children are disclosure buttons opening dropdown panels (two-column mega panel with icons when children have descriptions); Escape/outside press closes; arrow keys move through panel links.',
      '`sticky` pins the header (position: sticky; when an announcement exists only the strip scrolls away). After 8px of scroll a sticky header gains a soft shadow. `transparent` removes the bar background and border and pulls the next section up underneath it (negative bottom margin of the bar height); a sticky transparent header turns solid (translucent surface + blur) once the page scrolls.',
      'Below 1024px the links and secondary link hide and a menu button (44px, aria-expanded, aria-controls) opens a right-hand modal drawer (role="dialog", aria-modal) with the brand, the links as a vertical menu with accordion dropdowns, and full-width secondary + primary buttons. Focus moves into the drawer, Tab is trapped, Escape or the backdrop closes it and focus returns to the menu button; page scroll is locked while open; following a link closes it. The primary CTA stays visible in the bar from 560px.'
    ]
  },

  'hero/centered-hero': {
    type: 'hero/centered-hero',
    displayName: 'Centered Hero',
    category: 'hero',
    description: 'A centered page opener with an announcement badge, gradient-highlighted headline, two calls to action, product media and a logo row.',
    icon: 'TextAlignCenter',
    component: 'CenteredHero',
    isSection: true,
    keywords: ['hero', 'landing', 'headline', 'banner', 'above the fold', 'product shot', 'centered', 'logos', 'cta'],
    propsSchema: z.object({
      badgeText: z.string().default(''),
      badgeIcon: z.enum(HERO_BADGE_ICONS).default('none'),
      badgeHref: z.string().default(''),
      title: z.string().default('Build something people love'),
      highlight: z.string().default(''),
      subtitle: z.string().default(''),
      primaryCtaText: z.string().default('Get started'),
      primaryCtaHref: z.string().default('/signup'),
      secondaryCtaText: z.string().default(''),
      secondaryCtaHref: z.string().default(''),
      mediaType: z.enum(['none', 'image', 'product-mock', 'video-poster']).default('none'),
      mediaUrl: mediaUrl().default(''),
      videoLabel: z.string().default(''),
      videoHref: z.string().default(''),
      background: z.enum(['plain', 'grid', 'gradient-glow', 'dots']).default('plain'),
      trustText: z.string().default(''),
      trustLogos: z.array(z.string()).default([])
    }),
    defaultProps: {
      badgeText: 'New: ask Halden questions in plain English',
      badgeIcon: 'Sparkle',
      badgeHref: '/changelog',
      title: 'Every metric that matters, in one live view',
      highlight: 'in one live view',
      subtitle:
        'Halden connects your product, revenue and infrastructure data, keeps every dashboard current and tells the right owner the moment a number moves.',
      primaryCtaText: 'Start free trial',
      primaryCtaHref: '/signup',
      secondaryCtaText: 'Book a demo',
      secondaryCtaHref: '/demo',
      mediaType: 'product-mock',
      mediaUrl: '',
      videoLabel: 'Watch the 2-minute tour',
      videoHref: '',
      background: 'grid',
      trustText: 'Trusted by data-driven teams at',
      trustLogos: ['Fernway', 'Copperline', 'Quillstack', 'Brightmoor', 'Kitewave', 'Solenne']
    },
    propControls: {
      badgeText: { label: 'Badge text', help: 'Short announcement above the headline. Leave empty to hide.', group: 'Badge' },
      badgeIcon: {
        label: 'Badge icon',
        type: 'select',
        options: HERO_BADGE_ICONS.map((value) => ({ value, label: value === 'none' ? 'None' : value.replace(/([a-z])([A-Z])/g, '$1 $2') })),
        group: 'Badge'
      },
      badgeHref: { label: 'Badge link', type: 'url', help: 'Optional. Adds an arrow and makes the badge a link.', group: 'Badge' },
      title: { label: 'Headline', type: 'textarea', group: 'Content' },
      highlight: {
        label: 'Highlighted words',
        help: 'Part of the headline rendered with the accent gradient. If it is not found in the headline it is shown on its own line below it.',
        group: 'Content'
      },
      subtitle: { label: 'Subtitle', type: 'textarea', group: 'Content' },
      primaryCtaText: { label: 'Primary button', group: 'Buttons' },
      primaryCtaHref: { label: 'Primary button link', type: 'url', group: 'Buttons' },
      secondaryCtaText: { label: 'Secondary button', help: 'Leave empty to hide.', group: 'Buttons' },
      secondaryCtaHref: { label: 'Secondary button link', type: 'url', group: 'Buttons' },
      mediaType: {
        label: 'Media',
        type: 'select',
        options: [
          { value: 'product-mock', label: 'Product mock (illustration)' },
          { value: 'image', label: 'Image' },
          { value: 'video-poster', label: 'Video poster' },
          { value: 'none', label: 'None' }
        ],
        group: 'Media'
      },
      mediaUrl: { label: 'Image', type: 'image', help: 'Screenshot or poster image (16:10). Image and video-poster modes.', group: 'Media' },
      videoLabel: { label: 'Play button label', group: 'Media' },
      videoHref: { label: 'Video link', type: 'url', help: 'Optional. Makes the play button a link to the video.', group: 'Media' },
      background: {
        label: 'Background',
        type: 'select',
        options: [
          { value: 'grid', label: 'Grid' },
          { value: 'dots', label: 'Dots' },
          { value: 'gradient-glow', label: 'Gradient glow' },
          { value: 'plain', label: 'Plain' }
        ],
        group: 'Settings'
      },
      trustText: { label: 'Logo row caption', group: 'Logos' },
      trustLogos: { label: 'Company names', help: 'Rendered as neutral wordmarks.', group: 'Logos' }
    },
    slots: [],
    behaviour: [
      'Everything is centered in a 52rem column: optional pill badge (icon tile + text, plus an arrow and hover lift when `badgeHref` is set), an h1 headline (clamp 2.5rem → 4.5rem, tight tracking, balanced wrapping), an optional subtitle (max 40rem) and the CTAs (filled primary with an arrow icon, neutral outlined secondary). Below 768px the CTAs stack full width.',
      '`highlight` is matched inside `title` (first exact occurrence) and that part is rendered with a primary→tertiary gradient text fill; when it is not found it is rendered on its own line after the title.',
      'Media (max 68rem, 4rem below the copy) sits in a softly bordered frame over a blurred primary glow: "product-mock" draws a decorative CSS app window (sidebar, KPI cards, bar chart, list; aria-hidden; the sidebar and list hide on mobile); "image" shows `mediaUrl` (16:10, decorative alt="") or a dashed placeholder frame when empty; "video-poster" shows `mediaUrl` (or the product mock) under a centered play pill whose label is `videoLabel` and which links to `videoHref` when set.',
      'Backgrounds sit behind the content and fade out radially from the top: "grid" (64px hairline grid), "dots" (22px dot pattern), "gradient-glow" (soft primary/secondary/tertiary radial glows) or "plain".',
      'The optional logo row shows `trustText` and each `trustLogos` name as a neutral wordmark (six cycling typographic treatments with a small geometric glyph, ~58% on-surface). Replace them with real customer logos only with permission.'
    ]
  },

  'hero/form-hero': {
    type: 'hero/form-hero',
    displayName: 'Hero with Form',
    category: 'hero',
    description: 'A two-column page opener: headline and benefits on the left, a compact lead-capture form on the right.',
    icon: 'Notepad',
    component: 'FormHero',
    isSection: true,
    keywords: ['hero', 'lead capture', 'signup', 'trial', 'form', 'landing', 'benefits', 'conversion'],
    propsSchema: z.object({
      eyebrow: z.string().default(''),
      title: z.string().default('Grow faster with less busywork'),
      subtitle: z.string().default(''),
      benefits: z.array(z.string()).default([]),
      formTitle: z.string().default('Get started'),
      formDescription: z.string().default(''),
      nameLabel: z.string().default('Full name'),
      emailLabel: z.string().default('Work email'),
      submitText: z.string().default('Get started'),
      privacyText: z.string().default(''),
      successTitle: z.string().default('You’re all set'),
      successMessage: z.string().default('')
    }),
    defaultProps: {
      eyebrow: 'Free for 14 days',
      title: 'See your numbers clearly from day one',
      subtitle: 'Connect a data source, pick a template and share your first live dashboard in under an hour. No analysts or SQL required.',
      benefits: ['Connect your first source in minutes', 'Unlimited viewers on every plan', 'No credit card required'],
      formTitle: 'Start your free trial',
      formDescription: 'Full access to every feature for 14 days.',
      nameLabel: 'Full name',
      emailLabel: 'Work email',
      submitText: 'Create my workspace',
      privacyText: 'By continuing you agree to the Terms of Service and Privacy Policy.',
      successTitle: 'You’re in',
      successMessage: 'We will email you a link to finish setting up your workspace.'
    },
    propControls: {
      eyebrow: { label: 'Eyebrow', group: 'Content' },
      title: { label: 'Headline', type: 'textarea', group: 'Content' },
      subtitle: { label: 'Subtitle', type: 'textarea', group: 'Content' },
      benefits: { label: 'Benefits', help: 'Short lines shown with check icons.', group: 'Content' },
      formTitle: { label: 'Form title', group: 'Form' },
      formDescription: { label: 'Form description', group: 'Form' },
      nameLabel: { label: 'Name label', group: 'Form' },
      emailLabel: { label: 'Email label', group: 'Form' },
      submitText: { label: 'Submit button', group: 'Buttons' },
      privacyText: { label: 'Privacy note', type: 'textarea', group: 'Form' },
      successTitle: { label: 'Success title', group: 'Success state' },
      successMessage: { label: 'Success message', type: 'textarea', group: 'Success state' }
    },
    slots: [],
    behaviour: [
      'From 1024px two columns (1.15fr / 1fr, 5rem gap): the copy on the left (optional eyebrow pill with a dot, h1 clamp 2.25rem → 3.75rem, subtitle, benefits list with filled primary check circles) and a 28rem form card on the right; stacked below 1024px with the card full width (max 36rem). A faint primary/tertiary radial glow sits behind the card side.',
      'The card holds the form title + description, a name field and an email field (visible labels, autocomplete name/email), a full-width filled submit button with an arrow and an optional privacy note.',
      'Validation on submit (novalidate): name required, email required + format; inline errors with aria-invalid/aria-describedby, focus moves to the first invalid field, fields re-validate while typing after the first attempt.',
      'On a valid submit the card shows a focusable success panel (role="status") with the success title/message, a fixed note that the form is not connected to a backend (nothing was sent or stored) and a "Start over" button. Wire it to a real signup/lead endpoint with server-side validation, then remove the note.'
    ]
  },

  'marketing/feature-alternating': {
    type: 'marketing/feature-alternating',
    displayName: 'Alternating Features',
    category: 'marketing',
    description: 'Feature rows that alternate copy and visuals left and right, with bullets and a link per row.',
    icon: 'SquareHalf',
    component: 'FeatureAlternating',
    isSection: true,
    keywords: ['features', 'zigzag', 'alternating', 'image and text', 'benefits', 'how it works', 'rows'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('How it works'),
      sectionDescription: z.string().default(''),
      items: z
        .array(
          z.object({
            eyebrow: z.string().default(''),
            title: z.string().default(''),
            description: z.string().default(''),
            bullets: z.array(z.string()).default([]),
            imageUrl: z.string().default(''),
            imageAlt: z.string().default(''),
            ctaText: z.string().default(''),
            ctaHref: z.string().default('')
          })
        )
        .default([])
    }),
    defaultProps: {
      sectionEyebrow: 'How it works',
      sectionTitle: 'From raw data to decisions in three steps',
      sectionDescription: 'Halden handles the plumbing so your team can spend its time on what the numbers mean.',
      items: [
        {
          eyebrow: 'Organize',
          title: 'Define each metric once, reuse it everywhere',
          description:
            'Build a shared catalogue of metrics with owners, descriptions and the exact logic behind them, so every dashboard and report agrees on what revenue means.',
          bullets: ['Versioned metric definitions', 'Owners and review status per metric', 'Automatic lineage back to the source'],
          imageUrl: '',
          imageAlt: '',
          ctaText: 'Explore the metric catalogue',
          ctaHref: '/product/governance'
        },
        {
          eyebrow: 'Monitor',
          title: 'Catch changes the moment they happen',
          description:
            'Halden learns the normal range of every metric, flags unusual movement within minutes and highlights the segment that changed, so owners can act before month-end.',
          bullets: ['Seasonality-aware thresholds', 'Alerts routed to the metric owner', 'One-click drill-down to the cause'],
          imageUrl: '',
          imageAlt: '',
          ctaText: 'See how alerts work',
          ctaHref: '/product/alerts'
        },
        {
          eyebrow: 'Share',
          title: 'Dashboards the whole company can read',
          description:
            'Publish live dashboards with plain-language annotations, schedule digests to Slack or email and give unlimited viewers access without exporting a single spreadsheet.',
          bullets: ['Unlimited viewers on every plan', 'Scheduled digests and snapshots', 'Expiring links for guests'],
          imageUrl: '',
          imageAlt: '',
          ctaText: 'Browse dashboard templates',
          ctaHref: '/templates'
        }
      ]
    },
    propControls: {
      ...SECTION_HEADER_CONTROLS,
      items: {
        label: 'Rows',
        help: 'Each row: eyebrow, title, description, bullets, optional image (4:3) with alt text and a link. Rows without an image show an illustrated placeholder.',
        group: 'Items'
      }
    },
    slots: [],
    behaviour: [
      'A centered section header, then one row per item. From 1024px each row is two columns (copy 1fr, visual 1.15fr, 5rem gap); odd rows (2nd, 4th…) swap sides so copy and visual alternate. Below 1024px rows stack with the copy above the visual; rows are 6rem apart (4rem on mobile).',
      'Copy: uppercase primary eyebrow, h3 title (clamp 1.5rem → 2rem), description, bullets with small tinted check circles and an optional text link with an arrow that nudges right on hover.',
      'Visual: `imageUrl` renders as a 4:3 rounded image (alt = `imageAlt`, lazy). Without an image a decorative, aria-hidden illustration is drawn in CSS inside a soft tinted frame, cycling per row: a kanban board, a timeline with a "today" marker, and a metrics panel with stat tiles and a bar chart.'
    ]
  },

  'marketing/bento-grid': {
    type: 'marketing/bento-grid',
    displayName: 'Bento Grid',
    category: 'marketing',
    description: 'A bento-style grid of feature cards in mixed sizes with subtle visual motifs.',
    icon: 'SquaresFour',
    component: 'BentoGrid',
    isSection: true,
    keywords: ['bento', 'features', 'grid', 'cards', 'mosaic', 'tiles', 'capabilities'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Everything in one place'),
      sectionDescription: z.string().default(''),
      items: z
        .array(
          z.object({
            title: z.string().default(''),
            description: z.string().default(''),
            icon: z.string().default('Sparkle'),
            size: z.enum(BENTO_SIZES).default('sm'),
            imageUrl: z.string().default(''),
            accent: z.boolean().default(false)
          })
        )
        .default([])
    }),
    defaultProps: {
      sectionEyebrow: 'Platform',
      sectionTitle: 'Built for the way modern teams work with data',
      sectionDescription: 'Everything you need to measure, monitor and share, without stitching together five different tools.',
      items: [
        {
          title: 'Live dashboards',
          description: 'Every chart updates as new data lands, so the numbers in your Monday review are the numbers right now.',
          icon: 'ChartLineUp',
          size: 'lg',
          imageUrl: '',
          accent: true
        },
        {
          title: 'Security by default',
          description: 'SSO, SCIM provisioning, audit logs and encryption in transit and at rest on every plan.',
          icon: 'ShieldCheck',
          size: 'tall',
          imageUrl: '',
          accent: false
        },
        {
          title: 'Anomaly alerts',
          description: 'Halden learns each metric’s normal range and alerts its owner the moment something drifts.',
          icon: 'Bell',
          size: 'md',
          imageUrl: '',
          accent: false
        },
        {
          title: 'Ask in plain English',
          description: 'Type a question, get a chart. Every answer links back to the metric definition behind it.',
          icon: 'ChatCircleText',
          size: 'md',
          imageUrl: '',
          accent: false
        },
        {
          title: 'Queries run in your warehouse',
          description: 'Computation happens where your data lives, so nothing is copied and results are always fresh.',
          icon: 'Database',
          size: 'wide',
          imageUrl: '',
          accent: false
        },
        {
          title: '120+ integrations',
          description: 'Connect your existing stack in a few clicks.',
          icon: 'Plugs',
          size: 'sm',
          imageUrl: '',
          accent: false
        }
      ]
    },
    propControls: {
      ...SECTION_HEADER_CONTROLS,
      items: {
        label: 'Cards',
        help: 'Sizes on the 6-column desktop grid: sm = 2 columns, md = 3, wide = 4, lg = 4 columns × 2 rows, tall = 2 columns × 2 rows. Accent cards get a tinted gradient.',
        group: 'Items'
      }
    },
    slots: [],
    behaviour: [
      'A centered section header above a CSS grid of cards. From 1024px: 6 columns, rows at least 15rem, `grid-auto-flow: dense`; spans sm = 2 columns, md = 3, wide = 4, lg = 4 × 2 rows, tall = 2 × 2 rows. 768–1023px: 2 columns (lg and wide span both, tall spans 2 rows). Below 768px: one column, no spans.',
      'Each card: 20px radius, hairline border, an icon tile (filled primary on accent cards), h3 title (larger on lg cards) and description. Hover tints the border toward primary and adds a soft shadow.',
      'Visual motif per size when no `imageUrl` is set (all decorative, aria-hidden): lg = concentric rings around the card icon with three floating icon chips; tall = a stack of layered cards with a success check; wide = a 12-bar chart with the last bar accented; md = a fading hairline grid with a tertiary glow; sm = a soft primary corner glow. With `imageUrl` the image fills the bottom of the card edge to edge.',
      '`accent: true` gives the card a primary-container → surface gradient with a primary radial glow.'
    ]
  },

  'marketing/blog-grid': {
    type: 'marketing/blog-grid',
    displayName: 'Blog Grid',
    category: 'marketing',
    description: 'A grid or list of blog posts with cover images, categories, dates, reading times and authors.',
    icon: 'Newspaper',
    component: 'BlogGrid',
    isSection: true,
    keywords: ['blog', 'articles', 'posts', 'news', 'resources', 'insights', 'journal', 'cards'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Latest articles'),
      sectionDescription: z.string().default(''),
      viewAllText: z.string().default(''),
      viewAllHref: z.string().default('/blog'),
      posts: z
        .array(
          z.object({
            title: z.string().default(''),
            excerpt: z.string().default(''),
            imageUrl: z.string().default(''),
            href: z.string().default(''),
            category: z.string().default(''),
            date: z.string().default(''),
            readTime: z.string().default(''),
            authorName: z.string().default(''),
            authorAvatarUrl: z.string().default('')
          })
        )
        .default([]),
      columns: z.number().int().min(2).max(3).default(3),
      variant: z.enum(['cards', 'list', 'featured-first']).default('cards')
    }),
    defaultProps: {
      sectionEyebrow: 'Blog',
      sectionTitle: 'Notes from the Halden team',
      sectionDescription: 'Product updates, engineering deep dives and practical guides to working with metrics.',
      viewAllText: 'View all posts',
      viewAllHref: '/blog',
      posts: [
        {
          title: 'How we made dashboard queries four times faster',
          excerpt: 'A look inside the new query planner: predicate pushdown, smarter caching and the benchmarks that guided every decision.',
          imageUrl: '',
          href: '/blog/faster-queries',
          category: 'Engineering',
          date: '2026-10-14',
          readTime: '8 min read',
          authorName: 'Maya Lindqvist',
          authorAvatarUrl: ''
        },
        {
          title: 'Introducing plain-English questions',
          excerpt: 'Ask Halden a question the way you would ask a colleague and get a chart, the query behind it and the metric definition it used.',
          imageUrl: '',
          href: '/blog/plain-english-questions',
          category: 'Product',
          date: '2026-10-02',
          readTime: '5 min read',
          authorName: 'Tomás Ferreira',
          authorAvatarUrl: ''
        },
        {
          title: 'A practical guide to choosing a north-star metric',
          excerpt: 'What makes a good north-star metric, the traps to avoid and a simple framework for getting your leadership team aligned.',
          imageUrl: '',
          href: '/blog/north-star-metric',
          category: 'Guides',
          date: '2026-09-21',
          readTime: '11 min read',
          authorName: 'Aisha Bello',
          authorAvatarUrl: ''
        }
      ],
      columns: 3,
      variant: 'cards'
    },
    propControls: {
      ...SECTION_HEADER_CONTROLS,
      viewAllText: { label: '“View all” link text', help: 'Leave empty to hide.', group: 'Header' },
      viewAllHref: { label: '“View all” link', type: 'url', group: 'Header' },
      posts: {
        label: 'Posts',
        help: 'Dates use ISO format (YYYY-MM-DD) and are shown like “Oct 14, 2026”.',
        group: 'Items'
      },
      columns: { label: 'Columns', type: 'number', min: 2, max: 3, step: 1, help: 'Desktop columns for the cards and featured-first layouts.', group: 'Settings' },
      variant: {
        label: 'Layout',
        type: 'select',
        options: [
          { value: 'cards', label: 'Cards' },
          { value: 'featured-first', label: 'Featured first' },
          { value: 'list', label: 'List' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'Header row: eyebrow, h2 and description on the left; an optional outlined "view all" pill link on the right (wraps below on small screens).',
      'Layouts: "cards" = grid (1 column, 2 from 768px, `columns` from 1024px); "featured-first" = the same grid with the first post spanning the full row as a horizontal card (image 1.25fr | text 1fr from 768px, larger title, 4-line excerpt); "list" = stacked rows separated by hairlines with an 18rem image beside the text from 768px.',
      'Each post: 16:10 rounded cover (`imageUrl`, lazy, decorative alt) or a tinted grid placeholder with an article icon; meta row with a category pill, the date and the reading time separated by a dot; h3 title; excerpt clamped to 3 lines; author with avatar (`authorAvatarUrl`) or initials. The title link is stretched over the whole card (one link per card), the image zooms slightly and the title turns primary on hover.',
      'Dates are ISO strings rendered in <time datetime> with Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }) so server and browser output match; unparseable dates render verbatim. Replace the sample posts with your CMS/markdown source.'
    ]
  },

  'marketing/portfolio-grid': {
    type: 'marketing/portfolio-grid',
    displayName: 'Portfolio Grid',
    category: 'marketing',
    description: 'A filterable grid of projects with category chips and hover overlays.',
    icon: 'ImagesSquare',
    component: 'PortfolioGrid',
    isSection: true,
    keywords: ['portfolio', 'projects', 'case studies', 'work', 'gallery', 'filter', 'agency', 'showcase'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Selected work'),
      sectionDescription: z.string().default(''),
      allLabel: z.string().default('All'),
      projects: z
        .array(
          z.object({
            title: z.string().default(''),
            category: z.string().default(''),
            imageUrl: z.string().default(''),
            href: z.string().default(''),
            summary: z.string().default('')
          })
        )
        .default([]),
      columns: z.number().int().min(2).max(4).default(3)
    }),
    defaultProps: {
      sectionEyebrow: 'Case studies',
      sectionTitle: 'Work we are proud of',
      sectionDescription: 'A selection of recent product, brand and web projects for teams that care about craft.',
      allLabel: 'All',
      projects: [
        { title: 'Fernway fleet dashboard', category: 'Product', imageUrl: '', href: '/work/fernway', summary: 'Real-time routing and delivery metrics for a 400-truck logistics fleet.' },
        { title: 'Solenne identity', category: 'Brand', imageUrl: '', href: '/work/solenne', summary: 'A warm, editorial identity system for a skincare start-up.' },
        { title: 'Kitewave marketing site', category: 'Web', imageUrl: '', href: '/work/kitewave', summary: 'A fast, content-driven site that doubled demo requests in a quarter.' },
        { title: 'Quillstack design system', category: 'Product', imageUrl: '', href: '/work/quillstack', summary: 'Tokens, components and docs shared by six product teams.' },
        { title: 'Brightmoor annual report', category: 'Brand', imageUrl: '', href: '/work/brightmoor', summary: 'An interactive annual report with data stories and print edition.' },
        { title: 'Copperline onboarding', category: 'Web', imageUrl: '', href: '/work/copperline', summary: 'A guided signup flow that cut time-to-first-value in half.' }
      ],
      columns: 3
    },
    propControls: {
      ...SECTION_HEADER_CONTROLS,
      allLabel: { label: '“All” filter label', group: 'Filters' },
      projects: {
        label: 'Projects',
        help: 'Filter chips are created from the project categories automatically.',
        group: 'Items'
      },
      columns: { label: 'Columns', type: 'number', min: 2, max: 4, step: 1, help: 'Desktop columns (2 columns from 640px, 1 below).', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'A centered header, then filter chips built from the unique project categories in order of first appearance, preceded by the "All" chip; each chip shows its project count. Chips are toggle buttons in a labelled group with aria-pressed; the pressed chip is filled (on-surface). Filters hide when there are fewer than two categories. Below 768px the chips scroll horizontally.',
      'Selecting a chip filters the grid locally (no navigation); a polite live region announces "Showing N projects in <category>". A filter whose category disappears falls back to "All".',
      'Grid: 1 column, 2 from 640px, `columns` from 1024px. Each project: a 4:3 rounded image (`imageUrl`, lazy) or a tinted placeholder (tone per category) with a tilted icon frame; caption with the title link (stretched over the card), summary and a category pill.',
      'On hover-capable pointers the image zooms slightly and a dark gradient overlay fades in with the summary and a "View project" cue (decorative; the summary stays available to screen readers); on touch devices the summary is shown under the title instead. Entering items fade in (instant with reduced motion).'
    ]
  },

  'marketing/comparison-table': {
    type: 'marketing/comparison-table',
    displayName: 'Comparison Table',
    category: 'marketing',
    description: 'A plan comparison table with grouped feature rows, check and dash indicators and a highlighted plan.',
    icon: 'Table',
    component: 'ComparisonTable',
    isSection: true,
    keywords: ['comparison', 'compare plans', 'pricing table', 'feature matrix', 'plans', 'tiers', 'table'],
    propsSchema: z.object({
      sectionEyebrow: z.string().default(''),
      sectionTitle: z.string().default('Compare plans'),
      sectionDescription: z.string().default(''),
      featureLabel: z.string().default('Features'),
      highlightLabel: z.string().default('Most popular'),
      plans: z
        .array(
          z.object({
            name: z.string().default(''),
            price: z.string().default(''),
            period: z.string().default(''),
            highlight: z.boolean().default(false),
            ctaText: z.string().default(''),
            ctaHref: z.string().default('')
          })
        )
        .default([]),
      rows: z
        .array(
          z.object({
            feature: z.string().default(''),
            group: z.string().default(''),
            values: z.array(z.union([z.boolean(), z.string()])).default([])
          })
        )
        .default([]),
      stickyOffset: z.number().min(0).max(400).default(0)
    }),
    defaultProps: {
      sectionEyebrow: 'Compare plans',
      sectionTitle: 'Find the right plan for your team',
      sectionDescription: 'Every plan includes unlimited viewers, live dashboards and a 14-day free trial of Team features.',
      featureLabel: 'Features',
      highlightLabel: 'Most popular',
      plans: [
        { name: 'Starter', price: '$0', period: 'free forever', highlight: false, ctaText: 'Get started', ctaHref: '/signup' },
        { name: 'Team', price: '$29', period: 'per editor / month', highlight: true, ctaText: 'Start free trial', ctaHref: '/signup?plan=team' },
        { name: 'Enterprise', price: 'Custom', period: 'billed annually', highlight: false, ctaText: 'Contact sales', ctaHref: '/contact' }
      ],
      rows: [
        { feature: 'Editors', group: 'Usage', values: ['Up to 3', 'Unlimited', 'Unlimited'] },
        { feature: 'Data sources', group: 'Usage', values: ['2', 'Unlimited', 'Unlimited'] },
        { feature: 'Data refresh', group: 'Usage', values: ['Daily', 'Every 15 minutes', 'Real time'] },
        { feature: 'History', group: 'Usage', values: ['30 days', '2 years', 'Unlimited'] },
        { feature: 'Live dashboards', group: 'Analysis', values: [true, true, true] },
        { feature: 'Anomaly alerts', group: 'Analysis', values: [false, true, true] },
        { feature: 'Plain-English questions', group: 'Analysis', values: [false, true, true] },
        { feature: 'Custom metric definitions', group: 'Analysis', values: [false, true, true] },
        { feature: 'SAML single sign-on', group: 'Security & support', values: [false, false, true] },
        { feature: 'Audit log', group: 'Security & support', values: [false, false, true] },
        { feature: 'Uptime SLA', group: 'Security & support', values: [false, false, '99.9%'] },
        { feature: 'Support', group: 'Security & support', values: ['Community', 'Email and chat', 'Dedicated manager'] }
      ],
      stickyOffset: 0
    },
    propControls: {
      ...SECTION_HEADER_CONTROLS,
      featureLabel: { label: 'Feature column heading', group: 'Table' },
      highlightLabel: { label: 'Highlighted plan badge', help: 'Badge above the highlighted plan. Leave empty to hide.', group: 'Table' },
      plans: { label: 'Plans (columns)', help: 'Name, price, period, optional button and whether the column is highlighted.', group: 'Items' },
      rows: {
        label: 'Feature rows',
        help: 'One value per plan, in plan order: true = check, false or empty = dash, any text is shown as-is. Consecutive rows with the same group share a group heading.',
        group: 'Items'
      },
      stickyOffset: {
        label: 'Sticky header offset',
        type: 'number',
        min: 0,
        max: 400,
        step: 4,
        unit: 'px',
        help: 'Set to your sticky site header height (64 for the Header component) so the plan row sticks below it.',
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'A centered header above a real <table> (caption = section title) inside a rounded bordered card: a corner heading cell (`featureLabel`), one column header per plan (optional "most popular" badge on the highlighted plan, name, price + period, optional small button: filled for the highlighted plan, neutral outline otherwise).',
      'Rows are grouped: consecutive rows with the same `group` share a full-width group heading row (<th scope="colgroup">). Each row has a <th scope="row"> feature cell and one cell per plan: true renders a check in a tinted circle (accessible name "Included"), false/empty a dash ("Not included"), text renders as-is. The highlighted plan column is tinted (primary 4%) with a 2px primary top edge.',
      'From 1024px the plan header row is sticky (top = `stickyOffset` px) while the page scrolls past the table.',
      'Below 1024px the card scrolls horizontally (the scroll region is focusable and labelled by the section title) with the feature column pinned to the left (sticky with a hairline edge); each plan column is at least 9.5rem wide.'
    ]
  },

  'site/cookie-banner': {
    type: 'site/cookie-banner',
    displayName: 'Cookie Consent',
    category: 'site',
    description: 'A fixed cookie consent bar or corner card with accept and essential-only choices.',
    icon: 'Cookie',
    component: 'CookieBanner',
    keywords: ['cookie', 'consent', 'gdpr', 'privacy', 'banner', 'ccpa', 'notice'],
    propsSchema: z.object({
      title: z.string().default('Cookie preferences'),
      message: z.string().default('We use cookies to improve your experience.'),
      policyText: z.string().default('Cookie policy'),
      policyHref: z.string().default('/legal/cookies'),
      acceptText: z.string().default('Accept all'),
      declineText: z.string().default('Essential only'),
      position: z.enum(['bottom', 'bottom-left']).default('bottom')
    }),
    defaultProps: {
      title: 'We value your privacy',
      message:
        'We use essential cookies to run this site and optional analytics cookies to understand how it is used. You can accept all cookies or keep only the essential ones.',
      policyText: 'Cookie policy',
      policyHref: '/legal/cookies',
      acceptText: 'Accept all',
      declineText: 'Essential only',
      position: 'bottom'
    },
    propControls: {
      title: { label: 'Title', group: 'Content' },
      message: { label: 'Message', type: 'textarea', group: 'Content' },
      policyText: { label: 'Policy link text', help: 'Leave empty to hide the link.', group: 'Content' },
      policyHref: { label: 'Policy link', type: 'url', group: 'Content' },
      acceptText: { label: 'Accept button', group: 'Buttons' },
      declineText: { label: 'Decline button', help: 'Leave empty to hide (not recommended: declining must be as easy as accepting).', group: 'Buttons' },
      position: {
        label: 'Position',
        type: 'select',
        options: [
          { value: 'bottom', label: 'Bottom bar' },
          { value: 'bottom-left', label: 'Bottom-left card' }
        ],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'Fixed to the viewport (z-index 900): "bottom" is a full-width bar (max 72rem, centered, 1rem from the edges) with an icon tile, title, message + policy link on the left and the buttons on the right; "bottom-left" is a 24rem card with the buttons in a full-width row. Below 768px both become a bottom sheet with equal-width 44px buttons. The region is a <section> labelled by its title and described by the message; it slides in on mount (instant with reduced motion).',
      'The essential-only and accept buttons have equal visual weight in size (decline is outlined, accept filled) so declining is as easy as accepting.',
      'Choosing either option only hides the banner for the current page view (local state): nothing is stored and no cookies are set. When implementing, persist the choice (first-party cookie or localStorage with a version and timestamp), never show the banner again once a choice exists, default to declining all non-essential cookies until the visitor explicitly accepts, load analytics/marketing scripts only after consent, and provide a way to reopen the preferences (e.g. a footer link).'
    ]
  }
};
