// What a client may see (hidden information removed) plus generated card / intent text. Presentation helpers only.

import { modifiedDamage, activePattern, formProgress, type LiveDamage } from './engine';
import {
  other,
  clone,
  TRAIT_POWER,
  DEFENSIVE_TAG,
  STRIKING_TAG,
  type CardDef,
  type CardId,
  type CardInst,
  type CombatDb,
  type CombatEvent,
  type CombatState,
  type Enchant,
  type Element,
  type Form,
  type Metric,
  type Op,
  type Pending,
  type PowerState,
  type RuneState,
  type Scale,
  type Sel,
  type Side,
  type StatusId,
  type Suit,
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
  /** an attack that lands on more than its one target: 'all' strikes every unit of the other side, 'random' picks its own */
  area?: 'all' | 'random';
}

export interface UnitView extends Unit {
  intentView: IntentView | null;
  /** a companion's frame: the companion slots it takes (1 Light, 2 Heavy, 3 Colossal), shown as pips (DECISIONS #383) */
  slots?: number;
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
  /** a Trap's card is only known to its owner */
  snares: { id: string; card: CardId | null }[];
  hero: string | null;
  /** Potion ids (your own side only) and how many each side holds */
  potions: string[] | null;
  potionCount: number;
  stars: number;
  /** Attacks played this turn (some cards cost less for each) */
  attacksPlayed: number;
  /** Skills played this turn (Pinpoint costs less for each) */
  skillsPlayed: number;
  /** cards played this turn (Free Play makes the first ones cost no Mana) */
  played?: number;
  /** the other counters a card's cost can read (the Necrobinder copy: Bone Crush, Mourning, Wailing Cry, Toll in Advance) */
  allyStrikes?: number;
  drawnTurn?: number;
  doomedTurn?: number;
  etherealPlayed?: number;
  deaths?: number;
  costTax?: number;
  /** (the Trickster's Suits) the suits showing this turn; missing for a hero without Suits */
  suitsTurn?: Suit[];
  /** (the Spellblade) the enchantments on her blade, oldest first; missing for a side that never had one */
  enchants?: Enchant[];
  /** (the Shaman) totem positions (a TotemDef id or null), and whether a totem was commanded this turn */
  totems?: (string | null)[];
  commanded?: boolean;
  /** (DECISIONS #420) the elements cast this turn, and whether Trinity triggered */
  elementsTurn?: Element[];
  trinityDone?: boolean;
  /** (the Monk) his form, its objective's progress this turn (0-2), and whether it is complete */
  form?: Form;
  formProgress?: number;
  formDone?: boolean;
  runes: RuneState[];
  runeSlots: number;
  powers: { id: string; card: string; when: PowerState['when'] }[];
}

/** A choice you owe: the cards to choose among, resolved to their instances. */
export interface PendingView {
  kind: Pending['kind'];
  /** 'topdeck': chosen from the draw pile, not the hand */
  from?: 'draw';
  pool: CardInst[];
  min: number;
  max: number;
  /** (the Spellblade's choices) the enchantments to choose among, instead of cards: the id to send back, and its kind */
  charges?: { id: string; kind: Enchant }[];
  /** 'enchant': the enchantment that is coming in */
  incoming?: Enchant;
  /** (the Shaman's choices) the spirits to choose among ('plantKind'), or the positions ('plantAt': what stands there, null if free) */
  spirits?: { id: string; spirit: string | null }[];
  /** 'plantAt': the spirit being planted */
  planting?: string;
  /** (the Monk's 'form' choice) the forms he can change to */
  forms?: Form[];
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

/**
 * What an ally will do at the end of its owner's turn, shown like an enemy's intent: its attacks land on the first living unit of the
 * other side (as the engine has it, actAlly), so the damage is worked out against that unit with every modifier.
 */
/** Whether the damage in these ops strikes every unit of the other side, or random ones, rather than one target. */
function areaOf(ops: readonly Op[]): 'all' | 'random' | undefined {
  const dmg = ops.filter((o): o is Extract<Op, { op: 'damage' }> => o.op === 'damage');
  if (dmg.some((o) => o.to === 'allFoes')) return 'all';
  if (dmg.some((o) => o.to === 'randomFoe')) return 'random';
  return undefined;
}

function describeAllyAct(db: CombatDb, s: CombatState, u: Unit, act: Op[]): IntentView {
  const front = s.sides[other(u.side)].units.find((x) => x.hp > 0) ?? null;
  const dmg = act.filter((o): o is Extract<Op, { op: 'damage' }> => o.op === 'damage');
  const first = dmg[0];
  const area = areaOf(act);
  return {
    move: 'act',
    name: 'End of turn',
    text: `At the end of its side's turn: ${act.map((o) => opText(db, o, WHO)).join(' ')}`,
    icons: opIcons(act),
    // (its Primed goes into that strike, as an enemy's does: DECISIONS #361)
    damage: first
      ? modifiedDamage(
          first.amount + (first.scale ? 0 : (u.statuses.vigor ?? 0)),
          u,
          first.to === 'target' ? front : null,
        )
      : null,
    hits: first ? dmg.reduce((n, o) => n + (o.hits ?? 1), 0) : 0,
    target: first?.to === 'target' ? (front?.id ?? null) : null,
    ...(area ? { area } : {}),
  };
}

export function describeIntent(db: CombatDb, s: CombatState, u: Unit): IntentView | null {
  const d = db.units[u.def];
  // (a companion that does nothing on its own, such as a Bone Thrall, shows no intent)
  if (d?.brain.kind === 'ally' && u.hp > 0)
    return d.brain.act.length ? describeAllyAct(db, s, u, d.brain.act) : null;
  if (!u.intent) return null;
  if (!d || d.brain.kind !== 'enemy') return null;
  const mv = d.brain.moves[u.intent.move];
  if (!mv) return null;
  const target =
    [...s.sides.a.units, ...s.sides.b.units].find((x) => x.id === u.intent?.target) ?? null;
  const dmg = mv.effects.filter((o): o is Extract<Op, { op: 'damage' }> => o.op === 'damage');
  const first = dmg[0];
  const area = areaOf(mv.effects);
  return {
    move: mv.id,
    name: mv.name,
    text: mv.effects.map((o) => opText(db, o, WHO_ENEMY)).join(' '),
    icons: opIcons(mv.effects),
    // (an enemy's Vigor adds to its next attack: the intent counts it)
    damage: first
      ? modifiedDamage(
          first.amount + (u.statuses.vigor ?? 0),
          u,
          first.to === 'target' ? target : null,
        )
      : null,
    hits: first ? dmg.reduce((n, o) => n + (o.hits ?? 1), 0) : 0,
    target: u.intent.target,
    ...(area ? { area } : {}),
  };
}

function pendingView(s: CombatState, me: Side): PendingView | null {
  const p = s.pending;
  if (!p || s.active !== me) return null;
  const sd = s.sides[me];
  // (the Spellblade's: positions on her blade, or kinds, not cards)
  if (p.kind === 'enchant' || p.kind === 'discharge' || p.kind === 'recast') {
    const list = sd.enchants ?? [];
    const charges = p.pool.flatMap((id) => {
      const kind = p.kind === 'recast' ? (id as Enchant) : list[Number(id.replace(/^e/, ''))];
      return kind ? [{ id, kind }] : [];
    });
    return {
      kind: p.kind,
      pool: [],
      min: p.min,
      max: p.max,
      charges,
      ...(p.charge ? { incoming: p.charge } : {}),
    };
  }
  // (the Monk's: a form to change to, or none to keep his)
  if (p.kind === 'form')
    return { kind: p.kind, pool: [], min: p.min, max: p.max, forms: p.pool as Form[] };
  // (the Shaman's: kinds of spirit, or totem positions)
  if (p.kind === 'plantKind' || p.kind === 'plantAt' || p.kind === 'commandPick') {
    const list = sd.totems ?? [];
    const spirits = p.pool.map((id) => ({
      id,
      spirit: p.kind === 'plantKind' ? id : (list[Number(id.replace(/^t/, ''))] ?? null),
    }));
    return {
      kind: p.kind,
      pool: [],
      min: p.min,
      max: p.max,
      spirits,
      ...(p.spirit ? { planting: p.spirit } : {}),
    };
  }
  const pile = p.kind === 'scry' || p.from === 'draw' ? sd.draw : sd.hand;
  const pool: CardInst[] = [];
  for (const id of p.pool) {
    const c = pile.find((x) => x.id === id);
    if (c) pool.push(clone(c));
  }
  return { kind: p.kind, ...(p.from ? { from: p.from } : {}), pool, min: p.min, max: p.max };
}

/** A hero's-eye view: the other side's hand, draw order and Traps stay hidden. */
export function viewFor(db: CombatDb, s: CombatState, me: Side): CombatView {
  const side = (id: Side): SideView => {
    const sd = s.sides[id];
    const own = id === me;
    return {
      id,
      units: sd.units.map((u) => {
        const slots = u.kind === 'ally' ? (db.units[u.def]?.slots ?? 1) : 1;
        return {
          ...clone(u),
          intentView: describeIntent(db, s, u),
          ...(u.kind === 'ally' ? { slots } : {}),
        };
      }),
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
      attacksPlayed: sd.attacksPlayed,
      skillsPlayed: sd.skillsPlayed,
      played: sd.played,
      allyStrikes: sd.allyStrikes ?? 0,
      drawnTurn: sd.drawnTurn ?? 0,
      doomedTurn: sd.doomedTurn ?? 0,
      etherealPlayed: sd.etherealPlayed ?? 0,
      deaths: sd.deaths ?? 0,
      costTax: sd.costTax ?? 0,
      ...(sd.suitsTurn ? { suitsTurn: [...sd.suitsTurn] } : {}),
      ...(sd.enchants ? { enchants: [...sd.enchants] } : {}),
      ...(sd.totems
        ? {
            totems: [...sd.totems],
            commanded: !!sd.commanded,
            elementsTurn: [...(sd.elementsTurn ?? [])],
            trinityDone: !!sd.trinityDone,
          }
        : {}),
      ...(sd.form
        ? { form: sd.form, formProgress: formProgress(sd), formDone: !!sd.formDone }
        : {}),
      runes: clone(sd.runes),
      runeSlots: sd.runeSlots,
      powers: sd.powers
        .filter((p) => p.card !== TRAIT_POWER)
        .map((p) => ({ id: p.id, card: p.card, when: p.when })),
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

/** Statuses that stay for the rest of the fight once gained (no turns to count down, nothing that uses them up). */
// (Edge says so in its own line, and maximum Mana in its own)
const LASTING: readonly StatusId[] = [
  'might',
  'thorns',
  'bracing',
  'fortified',
  'ritual',
  'resonance',
];

const isLasting = (o: Op): boolean =>
  o.op === 'status' &&
  (o.to === 'self' || o.to === 'allFriends') &&
  o.amount > 0 &&
  !o.temp &&
  LASTING.includes(o.status);

const WHO: Record<Sel, string> = {
  target: '',
  self: ' to yourself',
  hero: ' to your hero',
  allFoes: ' to ALL enemies',
  randomFoe: ' to a random enemy',
  front: ' to the front enemy',
  allFriends: ' to all friends',
  allAllies: ' to each of your allies',
  attacker: ' to the attacker',
  weakestFoe: ' to the enemy with the least HP',
  biggestAlly: ' to your biggest companion',
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
  allAllies: ' to each of its allies',
  attacker: ' to the attacker',
  weakestFoe: ' to your unit with the least HP',
  biggestAlly: ' to its biggest ally',
};
const KIND_PLURAL: Record<string, string[]> = {
  attack: ['Attack'],
  skill: ['Skill'],
  power: ['Aura'],
  summon: ['Summon'],
  snare: ['Trap'],
};
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** What the player reads for a status or stance (the ids stay as they are in the data). */
const STATUS_NAME: Record<string, string> = {
  calm: 'Serene',
  wrath: 'Fury',
  mantra: 'Fervor',
  doom: 'Fate',
  ritual: 'Cadence',
  vigor: 'Primed',
  seared: 'Bleed',
  burn: 'Burn',
  freeattack: 'Free Attack',
  freeskill: 'Free Skill',
  resonance: 'Spirit',
  twinned: 'Reverb',
  bladesweep: 'Blade Sweep',
  bladeecho: 'Blade Echo',
  bladebane: 'Bladebane',
  freeplay: 'Free Play',
  orbit: 'Momentum',
  marrow: 'Marrow',
  reaping: 'Reaping',
  debilitated: 'Debilitated',
  lethality: 'Lethality',
  noose: 'Noose',
  quarry: 'Quarry',
  freeethereal: 'Free Fleeting',
  // (the Defect copy, shaman)
  echoing: 'Echo',
  boosted: 'Resound',
  freepower: 'Free Aura',
  // (the Knight's Guard)
  opening: 'Opening',
  // (the Assassin's)
  prep: 'Preparation',
  knives: 'Knives',
  // (the Spellblade's)
  twinedge: 'Twin Edge',
};
const sname = (s: string): string => STATUS_NAME[s] ?? cap(s);
/** a card kind by its player-facing name, for effects that pick cards by kind */
const KIND_WORD2: Record<string, string> = {
  attack: 'Attack',
  skill: 'Skill',
  power: 'Aura',
  snare: 'Trap',
  summon: 'Summon',
};
const plural = (word: string): string =>
  // ("Buckshot Shell+" several times over reads "upgraded Buckshot Shells")
  word.endsWith('+')
    ? `upgraded ${plural(word.slice(0, -1))}`
    : /fe$/.test(word)
      ? word.replace(/fe$/, 'ves')
      : `${word}s`;
const article = (word: string): string => (/^[aeiou]/i.test(word) ? 'an' : 'a');
/** What players call the cards with a tag ("Whenever you play a Carving"). */
const TAG_NAMES: Record<string, string> = {
  knife: 'Dagger',
  blade: 'Obsidian Blade',
  carving: 'Carving',
  soul: 'Gravesoul',
  command: 'Command card',
  status: 'Status card',
  stagger: 'Stagger card',
  // (the Monk's techniques, DECISIONS #419)
  defensive: 'Defensive technique',
  striking: 'Striking technique',
  // (the Shaman's elements, DECISIONS #420)
  flame: 'Flame spell',
  frost: 'Frost spell',
  storm: 'Storm spell',
};

/** A scale under 1 as a small fraction: 0.5 is 1 per 2, 2/3 is 2 per 3 (the smallest whole numbers that give it). */
function frac(m: number): { a: number; b: number } {
  for (let b = 2; b <= 12; b++) {
    const a = Math.round(m * b);
    if (a >= 1 && Math.abs(m * b - a) < 0.01) return { a, b };
  }
  return { a: 1, b: Math.round(1 / m) };
}

/** A metric counted several at a time ("+1 per 2 consumed cards"), where the plural differs. */
const PLURAL: Partial<Record<Metric, string>> = {
  hand: 'cards in hand',
  drawPile: 'cards in your draw pile',
  discardPile: 'cards in your discard pile',
  exhausted: 'consumed cards',
  allies: 'allies',
  foes: 'enemies',
  snares: 'Traps set',
  runes: 'totems',
  powers: 'Auras you have',
  played: 'cards played this turn',
  attacksPlayed: 'Attacks played this turn',
  skillsPlayed: 'Skills played this turn',
  strikes: 'Strike cards in your deck',
  drawn: 'cards drawn this fight',
  created: 'cards created this fight',
  discarded: 'cards discarded this turn',
  charge: 'charges',
  bonus: 'points of sharpening',
};

/** How a metric reads in a card: `per` ("+2 per Barrier") and `equal` ("equal to your Barrier"). */
const METRIC_WORDS: Record<Metric, { per: string; equal: string }> = {
  barrier: { per: 'Barrier', equal: 'Barrier' },
  hp: { per: 'HP', equal: 'HP' },
  missingHp: { per: 'missing HP', equal: 'missing HP' },
  missingPct: { per: '% HP missing', equal: 'share of HP missing' },
  seared: { per: 'Bleed', equal: 'Bleed' },
  burn: { per: 'Burn', equal: 'Burn' },
  exposed: { per: 'Exposed', equal: 'Exposed' },
  faltering: { per: 'Faltering', equal: 'Faltering' },
  might: { per: 'Might', equal: 'Might' },
  thorns: { per: 'Thorns', equal: 'Thorns' },
  mantra: { per: 'Fervor', equal: 'Fervor' },
  hangover: { per: 'Hangover', equal: 'Hangover' },
  resonance: { per: 'Spirit', equal: 'Spirit' },
  doom: { per: 'Fate', equal: 'Fate' },
  calm: { per: 'Serene', equal: 'Serene' },
  wrath: { per: 'Fury', equal: 'Fury' },
  radiant: { per: 'Radiant', equal: 'Radiant' },
  hand: { per: 'card in hand', equal: 'the number of cards in your hand' },
  drawPile: { per: 'card in your draw pile', equal: 'the number of cards in your draw pile' },
  discardPile: {
    per: 'card in your discard pile',
    equal: 'the number of cards in your discard pile',
  },
  exhausted: { per: 'consumed card', equal: 'the number of cards you have consumed' },
  allies: { per: 'ally', equal: 'the number of your allies' },
  biggestAlly: {
    per: 'max HP of your biggest companion',
    equal: "your biggest companion's max HP",
  },
  slots: { per: 'companion slot filled', equal: 'the companion slots filled' },
  foes: { per: 'enemy', equal: 'the number of enemies' },
  snares: { per: 'Trap set', equal: 'the number of Traps you have set' },
  stars: { per: 'Arcana', equal: 'your Arcana' },
  runes: { per: 'totem', equal: 'the number of your totems' },
  powers: { per: 'Aura you have', equal: 'the number of your Auras' },
  mana: { per: 'Mana left', equal: 'your Mana' },
  played: { per: 'card played this turn', equal: 'the cards played this turn' },
  attacksPlayed: { per: 'Attack played this turn', equal: 'the Attacks played this turn' },
  skillsPlayed: { per: 'Skill played this turn', equal: 'the Skills played this turn' },
  strikes: { per: 'Strike card in your deck', equal: 'the number of Strike cards in your deck' },
  drawn: { per: 'card drawn this fight', equal: 'the cards you have drawn this fight' },
  created: { per: 'card created this fight', equal: 'the cards you have created this fight' },
  discarded: { per: 'card discarded this turn', equal: 'the cards discarded this turn' },
  hpLostTurn: { per: 'time you lost HP this turn', equal: 'the times you lost HP this turn' },
  hpLostFight: {
    per: 'time you lost HP this fight',
    equal: 'the times you have lost HP this fight',
  },
  exhaustedTurn: { per: 'card consumed this turn', equal: 'the cards consumed this turn' },
  attacksInHand: { per: 'Attack in your hand', equal: 'the number of Attacks in your hand' },
  nonAttacksInHand: {
    per: 'other card in your hand',
    equal: 'the number of cards in your hand that are not Attacks',
  },
  exhaustedNow: { per: 'card consumed this way', equal: 'the cards consumed this way' },
  exhaustedDamage: {
    per: 'damage of the Attacks consumed this way',
    equal: 'the damage of the Attacks consumed this way',
  },
  skillsInHand: { per: 'Skill in your hand', equal: 'the number of Skills in your hand' },
  foesSeared: { per: 'Bleed on ALL enemies', equal: 'the Bleed on ALL enemies' },
  discardedNow: { per: 'card discarded this way', equal: 'the cards discarded this way' },
  skillsDrawnNow: { per: 'Skill drawn this way', equal: 'the Skills drawn this way' },
  x: { per: 'Mana spent', equal: 'the Mana spent' },
  starsGained: { per: 'Arcana gained this turn', equal: 'the Arcana gained this turn' },
  starCards: {
    per: 'card with an Arcana cost in your deck',
    equal: 'the number of cards with an Arcana cost in your deck',
  },
  handRoom: { per: 'empty place in your hand', equal: 'the room left in your hand' },
  hitsTaken: { per: 'time it was hit this turn', equal: 'the times it was hit this turn' },
  suits: { per: 'suit played this turn', equal: 'the suits played this turn' },
  spades: { per: '♠ played this turn', equal: 'whether a ♠ was played this turn' },
  hearts: { per: '♥ played this turn', equal: 'whether a ♥ was played this turn' },
  diamonds: { per: '♦ played this turn', equal: 'whether a ♦ was played this turn' },
  clubs: { per: '♣ played this turn', equal: 'whether a ♣ was played this turn' },
  spent: { per: 'Arcana spent', equal: 'the Arcana spent' },
  charge: { per: 'charge', equal: 'its charge' },
  healed: { per: 'HP healed', equal: 'the HP healed' },
  bonus: { per: 'point of sharpening', equal: 'its sharpening' },
  // --- the Necrobinder copy
  maxHp: { per: 'max HP', equal: 'max HP' },
  dealt: { per: 'damage dealt', equal: 'the damage dealt' },
  lost: { per: 'HP lost', equal: 'the HP it lost' },
  allyStrikes: {
    per: 'time your companions have struck this turn',
    equal: 'the times your companions have struck this turn',
  },
  drawnTurn: { per: 'card drawn this turn', equal: 'the cards drawn this turn' },
  doomedTurn: { per: 'Fate curse this turn', equal: 'the Fate curses this turn' },
  samePlayed: { per: 'copy played this turn', equal: 'the copies played this turn' },
  etherealPlayed: {
    per: 'Fleeting card played this fight',
    equal: 'the Fleeting cards played this fight',
  },
  deaths: { per: 'death this fight', equal: 'the deaths this fight' },
  fullTricks: { per: 'Full Trick this fight', equal: 'the Full Tricks this fight' },
  tagExhausted: { per: 'consumed card of that kind', equal: 'the consumed cards of that kind' },
  tagDeck: { per: 'card of that kind in your deck', equal: 'the cards of that kind in your deck' },
  // (the Defect copy, shaman)
  runeKinds: { per: 'different totem you have', equal: 'the number of different totems you have' },
  runesOf: { per: 'such totem you have', equal: 'the number of such totems you have' },
  channeledOf: {
    per: 'such totem planted this fight',
    equal: 'the number of such totems you have planted this fight',
  },
  manaSpent: { per: 'Mana spent this turn', equal: 'the Mana you have spent this turn' },
  attacking: { per: 'attack it means', equal: 'whether it means to attack' },
  // (the Knight's Guard)
  opening: { per: 'Opening', equal: 'whether it is Open' },
  foesOpen: { per: 'Open enemy', equal: 'the number of Open enemies' },
  foesAttacking: {
    per: 'enemy that means to attack',
    equal: 'the number of enemies that mean to attack',
  },
  // (the Assassin)
  knives: { per: 'knife in it', equal: 'knives' },
  knivesAll: { per: 'knife in your enemies', equal: 'the knives in your enemies' },
  prep: { per: 'Preparation', equal: 'Preparation' },
  extracted: { per: 'knife pulled', equal: 'the knives pulled' },
  prepSpent: { per: 'Preparation spent', equal: 'the Preparation spent' },
  // (the Spellblade)
  enchants: { per: 'enchantment on your blade', equal: 'the enchantments on your blade' },
  enchantKinds: {
    per: 'kind of enchantment on your blade',
    equal: 'the kinds of enchantment on your blade',
  },
  wards: { per: 'Ward on your blade', equal: 'the Wards on your blade' },
  discharged: { per: 'enchantment discharged', equal: 'the enchantments discharged' },
  bladeEmbers: { per: 'Ember on your blade', equal: 'the Embers on your blade' },
  bladeGlass: { per: 'Glass on your blade', equal: 'the Glass on your blade' },
  bladePair: { per: 'matching pair on your blade', equal: 'a matching pair on your blade' },
  dischargedPair: { per: 'matching pair discharged', equal: 'a matching pair discharged' },
  dischargedMix: { per: 'mixed pair discharged', equal: 'a mixed pair discharged' },
  // (the Shaman)
  totems: { per: 'totem you have', equal: 'your totems' },
  totemKinds: { per: 'kind of totem you have', equal: 'the kinds of totem you have' },
  totemsOf: { per: 'such totem you have', equal: 'such totems you have' },
  spirit: { per: 'Spirit', equal: 'your Spirit' },
  commanded: { per: 'command this turn', equal: 'your commands this turn' },
  uprooted: { per: 'totem uprooted', equal: 'the totems uprooted' },
  replacedNow: { per: 'totem replaced', equal: 'the totems replaced' },
  spiritSpent: { per: 'Spirit spent', equal: 'the Spirit spent' },
  thornsSpent: { per: 'Thorns shed', equal: 'the Thorns shed' },
  // (the Shaman, DECISIONS #420)
  elementsTurn: { per: 'element cast this turn', equal: 'the elements cast this turn' },
  trinityDone: { per: 'Trinity this turn', equal: 'Trinity this turn' },
  // (the Monk)
  mastery: { per: 'Mastery', equal: 'your Mastery' },
  masterySpent: { per: 'Mastery spent', equal: 'the Mastery spent' },
  techniqueDone: { per: 'technique completed', equal: 'your techniques completed' },
  techniquesTurn: { per: 'technique played this turn', equal: 'the techniques played this turn' },
  defensiveTurn: {
    per: 'Defensive technique played this turn',
    equal: 'the Defensive techniques played this turn',
  },
  inRoot: { per: 'Root form', equal: 'Root form' },
  inCurrent: { per: 'Current form', equal: 'Current form' },
  inEmber: { per: 'Ember form', equal: 'Ember form' },
  formProgress: { per: 'step of your technique', equal: 'the steps of your technique' },
  vigor: { per: 'Primed', equal: 'your Primed' },
};
const UNIT_METRICS: readonly Metric[] = [
  'barrier',
  'hp',
  'missingHp',
  'missingPct',
  'seared',
  'burn',
  'exposed',
  'faltering',
  'might',
  'thorns',
  'mantra',
  'hangover',
  'resonance',
  'doom',
  'calm',
  'wrath',
  'radiant',
  'hitsTaken',
  'maxHp',
  'opening',
  'knives',
  'prep',
];

/** Text for a number that may depend on the board: "6", "6 (+2 per Barrier)" or "equal to your Barrier". */
function amountText(n: number, sc: Scale | undefined): { num: string; equal: boolean } {
  if (!sc || sc.into === 'hits') return { num: String(n), equal: false };
  // (a tagged count names its cards: "per consumed Gravesoul", "per Command card in your deck")
  const tagged = sc.tag ? (TAG_NAMES[sc.tag] ?? cap(sc.tag)) : null;
  const w =
    tagged && sc.by === 'tagExhausted'
      ? { per: `consumed ${tagged}`, equal: `the number of consumed ${plural(tagged)}` }
      : tagged && sc.by === 'tagDeck'
        ? { per: `${tagged} in your deck`, equal: `the number of ${plural(tagged)} in your deck` }
        : sc.by === 'hitsTaken'
          ? // (who was hit is part of the phrase: "per time the target was hit this turn")
            sc.of === 'target'
            ? {
                per: 'time the target was hit this turn',
                equal: 'the times the target was hit this turn',
              }
            : sc.of === 'each'
              ? { per: 'time it was hit this turn', equal: 'the times it was hit this turn' }
              : { per: 'time you were hit this turn', equal: 'the times you were hit this turn' }
          : METRIC_WORDS[sc.by];
  const named = sc.by === 'hitsTaken';
  // (a count in steps: "+5 per 10 Fate on the target")
  if (sc.step && n > 0)
    return {
      num: `${n} (+${sc.mult ?? 1} per ${sc.step} ${w.per}${sc.of === 'target' ? ' on the target' : ''})`,
      equal: false,
    };
  const m = sc.mult ?? 1;
  const unit = UNIT_METRICS.includes(sc.by) && !named;
  const whose = unit
    ? sc.of === 'target'
      ? "the target's "
      : sc.of === 'each'
        ? 'their '
        : 'your '
    : '';
  if (n === 0) {
    const mult =
      m === 1
        ? ''
        : m === 0.5
          ? 'half '
          : m === 0.25
            ? 'a quarter '
            : m > 1
              ? `${m} times `
              : `${Math.round(m * 100)}% of `;
    return {
      num: `${mult}${mult && !/ of $/.test(mult) && m < 1 ? 'of ' : ''}${whose}${w.equal}`,
      equal: true,
    };
  }
  const on =
    unit && sc.of === 'target' ? ' on the target' : unit && sc.of === 'each' ? ' on each' : '';
  // (a share of HP reads "+1 per 6% HP missing", and a step that is not whole keeps its half: "per 2.5%")
  const step = Math.round(10 / m) / 10;
  const per =
    m <= -1
      ? `-${-m} per ${w.per}`
      : m >= 1
        ? `+${m} per ${w.per}`
        : sc.by === 'missingPct'
          ? `+1 per ${step}${w.per}`
          : `+${frac(m).a} per ${frac(m).b} ${PLURAL[sc.by] ?? w.per}`;
  return { num: `${n} (${per}${on})`, equal: false };
}

/** Sentences that repeat one after another read once, with how often: "Gain 6 Barrier. Gain 6 Barrier." is "Gain 6 Barrier twice." */
function sayRepeats(lines: readonly string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    let n = 1;
    while (lines[i + n] === lines[i]) n++;
    const line = lines[i] as string;
    out.push(n === 1 ? line : line.replace(/\.$/, n === 2 ? ' twice.' : ` ${n} times.`));
    i += n - 1;
  }
  return out;
}

const WHEN_TEXT: Record<string, string> = {
  turnStart: 'At the start of your turn',
  turnEnd: 'At the end of your turn',
  play: 'Whenever you play a card',
  exhaust: 'Whenever a card is consumed',
  discard: 'Whenever you discard a card',
  summon: 'Whenever you summon an ally',
  allyDies: 'Whenever one of your allies dies',
  allyLost: 'Whenever one of your allies dies or is scrapped',
  snare: 'Whenever one of your Traps is triggered',
  stance: 'Whenever you enter a stance',
  stanceLeft: 'Whenever you leave a stance',
  barrier: 'Whenever you gain Barrier',
  heal: 'Whenever you heal (even at full HP)',
  loseHp: 'Whenever you lose HP to your own cards',
  draw: 'Whenever you draw a card',
  created: 'Whenever a card is created',
  arcana: 'Whenever you spend Arcana',
  shuffle: 'Whenever your deck is reshuffled',
  exposeFoe: 'Whenever you apply Exposed to an enemy',
  hitFoe: 'Whenever an Attack of yours deals damage to an enemy’s HP',
  drawMidTurn: 'Whenever you draw a card during your turn',
  gainArcana: 'Whenever you gain Arcana',
  doomFoe: 'Whenever you curse an enemy with Fate',
  debuffFoe: 'Whenever you put a debuff on an enemy',
  allyHurt: 'Whenever one of your companions loses HP',
  evoke: 'Whenever a totem awakens',
  allSuits: 'Whenever you make a Full Trick (all four suits this turn)',
  // (the Knight's Guard)
  opening: 'Whenever you earn an Opening',
  riposte: 'Whenever you spend an Opening',
  thorns: 'Whenever your Thorns strike an attacker',
  // (the Assassin)
  embed: 'Whenever you embed a knife',
  extract: 'Whenever you pull a knife',
  spend: 'Whenever you spend a resource',
  // (the Spellblade)
  imbue: 'Whenever you Imbue',
  discharge: 'Whenever you Discharge',
  dischargeMixed: 'Whenever you Discharge two different enchantments at once',
  recast: 'Whenever you change an enchantment into another kind',
  // (the Shaman)
  command: 'Whenever you command a totem',
  plant: 'Whenever you plant a totem',
  replace: 'Whenever you replace a totem with one of another kind',
  // (the Shaman)
  trinity: 'Whenever Trinity triggers',
  // (the Monk)
  technique: 'Whenever you complete your technique',
  formChange: 'Whenever you change form',
};

const ORDINAL = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

/** The suits as they are printed in card text. */
const SUIT_GLYPH: Partial<Record<Metric, string>> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

/** How a condition reads in a card ("If the target is Exposed: ..."). */
function whenText(o: Extract<Op, { op: 'when' }>, db?: CombatDb): string {
  const lo = o.atLeast;
  const hi = o.atMost;
  // (the Defect copy, shaman)
  if (o.by === 'attacking' && (lo ?? 0) >= 1) return 'the enemy means to attack';
  if (o.by === 'runesOf' && (lo ?? 0) >= 1 && hi === undefined) {
    const nm = (o.rune && db?.runes?.[o.rune]?.name) || 'such totem';
    return `you have ${lo === 1 ? article(nm) : lo} ${nm}${lo === 1 ? '' : 's'}`;
  }
  if (o.by === 'played' && lo === undefined && hi === 0)
    return 'it is the first card you play this turn';
  if (o.by === 'played' && lo === undefined && hi !== undefined)
    return `you have played ${hi} or fewer other cards this turn`;
  if (o.by === 'exposed' && o.of === 'target' && (lo ?? 0) >= 1) return 'the target is Exposed';
  if (o.by === 'faltering' && o.of === 'target' && (lo ?? 0) >= 1) return 'the target is Faltering';
  if (o.by === 'hpLostTurn' && (lo ?? 0) >= 1) return 'you have lost HP this turn';
  if (o.by === 'snares' && lo === 1 && hi === undefined) return 'you have a Trap set';
  if (o.by === 'suits' && lo === 4) return 'all four suits are showing';
  if (o.by === 'suits' && lo !== undefined && hi === undefined)
    return `you have played ${lo} or more suits this turn`;
  if (SUIT_GLYPH[o.by] && lo === 1) return `you have played a ${SUIT_GLYPH[o.by]} this turn`;
  if (o.by === 'exhaustedTurn' && (lo ?? 0) >= 1) return 'you have consumed a card this turn';
  if (o.by === 'skillsDrawnNow' && (lo ?? 0) >= 1) return 'you drew a Skill';
  if (o.by === 'seared' && o.of === 'target' && (lo ?? 0) >= 1) return 'the target has Bleed';
  if (o.by === 'burn' && o.of === 'target' && (lo ?? 0) >= 1) return 'the target is Burning';
  if (o.by === 'x' && lo !== undefined && hi === undefined) return `X is ${lo} or more`;
  if (o.by === 'played' && lo !== undefined && hi === undefined)
    return `you have played ${lo} or more cards this turn`;
  if (o.by === 'attacksPlayed' && lo !== undefined && lo === hi)
    return `this is your ${ORDINAL[lo] ?? lo + 'th'} Attack this turn`;
  if (o.by === 'samePlayed' && hi === 0 && lo === undefined)
    return 'this is the first time you play it this turn';
  if (o.by === 'doomedTurn' && (lo ?? 0) >= 1 && hi === undefined)
    return 'you have cursed an enemy with Fate this turn';
  if (o.by === 'exhaustedNow' && lo !== undefined && hi === undefined)
    return `${lo} or more cards were consumed this way`;
  // (the Knight's Guard)
  if (o.by === 'opening' && (lo ?? 0) >= 1 && o.of === 'target') return 'the target is Open';
  if (o.by === 'foesOpen' && (lo ?? 0) >= 1 && hi === undefined)
    return lo === 1 ? 'an enemy is Open' : `${lo} or more enemies are Open`;
  if (o.by === 'thorns' && (lo ?? 0) >= 1 && hi === undefined && !o.of) return 'you have Thorns';
  // (the Assassin)
  if (o.by === 'knives' && o.of === 'target' && lo !== undefined && hi === undefined)
    return lo === 1 ? 'the target has a knife in it' : `the target has ${lo} knives in it`;
  if (o.by === 'prep' && lo !== undefined && hi === undefined && !o.of)
    return `you have ${lo} or more Preparation`;
  if (o.by === 'prep' && hi === 0 && lo === undefined && !o.of) return 'you have no Preparation';
  if (o.by === 'extracted' && (lo ?? 0) >= 1 && hi === undefined) return 'you pulled a knife';
  // (DECISIONS #424)
  if (o.by === 'prepSpent' && lo === 1 && hi === undefined) return 'you spent Preparation';
  if (o.by === 'prepSpent' && (lo ?? 0) >= 2 && hi === undefined)
    return `you spent ${lo} Preparation`;
  if (o.by === 'attacksPlayed' && hi === 0 && lo === undefined && !o.of)
    return 'you played no Attack this turn';
  // (the Knight)
  if (o.by === 'thornsSpent' && (lo ?? 0) >= 1 && hi === undefined) return 'you shed Thorns';
  // (the Shaman)
  if (o.by === 'trinityDone' && (lo ?? 0) >= 1 && hi === undefined)
    return 'Trinity has triggered this turn';
  // (the Monk)
  if (o.by === 'techniqueDone' && (lo ?? 0) >= 1 && hi === undefined)
    return 'you have completed your technique this turn';
  if (o.by === 'techniqueDone' && hi === 0 && lo === undefined)
    return 'you have not completed your technique this turn';
  if (o.by === 'formProgress' && lo === 1 && hi === 1)
    return 'your technique is one step from done';
  if (o.by === 'vigor' && hi === 0 && lo === undefined && !o.of) return 'you are not Primed';
  if (o.by === 'techniquesTurn' && hi === 0 && lo === undefined)
    return 'this is your first technique this turn';
  if (o.by === 'techniquesTurn' && lo === 1 && hi === undefined)
    return 'you have played another technique this turn';
  if (o.by === 'defensiveTurn' && (lo ?? 0) >= 1 && hi === undefined)
    return 'you have played a Defensive technique this turn';
  if (o.by === 'masterySpent' && (lo ?? 0) >= 1 && hi === undefined) return 'you spent Mastery';
  if (o.by === 'mastery' && lo !== undefined && hi === undefined && !o.of)
    return `you have ${lo} or more Mastery`;
  if ((o.by === 'inRoot' || o.by === 'inCurrent' || o.by === 'inEmber') && (lo ?? 0) >= 1)
    return `you are in ${METRIC_WORDS[o.by].equal}`;
  // (the Shaman)
  if (o.by === 'totemsOf' && (lo ?? 0) === 1 && hi === undefined && !o.of) {
    const nm = (o.rune && db?.totems?.[o.rune]?.name) || 'such totem';
    return `you have ${article(nm)} ${nm}`;
  }
  if (o.by === 'totems' && lo !== undefined && hi === undefined && !o.of)
    return lo === 1 ? 'you have a totem' : `you have ${lo} or more totems`;
  if (o.by === 'spirit' && lo !== undefined && hi === undefined && !o.of)
    return `you have ${lo} or more Spirit`;
  if (o.by === 'commanded' && (lo ?? 0) >= 1 && hi === undefined)
    return 'you have commanded a totem this turn';
  if (o.by === 'replacedNow' && (lo ?? 0) >= 1 && hi === undefined)
    return 'it replaced a totem of another kind';
  // (the Spellblade)
  if (o.by === 'enchants' && hi === 0 && lo === undefined && !o.of)
    return 'your blade has no enchantments';
  if (o.by === 'wards' && (lo ?? 0) === 1 && hi === undefined && !o.of)
    return 'your blade holds a Ward';
  if (o.by === 'enchants' && lo === 2 && hi === undefined && !o.of) return 'your blade is full';
  if (o.by === 'enchants' && lo === 1 && hi === undefined && !o.of)
    return 'your blade still holds an enchantment';
  if (o.by === 'bladeEmbers' && lo === 1 && hi === undefined) return 'your blade holds an Ember';
  if (o.by === 'bladeGlass' && lo === 1 && hi === undefined) return 'your blade holds a Glass';
  if (o.by === 'bladePair' && lo === 1 && hi === undefined)
    return 'your blade holds a matching pair';
  if (o.by === 'dischargedPair' && lo === 1 && hi === undefined) return 'they were the same kind';
  if (o.by === 'dischargedMix' && lo === 1 && hi === undefined) return 'they were different kinds';
  if (o.by === 'discharged' && lo === 1 && hi === undefined) return 'you discharged any';
  const w = METRIC_WORDS[o.by].equal;
  if (lo !== undefined && hi !== undefined) return `${w} is ${lo === hi ? lo : `${lo}-${hi}`}`;
  if (lo !== undefined) return `${w} is ${lo} or more`;
  return `${w} is ${hi ?? 0} or fewer`;
}

/** What Sharpen is called on this weapon: "Sharpen", or the weapon's own word (the Old Twelve Gauge's Precision). */
export const forgeWord = (db: CombatDb, card: string): string =>
  db.cards[card.replace(/\+$/, '')]?.forgeWord ?? 'Sharpen';

/** The buff a weapon wears for it: "Sharpened +3", "Precision +3". */
export const forgeLabel = (word: string): string => (word === 'Sharpen' ? 'Sharpened' : word);

export function opText(db: CombatDb, o: Op, who: Record<Sel, string> = WHO): string {
  const at = (n: number, sc: Scale | undefined): string => {
    const a = amountText(n, sc);
    return a.equal ? `equal to ${a.num}` : a.num;
  };
  switch (o.op) {
    case 'damage': {
      const a = amountText(o.amount, o.scale);
      // (a spread: "to 2 different random enemies")
      if (o.distinct && o.to === 'randomFoe' && (o.hits ?? 1) > 1)
        return `Deal ${a.equal ? `damage equal to ${a.num}` : `${a.num} damage`} to ${o.hits} different random enemies${o.lonePct ? ` (${o.lonePct}% more when only one enemy stands)` : ''}.`;
      let times = o.hits && o.hits > 1 ? ` ${o.hits} times` : '';
      if (o.scale?.into === 'hits') {
        const w = METRIC_WORDS[o.scale.by];
        // (the base hits and the hits added per point both show: "2 times, 2 more times per card discarded this turn")
        const hits = o.hits ?? 1;
        const m = o.scale.mult ?? 1;
        const more = m === 1 ? '1 more time' : `${m} more times`;
        // (a hit per card consumed reads "to a random enemy for each card consumed this way")
        if (hits === 0 && m === 1 && o.to === 'randomFoe' && o.scale.by === 'exhaustedNow') {
          return `Deal ${a.num} damage${who[o.to]} for each ${w.per}.`;
        }
        times =
          o.scale.by === 'x'
            ? ' X times'
            : hits === 0
              ? `${m === 1 ? '' : ` ${m} times`} for each ${w.per}`
              : `${hits > 1 ? ` ${hits} times` : ''}, ${more} per ${w.per}`;
      }
      // Point Blank: more against a lone enemy
      const lone = o.lonePct ? ` Point Blank: ${o.lonePct}% more when only one enemy is left.` : '';
      // (Lifesteal: heal that percent of the HP it took off)
      const steal = o.lifesteal ? ` Lifesteal ${o.lifesteal}%.` : '';
      const kill =
        (o.onKill
          ? ` If this is fatal: ${o.onKill.map((x) => opText(db, x, who)).join(' ')}`
          : '') +
        (o.repeatOnKill ? ' Repeat this for each enemy it kills.' : '') +
        // (Riposte, the Knight's: DECISIONS #415)
        (o.riposte
          ? ` Riposte: +${o.riposte} damage${(o.hits ?? 1) > 1 ? ' each hit' : ''}${o.to === 'allFoes' ? ' to each Open enemy' : ''}.`
          : '');
      // (each hit at a random enemy finds its own: "to a random enemy 3 times", not "3 times to a random enemy")
      const randomEach = o.to === 'randomFoe' && times !== '';
      const tail = randomEach ? `${who[o.to]}${times}` : `${times}${who[o.to]}`;
      return a.equal
        ? `Deal damage equal to ${a.num}${tail}.${lone}${steal}${kill}`
        : `Deal ${a.num} damage${tail}.${lone}${steal}${kill}`;
    }
    case 'loseHp': {
      const a = amountText(o.amount, o.scale);
      if (a.equal && o.to === 'allFoes' && who.self === WHO.self)
        return `ALL enemies lose HP equal to ${a.num}.`;
      if (a.equal) return `${o.to === 'self' ? 'Lose' : 'The target loses'} HP equal to ${a.num}.`;
      if (o.to === 'self') return `Lose ${a.num} HP.`;
      if (o.to === 'target') return `The target loses ${a.num} HP.`;
      // (on your own cards: Haunt, Necro Mastery)
      if (o.to === 'randomFoe' && who.self === WHO.self) return `A random enemy loses ${a.num} HP.`;
      if (o.to === 'allFoes' && who.self === WHO.self) return `ALL enemies lose ${a.num} HP.`;
      return `Take ${a.num} HP${who[o.to]}.`;
    }
    case 'barrier':
      // (on your own card: 'Each of your allies gains 3 Barrier.')
      if (o.to === 'allAllies' && who.self === WHO.self && !amountText(o.amount, o.scale).equal)
        return `Each of your allies gains ${at(o.amount, o.scale)} Barrier.`;
      return amountText(o.amount, o.scale).equal
        ? `Gain Barrier equal to ${amountText(o.amount, o.scale).num}${o.to === 'self' ? '' : who[o.to]}.`
        : `Gain ${at(o.amount, o.scale)} Barrier${o.to === 'self' ? '' : who[o.to]}.`;
    case 'growHp': {
      const n = at(o.amount, o.scale);
      return o.to === 'target'
        ? `The ally gains ${n} max HP.`
        : o.to === 'biggestAlly'
          ? `Your biggest companion gains ${n} max HP.`
          : `Your companions gain ${n} max HP.`;
    }
    case 'heal': {
      const a = amountText(o.amount, o.scale);
      const n = a.equal ? `HP equal to ${a.num}` : a.num;
      // healing a companion grows it instead (DECISIONS #356), so say so
      // (only on your own cards: an enemy's units are not companions, and only heal)
      if (o.to === 'allFriends' && who.self === WHO.self)
        return a.equal
          ? `Heal ${n}. Your companions gain as much max HP.`
          : `Heal ${n}. Your companions gain ${n} max HP.`;
      if (o.to === 'allAllies')
        return `Your companions gain ${a.equal ? `max HP equal to ${a.num}` : `${n} max HP`}.`;
      return `Heal ${n}${o.to === 'self' ? '' : who[o.to]}.`;
    }
    case 'cleanse': {
      const noun =
        o.to === 'self'
          ? 'you'
          : o.to === 'target'
            ? 'the target'
            : who[o.to].replace(/^ to /, '') || 'the target';
      return o.all
        ? `Dispel every debuff on ${noun}.`
        : o.pct
          ? `Lessen every debuff on ${noun} by ${o.pct}% (at least ${o.amount}).`
          : `Lessen every debuff on ${noun} by ${o.amount}.`;
    }
    case 'status': {
      // Fate is a curse: "Curse the target with 6 Fate"
      if (o.status === 'doom' && o.amount >= 0) {
        const noun =
          o.to === 'self'
            ? 'yourself'
            : o.to === 'target'
              ? 'the target'
              : who[o.to].replace(/^ to /, '') || 'the target';
        const a = amountText(o.amount, o.scale);
        return `Curse ${noun} with ${a.equal ? `Fate equal to ${a.num}` : `${a.num} Fate`}.`;
      }
      // an Opening (the Knight's): "The target is left Open." (DECISIONS #415)
      if (o.status === 'opening' && o.amount > 0 && !o.scale) {
        const whom =
          o.to === 'target'
            ? 'The target is'
            : o.to === 'allFoes'
              ? 'Every enemy is'
              : o.to === 'front'
                ? 'The front enemy is'
                : o.to === 'attacker'
                  ? 'The attacker is'
                  : o.to === 'randomFoe'
                    ? 'A random enemy is'
                    : 'It is';
        return `${whom} left Open.`;
      }
      // (the Shaman) Rousing and Shelter read as what they do to your next command
      if (o.status === 'freespell' && o.amount > 0 && o.to === 'self')
        return 'Your next Flame, Frost, Storm or Prism spell costs 0.';
      if (o.status === 'rousing' && o.amount > 0 && o.to === 'self') {
        const a = amountText(o.amount, o.scale);
        return `Your next Hawk or Bear command this turn deals or gives ${a.equal ? `more, ${a.num}` : `${a.num} more`}.`;
      }
      if (o.status === 'shelter' && o.amount > 0 && o.to === 'self')
        return 'This turn, your next command that gives Barrier gives it to every friendly.';
      // a Stun is counted in turns (DECISIONS #310): "Stun the attacker for 2 turns."
      if (o.status === 'stunned' && o.amount > 0 && !o.scale) {
        const whom =
          o.to === 'target'
            ? ' the target'
            : o.to === 'self'
              ? who.self === WHO.self
                ? ' yourself'
                : ' itself'
              : who[o.to].replace(/^ to /, ' ');
        return `Stun${whom} for ${o.amount} turn${o.amount === 1 ? '' : 's'}.`;
      }
      // Edge is what makes Sleeve Knives hit harder: say so on the card instead of leaving it to a tooltip
      if (o.status === 'edge' && o.to === 'self' && !o.scale && o.amount > 0)
        return `Gain ${o.amount} Edge: your Daggers deal ${o.amount} more damage ${o.temp ? 'this turn' : 'for the rest of the fight'}.`;
      // Fortified is on or off, so it has no number: "Gain Fortified" (DECISIONS #347)
      if (o.status === 'fortified' && o.amount > 0 && !o.scale) {
        const mine = o.to === 'self' && who.self === WHO.self;
        return `${mine ? 'Gain' : 'Apply'} Fortified${o.to === 'self' ? '' : who[o.to]}${o.temp === 'theirs' ? (o.to === 'self' ? ' until the enemy turn is over' : ' until the end of their next turn') : o.temp ? ' until the end of your turn' : ''}.`;
      }
      // the blade's statuses and the other Regent pieces say what they do (DECISIONS #369)
      if (o.amount > 0 && !o.scale && who.self === WHO.self) {
        const n = o.amount;
        if (o.status === 'reflect' && o.to === 'self')
          return 'Until your next turn, attack damage your Barrier soaks is dealt back to the attacker.';
        if (o.status === 'bladesweep' && o.to === 'self')
          return 'Your Obsidian Blade strikes ALL enemies for the rest of the fight.';
        if (o.status === 'bladeecho' && o.to === 'self')
          return `Your Obsidian Blade is played ${n === 1 ? 'one more time' : `${n} more times`} for the rest of the fight.`;
        if (o.status === 'bladebane' && o.to === 'target')
          return 'Your Obsidian Blade deals double damage to the target this turn.';
        if (o.status === 'freeplay' && o.to === 'self')
          return `The first ${n === 1 ? 'card' : `${n} cards`} you play each turn cost no Mana.`;
        if (o.status === 'orbit' && o.to === 'self')
          return `For the rest of the fight, every 4 Mana you spend gives ${n} Mana back.`;
      }
      // (the Necrobinder copy's statuses for yourself say what they do: they are not counted down)
      if (o.to === 'self' && who.self === WHO.self && !o.scale && o.amount > 0 && !o.temp) {
        if (o.status === 'marrow')
          return `Your companions’ attacks deal ${o.amount} more damage for the rest of the fight.`;
        if (o.status === 'lethality')
          return `For the rest of the fight, your first Attack each turn deals ${o.amount}% more damage.`;
        if (o.status === 'reaping')
          return 'For the rest of the fight, whenever your Attacks take HP off an enemy, curse it with that much Fate.';
        if (o.status === 'freeethereal')
          return o.amount === 1
            ? 'Your next Fleeting card costs 0.'
            : `Your next ${o.amount} Fleeting cards cost 0.`;
      }
      // (the Defect copy, shaman: these say what they do)
      if (o.to === 'self' && !o.scale && o.amount > 0 && who.self === WHO.self) {
        if (o.status === 'freepower')
          return o.amount === 1 ? 'Your next Aura costs 0.' : `Your next ${o.amount} Auras cost 0.`;
        if (o.status === 'boosted')
          return o.amount === 1
            ? 'Your next Aura is played an extra time.'
            : `Your next ${o.amount} Auras are played an extra time.`;
        if (o.status === 'echoing')
          return o.amount === 1
            ? 'The first card you play each turn is played an extra time.'
            : `The first ${o.amount} cards you play each turn are played an extra time.`;
        if (o.status === 'deftness')
          return `Your 0-cost Attacks deal ${o.amount} more damage for the rest of the fight.`;
      }
      // (on your own cards a status you put on yourself is gained or lost, not "applied")
      const mine = o.to === 'self' && who.self === WHO.self;
      const verb = o.amount < 0 ? (mine ? 'Lose' : 'Remove') : mine ? 'Gain' : 'Apply';
      // (on your own card, a status for every companion: "Each of your companions gains 3 Primed.")
      if (o.to === 'allAllies' && who.self === WHO.self && o.amount > 0 && !o.temp) {
        const a = amountText(o.amount, o.scale);
        return a.equal
          ? `Each of your companions gains ${sname(o.status)} equal to ${a.num}.`
          : `Each of your companions gains ${a.num} ${sname(o.status)}.`;
      }
      // (a number that depends on something reads "Apply Might equal to the Mana spent", not "Apply equal to ... Might")
      if (amountText(Math.abs(o.amount), o.scale).equal)
        return `${verb} ${sname(o.status)} equal to ${amountText(Math.abs(o.amount), o.scale).num}${o.to === 'self' ? '' : who[o.to]}${o.temp === 'theirs' ? (o.to === 'self' ? ' until the enemy turn is over' : ' until the end of their next turn') : o.temp ? ' until the end of your turn' : ''}.`;
      return `${verb} ${at(Math.abs(o.amount), o.scale)} ${sname(o.status)}${o.to === 'self' ? '' : who[o.to]}${o.temp === 'theirs' ? (o.to === 'self' ? ' until the enemy turn is over' : ' until the end of their next turn') : o.temp ? ' until the end of your turn' : ''}.`;
    }
    case 'scaleStatus': {
      const times = o.mult === 2 ? 'Double' : o.mult === 3 ? 'Triple' : `Multiply by ${o.mult}`;
      const most = o.max !== undefined ? ` (at most +${o.max})` : '';
      // multiplying by 0 spends it all
      if (o.mult === 0)
        return o.to === 'self'
          ? o.status === 'hangover'
            ? 'Clear your Hangover.'
            : `Lose all your ${sname(o.status)}.`
          : `Remove all ${sname(o.status)}${who[o.to] || ' from the target'}.`;
      if (o.status === 'doom') {
        const noun =
          o.to === 'target' ? 'the target' : who[o.to].replace(/^ to /, '') || 'the target';
        return `${times} the Fate cursing ${noun}${most}.`;
      }
      return `${times} the ${sname(o.status)}${who[o.to] || ' on the target'}${most}.`;
    }
    case 'draw': {
      const a = amountText(o.amount, o.scale);
      const hold = o.hold
        ? ` ${o.amount === 1 && !o.scale ? 'It Holds' : 'They Hold'} this turn.`
        : '';
      // (Scrape)
      const keep =
        o.keepCost !== undefined
          ? ` Discard the ones drawn this way that cost more than ${o.keepCost}.`
          : '';
      return a.equal
        ? `Draw cards equal to ${a.num}.${hold}${keep}`
        : `Draw ${a.num} card${o.amount === 1 && !o.scale ? '' : 's'}.${hold}${keep}`;
    }
    case 'mana': {
      if (o.amount < 0 && !o.scale) return `Lose ${-o.amount} Mana.`;
      const a = amountText(o.amount, o.scale);
      return a.equal ? `Gain Mana equal to ${a.num}.` : `Gain ${a.num} Mana.`;
    }
    case 'stars': {
      const a = amountText(Math.abs(o.amount), o.scale);
      const verb = o.amount < 0 ? 'Spend' : 'Gain';
      if (a.equal) return `${verb} Arcana equal to ${a.num}.`;
      return `${verb} ${a.num} Arcana.`;
    }
    case 'summon':
      return summonText(db, o.unit, 1, who);
    case 'addCard': {
      const nm = db.cards[o.card]?.name ?? o.card;
      const dest = `${o.side === 'self' ? 'your' : 'the enemy'} ${o.to === 'hand' ? 'hand' : o.to === 'draw' ? 'draw pile' : 'discard pile'}`;
      if (o.scale) {
        const a = amountText(o.times ?? 0, o.scale);
        return a.equal
          ? `Add ${plural(nm)} to ${dest} equal to ${a.num}.`
          : `Add ${a.num} ${plural(nm)} to ${dest}.`;
      }
      const n = o.times ?? 1;
      return `Add ${n > 1 ? `${n} ${plural(nm)}` : `${article(nm)} ${nm}`} to ${dest}.`;
    }
    case 'actAllies':
      return 'All your allies act now.';
    case 'prevent':
      // (it stops the one hit that sprang it, like Shielded; a move's other hits still land)
      return 'Cancel that hit.';
    case 'discard':
      if (o.amount >= 9 && !o.random && !o.any) return 'Discard your hand.';
      return o.random
        ? `Discard ${o.amount} random card${o.amount === 1 ? '' : 's'}.`
        : o.any
          ? 'Discard any number of cards.'
          : `Discard ${o.amount} card${o.amount === 1 ? '' : 's'}.`;
    case 'exhaustCards':
      if (o.everywhere && o.tag)
        return `Consume every ${TAG_NAMES[o.tag] ?? o.tag} in your hand, draw pile and discard pile.`;
      if (o.tag && o.amount >= 9) return `Consume every ${TAG_NAMES[o.tag] ?? o.tag} in your hand.`;
      if (o.not && o.amount >= 9)
        return `Consume every card in your hand that is not ${article(KIND_WORD2[o.not] ?? o.not)} ${KIND_WORD2[o.not] ?? o.not}.`;
      if (o.only)
        return `Consume ${o.amount === 1 ? `${o.random ? 'a random' : article(KIND_WORD2[o.only] ?? o.only)} ${KIND_WORD2[o.only] ?? o.only}` : `${o.amount} ${o.random ? 'random ' : ''}${KIND_WORD2[o.only] ?? o.only}s`} in your hand.`;
      if (o.amount >= 9 && !o.random && !o.any) return 'Consume your hand.';
      return o.random
        ? `Consume ${o.amount} random card${o.amount === 1 ? '' : 's'}.`
        : o.any
          ? 'Consume any number of cards.'
          : `Consume ${o.amount} card${o.amount === 1 ? '' : 's'}.`;
    case 'scry':
      return `Foresee ${o.amount}.`;
    case 'power': {
      // (a card kind by its player-facing name: an Aura, a Trap; DECISIONS #304)
      const KIND_WORD: Record<string, string> = { power: 'Aura', snare: 'Trap' };
      const what = o.tag
        ? `${article(TAG_NAMES[o.tag] ?? o.tag)} ${TAG_NAMES[o.tag] ?? o.tag}`
        : o.filter
          ? `${article(KIND_WORD[o.filter] ?? o.filter)} ${KIND_WORD[o.filter] ?? cap(o.filter)}`
          : 'a card';
      // (a cost limit: "a 0-cost Attack")
      const costed = o.maxCost !== undefined ? what.replace(/^an? /, `a ${o.maxCost}-cost `) : what;
      const rune = o.rune ? (db.runes?.[o.rune]?.name ?? o.rune) : '';
      // (with no kind or tag, a Fleeting or cost-floor narrowing names the card: "a card that costs 2 or more")
      const playWhat =
        o.tag || o.filter
          ? costed
          : o.ethereal
            ? 'a Fleeting card'
            : o.minCost !== undefined
              ? `a card that costs ${o.minCost} or more`
              : costed;
      // (an Aura that answers the next turn start only: Invoke)
      const nextTurn = o.times === 1 && o.when === 'turnStart';
      const base =
        o.when === 'play'
          ? `${o.once ? 'The first time you play' : 'Whenever you play'} ${playWhat}${o.once ? ' each turn' : ''}`
          : o.when === 'draw' && o.ethereal
            ? 'Whenever you draw a Fleeting card'
            : o.when === 'stance'
              ? `${o.once ? 'The first time each turn you enter' : 'Whenever you enter'} ${o.stance ? sname(o.stance) : 'a stance'}`
              : o.when === 'spend' && o.status
                ? `${o.once ? 'The first time each turn you spend' : 'Whenever you spend'} ${sname(o.status)}`
                : o.when === 'stanceLeft'
                  ? `${o.once ? 'The first time each turn you leave' : 'Whenever you leave'} ${o.stance ? sname(o.stance) : 'a stance'}`
                  : o.when === 'evoke'
                    ? `Whenever ${rune ? `${article(rune)} ${rune}` : 'a totem'} awakens`
                    : o.when === 'command' && o.rune
                      ? `Whenever you command your ${db.totems?.[o.rune]?.name ?? o.rune}`
                      : (o.when === 'created' || o.when === 'draw') && (o.tag || o.filter)
                        ? `${o.once ? 'The first time' : 'Whenever'} you ${o.when === 'draw' ? 'draw' : 'create'} ${what}${o.once ? ' each turn' : ''}`
                        : nextTurn
                          ? 'Next turn'
                          : o.once
                            ? // ("Whenever one of your allies dies" answered once a turn: Backup Core)
                              (WHEN_TEXT[o.when] ?? o.when).replace(
                                /^Whenever /,
                                'The first time each turn ',
                              )
                            : (WHEN_TEXT[o.when] ?? o.when);
      // ("the next time you earn an Opening": an answer that happens once, not a number of turns)
      const once1 = o.times === 1 && o.when !== 'turnStart' && o.when !== 'turnEnd';
      const when = once1
        ? base.replace(/^Whenever /, 'The next time ')
        : o.times && !nextTurn
          ? `For the next ${o.times} turn${o.times === 1 ? '' : 's'}, ${base.charAt(0).toLowerCase()}${base.slice(1)}`
          : base;
      // (an Aura that answers something done to an enemy aims at that enemy; an awakening's Aura strikes each enemy the totem struck)
      const inner =
        o.when === 'evoke'
          ? { ...who, target: ' to each enemy it struck' }
          : o.when === 'doomFoe' ||
              o.when === 'debuffFoe' ||
              o.when === 'opening' ||
              o.when === 'riposte' ||
              o.when === 'thorns' ||
              o.when === 'embed' ||
              o.when === 'extract'
            ? { ...who, target: ' to that enemy' }
            : who;
      return `${o.temp ? `This turn, ${when.charAt(0).toLowerCase()}${when.slice(1)}` : when}: ${o.ops.map((x) => opText(db, x, inner)).join(' ')}`;
    }
    case 'channel': {
      const nm = o.rune === '*' ? 'a random totem' : (db.runes?.[o.rune]?.name ?? o.rune);
      if (o.scale?.by === 'channeledOf')
        return `Plant ${nm} once for every ${db.runes?.[o.scale.rune ?? '']?.name ?? 'such totem'} you have planted this fight.`;
      if (o.scale)
        return o.scale.by === 'x'
          ? `Plant ${nm} X times.`
          : `Plant ${nm} once per ${METRIC_WORDS[o.scale.by].per}.`;
      return (o.times ?? 1) > 1 ? `Plant ${nm} ${o.times} times.` : `Plant ${nm}.`;
    }
    case 'evoke': {
      const n = o.count ?? 1;
      const t = o.times ?? 1;
      const xs = o.scale?.by === 'x' ? ' X times' : t > 1 ? ` ${t} times` : '';
      const end = o.last ? 'newest' : 'first';
      // (every totem at once reads "all your totems")
      if (n >= 10) return `Awaken all your totems${xs}.`;
      return `Awaken your ${n === 1 ? `${end} totem` : `${end} ${n} totems`}${xs}${o.keep ? ' (it stays)' : ''}.`;
    }
    case 'pulse': {
      const nm = o.rune ? (db.runes?.[o.rune]?.name ?? o.rune) : '';
      const which = o.first
        ? 'your first totem'
        : nm
          ? `every ${nm} you have`
          : 'every totem you have';
      const t = (o.times ?? 1) > 1 ? ` ${o.times} times` : '';
      return `Trigger the passive of ${which}${t}${o.aim ? ', against the target' : ''}.`;
    }
    case 'runeSlots':
      return `${o.amount >= 0 ? 'Gain' : 'Lose'} ${Math.abs(o.amount)} totem slot${Math.abs(o.amount) === 1 ? '' : 's'}.`;
    case 'stance':
      return o.stance === 'none' ? 'Leave your stance.' : `Enter ${sname(o.stance)}.`;
    case 'sacrifice':
      return o.self ? 'Then it dies.' : 'Sacrifice the chosen ally.';
    case 'reclaim':
      return `Return ${o.amount === 1 ? 'a random Consumed card' : `${o.amount} random Consumed cards`} to your hand (never one that returns cards).`;
    case 'revive':
      return 'Your most recently fallen ally returns with half its HP.';
    case 'fetch': {
      const what = o.tag
        ? (TAG_NAMES[o.tag] ?? o.tag)
        : o.kind
          ? `${KIND_PLURAL[o.kind]?.[0] ?? cap(o.kind)} card`
          : 'card';
      const n =
        o.maxCost !== undefined && o.amount >= 9
          ? `every ${what} that costs ${o.maxCost === 0 ? '0' : `${o.maxCost} or less`}`
          : o.amount === 1
            ? `a random ${what}`
            : `${o.amount} random ${what}s`;
      const up = o.upgrade ? ' It is upgraded.' : '';
      if (o.anywhere)
        return o.tag && o.amount === 1
          ? `Put your ${what} into your hand from wherever it is.${up}`
          : `Put ${n} into your hand from your piles.${up}`;
      return o.to === 'draw'
        ? `Put ${n} from your discard pile on top of your draw pile.${up}`
        : `Return ${n} from your discard pile to your hand.${up}`;
    }
    case 'manaNext':
      return o.amount < 0
        ? `Next turn, lose ${-o.amount} Mana.`
        : `Next turn, gain ${o.amount} extra Mana.`;
    case 'maxMana':
      return o.amount >= 0
        ? `From your next turn, gain ${o.amount} more Mana every turn for the rest of the fight.`
        : `Lose ${-o.amount} maximum Mana for the rest of the fight.`;
    case 'drawNext':
      return `Next turn, draw ${o.amount} extra card${o.amount === 1 ? '' : 's'}.`;
    case 'discover': {
      const kind = o.kind ? `${KIND_PLURAL[o.kind]?.[0] ?? o.kind} ` : '';
      const what = (o.count ?? 1) > 1 ? `${o.count} random ${kind}cards` : `a random ${kind}card`;
      const many = (o.count ?? 1) > 1;
      const free = many
        ? ' (they cost 0 the next time you play them)'
        : ' (it costs 0 the next time you play it)';
      const from = o.neutral ? 'Neutral' : 'from your pool';
      const upg = o.upgraded ? 'upgraded ' : '';
      const what2 =
        (o.count ?? 1) > 1 ? `${o.count} random ${upg}${kind}` : `a random ${upg}${kind}`;
      if (o.neutral || o.upgraded)
        return `Add ${what2}${o.neutral ? 'Neutral ' : ''}card${(o.count ?? 1) > 1 ? 's' : ''}${o.neutral ? '' : ` ${from}`} to your hand${o.free ? free : ''}.`;
      if (o.scale && (o.count ?? 1) === 0)
        return `Add a random card from your pool to your hand for each ${METRIC_WORDS[o.scale.by].per}.`;
      return `Add ${what} from your pool to your hand${o.free ? free : ''}.${o.ethereal ? ` ${many ? 'They are' : 'It is'} Fleeting.` : ''}`;
    }
    case 'upgrade':
      if (o.scope === 'discard') {
        const n = o.amount ?? 1;
        return `Upgrade ${n === 1 ? 'a random card' : `${n} random cards`} in your discard pile for this fight.`;
      }
      return o.scope === 'hand'
        ? 'Upgrade every card in your hand for this fight.'
        : 'Upgrade a random card in your hand for this fight.';
    case 'cheapen':
      if (o.scope === 'self') return `This card costs ${o.amount} less until you play it.`;
      return o.scope === 'hand'
        ? `Cards in your hand cost ${o.amount} less the next time you play them.`
        : `A random card in your hand costs ${o.amount} less the next time you play it.`;
    case 'copySelf':
      return `Add a ${o.free ? '0-cost ' : ''}copy of this card to your ${o.to === 'hand' ? 'hand' : o.to === 'draw' ? 'draw pile' : 'discard pile'}.`;
    case 'playPile': {
      const what = o.kind ? (KIND_WORD2[o.kind] ?? o.kind) : 'card';
      const n = o.scale
        ? o.scale.by === 'x'
          ? 'the top X cards'
          : 'cards'
        : o.amount && o.amount > 1
          ? `the top ${o.amount} cards`
          : 'the top card';
      const end = o.exhaust ? ' and consume it' : '';
      if (o.from === 'draw' && o.kind)
        return `Play a random ${what} from your draw pile against a random enemy${end}.`;
      if (o.from === 'draw')
        return o.scale?.by === 'x' || (o.amount ?? 1) > 1
          ? `Play ${n} of your draw pile.`
          : `Play the top card of your draw pile${end}.`;
      if (o.from === 'exhaust' && o.all) {
        const nm = o.tag ? (TAG_NAMES[o.tag] ?? o.tag) : what;
        return `${o.upgrade ? 'Upgrade and play' : 'Play'} every ${nm} in your consumed pile${o.aim === 'target' ? ' against the target' : ''}; they go back there.`;
      }
      if (o.from === 'exhaust')
        return 'Play a random card from your consumed pile; it goes back there.';
      if (o.from === 'hand')
        return (o.repeat ?? 1) > 1
          ? `Play a random ${what} from your hand ${o.repeat} times.`
          : `Play a random ${what} from your hand against a random enemy.`;
      return `Play it against a random enemy${o.match ? ` if it is a ${cap(o.match)} card` : ''}.`;
    }
    case 'manaLock':
      return 'No more Mana can be gained this turn.';
    case 'drawLock':
      return 'You cannot draw more cards this turn.';
    case 'drawUntil':
      return `Draw cards until you draw a card that is not ${article(KIND_WORD2[o.not] ?? o.not)} ${KIND_WORD2[o.not] ?? o.not}.`;
    case 'exhaustTop':
      return o.amount === 1
        ? 'Consume the top card of your draw pile.'
        : `Consume the top ${o.amount} cards of your draw pile.`;
    case 'transform': {
      const into = db.cards[o.into]?.name ?? o.into;
      const kindWord = o.tag
        ? (TAG_NAMES[o.tag] ?? o.tag)
        : o.kind
          ? (KIND_WORD2[o.kind] ?? o.kind)
          : 'card';
      const pile = o.from === 'draw' ? 'your draw pile' : 'your hand';
      if (o.amount === undefined && !o.choose)
        return `Turn every ${kindWord} in ${pile} into ${article(into)} ${into}.`;
      if (o.amount === undefined)
        return `Turn any number of cards in ${pile} into ${plural(into)}.`;
      const n =
        o.amount === 1
          ? `${o.choose ? 'a' : 'a random'} ${kindWord}`
          : `${o.amount} ${o.choose ? '' : 'random '}${kindWord}s`;
      return `Turn ${n} in ${pile} into ${o.amount === 1 ? `${article(into)} ${into}` : plural(into)}.`;
    }
    case 'when':
      return `If ${whenText(o, db)}: ${sayRepeats(o.ops.map((x) => opText(db, x, who))).join(' ')}`;
    case 'copyPlayed':
      return 'Add a copy of that card to your hand.';
    case 'maxHp': {
      const a = amountText(o.amount, undefined);
      return `Raise your max HP by ${a.num} for good.`;
    }
    case 'extraReward':
      return o.amount === 1
        ? 'Gain an extra card reward after this fight.'
        : `Gain ${o.amount} extra card rewards after this fight.`;
    case 'forge': {
      const word = forgeWord(db, o.card);
      if (o.scale) return `${word} ${at(o.amount, o.scale)}.`;
      return `${word} ${o.amount} (${db.cards[o.card]?.name ?? o.card} gains ${o.amount} damage).`;
    }
    // (assassin) the Silent-shaped pieces
    case 'tick': {
      const whom =
        o.to === 'target' ? 'the target' : who[o.to].replace(/^ to /, '') || 'the target';
      return `The Bleed on ${whom} deals its damage now.`;
    }
    case 'strip': {
      const whom =
        o.to === 'target' ? 'the target' : who[o.to].replace(/^ to /, '') || 'the target';
      return `Remove all Barrier and Steadfast from ${whom}.`;
    }
    case 'selfCost':
      return `This card costs ${o.amount} less for the rest of the fight.`;
    case 'freeHand':
      return 'Every card in your hand costs 0 this turn.';
    case 'giveSly':
      return 'A random Skill in your hand gains Sly this turn.';
    case 'copyNext':
      return `Choose a card in your hand. Next turn, add ${o.times} cop${o.times === 1 ? 'y' : 'ies'} of it to your hand.`;
    case 'barrierNext':
      return `Next turn, gain ${o.amount} Barrier.`;
    case 'starsNext':
      return `Next turn, gain ${o.amount} Arcana.`;
    case 'topdeck':
      if (o.from === 'draw')
        return `Choose ${o.amount === 1 ? 'a card' : `${o.amount} cards`} in your draw pile and put ${o.amount === 1 ? 'it' : 'them'} on top.`;
      return `Put ${o.amount === 1 ? 'a card' : `${o.amount} cards`} from your hand on top of your draw pile.`;
    case 'endTurn':
      return 'End your turn.';
    case 'growSelf':
      return `This card deals ${o.amount} more damage for the rest of the fight.`;
    case 'copyInHand':
      return `Add a copy of a random ${o.neutral ? 'Neutral ' : ''}card in your hand to your hand.`;
    // --- the Necrobinder copy
    case 'raise': {
      const times = o.scale
        ? o.scale.by === 'x'
          ? ' X times'
          : ` once per ${METRIC_WORDS[o.scale.by].per}`
        : o.times === 2
          ? ' twice'
          : (o.times ?? 1) > 1
            ? ` ${o.times} times`
            : '';
      return `Raise ${o.amount}${times}.`;
    }
    case 'command': {
      // "Your companions each deal 6 damage." (what they read of themselves is theirs: "equal to its HP")
      const lines = o.ops.map((x, i) => {
        if (x.op === 'sacrifice' && x.self) return 'Then they die.';
        // ("deal 6 damage plus their own HP": a blow that reads each companion itself)
        if (
          x.op === 'damage' &&
          x.scale &&
          (x.scale.by === 'hp' || x.scale.by === 'maxHp') &&
          (x.scale.mult ?? 1) === 1 &&
          !x.scale.of &&
          !x.scale.into
        ) {
          const plain = { ...x };
          delete plain.scale;
          const t = opText(db, plain, who).replace(
            / damage(.*)\.$/,
            ` damage$1, plus their own ${x.scale.by === 'hp' ? 'HP' : 'max HP'}.`,
          );
          return i === 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t;
        }
        const t = opText(db, x, who).replace(/\byour (HP|max HP)\b/g, 'its $1');
        return i === 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t;
      });
      return `Your companions each ${lines.join(' ')}`;
    }
    case 'doomNow':
      return o.to === 'target'
        ? 'If its HP is at or below its Fate, the target dies now.'
        : `Every enemy whose HP is at or below its Fate dies now.`;
    case 'spreadDebuffs':
      return "Put the target's debuffs on every other enemy too.";
    case 'mark': {
      const what =
        o.flag === 'ethereal'
          ? 'Fleeting'
          : o.flag === 'retain'
            ? 'Hold'
            : 'Replay (it is played one more time)';
      return `A random card in your hand gains ${what}${o.costUp ? ` and costs ${o.costUp} more for this fight` : ''}.`;
    }
    case 'costTax':
      return `Cards cost ${o.amount} more this turn.`;
    // (the Defect copy, shaman)
    case 'recost':
      return o.amount > 0
        ? `This card costs ${o.amount} more for the rest of the fight.`
        : `This card costs ${-o.amount} less for the rest of the fight.`;
    case 'reshuffle':
      return 'Shuffle your hand and discard pile into your draw pile.';
    case 'returnPlayed':
      return 'Return it to your hand.';
    // (the Knight's Guard)
    case 'riposte': {
      const t = sayRepeats(o.ops.map((x) => opText(db, x, who))).join(' ');
      return `Riposte: ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
    }
    // (the Assassin's knives and Preparation)
    case 'embed': {
      const n = o.amount === 1 ? 'a knife' : `${o.amount} knives`;
      const where =
        (o.to ?? 'target') === 'allFoes'
          ? 'each enemy'
          : o.to === 'randomFoe'
            ? 'a random enemy'
            : who.target === ''
              ? 'the target'
              : who.target.replace(/^ to /, '');
      return `Embed ${n} in ${where}.`;
    }
    case 'extract': {
      const all = o.amount >= 9;
      const from =
        (o.to ?? 'target') === 'allFoes'
          ? 'every enemy'
          : who.target === ''
            ? 'the target'
            : who.target.replace(/^ to /, '');
      const what = all
        ? `every knife from ${from}`
        : o.amount === 1
          ? `a knife from ${from}`
          : `up to ${o.amount} knives from ${from}`;
      // (everything a knife pays reads as one clause: "for each, apply 1 Faltering and gain 4 Barrier")
      const parts = (o.ops ?? []).map((x) =>
        opText(db, x, { ...who, target: ' to that enemy' })
          .replace(/\.$/, '')
          .replace(/^./, (c) => c.toLowerCase())
          .replace(/^the target /, 'that enemy '),
      );
      const each = parts.length
        ? `: for each, ${parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]}.`
        : '.';
      return `Pull ${what}${each}`;
    }
    case 'shedTemp':
      return `Shed up to ${o.amount} of your temporary ${sname(o.status)}.`;
    case 'spend':
      return o.amount >= 9
        ? `Spend all your ${sname(o.status)}.`
        : `Spend up to ${o.amount} ${sname(o.status)}.`;
    // (the Spellblade's enchantments)
    case 'imbue':
      return o.ifRoom ? `Imbue ${cap(o.kind)} if your blade has room.` : `Imbue ${cap(o.kind)}.`;
    case 'discharge':
      if (o.kind)
        return o.count >= 2
          ? `Discharge every ${cap(o.kind)}.`
          : `Discharge ${o.kind === 'ember' ? 'an' : 'a'} ${cap(o.kind)}.`;
      return o.count >= 2 ? 'Discharge both enchantments.' : 'Discharge an enchantment.';
    case 'echoCharges':
      return 'They take effect again.';
    case 'recast':
      return 'Your newest enchantment becomes another kind (your choice).';
    // (the Shaman's totems)
    case 'plant': {
      if (o.spirit === '*')
        return o.anywhere
          ? 'Plant a totem of your choice, in a position you choose.'
          : 'Plant a totem of your choice.';
      const nm = db.totems?.[o.spirit]?.name ?? o.spirit;
      return o.anywhere
        ? `Plant ${article(nm)} ${nm} in a position you choose.`
        : `Plant ${article(nm)} ${nm}.`;
    }
    case 'uproot':
      return 'Uproot all your totems.';
    case 'totemSlot':
      return 'Gain a totem position.';
    case 'totemCommand': {
      const n = o.times ?? 1;
      const twice = n === 1 ? '' : n === 2 ? ' twice' : ` ${n} times`;
      if (o.spirit === 'all') return `Command every totem you have${twice}.`;
      if (o.spirit === 'random') return `Command a random totem${twice}.`;
      if (o.spirit === 'choose') return `Command a totem of your choice${twice}.`;
      const nm = db.totems?.[o.spirit]?.name ?? o.spirit;
      return o.one
        ? `Command ${article(nm)} ${nm}${twice}.`
        : `Command every ${nm} you have${twice}.`;
    }
    // (the Monk's forms)
    case 'form':
      return o.form === '*' ? 'You may change form.' : `Enter ${cap(o.form)} form.`;
  }
}

/** "Summon X (12 HP). At the end of your turn it will: ..." (or "Summon 3 Xs (12 HP each)..." for several of the same). */
function summonText(db: CombatDb, unit: string, n: number, who: Record<Sel, string>): string {
  const u = db.units[unit];
  if (!u) return `Summon ${unit}.`;
  const acts =
    u.brain.kind === 'ally'
      ? u.brain.act
          .filter((x) => x.op !== 'summon')
          .map((x) => opText(db, x, who))
          .join(' ')
      : '';
  // (a Heavy or Colossal says how many companion slots it takes, DECISIONS #383)
  const slots = u.slots ?? 1;
  const frame = slots >= 3 ? 'Colossal: 3 slots, ' : slots === 2 ? 'Heavy: 2 slots, ' : '';
  const head =
    n > 1
      ? `Summon ${n} ${u.name}s (${frame}${u.maxHp} HP each${u.taunt ? ', Taunt' : ''}).`
      : `Summon ${u.name} (${frame}${u.maxHp} HP${u.taunt ? ', Taunt' : ''}).`;
  return `${head}${acts ? ` At the end of your turn ${n > 1 ? 'each' : 'it'} will: ${acts}` : ''}`;
}

/**
 * The text of one damage effect with what it would deal right now marked in it ([[live:up:9]], [[live:down:3-5]]...): the printed number
 * is replaced, or, when the printed amount is a formula (per Barrier...), the live number follows the sentence in brackets.
 */
function liveDamageText(text: string, o: Extract<Op, { op: 'damage' }>, l: LiveDamage): string {
  const num = l.lo === l.hi ? String(l.lo) : `${l.lo}-${l.hi}`;
  if (l.calc) {
    const dot = text.indexOf('.');
    const mark = `[[live:calc:${num}]]`;
    return dot < 0 ? `${text} (${mark})` : `${text.slice(0, dot)} (${mark})${text.slice(dot)}`;
  }
  // (green when it can only be more than printed, red when only less, gold for a range that goes both ways)
  const dir =
    l.lo === l.hi && l.lo === l.printed
      ? 'same'
      : l.lo >= l.printed
        ? 'up'
        : l.hi <= l.printed
          ? 'down'
          : 'calc';
  // (a sharpened weapon's "+1 per point of sharpening" is already in the live number, so it goes)
  const printed = new RegExp(`^Deal ${o.amount}( \\([^)]*\\))? damage`);
  // (the live number already counts the Riposte bonus: the clause says so instead of reading as more on top)
  const ripText = l.riposte
    ? text.replace(/ Riposte: \+\d+ damage( each hit)?\./, ' (Riposte counted.)')
    : text;
  // (DECISIONS #432) a lone-enemy bonus that is already in the number says so, instead of reading as 25% more on top
  const body = l.lone
    ? ripText
        .replace(
          / Point Blank: (\d+)% more when only one enemy is left\./,
          ' (Point Blank +$1% counted.)',
        )
        .replace(/ \((\d+)% more when only one enemy stands\)/, ' (+$1% counted: one enemy)')
    : ripText;
  const done = printed.test(body)
    ? body.replace(printed, `Deal [[live:${dir}:${num}]] damage`)
    : body;
  // (the Spellblade: a discharged Ember adds to the first hit only of an attack that hits more than once)
  const f = l.first;
  if (!f) return done;
  const extra = f.lo === f.hi ? `+${f.hi}` : `+${f.lo}-${f.hi}`;
  const dot = done.indexOf('.');
  return dot < 0
    ? `${done} (${extra} on the first hit)`
    : `${done.slice(0, dot)} (${extra} on the first hit)${done.slice(dot)}`;
}

/**
 * A card's rules text. With `live` (what previewCardDamage says it would deal now, by effect index), each damage number is marked
 * with what it would really deal, for the card in your hand.
 */
export function cardText(db: CombatDb, c: CardDef, live?: ReadonlyMap<number, LiveDamage>): string {
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
  if (c.unplayable) parts.push('Unplayable.');
  if (c.needsExhausted)
    parts.push(`Only playable with ${c.needsExhausted} or more cards consumed.`);
  if (c.cheaperPerAttack)
    parts.push(`Costs ${c.cheaperPerAttack} less for each Attack played this turn.`);
  // (assassin) Sly, Pinpoint's discount, Grand Finale's condition
  if (c.sly) parts.push('Sly.');
  // (the Drunkard's Stagger: its damage lands on a random enemy, DECISIONS #393)
  if (c.tags?.includes('stagger')) parts.push('Stagger.');
  // (the Shaman's elements, DECISIONS #420)
  if (c.tags?.includes('flame')) parts.push('Flame.');
  if (c.tags?.includes('frost')) parts.push('Frost.');
  if (c.tags?.includes('storm')) parts.push('Storm.');
  if (c.tags?.includes('prism'))
    parts.push(
      "Prism (for Trinity and your totems' help, it counts as an element you have not cast this turn).",
    );
  // (the Monk's techniques, DECISIONS #419: a step of his form's objective)
  if (c.tags?.includes(DEFENSIVE_TAG)) parts.push('Defensive technique.');
  if (c.tags?.includes(STRIKING_TAG)) parts.push('Striking technique.');
  if (c.cheaperPerSkill)
    parts.push(`Costs ${c.cheaperPerSkill} less for each Skill played this turn.`);
  if (c.needsEmptyDraw) parts.push('Only playable while your draw pile is empty.');
  // (the Necrobinder copy)
  if (c.cheaperPer)
    parts.push(`Costs ${c.cheaperPer.mult} less for each ${METRIC_WORDS[c.cheaperPer.by].per}.`);
  if (c.freeIf)
    parts.push(
      c.freeIf.by === 'allyStrikes' && c.freeIf.atLeast === 1
        ? 'Costs 0 if your companions have struck this turn.'
        : `Costs 0 while ${METRIC_WORDS[c.freeIf.by].equal} is ${c.freeIf.atLeast} or more.`,
    );
  if (c.recallOnCost)
    parts.push(
      `Whenever you play a card that costs ${c.recallOnCost} or more, this returns from your discard pile to your hand.`,
    );
  if (c.replayFromExhaust)
    parts.push(
      'At the start of your turn, if this is consumed, it is played for free and goes back.',
    );
  // (an Arcana cost is shown on the card itself, under the Mana cost: it is not said again in the text)
  if (c.starX) parts.push('Spend all your Arcana: X is the Arcana spent.');
  if (c.xBonus) parts.push(`X is ${c.xBonus} higher.`);
  const who: Record<Sel, string> =
    c.target === 'ally' || c.target === 'friend' ? { ...WHO, target: ' to the ally' } : WHO;
  // an Aura with nothing ongoing, giving one lasting status: that line says it lasts (DECISIONS #300)
  const oneShotAura =
    c.kind === 'power' &&
    !c.effects.some((o) => o.op === 'power' || o.op === 'channel' || o.op === 'runeSlots') &&
    c.effects.filter((o) => isLasting(o)).length === 1;
  // several of the same summon in a row read as one line ("Summon 3 Bone Thralls...")
  for (let i = 0; i < c.effects.length; i++) {
    const o = c.effects[i] as Op;
    if (o.op === 'summon') {
      let n = 1;
      while (
        c.effects[i + n]?.op === 'summon' &&
        (c.effects[i + n] as { unit?: string }).unit === o.unit
      )
        n++;
      parts.push(summonText(db, o.unit, n, who));
      i += n - 1;
    } else {
      // a card that grows every copy of itself (Gathering Storm) says so, instead of naming a weapon to Sharpen (DECISIONS #353)
      const growsItself =
        c.effects.some((x) => x.op === 'forge' && x.card === c.id.replace(/\+$/, '')) ||
        (c.onDraw ?? []).some((x) => x.op === 'growSelf');
      // an "X" status cost on the card already says it spends all of it, so the text does not (DECISIONS #357)
      if (
        o.op === 'scaleStatus' &&
        o.mult === 0 &&
        o.to === 'self' &&
        c.statusCost?.x &&
        o.status === c.statusCost.status
      )
        continue;
      if (o.op === 'forge' && growsItself) {
        parts.push(`Every copy of this card gains ${o.amount} damage for the rest of the fight.`);
        continue;
      }
      // (its damage reads "plus all it has grown", not "per point of sharpening")
      if (growsItself && o.op === 'damage' && o.scale?.by === 'bonus' && !live?.get(i)) {
        const plain = { ...o };
        delete plain.scale;
        parts.push(opText(db, plain, who).replace(/ damage\.$/, ' damage, plus all it has grown.'));
        continue;
      }
      // (the same status to a random enemy several times in a row reads as one line: "... to a random enemy 3 times.")
      if (o.op === 'status' && o.to === 'randomFoe') {
        let n = 1;
        while (JSON.stringify(c.effects[i + n]) === JSON.stringify(o)) n++;
        if (n > 1) {
          parts.push(opText(db, o, who).replace(/\.$/, ` ${n} times.`));
          i += n - 1;
          continue;
        }
      }
      const l = o.op === 'damage' ? live?.get(i) : undefined;
      const line =
        l && o.op === 'damage' ? liveDamageText(opText(db, o, who), o, l) : opText(db, o, who);
      parts.push(
        oneShotAura && isLasting(o) ? line.replace(/.$/, ' for the rest of the fight.') : line,
      );
    }
  }
  // an Aura that does its work once, when played, says how long what it gives lasts (DECISIONS #300)
  const ongoing = c.effects.some(
    (o) => o.op === 'power' || o.op === 'channel' || o.op === 'runeSlots',
  );
  const lasting = c.effects.filter((o) => isLasting(o)).length;
  if (c.kind === 'power' && !ongoing && lasting > 1)
    parts.push('These last the rest of the fight.');
  if (c.exhaust) parts.push('Consume.');
  if (c.retain) parts.push('Hold.');
  if (c.innate) parts.push('Opening hand.');
  if (c.ethereal) parts.push('Fleeting.');
  if (c.onDiscard) parts.push(`If discarded: ${c.onDiscard.map((o) => opText(db, o)).join(' ')}`);
  if (c.onExhaust) parts.push(`If consumed: ${c.onExhaust.map((o) => opText(db, o)).join(' ')}`);
  if (c.onDraw) parts.push(`When you draw this: ${c.onDraw.map((o) => opText(db, o)).join(' ')}`);
  if (c.after === 'hand') parts.push('It goes back to your hand after you play it.');
  if (c.after === 'drawTop') parts.push('It goes on top of your draw pile after you play it.');
  if (c.returnEvery)
    parts.push(
      `Every ${c.returnEvery.n} ${KIND_WORD2[c.returnEvery.kind] ?? c.returnEvery.kind}s you play in a turn, it comes back to your hand.`,
    );
  if (c.playFromTop)
    parts.push('At the end of your turn, if this is on top of your draw pile, it is played.');
  if (c.inHandAtEnd)
    parts.push(
      `At the end of your turn, if this is in your hand: ${c.inHandAtEnd.map((o) => opText(db, o)).join(' ')}`,
    );
  if (c.cheaperOnCreate)
    parts.push(
      `Whenever you create ${article(TAG_NAMES[c.cheaperOnCreate] ?? c.cheaperOnCreate)} ${TAG_NAMES[c.cheaperOnCreate] ?? c.cheaperOnCreate}, this costs 1 less until played.`,
    );
  const text = parts.join(' ');
  // a Trap that springs on a summon or on Barrier answers an enemy that did not attack: "that enemy", not "the attacker"
  // (an "HP lost" Trap still answers whoever hit you: it keeps "the attacker")
  return c.kind === 'snare' && (c.trigger?.on === 'foeSummons' || c.trigger?.on === 'foeDefends')
    ? text.replace(/the attacker/g, 'that enemy')
    : text;
}

/**
 * Events as `viewer` may see them: the other side's draws, discards and added cards lose their card identity, and a
 * Trap being set is just "a Trap" until it springs. Use this for anything sent to or shown to one player (PvP).
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
      case 'transform':
        return e.side === viewer ? e : { ...e, def: '' };
      case 'play':
        return e.side !== viewer && db.cards[e.def]?.kind === 'snare' ? { ...e, def: '' } : e;
      default:
        return e;
    }
  });
}
