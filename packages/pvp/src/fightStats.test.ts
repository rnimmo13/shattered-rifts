import { describe, expect, it } from 'vitest';
import { applyAction, chooseAction, createCombat, type CombatSetup } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from '@sr/content/v2';
import { fightStats, isFightStats, type StatsMove } from './fightStats';

/** Play a fight with the greedy bot for every side, keeping the moves. */
function played(setup: CombatSetup, limit = 600): StatsMove[] {
  let s = createCombat(db, setup).state;
  const moves: StatsMove[] = [];
  for (let i = 0; i < limit && !s.winner; i++) {
    const action = chooseAction(db, s);
    moves.push({ seat: s.active, action });
    s = applyAction(db, s, action).state;
  }
  return moves;
}

describe('fight stats (#714)', () => {
  it('a Campaign fight: what each card dealt and what came on no card add up to everything the enemies lost', () => {
    const setup: CombatSetup = {
      seed: 'stats-campaign',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['squire', 'squire'] },
    };
    const stats = fightStats(db, setup, played(setup));
    expect(isFightStats(stats)).toBe(true);
    expect(stats.partial).toBeUndefined();
    const byCards = Object.values(stats.byCard).reduce((n, r) => n + r.dealt, 0);
    expect(byCards + stats.unplayed).toBe(stats.dealt);
    expect(stats.perTurn.reduce((a, b) => a + b, 0)).toBe(stats.dealt);
    expect(stats.turns).toBeGreaterThan(0);
    expect(stats.perTurn.length).toBeLessThanOrEqual(stats.turns);
    expect(stats.peak.dealt).toBe(Math.max(...stats.perTurn));
    expect(stats.deckSize).toBe(RIFTWALKERS.knight.starter.length);
    if (stats.won) expect(stats.dealt).toBeGreaterThanOrEqual(stats.foeHp);
  });

  it('an Arena game, from either seat', () => {
    const setup: CombatSetup = {
      seed: 'stats-arena',
      a: { hero: 'hunter', deck: RIFTWALKERS.hunter.starter, hp: 120, maxHp: 120 },
      b: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 120, maxHp: 120 },
    };
    const moves = played(setup, 3000);
    const a = fightStats(db, setup, moves, 'a');
    const b = fightStats(db, setup, moves, 'b');
    expect(a.won === null || a.won === !b.won).toBe(true);
    expect(a.foeHp).toBe(120);
    expect(Math.abs(a.turns - b.turns)).toBeLessThanOrEqual(1);
    expect(Object.keys(a.byCard).length).toBeGreaterThan(0);
  });

  it('an enemy Barrier that wears off is no damage dealt; a card’s own HP cost is counted, a hit from the enemy is not', () => {
    // (the player only ends turns: the Squire raises its Shield and it falls away, and nothing was dealt)
    const setup: CombatSetup = {
      seed: 'stats-idle',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 500, maxHp: 500 },
      b: { enemies: ['squire'] },
    };
    const idle: StatsMove[] = Array.from({ length: 6 }, () => ({
      seat: 'a' as const,
      action: { type: 'endTurn' as const },
    }));
    const quiet = fightStats(db, setup, idle);
    expect(quiet.dealt).toBe(0);
    expect(quiet.unplayed).toBe(0);
    expect(quiet.selfHpLost).toBe(0);
    expect(quiet.hp.end).toBeLessThan(500);
    // (Open a Vein in hand: 3 HP of the hero's own)
    const vein: CombatSetup = {
      seed: 'stats-vein',
      a: { hero: 'hunter', deck: ['open-a-vein', ...RIFTWALKERS.hunter.starter] },
      b: { enemies: ['squire'] },
    };
    const s = createCombat(db, vein).state;
    const inst = [...s.sides.a.hand, ...s.sides.a.draw].find((c) => c.card === 'open-a-vein')!;
    const moves: StatsMove[] = s.sides.a.hand.includes(inst)
      ? [{ seat: 'a', action: { type: 'play', card: inst.id } }]
      : [];
    const paid = fightStats(db, vein, moves);
    expect(paid.selfHpLost).toBe(moves.length ? 3 : 0);
  });

  it('a move the engine refuses stops the count, marked partial', () => {
    const setup: CombatSetup = {
      seed: 'stats-bad',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['squire'] },
    };
    const stats = fightStats(db, setup, [{ seat: 'a', action: { type: 'play', card: 'nope' } }]);
    expect(stats.partial).toBe(true);
    expect(isFightStats({ ...stats, perTurn: ['x'] })).toBe(false);
  });
});
