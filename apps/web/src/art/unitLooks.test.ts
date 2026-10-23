import { describe, expect, it } from 'vitest';
import { COMBAT_DB } from '@sr/content/v2';
import { LOOKS } from './unitLooks';

const baseIds = Object.keys(COMBAT_DB.units).filter((id) => !id.endsWith('+'));

describe('every companion and enemy has its own look', () => {
  it('has a Look for every unit, and none for a unit that does not exist', () => {
    for (const id of baseIds) expect(LOOKS[id], id).toBeTruthy();
    for (const id of Object.keys(LOOKS)) expect(COMBAT_DB.units[id], id).toBeTruthy();
  });

  it('no two units share a Look', () => {
    const seen = new Map<string, string>();
    for (const [id, look] of Object.entries(LOOKS)) {
      const key = JSON.stringify(look);
      expect(seen.get(key), `${id} looks like ${seen.get(key)}`).toBeUndefined();
      seen.set(key, id);
    }
  });
});
