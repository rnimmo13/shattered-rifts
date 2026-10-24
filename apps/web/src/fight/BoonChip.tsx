// A Boon: a medallion in a rarity colour with a symbol for what it does, and a tooltip with its name and effect.

import { COMBAT_DB } from '@sr/content/v2';
import { tipAttrs } from '../ui/tip';
import { RarityGem } from '../ui/RarityGem';
import { glyphOf } from './boonGlyph';

export function BoonChip(props: { id: string; size?: 'small' | 'large' }) {
  const b = COMBAT_DB.boons[props.id];
  if (!b) return null;
  return (
    <span
      className={`boon boon--${b.rarity}${props.size === 'large' ? ' boon--large' : ''}`}
      aria-label={`${b.name}: ${b.text}`}
      tabIndex={0}
      {...tipAttrs({
        kicker: `Boon (${b.rarity})`,
        title: b.name,
        tone: 'boon',
        text: b.text,
        hint: 'A passive that lasts the whole run.',
      })}
    >
      {glyphOf(b)}
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
        <small>
          <RarityGem rarity={b.rarity} />
          boon · {b.rarity}
        </small>
        <p>{b.text}</p>
        {props.note && <em>{props.note}</em>}
      </div>
    </div>
  );
}
