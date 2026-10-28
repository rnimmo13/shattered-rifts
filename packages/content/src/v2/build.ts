// Small constructors so the Combat v2 content below reads like a card list, not like JSON.

import type {
  CardDef,
  CardKind,
  CardTarget,
  Move,
  Op,
  Pattern,
  Metric,
  Rarity,
  Scale,
  Sel,
  Stance,
  StatusId,
  TriggerWhen,
  UnitDef,
} from '@sr/combat';

// --- ops -----------------------------------------------------------------------------------------------------------
export const dmg = (amount: number, to: Sel = 'target', hits?: number): Op =>
  hits && hits > 1 ? { op: 'damage', amount, hits, to } : { op: 'damage', amount, to };
export const barrier = (amount: number, to: Sel = 'self'): Op => ({ op: 'barrier', amount, to });
/** A damage effect with Lifesteal: the attacker heals `pct` percent of the HP it takes off (DECISIONS #285). */
export const lifesteal = (o: Op, pct: number): Op => ({ ...o, lifesteal: pct }) as Op;
/** Companions (never a hero) gain `amount` max HP, and heal as much. */
export const growHp = (amount: number, to: Sel = 'allFriends'): Op => ({
  op: 'growHp',
  amount,
  to,
});
export const heal = (amount: number, to: Sel = 'self'): Op => ({ op: 'heal', amount, to });
/** Lessen every debuff on the target by `amount` stacks (it never removes one outright: that is `dispel`). */
/** Lessen every debuff by `amount` stacks, or by `pct`% of them when that is more (DECISIONS #244). */
export const cleanse = (amount: number, to: Sel = 'self', pct?: number): Op =>
  pct ? { op: 'cleanse', amount, to, pct } : { op: 'cleanse', amount, to };
/** Dispel every debuff on the target completely: for the highest rarity of a card only. */
export const dispel = (to: Sel = 'self'): Op => ({ op: 'cleanse', amount: 0, to, all: true });
export const status = (st: StatusId, amount: number, to: Sel = 'self', temp = false): Op => ({
  op: 'status',
  status: st,
  amount,
  to,
  ...(temp ? { temp } : {}),
});
/** a status that wears off at the end of the target's own next turn (Mangle's Sapped) */
export const statusTheirs = (st: StatusId, amount: number, to: Sel = 'target'): Op => ({
  op: 'status',
  status: st,
  amount,
  to,
  temp: 'theirs',
});
export const lose = (amount: number, to: Sel = 'self'): Op => ({ op: 'loseHp', amount, to });
export const draw = (amount: number): Op => ({ op: 'draw', amount });
export const mana = (amount: number): Op => ({ op: 'mana', amount });
export const summon = (unit: string): Op => ({ op: 'summon', unit });
export const wound = (side: 'self' | 'foe' = 'foe', card = 'wound'): Op => ({
  op: 'addCard',
  card,
  to: 'discard',
  side,
});
export const ACT: Op = { op: 'actAllies' };
export const PREVENT: Op = { op: 'prevent' };

// --- ops for the build paths (docs/09_ROSTER.md) --------------------------------------------------------------------------
/** A scale: "+mult per metric". `of`: self (default) / the card's target / each unit hit. */
export const per = (by: Metric, mult = 1, of?: Scale['of'], into?: Scale['into']): Scale => ({
  by,
  ...(mult !== 1 ? { mult } : {}),
  ...(of ? { of } : {}),
  ...(into ? { into } : {}),
});
/** Attach a scale to any op that has an amount. */
export const scaled = <T extends Op>(o: T, scale: Scale): T => ({ ...o, scale });
export const discard = (amount: number, mode: 'choose' | 'random' | 'any' = 'choose'): Op => ({
  op: 'discard',
  amount,
  ...(mode === 'random' ? { random: true } : mode === 'any' ? { any: true } : {}),
});
export const exhaustN = (
  amount: number,
  mode: 'choose' | 'random' | 'any' = 'choose',
  /** only cards of this kind (`only`), or every kind but this one (`not`) */
  filter: { only?: CardKind; not?: CardKind } = {},
): Op => ({
  op: 'exhaustCards',
  amount,
  ...(mode === 'random' ? { random: true } : mode === 'any' ? { any: true } : {}),
  ...filter,
});
export const scry = (amount: number): Op => ({ op: 'scry', amount });
export const stars = (amount: number): Op => ({ op: 'stars', amount });
export const stance = (st: Stance | 'none'): Op => ({ op: 'stance', stance: st });
export const channel = (rune: string, times?: number): Op => ({
  op: 'channel',
  rune,
  ...(times ? { times } : {}),
});
export const evoke = (count = 1, times = 1, keep = false): Op => ({
  op: 'evoke',
  ...(count !== 1 ? { count } : {}),
  ...(times !== 1 ? { times } : {}),
  ...(keep ? { keep } : {}),
});
export const forge = (cardId: string, amount: number): Op => ({
  op: 'forge',
  card: cardId,
  amount,
});
export const sacrifice: Op = { op: 'sacrifice' };
export const reclaim = (amount: number): Op => ({ op: 'reclaim', amount });
export const fetchCards = (
  amount: number,
  to: 'hand' | 'draw' = 'hand',
  kind?: CardKind,
  upgrade = false,
): Op => ({
  op: 'fetch',
  amount,
  to,
  ...(kind ? { kind } : {}),
  ...(upgrade ? { upgrade } : {}),
});
/** return random cards with a tag (Carvings...) from your discard pile to your hand */
export const fetchTag = (amount: number, tag: string): Op => ({
  op: 'fetch',
  amount,
  to: 'hand',
  tag,
});
export const revive: Op = { op: 'revive' };
export const manaNext = (amount: number): Op => ({ op: 'manaNext', amount });
export const maxMana = (amount: number): Op => ({ op: 'maxMana', amount });
export const drawNext = (amount: number): Op => ({ op: 'drawNext', amount });
export const discoverOp = (kind?: CardKind, count = 1, free = false, scale?: Scale): Op => ({
  op: 'discover',
  ...(kind ? { kind } : {}),
  ...(count !== 1 ? { count } : {}),
  ...(free ? { free } : {}),
  ...(scale ? { scale } : {}),
});
/** play cards for free against random enemies: from your draw pile, consumed pile, hand, or the card just drawn */
export const playPile = (
  from: 'draw' | 'exhaust' | 'hand' | 'drawn',
  opts: Omit<Extract<Op, { op: 'playPile' }>, 'op' | 'from'> = {},
): Op => ({ op: 'playPile', from, ...opts });
export const manaLock: Op = { op: 'manaLock' };
export const drawLock: Op = { op: 'drawLock' };
export const drawUntil = (not: CardKind): Op => ({ op: 'drawUntil', not });
export const exhaustTop = (amount = 1): Op => ({ op: 'exhaustTop', amount });
export const transformHand = (kind: CardKind, into: string): Op => ({ op: 'transform', kind, into });
/** run `ops` only while a metric is within bounds */
export const when = (
  by: Metric,
  bounds: { atLeast?: number; atMost?: number; of?: Scale['of'] },
  ops: Op[],
): Op => ({ op: 'when', by, ...bounds, ops });
export const copyPlayed: Op = { op: 'copyPlayed' };
export const maxHpUp = (amount: number, to: Sel = 'self'): Op => ({ op: 'maxHp', amount, to });
/** run these ops once for each enemy the damage op kills */
export const onKill = (o: Op, ops: Op[]): Op => ({ ...o, onKill: ops }) as Op;
export const upgradeOp = (scope: 'hand' | 'random'): Op => ({ op: 'upgrade', scope });
export const cheapen = (amount: number, scope: 'hand' | 'random' | 'self'): Op => ({
  op: 'cheapen',
  amount,
  scope,
});
export const copySelf = (to: 'hand' | 'discard' | 'draw' = 'discard'): Op => ({
  op: 'copySelf',
  to,
});
/** Unblockable HP loss for the target that depends on the board (Cash In: its Seared). */
export const loseHpScaled = (scale: Scale, to: Sel = 'target'): Op => ({
  op: 'loseHp',
  amount: 0,
  to,
  scale,
});
/** Multiply a status; `max` caps the stacks it adds (every doubler in the pools has one: see balance.test.ts). */
export const doubleSt = (st: StatusId, to: Sel = 'target', mult = 2, max?: number): Op => ({
  op: 'scaleStatus',
  status: st,
  mult,
  to,
  ...(max !== undefined ? { max } : {}),
});
export const addTo = (
  cardId: string,
  times = 1,
  to: 'hand' | 'discard' | 'draw' = 'hand',
  scale?: Scale,
): Op => ({
  op: 'addCard',
  card: cardId,
  to,
  side: 'self',
  ...(times !== 1 || scale ? { times } : {}),
  ...(scale ? { scale } : {}),
});
// --- the Regent's pieces (Obsidia, the spellblade) -------------------------------------------------------------------
export const barrierNext = (amount: number): Op => ({ op: 'barrierNext', amount });
export const starsNext = (amount: number): Op => ({ op: 'starsNext', amount });
/** put cards from your hand on top of your draw pile (chosen) */
export const topdeck = (amount = 1): Op => ({ op: 'topdeck', amount });
export const endTurnOp: Op = { op: 'endTurn' };
/** the card being resolved deals more damage for the rest of the fight (an onDraw effect: Kingly Punch) */
export const growSelf = (amount: number): Op => ({ op: 'growSelf', amount });
export const copyInHand = (neutral = false): Op => ({ op: 'copyInHand', ...(neutral ? { neutral } : {}) });
/** random Neutral cards into your hand (their "+" versions when `upgraded`) */
export const discoverNeutral = (count = 1, upgraded = false): Op => ({
  op: 'discover',
  neutral: true,
  ...(count !== 1 ? { count } : {}),
  ...(upgraded ? { upgraded } : {}),
});
/** a card with this tag comes to your hand from wherever it is (draw, discard or consumed pile) */
export const fetchAnywhere = (tag: string): Op => ({ op: 'fetch', amount: 1, to: 'hand', tag, anywhere: true });
/** cards become another card: `amount` of them (every one when missing), from your hand or draw pile, chosen or at random */
export const transformSome = (
  into: string,
  opts: { amount?: number; from?: 'hand' | 'draw'; choose?: boolean } = {},
): Op => ({ op: 'transform', into, ...opts });

/** A Power's trigger: run `ops` whenever `when` happens. */
export const on = (
  when: TriggerWhen,
  ops: Op[],
  narrow: {
    filter?: CardKind;
    tag?: string;
    stance?: Stance;
    temp?: boolean;
    once?: boolean;
    ethereal?: boolean;
    minCost?: number;
    pin?: boolean;
    /** the Defect copy (totemist): a cost limit, a number of answers, one totem's awakening */
    maxCost?: number;
    times?: number;
    rune?: string;
  } = {},
): Extract<Op, { op: 'power' }> => ({ op: 'power', when, ops, ...narrow });

// --- ops for the Necrobinder copy (Dorian: his minions stand in for Osty, several at once) ----------------------------------
/** Raise N (Summon N): a companion of `unit` rises with N HP, or with every slot taken the weakest gains N max HP (Dorian's Bone Thrall by default) */
export const raise = (amount: number, unit = 'bone-thrall', times?: number, scale?: Scale): Op => ({
  op: 'raise',
  unit,
  amount,
  ...(times !== undefined ? { times } : {}),
  ...(scale ? { scale } : {}),
});
/** each of your companions does these ("Osty deals 6") */
export const command = (...ops: Op[]): Op => ({ op: 'command', ops });
export const doomNow = (to: Sel = 'allFoes'): Op => ({ op: 'doomNow', to });
export const spreadDebuffs: Op = { op: 'spreadDebuffs' };
export const mark = (flag: 'ethereal' | 'retain' | 'replay', costUp?: number): Op => ({
  op: 'mark',
  flag,
  ...(costUp ? { costUp } : {}),
});
export const costTax = (amount: number): Op => ({ op: 'costTax', amount });

// --- the Defect copy (totemist) -------------------------------------------------------------------------------------------
/** totems' passives, now: every totem (or every one of a kind), or the oldest only (`first`); `aim` strikes the target */
export const pulse = (
  opts: { rune?: string; first?: boolean; times?: number; aim?: boolean } = {},
): Op => ({ op: 'pulse', ...opts });
/** this card costs `amount` more (less, if negative) for the rest of the fight */
export const recost = (amount: number): Op => ({ op: 'recost', amount });
export const reshuffle: Op = { op: 'reshuffle' };
export const returnPlayed: Op = { op: 'returnPlayed' };
/** a status card's tag (Wound, Haze, Scorch, Muck, Drain): the cards that pay off when you make one look for it */
export const STATUS_TAG = 'status';

// --- cards ---------------------------------------------------------------------------------------------------------

type Extra = Partial<
  Pick<
    CardDef,
    | 'exhaust'
    | 'retain'
    | 'unplayable'
    | 'trigger'
    | 'text'
    | 'source'
    | 'hero'
    | 'tags'
    | 'starCost'
    | 'statusCost'
    | 'x'
    | 'innate'
    | 'ethereal'
    | 'onDiscard'
    | 'onExhaust'
    | 'needsExhausted'
    | 'cheaperPerAttack'
    | 'replayFromExhaust'
    | 'sly'
    | 'cheaperPerSkill'
    | 'needsEmptyDraw'
    | 'onDraw'
    | 'starX'
    | 'after'
    | 'returnEvery'
    | 'playFromTop'
    | 'freeIf'
    | 'cheaperPer'
    | 'recallOnCost'
    | 'inHandAtEnd'
    | 'cheaperOnCreate'
  >
> & {
  /** a hand-written "+" version: fields that replace the card's (instead of the generic rule in plus()) */
  up?: Partial<CardDef>;
};

/** Hand-written upgrades, by card id (read by plus()). Kept out of CardDef so card data stays pure. */
const CUSTOM_UP = new Map<string, Partial<CardDef>>();

export function card(
  realm: string,
  rarity: Rarity,
  id: string,
  name: string,
  kind: CardKind,
  cost: number,
  target: CardTarget,
  effects: Op[],
  extra: Extra = {},
): CardDef {
  const { up, ...rest } = extra;
  if (up) CUSTOM_UP.set(id, up);
  return { id, name, realm, rarity, kind, cost, target, effects, ...rest };
}

/**
 * A constructor for one Riftwalker's pool: every card it makes belongs to `hero` (its reward pool) and comes from `realm`
 * (flavour). Usage: `const m = pool('knight', 'aurelion'); m('common', 'strike', 'Strike', 'attack', 1, 'foe', [dmg(6)])`.
 */
export function pool(hero: string, realm: string) {
  return (
    rarity: Rarity,
    id: string,
    name: string,
    kind: CardKind,
    cost: number,
    target: CardTarget,
    effects: Op[],
    extra: Extra = {},
  ): CardDef => card(realm, rarity, id, name, kind, cost, target, effects, { hero, ...extra });
}

/**
 * The "+" version of a card, derived by one rule so upgrades stay consistent: damage +3 (+1 per hit when it hits several
 * times), Barrier +3, Heal +3, statuses +1 (+2 from 5 stacks up), foresee +1 (+2 from 4 up), draw +1, and so on. "Damage equal to
 * X" gains a flat +3 like any other damage (it used to get cheaper instead, which made 0-cost scaling cards). Mana never grows: a
 * Mana card improves its other numbers. A card that has nothing to improve gets cheaper, or loses Exhaust; a card that makes
 * resources (Mana, cards) or scales with something is never made free and never loses Exhaust (a free card that replaces itself
 * would loop for ever): it Holds instead.
 */
export function plus(c: CardDef): CardDef {
  // every X card upgrades the same way, as in Slay the Spire: X counts as one more
  if (c.x) {
    const up: CardDef = { ...c, id: `${c.id}+`, name: `${c.name}+`, xBonus: (c.xBonus ?? 0) + 1 };
    delete up.upgrade;
    return up;
  }
  const custom = CUSTOM_UP.get(c.id);
  if (custom) {
    const up: CardDef = { ...c, ...custom, id: `${c.id}+`, name: `${c.name}+` };
    delete up.upgrade;
    return up;
  }
  let changed = false;
  const upOp = (o: Op): Op => {
    switch (o.op) {
      case 'damage':
        changed = true;
        return {
          ...o,
          amount: o.amount + ((o.hits && o.hits > 1) || o.scale?.into === 'hits' ? 1 : 3),
        };
      case 'barrier':
        changed = true;
        return { ...o, amount: o.amount + 3 };
      case 'growHp':
        changed = true;
        return { ...o, amount: o.amount + 2 };
      case 'scry':
        changed = true;
        // a long look gains two: one more card on top of 4 is a small step
        return { ...o, amount: o.amount + (o.amount >= 4 ? 2 : 1) };
      case 'stars':
        if (o.amount > 0) {
          changed = true;
          return { ...o, amount: o.amount + 1 };
        }
        return o;
      case 'addCard':
        if (o.times && o.times > 0 && !o.scale) {
          changed = true;
          return { ...o, times: o.times + 1 };
        }
        return o;
      case 'forge':
        changed = true;
        return { ...o, amount: o.amount + 2 };
      case 'reclaim':
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'manaNext':
        // owed Mana shrinks by one but never reaches 0
        if (o.amount < 0 && o.amount > -2) return o;
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'drawNext':
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'channel':
      case 'evoke':
        // an X card gets one more X
        if (o.scale?.by === 'x') {
          changed = true;
          return { ...o, times: (o.times ?? 0) + 1 };
        }
        return o;
      case 'heal':
        changed = true;
        return { ...o, amount: o.amount + 3 };
      case 'cleanse':
        // a dispel is already everything; a cleanse lessens one more stack
        if (o.all) return o;
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'status':
        // on/off statuses have nothing to gain from more stacks: their upgrade is a cheaper card instead
        if (
          o.amount > 0 &&
          o.status !== 'stunned' &&
          o.status !== 'shielded' &&
          o.status !== 'unbound' &&
          o.status !== 'fortified' &&
          o.status !== 'plating' &&
          o.status !== 'sturdy' &&
          o.status !== 'unmovable' &&
          o.status !== 'cruelty' &&
          o.status !== 'freeattack' &&
          o.status !== 'reaping' &&
          o.status !== 'freeethereal'
        ) {
          changed = true;
          // a big stack (Bleed 5, Primed 6, a plague of 9) gains two: +1 on 5 is barely felt
          return { ...o, amount: o.amount + (o.amount >= 5 ? 2 : 1) };
        }
        return o;
      case 'summon':
        changed = true;
        return { ...o, unit: `${o.unit}+` };
      case 'draw':
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'when':
        // the effects it guards improve like any other
        return { ...o, ops: o.ops.map(upOp) };
      case 'command':
        // what the companions do improves like any other
        return { ...o, ops: o.ops.map(upOp) };
      case 'raise':
        changed = true;
        return { ...o, amount: o.amount + 2 };
      case 'mana':
        // Mana is the one number an upgrade never raises (a free +1 Mana card upgraded into +2 is a different card)
        return o;
      case 'scaleStatus':
        // a capped doubler can add half as much again
        if (o.max === undefined) return o;
        changed = true;
        return { ...o, max: o.max + Math.ceil(o.max / 2) };
      case 'fetch':
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'loseHp':
        // paying less HP is the upgrade of a card that costs HP; HP taken from an enemy grows like damage
        if (o.to === 'self') {
          if (o.amount <= 1) return o;
          changed = true;
          return { ...o, amount: o.amount - 1 };
        }
        changed = true;
        return { ...o, amount: o.amount + 3 };
      default:
        return o;
    }
  };
  const up: CardDef = {
    ...c,
    id: `${c.id}+`,
    name: `${c.name}+`,
    effects: c.effects.map(upOp),
    // what a card does when discarded or exhausted improves too
    ...(c.onDiscard ? { onDiscard: c.onDiscard.map(upOp) } : {}),
    ...(c.onExhaust ? { onExhaust: c.onExhaust.map(upOp) } : {}),
  };
  delete up.upgrade;
  if (!changed) {
    // cards that make resources, or scale with something, never become free: a free one could be played again and again
    const RESOURCE: Op['op'][] = ['mana', 'draw', 'fetch', 'discover', 'addCard'];
    const resource = c.effects.some((o) => RESOURCE.includes(o.op));
    const scales = c.effects.some((o) => 'scale' in o && o.scale !== undefined);
    if (c.cost > 1 || (c.cost === 1 && !resource && !scales)) up.cost = c.cost - 1;
    else if (c.cost === 0 && c.exhaust && !resource) delete up.exhaust;
    else up.retain = true;
  }
  return up;
}

/** Cards plus their "+" versions, with the upgrade link filled in. */
export function withUpgrades(cards: CardDef[]): CardDef[] {
  return cards.flatMap((c) => {
    // basics upgrade too (Strike+ / Defend+); junk and tokens (made mid-fight by other cards) do not, unless a token is given a
    // hand-written upgrade (Buckshot Shell+, which an upgraded Ammo Dump hands out)
    if (c.unplayable && !c.onDiscard) return [c];
    if (c.source === 'token' && !CUSTOM_UP.has(c.id)) return [c];
    const up = plus(c);
    return [{ ...c, upgrade: up.id }, up];
  });
}

// --- units ---------------------------------------------------------------------------------------------------------

export const move = (id: string, name: string, ...effects: Op[]): Move => ({ id, name, effects });

export function ally(
  id: string,
  name: string,
  maxHp: number,
  act: Op[],
  extra: Partial<UnitDef> = {},
): UnitDef {
  return { id, name, maxHp, brain: { kind: 'ally', act }, ...extra };
}

export function foe(
  id: string,
  name: string,
  maxHp: number,
  moves: Move[],
  pattern: Pattern,
  extra: { opening?: string; foe?: 'hero' | 'lowest' | 'random'; taunt?: boolean } = {},
): UnitDef {
  const { taunt, ...brainExtra } = extra;
  return {
    id,
    name,
    maxHp,
    ...(taunt ? { taunt } : {}),
    brain: {
      kind: 'enemy',
      moves: Object.fromEntries(moves.map((m) => [m.id, m])),
      pattern,
      ...brainExtra,
    },
  };
}

export const cycle = (...order: string[]): Pattern => ({ kind: 'cycle', order });
export const weighted = (...options: [string, number][]): Pattern => ({
  kind: 'weighted',
  options: options.map(([m, weight]) => ({ move: m, weight })),
});
export const phases = (...ph: [number, Exclude<Pattern, { kind: 'phases' }>][]): Pattern => ({
  kind: 'phases',
  phases: ph.map(([atOrBelowPct, pattern]) => ({ atOrBelowPct, pattern })),
});
