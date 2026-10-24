import { describe, expect, it } from 'vitest';
import { cardText } from '@sr/combat';
import { COMBAT_DB as db } from '@sr/content/v2';
import { STATUS_INFO, keywordsOf } from './info';

describe('the words on a card are explained', () => {
  it('every status a card names in its rules is explained on its hover, and so is what that explanation names', () => {
    for (const def of Object.values(db.cards)) {
      const text = cardText(db, def).replace(/\*\*/g, '');
      const keys = keywordsOf(def, () => false, text).map((k) => k.name);
      for (const s of Object.values(STATUS_INFO))
        if (new RegExp(`\\b${s.name}(?:s|es|ed|ing)?\\b`).test(text))
          expect(keys, `${def.name} names ${s.name}`).toContain(s.name);
    }
  });

  it('Fervor explains Radiant, which it ends in', () => {
    const fervor = Object.values(db.cards).find((c) =>
      c.effects.some((o) => o.op === 'status' && o.status === 'mantra'),
    );
    expect(fervor).toBeDefined();
    const keys = keywordsOf(fervor!, () => false, cardText(db, fervor!)).map((k) => k.name);
    expect(keys).toContain('Fervor');
    expect(keys).toContain('Radiant');
  });
});
