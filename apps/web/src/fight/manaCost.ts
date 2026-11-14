import type { CardDef } from '@sr/combat';
export type ManaCost = 'all' | '0' | '1' | '2' | '3' | '4' | '5+' | 'X' | 'unplayable';
export function matchesManaCost(card: CardDef, cost: ManaCost = 'all'): boolean {
  if (cost === 'all') return true;
  if (cost === 'unplayable') return !!card.unplayable;
  if (card.unplayable) return false;
  if (cost === 'X') return !!card.x;
  if (card.x) return false;
  return cost === '5+' ? card.cost >= 5 : card.cost === Number(cost);
}
