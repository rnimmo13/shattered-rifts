// Every event has its painted scene, every Warden its own arena, and every venue the files the fight screen loads
// (docs/scene-prompts.md; packed by tools/pack-scenes.ps1 and tools/pack-arenas.ps1).
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ELITE_EVENTS, EVENTS } from '@sr/campaign';
import { ENCOUNTERS, WORLD_ENEMIES } from '@sr/content/v2';
import { ARENA_LOOK } from '../duel/scene/arena';
import { BOSS_VENUE, venueFor, venueForRealm, type VenueId } from '../duel/scene/venue';
import { arenaFor } from '../pvp/arenaVenue';

const pub = resolve(__dirname, '../../public/art');

describe('event scenes', () => {
  it('every event, the elite events, the Rift Caches, the merchant and the shrine have a scene', () => {
    const ids = [
      ...EVENTS.map((e) => e.id),
      ...ELITE_EVENTS.map((e) => e.id),
      'cache-open',
      'cache-trapped',
      'merchant',
      'shrine',
    ];
    expect(ids.filter((id) => !existsSync(resolve(pub, `events/${id}.jpg`)))).toEqual([]);
  });
});

describe('arenas', () => {
  it('the four added worlds and their Wardens use four dedicated realm arenas', () => {
    const pairs = [
      ['cinder', 'ashbound-colossus'],
      ['tides', 'pearlbound-sovereign'],
      ['vespera', 'dreaming-monarch'],
      ['sands', 'sandbound-chronicler'],
    ] as const;
    const venues = pairs.map(([realm]) => venueForRealm(realm));
    expect(new Set(venues).size).toBe(4);
    expect(venues).toEqual(['cindervault', 'thalassar', 'vespera', 'hourglass']);
    for (const [realm, boss] of pairs)
      expect(
        venueFor(
          ENCOUNTERS.find((e) => e.id === boss)!,
          'same',
        ),
      ).toBe(venueForRealm(realm));
  });
  it('every venue has its backdrop, floor and every prop used by its layout', () => {
    const missing: string[] = [];
    for (const v of Object.keys(ARENA_LOOK)) {
      const look = ARENA_LOOK[v as VenueId];
      const used = new Set([...look.far, ...look.ground.map((p) => p.i), ...look.hang]);
      for (const f of ['backdrop.jpg', 'floor.png', ...[...used].map((i) => `props/p${i}.png`)])
        if (!existsSync(resolve(pub, `arenas/${v}/${f}`))) missing.push(`${v}/${f}`);
    }
    expect(missing).toEqual([]);
  });

  it('preserves original private arenas and gives every new Warden an existing themed arena', () => {
    const wardens = ENCOUNTERS.filter((e) => e.kind === 'warden' || e.kind === 'finale');
    expect(wardens.filter((e) => !BOSS_VENUE[e.id]).map((e) => e.id)).toEqual([]);
    expect(Object.keys(BOSS_VENUE).filter((id) => !wardens.some((e) => e.id === id))).toEqual([]);
    const added = new Set(WORLD_ENEMIES.map((unit) => unit.id));
    const originals = wardens.filter((e) => !added.has(e.id));
    expect(new Set(originals.map((e) => BOSS_VENUE[e.id])).size).toBe(originals.length);
    for (const e of wardens) expect(ARENA_LOOK[BOSS_VENUE[e.id]!], e.id).toBeTruthy();
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
