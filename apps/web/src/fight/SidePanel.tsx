// What your Riftwalker has going beyond cards: the Lumen counter (beside Mana), the runes (a curved row under the hero)
// and the Auras in play. Each part only shows once it matters to the deck, so a Riftwalker without runes never sees an
// empty rune row.

import { cardText, type CombatDb, type SideView } from '@sr/combat';
import { RUNE_GLYPH } from './info';

/** The second resource, next to the Mana orb. */
export function LumenCounter(props: { value: number }) {
  return (
    <div
      className="fight__lumen"
      aria-label={`Lumen ${props.value}`}
      title="Lumen: a second resource. Some cards gain it and some spend it (shown as a gold badge on the card). It lasts the whole fight."
    >
      <span aria-hidden>★</span>
      <b>{props.value}</b>
      <small>Lumen</small>
    </div>
  );
}

/** The rune slots in a smile-shaped row below the hero, centred on `cx` (host px), starting `top` px down. */
export function RuneArc(props: { db: CombatDb; me: SideView; cx: number; top: number }) {
  const { db, me } = props;
  const n = Math.max(me.runeSlots, me.runes.length);
  if (n === 0) return null;
  const gap = 54;
  return (
    <div className="runearc" aria-label="Runes">
      {Array.from({ length: n }, (_, i) => {
        const r = me.runes[i];
        const def = r ? db.runes?.[r.rune] : undefined;
        const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1 .. 1
        const style = {
          left: props.cx + (i - (n - 1) / 2) * gap,
          top: props.top + (1 - t * t) * 26,
          transform: `translate(-50%, 0) rotate(${t * 14}deg)`,
        };
        return r ? (
          <span
            key={i}
            className={`rune rune--${r.rune}`}
            style={style}
            title={`${def?.name ?? r.rune}${r.charge ? ` (charge ${r.charge})` : ''}: ${def?.text ?? ''}`}
          >
            {RUNE_GLYPH[r.rune] ?? '◆'}
            {r.charge > 0 && <small>{r.charge}</small>}
          </span>
        ) : (
          <span key={i} className="rune rune--empty" style={style} title="An empty rune slot" />
        );
      })}
    </div>
  );
}

/** Auras (Powers) in play, as a small list at the top left. */
export function AuraList(props: { db: CombatDb; me: SideView }) {
  const { db, me } = props;
  if (me.powers.length === 0) return null;
  return (
    <div className="fight__aux" aria-label="Auras in play">
      <div className="aux aux--powers">
        {me.powers.map((p) => {
          const c = db.cards[p.card];
          return (
            <span key={p.id} className="aux__power" title={c ? cardText(db, c) : ''}>
              {c?.name ?? 'Aura'}
            </span>
          );
        })}
      </div>
    </div>
  );
}
