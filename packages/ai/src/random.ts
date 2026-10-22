// RandomAi (M1): uniform over legal actions, with two nudges so games look like games.
import {
  nextInt,
  seedRng,
  type Action,
  type Engine,
  type GameState,
  type PlayerId,
  type RngState,
} from '@sr/engine';
import type { AiPlayer } from './types';

export interface RandomAiOptions {
  /** Chance (0–1) to respond in a window when it can (otherwise passes). */
  respondRate?: number;
  /** Chance (0–1) to end the turn while other actions remain. */
  endTurnRate?: number;
}

/**
 * Random-legal-move AI. It rarely ends its turn while it can still act, and only sometimes springs
 * a response. Its randomness is its own seeded PRNG, so a duel with a given seed is reproducible.
 */
export class RandomAi implements AiPlayer {
  readonly name = 'Random';
  private readonly rng: RngState;

  constructor(
    seed: string,
    private readonly opts: RandomAiOptions = {},
  ) {
    this.rng = seedRng(`ai:${seed}`);
  }

  private chance(p: number): boolean {
    return nextInt(this.rng, 1000) < p * 1000;
  }

  private pick<T>(xs: readonly T[]): T {
    const x = xs[nextInt(this.rng, xs.length)];
    if (x === undefined) throw new Error('pick from empty list');
    return x;
  }

  choose(engine: Engine, state: GameState, player: PlayerId): Action {
    const legal = engine.legalActions(state, player);
    if (legal.length === 0) throw new Error(`RandomAi: no legal actions for p${player}`);
    const pass = legal.find((a) => a.type === 'pass');
    if (pass) {
      const responses = legal.filter((a) => a.type !== 'pass');
      if (responses.length > 0 && this.chance(this.opts.respondRate ?? 0.5))
        return this.pick(responses);
      return pass;
    }
    const end = legal.find((a) => a.type === 'endTurn');
    const others = legal.filter((a) => a.type !== 'endTurn');
    if (end && (others.length === 0 || this.chance(this.opts.endTurnRate ?? 0.1))) return end;
    return this.pick(others.length > 0 ? others : legal);
  }
}
