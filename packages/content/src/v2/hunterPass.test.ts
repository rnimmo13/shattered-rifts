// The Hunter cost pass (Robert 2026-11-08, DECISIONS #693): each Ascendancy opens its own ways to win (Beastmaster's pack, Reaver's
// Bloodlust, Predator's Ambush), Ritual stops after 8 turns, and the reworked Rares do what their text says.
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], ascendancy?: string, keepIntent = false): CombatState {
  const { state } = createCombat(db, {
    seed: 'hunter-693',
    a: {
      hero: 'hunter',
      deck: [...RIFTWALKERS.hunter.starter, ...RIFTWALKERS.hunter.starter],
      ...(ascendancy ? { ascendancy: `hunter:${ascendancy}` } : {}),
    },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
    if (!keepIntent) u.intent = null;
  }
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const allies = (s: CombatState): Unit[] => s.sides.a.units.filter((u) => u.kind === 'ally');
const foe = (s: CombatState): Unit => s.sides.b.units[0]!;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;

describe('the Hunter cost pass (#693)', () => {
  it('Beastmaster: companions share the first 6 Might and half the rest (#762), gain 2 max HP each turn, and its Might stops at 10', () => {
    let s = fight([], 'beastmaster');
    const hound = allies(s)[0]!;
    hound.hp = hound.maxHp = 200;
    const hp0 = hound.maxHp;
    for (let i = 0; i < 14; i++) {
      s = endTurn(s);
      for (const u of allies(s)) u.hp = u.maxHp;
      hero(s).hp = hero(s).maxHp;
    }
    expect(hero(s).statuses.might).toBe(10);
    // (the Hound shares 6 + half of the other 4, and grew 2 a turn)
    expect(allies(s)[0]!.statuses.might).toBe(8);
    expect(allies(s)[0]!.maxHp).toBeGreaterThan(hp0 + 20);
  });

  it('Reaver: at half HP or less his Attacks heal 20% of what they take off', () => {
    let s = fight(['strike', 'strike'], 'reaver');
    const h = hero(s);
    h.hp = Math.floor(h.maxHp / 2);
    s = play(s, 'T0', foe(s).id);
    const lost = 500 - foe(s).hp;
    expect(hero(s).hp).toBe(Math.floor(hero(s).maxHp / 2) + Math.floor((lost * 20) / 100));
    // (above half, none)
    let high = fight(['strike'], 'reaver');
    const full = hero(high).hp;
    high = play(high, 'T0', foe(high).id);
    expect(hero(high).hp).toBe(full);
  });

  it('Predator: the first Exposed each turn draws a card, the second does not', () => {
    let s = fight(['bone-crack', 'bone-crack'], 'predator');
    const n = s.sides.a.hand.length;
    s = play(s, 'T0', foe(s).id);
    expect(s.sides.a.hand.length).toBe(n - 1 + 1);
    // (that draw came on his turn after the opening hand: 10% Ambush, which the next Attack spends)
    expect(s.sides.a.discipline?.progress).toBe(10);
    s = play(s, 'T1', foe(s).id);
    expect(s.sides.a.hand.length).toBe(n - 1);
    expect(s.sides.a.discipline?.progress).toBe(0);
  });

  it("a hero's Ritual gives Might for its first 8 turns only", () => {
    let s = fight(['bloodsong']);
    s = play(s, 'T0');
    const after = (): number => hero(s).statuses.might ?? 0;
    for (let i = 0; i < 12; i++) {
      s = endTurn(s);
      hero(s).hp = hero(s).maxHp;
    }
    // (2 from the card, then 1 at the end of each of its first 8 turns)
    expect(after()).toBe(2 + 8);
  });

  it('Dire Wolf+ arrives with 4 more max HP; Killing Spree draws for the first 2 Attacks a turn', () => {
    let s = fight(['dire-wolf+']);
    s = play(s, 'T0');
    const wolf = allies(s).find((u) => u.def.startsWith('dire-wolf'))!;
    expect(wolf.maxHp).toBe(db.units['dire-wolf']!.maxHp + 4);
    let k = fight(['killing-spree', 'strike', 'strike', 'strike']);
    k = play(k, 'T0');
    const n = k.sides.a.hand.length;
    k = play(play(play(k, 'T1', foe(k).id), 'T2', foe(k).id), 'T3', foe(k).id);
    expect(k.sides.a.hand.length).toBe(n - 3 + 2);
  });

  it('Pack Frenzy: 3 Might and the Hound acts twice, and it is not consumed', () => {
    const s = fight(['pack-frenzy']);
    const hound = allies(s)[0]!.id;
    const act = legalActions(db, s).find((x) => x.type === 'play' && x.card === 'T0')!;
    const out = applyAction(db, s, act);
    expect(hero(out.state).statuses.might).toBe(3);
    expect(out.events.filter((e) => e.type === 'damage' && e.source === hound)).toHaveLength(2);
    expect(out.state.sides.a.exhausted.some((c) => c.id === 'T0')).toBe(false);
    expect(cardText(db, db.cards.bloodstorm!)).toBe(
      'Spends at most 6 Mana. Deal 7 damage X times. Draw 2 cards.',
    );
    expect(cardText(db, db.cards['bloodstorm+']!)).toBe(
      'Spends at most 6 Mana. X is 1 higher. Deal 7 damage X times. Draw 2 cards.',
    );
    expect(cardText(db, db.cards.bloodsong!)).toMatch(/first 8 turns only/);
  });

  it('Den Mother: a companion an enemy kills gives 1 Might and brings a Pup (a sacrifice does not)', () => {
    let s = fight(['den-mother'], undefined, true);
    s = play(s, 'T0');
    allies(s)[0]!.hp = 1;
    const might = hero(s).statuses.might ?? 0;
    s = endTurn(s);
    expect(hero(s).statuses.might).toBe(might + 1);
    expect(allies(s).some((u) => u.def === 'pup')).toBe(true);
  });

  it('Reaver Bloodlust keeps count across turns: Might is never given twice', () => {
    let s = fight(['blood-frenzy', 'blood-frenzy', 'blood-frenzy', 'blood-frenzy'], 'reaver');
    hero(s).hp = hero(s).maxHp = 500;
    const might = (): number => hero(s).statuses.might ?? 0;
    // (three Blood Frenzies: 3 HP paid, 1 Might each from the card, 1 from Bloodlust)
    s = play(play(play(s, 'T0'), 'T1'), 'T2');
    expect(might()).toBe(3 + 1);
    s = endTurn(s);
    hero(s).hp = hero(s).maxHp;
    s.sides.a.mana = 9;
    s.sides.a.hand.push({ id: 'T9', card: 'blood-frenzy' });
    const m0 = might();
    s = play(s, 'T9');
    // (one more HP paid: the card's 1 Might, and no Bloodlust yet)
    expect(might()).toBe(m0 + 1);
  });
});
