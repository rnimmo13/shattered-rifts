// Deck arguments for the sim CLI: a character id (starter + Sigil) or "ID:count,ID:count".

import {
  ENEMIES,
  deckList,
  ALL_CARDS,
  CARD_DB,
  CHARACTERS,
  character,
  starterDeck,
  type CharacterId,
} from '@sr/content';
import type { DeckSpec } from './play';

export function isCharacter(v: string): v is CharacterId {
  return CHARACTERS.some((c) => c.id === v);
}

export function parseDeck(spec: string, sigil?: string): DeckSpec {
  if (spec.startsWith('enemy:')) {
    const e = ENEMIES.find((x) => x.id === spec.slice(6));
    if (!e) throw new Error(`Unknown enemy "${spec.slice(6)}"`);
    return { label: e.name, cards: deckList(e), essence: e.essence, personality: e.personality };
  }
  if (isCharacter(spec)) {
    const ch = character(spec);
    return {
      label: `${ch.name.split(' ')[0]} (${ch.starterName})`,
      cards: starterDeck(spec),
      sigil: ch.sigil,
    };
  }
  const cards: string[] = [];
  for (const part of spec.split(',')) {
    const [id, n] = part.trim().split(/[:x]/);
    if (!id || !CARD_DB[id]) throw new Error(`Unknown card "${id ?? part}" in deck spec`);
    for (let i = 0; i < Number(n ?? 1); i++) cards.push(id);
  }
  return { label: 'custom', cards, ...(sigil ? { sigil } : {}) };
}

/** The card in `deck` (not `target`) whose cost is closest to the target's: the fair swap-out. */
export function swapOutFor(deck: string[], target: string): string {
  const cost = CARD_DB[target]?.cost ?? 0;
  const candidates = [...new Set(deck)].filter((id) => id !== target);
  if (candidates.length === 0) throw new Error('deck has nothing to swap out');
  candidates.sort((a, b) => {
    const da = Math.abs((CARD_DB[a]?.cost ?? 0) - cost);
    const db = Math.abs((CARD_DB[b]?.cost ?? 0) - cost);
    return da - db || a.localeCompare(b);
  });
  return candidates[0] as string;
}

export function cardName(id: string): string {
  return ALL_CARDS.find((c) => c.id === id)?.name ?? id;
}
