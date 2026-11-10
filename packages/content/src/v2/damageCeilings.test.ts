// The 2026-11-10 damage pass (DECISIONS #726): ceilings on the cards and rules that made the fastest Arena kills.
import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  viewFor,
  tickDamage,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { ascendancyOf, COMBAT_DB as db } from './index';

let n = 0;
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState): Unit => s.sides.b.units[0]!;
function fight(heroId: string, ascendancy?: string): CombatState {
  const s = clone(
    createCombat(db, {
      seed: 'd726',
      a: { hero: heroId, deck: [], ...(ascendancy ? { ascendancy } : {}) },
      b: { enemies: ['squire'] },
    }).state,
  );
  s.sides.a.mana = 20;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 5000;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
function play(s: CombatState, card: string): CombatState {
  const id = `d726-${n++}`;
  s.sides.a.hand.push({ id, card });
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, card).toBeTruthy();
  return applyAction(db, s, act!).state;
}
const dealt = (s: CombatState, card: string): number => {
  const before = foe(s).hp;
  return before - foe(play(s, card)).hp;
};

describe('a card that hits 3 or more times carries half the Might and Primed', () => {
  it('Thousand Palms (4 hits) adds half the Might to each hit; Twin Cut (2 hits) all of it', () => {
    const s = fight('monk');
    hero(s).statuses = { might: 10 };
    expect(dealt(s, 'thousand-palms')).toBe((5 + 5) * 4);
    const k = fight('knight');
    hero(k).statuses = { might: 10 };
    expect(dealt(k, 'twin-cut')).toBe((5 + 10) * 2);
  });
  it('odd Might rounds down, and Primed is halved but spent in full', () => {
    const s = fight('hunter');
    hero(s).statuses = { might: 5, vigor: 5 };
    const before = foe(s).hp;
    const after = play(s, 'rip-and-tear');
    expect(before - foe(after).hp).toBe((7 + 2 + 2) * 3);
    expect(hero(after).statuses.vigor ?? 0).toBe(0);
  });
});

describe('Bleed and Burn ticks', () => {
  it('a tick deals the stack in full up to 30 and half of what is past it', () => {
    expect(tickDamage(12)).toBe(12);
    expect(tickDamage(30)).toBe(30);
    expect(tickDamage(31)).toBe(30);
    expect(tickDamage(60)).toBe(45);
    expect(tickDamage(100)).toBe(65);
  });
  it('an extra tick deals half of that', () => {
    expect(tickDamage(12, true)).toBe(6);
    expect(tickDamage(15, true)).toBe(8);
    expect(tickDamage(60, true)).toBe(23);
  });
  it('a Bloodletter with one Thin the Blood: two full ticks and a half one, the stack losing 1 each time', () => {
    let s = fight('assassin', 'assassin:bloodletter');
    s = play(s, 'thin-the-blood');
    foe(s).statuses.seared = 40;
    const before = foe(s).hp;
    const after = applyAction(db, s, { type: 'endTurn' }).state;
    // (40: 35; 39: 34; then the third, half of 38's 34)
    expect(before - foe(after).hp).toBe(35 + 34 + 17);
    expect(foe(after).statuses.seared).toBe(37);
  });
});

describe('ceilings on counting cards', () => {
  for (const [card, exposed, dmg] of [
    ['coup-de-grace', 0, 20],
    ['coup-de-grace', 4, 40],
    ['coup-de-grace', 8, 50],
    ['coup-de-grace', 12, 60],
    ['coup-de-grace', 40, 60],
    ['coup-de-grace+', 4, 50],
    ['coup-de-grace+', 12, 74],
    ['coup-de-grace+', 40, 74],
    ['culling', 3, 29],
    ['culling', 9, 44],
    ['culling', 40, 44],
    ['culling+', 40, 54],
  ] as const)
    it(`${card} at ${exposed} Exposed: ${dmg} before Exposed's own half more`, () => {
      const s = fight('trickster');
      if (exposed) foe(s).statuses.exposed = exposed;
      expect(dealt(s, card)).toBe(exposed ? Math.floor(dmg * 1.5) : dmg);
    });

  for (const [card, fate, added] of [
    ['last-rites', 0, 10],
    ['last-rites', 30, 25],
    ['last-rites', 50, 30],
    ['last-rites', 70, 35],
    ['last-rites', 500, 35],
    ['last-rites+', 30, 30],
    ['last-rites+', 90, 45],
    ['last-rites+', 500, 45],
  ] as const)
    it(`${card} on ${fate} Fate adds ${added}`, () => {
      const s = fight('necromancer');
      if (fate) foe(s).statuses.doom = fate;
      expect(foe(play(s, card)).statuses.doom).toBe(fate + added);
    });

  for (const [card, fate, dmg] of [
    ['final-reckoning', 0, 5],
    ['final-reckoning', 60, 65],
    ['final-reckoning', 100, 85],
    ['final-reckoning', 180, 125],
    ['final-reckoning', 900, 125],
    ['final-reckoning+', 900, 135],
  ] as const)
    it(`${card} on ${fate} Fate deals ${dmg}`, () => {
      const s = fight('necromancer');
      if (fate) foe(s).statuses.doom = fate;
      expect(dealt(s, card)).toBe(dmg);
    });

  it('they say their limits', () => {
    expect(cardText(db, db.cards['coup-de-grace']!)).toContain('half as much past +20, at most +40');
    expect(cardText(db, db.cards['culling']!)).toContain('half as much past +15, at most +30');
    expect(cardText(db, db.cards['last-rites+']!)).toContain('half as much past +15, at most +30');
    expect(cardText(db, db.cards['final-reckoning']!)).toContain(
      'half as much past +60, at most +120',
    );
  });
});

describe('Might that arrives over the fight', () => {
  it('Scar Over gives its Might once each turn', () => {
    let s = fight('knight');
    s = play(s, 'scar-over');
    const might = hero(s).statuses.might ?? 0;
    s = play(s, 'draw-blood');
    expect(hero(s).statuses.might ?? 0).toBe(might + 1);
    s = play(s, 'draw-blood');
    expect(hero(s).statuses.might ?? 0).toBe(might + 1);
    expect(cardText(db, db.cards['scar-over']!)).toContain('once each turn');
  });
  it("the Sunwalker's Dawn is 1 Might a Radiant, the Artillerist arms 3 Might a turn for 5 turns, Bloodlust 2 a turn", () => {
    expect(ascendancyOf('monk', 'monk:sunwalker')!.text).toContain(
      'the first 5 times you enter Radiant, gain 1 Might',
    );
    expect(ascendancyOf('engineer', 'engineer:artillerist')!.text).toContain(
      'first 5 turns, gain 3 Might (up to 15)',
    );
    expect(ascendancyOf('hunter', 'hunter:reaver')!.text).toContain('at most 2 a turn');
  });
  it('Radiant gives its Mana only the first time each turn', () => {
    let s = fight('monk');
    // (no stance to leave: leaving Serene pays Mana of its own)
    delete hero(s).statuses.calm;
    s.sides.a.mana = 0;
    hero(s).statuses.mantra = 9;
    s = play(s, 'bowing-low');
    expect(hero(s).statuses.radiant).toBe(1);
    expect(s.sides.a.mana).toBe(1);
    // (out of Radiant and in again the same turn: no second Mana)
    delete hero(s).statuses.radiant;
    hero(s).statuses.mantra = 9;
    s = play(s, 'bowing-low');
    expect(hero(s).statuses.radiant).toBe(1);
    expect(s.sides.a.mana).toBe(1);
  });
});

describe('numbers', () => {
  it('Slugfest 7 x 4 (9 upgraded), Rotary Cannon 6 x 4 (8 upgraded)', () => {
    expect(cardText(db, db.cards['slugfest']!)).toBe('Deal 7 damage 4 times.');
    expect(cardText(db, db.cards['slugfest+']!)).toBe('Deal 9 damage 4 times.');
    expect(cardText(db, db.cards['rotary-cannon']!)).toBe('Deal 6 damage 4 times.');
    expect(cardText(db, db.cards['rotary-cannon+']!)).toBe('Deal 8 damage 4 times.');
  });
});

describe('what the player is shown matches', () => {
  it('the preview of a many-hit card is what it deals', () => {
    const s = fight('monk');
    hero(s).statuses = { might: 9, vigor: 3 };
    s.sides.a.hand.push({ id: 'pv', card: 'thousand-palms' });
    const live = previewCardDamage(db, s, 'pv').get(0)!;
    const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === 'pv')!;
    const before = foe(s).hp;
    const after = applyAction(db, s, act).state;
    // (5 + 4 Might + 1 Primed a hit, 4 hits)
    expect(before - foe(after).hp).toBe(40);
    expect([live.lo, live.lo * (live.hits ?? 1)]).toContain(40);
  });
  it('the Bloodlust chip and its explanation count the Might given, and say what is owed', () => {
    let s = fight('hunter', 'hunter:reaver');
    hero(s).hp = hero(s).maxHp = 500;
    s = play(s, 'open-a-vein');
    s = play(s, 'open-a-vein');
    s = play(s, 'open-a-vein');
    // (9 HP paid: 3 Might earned, 2 given this turn)
    const side = s.sides.a;
    expect(side.discipline?.given).toBe(2);
    const shown = viewFor(db, s, 'a').sides.a;
    expect(shown.disciplineLabel).toContain('2/12');
    const text = shown.disciplineText ?? '';
    expect(text).toContain('2/12 Might gained');
    expect(text).toContain('at most 2 a turn');
    expect(text).toContain('1 more owed');
  });
});

describe('the buffs and the hybrid Fracture (#727)', () => {
  it('Showstopper 26 (34 upgraded), Card Fan +4 a suit, Metronome Trap 5 (7 upgraded), Gleeful Trapsmith +1 per 2 Traps sprung', () => {
    expect(cardText(db, db.cards['showstopper']!)).toContain('Deal 26 damage');
    expect(cardText(db, db.cards['showstopper+']!)).toContain('Deal 34 damage');
    expect(cardText(db, db.cards['card-fan']!)).toContain('+4 per suit');
    expect(cardText(db, db.cards['metronome-trap']!)).toContain('Deal 5 damage to ALL enemies');
    expect(cardText(db, db.cards['metronome-trap+']!)).toContain('Deal 7 damage to ALL enemies');
    expect(cardText(db, db.cards['gleeful-trapsmith']!)).toContain('+1 per 2 Trap');
    expect(cardText(db, db.cards['gleeful-trapsmith+']!)).toContain('+1 per 2 Trap');
    expect(cardText(db, db.cards['gleeful-trapsmith']!)).toContain('half as much past +8');
    // (16 sprung: +8; 40 sprung: +8 and half of the 12 past it)
    for (const [sprung, each] of [
      [16, 11],
      [40, 17],
    ] as const) {
      let s = fight('trickster');
      s = play(s, 'gleeful-trapsmith');
      s.sides.a.snaresSprung = sprung;
      expect(dealt(s, 'trip-line')).toBe(each);
    }
  });
  for (const [card, cracks] of [
    // (the two commons 1 a hit, the uncommons and rares 2)
    ['obsidian-flurry', 3],
    ['obsidian-flurry+', 3],
    ['rift-sweep', 3],
    ['rift-sweep+', 3],
    ['sovereign-strike', 6],
    ['sovereign-strike+', 6],
    ['obsidian-drill', 6],
    ['obsidian-drill+', 6],
    ['hammer-and-anvil', 8],
    ['hammer-and-anvil+', 8],
    ['storm-of-glass', 8],
    ['storm-of-glass+', 8],
    ['fault-piercer+', 8],
    ['skybolt', 2],
    ['skybolt+', 2],
    ['astral-pulse', 2],
    ['astral-pulse+', 2],
    ['devastate', 4],
    ['devastate+', 4],
    ['comet', 6],
    ['comet+', 6],
  ] as const)
    it(`${card} applies ${cracks} Fracture`, () => {
      const s = fight('spellblade');
      expect(foe(play(s, card)).statuses.fracture).toBe(cracks);
    });
  it('Fault Piercer applies 8, cracked before or not; Rift Sweep and Arcane Pulse crack ALL enemies', () => {
    expect(foe(play(fight('spellblade'), 'fault-piercer')).statuses.fracture).toBe(8);
    const s = fight('spellblade');
    foe(s).statuses.fracture = 1;
    expect(foe(play(s, 'fault-piercer')).statuses.fracture).toBe(9);
    expect(cardText(db, db.cards['rift-sweep']!)).toContain('Apply 3 Fracture to ALL enemies');
    expect(cardText(db, db.cards['astral-pulse']!)).toContain('Apply 2 Fracture to ALL enemies');
  });
  it('Showstopper deals 26 and Metronome Trap is 5 to ALL; a Sword whose hits kill applies its Fracture to nobody', () => {
    expect(dealt(fight('trickster'), 'showstopper')).toBe(26);
    expect(db.cards['metronome-trap']!.effects[0]).toMatchObject({ op: 'damage', amount: 5, to: 'allFoes' });
    const s = fight('spellblade');
    foe(s).hp = 1;
    const after = play(s, 'storm-of-glass');
    expect(after.sides.b.units.every((u) => (u.statuses.fracture ?? 0) === 0 || u.hp <= 0)).toBe(true);
  });
});

describe('the last fast decks (#728)', () => {
  it('Bloodburst Consumes, upgraded too', () => {
    for (const card of ['bloodburst', 'bloodburst+']) {
      const after = play(fight('assassin'), card);
      expect(after.sides.a.exhausted.some((c) => c.card === card)).toBe(true);
      expect(cardText(db, db.cards[card]!)).toContain('Consume');
    }
  });
  for (const [card, losses, dmg] of [
    ['rending-fury', 7, 29],
    ['rending-fury', 11, 35],
    ['rending-fury', 17, 44],
    ['rending-fury', 60, 44],
    ['rending-fury+', 6, 34],
    ['rending-fury+', 12, 46],
    ['rending-fury+', 60, 55],
  ] as const)
    it(`${card} after ${losses} HP losses deals ${dmg}`, () => {
      const s = fight('knight');
      s.sides.a.lostHpFight = losses;
      expect(dealt(s, card)).toBe(dmg);
    });
});
