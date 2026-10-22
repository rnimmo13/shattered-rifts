import { describe, expect, it } from 'vitest';
import { createEngine, hashState } from '@sr/engine';
import { randomGame, replay } from '@sr/engine/testkit';
import { CARD_DB, ENEMIES, character, deckList, starterDeck, validateDeck } from './index';

describe('enemies (03_CAMPAIGN §4)', () => {
  it('has 3 regular duelists and 2 Elites for each realm, 4 Wardens and the finale', () => {
    for (const realm of ['aurelion', 'nexus', 'wyldmaw', 'umbral']) {
      expect(ENEMIES.filter((e) => e.realm === realm && e.kind === 'regular')).toHaveLength(3);
      expect(ENEMIES.filter((e) => e.realm === realm && e.kind === 'elite')).toHaveLength(2);
      expect(ENEMIES.filter((e) => e.realm === realm && e.kind === 'warden')).toHaveLength(1);
    }
    expect(ENEMIES.filter((e) => e.kind === 'finale')).toHaveLength(1);
    expect(new Set(ENEMIES.map((e) => e.id)).size).toBe(ENEMIES.length);
  });

  it.each(ENEMIES.map((e) => [e.id, e] as const))(
    '%s has a legal deck of the right size',
    (_id, e) => {
      const deck = deckList(e);
      expect(validateDeck(deck, CARD_DB)).toEqual([]);
      expect(deck).toHaveLength(e.kind === 'regular' ? 20 : 30);
    },
  );

  it('uses the Essence from the campaign doc', () => {
    const essence = (id: string) => ENEMIES.find((e) => e.id === id)?.essence;
    expect(essence('aur-seraphine')).toBe(35);
    expect(essence('nex-kron')).toBe(35);
    expect(essence('wyl-gorrmaw')).toBe(40);
    expect(essence('umb-nyxara')).toBe(40);
    expect(essence('vorthax')).toBe(50);
    for (const e of ENEMIES.filter((x) => x.kind === 'regular')) {
      expect(e.essence).toBeGreaterThanOrEqual(12);
      expect(e.essence).toBeLessThanOrEqual(15);
    }
  });

  it('every enemy deck plays complete random games against a starter (and replays identically)', () => {
    const engine = createEngine(CARD_DB);
    const maren = character('maren');
    let n = 0;
    for (const e of ENEMIES) {
      const cfg = {
        seed: `enemy-${e.id}`,
        players: [
          { deck: starterDeck('maren'), sigil: maren.sigil },
          { deck: deckList(e), essence: e.essence },
        ] as [{ deck: string[]; sigil: string }, { deck: string[]; essence: number }],
      };
      const g = randomGame(engine, cfg, `drv-${n++}`);
      expect(g.state.winner, e.id).not.toBeNull();
      expect(hashState(replay(engine, cfg, g.log))).toBe(hashState(g.state));
    }
  }, 120_000);
});

describe('deck rules', () => {
  it('rejects too few cards, too many copies and too many Legendary/Mythic', () => {
    expect(validateDeck(['AUR-01'], CARD_DB)[0]).toMatch(/at least 20/);
    expect(
      validateDeck(
        Array.from({ length: 20 }, () => 'AUR-01'),
        CARD_DB,
      ).join(),
    ).toMatch(/max 3/);
    const big = [...starterDeck('maren').slice(0, 17), 'AUR-09', 'NEX-07', 'WYL-07'];
    expect(validateDeck(big, CARD_DB).join()).toMatch(/Legendary\/Mythic cards \(max 2\)/);
    expect(
      validateDeck([...starterDeck('maren').slice(0, 18), 'AUR-09', 'AUR-09'], CARD_DB).join(),
    ).toMatch(/max 1/);
  });

  it('accepts every starter', () => {
    for (const c of ['maren', 'rivet', 'kesh', 'vesper'] as const) {
      expect(validateDeck(starterDeck(c), CARD_DB)).toEqual([]);
    }
  });
});
