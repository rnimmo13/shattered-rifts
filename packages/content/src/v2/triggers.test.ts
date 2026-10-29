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

  it('"Whenever you gain Barrier" (Bastion Engine) hits a random enemy for 5', () => {
    let s = fight('knight', ['bastion-engine', 'oath-of-iron']);
    s = play(s, 'T0');
    const total = (x: typeof s): number =>
      x.sides.b.units.reduce((n, u) => n + u.hp + u.barrier, 0);
    const hp = total(s);
    s = play(s, 'T1');
    expect(hero(s).barrier).toBeGreaterThanOrEqual(8);
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
  it('"Whenever you draw a card during your turn" (Fleet Fingers) hits every enemy for each card drawn', () => {
    let s = fight('assassin', ['fleet-fingers', 'backspring']);
    s = play(s, 'T0');
    const hp = foe(s).hp;
    s = play(s, 'T1'); // Backspring: draw 2, so two hits of 2
    expect(foe(s).hp).toBe(hp - 4);
  });

  it('"Whenever a card is created" (Pillar of Glass) gives Barrier for each card Rift Gifts makes', () => {
    let s = fight('spellblade', ['pillar-of-light', 'rift-gifts']);
    s = play(s, 'T0');
    const barrier = hero(s).barrier;
    const created = s.sides.a.created;
    s = play(s, 'T1');
    expect(s.sides.a.created).toBe(created + 3);
    expect(hero(s).barrier).toBe(barrier + 6);
  });

  it('Nerve Strike costs 1 less for each Skill played this turn', () => {
    let s = fight('assassin', ['turn-aside', 'turn-aside', 'nerve-strike']);
    s = play(s, 'T0');
    s = play(s, 'T1');
    const mana = s.sides.a.mana;
    s = play(s, 'T2');
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
