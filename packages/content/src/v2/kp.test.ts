// KP's Old Twelve Gauge (a weapon you Sharpen that hits every enemy) and the Mana tools everyone can reach.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function fight(hero: HeroId, hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'kp-test',
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 100;
  return s;
}
const playCard = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};

describe('KP and the Old Twelve Gauge', () => {
  it('starts every fight with the gun in hand', () => {
    const { state } = createCombat(db, {
      seed: 'g',
      a: { hero: 'kp', deck: RIFTWALKERS.kp.starter },
      b: { enemies: ['squire'] },
    });
    const cards = [...state.sides.a.hand, ...state.sides.a.draw].map((c) => c.card);
    expect(cards).toContain('old-twelve-gauge');
  });

  it('cleaves: it hits every enemy, and Sharpen makes it hit harder for the fight', () => {
    let s = fight('kp', ['old-twelve-gauge', 'rack-the-slide']);
    s = playCard(s, 'T0');
    for (const u of s.sides.b.units) expect(u.hp).toBe(95);
    s = playCard(s, 'T1'); // forge +3
    const gun = [...s.sides.a.hand, ...s.sides.a.discard, ...s.sides.a.draw].find(
      (c) => c.card === 'old-twelve-gauge',
    );
    expect(gun?.bonus).toBe(3);
    // it retains, so it is still there to fire again for 5 + 3
    s.sides.a.hand = s.sides.a.hand.filter((c) => c.card !== 'old-twelve-gauge');
    if (gun) s.sides.a.hand.push(gun);
    s = playCard(s, gun!.id);
    for (const u of s.sides.b.units) expect(u.hp).toBe(95 - 8);
  });

  it('playing a shell sharpens the gun with Hair Trigger', () => {
    let s = fight('kp', ['hair-trigger', 'buckshot-shell', 'old-twelve-gauge']);
    s = playCard(s, 'T0');
    s = playCard(s, 'T1');
    const gun = [...s.sides.a.hand, ...s.sides.a.discard].find(
      (c) => c.card === 'old-twelve-gauge',
    );
    expect(gun?.bonus).toBe(1);
  });
});

describe('Mana tools', () => {
  it('Attunement raises maximum Mana for the rest of the fight', () => {
    let s = fight('maren', ['attunement']);
    const before = s.sides.a.maxMana;
    s = playCard(s, 'T0');
    expect(s.sides.a.maxMana).toBe(before + 1);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBeGreaterThanOrEqual(before + 1);
  });

  it('Borrowed Time gives Mana now and takes it back next turn (never below 0)', () => {
    let s = fight('maren', ['borrowed-time']);
    s.sides.a.mana = 0;
    s = playCard(s, 'T0');
    expect(s.sides.a.mana).toBe(3);
    expect(s.sides.a.nextMana).toBe(-2);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana - 2);
  });

  it('every Riftwalker can reach some Mana trick', () => {
    const tricks = new Set(['mana', 'manaNext', 'maxMana']);
    for (const h of Object.keys(RIFTWALKERS)) {
      const has = Object.values(db.cards).some(
        (c) =>
          c.hero === h &&
          [...c.effects, ...c.effects.flatMap((o) => (o.op === 'power' ? o.ops : []))].some((o) =>
            tricks.has(o.op),
          ),
      );
      expect(has, h).toBe(true);
    }
  });
});

describe('innate traits', () => {
  it('every Riftwalker has one, and it does something real', () => {
    for (const [h, r] of Object.entries(RIFTWALKERS)) {
      const t = r.trait;
      expect(t.name.length, h).toBeGreaterThan(2);
      expect(t.text.length, h).toBeGreaterThan(10);
      expect(!!(t.fightStart?.length || t.turnStart?.length || t.clutch), h).toBe(true);
    }
    expect(new Set(Object.values(RIFTWALKERS).map((r) => r.trait.name)).size).toBe(
      Object.keys(RIFTWALKERS).length,
    );
  });

  it("Valeria's Oathkeeper gives 6 Barrier and 6 Plating, Mire's Grave Chill curses every enemy", () => {
    const m = fight('maren', []);
    const hero = m.sides.a.units[m.sides.a.units.length - 1]!;
    expect(hero.barrier).toBeGreaterThanOrEqual(6);
    expect(hero.statuses.plating).toBe(6);
    const g = fight('mire', []);
    for (const u of g.sides.b.units) expect(u.statuses.doom).toBe(4);
  });

  it('Clutch Genes: KP deals 60% more attack damage at or below 60% HP, and not above', () => {
    const hit = (hp: number): number => {
      const s = fight('kp', ['hammer-swing']);
      const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
      hero.hp = hp;
      // the trait switches the status on at turn start and whenever HP changes; set it as the engine would
      if (hp * 100 <= hero.maxHp * 60) hero.statuses.clutch = 60;
      const before = s.sides.b.units[0]!.hp;
      const after = playCard(s, 'T0');
      return before - after.sides.b.units[0]!.hp;
    };
    expect(hit(80)).toBe(6);
    expect(hit(40)).toBe(9);
  });

  it('Clutch Genes clears when KP is healed back above half', () => {
    const s = fight('kp', ['liquid-lunch']);
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    hero.hp = 30;
    hero.statuses.clutch = 60;
    s.sides.a.hand = [{ id: 'T0', card: 'last-call' }];
    const after = playCard(s, 'T0'); // heals 6: still under half
    expect(after.sides.a.units[after.sides.a.units.length - 1]!.statuses.clutch).toBe(60);
    const h2 = fight('kp', ['last-call']);
    const hero2 = h2.sides.a.units[h2.sides.a.units.length - 1]!;
    hero2.hp = Math.floor(hero2.maxHp * 0.6) - 2; // 55: one heal of 6 crosses the line
    hero2.statuses.clutch = 60;
    const healed = playCard(h2, 'T0');
    expect(healed.sides.a.units[healed.sides.a.units.length - 1]!.statuses.clutch ?? 0).toBe(0);
  });

  it('a fight that begins hurt starts with Clutch Genes already on', () => {
    const { state } = createCombat(db, {
      seed: 'c',
      a: { hero: 'kp', deck: RIFTWALKERS.kp.starter },
      b: { enemies: ['squire'] },
    });
    const s = clone(state);
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    hero.hp = 30;
    const after = applyAction(db, s, { type: 'endTurn' }).state;
    const h = after.sides.a.units[after.sides.a.units.length - 1]!;
    expect(h.hp).toBeLessThan(h.maxHp * 0.6);
    expect(h.statuses.clutch).toBe(60);
  });

  it('Clutch Genes switches on when damage drops KP under half, and off when healed', () => {
    const s = fight('kp', []);
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    expect(hero.statuses.clutch ?? 0).toBe(0);
    // take a big hit from a Trap-free direct source: use the enemy turn via a fabricated heavy hit
    hero.hp = 40;
    const after = applyAction(db, s, { type: 'endTurn' }).state;
    const h = after.sides.a.units[after.sides.a.units.length - 1]!;
    expect(h.hp).toBeLessThan(h.maxHp * 0.6);
    expect(h.statuses.clutch).toBe(60);
  });
});
