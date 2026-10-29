import type { BlueprintNode } from '@app-viz/schema';

export interface HtmlIdEntry {
  /** The CSS ID (`pricing`). */
  id: string;
  nodeId: string;
  name: string;
}

/** Every CSS ID (`htmlId`) set in the given trees, in document order. */
export function collectHtmlIds(...roots: Array<BlueprintNode | null | undefined>): HtmlIdEntry[] {
  const out: HtmlIdEntry[] = [];
  const walk = (node: BlueprintNode) => {
    const id = (node as BlueprintNode & { htmlId?: string }).htmlId;
    if (id) out.push({ id, nodeId: node.id, name: node.name });
    for (const child of node.children ?? []) walk(child);
  };
  for (const root of roots) if (root) walk(root);
  return out;
}
