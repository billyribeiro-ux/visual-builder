<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import TrashIcon from 'phosphor-svelte/lib/TrashIcon';
  import Field from '../../../ui/Field.svelte';
  import LengthInput from '../../../ui/UnitInput.svelte';
  import ColorField, { type ColorSwatch } from '../../../ui/ColorField.svelte';
  import IconButton from '../../../ui/IconButton.svelte';
  import Seg, { type SegOption } from './Seg.svelte';
  import { parseGradient, serializeGradient, round, type Gradient, type GradientStop } from '../lib/css-values.js';

  interface Props {
    /** Current `background-image` value containing a gradient. */
    value: string;
    onchange: (css: string) => void;
    /** Called when a continuous gesture (stop drag) ends. */
    onend?: () => void;
    swatches?: ColorSwatch[];
  }

  let { value, onchange, onend, swatches = [] }: Props = $props();

  const FALLBACK: Gradient = {
    type: 'linear',
    angle: 135,
    stops: [
      { color: '#2F6BFF', pos: 0 },
      { color: '#7A5AF8', pos: 100 }
    ]
  };

  const gradient = $derived(parseGradient(value) ?? FALLBACK);
  let selected = $state(0);
  const selectedIndex = $derived(Math.min(selected, gradient.stops.length - 1));

  const TYPES: SegOption<Gradient['type']>[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'radial', label: 'Radial' }
  ];

  const preview = $derived(
    `linear-gradient(90deg, ${[...gradient.stops]
      .sort((a, b) => a.pos - b.pos)
      .map((s) => `${s.color} ${s.pos}%`)
      .join(', ')})`
  );

  function emit(next: Gradient) {
    onchange(serializeGradient(next));
  }

  function updateStop(index: number, patch: Partial<GradientStop>) {
    emit({ ...gradient, stops: gradient.stops.map((s, i) => (i === index ? { ...s, ...patch } : s)) });
  }

  function addStop(pos?: number) {
    const sorted = [...gradient.stops].sort((a, b) => a.pos - b.pos);
    const at = pos ?? (sorted.length >= 2 ? round((sorted[sorted.length - 2].pos + sorted[sorted.length - 1].pos) / 2, 1) : 50);
    const nearest = sorted.reduce((best, s) => (Math.abs(s.pos - at) < Math.abs(best.pos - at) ? s : best), sorted[0]);
    const stops = [...gradient.stops, { color: nearest?.color ?? '#FFFFFF', pos: at }];
    emit({ ...gradient, stops });
    selected = [...stops].sort((a, b) => a.pos - b.pos).findIndex((s) => s.pos === at);
  }

  function removeStop(index: number) {
    if (gradient.stops.length <= 2) return;
    emit({ ...gradient, stops: gradient.stops.filter((_, i) => i !== index) });
    selected = Math.max(0, index - 1);
  }

  function parsePercent(text: string): number | null {
    const n = Number(text.replace('%', '').trim());
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
  }

  /** Drag a stop handle along the strip; click on the strip adds a stop there. */
  const stripGestures: Attachment<HTMLElement> = (strip) => {
    let dragging = -1;
    let pointerId = -1;
    const posAt = (clientX: number) => {
      const r = strip.getBoundingClientRect();
      return round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)), 1);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId || dragging < 0) return;
      updateStop(dragging, { pos: posAt(e.clientX) });
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      strip.releasePointerCapture(pointerId);
      strip.removeEventListener('pointermove', onMove);
      strip.removeEventListener('pointerup', onUp);
      strip.removeEventListener('pointercancel', onUp);
      if (dragging >= 0) onend?.();
      dragging = -1;
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const handle = (e.target as HTMLElement).closest<HTMLElement>('[data-stop]');
      if (!handle) {
        addStop(posAt(e.clientX));
        return;
      }
      e.preventDefault();
      dragging = Number(handle.dataset.stop);
      selected = dragging;
      pointerId = e.pointerId;
      strip.setPointerCapture(pointerId);
      strip.addEventListener('pointermove', onMove);
      strip.addEventListener('pointerup', onUp);
      strip.addEventListener('pointercancel', onUp);
    };
    strip.addEventListener('pointerdown', onDown);
    return () => strip.removeEventListener('pointerdown', onDown);
  };
</script>

<div class="grad">
  <Field label="Type">
    <div class="grad__type">
      <Seg options={TYPES} value={gradient.type} ariaLabel="Gradient type" onchange={(type) => emit({ ...gradient, type })} />
      {#if gradient.type === 'linear'}
        <div class="grad__angle">
          <LengthInput
            value={`${gradient.angle}`}
            ariaLabel="Gradient angle in degrees"
            scrub="°"
            unitless
            min={0}
            max={360}
            step={1}
            onchange={(v) => {
              const n = Number(v);
              if (Number.isFinite(n)) emit({ ...gradient, angle: ((n % 360) + 360) % 360 });
            }}
          />
        </div>
      {/if}
    </div>
  </Field>

  <div
    class="grad__strip"
    role="group"
    aria-label="Gradient stops. Click to add a stop; drag a handle to move it."
    style:--grad={preview}
    {@attach stripGestures}
  >
    {#each gradient.stops as stop, i (i)}
      <!-- Stops have no identity in CSS; index keys are intentional (the list is re-derived from the value). -->
      <span
        class={['grad__handle', i === selectedIndex && 'grad__handle--on']}
        data-stop={i}
        style:left="{stop.pos}%"
        style:--stop={stop.color}
        aria-hidden="true"
      ></span>
    {/each}
  </div>

  <ul class="grad__stops" aria-label="Color stops">
    {#each gradient.stops as stop, i (i)}
      <li class={['grad__stop', i === selectedIndex && 'grad__stop--on']}>
        <div class="grad__stop-color">
          <ColorField value={stop.color} ariaLabel="Stop {i + 1} color" {swatches} onchange={(c) => c && updateStop(i, { color: c })} />
        </div>
        <div class="grad__stop-pos">
          <LengthInput
            value={`${stop.pos}`}
            ariaLabel="Stop {i + 1} position (percent)"
            unitless
            min={0}
            max={100}
            onchange={(v) => {
              const n = parsePercent(v);
              if (n !== null) updateStop(i, { pos: n });
            }}
          />
          <span class="grad__pct" aria-hidden="true">%</span>
        </div>
        <IconButton
          label="Remove stop {i + 1}"
          icon={TrashIcon}
          size="sm"
          iconSize={13}
          tone="danger"
          disabled={gradient.stops.length <= 2}
          onclick={() => removeStop(i)}
        />
      </li>
    {/each}
  </ul>
  <button type="button" class="sx-btn sx-btn--sm sx-btn--ghost grad__add" onclick={() => addStop()}>
    <PlusIcon size={13} weight="bold" /> Add stop
  </button>
</div>

<style>
  .grad {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .grad__type {
    display: flex;
    gap: 6px;
    width: 100%;
    min-width: 0;
  }
  .grad__type > :global(.sx-seg) {
    flex: 1;
  }
  .grad__angle {
    width: 64px;
    flex-shrink: 0;
  }
  .grad__strip {
    position: relative;
    height: 24px;
    margin: 0 8px;
    border-radius: var(--sx-radius-sm);
    background:
      var(--grad),
      repeating-conic-gradient(#e4e7ec 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px;
    box-shadow: inset 0 0 0 1px rgba(16, 24, 40, 0.1);
    cursor: copy;
    touch-action: none;
  }
  .grad__handle {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 30px;
    transform: translate(-50%, -50%);
    border-radius: 4px;
    background: var(--stop);
    border: 2px solid #fff;
    box-shadow:
      0 0 0 1px rgba(16, 24, 40, 0.28),
      0 1px 3px rgba(16, 24, 40, 0.24);
    cursor: ew-resize;
  }
  .grad__handle--on {
    box-shadow:
      0 0 0 1.5px var(--sx-accent),
      0 1px 3px rgba(16, 24, 40, 0.24);
  }
  .grad__stops {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .grad__stop {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px 24px;
    align-items: center;
    gap: 6px;
    border-radius: var(--sx-radius-sm);
  }
  .grad__stop-pos {
    position: relative;
  }
  .grad__pct {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    pointer-events: none;
  }
  .grad__add {
    align-self: flex-start;
  }
</style>
