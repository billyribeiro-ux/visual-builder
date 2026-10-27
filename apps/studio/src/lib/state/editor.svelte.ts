import {
  type ProjectBlueprint,
  type BreakpointKey,
  type BlueprintNode,
  type BlueprintAsset,
  ProjectBlueprintSchema,
  createDefaultAcmeSaaSProject,
  createBlankProject,
  validateBlueprintPreflight,
  composeNodesFromPrompt,
  MD3_THEME_PRESETS
} from '@app-viz/schema';
import {
  HistoryManager,
  type EditorCommand,
  findNodeById,
  findNodeParent,
  cloneSubtreeWithNewIds
} from '@app-viz/engine';
import { getAllManifests } from '@app-viz/components';
import { generateFullExport, createDeterministicZip } from '@app-viz/codegen';

export interface ProjectSnapshot {
  id: string;
  label: string;
  createdAt: string;
  blueprint: ProjectBlueprint;
}

export interface SavedSymbol {
  id: string;
  name: string;
  componentType: string;
  createdAt: string;
  node: BlueprintNode;
}

const STORAGE_KEY_BLUEPRINT = 'app-viz-studio-blueprint-v1';
const STORAGE_KEY_SNAPSHOTS = 'app-viz-studio-snapshots-v1';
const STORAGE_KEY_FAVORITES = 'app-viz-studio-favorites-v1';
const STORAGE_KEY_SYMBOLS = 'app-viz-studio-symbols-v1';

function findNodePath(root: BlueprintNode, targetId: string): BlueprintNode[] | null {
  if (root.id === targetId) return [root];
  for (const child of root.children || []) {
    const subPath = findNodePath(child, targetId);
    if (subPath) return [root, ...subPath];
  }
  return null;
}

export function isContainerComponent(componentType: string): boolean {
  return (
    componentType === 'structure/container' ||
    componentType === 'structure/section' ||
    componentType === 'structure/grid' ||
    componentType === 'app/dashboard-shell'
  );
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
  canvasViewMode = $state<'canvas' | 'flow'>('canvas');
  showCommandPalette = $state<boolean>(false);
  activeLeftTab = $state<'pages' | 'layers' | 'library' | 'assets' | 'tokens'>('layers');
  isSaving = $state<boolean>(false);
  lastSavedAt = $state<string>('Saved locally');
  snapshots = $state<ProjectSnapshot[]>([]);
  clipboardNode = $state<BlueprintNode | null>(null);
  favoriteComponents = $state<string[]>([
    'hero/split-hero',
    'marketing/feature-grid',
    'marketing/pricing-table',
    'app/kpi-grid',
    'app/data-table'
  ]);
  customSymbols = $state<SavedSymbol[]>([]);

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
      const rawFavs = window.localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (rawFavs) {
        this.favoriteComponents = JSON.parse(rawFavs);
      }
      const rawSyms = window.localStorage.getItem(STORAGE_KEY_SYMBOLS);
      if (rawSyms) {
        this.customSymbols = JSON.parse(rawSyms);
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

  // Structural & Clipboard Operations
  copySelectedNode() {
    if (!this.selectedNode) return;
    this.clipboardNode = structuredClone($state.snapshot(this.selectedNode));
  }

  pasteNode(targetNodeId?: string) {
    if (!this.clipboardNode || !this.activePage) return;
    const cloned = cloneSubtreeWithNewIds(this.clipboardNode);
    const baseTargetId = targetNodeId || this.selectedNodeId || this.activePage.rootNode.id;
    const targetNode = this.findNodeAnywhere(baseTargetId);

    if (targetNode && isContainerComponent(targetNode.componentType)) {
      this.dispatch({
        type: 'INSERT_NODE',
        targetParentId: targetNode.id,
        node: cloned
      });
      this.selectNode(cloned.id);
      return;
    }

    const parentInfo = this.findParentAnywhere(baseTargetId);
    if (parentInfo) {
      this.dispatch({
        type: 'INSERT_NODE',
        targetParentId: parentInfo.parent.id,
        index: parentInfo.index + 1,
        node: cloned
      });
      this.selectNode(cloned.id);
    } else {
      this.dispatch({
        type: 'INSERT_NODE',
        targetParentId: this.activePage.rootNode.id,
        node: cloned
      });
      this.selectNode(cloned.id);
    }
  }

  duplicateSelectedNode() {
    if (!this.selectedNodeId) return;
    this.dispatch({ type: 'DUPLICATE_NODE', nodeId: this.selectedNodeId });
  }

  deleteSelectedNode() {
    if (!this.selectedNodeId) return;
    const id = this.selectedNodeId;
    this.dispatch({ type: 'DELETE_NODE', nodeId: id });
    this.selectNode(null);
  }

  reorderSelectedNode(direction: 'up' | 'down') {
    if (!this.selectedNodeId) return;
    this.dispatch({ type: 'REORDER_NODE', nodeId: this.selectedNodeId, direction });
  }

  wrapNode(
    nodeId: string,
    wrapperType: 'structure/container' | 'structure/section' | 'structure/grid' = 'structure/section'
  ) {
    const wrapperId = crypto.randomUUID();
    this.dispatch({ type: 'WRAP_NODE', nodeId, wrapperId, wrapperType });
    this.selectNode(wrapperId);
  }

  unwrapNode(nodeId: string) {
    this.dispatch({ type: 'UNWRAP_NODE', nodeId });
  }

  private findNodeAnywhere(nodeId: string): BlueprintNode | null {
    for (const page of this.blueprint.pages) {
      const found = findNodeById(page.rootNode, nodeId);
      if (found) return found;
    }
    for (const layout of this.blueprint.layouts) {
      const found = findNodeById(layout.rootNode, nodeId);
      if (found) return found;
    }
    return null;
  }

  private findParentAnywhere(
    nodeId: string
  ): { parent: BlueprintNode; index: number } | null {
    for (const page of this.blueprint.pages) {
      const found = findNodeParent(page.rootNode, nodeId);
      if (found) return found;
    }
    for (const layout of this.blueprint.layouts) {
      const found = findNodeParent(layout.rootNode, nodeId);
      if (found) return found;
    }
    return null;
  }

  private resolveDropTarget(
    targetNodeId: string,
    position: 'before' | 'inside' | 'after'
  ): { targetParentId: string; index?: number } | null {
    const targetNode = this.findNodeAnywhere(targetNodeId);
    if (!targetNode) return null;

    if (position === 'inside' && isContainerComponent(targetNode.componentType)) {
      return { targetParentId: targetNode.id, index: undefined };
    }

    const parentInfo = this.findParentAnywhere(targetNodeId);
    if (parentInfo) {
      const index = position === 'before' ? parentInfo.index : parentInfo.index + 1;
      return { targetParentId: parentInfo.parent.id, index };
    }

    if (isContainerComponent(targetNode.componentType)) {
      return {
        targetParentId: targetNode.id,
        index: position === 'before' ? 0 : undefined
      };
    }

    return this.activePage ? { targetParentId: this.activePage.rootNode.id } : null;
  }

  dropComponentOnTarget(
    componentType: string,
    targetNodeId: string,
    position: 'before' | 'inside' | 'after' = 'after'
  ) {
    const manifest = getAllManifests().find((m) => m.type === componentType);
    if (!manifest) return;

    const resolved = this.resolveDropTarget(targetNodeId, position);
    if (!resolved) return;

    const newNode: BlueprintNode = {
      id: crypto.randomUUID(),
      componentType: manifest.type,
      name: manifest.displayName,
      props: JSON.parse(JSON.stringify(manifest.defaultProps)),
      styles: { base: {} },
      interactions: [],
      children: [],
      locked: false,
      hidden: false,
      customClasses: ''
    };

    this.dispatch({
      type: 'INSERT_NODE',
      targetParentId: resolved.targetParentId,
      index: resolved.index,
      node: newNode
    });
    this.selectNode(newNode.id);
  }

  dropNodeOnTarget(
    draggedNodeId: string,
    targetNodeId: string,
    position: 'before' | 'inside' | 'after' = 'after'
  ) {
    if (!draggedNodeId || draggedNodeId === targetNodeId) return;
    const resolved = this.resolveDropTarget(targetNodeId, position);
    if (!resolved) return;

    this.dispatch({
      type: 'MOVE_NODE',
      nodeId: draggedNodeId,
      targetParentId: resolved.targetParentId,
      newIndex: resolved.index
    });
    this.selectNode(draggedNodeId);
  }

  // Favorites & Custom Reusable Symbols
  toggleFavorite(componentType: string) {
    if (this.favoriteComponents.includes(componentType)) {
      this.favoriteComponents = this.favoriteComponents.filter((t) => t !== componentType);
    } else {
      this.favoriteComponents = [...this.favoriteComponents, componentType];
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(this.favoriteComponents));
      } catch {
        // Ignore quota error
      }
    }
  }

  saveSelectedNodeAsSymbol(customName?: string) {
    if (!this.selectedNode) return;
    const cloned = cloneSubtreeWithNewIds(
      structuredClone($state.snapshot(this.selectedNode))
    );
    const sym: SavedSymbol = {
      id: crypto.randomUUID(),
      name: customName?.trim() || `${this.selectedNode.name} Symbol`,
      componentType: this.selectedNode.componentType,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      node: cloned
    };
    this.customSymbols = [sym, ...this.customSymbols];
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(this.customSymbols));
      } catch {
        // Ignore quota error
      }
    }
  }

  insertSymbol(symbolId: string) {
    if (!this.activePage) return;
    const sym = this.customSymbols.find((s) => s.id === symbolId);
    if (!sym) return;
    const cloned = cloneSubtreeWithNewIds(sym.node);
    const selected = this.selectedNode;
    const targetParentId =
      selected && isContainerComponent(selected.componentType)
        ? selected.id
        : this.activePage.rootNode.id;

    this.dispatch({
      type: 'INSERT_NODE',
      targetParentId,
      node: cloned
    });
    this.selectNode(cloned.id);
  }

  deleteSymbol(symbolId: string) {
    this.customSymbols = this.customSymbols.filter((s) => s.id !== symbolId);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEY_SYMBOLS, JSON.stringify(this.customSymbols));
      } catch {
        // Ignore quota error
      }
    }
  }

  // Prompt-to-Blueprint AI Section Composer
  composeFromPrompt(prompt: string, applySuggestedTheme = false): { summary: string; count: number } {
    if (!this.activePage || !prompt.trim()) {
      return { summary: 'No active page', count: 0 };
    }
    const result = composeNodesFromPrompt(prompt);
    const selected = this.selectedNode;
    const targetParentId =
      selected && isContainerComponent(selected.componentType)
        ? selected.id
        : this.activePage.rootNode.id;

    for (const node of result.nodes) {
      this.dispatch({
        type: 'INSERT_NODE',
        targetParentId,
        node
      });
    }

    if (applySuggestedTheme && result.suggestedThemeId) {
      const preset = MD3_THEME_PRESETS[result.suggestedThemeId];
      if (preset) {
        this.dispatch({
          type: 'UPDATE_TOKENS',
          tokens: { colors: { ...preset.colors } }
        });
      }
    }

    if (result.nodes.length > 0) {
      this.selectNode(result.nodes[result.nodes.length - 1].id);
    }

    return { summary: result.summary, count: result.nodes.length };
  }

  // Project Asset & Media Management
  addAsset(asset: BlueprintAsset) {
    this.dispatch({ type: 'ADD_ASSET', asset });
  }

  deleteAsset(assetId: string) {
    this.dispatch({ type: 'DELETE_ASSET', assetId });
  }

  applyAssetToSelectedNode(asset: BlueprintAsset) {
    const urlValue = asset.dataUrl || asset.localPath;
    if (this.selectedNode) {
      const ct = this.selectedNode.componentType;
      if (ct === 'navigation/navbar') {
        this.dispatch({
          type: 'UPDATE_PROPS',
          nodeId: this.selectedNode.id,
          props: { logoUrl: urlValue }
        });
        return;
      }
      // For any other selected node, set backgroundImage or imageUrl prop
      this.dispatch({
        type: 'UPDATE_PROPS',
        nodeId: this.selectedNode.id,
        props: { imageUrl: urlValue, imageAlt: asset.alt }
      });
    } else if (this.activePage) {
      // Insert a Card showcasing the asset
      const cardNode: BlueprintNode = {
        id: crypto.randomUUID(),
        componentType: 'ui/card',
        name: `${asset.filename} Card`,
        props: {
          variant: 'outlined',
          eyebrow: asset.category?.toUpperCase() || 'ASSET',
          title: asset.alt || asset.filename,
          body: `Bundled static path: ${asset.localPath}`,
          actionText: 'Explore',
          actionHref: '#'
        },
        styles: { base: {} },
        interactions: [],
        children: [],
        locked: false,
        hidden: false,
        customClasses: ''
      };
      this.dispatch({
        type: 'INSERT_NODE',
        targetParentId: this.activePage.rootNode.id,
        node: cardNode
      });
      this.selectNode(cardNode.id);
    }
  }

  loadStarterTemplate(template: 'acme-saas' | 'blank') {
    const nextBp =
      template === 'blank' ? createBlankProject('My New App') : createDefaultAcmeSaaSProject();
    this.historyManager.reset(nextBp);
    this.blueprint = nextBp;
    this.activePageId = nextBp.pages[0]?.id || '';
    this.selectedNodeId =
      nextBp.pages[0]?.rootNode.children[0]?.id || nextBp.pages[0]?.rootNode.id || null;
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
      label:
        label?.trim() ||
        `Snapshot (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
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
