import type { MotionEffects } from '@app-viz/schema';

/**
 * Schema defaults for `motionEffects`, merged under a node's stored value (older blueprints
 * omit newer fields such as `entranceTrigger` / `scrollEffect`).
 */
export const MOTION_DEFAULTS: MotionEffects = {
  entranceAnimation: 'none',
  animationDuration: 'normal',
  entranceTrigger: 'scroll',
  scrollEffect: 'none',
  scrollIntensity: 'medium',
  hoverTransform: 'none',
  sticky: 'none',
  hideOnDesktop: false,
  hideOnTablet: false,
  hideOnMobile: false
};
