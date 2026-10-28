import type {
  ResponsiveStyle,
  BreakpointKey,
  CSSProperties,
  BlueprintNode
} from '@app-viz/schema';

/**
 * Responsive cascade contract (shared by the canvas, the SvelteKit export and the build spec):
 *
 *   base     applies at every width
 *   tablet   applies at <= 1023px  (tablet AND mobile — Elementor-style, desktop-first)
 *   mobile   applies at <= 767px   (wins over tablet)
 *   desktop  applies at >= 1024px
 *   wide     applies at >= 1280px  (wins over desktop)
 *
 * Device visibility toggles (hideOnMobile/Tablet/Desktop) are exact ranges, not cascades.
 */
export const BREAKPOINT_MEDIA = {
  tablet: '(max-width: 1023px)',
  mobile: '(max-width: 767px)',
  desktop: '(min-width: 1024px)',
  wide: '(min-width: 1280px)'
} as const;

export const VISIBILITY_MEDIA = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)'
} as const;

/** Which override buckets apply (in order) when previewing a given breakpoint. */
export const BREAKPOINT_CASCADE: Record<BreakpointKey, BreakpointKey[]> = {
  mobile: ['tablet', 'mobile'],
  tablet: ['tablet'],
  desktop: ['desktop'],
  wide: ['desktop', 'wide']
};

/**
 * Resolves effective CSS styles for a node given the active breakpoint and an optional
 * engaged state variant (hover, focus, active). See the cascade contract above.
 */
export function resolveEffectiveStyles(
  style: ResponsiveStyle | undefined,
  activeBreakpoint: BreakpointKey = 'desktop',
  activeState?: 'hover' | 'focus' | 'active'
): CSSProperties {
  if (!style) return {};
  const result: CSSProperties = { ...(style.base || {}) };

  for (const bp of BREAKPOINT_CASCADE[activeBreakpoint] ?? []) {
    const bpStyles = style[bp];
    if (bpStyles) Object.assign(result, bpStyles);
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
  const hideMobile: string[] = [];
  const hideTablet: string[] = [];
  const hideDesktop: string[] = [];
  const stateRules: string[] = [];
  const customCssBlocks: string[] = [];
  let hasEntranceAnimations = false;

  const durationMap: Record<string, string> = {
    fast: '220ms',
    normal: '460ms',
    slow: '760ms'
  };

  function walk(node: BlueprintNode | undefined) {
    if (!node || node.hidden) return;
    const s = node.styles;
    const m = node.motionEffects;
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

    // Elementor Pro Motion Effects, Sticky & Device Visibility
    if (m) {
      if (m.sticky === 'top') {
        baseRules.push(`${sel} { position: sticky !important; top: 0 !important; z-index: 45 !important; }`);
      } else if (m.sticky === 'bottom') {
        baseRules.push(`${sel} { position: sticky !important; bottom: 0 !important; z-index: 45 !important; }`);
      }

      if (m.entranceAnimation && m.entranceAnimation !== 'none') {
        hasEntranceAnimations = true;
        const dur = durationMap[m.animationDuration || 'normal'] || '460ms';
        baseRules.push(
          `${sel} { animation: el-${m.entranceAnimation} ${dur} cubic-bezier(0.2, 0, 0, 1) both; }`
        );
      }

      if (m.hoverTransform && m.hoverTransform !== 'none' && options.includeStates !== false) {
        baseRules.push(`${sel} { transition: transform 220ms cubic-bezier(0.2, 0, 0, 1), box-shadow 220ms cubic-bezier(0.2, 0, 0, 1); }`);
        if (m.hoverTransform === 'lift') {
          stateRules.push(`${sel}:hover { transform: translateY(-5px) !important; box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14) !important; }`);
        } else if (m.hoverTransform === 'scale') {
          stateRules.push(`${sel}:hover { transform: scale(1.02) !important; }`);
        } else if (m.hoverTransform === 'glow') {
          stateRules.push(`${sel}:hover { box-shadow: 0 0 0 2px var(--md-sys-color-primary, #0B57D0), 0 10px 28px rgba(11, 87, 208, 0.22) !important; }`);
        } else if (m.hoverTransform === 'tilt') {
          stateRules.push(`${sel}:hover { transform: perspective(800px) rotateX(2deg) translateY(-3px) !important; }`);
        }
      }

      if (options.includeMediaQueries !== false) {
        if (m.hideOnMobile) hideMobile.push(`  ${sel} { display: none !important; }`);
        if (m.hideOnTablet) hideTablet.push(`  ${sel} { display: none !important; }`);
        if (m.hideOnDesktop) hideDesktop.push(`  ${sel} { display: none !important; }`);
      }
    }

    // Elementor Pro Scoped Custom CSS (`selector { ... }`)
    if (node.customCss && node.customCss.trim()) {
      const scopedCustom = node.customCss
        .trim()
        .replace(/\bselector\b/g, sel);
      customCssBlocks.push(scopedCustom);
    }

    for (const child of node.children || []) {
      walk(child);
    }
  }

  for (const r of roots) {
    walk(r);
  }

  const blocks: string[] = [];

  // Elementor V4 Global Atomic Utility Classes
  blocks.push(
    `.el-glass { background: rgba(255, 255, 255, 0.72) !important; backdrop-filter: blur(16px); border: 1px solid rgba(11, 87, 208, 0.16) !important; }`,
    `.el-gradient-border { border: 2px solid var(--md-sys-color-primary, #0B57D0) !important; border-radius: 16px !important; }`,
    `.el-shadow-float { box-shadow: 0 16px 36px rgba(0, 0, 0, 0.12) !important; }`,
    `.el-surface-tint { background-color: var(--md-sys-color-primary-container, #D3E3FD) !important; color: var(--md-sys-color-on-primary-container, #041E49) !important; }`,
    `.el-border-glow { box-shadow: 0 0 0 1px var(--md-sys-color-primary, #0B57D0), 0 8px 24px rgba(11, 87, 208, 0.15) !important; }`
  );

  if (hasEntranceAnimations) {
    blocks.push(
      `@keyframes el-fadeIn { from { opacity: 0; } to { opacity: 1; } }`,
      `@keyframes el-fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`,
      `@keyframes el-fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }`,
      `@keyframes el-zoomIn { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }`,
      `@keyframes el-slideInLeft { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }`,
      `@keyframes el-slideInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }`
    );
  }

  if (baseRules.length > 0) blocks.push(...baseRules);
  // Order matters: tablet before mobile, desktop before wide (later wins at equal specificity).
  const media = (query: string, rules: string[]) => {
    if (rules.length > 0) blocks.push(`@media ${query} {\n${rules.join('\n')}\n}`);
  };
  media(BREAKPOINT_MEDIA.tablet, tabletRules);
  media(BREAKPOINT_MEDIA.mobile, mobileRules);
  media(BREAKPOINT_MEDIA.desktop, desktopRules);
  media(BREAKPOINT_MEDIA.wide, wideRules);
  media(VISIBILITY_MEDIA.mobile, hideMobile);
  media(VISIBILITY_MEDIA.tablet, hideTablet);
  media(VISIBILITY_MEDIA.desktop, hideDesktop);
  if (stateRules.length > 0) {
    blocks.push(...stateRules);
  }
  if (customCssBlocks.length > 0) {
    blocks.push(...customCssBlocks);
  }

  return blocks.join('\n');
}
