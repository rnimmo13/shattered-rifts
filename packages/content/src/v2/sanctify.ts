// Sanctified cards. The Sanctum event can sanctify a whole deck: every card is re-rolled, 25% stronger or 25% weaker (a gamble,
// borrowed from Path of Exile). A sanctified card is the same card with its numbers scaled, found by id: "hi~strike" is Slash
// rolled up, "lo~strike+" is the upgraded Slash rolled down. The variants are derived on demand (they never join the card pools,
// the card library or the rewards), so the data stays one card, one definition.

import type { CardDef, Op } from '@sr/combat';

export type SanctifyDir = 1 | -1;

const PREFIX = /^(hi|lo)~/;

/** The id of a card without any sanctified roll on it ("hi~strike+" -> "strike+"). */
export const stripRoll = (id: string): string => id.replace(PREFIX, '');

/** +1 / -1 for a rolled card, 0 for an ordinary one. */
export const rollOf = (id: string): SanctifyDir | 0 => {
  const m = PREFIX.exec(id);
  return m ? (m[1] === 'hi' ? 1 : -1) : 0;
};

export const rolledId = (id: string, dir: SanctifyDir): string =>
  `${dir > 0 ? 'hi' : 'lo'}~${stripRoll(id)}`;

/** 25% up or down, rounded, and always at least one step when the number is big enough to feel it. */
function scaleN(n: number, dir: SanctifyDir): number {
  if (n <= 0) return n;
  let v = Math.round(n * (dir > 0 ? 1.25 : 0.75));
  if (v === n && n >= 2) v = n + dir;
  return Math.max(1, v);
}

function scaleOp(o: Op, dir: SanctifyDir): Op {
  switch (o.op) {
    case 'damage':
    case 'barrier':
    case 'heal':
    case 'loseHp':
      return { ...o, amount: scaleN(o.amount, dir) };
    case 'status':
      // a positive status amount is a magnitude (Might, Exposed, Thorns...); removals stay as they are
      return o.amount > 0 ? { ...o, amount: scaleN(o.amount, dir) } : o;
    case 'power':
      return { ...o, ops: o.ops.map((x) => scaleOp(x, dir)) };
    default:
      return o;
  }
}

/** The card with every damage, Barrier, healing, HP-loss and status number scaled. */
export function rolledVariant(base: CardDef, dir: SanctifyDir): CardDef {
  const out: CardDef = {
    ...base,
    id: rolledId(base.id, dir),
    name: `${base.name} ${dir > 0 ? '▲' : '▼'}`,
    effects: base.effects.map((o) => scaleOp(o, dir)),
  };
  if (base.onDiscard) out.onDiscard = base.onDiscard.map((o) => scaleOp(o, dir));
  if (base.onExhaust) out.onExhaust = base.onExhaust.map((o) => scaleOp(o, dir));
  if (base.upgrade) out.upgrade = rolledId(base.upgrade, dir);
  return out;
}

/** Does sanctifying this card change anything? (A card that only draws or makes Mana has no number to roll.) */
export function canRoll(base: CardDef): boolean {
  return JSON.stringify(rolledVariant(base, 1).effects) !== JSON.stringify(base.effects);
}

/**
 * A card table that also answers for rolled ids ("hi~strike"), deriving them from the real cards on first use. The variants are
 * never added to the table itself, so listing the cards (the library, the pools, the tests) still shows only the real ones.
 */
export function withRolls(cards: Record<string, CardDef>): Record<string, CardDef> {
  const made = new Map<string, CardDef>();
  const derive = (id: string): CardDef | undefined => {
    const hit = made.get(id);
    if (hit) return hit;
    const dir = rollOf(id);
    const base = dir ? cards[stripRoll(id)] : undefined;
    if (!dir || !base || !canRoll(base)) return undefined;
    const v = rolledVariant(base, dir);
    made.set(id, v);
    return v;
  };
  return new Proxy(cards, {
    get(t, p, r) {
      if (typeof p === 'string' && !(p in t)) return derive(p);
      return Reflect.get(t, p, r) as unknown;
    },
    has(t, p) {
      return Reflect.has(t, p) || (typeof p === 'string' && derive(p) !== undefined);
    },
  });
}
