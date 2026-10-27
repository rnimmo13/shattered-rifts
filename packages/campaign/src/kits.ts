// Starting kits: at the very start of a run the player chooses one of three preset versions of their Riftwalker's starter
// deck, one per build path. A kit swaps two plain Strike/Defend cards for two fixed uncommon cards from that build path, picked to be solid
// and simple (nothing that scales out of control or needs setup) while still showing what the build path is about. The same
// two cards every run: no randomness.

import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import type { KitOption } from './types';

/** For each Riftwalker, the two cards of the kit for build path 0, build path 1 and build path 2 (the order of `Riftwalker.buildPaths`). */
export const KIT_CARDS: Record<HeroId, [[string, string], [string, string], [string, string]]> = {
  knight: [
    ['shield-charge', 'oath-of-iron'],
    ['mirrored-aegis', 'caltrops'],
    ['heartening-hymn', 'hymn-of-reckoning'],
  ],
  engineer: [
    ['scrap-heap', 'overcharge-blast'],
    ['link-up', 'arc-relay'],
    ['upgrade-chip', 'bulwark-frame'],
  ],
  hunter: [
    ['run-wild', 'crushing-blow'],
    ['savage-command', 'feeding-time'],
    ['gnaw', 'bone-offering'],
  ],
  trapper: [
    ['tripwire-garrote', 'snare-net'],
    ['death-mark', 'smoke-bomb'],
    ['shadow-step', 'long-con'],
  ],
  assassin: [
    ['ambush-cut', 'spent-steel'],
    ['mindrot', 'venom-fang'],
    ['fortunes-edge', 'magicians-exit'],
  ],
  totemist: [
    ['prismatic-burst', 'driver-of-runes'],
    ['umbra-glyph', 'streamlined-strike'],
    ['thundercall', 'sentinel-sigil'],
  ],
  barbarian: [
    ['temper-flare', 'wrathful-guard'],
    ['inner-calm', 'fearless'],
    ['foretold-flame', 'the-offering'],
  ],
  spellblade: [
    ['crown-strike', 'edgewise'],
    ['cosmic-lance', 'gravity-well'],
    ['ursa', 'draco'],
  ],
  necromancer: [
    ['omen', 'veilpiercer'],
    ['bone-bulwark', 'legion-of-bone'],
    ['cremation', 'funeral-pyre'],
  ],
  drunkard: [
    ['reload', 'glass-cover'],
    ['pump-action', 'shotgun-wedding'],
    ['shatter', 'liquid-dinner'],
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
