// The cleansing line (Neutral): Shrug It Off and Steady Nerves lessen every debuff on you; only Purging Light, the highest rarity of
// the line, dispels them completely.

import { describe, expect, it } from 'vitest';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  type CombatState,
  type Op,
} from '@sr/combat';
import { COMBAT_DB as db, RIFTWALKERS } from './index';

function fight(hand: string[]): CombatState {
  const { state } = createCombat(db, {
    seed: 'cleanse',
    a: { hero: 'knight', deck: [...RIFTWALKERS.knight.starter, ...RIFTWALKERS.knight.starter] },
    b: { enemies: ['squire'] },
  });
  const s = clone(state);
  s.sides.a.hand = hand.map((card, i) => ({ id: `T${i}`, card }));
  s.sides.a.mana = 9;
  const hero = s.sides.a.units.find((u) => u.kind === 'hero')!;
  hero.statuses = {
    exposed: 3,
    faltering: 2,
    seared: 4,
    brittle: 2,
    stunned: 1,
    doom: 10,
    might: 2,
  };
  return s;
}
const play = (s: CombatState, id: string): CombatState => {
  const act = legalActions(db, s).find((a) => a.type === 'play' && a.card === id);
  expect(act, `${id} playable`).toBeTruthy();
  return applyAction(db, s, act!).state;
};
const hero = (s: CombatState) => s.sides.a.units.find((u) => u.kind === 'hero')!;

describe('lessening debuffs', () => {
  it('Shrug It Off takes one stack, or a quarter of a deep one, off every debuff, and only debuffs', () => {
    const s = play(fight(['shrug-it-off']), 'T0');
    // (Doom 10: a quarter is 3, more than one)
    expect(hero(s).statuses).toMatchObject({
      exposed: 2,
      faltering: 1,
      seared: 3,
      brittle: 1,
      doom: 7,
      might: 2,
    });
    // (Stunned is a single stack, so one stack is all of it)
    expect(hero(s).statuses.stunned).toBeUndefined();
    expect(hero(s).barrier).toBeGreaterThanOrEqual(4);
  });

  it('Steady Nerves takes two or half, and a debuff that is not that deep simply goes', () => {
    const s = play(fight(['steady-nerves']), 'T0');
    expect(hero(s).statuses).toMatchObject({ exposed: 1, seared: 2, doom: 5, might: 2 });
    expect(hero(s).statuses.faltering).toBeUndefined();
    expect(hero(s).statuses.brittle).toBeUndefined();
  });

  it('only Purging Light dispels them completely, and keeps what is good', () => {
    const s = play(fight(['purging-light']), 'T0');
    for (const st of ['exposed', 'faltering', 'seared', 'brittle', 'stunned', 'doom'] as const)
      expect(hero(s).statuses[st], st).toBeUndefined();
    expect(hero(s).statuses.might).toBe(2);
  });

  it('a lowered Doom is a smaller threat, not a gone one', () => {
    const s = play(fight(['shrug-it-off']), 'T0');
    expect(hero(s).statuses.doom).toBe(7);
  });

  it('a deep pile of Doom is cut by a share, not a stack (DECISIONS #244)', () => {
    const deep = (card: string): number => {
      const s0 = fight([card]);
      hero(s0).statuses.doom = 60;
      return hero(play(s0, 'T0')).statuses.doom ?? 0;
    };
    expect(deep('shrug-it-off')).toBe(45);
    expect(deep('steady-nerves')).toBe(30);
    expect(deep('purging-light')).toBe(0);
    // the upgrades take one more stack, at the same share
    expect(deep('shrug-it-off+')).toBe(45);
  });
});

describe('the rule: no dispel below the highest rarity', () => {
  const dispels = (ops: readonly Op[]): boolean =>
    ops.some((o) => (o.op === 'cleanse' && o.all) || (o.op === 'power' && dispels(o.ops)));

  it('only a rare (or better) card can dispel; the common and uncommon ones only lessen', () => {
    for (const c of Object.values(db.cards)) {
      if (!dispels(c.effects)) continue;
      expect(['rare', 'legendary'], `${c.id} is ${c.rarity}`).toContain(c.rarity);
    }
    // and the line is there at each of the three rarities, all Neutral
    for (const [id, rarity] of [
      ['shrug-it-off', 'common'],
      ['steady-nerves', 'uncommon'],
      ['purging-light', 'rare'],
    ] as const) {
      expect(db.cards[id]?.rarity).toBe(rarity);
      expect(db.cards[id]?.hero).toBe('neutral');
    }
  });

  it('an upgrade makes a cleanse lessen one more, and a dispel stays a dispel', () => {
    expect(
      db.cards['shrug-it-off+']?.effects.some(
        (o) => o.op === 'cleanse' && o.amount === 2 && !o.all,
      ),
    ).toBe(true);
    expect(db.cards['purging-light+']?.effects.some((o) => o.op === 'cleanse' && o.all)).toBe(true);
  });
});
