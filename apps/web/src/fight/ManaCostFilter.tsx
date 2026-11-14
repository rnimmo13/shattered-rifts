import './manaCostFilter.css';
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
export function ManaCostFilter(props: { value: ManaCost; onChange: (value: ManaCost) => void }) {
  return (
    <label className="grim__manaFilter">
      Mana cost{' '}
      <select
        aria-label="Filter by Mana cost"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as ManaCost)}
      >
        <option value="all">Any cost</option>
        {['0', '1', '2', '3', '4', '5+', 'X'].map((n) => (
          <option key={n} value={n}>
            {n} Mana
          </option>
        ))}
        <option value="unplayable">Unplayable</option>
      </select>
    </label>
  );
}
