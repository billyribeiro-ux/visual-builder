import { z } from 'zod';

export const BreakpointKeySchema = z.enum(['compact', 'medium', 'expanded', 'large', 'extra-large', 'mobile', 'tablet', 'desktop', 'wide']);
export type BreakpointKey = z.infer<typeof BreakpointKeySchema>;

/**
 * Google Material Design 3 (MD3) Design Tokens Specification (as of Oct 25, 2026)
 * Implements M3 Color Roles, Typography Scale, Elevation Levels, and Shape Corners.
 */
export const DesignTokensSchema = z.object({
  // MD3 Color System Roles
  colors: z.record(z.string(), z.string()).default({
    // Primary
    primary: '#005FB0',
    'on-primary': '#FFFFFF',
    'primary-container': '#D5E3FF',
    'on-primary-container': '#001C3B',
    'primary-hover': '#004C8F',

    // Secondary
    secondary: '#555F71',
    'on-secondary': '#FFFFFF',
    'secondary-container': '#D9E3F8',
    'on-secondary-container': '#121C2B',
    'secondary-hover': '#434B5A',

    // Tertiary
    tertiary: '#6E5676',
    'on-tertiary': '#FFFFFF',
    'tertiary-container': '#F8D8FE',
    'on-tertiary-container': '#281330',

    // Surface & Background
    surface: '#FDFBFF',
    'on-surface': '#1A1C1E',
    'surface-dim': '#D9D9E0',
    'surface-bright': '#FDFBFF',
    'surface-variant': '#E0E2EC',
    'on-surface-variant': '#44474F',
    'surface-container-lowest': '#FFFFFF',
    'surface-container-low': '#F7F9FF',
    'surface-container': '#F1F4FA',
    'surface-container-high': '#EBEFF5',
    'surface-container-highest': '#E5E9EF',

    // Outline & Borders
    outline: '#74777F',
    'outline-variant': '#C4C6D0',

    // Error & Destructive
    error: '#BA1A1A',
    'on-error': '#FFFFFF',
    'error-container': '#FFDAD6',
    'on-error-container': '#410002',

    // Success
    success: '#146C2E',
    'on-success': '#FFFFFF',
    'success-container': '#A3F5AA',
    'on-success-container': '#002107'
  }),

  // MD3 Typography Scale (Roboto / Roboto Flex standard)
  fonts: z.object({
    heading: z.string().default('Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
    body: z.string().default('Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
    mono: z.string().default('"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
  }).default({
    heading: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
    md: '8px',
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
