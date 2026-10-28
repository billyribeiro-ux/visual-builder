import type { BlueprintNode, ProjectBlueprint } from '@app-viz/schema';

export function findNodeById(root: BlueprintNode, id: string): BlueprintNode | null {
  if (root.id === id) return root;
  if (!root.children || root.children.length === 0) return null;

  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

export function findNodeParent(
  root: BlueprintNode,
  targetId: string
): { parent: BlueprintNode; index: number } | null {
  if (!root.children) return null;

  for (let i = 0; i < root.children.length; i++) {
    if (root.children[i].id === targetId) {
      return { parent: root, index: i };
    }
    const deeper = findNodeParent(root.children[i], targetId);
    if (deeper) return deeper;
  }

  return null;
}

export function getNodeBreadcrumbs(root: BlueprintNode, targetId: string): BlueprintNode[] {
  const path: BlueprintNode[] = [];

  function traverse(current: BlueprintNode): boolean {
    path.push(current);
    if (current.id === targetId) return true;

    if (current.children) {
      for (const child of current.children) {
        if (traverse(child)) return true;
      }
    }

    path.pop();
    return false;
  }

  traverse(root);
  return path;
}

export function getAllNodeIds(root: BlueprintNode): string[] {
  const ids: string[] = [root.id];
  if (root.children) {
    for (const child of root.children) {
      ids.push(...getAllNodeIds(child));
    }
  }
  return ids;
}

function generateUUID(): string {
  return globalThis.crypto.randomUUID();
}

/** Deep clone with fresh IDs for every node and interaction rule. Only the root is renamed. */
export function cloneSubtreeWithNewIds(node: BlueprintNode, isRoot = true): BlueprintNode {
  return {
    ...structuredClone(node),
    id: generateUUID(),
    name: isRoot ? `${node.name} (Copy)` : node.name,
    interactions: (node.interactions || []).map((rule) => ({
      ...structuredClone(rule),
      id: generateUUID()
    })),
    children: (node.children || []).map((child) => cloneSubtreeWithNewIds(child, false))
  };
}

export function findNodeInBlueprint(
  blueprint: ProjectBlueprint,
  id: string
): { node: BlueprintNode; pageId?: string; layoutId?: string } | null {
  for (const page of blueprint.pages) {
    const found = findNodeById(page.rootNode, id);
    if (found) return { node: found, pageId: page.id };
  }

  for (const layout of blueprint.layouts) {
    const found = findNodeById(layout.rootNode, id);
    if (found) return { node: found, layoutId: layout.id };
  }

  return null;
}
