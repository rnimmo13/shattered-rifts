// The duel session: runs the pure engine and the AI for one match. No React, no Pixi, no clock.
//
// The human is always seat 0. The session applies the human's chosen action, then keeps the AI moving
// (one action at a time) until the human has a real decision or the game ends. After every applied action it
// emits a Batch (the events, redacted for the human, plus the views before and after) and WAITS for the UI to
// finish animating it before continuing, so the board always shows the game in order. The logic is already
// resolved by then: animation is replay only and never gates a rule (golden rule 4).

import {
  createEngine,
  RulesError,
  type Action,
  type Engine,
  type GameEvent,
  type GameState,
  type GameView,
  type PlayerId,
} from '@sr/engine';
import {
  CARD_DB,
  character,
  deckList,
  enemy,
  starterDeck,
  type CharacterId,
  type EnemyDef,
} from '@sr/content';
import { HeuristicAi, PERSONALITIES, type AiPlayer } from '@sr/ai';

export const HUMAN: PlayerId = 0;
export const AI_SEAT: PlayerId = 1;

export interface DuelSetup {
  seed: string;
  character: CharacterId;
  enemyId: string;
}

export interface Batch {
  actor: PlayerId;
  /** Events redacted for the human (a face-down card's id is '?'). */
  events: GameEvent[];
  before: GameView;
  after: GameView;
}

export interface SessionHooks {
  /** Resolve when the UI has finished animating this batch. */
  onBatch: (b: Batch) => Promise<void>;
  /** The human now has a decision (or the game ended). */
  onIdle: () => void;
  /** Something unexpected happened (engine error); the match cannot continue. */
  onError: (e: unknown) => void;
}

/**
 * Auto-pass rule (DECISIONS #47): when the only things you could do are Pass and the free Rift Spark, you
 * are passed automatically, unless Spark's +1 Mana would let you afford a response you could not otherwise.
 */
export function isOnlyPassOrSpark(legal: readonly Action[], state: GameState): boolean {
  const spark = state.rules.secondPlayerCard;
  return legal.every(
    (a) =>
      a.type === 'pass' ||
      (a.type === 'play' && spark !== null && state.cards[a.card]?.cardId === spark),
  );
}

/** Would one more Mana make a face-down trap or a Swift card in hand affordable? (Approximation from printed costs.) */
export function sparkEnablesResponse(state: GameState): boolean {
  const me = state.players[HUMAN];
  const next = me.mana + me.tempMana + 1;
  const costIs = (id: string) => {
    const c = state.cards[id];
    return c ? CARD_DB[c.cardId]?.cost === next : false;
  };
  for (const id of me.backrow) {
    if (id && state.cards[id]?.faceDown && costIs(id)) return true;
  }
  for (const id of me.hand) {
    const def = CARD_DB[state.cards[id]?.cardId ?? ''];
    if (def?.keywords?.includes('swift') && def.cost === next) return true;
  }
  return false;
}

export class DuelSession {
  readonly engine: Engine;
  readonly enemy: EnemyDef;
  private state: GameState;
  private readonly ai: AiPlayer;
  private busy = false;
  private stopped = false;

  constructor(
    readonly setup: DuelSetup,
    private readonly hooks: SessionHooks,
  ) {
    this.engine = createEngine(CARD_DB);
    this.enemy = enemy(setup.enemyId);
    const mine = character(setup.character);
    this.state = this.engine.createGame({
      seed: setup.seed,
      players: [
        { deck: starterDeck(setup.character), sigil: mine.sigil, name: mine.name },
        { deck: deckList(this.enemy), essence: this.enemy.essence, name: this.enemy.name },
      ],
    });
    this.ai = new HeuristicAi({
      db: CARD_DB,
      seed: `${setup.seed}:ai`,
      personality: PERSONALITIES[this.enemy.personality],
    });
  }

  get raw(): GameState {
    return this.state;
  }

  view(): GameView {
    return this.engine.viewFor(this.state, HUMAN);
  }

  /** The human's legal actions right now (empty while the AI is thinking or the game is over). */
  legal(): Action[] {
    if (this.busy || this.stopped) return [];
    return this.engine.legalActions(this.state, HUMAN);
  }

  get over(): boolean {
    return this.state.winner !== null;
  }

  /** Begin the match: runs the AI until the human must decide (the AI may mulligan first). */
  async start(): Promise<void> {
    await this.pump();
  }

  /** Apply the human's action, then let the AI respond. */
  async submit(action: Action): Promise<void> {
    if (this.busy || this.stopped) return;
    if (action.player !== HUMAN) throw new Error('The human can only act as seat 0');
    this.busy = true;
    try {
      await this.apply(action);
      await this.pump();
    } catch (e) {
      // an illegal action is rejected before anything changes: stay in the match and re-offer the real options
      if (!(e instanceof RulesError)) {
        this.stopped = true;
        this.hooks.onError(e);
      }
    } finally {
      this.busy = false;
    }
    this.hooks.onIdle();
  }

  /** Stop animating and acting (the screen was left). */
  stop(): void {
    this.stopped = true;
  }

  private async pump(): Promise<void> {
    const wasBusy = this.busy;
    this.busy = true;
    try {
      for (let guard = 0; guard < 20_000 && !this.stopped; guard++) {
        if (this.state.winner !== null) break;
        const p = this.engine.toAct(this.state);
        if (p === null) break;
        if (p === HUMAN) {
          const legal = this.engine.legalActions(this.state, HUMAN);
          if (legal.length === 0) break;
          if (isOnlyPassOrSpark(legal, this.state) && !sparkEnablesResponse(this.state)) {
            const pass = legal.find((a) => a.type === 'pass');
            if (pass) {
              await this.apply(pass);
              continue;
            }
          }
          break;
        }
        // yield to the browser so the AI's thinking never freezes input or animation
        await new Promise<void>((r) => setTimeout(r, 0));
        const action = this.ai.choose(this.engine, this.state, p);
        await this.apply(action);
      }
    } catch (e) {
      this.stopped = true;
      this.hooks.onError(e);
    } finally {
      this.busy = wasBusy;
    }
    if (!wasBusy) this.hooks.onIdle();
  }

  private async apply(action: Action): Promise<void> {
    const before = this.engine.viewFor(this.state, HUMAN);
    const r = this.engine.applyAction(this.state, action);
    this.state = r.state;
    const after = this.engine.viewFor(this.state, HUMAN);
    await this.hooks.onBatch({
      actor: action.player,
      events: this.engine.eventsFor(r.events, HUMAN),
      before,
      after,
    });
  }
}
