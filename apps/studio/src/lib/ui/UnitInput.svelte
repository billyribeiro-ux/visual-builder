<script lang="ts">
  /**
   * Design-system number + unit field for CSS lengths (studio-wide):
   * - an empty field shows the unit a typed number will get (the placeholder's unit, else the
   *   first unit) instead of a blank unit select;
   * - `''` may be listed in `units` for unitless values (line-height) without dropping explicit
   *   units such as `28px`;
   * - the unit column is sized to its content, so two fields fit side by side;
   * - `onend` fires when a drag, nudge or commit finishes (closes the undo step).
   */
  import type { Attachment } from 'svelte/attachments';

  interface Props {
    value: string | number | undefined | null;
    /** Committed CSS value; `''` means unset. */
    onchange: (value: string) => void;
    onend?: () => void;
    ariaLabel: string;
    id?: string;
    units?: string[];
    keywords?: string[];
    placeholder?: string;
    /** Short drag handle label shown inside the field (drag horizontally to scrub). */
    scrub?: string;
    min?: number;
    max?: number;
    step?: number;
    /** Plain numbers only (z-index, scale): no unit column, typed units are dropped. */
    unitless?: boolean;
    /** Static unit hint shown inside unitless fields (e.g. `ms`). */
    suffix?: string;
  }

  let {
    value,
    onchange,
    onend,
    ariaLabel,
    id,
    units = ['px', '%', 'rem', 'em', 'vw', 'vh'],
    keywords = [],
    placeholder = '—',
    scrub,
    min = -Infinity,
    max = Infinity,
    step = 1,
    unitless = false,
    suffix
  }: Props = $props();

  const NUM_RE = /^(-?\d*\.?\d+)\s*([a-z%]*)$/i;

  const raw = $derived(value == null ? '' : String(value).trim());
  const parsed = $derived.by(() => {
    const m = NUM_RE.exec(raw);
    return m ? { numeric: true, num: m[1], unit: m[2].toLowerCase() } : { numeric: false, num: '', unit: '' };
  });
  const placeholderUnit = $derived(NUM_RE.exec(placeholder.trim())?.[2]?.toLowerCase() ?? null);

  let draft = $state<string | null>(null);
  /** Unit picked while the field is still empty. */
  let unitPick = $state<string | null>(null);

  const isFreeForm = $derived(raw !== '' && !parsed.numeric);
  const fallbackUnit = $derived(
    unitPick ?? (placeholderUnit !== null && units.includes(placeholderUnit) ? placeholderUnit : (units[0] ?? ''))
  );
  /** A bare number in a field without a unitless option (e.g. `0` for a length) shows the default unit. */
  const unit = $derived(parsed.numeric && (parsed.unit !== '' || units.includes('')) ? parsed.unit : fallbackUnit);
  const unitOptions = $derived(unit !== '' && !units.includes(unit) ? [...units, unit] : units);
  const showUnits = $derived(!unitless && (unitOptions.length > 0 || keywords.length > 0));
  const unitWidth = $derived(Math.max(26, Math.min(48, Math.max(1, ...unitOptions.map((u) => u.length)) * 7 + 14)));

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const unitLabel = (u: string) => (u === '' ? '–' : u);

  function emit(numValue: number, u: string) {
    onchange(`${round(clamp(numValue))}${unitless ? '' : u}`);
  }

  function commitText(text: string) {
    draft = null;
    const t = text.trim();
    if (t === '') {
      onchange('');
    } else if (keywords.includes(t.toLowerCase())) {
      onchange(t.toLowerCase());
    } else {
      const m = NUM_RE.exec(t);
      if (m) emit(Number(m[1]), m[2] ? m[2].toLowerCase() : unit);
      // calc()/var()/clamp() pass through; the style target validates before writing.
      else onchange(t);
    }
    onend?.();
  }

  function base(): number {
    if (parsed.numeric) return Number(parsed.num);
    const p = NUM_RE.exec(placeholder.trim());
    return p ? Number(p[1]) : 0;
  }

  function onKeydown(e: KeyboardEvent) {
    const el = e.currentTarget as HTMLInputElement;
    if (e.key === 'Enter') {
      e.preventDefault();
      commitText(el.value);
      el.blur();
    } else if (e.key === 'Escape') {
      draft = null;
      el.blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      draft = null;
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      emit(base() + (e.key === 'ArrowUp' ? 1 : -1) * step * mult, unit);
    }
  }

  function onUnitChange(e: Event) {
    const next = (e.currentTarget as HTMLSelectElement).value;
    if (next === '__free') return;
    if (keywords.includes(next)) {
      unitPick = null;
      onchange(next);
    } else if (parsed.numeric) {
      onchange(`${parsed.num}${next}`);
    } else {
      unitPick = next;
    }
    onend?.();
  }

  const scrubber: Attachment<HTMLElement> = (handle) => {
    let startX = 0;
    let startVal = 0;
    let pointerId = -1;
    let moved = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 2) return;
      moved = true;
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      emit(startVal + Math.round(dx / 2) * step * mult, unit);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      handle.releasePointerCapture(pointerId);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      document.body.style.cursor = '';
      if (moved) onend?.();
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      pointerId = e.pointerId;
      startX = e.clientX;
      startVal = base();
      moved = false;
      draft = null;
      handle.setPointerCapture(pointerId);
      handle.addEventListener('pointermove', onMove);
      handle.addEventListener('pointerup', onUp);
      handle.addEventListener('pointercancel', onUp);
      document.body.style.cursor = 'ew-resize';
    };
    handle.addEventListener('pointerdown', onDown);
    return () => handle.removeEventListener('pointerdown', onDown);
  };
</script>

<div class={['len', isFreeForm && 'len--free', raw !== '' && 'len--set']}>
  {#if scrub}
    <span class="len__scrub" aria-hidden="true" {@attach scrubber}>{scrub}</span>
  {/if}
  <input
    {id}
    class="len__input"
    type="text"
    inputmode="decimal"
    spellcheck="false"
    autocomplete="off"
    aria-label={ariaLabel}
    {placeholder}
    value={draft ?? (parsed.numeric ? parsed.num : raw)}
    oninput={(e) => (draft = e.currentTarget.value)}
    onblur={(e) => {
      if (draft !== null) commitText(e.currentTarget.value);
    }}
    onkeydown={onKeydown}
    onkeyup={(e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') onend?.();
    }}
  />
  {#if unitless && suffix}
    <span class="len__suffix" aria-hidden="true">{suffix}</span>
  {/if}
  {#if showUnits}
    <select
      class="len__unit"
      style:width="{unitWidth}px"
      aria-label="{ariaLabel} unit"
      value={isFreeForm ? '__free' : unit}
      onchange={onUnitChange}
    >
      {#if isFreeForm}<option value="__free" disabled>–</option>{/if}
      {#each unitOptions as u (u)}<option value={u}>{unitLabel(u)}</option>{/each}
      {#each keywords as k (k)}<option value={k}>{k}</option>{/each}
    </select>
  {/if}
</div>

<style>
  .len {
    display: flex;
    align-items: center;
    width: 100%;
    min-width: 0;
    height: var(--sx-control-h);
    background: var(--sx-subtle);
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-sm);
    transition:
      border-color var(--sx-dur) var(--sx-ease),
      box-shadow var(--sx-dur) var(--sx-ease),
      background-color var(--sx-dur) var(--sx-ease);
  }
  .len:hover {
    border-color: var(--sx-border-strong);
  }
  .len:focus-within {
    background: var(--sx-panel);
    border-color: var(--sx-accent);
    box-shadow: var(--sx-focus);
  }
  .len__scrub {
    display: grid;
    place-items: center;
    min-width: 20px;
    height: 100%;
    padding-left: 6px;
    font-size: var(--sx-text-xs);
    font-weight: 600;
    color: var(--sx-text-3);
    cursor: ew-resize;
    user-select: none;
    touch-action: none;
    flex-shrink: 0;
  }
  .len__scrub:hover {
    color: var(--sx-accent);
  }
  .len__input {
    flex: 1;
    width: 0;
    min-width: 0;
    height: 100%;
    padding: 0 4px 0 8px;
    font-size: var(--sx-text-md);
    font-variant-numeric: tabular-nums;
    color: var(--sx-text);
    background: transparent;
    border: 0;
    outline: none;
    text-overflow: ellipsis;
  }
  .len__scrub + .len__input {
    padding-left: 2px;
  }
  .len__input::placeholder {
    color: var(--sx-text-3);
  }
  .len--free .len__input {
    color: var(--sx-text-2);
  }
  .len__suffix {
    padding: 0 8px 0 2px;
    font-size: var(--sx-text-xs);
    font-weight: 500;
    color: var(--sx-text-3);
    text-transform: uppercase;
  }
  .len__unit {
    height: 100%;
    flex-shrink: 0;
    padding: 0 4px;
    font-size: var(--sx-text-xs);
    font-weight: 500;
    color: var(--sx-text-3);
    text-transform: uppercase;
    text-align: center;
    text-align-last: center;
    background: transparent;
    border: 0;
    border-left: 1px solid var(--sx-border);
    border-radius: 0 var(--sx-radius-sm) var(--sx-radius-sm) 0;
    outline: none;
    appearance: none;
    cursor: pointer;
  }
  .len__unit:hover,
  .len__unit:focus-visible {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .len--set .len__unit {
    color: var(--sx-text-2);
  }
</style>
