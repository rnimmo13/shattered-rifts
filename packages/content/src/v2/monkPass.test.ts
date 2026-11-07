// The Monk's costing pass (when she was the Barbarian) (DECISIONS #390, docs/BARBARIAN_REVIEW.md): Inner Fire gives Fervor only, Still Guard is a basic
// again, Surge of Ire answers the first Fury each turn, and a card that copies another class's costs what that one costs.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'barbarian-pass',
    a: { hero: 'monk', deck: [...RIFTWALKERS.monk.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `B${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('the Monk costing pass', () => {
  it('Inner Fire gives 1 Fervor for a stance and no Barrier, and 3 Primed the first time each turn he leaves Fury (DECISIONS #412, #533)', () => {
    const s0 = fight(['rising-ire', 'centre-yourself', 'unburdened-guard']);
    hero(s0).barrier = 0;
    const fervor = hero(s0).statuses.mantra ?? 0;
    const s = play(s0, 'rising-ire');
    expect(hero(s).statuses.mantra ?? 0).toBe(fervor + 1);
    expect(hero(s).barrier).toBe(0);
    expect(hero(s).statuses.vigor ?? 0).toBe(0); // entering Fury gives none
    const out = play(s, 'centre-yourself'); // Fury to Serene
    expect(hero(out).statuses.vigor ?? 0).toBe(3);
    expect(hero(out).statuses.mantra ?? 0).toBe(fervor + 2);
    // (into Fury and out again on the same turn: no more Primed)
    const again = play(out, 'unburdened-guard');
    expect(hero(again).statuses.vigor ?? 0).toBe(3);
  });

  it('Primed loses half (rounded up) as his turn ends, so it cannot be banked turn after turn (DECISIONS #533)', () => {
    const s0 = fight([]);
    hero(s0).statuses.vigor = 40;
    let s = applyAction(db, s0, { type: 'endTurn' }).state;
    expect(hero(s).statuses.vigor ?? 0).toBe(20);
    hero(s).statuses.vigor = 3;
    s.sides.a.hand = [];
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(hero(s).statuses.vigor ?? 0).toBe(1);
  });

  it('Primed only for this turn goes first, then half of the rest', () => {
    // (Heat of the Forge 2 for good, Crowned Edge 2 for the turn: 2 left, half of it goes, 1 stays; halving first left 0)
    const s0 = fight(['forge-heat', 'conqueror']);
    let s = play(play(s0, 'forge-heat'), 'conqueror');
    expect(hero(s).statuses.vigor ?? 0).toBe(4);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(hero(s).statuses.vigor ?? 0).toBe(1);
  });

  it("an enemy's Primed (the Omen of the Hunted) is not halved as its turn ends", () => {
    const { state } = createCombat(db, {
      seed: 'hunted-kept',
      a: { hero: 'monk', deck: [...RIFTWALKERS.monk.starter] },
      b: { enemies: ['squire'], mods: [{ statuses: { vigor: 50 } }] },
    });
    let s = state;
    // (until its first attacking move, it keeps all 50)
    for (let i = 0; i < 6 && !s.winner; i++) {
      const before = s.sides.b.units[0]!.statuses.vigor ?? 0;
      s = applyAction(db, s, { type: 'endTurn' }).state;
      const after = s.sides.b.units[0]?.statuses.vigor ?? 0;
      expect([before, 0]).toContain(after);
      if (after === 0) break;
    }
  });

  it('Iron Body: 1 HP for 4 Primed the first time each turn he enters Fury, not again (DECISIONS #534)', () => {
    const s0 = fight(['blood-on-the-sand', 'rising-ire', 'centre-yourself', 'unburdened-guard']);
    const hp = hero(s0).hp;
    let s = play(play(s0, 'blood-on-the-sand'), 'rising-ire');
    expect(hero(s).statuses.vigor ?? 0).toBe(4);
    expect(hero(s).hp).toBe(hp - 1);
    // (out of Fury pays Inner Fire's 3)
    s = play(s, 'centre-yourself');
    expect(hero(s).statuses.vigor ?? 0).toBe(7);
    // (into Fury again and out: Iron Body and Inner Fire have both paid this turn)
    s = play(s, 'unburdened-guard');
    expect(hero(s).statuses.vigor ?? 0).toBe(7);
    expect(hero(s).hp).toBe(hp - 1);
  });

  it('Thousand Palms: 5 damage 4 times', () => {
    const s0 = fight(['thousand-palms']);
    const foe = s0.sides.b.units[0]!;
    foe.hp = foe.maxHp = 500;
    foe.barrier = 0;
    foe.statuses = {};
    hero(s0).statuses = { vigor: 2 };
    const s = play(s0, 'thousand-palms');
    expect(500 - s.sides.b.units[0]!.hp).toBe((5 + 2) * 4);
  });

  it('Still Guard: 5 Barrier and Serene (DECISIONS #677)', () => {
    expect(cardText(db, db.cards['still-guard']!)).toBe('Gain 5 Barrier. Enter Serene.');
  });

  it('Surge of Ire answers only the first Fury each turn, and says so', () => {
    expect(cardText(db, db.cards['surge-of-ire']!)).toMatch(
      /^The first time each turn you enter Fury/,
    );
    let s = play(
      fight(['surge-of-ire', 'rising-ire', 'centre-yourself', 'rage-unbound']),
      'surge-of-ire',
    );
    hero(s).barrier = 0;
    const hand = () => s.sides.a.hand.length;
    // the first Fury: Surge of Ire gives 6 Barrier and a card (Rising Ire draws one too, and leaves the hand)
    const start = hand();
    s = play(s, 'rising-ire');
    expect(hero(s).barrier).toBe(6);
    expect(hand()).toBe(start - 1 + 2);
    // Serene, then Fury again: nothing more this turn
    s = play(s, 'centre-yourself');
    const barrier = hero(s).barrier;
    const before = hand();
    s = play(s, 'rage-unbound');
    expect(hero(s).barrier).toBe(barrier);
    expect(hand()).toBe(before - 1);
  });

  it('All-Seeing costs what the Trickster’s Pickpocket Master costs', () => {
    expect(db.cards['all-seeing']?.cost).toBe(db.cards['pickpocket-master']?.cost);
    expect(db.cards['deep-breath']?.exhaust).toBe(true);
  });
});

describe('Inner Fire holds the stance exits (DECISIONS #413)', () => {
  it('leaving Serene gives 2 Mana once a turn through the trait', () => {
    const s0 = fight(['rising-ire', 'centre-yourself', 'rising-ire']);
    expect(hero(s0).statuses.calm).toBe(1); // he starts Serene
    const mana = s0.sides.a.mana;
    let s = play(s0, 'rising-ire'); // leave Serene: +2 (Rising Ire costs 0)
    expect(s.sides.a.mana).toBe(mana + 2);
    s = play(s, 'centre-yourself'); // Serene again, 1 Mana
    s = play(s, 'rising-ire'); // and out again: nothing more this turn
    expect(s.sides.a.mana).toBe(mana + 2 - 1);
    expect(RIFTWALKERS.monk.trait.text).toMatch(/leave Serene, gain 2 Mana/);
  });
});
