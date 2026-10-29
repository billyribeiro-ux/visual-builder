import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';
import { TEXT_ALIGN } from './shared.js';

/**
 * General interactive elements: accordion, counter, progress bar, star rating, social icons,
 * countdown, animated headline, breadcrumbs, announcement bar, billing toggle and modal button.
 */

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' }
];

const SIZE_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' }
];

const SIZE_OPTIONS_XL = [...SIZE_OPTIONS, { value: 'xl', label: 'Extra large' }];

export const SOCIAL_NETWORKS = [
  'linkedin',
  'x',
  'github',
  'youtube',
  'instagram',
  'facebook',
  'tiktok',
  'dribbble',
  'discord',
  'slack',
  'medium',
  'threads',
  'email',
  'website',
  'rss'
] as const;

/** Curated announcement icons (inline SVG names from lib/icons.ts); `none` hides the icon. */
export const ANNOUNCEMENT_ICONS = [
  'none',
  'Sparkle',
  'Megaphone',
  'RocketLaunch',
  'Lightning',
  'Gift',
  'Info',
  'Bell',
  'CalendarBlank',
  'Tag',
  'Star',
  'Confetti',
  'Trophy',
  'Lifebuoy'
] as const;

const ANNOUNCEMENT_ICON_LABELS: Record<(typeof ANNOUNCEMENT_ICONS)[number], string> = {
  none: 'No icon',
  Sparkle: 'Sparkle',
  Megaphone: 'Megaphone',
  RocketLaunch: 'Rocket',
  Lightning: 'Lightning',
  Gift: 'Gift',
  Info: 'Info',
  Bell: 'Bell',
  CalendarBlank: 'Calendar',
  Tag: 'Tag',
  Star: 'Star',
  Confetti: 'Confetti',
  Trophy: 'Trophy',
  Lifebuoy: 'Lifebuoy'
};

export const GENERAL_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'ui/accordion': {
    type: 'ui/accordion',
    displayName: 'Accordion',
    category: 'ui',
    description: 'Collapsible panels that reveal content one section at a time.',
    icon: 'SquareSplitVertical',
    component: 'Accordion',
    keywords: ['accordion', 'collapse', 'expand', 'toggle', 'disclosure', 'panels', 'faq', 'details'],
    propsSchema: z.object({
      items: z.array(z.object({ title: z.string().default(''), content: z.string().default('') })).default([]),
      allowMultiple: z.boolean().default(false),
      defaultOpen: z.number().int().min(-1).max(99).default(0),
      variant: z.enum(['separated', 'bordered', 'minimal']).default('separated'),
      iconStyle: z.enum(['chevron', 'plus']).default('chevron'),
      headingLevel: z.enum(['h2', 'h3', 'h4', 'h5', 'h6']).default('h3')
    }),
    defaultProps: {
      items: [
        {
          title: 'How long does onboarding take?',
          content:
            'Most teams are fully set up within a day. Import your existing content, invite your teammates and publish your first page in a single session.'
        },
        {
          title: 'Can I change plans later?',
          content: 'Yes. Upgrade, downgrade or cancel at any time from your billing settings. Changes are prorated automatically.'
        },
        {
          title: 'Is my data secure?',
          content:
            'All data is encrypted in transit and at rest. Access is controlled with role-based permissions and every change is recorded in an audit log.'
        }
      ],
      allowMultiple: false,
      defaultOpen: 0,
      variant: 'separated',
      iconStyle: 'chevron',
      headingLevel: 'h3'
    },
    propControls: {
      items: { label: 'Panels', group: 'Items' },
      allowMultiple: { label: 'Allow multiple open', help: 'When off, opening a panel closes the others.' },
      defaultOpen: {
        label: 'Initially open panel',
        type: 'number',
        min: -1,
        max: 99,
        step: 1,
        help: 'Index of the panel open on load, starting at 0. Use -1 to start with every panel closed.'
      },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'separated', label: 'Separated cards' },
          { value: 'bordered', label: 'Bordered group' },
          { value: 'minimal', label: 'Minimal dividers' }
        ]
      },
      iconStyle: {
        label: 'Indicator',
        type: 'select',
        options: [
          { value: 'chevron', label: 'Chevron' },
          { value: 'plus', label: 'Plus / minus' }
        ]
      },
      headingLevel: {
        label: 'Heading level',
        type: 'select',
        options: [
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
          { value: 'h4', label: 'H4' },
          { value: 'h5', label: 'H5' },
          { value: 'h6', label: 'H6' }
        ],
        help: 'Semantic level of each panel heading; pick the level that fits the page outline.'
      }
    },
    slots: [],
    behaviour: [
      'WAI-ARIA accordion: each panel title is a <button type="button"> inside a heading element of `headingLevel`, with aria-expanded and aria-controls; each panel is role="region" labelled by its button.',
      'Panel `defaultOpen` (0-based index) is open initially; -1 or an out-of-range index starts with every panel closed. Changing `defaultOpen` or `allowMultiple` resets the open state.',
      'With `allowMultiple: false` opening a panel closes the others and clicking the open panel closes it; with `allowMultiple: true` panels toggle independently.',
      'Keyboard: Enter/Space toggle the focused panel; ArrowDown/ArrowUp move focus to the next/previous panel button (wrapping); Home/End focus the first/last panel button.',
      'Panels animate their height (grid-template-rows 0fr to 1fr, about 250ms); collapsed panels are visibility:hidden so their content is neither read by screen readers nor focusable. With prefers-reduced-motion the change is instant.',
      'Variants: separated (individual bordered cards with a gap), bordered (one bordered group with dividers), minimal (dividers only, no surface). Indicator: chevron (rotates 180 degrees) or plus (turns into a minus).',
      'Panel content preserves line breaks (white-space: pre-line).'
    ]
  },

  'ui/counter': {
    type: 'ui/counter',
    displayName: 'Counter',
    category: 'ui',
    description: 'An animated number that counts up to a headline metric when it scrolls into view.',
    icon: 'NumberSquareNine',
    component: 'Counter',
    keywords: ['counter', 'number', 'count up', 'statistic', 'metric', 'animated number', 'kpi'],
    propsSchema: z.object({
      start: z.number().min(-1e12).max(1e12).default(0),
      end: z.number().min(-1e12).max(1e12).default(12500),
      decimals: z.number().int().min(0).max(4).default(0),
      prefix: z.string().default(''),
      suffix: z.string().default('+'),
      label: z.string().default('Teams onboarded'),
      separator: z.enum(['comma', 'period', 'space', 'apostrophe', 'none']).default('comma'),
      duration: z.number().int().min(0).max(10000).default(2000),
      align: z.enum(TEXT_ALIGN).default('center'),
      size: z.enum(['sm', 'md', 'lg', 'xl']).default('lg')
    }),
    defaultProps: {
      start: 0,
      end: 12500,
      decimals: 0,
      prefix: '',
      suffix: '+',
      label: 'Teams onboarded',
      separator: 'comma',
      duration: 2000,
      align: 'center',
      size: 'lg'
    },
    propControls: {
      start: { label: 'Start value', type: 'number', step: 1 },
      end: { label: 'End value', type: 'number', step: 1 },
      decimals: { label: 'Decimal places', type: 'number', min: 0, max: 4, step: 1 },
      prefix: { label: 'Prefix', help: 'Shown before the number, e.g. "$".' },
      suffix: { label: 'Suffix', help: 'Shown after the number, e.g. "+", "%" or "k".' },
      label: { label: 'Label', type: 'text' },
      separator: {
        label: 'Thousands separator',
        type: 'select',
        options: [
          { value: 'comma', label: 'Comma (12,500)' },
          { value: 'period', label: 'Period (12.500)' },
          { value: 'space', label: 'Space (12 500)' },
          { value: 'apostrophe', label: 'Apostrophe (12’500)' },
          { value: 'none', label: 'None (12500)' }
        ]
      },
      duration: { label: 'Duration', type: 'number', min: 0, max: 10000, step: 100, unit: 'ms', help: '0 shows the final value without animating.' },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
      size: { label: 'Size', type: 'select', options: SIZE_OPTIONS_XL }
    },
    slots: [],
    behaviour: [
      'Server-rendered HTML (and no-JS visitors) always shows the final value `end`, formatted with `decimals` and the thousands `separator`, wrapped in `prefix` and `suffix`.',
      'In the browser the number resets to `start` and counts to `end` once, with an ease-out curve over `duration` ms, the first time at least 40% of the element is visible (IntersectionObserver).',
      'When prefers-reduced-motion is set, IntersectionObserver is unavailable, `duration` is 0 or `start` equals `end`, the final value is shown immediately with no animation.',
      'Separators: comma 12,500 | period 12.500 (decimal mark becomes a comma) | space 12 500 (non-breaking) | apostrophe 12’500 | none 12500.',
      'Screen readers only get the final value (a visually hidden copy); the animating digits are aria-hidden. A hidden copy of the final value reserves the width so the layout never shifts while counting (tabular numerals).',
      'Changing `start`, `end`, `decimals` or `duration` replays the animation.'
    ]
  },

  'ui/progress-bar': {
    type: 'ui/progress-bar',
    displayName: 'Progress Bar',
    category: 'ui',
    description: 'A labelled horizontal bar that shows completion as a percentage.',
    icon: 'ChartBarHorizontal',
    component: 'ProgressBar',
    keywords: ['progress', 'bar', 'skill', 'percentage', 'completion', 'meter', 'loading'],
    propsSchema: z.object({
      label: z.string().default('Onboarding completion'),
      value: z.number().min(0).max(100).default(72),
      showValue: z.boolean().default(true),
      tone: z.enum(['primary', 'success', 'warning', 'danger', 'neutral']).default('primary'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      striped: z.boolean().default(false)
    }),
    defaultProps: {
      label: 'Onboarding completion',
      value: 72,
      showValue: true,
      tone: 'primary',
      size: 'md',
      striped: false
    },
    propControls: {
      label: { label: 'Label', type: 'text' },
      value: { label: 'Value', type: 'number', min: 0, max: 100, step: 1, unit: '%' },
      showValue: { label: 'Show percentage' },
      tone: {
        label: 'Color',
        type: 'select',
        options: [
          { value: 'primary', label: 'Primary' },
          { value: 'success', label: 'Success' },
          { value: 'warning', label: 'Warning' },
          { value: 'danger', label: 'Danger' },
          { value: 'neutral', label: 'Neutral' }
        ]
      },
      size: { label: 'Thickness', type: 'select', options: SIZE_OPTIONS },
      striped: { label: 'Striped', help: 'Adds animated diagonal stripes (static when reduced motion is preferred).' }
    },
    slots: [],
    behaviour: [
      'The bar element has role="progressbar" with aria-valuemin=0, aria-valuemax=100, aria-valuenow and aria-valuetext ("72%"), and is labelled by the visible `label` (aria-label "Progress" when the label is empty).',
      '`value` is clamped to 0–100 and rounded to a whole percent for display; `showValue` shows it at the right end of the label row.',
      'Server-rendered HTML shows the final width. In the browser the fill starts at 0 and animates to `value` (about 1s, ease-out) the first time 40% of the bar is visible; with prefers-reduced-motion or no IntersectionObserver it renders at the final width immediately.',
      'Tones map to tokens: primary, success, warning (--md-sys-color-warning, amber fallback), danger (error) and neutral (on-surface-variant); track uses surface-container-high. Thickness: sm 6px, md 10px, lg 16px.',
      '`striped` overlays moving 45-degree stripes on the fill; the movement stops under prefers-reduced-motion.'
    ]
  },

  'ui/star-rating': {
    type: 'ui/star-rating',
    displayName: 'Star Rating',
    category: 'ui',
    description: 'A read-only row of stars with partial fills and a supporting caption.',
    icon: 'Star',
    component: 'StarRating',
    keywords: ['rating', 'stars', 'review', 'score', 'testimonial', 'social proof'],
    propsSchema: z.object({
      rating: z.number().min(0).max(10).default(4.8),
      max: z.number().int().min(1).max(10).default(5),
      label: z.string().default('4.8 out of 5 from 2,400 reviews'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      tone: z.enum(['gold', 'primary', 'neutral']).default('gold'),
      align: z.enum(TEXT_ALIGN).default('left')
    }),
    defaultProps: {
      rating: 4.8,
      max: 5,
      label: '4.8 out of 5 from 2,400 reviews',
      size: 'md',
      tone: 'gold',
      align: 'left'
    },
    propControls: {
      rating: { label: 'Rating', type: 'number', min: 0, max: 10, step: 0.1, help: 'Fractions render as partially filled stars (4.5 shows four and a half stars).' },
      max: { label: 'Number of stars', type: 'number', min: 1, max: 10, step: 1 },
      label: { label: 'Caption', type: 'text', help: 'Visible text next to the stars. Leave empty to show stars only.' },
      size: { label: 'Size', type: 'select', options: SIZE_OPTIONS },
      tone: {
        label: 'Star color',
        type: 'select',
        options: [
          { value: 'gold', label: 'Gold' },
          { value: 'primary', label: 'Primary' },
          { value: 'neutral', label: 'Neutral' }
        ]
      },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS }
    },
    slots: [],
    behaviour: [
      'Read-only (not interactive). `rating` is clamped to 0–`max`; each star is filled by its share of the rating, so 4.8 renders four full stars and one star filled 80% from the left.',
      'The star group is role="img" with aria-label "Rated 4.8 out of 5 stars"; individual star glyphs are aria-hidden. The optional `label` caption is regular visible text.',
      'Filled stars use the `tone` color (gold amber, primary or on-surface); empty stars use outline-variant mixed 35% toward outline. Sizes: sm 16px, md 20px, lg 28px.'
    ]
  },

  'ui/social-icons': {
    type: 'ui/social-icons',
    displayName: 'Social Icons',
    category: 'ui',
    description: 'A row of linked social network icons with consistent styling.',
    icon: 'ShareNetwork',
    component: 'SocialIcons',
    keywords: ['social', 'icons', 'follow', 'linkedin', 'x', 'twitter', 'github', 'youtube', 'instagram', 'share'],
    propsSchema: z.object({
      items: z
        .array(
          z.object({
            network: z.enum(SOCIAL_NETWORKS).default('website'),
            href: z.string().default(''),
            label: z.string().default('')
          })
        )
        .default([]),
      variant: z.enum(['plain', 'soft', 'solid', 'outline']).default('soft'),
      shape: z.enum(['circle', 'rounded', 'square']).default('circle'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      align: z.enum(TEXT_ALIGN).default('left'),
      brandColors: z.boolean().default(false)
    }),
    defaultProps: {
      items: [
        { network: 'linkedin', href: 'https://www.linkedin.com/', label: '' },
        { network: 'x', href: 'https://x.com/', label: '' },
        { network: 'github', href: 'https://github.com/', label: '' },
        { network: 'youtube', href: 'https://www.youtube.com/', label: '' }
      ],
      variant: 'soft',
      shape: 'circle',
      size: 'md',
      align: 'left',
      brandColors: false
    },
    propControls: {
      items: { label: 'Profiles', group: 'Items', help: 'Network, profile URL and an optional accessible label (defaults to the network name).' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'plain', label: 'Plain icon' },
          { value: 'soft', label: 'Soft tile' },
          { value: 'solid', label: 'Solid tile' },
          { value: 'outline', label: 'Outline' }
        ]
      },
      shape: {
        label: 'Shape',
        type: 'select',
        options: [
          { value: 'circle', label: 'Circle' },
          { value: 'rounded', label: 'Rounded' },
          { value: 'square', label: 'Square' }
        ]
      },
      size: { label: 'Size', type: 'select', options: SIZE_OPTIONS },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
      brandColors: { label: 'Brand colors', help: 'Use each network’s own brand color instead of the theme colors.' }
    },
    slots: [],
    behaviour: [
      'Renders a list (<ul aria-label="Social links">) of icon links; networks: linkedin, x, github, youtube, instagram, facebook, tiktok, dribbble, discord, slack, medium, threads, email (envelope), website (globe), rss.',
      'Every link has an accessible name: `label`, or the network name (e.g. "LinkedIn"). Absolute http(s) links open in a new tab with rel="noopener noreferrer" and " (opens in a new tab)" appended to the accessible name; mailto: and relative links open in place.',
      'Variants: plain (icon only), soft (tonal tile), solid (filled tile with contrasting icon), outline (1px border). Shapes: circle, rounded (10px) or square (4px). Sizes: sm 32px, md 40px, lg 48px tiles; small tiles keep a 40px touch target.',
      'With `brandColors` each network uses its brand color (monochrome brands such as X, GitHub, TikTok, Threads and Medium use the on-surface color so they stay visible on dark themes).'
    ]
  },

  'ui/countdown': {
    type: 'ui/countdown',
    displayName: 'Countdown',
    category: 'ui',
    description: 'A live timer that counts down to a launch, deadline or offer end date.',
    icon: 'ClockCountdown',
    component: 'Countdown',
    keywords: ['countdown', 'timer', 'deadline', 'launch', 'offer', 'clock', 'urgency', 'event'],
    propsSchema: z.object({
      target: z.string().default('2027-03-31T17:00:00Z'),
      showDays: z.boolean().default(true),
      showHours: z.boolean().default(true),
      showMinutes: z.boolean().default(true),
      showSeconds: z.boolean().default(true),
      daysLabel: z.string().default('Days'),
      hoursLabel: z.string().default('Hours'),
      minutesLabel: z.string().default('Minutes'),
      secondsLabel: z.string().default('Seconds'),
      variant: z.enum(['boxes', 'inline', 'minimal']).default('boxes'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      align: z.enum(TEXT_ALIGN).default('center'),
      expiredText: z.string().default('This offer has ended.')
    }),
    defaultProps: {
      target: '2027-03-31T17:00:00Z',
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      daysLabel: 'Days',
      hoursLabel: 'Hours',
      minutesLabel: 'Minutes',
      secondsLabel: 'Seconds',
      variant: 'boxes',
      size: 'md',
      align: 'center',
      expiredText: 'This offer has ended.'
    },
    propControls: {
      target: {
        label: 'Ends at',
        type: 'text',
        help: 'ISO 8601 date-time, e.g. 2026-12-31T17:00:00Z or 2026-12-31T09:00:00-08:00. A value without an offset is read as UTC; a date alone means 00:00 UTC.'
      },
      showDays: { label: 'Show days', group: 'Units' },
      showHours: { label: 'Show hours', group: 'Units' },
      showMinutes: { label: 'Show minutes', group: 'Units' },
      showSeconds: { label: 'Show seconds', group: 'Units' },
      daysLabel: { label: 'Days label', group: 'Units' },
      hoursLabel: { label: 'Hours label', group: 'Units' },
      minutesLabel: { label: 'Minutes label', group: 'Units' },
      secondsLabel: { label: 'Seconds label', group: 'Units' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'boxes', label: 'Boxes' },
          { value: 'inline', label: 'Inline' },
          { value: 'minimal', label: 'Minimal' }
        ]
      },
      size: { label: 'Size', type: 'select', options: SIZE_OPTIONS },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS },
      expiredText: { label: 'Message after the end', type: 'text' }
    },
    slots: [],
    behaviour: [
      '`target` is parsed strictly as ISO 8601 (YYYY-MM-DD, optionally THH:MM[:SS[.sss]] and Z or ±HH:MM); no offset means UTC. An invalid value renders an inline message showing the value instead of a timer.',
      'Server-rendered HTML shows muted "--" placeholders for every unit (identical during hydration); after mount the remaining time is computed from Date.now() and re-rendered on every second boundary (a self-correcting setTimeout, cleared on unmount and when the target is reached).',
      'Only the units toggled on are shown; the largest visible unit absorbs hidden larger units (days hidden → hours can exceed 24) and hidden smaller units are dropped. With every unit off, all four are shown. Hours, minutes and seconds are zero-padded to two digits.',
      'The units group is role="timer" (not announced on every tick). When the target passes, the timer is replaced by `expiredText` inside a polite live region.',
      'Variants: boxes (a bordered card per unit), inline (compact "12 Days 04 Hours" text), minimal (large digits separated by colons with small labels).'
    ]
  },

  'ui/animated-headline': {
    type: 'ui/animated-headline',
    displayName: 'Animated Headline',
    category: 'ui',
    description: 'A headline with a rotating highlighted word for hero sections.',
    icon: 'CursorText',
    component: 'AnimatedHeadline',
    keywords: ['headline', 'animated', 'rotating', 'typing', 'typewriter', 'heading', 'hero', 'title'],
    propsSchema: z.object({
      before: z.string().default('Build a website that'),
      words: z.array(z.string()).default([]),
      after: z.string().default(''),
      level: z.enum(['h1', 'h2', 'h3', 'h4']).default('h2'),
      size: z.enum(['sm', 'md', 'lg', 'xl']).default('lg'),
      animation: z.enum(['typing', 'fade', 'slide', 'highlight']).default('slide'),
      interval: z.number().int().min(1000).max(10000).default(2500),
      loop: z.boolean().default(true),
      align: z.enum(TEXT_ALIGN).default('center')
    }),
    defaultProps: {
      before: 'Build a website that',
      words: ['converts', 'scales', 'performs'],
      after: '',
      level: 'h2',
      size: 'lg',
      animation: 'slide',
      interval: 2500,
      loop: true,
      align: 'center'
    },
    propControls: {
      before: { label: 'Text before', type: 'text' },
      words: { label: 'Rotating words', group: 'Items' },
      after: { label: 'Text after', type: 'text' },
      level: {
        label: 'Heading level',
        type: 'select',
        options: [
          { value: 'h1', label: 'H1' },
          { value: 'h2', label: 'H2' },
          { value: 'h3', label: 'H3' },
          { value: 'h4', label: 'H4' }
        ]
      },
      size: { label: 'Size', type: 'select', options: SIZE_OPTIONS_XL },
      animation: {
        label: 'Animation',
        type: 'select',
        options: [
          { value: 'slide', label: 'Slide up' },
          { value: 'fade', label: 'Fade' },
          { value: 'typing', label: 'Typing' },
          { value: 'highlight', label: 'Marker highlight' }
        ]
      },
      interval: { label: 'Time per word', type: 'number', min: 1000, max: 10000, step: 250, unit: 'ms' },
      loop: { label: 'Loop', help: 'When off, the animation stops on the last word.' },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS }
    },
    slots: [],
    behaviour: [
      'Renders a heading of `level` reading "`before` <rotating word> `after`". The first word is server-rendered; in the browser the words rotate every `interval` ms.',
      'Animations: slide (the next word slides up into place), fade (cross-fade), typing (the word is deleted and the next typed character by character with a blinking caret), highlight (cross-fade plus a primary marker stroke that draws under the active word).',
      'For slide, fade and highlight all words share one grid cell, so the heading never reflows while rotating.',
      'Screen readers get the full phrase with every word ("Build a website that converts, scales, performs") from visually hidden text; the animated visual copy is aria-hidden.',
      'With prefers-reduced-motion the first word is shown statically. Rotation pauses while the pointer is over the headline. With `loop: false` it stops on the last word.'
    ]
  },

  'navigation/breadcrumbs': {
    type: 'navigation/breadcrumbs',
    displayName: 'Breadcrumbs',
    category: 'navigation',
    description: 'A trail of links that shows where the current page sits in the site hierarchy.',
    icon: 'CaretDoubleRight',
    component: 'Breadcrumbs',
    keywords: ['breadcrumbs', 'breadcrumb', 'trail', 'path', 'navigation', 'hierarchy'],
    propsSchema: z.object({
      items: z.array(z.object({ label: z.string().default(''), href: z.string().default('') })).default([]),
      separator: z.enum(['chevron', 'slash', 'dot']).default('chevron'),
      showHomeIcon: z.boolean().default(true)
    }),
    defaultProps: {
      items: [
        { label: 'Home', href: '/' },
        { label: 'Resources', href: '/resources' },
        { label: 'Guides', href: '/resources/guides' },
        { label: 'Setting up your workspace', href: '' }
      ],
      separator: 'chevron',
      showHomeIcon: true
    },
    propControls: {
      items: { label: 'Trail', group: 'Items', help: 'The last item is the current page and is not linked.' },
      separator: {
        label: 'Separator',
        type: 'select',
        options: [
          { value: 'chevron', label: 'Chevron' },
          { value: 'slash', label: 'Slash' },
          { value: 'dot', label: 'Dot' }
        ]
      },
      showHomeIcon: { label: 'Home icon on first item' }
    },
    slots: [],
    behaviour: [
      '<nav aria-label="Breadcrumb"> containing an ordered list. Every item except the last is a link; the last item is the current page: plain text with aria-current="page".',
      'Separators (chevron, slash or dot) are decorative and aria-hidden.',
      'Below 768px, when there are more than 3 items the middle items (all but the first and the last two) collapse behind a "Show full path" button (aria-expanded); activating it reveals them and moves focus to the first revealed link. The current page label truncates with an ellipsis instead of overflowing.',
      '`showHomeIcon` adds a house icon before the first item label.'
    ]
  },

  'site/announcement-bar': {
    type: 'site/announcement-bar',
    displayName: 'Announcement Bar',
    category: 'site',
    description: 'A slim full-width strip for launches, offers and important notices.',
    icon: 'MegaphoneSimple',
    component: 'AnnouncementBar',
    keywords: ['announcement', 'banner', 'top bar', 'notice', 'promo', 'strip', 'alert', 'news'],
    propsSchema: z.object({
      text: z.string().default('Workspace analytics are now available on every plan.'),
      linkText: z.string().default('See what’s new'),
      href: z.string().default('/features'),
      tone: z.enum(['primary', 'dark', 'subtle', 'gradient']).default('dark'),
      icon: z.enum(ANNOUNCEMENT_ICONS).default('Sparkle'),
      dismissible: z.boolean().default(true),
      align: z.enum(['left', 'center']).default('center')
    }),
    defaultProps: {
      text: 'Workspace analytics are now available on every plan.',
      linkText: 'See what’s new',
      href: '/features',
      tone: 'dark',
      icon: 'Sparkle',
      dismissible: true,
      align: 'center'
    },
    propControls: {
      text: { label: 'Message', type: 'text' },
      linkText: { label: 'Link text', help: 'Leave empty to hide the link.' },
      href: { label: 'Link', type: 'url' },
      tone: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'dark', label: 'Dark' },
          { value: 'primary', label: 'Primary' },
          { value: 'subtle', label: 'Subtle' },
          { value: 'gradient', label: 'Gradient' }
        ]
      },
      icon: {
        label: 'Icon',
        type: 'select',
        options: ANNOUNCEMENT_ICONS.map((value) => ({ value, label: ANNOUNCEMENT_ICON_LABELS[value] }))
      },
      dismissible: { label: 'Dismissible', help: 'Shows a close button. Dismissal lasts for the current page view only.' },
      align: {
        label: 'Alignment',
        type: 'select',
        options: [
          { value: 'center', label: 'Center' },
          { value: 'left', label: 'Left' }
        ]
      }
    },
    slots: [],
    behaviour: [
      'Full-width strip (role="region", aria-label "Announcement") with an optional decorative icon, the message and an optional underlined link with an arrow (rendered only when `linkText` is set).',
      'Tones: dark (on-surface background, surface text), primary (primary / on-primary), subtle (surface-container-low with a bottom border), gradient (primary blended toward tertiary, on-primary text).',
      'When `dismissible` is true a close button (aria-label "Dismiss announcement") removes the bar for the current page view; nothing is persisted.',
      'Content is centered (or left aligned) inside a 1280px container and wraps onto two lines on small screens without overlapping the close button.'
    ]
  },

  'ui/billing-toggle': {
    type: 'ui/billing-toggle',
    displayName: 'Billing Toggle',
    category: 'ui',
    description: 'A monthly / yearly segmented switch with a savings badge for pricing pages.',
    icon: 'ToggleRight',
    component: 'BillingToggle',
    keywords: ['billing', 'toggle', 'pricing', 'monthly', 'yearly', 'annual', 'switch', 'segmented'],
    propsSchema: z.object({
      monthlyLabel: z.string().default('Monthly'),
      yearlyLabel: z.string().default('Yearly'),
      badgeText: z.string().default('Save 20%'),
      defaultPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
      align: z.enum(TEXT_ALIGN).default('center')
    }),
    defaultProps: {
      monthlyLabel: 'Monthly',
      yearlyLabel: 'Yearly',
      badgeText: 'Save 20%',
      defaultPeriod: 'monthly',
      align: 'center'
    },
    propControls: {
      monthlyLabel: { label: 'Monthly label' },
      yearlyLabel: { label: 'Yearly label' },
      badgeText: { label: 'Savings badge', help: 'Shown next to the yearly option. Leave empty to hide.' },
      defaultPeriod: {
        label: 'Selected by default',
        type: 'select',
        options: [
          { value: 'monthly', label: 'Monthly' },
          { value: 'yearly', label: 'Yearly' }
        ]
      },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS }
    },
    slots: [],
    behaviour: [
      'A <fieldset> (visually hidden legend "Billing period") with two native radio inputs styled as a segmented pill: arrow keys move between options, the selected option shows a raised surface, focus is visible.',
      'Initial selection is `defaultPeriod`; changing `defaultPeriod` resets it. The selection is local state only.',
      'On every user change the root element dispatches a bubbling DOM event: new CustomEvent("appviz:billing-period", { bubbles: true, detail: { period: "monthly" | "yearly" } }). The root also reflects the current value in data-period so listeners can read the initial state.',
      'Example wiring: document.addEventListener("appviz:billing-period", (e) => setPeriod(e.detail.period)) to swap the prices shown in a pricing table.'
    ]
  },

  'ui/modal-button': {
    type: 'ui/modal-button',
    displayName: 'Modal Button',
    category: 'ui',
    description: 'A button that opens an accessible popup dialog with a title, message and actions.',
    icon: 'AppWindow',
    component: 'ModalButton',
    keywords: ['modal', 'dialog', 'popup', 'lightbox', 'button', 'overlay', 'confirm'],
    propsSchema: z.object({
      text: z.string().default('See how it works'),
      variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
      size: z.enum(['sm', 'md', 'lg']).default('md'),
      modalTitle: z.string().default('How it works'),
      modalBody: z
        .string()
        .default('Connect your data sources, choose the metrics that matter and share live dashboards with your team. Setup takes minutes and needs no engineering time.'),
      confirmText: z.string().default('Explore features'),
      confirmHref: z.string().default('/features'),
      cancelText: z.string().default('Close')
    }),
    defaultProps: {
      text: 'See how it works',
      variant: 'primary',
      size: 'md',
      modalTitle: 'How it works',
      modalBody:
        'Connect your data sources, choose the metrics that matter and share live dashboards with your team. Setup takes minutes and needs no engineering time.',
      confirmText: 'Explore features',
      confirmHref: '/features',
      cancelText: 'Close'
    },
    propControls: {
      text: { label: 'Button text', group: 'Buttons' },
      variant: {
        label: 'Button style',
        type: 'select',
        options: [
          { value: 'primary', label: 'Filled' },
          { value: 'secondary', label: 'Tonal' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Text' }
        ]
      },
      size: { label: 'Button size', type: 'select', options: SIZE_OPTIONS },
      modalTitle: { label: 'Dialog title', group: 'Dialog' },
      modalBody: { label: 'Dialog message', type: 'textarea', group: 'Dialog' },
      confirmText: { label: 'Confirm button', group: 'Dialog' },
      confirmHref: { label: 'Confirm link', type: 'url', group: 'Dialog', help: 'When set the confirm button navigates here; leave empty to just close the dialog.' },
      cancelText: { label: 'Cancel button', group: 'Dialog', help: 'Leave empty to hide the cancel button.' }
    },
    slots: [],
    behaviour: [
      'The root is an inline wrapper containing a <button type="button" aria-haspopup="dialog"> (same variants and sizes as Button) and a native <dialog> labelled by its title and described by its message.',
      'Clicking the button opens the dialog with showModal(): the rest of the page is inert, focus moves to the first control in the dialog (the close button) and Tab / Shift+Tab wrap between the first and last controls. Page scrolling is locked while it is open.',
      'Escape, the close (X) button, the cancel button and a click on the backdrop close it; focus then returns to the opening button.',
      'The confirm action is a link to `confirmHref` when set, otherwise a button that closes the dialog. `cancelText` empty hides the cancel button. On narrow screens the actions stack full width.',
      'In the studio design mode the button only selects the element; open the dialog in Preview mode.'
    ]
  }
};
