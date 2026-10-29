// The Trickster's costing pass (DECISIONS #386, docs/TRICKSTER_REVIEW.md): a cancel stops one hit, Cheap Shot and Stalk lean on
// the Trickster's build paths, and Traps that answer a summon or Barrier name "that enemy".

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  cardText,
  clone,
  createCombat,
  legalActions,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, canonicalCard } from './index';

/** One enemy at 200 HP with no statuses; the Trickster with `hand`, 9 Mana and no Barrier. */
function fight(hand: string[], enemy = 'squire'): CombatState {
  const { state } = createCombat(db, {
    seed: 'trickster-test',
    a: {
      hero: 'trickster',
      deck: [...RIFTWALKERS.trickster.starter, ...RIFTWALKERS.trickster.starter],
    },
    b: { enemies: [enemy] },
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
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const endTurn = (s: CombatState) => applyAction(db, s, { type: 'endTurn' }).state;
const foe = (s: CombatState) => s.sides.b.units[0]!;
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('the Trickster costing pass', () => {
  it('a cancel stops only the hit that sprang it: the rest of a three-hit move lands', () => {
    // Patrol Unit 44's Burst Fire: 5 damage, three times
    const taken = (hand: string[]): number => {
      let s = fight(hand, 'patrol-unit');
      foe(s).intent = { move: 'burst', target: hero(s).id };
      for (const c of hand) s = play(s, c);
      hero(s).barrier = 0;
      const before = hero(s).hp;
      return before - hero(endTurn(s)).hp;
    };
    expect(taken([])).toBe(15);
    expect(taken(['bait-and-switch'])).toBe(10);
  });

  it('Cheap Shot applies Exposed only while a Trap is set', () => {
    const bare = play(fight(['cheap-shot']), 'cheap-shot');
    expect(foe(bare).statuses.exposed ?? 0).toBe(0);
    expect(foe(bare).statuses.faltering).toBe(1);
    const trapped = play(play(fight(['trip-line', 'cheap-shot']), 'trip-line'), 'cheap-shot');
    expect(foe(trapped).statuses.exposed).toBe(1);
  });

  it('Stalk draws 2 extra cards next turn only when its target is Exposed', () => {
    const handNext = (hand: string[]): number => {
      let s = fight(hand);
      for (const c of hand) s = play(s, c);
      return endTurn(s).sides.a.hand.length;
    };
    expect(handNext(['mark-prey', 'stalk']) - handNext(['stalk'])).toBe(2);
  });

  it('a Trap that answers a summon or Barrier names "that enemy"; a cancel says "that hit"', () => {
    const text = (id: string) => cardText(db, db.cards[id]!);
    expect(text('false-floor')).toContain('to that enemy');
    expect(text('poison-pantry')).toContain('to that enemy');
    expect(text('false-floor')).not.toContain('attacker');
    expect(text('set-the-web')).toContain('to the attacker');
    expect(text('mirror-veil')).toContain('Cancel that hit.');
  });

  it("an HP-lost Trap (the Monk's Coiled Serpent) still names the attacker", () => {
    expect(cardText(db, db.cards['cornered-beast']!)).toContain('to the attacker');
  });

  it('Death Trap and Whisper Net are retired into Bait and Switch and False Floor', () => {
    expect(db.cards['death-trap']).toBeUndefined();
    expect(db.cards['whisper-net']).toBeUndefined();
    expect(canonicalCard('death-trap')).toBe('bait-and-switch');
    expect(canonicalCard('whisper-net')).toBe('false-floor');
  });

  it('Compound Fear still Consumes; Deep Pockets costs 2, the price of a +1 Mana Aura (DECISIONS #410)', () => {
    expect(db.cards['compound-fear']?.exhaust).toBe(true);
    expect(db.cards['deep-pockets']?.cost).toBe(2);
  });

  it('a hand-written upgrade replaces the automatic one (Veil Strike+ deals 9 and applies 1 Exposed)', () => {
    expect(cardText(db, db.cards['veil-strike+']!)).toBe('Deal 9 damage. Apply 1 Exposed.');
  });
});
