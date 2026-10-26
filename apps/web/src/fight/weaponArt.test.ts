import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { WEAPON_LOOK, weaponFor } from './weaponArt';

const card = (id: string) => COMBAT_DB.cards[id]!;

describe('the weapon a hero strikes with', () => {
  it('KP fires the Old Twelve Gauge for gun and shell cards and anything that hits every enemy, and swings the hammer otherwise', () => {
    expect(weaponFor('drunkard', card('old-twelve-gauge'))).toBe('shotgun');
    expect(weaponFor('drunkard', card('buckshot-shell'))).toBe('shotgun');
    expect(weaponFor('drunkard', card('hammer-swing'))).toBe('hammer');
    expect(weaponFor('drunkard')).toBe('shotgun');
  });

  it('Valeria bashes with her shield when the damage grows with her Barrier, and cuts with her sword otherwise', () => {
    expect(weaponFor('knight', card('bulwark-blow'))).toBe('shield');
    expect(weaponFor('knight', card('dawn-smite'))).toBe('sword');
  });

  it('everyone else has one weapon, a hero the game does not know has none, and every weapon has a look', () => {
    expect(weaponFor('assassin', card('strike'))).toBe('throwing-knife');
    expect(weaponFor('nobody')).toBeNull();
    for (const h of [
      'knight',
      'engineer',
      'hunter',
      'trapper',
      'assassin',
      'totemist',
      'barbarian',
      'spellblade',
      'necromancer',
      'drunkard',
    ]) {
      const w = weaponFor(h);
      expect(w, h).not.toBeNull();
      expect(WEAPON_LOOK[w!], h).toBeDefined();
    }
  });
});
