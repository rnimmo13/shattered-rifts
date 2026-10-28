// The Trickster's Suits on the battle screen (DECISIONS #387): four pips beside the hero, above and to the left of the figure,
// that light as each suit is played this turn. The card being aimed or hovered shows which pip it would light. When all four are
// lit the row flares: a Full Trick. Presentation only: the suits come from the combat view.

import type { Suit } from '@sr/combat';
import { tipAttrs } from '../ui/tip';

const ORDER: readonly { suit: Suit; glyph: string; name: string }[] = [
  { suit: 'spades', glyph: '♠', name: 'Spades (Attacks)' },
  { suit: 'hearts', glyph: '♥', name: 'Hearts (Barrier and protection)' },
  { suit: 'diamonds', glyph: '♦', name: 'Diamonds (cards, Mana, Foresee)' },
  { suit: 'clubs', glyph: '♣', name: 'Clubs (Traps and debuffs)' },
];

export function SuitTrack(props: {
  /** the suits showing this turn */
  shown: readonly Suit[];
  /** the suit the card in hand under the pointer would show (wild: every one) */
  preview?: Suit | 'wild' | null;
  /** host-relative px: the top-left corner of the hero's figure */
  x: number;
  y: number;
  /** the Full Trick's damage and draw, for the tip */
  fullTrick?: string;
}) {
  const full = props.shown.length === ORDER.length;
  return (
    <div
      className={`suittrack${full ? ' is-full' : ''}`}
      style={{ left: props.x, top: props.y }}
      role="group"
      aria-label={`Suits this turn: ${props.shown.length} of 4`}
      {...tipAttrs({
        kicker: 'Suits',
        title: full ? 'Full Trick!' : `${props.shown.length} of 4 suits this turn`,
        text: `Every card you play shows its suit: ♠ Attacks, ♥ Barrier and protection, ♦ cards and Mana, ♣ Traps and debuffs. Play all four in one turn for a Full Trick${props.fullTrick ? `: ${props.fullTrick}` : ''}. The suits clear when your next turn begins.`,
      })}
    >
      {ORDER.map(({ suit, glyph, name }) => {
        const lit = props.shown.includes(suit);
        const next = !lit && (props.preview === suit || props.preview === 'wild');
        return (
          <span
            key={suit}
            className={`suitpip suitpip--${suit}${lit ? ' is-lit' : ''}${next ? ' is-next' : ''}`}
            aria-label={`${name}${lit ? ': played' : ''}`}
          >
            {glyph}
          </span>
        );
      })}
    </div>
  );
}
