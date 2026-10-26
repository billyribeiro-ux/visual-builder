import {
  type ProjectBlueprint,
  type BreakpointKey,
  type BlueprintNode,
  ProjectBlueprintSchema,
  createDefaultAcmeSaaSProject,
  createBlankProject,
  validateBlueprintPreflight
} from '@app-viz/schema';
import {
  HistoryManager,
  type EditorCommand,
  findNodeById
} from '@app-viz/engine';
import { generateFullExport, createDeterministicZip } from '@app-viz/codegen';

export interface ProjectSnapshot {
  id: string;
  label: string;
  createdAt: string;
  blueprint: ProjectBlueprint;
}

const STORAGE_KEY_BLUEPRINT = 'app-viz-studio-blueprint-v1';
const STORAGE_KEY_SNAPSHOTS = 'app-viz-studio-snapshots-v1';

function findNodePath(root: BlueprintNode, targetId: string): BlueprintNode[] | null {
  if (root.id === targetId) return [root];
  for (const child of root.children || []) {
    const subPath = findNodePath(child, targetId);
    if (subPath) return [root, ...subPath];
  }
  return null;
}

class EditorState {
  // Svelte 5 Runes for fine-grained reactive studio state
  private historyManager = new HistoryManager(createDefaultAcmeSaaSProject());
  private revision = $state<number>(0);

  blueprint = $state<ProjectBlueprint>(this.historyManager.current);
  selectedNodeId = $state<string | null>('30000000-0000-0000-0000-000000000002');
  hoverNodeId = $state<string | null>(null);
  activePageId = $state<string>('10000000-0000-0000-0000-000000000001');
  activeBreakpoint = $state<BreakpointKey>('desktop');
  zoom = $state<number>(100);
  isInteractiveMode = $state<boolean>(false);
  activeLeftTab = $state<'pages' | 'layers' | 'library' | 'tokens'>('layers');
  isSaving = $state<boolean>(false);
  lastSavedAt = $state<string>('Saved locally');
  snapshots = $state<ProjectSnapshot[]>([]);

  // Derived states (tracked via this.revision)
  canUndo = $derived.by(() => {
    void this.revision;
    return this.historyManager.canUndo;
  });

  canRedo = $derived.by(() => {
    void this.revision;
    return this.historyManager.canRedo;
  });

  undoCount = $derived.by(() => {
    void this.revision;
    return this.historyManager.pastCount;
  });

  redoCount = $derived.by(() => {
    void this.revision;
    return this.historyManager.futureCount;
  });

  activePage = $derived(
    this.blueprint.pages.find((p) => p.id === this.activePageId) || this.blueprint.pages[0]
  );

  activeLayout = $derived(
    this.activePage?.layoutId
      ? this.blueprint.layouts.find((l) => l.id === this.activePage.layoutId)
      : undefined
  );

  selectedNode = $derived.by<BlueprintNode | null>(() => {
    if (!this.selectedNodeId) return null;
    if (this.activePage) {
      const inPage = findNodeById(this.activePage.rootNode, this.selectedNodeId);
      if (inPage) return inPage;
    }
    for (const layout of this.blueprint.layouts) {
      const inLayout = findNodeById(layout.rootNode, this.selectedNodeId);
      if (inLayout) return inLayout;
    }
    return null;
  });

  selectedNodeBreadcrumb = $derived.by<BlueprintNode[]>(() => {
    if (!this.selectedNodeId) return [];
    if (this.activePage) {
      const pPath = findNodePath(this.activePage.rootNode, this.selectedNodeId);
      if (pPath) return pPath;
    }
    for (const layout of this.blueprint.layouts) {
      const lPath = findNodePath(layout.rootNode, this.selectedNodeId);
      if (lPath) return lPath;
    }
    return [];
  });

  preflightReport = $derived.by(() => validateBlueprintPreflight(this.blueprint));

  constructor() {
    if (typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
  }

  private hydrateFromStorage() {
    try {
      const rawBp = window.localStorage.getItem(STORAGE_KEY_BLUEPRINT);
      if (rawBp) {
        const parsed = ProjectBlueprintSchema.safeParse(JSON.parse(rawBp));
        if (parsed.success) {
          this.historyManager.reset(parsed.data);
          this.blueprint = parsed.data;
          this.activePageId = parsed.data.pages[0]?.id || this.activePageId;
          this.revision += 1;
        }
      }
      const rawSnaps = window.localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
      if (rawSnaps) {
        this.snapshots = JSON.parse(rawSnaps);
      }
    } catch {
      // Ignore corrupt storage
    }
  }

  dispatch(command: EditorCommand) {
    this.blueprint = this.historyManager.execute(command);
    this.revision += 1;
    this.triggerAutosave();
  }

  undo() {
    const prev = this.historyManager.undo();
    if (prev) {
      this.blueprint = prev;
      this.revision += 1;
      this.triggerAutosave();
    }
  }

  redo() {
    const next = this.historyManager.redo();
    if (next) {
      this.blueprint = next;
      this.revision += 1;
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

  loadStarterTemplate(template: 'acme-saas' | 'blank') {
    const nextBp =
      template === 'blank' ? createBlankProject('My New App') : createDefaultAcmeSaaSProject();
    this.historyManager.reset(nextBp);
    this.blueprint = nextBp;
    this.activePageId = nextBp.pages[0]?.id || '';
    this.selectedNodeId = nextBp.pages[0]?.rootNode.children[0]?.id || nextBp.pages[0]?.rootNode.id || null;
    this.revision += 1;
    this.triggerAutosave();
  }

  importBlueprintJson(jsonString: string): { ok: boolean; error?: string } {
    try {
      const raw = JSON.parse(jsonString);
      const parsed = ProjectBlueprintSchema.safeParse(raw);
      if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message || 'Invalid blueprint schema' };
      }
      this.historyManager.reset(parsed.data);
      this.blueprint = parsed.data;
      this.activePageId = parsed.data.pages[0]?.id || '';
      this.selectedNodeId = null;
      this.revision += 1;
      this.triggerAutosave();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  createSnapshot(label?: string) {
    const snap: ProjectSnapshot = {
      id: crypto.randomUUID(),
      label: label?.trim() || `Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      blueprint: structuredClone($state.snapshot(this.blueprint))
    };
    this.snapshots = [snap, ...this.snapshots].slice(0, 15);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(this.snapshots));
      } catch {
        // Ignore quota errors
      }
    }
  }

  restoreSnapshot(snapshotId: string) {
    const snap = this.snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;
    this.dispatch({ type: 'LOAD_BLUEPRINT', blueprint: snap.blueprint });
    this.activePageId = snap.blueprint.pages[0]?.id || '';
    this.selectedNodeId = null;
  }

  private triggerAutosave() {
    this.isSaving = true;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          STORAGE_KEY_BLUEPRINT,
          JSON.stringify($state.snapshot(this.blueprint))
        );
      } catch {
        // Ignore quota errors
      }
    }
    setTimeout(() => {
      this.isSaving = false;
      this.lastSavedAt = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }, 250);
  }

  async exportHandoffPackage(): Promise<void> {
    const generated = generateFullExport(this.blueprint);
    const zipBytes = await createDeterministicZip(generated);

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
