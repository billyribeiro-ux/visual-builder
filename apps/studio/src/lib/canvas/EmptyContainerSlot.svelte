<script lang="ts">
  import PlusIcon from 'phosphor-svelte/lib/PlusIcon';
  import { getCanvasActions } from './canvas-context.js';

  interface Props {
    /** The empty container this placeholder belongs to. */
    nodeId: string;
  }

  let { nodeId }: Props = $props();

  const actions = getCanvasActions();

  function openPicker(event: MouseEvent) {
    event.stopPropagation();
    actions.openStructurePicker(nodeId, (event.currentTarget as HTMLElement).getBoundingClientRect());
  }
</script>

<div class="slot" data-canvas-ui data-empty-container={nodeId}>
  <button type="button" class="plus" aria-label="Add a structure to this container" title="Add a structure" onclick={openPicker}>
    <PlusIcon size={14} weight="bold" />
  </button>
  <span class="text">Drop elements here</span>
</div>

<style>
  .slot {
    min-height: 88px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: 1px dashed #98A2B3;
    border-radius: 8px;
    background: rgba(16, 24, 40, 0.02);
    font: 400 12px/16px Inter, system-ui, sans-serif;
    color: #667085;
    text-align: center;
    box-sizing: border-box;
  }
  .plus {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #D0D5DD;
    border-radius: 9999px;
    background: #FFFFFF;
    color: #344054;
    cursor: pointer;
    transition: border-color 120ms ease, color 120ms ease;
  }
  .plus:hover {
    border-color: #2F6BFF;
    color: #2F6BFF;
  }
  .plus:focus-visible {
    outline: 2px solid #2F6BFF;
    outline-offset: 2px;
  }
</style>
