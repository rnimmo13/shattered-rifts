// Small constructors so the Combat v2 content below reads like a card list, not like JSON.

import type {
  CardDef,
  CardKind,
  CardTarget,
  Move,
  Op,
  Pattern,
  Rarity,
  Sel,
  StatusId,
  UnitDef,
} from '@sr/combat';

// --- ops -----------------------------------------------------------------------------------------------------------
export const dmg = (amount: number, to: Sel = 'target', hits?: number): Op =>
  hits && hits > 1 ? { op: 'damage', amount, hits, to } : { op: 'damage', amount, to };
export const barrier = (amount: number, to: Sel = 'self'): Op => ({ op: 'barrier', amount, to });
export const heal = (amount: number, to: Sel = 'self'): Op => ({ op: 'heal', amount, to });
export const status = (st: StatusId, amount: number, to: Sel = 'self'): Op => ({
  op: 'status',
  status: st,
  amount,
  to,
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

// --- cards ---------------------------------------------------------------------------------------------------------

type Extra = Partial<Pick<CardDef, 'exhaust' | 'retain' | 'unplayable' | 'trigger' | 'text'>>;

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
  return { id, name, realm, rarity, kind, cost, target, effects, ...extra };
}

/**
 * The "+" version of a card, derived by one rule so upgrades stay consistent: damage +3 (+1 per hit when it hits several
 * times), Barrier +3, Heal +3, statuses +1 (not Seared on single targets of 1), draw +1, and so on. A card that has
 * nothing to improve gets cheaper, or loses Exhaust.
 */
export function plus(c: CardDef): CardDef {
  let changed = false;
  const effects = c.effects.map((o): Op => {
    switch (o.op) {
      case 'damage':
        changed = true;
        return { ...o, amount: o.amount + (o.hits && o.hits > 1 ? 1 : o.to === 'allFoes' ? 3 : 3) };
      case 'barrier':
        changed = true;
        return { ...o, amount: o.amount + 3 };
      case 'heal':
        changed = true;
        return { ...o, amount: o.amount + 3 };
      case 'status':
        if (o.amount > 0 && o.status !== 'stunned' && o.status !== 'shielded') {
          changed = true;
          return { ...o, amount: o.amount + 1 };
        }
        return o;
      case 'summon':
        changed = true;
        return { ...o, unit: `${o.unit}+` };
      case 'draw':
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'mana':
        changed = true;
        return { ...o, amount: o.amount + 1 };
      case 'loseHp':
        return o.amount > 1 && o.to === 'self' ? { ...o, amount: o.amount - 1 } : o;
      default:
        return o;
    }
  });
  const up: CardDef = { ...c, id: `${c.id}+`, name: `${c.name}+`, effects };
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
    if (c.unplayable || c.rarity === 'basic') {
      // basics upgrade too (Strike+ / Defend+), junk does not
      if (c.unplayable) return [c];
    }
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
