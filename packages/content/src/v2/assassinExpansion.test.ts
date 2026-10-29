// The Assassin's pool expansion (DECISIONS #424): precision spenders, leaving the knife in, selective extraction, fieldwork, shadow
// and timing, and hybrid bridges. The earlier cards are frozen in reviews/balance-baselines/2026-10-29-assassin-expansion/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool } from './index';

const NEW = [
  'measured-cut',
  'poised-strike',
  'mark-the-vein',
  'calculated-retreat',
  'steady-hand',
  'weigh-the-moment',
  'silent-massacre',
  'assassinate',
  'economy-of-motion',
  'patient-coil',
  'the-waiting-blade',
  'read-the-wound',
  'exacting-pull',
  'lodged-steel',
  'pinned',
  'barbed-anchor',
  'thousand-cuts',
  'steel-rain',
  'fan-of-blades',
  'reaping-arc',
  'lingering-steel',
  'steel-thicket',
  'cruel-precision',
  'quick-pull',
  'pry-loose',
  'sleight-of-steel',
  'bide-in-shadow',
  'melt-away',
  'feign-weakness',
  'choking-smoke',
  'set-the-stage',
  'cold-patience',
  'strike-from-shadow',
  'clean-extraction',
  'lie-in-wait',
  'recycled-steel',
];

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.assassin.starter;
  const { state } = createCombat(db, {
    seed: 'assassin-expansion',
    a: { hero: 'assassin', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
    u.barrier = 0;
  }
  hero(s).statuses = {};
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState, side: 'a' | 'b' = 'a'): Unit =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const foes = (s: CombatState): Unit[] => s.sides.b.units;
const knives = (u: Unit | undefined): number => u?.statuses.knives ?? 0;
const prep = (s: CombatState): number => hero(s).statuses.prep ?? 0;
const lost = (s: CombatState): number[] => foes(s).map((u) => u.maxHp - u.hp);
const setKnives = (s: CombatState, ...n: number[]): void =>
  n.forEach((k, i) => {
    if (k) foe(s, i).statuses.knives = k;
  });
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const side = s.active;
  const inst = s.sides[side].hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
/** every enemy means `move` at the hero (or only enemy `only`), then the turn ends and his next turn begins */
const enemyTurn = (s: CombatState, move = 'slash', only?: number): CombatState => {
  const h = hero(s);
  foes(s).forEach((u, i) => {
    u.intent =
      only === undefined || only === i ? { move, target: h.id } : { move: 'guard', target: null };
  });
  return applyAction(db, s, { type: 'endTurn' }).state;
};
const MAX = RIFTWALKERS.assassin.hero.maxHp;

describe('the Assassin expansion (DECISIONS #424)', () => {
  it('87 reward-eligible Assassin cards (91 with the four basics) and 12 Auras', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'assassin' && !c.id.endsWith('+') && !c.id.includes('~'),
    );
    expect(own).toHaveLength(91);
    expect(rewardPool('assassin').filter((id) => db.cards[id]?.hero === 'assassin')).toHaveLength(
      87,
    );
    expect(own.filter((c) => c.kind === 'power')).toHaveLength(12);
  });

  it('every new card has an upgrade that differs from it, and none reads an enemy intent', () => {
    for (const id of NEW) {
      const c = db.cards[id]!;
      const up = db.cards[c.upgrade ?? '']!;
      expect(up, id).toBeDefined();
      expect(cardText(db, up), id).not.toBe(cardText(db, c));
      expect(up.cost, id).toBeLessThanOrEqual(c.cost);
      expect(JSON.stringify(c.effects), id).not.toMatch(/"attacking"|"foesAttacking"/);
    }
  });

  describe('precision execution: partial spends, and reasons to keep Preparation', () => {
    it('Measured Cut spends one point for +5 and leaves the rest; with none it is a 7 (10 upgraded)', () => {
      let s = fight(['measured-cut', 'measured-cut', 'measured-cut+']);
      hero(s).statuses.prep = 2;
      s = play(s, 'measured-cut', foe(s).id);
      expect(lost(s)[0]).toBe(12);
      expect(prep(s)).toBe(1);
      s = play(s, 'measured-cut', foe(s).id);
      s = play(s, 'measured-cut+', foe(s).id);
      expect(lost(s)[0]).toBe(12 + 12 + 10);
      expect(prep(s)).toBe(0);
    });

    it('Poised Strike reads Preparation and keeps it', () => {
      let s = fight(['poised-strike', 'poised-strike+']);
      hero(s).statuses.prep = 3;
      s = play(s, 'poised-strike', foe(s).id);
      s = play(s, 'poised-strike+', foe(s, 1).id);
      expect(lost(s)).toEqual([24, 28]);
      expect(prep(s)).toBe(3);
    });

    it('Mark the Vein and Calculated Retreat turn one point into Exposed and Faltering, or Barrier', () => {
      let s = fight(['mark-the-vein', 'calculated-retreat', 'calculated-retreat+']);
      hero(s).statuses.prep = 2;
      s = play(s, 'mark-the-vein', foe(s).id);
      expect([foe(s).statuses.exposed, foe(s).statuses.faltering]).toEqual([1, 1]);
      expect(hero(s).barrier).toBe(6);
      s = play(s, 'calculated-retreat');
      expect(hero(s).barrier).toBe(6 + 12);
      expect(prep(s)).toBe(0);
      s = play(s, 'calculated-retreat+');
      expect(hero(s).barrier).toBe(18 + 9);
    });

    it('Steady Hand is free, Held, and gives a point; Weigh the Moment selects a card', () => {
      let s = fight(['steady-hand', 'weigh-the-moment']);
      s.sides.a.mana = 1;
      const n = s.sides.a.hand.length;
      s = play(s, 'steady-hand');
      expect(s.sides.a.mana).toBe(1);
      expect(prep(s)).toBe(1);
      expect(db.cards['steady-hand']!.retain).toBe(true);
      s = play(s, 'weigh-the-moment');
      expect(prep(s)).toBe(2);
      expect(hero(s).barrier).toBe(3 + 4);
      expect(s.sides.a.hand.length).toBe(n - 2 + 1);
    });

    it('Silent Massacre: 8 + 5 a point to every enemy', () => {
      let s = fight(['silent-massacre']);
      hero(s).statuses.prep = 3;
      s = play(s, 'silent-massacre');
      expect(lost(s)).toEqual([23, 23]);
      expect(prep(s)).toBe(0);
    });

    it('Assassinate: 12 + 6 a point; a kill gives 2 back, a hit that does not kill nothing', () => {
      let s = fight(['assassinate']);
      hero(s).statuses.prep = 3;
      s = play(s, 'assassinate', foe(s).id);
      expect(lost(s)[0]).toBe(30);
      expect(prep(s)).toBe(0);
      let k = fight(['assassinate']);
      hero(k).statuses.prep = 3;
      foe(k).hp = 20;
      k = play(k, 'assassinate', foe(k).id);
      expect(k.sides.b.units).toHaveLength(1);
      expect(prep(k)).toBe(2);
    });

    it('Economy of Motion pays the first spend each turn that leaves some Preparation, once', () => {
      let s = fight(['economy-of-motion', 'measured-cut', 'measured-cut']);
      s = play(s, 'economy-of-motion');
      hero(s).statuses.prep = 3;
      const n = s.sides.a.hand.length;
      s = play(s, 'measured-cut', foe(s).id);
      expect(hero(s).barrier).toBe(3);
      expect(s.sides.a.hand.length).toBe(n - 1 + 1);
      s = play(s, 'measured-cut', foe(s).id);
      expect(hero(s).barrier).toBe(3);
      // spending the last point pays nothing
      let t = fight(['economy-of-motion', 'measured-cut']);
      t = play(t, 'economy-of-motion');
      hero(t).statuses.prep = 1;
      t = play(t, 'measured-cut', foe(t).id);
      expect(hero(t).barrier).toBe(0);
    });

    it('Patient Coil: 2 Barrier a point held at the end of the turn', () => {
      let s = fight(['patient-coil']);
      s = play(s, 'patient-coil');
      hero(s).statuses.prep = 3;
      s = enemyTurn(s, 'slash', 0);
      expect(hero(s).hp).toBe(MAX - (9 - 6));
    });

    it('The Waiting Blade: a turn begun on 3 Preparation gives a card and 2 Barrier, no Mana; below 3 nothing', () => {
      let s = fight(['the-waiting-blade']);
      s = play(s, 'the-waiting-blade');
      hero(s).statuses.prep = 3;
      s = enemyTurn(s, 'guard');
      expect(s.sides.a.mana).toBe(RIFTWALKERS.assassin.hero.mana);
      expect(s.sides.a.hand.length).toBe(RIFTWALKERS.assassin.hero.handSize + 1);
      expect(hero(s).barrier).toBe(2);
      hero(s).statuses.prep = 2;
      s = enemyTurn(s, 'guard');
      expect(s.sides.a.hand.length).toBe(RIFTWALKERS.assassin.hero.handSize);
      expect(hero(s).barrier).toBe(0);
    });
  });

  describe('hybrid: knives read into Preparation, Preparation into pulls', () => {
    it('Read the Wound gives a point only against a knifed enemy, and pulls nothing', () => {
      let s = fight(['read-the-wound', 'read-the-wound']);
      setKnives(s, 1);
      s = play(s, 'read-the-wound', foe(s).id);
      expect(prep(s)).toBe(1);
      expect(knives(foe(s))).toBe(1);
      s = play(s, 'read-the-wound', foe(s, 1).id);
      expect(prep(s)).toBe(1);
    });

    it('Exacting Pull pulls one knife per point spent (up to 2), 8 each and Knife Work’s 3', () => {
      let s = fight(['exacting-pull', 'exacting-pull']);
      setKnives(s, 3, 3);
      hero(s).statuses.prep = 3;
      s = play(s, 'exacting-pull', foe(s).id);
      expect(lost(s)[0]).toBe(4 + 2 * (8 + 3));
      expect([knives(foe(s)), prep(s)]).toEqual([1, 1]);
      s = play(s, 'exacting-pull', foe(s, 1).id);
      expect(lost(s)[1]).toBe(4 + 11);
      expect([knives(foe(s, 1)), prep(s)]).toEqual([2, 0]);
    });
  });

  describe('leave the knife in', () => {
    it('Lodged Steel: Faltering on a knifed enemy; the knife stays', () => {
      let s = fight(['lodged-steel', 'lodged-steel']);
      setKnives(s, 1);
      s = play(s, 'lodged-steel', foe(s).id);
      s = play(s, 'lodged-steel', foe(s, 1).id);
      expect(foes(s).map((u) => u.statuses.faltering ?? 0)).toEqual([1, 0]);
      expect(knives(foe(s))).toBe(1);
    });

    it('Pinned: Sapped 2 a knife, through the enemy turn', () => {
      let s = fight(['pinned']);
      setKnives(s, 3);
      s = play(s, 'pinned', foe(s).id);
      expect(foe(s).statuses.sapped).toBe(6);
      expect(hero(s).barrier).toBe(5);
      s = enemyTurn(s, 'slash', 0);
      expect(hero(s).hp).toBe(MAX);
      expect(foe(s).statuses.sapped ?? 0).toBe(0);
    });

    it('Barbed Anchor embeds, then Faltering for every knife there (capped by 3)', () => {
      let s = fight(['barbed-anchor', 'barbed-anchor']);
      setKnives(s, 2);
      s = play(s, 'barbed-anchor', foe(s).id);
      expect([knives(foe(s)), foe(s).statuses.faltering]).toEqual([3, 3]);
      expect(prep(s)).toBe(1); // Knife Work: the first embed of the turn
      s = play(s, 'barbed-anchor', foe(s).id);
      expect([knives(foe(s)), foe(s).statuses.faltering]).toEqual([3, 6]);
    });

    it('Thousand Cuts hits once and once more per knife; the knives stay for a pull later', () => {
      let s = fight(['thousand-cuts', 'thousand-cuts']);
      setKnives(s, 3);
      s = play(s, 'thousand-cuts', foe(s).id);
      s = play(s, 'thousand-cuts', foe(s, 1).id);
      expect(lost(s)).toEqual([28, 7]);
      expect(knives(foe(s))).toBe(3);
    });

    it('Lingering Steel Saps each enemy by its knives at the start of his turn, through its own', () => {
      let s = fight(['lingering-steel']);
      s = play(s, 'lingering-steel');
      setKnives(s, 3, 1);
      s = enemyTurn(s, 'guard');
      expect(foes(s).map((u) => u.statuses.sapped ?? 0)).toEqual([3, 1]);
      hero(s).barrier = 0;
      const hp = hero(s).hp;
      s = enemyTurn(s, 'slash', 0);
      expect(hp - hero(s).hp).toBe(9 - 3);
    });

    it('Cruel Precision: 2 Barrier for a debuff on a knifed enemy only', () => {
      let s = fight(['cruel-precision', 'hobbling-jab', 'hobbling-jab']);
      s = play(s, 'cruel-precision');
      setKnives(s, 1);
      s = play(s, 'hobbling-jab', foe(s).id);
      s = play(s, 'hobbling-jab', foe(s, 1).id);
      expect(hero(s).barrier).toBe(2);
    });
  });

  describe('fieldwork: spread, then choose', () => {
    it('Steel Rain: 8 to all, +5 for every knife in each; nothing is pulled', () => {
      let s = fight(['steel-rain']);
      setKnives(s, 3);
      s = play(s, 'steel-rain');
      expect(lost(s)).toEqual([23, 8]);
      expect(knives(foe(s))).toBe(3);
    });

    it('Fan of Blades puts two knives into random enemies, draws a card, and Knife Work gives its point', () => {
      let s = fight(['fan-of-blades']);
      const n = s.sides.a.hand.length;
      s = play(s, 'fan-of-blades');
      expect(foes(s).reduce((k, u) => k + knives(u), 0)).toBe(2);
      expect(s.sides.a.hand.length).toBe(n - 1 + 1);
      expect([prep(s), hero(s).barrier]).toEqual([1, 3]);
    });

    it('Reaping Arc: 5 to all, and one knife from each for 4 (+3 Knife Work); the others stay', () => {
      let s = fight(['reaping-arc']);
      setKnives(s, 2, 1);
      s = play(s, 'reaping-arc');
      expect(lost(s)).toEqual([12, 12]);
      expect(foes(s).map(knives)).toEqual([1, 0]);
    });

    it('Steel Thicket: 1 Barrier a knife in all enemies at the end of his turn', () => {
      let s = fight(['steel-thicket']);
      s = play(s, 'steel-thicket');
      setKnives(s, 3, 2);
      s = enemyTurn(s, 'slash', 0);
      expect(hero(s).hp).toBe(MAX - 4);
    });
  });

  describe('selective extraction', () => {
    it('Quick Pull: free, 3 and one knife for 5 (+3)', () => {
      let s = fight(['quick-pull']);
      s.sides.a.mana = 0;
      setKnives(s, 2);
      s = play(s, 'quick-pull', foe(s).id);
      expect(lost(s)[0]).toBe(11);
      expect(knives(foe(s))).toBe(1);
    });

    it('Pry Loose leaves 2 Exposed for what comes next; Sleight of Steel draws 2 for a knife, nothing without one', () => {
      let s = fight(['pry-loose', 'sleight-of-steel', 'sleight-of-steel']);
      setKnives(s, 2, 1);
      s = play(s, 'pry-loose', foe(s).id);
      expect(lost(s)[0]).toBe(10);
      expect(foe(s).statuses.exposed).toBe(2);
      const n = s.sides.a.hand.length;
      s = play(s, 'sleight-of-steel', foe(s, 1).id);
      expect(s.sides.a.hand.length).toBe(n - 1 + 2);
      s = play(s, 'sleight-of-steel', foe(s, 1).id);
      expect(s.sides.a.hand.length).toBe(n - 2 + 2);
      expect(hero(s).barrier).toBe(10);
    });

    it('Clean Extraction draws for the first pull each turn only', () => {
      let s = fight(['clean-extraction', 'quick-pull', 'quick-pull']);
      s = play(s, 'clean-extraction');
      setKnives(s, 3);
      const n = s.sides.a.hand.length;
      s = play(s, 'quick-pull', foe(s).id);
      s = play(s, 'quick-pull', foe(s).id);
      expect(s.sides.a.hand.length).toBe(n - 2 + 1);
      expect(hero(s).barrier).toBe(1);
    });

    it('Recycled Steel: the first pull each turn sends one knife into a random enemy (and Knife Work’s point), once', () => {
      let s = fight(['recycled-steel', 'draw-steel']);
      s = play(s, 'recycled-steel');
      setKnives(s, 2);
      s = play(s, 'draw-steel', foe(s).id);
      expect(foes(s).reduce((k, u) => k + knives(u), 0)).toBe(1);
      expect([prep(s), hero(s).barrier]).toEqual([1, 3]);
    });
  });

  describe('shadow and timing', () => {
    it('Bide in Shadow, Set the Stage and Cold Patience prepare the next turn; they are Held', () => {
      let s = fight(['bide-in-shadow', 'set-the-stage', 'cold-patience']);
      s = play(s, 'bide-in-shadow');
      s = play(s, 'set-the-stage');
      s = play(s, 'cold-patience');
      expect([hero(s).statuses.guarded, prep(s)]).toEqual([14, 2]);
      s = enemyTurn(s, 'guard');
      expect(hero(s).barrier).toBe(14);
      expect(s.sides.a.mana).toBe(RIFTWALKERS.assassin.hero.mana + 1);
      expect(s.sides.a.hand.length).toBe(RIFTWALKERS.assassin.hero.handSize + 1 + 2);
      for (const id of ['bide-in-shadow', 'set-the-stage', 'cold-patience', 'strike-from-shadow'])
        expect(db.cards[id]!.retain, id).toBe(true);
    });

    it('Melt Away puts a card from the hand on top of the draw pile', () => {
      let s = fight(['melt-away', 'finishing-thrust']);
      s = play(s, 'melt-away');
      expect(hero(s).barrier).toBe(7);
      expect(s.sides.a.draw.some((c) => c.card === 'finishing-thrust')).toBe(true);
      expect(s.sides.a.hand.some((c) => c.card === 'finishing-thrust')).toBe(false);
    });

    it('Feign Weakness and Choking Smoke blunt the enemy turn', () => {
      let s = fight(['feign-weakness', 'choking-smoke']);
      s = play(s, 'feign-weakness', foe(s).id);
      expect([foe(s).statuses.sapped, prep(s), hero(s).barrier]).toEqual([2, 1, 5]);
      s = play(s, 'choking-smoke');
      expect(foes(s).map((u) => u.statuses.faltering)).toEqual([2, 2]);
    });

    it('Strike from Shadow: 16, 24 against a Faltering target', () => {
      let s = fight(['strike-from-shadow', 'strike-from-shadow']);
      foe(s).statuses.faltering = 1;
      s = play(s, 'strike-from-shadow', foe(s).id);
      s = play(s, 'strike-from-shadow', foe(s, 1).id);
      expect(lost(s)).toEqual([24, 16]);
    });

    it('Lie in Wait pays a turn with no Attack, never one with an Attack', () => {
      let s = fight(['lie-in-wait', 'strike']);
      s = play(s, 'lie-in-wait');
      s = enemyTurn(s, 'slash', 0);
      expect(hero(s).hp).toBe(MAX - 3);
      expect(prep(s)).toBe(1);
      s.sides.a.hand.push({ id: 'Z', card: 'strike' });
      s = play(s, 'strike', foe(s).id);
      const hp = hero(s).hp;
      hero(s).barrier = 0;
      s = enemyTurn(s, 'slash', 0);
      expect(hp - hero(s).hp).toBe(9);
    });
  });

  describe('the Arena: against another hero', () => {
    function arena(hand: string[]): CombatState {
      const { state } = createCombat(db, {
        seed: 'assassin-arena',
        a: { hero: 'assassin', deck: RIFTWALKERS.assassin.starter, hp: 480, maxHp: 480 },
        b: { hero: 'knight', deck: RIFTWALKERS.knight.starter, hp: 540, maxHp: 540 },
      });
      const s = clone(state);
      s.sides.a.hand = hand.map((card, i) => ({ id: `A${i}`, card }));
      s.sides.a.mana = 3;
      hero(s, 'b').barrier = 0;
      return s;
    }

    it('his knives sit in the other hero; Lingering Steel Saps it, Steel Rain and Thousand Cuts read them', () => {
      let s = arena(['lingering-steel', 'thousand-cuts']);
      expect(knives(hero(s, 'b'))).toBe(1); // Knife Work's opening knife
      s.sides.a.mana = 9;
      s = play(s, 'lingering-steel');
      hero(s, 'b').statuses.knives = 3;
      const hp = hero(s, 'b').hp;
      s = play(s, 'thousand-cuts', hero(s, 'b').id);
      expect(hp - hero(s, 'b').hp).toBe(28);
      s = applyAction(db, s, { type: 'endTurn' }).state;
      s = applyAction(db, s, { type: 'endTurn' }).state; // b passes; his turn starts
      expect(hero(s, 'b').statuses.sapped).toBe(3);
    });

    it('a planned burst through legal actions: 3 Preparation and 3 knives, one turn of 3 Mana', () => {
      // Exacting Pull (spend 2: two knives), Measured Cut (the last point), Quick Pull (the last knife)
      let s = arena(['exacting-pull+', 'measured-cut+', 'quick-pull+']);
      hero(s).statuses.prep = 3;
      hero(s, 'b').statuses.knives = 3;
      const hp = hero(s, 'b').hp;
      s = play(s, 'exacting-pull+', hero(s, 'b').id);
      s = play(s, 'measured-cut+', hero(s, 'b').id);
      s = play(s, 'quick-pull+', hero(s, 'b').id);
      // 7 + 2 x(8 + 3) = 29, 10 + 5 = 15, 5 + 5 + 3 = 13
      expect(hp - hero(s, 'b').hp).toBe(57);
      expect(s.sides.a.mana).toBe(1);
      expect([prep(s), knives(hero(s, 'b'))]).toEqual([0, 0]);
    });
  });
});
