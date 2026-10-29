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

describe('Traps are explained wherever a card names them (DECISIONS #304)', () => {
  it('a card that says "Trap" gets the Trap note, and no card says "Snare"', () => {
    const def = db.cards['gleeful-trapsmith']!;
    const text = cardText(db, def);
    expect(text).toContain('Trap');
    expect(keywordsOf(def, () => false, text).some((k) => k.name === 'Trap')).toBe(true);
    for (const c of Object.values(db.cards)) expect(cardText(db, c)).not.toMatch(/snare/i);
  });
});

describe('Sharpen names the weapon it sharpens (the gun calls it Precision, DECISIONS #400)', () => {
  const sharpen = (id: string, word = 'Sharpen') =>
    keywordsOf(db.cards[id]!, () => false, cardText(db, db.cards[id]!)).find((k) => k.name === word)
      ?.text;

  it("the Drunkard's cards say Precision and name the Old Twelve Gauge, Auras too", () => {
    for (const id of ['scope', 'reload', 'hair-trigger', 'the-twelve-gauge-opera']) {
      expect(sharpen(id, 'Precision'), id).toContain('the Old Twelve Gauge');
      expect(cardText(db, db.cards[id]!), id).toMatch(/Precision \d/);
      expect(cardText(db, db.cards[id]!), id).not.toMatch(/Sharpen/);
    }
  });

  it("the Spellblade's cards never Sharpen now: her blade is enchanted (DECISIONS #417)", () => {
    const blade = Object.values(db.cards).find(
      (c) => c.hero === 'spellblade' && c.effects.some((o) => o.op === 'forge'),
    );
    expect(blade).toBeUndefined();
  });
});
