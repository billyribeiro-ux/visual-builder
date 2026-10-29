import { isValidHtmlId, sanitizeNodeAttributes, type BlueprintNode, type PageRoute, type ProjectBlueprint } from '@app-viz/schema';
import { sanitizeClassList, sanitizeNodeId } from '@app-viz/engine';
import { collectInteractionRules, resolveComponentProps, sanitizeUrl, safeSrc } from '@app-viz/components';
import { collectAssetFiles, rewriteAssetReferences } from './assets.js';

export { sanitizeCssValue, safeStyleString, sanitizeClassList } from '@app-viz/engine';

/* ==========================================================================
   Output-safety helpers
   --------------------------------------------------------------------------
   Every user-controlled value that ends up in generated Svelte source MUST go
   through one of these helpers. Svelte evaluates `{...}` inside quoted
   attributes and text, and `\"` is NOT an escape inside a quoted attribute,
   so props are always emitted as `{<JS literal>}` expressions.
   ========================================================================== */

/**
 * JSON.stringify hardened for embedding in Svelte markup expressions and
 * `<script>` blocks: `<` is escaped (so `</script>` / `<!--` can never appear)
 * and U+2028/U+2029 are escaped (legacy JS line terminators). `script:` is written as
 * `script\u003a` so no `javascript:` / `vbscript:` substring survives in generated code.
 */
export function safeJson(value: unknown): string {
  const json = JSON.stringify(value === undefined ? null : value) ?? 'null';
  return json
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    // Defense in depth: `javascript:` / `vbscript:` never appear literally in generated source,
    // even inside string literals (`\u003a` decodes to the same character).
    .replace(/(script):/gi, '$1\\u003a');
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

/**
 * Allows only relative URLs (`/path`, `#hash`, `?query`, `./x`, `x/y`) and the
 * http(s):, mailto:, tel: schemes. Anything else (javascript:, data:,
 * vbscript:, protocol-relative `//host`, ...) becomes `fallback`. Same policy as the
 * components' runtime `safeHref` (both delegate to `sanitizeUrl`).
 */
export function sanitizeHref(value: unknown, fallback = '#'): string {
  return sanitizeUrl(value, fallback);
}

function isUrlKey(key: string): boolean {
  return /href$/i.test(key) || key === 'src' || /url$/i.test(key);
}

function sanitizeUrlValue(key: string, value: string): string {
  return /href$/i.test(key) ? sanitizeHref(value) : safeSrc(value);
}

/** Recursively sanitizes every `*href` / `*Href` / `src` / `*Url` string inside array/object props. */
export function sanitizeUrlsDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((v) => sanitizeUrlsDeep(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      out[key] = typeof v === 'string' && isUrlKey(key) ? sanitizeUrlValue(key, v) : sanitizeUrlsDeep(v);
    }
    return out;
  }
  return value;
}

/* ==========================================================================
   Generic, manifest-driven component emitter
   ========================================================================== */

const PROP_NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const COMPONENT_NAME_RE = /^[A-Z][A-Za-z0-9]*$/;

/**
 * Emits one validated prop as a Svelte attribute expression. Values come from
 * `resolveComponentProps` (manifest schema validated); URL-like keys are additionally
 * sanitized (deeply for arrays/objects). Returns `null` for values that must not be emitted.
 */
function emitPropAttribute(key: string, value: unknown): string | null {
  if (!PROP_NAME_RE.test(key) || value === undefined || value === null) return null;
  if (typeof value === 'string') {
    return `${key}={${safeJson(isUrlKey(key) ? sanitizeUrlValue(key, value) : value)}}`;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? `${key}={${String(value)}}` : null;
  if (typeof value === 'boolean') return `${key}={${value ? 'true' : 'false'}}`;
  if (typeof value === 'object') return `${key}={${safeJson(sanitizeUrlsDeep(value))}}`;
  return null;
}

/** Emits a self-closing (or children-wrapping) component tag with one attribute per line. */
function tag(name: string, indent: string, attrs: string[], children?: string): string {
  const list = attrs.filter(Boolean);
  const open =
    list.length <= 2
      ? `${indent}<${name}${list.map((a) => ` ${a}`).join('')}`
      : `${indent}<${name}\n${list.map((a) => `${indent}  ${a}`).join('\n')}\n${indent}`;
  if (!children) return `${open}${list.length <= 2 ? ' ' : ''}/>`;
  return `${open}>\n${children}\n${indent}</${name}>`;
}

interface EmitContext {
  /** Canonical component names used by the page (drives the import list). */
  used: Set<string>;
  /** Asset references (stored path or data URL) → exported public path. */
  assetPaths: ReadonlyMap<string, string>;
}

function renderChildren(node: BlueprintNode, indent: string, slotNode: BlueprintNode | undefined, ctx: EmitContext): string {
  return (node.children || [])
    .map((child) => renderNodeToSvelte(child, indent + '  ', slotNode, ctx))
    .filter(Boolean)
    .join('\n');
}

/**
 * Renders a node as `<Component data-node-id="…" class="…" prop={…}>…children…</Component>`.
 * There are no wrapper elements: the canonical component spreads `data-node-id` onto its root,
 * where the compiled node stylesheet (`src/lib/styles/nodes.css`) targets it.
 */
function renderNodeToSvelte(node: BlueprintNode, indent: string, slotNode: BlueprintNode | undefined, ctx: EmitContext): string {
  if (node.hidden) return '';
  if (node.componentType === 'structure/slot') {
    return slotNode ? renderNodeToSvelte(slotNode, indent, undefined, ctx) : '';
  }

  const id = sanitizeNodeId(node.id);
  const cls = sanitizeClassList(node.customClasses);
  // "CSS ID" (regex-validated, safe verbatim) and allow-listed attributes (values JSON-escaped).
  const htmlId = isValidHtmlId(node.htmlId) ? node.htmlId : '';
  const extraAttrs = Object.entries(sanitizeNodeAttributes(node.attributes)).map(([key, value]) => `${key}={${safeJson(value)}}`);
  const baseAttrs = [...extraAttrs, htmlId ? `id="${htmlId}"` : '', `data-node-id="${id}"`, cls ? `class="${cls}"` : ''];

  // Asset references are rewritten BEFORE validation so data-URL props from older projects
  // become `/assets/…` paths instead of being rejected by the URL policy.
  const resolved = resolveComponentProps(node.componentType, rewriteAssetReferences(node.props, ctx.assetPaths));
  if (!resolved || !COMPONENT_NAME_RE.test(resolved.manifest.component)) {
    // Unknown types are never silently dropped: they render a visible placeholder (same as the canvas).
    ctx.used.add('UnknownComponent');
    return tag(
      'UnknownComponent',
      indent,
      [...baseAttrs, `type={${safeJson(node.componentType)}}`],
      renderChildren(node, indent, slotNode, ctx)
    );
  }

  const name = resolved.manifest.component;
  ctx.used.add(name);
  const propAttrs = Object.entries(resolved.props)
    .map(([key, value]) => emitPropAttribute(key, value))
    .filter((attr): attr is string => attr !== null);
  const children = resolved.manifest.isContainer ? renderChildren(node, indent, slotNode, ctx) : undefined;
  return tag(name, indent, [...baseAttrs, ...propAttrs], children);
}

/** Renders a node tree to Svelte markup and reports the components it uses. */
export function renderNodeMarkup(
  node: BlueprintNode,
  slotNode?: BlueprintNode,
  indent = '  ',
  assetPaths: ReadonlyMap<string, string> = new Map()
): { markup: string; components: string[] } {
  const ctx: EmitContext = { used: new Set(), assetPaths };
  const markup = renderNodeToSvelte(node, indent, slotNode, ctx);
  return { markup, components: [...ctx.used].sort() };
}

function importLine(name: string): string {
  return name === 'UnknownComponent'
    ? `  import UnknownComponent from '#lib/components/lib/UnknownComponent.svelte';`
    : `  import ${name} from '#lib/components/${name}.svelte';`;
}

export function generatePageRoute(page: PageRoute, blueprint?: ProjectBlueprint): string {
  const assetPaths = blueprint ? collectAssetFiles(blueprint).publicPathFor : new Map<string, string>();
  const layout = page.layoutId && blueprint ? blueprint.layouts.find((l) => l.id === page.layoutId) : undefined;

  const { markup, components } = layout
    ? renderNodeMarkup(layout.rootNode, page.rootNode, '  ', assetPaths)
    : renderNodeMarkup(page.rootNode, undefined, '  ', assetPaths);

  const rules = collectInteractionRules([layout?.rootNode, page.rootNode], blueprint?.interactions ?? []);
  const hasRules = rules.length > 0;

  const imports = components.map(importLine);
  if (hasRules) {
    imports.push(`  import InteractionLayer from '#lib/components/lib/InteractionLayer.svelte';`);
    imports.push(`  import type { InteractionRuntimeRule } from '#lib/components/lib/interactions.js';`);
  }
  // safeJson: this is serialized inside <script>, so `</script>` can never appear raw.
  const rulesLine = hasRules ? `\n\n  const interactionRules: InteractionRuntimeRule[] = ${safeJson(rules)};` : '';

  const headTitle = escapeSvelteText(page.seo?.title || page.title || '');
  const headDescription = escapeSvelteText(page.seo?.metaDescription || page.description || '');
  const ogImage = safeSrc(page.seo?.ogImage ?? '');
  const ogImageTags = ogImage
    ? `\n  <meta property="og:image" content="${escapeSvelteText(ogImage)}" />\n  <meta name="twitter:card" content="summary_large_image" />`
    : '';

  return `<script lang="ts">
${imports.join('\n')}${rulesLine}
</script>

<svelte:head>
  <title>${headTitle}</title>
  <meta name="description" content="${headDescription}" />
  <meta property="og:title" content="${headTitle}" />
  <meta property="og:description" content="${headDescription}" />${ogImageTags}
</svelte:head>

<main class="site-main">
${markup}
</main>${hasRules ? '\n\n<InteractionLayer rules={interactionRules} />' : ''}
`;
}

export function generateRootLayout(_blueprint: ProjectBlueprint): string {
  return `<script lang="ts">
  import '../app.css';
  import '../lib/styles/nodes.css';
  import type { Snippet } from 'svelte';

  let { children }: { children?: Snippet } = $props();
</script>

<div class="site-root">
  {@render children?.()}
</div>
`;
}

export function generateErrorRoute(): string {
  return `<script lang="ts">
  import { page } from '$app/state';
</script>

<main class="error-page">
  <div class="md-card md-card--outlined error-card">
    <span class="md-badge">Error {page.status}</span>
    <h1 class="md-headline-large">{page.error?.message || 'Page Not Found'}</h1>
    <p class="md-body-medium">The requested route does not exist or encountered an unexpected condition.</p>
    <a href="/" class="md-btn md-btn--md md-btn--filled">Return to Home</a>
  </div>
</main>

<style>
  .error-page {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }
  .error-card {
    max-width: 32rem;
    text-align: center;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .error-card p {
    color: var(--md-sys-color-on-surface-variant);
  }
</style>
`;
}
