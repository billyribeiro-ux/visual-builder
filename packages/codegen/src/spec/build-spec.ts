/**
 * Claude Code Build Spec generator.
 *
 * Turns a blueprint into a deterministic, stack-agnostic implementation package that a coding
 * agent (Claude Code, or any other) can build faithfully in the user's chosen stack:
 *
 *   CLAUDE.md                     entry point Claude Code reads automatically
 *   spec/overview.md              routes, layouts, navigation graph, file mapping
 *   spec/pages/<slug>.md          exhaustive per-page section tree (content, layout, behaviour)
 *   spec/components.md            prop contracts for every component actually used
 *   spec/interactions.md          declarative click/submit behaviour
 *   spec/responsive.md            breakpoint + visibility contract
 *   spec/acceptance.md            verifiable checklist derived from real content
 *   spec/design-tokens.json       tokens ($type/$value JSON)
 *   spec/tokens.css               the same tokens as CSS custom properties
 *   spec/blueprint.json           machine-readable source of truth
 *   spec/components.schema.json   JSON Schema of every used component's props
 *
 * Pure function: same input → byte-identical output (no clocks, no randomness).
 */
import { z } from 'zod';
import type { BlueprintNode, ProjectBlueprint, PageRoute, InteractionRule, ResponsiveStyle } from '@app-viz/schema';
import { getManifest } from '@app-viz/components';
import { BREAKPOINT_MEDIA, VISIBILITY_MEDIA } from '@app-viz/engine';
import {
  STACK_PRESETS,
  STYLING_GUIDANCE,
  SPEC_DATE,
  NODE_LTS,
  type StackId,
  type StylingId,
  type StackPreset
} from './stacks.js';

export interface BuildSpecOptions {
  stack: StackId;
  styling?: StylingId;
  /** Required when stack === 'custom', e.g. "Remix-free Hono SSR + htmx + UnoCSS". */
  customStackDescription?: string;
  /** Free-form extra requirements, e.g. "Use shadcn/ui, Drizzle + Postgres, Better Auth". */
  extraInstructions?: string;
  /** Export the whole project or a single page (plus its layout). */
  scope?: { type: 'project' } | { type: 'page'; pageId: string };
}

export interface BuildSpecResult {
  files: Record<string, string>;
  /** Single self-contained Markdown prompt (CLAUDE.md + all spec docs) for pasting. */
  prompt: string;
  stats: { pages: number; sections: number; components: number; interactions: number; hiddenOmitted: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STRUCTURE_TYPES = new Set(['structure/container', 'structure/section', 'structure/grid', 'structure/slot']);

const ATOMIC_CLASS_MEANINGS: Record<string, string> = {
  'el-glass': 'frosted glass surface: semi-transparent white background, 16px backdrop blur, 1px primary-tinted border',
  'el-gradient-border': '2px solid primary-colored border with 16px radius',
  'el-shadow-float': 'large soft floating shadow (0 16px 36px rgba(0,0,0,.12))',
  'el-surface-tint': 'primary-container background with on-primary-container text',
  'el-border-glow': '1px primary ring plus soft primary glow shadow'
};

const HOVER_TRANSFORMS: Record<string, string> = {
  lift: 'on hover translate up 5px and deepen shadow',
  scale: 'on hover scale to 1.02',
  glow: 'on hover show a 2px primary ring with a soft primary glow',
  tilt: 'on hover subtle 3D tilt (rotateX 2deg) and lift 3px'
};

const DURATIONS: Record<string, string> = { fast: '220ms', normal: '460ms', slow: '760ms' };

/** Hand-written behavioural contracts for components whose behaviour is not visible in props. */
const BEHAVIOUR_NOTES: Record<string, string[]> = {
  'navigation/navbar': [
    'Sticky top bar. Brand on the left, links in the middle/right, primary CTA button on the right.',
    'Below 768px collapse links into a menu button that toggles an accessible disclosure (aria-expanded, Escape closes, focus returns to the button).'
  ],
  'marketing/faq-accordion': [
    'Single-open accordion; the first item is open initially.',
    'Each trigger is a <button> with aria-expanded and aria-controls; panels are regions labelled by their trigger.'
  ],
  'ui/tabs': ['WAI-ARIA tabs pattern: role=tablist/tab/tabpanel, arrow-key navigation with roving tabindex, first tab active.'],
  'app/data-table': [
    'Renders a search input above the table that filters rows client-side (case-insensitive match on any cell).',
    'Show an empty state row when no rows match. Table has a <caption> or aria-label with the title.'
  ],
  'app/settings-form': ['Controlled form initialised from props; on submit validate (required name, valid email) and show an inline success message for ~4s.'],
  'marketing/contact-form': ['Fields: name, work email, company, message. Validate required fields and email format; on submit show an inline success state. Wire to a real endpoint if the stack has one (otherwise leave a clearly marked integration point).'],
  'marketing/newsletter': ['Email input + submit button. Validate email; show a success confirmation in place of the form.'],
  'app/auth-card': ['Card with a Sign in / Sign up toggle (initial state from `mode`). Email + password (+ name on sign up). On submit navigate to `redirectHref`. Auth provider integration is out of scope unless the user instructions say otherwise.'],
  'ui/alert': ['Role "status" (info/success) or "alert" (warning/error). When `dismissible` is true, render a close button that removes the alert.'],
  'marketing/pricing-table': ['Plans render as equal-height cards in a responsive grid; the plan with `isPopular: true` is visually emphasised (primary border + "Most popular" badge) and its CTA uses the filled style.'],
  'app/dashboard-shell': ['Application shell: left sidebar navigation (collapses to a top bar below 1024px), top header with the page title, and a main content region that renders the child sections listed under it.'],
  'hero/split-hero': ['Two columns on desktop (copy left, visual right); stacks on tablet/mobile. When `align` is "center" use a single centered column. The primary CTA is the filled button, the secondary is outlined.'],
  'marketing/stats-bar': ['Responsive row of metric tiles (value large, label below, optional detail muted).'],
  'app/kpi-grid': ['Responsive grid of metric cards; `trend: "up"` uses success color for the change value, "down" uses error color.'],
  'marketing/footer': ['Brand + tagline column followed by link columns; copyright row at the bottom.'],
  'marketing/feature-grid': ['Each feature `icon` is either a Lucide icon name (e.g. "Layers", "ShieldCheck") or an emoji — render the matching icon (any equivalent icon set is fine) inside a tonal rounded tile above the title.']
};

function pascal(componentType: string): string {
  const last = componentType.split('/').pop() || componentType;
  return last
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join('');
}

function kebab(key: string): string {
  return key.replace(/([A-Z])/g, '-$1').toLowerCase();
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Wrap content in a fence that cannot be closed by backticks inside the content. */
function fence(lang: string, body: string): string {
  const ticks = body.includes('```') ? '~~~~' : '```';
  return `${ticks}${lang}\n${body}\n${ticks}`;
}

function mdEscape(text: string): string {
  return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function cssBlock(props: Record<string, string | number> | undefined): string[] {
  return Object.entries(props ?? {})
    .filter(([, v]) => v !== '' && v !== undefined && v !== null)
    .map(([k, v]) => `  ${kebab(k)}: ${v};`);
}

function describeStyles(styles: ResponsiveStyle | undefined): string | null {
  if (!styles) return null;
  const sections: Array<[string, Record<string, string | number> | undefined]> = [
    ['base — all widths', styles.base],
    [`tablet — ${BREAKPOINT_MEDIA.tablet}`, styles.tablet],
    [`mobile — ${BREAKPOINT_MEDIA.mobile}`, styles.mobile],
    [`desktop — ${BREAKPOINT_MEDIA.desktop}`, styles.desktop],
    [`wide — ${BREAKPOINT_MEDIA.wide}`, styles.wide],
    [':hover', styles.hover],
    [':focus-visible', styles.focus],
    [':active', styles.active],
    [':disabled', styles.disabled]
  ];
  const out: string[] = [];
  for (const [label, props] of sections) {
    const lines = cssBlock(props);
    if (lines.length) out.push(`/* ${label} */\n${lines.join('\n')}`);
  }
  return out.length ? out.join('\n\n') : null;
}

function describeInteraction(rule: InteractionRule): string {
  const action = rule.actionType || rule.action?.type || 'navigate';
  const p = (rule.payload || rule.action?.payload || {}) as Record<string, unknown>;
  const trigger = rule.trigger.replace(/^on/, '').toLowerCase();
  switch (action) {
    case 'navigate':
      return `On ${trigger}: navigate to \`${p.path ?? p.targetPath ?? '/'}\`.`;
    case 'openModal':
    case 'open_modal':
      return `On ${trigger}: open a modal dialog titled "${p.modalTitle ?? 'Dialog'}" with body "${p.modalBody ?? ''}" and a confirm button "${p.modalCta ?? 'Confirm'}" (focus trapped, Escape closes, focus returns to the trigger).`;
    case 'toggleDrawer':
      return `On ${trigger}: toggle a right-side drawer titled "${p.drawerTitle ?? 'Details'}" with content "${p.drawerBody ?? ''}".`;
    case 'showToast':
    case 'show_toast':
      return `On ${trigger}: show a toast/snackbar "${p.toastMessage ?? 'Done'}" for ~3.5s (aria-live="polite").`;
    case 'setState':
    case 'toggle_state':
      return `On ${trigger}: set client state \`${p.stateKey ?? 'status'}\` = \`${p.stateValue ?? 'active'}\` and show a confirmation toast.`;
    case 'submitForm':
    case 'submit_mock_form':
      return `On ${trigger}: submit the enclosing form and show "${p.toastMessage ?? 'Form submitted successfully!'}".`;
    default:
      return `On ${trigger}: ${action} ${JSON.stringify(p)}.`;
  }
}

// Text / link extraction for acceptance criteria -----------------------------------------

const TEXT_KEYS = /^(title|sectionTitle|eyebrow|sectionEyebrow|subtitle|sectionSubtitle|sectionDescription|badgeText|brandName|tagline|heading|text|body)$/;

function collectText(value: unknown, out: string[]): void {
  if (Array.isArray(value)) value.forEach((v) => collectText(v, out));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string' && TEXT_KEYS.test(k) && v.trim().length > 2) out.push(v.trim());
      else if (typeof v === 'object') collectText(v, out);
    }
  }
}

function collectLinks(value: unknown, out: Array<{ label: string; href: string }>): void {
  if (Array.isArray(value)) value.forEach((v) => collectLinks(v, out));
  else if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && /href$/i.test(k) && v) {
        const labelKey = k === 'href' ? 'label' : k.replace(/Href$/, 'Text');
        const label = (obj[labelKey] ?? obj.text ?? obj.label ?? k) as string;
        out.push({ label: String(label), href: v });
      } else if (typeof v === 'object') collectLinks(v, out);
    }
  }
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

interface Ctx {
  bp: ProjectBlueprint;
  preset: StackPreset;
  styling: StylingId;
  usedTypes: Set<string>;
  hiddenOmitted: number;
  sectionCount: number;
  interactions: Array<{ where: string; node: BlueprintNode; rule: InteractionRule }>;
}

function outline(node: BlueprintNode, prefix: string, isLast: boolean, isRoot: boolean, lines: string[], slotLabel?: string): void {
  if (node.hidden) return;
  const label = node.componentType === 'structure/slot'
    ? `⟨page content slot⟩${slotLabel ? ` — ${slotLabel}` : ''}`
    : `${STRUCTURE_TYPES.has(node.componentType) ? pascal(node.componentType) : pascal(node.componentType)} "${node.name}"`;
  lines.push(`${isRoot ? '' : prefix + (isLast ? '└─ ' : '├─ ')}${label}`);
  const kids = (node.children ?? []).filter((c) => !c.hidden);
  kids.forEach((child, i) =>
    outline(child, isRoot ? '' : prefix + (isLast ? '   ' : '│  '), i === kids.length - 1, false, lines, slotLabel)
  );
}

function renderNode(ctx: Ctx, node: BlueprintNode, number: string, depth: number, where: string, out: string[]): void {
  if (node.hidden) {
    ctx.hiddenOmitted += 1;
    return;
  }
  if (node.componentType === 'structure/slot') {
    out.push(`${'#'.repeat(Math.min(6, depth + 3))} ${number} ⟨Page content slot⟩\n\nEach page that uses this layout renders its own content here.\n`);
    return;
  }

  ctx.usedTypes.add(node.componentType);
  ctx.sectionCount += 1;
  const manifest = getManifest(node.componentType);
  const isStructure = STRUCTURE_TYPES.has(node.componentType);
  const heading = `${'#'.repeat(Math.min(6, depth + 3))} ${number} ${pascal(node.componentType)} — "${mdEscape(node.name)}"`;
  const lines: string[] = [heading, ''];
  lines.push(
    `- **Kind:** ${isStructure ? 'layout primitive' : 'component'} \`${node.componentType}\`${manifest ? ` (${manifest.displayName})` : ' (custom / unknown type — implement from props below)'}`
  );
  lines.push(`- **Node id:** \`${node.id}\``);
  if (node.locked) lines.push('- **Locked in editor** (no implementation impact).');

  const props = node.props ?? {};
  if (Object.keys(props).length) {
    lines.push('', '**Content & props (use verbatim):**', '', fence('json', stableJson(props)));
  }

  const css = describeStyles(node.styles);
  if (css) {
    lines.push('', '**Layout & style overrides** (on this element; see spec/responsive.md for the breakpoint contract):', '', fence('css', css));
  }

  const behaviour: string[] = [];
  for (const note of BEHAVIOUR_NOTES[node.componentType] ?? []) behaviour.push(note);
  const m = node.motionEffects;
  if (m) {
    if (m.entranceAnimation && m.entranceAnimation !== 'none') {
      behaviour.push(
        `Entrance animation \`${m.entranceAnimation}\` over ${DURATIONS[m.animationDuration] ?? '460ms'} (ease cubic-bezier(0.2,0,0,1)); disable under prefers-reduced-motion.`
      );
    }
    if (m.hoverTransform && m.hoverTransform !== 'none') behaviour.push(`Hover effect: ${HOVER_TRANSFORMS[m.hoverTransform] ?? m.hoverTransform}.`);
    if (m.sticky && m.sticky !== 'none') behaviour.push(`Sticky to the ${m.sticky} of the viewport (position: sticky; ${m.sticky}: 0; z-index above content).`);
    const hidden = [m.hideOnMobile && 'mobile', m.hideOnTablet && 'tablet', m.hideOnDesktop && 'desktop'].filter(Boolean);
    if (hidden.length) behaviour.push(`Hidden on: ${hidden.join(', ')} (exact ranges, see spec/responsive.md).`);
  }
  const classes = (node.customClasses || '').split(/\s+/).filter(Boolean);
  for (const cls of classes) {
    behaviour.push(ATOMIC_CLASS_MEANINGS[cls] ? `Visual treatment \`.${cls}\`: ${ATOMIC_CLASS_MEANINGS[cls]}.` : `Custom class \`.${cls}\` (preserve as a hook).`);
  }
  const projectRules = ctx.bp.interactions.filter((r) => r.sourceNodeId === node.id);
  for (const rule of [...(node.interactions ?? []), ...projectRules]) {
    behaviour.push(describeInteraction(rule));
    ctx.interactions.push({ where, node, rule });
  }
  if (behaviour.length) lines.push('', '**Behaviour:**', '', ...behaviour.map((b) => `- ${b}`));

  if (node.customCss?.trim()) {
    lines.push('', '**Custom CSS** (`selector` = this element; port faithfully):', '', fence('css', node.customCss.trim()));
  }

  out.push(lines.join('\n'), '');

  const kids = node.children ?? [];
  let i = 0;
  for (const child of kids) {
    if (child.hidden) {
      ctx.hiddenOmitted += 1;
      continue;
    }
    i += 1;
    renderNode(ctx, child, `${number}.${i}`, depth + 1, where, out);
  }
}

function renderTree(ctx: Ctx, root: BlueprintNode, where: string): string {
  const out: string[] = [];
  renderNode(ctx, root, '1', 0, where, out);
  return out.join('\n');
}

function pageSlug(page: PageRoute): string {
  return (page.path.replace(/^\/+|\/+$/g, '').replace(/[^a-zA-Z0-9]+/g, '-') || 'home').toLowerCase();
}

function layoutSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'layout';
}

function tokensCss(bp: ProjectBlueprint): string {
  const t = bp.tokens;
  const group = (title: string, prefix: string, rec: Record<string, string> | undefined) =>
    Object.keys(rec ?? {}).length
      ? [`  /* ${title} */`, ...Object.entries(rec ?? {}).map(([k, v]) => `  --${prefix}-${k}: ${v};`), '']
      : [];
  return [
    `/* Design tokens for "${bp.meta.name}" — generated ${SPEC_DATE}. Single source of truth for colors, type, shape, elevation and spacing. */`,
    ':root {',
    ...group('Color roles', 'md-sys-color', t.colors),
    '  /* Typography */',
    `  --md-sys-font-heading: ${t.fonts.heading};`,
    `  --md-sys-font-body: ${t.fonts.body};`,
    `  --md-sys-font-mono: ${t.fonts.mono};`,
    '',
    ...group('Shape (corner radius)', 'md-sys-shape-corner', t.radii),
    ...group('Elevation (shadows)', 'md-sys-elevation', t.shadows),
    ...group('Spacing scale', 'md-sys-spacing', t.spacing),
    '  /* Motion */',
    '  --md-sys-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);',
    '  --md-sys-motion-duration-short: 150ms;',
    '  --md-sys-motion-duration-medium: 300ms;',
    '}',
    ''
  ].join('\n');
}

function tokensJson(bp: ProjectBlueprint): string {
  const t = bp.tokens;
  const map = (rec: Record<string, string> | undefined, type: string) =>
    Object.fromEntries(Object.entries(rec ?? {}).map(([k, v]) => [k, { $type: type, $value: v }]));
  return stableJson({
    $description: `Design tokens for ${bp.meta.name}. CSS variable for token <group>.<name> is listed in spec/tokens.css.`,
    color: map(t.colors, 'color'),
    font: {
      heading: { $type: 'fontFamily', $value: t.fonts.heading },
      body: { $type: 'fontFamily', $value: t.fonts.body },
      mono: { $type: 'fontFamily', $value: t.fonts.mono }
    },
    radius: map(t.radii, 'dimension'),
    shadow: map(t.shadows, 'shadow'),
    spacing: map(t.spacing, 'dimension'),
    breakpoint: {
      tablet: { $type: 'dimension', $value: '1023px', $description: 'max-width for tablet overrides' },
      mobile: { $type: 'dimension', $value: '767px', $description: 'max-width for mobile overrides' },
      desktop: { $type: 'dimension', $value: '1024px', $description: 'min-width for desktop overrides' },
      wide: { $type: 'dimension', $value: '1280px', $description: 'min-width for wide overrides' }
    }
  });
}

function propsJsonSchema(type: string): unknown {
  const manifest = getManifest(type);
  if (!manifest) return { type: 'object', description: 'Unknown component type; see props in the page spec.' };
  try {
    return z.toJSONSchema(manifest.propsSchema as z.ZodType, { io: 'input', unrepresentable: 'any' });
  } catch {
    return { type: 'object', description: manifest.description };
  }
}

function propRows(type: string): string {
  const schema = propsJsonSchema(type) as { properties?: Record<string, Record<string, unknown>> };
  const manifest = getManifest(type);
  const rows = Object.entries(schema.properties ?? {}).map(([name, s]) => {
    let t = (s.type as string) ?? (s.anyOf ? 'union' : 'any');
    if (s.enum) t = (s.enum as unknown[]).map((v) => `\`${String(v)}\``).join(' \\| ');
    else if (t === 'array') {
      const items = s.items as Record<string, unknown> | undefined;
      const inner = items?.items as Record<string, unknown> | undefined;
      t =
        items?.type === 'object'
          ? `array<{ ${Object.keys((items.properties as object) ?? {}).join(', ')} }>`
          : items?.type === 'array'
            ? `array<array<${(inner?.type as string) ?? 'any'}>>`
            : `array<${(items?.type as string) ?? 'any'}>`;
    }
    const def = manifest?.defaultProps?.[name] ?? s.default;
    const defText = def === undefined ? '—' : typeof def === 'object' ? '_see example_' : `\`${mdEscape(String(def))}\``;
    return `| \`${name}\` | ${t} | ${defText} |`;
  });
  return rows.length ? ['| Prop | Type | Default |', '|---|---|---|', ...rows].join('\n') : '_No props._';
}

export function generateBuildSpec(input: ProjectBlueprint, options: BuildSpecOptions): BuildSpecResult {
  const preset = STACK_PRESETS[options.stack] ?? STACK_PRESETS.custom;
  const styling = options.styling && preset.supportedStyling.includes(options.styling) ? options.styling : preset.defaultStyling;
  const scope = options.scope ?? { type: 'project' };

  const pages = scope.type === 'page' ? input.pages.filter((p) => p.id === scope.pageId) : input.pages;
  if (pages.length === 0) throw new Error('Build spec scope matched no pages.');
  const layoutIds = new Set(pages.map((p) => p.layoutId).filter(Boolean) as string[]);
  const layouts = input.layouts.filter((l) => layoutIds.has(l.id));
  const bp: ProjectBlueprint = { ...input, pages, layouts };

  const ctx: Ctx = { bp, preset, styling, usedTypes: new Set(), hiddenOmitted: 0, sectionCount: 0, interactions: [] };
  const files: Record<string, string> = {};

  // ---- Layouts & pages -----------------------------------------------------
  const layoutDocs: string[] = [];
  for (const layout of layouts) {
    const tree: string[] = [];
    outline(layout.rootNode, '', true, true, tree, 'replaced by each page');
    layoutDocs.push(
      [
        `## Layout: ${layout.name}${layout.isDefault ? ' (default)' : ''}`,
        '',
        `- **File:** \`${preset.layoutFile(layoutSlug(layout.name))}\``,
        `- **Used by:** ${pages.filter((p) => p.layoutId === layout.id).map((p) => `\`${p.path}\``).join(', ') || '—'}`,
        '',
        fence('text', tree.join('\n')),
        '',
        renderTree(ctx, layout.rootNode, `layout:${layout.name}`)
      ].join('\n')
    );
  }
  files['spec/layouts.md'] = [`# Shared layouts`, '', layoutDocs.join('\n\n---\n\n') || '_This scope uses no shared layout._', ''].join('\n');

  const pageIndex: Array<{ page: PageRoute; file: string; slug: string; layout?: string }> = [];
  for (const page of pages) {
    const slug = pageSlug(page);
    const layout = layouts.find((l) => l.id === page.layoutId);
    const tree: string[] = [];
    outline(page.rootNode, '', true, true, tree);
    const file = preset.routeFile(page.path);
    pageIndex.push({ page, file, slug, layout: layout?.name });
    files[`spec/pages/${slug}.md`] = [
      `# Page: ${page.title} (\`${page.path}\`)`,
      '',
      `- **Route:** \`${page.path}\`${page.isDynamic ? ' (dynamic)' : ''}`,
      `- **Implement in:** \`${file}\``,
      `- **Document title:** ${page.seo?.title || page.title}`,
      `- **Meta description:** ${page.seo?.metaDescription || page.description || '—'}`,
      `- **Layout:** ${layout ? `${layout.name} — see spec/layouts.md (page content renders in the layout's content slot)` : 'none (standalone; renders its own chrome)'}`,
      '',
      '## Outline (render order, top to bottom)',
      '',
      fence('text', tree.join('\n')),
      '',
      '## Sections in detail',
      '',
      renderTree(ctx, page.rootNode, page.path)
    ].join('\n');
  }

  // ---- Components ----------------------------------------------------------
  const used = [...ctx.usedTypes].sort();
  const componentTypes = used.filter((t) => !STRUCTURE_TYPES.has(t));
  const structureTypes = used.filter((t) => STRUCTURE_TYPES.has(t));
  const componentSchemas: Record<string, unknown> = {};
  const compDocs = componentTypes.map((type) => {
    const manifest = getManifest(type);
    componentSchemas[type] = propsJsonSchema(type);
    return [
      `## ${pascal(type)} \`${type}\``,
      '',
      manifest?.description ?? 'Custom component — infer from the props used in the page specs.',
      '',
      `- **File:** \`${preset.componentFile(pascal(type))}\``,
      manifest?.slots?.length ? `- **Slots:** ${manifest.slots.map((s) => `\`${s.name}\` (${s.displayName})`).join(', ')}` : '- **Slots:** none',
      '',
      propRows(type),
      ...(BEHAVIOUR_NOTES[type]?.length ? ['', '**Behaviour contract:**', '', ...BEHAVIOUR_NOTES[type].map((n) => `- ${n}`)] : [])
    ].join('\n');
  });
  files['spec/components.md'] = [
    '# Component contracts',
    '',
    'Build each component below as a reusable, fully typed component whose props match this table exactly (names and types). Page specs pass concrete values. Full JSON Schemas are in `spec/components.schema.json`.',
    '',
    '## Layout primitives',
    '',
    structureTypes.length
      ? [
          '- `structure/container` — centered max-width wrapper. `maxWidth`: sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px, full 100%; horizontal padding 1.5rem. Optional flex props (`direction`, `justify`, `align`, `gap`, `textAlign`) apply to the element that directly wraps the children.',
          '- `structure/section` — full-bleed <section> with background `surfaceTone` (surface | low | container | high | primary-container → the matching surface/primary-container color token) and vertical padding `paddingY` (sm 2rem, md 3.5rem, lg 5rem, xl 7rem) containing a Container; flex props apply to the inner container.',
          '- `structure/grid` — CSS grid: 1 column on mobile; `columns` (1–4) from 768px (4 → 2 columns until 1024px). `gap` tokens: sm 1rem, md 1.5rem, lg 2.5rem, otherwise a raw CSS length. `alignItems` / `justifyItems` map to the same CSS properties.',
          '- `structure/slot` — where a page renders inside a shared layout.'
        ]
          .filter((line) => structureTypes.some((t) => line.includes(`\`${t}\``)))
          .join('\n')
      : '_None._',
    '',
    compDocs.join('\n\n---\n\n'),
    ''
  ].join('\n');
  files['spec/components.schema.json'] = stableJson({ $comment: 'JSON Schema (input shape) for every component used.', components: componentSchemas });

  // ---- Interactions ----------------------------------------------------------
  files['spec/interactions.md'] = [
    '# Interactions',
    '',
    ctx.interactions.length
      ? [
          '| Where | Element | Trigger → behaviour |',
          '|---|---|---|',
          ...ctx.interactions.map(({ where, node, rule }) => `| \`${where}\` | ${mdEscape(node.name)} (\`${node.id.slice(0, 8)}\`) | ${mdEscape(describeInteraction(rule))} |`)
        ].join('\n')
      : '_No declarative interactions beyond each component\'s built-in behaviour (see spec/components.md)._',
    '',
    'Built-in component behaviour (accordions, tabs, forms, nav menu) is specified per component in spec/components.md.',
    ''
  ].join('\n');

  // ---- Responsive contract ---------------------------------------------------
  files['spec/responsive.md'] = [
    '# Responsive contract',
    '',
    'Style overrides in the page specs are grouped by bucket. Apply them with exactly these media queries:',
    '',
    '| Bucket | Applies when | Notes |',
    '|---|---|---|',
    '| base | always | |',
    `| tablet | \`${BREAKPOINT_MEDIA.tablet}\` | also applies on mobile unless mobile overrides it |`,
    `| mobile | \`${BREAKPOINT_MEDIA.mobile}\` | wins over tablet |`,
    `| desktop | \`${BREAKPOINT_MEDIA.desktop}\` | |`,
    `| wide | \`${BREAKPOINT_MEDIA.wide}\` | wins over desktop |`,
    '',
    'Device visibility flags are exact ranges (not cascades):',
    '',
    `- hidden on mobile: \`${VISIBILITY_MEDIA.mobile}\``,
    `- hidden on tablet: \`${VISIBILITY_MEDIA.tablet}\``,
    `- hidden on desktop: \`${VISIBILITY_MEDIA.desktop}\``,
    '',
    'Verify every page at 375px, 768px, 1280px and 1440px wide: no horizontal scrolling, no overlapping text, tap targets ≥ 44px on mobile.',
    ''
  ].join('\n');

  // ---- Acceptance -------------------------------------------------------------
  const routePaths = new Set(input.pages.map((p) => p.path));
  const acceptance: string[] = ['# Acceptance checklist', '', 'Every item must be true before you report completion.', ''];
  for (const { page, layout } of pageIndex) {
    const texts: string[] = [];
    const links: Array<{ label: string; href: string }> = [];
    const walk = (n: BlueprintNode) => {
      if (n.hidden) return;
      collectText(n.props, texts);
      collectLinks(n.props, links);
      n.children?.forEach(walk);
    };
    walk(page.rootNode);
    acceptance.push(`## \`${page.path}\` — ${page.title}`, '');
    acceptance.push(`- [ ] Route renders with document title “${page.seo?.title || page.title}” and exactly one <h1>.`);
    if (layout) acceptance.push(`- [ ] Wrapped by the “${layout}” layout (shared header/footer visible).`);
    for (const t of [...new Set(texts)].slice(0, 25)) acceptance.push(`- [ ] Text visible verbatim: “${mdEscape(t)}”`);
    for (const l of links.filter((l, i, arr) => arr.findIndex((x) => x.href === l.href && x.label === l.label) === i).slice(0, 20)) {
      const internal = l.href.startsWith('/');
      const known = !internal || routePaths.has(l.href.split(/[?#]/)[0]);
      acceptance.push(`- [ ] “${mdEscape(l.label)}” links to \`${l.href}\`${internal && !known ? ' ⚠️ route not in this project — keep the link and list it in your final report' : ''}`);
    }
    acceptance.push('- [ ] Matches spec/responsive.md at 375 / 768 / 1280 / 1440px.', '');
  }
  acceptance.push(
    '## Global',
    '',
    '- [ ] All colors, radii, shadows, spacing and fonts come from the design tokens (no stray hex values).',
    '- [ ] Keyboard: every interactive element reachable and operable; visible focus ring.',
    '- [ ] WCAG 2.2 AA contrast; images have alt text; form fields have labels.',
    '- [ ] Animations respect prefers-reduced-motion.',
    `- [ ] ${preset.verifyCommands.map((c) => `\`${c}\``).join(', ')} all succeed with zero errors.`,
    ''
  );
  files['spec/acceptance.md'] = acceptance.join('\n');

  // ---- Tokens & machine-readable ----------------------------------------------
  files['spec/tokens.css'] = tokensCss(bp);
  files['spec/design-tokens.json'] = tokensJson(bp);
  files['spec/blueprint.json'] = stableJson(bp);

  // ---- Overview -----------------------------------------------------------------
  files['spec/overview.md'] = [
    `# ${bp.meta.name} — overview`,
    '',
    bp.meta.description || '',
    '',
    `- **Scope:** ${scope.type === 'project' ? `entire project (${pages.length} page${pages.length === 1 ? '' : 's'})` : `single page \`${pages[0].path}\``}`,
    `- **Sections/elements specified:** ${ctx.sectionCount}${ctx.hiddenOmitted ? ` (${ctx.hiddenOmitted} hidden element${ctx.hiddenOmitted === 1 ? '' : 's'} intentionally omitted)` : ''}`,
    `- **Distinct components:** ${componentTypes.length}`,
    '',
    '## Routes → files',
    '',
    '| Route | Title | Layout | File |',
    '|---|---|---|---|',
    ...pageIndex.map(({ page, file, layout }) => `| \`${page.path}\` | ${mdEscape(page.title)} | ${layout ?? '—'} | \`${file}\` |`),
    '',
    '## Page specs',
    '',
    ...pageIndex.map(({ page, slug }) => `- [${page.title}](pages/${slug}.md) — \`${page.path}\``),
    ''
  ].join('\n');

  // ---- CLAUDE.md -------------------------------------------------------------------
  const stackLine =
    preset.id === 'custom'
      ? `**Custom stack:** ${options.customStackDescription?.trim() || '(describe your stack in CLAUDE.md before starting)'}`
      : `**${preset.label}** — ${preset.tagline}`;
  const versions = Object.entries(preset.versions);
  files['CLAUDE.md'] = [
    `# CLAUDE.md — Build “${bp.meta.name}”`,
    '',
    `> Generated by Visual Builder on ${SPEC_DATE} from blueprint schema v${bp.schemaVersion}. The \`spec/\` folder is the single source of truth.`,
    '',
    '## Mission',
    '',
    'Implement the site described in `spec/` **exactly**: same routes, same sections in the same order, the same copy (verbatim), layout, responsive behaviour, interactions and design tokens. Do not invent sections, copy, images, or colors. When the spec is ambiguous, choose the simplest faithful interpretation and record it in your final report.',
    '',
    '## Target stack',
    '',
    `- ${stackLine}`,
    `- **Runtime:** Node.js ${NODE_LTS} (current LTS). Add \`.nvmrc\` / \`.node-version\` containing \`${NODE_LTS}\` and \`"engines": { "node": ">=${NODE_LTS}" }\`.`,
    ...(versions.length ? [`- **Versions (latest stable as of ${SPEC_DATE}):** ${versions.map(([n, v]) => `\`${n}@${v}\``).join(', ')}`] : []),
    `- **Scaffold:** \`${preset.scaffold}\``,
    `- **Styling:** ${STYLING_GUIDANCE[styling]}`,
    `- **Interactivity:** ${preset.interactivity}`,
    ...preset.conventions.map((c) => `- ${c}`),
    ...(options.extraInstructions?.trim()
      ? ['', '## Additional requirements from the project owner', '', options.extraInstructions.trim()]
      : []),
    '',
    '## Spec map',
    '',
    '| File | Use it for |',
    '|---|---|',
    '| `spec/overview.md` | route table and route → file mapping |',
    '| `spec/layouts.md` | shared header/footer layouts |',
    '| `spec/pages/*.md` | every section of every page: content, style overrides, behaviour |',
    '| `spec/components.md` | prop contracts + behaviour for each reusable component |',
    '| `spec/interactions.md` | click / submit behaviour |',
    '| `spec/responsive.md` | breakpoint and visibility rules |',
    '| `spec/tokens.css`, `spec/design-tokens.json` | design tokens |',
    '| `spec/acceptance.md` | the checklist you must satisfy |',
    '| `spec/blueprint.json`, `spec/components.schema.json` | machine-readable source if anything is unclear |',
    '',
    '## Build plan (commit after each step)',
    '',
    '1. Scaffold the project, pin Node, install the design tokens (`spec/tokens.css` / `spec/design-tokens.json`) as the global theme.',
    `2. Build the layout primitives and the ${componentTypes.length} components in \`spec/components.md\`, typed exactly as specified.`,
    `3. Build shared layout(s) from \`spec/layouts.md\`${layouts.length ? ` (${layouts.map((l) => l.name).join(', ')})` : ''}.`,
    `4. Build each page from \`spec/pages/\` in this order: ${pageIndex.map((p) => `\`${p.page.path}\``).join(', ')}.`,
    '5. Wire interactions from `spec/interactions.md`.',
    '6. Responsive + accessibility pass per `spec/responsive.md`.',
    `7. Run ${preset.verifyCommands.map((c) => `\`${c}\``).join(', ')} and fix everything, then walk through \`spec/acceptance.md\`.`,
    '',
    '## Non-negotiables',
    '',
    '- Copy is verbatim; section order matches the spec outline.',
    '- Only token-based colors/radii/shadows/spacing; no arbitrary values unless a page spec lists an explicit override.',
    '- Semantic HTML landmarks, one <h1> per page, labelled form controls, alt text, visible focus, WCAG 2.2 AA.',
    '- No lorem ipsum, no TODO stubs, no unused dependencies, no secrets in code.',
    '- Do not add pages, sections, or features that are not in the spec without asking.',
    '',
    '## Definition of done',
    '',
    '- All verification commands pass with zero errors and zero type errors.',
    '- Every box in `spec/acceptance.md` is satisfied.',
    '- Final message lists: files created, any spec item not implemented and why, and any assumptions made.',
    ''
  ].join('\n');

  // ---- Single-file prompt ------------------------------------------------------------
  const order = [
    'CLAUDE.md',
    'spec/overview.md',
    'spec/responsive.md',
    'spec/components.md',
    'spec/layouts.md',
    ...pageIndex.map((p) => `spec/pages/${p.slug}.md`),
    'spec/interactions.md',
    'spec/acceptance.md',
    'spec/tokens.css'
  ];
  const prompt = order
    .map((path) => `<!-- ===== ${path} ===== -->\n\n${path.endsWith('.css') ? fence('css', files[path]) : files[path]}`)
    .join('\n\n');

  return {
    files,
    prompt,
    stats: {
      pages: pages.length,
      sections: ctx.sectionCount,
      components: componentTypes.length,
      interactions: ctx.interactions.length,
      hiddenOmitted: ctx.hiddenOmitted
    }
  };
}
