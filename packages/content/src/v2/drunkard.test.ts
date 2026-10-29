// KP's Old Twelve Gauge (a weapon you Sharpen that hits every enemy) and the Mana tools everyone can reach.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function fight(
  hero: HeroId,
  hand: string[],
  hp?: number,
  enemies: string[] = ['squire', 'squire'],
): CombatState {
  const { state } = createCombat(db, {
    seed: 'kp-test',
    a: {
      hero,
      deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter],
      ...(hp ? { hp } : {}),
    },
    b: { enemies },
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
      a: { hero: 'drunkard', deck: RIFTWALKERS.drunkard.starter },
      b: { enemies: ['squire'] },
    });
    const cards = [...state.sides.a.hand, ...state.sides.a.draw].map((c) => c.card);
    expect(cards).toContain('old-twelve-gauge');
  });

  it('cleaves: it hits every enemy, and Sharpen makes it hit harder for the fight', () => {
    let s = fight('drunkard', ['old-twelve-gauge', 'rack-the-slide']);
    s = playCard(s, 'T0');
    for (const u of s.sides.b.units) expect(u.hp).toBe(95);
    s = playCard(s, 'T1'); // Sharpen 4 (DECISIONS #393)
    const gun = [...s.sides.a.hand, ...s.sides.a.discard, ...s.sides.a.draw].find(
      (c) => c.card === 'old-twelve-gauge',
    );
    expect(gun?.bonus).toBe(4);
    // it retains, so it is still there to fire again for 5 + 4
    s.sides.a.hand = s.sides.a.hand.filter((c) => c.card !== 'old-twelve-gauge');
    if (gun) s.sides.a.hand.push(gun);
    s = playCard(s, gun!.id);
    for (const u of s.sides.b.units) expect(u.hp).toBe(95 - 9);
  });

  it('Point Blank: against a lone enemy it deals 25% more (DECISIONS #247)', () => {
    let s = fight('drunkard', ['old-twelve-gauge']);
    s.sides.b.units = s.sides.b.units.slice(0, 1);
    s = playCard(s, 'T0');
    // 5 damage, 25% more, rounded: 6
    expect(s.sides.b.units[0]!.hp).toBe(94);
  });

  it('playing a shell sharpens the gun with Hair Trigger', () => {
    let s = fight('drunkard', ['hair-trigger', 'buckshot-shell', 'old-twelve-gauge']);
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
    let s = fight('knight', ['attunement']);
    const before = s.sides.a.maxMana;
    s = playCard(s, 'T0');
    expect(s.sides.a.maxMana).toBe(before + 1);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBeGreaterThanOrEqual(before + 1);
  });

  it('Stolen Time gives Mana now and takes it back next turn (never below 0)', () => {
    let s = fight('knight', ['borrowed-time']);
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
      expect(
        !!(
          t.fightStart?.length ||
          t.turnStart?.length ||
          t.triggers?.length ||
          t.clutch ||
          t.shareMight ||
          t.healAfterFight
        ),
        h,
      ).toBe(true);
    }
    expect(new Set(Object.values(RIFTWALKERS).map((r) => r.trait.name)).size).toBe(
      Object.keys(RIFTWALKERS).length,
    );
  });

  it("Valeria's Oathkeeper gives 6 Barrier and 6 Plating, Dorian's Grave Chill curses when a card is consumed (no Fate at the start, DECISIONS #398)", () => {
    const m = fight('knight', []);
    const hero = m.sides.a.units[m.sides.a.units.length - 1]!;
    expect(hero.barrier).toBeGreaterThanOrEqual(6);
    expect(hero.statuses.plating).toBe(6);
    let g = fight('necromancer', ['gather-souls']);
    const fate = (s: CombatState) =>
      s.sides.b.units.reduce((n, u) => n + (u.statuses.doom ?? 0), 0);
    for (const u of g.sides.b.units) expect(u.statuses.doom ?? 0).toBe(0); // no Fate at the start
    const before = fate(g);
    g = playCard(g, 'T0'); // the card is consumed: 3 more Fate on a random enemy
    expect(fate(g)).toBe(before + 3);
  });

  it('Clutch Genes: 1% more attack damage for every 1% of max HP missing (DECISIONS #429)', () => {
    const max = RIFTWALKERS.drunkard.hero.maxHp;
    const pct = (missing: number): number => Math.floor((missing * 100) / max);
    const hit = (missing: number): number => {
      // (the fight begins hurt: the engine sets the status at turn start)
      const s = fight('drunkard', ['hammer-swing'], max - missing);
      expect(s.sides.a.units[s.sides.a.units.length - 1]!.statuses.clutch ?? 0).toBe(pct(missing));
      const before = s.sides.b.units[0]!.hp;
      const after = playCard(s, 'T0');
      return before - after.sides.b.units[0]!.hp;
    };
    expect(hit(0)).toBe(6);
    // (Robert's game: 19 of 88 HP, 69 missing, is 78% missing: +78%, not +69%)
    expect(max).toBe(88);
    expect(pct(69)).toBe(78);
    expect(hit(69)).toBe(Math.floor((6 * 178) / 100));
    expect(hit(44)).toBe(9); // half his HP: +50%
  });

  it("Clutch Genes reads the share of HP missing, so the Arena's bigger HP gives the same bonus", () => {
    const { state } = createCombat(db, {
      seed: 'c-arena',
      a: { hero: 'drunkard', deck: RIFTWALKERS.drunkard.starter, hp: 264, maxHp: 528 },
      b: { enemies: ['squire'] },
    });
    const hero = state.sides.a.units[state.sides.a.units.length - 1]!;
    expect(hero.statuses.clutch).toBe(50);
  });

  it('Clutch Genes follows HP both ways: a heal lowers it, a hit raises it', () => {
    const s = fight('drunkard', ['sob-story'], RIFTWALKERS.drunkard.hero.maxHp - 30);
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    expect(hero.statuses.clutch).toBe(Math.floor((30 * 100) / hero.maxHp));
    const healed = playCard(s, 'T0');
    const h = healed.sides.a.units[healed.sides.a.units.length - 1]!;
    expect(h.hp).toBeGreaterThan(hero.hp);
    expect(h.statuses.clutch).toBe(Math.floor(((h.maxHp - h.hp) * 100) / h.maxHp));
  });

  it('a fight that begins hurt starts with Clutch Genes already on, and an enemy hit adds to it', () => {
    const { state } = createCombat(db, {
      seed: 'c',
      a: { hero: 'drunkard', deck: RIFTWALKERS.drunkard.starter, hp: 30 },
      b: { enemies: ['squire'] },
    });
    const s = clone(state);
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    expect(hero.statuses.clutch).toBe(Math.floor(((hero.maxHp - 30) * 100) / hero.maxHp));
    const after = applyAction(db, s, { type: 'endTurn' }).state;
    const h = after.sides.a.units[after.sides.a.units.length - 1]!;
    expect(h.hp).toBeLessThan(30);
    expect(h.statuses.clutch).toBe(Math.floor(((h.maxHp - h.hp) * 100) / h.maxHp));
  });

  it('Clutch Genes is 0 at full HP', () => {
    const s = fight('drunkard', []);
    const hero = s.sides.a.units[s.sides.a.units.length - 1]!;
    expect(hero.hp).toBe(hero.maxHp);
    expect(hero.statuses.clutch ?? 0).toBe(0);
  });
});

describe('Sharpen carries over to new copies (DECISIONS #399)', () => {
  it('a gun made after the Old Twelve Gauge was sharpened is as sharp as it', () => {
    let s = fight('drunkard', ['reload', 'double-tap']);
    s = playCard(s, 'T0'); // Reload: Sharpen 3 (no gun yet, so one is made)
    const guns = () =>
      [...s.sides.a.hand, ...s.sides.a.draw, ...s.sides.a.discard].filter(
        (c) => c.card === 'old-twelve-gauge',
      );
    expect(guns().map((c) => c.bonus)).toEqual([3]);
    s = playCard(s, 'T1'); // Double Tap: another Old Twelve Gauge
    expect(guns().map((c) => c.bonus)).toEqual([3, 3]);
  });
});

describe('the damage breakdown on a card (DECISIONS #432)', () => {
  it("the Old Twelve Gauge's Point Blank is counted in the live number, and the steps add up to it", () => {
    const one = fight('drunkard', ['old-twelve-gauge'], 19, ['squire']);
    const hero = one.sides.a.units[one.sides.a.units.length - 1]!;
    hero.statuses.might = 2;
    const foe = one.sides.b.units[0]!;
    foe.statuses = { exposed: 1 };
    const live = previewCardDamage(db, one, 'T0', foe.id);
    const l = [...live.values()][0]!;
    expect(l.lone).toBe(true);
    // 5, Point Blank x1.25 = 6, +2 Might = 8, Clutch Genes (19 of 88: 78%) = 14, Exposed x1.5 = 21
    expect(l.how).toEqual([
      '5',
      'Point Blank +25% = 6',
      '+2 Might = 8',
      'Clutch Genes +78% = 14',
      'Exposed +50% = 21',
    ]);
    expect(l.lo).toBe(21);
    expect(cardText(db, db.cards['old-twelve-gauge']!, live)).toContain(
      '(Point Blank +25% counted.)',
    );
    const before = foe.hp;
    const after = playCard(one, 'T0');
    expect(before - after.sides.b.units[0]!.hp).toBe(21);
  });

  it('with two enemies Point Blank is not counted, and the card says when it would be', () => {
    const two = fight('drunkard', ['old-twelve-gauge'], RIFTWALKERS.drunkard.hero.maxHp, [
      'squire',
      'squire',
    ]);
    const live = previewCardDamage(db, two, 'T0', null);
    const l = [...live.values()][0]!;
    expect(l.lone).toBeUndefined();
    expect(cardText(db, db.cards['old-twelve-gauge']!, live)).toContain(
      'Point Blank: 25% more when only one enemy is left.',
    );
  });
});

describe('losing HP to your own cards or Hangover pays by how much (DECISIONS #434)', () => {
  const kp = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;
  const foeLost = (before: CombatState, after: CombatState): number[] =>
    after.sides.b.units.map((u, i) => before.sides.b.units[i]!.hp - u.hp);

  it("Glass Jaw: Hangover's morning-after HP hits every enemy for that much, capped at 6", () => {
    let s = fight('drunkard', ['glass-jaw']);
    s = playCard(s, 'T0');
    kp(s).statuses.hangover = 4;
    // (they attack into a wall: no Barrier of their own to soak the answer)
    for (const u of s.sides.b.units) u.intent = { move: 'slash', target: kp(s).id };
    kp(s).barrier = 99;
    const before = clone(s);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(foeLost(before, s)).toEqual([4, 4]);
    let t = fight('drunkard', ['glass-jaw']);
    t = playCard(t, 'T0');
    kp(t).statuses.hangover = 9;
    for (const u of t.sides.b.units) u.intent = { move: 'slash', target: kp(t).id };
    kp(t).barrier = 99;
    const b2 = clone(t);
    t = applyAction(db, t, { type: 'endTurn' }).state;
    expect(foeLost(b2, t)).toEqual([6, 6]);
  });

  it('Mean Drunk: 1 Might for the turn per 2 HP lost (Take It on the Chin: 3 HP, 1 Might), and its Barrier', () => {
    let s = fight('drunkard', ['mean-drunk', 'take-it-on-the-chin']);
    s = playCard(s, 'T0');
    const hp = kp(s).hp;
    s = playCard(s, 'T1');
    expect(kp(s).hp).toBe(hp - 3);
    expect(kp(s).statuses.might).toBe(1);
    expect(kp(s).barrier).toBe(10 + 2);
  });

  it('Bar Fight counts the Hangover at the start of the turn as HP lost this turn', () => {
    let s = fight('drunkard', ['bar-fight']);
    kp(s).statuses.hangover = 3;
    for (const u of s.sides.b.units) u.intent = { move: 'guard', target: null };
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.lostHpTurn).toBe(1);
    s.sides.a.hand = [{ id: 'B', card: 'bar-fight' }];
    for (const u of s.sides.b.units) u.barrier = 0;
    const before = s.sides.b.units[0]!.hp;
    const act = legalActions(db, s).find(
      (a) => a.type === 'play' && a.card === 'B' && a.target === s.sides.b.units[0]!.id,
    )!;
    s = applyAction(db, s, act).state;
    // 7 + 3 for the one loss, with the Clutch Genes of 3 HP missing (3%)
    expect(before - s.sides.b.units[0]!.hp).toBe(Math.floor((10 * 103) / 100));
  });

  it('Nurse the Hangover: 5 Barrier +1 per Hangover, at most +8', () => {
    let s = fight('drunkard', ['nurse-the-hangover', 'nurse-the-hangover']);
    kp(s).statuses.hangover = 3;
    s = playCard(s, 'T0');
    expect(kp(s).barrier).toBe(8);
    kp(s).statuses.hangover = 10;
    s = playCard(s, 'T1');
    expect(kp(s).barrier).toBe(8 + 13);
  });
});
