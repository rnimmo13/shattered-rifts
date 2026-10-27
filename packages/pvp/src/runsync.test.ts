import { describe, expect, it } from 'vitest';
import {
  GONE_KEEP_MS,
  MAX_RUN_COPIES,
  MAX_RUN_TEXT,
  cleanRunCopies,
  keepRunCopies,
  mergeRunCopies,
  type RunCopy,
} from './runsync';

const live = (id: string, updated: number, text = `run ${id} at ${updated}`): RunCopy => ({
  id,
  updated,
  text,
});
const gone = (id: string, updated: number): RunCopy => ({ id, updated, gone: true });

describe('runs that follow a player between devices (DECISIONS #309)', () => {
  it('the newest copy of each run wins, and what the server lacks or has older is sent up', () => {
    const { merged, push } = mergeRunCopies(
      [live('a', 5), live('b', 1), live('c', 3)],
      [live('a', 2), live('b', 4), live('d', 7)],
      10,
    );
    const by = new Map(merged.map((c) => [c.id, c.updated]));
    expect(Object.fromEntries(by)).toEqual({ a: 5, b: 4, c: 3, d: 7 });
    expect(push.map((c) => c.id).sort()).toEqual(['a', 'c']);
  });

  it('a run ended on one device goes from the others, and the end is passed on', () => {
    const fromServer = mergeRunCopies([live('a', 3)], [gone('a', 5)], 10);
    expect(fromServer.merged).toEqual([gone('a', 5)]);
    expect(fromServer.push).toEqual([]);
    const fromHere = mergeRunCopies([gone('a', 6)], [live('a', 5)], 10);
    expect(fromHere.push).toEqual([gone('a', 6)]);
  });

  it('forgets old ends, and nothing is sent when both agree', () => {
    const r = mergeRunCopies([gone('a', 1)], [], 1 + GONE_KEEP_MS + 1);
    expect(r.merged).toEqual([]);
    expect(mergeRunCopies([live('a', 2)], [live('a', 2)], 10).push).toEqual([]);
  });

  it('keeps the newest copy of each run, live runs first, within the limit', () => {
    const many = Array.from({ length: MAX_RUN_COPIES + 5 }, (_, i) => gone(`g${i}`, i));
    const kept = keepRunCopies(many, [live('x', 0), live('g3', 100)]);
    expect(kept).toHaveLength(MAX_RUN_COPIES);
    expect(kept[0]?.id).toBe('g3');
    expect(kept.some((c) => c.id === 'x')).toBe(true);
  });

  it('cleans what arrives: bad ids, missing text, oversized runs are left out', () => {
    const r = cleanRunCopies([
      live('ok-1', 1),
      { id: 'bad id!', updated: 1, text: 'x' },
      { id: 'no-text', updated: 1 },
      { id: 'huge', updated: 1, text: 'x'.repeat(MAX_RUN_TEXT + 1) },
      gone('done', 2),
      'nonsense',
    ]);
    expect(r.map((c) => c.id)).toEqual(['ok-1', 'done']);
  });
});
