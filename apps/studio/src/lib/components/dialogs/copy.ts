/**
 * Display copy for registry / schema data that still carries legacy marketing names.
 * The data layer is untouched (keys, ids and exported code keep their values); only what the
 * studio chrome shows is neutralised here, so the UI never says "Google", "MD3" or "Elementor".
 */
import type { PageTemplateKey } from '@app-viz/schema';

const BRAND_PATTERNS: Array<[RegExp, string]> = [
  [/\bGoogle\s+Material\s+Design\s*3\b/gi, ''],
  [/\bMaterial\s+Design\s*3\b/gi, ''],
  [/\bGoogle\s+MD3\b/gi, ''],
  [/\bvanilla-md3\b/gi, 'vanilla CSS'],
  [/\bMD3\b/g, ''],
  [/\bGoogle\b/g, ''],
  [/\bElementor(\s+Pro)?\b/gi, '']
];

/** Strips legacy brand words from a display string and tidies the leftover whitespace. */
export function neutralize(text: string | undefined | null): string {
  let out = String(text ?? '');
  for (const [re, rep] of BRAND_PATTERNS) out = out.replace(re, rep);
  return out
    .replace(/\(\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/\(\s+/g, '(')
    .trim();
}

/** Short labels for the page-template picker. Descriptions come from the schema catalog. */
export const PAGE_TEMPLATE_LABELS: Record<PageTemplateKey, string> = {
  blank: 'Blank page',
  'saas-landing': 'SaaS landing',
  features: 'Product features',
  pricing: 'Pricing',
  dashboard: 'Analytics dashboard',
  'auth-contact': 'Sign-in & contact'
};

/**
 * Label + description for a page template. The description is always the catalog's
 * (`PAGE_TEMPLATE_CATALOG` in @app-viz/schema), which lists exactly what the template builds.
 */
export function pageTemplateCopy(key: string, fallbackLabel: string, catalogDescription: string) {
  const label = (PAGE_TEMPLATE_LABELS as Record<string, string>)[key];
  return { label: label ?? neutralize(fallbackLabel), description: neutralize(catalogDescription) };
}

export function themePresetName(key: string, label: string): string {
  return neutralize(label) || key;
}

const PREFLIGHT_LABELS: Record<string, string> = {
  'schema-valid': 'Blueprint schema',
  'styling-policy': 'Styling policy',
  'route-integrity': 'Internal links',
  'a11y-landmarks': 'Page titles & landmarks',
  'export-determinism': 'Export readiness'
};

export function preflightLabel(id: string, label: string): string {
  return PREFLIGHT_LABELS[id] ?? neutralize(label);
}

/** "on-primary-container" -> "On primary container". */
export function humanizeKey(key: string): string {
  const words = key.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Registry display name without legacy brand prefixes ("MD3 Chip Badge" -> "Chip Badge"). */
export function componentLabel(displayName: string): string {
  return neutralize(displayName) || displayName;
}
