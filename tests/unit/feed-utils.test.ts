import { describe, expect, it } from 'vitest';
import { applyOrder, countByType, interleave, mergeVisibleOrder, moveId, uniqueById } from '@/lib/feed';
import { makeItem } from '../fixtures';

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('interleave', () => {
  it('round-robins across sources so none floods the top', () => {
    expect(interleave(['n1', 'n2'], ['m1'], ['s1', 's2', 's3'])).toEqual(['n1', 'm1', 's1', 'n2', 's2', 's3']);
  });

  it('handles empty and missing lists', () => {
    expect(interleave()).toEqual([]);
    expect(interleave([], ['a'], [])).toEqual(['a']);
  });
});

describe('uniqueById', () => {
  it('keeps the first occurrence', () => {
    const items = [{ id: 'a', v: 1 }, { id: 'b', v: 1 }, { id: 'a', v: 2 }];
    expect(uniqueById(items)).toEqual([{ id: 'a', v: 1 }, { id: 'b', v: 1 }]);
  });
});

describe('applyOrder', () => {
  const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }));

  it('returns natural order when there is no saved order', () => {
    expect(ids(applyOrder(items, []))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('puts ordered ids first and appends newly loaded items in natural order', () => {
    expect(ids(applyOrder(items, ['c', 'a']))).toEqual(['c', 'a', 'b', 'd']);
  });

  it('ignores saved ids that are no longer loaded, and duplicates', () => {
    expect(ids(applyOrder(items, ['gone', 'b', 'b', 'a']))).toEqual(['b', 'a', 'c', 'd']);
  });
});

describe('moveId', () => {
  it('moves an id forward and backward', () => {
    expect(moveId(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveId(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('returns the same array for no-op or out-of-range moves', () => {
    const list = ['a', 'b'];
    expect(moveId(list, 1, 1)).toBe(list);
    expect(moveId(list, -1, 0)).toBe(list);
    expect(moveId(list, 0, 5)).toBe(list);
  });
});

describe('mergeVisibleOrder', () => {
  it('reorders only the visible subset, leaving hidden ids in their slots', () => {
    // Full order: n1 m1 n2 m2. The user filters to news and swaps n1/n2.
    const full = ['n1', 'm1', 'n2', 'm2'];
    expect(mergeVisibleOrder(full, ['n1', 'n2'], ['n2', 'n1'])).toEqual(['n2', 'm1', 'n1', 'm2']);
  });

  it('works with no previous order', () => {
    expect(mergeVisibleOrder([], ['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual(['c', 'a', 'b']);
  });
});

describe('countByType', () => {
  it('counts each source', () => {
    const items = [makeItem({ type: 'news' }), makeItem({ type: 'news' }), makeItem({ type: 'social' })];
    expect(countByType(items)).toEqual({ news: 2, movie: 0, social: 1 });
  });
});
