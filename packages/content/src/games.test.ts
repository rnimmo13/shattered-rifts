// Property tests with the real cards: random legal games between every pair of starters.
import { describe, expect, it } from 'vitest';
import { createEngine, hashState, type GameConfig, type GameState } from '@sr/engine';
import { randomGame, replay } from '@sr/engine/testkit';
import { CARD_DB, CHARACTERS, starterDeck } from './index';

const engine = createEngine(CARD_DB);

function check(s: GameState, owned: [number, number]): void {
  for (const p of [0, 1] as const) {
    const ps = s.players[p];
    if (ps.units.filter(Boolean).length > 5) throw new Error('more than 5 units');
    if (ps.backrow.filter(Boolean).length > 4) throw new Error('more than 4 backrow');
    if (ps.hand.length > 9) throw new Error('hand over 9');
    if (![ps.essence, ps.aether, ps.tempAether, ps.maxAether].every(Number.isFinite))
      throw new Error('NaN');
    const real = Object.values(s.cards).filter(
      (c) => c.owner === p && c.zone !== 'sigil' && CARD_DB[c.baseCardId]?.type !== 'token',
    );
    if (real.length !== owned[p])
      throw new Error(`card conservation p${p}: ${real.length} vs ${owned[p]}`);
  }
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
        const first = engine.createGame(cfg).first;
        const owned: [number, number] = [20 + (first === 1 ? 1 : 0), 20 + (first === 0 ? 1 : 0)];
        const g = randomGame(engine, cfg, `drv-${n}`, {
          check: (s) => s.phase !== 'mulligan' && check(s, owned),
        });
        expect(g.state.winner, `${cfg.seed} did not finish`).not.toBeNull();
        if (i === 0) expect(hashState(replay(engine, cfg, g.log))).toBe(hashState(g.state));
      }
    }
  }, 300_000);
});
