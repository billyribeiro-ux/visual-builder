import {
  type ProjectBlueprint,
  type BreakpointKey,
  type BlueprintNode,
  type PageRoute,
  createDefaultAcmeSaaSProject
} from '@app-viz/schema';
import {
  HistoryManager,
  type EditorCommand,
  findNodeById
} from '@app-viz/engine';
import { generateFullExport, createDeterministicZip } from '@app-viz/codegen';

class EditorState {
  // Svelte 5 Runes for fine-grained reactive studio state
  private historyManager = new HistoryManager(createDefaultAcmeSaaSProject());
  
  blueprint = $state<ProjectBlueprint>(this.historyManager.current);
  selectedNodeId = $state<string | null>('30000000-0000-0000-0000-000000000002'); // Default selected Hero
  hoverNodeId = $state<string | null>(null);
  activePageId = $state<string>('10000000-0000-0000-0000-000000000001'); // Home Page
  activeBreakpoint = $state<BreakpointKey>('desktop');
  zoom = $state<number>(100);
  isInteractiveMode = $state<boolean>(false);
  activeLeftTab = $state<'pages' | 'layers' | 'library' | 'tokens'>('layers');
  isSaving = $state<boolean>(false);
  lastSavedAt = $state<string>('Just now');

  // Derived states
  canUndo = $derived(this.historyManager.canUndo);
  canRedo = $derived(this.historyManager.canRedo);

  activePage = $derived(
    this.blueprint.pages.find((p) => p.id === this.activePageId) || this.blueprint.pages[0]
  );

  selectedNode = $derived<BlueprintNode | null>(() => {
    if (!this.selectedNodeId || !this.activePage) return null;
    return findNodeById(this.activePage.rootNode, this.selectedNodeId);
  });

  dispatch(command: EditorCommand) {
    this.blueprint = this.historyManager.execute(command);
    this.triggerAutosave();
  }

  undo() {
    const prev = this.historyManager.undo();
    if (prev) {
      this.blueprint = prev;
      this.triggerAutosave();
    }
  }

  redo() {
    const next = this.historyManager.redo();
    if (next) {
      this.blueprint = next;
      this.triggerAutosave();
    }
  }

  selectNode(id: string | null) {
    this.selectedNodeId = id;
  }

  hoverNode(id: string | null) {
    this.hoverNodeId = id;
  }

  setActivePage(pageId: string) {
    this.activePageId = pageId;
    this.selectedNodeId = null;
  }

  setBreakpoint(bp: BreakpointKey) {
    this.activeBreakpoint = bp;
  }

  setZoom(z: number) {
    this.zoom = Math.max(25, Math.min(200, z));
  }

  toggleInteractiveMode() {
    this.isInteractiveMode = !this.isInteractiveMode;
    if (this.isInteractiveMode) {
      this.selectedNodeId = null;
    }
  }

  private triggerAutosave() {
    this.isSaving = true;
    setTimeout(() => {
      this.isSaving = false;
      this.lastSavedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }, 300);
  }

  async exportHandoffPackage(): Promise<void> {
    const generated = generateFullExport(this.blueprint);
    const zipBytes = await createDeterministicZip(generated);

    // Trigger browser download
    const blob = new Blob([zipBytes], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.blueprint.meta.slug}-ai-handoff.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadBlueprintJson(): void {
    const jsonStr = JSON.stringify(this.blueprint, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.blueprint.meta.slug}.blueprint.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const editor = new EditorState();
