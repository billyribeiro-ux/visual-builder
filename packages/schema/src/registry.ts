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
}
