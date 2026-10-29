<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import XIcon from 'phosphor-svelte/lib/XIcon';
  import { getManifest } from '@app-viz/components';
  import { typeIconFor } from './type-icons.js';

  interface Props {
    /** Viewport rect of the element that opened the picker. */
    anchor: { top: number; left: number; bottom: number; width: number };
    onInsertStructure: (structureId: string) => void;
    onInsertComponent: (componentType: string) => void;
    onClose: () => void;
  }

  let { anchor, onInsertStructure, onInsertComponent, onClose }: Props = $props();

  /** Structure presets understood by the studio's INSERT_STRUCTURE handler; `cols` are flex ratios. */
  const STRUCTURES = [
    { id: 'flex-1col', label: 'One column', cols: [1] },
    { id: 'flex-2col-50-50', label: 'Two columns, 50 / 50', cols: [1, 1] },
    { id: 'flex-2col-33-67', label: 'Two columns, 33 / 67', cols: [1, 2] },
    { id: 'flex-2col-67-33', label: 'Two columns, 67 / 33', cols: [2, 1] },
    { id: 'flex-3col', label: 'Three columns', cols: [1, 1, 1] },
    { id: 'flex-4col', label: 'Four columns', cols: [1, 1, 1, 1] }
  ] as const;

  const SECTION_TYPES = [
    'hero/split-hero',
    'marketing/feature-grid',
    'marketing/pricing-table',
    'marketing/stats-bar',
    'marketing/testimonials',
    'marketing/faq-accordion',
    'marketing/cta-banner',
    'marketing/contact-form',
    'app/kpi-grid',
    'ui/tabs'
  ];

  const sections = SECTION_TYPES.map((type) => ({ type, label: getManifest(type)?.displayName ?? type, icon: typeIconFor(type) }));

  let width = $state(0);
  let height = $state(0);
  const left = $derived(Math.max(8, Math.min(anchor.left + anchor.width / 2 - width / 2, window.innerWidth - width - 8)));
  const top = $derived(
    anchor.bottom + 8 + height <= window.innerHeight - 8 ? anchor.bottom + 8 : Math.max(8, anchor.top - height - 8)
  );

  const focusFirst: Attachment<HTMLElement> = (panel) => {
    panel.querySelector<HTMLElement>('button[data-first]')?.focus({ preventScroll: true });
  };
</script>

<div
  class="cv-picker"
  data-canvas-ui
  role="dialog"
  aria-label="Add a section"
  tabindex="-1"
  style:left="{left}px"
  style:top="{top}px"
  bind:offsetWidth={width}
  bind:offsetHeight={height}
  {@attach focusFirst}
>
  <div class="cv-picker-header">
    <span>Choose a structure</span>
    <button type="button" class="cv-picker-close" aria-label="Close" onclick={onClose}><XIcon size={14} /></button>
  </div>
  <div class="cv-structures">
    {#each STRUCTURES as structure, index (structure.id)}
      <button
        type="button"
        class="cv-structure"
        aria-label={structure.label}
        title={structure.label}
        data-first={index === 0 ? '' : undefined}
        onclick={() => onInsertStructure(structure.id)}
      >
        <span class="cv-diagram" aria-hidden="true">
          {#each structure.cols as ratio, col (col)}
            <span class="cv-diagram-col" style:flex-grow={ratio}></span>
          {/each}
        </span>
      </button>
    {/each}
  </div>
  <div class="cv-picker-sep"></div>
  <div class="cv-picker-subtitle">Or insert a ready-made section</div>
  <div class="cv-sections">
    {#each sections as section (section.type)}
      <button type="button" class="cv-section" onclick={() => onInsertComponent(section.type)}>
        <section.icon size={16} />
        <span>{section.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .cv-picker {
    position: fixed;
    z-index: 2147483600;
    width: 360px;
    max-width: calc(100vw - 16px);
    padding: 12px;
    box-sizing: border-box;
    border: 1px solid #EAECF0;
    border-radius: 8px;
    background: #FFFFFF;
    color: #101828;
    box-shadow: 0 12px 32px rgba(16, 24, 40, 0.14);
    font: 400 13px/1.2 Inter, system-ui, sans-serif;
    outline: none;
  }
  .cv-picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
    font-weight: 600;
    color: #101828;
  }
  .cv-picker-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #667085;
    cursor: pointer;
  }
  .cv-picker-close:hover {
    background: #F2F4F7;
  }
  .cv-structures {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .cv-structure {
    height: 44px;
    padding: 8px;
    border: 1px solid #EAECF0;
    border-radius: 6px;
    background: #FFFFFF;
    cursor: pointer;
  }
  .cv-structure:hover,
  .cv-structure:focus-visible {
    border-color: #2F6BFF;
    outline: none;
  }
  .cv-diagram {
    display: flex;
    gap: 3px;
    height: 100%;
  }
  .cv-diagram-col {
    flex-basis: 0;
    border-radius: 2px;
    background: #D0D5DD;
  }
  .cv-structure:hover .cv-diagram-col,
  .cv-structure:focus-visible .cv-diagram-col {
    background: #2F6BFF;
  }
  .cv-picker-sep {
    height: 1px;
    margin: 12px 0 10px;
    background: #F2F4F7;
  }
  .cv-picker-subtitle {
    margin-bottom: 6px;
    color: #667085;
    font-size: 12px;
  }
  .cv-sections {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px;
  }
  .cv-section {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 30px;
    padding: 0 8px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #344054;
    font: inherit;
    text-align: left;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
  }
  .cv-section:hover,
  .cv-section:focus-visible {
    background: #F2F4F7;
    outline: none;
  }
</style>
