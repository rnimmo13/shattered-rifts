// Seeded random-legal-move driver for determinism and property tests.

import type { Engine } from '../engine';
import type { Action, GameConfig, GameEvent, GameState } from '../types';
import { nextInt, seedRng } from '../rng';

export interface RandomGameResult {
  state: GameState;
  log: Action[];
  events: GameEvent[];
  steps: number;
}

export interface RandomGameOptions {
  maxSteps?: number;
  /** Called after every action (invariant checks). */
  check?: (s: GameState, events: GameEvent[]) => void;
  /** Probability (0–1) of ending the turn when other actions exist. Keeps random games moving. */
  endTurnBias?: number;
}

export function randomGame(
  engine: Engine,
  cfg: GameConfig,
  driverSeed: string,
  opts: RandomGameOptions = {},
): RandomGameResult {
  const rng = seedRng(`driver:${driverSeed}`);
  let state = engine.createGame(cfg);
  const log: Action[] = [];
  const events: GameEvent[] = [];
  const maxSteps = opts.maxSteps ?? 20_000;
  const bias = opts.endTurnBias ?? 0.15;
  let steps = 0;
  for (; steps < maxSteps; steps++) {
    const p = engine.toAct(state);
    if (p === null) break;
    const legal = engine.legalActions(state, p);
    if (legal.length === 0) throw new Error(`No legal actions for p${p} but toAct says so`);
    const end = legal.find((a) => a.type === 'endTurn');
    const others = legal.filter((a) => a.type !== 'endTurn');
    let action: Action;
    if (end && (others.length === 0 || nextInt(rng, 1000) < bias * 1000)) action = end;
    else
      action = (others.length > 0 ? others : legal)[
        nextInt(rng, others.length > 0 ? others.length : legal.length)
      ] as Action;
    const r = engine.applyAction(state, action);
    state = r.state;
    log.push(action);
    events.push(...r.events);
    opts.check?.(state, r.events);
  }
  return { state, log, events, steps };
}

/** Replays an action log from a config. */
export function replay(engine: Engine, cfg: GameConfig, log: readonly Action[]): GameState {
  let state = engine.createGame(cfg);
  for (const a of log) state = engine.applyAction(state, a).state;
  return state;
}
