// Dorian is the Slay the Spire 2 Necrobinder's card list (docs/decisions-pending/necromancer.md). Her one Osty is his Bone Thralls,
// several at once: Raise N brings a Thrall with N HP (or grows the weakest when all three slots are taken), and Command cards make
// each Thrall strike. These are the scenario tests for the new rules and the trickier cards.

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
  it('starts as hers: 4 Strike, 4 Defend, Raise Thrall and Off the Leash, 70 HP, and a Bone Thrall that does not act', () => {
    const r = RIFTWALKERS.necromancer;
    expect([...r.starter].sort()).toEqual(
      [
        'defend',
        'defend',
        'defend',
        'defend',
        'off-the-leash',
        'raise-thrall',
        'strike',
        'strike',
        'strike',
        'strike',
      ].sort(),
    );
    expect(r.hero.maxHp).toBe(70);
    const s = fight([]);
    expect(thralls(s)).toHaveLength(1);
    expect(thralls(s)[0]!.hp).toBe(5);
    const hp0 = foe(s).hp;
    const out = applyAction(db, s, { type: 'endTurn' });
    // the Thrall never strikes on its own
    expect(out.events.some((e) => e.type === 'act' && e.unit === thralls(s)[0]!.id)).toBe(false);
    expect(out.events.some((e) => e.type === 'damage' && e.source === thralls(s)[0]!.id)).toBe(
      false,
    );
    expect(foe(out.state).hp).toBeLessThanOrEqual(hp0);
  });

  it('Raise brings a new Thrall with that much HP, and with three standing grows the weakest instead', () => {
    let s = play(fight(['raise-thrall', 'raise-thrall', 'raise-thrall']), 'T0');
    expect(thralls(s).map((u) => u.maxHp)).toEqual([5, 5]);
    s = play(s, 'T1');
    expect(thralls(s)).toHaveLength(3);
    // a fourth: no room, so the weakest gains 5 max HP (and no release is asked for)
    s.sides.a.units[0]!.maxHp = s.sides.a.units[0]!.hp = 9;
    s = play(s, 'T2');
    expect(thralls(s)).toHaveLength(3);
    expect(
      thralls(s)
        .map((u) => u.maxHp)
        .sort((a, b) => a - b),
    ).toEqual([5, 9, 10]);
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
    thralls(s)[0]!.hp = 3; // a hurt 5-HP Thrall
    let after = play(s, 'T0', foe(s).id);
    expect(foe(after).hp).toBe(300 - (6 + 3) - (6 + 10));
    after = play(after, 'T1', foe(after).id);
    expect(foe(after).hp).toBe(300 - 25 - (10 + 5) - (10 + 10));
  });

  it('Ossify (Calcify) makes the Thralls hit harder, and Rattle the Bones hits once more for every earlier command', () => {
    let s = fight(['calcify', 'knucklebone', 'rattle-the-bones']);
    s = play(s, 'T0');
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10);
    s = play(s, 'T2', foe(s).id);
    // one earlier command this turn: 2 hits of 7 + 4
    expect(foe(s).hp).toBe(300 - 10 - 22);
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
    expect(thralls(s)).toHaveLength(2);
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
    expect(s.sides.b.units[0]!.hp).toBe(300 - 6);
    s = play(s, 'T2', foe(s).id);
    expect(foe(s).hp).toBe(300 - 6 - (9 + 2));
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
  it('Gallows (Hang) deals double to an enemy for each Gallows already played on it', () => {
    let s = fight(['gallows', 'gallows', 'gallows']);
    s = play(s, 'T0', foe(s).id);
    s = play(s, 'T1', foe(s).id);
    s = play(s, 'T2', foe(s).id);
    expect(foe(s).hp).toBe(300 - 10 - 20 - 40);
  });

  it('Toll in Advance (Borrowed Time): 4 Mana, and every card costs 1 more this turn', () => {
    let s = fight(['toll-in-advance', 'strike']);
    s.sides.a.mana = 3;
    s = play(s, 'T0');
    expect(s.sides.a.mana).toBe(6);
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
    expect(t('raise-thrall')).toBe('Raise 5.');
    expect(t('knucklebone')).toBe('Your companions each deal 6 damage.');
    expect(t('call-at-dusk')).toBe('Next turn: Raise 2. Gain 2 Mana.');
    expect(t('bone-crush')).toMatch(/^Costs 0 if your companions have struck this turn\./);
  });
});
