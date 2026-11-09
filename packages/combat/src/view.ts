// What a client may see (hidden information removed) plus generated card / intent text. Presentation helpers only.

import {
  modifiedDamage,
  activePattern,
  formProgress,
  previewAllyDamage,
  type LiveDamage,
} from './engine';
import { disciplineAttack, disciplineText, disciplineLabel } from './disciplines';
import { attackAuraBonus, attackAuraProgress } from './attackAuras';
import {
  other,
  clone,
  enemyGuardFactor,
  snareCap,
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
  /** Public current-board calculation for a summoned companion acting now. */
  damagePreview?: LiveDamage;
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
  disciplineText?: string;
  disciplineLabel?: string;
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
  /** how many Traps this side can have set at once */
  snareCap: number;
  hero: string | null;
  /** Potion ids (your own side only) and how many each side holds */
  potions: string[] | null;
  potionCount: number;
  stars: number;
  /** (the Knight) Mana kept as Reserves, and the most that can be kept this turn */
  reserves: number;
  maxReserves: number;
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
  /** (the Trickster's Suits) the Full Tricks made so far this fight: each makes the next one hit harder */
  fullTricks?: number;
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
  powers: { id: string; card: string; when: PowerState['when'] | 'passive' }[];
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
    to === 'target' ||
    to === 'allFoes' ||
    to === 'randomFoe' ||
    to === 'front' ||
    to === 'foeHero' ||
    to === 'weakestFoe' ||
    to === 'targetOrMostFracture' ||
    to === 'targetOrRandom' ||
    to === 'mostBledFoe';
  for (const o of ops) {
    if (o.op === 'damage' || o.op === 'loseHp') out.add('attack');
    else if (o.op === 'barrier') out.add('defend');
    else if (o.op === 'summon') out.add('summon');
    else if (o.op === 'status') out.add(foeSel(o.to) ? 'debuff' : 'buff');
    else if (o.op === 'heal' || o.op === 'attackAura') out.add('buff');
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
  const preview = previewAllyDamage(db, s, u.id);
  return {
    move: 'act',
    name: 'End of turn',
    text: `At the end of its side's turn: ${act.map((o) => opText(db, o, WHO)).join(' ')}`,
    icons: opIcons(act),
    // (its Primed goes into that strike, as an enemy's does: DECISIONS #361)
    ...(preview ? { damagePreview: preview } : {}),
    damage:
      preview?.lo ??
      (first
        ? Math.floor(
            (modifiedDamage(
              // (the Foreman's companions hit harder by a percentage, on the base and rounded, as the engine does it: DECISIONS #542)
              Math.round(
                (first.amount +
                  (first.scale ? 0 : (u.statuses.vigor ?? 0)) +
                  attackAuraBonus(s.sides[u.side], u, true) +
                  (s.sides[u.side].units.find((x) => x.kind === 'hero')?.statuses.marrow ?? 0)) *
                  (1 + (s.sides[u.side].allyPct ?? 0) / 100),
              ),
              u,
              first.to === 'target' ? front : null,
            ) *
              (100 +
                disciplineAttack(
                  s,
                  s.sides[u.side],
                  u,
                  null,
                  front,
                  db.units[u.def]?.slots ?? 1,
                ))) /
              100,
          )
        : null),
    hits: preview?.hits ?? (first ? dmg.reduce((n, o) => n + (o.hits ?? 1), 0) : 0),
    target: first?.to === 'target' ? (front?.id ?? null) : null,
    ...(area ? { area } : {}),
  };
}

/** what a Veiled unit shows in place of its intent */
export const VEILED_INTENT: IntentView = {
  move: 'veiled',
  name: 'Veiled',
  text: 'Its intent is hidden. Hit it to see what it will do.',
  icons: ['special'],
  damage: null,
  hits: 0,
  target: null,
};

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
  // (DECISIONS #548) its own Barrier and healing, grown with the tier as the engine grows them
  const f = s.sides[u.side].hero === null ? enemyGuardFactor(s.tier, s.enemyHpPct) : 1;
  // (every selector that picks from its own side, as the engine grows anything given to its own side)
  const own = (to: Sel): boolean =>
    to === 'self' || to === 'allFriends' || to === 'allAllies' || to === 'biggestAlly';
  const shown = (o: Op): Op =>
    f === 1
      ? o
      : (o.op === 'barrier' || o.op === 'heal') && !o.scale && own(o.to)
        ? { ...o, amount: Math.round(o.amount * f) }
        : o.op === 'devour'
          ? { ...o, heal: Math.round(o.heal * f) }
          : o;
  return {
    move: mv.id,
    name: mv.name,
    text: mv.effects.map((o) => opText(db, shown(o), WHO_ENEMY)).join(' '),
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
        // (Nyxara's rule, DECISIONS #546) a Veiled unit's intent is hidden from the other side until it is hit
        if (!own && (u.statuses.veiled ?? 0) > 0) {
          // (nor does what it last did, or where it is in its loop)
          return {
            ...clone(u),
            intent: null,
            lastMoves: u.lastMoves.slice(0, -1),
            pat: '',
            patCount: 0,
            moveCount: 0,
            intentView: { ...VEILED_INTENT, icons: [...VEILED_INTENT.icons] },
            ...(u.kind === 'ally' ? { slots } : {}),
          };
        }
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
      snareCap: snareCap(sd),
      hero: sd.hero,
      potions: own ? [...sd.potions] : null,
      potionCount: sd.potions.length,
      stars: sd.stars,
      ...(sd.discipline
        ? { disciplineText: disciplineText(sd) ?? '', disciplineLabel: disciplineLabel(sd, s) }
        : attackAuraProgress(sd)
          ? { disciplineLabel: attackAuraProgress(sd) ?? '' }
          : {}),
      reserves: sd.reserves,
      maxReserves: sd.maxReserves + (sd.reservesTurn ?? 0),
      attacksPlayed: sd.attacksPlayed,
      skillsPlayed: sd.skillsPlayed,
      played: sd.played,
      allyStrikes: sd.allyStrikes ?? 0,
      drawnTurn: sd.drawnTurn ?? 0,
      doomedTurn: sd.doomedTurn ?? 0,
      etherealPlayed: sd.etherealPlayed ?? 0,
      deaths: sd.deaths ?? 0,
      costTax: sd.costTax ?? 0,
      ...(sd.suitsTurn ? { suitsTurn: [...sd.suitsTurn], fullTricks: sd.fullTricks ?? 0 } : {}),
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
      powers: [
        ...sd.powers
          .filter((p) => p.card !== TRAIT_POWER)
          .map((p) => ({ id: p.id, card: p.card, when: p.when })),
        ...(sd.attackAuras ?? [])
          .filter((p) => p.card !== TRAIT_POWER)
          .map((p) => ({ id: p.id, card: p.card, when: 'passive' as const })),
      ],
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
  'keen',
  'ruinous',
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
  attackerOrRandom: ' to the attacker',
  weakestFoe: ' to the enemy with the least HP',
  biggestAlly: ' to your biggest companion',
  foeHero: ' to the enemy hero',
  targetOrMostFracture: ' to its target (or the enemy with the most Fracture)',
  targetOrRandom: ' to its target (or a random enemy)',
  mostBledFoe: ' to the enemy with the most Bleed',
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
  attackerOrRandom: ' to the attacker',
  weakestFoe: ' to your unit with the least HP',
  biggestAlly: ' to its biggest ally',
  foeHero: ' to you',
  targetOrMostFracture: ' to its target (or your unit with the most Fracture)',
  targetOrRandom: ' to its target (or a random unit of yours)',
  mostBledFoe: ' to your unit with the most Bleed',
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
  virulent: 'Hemorrhage',
  burn: 'Burn',
  freeattack: 'Free Attack',
  freeskill: 'Free Skill',
  resonance: 'Spirit',
  twinned: 'Reverb',
  fracture: 'Fracture',
  keen: 'Keen',
  ruinous: 'Measured Ruin',
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
  umbra: 'Owl Charge',
  stunned: 'Shocked',
  buffer: 'Buffer',
  backup: 'Backup Core',
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
const TOTEM_WORDS: Record<string, string> = {
  hawk: 'Hawk',
  bear: 'Bear',
  thunderbird: 'Thunderbird',
  elder: 'Elder Tree',
  owl: 'Moon Owl',
};
const TAG_NAMES: Record<string, string> = {
  knife: 'Dagger',
  blade: 'Obsidian Blade',
  sword: 'Sword',
  spell: 'Spell',
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
  paidAttacksPlayed: 'Attacks costing 1 or more played this turn',
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
    per: 'max HP of your biggest living companion',
    equal: "your biggest living companion's max HP",
  },
  slots: { per: 'companion slot filled', equal: 'the companion slots filled' },
  foes: { per: 'enemy', equal: 'the number of enemies' },
  snares: { per: 'Trap set', equal: 'the number of Traps you have set' },
  stars: { per: 'Spell Power', equal: 'your Spell Power' },
  starSpend: { per: 'Spell Power spent', equal: 'the Spell Power spent' },
  starsSpentTurn: { per: 'Spell Power spent this turn', equal: 'the Spell Power spent this turn' },
  lastSpend: { per: 'Spell Power that card spent', equal: 'the Spell Power that card spent' },
  prevSpell: { per: 'Spell', equal: 'your previous card being a Spell' },
  swordsPlayed: { per: 'Sword played this turn', equal: 'the Swords played this turn' },
  spellsPlayed: { per: 'Spell played this turn', equal: 'the Spells played this turn' },
  swordFoes: {
    per: 'different enemy your Swords hit this turn',
    equal: 'the different enemies your Swords hit this turn',
  },
  fracture: { per: 'Fracture', equal: 'its Fracture' },
  shatteredNow: { per: 'Shatter caused', equal: 'the Shatters caused' },
  runes: { per: 'totem', equal: 'the number of your totems' },
  powers: { per: 'Aura you have', equal: 'the number of your Auras' },
  mana: { per: 'Mana left', equal: 'your Mana' },
  played: { per: 'card played this turn', equal: 'the cards played this turn' },
  attacksPlayed: { per: 'Attack played this turn', equal: 'the Attacks played this turn' },
  paidAttacksPlayed: {
    per: 'Attack costing 1 or more played this turn',
    equal: 'the Attacks costing 1 or more played this turn',
  },
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
  starsGained: { per: 'Spell Power gained this turn', equal: 'the Spell Power gained this turn' },
  starCards: {
    per: 'card with a Spell Power cost in your deck',
    equal: 'the number of cards with a Spell Power cost in your deck',
  },
  handRoom: { per: 'empty place in your hand', equal: 'the room left in your hand' },
  hitsTaken: { per: 'time it was hit this turn', equal: 'the times it was hit this turn' },
  suits: { per: 'suit played this turn', equal: 'the suits played this turn' },
  spades: { per: '♠ played this turn', equal: 'whether a ♠ was played this turn' },
  hearts: { per: '♥ played this turn', equal: 'whether a ♥ was played this turn' },
  diamonds: { per: '♦ played this turn', equal: 'whether a ♦ was played this turn' },
  clubs: { per: '♣ played this turn', equal: 'whether a ♣ was played this turn' },
  spent: { per: 'Spell Power spent', equal: 'the Spell Power spent' },
  charge: { per: 'charge', equal: 'its charge' },
  healed: { per: 'HP healed', equal: 'the HP healed' },
  bonus: { per: 'point of sharpening', equal: 'its sharpening' },
  // --- the Necrobinder copy
  maxHp: { per: 'max HP', equal: 'max HP' },
  fallenMaxHp: { per: "of the fallen companion's max HP", equal: "the fallen companion's max HP" },
  diedMaxHp: { per: "of the fallen companion's max HP", equal: "the fallen companion's max HP" },
  dealt: { per: 'damage dealt', equal: 'the damage dealt' },
  lost: { per: 'HP lost', equal: 'the HP it lost' },
  hpLostNow: { per: 'HP you lost', equal: 'the HP you lost' },
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
  fullTrickTurn: {
    per: 'Full Trick completed this turn',
    equal: 'whether you completed a Full Trick this turn',
  },
  summonedFight: {
    per: 'companion summoned this fight',
    equal: 'the companions summoned this fight',
  },
  snaresSprung: { per: 'Trap sprung this fight', equal: 'the Traps sprung this fight' },
  fervorGained: { per: 'Fervor gained this fight', equal: 'the Fervor gained this fight' },
  tagExhaustedBeforePlay: {
    per: 'previously consumed card of that kind',
    equal: 'the previously consumed cards of that kind',
  },
  tagExhausted: { per: 'consumed card of that kind', equal: 'the consumed cards of that kind' },
  tagDeck: { per: 'card of that kind in your deck', equal: 'the cards of that kind in your deck' },
  tagPlayed: {
    per: 'card of that kind played this fight',
    equal: 'the cards of that kind played this fight',
  },
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
  umbra: { per: 'Owl charge', equal: 'the Owl charge' },
  reserves: { per: 'Reserve', equal: 'your Reserves' },
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
function amountText(
  n: number,
  sc: Scale | undefined,
  /** whose number `each` reads, where the sentence knows ("your", "its") */
  each = 'their ',
): { num: string; equal: boolean } {
  if (!sc || sc.into === 'hits') return { num: String(n), equal: false };
  // (a tagged count names its cards: "per consumed Gravesoul", "per Command card in your deck")
  const tagged = sc.tag ? (TAG_NAMES[sc.tag] ?? cap(sc.tag)) : null;
  const w =
    tagged && (sc.by === 'tagExhausted' || sc.by === 'tagExhaustedBeforePlay')
      ? {
          per: `${sc.by === 'tagExhaustedBeforePlay' ? 'previously ' : ''}consumed ${tagged}`,
          equal: `the number of ${sc.by === 'tagExhaustedBeforePlay' ? 'previously ' : ''}consumed ${plural(tagged)}`,
        }
      : tagged && sc.by === 'tagDeck'
        ? { per: `${tagged} in your deck`, equal: `the number of ${plural(tagged)} in your deck` }
        : tagged && sc.by === 'tagPlayed'
          ? {
              per: `${tagged} you played earlier this fight`,
              equal: `the number of ${plural(tagged)} you played earlier this fight`,
            }
          : sc.by === 'totemsOf' && sc.rune
            ? {
                per: `${TOTEM_WORDS[sc.rune] ?? cap(sc.rune)} you have`,
                equal: `the number of ${plural(TOTEM_WORDS[sc.rune] ?? cap(sc.rune))} you have`,
              }
            : sc.by === 'hitsTaken'
              ? // (who was hit is part of the phrase: "per time the target was hit this turn")
                sc.of === 'target'
                ? {
                    per: 'time the target was hit this turn',
                    equal: 'the times the target was hit this turn',
                  }
                : sc.of === 'each'
                  ? { per: 'time it was hit this turn', equal: 'the times it was hit this turn' }
                  : {
                      per: 'time you were hit this turn',
                      equal: 'the times you were hit this turn',
                    }
              : METRIC_WORDS[sc.by];
  const named = sc.by === 'hitsTaken';
  // (half of a number, rounded down: "equal to half your Spell Power")
  if (sc.step === 2 && n === 0 && (sc.mult ?? 1) === 1 && !sc.of)
    return { num: `half ${METRIC_WORDS[sc.by].equal}`, equal: true };
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
        ? each
        : 'your '
    : '';
  // (DECISIONS #434) a capped count says its cap
  const capped = `${sc.round === 'ceil' ? ', rounded up' : ''}${sc.min !== undefined ? ` (at least ${sc.min})` : ''}${sc.max !== undefined ? ` (at most ${sc.max})` : ''}`;
  if (n === 0) {
    const mult =
      m === 1
        ? ''
        : m === 0.5
          ? 'half '
          : m === 0.25
            ? 'a quarter '
            : Math.abs(m - 2 / 3) < 1e-9
              ? 'two thirds '
            : m > 1
              ? `${m} times `
              : `${Math.round(m * 100)}% of `;
    return {
      num: `${mult}${mult && !/ of $/.test(mult) && m < 1 ? 'of ' : ''}${whose}${w.equal}${capped}`,
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
  return {
    num: `${n} (${per}${on}${sc.max !== undefined ? `, at most +${sc.max}` : ''})`,
    equal: false,
  };
}

/** Sentences that repeat one after another read once, with how often: "Gain 6 Barrier. Gain 6 Barrier." is "Gain 6 Barrier twice." */
/** The verbs that start a sentence of card text, lowered when that sentence joins another. Keywords (Consume, Foresee...) keep their capital. */
const JOINS_LOWER =
  /^(Deal|Gain|Draw|Apply|Add|Lose|Heal|Put|Return|Raise|Summon|Plant|Awaken|Command|Shock|Cancel|Choose|Discard|Your|Each|All|This|That|It|Next|Spend|Move|Remove|Copy|Play|Upgrade|Mark|End)\b/;
const lowerStart = (line: string): string =>
  JOINS_LOWER.test(line) ? line.charAt(0).toLowerCase() + line.slice(1) : line;

/**
 * Everything one trigger or condition does, as one sentence, so a reader can see where it stops (DECISIONS #485): "Draw 1 card and gain 2
 * Barrier." A line that is itself more than one sentence cannot be folded into a list, so those join with a semicolon.
 */
export function joinClause(lines: readonly string[]): string {
  const said = sayRepeats(lines).map((l) => l.replace(/\.$/, ''));
  if (said.length === 0) return '';
  const [first, ...rest] = said as [string, ...string[]];
  if (rest.length === 0) return `${first}.`;
  const tail = rest.map(lowerStart);
  if (said.some((l) => /[.:] /.test(l))) return `${[first, ...tail].join('; ')}.`;
  const last = tail.pop() as string;
  return `${[first, ...tail].join(', ')} and ${last}.`;
}

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
  turnSettled: 'After your hand clears and companions act at the end of your turn',
  play: 'Whenever you play a card',
  playStart: 'Before a card you play resolves',
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
  loseHp: 'Whenever you lose HP to your own cards or Hangover',
  hurt: 'Whenever you lose HP',
  draw: 'Whenever you draw a card',
  created: 'Whenever a card is created',
  arcana: 'Whenever you spend Spell Power',
  fracture: 'Whenever a card of yours applies Fracture',
  shatter: 'Whenever you Shatter an enemy',
  grown: 'Whenever a card of yours grows',
  shuffle: 'Whenever your deck is reshuffled',
  exposeFoe: 'Whenever you apply Exposed to an enemy',
  hitFoe: 'Whenever an Attack of yours deals damage to an enemy’s HP',
  drawMidTurn: 'Whenever you draw a card during your turn',
  gainArcana: 'Whenever you gain Spell Power',
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
  command: 'Whenever you command a totem or push one out',
  orderedCommand: 'Whenever you finish an ordered totem command',
  hangoverPaid: 'Whenever Hangover costs you HP',
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
  if (o.by === 'fullTrickTurn')
    return (lo ?? 0) >= 1
      ? 'you completed a Full Trick this turn'
      : 'you did not complete a Full Trick this turn';
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
  if (o.by === 'allies' && hi === 0 && lo === undefined && !o.of) return 'you have no companion';
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
  // (the Spellblade's, DECISIONS #480)
  if (o.by === 'starSpend' && lo !== undefined && hi === undefined)
    return lo === 1 ? 'you spent any' : `you spent ${lo} or more`;
  if (o.by === 'stars' && hi === 0 && lo === undefined) return 'you had no Spell Power';
  if (o.by === 'stars' && lo === 1 && hi === undefined) return 'you have Spell Power left';
  if (o.by === 'stars' && lo !== undefined && hi === undefined)
    return `you have ${lo} or more Spell Power`;
  if (o.by === 'starsSpentTurn' && hi === 0 && lo === undefined)
    return 'you spent no Spell Power this turn';
  if (o.by === 'starsSpentTurn' && lo === 1 && hi === undefined)
    return 'you spent Spell Power earlier this turn';
  if (o.by === 'starsSpentTurn' && lo !== undefined && hi === undefined)
    return `you spent ${lo} or more Spell Power earlier this turn`;
  if (o.by === 'prevSpell' && lo === 1) return 'your previous card was a Spell';
  if (o.by === 'spellsPlayed' && lo === 1) return 'you played a Spell earlier this turn';
  if (o.by === 'swordsPlayed' && lo === 1) return 'you played a Sword earlier this turn';
  if (o.by === 'shatteredNow' && lo === 1) return 'this caused a Shatter';
  if (o.by === 'fracture' && o.of === 'target' && lo === 1) return 'the target has Fracture';
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

/** Statuses the engine only reads as there or not: more stacks change nothing, so a card does not give them a number. */
export const ON_OR_OFF: ReadonlySet<string> = new Set([
  'fortified',
  'fanned',
  'bladesweep',
  'poised',
  'sturdy',
  'unmovable',
  'cruelty',
  'tracking',
  'unbound',
  'planner',
  'meld',
]);

export function opText(db: CombatDb, o: Op, who: Record<Sel, string> = WHO): string {
  const at = (n: number, sc: Scale | undefined): string => {
    const a = amountText(n, sc);
    return a.equal ? `equal to ${a.num}` : a.num;
  };
  switch (o.op) {
    case 'discipline':
      return 'Establish your Ascendancy combat discipline.';
    case 'oncePerTurn':
      return `Once ${o.ownTurn ? 'on your turn' : 'per turn'} across all copies: ${joinClause(o.ops.map((x) => opText(db, x, who)))}`;
    case 'damage': {
      const a = amountText(o.amount, o.scale);
      // (a spread: "to 2 different random enemies")
      if (o.distinct && o.to === 'randomFoe' && (o.hits ?? 1) > 1)
        return `Deal ${a.equal ? `damage equal to ${a.num}` : `${a.num} damage`} to ${o.hits} different random enemies${o.lonePct ? ` (${o.lonePct}% more when only one enemy stands)` : ''}.`;
      let times = o.hits && o.hits > 1 ? ` ${o.hits} times` : '';
      if (o.scale?.into === 'hits') {
        const tagName = o.scale.tag ? (TAG_NAMES[o.scale.tag] ?? cap(o.scale.tag)) : null;
        const w =
          tagName && o.scale.by === 'tagDeck'
            ? {
                per: `${tagName} in your deck`,
                equal: `the number of ${plural(tagName)} in your deck`,
              }
            : METRIC_WORDS[o.scale.by];
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
            ? hits > 0
              ? ` X+${hits} times`
              : ' X times'
            : hits === 0
              ? `${m === 1 ? '' : ` ${m} times`} for each ${w.per}`
              : `${hits > 1 ? ` ${hits} times` : ''}, ${more} per ${o.scale.step ? `${o.scale.step} ` : ''}${w.per}`;
      }
      // Point Blank: more against a lone enemy
      const lone = o.lonePct ? ` Point Blank: ${o.lonePct}% more when only one enemy is left.` : '';
      // (#696: a finisher)
      const finish = o.finisher
        ? ` ${o.finisher.mult === 2 ? 'Double' : `${o.finisher.mult} times the`} damage to an enemy at ${o.finisher.belowPct === 50 ? 'half' : `${o.finisher.belowPct}%`} HP or less.`
        : '';
      // (Lifesteal: heal that percent of the HP it took off)
      const steal = o.lifesteal ? ` Lifesteal ${o.lifesteal}%.` : '';
      const cracks = o.hitFracture ? ` Each hit applies ${o.hitFracture} Fracture.` : '';
      const kill =
        (o.onKill
          ? ` If this is fatal: ${joinClause(o.onKill.map((x) => opText(db, x, who)))}`
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
        ? `Deal damage equal to ${a.num}${tail}.${lone}${finish}${steal}${cracks}${kill}`
        : `Deal ${a.num} damage${tail}.${lone}${finish}${steal}${cracks}${kill}`;
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
      // (Bonded Dead, #691: the companion with the most max HP pays)
      if (o.to === 'biggestAlly') return `Your healthiest companion loses ${a.num} HP.`;
      return `Take ${a.num} HP${who[o.to]}.`;
    }
    case 'barrier':
      // (on your own card: 'Each of your allies gains 3 Barrier.')
      if (o.to === 'allAllies' && who.self === WHO.self && !amountText(o.amount, o.scale).equal)
        return `Each of your allies gains ${at(o.amount, o.scale)} Barrier.`;
      return amountText(o.amount, o.scale).equal
        ? `Gain Barrier equal to ${amountText(o.amount, o.scale, o.to === 'self' ? (who.self === WHO.self ? 'your ' : 'its ') : 'their ').num}${o.to === 'self' ? '' : who[o.to]}.`
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
          ? `Heal ${n} and your companions gain as much max HP.`
          : `Heal ${n} and your companions gain ${n} max HP.`;
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
        const a = amountText(
          o.amount,
          o.scale,
          noun === 'you' || noun === 'yourself' ? 'your ' : noun === 'itself' ? 'its ' : 'their ',
        );
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
      // a Shock is counted in turns (DECISIONS #310): "Shock the attacker for 2 turns."
      if (o.status === 'stunned' && o.amount > 0 && !o.scale) {
        const whom =
          o.to === 'target'
            ? ' the target'
            : o.to === 'self'
              ? who.self === WHO.self
                ? ' yourself'
                : ' itself'
              : who[o.to].replace(/^ to /, ' ');
        return `Shock${whom} for ${o.amount} turn${o.amount === 1 ? '' : 's'}.`;
      }
      // Edge is what makes Sleeve Knives hit harder: say so on the card instead of leaving it to a tooltip
      if (o.status === 'edge' && o.to === 'self' && !o.scale && o.amount > 0)
        return `Gain ${o.amount} Edge: your first 4 Daggers each turn deal ${o.amount} more damage ${o.temp ? 'this turn' : 'for the rest of the fight'}.`;
      // a status that is on or off has no number: "Gain Fortified" (DECISIONS #347, #492)
      if (ON_OR_OFF.has(o.status) && o.amount > 0 && !o.scale) {
        const mine = o.to === 'self' && who.self === WHO.self;
        return `${mine ? 'Gain' : 'Apply'} ${sname(o.status)}${o.to === 'self' ? '' : who[o.to]}${o.temp === 'theirs' ? (o.to === 'self' ? ' until the enemy turn is over' : ' until the end of their next turn') : o.temp ? ' until the end of your turn' : ''}.`;
      }
      // the blade's statuses and the other Regent pieces say what they do (DECISIONS #369)
      if (o.amount > 0 && !o.scale && who.self === WHO.self) {
        const n = o.amount;
        if (o.status === 'reflect' && o.to === 'self')
          return 'Until your next turn, attack damage your Barrier soaks is dealt back to the attacker.';
        if (o.status === 'bladesweep' && o.to === 'self')
          return 'Your Obsidian Blade strikes ALL enemies for the rest of the fight.';
        if (o.status === 'bladeecho' && o.to === 'self')
          return `Your Obsidian Blade strikes ${n === 1 ? '1 more time' : `${n} more times`} for the rest of the fight.`;
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
        if (o.status === 'twinned')
          return o.amount === 1
            ? 'Gain 1 Reverb: your next Attack is played twice.'
            : `Gain ${o.amount} Reverb: your next ${o.amount} Attacks are played twice.`;
        if (o.status === 'umbra')
          return `Gain ${o.amount} Owl Charge: a commanded Moon Owl hits the enemy with the least HP for 6 plus all the charge, and the charge is spent.`;
        if (o.status === 'buffer')
          return o.amount === 1
            ? 'The next time you would lose HP, you lose none instead.'
            : `The next ${o.amount} times you would lose HP, you lose none instead.`;
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
            : who === WHO_ENEMY
              ? `It loses all its ${sname(o.status)}.`
              : `Lose all your ${sname(o.status)}.`
          : `Remove all ${sname(o.status)}${who[o.to] || ' from the target'}.`;
      if (o.mult === 0.5) return `Halve the ${sname(o.status)}${who[o.to] || ' on the target'}.`;
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
      // (a generator's own growth is shown on the card as "Grown +N", not as a number per point)
      if (o.scale?.by === 'bonus') return `${verb} ${Math.abs(o.amount)} Spell Power.`;
      if (a.equal) return `${verb} Spell Power equal to ${a.num}.`;
      return `${verb} ${a.num} Spell Power.`;
    }
    // (the Spellblade's Fracture, DECISIONS #480)
    case 'fracture': {
      if (o.scale?.by === 'bonus') return `Apply ${o.amount} Fracture${who[o.to]}.`;
      const n = amountText(o.amount, o.scale);
      if (o.marked) return `Apply ${n.num} Fracture to each enemy that has Fracture.`;
      return n.equal
        ? `Apply Fracture equal to ${n.num}${who[o.to]}.`
        : `Apply ${n.num} Fracture${who[o.to]}.`;
    }
    case 'shatterUp':
      return o.pct
        ? `Your Shatters deal ${o.pct}% more for the rest of the fight.`
        : `Your Shatters deal ${o.amount} more for the rest of the fight.`;
    case 'allyPct':
      return `Your companions' attacks deal ${o.amount}% more for the rest of the fight.`;
    case 'attackAura': {
      const subject =
        o.scope === 'companions'
          ? "Your companions' attacks"
          : 'Your attacks and your companions’ attacks';
      return o.perSummons
        ? `${subject} deal ${o.amount ? `${o.amount} plus ` : ''}1 more damage per hit for every ${o.perSummons} companions summoned this fight (starting companions do not count).`
        : `${subject} deal ${o.amount} more damage per hit for the rest of the fight. Companions summoned later also benefit.`;
    }
    case 'shatterBlast':
      return `Deal the damage of this enemy's next Shatter (this is not a Shatter).`;
    case 'carryFracture':
      return `Apply ${o.amount} Fracture, plus half the Fracture on your most-cracked other enemy. With only one enemy, apply ${o.alone}.`;
    case 'empower':
      return `Choose a generator in your hand: it yields ${o.amount} more for the rest of the fight.`;
    case 'summon':
      return `${o.replace?.length ? 'Dismiss its previous escort (not deaths). ' : ''}${summonText(db, o.unit, 1, who)}${o.ifAbsent ? ' (if none stands)' : ''}`;
    case 'devour': {
      const nm = db.units[o.unit]?.name ?? o.unit;
      const healed = [o.heal > 0 ? `${o.heal}` : '', o.healPct ? `${o.healPct}% of its max HP` : '']
        .filter(Boolean)
        .join(' plus ');
      const gain = [healed ? `heals ${healed}` : '', o.might > 0 ? `gains ${o.might} Might` : '']
        .filter(Boolean)
        .join(' and ');
      const none = o.none?.length
        ? ` With none to eat: ${o.none.map((x) => opText(db, x, who)).join(' ')}`
        : '';
      return `Eats every ${nm}: for each, it ${gain}.${none}`;
    }
    case 'swapBarrier':
      return 'Takes your Barrier, and gives you its own.';
    case 'addCard': {
      const nm = db.cards[o.card]?.name ?? o.card;
      const owner =
        who === WHO_ENEMY
          ? o.side === 'self'
            ? 'its'
            : 'your'
          : o.side === 'self'
            ? 'your'
            : 'the enemy';
      const dest = `${owner} ${o.to === 'hand' ? 'hand' : o.to === 'draw' ? 'draw pile' : 'discard pile'}`;
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
      return 'Command your companions to act now.';
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
    case 'reserves':
      return `Gain ${o.amount} Reserve${o.amount === 1 ? '' : 's'}.`;
    case 'maxReserves':
      return `Max Reserves +${o.amount} ${o.turn ? 'this turn' : 'for the rest of the fight'}.`;
    case 'defer':
      return o.upTo
        ? `Defer up to ${o.count} card${o.count === 1 ? '' : 's'}.`
        : o.count === 1
          ? 'Defer a card.'
          : `Defer ${o.count} cards.`;
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
      const tagged = (t: string) => `${article(TAG_NAMES[t] ?? t)} ${TAG_NAMES[t] ?? t}`;
      const what = o.tag
        ? `${tagged(o.tag)}${o.orTag ? ` or ${tagged(o.orTag)}` : ''}`
        : o.filter
          ? `${article(KIND_WORD[o.filter] ?? o.filter)} ${KIND_WORD[o.filter] ?? cap(o.filter)}`
          : 'a card';
      // (a cost limit: "a 0-cost Attack")
      const costed =
        o.maxCost !== undefined
          ? what.replace(/^an? /, `a ${o.maxCost}-cost `)
          : // (a kind or tag with a cost floor, #692: "an Attack that costs 1 or more")
            o.minCost !== undefined && (o.tag || o.filter)
            ? `${what} that costs ${o.minCost} or more`
            : what;
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
      // (an Aura that answers only while something holds, DECISIONS #480)
      const onlyBy = o.only?.by;
      const base =
        onlyBy === 'prevSpell'
          ? `The first time each turn you play ${playWhat} straight after a Spell`
          : onlyBy === 'lastSpend'
            ? 'The first time each turn you play a card that spends Spell Power'
            : onlyBy === 'spent'
              ? `The first time each turn a card spends ${o.only?.atLeast} or more Spell Power`
              : onlyBy === 'stars'
                ? 'The first time each turn you spend your last Spell Power'
                : o.when === 'play'
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
                                    ? // A recurring trigger limited to its first answer each turn.
                                      (WHEN_TEXT[o.when] ?? o.when).replace(
                                        /^Whenever /,
                                        'The first time each turn ',
                                      )
                                    : (WHEN_TEXT[o.when] ?? o.when);
      // ("the next time you earn an Opening": an answer that happens once, not a number of turns)
      const once1 = o.times === 1 && o.when !== 'turnStart' && o.when !== 'turnEnd';
      const timing = o.ownTurn ? base.replace(/each turn/g, 'on your turn') : base;
      const when = once1
        ? timing.replace(/^Whenever /, 'The next time ')
        : o.times && !nextTurn
          ? `For the next ${o.times} turn${o.times === 1 ? '' : 's'}, ${base.charAt(0).toLowerCase()}${base.slice(1)}`
          : timing;
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
      const limit = o.perTurnLimit ?? o.perRoundLimit;
      const limitPeriod =
        o.perRoundLimit !== undefined
          ? 'each round, until your next turn'
          : o.ownTurn
            ? 'on your turn'
            : 'each turn';
      const limitText =
        limit === undefined
          ? ''
          : limit === 1
            ? ` (once ${limitPeriod})`
            : ` (first ${limit} activations ${limitPeriod})`;
      const later = o.afterLimit?.length
        ? ` Whenever it activates again that ${o.perRoundLimit !== undefined ? 'round' : 'turn'}: ${joinClause(o.afterLimit.map((x) => opText(db, x, inner)))}`
        : '';
      const said = joinClause(o.ops.map((x) => opText(db, x, inner))) + later;
      // (a Sapped put on an enemy while an enemy is hitting you ends with that enemy turn; one from your own cards, with the coming one)
      const body =
        o.when === 'hurt'
          ? said.split('until the end of their next turn').join("until the end of the enemy's turn")
          : said;
      const opening =
        (o.temp ? `This turn, ${when.charAt(0).toLowerCase()}${when.slice(1)}` : when) +
        limitText +
        (o.barrierCap !== undefined
          ? ` (up to ${o.barrierCap} Barrier per copy each turn, after modifiers)`
          : '');
      // ("At the end of your turn, if you spent none: ...", not two colons in a row)
      return body.startsWith('If ') ? `${opening}, if ${body.slice(3)}` : `${opening}: ${body}`;
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
      return o.hpPct === undefined
        ? 'Your most recently fallen ally returns with half its HP.'
        : `Your most recently fallen ally returns with ${o.hpPct}% of its HP (rounded down, at least 1).`;
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
      const up = o.upgrade ? ', upgraded' : '';
      if (o.anywhere)
        return o.tag && o.amount === 1
          ? `Put your ${what} into your hand from wherever it is${up}.`
          : `Put ${n} into your hand from your piles${up}.`;
      return o.to === 'draw'
        ? `Put ${n} from your discard pile on top of your draw pile${up}.`
        : `Return ${n} from your discard pile to your hand${up}.`;
    }
    case 'manaNext':
      if (o.foe)
        return `Next turn, you have ${Math.abs(o.amount)} ${o.amount < 0 ? 'less' : 'more'} Mana.`;
      return o.amount < 0
        ? `Next turn, lose ${-o.amount} Mana.`
        : `Next turn, gain ${o.amount} extra Mana.`;
    case 'maxMana':
      return o.amount >= 0
        ? `From your next turn, gain ${o.amount} more Mana every turn for the rest of the fight.`
        : `Lose ${-o.amount} maximum Mana for the rest of the fight.`;
    case 'drawNext':
      if (o.foe)
        return `Next turn, you draw ${Math.abs(o.amount)} ${o.amount < 0 ? 'fewer' : 'more'} ${Math.abs(o.amount) === 1 ? 'card' : 'cards'}.`;
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
      const thisTurn = many ? ' (they cost 0 this turn)' : ' (it costs 0 this turn)';
      const less = o.cheaper ? ` (${many ? 'they cost' : 'it costs'} ${o.cheaper} less until played)` : '';
      return `Add ${what} from your pool to your hand${o.free ? free : o.turn ? thisTurn : less}${o.ethereal ? `, ${many ? 'all ' : ''}Fleeting` : ''}.`;
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
        const quantity =
          o.limit === undefined
            ? `every ${nm}`
            : `up to ${o.limit} ${nm}${o.limit === 1 ? '' : 's'}`;
        return `${o.upgrade ? 'Upgrade and play' : 'Play'} ${quantity} in your consumed pile${o.aim === 'target' ? ' against the target' : ''}; they go back there.`;
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
      const made = db.cards[o.into];
      const what =
        made && made.hero === 'junk' && !made.tags?.includes('status')
          ? ` (${made.cost}-cost: ${cardText(db, made).replace(/\.\s*$/, '')})`
          : '';
      if (o.amount === undefined && !o.choose)
        return `Turn every ${kindWord} in ${pile} into ${article(into)} ${into}${what}.`;
      if (o.amount === undefined)
        return `Turn any number of cards in ${pile} into ${plural(into)}.`;
      const n =
        o.amount === 1
          ? `${o.choose ? 'a' : 'a random'} ${kindWord}`
          : `${o.amount} ${o.choose ? '' : 'random '}${kindWord}s`;
      return `Turn ${n} in ${pile} into ${o.amount === 1 ? `${article(into)} ${into}` : plural(into)}.`;
    }
    case 'when':
      // ("If A and B: ...", not "If A: If B: ...")
      if (o.ops.length === 1 && o.ops[0]?.op === 'when')
        return `If ${whenText(o, db)} and ${opText(db, o.ops[0], who).slice(3)}`.replace(
          /^If you played a (\w+) earlier this turn and you played a (\w+) earlier this turn:/,
          'If you played a $1 and a $2 earlier this turn:',
        );
      return `If ${whenText(o, db)}: ${joinClause(o.ops.map((x) => opText(db, x, who)))}`;
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
      const target = db.cards[o.card.replace(/\+$/, '')];
      const name = target?.name ?? o.card;
      // (a weapon is a card of the deck: only the copies there now take it, and with none it does nothing, DECISIONS #436, #441)
      if (target?.weapon)
        return `${word} ${o.amount} (every ${name} you have deals ${o.amount} more damage for the rest of the fight).`;
      // (another card that grows, Gathering Storm grown by Tempest Call: said in full, and that it is made when there is none)
      return `Every ${name} you have deals ${o.amount} more damage for the rest of the fight (with none, one is added to your hand).`;
    }
    // (assassin) the Silent-shaped pieces
    case 'tick': {
      const whom =
        o.to === 'target' ? 'the target' : who[o.to].replace(/^ to /, '') || 'the target';
      return `The Bleed on ${whom} deals its damage now.`;
    }
    case 'strip':
      if (o.amount !== undefined) return `Remove up to ${o.amount} Barrier from the target.`;
      {
        const whom =
          o.to === 'target' ? 'the target' : who[o.to].replace(/^ to /, '') || 'the target';
        // (it takes Steadfast too, but so few enemies have any that saying so only made the cards read as niche: DECISIONS #478)
        return `Remove all Barrier from ${whom}.`;
      }
    case 'selfCost':
      return `This card costs ${o.amount} less for the rest of the fight.`;
    case 'freeHand':
      return 'Every card in your hand costs 0 this turn.';
    case 'giveSly':
      return 'A random Skill in your hand gains Premeditate this turn.';
    case 'copyNext':
      return `Choose a card in your hand. Next turn, add ${o.times} cop${o.times === 1 ? 'y' : 'ies'} of it to your hand.`;
    case 'barrierNext':
      return `Next turn, gain ${o.amount} Barrier.`;
    case 'starsNext':
      return `Next turn, gain ${o.amount} Spell Power.`;
    case 'topdeck':
      if (o.from === 'draw')
        return `Choose ${o.amount === 1 ? 'a card' : `${o.amount} cards`} in your draw pile and put ${o.amount === 1 ? 'it' : 'them'} on top.`;
      return `Put ${o.amount === 1 ? 'a card' : `${o.amount} cards`} from your hand on top of your draw pile.`;
    case 'endTurn':
      return 'End your turn.';
    case 'growSelf':
      if (o.that) return `That card grows ${o.amount} more.`;
      if (o.grown)
        return `Grows ${o.amount}: this card gains ${o.amount} more each time you play it.`;
      return `This card deals ${o.amount} more damage for the rest of the fight.`;
    case 'copyInHand':
      return `Add a copy of a random ${o.neutral ? 'Neutral ' : ''}card in your hand to your hand.`;
    // --- the Necrobinder copy
    case 'raise': {
      // ("Raise Dead 6" since #684, Robert 2026-11-07: a Bone Thrall with 6 HP, or with every slot taken the healthiest companion
      // gains 6 max HP; the Raise Dead keyword explains it. Another unit is named.)
      // ("Raise Colossus 18" for the Grave Colossus: the last word of a companion's name, #684)
      const what =
        o.unit === 'bone-thrall'
          ? 'Raise Dead'
          : `Raise ${(db.units[o.unit]?.name ?? o.unit).split(' ').at(-1)}`;
      if (o.scale?.by === 'x') return `${what} ${o.amount}, X times.`;
      if (o.scale) return `${what} ${o.amount} for each ${METRIC_WORDS[o.scale.by].per}.`;
      const n = o.times ?? 1;
      return n > 1
        ? `${what} ${o.amount} ${n === 2 ? 'twice' : `${n} times`}.`
        : `${what} ${o.amount}.`;
    }
    case 'command': {
      // (a Command that gives the companions up, Bone Rain: "Each of your Bone Thralls dies. For each one: you gain 9 Barrier and deal
      // 9 damage to ALL enemies." Robert 2026-11-08: the old "Your companions each gain 9 Barrier to your hero... Then they die." read
      // as if the Thralls were shielded, and a Colossus never takes part)
      if (o.ops.some((x) => x.op === 'sacrifice' && x.self)) {
        const nm = o.unit ? db.units[o.unit]?.name : undefined;
        const each = nm ? `Each of your ${nm}s dies.` : 'Each of your companions dies.';
        const parts = o.ops
          .filter((x) => !(x.op === 'sacrifice' && x.self))
          .map((x) => {
            const t = opText(db, x, who).replace(/\.$/, '');
            const low = t.charAt(0).toLowerCase() + t.slice(1);
            return x.op === 'barrier' && x.to === 'hero'
              ? `you gain ${x.amount} Barrier`
              : low.replace(/^gain\b/, 'you gain');
          });
        return parts.length ? `${each} For each one: ${parts.join(' and ')}.` : each;
      }
      // "Your companions each deal 6 damage." (what they read of themselves is theirs: "equal to its HP")
      const lines = o.ops.map((x, i) => {
        if (x.op === 'sacrifice' && x.self) return 'Then they die.';
        // ("deal 6 damage plus their own HP": a blow that reads each companion itself)
        if (
          x.op === 'damage' &&
          x.scale &&
          (x.scale.by === 'hp' || x.scale.by === 'maxHp') &&
          [0.5, 1, 1.5, 2].includes(x.scale.mult ?? 1) &&
          !x.scale.of &&
          !x.scale.into
        ) {
          const plain = { ...x };
          delete plain.scale;
          // (Off the Leash, half; The Drowned King+, 1.5 times: #691)
          const m = x.scale.mult ?? 1;
          const share = m === 0.5 ? 'half ' : m === 1.5 ? '1.5 times ' : m === 2 ? 'twice ' : '';
          const t = opText(db, plain, who).replace(
            / damage(.*)\.$/,
            ` damage$1, plus ${share}their own ${x.scale.by === 'hp' ? 'HP' : 'max HP'}.`,
          );
          return i === 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t;
        }
        const t = opText(db, x, who).replace(/\byour (HP|max HP)\b/g, 'its $1');
        return i === 0 ? t.charAt(0).toLowerCase() + t.slice(1) : t;
      });
      // (one companion: "Your healthiest companion deals 10 damage, plus its own max HP.")
      if (o.healthiest)
        return `Your healthiest companion ${lines
          .join(' ')
          .replace(/^(\w+?)(?=\s)/, (w) => (w.endsWith('s') ? `${w}es` : `${w}s`))
          .replace(/\btheir own\b/g, 'its own')}`;
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
      return `${o.pick ? 'Choose a card in your hand: it gains' : 'A random card in your hand gains'} ${what}${o.costUp ? ` and costs ${o.costUp} more for this fight` : ''}.`;
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
    // (the totem cycle, DECISIONS #430: a plant goes to the back; a command makes a totem act and consumes it)
    case 'plant': {
      const count = !o.scale && (o.times ?? 1) > 1 ? (o.times as number) : 1;
      if (o.spirit === '*')
        return count > 1 ? `Plant ${count} random totems.` : 'Plant a random totem.';
      const nm = db.totems?.[o.spirit]?.name ?? o.spirit;
      if (count > 1) return `Plant ${count} ${plural(nm)}.`;
      if (o.scale?.by === 'x')
        return `Plant ${article(nm)} ${nm} X${o.times ? ` + ${o.times}` : ''} times.`;
      if (o.scale?.by === 'foes') return `Plant ${article(nm)} ${nm} for each enemy.`;
      if (o.scale?.by === 'channeledOf') {
        const k = db.totems?.[o.scale.rune ?? '']?.name ?? 'totem';
        // (a base to start from: `times` planted, then one more for each)
        return o.times
          ? `Plant ${o.times === 1 ? `${article(nm)} ${nm}` : `${o.times} ${plural(nm)}`}, plus one for each ${k} you have planted this fight.`
          : `Plant ${article(nm)} ${nm} for each ${k} you have planted this fight.`;
      }
      return `Plant ${article(nm)} ${nm}.`;
    }
    case 'uproot':
      return 'Uproot all your totems.';
    case 'snareSlot':
      return o.amount === 1
        ? 'You can have 1 more Trap set.'
        : `You can have ${o.amount} more Traps set.`;
    case 'totemSlot':
      return (o.amount ?? 1) > 1
        ? `Gain ${o.amount} totem positions.`
        : (o.amount ?? 1) < 0
          ? 'Lose a totem position (your front totem is pushed out if the row is full).'
          : 'Gain a totem position.';
    case 'totemBoost': {
      const nm = TOTEM_WORDS[o.rune] ?? cap(o.rune);
      return `For the rest of the fight, a ${nm} you command deals ${o.amount} more damage (its end-of-turn effect is not changed).`;
    }
    case 'totemPulse':
      return `Your front totem's end-of-turn effect happens now${(o.times ?? 1) > 1 ? ` ${o.times} times` : ''}.`;
    case 'sweep':
      return o.tag === 'status'
        ? 'Put every Status card in your draw pile into your discard pile.'
        : 'Put every card in your draw pile into your discard pile.';
    case 'totemRotate':
      return 'Your front totem moves to the back.';
    case 'totemCommand': {
      const n = o.times ?? 1;
      const twice =
        o.scale?.by === 'x'
          ? ` X${o.times ? ` + ${o.times}` : ''} times`
          : n === 1
            ? ''
            : n === 2
              ? ' twice'
              : ` ${n} times`;
      if (o.spirit === 'all') return `Command every totem, front to back${twice}.`;
      if (o.spirit === 'random') return `Command a random totem${twice}.`;
      if (o.spirit === 'newest') return `Command your newest totem${twice}.`;
      if (o.spirit === 'front' || o.spirit === 'choose') return `Command your front totem${twice}.`;
      const nm = db.totems?.[o.spirit]?.name ?? o.spirit;
      return `Command your first ${nm}${twice}.`;
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
      ? joinClause(u.brain.act.filter((x) => x.op !== 'summon').map((x) => opText(db, x, who)))
      : '';
  // (a Heavy or Colossal says how many companion slots it takes, DECISIONS #383)
  const slots = u.slots ?? 1;
  const frame = slots >= 3 ? 'Colossal: 3 slots, ' : slots === 2 ? 'Heavy: 2 slots, ' : '';
  const said = lowerStart(acts)
    .replace(/\.$/, '')
    .replace(/^next turn, gain (.+)$/, 'give you $1 next turn')
    .replace(/\bgain (\d+) Barrier to your hero\b/, 'give your hero $1 Barrier')
    .replace(/\bheal (\d+) to your hero\b/, 'heal your hero $1');
  const does = acts ? `; at the end of your turn ${n > 1 ? 'each' : 'it'} will ${said}` : '';
  return n > 1
    ? `Summon ${n} ${u.name}s (${frame}${u.maxHp} HP each${u.taunt ? ', Taunt' : ''}${does}).`
    : `Summon ${u.name} (${frame}${u.maxHp} HP${u.taunt ? ', Taunt' : ''}${does}).`;
}

/**
 * The text of one damage effect (or scaled Barrier, with no `o`) with what it would do right now marked in it ([[live:up:9]], [[live:down:3-5]]...): the printed number
 * is replaced, or, when the printed amount is a formula (per Barrier...), the live number follows the sentence in brackets.
 */
function liveDamageText(
  text: string,
  o: Extract<Op, { op: 'damage' }> | null,
  l: LiveDamage,
): string {
  const num = l.lo === l.hi ? String(l.lo) : `${l.lo}-${l.hi}`;
  // (Fracture: what the Shatters it sets off would deal, "Apply 4 Fracture (Shatter 20)." or "(Shatter 0-30 each)" when it depends on the enemy)
  if (l.shatter) {
    const mark =
      (l.hits ?? 1) > 1
        ? ` (${l.variableHits ? 'up to ' : ''}${l.hits} Shatters, [[live:calc:${num}]] total${l.each ? ' each' : ''})`
        : ` (Shatter [[live:calc:${num}]]${l.each ? ' each' : ''})`;
    const dot = text.lastIndexOf('.');
    return dot < 0 ? `${text}${mark}` : `${text.slice(0, dot)}${mark}${text.slice(dot)}`;
  }
  if (l.conditional) {
    const total = l.total ?? { lo: l.lo, hi: l.hi };
    const sum = total.lo === total.hi ? String(total.lo) : `${total.lo}-${total.hi}`;
    return `${text} (${l.hits === 0 ? 'no damage now' : `[[live:calc:${sum}]] total damage now`})`;
  }
  if (l.hits === 0) return `${text} ([[live:calc:0]] total now)`;
  // (a card that plays others: how many, and what they come to, DECISIONS #489)
  if (l.played !== undefined) {
    const dot = text.lastIndexOf('.');
    const mark = ` (${l.played} played, [[live:calc:${num}]] total${l.each ? ' each' : ''})`;
    return dot < 0 ? `${text}${mark}` : `${text.slice(0, dot)}${mark}${text.slice(dot)}`;
  }
  // (more than one hit: the rule stays, and what it comes to now follows it, "Deal 5 damage, 1 more time per 2 Spell Power (7 hits, 35 total)", DECISIONS #487)
  if (l.hits !== undefined) {
    const per = `[[live:${l.lo === l.printed && l.lo === l.hi ? 'same' : l.lo >= l.printed ? 'up' : l.hi <= l.printed ? 'down' : 'calc'}:${num}]]`;
    // (an amount that is a formula keeps it too, and says what one hit comes to: "Deal 5 (+2 per Spell Power) damage (21 a hit, 2 hits...)")
    const said = l.calc ? text : text.replace(/^Deal \d+/, `Deal ${per}`);
    const end = said.search(/\.( |$)/);
    const sum = l.total ?? { lo: l.lo * l.hits, hi: l.hi * l.hits };
    const all = sum.lo === sum.hi ? String(sum.lo) : `${sum.lo}-${sum.hi}`;
    const hits = `${l.variableHits ? 'up to ' : ''}${l.hits} ${l.hits === 1 ? 'hit' : 'hits'}${l.echoed ? ' with Blade Echo' : ''}`;
    const mark = ` (${l.calc ? `[[live:calc:${num}]] a hit, ` : ''}${hits}, [[live:calc:${all}]] total${l.each ? ' each' : ''})`;
    return end < 0 ? `${said}${mark}` : `${said.slice(0, end)}${mark}${said.slice(end)}`;
  }
  if (l.calc || !o) {
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
 * A card's rules text. With `live` (what previewCardDamage says it would do now, by effect index), each damage number and scaled Barrier
 * is marked with what it would really come to, for the card in your hand.
 */
export function cardText(db: CombatDb, c: CardDef, live?: ReadonlyMap<number, LiveDamage>): string {
  if (c.text) {
    const all = [...(live?.values() ?? [])].filter((l) => !l.barrier && !l.uncertain);
    const known = all.filter((l) => !l.shatter);
    const shatters = all.filter((l) => l.shatter);
    const sumText = (l: LiveDamage): string => {
      const sum = l.total ?? { lo: l.lo, hi: l.hi };
      return `[[live:calc:${sum.lo === sum.hi ? sum.lo : `${sum.lo}-${sum.hi}`}]]`;
    };
    return (
      c.text +
      (known.length
        ? ' Damage now: ' +
          known.map((l) => `${sumText(l)} total${l.each ? ' per enemy' : ''}`).join('; ') +
          '.'
        : '') +
      (shatters.length
        ? ' Shatter now: ' +
          shatters.map((l) => `${sumText(l)}${l.each ? ' per enemy' : ''}`).join('; ') +
          '.'
        : '') +
      (live?.get(-1)?.uncertain
        ? ' Further damage can depend on random effects, drawn cards or unresolved choices.'
        : '')
    );
  }
  const parts: string[] = [];
  // (what depends on a condition or a trigger goes last, each on its own, so no sentence after it can be taken for part of it: DECISIONS #485)
  const late: string[] = [];
  if (c.unplayable) parts.push('Unplayable.');
  if (c.needsExhausted)
    parts.push(`Only playable with ${c.needsExhausted} or more cards consumed.`);
  if (c.cheaperPerAttack)
    parts.push(`Costs ${c.cheaperPerAttack} less for each Attack played this turn.`);
  // (assassin) Premeditate (was Sly, DECISIONS #433), Pinpoint's discount, Grand Finale's condition
  if (c.sly) parts.push('Premeditate.');
  // (the Drunkard's Stagger: its damage lands on a random enemy, DECISIONS #393)
  if (c.tags?.includes('stagger')) parts.push('Stagger.');
  // (the Shaman's elements, DECISIONS #420)
  if (c.tags?.includes('flame')) parts.push('Flame.');
  if (c.tags?.includes('frost')) parts.push('Frost.');
  if (c.tags?.includes('storm')) parts.push('Storm.');
  // (the Trickster's Wild cards, DECISIONS #535)
  if (c.suit === 'wild')
    parts.push('Wild (it shows the first suit you are missing this turn, in the order ♠ ♥ ♦ ♣).');
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
    parts.push(
      `Costs ${c.cheaperPer.mult} less for each ${METRIC_WORDS[c.cheaperPer.by].per}${c.cheaperPer.min !== undefined ? ` (this never takes it below ${c.cheaperPer.min})` : ''}.`,
    );
  if (c.freeIf)
    parts.push(
      c.freeIf.by === 'allyStrikes' && c.freeIf.atLeast === 1
        ? 'Costs 0 if your companions have struck this turn.'
        : `Costs 0 while ${METRIC_WORDS[c.freeIf.by].equal} is ${c.freeIf.atLeast} or more.`,
    );
  if (c.recallOnCost)
    parts.push(
      `Whenever you play a card that costs ${c.recallOnCost} or more, this returns from your discard pile to your hand (once a turn).`,
    );
  if (c.replayFromExhaust)
    parts.push(
      'At the start of your turn, if this is consumed, it is played for free and goes back.',
    );
  // (the Spellblade's kinds, DECISIONS #480)
  if (c.tags?.includes('sword')) parts.push('Sword.');
  if (c.tags?.includes('spell')) parts.push('Spell.');
  // (a Spell Power cost is shown on the card itself, under the Mana cost, as a number, X or X/2: it is not said again in the text)
  if (c.xBonus) parts.push(`X is ${c.xBonus} higher.`);
  const who: Record<Sel, string> =
    c.target === 'ally' || c.target === 'friend' ? { ...WHO, target: ' to the ally' } : WHO;
  // an Aura with nothing ongoing, giving one lasting status: that line says it lasts (DECISIONS #300)
  const oneShotAura =
    c.kind === 'power' &&
    !c.effects.some(
      (o) =>
        o.op === 'power' || o.op === 'channel' || o.op === 'runeSlots' || o.op === 'attackAura',
    ) &&
    c.effects.filter((o) => isLasting(o)).length === 1;
  const opsFrom = parts.length;
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
      // (a Trap's effects all hang on its trigger, so they stay together below)
      const isTrap = c.kind === 'snare';
      if (!isTrap && (o.op === 'when' || o.op === 'power')) {
        const known = live?.get(i);
        late.push(known ? liveDamageText(opText(db, o, who), null, known) : opText(db, o, who));
        continue;
      }
      // ("If this is fatal" is a condition too: the hit stays in its place, and the clause goes with the others)
      const kills = !isTrap && o.op === 'damage' ? o.onKill : undefined;
      const plain = kills
        ? (({ onKill: _gone, ...rest }) => rest)(o as Extract<Op, { op: 'damage' }>)
        : o;
      if (kills) late.push(`If this is fatal: ${joinClause(kills.map((x) => opText(db, x, who)))}`);
      const l = live?.get(i);
      const line = l
        ? liveDamageText(opText(db, plain, who), plain.op === 'damage' ? plain : null, l)
        : opText(db, plain, who);
      const shown =
        oneShotAura && isLasting(o) && !line.includes('for the rest of the fight')
          ? line.replace(/.$/, ' for the rest of the fight.')
          : line;
      parts.push(
        c.kind === 'power' && c.effects.some((x) => x.op === 'attackAura') && o.op !== 'attackAura'
          ? `On play: ${shown}`
          : shown,
      );
    }
  }
  // an Aura that does its work once, when played, says how long what it gives lasts (DECISIONS #300)
  const ongoing = c.effects.some(
    (o) => o.op === 'power' || o.op === 'channel' || o.op === 'runeSlots' || o.op === 'attackAura',
  );
  const lasting = c.effects.filter((o) => isLasting(o)).length;
  if (c.kind === 'power' && !ongoing && lasting > 1)
    parts.push('These last the rest of the fight.');
  // (#693: a hero's Cadence stops after its 8th turn)
  if (c.effects.some((o) => o.op === 'status' && o.status === 'ritual' && o.to === 'self'))
    parts.push('Cadence gives Might in your first 8 turns only.');
  if (
    c.kind === 'power' &&
    !ongoing &&
    c.effects.some(
      (o) =>
        o.op === 'status' ||
        o.op === 'loseHp' ||
        o.op === 'draw' ||
        o.op === 'stars' ||
        o.op === 'addCard',
    ) &&
    parts[opsFrom]
  )
    parts[opsFrom] = `On play: ${parts[opsFrom]}`;
  if (c.kind === 'snare' && c.trigger) {
    const opening =
      c.trigger.on === 'attacked'
        ? 'When you or an ally is attacked:'
        : c.trigger.on === 'hpLost'
          ? `When you lose ${c.trigger.min}+ HP at once:`
          : c.trigger.on === 'foeSummons'
            ? 'When the enemy summons:'
            : c.trigger.on === 'foeDefends'
              ? 'When an enemy gains Barrier:'
              : 'At the start of the enemy turn:';
    late.push(`${opening} ${joinClause(parts.splice(opsFrom))}`);
  }
  if (c.exhaust) parts.push('Consume.');
  if (c.retain) parts.push('Hold.');
  if (c.innate) parts.push('Opening hand.');
  if (c.ethereal) parts.push('Fleeting.');
  if (c.onDiscard) late.push(`If discarded: ${joinClause(c.onDiscard.map((o) => opText(db, o)))}`);
  if (c.onExhaust) late.push(`If consumed: ${joinClause(c.onExhaust.map((o) => opText(db, o)))}`);
  if (c.onDraw) late.push(`When you draw this: ${joinClause(c.onDraw.map((o) => opText(db, o)))}`);
  if (c.after === 'hand') parts.push('It goes back to your hand after you play it.');
  if (c.after === 'drawTop') parts.push('It goes on top of your draw pile after you play it.');
  if (c.returnEvery)
    parts.push(
      `Every ${c.returnEvery.n} ${KIND_WORD2[c.returnEvery.kind] ?? c.returnEvery.kind}s you play in a turn, it comes back to your hand.`,
    );
  if (c.playFromTop)
    parts.push('At the end of your turn, if this is on top of your draw pile, it is played.');
  if (c.inHandAtEnd)
    late.push(
      `At the end of your turn, if this is in your hand: ${joinClause(c.inHandAtEnd.map((o) => opText(db, o)))}`,
    );
  if (c.cheaperOnCreate)
    parts.push(
      `Whenever you create ${article(TAG_NAMES[c.cheaperOnCreate] ?? c.cheaperOnCreate)} ${TAG_NAMES[c.cheaperOnCreate] ?? c.cheaperOnCreate}, this costs 1 less until played.`,
    );
  if (live?.get(-1)?.uncertain)
    late.push('Further damage can depend on random effects, drawn cards or unresolved choices.');
  const text = [...parts, ...late].join(' ');
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
      case 'premeditate':
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
