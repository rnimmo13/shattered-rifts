// The Spellblade on Spell Power and Fracture (DECISIONS #480; docs/reworks/SPELLBLADE_SPELL_POWER_MERGED.md): the rules, then one scenario
// for every card.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  validateDb,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RETIRED_CARDS, RIFTWALKERS, canonicalCard } from './index';

const BLADE = 'starforged-blade';

function fight(hand: string[], opts: { stars?: number; foes?: number; draw?: string[] } = {}): CombatState {
  const deck = RIFTWALKERS.spellblade.starter;
  const { state } = createCombat(db, {
    seed: 'spellblade-test',
    a: { hero: 'spellblade', deck: [...deck, ...deck] },
    b: { enemies: Array.from({ length: opts.foes ?? 1 }, () => 'squire') },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = (opts.draw ?? ['strike', 'strike', 'strike', 'strike', 'strike']).map((card, i) => ({ id: `D${i}`, card }));
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
function play(s: CombatState, id: string, spend?: number, pick?: string[]): CombatState {
  const c = s.sides.a.hand.find((x) => x.card === id || x.card === `${id}`);
  expect(c, `${id} in hand`).toBeTruthy();
  const def = db.cards[c!.card]!;
  let r = applyAction(db, s, {
    type: 'play',
    card: c!.id,
    ...(def.target === 'foe' ? { target: foe(s).id } : {}),
    ...(spend !== undefined ? { spend } : {}),
  }).state;
  if (pick && r.pending) r = applyAction(db, r, { type: 'pick', cards: pick }).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
}
const lost = (s: CombatState, i = 0) => 900 - foe(s, i).hp;

describe('the pool', () => {
  const mine = Object.values(db.cards).filter((c) => c.hero === 'spellblade' && !c.id.endsWith('+'));
  const rewards = mine.filter((c) => c.rarity !== 'basic' && c.source !== 'token');

  it('is valid data, and holds 88 reward cards with 19 Auras', () => {
    expect(validateDb(db)).toEqual([]);
    expect(rewards).toHaveLength(88);
    expect(rewards.filter((c) => c.kind === 'power')).toHaveLength(19);
    expect(rewards.filter((c) => c.rarity === 'common')).toHaveLength(27);
    expect(rewards.filter((c) => c.rarity === 'uncommon')).toHaveLength(40);
    expect(rewards.filter((c) => c.rarity === 'rare')).toHaveLength(21);
  });

  it('no card of hers Sharpens, makes Retainers or creates Neutral cards', () => {
    const text = JSON.stringify(mine.map((c) => c.effects));
    for (const word of ['"forge"', 'retainer', '"discover"', '"transform"']) expect(text).not.toContain(word);
  });

  it('every retired card of hers becomes one of hers', () => {
    for (const id of ['spoils', 'seven-shards', 'hollow-form', 'retainer-strike', 'to-arms']) {
      expect(RETIRED_CARDS[id], id).toBeDefined();
      expect(db.cards[canonicalCard(id)]?.hero, id).toBe('spellblade');
    }
  });

  it('a starting deck of ten holds the Blade, a generator, a spell and a curse', () => {
    const s = RIFTWALKERS.spellblade.starter;
    expect(s).toHaveLength(10);
    for (const id of [BLADE, 'gather-light', 'meteor-jab', 'hairline-hex']) expect(s).toContain(id);
  });
});

describe('Spell Power', () => {
  it('every fight opens with 3, and Kindled adds 1 each turn', () => {
    const { state } = createCombat(db, {
      seed: 'sp',
      a: { hero: 'spellblade', deck: RIFTWALKERS.spellblade.starter },
      b: { enemies: ['squire'] },
    });
    expect(state.sides.a.stars).toBe(4);
    const next = applyAction(db, state, { type: 'endTurn' }).state;
    expect(next.sides.a.stars).toBe(5);
  });

  it('a spell spends what the player names, and all of it when no amount is named', () => {
    const named = play(fight(['devastate']), 'devastate', 3);
    expect(named.sides.a.stars).toBe(5);
    expect(lost(named)).toBe(12 + 18);
    const all = play(fight(['devastate']), 'devastate');
    expect(all.sides.a.stars).toBe(0);
    expect(lost(all)).toBe(12 + 48);
  });

  it('spending nothing is legal, and a spell plays with none held', () => {
    expect(lost(play(fight(['devastate']), 'devastate', 0))).toBe(12);
    expect(lost(play(fight(['devastate'], { stars: 0 }), 'devastate'))).toBe(12);
  });

  it('an amount past what is held, a fraction, or a negative is refused', () => {
    for (const spend of [9, -1, 1.5]) expect(() => play(fight(['devastate']), 'devastate', spend)).toThrow();
  });

  it('naming an amount on a card that does not spend is refused', () => {
    expect(() => play(fight([BLADE]), BLADE, 2)).toThrow();
  });

  it('there is no cap on spending', () => {
    const s = play(fight(['comet'], { stars: 40 }), 'comet');
    expect(lost(s)).toBe(20 + 8 * 40);
  });

  it('the bots are offered none, half and all, and every offer can be played', () => {
    const s = fight(['devastate']);
    const offers = legalActions(db, s).filter((a) => a.type === 'play');
    expect(offers.map((a) => (a.type === 'play' ? a.spend : 0))).toEqual([undefined, 0, 4]);
    for (const a of offers) expect(() => applyAction(db, s, a)).not.toThrow();
  });

  it('the preview reads the amount being weighed', () => {
    const s = fight(['devastate']);
    const at = (spend?: number) => [...previewCardDamage(db, s, 'T0', foe(s).id, spend).values()][0]!.lo;
    expect(at(0)).toBe(12);
    expect(at(2)).toBe(24);
    expect(at()).toBe(60);
  });

  it('a Sword reads Spell Power when it starts, and what it gains comes after', () => {
    const s = play(fight(['forged-in-fury'], { stars: 5 }), 'forged-in-fury');
    // 5 Spell Power: 1 + 1 hits of 2; the gain to 6 would have given a third
    expect(lost(s)).toBe(4);
    expect(s.sides.a.stars).toBe(6);
  });

  it('the Blade strikes once more per 2 Spell Power, with no hit cap, and spends none', () => {
    const at = (stars: number) => lost(play(fight([BLADE], { stars }), BLADE));
    expect(at(0)).toBe(5);
    expect(at(1)).toBe(5);
    expect(at(4)).toBe(15);
    expect(at(12)).toBe(35);
    expect(at(40)).toBe(105);
    expect(play(fight([BLADE], { stars: 12 }), BLADE).sides.a.stars).toBe(12);
  });
});

describe('what makes the Blade hit harder', () => {
  it('Might and Primed add to every hit', () => {
    const s = fight(['forge-heat', BLADE]);
    hero(s).statuses.might = 2;
    const r = play(play(s, 'forge-heat'), BLADE);
    // 5 hits of 5 + 2 Might + 2 Primed
    expect(lost(r)).toBe(5 * 9);
    expect(hero(r).statuses.vigor ?? 0).toBe(0);
  });

  it('Whispering Edge adds to every Sword hit and to nothing else', () => {
    const r = play(play(fight(['whispering-edge', BLADE]), 'whispering-edge'), BLADE);
    expect(lost(r)).toBe(5 * 6);
    const spell = play(play(fight(['whispering-edge', 'skybolt']), 'whispering-edge'), 'skybolt', 0);
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
    const q = play(play(fight(['quenched-edge', 'skybolt', 'star-barrier']), 'quenched-edge'), 'skybolt', 1);
    const q2 = play(q, 'star-barrier', 1);
    expect(hero(q2).statuses.vigor).toBe(1);
  });

  it('Cleaving Edge makes the Blade strike every enemy and gains 2', () => {
    const r = play(play(fight(['cleaving-edge', BLADE], { foes: 2 }), 'cleaving-edge'), BLADE);
    expect(r.sides.a.stars).toBe(10);
    expect(lost(r, 0)).toBe(6 * 5);
    expect(lost(r, 1)).toBe(6 * 5);
  });

  it('Echoing Blade plays the Blade again, and other Swords not', () => {
    const r = play(play(fight(['echoing-blade', BLADE]), 'echoing-blade'), BLADE);
    expect(lost(r)).toBe(25 * 2);
    const other = play(play(fight(['echoing-blade', 'obsidian-flurry']), 'echoing-blade'), 'obsidian-flurry');
    expect(lost(other)).toBe(21);
  });

  it('Measured Ruin adds to the first spending Spell Attack each turn only', () => {
    const s = play(fight(['measured-ruin', 'skybolt', 'gamma-burst']), 'measured-ruin');
    const a = play(s, 'skybolt', 2);
    expect(lost(a)).toBe(8 + 8 + 4);
    const b = play(a, 'gamma-burst', 2);
    expect(lost(b) - lost(a)).toBe(6 + 8);
  });
});

describe('Fracture and Shatter', () => {
  it('crossing 10 removes 10, deals 18, and keeps the rest', () => {
    const s = play(fight(['rupture-script']), 'rupture-script');
    expect(foe(s).statuses.fracture).toBe(2);
    expect(lost(s)).toBe(36);
  });

  it('below 10 nothing happens, and Fracture never fades', () => {
    const s = play(fight(['faultline-hex']), 'faultline-hex');
    expect(foe(s).statuses.fracture).toBe(7);
    expect(lost(s)).toBe(0);
    const later = applyAction(db, applyAction(db, s, { type: 'endTurn' }).state, { type: 'endTurn' }).state;
    expect(foe(later).statuses.fracture).toBe(7);
  });

  it('Barrier stops a Shatter', () => {
    const s = fight(['final-shatter']);
    foe(s).barrier = 10;
    const r = play(s, 'final-shatter');
    expect(foe(r).barrier).toBe(0);
    expect(lost(r)).toBe(8);
  });

  it('a Shatter is not an attack: Might, Primed and Exposed do nothing to it', () => {
    const s = fight(['final-shatter']);
    hero(s).statuses.might = 5;
    hero(s).statuses.vigor = 5;
    foe(s).statuses.exposed = 3;
    expect(lost(play(s, 'final-shatter'))).toBe(18);
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
    const s = play(play(fight(['deep-fault', 'final-shatter']), 'deep-fault'), 'final-shatter');
    // Deep Fault applied 4; Final Shatter's 10 crosses once at 24
    expect(lost(s)).toBe(24);
    expect(foe(s).statuses.fracture).toBe(4);
  });

  it('Deepening Fault raises Shatters once a turn, after the card that applied Fracture', () => {
    const s = play(play(fight(['deepening-fault', 'faultline-hex', 'hairline-crack']), 'deepening-fault'), 'faultline-hex');
    expect(s.sides.a.shatterBonus).toBe(2);
    const t = play(s, 'hairline-crack');
    expect(t.sides.a.shatterBonus).toBe(2);
    expect(lost(t)).toBe(20);
  });

  it("a Sword's cracks count as a card applying Fracture", () => {
    const s = play(play(fight(['deepening-fault', 'etching-edge']), 'deepening-fault'), 'etching-edge');
    expect(s.sides.a.shatterBonus).toBe(2);
  });

  it('Fracture Steadfast stopped is not an application', () => {
    const s = play(fight(['deepening-fault', 'faultline-hex']), 'deepening-fault');
    foe(s).statuses.steadfast = 1;
    expect(play(s, 'faultline-hex').sides.a.shatterBonus ?? 0).toBe(0);
  });

  it("a Shatter follows the difficulty's damage percent, as an Aura's damage does", () => {
    const s = fight(['final-shatter', 'breaking-point-hex']);
    hero(s).dmgPct = 50;
    const r = play(s, 'final-shatter');
    expect(lost(r)).toBe(9);
    expect(lost(play(r, 'breaking-point-hex'))).toBe(18);
  });

  it('Hungering Void only deepens enemies already marked, and sets off no card-only Aura', () => {
    const s = play(play(fight(['gravity-well', 'deepening-fault', 'hairline-crack'], { foes: 2 }), 'gravity-well'), 'deepening-fault');
    const m = play(s, 'hairline-crack');
    const bonus = m.sides.a.shatterBonus;
    const next = applyAction(db, m, { type: 'endTurn' }).state;
    expect(foe(next, 0).statuses.fracture).toBe(8);
    expect(foe(next, 1).statuses.fracture ?? 0).toBe(0);
    expect(next.sides.a.shatterBonus).toBe(bonus);
  });

  it('Pillar of Glass and Fault Reader answer the first Shatter each turn', () => {
    const s = play(play(fight(['pillar-of-light', 'fault-reader', 'rupture-script']), 'pillar-of-light'), 'fault-reader');
    const hand = s.sides.a.hand.length;
    const r = play(s, 'rupture-script');
    expect(hero(r).barrier).toBe(4 + 2);
    expect(r.sides.a.hand.length).toBe(hand - 1 + 1);
  });

  it('Carry the Fault moves Fracture without calling it a new application', () => {
    const s = fight(['carry-the-fault'], { foes: 2 });
    foe(s, 1).statuses.fracture = 8;
    const r = applyAction(db, s, { type: 'play', card: 'T0', target: foe(s, 0).id }).state;
    expect(foe(r, 1).statuses.fracture ?? 0).toBe(0);
    // 8 moved, 4 applied: one Shatter, 2 left
    expect(foe(r, 0).statuses.fracture).toBe(2);
    expect(lost(r, 0)).toBe(18);
  });

  it('Carry the Fault on a lone enemy applies 8', () => {
    expect(foe(play(fight(['carry-the-fault']), 'carry-the-fault')).statuses.fracture).toBe(8);
  });

  it('Etching Edge cracks once per hit', () => {
    const s = play(fight(['etching-edge'], { stars: 8 }), 'etching-edge');
    expect(foe(s).statuses.fracture).toBe(3);
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
    s.sides[me].hand = [{ id: 'P0', card: 'final-shatter' }];
    s.sides[me].mana = 9;
    s.sides[me].shatterBonus = 2;
    const them = s.sides[you].units.find((u) => u.kind === 'hero')!;
    const hp = them.hp;
    them.barrier = 0;
    const r = applyAction(db, s, { type: 'play', card: 'P0', target: them.id }).state;
    expect(r.sides[you].units.find((u) => u.kind === 'hero')!.hp).toBe(hp - 20);
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
    expect(hero(s).barrier).toBe(2);
  });

  it('Crucible Heart makes the growing card grow 2 more, without setting itself off', () => {
    const s = play(play(fight(['crucible-heart', 'whetstone'], { stars: 0 }), 'crucible-heart'), 'whetstone');
    expect(s.sides.a.discard[0]!.bonus).toBe(3);
  });

  it('The Forgemaster raises a generator chosen from the hand, which stays there', () => {
    const s = play(fight(['the-forgemaster', 'faint-glow', 'whetstone'], { stars: 0 }), 'the-forgemaster', undefined, ['T2']);
    expect(s.sides.a.stars).toBe(6);
    const w = s.sides.a.hand.find((c) => c.id === 'T2')!;
    expect(w.bonus).toBe(2);
    expect(s.sides.a.hand.find((c) => c.id === 'T1')!.bonus ?? 0).toBe(0);
    expect(play(s, 'whetstone').sides.a.stars).toBe(6 + 4);
  });

  it('Fault Memory applies 2 more each play', () => {
    let s = fight(['fault-memory']);
    s = play(s, 'fault-memory');
    expect(foe(s).statuses.fracture).toBe(5);
    s.sides.a.hand.push(s.sides.a.discard.pop()!);
    s = play(s, 'fault-memory');
    expect(foe(s).statuses.fracture).toBe(2);
    expect(lost(s)).toBe(18);
  });
});

describe('Aura conditions', () => {
  it('Sigil of Glass waits for a spend of 3 or more, and a smaller one does not use it up', () => {
    const s = play(fight(['cygnus', 'skybolt', 'gamma-burst']), 'cygnus');
    const small = play(s, 'skybolt', 2);
    expect(hero(small).barrier).toBe(0);
    const big = play(small, 'gamma-burst', 3);
    expect(hero(big).barrier).toBe(5);
  });

  it('Afterglow answers spending your last Spell Power', () => {
    const s = play(fight(['afterglow', 'skybolt', 'gamma-burst']), 'afterglow');
    const some = play(s, 'skybolt', 2);
    expect(hero(some).barrier).toBe(0);
    const all = play(some, 'gamma-burst');
    expect(hero(all).barrier).toBe(3);
  });

  it('Patient Edge pays for a turn with nothing spent', () => {
    const quiet = play(fight(['patient-edge-aura'], { stars: 2 }), 'patient-edge-aura');
    expect(applyAction(db, quiet, { type: 'endTurn' }).state.sides.a.stars).toBe(2 + 2 + 1);
    const spent = play(play(fight(['patient-edge-aura', 'skybolt'], { stars: 2 }), 'patient-edge-aura'), 'skybolt', 1);
    expect(applyAction(db, spent, { type: 'endTurn' }).state.sides.a.stars).toBe(1 + 1);
  });

  it('Glass Armory pays for a Sword straight after a Spell, once a turn', () => {
    const s = play(fight(['glass-armory', 'hairline-crack', 'glass-needle', 'guarded-cut'], { stars: 0 }), 'glass-armory');
    const before = play(s, 'glass-needle');
    expect(before.sides.a.stars).toBe(0);
    const mixed = play(play(before, 'hairline-crack'), 'guarded-cut');
    expect(mixed.sides.a.stars).toBe(2);
  });

  it('Glass Guard answers the first Sword each turn', () => {
    const s = play(play(play(fight(['parry', 'glass-needle', 'gleam']), 'parry'), 'glass-needle'), 'gleam');
    expect(hero(s).barrier).toBe(4);
  });

  it('Warm Anvil gains 2 a turn; Sigil of Kindling reads growth, Obsidian Aegis half what you hold', () => {
    const w = play(fight(['warm-anvil'], { stars: 0 }), 'warm-anvil');
    expect(applyAction(db, w, { type: 'endTurn' }).state.sides.a.stars).toBe(2 + 1);
    const ae = play(fight(['obsidian-aegis'], { stars: 9 }), 'obsidian-aegis');
    const beforeEnemy = applyAction(db, ae, { type: 'endTurn' });
    expect(beforeEnemy.events.some((e) => e.type === 'barrier' && e.amount === 4)).toBe(true);
  });

  it('Hammer and Anvil gains 1 per different enemy your Swords hit', () => {
    const s = play(play(fight(['rift-sweep', 'hammer-and-anvil'], { foes: 2, stars: 0 }), 'rift-sweep'), 'hammer-and-anvil');
    expect(s.sides.a.stars).toBe(2);
  });
});

// One scenario for every other card: its base effect, as the list prices it. Spell Power 8 unless a case says otherwise.
const CASES: {
  id: string;
  stars?: number;
  spend?: number;
  dmg?: number;
  sp?: number;
  barrier?: number;
  fracture?: number;
  status?: Record<string, number>;
  foeStatus?: Record<string, number>;
  drew?: number;
}[] = [
  { id: 'meteor-jab', spend: 2, dmg: 12, sp: 6 },
  { id: 'gather-light', sp: 10 },
  { id: 'hairline-hex', fracture: 5, barrier: 2 },
  { id: 'forged-in-fury', dmg: 6, sp: 9 },
  { id: 'whetstone', sp: 10 },
  { id: 'faint-glow', sp: 10, drew: 1 },
  { id: 'ember-cache', sp: 9 },
  { id: 'pale-beacon', barrier: 6, sp: 9 },
  { id: 'sunstrike', dmg: 8, sp: 8 },
  { id: 'empty-crucible', sp: 11 },
  { id: 'empty-crucible', stars: 0, sp: 5 },
  { id: 'bladewall', barrier: 12, sp: 11 },
  { id: 'banked-embers', sp: 8 },
  { id: 'growing-crucible', sp: 12, barrier: 4 },
  { id: 'measured-recharge', sp: 11 },
  { id: 'last-ember', sp: 10, barrier: 0 },
  { id: 'last-ember', stars: 0, sp: 2, barrier: 5 },
  { id: 'big-bang', sp: 11 },
  { id: 'the-forgemaster', sp: 14 },
  { id: 'obsidian-flurry', dmg: 21 },
  { id: 'cosmic-lance', dmg: 10 },
  { id: 'gleam', dmg: 6, drew: 1 },
  { id: 'etching-edge', dmg: 6, fracture: 3 },
  { id: 'rift-sweep', dmg: 15 },
  { id: 'glass-needle', dmg: 6 },
  { id: 'guarded-cut', dmg: 6, barrier: 4 },
  { id: 'shard-strike', dmg: 8, barrier: 0 },
  { id: 'shard-strike', stars: 9, dmg: 10, barrier: 4 },
  { id: 'sovereign-strike', dmg: 20 },
  { id: 'crosscut', dmg: 8 },
  { id: 'fault-piercer', dmg: 20 },
  { id: 'hammer-and-anvil', dmg: 24, sp: 9 },
  { id: 'storm-of-glass', dmg: 40 },
  { id: 'thousand-shards', spend: 3, dmg: 18, sp: 5 },
  { id: 'obsidian-drill', spend: 2, dmg: 35, sp: 6 },
  { id: 'call-the-blade', sp: 10 },
  { id: 'feint', barrier: 5, status: { vigor: 1 } },
  { id: 'conqueror', status: { vigor: 2 }, drew: 1 },
  { id: 'forge-heat', status: { vigor: 2 } },
  { id: 'crowns-weight', sp: 6, status: { might: 1 }, foeStatus: { sapped: 1 } },
  { id: 'soul-of-steel', status: { might: 2 } },
  { id: 'skybolt', spend: 4, dmg: 24, sp: 4 },
  { id: 'astral-pulse', spend: 4, dmg: 19, sp: 4 },
  { id: 'tempered-bolt', dmg: 7, sp: 8 },
  { id: 'tempered-bolt', stars: 0, dmg: 7, sp: 2 },
  { id: 'glassbrand', dmg: 5, fracture: 3 },
  { id: 'gamma-burst', spend: 3, dmg: 18, foeStatus: { exposed: 1, faltering: 1 } },
  { id: 'gamma-burst', spend: 2, dmg: 14, foeStatus: {} },
  { id: 'controlled-release', spend: 4, dmg: 24, drew: 1 },
  { id: 'controlled-release', spend: 8, dmg: 40, drew: 0 },
  { id: 'falling-sky', spend: 4, dmg: 25 },
  { id: 'devastate', spend: 8, dmg: 60 },
  { id: 'radiance', spend: 6, dmg: 34 },
  { id: 'dying-star', spend: 4, dmg: 24, foeStatus: { faltering: 2 } },
  { id: 'comet', spend: 8, dmg: 84 },
  { id: 'supernova', spend: 8, dmg: 66 },
  { id: 'faultline-hex', fracture: 7 },
  { id: 'spreading-fault', fracture: 5 },
  { id: 'pressure-point-hex', fracture: 5, drew: 0 },
  { id: 'glass-prison', barrier: 5, fracture: 3 },
  { id: 'crack-the-shell', fracture: 5 },
  { id: 'hairline-crack', fracture: 5 },
  { id: 'stress-the-glass', spend: 2, fracture: 10 - 10, dmg: 18 },
  { id: 'fault-memory', fracture: 5 },
  { id: 'final-shatter', dmg: 18, barrier: 6 },
  { id: 'collapsing-star', fracture: 2, dmg: 18 },
  { id: 'carry-the-fault', fracture: 8 },
  { id: 'deep-fault', fracture: 4 },
  { id: 'rupture-script', fracture: 2, dmg: 36 },
  { id: 'breaking-point-hex', dmg: 18, fracture: 8 },
  { id: 'star-barrier', spend: 3, barrier: 14, sp: 5 },
  { id: 'glass-veil', barrier: 10 },
  { id: 'glass-wall', spend: 1, barrier: 15 },
  { id: 'mirror-glass', spend: 2, barrier: 7, status: { shielded: 1 } },
  { id: 'mirror-glass', spend: 1, barrier: 7, status: {} },
  { id: 'stellar-wind', drew: 2 },
  { id: 'recenter', drew: 2, sp: 8 },
  { id: 'unbreakable-crown', barrier: 18, status: { steadfast: 1 } },
  { id: 'unbreakable-crown', stars: 10, barrier: 26 },
  { id: 'fated-hand', drew: 2 },
];

describe('every card does what the list says', () => {
  for (const c of CASES) {
    const name = `${c.id}${c.spend !== undefined ? ` spending ${c.spend}` : ''}${c.stars !== undefined ? ` at ${c.stars} Spell Power` : ''}`;
    it(name, () => {
      const s = fight([c.id, 'strike'], c.stars !== undefined ? { stars: c.stars } : {});
      const hand = s.sides.a.hand.length;
      const r = play(s, c.id, c.spend);
      if (c.dmg !== undefined) expect(lost(r), 'damage').toBe(c.dmg);
      if (c.sp !== undefined) expect(r.sides.a.stars, 'Spell Power').toBe(c.sp);
      if (c.barrier !== undefined) expect(hero(r).barrier, 'Barrier').toBe(c.barrier);
      if (c.fracture !== undefined) expect(foe(r).statuses.fracture ?? 0, 'Fracture').toBe(c.fracture);
      for (const [k, v] of Object.entries(c.status ?? {})) expect(hero(r).statuses[k as never], k).toBe(v);
      for (const [k, v] of Object.entries(c.foeStatus ?? {})) expect(foe(r).statuses[k as never], k).toBe(v);
      if (c.drew !== undefined) expect(r.sides.a.hand.length, 'hand').toBe(hand - 1 + c.drew);
    });
  }

  it('every upgrade is a real improvement', () => {
    for (const c of Object.values(db.cards)) {
      if (c.hero !== 'spellblade' || c.id.endsWith('+') || c.id === 'rubble') continue;
      const up = db.cards[`${c.id}+`];
      expect(up, c.id).toBeDefined();
      expect(JSON.stringify(up), c.id).not.toBe(JSON.stringify({ ...c, id: up!.id, name: up!.name }));
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
