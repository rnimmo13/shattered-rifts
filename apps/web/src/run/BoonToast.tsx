// "You got a Boon": a banner that drops in over the run screen with the Boon's medallion, name and what it does, so a new
// Boon (from a fight, shop, event or opening choice) is never missed. Click it to dismiss; it also leaves on its own.

import { useEffect } from 'react';
import { COMBAT_DB } from '@sr/content/v2';
import { BoonChip } from '../fight/BoonChip';

export function BoonToast(props: { id: string; more: number; onDone: () => void }) {
  const b = COMBAT_DB.boons[props.id];
  const { onDone } = props;
  useEffect(() => {
    const t = window.setTimeout(onDone, 6500);
    return () => window.clearTimeout(t);
  }, [props.id, onDone]);
  if (!b) return null;
  return (
    <button
      type="button"
      className={`boontoast boon--${b.rarity}`}
      role="status"
      aria-live="polite"
      onClick={onDone}
    >
      <span className="boontoast__rays" aria-hidden />
      <span className="boontoast__medal">
        <BoonChip id={props.id} size="large" />
      </span>
      <span className="boontoast__body">
        <small>You gained a Boon</small>
        <b>{b.name}</b>
        <span>{b.text}</span>
        <i>
          {b.rarity} · yours for the rest of the run
          {props.more > 0 ? ` · ${props.more} more` : ''}
        </i>
      </span>
    </button>
  );
}
