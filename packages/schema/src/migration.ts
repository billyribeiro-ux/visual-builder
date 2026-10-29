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


/* -------------------------------------------------------------------------------------------- */
/* 1.1.0 → 1.2.0: untouched legacy default theme → current default theme                         */
/* Frozen literals: this step must keep producing the same output forever.                       */
/* -------------------------------------------------------------------------------------------- */

const LEGACY_THEME_1_1 = {
  "colors": {
    "error": "#B3261E",
    "error-container": "#F9DEDC",
    "on-error": "#FFFFFF",
    "on-error-container": "#410E0B",
    "on-primary": "#FFFFFF",
    "on-primary-container": "#041E49",
    "on-secondary": "#FFFFFF",
    "on-secondary-container": "#001D35",
    "on-success": "#FFFFFF",
    "on-success-container": "#072711",
    "on-surface": "#1B1B1F",
    "on-surface-variant": "#44474E",
    "on-tertiary": "#FFFFFF",
    "on-tertiary-container": "#072711",
    "outline": "#74777F",
    "outline-variant": "#C4C6D0",
    "primary": "#0B57D0",
    "primary-container": "#D3E3FD",
    "primary-hover": "#0842A0",
    "secondary": "#00639B",
    "secondary-container": "#C2E7FF",
    "secondary-hover": "#004A77",
    "success": "#146C2E",
    "success-container": "#C4EED0",
    "surface": "#FAF9FD",
    "surface-bright": "#FAF9FD",
    "surface-container": "#EEEDF1",
    "surface-container-high": "#E8E7EC",
    "surface-container-highest": "#E3E2E6",
    "surface-container-low": "#F4F3F7",
    "surface-container-lowest": "#FFFFFF",
    "surface-dim": "#DBD9DD",
    "surface-variant": "#E1E2EC",
    "tertiary": "#146C2E",
    "tertiary-container": "#C4EED0"
  },
  "fonts": {
    "body": "Roboto, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "heading": "Roboto, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
    "mono": "\"Roboto Mono\", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
  },
  "radii": {
    "extra-large": "28px",
    "extra-small": "4px",
    "full": "9999px",
    "large": "16px",
    "lg": "16px",
    "md": "12px",
    "medium": "12px",
    "none": "0px",
    "sm": "4px",
    "small": "8px",
    "xl": "28px"
  },
  "shadows": {
    "level0": "none",
    "level1": "0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
    "level2": "0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)",
    "level3": "0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)",
    "level4": "0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30)",
    "level5": "0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)"
  },
  "spacing": {
    "2xl": "48px",
    "3xl": "64px",
    "lg": "24px",
    "md": "16px",
    "sm": "8px",
    "xl": "32px",
    "xs": "4px"
  }
} as const;

const LEGACY_DARK_COLORS_1_1: Record<string, string> = {
  "error": "#F2B8B5",
  "error-container": "#8C1D18",
  "on-error": "#601410",
  "on-error-container": "#F9DEDC",
  "on-primary": "#062E6F",
  "on-primary-container": "#D3E3FD",
  "on-secondary": "#003355",
  "on-secondary-container": "#C2E7FF",
  "on-success": "#0A3818",
  "on-success-container": "#C4EED0",
  "on-surface": "#E3E3E3",
  "on-surface-variant": "#C4C7C5",
  "on-tertiary": "#0A3818",
  "on-tertiary-container": "#C4EED0",
  "outline": "#8E918F",
  "outline-variant": "#444746",
  "primary": "#A8C7FA",
  "primary-container": "#0842A0",
  "primary-hover": "#C2D7FC",
  "secondary": "#7FCFFF",
  "secondary-container": "#004A77",
  "secondary-hover": "#A4DDFF",
  "success": "#6DD58C",
  "success-container": "#0F5223",
  "surface": "#131314",
  "surface-bright": "#37393B",
  "surface-container": "#1E1F20",
  "surface-container-high": "#282A2C",
  "surface-container-highest": "#333537",
  "surface-container-low": "#1B1B1B",
  "surface-container-lowest": "#0E0E0F",
  "surface-dim": "#131314",
  "surface-variant": "#444746",
  "tertiary": "#6DD58C",
  "tertiary-container": "#0F5223"
};

const THEME_1_2 = {
  "colors": {
    "error": "#DC2626",
    "error-container": "#FEF2F2",
    "inverse-on-surface": "#F8FAFC",
    "inverse-primary": "#A5B4FC",
    "inverse-surface": "#0F172A",
    "on-error": "#FFFFFF",
    "on-error-container": "#991B1B",
    "on-primary": "#FFFFFF",
    "on-primary-container": "#3730A3",
    "on-secondary": "#FFFFFF",
    "on-secondary-container": "#0F172A",
    "on-success": "#FFFFFF",
    "on-success-container": "#166534",
    "on-surface": "#0F172A",
    "on-surface-variant": "#475569",
    "on-tertiary": "#FFFFFF",
    "on-tertiary-container": "#134E4A",
    "on-warning": "#FFFFFF",
    "on-warning-container": "#92400E",
    "outline": "#CBD5E1",
    "outline-strong": "#828DA1",
    "outline-variant": "#E2E8F0",
    "primary": "#4F46E5",
    "primary-container": "#EEF2FF",
    "primary-hover": "#4338CA",
    "secondary": "#0F172A",
    "secondary-container": "#F1F5F9",
    "secondary-hover": "#1E293B",
    "success": "#15803D",
    "success-container": "#F0FDF4",
    "surface": "#FFFFFF",
    "surface-bright": "#FFFFFF",
    "surface-container": "#F1F5F9",
    "surface-container-high": "#E9EEF5",
    "surface-container-highest": "#E2E8F0",
    "surface-container-low": "#F8FAFC",
    "surface-container-lowest": "#FFFFFF",
    "surface-dim": "#E2E8F0",
    "surface-variant": "#F1F5F9",
    "tertiary": "#0F766E",
    "tertiary-container": "#CCFBF1",
    "warning": "#B45309",
    "warning-container": "#FFFBEB"
  },
  "fonts": {
    "body": "Inter, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif",
    "heading": "Inter, ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif",
    "mono": "\"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, monospace"
  },
  "radii": {
    "extra-large": "20px",
    "extra-small": "4px",
    "full": "9999px",
    "large": "14px",
    "lg": "14px",
    "md": "10px",
    "medium": "10px",
    "none": "0px",
    "sm": "6px",
    "small": "6px",
    "xl": "20px"
  },
  "shadows": {
    "level0": "none",
    "level1": "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
    "level2": "0 1px 3px 0 rgba(15, 23, 42, 0.07), 0 1px 2px -1px rgba(15, 23, 42, 0.05)",
    "level3": "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)",
    "level4": "0 12px 28px -6px rgba(15, 23, 42, 0.12), 0 4px 8px -4px rgba(15, 23, 42, 0.06)",
    "level5": "0 24px 56px -12px rgba(15, 23, 42, 0.22), 0 8px 16px -8px rgba(15, 23, 42, 0.08)"
  },
  "spacing": {
    "2xl": "48px",
    "3xl": "64px",
    "4xl": "96px",
    "lg": "24px",
    "md": "16px",
    "sm": "8px",
    "xl": "32px",
    "xs": "4px"
  }
} as const;

const MIDNIGHT_COLORS_1_2: Record<string, string> = {
  "error": "#F87171",
  "error-container": "#3B1214",
  "inverse-on-surface": "#0F172A",
  "inverse-primary": "#4F46E5",
  "inverse-surface": "#F1F5F9",
  "on-error": "#450A0A",
  "on-error-container": "#FECACA",
  "on-primary": "#0F0F23",
  "on-primary-container": "#C7D2FE",
  "on-secondary": "#0B0E14",
  "on-secondary-container": "#E2E8F0",
  "on-success": "#052E16",
  "on-success-container": "#BBF7D0",
  "on-surface": "#F1F5F9",
  "on-surface-variant": "#94A3B8",
  "on-tertiary": "#042F2E",
  "on-tertiary-container": "#CCFBF1",
  "on-warning": "#451A03",
  "on-warning-container": "#FDE68A",
  "outline": "#2E3644",
  "outline-strong": "#64708A",
  "outline-variant": "#1F2632",
  "primary": "#818CF8",
  "primary-container": "#1E1B4B",
  "primary-hover": "#A5B4FC",
  "secondary": "#F1F5F9",
  "secondary-container": "#1C222D",
  "secondary-hover": "#FFFFFF",
  "success": "#4ADE80",
  "success-container": "#0F2E1C",
  "surface": "#0B0E14",
  "surface-bright": "#252C38",
  "surface-container": "#151A23",
  "surface-container-high": "#1C222D",
  "surface-container-highest": "#252C38",
  "surface-container-low": "#10141C",
  "surface-container-lowest": "#07090D",
  "surface-dim": "#07090D",
  "surface-variant": "#1C222D",
  "tertiary": "#2DD4BF",
  "tertiary-container": "#134E4A",
  "warning": "#FBBF24",
  "warning-container": "#3A2A0A"
};

function sameRecord(a: unknown, b: Record<string, string>): boolean {
  if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
  const ka = Object.keys(a as Record<string, unknown>);
  const kb = Object.keys(b);
  return ka.length === kb.length && kb.every((k) => (a as Record<string, unknown>)[k] === b[k]);
}

/** Replaces each token group ONLY when it still equals the legacy default exactly (user edits are kept). */
function upgradeLegacyTheme(tokens: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!tokens) return tokens;
  const next = { ...tokens };
  if (sameRecord(next.colors, LEGACY_THEME_1_1.colors)) next.colors = { ...THEME_1_2.colors };
  else if (sameRecord(next.colors, LEGACY_DARK_COLORS_1_1)) next.colors = { ...MIDNIGHT_COLORS_1_2 };
  if (sameRecord(next.fonts, LEGACY_THEME_1_1.fonts)) next.fonts = { ...THEME_1_2.fonts };
  if (sameRecord(next.radii, LEGACY_THEME_1_1.radii)) next.radii = { ...THEME_1_2.radii };
  if (sameRecord(next.shadows, LEGACY_THEME_1_1.shadows)) next.shadows = { ...THEME_1_2.shadows };
  if (sameRecord(next.spacing, LEGACY_THEME_1_1.spacing)) next.spacing = { ...THEME_1_2.spacing };
  return next;
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
  },
  {
    fromVersion: '1.1.0',
    toVersion: '1.2.0',
    description: 'Upgrade untouched legacy default theme tokens (Google blue / Roboto) to the current default theme.',
    migrate: (data) => {
      const next = structuredClone(data);
      next.tokens = upgradeLegacyTheme(next.tokens as Record<string, unknown> | undefined);
      next.schemaVersion = '1.2.0';
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
