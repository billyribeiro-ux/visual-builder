<script lang="ts">
  import BracketsCurlyIcon from 'phosphor-svelte/lib/BracketsCurlyIcon';
  import ListBulletsIcon from 'phosphor-svelte/lib/ListBulletsIcon';
  import Field from '../../../ui/Field.svelte';
  import Toggle from '../../../ui/Toggle.svelte';
  import Segmented from '../../../ui/Segmented.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import ColorField from '../../../ui/ColorField.svelte';
  import { tooltip } from '../../../ui/tooltip.js';
  import { editor } from '../../../state/editor.svelte.js';
  import AutoTextarea from './AutoTextarea.svelte';
  import LinkPicker from './LinkPicker.svelte';
  import AssetPicker from './AssetPicker.svelte';
  import IconPicker from './IconPicker.svelte';
  import StringList from './StringList.svelte';
  import Repeater from './Repeater.svelte';
  import JsonField from './JsonField.svelte';
  import NumberList from './NumberList.svelte';
  import InlineMessage from './InlineMessage.svelte';
  import { colorSwatches } from '../lib/swatches.js';
  import { singularize, type PropSpec } from '../lib/prop-schema.js';

  interface Props {
    spec: PropSpec;
    value: unknown;
    onchange: (value: unknown) => void;
    /** Column names for matrix props (e.g. a data table's `columns`). */
    columns?: readonly string[];
    depth?: number;
  }

  let { spec, value, onchange, columns, depth = 0 }: Props = $props();

  const id = $props.id();
  let jsonMode = $state(false);
  let numberError = $state('');

  const isList = $derived(
    spec.kind === 'objectList' || spec.kind === 'stringList' || spec.kind === 'numberList' || spec.kind === 'matrix'
  );
  const listLength = $derived(Array.isArray(value) ? value.length : 0);

  /**
   * Settings (enums, toggles, numbers, colors) show when they differ from the component default;
   * free content and list items don't — edited copy is the normal state, not an override.
   */
  const tracksDefault = $derived(
    depth === 0 &&
      (spec.kind === 'enum' || spec.kind === 'boolean' || spec.kind === 'boolOrText' || spec.kind === 'number' || spec.kind === 'color')
  );
  const modified = $derived(
    tracksDefault && spec.hasDefault && value !== undefined && JSON.stringify(value) !== JSON.stringify(spec.defaultValue ?? null)
  );
  function reset() {
    onchange(spec.defaultValue === undefined ? undefined : structuredClone(spec.defaultValue));
  }

  /** Row layout only when the label fits the 92px label column. */
  const labelFits = $derived(spec.label.length <= 13);

  /** Enum as segmented when the options fit (repeater bodies are ~24px narrower), else a select. */
  const enumLayout = $derived.by<'row' | 'stack' | 'select'>(() => {
    const opts = spec.options ?? [];
    if (opts.length === 0 || opts.length > 4) return 'select';
    const width = opts.reduce((w, o) => w + o.label.length * 6.6 + 18, 4 + (opts.length - 1) * 2);
    const rowWidth = depth > 0 ? 150 : 176;
    const stackWidth = depth > 0 ? 250 : 276;
    if (width <= rowWidth && labelFits) return 'row';
    if (width <= stackWidth) return 'stack';
    return 'select';
  });

  /** boolean | string unions (e.g. comparison table cells: a check, a cross, or text). */
  const BOOL_TEXT_OPTIONS = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    { value: 'text', label: 'Text' }
  ] as const;
  let boolTextMode = $state<'yes' | 'no' | 'text' | null>(null);
  const boolTextValue = $derived(boolTextMode ?? (value === true ? 'yes' : value === false || value === undefined ? 'no' : 'text'));

  const text = $derived(value === undefined || value === null ? '' : String(value));
  /** Enums/toggles render the schema default when the prop was never set. */
  const enumValue = $derived(value === undefined && spec.defaultValue !== undefined ? String(spec.defaultValue) : text);
  const placeholder = $derived(
    value === undefined && typeof spec.defaultValue === 'string' && spec.defaultValue ? spec.defaultValue : undefined
  );

  function commitNumber(raw: string) {
    const t = raw.trim();
    if (t === '') {
      numberError = spec.hasDefault ? '' : 'Enter a number.';
      if (spec.hasDefault) reset();
      return;
    }
    let n = Number(t);
    if (!Number.isFinite(n)) {
      numberError = `“${t}” is not a number.`;
      return;
    }
    if (spec.int) n = Math.round(n);
    if (spec.min !== undefined && n < spec.min) n = spec.min;
    if (spec.max !== undefined && n > spec.max) n = spec.max;
    numberError = '';
    onchange(n);
  }
</script>

{#snippet listAdornment()}
  <span class="sx-badge pf__count">{listLength}</span>
  <button
    type="button"
    class="pf__mode"
    aria-pressed={jsonMode}
    aria-label={jsonMode ? 'Edit as a list' : 'Edit as JSON'}
    {@attach tooltip(jsonMode ? 'Edit as a list' : 'Edit as JSON')}
    onclick={() => (jsonMode = !jsonMode)}
  >
    {#if jsonMode}<ListBulletsIcon size={13} />{:else}<BracketsCurlyIcon size={13} />{/if}
  </button>
{/snippet}

{#if spec.kind === 'boolean'}
  <div class="pf__toggle">
    <span class={['pf__toggle-label', modified && 'pf__toggle-label--modified']} id="{id}-label">{spec.label}</span>
    <Toggle checked={Boolean(value ?? spec.defaultValue)} label={spec.label} onchange={(v) => onchange(v)} />
  </div>
  {#if spec.help}<p class="sx-help">{spec.help}</p>{/if}
{:else if spec.kind === 'enum'}
  {#if enumLayout === 'select'}
    <Field label={spec.label} layout={labelFits ? 'row' : 'stack'} for={id} help={spec.help} {modified} onreset={reset}>
      <select {id} class="sx-select" value={enumValue} onchange={(e) => onchange(e.currentTarget.value)}>
        {#if !spec.options?.some((o) => o.value === enumValue)}<option value={enumValue}>{enumValue || '—'}</option>{/if}
        {#each spec.options ?? [] as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
      </select>
    </Field>
  {:else}
    <Field label={spec.label} layout={enumLayout === 'row' ? 'row' : 'stack'} help={spec.help} {modified} onreset={reset}>
      <Segmented options={spec.options ?? []} value={enumValue} block ariaLabel={spec.label} onchange={(v) => onchange(v)} />
    </Field>
  {/if}
{:else if spec.kind === 'boolOrText'}
  <Field label={spec.label} layout={labelFits ? 'row' : 'stack'} help={spec.help} {modified} onreset={reset}>
    <Segmented
      options={[...BOOL_TEXT_OPTIONS]}
      value={boolTextValue}
      block
      ariaLabel={spec.label}
      onchange={(v) => {
        boolTextMode = v;
        if (v !== 'text') onchange(v === 'yes');
        else if (typeof value !== 'string') onchange('');
      }}
    />
  </Field>
  {#if boolTextValue === 'text'}
    <input
      class={['sx-input', labelFits && 'pf__indent-input']}
      aria-label="{spec.label} text"
      value={typeof value === 'string' ? value : ''}
      oninput={(e) => onchange(e.currentTarget.value)}
    />
  {/if}
{:else if spec.kind === 'numberOrText'}
  <Field label={spec.label} layout="stack" for={id} help={spec.help ?? 'A number or text.'} {modified} onreset={reset}>
    <input
      {id}
      class="sx-input"
      value={text}
      oninput={(e) => {
        const t = e.currentTarget.value;
        onchange(t.trim() !== '' && Number.isFinite(Number(t)) ? Number(t) : t);
      }}
    />
  </Field>
{:else if spec.kind === 'number'}
  <Field label={spec.label} layout={labelFits ? 'row' : 'stack'} help={spec.help} {modified} onreset={reset}>
    <LengthInput
      value={typeof value === 'number' ? value : text}
      placeholder={spec.defaultValue !== undefined ? String(spec.defaultValue) : '—'}
      ariaLabel={spec.label}
      unitless
      suffix={spec.unit}
      min={spec.min}
      max={spec.max}
      step={spec.step ?? 1}
      onchange={commitNumber}
    />
  </Field>
  {#if numberError}<InlineMessage message={numberError} indent={labelFits} />{/if}
  {#if spec.min !== undefined && spec.max !== undefined && !numberError}
    <p class={['sx-help', labelFits && 'pf__indent']}>Between {spec.min} and {spec.max}.</p>
  {/if}
{:else if spec.kind === 'color'}
  <Field label={spec.label} layout={labelFits ? 'row' : 'stack'} help={spec.help} {modified} onreset={reset}>
    <ColorField value={text} ariaLabel={spec.label} swatches={colorSwatches(editor.blueprint.tokens?.colors)} onchange={(v) => onchange(v)} />
  </Field>
{:else if isList && !jsonMode}
  <Field label={spec.label} layout="stack" help={spec.help} {modified} onreset={reset} adornment={listAdornment}>
    {#if spec.kind === 'numberList'}
      <NumberList
        values={Array.isArray(value) ? value.filter((v): v is number => typeof v === 'number') : []}
        ariaLabel={spec.label}
        onchange={(next) => onchange(next)}
      />
    {:else if spec.kind === 'stringList'}
      <StringList
        items={Array.isArray(value) ? value.map((v) => String(v ?? '')) : []}
        noun={singularize(spec.label)}
        onchange={(next) => onchange(next)}
      />
    {:else}
      <Repeater items={Array.isArray(value) ? value : []} {spec} {columns} {depth} onchange={(next) => onchange(next)} />
    {/if}
  </Field>
{:else if isList || spec.kind === 'json'}
  <Field label={spec.label} layout="stack" for={id} help={spec.help} {modified} onreset={reset} adornment={isList ? listAdornment : undefined}>
    <JsonField {id} value={value ?? (isList ? [] : {})} ariaLabel="{spec.label} (JSON)" expectArray={isList} onchange={(v) => onchange(v)} />
  </Field>
{:else}
  <Field label={spec.label} layout="stack" for={spec.kind === 'link' ? undefined : id} help={spec.help} {modified} onreset={reset}>
    {#if spec.kind === 'textarea'}
      <AutoTextarea {id} value={text} {placeholder} oninput={(v) => onchange(v)} />
    {:else if spec.kind === 'link'}
      <LinkPicker {id} value={text} label={spec.label} onchange={(v) => onchange(v)} />
    {:else if spec.kind === 'asset'}
      <AssetPicker {id} value={text} label={spec.label} onchange={(v) => onchange(v)} />
    {:else if spec.kind === 'icon'}
      <IconPicker {id} value={text} label={spec.label} onchange={(v) => onchange(v)} />
    {:else if spec.kind === 'code'}
      <AutoTextarea {id} value={text} mono minRows={4} oninput={(v) => onchange(v)} />
    {:else if spec.kind === 'date'}
      <input {id} class="sx-input" type="date" value={text} onchange={(e) => onchange(e.currentTarget.value)} />
    {:else}
      <input {id} class="sx-input" type="text" value={text} {placeholder} oninput={(e) => onchange(e.currentTarget.value)} />
    {/if}
  </Field>
{/if}

<style>
  .pf__toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: var(--sx-control-h);
  }
  .pf__toggle-label {
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .pf__toggle-label--modified {
    color: var(--sx-accent-text);
  }
  .pf__count {
    height: 16px;
    padding: 0 5px;
    font-variant-numeric: tabular-nums;
  }
  .pf__mode {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    margin-left: auto;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-3);
  }
  .pf__mode:hover,
  .pf__mode[aria-pressed='true'] {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .pf__indent {
    padding-left: 100px;
    margin-top: -4px;
  }
  .pf__indent-input {
    width: calc(100% - 100px);
    margin: -4px 0 0 100px;
  }
</style>
