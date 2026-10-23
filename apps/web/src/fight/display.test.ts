import { describe, expect, it } from 'vitest';
import { applyAction, chooseAction, createCombat, type CombatState } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { reduceEvent, startingDisplay } from './display';

const ids = (cs: { id: string }[]) => cs.map((c) => c.id).sort();

function compare(shown: CombatState, real: CombatState, where: string): void {
  for (const side of ['a', 'b'] as const) {
    const a = shown.sides[side];
    const b = real.sides[side];
    expect(
      a.units.map((u) => [u.id, u.hp, u.maxHp, u.barrier, u.statuses, u.intent]),
      `${where} units ${side}`,
    ).toEqual(b.units.map((u) => [u.id, u.hp, u.maxHp, u.barrier, u.statuses, u.intent]));
    expect(ids(a.hand), `${where} hand ${side}`).toEqual(ids(b.hand));
    // a card whose effects are waiting on a choice is in limbo in the engine, but already shown as played
    const limbo = real.active === side ? real.pending?.finish?.id : undefined;
    expect(ids(a.discard).filter((id) => id !== limbo), `${where} discard ${side}`).toEqual(
      ids(b.discard),
    );
    expect(ids(a.exhausted), `${where} exhausted ${side}`).toEqual(ids(b.exhausted));
    expect(a.draw.length, `${where} draw ${side}`).toBe(b.draw.length);
    expect(
      a.snares.map((x) => x.id),
      `${where} snares ${side}`,
    ).toEqual(b.snares.map((x) => x.id));
    expect(a.mana, `${where} mana ${side}`).toBe(b.mana);
    expect(a.stars, `${where} stars ${side}`).toBe(b.stars);
    expect(
      a.runes.map((r) => r.rune),
      `${where} runes ${side}`,
    ).toEqual(b.runes.map((r) => r.rune));
    expect(
      a.powers.map((p) => p.card),
      `${where} powers ${side}`,
    ).toEqual(b.powers.map((p) => p.card));
  }
  expect(shown.winner).toEqual(real.winner);
}

describe('display reducer', () => {
  it('replaying every encounter event by event ends up exactly at the engine state (some at higher tiers)', () => {
    const heroes = Object.keys(RIFTWALKERS) as HeroId[];
    for (const [i, enc] of ENCOUNTERS.entries()) {
      const h = heroes[i % heroes.length] as HeroId;
      const start = createCombat(db, {
        seed: `disp-${enc.id}`,
        a: { hero: h, deck: RIFTWALKERS[h].starter },
        b: { enemies: enc.units, tier: i % 3 === 0 ? 3 : 1 },
      });
      let state = start.state;
      const shown = startingDisplay(state);
      for (const e of start.events) reduceEvent(db, shown, e);
      compare(shown, state, `${enc.id} start`);
      for (let n = 0; n < 200 && !state.winner; n++) {
        const r = applyAction(db, state, chooseAction(db, state));
        for (const e of r.events) reduceEvent(db, shown, e);
        compare(shown, r.state, `${enc.id} step ${n}`);
        state = r.state;
      }
    }
  });
});

describe('display reducer: potions', () => {
  it('drinking a potion removes it from the belt', () => {
    const start = createCombat(db, {
      seed: 'pot',
      a: {
        hero: 'maren',
        deck: RIFTWALKERS.maren.starter,
        potions: ['fire-flask', 'guard-draught'],
      },
      b: {
        enemies: ['squire-pair'].flatMap((id) => ENCOUNTERS.find((e) => e.id === id)?.units ?? []),
      },
    });
    const shown = startingDisplay(start.state);
    for (const e of start.events) reduceEvent(db, shown, e);
    expect(shown.sides.a.potions).toEqual(['fire-flask', 'guard-draught']);
    const r = applyAction(db, start.state, { type: 'potion', index: 1 });
    for (const e of r.events) reduceEvent(db, shown, e);
    compare(shown, r.state, 'after potion');
    expect(shown.sides.a.potions).toEqual(['fire-flask']);
  });
});
