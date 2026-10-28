import { z } from 'zod';
import { DesignTokensSchema } from './tokens.js';
import { ResponsiveStyleSchema, type ResponsiveStyle } from './styles.js';
import { InteractionRuleSchema, type InteractionRule } from './interactions.js';

/** Current on-disk schema version. Bump together with a step in `migration.ts`. */
export const CURRENT_SCHEMA_VERSION = '1.1.0' as const;
export const SUPPORTED_SCHEMA_VERSIONS = ['1.0.0', '1.1.0'] as const;

/**
 * Identifier format. `z.guid()` accepts any 8-4-4-4-12 hex identifier, which keeps every
 * blueprint ever saved (including deterministic seed IDs) loadable, while new IDs are
 * always RFC 9562 v4 UUIDs from `createId()`.
 */
const IdSchema = z.guid();

export function createId(): string {
  return globalThis.crypto.randomUUID();
}

export const MotionEffectsSchema = z.object({
  entranceAnimation: z
    .enum(['none', 'fadeIn', 'fadeInUp', 'fadeInDown', 'zoomIn', 'slideInLeft', 'slideInRight'])
    .default('none'),
  animationDuration: z.enum(['fast', 'normal', 'slow']).default('normal'),
  hoverTransform: z.enum(['none', 'lift', 'scale', 'glow', 'tilt']).default('none'),
  sticky: z.enum(['none', 'top', 'bottom']).default('none'),
  hideOnDesktop: z.boolean().default(false),
  hideOnTablet: z.boolean().default(false),
  hideOnMobile: z.boolean().default(false)
});
export type MotionEffects = z.infer<typeof MotionEffectsSchema>;

/**
 * A single node in the page tree. Declared explicitly (rather than inferred) because the
 * schema is recursive; this keeps the engine, studio, and codegen strongly typed end to end.
 */
export interface BlueprintNode {
  id: string;
  /** Registry key, e.g. "structure/container", "hero/split-hero", "ui/button". */
  componentType: string;
  name: string;
  slotName?: string;
  props: Record<string, any>;
  styles: ResponsiveStyle;
  interactions: InteractionRule[];
  children: BlueprintNode[];
  locked: boolean;
  hidden: boolean;
  customClasses: string;
  customCss: string;
  motionEffects?: MotionEffects;
}

/** Input shape accepted before parsing: every defaulted field is optional. */
export interface BlueprintNodeInput {
  id: string;
  componentType: string;
  name: string;
  slotName?: string;
  props?: Record<string, any>;
  styles?: z.input<typeof ResponsiveStyleSchema>;
  interactions?: z.input<typeof InteractionRuleSchema>[];
  children?: BlueprintNodeInput[];
  locked?: boolean;
  hidden?: boolean;
  customClasses?: string;
  customCss?: string;
  motionEffects?: z.input<typeof MotionEffectsSchema>;
}

export const BlueprintNodeSchema: z.ZodType<BlueprintNode, BlueprintNodeInput> = z.lazy(() =>
  z.object({
    id: IdSchema,
    componentType: z.string().min(1),
    name: z.string(),
    slotName: z.string().optional(),
    props: z.record(z.string(), z.any()).default({}),
    styles: ResponsiveStyleSchema,
    interactions: z.array(InteractionRuleSchema).default([]),
    children: z.array(BlueprintNodeSchema).default([]),
    locked: z.boolean().default(false),
    hidden: z.boolean().default(false),
    customClasses: z.string().default(''),
    customCss: z.string().default(''),
    motionEffects: MotionEffectsSchema.optional()
  })
);

/** Builds a fully-defaulted, validated node from a partial description. */
export function createNode(input: Omit<BlueprintNodeInput, 'id'> & { id?: string }): BlueprintNode {
  return BlueprintNodeSchema.parse({ ...input, id: input.id ?? createId() });
}

/** Deep-clones a subtree assigning fresh IDs to every node and interaction rule. */
export function reassignNodeIds<T extends BlueprintNodeInput | BlueprintNode>(node: T): T {
  return {
    ...node,
    id: createId(),
    props: structuredClone(node.props ?? {}),
    styles: node.styles ? structuredClone(node.styles) : undefined,
    interactions: (node.interactions ?? []).map((rule) => ({
      ...structuredClone(rule),
      id: createId()
    })),
    children: (node.children ?? []).map((c) => reassignNodeIds(c))
  } as T;
}

export const PageRouteSchema = z.object({
  id: IdSchema,
  path: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().default(''),
  layoutId: z.string().optional(),
  isDynamic: z.boolean().optional().default(false),
  rootNode: BlueprintNodeSchema,
  seo: z
    .object({
      title: z.string().optional(),
      metaDescription: z.string().optional(),
      ogImage: z.string().optional()
    })
    .default({})
});
export type PageRoute = z.infer<typeof PageRouteSchema>;

export const LayoutDefinitionSchema = z.object({
  id: IdSchema,
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

export const ProjectTargetSchema = z
  .object({
    framework: z.literal('sveltekit').default('sveltekit'),
    svelteVersion: z.string().default('5.57.3'),
    sveltekitVersion: z.string().default('3.1.0'),
    viteVersion: z.string().default('8.3.5'),
    nodeVersion: z.string().default('26.13.0'),
    styling: z.literal('vanilla-md3').default('vanilla-md3')
  })
  .prefault({});
export type ProjectTarget = z.infer<typeof ProjectTargetSchema>;

export const ProjectMetaSchema = z.object({
  id: IdSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().default(''),
  author: z.string().default('Visual Builder User'),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});
export type ProjectMeta = z.infer<typeof ProjectMetaSchema>;

export const ProjectBlueprintSchema = z.object({
  schemaVersion: z.enum(SUPPORTED_SCHEMA_VERSIONS).default(CURRENT_SCHEMA_VERSION),
  target: ProjectTargetSchema,
  meta: ProjectMetaSchema,
  tokens: DesignTokensSchema.prefault({}),
  layouts: z.array(LayoutDefinitionSchema).default([]),
  pages: z.array(PageRouteSchema).min(1),
  interactions: z.array(InteractionRuleSchema).default([]),
  assets: z.array(BlueprintAssetSchema).default([]),
  notes: z.record(z.string(), z.string()).default({})
});
export type ProjectBlueprint = z.infer<typeof ProjectBlueprintSchema>;
export type ProjectBlueprintInput = z.input<typeof ProjectBlueprintSchema>;
