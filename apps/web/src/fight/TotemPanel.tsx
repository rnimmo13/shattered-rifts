// The Shaman's totems on the battle screen (DECISIONS #420, #421): his positions (three to start, up to five) and his Spirit. A totem
// helps the first spell of its element each turn and acts only when a card commands it, so the panel shows them; it has nothing to
// press. Presentation only: the totems come from the combat view.

import type { CombatDb } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { totemLook } from './totemLook';

export function TotemPanel(props: {
  db: CombatDb;
  totems: readonly (string | null)[];
  spirit: number;
}) {
  return (
    <div className="totems" role="group" aria-label="Totems">
      <div className="totems__row">
        {props.totems.map((kind, i) => {
          const def = kind ? props.db.totems?.[kind] : undefined;
          const look = kind ? totemLook(kind) : null;
          return (
            <span
              key={i}
              className={`totem${kind ? ` totem--${kind}` : ' is-empty'}`}
              aria-label={
                look && def
                  ? `${look.name} totem, position ${i + 1}. ${def.text}`
                  : `Position ${i + 1}: no totem`
              }
              {...(look && def
                ? tipAttrs({ kicker: 'Totem', title: look.name, text: def.text })
                : tipAttrs({
                    kicker: 'Totem position',
                    title: 'Empty',
                    text: 'A card that plants a totem puts it in the first empty position.',
                  }))}
            >
              <b aria-hidden="true">{look ? look.glyph : '·'}</b>
              <small>{look ? look.name : 'empty'}</small>
            </span>
          );
        })}
      </div>
      <div
        className="totems__spirit"
        {...tipAttrs({
          kicker: 'Spirit',
          title: `${props.spirit} Spirit`,
          text: 'Never goes down. Each point adds 1 to every command; every 2 add 1 to every totem’s help. Trinity gives 1 each turn it triggers.',
        })}
      >
        <span aria-hidden="true">◉</span>
        <small>Spirit {props.spirit}</small>
      </div>
    </div>
  );
}
