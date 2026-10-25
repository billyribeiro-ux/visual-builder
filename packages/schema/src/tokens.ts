import { z } from 'zod';

export const BreakpointKeySchema = z.enum(['mobile', 'tablet', 'desktop', 'wide']);
export type BreakpointKey = z.infer<typeof BreakpointKeySchema>;

export const DesignTokensSchema = z.object({
  colors: z.record(z.string(), z.string()).default({
    primary: '#2563EB',
    'primary-hover': '#1D4ED8',
    'primary-foreground': '#FFFFFF',
    secondary: '#475569',
    'secondary-hover': '#334155',
    'secondary-foreground': '#F8FAFC',
    background: '#FFFFFF',
    foreground: '#0F172A',
    muted: '#F1F5F9',
    'muted-foreground': '#64748B',
    accent: '#F8FAFC',
    'accent-foreground': '#0F172A',
    card: '#FFFFFF',
    'card-foreground': '#0F172A',
    border: '#E2E8F0',
    ring: '#2563EB',
    destructive: '#EF4444',
    'destructive-foreground': '#FFFFFF',
    success: '#10B981',
    'success-foreground': '#FFFFFF'
  }),
  fonts: z.object({
    heading: z.string().default('Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
    body: z.string().default('Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
    mono: z.string().default('ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace')
  }).default({
    heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  }),
  radii: z.record(z.string(), z.string()).default({
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px'
  }),
  shadows: z.record(z.string(), z.string()).default({
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }),
  spacing: z.record(z.string(), z.string()).default({
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  }),
  breakpoints: z.object({
    mobile: z.string().default('640px'),
    tablet: z.string().default('768px'),
    desktop: z.string().default('1024px'),
    wide: z.string().default('1280px')
  }).default({
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px'
  })
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;
