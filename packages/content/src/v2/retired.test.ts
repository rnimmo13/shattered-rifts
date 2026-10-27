// Every retired card becomes a card that is still in the game, so no old save, Arena deck or ghost is refused (DECISIONS #312, #334).

import { describe, expect, it } from 'vitest';
import { COMBAT_DB as db, RETIRED_CARDS, canonicalCard } from './index';

describe('retired cards', () => {
  it('each maps to a live card, and none is still in the game itself', () => {
    for (const [from, to] of Object.entries(RETIRED_CARDS)) {
      expect(db.cards[from], `${from} is retired but still defined`).toBeUndefined();
      expect(db.cards[canonicalCard(from)], `${from} -> ${to}`).toBeDefined();
    }
  });

  it('keeps the roll, tag and upgrade of the card it replaces', () => {
    const [from, to] = Object.entries(RETIRED_CARDS)[0]!;
    expect(canonicalCard(`hi~hold^${from}+`)).toBe(`hi~hold^${canonicalCard(to)}+`);
  });
});
