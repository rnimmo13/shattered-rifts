import { describe, expect, it } from 'vitest';
import { applyAction, chooseAction, createCombat, type CombatSetup } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, encounter, ENCOUNTERS } from '@sr/content/v2';
import { replayFight, type FightMove } from './recap';

/** A fight played to the end by the simple bot, keeping its moves as a fight screen would. */
function played(setup: CombatSetup): FightMove[] {
  let s = createCombat(db, setup).state;
  const moves: FightMove[] = [];
  for (let i = 0; i < 2000 && !s.winner; i++) {
    const action = chooseAction(db, s);
    moves.push({ seat: s.active, action });
    s = applyAction(db, s, action).state;
  }
  return moves;
}

const hero = (s: ReturnType<typeof createCombat>['state']) =>
  s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('the fight recap', () => {
  const warden = ENCOUNTERS.find((e) => e.kind === 'warden')!;
  const setup: CombatSetup = {
    seed: 'recap-1',
    a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter], potions: [] },
    b: { enemies: encounter(warden.id).units },
  };
  const moves = played(setup);

  it('replays the fight to the same end, and its HP lost adds up', () => {
    const { recap, broken, lines } = replayFight(db, setup, moves, 'a');
    expect(broken).toBe(false);
    let s = createCombat(db, setup).state;
    const startHp = hero(s)?.hp ?? 0;
    for (const m of moves) s = applyAction(db, s, m.action).state;
    expect(recap.winner).toBe(s.winner);
    const endHp = Math.max(0, hero(s)?.hp ?? 0);
    // every point of HP the hero lost is put down to something
    expect(recap.taken).toBeGreaterThanOrEqual(startHp + recap.healed - endHp);
    expect(recap.takenFrom.reduce((n, x) => n + x.amount, 0)).toBe(recap.taken);
    expect(recap.rounds).toBeGreaterThan(0);
    expect(lines.length).toBeGreaterThan(5);
    if (s.winner === 'b') {
      expect(recap.killer).not.toBeNull();
      expect(recap.killer!.amount).toBeGreaterThan(0);
    }
  });

  it('names its best turns with the cards played in them', () => {
    const { recap } = replayFight(db, setup, moves, 'a');
    expect(recap.bestTurns.length).toBeGreaterThan(0);
    expect(recap.bestTurns.length).toBeLessThanOrEqual(3);
    for (const t of recap.bestTurns) expect(t.cards.length).toBeGreaterThan(0);
    const dealt = recap.bestTurns.map((t) => t.dealt);
    expect([...dealt].sort((x, y) => y - x)).toEqual(dealt);
  });

  it('a hero that loses names the blow that ended it', () => {
    // a weak deck against a Warden at full strength: it falls
    const lost: CombatSetup = { ...setup, seed: 'recap-loss', a: { ...setup.a, hp: 12, maxHp: 80 } };
    const m = played(lost);
    const { recap } = replayFight(db, lost, m, 'a');
    expect(recap.winner).toBe('b');
    expect(recap.killer?.name).toBeTruthy();
  });

  it('moves that no longer fit the rules are a broken replay, not a crash', () => {
    const { broken } = replayFight(db, setup, [{ seat: 'a', action: { type: 'play', card: 'nope' } }], 'a');
    expect(broken).toBe(true);
  });
});
