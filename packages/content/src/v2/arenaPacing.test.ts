// X cards (Robert 2026-11-09, DECISIONS #709, #711): every X card spends at most 6 Mana, and its hits carry half the Might. Arena HP costs
// x5 and Shatters +5 a threshold with the spread from 50 Fracture (#713).
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  ARENA_HP_COST_MULT,
  cardText,
  clone,
  createCombat,
  heroOf,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db } from './index';

function campaign(hero: string): CombatState {
  const s = clone(
    createCombat(db, { seed: 'x-cards', a: { hero, deck: [] }, b: { enemies: ['squire'] } }).state,
  );
  s.sides.a.mana = 20;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 5000;
    u.intent = null;
  }
  return s;
}
let n = 0;
function play(s: CombatState, card: string): CombatState {
  const id = `x-${n++}`;
  s.sides.a.hand.push({ id, card });
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, card).toBeTruthy();
  return applyAction(db, s, act!).state;
}
const foe = (s: CombatState) => s.sides.b.units.find((u) => u.hp > 0)!;

describe('X cards (#709, #711)', () => {
  it('every Mana X card spends at most 6 Mana', () => {
    for (const c of Object.values(db.cards)) if (c.x) expect(c.xMax, c.id).toBe(6);
  });

  it('Bloodstorm spends at most 6 Mana and leaves the rest; upgraded it hits 7 times', () => {
    const s = campaign('hunter');
    s.sides.a.mana = 9;
    const before = foe(s).hp;
    const r = play(s, 'bloodstorm');
    expect(r.sides.a.mana).toBe(3);
    expect(before - foe(r).hp).toBe(7 * 6);
    const up = campaign('hunter');
    up.sides.a.mana = 9;
    const u = play(up, 'bloodstorm+');
    expect(foe(up).hp - foe(u).hp).toBe(7 * 7);
  });

  it('Bloodstorm with 8 Might hits for 7 + 4 each time; a plain Attack keeps all 8', () => {
    const s = campaign('hunter');
    heroOf(s.sides.a)!.statuses.might = 8;
    s.sides.a.mana = 3;
    const before = foe(s).hp;
    const r = play(s, 'bloodstorm');
    expect(before - foe(r).hp).toBe(3 * (7 + 4));
    const t = campaign('hunter');
    heroOf(t.sides.a)!.statuses.might = 8;
    const b2 = foe(t).hp;
    const u = play(t, 'twin-fang');
    expect(b2 - foe(u).hp).toBe(
      2 * (db.cards['twin-fang']!.effects[0] as { amount: number }).amount + 2 * 8,
    );
  });
});

function arena(hero: string, ascendancy?: string): CombatState {
  const s = clone(
    createCombat(db, {
      seed: 'arena-713',
      a: { hero, deck: [], hp: 1000, maxHp: 1000, ...(ascendancy ? { ascendancy } : {}) },
      b: { hero: 'knight', deck: [], hp: 5000, maxHp: 5000 },
    }).state,
  );
  s.sides.a.mana = 20;
  return s;
}

describe('Arena HP costs x5 (#713)', () => {
  it('a hero pays five times the HP their own card says in the Arena, and the card says so there', () => {
    const a = arena('hunter');
    const hp = heroOf(a.sides.a)!.hp;
    expect(heroOf(play(a, 'open-a-vein+').sides.a)!.hp).toBe(hp - 2 * ARENA_HP_COST_MULT);
    const c = campaign('hunter');
    const chp = heroOf(c.sides.a)!.hp;
    expect(heroOf(play(c, 'open-a-vein+').sides.a)!.hp).toBe(chp - 2);
    expect(cardText(db, db.cards['open-a-vein+']!)).toMatch(/Lose 2 HP/);
    expect(cardText(db, db.cards['open-a-vein+']!, undefined, { hpCostMult: 5 })).toMatch(
      /Lose 10 HP/,
    );
  });

  it("the Reaver's Bloodlust counts 15 HP a Might in the Arena", () => {
    let s = arena('hunter', 'hunter:reaver');
    const might = () => heroOf(s.sides.a)!.statuses.might ?? 0;
    const m0 = might();
    // (Open a Vein+: 10 HP in the Arena and 2 Might of its own; Bloodlust needs 15)
    s = play(s, 'open-a-vein+');
    expect(might()).toBe(m0 + 2);
    s = play(s, 'open-a-vein+');
    expect(might()).toBe(m0 + 4 + 1);
  });
});

describe('Shatters +5 a threshold, spreading from 50 Fracture (#713)', () => {
  const two = (): CombatState => {
    const s = clone(
      createCombat(db, {
        seed: 'shatter-713',
        a: { hero: 'spellblade', deck: [] },
        b: { enemies: ['squire', 'squire'] },
      }).state,
    );
    s.sides.a.mana = 20;
    s.sides.a.stars = 0;
    for (const u of s.sides.b.units) {
      u.hp = u.maxHp = 5000;
      u.intent = null;
      u.statuses = {};
    }
    return s;
  };
  const playAt = (s: CombatState, card: string, target: string): CombatState => {
    const id = `p713-${n++}`;
    s.sides.a.hand.push({ id, card });
    const act = legalActions(db, s).find(
      (a) => a.type === 'play' && a.card === id && a.target === target,
    );
    expect(act, card).toBeTruthy();
    return applyAction(db, s, act!).state;
  };
  it('below 50 Fracture a Shatter cracks nothing else; from 50 on it puts 10 on the other enemy, which does not spread back', () => {
    let s = two();
    s.sides.b.units[0]!.statuses.fracture = 35;
    // (Rupture Script: 10 Fracture, the Shatter at 40 deals 35 and does not spread)
    s = playAt(s, 'rupture-script', s.sides.b.units[0]!.id);
    expect(s.sides.b.units[1]!.statuses.fracture ?? 0).toBe(0);
    s.sides.b.units[1]!.statuses.fracture = 45;
    // (the Shatter at 50 on the first spreads 10 to the second: its own Shatter at 50 deals 40 and spreads no further)
    const hpY = s.sides.b.units[1]!.hp;
    s = playAt(s, 'rupture-script', s.sides.b.units[0]!.id);
    expect(s.sides.b.units[1]!.statuses.fracture).toBe(55);
    expect(hpY - s.sides.b.units[1]!.hp).toBe(40);
    expect(s.sides.b.units[0]!.statuses.fracture).toBe(55);
  });
});
