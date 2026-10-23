// What your Riftwalker has going beyond cards: Stars, the row of runes, and the Powers in play. Each part only appears
// once it is relevant to the deck, so a Riftwalker without runes never sees an empty rune row.

import { cardText, type CombatDb, type SideView } from '@sr/combat';
import { RUNE_GLYPH } from './info';

export function SidePanel(props: {
  db: CombatDb;
  me: SideView;
  showStars: boolean;
  showRunes: boolean;
}) {
  const { db, me } = props;
  const slots = Math.max(me.runeSlots, me.runes.length);
  return (
    <div className="fight__aux" aria-label="Your board">
      {props.showStars && (
        <span
          className="aux aux--stars"
          title="Lumen: a second resource. Cards gain and spend it; it lasts the whole fight."
        >
          ★ <b>{me.stars}</b>
        </span>
      )}
      {props.showRunes && (
        <div className="aux aux--runes" aria-label="Runes">
          {Array.from({ length: slots }, (_, i) => {
            const r = me.runes[i];
            const def = r ? db.runes?.[r.rune] : undefined;
            return r ? (
              <span
                key={i}
                className={`rune rune--${r.rune}`}
                title={`${def?.name ?? r.rune}${r.charge ? ` (charge ${r.charge})` : ''}: ${def?.text ?? ''}`}
              >
                {RUNE_GLYPH[r.rune] ?? '◆'}
                {r.charge > 0 && <small>{r.charge}</small>}
              </span>
            ) : (
              <span key={i} className="rune rune--empty" title="An empty rune slot" />
            );
          })}
        </div>
      )}
      {me.powers.length > 0 && (
        <div className="aux aux--powers" aria-label="Auras in play">
          {me.powers.map((p) => {
            const c = db.cards[p.card];
            return (
              <span key={p.id} className="aux__power" title={c ? cardText(db, c) : ''}>
                {c?.name ?? 'Aura'}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
