import { expect, it } from 'vitest';
import { createCombat } from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { cleansePreview } from './cleansePreview';
it('shows exact current reductions, rounding and permanent Fracture on desktop/mobile notes', () => {
  const s = createCombat(COMBAT_DB, {
    seed: 'cleanse-preview',
    a: { hero: 'knight', deck: [] },
    b: { enemies: ['squire'] },
  }).state;
  s.sides.a.units.find((u) => u.kind === 'hero')!.statuses = { doom: 101, seared: 3, fracture: 9 };
  const before = JSON.stringify(s);
  expect(cleansePreview(COMBAT_DB.cards['shrug-it-off']!, s, 'a')).toBe(
    'Fracture 9 → 9 (cannot be cleansed); Bleed 3 → 2; Fate 101 → 75',
  );
  expect(cleansePreview(COMBAT_DB.cards['steady-nerves']!, s, 'a')).toContain('Fate 101 → 50');
  expect(cleansePreview(COMBAT_DB.cards['purging-light']!, s, 'a')).toContain('Fate 101 → 0');
  expect(JSON.stringify(s)).toBe(before);
});
