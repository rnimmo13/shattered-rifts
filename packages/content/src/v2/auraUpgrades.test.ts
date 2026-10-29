// Aura upgrades the Slay the Spire way (DECISIONS #396, docs/AURA_UPGRADES_REVIEW.md): an Aura's "+" raises its number, gains
// Opening hand, or eases its drawback; "1 less Mana" only where the effect is on/off or an engine. plus() never looks inside an
// Aura, so without a hand-written upgrade it falls back to the cost cut: that fallback has to be chosen, so it is listed here.

import { describe, expect, it } from 'vitest';
import { createCombat, type CardDef } from '@sr/combat';
import { COMBAT_DB as db } from './index';

/** Every Aura whose upgrade is 1 less Mana, on purpose. A new one goes here only when its effect cannot grow. */
const COST_CUT_AURAS = [
  // (the Knight's Ironclad list went with her rework, DECISIONS #415: her new Auras all have hand-written upgrades)
  // copies of Slay the Spire cards that get cheaper there (Spellblade, Necromancer, Shaman, Assassin)
  'ever-watchful',
  'grimoire-gale',
  'phylactery',
  // on/off, a Mana engine, or a card or machine every turn
  'dutch-courage',
  'rolling-thunder',
  'backup-core',
  'command-chip',
  'mass-production',
  'overclock-core',
  'scrapyard-king',
  'hunger-unbound',
  'hunting-grounds',
  'killing-spree',
  'red-frenzy',
  'wild-hunt',
  'attunement',
  'heart-of-the-rift',
  'hunters-eye',
  'the-long-memory',
];

const auras = (): CardDef[] =>
  Object.values(db.cards).filter(
    (c) => c.kind === 'power' && !c.id.endsWith('+') && !c.id.includes('~') && !c.id.includes('^'),
  );
const upOf = (id: string): CardDef => db.cards[`${id}+`]!;

describe('Aura upgrades', () => {
  it('only the listed Auras get cheaper when upgraded', () => {
    const cheaper = auras()
      .filter((c) => upOf(c.id).cost < c.cost)
      .map((c) => c.id)
      .sort();
    expect(cheaper).toEqual([...COST_CUT_AURAS].sort());
  });

  it('every other Aura changes what it does, not what it costs', () => {
    for (const c of auras()) {
      if (COST_CUT_AURAS.includes(c.id)) continue;
      const up = upOf(c.id);
      expect(up.cost, c.id).toBe(c.cost);
      const better =
        JSON.stringify(up.effects) !== JSON.stringify(c.effects) ||
        (up.innate && !c.innate) ||
        (!up.ethereal && c.ethereal) ||
        (up.retain && !c.retain);
      expect(better, `${c.id}+ improves on ${c.id}`).toBeTruthy();
    }
  });

  it('an Opening hand upgrade starts the fight in your hand', () => {
    for (const id of [
      'battle-rhythm',
      'shell-game',
      'legion',
      'patient-hunter',
      'perfected-motion',
      'hair-trigger',
      'hunters-call',
      'trail-of-blood',
      'long-game',
      'lineage',
    ]) {
      expect(db.cards[id]!.innate, `${id} itself is not Opening hand`).toBeFalsy();
      expect(upOf(id).innate, `${id}+ gains Opening hand`).toBe(true);
      const { state } = createCombat(db, {
        seed: `aura-up-${id}`,
        a: { hero: 'hunter', deck: [...Array<string>(20).fill('strike'), `${id}+`] },
        b: { enemies: ['squire'] },
      });
      expect(
        state.sides.a.hand.map((c) => c.card),
        id,
      ).toContain(`${id}+`);
    }
  });
});
