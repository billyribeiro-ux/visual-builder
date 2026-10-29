<script lang="ts">
  import type { BlueprintNode, MotionEffects } from '@app-viz/schema';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Field from '../../../ui/Field.svelte';
  import Segmented from '../../../ui/Segmented.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import { MOTION_DEFAULTS } from '../lib/motion.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();

  const uid = $props.id();

  const motion = $derived<MotionEffects>({ ...MOTION_DEFAULTS, ...(node.motionEffects ?? {}) });
  const modified = $derived(
    motion.entranceAnimation !== 'none' ||
      motion.scrollEffect !== 'none' ||
      motion.hoverTransform !== 'none' ||
      motion.sticky !== 'none'
  );
  const noEntrance = $derived(motion.entranceAnimation === 'none');
  const noScrollEffect = $derived(motion.scrollEffect === 'none');

  const ENTRANCES: ReadonlyArray<{ value: MotionEffects['entranceAnimation']; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'fadeIn', label: 'Fade in' },
    { value: 'fadeInUp', label: 'Fade in, rise' },
    { value: 'fadeInDown', label: 'Fade in, drop' },
    { value: 'zoomIn', label: 'Zoom in' },
    { value: 'slideInLeft', label: 'Slide in from left' },
    { value: 'slideInRight', label: 'Slide in from right' }
  ];

  const DURATIONS: Array<{ value: MotionEffects['animationDuration']; label: string; title: string }> = [
    { value: 'fast', label: 'Fast', title: '220 ms' },
    { value: 'normal', label: 'Normal', title: '460 ms' },
    { value: 'slow', label: 'Slow', title: '760 ms' }
  ];

  const TRIGGERS: Array<{ value: MotionEffects['entranceTrigger']; label: string; title: string }> = [
    { value: 'load', label: 'On load', title: 'Plays once when the page loads' },
    { value: 'scroll', label: 'On scroll', title: 'Plays as the element scrolls into view' }
  ];

  const SCROLL_EFFECTS: ReadonlyArray<{ value: MotionEffects['scrollEffect']; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'parallax', label: 'Parallax' },
    { value: 'fade', label: 'Fade in and out' },
    { value: 'scale', label: 'Scale up' },
    { value: 'blur', label: 'Blur to sharp' },
    { value: 'rotate', label: 'Rotate' }
  ];

  const INTENSITIES: Array<{ value: MotionEffects['scrollIntensity']; label: string }> = [
    { value: 'subtle', label: 'Subtle' },
    { value: 'medium', label: 'Medium' },
    { value: 'strong', label: 'Strong' }
  ];

  const HOVERS: ReadonlyArray<{ value: MotionEffects['hoverTransform']; label: string }> = [
    { value: 'none', label: 'None' },
    { value: 'lift', label: 'Lift (raise 5px with shadow)' },
    { value: 'scale', label: 'Grow (scale 102%)' },
    { value: 'glow', label: 'Accent glow' },
    { value: 'tilt', label: '3D tilt' }
  ];

  const STICKY: Array<{ value: MotionEffects['sticky']; label: string; title: string }> = [
    { value: 'none', label: 'Off', title: 'Scrolls normally' },
    { value: 'top', label: 'Top', title: 'Sticks to the top of the viewport' },
    { value: 'bottom', label: 'Bottom', title: 'Sticks to the bottom of the viewport' }
  ];

  function update(patch: Partial<MotionEffects>) {
    editor.dispatch(
      { type: 'UPDATE_NODE_META', nodeId: node.id, meta: { motionEffects: { ...motion, ...patch } } },
      { coalesce: false }
    );
  }
</script>

<PanelSection id="adv-motion" title="Motion" {modified}>
  <p class="sx-section-label mo__sub">Entrance</p>
  <Field label="Animation" for="{uid}-entrance">
    <select
      id="{uid}-entrance"
      class="sx-select"
      value={motion.entranceAnimation}
      onchange={(e) => update({ entranceAnimation: e.currentTarget.value as MotionEffects['entranceAnimation'] })}
    >
      {#each ENTRANCES as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
    </select>
  </Field>
  <fieldset class="mo__group" disabled={noEntrance}>
    <legend class="mo__sr">Entrance timing</legend>
    <Field label="Duration">
      <Segmented options={DURATIONS} value={motion.animationDuration} block ariaLabel="Entrance duration" onchange={(v) => update({ animationDuration: v })} />
    </Field>
    <Field label="Trigger">
      <Segmented options={TRIGGERS} value={motion.entranceTrigger} block ariaLabel="Entrance trigger" onchange={(v) => update({ entranceTrigger: v })} />
    </Field>
  </fieldset>

  <p class="sx-section-label mo__sub">Scroll</p>
  <Field label="Scroll effect" for="{uid}-scroll">
    <select
      id="{uid}-scroll"
      class="sx-select"
      value={motion.scrollEffect}
      onchange={(e) => update({ scrollEffect: e.currentTarget.value as MotionEffects['scrollEffect'] })}
    >
      {#each SCROLL_EFFECTS as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
    </select>
  </Field>
  <fieldset class="mo__group" disabled={noScrollEffect}>
    <legend class="mo__sr">Scroll effect intensity</legend>
    <Field label="Intensity">
      <Segmented options={INTENSITIES} value={motion.scrollIntensity} block ariaLabel="Scroll effect intensity" onchange={(v) => update({ scrollIntensity: v })} />
    </Field>
  </fieldset>

  <p class="sx-section-label mo__sub">Interaction</p>
  <Field label="Hover effect" for="{uid}-hover">
    <select
      id="{uid}-hover"
      class="sx-select"
      value={motion.hoverTransform}
      onchange={(e) => update({ hoverTransform: e.currentTarget.value as MotionEffects['hoverTransform'] })}
    >
      {#each HOVERS as o (o.value)}<option value={o.value}>{o.label}</option>{/each}
    </select>
  </Field>
  <Field label="Sticky" help={motion.sticky !== 'none' ? 'Sticky elements need a scrollable parent taller than themselves.' : undefined}>
    <Segmented options={STICKY} value={motion.sticky} block ariaLabel="Sticky position" onchange={(v) => update({ sticky: v })} />
  </Field>
  <p class="sx-help">Respects reduced-motion settings.</p>
</PanelSection>

<style>
  .mo__sub {
    padding: 4px 0 0;
  }
  .mo__group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .mo__group:disabled {
    opacity: 0.45;
  }
  .mo__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
</style>
