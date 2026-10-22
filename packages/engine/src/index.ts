// @sr/engine: the pure, deterministic rules engine.
// Golden rule: no DOM, no Math.random, no Date, no I/O. All randomness goes through the seeded PRNG in state.

export const ENGINE_VERSION = '0.1.0';

export * from './types';
export { createEngine, DEFAULT_RULES, STARTING_ESSENCE, type Engine } from './engine';
export { viewFor, eventsFor, HIDDEN, type GameView, type RedactedPlayer } from './view';
export { hashState, stableStringify, RulesError, EngineCapError } from './util';
export { seedRng, nextInt, nextU32, shuffle, type RngState } from './rng';
