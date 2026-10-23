// What a client may see (hidden information removed) plus generated card / intent text. Presentation helpers only.

import { modifiedDamage, activePattern } from './engine';
import {
  other,
  clone,
  type CardDef,
  type CardId,
  type CardInst,
  type CombatDb,
  type CombatEvent,
  type CombatState,
  type Op,
  type Sel,
  type Side,
  type Unit,
  type UnitId,
} from './types';

export type IntentIcon = 'attack' | 'defend' | 'buff' | 'debuff' | 'summon' | 'special';

export interface IntentView {
  move: string;
  name: string;
  /** what the move does, in words (shown on hover) */
  text: string;
  icons: IntentIcon[];
  /** damage per hit as it will land on its current target, or null if it does not attack */
  damage: number | null;
  hits: number;
  target: UnitId | null;
}

export interface UnitView extends Unit {
  intentView: IntentView | null;
}

export interface SideView {
  id: Side;
  units: UnitView[];
  /** the viewer's own hand; null for the other side */
  hand: CardInst[] | null;
  handCount: number;
  drawCount: number;
  discardCount: number;
  exhaustedCount: number;
  discard: CardInst[] | null;
  mana: number;
  maxMana: number;
  /** a Snare's card is only known to its owner */
  snares: { id: string; card: CardId | null }[];
  hero: string | null;
  /** Potion ids (your own side only) and how many each side holds */
  potions: string[] | null;
  potionCount: number;
}

export interface CombatView {
  mode: 'pve' | 'pvp';
  turn: number;
  active: Side;
  winner: CombatState['winner'];
  me: Side;
  sides: Record<Side, SideView>;
}

function opIcons(ops: readonly Op[]): IntentIcon[] {
  const out = new Set<IntentIcon>();
  const foeSel = (to: Sel): boolean =>
    to === 'target' || to === 'allFoes' || to === 'randomFoe' || to === 'front';
  for (const o of ops) {
    if (o.op === 'damage' || o.op === 'loseHp') out.add('attack');
    else if (o.op === 'barrier') out.add('defend');
    else if (o.op === 'summon') out.add('summon');
    else if (o.op === 'status') out.add(foeSel(o.to) ? 'debuff' : 'buff');
    else if (o.op === 'heal') out.add('buff');
    else if (o.op === 'addCard') out.add('debuff');
    else out.add('special');
  }
  return [...out];
}

export function describeIntent(db: CombatDb, s: CombatState, u: Unit): IntentView | null {
  if (!u.intent) return null;
  const d = db.units[u.def];
  if (!d || d.brain.kind !== 'enemy') return null;
  const mv = d.brain.moves[u.intent.move];
  if (!mv) return null;
  const target =
    [...s.sides.a.units, ...s.sides.b.units].find((x) => x.id === u.intent?.target) ?? null;
  const dmg = mv.effects.filter((o): o is Extract<Op, { op: 'damage' }> => o.op === 'damage');
  const first = dmg[0];
  return {
    move: mv.id,
    name: mv.name,
    text: mv.effects.map((o) => opText(db, o, WHO_ENEMY)).join(' '),
    icons: opIcons(mv.effects),
    damage: first ? modifiedDamage(first.amount, u, first.to === 'target' ? target : null) : null,
    hits: first ? dmg.reduce((n, o) => n + (o.hits ?? 1), 0) : 0,
    target: u.intent.target,
  };
}

/** A hero's-eye view: the other side's hand, draw order and Snares stay hidden. */
export function viewFor(db: CombatDb, s: CombatState, me: Side): CombatView {
  const side = (id: Side): SideView => {
    const sd = s.sides[id];
    const own = id === me;
    return {
      id,
      units: sd.units.map((u) => ({ ...clone(u), intentView: describeIntent(db, s, u) })),
      hand: own ? clone(sd.hand) : null,
      handCount: sd.hand.length,
      drawCount: sd.draw.length,
      discardCount: sd.discard.length,
      exhaustedCount: sd.exhausted.length,
      discard: own ? clone(sd.discard) : null,
      mana: sd.mana,
      maxMana: sd.maxMana,
      snares: sd.snares.map((sn) => ({ id: sn.id, card: own ? sn.card : null })),
      hero: sd.hero,
      potions: own ? [...sd.potions] : null,
      potionCount: sd.potions.length,
    };
  };
  return {
    mode: s.mode,
    turn: s.turn,
    active: s.active,
    winner: s.winner,
    me,
    sides: { a: side('a'), b: side('b') },
  };
}

export { other, activePattern };

// --- generated rules text -----------------------------------------------------------------------------------------

const WHO: Record<Sel, string> = {
  target: '',
  self: ' to yourself',
  hero: ' to your hero',
  allFoes: ' to ALL enemies',
  randomFoe: ' to a random enemy',
  front: ' to the front enemy',
  allFriends: ' to all friends',
  attacker: ' to the attacker',
};
/** The same targets as seen from an enemy's move: "you" are the other side. */
const WHO_ENEMY: Record<Sel, string> = {
  target: '',
  self: ' to itself',
  hero: ' to its hero',
  allFoes: ' to ALL your units',
  randomFoe: ' to a random unit of yours',
  front: ' to your front unit',
  allFriends: ' to all its allies',
  attacker: ' to the attacker',
};
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function opText(db: CombatDb, o: Op, who: Record<Sel, string> = WHO): string {
  switch (o.op) {
    case 'damage':
      return `Deal ${o.amount} damage${o.hits && o.hits > 1 ? ` ${o.hits} times` : ''}${who[o.to]}.`;
    case 'loseHp':
      return `${o.to === 'self' ? 'Lose' : 'Take'} ${o.amount} HP${o.to === 'self' ? '' : who[o.to]}.`;
    case 'barrier':
      return `Gain ${o.amount} Barrier${o.to === 'self' ? '' : who[o.to]}.`;
    case 'heal':
      return `Heal ${o.amount}${o.to === 'self' ? '' : who[o.to]}.`;
    case 'status':
      return `${o.amount < 0 ? 'Remove' : 'Apply'} ${Math.abs(o.amount)} ${cap(o.status)}${o.to === 'self' ? '' : who[o.to]}.`;
    case 'draw':
      return `Draw ${o.amount} card${o.amount === 1 ? '' : 's'}.`;
    case 'mana':
      return `Gain ${o.amount} Mana.`;
    case 'summon':
      return `Summon ${db.units[o.unit]?.name ?? o.unit}.`;
    case 'addCard':
      return `Add ${db.cards[o.card]?.name ?? o.card} to ${o.side === 'self' ? 'your' : 'the enemy'} ${o.to === 'hand' ? 'hand' : o.to === 'draw' ? 'draw pile' : 'discard pile'}.`;
    case 'actAllies':
      return 'All your allies act now.';
    case 'prevent':
      return 'Cancel that attack.';
  }
}

export function cardText(db: CombatDb, c: CardDef): string {
  if (c.text) return c.text;
  const parts: string[] = [];
  if (c.kind === 'snare' && c.trigger) {
    parts.push(
      c.trigger.on === 'attacked'
        ? 'When you or an ally is attacked:'
        : c.trigger.on === 'hpLost'
          ? `When you lose ${c.trigger.min}+ HP at once:`
          : 'When the enemy summons:',
    );
  }
  parts.push(...c.effects.map((o) => opText(db, o)));
  if (c.exhaust) parts.push('Exhaust.');
  if (c.retain) parts.push('Retain.');
  return parts.join(' ');
}

/**
 * Events as `viewer` may see them: the other side's draws, discards and added cards lose their card identity, and a
 * Snare being set is just "a Snare" until it springs. Use this for anything sent to or shown to one player (PvP).
 */
export function eventsFor(
  db: CombatDb,
  events: readonly CombatEvent[],
  viewer: Side,
): CombatEvent[] {
  return events.map((e): CombatEvent => {
    switch (e.type) {
      case 'draw':
      case 'burn':
      case 'discard':
      case 'addCard':
        return e.side === viewer ? e : { ...e, def: '' };
      case 'play':
        return e.side !== viewer && db.cards[e.def]?.kind === 'snare' ? { ...e, def: '' } : e;
      default:
        return e;
    }
  });
}
