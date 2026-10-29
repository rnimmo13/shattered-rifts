// The Knight's pool expansion (DECISIONS #423): the Duelist (attacks that keep an Opening), the formation fighter (many enemies and
// their Openings), the patient defender (next turn's Mana and cards), offensive Thorns (shed them as damage) and the siege fighter
// (open and break enemies that will not attack), with the intent cards made mode-neutral. The earlier cards are frozen in
// reviews/balance-baselines/2026-10-29-knight-duelist-pass/.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  chooseAction,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatState,
  type Unit,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, rewardPool } from './index';

function fight(hand: string[], enemies: string[] = ['squire', 'squire']): CombatState {
  const deck = RIFTWALKERS.knight.starter;
  const { state } = createCombat(db, {
    seed: 'knight-duelist',
    a: { hero: 'knight', deck: [...deck, ...deck] },
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
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState, side: 'a' | 'b' = 'a'): Unit =>
  s.sides[side].units.find((u) => u.kind === 'hero')!;
const foes = (s: CombatState): Unit[] => s.sides.b.units;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const open = (u: Unit | undefined): number => u?.statuses.opening ?? 0;
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
/** every enemy means `move` at the hero (or only enemy `only`; the rest guard), then the turn ends and her next turn begins */
const enemyTurn = (s: CombatState, move = 'slash', only?: number): CombatState => {
  const h = hero(s);
  foes(s).forEach((u, i) => {
    u.intent =
      only === undefined || only === i ? { move, target: h.id } : { move: 'guard', target: null };
  });
  return applyAction(db, s, { type: 'endTurn' }).state;
};
const opened = (hand: string[], enemies?: string[], which: number[] = [0]): CombatState => {
  const s = fight(hand, enemies);
  for (const i of which) foe(s, i).statuses.opening = 1;
  return s;
};
/** an Arena game between two Knights, seat a to act, with the Arena's HP (packages/pvp setupFor: ARENA_HP_MULT 6 times 80, and
 * SECOND_PLAYER_HP 60 more for seat b) */
function arena(handA: string[], handB: string[] = []): CombatState {
  const deck = RIFTWALKERS.knight.starter;
  const { state } = createCombat(db, {
    seed: 'knight-arena',
    a: { hero: 'knight', deck: [...deck, ...deck], hp: 480, maxHp: 480 },
    b: { hero: 'knight', deck: [...deck, ...deck], hp: 540, maxHp: 540 },
  });
  const s = clone(state);
  s.sides.a.hand = handA.map((card, i) => ({ id: `A${i}`, card }));
  s.sides.b.hand = handB.map((card, i) => ({ id: `B${i}`, card }));
  hero(s, 'a').barrier = 0;
  hero(s, 'b').barrier = 0;
  return s;
}

describe('the Knight expansion (DECISIONS #423)', () => {
  it('87 reward-eligible Knight cards (89 with the two basics), 13 Auras, every new card in a build path', () => {
    const own = Object.values(db.cards).filter(
      (c) => c.hero === 'knight' && !c.id.endsWith('+') && !c.id.includes('~'),
    );
    expect(own).toHaveLength(89);
    expect(rewardPool('knight').filter((id) => db.cards[id]?.hero === 'knight')).toHaveLength(87);
    expect(own.filter((c) => c.kind === 'power')).toHaveLength(13);
  });

  describe('the Duelist: attacks that keep an Opening', () => {
    it('Testing Cut: 7, and 4 Barrier against an Open target; the Opening stays', () => {
      let s = opened(['testing-cut', 'testing-cut']);
      s = play(s, 'testing-cut', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(193);
      expect(hero(s).barrier).toBe(4);
      expect(open(foe(s, 0))).toBe(1);
      s = play(s, 'testing-cut', foe(s, 1).id);
      expect(hero(s).barrier).toBe(4);
      expect(db.cards['testing-cut+']!.effects[0]).toMatchObject({ op: 'damage', amount: 10 });
    });

    it('Measured Footwork: 5 Barrier and a card, 2 more Barrier while any enemy is Open', () => {
      let s = fight(['measured-footwork']);
      const n = s.sides.a.hand.length;
      s = play(s, 'measured-footwork');
      expect(hero(s).barrier).toBe(5);
      expect(s.sides.a.hand.length).toBe(n - 1 + 1);
      let t = opened(['measured-footwork'], undefined, [1]);
      t = play(t, 'measured-footwork');
      expect(hero(t).barrier).toBe(7);
    });

    it('Keep Your Distance: 2 Sapped through the Open target’s next turn, the Opening kept', () => {
      let s = opened(['keep-your-distance']);
      s = play(s, 'keep-your-distance', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(192);
      expect(foe(s, 0).statuses.sapped).toBe(2);
      expect(open(foe(s, 0))).toBe(1);
      s = enemyTurn(s, 'slash', 0);
      expect(foe(s, 0).statuses.sapped ?? 0).toBe(0);
      // (Slash 9 - 2 Sapped: 7 taken)
      expect(hero(s).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 7);
    });

    it('Patient Edge: 8, 12 against an Open target (one hit, the Opening kept), and it is Held', () => {
      let s = opened(['patient-edge', 'patient-edge']);
      const live = previewCardDamage(db, s, 'T0', foe(s, 0).id).get(0)?.lo;
      expect(live).toBe(12);
      s = play(s, 'patient-edge', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(188);
      expect(open(foe(s, 0))).toBe(1);
      s = play(s, 'patient-edge', foe(s, 1).id);
      expect(foe(s, 1).hp).toBe(192);
      expect(db.cards['patient-edge']!.retain).toBe(true);
    });

    it('Read the Duel: 5 Barrier and Foresee 2; a card more while an enemy is Open', () => {
      let s = fight(['read-the-duel']);
      const n = s.sides.a.hand.length;
      s = play(s, 'read-the-duel');
      expect(hero(s).barrier).toBe(5);
      expect(s.sides.a.hand.length).toBe(n - 1 + 1);
      let t = opened(['read-the-duel']);
      t = play(t, 'read-the-duel');
      expect(t.sides.a.hand.length).toBe(n - 1 + 2);
    });

    it('Closing Argument: 16, Riposte draws 2 and spends the Opening; a killing hit draws nothing', () => {
      let s = opened(['closing-argument']);
      const n = s.sides.a.hand.length;
      s = play(s, 'closing-argument', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(184);
      expect(open(foe(s, 0))).toBe(0);
      expect(s.sides.a.hand.length).toBe(n - 1 + 2);
      let k = opened(['closing-argument']);
      foe(k, 0).hp = 10;
      k = play(k, 'closing-argument', foe(k, 0).id);
      expect(k.sides.b.units).toHaveLength(1);
      expect(k.sides.a.hand.length).toBe(n - 1);
    });

    it("Knight's Composure counts an Opening at the end of her turn, before it wears off (an earned one, or one a card gave)", () => {
      // Draw Them In's Opening lasts only to the end of her turn: Composure still sees it
      let s = fight(['knights-composure', 'draw-them-in']);
      s = play(s, 'knights-composure');
      s = play(s, 'draw-them-in', foe(s, 0).id);
      const b = hero(s).barrier;
      // (4 + 6 Barrier against the first squire's Slash 9: nothing gets through)
      s = enemyTurn(s, 'slash', 0);
      expect(hero(s).hp).toBe(RIFTWALKERS.knight.hero.maxHp);
      expect(open(foe(s, 0))).toBe(1); // (an Opening earned by that block, for the next turn)
      // (the enemy turn ran against 4 + 6 Barrier: the squires' hits)
      let t = fight(['knights-composure']);
      t = play(t, 'knights-composure');
      t = enemyTurn(t, 'slash', 0);
      expect(hero(t).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 9);
      let u = opened(['knights-composure']);
      u = play(u, 'knights-composure');
      u = enemyTurn(u, 'slash', 0);
      expect(hero(u).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 3);
      expect(b).toBe(4);
      // spent before the turn ends: nothing
      let w = opened(['knights-composure', 'return-the-blow']);
      w = play(w, 'knights-composure');
      w = play(w, 'return-the-blow', foe(w, 0).id);
      w = enemyTurn(w, 'slash', 0);
      expect(hero(w).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 9);
    });

    it('Probing Thrust: free, 5, and 1 Exposed on an Open target without spending it', () => {
      let s = opened(['probing-thrust']);
      s.sides.a.mana = 0;
      s = play(s, 'probing-thrust', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(195);
      expect(foe(s, 0).statuses.exposed).toBe(1);
      expect(open(foe(s, 0))).toBe(1);
    });

    it('Keen Eye: 5 Barrier, 2 Exposed on an Open target', () => {
      let s = opened(['keen-eye', 'keen-eye']);
      s = play(s, 'keen-eye', foe(s, 0).id);
      s = play(s, 'keen-eye', foe(s, 1).id);
      expect(hero(s).barrier).toBe(10);
      expect(foe(s, 0).statuses.exposed).toBe(2);
      expect(foe(s, 1).statuses.exposed ?? 0).toBe(0);
    });

    it('Second Intention spends the Opening (Exploit the Gap answers once) and leaves the enemy Open again', () => {
      let s = opened(['exploit-the-gap', 'second-intention', 'perfect-counter']);
      s = play(s, 'exploit-the-gap');
      const n = s.sides.a.hand.length;
      s = play(s, 'second-intention', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(192);
      expect(open(foe(s, 0))).toBe(1);
      // 3 Barrier of its own, 3 from Exploit the Gap; a card drawn
      expect(hero(s).barrier).toBe(6);
      expect(s.sides.a.hand.length).toBe(n - 1 + 1);
      s = play(s, 'perfect-counter', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(192 - 20);
      expect(open(foe(s, 0))).toBe(0);
    });

    it('Measured Tempo pays for a hit on an Open enemy that keeps it, never for a Riposte', () => {
      let s = opened(['measured-tempo', 'testing-cut', 'return-the-blow']);
      s = play(s, 'measured-tempo');
      s = play(s, 'testing-cut', foe(s, 0).id);
      // 4 from Testing Cut, 2 from Tempo
      expect(hero(s).barrier).toBe(6);
      s = play(s, 'return-the-blow', foe(s, 0).id);
      expect(hero(s).barrier).toBe(6);
    });

    it('Seize the Moment: 2 Mana while an enemy is Open, a card, and it Consumes', () => {
      let s = opened(['seize-the-moment']);
      s.sides.a.mana = 0;
      s = play(s, 'seize-the-moment');
      expect(s.sides.a.mana).toBe(2);
      expect(s.sides.a.exhausted.map((c) => c.card)).toContain('seize-the-moment');
      let t = fight(['seize-the-moment']);
      t.sides.a.mana = 0;
      t = play(t, 'seize-the-moment');
      expect(t.sides.a.mana).toBe(0);
    });
  });

  describe('the formation fighter: many enemies and their Openings', () => {
    it('Answer Them All: 10 to all, +8 on each Open one, each spending only its own Opening', () => {
      let s = opened(['answer-them-all'], ['squire', 'squire', 'squire'], [0, 2]);
      s = play(s, 'answer-them-all');
      expect(foes(s).map((u) => 200 - u.hp)).toEqual([18, 10, 18]);
      expect(foes(s).map(open)).toEqual([0, 0, 0]);
    });

    it('Answer Them All: an Open enemy its hit kills still spends its Opening once; Exploit the Gap answers once per Opening', () => {
      let s = opened(
        ['exploit-the-gap', 'answer-them-all'],
        ['squire', 'squire', 'squire'],
        [0, 2],
      );
      s = play(s, 'exploit-the-gap');
      foe(s, 2).hp = 5;
      const n = s.sides.a.hand.length;
      s = play(s, 'answer-them-all');
      expect(s.sides.b.units).toHaveLength(2);
      expect(foes(s).map((u) => 200 - u.hp)).toEqual([18, 10]);
      expect(hero(s).barrier).toBe(6);
      expect(s.sides.a.hand.length).toBe(n - 1 + 2);
    });

    it("Answer Them All with Marshal's Eye: the front enemy opened by the first spend is kept, not spent again", () => {
      let s = opened(['marshals-eye', 'answer-them-all'], ['squire', 'squire'], [1]);
      s = play(s, 'marshals-eye');
      s = play(s, 'answer-them-all');
      expect(foes(s).map((u) => 200 - u.hp)).toEqual([10, 18]);
      expect(open(foe(s, 0))).toBe(1);
      expect(hero(s).barrier).toBe(2);
    });

    it('Answer Them All shows the range from a closed enemy to an Open one', () => {
      const s = opened(['answer-them-all'], ['squire', 'squire'], [1]);
      // (a card that hits every enemy shows the range across them)
      const live = previewCardDamage(db, s, 'T0', null).get(0);
      expect([live?.lo, live?.hi]).toEqual([10, 18]);
    });

    it('Ring of Steel, Sweep the Line and Pick Them Apart count the Open enemies and spend nothing', () => {
      let s = opened(
        ['ring-of-steel', 'sweep-the-line', 'pick-them-apart'],
        ['squire', 'squire', 'squire'],
        [0, 1],
      );
      s = play(s, 'ring-of-steel');
      expect(hero(s).barrier).toBe(5 + 6);
      s = play(s, 'sweep-the-line');
      expect(hero(s).barrier).toBe(11 + 3);
      s = play(s, 'pick-them-apart', foe(s, 2).id);
      expect(foes(s).map((u) => 200 - u.hp)).toEqual([6, 6, 6 + 13]);
      expect(foes(s).map(open)).toEqual([1, 1, 0]);
    });

    it('Cleaving Riposte splashes every enemy even when its hit kills the Open target', () => {
      let s = opened(['cleaving-riposte']);
      foe(s, 0).hp = 12;
      s = play(s, 'cleaving-riposte', foe(s, 0).id);
      expect(s.sides.b.units).toHaveLength(1);
      expect(foe(s, 0).hp).toBe(192);
    });

    it("Marshal's Eye: the first Opening spent each turn opens the front enemy, once", () => {
      let s = opened(['marshals-eye', 'return-the-blow', 'return-the-blow'], undefined, [1]);
      s = play(s, 'marshals-eye');
      s = play(s, 'return-the-blow', foe(s, 1).id);
      expect(foes(s).map(open)).toEqual([1, 0]);
      s = play(s, 'return-the-blow', foe(s, 0).id);
      expect(foes(s).map(open)).toEqual([0, 0]);
    });
  });

  describe('the patient defender: Mana and cards for the next turn', () => {
    it('Steady Breath, Night Watch, Steel Before Dawn and Bulwark of Dawn arrive next turn', () => {
      let s = fight(['steady-breath', 'night-watch', 'steel-before-dawn', 'bulwark-of-dawn']);
      for (const id of ['steady-breath', 'night-watch', 'steel-before-dawn', 'bulwark-of-dawn'])
        s = play(s, id);
      expect(hero(s).barrier).toBe(5 + 10);
      expect(hero(s).statuses.guarded).toBe(5 + 12);
      s = enemyTurn(s, 'guard');
      expect(s.sides.a.mana).toBe(RIFTWALKERS.knight.hero.mana + 1 + 1 + 2);
      expect(s.sides.a.hand.length).toBe(RIFTWALKERS.knight.hero.handSize + 2 + 1);
      expect(hero(s).barrier).toBe(17);
    });

    it('Prepared Ground pays next turn only after a turn ended on 8 or more Barrier', () => {
      let s = fight(['prepared-ground']);
      s = play(s, 'prepared-ground');
      hero(s).barrier = 8;
      s = enemyTurn(s, 'guard');
      expect(s.sides.a.mana).toBe(RIFTWALKERS.knight.hero.mana + 1);
      hero(s).barrier = 7;
      s = enemyTurn(s, 'guard');
      expect(s.sides.a.mana).toBe(RIFTWALKERS.knight.hero.mana);
    });

    it('Barbed Vigil: 7 Barrier, 6 Guarded and 4 Thorns for the enemy turn, Held', () => {
      let s = fight(['barbed-vigil']);
      s = play(s, 'barbed-vigil');
      expect(hero(s).barrier).toBe(7);
      expect(hero(s).statuses.guarded).toBe(6);
      expect(hero(s).statuses.thorns).toBe(4);
      expect(db.cards['barbed-vigil']!.retain).toBe(true);
      expect(db.cards['barbed-vigil+']!.effects.slice(0, 2)).toMatchObject([
        { op: 'barrier', amount: 9 },
        { op: 'status', status: 'guarded', amount: 8 },
      ]);
      s = enemyTurn(s, 'guard');
      expect(hero(s).statuses.thorns ?? 0).toBe(0);
      expect(hero(s).barrier).toBe(6);
    });
  });

  describe('offensive Thorns: kept for the enemy turn, or spent now', () => {
    it('Shed the Spines sheds up to 4 temporary Thorns from several sources for +3 each; the rest still expire cleanly', () => {
      let s = fight(['spiked-pauldron', 'briarplate', 'shed-the-spines']);
      s = play(s, 'spiked-pauldron');
      s = play(s, 'briarplate');
      expect(hero(s).statuses.thorns).toBe(5);
      expect(previewCardDamage(db, s, 'T2', foe(s, 0).id).get(1)?.lo).toBe(18);
      s = play(s, 'shed-the-spines', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(200 - 6 - 12);
      expect(hero(s).statuses.thorns).toBe(1);
      s = enemyTurn(s, 'guard');
      expect(hero(s).statuses.thorns ?? 0).toBe(0);
      expect(s.sides.a.temps.length + s.sides.b.temps.length).toBe(0);
    });

    it('Shed the Spines never takes lasting Thorns, nor more than she has; with none it is a 6', () => {
      let s = fight(['bristle', 'shed-the-spines', 'shed-the-spines']);
      hero(s).statuses.thorns = 2; // lasting Thorns, from nothing temporary
      s = play(s, 'shed-the-spines', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(194);
      expect(hero(s).statuses.thorns).toBe(2);
      s = play(s, 'bristle');
      s = play(s, 'shed-the-spines', foe(s, 1).id);
      expect(foe(s, 1).hp).toBe(200 - 6 - 12);
      expect(hero(s).statuses.thorns).toBe(2);
    });

    it("Crown of Thorns' Thorns are for the enemy turn: they are gone by her turn, so Shed the Spines finds none of them", () => {
      let s = fight(['crown-of-thorns', 'shed-the-spines']);
      s = play(s, 'crown-of-thorns');
      s = enemyTurn(s, 'guard');
      expect(hero(s).statuses.thorns ?? 0).toBe(0);
      s.sides.a.hand.push({ id: 'Z', card: 'shed-the-spines' });
      s.sides.a.mana = 3;
      foe(s, 0).barrier = 0;
      s = play(s, 'shed-the-spines', foe(s, 0).id);
      expect(foe(s, 0).hp).toBe(194);
    });

    it('Spine Volley sheds up to 3 for +3 to every enemy; Thornstorm Rush up to 6 for +4', () => {
      let s = fight(['wall-of-briars', 'spine-volley', 'thornstorm-rush']);
      s = play(s, 'wall-of-briars');
      s = play(s, 'spine-volley');
      expect(foes(s).map((u) => 200 - u.hp)).toEqual([13, 13]);
      expect(hero(s).statuses.thorns).toBe(5);
      s = play(s, 'thornstorm-rush', foe(s, 0).id);
      expect(200 - foe(s, 0).hp).toBe(13 + 12 + 20);
      expect(hero(s).statuses.thorns ?? 0).toBe(0);
    });

    it('Thorned Momentum: each Attack gives 1 Thorns for the enemy turn; Splinter Guard 2 + 1 an enemy; Bristle 4', () => {
      let s = fight(['thorned-momentum', 'strike', 'strike', 'splinter-guard', 'bristle']);
      s = play(s, 'thorned-momentum');
      s = play(s, 'strike', foe(s, 0).id);
      s = play(s, 'strike', foe(s, 0).id);
      expect(hero(s).statuses.thorns).toBe(2);
      s = play(s, 'splinter-guard');
      expect(hero(s).statuses.thorns).toBe(2 + 4);
      s = play(s, 'bristle');
      expect(hero(s).statuses.thorns).toBe(10);
    });
  });

  describe('the siege fighter: open and break enemies that will not attack', () => {
    it('Feinting Cut and Siege Line leave the target Open; Batter Down makes it Brittle', () => {
      let s = fight(['feinting-cut', 'siege-line', 'batter-down']);
      s = play(s, 'feinting-cut', foe(s, 0).id);
      expect(open(foe(s, 0))).toBe(1);
      s = play(s, 'siege-line', foe(s, 1).id);
      expect(open(foe(s, 1))).toBe(1);
      expect(foe(s, 1).statuses.exposed).toBe(2);
      s = play(s, 'batter-down', foe(s, 0).id);
      expect(foe(s, 0).statuses.brittle).toBe(2);
    });

    it('Sunder Armour and Breach the Wall take away the target’s Barrier first', () => {
      let s = fight(['sunder-armour', 'breach-the-wall']);
      foe(s, 0).barrier = 20;
      s = play(s, 'sunder-armour', foe(s, 0).id);
      expect(foe(s, 0).barrier).toBe(0);
      expect(foe(s, 0).hp).toBe(192);
      foe(s, 1).barrier = 20;
      s = play(s, 'breach-the-wall', foe(s, 1).id);
      expect(foe(s, 1).barrier).toBe(0);
      expect(open(foe(s, 1))).toBe(1);
    });

    it('Siege Doctrine: the first debuff each turn opens that enemy; only the first', () => {
      let s = fight(['siege-doctrine', 'rebuke', 'rebuke']);
      s = play(s, 'siege-doctrine');
      s = play(s, 'rebuke', foe(s, 1).id);
      s = play(s, 'rebuke', foe(s, 0).id);
      expect(foes(s).map(open)).toEqual([0, 1]);
    });
  });

  describe('the intent cards, mode-neutral (the same text in the campaign and the Arena)', () => {
    it("Giant's Stance: 1 Faltering, 2 on an Open target; Deflecting Blow: Riposte 7 Barrier; Sentinel's Patience: 2 an enemy", () => {
      let s = opened(['giants-stance', 'giants-stance', 'deflecting-blow', 'sentinels-patience']);
      s = play(s, 'giants-stance', foe(s, 0).id);
      s = play(s, 'giants-stance', foe(s, 1).id);
      expect(foes(s).map((u) => u.statuses.faltering)).toEqual([2, 1]);
      s = play(s, 'deflecting-blow', foe(s, 0).id);
      expect(hero(s).barrier).toBe(12 + 7);
      expect(open(foe(s, 0))).toBe(0);
      s = play(s, 'sentinels-patience');
      expect(hero(s).barrier).toBe(19 + 9);
      for (const id of ['giants-stance', 'deflecting-blow', 'sentinels-patience'])
        expect(JSON.stringify(db.cards[id]!.effects)).not.toMatch(/attacking|foesAttacking/);
    });

    it('no Knight card reads an enemy intent any more', () => {
      for (const c of Object.values(db.cards).filter((x) => x.hero === 'knight'))
        expect(JSON.stringify(c.effects), c.id).not.toMatch(/"attacking"|"foesAttacking"/);
    });
  });

  describe('the Arena: two Knights', () => {
    it('her cards aim at the other hero: Testing Cut keeps its Opening; Sentinel’s Patience counts one enemy', () => {
      let s = arena(['testing-cut', 'sentinels-patience']);
      s.sides.a.mana = 9;
      const b = hero(s, 'b');
      b.statuses.opening = 1;
      const hp = b.hp;
      s = play(s, 'testing-cut', b.id);
      expect(hp - hero(s, 'b').hp).toBe(7);
      expect(open(hero(s, 'b'))).toBe(1);
      expect(hero(s, 'a').barrier).toBe(4);
      s = play(s, 'sentinels-patience');
      expect(hero(s, 'a').barrier).toBe(4 + 7);
    });

    it('Answer Them All works against the lone hero, and Composure on either seat counts its Opening before it goes', () => {
      let s = arena(['knights-composure', 'feinting-cut', 'answer-them-all']);
      s.sides.a.mana = 9;
      const hp = hero(s, 'b').hp;
      s = play(s, 'knights-composure');
      s = play(s, 'feinting-cut', hero(s, 'b').id);
      s = play(s, 'answer-them-all');
      expect(hp - hero(s, 'b').hp).toBe(6 + 18);
      expect(open(hero(s, 'b'))).toBe(0);
      // seat b's turn: b's Knight opens a, Composure (seat b) counts it at the end of b's turn, then it is gone
      s = applyAction(db, s, { type: 'endTurn' }).state;
      s.sides.b.hand = [
        { id: 'B0', card: 'knights-composure' },
        { id: 'B1', card: 'feinting-cut' },
      ];
      s.sides.b.mana = 9;
      s = play(s, 'knights-composure');
      s = play(s, 'feinting-cut', hero(s, 'a').id);
      expect(open(hero(s, 'a'))).toBe(1);
      const bb = hero(s, 'b').barrier;
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(hero(s, 'b').barrier).toBe(bb + 6);
      expect(open(hero(s, 'a'))).toBe(0);
    });

    it('an Opening earned by seat b on seat a lasts through b’s next turn and goes at its end', () => {
      let s = arena([]);
      s.sides.a.hand = [{ id: 'X', card: 'strike' }];
      s.sides.a.mana = 3;
      hero(s, 'b').barrier = 30;
      s = applyAction(db, s, { type: 'play', card: 'X', target: hero(s, 'b').id }).state;
      expect(open(hero(s, 'a'))).toBe(1);
      s = applyAction(db, s, { type: 'endTurn' }).state; // b's turn: a is still Open
      expect(open(hero(s, 'a'))).toBe(1);
      s = applyAction(db, s, { type: 'endTurn' }).state;
      expect(open(hero(s, 'a'))).toBe(0);
    });

    it('the burst ceiling, played through legal actions: an Open, Exposed hero on a 5-Mana turn', () => {
      // Seize the Moment (+2), Probing Thrust+ (Exposed), Second Intention+ (spends, reopens), Masterstroke+ (spends), Perfect Counter+
      let s = arena([
        'seize-the-moment',
        'probing-thrust+',
        'second-intention+',
        'masterstroke+',
        'perfect-counter+',
      ]);
      s.sides.a.mana = 3;
      const b = hero(s, 'b');
      b.statuses.opening = 1;
      const hp = b.hp;
      s = play(s, 'seize-the-moment');
      expect(s.sides.a.mana).toBe(5);
      s = play(s, 'probing-thrust+', hero(s, 'b').id);
      s = play(s, 'second-intention+', hero(s, 'b').id);
      s = play(s, 'masterstroke+', hero(s, 'b').id);
      s = play(s, 'perfect-counter+', hero(s, 'b').id);
      expect(s.sides.a.mana).toBe(0);
      const dealt = hp - hero(s, 'b').hp;
      // far from the Arena's HP: no single turn ends a game
      expect(dealt).toBeLessThan(hp / 3);
      // Probing Thrust+ 7, then x1.5 for its Exposed: Second Intention+ 16, Masterstroke+ 39 + 39, Perfect
      // Counter+ (its Opening spent by Masterstroke) 12: 113 of seat b's 540
      expect(dealt).toBe(113);
    });
  });

  it('the new cards read plainly', () => {
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('shed-the-spines')).toBe(
      'Shed up to 4 of your temporary Thorns. Deal 6 (+3 per Thorns shed) damage.',
    );
    expect(text('answer-them-all')).toBe(
      'Deal 10 damage to ALL enemies. Riposte: +8 damage to each Open enemy.',
    );
    expect(text('knights-composure')).toBe(
      'At the end of your turn: If an enemy is Open: Gain 6 Barrier.',
    );
  });
});
