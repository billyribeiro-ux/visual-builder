import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject } from '@app-viz/schema';
import {
  HistoryManager,
  executeCommand,
  findNodeById,
  resolveEffectiveStyles
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

    // Undo
    history.undo();
    expect(history.current.tokens.colors.primary).toBe('#2563EB');
    expect(history.canRedo).toBe(true);

    // Redo
    history.redo();
    expect(history.current.tokens.colors.primary).toBe('#FF0000');
  });

  it('updates node props via executeCommand', () => {
    const project = createDefaultAcmeSaaSProject();
    const heroNodeId = '30000000-0000-0000-0000-000000000002';

    const updated = executeCommand(project, {
      type: 'UPDATE_PROPS',
      nodeId: heroNodeId,
      props: { title: 'Updated Hero Title via Studio' }
    });

    const homePage = updated.pages.find((p) => p.path === '/');
    const heroNode = findNodeById(homePage!.rootNode, heroNodeId);
    expect(heroNode?.props.title).toBe('Updated Hero Title via Studio');
  });

  it('cascades responsive styles properly', () => {
    const style = {
      base: { fontSize: '16px', color: '#000000' },
      tablet: { fontSize: '20px' },
      desktop: { fontSize: '24px', color: '#2563EB' },
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
    expect(desktopEffective.color).toBe('#2563EB');

    const hoverEffective = resolveEffectiveStyles(style, 'desktop', 'hover');
    expect(hoverEffective.color).toBe('#FF0000');
  });
});
