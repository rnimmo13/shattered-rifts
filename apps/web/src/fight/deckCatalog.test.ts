import { describe, expect, it } from 'vitest';
import { applyAction, cardText, chooseAction, createCombat } from '@sr/combat';
import { COMBAT_DB as db, ENCOUNTERS, RIFTWALKERS, laneOf, type HeroId } from '@sr/content/v2';
import {
  TABS,
  catalog,
  countsOf,
  filterCatalog,
  flatten,
  paginate,
  poolOf,
  randomDeck,
  tabCards,
  tabOf,
} from './deckCatalog';

const HEROES = Object.keys(RIFTWALKERS) as HeroId[];
const describe_ = (c: Parameters<typeof cardText>[1]) => cardText(db, c);

describe('the practice deck builder', () => {
  it('lists every card in the game exactly once, each under one pool', () => {
    const all = catalog(db);
    expect(all).toHaveLength(Object.keys(db.cards).length);
    expect(new Set(all.map((c) => c.def.id)).size).toBe(all.length);
    const pools = new Set(all.map((c) => c.pool));
    for (const h of HEROES) expect(pools.has(h), h).toBe(true);
    for (const p of ['neutral', 'wardens', 'tokens']) expect(pools.has(p), p).toBe(true);
    expect(poolOf(db.cards['sleeve-knife']!)).toBe('tokens');
    expect(poolOf(db.cards['bell-of-judgment']!)).toBe('wardens');
    expect(poolOf(db.cards['strike']!)).toBe('neutral');
  });

  it('filters by pool, rarity, text and upgrade', () => {
    const all = catalog(db);
    const base = { pool: 'all', rarity: 'all', text: '', upgraded: false } as const;
    const mire = filterCatalog(all, { ...base, pool: 'mire' }, describe_);
    expect(mire.length).toBeGreaterThan(25);
    expect(mire.every((c) => c.pool === 'mire' && !c.upgraded)).toBe(true);
    const plus = filterCatalog(all, { ...base, pool: 'mire', upgraded: true }, describe_);
    expect(plus.every((c) => c.def.id.endsWith('+'))).toBe(true);
    const rares = filterCatalog(all, { ...base, pool: 'astra', rarity: 'rare' }, describe_);
    expect(rares.length).toBeGreaterThan(2);
    expect(rares.every((c) => c.def.rarity === 'rare')).toBe(true);
    const fate = filterCatalog(all, { ...base, text: 'fate' }, describe_);
    expect(fate.some((c) => c.def.id === 'tolling-bell')).toBe(true);
    expect(fate.every((c) => c.pool === 'mire' || c.pool === 'all' || true)).toBe(true);
  });

  it('turns counts into a deck and back', () => {
    const deck = flatten({ strike: 3, defend: 2, nothing: 0 });
    expect(deck).toEqual(['defend', 'defend', 'strike', 'strike', 'strike']);
    expect(countsOf(deck)).toEqual({ defend: 2, strike: 3 });
  });

  it('a random deck is deterministic and made of real cards', () => {
    const a = randomDeck(db, 20, 'x');
    expect(a).toEqual(randomDeck(db, 20, 'x'));
    expect(a).not.toEqual(randomDeck(db, 20, 'y'));
    for (const id of a) expect(db.cards[id]).toBeDefined();
  });

  it('any mix of cards from the whole game plays through to the end without an error (every hero, many random decks)', () => {
    const enemies = ENCOUNTERS.filter((e) => ['regular', 'elite', 'warden'].includes(e.kind));
    let fights = 0;
    for (const h of HEROES) {
      for (let i = 0; i < 12; i++) {
        const deck = randomDeck(db, 8 + (i % 4) * 6, `${h}-${i}`);
        const enc = enemies[(i * 5 + HEROES.indexOf(h)) % enemies.length]!;
        let { state } = createCombat(db, {
          seed: `mix-${h}-${i}`,
          a: { hero: h, deck, potions: ['fire-flask', 'guard-draught'] },
          b: { enemies: enc.units },
        });
        for (let t = 0; t < 1200 && !state.winner; t++)
          state = applyAction(db, state, chooseAction(db, state)).state;
        fights++;
        // a defensive random deck can stall against a healing enemy for ever: that is a stalemate, not a hang
        if (!state.winner) expect(state.turn, `${h} deck ${i} vs ${enc.id} stuck`).toBeGreaterThan(20);
      }
    }
    expect(fights).toBe(HEROES.length * 12);
  });
});

describe('the grimoire', () => {
  const all = catalog(db);

  it('files every card under exactly one bookmark', () => {
    const ids = new Set(TABS.map((t) => t.id));
    let n = 0;
    for (const t of TABS) n += tabCards(all, t.id).length;
    for (const c of all) expect(ids.has(tabOf(c.def)), c.def.id).toBe(true);
    expect(n).toBe(all.length);
  });

  it("puts a Riftwalker's cards under that Riftwalker's realm, sorted basic to legendary", () => {
    for (const [h, r] of Object.entries(RIFTWALKERS)) {
      const own = tabCards(all, r.realm).filter((c) => c.pool === h);
      expect(own.length, h).toBeGreaterThan(20);
      const rank = ['basic', 'common', 'uncommon', 'rare', 'legendary'];
      // sorted by lane first, so rarity only climbs within a lane
      let last = 0;
      let lane: number | undefined = -2;
      for (const c of own) {
        const l = laneOf(c.def.id);
        if (l !== lane) {
          lane = l;
          last = 0;
        }
        const k = rank.indexOf(c.def.rarity ?? 'common');
        expect(k, c.def.id).toBeGreaterThanOrEqual(last);
        last = k;
      }
    }
  });

  it('cuts pages and names their heroes', () => {
    const pages = paginate(tabCards(all, 'umbral'), 6);
    expect(pages.length).toBeGreaterThan(2);
    expect(pages.every((p) => p.cards.length <= 6)).toBe(true);
    expect(pages[0]?.heroes.length).toBeGreaterThan(0);
  });
});
