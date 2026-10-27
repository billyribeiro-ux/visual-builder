import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject, composeNodesFromPrompt } from '@app-viz/schema';
import {
  HistoryManager,
  executeCommand,
  findNodeById,
  resolveEffectiveStyles,
  compileNodeScopedCss
} from '../src/index.js';

describe('Editor Engine & Reducer', () => {
  it('manages undo and redo history accurately', () => {
    const project = createDefaultAcmeSaaSProject();
    const history = new HistoryManager(project);

    expect(history.canUndo).toBe(false);
    expect(history.canRedo).toBe(false);

    // Update tokens
    history.execute({
      type: 'UPDATE_TOKENS',
      tokens: {
        colors: { ...project.tokens.colors, primary: '#FF0000' }
      }
    });

    expect(history.canUndo).toBe(true);
    expect(history.current.tokens.colors.primary).toBe('#FF0000');

    // Undo restores Google MD3 primary (#0B57D0)
    history.undo();
    expect(history.current.tokens.colors.primary).toBe('#0B57D0');
    expect(history.canRedo).toBe(true);

    // Redo
    history.redo();
    expect(history.current.tokens.colors.primary).toBe('#FF0000');
  });

  it('updates node props, meta, interactions, and reorders siblings via executeCommand', () => {
    const project = createDefaultAcmeSaaSProject();
    const heroNodeId = '30000000-0000-0000-0000-000000000002';

    let updated = executeCommand(project, {
      type: 'UPDATE_PROPS',
      nodeId: heroNodeId,
      props: { title: 'Updated Hero Title via Studio' }
    });

    updated = executeCommand(updated, {
      type: 'UPDATE_NODE_META',
      nodeId: heroNodeId,
      meta: { name: 'Custom Hero Name', locked: true }
    });

    updated = executeCommand(updated, {
      type: 'REORDER_NODE',
      nodeId: heroNodeId,
      direction: 'down'
    });

    const homePage = updated.pages.find((p) => p.path === '/');
    const heroNode = findNodeById(homePage!.rootNode, heroNodeId);
    expect(heroNode?.props.title).toBe('Updated Hero Title via Studio');
    expect(heroNode?.name).toBe('Custom Hero Name');
    expect(heroNode?.locked).toBe(true);
    expect(homePage!.rootNode.children[1].id).toBe(heroNodeId);
  });

  it('cascades responsive styles properly', () => {
    const style = {
      base: { fontSize: '16px', color: '#000000' },
      tablet: { fontSize: '20px' },
      desktop: { fontSize: '24px', color: '#0B57D0' },
      hover: { color: '#FF0000' }
    };

    const mobileEffective = resolveEffectiveStyles(style, 'mobile');
    expect(mobileEffective.fontSize).toBe('16px');
    expect(mobileEffective.color).toBe('#000000');

    const tabletEffective = resolveEffectiveStyles(style, 'tablet');
    expect(tabletEffective.fontSize).toBe('20px');
    expect(tabletEffective.color).toBe('#000000');

    const desktopEffective = resolveEffectiveStyles(style, 'desktop');
    expect(desktopEffective.fontSize).toBe('24px');
    expect(desktopEffective.color).toBe('#0B57D0');

    const hoverEffective = resolveEffectiveStyles(style, 'desktop', 'hover');
    expect(hoverEffective.color).toBe('#FF0000');
  });

  it('supports WRAP_NODE, UNWRAP_NODE, and MOVE_NODE with circular nesting guard', () => {
    const project = createDefaultAcmeSaaSProject();
    const heroNodeId = '30000000-0000-0000-0000-000000000002';
    const wrapperId = '99999999-0000-4000-8000-000000000001';

    // Wrap heroNode in a Section container
    const wrapped = executeCommand(project, {
      type: 'WRAP_NODE',
      nodeId: heroNodeId,
      wrapperId,
      wrapperType: 'structure/section',
      wrapperName: 'Wrapper Section',
      wrapperProps: { paddingY: '64px' }
    });

    const homeAfterWrap = wrapped.pages.find((p) => p.path === '/')!;
    const wrapperInTree = findNodeById(homeAfterWrap.rootNode, wrapperId);
    expect(wrapperInTree).toBeDefined();
    expect(wrapperInTree?.children[0]?.id).toBe(heroNodeId);

    // Prevent moving wrapper inside its own child (circular guard)
    const afterInvalidMove = executeCommand(wrapped, {
      type: 'MOVE_NODE',
      nodeId: wrapperId,
      targetParentId: heroNodeId,
      newIndex: 0
    });
    expect(findNodeById(afterInvalidMove.pages[0].rootNode, wrapperId)?.children[0]?.id).toBe(heroNodeId);

    // Unwrap wrapper node and restore heroNode in place
    const unwrapped = executeCommand(wrapped, {
      type: 'UNWRAP_NODE',
      nodeId: wrapperId
    });
    const homeAfterUnwrap = unwrapped.pages.find((p) => p.path === '/')!;
    expect(findNodeById(homeAfterUnwrap.rootNode, wrapperId)).toBeNull();
    expect(homeAfterUnwrap.rootNode.children[0]?.id).toBe(heroNodeId);
  });

  it('compiles responsive and stateful node styles via compileNodeScopedCss', () => {
    const project = createDefaultAcmeSaaSProject();
    const heroNodeId = '30000000-0000-0000-0000-000000000002';

    let updated = executeCommand(project, {
      type: 'UPDATE_STYLES',
      nodeId: heroNodeId,
      breakpoint: 'mobile',
      styles: { paddingTop: '24px' }
    });

    updated = executeCommand(updated, {
      type: 'UPDATE_STYLES',
      nodeId: heroNodeId,
      breakpoint: 'hover',
      styles: { backgroundColor: '#EDF2FC' }
    });

    const css = compileNodeScopedCss([updated.pages[0].rootNode]);
    expect(css).toContain(`[data-node-id="${heroNodeId}"]:hover { background-color: #EDF2FC !important; }`);
    expect(css).toContain(`@media (max-width: 767px)`);
    expect(css).toContain(`[data-node-id="${heroNodeId}"] { padding-top: 24px !important; }`);
  });

  it('supports ADD_ASSET, DELETE_ASSET, and composeNodesFromPrompt AI section composer', () => {
    let project = createDefaultAcmeSaaSProject();
    const initialAssetCount = project.assets.length;
    expect(initialAssetCount).toBeGreaterThanOrEqual(4);

    project = executeCommand(project, {
      type: 'ADD_ASSET',
      asset: {
        id: '88888888-0000-4000-8000-000000000099',
        filename: 'custom-diagram.svg',
        mimeType: 'image/svg+xml',
        size: 120,
        localPath: '/assets/custom-diagram.svg',
        alt: 'Custom architecture diagram',
        category: 'illustration',
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>'
      }
    });
    expect(project.assets.length).toBe(initialAssetCount + 1);

    project = executeCommand(project, {
      type: 'DELETE_ASSET',
      assetId: '88888888-0000-4000-8000-000000000099'
    });
    expect(project.assets.length).toBe(initialAssetCount);

    const composed = composeNodesFromPrompt(
      'Add an AI agent hero, stats bar, and 3-tier pricing table'
    );
    expect(composed.nodes.length).toBe(3);
    expect(composed.nodes[0].componentType).toBe('hero/split-hero');
    expect(composed.nodes[1].componentType).toBe('marketing/stats-bar');
    expect(composed.nodes[2].componentType).toBe('marketing/pricing-table');
    expect(composed.suggestedThemeId).toBe('violet-light');
  });
});
