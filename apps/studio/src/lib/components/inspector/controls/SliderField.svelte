<script lang="ts">
  interface Props {
    /** Current value in display units (e.g. 0–100 for percent); null when unset. */
    value: number | null;
    /** Shown muted when `value` is null. */
    placeholder?: number | null;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
    ariaLabel: string;
    onchange: (value: number | null) => void;
    /** Called when a drag ends (pointer up / keyboard commit). */
    onend?: () => void;
  }

  let { value, placeholder = null, min = 0, max = 100, step = 1, suffix = '%', ariaLabel, onchange, onend }: Props = $props();

  let draft = $state<string | null>(null);
  const shown = $derived(value ?? placeholder ?? max);
  const pct = $derived(((shown - min) / (max - min)) * 100);

  function commitText(text: string) {
    draft = null;
    const t = text.replace(suffix, '').trim();
    if (t === '') {
      onchange(null);
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) return;
    onchange(Math.min(max, Math.max(min, n)));
  }
</script>

<div class={['slider', value === null && 'slider--unset']}>
  <input
    class="slider__range"
    type="range"
    {min}
    {max}
    {step}
    value={shown}
    aria-label={ariaLabel}
    style:--pct="{pct}%"
    oninput={(e) => onchange(Number(e.currentTarget.value))}
    onchange={() => onend?.()}
  />
  <div class="slider__num">
    <input
      type="text"
      inputmode="decimal"
      aria-label="{ariaLabel} value"
      value={draft ?? (value === null ? '' : String(value))}
      placeholder={placeholder === null ? '—' : String(placeholder)}
      oninput={(e) => (draft = e.currentTarget.value)}
      onblur={(e) => draft !== null && commitText(e.currentTarget.value)}
      onkeydown={(e) => {
        if (e.key === 'Enter') {
          commitText(e.currentTarget.value);
          e.currentTarget.blur();
        }
      }}
    />
    <span aria-hidden="true">{suffix}</span>
  </div>
</div>

<style>
  .slider {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }
  .slider__range {
    flex: 1;
    min-width: 0;
    height: 16px;
    margin: 0;
    appearance: none;
    background: transparent;
    cursor: pointer;
  }
  .slider__range::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(to right, var(--sx-accent) var(--pct), var(--sx-border-strong) var(--pct));
  }
  .slider--unset .slider__range::-webkit-slider-runnable-track {
    background: linear-gradient(to right, var(--sx-text-3) var(--pct), var(--sx-border) var(--pct));
  }
  .slider__range::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -5px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid var(--sx-border-strong);
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.2);
  }
  .slider__range::-moz-range-track {
    height: 4px;
    border-radius: 999px;
    background: var(--sx-border-strong);
  }
  .slider__range::-moz-range-progress {
    height: 4px;
    border-radius: 999px;
    background: var(--sx-accent);
  }
  .slider__range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid var(--sx-border-strong);
  }
  .slider__range:focus-visible {
    outline: none;
  }
  .slider__range:focus-visible::-webkit-slider-thumb {
    box-shadow: var(--sx-focus);
  }
  .slider__num {
    position: relative;
    display: flex;
    align-items: center;
    width: 60px;
    height: var(--sx-control-h);
    flex-shrink: 0;
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
  }
  .slider__num:focus-within {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .slider__num input {
    width: 100%;
    min-width: 0;
    height: 100%;
    padding: 0 18px 0 8px;
    font-size: var(--sx-text-md);
    font-variant-numeric: tabular-nums;
    background: transparent;
    border: 0;
    outline: none;
    color: var(--sx-text);
  }
  .slider__num input::placeholder {
    color: var(--sx-text-3);
  }
  .slider__num span {
    position: absolute;
    right: 7px;
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    pointer-events: none;
  }
</style>
