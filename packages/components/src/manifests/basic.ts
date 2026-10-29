import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';
import { cssValue, TEXT_ALIGN } from './shared.js';
import { safeSrc } from '../svelte/lib/href.js';
import { resolveIconName } from '../svelte/lib/icons.js';

/* -------------------------------------------------------------------------------------------- */
/* Schema helpers shared by the basic and media manifests                                        */
/* -------------------------------------------------------------------------------------------- */

export const TONES = ['default', 'muted', 'primary'] as const;
export const IMAGE_RATIOS = ['auto', '1:1', '4:3', '3:2', '16:9', '21:9'] as const;
export const RADII = ['none', 'sm', 'md', 'lg', 'full'] as const;

/**
 * Image / poster / avatar URL: empty, or a URL the runtime `safeSrc` policy accepts (http(s) or a
 * relative path). Anything else (javascript:, data:, protocol-relative…) fails validation and
 * falls back to the default, so the canvas, the export and the build spec agree on the value.
 */
export const mediaUrl = () =>
  z.string().refine((value) => value.trim() === '' || safeSrc(value) !== '', { message: 'Unsafe or unsupported media URL' });

/**
 * Icon name, canonicalised to its Phosphor name (Lucide-style aliases such as "Zap" and legacy
 * emoji resolve to "Lightning", …). Unknown names are kept verbatim and render the fallback icon.
 */
export const iconName = (fallback: string) => z.string().transform((value) => resolveIconName(value) ?? value).default(fallback);

export const opt = (value: string, label: string) => ({ value, label });

export const TONE_OPTIONS = [opt('default', 'Default (inherit)'), opt('muted', 'Muted'), opt('primary', 'Primary')];
export const ALIGN_OPTIONS = [opt('left', 'Left'), opt('center', 'Center'), opt('right', 'Right')];
export const IMAGE_RATIO_OPTIONS = [
  opt('auto', 'Original'),
  opt('1:1', 'Square 1:1'),
  opt('4:3', 'Standard 4:3'),
  opt('3:2', 'Classic 3:2'),
  opt('16:9', 'Wide 16:9'),
  opt('21:9', 'Cinema 21:9')
];
export const RADIUS_OPTIONS = [opt('none', 'None'), opt('sm', 'Small'), opt('md', 'Medium'), opt('lg', 'Large'), opt('full', 'Full')];

/* -------------------------------------------------------------------------------------------- */
/* Manifests                                                                                     */
/* -------------------------------------------------------------------------------------------- */

const HEADING_SIZES = ['display', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
const HEADING_LEVELS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

const DEFAULT_CODE = [
  "import type { PageLoad } from './$types';",
  '',
  'export const load: PageLoad = async ({ fetch }) => {',
  "  const response = await fetch('/api/projects');",
  "  if (!response.ok) throw new Error('Could not load projects');",
  '  return { projects: await response.json() };',
  '};'
].join('\n');

/** Basic content elements: heading, text, image, icon, spacer, icon list, icon box, image box, quote, code. */
export const BASIC_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'basic/heading': {
    type: 'basic/heading',
    displayName: 'Heading',
    category: 'basic',
    description: 'A semantic title whose visual size is independent of its heading level.',
    icon: 'TextHOne',
    component: 'Heading',
    keywords: ['title', 'headline', 'h1', 'h2', 'h3', 'text', 'eyebrow', 'typography'],
    propsSchema: z.object({
      text: z.string().default('Build something people love'),
      eyebrow: z.string().default(''),
      level: z.enum(HEADING_LEVELS).default('h2'),
      size: z.enum(HEADING_SIZES).default('xl'),
      align: z.enum(TEXT_ALIGN).default('left'),
      tone: z.enum(TONES).default('default'),
      href: z.string().default('')
    }),
    defaultProps: {
      text: 'Build something people love',
      eyebrow: '',
      level: 'h2',
      size: 'xl',
      align: 'left',
      tone: 'default',
      href: ''
    },
    propControls: {
      text: { label: 'Title', type: 'textarea', group: 'Content' },
      eyebrow: { label: 'Eyebrow', help: 'Small uppercase label above the title. Leave empty to hide.', group: 'Content' },
      href: { label: 'Link', type: 'url', help: 'When set, the whole title becomes a link.', group: 'Content' },
      level: {
        label: 'HTML tag',
        type: 'select',
        options: HEADING_LEVELS.map((l) => opt(l, l.toUpperCase())),
        help: 'Document outline level. Use one H1 per page; visual size is set separately.',
        group: 'Settings'
      },
      size: {
        label: 'Size',
        type: 'select',
        options: [opt('display', 'Display'), opt('xl', 'Extra large'), opt('lg', 'Large'), opt('md', 'Medium'), opt('sm', 'Small'), opt('xs', 'Extra small')],
        group: 'Settings'
      },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS, group: 'Settings' },
      tone: { label: 'Color', type: 'select', options: TONE_OPTIONS, group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Renders the element named by `level` (h1–h6) inside a block wrapper; the visual `size` is independent of the level.',
      'Fluid type scale (font-size clamps between the two values as the viewport grows): display 2.5rem→4.5rem, xl 2rem→3rem, lg 1.625rem→2.25rem, md 1.375rem→1.75rem, sm 1.25rem, xs 1.0625rem; larger sizes use tighter line-height and negative letter-spacing.',
      'Typography is set on the wrapper and inherited by the heading, so font-size, weight, color and alignment overrides on the element apply to the title text.',
      '`tone`: default inherits the surrounding text color, muted uses on-surface-variant, primary uses the primary color.',
      'When `eyebrow` is set it renders as a small uppercase primary-colored paragraph above the heading.',
      'When `href` is set the heading text is wrapped in a link (underline on hover, visible focus ring).'
    ]
  },

  'basic/text': {
    type: 'basic/text',
    displayName: 'Text',
    category: 'basic',
    description: 'Body copy with paragraphs, line breaks, size, color and a readable measure.',
    icon: 'Paragraph',
    component: 'Text',
    keywords: ['paragraph', 'body', 'copy', 'text editor', 'lead', 'description', 'prose'],
    propsSchema: z.object({
      content: z
        .string()
        .default(
          'Plan, build and launch from a single workspace. Every page you design here exports as clean, typed components your team can extend with confidence.'
        ),
      size: z.enum(['lead', 'md', 'sm']).default('md'),
      align: z.enum(TEXT_ALIGN).default('left'),
      tone: z.enum(TONES).default('muted'),
      maxWidth: z.enum(['none', 'prose', 'narrow']).default('prose')
    }),
    defaultProps: {
      content:
        'Plan, build and launch from a single workspace. Every page you design here exports as clean, typed components your team can extend with confidence.',
      size: 'md',
      align: 'left',
      tone: 'muted',
      maxWidth: 'prose'
    },
    propControls: {
      content: { label: 'Text', type: 'textarea', help: 'Separate paragraphs with a blank line. A single line break becomes a line break.', group: 'Content' },
      size: { label: 'Size', type: 'select', options: [opt('lead', 'Lead (large)'), opt('md', 'Body'), opt('sm', 'Small')], group: 'Settings' },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS, group: 'Settings' },
      tone: { label: 'Color', type: 'select', options: TONE_OPTIONS, group: 'Settings' },
      maxWidth: {
        label: 'Line length',
        type: 'select',
        options: [opt('none', 'Full width'), opt('prose', 'Readable (65ch)'), opt('narrow', 'Narrow (45ch)')],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'Splits `content` on blank lines into separate <p> elements; single newlines inside a paragraph render as <br>. Text is always escaped (never rendered as HTML).',
      'Sizes: lead 1.25rem/1.6 (1.125rem below 768px), md 1rem/1.7, sm 0.875rem/1.6; paragraphs are separated by 1em.',
      '`maxWidth`: prose limits the measure to 65ch, narrow to 45ch, none fills the container; centered/right alignment also centers/right-aligns the limited block.',
      '`tone`: default inherits the surrounding color, muted uses on-surface-variant, primary uses the primary color.'
    ]
  },

  'basic/image': {
    type: 'basic/image',
    displayName: 'Image',
    category: 'basic',
    description: 'A responsive image with fixed aspect ratio, caption, optional link and placeholder.',
    icon: 'Image',
    component: 'Image',
    keywords: ['picture', 'photo', 'img', 'media', 'figure', 'caption', 'screenshot'],
    propsSchema: z.object({
      imageUrl: mediaUrl().default(''),
      alt: z.string().default(''),
      decorative: z.boolean().default(false),
      caption: z.string().default(''),
      href: z.string().default(''),
      aspectRatio: z.enum(IMAGE_RATIOS).default('16:9'),
      fit: z.enum(['cover', 'contain']).default('cover'),
      radius: z.enum(RADII).default('md'),
      shadow: z.boolean().default(false),
      loading: z.enum(['lazy', 'eager']).default('lazy')
    }),
    defaultProps: {
      imageUrl: '',
      alt: '',
      decorative: false,
      caption: '',
      href: '',
      aspectRatio: '16:9',
      fit: 'cover',
      radius: 'md',
      shadow: false,
      loading: 'lazy'
    },
    propControls: {
      imageUrl: { label: 'Image', type: 'image', help: 'https:// URL or a site-relative path such as /images/hero.jpg.', group: 'Content' },
      alt: { label: 'Alt text', help: 'Describe the image for screen readers and search engines.', group: 'Content' },
      decorative: { label: 'Decorative image', help: 'Purely visual images are hidden from assistive technology (empty alt).', group: 'Content' },
      caption: { label: 'Caption', type: 'textarea', group: 'Content' },
      href: { label: 'Link', type: 'url', group: 'Content' },
      aspectRatio: { label: 'Aspect ratio', type: 'select', options: IMAGE_RATIO_OPTIONS, group: 'Settings' },
      fit: { label: 'Fit', type: 'select', options: [opt('cover', 'Fill (crop)'), opt('contain', 'Fit (letterbox)')], group: 'Settings' },
      radius: { label: 'Corner radius', type: 'select', options: RADIUS_OPTIONS, group: 'Settings' },
      shadow: { label: 'Shadow', group: 'Settings' },
      loading: {
        label: 'Loading',
        type: 'select',
        options: [opt('lazy', 'Lazy (below the fold)'), opt('eager', 'Eager (above the fold)')],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'Renders <figure> with an <img> that always carries width/height attributes plus a CSS aspect-ratio (auto uses the image\'s natural ratio), so loading never shifts layout.',
      '`fit` maps to object-fit; `radius` none/sm/md/lg/full maps to the shape tokens (full = circle/pill); `shadow` adds a soft layered shadow.',
      'Alt text comes from `alt`; with `decorative: true` the image gets alt="" and is hidden from assistive technology.',
      'An empty or unsafe `imageUrl`, or an image that fails to load, renders a neutral placeholder frame (dotted surface, image icon, the alt text or "Add an image") at the same aspect ratio — never a broken image.',
      'When `href` is set the image is wrapped in a link; `caption` renders as a muted <figcaption> below.',
      '`loading` maps to the img loading attribute (eager also sets fetchpriority="high").'
    ]
  },

  'basic/icon': {
    type: 'basic/icon',
    displayName: 'Icon',
    category: 'basic',
    description: 'A single icon with optional tinted, filled or outlined circle and link.',
    icon: 'Star',
    component: 'IconElement',
    keywords: ['icon', 'symbol', 'glyph', 'badge', 'pictogram', 'svg'],
    propsSchema: z.object({
      name: iconName('Lightning'),
      size: z.enum(['sm', 'md', 'lg', 'xl']).default('md'),
      variant: z.enum(['plain', 'soft', 'solid', 'outline']).default('soft'),
      tone: z.enum(TONES).default('primary'),
      align: z.enum(TEXT_ALIGN).default('left'),
      href: z.string().default(''),
      label: z.string().default('')
    }),
    defaultProps: {
      name: 'Lightning',
      size: 'md',
      variant: 'soft',
      tone: 'primary',
      align: 'left',
      href: '',
      label: ''
    },
    propControls: {
      name: { label: 'Icon', type: 'icon', group: 'Content' },
      label: {
        label: 'Accessible label',
        help: 'Read by screen readers. Leave empty for a purely decorative icon (links fall back to the icon name).',
        group: 'Content'
      },
      href: { label: 'Link', type: 'url', group: 'Content' },
      size: { label: 'Size', type: 'select', options: [opt('sm', 'Small (20px)'), opt('md', 'Medium (28px)'), opt('lg', 'Large (40px)'), opt('xl', 'Extra large (56px)')], group: 'Settings' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [opt('plain', 'Plain'), opt('soft', 'Tinted circle'), opt('solid', 'Filled circle'), opt('outline', 'Outline ring')],
        group: 'Settings'
      },
      tone: { label: 'Color', type: 'select', options: TONE_OPTIONS, group: 'Settings' },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS, group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Icon glyph sizes: sm 20px, md 28px, lg 40px, xl 56px. soft/solid/outline variants place the glyph in a circle of 2× the glyph size (sm 40px, md 56px, lg 80px, xl 112px).',
      'Variants: plain = glyph only; soft = circle tinted with 12% of the tone color; solid = circle filled with the tone color and contrasting glyph (on-primary for primary, surface for default/muted); outline = 1.5px ring in the tone color.',
      '`align` positions the icon left/center/right within its row.',
      'With `label` the icon is announced (visually hidden text); without it the icon is decorative (aria-hidden). With `href` the icon becomes a link whose accessible name is the label or, when empty, the icon name.'
    ]
  },

  'basic/spacer': {
    type: 'basic/spacer',
    displayName: 'Spacer',
    category: 'basic',
    description: 'Invisible vertical space with an optional smaller height on mobile.',
    icon: 'ArrowsOutLineVertical',
    component: 'Spacer',
    keywords: ['space', 'gap', 'whitespace', 'padding', 'margin', 'separator', 'vertical'],
    propsSchema: z.object({
      height: z.number().min(0).max(800).default(64),
      mobileHeight: z.number().min(0).max(800).optional(),
      unit: z.enum(['px', 'rem', 'vh']).default('px')
    }),
    defaultProps: { height: 64, unit: 'px' },
    propControls: {
      height: { label: 'Height', type: 'number', min: 0, max: 800, step: 4, help: 'Vertical space on tablet and desktop.', group: 'Settings' },
      mobileHeight: { label: 'Mobile height', type: 'number', min: 0, max: 800, step: 4, help: 'Optional height at 767px and below. Empty uses the main height.', group: 'Settings' },
      unit: { label: 'Unit', type: 'select', options: [opt('px', 'px'), opt('rem', 'rem'), opt('vh', 'vh (viewport height)')], group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Renders an empty, aria-hidden block of `height` + `unit` (default 64px). Nothing is visible in the output.',
      'When `mobileHeight` is set it replaces the height at viewport widths of 767px and below (same unit).',
      'Non-finite or negative values fall back to the defaults; heights are clamped to 0–800.'
    ]
  },

  'basic/icon-list': {
    type: 'basic/icon-list',
    displayName: 'Icon List',
    category: 'basic',
    description: 'A vertical or inline list of short items, each led by an icon.',
    icon: 'ListBullets',
    component: 'IconList',
    keywords: ['list', 'bullets', 'checklist', 'features', 'benefits', 'icons', 'ul'],
    propsSchema: z.object({
      items: z
        .array(
          z.object({
            icon: iconName('CheckCircle'),
            text: z.string().default(''),
            href: z.string().default('')
          })
        )
        .default([]),
      layout: z.enum(['vertical', 'inline']).default('vertical'),
      iconTone: z.enum(TONES).default('primary'),
      divider: z.boolean().default(false),
      gap: cssValue().default('0.75rem')
    }),
    defaultProps: {
      items: [
        { icon: 'CheckCircle', text: 'Unlimited projects and collaborators', href: '' },
        { icon: 'CheckCircle', text: 'Version history with one-click restore', href: '' },
        { icon: 'CheckCircle', text: 'Single sign-on and audit logs', href: '' },
        { icon: 'CheckCircle', text: 'Priority support from product specialists', href: '' }
      ],
      layout: 'vertical',
      iconTone: 'primary',
      divider: false,
      gap: '0.75rem'
    },
    propControls: {
      items: { label: 'Items', group: 'Items' },
      layout: { label: 'Layout', type: 'select', options: [opt('vertical', 'Vertical'), opt('inline', 'Inline (wraps)')], group: 'Settings' },
      iconTone: { label: 'Icon color', type: 'select', options: TONE_OPTIONS, group: 'Settings' },
      divider: { label: 'Dividers', help: 'Hairline between items.', group: 'Settings' },
      gap: { label: 'Gap', help: 'Space between items, e.g. 0.75rem or 12px.', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Semantic <ul>; each item is an <li> with a 20px icon (in `iconTone`) followed by its text, which becomes a link when the item has an `href`.',
      'vertical stacks items; inline lays them out in a wrapping row (inline items stack vertically below 480px).',
      '`divider` draws a 1px outline-variant hairline between items (horizontal rules when vertical, vertical rules when inline).',
      '`gap` (validated CSS length) sets the spacing between items.'
    ]
  },

  'basic/icon-box': {
    type: 'basic/icon-box',
    displayName: 'Icon Box',
    category: 'basic',
    description: 'An icon with a title, short description and optional link, plain or as a card.',
    icon: 'Shapes',
    component: 'IconBox',
    keywords: ['feature', 'service', 'benefit', 'icon', 'card', 'box', 'info'],
    propsSchema: z.object({
      icon: iconName('Lightning'),
      title: z.string().default('Ship in minutes, not weeks'),
      description: z.string().default(''),
      linkText: z.string().default(''),
      href: z.string().default(''),
      layout: z.enum(['top', 'left']).default('top'),
      align: z.enum(TEXT_ALIGN).default('left'),
      variant: z.enum(['plain', 'card']).default('plain')
    }),
    defaultProps: {
      icon: 'Lightning',
      title: 'Ship in minutes, not weeks',
      description: 'Preview every change instantly and publish to production with a single click when your team is ready.',
      linkText: 'Learn more',
      href: '#',
      layout: 'top',
      align: 'left',
      variant: 'plain'
    },
    propControls: {
      icon: { label: 'Icon', type: 'icon', group: 'Content' },
      title: { label: 'Title', group: 'Content' },
      description: { label: 'Description', type: 'textarea', group: 'Content' },
      linkText: { label: 'Link text', help: 'Leave empty to hide the link.', group: 'Buttons & links' },
      href: { label: 'Link', type: 'url', group: 'Buttons & links' },
      layout: { label: 'Icon position', type: 'select', options: [opt('top', 'Above text'), opt('left', 'Beside text')], group: 'Settings' },
      align: { label: 'Alignment', type: 'select', options: ALIGN_OPTIONS, help: 'Applies when the icon sits above the text.', group: 'Settings' },
      variant: { label: 'Style', type: 'select', options: [opt('plain', 'Plain'), opt('card', 'Card')], group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Icon in a 48px rounded tile tinted with 12% primary, then an h3 title (1.125rem/600), a muted description and an optional text link with a trailing arrow.',
      '`layout: "left"` places the icon beside the text (row); `layout: "top"` stacks it above and honours `align` (left/center/right).',
      '`variant: "card"` adds an outline-variant border, large radius, 1.75rem padding and a lowest-surface background; hovering lifts the border color.',
      'The link renders only when `linkText` is set; its href goes through the URL policy.'
    ]
  },

  'basic/image-box': {
    type: 'basic/image-box',
    displayName: 'Image Box',
    category: 'basic',
    description: 'An image paired with a title, description and call to action, including an overlay style.',
    icon: 'ImageSquare',
    component: 'ImageBox',
    keywords: ['image', 'card', 'feature', 'teaser', 'overlay', 'thumbnail', 'post'],
    propsSchema: z.object({
      imageUrl: mediaUrl().default(''),
      imageAlt: z.string().default(''),
      aspectRatio: z.enum(['1:1', '4:3', '3:2', '16:9', '4:5']).default('3:2'),
      title: z.string().default('Collaborate in real time'),
      description: z.string().default(''),
      ctaText: z.string().default(''),
      ctaHref: z.string().default(''),
      variant: z.enum(['plain', 'card', 'overlay']).default('card')
    }),
    defaultProps: {
      imageUrl: '',
      imageAlt: '',
      aspectRatio: '3:2',
      title: 'Collaborate in real time',
      description: 'Comment, review and approve work in context so decisions never get lost in long email threads.',
      ctaText: 'Read the story',
      ctaHref: '#',
      variant: 'card'
    },
    propControls: {
      imageUrl: { label: 'Image', type: 'image', group: 'Content' },
      imageAlt: { label: 'Alt text', help: 'Describe the image. Leave empty only for purely decorative images.', group: 'Content' },
      title: { label: 'Title', group: 'Content' },
      description: { label: 'Description', type: 'textarea', group: 'Content' },
      ctaText: { label: 'Link text', help: 'Leave empty to hide the link.', group: 'Buttons & links' },
      ctaHref: { label: 'Link', type: 'url', group: 'Buttons & links' },
      aspectRatio: {
        label: 'Image ratio',
        type: 'select',
        options: [opt('1:1', 'Square 1:1'), opt('4:3', 'Standard 4:3'), opt('3:2', 'Classic 3:2'), opt('16:9', 'Wide 16:9'), opt('4:5', 'Portrait 4:5')],
        group: 'Settings'
      },
      variant: { label: 'Style', type: 'select', options: [opt('plain', 'Plain'), opt('card', 'Card'), opt('overlay', 'Text over image')], group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'plain: rounded image, then title, description and link below. card: bordered card with the image flush at the top and padded content. overlay: text sits on the image over a bottom black gradient scrim (white text, WCAG AA on any image) with a 320px minimum height.',
      'The image keeps `aspectRatio` with object-fit: cover; an empty, unsafe or failing image URL renders a neutral placeholder frame at the same ratio.',
      'The call to action renders only when `ctaText` is set: a primary text link (white in the overlay style) with a trailing arrow that nudges right on hover; its href goes through the URL policy.'
    ]
  },

  'basic/blockquote': {
    type: 'basic/blockquote',
    displayName: 'Quote',
    category: 'basic',
    description: 'A pull quote with author, role and avatar in four presentation styles.',
    icon: 'Quotes',
    component: 'Blockquote',
    keywords: ['quote', 'blockquote', 'testimonial', 'citation', 'pull quote', 'review'],
    propsSchema: z.object({
      quote: z.string().default('The fastest way to align a team is to put the work where everyone can see it.'),
      author: z.string().default(''),
      role: z.string().default(''),
      avatarUrl: mediaUrl().default(''),
      variant: z.enum(['simple', 'accent-border', 'card', 'large-centered']).default('accent-border')
    }),
    defaultProps: {
      quote: 'We replaced three disconnected tools with one shared workspace, and our release cadence doubled within a quarter.',
      author: 'Maya Lindqvist',
      role: 'Head of Platform Engineering',
      avatarUrl: '',
      variant: 'accent-border'
    },
    propControls: {
      quote: { label: 'Quote', type: 'textarea', group: 'Content' },
      author: { label: 'Author', group: 'Content' },
      role: { label: 'Role or company', group: 'Content' },
      avatarUrl: { label: 'Avatar', type: 'image', help: 'Square photo. When empty the author initials are shown.', group: 'Content' },
      variant: {
        label: 'Style',
        type: 'select',
        options: [opt('simple', 'Simple'), opt('accent-border', 'Accent border'), opt('card', 'Card'), opt('large-centered', 'Large centered')],
        group: 'Settings'
      }
    },
    slots: [],
    behaviour: [
      'Semantic <figure> containing a <blockquote> and a <figcaption> with a 40px avatar (or two-letter initials on a tinted circle), the author name and the role.',
      'Variants: simple = quote text only; accent-border = 3px primary left border; card = bordered surface card with a primary quote mark; large-centered = centered display-size quote (1.5rem→2rem) with a quote mark above.',
      'The avatar image goes through the media URL policy; an empty, unsafe or failing avatar falls back to initials.'
    ]
  },

  'basic/code-block': {
    type: 'basic/code-block',
    displayName: 'Code Block',
    category: 'basic',
    description: 'A monospace code snippet with file name, language label, line numbers and copy button.',
    icon: 'CodeBlock',
    component: 'CodeBlock',
    keywords: ['code', 'snippet', 'pre', 'syntax', 'terminal', 'developer', 'copy'],
    propsSchema: z.object({
      content: z.string().default(DEFAULT_CODE),
      language: z.string().default('TypeScript'),
      filename: z.string().default(''),
      showLineNumbers: z.boolean().default(true),
      theme: z.enum(['dark', 'light']).default('dark')
    }),
    defaultProps: {
      content: DEFAULT_CODE,
      language: 'TypeScript',
      filename: 'src/routes/projects/+page.ts',
      showLineNumbers: true,
      theme: 'dark'
    },
    propControls: {
      content: { label: 'Code', type: 'code', group: 'Content' },
      filename: { label: 'File name', help: 'Shown in the header. Leave empty to hide.', group: 'Content' },
      language: { label: 'Language label', help: 'Display label only; no syntax highlighting is applied.', group: 'Content' },
      showLineNumbers: { label: 'Line numbers', group: 'Settings' },
      theme: { label: 'Theme', type: 'select', options: [opt('dark', 'Dark'), opt('light', 'Light')], group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Header bar with the file name (or the language when no file name), the language label and a Copy button; the code renders as escaped text in <pre><code> (no HTML, no highlighter dependency).',
      'Line numbers sit in a non-selectable, aria-hidden gutter; long lines scroll horizontally inside a keyboard-focusable region.',
      'Copy uses navigator.clipboard.writeText: success shows "Copied" for 2 seconds (announced via a polite live region); when the clipboard API is missing or rejects, the code text is selected and the button reads "Press Ctrl+C" instead of failing.',
      'dark theme: near-black surface tinted with the primary color and light text; light theme: surface-container-low with an outline-variant border.'
    ]
  }
};

