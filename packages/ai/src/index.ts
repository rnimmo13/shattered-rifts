// @sr/ai: AI players. They only choose among legalActions() for their own seat and only read
// the game through viewFor(state, player), so they never see hidden information.

export type { AiPlayer } from './types';
export { RandomAi, type RandomAiOptions } from './random';
export { HeuristicAi, type HeuristicAiOptions } from './heuristic';
export { PERSONALITIES, type Personality, type PersonalityId } from './personality';
export { beliefFromView, withPlaceholders, PLACEHOLDERS } from './belief';
export { evaluate } from './evaluate';
