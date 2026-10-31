// Sylas, the Silent-shaped assassin (DECISIONS #368): the starter is the Silent's, his cards are one for each
// of the Silent's, and the cards that needed new engine pieces (Sly, Bleed that burns harder, knives that Hold or hit everyone,
// next-turn effects) do what their text says.

import { describe, expect, it } from 'vitest';
import {
  previewCardDamage,
  costOf,
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, canonicalCard } from './index';

function fight(hand: string[], foes = 2): CombatState {
  const deck = RIFTWALKERS.assassin.starter;
  const { state } = createCombat(db, {
    seed: 'assassin-test',
    a: { hero: 'assassin', deck: [...deck, ...deck] },
    b: { enemies: Array<string>(foes).fill('squire') },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.draw = Array.from({ length: 8 }, (_, i) => ({ id: `D${i}`, card: 'defend' }));
  s.sides.a.discard = [];
  s.sides.a.exhausted = [];
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
  }
  return s;
}
/** play the first card in hand with this id (at the first enemy, if it takes a target); choices are answered by the bot */
const play = (s: CombatState, id: string, foe = 0): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const target = s.sides.b.units[foe]?.id;
  const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === inst?.id);
  const act = acts.find((a) => a.type === 'play' && (!a.target || a.target === target)) ?? acts[0];
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
const foe = (s: CombatState, i = 0) => s.sides.b.units[i]!;
const foeHp = (s: CombatState, i = 0): number => foe(s, i).hp + foe(s, i).barrier;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;
const inHand = (s: CombatState, id: string): number =>
  s.sides.a.hand.filter((c) => c.card === id).length;

describe('Sylas is the Silent shape', () => {
  it('starts with four Strikes, two Defends, Hobbling Jab (Neutralize), Duck and Weave (Survivor), Fang and Claw and Pocket Blades, at 70 HP', () => {
    expect(RIFTWALKERS.assassin.starter).toEqual([
      ...Array<string>(4).fill('strike'),
      ...Array<string>(2).fill('defend'),
      'hobbling-jab',
      'duck-and-weave',
      'fang-and-claw',
      'pocket-blades',
    ]);
    expect(RIFTWALKERS.assassin.hero.maxHp).toBe(70);
    expect(RIFTWALKERS.assassin.trait.name).toBe('Hidden Blades');
  });

  it('has the Silent’s list less Garrote (DECISIONS #474): 20 commons, 34 uncommons and 25 rares, no Traps', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'assassin' && !c.id.endsWith('+') && c.source !== 'token',
    );
    const count = (r: string) => own.filter((c) => c.rarity === r).length;
    expect([count('basic'), count('common'), count('uncommon'), count('rare')]).toEqual([
      4, 20, 34, 25,
    ]);
    expect(own.filter((c) => c.kind === 'snare')).toEqual([]);
  });
});

describe('Bleed is the Silent’s Poison', () => {
  it('deals its stacks at the start of the enemy’s turn, then loses 1', () => {
    let s = play(fight(['open-vein']), 'open-vein');
    expect(foe(s).statuses.seared).toBe(5);
    s = endTurn(s);
    expect(foe(s).hp).toBe(195);
    expect(foe(s).statuses.seared).toBe(4);
  });

  it('Thin the Blood (Accelerant) makes it burn one more time each turn', () => {
    let s = fight(['thin-the-blood', 'open-vein']);
    s = play(play(s, 'thin-the-blood'), 'open-vein');
    s = endTurn(s);
    expect(foe(s).hp).toBe(200 - 5 - 4);
    expect(foe(s).statuses.seared).toBe(3);
  });

  it('Bloodburst (Outbreak) burns at once', () => {
    const s = play(fight(['bloodburst']), 'bloodburst');
    for (const u of s.sides.b.units) {
      expect(u.hp).toBe(191);
      expect(u.statuses.seared).toBe(8);
    }
  });

  it('Reopen the Wound (Bubble Bubble) only works on a bleeding enemy', () => {
    expect(
      foe(play(fight(['reopen-the-wound']), 'reopen-the-wound')).statuses.seared,
    ).toBeUndefined();
    let s = fight(['open-vein', 'reopen-the-wound']);
    s = play(play(s, 'open-vein'), 'reopen-the-wound');
    expect(foe(s).statuses.seared).toBe(14);
  });

  it('Serrated Edges (Envenom) adds Bleed when an Attack gets through', () => {
    let s = fight(['serrated-edges', 'quick-slash']);
    s = play(play(s, 'serrated-edges'), 'quick-slash');
    expect(foe(s).statuses.seared).toBe(1);
  });

  it('Red Mirage (Mirage) gives Barrier equal to the Bleed on every enemy', () => {
    let s = fight(['blood-mist', 'red-mirage']);
    s = play(play(s, 'blood-mist'), 'red-mirage');
    expect(hero(s).barrier).toBe(8);
  });
});

describe('Daggers (Sleeve Knives) are the Silent’s Shivs', () => {
  it('Knife Juggle (Blade Dance) adds three; Whetted Edge (Accuracy) makes each hit 4 harder', () => {
    let s = play(fight(['knife-juggle', 'whetted-edge']), 'knife-juggle');
    expect(inHand(s, 'sleeve-knife')).toBe(3);
    s = play(s, 'whetted-edge');
    const hp = foeHp(s);
    s = play(s, 'sleeve-knife');
    expect(hp - foeHp(s)).toBe(8);
  });

  it('Wide Arc (Fan of Knives) makes knives hit every enemy', () => {
    let s = play(fight(['wide-arc']), 'wide-arc');
    expect(inHand(s, 'sleeve-knife')).toBe(4);
    s = play(s, 'sleeve-knife');
    expect(foeHp(s, 0)).toBe(196);
    expect(foeHp(s, 1)).toBe(196);
  });

  it('Ghost Knives (Phantom Blades): the first knife each turn hits 9 harder, and knives Hold', () => {
    let s = fight(['ghost-knives', 'sleeve-knife', 'sleeve-knife', 'sleeve-knife']);
    s = play(s, 'ghost-knives');
    let hp = foeHp(s);
    s = play(s, 'sleeve-knife');
    expect(hp - foeHp(s)).toBe(13);
    hp = foeHp(s);
    s = play(s, 'sleeve-knife');
    expect(hp - foeHp(s)).toBe(4);
    s = endTurn(s);
    // the knife left over is still in hand, with the new one Hidden Blades brings
    expect(inHand(s, 'sleeve-knife')).toBe(2);
  });

  it('Recall the Blades (Knife Trap) plays every spent knife at the target, and they go back', () => {
    const s0 = fight(['recall-the-blades']);
    s0.sides.a.exhausted = [
      { id: 'K1', card: 'sleeve-knife' },
      { id: 'K2', card: 'sleeve-knife' },
      { id: 'K3', card: 'strike' },
    ];
    const s = play(s0, 'recall-the-blades');
    expect(foeHp(s)).toBe(192);
    expect(s.sides.a.exhausted.filter((c) => c.card === 'sleeve-knife')).toHaveLength(2);
  });

  it('Spare Blades (Up My Sleeve) gets 1 cheaper every time it is played', () => {
    let s = play(fight(['spare-blades']), 'spare-blades');
    const inst = s.sides.a.discard.find((c) => c.card === 'spare-blades')!;
    expect(inst.costDown).toBe(1);
    s.sides.a.hand.push(inst);
    s.sides.a.discard = s.sides.a.discard.filter((c) => c !== inst);
    const mana = s.sides.a.mana;
    s = play(s, 'spare-blades');
    expect(mana - s.sides.a.mana).toBe(1);
  });
});

describe('Premeditate (was Sly, DECISIONS #433) and discarding', () => {
  it('a Premeditate card a card discards comes back next turn on top of the hand, at 0 until played; one the end of the turn discards does not', () => {
    let s = fight(['duck-and-weave', 'cartwheel-cut']);
    s = play(s, 'duck-and-weave');
    // (not played now: no damage, and not in the discard pile either)
    expect(foeHp(s, 0)).toBe(200);
    expect(s.sides.a.discard.some((c) => c.card === 'cartwheel-cut')).toBe(false);
    expect(s.sides.a.premeditating?.map((c) => c.card)).toEqual(['cartwheel-cut']);
    s = endTurn(s);
    const back = s.sides.a.hand.find((c) => c.card === 'cartwheel-cut');
    expect(back?.premeditated).toBe(true);
    expect(costOf(db, s.sides.a, back!)).toBe(0);
    // (the regular hand is drawn as well: five, the Dagger Hidden Blades brings, and the card back)
    expect(s.sides.a.hand).toHaveLength(RIFTWALKERS.assassin.hero.handSize + 2);
    // it keeps its 0 until it is played, then it costs what it costs again
    s = endTurn(s);
    const still = [...s.sides.a.hand, ...s.sides.a.discard, ...s.sides.a.draw].find(
      (c) => c.id === back!.id,
    );
    expect(still?.premeditated).toBe(true);
    let t = fight(['duck-and-weave', 'cartwheel-cut']);
    t = endTurn(play(t, 'duck-and-weave'));
    const mana = t.sides.a.mana;
    t = play(t, 'cartwheel-cut');
    expect(t.sides.a.mana).toBe(mana);
    expect(foeHp(t, 0)).toBe(195);
    const played = t.sides.a.discard.find((c) => c.card === 'cartwheel-cut');
    expect(played?.premeditated).toBeUndefined();
    expect(costOf(db, t.sides.a, played!)).toBe(db.cards['cartwheel-cut']!.cost);
    // (the end-of-turn sweep is not a discard by a card)
    const s2 = endTurn(fight(['cartwheel-cut']));
    expect(s2.sides.a.hand.find((c) => c.card === 'cartwheel-cut')?.premeditated).toBeUndefined();
    expect(foe(s2).hp).toBe(200);
  });

  it('Palm Switch (Hand Trick) defers a card (see defer.test.ts); Grand Scheme (Master Planner) gives Skills Premeditate for good', () => {
    let p = play(fight(['grand-scheme', 'turn-aside']), 'grand-scheme');
    p = play(p, 'turn-aside');
    expect(p.sides.a.discard.find((c) => c.card === 'turn-aside')?.sly).toBe('fight');
  });

  it('a Premeditate Skill that a card discards comes back next turn at 0 (Slip the Blow)', () => {
    let s = play(fight(['duck-and-weave', 'slip-the-blow']), 'duck-and-weave');
    // (Slip the Blow was discarded by Duck and Weave: not played now, and it is not in the discard pile)
    expect(s.sides.a.premeditating?.map((c) => c.card)).toEqual(['slip-the-blow']);
    s = endTurn(s);
    const back = s.sides.a.hand.find((c) => c.card === 'slip-the-blow');
    expect(back?.premeditated).toBe(true);
    expect(costOf(db, s.sides.a, back!)).toBe(0);
  });
  it('All or Nothing (Calculated Gamble) discards the hand and draws as many', () => {
    const s = play(fight(['all-or-nothing', 'strike', 'strike', 'strike']), 'all-or-nothing');
    expect(s.sides.a.hand.map((c) => c.card)).toEqual(['defend', 'defend', 'defend']);
  });

  it('Steel Monsoon (Storm of Steel) makes a knife for every card discarded', () => {
    const s = play(fight(['steel-monsoon', 'strike', 'defend']), 'steel-monsoon');
    expect(inHand(s, 'sleeve-knife')).toBe(2);
  });

  it('Graveside Cut (Memento Mori) hits 4 harder for each card discarded this turn', () => {
    let s = fight(['flick-knife', 'graveside-cut', 'strike']);
    s.sides.a.draw = [{ id: 'D0', card: 'strike' }];
    s = play(s, 'flick-knife');
    expect(s.sides.a.discarded).toBe(1);
    s.sides.a.hand = [{ id: 'G', card: 'graveside-cut' }];
    const hp = foeHp(s);
    s = play(s, 'graveside-cut');
    expect(hp - foeHp(s)).toBe(13);
  });

  it('Practiced Hands (Expertise) draws cards that Hold this turn', () => {
    const s = endTurn(play(fight(['practiced-hands']), 'practiced-hands'));
    // two Held Defends, five drawn and the knife Hidden Blades brings
    expect(s.sides.a.hand).toHaveLength(8);
  });

  it('Bolt Hole (Escape Plan) gives Barrier only when it draws a Skill', () => {
    const s = play(fight(['bolt-hole']), 'bolt-hole');
    expect(hero(s).barrier).toBe(3);
    const s0 = fight(['bolt-hole']);
    s0.sides.a.draw = [{ id: 'D0', card: 'strike' }];
    expect(hero(play(s0, 'bolt-hole')).barrier).toBe(0);
  });
});

describe('the rest of the Silent’s tricks', () => {
  it('Rippling Cut (Echoing Slash) hits everyone again for each enemy it kills', () => {
    const s0 = fight(['rippling-cut']);
    foe(s0, 0).hp = 5;
    const s = play(s0, 'rippling-cut');
    expect(s.sides.b.units).toHaveLength(1);
    expect(foeHp(s, 0)).toBe(180);
  });

  // (no card applies Strangled since Garrote left the pool, DECISIONS #474; the rule stays in the engine)
  it('Strangled costs the enemy its stacks in HP for every card played', () => {
    let s = fight(['turn-aside', 'turn-aside']);
    foe(s).statuses.strangled = 2;
    s = play(play(s, 'turn-aside'), 'turn-aside');
    expect(foeHp(s)).toBe(196);
  });

  it('Garrote has left the pool: an old copy becomes Graveside Cut, keeping its upgrade', () => {
    expect(db.cards.garrote).toBeUndefined();
    expect(canonicalCard('garrote')).toBe('graveside-cut');
    expect(canonicalCard('garrote+')).toBe('graveside-cut+');
  });

  it('Stilled Time (Bullet Time) makes the hand free and stops drawing', () => {
    let s = play(fight(['stilled-time', 'stalkers-lunge', 'backspring']), 'stilled-time');
    const mana = s.sides.a.mana;
    s = play(play(s, 'stalkers-lunge'), 'backspring');
    expect(s.sides.a.mana).toBe(mana);
    expect(s.sides.a.hand).toHaveLength(0);
  });

  it('Recurring Dream (Nightmare) brings three copies of the chosen card next turn', () => {
    const s = endTurn(play(fight(['recurring-dream', 'dirty-hit']), 'recurring-dream'));
    expect(inHand(s, 'dirty-hit')).toBe(3);
  });

  it('Roll Away (Dodge and Roll) gives Barrier next turn; Smoke Veil (Blur) keeps it through the turn change', () => {
    const s = endTurn(play(fight(['roll-away']), 'roll-away'));
    expect(hero(s).barrier).toBe(4);
    const b0 = fight(['smoke-veil']);
    b0.sides.b.units = b0.sides.b.units.slice(0, 1);
    foe(b0).intent = null;
    const b = endTurn(play(b0, 'smoke-veil'));
    expect(hero(b).barrier).toBeGreaterThan(0);
  });

  it('Into the Shadows (Shadow Step): next turn your Attacks deal double', () => {
    let s = endTurn(play(fight(['into-the-shadows']), 'into-the-shadows'));
    s.sides.a.hand = [{ id: 'S', card: 'quick-slash' }];
    const hp = foeHp(s);
    s = play(s, 'quick-slash');
    expect(hp - foeHp(s)).toBe(12);
    s = endTurn(s);
    expect(hero(s).statuses.empowered).toBeUndefined();
  });

  it('Fleet Fingers (Speedster) ignores the draw that starts your turn', () => {
    let s = play(fight(['fleet-fingers', 'backspring']), 'fleet-fingers');
    s = play(s, 'backspring');
    expect(foe(s).hp).toBe(196);
    s = endTurn(s);
    // (five cards and a knife came at the start of the turn, and none of them hit)
    expect(foe(s).hp).toBe(196);
  });

  it('Final Bow (Grand Finale) only plays from an empty draw pile', () => {
    const s0 = fight(['final-bow']);
    expect(legalActions(db, s0).some((a) => a.type === 'play' && a.card === 'T0')).toBe(false);
    s0.sides.a.draw = [];
    expect(foeHp(play(s0, 'final-bow'))).toBe(140);
  });

  it('Clean Cut (Precise Cut) deals 2 less for each other card in hand', () => {
    const s = play(fight(['clean-cut', 'strike', 'strike']), 'clean-cut');
    expect(foeHp(s)).toBe(200 - 9);
  });

  it('Spring Attack (Pounce) makes the next Skill free', () => {
    let s = play(fight(['spring-attack', 'sweep-the-leg']), 'spring-attack');
    const mana = s.sides.a.mana;
    s = play(s, 'sweep-the-leg');
    expect(s.sides.a.mana).toBe(mana);
    expect(hero(s).statuses.freeskill).toBeUndefined();
  });

  it('Blood Scent (Tracking): Faltering enemies take 50% more from Attacks', () => {
    let s = fight(['blood-scent', 'hobbling-jab', 'quick-slash']);
    s = play(play(s, 'blood-scent'), 'hobbling-jab');
    const hp = foeHp(s);
    s = play(s, 'quick-slash');
    expect(hp - foeHp(s)).toBe(9);
  });

  it('Mantle of Night (Shadowmeld) doubles Barrier for the turn; Lay Bare (Expose) strips an enemy’s', () => {
    const s = play(play(fight(['mantle-of-night', 'turn-aside']), 'mantle-of-night'), 'turn-aside');
    expect(hero(s).barrier).toBe(8);
    const e0 = fight(['lay-bare']);
    foe(e0).barrier = 12;
    const e = play(e0, 'lay-bare');
    expect(foe(e).barrier).toBe(0);
    expect(foe(e).statuses.exposed).toBe(2);
  });

  it('Sapping Wound (Malaise) spends X on Sapped and Faltering', () => {
    const s0 = fight(['sapping-wound']);
    s0.sides.a.mana = 3;
    const s = play(s0, 'sapping-wound');
    expect(foe(s).statuses.sapped).toBe(3);
    expect(foe(s).statuses.faltering).toBe(3);
  });

  it('every card of his reads as something', () => {
    for (const c of Object.values(db.cards).filter((x) => x.hero === 'assassin'))
      expect(cardText(db, c).length, c.id).toBeGreaterThan(8);
    expect(cardText(db, db.cards['tossed-vials']!)).toBe(
      'Apply 3 Bleed to a random enemy 3 times.',
    );
  });

  describe('the number on a Dagger is the damage it deals (DECISIONS #479)', () => {
    const shown = (s: CombatState) => {
      const inst = s.sides.a.hand.find((c) => c.card === 'sleeve-knife')!;
      return previewCardDamage(db, s, inst.id, foe(s).id).get(0)!;
    };
    /** what the card says, and then what it really takes off the enemy */
    const check = (s: CombatState): { said: number; dealt: number; next: CombatState } => {
      const said = shown(s).lo;
      const before = foeHp(s);
      const next = play(s, 'sleeve-knife');
      return { said, dealt: before - foeHp(next), next };
    };
    const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;

    it('Honed counts on the first Dagger of the turn, and not on the next', () => {
      const s = fight(['sleeve-knife', 'sleeve-knife']);
      hero(s).statuses.honed = 9;
      const first = check(s);
      expect(first.said).toBe(13);
      expect(first.dealt).toBe(13);
      const second = check(first.next);
      expect(second.said).toBe(4);
      expect(second.dealt).toBe(4);
    });

    it('with Tracking against a Faltering enemy, and everything else on top', () => {
      const s = fight(['sleeve-knife']);
      hero(s).statuses.honed = 9;
      hero(s).statuses.tracking = 1;
      hero(s).statuses.might = 2;
      hero(s).statuses.edge = 1;
      foe(s).statuses.faltering = 1;
      foe(s).statuses.exposed = 1;
      // (4 + 1 Edge + 9 Honed + 2 Might = 16; Exposed 24; Tracking 36)
      expect(shown(s).how).toEqual([
        '4',
        '+1 Edge = 5',
        '+9 Honed = 14',
        '+2 Might = 16',
        'Exposed +50% = 24',
        'Tracking +50% = 36',
      ]);
      const r = check(s);
      expect(r.said).toBe(36);
      expect(r.dealt).toBe(36);
    });

    it('with several enemies it shows the steps of the highest number', () => {
      const s = fight(['sleeve-knife']);
      hero(s).statuses.tracking = 1;
      const extra = clone(foe(s));
      extra.id = 'extra';
      s.sides.b.units.push(extra);
      foe(s).statuses.faltering = 1;
      const inst = s.sides.a.hand[0]!;
      const l = previewCardDamage(db, s, inst.id).get(0)!;
      expect([l.lo, l.hi]).toEqual([4, 6]);
      expect(l.how).toEqual(['4', 'Tracking +50% = 6']);
    });

    it('Fanned shows every enemy, as it hits them all', () => {
      const s = fight(['sleeve-knife']);
      hero(s).statuses.fanned = 1;
      hero(s).statuses.tracking = 1;
      const extra = clone(foe(s));
      extra.id = 'extra';
      s.sides.b.units.push(extra);
      foe(s).statuses.faltering = 1;
      const l = previewCardDamage(db, s, s.sides.a.hand[0]!.id, extra.id).get(0)!;
      expect([l.lo, l.hi]).toEqual([4, 6]);
    });
  });

  it('Lay Bare does not mention Steadfast, and still takes it (DECISIONS #478)', () => {
    expect(cardText(db, db.cards['lay-bare']!)).toBe(
      'Remove all Barrier from the target. Apply 2 Exposed. Consume.',
    );
    const s = fight(['lay-bare']);
    foe(s).statuses.steadfast = 1;
    foe(s).barrier = 5;
    const after = play(s, 'lay-bare');
    expect(foe(after).barrier).toBe(0);
    expect(foe(after).statuses.steadfast).toBeUndefined();
    // (with the Steadfast gone first, the Exposed lands)
    expect(foe(after).statuses.exposed).toBe(2);
  });

  it('the Virulent status reads as Hemorrhage, and the card of that name as Red Tide (DECISIONS #472)', () => {
    expect(cardText(db, db.cards['thin-the-blood']!)).toBe('Gain 1 Hemorrhage.');
    expect(db.cards.hemorrhage!.name).toBe('Red Tide');
    expect(Object.values(db.cards).filter((c) => c.name === 'Hemorrhage')).toEqual([]);
  });
});
