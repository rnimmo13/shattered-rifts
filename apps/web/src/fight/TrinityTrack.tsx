// The Shaman's Trinity on the battle screen (DECISIONS #420), shown the way the Trickster's Suits are (SuitTrack.tsx, Robert
// 2026-10-29): three pips, Flame, Frost and Storm, that light as he casts a spell of each element this turn. The card being aimed or
// hovered shows which pip it would light. When all three are lit the row flares: Trinity, 1 Spirit. Presentation only: the elements
// come from the combat view.

import type { Element } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { ELEMENT_LOOK } from './elementLook';

const ORDER: readonly Element[] = ['flame', 'frost', 'storm'];

export function TrinityTrack(props: {
  /** the elements cast this turn */
  cast: readonly Element[];
  /** Trinity has triggered this turn */
  done: boolean;
  /** the element the card under the pointer would light (prism: the first one not lit) */
  preview?: Element | 'prism' | null;
}) {
  const prism = props.preview === 'prism' ? ORDER.find((e) => !props.cast.includes(e)) : null;
  return (
    <div
      className={`suittrack trinitytrack${props.done ? ' is-full' : ''}`}
      role="group"
      aria-label={`Trinity: ${props.cast.length} of 3 elements cast this turn${props.done ? ', Trinity, 1 Spirit' : ''}`}
      {...tipAttrs({
        kicker: 'Trinity',
        title: props.done ? 'Trinity! +1 Spirit' : `${props.cast.length} of 3 elements this turn`,
        text: 'Cast a Flame, a Frost and a Storm spell in one turn for Trinity: 1 Spirit, the first time each turn. Spirit never goes down. The pips clear when your next turn begins.',
      })}
    >
      {ORDER.map((e) => {
        const lit = props.cast.includes(e);
        const next = !lit && (props.preview === e || prism === e);
        return (
          <span
            key={e}
            className={`suitpip trinitypip--${e}${lit ? ' is-lit' : ''}${next ? ' is-next' : ''}`}
            aria-label={`${ELEMENT_LOOK[e].name}${lit ? ': cast' : ''}`}
          >
            <span aria-hidden="true">{ELEMENT_LOOK[e].glyph}</span>
          </span>
        );
      })}
      {props.done && <small className="trinitytrack__label">Trinity +1 Spirit</small>}
    </div>
  );
}
