import { z } from 'zod';
import type { ComponentManifest } from '@app-viz/schema';
import { cssValue } from './shared.js';
import { mediaUrl, opt } from './basic.js';

/** Media elements: video, gallery, carousel, map, logo cloud. */
export const MEDIA_MANIFESTS: Record<string, ComponentManifest<any>> = {
  'media/video': {
    type: 'media/video',
    displayName: 'Video',
    category: 'media',
    description: 'A YouTube, Vimeo or self-hosted video with a click-to-load preview.',
    icon: 'VideoCamera',
    component: 'Video',
    keywords: ['video', 'youtube', 'vimeo', 'mp4', 'embed', 'player', 'media'],
    propsSchema: z.object({
      url: mediaUrl().default(''),
      title: z.string().default('Product walkthrough'),
      posterUrl: mediaUrl().default(''),
      captionsUrl: mediaUrl().default(''),
      aspectRatio: z.enum(['16:9', '4:3', '1:1', '9:16', '21:9']).default('16:9'),
      autoplay: z.boolean().default(false),
      muted: z.boolean().default(false),
      loop: z.boolean().default(false),
      controls: z.boolean().default(true)
    }),
    defaultProps: {
      url: '',
      title: 'Product walkthrough',
      posterUrl: '',
      captionsUrl: '',
      aspectRatio: '16:9',
      autoplay: false,
      muted: false,
      loop: false,
      controls: true
    },
    propControls: {
      url: { label: 'Video URL', type: 'text', help: 'YouTube, Vimeo or a direct .mp4 / .webm / .ogg file URL.', group: 'Content' },
      title: { label: 'Title', help: 'Shown on the preview and announced to screen readers.', group: 'Content' },
      posterUrl: { label: 'Poster image', type: 'image', help: 'Preview image before playback. YouTube videos use their own thumbnail when empty.', group: 'Content' },
      captionsUrl: { label: 'Captions (.vtt)', type: 'text', help: 'WebVTT captions for self-hosted video files.', group: 'Content' },
      aspectRatio: {
        label: 'Aspect ratio',
        type: 'select',
        options: [opt('16:9', 'Wide 16:9'), opt('4:3', 'Standard 4:3'), opt('1:1', 'Square 1:1'), opt('9:16', 'Vertical 9:16'), opt('21:9', 'Cinema 21:9')],
        group: 'Settings'
      },
      autoplay: { label: 'Autoplay', help: 'Loads the player immediately and starts muted (browsers block autoplay with sound).', group: 'Settings' },
      muted: { label: 'Start muted', group: 'Settings' },
      loop: { label: 'Loop', group: 'Settings' },
      controls: { label: 'Player controls', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Provider is detected from `url` with a strict allow-list: YouTube (youtube.com/watch?v=, youtu.be/, /embed/, /shorts/, /live/ with an 11-character [A-Za-z0-9_-] ID), Vimeo (vimeo.com/<digits>, player.vimeo.com/video/<digits>, optional private hash) or a direct http(s)/relative file ending in .mp4, .m4v, .webm, .ogv or .ogg. Any other URL renders an "Unsupported video URL" placeholder and is never put in an iframe.',
      'YouTube embeds use https://www.youtube-nocookie.com/embed/<id>; Vimeo embeds use https://player.vimeo.com/video/<id> with dnt=1. Query parameters are built only from the parsed ID and the boolean props (autoplay, mute, loop, controls, start time).',
      'Embeds use a click-to-load facade: a button with the poster (posterUrl, else the YouTube thumbnail from i.ytimg.com, else a dark frame), the title, a play button and the provider name. The iframe (loading="lazy", referrerpolicy="strict-origin-when-cross-origin", allow="autoplay; encrypted-media; picture-in-picture; fullscreen") is only created after the click, then receives focus.',
      '`autoplay: true` skips the facade and starts the player muted. Direct files render a native <video> (preload="metadata", playsinline) with optional WebVTT captions from `captionsUrl`.',
      'The frame keeps `aspectRatio` (9:16 is capped at 360px wide and centered); an empty URL renders a dark placeholder frame inviting a YouTube, Vimeo or .mp4 link.'
    ]
  },

  'media/gallery': {
    type: 'media/gallery',
    displayName: 'Gallery',
    category: 'media',
    description: 'A responsive image grid or masonry layout with an accessible lightbox.',
    icon: 'ImagesSquare',
    component: 'Gallery',
    keywords: ['gallery', 'images', 'photos', 'grid', 'masonry', 'lightbox', 'portfolio'],
    propsSchema: z.object({
      images: z
        .array(
          z.object({
            src: mediaUrl().default(''),
            alt: z.string().default(''),
            caption: z.string().default('')
          })
        )
        .default([]),
      columns: z.number().int().min(2).max(6).default(3),
      gap: cssValue().default('1rem'),
      aspectRatio: z.enum(['1:1', '4:3', '3:2', '16:9', '4:5', 'auto']).default('4:3'),
      layout: z.enum(['grid', 'masonry']).default('grid'),
      lightbox: z.boolean().default(true)
    }),
    defaultProps: {
      images: [
        { src: '', alt: 'Product dashboard overview', caption: '' },
        { src: '', alt: 'Team planning session', caption: '' },
        { src: '', alt: 'Mobile app screens', caption: '' },
        { src: '', alt: 'Quarterly analytics report', caption: '' },
        { src: '', alt: 'Design review board', caption: '' },
        { src: '', alt: 'Customer onboarding flow', caption: '' }
      ],
      columns: 3,
      gap: '1rem',
      aspectRatio: '4:3',
      layout: 'grid',
      lightbox: true
    },
    propControls: {
      images: { label: 'Images', group: 'Items' },
      columns: { label: 'Columns', type: 'number', min: 2, max: 6, step: 1, help: 'Desktop columns; tablets show up to 3, phones 2.', group: 'Settings' },
      gap: { label: 'Gap', help: 'Space between images, e.g. 1rem or 12px.', group: 'Settings' },
      aspectRatio: {
        label: 'Tile ratio',
        type: 'select',
        options: [opt('1:1', 'Square 1:1'), opt('4:3', 'Standard 4:3'), opt('3:2', 'Classic 3:2'), opt('16:9', 'Wide 16:9'), opt('4:5', 'Portrait 4:5'), opt('auto', 'Original')],
        help: 'Grid layout only; masonry keeps each image\'s natural ratio.',
        group: 'Settings'
      },
      layout: { label: 'Layout', type: 'select', options: [opt('grid', 'Grid'), opt('masonry', 'Masonry')], group: 'Settings' },
      lightbox: { label: 'Open in lightbox', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Images render as a <ul>: grid layout = CSS grid with `columns` columns on desktop (≥1024px), min(columns, 3) on tablet, 2 on phones and 1 below 360px; masonry = CSS multi-column layout with the same column counts and natural image ratios.',
      'Grid tiles crop to `aspectRatio` (object-fit: cover; width/height attributes always set). Images with an empty, unsafe or failing src render a neutral placeholder tile showing their alt text.',
      'With `lightbox: true` each tile is a button (aria-haspopup="dialog") that opens a native modal <dialog>: dark backdrop, the image at up to full viewport size, its caption, an "Image n of N" live counter, Close, Previous and Next buttons. Esc and backdrop clicks close it, ArrowLeft/ArrowRight (wrapping) and Home/End navigate, focus stays inside the dialog and returns to the tile on close, and page scrolling is locked while open.',
      'Captions render below tiles when set.'
    ]
  },

  'media/carousel': {
    type: 'media/carousel',
    displayName: 'Carousel',
    category: 'media',
    description: 'An accessible slide show of images with headline, text and call to action.',
    icon: 'Slideshow',
    component: 'Carousel',
    keywords: ['carousel', 'slider', 'slideshow', 'slides', 'hero slider', 'banner', 'rotator'],
    propsSchema: z.object({
      slides: z
        .array(
          z.object({
            src: mediaUrl().default(''),
            alt: z.string().default(''),
            title: z.string().default(''),
            text: z.string().default(''),
            ctaText: z.string().default(''),
            ctaHref: z.string().default('')
          })
        )
        .default([]),
      overlay: z.enum(['gradient', 'center', 'below', 'none']).default('gradient'),
      aspectRatio: z.enum(['21:9', '16:9', '3:2', '4:3', '1:1']).default('16:9'),
      autoplay: z.boolean().default(false),
      interval: z.number().int().min(2000).max(30000).default(6000),
      loop: z.boolean().default(true),
      showArrows: z.boolean().default(true),
      showDots: z.boolean().default(true)
    }),
    defaultProps: {
      slides: [
        {
          src: '',
          alt: '',
          title: 'Plan every release in one place',
          text: 'Roadmaps, specs and feedback stay connected from the first idea to launch day.',
          ctaText: 'Explore planning',
          ctaHref: '#'
        },
        {
          src: '',
          alt: '',
          title: 'Ship with confidence',
          text: 'Automated checks and staged rollouts catch regressions before your customers do.',
          ctaText: 'See how it works',
          ctaHref: '#'
        },
        {
          src: '',
          alt: '',
          title: 'Measure what matters',
          text: 'Live dashboards turn product usage into decisions your whole team can act on.',
          ctaText: 'View analytics',
          ctaHref: '#'
        }
      ],
      overlay: 'gradient',
      aspectRatio: '16:9',
      autoplay: false,
      interval: 6000,
      loop: true,
      showArrows: true,
      showDots: true
    },
    propControls: {
      slides: { label: 'Slides', group: 'Items' },
      overlay: {
        label: 'Text style',
        type: 'select',
        options: [opt('gradient', 'Over image (bottom gradient)'), opt('center', 'Over image (centered)'), opt('below', 'Below image'), opt('none', 'Image only')],
        group: 'Settings'
      },
      aspectRatio: {
        label: 'Aspect ratio',
        type: 'select',
        options: [opt('21:9', 'Cinema 21:9'), opt('16:9', 'Wide 16:9'), opt('3:2', 'Classic 3:2'), opt('4:3', 'Standard 4:3'), opt('1:1', 'Square 1:1')],
        group: 'Settings'
      },
      autoplay: { label: 'Autoplay', help: 'Disabled automatically for visitors who prefer reduced motion.', group: 'Settings' },
      interval: { label: 'Slide duration', type: 'number', min: 2000, max: 30000, step: 500, unit: 'ms', group: 'Settings' },
      loop: { label: 'Loop', help: 'Wrap from the last slide back to the first.', group: 'Settings' },
      showArrows: { label: 'Arrows', group: 'Settings' },
      showDots: { label: 'Dots', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'WAI-ARIA carousel: <section aria-roledescription="carousel" aria-label="Highlights">; each slide has aria-roledescription="slide" and aria-label "n of N"; inactive slides are aria-hidden and inert. Slides move with a CSS transform (520ms ease, instant with reduced motion); touch swipes of 48px or more change slides.',
      'Dots are a tablist (role="tab", aria-selected, roving tabindex; ArrowLeft/ArrowRight/Home/End move and activate) controlling tabpanel slides; Previous/Next buttons (44px) also respond to ArrowLeft/ArrowRight and are disabled at the ends when `loop` is false.',
      'Autoplay advances every `interval` ms (2000–30000), pauses while the pointer hovers or keyboard focus is inside, offers a Stop/Start rotation button as the first control, sets the slide region to aria-live="off" while rotating ("polite" otherwise), stops at the last slide when not looping, and never runs when prefers-reduced-motion is set.',
      '`overlay`: gradient = copy bottom-left over a black gradient scrim; center = centered copy over a 55% black tint (both white text, AA on any image; slides grow to fit the copy, minimum 22rem tall on phones); below = copy under the image; none = image only. CTAs are white pill buttons over images and primary text links below.',
      'Images keep `aspectRatio` with object-fit: cover; empty, unsafe or failing images render a placeholder frame.'
    ]
  },

  'media/map': {
    type: 'media/map',
    displayName: 'Map',
    category: 'media',
    description: 'An embedded street map with a location marker, address bar and directions link.',
    icon: 'MapTrifold',
    component: 'MapEmbed',
    keywords: ['map', 'location', 'address', 'google maps', 'openstreetmap', 'directions', 'contact'],
    propsSchema: z.object({
      title: z.string().default('Our office'),
      query: z.string().default(''),
      provider: z.enum(['openstreetmap', 'google']).default('openstreetmap'),
      lat: z.number().min(-85).max(85).optional(),
      lng: z.number().min(-180).max(180).optional(),
      zoom: z.number().int().min(1).max(19).default(15),
      height: z.number().int().min(200).max(900).default(400),
      showAddress: z.boolean().default(true)
    }),
    defaultProps: {
      title: 'Our office',
      query: 'Ferry Building, San Francisco, CA',
      provider: 'openstreetmap',
      lat: 37.7955,
      lng: -122.3937,
      zoom: 15,
      height: 400,
      showAddress: true
    },
    propControls: {
      title: { label: 'Title', help: 'Heading of the address bar and the accessible name of the map.', group: 'Content' },
      query: { label: 'Address', help: 'Shown in the address bar; Google Maps searches for it.', group: 'Content' },
      provider: { label: 'Provider', type: 'select', options: [opt('openstreetmap', 'OpenStreetMap'), opt('google', 'Google Maps')], group: 'Settings' },
      lat: { label: 'Latitude', type: 'number', min: -85, max: 85, step: 0.0001, help: 'Required for OpenStreetMap.', group: 'Settings' },
      lng: { label: 'Longitude', type: 'number', min: -180, max: 180, step: 0.0001, help: 'Required for OpenStreetMap.', group: 'Settings' },
      zoom: { label: 'Zoom', type: 'number', min: 1, max: 19, step: 1, group: 'Settings' },
      height: { label: 'Height', type: 'number', min: 200, max: 900, step: 10, unit: 'px', group: 'Settings' },
      showAddress: { label: 'Address bar', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'OpenStreetMap (default) embeds https://www.openstreetmap.org/export/embed.html with a bounding box computed from `lat`, `lng` and `zoom` plus a marker; without valid coordinates it renders a "Map location needed" placeholder (no geocoding).',
      'Google Maps embeds https://www.google.com/maps?q=<encodeURIComponent(query, else "lat,lng")>&z=<zoom>&output=embed. User text only reaches the iframe URL through encodeURIComponent; numbers are formatted with toFixed.',
      'The iframe (loading="lazy", referrerpolicy="strict-origin-when-cross-origin", titled "Map: <title>") sits under a transparent "Click to interact" button so the page scroll is never captured; the first click removes it and focuses the map.',
      'With `showAddress` a bar below the map shows a pin tile, the title, the address and a "Get directions" link (new tab, rel="noopener noreferrer") to Google Maps search or the OpenStreetMap location.',
      '`height` is the map height in px (200–900).'
    ]
  },

  'media/logo-cloud': {
    type: 'media/logo-cloud',
    displayName: 'Logo Cloud',
    category: 'media',
    description: 'A row or grid of customer and partner logos with optional grayscale treatment.',
    icon: 'Buildings',
    component: 'LogoCloud',
    keywords: ['logos', 'clients', 'customers', 'partners', 'brands', 'trusted by', 'social proof'],
    propsSchema: z.object({
      heading: z.string().default('Trusted by product teams at fast-growing companies'),
      logos: z
        .array(
          z.object({
            name: z.string().default(''),
            src: mediaUrl().default(''),
            href: z.string().default('')
          })
        )
        .default([]),
      variant: z.enum(['grid', 'marquee-static']).default('grid'),
      columns: z.number().int().min(3).max(6).default(6),
      grayscale: z.boolean().default(true)
    }),
    defaultProps: {
      heading: 'Trusted by product teams at fast-growing companies',
      logos: [
        { name: 'Northstar', src: '', href: '' },
        { name: 'Lumen', src: '', href: '' },
        { name: 'Arcadia', src: '', href: '' },
        { name: 'Helix', src: '', href: '' },
        { name: 'Summit', src: '', href: '' },
        { name: 'Cobalt', src: '', href: '' }
      ],
      variant: 'grid',
      columns: 6,
      grayscale: true
    },
    propControls: {
      heading: { label: 'Heading', help: 'Leave empty to hide.', group: 'Content' },
      logos: { label: 'Logos', group: 'Items' },
      variant: { label: 'Layout', type: 'select', options: [opt('grid', 'Grid'), opt('marquee-static', 'Single row')], group: 'Settings' },
      columns: { label: 'Columns', type: 'number', min: 3, max: 6, step: 1, help: 'Grid layout on desktop; tablets show up to 3, phones 2.', group: 'Settings' },
      grayscale: { label: 'Grayscale', help: 'Muted logos that regain color on hover.', group: 'Settings' }
    },
    slots: [],
    behaviour: [
      'Optional small muted heading above a <ul> of logos. grid = CSS grid with `columns` columns on desktop, min(columns, 3) on tablet and 2 on phones; marquee-static = one centered, non-animated row that scrolls horizontally with faded edges when it overflows.',
      'A logo with an image renders <img> (32px tall, width auto, alt = name); a logo without an image (or whose image fails) renders its `name` as a styled text wordmark (heading font, six alternating typographic treatments) — brand artwork is never invented.',
      '`grayscale` renders logos desaturated at 64% opacity (wordmarks in a muted color) and restores full color on hover/focus.',
      'Logos with `href` become links (44px minimum target, accessible name = logo name).'
    ]
  }
};
