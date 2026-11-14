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

function fight(hand: string[], enemies: string[] = ['squire'], ascendancy?: string): CombatState {
  const { state } = createCombat(db, {
    seed: 'dorian-test',
    a: {
      hero: 'necromancer',
      ...(ascendancy ? { ascendancy } : {}),
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

  it('Off the Leash adds half each Thrall’s own HP (#691); The Drowned King has only the healthiest strike, for its max HP (#689)', () => {
    const s = fight(['off-the-leash', 'the-drowned-king']);
    addThrall(s, 10);
    thralls(s)[0]!.hp = 1; // a hurt 3-HP Thrall
    let after = play(s, 'T0', foe(s).id);
    // (4 + half its HP, rounded down: 4 + 0 for the hurt one, 4 + 5 for the 10-HP one)
    expect(foe(after).hp).toBe(300 - (4 + 0) - (4 + 5));
    expect(cardText(db, db.cards['off-the-leash']!)).toBe(
      'Your companions each deal 4 damage, plus half their own HP (half as much past +10).',
    );
    after = play(after, 'T1', foe(after).id);
    // (the 10-HP Thrall alone, not the 3-HP one too)
    expect(foe(after).hp).toBe(300 - 13 - (15 + 10));
    expect(cardText(db, db.cards['the-drowned-king']!)).toBe(
      'Your healthiest companion deals 15 damage, plus its own max HP.',
    );
    expect(cardText(db, db.cards['the-drowned-king+']!)).toBe(
      'Your healthiest companion deals 16 damage, plus 1.5 times its own max HP.',
    );
    expect(db.cards['the-drowned-king']?.cost).toBe(2);
  });

  it('Ossify (Calcify) makes the Thralls hit harder, and Rattle the Bones hits harder for every earlier command', () => {
    let s = fight(['calcify', 'knucklebone', 'rattle-the-bones']);
    s = play(s, 'T0');
    // (#691: it raises a 5-HP Thrall beside the 3-HP one)
    expect(thralls(s).map((u) => u.maxHp)).toEqual([3, 5]);
    s = play(s, 'T1', foe(s).id);
    // two Thralls, each 6 + Marrow 2
    expect(foe(s).hp).toBe(300 - 16);
    s = play(s, 'T2', foe(s).id);
    // one earlier Command this turn: each Thrall hits for 6 + 2 + Marrow 2
    expect(foe(s).hp).toBe(300 - 16 - 20);
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
    expect(thralls(s)[1]!.maxHp).toBe(2);
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
      'Curse the target with 10 (+5 per 10 Fate on the target, half as much past +15, at most +25) Fate.',
    );
  });

  it('The Last Toll (End of Days) kills every enemy at or below its Fate at once', () => {
    const s = fight(['the-last-toll'], ['squire', 'squire']);
    foe(s, 0).hp = 20;
    foe(s, 1).hp = 200;
    const after = play(s, 'T0');
    expect(after.sides.b.units).toHaveLength(1);
    expect(foe(after).statuses.doom).toBe(32);
  });

  it('Mark of Ending (Oblivion): every card played this turn curses that enemy, not the card itself', () => {
    let s = fight(['mark-of-ending', 'defend', 'defend']);
    s = play(s, 'T0', foe(s).id);
    expect(foe(s).statuses.doom ?? 0).toBe(0);
    s = play(s, 'T1');
    s = play(s, 'T2');
    expect(foe(s).statuses.doom).toBe(8);
  });

  it("Reaper's Mantle (Reaper Form): half of what an Attack takes off is cursed on as Fate (#762)", () => {
    let s = fight(['reapers-mantle', 'strike']);
    s = play(s, 'T0');
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).statuses.doom).toBe(3);
  });

  it('Reaping converts each companion hit at one quarter, rounded up, after Barrier', () => {
    const probe = {
      ...db.cards.strike!,
      id: 'mantle-probe',
      effects: [
        {
          op: 'command' as const,
          ops: [{ op: 'damage' as const, amount: 6, to: 'target' as const }],
        },
      ],
    };
    const local = { ...db, cards: { ...db.cards, 'mantle-probe': probe } };
    for (const barrier of [0, 2, 99]) {
      let s = fight(['reapers-mantle']);
      s = play(s, 'T0');
      const companion = thralls(s)[0]!;
      s.sides.a.units = s.sides.a.units.filter((u) => u.kind === 'hero' || u.id === companion.id);
      companion.statuses = { might: 7 };
      foe(s).barrier = barrier;
      s.sides.a.hand = [{ id: 'probe', card: 'mantle-probe' }];
      const action = legalActions(local, s).find((a) => a.type === 'play' && a.card === 'probe')!;
      const out = applyAction(local, s, action);
      const hits = out.events.filter((e) => e.type === 'damage' && e.target === foe(s).id);
      expect(hits.length).toBeGreaterThan(0);
      const lost = 300 - foe(out.state).hp;
      expect(foe(out.state).statuses.doom ?? 0).toBe(Math.ceil(lost / 4));
    }
  });

  it('Burial Shroud (Shroud) and Fleshcraft (Sleight of Flesh) answer curses on enemies', () => {
    let s = fight(['burial-shroud', 'fleshcraft', 'tolling-bell']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    const b0 = hero(s).barrier;
    s = play(s, 'T2', foe(s).id);
    expect(hero(s).barrier).toBe(b0 + 2);
    expect(foe(s).hp).toBe(300 - 8);
  });

  it('Fleshcraft answers once a turn, and Burial Shroud the first 2 curses a turn (#691)', () => {
    expect(cardText(db, db.cards.fleshcraft!)).toMatch(/\(once each turn\)/);
    expect(cardText(db, db.cards['grave-debt+']!)).toMatch(/two thirds of/);
    let s = fight(['burial-shroud', 'fleshcraft', 'tolling-bell', 'tolling-bell', 'tolling-bell']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    const b0 = hero(s).barrier;
    for (const id of ['T2', 'T3', 'T4']) s = play(s, id, foe(s).id);
    expect(hero(s).barrier).toBe(b0 + 4);
    expect(foe(s).hp).toBe(300 - 8);
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

  it('Toll in Advance (Borrowed Time, #691): 4 Mana now and 2 less next turn, consumed', () => {
    let s = fight(['toll-in-advance', 'strike']);
    s.sides.a.mana = 3;
    s = play(s, 'T0');
    expect(s.sides.a.mana).toBe(6);
    expect(costOf(db, s.sides.a, s.sides.a.hand[0]!)).toBe(1);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('toll-in-advance');
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.mana).toBe(s.sides.a.maxMana - 2);
    expect(cardText(db, db.cards['toll-in-advance']!)).toMatch(/Gain 4 Mana/);
    // (a turn never starts below 0; the debt left over carries to the turn after)
    let low = fight(['toll-in-advance']);
    low.sides.a.maxMana = 1;
    low = play(low, 'T0');
    low = applyAction(db, low, { type: 'endTurn' }).state;
    expect(low.sides.a.mana).toBe(0);
    expect(low.sides.a.nextMana).toBe(-1);
    low = applyAction(db, low, { type: 'endTurn' }).state;
    expect(low.sides.a.mana).toBe(0);
    expect(low.sides.a.nextMana).toBe(0);
  });

  it('Helping Hand (Right Hand Hand) comes back when you play a card that costs 2 or more', () => {
    let s = fight(['helping-hand', 'bone-bulwark']);
    s = play(s, 'T0', foe(s).id);
    expect(s.sides.a.discard.some((c) => c.id === 'T0')).toBe(true);
    s = play(s, 'T1');
    expect(s.sides.a.hand.some((c) => c.id === 'T0')).toBe(true);
  });

  it('Helping Hand comes back once a turn (#691)', () => {
    let s = fight(['helping-hand', 'bone-bulwark', 'bone-bulwark']);
    s = play(s, 'T0', foe(s).id);
    s = play(s, 'T1');
    s = play(s, 'T0', foe(s).id);
    expect(s.sides.a.discard.some((c) => c.id === 'T0')).toBe(true);
    s = play(s, 'T2');
    expect(s.sides.a.hand.some((c) => c.id === 'T0')).toBe(false);
    expect(cardText(db, db.cards['helping-hand']!)).toMatch(/\(once a turn\)/);
  });

  it('Echo of the Dead (Transfigure): you choose the card in your hand that is played again (#691)', () => {
    let s = fight(['echo-of-the-dead', 'strike', 'defend']);
    s = play(s, 'T0');
    expect(s.pending?.kind).toBe('replay');
    expect([...s.pending!.pool].sort()).toEqual(['T1', 'T2']);
    s = applyAction(db, s, { type: 'pick', cards: ['T1'] }).state;
    const c = s.sides.a.hand.find((x) => x.id === 'T1')!;
    expect(c.replay).toBe(1);
    expect(s.sides.a.hand.find((x) => x.id === 'T2')!.replay ?? 0).toBe(0);
    expect(costOf(db, s.sides.a, c)).toBe(2);
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 12);
    expect(cardText(db, db.cards['echo-of-the-dead']!)).toMatch(/^Choose a card in your hand/);
    // (Echo itself is consumed once the choice is made; upgraded it Holds and is not)
    expect(s.sides.a.exhausted.map((x) => x.card)).toContain('echo-of-the-dead');
    expect(db.cards['echo-of-the-dead+']).toMatchObject({ retain: true });
    expect(db.cards['echo-of-the-dead+']?.exhaust ?? false).toBe(false);
    // (with one card to choose from, no choice is asked)
    let one = fight(['echo-of-the-dead', 'strike']);
    one = play(one, 'T0');
    expect(one.pending).toBeNull();
    expect(one.sides.a.hand.find((x) => x.id === 'T1')!.replay).toBe(1);
  });

  it('Death Grip is your own blow, 8 + 4 per Command card played earlier this fight, double to finish (#689, #696)', () => {
    expect(cardText(db, db.cards['death-grip']!)).toBe(
      'Deal 8 (+4 per Command card you played earlier this fight) damage. Double damage to an enemy at half HP or less.',
    );
    // (with none played, the deck's Commands do not count, and the companions do not strike)
    let s = fight(['death-grip']);
    expect(foe(play(s, 'T0', foe(s).id)).hp).toBe(300 - 8);
    // (a wounded enemy, at half its HP or less, takes double)
    s = fight(['death-grip']);
    foe(s).hp = 150;
    expect(foe(play(s, 'T0', foe(s).id)).hp).toBe(150 - 16);
    s = fight(['off-the-leash', 'off-the-leash', 'death-grip']);
    s = play(s, 'T0', foe(s).id);
    s = play(s, 'T1', foe(s).id);
    expect(s.sides.a.tagsPlayed?.command).toBe(2);
    const before = foe(s).hp;
    s = play(s, 'T2', foe(s).id);
    expect(before - foe(s).hp).toBe(8 + 4 * 2);
    // (it is not a Command itself, so it never counts itself)
    expect(s.sides.a.tagsPlayed?.command).toBe(2);
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
    expect(t('call-at-dusk')).toBe('Consume. Next turn: Raise Dead 2 and gain 2 Mana.');
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
    expect(text('ghostform')).toMatch(/3 or more/);
  });
});

describe('the dead grow and strike back (DECISIONS #684)', () => {
  /** what each damage event from `source` took off (HP and Barrier) */
  const dealtBy = (events: { type: string }[], source: string): number[] =>
    events.flatMap((e) =>
      e.type === 'damage' && (e as { source?: string }).source === source
        ? [
            (e as unknown as { lost: number; blocked: number }).lost +
              (e as unknown as { blocked: number }).blocked,
          ]
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
      { source: string } | undefined;
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
    expect(db.units['grave-colossus']).toMatchObject({
      maxHp: 18,
      taunt: true,
      slots: 2,
      commandPct: 50,
    });
    expect(db.units['grave-colossus+']?.maxHp).toBe(22);
    let s = fight(['grave-colossus', 'knucklebone']);
    s = play(s, 'T0');
    const colossus = s.sides.a.units.find((u) => u.def === 'grave-colossus')!;
    // (the card raises 22 since #691)
    expect(colossus.maxHp).toBe(22);
    // a 6-damage Command: the Thrall deals 6, the Colossus 3
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 6 - 3);
    const { events } = applyAction(db, s, { type: 'endTurn' });
    expect(dealtBy(events, colossus.id)).toEqual([7]);
  });

  it('with no slot free, Raise Dead grows the healthiest companion, the Colossus', () => {
    let s = fight(['grave-colossus', 'raise-thrall']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    expect(s.sides.a.units.find((u) => u.def === 'grave-colossus')!.maxHp).toBe(27);
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
    s.sides.a.hand = ['raise-thrall', 'raise-thrall', 'raise-thrall', 'raise-thrall'].map(
      (card, i) => ({
        id: `T${i}`,
        card,
      }),
    );
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
      { source: string } | undefined;
    expect(hit, 'an enemy strikes the Thrall').toBeDefined();
    const burst = events.filter(
      (e) => e.type === 'damage' && e.source === hero(s).id && e.target === hit!.source,
    );
    expect(burst.reduce((n, e) => n + (e.type === 'damage' ? e.lost + e.blocked : 0), 0)).toBe(10);
  });
});

describe('Reaping Scythe grows and comes round again (2026-11-07)', () => {
  it('deals 22, every copy grows 7 (#691), and it is not consumed', () => {
    let s = fight(['reaping-scythe', 'reaping-scythe']);
    s = play(s, 'T0', foe(s).id);
    expect(foe(s).hp).toBe(300 - 22);
    expect(s.sides.a.exhausted.some((c) => c.card === 'reaping-scythe')).toBe(false);
    s = play(s, 'T1', foe(s).id);
    expect(foe(s).hp).toBe(300 - 22 - 29);
  });
});

describe('Raise Colossus (2026-11-07)', () => {
  it('reads Raise Colossus; with no room for another, the Colossus standing gains the HP, not a Thrall', () => {
    expect(cardText(db, db.cards['grave-colossus']!)).toBe('Raise Colossus 22.');
    expect(cardText(db, db.cards['grave-colossus+']!)).toBe('Raise Colossus 29.');
    let s = fight(['grave-colossus', 'grave-colossus']);
    s = play(s, 'T0');
    // (a Thrall and a Colossus fill the three slots; a big Thrall must not take the second Colossus's HP)
    thralls(s).find((u) => u.def === 'bone-thrall')!.maxHp = 40;
    s = play(s, 'T1');
    const colossi = thralls(s).filter((u) => u.def === 'grave-colossus');
    expect(colossi.map((u) => u.maxHp)).toEqual([44]);
    expect(thralls(s).find((u) => u.def === 'bone-thrall')!.maxHp).toBe(40);
    // (HP only: no Might)
    expect(colossi[0]!.statuses.might ?? 0).toBe(0);
  });

  const fullBoard = (): CombatState => {
    let s = fight(['raise-thrall', 'raise-thrall', 'grave-colossus'], ['squire']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    // three Thralls fill the slots: 3, 5 and a bigger one
    thralls(s)[2]!.maxHp = thralls(s)[2]!.hp = 9;
    expect(thralls(s)).toHaveLength(3);
    return s;
  };
  it('always brings the Colossus: played as it is, the weakest Thralls make way, released (no burst), and it takes half their HP', () => {
    let s = fullBoard();
    const before = foe(s).hp;
    const asIs = legalActions(db, s).find(
      (a) => a.type === 'play' && a.card === 'T2' && a.release === undefined,
    );
    s = applyAction(db, s, asIs!).state;
    expect(thralls(s).map((u) => [u.def, u.maxHp])).toEqual([
      ['bone-thrall', 9],
      ['grave-colossus', 22 + Math.floor((3 + 5) / 2)],
    ]);
    // (released, not killed: nothing burst at an enemy)
    expect(foe(s).hp).toBe(before);
  });
  it('lets the player choose which Thralls make way for the Colossus, and it takes half their HP (Robert 2026-11-08)', () => {
    let s = fullBoard();
    const [small, , big] = thralls(s);
    const sets = legalActions(db, s).flatMap((a) =>
      a.type === 'play' && a.card === 'T2' && a.release !== undefined
        ? [[a.release].flat().sort().join(',')]
        : [],
    );
    // (every pair of the three: two slots are needed)
    expect(sets).toHaveLength(3);
    s = applyAction(db, s, { type: 'play', card: 'T2', release: [small!.id, big!.id] }).state;
    expect(thralls(s).map((u) => [u.def, u.maxHp])).toEqual([
      ['bone-thrall', 5],
      ['grave-colossus', 22 + Math.floor((3 + 9) / 2)],
    ]);
  });
  it('never offers to release a Colossus for another', () => {
    let s = fight(['grave-colossus', 'raise-colossus'], ['squire'], 'necromancer:bonelord');
    s.sides.a.mana = 9;
    // (an empty board: the Colossus first, then two Thralls fill the other two of the Bonelord's four slots)
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    s = play(s, 'T0');
    addThrall(s, 4, 'B-a');
    addThrall(s, 6, 'B-b');
    const sets = legalActions(db, s).flatMap((a) =>
      a.type === 'play' && a.card === 'T1' && a.release !== undefined ? [[a.release].flat()] : [],
    );
    expect(sets).toEqual([['B-a', 'B-b']]);
  });
  it('lets the player grow the Colossus standing instead of releasing Thralls for another (Robert 2026-11-09, #700)', () => {
    let s = fight(['grave-colossus', 'raise-colossus'], ['squire'], 'necromancer:bonelord');
    s.sides.a.mana = 9;
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    s = play(s, 'T0');
    addThrall(s, 4, 'B-a');
    addThrall(s, 6, 'B-b');
    const colossus = thralls(s).find((u) => u.def === 'grave-colossus')!;
    const grows = legalActions(db, s).flatMap((a) =>
      a.type === 'play' && a.card === 'T1' && a.grow !== undefined ? [a.grow] : [],
    );
    expect(grows).toEqual([colossus.id]);
    s = applyAction(db, s, { type: 'play', card: 'T1', grow: colossus.id }).state;
    // (the Thralls stay; the Colossus takes the card's 14, HP only)
    expect(thralls(s).map((u) => [u.def, u.maxHp])).toEqual([
      ['grave-colossus', 22 + 14],
      ['bone-thrall', 4],
      ['bone-thrall', 6],
    ]);
    expect(thralls(s)[0]!.statuses.might ?? 0).toBe(0);
  });
  it('only offers to grow when companions could make way, and refuses a Thrall or a grow with a release', () => {
    // (one Colossus and a Thrall in three slots: nothing can make way, so it simply grows as it is, with no choice to make)
    let s = fight(['grave-colossus', 'raise-colossus']);
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    s = play(s, 'T0');
    addThrall(s, 4, 'B-a');
    expect(legalActions(db, s).some((a) => a.type === 'play' && a.card === 'T1' && a.grow)).toBe(
      false,
    );
    // (the Bonelord's board: a Thrall is not a Colossus, and a grow cannot come with a release)
    let t = fight(['grave-colossus', 'raise-colossus'], ['squire'], 'necromancer:bonelord');
    t.sides.a.units = t.sides.a.units.filter((u) => u.kind !== 'ally');
    t = play(t, 'T0');
    addThrall(t, 4, 'B-a');
    addThrall(t, 6, 'B-b');
    const colossus = thralls(t).find((u) => u.def === 'grave-colossus')!;
    expect(() => applyAction(db, t, { type: 'play', card: 'T1', grow: 'B-a' })).toThrow();
    expect(() =>
      applyAction(db, t, { type: 'play', card: 'T1', grow: colossus.id, release: ['B-a', 'B-b'] }),
    ).toThrow();
  });
});

describe('Raise Colossus, the uncommon (2026-11-07)', () => {
  it('raises a 14 HP Colossus and is consumed; upgraded 18', () => {
    expect(cardText(db, db.cards['raise-colossus']!)).toBe('Raise Colossus 14. Consume.');
    expect(cardText(db, db.cards['raise-colossus+']!)).toBe('Raise Colossus 18. Consume.');
    expect(db.cards['raise-colossus']).toMatchObject({
      rarity: 'uncommon',
      cost: 2,
      exhaust: true,
    });
    let s = fight(['raise-colossus']);
    s = play(s, 'T0');
    expect(thralls(s).find((u) => u.def === 'grave-colossus')?.maxHp).toBe(14);
    expect(s.sides.a.exhausted.map((c) => c.card)).toContain('raise-colossus');
  });
});

describe('Grave Debt (Robert 2026-11-08, #688)', () => {
  it('a companion that dies curses every enemy with half its max HP (#691), 3 times a turn at most; one released for a Colossus does not', () => {
    expect(db.cards['grave-debt']).toMatchObject({ rarity: 'rare', cost: 1, kind: 'power' });
    expect(db.cards['grave-debt+']?.cost).toBe(1);
    // (the Bonelord's four slots: Bone Rain gives up four Thralls of 12, 16, 8 and 3 max HP at once)
    let s = fight(['grave-debt', 'bone-rain'], ['squire', 'squire'], 'necromancer:bonelord');
    s.sides.a.units = s.sides.a.units.filter((u) => u.kind !== 'ally');
    addThrall(s, 12, 'B-a');
    addThrall(s, 16, 'B-b');
    addThrall(s, 8, 'B-c');
    addThrall(s, 3, 'B-d');
    s = play(s, 'T0');
    s = play(s, 'T1');
    // (6 + 8 + 4; the fourth death this turn curses no one)
    for (const u of s.sides.b.units.filter((x) => x.hp > 0)) expect(u.statuses.doom).toBe(18);
    // (upgraded, two thirds: 12 a death of 18)
    let up = fight(['grave-debt+', 'fen-offering'], ['squire']);
    up.sides.a.units = up.sides.a.units.filter((u) => u.kind !== 'ally');
    addThrall(up, 18, 'B-a');
    up = play(up, 'T0');
    up = play(up, 'T1', 'B-a');
    expect(foe(up).statuses.doom ?? 0).toBe(12);
    // (the same release with and without it: the trait's own Fate for consuming the card is the same either way)
    const released = (debt: boolean): number => {
      let t = fight([debt ? 'grave-debt' : 'strike', 'raise-colossus'], ['squire']);
      t.sides.a.units = t.sides.a.units.filter((u) => u.kind !== 'ally');
      addThrall(t, 10, 'B-a');
      addThrall(t, 10, 'B-b');
      addThrall(t, 10, 'B-c');
      if (debt) t = play(t, 'T0');
      t = applyAction(db, t, { type: 'play', card: 'T1', release: ['B-a', 'B-b'] }).state;
      return foe(t).statuses.doom ?? 0;
    };
    expect(released(true)).toBe(released(false));
  });
});

describe('the Necromancer cost pass (Robert 2026-11-08, #691)', () => {
  const text = (id: string) => cardText(db, db.cards[id]!);

  it('Bone Rain says the Thralls die and you gain the Barrier, for 2 Mana', () => {
    expect(text('bone-rain')).toBe(
      'Each of your Bone Thralls dies. For each one: you gain 9 Barrier and deal 9 damage to ALL enemies.',
    );
    expect(db.cards['bone-rain']?.cost).toBe(2);
  });

  it('Bonded Dead: 1 Mana a turn, paid by your healthiest companion (most max HP) losing 3 HP', () => {
    expect(text('bonded-dead')).toMatch(/your healthiest companion loses 3 HP/);
    let s = fight(['bonded-dead']);
    thralls(s)[0]!.hp = thralls(s)[0]!.maxHp = 80;
    s = play(s, 'T0');
    expect(hero(s).statuses.sapped ?? 0).toBe(0);
    const { state, events } = applyAction(db, s, { type: 'endTurn' });
    expect(state.sides.a.mana).toBe(state.sides.a.maxMana + 1);
    const paid = events.some(
      (e) =>
        e.type === 'damage' &&
        e.kind === 'direct' &&
        e.target === thralls(s)[0]!.id &&
        e.lost === 3,
    );
    expect(paid).toBe(true);
  });

  it('Spirit Walk: Ghostly 2 once 3 cards are consumed, and a card more next turn', () => {
    let s = fight(['ghostform', 'strike', 'strike', 'defend']);
    s = play(s, 'T0');
    expect(hero(s).statuses.ghostly).toBe(2);
    expect(s.sides.a.nextDraw).toBe(1);
    let few = fight(['ghostform', 'strike']);
    few = play(few, 'T0');
    expect(hero(few).statuses.ghostly ?? 0).toBe(0);
  });

  it('Call the Departed puts 2 Gravesouls in your hand and 1 in your draw pile', () => {
    let s = fight(['call-the-departed']);
    const pile = s.sides.a.draw.filter((c) => c.card === 'gravesoul').length;
    s = play(s, 'T0');
    expect(s.sides.a.hand.filter((c) => c.card === 'gravesoul')).toHaveLength(2);
    expect(s.sides.a.draw.filter((c) => c.card === 'gravesoul')).toHaveLength(pile + 1);
    expect(db.cards['call-the-departed+']).toMatchObject({ cost: 0, exhaust: true });
  });

  it('Common Grave costs you 2 HP, not Sapped; upgraded it costs nothing', () => {
    let s = fight(['common-grave']);
    const hp = hero(s).hp;
    s = play(s, 'T0', foe(s).id);
    expect(hero(s).hp).toBe(hp - 2);
    expect(hero(s).statuses.sapped ?? 0).toBe(0);
    expect(foe(s).statuses.sapped).toBe(2);
    let up = fight(['common-grave+']);
    up = play(up, 'T0', foe(up).id);
    expect(hero(up).hp).toBe(hp);
  });

  it('Whispers Beyond starts in your opening hand; upgraded the card it finds costs 1 less', () => {
    expect(db.cards['whispers-beyond']?.innate).toBe(true);
    expect(text('whispers-beyond+')).toMatch(/costs 1 less until played/);
    let s = fight(['whispers-beyond+']);
    s = play(s, 'T0');
    const before = new Set(s.sides.a.hand.map((c) => c.id));
    const { state } = applyAction(db, s, { type: 'endTurn' });
    // (the card the turn-start discover made: Fleeting, and new to the hand; draws are not Fleeting from it)
    const made = state.sides.a.hand.filter(
      (c) => !before.has(c.id) && c.ethereal && c.costMod !== undefined,
    );
    const cost = (id: string) => db.cards[id]!.cost;
    const found = state.sides.a.hand.find((c) => !before.has(c.id) && c.ethereal);
    expect(found, 'a card was discovered').toBeDefined();
    expect(costOf(db, state.sides.a, found!)).toBe(Math.max(0, cost(found!.card) - 1));
    expect(made.every((c) => c.costMod === -Math.min(1, cost(c.card)))).toBe(true);
  });

  it('Phylactery costs 2, is not Fleeting and draws 1 when played', () => {
    // (3 since #710: Mana every turn)
    expect(db.cards.phylactery).toMatchObject({ cost: 3 });
    expect(db.cards.phylactery?.ethereal ?? false).toBe(false);
    let s = fight(['phylactery']);
    const n = s.sides.a.hand.length;
    s = play(s, 'T0');
    expect(s.sides.a.hand.length).toBe(n);
  });
});

describe('Bonelord back to A (Robert 2026-11-08, #696)', () => {
  it('companions deal 3 more and gain 2 max HP at the start of each turn', () => {
    // (2 Marrow since #767, 3 before)
    let s = fight([], ['squire'], 'necromancer:bonelord');
    expect(hero(s).statuses.marrow).toBe(2);
    const t = thralls(s)[0]!;
    t.hp = t.maxHp = 100;
    for (const u of s.sides.b.units) u.intent = null;
    s = applyAction(db, s, { type: 'endTurn' }).state;
    expect(s.sides.a.units.find((u) => u.id === t.id)!.maxHp).toBe(102);
  });
});
