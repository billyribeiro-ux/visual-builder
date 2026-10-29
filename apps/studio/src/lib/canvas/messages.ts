/**
 * Shared, zod-validated postMessage protocol between the studio (parent window) and the
 * live preview canvas (`/preview`, rendered inside an iframe).
 *
 * Both sides MUST:
 *  1. check `event.origin === window.location.origin`,
 *  2. check `event.source` (parent: the iframe's `contentWindow`; iframe: `window.parent`),
 *  3. run the payload through `parsePreviewMessage` / `parseParentMessage` and ignore `null`.
 *
 * The blueprint carried by `SYNC_STATE` is intentionally typed as `unknown` here: the iframe
 * validates it separately with `ProjectBlueprintSchema.safeParse` from `@app-viz/schema`.
 */
import { z } from 'zod';

/* ------------------------------------------------------------------------------------------ */
/* Shared enums                                                                               */
/* ------------------------------------------------------------------------------------------ */

export const BREAKPOINTS = ['mobile', 'tablet', 'desktop', 'wide'] as const;
export type PreviewBreakpoint = (typeof BREAKPOINTS)[number];

export const NODE_QUICK_ACTIONS = [
  'up',
  'down',
  'duplicate',
  'delete',
  'wrap-section',
  'wrap-container',
  'unwrap',
  'copy',
  'paste',
  'copy-style',
  'paste-style',
  'reset-style',
  'save-symbol',
  'hide',
  'align-left',
  'align-center',
  'align-right'
] as const;
export type NodeQuickAction = (typeof NODE_QUICK_ACTIONS)[number];

/** Actions that do not modify the target node and are therefore allowed on locked nodes. */
export const NON_MUTATING_NODE_ACTIONS: ReadonlySet<NodeQuickAction> = new Set<NodeQuickAction>([
  'duplicate',
  'copy',
  'copy-style',
  'save-symbol'
]);

export const KEY_SHORTCUTS = [
  'undo',
  'redo',
  'duplicate',
  'copy',
  'paste',
  'copy-style',
  'paste-style',
  'navigator',
  'delete',
  'escape',
  'command-palette',
  'move-up',
  'move-down',
  'select-parent',
  'select-child',
  'select-next',
  'select-prev',
  'toggle-preview',
  'zoom-fit',
  'zoom-100',
  'zoom-in',
  'zoom-out',
  'show-shortcuts',
  'save',
  'export',
  'panel-elements',
  'panel-layers',
  'panel-pages',
  'panel-assets',
  'panel-styles'
] as const;
export type KeyShortcut = (typeof KEY_SHORTCUTS)[number];

export const DROP_POSITIONS = ['before', 'inside', 'after'] as const;
export type DropPosition = (typeof DROP_POSITIONS)[number];

/* ------------------------------------------------------------------------------------------ */
/* Parent → Preview                                                                           */
/* ------------------------------------------------------------------------------------------ */

const NodeId = z.string().min(1).max(128);

/** Prop-path segments that could reach object prototypes in a nested-path writer. */
const FORBIDDEN_PATH_SEGMENTS: ReadonlySet<string> = new Set(['__proto__', 'prototype', 'constructor']);

export const ParentToPreviewSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('PING'),
    attempt: z.number().int().nonnegative().optional()
  }),
  z.object({
    type: z.literal('SYNC_STATE'),
    /** Validated by the iframe with `ProjectBlueprintSchema.safeParse`. */
    blueprint: z.unknown(),
    activePageId: z.string(),
    selectedNodeId: z.string().nullable(),
    isInteractiveMode: z.boolean(),
    activeBreakpoint: z.enum(BREAKPOINTS),
    /** Optional: node hovered in the studio (e.g. in the layers panel); outlined on the canvas. */
    hoverNodeId: z.string().nullable().optional()
  })
]);
export type ParentToPreviewMessage = z.infer<typeof ParentToPreviewSchema>;

/* ------------------------------------------------------------------------------------------ */
/* Preview → Parent                                                                           */
/* ------------------------------------------------------------------------------------------ */

export const PreviewToParentSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PREVIEW_READY') }),
  z.object({ type: z.literal('SELECT_NODE'), nodeId: NodeId }),
  z.object({ type: z.literal('NAVIGATE_PAGE'), path: z.string().startsWith('/').max(2048) }),
  z.object({
    type: z.literal('INLINE_PROP_EDIT'),
    nodeId: NodeId,
    /**
     * Prop path written by the edit: a top-level key (`title`) or a dot path into array/object
     * props (`features.0.title`, `columns.1.links.0.label`), exactly as the element's `data-prop`.
     */
    propKey: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z0-9_]+)*$/)
      .refine((path) => !path.split('.').some((segment) => FORBIDDEN_PATH_SEGMENTS.has(segment)), {
        message: 'Forbidden prop path segment'
      }),
    value: z.string().max(20_000),
    /** `true` for a committed value (Enter / blur). The canvas only sends committed values. */
    final: z.boolean().optional()
  }),
  z.object({
    type: z.literal('RESIZE_NODE_STYLE'),
    nodeId: NodeId,
    styles: z.record(z.string(), z.string())
  }),
  z.object({ type: z.literal('NODE_ACTION'), nodeId: NodeId, action: z.enum(NODE_QUICK_ACTIONS) }),
  z.object({
    type: z.literal('INSERT_STRUCTURE'),
    structureId: z.string().min(1).max(128),
    targetNodeId: NodeId.optional()
  }),
  z.object({
    type: z.literal('DROP_ITEM'),
    componentType: z.string().min(1).max(128).optional(),
    draggedNodeId: NodeId.optional(),
    targetNodeId: NodeId,
    position: z.enum(DROP_POSITIONS)
  }),
  z.object({ type: z.literal('KEY_SHORTCUT'), shortcut: z.enum(KEY_SHORTCUTS) }),
  z.object({ type: z.literal('OPEN_BLOCK_LIBRARY') })
]);
export type PreviewToParentMessage = z.infer<typeof PreviewToParentSchema>;

/** Parses a message received by the PARENT (studio) from the preview iframe. */
export function parsePreviewMessage(data: unknown): PreviewToParentMessage | null {
  const result = PreviewToParentSchema.safeParse(data);
  return result.success ? result.data : null;
}

/** Parses a message received by the PREVIEW iframe from the parent (studio). */
export function parseParentMessage(data: unknown): ParentToPreviewMessage | null {
  const result = ParentToPreviewSchema.safeParse(data);
  return result.success ? result.data : null;
}

/* ------------------------------------------------------------------------------------------ */
/* RESIZE_NODE_STYLE allowlist                                                                */
/* ------------------------------------------------------------------------------------------ */

export const RESIZABLE_STYLE_KEYS = [
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'width',
  'height',
  'minHeight',
  'maxWidth',
  'gap'
] as const;
export type ResizableStyleKey = (typeof RESIZABLE_STYLE_KEYS)[number];

const RESIZABLE_KEY_SET: ReadonlySet<string> = new Set(RESIZABLE_STYLE_KEYS);
const CSS_UNITS = 'px|rem|em|%|vh|vw|svh|dvh|lvh|vmin|vmax|ch|ex';
const CSS_LENGTH_RE = new RegExp(`^(?:auto|0|\\d{1,5}(?:\\.\\d{1,4})?(?:${CSS_UNITS}))$`);
const CSS_SIGNED_LENGTH_RE = new RegExp(`^(?:auto|0|-?\\d{1,5}(?:\\.\\d{1,4})?(?:${CSS_UNITS}))$`);

/** Returns `true` when `value` is a single CSS length (`12px`, `1.5rem`, `50%`, `0`) or `auto`. */
export function isCssLength(value: string, allowNegative = false): boolean {
  const v = value.trim();
  return (allowNegative ? CSS_SIGNED_LENGTH_RE : CSS_LENGTH_RE).test(v);
}

/**
 * Filters a RESIZE_NODE_STYLE payload down to allowlisted keys with valid CSS-length values.
 * Returns `null` when nothing valid remains.
 */
export function sanitizeResizeStyles(
  styles: Record<string, string>
): Partial<Record<ResizableStyleKey, string>> | null {
  const out: Partial<Record<ResizableStyleKey, string>> = {};
  let count = 0;
  for (const [key, raw] of Object.entries(styles)) {
    if (!RESIZABLE_KEY_SET.has(key) || typeof raw !== 'string') continue;
    if (!isCssLength(raw, key.startsWith('margin'))) continue;
    out[key as ResizableStyleKey] = raw.trim();
    count += 1;
  }
  return count > 0 ? out : null;
}

/* ------------------------------------------------------------------------------------------ */
/* Link safety (shared by the preview root and preview components)                            */
/* ------------------------------------------------------------------------------------------ */

export type HrefClassification =
  | { kind: 'empty' }
  | { kind: 'hash'; fragment: string }
  | { kind: 'internal'; path: string; fragment: string }
  | { kind: 'external'; url: string }
  | { kind: 'blocked'; reason: string; dangerous: boolean };

const DANGEROUS_SCHEMES = new Set(['javascript', 'data', 'vbscript']);

/**
 * Classifies an href for canvas link handling. Browsers strip ASCII whitespace / control
 * characters while parsing the scheme (e.g. `java\tscript:`), so we do the same before matching.
 */
export function classifyHref(raw: string | null | undefined): HrefClassification {
  if (raw == null) return { kind: 'empty' };
  // eslint-disable-next-line no-control-regex
  const compact = String(raw).replace(/[\u0000-\u0020\u007F]+/g, '');
  if (compact === '') return { kind: 'empty' };

  if (compact.startsWith('#')) return { kind: 'hash', fragment: compact.slice(1) };

  // Protocol-relative (`//host`) and backslash variants (`/\host`, `\\host`) are external.
  if (/^[/\\]{2}/.test(compact)) {
    return { kind: 'external', url: `https:${compact.replace(/\\/g, '/')}` };
  }

  const schemeMatch = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(compact);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (DANGEROUS_SCHEMES.has(scheme)) {
      return { kind: 'blocked', reason: `${scheme}: URL`, dangerous: true };
    }
    if (scheme === 'http' || scheme === 'https') {
      try {
        return { kind: 'external', url: new URL(String(raw).trim()).href };
      } catch {
        return { kind: 'blocked', reason: 'malformed URL', dangerous: false };
      }
    }
    return { kind: 'blocked', reason: `unsupported ${scheme}: URL`, dangerous: false };
  }

  // Internal path. Relative paths (`pricing`) are treated as root-relative.
  const trimmed = String(raw).trim();
  const absolute = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const hashIdx = absolute.indexOf('#');
  const fragment = hashIdx >= 0 ? absolute.slice(hashIdx + 1) : '';
  const beforeHash = hashIdx >= 0 ? absolute.slice(0, hashIdx) : absolute;
  const path = beforeHash.split('?')[0] || '/';
  return { kind: 'internal', path, fragment };
}

/** Returns a render-safe href: dangerous schemes (`javascript:`, `data:`, `vbscript:`) become `#`. */
export function sanitizeHref(raw: string | null | undefined): string {
  if (raw == null) return '#';
  const c = classifyHref(raw);
  if (c.kind === 'empty') return '#';
  if (c.kind === 'blocked' && c.dangerous) return '#';
  return String(raw).trim();
}
