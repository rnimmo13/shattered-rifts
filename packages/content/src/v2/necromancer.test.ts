// Dorian is the Slay the Spire 2 Necrobinder's card list (DECISIONS #370). Her one Osty is his Bone Thralls,
// several at once: Raise Dead N brings a Thrall with N HP (or grows the healthiest when every slot is taken, #684), and Command cards
// make each companion strike; since #684 they strike on their own too. These are the scenario tests for the new rules and the trickier cards.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  costOf,
  createCombat,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[], enemies: string[] = ['squire']): CombatState {
  const { state } = createCombat(db, {
    seed: 'dorian-test',
    a: {
      hero: 'necromancer',
      deck: [...RIFTWALKERS.necromancer.starter, ...RIFTWALKERS.necromancer.starter],
    },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  // one card at a time: take away the Thrall Grave Chill raised this turn (the trait has its own test)
  const first = s.sides.a.units.findIndex((u) => u.kind === 'ally');
  s.sides.a.units = s.sides.a.units.filter((u, i) => u.kind !== 'ally' || i === first);
  // big, plain enemies, so a number read off them is the card's own
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 300;
    u.barrier = 0;
    u.statuses = {};
  }
  return s;
}
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const thralls = (s: CombatState): Unit[] => s.sides.a.units.filter((u) => u.kind === 'ally');
const hero = (s: CombatState): Unit => s.sides.a.units[s.sides.a.units.length - 1]!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
/** a Bone Thrall with this much HP, put on the board */
function addThrall(s: CombatState, hp: number, id = `B${s.sides.a.units.length}`): void {
  const t = clone(thralls(s)[0] ?? hero(s));
  s.sides.a.units.splice(s.sides.a.units.length - 1, 0, {
    ...t,
    id,
    def: 'bone-thrall',
    name: 'Bone Thrall',
    kind: 'ally',
    hp,
    maxHp: hp,
    barrier: 0,
    statuses: {},
  });
}

describe('Dorian, the Necrobinder copy', () => {
  it('starts as hers: 3 Strike, 3 Defend, Raise Thrall, 2 Off the Leash (DECISIONS #675) and Marked for the Grave, 70 HP, and a Bone Thrall that strikes on its own (#684)', () => {
    const r = RIFTWALKERS.necromancer;
    expect([...r.starter].sort()).toEqual(
      [
        'defend',
        'defend',
        'defend',
        'marked-for-the-grave',
        'off-the-leash',
        'off-the-leash',
        'raise-thrall',
        'strike',
        'strike',
        'strike',
      ].sort(),
    );
    expect(r.hero.maxHp).toBe(70);
    const s = fight([]);
    expect(thralls(s)).toHaveLength(1);
    expect(thralls(s)[0]!.hp).toBe(3); // (Raise Dead 3, #684)
    const out = applyAction(db, s, { type: 'endTurn' });
    // since #684 it strikes at the end of his turn: 2, plus 1 for every 4 max HP (none at 3)
    const blow = out.events.find((e) => e.type === 'damage' && e.source === thralls(s)[0]!.id);
    expect(blow && blow.type === 'damage' ? blow.lost + blow.blocked : 0).toBe(2);
  });

  it('Raise Dead brings a new Thrall with that much HP, and with three standing grows the healthiest instead (#684)', () => {
    let s = play(fight(['raise-thrall', 'raise-thrall', 'raise-thrall']), 'T0');
    expect(thralls(s).map((u) => u.maxHp)).toEqual([3, 5]);
    s = play(s, 'T1');
    expect(thralls(s)).toHaveLength(3);
    // a fourth: no room, so the healthiest gains 5 max HP (and no release is asked for)
    s.sides.a.units[0]!.maxHp = s.sides.a.units[0]!.hp = 9;
    s = play(s, 'T2');
    expect(thralls(s)).toHaveLength(3);
    expect(
      thralls(s)
        .map((u) => u.maxHp)
        .sort((a, b) => a - b),
    ).toEqual([5, 5, 14]);
  });

  it('a Command card makes each Thrall strike, and does nothing with none', () => {
    const s = fight(['knucklebone']);
    addThrall(s, 4);
    const after = play(s, 'T0', foe(s).id);
    expect(foe(after).hp).toBe(300 - 12);
    const none = fight(['knucklebone']);
    none.sides.a.units = none.sides.a.units.filter((u) => u.kind !== 'ally');
    expect(foe(play(none, 'T0', foe(none).id)).hp).toBe(300);
  });

  it('Off the Leash adds each Thrall’s own HP; The Drowned King its max HP', () => {
    const s = fight(['off-the-leash', 'the-drowned-king']);
    addThrall(s, 10);
    thralls(s)[0]!.hp = 1; // a hurt 3-HP Thrall
    let after = play(s, 'T0', foe(s).id);
    expect(foe(after).hp).toBe(300 - (6 + 1) - (6 + 10));
    after = play(after, 'T1', foe(after).id);
    expect(foe(after).hp).toBe(300 - 23 - (10 + 3) - (10 + 10));
  });

  it('Ossify (Calcify) makes the Thralls hit harder, and Rattle the Bones hits harder for every earlier command', () => {
    let s = fight(['calcify', 'knucklebone', 'rattle-the-bones']);
    s = play(s, 'T0');
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10);
    s = play(s, 'T2', foe(s).id);
    // one earlier command this turn: one hit of 7 + 3 + 4
    expect(foe(s).hp).toBe(300 - 10 - 14);
  });

  it('Bone Crush costs 0 once the Thralls have struck this turn', () => {
    let s = fight(['bone-crush', 'knucklebone']);
    const inst = s.sides.a.hand[0]!;
    expect(costOf(db, s.sides.a, inst)).toBe(2);
    s = play(s, 'T1', foe(s).id);
    expect(
      costOf(
        db,
        s.sides.a,
        s.sides.a.hand.find((c) => c.id === 'T0')!,
      ),
    ).toBe(0);
  });

  it('Bone Rain: each Thrall strikes every enemy and dies, and you gain 9 Barrier for each', () => {
    const s = fight(['bone-rain'], ['squire', 'squire']);
    for (const u of s.sides.b.units) u.hp = u.maxHp = 300;
    addThrall(s, 6);
    const b0 = hero(s).barrier;
    const after = play(s, 'T0');
    expect(thralls(after)).toHaveLength(0);
    expect(hero(after).barrier).toBe(b0 + 18);
    for (const u of after.sides.b.units) expect(u.hp).toBe(300 - 18);
  });

  it('Fen Offering (Sacrifice): the chosen Thrall dies for twice its max HP in Barrier', () => {
    const s = fight(['fen-offering']);
    const t = thralls(s)[0]!;
    t.maxHp = 8;
    const b0 = hero(s).barrier;
    const after = play(s, 'T0', t.id);
    expect(thralls(after)).toHaveLength(0);
    expect(hero(after).barrier).toBe(b0 + 16);
  });

  it('Shared Agony (Necro Mastery): whatever a Thrall loses, every enemy loses too', () => {
    let s = fight(['shared-agony'], ['squire', 'squire']);
    for (const u of s.sides.b.units) u.hp = u.maxHp = 300;
    s = play(s, 'T0');
    expect(thralls(s).length).toBe(2);
    // an enemy turn: whatever lands on a Thrall is mirrored on every enemy
    const out = applyAction(db, s, { type: 'endTurn' });
    const hurt = out.events
      .filter(
        (e) =>
          e.type === 'damage' &&
          s.sides.a.units.some((u) => u.id === e.target && u.kind === 'ally'),
      )
      .reduce((n, e) => n + (e.type === 'damage' ? e.lost : 0), 0);
    expect(hurt).toBeGreaterThan(0);
    const loss = out.events
      .filter((e) => e.type === 'damage' && e.target === foe(s, 1).id && e.kind === 'direct')
      .reduce((n, e) => n + (e.type === 'damage' ? e.lost : 0), 0);
    expect(loss).toBe(hurt);
  });

  it('Seize Them (Sic ’Em): a Thrall that hits its quarry this turn raises another', () => {
    let s = fight(['seize-them', 'knucklebone']);
    s = play(s, 'T0', foe(s).id);
    expect(thralls(s)).toHaveLength(1);
    s = play(s, 'T1', foe(s).id);
    expect(thralls(s)).toHaveLength(2);
    expect(thralls(s)[1]!.maxHp).toBe(3);
  });

  it('Call at Dusk (Invoke): next turn, Raise 2 and 2 Mana, once', () => {
    let s = fight(['call-at-dusk']);
    // (a Thrall that lives through the enemy's turn)
    thralls(s)[0]!.hp = thralls(s)[0]!.maxHp = 80;
    s = play(s, 'T0');
    expect(thralls(s)).toHaveLength(1);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    // Call at Dusk's 2, beside Grave Chill's 3 for the turn
    expect(
      thralls(s)
        .map((u) => u.maxHp)
        .sort((x, y) => x - y),
    ).toEqual([2, 3, 80]);
    expect(s.sides.a.mana).toBe(5);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(3);
  });
});

describe('Fate (her Doom)', () => {
  it('Rot Strike (Blight Strike) curses with as much Fate as it took off', () => {
    const s = fight(['rot-strike']);
    foe(s).barrier = 3;
    const after = play(s, 'T0', foe(s).id);
    expect(foe(after).statuses.doom).toBe(5);
  });

  it('Last Rites (No Escape): 10 Fate, and 5 more for every 10 already on it', () => {
    const s = fight(['last-rites']);
    foe(s).statuses.doom = 25;
    const after = play(s, 'T0', foe(s).id);
    expect(foe(after).statuses.doom).toBe(25 + 10 + 10);
    expect(cardText(db, db.cards['last-rites']!)).toBe(
      'Curse the target with 10 (+5 per 10 Fate on the target) Fate.',
    );
  });

  it('The Last Toll (End of Days) kills every enemy at or below its Fate at once', () => {
    const s = fight(['the-last-toll'], ['squire', 'squire']);
    foe(s, 0).hp = 20;
    foe(s, 1).hp = 200;
    const after = play(s, 'T0');
    expect(after.sides.b.units).toHaveLength(1);
    expect(foe(after).statuses.doom).toBe(29);
  });

  it('Mark of Ending (Oblivion): every card played this turn curses that enemy, not the card itself', () => {
    let s = fight(['mark-of-ending', 'defend', 'defend']);
    s = play(s, 'T0', foe(s).id);
    expect(foe(s).statuses.doom ?? 0).toBe(0);
    s = play(s, 'T1');
    s = play(s, 'T2');
    expect(foe(s).statuses.doom).toBe(6);
  });

  it("Reaper's Mantle (Reaper Form): what an Attack takes off is cursed on as Fate", () => {
    let s = fight(['reapers-mantle', 'strike']);
    s = play(s, 'T0');
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).statuses.doom).toBe(6);
  });

  it('Burial Shroud (Shroud) and Fleshcraft (Sleight of Flesh) answer curses on enemies', () => {
    let s = fight(['burial-shroud', 'fleshcraft', 'tolling-bell']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    const b0 = hero(s).barrier;
    s = play(s, 'T2', foe(s).id);
    expect(hero(s).barrier).toBe(b0 + 2);
    expect(foe(s).hp).toBe(300 - 9);
  });

  it('Wither (Debilitate) doubles Exposed on its target', () => {
    let s = fight(['wither', 'strike']);
    foe(s).statuses.exposed = 2;
    // (its own hit lands before it Debilitates: 10 Exposed is 15; the Strike after it, 6 doubly Exposed, is 12)
    s = play(s, 'T0', foe(s).id);
    expect(foe(s).hp).toBe(300 - 15);
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 15 - 12);
  });

  it('Spreading Rot (Misery) puts the target’s debuffs on every other enemy', () => {
    const s = fight(['spreading-rot'], ['squire', 'squire']);
    for (const u of s.sides.b.units) u.hp = u.maxHp = 300;
    foe(s, 0).statuses = { doom: 12, exposed: 2 };
    const after = play(s, 'T0', foe(s, 0).id);
    expect(foe(after, 1).statuses.doom).toBe(12);
    expect(foe(after, 1).statuses.exposed).toBe(2);
  });
});

describe('Souls and Fleeting cards', () => {
  it('a Gravesoul draws 2 and is consumed; Restless Spirits (Haunt) and Requiem (Soul Storm) read them', () => {
    let s = fight(['restless-spirits', 'gravesoul', 'requiem']);
    s = play(s, 'T0');
    const hand0 = s.sides.a.hand.length;
    s = play(s, 'T1');
    expect(s.sides.a.hand.length).toBe(hand0 - 1 + 2);
    expect(s.sides.b.units[0]!.hp).toBe(300 - 4);
    s = play(s, 'T2', foe(s).id);
    expect(foe(s).hp).toBe(300 - 4 - (9 + 2));
  });

  it('Wraith Strike makes a card Fleeting: it is consumed at the end of the turn, and counts as Fleeting when played', () => {
    let s = fight(['wraith-strike', 'defend']);
    s = play(s, 'T0', foe(s).id);
    expect(s.sides.a.hand.find((c) => c.id === 'T1')?.ethereal).toBe(true);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.exhausted.some((c) => c.id === 'T1')).toBe(true);
  });

  it('Drag Under (Pull from Below) and Wailing Cry (Banshee’s Cry) grow with the Fleeting cards played', () => {
    let s = fight(['desecrate', 'cold-dread', 'drag-under', 'wailing-cry']);
    s = play(s, 'T0', foe(s).id);
    s = play(s, 'T1', foe(s).id);
    expect(s.sides.a.etherealPlayed).toBe(2);
    const hp = foe(s).hp;
    s = play(s, 'T2', foe(s).id);
    // (Cold Dread left it Exposed: 10 becomes 15)
    expect(hp - foe(s).hp).toBe(15);
    expect(
      costOf(
        db,
        s.sides.a,
        s.sides.a.hand.find((c) => c.id === 'T3')!,
      ),
    ).toBe(5);
  });

  it('Soul Lance (Veilpiercer) makes the next Fleeting card free', () => {
    let s = fight(['veilpiercer', 'desecrate']);
    s = play(s, 'T0', foe(s).id);
    const mana = s.sides.a.mana;
    s = play(s, 'T1', foe(s).id);
    expect(s.sides.a.mana).toBe(mana);
  });

  it('Call the Departed (Seance) turns a card of the draw pile into a Gravesoul', () => {
    let s = fight(['call-the-departed']);
    const souls = (x: CombatState) => x.sides.a.draw.filter((c) => c.card === 'gravesoul').length;
    expect(souls(s)).toBe(0);
    s = play(s, 'T0');
    expect(souls(s)).toBe(1);
  });
});

describe('the other new rules', () => {
  it('Gallows grows linearly across copies instead of doubling through Noose', () => {
    let s = fight(['gallows', 'gallows', 'gallows']);
    s = play(s, 'T0', foe(s).id);
    s = play(s, 'T1', foe(s).id);
    s = play(s, 'T2', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10 - 16 - 22);
  });

  it('Toll in Advance (Borrowed Time): 5 Mana, and every card costs 1 more this turn', () => {
    let s = fight(['toll-in-advance', 'strike']);
    s.sides.a.mana = 3;
    s = play(s, 'T0');
    expect(s.sides.a.mana).toBe(7);
    expect(costOf(db, s.sides.a, s.sides.a.hand[0]!)).toBe(2);
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.costTax).toBe(0);
  });

  it('Helping Hand (Right Hand Hand) comes back when you play a card that costs 2 or more', () => {
    let s = fight(['helping-hand', 'bone-bulwark']);
    s = play(s, 'T0', foe(s).id);
    expect(s.sides.a.discard.some((c) => c.id === 'T0')).toBe(true);
    s = play(s, 'T1');
    expect(s.sides.a.hand.some((c) => c.id === 'T0')).toBe(true);
  });

  it('Echo of the Dead (Transfigure) gives a card Replay and makes it cost 1 more', () => {
    let s = fight(['echo-of-the-dead', 'strike']);
    s = play(s, 'T0');
    const c = s.sides.a.hand.find((x) => x.id === 'T1')!;
    expect(c.replay).toBe(1);
    expect(costOf(db, s.sides.a, c)).toBe(2);
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 12);
  });

  it('Death Grip (Squeeze) counts every Command card in the deck', () => {
    const s = fight(['death-grip']);
    const sd = s.sides.a;
    // the Off the Leash copies left in the deck, and Death Grip itself: 20 + 5 each
    const n = [...sd.hand, ...sd.draw, ...sd.discard, ...sd.exhausted].filter((c) =>
      db.cards[c.card]?.tags?.includes('command'),
    ).length;
    expect(n).toBeGreaterThanOrEqual(2);
    const after = play(s, 'T0', foe(s).id);
    expect(foe(after).hp).toBe(300 - (20 + 5 * n));
  });

  it('Mourning (Melancholy) costs 1 less for every death this fight', () => {
    const s = fight(['mourning']);
    expect(costOf(db, s.sides.a, s.sides.a.hand[0]!)).toBe(3);
    s.sides.a.deaths = 2;
    expect(costOf(db, s.sides.a, s.sides.a.hand[0]!)).toBe(1);
  });

  it('the cards read as the generated text says', () => {
    const t = (id: string) => cardText(db, db.cards[id]!);
    expect(t('raise-thrall')).toBe('Raise Dead 5.');
    expect(t('knucklebone')).toBe('Your companions each deal 6 damage.');
    expect(t('call-at-dusk')).toBe('Next turn: Raise Dead 2 and gain 2 Mana.');
    expect(t('bone-crush')).toMatch(/^Costs 0 if your companions have struck this turn\./);
  });
});

describe('Grave Chill raises a Thrall every turn (DECISIONS #397)', () => {
  const start = (): CombatState =>
    createCombat(db, {
      seed: 'grave-chill',
      a: { hero: 'necromancer', deck: [...RIFTWALKERS.necromancer.starter] },
      b: { enemies: ['squire'] },
    }).state;

  it('turn 1: one Thrall with 3 HP, from Grave Chill (no second starting one, DECISIONS #431, #684)', () => {
    expect(thralls(start()).map((u) => u.maxHp)).toEqual([3]);
    expect(cardText(db, db.cards['raise-thrall']!)).toBe('Raise Dead 5.');
    expect(RIFTWALKERS.necromancer.trait.text).toMatch(/^At the start of your turn, Raise Dead 3/);
  });

  it('a Thrall is standing at the start of every turn, even after the enemy kills them', () => {
    let s = start();
    for (let turn = 0; turn < 3; turn++) {
      s = applyAction(db, s, { type: 'endTurn' }).state;
      if (s.winner) break;
      expect(thralls(s).length, `turn ${turn + 2}`).toBeGreaterThan(0);
    }
  });
});

describe('the small card fixes (DECISIONS #397)', () => {
  it('Bone Bulwark, Bone Sift, Grave Robbery and Spirit Walk read as reviewed', () => {
    const text = (id: string) => cardText(db, db.cards[id]!);
    expect(text('bone-bulwark')).toBe('Raise Dead 5. Gain 8 Barrier.');
    expect(text('bone-sift')).toMatch(/^Raise Dead 5./);
    expect(text('grave-robbery')).toMatch(/^Deal 6 damage./);
    expect(text('ghostform')).toMatch(/6 or more/);
  });
});

describe('the dead grow and strike back (DECISIONS #684)', () => {
  /** what each damage event from `source` took off (HP and Barrier) */
  const dealtBy = (events: { type: string }[], source: string): number[] =>
    events.flatMap((e) =>
      e.type === 'damage' && (e as { source?: string }).source === source
        ? [(e as unknown as { lost: number; blocked: number }).lost + (e as unknown as { blocked: number }).blocked]
        : [],
    );
  /** play a card, then answer a choice it asks for with the first option */
  const playPick = (s: CombatState, id: string, target?: string): CombatState => {
    let out = play(s, id, target);
    while (out.pending) {
      const pick = legalActions(db, out).find((a) => a.type === 'pick');
      expect(pick, 'a choice to answer').toBeTruthy();
      out = applyAction(db, out, pick!).state;
    }
    return out;
  };

  it('a companion an enemy kills bursts for half its max HP at that enemy; a sacrifice sets nothing off', () => {
    const s = fight([], ['squire', 'squire']);
    const thrall = thralls(s)[0]!;
    thrall.maxHp = 10;
    thrall.hp = 1;
    const { events } = applyAction(db, s, { type: 'endTurn' });
    const hit = events.find((e) => e.type === 'damage' && e.target === thrall.id) as
      | { source: string }
      | undefined;
    expect(hit, 'an enemy strikes the Thrall').toBeDefined();
    const burst = events.filter(
      (e) => e.type === 'damage' && e.source === hero(s).id && e.target === hit!.source,
    );
    expect(burst.map((e) => (e.type === 'damage' ? e.lost + e.blocked : 0))).toEqual([5]);
    // (no Fate for a death any more: the burst took its place)
    for (const u of s.sides.b.units) expect(u.statuses.doom ?? 0).toBe(0);

    const rain = fight(['bone-rain']);
    const out = applyAction(
      db,
      rain,
      legalActions(db, rain).find((a) => a.type === 'play' && a.card === 'T0')!,
    );
    expect(thralls(out.state)).toHaveLength(0);
    expect(dealtBy(out.events, hero(rain).id)).toEqual([]);
  });

  it('the Grave Colossus takes 2 slots, has Taunt, strikes for 2 + 1 per 4 max HP and takes half of a Command', () => {
    expect(db.units['grave-colossus']).toMatchObject({ maxHp: 18, taunt: true, slots: 2, commandPct: 50 });
    expect(db.units['grave-colossus+']?.maxHp).toBe(22);
    let s = fight(['grave-colossus', 'knucklebone']);
    s = play(s, 'T0');
    const colossus = s.sides.a.units.find((u) => u.def === 'grave-colossus')!;
    expect(colossus.maxHp).toBe(18);
    // a 6-damage Command: the Thrall deals 6, the Colossus 3
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 6 - 3);
    const { events } = applyAction(db, s, { type: 'endTurn' });
    expect(dealtBy(events, colossus.id)).toEqual([6]);
  });

  it('with no slot free, Raise Dead grows the healthiest companion, the Colossus', () => {
    let s = fight(['grave-colossus', 'raise-thrall']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    expect(s.sides.a.units.find((u) => u.def === 'grave-colossus')!.maxHp).toBe(23);
    expect(thralls(s).filter((u) => u.def === 'bone-thrall')).toHaveLength(1);
  });

  it('Bone Rain gives up the Thralls only, never a Colossus', () => {
    let s = fight(['grave-colossus', 'bone-rain']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    expect(thralls(s).map((u) => u.def)).toEqual(['grave-colossus']);
  });

  it('Blood Offering: lose 5 HP and Raise Dead 10; the first HP lost on your turn grows every companion by 2', () => {
    let s = fight(['blood-offering', 'blood-offering']);
    const hp = hero(s).hp;
    s = play(s, 'T0');
    expect(hero(s).hp).toBe(hp - 5);
    expect(thralls(s).map((u) => u.maxHp)).toEqual([5, 10]);
    // (once a turn)
    s = play(s, 'T1');
    expect(hero(s).hp).toBe(hp - 10);
    expect(thralls(s).map((u) => u.maxHp)).toEqual([5, 10, 10]);
  });

  it('Bone Feast consumes a card from your hand, and each companion gains 3 max HP for it', () => {
    let s = fight(['bone-feast', 'strike']);
    s = playPick(s, 'T0');
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('strike');
    expect(thralls(s).map((u) => u.maxHp)).toEqual([6]);
    // nothing to consume, nothing grows
    let bare = fight(['bone-feast']);
    bare = playPick(bare, 'T0');
    expect(thralls(bare).map((u) => u.maxHp)).toEqual([3]);
  });

  it('Grave Tithe: at the start of each turn, lose 3 HP and Raise Dead 5', () => {
    let s = fight(['grave-tithe']);
    // (a Thrall that lives through the enemy's turn, so the new ones are easy to read)
    thralls(s)[0]!.hp = thralls(s)[0]!.maxHp = 80;
    s = play(s, 'T0');
    const hp = hero(s).hp;
    const { state, events } = applyAction(db, s, { type: 'endTurn' });
    const lost = events.some(
      (e) => e.type === 'damage' && e.target === hero(s).id && e.source === hero(s).id,
    );
    expect(lost || hero(state).hp <= hp - 3).toBe(true);
    // Grave Chill's 3 and Grave Tithe's 5 both rise; Grave Tithe's HP loss then gives every companion 2 (the 3 becomes 5)
    const hps = thralls(state)
      .map((u) => u.maxHp)
      .sort((x, y) => x - y);
    expect(hps).toHaveLength(3);
    expect(hps.slice(0, 2)).toEqual([5, 5]);
  });

  it('Bonelord has 4 companion slots, and a companion an enemy kills bursts for its full max HP', () => {
    const { state } = createCombat(db, {
      seed: 'bonelord',
      a: {
        hero: 'necromancer',
        ascendancy: 'necromancer:bonelord',
        deck: [...RIFTWALKERS.necromancer.starter],
      },
      b: { enemies: ['squire'] },
    });
    let s = clone(state);
    s.sides.a.hand = ['raise-thrall', 'raise-thrall', 'raise-thrall', 'raise-thrall'].map((card, i) => ({
      id: `T${i}`,
      card,
    }));
    s.sides.a.mana = 9;
    for (const id of ['T0', 'T1', 'T2']) s = play(s, id);
    expect(thralls(s)).toHaveLength(4);
    for (const u of s.sides.b.units) {
      u.hp = u.maxHp = 300;
      u.statuses = {};
    }
    // (the others too sturdy for a blow's overflow to fell: one death to read)
    for (const u of thralls(s)) u.hp = u.maxHp = 200;
    const first = thralls(s)[0]!;
    first.maxHp = 10;
    first.hp = 1;
    const { events } = applyAction(db, s, { type: 'endTurn' });
    const hit = events.find((e) => e.type === 'damage' && e.target === first.id) as
      | { source: string }
      | undefined;
    expect(hit, 'an enemy strikes the Thrall').toBeDefined();
    const burst = events.filter(
      (e) => e.type === 'damage' && e.source === hero(s).id && e.target === hit!.source,
    );
    expect(burst.reduce((n, e) => n + (e.type === 'damage' ? e.lost + e.blocked : 0), 0)).toBe(10);
  });
});
