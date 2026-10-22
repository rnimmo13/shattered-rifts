// Static evaluation of a (belief) game state from one player's point of view. Higher is better.

import type { CardDb, Engine, GameState, InstanceId, PlayerId } from '@sr/engine';
import type { Personality } from './personality';

export const WIN = 1_000_000;
const DRAW = -500;

/** Essence is worth its face value, and much more when it is low. */
function essenceValue(e: number): number {
  const v = Math.min(e, 40);
  return v - 1.5 * Math.max(0, 10 - v);
}

function unitValue(engine: Engine, s: GameState, id: InstanceId): number {
  const c = s.cards[id];
  if (!c) return 0;
  const st = engine.stats(s, id);
  let v = st.power + 0.55 * Math.max(0, st.guard);
  const k = new Set(st.keywords);
  if (k.has('guardian')) v += 1.5;
  if (k.has('shield')) v += 2;
  if (k.has('blitz')) v += 0.5;
  if (k.has('pierce')) v += 0.5;
  if (k.has('lifebind')) v += 1;
  if (k.has('ward')) v += 1;
  if (k.has('veiled')) v += 1.5;
  if (c.stunTurn !== 0 && c.stunTurn >= s.turn) v -= 1.5;
  if (c.corrode) v -= c.corrode;
  return v;
}

export { unitValue };

export function evaluate(
  engine: Engine,
  db: CardDb,
  s: GameState,
  me: PlayerId,
  p: Personality,
): number {
  if (s.winner !== null) return s.winner === me ? WIN : s.winner === 'draw' ? DRAW : -WIN;
  const opp: PlayerId = me === 0 ? 1 : 0;
  const mine = s.players[me];
  const theirs = s.players[opp];

  let score = essenceValue(mine.essence) - p.aggression * essenceValue(theirs.essence);

  const units = (ps: typeof mine) => ps.units.filter((id): id is InstanceId => !!id);
  for (const id of units(mine)) score += unitValue(engine, s, id);
  for (const id of units(theirs)) score -= unitValue(engine, s, id);

  // cards in hand are resources; the opponent's hand size is public
  score += 1.2 * p.valueHoarding * (mine.hand.length - theirs.hand.length);

  // permanents: my set cards / relics / rifts are worth keeping; theirs are a threat
  const backrow = (ps: typeof mine) => ps.backrow.filter(Boolean).length;
  score += 2.5 * backrow(mine) + (mine.rift ? 3 : 0);
  score -= 2 * backrow(theirs) + (theirs.rift ? 3 : 0);

  // held Aether is only worth something if I can use it on their turn
  const holdsResponses =
    mine.backrow.some((id) => id && s.cards[id]?.faceDown) ||
    mine.hand.some((id) => {
      const c = s.cards[id];
      return !!c && !!db[c.cardId]?.keywords?.includes('swift');
    });
  if (holdsResponses) score += 0.3 * mine.aether;

  // lethal pressure, both ways
  const ready = (ps: typeof mine) =>
    units(ps).reduce((n, id) => {
      const c = s.cards[id];
      if (!c || c.faceDown || c.attackedTurn === s.turn) return n;
      const st = engine.stats(s, id);
      const canMove = c.arrivedTurn < s.turn || st.keywords.includes('blitz');
      return canMove && c.stunTurn !== s.turn ? n + st.power : n;
    }, 0);
  const guarded = (ps: typeof mine) =>
    units(ps).some((id) => {
      const c = s.cards[id];
      return !!c && !c.faceDown && engine.stats(s, id).keywords.includes('guardian');
    });
  if (s.active === me && !guarded(theirs) && ready(mine) >= theirs.essence) score += 40;
  const theirPower = units(theirs).reduce(
    (n, id) => (s.cards[id]?.faceDown ? n : n + engine.stats(s, id).power),
    0,
  );
  if (!guarded(mine) && theirPower >= mine.essence) score -= 20;

  return score;
}
