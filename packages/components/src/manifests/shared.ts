import { z } from 'zod';
import { isSafeCssValue } from '@app-viz/engine';

/**
 * Helpers shared by every manifest file. Each manifest file exports a
 * `Record<type, ComponentManifest>` that `registry.ts` merges into COMPONENT_REGISTRY.
 */

/** CSS-valued string prop (gap, …): unsafe or empty values fail validation and fall back to the default. */
export const cssValue = () => z.string().refine((v) => isSafeCssValue(v), { message: 'Unsafe or empty CSS value' });

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copies `from` onto `to` when `to` is absent (legacy prop aliases). Never mutates the input. */
export function alias(props: Record<string, unknown>, pairs: Array<[from: string, to: string]>): Record<string, unknown> {
  const out = { ...props };
  for (const [from, to] of pairs) {
    if (out[to] === undefined && out[from] !== undefined) out[to] = out[from];
    delete out[from];
  }
  return out;
}

export const MAX_WIDTHS = ['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const;
export const DIRECTIONS = ['column', 'row', 'column-reverse', 'row-reverse'] as const;
export const JUSTIFY = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] as const;
export const ALIGN = ['stretch', 'flex-start', 'center', 'flex-end'] as const;
export const TEXT_ALIGN = ['left', 'center', 'right'] as const;

export const linkSchema = z.object({ label: z.string().default(''), href: z.string().default('') });
