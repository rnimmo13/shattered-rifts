// A Boon: a gold medallion (ember for a Warden's Heart) with a symbol for what it does, and a tooltip with its name and effect.

import { COMBAT_DB } from '@sr/content/v2';
import { tipAttrs } from '../ui/tip';
import { boonIcon } from '../art/gameIcons';
import { GameIcon } from '../ui/GameIcon';
import './boon.css';

export function BoonChip(props: { id: string; size?: 'small' | 'large' }) {
  const b = Object.hasOwn(COMBAT_DB.boons, props.id) ? COMBAT_DB.boons[props.id] : undefined;
  if (!b) return null;
  const art = boonIcon(b.id);
  return (
    <span
      className={`boon${b.heart ? ' boon--heart' : ''}${props.size === 'large' ? ' boon--large' : ''}`}
      aria-label={`${b.name}: ${b.text}`}
      tabIndex={0}
      {...tipAttrs({
        kicker: b.heart ? 'Warden’s Heart' : 'Boon',
        title: b.name,
        tone: 'boon',
        text: b.text,
        hint: b.heart
          ? 'It lasts the whole run. You hold one Heart at a time.'
          : 'A passive that lasts the whole run.',
      })}
    >
      {art && <GameIcon art={art} />}
    </span>
  );
}

/** A Boon with its name and text written out (rewards, shop). */
export function BoonCard(props: { id: string; note?: string }) {
  const b = COMBAT_DB.boons[props.id];
  if (!b) return null;
  return (
    <div className={`booncard${b.heart ? ' boon--heart' : ''}`}>
      <BoonChip id={props.id} size="large" />
      <div>
        <b>{b.name}</b>
        <small>{b.heart ? 'Warden’s Heart' : 'Boon'}</small>
        <p>{b.text}</p>
        {props.note && <em>{props.note}</em>}
      </div>
    </div>
  );
}
