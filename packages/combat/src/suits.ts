// Suits (the Trickster's playing-card build path, docs/TRICKSTER_SUITS.md): every card has one of four suits, read from what it
// does, so no card needs tagging and a Neutral or Rift-crossed card has a suit too. A card can name its own (`CardDef.suit`).
//   ♠ spades   Attacks
//   ♥ hearts   Barrier and protection
//   ♦ diamonds cards, Mana, Foresee
//   ♣ clubs    Traps and debuffs

import type { CardDef, Op, Sel, StatusId, Suit } from './types';

export const SUITS: readonly Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

/** Statuses on your own side that protect (♥) or that sharpen your attacks (♠); any other one on you is ♦. */
const PROTECT = new Set<StatusId>([
  'ghostly',
  'steadfast',
  'shielded',
  'blur',
  'plating',
  'thorns',
  'bracing',
  'fortified',
]);
const SHARPEN = new Set<StatusId>(['might', 'vigor']);
/** the targets that are on the other side */
const FOES = new Set<Sel>(['allFoes', 'randomFoe', 'front', 'weakestFoe', 'attacker']);

function suitOfOp(o: Op, aimsAtFoe: boolean): Suit | null {
  switch (o.op) {
    case 'damage':
    case 'loseHp':
      return o.to === 'self' ? null : 'spades';
    case 'barrier':
    case 'barrierNext':
    case 'heal':
      return 'hearts';
    case 'draw':
    case 'drawNext':
    case 'scry':
    case 'mana':
    case 'manaNext':
    case 'maxMana':
    case 'cheapen':
    case 'discover':
    case 'fetch':
      return 'diamonds';
    case 'status': {
      const onFoe = FOES.has(o.to) || (o.to === 'target' && aimsAtFoe);
      if (onFoe) return 'clubs';
      if (PROTECT.has(o.status)) return 'hearts';
      if (SHARPEN.has(o.status)) return 'spades';
      return 'diamonds';
    }
    case 'power':
      // (an Aura's "target" is what set it off: the enemy an Attack struck or a debuff landed on)
      return o.ops.reduce<Suit | null>((s, x) => s ?? suitOfOp(x, true), null);
    case 'when':
      return o.ops.reduce<Suit | null>((s, x) => s ?? suitOfOp(x, aimsAtFoe), null);
    default:
      return null;
  }
}

/** A card's suit: its own if it names one, else an Attack is ♠, a Trap ♣, and anything else takes the suit of its first effect. */
export function suitOf(c: CardDef): Suit | 'wild' {
  if (c.suit) return c.suit;
  if (c.kind === 'attack') return 'spades';
  if (c.kind === 'snare') return 'clubs';
  for (const o of c.effects) {
    const s = suitOfOp(o, c.target === 'foe');
    if (s) return s;
  }
  return 'diamonds';
}
