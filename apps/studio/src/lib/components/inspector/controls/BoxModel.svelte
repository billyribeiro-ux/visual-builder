<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import LinkSimpleIcon from 'phosphor-svelte/lib/LinkSimpleIcon';
  import LinkSimpleBreakIcon from 'phosphor-svelte/lib/LinkSimpleBreakIcon';
  import { tooltip } from '../../../ui/tooltip.js';
  import { getStyleTarget } from '../lib/style-target.svelte.js';
  import { compactLength, expandSides, normalizeLength, parseLength } from '../lib/css-values.js';
  import InlineMessage from './InlineMessage.svelte';

  type Ring = 'margin' | 'padding';
  type Side = 'Top' | 'Right' | 'Bottom' | 'Left';

  const SIDES: Side[] = ['Top', 'Right', 'Bottom', 'Left'];
  const OPPOSITE: Record<Side, Side> = { Top: 'Bottom', Bottom: 'Top', Left: 'Right', Right: 'Left' };
  const RING_LABEL: Record<Ring, string> = { margin: 'Margin', padding: 'Padding' };

  const s = getStyleTarget();
  const uid = $props.id();

  let linked = $state<Record<Ring, boolean>>({ margin: false, padding: false });
  let editing = $state<{ ring: Ring; side: Side } | null>(null);
  let draft = $state('');
  let error = $state('');
  /** Set after a drag so the trailing click does not open the text editor. */
  let suppressClick = false;

  interface SideValue {
    value: string;
    source: 'own' | 'inherited' | 'none';
  }

  function fromShorthand(shorthand: string, side: Side): string {
    const sides = expandSides(shorthand);
    return sides ? sides[SIDES.indexOf(side)] : '';
  }

  function sideValue(ring: Ring, side: Side): SideValue {
    const key = `${ring}${side}`;
    const own = s.get(key) || (s.get(ring) ? fromShorthand(s.get(ring), side) : '');
    if (own) return { value: own, source: 'own' };
    const inherited = s.inheritedOf(key) || (s.inheritedOf(ring) ? fromShorthand(s.inheritedOf(ring), side) : '');
    if (inherited) return { value: inherited, source: 'inherited' };
    return { value: '', source: 'none' };
  }

  /**
   * Writes longhand sides. A shorthand (`padding: 24px 16px`) in the edited bucket is expanded
   * into longhands first so the edit cannot be overridden by declaration order.
   */
  function write(ring: Ring, sides: readonly Side[], value: string) {
    const patch: Record<string, string> = {};
    const shorthand = s.get(ring);
    if (shorthand) {
      const expanded = expandSides(shorthand) ?? ['', '', '', ''];
      patch[ring] = '';
      SIDES.forEach((side, i) => {
        patch[`${ring}${side}`] = s.get(`${ring}${side}`) || expanded[i];
      });
    }
    for (const side of sides) patch[`${ring}${side}`] = value;
    s.setMany(patch);
  }

  function targets(ring: Ring, side: Side, mods?: { shiftKey: boolean; altKey: boolean }): Side[] {
    if (linked[ring] || mods?.shiftKey) return SIDES;
    if (mods?.altKey) return [side, OPPOSITE[side]];
    return [side];
  }

  function validate(ring: Ring, text: string): string | null {
    if (ring === 'padding' && /^auto$/i.test(text)) return 'Padding cannot be auto.';
    const p = parseLength(text);
    if (p && ring === 'padding' && p.num < 0) return 'Padding cannot be negative.';
    if (!p && !/^(auto|calc\(|var\(|clamp\(|min\(|max\()/i.test(text)) return `“${text}” is not a valid length.`;
    return null;
  }

  function startEdit(ring: Ring, side: Side) {
    error = '';
    draft = sideValue(ring, side).source === 'own' ? compactLength(sideValue(ring, side).value) : '';
    editing = { ring, side };
  }

  function commitEdit() {
    if (!editing) return;
    const { ring, side } = editing;
    const text = draft.trim();
    editing = null;
    if (text === '') {
      write(ring, targets(ring, side), '');
      return;
    }
    const problem = validate(ring, text);
    if (problem) {
      error = problem;
      return;
    }
    error = '';
    write(ring, targets(ring, side), normalizeLength(text));
  }

  function nudge(ring: Ring, side: Side, delta: number) {
    const cur = parseLength(sideValue(ring, side).value);
    let n = (cur?.num ?? 0) + delta;
    if (ring === 'padding') n = Math.max(0, n);
    write(ring, targets(ring, side), `${Math.round(n * 100) / 100}${cur?.unit || 'px'}`);
  }

  /** Drag to scrub: vertical sides follow vertical movement, horizontal sides horizontal. */
  function scrubber(ring: Ring, side: Side): Attachment<HTMLButtonElement> {
    return (el) => {
      let startX = 0;
      let startY = 0;
      let startNum = 0;
      let unit = 'px';
      let moved = false;
      let pointerId = -1;

      const onMove = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = startY - e.clientY;
        if (!moved && Math.abs(dx) + Math.abs(dy) < 3) return;
        if (!moved) document.body.style.cursor = side === 'Left' || side === 'Right' ? 'ew-resize' : 'ns-resize';
        moved = true;
        const delta = side === 'Left' || side === 'Right' ? dx : dy;
        let n = startNum + Math.round(delta / 2);
        if (ring === 'padding') n = Math.max(0, n);
        write(ring, targets(ring, side, e), `${n}${unit}`);
      };
      const onUp = (e: PointerEvent) => {
        if (e.pointerId !== pointerId) return;
        el.releasePointerCapture(pointerId);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        document.body.style.cursor = '';
        if (moved) {
          suppressClick = true;
          s.endEdit();
        }
      };
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return;
        const cur = parseLength(sideValue(ring, side).value);
        startNum = cur?.num ?? 0;
        unit = cur?.unit || 'px';
        startX = e.clientX;
        startY = e.clientY;
        moved = false;
        pointerId = e.pointerId;
        el.setPointerCapture(pointerId);
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
      };
      el.addEventListener('pointerdown', onDown);
      return () => el.removeEventListener('pointerdown', onDown);
    };
  }

  const focusAndSelect: Attachment<HTMLInputElement> = (el) => {
    el.focus();
    el.select();
  };

  const PRESETS_Y = ['0', '16', '24', '48', '64', '96'];
  const PRESETS_X = ['0', '16', '24', '32', '48', '64'];

  function presetValue(a: SideValue, b: SideValue): string {
    if (!a.value || a.value !== b.value) return '';
    const p = parseLength(a.value);
    return p && (p.unit === 'px' || p.num === 0) ? String(p.num) : '';
  }

  const padY = $derived(presetValue(sideValue('padding', 'Top'), sideValue('padding', 'Bottom')));
  const padX = $derived(presetValue(sideValue('padding', 'Left'), sideValue('padding', 'Right')));
  const padYOwn = $derived(sideValue('padding', 'Top').source === 'own');
  const padXOwn = $derived(sideValue('padding', 'Left').source === 'own');
</script>

{#snippet value(ring: Ring, side: Side)}
  {@const v = sideValue(ring, side)}
  <div class={['bm__cell', `bm__cell--${side.toLowerCase()}`]}>
    {#if editing?.ring === ring && editing.side === side}
      <input
        class="bm__input"
        aria-label="{RING_LABEL[ring]} {side.toLowerCase()}"
        spellcheck="false"
        value={draft}
        {@attach focusAndSelect}
        oninput={(e) => (draft = e.currentTarget.value)}
        onblur={commitEdit}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commitEdit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            editing = null;
          }
        }}
      />
    {:else}
      <button
        type="button"
        class={['bm__val', `bm__val--${v.source}`, side === 'Left' || side === 'Right' ? 'bm__val--h' : 'bm__val--v']}
        aria-label="{RING_LABEL[ring]} {side.toLowerCase()}: {v.value || 'not set'}{v.source === 'inherited' ? ' (inherited)' : ''}"
        {@attach tooltip(`${RING_LABEL[ring]} ${side.toLowerCase()} — drag to adjust`, { kbd: '⇧ all · ⌥ opposite' })}
        {@attach scrubber(ring, side)}
        onclick={() => {
          if (suppressClick) {
            suppressClick = false;
            return;
          }
          startEdit(ring, side);
        }}
        onkeydown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            nudge(ring, side, (e.key === 'ArrowUp' ? 1 : -1) * (e.shiftKey ? 10 : 1));
          }
        }}
        onkeyup={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') s.endEdit();
        }}
      >
        {v.value ? compactLength(v.value) : '–'}
      </button>
    {/if}
  </div>
{/snippet}

{#snippet linkToggle(ring: Ring)}
  <button
    type="button"
    class="bm__link"
    aria-pressed={linked[ring]}
    aria-label="Link {RING_LABEL[ring].toLowerCase()} sides"
    {@attach tooltip(linked[ring] ? `${RING_LABEL[ring]}: editing all sides together` : `Link ${RING_LABEL[ring].toLowerCase()} sides`)}
    onclick={() => (linked[ring] = !linked[ring])}
  >
    {#if linked[ring]}<LinkSimpleIcon size={12} weight="bold" />{:else}<LinkSimpleBreakIcon size={12} />{/if}
  </button>
{/snippet}

<div class="bm" role="group" aria-label="Margin and padding">
  <span class="bm__label">Margin</span>
  {@render linkToggle('margin')}
  {@render value('margin', 'Top')}
  {@render value('margin', 'Left')}
  <div class="bm__inner" role="group" aria-label="Padding">
    <span class="bm__label bm__label--inner">Padding</span>
    {@render linkToggle('padding')}
    {@render value('padding', 'Top')}
    {@render value('padding', 'Left')}
    <div class="bm__core" aria-hidden="true"></div>
    {@render value('padding', 'Right')}
    {@render value('padding', 'Bottom')}
  </div>
  {@render value('margin', 'Right')}
  {@render value('margin', 'Bottom')}
</div>
{#if error}<InlineMessage message={error} />{/if}

<div class="bm-presets">
  <span class="bm-presets__label" id="{uid}-py">Padding Y</span>
  <div class="bm-presets__chips" role="group" aria-labelledby="{uid}-py">
    {#each PRESETS_Y as p (p)}
      <button
        type="button"
        class={['bm-chip', padY === p && (padYOwn ? 'bm-chip--on' : 'bm-chip--inherited')]}
        aria-pressed={padY === p}
        aria-label="Vertical padding {p}px"
        onclick={() => write('padding', ['Top', 'Bottom'], `${p}px`)}>{p}</button
      >
    {/each}
  </div>
  <span class="bm-presets__label" id="{uid}-px">Padding X</span>
  <div class="bm-presets__chips" role="group" aria-labelledby="{uid}-px">
    {#each PRESETS_X as p (p)}
      <button
        type="button"
        class={['bm-chip', padX === p && (padXOwn ? 'bm-chip--on' : 'bm-chip--inherited')]}
        aria-pressed={padX === p}
        aria-label="Horizontal padding {p}px"
        onclick={() => write('padding', ['Left', 'Right'], `${p}px`)}>{p}</button
      >
    {/each}
  </div>
</div>

<style>
  .bm,
  .bm__inner {
    position: relative;
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) 44px;
    border-radius: var(--sx-radius-md);
  }
  .bm {
    grid-template-rows: 28px auto 28px;
    background: var(--sx-subtle);
    border: 1px dashed var(--sx-border-strong);
  }
  .bm__inner {
    grid-row: 2;
    grid-column: 2;
    grid-template-rows: 26px 28px 26px;
    background: var(--sx-panel);
    border: 1px solid var(--sx-border-strong);
    border-radius: var(--sx-radius-sm);
  }
  .bm__label {
    position: absolute;
    top: 6px;
    left: 8px;
    font-size: 9.5px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--sx-text-3);
    pointer-events: none;
    user-select: none;
  }
  .bm__label--inner {
    top: 5px;
    left: 7px;
  }
  .bm__link {
    position: absolute;
    top: 4px;
    right: 4px;
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: var(--sx-radius-xs);
    color: var(--sx-text-3);
  }
  .bm__link:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .bm__link[aria-pressed='true'] {
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
  }
  .bm__inner .bm__link {
    top: 3px;
    right: 3px;
  }
  .bm__cell {
    display: grid;
    place-items: center;
    min-width: 0;
  }
  .bm__cell--top {
    grid-area: 1 / 2;
  }
  .bm__cell--left {
    grid-area: 2 / 1;
  }
  .bm__cell--right {
    grid-area: 2 / 3;
  }
  .bm__cell--bottom {
    grid-area: 3 / 2;
  }
  .bm__core {
    grid-area: 2 / 2;
    align-self: center;
    height: 20px;
    margin: 0 4px;
    border-radius: var(--sx-radius-xs);
    border: 1px solid var(--sx-border);
    background: repeating-linear-gradient(
      -45deg,
      var(--sx-hover),
      var(--sx-hover) 3px,
      transparent 3px,
      transparent 6px
    );
  }
  .bm__val {
    min-width: 28px;
    height: 20px;
    padding: 0 4px;
    border-radius: var(--sx-radius-xs);
    font-size: var(--sx-text-sm);
    font-variant-numeric: tabular-nums;
    color: var(--sx-text-3);
    touch-action: none;
    transition:
      background-color var(--sx-dur) var(--sx-ease),
      color var(--sx-dur) var(--sx-ease);
  }
  .bm__val--v {
    cursor: ns-resize;
  }
  .bm__val--h {
    cursor: ew-resize;
  }
  .bm__val:hover {
    color: var(--sx-text);
    background: var(--sx-hover);
  }
  .bm__val--inherited {
    color: var(--sx-text-2);
  }
  .bm__val--own {
    color: var(--sx-accent-text);
    font-weight: 600;
  }
  .bm__input {
    width: 40px;
    height: 22px;
    padding: 0 2px;
    font: inherit;
    font-size: var(--sx-text-sm);
    font-variant-numeric: tabular-nums;
    text-align: center;
    color: var(--sx-text);
    background: var(--sx-panel);
    border: 1px solid var(--sx-accent);
    border-radius: var(--sx-radius-xs);
    box-shadow: var(--sx-focus);
    outline: none;
  }
  .bm-presets {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    align-items: center;
    gap: 8px;
  }
  .bm-presets__label {
    font-size: var(--sx-text-sm);
    font-weight: 500;
    color: var(--sx-text-2);
  }
  .bm-presets__chips {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 2px;
    padding: 2px;
    border-radius: var(--sx-radius-sm);
    background: var(--sx-hover);
  }
  .bm-chip {
    height: 24px;
    border-radius: var(--sx-radius-xs);
    font-size: var(--sx-text-sm);
    font-variant-numeric: tabular-nums;
    color: var(--sx-text-2);
  }
  .bm-chip:hover {
    color: var(--sx-text);
  }
  .bm-chip--on {
    color: var(--sx-text);
    background: var(--sx-panel);
    box-shadow:
      0 1px 2px rgba(16, 24, 40, 0.1),
      0 0 0 0.5px rgba(16, 24, 40, 0.06);
  }
  :global(.sx[data-theme='dark']) .bm-chip--on {
    background: var(--sx-active);
  }
  .bm-chip--inherited {
    box-shadow: inset 0 0 0 1px var(--sx-border-strong);
  }
</style>
