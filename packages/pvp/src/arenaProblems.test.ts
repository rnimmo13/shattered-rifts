import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, isDeckCard } from '@sr/content/v2';
import { arenaProblems, checkArenaEntry } from './deck';

const monk = RIFTWALKERS.monk.starter;
const commons = Object.values(COMBAT_DB.cards)
  .filter(
    (c) => c.hero === 'monk' && c.rarity === 'common' && c.kind !== 'power' && isDeckCard(c.id),
  )
  .map((c) => c.id);
const pad = (deck: string[], to = 15): string[] => {
  const out = [...deck];
  for (let i = 0; out.length < to; i++) out.push(commons[i % commons.length]!);
  return out;
};
const junkIds = Object.values(COMBAT_DB.cards)
  .filter((c) => c.unplayable && !c.onDiscard && isDeckCard(c.id))
  .map((c) => c.id);
// (Legendary cards are shelved for now, DECISIONS #362: the Ancestral limit stands in for the rarity limits)
const ancestrals = Object.values(COMBAT_DB.cards)
  .filter((c) => c.rarity === 'ancestral' && isDeckCard(c.id) && !c.id.endsWith('+'))
  .map((c) => c.id);
const auras = Object.values(COMBAT_DB.cards)
  .filter((c) => c.hero === 'monk' && c.kind === 'power' && isDeckCard(c.id))
  .map((c) => c.id);

describe('why a deck cannot go into the Arena: every reason, in words a player can act on', () => {
  it('a deck that passes has no problems', () => {
    const deck = { hero: 'monk', deck: pad([...monk]) };
    expect(checkArenaEntry(deck).ok).toBe(true);
    expect(arenaProblems(deck)).toEqual([]);
  });

  it('status cards a run picked up (Static, Haze...) come along into the Arena and count (DECISIONS #729)', () => {
    const deck = { hero: 'monk', deck: pad([...monk, ...junkIds.slice(0, 3)]) };
    expect(checkArenaEntry(deck).ok).toBe(true);
    expect(arenaProblems(deck)).toEqual([]);
    const c = checkArenaEntry(deck);
    if (c.ok) expect(c.entry.deck.filter((id) => junkIds.includes(id))).toHaveLength(3);
  });

  it('a short deck says how many count, and why extra copies are not counted', () => {
    const aura = auras[0]!;
    // (three of an Aura: one is not counted)
    const deck = [...monk, aura, aura, aura];
    const p = arenaProblems({ hero: 'monk', deck: deck.slice(0, 14).concat(aura) });
    const size = p.find((x) => x.kind === 'size')!;
    expect(size.text).toMatch(/that count, and the Arena needs at least 15/);
  });

  it('several problems are all reported, not only the first', () => {
    // (a second copy of an Ancestral card, three different ones, and too few cards)
    const deck = [...monk, ancestrals[0]!, ...ancestrals.slice(0, 3)];
    const p = arenaProblems({ hero: 'monk', deck });
    expect(p.map((x) => x.kind).sort()).toEqual(['ancestral', 'size', 'unique']);
    expect(p.find((x) => x.kind === 'unique')!.text).toMatch(/one of a kind/);
    // (the Arena's own refusal carries all of them too)
    const c = checkArenaEntry({ hero: 'monk', deck });
    expect(c.ok).toBe(false);
    if (!c.ok) for (const x of p) expect(c.message).toContain(x.text);
  });

  it('agrees with the Arena check on every deck: no problems exactly when it is let in', () => {
    // (a seeded walk through decks of every shape: short and long, junk, Legendaries, Auras, repeats)
    let seed = 7;
    const rand = (n: number): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    // (every Riftwalker's cards and their upgrades, rolled copies, status cards, Ancestral cards; decks from 5 to 90 cards)
    const heroes = Object.keys(RIFTWALKERS);
    const everyCard = Object.values(COMBAT_DB.cards)
      .filter((c) => isDeckCard(c.id))
      .map((c) => c.id);
    const rolled = ['hi~strike', 'lo~defend', 'hi~strike+'].filter((id) => isDeckCard(id));
    const pool = [...commons, ...auras, ...junkIds, ...ancestrals, ...monk, ...rolled];
    for (let i = 0; i < 1500; i++) {
      const size = 5 + rand(i % 10 === 0 ? 86 : 30);
      const from = i % 2 === 0 ? pool : everyCard;
      const deck = Array.from({ length: size }, () => from[rand(from.length)]!);
      const entry = { hero: heroes[rand(heroes.length)]!, deck };
      expect(arenaProblems(entry).length === 0, JSON.stringify(deck)).toBe(
        checkArenaEntry(entry).ok,
      );
    }
  });
});
