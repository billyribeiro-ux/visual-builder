/**
 * Component gallery blueprint for QA: every registered component with its default props, each
 * wrapped in a labelled section, on one page. Opened with `/preview?gallery` (standalone only;
 * add `&category=<name>` to narrow it). Never persisted.
 */
import { getAllManifests } from '@app-viz/components';
import { createBlankProject, createNode, type ProjectBlueprint } from '@app-viz/schema';

export function createGalleryBlueprint(category?: string | null): ProjectBlueprint {
  const bp = createBlankProject('Component gallery');
  const page = bp.pages[0];
  page.layoutId = undefined;
  const manifests = getAllManifests()
    .filter((m) => m.type !== 'structure/slot' && (!category || m.category === category))
    .sort((a, b) => a.category.localeCompare(b.category) || a.displayName.localeCompare(b.displayName));
  page.rootNode.children = manifests.map((m) =>
    createNode({
      componentType: 'structure/section',
      name: `${m.category} · ${m.displayName}`,
      props: { surfaceTone: 'surface', paddingY: 'md', maxWidth: 'xl' },
      children: [
        createNode({
          componentType: 'basic/heading',
          name: 'Label',
          props: { text: `${m.displayName} — ${m.type}`, level: 'h6', size: 'xs', tone: 'muted' }
        }),
        createNode({ componentType: m.type, name: m.displayName, props: structuredClone(m.defaultProps) })
      ]
    })
  );
  return bp;
}
