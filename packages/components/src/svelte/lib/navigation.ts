/**
 * Navigation intent for components that navigate programmatically (e.g. after a form submit).
 *
 * A cancelable, bubbling `appviz:navigate` CustomEvent is dispatched from `origin`. Hosts that
 * own navigation (the studio canvas) call `preventDefault()` and route it themselves; when
 * nobody cancels it (an exported app) the browser navigates to the sanitized href.
 */
import { safeHref } from './href.js';

export const NAVIGATE_EVENT = 'appviz:navigate';

export interface NavigateEventDetail {
  href: string;
}

export function requestNavigation(origin: Element, href: string): void {
  const target = safeHref(href);
  const event = new CustomEvent<NavigateEventDetail>(NAVIGATE_EVENT, {
    bubbles: true,
    cancelable: true,
    detail: { href: target }
  });
  const proceed = origin.dispatchEvent(event);
  if (proceed && target !== '#') window.location.assign(target);
}
