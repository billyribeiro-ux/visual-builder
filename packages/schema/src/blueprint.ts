import { z } from 'zod';
import { DesignTokensSchema } from './tokens.js';
import { ResponsiveStyleSchema } from './styles.js';
import { InteractionRuleSchema } from './interactions.js';

export const BlueprintNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    componentType: z.string(), // e.g. "structure/container", "marketing/hero-split", "ui/button"
    name: z.string(),
    slotName: z.string().optional(),
    props: z.record(z.string(), z.any()).default({}),
    styles: ResponsiveStyleSchema.default({ base: {} }),
    interactions: z.array(InteractionRuleSchema).default([]),
    children: z.array(BlueprintNodeSchema).default([]),
    locked: z.boolean().default(false),
    hidden: z.boolean().default(false),
    customClasses: z.string().default('')
  })
);
export type BlueprintNode = z.infer<typeof BlueprintNodeSchema>;

export const PageRouteSchema = z.object({
  id: z.string().uuid(),
  path: z.string(), // e.g. "/", "/features", "/pricing", "/dashboard", "/dashboard/settings"
  slug: z.string(),
  title: z.string(),
  description: z.string().default(''),
  layoutId: z.string().optional(),
  isDynamic: z.boolean().optional().default(false),
  rootNode: BlueprintNodeSchema,
  seo: z.object({
    title: z.string().optional(),
    metaDescription: z.string().optional(),
    ogImage: z.string().optional()
  }).default({})
});
export type PageRoute = z.infer<typeof PageRouteSchema>;

export const LayoutDefinitionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isDefault: z.boolean().default(false),
  rootNode: BlueprintNodeSchema
});
export type LayoutDefinition = z.infer<typeof LayoutDefinitionSchema>;

export const BlueprintAssetSchema = z.object({
  id: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number().default(0),
  localPath: z.string(),
  alt: z.string().default(''),
  category: z.string().optional(),
  svgContent: z.string().optional(),
  dataUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional()
});
export type BlueprintAsset = z.infer<typeof BlueprintAssetSchema>;

export const ProjectTargetSchema = z.object({
  framework: z.literal('sveltekit').default('sveltekit'),
  svelteVersion: z.string().default('5.57.2'),
  sveltekitVersion: z.string().default('3.1.0'),
  viteVersion: z.string().default('8.0.12'),
  nodeVersion: z.string().default('24.22.0'),
  styling: z.literal('vanilla-md3').default('vanilla-md3')
}).default({
  framework: 'sveltekit',
  svelteVersion: '5.57.2',
  sveltekitVersion: '3.1.0',
  viteVersion: '8.0.12',
  nodeVersion: '24.22.0',
  styling: 'vanilla-md3'
});
export type ProjectTarget = z.infer<typeof ProjectTargetSchema>;

export const ProjectMetaSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().default(''),
  author: z.string().default('Visual Builder User'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

export const ProjectBlueprintSchema = z.object({
  schemaVersion: z.literal('1.0.0').default('1.0.0'),
  target: ProjectTargetSchema,
  meta: ProjectMetaSchema,
  tokens: DesignTokensSchema.default({}),
  layouts: z.array(LayoutDefinitionSchema).default([]),
  pages: z.array(PageRouteSchema),
  interactions: z.array(InteractionRuleSchema).default([]),
  assets: z.array(BlueprintAssetSchema).default([]),
  notes: z.record(z.string(), z.string()).default({})
});
export type ProjectBlueprint = z.infer<typeof ProjectBlueprintSchema>;
