// The Drunkard's guns (DECISIONS #681): every card that fires counts as a gun, shells included, so the cards that answer "whenever
// you play a gun" (The Twelve-Gauge Opera, Gun Oil) have something to answer.

import { describe, expect, it } from 'vitest';
import { applyAction, clone, createCombat, legalActions, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

const GUNS = [
  'old-twelve-gauge',
  'buckshot-shell',
  'birdshot',
  'slug-round',
  'shotgun-wedding',
  'sawn-off',
  'boomstick',
  'last-shell',
  'spray-and-pray',
  'shell-shock',
  'tin-can-alley',
];

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'guns',
    a: { hero: 'drunkard', deck: [...RIFTWALKERS.drunkard.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  for (const u of s.sides.a.units) u.barrier = 0;
  for (const u of s.sides.b.units) u.hp = u.maxHp = 300;
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const inst = s.sides.a.hand.find((c) => c.card === id);
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === inst?.id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('the Drunkard’s guns', () => {
  it('every card that fires is a gun (and its upgrade); melee with the gun is not', () => {
    for (const id of GUNS)
      for (const key of [id, `${id}+`].filter((k) => db.cards[k]))
        expect(db.cards[key]!.tags, key).toContain('gun');
    expect(db.cards['buckshot-shell']!.tags).toContain('shell');
    for (const id of ['pistol-whip', 'buttstroke', 'hammer-swing'])
      expect(db.cards[id]?.tags ?? [], id).not.toContain('gun');
  });

  it('a shell sets off Gun Oil (2 Barrier) and Bandolier (3)', () => {
    let s = play(play(fight(['gun-oil', 'bandolier', 'buckshot-shell']), 'gun-oil'), 'bandolier');
    s = play(s, 'buckshot-shell');
    expect(hero(s).barrier).toBe(2 + 3);
  });

  it('The Twelve-Gauge Opera answers a shell and a Slug Round', () => {
    let s = play(
      fight(['the-twelve-gauge-opera', 'buckshot-shell', 'slug-round']),
      'the-twelve-gauge-opera',
    );
    s = play(s, 'buckshot-shell');
    expect(hero(s).barrier).toBe(3);
    s = play(s, 'slug-round');
    expect(hero(s).barrier).toBe(6);
  });
});
