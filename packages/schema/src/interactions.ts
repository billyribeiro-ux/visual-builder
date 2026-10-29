import { z } from 'zod';

export const InteractionTriggerSchema = z.enum([
  'onClick',
  'onHover',
  'onSubmit',
  'onLoad',
  'click',
  'hover',
  'change',
  'submit',
  'load'
]);
export type InteractionTrigger = z.infer<typeof InteractionTriggerSchema>;

export const ActionTypeSchema = z.enum([
  'navigate',
  'openModal',
  'toggleDrawer',
  'showToast',
  'setState',
  'submitForm',
  'open_modal',
  'close_modal',
  'toggle_state',
  'show_toast',
  'submit_mock_form',
  'scroll_to',
  'scrollTo',
  'set_tab'
]);
export type ActionType = z.infer<typeof ActionTypeSchema>;

export const InteractionActionSchema = z.object({
  type: ActionTypeSchema,
  payload: z.record(z.string(), z.any()).default({})
});
export type InteractionAction = z.infer<typeof InteractionActionSchema>;

export const InteractionRuleSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  sourceNodeId: z.string().optional(),
  trigger: InteractionTriggerSchema.default('onClick'),
  actionType: ActionTypeSchema.optional(),
  payload: z.record(z.string(), z.any()).optional(),
  action: InteractionActionSchema.optional(),
  guard: z.string().optional()
});
export type InteractionRule = z.infer<typeof InteractionRuleSchema>;

