import type { ResponsiveStyle, BreakpointKey, CSSProperties } from '@app-viz/schema';

const BREAKPOINT_ORDER: BreakpointKey[] = ['mobile', 'tablet', 'desktop', 'wide'];

/**
 * Resolves effective CSS styles for a node given the active breakpoint
 * and whether a state variant (hover, focus, active) is engaged.
 * Implements standard mobile-first cascading overrides.
 */
export function resolveEffectiveStyles(
  style: ResponsiveStyle,
  activeBreakpoint: BreakpointKey = 'desktop',
  activeState?: 'hover' | 'focus' | 'active'
): CSSProperties {
  const result: CSSProperties = { ...(style.base || {}) };

  const targetIndex = BREAKPOINT_ORDER.indexOf(activeBreakpoint);

  // Cascade up to active breakpoint
  for (let i = 0; i <= targetIndex; i++) {
    const bp = BREAKPOINT_ORDER[i];
    const bpStyles = style[bp];
    if (bpStyles) {
      Object.assign(result, bpStyles);
    }
  }

  // Apply state variant override if requested
  if (activeState && style[activeState]) {
    Object.assign(result, style[activeState]);
  }

  return result;
}

/**
 * Serializes CSSProperties into an inline style string or style declaration object
 */
export function cssPropertiesToString(props: CSSProperties): string {
  return Object.entries(props)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => {
      const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebab}: ${val};`;
    })
    .join(' ');
}
