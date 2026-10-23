// The "display state": a copy of the combat state that the screen advances one event at a time while it animates,
// so HP bars, Barrier, hand and intents change exactly when the matching animation plays. It never decides anything;
// when the replay ends the screen snaps to the engine's real state.

import {
  clone,
  scaledEnemyHp,
  tierMight,
  type CombatDb,
  type CombatEvent,
  type CombatState,
  type Side,
  type Unit,
} from '@sr/combat';

function unitFromDef(
  db: CombatDb,
  id: string,
  defId: string,
  side: Side,
  s: CombatState,
  hero: boolean,
): Unit {
  const d = db.units[defId];
  if (!d) throw new Error(`display: unknown unit "${defId}"`);
  const tier = s.tier;
  const scaled = !hero;
  const hp = scaled ? scaledEnemyHp(d.maxHp, tier, s.enemyHpPct) : d.maxHp;
  const statuses = { ...(d.statuses ?? {}) };
  if (scaled && d.brain.kind === 'enemy' && tierMight(tier) > 0)
    statuses.might = (statuses.might ?? 0) + tierMight(tier);
  return {
    id,
    def: defId,
    name: d.name,
    kind: d.brain.kind === 'ally' ? 'ally' : 'enemy',
    side,
    hp,
    maxHp: hp,
    barrier: 0,
    statuses,
    taunt: d.taunt === true,
    intent: null,
    moveCount: 0,
    pat: '',
    patCount: 0,
    lowPct: 100,
    dmgPct: scaled ? s.enemyDmgPct : 100,
    lastMoves: [],
  };
}

function unitOf(s: CombatState, id: string): Unit | undefined {
  return s.sides.a.units.find((u) => u.id === id) ?? s.sides.b.units.find((u) => u.id === id);
}

type Pile = 'hand' | 'draw' | 'discard' | 'exhausted';
const PILES: Pile[] = ['hand', 'draw', 'discard', 'exhausted'];

/** Move a card instance to another pile, wherever it currently is (adding it if the display never saw it). */
function moveCard(
  s: CombatState,
  side: Side,
  id: string,
  def: string,
  to: Pile,
  front = false,
): void {
  const sd = s.sides[side];
  let inst = { id, card: def };
  for (const p of PILES) {
    const i = sd[p].findIndex((c) => c.id === id);
    if (i >= 0) {
      inst = sd[p].splice(i, 1)[0] ?? inst;
      break;
    }
  }
  if (!def) def = inst.card;
  inst = { id, card: inst.card || def };
  if (front) sd[to].unshift(inst);
  else sd[to].push(inst);
}

/** Advance `s` (a clone owned by the screen) by one engine event. */
export function reduceEvent(db: CombatDb, s: CombatState, e: CombatEvent): void {
  switch (e.type) {
    case 'turnStart':
      s.active = e.side;
      s.turn = e.turn;
      return;
    case 'draw':
      moveCard(s, e.side, e.card, e.def, 'hand');
      return;
    case 'burn':
    case 'discard':
      moveCard(s, e.side, e.card, e.def, e.type === 'burn' ? 'discard' : 'discard');
      return;
    case 'exhaust':
      moveCard(s, e.side, e.card, e.def, 'exhausted');
      return;
    case 'addCard':
      moveCard(s, e.side, e.card, e.def, e.to === 'hand' ? 'hand' : e.to, e.to === 'draw');
      return;
    case 'shuffle': {
      const sd = s.sides[e.side];
      sd.draw.push(...sd.discard);
      sd.discard = [];
      return;
    }
    case 'mana':
      s.sides[e.side].mana = e.mana;
      return;
    case 'play':
      moveCard(s, e.side, e.card, e.def, 'discard');
      return;
    case 'snareSet': {
      const sd = s.sides[e.side];
      const i = sd.discard.findIndex((c) => c.id === e.snare);
      const inst = i >= 0 ? sd.discard.splice(i, 1)[0] : undefined;
      sd.snares.push({ id: e.snare, card: inst?.card ?? '' });
      return;
    }
    case 'snareSprung': {
      const sd = s.sides[e.side];
      sd.snares = sd.snares.filter((x) => x.id !== e.snare);
      sd.discard.push({ id: e.snare, card: e.card });
      return;
    }
    case 'damage': {
      const u = unitOf(s, e.target);
      if (!u) return;
      u.barrier = Math.max(0, u.barrier - e.blocked);
      u.hp = Math.max(0, u.hp - e.lost);
      return;
    }
    case 'barrier': {
      const u = unitOf(s, e.target);
      if (u) u.barrier = e.total;
      return;
    }
    case 'barrierDrop': {
      const u = unitOf(s, e.target);
      if (u) u.barrier = 0;
      return;
    }
    case 'heal': {
      const u = unitOf(s, e.target);
      if (u) u.hp = Math.min(u.maxHp, u.hp + e.amount);
      return;
    }
    case 'status': {
      const u = unitOf(s, e.target);
      if (!u) return;
      if (e.total <= 0) delete u.statuses[e.status];
      else u.statuses[e.status] = e.total;
      return;
    }
    case 'summon': {
      const sd = s.sides[e.side];
      const u = unitFromDef(db, e.unit, e.def, e.side, s, sd.hero !== null);
      sd.units.splice(Math.min(e.index, sd.units.length), 0, u);
      return;
    }
    case 'died':
      for (const side of ['a', 'b'] as const)
        s.sides[side].units = s.sides[side].units.filter((u) => u.id !== e.unit);
      return;
    case 'intent': {
      const u = unitOf(s, e.unit);
      if (u) u.intent = { move: e.move, target: e.target };
      return;
    }
    case 'act':
    case 'skip': {
      // an enemy that acts (or is stunned) spends the intent it was showing
      const u = unitOf(s, e.unit);
      if (u && u.kind === 'enemy') u.intent = null;
      return;
    }
    case 'potion':
      {
        // by name, not position: the belt on screen may lag the engine's
        const belt = s.sides[e.side].potions;
        const i = belt.indexOf(e.potion);
        if (i >= 0) belt.splice(i, 1);
      }
      return;
    case 'gameOver':
      s.winner = e.winner;
      return;
    default:
      return;
  }
}

/** A fresh display copy of a state. */
export const displayCopy = (s: CombatState): CombatState => clone(s);

/**
 * The display state at the very start of a fight: like the real state, but with nobody holding cards yet, so the
 * opening draw plays out as the events replay.
 */
export function startingDisplay(s: CombatState): CombatState {
  const d = clone(s);
  for (const side of ['a', 'b'] as const) {
    d.sides[side].draw = [...d.sides[side].draw, ...d.sides[side].hand];
    d.sides[side].hand = [];
    d.sides[side].mana = 0;
  }
  return d;
}
