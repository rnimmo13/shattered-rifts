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

/** What the other player might do to me next turn, roughly (their hand is unknown): a base amount and some for each of their allies. */
function estimatedThreat(s: CombatState, me: Side): number {
  const allies = s.sides[other(me)].units.filter((u) => u.kind !== 'hero').length;
  return 10 + 6 * allies;
}

/** How good the position is for `me` at the end of a turn: the plain evaluation plus defence against what could come back. */
function value(db: CombatDb, s: CombatState, from: CombatState, me: Side): number {
  let v = evaluate(db, s, me);
  if (s.winner) return v;
  if (s.mode === 'pvp') {
    const hero = s.sides[me].units.find((u) => u.kind === 'hero');
    if (hero) v += Math.min(hero.barrier, estimatedThreat(s, me)) * 0.9;
  }
  // cards drawn or added by the plays are worth having (the cards played themselves leave the hand, which is not a loss)
  const mine = s.sides[me];
  const was = from.sides[me];
  v += (mine.hand.length - was.hand.length + (mine.played - was.played)) * 1.2;
  return v;
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
  const width = opts.width ?? 6;
  const depth = opts.depth ?? 10;
  let budget = opts.budget ?? 500;

  // stopping now (ending the turn here) is always an option; a line must beat it by a little to be worth the cards
  let best: { first: Action; score: number } = {
    first: { type: 'endTurn' },
    score: value(db, s, s, me) + 0.5,
  };
  let frontier: Line[] = [{ state: s, first: { type: 'endTurn' }, score: -Infinity }];
  const seen = new Set<string>([sig(s, me)]);
  for (let d = 0; d < depth && frontier.length > 0 && budget > 0; d++) {
    const next: Line[] = [];
    for (const line of frontier) {
      for (const a of legalActions(db, line.state)) {
        if (a.type !== 'play' && a.type !== 'pick') continue;
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
        const score = value(db, after, s, me);
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
