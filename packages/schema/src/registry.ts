import { z } from 'zod';
import type { BlueprintNode } from './blueprint.js';

export const ComponentCategorySchema = z.enum([
  'structure',
  'navigation',
  'hero',
  'marketing',
  'ui',
  'app',
  'media'
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
  icon: string;
  propsSchema: z.ZodType<TProps>;
  defaultProps: TProps;
  slots: ComponentSlot[];
  allowedParents?: string[];
  isSection?: boolean;
  /** Optional inspector overrides (labels, control types, enum options) per prop. */
  propControls?: Record<string, PropControl>;
}

export interface PropControl {
  label?: string;
  type?: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'color' | 'url';
  options?: Array<{ value: string; label: string }>;
  help?: string;
}
