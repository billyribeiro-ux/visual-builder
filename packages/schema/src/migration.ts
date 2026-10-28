import {
  ProjectBlueprintSchema,
  CURRENT_SCHEMA_VERSION,
  type ProjectBlueprint
} from './blueprint.js';

/**
 * Versioned, pure, forward-only blueprint migrations.
 *
 * Rules (do not break these — saved projects depend on them):
 *  1. Never edit a shipped step. Add a new step and bump CURRENT_SCHEMA_VERSION.
 *  2. Steps operate on untyped JSON and must be idempotent.
 *  3. The final result is always validated by `ProjectBlueprintSchema`.
 */
export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  description: string;
  migrate: (data: Record<string, unknown>) => Record<string, unknown>;
}

type JsonNode = {
  componentType?: string;
  props?: Record<string, unknown>;
  children?: JsonNode[];
};

/**
 * Canonical prop names per component. Older blueprints (and the pre-1.1 AI composer) wrote
 * aliases that the renderer silently ignored. Maps `componentType -> { alias: canonical }`.
 */
export const LEGACY_PROP_ALIASES: Record<string, Record<string, string>> = {
  'structure/section': { variant: 'surfaceTone' },
  'ui/card': { actionText: 'ctaText', actionHref: 'ctaHref' },
  'marketing/pricing-table': { headline: 'sectionTitle', subheadline: 'sectionDescription' },
  'marketing/testimonials': { headline: 'sectionTitle', items: 'testimonials' },
  'marketing/faq-accordion': { headline: 'sectionTitle' },
  'marketing/feature-grid': { sectionSubtitle: 'sectionDescription' },
  'marketing/contact-form': { title: 'sectionTitle', subtitle: 'sectionSubtitle' }
};

const SECTION_TONE_ALIASES: Record<string, string> = {
  'surface-low': 'low',
  'surface-high': 'high'
};

function normalizeNodeProps(node: JsonNode): void {
  const type = node.componentType ?? '';
  const props = (node.props ??= {});

  for (const [alias, canonical] of Object.entries(LEGACY_PROP_ALIASES[type] ?? {})) {
    if (alias in props) {
      if (!(canonical in props)) props[canonical] = props[alias];
      delete props[alias];
    }
  }

  if (type === 'structure/section' && typeof props.surfaceTone === 'string') {
    props.surfaceTone = SECTION_TONE_ALIASES[props.surfaceTone] ?? props.surfaceTone;
  }
  if (type === 'marketing/pricing-table' && Array.isArray(props.plans)) {
    props.plans = props.plans.map((plan: Record<string, unknown>) => {
      const next = { ...plan };
      if ('highlighted' in next) {
        next.isPopular ??= Boolean(next.highlighted);
        delete next.highlighted;
      }
      next.ctaHref ??= '#';
      return next;
    });
  }
  if (type === 'marketing/stats-bar' && Array.isArray(props.stats)) {
    props.stats = props.stats.map((s: Record<string, unknown>) => {
      const next = { ...s };
      if ('change' in next) {
        next.detail ??= next.change;
        delete next.change;
      }
      return next;
    });
  }
  if (type === 'app/kpi-grid' && Array.isArray(props.cards)) {
    props.cards = props.cards.map((c: Record<string, unknown>) => {
      const next = { ...c };
      if ('label' in next) {
        next.title ??= next.label;
        delete next.label;
      }
      if ('delta' in next) {
        next.change ??= next.delta;
        delete next.delta;
      }
      return next;
    });
  }

  for (const child of node.children ?? []) normalizeNodeProps(child);
}

function forEachRoot(data: Record<string, unknown>, fn: (root: JsonNode) => void): void {
  for (const page of (data.pages as Array<{ rootNode?: JsonNode }>) ?? []) {
    if (page.rootNode) fn(page.rootNode);
  }
  for (const layout of (data.layouts as Array<{ rootNode?: JsonNode }>) ?? []) {
    if (layout.rootNode) fn(layout.rootNode);
  }
}

export const MIGRATIONS: readonly MigrationStep[] = [
  {
    fromVersion: '1.0.0',
    toVersion: '1.1.0',
    description: 'Normalize legacy component prop aliases to the canonical registry contract.',
    migrate: (data) => {
      const next = structuredClone(data);
      forEachRoot(next, normalizeNodeProps);
      next.target = {
        framework: 'sveltekit',
        svelteVersion: '5.57.3',
        sveltekitVersion: '3.1.0',
        viteVersion: '8.3.5',
        nodeVersion: '26.13.0',
        styling: 'vanilla-md3'
      };
      next.schemaVersion = '1.1.0';
      return next;
    }
  }
];

export interface MigrationResult {
  blueprint: ProjectBlueprint;
  fromVersion: string;
  toVersion: string;
  appliedSteps: string[];
}

/** Upgrades any supported historical blueprint to the current schema and validates it. */
export function migrateBlueprintWithReport(input: unknown): MigrationResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Invalid blueprint: expected a JSON object.');
  }

  let current = structuredClone(input) as Record<string, unknown>;
  const fromVersion = typeof current.schemaVersion === 'string' ? current.schemaVersion : '1.0.0';
  current.schemaVersion = fromVersion;
  const appliedSteps: string[] = [];

  for (const step of MIGRATIONS) {
    if (current.schemaVersion === step.fromVersion) {
      current = step.migrate(current);
      appliedSteps.push(`${step.fromVersion} → ${step.toVersion}: ${step.description}`);
    }
  }

  if (current.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported blueprint schema version "${fromVersion}". This build supports up to ${CURRENT_SCHEMA_VERSION}.`
    );
  }

  return {
    blueprint: ProjectBlueprintSchema.parse(current),
    fromVersion,
    toVersion: CURRENT_SCHEMA_VERSION,
    appliedSteps
  };
}

export function migrateBlueprint(input: unknown): ProjectBlueprint {
  return migrateBlueprintWithReport(input).blueprint;
}
