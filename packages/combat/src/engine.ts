// Combat v2 engine: pure, deterministic, synchronous. State in, state + events out (docs/08_COMBAT_V2.md).
// Randomness only through the seeded PRNG held in the state. The caller never mutates the state it passes in.

import { nextInt, seedRng, shuffle } from './rng';
import {
  CALM_EXIT_MANA,
  DEBUFFS,
  EDGE_TAG,
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
  RADIANT_ENTER_MANA,
  RulesError,
  STANCES,
  other,
  scaledEnemyHp,
  tierMight,
  clone,
  type Action,
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
    if (cur === 'calm' && !sd.calmPaid) {
      sd.calmPaid = true;
      gainMana(r, sd, CALM_EXIT_MANA);
    }
  }
  if (to !== 'none') {
    u.statuses[to] = 1;
    r.ev.push({ type: 'status', target: u.id, status: to, amount: 1, total: 1 });
    if (to === 'radiant') gainMana(r, sd, RADIANT_ENTER_MANA);
  }
  r.ev.push({ type: 'stance', unit: u.id, stance: to });
  if (to !== 'none' && u.kind === 'hero') fireTriggers(r, sd, 'stance', { stance: to });
}

function gainMana(r: Run, sd: SideState, n: number): void {
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
 * (Radiant triples, Wrath doubles what you deal; Wrath makes you take 50% more)
 */
export function modifiedDamage(base: number, attacker: Unit | null, target: Unit | null): number {
  let n = base + (attacker ? stacks(attacker, 'might') : 0);
  if (attacker && stacks(attacker, 'clutch') > 0)
    n = Math.floor((n * (100 + stacks(attacker, 'clutch'))) / 100);
  // (Stunned counts as Faltering, Exposed and Brittle at once, never on top of them: DECISIONS #310)
  if (attacker && (stacks(attacker, 'faltering') > 0 || stacks(attacker, 'stunned') > 0))
    n = Math.floor(n * 0.75);
  if (attacker && stacks(attacker, 'radiant') > 0) n *= 3;
  else if (attacker && stacks(attacker, 'wrath') > 0) n *= 2;
  if (target && stacks(target, 'wrath') > 0) n = Math.floor(n * 1.5);
  if (target && (stacks(target, 'exposed') > 0 || stacks(target, 'stunned') > 0))
    n = Math.floor(n * 1.5);
  if (attacker && attacker.dmgPct !== 100 && n > 0)
    n = Math.max(1, Math.floor((n * attacker.dmgPct) / 100));
  return Math.max(0, n);
}

/** The innate trait of the hero on `side` (none for a side of enemies). */
function traitOf(r: Run, side: Side): HeroTrait | undefined {
  const sd = r.s.sides[side];
  return sd.hero ? r.db.heroes[sd.hero]?.trait : undefined;
}

/** An innate trait that depends on HP (Clutch Genes): switch the hero's `clutch` status on or off as their HP crosses the line. */
function syncClutch(r: Run, sd: SideState): void {
  const c = sd.hero ? r.db.heroes[sd.hero]?.trait?.clutch : undefined;
  const hero = heroOf(sd);
  if (!c || !hero || hero.hp <= 0) return;
  const on = hero.hp * 100 <= hero.maxHp * c.below;
  const cur = stacks(hero, 'clutch');
  if (on && cur !== c.damagePct) addStatus(r, hero, 'clutch', c.damagePct - cur);
  else if (!on && cur > 0) addStatus(r, hero, 'clutch', -cur);
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
    syncClutch(r, r.s.sides[t.side]);
    fireSnare(r, t.side, { on: 'hpLost', lost, attacker: source, hit: null });
  }
  if (rises && rise) riseUp(r, t, rise);
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

/** One attack hit from `a.actor` on `t`: Traps may spring first and may cancel it. */
/** One hit of an attack. Returns the HP it took off (for Lifesteal). */
function attackHit(r: Run, a: Act, t: Unit, base: number, single = false): number {
  if (t.hp <= 0) return 0;
  if (t.side !== a.actor.side) {
    const hit = { prevented: false };
    fireSnare(r, t.side, { on: 'attacked', victim: t, attacker: a.actor, hit });
    if (r.s.winner || t.hp <= 0 || a.actor.hp <= 0) return 0;
    if (hit.prevented) {
      r.ev.push({ type: 'prevented', unit: a.actor.id });
      return 0;
    }
  }
  const amount = modifiedDamage(base, a.actor, t);
  const room = t.hp + t.barrier;
  const capped = stacks(t, 'ghostly') > 0 || stacks(t, 'shielded') > 0;
  const lostHere = applyDamage(r, a.actor, t, amount, 'attack');
  let lost = lostHere;
  // (a companion killed by an attack remembers by whom: Den Mother strikes back at it)
  if (t.kind === 'ally' && t.hp <= 0 && t.side !== a.actor.side) t.killedBy = a.actor.id;
  // Overflow: a single-target attack that kills a companion carries part of what is left through to its hero (DECISIONS #321)
  if (single && t.kind === 'ally' && t.hp <= 0 && !capped && amount > room) {
    const hero = heroOf(r.s.sides[t.side]);
    const carried = Math.floor(((amount - room) * OVERFLOW_PCT) / 100);
    if (hero && hero.hp > 0 && carried > 0)
      lost += applyDamage(r, a.actor, hero, carried, 'attack', true);
  }
  // Armored wears thin each time an attack gets through
  if (lost > 0 && stacks(t, 'armored') > 0) addStatus(r, t, 'armored', -1);
  // Thorns answer an attack: an Attack card, or a unit's own move (an enemy's, a companion's, which takes the Thorns itself). A Trap,
  // an Aura, a totem, a potion or a Skill that deals damage is no attack, so its owner is never hurt by them.
  const attacked = a.card ? a.card.kind === 'attack' : a.actor.kind !== 'hero';
  const thorns = stacks(t, 'thorns');
  if (attacked && thorns > 0 && a.actor.hp > 0 && t.side !== a.actor.side)
    applyDamage(r, t, a.actor, thorns, 'direct');
  return lost;
}

/** Heal a unit by up to `n` (never past its max HP). A hero's side hears of the whole heal, even what full HP wasted. */
function healUnit(r: Run, t: Unit, n: number): void {
  if (n <= 0 || t.hp <= 0) return;
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
      if (a.attacker && a.attacker.hp > 0) return [a.attacker];
      return foes.length ? [foes[0] as Unit] : [];
  }
}

/** The value of a metric for `a` (`t` is the unit an op is being applied to, for metrics "of the target"). */
function metricValue(r: Run, a: Act, m: Metric, of: Scale['of'], t: Unit | null): number {
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
    case 'exposed':
    case 'might':
    case 'thorns':
    case 'mantra':
    case 'devotion':
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
    case 'drawn':
      return sd.drawn;
    case 'created':
      return sd.created;
    case 'discarded':
      return sd.discarded;
    case 'x':
      return a.x;
    case 'charge':
      return a.charge;
    case 'healed':
      return a.healed;
    case 'bonus':
      return a.inst?.bonus ?? 0;
  }
}

/** `amount` plus whatever its scale adds (never below 0 for amounts that cannot be negative). */
function amountOf(r: Run, a: Act, base: number, sc: Scale | undefined, t: Unit | null): number {
  if (!sc || sc.into === 'hits') return base;
  // (a tiny allowance, so a factor like 1/11 times 55 is 5 and not 4.999...)
  return base + Math.floor((sc.mult ?? 1) * metricValue(r, a, sc.by, sc.of, t) + 1e-9);
}

/** Rune effects get +1 damage / Barrier per Resonance. */
const resonanceOf = (a: Act): number => (a.rune ? stacks(a.actor, 'resonance') : 0);

function runOps(r: Run, a: Act, ops: readonly Op[]): void {
  for (let i = 0; i < ops.length; i++) {
    if (r.s.winner) return;
    if (a.actor.hp <= 0 && a.actor.kind !== 'hero') return;
    execOp(r, a, ops[i] as Op);
    reap(r);
    if (r.s.pending) {
      // a choice was asked for: the rest of this card waits for the answer
      r.s.pending.rest = ops.slice(i + 1);
      return;
    }
  }
}

function execOp(r: Run, a: Act, op: Op): void {
  const side = r.s.sides[a.actor.side];
  switch (op.op) {
    case 'damage': {
      let hits = op.hits ?? 1;
      if (op.scale?.into === 'hits')
        hits += Math.floor(
          (op.scale.mult ?? 1) * metricValue(r, a, op.scale.by, op.scale.of, a.target),
        );
      const edge = a.card?.tags?.includes(EDGE_TAG) ? stacks(a.actor, 'edge') : 0;
      // (a hero's Vigor goes into its next attack card; an enemy's into its next attacking move)
      const vigor = (a.card ? a.card.kind === 'attack' : a.actor.kind === 'enemy')
        ? stacks(a.actor, 'vigor')
        : 0;
      let took = 0;
      for (let i = 0; i < hits; i++) {
        // (a hit that wins the fight still pays its Lifesteal below: HP carries on in a run)
        if (r.s.winner) break;
        // a target that died mid-attack: the remaining hits find a new one (an enemy by its own rule for choosing, so a
        // random-picking foe picks again; anyone else the usual way: a minion still standing, then the hero)
        if (op.to === 'target' && (!a.target || a.target.hp <= 0)) {
          const b = r.db.units[a.actor.def]?.brain;
          a.target = pickFoe(r, a.actor, b?.kind === 'enemy' ? (b.foe ?? 'hero') : 'hero');
        }
        const ts = resolve(r, a, op.to);
        // Point Blank: a shot that finds only one enemy hits it harder
        const lone = op.lonePct && ts.length === 1 ? 1 + op.lonePct / 100 : 1;
        for (const t of ts)
          took += attackHit(
            r,
            a,
            t,
            Math.round(
              (amountOf(r, a, op.amount, op.scale, t) + edge + vigor + resonanceOf(a)) * lone,
            ),
            op.to === 'target' || op.to === 'front',
          );
        reap(r);
      }
      if (vigor > 0) addStatus(r, a.actor, 'vigor', -vigor);
      // Lifesteal: the attacker heals a share of the HP the attack took off (DECISIONS #285)
      if (op.lifesteal && took > 0 && a.actor.hp > 0)
        healUnit(r, a.actor, Math.floor((took * op.lifesteal) / 100));
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
        if (n > 0) n += stacks(a.actor, 'bracing');
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
        r.ev.push({ type: 'heal', target: t.id, amount: n, hp: t.hp });
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
        const applied = addStatus(
          r,
          t,
          op.status,
          op.status === 'seared' ? scaledByDifficulty(a.actor, t, n) : n,
        );
        if (op.temp && n > 0 && applied)
          side.temps.push({ unit: t.id, status: op.status, amount: n });
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
    case 'draw':
      drawCards(r, side, amountOf(r, a, op.amount, op.scale, null));
      return;
    case 'mana':
      gainMana(r, side, amountOf(r, a, op.amount, op.scale, null));
      return;
    case 'stars':
      side.stars = Math.max(0, side.stars + amountOf(r, a, op.amount, op.scale, null));
      r.ev.push({ type: 'stars', side: side.id, stars: side.stars });
      return;
    case 'summon': {
      const u = spawn(r, side, op.unit, false, a.actor);
      // (a hero who shares Might: the new companion arrives with it)
      const lead = heroOf(side);
      const given = lead
        ? Math.floor(stacks(lead, 'might') * (traitOf(r, side.id)?.shareMight ?? 0))
        : 0;
      if (u && given > 0) addStatus(r, u, 'might', given);
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
      const n = Math.min(op.amount, side.hand.length);
      if (n <= 0) return;
      if (op.random || !a.pick || (!op.any && n >= side.hand.length)) {
        // no choice to make (or no one to ask): random cards, or the whole hand when it is no bigger than the number
        for (let i = 0; i < n; i++) {
          if (!side.hand.length) break;
          const [c] = side.hand.splice(nextInt(r.s.rng, side.hand.length), 1);
          if (c) moveFromHand(r, side, c, kind);
        }
        return;
      }
      r.s.pending = {
        kind,
        pool: side.hand.map((c) => c.id),
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
      });
      r.ev.push({ type: 'power', side: side.id, card: a.card?.id ?? '' });
      return;
    case 'channel': {
      const n = amountOf(r, a, op.times ?? 1, op.scale, null);
      for (let i = 0; i < n && !r.s.winner; i++) channel(r, side, op.rune);
      return;
    }
    case 'evoke': {
      const batch = side.runes.slice(0, op.count ?? 1);
      for (const rs of batch) {
        const times = amountOf(r, a, op.times ?? 1, op.scale, null);
        for (let i = 0; i < times && !r.s.winner; i++) fireRune(r, side, rs, 'evoke');
        if (!op.keep) removeRune(r, side, rs);
        if (r.s.winner) return;
      }
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
            (c.hero === hid || c.hero === 'neutral') &&
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
      for (let i = 0; i < (op.count ?? 1) && pool.length; i++) {
        const pick = pool[nextInt(r.s.rng, pool.length)] as CardDef;
        const made = addCardTo(r, side, pick.id, 'hand');
        if (op.free && pick.cost > 0) made.costMod = -pick.cost;
      }
      return;
    }
    case 'upgrade': {
      const upgradable = side.hand.filter((c) => {
        const up = cardDef(r.db, c.card).upgrade;
        return !!up && !!r.db.cards[up];
      });
      const chosen =
        op.scope === 'hand'
          ? upgradable
          : upgradable.length
            ? [upgradable[nextInt(r.s.rng, upgradable.length)] as CardInst]
            : [];
      for (const c of chosen) {
        c.card = cardDef(r.db, c.card).upgrade as CardId;
        r.ev.push({ type: 'transform', side: side.id, card: c.id, def: c.card });
      }
      return;
    }
    case 'cheapen': {
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
      if (a.card) addCardTo(r, side, a.card.id, op.to);
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
        const pool = side.discard.filter(
          (c) =>
            (!op.kind || r.db.cards[c.card]?.kind === op.kind) &&
            (!op.tag || r.db.cards[c.card]?.tags?.includes(op.tag) === true),
        );
        if (!pool.length) break;
        const pick = pool[nextInt(r.s.rng, pool.length)] as CardInst;
        side.discard = side.discard.filter((c) => c.id !== pick.id);
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
      const t = a.target;
      if (t && t.kind === 'ally' && t.side === a.actor.side && t.hp > 0) t.hp = 0;
      return;
    }
    case 'forge': {
      const all = [...side.hand, ...side.draw, ...side.discard];
      if (a.inst && a.inst.card === op.card) all.push(a.inst);
      const mine = all.filter((c) => c.card === op.card);
      if (!mine.length) {
        const made = addCardTo(r, side, op.card, 'hand');
        made.bonus = op.amount;
      } else for (const c of mine) c.bonus = (c.bonus ?? 0) + op.amount;
      r.ev.push({ type: 'forge', side: side.id, card: op.card, amount: op.amount });
      return;
    }
  }
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
  sd.runes.push({ rune: id, charge: 0 });
  r.ev.push({ type: 'runeChannel', side: sd.id, rune: id, index: sd.runes.length - 1 });
}

function removeRune(r: Run, sd: SideState, rs: RuneState): void {
  const i = sd.runes.indexOf(rs);
  if (i < 0) return;
  sd.runes.splice(i, 1);
  r.ev.push({ type: 'runeGone', side: sd.id, rune: rs.rune });
}

function fireRune(r: Run, sd: SideState, rs: RuneState, how: 'passive' | 'evoke'): void {
  const d = runeDef(r, rs.rune);
  const hero = heroOf(sd);
  if (!hero || hero.hp <= 0) return;
  r.ev.push({ type: 'runeFire', side: sd.id, rune: rs.rune, how });
  runOps(
    r,
    mkAct(hero, { rune: true, charge: rs.charge }),
    how === 'passive' ? d.passive : d.evoke,
  );
  if (how === 'passive' && d.grow) rs.charge += d.grow + stacks(hero, 'resonance');
  // a totem that charges spends its charge when it awakens, even one that stays (Echo Chamber): otherwise it hits ever harder for ever
  if (how === 'evoke' && d.grow) rs.charge = 0;
}

// --- cards & piles -----------------------------------------------------------------------------------------------

function addCardTo(r: Run, sd: SideState, card: CardId, to: 'hand' | 'discard' | 'draw'): CardInst {
  cardDef(r.db, card);
  const inst: CardInst = { id: newId(r.s, 'c'), card };
  let where = to;
  if (where === 'hand' && sd.hand.length >= MAX_HAND) where = 'discard';
  if (where === 'hand') sd.hand.push(inst);
  else if (where === 'discard') sd.discard.push(inst);
  else sd.draw.unshift(inst);
  r.ev.push({ type: 'addCard', side: sd.id, card: inst.id, def: card, to: where });
  sd.created++;
  fireTriggers(r, sd, 'created');
  return inst;
}

function drawCards(r: Run, sd: SideState, n: number): void {
  for (let i = 0; i < n; i++) {
    if (sd.draw.length === 0) {
      if (sd.discard.length === 0) return;
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
      r.ev.push({ type: 'draw', side: sd.id, card: c.id, def: c.card });
      sd.drawn++;
      fireTriggers(r, sd, 'draw');
    }
  }
}

/** A card that an effect (not the end-of-turn sweep) sends away from the hand. It has already left the hand. */
function moveFromHand(r: Run, sd: SideState, c: CardInst, kind: 'discard' | 'exhaust'): void {
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
    fireTriggers(r, sd, 'discard');
  } else exhaustCard(r, sd, c);
}

/** Puts a card (already out of every pile) into the exhaust pile and runs what exhausting it does. */
function exhaustCard(r: Run, sd: SideState, c: CardInst): void {
  sd.exhausted.push(c);
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
  } = {},
): void {
  const played = ctx.card;
  const hero = heroOf(sd);
  if (!hero || hero.hp <= 0 || r.depth >= MAX_DEPTH) return;
  r.depth++;
  for (const p of [...sd.powers]) {
    if (r.s.winner) break;
    if (p.when !== when) continue;
    if (when === 'play' && played) {
      if (p.filter && p.filter !== played.kind) continue;
      if (p.tag && !played.tags?.includes(p.tag)) continue;
    }
    if (when === 'stance' && p.stance && p.stance !== ctx.stance) continue;
    // an Aura that answers "an ally dies" by striking its attacker does nothing when nothing attacked it (a sacrifice, a Trap, Doom)
    if (
      when === 'allyDies' &&
      !ctx.attacker &&
      p.ops.some((o) => 'to' in o && (o as { to?: string }).to === 'attacker')
    )
      continue;
    runOps(
      r,
      mkAct(hero, {
        target: ctx.target ?? null,
        attacker: ctx.attacker ?? null,
        healed: ctx.healed ?? 0,
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
  const count = sd.units.filter((u) => u.kind !== 'hero').length;
  if (count >= (sd.hero !== null ? allyCap(r.db, sd) : quiet ? MAX_START_ENEMIES : MAX_ENEMIES))
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
    // an ally that falls is remembered (Revive) and its owner's Auras hear about it
    const fell = dead.filter((u) => u.kind === 'ally');
    for (const u of fell) (sd.fallen ??= []).push(u.def);
    for (const u of fell) {
      // (the one that killed it, if it is still standing)
      const killer = u.killedBy ? findUnit(r.s, u.killedBy) : null;
      fireTriggers(r, sd, 'allyDies', { attacker: killer && killer.hp > 0 ? killer : null });
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
  if (d.brain.kind !== 'ally' || u.hp <= 0) return;
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

/** barrier falls away, Seared burns, then (for a hero side) mana refills and the hand is drawn */
function startOfTurn(r: Run, side: Side): void {
  const sd = r.s.sides[side];
  for (const u of sd.units) {
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
  for (const u of [...sd.units]) {
    const sear = stacks(u, 'seared');
    if (sear > 0 && u.hp > 0) {
      applyDamage(r, null, u, sear, 'direct');
      addStatus(r, u, 'seared', -1);
    }
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
  sd.discarded = 0;
  sd.calmPaid = false;
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
  drawCards(r, sd, sd.handSize + (first ? 1 : 0) + extraDraw);
  const hero = heroOf(sd);
  if (!hero) return;
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
  fireTriggers(r, sd, 'turnStart');
}

/**
 * End of `side`'s turn: its Faltering wears off (it has just spent a turn weakened), and Exposed wears off on the
 * OTHER side's units (they have just been attacked by `side` for a turn). So "Exposed 2" on a hero covers the rest of
 * the enemy turn it was applied in plus one more enemy turn.
 */
function decay(r: Run, side: Side): void {
  for (const u of r.s.sides[side].units)
    if (stacks(u, 'faltering') > 0) addStatus(r, u, 'faltering', -1);
  for (const u of r.s.sides[other(side)].units)
    if (stacks(u, 'exposed') > 0) addStatus(r, u, 'exposed', -1);
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
    // (a Stun that landed during this turn waits for the next: DECISIONS #310)
    if (u.stunFresh) delete u.stunFresh;
    else if (stacks(u, 'stunned') > 0) addStatus(r, u, 'stunned', -1);
  }
  // Flex-style statuses wear off
  for (const t of sd.temps.splice(0)) {
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
  const side = r.s.active;
  const sd = r.s.sides[side];
  // end-of-turn Powers, then every rune's passive, then Radiant fades
  fireTriggers(r, sd, 'turnEnd');
  if (r.s.winner) return;
  for (const rs of [...sd.runes]) {
    if (r.s.winner) return;
    if (sd.runes.includes(rs)) fireRune(r, sd, rs, 'passive');
  }
  if (r.s.winner) return;
  const hero = heroOf(sd);
  if (hero && stacks(hero, 'radiant') > 0) enterStance(r, hero, 'none');
  // hand: retained cards stay, ethereal ones exhaust, the rest go to the discard pile
  const keep: CardInst[] = [];
  const hand = sd.hand;
  sd.hand = [];
  const holdAll = !!hero && stacks(hero, 'holdfast') > 0;
  for (const c of hand) {
    const cd = cardDef(r.db, c.card);
    if (cd.ethereal && !cd.retain) exhaustCard(r, sd, c);
    else if (cd.retain || holdAll) keep.push(c);
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
  for (const u of hd.startUnits ?? []) spawn(r, sd, u, true);
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
  sd: Pick<SideState, 'units'>,
  c: Pick<CardInst, 'card' | 'costMod'>,
): number {
  const cd = cardDef(db, c.card);
  const hero = sd.units.find((u) => u.kind === 'hero');
  if (cd.kind === 'skill' && hero && stacks(hero, 'unbound') > 0) return 0;
  return Math.max(0, cd.cost + (c.costMod ?? 0));
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

/** A card that summons, played with every companion slot taken: one companion has to be released to make room. */
function needsRelease(db: CombatDb, sd: SideState, cd: CardDef): boolean {
  return (
    sd.hero !== null &&
    cd.effects.some((o) => o.op === 'summon') &&
    sd.units.filter((u) => u.kind !== 'hero').length >= allyCap(db, sd)
  );
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
    if (!needsRelease(db, sd, cd)) out.push(...plays);
    else
      // every way to play it, once for each companion that could make room
      for (const p of plays)
        for (const u of sd.units)
          if (u.kind === 'ally' && u.hp > 0) out.push({ ...p, release: u.id });
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

function finishCard(r: Run, sd: SideState, inst: CardInst, cd: CardDef, target: Unit | null): void {
  if (cd.kind === 'power') {
    // a Power stays in effect for the fight and leaves the deck (without counting as "exhausted")
    sd.exhausted.push(inst);
    r.ev.push({ type: 'exhaust', side: sd.id, card: inst.id, def: inst.card });
  } else if (cd.exhaust || (cd.kind === 'skill' && unbound(sd))) exhaustCard(r, sd, inst);
  else sd.discard.push(inst);
  sd.played++;
  if (cd.kind === 'attack') sd.attacksPlayed++;
  if (cd.kind === 'skill') sd.skillsPlayed++;
  fireTriggers(r, sd, 'play', { card: cd, target });
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
  if (needsRelease(r.db, sd, cd)) {
    const out = findUnit(r.s, action.release);
    if (!out || out.side !== side || out.kind !== 'ally' || out.hp <= 0)
      throw new RulesError('Choose a companion to release to make room');
    // it simply leaves, before the card is paid for: a release is not a death, so nothing that waits for an ally to fall
    // (Auras, Revive, Doom payoffs) fires, and it cannot be brought back by one
    sd.units = sd.units.filter((u) => u.id !== out.id);
    r.ev.push({ type: 'died', unit: out.id, released: true });
  }
  sd.hand.splice(i, 1);
  sd.mana -= costOf(r.db, sd, inst);
  // a discount (Cheapen, a free Discover) is spent on the play: a card made free for good would loop for ever
  delete inst.costMod;
  let x = 0;
  if (cd.x) {
    x = sd.mana + (cd.xBonus ?? 0);
    sd.mana = 0;
  }
  if (cd.starCost) {
    sd.stars -= cd.starCost;
    r.ev.push({ type: 'stars', side, stars: sd.stars });
  }
  if (cd.statusCost) addStatus(r, hero, cd.statusCost.status, -cd.statusCost.amount);
  r.ev.push({ type: 'play', side, card: inst.id, def: inst.card, target: target?.id ?? null });
  r.ev.push({ type: 'mana', side, mana: sd.mana });
  // (the Auras that answer Arcana being spent go off once the card is paid for)
  if (cd.starCost) fireTriggers(r, sd, 'arcana');
  if (cd.kind === 'snare') {
    sd.snares.push({ id: inst.id, card: inst.card });
    r.ev.push({ type: 'snareSet', side, snare: inst.id });
    sd.played++;
    fireTriggers(r, sd, 'play', { card: cd, target: null });
    return;
  }
  // Reverb attacks and Mirrored skills happen twice (the second time without asking for choices). Whether this card is
  // doubled is decided before it runs, so a card that gives the status does not spend it on itself.
  const again =
    (cd.kind === 'attack' && stacks(hero, 'twinned') > 0 && 'twinned') ||
    (cd.kind === 'skill' && stacks(hero, 'mirrored') > 0 && 'mirrored') ||
    null;
  runOps(r, mkAct(hero, { target, card: cd, inst, x, pick: true }), cd.effects);
  if (r.s.pending) {
    r.s.pending.finish = inst;
    r.s.pending.again = again;
    return;
  }
  if (again && !r.s.winner) {
    addStatus(r, hero, again, -1);
    runOps(r, mkAct(hero, { target, card: cd, inst, x }), cd.effects);
  }
  finishCard(r, sd, inst, cd, target);
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
  for (const id of ids) {
    const pile = p.kind === 'scry' ? sd.draw : sd.hand;
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
    for (const c of left) moveFromHand(r, sd, c, 'discard');
    for (const c of picked) {
      if (sd.hand.length >= MAX_HAND) {
        sd.discard.push(c);
        r.ev.push({ type: 'burn', side, card: c.id, def: c.card });
      } else {
        sd.hand.push(c);
        r.ev.push({ type: 'draw', side, card: c.id, def: c.card });
        sd.drawn++;
        fireTriggers(r, sd, 'draw');
      }
    }
  } else for (const c of picked) moveFromHand(r, sd, c, p.kind);
  const hero = findUnit(r.s, p.actor);
  const fin = p.finish;
  const cd = fin ? cardDef(r.db, fin.card) : null;
  if (hero && !r.s.winner)
    runOps(
      r,
      mkAct(hero, {
        target: findUnit(r.s, p.target) ?? null,
        card: cd,
        inst: fin,
        x: p.x,
        pick: true,
      }),
      p.rest,
    );
  // the rest of the card may have asked for another choice
  const more = r.s.pending as CombatState['pending'];
  if (more) {
    more.finish = fin;
    more.again = p.again ?? null;
    return;
  }
  if (p.again && hero && cd && !r.s.winner) {
    addStatus(r, hero, p.again, -1);
    runOps(
      r,
      mkAct(hero, { target: findUnit(r.s, p.target) ?? null, card: cd, inst: fin, x: p.x }),
      cd.effects,
    );
  }
  if (fin && cd) finishCard(r, sd, fin, cd, findUnit(r.s, p.target) ?? null);
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
  const a = mkAct(hero, {
    card: def,
    inst,
    target: chosen,
    x: def.x ? sd.mana + (def.xBonus ?? 0) : 0,
  });
  const edge = def.tags?.includes(EDGE_TAG) ? stacks(hero, 'edge') : 0;
  // (Vigor goes into the first damage effect only, as the engine spends it)
  let vigor = def.kind === 'attack' ? stacks(hero, 'vigor') : 0;
  let earlier = false;
  def.effects.forEach((op, i) => {
    if (op.op !== 'damage') {
      // an effect before the damage (Barrier gained, cards consumed, Exposed applied...) can change it: no guess, the printed text
      earlier = true;
      return;
    }
    if (earlier) return;
    const pool =
      op.to === 'target'
        ? chosen
          ? [chosen]
          : taunters.length
            ? taunters
            : foes
        : op.to === 'front'
          ? foes.slice(0, 1)
          : op.to === 'allFoes' || op.to === 'randomFoe'
            ? foes
            : null;
    if (!pool) return;
    const hitsAll = op.to === 'allFoes';
    const lone = op.lonePct && (hitsAll ? foes.length === 1 : true) ? 1 + op.lonePct / 100 : 1;
    const v = vigor;
    vigor = 0;
    const one = (t: Unit | null): number => {
      // (with no target chosen yet, a card that reads "the target's Bleed" reads each enemy's in turn)
      const at = op.to === 'target' && !chosen ? { ...a, target: t } : a;
      const n = modifiedDamage(
        Math.round((amountOf(r, at, op.amount, op.scale, t) + edge + v) * lone),
        hero,
        t,
      );
      // Ghostly lets 1 through, Shielded none
      if (t && stacks(t, 'shielded') > 0) return 0;
      return t && stacks(t, 'ghostly') > 0 && n > 1 ? 1 : n;
    };
    const vals = pool.length ? pool.map(one) : [one(null)];
    out.set(i, {
      lo: Math.min(...vals),
      hi: Math.max(...vals),
      printed: op.amount,
      // (Sharpen is not a formula to the player: the sharpened total simply replaces the printed number)
      calc: !!op.scale && op.scale.into !== 'hits' && op.scale.by !== 'bonus',
    });
  });
  return out;
}
