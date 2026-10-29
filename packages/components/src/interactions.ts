import type { BlueprintNode, InteractionRule } from '@app-viz/schema';
import { sanitizeUrl } from './svelte/lib/href.js';
import type { InteractionActionType, InteractionRuntimeRule } from './svelte/lib/interactions.js';

/** Blueprint action names (current + legacy snake_case) → runtime action. Unlisted actions are not executed. */
const ACTION_MAP: Record<string, InteractionActionType> = {
  navigate: 'navigate',
  openModal: 'openModal',
  open_modal: 'openModal',
  close_modal: 'closeModal',
  toggleDrawer: 'toggleDrawer',
  showToast: 'showToast',
  show_toast: 'showToast',
  setState: 'setState',
  toggle_state: 'setState',
  submitForm: 'submitForm',
  submit_mock_form: 'submitForm',
  scrollTo: 'scrollTo',
  scroll_to: 'scrollTo'
};

const MAX_PAYLOAD_STRING = 2000;

/** URL-like payload keys are sanitized with the site URL policy; other values become bounded strings. */
export function sanitizeInteractionPayload(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)) continue;
    if (key === 'path' || key === 'targetPath' || /href$/i.test(key) || /url$/i.test(key)) {
      out[key] = sanitizeUrl(value, '#') || '#';
    } else if (typeof value === 'string') {
      out[key] = value.slice(0, MAX_PAYLOAD_STRING);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = String(value);
    }
  }
  return out;
}

function isClickRule(rule: InteractionRule): boolean {
  return rule.trigger === 'onClick' || rule.trigger === 'click';
}

function toRuntimeRule(nodeId: string, rule: InteractionRule): InteractionRuntimeRule | null {
  if (!isClickRule(rule)) return null;
  const action = ACTION_MAP[String(rule.actionType || rule.action?.type || 'navigate')];
  if (!action) return null;
  return {
    nodeId: String(nodeId).replace(/[^A-Za-z0-9_-]/g, ''),
    actionType: action,
    payload: sanitizeInteractionPayload(rule.payload || rule.action?.payload || {})
  };
}

/**
 * Collects the executable click rules of every visible node: node-level `interactions` plus
 * project-level rules whose `sourceNodeId` is a visible node of these trees. Layout slots are
 * resolved by the caller passing both trees. Deterministic order (tree order; a node's own rules
 * before its project-level rules).
 */
export function collectInteractionRules(
  roots: ReadonlyArray<BlueprintNode | undefined | null>,
  projectRules: ReadonlyArray<InteractionRule> = []
): InteractionRuntimeRule[] {
  const out: InteractionRuntimeRule[] = [];
  const walk = (node: BlueprintNode | undefined | null) => {
    if (!node || node.hidden) return;
    for (const rule of node.interactions ?? []) {
      const runtime = toRuntimeRule(node.id, rule);
      if (runtime) out.push(runtime);
    }
    for (const rule of projectRules) {
      if (rule.sourceNodeId !== node.id) continue;
      const runtime = toRuntimeRule(node.id, rule);
      if (runtime) out.push(runtime);
    }
    for (const child of node.children ?? []) walk(child);
  };
  for (const root of roots) walk(root);
  return out;
}
