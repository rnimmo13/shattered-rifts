// A big readable copy of whatever card the pointer is over (shop, rewards, deck screens).

import { COMBAT_DB } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import { FightCard } from './FightCard';
import { keywordsOf } from './info';
import './cardhover.css';

/** Where the pointer is: the rectangle of the card being hovered, so the preview can sit beside it instead of over everything. */
export interface Anchor {
  left: number;
  right: number;
  top: number;
}

const PREVIEW_W = 330;
const PREVIEW_H = 480;

function beside(at: Anchor): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // to the right of the card when there is room, otherwise to its left; never off the screen
  const left =
    vw - at.right >= PREVIEW_W + 24 ? at.right + 12 : Math.max(8, at.left - PREVIEW_W - 12);
  const top = Math.max(8, Math.min(at.top - 30, vh - PREVIEW_H - 8));
  return { left, top, right: 'auto', bottom: 'auto' };
}

export function CardHover(props: { def: CardDef | null; at?: Anchor | null; plus?: boolean }) {
  if (!props.def) return null;
  const showPlus = props.plus ?? !props.at;
  const keys = keywordsOf(props.def, (u) => COMBAT_DB.units[u]?.taunt === true);
  return (
    <div className="cardhover" aria-hidden style={props.at ? beside(props.at) : undefined}>
      <div className="cardhover__main">
        <FightCard db={COMBAT_DB} def={props.def} width={330} />
        {keys.length > 0 && (
          <ul className="cardhover__keys">
            {keys.map((k) => (
              <li key={k.name}>
                <b>{k.name}</b> {k.text}
              </li>
            ))}
          </ul>
        )}
      </div>
      {showPlus && props.def.upgrade && COMBAT_DB.cards[props.def.upgrade] && (
        <div className="cardhover__plus">
          <small>Upgraded</small>
          <FightCard
            db={COMBAT_DB}
            def={COMBAT_DB.cards[props.def.upgrade] as CardDef}
            width={330}
          />
        </div>
      )}
    </div>
  );
}
