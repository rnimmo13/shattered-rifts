import { describe, expect, it } from 'vitest';
import { COMBAT_DB as db } from '@sr/content/v2';
import { playAnywayHelps, scrapChoices } from './scrapChoices';

const names: Record<string, string> = { a: 'Patrol Drone (4 HP)', b: 'Patrol Drone (4 HP)', c: 'Micro Drone (3 HP)' };

describe('the no-room prompt', () => {
  it('has a button for each way to make room, one for companions that read the same', () => {
    const out = scrapChoices([['a'], ['b'], ['c']], (u) => names[u]!);
    expect(out.map((c) => c.label)).toEqual(['Scrap Patrol Drone (4 HP)', 'Scrap Micro Drone (3 HP)']);
    expect(out[0]!.set).toEqual(['a']);
  });
  it('names every companion of a set', () => {
    expect(scrapChoices([['a', 'c']], (u) => names[u]!)[0]!.label).toBe(
      'Scrap Patrol Drone (4 HP) and Micro Drone (3 HP)',
    );
  });
  it('does not offer to waste a card that only summons', () => {
    expect(playAnywayHelps(db.cards['build-bulwark-walker']!, 0)).toBe(false);
    // (something still comes of these)
    expect(playAnywayHelps(db.cards['drone-carrier']!, 1)).toBe(true);
    expect(playAnywayHelps(db.cards['titan-forge']!, 0)).toBe(true);
  });
});
