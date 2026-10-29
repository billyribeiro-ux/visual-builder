import { z } from 'zod';

export const BreakpointKeySchema = z.enum([
  'mobile',
  'tablet',
  'desktop',
  'wide'
]);
export type BreakpointKey = z.infer<typeof BreakpointKeySchema>;

/*
 * Design tokens of the SITE output (canvas + export).
 *
 * Every key compiles to a CSS custom property on `.site-root`:
 *   colors.<role>     → --md-sys-color-<role>
 *   fonts.<slot>      → --md-sys-font-<slot>
 *   radii.<name>      → --md-sys-shape-corner-<name>
 *   shadows.<level>   → --md-sys-elevation-<level>
 *   spacing.<step>    → --md-sys-spacing-<step>
 *
 * The `md-sys-*` variable prefix and every role name are persisted in user blueprints and read
 * by the export, so names never change; values do. The defaults below are mirrored verbatim on
 * `:where(.site-root)` in `packages/components/src/svelte/runtime.css` (a test keeps them in sync).
 *
 * Contrast (WCAG 2.2): every preset keeps on-surface / on-surface-variant text >= 4.5:1 on all
 * surfaces, on-<role> >= 4.5:1 on its role and on its container, and `outline-strong` (form
 * control borders) >= 3:1 on the page surfaces. `outline` / `outline-variant` are decorative
 * dividers and card borders only.
 */

/** Neutral — the default light theme: slate neutrals with a confident indigo accent. */
export const DEFAULT_LIGHT_COLORS: Record<string, string> = {
  // Primary (indigo 600 — 6.3:1 with white text, 6.0:1 as text on the soft surface)
  primary: '#4F46E5',
  'on-primary': '#FFFFFF',
  'primary-container': '#EEF2FF',
  'on-primary-container': '#3730A3',
  'primary-hover': '#4338CA',

  // Secondary (near-black neutral: dark buttons, tonal chips use the container)
  secondary: '#0F172A',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#F1F5F9',
  'on-secondary-container': '#0F172A',
  'secondary-hover': '#1E293B',

  // Tertiary (teal accent for illustrations, tags and charts)
  tertiary: '#0F766E',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#CCFBF1',
  'on-tertiary-container': '#134E4A',

  // Surfaces
  surface: '#FFFFFF',
  'on-surface': '#0F172A',
  'surface-dim': '#E2E8F0',
  'surface-bright': '#FFFFFF',
  'surface-variant': '#F1F5F9',
  'on-surface-variant': '#475569',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#F8FAFC',
  'surface-container': '#F1F5F9',
  'surface-container-high': '#E9EEF5',
  'surface-container-highest': '#E2E8F0',

  // Outlines: decorative borders + an accessible form-control border (>= 3:1)
  outline: '#CBD5E1',
  'outline-variant': '#E2E8F0',
  'outline-strong': '#828DA1',

  // Inverse (dark bands, tooltips, toasts)
  'inverse-surface': '#0F172A',
  'inverse-on-surface': '#F8FAFC',
  'inverse-primary': '#A5B4FC',

  // Feedback
  error: '#DC2626',
  'on-error': '#FFFFFF',
  'error-container': '#FEF2F2',
  'on-error-container': '#991B1B',

  success: '#15803D',
  'on-success': '#FFFFFF',
  'success-container': '#F0FDF4',
  'on-success-container': '#166534',

  warning: '#B45309',
  'on-warning': '#FFFFFF',
  'warning-container': '#FFFBEB',
  'on-warning-container': '#92400E'
};

/** Midnight — dark theme: blue-black surfaces, soft indigo accent. */
export const DEFAULT_DARK_COLORS: Record<string, string> = {
  primary: '#818CF8',
  'on-primary': '#0F0F23',
  'primary-container': '#1E1B4B',
  'on-primary-container': '#C7D2FE',
  'primary-hover': '#A5B4FC',

  secondary: '#F1F5F9',
  'on-secondary': '#0B0E14',
  'secondary-container': '#1C222D',
  'on-secondary-container': '#E2E8F0',
  'secondary-hover': '#FFFFFF',

  tertiary: '#2DD4BF',
  'on-tertiary': '#042F2E',
  'tertiary-container': '#134E4A',
  'on-tertiary-container': '#CCFBF1',

  surface: '#0B0E14',
  'on-surface': '#F1F5F9',
  'surface-dim': '#07090D',
  'surface-bright': '#252C38',
  'surface-variant': '#1C222D',
  'on-surface-variant': '#94A3B8',
  'surface-container-lowest': '#07090D',
  'surface-container-low': '#10141C',
  'surface-container': '#151A23',
  'surface-container-high': '#1C222D',
  'surface-container-highest': '#252C38',

  outline: '#2E3644',
  'outline-variant': '#1F2632',
  'outline-strong': '#64708A',

  'inverse-surface': '#F1F5F9',
  'inverse-on-surface': '#0F172A',
  'inverse-primary': '#4F46E5',

  error: '#F87171',
  'on-error': '#450A0A',
  'error-container': '#3B1214',
  'on-error-container': '#FECACA',

  success: '#4ADE80',
  'on-success': '#052E16',
  'success-container': '#0F2E1C',
  'on-success-container': '#BBF7D0',

  warning: '#FBBF24',
  'on-warning': '#451A03',
  'warning-container': '#3A2A0A',
  'on-warning-container': '#FDE68A'
};

/** Emerald — fresh light theme: cool gray neutrals with an emerald accent. */
const EMERALD_COLORS: Record<string, string> = {
  ...DEFAULT_LIGHT_COLORS,
  primary: '#047857',
  'on-primary': '#FFFFFF',
  'primary-container': '#ECFDF5',
  'on-primary-container': '#065F46',
  'primary-hover': '#065F46',
  secondary: '#111827',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#F3F4F6',
  'on-secondary-container': '#111827',
  'secondary-hover': '#1F2937',
  tertiary: '#0369A1',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#E0F2FE',
  'on-tertiary-container': '#0C4A6E',
  'on-surface': '#111827',
  'surface-dim': '#E5E7EB',
  'surface-variant': '#F3F4F6',
  'on-surface-variant': '#4B5563',
  'surface-container-low': '#F9FAFB',
  'surface-container': '#F3F4F6',
  'surface-container-high': '#ECEEF1',
  'surface-container-highest': '#E5E7EB',
  outline: '#D1D5DB',
  'outline-variant': '#E5E7EB',
  'outline-strong': '#868D99',
  'inverse-surface': '#111827',
  'inverse-on-surface': '#F9FAFB',
  'inverse-primary': '#6EE7B7'
};

/** Violet — expressive light theme: slate neutrals with a violet accent and rose highlights. */
const VIOLET_COLORS: Record<string, string> = {
  ...DEFAULT_LIGHT_COLORS,
  primary: '#7C3AED',
  'on-primary': '#FFFFFF',
  'primary-container': '#F5F3FF',
  'on-primary-container': '#5B21B6',
  'primary-hover': '#6D28D9',
  tertiary: '#BE123C',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#FFE4E6',
  'on-tertiary-container': '#881337',
  'inverse-primary': '#C4B5FD'
};

/** Sunset — warm light theme: stone neutrals with a burnt-orange accent. */
const SUNSET_COLORS: Record<string, string> = {
  ...DEFAULT_LIGHT_COLORS,
  primary: '#C2410C',
  'on-primary': '#FFFFFF',
  'primary-container': '#FFF7ED',
  'on-primary-container': '#9A3412',
  'primary-hover': '#9A3412',
  secondary: '#1C1917',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#F5F5F4',
  'on-secondary-container': '#1C1917',
  'secondary-hover': '#292524',
  tertiary: '#BE123C',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#FFE4E6',
  'on-tertiary-container': '#881337',
  surface: '#FFFFFF',
  'on-surface': '#1C1917',
  'surface-dim': '#E7E5E4',
  'surface-bright': '#FFFFFF',
  'surface-variant': '#F5F5F4',
  'on-surface-variant': '#57534E',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#FAFAF9',
  'surface-container': '#F5F5F4',
  'surface-container-high': '#EFEDEB',
  'surface-container-highest': '#E7E5E4',
  outline: '#D6D3D1',
  'outline-variant': '#E7E5E4',
  'outline-strong': '#8F8983',
  'inverse-surface': '#1C1917',
  'inverse-on-surface': '#FAFAF9',
  'inverse-primary': '#FDBA74'
};

/** Graphite — monochrome light theme: zinc neutrals, near-black primary. */
const GRAPHITE_COLORS: Record<string, string> = {
  ...DEFAULT_LIGHT_COLORS,
  primary: '#18181B',
  'on-primary': '#FFFFFF',
  'primary-container': '#F4F4F5',
  'on-primary-container': '#18181B',
  'primary-hover': '#3F3F46',
  secondary: '#18181B',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#F4F4F5',
  'on-secondary-container': '#18181B',
  'secondary-hover': '#3F3F46',
  tertiary: '#52525B',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#E4E4E7',
  'on-tertiary-container': '#18181B',
  surface: '#FFFFFF',
  'on-surface': '#09090B',
  'surface-dim': '#E4E4E7',
  'surface-bright': '#FFFFFF',
  'surface-variant': '#F4F4F5',
  'on-surface-variant': '#52525B',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#FAFAFA',
  'surface-container': '#F4F4F5',
  'surface-container-high': '#EDEDEF',
  'surface-container-highest': '#E4E4E7',
  outline: '#D4D4D8',
  'outline-variant': '#E4E4E7',
  'outline-strong': '#8B8B94',
  'inverse-surface': '#18181B',
  'inverse-on-surface': '#FAFAFA',
  'inverse-primary': '#E4E4E7'
};

export interface ThemePreset {
  label: string;
  description?: string;
  colors: Record<string, string>;
}

/**
 * Color presets, keyed by stable ids. Applying a preset replaces `tokens.colors` with a complete
 * role map (presets are applied by value; the key itself is never persisted in a blueprint).
 */
export const THEME_PRESETS: Record<string, ThemePreset> = {
  neutral: {
    label: 'Neutral',
    description: 'Clean slate neutrals with an indigo accent.',
    colors: DEFAULT_LIGHT_COLORS
  },
  midnight: {
    label: 'Midnight',
    description: 'Dark blue-black surfaces with a soft indigo accent.',
    colors: DEFAULT_DARK_COLORS
  },
  emerald: {
    label: 'Emerald',
    description: 'Cool grays with a fresh emerald accent.',
    colors: EMERALD_COLORS
  },
  violet: {
    label: 'Violet',
    description: 'Slate neutrals with a violet accent and rose highlights.',
    colors: VIOLET_COLORS
  },
  sunset: {
    label: 'Sunset',
    description: 'Warm stone neutrals with a burnt-orange accent.',
    colors: SUNSET_COLORS
  },
  graphite: {
    label: 'Graphite',
    description: 'Monochrome zinc palette with a near-black primary.',
    colors: GRAPHITE_COLORS
  }
};

/**
 * Legacy preset ids (earlier releases and the prompt composer's `suggestedThemeId`). They keep
 * resolving through `THEME_PRESETS[id]` but are non-enumerable, so preset pickers that iterate
 * `Object.entries(THEME_PRESETS)` list each theme exactly once under its current id.
 */
export const LEGACY_THEME_PRESET_IDS: Readonly<Record<string, string>> = {
  'google-blue-light': 'neutral',
  'google-blue-dark': 'midnight',
  'emerald-light': 'emerald',
  'violet-light': 'violet'
};
for (const [legacyId, id] of Object.entries(LEGACY_THEME_PRESET_IDS)) {
  Object.defineProperty(THEME_PRESETS, legacyId, { value: THEME_PRESETS[id], enumerable: false, writable: false, configurable: false });
}

/** @deprecated Legacy export name kept for existing imports; same object as {@link DEFAULT_LIGHT_COLORS}. */
export const DEFAULT_MD3_LIGHT_COLORS = DEFAULT_LIGHT_COLORS;
/** @deprecated Legacy export name kept for existing imports; same object as {@link DEFAULT_DARK_COLORS}. */
export const DEFAULT_MD3_DARK_COLORS = DEFAULT_DARK_COLORS;
/** @deprecated Legacy export name kept for existing imports; same object as {@link THEME_PRESETS}. */
export const MD3_THEME_PRESETS = THEME_PRESETS;

/** Inter for headings and body (system stack fallback), JetBrains Mono for code. */
export const DEFAULT_FONTS = {
  heading: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  body: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
} as const;

/** Corner radii: 6 / 10 / 14 / 20 + full. Buttons and inputs use `medium`, cards `large`. */
export const DEFAULT_RADII: Record<string, string> = {
  none: '0px',
  'extra-small': '4px',
  small: '6px',
  medium: '10px',
  large: '14px',
  'extra-large': '20px',
  full: '9999px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px'
};

/** Soft, layered, slate-tinted shadows (level1 hairline → level5 floating). */
export const DEFAULT_SHADOWS: Record<string, string> = {
  level0: 'none',
  level1: '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
  level2: '0 1px 3px 0 rgba(15, 23, 42, 0.07), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
  level3: '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
  level4: '0 12px 28px -6px rgba(15, 23, 42, 0.12), 0 4px 8px -4px rgba(15, 23, 42, 0.06)',
  level5: '0 24px 56px -12px rgba(15, 23, 42, 0.22), 0 8px 16px -8px rgba(15, 23, 42, 0.08)'
};

/** 4px-based spacing scale. */
export const DEFAULT_SPACING: Record<string, string> = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
  '4xl': '96px'
};

/** Mirrors the breakpoints the node compiler and the components use. */
export const DEFAULT_BREAKPOINTS = {
  compact: '767px',
  medium: '1023px',
  expanded: '1024px',
  mobile: '767px',
  tablet: '1023px',
  desktop: '1024px',
  wide: '1440px'
} as const;

/**
 * Design tokens: color roles, typography families, corner radii, elevation, spacing and the
 * documented breakpoints (mobile <= 767px, tablet <= 1023px, desktop >= 1024px, wide >= 1440px).
 */
export const DesignTokensSchema = z.object({
  colors: z.record(z.string(), z.string()).default(DEFAULT_LIGHT_COLORS),

  fonts: z.object({
    heading: z.string().default(DEFAULT_FONTS.heading),
    body: z.string().default(DEFAULT_FONTS.body),
    mono: z.string().default(DEFAULT_FONTS.mono)
  }).prefault({}),

  radii: z.record(z.string(), z.string()).default(DEFAULT_RADII),

  shadows: z.record(z.string(), z.string()).default(DEFAULT_SHADOWS),

  spacing: z.record(z.string(), z.string()).default(DEFAULT_SPACING),

  breakpoints: z.object({
    compact: z.string().optional().default(DEFAULT_BREAKPOINTS.compact),
    medium: z.string().optional().default(DEFAULT_BREAKPOINTS.medium),
    expanded: z.string().optional().default(DEFAULT_BREAKPOINTS.expanded),
    mobile: z.string().default(DEFAULT_BREAKPOINTS.mobile),
    tablet: z.string().default(DEFAULT_BREAKPOINTS.tablet),
    desktop: z.string().default(DEFAULT_BREAKPOINTS.desktop),
    wide: z.string().default(DEFAULT_BREAKPOINTS.wide)
  }).prefault({})
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;
