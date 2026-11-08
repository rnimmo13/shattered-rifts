// The Drunkard cost pass (Robert 2026-11-08, DECISIONS #695): Shells sharpen the Gunslinger's gun, Fermentation hits harder, Deathwish
// strikes back for what its cards cost, and Last Call runs a tab.
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
import { disciplineAttack } from '../../../combat/src/disciplines';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], ascendancy?: string): CombatState {
  const { state } = createCombat(db, {
    seed: 'drunkard-695',
    a: {
      hero: 'drunkard',
      deck: [...RIFTWALKERS.drunkard.starter, ...RIFTWALKERS.drunkard.starter],
      ...(ascendancy ? { ascendancy: `drunkard:${ascendancy}` } : {}),
    },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
    u.intent = null;
  }
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState): Unit => s.sides.b.units[0]!;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe('the Drunkard cost pass (#695)', () => {
  it('Gunslinger: each Shell makes the gun 1 sharper', () => {
    const sharp = (shells: number): number => {
      let s = fight(
        [...Array<string>(shells).fill('buckshot-shell'), 'old-twelve-gauge'],
        'gunslinger',
      );
      for (let i = 0; i < shells; i++) s = play(s, `T${i}`);
      return s.sides.a.hand.find((c) => c.card === 'old-twelve-gauge')?.bonus ?? 0;
    };
    expect(sharp(2) - sharp(0)).toBe(2);
    // (and the turn-start growth never stops)
    let s = fight(['old-twelve-gauge'], 'gunslinger');
    const at0 = s.sides.a.hand.find((c) => c.card === 'old-twelve-gauge')!.id;
    const bonus = (): number =>
      [...s.sides.a.hand, ...s.sides.a.draw, ...s.sides.a.discard].find((c) => c.id === at0)
        ?.bonus ?? 0;
    const first = bonus();
    for (let i = 0; i < 12; i++) {
      s = applyAction(db, s, { type: 'endTurn' }).state;
      hero(s).hp = hero(s).maxHp;
    }
    expect(bonus() - first).toBe(2 * 12);
  });

  it('the gun cards keep their gun tag when upgraded', () => {
    for (const id of ['slug-round', 'boomstick', 'last-shell', 'shotgun-wedding', 'spray-and-pray'])
      expect(db.cards[`${id}+`]?.tags, id).toContain('gun');
  });

  it('Brewmaster: each Fermentation makes his Attacks deal 4% more, up to 8', () => {
    const s = fight([], 'brewmaster');
    s.sides.a.discipline!.progress = 8;
    expect(disciplineAttack(s, s.sides.a, hero(s), db.cards.strike!, foe(s), 0)).toBe(32);
  });

  it('Deathwish: twice a turn, HP its own cards cost strikes a random enemy (up to 4)', () => {
    let s = fight(['chaser', 'chaser', 'chaser'], 'deathwish');
    const before = foe(s).hp;
    for (const id of ['T0', 'T1', 'T2']) s = play(s, id);
    // (Chaser costs 2 HP: 2, 2, then the third is past the limit)
    expect(before - foe(s).hp).toBe(4);
    // (a bigger payment strikes for 4 at most)
    let big = fight(['take-it-on-the-chin'], 'deathwish');
    const b0 = foe(big).hp;
    big = play(big, 'T0');
    expect(b0 - foe(big).hp).toBe(3);
    // (a Hangover payment strikes back too)
    let h = fight([], 'deathwish');
    hero(h).statuses.hangover = 3;
    const h0 = foe(h).hp;
    h = applyAction(db, h, { type: 'endTurn' }).state;
    expect(h0 - foe(h).hp).toBeGreaterThan(0);
  });

  it('Last Call: 1 Mana; each turn +1 Mana and 1 Hangover', () => {
    expect(db.cards['last-call']?.cost).toBe(1);
    let s = fight(['last-call']);
    s = play(s, 'T0');
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana + 1);
    expect(hero(s).statuses.hangover).toBe(1);
    expect(cardText(db, db.cards['last-call']!)).toMatch(/Mana/);
  });

  it('Rock Bottom: 3 Might, then 1 HP for 1 Might in each of your first 6 turns', () => {
    let s = fight(['rock-bottom']);
    s = play(s, 'T0');
    expect(hero(s).statuses.might).toBe(3);
    for (let i = 0; i < 8; i++) {
      s = applyAction(db, s, { type: 'endTurn' }).state;
      hero(s).hp = hero(s).maxHp;
    }
    expect(hero(s).statuses.might).toBe(3 + 6);
  });
});
