// Starting kits: at the very start of a run the player chooses one of three preset versions of their Riftwalker's starter
// deck, one per build path. A kit swaps three plain Strike/Defend cards for two fixed uncommon cards and one common card from that build path (DECISIONS #333, #335), picked to be solid
// and simple (nothing that scales out of control or needs setup) while still showing what the build path is about. The same
// three cards every run: no randomness. The common is a simple card that shows what the build path does.

import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import type { KitOption } from './types';

/** For each Riftwalker, the three cards of the kit (two uncommons, then a common) for build path 0, build path 1 and build path 2 (the order of `Riftwalker.buildPaths`). */
type Kit = [string, string, string];
export const KIT_CARDS: Record<HeroId, [Kit, Kit, Kit]> = {
  knight: [
    ['shield-charge', 'oath-of-iron', 'bulwark-blow'],
    ['mirrored-aegis', 'caltrops', 'thornmail'],
    ['heartening-hymn', 'hymn-of-reckoning', 'lightbearer'],
  ],
  engineer: [
    ['scrap-heap', 'overcharge-blast', 'breach-charge'],
    ['link-up', 'arc-relay', 'relay-strike'],
    ['upgrade-chip', 'bulwark-frame', 'build-enforcer'],
  ],
  hunter: [
    ['run-wild', 'crushing-blow', 'open-a-vein'],
    ['savage-command', 'feeding-time', 'summon-pup'],
    ['blur-of-claws', 'reckless-abandon', 'rush-in'],
  ],
  trapper: [
    ['tripwire-garrote', 'snare-net', 'trip-line'],
    ['death-mark', 'smoke-bomb', 'exploit-weakness'],
    ['shadow-step', 'long-con', 'patient-blade'],
  ],
  assassin: [
    ['ambush-cut', 'spent-steel', 'palmed-knives'],
    ['mindrot', 'venom-fang', 'poison-tip'],
    ['fortunes-edge', 'magicians-exit', 'dart-throw'],
  ],
  totemist: [
    ['prismatic-burst', 'driver-of-runes', 'rime-strike'],
    ['umbra-glyph', 'streamlined-strike', 'live-wire'],
    ['thundercall', 'sentinel-sigil', 'spark-cluster'],
  ],
  barbarian: [
    ['temper-flare', 'wrathful-guard', 'angry-palm'],
    ['inner-calm', 'fearless', 'centre-yourself'],
    ['foretold-flame', 'the-offering', 'whispered-vow'],
  ],
  spellblade: [
    ['crown-strike', 'edgewise', 'forged-in-fury'],
    ['cosmic-lance', 'gravity-well', 'sunstrike'],
    ['ursa', 'draco', 'lumen-trap'],
  ],
  necromancer: [
    ['omen', 'veilpiercer', 'tolling-bell'],
    ['bone-bulwark', 'legion-of-bone', 'raise-thrall'],
    ['cremation', 'funeral-pyre', 'burial-shroud'],
  ],
  drunkard: [
    ['reload', 'glass-cover', 'pistol-whip'],
    ['pump-action', 'shotgun-wedding', 'load-shells'],
    ['shatter', 'liquid-dinner', 'drunken-swing'],
  ],
};

const isPlainBasic = (id: string): boolean =>
  COMBAT_DB.cards[id]?.hero === 'neutral' && COMBAT_DB.cards[id]?.rarity === 'basic';

/** The three kits for `hero`, one per build path. */
export function makeKits(hero: HeroId): KitOption[] {
  const starter = RIFTWALKERS[hero].starter;
  return KIT_CARDS[hero].map((added, path) => {
    const deck = [...starter];
    const removed: string[] = [];
    // an Attack replaces a plain Strike and anything else a plain Defend, so the deck keeps its shape
    for (const id of added) {
      const kind = COMBAT_DB.cards[id]?.kind === 'attack' ? 'attack' : 'other';
      let at = deck.findIndex(
        (c) => isPlainBasic(c) && (COMBAT_DB.cards[c]?.kind === 'attack') === (kind === 'attack'),
      );
      if (at < 0) at = deck.findIndex(isPlainBasic);
      if (at >= 0) removed.push(deck.splice(at, 1)[0] as string);
    }
    deck.push(...added);
    return {
      id: (['a', 'b', 'c'] as const)[path] as KitOption['id'],
      leans: (RIFTWALKERS[hero].buildPaths[path] ?? 'A mix').split(':')[0] as string,
      deck,
      added: [...added],
      removed,
    };
  });
}
