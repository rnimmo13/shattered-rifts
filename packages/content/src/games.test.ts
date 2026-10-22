// Property tests with the real cards: random legal games with invariant checks.
import { describe, expect, it } from 'vitest';
import { createEngine, hashState, nextInt, seedRng, type GameConfig } from '@sr/engine';
import { InvariantChecker, randomGame, replay } from '@sr/engine/testkit';
import { CARD_DB, CHARACTERS, randomLegalDeck, starterDeck } from './index';

const engine = createEngine(CARD_DB);

/** Real cards each player owns at the start (the second player also owns Rift Spark). */
function initialOwned(cfg: GameConfig): [number, number] {
  const first = engine.createGame(cfg).first;
  return [
    cfg.players[0].deck.length + (first === 1 ? 1 : 0),
    cfg.players[1].deck.length + (first === 0 ? 1 : 0),
  ];
}

describe('random games with the starters', () => {
  const pairs = CHARACTERS.flatMap((a) => CHARACTERS.map((b) => [a, b] as const));
  const perPair = 12;

  it(`${pairs.length * perPair} games between every pair of starters end cleanly`, () => {
    let n = 0;
    for (const [a, b] of pairs) {
      for (let i = 0; i < perPair; i++, n++) {
        const cfg: GameConfig = {
          seed: `${a.id}-${b.id}-${i}`,
          players: [
            { deck: starterDeck(a.id), sigil: a.sigil },
            { deck: starterDeck(b.id), sigil: b.sigil },
          ],
        };
        const checker = new InvariantChecker(CARD_DB, initialOwned(cfg));
        const g = randomGame(engine, cfg, `drv-${n}`, {
          check: (s, ev) => s.phase !== 'mulligan' && checker.step(s, ev),
        });
        expect(g.state.winner, `${cfg.seed} did not finish`).not.toBeNull();
        if (i === 0) expect(hashState(replay(engine, cfg, g.log))).toBe(hashState(g.state));
      }
    }
  }, 300_000);
});

describe('random games with decks from the whole card pool', () => {
  // The full 10,000-game gate runs through `pnpm test:property`; this is the quick in-suite version.
  const games = 300;

  it(`${games} games keep every invariant, end within 200 turns, and replay identically`, () => {
    const rng = seedRng('pool-decks');
    const sigils = CHARACTERS.map((c) => c.sigil);
    for (let n = 0; n < games; n++) {
      const cfg: GameConfig = {
        seed: `pool-${n}`,
        players: [
          {
            deck: randomLegalDeck(CARD_DB, 20 + nextInt(rng, 11), (k) => nextInt(rng, k)),
            sigil: sigils[nextInt(rng, 4)] as string,
          },
          {
            deck: randomLegalDeck(CARD_DB, 20 + nextInt(rng, 11), (k) => nextInt(rng, k)),
            sigil: sigils[nextInt(rng, 4)] as string,
          },
        ],
      };
      const checker = new InvariantChecker(CARD_DB, initialOwned(cfg));
      const g = randomGame(engine, cfg, `pool-drv-${n}`, {
        check: (s, ev) => s.phase !== 'mulligan' && checker.step(s, ev),
      });
      expect(g.state.winner, `${cfg.seed} did not finish`).not.toBeNull();
      expect(g.state.turn).toBeLessThanOrEqual(201);
      if (n % 25 === 0) expect(hashState(replay(engine, cfg, g.log))).toBe(hashState(g.state));
    }
  }, 300_000);
});
