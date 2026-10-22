// One property-test game: random legal deck pair from the whole card pool, random legal moves,
// invariants checked after every action. A thrown error (including an engine safety cap) is a failure.

import { createEngine, nextInt, seedRng, type Engine, type GameConfig } from '@sr/engine';
import { InvariantChecker, randomGame } from '@sr/engine/testkit';
import { CARD_DB, CHARACTERS, randomLegalDeck } from '@sr/content';

export interface PropertyResult {
  index: number;
  ok: boolean;
  error?: string;
  turns: number;
  actions: number;
  draw: boolean;
}

let cached: Engine | undefined;
const engine = (): Engine => (cached ??= createEngine(CARD_DB));

export function configFor(index: number, baseSeed: string): GameConfig {
  const rng = seedRng(`${baseSeed}:deck:${index}`);
  const sigils = CHARACTERS.map((c) => c.sigil);
  const side = () => ({
    deck: randomLegalDeck(CARD_DB, 20 + nextInt(rng, 16), (k) => nextInt(rng, k)),
    sigil: sigils[nextInt(rng, sigils.length)] as string,
  });
  return { seed: `${baseSeed}:${index}`, players: [side(), side()] };
}

export function runPropertyGame(index: number, baseSeed: string): PropertyResult {
  const e = engine();
  const cfg = configFor(index, baseSeed);
  const first = e.createGame(cfg).first;
  const checker = new InvariantChecker(CARD_DB, [
    cfg.players[0].deck.length + (first === 1 ? 1 : 0),
    cfg.players[1].deck.length + (first === 0 ? 1 : 0),
  ]);
  try {
    const g = randomGame(e, cfg, `${baseSeed}:drv:${index}`, {
      check: (s, ev) => {
        if (s.phase !== 'mulligan') checker.step(s, ev);
      },
    });
    if (g.state.winner === null) throw new Error(`did not end (stopped at turn ${g.state.turn})`);
    if (g.state.turn > 201) throw new Error(`ran past the turn cap (${g.state.turn})`);
    return {
      index,
      ok: true,
      turns: g.state.turn,
      actions: g.log.length,
      draw: g.state.winner === 'draw',
    };
  } catch (err) {
    return {
      index,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      turns: 0,
      actions: 0,
      draw: false,
    };
  }
}
