<script lang="ts">
  import type { Component } from 'svelte';
  import type { BlueprintNode, InteractionRule } from '@app-viz/schema';
  import ArrowSquareInIcon from 'phosphor-svelte/lib/ArrowSquareInIcon';
  import AppWindowIcon from 'phosphor-svelte/lib/AppWindowIcon';
  import SidebarSimpleIcon from 'phosphor-svelte/lib/SidebarSimpleIcon';
  import ChatTeardropTextIcon from 'phosphor-svelte/lib/ChatTeardropTextIcon';
  import ToggleRightIcon from 'phosphor-svelte/lib/ToggleRightIcon';
  import PaperPlaneTiltIcon from 'phosphor-svelte/lib/PaperPlaneTiltIcon';
  import QuestionIcon from 'phosphor-svelte/lib/QuestionIcon';
  import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimpleIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import PlayIcon from 'phosphor-svelte/lib/PlayIcon';
  import ArrowLineDownIcon from 'phosphor-svelte/lib/ArrowLineDownIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Field from '../../../ui/Field.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import AutoTextarea from '../controls/AutoTextarea.svelte';
  import InlineMessage from '../controls/InlineMessage.svelte';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const uid = $props.id();

  /** Actions the preview runtime executes for click rules (aliases normalize onto these). */
  type Action = 'navigate' | 'scrollTo' | 'openModal' | 'toggleDrawer' | 'showToast' | 'setState' | 'submitForm';
  const ALIASES: Record<string, Action> = {
    navigate: 'navigate',
    openModal: 'openModal',
    open_modal: 'openModal',
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

  const ACTIONS: Record<Action, { label: string; icon: Component<{ size?: number | string }>; fields: string[] }> = {
    navigate: { label: 'Go to page', icon: ArrowSquareInIcon, fields: ['path'] },
    scrollTo: { label: 'Scroll to section', icon: ArrowLineDownIcon, fields: ['anchor'] },
    openModal: { label: 'Open modal', icon: AppWindowIcon, fields: ['modalTitle', 'modalBody', 'modalCta'] },
    toggleDrawer: { label: 'Toggle drawer', icon: SidebarSimpleIcon, fields: ['drawerTitle', 'drawerBody'] },
    showToast: { label: 'Show toast', icon: ChatTeardropTextIcon, fields: ['toastMessage'] },
    setState: { label: 'Set state', icon: ToggleRightIcon, fields: ['stateKey', 'stateValue'] },
    submitForm: { label: 'Submit form', icon: PaperPlaneTiltIcon, fields: ['toastMessage'] }
  };
  const ACTION_ORDER: Action[] = ['navigate', 'scrollTo', 'openModal', 'toggleDrawer', 'showToast', 'setState', 'submitForm'];

  const isClick = (r: InteractionRule) => r.trigger === 'onClick' || r.trigger === 'click';
  const rawAction = (r: InteractionRule) => String(r.actionType ?? r.action?.type ?? 'navigate');
  const actionOf = (r: InteractionRule): Action | null => ALIASES[rawAction(r)] ?? null;
  const payloadOf = (r: InteractionRule): Record<string, string> =>
    Object.fromEntries(Object.entries(r.payload ?? r.action?.payload ?? {}).map(([k, v]) => [k, String(v ?? '')]));

  const rules = $derived(node.interactions ?? []);
  const clickRules = $derived(rules.filter(isClick));
  let editingId = $state<string | null>(null);
  let drafts = $state<Record<string, string>>({});

  const pages = $derived(editor.blueprint.pages);

  /** CSS IDs ("anchors") available on the current page and its layout, in tree order. */
  const anchors = $derived.by(() => {
    const out: Array<{ id: string; name: string }> = [];
    const walk = (n: BlueprintNode | undefined) => {
      if (!n) return;
      if (n.htmlId && !out.some((a) => a.id === n.htmlId)) out.push({ id: n.htmlId, name: n.name });
      n.children?.forEach(walk);
    };
    walk(editor.activeLayout?.rootNode);
    walk(editor.activePage?.rootNode);
    return out;
  });

  function summary(r: InteractionRule): string {
    const a = actionOf(r);
    const p = payloadOf(r);
    switch (a) {
      case 'navigate': {
        const path = p.path || p.targetPath || '';
        const page = pages.find((pg) => pg.path === path);
        return page ? `${page.title} (${path})` : path ? `${path} — no such page` : 'No page chosen';
      }
      case 'scrollTo': {
        const a = anchors.find((x) => x.id === p.anchor);
        return a ? `${a.name} (#${a.id})` : p.anchor ? `#${p.anchor} — no element has this CSS ID` : 'No section chosen';
      }
      case 'openModal':
        return p.modalTitle || 'Untitled modal';
      case 'toggleDrawer':
        return p.drawerTitle || 'Untitled drawer';
      case 'showToast':
        return p.toastMessage ? `“${p.toastMessage}”` : 'No message';
      case 'setState':
        return p.stateKey ? `${p.stateKey} = ${p.stateValue || '""'}` : 'No state key';
      case 'submitForm':
        return p.toastMessage || 'Default confirmation';
      default:
        return `“${rawAction(r)}” is not run by the preview or export`;
    }
  }

  function defaultsFor(action: Action): Record<string, string> {
    switch (action) {
      case 'navigate':
        return { path: pages.find((p) => p.id !== editor.activePageId)?.path ?? pages[0]?.path ?? '/' };
      case 'scrollTo':
        return { anchor: anchors[0]?.id ?? '' };
      case 'openModal':
        return { modalTitle: node.name, modalBody: '', modalCta: 'Confirm' };
      case 'toggleDrawer':
        return { drawerTitle: node.name, drawerBody: '' };
      case 'showToast':
      case 'submitForm':
        return { toastMessage: '' };
      case 'setState':
        return { stateKey: '', stateValue: '' };
    }
  }

  function write(next: InteractionRule[]) {
    editor.dispatch({ type: 'UPDATE_INTERACTIONS', nodeId: node.id, interactions: next }, { coalesce: false });
  }

  /** Stores a rule in the normalized shape the runtime reads (trigger + actionType + payload). */
  function saveRule(rule: InteractionRule, action: Action, payload: Record<string, string>) {
    const kept = Object.fromEntries(Object.entries(payload).filter(([k]) => ACTIONS[action].fields.includes(k)));
    const normalized: InteractionRule = {
      id: rule.id,
      name: `${node.name} · ${ACTIONS[action].label}`,
      trigger: 'onClick',
      actionType: action,
      payload: kept
    };
    write(rules.map((r) => (r.id === rule.id ? normalized : r)));
  }

  function addRule() {
    const action: Action = 'navigate';
    const rule: InteractionRule = {
      id: crypto.randomUUID(),
      name: `${node.name} · ${ACTIONS[action].label}`,
      trigger: 'onClick',
      actionType: action,
      payload: defaultsFor(action)
    };
    write([...rules, rule]);
    editingId = rule.id;
    drafts = {};
  }

  function removeRule(id: string) {
    if (editingId === id) editingId = null;
    write(rules.filter((r) => r.id !== id));
  }

  function changeAction(rule: InteractionRule, action: Action) {
    drafts = {};
    saveRule(rule, action, { ...defaultsFor(action), ...payloadOf(rule) });
  }

  function commitField(rule: InteractionRule, field: string) {
    const value = drafts[field];
    if (value === undefined) return;
    const { [field]: _, ...rest } = drafts;
    drafts = rest;
    const action = actionOf(rule);
    if (action) saveRule(rule, action, { ...payloadOf(rule), [field]: value });
  }

  function fieldError(rule: InteractionRule, field: string): string {
    const p = payloadOf(rule);
    const v = drafts[field] ?? p[field] ?? '';
    if (field === 'toastMessage' && actionOf(rule) === 'showToast' && !v.trim()) return 'Add the message to show.';
    if (field === 'stateKey') {
      if (!v.trim()) return 'A state key is required.';
      if (!/^[A-Za-z_][\w-]*$/.test(v.trim())) return 'Use letters, numbers, - and _ (start with a letter).';
    }
    if (field === 'modalTitle' && !v.trim()) return 'A modal needs a title.';
    return '';
  }

  const FIELD_LABELS: Record<string, string> = {
    modalTitle: 'Title',
    modalBody: 'Body',
    modalCta: 'Button label',
    drawerTitle: 'Title',
    drawerBody: 'Body',
    toastMessage: 'Message',
    stateKey: 'State key',
    stateValue: 'Value'
  };
  const MULTILINE = new Set(['modalBody', 'drawerBody']);
  const MONO = new Set(['stateKey', 'stateValue']);
</script>

<PanelSection id="adv-interactions" title="Interactions" modified={rules.length > 0}>
  {#if rules.length > 0}
    <ul class="ix">
      {#each rules as rule (rule.id)}
        {@const action = actionOf(rule)}
        {@const meta = action ? ACTIONS[action] : null}
        {@const Icon = meta?.icon ?? QuestionIcon}
        {@const supported = isClick(rule) && action !== null}
        {@const editing = editingId === rule.id && supported}
        <li class={['ix__rule', editing && 'ix__rule--open']}>
          <div class="ix__head">
            <span class={['ix__icon', !supported && 'ix__icon--muted']}><Icon size={15} /></span>
            <span class="ix__text">
              <span class="ix__title">
                {isClick(rule) ? 'On click' : `On ${rule.trigger.replace(/^on/, '').toLowerCase()}`} · {meta?.label ?? rawAction(rule)}
              </span>
              <span class="ix__summary">{summary(rule)}</span>
            </span>
            {#if supported}
              <IconButton
                label={editing ? 'Done editing' : 'Edit interaction'}
                icon={PencilSimpleIcon}
                size="sm"
                iconSize={13}
                active={editing}
                onclick={() => {
                  editingId = editing ? null : rule.id;
                  drafts = {};
                }}
              />
            {:else}
              <span class="sx-badge sx-badge--warning" title="Only click rules with a supported action run in the preview and export.">Not run</span>
            {/if}
            <IconButton label="Delete interaction" icon={TrashIcon} size="sm" iconSize={13} tone="danger" onclick={() => removeRule(rule.id)} />
          </div>

          {#if editing && action}
            <div class="ix__body">
              <Field label="Action" for="{uid}-{rule.id}-action">
                <select
                  id="{uid}-{rule.id}-action"
                  class="sx-select"
                  value={action}
                  onchange={(e) => changeAction(rule, e.currentTarget.value as Action)}
                >
                  {#each ACTION_ORDER as a (a)}<option value={a}>{ACTIONS[a].label}</option>{/each}
                </select>
              </Field>

              {#if action === 'scrollTo'}
                {@const anchor = payloadOf(rule).anchor || ''}
                <Field label="Section" for="{uid}-{rule.id}-anchor">
                  <select
                    id="{uid}-{rule.id}-anchor"
                    class="sx-select"
                    value={anchor}
                    onchange={(e) => saveRule(rule, action, { anchor: e.currentTarget.value })}
                  >
                    {#if !anchors.some((a) => a.id === anchor)}<option value={anchor}>{anchor ? `#${anchor}` : 'Choose a section…'}</option>{/if}
                    {#each anchors as a (a.id)}<option value={a.id}>#{a.id} · {a.name}</option>{/each}
                  </select>
                </Field>
                {#if anchors.length === 0}
                  <InlineMessage tone="warning" indent message="No element on this page has a CSS ID yet. Give the target section one in Advanced → Element." />
                {:else if anchor && !anchors.some((a) => a.id === anchor)}
                  <InlineMessage tone="warning" indent message="No element on this page uses “#{anchor}”." />
                {/if}
              {:else if action === 'navigate'}
                {@const path = payloadOf(rule).path || payloadOf(rule).targetPath || ''}
                <Field label="Page" for="{uid}-{rule.id}-path">
                  <select
                    id="{uid}-{rule.id}-path"
                    class="sx-select"
                    value={path}
                    onchange={(e) => saveRule(rule, action, { path: e.currentTarget.value })}
                  >
                    {#if !pages.some((p) => p.path === path)}<option value={path}>{path || 'Choose a page…'}</option>{/if}
                    {#each pages as p (p.id)}<option value={p.path}>{p.path} · {p.title}</option>{/each}
                  </select>
                </Field>
                {#if path && !pages.some((p) => p.path === path)}
                  <InlineMessage tone="warning" indent message="No page uses “{path}”." />
                {/if}
              {:else}
                {#each ACTIONS[action].fields as field (field)}
                  {@const fid = `${uid}-${rule.id}-${field}`}
                  {@const err = fieldError(rule, field)}
                  <Field label={FIELD_LABELS[field] ?? field} layout={MULTILINE.has(field) ? 'stack' : 'row'} for={fid}>
                    {#if MULTILINE.has(field)}
                      <div class="ix__area" onfocusout={() => commitField(rule, field)}>
                        <AutoTextarea
                          id={fid}
                          value={drafts[field] ?? payloadOf(rule)[field] ?? ''}
                          oninput={(v) => (drafts = { ...drafts, [field]: v })}
                        />
                      </div>
                    {:else}
                      <input
                        id={fid}
                        class={['sx-input', MONO.has(field) && 'sx-input--mono', err && 'is-invalid']}
                        aria-invalid={err ? 'true' : undefined}
                        spellcheck={MONO.has(field) ? 'false' : undefined}
                        value={drafts[field] ?? payloadOf(rule)[field] ?? ''}
                        placeholder={field === 'toastMessage' && action === 'submitForm' ? 'Form submitted successfully!' : ''}
                        oninput={(e) => (drafts = { ...drafts, [field]: e.currentTarget.value })}
                        onchange={() => commitField(rule, field)}
                      />
                    {/if}
                  </Field>
                  {#if err}<InlineMessage message={err} indent={!MULTILINE.has(field)} />{/if}
                {/each}
                {#if action === 'submitForm'}
                  <p class="sx-help">Shows a confirmation in the preview and the exported app. No data is sent — the build spec tells the implementing agent to wire a real endpoint.</p>
                {/if}
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {:else}
    <p class="ix__empty">No interactions. Add a click action to navigate, open a modal or drawer, show a toast, or change app state.</p>
  {/if}

  {#if clickRules.length > 1}
    <InlineMessage tone="warning" message="Only the first click rule runs. Delete the others." />
  {/if}

  <div class="ix__actions">
    <button type="button" class="sx-btn sx-btn--sm" disabled={clickRules.length > 0} onclick={addRule}>
      <PlusIcon size={13} weight="bold" /> Add click action
    </button>
    {#if clickRules.length > 0}
      <button type="button" class="sx-btn sx-btn--sm sx-btn--ghost" onclick={() => (editor.isInteractiveMode = true)}>
        <PlayIcon size={13} weight="fill" /> Test in preview
      </button>
    {/if}
  </div>
  {#if clickRules.length > 0}
    <p class="sx-help">One click action per element. Edit or delete the existing one to change it.</p>
  {/if}
</PanelSection>

<style>
  .ix {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .ix__rule {
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    background: var(--sx-panel);
  }
  .ix__rule--open {
    border-color: var(--sx-border-strong);
    box-shadow: var(--sx-shadow-sm);
  }
  .ix__head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 6px 8px 10px;
  }
  .ix__icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
    flex-shrink: 0;
  }
  .ix__icon--muted {
    color: var(--sx-text-3);
    background: var(--sx-hover);
  }
  .ix__text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .ix__title {
    font-size: var(--sx-text-md);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ix__summary {
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ix__body {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 10px 12px;
    border-top: 1px solid var(--sx-border);
  }
  .ix__area {
    width: 100%;
  }
  .ix__empty {
    padding: 12px;
    border: 1px dashed var(--sx-border-strong);
    border-radius: var(--sx-radius-md);
    font-size: var(--sx-text-sm);
    line-height: 1.5;
    color: var(--sx-text-2);
  }
  .ix__actions {
    display: flex;
    gap: 6px;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
</style>
