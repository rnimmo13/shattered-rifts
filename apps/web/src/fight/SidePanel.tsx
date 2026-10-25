// What your Riftwalker has going beyond cards: the Arcana counter (beside Mana), the totems (a curved column beside the hero)
// and the Auras in play. Each part only shows once it matters to the deck, so a Riftwalker without runes never sees an
// empty totem row.

import { emblemSvg } from '../art/emblems';
import { MAX_SNARES, cardText, type CombatDb, type SideView } from '@sr/combat';
import { tipAttrs, type TipContent } from '../ui/tip';
import { RUNE_GLYPH, UI_TIPS } from './info';

/** The second resource, next to the Mana orb. */
export function LumenCounter(props: { value: number }) {
  return (
    <div
      className="fight__lumen"
      aria-label={`Arcana ${props.value}`}
      {...tipAttrs(UI_TIPS.lumen(props.value))}
    >
      <span aria-hidden>◆</span>
      <b>{props.value}</b>
      <small>Arcana</small>
    </div>
  );
}

/** The totem slots in a curved column beside the hero (towards the enemies), so they never sit on the buffs under the health bar: `x` is where the column bows out to, `cy` its vertical centre (host px). */
export function RuneArc(props: {
  db: CombatDb;
  me: SideView;
  x: number;
  cy: number;
  /** the opponent's column, bowing the other way (towards you) */
  mirror?: boolean;
}) {
  const { db, me } = props;
  const n = Math.max(me.runeSlots, me.runes.length);
  if (n === 0) return null;
  const gap = 54;
  return (
    <div className="runearc" aria-label="Totems">
      {Array.from({ length: n }, (_, i) => {
        const r = me.runes[i];
        const def = r ? db.runes?.[r.rune] : undefined;
        const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1 .. 1
        const style = {
          left: props.x + (props.mirror ? 1 : -1) * t * t * 22,
          top: props.cy + (i - (n - 1) / 2) * gap,
          transform: `translate(-50%, -50%) rotate(${(props.mirror ? -1 : 1) * t * 14}deg)`,
        };
        return r ? (
          <span
            key={i}
            className={`rune rune--${r.rune}`}
            style={style}
            {...tipAttrs({
              kicker: 'Totem',
              title: `${def?.name ?? r.rune}${r.charge ? ` (charge ${r.charge})` : ''}`,
              text: def?.text ?? '',
            })}
          >
            {RUNE_GLYPH[r.rune] ?? '◆'}
            {r.charge > 0 && <small>{r.charge}</small>}
          </span>
        ) : (
          <span
            key={i}
            className="rune rune--empty"
            style={style}
            {...tipAttrs(UI_TIPS.emptyRune)}
          />
        );
      })}
    </div>
  );
}

/** Auras (Powers) in play, as a small list at the top left. */
/** Auras sit under the hero's plate (`x`, `top` in host px). */
export function AuraList(props: { db: CombatDb; me: SideView; x: number; top: number }) {
  const { db, me } = props;
  if (me.powers.length === 0) return null;
  return (
    <div
      className="fight__aux fight__aux--auras"
      style={{ left: props.x, top: props.top }}
      aria-label="Auras in play"
    >
      {me.powers.length > 5 && <div className="aux__count">Auras · {me.powers.length}</div>}
      <div className={`aux aux--powers${me.powers.length > 5 ? ' aux--scroll' : ''}`}>
        {me.powers.map((p) => {
          const c = db.cards[p.card];
          return (
            <span
              key={p.id}
              className="aux__power"
              {...tipAttrs({
                kicker: 'Aura',
                title: c?.name ?? 'Aura',
                text: c ? cardText(db, c) : '',
              })}
            >
              {c?.name ?? 'Aura'}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const TRIGGER_LABEL: Record<string, string> = {
  attacked: 'when attacked',
  hpLost: 'when hurt',
  foeSummons: 'on a summon',
  foeDefends: 'on Barrier',
  foeTurn: 'enemy turn',
};

/**
 * Face-down Traps laid as trap tiles on the floor in front of the hero: a violet trap plate with a web on it, a pulsing ring so
 * they cannot be missed, and what sets each one off written underneath ("when attacked"). Hover for what it does.
 */
export function SnareRow(props: {
  db: CombatDb;
  me: SideView;
  cx: number;
  top: number;
  /** how far right of the hero the row starts (further when the totem column is in the way) */
  dx?: number;
  /** the opponent's Traps (Arena): face-down tiles, set out toward the middle of the board from their hero */
  foe?: boolean;
  tip: (card: string | null) => TipContent;
}) {
  const { db, me } = props;
  if (me.snares.length === 0) return null;
  const gap = 66;
  // yours stand to the right of your hero, the opponent's to the left of theirs: both on the middle side
  const x0 = props.foe ? props.cx - (props.dx ?? 118) : props.cx + (props.dx ?? 118);
  const at = (i: number): number => (props.foe ? x0 - (i + 1) * gap : x0 + i * gap);
  return (
    <div className="snarerow" aria-label={props.foe ? "Your opponent's Traps (face down)" : 'Your Traps'}>
      <span
        className="snarerow__label"
        style={{ left: props.foe ? x0 - me.snares.length * gap : x0, top: props.top - 22 }}
      >
        {props.foe ? "Opponent's Traps" : 'Traps'} {me.snares.length}/{MAX_SNARES}
      </span>
      {me.snares.map((s, i) => {
        const def = s.card ? db.cards[s.card] : undefined;
        const on = def?.trigger?.on;
        return (
          <span
            key={s.id}
            className="snaretile"
            tabIndex={0}
            style={{ left: at(i), top: props.top }}
            {...tipAttrs(props.tip(s.card))}
          >
            <svg
              viewBox="0 0 64 64"
              aria-hidden
              dangerouslySetInnerHTML={{ __html: emblemSvg('web', '#e6d8ff') }}
            />
            <small>{on ? (TRIGGER_LABEL[on] ?? on) : 'trap'}</small>
          </span>
        );
      })}
    </div>
  );
}
