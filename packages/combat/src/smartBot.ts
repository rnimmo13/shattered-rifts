// A stronger bot than the greedy one, for piloting a ghost (a player's deck played by the computer). It plans a whole turn: from the
// position it tries the legal plays, then the plays after those, keeping the best few lines at every step (a beam search), and takes
// the first move of the line that leaves the best position at the end of the turn. So it can see that a cheap card first lets a
// bigger one follow, or that Mana is best spent on two cards and not one. Like the greedy bot it knows nothing about specific cards,
// only about the state; it only looks at its own side's choices and never at the other player's hidden hand. Pure and deterministic.

import { applyAction, legalActions } from './engine';
import { chooseAction, evaluate } from './bot';
import type { Action, CombatDb, CombatState, Side } from './types';
import { other, clone } from './types';
import { seedRng, shuffle } from './rng';

/** Stamp ghost results and simulations so different policies never share a balance sample. */
export const BOT_VERSION = 'synergy-3';
export const BOT_SEARCH = { width: 8, depth: 10, budget: 900 } as const;

/** Plan against a plausible unknown draw, never the live RNG or an opponent's secret cards.
 * Own deck contents are known; draw order is not. A pending revealed choice keeps its actual pool.
 * This is one deterministic belief sample, not perfect-information play or a learned policy. */
export function botPlanningState(db: CombatDb, state: CombatState): CombatState {
  const s = clone(state);
  const me = s.active;
  const mine = s.sides[me];
  const theirs = s.sides[other(me)];
  s.seed = `bot:${BOT_VERSION}:${me}:${s.turn}:${mine.played}`;
  s.rng = seedRng(s.seed);
  const revealed = new Set(s.pending?.pool ?? []);
  const unknown = mine.draw
    .filter((c) => !revealed.has(c.id))
    .sort((a, b) => a.card.localeCompare(b.card) || a.id.localeCompare(b.id));
  shuffle(s.rng, unknown);
  let next = 0;
  mine.draw = mine.draw.map((c) => (revealed.has(c.id) ? c : unknown[next++]!));
  // Neutral public prior, independent of the actual hidden identities and trap definitions.
  const prior = Object.values(db.cards).find(
    (c) => c.hero === theirs.hero && c.kind === 'attack',
  )?.id;
  const hidden = (cards: typeof theirs.hand, zone: string) =>
    cards.map((_, i) => ({
      id: `belief-${zone}-${i}`,
      card: prior ?? Object.keys(db.cards)[0]!,
    }));
  theirs.hand = hidden(theirs.hand, 'hand');
  theirs.draw = hidden(theirs.draw, 'draw');
  // (an enemy's Traps lie face up, DECISIONS #751: the bot may know them as the player does)
  theirs.snares = theirs.snares.filter((sn) => sn.owner);
  return s;
}

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

/** How many more of its own turns an Aura played now is likely to work for: more while both sides have most of their HP left. */
function auraTurnsLeft(s: CombatState, me: Side): number {
  const share = (side: Side): number => {
    const units = s.sides[side].units;
    const hp = units.reduce((n, u) => n + u.hp, 0);
    const max = units.reduce((n, u) => n + u.maxHp, 0);
    return max > 0 ? hp / max : 0;
  };
  const left = Math.min(share(other(me)), share(me));
  // (an Arena fight runs about ten turns a side; a Campaign fight about four)
  return s.mode === 'pvp'
    ? Math.min(6, Math.max(1, Math.ceil(8 * left)))
    : Math.min(4, Math.max(1, Math.ceil(4 * left)));
}

/**
 * What the Auras in play are worth (#704): each about its Mana cost in value for every turn it should still work, so a cheap Aura early is
 * worth more than one more Attack now, and the same Aura late is not. Knows nothing about the card beyond its cost (an X or 0-cost Aura
 * counts as 1); an Aura made of several triggers counts once. One that ends with this turn counts nothing.
 */
const AURA_VALUE_PER_MANA_TURN = 5;
function aurasValue(db: CombatDb, s: CombatState, me: Side): number {
  const powers = s.sides[me].powers.filter((p) => !p.card.startsWith('__') && !p.temp);
  if (powers.length === 0) return 0;
  const turns = auraTurnsLeft(s, me);
  let v = 0;
  for (const p of powers) {
    const card = db.cards[p.card];
    const parts = Math.max(1, card?.effects.filter((o) => o.op === 'power').length ?? 1);
    v += (Math.max(1, card?.cost ?? 1) * AURA_VALUE_PER_MANA_TURN * turns) / parts;
  }
  return v;
}

/** How good the position is for `me` at the end of a turn: the plain evaluation plus defence against what could come back. */
function value(db: CombatDb, s: CombatState, from: CombatState, me: Side): number {
  let v = evaluate(db, s, me);
  if (s.winner) return v;
  const mine = s.sides[me];
  const hero = mine.units.find((u) => u.kind === 'hero');
  if (hero && s.mode === 'pve') v += hero.hp * 1.5;
  if (hero)
    v +=
      (hero.statuses.spirit ?? 0) * 7 +
      (hero.statuses.keen ?? 0) * 4 +
      (hero.statuses.might ?? 0) * 2;
  v += mine.reserves * 2 + (mine.nextStars ?? 0) * 1.5;
  v += (mine.totems?.filter(Boolean).length ?? 0) * 6;
  for (const aura of mine.attackAuras ?? [])
    v +=
      (aura.amount +
        (aura.perSummons ? Math.floor((mine.summonedFight ?? 0) / aura.perSummons) : 0)) *
      (aura.scope === 'friends' ? 5 : 3);
  for (const unit of s.sides[other(me)].units) v += (unit.statuses.fracture ?? 0) * 1.5;
  v += aurasValue(db, s, me);
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
  return JSON.stringify([s.active, s.turn, s.rng, m, t.units, t.powers, t.totems, s.pending]);
}

/** The smart bot's choice for the side whose turn it is. */
export function chooseSmartAction(db: CombatDb, s: CombatState, opts: SmartOptions = {}): Action {
  s = botPlanningState(db, s);
  const me = s.active;
  if (!s.pending && s.sides[me].played >= 60) return { type: 'endTurn' };
  const width = opts.width ?? BOT_SEARCH.width;
  const depth = opts.depth ?? BOT_SEARCH.depth;
  let budget = opts.budget ?? BOT_SEARCH.budget;

  // stopping now (ending the turn here) is always an option; a line must beat it by a little to be worth the cards
  let best: { first: Action; score: number } = {
    first: s.pending ? chooseAction(db, s) : { type: 'endTurn' },
    score: s.pending ? -Infinity : stopValue(db, s, s, me) + 0.5,
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
