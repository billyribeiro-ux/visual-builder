import { z } from 'zod';

export const InteractionTriggerSchema = z.enum([
  'click',
  'hover',
  'change',
  'submit',
  'load'
]);
export type InteractionTrigger = z.infer<typeof InteractionTriggerSchema>;

export const ActionTypeSchema = z.enum([
  'navigate',
  'open_modal',
  'close_modal',
  'toggle_state',
  'show_toast',
  'submit_mock_form',
  'scroll_to',
  'set_tab'
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const InteractionActionSchema = z.object({
  type: ActionTypeSchema,
  payload: z.record(z.string(), z.any()).default({})
});
export type InteractionAction = z.infer<typeof InteractionActionSchema>;

export const InteractionRuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().default('Interaction'),
  sourceNodeId: z.string().uuid(),
  trigger: InteractionTriggerSchema,
  action: InteractionActionSchema,
  guard: z.string().optional()
});
export type InteractionRule = z.infer<typeof InteractionRuleSchema>;
