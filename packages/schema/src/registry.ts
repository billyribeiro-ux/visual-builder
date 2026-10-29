import { z } from 'zod';
import type { BlueprintNode } from './blueprint.js';

export const ComponentCategorySchema = z.enum([
  'structure',
  'navigation',
  'hero',
  'marketing',
  'ui',
  'app',
  'media',
  'basic',
  'forms',
  'site'
]);
export type ComponentCategory = z.infer<typeof ComponentCategorySchema>;

export interface ComponentSlot {
  name: string;
  displayName: string;
  allowedChildren?: string[];
}

export interface ComponentManifest<TProps = Record<string, any>> {
  type: string;
  displayName: string;
  category: ComponentCategory;
  description: string;
  /**
   * Studio UI icon: a phosphor-svelte (3.1.1) icon component name WITHOUT the `Icon` suffix,
   * e.g. `Rows`, `SquaresFour`, `CurrencyDollar`. Never rendered inside generated sites.
   */
  icon: string;
  /**
   * PascalCase name of the ONE canonical Svelte component that renders this type, i.e.
   * `packages/components/src/svelte/<component>.svelte`. The studio canvas and the SvelteKit
   * export both render this exact file.
   */
  component: string;
  propsSchema: z.ZodType<TProps>;
  defaultProps: TProps;
  slots: ComponentSlot[];
  allowedParents?: string[];
  isSection?: boolean;
  /** True when the component renders child nodes (receives a `children` snippet). */
  isContainer?: boolean;
  /**
   * True when layout style keys (display, flex*, grid*, gap, textAlign…) must target the inner
   * element carrying `data-layout-of="<node id>"` rather than the component root.
   */
  layoutInner?: boolean;
  /** Behaviour contract that is not visible in props (read by the build spec). */
  behaviour?: string[];
  /** Extra search terms for the studio widget library. */
  keywords?: string[];
  /**
   * Maps legacy prop names/shapes onto the current schema before validation
   * (e.g. Card `actionText` → `ctaText`). Must be pure and must not mutate its input.
   */
  upgradeProps?: (props: Record<string, unknown>) => Record<string, unknown>;
  /** Optional inspector overrides (labels, control types, enum options) per prop. */
  propControls?: Record<string, PropControl>;
}

export interface PropControl {
  label?: string;
  /**
   * Inspector control. When omitted the inspector infers one from the zod schema and the prop key
   * (e.g. `*Href` → link picker, `icon` → icon picker, `src`/`image*` → asset picker).
   */
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'url' | 'icon' | 'image' | 'date' | 'code';
  options?: Array<{ value: string; label: string }>;
  help?: string;
  /** Numeric bounds / step for `number` controls. */
  min?: number;
  max?: number;
  step?: number;
  /** Unit hint shown next to numeric controls, e.g. `px`, `ms`, `%`. */
  unit?: string;
  /** Inspector grouping, e.g. "Content", "Buttons", "Items", "Settings". */
  group?: string;
}
