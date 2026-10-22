// HeuristicAi: 1-ply search over a belief state built from viewFor() only.
//
//   legal actions → simulate each on the belief state (then let the chain resolve, assuming the
//   opponent passes) → evaluate the board → pick the best, shaped by the Personality.
//
// It never reads hidden information: the only inputs are legalActions() for its own seat and
// engine.viewFor(state, player). The "no peeking" test swaps the opponent's hidden cards and checks
// that its decisions don't change.

import {
  createEngine,
  nextInt,
  seedRng,
  stableStringify,
  type Action,
  type CardDb,
  type Engine,
  type GameState,
  type GameView,
  type PlayerId,
  type RngState,
} from '@sr/engine';
import { beliefFromView, withPlaceholders } from './belief';
import { evaluate, unitValue, WIN } from './evaluate';
import { PERSONALITIES, type Personality } from './personality';
import type { AiPlayer } from './types';

export interface HeuristicAiOptions {
  db: CardDb;
  seed: string;
  personality?: Personality;
  /** Cap on candidate actions simulated per decision (large target lists are sampled). */
  maxCandidates?: number;
}

const SETTLE_LIMIT = 300;

export class HeuristicAi implements AiPlayer {
  readonly name: string;
  private readonly db: CardDb;
  private readonly sim: Engine;
  private readonly rng: RngState;
  private readonly seed: string;
  private readonly p: Personality;
  private readonly maxCandidates: number;

  constructor(opts: HeuristicAiOptions) {
    this.p = opts.personality ?? PERSONALITIES.balanced;
    this.name = `Heuristic (${this.p.name})`;
    this.db = withPlaceholders(opts.db);
    this.sim = createEngine(this.db);
    this.seed = opts.seed;
    this.rng = seedRng(`heuristic:${opts.seed}`);
    this.maxCandidates = opts.maxCandidates ?? 60;
  }

  choose(engine: Engine, state: GameState, player: PlayerId): Action {
    // the engine hands over exactly what a player may know: their view and their legal actions
    return this.chooseFromView(
      engine.viewFor(state, player),
      engine.legalActions(state, player),
      player,
    );
  }

  /**
   * The decision core. Its ONLY inputs are the player's view and their legal actions, so it cannot
   * read hidden information by construction (it never receives the real GameState).
   */
  chooseFromView(view: GameView, real: Action[], player: PlayerId): Action {
    if (real.length === 0) throw new Error(`HeuristicAi: no legal actions for p${player}`);
    if (real.length === 1) return real[0] as Action;
    const belief = beliefFromView(view, `${this.seed}:${view.turn}:${nextInt(this.rng, 1 << 30)}`);
    const legal = this.sim.legalActions(belief, player);
    const pick = this.decide(belief, legal, player);

    // safety net: whatever we chose must be legal in the real game (it should always be)
    const key = stableStringify(pick);
    const match = real.find((a) => stableStringify(a) === key);
    return match ?? (real[nextInt(this.rng, real.length)] as Action);
  }

  // --- decisions ------------------------------------------------------------------------------

  private decide(s: GameState, legal: Action[], me: PlayerId): Action {
    if (legal.length === 1) return legal[0] as Action;
    const pend = s.pending;
    if (pend?.kind === 'mulligan') return this.mulligan(s, legal, me);
    if (pend?.kind === 'scry') return this.scry(s, legal, me);
    if (pend?.kind === 'chooseCards' && pend.purpose === 'destroySet')
      return this.destroySet(s, legal);
    if (pend) return this.best(this.score(s, legal, me)).a;
    if (s.window) return this.respond(s, legal, me);
    return this.mainPhase(s, legal, me);
  }

  private mainPhase(s: GameState, legal: Action[], me: PlayerId): Action {
    const end = legal.find((a) => a.type === 'endTurn');
    const acts = legal.filter((a) => a.type !== 'endTurn');
    if (acts.length === 0) return end ?? (legal[0] as Action);
    const scored = this.score(s, acts, me);
    const baseline = evaluate(this.sim, this.db, s, me, this.p);
    const top = this.best(scored);
    if (end && top.v <= baseline + 0.05) return end;
    return this.maybeMistake(scored, top).a;
  }

  private respond(s: GameState, legal: Action[], me: PlayerId): Action {
    const pass = legal.find((a) => a.type === 'pass') as Action;
    const others = legal.filter((a) => a.type !== 'pass');
    if (others.length === 0) return pass;
    const base = this.value(s, pass, me);
    const scored = this.score(s, others, me);
    const top = this.best(scored);
    if (top.v <= base + 0.5) return pass;
    const lethalPrevention = base <= -WIN / 2 && top.v > base;
    if (lethalPrevention) return top.a;
    return nextInt(this.rng, 1000) < this.p.trapHappiness * 1000 ? top.a : pass;
  }

  /** Keep cheap cards, at most two 4–5 drops, and ship the rest back. */
  private mulligan(s: GameState, legal: Action[], me: PlayerId): Action {
    const hand = s.players[me].hand;
    const costOf = (id: string) => this.db[s.cards[id]?.cardId ?? '']?.cost ?? 0;
    const sorted = [...hand].sort((a, b) => costOf(b) - costOf(a));
    const toss: string[] = [];
    let mid = 0;
    for (const id of sorted) {
      const c = costOf(id);
      if (c >= 6) toss.push(id);
      else if (c >= 4) {
        if (mid >= 2) toss.push(id);
        else mid++;
      }
    }
    const kept = hand.filter((id) => !toss.includes(id));
    if (kept.length > 0 && !kept.some((id) => costOf(id) <= 2)) {
      const worst = [...kept].sort((a, b) => costOf(b) - costOf(a))[0];
      if (worst) toss.push(worst);
    }
    const want = hand.filter((id) => toss.includes(id));
    return (
      legal.find(
        (a) => a.type === 'mulligan' && stableStringify(a.cards) === stableStringify(want),
      ) ?? (legal[0] as Action)
    );
  }

  /** Cheap cards on top (cheapest first), expensive ones to the bottom early in the game. */
  private scry(s: GameState, legal: Action[], me: PlayerId): Action {
    const pend = s.pending;
    if (pend?.kind !== 'scry') return legal[0] as Action;
    const cost = (id: string) => this.db[s.cards[id]?.cardId ?? '']?.cost ?? 0;
    const limit = Math.max(3, s.players[me].maxMana + 2);
    const top = pend.cards.filter((id) => cost(id) <= limit).sort((a, b) => cost(a) - cost(b));
    const bottom = pend.cards.filter((id) => cost(id) > limit);
    return (
      legal.find(
        (a) =>
          a.type === 'scry' &&
          stableStringify(a.top) === stableStringify(top) &&
          stableStringify(a.bottom) === stableStringify(bottom),
      ) ?? (legal[0] as Action)
    );
  }

  /** Netrunner-style "look and destroy": take the most expensive eligible card. */
  private destroySet(s: GameState, legal: Action[]): Action {
    const cost = (id: string) => this.db[s.cards[id]?.cardId ?? '']?.cost ?? 0;
    let best: Action | undefined;
    let bestCost = -1;
    for (const a of legal) {
      if (a.type !== 'chooseCards' || a.cards.length === 0) continue;
      const c = Math.max(...a.cards.map(cost));
      if (c > bestCost) {
        bestCost = c;
        best = a;
      }
    }
    return best ?? (legal[0] as Action);
  }

  // --- scoring --------------------------------------------------------------------------------

  private score(s: GameState, actions: Action[], me: PlayerId): { a: Action; v: number }[] {
    let pool = actions;
    if (pool.length > this.maxCandidates) {
      // Keep a few variants of each distinct move (a lethal attack on the face must never be
      // sampled away), then thin what's left evenly if it's still too many.
      const perMove = new Map<string, number>();
      const kept = actions.filter((a) => {
        const move =
          a.type === 'attack'
            ? `attack:${a.attacker}`
            : 'card' in a
              ? `${a.type}:${a.card}`
              : a.type;
        const n = perMove.get(move) ?? 0;
        // always keep attacks on the face and the first few variants of anything else
        if (a.type === 'attack' && a.target === 'face') return true;
        perMove.set(move, n + 1);
        return n < 6;
      });
      pool = kept;
      if (pool.length > this.maxCandidates) {
        const step = pool.length / this.maxCandidates;
        pool = Array.from(
          { length: this.maxCandidates },
          (_, i) => kept[Math.floor(i * step)] as Action,
        );
      }
    }
    return pool.map((a) => ({ a, v: this.value(s, a, me) }));
  }

  private best(scored: { a: Action; v: number }[]): { a: Action; v: number } {
    return scored.reduce((b, x) => (x.v > b.v ? x : b), scored[0] as { a: Action; v: number });
  }

  private maybeMistake(
    scored: { a: Action; v: number }[],
    top: { a: Action; v: number },
  ): { a: Action; v: number } {
    if (scored.length < 2 || nextInt(this.rng, 1000) >= this.p.mistakeRate * 1000) return top;
    const ranked = [...scored].sort((x, y) => y.v - x.v).slice(0, 3);
    return ranked[nextInt(this.rng, ranked.length)] as { a: Action; v: number };
  }

  /** The value of taking `a` now: simulate it, let the chain resolve, evaluate the result. */
  private value(s: GameState, a: Action, me: PlayerId): number {
    try {
      const after = this.settle(this.sim.applyAction(s, a).state, me, 1);
      let v = evaluate(this.sim, this.db, after, me, this.p);
      if (a.type === 'attack') v -= this.attackFear(s, a, me);
      return v;
    } catch {
      return -Infinity;
    }
  }

  /** Attacking into set cards while the opponent holds Mana is risky (a human would think so). */
  private attackFear(s: GameState, a: Extract<Action, { type: 'attack' }>, me: PlayerId): number {
    const opp = s.players[me === 0 ? 1 : 0];
    const sets = opp.backrow.filter((id) => id && s.cards[id]?.faceDown).length;
    if (sets === 0 || this.p.caution <= 0) return 0;
    const held = opp.mana + opp.tempMana >= 1 ? 1 : 0.3;
    return this.p.caution * 0.35 * Math.min(2, sets) * held * unitValue(this.sim, s, a.attacker);
  }

  /**
   * Resolves the chain (the opponent always passes) until the game needs a real decision on my
   * main phase. My own prompts are answered by trying each answer when `depth` allows.
   */
  private settle(s0: GameState, me: PlayerId, depth: number): GameState {
    let s = s0;
    for (let i = 0; i < SETTLE_LIMIT; i++) {
      const p = this.sim.toAct(s);
      if (p === null || s.winner !== null) return s;
      const legal = this.sim.legalActions(s, p);
      if (legal.length === 0) return s;
      let act: Action | undefined;
      if (s.pending) {
        if (p === me && depth > 0 && legal.length > 1) {
          let bestV = -Infinity;
          for (const a of legal.slice(0, 12)) {
            let v: number;
            try {
              v = evaluate(
                this.sim,
                this.db,
                this.settle(this.sim.applyAction(s, a).state, me, depth - 1),
                me,
                this.p,
              );
            } catch {
              v = -Infinity;
            }
            if (v > bestV) {
              bestV = v;
              act = a;
            }
          }
        }
        act ??= legal.find((a) => a.type === 'chooseOptional' && a.accept) ?? legal[0];
      } else if (s.window) {
        act = legal.find((a) => a.type === 'pass');
      } else {
        return s; // someone's main phase: stop
      }
      if (!act) return s;
      s = this.sim.applyAction(s, act).state;
    }
    return s;
  }
}
