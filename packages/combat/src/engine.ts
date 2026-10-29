// Combat v2 engine: pure, deterministic, synchronous. State in, state + events out (docs/08_COMBAT_V2.md).
// Randomness only through the seeded PRNG held in the state. The caller never mutates the state it passes in.

import { nextInt, seedRng, shuffle } from './rng';
import { SUITS, suitOf } from './suits';
import {
  DEBUFFS,
  EDGE_TAG,
  BLADE_TAG,
  ORBIT_STEP,
  DEFAULT_RUNE_SLOTS,
  MANTRA_GOAL,
  MAX_ALLIES,
  OVERFLOW_PCT,
  MAX_MAX_MANA,
  MAX_ENEMIES,
  MAX_START_ENEMIES,
  MAX_HAND,
  MAX_RUNES,
  SUDDEN_DEATH_AFTER,
  SUDDEN_DEATH_STEP,
  TRAIT_POWER,
  MAX_SNARES,
  KNIFE_MAX,
  PREP_MAX,
  ENCHANTS,
  ENCHANT_SLOTS,
  EMBER_DAMAGE,
  GLASS_DAMAGE,
  WARD_BARRIER,
  TOTEM_SLOTS,
  ELEMENTS,
  PRISM_TAG,
  FORMS,
  MASTERY_MAX,
  DEFENSIVE_TAG,
  STRIKING_TAG,
  RADIANT_ENTER_MANA,
  RulesError,
  STANCES,
  other,
  scaledEnemyHp,
  tierMight,
  clone,
  type Action,
  type Enchant,
  type Element,
  type Form,
  type CardDef,
  type CardId,
  type CardInst,
  type CombatDb,
  type HeroTrait,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
  type FoeRule,
  type HeroSetup,
  type Metric,
  type Op,
  type Pattern,
  type RuneState,
  type Scale,
  type Sel,
  type Side,
  type SideState,
  type SimplePattern,
  type Stance,
  type Rise,
  type StatusId,
  type TriggerWhen,
  type Unit,
  type UnitDef,
  type UnitId,
} from './types';

interface Run {
  db: CombatDb;
  s: CombatState;
  ev: CombatEvent[];
  /** how deep triggers are nested (a guard against a Power that feeds itself) */
  depth: number;
  /** a side's turn is just beginning (its opponent's turn-start Traps are springing): a Stun put on now is not fresh */
  opening?: boolean;
  /** the draw that starts a turn is happening (a "draw during your turn" trigger ignores it) */
  openingDraw?: boolean;
  /** a card said "end your turn": it ends once the card (and any choice it asked for) is done */
  endAfter?: boolean;
  /** Salvage (DECISIONS #383): what the companions scrapped to make room for this card left behind, for the first companion it summons */
  salvage?: { inst: string; might: number; vigor: number; hp: number };
}

/** Who is acting and what they are acting on. */
interface Act {
  actor: Unit;
  target: Unit | null;
  attacker: Unit | null;
  /** set while a hit is being resolved, so a Trap can cancel it */
  hit: { prevented: boolean } | null;
  /** the card being played (null for anything else) and its instance */
  card: CardDef | null;
  inst: CardInst | null;
  /** Mana spent on an X card */
  x: number;
  /** the charge of the rune being fired */
  charge: number;
  /** in a 'heal' trigger: the HP the heal tried to restore */
  healed: number;
  /** a rune (totem) is firing: Resonance (Spirit) adds to its damage and Barrier */
  rune: boolean;
  /** this frame may ask the player to choose (only a card's own effects can) */
  pick: boolean;
  /** in a 'play' trigger: the card that was just played; in a 'draw' trigger: the card just drawn */
  played: CardInst | null;
  drawn: CardInst | null;
  /** what the card being played has consumed so far */
  exhaustedNow: number;
  exhaustedDmg: number;
  /** what the card being played has discarded, and the Skills it has drawn, so far */
  discardedNow: number;
  skillsDrawnNow: number;
  /** in an 'arcana' trigger: the Arcana just spent */
  spent: number;
  /** the HP the card's last damage effect took off (Blight Strike) */
  dealt: number;
  /** in an 'allyHurt' trigger: the HP the companion lost */
  lost: number;
  /** (the Assassin) the units this card's attack hits were aimed at, and whether one of them landed on each (a knife embeds only then) */
  struck: Map<UnitId, boolean>;
  /** knives this card has pulled so far, and the stacks of a status it has spent (Preparation) */
  extracted: number;
  spentBy: Partial<Record<StatusId, number>>;
  /** (the Spellblade) what the card has discharged and not yet used: Ember damage for its next hit, Glass to break after its attack */
  ember: number;
  glass: number;
  discharged: number;
  /** (the Shaman) a command's Rousing and Spirit: added to every damage and Barrier number of its spirit's ops */
  plus: number;
  /** totems the card has uprooted, and replaced with a different kind, so far */
  uprooted: number;
  replaced: number;
}

const mkAct = (actor: Unit, extra: Partial<Act> = {}): Act => ({
  actor,
  target: null,
  attacker: null,
  hit: null,
  card: null,
  inst: null,
  x: 0,
  charge: 0,
  healed: 0,
  rune: false,
  pick: false,
  played: null,
  drawn: null,
  exhaustedNow: 0,
  exhaustedDmg: 0,
  discardedNow: 0,
  skillsDrawnNow: 0,
  spent: 0,
  dealt: 0,
  lost: 0,
  struck: new Map(),
  extracted: 0,
  spentBy: {},
  ember: 0,
  glass: 0,
  discharged: 0,
  plus: 0,
  uprooted: 0,
  replaced: 0,
  ...extra,
});

export interface StepResult {
  state: CombatState;
  events: CombatEvent[];
}

const MAX_DEPTH = 6;

// --- small helpers ------------------------------------------------------------------------------------------

function newId(s: CombatState, prefix: string): string {
  return `${prefix}${s.nextId++}`;
}

function findUnit(s: CombatState, id: UnitId | null | undefined): Unit | undefined {
  if (!id) return undefined;
  return s.sides.a.units.find((u) => u.id === id) ?? s.sides.b.units.find((u) => u.id === id);
}

export function heroOf(sd: SideState): Unit | undefined {
  return sd.units.find((u) => u.kind === 'hero');
}

function def(r: Run, id: string): UnitDef {
  const d = r.db.units[id];
  if (!d) throw new RulesError(`Unknown unit "${id}"`);
  return d;
}

function cardDef(db: CombatDb, id: CardId): CardDef {
  const d = db.cards[id];
  if (!d) throw new RulesError(`Unknown card "${id}"`);
  return d;
}

const stacks = (u: Unit, st: StatusId): number => u.statuses[st] ?? 0;

// --- statuses ---------------------------------------------------------------------------------------------------

/** Returns whether the stacks were applied (a Steadfast unit ignores a debuff). */
function addStatus(r: Run, u: Unit, st: StatusId, amount: number): boolean {
  if (amount === 0) return false;
  // Steadfast: the next debuff put on this unit is ignored
  if (amount > 0 && DEBUFFS.includes(st) && stacks(u, 'steadfast') > 0) {
    const left = stacks(u, 'steadfast') - 1;
    if (left <= 0) delete u.statuses.steadfast;
    else u.statuses.steadfast = left;
    r.ev.push({ type: 'status', target: u.id, status: 'steadfast', amount: -1, total: left });
    return false;
  }
  const was = stacks(u, st);
  let total = was + amount;
  // a new Stun keeps whichever countdown is longer, so Stuns never pile up into a lock (DECISIONS #310); one that lands during the
  // unit's own turn does not wear off at the end of it, so it still covers the unit's next turn
  if (st === 'stunned' && amount > 0) {
    total = Math.max(was, amount);
    if (r.s.active === u.side && amount > was && !r.opening) u.stunFresh = true;
  }
  // Fortified is on or off: a second source adds nothing (DECISIONS #347); so is an Opening, one per enemy (#415)
  if (st === 'fortified' || st === 'opening') total = Math.min(total, 1);
  // (the Assassin, DECISIONS #416) a unit holds at most KNIFE_MAX knives and a hero PREP_MAX Preparation: more is simply lost
  if (st === 'knives') total = Math.min(total, KNIFE_MAX);
  if (st === 'prep') total = Math.min(total, PREP_MAX);
  // (the Monk, #419) Mastery stops at MASTERY_MAX (the Shaman's Spirit has no cap, #420)
  if (st === 'mastery') total = Math.min(total, MASTERY_MAX);
  // Hangover stops at HANGOVER_MAX, so the cards that grow with it stay in reach (DECISIONS #354)
  if (st === 'hangover') total = Math.min(total, HANGOVER_MAX);
  if (total <= 0) delete u.statuses[st];
  else u.statuses[st] = total;
  r.ev.push({ type: 'status', target: u.id, status: st, amount, total: Math.max(0, total) });
  // a hero whose trait shares Might: their companions gain (or lose) their share of it, rounded down (DECISIONS #285, #298)
  // (the change in the share, so a hero going 1 -> 2 at half passes on 1; a loss never takes more than a companion has)
  const share = u.kind === 'hero' && st === 'might' ? (traitOf(r, u.side)?.shareMight ?? 0) : 0;
  const delta = Math.floor(Math.max(0, total) * share) - Math.floor(was * share);
  if (delta !== 0)
    for (const x of r.s.sides[u.side].units)
      if (x.kind === 'ally' && x.hp > 0 && (delta > 0 || stacks(x, 'might') > 0))
        addStatus(r, x, 'might', Math.max(delta, -stacks(x, 'might')));
  // Mantra builds towards Radiant and is spent on entering it
  if (st === 'mantra' && total >= MANTRA_GOAL) {
    // one Radiant per goal reached; anything left over stays as Mantra
    total -= MANTRA_GOAL;
    if (total <= 0) delete u.statuses.mantra;
    else u.statuses.mantra = total;
    r.ev.push({ type: 'status', target: u.id, status: 'mantra', amount: -MANTRA_GOAL, total });
    enterStance(r, u, 'radiant');
  }
  // an Aura that answers Exposed being put on an enemy (Vicious)
  if (st === 'exposed' && amount > 0 && u.kind !== 'hero')
    fireTriggers(r, r.s.sides[other(u.side)], 'exposeFoe');
  // (the Necrobinder copy) Auras that answer Fate, or any debuff, being put on an enemy (Shroud, Sleight of Flesh)
  // (an enemy unit, or in PvP the other player's hero while you act)
  const foeUnit = u.kind === 'enemy' || (u.kind === 'hero' && u.side !== r.s.active);
  if (amount > 0 && foeUnit && DEBUFFS.includes(st)) {
    const foe = r.s.sides[other(u.side)];
    if (st === 'doom') {
      foe.doomedTurn = (foe.doomedTurn ?? 0) + 1;
      fireTriggers(r, foe, 'doomFoe', { target: u });
    }
    fireTriggers(r, foe, 'debuffFoe', { target: u });
  }
  return true;
}

/** Stances are exclusive statuses: leaving one and entering another both have effects. */
function enterStance(r: Run, u: Unit, to: Stance | 'none'): void {
  const cur = STANCES.find((x) => stacks(u, x) > 0);
  if (cur === to || (!cur && to === 'none')) return;
  const sd = r.s.sides[u.side];
  if (cur) {
    delete u.statuses[cur];
    r.ev.push({ type: 'status', target: u.id, status: cur, amount: -1, total: 0 });
    // (leaving Serene pays its Mana through the Monk's trait, a 'stanceLeft' trigger: DECISIONS #413)
  }
  if (to !== 'none') {
    u.statuses[to] = 1;
    r.ev.push({ type: 'status', target: u.id, status: to, amount: 1, total: 1 });
    if (to === 'radiant') gainMana(r, sd, RADIANT_ENTER_MANA);
  }
  r.ev.push({ type: 'stance', unit: u.id, stance: to });
  if (cur && u.kind === 'hero') fireTriggers(r, sd, 'stanceLeft', { stance: cur });
  if (to !== 'none' && u.kind === 'hero') fireTriggers(r, sd, 'stance', { stance: to });
}

function gainMana(r: Run, sd: SideState, n: number): void {
  if (sd.manaLocked && n > 0) return;
  sd.mana = Math.max(0, sd.mana + n);
  r.ev.push({ type: 'mana', side: sd.id, mana: sd.mana });
}

// --- damage ---------------------------------------------------------------------------------------------------

/** Unblockable damage and Seared dealt by an enemy to the other side follow the difficulty percent too (never below 1). */
function scaledByDifficulty(actor: Unit, target: Unit, amount: number): number {
  if (actor.side === target.side || actor.dmgPct === 100 || amount <= 0) return amount;
  return Math.max(1, Math.floor((amount * actor.dmgPct) / 100));
}

/**
 * attack damage after the attacker's Might / Faltering / stance and the target's Wrath / Exposed
 * (Radiant triples, Wrath doubles what you deal; Wrath makes you take 50% more).
 * `attack` false: damage that is no attack (an Aura, a totem, a Trap, a potion, a Skill) is the number printed, as every one of those
 * statuses says "attacks" (DECISIONS #376); only the difficulty's damage percent still applies.
 */
export function modifiedDamage(
  base: number,
  attacker: Unit | null,
  target: Unit | null,
  attack = true,
): number {
  if (!attack) {
    const flat = Math.max(0, base);
    return attacker && attacker.dmgPct !== 100 && flat > 0
      ? Math.max(1, Math.floor((flat * attacker.dmgPct) / 100))
      : flat;
  }
  let n = Math.max(
    0,
    base + (attacker ? stacks(attacker, 'might') - stacks(attacker, 'sapped') : 0),
  );
  if (attacker && stacks(attacker, 'clutch') > 0)
    n = Math.floor((n * (100 + stacks(attacker, 'clutch'))) / 100);
  // (Stunned counts as Faltering, Exposed and Brittle at once, never on top of them: DECISIONS #310)
  // (Debilitated: Faltering and Exposed on it count double)
  if (attacker && (stacks(attacker, 'faltering') > 0 || stacks(attacker, 'stunned') > 0))
    n = Math.floor(n * (stacks(attacker, 'debilitated') > 0 ? 0.5 : 0.75));
  if (attacker && stacks(attacker, 'radiant') > 0) n *= 3;
  else if (attacker && stacks(attacker, 'wrath') > 0) n *= 2;
  if (target && stacks(target, 'wrath') > 0) n = Math.floor(n * 1.5);
  if (target && (stacks(target, 'exposed') > 0 || stacks(target, 'stunned') > 0)) {
    n = Math.floor(n * (stacks(target, 'debilitated') > 0 ? 2 : 1.5));
    // Cruelty: an Exposed enemy takes a quarter more from you
    if (attacker && stacks(attacker, 'cruelty') > 0) n = Math.floor(n * 1.25);
  }
  // (assassin) Shadow Step's Empowered doubles; Tracking: a Faltering enemy takes half as much again
  if (attacker && stacks(attacker, 'empowered') > 0) n *= 2;
  if (
    target &&
    attacker &&
    stacks(attacker, 'tracking') > 0 &&
    (stacks(target, 'faltering') > 0 || stacks(target, 'stunned') > 0)
  )
    n = Math.floor(n * 1.5);
  // Colossus: an Exposed enemy's blows land at half strength for the turn
  if (
    target &&
    attacker &&
    stacks(target, 'sturdy') > 0 &&
    (stacks(attacker, 'exposed') > 0 || stacks(attacker, 'stunned') > 0)
  )
    n = Math.floor(n * 0.5);
  if (attacker && attacker.dmgPct !== 100 && n > 0)
    n = Math.max(1, Math.floor((n * attacker.dmgPct) / 100));
  return Math.max(0, n);
}

/** The innate trait of the hero on `side` (none for a side of enemies). */
function traitOf(r: Run, side: Side): HeroTrait | undefined {
  const sd = r.s.sides[side];
  return sd.hero ? r.db.heroes[sd.hero]?.trait : undefined;
}

/** An innate trait that depends on HP (Clutch Genes): keep the hero's `clutch` status at their missing HP times the rate. */
function syncClutch(r: Run, sd: SideState): void {
  const c = sd.hero ? r.db.heroes[sd.hero]?.trait?.clutch : undefined;
  const hero = heroOf(sd);
  if (!c || !hero || hero.hp <= 0) return;
  const want = Math.floor(Math.max(0, hero.maxHp - hero.hp) * c.perMissingHp);
  const cur = stacks(hero, 'clutch');
  if (want !== cur) addStatus(r, hero, 'clutch', want - cur);
}

function applyDamage(
  r: Run,
  source: Unit | null,
  t: Unit,
  amount: number,
  kind: 'attack' | 'direct',
  overflow = false,
): number {
  if (t.hp <= 0) return 0;
  if (kind === 'attack' && stacks(t, 'ghostly') > 0 && amount > 1) amount = 1;
  if (kind === 'attack' && amount > 0 && stacks(t, 'shielded') > 0) {
    addStatus(r, t, 'shielded', -1);
    r.ev.push({
      type: 'damage',
      source: source?.id ?? null,
      target: t.id,
      amount: 0,
      blocked: 0,
      lost: 0,
      shielded: true,
      kind,
      hp: t.hp,
      ...(overflow ? { overflow: true as const } : {}),
    });
    return 0;
  }
  const blocked = kind === 'attack' ? Math.min(t.barrier, amount) : 0;
  t.barrier -= blocked;
  let lost = Math.min(t.hp, amount - blocked);
  // a unit with a phase to come stops at its threshold (the blow that crosses it goes no further) and rises
  const rise = t.rise?.[0];
  let rises = false;
  if (rise && lost > 0) {
    const floor = Math.max(1, Math.ceil((t.maxHp * rise.atPct) / 100));
    if (t.hp - lost <= floor) {
      rises = true;
      // (one already at or below it, say after a blow that landed exactly on it, rises without losing more)
      lost = Math.max(0, t.hp - floor);
    }
  }
  t.hp -= lost;
  r.ev.push({
    type: 'damage',
    source: source?.id ?? null,
    target: t.id,
    amount,
    blocked,
    lost,
    shielded: false,
    kind,
    hp: t.hp,
    ...(overflow ? { overflow: true as const } : {}),
  });
  if (lost > 0 && t.kind === 'hero') {
    const hsd = r.s.sides[t.side];
    hsd.lostHpTurn = (hsd.lostHpTurn ?? 0) + 1;
    hsd.lostHpFight = (hsd.lostHpFight ?? 0) + 1;
    syncClutch(r, r.s.sides[t.side]);
    fireSnare(r, t.side, { on: 'hpLost', lost, attacker: source, hit: null });
  }
  if (rises && rise) riseUp(r, t, rise);
  // (the Necrobinder copy) an Aura that answers a companion losing HP (Necro Mastery)
  if (lost > 0 && t.kind === 'ally') fireTriggers(r, r.s.sides[t.side], 'allyHurt', { lost });
  return lost;
}

/** A unit rises into its next phase: Barrier and Might, and the phase is used up. */
function riseUp(r: Run, t: Unit, rise: Rise): void {
  t.rise = (t.rise ?? []).slice(1);
  if (t.rise.length === 0) delete t.rise;
  r.ev.push({ type: 'phase', unit: t.id, left: t.rise?.length ?? 0 });
  const b = Math.ceil((t.maxHp * rise.barrierPct) / 100);
  if (b > 0) {
    t.barrier += b;
    r.ev.push({ type: 'barrier', target: t.id, amount: b, total: t.barrier });
  }
  if (rise.might > 0) addStatus(r, t, 'might', rise.might);
}

/**
 * Whether damage from this frame is an attack: an Attack card, or a unit's own strike (an enemy's move, a companion's, whatever card
 * made it act). An Aura, a totem, a Trap, a potion or a Skill that deals damage is no attack: Might, Faltering, Exposed and the rest
 * leave it alone, Thorns and Reflect do not answer it, and "when attacked" Traps do not spring (DECISIONS #376).
 */
function isAttackAct(a: Act): boolean {
  return a.actor.kind !== 'hero' || a.card?.kind === 'attack';
}

/** One attack hit from `a.actor` on `t`: Traps may spring first and may cancel it. */
/** One hit of an attack. Returns the HP it took off (for Lifesteal). */
function attackHit(r: Run, a: Act, t: Unit, base: number, single = false): number {
  if (t.hp <= 0) return 0;
  const attacked = isAttackAct(a);
  // (the Assassin's knives: the card aimed a hit at this unit; whether one landed is set below)
  if (!a.struck.has(t.id)) a.struck.set(t.id, false);
  if (attacked && t.side !== a.actor.side) {
    const hit = { prevented: false };
    fireSnare(r, t.side, { on: 'attacked', victim: t, attacker: a.actor, hit });
    if (r.s.winner || t.hp <= 0 || a.actor.hp <= 0) return 0;
    if (hit.prevented) {
      r.ev.push({ type: 'prevented', unit: a.actor.id });
      return 0;
    }
  }
  let amount = modifiedDamage(base, a.actor, t, attacked);
  // (a hit Shielded cancels does not land; one Barrier soaks does)
  if (!(attacked && amount > 0 && stacks(t, 'shielded') > 0)) a.struck.set(t.id, true);
  // Bladebane: the blade strikes it twice as hard
  if (a.card?.tags?.includes(BLADE_TAG) && stacks(t, 'bladebane') > 0) amount *= 2;
  const room = t.hp + t.barrier;
  const barrierBefore = t.barrier;
  const capped = stacks(t, 'ghostly') > 0 || stacks(t, 'shielded') > 0;
  const lostHere = applyDamage(r, a.actor, t, amount, 'attack');
  let lost = lostHere;
  // (assassin) an Aura that answers your Attack getting through to an enemy (Envenom)
  if (
    lostHere > 0 &&
    a.actor.kind === 'hero' &&
    a.card?.kind === 'attack' &&
    t.side !== a.actor.side
  )
    fireTriggers(r, r.s.sides[a.actor.side], 'hitFoe', { target: t });
  // (hits taken this turn, for Hammer and Anvil; Reflect sends what its Barrier soaked back to the attacker)
  if (t.side !== a.actor.side) {
    t.hitsTaken = (t.hitsTaken ?? 0) + 1;
    const soaked = Math.max(0, barrierBefore - t.barrier);
    if (attacked && soaked > 0 && stacks(t, 'reflect') > 0 && a.actor.hp > 0)
      applyDamage(r, t, a.actor, soaked, 'direct');
  }
  // (a companion killed by an attack remembers by whom: Den Mother strikes back at it)
  if (attacked && t.kind === 'ally' && t.hp <= 0 && t.side !== a.actor.side)
    t.killedBy = a.actor.id;
  // Overflow: a single-target attack that kills a companion carries what is left on to the next one in line, the way a single
  // attack picks (a Taunt companion first, then the one in front), and only past the last of them to the hero (DECISIONS #321, #380)
  if (attacked && single && t.kind === 'ally' && t.hp <= 0 && !capped && amount > room) {
    let carried = Math.floor(((amount - room) * OVERFLOW_PCT) / 100);
    while (carried > 0 && !r.s.winner) {
      const standing = r.s.sides[t.side].units.filter((u) => u.kind === 'ally' && u.hp > 0);
      const next = standing.find((u) => u.taunt) ?? standing[0] ?? heroOf(r.s.sides[t.side]);
      if (!next || next.hp <= 0) break;
      const nextRoom = next.hp + next.barrier;
      const nextCapped = stacks(next, 'ghostly') > 0 || stacks(next, 'shielded') > 0;
      lost += applyDamage(r, a.actor, next, carried, 'attack', true);
      // (a companion the overflow kills, exactly or through Ghostly too, remembers its killer: Den Mother)
      if (next.kind === 'ally' && next.hp <= 0) next.killedBy = a.actor.id;
      if (next.kind !== 'ally' || next.hp > 0 || nextCapped || carried <= nextRoom) break;
      carried = Math.floor(((carried - nextRoom) * OVERFLOW_PCT) / 100);
    }
  }
  // Armored wears thin each time an attack gets through
  if (attacked && lost > 0 && stacks(t, 'armored') > 0) addStatus(r, t, 'armored', -1);
  // Guard (the Knight, DECISIONS #415): a hit of at least 1 that this hero's Barrier soaked completely leaves the attacker Open. Not
  // a hit Shielded cancelled or Ghostly capped, not one a Trap stopped (it returned above), not one that carried over from a fallen
  // companion (that never comes through here)
  if (
    attacked &&
    t.kind === 'hero' &&
    t.side !== a.actor.side &&
    amount > 0 &&
    !capped &&
    lostHere === 0 &&
    barrierBefore - t.barrier === amount &&
    a.actor.hp > 0 &&
    traitOf(r, t.side)?.openings
  )
    openUp(r, a.actor, true);
  // Thorns answer an attack (isAttackAct): a companion that strikes takes the Thorns itself
  const thorns = stacks(t, 'thorns');
  if (attacked && thorns > 0 && a.actor.hp > 0 && t.side !== a.actor.side) {
    applyDamage(r, t, a.actor, thorns, 'direct');
    // (the Knight's Thornwake answers it; the attacker is the target)
    if (t.kind === 'hero' && !r.s.winner)
      fireTriggers(r, r.s.sides[t.side], 'thorns', { target: a.actor, attacker: a.actor });
  }
  return lost;
}

/**
 * An enemy is left Open (the Knight, DECISIONS #415): at most one Opening each, and it lasts until the end of the turn of the side that
 * can spend it. `earned`: the Guard hero's Barrier did it (the 'opening' Auras and trait answer only that, never a card that opens).
 */
function openUp(r: Run, u: Unit, earned: boolean): void {
  if (u.hp <= 0 || stacks(u, 'opening') > 0) return;
  addStatus(r, u, 'opening', 1);
  if (earned) fireTriggers(r, r.s.sides[other(u.side)], 'opening', { target: u });
}

/** (the Spellblade) the enchantments changed: the screen is told. */
function showEnchants(r: Run, side: SideState, spent?: Enchant[]): void {
  r.ev.push({
    type: 'enchant',
    side: side.id,
    enchants: [...(side.enchants ?? [])],
    ...(spent?.length ? { spent } : {}),
  });
}

/**
 * Imbue an enchantment (DECISIONS #417): into a free position; with both taken, the player chooses which one it replaces (with no one
 * to ask, the oldest). `ifRoom`: only into a free position.
 */
function imbue(r: Run, a: Act, side: SideState, kind: Enchant, ifRoom: boolean): void {
  const list = (side.enchants ??= []);
  if (list.length >= ENCHANT_SLOTS) {
    if (ifRoom) return;
    if (a.pick) {
      r.s.pending = {
        kind: 'enchant',
        charge: kind,
        pool: list.map((_, i) => `e${i}`),
        min: 1,
        max: 1,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind: 'enchant' });
      return;
    }
    list.shift();
  }
  list.push(kind);
  showEnchants(r, side);
  fireTriggers(r, side, 'imbue');
}

/** Discharge 1 or 2 enchantments: with two different ones and a single discharge, the player chooses (with no one to ask, the oldest). */
function discharge(r: Run, a: Act, side: SideState, count: number): void {
  const list = side.enchants ?? [];
  if (!list.length) return;
  if (count >= 2 || list.length === 1) {
    spendCharges(
      r,
      a,
      side,
      list.map((_, i) => i),
    );
    return;
  }
  if (list[0] === list[1] || !a.pick) {
    spendCharges(r, a, side, [0]);
    return;
  }
  r.s.pending = {
    kind: 'discharge',
    pool: list.map((_, i) => `e${i}`),
    min: 1,
    max: 1,
    rest: [],
    actor: a.actor.id,
    target: a.target?.id ?? null,
    finish: null,
    x: a.x,
  };
  r.ev.push({ type: 'pending', side: side.id, kind: 'discharge' });
}

// --- the Monk's Martial Forms (DECISIONS #419) ------------------------------------------------------------------------

/**
 * How far the form's objective is this turn, 0-2 (2: complete). Root: two different Defensive techniques. Current: a Defensive then
 * a Striking technique, different cards, in that order. Ember: two different Striking techniques aimed at the same enemy.
 */
export function formProgress(sd: Pick<SideState, 'form' | 'formSteps' | 'formDone'>): number {
  if (sd.formDone) return 2;
  const steps = sd.formSteps ?? [];
  if (sd.form === 'root')
    return Math.min(2, new Set(steps.filter((x) => x.tag === 'defensive').map((x) => x.card)).size);
  if (sd.form === 'current') {
    // (any Defensive technique can open the sequence, and any later Striking one of another card closes it)
    const done = steps.some(
      (g, i) =>
        g.tag === 'defensive' &&
        steps.slice(i + 1).some((x) => x.tag === 'striking' && x.card !== g.card),
    );
    return done ? 2 : steps.some((x) => x.tag === 'defensive') ? 1 : 0;
  }
  if (sd.form === 'ember') {
    let best = 0;
    for (const t of new Set(
      steps.flatMap((x) => (x.tag === 'striking' && x.target ? [x.target] : [])),
    ))
      best = Math.max(
        best,
        new Set(steps.filter((x) => x.tag === 'striking' && x.target === t).map((x) => x.card))
          .size,
      );
    return Math.min(2, best);
  }
  return 0;
}

function showForm(r: Run, sd: SideState): void {
  if (!sd.form) return;
  r.ev.push({
    type: 'form',
    side: sd.id,
    form: sd.form,
    progress: formProgress(sd),
    done: !!sd.formDone,
  });
}

/** A new form: its objective's progress starts again (the turn's one completion stays spent if it was). */
function changeForm(r: Run, sd: SideState, form: Form): void {
  if (!sd.form || sd.form === form) return;
  sd.form = form;
  sd.formSteps = [];
  showForm(r, sd);
  fireTriggers(r, sd, 'formChange');
}

/**
 * A technique card the player played from hand is a step of the form's objective (an echo, a replay or a card played for free is
 * not). The first completion of a turn gives 1 Mastery and answers `technique` triggers; later ones give nothing.
 */
function techniqueStep(
  r: Run,
  sd: SideState,
  cd: CardDef,
  target: Unit | null,
  aimed?: UnitId,
): void {
  if (!sd.form || r.s.winner) return;
  const tag = cd.tags?.includes(DEFENSIVE_TAG)
    ? 'defensive'
    : cd.tags?.includes(STRIKING_TAG)
      ? 'striking'
      : null;
  if (!tag) return;
  sd.techniquesTurn = (sd.techniquesTurn ?? 0) + 1;
  if (tag === 'defensive') sd.defensiveTurn = (sd.defensiveTurn ?? 0) + 1;
  if (sd.formDone) return;
  (sd.formSteps ??= []).push({
    card: cd.id.replace(/\+$/, ''),
    tag,
    // (the enemy it was aimed at, by id: one it killed before a choice it asked is gone from the side, and still counts)
    ...(cd.target === 'foe' && (aimed ?? target?.id)
      ? { target: (aimed ?? target?.id) as UnitId }
      : target && target.side !== sd.id
        ? { target: target.id }
        : {}),
  });
  const hero = heroOf(sd);
  if (formProgress(sd) >= 2 && hero) {
    sd.formDone = true;
    addStatus(r, hero, 'mastery', 1);
    showForm(r, sd);
    fireTriggers(r, sd, 'technique');
    return;
  }
  showForm(r, sd);
}

// --- the Shaman's totems (DECISIONS #418) ------------------------------------------------------------------------------

function totemDef(r: Run, id: string) {
  const d = r.db.totems?.[id];
  if (!d) throw new RulesError(`Unknown totem "${id}"`);
  return d;
}

/**
 * Plant a totem: into the first free position; with all taken (or `anywhere`), the player chooses the position (a taken one is
 * replaced; with all taken they may keep them all). '*': the player chooses the kind first. With no one to ask: the first kind, the
 * first free position, and nothing replaced.
 */
function plant(r: Run, a: Act, side: SideState, spirit: string, anywhere: boolean): void {
  const list = side.totems;
  if (!list) return;
  if (spirit === '*') {
    // (a rare totem is only planted by a card that names it, DECISIONS #420)
    const kinds = Object.keys(r.db.totems ?? {})
      .filter((k) => !r.db.totems?.[k]?.rare)
      .sort();
    if (!kinds.length) return;
    if (!a.pick) {
      plant(r, a, side, kinds[0] as string, anywhere);
      return;
    }
    r.s.pending = {
      kind: 'plantKind',
      pool: kinds,
      min: 1,
      max: 1,
      rest: [],
      actor: a.actor.id,
      target: a.target?.id ?? null,
      finish: null,
      x: a.x,
      ...(anywhere ? { anywhere } : {}),
    };
    r.ev.push({ type: 'pending', side: side.id, kind: 'plantKind' });
    return;
  }
  totemDef(r, spirit);
  const free = list.indexOf(null);
  if (!anywhere && free >= 0) {
    placeTotem(r, a, side, free, spirit);
    return;
  }
  if (!a.pick) {
    if (free >= 0) placeTotem(r, a, side, free, spirit);
    return;
  }
  r.s.pending = {
    kind: 'plantAt',
    spirit,
    pool: list.map((_, i) => `t${i}`),
    // (all taken: choosing none keeps them, and nothing is planted)
    min: anywhere && free >= 0 ? 1 : 0,
    max: 1,
    rest: [],
    actor: a.actor.id,
    target: a.target?.id ?? null,
    finish: null,
    x: a.x,
    ...(anywhere ? { anywhere } : {}),
  };
  r.ev.push({ type: 'pending', side: side.id, kind: 'plantAt' });
}

/** A totem of `spirit` stands in position `at` now; what stood there is gone (a replacement is not a command). */
function placeTotem(r: Run, a: Act, side: SideState, at: number, spirit: string): void {
  const list = side.totems;
  if (!list || at < 0 || at >= list.length) return;
  const was = list[at];
  list[at] = spirit;
  r.ev.push({ type: 'totems', side: side.id, totems: [...list], at });
  // (the Elder Tree's Spirit)
  const def = r.db.totems?.[spirit];
  if (def?.onPlant?.length) runOps(r, mkAct(a.actor), def.onPlant);
  fireTriggers(r, side, 'plant', { rune: spirit });
  if (was && was !== spirit && !r.s.winner) {
    a.replaced++;
    fireTriggers(r, side, 'replace', { rune: spirit });
  }
}

/** A totem's spirit acts: its command, with +1 to every damage and Barrier number for each Spirit he has. */
function runCommand(r: Run, sd: SideState, hero: Unit, totem: number, kind: string): void {
  const d = totemDef(r, kind);
  sd.commanded = true;
  r.ev.push({ type: 'command', side: sd.id, totem, spirit: kind, target: null, empowered: false });
  runOps(r, mkAct(hero, { plus: stacks(hero, 'spirit') }), d.command);
  if (!r.s.winner) fireTriggers(r, sd, 'command', { rune: kind });
}

/**
 * A card commands totems (DECISIONS #421): every totem of a kind, one the player picks ('choose'), a random one, or all of them,
 * `times` times. Each spirit acts by itself (a random enemy, him, every enemy): not a card and not an attack.
 */
function commandTotems(
  r: Run,
  a: Act,
  sd: SideState,
  spirit: string,
  times: number,
  one = false,
): void {
  const hero = heroOf(sd);
  const list = sd.totems;
  if (!hero || !list) return;
  const planted = list.flatMap((k, i) => (k ? [i] : []));
  if (!planted.length) return;
  if (spirit === 'choose') {
    if (planted.length > 1 && a.pick) {
      r.s.pending = {
        kind: 'commandPick',
        pool: planted.map((i) => `t${i}`),
        min: 1,
        max: 1,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
        times,
      };
      r.ev.push({ type: 'pending', side: sd.id, kind: 'commandPick' });
      return;
    }
    commandAt(r, sd, hero, planted[0] as number, times);
    return;
  }
  for (let k = 0; k < times && !r.s.winner; k++) {
    const at =
      spirit === 'all'
        ? planted
        : spirit === 'random'
          ? [planted[nextInt(r.s.rng, planted.length)] as number]
          : planted.filter((i) => list[i] === spirit).slice(0, one ? 1 : undefined);
    for (const i of at) if (!r.s.winner && list[i]) runCommand(r, sd, hero, i, list[i]);
  }
}

function commandAt(r: Run, sd: SideState, hero: Unit, at: number, times: number): void {
  for (let k = 0; k < times && !r.s.winner; k++) {
    const kind = sd.totems?.[at];
    if (kind) runCommand(r, sd, hero, at, kind);
  }
}

/** The element a spell counts as now: its tag; a prism spell, the first element not cast yet this turn (none once all three are). */
function elementOf(cd: CardDef, sd: SideState): Element | null {
  for (const e of ELEMENTS) if (cd.tags?.includes(e)) return e;
  if (cd.tags?.includes(PRISM_TAG))
    return ELEMENTS.find((e) => !sd.elementsTurn?.includes(e)) ?? null;
  return null;
}

/**
 * The totems' help (DECISIONS #420): the first spell of each element each turn gets every totem's boost for that element, and the
 * first spell of any element the 'any' boosts (the Elder Tree); every 2 Spirit add 1 to each boost. Marks the boosts used.
 */
function spellBoost(r: Run, sd: SideState, cd: CardDef, mark = true): number {
  const hero = heroOf(sd);
  const el = elementOf(cd, sd);
  if (!hero || !el || !sd.totems) return 0;
  // (only a spell with a damage or Barrier number of its own can use the help: a utility spell leaves it for the next one, #422)
  if (!cd.effects.some((o) => o.op === 'damage' || o.op === 'barrier')) return 0;
  // (a preview only looks: it marks nothing)
  const used = mark ? (sd.boostsUsed ??= []) : [...(sd.boostsUsed ?? [])];
  const half = Math.floor(stacks(hero, 'spirit') / 2);
  let plus = 0;
  for (const key of [el, 'any'] as const) {
    if (used.includes(key)) continue;
    let got = false;
    for (const kind of sd.totems) {
      const b = kind ? r.db.totems?.[kind]?.boost : undefined;
      if (b && b.element === key) {
        plus += b.amount + half;
        got = true;
      }
    }
    if (got) used.push(key);
  }
  return plus;
}

/** A spell was cast: its element lights; the first time each turn all three are lit, Trinity triggers (1 Spirit). */
function castElement(r: Run, sd: SideState, cd: CardDef): void {
  const el = elementOf(cd, sd);
  if (!el || r.s.winner) return;
  const list = (sd.elementsTurn ??= []);
  if (!list.includes(el)) list.push(el);
  const trait = sd.hero ? r.db.heroes[sd.hero]?.trait : undefined;
  const hero = heroOf(sd);
  const fire = !!trait?.trinity && !!hero && !sd.trinityDone && list.length >= ELEMENTS.length;
  r.ev.push({ type: 'elements', side: sd.id, elements: [...list], trinity: fire });
  if (!fire || !hero) return;
  sd.trinityDone = true;
  addStatus(r, hero, 'spirit', 1);
  for (const kind of sd.totems ?? []) {
    const ops = kind ? r.db.totems?.[kind]?.onTrinity : undefined;
    if (ops?.length && !r.s.winner) runOps(r, mkAct(hero), ops);
  }
  if (!r.s.winner) fireTriggers(r, sd, 'trinity');
}

/** The chosen enchantments are spent, once each: Ward's Barrier now, Ember and Glass for the card's attack (Twin Edge doubles the first). */
function spendCharges(r: Run, a: Act, side: SideState, at: number[]): void {
  const list = side.enchants ?? [];
  const kinds = at.map((i) => list[i]).filter((k): k is Enchant => !!k);
  if (!kinds.length) return;
  side.enchants = list.filter((_, i) => !at.includes(i));
  const hero = heroOf(side);
  const twin = !!hero && stacks(hero, 'twinedge') > 0;
  if (hero && twin) addStatus(r, hero, 'twinedge', -stacks(hero, 'twinedge'));
  showEnchants(r, side, kinds);
  kinds.forEach((k, j) => {
    const times = twin && j === 0 ? 2 : 1;
    if (k === 'ember') a.ember += EMBER_DAMAGE * times;
    else if (k === 'glass') a.glass += GLASS_DAMAGE * times;
    else if (hero) execOp(r, a, { op: 'barrier', amount: WARD_BARRIER * times, to: 'self' });
  });
  a.discharged += kinds.length;
  fireTriggers(r, side, 'discharge');
  if (new Set(kinds).size >= 2) fireTriggers(r, side, 'dischargeMixed');
  // (a card with no attack to land on: its Glass breaks now, and its Ember is lost)
  if (!a.card?.effects.some((o) => o.op === 'damage')) {
    a.ember = 0;
    breakGlass(r, a);
  }
}

/** A discharged Glass breaks: its damage to every enemy still standing, a shard and not an attack (no Might, no Exposed). */
function breakGlass(r: Run, a: Act): void {
  if (a.glass <= 0 || r.s.winner) return;
  const g = a.glass;
  a.glass = 0;
  runOps(r, mkAct(a.actor), [{ op: 'damage', amount: g, to: 'allFoes' }]);
}

/** A Riposte spends the target's Opening; returns whether it had one. */
function spendOpening(r: Run, side: SideState, t: Unit | null): boolean {
  if (!t || t.hp <= 0 || t.side === side.id || stacks(t, 'opening') <= 0) return false;
  addStatus(r, t, 'opening', -stacks(t, 'opening'));
  fireTriggers(r, side, 'riposte', { target: t });
  return true;
}

/** Heal a unit by up to `n` (never past its max HP). A hero's side hears of the whole heal, even what full HP wasted. */
function healUnit(r: Run, t: Unit, n: number): void {
  if (n <= 0 || t.hp <= 0) return;
  // a heal never mends a companion: it grows it, as much max HP and HP (DECISIONS #356)
  if (t.kind === 'ally') {
    t.maxHp += n;
    t.hp += n;
    r.ev.push({ type: 'heal', target: t.id, amount: n, hp: t.hp, maxHp: t.maxHp });
    return;
  }
  const k = Math.min(n, t.maxHp - t.hp);
  if (k > 0) {
    t.hp += k;
    r.ev.push({ type: 'heal', target: t.id, amount: k, hp: t.hp });
    if (t.kind === 'hero') syncClutch(r, r.s.sides[t.side]);
  }
  if (t.kind === 'hero') fireTriggers(r, r.s.sides[t.side], 'heal', { healed: n });
}

// --- snares ---------------------------------------------------------------------------------------------------------

type Trig =
  | { on: 'attacked'; victim: Unit; attacker: Unit; hit: { prevented: boolean } }
  | { on: 'hpLost'; lost: number; attacker: Unit | null; hit: null }
  | { on: 'foeSummons'; summoned: Unit }
  | { on: 'foeDefends'; unit: Unit }
  | { on: 'foeTurn' };

/** The oldest matching Trap on `side` springs (at most one per event). */
function fireSnare(r: Run, side: Side, t: Trig): void {
  const sd = r.s.sides[side];
  const hero = heroOf(sd);
  if (!hero || hero.hp <= 0) return;
  const i = sd.snares.findIndex((sn) => {
    const tr = cardDef(r.db, sn.card).trigger;
    if (!tr || tr.on !== t.on) return false;
    if (tr.on === 'hpLost' && t.on === 'hpLost') return t.lost >= tr.min;
    return true;
  });
  if (i < 0) return;
  const sn = sd.snares.splice(i, 1)[0];
  if (!sn) return;
  r.ev.push({ type: 'snareSprung', side, snare: sn.id, card: sn.card });
  const cd = cardDef(r.db, sn.card);
  const attacker =
    t.on === 'foeSummons'
      ? t.summoned
      : t.on === 'foeDefends'
        ? t.unit
        : t.on === 'foeTurn'
          ? null
          : t.attacker;
  runOps(
    r,
    mkAct(hero, { target: attacker, attacker, hit: t.on === 'attacked' ? t.hit : null }),
    cd.effects,
  );
  sd.discard.push({ id: sn.id, card: sn.card });
  fireTriggers(r, sd, 'snare');
}

// --- selectors & ops ----------------------------------------------------------------------------------------------

function resolve(r: Run, a: Act, sel: Sel): Unit[] {
  const foes = r.s.sides[other(a.actor.side)].units.filter((u) => u.hp > 0);
  switch (sel) {
    case 'target':
      return a.target && a.target.hp > 0 ? [a.target] : [];
    case 'self':
      return a.actor.hp > 0 ? [a.actor] : [];
    case 'hero': {
      const h = heroOf(r.s.sides[a.actor.side]);
      return h && h.hp > 0 ? [h] : [];
    }
    case 'allFoes':
      return foes;
    case 'randomFoe':
      return foes.length ? [foes[nextInt(r.s.rng, foes.length)] as Unit] : [];
    case 'front':
      return foes.length ? [foes[0] as Unit] : [];
    case 'allFriends':
      return r.s.sides[a.actor.side].units.filter((u) => u.hp > 0);
    case 'allAllies':
      return r.s.sides[a.actor.side].units.filter((u) => u.hp > 0 && u.kind !== 'hero');
    case 'attacker':
      // an attacker that has just died (a Trap's damage killed it) takes the rest with it: nothing lands on another enemy. With
      // no attacker at all (a Trap set off by a summon), the front enemy
      if (a.attacker) return a.attacker.hp > 0 ? [a.attacker] : [];
      return foes.length ? [foes[0] as Unit] : [];
    case 'weakestFoe':
      return foes.length ? [foes.reduce((m, x) => (x.hp < m.hp ? x : m))] : [];
    case 'biggestAlly': {
      const crew = r.s.sides[a.actor.side].units.filter((u) => u.hp > 0 && u.kind !== 'hero');
      return crew.length ? [crew.reduce((m, x) => (x.maxHp > m.maxHp ? x : m))] : [];
    }
  }
}

/** The value of a metric for `a` (`t` is the unit an op is being applied to, for metrics "of the target"). */
function metricValue(
  r: Run,
  a: Act,
  m: Metric,
  of: Scale['of'],
  t: Unit | null,
  tag?: string,
  rune?: string,
): number {
  const sd = r.s.sides[a.actor.side];
  const u = of === 'each' ? (t ?? a.target) : of === 'target' ? a.target : a.actor;
  switch (m) {
    case 'barrier':
      return u?.barrier ?? 0;
    case 'hp':
      return u?.hp ?? 0;
    case 'missingHp':
      return u ? u.maxHp - u.hp : 0;
    case 'missingPct':
      return u ? Math.floor(((u.maxHp - u.hp) * 100) / Math.max(1, u.maxHp)) : 0;
    case 'seared':
    case 'burn':
    case 'exposed':
    case 'faltering':
    case 'might':
    case 'thorns':
    case 'mantra':
    case 'hangover':
    case 'resonance':
    case 'doom':
    case 'calm':
    case 'wrath':
    case 'radiant':
      return u ? stacks(u, m) : 0;
    case 'hand':
      return sd.hand.length;
    case 'drawPile':
      return sd.draw.length;
    case 'discardPile':
      return sd.discard.length;
    case 'exhausted':
      // a Power that is in play has left the deck but was not consumed: it does not count
      return sd.exhausted.filter((c) => r.db.cards[c.card]?.kind !== 'power').length;
    case 'allies':
      return sd.units.filter((x) => x.kind === 'ally' && x.hp > 0).length;
    case 'biggestAlly':
      return sd.units.reduce(
        (m, x) => (x.kind === 'ally' && x.hp > 0 ? Math.max(m, x.maxHp) : m),
        0,
      );
    case 'slots':
      return slotsUsed(r.db, sd);
    case 'foes':
      return r.s.sides[other(sd.id)].units.filter((x) => x.hp > 0).length;
    case 'snares':
      return sd.snares.length;
    case 'stars':
      return sd.stars;
    case 'runes':
      return sd.runes.length;
    case 'powers':
      // (Aura cards, not their triggers: an Aura with two triggers is one Aura; DECISIONS #338)
      return new Set(sd.powers.filter((p) => p.card !== TRAIT_POWER).map((p) => p.card)).size;
    case 'mana':
      return sd.mana;
    case 'played':
      return sd.played;
    case 'attacksPlayed':
      return sd.attacksPlayed;
    case 'skillsPlayed':
      return sd.skillsPlayed;
    case 'strikes': {
      // the whole deck, wherever a card is right now (the card being played is on none of the piles while it resolves)
      const seen = new Set<string>();
      const all = [
        ...sd.hand,
        ...sd.draw,
        ...sd.discard,
        ...sd.exhausted,
        ...(a.inst ? [a.inst] : []),
      ];
      let n = 0;
      for (const c of all) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        if (/strike/i.test(r.db.cards[c.card]?.name ?? '')) n++;
      }
      return n;
    }
    case 'drawn':
      return sd.drawn;
    case 'created':
      return sd.created;
    case 'discarded':
      return sd.discarded;
    case 'hpLostTurn':
      return sd.lostHpTurn ?? 0;
    case 'hpLostFight':
      return sd.lostHpFight ?? 0;
    case 'exhaustedTurn':
      return sd.exhaustedTurn ?? 0;
    case 'attacksInHand':
      return sd.hand.filter((c) => r.db.cards[c.card]?.kind === 'attack').length;
    case 'nonAttacksInHand':
      return sd.hand.filter((c) => r.db.cards[c.card]?.kind !== 'attack').length;
    case 'exhaustedNow':
      return a.exhaustedNow;
    case 'exhaustedDamage':
      return a.exhaustedDmg;
    case 'skillsInHand':
      return sd.hand.filter((c) => r.db.cards[c.card]?.kind === 'skill').length;
    case 'foesSeared':
      return r.s.sides[other(sd.id)].units.reduce(
        (n, x) => n + (x.hp > 0 ? stacks(x, 'seared') : 0),
        0,
      );
    case 'discardedNow':
      return a.discardedNow;
    case 'skillsDrawnNow':
      return a.skillsDrawnNow;
    case 'starsGained':
      return sd.starsGainedTurn ?? 0;
    case 'starCards': {
      const seen = new Set<string>();
      const all = [
        ...sd.hand,
        ...sd.draw,
        ...sd.discard,
        ...sd.exhausted,
        ...(a.inst ? [a.inst] : []),
      ];
      let n = 0;
      for (const c of all) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        const d = r.db.cards[c.card];
        if ((d?.starCost ?? 0) > 0 || d?.starX) n++;
      }
      return n;
    }
    case 'handRoom':
      return Math.max(0, MAX_HAND - sd.hand.length);
    case 'hitsTaken':
      return u?.hitsTaken ?? 0;
    case 'spent':
      return a.spent;
    // (the Defect copy, shaman)
    case 'runeKinds':
      return new Set(sd.runes.map((x) => x.rune)).size;
    case 'runesOf':
      return sd.runes.filter((x) => x.rune === rune).length;
    case 'channeledOf':
      return rune ? (sd.channeledBy?.[rune] ?? 0) : 0;
    case 'manaSpent':
      return sd.spentTurn ?? 0;
    case 'attacking': {
      // (of: 'target' by default for this one: it is about the enemy you aim at)
      const who = of === undefined || of === 'target' ? a.target : u;
      return who && meansToAttack(r, who) ? 1 : 0;
    }
    case 'x':
      return a.x;
    case 'charge':
      return a.charge;
    case 'healed':
      return a.healed;
    case 'bonus':
      return a.inst?.bonus ?? 0;
    // --- the Necrobinder copy
    case 'maxHp':
      return u?.maxHp ?? 0;
    case 'dealt':
      return a.dealt;
    case 'lost':
      return a.lost;
    case 'samePlayed': {
      const base = a.card?.id.replace(/\+$/, '');
      return base ? (sd.playedTurn ?? []).filter((x) => x === base).length : 0;
    }
    case 'tagExhausted':
      return sd.exhausted.filter((c) => !!tag && r.db.cards[c.card]?.tags?.includes(tag)).length;
    case 'tagDeck': {
      const seen = new Set<string>();
      let n = 0;
      for (const c of [
        ...sd.hand,
        ...sd.draw,
        ...sd.discard,
        ...sd.exhausted,
        ...(a.inst ? [a.inst] : []),
      ]) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        if (tag && r.db.cards[c.card]?.tags?.includes(tag)) n++;
      }
      return n;
    }
    case 'allyStrikes':
    case 'drawnTurn':
    case 'doomedTurn':
    case 'etherealPlayed':
    case 'deaths':
    case 'suits':
    case 'spades':
    case 'hearts':
    case 'diamonds':
    case 'clubs':
      return sideCount(sd, m);
    case 'fullTricks':
      return sd.fullTricks ?? 0;
    // (the Knight's Guard)
    case 'opening':
      return u ? stacks(u, 'opening') : 0;
    case 'foesOpen':
      return r.s.sides[other(sd.id)].units.filter((x) => x.hp > 0 && stacks(x, 'opening') > 0)
        .length;
    case 'foesAttacking':
      return r.s.sides[other(sd.id)].units.filter((x) => x.hp > 0 && meansToAttack(r, x)).length;
    // (the Assassin)
    case 'knives':
      return u ? stacks(u, 'knives') : 0;
    case 'knivesAll':
      return r.s.sides[other(sd.id)].units.reduce(
        (n, x) => n + (x.hp > 0 ? stacks(x, 'knives') : 0),
        0,
      );
    case 'prep':
      return u ? stacks(u, 'prep') : 0;
    case 'extracted':
      return a.extracted;
    case 'prepSpent':
      return a.spentBy.prep ?? 0;
    // (the Spellblade)
    case 'enchants':
      return sd.enchants?.length ?? 0;
    case 'enchantKinds':
      return new Set(sd.enchants ?? []).size;
    case 'wards':
      return (sd.enchants ?? []).filter((k) => k === 'ward').length;
    case 'discharged':
      return a.discharged;
    // (the Shaman)
    case 'totems':
      return (sd.totems ?? []).filter((x) => x !== null).length;
    case 'totemKinds':
      return new Set((sd.totems ?? []).filter((x) => x !== null)).size;
    case 'totemsOf':
      return (sd.totems ?? []).filter((x) => x !== null && x === rune).length;
    case 'spirit':
      return u ? stacks(u, 'spirit') : 0;
    case 'commanded':
      return sd.commanded ? 1 : 0;
    case 'uprooted':
      return a.uprooted;
    case 'replacedNow':
      return a.replaced;
    case 'spiritSpent':
      return a.spentBy.spirit ?? 0;
    // (the Monk)
    case 'mastery':
      return u ? stacks(u, 'mastery') : 0;
    case 'masterySpent':
      return a.spentBy.mastery ?? 0;
    case 'techniqueDone':
      return sd.formDone ? 1 : 0;
    case 'techniquesTurn':
      return sd.techniquesTurn ?? 0;
    case 'defensiveTurn':
      return sd.defensiveTurn ?? 0;
    case 'inRoot':
      return sd.form === 'root' ? 1 : 0;
    case 'inCurrent':
      return sd.form === 'current' ? 1 : 0;
    case 'inEmber':
      return sd.form === 'ember' ? 1 : 0;
    // (the Shaman, DECISIONS #420)
    case 'elementsTurn':
      return sd.elementsTurn?.length ?? 0;
    case 'trinityDone':
      return sd.trinityDone ? 1 : 0;
  }
}

/** Whether a unit's intent is an attack (a move with damage in it); a hero has no intent, so never. */
function meansToAttack(r: Run, u: Unit): boolean {
  const b = r.db.units[u.def]?.brain;
  const mv = b?.kind === 'enemy' && u.intent ? b.moves[u.intent.move] : undefined;
  return !!mv?.effects.some((o) => o.op === 'damage');
}

/** The counters of a side that a card's cost can read (the combat view carries them too). */
export type CostCounter =
  | 'attacksPlayed'
  | 'played'
  | 'skillsPlayed'
  | 'allyStrikes'
  | 'drawnTurn'
  | 'doomedTurn'
  | 'etherealPlayed'
  | 'deaths'
  | 'costTax'
  | 'suitsTurn';

/** The Necrobinder copy's counters of a side (also read by costOf, which has no frame to act in). */
function sideCount(sd: Partial<Pick<SideState, CostCounter>>, m: Metric): number {
  switch (m) {
    // (the Trickster's Suits)
    case 'suits':
      return sd.suitsTurn?.length ?? 0;
    case 'spades':
    case 'hearts':
    case 'diamonds':
    case 'clubs':
      return sd.suitsTurn?.includes(m) ? 1 : 0;
    case 'allyStrikes':
      return sd.allyStrikes ?? 0;
    case 'drawnTurn':
      return sd.drawnTurn ?? 0;
    case 'doomedTurn':
      return sd.doomedTurn ?? 0;
    case 'etherealPlayed':
      return sd.etherealPlayed ?? 0;
    case 'deaths':
      return sd.deaths ?? 0;
    case 'attacksPlayed':
      return sd.attacksPlayed ?? 0;
    case 'played':
      return sd.played ?? 0;
    default:
      return 0;
  }
}

/** A card copy is Fleeting (Ethereal) by its card or because a card made it so; Hold likewise. */
export function isEthereal(cd: CardDef, c: Pick<CardInst, 'ethereal'> | null | undefined): boolean {
  return !!cd.ethereal || !!c?.ethereal;
}

/** `amount` plus whatever its scale adds (never below 0 for amounts that cannot be negative). */
function scaleValue(r: Run, a: Act, sc: Scale, t: Unit | null): number {
  // (a tiny allowance, so a factor like 1/11 times 55 is 5 and not 4.999...)
  const v = metricValue(r, a, sc.by, sc.of, t, sc.tag, sc.rune);
  // (a step counts whole steps only: "5 more for every 10 Fate")
  const counted = sc.step ? Math.floor(v / sc.step) : v;
  return Math.floor((sc.mult ?? 1) * counted + 1e-9);
}

function amountOf(r: Run, a: Act, base: number, sc: Scale | undefined, t: Unit | null): number {
  if (!sc || sc.into === 'hits') return base;
  return base + scaleValue(r, a, sc, t);
}

/** Rune effects get +1 damage / Barrier per Resonance; a totem's command its Rousing and Spirit (`plus`). */
const resonanceOf = (a: Act): number => (a.rune ? stacks(a.actor, 'resonance') : 0) + a.plus;

/** A card's cost with its lasting changes (the recost op, a free copy), not the discounts a play spends. */
const lastingCost = (cd: CardDef, inst: CardInst | null): number =>
  Math.max(0, cd.cost + (inst?.costUp ?? 0) - (inst?.costDown ?? 0));

/** Deftness (One for All): your 0-cost Attacks deal this much more. */
const deftOf = (a: Act): number =>
  a.card && a.card.kind === 'attack' && !a.card.x && lastingCost(a.card, a.inst) === 0
    ? stacks(a.actor, 'deftness')
    : 0;

function runOps(r: Run, a: Act, ops: readonly Op[]): void {
  for (let i = 0; i < ops.length; i++) {
    if (r.s.winner) return;
    if (a.actor.hp <= 0 && a.actor.kind !== 'hero') return;
    execOp(r, a, ops[i] as Op);
    reap(r);
    if (r.s.pending) {
      // a choice was asked for: the rest of this card waits for the answer (with what it has discharged and not yet used)
      r.s.pending.rest = ops.slice(i + 1);
      if (a.ember) r.s.pending.ember = a.ember;
      if (a.glass) r.s.pending.glass = a.glass;
      if (a.discharged) r.s.pending.discharged = a.discharged;
      return;
    }
  }
}

function execOp(r: Run, a: Act, op: Op): void {
  const side = r.s.sides[a.actor.side];
  switch (op.op) {
    case 'damage': {
      // Blade Sweep: a blade card that strikes one enemy strikes every enemy
      if (
        op.to === 'target' &&
        a.card?.tags?.includes(BLADE_TAG) &&
        stacks(a.actor, 'bladesweep') > 0
      ) {
        execOp(r, a, { ...op, to: 'allFoes' });
        return;
      }
      let hits = op.hits ?? 1;
      if (op.scale?.into === 'hits') hits += scaleValue(r, a, op.scale, a.target);
      const knife = a.card?.tags?.includes(EDGE_TAG) === true;
      const edge = knife ? stacks(a.actor, 'edge') : 0;
      // (assassin) Fanned knives hit every enemy; Honed adds to the first knife of the turn
      const to: Sel =
        knife && op.to === 'target' && stacks(a.actor, 'fanned') > 0 ? 'allFoes' : op.to;
      const honed =
        knife && a.actor.kind === 'hero' && !side.honedUsed ? stacks(a.actor, 'honed') : 0;
      if (knife && a.actor.kind === 'hero') side.honedUsed = true;
      // (a hero's Vigor goes into its next attack card; an enemy's or a companion's into its next attacking move, DECISIONS #361)
      const vigor = isAttackAct(a) ? stacks(a.actor, 'vigor') : 0;
      // (One for All: a 0-cost Attack hits harder)
      const deft = deftOf(a);
      let took = 0;
      let kills = 0;
      const struck = new Set<string>();
      // (the Necrobinder copy) Calcify: your companions hit harder; Lethality: your first Attack of the turn hits harder;
      // Reaper Form: what your Attacks take off curses the enemy with as much Fate
      const lead = heroOf(side);
      const marrow = a.actor.kind === 'ally' && lead ? stacks(lead, 'marrow') : 0;
      const isAttack = a.card?.kind === 'attack';
      const leth =
        isAttack && lead && side.attacksPlayed === 0 ? 1 + stacks(lead, 'lethality') / 100 : 1;
      const reaping = isAttack && lead ? stacks(lead, 'reaping') > 0 : false;
      const noosed = a.card?.tags?.includes('noose') === true;
      // Riposte (the Knight): against an Open target the Opening is spent and every hit deals more (DECISIONS #415)
      const riposte =
        op.riposte && to === 'target' && spendOpening(r, side, a.target) ? op.riposte : 0;
      const ripTarget = riposte ? a.target : null;
      // (the Spellblade) a discharged Ember lands on the first hit of the attack
      let ember = a.ember;
      a.ember = 0;
      for (let i = 0; i < hits; i++) {
        // (a hit that wins the fight still pays its Lifesteal below: HP carries on in a run)
        if (r.s.winner) break;
        // (an enemy or companion killed mid-attack, by Reflect or Thorns, lands no more hits)
        if (a.actor.hp <= 0 && a.actor.kind !== 'hero') break;
        // a target that died mid-attack: the remaining hits find a new one (an enemy by its own rule for choosing, so a
        // random-picking foe picks again; anyone else the usual way: a minion still standing, then the hero)
        if (to === 'target' && (!a.target || a.target.hp <= 0)) {
          const b = r.db.units[a.actor.def]?.brain;
          a.target = pickFoe(r, a.actor, b?.kind === 'enemy' ? (b.foe ?? 'hero') : 'hero');
        }
        let ts = resolve(r, a, to);
        // a spread of hits: each finds an enemy not struck yet, and stops when every enemy has been
        if (op.distinct && op.to === 'randomFoe') {
          const fresh = resolve(r, a, 'allFoes').filter((u) => !struck.has(u.id));
          if (!fresh.length) break;
          ts = [fresh[nextInt(r.s.rng, fresh.length)] as Unit];
          struck.add(ts[0]!.id);
        }
        // Point Blank: a shot that finds only one enemy hits it harder
        const lone = op.lonePct && ts.length === 1 ? 1 + op.lonePct / 100 : 1;
        for (const t of ts) {
          const alive = t.hp > 0;
          // (Hang: cards tagged "noose" deal double to it per stack, capped so the number stays sane)
          const noose = noosed ? 2 ** Math.min(10, stacks(t, 'noose')) : 1;
          const lostHere = attackHit(
            r,
            a,
            t,
            Math.round(
              (amountOf(r, a, op.amount, op.scale, t) +
                edge +
                honed +
                vigor +
                deft +
                (t === ripTarget ? riposte : 0) +
                ember +
                resonanceOf(a) +
                marrow) *
                lone *
                leth *
                noose,
            ),
            to === 'target' || to === 'front',
          );
          ember = 0;
          took += lostHere;
          if (reaping && lostHere > 0 && t.side !== a.actor.side && t.hp > 0)
            addStatus(r, t, 'doom', lostHere);
          // Sic 'Em: a companion that hits its quarry raises another like it
          const quarry = stacks(t, 'quarry');
          if (a.actor.kind === 'ally' && quarry > 0 && t.side !== a.actor.side && !r.s.winner)
            raiseAlly(r, side, a.actor.def, quarry, a.actor);
          if (alive && t.hp <= 0) kills++;
        }
        reap(r);
      }
      // what a kill pays (Feed), once for each enemy this attack took down
      // (a blow that wins the fight still pays what outlasts it: max HP for good, an extra card reward)
      for (let k = 0; k < kills && op.onKill; k++) {
        if (!r.s.winner) runOps(r, a, op.onKill);
        else
          for (const o of op.onKill)
            if (o.op === 'maxHp' || o.op === 'extraReward') execOp(r, a, o);
      }
      a.dealt = took;
      if (vigor > 0) addStatus(r, a.actor, 'vigor', -vigor);
      // (the Spellblade) a discharged Glass breaks once the attack is done, on every enemy still standing
      breakGlass(r, a);
      // Lifesteal: the attacker heals a share of the HP the attack took off (DECISIONS #285)
      if (op.lifesteal && took > 0 && a.actor.hp > 0)
        healUnit(r, a.actor, Math.floor((took * op.lifesteal) / 100));
      // (assassin) Echoing Slash: the whole effect again for each enemy it killed (each kill needs an enemy, so it ends)
      if (op.repeatOnKill) for (let k = 0; k < kills && !r.s.winner; k++) execOp(r, a, op);
      return;
    }
    case 'loseHp':
      for (const t of resolve(r, a, op.to)) {
        applyDamage(
          r,
          a.actor,
          t,
          scaledByDifficulty(a.actor, t, amountOf(r, a, op.amount, op.scale, t) + resonanceOf(a)),
          'direct',
        );
        // paying HP for your own card is something Powers can react to
        if (t.kind === 'hero' && a.actor === t && t.hp > 0)
          fireTriggers(r, r.s.sides[t.side], 'loseHp');
      }
      return;
    case 'barrier':
      for (const t of resolve(r, a, op.to)) {
        let n = amountOf(r, a, op.amount, op.scale, t) + resonanceOf(a);
        // Unmovable: the first Barrier a card gives you each turn counts double
        if (
          n > 0 &&
          a.card &&
          t === a.actor &&
          t.kind === 'hero' &&
          stacks(t, 'unmovable') > 0 &&
          !side.barrierDoubled
        ) {
          side.barrierDoubled = true;
          n *= 2;
        }
        if (n > 0) n += stacks(a.actor, 'bracing');
        // (assassin) Shadowmeld: what you gain is doubled
        if (n > 0 && stacks(t, 'meld') > 0) n *= 2;
        if (n > 0 && (stacks(t, 'brittle') > 0 || stacks(t, 'stunned') > 0))
          n = Math.floor(n * 0.75);
        // a Trap that punishes defending springs first, so the Barrier cannot soak what it deals
        if (n > 0) fireSnare(r, other(t.side), { on: 'foeDefends', unit: t });
        if (t.hp <= 0 || r.s.winner) continue;
        t.barrier += n;
        r.ev.push({ type: 'barrier', target: t.id, amount: n, total: t.barrier });
        if (n > 0 && t.kind === 'hero') fireTriggers(r, r.s.sides[t.side], 'barrier');
      }
      return;
    case 'growHp':
      // a companion grows: more max HP, and as much healed (a hero never: their HP belongs to the run)
      for (const t of resolve(r, a, op.to)) {
        if (t.kind === 'hero' || t.hp <= 0) continue;
        const n = amountOf(r, a, op.amount, op.scale, t);
        if (n <= 0) continue;
        t.maxHp += n;
        t.hp += n;
        r.ev.push({ type: 'heal', target: t.id, amount: n, hp: t.hp, maxHp: t.maxHp });
      }
      return;
    case 'heal':
      for (const t of resolve(r, a, op.to)) healUnit(r, t, amountOf(r, a, op.amount, op.scale, t));
      return;
    case 'cleanse':
      // every debuff on the target is lessened (a Doom that is lowered kills later, or not at all); `all` dispels them for good
      for (const t of resolve(r, a, op.to))
        for (const st of DEBUFFS) {
          const have = stacks(t, st);
          if (have <= 0) continue;
          const off = op.all
            ? have
            : Math.min(have, Math.max(op.amount, Math.ceil((have * (op.pct ?? 0)) / 100)));
          addStatus(r, t, st, -off);
        }
      return;
    case 'status': {
      // (Might for all friends on a side whose hero shares it: the hero takes it first and passes on their share, and each
      // companion gets only the rest, so everyone ends up with exactly the amount the card says; DECISIONS #298)
      const share =
        op.status === 'might' && op.to === 'allFriends'
          ? (traitOf(r, side.id)?.shareMight ?? 0)
          : 0;
      let passed = 0;
      const targets = [...resolve(r, a, op.to)];
      if (share > 0)
        targets.sort((x, y) => (x.kind === 'hero' ? 0 : 1) - (y.kind === 'hero' ? 0 : 1));
      for (const t of targets) {
        let n = amountOf(r, a, op.amount, op.scale, t);
        if (share > 0 && t.kind === 'hero') {
          const was = stacks(t, 'might');
          addStatus(r, t, 'might', n);
          passed = Math.floor(stacks(t, 'might') * share) - Math.floor(was * share);
          if (op.temp && n > 0) side.temps.push({ unit: t.id, status: 'might', amount: n });
          continue;
        }
        if (share > 0 && t.kind === 'ally') n -= passed;
        if (n === 0) continue;
        const had = stacks(t, op.status);
        const applied = addStatus(
          r,
          t,
          op.status,
          op.status === 'seared' || op.status === 'burn' ? scaledByDifficulty(a.actor, t, n) : n,
        );
        if (op.temp && n > 0 && applied)
          (op.temp === 'theirs' ? r.s.sides[other(side.id)] : side).temps.push({
            unit: t.id,
            status: op.status,
            amount: n,
          });
        // a loss "this turn" (Hyperbeam) comes back at the end of it: only what was really taken, as stacks never go below 0
        if (op.temp && n < 0 && applied && had > stacks(t, op.status))
          (op.temp === 'theirs' ? r.s.sides[t.side] : side).temps.push({
            unit: t.id,
            status: op.status,
            amount: stacks(t, op.status) - had,
          });
      }
      return;
    }
    case 'scaleStatus':
      for (const t of resolve(r, a, op.to)) {
        const n = stacks(t, op.status);
        let next = Math.floor(n * op.mult);
        if (op.max !== undefined) next = Math.min(next, n + op.max);
        if (n > 0 && next !== n) addStatus(r, t, op.status, next - n);
      }
      return;
    case 'draw': {
      // (the cards it brings are counted, so a card can ask "if you drew a Skill" and mark them to Hold)
      const before = new Set(side.hand.map((c) => c.id));
      const got = drawCards(r, side, amountOf(r, a, op.amount, op.scale, null));
      for (const c of side.hand) {
        if (before.has(c.id)) continue;
        if (r.db.cards[c.card]?.kind === 'skill') a.skillsDrawnNow++;
        if (op.hold) c.held = true;
      }
      // Scrape: what was drawn this way and costs too much is discarded straight away
      if (op.keepCost !== undefined) {
        const keep = op.keepCost;
        for (const c of got) {
          if (!side.hand.includes(c) || costOf(r.db, side, c) <= keep) continue;
          side.hand = side.hand.filter((x) => x.id !== c.id);
          moveFromHand(r, side, c, 'discard');
        }
      }
      return;
    }
    case 'mana':
      gainMana(r, side, amountOf(r, a, op.amount, op.scale, null));
      return;
    case 'stars':
      gainStars(r, side, amountOf(r, a, op.amount, op.scale, null));
      return;
    case 'summon': {
      const u = spawn(r, side, op.unit, false, a.actor);
      // (a hero who shares Might: the new companion arrives with it)
      const lead = heroOf(side);
      const given = lead
        ? Math.floor(stacks(lead, 'might') * (traitOf(r, side.id)?.shareMight ?? 0))
        : 0;
      if (u && given > 0) addStatus(r, u, 'might', given);
      // Salvage: the first companion this card builds takes what the scrapped ones left behind
      const salv = r.salvage;
      if (u && salv && a.inst?.id === salv.inst) {
        delete r.salvage;
        if (salv.might > 0) addStatus(r, u, 'might', salv.might);
        if (salv.vigor > 0) addStatus(r, u, 'vigor', salv.vigor);
        const grow = Math.floor(salv.hp / 2);
        if (grow > 0) {
          u.maxHp += grow;
          u.hp += grow;
          r.ev.push({ type: 'heal', target: u.id, amount: grow, hp: u.hp, maxHp: u.maxHp });
        }
      }
      if (u) {
        fireSnare(r, other(side.id), { on: 'foeSummons', summoned: u });
        if (a.actor.kind === 'hero') fireTriggers(r, side, 'summon');
      }
      return;
    }
    case 'addCard': {
      const dest = op.side === 'self' ? side : r.s.sides[other(side.id)];
      if (dest.hero === null) return; // enemies have no deck
      const n = amountOf(r, a, op.times ?? 1, op.scale, null);
      for (let i = 0; i < n; i++) addCardTo(r, dest, op.card, op.to);
      return;
    }
    case 'actAllies':
      if (a.actor.kind === 'ally') return; // an ally cannot make everyone act again
      for (const u of [...side.units]) if (u.kind === 'ally' && u.hp > 0) actAlly(r, u);
      return;
    case 'prevent':
      if (a.hit) a.hit.prevented = true;
      return;
    case 'discard':
    case 'exhaustCards': {
      const kind = op.op === 'discard' ? 'discard' : 'exhaust';
      // (only some of the hand can be asked for: all but a kind, or only a kind)
      const only = op.op === 'exhaustCards' ? op.only : undefined;
      const not = op.op === 'exhaustCards' ? op.not : undefined;
      const tag = op.op === 'exhaustCards' ? op.tag : undefined;
      const fits = (c: CardInst): boolean => {
        const d = r.db.cards[c.card];
        return (
          (!only || d?.kind === only) &&
          (!not || d?.kind !== not) &&
          (!tag || d?.tags?.includes(tag) === true)
        );
      };
      // Flak Cannon: every such card, in the hand and both piles, with no choice
      if (op.op === 'exhaustCards' && op.everywhere) {
        for (const pile of ['hand', 'draw', 'discard'] as const) {
          const hit = side[pile].filter(fits).slice(0, Math.max(0, op.amount - a.exhaustedNow));
          side[pile] = side[pile].filter((c) => !hit.includes(c));
          for (const c of hit) {
            a.exhaustedNow++;
            exhaustCard(r, side, c);
          }
        }
        return;
      }
      const eligible = side.hand.filter(fits);
      const n = Math.min(op.amount, eligible.length);
      if (n <= 0) return;
      if (op.random || !a.pick || (!op.any && n >= eligible.length)) {
        // no choice to make (or no one to ask): random cards, or every eligible card when no more than the number
        for (let i = 0; i < n; i++) {
          const left = side.hand.filter((c) => eligible.includes(c));
          if (!left.length) break;
          const c = left[nextInt(r.s.rng, left.length)] as CardInst;
          side.hand = side.hand.filter((x) => x.id !== c.id);
          if (kind === 'exhaust') {
            a.exhaustedNow++;
            const dmg = r.db.cards[c.card]?.effects.find((o) => o.op === 'damage');
            if (dmg && dmg.op === 'damage') a.exhaustedDmg += dmg.amount;
          } else a.discardedNow++;
          moveFromHand(r, side, c, kind);
        }
        return;
      }
      r.s.pending = {
        kind,
        pool: eligible.map((c) => c.id),
        min: op.any ? 0 : n,
        max: n,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind });
      return;
    }
    case 'scry': {
      if (!a.pick) return;
      if (side.draw.length < op.amount && side.discard.length > 0) {
        side.draw = [...side.draw, ...shuffle(r.s.rng, side.discard)];
        side.discard = [];
        r.ev.push({ type: 'shuffle', side: side.id });
        fireTriggers(r, side, 'shuffle');
      }
      const top = side.draw.slice(0, op.amount);
      if (!top.length) return;
      r.s.pending = {
        kind: 'scry',
        pool: top.map((c) => c.id),
        // Foresee: choose one of them to draw (the rest are discarded)
        min: 1,
        max: 1,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind: 'scry' });
      return;
    }
    case 'power':
      side.powers.push({
        id: newId(r.s, 'p'),
        card: a.card?.id ?? '',
        when: op.when,
        ops: op.ops,
        ...(op.filter ? { filter: op.filter } : {}),
        ...(op.tag ? { tag: op.tag } : {}),
        ...(op.stance ? { stance: op.stance } : {}),
        ...(op.temp ? { temp: true } : {}),
        ...(op.once ? { once: true } : {}),
        ...(op.ethereal ? { ethereal: true } : {}),
        ...(op.minCost !== undefined ? { minCost: op.minCost } : {}),
        ...(op.pin && a.target ? { target: a.target.id } : {}),
        ...(op.pin && a.inst ? { from: a.inst.id } : {}),
        ...(op.maxCost !== undefined ? { maxCost: op.maxCost } : {}),
        ...(op.times ? { left: op.times } : {}),
        ...(op.rune ? { rune: op.rune } : {}),
        ...(op.status ? { status: op.status } : {}),
      });
      r.ev.push({ type: 'power', side: side.id, card: a.card?.id ?? '' });
      return;
    case 'channel': {
      const n = amountOf(r, a, op.times ?? 1, op.scale, null);
      // ('*': a random totem, any of them, each time)
      const kinds = Object.keys(r.db.runes ?? {}).sort();
      if (op.rune === '*' && !kinds.length) return;
      for (let i = 0; i < n && !r.s.winner; i++)
        channel(
          r,
          side,
          op.rune === '*' ? (kinds[nextInt(r.s.rng, kinds.length)] as string) : op.rune,
        );
      return;
    }
    case 'evoke': {
      // (the oldest first; `last`: the newest first)
      const count = Math.max(0, op.count ?? 1);
      const batch = !count
        ? []
        : op.last
          ? side.runes.slice(-count).reverse()
          : side.runes.slice(0, count);
      for (const rs of batch) {
        const times = amountOf(r, a, op.times ?? 1, op.scale, null);
        for (let i = 0; i < times && !r.s.winner; i++) fireRune(r, side, rs, 'evoke');
        // a totem that charges spends its charge when it awakens and stays (Echo Chamber): otherwise it hits ever harder for ever
        if (op.keep && runeDef(r, rs.rune).grow) rs.charge = 0;
        if (!op.keep) removeRune(r, side, rs);
        if (r.s.winner) return;
      }
      return;
    }
    case 'pulse': {
      // totems' passives, now (Loop, Darkness, Tesla Coil)
      const which = op.first
        ? side.runes.slice(0, 1)
        : side.runes.filter((x) => !op.rune || x.rune === op.rune);
      for (const rs of which)
        for (let i = 0; i < (op.times ?? 1) && !r.s.winner; i++)
          if (side.runes.includes(rs))
            fireRune(r, side, rs, 'passive', op.aim ? a.target : undefined);
      return;
    }
    case 'runeSlots':
      side.runeSlots = Math.max(0, Math.min(MAX_RUNES, side.runeSlots + op.amount));
      while (side.runes.length > side.runeSlots) {
        const first = side.runes[0] as RuneState;
        fireRune(r, side, first, 'evoke');
        removeRune(r, side, first);
      }
      return;
    case 'stance': {
      const hero = heroOf(side);
      if (hero) enterStance(r, hero, op.stance);
      return;
    }
    case 'manaNext':
      side.nextMana += op.amount;
      return;
    case 'maxMana':
      {
        const before = side.maxMana;
        // raising stops at the cap (and never lowers a maximum that boons already put above it)
        side.maxMana =
          op.amount >= 0
            ? Math.max(before, Math.min(MAX_MAX_MANA, before + op.amount))
            : Math.max(0, before + op.amount);
        r.ev.push({ type: 'maxMana', side: side.id, max: side.maxMana });
        // (the extra Mana starts with your next turn: nothing is paid out now; DECISIONS #302)
      }
      return;
    case 'drawNext':
      side.nextDraw += op.amount;
      return;
    case 'discover': {
      const hid = side.hero;
      if (!hid) return;
      // base, playable cards of your own pool and Neutral (a "+" card has no upgrade of its own; tokens have none either)
      const pool = Object.values(r.db.cards)
        .filter(
          (c) =>
            (op.neutral ? c.hero === 'neutral' : c.hero === hid || c.hero === 'neutral') &&
            c.rarity !== 'basic' &&
            c.rarity !== 'legendary' &&
            !!c.upgrade &&
            !c.source &&
            !c.unplayable &&
            c.id !== a.card?.id &&
            (!op.free || (c.cost <= 2 && c.rarity !== 'rare')) &&
            (!op.kind || c.kind === op.kind),
        )
        .sort((x, y) => (x.id < y.id ? -1 : 1));
      const count = (op.count ?? 1) + (op.scale ? amountOf(r, a, 0, op.scale, null) : 0);
      for (let i = 0; i < count && pool.length; i++) {
        const pick = pool[nextInt(r.s.rng, pool.length)] as CardDef;
        const better =
          op.upgraded && pick.upgrade && r.db.cards[pick.upgrade] ? pick.upgrade : pick.id;
        const made = addCardTo(r, side, better, 'hand');
        if (op.free && pick.cost > 0) made.costMod = -pick.cost;
        if (op.ethereal) made.ethereal = true;
      }
      return;
    }
    case 'upgrade': {
      const upgradable = (op.scope === 'discard' ? side.discard : side.hand).filter((c) => {
        const up = cardDef(r.db, c.card).upgrade;
        return !!up && !!r.db.cards[up];
      });
      // (the discard pile: that many random cards, each at most once)
      const some = (n: number): CardInst[] => {
        const left = [...upgradable];
        const out: CardInst[] = [];
        for (let k = 0; k < n && left.length; k++)
          out.push(left.splice(nextInt(r.s.rng, left.length), 1)[0] as CardInst);
        return out;
      };
      const chosen =
        op.scope === 'hand' ? upgradable : some(op.scope === 'discard' ? (op.amount ?? 1) : 1);
      for (const c of chosen) {
        c.card = cardDef(r.db, c.card).upgrade as CardId;
        r.ev.push({ type: 'transform', side: side.id, card: c.id, def: c.card });
      }
      return;
    }
    case 'cheapen': {
      if (op.scope === 'self') {
        if (!a.inst) return;
        const d = cardDef(r.db, a.inst.card);
        a.inst.costMod = Math.max(-d.cost, (a.inst.costMod ?? 0) - op.amount);
        r.ev.push({
          type: 'transform',
          side: side.id,
          card: a.inst.id,
          def: a.inst.card,
          costMod: a.inst.costMod,
        });
        return;
      }
      const eligible = side.hand.filter((c) => {
        const d = cardDef(r.db, c.card);
        return !d.x && !d.unplayable && d.cost + (c.costMod ?? 0) > 0;
      });
      const chosen =
        op.scope === 'hand'
          ? eligible
          : eligible.length
            ? [eligible[nextInt(r.s.rng, eligible.length)] as CardInst]
            : [];
      for (const c of chosen) {
        const d = cardDef(r.db, c.card);
        c.costMod = Math.max(-d.cost, (c.costMod ?? 0) - op.amount);
        r.ev.push({
          type: 'transform',
          side: side.id,
          card: c.id,
          def: c.card,
          costMod: c.costMod,
        });
      }
      return;
    }
    case 'copySelf':
      if (a.card) {
        const made = addCardTo(r, side, a.card.id, op.to);
        // (Adaptive Strike: a copy that costs 0 for good)
        if (op.free && a.card.cost > 0) made.costUp = -a.card.cost;
      }
      return;
    case 'reclaim': {
      // never a Power, and never another card that reclaims (two of them would fetch each other back for ever)
      const pool = side.exhausted.filter((c) => {
        const d = r.db.cards[c.card];
        return d?.kind !== 'power' && !d?.effects.some((x) => x.op === 'reclaim');
      });
      for (let i = 0; i < op.amount && pool.length; i++) {
        const pick = pool.splice(nextInt(r.s.rng, pool.length), 1)[0] as CardInst;
        side.exhausted = side.exhausted.filter((c) => c.id !== pick.id);
        // a full hand sends it to the discard pile instead (the same "burn" as a card drawn into a full hand)
        if (side.hand.length >= MAX_HAND) {
          side.discard.push(pick);
          r.ev.push({ type: 'burn', side: side.id, card: pick.id, def: pick.card });
        } else {
          side.hand.push(pick);
          r.ev.push({ type: 'draw', side: side.id, card: pick.id, def: pick.card });
        }
      }
      return;
    }
    case 'fetch': {
      for (let i = 0; i < op.amount; i++) {
        // (anywhere: the draw pile and the consumed pile too, never an Aura in play)
        const piles = op.anywhere
          ? [
              ...side.discard,
              ...side.draw,
              ...side.exhausted.filter((c) => r.db.cards[c.card]?.kind !== 'power'),
            ]
          : side.discard;
        const pool = piles.filter(
          (c) =>
            (!op.kind || r.db.cards[c.card]?.kind === op.kind) &&
            (!op.tag || r.db.cards[c.card]?.tags?.includes(op.tag) === true) &&
            (op.maxCost === undefined || costOf(r.db, side, c) <= op.maxCost),
        );
        if (!pool.length) break;
        const pick = pool[nextInt(r.s.rng, pool.length)] as CardInst;
        side.discard = side.discard.filter((c) => c.id !== pick.id);
        if (op.anywhere) {
          side.draw = side.draw.filter((c) => c.id !== pick.id);
          side.exhausted = side.exhausted.filter((c) => c.id !== pick.id);
        }
        const better = op.upgrade ? r.db.cards[pick.card]?.upgrade : undefined;
        if (better && r.db.cards[better]) pick.card = better;
        if (op.to === 'draw') {
          side.draw.unshift(pick);
          r.ev.push({ type: 'addCard', side: side.id, card: pick.id, def: pick.card, to: 'draw' });
        } else if (side.hand.length >= MAX_HAND) {
          side.discard.push(pick);
          r.ev.push({ type: 'burn', side: side.id, card: pick.id, def: pick.card });
        } else {
          side.hand.push(pick);
          r.ev.push({ type: 'draw', side: side.id, card: pick.id, def: pick.card });
        }
      }
      return;
    }
    case 'manaLock':
      side.manaLocked = true;
      return;
    case 'drawLock':
      side.drawLocked = true;
      return;
    case 'drawUntil':
      // (one at a time; it stops when a card of another kind comes, or when nothing more can be drawn)
      for (let i = 0; i < 60; i++) {
        const before = side.drawn;
        drawCards(r, side, 1);
        if (side.drawn === before) break;
        const last = side.hand[side.hand.length - 1];
        if (last && r.db.cards[last.card]?.kind !== op.not) break;
      }
      return;
    case 'exhaustTop':
      for (let i = 0; i < op.amount; i++) {
        if (side.draw.length === 0 && side.discard.length > 0) {
          side.draw = shuffle(r.s.rng, side.discard);
          side.discard = [];
          r.ev.push({ type: 'shuffle', side: side.id });
          fireTriggers(r, side, 'shuffle');
        }
        const top = side.draw.shift();
        if (!top) break;
        exhaustCard(r, side, top);
      }
      return;
    case 'transform': {
      const pile = op.from === 'draw' ? side.draw : side.hand;
      // (from the draw pile, a card that already is the new card is not picked: Seance)
      const eligible = pile.filter(
        (c) =>
          (!op.kind || r.db.cards[c.card]?.kind === op.kind) &&
          (!op.tag || r.db.cards[c.card]?.tags?.includes(op.tag) === true) &&
          (op.from !== 'draw' || c.card !== op.into),
      );
      if (!eligible.length) return;
      if (op.choose && a.pick && op.from !== 'draw') {
        const n = Math.min(op.amount ?? eligible.length, eligible.length);
        r.s.pending = {
          kind: 'transform',
          into: op.into,
          pool: eligible.map((c) => c.id),
          min: op.amount === undefined ? 0 : n,
          max: n,
          rest: [],
          actor: a.actor.id,
          target: a.target?.id ?? null,
          finish: null,
          x: a.x,
        };
        r.ev.push({ type: 'pending', side: side.id, kind: 'transform' });
        return;
      }
      // ("any number" with no one to ask, as when a card is played for free, turns none: never the whole hand)
      if (op.choose && op.amount === undefined) return;
      const chosen =
        op.amount === undefined
          ? eligible
          : shuffle(r.s.rng, [...eligible]).slice(0, Math.min(op.amount, eligible.length));
      for (const c of chosen) transformCard(r, side, c, op.into);
      return;
    }
    case 'when': {
      const v = metricValue(r, a, op.by, op.of, a.target, undefined, op.rune);
      if (
        (op.atLeast !== undefined && v < op.atLeast) ||
        (op.atMost !== undefined && v > op.atMost)
      )
        return;
      {
        // (the Shaman's totem help goes to a card's own numbers, never to an 'If ...:' bonus, DECISIONS #422)
        const plus = a.plus;
        a.plus = 0;
        runOps(r, a, op.ops);
        a.plus = plus;
      }
      return;
    }
    case 'copyPlayed':
      if (a.played) addCardTo(r, side, a.played.card, 'hand');
      return;
    case 'maxHp':
      for (const t of resolve(r, a, op.to)) {
        const n = amountOf(r, a, op.amount, undefined, t);
        if (n <= 0 || t.hp <= 0) continue;
        t.maxHp += n;
        t.hp += n;
        if (t.kind === 'hero') side.maxHpGained = (side.maxHpGained ?? 0) + n;
        r.ev.push({ type: 'heal', target: t.id, amount: n, hp: t.hp, maxHp: t.maxHp });
      }
      return;
    case 'extraReward':
      if (op.amount > 0) side.extraRewards = (side.extraRewards ?? 0) + op.amount;
      return;
    case 'playPile': {
      const hero = heroOf(side);
      if (!hero) return;
      const how = op.from === 'exhaust' ? 'stay' : op.exhaust ? 'exhaust' : 'normal';
      const aim = op.aim === 'target' ? a.target : null;
      // (assassin) Knife Trap: every fitting card in the pile, once each (one that goes back is not played again)
      if (op.all && op.from === 'exhaust') {
        const all = side.exhausted.filter((c) => fitsFree(r, op, c));
        for (const inst of all) {
          if (r.s.winner) break;
          if (!side.exhausted.includes(inst)) continue;
          side.exhausted = side.exhausted.filter((x) => x.id !== inst.id);
          const better = op.upgrade ? r.db.cards[inst.card]?.upgrade : undefined;
          if (better && r.db.cards[better]) inst.card = better;
          playFree(r, side, hero, inst, how, aim);
        }
        return;
      }
      const times = amountOf(r, a, op.amount ?? 1, op.scale, null);
      for (let i = 0; i < times && !r.s.winner; i++) {
        const inst = takeForFree(r, side, a, op);
        if (!inst) break;
        playFree(r, side, hero, inst, how, aim, op.repeat ?? 1);
      }
      return;
    }
    // --- (assassin) the Silent-shaped pieces
    case 'tick':
      for (const t of resolve(r, a, op.to)) bleedTick(r, t);
      return;
    case 'strip':
      for (const t of resolve(r, a, op.to)) {
        if (t.barrier > 0) {
          t.barrier = 0;
          r.ev.push({ type: 'barrierDrop', target: t.id, total: 0 });
        }
        if (stacks(t, 'steadfast') > 0) addStatus(r, t, 'steadfast', -stacks(t, 'steadfast'));
      }
      return;
    case 'selfCost':
      if (a.inst) a.inst.costDown = (a.inst.costDown ?? 0) + op.amount;
      return;
    case 'freeHand':
      for (const c of side.hand) {
        if (c.freeTurn) continue;
        c.freeTurn = true;
        r.ev.push({
          type: 'transform',
          side: side.id,
          card: c.id,
          def: c.card,
          costMod: -cardDef(r.db, c.card).cost,
        });
      }
      return;
    case 'giveSly': {
      const skills = side.hand.filter(
        (c) => r.db.cards[c.card]?.kind === 'skill' && !r.db.cards[c.card]?.sly && !c.sly,
      );
      if (!skills.length) return;
      const pick = skills[nextInt(r.s.rng, skills.length)] as CardInst;
      pick.sly = 'turn';
      r.ev.push({ type: 'transform', side: side.id, card: pick.id, def: pick.card });
      return;
    }
    case 'copyNext': {
      if (!side.hand.length) return;
      if (!a.pick) {
        // (no one to ask: a random card of the hand)
        const c = side.hand[nextInt(r.s.rng, side.hand.length)] as CardInst;
        (side.nextCopies ??= []).push({ card: c.card, times: op.times });
        return;
      }
      r.s.pending = {
        kind: 'copy',
        times: op.times,
        pool: side.hand.map((c) => c.id),
        min: 1,
        max: 1,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind: 'copy' });
      return;
    }
    case 'revive': {
      const def = (side.fallen ??= []).pop();
      if (!def) return;
      const u = spawn(r, side, def);
      if (u) {
        // it comes back hurt: half its HP
        applyDamage(r, null, u, Math.floor(u.maxHp / 2), 'direct');
        if (a.actor.kind === 'hero') fireTriggers(r, side, 'summon');
      } else side.fallen.push(def);
      return;
    }
    case 'sacrifice': {
      // (`self`: a companion acting under a command gives itself up: Bone Shards)
      const t = op.self ? a.actor : a.target;
      if (t && t.kind === 'ally' && t.side === a.actor.side && t.hp > 0) t.hp = 0;
      return;
    }
    case 'forge': {
      // a card and its upgrade ("+") grow together, so an upgraded Gathering Storm still grows itself
      const same = (id: string) => id.replace(/\+$/, '') === op.card;
      const all = [...side.hand, ...side.draw, ...side.discard];
      if (a.inst && same(a.inst.card)) all.push(a.inst);
      const mine = all.filter((c) => same(c.card));
      const amount = amountOf(r, a, op.amount, op.scale, a.target);
      // the running total: a copy made later (Spare Barrel, Double Tap...) starts as sharp as the rest
      side.forged = { ...side.forged, [op.card]: (side.forged?.[op.card] ?? 0) + amount };
      // (with none, the one made here takes a weapon's whole total from addCardTo; anything else starts at this Sharpen)
      if (!mine.length) {
        const made = addCardTo(r, side, op.card, 'hand');
        made.bonus ??= amount;
      } else for (const c of mine) c.bonus = (c.bonus ?? 0) + amount;
      r.ev.push({ type: 'forge', side: side.id, card: op.card, amount });
      return;
    }
    // --- the Regent's pieces (Obsidia, the spellblade)
    case 'barrierNext':
      side.nextBarrier = (side.nextBarrier ?? 0) + op.amount;
      return;
    case 'starsNext':
      side.nextStars = (side.nextStars ?? 0) + op.amount;
      return;
    case 'topdeck': {
      if (op.from === 'draw') {
        // (Foregone Conclusion) choose cards from the whole draw pile; they go to its top. The choice is shown sorted, so it
        // never tells the draw order; with no more cards than that, there is nothing to choose (they are already all there is)
        const n = Math.min(op.amount, side.draw.length);
        if (n <= 0 || n >= side.draw.length) return;
        if (!a.pick) {
          // (played with no one to ask: a Sly or replayed copy) random cards of the pile go to its top
          for (let i = 0; i < n; i++) {
            const k = n + nextInt(r.s.rng, side.draw.length - n);
            const [c] = side.draw.splice(k, 1);
            if (c) putOnTop(r, side, c);
          }
          return;
        }
        const pool = [...side.draw].sort((x, y) =>
          x.card < y.card ? -1 : x.card > y.card ? 1 : x.id < y.id ? -1 : 1,
        );
        r.s.pending = {
          kind: 'topdeck',
          from: 'draw',
          pool: pool.map((c) => c.id),
          min: n,
          max: n,
          rest: [],
          actor: a.actor.id,
          target: a.target?.id ?? null,
          finish: null,
          x: a.x,
        };
        r.ev.push({ type: 'pending', side: side.id, kind: 'topdeck' });
        return;
      }
      const n = Math.min(op.amount, side.hand.length);
      if (n <= 0) return;
      if (!a.pick || n >= side.hand.length) {
        for (let i = 0; i < n; i++) {
          const c = side.hand[nextInt(r.s.rng, side.hand.length)] as CardInst;
          side.hand = side.hand.filter((x) => x.id !== c.id);
          putOnTop(r, side, c);
        }
        return;
      }
      r.s.pending = {
        kind: 'topdeck',
        pool: side.hand.map((c) => c.id),
        min: n,
        max: n,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind: 'topdeck' });
      return;
    }
    case 'endTurn':
      if (a.actor.kind === 'hero' && r.s.active === a.actor.side) r.endAfter = true;
      return;
    case 'growSelf':
      if (a.inst) a.inst.bonus = (a.inst.bonus ?? 0) + op.amount;
      return;
    case 'copyInHand': {
      const pool = side.hand.filter((c) => !op.neutral || r.db.cards[c.card]?.hero === 'neutral');
      if (!pool.length) return;
      const pick = pool[nextInt(r.s.rng, pool.length)] as CardInst;
      addCardTo(r, side, pick.card, 'hand');
      return;
    }
    // --- the Necrobinder copy (Dorian: his minions stand in for Osty, several at once) ---------------------------------
    case 'raise': {
      const n = amountOf(r, a, op.times ?? 1, op.scale, null);
      for (let k = 0; k < n && !r.s.winner; k++) raiseAlly(r, side, op.unit, op.amount, a.actor);
      return;
    }
    case 'command': {
      // each companion strikes in turn, at the card's target (or, if it has fallen, the front enemy)
      const crew = side.units.filter((u) => u.kind === 'ally' && u.hp > 0);
      if (!crew.length) return;
      for (const u of crew) {
        if (r.s.winner) break;
        if (u.hp <= 0) continue;
        const front = r.s.sides[other(u.side)].units.find((x) => x.hp > 0) ?? null;
        const at = a.target && a.target.hp > 0 && a.target.side !== u.side ? a.target : front;
        r.ev.push({ type: 'act', unit: u.id, move: null });
        runOps(r, mkAct(u, { target: at, card: a.card, inst: a.inst, x: a.x }), op.ops);
        reap(r);
      }
      side.allyStrikes = (side.allyStrikes ?? 0) + 1;
      return;
    }
    case 'doomNow':
      for (const t of resolve(r, a, op.to)) {
        const doom = stacks(t, 'doom');
        if (doom > 0 && t.hp > 0 && t.hp <= doom) applyDamage(r, null, t, t.hp, 'direct');
      }
      return;
    case 'spreadDebuffs': {
      const from = a.target;
      if (!from) return;
      const rest = r.s.sides[from.side].units.filter((u) => u.hp > 0 && u.id !== from.id);
      for (const st of DEBUFFS) {
        const n = stacks(from, st);
        if (n > 0) for (const u of rest) addStatus(r, u, st, n);
      }
      return;
    }
    case 'mark': {
      const has = (c: CardInst): boolean =>
        op.flag === 'ethereal'
          ? isEthereal(cardDef(r.db, c.card), c)
          : op.flag === 'retain'
            ? !!cardDef(r.db, c.card).retain || !!c.retain
            : false;
      const pool = side.hand.filter((c) => !has(c) && !cardDef(r.db, c.card).unplayable);
      if (!pool.length) return;
      const c = pool[nextInt(r.s.rng, pool.length)] as CardInst;
      if (op.flag === 'ethereal') c.ethereal = true;
      else if (op.flag === 'retain') c.retain = true;
      else c.replay = (c.replay ?? 0) + 1;
      if (op.costUp) c.costUp = (c.costUp ?? 0) + op.costUp;
      r.ev.push({ type: 'transform', side: side.id, card: c.id, def: c.card });
      return;
    }
    case 'costTax':
      side.costTax = (side.costTax ?? 0) + op.amount;
      return;
    // --- the Defect copy (shaman) ---
    case 'recost': {
      // this card costs more (or less) for the rest of the fight, and the change adds up; a play does not spend it
      const c = a.inst;
      if (!c || !a.card || a.card.x) return;
      c.costUp = Math.max(-a.card.cost, (c.costUp ?? 0) + op.amount);
      return;
    }
    case 'reshuffle': {
      side.draw = shuffle(r.s.rng, [...side.draw, ...side.discard, ...side.hand]);
      for (const c of side.hand)
        r.ev.push({ type: 'discard', side: side.id, card: c.id, def: c.card });
      side.hand = [];
      side.discard = [];
      r.ev.push({ type: 'shuffle', side: side.id });
      fireTriggers(r, side, 'shuffle');
      return;
    }
    case 'returnPlayed': {
      const c = a.played;
      if (!c || !side.discard.includes(c) || side.hand.length >= MAX_HAND) return;
      side.discard = side.discard.filter((x) => x.id !== c.id);
      side.hand.push(c);
      r.ev.push({ type: 'draw', side: side.id, card: c.id, def: c.card });
      return;
    }
    // --- the Knight's Guard (DECISIONS #415)
    case 'riposte':
      if (spendOpening(r, side, a.target)) runOps(r, a, op.ops);
      return;
    // --- the Assassin's knives and Preparation (DECISIONS #416)
    case 'embed': {
      const to = op.to ?? 'target';
      for (const t of resolve(r, a, to)) {
        // a living enemy, and one this card attacked only if a hit of it landed (an embed with no attack before it always does)
        if (t.hp <= 0 || t.side === a.actor.side || a.struck.get(t.id) === false) continue;
        const room = Math.max(0, KNIFE_MAX - stacks(t, 'knives'));
        const n = Math.min(room, Math.max(0, op.amount));
        if (n <= 0) continue;
        addStatus(r, t, 'knives', n);
        for (let k = 0; k < n && !r.s.winner; k++) fireTriggers(r, side, 'embed', { target: t });
      }
      return;
    }
    case 'extract': {
      for (const t of resolve(r, a, op.to ?? 'target')) {
        // no loot from the dead, and only your own knives (the other side's): a unit of your side never holds them
        if (t.hp <= 0 || t.side === a.actor.side) continue;
        const n = Math.min(stacks(t, 'knives'), Math.max(0, op.amount));
        if (n <= 0) continue;
        addStatus(r, t, 'knives', -n);
        a.extracted += n;
        // (every knife pulled pays, even once the enemy has died of the earlier ones: what lands on it then simply does nothing)
        for (let k = 0; k < n && !r.s.winner; k++) {
          if (op.ops?.length) runOps(r, { ...a, target: t }, op.ops);
          if (!r.s.winner) fireTriggers(r, side, 'extract', { target: t });
        }
      }
      return;
    }
    // --- the Spellblade's enchantments (DECISIONS #417)
    case 'imbue':
      imbue(r, a, side, op.kind, op.ifRoom === true);
      return;
    case 'discharge':
      discharge(r, a, side, op.count);
      return;
    case 'recast': {
      const list = side.enchants ?? [];
      const newest = list[list.length - 1];
      if (!newest) return;
      const into = ENCHANTS.filter((k) => k !== newest);
      if (!a.pick) {
        list[list.length - 1] = into[0] as Enchant;
        showEnchants(r, side);
        return;
      }
      r.s.pending = {
        kind: 'recast',
        pool: [...into],
        min: 1,
        max: 1,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind: 'recast' });
      return;
    }
    // --- the Shaman's totems (DECISIONS #418)
    case 'plant':
      plant(r, a, side, op.spirit, op.anywhere === true);
      return;
    // --- the Monk's Martial Forms (DECISIONS #419)
    case 'form': {
      if (!side.form) return;
      if (op.form !== '*') {
        changeForm(r, side, op.form);
        return;
      }
      if (!a.pick) return;
      r.s.pending = {
        kind: 'form',
        pool: FORMS.filter((x) => x !== side.form),
        // (choosing none keeps the form, and its progress)
        min: 0,
        max: 1,
        rest: [],
        actor: a.actor.id,
        target: a.target?.id ?? null,
        finish: null,
        x: a.x,
      };
      r.ev.push({ type: 'pending', side: side.id, kind: 'form' });
      return;
    }
    case 'totemSlot': {
      const list = side.totems;
      if (!list || list.length >= TOTEM_SLOTS) return;
      list.push(null);
      r.ev.push({ type: 'totems', side: side.id, totems: [...list] });
      return;
    }
    case 'totemCommand':
      commandTotems(r, a, side, op.spirit, Math.max(1, op.times ?? 1), op.one === true);
      return;
    case 'uproot': {
      const list = side.totems;
      if (!list) return;
      const n = list.filter((x) => x !== null).length;
      if (!n) return;
      side.totems = list.map(() => null);
      a.uprooted += n;
      r.ev.push({ type: 'totems', side: side.id, totems: [...side.totems] });
      return;
    }
    case 'spend': {
      const n = Math.min(stacks(a.actor, op.status), Math.max(0, op.amount));
      if (n > 0) addStatus(r, a.actor, op.status, -n);
      a.spentBy[op.status] = (a.spentBy[op.status] ?? 0) + n;
      if (n > 0 && a.actor.kind === 'hero') fireTriggers(r, side, 'spend', { status: op.status });
      return;
    }
  }
}

/**
 * Raise (the Necrobinder copy's Summon N): a companion of `unit` rises with `hp` max HP while a slot is free; with every slot
 * taken, the weakest companion (least max HP) gains that much max HP and HP instead, so a Raise is never wasted.
 */
function raiseAlly(r: Run, sd: SideState, unit: string, hp: number, actor: Unit): void {
  if (hp <= 0 || sd.hero === null) return;
  const crew = sd.units.filter((u) => u.kind !== 'hero');
  if (slotsUsed(r.db, sd) + slotsOf(r.db, unit) <= allyCap(r.db, sd)) {
    const u = spawn(r, sd, unit, false);
    if (!u) return;
    u.maxHp = u.hp = hp;
    // (the summon event carries only the def: the screen learns its real HP from this)
    r.ev.push({ type: 'heal', target: u.id, amount: 0, hp: u.hp, maxHp: u.maxHp });
    const lead = heroOf(sd);
    const given = lead
      ? Math.floor(stacks(lead, 'might') * (traitOf(r, sd.id)?.shareMight ?? 0))
      : 0;
    if (given > 0) addStatus(r, u, 'might', given);
    fireSnare(r, other(sd.id), { on: 'foeSummons', summoned: u });
    if (actor.kind === 'hero') fireTriggers(r, sd, 'summon');
    return;
  }
  const alive = crew.filter((u) => u.hp > 0);
  if (!alive.length) return;
  const weak = alive.reduce((m, u) => (u.maxHp < m.maxHp ? u : m));
  weak.maxHp += hp;
  weak.hp += hp;
  r.ev.push({ type: 'heal', target: weak.id, amount: hp, hp: weak.hp, maxHp: weak.maxHp });
}

// --- runes -----------------------------------------------------------------------------------------------------------

function runeDef(r: Run, id: string) {
  const d = r.db.runes?.[id];
  if (!d) throw new RulesError(`Unknown rune "${id}"`);
  return d;
}

function channel(r: Run, sd: SideState, id: string): void {
  runeDef(r, id);
  if (sd.runeSlots <= 0) return;
  // a full row pushes the oldest rune out, and it is evoked
  while (sd.runes.length >= sd.runeSlots) {
    const first = sd.runes[0] as RuneState;
    fireRune(r, sd, first, 'evoke');
    removeRune(r, sd, first);
    if (r.s.winner) return;
  }
  sd.runes.push({ rune: id, charge: runeDef(r, id).start ?? 0 });
  (sd.channeledBy ??= {})[id] = (sd.channeledBy[id] ?? 0) + 1;
  r.ev.push({ type: 'runeChannel', side: sd.id, rune: id, index: sd.runes.length - 1 });
}

function removeRune(r: Run, sd: SideState, rs: RuneState): void {
  const i = sd.runes.indexOf(rs);
  if (i < 0) return;
  sd.runes.splice(i, 1);
  r.ev.push({ type: 'runeGone', side: sd.id, rune: rs.rune, index: i });
}

/**
 * A totem fires its passive or its awakening. `aim` (Tesla Coil): what it would strike at random, it strikes at this unit instead.
 * An awakening tells the "evoke" Auras which enemies it struck (Thunder hits each of them).
 */
function fireRune(
  r: Run,
  sd: SideState,
  rs: RuneState,
  how: 'passive' | 'evoke',
  aim?: Unit | null,
): void {
  const d = runeDef(r, rs.rune);
  const hero = heroOf(sd);
  if (!hero || hero.hp <= 0) return;
  r.ev.push({ type: 'runeFire', side: sd.id, rune: rs.rune, how });
  const from = r.ev.length;
  const base = how === 'passive' ? d.passive : d.evoke;
  const ops = aim
    ? base.map((o): Op => ('to' in o && o.to === 'randomFoe' ? { ...o, to: 'target' } : o))
    : base;
  runOps(
    r,
    mkAct(hero, {
      // (a Dark orb's Focus went into its charge: its awakening is plain)
      rune: !(how === 'evoke' && d.plainEvoke),
      charge: rs.charge,
      target: aim ?? null,
    }),
    ops,
  );
  if (how === 'passive' && d.grow) rs.charge += d.grow + stacks(hero, 'resonance');
  // (Glass fades a little every time it fires)
  if (how === 'passive' && d.decay) rs.charge = Math.max(0, rs.charge - d.decay);
  if (how === 'evoke' && !r.s.winner) {
    const struck = new Set<string>();
    for (const e of r.ev.slice(from))
      if (e.type === 'damage' && e.source === hero.id) {
        const u = findUnit(r.s, e.target);
        if (u && u.side !== sd.id) struck.add(u.id);
      }
    const hit = [...struck].map((id) => findUnit(r.s, id) ?? null);
    for (const t of hit.length ? hit : [null]) {
      if (r.s.winner) break;
      fireTriggers(r, sd, 'evoke', { target: t, rune: rs.rune });
    }
  }
}

// --- cards & piles -----------------------------------------------------------------------------------------------

function addCardTo(r: Run, sd: SideState, card: CardId, to: 'hand' | 'discard' | 'draw'): CardInst {
  cardDef(r.db, card);
  const inst: CardInst = { id: newId(r.s, 'c'), card };
  // a sharpened weapon's new copy is as sharp as the others (its upgrade shares the Sharpen)
  const base = card.replace(/\+$/, '');
  const sharp = r.db.cards[base]?.weapon ? sd.forged?.[base] : undefined;
  if (sharp) inst.bonus = sharp;
  let where = to;
  if (where === 'hand' && sd.hand.length >= MAX_HAND) where = 'discard';
  if (where === 'hand') sd.hand.push(inst);
  else if (where === 'discard') sd.discard.push(inst);
  else sd.draw.unshift(inst);
  r.ev.push({ type: 'addCard', side: sd.id, card: inst.id, def: card, to: where });
  sd.created++;
  // Rocket Punch: every copy gets cheaper (until it is played) when a card with its tag is made
  const tags = r.db.cards[card]?.tags ?? [];
  if (tags.length)
    for (const c of [...sd.hand, ...sd.draw, ...sd.discard]) {
      const d = r.db.cards[c.card];
      if (!d?.cheaperOnCreate || !tags.includes(d.cheaperOnCreate)) continue;
      c.costMod = Math.max(-d.cost, (c.costMod ?? 0) - 1);
      if (sd.hand.includes(c))
        r.ev.push({ type: 'transform', side: sd.id, card: c.id, def: c.card, costMod: c.costMod });
    }
  fireTriggers(r, sd, 'created', { card: cardDef(r.db, card), inst });
  return inst;
}

/** Arcana gained (or lost): gaining it is counted for the turn and is something Auras answer. */
function gainStars(r: Run, sd: SideState, n: number): void {
  if (n === 0) return;
  sd.stars = Math.max(0, sd.stars + n);
  r.ev.push({ type: 'stars', side: sd.id, stars: sd.stars });
  if (n > 0) {
    sd.starsGainedTurn = (sd.starsGainedTurn ?? 0) + n;
    fireTriggers(r, sd, 'gainArcana');
  }
}

/** A card (already out of every pile) goes on top of the draw pile. */
function putOnTop(r: Run, sd: SideState, c: CardInst): void {
  sd.draw.unshift(c);
  r.ev.push({ type: 'addCard', side: sd.id, card: c.id, def: c.card, to: 'draw' });
}

/** One card becomes another, where it is. */
function transformCard(r: Run, sd: SideState, c: CardInst, into: CardId): void {
  cardDef(r.db, into);
  c.card = into;
  // (it is a new card: nothing the old one was given carries over)
  for (const k of [
    'costMod',
    'bonus',
    'ethereal',
    'retain',
    'replay',
    'costUp',
    'costDown',
  ] as const)
    delete c[k];
  r.ev.push({ type: 'transform', side: sd.id, card: c.id, def: c.card });
}

/** Cards that come back to the hand on every nth card of a kind played this turn (Make It So). */
function bringBack(r: Run, sd: SideState, played: CardDef): void {
  const count =
    played.kind === 'attack'
      ? sd.attacksPlayed
      : played.kind === 'skill'
        ? sd.skillsPlayed
        : sd.played;
  if (count <= 0) return;
  for (const pile of ['draw', 'discard'] as const)
    for (const c of [...sd[pile]]) {
      const back = r.db.cards[c.card]?.returnEvery;
      if (!back || back.kind !== played.kind || count % back.n !== 0) continue;
      if (sd.hand.length >= MAX_HAND) return;
      sd[pile] = sd[pile].filter((x) => x.id !== c.id);
      sd.hand.push(c);
      r.ev.push({ type: 'draw', side: sd.id, card: c.id, def: c.card });
    }
}

/** Orbit: every ORBIT_STEP Mana spent gives Mana back. */
function orbitPay(r: Run, sd: SideState, hero: Unit, spent: number): void {
  const per = stacks(hero, 'orbit');
  if (per <= 0 || spent <= 0) return;
  sd.orbitSpent = (sd.orbitSpent ?? 0) + spent;
  while (sd.orbitSpent >= ORBIT_STEP) {
    sd.orbitSpent -= ORBIT_STEP;
    gainMana(r, sd, per);
  }
}

/** Returns the cards it drew itself (not those that Auras answering a draw drew in turn). */
function drawCards(r: Run, sd: SideState, n: number): CardInst[] {
  const got: CardInst[] = [];
  if (sd.drawLocked) return got;
  for (let i = 0; i < n; i++) {
    if (sd.draw.length === 0) {
      if (sd.discard.length === 0) return got;
      sd.draw = shuffle(r.s.rng, sd.discard);
      sd.discard = [];
      r.ev.push({ type: 'shuffle', side: sd.id });
      fireTriggers(r, sd, 'shuffle');
      // (a reshuffle Aura may have moved cards out of the new draw pile)
      if (sd.draw.length === 0) continue;
    }
    const c = sd.draw.shift() as CardInst;
    if (sd.hand.length >= MAX_HAND) {
      sd.discard.push(c);
      r.ev.push({ type: 'burn', side: sd.id, card: c.id, def: c.card });
    } else {
      sd.hand.push(c);
      got.push(c);
      r.ev.push({ type: 'draw', side: sd.id, card: c.id, def: c.card });
      sd.drawn++;
      sd.drawnTurn = (sd.drawnTurn ?? 0) + 1;
      fireTriggers(r, sd, 'draw', { drawn: c });
      if (!r.openingDraw && r.s.active === sd.id) fireTriggers(r, sd, 'drawMidTurn', { drawn: c });
      // what a card does when it is drawn (Kingly Kick, Kingly Punch)
      const dd = r.db.cards[c.card];
      const h = heroOf(sd);
      if (dd?.onDraw && h && r.depth < MAX_DEPTH && sd.hand.includes(c)) {
        r.depth++;
        runOps(r, mkAct(h, { card: dd, inst: c }), dd.onDraw);
        r.depth--;
      }
    }
  }
  return got;
}

/** A card that an effect (not the end-of-turn sweep) sends away from the hand. It has already left the hand. */
function moveFromHand(
  r: Run,
  sd: SideState,
  c: CardInst,
  kind: 'discard' | 'exhaust',
  /** false: it comes from the draw pile (Foresee's leftovers), so Sly does not play it */
  fromHand = true,
): void {
  const slyNow = c.sly !== undefined;
  clearTurnFlags(c);
  if (kind === 'discard') {
    sd.discard.push(c);
    sd.discarded++;
    r.ev.push({ type: 'discard', side: sd.id, card: c.id, def: c.card });
    const cd = cardDef(r.db, c.card);
    const hero = heroOf(sd);
    if (cd.onDiscard && hero && r.depth < MAX_DEPTH) {
      r.depth++;
      runOps(r, mkAct(hero), cd.onDiscard);
      r.depth--;
    }
    // (assassin) Sly: a card an effect discards is played for free
    if (
      fromHand &&
      (cd.sly || slyNow) &&
      hero &&
      hero.hp > 0 &&
      !r.s.winner &&
      sd.discard.includes(c)
    ) {
      sd.discard = sd.discard.filter((x) => x.id !== c.id);
      playFree(r, sd, hero, c, 'normal');
    }
    fireTriggers(r, sd, 'discard');
  } else exhaustCard(r, sd, c);
}

/** (assassin) what a copy had only for this turn (free, Held, Sly) ends when it leaves the hand */
function clearTurnFlags(c: CardInst): void {
  delete c.freeTurn;
  delete c.held;
  if (c.sly === 'turn') delete c.sly;
}

/** Puts a card (already out of every pile) into the exhaust pile and runs what exhausting it does. */
function exhaustCard(r: Run, sd: SideState, c: CardInst): void {
  sd.exhausted.push(c);
  sd.exhaustedTurn = (sd.exhaustedTurn ?? 0) + 1;
  r.ev.push({ type: 'exhaust', side: sd.id, card: c.id, def: c.card });
  const cd = cardDef(r.db, c.card);
  const hero = heroOf(sd);
  if (cd.onExhaust && hero && r.depth < MAX_DEPTH) {
    r.depth++;
    runOps(r, mkAct(hero), cd.onExhaust);
    r.depth--;
  }
  fireTriggers(r, sd, 'exhaust');
}

/** Whether a card is one a 'playPile' op may play (its kind, a part of its name, its tag). */
function fitsFree(r: Run, op: Extract<Op, { op: 'playPile' }>, c: CardInst): boolean {
  const d = r.db.cards[c.card];
  return (
    !!d &&
    (!op.kind || d.kind === op.kind) &&
    (!op.match || d.name.toLowerCase().includes(op.match.toLowerCase())) &&
    (!op.tag || d.tags?.includes(op.tag) === true) &&
    // (a card that plays cards from the consumed pile never plays another: two would play each other for ever)
    (op.from !== 'exhaust' ||
      (d.kind !== 'power' && !d.effects.some((o) => o.op === 'playPile') && !d.replayFromExhaust))
  );
}

/** Bleed (Seared) deals its stacks now and loses 1, as it does at the start of its turn; Burn (the Shaman's, #421) does the same. */
function bleedTick(r: Run, u: Unit): void {
  for (const st of ['seared', 'burn'] as const) {
    const n = stacks(u, st);
    if (n <= 0 || u.hp <= 0) continue;
    applyDamage(r, null, u, n, 'direct');
    addStatus(r, u, st, -1);
  }
}

/** Picks the card a 'playPile' op plays and takes it out of its pile (null when there is none). */
function takeForFree(
  r: Run,
  sd: SideState,
  a: Act,
  op: Extract<Op, { op: 'playPile' }>,
): CardInst | null {
  const fits = (c: CardInst): boolean => fitsFree(r, op, c);
  // (Uproar: a random Attack from your draw pile, not the top card)
  if (op.from === 'draw' && (op.kind || op.match)) {
    const pool = sd.draw.filter(fits);
    if (!pool.length) return null;
    const pick = pool[nextInt(r.s.rng, pool.length)] as CardInst;
    sd.draw = sd.draw.filter((x) => x.id !== pick.id);
    return pick;
  }
  if (op.from === 'draw') {
    if (sd.draw.length === 0 && sd.discard.length > 0) {
      sd.draw = shuffle(r.s.rng, sd.discard);
      sd.discard = [];
      r.ev.push({ type: 'shuffle', side: sd.id });
      fireTriggers(r, sd, 'shuffle');
    }
    const top = sd.draw[0];
    if (!top) return null;
    sd.draw.shift();
    return top;
  }
  if (op.from === 'drawn') {
    const c = a.drawn;
    if (!c || !fits(c) || !sd.hand.includes(c)) return null;
    sd.hand = sd.hand.filter((x) => x.id !== c.id);
    // (once only: the same card cannot be taken twice)
    a.drawn = null;
    return c;
  }
  const pile = op.from === 'hand' ? sd.hand : sd.exhausted;
  const pool = pile.filter(
    (c) =>
      fits(c) &&
      // a Power in the consumed pile is in play, and a card that plays cards could play itself for ever
      (op.from !== 'exhaust' ||
        (r.db.cards[c.card]?.kind !== 'power' &&
          !r.db.cards[c.card]?.effects.some((o) => o.op === 'playPile') &&
          !r.db.cards[c.card]?.replayFromExhaust)),
  );
  if (!pool.length) return null;
  const pick = pool[nextInt(r.s.rng, pool.length)] as CardInst;
  if (op.from === 'hand') sd.hand = sd.hand.filter((x) => x.id !== pick.id);
  else sd.exhausted = sd.exhausted.filter((x) => x.id !== pick.id);
  return pick;
}

/**
 * Plays a card for free, against a random enemy, without asking the player anything. 'normal': it goes where a played card goes;
 * 'exhaust': it is consumed; 'stay': it goes back to the consumed pile.
 */
function playFree(
  r: Run,
  sd: SideState,
  hero: Unit,
  inst: CardInst,
  how: 'normal' | 'exhaust' | 'stay',
  /** aim it at this enemy instead of a random one (while it stands) */
  aim: Unit | null = null,
  repeat = 1,
): void {
  const cd = cardDef(r.db, inst.card);
  // (a card that could not be played goes where it came from; the screen is told, so its piles stay right)
  const back = (): void => {
    if (how === 'stay') {
      sd.exhausted.push(inst);
      r.ev.push({ type: 'exhaust', side: sd.id, card: inst.id, def: inst.card });
    } else {
      sd.discard.push(inst);
      r.ev.push({ type: 'discard', side: sd.id, card: inst.id, def: inst.card });
    }
  };
  // it shows up in the hand for a moment, so the screen can play it
  r.ev.push({ type: 'draw', side: sd.id, card: inst.id, def: inst.card });
  if (cd.unplayable || r.depth >= MAX_DEPTH) return back();
  let target: Unit | null = null;
  if (cd.target === 'foe') {
    const foes = legalFoes(r, sd.id, cd);
    if (!foes.length) return back();
    target =
      aim && aim.hp > 0 && foes.includes(aim) ? aim : (foes[nextInt(r.s.rng, foes.length)] as Unit);
  } else if (cd.target === 'friend') target = hero;
  else if (cd.target === 'ally') {
    const allies = sd.units.filter((u) => u.kind === 'ally' && u.hp > 0);
    if (!allies.length) return back();
    target = allies[nextInt(r.s.rng, allies.length)] as Unit;
  }
  r.ev.push({
    type: 'play',
    side: sd.id,
    card: inst.id,
    def: inst.card,
    target: target?.id ?? null,
  });
  clearTurnFlags(inst);
  strangle(r, sd);
  if (r.s.winner) return back();
  if (cd.kind !== 'snare') showSuit(r, sd, cd);
  if (r.s.winner) return back();
  if (cd.kind === 'snare') {
    if (sd.snares.length < MAX_SNARES) {
      showSuit(r, sd, cd);
      sd.snares.push({ id: inst.id, card: inst.card });
      r.ev.push({ type: 'snareSet', side: sd.id, snare: inst.id });
      payFullTrick(r, sd);
    } else back();
    return;
  }
  r.depth++;
  for (let k = 0; k < Math.max(1, repeat) && !r.s.winner; k++)
    runOps(
      r,
      mkAct(hero, { target: target && target.hp > 0 ? target : null, card: cd, inst, x: 0 }),
      cd.effects,
    );
  r.depth--;
  if ((how === 'stay' || how === 'exhaust') && cd.kind !== 'power') {
    if (how === 'stay') {
      sd.exhausted.push(inst);
      r.ev.push({ type: 'exhaust', side: sd.id, card: inst.id, def: inst.card });
    } else exhaustCard(r, sd, inst);
    sd.played++;
    if (cd.kind === 'attack') sd.attacksPlayed++;
    if (cd.kind === 'skill') sd.skillsPlayed++;
    bringBack(r, sd, cd);
    countPlayed(sd, cd, inst);
    fireTriggers(r, sd, 'play', { card: cd, target, inst, cost: 0 });
    payFullTrick(r, sd);
  } else finishCard(r, sd, inst, cd, target, 0, true);
}

/**
 * (the Trickster's Suits) A card is being played: its suit shows (a Wild card shows them all). The first time in a turn all four
 * are showing, the hero's Full Trick goes off and the Auras that wait for it answer. Only a hero whose trait has Suits keeps them.
 */
function showSuit(r: Run, sd: SideState, cd: CardDef): void {
  const suits = traitOf(r, sd.id)?.suits;
  if (!suits) return;
  const shown = sd.suitsTurn ?? [];
  const suit = suitOf(cd);
  const add =
    suit === 'wild' ? SUITS.filter((x) => !shown.includes(x)) : shown.includes(suit) ? [] : [suit];
  if (!add.length) return;
  sd.suitsTurn = SUITS.filter((x) => shown.includes(x) || add.includes(x));
  const full = sd.suitsTurn.length === SUITS.length && !sd.fullTrickTurn;
  r.ev.push({ type: 'suits', side: sd.id, suits: [...sd.suitsTurn], full });
  if (!full) return;
  sd.fullTrickTurn = true;
  sd.fullTrickDue = true;
}

/**
 * The Full Trick a card earned goes off once that card has done what it does (so its 5 damage to every enemy never takes the card's
 * own target from it), and the Auras that wait for it answer.
 */
function payFullTrick(r: Run, sd: SideState): void {
  if (!sd.fullTrickDue) return;
  sd.fullTrickDue = false;
  const suits = traitOf(r, sd.id)?.suits;
  const hero = heroOf(sd);
  if (!suits || !hero || r.s.winner) return;
  r.depth++;
  runOps(r, mkAct(hero), suits.fullTrick);
  r.depth--;
  // (counted after it goes off: the first Full Trick of a fight reads 0)
  sd.fullTricks = (sd.fullTricks ?? 0) + 1;
  if (!r.s.winner) fireTriggers(r, sd, 'allSuits');
}

/** (assassin) Strangle: a card is being played by `sd`, so every enemy it has Strangled loses that much HP. */
function strangle(r: Run, sd: SideState): void {
  for (const u of [...r.s.sides[other(sd.id)].units]) {
    const n = stacks(u, 'strangled');
    if (n > 0 && u.hp > 0) applyDamage(r, null, u, n, 'direct');
  }
  reap(r);
}

/** Powers: run every trigger of `sd` for `when` (for 'play', only those that match the card). */
function fireTriggers(
  r: Run,
  sd: SideState,
  when: TriggerWhen,
  ctx: {
    card?: CardDef;
    target?: Unit | null;
    stance?: Stance;
    attacker?: Unit | null;
    healed?: number;
    /** the card just played / just drawn */
    inst?: CardInst;
    drawn?: CardInst;
    /** for 'arcana': how much was spent */
    spent?: number;
    /** in an 'allyHurt' trigger: the HP lost */
    lost?: number;
    /** in a 'play' trigger: what the card cost */
    cost?: number;
    /** 'evoke': the totem that awakened */
    rune?: string;
    /** 'spend': the status spent */
    status?: StatusId;
  } = {},
): void {
  const played = ctx.card;
  const hero = heroOf(sd);
  if (!hero || hero.hp <= 0 || r.depth >= MAX_DEPTH) return;
  r.depth++;
  for (const p of [...sd.powers]) {
    if (r.s.winner) break;
    if (p.when !== when) continue;
    // (a power that fired once already is gone; another trigger in this loop may have removed it)
    if (!sd.powers.includes(p)) continue;
    if (when === 'play' && played) {
      if (p.filter && p.filter !== played.kind) continue;
      if (p.tag && !played.tags?.includes(p.tag)) continue;
      if (p.minCost !== undefined && (ctx.cost ?? played.cost) < p.minCost) continue;
      if (p.ethereal && !isEthereal(played, ctx.inst)) continue;
      if (p.maxCost !== undefined && lastingCost(played, ctx.inst ?? null) > p.maxCost) continue;
    }
    if (when === 'draw' && p.ethereal) {
      const d = ctx.drawn ? r.db.cards[ctx.drawn.card] : undefined;
      if (!d || !isEthereal(d, ctx.drawn)) continue;
    }
    // a pinned power aims at the unit it was played on, and does nothing once that unit is gone (Oblivion)
    const pinned = p.target ? findUnit(r.s, p.target) : undefined;
    if (p.target && (!pinned || pinned.hp <= 0)) continue;
    if (p.from && ctx.inst?.id === p.from) continue;
    // (the Defect copy: a card made or drawn can narrow it too, a totem's awakening by kind, and some answer once a turn)
    if (when === 'created' || when === 'draw') {
      const subject =
        when === 'created' ? played : ctx.drawn ? r.db.cards[ctx.drawn.card] : undefined;
      if (p.filter && p.filter !== subject?.kind) continue;
      if (p.tag && !subject?.tags?.includes(p.tag)) continue;
    }
    if (when === 'evoke' && p.rune && p.rune !== ctx.rune) continue;
    if (
      (when === 'command' || when === 'plant' || when === 'replace') &&
      p.rune &&
      p.rune !== ctx.rune
    )
      continue;
    if (p.once && p.firedTurn === r.s.turn) continue;
    if ((when === 'stance' || when === 'stanceLeft') && p.stance && p.stance !== ctx.stance)
      continue;
    if (when === 'spend' && p.status && p.status !== ctx.status) continue;
    // an Aura that answers "an ally dies" by striking its attacker does nothing when nothing attacked it (a sacrifice, a Trap, Doom)
    if (
      when === 'allyDies' &&
      !ctx.attacker &&
      p.ops.some((o) => 'to' in o && (o as { to?: string }).to === 'attacker')
    )
      continue;
    // (it answers now: a once-a-turn Aura is spent for the turn, a limited one has one answer fewer)
    if (p.once) p.firedTurn = r.s.turn;
    if (p.left !== undefined && --p.left <= 0) sd.powers = sd.powers.filter((x) => x !== p);
    runOps(
      r,
      mkAct(hero, {
        target: pinned ?? ctx.target ?? null,
        attacker: ctx.attacker ?? null,
        healed: ctx.healed ?? 0,
        played: ctx.inst ?? null,
        drawn: ctx.drawn ?? null,
        spent: ctx.spent ?? 0,
        lost: ctx.lost ?? 0,
      }),
      p.ops,
    );
  }
  r.depth--;
}

// --- units ---------------------------------------------------------------------------------------------------------

function makeUnit(r: Run, side: Side, d: UnitDef): Unit {
  return {
    id: newId(r.s, 'u'),
    def: d.id,
    name: d.name,
    kind: d.brain.kind === 'ally' ? 'ally' : 'enemy',
    side,
    hp: d.maxHp,
    maxHp: d.maxHp,
    barrier: 0,
    statuses: { ...(d.statuses ?? {}) },
    taunt: d.taunt === true,
    intent: null,
    moveCount: 0,
    pat: '',
    patCount: 0,
    lowPct: 100,
    dmgPct: 100,
    lastMoves: [],
  };
}

/** Add a unit to a side (allies: nearest the centre after existing ones, in front of the hero; an enemy summoner's minions: just in front of it). */
function spawn(r: Run, sd: SideState, defId: string, quiet = false, summoner?: Unit): Unit | null {
  const d = def(r, defId);
  // (a hero's companions fill slots: a Heavy takes 2, a Colossal 3; enemies are counted one each)
  if (sd.hero !== null) {
    if (slotsUsed(r.db, sd) + slotsOf(r.db, defId) > allyCap(r.db, sd)) return null;
  } else if (
    sd.units.filter((u) => u.kind !== 'hero').length >= (quiet ? MAX_START_ENEMIES : MAX_ENEMIES)
  )
    return null;
  const u = makeUnit(r, sd.id, d);
  // an enemy's summons stand in front of the summoner (nearer the centre), never behind it
  const at = summoner && sd.hero === null ? sd.units.indexOf(summoner) : -1;
  const index = at >= 0 ? at : sd.units.length - (heroOf(sd) ? 1 : 0);
  sd.units.splice(index, 0, u);
  if (sd.hero === null) {
    u.maxHp = u.hp = scaledEnemyHp(u.maxHp, r.s.tier, r.s.enemyHpPct);
    u.dmgPct = r.s.enemyDmgPct;
    if (d.brain.kind === 'enemy' && tierMight(r.s.tier) > 0)
      u.statuses.might = (u.statuses.might ?? 0) + tierMight(r.s.tier);
  } else {
    // a hero's allies hit as hard as it does (a ghost Warden's, scaled with the tier; 100 for anyone else)
    u.dmgPct = heroOf(sd)?.dmgPct ?? 100;
  }
  if (!quiet) r.ev.push({ type: 'summon', side: sd.id, unit: u.id, def: d.id, index });
  if (d.brain.kind === 'enemy') chooseIntent(r, u);
  return u;
}

function reap(r: Run): void {
  if (r.s.winner) return;
  for (const side of ['a', 'b'] as const) {
    const sd = r.s.sides[side];
    const dead = sd.units.filter((u) => u.hp <= 0);
    if (!dead.length) continue;
    sd.units = sd.units.filter((u) => u.hp > 0);
    for (const u of dead) r.ev.push({ type: 'died', unit: u.id });
    // (the Necrobinder copy: Melancholy counts every death, on either side)
    for (const s2 of ['a', 'b'] as const)
      r.s.sides[s2].deaths = (r.s.sides[s2].deaths ?? 0) + dead.length;
    // an ally that falls is remembered (Revive) and its owner's Auras hear about it
    const fell = dead.filter((u) => u.kind === 'ally');
    for (const u of fell) (sd.fallen ??= []).push(u.def);
    for (const u of fell) {
      // (the one that killed it, if it is still standing)
      const killer = u.killedBy ? findUnit(r.s, u.killedBy) : null;
      fireTriggers(r, sd, 'allyDies', { attacker: killer && killer.hp > 0 ? killer : null });
      fireTriggers(r, sd, 'allyLost', { attacker: killer && killer.hp > 0 ? killer : null });
    }
  }
  const lost = (side: Side): boolean => {
    const sd = r.s.sides[side];
    return sd.hero !== null ? !heroOf(sd) : sd.units.length === 0;
  };
  const la = lost('a');
  const lb = lost('b');
  if (la || lb) {
    r.s.winner = la && lb ? 'draw' : la ? 'b' : 'a';
    r.s.pending = null;
    r.ev.push({ type: 'gameOver', winner: r.s.winner });
  }
}

// --- intents --------------------------------------------------------------------------------------------------------

function pickSimple(r: Run, u: Unit, p: SimplePattern): string {
  if (p.kind === 'cycle') return p.order[u.patCount % p.order.length] as string;
  // weighted: never the same move three times in a row
  const last2 = u.lastMoves.slice(-2);
  const barred = last2.length === 2 && last2[0] === last2[1] ? last2[1] : null;
  const opts = p.options.filter((o) => o.move !== barred && o.weight > 0);
  const pool = opts.length ? opts : p.options;
  const total = pool.reduce((n, o) => n + o.weight, 0);
  let x = nextInt(r.s.rng, total);
  for (const o of pool) {
    if (x < o.weight) return o.move;
    x -= o.weight;
  }
  return (pool[0] as { move: string }).move;
}

function phaseIndex(p: Pattern, hpPct: number): number {
  if (p.kind !== 'phases') return 0;
  // the phase with the lowest threshold that still covers the current HP
  let best = 0;
  p.phases.forEach((ph, i) => {
    const cur = p.phases[best];
    if (hpPct <= ph.atOrBelowPct && (!cur || ph.atOrBelowPct <= cur.atOrBelowPct)) best = i;
  });
  return best;
}

export function activePattern(p: Pattern, hpPct: number): SimplePattern {
  if (p.kind !== 'phases') return p;
  const ph = p.phases[phaseIndex(p, hpPct)];
  if (!ph) throw new RulesError('Pattern has no phases');
  return ph.pattern;
}

function pickFoe(r: Run, u: Unit, rule: FoeRule): Unit | null {
  const foes = r.s.sides[other(u.side)].units.filter((x) => x.hp > 0);
  const taunters = foes.filter((x) => x.taunt);
  const pool = taunters.length ? taunters : foes;
  if (!pool.length) return null;
  if (rule === 'random') return pool[nextInt(r.s.rng, pool.length)] as Unit;
  if (rule === 'lowest') return pool.reduce((m, x) => (x.hp < m.hp ? x : m));
  // the default: minions stand in front, so the hero is only hit once no ally is left standing
  return pool.find((x) => x.kind !== 'hero') ?? (pool[0] as Unit);
}

function chooseIntent(r: Run, u: Unit): void {
  const d = def(r, u.def);
  if (d.brain.kind !== 'enemy') return;
  const b = d.brain;
  u.lowPct = Math.min(u.lowPct, (u.hp / u.maxHp) * 100);
  const pct = u.lowPct;
  const key = String(phaseIndex(b.pattern, pct));
  if (u.pat !== key) {
    u.pat = key;
    u.patCount = 0;
  }
  const opening = u.moveCount === 0 && !!b.opening;
  const move = opening ? (b.opening as string) : pickSimple(r, u, activePattern(b.pattern, pct));
  if (!b.moves[move]) throw new RulesError(`${d.id} has no move "${move}"`);
  const target = pickFoe(r, u, b.foe ?? 'hero');
  u.intent = { move, target: target?.id ?? null };
  u.moveCount++;
  if (!opening) u.patCount++;
  u.lastMoves.push(move);
  if (u.lastMoves.length > 3) u.lastMoves.shift();
  r.ev.push({ type: 'intent', unit: u.id, move, target: u.intent.target });
}

// --- acting ---------------------------------------------------------------------------------------------------------

function actAlly(r: Run, u: Unit): void {
  const d = def(r, u.def);
  // (a companion with nothing to do on its own, such as a Bone Thrall, does not act at all)
  if (d.brain.kind !== 'ally' || u.hp <= 0 || d.brain.act.length === 0) return;
  const front = r.s.sides[other(u.side)].units.find((x) => x.hp > 0) ?? null;
  r.ev.push({ type: 'act', unit: u.id, move: null });
  runOps(r, mkAct(u, { target: front }), d.brain.act);
}

function actEnemy(r: Run, u: Unit): void {
  const d = def(r, u.def);
  if (d.brain.kind !== 'enemy' || u.hp <= 0) return;
  const it = u.intent;
  if (!it) return;
  const mv = d.brain.moves[it.move];
  if (!mv) throw new RulesError(`${d.id} has no move "${it.move}"`);
  let target = findUnit(r.s, it.target);
  const taunted = r.s.sides[other(u.side)].units.some((x) => x.taunt && x.hp > 0) && !target?.taunt;
  // an ally summoned after the intent was chosen still stands in front of the hero
  const bypassed =
    target?.kind === 'hero' &&
    (d.brain.foe ?? 'hero') === 'hero' &&
    r.s.sides[other(u.side)].units.some((x) => x.kind === 'ally' && x.hp > 0);
  if (!target || target.hp <= 0 || target.side === u.side || taunted || bypassed)
    target = pickFoe(r, u, d.brain.foe ?? 'hero') ?? undefined;
  // (what the move's first attack deals per hit, as its intent shows it, Vigor counted: the battle log names it "Slash (9)")
  const hits = mv.effects.filter((o) => o.op === 'damage');
  const hit = hits[0];
  r.ev.push({
    type: 'act',
    unit: u.id,
    move: it.move,
    ...(hit?.op === 'damage' && !hit.scale
      ? {
          damage: modifiedDamage(
            hit.amount + stacks(u, 'vigor'),
            u,
            hit.to === 'target' ? (target ?? null) : null,
          ),
          hits: hits.reduce((n, o) => n + (o.op === 'damage' ? (o.hits ?? 1) : 0), 0),
        }
      : {}),
  });
  u.intent = null;
  runOps(r, mkAct(u, { target: target ?? null }), mv.effects);
}

// --- turns ------------------------------------------------------------------------------------------------------------

/** The share of your Barrier that Fortified keeps each turn (75%; 50% if testing says it is too strong). */
export const FORTIFIED_KEEP = 0.75;
/** The most Hangover a unit can carry. */
export const HANGOVER_MAX = 10;

/** barrier falls away, Seared burns, then (for a hero side) mana refills and the hand is drawn */
function startOfTurn(r: Run, side: Side): void {
  const sd = r.s.sides[side];
  // Reflect lasts through the other side's turn, and ends as yours begins
  for (const u of sd.units)
    if (stacks(u, 'reflect') > 0) addStatus(r, u, 'reflect', -stacks(u, 'reflect'));
  for (const u of sd.units) {
    // (assassin) Blur: this turn change keeps all of it
    if (stacks(u, 'blur') > 0) {
      addStatus(r, u, 'blur', -1);
      continue;
    }
    if (u.barrier > 0) {
      // Fortified keeps a share of your Barrier through the turn change, Plating keeps up to its stacks; otherwise all of it falls away
      const fort = stacks(u, 'fortified') > 0 ? Math.floor(u.barrier * FORTIFIED_KEEP) : 0;
      const kept = Math.min(u.barrier, Math.max(fort, stacks(u, 'plating')));
      u.barrier = kept;
      r.ev.push({ type: 'barrierDrop', target: u.id, total: kept });
    }
  }
  // Plating wears thinner every turn
  for (const u of sd.units) if (stacks(u, 'plating') > 0) addStatus(r, u, 'plating', -1);
  // Seared (Bleed) burns; (assassin) an enemy hero's Virulent makes it burn more times over
  const foeHero = heroOf(r.s.sides[other(side)]);
  const ticks = 1 + (foeHero ? stacks(foeHero, 'virulent') : 0);
  for (const u of [...sd.units]) for (let i = 0; i < ticks; i++) bleedTick(r, u);
  // the morning after: Hangover costs that much HP, but never the last one, and it clears (DECISIONS #354)
  for (const u of [...sd.units]) {
    const owed = stacks(u, 'hangover');
    if (owed <= 0 || u.hp <= 0) continue;
    addStatus(r, u, 'hangover', -owed);
    const due = Math.min(owed, u.hp - 1);
    if (due <= 0) continue;
    const lost = applyDamage(r, null, u, due, 'direct');
    if (lost > 0 && u.kind === 'hero') fireTriggers(r, sd, 'loseHp');
  }
  reap(r);
}

/** PvP only: past SUDDEN_DEATH_AFTER, the hero whose turn begins loses more HP every turn, past anything that would stop it. */
function suddenDeath(r: Run, side: Side): void {
  if (r.s.mode !== 'pvp') return;
  const past = Math.ceil(r.s.turn / 2) - SUDDEN_DEATH_AFTER;
  const hero = heroOf(r.s.sides[side]);
  if (past <= 0 || !hero) return;
  const amount = past * SUDDEN_DEATH_STEP;
  const lost = Math.min(hero.hp, amount);
  hero.hp -= lost;
  r.ev.push({
    type: 'damage',
    source: null,
    target: hero.id,
    amount,
    blocked: 0,
    lost,
    shielded: false,
    kind: 'direct',
    hp: hero.hp,
  });
  reap(r);
}

function beginHeroTurn(r: Run, side: Side): void {
  const sd = r.s.sides[side];
  r.s.active = side;
  r.s.turn++;
  r.ev.push({ type: 'turnStart', side, turn: r.s.turn });
  // (the suits clear first, so a card played as the turn begins keeps its suit)
  if (traitOf(r, side)?.suits) {
    sd.suitsTurn = [];
    sd.fullTrickTurn = false;
    sd.fullTrickDue = false;
    r.ev.push({ type: 'suits', side, suits: [], full: false });
  }
  suddenDeath(r, side);
  if (r.s.winner) return;
  startOfTurn(r, side);
  if (r.s.winner) return;
  // the opposing Traps that wait for your turn to begin
  r.opening = true;
  fireSnare(r, other(side), { on: 'foeTurn' });
  r.opening = false;
  if (r.s.winner) return;
  sd.played = 0;
  sd.attacksPlayed = 0;
  sd.skillsPlayed = 0;
  if (sd.totems) {
    sd.commanded = false;
    sd.elementsTurn = [];
    sd.boostsUsed = [];
    sd.trinityDone = false;
  }
  if (sd.form) {
    sd.formSteps = [];
    sd.formDone = false;
    sd.techniquesTurn = 0;
    sd.defensiveTurn = 0;
  }
  sd.discarded = 0;
  sd.lostHpTurn = 0;
  sd.exhaustedTurn = 0;
  sd.manaLocked = false;
  sd.drawLocked = false;
  sd.barrierDoubled = false;
  sd.starsGainedTurn = 0;
  for (const u of [...r.s.sides.a.units, ...r.s.sides.b.units]) delete u.hitsTaken;
  // (the Necrobinder copy's counters for the turn)
  sd.allyStrikes = 0;
  sd.doomedTurn = 0;
  sd.playedTurn = [];
  sd.costTax = 0;
  sd.spentTurn = 0;
  // the second PvP player gets a small head start on their first turn
  const first = r.s.mode === 'pvp' && side === 'b' && r.s.turn === 2;
  // Mana owed from a borrowed turn comes off the top, but a turn never starts below 0
  const rawMana = sd.maxMana + (first ? 1 : 0) + sd.nextMana;
  sd.mana = Math.max(0, rawMana);
  const extraDraw = sd.nextDraw;
  // debt beyond this turn's Mana is carried to the next, not forgiven
  sd.nextMana = Math.min(0, rawMana);
  sd.nextDraw = 0;
  r.ev.push({ type: 'mana', side, mana: sd.mana });
  r.openingDraw = true;
  drawCards(r, sd, sd.handSize + (first ? 1 : 0) + extraDraw);
  r.openingDraw = false;
  // (cards drawn "during your turn" are the ones after the opening hand: Death March)
  sd.drawnTurn = 0;
  const hero = heroOf(sd);
  if (!hero) return;
  // (assassin) what was set up last turn arrives: Nightmare's copies, Dodge and Roll's Barrier, Shadow Step's double damage
  sd.honedUsed = false;
  for (const nc of (sd.nextCopies ?? []).splice(0))
    for (let i = 0; i < nc.times; i++) addCardTo(r, sd, nc.card, 'hand');
  const guard = stacks(hero, 'guarded');
  if (guard > 0) {
    addStatus(r, hero, 'guarded', -guard);
    hero.barrier += guard;
    r.ev.push({ type: 'barrier', target: hero.id, amount: guard, total: hero.barrier });
    fireTriggers(r, sd, 'barrier');
  }
  const poised = stacks(hero, 'poised');
  if (poised > 0) {
    addStatus(r, hero, 'poised', -poised);
    addStatus(r, hero, 'empowered', 1);
    sd.temps.push({ unit: hero.id, status: 'empowered', amount: 1 });
  }
  // Barrier and Arcana put by last turn (Glitterstream, Hidden Cache)
  if ((sd.nextBarrier ?? 0) > 0 && hero.hp > 0) {
    hero.barrier += sd.nextBarrier ?? 0;
    r.ev.push({
      type: 'barrier',
      target: hero.id,
      amount: sd.nextBarrier ?? 0,
      total: hero.barrier,
    });
    fireTriggers(r, sd, 'barrier');
  }
  sd.nextBarrier = 0;
  const owedStars = sd.nextStars ?? 0;
  sd.nextStars = 0;
  if (owedStars > 0) gainStars(r, sd, owedStars);
  const opening = r.s.turn === (side === 'a' ? 1 : 2);
  // the Sigil, then Boons: the fight-start effects once, the turn-start effects every turn
  if (opening) {
    const sigil = sd.hero ? r.db.heroes[sd.hero]?.sigil : undefined;
    if (sigil) runOps(r, mkAct(hero), sigil);
    const trait = sd.hero ? r.db.heroes[sd.hero]?.trait : undefined;
    if (trait?.fightStart) runOps(r, mkAct(hero), trait.fightStart);
    for (const t of trait?.triggers ?? [])
      sd.powers.push({
        id: newId(r.s, 'p'),
        card: TRAIT_POWER,
        when: t.when,
        ops: t.ops,
        ...(t.filter ? { filter: t.filter } : {}),
        ...(t.tag ? { tag: t.tag } : {}),
        ...(t.stance ? { stance: t.stance } : {}),
        // (a trait's trigger narrows like an Aura's: once a turn is the Monk's Serene Mana, DECISIONS #413)
        ...(t.once ? { once: true } : {}),
        ...(t.ethereal ? { ethereal: true } : {}),
        ...(t.minCost !== undefined ? { minCost: t.minCost } : {}),
        ...(t.maxCost !== undefined ? { maxCost: t.maxCost } : {}),
        ...(t.times ? { left: t.times } : {}),
        ...(t.rune ? { rune: t.rune } : {}),
        ...(t.status ? { status: t.status } : {}),
      });
  }
  {
    const trait = sd.hero ? r.db.heroes[sd.hero]?.trait : undefined;
    if (trait?.turnStart) runOps(r, mkAct(hero), trait.turnStart);
    syncClutch(r, sd);
  }
  for (const id of sd.boons) {
    const b = r.db.boons[id];
    if (!b) continue;
    if (b.fightStart && opening) runOps(r, mkAct(hero), b.fightStart);
    if (b.turnStart) runOps(r, mkAct(hero), b.turnStart);
  }
  // (a totem whose passive belongs to the start of the turn: Plasma's Mana)
  for (const rs of [...sd.runes]) {
    if (r.s.winner) return;
    if (sd.runes.includes(rs) && runeDef(r, rs.rune).atStart) fireRune(r, sd, rs, 'passive');
  }
  fireTriggers(r, sd, 'turnStart');
  // a card that comes back from the consumed pile every turn (Howl From Beyond)
  for (const c of [...sd.exhausted]) {
    if (r.s.winner) break;
    if (!r.db.cards[c.card]?.replayFromExhaust) continue;
    if (!sd.exhausted.includes(c)) continue;
    sd.exhausted = sd.exhausted.filter((x) => x.id !== c.id);
    playFree(r, sd, hero, c, 'stay');
  }
}

/**
 * End of `side`'s turn: its Faltering wears off (it has just spent a turn weakened), and Exposed wears off on the
 * OTHER side's units (they have just been attacked by `side` for a turn). So "Exposed 2" on a hero covers the rest of
 * the enemy turn it was applied in plus one more enemy turn.
 */
function decay(r: Run, side: Side): void {
  for (const u of r.s.sides[side].units)
    if (stacks(u, 'faltering') > 0) addStatus(r, u, 'faltering', -1);
  for (const u of r.s.sides[other(side)].units) {
    if (stacks(u, 'exposed') > 0) addStatus(r, u, 'exposed', -1);
    // an Opening lasts through the turn of the side that can spend it, and goes as that turn ends (DECISIONS #415)
    if (stacks(u, 'opening') > 0) addStatus(r, u, 'opening', -stacks(u, 'opening'));
    // Sturdy (Giant's Stance) holds through the other side's whole turn, then it is spent
    if (stacks(u, 'sturdy') > 0) addStatus(r, u, 'sturdy', -stacks(u, 'sturdy'));
  }
  const sd = r.s.sides[side];
  for (const u of [...sd.units]) {
    if (u.hp <= 0) continue;
    const plated = stacks(u, 'armored');
    if (plated > 0) {
      u.barrier += plated;
      r.ev.push({ type: 'barrier', target: u.id, amount: plated, total: u.barrier });
      if (u.kind === 'hero') fireTriggers(r, r.s.sides[u.side], 'barrier');
    }
    const ritual = stacks(u, 'ritual');
    if (ritual > 0) addStatus(r, u, 'might', ritual);
    if (stacks(u, 'ghostly') > 0) addStatus(r, u, 'ghostly', -1);
    if (stacks(u, 'brittle') > 0) addStatus(r, u, 'brittle', -1);
    if (stacks(u, 'debilitated') > 0) addStatus(r, u, 'debilitated', -1);
    // (a Stun that landed during this turn waits for the next: DECISIONS #310)
    if (u.stunFresh) delete u.stunFresh;
    else if (stacks(u, 'stunned') > 0) addStatus(r, u, 'stunned', -1);
  }
  // Flex-style statuses wear off
  // (undone newest first, so a loss this turn on top of a gain this turn cannot leave a lasting gain: stacks never go below 0)
  for (const t of sd.temps.splice(0).reverse()) {
    const u = findUnit(r.s, t.unit);
    if (u && u.hp > 0) addStatus(r, u, t.status, -t.amount);
  }
  // Doom: a unit at or below its Doom at the end of its own turn is gone
  for (const u of [...sd.units]) {
    const doom = stacks(u, 'doom');
    if (doom > 0 && u.hp > 0 && u.hp <= doom) applyDamage(r, null, u, u.hp, 'direct');
  }
  reap(r);
}

function enemyPhase(r: Run): void {
  const sd = r.s.sides.b;
  r.s.active = 'b';
  r.s.turn++;
  r.ev.push({ type: 'turnStart', side: 'b', turn: r.s.turn });
  startOfTurn(r, 'b');
  if (r.s.winner) return;
  r.opening = true;
  fireSnare(r, 'a', { on: 'foeTurn' });
  r.opening = false;
  reap(r);
  const order = sd.units.map((u) => u.id);
  for (const id of order) {
    if (r.s.winner) return;
    const u = findUnit(r.s, id);
    if (u) actEnemy(r, u);
    reap(r);
  }
  if (r.s.winner) return;
  decay(r, 'b');
  if (r.s.winner) return;
  // units that just acted (or were stunned) pick their next move; summoned ones already chose theirs
  for (const u of sd.units) if (!u.intent) chooseIntent(r, u);
  r.ev.push({ type: 'turnEnd', side: 'b' });
}

function endTurn(r: Run): void {
  // (an "end your turn" met while the turn is already ending must not end the next one too)
  r.endAfter = false;
  const side = r.s.active;
  const sd = r.s.sides[side];
  // end-of-turn Powers, then every rune's passive, then Radiant fades
  fireTriggers(r, sd, 'turnEnd');
  if (r.s.winner) return;
  // a card that plays itself from the top of the draw pile as your turn ends (I Am Invincible)
  {
    const top = sd.draw[0];
    const h = heroOf(sd);
    if (top && h && r.db.cards[top.card]?.playFromTop) {
      sd.draw.shift();
      playFree(r, sd, h, top, 'normal');
      if (r.s.winner) return;
    }
  }
  // what was only for this turn ends with it (Rage)
  sd.powers = sd.powers.filter((p) => !p.temp);
  for (const rs of [...sd.runes]) {
    if (r.s.winner) return;
    if (sd.runes.includes(rs) && !runeDef(r, rs.rune).atStart) fireRune(r, sd, rs, 'passive');
  }
  if (r.s.winner) return;
  const hero = heroOf(sd);
  if (hero && stacks(hero, 'radiant') > 0) enterStance(r, hero, 'none');
  // (Burn: a card that hurts if it is still in your hand now)
  for (const c of [...sd.hand]) {
    const ops = r.db.cards[c.card]?.inHandAtEnd;
    if (!ops || !hero || r.s.winner) continue;
    runOps(r, mkAct(hero), ops);
  }
  if (r.s.winner) return;
  // hand: retained cards stay, ethereal ones exhaust, the rest go to the discard pile
  const keep: CardInst[] = [];
  const hand = sd.hand;
  sd.hand = [];
  const holdAll = !!hero && stacks(hero, 'holdfast') > 0;
  // (assassin) Honed knives Hold; a card drawn to Hold this turn does; what lasted only this turn ends
  const honedKnives = !!hero && stacks(hero, 'honed') > 0;
  for (const c of hand) {
    const cd = cardDef(r.db, c.card);
    const held =
      !!cd.retain ||
      !!c.retain ||
      c.held === true ||
      (honedKnives && cd.tags?.includes(EDGE_TAG) === true);
    delete c.held;
    delete c.freeTurn;
    if (c.sly === 'turn') delete c.sly;
    if (isEthereal(cd, c) && !held) exhaustCard(r, sd, c);
    else if (held || holdAll) keep.push(c);
    else {
      sd.discard.push(c);
      r.ev.push({ type: 'discard', side, card: c.id, def: c.card });
    }
  }
  sd.hand = [...keep, ...sd.hand];
  if (hero && holdAll) addStatus(r, hero, 'holdfast', -1);
  if (sd.mana > 0) r.ev.push({ type: 'mana', side, mana: 0 });
  sd.mana = 0;
  for (const u of [...sd.units]) {
    if (r.s.winner) return;
    if (u.kind === 'ally' && u.hp > 0) {
      actAlly(r, u);
      reap(r);
    }
  }
  if (r.s.winner) return;
  decay(r, side);
  if (r.s.winner) return;
  r.ev.push({ type: 'turnEnd', side });
  if (r.s.mode === 'pve') {
    enemyPhase(r);
    if (!r.s.winner) beginHeroTurn(r, 'a');
  } else {
    beginHeroTurn(r, other(side));
  }
}

// --- setup ---------------------------------------------------------------------------------------------------------

const blankSide = (id: Side): SideState => ({
  id,
  units: [],
  hand: [],
  draw: [],
  discard: [],
  exhausted: [],
  fallen: [],
  mana: 0,
  maxMana: 0,
  handSize: 0,
  snares: [],
  hero: null,
  boons: [],
  potions: [],
  stars: 0,
  nextMana: 0,
  nextDraw: 0,
  temps: [],
  runes: [],
  runeSlots: DEFAULT_RUNE_SLOTS,
  powers: [],
  played: 0,
  attacksPlayed: 0,
  skillsPlayed: 0,
  discarded: 0,
  drawn: 0,
  created: 0,
});

function buildHeroSide(r: Run, id: Side, h: HeroSetup): SideState {
  const hd = r.db.heroes[h.hero];
  if (!hd) throw new RulesError(`Unknown hero "${h.hero}"`);
  const sd: SideState = {
    ...blankSide(id),
    draw: h.deck.map((card) => {
      cardDef(r.db, card);
      return { id: newId(r.s, 'c'), card };
    }),
    maxMana: hd.mana,
    handSize: hd.handSize,
    hero: hd.id,
    // (the Monk's form, DECISIONS #419)
    ...(hd.trait?.forms ? { form: hd.trait.forms, formSteps: [], formDone: false } : {}),
    // (the Shaman's totem positions, DECISIONS #418)
    ...(hd.trait?.totems
      ? {
          totems: Array.from({ length: Math.min(TOTEM_SLOTS, hd.trait.totems) }, () => null),
          elementsTurn: [],
          boostsUsed: [],
        }
      : {}),
  };
  for (const id of h.potions ?? []) {
    if (!r.db.potions[id]) throw new RulesError(`Unknown potion "${id}"`);
    sd.potions.push(id);
  }
  for (const id of h.boons ?? []) {
    const b = r.db.boons[id];
    if (!b) throw new RulesError(`Unknown boon "${id}"`);
    sd.boons.push(id);
    sd.maxMana += b.mana ?? 0;
    sd.handSize += b.handSize ?? 0;
  }
  shuffle(r.s.rng, sd.draw);
  // innate cards are drawn first (the shuffle order is otherwise kept)
  const innate = sd.draw.filter((c) => cardDef(r.db, c.card).innate);
  if (innate.length) sd.draw = [...innate, ...sd.draw.filter((c) => !innate.includes(c))];
  const maxHp = Math.max(1, h.maxHp ?? hd.maxHp);
  const hp = Math.max(1, Math.min(maxHp, h.hp ?? maxHp));
  sd.units.push({
    id: newId(r.s, 'u'),
    def: hd.id,
    name: hd.name,
    kind: 'hero',
    side: id,
    hp,
    maxHp,
    barrier: 0,
    statuses: {},
    taunt: false,
    intent: null,
    moveCount: 0,
    pat: '',
    patCount: 0,
    lowPct: 100,
    dmgPct: Math.max(10, h.dmgPct ?? 100),
    lastMoves: [],
  });
  // statuses the setup starts the hero with (an Omen's Dread)
  const hero = sd.units[sd.units.length - 1] as Unit;
  for (const [st, n] of Object.entries(h.statuses ?? {}) as [StatusId, number][])
    if (n > 0) hero.statuses[st] = (hero.statuses[st] ?? 0) + n;
  r.s.sides[id] = sd;
  for (const s of hd.startUnits ?? []) {
    const u = spawn(r, sd, typeof s === 'string' ? s : s.unit, true);
    if (u && typeof s !== 'string') u.maxHp = u.hp = s.hp;
  }
  return sd;
}

export function createCombat(db: CombatDb, setup: CombatSetup): StepResult {
  const s: CombatState = {
    seed: setup.seed,
    rng: seedRng(setup.seed),
    mode: 'enemies' in setup.b ? 'pve' : 'pvp',
    tier: 'enemies' in setup.b ? Math.max(1, setup.b.tier ?? 1) : 1,
    enemyHpPct: 'enemies' in setup.b ? Math.max(10, setup.b.hpPct ?? 100) : 100,
    enemyDmgPct: 'enemies' in setup.b ? Math.max(10, setup.b.dmgPct ?? 100) : 100,
    turn: 0,
    active: 'a',
    sides: { a: blankSide('a'), b: blankSide('b') },
    winner: null,
    nextId: 1,
    pending: null,
  };
  const r: Run = { db, s, ev: [], depth: 0 };
  buildHeroSide(r, 'a', setup.a);
  if ('enemies' in setup.b) {
    const made: Unit[] = [];
    for (const e of setup.b.enemies) {
      const d = def(r, e);
      if (d.brain.kind !== 'enemy') throw new RulesError(`"${e}" cannot fight as an enemy`);
      const u = spawn(r, s.sides.b, e, true);
      if (!u) throw new RulesError('Too many enemies');
      made.push(u);
    }
    // what the setup changes about them (the campaign's Omens): starting statuses, phases to rise into
    for (const m of setup.b.mods ?? [])
      for (const u of m.units ? m.units.flatMap((i) => (made[i] ? [made[i]] : [])) : made) {
        for (const [st, n] of Object.entries(m.statuses ?? {}) as [StatusId, number][])
          if (n > 0) u.statuses[st] = (u.statuses[st] ?? 0) + n;
        if (m.rise?.length)
          u.rise = [...(u.rise ?? []), ...m.rise.filter((x) => x.atPct > 0 && x.atPct < 100)].sort(
            (x, y) => y.atPct - x.atPct,
          );
      }
  } else {
    buildHeroSide(r, 'b', setup.b);
  }
  reap(r);
  if (!s.winner) beginHeroTurn(r, 'a');
  return { state: s, events: r.ev };
}

// --- actions ---------------------------------------------------------------------------------------------------------

function legalFoes(r: Run, side: Side, cd: CardDef): Unit[] {
  const foes = r.s.sides[other(side)].units.filter((u) => u.hp > 0);
  const aimed = cd.effects.some((e) => e.op === 'damage' && e.to === 'target');
  const taunters = aimed ? foes.filter((u) => u.taunt) : [];
  return taunters.length ? taunters : foes;
}

/** What a card costs right now: its cost, any change to this copy, and free skills while Unbound. */
export function costOf(
  db: CombatDb,
  sd: Pick<SideState, 'units' | 'attacksPlayed'> & Partial<Pick<SideState, CostCounter>>,
  c: Pick<CardInst, 'card' | 'costMod'> & Partial<CardInst>,
): number {
  const cd = cardDef(db, c.card);
  const hero = sd.units.find((u) => u.kind === 'hero');
  if (cd.kind === 'skill' && hero && stacks(hero, 'unbound') > 0) return 0;
  if (cd.kind === 'attack' && hero && stacks(hero, 'freeattack') > 0) return 0;
  // (assassin) Bullet Time's free hand, Pounce's free Skill
  if (c.freeTurn) return 0;
  if (cd.kind === 'skill' && hero && stacks(hero, 'freeskill') > 0) return 0;
  // (the Shaman) Free Spell: the next elemental spell
  if (
    hero &&
    stacks(hero, 'freespell') > 0 &&
    (cd.tags?.some((t) => t === PRISM_TAG || (ELEMENTS as readonly string[]).includes(t)) ?? false)
  )
    return 0;
  // Free Play: the first cards you play each turn cost no Mana (Void Form)
  if (hero && stacks(hero, 'freeplay') > (sd.played ?? 0)) return 0;
  // (the Necrobinder copy) Veilpiercer: the next Fleeting card is free; Flatten: free once a companion has struck
  if (hero && stacks(hero, 'freeethereal') > 0 && isEthereal(cd, c)) return 0;
  if (cd.freeIf && sideCount(sd, cd.freeIf.by) >= cd.freeIf.atLeast) return 0;
  if (cd.kind === 'power' && hero && stacks(hero, 'freepower') > 0) return 0;
  return Math.max(
    0,
    cd.cost +
      (c.costMod ?? 0) +
      (c.costUp ?? 0) +
      (sd.costTax ?? 0) -
      (c.costDown ?? 0) -
      (cd.cheaperPerAttack ?? 0) * (sd.attacksPlayed ?? 0) -
      (cd.cheaperPerSkill ?? 0) * (sd.skillsPlayed ?? 0) -
      (cd.cheaperPer ? Math.floor(cd.cheaperPer.mult * sideCount(sd, cd.cheaperPer.by)) : 0),
  );
}

export function canPlay(r: { db: CombatDb; s: CombatState }, side: Side, c: CardInst): boolean {
  const cd = cardDef(r.db, c.card);
  const sd = r.s.sides[side];
  if (r.s.pending) return false;
  if (cd.unplayable || costOf(r.db, sd, c) > sd.mana || (cd.starCost ?? 0) > sd.stars) return false;
  if (cd.statusCost) {
    const hero = sd.units.find((u) => u.kind === 'hero');
    if (!hero || stacks(hero, cd.statusCost.status) < cd.statusCost.amount) return false;
  }
  if (cd.kind === 'snare' && sd.snares.length >= MAX_SNARES) return false;
  if (
    cd.needsExhausted &&
    sd.exhausted.filter((x) => r.db.cards[x.card]?.kind !== 'power').length < cd.needsExhausted
  )
    return false;
  if (cd.needsEmptyDraw && sd.draw.length > 0) return false;
  if (cd.target === 'foe' && legalFoes({ ...r, ev: [], depth: 0 }, side, cd).length === 0)
    return false;
  if (cd.target === 'ally' && !sd.units.some((u) => u.kind === 'ally' && u.hp > 0)) return false;
  return true;
}

/** Every way to answer a pending choice (capped so a "discard any number" prompt cannot explode). */
function pickOptions(p: NonNullable<CombatState['pending']>): string[][] {
  const out: string[][] = [];
  const cap = 80;
  const walk = (start: number, chosen: string[], size: number): void => {
    if (out.length >= cap) return;
    if (chosen.length === size) {
      out.push([...chosen]);
      return;
    }
    for (let i = start; i < p.pool.length; i++) {
      chosen.push(p.pool[i] as string);
      walk(i + 1, chosen, size);
      chosen.pop();
    }
  };
  for (let size = p.min; size <= p.max; size++) walk(0, [], size);
  return out;
}

/** How many companions a hero's side can have at once: the Riftwalker's own limit, or MAX_ALLIES (DECISIONS #315). */
export function allyCap(db: CombatDb, sd: SideState): number {
  return (sd.hero ? db.heroes[sd.hero]?.maxAllies : undefined) ?? MAX_ALLIES;
}

/** How many companion slots a unit takes: 1 Light (the default), 2 Heavy, 3 Colossal (DECISIONS #383). */
export function slotsOf(db: CombatDb, defId: string): number {
  return Math.max(1, Math.floor(db.units[defId]?.slots ?? 1));
}

/** The companion slots a hero's side has filled. */
export function slotsUsed(db: CombatDb, sd: SideState): number {
  return sd.units.reduce((n, u) => (u.kind === 'hero' ? n : n + slotsOf(db, u.def)), 0);
}

/** The slots a card's summons need (all of them must fit), at most the side's cap. */
function roomNeeded(db: CombatDb, sd: SideState, cd: CardDef): number {
  const need = cd.effects.reduce((n, o) => (o.op === 'summon' ? n + slotsOf(db, o.unit) : n), 0);
  return Math.min(need, allyCap(db, sd));
}

/** A card whose summons do not fit in the free companion slots: companions have to be released (scrapped) to make room. */
function needsRelease(db: CombatDb, sd: SideState, cd: CardDef): boolean {
  // (a card that summons nothing never asks, even on a side somehow over its cap)
  const need = roomNeeded(db, sd, cd);
  return sd.hero !== null && need > 0 && need > allyCap(db, sd) - slotsUsed(db, sd);
}

/** Every smallest set of companions whose release makes room for the card: no companion in a set could be kept. */
function releaseSets(db: CombatDb, sd: SideState, cd: CardDef): UnitId[][] {
  const crew = sd.units.filter((u) => u.kind === 'ally' && u.hp > 0);
  const short = roomNeeded(db, sd, cd) - (allyCap(db, sd) - slotsUsed(db, sd));
  const out: UnitId[][] = [];
  for (let mask = 1; mask < 1 << crew.length; mask++) {
    const set = crew.filter((_, i) => mask & (1 << i));
    const freed = set.reduce((n, u) => n + slotsOf(db, u.def), 0);
    if (freed < short) continue;
    if (set.some((u) => freed - slotsOf(db, u.def) >= short)) continue;
    out.push(set.map((u) => u.id));
  }
  return out;
}

/**
 * How many of a card's summons fit as the side stands, in the order the card makes them (a big one that does not fit leaves room for a
 * smaller one after it), and how many it makes (DECISIONS #405): what the player is told before playing it with no room.
 */
export function summonsThatFit(
  db: CombatDb,
  sd: SideState,
  cd: CardDef,
): { fit: number; total: number } {
  let free = allyCap(db, sd) - slotsUsed(db, sd);
  let fit = 0;
  let total = 0;
  for (const o of cd.effects) {
    if (o.op !== 'summon') continue;
    total++;
    const need = slotsOf(db, o.unit);
    if (need <= free) {
      fit++;
      free -= need;
    }
  }
  return { fit, total };
}

/** The companions an action releases, as a list. */
function releaseIds(action: Extract<Action, { type: 'play' }>): UnitId[] {
  const rel = action.release;
  return rel === undefined ? [] : Array.isArray(rel) ? rel : [rel];
}

export function legalActions(db: CombatDb, s: CombatState): Action[] {
  if (s.winner) return [];
  if (s.pending) return pickOptions(s.pending).map((cards): Action => ({ type: 'pick', cards }));
  const side = s.active;
  const sd = s.sides[side];
  const r: Run = { db, s, ev: [], depth: 0 };
  const out: Action[] = [];
  for (const c of sd.hand) {
    if (!canPlay(r, side, c)) continue;
    const cd = cardDef(db, c.card);
    const plays: Extract<Action, { type: 'play' }>[] = [];
    if (cd.target === 'none') plays.push({ type: 'play', card: c.id });
    else if (cd.target === 'foe')
      for (const t of legalFoes(r, side, cd))
        plays.push({ type: 'play', card: c.id, target: t.id });
    else
      for (const t of sd.units)
        if (t.hp > 0 && (cd.target === 'friend' || t.kind === 'ally'))
          plays.push({ type: 'play', card: c.id, target: t.id });
    if (needsRelease(db, sd, cd)) {
      // every way to play it, once for each smallest set of companions that could make room (one id when one is enough) ...
      const sets = releaseSets(db, sd, cd);
      for (const p of plays)
        for (const set of sets)
          out.push({ ...p, release: set.length === 1 ? (set[0] as UnitId) : set });
    }
    // ... and as it is, last: what fits is summoned, the rest is not (DECISIONS #405)
    out.push(...plays);
  }
  sd.potions.forEach((id, index) => {
    const p = db.potions[id];
    if (!p) return;
    if (p.target === 'none') {
      out.push({ type: 'potion', index, potion: id });
    } else {
      const pool = p.target === 'foe' ? s.sides[other(side)].units : sd.units;
      for (const t of pool)
        if (t.hp > 0) out.push({ type: 'potion', index, potion: id, target: t.id });
    }
  });
  out.push({ type: 'endTurn' });
  return out;
}

/** The card is done: it goes to its pile, the turn's counters tick, and "when you play" Powers fire. */
const unbound = (sd: SideState): boolean => {
  const h = heroOf(sd);
  return !!h && stacks(h, 'unbound') > 0;
};

function finishCard(
  r: Run,
  sd: SideState,
  inst: CardInst,
  cd: CardDef,
  target: Unit | null,
  paid?: number,
  free = false,
  aimed?: UnitId,
): void {
  if (cd.kind === 'power') {
    // a Power stays in effect for the fight and leaves the deck (without counting as "exhausted")
    sd.exhausted.push(inst);
    r.ev.push({ type: 'exhaust', side: sd.id, card: inst.id, def: inst.card });
  } else if (cd.exhaust || (cd.kind === 'skill' && unbound(sd))) exhaustCard(r, sd, inst);
  else if (cd.after === 'hand' && sd.hand.length < MAX_HAND) {
    // (Particle Wall: back to the hand, not the discard pile)
    sd.hand.push(inst);
    r.ev.push({ type: 'addCard', side: sd.id, card: inst.id, def: inst.card, to: 'hand' });
  } else if (cd.after === 'drawTop') putOnTop(r, sd, inst);
  else sd.discard.push(inst);
  // (assassin) Master Planner: a Skill you play keeps Sly for the rest of the fight
  const lead = heroOf(sd);
  if (cd.kind === 'skill' && lead && stacks(lead, 'planner') > 0) inst.sly = 'fight';
  sd.played++;
  if (cd.kind === 'attack') sd.attacksPlayed++;
  if (cd.kind === 'skill') sd.skillsPlayed++;
  bringBack(r, sd, cd);
  countPlayed(sd, cd, inst);
  const cost = paid ?? cd.cost + (inst.costUp ?? 0);
  // (the Monk) a technique played from hand is a step of his form's objective, before the Auras answer the play
  if (!free) techniqueStep(r, sd, cd, target, aimed);
  // (the Shaman) the spell's element lights, and Trinity may trigger
  if (sd.totems) castElement(r, sd, cd);
  fireTriggers(r, sd, 'play', { card: cd, target, inst, cost });
  payFullTrick(r, sd);
  recallOnCost(r, sd, cost, inst.id);
}

/** (the Necrobinder copy) what a played card adds to the turn's and fight's counters: Fetch's "first time", Fleeting cards played */
function countPlayed(sd: SideState, cd: CardDef, inst: CardInst): void {
  (sd.playedTurn ??= []).push(cd.id.replace(/\+$/, ''));
  if (isEthereal(cd, inst)) sd.etherealPlayed = (sd.etherealPlayed ?? 0) + 1;
}

/** (the Necrobinder copy) Right Hand Hand: cards that come back from the discard pile when a card of at least their cost is played */
function recallOnCost(r: Run, sd: SideState, cost: number, played: string): void {
  for (const c of [...sd.discard]) {
    // (the card just played never calls itself back)
    if (c.id === played) continue;
    const d = r.db.cards[c.card];
    if (!d?.recallOnCost || cost < d.recallOnCost || sd.hand.length >= MAX_HAND) continue;
    sd.discard = sd.discard.filter((x) => x.id !== c.id);
    sd.hand.push(c);
    r.ev.push({ type: 'draw', side: sd.id, card: c.id, def: c.card });
  }
}

function playCard(r: Run, action: Extract<Action, { type: 'play' }>): void {
  const side = r.s.active;
  const sd = r.s.sides[side];
  const i = sd.hand.findIndex((c) => c.id === action.card);
  const inst = sd.hand[i];
  if (!inst) throw new RulesError('That card is not in your hand');
  if (!canPlay(r, side, inst)) throw new RulesError('You cannot play that card now');
  const cd = cardDef(r.db, inst.card);
  let target: Unit | null = null;
  if (cd.target !== 'none') {
    target = findUnit(r.s, action.target) ?? null;
    const legal =
      target !== null &&
      target.hp > 0 &&
      (cd.target === 'foe'
        ? legalFoes(r, side, cd).some((u) => u.id === target?.id)
        : target.side === side && (cd.target === 'friend' || target.kind === 'ally'));
    if (!legal) throw new RulesError('Choose a legal target');
  }
  const hero = heroOf(sd);
  if (!hero) throw new RulesError('No hero to play cards');
  let scrapped = 0;
  // (with no room and no companion named, the card is played as it is: what fits is summoned, DECISIONS #405)
  if (needsRelease(r.db, sd, cd) && releaseIds(action).length > 0) {
    const ids = [...new Set(releaseIds(action))];
    const want = [...ids].sort().join(',');
    const ok = releaseSets(r.db, sd, cd).some((set) => [...set].sort().join(',') === want);
    if (!ok) throw new RulesError('Choose the companions to release to make room');
    // they simply leave (are scrapped), before the card is paid for: a release is not a death, so nothing that waits for an
    // ally to die (Revive, Doom payoffs) fires and none can be brought back; "dies or is scrapped" Auras hear of it (#383)
    let might = 0;
    let vigor = 0;
    let hp = 0;
    for (const id of ids) {
      const out = findUnit(r.s, id);
      if (!out) continue;
      might += Math.max(0, stacks(out, 'might'));
      vigor += Math.max(0, stacks(out, 'vigor'));
      hp += Math.max(0, out.hp);
      sd.units = sd.units.filter((u) => u.id !== out.id);
      r.ev.push({ type: 'died', unit: out.id, released: true });
    }
    // Salvage: the companion this card builds takes what they leave behind
    if (traitOf(r, side)?.salvage) r.salvage = { inst: inst.id, might, vigor, hp };
    scrapped = ids.length;
  }
  sd.hand.splice(i, 1);
  // ("dies or is scrapped" Auras hear of the scrapping once the card has left the hand: a draw can't move it)
  for (let k = 0; k < scrapped; k++) fireTriggers(r, sd, 'allyLost');
  // a one-shot free card (Free Attack, Free Skill, a free Fleeting card, a free Aura) is spent only when it is what makes the card
  // free: a card that costs nothing anyway (Unbound, Free Play, a discount, a cost of 0) leaves it for the next one
  const makesFree = (st: StatusId, fits: boolean): boolean => {
    const held = stacks(hero, st);
    if (!fits || held <= 0) return false;
    delete hero.statuses[st];
    const without = costOf(r.db, sd, inst);
    hero.statuses[st] = held;
    return without > 0;
  };
  const freeAttack = makesFree('freeattack', cd.kind === 'attack');
  const freeSkill = makesFree('freeskill', cd.kind === 'skill');
  const freeEthereal = !freeAttack && !freeSkill && makesFree('freeethereal', isEthereal(cd, inst));
  const freePower = makesFree('freepower', cd.kind === 'power');
  const freeSpell =
    !freeAttack &&
    !freeSkill &&
    makesFree(
      'freespell',
      cd.tags?.some((t) => t === PRISM_TAG || (ELEMENTS as readonly string[]).includes(t)) ?? false,
    );
  const paid = costOf(r.db, sd, inst);
  sd.mana -= paid;
  sd.spentTurn = (sd.spentTurn ?? 0) + paid + (cd.x ? sd.mana : 0);
  if (freeAttack) addStatus(r, hero, 'freeattack', -1);
  if (freeSkill) addStatus(r, hero, 'freeskill', -1);
  if (freeEthereal) addStatus(r, hero, 'freeethereal', -1);
  if (freePower) addStatus(r, hero, 'freepower', -1);
  if (freeSpell) addStatus(r, hero, 'freespell', -1);
  // a discount (Cheapen, a free Discover) is spent on the play: a card made free for good would loop for ever
  delete inst.costMod;
  clearTurnFlags(inst);
  let x = 0;
  const xMana = cd.x ? sd.mana : 0;
  if (cd.x) {
    x = sd.mana + (cd.xBonus ?? 0);
    sd.mana = 0;
  }
  orbitPay(r, sd, hero, paid + xMana);
  let starsSpent = cd.starCost ?? 0;
  if (cd.starCost) {
    sd.stars -= cd.starCost;
    r.ev.push({ type: 'stars', side, stars: sd.stars });
  }
  // an Arcana X card spends all of it
  if (cd.starX) {
    starsSpent = sd.stars;
    x = sd.stars + (cd.xBonus ?? 0);
    sd.stars = 0;
    r.ev.push({ type: 'stars', side, stars: 0 });
  }
  if (cd.statusCost && cd.statusCost.amount > 0)
    addStatus(r, hero, cd.statusCost.status, -cd.statusCost.amount);
  r.ev.push({ type: 'play', side, card: inst.id, def: inst.card, target: target?.id ?? null });
  r.ev.push({ type: 'mana', side, mana: sd.mana });
  // (assassin) Strangle: every card played costs the strangled enemies HP
  strangle(r, sd);
  if (r.s.winner) {
    sd.discard.push(inst);
    return;
  }
  showSuit(r, sd, cd);
  if (r.s.winner) {
    sd.discard.push(inst);
    return;
  }
  // (the Auras that answer Arcana being spent go off once the card is paid for)
  if (starsSpent > 0) fireTriggers(r, sd, 'arcana', { spent: starsSpent });
  if (cd.kind === 'snare') {
    sd.snares.push({ id: inst.id, card: inst.card });
    r.ev.push({ type: 'snareSet', side, snare: inst.id });
    sd.played++;
    fireTriggers(r, sd, 'play', { card: cd, target: null });
    payFullTrick(r, sd);
    return;
  }
  // Reverb attacks and Mirrored skills happen twice (the second time without asking for choices). Whether this card is
  // doubled is decided before it runs, so a card that gives the status does not spend it on itself.
  const again =
    (cd.kind === 'attack' && stacks(hero, 'twinned') > 0 && 'twinned') ||
    (cd.kind === 'skill' && stacks(hero, 'mirrored') > 0 && 'mirrored') ||
    // (Signal Boost: the next Aura; Echo Form: the first card of each turn, which spends nothing)
    (cd.kind === 'power' && stacks(hero, 'boosted') > 0 && 'boosted') ||
    (sd.played < stacks(hero, 'echoing') && 'echo') ||
    null;
  // (the Shaman) the totems' boost for the first spell of its element this turn
  const boost = sd.totems ? spellBoost(r, sd, cd) : 0;
  runOps(r, mkAct(hero, { target, card: cd, inst, x, pick: true, plus: boost }), cd.effects);
  if (r.s.pending) {
    if (boost) r.s.pending.plus = boost;
    r.s.pending.finish = inst;
    r.s.pending.again = again;
    r.s.pending.paid = cd.x ? x : paid;
    return;
  }
  if (again && !r.s.winner) {
    if (again !== 'echo') addStatus(r, hero, again, -1);
    runOps(r, mkAct(hero, { target, card: cd, inst, x }), cd.effects);
  }
  extraPlays(r, hero, cd, inst, target, x);
  const asked = r.s.pending as CombatState['pending'];
  if (asked) {
    asked.finish = inst;
    asked.paid = cd.x ? x : paid;
    return;
  }
  finishCard(r, sd, inst, cd, target, cd.x ? x : paid);
}

/** The plays a card gets on top of its own, without asking for choices: Blade Echo (the blade once more per stack) and Replay
 * (Transfigure: that many more times). They run once the card's own play, and any choice it asked for, are done. */
function extraPlays(
  r: Run,
  hero: Unit,
  cd: CardDef,
  inst: CardInst,
  target: Unit | null,
  x: number,
): void {
  if (cd.kind === 'attack' && cd.tags?.includes(BLADE_TAG))
    for (let k = 0; k < stacks(hero, 'bladeecho') && !r.s.winner && !r.s.pending; k++)
      runOps(r, mkAct(hero, { target, card: cd, inst, x }), cd.effects);
  for (let k = 0; k < (inst.replay ?? 0) && !r.s.winner && !r.s.pending; k++)
    runOps(r, mkAct(hero, { target, card: cd, inst, x }), cd.effects);
}

/** The answer to a pending choice: carry it out, then let the card finish. */
function pickCards(r: Run, action: Extract<Action, { type: 'pick' }>): void {
  const p = r.s.pending;
  if (!p) throw new RulesError('There is nothing to choose');
  const side = r.s.active;
  const sd = r.s.sides[side];
  const ids = action.cards;
  if (
    new Set(ids).size !== ids.length ||
    ids.length < p.min ||
    ids.length > p.max ||
    !ids.every((id) => p.pool.includes(id))
  )
    throw new RulesError('That is not a legal choice');
  r.s.pending = null;
  const picked: CardInst[] = [];
  // (assassin) Nightmare: the chosen card stays in your hand, and its copies come next turn
  if (p.kind === 'copy')
    for (const id of ids) {
      const c = sd.hand.find((x) => x.id === id);
      if (c) (sd.nextCopies ??= []).push({ card: c.card, times: p.times ?? 1 });
    }
  for (const id of p.kind === 'copy' ? [] : ids) {
    const pile = p.kind === 'scry' || p.from === 'draw' ? sd.draw : sd.hand;
    const k = pile.findIndex((c) => c.id === id);
    const [c] = k >= 0 ? pile.splice(k, 1) : [];
    if (c) picked.push(c);
  }
  if (p.kind === 'scry') {
    // Foresee: the chosen card is drawn, and the others that were looked at are discarded
    const left: CardInst[] = [];
    for (const id of p.pool) {
      if (ids.includes(id)) continue;
      const k = sd.draw.findIndex((c) => c.id === id);
      const [c] = k >= 0 ? sd.draw.splice(k, 1) : [];
      if (c) left.push(c);
    }
    r.ev.push({ type: 'scry', side, cards: left.map((c) => c.id) });
    for (const c of left) moveFromHand(r, sd, c, 'discard', false);
    for (const c of picked) {
      if (sd.hand.length >= MAX_HAND) {
        sd.discard.push(c);
        r.ev.push({ type: 'burn', side, card: c.id, def: c.card });
      } else {
        sd.hand.push(c);
        r.ev.push({ type: 'draw', side, card: c.id, def: c.card });
        sd.drawn++;
        sd.drawnTurn = (sd.drawnTurn ?? 0) + 1;
        fireTriggers(r, sd, 'draw');
      }
    }
  } else if (p.kind === 'topdeck') for (const c of picked) putOnTop(r, sd, c);
  else if (p.kind === 'transform')
    for (const c of picked) {
      sd.hand.push(c);
      transformCard(r, sd, c, p.into ?? c.card);
    }
  else if (p.kind === 'discard' || p.kind === 'exhaust')
    for (const c of picked) moveFromHand(r, sd, c, p.kind);
  const hero = findUnit(r.s, p.actor);
  const fin = p.finish;
  const cd = fin ? cardDef(r.db, fin.card) : null;
  if (hero && !r.s.winner) {
    // (what the card had discharged before the choice still waits for its attack)
    const act = mkAct(hero, {
      target: findUnit(r.s, p.target) ?? null,
      card: cd,
      inst: fin,
      x: p.x,
      pick: true,
      ember: p.ember ?? 0,
      glass: p.glass ?? 0,
      discharged: p.discharged ?? 0,
      plus: p.plus ?? 0,
    });
    // (the Spellblade's choices: which enchantment the new one replaces, which to discharge, what the newest becomes)
    const list = sd.enchants ?? [];
    const at = Number((ids[0] ?? '').replace(/^e/, ''));
    if (p.kind === 'enchant' && p.charge && list[at]) {
      list.splice(at, 1);
      list.push(p.charge);
      showEnchants(r, sd);
      fireTriggers(r, sd, 'imbue');
    } else if (p.kind === 'discharge') spendCharges(r, act, sd, [at]);
    else if (p.kind === 'recast' && list.length) {
      list[list.length - 1] = ids[0] as Enchant;
      showEnchants(r, sd);
    }
    // (the Shaman's: which spirit to plant, and where)
    else if (p.kind === 'plantKind' && ids[0]) plant(r, act, sd, ids[0], p.anywhere === true);
    // (the Shaman's: the totem whose spirit acts)
    else if (p.kind === 'commandPick' && ids[0] && heroOf(sd))
      commandAt(r, sd, heroOf(sd) as Unit, Number(ids[0].replace(/^t/, '')), p.times ?? 1);
    // (the Monk's: a new form, or none to keep his)
    else if (p.kind === 'form' && ids[0]) changeForm(r, sd, ids[0] as Form);
    else if (p.kind === 'plantAt' && p.spirit && ids[0])
      placeTotem(r, act, sd, Number(ids[0].replace(/^t/, '')), p.spirit);
    const asked = r.s.pending as CombatState['pending'];
    // (a choice that asked for another one: the rest of the card waits for it too)
    if (asked) asked.rest = [...asked.rest, ...p.rest];
    else runOps(r, act, p.rest);
  }
  // the rest of the card may have asked for another choice
  const more = r.s.pending as CombatState['pending'];
  if (more) {
    if (p.plus) more.plus = p.plus;
    more.finish = fin;
    more.again = p.again ?? null;
    if (p.paid !== undefined) more.paid = p.paid;
    return;
  }
  if (p.again && hero && cd && !r.s.winner) {
    if (p.again !== 'echo') addStatus(r, hero, p.again, -1);
    runOps(
      r,
      mkAct(hero, { target: findUnit(r.s, p.target) ?? null, card: cd, inst: fin, x: p.x }),
      cd.effects,
    );
  }
  if (fin && cd && hero && !r.s.winner)
    extraPlays(r, hero, cd, fin, findUnit(r.s, p.target) ?? null, p.x);
  // (an extra play cannot ask: it never sets a choice, so the card always finishes here)
  if (fin && cd)
    finishCard(
      r,
      sd,
      fin,
      cd,
      findUnit(r.s, p.target) ?? null,
      p.paid,
      false,
      p.target ?? undefined,
    );
}

function usePotion(r: Run, action: Extract<Action, { type: 'potion' }>): void {
  const side = r.s.active;
  const sd = r.s.sides[side];
  const index = action.potion !== undefined ? sd.potions.indexOf(action.potion) : action.index;
  const id = sd.potions[index];
  const p = id ? r.db.potions[id] : undefined;
  if (!id || !p) throw new RulesError('You have no such potion');
  const hero = heroOf(sd);
  if (!hero) throw new RulesError('No hero to use a potion');
  let target: Unit | null = null;
  if (p.target !== 'none') {
    target = findUnit(r.s, action.target) ?? null;
    const ok =
      target !== null &&
      target.hp > 0 &&
      (p.target === 'foe' ? target.side !== side : target.side === side);
    if (!ok) throw new RulesError('Choose a legal target');
  }
  sd.potions.splice(index, 1);
  r.ev.push({ type: 'potion', side, index, potion: id, target: target?.id ?? null });
  runOps(r, mkAct(hero, { target }), p.effects);
}

export function applyAction(db: CombatDb, state: CombatState, action: Action): StepResult {
  if (state.winner) throw new RulesError('The fight is over');
  if (state.pending && action.type !== 'pick') throw new RulesError('Make your choice first');
  const s = clone(state);
  const r: Run = { db, s, ev: [], depth: 0 };
  if (action.type === 'endTurn') endTurn(r);
  else if (action.type === 'play') playCard(r, action);
  else if (action.type === 'pick') pickCards(r, action);
  else if (action.type === 'potion') usePotion(r, action);
  else throw new RulesError('Unknown action');
  // a card said "end your turn" (Void Form): once it is done, the turn ends
  if (r.endAfter && !s.pending && !s.winner) {
    r.endAfter = false;
    endTurn(r);
    r.endAfter = false;
  }
  return { state: s, events: r.ev };
}

/** What one damage effect of a card would deal right now: the lowest and highest over the units it could hit, and its printed amount. */
export interface LiveDamage {
  lo: number;
  hi: number;
  /** the number printed on the card for this effect */
  printed: number;
  /** the printed amount is a formula (per Barrier, per card...): the live number is shown beside it rather than in its place */
  calc: boolean;
  /** (the Knight) the live number already counts a Riposte bonus, against an Open target */
  riposte?: boolean;
  /** (the Spellblade) a discharged Ember's damage on the first hit only, of an attack that hits more than once (lo-hi: by the choice) */
  first?: { lo: number; hi: number };
}

/**
 * The damage a card in the active side's hand would deal right now, for showing on the card (as Slay the Spire does): Might, stances,
 * Faltering, Sharpen, Edge and Vigor counted, and the target's Exposed and Wrath too when a target is given. With no target, a card
 * that picks one, or one that hits every enemy, gives the range over the enemies it could hit. Keyed by the effect's index in the
 * card's effects (top-level damage effects that hit enemies only). Reads the state and never changes it.
 */
export function previewCardDamage(
  db: CombatDb,
  s: CombatState,
  instId: string,
  targetId: string | null = null,
): Map<number, LiveDamage> {
  const out = new Map<number, LiveDamage>();
  const sd = s.sides[s.active];
  const inst = sd.hand.find((c) => c.id === instId);
  const def = inst ? db.cards[inst.card] : undefined;
  const hero = heroOf(sd);
  if (!inst || !def || !hero) return out;
  // as the effects will see it: the card has left the hand and its cost is paid (a card that counts your hand or your Mana)
  const paid = def.x ? sd.mana : Math.min(sd.mana, costOf(db, sd, inst));
  const after: CombatState = {
    ...s,
    sides: {
      ...s.sides,
      [sd.id]: { ...sd, hand: sd.hand.filter((c) => c.id !== instId), mana: sd.mana - paid },
    },
  };
  const r: Run = { db, s: after, ev: [], depth: 0 };
  const foes = s.sides[other(sd.id)].units.filter((u) => u.hp > 0);
  const taunters = foes.filter((u) => u.taunt);
  const chosen = targetId ? (foes.find((u) => u.id === targetId) ?? null) : null;
  // a card aimed at your own unit (Reactor Meltdown reads the ally's HP) previews with that unit as its target
  const friendly = def.target === 'ally' || def.target === 'friend';
  const mine =
    friendly && targetId ? (sd.units.find((u) => u.id === targetId && u.hp > 0) ?? null) : null;
  const a = mkAct(hero, {
    card: def,
    inst,
    target: friendly ? mine : chosen,
    x: def.x ? sd.mana + (def.xBonus ?? 0) : 0,
  });
  // (the Shaman's totems: their help on the first spell of its element this turn, DECISIONS #420)
  const help = sd.totems ? spellBoost(r, sd, def, false) : 0;
  const edge = (def.tags?.includes(EDGE_TAG) ? stacks(hero, 'edge') : 0) + deftOf(a) + help;
  // (Vigor goes into the first damage effect only, as the engine spends it)
  let vigor = def.kind === 'attack' ? stacks(hero, 'vigor') : 0;
  let earlier = false;
  // (the Assassin: a Preparation spend or a knife pull before the damage is worked out as the engine will do it, DECISIONS #416)
  let pull = 0;
  let riposted = false;
  // (the Spellblade: what a discharge before the attack adds to its first hit, at the least and at the most the choice allows)
  let emberLo = 0;
  let emberHi = 0;
  def.effects.forEach((op, i) => {
    if (op.op === 'discharge' && !earlier) {
      const list = sd.enchants ?? [];
      const twin = stacks(hero, 'twinedge') > 0 ? 2 : 1;
      const worth = (at: number[]): number =>
        at.reduce(
          (n, k, j) => n + (list[k] === 'ember' ? EMBER_DAMAGE * (j === 0 ? twin : 1) : 0),
          0,
        );
      if (op.count >= 2 || list.length <= 1) emberLo = emberHi = worth(list.map((_, k) => k));
      else if (list[0] === list[1]) emberLo = emberHi = worth([0]);
      else {
        emberLo = Math.min(worth([0]), worth([1]));
        emberHi = Math.max(worth([0]), worth([1]));
      }
      // ("per enchantment discharged" reads what this discharge will spend)
      a.discharged = op.count >= 2 ? list.length : Math.min(1, list.length);
      return;
    }
    if (op.op === 'spend' && !earlier) {
      a.spentBy[op.status] = Math.min(stacks(hero, op.status), Math.max(0, op.amount));
      return;
    }
    if (op.op === 'extract' && (op.to ?? 'target') === 'target' && !op.ops?.length && !earlier) {
      pull = Math.max(0, op.amount);
      return;
    }
    if (op.op !== 'damage') {
      // an effect before the damage (Barrier gained, cards consumed, Exposed applied...) can change it: no guess, the printed text
      earlier = true;
      return;
    }
    if (earlier) return;
    // (no ally picked yet: a number that reads it is not known, so the printed text stays)
    if (friendly && !mine && op.scale?.of === 'target') return;
    const pool =
      op.to === 'target'
        ? chosen
          ? [chosen]
          : taunters.length
            ? taunters
            : foes
        : op.to === 'front'
          ? foes.slice(0, 1)
          : op.to === 'allFoes' || op.to === 'randomFoe' || op.to === 'weakestFoe'
            ? foes
            : null;
    if (!pool) return;
    const hitsAll = op.to === 'allFoes';
    const lone = op.lonePct && (hitsAll ? foes.length === 1 : true) ? 1 + op.lonePct / 100 : 1;
    const v = vigor;
    vigor = 0;
    // (an Ember lands on the first hit: in the number of a one-hit attack, beside it for a many-hit one)
    const many = (op.hits ?? 1) > 1 || op.scale?.into === 'hits' || hitsAll;
    const [eLo, eHi] = many ? [0, 0] : [emberLo, emberHi];
    const firstBonus = many && emberHi > 0 ? { lo: emberLo, hi: emberHi } : null;
    emberLo = emberHi = 0;
    const one = (t: Unit | null, ember = 0): number => {
      // (with no target chosen yet, a card that reads "the target's Bleed" reads each enemy's in turn)
      const at = { ...a, target: op.to === 'target' && !chosen ? t : a.target };
      // (the knives a pull before this takes from the card's target)
      const from = at.target;
      at.extracted = pull && from ? Math.min(stacks(from, 'knives'), pull) : 0;
      // (Riposte: an Open target takes the bonus on every hit, as the engine spends it)
      const rip =
        op.riposte && op.to === 'target' && t && stacks(t, 'opening') > 0 ? op.riposte : 0;
      if (rip && chosen) riposted = true;
      const n = modifiedDamage(
        Math.round((amountOf(r, at, op.amount, op.scale, t) + edge + v + rip + ember) * lone),
        hero,
        t,
        def.kind === 'attack',
      );
      // Ghostly lets 1 through, Shielded none
      // (a pull before the attack hits first, so its own damage takes the Shield off: Knife Work's)
      if (t && stacks(t, 'shielded') > 0 && !(at.extracted > 0)) return 0;
      return t && stacks(t, 'ghostly') > 0 && n > 1 ? 1 : n;
    };
    const targets = pool.length ? pool : [null];
    const vals = [...targets.map((t) => one(t, eLo)), ...targets.map((t) => one(t, eHi))];
    out.set(i, {
      lo: Math.min(...vals),
      hi: Math.max(...vals),
      ...(firstBonus ? { first: firstBonus } : {}),
      printed: op.amount,
      // (Sharpen is not a formula to the player: the sharpened total simply replaces the printed number)
      calc: !!op.scale && op.scale.into !== 'hits' && op.scale.by !== 'bonus',
      ...(riposted ? { riposte: true } : {}),
    });
    riposted = false;
  });
  return out;
}
