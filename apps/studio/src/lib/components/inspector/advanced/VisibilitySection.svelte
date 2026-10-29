<script lang="ts">
  import type { Component } from 'svelte';
  import type { BlueprintNode, MotionEffects } from '@app-viz/schema';
  import DesktopIcon from 'phosphor-svelte/lib/DesktopIcon';
  import DeviceTabletIcon from 'phosphor-svelte/lib/DeviceTabletIcon';
  import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
  import { VISIBILITY_MEDIA } from '@app-viz/engine';
  import PanelSection from '../../../ui/PanelSection.svelte';
  import Toggle from '../../../ui/Toggle.svelte';
  import { editor } from '../../../state/editor.svelte.js';
  import { MOTION_DEFAULTS } from '../lib/motion.js';

  interface Props {
    node: BlueprintNode;
  }

  let { node }: Props = $props();


  /** `(min-width: 768px) and (max-width: 1023px)` → `768–1023px`. */
  function range(query: string): string {
    const min = /min-width:\s*(\d+)px/.exec(query)?.[1];
    const max = /max-width:\s*(\d+)px/.exec(query)?.[1];
    if (min && max) return `${min}–${max}px`;
    if (min) return `≥${min}px`;
    if (max) return `≤${max}px`;
    return '';
  }

  const DEVICES: ReadonlyArray<{ key: 'hideOnDesktop' | 'hideOnTablet' | 'hideOnMobile'; label: string; range: string; icon: Component<{ size?: number | string }> }> = [
    { key: 'hideOnDesktop', label: 'Desktop', range: range(VISIBILITY_MEDIA.desktop), icon: DesktopIcon },
    { key: 'hideOnTablet', label: 'Tablet', range: range(VISIBILITY_MEDIA.tablet), icon: DeviceTabletIcon },
    { key: 'hideOnMobile', label: 'Mobile', range: range(VISIBILITY_MEDIA.mobile), icon: DeviceMobileIcon }
  ];

  const motion = $derived<MotionEffects>({ ...MOTION_DEFAULTS, ...(node.motionEffects ?? {}) });
  const modified = $derived(motion.hideOnDesktop || motion.hideOnTablet || motion.hideOnMobile);
  const hiddenEverywhere = $derived(motion.hideOnDesktop && motion.hideOnTablet && motion.hideOnMobile);

  function setVisible(key: (typeof DEVICES)[number]['key'], visible: boolean) {
    editor.dispatch(
      { type: 'UPDATE_NODE_META', nodeId: node.id, meta: { motionEffects: { ...motion, [key]: !visible } } },
      { coalesce: false }
    );
  }
</script>

<PanelSection id="adv-visibility" title="Responsive visibility" {modified}>
  <ul class="vis">
    {#each DEVICES as d (d.key)}
      {@const Icon = d.icon}
      {@const visible = !motion[d.key]}
      <li class={['vis__row', !visible && 'vis__row--hidden']}>
        <span class="vis__icon"><Icon size={16} /></span>
        <span class="vis__text">
          <span class="vis__label">{d.label}</span>
          <span class="vis__range">{d.range}</span>
        </span>
        <span class="vis__state">{visible ? 'Visible' : 'Hidden'}</span>
        <Toggle checked={visible} label="Visible on {d.label}" onchange={(v) => setVisible(d.key, v)} />
      </li>
    {/each}
  </ul>
  {#if hiddenEverywhere}
    <p class="sx-help vis__warn">Hidden on every device — this element will never be shown.</p>
  {/if}
</PanelSection>

<style>
  .vis {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--sx-border);
    border-radius: var(--sx-radius-md);
    overflow: hidden;
  }
  .vis__row {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 12px;
  }
  .vis__row + .vis__row {
    border-top: 1px solid var(--sx-border);
  }
  .vis__icon {
    display: grid;
    place-items: center;
    color: var(--sx-text-2);
  }
  .vis__row--hidden .vis__icon,
  .vis__row--hidden .vis__label {
    color: var(--sx-text-3);
  }
  .vis__text {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .vis__label {
    font-size: var(--sx-text-md);
    font-weight: 500;
  }
  .vis__range {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
  }
  .vis__state {
    font-size: var(--sx-text-xs);
    color: var(--sx-text-3);
  }
  .vis__warn {
    color: var(--sx-warning);
  }
</style>
