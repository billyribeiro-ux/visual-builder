import type {
  ResponsiveStyle,
  BreakpointKey,
  CSSProperties,
  BlueprintNode
} from '@app-viz/schema';

const BREAKPOINT_ORDER: BreakpointKey[] = ['mobile', 'tablet', 'desktop', 'wide'];

/**
 * Resolves effective CSS styles for a node given the active breakpoint
 * and whether a state variant (hover, focus, active) is engaged.
 * Implements standard mobile-first cascading overrides.
 */
export function resolveEffectiveStyles(
  style: ResponsiveStyle | undefined,
  activeBreakpoint: BreakpointKey = 'desktop',
  activeState?: 'hover' | 'focus' | 'active'
): CSSProperties {
  if (!style) return {};
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
 * Serializes CSSProperties into an inline style string
 */
export function cssPropertiesToString(props: CSSProperties, important = false): string {
  const suffix = important ? ' !important' : '';
  return Object.entries(props)
    .filter(([_, val]) => val !== undefined && val !== null && val !== '')
    .map(([key, val]) => {
      const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebab}: ${val}${suffix};`;
    })
    .join(' ');
}

/**
 * Compiles responsive (@media) and interactive (:hover, :focus-visible, :active)
 * CSS rules for a tree of BlueprintNodes so exported SvelteKit 3 pages and live
 * preview canvases preserve 100% of responsive & stateful styling.
 */
export function compileNodeScopedCss(
  roots: (BlueprintNode | undefined)[],
  options: { includeMediaQueries?: boolean; includeStates?: boolean } = {
    includeMediaQueries: true,
    includeStates: true
  }
): string {
  const baseRules: string[] = [];
  const mobileRules: string[] = [];
  const tabletRules: string[] = [];
  const desktopRules: string[] = [];
  const wideRules: string[] = [];
  const stateRules: string[] = [];

  function walk(node: BlueprintNode | undefined) {
    if (!node || node.hidden) return;
    const s = node.styles;
    const sel = `[data-node-id="${node.id}"]`;

    if (s) {
      if (options.includeMediaQueries !== false) {
        if (s.mobile && Object.keys(s.mobile).length > 0) {
          const decl = cssPropertiesToString(s.mobile, true);
          if (decl) mobileRules.push(`  ${sel} { ${decl} }`);
        }
        if (s.tablet && Object.keys(s.tablet).length > 0) {
          const decl = cssPropertiesToString(s.tablet, true);
          if (decl) tabletRules.push(`  ${sel} { ${decl} }`);
        }
        if (s.desktop && Object.keys(s.desktop).length > 0) {
          const decl = cssPropertiesToString(s.desktop, true);
          if (decl) desktopRules.push(`  ${sel} { ${decl} }`);
        }
        if (s.wide && Object.keys(s.wide).length > 0) {
          const decl = cssPropertiesToString(s.wide, true);
          if (decl) wideRules.push(`  ${sel} { ${decl} }`);
        }
      }

      if (options.includeStates !== false) {
        if (s.hover && Object.keys(s.hover).length > 0) {
          const decl = cssPropertiesToString(s.hover, true);
          if (decl) {
            baseRules.push(`${sel} { transition: all 180ms cubic-bezier(0.2, 0, 0, 1); }`);
            stateRules.push(`${sel}:hover { ${decl} }`);
          }
        }
        if (s.focus && Object.keys(s.focus).length > 0) {
          const decl = cssPropertiesToString(s.focus, true);
          if (decl) stateRules.push(`${sel}:focus-visible, ${sel}:focus-within { ${decl} }`);
        }
        if (s.active && Object.keys(s.active).length > 0) {
          const decl = cssPropertiesToString(s.active, true);
          if (decl) stateRules.push(`${sel}:active { ${decl} }`);
        }
      }
    }

    for (const child of node.children || []) {
      walk(child);
    }
  }

  for (const r of roots) {
    walk(r);
  }

  const blocks: string[] = [];
  if (baseRules.length > 0) blocks.push(...baseRules);
  if (mobileRules.length > 0) {
    blocks.push(`@media (max-width: 767px) {\n${mobileRules.join('\n')}\n}`);
  }
  if (tabletRules.length > 0) {
    blocks.push(`@media (min-width: 768px) {\n${tabletRules.join('\n')}\n}`);
  }
  if (desktopRules.length > 0) {
    blocks.push(`@media (min-width: 1024px) {\n${desktopRules.join('\n')}\n}`);
  }
  if (wideRules.length > 0) {
    blocks.push(`@media (min-width: 1280px) {\n${wideRules.join('\n')}\n}`);
  }
  if (stateRules.length > 0) {
    blocks.push(...stateRules);
  }

  return blocks.join('\n');
}
