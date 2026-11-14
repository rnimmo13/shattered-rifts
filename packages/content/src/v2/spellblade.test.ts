// The Spellblade on Spell Power and Fracture (DECISIONS #480; docs/reworks/SPELLBLADE_SPELL_POWER_MERGED.md): the rules, then one scenario
// for every card.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  validateDb,
  viewFor,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RETIRED_CARDS, RIFTWALKERS, canonicalCard } from './index';

const BLADE = 'starforged-blade';

function fight(
  hand: string[],
  opts: { stars?: number; foes?: number; draw?: string[] } = {},
): CombatState {
  const deck = RIFTWALKERS.spellblade.starter;
  const { state } = createCombat(db, {
    seed: 'spellblade-test',
    a: { hero: 'spellblade', deck: [...deck, ...deck] },
    b: { enemies: Array.from({ length: opts.foes ?? 1 }, () => 'squire') },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = (opts.draw ?? ['strike', 'strike', 'strike', 'strike', 'strike']).map(
    (card, i) => ({ id: `D${i}`, card }),
  );
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  s.sides.a.stars = opts.stars ?? 8;
  s.sides.a.starsGainedTurn = 0;
  s.sides.a.starsSpentTurn = 0;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 900;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
const foe = (s: CombatState, i = 0) => s.sides.b.units[i]!;
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
function play(s: CombatState, id: string, pick?: string[]): CombatState {
  const c = s.sides.a.hand.find((x) => x.card === id || x.card === `${id}`);
  expect(c, `${id} in hand`).toBeTruthy();
  const def = db.cards[c!.card]!;
  let r = applyAction(db, s, {
    type: 'play',
    card: c!.id,
    ...(def.target === 'foe' ? { target: foe(s).id } : {}),
  }).state;
  if (pick && r.pending) r = applyAction(db, r, { type: 'pick', cards: pick }).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
}
const lost = (s: CombatState, i = 0) => 900 - foe(s, i).hp;

describe('the pool', () => {
  const mine = Object.values(db.cards).filter(
    (c) => c.hero === 'spellblade' && !c.id.endsWith('+'),
  );
  const rewards = mine.filter((c) => c.rarity !== 'basic' && c.source !== 'token');

  it('is valid data, and holds 89 reward cards with 20 Auras', () => {
    expect(validateDb(db)).toEqual([]);
    expect(rewards).toHaveLength(89);
    expect(rewards.filter((c) => c.kind === 'power')).toHaveLength(20);
    expect(rewards.filter((c) => c.rarity === 'common')).toHaveLength(27);
    expect(rewards.filter((c) => c.rarity === 'uncommon')).toHaveLength(41);
    expect(rewards.filter((c) => c.rarity === 'rare')).toHaveLength(21);
  });

  it('no card of hers Sharpens, makes Retainers or creates Neutral cards', () => {
    const text = JSON.stringify(mine.map((c) => c.effects));
    for (const word of ['"forge"', 'retainer', '"discover"', '"transform"'])
      expect(text).not.toContain(word);
  });

  it('every retired card of hers becomes one of hers', () => {
    for (const id of ['spoils', 'seven-shards', 'hollow-form', 'retainer-strike', 'to-arms']) {
      expect(RETIRED_CARDS[id], id).toBeDefined();
      expect(db.cards[canonicalCard(id)]?.hero, id).toBe('spellblade');
    }
  });

  it('a starting deck of ten holds the Blade, two Obsidian Wards, a spell and one Fracture card, Faultline Hex (DECISIONS #787)', () => {
    const s = RIFTWALKERS.spellblade.starter;
    expect(s).toHaveLength(10);
    for (const id of [BLADE, 'meteor-jab', 'obsidian-ward']) expect(s).toContain(id);
    expect(s.filter((id) => id === 'obsidian-ward')).toHaveLength(2);
    // (Fracture was left to rewards, DECISIONS #483, until each Ascendancy got a starting card, #787)
    expect(s.filter((id) => JSON.stringify(db.cards[id]!.effects).includes('fracture'))).toEqual([
      'faultline-hex',
    ]);
  });
});

describe('Spell Power', () => {
  it('every fight opens with 4, and Kindled adds 1 each turn', () => {
    const { state } = createCombat(db, {
      seed: 'sp',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.stars).toBe(5);
    const next = applyAction(db, state, { type: 'endTurn' }).state;
    expect(next.sides.a.stars).toBe(6);
  });

  it('X spends all of it', () => {
    const r = play(fight(['devastate']), 'devastate');
    expect(r.sides.a.stars).toBe(0);
    expect(lost(r)).toBe(12 + 48);
  });

  it('X/2 spends half, rounded down', () => {
    const even = play(fight(['skybolt'], { stars: 8 }), 'skybolt');
    expect(even.sides.a.stars).toBe(4);
    expect(lost(even)).toBe(8 + 16);
    const odd = play(fight(['skybolt'], { stars: 7 }), 'skybolt');
    expect(odd.sides.a.stars).toBe(4);
    expect(lost(odd)).toBe(8 + 12);
    const one = play(fight(['skybolt'], { stars: 1 }), 'skybolt');
    expect(one.sides.a.stars).toBe(1);
    expect(lost(one)).toBe(8);
  });

  it('a spell plays with none held', () => {
    expect(lost(play(fight(['devastate'], { stars: 0 }), 'devastate'))).toBe(12);
  });

  it('there is no cap on spending, but past 20 Spell Power each point counts half (#762)', () => {
    const s = play(fight(['comet'], { stars: 40 }), 'comet');
    expect(lost(s)).toBe(20 + 7 * 20 + (7 * 20) / 2);
  });

  it('there is no choice of amount: one legal play for a target', () => {
    const s = fight(['devastate']);
    expect(legalActions(db, s).filter((a) => a.type === 'play')).toHaveLength(1);
  });

  it('a basic or common spends at most half; only uncommons and rares can spend it all', () => {
    for (const c of Object.values(db.cards)) {
      if (c.hero !== 'spellblade' || !c.starX) continue;
      expect(['uncommon', 'rare'], c.id).toContain(c.rarity);
    }
  });

  it('Lava Bomb is the best rate per point she has', () => {
    const rate = (id: string) =>
      lost(play(fight([id], { stars: 11 }), id)) - lost(play(fight([id], { stars: 10 }), id));
    expect(rate('comet')).toBe(7);
    expect(rate('devastate')).toBeLessThan(7);
  });

  it('the spending cards are X or X/2, never both', () => {
    for (const c of Object.values(db.cards)) expect(c.starX && c.starHalf, c.id).toBeFalsy();
  });

  it('the preview reads what the card will spend', () => {
    const at = (card: string) => {
      const s = fight([card]);
      return [...previewCardDamage(db, s, 'T0', foe(s).id).values()][0]!.lo;
    };
    expect(at('devastate')).toBe(60);
    expect(at('skybolt')).toBe(24);
  });

  it('a Sword reads Spell Power when it starts, and what it gains comes after', () => {
    const s = play(fight(['forged-in-fury'], { stars: 5 }), 'forged-in-fury');
    // 5 Spell Power: 1 + 1 hits of 2; the gain to 6 would have given a third
    expect(lost(s)).toBe(4);
    expect(s.sides.a.stars).toBe(6);
  });

  it('the Blade deals 2 more per Spell Power (1 more past 20, #762), with no cap, and spends none (DECISIONS #488)', () => {
    const at = (stars: number) => lost(play(fight([BLADE], { stars }), BLADE));
    expect(at(0)).toBe(5);
    expect(at(1)).toBe(7);
    expect(at(8)).toBe(21);
    expect(at(20)).toBe(45);
    expect(at(40)).toBe(65);
    expect(play(fight([BLADE], { stars: 12 }), BLADE).sides.a.stars).toBe(12);
  });
});

describe('what makes the Blade hit harder', () => {
  it('Might and Primed add to every hit', () => {
    const s = fight(['forge-heat', BLADE]);
    hero(s).statuses.might = 2;
    const r = play(play(s, 'forge-heat'), BLADE);
    // one hit: 5 + 2 per Spell Power, 2 Might and 2 Primed
    expect(lost(r)).toBe(21 + 2 + 2);
    expect(hero(r).statuses.vigor ?? 0).toBe(0);
  });

  it('Whispering Edge adds to every Sword and to nothing else', () => {
    const r = play(play(fight(['whispering-edge', BLADE]), 'whispering-edge'), BLADE);
    expect(lost(r)).toBe(21 + 2);
    const spell = play(
      play(fight(['whispering-edge', 'skybolt'], { stars: 0 }), 'whispering-edge'),
      'skybolt',
    );
    expect(lost(spell)).toBe(8);
  });

  it('Crowned Edge gives Primed for this turn only', () => {
    const r = play(fight(['conqueror']), 'conqueror');
    expect(hero(r).statuses.vigor).toBe(2);
    const next = applyAction(db, r, { type: 'endTurn' }).state;
    expect(hero(next).statuses.vigor ?? 0).toBe(0);
  });

  it('Tempered Focus Primes each turn; Quenched Edge Primes after a spend, once a turn', () => {
    const tf = play(fight(['tempered-focus']), 'tempered-focus');
    expect(hero(applyAction(db, tf, { type: 'endTurn' }).state).statuses.vigor).toBe(1);
    const q = play(
      play(fight(['quenched-edge', 'skybolt', 'star-barrier']), 'quenched-edge'),
      'skybolt',
    );
    const q2 = play(q, 'star-barrier');
    expect(hero(q2).statuses.vigor).toBe(1);
  });

  it('Cleaving Edge makes the Blade strike every enemy and gains 2', () => {
    const r = play(play(fight(['cleaving-edge', BLADE], { foes: 2 }), 'cleaving-edge'), BLADE);
    expect(r.sides.a.stars).toBe(10);
    expect(lost(r, 0)).toBe(25);
    expect(lost(r, 1)).toBe(25);
  });

  it('Echoing Blade adds a hit to the Blade, and not to other Swords', () => {
    const s = play(
      fight(['echoing-blade', BLADE, 'obsidian-flurry'], { stars: 8 }),
      'echoing-blade',
    );
    expect(lost(play(s, BLADE))).toBe(21 * 2);
    expect(lost(play(s, 'obsidian-flurry'))).toBe(3 * (4 + 2));
  });

  it('Measured Ruin adds to the first spending Spell Attack each turn only', () => {
    const s = play(fight(['measured-ruin', 'skybolt', 'gamma-burst']), 'measured-ruin');
    const a = play(s, 'skybolt');
    expect(lost(a)).toBe(8 + 16 + 4);
    const b = play(a, 'gamma-burst');
    expect(lost(b) - lost(a)).toBe(6 + 8);
  });
});

describe('Fracture and Shatter', () => {
  it('every 10 Shatters it, harder each time, and Fracture only adds up', () => {
    const start = fight(['rupture-script']);
    foe(start).statuses.fracture = 15;
    const s = play(start, 'rupture-script');
    expect(foe(s).statuses.fracture).toBe(25);
    // (it crosses 20 only: the second Shatter, 23 since #726, + Spell Power 8)
    expect(lost(s)).toBe(31);
  });

  // (Shatters grow by 3 each threshold since #726: 20, 23, 26... 47 at 100; 5 since #713)
  it('the Shatter at 100 deals 47, and ten of them come to 335 (DECISIONS #523, #713, #726)', () => {
    const s = fight(['hairline-crack'], { stars: 0 });
    foe(s).statuses.fracture = 95;
    const r = play(s, 'hairline-crack');
    expect(foe(r).statuses.fracture).toBe(100);
    expect(lost(r)).toBe(47);
    let total = fight(['rupture-script'], { stars: 0 });
    foe(total).statuses.fracture = 0;
    total = play(total, 'rupture-script');
    for (let i = 0; i < 9; i++) {
      total.sides.a.hand.push({ id: `R${i}`, card: 'rupture-script' });
      total.sides.a.mana = 9;
      total = play(total, 'rupture-script');
    }
    expect(foe(total).statuses.fracture).toBe(100);
    expect(lost(total)).toBe(20 + 23 + 26 + 29 + 32 + 35 + 38 + 41 + 44 + 47);
  });

  it('every Shatter adds the Spell Power you hold, and spends none (DECISIONS #487)', () => {
    const at = (stars: number) => play(fight(['rupture-script'], { stars }), 'rupture-script');
    expect(lost(at(0))).toBe(20);
    expect(lost(at(8))).toBe(28);
    expect(lost(at(20))).toBe(40);
    expect(lost(at(21))).toBe(40);
    expect(lost(at(22))).toBe(41);
    expect(lost(at(27))).toBe(43);
    expect(lost(at(100))).toBe(80);
    expect(at(27).sides.a.stars).toBe(27);
  });

  it('a Fracture card in hand shows the Shatter it would set off, and what playing it really deals', () => {
    const s = fight(['faultline-hex']);
    // (no Shatter reachable: nothing is shown)
    expect(previewCardDamage(db, s, 'T0').get(0)).toBeUndefined();
    expect(cardText(db, db.cards['faultline-hex']!, previewCardDamage(db, s, 'T0'))).not.toContain(
      'Shatter',
    );
    foe(s).statuses.fracture = 15;
    const live = previewCardDamage(db, s, 'T0');
    // (the second Shatter, 23 since #726, + Spell Power 8), as playing it deals
    expect(live.get(0)).toMatchObject({ lo: 31, hi: 31, shatter: true });
    expect(live.get(0)!.how).toEqual(['Shatter 2: 23', '+8 Spell Power = 31']);
    expect(lost(play(s, 'faultline-hex'))).toBe(31);
    expect(cardText(db, db.cards['faultline-hex']!, live)).toContain(
      'Apply 7 Fracture (Shatter [[live:calc:31]]).',
    );
  });

  it('the Shatter preview is a range over the enemies it could hit, 0 for one it would not Shatter', () => {
    const s = fight(['faultline-hex', 'spreading-fault'], { foes: 2 });
    foe(s, 1).statuses.fracture = 5;
    expect(previewCardDamage(db, s, 'T0').get(0)).toMatchObject({ lo: 0, hi: 28 });
    expect(previewCardDamage(db, s, 'T0', foe(s, 0).id).get(0)).toBeUndefined();
    expect(previewCardDamage(db, s, 'T0', foe(s, 1).id).get(0)).toMatchObject({ lo: 28, hi: 28 });
    const all = previewCardDamage(db, s, 'T1').get(0);
    expect(all).toMatchObject({ lo: 0, hi: 28, each: true, shatter: true });
    expect(cardText(db, db.cards['spreading-fault']!, previewCardDamage(db, s, 'T1'))).toContain(
      '(Shatter [[live:calc:0-28]] each)',
    );
  });

  it("the Shatter preview counts Fault Lines' Fracture after the card, as playing it does", () => {
    const s = play(fight(['fault-lines', 'faultline-hex'], { stars: 0 }), 'fault-lines');
    s.sides.a.mana = 9;
    // (12 + 7 = 19: no Shatter from the Hex itself; Fault Lines' 1 makes it 20, the second Shatter, 23 since #726)
    foe(s).statuses.fracture = 12;
    const hex = s.sides.a.hand.find((c) => c.card === 'faultline-hex')!.id;
    expect(previewCardDamage(db, s, hex).get(0)).toMatchObject({ lo: 23, hi: 23, shatter: true });
    expect(lost(play(s, 'faultline-hex'))).toBe(23);
  });

  it('a Sword or Spell with no Fracture of its own shows the Shatter Fault Lines sets off when it is played', () => {
    const s = play(fight(['fault-lines', BLADE], { stars: 0 }), 'fault-lines');
    s.sides.a.mana = 9;
    const blade = s.sides.a.hand.find((c) => c.card === BLADE)!.id;
    // (nothing to Shatter yet: no line about it)
    expect(previewCardDamage(db, s, blade).get(-2)).toBeUndefined();
    expect(cardText(db, db.cards[BLADE]!, previewCardDamage(db, s, blade))).not.toContain(
      'Shatter now',
    );
    // (19 + Fault Lines' 1 = 20: the second Shatter)
    foe(s).statuses.fracture = 19;
    const live = previewCardDamage(db, s, blade);
    const shatter = live.get(-2)!;
    expect(shatter).toMatchObject({ shatter: true, calc: true });
    expect(shatter.lo).toBe(shatter.hi);
    expect(cardText(db, db.cards[BLADE]!, live)).toContain(
      `Shatter now: [[live:calc:${shatter.lo}]].`,
    );
    // what playing it really deals: its own hit, and that Shatter
    const hit = live.get(0)!;
    expect(lost(play(s, BLADE))).toBe(hit.lo + shatter.lo);
  });

  it('cards that open with a strip, a carried Fracture or a blast are played ahead, so their Shatters show', () => {
    for (const card of ['crack-the-shell', 'breaking-point-hex', 'carry-the-fault']) {
      expect(db.cards[card], card).toBeTruthy();
      const s = fight([card], { stars: 0, foes: 2 });
      // (one enemy a point short of a Shatter, the other well into the next ten)
      foe(s, 0).statuses.fracture = 19;
      foe(s, 1).statuses.fracture = 16;
      const def = db.cards[card]!;
      const target = def.target === 'foe' ? foe(s, 0).id : undefined;
      const live = previewCardDamage(db, s, 'T0', target);
      const shown = [...live.values()].filter((l) => l.shatter);
      const before = s.sides.b.units.map((u) => u.hp);
      const after = applyAction(db, s, {
        type: 'play',
        card: 'T0',
        ...(target ? { target } : {}),
      }).state;
      const dealt = after.sides.b.units.reduce((n, u, i) => n + before[i]! - u.hp, 0);
      expect(dealt, `${card} Shatters`).toBeGreaterThan(0);
      expect(shown.length, `${card} shows its Shatter`).toBeGreaterThan(0);
      expect(Math.max(...shown.map((l) => l.hi)), `${card} shows a number`).toBeGreaterThan(0);
    }
  });

  it("an enemy's Fracture says what its next Shatter would deal, and how much more sets it off", () => {
    const s = fight(['faultline-hex']);
    // (no Fracture: nothing to say)
    expect(viewFor(db, s, 'a').sides.b.units[0]!.nextShatter).toBeUndefined();
    foe(s).statuses.fracture = 15;
    const told = viewFor(db, s, 'a').sides.b.units[0]!.nextShatter!;
    // (5 more reaches 20: the second Shatter, 23, + Spell Power 8), which is what the Hex then deals
    expect(told).toEqual({ need: 5, damage: 31 });
    expect(lost(play(s, 'faultline-hex'))).toBe(told.damage);
    // Shielded cancels it, and it says so
    foe(s).statuses.shielded = 1;
    expect(viewFor(db, s, 'a').sides.b.units[0]!.nextShatter).toEqual({ need: 5, damage: 0 });
    // (your own units' Fracture is the other side's to Shatter: not told to you)
    expect(viewFor(db, s, 'b').sides.b.units[0]!.nextShatter).toBeUndefined();
  });

  it('Fault Reader answering the Shatter does not hide it', () => {
    const s = play(fight(['fault-reader', 'faultline-hex'], { stars: 0 }), 'fault-reader');
    s.sides.a.mana = 9;
    foe(s).statuses.fracture = 15;
    const hex = s.sides.a.hand.find((c) => c.card === 'faultline-hex')!.id;
    expect(previewCardDamage(db, s, hex).get(0)).toMatchObject({ lo: 23, hi: 23, shatter: true });
    expect(lost(play(s, 'faultline-hex'))).toBe(23);
  });

  it('several Shatters at once are counted together', () => {
    // (upgraded Rupture Script applies 11: from 9 it crosses 10 and 20, so 20 + 23 since #726)
    const s = fight(['rupture-script+'], { stars: 0 });
    foe(s).statuses.fracture = 9;
    const live = previewCardDamage(db, s, 'T0');
    expect(live.get(0)).toMatchObject({ lo: 43, hi: 43, hits: 2, shatter: true });
    expect(cardText(db, db.cards['rupture-script+']!, live)).toContain(
      '(2 Shatters, [[live:calc:43]] total)',
    );
    expect(lost(play(s, 'rupture-script+'))).toBe(43);
  });

  it('it keeps scaling past 100, 3 a Shatter (#726), half of that after the tenth (#768)', () => {
    const s = fight(['hairline-crack'], { stars: 0 });
    foe(s).statuses.fracture = 106;
    // (the 11th Shatter: 17 + 30 + floor(3 / 2); 17 + 33 before #768)
    expect(lost(play(s, 'hairline-crack'))).toBe(48);
  });

  it('the 3 a Shatter is in full for the first ten Shatters and half after, rounded down (#768)', () => {
    // (Hairline Crack applies 5: from 5 short, it lands on the k-th Shatter exactly)
    const kth = (k: number): number => {
      const s = fight(['hairline-crack'], { stars: 0 });
      foe(s).statuses.fracture = 10 * k - 5;
      const after = play(s, 'hairline-crack');
      expect(foe(after).statuses.fracture).toBe(10 * k);
      return lost(after);
    };
    expect(kth(1)).toBe(17 + 3);
    expect(kth(10)).toBe(17 + 30);
    // (past the tenth: 30 + floor(3 x (k - 10) / 2))
    expect(kth(11)).toBe(17 + 30 + 1);
    expect(kth(12)).toBe(17 + 30 + 3);
    expect(kth(20)).toBe(17 + 30 + 15);
  });

  it('what Deepening adds to a Shatter is in full to 15 and half after (#768)', () => {
    const deep = (bonus: number): number => {
      const s = fight(['hairline-crack'], { stars: 0 });
      s.sides.a.shatterBonus = bonus;
      foe(s).statuses.fracture = 5;
      return lost(play(s, 'hairline-crack'));
    };
    // (the first Shatter is 20 with nothing added)
    expect(deep(0)).toBe(20);
    expect(deep(15)).toBe(20 + 15);
    expect(deep(16)).toBe(20 + 15);
    expect(deep(31)).toBe(20 + 23);
  });

  it('a cleanse does not take Fracture off', () => {
    const s = fight(['faultline-hex']);
    const r = play(s, 'faultline-hex');
    const u = foe(r);
    u.statuses.exposed = 2;
    const db2 = {
      ...db,
      cards: {
        ...db.cards,
        wash: {
          ...db.cards['strike']!,
          id: 'wash',
          kind: 'skill' as const,
          target: 'foe' as const,
          effects: [{ op: 'cleanse' as const, amount: 99, to: 'target' as const, all: true }],
        },
      },
    };
    r.sides.a.hand.push({ id: 'W', card: 'wash' });
    const after = applyAction(db2, r, { type: 'play', card: 'W', target: u.id }).state;
    expect(after.sides.b.units[0]!.statuses.fracture).toBe(7);
    expect(after.sides.b.units[0]!.statuses.exposed ?? 0).toBe(0);
  });

  it('a bigger Sword shows its fixed hits, its rule and what it comes to now (DECISIONS #509)', () => {
    const s = fight(['storm-of-glass'], { stars: 12 });
    const live = previewCardDamage(db, s, 'T0', foe(s).id);
    expect(cardText(db, db.cards['storm-of-glass']!, live)).toContain(
      'Deal 5 (+1 per 2 Spell Power) damage 4 times',
    );
    hero(s).statuses.might = 2;
    const m = previewCardDamage(db, s, 'T0', foe(s).id);
    expect(cardText(db, db.cards['storm-of-glass']!, m)).toContain(
      'Deal 5 (+1 per 2 Spell Power) damage 4 times',
    );
  });

  it('the Blade says its rule, and what it comes to now', () => {
    const s = fight([BLADE], { stars: 12 });
    const text = () => cardText(db, db.cards[BLADE]!, previewCardDamage(db, s, 'T0', foe(s).id));
    expect(text()).toContain(
      'Deal 5 (+2 per Spell Power, half as much past +40) damage ([[live:calc:29]]).',
    );
    hero(s).statuses.bladeecho = 1;
    expect(text()).toContain(
      'Deal 5 (+2 per Spell Power, half as much past +40) damage ([[live:calc:29]] a hit, 2 hits with Blade Echo, [[live:calc:58]] total).',
    );
  });

  it('under Blade Sweep the Blade asks for no target: one play, every enemy struck (DECISIONS #561)', () => {
    const plays = (s: CombatState) =>
      legalActions(db, s).filter((a) => a.type === 'play' && a.card === 'T0');
    const s = fight([BLADE], { stars: 4, foes: 3 });
    expect(plays(s)).toHaveLength(3);
    hero(s).statuses.bladesweep = 1;
    expect(plays(s)).toHaveLength(1);
    const r = play(s, BLADE);
    for (const i of [0, 1, 2]) expect(lost(r, i)).toBe(5 + 2 * 4);
  });

  it('the Blade reads as what the engine really does: swept and Shielded', () => {
    const swept = fight([BLADE], { stars: 12, foes: 2 });
    hero(swept).statuses.bladesweep = 1;
    hero(swept).statuses.bladeecho = 1;
    const a = previewCardDamage(db, swept, 'T0', foe(swept).id);
    expect(cardText(db, db.cards[BLADE]!, a)).toContain(
      '([[live:calc:29]] a hit, 2 hits with Blade Echo, [[live:calc:58]] total each)',
    );
    expect(lost(play(swept, BLADE), 0)).toBe(58);
    expect(lost(play(swept, BLADE), 1)).toBe(58);

    const shield = fight([BLADE], { stars: 12 });
    hero(shield).statuses.bladeecho = 1;
    foe(shield).statuses.shielded = 1;
    const b = previewCardDamage(db, shield, 'T0', foe(shield).id).get(0)!;
    expect(b.total).toEqual({ lo: 29, hi: 29 });
    expect(b.lo).toBe(29);
    expect(lost(play(shield, BLADE))).toBe(29);
  });

  it('a card shows what a spell will really deal', () => {
    const s = fight(['devastate'], { stars: 8 });
    const live = previewCardDamage(db, s, 'T0', foe(s).id);
    expect(cardText(db, db.cards['devastate']!, live)).toContain('[[live:calc:60]]');
  });

  it('below 10 nothing happens, and Fracture never fades', () => {
    const s = play(fight(['faultline-hex']), 'faultline-hex');
    expect(foe(s).statuses.fracture).toBe(7);
    expect(lost(s)).toBe(0);
    const later = applyAction(db, applyAction(db, s, { type: 'endTurn' }).state, {
      type: 'endTurn',
    }).state;
    expect(foe(later).statuses.fracture).toBe(7);
  });

  it('Blade Echo stacks: 1 more hit of the Blade per copy (DECISIONS #488)', () => {
    const blade = (echoes: number, might = 0) => {
      const s = fight([BLADE], { stars: 12 });
      if (echoes) hero(s).statuses.bladeecho = echoes;
      if (might) hero(s).statuses.might = might;
      return lost(play(s, BLADE));
    };
    expect(blade(0)).toBe(29);
    expect(blade(1)).toBe(58);
    expect(blade(3)).toBe(116);
    expect(blade(1, 2)).toBe(31 * 2);
    const none = fight([BLADE, 'echoing-blade'], { stars: 0 });
    expect(lost(play(play(none, 'echoing-blade'), BLADE))).toBe(5 * 2);
    expect(cardText(db, db.cards['echoing-blade']!)).toContain('strikes 1 more time');
  });

  it('Barrier stops a Shatter', () => {
    const s = fight(['rupture-script'], { stars: 0 });
    foe(s).barrier = 10;
    const r = play(s, 'rupture-script');
    expect(foe(r).barrier).toBe(0);
    expect(lost(r)).toBe(10);
  });

  it('a Shatter is not an attack: Might, Primed and Exposed do nothing to it', () => {
    const s = fight(['rupture-script'], { stars: 0 });
    hero(s).statuses.might = 5;
    hero(s).statuses.vigor = 5;
    foe(s).statuses.exposed = 3;
    expect(lost(play(s, 'rupture-script'))).toBe(20);
  });

  it('Steadfast stops an application, not a Shatter already earned', () => {
    const s = fight(['faultline-hex']);
    foe(s).statuses.steadfast = 1;
    const r = play(s, 'faultline-hex');
    expect(foe(r).statuses.fracture ?? 0).toBe(0);
    expect(foe(r).statuses.steadfast ?? 0).toBe(0);
  });

  it('a Shatter that kills stops there, and leaves the fight playable', () => {
    const s = fight(['rupture-script'], { foes: 2 });
    foe(s).hp = 10;
    const r = play(s, 'rupture-script');
    expect(foe(r).hp <= 0 || r.sides.b.units.length === 1).toBe(true);
    expect(() => legalActions(db, r)).not.toThrow();
  });

  it('Deep Fault and Heart-style raises add to every later Shatter', () => {
    const s = play(
      play(fight(['deep-fault', 'final-shatter'], { stars: 0 }), 'deep-fault'),
      'final-shatter',
    );
    // Deep Fault applied 4; Final Shatter's 8 crosses once at 26
    expect(lost(s)).toBe(26);
    expect(foe(s).statuses.fracture).toBe(12);
  });

  it('Final Shatter gives its Barrier only when it sets off a Shatter: 2 already on the target (DECISIONS #563)', () => {
    const fresh = play(fight(['final-shatter'], { stars: 0 }), 'final-shatter');
    expect(foe(fresh).statuses.fracture).toBe(8);
    expect(lost(fresh)).toBe(0);
    expect(hero(fresh).barrier).toBe(0);
    const set = fight(['final-shatter'], { stars: 0 });
    foe(set).statuses.fracture = 2;
    const r = play(set, 'final-shatter');
    expect(lost(r)).toBe(20);
    expect(hero(r).barrier).toBe(12);
  });

  it('Deepening Fault raises Shatters once a turn, after the card that applied Fracture', () => {
    const s = play(
      play(
        fight(['deepening-fault', 'faultline-hex', 'hairline-crack'], { stars: 0 }),
        'deepening-fault',
      ),
      'faultline-hex',
    );
    expect(s.sides.a.shatterBonus).toBe(2);
    foe(s).statuses.fracture = 7;
    const t = play(s, 'hairline-crack');
    expect(t.sides.a.shatterBonus).toBe(2);
    expect(lost(t)).toBe(22);
  });

  it("a Sword's cracks count as a card applying Fracture", () => {
    const s = play(
      play(fight(['deepening-fault', 'etching-edge']), 'deepening-fault'),
      'etching-edge',
    );
    expect(s.sides.a.shatterBonus).toBe(2);
  });

  it('Fracture Steadfast stopped is not an application', () => {
    const s = play(fight(['deepening-fault', 'faultline-hex']), 'deepening-fault');
    foe(s).statuses.steadfast = 1;
    expect(play(s, 'faultline-hex').sides.a.shatterBonus ?? 0).toBe(0);
  });

  it("a Shatter follows the difficulty's damage percent, as an Aura's damage does", () => {
    const s = fight(['rupture-script', 'breaking-point-hex'], { stars: 0 });
    hero(s).dmgPct = 50;
    const r = play(s, 'rupture-script');
    expect(lost(r)).toBe(10);
    // (the next Shatter would be the second, 23 since #726, halved and rounded down)
    expect(lost(play(r, 'breaking-point-hex'))).toBe(10 + 11);
  });

  it('Hungering Void only deepens enemies already marked, and sets off no card-only Aura', () => {
    const s = play(
      play(
        fight(['gravity-well', 'deepening-fault', 'hairline-crack'], { foes: 2 }),
        'gravity-well',
      ),
      'deepening-fault',
    );
    const m = play(s, 'hairline-crack');
    const bonus = m.sides.a.shatterBonus;
    const next = applyAction(db, m, { type: 'endTurn' }).state;
    expect(foe(next, 0).statuses.fracture).toBe(8);
    expect(foe(next, 1).statuses.fracture ?? 0).toBe(0);
    expect(next.sides.a.shatterBonus).toBe(bonus);
  });

  it('Fault Lines: early Sword and Spell plays apply 1 Fracture, nothing else does', () => {
    const s = play(fight(['fault-lines', BLADE, 'faultline-hex', 'strike']), 'fault-lines');
    const swung = play(s, BLADE);
    expect(foe(swung).statuses.fracture).toBe(1);
    // A Fracture card is a Spell too: its own7 and1 more.
    const hexed = play(swung, 'faultline-hex');
    expect(foe(hexed).statuses.fracture).toBe(1 + 7 + 1);
    expect(foe(play(hexed, 'strike')).statuses.fracture).toBe(9);
    expect(cardText(db, db.cards['fault-lines']!)).toContain(
      'Whenever you play a Sword or a Spell (first 6 activations on your turn): Apply 1 Fracture to its target (or the enemy with the most Fracture).',
    );
  });

  it('Fault Lines on a card with no target cracks the enemy with the most Fracture', () => {
    const s = play(fight(['fault-lines', 'radiance'], { foes: 2, stars: 0 }), 'fault-lines');
    foe(s, 1).statuses.fracture = 3;
    const r = play(s, 'radiance');
    expect(foe(r, 0).statuses.fracture ?? 0).toBe(0);
    expect(foe(r, 1).statuses.fracture).toBe(4);
  });

  it('Pillar of Glass and Fault Reader answer the first Shatter each turn', () => {
    const s = play(
      play(fight(['pillar-of-light', 'fault-reader', 'rupture-script']), 'pillar-of-light'),
      'fault-reader',
    );
    const hand = s.sides.a.hand.length;
    const stars = s.sides.a.stars ?? 0;
    const r = play(s, 'rupture-script');
    // (Pillar of Glass the Barrier; Fault Reader 2 Spell Power and a card since DECISIONS #795, no Barrier)
    expect(hero(r).barrier).toBe(6);
    expect(r.sides.a.hand.length).toBe(hand - 1 + 1);
    expect((r.sides.a.stars ?? 0) - stars).toBeGreaterThanOrEqual(2);
  });

  it("Carry the Fault adds half the most-cracked other enemy's Fracture to the target", () => {
    const s = fight(['carry-the-fault'], { foes: 2, stars: 0 });
    foe(s, 1).statuses.fracture = 16;
    const r = applyAction(db, s, { type: 'play', card: 'T0', target: foe(s, 0).id }).state;
    // the other keeps its 16; half of it and 3 more: one Shatter
    expect(foe(r, 1).statuses.fracture).toBe(16);
    expect(foe(r, 0).statuses.fracture).toBe(11);
    expect(lost(r, 0)).toBe(20);
  });

  it('Carry the Fault on a lone enemy applies 6', () => {
    expect(foe(play(fight(['carry-the-fault']), 'carry-the-fault')).statuses.fracture).toBe(6);
  });

  it('Etching Edge applies 1 Fracture and 1 more per 4 Spell Power, and deals 1 more per 2 (DECISIONS #542)', () => {
    const s = play(fight(['etching-edge'], { stars: 8 }), 'etching-edge');
    expect(foe(s).statuses.fracture).toBe(3);
    // (3 Spell Power: 1 more damage than at 2, where 2 per 4 gave none)
    const at = (stars: number): number => {
      const f = fight(['etching-edge'], { stars });
      const hp = foe(f).hp;
      return hp - foe(play(f, 'etching-edge')).hp;
    };
    expect(at(2)).toBe(3);
    expect(at(3)).toBe(3);
    expect(at(4)).toBe(4);
  });

  it('a Fractured arena opponent can be Shattered, and the hit belongs to the side that applied it', () => {
    const { state } = createCombat(db, {
      seed: 'pvp',
      mode: 'pvp',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
    } as never);
    const s = clone(state);
    const me = s.active;
    const you = me === 'a' ? 'b' : 'a';
    s.sides[me].hand = [{ id: 'P0', card: 'rupture-script' }];
    s.sides[me].mana = 9;
    s.sides[me].shatterBonus = 2;
    s.sides[me].stars = 0;
    const them = s.sides[you].units.find((u) => u.kind === 'hero')!;
    const hp = them.hp;
    them.barrier = 0;
    const r = applyAction(db, s, { type: 'play', card: 'P0', target: them.id }).state;
    expect(r.sides[you].units.find((u) => u.kind === 'hero')!.hp).toBe(hp - 22);
  });
});

describe('growing cards', () => {
  it('Deepening Enchantment yields 2, 3, 4 and only that copy grows', () => {
    let s = fight(['whetstone', 'whetstone'], { stars: 0 });
    const a = s.sides.a.hand[0]!;
    s = play(s, 'whetstone');
    expect(s.sides.a.stars).toBe(2);
    expect(a.id).toBe('T0');
    expect(s.sides.a.discard[0]!.bonus).toBe(1);
    expect(s.sides.a.hand[0]!.bonus ?? 0).toBe(0);
  });

  it('growth survives the discard pile and carries on', () => {
    let s = fight(['whetstone'], { stars: 0 });
    s = play(s, 'whetstone');
    const c = s.sides.a.discard.pop()!;
    s.sides.a.hand.push(c);
    s = play(s, 'whetstone');
    expect(s.sides.a.stars).toBe(2 + 3);
    expect(s.sides.a.discard[0]!.bonus).toBe(2);
  });

  it('a free replay yields the grown amount but does not grow it again', () => {
    const s = fight(['whetstone'], { stars: 0 });
    hero(s).statuses.mirrored = 1;
    const r = play(s, 'whetstone');
    expect(r.sides.a.stars).toBe(2 + 3);
    expect(r.sides.a.discard[0]!.bonus).toBe(1);
  });

  it('Sigil of Kindling answers the first growth each turn', () => {
    const s = play(play(fight(['orion', 'whetstone'], { stars: 0 }), 'orion'), 'whetstone');
    expect(s.sides.a.stars).toBe(2 + 2);
    expect(hero(s).barrier).toBe(2 + 1);
  });

  it('Crucible Heart makes the growing card grow 2 more, without setting itself off', () => {
    const s = play(
      play(fight(['crucible-heart', 'whetstone'], { stars: 0 }), 'crucible-heart'),
      'whetstone',
    );
    expect(s.sides.a.discard[0]!.bonus).toBe(3);
  });

  it('The Forgemaster raises a generator chosen from the hand, which stays there', () => {
    const s = play(
      fight(['the-forgemaster', 'faint-glow', 'whetstone'], { stars: 0 }),
      'the-forgemaster',
      ['T2'],
    );
    expect(s.sides.a.stars).toBe(6);
    const w = s.sides.a.hand.find((c) => c.id === 'T2')!;
    expect(w.bonus).toBe(2);
    expect(s.sides.a.hand.find((c) => c.id === 'T1')!.bonus ?? 0).toBe(0);
    expect(play(s, 'whetstone').sides.a.stars).toBe(6 + 4);
  });

  it('Fault Memory applies 3 more each play', () => {
    let s = fight(['fault-memory'], { stars: 0 });
    s = play(s, 'fault-memory');
    expect(foe(s).statuses.fracture).toBe(5);
    s.sides.a.hand.push(s.sides.a.discard.pop()!);
    s = play(s, 'fault-memory');
    expect(foe(s).statuses.fracture).toBe(13);
    expect(lost(s)).toBe(20);
  });
});

describe('Spell Power built into more cards (DECISIONS #484)', () => {
  it('Emberstrike gains 1, and 1 more after a Spell', () => {
    const s = play(
      play(fight(['glassbrand', 'sunstrike'], { stars: 3 }), 'glassbrand'),
      'sunstrike',
    );
    expect(s.sides.a.stars).toBe(5);
  });

  it('Crosscut after a Spell strikes twice more and gains 1', () => {
    const plain = play(fight(['crosscut']), 'crosscut');
    expect(plain.sides.a.stars).toBe(8);
    const after = play(play(fight(['glassbrand', 'crosscut']), 'glassbrand'), 'crosscut');
    expect(after.sides.a.stars).toBe(9);
    expect(lost(after)).toBe(5 + 8 + 4);
  });

  it('Recenter gains 1, and 2 more after a Sword and a Spell', () => {
    const s = play(
      play(
        play(fight(['glass-needle', 'glassbrand', 'recenter'], { stars: 0 }), 'glass-needle'),
        'glassbrand',
      ),
      'recenter',
    );
    expect(s.sides.a.stars).toBe(3);
  });
});

describe('her Barrier scales with Spell Power (DECISIONS #486)', () => {
  /** every Barrier op anywhere in a card, in a condition or an Aura (Glass Veil's "next turn" part is not one, and stays fixed) */
  const barriers = (node: unknown): { scale?: { by: string } }[] => {
    if (Array.isArray(node)) return node.flatMap(barriers);
    if (!node || typeof node !== 'object') return [];
    const own =
      (node as { op?: string }).op === 'barrier' ? [node as { scale?: { by: string } }] : [];
    return [...own, ...Object.values(node).flatMap(barriers)];
  };

  it('on every card of her class, upgrades included', () => {
    const fixed = Object.values(db.cards)
      .filter((c) => c.hero === 'spellblade')
      .filter((c) =>
        barriers(c.effects).some(
          (b) => !['stars', 'starSpend', 'starsSpentTurn'].includes(b.scale?.by ?? ''),
        ),
      )
      .map((c) => c.id);
    expect(fixed).toEqual([]);
  });

  it('it reads what you hold, one more per 3, and 1 more per 2 on the Crown', () => {
    const at = (stars: number, id: string) => hero(play(fight([id], { stars }), id)).barrier;
    expect(at(0, 'obsidian-ward')).toBe(7);
    expect(at(3, 'obsidian-ward')).toBe(8);
    expect(at(27, 'obsidian-ward')).toBe(16);
    expect(at(27, 'unbreakable-crown')).toBe(18 + 13);
    // (Gather Power, DECISIONS #559: its Barrier reads what you hold before its gain, 3 at the 5 she opens with)
    expect(at(5, 'gather-light')).toBe(3);
    expect(at(9, 'gather-light')).toBe(5);
  });

  it('it reads the card before its own gain, as the text is written', () => {
    expect(hero(play(fight(['growing-crucible'], { stars: 2 }), 'growing-crucible')).barrier).toBe(
      4,
    );
  });

  it('a card that needs you empty reads what you spent this turn', () => {
    const dry = play(fight(['devastate', 'last-ember'], { stars: 6 }), 'devastate');
    expect(dry.sides.a.stars).toBe(0);
    expect(hero(play(dry, 'last-ember')).barrier).toBe(5 + 2);
  });

  it('a card in hand shows the Barrier it would really give', () => {
    const s = fight(['obsidian-ward'], { stars: 9 });
    const live = previewCardDamage(db, s, 'T0');
    expect(live.get(0)).toMatchObject({ lo: 10, hi: 10, barrier: true });
    expect(cardText(db, db.cards['obsidian-ward']!, live)).toContain(
      'Gain 7 (+1 per 3 Spell Power) Barrier ([[live:calc:10]]).',
    );
    hero(s).statuses.brittle = 1;
    expect(previewCardDamage(db, s, 'T0').get(0)?.lo).toBe(7);
  });

  it('what a card spends is gone before its Barrier is read', () => {
    expect(previewCardDamage(db, fight(['mirror-glass'], { stars: 3 }), 'T0').get(0)?.lo).toBe(7);
    expect(previewCardDamage(db, fight(['star-barrier'], { stars: 6 }), 'T0').get(0)?.lo).toBe(14);
  });

  it('a card with too little Spell Power to pay does not preview below its printed Barrier', () => {
    expect(previewCardDamage(db, fight(['mirror-glass'], { stars: 0 }), 'T0').get(0)?.lo).toBe(7);
  });

  it('a Barrier that reads the ally you aim at shows no number before you aim it, on any class', () => {
    const cards = Object.values(db.cards).filter(
      (c) =>
        (c.target === 'ally' || c.target === 'friend') &&
        c.effects.some((o) => o.op === 'barrier' && o.scale?.of === 'target'),
    );
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) {
      const live = previewCardDamage(db, fight([c.id]), 'T0');
      expect(
        [...live.values()].filter((l) => l.barrier),
        c.id,
      ).toEqual([]);
    }
  });

  it('the preview agrees with the play, Barrier after an attack included', () => {
    for (const id of [
      'obsidian-ward',
      'bladewall',
      'guarded-cut',
      'glass-veil',
      'mirror-glass',
      'unbreakable-crown',
    ]) {
      const s = fight([id], { stars: 11 });
      const shown = [...previewCardDamage(db, s, 'T0', foe(s).id).values()].find((l) => l.barrier)!;
      expect(hero(play(s, id)).barrier, id).toBe(shown.lo);
    }
  });
});

describe('Aura conditions', () => {
  it('Sigil of Glass waits for a spend of 3 or more, and a smaller one does not use it up', () => {
    const s = play(fight(['cygnus', 'skybolt', 'devastate'], { stars: 5 }), 'cygnus');
    const small = play(s, 'skybolt');
    expect(hero(small).barrier).toBe(0);
    const big = play(small, 'devastate');
    // (5 spent this turn: one step of 3)
    expect(hero(big).barrier).toBe(5 + 1);
  });

  it('Afterglow answers spending your last Spell Power', () => {
    const s = play(fight(['afterglow', 'skybolt', 'devastate']), 'afterglow');
    const some = play(s, 'skybolt');
    expect(hero(some).barrier).toBe(0);
    const all = play(some, 'devastate');
    // (8 spent this turn: two steps of 3)
    expect(hero(all).barrier).toBe(3 + 2);
  });

  it('Patient Edge pays for a turn with nothing spent', () => {
    const quiet = play(fight(['patient-edge-aura'], { stars: 2 }), 'patient-edge-aura');
    expect(applyAction(db, quiet, { type: 'endTurn' }).state.sides.a.stars).toBe(2 + 2 + 1);
    const spent = play(
      play(fight(['patient-edge-aura', 'skybolt'], { stars: 2 }), 'patient-edge-aura'),
      'skybolt',
    );
    expect(applyAction(db, spent, { type: 'endTurn' }).state.sides.a.stars).toBe(1 + 1);
  });

  it('Glass Armory pays for a Sword straight after a Spell, once a turn', () => {
    const s = play(
      fight(['glass-armory', 'hairline-crack', 'glass-needle', 'guarded-cut'], { stars: 0 }),
      'glass-armory',
    );
    const before = play(s, 'glass-needle');
    expect(before.sides.a.stars).toBe(0);
    const mixed = play(play(before, 'hairline-crack'), 'guarded-cut');
    expect(mixed.sides.a.stars).toBe(2);
  });

  it('Glass Guard answers the first Sword each turn', () => {
    const s = play(
      play(play(fight(['parry', 'glass-needle', 'gleam']), 'parry'), 'glass-needle'),
      'gleam',
    );
    expect(hero(s).barrier).toBe(4 + 2);
  });

  it('Warm Anvil gains 2 a turn; Sigil of Kindling reads growth, Obsidian Aegis half what you hold', () => {
    const w = play(fight(['warm-anvil'], { stars: 0 }), 'warm-anvil');
    expect(applyAction(db, w, { type: 'endTurn' }).state.sides.a.stars).toBe(2 + 1);
    const ae = play(fight(['obsidian-aegis'], { stars: 9 }), 'obsidian-aegis');
    const beforeEnemy = applyAction(db, ae, { type: 'endTurn' });
    expect(beforeEnemy.events.some((e) => e.type === 'barrier' && e.amount === 4)).toBe(true);
  });

  it('Hammer and Anvil gains 1 per different enemy your Swords hit', () => {
    const s = play(
      play(fight(['rift-sweep', 'hammer-and-anvil'], { foes: 2, stars: 0 }), 'rift-sweep'),
      'hammer-and-anvil',
    );
    expect(s.sides.a.stars).toBe(2);
  });
});

// One scenario for every other card: its base effect, as the list prices it. Spell Power 8 unless a case says otherwise.
const CASES: {
  id: string;
  stars?: number;
  dmg?: number;
  sp?: number;
  barrier?: number;
  fracture?: number;
  status?: Record<string, number>;
  foeStatus?: Record<string, number>;
  drew?: number;
}[] = [
  { id: 'meteor-jab', stars: 4, dmg: 12, sp: 2 },
  { id: 'gather-light', sp: 10 },
  { id: 'obsidian-ward', barrier: 9, sp: 9 },
  { id: 'forged-in-fury', dmg: 6, sp: 9 },
  { id: 'whetstone', sp: 10 },
  { id: 'faint-glow', sp: 10, drew: 1 },
  { id: 'ember-cache', sp: 9 },
  { id: 'pale-beacon', barrier: 7, sp: 9, drew: 1 }, // (5 Barrier, 1 Spell Power and a card since #796)
  { id: 'sunstrike', dmg: 6, sp: 9 },
  { id: 'empty-crucible', sp: 11 },
  { id: 'empty-crucible', stars: 0, sp: 5 },
  { id: 'bladewall', barrier: 14, sp: 11 },
  { id: 'banked-embers', sp: 8 },
  { id: 'growing-crucible', sp: 12, barrier: 6 },
  { id: 'measured-recharge', sp: 11 },
  { id: 'last-ember', sp: 10, barrier: 0 },
  { id: 'last-ember', stars: 0, sp: 2, barrier: 5 },
  { id: 'big-bang', sp: 11 },
  { id: 'the-forgemaster', sp: 14 },
  { id: 'obsidian-flurry', dmg: 18 },
  { id: 'cosmic-lance', dmg: 10 },
  { id: 'gleam', dmg: 6, drew: 1 },
  { id: 'etching-edge', dmg: 6, fracture: 3 },
  { id: 'rift-sweep', dmg: 15 },
  { id: 'glass-needle', dmg: 6 },
  { id: 'guarded-cut', dmg: 6, barrier: 6 },
  { id: 'shard-strike', stars: 7, dmg: 6, barrier: 0, sp: 8 },
  { id: 'shard-strike', stars: 9, dmg: 8, barrier: 7, sp: 10 },
  { id: 'sovereign-strike', dmg: 18 },
  { id: 'crosscut', dmg: 8 },
  { id: 'fault-piercer', dmg: 10 }, // (1 Mana, 3 x2 since #796)
  { id: 'hammer-and-anvil', dmg: 20, sp: 9 },
  { id: 'storm-of-glass', dmg: 36 },
  { id: 'thousand-shards', stars: 3, dmg: 18, sp: 0 },
  { id: 'obsidian-drill', stars: 4, dmg: 33, sp: 2 },
  { id: 'call-the-blade', sp: 10 },
  { id: 'feint', barrier: 7, status: { vigor: 1 } },
  { id: 'conqueror', status: { vigor: 2 }, drew: 1 },
  { id: 'forge-heat', status: { vigor: 2 } },
  { id: 'crowns-weight', sp: 6, status: { might: 1 }, foeStatus: { sapped: 1 } },
  { id: 'soul-of-steel', status: { might: 2 } },
  { id: 'skybolt', dmg: 24, sp: 4 },
  { id: 'astral-pulse', dmg: 19, sp: 4 },
  { id: 'tempered-bolt', dmg: 6, sp: 9 },
  { id: 'tempered-bolt', stars: 0, dmg: 6, sp: 3 },
  { id: 'glassbrand', dmg: 5, fracture: 2 },
  { id: 'gamma-burst', stars: 6, dmg: 18, foeStatus: { exposed: 1, faltering: 1 } },
  { id: 'gamma-burst', stars: 4, dmg: 14, foeStatus: {} },
  { id: 'controlled-release', dmg: 24, drew: 1 },
  { id: 'controlled-release', stars: 1, dmg: 8, drew: 0 },
  { id: 'falling-sky', stars: 4, dmg: 25, sp: 0 },
  { id: 'devastate', dmg: 60 },
  { id: 'radiance', stars: 6, dmg: 34 },
  { id: 'dying-star', dmg: 24, foeStatus: { faltering: 2 } },
  { id: 'comet', dmg: 76 },
  { id: 'supernova', dmg: 66 },
  { id: 'faultline-hex', fracture: 7 },
  { id: 'spreading-fault', fracture: 5 },
  { id: 'pressure-point-hex', fracture: 6, drew: 0 },
  { id: 'glass-prison', barrier: 7, fracture: 2 },
  { id: 'crack-the-shell', fracture: 4 },
  { id: 'hairline-crack', fracture: 5 },
  { id: 'stress-the-glass', stars: 4, fracture: 7 },
  { id: 'fault-memory', fracture: 5 },
  { id: 'fault-lines' },
  { id: 'final-shatter', fracture: 8, dmg: 0, barrier: 0 },
  { id: 'collapsing-star', fracture: 9 },
  { id: 'carry-the-fault', fracture: 6 },
  { id: 'deep-fault', fracture: 4 },
  { id: 'rupture-script', fracture: 10, dmg: 28 },
  { id: 'breaking-point-hex', dmg: 28, fracture: 4 },
  { id: 'star-barrier', stars: 6, barrier: 14, sp: 3 },
  { id: 'glass-veil', barrier: 10, sp: 9 },
  { id: 'glass-wall', stars: 2, barrier: 15 },
  { id: 'mirror-glass', stars: 2, sp: 0, barrier: 7, status: { shielded: 1 } },
  { id: 'stellar-wind', drew: 2, sp: 9 },
  { id: 'recenter', drew: 2, sp: 9 },
  { id: 'unbreakable-crown', barrier: 22, status: { steadfast: 1 } },
  { id: 'unbreakable-crown', stars: 10, barrier: 23 },
  { id: 'fated-hand', drew: 2, sp: 9 },
];

describe('every card does what the list says', () => {
  for (const c of CASES) {
    const name = `${c.id}${c.stars !== undefined ? ` at ${c.stars} Spell Power` : ''}`;
    it(name, () => {
      const s = fight([c.id, 'strike'], c.stars !== undefined ? { stars: c.stars } : {});
      const hand = s.sides.a.hand.length;
      const r = play(s, c.id);
      if (c.dmg !== undefined) expect(lost(r), 'damage').toBe(c.dmg);
      if (c.sp !== undefined) expect(r.sides.a.stars, 'Spell Power').toBe(c.sp);
      if (c.barrier !== undefined) expect(hero(r).barrier, 'Barrier').toBe(c.barrier);
      if (c.fracture !== undefined)
        expect(foe(r).statuses.fracture ?? 0, 'Fracture').toBe(c.fracture);
      for (const [k, v] of Object.entries(c.status ?? {}))
        expect(hero(r).statuses[k as never], k).toBe(v);
      for (const [k, v] of Object.entries(c.foeStatus ?? {}))
        expect(foe(r).statuses[k as never], k).toBe(v);
      if (c.drew !== undefined) expect(r.sides.a.hand.length, 'hand').toBe(hand - 1 + c.drew);
    });
  }

  it('every upgrade is a real improvement', () => {
    for (const c of Object.values(db.cards)) {
      if (c.hero !== 'spellblade' || c.id.endsWith('+') || c.id === 'rubble') continue;
      const up = db.cards[`${c.id}+`];
      expect(up, c.id).toBeDefined();
      expect(JSON.stringify(up), c.id).not.toBe(
        JSON.stringify({ ...c, id: up!.id, name: up!.name }),
      );
    }
  });

  it('every card has a scenario', () => {
    const covered = new Set([
      ...CASES.map((c) => c.id),
      BLADE,
      'whispering-edge',
      'tempered-focus',
      'quenched-edge',
      'cleaving-edge',
      'echoing-blade',
      'measured-ruin',
      'deepening-fault',
      'gravity-well',
      'pillar-of-light',
      'fault-reader',
      'orion',
      'crucible-heart',
      'cygnus',
      'afterglow',
      'patient-edge-aura',
      'glass-armory',
      'parry',
      'warm-anvil',
      'obsidian-aegis',
    ]);
    const missing = Object.values(db.cards)
      .filter((c) => c.hero === 'spellblade' && !c.id.endsWith('+'))
      .map((c) => c.id)
      .filter((id) => !covered.has(id));
    expect(missing).toEqual([]);
  });
});

describe('a card with nothing to count (DECISIONS #507)', () => {
  it('shows what it will do: no hit, so its bonuses do not show as damage', () => {
    const s = fight(['thousand-shards'], { stars: 0 });
    hero(s).statuses.might = 3;
    hero(s).statuses.vigor = 4;
    const shown = JSON.stringify(previewCardDamage(db, s, 'T0', foe(s).id));
    const before = lost(s);
    const after = lost(applyAction(db, s, { type: 'play', card: 'T0', target: foe(s).id }).state);
    expect(after - before).toBe(0);
    expect(shown).not.toMatch(/:7\b/);
  });
});

it('Obsidian Aegis keeps early Barrier and halves further scaling beyond 20 Spell Power', () => {
  for (const upgraded of [false, true])
    for (const [stars, bonus] of [
      [0, 0],
      [20, 10],
      [22, 10],
      [24, 11],
      [100, 30],
    ] as const) {
      const id = 'obsidian-aegis' + (upgraded ? '+' : '');
      const s = play(fight([id], { stars }), id);
      const before = hero(s).barrier;
      const result = applyAction(db, s, { type: 'endTurn' });
      const barrier = result.events.filter((e) => e.type === 'barrier' && e.target === hero(s).id);
      expect(
        barrier.some((e) => e.type === 'barrier' && e.amount === bonus + (upgraded ? 3 : 0)),
      ).toBe(true);
      expect(before).toBe(0);
    }
});
