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
  type Metric,
  type Op,
  type Pending,
  type PowerState,
  type RuneState,
  type Scale,
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
  stars: number;
  runes: RuneState[];
  runeSlots: number;
  powers: { id: string; card: string; when: PowerState['when'] }[];
}

/** A choice you owe: the cards to choose among, resolved to their instances. */
export interface PendingView {
  kind: Pending['kind'];
  pool: CardInst[];
  min: number;
  max: number;
}

export interface CombatView {
  /** set when `me` must choose cards before anything else can happen */
  pending: PendingView | null;
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
    else if (o.op === 'draw' || o.op === 'mana' || o.op === 'stars' || o.op === 'stance')
      out.add('buff');
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

function pendingView(s: CombatState, me: Side): PendingView | null {
  const p = s.pending;
  if (!p || s.active !== me) return null;
  const sd = s.sides[me];
  const pile = p.kind === 'scry' ? sd.draw : sd.hand;
  const pool: CardInst[] = [];
  for (const id of p.pool) {
    const c = pile.find((x) => x.id === id);
    if (c) pool.push(clone(c));
  }
  return { kind: p.kind, pool, min: p.min, max: p.max };
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
      stars: sd.stars,
      runes: clone(sd.runes),
      runeSlots: sd.runeSlots,
      powers: sd.powers.map((p) => ({ id: p.id, card: p.card, when: p.when })),
    };
  };
  return {
    pending: pendingView(s, me),
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

/** How a metric reads in a card: `per` ("+2 per Barrier") and `equal` ("equal to your Barrier"). */
const METRIC_WORDS: Record<Metric, { per: string; equal: string }> = {
  barrier: { per: 'Barrier', equal: 'Barrier' },
  hp: { per: 'HP', equal: 'HP' },
  missingHp: { per: 'missing HP', equal: 'missing HP' },
  seared: { per: 'Seared', equal: 'Seared' },
  exposed: { per: 'Exposed', equal: 'Exposed' },
  might: { per: 'Might', equal: 'Might' },
  thorns: { per: 'Thorns', equal: 'Thorns' },
  mantra: { per: 'Mantra', equal: 'Mantra' },
  calm: { per: 'Calm', equal: 'Calm' },
  wrath: { per: 'Wrath', equal: 'Wrath' },
  radiant: { per: 'Radiant', equal: 'Radiant' },
  hand: { per: 'card in hand', equal: 'the number of cards in your hand' },
  drawPile: { per: 'card in your draw pile', equal: 'the number of cards in your draw pile' },
  discardPile: {
    per: 'card in your discard pile',
    equal: 'the number of cards in your discard pile',
  },
  exhausted: { per: 'exhausted card', equal: 'the number of cards you have exhausted' },
  allies: { per: 'ally', equal: 'the number of your allies' },
  foes: { per: 'enemy', equal: 'the number of enemies' },
  snares: { per: 'Snare set', equal: 'the number of Snares you have set' },
  stars: { per: 'Star', equal: 'your Stars' },
  runes: { per: 'rune', equal: 'the number of your runes' },
  mana: { per: 'Mana left', equal: 'your Mana' },
  played: { per: 'card played this turn', equal: 'the cards played this turn' },
  attacksPlayed: { per: 'Attack played this turn', equal: 'the Attacks played this turn' },
  discarded: { per: 'card discarded this turn', equal: 'the cards discarded this turn' },
  x: { per: 'Mana spent', equal: 'the Mana spent' },
  charge: { per: 'charge', equal: 'its charge' },
  bonus: { per: 'forge bonus', equal: 'its forge bonus' },
};
const UNIT_METRICS: readonly Metric[] = [
  'barrier',
  'hp',
  'missingHp',
  'seared',
  'exposed',
  'might',
  'thorns',
  'mantra',
  'calm',
  'wrath',
  'radiant',
];

/** Text for a number that may depend on the board: "6", "6 (+2 per Barrier)" or "equal to your Barrier". */
function amountText(n: number, sc: Scale | undefined): { num: string; equal: boolean } {
  if (!sc || sc.into === 'hits') return { num: String(n), equal: false };
  const w = METRIC_WORDS[sc.by];
  const m = sc.mult ?? 1;
  const unit = UNIT_METRICS.includes(sc.by);
  const whose = unit ? (sc.of === 'target' ? "the target's " : sc.of === 'each' ? 'their ' : 'your ') : '';
  if (n === 0 && m === 1) return { num: `${whose}${w.equal}`, equal: true };
  const times = m === 1 ? '' : `${m} `;
  const on = unit && sc.of === 'target' ? ' on the target' : unit && sc.of === 'each' ? ' on each' : '';
  return { num: `${n}${n ? ' ' : ''}(+${times}per ${w.per}${on})`.trim(), equal: false };
}

const WHEN_TEXT: Record<string, string> = {
  turnStart: 'At the start of your turn',
  turnEnd: 'At the end of your turn',
  play: 'Whenever you play a card',
  exhaust: 'Whenever a card is exhausted',
  discard: 'Whenever you discard a card',
  summon: 'Whenever you summon an ally',
  snare: 'Whenever one of your Snares springs',
  stance: 'Whenever you enter a stance',
};

export function opText(db: CombatDb, o: Op, who: Record<Sel, string> = WHO): string {
  const at = (n: number, sc: Scale | undefined): string => {
    const a = amountText(n, sc);
    return a.equal ? `equal to ${a.num}` : a.num;
  };
  switch (o.op) {
    case 'damage': {
      const a = amountText(o.amount, o.scale);
      const hitsMore =
        o.scale?.into === 'hits'
          ? ` ${(o.hits ?? 1) + 0} time${(o.hits ?? 1) === 1 ? '' : 's'} (+1 more per ${METRIC_WORDS[o.scale.by].per})`
          : '';
      const times = o.hits && o.hits > 1 && !hitsMore ? ` ${o.hits} times` : hitsMore;
      return a.equal
        ? `Deal damage equal to ${a.num}${times}${who[o.to]}.`
        : `Deal ${a.num} damage${times}${who[o.to]}.`;
    }
    case 'loseHp':
      return `${o.to === 'self' ? 'Lose' : 'Take'} ${at(o.amount, o.scale)} HP${o.to === 'self' ? '' : who[o.to]}.`;
    case 'barrier':
      return amountText(o.amount, o.scale).equal
        ? `Gain Barrier equal to ${amountText(o.amount, o.scale).num}${o.to === 'self' ? '' : who[o.to]}.`
        : `Gain ${at(o.amount, o.scale)} Barrier${o.to === 'self' ? '' : who[o.to]}.`;
    case 'heal':
      return `Heal ${at(o.amount, o.scale)}${o.to === 'self' ? '' : who[o.to]}.`;
    case 'status':
      return `${o.amount < 0 ? 'Remove' : 'Apply'} ${at(Math.abs(o.amount), o.scale)} ${cap(o.status)}${o.to === 'self' ? '' : who[o.to]}.`;
    case 'scaleStatus':
      return `${o.mult === 2 ? 'Double' : o.mult === 3 ? 'Triple' : `Multiply by ${o.mult}`} the ${cap(o.status)}${who[o.to] || ' on the target'}.`;
    case 'draw':
      return `Draw ${at(o.amount, o.scale)} card${o.amount === 1 && !o.scale ? '' : 's'}.`;
    case 'mana':
      return `Gain ${at(o.amount, o.scale)} Mana.`;
    case 'stars':
      return `${o.amount < 0 ? 'Spend' : 'Gain'} ${at(Math.abs(o.amount), o.scale)} Star${Math.abs(o.amount) === 1 && !o.scale ? '' : 's'}.`;
    case 'summon':
      return `Summon ${db.units[o.unit]?.name ?? o.unit}.`;
    case 'addCard': {
      const nm = db.cards[o.card]?.name ?? o.card;
      const dest = `${o.side === 'self' ? 'your' : 'the enemy'} ${o.to === 'hand' ? 'hand' : o.to === 'draw' ? 'draw pile' : 'discard pile'}`;
      if (o.scale) {
        const a = amountText(o.times ?? 0, o.scale);
        return a.equal ? `Add ${nm}s to ${dest} equal to ${a.num}.` : `Add ${a.num} ${nm}s to ${dest}.`;
      }
      const n = o.times ?? 1;
      return `Add ${n > 1 ? `${n} ${nm}s` : nm} to ${dest}.`;
    }
    case 'actAllies':
      return 'All your allies act now.';
    case 'prevent':
      return 'Cancel that attack.';
    case 'discard':
      return o.random
        ? `Discard ${o.amount} random card${o.amount === 1 ? '' : 's'}.`
        : o.any
          ? 'Discard any number of cards.'
          : `Discard ${o.amount} card${o.amount === 1 ? '' : 's'}.`;
    case 'exhaustCards':
      return o.random
        ? `Exhaust ${o.amount} random card${o.amount === 1 ? '' : 's'}.`
        : o.any
          ? 'Exhaust any number of cards.'
          : `Exhaust ${o.amount} card${o.amount === 1 ? '' : 's'}.`;
    case 'scry':
      return `Scry ${o.amount}.`;
    case 'power':
      return `${WHEN_TEXT[o.when] ?? o.when}${o.filter ? ` (${o.filter})` : ''}${o.tag ? ` (${o.tag})` : ''}${o.stance ? ` (${cap(o.stance)})` : ''}: ${o.ops.map((x) => opText(db, x, who)).join(' ')}`;
    case 'channel': {
      const nm = db.runes?.[o.rune]?.name ?? o.rune;
      const a = o.scale ? amountText(o.times ?? 0, o.scale) : null;
      return a ? `Channel ${nm} ${a.equal ? a.num : `x ${a.num}`}.` : (o.times ?? 1) > 1 ? `Channel ${nm} ${o.times} times.` : `Channel ${nm}.`;
    }
    case 'evoke': {
      const n = o.count ?? 1;
      const t = o.times ?? 1;
      const xs = o.scale?.by === 'x' ? ' X times' : t > 1 ? ` ${t} times` : '';
      return `Evoke your ${n === 1 ? 'first rune' : `first ${n} runes`}${xs}${o.keep ? ' (it stays)' : ''}.`;
    }
    case 'runeSlots':
      return `${o.amount >= 0 ? 'Gain' : 'Lose'} ${Math.abs(o.amount)} rune slot${Math.abs(o.amount) === 1 ? '' : 's'}.`;
    case 'stance':
      return o.stance === 'none' ? 'Leave your stance.' : `Enter ${cap(o.stance)}.`;
    case 'sacrifice':
      return 'Sacrifice the chosen ally.';
    case 'forge':
      return `Forge ${o.amount} (${db.cards[o.card]?.name ?? o.card} gains ${o.amount} damage).`;
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
          : c.trigger.on === 'foeSummons'
          ? 'When the enemy summons:'
          : c.trigger.on === 'foeDefends'
            ? 'When an enemy gains Barrier:'
            : 'At the start of the enemy turn:',
    );
  }
  if (c.starCost) parts.push(`Costs ${c.starCost} Star${c.starCost === 1 ? '' : 's'}.`);
  parts.push(...c.effects.map((o) => opText(db, o)));
  if (c.exhaust) parts.push('Exhaust.');
  if (c.retain) parts.push('Retain.');
  if (c.innate) parts.push('Innate.');
  if (c.ethereal) parts.push('Ethereal.');
  if (c.onDiscard) parts.push(`If discarded: ${c.onDiscard.map((o) => opText(db, o)).join(' ')}`);
  if (c.onExhaust) parts.push(`If exhausted: ${c.onExhaust.map((o) => opText(db, o)).join(' ')}`);
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
