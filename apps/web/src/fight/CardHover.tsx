// A big readable copy of whatever card the pointer is over (shop, rewards, deck screens).

import { COMBAT_DB } from '@sr/content/v2';
import type { CardDef } from '@sr/combat';
import { FightCard } from './FightCard';
import { keywordsOf } from './info';

export function CardHover(props: { def: CardDef | null }) {
  if (!props.def) return null;
  const keys = keywordsOf(props.def, (u) => COMBAT_DB.units[u]?.taunt === true);
  return (
    <div className="cardhover" aria-hidden>
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
      {props.def.upgrade && COMBAT_DB.cards[props.def.upgrade] && (
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
