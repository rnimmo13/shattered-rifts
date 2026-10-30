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

  it("the Spellblade's cards name the Obsidian Blade", () => {
    const blade = Object.values(db.cards).find(
      (c) => c.hero === 'spellblade' && c.effects.some((o) => o.op === 'forge'),
    );
    expect(blade).toBeDefined();
    expect(sharpen(blade!.id)).toContain('the Obsidian Blade');
    expect(sharpen(blade!.id)).not.toContain('Twelve Gauge');
  });
});

describe('a card says what the cards it makes and the totems it plants are (DECISIONS #448)', () => {
  const keys = (id: string) => {
    const def = db.cards[id]!;
    return keywordsOf(def, () => false, cardText(db, def));
  };
  it('a card that adds a card explains it by its own cost, kind and text', () => {
    for (const [maker, made] of [
      ['gravesoul', 'Gravesoul'],
      ['sleeve-knife', 'Dagger'],
      ['buckshot-shell', 'Buckshot Shell'],
    ] as const) {
      const id = Object.values(db.cards).find(
        (c) =>
          c.id !== maker &&
          !c.id.includes('~') &&
          JSON.stringify(c.effects).includes(`"card":"${maker}"`),
      )!.id;
      const k = keys(id).find((x) => x.name === made);
      expect(k?.text, id).toMatch(/^A \d+-cost (Attack|Skill): /);
    }
  });
  it('a card that plants a totem says what that totem does', () => {
    const id = Object.values(db.cards).find((c) =>
      JSON.stringify(c.effects).includes('"spirit":"hawk"'),
    )!.id;
    expect(keys(id).find((x) => x.name === 'Hawk')?.text).toMatch(/^A totem\. .*Primed/);
  });
  it('the Totem keyword describes the cycle, not the old help on spells', () => {
    const t = keys('call-the-moon-owl').find((x) => x.name === 'Totem');
    expect(t?.text).toMatch(/front totem/);
    expect(t?.text).not.toMatch(/first spell of its element/);
  });
});

describe('the made-card hovers stay tidy (review of #448)', () => {
  const names = (id: string) => {
    const def = db.cards[id]!;
    return keywordsOf(def, () => false, cardText(db, def)).map((k) => k.name);
  };
  it('an upgraded maker lists the upgraded card once, not the base too', () => {
    const id = Object.values(db.cards).find(
      (c) => c.id.endsWith('+') && JSON.stringify(c.effects).includes('"card":"sleeve-knife+"'),
    )!.id;
    expect(names(id)).toContain('Dagger+');
    expect(names(id)).not.toContain('Dagger');
  });
  it('a sanctified card does not explain itself', () => {
    expect(names('hi~gathering-storm')).not.toContain('Gathering Storm');
  });
  it('a card that only names the Old Twelve Gauge does not list the gun as a made card', () => {
    const id = Object.values(db.cards).find(
      (c) =>
        c.hero === 'drunkard' &&
        !c.id.includes('~') &&
        !JSON.stringify(c.effects).includes('old-twelve-gauge') &&
        cardText(db, c).includes('Old Twelve Gauge'),
    );
    if (id) expect(names(id.id)).not.toContain('Old Twelve Gauge');
  });
});
