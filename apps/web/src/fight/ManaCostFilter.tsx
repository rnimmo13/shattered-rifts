import './manaCostFilter.css';
import type { ManaCost } from './manaCost';
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
