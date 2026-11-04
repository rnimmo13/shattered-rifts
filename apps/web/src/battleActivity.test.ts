import { describe, expect, it } from 'vitest';
import { battleActive, enterBattle, subscribeBattle } from './battleActivity';

describe('safe update battle boundary', () => {
  it('does not unlock updates until every mounted fight has left', () => {
    const a = enterBattle(),
      b = enterBattle();
    expect(battleActive()).toBe(true);
    a();
    a();
    expect(battleActive()).toBe(true);
    b();
    expect(battleActive()).toBe(false);
  });
  it('handles StrictMode mount/cleanup/remount and duplicate cleanup safely', () => {
    const seen: boolean[] = [];
    const stop = subscribeBattle(() => seen.push(battleActive()));
    const first = enterBattle();
    first();
    first();
    const second = enterBattle();
    second();
    stop();
    expect(seen).toEqual([true, false, true, false]);
  });
});
