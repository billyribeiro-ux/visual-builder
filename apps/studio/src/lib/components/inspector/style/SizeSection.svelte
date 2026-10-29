<script lang="ts">
  import ArrowCounterClockwiseIcon from 'phosphor-svelte/lib/ArrowCounterClockwiseIcon';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import StyleField from '../controls/StyleField.svelte';
  import StyleSelect from '../controls/StyleSelect.svelte';
  import InlineMessage from '../controls/InlineMessage.svelte';
  import { getStyleTarget } from '../lib/style-target.svelte.js';

  const s = getStyleTarget();
  const uid = $props.id();

  const KEYS = ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight', 'overflow', 'aspectRatio', 'objectFit'] as const;
  const modified = $derived(s.anySet(KEYS));

  const SIZE_KEYWORDS = ['auto', 'fit-content', 'min-content', 'max-content'];
  const UNITS = ['px', '%', 'rem', 'em', 'vw', 'vh'];

  const ROWS = [
    { label: 'Size', w: 'width', h: 'height', keywords: SIZE_KEYWORDS },
    { label: 'Min', w: 'minWidth', h: 'minHeight', keywords: ['auto'] },
    { label: 'Max', w: 'maxWidth', h: 'maxHeight', keywords: ['none'] }
  ] as const;

  const OVERFLOW = [
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'clip', label: 'Clip' },
    { value: 'auto', label: 'Scroll when needed' },
    { value: 'scroll', label: 'Always scroll' }
  ];

  const RATIOS = [
    { value: '1 / 1', label: 'Square · 1:1' },
    { value: '4 / 3', label: 'Standard · 4:3' },
    { value: '3 / 2', label: 'Photo · 3:2' },
    { value: '16 / 9', label: 'Widescreen · 16:9' },
    { value: '21 / 9', label: 'Ultrawide · 21:9' },
    { value: '3 / 4', label: 'Portrait · 3:4' },
    { value: '9 / 16', label: 'Story · 9:16' }
  ];

  const FIT = [
    { value: 'fill', label: 'Fill (stretch)' },
    { value: 'contain', label: 'Contain' },
    { value: 'cover', label: 'Cover' },
    { value: 'none', label: 'None' },
    { value: 'scale-down', label: 'Scale down' }
  ];

  const ratio = $derived(s.get('aspectRatio'));
  const ratioInherited = $derived(s.inheritedOf('aspectRatio'));
  let customRatio = $state(false);
  const showCustomRatio = $derived(customRatio || (ratio !== '' && !RATIOS.some((r) => r.value === ratio)));
  let ratioDraft = $state<string | null>(null);
  let ratioError = $state('');

  function commitRatio(text: string) {
    const t = text.trim().replace(/\s*[:/]\s*/, ' / ');
    if (t && !/^\d*\.?\d+( \/ \d*\.?\d+)?$/.test(t) && t !== 'auto') {
      ratioError = 'Use a ratio like 16 / 9, a number like 1.5, or auto.';
      return;
    }
    ratioError = '';
    ratioDraft = null;
    s.set('aspectRatio', t);
  }
</script>

<PanelSection id="style-size" title="Size" {modified}>
  {#snippet actions()}
    {#if modified}
      <IconButton label="Reset size" icon={ArrowCounterClockwiseIcon} size="sm" iconSize={13} onclick={() => s.reset(KEYS)} />
    {/if}
  {/snippet}

  {#each ROWS as row (row.label)}
    <StyleField label={row.label} keys={[row.w, row.h]}>
      <div class="pair">
        <LengthInput
          value={s.get(row.w)}
          placeholder={s.inheritedOf(row.w) || '—'}
          ariaLabel="{row.label === 'Size' ? '' : `${row.label} `}width"
          scrub="W"
          min={0}
          units={UNITS}
          keywords={[...row.keywords]}
          onchange={(v) => s.set(row.w, v)}
        />
        <LengthInput
          value={s.get(row.h)}
          placeholder={s.inheritedOf(row.h) || '—'}
          ariaLabel="{row.label === 'Size' ? '' : `${row.label} `}height"
          scrub="H"
          min={0}
          units={UNITS}
          keywords={[...row.keywords]}
          onchange={(v) => s.set(row.h, v)}
        />
      </div>
    </StyleField>
  {/each}

  <StyleSelect prop="overflow" label="Overflow" options={OVERFLOW} />

  <StyleField label="Aspect ratio" keys={['aspectRatio']} for="{uid}-ratio">
    <select
      id="{uid}-ratio"
      class="sx-select"
      value={showCustomRatio ? '__custom' : ratio}
      onchange={(e) => {
        const v = e.currentTarget.value;
        if (v === '__custom') {
          customRatio = true;
          return;
        }
        customRatio = false;
        ratioError = '';
        s.set('aspectRatio', v);
      }}
    >
      <option value="">{ratioInherited ? `Inherited · ${ratioInherited}` : 'Auto'}</option>
      {#each RATIOS as r (r.value)}<option value={r.value}>{r.label}</option>{/each}
      <option value="__custom">Custom…</option>
    </select>
  </StyleField>
  {#if showCustomRatio}
    <StyleField label="Custom ratio" keys={['aspectRatio']} for="{uid}-ratio-custom">
      <input
        id="{uid}-ratio-custom"
        class={['sx-input', 'sx-input--mono', ratioError && 'is-invalid']}
        placeholder="e.g. 5 / 4"
        spellcheck="false"
        aria-invalid={ratioError ? 'true' : undefined}
        aria-describedby={ratioError ? `${uid}-ratio-error` : undefined}
        value={ratioDraft ?? ratio}
        oninput={(e) => (ratioDraft = e.currentTarget.value)}
        onchange={(e) => commitRatio(e.currentTarget.value)}
      />
    </StyleField>
    {#if ratioError}<InlineMessage id="{uid}-ratio-error" message={ratioError} indent />{/if}
  {/if}

  <StyleSelect prop="objectFit" label="Object fit" options={FIT} help="Applies to images and video." />
</PanelSection>

<style>
  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .is-invalid {
    border-color: var(--sx-danger);
  }
</style>
