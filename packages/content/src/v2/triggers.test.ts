// Rules tests for the generic pieces the baseline-matching cards need: Powers that react to gaining Barrier, losing your own HP,
// drawing and creating cards, and moving cards from the discard pile.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS, type HeroId } from './index';

function fight(hero: HeroId, hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: `trig-${hero}`,
    a: { hero, deck: [...RIFTWALKERS[hero].starter, ...RIFTWALKERS[hero].starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;
const foe = (s: CombatState) => s.sides.b.units[0]!;

describe('Powers that react to your own effects', () => {
  it('"Whenever you lose HP to your own cards" (Scar Tissue) pays Might, but not for enemy hits', () => {
    let s = fight('hunter', ['scar-tissue', 'reckless-blow']);
    s = play(s, 'T0');
    const might = hero(s).statuses.might ?? 0;
    const hp = hero(s).hp;
    s = play(s, 'T1');
    expect(hero(s).hp).toBeLessThan(hp);
    expect(hero(s).statuses.might).toBe(might + 1);
  });

  it('"Whenever you gain Barrier" hits a random enemy (a test Aura: Bastion Engine answers Openings now, DECISIONS #415)', () => {
    const tdb = {
      ...db,
      cards: {
        ...db.cards,
        'test-bastion': {
          id: 'test-bastion',
          name: 'Test Bastion',
          kind: 'power' as const,
          cost: 0,
          target: 'none' as const,
          effects: [
            {
              op: 'power' as const,
              when: 'barrier' as const,
              ops: [{ op: 'damage' as const, amount: 5, to: 'randomFoe' as const }],
            },
          ],
        },
      },
    };
    const { state } = createCombat(tdb, {
      seed: 'trig-barrier',
      a: { hero: 'knight', deck: RIFTWALKERS.knight.starter },
      b: { enemies: ['squire'] },
    });
    let s = clone(state);
    s.sides.a.hand = [
      { id: 'T0', card: 'test-bastion' },
      { id: 'T1', card: 'oath-of-iron' },
    ];
    s.sides.a.mana = 9;
    s = applyAction(tdb, s, { type: 'play', card: 'T0' }).state;
    const total = (x: typeof s): number =>
      x.sides.b.units.reduce((n, u) => n + u.hp + u.barrier, 0);
    const hp = total(s);
    s = applyAction(tdb, s, { type: 'play', card: 'T1' }).state;
    expect(hero(s).barrier).toBeGreaterThanOrEqual(6);
    expect(total(s)).toBe(hp - 5);
  });
});

describe('fetching cards back from the discard pile', () => {
  it('Rummage puts a random discarded Attack on top of the draw pile', () => {
    const s = fight('hunter', ['scavenge']);
    s.sides.a.discard = [{ id: 'D1', card: 'rend' }];
    const after = play(s, 'T0');
    expect(after.sides.a.draw[0]?.card).toBe('rend');
    expect(after.sides.a.discard.map((c) => c.card)).not.toContain('rend');
  });
});

describe('draw, created and Skills-played hooks', () => {
  it('"Whenever you draw a card during your turn" hits every enemy for each card drawn (a test Aura: Fleet Fingers went with the Silent copy)', () => {
    const tdb = {
      ...db,
      cards: {
        ...db.cards,
        'test-fingers': {
          id: 'test-fingers',
          name: 'Test Fingers',
          kind: 'power' as const,
          cost: 0,
          target: 'none' as const,
          effects: [
            {
              op: 'power' as const,
              when: 'drawMidTurn' as const,
              ops: [{ op: 'damage' as const, amount: 2, to: 'allFoes' as const }],
            },
          ],
        },
      },
    };
    let s = fight('assassin', ['test-fingers', 'backspring']);
    s = applyAction(tdb, s, { type: 'play', card: 'T0' }).state;
    const hp = foe(s).hp;
    s = applyAction(tdb, s, { type: 'play', card: 'T1' }).state; // Backspring: draw 2, so two hits of 2
    expect(foe(s).hp).toBe(hp - 4);
  });

  it('"Whenever a card is created" gives Barrier for each card made (test cards: Pillar of Glass and Rift Gifts went with the Regent copy)', () => {
    const tdb = {
      ...db,
      cards: {
        ...db.cards,
        'test-pillar': {
          id: 'test-pillar',
          name: 'Test Pillar',
          kind: 'power' as const,
          cost: 0,
          target: 'none' as const,
          effects: [
            {
              op: 'power' as const,
              when: 'created' as const,
              ops: [{ op: 'barrier' as const, amount: 2, to: 'self' as const }],
            },
          ],
        },
        'test-gifts': {
          id: 'test-gifts',
          name: 'Test Gifts',
          kind: 'skill' as const,
          cost: 0,
          target: 'none' as const,
          effects: [{ op: 'discover' as const, neutral: true, count: 3 }],
        },
      },
    };
    let s = fight('spellblade', ['test-pillar', 'test-gifts']);
    s = applyAction(tdb, s, { type: 'play', card: 'T0' }).state;
    const barrier = hero(s).barrier;
    const created = s.sides.a.created;
    s = applyAction(tdb, s, { type: 'play', card: 'T1' }).state;
    expect(s.sides.a.created).toBe(created + 3);
    expect(hero(s).barrier).toBe(barrier + 6);
  });

  it('a card can cost 1 less for each Skill played this turn (a test card: Nerve Strike went with the Silent copy)', () => {
    const tdb = {
      ...db,
      cards: {
        ...db.cards,
        'test-nerve': {
          id: 'test-nerve',
          name: 'Test Nerve',
          kind: 'attack' as const,
          cost: 3,
          target: 'foe' as const,
          cheaperPerSkill: 1,
          effects: [{ op: 'damage' as const, amount: 15, to: 'target' as const }],
        },
      },
    };
    let s = fight('assassin', ['turn-aside', 'turn-aside', 'test-nerve']);
    s = applyAction(tdb, s, { type: 'play', card: 'T0' }).state;
    s = applyAction(tdb, s, { type: 'play', card: 'T1' }).state;
    const mana = s.sides.a.mana;
    s = applyAction(tdb, s, { type: 'play', card: 'T2', target: foe(s).id }).state;
    expect(mana - s.sides.a.mana).toBe(1);
  });

  it('a fetch with a full hand sends the card back to the discard pile', () => {
    const s = fight('hunter', ['scavenge']);
    s.sides.a.hand.push(...Array.from({ length: 10 }, (_, i) => ({ id: `F${i}`, card: 'strike' })));
    s.sides.a.discard = [{ id: 'D1', card: 'rend' }];
    const after = play(s, 'T0');
    // Scavenge puts it on the draw pile (never blocked by a full hand)
    expect(after.sides.a.draw[0]?.card).toBe('rend');
  });
});

describe('counters', () => {
  it('count cards drawn and created over the fight', () => {
    let s = fight('knight', ['oath-of-iron']);
    const drawn = s.sides.a.drawn;
    s = play(s, 'T0'); // Oath of Iron: Barrier, draw 1
    expect(s.sides.a.drawn).toBe(drawn + 1);
  });
});
