// A Potion as a small flask token (with its name and effect on hover), and a button version for the fight.

import { COMBAT_DB } from '@sr/content/v2';

export function PotionChip(props: { id: string }) {
  const p = COMBAT_DB.potions[props.id];
  if (!p) return null;
  return (
    <span
      className={`potion potion--${p.rarity}`}
      title={`${p.name}: ${p.text}`}
      aria-label={`${p.name}: ${p.text}`}
      tabIndex={0}
    >
      ⚗
    </span>
  );
}

/** A potion you can use in a fight. */
export function PotionButton(props: {
  id: string;
  disabled: boolean;
  active: boolean;
  onUse: () => void;
}) {
  const p = COMBAT_DB.potions[props.id];
  if (!p) return null;
  return (
    <button
      className={`potionbtn potion--${p.rarity}${props.active ? ' is-active' : ''}`}
      disabled={props.disabled}
      onClick={props.onUse}
      title={`${p.name}: ${p.text}`}
      aria-label={`Use ${p.name}: ${p.text}`}
    >
      <span aria-hidden>⚗</span>
      <small>{p.name}</small>
    </button>
  );
}

export function PotionCard(props: { id: string; note?: string }) {
  const p = COMBAT_DB.potions[props.id];
  if (!p) return null;
  return (
    <div className={`booncard potion--${p.rarity}`}>
      <PotionChip id={props.id} />
      <div>
        <b>{p.name}</b>
        <small>{p.rarity}</small>
        <p>{p.text}</p>
        {props.note && <em>{props.note}</em>}
      </div>
    </div>
  );
}
