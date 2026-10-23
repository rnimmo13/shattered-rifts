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
export const heal = (amount: number, to: Sel = 'self'): Op => ({ op: 'heal', amount, to });
export const status = (st: StatusId, amount: number, to: Sel = 'self', temp = false): Op => ({
  op: 'status',
  status: st,
  amount,
  to,
  ...(temp ? { temp } : {}),
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

// --- ops for the lanes (docs/09_ROSTER.md) --------------------------------------------------------------------------
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
export const exhaustN = (amount: number, mode: 'choose' | 'random' | 'any' = 'choose'): Op => ({
  op: 'exhaustCards',
  amount,
  ...(mode === 'random' ? { random: true } : mode === 'any' ? { any: true } : {}),
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
export const manaNext = (amount: number): Op => ({ op: 'manaNext', amount });
export const maxMana = (amount: number): Op => ({ op: 'maxMana', amount });
export const drawNext = (amount: number): Op => ({ op: 'drawNext', amount });
export const discoverOp = (kind?: CardKind, count = 1, free = false): Op => ({
  op: 'discover',
  ...(kind ? { kind } : {}),
  ...(count !== 1 ? { count } : {}),
  ...(free ? { free } : {}),
});
export const upgradeOp = (scope: 'hand' | 'random'): Op => ({ op: 'upgrade', scope });
export const cheapen = (amount: number, scope: 'hand' | 'random'): Op => ({
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
export const doubleSt = (st: StatusId, to: Sel = 'target', mult = 2): Op => ({
  op: 'scaleStatus',
  status: st,
  mult,
  to,
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
/** A Power's trigger: run `ops` whenever `when` happens. */
export const on = (
  when: TriggerWhen,
  ops: Op[],
  narrow: { filter?: CardKind; tag?: string; stance?: Stance } = {},
): Op => ({ op: 'power', when, ops, ...narrow });

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
    | 'x'
    | 'innate'
    | 'ethereal'
    | 'onDiscard'
    | 'onExhaust'
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
 * (flavour). Usage: `const m = pool('maren', 'aurelion'); m('common', 'strike', 'Strike', 'attack', 1, 'foe', [dmg(6)])`.
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
 * times), Barrier +3, Heal +3, statuses +1 (not Seared on single targets of 1), draw +1, and so on. A card that has
 * nothing to improve gets cheaper, or loses Exhaust.
 */
export function plus(c: CardDef): CardDef {
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
        // "damage equal to X" has no flat part to improve
        if (o.amount === 0 && o.scale) return o;
        changed = true;
        return {
          ...o,
          amount: o.amount + ((o.hits && o.hits > 1) || o.scale?.into === 'hits' ? 1 : 3),
        };
      case 'barrier':
        if (o.amount === 0 && o.scale) return o;
        changed = true;
        return { ...o, amount: o.amount + 3 };
      case 'scry':
        changed = true;
        return { ...o, amount: o.amount + 1 };
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
        if (o.amount === 0 && o.scale) return o;
        changed = true;
        return { ...o, amount: o.amount + 3 };
      case 'status':
        // on/off statuses have nothing to gain from more stacks: their upgrade is a cheaper card instead
        if (
          o.amount > 0 &&
          o.status !== 'stunned' &&
          o.status !== 'shielded' &&
          o.status !== 'unbound' &&
          o.status !== 'fortified'
        ) {
          changed = true;
          return { ...o, amount: o.amount + 1 };
        }
        return o;
      case 'summon':
        changed = true;
        return { ...o, unit: `${o.unit}+` };
      case 'draw':
        if (o.amount === 0 && o.scale) return o;
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'mana':
        if (o.amount === 0 && o.scale) return o;
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'loseHp':
        return o.amount > 1 && o.to === 'self' ? { ...o, amount: o.amount - 1 } : o;
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
    if (c.cost > 0) up.cost = c.cost - 1;
    else if (c.exhaust) delete up.exhaust;
  }
  return up;
}

/** Cards plus their "+" versions, with the upgrade link filled in. */
export function withUpgrades(cards: CardDef[]): CardDef[] {
  return cards.flatMap((c) => {
    // basics upgrade too (Strike+ / Defend+); junk and tokens (made mid-fight by other cards) do not
    if (c.unplayable && !c.onDiscard) return [c];
    if (c.source === 'token') return [c];
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
