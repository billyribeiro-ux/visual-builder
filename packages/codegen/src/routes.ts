import type { BlueprintNode, PageRoute, ProjectBlueprint, InteractionRule } from '@app-viz/schema';
import { cssPropertiesToString } from '@app-viz/engine';

/* ==========================================================================
   Output-safety helpers
   --------------------------------------------------------------------------
   Every user-controlled value that ends up in generated Svelte source MUST go
   through one of these helpers. Svelte evaluates `{...}` inside quoted
   attributes and text, and `\"` is NOT an escape inside a quoted attribute,
   so string props are always emitted as `{"<js string literal>"}` expressions.
   ========================================================================== */

/**
 * JSON.stringify hardened for embedding in Svelte markup expressions and
 * `<script>` blocks: `<` is escaped (so `</script>` / `<!--` can never appear)
 * and U+2028/U+2029 are escaped (legacy JS line terminators).
 */
export function safeJson(value: unknown): string {
  const json = JSON.stringify(value === undefined ? null : value) ?? 'null';
  return json
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** HTML-escapes text for raw HTML / Svelte text & quoted attribute contexts. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes text placed in Svelte template text / quoted attributes: HTML-escape
 * plus `{` / `}` entities so Svelte never treats user text as an expression.
 */
export function escapeSvelteText(value: unknown): string {
  return escapeHtml(value).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
}

const SAFE_URL_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/**
 * Allows only relative URLs (`/path`, `#hash`, `?query`, `./x`, `x/y`) and the
 * http(s):, mailto:, tel: schemes. Anything else (javascript:, data:,
 * vbscript:, protocol-relative `//host`, ...) becomes `fallback`.
 */
export function sanitizeHref(value: unknown, fallback = '#'): string {
  if (typeof value !== 'string') return fallback;
  // Browsers ignore ASCII control chars / whitespace when parsing schemes.
  // eslint-disable-next-line no-control-regex
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (!cleaned) return '';
  if (cleaned.startsWith('#') || cleaned.startsWith('?')) return cleaned;
  if (cleaned.startsWith('/')) {
    // Reject protocol-relative (`//evil.example`) and `/\` variants.
    return /^\/[/\\]/.test(cleaned) ? fallback : cleaned;
  }
  if (cleaned.startsWith('\\')) return fallback;
  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(cleaned);
  if (schemeMatch) {
    return SAFE_URL_SCHEMES.has(schemeMatch[1].toLowerCase()) ? cleaned : fallback;
  }
  // No scheme: only accept if there is no ':' before the first / ? # (pure relative path).
  const firstDelim = cleaned.search(/[/?#]/);
  const head = firstDelim === -1 ? cleaned : cleaned.slice(0, firstDelim);
  return head.includes(':') ? fallback : cleaned;
}

/** Image/media src: same policy as hrefs, but `mailto:`/`tel:` make no sense and invalid → ''. */
function sanitizeSrc(value: unknown): string {
  const href = sanitizeHref(value, '');
  return /^(mailto|tel):/i.test(href) ? '' : href;
}

/** Recursively sanitizes every `*href` / `*Href` / `src` / `*Url` string inside array/object props. */
function sanitizeUrlsDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => sanitizeUrlsDeep(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === 'string' && /href$/i.test(key)) out[key] = sanitizeHref(v);
      else if (typeof v === 'string' && (key === 'src' || /url$/i.test(key))) out[key] = sanitizeSrc(v);
      else out[key] = sanitizeUrlsDeep(v);
    }
    return out;
  }
  return value;
}

function normalizeCssForCheck(value: string): string {
  return value.toLowerCase().replace(/[\s'"\\]/g, '');
}

/** Returns true when a CSS value could break out of its context or execute script. */
function isDangerousCssValue(value: string): boolean {
  if (/[<{}]/.test(value)) return true;
  const n = normalizeCssForCheck(value);
  return (
    n.includes('url(javascript:') ||
    n.includes('url(vbscript:') ||
    n.includes('expression(') ||
    n.includes('javascript:')
  );
}

/** Sanitizes a single free-form CSS value (e.g. a gap length). Dangerous values → ''. */
export function sanitizeCssValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v || isDangerousCssValue(v) || v.includes(';')) return '';
  return v;
}

/** cssPropertiesToString with unsafe keys/values dropped. */
export function safeStyleString(css: Record<string, unknown> | undefined | null): string {
  if (!css) return '';
  const filtered: Record<string, string | number> = {};
  for (const [key, raw] of Object.entries(css)) {
    if (!/^-{0,2}[a-zA-Z][a-zA-Z0-9-]*$/.test(key)) continue;
    if (typeof raw === 'number') {
      if (Number.isFinite(raw)) filtered[key] = raw;
      continue;
    }
    if (typeof raw !== 'string') continue;
    if (!raw.trim() || isDangerousCssValue(raw)) continue;
    filtered[key] = raw;
  }
  return cssPropertiesToString(filtered);
}

/** Restricts generated class lists to `[A-Za-z0-9_\- ]`. */
export function sanitizeClassList(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[^A-Za-z0-9_\- ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeNodeId(id: unknown): string {
  return String(id ?? '').replace(/[^A-Za-z0-9_-]/g, '');
}

function toText(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

/* ---- attribute emitters (all return `name={expr}`) ---- */

/** String prop → `name={"..."}`. Empty strings are respected (not replaced by fallback) only when `keepEmpty`. */
function strAttr(name: string, value: unknown, fallback = '', keepEmpty = false): string {
  const text = toText(value, fallback);
  return `${name}={${safeJson(text === '' && !keepEmpty ? fallback : text)}}`;
}

function hrefAttr(name: string, value: unknown, fallback = '#'): string {
  const raw = toText(value, '');
  const safe = raw === '' ? fallback : sanitizeHref(raw, '#');
  return `${name}={${safeJson(safe)}}`;
}

function enumAttr(name: string, value: unknown, allowed: readonly string[], fallback: string): string {
  const v = typeof value === 'string' && allowed.includes(value) ? value : fallback;
  return `${name}={${safeJson(v)}}`;
}

function cssAttr(name: string, value: unknown, fallback = ''): string {
  return `${name}={${safeJson(sanitizeCssValue(value) || fallback)}}`;
}

function numAttr(name: string, value: unknown, min: number, max: number, fallback: number): string {
  const n = Number(value);
  const v = Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
  return `${name}={${v}}`;
}

function boolAttr(name: string, value: boolean): string {
  return `${name}={${value ? 'true' : 'false'}}`;
}

function jsonAttr(name: string, value: unknown, fallback: unknown = []): string {
  const v = value === undefined || value === null ? fallback : value;
  return `${name}={${safeJson(sanitizeUrlsDeep(v))}}`;
}

function styleAttr(css: string): string {
  return css ? `style={${safeJson(css)}}` : '';
}

/** Emits a self-closing (or children-wrapping) component tag with one attribute per line. */
function tag(name: string, indent: string, attrs: string[], children?: string): string {
  const list = attrs.filter(Boolean);
  const open =
    list.length <= 2
      ? `${indent}<${name}${list.map((a) => ` ${a}`).join('')}`
      : `${indent}<${name}\n${list.map((a) => `${indent}  ${a}`).join('\n')}\n${indent}`;
  if (children === undefined) return `${open}${list.length <= 2 ? ' ' : ''}/>`;
  return `${open}>\n${children}\n${indent}</${name}>`;
}

const MAX_WIDTHS = ['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const;
const DIRECTIONS = ['column', 'row', 'column-reverse', 'row-reverse'] as const;
const JUSTIFY = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] as const;
const ALIGN = ['stretch', 'flex-start', 'center', 'flex-end'] as const;
const TEXT_ALIGN = ['left', 'center', 'right'] as const;
const GRID_ALIGN = ['stretch', 'start', 'center', 'end', 'flex-start', 'flex-end'] as const;
const SURFACE_TONES = ['surface', 'low', 'container', 'high', 'primary-container', 'surface-low', 'surface-high'] as const;
const PADDING_Y = ['sm', 'md', 'lg', 'xl'] as const;

/** Base-style keys forwarded to a Section's inner container (mirrors PreviewRenderer.svelte). */
const SECTION_INNER_LAYOUT_KEYS = [
  'display',
  'flexDirection',
  'justifyContent',
  'alignItems',
  'flexWrap',
  'gap',
  'gridTemplateColumns',
  'textAlign'
] as const;

/** Optional flex-layout props shared by Container / Section (only emitted when set). */
function layoutAttrs(p: Record<string, unknown>): string[] {
  return [
    p.direction ? enumAttr('direction', p.direction, DIRECTIONS, 'column') : '',
    p.justify ? enumAttr('justify', p.justify, JUSTIFY, 'flex-start') : '',
    p.align ? enumAttr('align', p.align, ALIGN, 'stretch') : '',
    p.textAlign ? enumAttr('textAlign', p.textAlign, TEXT_ALIGN, 'left') : '',
    p.gap && sanitizeCssValue(p.gap) ? cssAttr('gap', p.gap) : ''
  ];
}

function hasScopedStyles(node: BlueprintNode): boolean {
  const s = node.styles;
  const m = node.motionEffects;
  const hasStyleBuckets = Boolean(
    s &&
      ((s.mobile && Object.keys(s.mobile).length > 0) ||
        (s.tablet && Object.keys(s.tablet).length > 0) ||
        (s.desktop && Object.keys(s.desktop).length > 0) ||
        (s.wide && Object.keys(s.wide).length > 0) ||
        (s.hover && Object.keys(s.hover).length > 0) ||
        (s.focus && Object.keys(s.focus).length > 0) ||
        (s.active && Object.keys(s.active).length > 0))
  );
  const hasMotion = Boolean(
    m &&
      ((m.entranceAnimation && m.entranceAnimation !== 'none') ||
        (m.hoverTransform && m.hoverTransform !== 'none') ||
        (m.sticky && m.sticky !== 'none') ||
        m.hideOnDesktop ||
        m.hideOnTablet ||
        m.hideOnMobile)
  );
  const hasCustom = Boolean(
    (node.customClasses && node.customClasses.trim()) ||
      (node.customCss && node.customCss.trim())
  );
  return hasStyleBuckets || hasMotion || hasCustom;
}

function collectNodeInteractions(
  root: BlueprintNode | undefined,
  out: Array<{ nodeId: string; rule: InteractionRule }> = []
): Array<{ nodeId: string; rule: InteractionRule }> {
  if (!root || root.hidden) return out;
  for (const r of root.interactions || []) {
    if (r.trigger === 'onClick' || r.trigger === 'click') {
      out.push({ nodeId: root.id, rule: r });
    }
  }
  for (const child of root.children || []) {
    collectNodeInteractions(child, out);
  }
  return out;
}

function renderNodeToSvelte(
  node: BlueprintNode,
  indent = '  ',
  slotNode?: BlueprintNode
): string {
  if (node.hidden) return '';
  if (node.componentType === 'structure/slot') {
    return slotNode ? renderNodeToSvelte(slotNode, indent) : '';
  }

  const scoped = hasScopedStyles(node);
  const hasClickRule = (node.interactions || []).some(
    (r: InteractionRule) => r.trigger === 'onClick' || r.trigger === 'click'
  );
  const needsWrapper = scoped || hasClickRule;
  const innerIndent = needsWrapper ? indent + '  ' : indent;
  const rendered = renderNodeInner(node, innerIndent, slotNode);
  if (needsWrapper) {
    const cls = sanitizeClassList(node.customClasses);
    const clsAttr = cls ? ` class="${cls}"` : '';
    return `${indent}<div data-node-id="${sanitizeNodeId(node.id)}"${clsAttr}>\n${rendered}\n${indent}</div>`;
  }
  return rendered;
}

function renderChildren(node: BlueprintNode, indent: string, slotNode?: BlueprintNode): string {
  return (node.children || [])
    .map((c: BlueprintNode) => renderNodeToSvelte(c, indent + '  ', slotNode))
    .filter(Boolean)
    .join('\n');
}

function renderNodeInner(
  node: BlueprintNode,
  indent = '  ',
  slotNode?: BlueprintNode
): string {
  const baseCss = (node.styles?.base || {}) as Record<string, unknown>;
  const inlineStyle = safeStyleString(baseCss);
  const style = styleAttr(inlineStyle);
  const p = (node.props || {}) as Record<string, unknown>;

  switch (node.componentType) {
    case 'structure/slot': {
      if (slotNode) {
        return renderNodeToSvelte(slotNode, indent);
      }
      return '';
    }

    case 'structure/container': {
      return tag(
        'Container',
        indent,
        [enumAttr('maxWidth', p.maxWidth, MAX_WIDTHS, 'xl'), ...layoutAttrs(p), style],
        renderChildren(node, indent, slotNode)
      );
    }

    case 'structure/section': {
      const innerLayout: Record<string, unknown> = {};
      for (const key of SECTION_INNER_LAYOUT_KEYS) innerLayout[key] = baseCss[key];
      const contentStyle = safeStyleString(innerLayout);
      return tag(
        'Section',
        indent,
        [
          enumAttr('surfaceTone', p.surfaceTone ?? p.variant, SURFACE_TONES, 'surface'),
          enumAttr('paddingY', p.paddingY, PADDING_Y, 'lg'),
          enumAttr('maxWidth', p.maxWidth, MAX_WIDTHS, 'xl'),
          ...layoutAttrs(p),
          style,
          contentStyle ? `contentStyle={${safeJson(contentStyle)}}` : ''
        ],
        renderChildren(node, indent, slotNode)
      );
    }

    case 'structure/grid': {
      return tag(
        'Grid',
        indent,
        [
          numAttr('columns', p.columns, 1, 4, 3),
          cssAttr('gap', p.gap, 'md'),
          p.alignItems ? enumAttr('alignItems', p.alignItems, GRID_ALIGN, 'stretch') : '',
          p.justifyItems ? enumAttr('justifyItems', p.justifyItems, GRID_ALIGN, 'stretch') : '',
          p.textAlign ? enumAttr('textAlign', p.textAlign, TEXT_ALIGN, 'left') : '',
          style
        ],
        renderChildren(node, indent, slotNode)
      );
    }

    case 'structure/divider': {
      return tag('Divider', indent, [
        enumAttr('spacing', p.spacing, ['sm', 'md', 'lg'], 'md'),
        strAttr('label', p.label, ''),
        style
      ]);
    }

    case 'hero/split-hero': {
      return tag('SplitHero', indent, [
        strAttr('eyebrow', p.eyebrow),
        strAttr('title', p.title),
        strAttr('subtitle', p.subtitle),
        strAttr('primaryCtaText', p.primaryCtaText, 'Get Started'),
        hrefAttr('primaryCtaHref', p.primaryCtaHref),
        strAttr('secondaryCtaText', p.secondaryCtaText),
        hrefAttr('secondaryCtaHref', p.secondaryCtaHref),
        strAttr('badgeText', p.badgeText),
        enumAttr('align', p.align, ['left', 'center'], 'left'),
        style
      ]);
    }

    case 'marketing/feature-grid': {
      return tag('FeatureGrid', indent, [
        strAttr('sectionEyebrow', p.sectionEyebrow),
        strAttr('sectionTitle', p.sectionTitle),
        strAttr('sectionDescription', p.sectionDescription),
        numAttr('columns', p.columns, 1, 4, 3),
        jsonAttr('features', p.features),
        style
      ]);
    }

    case 'marketing/testimonials': {
      return tag('Testimonials', indent, [
        strAttr('sectionEyebrow', p.sectionEyebrow),
        strAttr('sectionTitle', p.sectionTitle),
        jsonAttr('testimonials', p.testimonials),
        style
      ]);
    }

    case 'marketing/faq-accordion': {
      return tag('FaqAccordion', indent, [
        strAttr('sectionTitle', p.sectionTitle),
        jsonAttr('items', p.items),
        style
      ]);
    }

    case 'marketing/pricing-table': {
      return tag('PricingTable', indent, [
        strAttr('sectionEyebrow', p.sectionEyebrow),
        strAttr('sectionTitle', p.sectionTitle),
        strAttr('sectionDescription', p.sectionDescription),
        jsonAttr('plans', p.plans),
        style
      ]);
    }

    case 'marketing/cta-banner': {
      return tag('CtaBanner', indent, [
        strAttr('eyebrow', p.eyebrow),
        strAttr('title', p.title),
        strAttr('subtitle', p.subtitle),
        strAttr('primaryCtaText', p.primaryCtaText, 'Get Started'),
        hrefAttr('primaryCtaHref', p.primaryCtaHref, '/dashboard'),
        strAttr('secondaryCtaText', p.secondaryCtaText),
        hrefAttr('secondaryCtaHref', p.secondaryCtaHref),
        style
      ]);
    }

    case 'marketing/stats-bar': {
      return tag('StatsBar', indent, [jsonAttr('stats', p.stats), style]);
    }

    case 'marketing/newsletter': {
      return tag('Newsletter', indent, [
        strAttr('title', p.title),
        strAttr('subtitle', p.subtitle),
        strAttr('placeholder', p.placeholder, 'you@company.com'),
        strAttr('buttonText', p.buttonText, 'Subscribe'),
        style
      ]);
    }

    case 'marketing/contact-form': {
      return tag('ContactForm', indent, [
        strAttr('sectionEyebrow', p.sectionEyebrow),
        strAttr('sectionTitle', p.sectionTitle ?? p.title),
        strAttr('sectionSubtitle', p.sectionSubtitle ?? p.subtitle),
        strAttr('submitText', p.submitText, 'Send Message'),
        style
      ]);
    }

    case 'marketing/footer': {
      return tag('Footer', indent, [
        strAttr('brandName', p.brandName),
        strAttr('tagline', p.tagline),
        strAttr('copyright', p.copyright),
        jsonAttr('columns', p.columns),
        style
      ]);
    }

    case 'navigation/navbar': {
      return tag('Navbar', indent, [
        strAttr('brandName', p.brandName),
        `logoUrl={${safeJson(sanitizeSrc(p.logoUrl))}}`,
        jsonAttr('links', p.links),
        strAttr('ctaText', p.ctaText, 'Get Started'),
        hrefAttr('ctaHref', p.ctaHref, '/dashboard'),
        style
      ]);
    }

    case 'app/dashboard-shell': {
      return tag(
        'DashboardShell',
        indent,
        [
          strAttr('title', p.title, 'Dashboard'),
          strAttr('activeNav', p.activeNav, 'dashboard'),
          style
        ],
        renderChildren(node, indent, slotNode)
      );
    }

    case 'app/kpi-grid': {
      return tag('KpiGrid', indent, [jsonAttr('cards', p.cards), style]);
    }

    case 'app/data-table': {
      return tag('DataTable', indent, [
        strAttr('title', p.title),
        jsonAttr('columns', p.columns),
        jsonAttr('rows', p.rows),
        style
      ]);
    }

    case 'app/settings-form': {
      return tag('SettingsForm', indent, [
        strAttr('initialName', p.initialName),
        strAttr('initialEmail', p.initialEmail),
        boolAttr('notificationsEnabled', p.notificationsEnabled !== false),
        style
      ]);
    }

    case 'app/auth-card': {
      return tag('AuthCard', indent, [
        enumAttr('mode', p.mode, ['signin', 'signup'], 'signin'),
        strAttr('brandName', p.brandName, 'Acme Cloud'),
        strAttr('title', p.title, 'Welcome back'),
        strAttr('subtitle', p.subtitle),
        hrefAttr('redirectHref', p.redirectHref, '/dashboard'),
        style
      ]);
    }

    case 'ui/button': {
      const attrs = [
        enumAttr(
          'variant',
          p.variant,
          ['primary', 'secondary', 'outline', 'ghost', 'filled', 'outlined', 'text', 'tonal', 'elevated'],
          'primary'
        ),
        enumAttr('size', p.size, ['sm', 'md', 'lg'], 'md'),
        `href={${safeJson(sanitizeHref(p.href, '#'))}}`,
        style
      ].filter(Boolean);
      return `${indent}<Button ${attrs.join(' ')}>{${safeJson(toText(p.text, 'Button') || 'Button')}}</Button>`;
    }

    case 'ui/badge': {
      return tag('Badge', indent, [
        strAttr('text', p.text, 'Badge'),
        enumAttr('tone', p.tone, ['primary', 'secondary', 'tertiary', 'error', 'success', 'outline'], 'primary'),
        style
      ]);
    }

    case 'ui/card': {
      return tag('Card', indent, [
        enumAttr('variant', p.variant, ['elevated', 'filled', 'outlined'], 'elevated'),
        strAttr('eyebrow', p.eyebrow),
        strAttr('title', p.title),
        strAttr('body', p.body),
        strAttr('ctaText', p.ctaText ?? p.actionText),
        hrefAttr('ctaHref', p.ctaHref ?? p.actionHref),
        enumAttr('align', p.align, TEXT_ALIGN, 'left'),
        style
      ]);
    }

    case 'ui/alert': {
      return tag('Alert', indent, [
        enumAttr('tone', p.tone, ['info', 'success', 'warning', 'error'], 'info'),
        strAttr('title', p.title),
        strAttr('message', p.message),
        boolAttr('dismissible', p.dismissible === true),
        style
      ]);
    }

    case 'ui/tabs': {
      return tag('Tabs', indent, [jsonAttr('tabs', p.tabs), style]);
    }

    default: {
      const inner = renderChildren(node, indent, slotNode);
      return `${indent}<div${style ? ` ${style}` : ''}>\n${inner}\n${indent}</div>`;
    }
  }
}

/** Sanitizes an interaction payload for embedding in the generated runtime. */
function sanitizeInteractionPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (key === 'path' || /href$/i.test(key) || /url$/i.test(key)) {
      out[key] = sanitizeHref(value, '#');
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = typeof value === 'string' ? value : String(value);
    }
  }
  return out;
}

export function generatePageRoute(page: PageRoute, blueprint?: ProjectBlueprint): string {
  const layout =
    page.layoutId && blueprint
      ? blueprint.layouts.find((l) => l.id === page.layoutId)
      : undefined;

  const content = layout
    ? renderNodeToSvelte(layout.rootNode, '  ', page.rootNode)
    : renderNodeToSvelte(page.rootNode, '  ');

  const pageInteractions = collectNodeInteractions(page.rootNode);
  if (layout) collectNodeInteractions(layout.rootNode, pageInteractions);

  const hasInteractiveRules = pageInteractions.length > 0;
  const ACTION_TYPES = new Set([
    'navigate',
    'openModal',
    'open_modal',
    'toggleDrawer',
    'showToast',
    'show_toast',
    'setState',
    'toggle_state'
  ]);
  // safeJson: this is serialized inside <script>, so `</script>` must never appear raw.
  const serializedRules = safeJson(
    pageInteractions.map(({ nodeId, rule }) => {
      const actionType = String(rule.actionType || rule.action?.type || 'navigate');
      return {
        nodeId: sanitizeNodeId(nodeId),
        actionType: ACTION_TYPES.has(actionType) ? actionType : 'navigate',
        payload: sanitizeInteractionPayload(rule.payload || rule.action?.payload || {})
      };
    })
  );

  const headTitle = escapeSvelteText(page.title || '');
  const headDescription = escapeSvelteText(page.description || '');

  const interactionScriptBlock = hasInteractiveRules
    ? `
  const interactionRules = ${serializedRules};
  let activeModal = $state<{ title: string; body: string; ctaText: string } | null>(null);
  let activeDrawer = $state<{ title: string; body: string } | null>(null);
  let activeToast = $state<string | null>(null);
  let customAppState = $state<Record<string, string>>({});

  function handleMainClick(e: MouseEvent) {
    const target = (e.target as HTMLElement | null)?.closest('[data-node-id]');
    if (!target) return;
    const nodeId = target.getAttribute('data-node-id');
    const matched = interactionRules.find((r) => r.nodeId === nodeId);
    if (!matched) return;
    const p = matched.payload as Record<string, string>;
    if (matched.actionType === 'navigate' && p.path) {
      window.location.href = p.path;
    } else if (matched.actionType === 'openModal' || matched.actionType === 'open_modal') {
      e.preventDefault();
      activeModal = {
        title: p.modalTitle || 'Interactive Modal Dialog',
        body: p.modalBody || 'This modal was triggered by a declarative interaction rule.',
        ctaText: p.modalCta || 'Confirm'
      };
    } else if (matched.actionType === 'toggleDrawer') {
      e.preventDefault();
      activeDrawer = activeDrawer
        ? null
        : {
            title: p.drawerTitle || 'Workspace Details Drawer',
            body: p.drawerBody || 'Inspect contextual state and quick actions in this slide-over sheet.'
          };
    } else if (matched.actionType === 'showToast' || matched.actionType === 'show_toast') {
      e.preventDefault();
      activeToast = p.toastMessage || 'Action completed successfully';
      setTimeout(() => (activeToast = null), 3500);
    } else if (matched.actionType === 'setState' || matched.actionType === 'toggle_state') {
      e.preventDefault();
      const k = p.stateKey || 'status';
      customAppState[k] = p.stateValue || 'active';
      activeToast = \`State "\${k}" set to "\${customAppState[k]}"\`;
      setTimeout(() => (activeToast = null), 2800);
    }
  }`
    : '';

  const interactionMarkupBlock = hasInteractiveRules
    ? `
{#if activeModal}
  <div style="position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; padding: 1.5rem;">
    <div class="md-card md-card-elevated" role="dialog" aria-modal="true" aria-label={activeModal.title} style="max-width: 28rem; width: 100%; padding: 1.75rem;">
      <h3 class="md-headline-small" style="margin: 0 0 0.75rem 0;">{activeModal.title}</h3>
      <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.5rem 0;">{activeModal.body}</p>
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button type="button" class="md-btn md-btn-outlined" onclick={() => (activeModal = null)}>Dismiss</button>
        <button type="button" class="md-btn md-btn-filled" onclick={() => (activeModal = null)}>{activeModal.ctaText}</button>
      </div>
    </div>
  </div>
{/if}

{#if activeDrawer}
  <div style="position: fixed; inset: 0; z-index: 85; background: rgba(0,0,0,0.4); display: flex; justify-content: flex-end;">
    <aside class="md-card" aria-label={activeDrawer.title} style="width: min(24rem, 90vw); height: 100%; border-radius: 16px 0 0 16px; padding: 1.75rem; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <h3 class="md-title-large" style="margin: 0;">{activeDrawer.title}</h3>
          <button type="button" class="md-btn md-btn-text" onclick={() => (activeDrawer = null)}>✕</button>
        </div>
        <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant);">{activeDrawer.body}</p>
      </div>
      <button type="button" class="md-btn md-btn-tonal" onclick={() => (activeDrawer = null)}>Close Drawer</button>
    </aside>
  </div>
{/if}

{#if activeToast}
  <div role="status" aria-live="polite" style="position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 95; background: var(--md-sys-color-inverse-surface); color: var(--md-sys-color-inverse-on-surface); padding: 0.875rem 1.25rem; border-radius: 12px; box-shadow: var(--md-sys-elevation-level3); display: flex; align-items: center; gap: 0.75rem;">
    <span>{activeToast}</span>
    <button type="button" style="background: transparent; border: none; color: inherit; cursor: pointer; font-weight: 700;" onclick={() => (activeToast = null)}>✕</button>
  </div>
{/if}`
    : '';

  const windowListenerTag = hasInteractiveRules
    ? `\n<svelte:window onclick={handleMainClick} />\n`
    : '';

  return `<script lang="ts">
  import Container from '#lib/components/Container.svelte';
  import Section from '#lib/components/Section.svelte';
  import Grid from '#lib/components/Grid.svelte';
  import Divider from '#lib/components/Divider.svelte';
  import Navbar from '#lib/components/Navbar.svelte';
  import Button from '#lib/components/Button.svelte';
  import Badge from '#lib/components/Badge.svelte';
  import Card from '#lib/components/Card.svelte';
  import Alert from '#lib/components/Alert.svelte';
  import Tabs from '#lib/components/Tabs.svelte';
  import SplitHero from '#lib/components/SplitHero.svelte';
  import FeatureGrid from '#lib/components/FeatureGrid.svelte';
  import PricingTable from '#lib/components/PricingTable.svelte';
  import FaqAccordion from '#lib/components/FaqAccordion.svelte';
  import Testimonials from '#lib/components/Testimonials.svelte';
  import CtaBanner from '#lib/components/CtaBanner.svelte';
  import StatsBar from '#lib/components/StatsBar.svelte';
  import Newsletter from '#lib/components/Newsletter.svelte';
  import ContactForm from '#lib/components/ContactForm.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import DashboardShell from '#lib/components/DashboardShell.svelte';
  import KpiGrid from '#lib/components/KpiGrid.svelte';
  import DataTable from '#lib/components/DataTable.svelte';
  import SettingsForm from '#lib/components/SettingsForm.svelte';
  import AuthCard from '#lib/components/AuthCard.svelte';${interactionScriptBlock}
</script>

<svelte:head>
  <title>${headTitle}</title>
  <meta name="description" content="${headDescription}" />
</svelte:head>${windowListenerTag}
<main style="min-height: 100vh;">
${content}
</main>${interactionMarkupBlock}
`;
}

export function generateRootLayout(_blueprint: ProjectBlueprint): string {
  return `<script lang="ts">
  import '../app.css';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div style="min-height: 100vh; display: flex; flex-direction: column; background-color: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface);">
  {@render children?.()}
</div>
`;
}

export function generateErrorRoute(): string {
  return `<script lang="ts">
  import { page } from '$app/state';
</script>

<div class="md-section" style="min-height: 80vh; display: flex; align-items: center; justify-content: center;">
  <div class="md-container md-card md-card-outlined" style="max-width: 32rem; text-align: center; padding: 3rem 2rem;">
    <span class="md-badge" style="margin-bottom: 1rem;">Error {page.status}</span>
    <h1 class="md-headline-large" style="margin: 0 0 0.75rem 0;">{page.error?.message || 'Page Not Found'}</h1>
    <p class="md-body-medium" style="color: var(--md-sys-color-on-surface-variant); margin: 0 0 1.75rem 0;">
      The requested route does not exist or encountered an unexpected condition.
    </p>
    <a href="/" class="md-btn md-btn-filled">Return to Home</a>
  </div>
</div>
`;
}
