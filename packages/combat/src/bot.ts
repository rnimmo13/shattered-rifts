// A simple greedy bot: try every legal action one step ahead and keep the one that improves the position most.
// Used by balance sims, the CLI and tests (it knows nothing about specific cards, only about the state).

import { applyAction, legalActions } from './engine';
import { describeIntent } from './view';
import type { Action, CombatDb, CombatState, Side } from './types';
import { other, TRAIT_POWER } from './types';

function incoming(db: CombatDb, s: CombatState, me: Side): number {
  let total = 0;
  for (const u of s.sides[other(me)].units) {
    const iv = describeIntent(db, s, u);
    if (iv && iv.damage !== null) total += iv.damage * iv.hits;
  }
  return total;
}

/** How good the position is for `me` (higher is better). */
export function evaluate(db: CombatDb, s: CombatState, me: Side): number {
  if (s.winner === me) return 1e6;
  if (s.winner) return -1e6;
  const mine = s.sides[me];
  const theirs = s.sides[other(me)];
  const threat = s.mode === 'pve' ? incoming(db, s, me) : 0;
  let v = 0;
  for (const u of mine.units) {
    if (u.kind === 'hero') {
      v += u.hp + Math.min(u.barrier, threat) * 0.9;
      // being low on HP is worse than the raw number says
      v -= Math.max(0, 20 - u.hp) * 0.8;
    } else {
      v += 4 + u.hp * 0.35 + Math.min(u.barrier, 6) * 0.2;
    }
    v +=
      (u.statuses.might ?? 0) * 3 +
      (u.statuses.thorns ?? 0) * 1.5 +
      (u.statuses.shielded ?? 0) * 4 +
      (u.statuses.resonance ?? 0) * 3 +
      (u.statuses.mantra ?? 0) * 1.5 +
      (u.statuses.edge ?? 0) * 3 +
      (u.statuses.wrath ?? 0) * 3 +
      (u.statuses.calm ?? 0) * 2 +
      (u.statuses.radiant ?? 0) * 6 +
      (u.statuses.bracing ?? 0) * 4 +
      (u.statuses.ghostly ?? 0) * 5 +
      (u.statuses.steadfast ?? 0) * 3 +
      (u.statuses.armored ?? 0) * 3 +
      (u.statuses.ritual ?? 0) * 5 +
      (u.statuses.vigor ?? 0) * 1 +
      (u.statuses.twinned ?? 0) * 6 +
      (u.statuses.mirrored ?? 0) * 5 +
      (u.statuses.unbound ?? 0) * 8 +
      (u.statuses.fortified ?? 0) * 8 +
      (u.statuses.plating ?? 0) * 1 +
      (u.statuses.holdfast ?? 0) * 2;
    v -=
      (u.statuses.exposed ?? 0) * 2 +
      (u.statuses.faltering ?? 0) * 2 +
      (u.statuses.seared ?? 0) * 1.5 +
      (u.statuses.brittle ?? 0) * 1 +
      (u.statuses.doom ?? 0) * 0.5;
  }
  for (const u of theirs.units) {
    const doomed = (u.statuses.doom ?? 0) >= u.hp;
    v -= (doomed ? 0 : u.hp * 1.0 + u.barrier * 0.5 + 6) + (doomed ? 2 : 0);
    v +=
      (u.statuses.exposed ?? 0) * 2.5 +
      (u.statuses.faltering ?? 0) * 2 +
      (u.statuses.seared ?? 0) * 3;
    v += (u.statuses.stunned ?? 0) * 6;
    v += (u.statuses.brittle ?? 0) * 1.5;
    if (!doomed) v += Math.min(u.statuses.doom ?? 0, u.hp) * 0.9;
    v -=
      (u.statuses.might ?? 0) * 3 + (u.statuses.thorns ?? 0) * 1.5 + (u.statuses.shielded ?? 0) * 3;
  }
  v += mine.snares.length * 7;
  v += mine.nextMana * 3 + mine.nextDraw * 2.5;
  for (const c of [...mine.hand, ...mine.draw, ...mine.discard]) v += (c.bonus ?? 0) * 1.6;
  v += mine.stars * 1.5 + mine.powers.filter((p) => p.card !== TRAIT_POWER).length * 4;
  for (const rs of mine.runes) v += 3 + rs.charge * 0.5;
  return v;
}

/** The bot's choice for the side whose turn it is. */
export function chooseAction(db: CombatDb, s: CombatState): Action {
  const me = s.active;
  const base = evaluate(db, s, me);
  if (s.pending) {
    // a choice is owed: take the best-looking answer (there is always at least one)
    let pick: Action | null = null;
    let top = -Infinity;
    for (const a of legalActions(db, s)) {
      const v = evaluate(db, applyAction(db, s, a).state, me);
      if (v > top) {
        top = v;
        pick = a;
      }
    }
    return pick ?? { type: 'pick', cards: [] };
  }
  // two free draw cards can feed each other for ever: the bot always ends a turn after a generous number of plays
  if (s.sides[me].played >= 60) return { type: 'endTurn' };
  let best: Action = { type: 'endTurn' };
  let bestGain = 0.5; // must beat doing nothing by a little
  for (const a of legalActions(db, s)) {
    if (a.type !== 'play') continue;
    const after = applyAction(db, s, a).state;
    // the card itself leaves the hand; drawing more is worth something
    const handDelta = after.sides[me].hand.length - (s.sides[me].hand.length - 1);
    const gain =
      evaluate(db, after, me) -
      base +
      handDelta * 1.2 +
      (after.sides[me].mana > s.sides[me].mana ? 2 : 0);
    if (gain > bestGain) {
      bestGain = gain;
      best = a;
    }
  }
  return best;
}
