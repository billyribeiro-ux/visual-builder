import { describe, it, expect } from 'vitest';
import { createDefaultAcmeSaaSProject } from '@app-viz/schema';
import {
  HistoryManager,
  executeCommand,
  isBlockedByLock,
  normalizePagePath,
  uniquePagePath,
  cloneSubtreeWithNewIds
} from '../src/index.js';

const HERO = '30000000-0000-0000-0000-000000000002';

describe('HistoryManager guarantees', () => {
  it('ignores no-op commands without consuming history or clearing redo', () => {
    const h = new HistoryManager(createDefaultAcmeSaaSProject());
    h.execute({ type: 'UPDATE_PROPS', nodeId: HERO, props: { title: 'A' } });
    h.undo();
    expect(h.canRedo).toBe(true);

    const before = h.current;
    const after = h.execute({ type: 'DELETE_NODE', nodeId: 'ffffffff-ffff-4fff-8fff-ffffffffffff' });
    expect(after).toBe(before);
    expect(h.pastCount).toBe(0);
    expect(h.canRedo).toBe(true);
  });

  it('coalesces rapid same-key edits into one undo step', () => {
    const h = new HistoryManager(createDefaultAcmeSaaSProject());
    let t = 1_000;
    for (const title of ['H', 'He', 'Hel', 'Hell', 'Hello']) {
      h.execute({ type: 'UPDATE_PROPS', nodeId: HERO, props: { title } }, { coalesceKey: `${HERO}:title`, now: (t += 100) });
    }
    expect(h.pastCount).toBe(1);
    h.undo();
    expect(h.current.pages[0].rootNode.children[0].props.title).not.toBe('Hello');
  });

  it('starts a new undo step after the coalescing window expires', () => {
    const h = new HistoryManager(createDefaultAcmeSaaSProject());
    h.execute({ type: 'UPDATE_PROPS', nodeId: HERO, props: { title: 'one' } }, { coalesceKey: 'k', now: 0 });
    h.execute({ type: 'UPDATE_PROPS', nodeId: HERO, props: { title: 'two' } }, { coalesceKey: 'k', now: 5_000 });
    expect(h.pastCount).toBe(2);
  });

  it('treats a transaction as a single atomic undo step', () => {
    const h = new HistoryManager(createDefaultAcmeSaaSProject());
    h.begin();
    h.execute({ type: 'UPDATE_PROPS', nodeId: HERO, props: { align: 'center' } });
    h.execute({ type: 'UPDATE_STYLES', nodeId: HERO, breakpoint: 'base', styles: { textAlign: 'center' } });
    h.commit();
    expect(h.pastCount).toBe(1);
    h.undo();
    const hero = h.current.pages[0].rootNode.children[0];
    expect(hero.props.align).not.toBe('center');
    expect(hero.styles.base.textAlign).toBeUndefined();
  });

  it('applies BATCH commands atomically', () => {
    const h = new HistoryManager(createDefaultAcmeSaaSProject());
    h.execute({
      type: 'BATCH',
      commands: [
        { type: 'UPDATE_PROPS', nodeId: HERO, props: { title: 'Batch' } },
        { type: 'UPDATE_STYLES', nodeId: HERO, breakpoint: 'base', styles: { color: 'red' } }
      ]
    });
    expect(h.pastCount).toBe(1);
  });
});

describe('lock enforcement', () => {
  it('blocks mutations of locked nodes but still allows unlocking', () => {
    const locked = executeCommand(createDefaultAcmeSaaSProject(), {
      type: 'UPDATE_NODE_META',
      nodeId: HERO,
      meta: { locked: true }
    });
    expect(isBlockedByLock(locked, { type: 'DELETE_NODE', nodeId: HERO })).toBe(true);
    expect(executeCommand(locked, { type: 'DELETE_NODE', nodeId: HERO })).toBe(locked);
    expect(isBlockedByLock(locked, { type: 'UPDATE_NODE_META', nodeId: HERO, meta: { locked: false } })).toBe(false);
  });
});

describe('route path safety', () => {
  it('normalizes hostile and messy paths', () => {
    expect(normalizePagePath('')).toBe('/');
    expect(normalizePagePath('Pricing Page/')).toBe('/pricing-page');
    expect(normalizePagePath('../../etc//passwd')).toBe('/etc/passwd');
    expect(normalizePagePath('/blog/[slug]')).toBe('/blog/[slug]');
  });

  it('dedupes colliding paths on ADD_PAGE', () => {
    const bp = createDefaultAcmeSaaSProject();
    expect(uniquePagePath(bp, '/pricing')).toBe('/pricing-2');
    const page = { ...bp.pages[2], id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', path: '/pricing' };
    const next = executeCommand(bp, { type: 'ADD_PAGE', page });
    expect(next.pages.at(-1)!.path).toBe('/pricing-2');
  });
});

describe('cloneSubtreeWithNewIds', () => {
  it('assigns fresh node and interaction IDs and renames only the root', () => {
    const root = createDefaultAcmeSaaSProject().layouts[0].rootNode;
    const withRule = {
      ...root,
      interactions: [{ id: 'rule-1', trigger: 'onClick' as const, actionType: 'navigate' as const, payload: { path: '/' } }]
    };
    const copy = cloneSubtreeWithNewIds(withRule);
    expect(copy.id).not.toBe(root.id);
    expect(copy.name).toBe(`${root.name} (Copy)`);
    expect(copy.children[0].name).toBe(root.children[0].name);
    expect(copy.children[0].id).not.toBe(root.children[0].id);
    expect(copy.interactions[0].id).not.toBe('rule-1');
  });
});
