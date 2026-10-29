<script lang="ts">
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFourIcon';
  import type { DropPosition } from './messages.js';

  /** Design-mode "add section" zone rendered after the last section of the page. */
  interface Props {
    /** Page root: structures and drops land inside it (at the end). */
    rootNodeId: string;
    onOpenStructurePicker: (anchor: DOMRect) => void;
    onOpenLibrary: () => void;
    onDrop: (payload: { componentType?: string; nodeId?: string }, targetNodeId: string, position: DropPosition) => void;
  }

  let { rootNodeId, onOpenStructurePicker, onOpenLibrary, onDrop }: Props = $props();

  const COMPONENT_MIME = 'application/x-app-viz-component';
  const NODE_MIME = 'application/x-app-viz-node-id';
  let dragOver = $state(false);

  function accepts(event: DragEvent): boolean {
    const types = event.dataTransfer?.types ?? [];
    return types.includes(COMPONENT_MIME) || types.includes(NODE_MIME);
  }

  function handleDragOver(event: DragEvent) {
    if (!accepts(event)) return;
    event.preventDefault();
    dragOver = true;
  }

  function handleDrop(event: DragEvent) {
    if (!accepts(event)) return;
    event.preventDefault();
    dragOver = false;
    const componentType = event.dataTransfer?.getData(COMPONENT_MIME) || '';
    const nodeId = event.dataTransfer?.getData(NODE_MIME) || '';
    if (componentType) onDrop({ componentType }, rootNodeId, 'inside');
    else if (nodeId && nodeId !== rootNodeId) onDrop({ nodeId }, rootNodeId, 'inside');
  }
</script>

<section
  class={['cv-add-zone', dragOver && 'cv-add-zone--active']}
  data-canvas-ui
  aria-label="Add a section to the end of the page"
  ondragover={handleDragOver}
  ondragleave={() => (dragOver = false)}
  ondrop={handleDrop}
>
  <div class="cv-add-buttons">
    <button
      type="button"
      class="cv-add-btn cv-add-btn--primary"
      aria-label="Add a section"
      title="Add a section"
      onclick={(event) => onOpenStructurePicker(event.currentTarget.getBoundingClientRect())}
    >
      <PlusIcon size={16} weight="bold" />
    </button>
    <button type="button" class="cv-add-btn" aria-label="Open the block library" title="Open the block library" onclick={onOpenLibrary}>
      <SquaresFourIcon size={16} />
    </button>
  </div>
  <p class="cv-add-caption">Drag a widget here or add a section</p>
</section>

<style>
  .cv-add-zone {
    margin: 32px 24px 48px;
    padding: 24px;
    border: 1px dashed #D0D5DD;
    border-radius: 8px;
    background: transparent;
    text-align: center;
    font: 400 12px/16px Inter, system-ui, sans-serif;
    color: #667085;
    transition: border-color 120ms ease, background-color 120ms ease;
  }
  .cv-add-zone:hover,
  .cv-add-zone--active {
    border-color: #2F6BFF;
    background: rgba(47, 107, 255, 0.04);
  }
  .cv-add-buttons {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 10px;
  }
  .cv-add-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid #D0D5DD;
    border-radius: 9999px;
    background: #FFFFFF;
    color: #344054;
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    transition: border-color 120ms ease, color 120ms ease, background-color 120ms ease;
  }
  .cv-add-btn:hover {
    border-color: #2F6BFF;
    color: #2F6BFF;
  }
  .cv-add-btn--primary {
    border-color: #2F6BFF;
    background: #2F6BFF;
    color: #FFFFFF;
  }
  .cv-add-btn--primary:hover {
    background: #1F5AEB;
    color: #FFFFFF;
  }
  .cv-add-btn:focus-visible {
    outline: 2px solid #2F6BFF;
    outline-offset: 2px;
  }
  .cv-add-caption {
    margin: 0;
  }
</style>
