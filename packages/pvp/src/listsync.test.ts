import { describe, expect, it } from 'vitest';
import { MAX_REMOVED, SYNCED_LISTS, cleanListItems, cleanRemoved, mergeList } from './listsync';

const item = (id: string, at: number, extra: Record<string, unknown> = {}) => ({
  id,
  at,
  ...extra,
});

describe('lists that follow a player between devices (DECISIONS #318)', () => {
  it('merges by id, newer copy winning, newest first, and leaves out what was removed', () => {
    const merged = mergeList(
      'matches',
      [item('a', 5, { v: 'mine' }), item('b', 1)],
      [item('a', 3, { v: 'theirs' }), item('c', 9), item('d', 2)],
      ['d'],
    );
    expect(merged.map((m) => m.id)).toEqual(['c', 'a', 'b']);
    expect(merged.find((m) => m.id === 'a')?.['v']).toBe('mine');
  });

  it('keeps no more than the list holds', () => {
    const many = Array.from({ length: SYNCED_LISTS.history.keep + 7 }, (_, i) => item(`r${i}`, i));
    const merged = mergeList('history', many, [], []);
    expect(merged).toHaveLength(SYNCED_LISTS.history.keep);
    expect(merged[0]?.id).toBe(`r${SYNCED_LISTS.history.keep + 6}`);
  });

  it('cleans what arrives', () => {
    const r = cleanListItems('matches', [
      item('ok', 1),
      { id: '', at: 1 },
      { id: 'no-time' },
      item('huge', 1, { blob: 'x'.repeat(SYNCED_LISTS.matches.maxItem) }),
      'nonsense',
    ]);
    expect(r.map((x) => x.id)).toEqual(['ok']);
    expect(cleanRemoved(['a', 'a', 5, 'b'])).toEqual(['a', 'b']);
    expect(cleanRemoved(Array.from({ length: MAX_REMOVED + 10 }, (_, i) => `x${i}`))).toHaveLength(
      MAX_REMOVED,
    );
  });
});

describe('the run history keeps its size (DECISIONS #320)', () => {
  it('only the newest few runs keep their last fight', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      item(`r${i}`, i, { lastFight: { moves: [] } }),
    );
    const merged = mergeList('history', many, [], []);
    expect(merged.filter((m) => 'lastFight' in m)).toHaveLength(SYNCED_LISTS.history.withFight);
    expect('lastFight' in (merged[0] ?? {})).toBe(true);
  });
});
