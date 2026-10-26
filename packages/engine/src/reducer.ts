import type { ProjectBlueprint, BlueprintNode } from '@app-viz/schema';
import type { EditorCommand } from './commands.js';
import {
  findNodeById,
  findNodeParent,
  cloneSubtreeWithNewIds
} from './selector.js';

export function executeCommand(
  prev: ProjectBlueprint,
  command: EditorCommand
): ProjectBlueprint {
  // Deep clone to ensure immutability
  const next: ProjectBlueprint = JSON.parse(JSON.stringify(prev));
  next.meta.updatedAt = new Date().toISOString();

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
      let foundNode: BlueprintNode | null = null;
      // First, remove from existing parent
      for (const page of next.pages) {
        const parentInfo = findNodeParent(page.rootNode, command.nodeId);
        if (parentInfo) {
          foundNode = parentInfo.parent.children[parentInfo.index];
          parentInfo.parent.children.splice(parentInfo.index, 1);
          break;
        }
      }
      if (!foundNode) {
        for (const layout of next.layouts) {
          const parentInfo = findNodeParent(layout.rootNode, command.nodeId);
          if (parentInfo) {
            foundNode = parentInfo.parent.children[parentInfo.index];
            parentInfo.parent.children.splice(parentInfo.index, 1);
            break;
          }
        }
      }

      if (!foundNode) return prev; // Node not found, no-op

      // Now insert into targetParentId
      let placed = false;
      for (const page of next.pages) {
        const targetParent = findNodeById(page.rootNode, command.targetParentId);
        if (targetParent) {
          targetParent.children = targetParent.children || [];
          const idx = command.newIndex !== undefined ? command.newIndex : targetParent.children.length;
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
            const idx = command.newIndex !== undefined ? command.newIndex : targetParent.children.length;
            targetParent.children.splice(idx, 0, foundNode);
            placed = true;
            break;
          }
        }
      }
      return next;
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
      next.pages.push(command.page);
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
        Object.assign(page, command.meta);
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

    case 'UPDATE_PROJECT_META': {
      next.meta = { ...next.meta, ...command.meta };
      return next;
    }

    case 'LOAD_BLUEPRINT': {
      return JSON.parse(JSON.stringify(command.blueprint));
    }

    default:
      return next;
  }
}

/**
 * Robust history manager for undo/redo with configurable stack depth.
 */
export class HistoryManager {
  private past: ProjectBlueprint[] = [];
  private present: ProjectBlueprint;
  private future: ProjectBlueprint[] = [];
  private maxHistory: number;

  constructor(initial: ProjectBlueprint, maxHistory: number = 50) {
    this.present = JSON.parse(JSON.stringify(initial));
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

  public reset(initial: ProjectBlueprint): ProjectBlueprint {
    this.past = [];
    this.future = [];
    this.present = JSON.parse(JSON.stringify(initial));
    return this.present;
  }

  public execute(command: EditorCommand): ProjectBlueprint {
    const nextState = executeCommand(this.present, command);
    this.past.push(this.present);
    if (this.past.length > this.maxHistory) {
      this.past.shift();
    }
    this.present = nextState;
    this.future = []; // Clear redo stack on new action
    return this.present;
  }

  public undo(): ProjectBlueprint | null {
    if (!this.canUndo) return null;
    const previous = this.past.pop()!;
    this.future.unshift(this.present);
    this.present = previous;
    return this.present;
  }

  public redo(): ProjectBlueprint | null {
    if (!this.canRedo) return null;
    const next = this.future.shift()!;
    this.past.push(this.present);
    this.present = next;
    return this.present;
  }
}
