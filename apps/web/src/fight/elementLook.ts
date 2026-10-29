// How the Shaman's elements are shown (DECISIONS #420): a mark and a word each, so they read without colour. Shared by the Trinity
// panel and anything that names a spell's element. Presentation only: what counts is the card's tag, read by the engine.

import type { CardDef, Element } from '@sr/combat';

export const ELEMENT_LOOK: Record<Element, { glyph: string; name: string }> = {
  flame: { glyph: '♨', name: 'Flame' },
  frost: { glyph: '❄', name: 'Frost' },
  storm: { glyph: 'ϟ', name: 'Storm' },
};

/** The element a card would light: its tag, or 'prism' for a spell that counts as the one not cast yet. */
export function elementTag(def: CardDef): Element | 'prism' | null {
  for (const e of ['flame', 'frost', 'storm'] as const) if (def.tags?.includes(e)) return e;
  return def.tags?.includes('prism') ? 'prism' : null;
}
