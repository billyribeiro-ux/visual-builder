<script lang="ts">
  import type { BlueprintNode } from '@app-viz/schema';
  import CopyIcon from 'phosphor-svelte/lib/CopyIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Field from '../../../ui/Field.svelte';
  import Toggle from '../../../ui/Toggle.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import { isValidHtmlId } from '@app-viz/schema';
  import ClassChips from '../controls/ClassChips.svelte';
  import AttributeRows from '../controls/AttributeRows.svelte';
  import InlineMessage from '../controls/InlineMessage.svelte';
  import { collectHtmlIds } from '../lib/html-ids.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const uid = $props.id();

  /** Utility classes compiled into every canvas/export stylesheet by the engine. */
  const UTILITIES = [
    { cls: 'el-glass', label: 'Frosted glass', description: 'Translucent surface with blur' },
    { cls: 'el-gradient-border', label: 'Accent border', description: '2px accent outline with 16px corners' },
    { cls: 'el-shadow-float', label: 'Floating shadow', description: 'Large, soft drop shadow' },
    { cls: 'el-surface-tint', label: 'Tinted surface', description: 'Accent container colors' },
    { cls: 'el-border-glow', label: 'Accent glow', description: 'Thin accent ring with a soft glow' }
  ];

  const classes = $derived((node.customClasses || '').split(/\s+/).filter(Boolean));

  let nameDraft = $state<string | null>(null);
  let nameError = $state('');
  let idDraft = $state<string | null>(null);
  let idError = $state('');

  const htmlId = $derived(node.htmlId ?? '');
  /** Same CSS ID on another element of this page (or its shared layout) breaks `#anchor` links. */
  const idClash = $derived.by(() => {
    if (!htmlId) return null;
    return collectHtmlIds(editor.activePage?.rootNode, editor.activeLayout?.rootNode).find((e) => e.id === htmlId && e.nodeId !== node.id) ?? null;
  });

  function commitId(text: string) {
    const t = text.trim().replace(/^#/, '');
    if (t && !isValidHtmlId(t)) {
      idError = 'Start with a letter; then letters, numbers, - or _ (max 64).';
      return;
    }
    idError = '';
    idDraft = null;
    if (t !== htmlId) setMeta({ htmlId: t || undefined });
  }

  function setMeta(meta: Partial<Pick<BlueprintNode, 'name' | 'locked' | 'hidden' | 'customClasses' | 'htmlId' | 'attributes'>>) {
    editor.dispatch({ type: 'UPDATE_NODE_META', nodeId: node.id, meta }, { coalesce: false });
  }

  function commitName(text: string) {
    const t = text.trim();
    if (!t) {
      nameError = 'A name is required.';
      return;
    }
    nameError = '';
    nameDraft = null;
    if (t !== node.name) setMeta({ name: t });
  }

  function toggleUtility(cls: string, on: boolean) {
    const next = on ? [...new Set([...classes, cls])] : classes.filter((c) => c !== cls);
    setMeta({ customClasses: next.join(' ') });
  }

  async function copyId() {
    try {
      await navigator.clipboard.writeText(node.id);
      editor.notify('success', 'Element ID copied.', 1600);
    } catch (e) {
      editor.notify('error', `Could not copy the ID: ${(e as Error).message}`);
    }
  }
</script>

<PanelSection id="adv-element" title="Element">
  <Field label="Name" for="{uid}-name">
    <input
      id="{uid}-name"
      class={['sx-input', nameError && 'is-invalid']}
      aria-invalid={nameError ? 'true' : undefined}
      value={nameDraft ?? node.name}
      oninput={(e) => (nameDraft = e.currentTarget.value)}
      onchange={(e) => commitName(e.currentTarget.value)}
    />
  </Field>
  {#if nameError}<InlineMessage message={nameError} indent />{/if}

  <Field label="CSS ID" for="{uid}-htmlid">
    <div class="el__hash">
      <span aria-hidden="true">#</span>
      <input
        id="{uid}-htmlid"
        class={['sx-input', 'sx-input--mono', idError && 'is-invalid']}
        aria-invalid={idError ? 'true' : undefined}
        placeholder="pricing"
        spellcheck="false"
        autocomplete="off"
        value={idDraft ?? htmlId}
        oninput={(e) => {
          idDraft = e.currentTarget.value;
          idError = '';
        }}
        onchange={(e) => commitId(e.currentTarget.value)}
      />
    </div>
  </Field>
  {#if idError}
    <InlineMessage message={idError} indent />
  {:else if idClash}
    <InlineMessage tone="warning" indent message="“{idClash.name}” also uses #{htmlId}; links jump to the first one." />
  {:else if htmlId}
    <p class="sx-help el__indent">Link to it with <code>#{htmlId}</code>.</p>
  {/if}

  <Field label="Node ID">
    <code class="el__id" title={node.id}>{node.id}</code>
    <IconButton label="Copy element ID" icon={CopyIcon} size="sm" iconSize={13} onclick={copyId} />
  </Field>

  <Field label="CSS classes" layout="stack" for="{uid}-classes">
    <ClassChips id="{uid}-classes" value={node.customClasses || ''} onchange={(v) => setMeta({ customClasses: v })} />
  </Field>

  <Field label="Attributes" layout="stack" help="Rendered on the element’s root, e.g. data-analytics or aria-label.">
    <AttributeRows attributes={node.attributes} onchange={(v) => setMeta({ attributes: v })} />
  </Field>

  <div class="el__utils" role="group" aria-labelledby="{uid}-utils">
    <p class="sx-label" id="{uid}-utils">Utility classes</p>
    {#each UTILITIES as u (u.cls)}
      {@const on = classes.includes(u.cls)}
      <div class={['el__util', on && 'el__util--on']}>
        <div class="el__util-text">
          <span class="el__util-label">{u.label} <code>.{u.cls}</code></span>
          <span class="el__util-desc">{u.description}</span>
        </div>
        <Toggle checked={on} label="{u.label} (.{u.cls})" onchange={(v) => toggleUtility(u.cls, v)} />
      </div>
    {/each}
  </div>

  <div class="el__flags">
    <div class="el__flag">
      <span>Locked</span>
      <Toggle checked={Boolean(node.locked)} label="Lock element" onchange={(v) => setMeta({ locked: v })} />
    </div>
    <div class="el__flag">
      <span>Hidden</span>
      <Toggle checked={Boolean(node.hidden)} label="Hide element" onchange={(v) => setMeta({ hidden: v })} />
    </div>
  </div>
</PanelSection>

<style>
  .el__id {
    flex: 1;
    min-width: 0;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el__utils {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .el__utils .sx-label {
    margin-bottom: 4px;
  }
  .el__util {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: var(--sx-radius-sm);
  }
  .el__util:hover {
    background: var(--sx-hover);
  }
  .el__util-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1;
    min-width: 0;
  }
  .el__util-label {
    font-size: var(--sx-text-md);
    font-weight: 500;
    color: var(--sx-text);
  }
  .el__util-label code {
    margin-left: 4px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-xs);
    font-weight: 400;
    color: var(--sx-text-3);
  }
  .el__util--on .el__util-label code {
    color: var(--sx-accent-text);
  }
  .el__util-desc {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .el__flags {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .el__flag {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 36px;
    padding: 0 10px;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text-2);
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
  .el__hash {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }
  .el__hash span {
    position: absolute;
    left: 8px;
    font-family: var(--sx-font-mono);
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    pointer-events: none;
  }
  .el__hash .sx-input {
    padding-left: 20px;
  }
  .el__indent {
    margin-top: -4px;
    padding-left: 100px;
  }
  .el__indent code {
    font-family: var(--sx-font-mono);
  }
</style>
