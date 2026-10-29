/**
 * Canvas-only actions available to in-flow editor chrome (empty-container placeholders, the
 * add-section zone) without drilling callbacks through the generic renderer.
 */
import { createContext } from 'svelte';

export interface CanvasActions {
  /** Opens the structure picker anchored to `anchor`; structures are inserted into `targetNodeId` (page root when null). */
  openStructurePicker(targetNodeId: string | null, anchor: DOMRect): void;
}

export const [getCanvasActions, setCanvasActions] = createContext<CanvasActions>();
