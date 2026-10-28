// Ilvane, the Defect-shaped totemist (docs/decisions-pending/totemist.md): the starter is the Defect's, his totems are the Defect's
// orbs with their numbers, Spirit is Focus, and the trickier copied cards do what their text says.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  clone,
  costOf,
  createCombat,
  legalActions,
  type CombatEvent,
  type CombatState,
  type RuneState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, pathSizes, rewardPool } from './index';
import { TOTEMIST } from './pools/totemist';

/** One Squire with 200 HP; `hand` in hand, nothing else in any pile; `runes` replaces the three the trait planted. */
function fight(hand: string[], runes?: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'totemist-test',
    a: { hero: 'totemist', deck: RIFTWALKERS.totemist.starter },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = [];
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  if (runes)
    s.sides.a.runes = runes.map((rune): RuneState => ({
      rune,
      charge: db.runes?.[rune]?.start ?? 0,
    }));
  const u = s.sides.b.units[0]!;
  u.hp = u.maxHp = 200;
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
const endTurn = (s: CombatState): { state: CombatState; events: CombatEvent[] } =>
  applyAction(db, s, { type: 'endTurn' });
const foeHp = (s: CombatState): number => s.sides.b.units[0]!.hp + s.sides.b.units[0]!.barrier;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;
/** what the hero's totems dealt to the enemy and gave the hero at the end of a turn */
const passives = (events: CombatEvent[], foeId: string, heroId: string) => ({
  dealt: events
    .filter((e) => e.type === 'damage' && e.target === foeId && e.source === heroId)
    .reduce((n, e) => n + (e.type === 'damage' ? e.amount : 0), 0),
  barrier: events
    .filter((e) => e.type === 'barrier' && e.target === heroId)
    .reduce((n, e) => n + (e.type === 'barrier' ? e.amount : 0), 0),
});

describe('Ilvane is the Defect shape', () => {
  it("starts with the Defect's ten (4 Strike, 4 Defend, Zap, Dualcast) and 75 HP, and keeps his three totems", () => {
    expect(RIFTWALKERS.totemist.starter).toEqual([
      ...Array<string>(4).fill('strike'),
      ...Array<string>(4).fill('defend'),
      'spark-cast',
      'twin-evocation',
    ]);
    expect(RIFTWALKERS.totemist.hero.maxHp).toBe(75);
    const { state } = createCombat(db, {
      seed: 'ilvane-start',
      a: { hero: 'totemist', deck: RIFTWALKERS.totemist.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.runes.map((r) => r.rune)).toEqual(['spark', 'ward', 'splinter']);
  });

  it('has one card for each Defect card it copies (83) plus the Kindling token, and no Trap or Legendary', () => {
    const own = TOTEMIST.filter((c) => !c.source);
    expect(own).toHaveLength(83);
    expect(TOTEMIST.filter((c) => c.source === 'token').map((c) => c.id)).toEqual(['kindling']);
    expect(own.filter((c) => c.rarity === 'basic')).toHaveLength(2);
    expect(own.filter((c) => c.rarity === 'common')).toHaveLength(20);
    expect(own.filter((c) => c.rarity === 'uncommon')).toHaveLength(36);
    expect(own.filter((c) => c.rarity === 'rare')).toHaveLength(25);
    expect(own.filter((c) => c.kind === 'snare')).toEqual([]);
    expect(rewardPool('totemist').filter((id) => db.cards[id]?.hero === 'totemist')).toHaveLength(
      81,
    );
    for (const n of pathSizes('totemist')) expect(n).toBeGreaterThanOrEqual(12);
  });
});

describe("his totems are the Defect's orbs", () => {
  it('Hawk (Lightning) 3 at the end of the turn, Bear (Frost) 2 Barrier; Spirit adds to both', () => {
    const s = fight([], ['spark', 'ward']);
    const foeId = s.sides.b.units[0]!.id;
    const plain = passives(endTurn(s).events, foeId, hero(s).id);
    expect(plain.dealt).toBe(3);
    expect(plain.barrier).toBe(2);
    const s2 = fight([], ['spark', 'ward']);
    hero(s2).statuses.resonance = 2;
    const focused = passives(endTurn(s2).events, foeId, hero(s2).id);
    expect(focused.dealt).toBe(5);
    expect(focused.barrier).toBe(4);
  });

  it('Twin Awakening (Dualcast) awakens the oldest totem twice: a Hawk for 8 and 8', () => {
    const s = play(fight(['twin-evocation'], ['spark', 'ward']), 'twin-evocation');
    expect(foeHp(s)).toBe(200 - 16);
    expect(s.sides.a.runes.map((r) => r.rune)).toEqual(['ward']);
  });

  it('Elder (Dark) starts at 6 and charges by 6; Splinter (Glass) hits for 4 and fades', () => {
    let s = fight([], ['hollow', 'splinter']);
    s = endTurn(s).state;
    expect(s.sides.a.runes.map((r) => r.charge)).toEqual([12, 3]);
    expect(foeHp(s)).toBeLessThanOrEqual(200 - 4);
  });

  it('Owls (Plasma) give their Mana at the start of your turn: Falling Star plants three', () => {
    let s = fight(['falling-star'], []);
    s = play(s, 'falling-star');
    expect(foeHp(s)).toBe(200 - 24);
    s = endTurn(s).state;
    expect(s.sides.a.mana).toBe(3 + 3);
  });

  it('Totem Volley (Barrage) hits once per totem', () => {
    const s = play(fight(['charged-blow'], ['spark', 'ward', 'splinter']), 'charged-blow');
    expect(foeHp(s)).toBe(200 - 15);
  });

  it('Bear Pack (Chill) plants a Bear for each enemy', () => {
    const s = play(fight(['cold-snap'], []), 'cold-snap');
    expect(s.sides.a.runes.map((r) => r.rune)).toEqual(['ward']);
  });

  it('Devouring Night (Consuming Shadow) plants two Elders and awakens the newest totem at the end of every turn', () => {
    let s = play(fight(['gathering-dark'], ['spark']), 'gathering-dark');
    expect(s.sides.a.runes.map((r) => r.rune)).toEqual(['spark', 'hollow', 'hollow']);
    s = endTurn(s).state;
    // the newest Elder awakened for its 6, then the Hawk and the other Elder fired their passives
    expect(s.sides.a.runes.map((r) => r.rune)).toEqual(['spark', 'hollow']);
    expect(foeHp(s)).toBeLessThanOrEqual(200 - 6 - 3);
  });
});

describe('Spirit (Focus)', () => {
  it('Spirit Strike (Focused Strike) gives 1 Spirit for this turn only, so the Hawk hits for 4 tonight', () => {
    const s = play(fight(['resonant-strike'], ['spark']), 'resonant-strike');
    expect(foeHp(s)).toBe(200 - 9);
    expect(hero(s).statuses.resonance).toBe(1);
    const r = endTurn(s);
    expect(passives(r.events, s.sides.b.units[0]!.id, hero(s).id).dealt).toBe(4);
    expect(hero(r.state).statuses.resonance ?? 0).toBe(0);
  });

  it('Skyfall (Hyperbeam) costs 3 Spirit until the end of the turn, never more than you have, and it comes back', () => {
    let s = fight(['tune-the-lattice', 'hyperbeam'], ['spark']);
    s = play(s, 'tune-the-lattice');
    s = play(s, 'hyperbeam');
    expect(foeHp(s)).toBe(200 - 24);
    expect(hero(s).statuses.resonance ?? 0).toBe(0);
    const r = endTurn(s);
    expect(passives(r.events, s.sides.b.units[0]!.id, hero(s).id).dealt).toBe(3);
    expect(hero(r.state).statuses.resonance).toBe(1);
  });
});

describe('status cards', () => {
  it('Ironbark (Fight Through) adds 2 Wounds, which make Boulder Fist (Rocket Punch) 2 cheaper until played', () => {
    let s = fight(['ironbark', 'boulder-fist']);
    s = play(s, 'ironbark');
    expect(hero(s).barrier).toBe(13);
    const fist = s.sides.a.hand.find((c) => c.card === 'boulder-fist')!;
    expect(costOf(db, s.sides.a, fist)).toBe(0);
    s = play(s, 'boulder-fist');
    const back = s.sides.a.discard.find((c) => c.card === 'boulder-fist')!;
    expect(costOf(db, s.sides.a, back)).toBe(2);
  });

  it('Blazing Eye (Flak Cannon) consumes every status card and hits for 8 each', () => {
    let s = fight(['ironbark', 'gust-step', 'blazing-aperture']);
    s = play(s, 'ironbark');
    s = play(s, 'gust-step');
    s = play(s, 'blazing-aperture');
    expect(foeHp(s)).toBe(200 - 3 * 8);
    expect(s.sides.a.exhausted.map((c) => c.card).sort()).toEqual(['haze', 'wound', 'wound']);
  });

  it('Kindled Rite (Smokestack) strikes every enemy whenever you make a status card', () => {
    let s = fight(['kindled-rite', 'mudslide']);
    s = play(s, 'kindled-rite');
    s = play(s, 'mudslide');
    expect(foeHp(s)).toBe(200 - 12 - 5);
  });

  it('Gather Kindling (Compact) turns status cards in hand into Kindling (Fuel), which gives Mana', () => {
    let s = fight(['gather-kindling', 'wound', 'strike']);
    s = play(s, 'gather-kindling');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['kindling', 'strike']);
    const mana = s.sides.a.mana;
    s = play(s, 'kindling');
    expect(s.sides.a.mana).toBe(mana + 1);
  });

  it('Scorch (Burn) hurts if held, Drain (Void) costs a Mana when drawn', () => {
    let s = fight(['scorch']);
    s.sides.a.draw = [{ id: 'V', card: 'void-drain' }];
    const hp = hero(s).hp;
    s = endTurn(s).state;
    expect(hero(s).hp).toBeLessThanOrEqual(hp - 2);
    expect(s.sides.a.mana).toBe(3 - 1);
  });
});

describe('the zero-cost cards', () => {
  it('Gale Strike (Momentum Strike) costs 0 after its first play, for the rest of the fight', () => {
    let s = fight(['gale-strike']);
    s = play(s, 'gale-strike');
    const back = s.sides.a.discard.find((c) => c.card === 'gale-strike')!;
    expect(costOf(db, s.sides.a, back)).toBe(0);
  });

  it("Wind's Favor (One for All) and Gathering Storm (Claw): a 0-cost Attack hits for 3 more, and every Claw grows", () => {
    let s = fight(['winds-favor', 'gathering-storm', 'gathering-storm']);
    s = play(s, 'winds-favor');
    s = play(s, 'gathering-storm');
    expect(foeHp(s)).toBe(200 - 6);
    s = play(s, 'gathering-storm');
    expect(foeHp(s)).toBe(200 - 6 - 8);
  });
});
