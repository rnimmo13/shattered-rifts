// Every event has its painted scene, every Warden its own arena, and every venue the files the fight screen loads
// (docs/scene-prompts.md; packed by tools/pack-scenes.ps1 and tools/pack-arenas.ps1).
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENTS } from '@sr/campaign';
import { ENCOUNTERS } from '@sr/content/v2';
import { ARENA_LOOK } from '../duel/scene/arena';
import { BOSS_VENUE, venueFor, type VenueId } from '../duel/scene/venue';
import { arenaFor } from '../pvp/arenaVenue';

const pub = resolve(__dirname, '../../public/art');

describe('event scenes', () => {
  it('every event, the Rift Caches, the merchant and the shrine have a scene', () => {
    const ids = [
      ...EVENTS.map((e) => e.id),
      'cache-open',
      'cache-trapped',
      'merchant',
      'shrine',
    ];
    expect(ids.filter((id) => !existsSync(resolve(pub, `events/${id}.jpg`)))).toEqual([]);
  });
});

describe('arenas', () => {
  it('every venue has its backdrop, floor and nine props', () => {
    const missing: string[] = [];
    for (const v of Object.keys(ARENA_LOOK)) {
      for (const f of ['backdrop.jpg', 'floor.png', ...Array.from({ length: 9 }, (_, i) => `props/p${i}.png`)])
        if (!existsSync(resolve(pub, `arenas/${v}/${f}`))) missing.push(`${v}/${f}`);
    }
    expect(missing).toEqual([]);
  });

  it('every Warden and the finale have an arena of their own, and no two share one', () => {
    const wardens = ENCOUNTERS.filter((e) => e.kind === 'warden' || e.kind === 'finale');
    expect(wardens.filter((e) => !BOSS_VENUE[e.id]).map((e) => e.id)).toEqual([]);
    expect(Object.keys(BOSS_VENUE).filter((id) => !wardens.some((e) => e.id === id))).toEqual([]);
    expect(new Set(Object.values(BOSS_VENUE)).size).toBe(Object.keys(BOSS_VENUE).length);
    for (const e of wardens) expect(venueFor(e, 'any seed')).toBe(BOSS_VENUE[e.id]);
  });

  it('ghosts and the Arena fight in the Crossing', () => {
    const seraphine = ENCOUNTERS.find((e) => e.id === 'seraphine')!;
    expect(venueFor(seraphine, 's1', true)).toBe('crossing');
    expect(arenaFor('any match')).toBe('crossing');
  });

  it("a realm's other fights use both of its sites, and the same seed always the same one", () => {
    const squires = ENCOUNTERS.find((e) => e.id === 'squire-pair')!;
    const seen = new Set<VenueId>();
    for (let i = 0; i < 40; i++) seen.add(venueFor(squires, `seed-${i}`));
    expect([...seen].sort()).toEqual(['castle', 'ramparts']);
    expect(venueFor(squires, 'seed-7')).toBe(venueFor(squires, 'seed-7'));
  });
});
