// Sanctified cards. The Sanctum event can sanctify a whole deck: every card is re-rolled, 25% stronger or 25% weaker (a gamble,
// borrowed from Path of Exile). A sanctified card is the same card with its numbers scaled, found by id: "hi~strike" is Slash
// rolled up, "lo~strike+" is the upgraded Slash rolled down. The variants are derived on demand (they never join the card pools,
// the card library or the rewards), so the data stays one card, one definition.

import type { CardDef, Op } from '@sr/combat';

export type SanctifyDir = 1 | -1;

const PREFIX = /^(hi|lo)~/;

// Card tags (DECISIONS #227): an event can engrave one keyword onto one card of your deck for good, written into its id the same
// way as a sanctified roll: "hold^strike" is Strike with Hold, "hi~hold^strike+" a sanctified, upgraded, held Strike. One tag per card.
export type CardMark = 'hold' | 'opening' | 'flare';
const MARK = /^(hold|opening|flare)\^/;
export const MARK_INFO: Record<CardMark, { name: string; text: string }> = {
  hold: { name: 'Hold', text: 'stays in your hand at the end of the turn' },
  opening: { name: 'Opening hand', text: 'is always in your opening hand' },
  flare: { name: 'Flare', text: 'costs 1 less, but is consumed when played' },
};

/** The tag engraved on a card, if any ("hi~hold^strike" -> "hold"). */
export const markOf = (id: string): CardMark | null => {
  const m = MARK.exec(id.replace(PREFIX, ''));
  return m ? (m[1] as CardMark) : null;
};

/** The id of a card without any sanctified roll or engraved tag on it ("hi~hold^strike+" -> "strike+"). */
export const stripRoll = (id: string): string => id.replace(PREFIX, '').replace(MARK, '');

/** The id of the card with a tag engraved (its roll, if any, kept in front): "strike+" + hold -> "hold^strike+". */
export const markedId = (id: string, mark: CardMark): string => {
  const roll = PREFIX.exec(id)?.[0] ?? '';
  return `${roll}${mark}^${stripRoll(id)}`;
};

/** Can this card take this tag (and does it change anything)? Never a Power, a card that cannot be played, or a token. */
export function canMark(c: CardDef, mark: CardMark): boolean {
  if (c.kind === 'power' || c.unplayable || c.source === 'token' || c.rarity === 'ancestral')
    return false;
  if (mark === 'hold') return !c.retain;
  if (mark === 'opening') return !c.innate;
  return c.cost > 0 && !c.exhaust;
}

function markedVariant(base: CardDef, mark: CardMark): CardDef {
  // (a ◆ on the name, so a tagged card is told apart from its plain copies at a glance)
  const out: CardDef = { ...base, id: `${mark}^${base.id}`, name: `${base.name} ◆` };
  if (mark === 'hold') out.retain = true;
  else if (mark === 'opening') out.innate = true;
  else {
    out.exhaust = true;
    out.cost = Math.max(0, base.cost - 1);
  }
  if (base.upgrade) out.upgrade = `${mark}^${base.upgrade}`;
  return out;
}

/** +1 / -1 for a rolled card, 0 for an ordinary one. */
export const rollOf = (id: string): SanctifyDir | 0 => {
  const m = PREFIX.exec(id);
  return m ? (m[1] === 'hi' ? 1 : -1) : 0;
};

/** Whether a card has been sanctified (its numbers re-rolled). It can be removed like any other card (DECISIONS #233). */
export const isSanctified = (id: string): boolean => rollOf(id) !== 0;

export const rolledId = (id: string, dir: SanctifyDir): string =>
  `${dir > 0 ? 'hi' : 'lo'}~${id.replace(PREFIX, '')}`;

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
    const mark = markOf(id);
    if (!dir && !mark) return undefined;
    const realId = stripRoll(id);
    // (only real cards: an id like "hi~constructor" must not reach inherited object members)
    const real = Object.hasOwn(cards, realId) ? cards[realId] : undefined;
    if (!real) return undefined;
    // the tag first ("hold^strike"), then the roll on top of it
    // a tag is only real where an event could have cut it: judged on the card before its upgrade (an upgrade may already hold)
    const unupgraded = realId.endsWith('+') ? cards[realId.slice(0, -1)] : real;
    if (mark && (!unupgraded || !canMark(unupgraded, mark))) return undefined;
    const base = mark ? markedVariant(real, mark) : real;
    if (!dir) {
      made.set(id, base);
      return base;
    }
    if (!canRoll(real)) return undefined;
    const v = rolledVariant(base, dir);
    // if the upgrade has no number to roll, the rolled card upgrades into the plain upgrade (tagged like this one)
    if (real.upgrade) {
      const up = cards[real.upgrade];
      if (!up || !canRoll(up)) v.upgrade = base.upgrade ?? real.upgrade;
    }
    made.set(id, v);
    return v;
  };
  return new Proxy(cards, {
    get(t, p, r) {
      if (typeof p === 'string' && !Object.hasOwn(t, p) && isVariant(p)) return derive(p);
      return Reflect.get(t, p, r) as unknown;
    },
    has(t, p) {
      return Reflect.has(t, p) || (typeof p === 'string' && derive(p) !== undefined);
    },
  });
}

/** An id the card table answers for although it is not listed: a sanctified roll or an engraved tag. */
export const isVariant = (id: string): boolean => rollOf(id) !== 0 || markOf(id) !== null;
