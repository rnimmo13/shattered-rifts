// The first choice of a run: any two of your Riftwalker's own uncommon cards (DECISIONS #365, replacing the three kits).

import { describe, expect, it } from 'vitest';
import { COMBAT_DB, RIFTWALKERS, V2_DECK_RULES, type HeroId } from '@sr/content/v2';
import {
  RunError,
  STARTER_PICKS,
  canAdd,
  chooseStarters,
  newRun,
  parseRun,
  serializeRun,
  starterDeck,
} from './index';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];

describe('choosing two uncommon cards to start with', () => {
  it('every run opens by offering the Riftwalker’s own uncommons, to take two of', () => {
    for (const h of HEROES) {
      const r = newRun(h, `start-${h}`, 'normal');
      expect(r.phase).toBe('kit');
      const offer = r.context?.starterPick;
      expect(offer?.count, h).toBe(STARTER_PICKS);
      expect(offer!.options.length, h).toBeGreaterThanOrEqual(10);
      for (const id of offer!.options) {
        const c = COMBAT_DB.cards[id];
        expect(c?.hero, `${h} ${id}`).toBe(h);
        expect(c?.rarity, `${h} ${id}`).toBe('uncommon');
        expect(c?.unplayable).toBeFalsy();
      }
    }
  });

  it('the two cards take the place of two plain cards: the deck keeps its size and is legal', () => {
    for (const h of HEROES) {
      const r = newRun(h, `deck-${h}`, 'normal');
      const [a, b] = r.context!.starterPick!.options.slice(-2) as [string, string];
      const next = chooseStarters(r, [a, b]);
      expect(next.phase).toBe('prelude');
      expect(next.deck.length).toBe(RIFTWALKERS[h].starter.length);
      expect(next.deck.length).toBeGreaterThanOrEqual(V2_DECK_RULES.minSize);
      expect(next.deck).toContain(a);
      expect(next.deck).toContain(b);
      const built: string[] = [];
      for (const id of next.deck) {
        expect(canAdd(built, id), `${h}: ${id}`).toBe(true);
        built.push(id);
      }
    }
  });

  it('an Attack replaces a Strike and anything else a Defend', () => {
    const attack = Object.values(COMBAT_DB.cards).find(
      (c) => c.hero === 'knight' && c.rarity === 'uncommon' && c.kind === 'attack',
    )!;
    const skill = Object.values(COMBAT_DB.cards).find(
      (c) => c.hero === 'knight' && c.rarity === 'uncommon' && c.kind === 'skill',
    )!;
    const deck = starterDeck('knight', [attack.id, skill.id]);
    expect(deck.filter((c) => c === 'strike')).toHaveLength(4);
    expect(deck.filter((c) => c === 'defend')).toHaveLength(3);
  });

  it('refuses the wrong number of cards, a repeat, or a card that is not on offer', () => {
    const r = newRun('knight', 'bad', 'normal');
    const [a] = r.context!.starterPick!.options as [string];
    expect(() => chooseStarters(r, [a])).toThrow(RunError);
    expect(() => chooseStarters(r, [a, a])).toThrow(RunError);
    expect(() => chooseStarters(r, [a, 'strike'])).toThrow(RunError);
    expect(() => chooseStarters(r, [a, 'hammer-fall+'])).toThrow(RunError);
  });

  it('is a valid save, and a run saved at the old three decks is given the new choice', () => {
    const r = newRun('knight', 'save', 'normal');
    expect(parseRun(serializeRun(r))).toEqual(r);
    const old = JSON.parse(serializeRun(r)) as { context: Record<string, unknown> };
    old.context = {
      nodeId: '',
      kits: [{ id: 'a', leans: 'Bulwark', deck: RIFTWALKERS.knight.starter, added: [], removed: [] }],
    };
    const back = parseRun(JSON.stringify(old));
    expect(back?.phase).toBe('kit');
    expect(back?.context?.starterPick?.options.length).toBeGreaterThanOrEqual(10);
  });
});
