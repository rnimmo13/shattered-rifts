// One PvP match: the real combat engine, two seats, and the rules around it (whose turn, what is legal, who has won).
// Pure: the clock is passed in, nothing is stored. The Durable Object in apps/server keeps one of these per room, and
// the web client keeps one per match too, so both run the same engine on the same moves.

import {
  applyAction,
  chooseAction,
  createCombat,
  hashState,
  heroOf,
  type Action,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
} from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import {
  MAX_MISSED_TURNS,
  ARENA_HP_MULT,
  GAME_MS,
  SECOND_PLAYER_HP,
  TURN_MS,
  type EndReason,
  type Entry,
  type Seat,
} from './protocol';

export interface Outcome {
  winner: Seat | 'draw';
  reason: EndReason;
}

export type Accepted = {
  ok: true;
  seq: number;
  seat: Seat;
  action: Action;
  events: CombatEvent[];
  hash: string;
  /** epoch ms by which whoever acts next must act */
  deadline: number;
  /** set when this move ended the match */
  outcome: Outcome | null;
};
export type Refused = {
  ok: false;
  code: 'not-your-turn' | 'illegal' | 'out-of-order' | 'no-match';
  message: string;
};

export const other = (s: Seat): Seat => (s === 'a' ? 'b' : 'a');

/** A hero's HP in the Arena: ARENA_HP_MULT times its usual (nothing for a hero the game does not know). */
const arenaHp = (hero: string): { hp: number; maxHp: number } | Record<string, never> => {
  const base = COMBAT_DB.heroes[hero]?.maxHp ?? 0;
  return base > 0 ? { hp: base * ARENA_HP_MULT, maxHp: base * ARENA_HP_MULT } : {};
};

/**
 * The engine's setup for two entries: seat a is side a (moves first), seat b is side b (moves second, and starts with
 * SECOND_PLAYER_HP more HP and max HP). Both heroes have ARENA_HP_MULT times their usual HP.
 */
export function setupFor(seed: string, a: Entry, b: Entry): CombatSetup {
  const first = arenaHp(a.hero);
  const base = arenaHp(b.hero);
  const second =
    base.maxHp !== undefined
      ? { hp: base.maxHp + SECOND_PLAYER_HP, maxHp: base.maxHp + SECOND_PLAYER_HP }
      : {};
  return {
    seed,
    // Boons are left out of the Arena (DECISIONS #236): a deck carries its run's Boons (shown, and used by a ghost Warden in the
    // campaign), but a match between decks is cards only
    a: { hero: a.hero, deck: [...a.deck], boons: [], ...first },
    b: { hero: b.hero, deck: [...b.deck], boons: [], ...second },
  };
}

export class Match {
  state: CombatState;
  /** every accepted action, in order (seed + this list rebuilds the whole match) */
  readonly log: { seat: Seat; action: Action }[] = [];
  deadline: number;
  private outcome: Outcome | null = null;
  /** turns each seat has let run out in a row (kept by the room, so it survives a sleep) */
  missed: Record<Seat, number> = { a: 0, b: 0 };
  /** when the game began (epoch ms): it is called GAME_MS later */
  startedAt: number;

  constructor(
    readonly seed: string,
    readonly a: Entry,
    readonly b: Entry,
    now: number,
  ) {
    this.state = createCombat(COMBAT_DB, setupFor(seed, a, b)).state;
    this.deadline = now + TURN_MS;
    this.startedAt = now;
    this.finishIfOver();
  }

  /** When the game is called if nobody has won by then. */
  get endsAt(): number {
    return this.startedAt + GAME_MS;
  }

  /**
   * The game's time is up (GAME_MS): it is called for whoever has the larger share of their HP left (a share, not HP: the second
   * player starts with more). Equal shares: a draw. Nothing happens before the time.
   */
  callTime(now: number): Outcome | null {
    if (this.outcome || now < this.endsAt) return this.outcome;
    const share = (s: Seat): number => {
      const h = heroOf(this.state.sides[s]);
      return h ? h.hp / Math.max(1, h.maxHp) : 0;
    };
    const a = share('a');
    const b = share('b');
    this.outcome = { winner: a > b ? 'a' : b > a ? 'b' : 'draw', reason: 'time' };
    return this.outcome;
  }

  /** Whose move it is. */
  get active(): Seat {
    return this.state.active;
  }

  get over(): Outcome | null {
    return this.outcome;
  }

  get hash(): string {
    return hashState(this.state);
  }

  private finishIfOver(): Outcome | null {
    if (!this.outcome && this.state.winner) {
      const w = this.state.winner;
      this.outcome = { winner: w === 'a' || w === 'b' ? w : 'draw', reason: 'win' };
    }
    return this.outcome;
  }

  /**
   * A player's move. `seq` is the number they believe comes next (a stale or repeated message is refused, so a lagging
   * connection can never apply one move twice).
   */
  submit(seat: Seat, seq: number, action: Action, now: number): Accepted | Refused {
    if (this.outcome) return { ok: false, code: 'no-match', message: 'The match is over.' };
    if (seq !== this.log.length + 1)
      return { ok: false, code: 'out-of-order', message: 'That move arrived out of order.' };
    if (seat !== this.state.active)
      return { ok: false, code: 'not-your-turn', message: 'It is not your turn.' };
    return this.apply(seat, action, now, false);
  }

  private apply(seat: Seat, action: Action, now: number, auto: boolean): Accepted | Refused {
    let step;
    try {
      step = applyAction(COMBAT_DB, this.state, action);
    } catch (err) {
      return {
        ok: false,
        code: 'illegal',
        message: err instanceof Error ? err.message : 'Illegal move.',
      };
    }
    const turnPassed =
      step.state.active !== this.state.active || step.state.turn !== this.state.turn;
    this.state = step.state;
    this.log.push({ seat, action });
    // a player who acts on their own is not away
    if (!auto) this.missed[seat] = 0;
    if (turnPassed) this.deadline = now + TURN_MS;
    return {
      ok: true,
      seq: this.log.length,
      seat,
      action,
      events: step.events,
      hash: hashState(this.state),
      deadline: this.deadline,
      outcome: this.finishIfOver(),
    };
  }

  /**
   * The active player ran out of time: their turn ends for them (a pending choice is answered the way the bot would).
   * Two such turns in a row forfeit the match. Returns the moves made on their behalf, in order.
   */
  timeout(now: number): { moves: Accepted[]; outcome: Outcome | null } {
    const moves: Accepted[] = [];
    if (this.outcome) return { moves, outcome: this.outcome };
    const seat = this.state.active;
    this.missed[seat]++;
    if (this.missed[seat] >= MAX_MISSED_TURNS) {
      this.outcome = { winner: other(seat), reason: 'timeout' };
      return { moves, outcome: this.outcome };
    }
    // answer a pending choice first, then end the turn
    for (let i = 0; i < 4 && !this.outcome && this.state.active === seat; i++) {
      const action: Action = this.state.pending
        ? chooseAction(COMBAT_DB, this.state)
        : { type: 'endTurn' };
      const r = this.apply(seat, action, now, true);
      if (!r.ok) break;
      moves.push(r);
      if (action.type === 'endTurn') break;
    }
    return { moves, outcome: this.outcome };
  }

  /** Put back what a rebuilt match cannot learn from its moves: how it ended, and who has been away from the table. */
  restore(outcome: Outcome | null, missed: Record<Seat, number>): void {
    this.outcome = outcome;
    this.missed = { ...missed };
  }

  /** A player gives up, or is gone for good. */
  end(winner: Seat | 'draw', reason: EndReason): Outcome {
    this.outcome ??= { winner, reason };
    return this.outcome;
  }
}
