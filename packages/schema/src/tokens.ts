import { z } from 'zod';

export const BreakpointKeySchema = z.enum([
  'mobile',
  'tablet',
  'desktop',
  'wide'
]);
export type BreakpointKey = z.infer<typeof BreakpointKeySchema>;

export const DEFAULT_MD3_LIGHT_COLORS: Record<string, string> = {
  // Primary (Google MD3 Blue)
  primary: '#0B57D0',
  'on-primary': '#FFFFFF',
  'primary-container': '#D3E3FD',
  'on-primary-container': '#041E49',
  'primary-hover': '#0842A0',

  // Secondary
  secondary: '#00639B',
  'on-secondary': '#FFFFFF',
  'secondary-container': '#C2E7FF',
  'on-secondary-container': '#001D35',
  'secondary-hover': '#004A77',

  // Tertiary
  tertiary: '#146C2E',
  'on-tertiary': '#FFFFFF',
  'tertiary-container': '#C4EED0',
  'on-tertiary-container': '#072711',

  // Surface & Background
  surface: '#FAF9FD',
  'on-surface': '#1B1B1F',
  'surface-dim': '#DBD9DD',
  'surface-bright': '#FAF9FD',
  'surface-variant': '#E1E2EC',
  'on-surface-variant': '#44474E',
  'surface-container-lowest': '#FFFFFF',
  'surface-container-low': '#F4F3F7',
  'surface-container': '#EEEDF1',
  'surface-container-high': '#E8E7EC',
  'surface-container-highest': '#E3E2E6',

  // Outline & Borders
  outline: '#74777F',
  'outline-variant': '#C4C6D0',

  // Error & Destructive
  error: '#B3261E',
  'on-error': '#FFFFFF',
  'error-container': '#F9DEDC',
  'on-error-container': '#410E0B',

  // Success
  success: '#146C2E',
  'on-success': '#FFFFFF',
  'success-container': '#C4EED0',
  'on-success-container': '#072711'
};

export const DEFAULT_MD3_DARK_COLORS: Record<string, string> = {
  primary: '#A8C7FA',
  'on-primary': '#062E6F',
  'primary-container': '#0842A0',
  'on-primary-container': '#D3E3FD',
  'primary-hover': '#C2D7FC',

  secondary: '#7FCFFF',
  'on-secondary': '#003355',
  'secondary-container': '#004A77',
  'on-secondary-container': '#C2E7FF',
  'secondary-hover': '#A4DDFF',

  tertiary: '#6DD58C',
  'on-tertiary': '#0A3818',
  'tertiary-container': '#0F5223',
  'on-tertiary-container': '#C4EED0',

  surface: '#131314',
  'on-surface': '#E3E3E3',
  'surface-dim': '#131314',
  'surface-bright': '#37393B',
  'surface-variant': '#444746',
  'on-surface-variant': '#C4C7C5',
  'surface-container-lowest': '#0E0E0F',
  'surface-container-low': '#1B1B1B',
  'surface-container': '#1E1F20',
  'surface-container-high': '#282A2C',
  'surface-container-highest': '#333537',

  outline: '#8E918F',
  'outline-variant': '#444746',

  error: '#F2B8B5',
  'on-error': '#601410',
  'error-container': '#8C1D18',
  'on-error-container': '#F9DEDC',

  success: '#6DD58C',
  'on-success': '#0A3818',
  'success-container': '#0F5223',
  'on-success-container': '#C4EED0'
};

export const MD3_THEME_PRESETS: Record<string, { label: string; colors: Record<string, string> }> = {
  'google-blue-light': {
    label: 'Google MD3 Blue (Light)',
    colors: DEFAULT_MD3_LIGHT_COLORS
  },
  'google-blue-dark': {
    label: 'Google MD3 Blue (Dark)',
    colors: DEFAULT_MD3_DARK_COLORS
  },
  'emerald-light': {
    label: 'MD3 Emerald FinTech (Light)',
    colors: {
      ...DEFAULT_MD3_LIGHT_COLORS,
      primary: '#006C4C',
      'on-primary': '#FFFFFF',
      'primary-container': '#89F8C7',
      'on-primary-container': '#002114',
      'primary-hover': '#005138',
      secondary: '#4D6357',
      'secondary-container': '#CFE9D9',
      'on-secondary-container': '#092016'
    }
  },
  'violet-light': {
    label: 'MD3 AI Studio Violet (Light)',
    colors: {
      ...DEFAULT_MD3_LIGHT_COLORS,
      primary: '#6750A4',
      'on-primary': '#FFFFFF',
      'primary-container': '#EADDFF',
      'on-primary-container': '#21005D',
      'primary-hover': '#4F378B',
      secondary: '#625B71',
      'secondary-container': '#E8DEF8',
      'on-secondary-container': '#1D192B'
    }
  }
};

/**
 * Google Material Design 3 (MD3) Design Tokens Specification (as of Oct 25, 2026)
 * Implements M3 Color Roles, Typography Scale, Elevation Levels, and Shape Corners.
 */
export const DesignTokensSchema = z.object({
  // MD3 Color System Roles
  colors: z.record(z.string(), z.string()).default(DEFAULT_MD3_LIGHT_COLORS),

  // MD3 Typography Scale (Roboto / Roboto Flex standard)
  fonts: z.object({
    heading: z.string().default('Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'),
    body: z.string().default('Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'),
    mono: z.string().default('"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
  }).default({
    heading: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    body: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  }),

  // MD3 Shape Corner System
  radii: z.record(z.string(), z.string()).default({
    none: '0px',
    'extra-small': '4px',
    small: '8px',
    medium: '12px',
    large: '16px',
    'extra-large': '28px',
    full: '9999px',
    sm: '4px',
    md: '12px',
    lg: '16px',
    xl: '28px'
  }),

  // MD3 Elevation System (Shadow levels 0 to 5)
  shadows: z.record(z.string(), z.string()).default({
    level0: 'none',
    level1: '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
    level2: '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
    level3: '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
    level4: '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.30)',
    level5: '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.30)'
  }),

  // MD3 Grid Spacing
  spacing: z.record(z.string(), z.string()).default({
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px'
  }),

  // MD3 Responsive Window Size Classes
  breakpoints: z.object({
    compact: z.string().optional().default('600px'),
    medium: z.string().optional().default('840px'),
    expanded: z.string().optional().default('1200px'),
    mobile: z.string().default('600px'),
    tablet: z.string().default('840px'),
    desktop: z.string().default('1200px'),
    wide: z.string().default('1440px')
  }).default({
    compact: '600px',
    medium: '840px',
    expanded: '1200px',
    mobile: '600px',
    tablet: '840px',
    desktop: '1200px',
    wide: '1440px'
  })
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;
