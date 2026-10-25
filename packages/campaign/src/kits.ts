// Starting kits: at the very start of a run the player chooses one of three preset versions of their Riftwalker's starter
// deck, one per lane. A kit swaps two plain Strike/Defend cards for two fixed uncommon cards from that lane, picked to be solid
// and simple (nothing that scales out of control or needs setup) while still showing what the lane is about. The same
// two cards every run: no randomness.

import { COMBAT_DB, RIFTWALKERS, type HeroId } from '@sr/content/v2';
import type { KitOption } from './types';

/** For each Riftwalker, the two cards of the kit for lane 0, lane 1 and lane 2 (the order of `Riftwalker.lanes`). */
export const KIT_CARDS: Record<HeroId, [[string, string], [string, string], [string, string]]> = {
  knight: [
    ['shield-charge', 'oath-of-iron'],
    ['mirrored-aegis', 'caltrops'],
    ['ward-of-ages', 'heartening-hymn'],
  ],
  engineer: [
    ['scrap-heap', 'overcharge-blast'],
    ['link-up', 'arc-relay'],
    ['upgrade-chip', 'bulwark-frame'],
  ],
  hunter: [
    ['run-wild', 'crushing-blow'],
    ['rally-the-pack', 'feeding-time'],
    ['devour', 'bone-offering'],
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
    ['chilled-focus', 'rune-shield'],
    ['deep-charge', 'resonant-strike'],
  ],
  barbarian: [
    ['temper-flare', 'wrathful-guard'],
    ['breathe', 'fearless'],
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

/** The three kits for `hero`, one per lane. */
export function makeKits(hero: HeroId): KitOption[] {
  const starter = RIFTWALKERS[hero].starter;
  return KIT_CARDS[hero].map((added, lane) => {
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
      id: (['a', 'b', 'c'] as const)[lane] as KitOption['id'],
      leans: (RIFTWALKERS[hero].lanes[lane] ?? 'A mix').split(':')[0] as string,
      deck,
      added: [...added],
      removed,
    };
  });
}
