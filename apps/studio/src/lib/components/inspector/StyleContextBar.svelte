<script lang="ts">
  import type { Component } from 'svelte';
  import type { BlueprintNode, BreakpointKey } from '@app-viz/schema';
  import DevicesIcon from 'phosphor-svelte/lib/DevicesIcon';
  import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobileIcon';
  import DeviceTabletIcon from 'phosphor-svelte/lib/DeviceTabletIcon';
  import DesktopIcon from 'phosphor-svelte/lib/DesktopIcon';
  import MonitorIcon from 'phosphor-svelte/lib/MonitorIcon';
  import CursorIcon from 'phosphor-svelte/lib/CursorIcon';
  import CursorClickIcon from 'phosphor-svelte/lib/CursorClickIcon';
  import CrosshairIcon from 'phosphor-svelte/lib/CrosshairIcon';
  import InfoIcon from 'phosphor-svelte/lib/InfoIcon';
  import { editor } from '../../state/editor.svelte.js';
  import { tooltip } from '../../ui/tooltip.js';
  import { inspectorUi, type StyleState } from './lib/ui-state.svelte.js';
  import { bucketHasOverrides, type StyleBucket } from './lib/style-target.svelte.js';
  import { BREAKPOINT_NAMES, breakpointRange } from './lib/css-values.js';

  interface Props {
    node: BlueprintNode;
    bucket: StyleBucket;
  }

  let { node, bucket }: Props = $props();

  const DEVICE_ICONS: Record<BreakpointKey, Component<{ size?: number | string }>> = {
    mobile: DeviceMobileIcon,
    tablet: DeviceTabletIcon,
    desktop: DesktopIcon,
    wide: MonitorIcon
  };

  const STATES: ReadonlyArray<{ value: StyleState; label: string; title: string }> = [
    { value: 'normal', label: 'Normal', title: 'Default appearance' },
    { value: 'hover', label: 'Hover', title: 'While the pointer is over the element' },
    { value: 'focus', label: 'Focus', title: 'While the element (or a control inside it) has keyboard focus' },
    { value: 'active', label: 'Pressed', title: 'While the element is being pressed' }
  ];

  const STATE_ICONS: Record<Exclude<StyleState, 'normal'>, Component<{ size?: number | string }>> = {
    hover: CursorIcon,
    focus: CrosshairIcon,
    active: CursorClickIcon
  };

  const bp = $derived(editor.activeBreakpoint);
  const deviceName = $derived(BREAKPOINT_NAMES[bp]);
  const deviceRange = $derived(breakpointRange(bp));
  const DeviceIcon = $derived(DEVICE_ICONS[bp]);
  const isState = $derived(inspectorUi.state !== 'normal');

  const target = $derived.by(() => {
    if (inspectorUi.state !== 'normal') {
      const s = STATES.find((x) => x.value === inspectorUi.state);
      return { icon: STATE_ICONS[inspectorUi.state], title: `${s?.label ?? ''} state`, sub: 'All devices' };
    }
    if (inspectorUi.scope === 'device') return { icon: DeviceIcon, title: deviceName, sub: deviceRange };
    return { icon: DevicesIcon, title: 'All devices', sub: 'Base styles' };
  });

  /** Overrides on the previewed device win over base edits there — say so instead of surprising. */
  const maskingOverrides = $derived(
    bucket === 'base' ? Object.keys(node.styles?.[bp] ?? {}).filter((k) => String(node.styles?.[bp]?.[k] ?? '') !== '').length : 0
  );
</script>

<div class="ctx">
  <div class="ctx__row">
    {#if target.icon}
      {@const Icon = target.icon}
      <span class="ctx__icon"><Icon size={14} /></span>
    {/if}
    <span class="ctx__title">{target.title}</span>
    {#if target.sub}<span class="ctx__sub">{target.sub}</span>{/if}
    <div class="sx-seg ctx__scope" role="group" aria-label="Edit scope">
      <button
        type="button"
        class="sx-seg__item"
        aria-pressed={inspectorUi.scope === 'all'}
        aria-label="Edit all devices"
        disabled={isState}
        {@attach tooltip(isState ? 'States apply to all devices' : 'Edit all devices')}
        onclick={() => (inspectorUi.scope = 'all')}
      >
        <DevicesIcon size={14} />
        {#if bucketHasOverrides(node, 'base')}<span class="ctx__dot" aria-hidden="true"></span>{/if}
      </button>
      <button
        type="button"
        class="sx-seg__item"
        aria-pressed={inspectorUi.scope === 'device'}
        aria-label="Edit {deviceName} only"
        disabled={isState}
        {@attach tooltip(isState ? 'States apply to all devices' : `Edit ${deviceName} only (${deviceRange})`)}
        onclick={() => (inspectorUi.scope = 'device')}
      >
        <DeviceIcon size={14} />
        {#if bucketHasOverrides(node, bp)}<span class="ctx__dot" aria-hidden="true"></span>{/if}
      </button>
    </div>
  </div>

  <div class="sx-seg sx-seg--block" role="group" aria-label="Element state">
    {#each STATES as s (s.value)}
      <button
        type="button"
        class="sx-seg__item ctx__state"
        aria-pressed={inspectorUi.state === s.value}
        {@attach tooltip(s.title)}
        onclick={() => (inspectorUi.state = s.value)}
      >
        {s.label}
        {#if s.value !== 'normal' && bucketHasOverrides(node, s.value)}<span class="ctx__dot" aria-hidden="true"></span>{/if}
      </button>
    {/each}
  </div>

  {#if maskingOverrides > 0 && inspectorUi.state === 'normal'}
    <p class="ctx__note">
      <InfoIcon size={13} />
      <span>{maskingOverrides} {deviceName} {maskingOverrides === 1 ? 'override wins' : 'overrides win'} on this device.</span>
      <button type="button" class="ctx__link" onclick={() => (inspectorUi.scope = 'device')}>Edit {deviceName}</button>
    </p>
  {/if}
</div>

<style>
  .ctx {
    position: sticky;
    top: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 14px 12px;
    background: var(--sx-subtle);
    border-bottom: 1px solid var(--sx-border);
  }
  .ctx__row {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 28px;
    min-width: 0;
  }
  .ctx__icon {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--sx-radius-sm);
    color: var(--sx-accent-text);
    background: var(--sx-accent-soft);
    flex-shrink: 0;
  }
  .ctx__title {
    font-size: var(--sx-text-md);
    font-weight: 600;
    white-space: nowrap;
  }
  .ctx__sub {
    flex: 1;
    min-width: 0;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-3);
    font-variant-numeric: tabular-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ctx__scope {
    flex-shrink: 0;
    background: var(--sx-active);
  }
  .ctx__scope .sx-seg__item {
    position: relative;
    width: 28px;
    padding: 0;
  }
  .ctx__scope .sx-seg__item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .ctx__state {
    position: relative;
  }
  .ctx__dot {
    position: absolute;
    top: 3px;
    right: 3px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--sx-accent);
  }
  .ctx__note {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--sx-text-sm);
    color: var(--sx-text-2);
  }
  .ctx__note :global(svg) {
    color: var(--sx-accent);
    flex-shrink: 0;
  }
  .ctx__note span {
    flex: 1;
    min-width: 0;
  }
  .ctx__link {
    font-weight: 600;
    color: var(--sx-accent-text);
    white-space: nowrap;
  }
  .ctx__link:hover {
    text-decoration: underline;
  }
</style>
