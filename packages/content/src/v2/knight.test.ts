// The Knight rebuilt (docs/BASE_CLASS_REWORKS.md §4, DECISIONS #415): Guard leaves an attacker Open when her Barrier stops its hit
// completely, a Riposte spends that Opening for its bonus, and Thorns hurt whatever hits her. Her old Ironclad copy is archived in
// reviews/balance-baselines/2026-10-29-pre-identity-reworks/.

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
import { COMBAT_DB as db, RIFTWALKERS, pathSizes } from './index';

function fight(
  hand: string[],
  enemies: string[] = ['squire', 'squire'],
  deck: string[] = RIFTWALKERS.knight.starter,
): CombatState {
  const { state } = createCombat(db, {
    seed: 'knight-guard',
    a: { hero: 'knight', deck: [...deck, ...deck] },
    b: { enemies },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 200;
    u.statuses = {};
  }
  hero(s).barrier = 0;
  return s;
}
const hero = (s: CombatState): Unit => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foes = (s: CombatState): Unit[] => s.sides.b.units;
const foe = (s: CombatState, i = 0): Unit => s.sides.b.units[i]!;
const open = (u: Unit): number => u.statuses.opening ?? 0;
const play = (s: CombatState, id: string, target?: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find(
    (a) => a.type === 'play' && a.card === inst?.id && (!target || a.target === target),
  );
  expect(act, `${id} playable`).toBeTruthy();
  let r = applyAction(db, s, act!).state;
  for (let i = 0; i < 6 && r.pending; i++) r = applyAction(db, r, chooseAction(db, r)).state;
  return r;
};
/** every enemy means `move` at the hero, then the turn ends: the enemy turn runs and the Knight's next turn begins */
const enemyTurn = (s: CombatState, move = 'slash', only?: number): CombatState => {
  const h = hero(s);
  foes(s).forEach((u, i) => {
    u.intent =
      only === undefined || only === i ? { move, target: h.id } : { move: 'guard', target: null };
  });
  return applyAction(db, s, { type: 'endTurn' }).state;
};

describe('the Knight: Guard, Riposte and Thorns', () => {
  it('starts with 4 Strikes, 4 Defends, Sundering Blow and Briarplate; 80 HP; 6 Barrier from her trait', () => {
    expect(RIFTWALKERS.knight.starter).toEqual([
      ...Array<string>(4).fill('strike'),
      ...Array<string>(4).fill('defend'),
      'sundering-blow',
      'briarplate',
    ]);
    expect(RIFTWALKERS.knight.hero.maxHp).toBe(80);
    const { state } = createCombat(db, {
      seed: 'k',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['squire'] },
    });
    expect(hero(state).barrier).toBe(6);
    expect(hero(state).statuses.plating ?? 0).toBe(0);
    expect(RIFTWALKERS.knight.trait.openings).toBe(true);
  });

  it('has three build paths of at least 12 cards, and none of the old Ironclad engines', () => {
    expect(pathSizes('knight').every((n) => n >= 12)).toBe(true);
    for (const gone of [
      'unholy-pact',
      'rite-of-recall',
      'numbing-rite',
      'burn-it-all',
      'scar-over',
      'draw-blood',
      'blood-fire',
    ])
      expect(db.cards[gone], gone).toBeUndefined();
  });

  describe('Guard: an Opening', () => {
    it('comes when her Barrier stops an attack hit completely, and the trait adds 3 Barrier the first time each turn', () => {
      let s = fight([]);
      hero(s).barrier = 30;
      s = enemyTurn(s, 'slash', 0);
      expect(open(foe(s, 0))).toBe(1);
      expect(open(foe(s, 1))).toBe(0);
    });

    it('does not come when the hit gets through her Barrier at all', () => {
      let s = fight([]);
      hero(s).barrier = 5; // Slash 9: 4 gets through
      s = enemyTurn(s, 'slash', 0);
      expect(open(foe(s, 0))).toBe(0);
    });

    it('does not come from a hit Shielded cancels, a hit on a Ghostly Knight, or a hit her own Trap stops', () => {
      let s = fight([]);
      hero(s).barrier = 30;
      hero(s).statuses.shielded = 1;
      s = enemyTurn(s, 'slash', 0);
      expect(open(foe(s, 0))).toBe(0);
      let g = fight([]);
      hero(g).barrier = 30;
      hero(g).statuses.ghostly = 2;
      g = enemyTurn(g, 'slash', 0);
      expect(open(foe(g, 0))).toBe(0);
      let t = fight(['nyxaras-web']);
      hero(t).barrier = 30;
      t = play(t, 'nyxaras-web');
      t = enemyTurn(t, 'slash', 0);
      expect(open(foe(t, 0))).toBe(0);
    });

    it('is one per enemy: a three-hit attack fully stopped leaves one Opening, and the trait pays once a turn', () => {
      let s = fight([], ['patrol-unit', 'squire']);
      hero(s).barrier = 40;
      const h0 = hero(s).barrier;
      const before = applyAction(
        db,
        (() => {
          const c = clone(s);
          foe(c, 0).intent = { move: 'burst', target: hero(c).id };
          foe(c, 1).intent = { move: 'slash', target: hero(c).id };
          return c;
        })(),
        { type: 'endTurn' },
      );
      s = before.state;
      expect(open(foe(s, 0))).toBe(1);
      expect(open(foe(s, 1))).toBe(1);
      // (15 + 9 soaked from 40, +3 once from the trait; then her own turn began, and the rest fell away)
      const gained = before.events.filter(
        (e) => e.type === 'barrier' && e.target === hero(s).id && e.amount === 3,
      );
      expect(gained).toHaveLength(1);
      expect(h0).toBe(40);
    });

    it('a hit that a Faltering enemy weakens still counts: what is checked is the hit as it lands', () => {
      let s = fight([]);
      hero(s).barrier = 7; // Slash 9 x0.75 = 6
      foe(s, 0).statuses.faltering = 2;
      s = enemyTurn(s, 'slash', 0);
      expect(open(foe(s, 0))).toBe(1);
    });

    it('an attack on every unit counts too, when her Barrier stops it', () => {
      let s = fight([], ['templar-aldric']);
      hero(s).barrier = 30;
      s = enemyTurn(s, 'cleave');
      expect(open(foe(s))).toBe(1);
    });

    it('lasts through her next turn and goes at its end', () => {
      let s = fight([]);
      hero(s).barrier = 30;
      s = enemyTurn(s, 'slash', 0);
      expect(open(foe(s, 0))).toBe(1);
      // her turn: still Open; the turn ends without spending it, and it is gone (also while the next enemy turn runs)
      s = enemyTurn(s, 'guard');
      expect(open(foe(s, 0))).toBe(0);
    });
  });

  describe('Riposte', () => {
    const opened = (hand: string[]): CombatState => {
      const s = fight(hand);
      foe(s, 0).statuses.opening = 1;
      return s;
    };

    it('Sundering Blow: 9, +6 against an Open enemy, and the Opening is spent; 9 without one', () => {
      let s = opened(['sundering-blow', 'sundering-blow']);
      const hp = foe(s, 0).hp;
      s = play(s, 'sundering-blow', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(15);
      expect(open(foe(s, 0))).toBe(0);
      expect(foe(s, 0).statuses.exposed).toBe(1);
      const hp2 = foe(s, 1).hp;
      s = play(s, 'sundering-blow', foe(s, 1).id);
      expect(hp2 - foe(s, 1).hp).toBe(9);
    });

    it('an ordinary attack never spends an Opening; Steady Blade only reads it', () => {
      let s = opened(['strike', 'steady-blade']);
      s = play(s, 'strike', foe(s, 0).id);
      expect(open(foe(s, 0))).toBe(1);
      const hand = s.sides.a.hand.length;
      s = play(s, 'steady-blade', foe(s, 0).id);
      expect(open(foe(s, 0))).toBe(1);
      expect(s.sides.a.hand.length).toBe(hand - 1 + 1);
    });

    it('a Riposte that is not a bonus runs only against an Open target, and spends it: Iron Rejoinder', () => {
      let s = opened(['iron-rejoinder', 'iron-rejoinder']);
      s = play(s, 'iron-rejoinder', foe(s, 0).id);
      expect(hero(s).barrier).toBe(7);
      expect(open(foe(s, 0))).toBe(0);
      s = play(s, 'iron-rejoinder', foe(s, 0).id);
      expect(hero(s).barrier).toBe(7);
    });

    it('Masterstroke hits again only when it spends an Opening, and not if the first hit killed', () => {
      let s = opened(['masterstroke']);
      const hp = foe(s, 0).hp;
      s = play(s, 'masterstroke', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(40);
      let k = opened(['masterstroke']);
      foe(k, 0).hp = 15;
      k = play(k, 'masterstroke', foe(k, 0).id);
      expect(foe(k, 0)?.statuses.opening ?? 0).toBe(0);
      expect(k.sides.b.units).toHaveLength(1);
    });

    it('the card preview counts the bonus against an Open target, and agrees with what it deals', () => {
      const s = opened(['return-the-blow']);
      const id = s.sides.a.hand[0]!.id;
      expect(previewCardDamage(db, s, id, foe(s, 0).id).get(0)?.lo).toBe(12);
      expect(previewCardDamage(db, s, id, foe(s, 1).id).get(0)?.lo).toBe(7);
      const hp = foe(s, 0).hp;
      const after = play(s, 'return-the-blow', foe(s, 0).id);
      expect(hp - foe(after, 0).hp).toBe(12);
    });

    it('reads plainly on the card', () => {
      expect(cardText(db, db.cards['sundering-blow']!)).toBe(
        'Deal 9 damage. Riposte: +6 damage. Apply 1 Exposed.',
      );
      expect(cardText(db, db.cards['iron-rejoinder']!)).toBe(
        'Riposte: gain 7 Barrier. Deal 15 damage.',
      );
      expect(cardText(db, db.cards['draw-them-in']!)).toBe(
        'Gain 4 Barrier. The target is left Open.',
      );
      expect(cardText(db, db.cards['measured-guard']!)).toBe(
        'Gain 6 Barrier. The next time you earn an Opening: Draw 1 card.',
      );
    });
  });

  describe('cards that open an enemy, and what only an earned Opening pays', () => {
    it('Draw Them In opens an enemy that is not attacking; Bastion Engine answers only an Opening Guard earns', () => {
      let s = fight(['bastion-engine', 'draw-them-in']);
      s = play(s, 'bastion-engine');
      const hp = foe(s, 0).hp;
      s = play(s, 'draw-them-in', foe(s, 0).id);
      expect(open(foe(s, 0))).toBe(1);
      expect(foe(s, 0).hp).toBe(hp);
      hero(s).barrier = 30;
      foe(s, 0).statuses = {};
      s = enemyTurn(s, 'slash', 0);
      expect(open(foe(s, 0))).toBe(1);
      expect(hp - foe(s, 0).hp).toBe(8);
    });

    it("Iron Cadence: an earned Opening gives a Mana next turn (and 2 Barrier), once; Warlord's Oath's does not feed it", () => {
      let s = fight(['iron-cadence']);
      s = play(s, 'iron-cadence');
      hero(s).barrier = 40;
      s = enemyTurn(s, 'slash');
      expect(s.sides.a.mana).toBe(RIFTWALKERS.knight.hero.mana + 1);
      let w = fight(['iron-cadence', 'warlords-oath']);
      w = play(w, 'iron-cadence');
      w = play(w, 'warlords-oath');
      hero(w).barrier = 0;
      w = enemyTurn(w, 'guard');
      expect(open(foe(w, 0))).toBe(1); // the Oath opened the front enemy
      expect(w.sides.a.mana).toBe(RIFTWALKERS.knight.hero.mana);
    });

    it('Measured Guard draws on the next Opening earned, and only once', () => {
      let s = fight(['measured-guard']);
      s = play(s, 'measured-guard');
      expect(s.sides.a.powers.some((p) => p.card === 'measured-guard')).toBe(true);
      hero(s).barrier = 40;
      s = enemyTurn(s, 'slash');
      expect(s.sides.a.powers.some((p) => p.card === 'measured-guard')).toBe(false);
      expect(s.sides.a.hand.length).toBe(RIFTWALKERS.knight.hero.handSize + 1);
    });
  });

  describe('Thorns', () => {
    it('Briarplate hurts each attacker until the enemy turn is over, and does not open it by itself', () => {
      let s = fight(['briarplate']);
      s = play(s, 'briarplate');
      const hp = foe(s, 0).hp;
      s = enemyTurn(s, 'slash', 0); // 5 Barrier against 9: the hit gets through, the Thorns answer it
      expect(hp - foe(s, 0).hp).toBe(2);
      expect(open(foe(s, 0))).toBe(0);
      expect(hero(s).statuses.thorns ?? 0).toBe(0);
    });

    it('Thornwake opens the first attacker its Thorns strike each enemy turn, and only it', () => {
      let s = fight(['thornwake', 'spiked-pauldron']);
      s = play(s, 'thornwake');
      s = play(s, 'spiked-pauldron');
      hero(s).barrier = 0;
      s = enemyTurn(s, 'slash');
      expect(foes(s).map(open)).toEqual([1, 0]);
    });

    it('Thorns that kill the attacker end it cleanly, and nothing answers twice', () => {
      let s = fight(['wall-of-briars']);
      s = play(s, 'wall-of-briars');
      foe(s, 0).hp = 3;
      s = enemyTurn(s, 'slash', 0);
      expect(s.sides.b.units).toHaveLength(1);
      expect(s.winner).toBeNull();
    });

    it('Vengeful Strike and Briar Lash read the Thorns you have now', () => {
      let s = fight(['spiked-pauldron', 'vengeful-strike']);
      s = play(s, 'spiked-pauldron');
      const hp = foe(s, 0).hp;
      s = play(s, 'vengeful-strike', foe(s, 0).id);
      expect(hp - foe(s, 0).hp).toBe(18 + 2 * 3);
    });
  });

  it('in the Arena the other hero is the one left Open, and it is gone once her turn ends', () => {
    const { state } = createCombat(db, {
      seed: 'k-pvp',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
    });
    let s = clone(state);
    s = applyAction(db, s, { type: 'endTurn' }).state; // b's turn now
    const a = s.sides.a.units.find((u) => u.kind === 'hero')!;
    const b = s.sides.b.units.find((u) => u.kind === 'hero')!;
    a.barrier = 30;
    s.sides.b.hand = [{ id: 'X', card: 'strike' }];
    s.sides.b.mana = 3;
    s = applyAction(db, s, { type: 'play', card: 'X', target: a.id }).state;
    expect(s.sides.b.units.find((u) => u.kind === 'hero')!.statuses.opening).toBe(1);
    expect(b.id).toBeTruthy();
    s = applyAction(db, s, { type: 'endTurn' }).state; // a's turn: b is still Open
    expect(s.sides.b.units.find((u) => u.kind === 'hero')!.statuses.opening).toBe(1);
    s = applyAction(db, s, { type: 'endTurn' }).state; // a's turn ended: it is gone
    expect(s.sides.b.units.find((u) => u.kind === 'hero')!.statuses.opening ?? 0).toBe(0);
  });

  it('every Knight card upgrades into something better, and no upgrade is more than half again', () => {
    for (const c of Object.values(db.cards).filter(
      (x) => x.hero === 'knight' && !x.id.endsWith('+'),
    )) {
      const up = db.cards[c.upgrade ?? '']!;
      expect(up, c.id).toBeDefined();
      expect(JSON.stringify(up) !== JSON.stringify({ ...c, id: up.id, name: up.name }), c.id).toBe(
        true,
      );
    }
  });
});
