/**
 * Declarative interaction runtime contract shared by the canvas (interactive mode) and every
 * exported page. Rules are produced (and their payloads sanitized) by the builder; this module
 * only executes them — it never evaluates code.
 */
export type InteractionActionType =
  | 'navigate'
  | 'openModal'
  | 'closeModal'
  | 'toggleDrawer'
  | 'showToast'
  | 'setState'
  | 'submitForm'
  | 'scrollTo';

export interface InteractionRuntimeRule {
  /** Node whose element (or any descendant) triggers the rule on click. */
  nodeId: string;
  actionType: InteractionActionType;
  /** String-only payload; URL-like keys were sanitized by the builder. */
  payload: Record<string, string>;
}

/** Finds the rule of the nearest ancestor node (innermost first) of a click target. */
export function findRuleForTarget(
  target: EventTarget | null,
  rules: readonly InteractionRuntimeRule[]
): InteractionRuntimeRule | null {
  if (rules.length === 0 || !(target instanceof Element)) return null;
  let el: Element | null = target.closest('[data-node-id]');
  while (el) {
    const nodeId = el.getAttribute('data-node-id');
    const rule = rules.find((r) => r.nodeId === nodeId);
    if (rule) return rule;
    el = el.parentElement?.closest('[data-node-id]') ?? null;
  }
  return null;
}
