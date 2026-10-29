import type { ComponentManifest } from '@app-viz/schema';
import { getManifest } from './registry.js';

/**
 * Turns raw blueprint props into the exact props a canonical component receives. Used by BOTH
 * the studio canvas renderer and the SvelteKit codegen emitter, so the canvas and the export
 * always render the same validated values.
 *
 * Contract:
 *  1. `manifest.upgradeProps` maps legacy prop names onto the current schema.
 *  2. The whole object is validated with `manifest.propsSchema` (unknown keys are dropped,
 *     missing keys receive their schema default).
 *  3. If validation fails, each top-level prop is validated on its own: a valid value is kept;
 *     for arrays, invalid items are dropped (never replaced by sample data); any other invalid
 *     value falls back to its schema default. Every fallback is reported in `issues`.
 */
export interface ResolvedProps {
  props: Record<string, unknown>;
  /** Human-readable description of every value that was dropped or replaced. Empty when valid. */
  issues: string[];
}

interface ZodLike {
  safeParse(value: unknown): { success: true; data: unknown } | { success: false; error: unknown };
  _zod?: { def?: { type?: string; innerType?: ZodLike; element?: ZodLike; shape?: Record<string, ZodLike> } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrap(schema: ZodLike): ZodLike {
  let current = schema;
  for (let i = 0; i < 8; i++) {
    const def = current._zod?.def;
    if (def?.innerType && (def.type === 'default' || def.type === 'optional' || def.type === 'nullable' || def.type === 'prefault')) {
      current = def.innerType;
    } else break;
  }
  return current;
}

function objectShape(schema: ZodLike): Record<string, ZodLike> | null {
  const inner = unwrap(schema);
  const def = inner._zod?.def;
  return def?.type === 'object' && def.shape ? def.shape : null;
}

function arrayElement(schema: ZodLike): ZodLike | null {
  const def = unwrap(schema)._zod?.def;
  return def?.type === 'array' && def.element ? def.element : null;
}

export function resolveManifestProps(manifest: ComponentManifest<any>, raw: unknown): ResolvedProps {
  const input = isRecord(raw) ? raw : {};
  const upgraded = manifest.upgradeProps ? manifest.upgradeProps(input) : input;
  const schema = manifest.propsSchema as unknown as ZodLike;

  const full = schema.safeParse(upgraded);
  if (full.success) return { props: full.data as Record<string, unknown>, issues: [] };

  const shape = objectShape(schema);
  const issues: string[] = [];
  if (!shape) {
    const fallback = schema.safeParse({});
    issues.push(`${manifest.type}: props are invalid; all props reset to their defaults`);
    return { props: fallback.success ? (fallback.data as Record<string, unknown>) : {}, issues };
  }

  const props: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(shape)) {
    const value = upgraded[key];
    const direct = field.safeParse(value);
    if (direct.success) {
      if (direct.data !== undefined) props[key] = direct.data;
      continue;
    }
    const element = arrayElement(field);
    if (element && Array.isArray(value)) {
      const kept: unknown[] = [];
      value.forEach((item, index) => {
        const parsed = element.safeParse(item);
        if (parsed.success) kept.push(parsed.data);
        else issues.push(`${manifest.type}.${key}[${index}]: invalid item dropped`);
      });
      const asArray = field.safeParse(kept);
      if (asArray.success) {
        props[key] = asArray.data;
        continue;
      }
    }
    const fallback = field.safeParse(undefined);
    issues.push(`${manifest.type}.${key}: invalid value replaced by its default`);
    if (fallback.success && fallback.data !== undefined) props[key] = fallback.data;
  }
  return { props, issues };
}

/** {@link resolveManifestProps} by registry type; `null` for unknown component types. */
export function resolveComponentProps(type: string, raw: unknown): (ResolvedProps & { manifest: ComponentManifest<any> }) | null {
  const manifest = getManifest(type);
  if (!manifest) return null;
  return { manifest, ...resolveManifestProps(manifest, raw) };
}
