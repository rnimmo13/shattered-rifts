import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  createCombat,
  hashState,
  type Action,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, encounter } from '@sr/content/v2';
import { appendFightMove, clearFightLog, loadFightLog } from './fightLog';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
});

describe('the fight log', () => {
  it('keeps moves for a seed, and ignores another seed', () => {
    const a: Action = { type: 'endTurn' };
    expect(loadFightLog('k', 's1')).toEqual([]);
    appendFightMove('k', 's1', a);
    appendFightMove('k', 's1', { type: 'pick', cards: ['x'] });
    expect(loadFightLog('k', 's1')).toHaveLength(2);
    // a log of another seed is not this fight's (a retried fight has a new seed)
    expect(loadFightLog('k', 's2')).toEqual([]);
    appendFightMove('k', 's2', a);
    expect(loadFightLog('k', 's2')).toEqual([a]);
    clearFightLog('k');
    expect(loadFightLog('k', 's2')).toEqual([]);
  });

  it('survives a log that is not what it should be', () => {
    store.set('sr.fightlog:k', 'not json');
    expect(loadFightLog('k', 's')).toEqual([]);
    store.set('sr.fightlog:k', JSON.stringify({ seed: 5, moves: 'no' }));
    expect(loadFightLog('k', 's')).toEqual([]);
  });

  it('replaying the moves of a fight from its seed gives the very same fight', () => {
    // a real fight, played by the engine's bot, with every move written down as the screen would
    const hero = RIFTWALKERS.knight;
    const setup = {
      seed: 'resume-1',
      a: {
        hero: 'knight',
        deck: [...hero.starter],
        hp: hero.hero.maxHp,
        maxHp: hero.hero.maxHp,
        boons: [],
        potions: [],
      },
      b: { enemies: encounter('squire-pair').units, tier: 1, hpPct: 100, dmgPct: 100 },
    };
    let live: CombatState = createCombat(COMBAT_DB, setup).state;
    const moves: Action[] = [];
    for (let i = 0; i < 400 && !live.winner; i++) {
      if (live.active !== 'a') break;
      const a = chooseAction(COMBAT_DB, live);
      live = applyAction(COMBAT_DB, live, a).state;
      moves.push(a);
    }
    expect(moves.length).toBeGreaterThan(5);
    // (through the log, as a reload would)
    for (const m of moves) appendFightMove('fight', setup.seed, m);
    let again = createCombat(COMBAT_DB, setup).state;
    for (const m of loadFightLog('fight', setup.seed)) again = applyAction(COMBAT_DB, again, m).state;
    expect(hashState(again)).toBe(hashState(live));
  });
});
