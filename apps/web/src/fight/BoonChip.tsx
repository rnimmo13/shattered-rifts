// A Boon as a small round token with its name and effect on hover.

import { COMBAT_DB } from '@sr/content/v2';

export function BoonChip(props: { id: string; size?: 'small' | 'large' }) {
  const b = COMBAT_DB.boons[props.id];
  if (!b) return null;
  return (
    <span
      className={`boon boon--${b.rarity}${props.size === 'large' ? ' boon--large' : ''}`}
      title={`${b.name}: ${b.text}`}
      aria-label={`${b.name}: ${b.text}`}
      tabIndex={0}
    >
      {b.name.charAt(0)}
    </span>
  );
}

/** A Boon with its name and text written out (rewards, shop). */
export function BoonCard(props: { id: string; note?: string }) {
  const b = COMBAT_DB.boons[props.id];
  if (!b) return null;
  return (
    <div className={`booncard boon--${b.rarity}`}>
      <BoonChip id={props.id} size="large" />
      <div>
        <b>{b.name}</b>
        <small>{b.rarity}</small>
        <p>{b.text}</p>
        {props.note && <em>{props.note}</em>}
      </div>
    </div>
  );
}
