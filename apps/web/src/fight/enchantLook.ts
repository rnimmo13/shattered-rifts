// How the Spellblade's enchantments are shown (DECISIONS #417): a mark, a word and what it does when discharged. Shared by the Obsidian
// Blade panel (EnchantSlots.tsx) and the choice tiles (PickModal.tsx). Presentation only: the numbers are the engine's.

import { EMBER_DAMAGE, GLASS_DAMAGE, WARD_BARRIER, type Enchant } from '@sr/combat';

export const ENCHANT_LOOK: Record<Enchant, { glyph: string; name: string; text: string }> = {
  ember: {
    glyph: '♨',
    name: 'Ember',
    text: `When discharged: the attack deals ${EMBER_DAMAGE} more damage on its first hit.`,
  },
  glass: {
    glyph: '◇',
    name: 'Glass',
    text: `When discharged: once the attack is done, ${GLASS_DAMAGE} damage to every enemy (a shard, not an attack).`,
  },
  ward: {
    glyph: '⛨',
    name: 'Ward',
    text: `When discharged: gain ${WARD_BARRIER} Barrier at once.`,
  },
};
