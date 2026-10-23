// Combat v2 engine: pure, deterministic, synchronous. State in, state + events out (docs/08_COMBAT_V2.md).
// Randomness only through the seeded PRNG held in the state. The caller never mutates the state it passes in.

import { nextInt, seedRng, shuffle } from './rng';
import {
  MAX_ALLIES,
  MAX_ENEMIES,
  MAX_HAND,
  MAX_SNARES,
  RulesError,
  other,
  clone,
  type Action,
  type CardDef,
  type CardId,
  type CardInst,
  type CombatDb,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
  type FoeRule,
  type HeroSetup,
  type Op,
  type Pattern,
  type Sel,
  type Side,
  type SideState,
  type SimplePattern,
  type StatusId,
  type Unit,
  type UnitDef,
  type UnitId,
} from './types';

interface Run {
  db: CombatDb;
  s: CombatState;
  ev: CombatEvent[];
}

/** Who is acting and what they are acting on. */
interface Act {
  actor: Unit;
  target: Unit | null;
  attacker: Unit | null;
  /** set while a hit is being resolved, so a Snare can cancel it */
  hit: { prevented: boolean } | null;
}

export interface StepResult {
  state: CombatState;
  events: CombatEvent[];
}

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

function addStatus(r: Run, u: Unit, st: StatusId, amount: number): void {
  if (amount === 0) return;
  let total = stacks(u, st) + amount;
  if (st === 'stunned') total = Math.min(1, total);
  if (total <= 0) delete u.statuses[st];
  else u.statuses[st] = total;
  r.ev.push({ type: 'status', target: u.id, status: st, amount, total: Math.max(0, total) });
}

// --- damage ---------------------------------------------------------------------------------------------------

/** attack damage after the attacker's Might / Faltering and the target's Exposed */
export function modifiedDamage(base: number, attacker: Unit | null, target: Unit | null): number {
  let n = base + (attacker ? stacks(attacker, 'might') : 0);
  if (attacker && stacks(attacker, 'faltering') > 0) n = Math.floor(n * 0.75);
  if (target && stacks(target, 'exposed') > 0) n = Math.floor(n * 1.5);
  return Math.max(0, n);
}

function applyDamage(
  r: Run,
  source: Unit | null,
  t: Unit,
  amount: number,
  kind: 'attack' | 'direct',
): void {
  if (t.hp <= 0) return;
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
    });
    return;
  }
  const blocked = kind === 'attack' ? Math.min(t.barrier, amount) : 0;
  t.barrier -= blocked;
  const lost = Math.min(t.hp, amount - blocked);
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
  });
  if (lost > 0 && t.kind === 'hero')
    fireSnare(r, t.side, { on: 'hpLost', lost, attacker: source, hit: null });
}

/** One attack hit from `a.actor` on `t`: Snares may spring first and may cancel it. */
function attackHit(r: Run, a: Act, t: Unit, base: number): void {
  if (t.hp <= 0) return;
  if (t.side !== a.actor.side) {
    const hit = { prevented: false };
    fireSnare(r, t.side, { on: 'attacked', victim: t, attacker: a.actor, hit });
    if (r.s.winner || t.hp <= 0 || a.actor.hp <= 0) return;
    if (hit.prevented) {
      r.ev.push({ type: 'prevented', unit: a.actor.id });
      return;
    }
  }
  const amount = modifiedDamage(base, a.actor, t);
  applyDamage(r, a.actor, t, amount, 'attack');
  const thorns = stacks(t, 'thorns');
  if (thorns > 0 && a.actor.hp > 0 && t.side !== a.actor.side)
    applyDamage(r, t, a.actor, thorns, 'direct');
}

// --- snares ---------------------------------------------------------------------------------------------------------

type Trig =
  | { on: 'attacked'; victim: Unit; attacker: Unit; hit: { prevented: boolean } }
  | { on: 'hpLost'; lost: number; attacker: Unit | null; hit: null }
  | { on: 'foeSummons'; summoned: Unit };

/** The oldest matching Snare on `side` springs (at most one per event). */
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
  const attacker = t.on === 'foeSummons' ? t.summoned : t.attacker;
  runOps(
    r,
    { actor: hero, target: attacker, attacker, hit: t.on === 'attacked' ? t.hit : null },
    cd.effects,
  );
  sd.discard.push({ id: sn.id, card: sn.card });
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
    case 'attacker':
      if (a.attacker && a.attacker.hp > 0) return [a.attacker];
      return foes.length ? [foes[0] as Unit] : [];
  }
}

function runOps(r: Run, a: Act, ops: readonly Op[]): void {
  for (const op of ops) {
    if (r.s.winner) return;
    if (a.actor.hp <= 0 && a.actor.kind !== 'hero') return;
    execOp(r, a, op);
    reap(r);
  }
}

function execOp(r: Run, a: Act, op: Op): void {
  const side = r.s.sides[a.actor.side];
  switch (op.op) {
    case 'damage': {
      const hits = op.hits ?? 1;
      for (let i = 0; i < hits; i++) {
        if (r.s.winner) return;
        // a target that died mid-attack: the remaining hits find a new one
        if (op.to === 'target' && (!a.target || a.target.hp <= 0))
          a.target = pickFoe(r, a.actor, 'hero');
        for (const t of resolve(r, a, op.to)) attackHit(r, a, t, op.amount);
        reap(r);
      }
      return;
    }
    case 'loseHp':
      for (const t of resolve(r, a, op.to)) applyDamage(r, a.actor, t, op.amount, 'direct');
      return;
    case 'barrier':
      for (const t of resolve(r, a, op.to)) {
        t.barrier += op.amount;
        r.ev.push({ type: 'barrier', target: t.id, amount: op.amount, total: t.barrier });
      }
      return;
    case 'heal':
      for (const t of resolve(r, a, op.to)) {
        const n = Math.min(op.amount, t.maxHp - t.hp);
        if (n <= 0) continue;
        t.hp += n;
        r.ev.push({ type: 'heal', target: t.id, amount: n });
      }
      return;
    case 'status':
      for (const t of resolve(r, a, op.to)) addStatus(r, t, op.status, op.amount);
      return;
    case 'draw':
      drawCards(r, side, op.amount);
      return;
    case 'mana':
      side.mana = Math.max(0, side.mana + op.amount);
      r.ev.push({ type: 'mana', side: side.id, mana: side.mana });
      return;
    case 'summon': {
      const u = spawn(r, side, op.unit);
      if (u) fireSnare(r, other(side.id), { on: 'foeSummons', summoned: u });
      return;
    }
    case 'addCard': {
      const dest = op.side === 'self' ? side : r.s.sides[other(side.id)];
      if (dest.hero === null) return; // enemies have no deck
      addCardTo(r, dest, op.card, op.to);
      return;
    }
    case 'actAllies':
      if (a.actor.kind === 'ally') return; // an ally cannot make everyone act again
      for (const u of [...side.units]) if (u.kind === 'ally' && u.hp > 0) actAlly(r, u);
      return;
    case 'prevent':
      if (a.hit) a.hit.prevented = true;
      return;
  }
}

// --- cards & piles -----------------------------------------------------------------------------------------------

function addCardTo(r: Run, sd: SideState, card: CardId, to: 'hand' | 'discard' | 'draw'): void {
  cardDef(r.db, card);
  const inst: CardInst = { id: newId(r.s, 'c'), card };
  let where = to;
  if (where === 'hand' && sd.hand.length >= MAX_HAND) where = 'discard';
  if (where === 'hand') sd.hand.push(inst);
  else if (where === 'discard') sd.discard.push(inst);
  else sd.draw.unshift(inst);
  r.ev.push({ type: 'addCard', side: sd.id, card: inst.id, def: card, to: where });
}

function drawCards(r: Run, sd: SideState, n: number): void {
  for (let i = 0; i < n; i++) {
    if (sd.draw.length === 0) {
      if (sd.discard.length === 0) return;
      sd.draw = shuffle(r.s.rng, sd.discard);
      sd.discard = [];
      r.ev.push({ type: 'shuffle', side: sd.id });
    }
    const c = sd.draw.shift() as CardInst;
    if (sd.hand.length >= MAX_HAND) {
      sd.discard.push(c);
      r.ev.push({ type: 'burn', side: sd.id, card: c.id, def: c.card });
    } else {
      sd.hand.push(c);
      r.ev.push({ type: 'draw', side: sd.id, card: c.id, def: c.card });
    }
  }
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
    lastMoves: [],
  };
}

/** Add a unit to a side (nearest the centre after existing ones, always in front of the hero). */
function spawn(r: Run, sd: SideState, defId: string, quiet = false): Unit | null {
  const d = def(r, defId);
  const count = sd.units.filter((u) => u.kind !== 'hero').length;
  if (count >= (sd.hero !== null ? MAX_ALLIES : MAX_ENEMIES)) return null;
  const u = makeUnit(r, sd.id, d);
  const index = sd.units.length - (heroOf(sd) ? 1 : 0);
  sd.units.splice(index, 0, u);
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
  }
  const lost = (side: Side): boolean => {
    const sd = r.s.sides[side];
    return sd.hero !== null ? !heroOf(sd) : sd.units.length === 0;
  };
  const la = lost('a');
  const lb = lost('b');
  if (la || lb) {
    r.s.winner = la && lb ? 'draw' : la ? 'b' : 'a';
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
  return pool.find((x) => x.kind === 'hero') ?? (pool[0] as Unit);
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
  if (stacks(u, 'stunned') > 0) {
    addStatus(r, u, 'stunned', -1);
    r.ev.push({ type: 'skip', unit: u.id, reason: 'stunned' });
    return;
  }
  const front = r.s.sides[other(u.side)].units.find((x) => x.hp > 0) ?? null;
  r.ev.push({ type: 'act', unit: u.id, move: null });
  runOps(r, { actor: u, target: front, attacker: null, hit: null }, d.brain.act);
}

function actEnemy(r: Run, u: Unit): void {
  const d = def(r, u.def);
  if (d.brain.kind !== 'enemy' || u.hp <= 0) return;
  if (stacks(u, 'stunned') > 0) {
    addStatus(r, u, 'stunned', -1);
    r.ev.push({ type: 'skip', unit: u.id, reason: 'stunned' });
    u.intent = null;
    return;
  }
  const it = u.intent;
  if (!it) return;
  const mv = d.brain.moves[it.move];
  if (!mv) throw new RulesError(`${d.id} has no move "${it.move}"`);
  let target = findUnit(r.s, it.target);
  const taunted = r.s.sides[other(u.side)].units.some((x) => x.taunt && x.hp > 0) && !target?.taunt;
  if (!target || target.hp <= 0 || target.side === u.side || taunted)
    target = pickFoe(r, u, d.brain.foe ?? 'hero') ?? undefined;
  r.ev.push({ type: 'act', unit: u.id, move: it.move });
  u.intent = null;
  runOps(r, { actor: u, target: target ?? null, attacker: null, hit: null }, mv.effects);
}

// --- turns ------------------------------------------------------------------------------------------------------------

/** barrier falls away, Seared burns, then (for a hero side) mana refills and the hand is drawn */
function startOfTurn(r: Run, side: Side): void {
  const sd = r.s.sides[side];
  for (const u of sd.units) {
    if (u.barrier > 0) {
      u.barrier = 0;
      r.ev.push({ type: 'barrierDrop', target: u.id });
    }
  }
  for (const u of [...sd.units]) {
    const sear = stacks(u, 'seared');
    if (sear > 0 && u.hp > 0) {
      applyDamage(r, null, u, sear, 'direct');
      addStatus(r, u, 'seared', -1);
    }
  }
  reap(r);
}

function beginHeroTurn(r: Run, side: Side): void {
  const sd = r.s.sides[side];
  r.s.active = side;
  r.s.turn++;
  r.ev.push({ type: 'turnStart', side, turn: r.s.turn });
  startOfTurn(r, side);
  if (r.s.winner) return;
  // the second PvP player gets a small head start on their first turn
  const first = r.s.mode === 'pvp' && side === 'b' && r.s.turn === 2;
  sd.mana = sd.maxMana + (first ? 1 : 0);
  r.ev.push({ type: 'mana', side, mana: sd.mana });
  drawCards(r, sd, sd.handSize + (first ? 1 : 0));
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
}

function enemyPhase(r: Run): void {
  const sd = r.s.sides.b;
  r.s.active = 'b';
  r.s.turn++;
  r.ev.push({ type: 'turnStart', side: 'b', turn: r.s.turn });
  startOfTurn(r, 'b');
  const order = sd.units.map((u) => u.id);
  for (const id of order) {
    if (r.s.winner) return;
    const u = findUnit(r.s, id);
    if (u) actEnemy(r, u);
    reap(r);
  }
  if (r.s.winner) return;
  decay(r, 'b');
  // units that just acted (or were stunned) pick their next move; summoned ones already chose theirs
  for (const u of sd.units) if (!u.intent) chooseIntent(r, u);
  r.ev.push({ type: 'turnEnd', side: 'b' });
}

function endTurn(r: Run): void {
  const side = r.s.active;
  const sd = r.s.sides[side];
  // hand: retained cards stay, the rest go to the discard pile
  const keep: CardInst[] = [];
  for (const c of sd.hand) {
    if (cardDef(r.db, c.card).retain) keep.push(c);
    else {
      sd.discard.push(c);
      r.ev.push({ type: 'discard', side, card: c.id, def: c.card });
    }
  }
  sd.hand = keep;
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
  r.ev.push({ type: 'turnEnd', side });
  if (r.s.mode === 'pve') {
    enemyPhase(r);
    if (!r.s.winner) beginHeroTurn(r, 'a');
  } else {
    beginHeroTurn(r, other(side));
  }
}

// --- setup ---------------------------------------------------------------------------------------------------------

function buildHeroSide(r: Run, id: Side, h: HeroSetup): SideState {
  const hd = r.db.heroes[h.hero];
  if (!hd) throw new RulesError(`Unknown hero "${h.hero}"`);
  const sd: SideState = {
    id,
    units: [],
    hand: [],
    draw: h.deck.map((card) => {
      cardDef(r.db, card);
      return { id: newId(r.s, 'c'), card };
    }),
    discard: [],
    exhausted: [],
    mana: 0,
    maxMana: hd.mana,
    handSize: hd.handSize,
    snares: [],
    hero: hd.id,
  };
  shuffle(r.s.rng, sd.draw);
  const hp = Math.max(1, Math.min(hd.maxHp, h.hp ?? hd.maxHp));
  sd.units.push({
    id: newId(r.s, 'u'),
    def: hd.id,
    name: hd.name,
    kind: 'hero',
    side: id,
    hp,
    maxHp: hd.maxHp,
    barrier: 0,
    statuses: {},
    taunt: false,
    intent: null,
    moveCount: 0,
    pat: '',
    patCount: 0,
    lowPct: 100,
    lastMoves: [],
  });
  r.s.sides[id] = sd;
  for (const u of hd.startUnits ?? []) spawn(r, sd, u, true);
  return sd;
}

export function createCombat(db: CombatDb, setup: CombatSetup): StepResult {
  const emptySide = (id: Side): SideState => ({
    id,
    units: [],
    hand: [],
    draw: [],
    discard: [],
    exhausted: [],
    mana: 0,
    maxMana: 0,
    handSize: 0,
    snares: [],
    hero: null,
  });
  const s: CombatState = {
    seed: setup.seed,
    rng: seedRng(setup.seed),
    mode: 'enemies' in setup.b ? 'pve' : 'pvp',
    turn: 0,
    active: 'a',
    sides: { a: emptySide('a'), b: emptySide('b') },
    winner: null,
    nextId: 1,
  };
  const r: Run = { db, s, ev: [] };
  buildHeroSide(r, 'a', setup.a);
  if ('enemies' in setup.b) {
    for (const e of setup.b.enemies) {
      const d = def(r, e);
      if (d.brain.kind !== 'enemy') throw new RulesError(`"${e}" cannot fight as an enemy`);
      if (!spawn(r, s.sides.b, e, true)) throw new RulesError('Too many enemies');
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

export function canPlay(r: { db: CombatDb; s: CombatState }, side: Side, c: CardInst): boolean {
  const cd = cardDef(r.db, c.card);
  const sd = r.s.sides[side];
  if (cd.unplayable || cd.cost > sd.mana) return false;
  if (cd.kind === 'snare' && sd.snares.length >= MAX_SNARES) return false;
  if (cd.target === 'foe' && legalFoes({ ...r, ev: [] }, side, cd).length === 0) return false;
  return true;
}

export function legalActions(db: CombatDb, s: CombatState): Action[] {
  if (s.winner) return [];
  const side = s.active;
  const sd = s.sides[side];
  const r: Run = { db, s, ev: [] };
  const out: Action[] = [];
  for (const c of sd.hand) {
    if (!canPlay(r, side, c)) continue;
    const cd = cardDef(db, c.card);
    if (cd.target === 'none') out.push({ type: 'play', card: c.id });
    else if (cd.target === 'foe')
      for (const t of legalFoes(r, side, cd)) out.push({ type: 'play', card: c.id, target: t.id });
    else
      for (const t of sd.units) if (t.hp > 0) out.push({ type: 'play', card: c.id, target: t.id });
  }
  out.push({ type: 'endTurn' });
  return out;
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
        : target.side === side);
    if (!legal) throw new RulesError('Choose a legal target');
  }
  const hero = heroOf(sd);
  if (!hero) throw new RulesError('No hero to play cards');
  sd.hand.splice(i, 1);
  sd.mana -= cd.cost;
  r.ev.push({ type: 'play', side, card: inst.id, def: inst.card, target: target?.id ?? null });
  r.ev.push({ type: 'mana', side, mana: sd.mana });
  if (cd.kind === 'snare') {
    sd.snares.push({ id: inst.id, card: inst.card });
    r.ev.push({ type: 'snareSet', side, snare: inst.id });
    return;
  }
  runOps(r, { actor: hero, target, attacker: null, hit: null }, cd.effects);
  if (cd.kind === 'power' || cd.exhaust) {
    sd.exhausted.push(inst);
    r.ev.push({ type: 'exhaust', side, card: inst.id, def: inst.card });
  } else {
    sd.discard.push(inst);
  }
}

export function applyAction(db: CombatDb, state: CombatState, action: Action): StepResult {
  if (state.winner) throw new RulesError('The fight is over');
  const s = clone(state);
  const r: Run = { db, s, ev: [] };
  if (action.type === 'endTurn') endTurn(r);
  else if (action.type === 'play') playCard(r, action);
  else throw new RulesError('Unknown action');
  return { state: s, events: r.ev };
}
