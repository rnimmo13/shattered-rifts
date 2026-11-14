import { CAMPAIGN_REALMS, COMBAT_DB, DRAGON_WARDENS } from '@sr/content/v2';
import { describe, expect, it } from 'vitest';
import { WARDEN_POSES, wardenMotion } from './wardenMotion';

const bosses = [
  ...new Set([...CAMPAIGN_REALMS.flatMap((realm) => realm.wardens), ...DRAGON_WARDENS, 'vorthax']),
];

describe('Warden battle choreography', () => {
  it.each(bosses)('uses multiple valid attack sequences for %s', (id) => {
    const brain = COMBAT_DB.units[id]?.brain;
    if (brain?.kind !== 'enemy') throw new Error(`Missing Warden ${id}`);
    const motions = Object.keys(brain.moves).map((move) => wardenMotion(id, move)!);
    expect(motions.every(Boolean)).toBe(true);
    expect(new Set(motions.map((motion) => motion.pose)).size).toBeGreaterThan(1);
    expect(new Set(motions.map((motion) => motion.effect)).size).toBeGreaterThan(1);
    for (const motion of motions) {
      const clip = WARDEN_POSES[motion.pose];
      expect(clip.hit).toBeGreaterThan(0);
      expect(clip.hit).toBeLessThan(clip.frames.length - 1);
      expect(clip.frames.at(-1)).toBe('ready');
    }
  });

  it('carries the dragon attacks into the finale and leaves regular enemies on their own clips', () => {
    expect(wardenMotion('nacreth-incarnation', 'fracture')).toEqual(
      wardenMotion('nacreth', 'fracture'),
    );
    expect(wardenMotion('pyrewing', 'breath')?.pose).toBe('channel');
    expect(wardenMotion('pyrewing', 'talon')?.pose).toBe('rake');
    expect(wardenMotion('gilded-page', 'poke')).toBeUndefined();
    expect(wardenMotion('vorthax', null)).toBeUndefined();
  });
});
