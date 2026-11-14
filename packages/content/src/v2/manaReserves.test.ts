// The Mana Reserves (Robert, 2026-10-30, DECISIONS #452, #454): unspent Mana is not lost, it is kept as Reserves, up to the Max Reserves
// (3); cards spend the turn's Mana first and Reserves after it; some cards raise the Max Reserves. No other class keeps Mana.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  previewCardDamage,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(
  hero: 'knight' | 'assassin',
  hand: string[] = [],
  mode: 'pve' | 'pvp' = 'pve',
): CombatState {
  const deck = RIFTWALKERS[hero].starter;
  const { state } = createCombat(db, {
    seed: 'vow-test',
    a: { hero, deck: [...deck, ...deck] },
    b: mode === 'pvp' ? { hero: 'knight', deck } : { enemies: ['squire', 'squire'] },
  });
  const s = clone(state);
  for (const u of s.sides.b.units) {
    u.hp = u.maxHp = 500;
    u.statuses = {};
    u.intent = null;
  }
  if (hand.length) {
    s.sides.a.reserves = 0;
    s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
    s.sides.a.draw = Array.from({ length: 12 }, (_, i) => ({ id: `D${i}`, card: 'defend' }));
    s.sides.a.discard = [];
  }
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const acts = legalActions(db, s).filter((a) => a.type === 'play' && a.card === inst?.id);
  const act =
    acts.find((a) => a.type === 'play' && (!a.target || a.target === s.sides.b.units[0]!.id)) ??
    acts[0];
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const endTurn = (s: CombatState): CombatState => applyAction(db, s, { type: 'endTurn' }).state;
const hero = (s: CombatState) => s.sides.a.units[s.sides.a.units.length - 1]!;
const lost = (s: CombatState, i = 0): number => 500 - s.sides.b.units[i]!.hp;

describe('the Mana Reserves trait', () => {
  it('is the Knight’s trait: Max Reserves 3, 1 Reserve at the start (2 until DECISIONS #560), and no opening Barrier or Plating (DECISIONS #521)', () => {
    const t = RIFTWALKERS.knight.trait;
    expect(t.name).toBe('Mana Reserves');
    expect(t.maxReserves).toBe(3);
    const s = fight('knight');
    expect(s.sides.a.maxReserves).toBe(3);
    expect(s.sides.a.reserves).toBe(1);
    expect(hero(s).barrier).toBe(0);
    expect(hero(s).statuses.plating).toBeUndefined();
  });

  it('unspent Mana is kept as Reserves, and the next turn still gives the usual 3', () => {
    const s = endTurn(fight('knight'));
    expect(s.sides.a.reserves).toBe(3);
    expect(s.sides.a.mana).toBe(3);
  });

  it('only what is left over is kept, and no more than the Max Reserves', () => {
    const a = fight('knight');
    a.sides.a.mana = 1;
    a.sides.a.reserves = 0;
    expect(endTurn(a).sides.a.reserves).toBe(1);
    const b = fight('knight');
    b.sides.a.mana = 7;
    const sb = endTurn(b);
    expect(sb.sides.a.reserves).toBe(3);
    // (full: more unspent Mana is lost)
    expect(endTurn(sb).sides.a.reserves).toBe(3);
    const c = fight('knight');
    c.sides.a.reserves = 0;
    c.sides.a.mana = 0;
    expect(endTurn(c).sides.a.reserves).toBe(0);
  });

  it('cards spend the Mana of the turn first, and Reserves after it', () => {
    let s = fight('knight', ['hammer-fall', 'twin-cut', 'twin-cut']);
    s.sides.a.reserves = 3;
    s.sides.a.mana = 3;
    // (Hammer Fall costs 3: all from Mana, so the Reserves are untouched)
    s = play(s, 'hammer-fall');
    expect(s.sides.a.mana).toBe(0);
    expect(s.sides.a.reserves).toBe(3);
    // (no Mana left: the next card is paid from the Reserves)
    s = play(s, 'twin-cut');
    expect(s.sides.a.reserves).toBe(2);
    s = play(s, 'twin-cut');
    expect(s.sides.a.reserves).toBe(1);
  });

  it('a card costing more than the Mana of the turn can be paid with Reserves', () => {
    const s = fight('knight', ['hammer-fall']);
    s.sides.a.mana = 1;
    s.sides.a.reserves = 2;
    const next = play(s, 'hammer-fall');
    expect(next.sides.a.mana).toBe(0);
    expect(next.sides.a.reserves).toBe(0);
    // (not enough of both: it cannot be played)
    const poor = fight('knight', ['hammer-fall']);
    poor.sides.a.mana = 1;
    poor.sides.a.reserves = 1;
    expect(legalActions(db, poor).some((a) => a.type === 'play')).toBe(false);
  });

  it('an X card spends the Mana and all the Reserves', () => {
    let s = fight('knight', ['whirling-blade']);
    s.sides.a.mana = 3;
    s.sides.a.reserves = 3;
    s = play(s, 'whirling-blade');
    // (Whirling Blade: 5 damage X times to ALL enemies, X = 6)
    expect(lost(s)).toBe(5 * 6);
    expect(s.sides.a.mana).toBe(0);
    expect(s.sides.a.reserves).toBe(0);
  });

  it('other classes keep nothing', () => {
    const s = endTurn(fight('assassin'));
    expect(s.sides.a.reserves).toBe(0);
    expect(s.sides.a.maxReserves).toBe(0);
  });
});

describe('the Reserves cards', () => {
  it.each([
    ['set-your-shield', 1, 6, 3],
    ['set-your-shield+', 1, 8, 4],
    ['measured-strike', 2, 7, 5],
    ['measured-strike+', 2, 9, 6],
  ] as const)('%s checks its threshold after spending Reserves', (card, threshold, base, bonus) => {
    for (const mana of [0, 3]) {
      for (const reserves of [threshold - 1, threshold, threshold + 1]) {
        const s = fight('knight', [card]);
        s.sides.a.mana = mana;
        s.sides.a.reserves = reserves;
        if (mana + reserves < 1) continue;
        const remaining = reserves - (mana === 0 ? 1 : 0);
        const expected = base + (remaining >= threshold ? bonus : 0);
        const next = play(s, card);
        expect(card.startsWith('set-') ? hero(next).barrier : lost(next)).toBe(expected);
      }
    }
  });

  it.each(['oath-unbroken', 'oath-unbroken+', 'measured-conviction', 'measured-conviction+'])(
    '%s checks the banked end-turn total at its exact threshold',
    (card) => {
      const oath = card.startsWith('oath-');
      const threshold = oath ? 4 : 2;
      for (const final of [threshold - 1, threshold, threshold + 1]) {
        const s = play(fight('knight', [card]), card);
        s.sides.a.reserves = final - 1;
        s.sides.a.mana = 1;
        const result = endTurn(s);
        expect(result.sides.a.reserves).toBe(final);
        expect(hero(result).statuses.might ?? 0).toBe(final >= threshold ? (oath ? 2 : 1) : 0); // (Oath Unbroken: 2 Might since #769, 3 before)
      }
    },
  );
  it.each([0, 1, 3, 7, 23])(
    'Patient Wall base/upgraded reads all %i current Reserves independently per copy',
    (reserves) => {
      for (const mode of ['pve', 'pvp'] as const) {
        for (const [card, multiplier] of [
          ['patient-wall', 4],
          ['patient-wall+', 5],
        ] as const) {
          let s = fight('knight', [card, card], mode);
          s.sides.a.mana = 4;
          s = play(play(s, card), card);
          s.sides.a.reserves = reserves;
          s.sides.a.mana = 0;
          const result = applyAction(db, s, { type: 'endTurn' });
          const gains = result.events.flatMap((e) =>
            e.type === 'barrier' && e.target === hero(s).id ? [e.amount] : [],
          );
          expect(gains).toEqual([reserves, reserves * multiplier, reserves * multiplier]);
        }
      }
    },
  );

  it.each([false, true])(
    'Patient Wall applies Warded Heart before Brittle (brittle: %s), without boosting the trait',
    (brittle) => {
      const s = play(fight('knight', ['patient-wall+']), 'patient-wall+');
      s.sides.a.boons = ['warded-heart'];
      s.sides.a.reserves = 7;
      s.sides.a.mana = 0;
      if (brittle) hero(s).statuses.brittle = 1;
      const result = applyAction(db, s, { type: 'endTurn' });
      expect(
        result.events.flatMap((e) =>
          e.type === 'barrier' && e.target === hero(s).id ? [e.amount] : [],
        ),
      ).toEqual(brittle ? [5, 32] : [7, 43]);
    },
  );

  it.each([
    ['vow-kept', 1, 3, 5, Infinity],
    ['vow-kept+', 1, 4, 6, Infinity],
    // (the Reserve part in full to +35, +40 upgraded, and half after, rounded down: #769)
    ['vow-fulfilled', 3, 18, 7, 35],
    ['vow-fulfilled+', 3, 22, 8, 40],
  ] as const)(
    '%s preview and damage use Reserves left after paying the cost',
    (card, cost, base, multiplier, full) => {
      for (const mana of [0, 1, 3]) {
        for (const reserves of [3, 7, 23]) {
          const s = fight('knight', [card]);
          s.sides.a.reserves = reserves;
          s.sides.a.mana = mana;
          const part = multiplier * (reserves - Math.max(0, cost - mana));
          const expected = base + (part > full ? full + Math.floor((part - full) / 2) : part);
          const before = JSON.stringify(s);
          expect(previewCardDamage(db, s, 'T0', s.sides.b.units[0]!.id).get(0)?.lo).toBe(expected);
          expect(JSON.stringify(s)).toBe(before);
          expect(lost(play(s, card))).toBe(expected);
        }
      }
    },
  );

  it('end-turn Reserves gains affect later Auras in play order, with no stale snapshot', () => {
    let s = fight('knight', ['unyielding-line', 'patient-wall']);
    s = play(play(s, 'unyielding-line'), 'patient-wall');
    s.sides.a.reserves = 1;
    s.sides.a.mana = 0;
    hero(s).barrier = 10;
    const result = applyAction(db, s, { type: 'endTurn' });
    expect(result.state.sides.a.reserves).toBe(3);
    expect(result.events.some((e) => e.type === 'barrier' && e.amount === 12)).toBe(true);
  });
  it('Stand Fast: 5 Barrier and 2 Plating, and 2 more Max Reserves for this turn only, so more Mana is kept', () => {
    let s = play(fight('knight', ['stand-fast']), 'stand-fast');
    expect(hero(s).barrier).toBe(5);
    expect(hero(s).statuses.plating).toBe(2);
    expect(s.sides.a.mana).toBe(2);
    s.sides.a.mana = 5;
    s = endTurn(s);
    expect(s.sides.a.reserves).toBe(5);
    // (the extra limit is gone next turn, but nothing already kept is lost)
    s = endTurn(s);
    expect(s.sides.a.reserves).toBe(5);
  });

  it('Oath Unbroken raises the Max Reserves for good, and 4 or more Reserves at the end of the turn give 2 Might (#769; 3 before)', () => {
    let s = fight('knight', ['oath-unbroken']);
    s.sides.a.mana = 3;
    s = play(s, 'oath-unbroken');
    expect(s.sides.a.maxReserves).toBe(5);
    s.sides.a.reserves = 4;
    s = endTurn(s);
    expect(hero(s).statuses.might).toBe(2);
  });

  it('Measured Strike: 7, and 5 more with 2 or more Reserves', () => {
    const a = fight('knight', ['measured-strike']);
    expect(lost(play(a, 'measured-strike'))).toBe(7);
    const b = fight('knight', ['measured-strike']);
    b.sides.a.reserves = 2;
    expect(lost(play(b, 'measured-strike'))).toBe(12);
  });

  it('Vow Kept: 3, and 5 for every Reserve (the cost is paid with Mana first)', () => {
    const a = fight('knight', ['vow-kept']);
    a.sides.a.reserves = 3;
    expect(lost(play(a, 'vow-kept'))).toBe(3 + 5 * 3);
    // (no Mana: the cost takes a Reserve first)
    const b = fight('knight', ['vow-kept']);
    b.sides.a.mana = 0;
    b.sides.a.reserves = 3;
    expect(lost(play(b, 'vow-kept'))).toBe(3 + 5 * 2);
  });

  it('Vow Fulfilled: 18, and 7 for every Reserve', () => {
    const s = fight('knight', ['vow-fulfilled']);
    s.sides.a.reserves = 3;
    expect(lost(play(s, 'vow-fulfilled'))).toBe(18 + 7 * 3);
  });

  it('Vow Fulfilled: the Reserve part is in full to +35 (+40 upgraded) and half after, rounded down (#769)', () => {
    const at = (card: string, left: number, mana = 3): number => {
      const s = fight('knight', [card]);
      s.sides.a.mana = mana;
      // (what the 3 Mana does not pay comes out of the Reserves first)
      s.sides.a.reserves = left + (3 - mana);
      const after = play(s, card);
      expect(after.sides.a.reserves).toBe(left);
      return lost(after);
    };
    // (5 Reserves is +35 exactly; the 6th adds floor(7 / 2), ten add 35 + floor(35 / 2))
    expect(at('vow-fulfilled', 5)).toBe(18 + 35);
    expect(at('vow-fulfilled', 6)).toBe(18 + 35 + 3);
    expect(at('vow-fulfilled', 10)).toBe(18 + 35 + 17);
    // (upgraded: 5 Reserves is +40 exactly; the 6th adds 4, ten add 40 + 20)
    expect(at('vow-fulfilled+', 5)).toBe(22 + 40);
    expect(at('vow-fulfilled+', 6)).toBe(22 + 40 + 4);
    expect(at('vow-fulfilled+', 10)).toBe(22 + 40 + 20);
    // (it is the Reserves left after paying that count)
    expect(at('vow-fulfilled', 5, 0)).toBe(18 + 35);
    expect(at('vow-fulfilled', 6, 1)).toBe(18 + 35 + 3);
    expect(cardText(db, db.cards['vow-fulfilled']!)).toBe(
      'Deal 18 (+7 per Reserve, half as much past +35) damage.',
    );
    expect(cardText(db, db.cards['vow-fulfilled+']!)).toBe(
      'Deal 22 (+8 per Reserve, half as much past +40) damage.',
    );
  });

  it('Blood Oath: 3 HP for 3 Reserves, never past the Max Reserves', () => {
    let s = play(fight('knight', ['blood-oath']), 'blood-oath');
    expect(s.sides.a.reserves).toBe(3);
    expect(hero(s).hp).toBe(RIFTWALKERS.knight.hero.maxHp - 3);
    s = fight('knight', ['blood-oath']);
    s.sides.a.reserves = 2;
    s = play(s, 'blood-oath');
    expect(s.sides.a.reserves).toBe(3);
  });

  it('Patient Wall: 4 Barrier for every Reserve at the end of the turn (Mana just kept counts)', () => {
    let s = fight('knight', ['patient-wall']);
    s = play(s, 'patient-wall');
    // (2 Reserves set by hand, and the 1 Mana left over is kept first: 3 Reserves, 12 Barrier)
    s.sides.a.reserves = 2;
    s.sides.a.mana = 1;
    const res = applyAction(db, s, { type: 'endTurn' });
    expect(res.state.sides.a.reserves).toBe(3);
    const gains = res.events.filter((e) => e.type === 'barrier' && e.target === hero(s).id);
    expect(gains.some((e) => e.type === 'barrier' && e.amount === 12)).toBe(true);
  });

  it('Unyielding Line: with 10 or more Barrier at the end of the turn, gain 2 Reserves', () => {
    let s = fight('knight', ['unyielding-line']);
    s.sides.a.mana = 1;
    s = play(s, 'unyielding-line');
    hero(s).barrier = 10;
    s = endTurn(s);
    expect(s.sides.a.reserves).toBe(2);
    const t = fight('knight', ['unyielding-line']);
    const t2 = play(t, 'unyielding-line');
    hero(t2).barrier = 9;
    t2.sides.a.mana = 0;
    expect(endTurn(t2).sides.a.reserves).toBe(0);
  });

  it('Gilded Bulwark: while you hold 10 or more Barrier, each Attack hits a random enemy for 6 more', () => {
    let s = fight('knight', ['gilded-bulwark', 'twin-cut']);
    s = play(s, 'gilded-bulwark');
    hero(s).barrier = 10;
    s = play(s, 'twin-cut');
    // (Twin Cut: 5 twice, and 6 more from the Bulwark)
    expect(lost(s) + lost(s, 1)).toBe(5 * 2 + 6);
    const t = play(fight('knight', ['gilded-bulwark', 'twin-cut']), 'gilded-bulwark');
    hero(t).barrier = 9;
    const t2 = play(t, 'twin-cut');
    expect(lost(t2) + lost(t2, 1)).toBe(10);
  });

  it('Cast the Shield spends all your Barrier for 2 damage each', () => {
    const s0 = fight('knight', ['cast-the-shield']);
    hero(s0).barrier = 10;
    const s = play(s0, 'cast-the-shield');
    expect(lost(s)).toBe(20);
    expect(hero(s).barrier).toBe(0);
  });

  it('Hardened Scars: 3 Barrier whenever you lose HP to your own cards', () => {
    let s = fight('knight', ['hardened-scars', 'blood-oath']);
    s = play(s, 'hardened-scars');
    s = play(s, 'blood-oath');
    expect(hero(s).barrier).toBe(3);
  });

  it('Scarred Hide: the first time each turn you lose HP, to your own cards or to an enemy, you gain 3 Thorns (DECISIONS #788)', () => {
    let s = fight('knight', ['scarred-hide', 'blood-oath', 'draw-blood']);
    s = play(s, 'scarred-hide');
    s = play(s, 'blood-oath');
    expect(hero(s).statuses.thorns).toBe(3);
    // (once a turn: a second payment adds none)
    s = play(s, 'draw-blood');
    expect(hero(s).statuses.thorns).toBe(3);
    // (an enemy hit counts too)
    const t = play(fight('knight', ['scarred-hide']), 'scarred-hide');
    for (const u of t.sides.b.units) u.intent = { move: 'slash', target: hero(t).id };
    const res = applyAction(db, t, { type: 'endTurn' });
    expect(
      res.events.some((e) => e.type === 'status' && e.status === 'thorns' && e.amount === 3),
    ).toBe(true);
    // (the hit really cost HP)
    expect(
      res.events.some((e) => e.type === 'damage' && e.target === hero(t).id && e.lost > 0),
    ).toBe(true);
    // (a hit that Barrier soaks completely costs no HP: no Thorns)
    const soaked = play(fight('knight', ['scarred-hide']), 'scarred-hide');
    hero(soaked).barrier = 500;
    for (const u of soaked.sides.b.units) u.intent = { move: 'slash', target: hero(soaked).id };
    const none = applyAction(db, soaked, { type: 'endTurn' });
    expect(none.events.some((e) => e.type === 'status' && e.status === 'thorns')).toBe(false);
    expect(cardText(db, db.cards['scarred-hide']!)).toMatch(/lose HP.*3 Thorns/);
  });

  it('some Barrier cards split their Barrier with Plating (and have one more Plating on top)', () => {
    const s = play(fight('knight', ['oath-of-iron']), 'oath-of-iron');
    expect(hero(s).barrier).toBe(6);
    expect(hero(s).statuses.plating).toBe(2);
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('oath-of-iron')).toContain('Gain 6 Barrier. Gain 2 Plating.');
    expect(text('ember-ward')).toContain('Gain 8 Barrier. Gain 3 Plating.');
    expect(text('blood-plate')).toContain('Gain 12 Barrier. Gain 3 Plating.');
    expect(text('dawn-smite')).toContain('Gain 3 Barrier. Gain 2 Plating.');
  });

  it("Brace and Press, the Knight's second basic: 3 Barrier, 2 Plating and 1 Exposed", () => {
    const s = play(fight('knight', ['brace-and-press']), 'brace-and-press');
    expect(hero(s).barrier).toBe(3);
    expect(hero(s).statuses.plating).toBe(2);
    expect(s.sides.b.units[0]!.statuses.exposed).toBe(1);
    expect(db.cards['brace-and-press']!.rarity).toBe('basic');
    expect(RIFTWALKERS.knight.starter).toHaveLength(10);
  });

  it('the cards say it', () => {
    const text = (id: string): string => cardText(db, db.cards[id]!);
    expect(text('stand-fast')).toBe('Gain 5 Barrier. Gain 2 Plating. Max Reserves +2 this turn.');
    expect(text('blood-oath')).toBe(
      'Once on your turn across all copies: Lose 3 HP and gain 3 Reserves.',
    );
    expect(text('oath-unbroken')).toContain('Max Reserves +2 for the rest of the fight.');
    expect(text('unyielding-line')).toContain('Gain 2 Reserves.');
  });
});
