import { z } from 'zod';
import type { ComponentManifest, PropControl } from '@app-viz/schema';

/** App & dashboard elements: charts, stat cards, activity feed, empty state, profile, sidebar navigation, kanban, calendar. */

const TONES = ['primary', 'success', 'warning', 'danger', 'neutral', 'violet'] as const;

const TONE_OPTIONS: PropControl['options'] = [
  { value: 'primary', label: 'Primary' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'violet', label: 'Violet' }
];

/**
 * A string prop that is NOT inline-editable copy (icon name, ISO date/month, image URL, unit affix),
 * so its component carries no `data-prop` for it. The trailing `.pipe(z.string())` is a runtime
 * no-op: it only keeps the canonical data-prop audit (which unwraps default/optional/nullable and
 * treats every remaining `string` as editable text) from demanding an inline-editing hook.
 */
function nonTextString(fallback: string, format?: RegExp) {
  return (format ? z.string().regex(format) : z.string()).default(fallback).pipe(z.string());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DEFAULT_NOW = '2026-10-28T12:00:00Z';

export const APP_MANIFESTS: Record<string, ComponentManifest<any>> = {
  /* ------------------------------------------------------------------------ Chart */
  'app/chart': {
    type: 'app/chart',
    displayName: 'Chart',
    category: 'app',
    description: 'A dependency-free SVG bar, line, area, stacked or donut chart with tooltips and an accessible data table.',
    icon: 'ChartBar',
    component: 'Chart',
    keywords: ['chart', 'graph', 'bar chart', 'line chart', 'area chart', 'donut', 'pie', 'analytics', 'dashboard', 'visualization', 'svg'],
    propsSchema: z.object({
      type: z.enum(['bar', 'line', 'area', 'donut', 'stacked-bar']).default('bar'),
      title: z.string().default(''),
      subtitle: z.string().default(''),
      labels: z.array(z.string()).default([]),
      series: z
        .array(
          z.object({
            name: z.string().default(''),
            values: z.array(z.number().nullable()).default([]),
            tone: z.enum(TONES).default('primary')
          })
        )
        .default([]),
      showLegend: z.boolean().default(true),
      showGrid: z.boolean().default(true),
      showValues: z.boolean().default(false),
      valuePrefix: nonTextString(''),
      valueSuffix: nonTextString(''),
      height: z.number().int().min(160).max(640).default(280)
    }),
    defaultProps: {
      type: 'bar',
      title: 'Net revenue',
      subtitle: 'Monthly, this year compared with last year',
      labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
      series: [
        { name: 'This year', values: [42.1, 45.8, 44.2, 51.6, 55.3, 58.9], tone: 'primary' },
        { name: 'Last year', values: [35.4, 37.9, 38.6, 40.2, 43.8, 46.1], tone: 'neutral' }
      ],
      showLegend: true,
      showGrid: true,
      showValues: false,
      valuePrefix: '$',
      valueSuffix: 'k',
      height: 280
    },
    propControls: {
      type: {
        label: 'Chart type',
        type: 'select',
        group: 'settings',
        options: [
          { value: 'bar', label: 'Bar' },
          { value: 'stacked-bar', label: 'Stacked bar' },
          { value: 'line', label: 'Line' },
          { value: 'area', label: 'Area' },
          { value: 'donut', label: 'Donut' }
        ]
      },
      labels: { label: 'Category labels', help: 'One label per data point (x axis, or donut segments).', group: 'Data' },
      series: { label: 'Series', help: 'Each series needs one value per label. Donut charts use the first series only.', group: 'Data' },
      showLegend: { label: 'Show legend', help: 'Shown for two or more series (donut: always).' },
      showGrid: { label: 'Show gridlines' },
      showValues: { label: 'Show value labels', help: 'Adds value labels only where they fit.' },
      valuePrefix: { label: 'Value prefix', type: 'text', help: 'e.g. "$"', group: 'settings' },
      valueSuffix: { label: 'Value suffix', type: 'text', help: 'e.g. "%", "k", " ms"', group: 'settings' },
      height: { label: 'Plot height', type: 'number', min: 160, max: 640, step: 10, unit: 'px' }
    },
    slots: [],
    behaviour: [
      'Pure inline SVG, no chart library. `type`: "bar" (grouped bars per label), "stacked-bar" (one bar per label, series stacked bottom-up; negative values count as 0), "line", "area" (line plus a vertical gradient fill to the zero baseline), "donut" (segments are `labels` with the FIRST series\' values; non-positive values are skipped; more than 6 segments fold the tail into one "Other" segment).',
      'Data validation: every series and the labels are truncated to the shortest of `labels.length` and each `series[].values.length`; null/NaN/non-finite values are dropped (a gap in lines, no bar, excluded from donut totals, "No data" in tooltips and the table). With no valid values an honest "No data to display" frame renders instead of a chart.',
      'Y axis: nice-number ticks (1/2/5 × 10^n steps, about 5 ticks, always including 0); tick labels are compact from 10,000 (12.5K, 1.2M) and wrapped in `valuePrefix`/`valueSuffix`. X labels thin out automatically when they would collide.',
      'Responsive: the SVG viewBox width tracks the container width (ResizeObserver; 640 during SSR) with preserveAspectRatio="xMidYMid meet", so text never scales or distorts; `height` is the plot height in px (160–640).',
      'Marks: bars at most 28px wide (20px when grouped) with 4px rounded data ends, square at the baseline, and a 2px gap between grouped bars and stacked segments; lines are 2px with monotone cubic smoothing and an end marker; 1px solid horizontal gridlines when `showGrid`.',
      'Series `tone` maps to theme colours: primary, success, danger (error), neutral (outline), warning (--md-sys-color-warning, fallback #B26A00), violet (--md-sys-color-violet, fallback #6E56CF). Donut segments use the fixed order primary, warning, success, violet, danger (neutral for "Other").',
      'Hover and keyboard: hovering anywhere over a category column (or donut segment) shows one tooltip listing every series at that label (stacked bars add a Total row) and highlights it (crosshair and markers for line/area). Categories are focusable buttons in a single tab stop (roving tabindex): Arrow keys/Home/End move between points, Escape hides the tooltip; each button\'s aria-label carries the same values as the tooltip.',
      'Accessibility: the root is a <figure> whose <figcaption> holds `title`/`subtitle`; the SVG has role="img" with an aria-label summary (type, range, lowest/highest/latest per series, or donut shares); a visually hidden <table> repeats every value. A legend renders when `showLegend` and there are 2+ series (donut: a legend with percentages, plus absolute values when `showValues`); `showValues` adds direct value labels only where they fit.'
    ]
  },

  /* ------------------------------------------------------------------------ Stat card */
  'app/stat-card': {
    type: 'app/stat-card',
    displayName: 'Stat Card',
    category: 'app',
    description: 'A single metric with its change, trend direction, comparison period and a sparkline.',
    icon: 'ChartLineUp',
    component: 'StatCard',
    keywords: ['stat', 'metric', 'kpi', 'number', 'sparkline', 'trend', 'delta', 'analytics', 'dashboard'],
    propsSchema: z.object({
      label: z.string().default('Metric'),
      value: z.string().default(''),
      delta: z.string().default(''),
      trend: z.enum(['up', 'down', 'flat']).default('flat'),
      upIsGood: z.boolean().default(true),
      period: z.string().default(''),
      sparkline: z.array(z.number()).default([]),
      icon: nonTextString(''),
      variant: z.enum(['plain', 'card']).default('card')
    }),
    defaultProps: {
      label: 'Monthly recurring revenue',
      value: '$48,290',
      delta: '+12.4%',
      trend: 'up',
      upIsGood: true,
      period: 'vs. last month',
      sparkline: [31.2, 33.0, 32.4, 35.1, 34.6, 37.9, 38.4, 40.2, 39.5, 43.1, 44.8, 48.3],
      icon: 'CurrencyDollar',
      variant: 'card'
    },
    propControls: {
      trend: {
        label: 'Trend',
        type: 'select',
        options: [
          { value: 'up', label: 'Up' },
          { value: 'down', label: 'Down' },
          { value: 'flat', label: 'Flat' }
        ]
      },
      upIsGood: { label: 'Higher is better', help: 'Turn off for metrics where an increase is bad (churn, latency, cost).' },
      sparkline: { label: 'Sparkline values', help: 'Recent values, oldest first. Needs at least 2 numbers.' },
      icon: { label: 'Icon', type: 'icon' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'card', label: 'Card' },
          { value: 'plain', label: 'Plain (no frame)' }
        ]
      }
    },
    slots: [],
    behaviour: [
      'Shows `label` with an optional `icon` tile, the `value` (large, proportional figures), a delta chip and `period`, and a 12-point style sparkline.',
      'Delta chip colour = direction × `upIsGood`: up+good or down+bad → success container; up+bad or down+good → error container; `trend: "flat"` → neutral. The chip carries a TrendUp/TrendDown/Minus icon plus visually hidden text ("Increased by", "Decreased by", "Unchanged:") so the change is never conveyed by colour alone.',
      'Sparkline: non-finite values are ignored; with fewer than 2 values it is hidden. It stretches to 6.5rem × 2rem (non-scaling 2px stroke, soft gradient fill, end dot) in the sentiment colour and has role="img" with an aria-label "Trend over N periods, from FIRST to LAST".',
      '`variant: "card"` renders a bordered surface; "plain" drops the frame so the stat can sit inside another card.'
    ]
  },

  /* ------------------------------------------------------------------------ Activity feed */
  'app/activity-feed': {
    type: 'app/activity-feed',
    displayName: 'Activity Feed',
    category: 'app',
    description: 'A timeline of recent team activity with avatars, tone-coded icons and relative timestamps.',
    icon: 'Pulse',
    component: 'ActivityFeed',
    keywords: ['activity', 'feed', 'timeline', 'log', 'history', 'events', 'audit', 'recent'],
    propsSchema: z.object({
      title: z.string().default('Recent activity'),
      items: z
        .array(
          z.object({
            actor: z.string().default(''),
            action: z.string().default(''),
            target: z.string().default(''),
            time: z.string().default(''),
            icon: z.string().default('Pulse'),
            tone: z.enum(TONES).default('neutral')
          })
        )
        .default([]),
      now: nonTextString(DEFAULT_NOW),
      showViewAll: z.boolean().default(true),
      viewAllText: z.string().default('View all activity'),
      viewAllHref: z.string().default('')
    }),
    defaultProps: {
      title: 'Recent activity',
      items: [
        { actor: 'Elena Ruiz', action: 'deployed', target: 'billing-api v2.14.0 to production', time: '2026-10-28T11:48:00Z', icon: 'RocketLaunch', tone: 'success' },
        { actor: 'Jordan Lee', action: 'opened pull request', target: '#482 Enforce SSO for admins', time: '2026-10-28T10:15:00Z', icon: 'GitPullRequest', tone: 'primary' },
        { actor: 'Priya Nair', action: 'commented on', target: 'Q4 pricing experiment', time: '2026-10-28T08:02:00Z', icon: 'ChatCircleText', tone: 'neutral' },
        { actor: 'Sam Carter', action: 'invited 3 members to', target: 'Design workspace', time: '2026-10-27T16:30:00Z', icon: 'UserPlus', tone: 'violet' },
        { actor: 'Uptime monitor', action: 'flagged', target: 'p95 latency above 800 ms on search-service', time: '2026-10-26T21:10:00Z', icon: 'Warning', tone: 'warning' }
      ],
      now: DEFAULT_NOW,
      showViewAll: true,
      viewAllText: 'View all activity',
      viewAllHref: '/activity'
    },
    propControls: {
      items: { label: 'Activity items', help: '`time` is an ISO 8601 timestamp, e.g. 2026-10-28T11:48:00Z.' },
      now: { label: 'Reference time', type: 'text', help: 'ISO 8601 timestamp relative times are computed from. Fixed so the server and browser render the same text.', group: 'settings' },
      showViewAll: { label: 'Show "view all" link' },
      viewAllHref: { label: 'View all link', type: 'url' }
    },
    slots: [],
    behaviour: [
      'Ordered list (<ol>) of items rendered as "{actor} {action} {target}" with actor and target emphasised, an initials avatar (first + last word initial) and a small tone-coloured badge with the item `icon`; a 1px connector line joins consecutive avatars.',
      'Each `time` (ISO 8601) renders in a <time datetime> element as relative text computed from the `now` prop — "Just now" (<45s), "N min ago", "N hours ago", "Yesterday", "N days ago" (<7 days), then "Oct 12" (plus the year when different) — with the absolute UTC timestamp in its title. Invalid times render no timestamp.',
      'Relative times are deterministic from `now` (default 2026-10-28T12:00:00Z) so server and client render identical markup. In the real app, pass the current time (e.g. `new Date().toISOString()` from the load function) or refresh it on an interval.',
      'When `showViewAll` and `viewAllText` are set, a footer link to `viewAllHref` is shown. An empty list renders "No activity yet."'
    ]
  },

  /* ------------------------------------------------------------------------ Empty state */
  'app/empty-state': {
    type: 'app/empty-state',
    displayName: 'Empty State',
    category: 'app',
    description: 'A centred placeholder for empty lists and first-run screens with up to two calls to action.',
    icon: 'Tray',
    component: 'EmptyState',
    keywords: ['empty', 'blank', 'zero state', 'placeholder', 'no results', 'onboarding', 'first run'],
    propsSchema: z.object({
      icon: nonTextString('Tray'),
      title: z.string().default('Nothing here yet'),
      description: z.string().default(''),
      primaryCtaText: z.string().default(''),
      primaryCtaHref: z.string().default(''),
      secondaryCtaText: z.string().default(''),
      secondaryCtaHref: z.string().default(''),
      variant: z.enum(['plain', 'dashed-border']).default('dashed-border')
    }),
    defaultProps: {
      icon: 'FolderOpen',
      title: 'No projects yet',
      description: 'Create your first project to start tracking deployments, usage and team activity in one place.',
      primaryCtaText: 'Create project',
      primaryCtaHref: '/projects/new',
      secondaryCtaText: 'Import from repository',
      secondaryCtaHref: '/projects/import',
      variant: 'dashed-border'
    },
    propControls: {
      icon: { label: 'Icon', type: 'icon' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'dashed-border', label: 'Dashed border' },
          { value: 'plain', label: 'Plain' }
        ]
      }
    },
    slots: [],
    behaviour: [
      'Centred column: an icon tile inside two faint concentric rings, `title` (h3), optional `description` (max 28rem), then the primary (filled) and secondary (outlined) link buttons; each button renders only when its text is set.',
      '`variant: "dashed-border"` adds a 1.5px dashed outline-variant border with a large radius and a faint tinted surface; "plain" has no frame.',
      'Below 768px the buttons stack full width.'
    ]
  },

  /* ------------------------------------------------------------------------ Profile card */
  'app/profile-card': {
    type: 'app/profile-card',
    displayName: 'Profile Card',
    category: 'app',
    description: 'A team member card with avatar, role, badges, key stats and actions.',
    icon: 'IdentificationCard',
    component: 'ProfileCard',
    keywords: ['profile', 'user', 'member', 'team', 'avatar', 'person', 'account', 'contact'],
    propsSchema: z.object({
      name: z.string().default('Team member'),
      role: z.string().default(''),
      avatarSrc: nonTextString(''),
      coverStyle: z.enum(['none', 'gradient']).default('gradient'),
      stats: z.array(z.object({ label: z.string().default(''), value: z.string().default('') })).default([]),
      actions: z
        .array(
          z.object({
            label: z.string().default(''),
            href: z.string().default(''),
            variant: z.enum(['primary', 'secondary']).default('secondary')
          })
        )
        .default([]),
      badges: z.array(z.string()).default([])
    }),
    defaultProps: {
      name: 'Avery Morgan',
      role: 'Head of Platform Engineering',
      avatarSrc: '',
      coverStyle: 'gradient',
      stats: [
        { label: 'Projects', value: '24' },
        { label: 'Reviews', value: '318' },
        { label: 'Teams', value: '4' }
      ],
      actions: [
        { label: 'Message', href: '/messages/new', variant: 'primary' },
        { label: 'View profile', href: '/team/avery-morgan', variant: 'secondary' }
      ],
      badges: ['Admin', 'On call']
    },
    propControls: {
      avatarSrc: { label: 'Avatar image', type: 'image', help: 'Leave empty to show initials.' },
      coverStyle: {
        label: 'Cover',
        type: 'select',
        options: [
          { value: 'gradient', label: 'Gradient' },
          { value: 'none', label: 'None' }
        ]
      },
      stats: { label: 'Stats', help: 'Up to 4 fit in one row.' },
      actions: { label: 'Actions' },
      badges: { label: 'Badges' }
    },
    slots: [],
    behaviour: [
      'Card (max width 26rem) with an optional 6rem theme-gradient cover; the 80px circular avatar overlaps the cover with a 4px surface ring.',
      'Avatar: `avatarSrc` passes the shared URL policy (safeSrc); when empty, unsafe or failing to load, the initials of `name` (first + last word) render on the primary container instead. The image has width/height attributes and `alt` = `name`.',
      '`badges` render as small pills; `stats` render in a bordered row of equal columns (value above label, a <dl>); `actions` render as equal-width link buttons — "primary" filled, "secondary" outlined.'
    ]
  },

  /* ------------------------------------------------------------------------ Sidebar navigation */
  'app/sidebar-nav': {
    type: 'app/sidebar-nav',
    displayName: 'Sidebar Navigation',
    category: 'app',
    description: 'A collapsible application sidebar with brand, grouped navigation, badges and the signed-in user.',
    icon: 'Sidebar',
    component: 'SidebarNav',
    keywords: ['sidebar', 'navigation', 'nav', 'menu', 'app shell', 'rail', 'drawer', 'dashboard'],
    propsSchema: z.object({
      brandName: z.string().default('Workspace'),
      sections: z
        .array(
          z.object({
            title: z.string().default(''),
            items: z
              .array(
                z.object({
                  label: z.string().default(''),
                  href: z.string().default(''),
                  icon: z.string().default('Circle'),
                  badge: z.string().default(''),
                  active: z.boolean().default(false)
                })
              )
              .default([])
          })
        )
        .default([]),
      footerUserName: z.string().default(''),
      footerUserEmail: z.string().default('')
    }),
    defaultProps: {
      brandName: 'Meridian',
      sections: [
        {
          title: 'Platform',
          items: [
            { label: 'Overview', href: '/dashboard', icon: 'SquaresFour', badge: '', active: true },
            { label: 'Projects', href: '/projects', icon: 'Folder', badge: '12', active: false },
            { label: 'Deployments', href: '/deployments', icon: 'RocketLaunch', badge: '', active: false },
            { label: 'Analytics', href: '/analytics', icon: 'ChartLine', badge: '', active: false }
          ]
        },
        {
          title: 'Workspace',
          items: [
            { label: 'Team', href: '/team', icon: 'Users', badge: '', active: false },
            { label: 'Billing', href: '/billing', icon: 'CreditCard', badge: '', active: false },
            { label: 'Settings', href: '/settings', icon: 'Gear', badge: '', active: false }
          ]
        }
      ],
      footerUserName: 'Avery Morgan',
      footerUserEmail: 'avery@example.com'
    },
    propControls: {
      sections: { label: 'Navigation sections', help: 'Mark the current page with "active" (rendered with aria-current="page").' }
    },
    slots: [],
    behaviour: [
      'From 768px: a vertical rail (16rem wide, min-height 36rem, footer pinned to the bottom) with a collapse button (aria-expanded, aria-controls) that toggles an icon-only 4.5rem rail in local state. Collapsed: labels and section titles become visually hidden (still read by screen readers), links get a title tooltip, badges shrink to a dot.',
      'Below 768px: a full-width bar with brand and a menu button (aria-expanded, closed by default) that discloses the navigation and footer.',
      'Items with `active: true` get aria-current="page" and an accent tint; `badge` renders as a count pill. Item icons are icon names; links pass safeHref.',
      'The footer shows the user initials avatar, `footerUserName` and `footerUserEmail` when either is set.'
    ]
  },

  /* ------------------------------------------------------------------------ Kanban board */
  'app/kanban': {
    type: 'app/kanban',
    displayName: 'Kanban Board',
    category: 'app',
    description: 'A task board whose cards move between columns by drag and drop or keyboard.',
    icon: 'Kanban',
    component: 'KanbanBoard',
    keywords: ['kanban', 'board', 'tasks', 'cards', 'drag and drop', 'project management', 'workflow', 'sprint'],
    propsSchema: z.object({
      columns: z
        .array(
          z.object({
            title: z.string().default(''),
            tone: z.enum(TONES).default('neutral'),
            cards: z
              .array(
                z.object({
                  title: z.string().default(''),
                  tag: z.string().default(''),
                  assignee: z.string().default(''),
                  due: z.string().default('')
                })
              )
              .default([])
          })
        )
        .default([])
    }),
    defaultProps: {
      columns: [
        {
          title: 'Backlog',
          tone: 'neutral',
          cards: [
            { title: 'Audit log export to CSV', tag: 'Feature', assignee: 'Jordan Lee', due: '2026-11-12' },
            { title: 'Rate-limit public API keys', tag: 'Security', assignee: 'Priya Nair', due: '2026-11-05' }
          ]
        },
        {
          title: 'In progress',
          tone: 'primary',
          cards: [
            { title: 'SAML single sign-on', tag: 'Feature', assignee: 'Elena Ruiz', due: '2026-11-03' },
            { title: 'Reduce cold starts on edge functions', tag: 'Performance', assignee: 'Sam Carter', due: '2026-10-31' }
          ]
        },
        {
          title: 'In review',
          tone: 'warning',
          cards: [{ title: 'Usage-based billing webhooks', tag: 'Billing', assignee: 'Avery Morgan', due: '2026-10-30' }]
        },
        {
          title: 'Done',
          tone: 'success',
          cards: [{ title: 'Onboarding checklist redesign', tag: 'Design', assignee: 'Maya Chen', due: '2026-10-24' }]
        }
      ]
    },
    propControls: {
      columns: { label: 'Columns', help: 'Card `due` dates use YYYY-MM-DD.' }
    },
    slots: [],
    behaviour: [
      'Columns sit in a horizontally scrolling grid (min 16.5rem each; 85% of the width with scroll snapping below 768px). Each column header shows a tone dot, the title and a card count; empty columns show a dashed "No cards" slot.',
      'Board state is local (initialised from `columns`, re-initialised when they change); moves are not persisted — wire them to your API.',
      'Pointer drag: mouse/pen drags start anywhere on a card, touch drags start on the grip handle (so swiping still scrolls). After 5px the card lifts and follows the pointer, a dashed placeholder marks the insertion point in the column under the pointer, the board auto-scrolls near its edges, releasing drops the card there and Escape cancels.',
      'Keyboard: cards are role="button" with aria-roledescription="draggable card" and instructions via aria-describedby. Space/Enter picks a card up (aria-pressed), Arrow Left/Right moves it to the adjacent column, Arrow Up/Down reorders it, Space/Enter drops it, Escape (or Tab) cancels and restores the original position. Focus follows the moved card and every step is announced in an assertive live region ("Moved to In review, position 1 of 2").',
      'Cards show `tag`, `title`, the `due` date (YYYY-MM-DD formatted as "Oct 30" without time-zone shifts) and the assignee initials (full name for screen readers and as a tooltip).'
    ]
  },

  /* ------------------------------------------------------------------------ Calendar */
  'app/calendar': {
    type: 'app/calendar',
    displayName: 'Calendar',
    category: 'app',
    description: 'A month calendar with event pills, month navigation, a today marker and keyboard date navigation.',
    icon: 'CalendarBlank',
    component: 'CalendarMonth',
    keywords: ['calendar', 'month', 'schedule', 'events', 'date', 'agenda', 'planner'],
    propsSchema: z.object({
      month: nonTextString('2026-10', ISO_MONTH),
      today: nonTextString('2026-10-28', ISO_DATE),
      events: z
        .array(
          z.object({
            date: z.string().default(''),
            title: z.string().default(''),
            tone: z.enum(TONES).default('primary')
          })
        )
        .default([]),
      weekStartsOn: z.enum(['sunday', 'monday']).default('sunday')
    }),
    defaultProps: {
      month: '2026-10',
      today: '2026-10-28',
      events: [
        { date: '2026-10-06', title: 'Sprint planning', tone: 'primary' },
        { date: '2026-10-09', title: 'Security review', tone: 'warning' },
        { date: '2026-10-14', title: 'Release 2.14', tone: 'success' },
        { date: '2026-10-14', title: 'Board update', tone: 'violet' },
        { date: '2026-10-20', title: 'Customer advisory call', tone: 'primary' },
        { date: '2026-10-23', title: 'Quarterly roadmap review', tone: 'violet' },
        { date: '2026-10-28', title: 'Design critique', tone: 'primary' },
        { date: '2026-10-28', title: 'Incident retrospective', tone: 'danger' },
        { date: '2026-10-28', title: 'Hiring sync', tone: 'neutral' },
        { date: '2026-10-30', title: 'Release 2.15', tone: 'success' },
        { date: '2026-11-03', title: 'Sprint planning', tone: 'primary' }
      ],
      weekStartsOn: 'sunday'
    },
    propControls: {
      month: { label: 'Initial month', type: 'text', help: 'YYYY-MM, e.g. 2026-10. Invalid values fall back to the month of "Today".' },
      today: { label: 'Today', type: 'date', help: 'Date marked as today. Fixed so the server and browser render the same calendar.' },
      events: { label: 'Events', help: 'Event `date` uses YYYY-MM-DD.' },
      weekStartsOn: {
        label: 'Week starts on',
        type: 'select',
        options: [
          { value: 'sunday', label: 'Sunday' },
          { value: 'monday', label: 'Monday' }
        ]
      }
    },
    slots: [],
    behaviour: [
      'Month grid for the visible month (initialised from `month`, else the month of `today`) with only the needed week rows; leading/trailing days of adjacent months are muted. All date math is UTC on YYYY-MM-DD strings (no time-zone drift, no clock access).',
      'Header: month label (h3, aria-live="polite"), a "Today" button (jumps to and selects `today`) and previous/next month icon buttons; navigation is local state.',
      'role="grid" with columnheader weekday abbreviations and gridcell days using a roving tabindex: Arrow keys move by day/week (crossing into adjacent months switches the visible month), Home/End jump to the start/end of the week, PageUp/PageDown move by month, Enter/Space or click selects a day (aria-selected). Each cell has an aria-label with the full date, "today" and its event titles; `today` gets aria-current="date" and a filled primary marker.',
      'Desktop: up to 2 tone-coded event pills per day plus "+N more". Below 768px cells shrink to the day number with up to 3 tone dots and an agenda list of the month\'s events (grouped by date, selected day highlighted) appears under the grid.',
      '`today` defaults to a fixed date so server and client render identically; in the real app pass the current date (YYYY-MM-DD) from the server or set it on mount.'
    ]
  },

  /* ------------------------------------------------------------------------ Pagination */
  'app/pagination': {
    type: 'app/pagination',
    displayName: 'Pagination',
    category: 'app',
    description: 'Page navigation with numbered pages, ellipses, previous/next buttons and a result summary.',
    icon: 'NumberCircleOne',
    component: 'Pagination',
    keywords: ['pagination', 'pages', 'pager', 'next', 'previous', 'results', 'table'],
    propsSchema: z.object({
      total: z.number().int().min(0).default(0),
      pageSize: z.number().int().min(1).max(500).default(10),
      current: z.number().int().min(1).default(1),
      siblingCount: z.number().int().min(0).max(3).default(1),
      variant: z.enum(['numbered', 'simple']).default('numbered'),
      showSummary: z.boolean().default(true),
      itemLabel: z.string().default('results')
    }),
    defaultProps: {
      total: 248,
      pageSize: 10,
      current: 5,
      siblingCount: 1,
      variant: 'numbered',
      showSummary: true,
      itemLabel: 'results'
    },
    propControls: {
      total: { label: 'Total items', type: 'number', min: 0, step: 1 },
      pageSize: { label: 'Items per page', type: 'number', min: 1, max: 500, step: 1 },
      current: { label: 'Current page', type: 'number', min: 1, step: 1 },
      siblingCount: { label: 'Sibling pages', type: 'number', min: 0, max: 3, step: 1, help: 'Pages shown on each side of the current page.' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [
          { value: 'numbered', label: 'Numbered' },
          { value: 'simple', label: 'Previous / next' }
        ]
      },
      showSummary: { label: 'Show result summary' },
      itemLabel: { label: 'Item noun', help: 'Used in "Showing 41–50 of 248 results".' }
    },
    slots: [],
    behaviour: [
      '<nav aria-label="Pagination"> with an optional live summary "Showing {start}–{end} of {total} {itemLabel}" ("No {itemLabel}" when total is 0).',
      'Page count = ceil(total / pageSize), at least 1; the current page is local state initialised from `current` (clamped) and re-initialised when props change. Wire it to your data fetching or the URL (?page=n).',
      'Numbered: first and last page always show, plus the current page and `siblingCount` pages on each side; a hidden range becomes an ellipsis (a gap of exactly one page shows the page instead), so the item count stays constant (2 × siblingCount + 5). The current page button has aria-current="page"; buttons have aria-labels "Page N".',
      'Previous/next buttons are disabled at the ends. "simple" shows only previous/next and "Page N of M". Below 768px the numbered variant hides sibling pages and the step labels (40px tap targets).'
    ]
  },

  /* ------------------------------------------------------------------------ Stepper */
  'app/stepper': {
    type: 'app/stepper',
    displayName: 'Stepper',
    category: 'app',
    description: 'A multi-step form wizard with a progress indicator, per-step validation and a review step.',
    icon: 'ListNumbers',
    component: 'Stepper',
    keywords: ['stepper', 'wizard', 'steps', 'multi-step form', 'onboarding', 'checkout', 'progress'],
    propsSchema: z.object({
      title: z.string().default(''),
      description: z.string().default(''),
      steps: z
        .array(
          z.object({
            title: z.string().default(''),
            description: z.string().default(''),
            fields: z
              .array(
                z.object({
                  label: z.string().default(''),
                  placeholder: z.string().default(''),
                  type: z.enum(['text', 'email', 'url', 'tel', 'number', 'textarea']).default('text'),
                  required: z.boolean().default(true)
                })
              )
              .default([])
          })
        )
        .default([]),
      submitText: z.string().default('Submit'),
      successTitle: z.string().default('All set'),
      successMessage: z.string().default('')
    }),
    defaultProps: {
      title: 'Create a workspace',
      description: 'Set up your team in under a minute. You can change everything later.',
      steps: [
        {
          title: 'Workspace',
          description: 'Name your workspace and choose its URL.',
          fields: [
            { label: 'Workspace name', placeholder: 'e.g. Platform Team', type: 'text', required: true },
            { label: 'Workspace URL', placeholder: 'platform-team', type: 'text', required: true }
          ]
        },
        {
          title: 'Team',
          description: 'Invite a teammate to collaborate with you.',
          fields: [
            { label: 'Teammate email', placeholder: 'name@company.com', type: 'email', required: true },
            { label: 'Role', placeholder: 'e.g. Engineer', type: 'text', required: false }
          ]
        },
        {
          title: 'Billing',
          description: 'Where should invoices be sent?',
          fields: [
            { label: 'Billing email', placeholder: 'billing@company.com', type: 'email', required: true },
            { label: 'Company name', placeholder: 'Company Inc.', type: 'text', required: false }
          ]
        }
      ],
      submitText: 'Create workspace',
      successTitle: 'Workspace details confirmed',
      successMessage: 'Everything passed validation. This prototype stores nothing; connect the submit action to your backend to create the workspace.'
    },
    propControls: {
      steps: { label: 'Steps', help: 'A "Review & submit" step is added automatically after the last step.' },
      successMessage: { label: 'Success message', type: 'textarea' }
    },
    slots: [],
    behaviour: [
      'Steps = `steps` plus an automatic final "Review & submit" step. The indicator (<ol aria-label="Progress">) marks each step complete (filled check), current (primary ring, aria-current="step") or upcoming, with visually hidden status text; below 768px only the current step label is shown.',
      'One <form novalidate> per step. "Continue" validates the step: required fields must be non-blank, email fields need a valid address, url fields need http(s)://, number fields must be numeric. Errors render inline (aria-invalid, aria-describedby, WarningCircle icon) and focus moves to the first invalid field; editing a field clears its error. "Back" keeps entered values.',
      'The review step lists every answer per step (a <dl>, "Not provided" for empty optional fields) with "Edit" buttons that jump back to that step. Submitting re-validates all steps, then shows the success panel (role="status", `successTitle`, `successMessage`) with a "Start over" button.',
      'Honest mock: nothing is sent anywhere. Connect the final submit to your API and surface server errors; focus moves to each new step heading for screen-reader context.'
    ]
  },

  /* ------------------------------------------------------------------------ Description list */
  'app/description-list': {
    type: 'app/description-list',
    displayName: 'Description List',
    category: 'app',
    description: 'A key/value details panel in one or two columns with copy-to-clipboard buttons.',
    icon: 'ListDashes',
    component: 'DescriptionList',
    keywords: ['description list', 'details', 'key value', 'properties', 'attributes', 'metadata', 'copy', 'settings'],
    propsSchema: z.object({
      title: z.string().default(''),
      description: z.string().default(''),
      items: z
        .array(z.object({ term: z.string().default(''), detail: z.string().default(''), copyable: z.boolean().default(false) }))
        .default([]),
      columns: z.number().int().min(1).max(2).default(2)
    }),
    defaultProps: {
      title: 'Subscription details',
      description: 'Plan and billing information for this workspace.',
      items: [
        { term: 'Plan', detail: 'Business, billed annually', copyable: false },
        { term: 'Workspace ID', detail: 'ws_8f3k2m9q4x', copyable: true },
        { term: 'Billing email', detail: 'billing@example.com', copyable: true },
        { term: 'Seats', detail: '42 of 50 in use', copyable: false },
        { term: 'Renewal date', detail: 'March 14, 2027', copyable: false },
        { term: 'API endpoint', detail: 'https://api.example.com/v1', copyable: true }
      ],
      columns: 2
    },
    propControls: {
      items: { label: 'Details', help: 'Turn on "copyable" to add a copy button (values render in the mono font).' },
      columns: {
        label: 'Columns',
        type: 'number',
        min: 1,
        max: 2,
        step: 1,
        help: '1 = term beside value; 2 = two-column grid (one column on mobile).'
      }
    },
    slots: [],
    behaviour: [
      'A titled card containing a <dl>. `columns: 1` lays each term beside its detail from 768px; `columns: 2` uses a two-column grid from 768px. Below 768px every row stacks term over detail.',
      'Items with `copyable: true` render the detail in the mono font with a "Copy" button (aria-label "Copy {term}"). Clicking writes the detail to the clipboard (navigator.clipboard.writeText); the button shows "Copied" with a check for 2 seconds, or "Failed" when the Clipboard API is unavailable or denied, and the result is announced in a polite status region.'
    ]
  },

  /* ------------------------------------------------------------------------ Notification list */
  'app/notification-list': {
    type: 'app/notification-list',
    displayName: 'Notifications',
    category: 'app',
    description: 'A notifications panel with All/Unread tabs, unread indicators and mark-all-as-read.',
    icon: 'Bell',
    component: 'NotificationList',
    keywords: ['notifications', 'inbox', 'alerts', 'unread', 'messages', 'bell', 'updates'],
    propsSchema: z.object({
      title: z.string().default('Notifications'),
      items: z
        .array(
          z.object({
            title: z.string().default(''),
            body: z.string().default(''),
            time: z.string().default(''),
            read: z.boolean().default(false),
            icon: z.string().default('Bell')
          })
        )
        .default([]),
      now: nonTextString(DEFAULT_NOW)
    }),
    defaultProps: {
      title: 'Notifications',
      items: [
        { title: 'Deployment succeeded', body: 'billing-api v2.14.0 is live in production.', time: '2026-10-28T11:52:00Z', read: false, icon: 'CheckCircle' },
        { title: 'New comment on Q4 pricing experiment', body: 'Priya Nair: "Can we extend the test to the EU cohort?"', time: '2026-10-28T10:40:00Z', read: false, icon: 'ChatCircleText' },
        { title: 'Invoice available', body: 'Your October invoice for $4,280.00 is ready to download.', time: '2026-10-28T07:15:00Z', read: false, icon: 'Receipt' },
        { title: 'Usage alert', body: 'API requests reached 80% of the monthly quota.', time: '2026-10-27T18:05:00Z', read: true, icon: 'Warning' },
        { title: 'Security policy updated', body: 'Two-factor authentication is now required for all admins.', time: '2026-10-25T09:00:00Z', read: true, icon: 'ShieldCheck' }
      ],
      now: DEFAULT_NOW
    },
    propControls: {
      items: { label: 'Notifications', help: '`time` is an ISO 8601 timestamp (shown relative) or free text such as "2h ago".' },
      now: { label: 'Reference time', type: 'text', help: 'ISO 8601 timestamp relative times are computed from. Fixed so the server and browser render the same text.', group: 'settings' }
    },
    slots: [],
    behaviour: [
      'Header with `title`, a "Mark all as read" button (disabled when nothing is unread) and an All/Unread tablist (role="tablist", roving tabindex, Arrow Left/Right/Home/End) whose Unread tab shows the unread count; the list is the tabpanel.',
      'Read state is local (initialised from each item\'s `read`, re-initialised when `items` changes). Unread items have a tinted background, bold title, a primary dot and visually hidden "Unread" text; clicking an item (a full-width button) marks it read. The Unread tab hides read items and shows "You are all caught up" when empty.',
      'ISO `time` values render as relative text ("Just now", "12m ago", "3h ago", "2d ago", then "Oct 12") computed from `now` (default 2026-10-28T12:00:00Z, so SSR and client match); other strings render verbatim. In the real app pass the current time and persist read state through your API.'
    ]
  }
};
