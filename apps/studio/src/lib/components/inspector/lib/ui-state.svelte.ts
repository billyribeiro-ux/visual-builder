/**
 * Inspector UI state that must survive tab switches and re-selection (but not reloads).
 * Exported as a mutated (never reassigned) state object, per Svelte's module-state rules.
 */
export type InspectorTab = 'content' | 'style' | 'advanced';
/** Which style bucket family is edited: the shared base, or the previewed device only. */
export type StyleScope = 'all' | 'device';
export type StyleState = 'normal' | 'hover' | 'focus' | 'active';

export const inspectorUi = $state<{ tab: InspectorTab; scope: StyleScope; state: StyleState }>({
  tab: 'content',
  scope: 'all',
  state: 'normal'
});
