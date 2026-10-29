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
  inst = { ...inst, id, card: inst.card || def };
  if (front) sd[to].unshift(inst);
  else sd[to].push(inst);
}

/**
 * The card each side is playing right now: the screen puts it in the discard pile as it is played, but the engine only does once it is
 * done, so a reshuffle in the middle of it (its own draw) must leave it out. Cleared when another card, a potion or a turn change comes.
 */
const IN_PLAY = new WeakMap<CombatState, Partial<Record<Side, string>>>();

/** Advance `s` (a clone owned by the screen) by one engine event. */
export function reduceEvent(db: CombatDb, s: CombatState, e: CombatEvent): void {
  if (e.type === 'turnStart' || e.type === 'turnEnd' || e.type === 'potion') IN_PLAY.delete(s);
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
      const playing = IN_PLAY.get(s)?.[e.side];
      sd.draw.push(...sd.discard.filter((c) => c.id !== playing));
      sd.discard = sd.discard.filter((c) => c.id === playing);
      return;
    }
    case 'mana':
      s.sides[e.side].mana = e.mana;
      return;
    case 'maxMana':
      s.sides[e.side].maxMana = e.max;
      return;
    case 'stars':
      s.sides[e.side].stars = e.stars;
      return;
    case 'runeChannel':
      s.sides[e.side].runes.push({ rune: e.rune, charge: 0 });
      return;
    case 'runeGone': {
      const row = s.sides[e.side].runes;
      // (by its place in the row when the event says, since the newest totem can go first)
      const i =
        e.index !== undefined && row[e.index]?.rune === e.rune
          ? e.index
          : row.findIndex((r) => r.rune === e.rune);
      if (i >= 0) row.splice(i, 1);
      return;
    }
    case 'transform': {
      const inst = [
        ...s.sides[e.side].hand,
        ...s.sides[e.side].draw,
        ...s.sides[e.side].discard,
      ].find((c) => c.id === e.card);
      if (inst) {
        inst.card = e.def;
        if (e.costMod !== undefined) inst.costMod = e.costMod;
      }
      return;
    }
    case 'power': {
      const sd = s.sides[e.side];
      sd.powers.push({ id: `shown${sd.powers.length}`, card: e.card, when: 'turnStart', ops: [] });
      return;
    }
    case 'play': {
      IN_PLAY.set(s, { ...IN_PLAY.get(s), [e.side]: e.card });
      moveCard(s, e.side, e.card, e.def, 'discard');
      // the engine spends a discount on the play (as it does): a card that comes back costs full price
      const played = s.sides[e.side].discard.find((c) => c.id === e.card);
      if (played) delete played.costMod;
      return;
    }
    // (the Trickster's Suits: the pips light as the card is played, not when the whole step has played out)
    case 'suits':
      s.sides[e.side].suitsTurn = [...e.suits];
      return;
    // (the Spellblade's blade and the Shaman's totems change as the events play)
    case 'enchant':
      s.sides[e.side].enchants = [...e.enchants];
      return;
    case 'totems':
      s.sides[e.side].totems = [...e.totems];
      return;
    case 'command':
      s.sides[e.side].commanded = true;
      return;
    // (the Shaman's elements: the Trinity pips light as each spell is cast)
    case 'elements':
      s.sides[e.side].elementsTurn = [...e.elements];
      if (e.trinity) s.sides[e.side].trinityDone = true;
      return;
    // (the Monk's form: the panel follows the event; its steps come with the next resync)
    case 'form': {
      const sd = s.sides[e.side];
      // (a new form starts its steps again, as the engine does)
      if (sd.form !== e.form) sd.formSteps = [];
      sd.form = e.form;
      sd.formDone = e.done;
      return;
    }
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
      if (u) u.barrier = e.total ?? 0;
      return;
    }
    case 'heal': {
      const u = unitOf(s, e.target);
      if (!u) return;
      // (a companion grows instead of healing: its max HP comes with the event)
      if (e.maxHp !== undefined) u.maxHp = e.maxHp;
      u.hp = Math.min(u.maxHp, u.hp + e.amount);
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
    case 'phase': {
      // a phase is used up (its Barrier and Might follow as their own events)
      const u = unitOf(s, e.unit);
      if (u?.rise) {
        u.rise = u.rise.slice(1);
        if (!u.rise.length) delete u.rise;
      }
      return;
    }
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
 * opening draw plays out as the events replay. Pass the opening events that will be replayed: a unit they summon (Grave Chill's
 * turn-1 Thrall) is left out here, so it arrives with its event instead of standing there twice.
 */
export function startingDisplay(s: CombatState, events: readonly CombatEvent[] = []): CombatState {
  const d = clone(s);
  const summoned = new Set(events.flatMap((e) => (e.type === 'summon' ? [e.unit] : [])));
  for (const side of ['a', 'b'] as const) {
    d.sides[side].units = d.sides[side].units.filter((u) => !summoned.has(u.id));
    d.sides[side].draw = [...d.sides[side].draw, ...d.sides[side].hand];
    d.sides[side].hand = [];
    d.sides[side].mana = 0;
    // the Sigil's Arcana, totems and the like replay as events too
    d.sides[side].stars = 0;
    d.sides[side].runes = [];
    d.sides[side].powers = [];
  }
  return d;
}
