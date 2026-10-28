import {
  type ProjectBlueprint,
  type BreakpointKey,
  type BlueprintNode,
  type BlueprintAsset,
  createDefaultAcmeSaaSProject,
  createBlankProject,
  createNode,
  createId,
  validateBlueprintPreflight,
  composeNodesFromPrompt,
  MD3_THEME_PRESETS
} from '@app-viz/schema';
import {
  HistoryManager,
  type EditorCommand,
  findNodeById,
  findNodeParent,
  cloneSubtreeWithNewIds,
  isBlockedByLock
} from '@app-viz/engine';
import { z } from 'zod';
import { getAllManifests } from '@app-viz/components';
import { generateFullExport, createDeterministicZip } from '@app-viz/codegen';
import {
  ProjectStore,
  parseProjectFile,
  serializeProjectFile,
  summarize,
  type ProjectSummary,
  type SnapshotRecord,
  type SavedSymbol
} from '../persistence/project-store.js';

export type { SavedSymbol } from '../persistence/project-store.js';
export type ProjectSnapshot = SnapshotRecord;

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface StudioNotice {
  id: number;
  kind: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

const AUTOSAVE_DEBOUNCE_MS = 400;
const ACTIVE_PROJECT_KEY = 'activeProjectId';

/** Stable coalescing key so continuous edits of the same field collapse into one undo step. */
function coalesceKeyFor(command: EditorCommand): string | undefined {
  if (command.type === 'UPDATE_PROPS') {
    return `props:${command.nodeId}:${Object.keys(command.props).sort().join(',')}`;
  }
  if (command.type === 'UPDATE_STYLES') {
    return `styles:${command.nodeId}:${command.breakpoint}:${Object.keys(command.styles).sort().join(',')}`;
  }
  if (command.type === 'UPDATE_PAGE_META') {
    return `page:${command.pageId}:${Object.keys(command.meta).sort().join(',')}`;
  }
  if (command.type === 'UPDATE_PROJECT_META') {
    return `project:${Object.keys(command.meta).sort().join(',')}`;
  }
  return undefined;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking synchronously can cancel the download in Safari/Firefox.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

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
  private store: ProjectStore | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private saveChain: Promise<void> = Promise.resolve();
  private noticeSeq = 0;
  private channel: BroadcastChannel | null = null;
  private readonly tabId = createId();

  blueprint = $state<ProjectBlueprint>(this.historyManager.current);
  selectedNodeId = $state<string | null>('30000000-0000-0000-0000-000000000002');
  hoverNodeId = $state<string | null>(null);
  activePageId = $state<string>('10000000-0000-0000-0000-000000000001');
  activeBreakpoint = $state<BreakpointKey>('desktop');
  zoom = $state<number>(100);
  isInteractiveMode = $state<boolean>(false);
  canvasViewMode = $state<'canvas' | 'flow'>('canvas');
  showCommandPalette = $state<boolean>(false);
  showBlockLibraryModal = $state<boolean>(false);
  showNavigator = $state<boolean>(false);
  showExportDialog = $state<boolean>(false);
  showProjectLibrary = $state<boolean>(false);
  studioTheme = $state<'light' | 'dark'>('light');
  activeLeftTab = $state<'pages' | 'layers' | 'library' | 'assets' | 'tokens'>('library');
  /** True once persisted state has been loaded; the UI renders a skeleton until then. */
  ready = $state<boolean>(false);
  saveStatus = $state<SaveStatus>('idle');
  saveError = $state<string | null>(null);
  /** ISO timestamp of the last successful durable write. */
  lastSavedAt = $state<string | null>(null);
  storageDurable = $state<boolean>(true);
  projects = $state<ProjectSummary[]>([]);
  snapshots = $state<ProjectSnapshot[]>([]);
  notices = $state<StudioNotice[]>([]);
  /** Set when another tab saved a newer version of the open project. */
  externalChange = $state<boolean>(false);
  isSaving = $derived(this.saveStatus === 'saving');
  clipboardNode = $state<BlueprintNode | null>(null);
  clipboardStyles = $state<{
    styles: BlueprintNode['styles'];
    customClasses?: string;
    customCss?: string;
    motionEffects?: BlueprintNode['motionEffects'];
  } | null>(null);
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

  /**
   * Loads persisted projects. Must be called once from the client (the Studio route is
   * client-only, so this never races SSR hydration).
   */
  async init(): Promise<void> {
    if (this.store || typeof window === 'undefined') return;
    const store = new ProjectStore();
    this.store = store;
    this.storageDurable = store.durable;

    try {
      const legacy = await store.importLegacyLocalStorage();
      if (legacy.error) {
        this.notify('warning', `A previously saved project could not be read and was preserved for recovery (${legacy.error}).`);
      }

      this.projects = await store.listProjects();
      const preferredId =
        (await store.getSetting(ACTIVE_PROJECT_KEY, z.string())) ??
        legacy.importedProjectId ??
        this.projects[0]?.id;

      let opened = false;
      if (preferredId) opened = await this.openProject(preferredId, { silent: true });
      if (!opened) {
        await this.adoptBlueprint(createDefaultAcmeSaaSProject(), { persist: true });
      }

      const favs = await store.getFavorites();
      if (favs) this.favoriteComponents = favs;
      this.customSymbols = await store.getSymbols();
    } catch (e) {
      this.storageDurable = false;
      this.notify('error', `Local storage is unavailable; changes will not persist (${(e as Error).message}).`);
    }

    this.setupCrossTabSync();
    window.addEventListener('pagehide', () => void this.flushSave());
    window.addEventListener('beforeunload', (event) => {
      if (this.saveStatus === 'dirty' || this.saveStatus === 'saving' || this.saveStatus === 'error') {
        event.preventDefault();
      }
    });
    this.ready = true;
  }

  private setupCrossTabSync(): void {
    if (typeof BroadcastChannel === 'undefined') return;
    this.channel = new BroadcastChannel('app-viz-studio');
    this.channel.onmessage = (event: MessageEvent<{ type: string; projectId: string; tabId: string }>) => {
      const msg = event.data;
      if (!msg || msg.tabId === this.tabId) return;
      if (msg.type === 'saved' && msg.projectId === this.blueprint.meta.id) this.externalChange = true;
      if (msg.type === 'saved' || msg.type === 'deleted') void this.refreshProjects();
    };
  }

  notify(kind: StudioNotice['kind'], message: string, timeoutMs = kind === 'error' ? 9000 : 4000): void {
    const id = ++this.noticeSeq;
    this.notices = [...this.notices, { id, kind, message }].slice(-4);
    if (timeoutMs > 0) setTimeout(() => this.dismissNotice(id), timeoutMs);
  }

  dismissNotice(id: number): void {
    this.notices = this.notices.filter((n) => n.id !== id);
  }

  /**
   * Applies a command as an undoable step. Rapid edits to the same field (typing, dragging)
   * are coalesced into one undo step automatically. Mutations of locked nodes are refused.
   */
  dispatch(command: EditorCommand, options: { coalesce?: boolean } = {}): boolean {
    if (isBlockedByLock(this.historyManager.current, command)) {
      this.notify('warning', 'This element is locked. Unlock it in the Navigator or Advanced tab to edit it.');
      return false;
    }
    const before = this.historyManager.current;
    const coalesceKey = options.coalesce === false ? undefined : coalesceKeyFor(command);
    const after = this.historyManager.execute(command, { coalesceKey });
    if (after === before) return false;
    this.blueprint = after;
    this.revision += 1;
    this.reconcileSelection();
    this.scheduleSave();
    return true;
  }

  /** Runs several dispatches as one atomic undo step. */
  transact<T>(fn: () => T): T {
    this.historyManager.begin();
    try {
      return fn();
    } finally {
      this.historyManager.commit();
      this.revision += 1;
    }
  }

  /** Call when a continuous edit ends (blur, pointerup) so the next edit starts a new undo step. */
  endContinuousEdit(): void {
    this.historyManager.breakCoalescing();
  }

  undo() {
    const prev = this.historyManager.undo();
    if (prev) {
      this.blueprint = prev;
      this.revision += 1;
      this.reconcileSelection();
      this.scheduleSave();
    }
  }

  redo() {
    const next = this.historyManager.redo();
    if (next) {
      this.blueprint = next;
      this.revision += 1;
      this.reconcileSelection();
      this.scheduleSave();
    }
  }

  /** Keeps active page / selection pointing at things that still exist after any change. */
  private reconcileSelection(): void {
    if (!this.blueprint.pages.some((p) => p.id === this.activePageId)) {
      this.activePageId = this.blueprint.pages[0]?.id ?? '';
    }
    if (this.selectedNodeId && !this.findNodeAnywhere(this.selectedNodeId)) {
      this.selectedNodeId = null;
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

  toggleStudioTheme() {
    this.studioTheme = this.studioTheme === 'light' ? 'dark' : 'light';
  }

  // Structural & Clipboard Operations
  copySelectedNode() {
    if (!this.selectedNode) return;
    this.clipboardNode = structuredClone($state.snapshot(this.selectedNode));
  }

  copyNodeStyle(nodeId?: string) {
    const target = nodeId ? this.findNodeAnywhere(nodeId) : this.selectedNode;
    if (!target) return;
    this.clipboardStyles = structuredClone({
      styles: $state.snapshot(target.styles || { base: {} }),
      customClasses: target.customClasses || '',
      customCss: target.customCss || '',
      motionEffects: target.motionEffects
        ? $state.snapshot(target.motionEffects)
        : undefined
    });
  }

  pasteNodeStyle(targetNodeId?: string) {
    const id = targetNodeId || this.selectedNodeId;
    if (!id || !this.clipboardStyles) return;
    this.dispatch({
      type: 'PASTE_NODE_STYLE',
      nodeId: id,
      styles: this.clipboardStyles.styles,
      customClasses: this.clipboardStyles.customClasses,
      customCss: this.clipboardStyles.customCss,
      motionEffects: this.clipboardStyles.motionEffects
    });
  }

  resetNodeStyle(targetNodeId?: string) {
    const id = targetNodeId || this.selectedNodeId;
    if (!id) return;
    this.dispatch({
      type: 'RESET_NODE_STYLE',
      nodeId: id
    });
  }

  alignNode(
    targetNodeId: string | undefined,
    alignment: 'left' | 'center' | 'right' | 'stretch'
  ) {
    this.transact(() => this.applyAlignment(targetNodeId, alignment));
  }

  private applyAlignment(
    targetNodeId: string | undefined,
    alignment: 'left' | 'center' | 'right' | 'stretch'
  ) {
    const id = targetNodeId || this.selectedNodeId;
    if (!id) return;
    const node = this.findNodeAnywhere(id);
    if (!node) return;

    const flexAlign =
      alignment === 'center'
        ? 'center'
        : alignment === 'right'
          ? 'flex-end'
          : alignment === 'stretch'
            ? 'stretch'
            : 'flex-start';
    const gridAlign =
      alignment === 'center'
        ? 'center'
        : alignment === 'right'
          ? 'end'
          : alignment === 'stretch'
            ? 'stretch'
            : 'start';
    const textAlignVal =
      alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left';

    if (
      node.componentType === 'structure/container' ||
      node.componentType === 'structure/section'
    ) {
      const currentDir =
        (node.props?.direction as string) ||
        (node.styles?.base?.flexDirection as string) ||
        'column';
      this.dispatch({
        type: 'UPDATE_PROPS',
        nodeId: node.id,
        props: {
          direction: currentDir,
          align: flexAlign,
          justify: alignment === 'center' ? 'center' : flexAlign === 'stretch' ? 'flex-start' : flexAlign,
          textAlign: textAlignVal
        }
      });
      this.dispatch({
        type: 'UPDATE_STYLES',
        nodeId: node.id,
        breakpoint: 'base',
        styles: {
          display: 'flex',
          flexDirection: currentDir,
          alignItems: flexAlign,
          justifyContent:
            alignment === 'center' ? 'center' : flexAlign === 'stretch' ? 'flex-start' : flexAlign,
          textAlign: textAlignVal
        }
      });
    } else if (node.componentType === 'structure/grid') {
      this.dispatch({
        type: 'UPDATE_PROPS',
        nodeId: node.id,
        props: {
          alignItems: gridAlign,
          justifyItems: gridAlign,
          textAlign: textAlignVal
        }
      });
      this.dispatch({
        type: 'UPDATE_STYLES',
        nodeId: node.id,
        breakpoint: 'base',
        styles: {
          alignItems: gridAlign,
          justifyItems: gridAlign,
          textAlign: textAlignVal
        }
      });
    } else {
      if (node.componentType === 'hero/split-hero' || node.componentType === 'ui/card') {
        this.dispatch({
          type: 'UPDATE_PROPS',
          nodeId: node.id,
          props: { align: textAlignVal }
        });
      }
      this.dispatch({
        type: 'UPDATE_STYLES',
        nodeId: node.id,
        breakpoint: 'base',
        styles: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: flexAlign,
          justifyContent: alignment === 'center' ? 'center' : flexAlign,
          textAlign: textAlignVal,
          alignSelf: flexAlign,
          marginLeft: alignment === 'center' || alignment === 'right' ? 'auto' : '0',
          marginRight: alignment === 'center' || alignment === 'left' ? 'auto' : '0',
          ...(alignment === 'stretch' ? { width: '100%' } : {})
        }
      });
    }
  }

  insertContainerStructure(structureId: string, targetNodeId?: string) {
    if (!this.activePage) return;
    const parentId = targetNodeId || this.activePage.rootNode.id;

    const makeCol = (name: string, widthPct?: string): BlueprintNode => ({
      id: crypto.randomUUID(),
      componentType: 'structure/container',
      name,
      props: {
        maxWidth: 'full',
        direction: 'column',
        justify: 'flex-start',
        align: 'stretch',
        textAlign: 'left',
        gap: '1rem'
      },
      styles: {
        base: {
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.25rem',
          borderRadius: '12px',
          ...(widthPct ? { flex: `1 1 ${widthPct}` } : { flex: '1 1 0%' })
        }
      },
      interactions: [],
      children: [],
      locked: false,
      hidden: false,
      customClasses: '',
      customCss: ''
    });

    let rootSection: BlueprintNode;

    if (structureId === 'flex-1col') {
      rootSection = {
        id: crypto.randomUUID(),
        componentType: 'structure/section',
        name: '1-Column Flexbox Section',
        props: { surfaceTone: 'surface', paddingY: 'lg', maxWidth: 'xl' },
        styles: {
          base: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }
        },
        interactions: [],
        children: [makeCol('Main Column (100%)', '100%')],
        locked: false,
        hidden: false,
        customClasses: '',
        customCss: ''
      };
    } else if (structureId === 'flex-2col-50-50') {
      rootSection = {
        id: crypto.randomUUID(),
        componentType: 'structure/section',
        name: '2-Column Flexbox (50% / 50%)',
        props: { surfaceTone: 'surface', paddingY: 'lg', maxWidth: 'xl' },
        styles: { base: {} },
        interactions: [],
        children: [
          {
            id: crypto.randomUUID(),
            componentType: 'structure/grid',
            name: '2-Col Row (50/50)',
            props: { columns: 2, gap: 'lg' },
            styles: { base: {} },
            interactions: [],
            children: [makeCol('Left Column (50%)'), makeCol('Right Column (50%)')],
            locked: false,
            hidden: false,
            customClasses: '',
            customCss: ''
          }
        ],
        locked: false,
        hidden: false,
        customClasses: '',
        customCss: ''
      };
    } else if (structureId === 'flex-2col-33-67') {
      rootSection = {
        id: crypto.randomUUID(),
        componentType: 'structure/section',
        name: '2-Column Flexbox (33% / 67%)',
        props: { surfaceTone: 'surface', paddingY: 'lg', maxWidth: 'xl' },
        styles: { base: {} },
        interactions: [],
        children: [
          {
            id: crypto.randomUUID(),
            componentType: 'structure/container',
            name: 'Asymmetric Row (33/67)',
            props: { maxWidth: 'xl' },
            styles: {
              base: {
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '1.5rem',
                alignItems: 'stretch'
              }
            },
            interactions: [],
            children: [makeCol('Sidebar Column (33%)'), makeCol('Content Column (67%)')],
            locked: false,
            hidden: false,
            customClasses: '',
            customCss: ''
          }
        ],
        locked: false,
        hidden: false,
        customClasses: '',
        customCss: ''
      };
    } else if (structureId === 'flex-2col-67-33') {
      rootSection = {
        id: crypto.randomUUID(),
        componentType: 'structure/section',
        name: '2-Column Flexbox (67% / 33%)',
        props: { surfaceTone: 'surface', paddingY: 'lg', maxWidth: 'xl' },
        styles: { base: {} },
        interactions: [],
        children: [
          {
            id: crypto.randomUUID(),
            componentType: 'structure/container',
            name: 'Asymmetric Row (67/33)',
            props: { maxWidth: 'xl' },
            styles: {
              base: {
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                alignItems: 'stretch'
              }
            },
            interactions: [],
            children: [makeCol('Content Column (67%)'), makeCol('Sidebar Column (33%)')],
            locked: false,
            hidden: false,
            customClasses: '',
            customCss: ''
          }
        ],
        locked: false,
        hidden: false,
        customClasses: '',
        customCss: ''
      };
    } else if (structureId === 'flex-3col') {
      rootSection = {
        id: crypto.randomUUID(),
        componentType: 'structure/section',
        name: '3-Column Container (33% / 33% / 33%)',
        props: { surfaceTone: 'surface', paddingY: 'lg', maxWidth: 'xl' },
        styles: { base: {} },
        interactions: [],
        children: [
          {
            id: crypto.randomUUID(),
            componentType: 'structure/grid',
            name: '3-Col Grid',
            props: { columns: 3, gap: 'md' },
            styles: { base: {} },
            interactions: [],
            children: [makeCol('Column 1'), makeCol('Column 2'), makeCol('Column 3')],
            locked: false,
            hidden: false,
            customClasses: '',
            customCss: ''
          }
        ],
        locked: false,
        hidden: false,
        customClasses: '',
        customCss: ''
      };
    } else {
      rootSection = {
        id: crypto.randomUUID(),
        componentType: 'structure/section',
        name: '4-Column Container (25% × 4)',
        props: { surfaceTone: 'surface', paddingY: 'lg', maxWidth: 'xl' },
        styles: { base: {} },
        interactions: [],
        children: [
          {
            id: crypto.randomUUID(),
            componentType: 'structure/grid',
            name: '4-Col Grid',
            props: { columns: 4, gap: 'md' },
            styles: { base: {} },
            interactions: [],
            children: [
              makeCol('Column 1'),
              makeCol('Column 2'),
              makeCol('Column 3'),
              makeCol('Column 4')
            ],
            locked: false,
            hidden: false,
            customClasses: '',
            customCss: ''
          }
        ],
        locked: false,
        hidden: false,
        customClasses: '',
        customCss: ''
      };
    }

    this.dispatch({
      type: 'INSERT_NODE',
      targetParentId: parentId,
      node: rootSection
    });
    this.selectNode(rootSection.id);
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
    if (this.dispatch({ type: 'DELETE_NODE', nodeId: this.selectedNodeId })) this.selectNode(null);
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

  /**
   * Inserts a fresh instance of a registry component into the selected container (or after
   * the selected element, or at the end of the page). Returns the new node id.
   */
  insertComponent(componentType: string): string | null {
    const page = this.activePage;
    const manifest = getAllManifests().find((m) => m.type === componentType);
    if (!page || !manifest) return null;
    const node = createNode({
      componentType: manifest.type,
      name: manifest.displayName,
      props: structuredClone(manifest.defaultProps)
    });
    const selected = this.selectedNode;
    let targetParentId = page.rootNode.id;
    let index: number | undefined;
    if (selected && isContainerComponent(selected.componentType) && !selected.locked) {
      targetParentId = selected.id;
    } else if (selected) {
      const parentInfo = this.findParentAnywhere(selected.id);
      if (parentInfo) {
        targetParentId = parentInfo.parent.id;
        index = parentInfo.index + 1;
      }
    }
    if (!this.dispatch({ type: 'INSERT_NODE', targetParentId, index, node }, { coalesce: false })) return null;
    this.selectNode(node.id);
    return node.id;
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

    const newNode = createNode({
      componentType: manifest.type,
      name: manifest.displayName,
      props: structuredClone(manifest.defaultProps)
    });

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
    void this.store?.setSetting('favorites', $state.snapshot(this.favoriteComponents)).catch(() => {});
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
      createdAt: new Date().toISOString(),
      node: cloned
    };
    this.customSymbols = [sym, ...this.customSymbols];
    this.persistSymbols();
    this.notify('success', `Saved "${sym.name}" to your template library.`);
  }

  private persistSymbols(): void {
    void this.store
      ?.setSetting('symbols', $state.snapshot(this.customSymbols))
      .catch((e: Error) => this.notify('error', `Could not save template library: ${e.message}`));
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
    this.persistSymbols();
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

    const preset =
      applySuggestedTheme && result.suggestedThemeId ? MD3_THEME_PRESETS[result.suggestedThemeId] : undefined;
    this.dispatch({
      type: 'BATCH',
      label: `AI compose: ${prompt.slice(0, 40)}`,
      commands: [
        ...result.nodes.map((node) => ({ type: 'INSERT_NODE' as const, targetParentId, node })),
        ...(preset ? [{ type: 'UPDATE_TOKENS' as const, tokens: { colors: { ...preset.colors } } }] : [])
      ]
    });

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
      const cardNode = createNode({
        componentType: 'ui/card',
        name: `${asset.filename} Card`,
        props: {
          variant: 'outlined',
          eyebrow: asset.category?.toUpperCase() || 'ASSET',
          title: asset.alt || asset.filename,
          body: `Bundled static path: ${asset.localPath}`,
          ctaText: 'Explore',
          ctaHref: '#'
        }
      });
      this.dispatch({
        type: 'INSERT_NODE',
        targetParentId: this.activePage.rootNode.id,
        node: cardNode
      });
      this.selectNode(cardNode.id);
    }
  }

  // ---------------------------------------------------------------------------
  // Project library (multiple saved projects, IndexedDB-backed)
  // ---------------------------------------------------------------------------

  async refreshProjects(): Promise<void> {
    if (this.store) this.projects = await this.store.listProjects();
  }

  /** Swaps the open document. Never destroys data: the outgoing project is flushed first. */
  private async adoptBlueprint(bp: ProjectBlueprint, opts: { persist?: boolean } = {}): Promise<void> {
    this.historyManager.reset(bp);
    this.blueprint = this.historyManager.current;
    this.activePageId = bp.pages[0]?.id ?? '';
    this.selectedNodeId = null;
    this.externalChange = false;
    this.revision += 1;
    if (this.store) {
      this.snapshots = await this.store.listSnapshots(bp.meta.id);
      await this.store.setSetting(ACTIVE_PROJECT_KEY, bp.meta.id).catch(() => {});
    }
    if (opts.persist) await this.saveNow();
  }

  async openProject(id: string, opts: { silent?: boolean } = {}): Promise<boolean> {
    if (!this.store) return false;
    await this.flushSave();
    const result = await this.store.loadProject(id);
    if (!result.ok) {
      if (!opts.silent) this.notify('error', `Could not open project: ${result.error}`);
      else this.notify('warning', `Your last project could not be opened and was preserved for recovery (${result.error}).`);
      return false;
    }
    await this.adoptBlueprint(result.blueprint, { persist: Boolean(result.migratedFrom) });
    if (result.migratedFrom) {
      this.notify('info', `Upgraded "${result.blueprint.meta.name}" from schema v${result.migratedFrom}.`);
    } else if (!opts.silent) {
      this.notify('success', `Opened "${result.blueprint.meta.name}".`);
    }
    return true;
  }

  async newProject(template: 'acme-saas' | 'blank', name?: string): Promise<void> {
    await this.flushSave();
    const bp =
      template === 'blank'
        ? createBlankProject(name?.trim() || 'Untitled App')
        : this.withFreshIdentity(createDefaultAcmeSaaSProject(), name?.trim() || 'Acme SaaS');
    await this.adoptBlueprint(bp, { persist: true });
    this.notify('success', `Created "${bp.meta.name}". Your previous project is still in the library.`);
  }

  /** Gives a template a unique project id/name so it never overwrites an existing save. */
  private withFreshIdentity(bp: ProjectBlueprint, name: string): ProjectBlueprint {
    const now = new Date().toISOString();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
    return { ...bp, meta: { ...bp.meta, id: createId(), name, slug, createdAt: now, updatedAt: now } };
  }

  async duplicateProject(id?: string): Promise<void> {
    if (!this.store) return;
    await this.flushSave();
    const source = id && id !== this.blueprint.meta.id ? await this.store.loadProject(id) : null;
    const base = source?.ok ? source.blueprint : ($state.snapshot(this.blueprint) as ProjectBlueprint);
    const copy = this.withFreshIdentity(structuredClone(base), `${base.meta.name} (Copy)`);
    await this.adoptBlueprint(copy, { persist: true });
    this.notify('success', `Duplicated as "${copy.meta.name}".`);
  }

  renameProject(name: string): void {
    const trimmed = name.trim();
    if (!trimmed || trimmed === this.blueprint.meta.name) return;
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || this.blueprint.meta.slug;
    this.dispatch({ type: 'UPDATE_PROJECT_META', meta: { name: trimmed, slug } }, { coalesce: false });
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.store) return;
    const isOpen = id === this.blueprint.meta.id;
    await this.store.deleteProject(id);
    this.channel?.postMessage({ type: 'deleted', projectId: id, tabId: this.tabId });
    await this.refreshProjects();
    if (isOpen) {
      const next = this.projects[0];
      if (!next || !(await this.openProject(next.id, { silent: true }))) {
        await this.adoptBlueprint(createBlankProject('Untitled App'), { persist: true });
      }
    }
    this.notify('info', 'Project deleted.');
  }

  /** Imports a `.appviz.json` file or raw blueprint JSON as a NEW library project. */
  async importProjectFile(text: string): Promise<{ ok: boolean; error?: string }> {
    const result = parseProjectFile(text);
    if (!result.ok) return { ok: false, error: result.error };
    await this.flushSave();
    let bp = result.blueprint;
    if (this.projects.some((p) => p.id === bp.meta.id)) {
      bp = this.withFreshIdentity(bp, `${bp.meta.name} (Imported)`);
    }
    await this.adoptBlueprint(bp, { persist: true });
    this.notify(
      'success',
      result.migratedFrom
        ? `Imported "${bp.meta.name}" (upgraded from schema v${result.migratedFrom}).`
        : `Imported "${bp.meta.name}".`
    );
    return { ok: true };
  }

  /** Back-compat alias used by older UI. */
  importBlueprintJson(jsonString: string): Promise<{ ok: boolean; error?: string }> {
    return this.importProjectFile(jsonString);
  }

  exportProjectFile(): void {
    const json = serializeProjectFile($state.snapshot(this.blueprint) as ProjectBlueprint);
    downloadBlob(new Blob([json], { type: 'application/json' }), `${this.blueprint.meta.slug}.appviz.json`);
  }

  async reloadFromStorage(): Promise<void> {
    this.externalChange = false;
    await this.openProject(this.blueprint.meta.id, { silent: true });
  }

  // ---------------------------------------------------------------------------
  // Version history (named snapshots, per project)
  // ---------------------------------------------------------------------------

  async createSnapshot(label?: string): Promise<void> {
    if (!this.store) return;
    const name =
      label?.trim() ||
      `Snapshot ${new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`;
    try {
      await this.store.addSnapshot($state.snapshot(this.blueprint) as ProjectBlueprint, name);
      this.snapshots = await this.store.listSnapshots(this.blueprint.meta.id);
      this.notify('success', `Saved version "${name}".`);
    } catch (e) {
      this.notify('error', `Could not save version: ${(e as Error).message}`);
    }
  }

  /** Restores a snapshot as an undoable change (Cmd+Z brings the current state back). */
  restoreSnapshot(snapshotId: string): void {
    const snap = this.snapshots.find((s) => s.id === snapshotId);
    if (!snap) return;
    this.dispatch({ type: 'LOAD_BLUEPRINT', blueprint: structuredClone(snap.blueprint) }, { coalesce: false });
    this.activePageId = snap.blueprint.pages[0]?.id || '';
    this.selectedNodeId = null;
    this.notify('info', `Restored "${snap.label}". Press ⌘Z to undo.`);
  }

  async deleteSnapshot(snapshotId: string): Promise<void> {
    if (!this.store) return;
    await this.store.deleteSnapshot(snapshotId);
    this.snapshots = this.snapshots.filter((s) => s.id !== snapshotId);
  }

  // ---------------------------------------------------------------------------
  // Autosave
  // ---------------------------------------------------------------------------

  private scheduleSave(): void {
    if (!this.store) return;
    this.saveStatus = 'dirty';
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => void this.saveNow(), AUTOSAVE_DEBOUNCE_MS);
  }

  /** Writes immediately if there are pending changes. */
  async flushSave(): Promise<void> {
    if (this.saveTimer || this.saveStatus === 'dirty' || this.saveStatus === 'error') await this.saveNow();
    else await this.saveChain;
  }

  /** Serialized durable write. `lastSavedAt` only advances when the write really succeeded. */
  saveNow(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const store = this.store;
    if (!store) return Promise.resolve();
    const doc = $state.snapshot(this.blueprint) as ProjectBlueprint;
    this.saveChain = this.saveChain.then(async () => {
      this.saveStatus = 'saving';
      try {
        await store.saveProject(doc);
        this.saveStatus = 'saved';
        this.saveError = null;
        this.lastSavedAt = new Date().toISOString();
        const summary = summarize(doc);
        this.projects = [summary, ...this.projects.filter((p) => p.id !== summary.id)];
        this.channel?.postMessage({ type: 'saved', projectId: doc.meta.id, tabId: this.tabId });
      } catch (e) {
        this.saveStatus = 'error';
        this.saveError = (e as Error).message || 'Unknown storage error';
        this.notify('error', `Changes are NOT saved: ${this.saveError}. Export a project file to be safe.`, 0);
      }
    });
    return this.saveChain;
  }

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  async exportHandoffPackage(): Promise<void> {
    const generated = generateFullExport($state.snapshot(this.blueprint) as ProjectBlueprint);
    const zipBytes = await createDeterministicZip(generated);
    downloadBlob(new Blob([zipBytes as BlobPart], { type: 'application/zip' }), `${this.blueprint.meta.slug}-sveltekit.zip`);
  }

  downloadBlueprintJson(): void {
    this.exportProjectFile();
  }
}

export const editor = new EditorState();
