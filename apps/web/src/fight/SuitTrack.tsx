// The Trickster's Suits on the battle screen (DECISIONS #387): four pips, in a panel of their own in that side's column (#399),
// that light as each suit is played this turn. The card being aimed or hovered shows which pip it would light. When all four are
// lit the row flares: a Full Trick. Beside the pips, what the next Full Trick deals. Presentation only: the suits come from the combat view.

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
  /** the suit the card in hand under the pointer would light (a Wild card: the first one missing) */
  preview?: Suit | null;
  /** the Full Trick's damage and draw, for the tip */
  fullTrick?: string;
  /** what the next Full Trick deals, counting the ones made so far this fight */
  damage?: number;
}) {
  const full = props.shown.length === ORDER.length;
  const next =
    props.damage !== undefined ? `Your next Full Trick deals ${props.damage} damage. ` : '';
  return (
    <div
      className={`suittrack${full ? ' is-full' : ''}`}
      role="group"
      aria-label={`Suits this turn: ${props.shown.length} of 4${props.damage !== undefined ? `. Next Full Trick: ${props.damage} damage` : ''}`}
      {...tipAttrs({
        kicker: 'Suits',
        title: full ? 'Full Trick!' : `${props.shown.length} of 4 suits this turn`,
        text: `Every card you play shows its suit: ♠ Attacks, ♥ Barrier and protection, ♦ cards and Mana, ♣ Traps and debuffs. Play all four in one turn for a Full Trick${props.fullTrick ? `: ${props.fullTrick}` : ''}. ${next}The suits clear when your next turn begins.`,
      })}
    >
      {ORDER.map(({ suit, glyph, name }) => {
        const lit = props.shown.includes(suit);
        const next = !lit && props.preview === suit;
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
      {props.damage !== undefined && (
        <span className="suittrack__dmg" aria-hidden>
          <small>Trick</small>
          {props.damage}
        </span>
      )}
    </div>
  );
}
