// A stronger bot than the greedy one, for piloting a ghost (a player's deck played by the computer). It plans a whole turn: from the
// position it tries the legal plays, then the plays after those, keeping the best few lines at every step (a beam search), and takes
// the first move of the line that leaves the best position at the end of the turn. So it can see that a cheap card first lets a
// bigger one follow, or that Mana is best spent on two cards and not one. Like the greedy bot it knows nothing about specific cards,
// only about the state; it only looks at its own side's choices and never at the other player's hidden hand. Pure and deterministic.

import { applyAction, legalActions } from './engine';
import { chooseAction, evaluate } from './bot';
import type { Action, CombatDb, CombatState, Side } from './types';
import { other } from './types';

export interface SmartOptions {
  /** how many lines are kept at each step */
  width?: number;
  /** how many cards deep a line may go */
  depth?: number;
  /** the most positions it will try (a limit on the thinking, so a move is quick) */
  budget?: number;
}

/**
 * What the other player might do to me next turn, roughly, from what anyone at the table can see (never their hidden cards): a base
 * amount, more for every card in their hand, every ally and every point of their Might.
 */
function estimatedThreat(s: CombatState, me: Side): number {
  const them = s.sides[other(me)];
  const allies = them.units.filter((u) => u.kind !== 'hero').length;
  const hero = them.units.find((u) => u.kind === 'hero');
  const might = hero?.statuses.might ?? 0;
  return 6 + 3 * them.hand.length + 6 * allies + 2 * might;
}

/** How good the position is for `me` at the end of a turn: the plain evaluation plus defence against what could come back. */
function value(db: CombatDb, s: CombatState, from: CombatState, me: Side): number {
  let v = evaluate(db, s, me);
  if (s.winner) return v;
  if (s.mode === 'pvp') {
    const hero = s.sides[me].units.find((u) => u.kind === 'hero');
    if (hero) v += Math.min(hero.barrier, estimatedThreat(s, me)) * 0.6;
  }
  return v + cardsGained(s, from, me);
}

/** Cards drawn or added by the plays are worth having (the cards played themselves leave the hand, which is not a loss). */
function cardsGained(s: CombatState, from: CombatState, me: Side): number {
  const mine = s.sides[me];
  const was = from.sides[me];
  return (mine.hand.length - was.hand.length + (mine.played - was.played)) * 1.2;
}

/**
 * How good it is to stop here: the turn is ended in the bot's head first, so what happens then counts (allies act, end-of-turn Auras
 * and totems, Traps that go off, Bleed and Fate), and the position is judged as the other player's turn begins. Only the bot's own
 * side and what is public are looked at; the other player's draw is never used.
 */
function stopValue(db: CombatDb, s: CombatState, from: CombatState, me: Side): number {
  if (s.winner || s.active !== me) return value(db, s, from, me);
  let last = s;
  let after: CombatState;
  try {
    // (a choice still owed is answered the greedy way first, so a line that stops on one is judged like every other line)
    for (let i = 0; i < 8 && last.pending; i++)
      last = applyAction(db, last, chooseAction(db, last)).state;
    if (last.winner || last.active !== me) return value(db, last, from, me);
    if (last.pending) return value(db, s, from, me);
    after = applyAction(db, last, { type: 'endTurn' }).state;
  } catch {
    return value(db, s, from, me);
  }
  if (after.winner) return value(db, after, from, me);
  // (the hand is discarded and the counters start again with a new turn: the cards are counted as they stood when the turn ended)
  return value(db, after, from, me) - cardsGained(after, from, me) + cardsGained(last, from, me);
}

interface Line {
  state: CombatState;
  first: Action;
  score: number;
}

/** A rough fingerprint of a position, so two orders of the same plays are only explored once. */
function sig(s: CombatState, me: Side): string {
  const m = s.sides[me];
  const t = s.sides[other(me)];
  return [
    m.mana,
    m.stars,
    m.hand
      .map((c) => c.id)
      .sort()
      .join(','),
    m.units.map((u) => `${u.id}:${u.hp}:${u.barrier}`).join('|'),
    t.units.map((u) => `${u.id}:${u.hp}:${u.barrier}`).join('|'),
    s.pending ? 'p' : '',
  ].join('/');
}

/** The smart bot's choice for the side whose turn it is. */
export function chooseSmartAction(db: CombatDb, s: CombatState, opts: SmartOptions = {}): Action {
  const me = s.active;
  // a choice that is owed is answered the way the greedy bot would (there is always at least one answer)
  if (s.pending) return chooseAction(db, s);
  if (s.sides[me].played >= 60) return { type: 'endTurn' };
  const width = opts.width ?? 8;
  const depth = opts.depth ?? 10;
  let budget = opts.budget ?? 900;

  // stopping now (ending the turn here) is always an option; a line must beat it by a little to be worth the cards
  let best: { first: Action; score: number } = {
    first: { type: 'endTurn' },
    score: stopValue(db, s, s, me) + 0.5,
  };
  let frontier: Line[] = [{ state: s, first: { type: 'endTurn' }, score: -Infinity }];
  const seen = new Set<string>([sig(s, me)]);
  for (let d = 0; d < depth && frontier.length > 0 && budget > 0; d++) {
    const next: Line[] = [];
    for (const line of frontier) {
      for (const a of legalActions(db, line.state)) {
        if (a.type !== 'play' && a.type !== 'pick' && a.type !== 'command') continue;
        if (budget-- <= 0) break;
        let after: CombatState;
        try {
          after = applyAction(db, line.state, a).state;
        } catch {
          continue;
        }
        // (the first move of the whole line, not of this step)
        const first = d === 0 ? a : line.first;
        // the turn went to the other player or the match is over: this line ends here
        const ended = after.winner !== null || after.active !== me;
        // (lines are compared as if the turn ended right after them; the search order uses the same score)
        const score = stopValue(db, after, s, me);
        if (score > best.score) best = { first, score };
        if (ended) continue;
        const key = sig(after, me);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ state: after, first, score });
      }
    }
    next.sort((x, y) => y.score - x.score);
    frontier = next.slice(0, width);
  }
  return best.first;
}
