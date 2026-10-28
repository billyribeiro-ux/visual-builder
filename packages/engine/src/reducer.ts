import type { ProjectBlueprint, BlueprintNode } from '@app-viz/schema';
import type { EditorCommand } from './commands.js';
import { createId } from '@app-viz/schema';
import {
  findNodeById,
  findNodeParent,
  findNodeInBlueprint,
  cloneSubtreeWithNewIds
} from './selector.js';

/**
 * Normalizes a user-supplied route path into a canonical, filesystem-safe URL path.
 * "Pricing Page/" -> "/pricing-page", "../x" -> "/x", "" -> "/". Dynamic segments like
 * "[slug]" are preserved.
 */
export function normalizePagePath(raw: string): string {
  const segments = (raw || '/')
    .split('/')
    .map((seg) => seg.trim())
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .map((seg) =>
      /^\[\.{0,3}[a-zA-Z_][a-zA-Z0-9_]*\]$/.test(seg)
        ? seg
        : seg
            .toLowerCase()
            .replace(/[^a-z0-9_-]+/g, '-')
            .replace(/^-+|-+$/g, '')
    )
    .filter(Boolean);
  return '/' + segments.join('/');
}

/** Returns `path` or the first `path-N` not used by another page. */
export function uniquePagePath(blueprint: ProjectBlueprint, path: string, ignorePageId?: string): string {
  const taken = new Set(blueprint.pages.filter((p) => p.id !== ignorePageId).map((p) => p.path));
  if (!taken.has(path)) return path;
  const base = path === '/' ? '/home' : path;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

function slugFromPath(path: string): string {
  return path.replace(/^\//, '').replace(/\//g, '-').replace(/[[\]]/g, '') || 'home';
}

/** IDs of the node(s) a command mutates. Used for lock enforcement. */
function commandTargetNodeIds(command: EditorCommand): string[] {
  switch (command.type) {
    case 'MOVE_NODE':
    case 'REORDER_NODE':
    case 'WRAP_NODE':
    case 'UNWRAP_NODE':
    case 'UPDATE_PROPS':
    case 'UPDATE_STYLES':
    case 'DELETE_NODE':
    case 'PASTE_NODE_STYLE':
    case 'RESET_NODE_STYLE':
    case 'UPDATE_INTERACTIONS':
      return [command.nodeId];
    case 'UPDATE_NODE_META': {
      // Toggling the lock itself (and renaming / hiding in the navigator) must stay possible.
      const keys = Object.keys(command.meta);
      const metaOnly = keys.every((k) => k === 'locked' || k === 'name' || k === 'hidden');
      return metaOnly ? [] : [command.nodeId];
    }
    default:
      return [];
  }
}

/** True when the command would mutate a locked node. Locked nodes are read-only. */
export function isBlockedByLock(blueprint: ProjectBlueprint, command: EditorCommand): boolean {
  if (command.type === 'BATCH') return command.commands.some((c) => isBlockedByLock(blueprint, c));
  return commandTargetNodeIds(command).some((id) => findNodeInBlueprint(blueprint, id)?.node.locked === true);
}

export function executeCommand(
  prev: ProjectBlueprint,
  command: EditorCommand
): ProjectBlueprint {
  if (command.type === 'BATCH') {
    return command.commands.reduce((state, c) => executeCommand(state, c), prev);
  }
  if (isBlockedByLock(prev, command)) return prev;

  // Deep clone to ensure immutability
  const next: ProjectBlueprint = JSON.parse(JSON.stringify(prev));

  switch (command.type) {
    case 'INSERT_NODE': {
      let inserted = false;
      for (const page of next.pages) {
        const parent = findNodeById(page.rootNode, command.targetParentId);
        if (parent) {
          parent.children = parent.children || [];
          const idx = command.index !== undefined ? command.index : parent.children.length;
          parent.children.splice(idx, 0, command.node);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        for (const layout of next.layouts) {
          const parent = findNodeById(layout.rootNode, command.targetParentId);
          if (parent) {
            parent.children = parent.children || [];
            const idx = command.index !== undefined ? command.index : parent.children.length;
            parent.children.splice(idx, 0, command.node);
            inserted = true;
            break;
          }
        }
      }
      return next;
    }

    case 'MOVE_NODE': {
      if (command.nodeId === command.targetParentId) return prev;

      let foundNode: BlueprintNode | null = null;
      let oldParentId: string | null = null;
      let oldIndex = -1;

      // First, locate and remove from existing parent
      for (const page of next.pages) {
        const parentInfo = findNodeParent(page.rootNode, command.nodeId);
        if (parentInfo) {
          foundNode = parentInfo.parent.children[parentInfo.index];
          // Prevent moving a node into its own descendant
          if (findNodeById(foundNode, command.targetParentId)) return prev;
          oldParentId = parentInfo.parent.id;
          oldIndex = parentInfo.index;
          parentInfo.parent.children.splice(parentInfo.index, 1);
          break;
        }
      }
      if (!foundNode) {
        for (const layout of next.layouts) {
          const parentInfo = findNodeParent(layout.rootNode, command.nodeId);
          if (parentInfo) {
            foundNode = parentInfo.parent.children[parentInfo.index];
            if (findNodeById(foundNode, command.targetParentId)) return prev;
            oldParentId = parentInfo.parent.id;
            oldIndex = parentInfo.index;
            parentInfo.parent.children.splice(parentInfo.index, 1);
            break;
          }
        }
      }

      if (!foundNode) return prev; // Node not found, no-op

      const computeTargetIndex = (childrenLen: number, parentId: string): number => {
        if (command.newIndex === undefined) return childrenLen;
        let idx = command.newIndex;
        if (oldParentId === parentId && oldIndex !== -1 && oldIndex < idx) {
          idx -= 1;
        }
        return Math.max(0, Math.min(childrenLen, idx));
      };

      // Now insert into targetParentId
      let placed = false;
      for (const page of next.pages) {
        const targetParent = findNodeById(page.rootNode, command.targetParentId);
        if (targetParent) {
          targetParent.children = targetParent.children || [];
          const idx = computeTargetIndex(targetParent.children.length, targetParent.id);
          targetParent.children.splice(idx, 0, foundNode);
          placed = true;
          break;
        }
      }
      if (!placed) {
        for (const layout of next.layouts) {
          const targetParent = findNodeById(layout.rootNode, command.targetParentId);
          if (targetParent) {
            targetParent.children = targetParent.children || [];
            const idx = computeTargetIndex(targetParent.children.length, targetParent.id);
            targetParent.children.splice(idx, 0, foundNode);
            placed = true;
            break;
          }
        }
      }
      return placed ? next : prev;
    }

    case 'UPDATE_PROPS': {
      let target: BlueprintNode | null = null;
      for (const page of next.pages) {
        target = findNodeById(page.rootNode, command.nodeId);
        if (target) break;
      }
      if (!target) {
        for (const layout of next.layouts) {
          target = findNodeById(layout.rootNode, command.nodeId);
          if (target) break;
        }
      }
      if (target) {
        target.props = { ...(target.props || {}), ...command.props };
      }
      return next;
    }

    case 'UPDATE_STYLES': {
      let target: BlueprintNode | null = null;
      for (const page of next.pages) {
        target = findNodeById(page.rootNode, command.nodeId);
        if (target) break;
      }
      if (!target) {
        for (const layout of next.layouts) {
          target = findNodeById(layout.rootNode, command.nodeId);
          if (target) break;
        }
      }
      if (target) {
        target.styles = target.styles || { base: {} };
        const bp = command.breakpoint;
        if (bp === 'base') {
          target.styles.base = { ...(target.styles.base || {}), ...command.styles };
        } else {
          target.styles[bp] = { ...(target.styles[bp] || {}), ...command.styles };
        }
      }
      return next;
    }

    case 'DELETE_NODE': {
      for (const page of next.pages) {
        const parentInfo = findNodeParent(page.rootNode, command.nodeId);
        if (parentInfo) {
          parentInfo.parent.children.splice(parentInfo.index, 1);
          return next;
        }
      }
      for (const layout of next.layouts) {
        const parentInfo = findNodeParent(layout.rootNode, command.nodeId);
        if (parentInfo) {
          parentInfo.parent.children.splice(parentInfo.index, 1);
          return next;
        }
      }
      return next;
    }

    case 'DUPLICATE_NODE': {
      for (const page of next.pages) {
        const parentInfo = findNodeParent(page.rootNode, command.nodeId);
        if (parentInfo) {
          const original = parentInfo.parent.children[parentInfo.index];
          const cloned = cloneSubtreeWithNewIds(original);
          parentInfo.parent.children.splice(parentInfo.index + 1, 0, cloned);
          return next;
        }
      }
      for (const layout of next.layouts) {
        const parentInfo = findNodeParent(layout.rootNode, command.nodeId);
        if (parentInfo) {
          const original = parentInfo.parent.children[parentInfo.index];
          const cloned = cloneSubtreeWithNewIds(original);
          parentInfo.parent.children.splice(parentInfo.index + 1, 0, cloned);
          return next;
        }
      }
      return next;
    }

    case 'ADD_PAGE': {
      const path = uniquePagePath(next, normalizePagePath(command.page.path));
      next.pages.push({ ...command.page, path, slug: command.page.slug || slugFromPath(path) });
      return next;
    }

    case 'DELETE_PAGE': {
      if (next.pages.length <= 1) {
        // Prevent deleting the only remaining page
        return prev;
      }
      next.pages = next.pages.filter((p) => p.id !== command.pageId);
      return next;
    }

    case 'UPDATE_PAGE_META': {
      const page = next.pages.find((p) => p.id === command.pageId);
      if (page) {
        const meta = { ...command.meta };
        if (meta.path !== undefined) {
          meta.path = uniquePagePath(next, normalizePagePath(meta.path), page.id);
          meta.slug ??= slugFromPath(meta.path);
        }
        Object.assign(page, meta);
      }
      return next;
    }

    case 'UPDATE_TOKENS': {
      next.tokens = { ...next.tokens, ...command.tokens };
      return next;
    }

    case 'ADD_INTERACTION': {
      next.interactions = next.interactions || [];
      next.interactions.push(command.interaction);
      return next;
    }

    case 'DELETE_INTERACTION': {
      next.interactions = (next.interactions || []).filter(
        (i) => i.id !== command.interactionId
      );
      return next;
    }

    case 'UPDATE_INTERACTIONS': {
      let target: BlueprintNode | null = null;
      for (const page of next.pages) {
        target = findNodeById(page.rootNode, command.nodeId);
        if (target) break;
      }
      if (!target) {
        for (const layout of next.layouts) {
          target = findNodeById(layout.rootNode, command.nodeId);
          if (target) break;
        }
      }
      if (target) {
        target.interactions = command.interactions;
      }
      return next;
    }

    case 'REORDER_NODE': {
      const reorderInRoot = (root: BlueprintNode): boolean => {
        const parentInfo = findNodeParent(root, command.nodeId);
        if (!parentInfo) return false;
        const { parent, index } = parentInfo;
        const targetIndex = command.direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= parent.children.length) return true;
        const [moved] = parent.children.splice(index, 1);
        parent.children.splice(targetIndex, 0, moved);
        return true;
      };

      for (const page of next.pages) {
        if (reorderInRoot(page.rootNode)) return next;
      }
      for (const layout of next.layouts) {
        if (reorderInRoot(layout.rootNode)) return next;
      }
      return next;
    }

    case 'WRAP_NODE': {
      const defaultPropsByWrapper: Record<string, Record<string, any>> = {
        'structure/container': { maxWidth: 'xl' },
        'structure/section': { surfaceTone: 'low', paddingY: 'md', maxWidth: 'xl' },
        'structure/grid': { columns: 2, gap: 'md' }
      };
      const defaultNameByWrapper: Record<string, string> = {
        'structure/container': 'Container Wrapper',
        'structure/section': 'Section Wrapper',
        'structure/grid': 'Grid Wrapper'
      };

      const wrapInRoot = (root: BlueprintNode): boolean => {
        const parentInfo = findNodeParent(root, command.nodeId);
        if (!parentInfo) return false;
        const { parent, index } = parentInfo;
        const targetNode = parent.children[index];
        const wrapperNode: BlueprintNode = {
          id: command.wrapperId || createId(),
          componentType: command.wrapperType,
          name: command.wrapperName || defaultNameByWrapper[command.wrapperType] || 'Wrapper',
          props: command.wrapperProps || defaultPropsByWrapper[command.wrapperType] || {},
          styles: { base: {} },
          interactions: [],
          children: [targetNode],
          locked: false,
          hidden: false,
          customClasses: '',
          customCss: ''
        };
        parent.children.splice(index, 1, wrapperNode);
        return true;
      };

      for (const page of next.pages) {
        if (wrapInRoot(page.rootNode)) return next;
      }
      for (const layout of next.layouts) {
        if (wrapInRoot(layout.rootNode)) return next;
      }
      return next;
    }

    case 'UNWRAP_NODE': {
      const unwrapInRoot = (root: BlueprintNode): boolean => {
        const parentInfo = findNodeParent(root, command.nodeId);
        if (!parentInfo) return false;
        const { parent, index } = parentInfo;
        const wrapperNode = parent.children[index];
        if (!wrapperNode.children || wrapperNode.children.length === 0) return false;
        parent.children.splice(index, 1, ...wrapperNode.children);
        return true;
      };

      for (const page of next.pages) {
        if (unwrapInRoot(page.rootNode)) return next;
      }
      for (const layout of next.layouts) {
        if (unwrapInRoot(layout.rootNode)) return next;
      }
      return next;
    }

    case 'UPDATE_NODE_META': {
      let target: BlueprintNode | null = null;
      for (const page of next.pages) {
        target = findNodeById(page.rootNode, command.nodeId);
        if (target) break;
      }
      if (!target) {
        for (const layout of next.layouts) {
          target = findNodeById(layout.rootNode, command.nodeId);
          if (target) break;
        }
      }
      if (target) {
        Object.assign(target, command.meta);
      }
      return next;
    }

    case 'PASTE_NODE_STYLE': {
      let target: BlueprintNode | null = null;
      for (const page of next.pages) {
        target = findNodeById(page.rootNode, command.nodeId);
        if (target) break;
      }
      if (!target) {
        for (const layout of next.layouts) {
          target = findNodeById(layout.rootNode, command.nodeId);
          if (target) break;
        }
      }
      if (target) {
        target.styles = JSON.parse(JSON.stringify(command.styles || { base: {} }));
        if (command.customClasses !== undefined) target.customClasses = command.customClasses;
        if (command.customCss !== undefined) target.customCss = command.customCss;
        if (command.motionEffects !== undefined) {
          target.motionEffects = command.motionEffects
            ? JSON.parse(JSON.stringify(command.motionEffects))
            : undefined;
        }
      }
      return next;
    }

    case 'RESET_NODE_STYLE': {
      let target: BlueprintNode | null = null;
      for (const page of next.pages) {
        target = findNodeById(page.rootNode, command.nodeId);
        if (target) break;
      }
      if (!target) {
        for (const layout of next.layouts) {
          target = findNodeById(layout.rootNode, command.nodeId);
          if (target) break;
        }
      }
      if (target) {
        target.styles = { base: {} };
        target.customClasses = '';
        target.customCss = '';
        target.motionEffects = undefined;
      }
      return next;
    }

    case 'UPDATE_PROJECT_META': {
      next.meta = { ...next.meta, ...command.meta };
      return next;
    }

    case 'ADD_ASSET': {
      next.assets = next.assets || [];
      next.assets.push(command.asset);
      return next;
    }

    case 'DELETE_ASSET': {
      next.assets = (next.assets || []).filter((a) => a.id !== command.assetId);
      return next;
    }

    case 'LOAD_BLUEPRINT': {
      return JSON.parse(JSON.stringify(command.blueprint));
    }

    default:
      return next;
  }
}

export interface ExecuteOptions {
  /**
   * Consecutive commands sharing a coalesce key within `coalesceWindowMs` collapse into a
   * single undo step (typing in a field, dragging a padding handle, scrubbing a slider).
   */
  coalesceKey?: string;
  coalesceWindowMs?: number;
  /** Injectable clock for deterministic tests. */
  now?: number;
}

/**
 * Undo/redo history with transactions, coalescing and no-op detection.
 *
 * Invariants:
 *  - A command that does not change the document never creates an undo step and never
 *    clears the redo stack.
 *  - Everything executed inside begin()/commit() is a single undo step.
 *  - `meta.updatedAt` is stamped only when the document actually changes.
 */
export class HistoryManager {
  private past: ProjectBlueprint[] = [];
  private present: ProjectBlueprint;
  private presentJson: string;
  private future: ProjectBlueprint[] = [];
  private readonly maxHistory: number;

  private lastCoalesceKey: string | null = null;
  private lastCoalesceAt = 0;

  private txDepth = 0;
  private txBase: ProjectBlueprint | null = null;
  private txBaseJson = '';

  constructor(initial: ProjectBlueprint, maxHistory: number = 100) {
    this.present = structuredClone(initial);
    this.presentJson = JSON.stringify(this.present);
    this.maxHistory = maxHistory;
  }

  public get current(): ProjectBlueprint {
    return this.present;
  }

  public get canUndo(): boolean {
    return this.past.length > 0;
  }

  public get canRedo(): boolean {
    return this.future.length > 0;
  }

  public get pastCount(): number {
    return this.past.length;
  }

  public get futureCount(): number {
    return this.future.length;
  }

  public get inTransaction(): boolean {
    return this.txDepth > 0;
  }

  public reset(initial: ProjectBlueprint): ProjectBlueprint {
    this.past = [];
    this.future = [];
    this.present = structuredClone(initial);
    this.presentJson = JSON.stringify(this.present);
    this.breakCoalescing();
    this.txDepth = 0;
    this.txBase = null;
    return this.present;
  }

  /** Ends any in-progress coalescing run (call on blur / pointerup). */
  public breakCoalescing(): void {
    this.lastCoalesceKey = null;
  }

  public begin(): void {
    if (this.txDepth++ === 0) {
      this.txBase = this.present;
      this.txBaseJson = this.presentJson;
      this.breakCoalescing();
    }
  }

  public commit(): void {
    if (this.txDepth === 0) return;
    if (--this.txDepth > 0) return;
    const base = this.txBase!;
    this.txBase = null;
    if (this.presentJson !== this.txBaseJson) {
      this.pushPast(base);
      this.future = [];
    }
  }

  public rollback(): ProjectBlueprint {
    if (this.txDepth === 0) return this.present;
    this.txDepth = 0;
    this.present = this.txBase!;
    this.presentJson = this.txBaseJson;
    this.txBase = null;
    return this.present;
  }

  /** Executes a command. Returns the (possibly unchanged) current document. */
  public execute(command: EditorCommand, options: ExecuteOptions = {}): ProjectBlueprint {
    const candidate = executeCommand(this.present, command);
    if (candidate === this.present) return this.present;
    const candidateJson = JSON.stringify(candidate);
    if (candidateJson === this.presentJson) return this.present;

    candidate.meta = { ...candidate.meta, updatedAt: new Date(options.now ?? Date.now()).toISOString() };
    const previous = this.present;
    this.present = candidate;
    this.presentJson = JSON.stringify(candidate);

    if (this.txDepth > 0) return this.present;

    const now = options.now ?? Date.now();
    const windowMs = options.coalesceWindowMs ?? 800;
    const coalesce =
      options.coalesceKey !== undefined &&
      options.coalesceKey === this.lastCoalesceKey &&
      now - this.lastCoalesceAt <= windowMs &&
      this.past.length > 0;

    if (!coalesce) this.pushPast(previous);
    this.future = [];
    this.lastCoalesceKey = options.coalesceKey ?? null;
    this.lastCoalesceAt = now;
    return this.present;
  }

  public undo(): ProjectBlueprint | null {
    if (this.txDepth > 0 || !this.canUndo) return null;
    const previous = this.past.pop()!;
    this.future.unshift(this.present);
    this.setPresent(previous);
    return this.present;
  }

  public redo(): ProjectBlueprint | null {
    if (this.txDepth > 0 || !this.canRedo) return null;
    const next = this.future.shift()!;
    this.past.push(this.present);
    this.setPresent(next);
    return this.present;
  }

  private setPresent(doc: ProjectBlueprint): void {
    this.present = doc;
    this.presentJson = JSON.stringify(doc);
    this.breakCoalescing();
  }

  private pushPast(doc: ProjectBlueprint): void {
    this.past.push(doc);
    if (this.past.length > this.maxHistory) this.past.shift();
  }
}
