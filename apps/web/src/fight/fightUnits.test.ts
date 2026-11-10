import { expect, it } from 'vitest';
import { createCombat } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { fightUnits } from './fightUnits';

const units = (hero: string, deck: string[], enemies: string[]): Set<string> =>
  fightUnits(
    COMBAT_DB,
    createCombat(COMBAT_DB, { seed: 'fight-units', a: { hero, deck }, b: { enemies } }).state,
  );

it('a fight loads its enemies, what its cards summon and what its enemies summon, and nothing else', () => {
  const necro = units('necromancer', ['raise-thrall', 'grave-colossus'], ['squire']);
  expect(necro.has('squire')).toBe(true);
  expect(necro.has('bone-thrall')).toBe(true);
  expect(necro.has('grave-colossus')).toBe(true);
  // (another class's companions, and enemies not in this fight, are not fetched)
  expect(necro.has('dire-wolf')).toBe(false);
  expect(necro.has('vorthax')).toBe(false);
  // (a hero's own data: the Engineer's starting drone, with no cards at all)
  expect(units('engineer', [], ['squire']).has('drone')).toBe(true);
  // (an enemy that calls in another)
  expect(units('knight', [], ['seraphine']).has('gilded-halberdier')).toBe(true);
  // (a card that finds a Summon from the pool, Blueprint: every machine it could find is fetched, though no id is written on it)
  const blueprint = units('engineer', ['blueprint'], ['squire']);
  for (const u of ['patrol-drone', 'sentry-turret', 'scrap-golem', 'dreadnought'])
    expect(blueprint.has(u)).toBe(true);
  expect(blueprint.has('bone-thrall')).toBe(false);
  // (a plain fight is a handful of figures, not the whole catalogue)
  expect(units('knight', ['strike', 'defend'], ['squire']).size).toBeLessThan(10);
});
