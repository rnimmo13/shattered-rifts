import type { Action, Engine, GameState, PlayerId } from '@sr/engine';

export interface AiPlayer {
  readonly name: string;
  choose(engine: Engine, state: GameState, player: PlayerId): Action;
}
