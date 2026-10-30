// The Shaman's totems on the stage (DECISIONS #439): his positions in an arc to the left of him (to the right of an opponent's, who
// faces the other way), in order: the front one, the next a command makes act, nearest the top and marked Next, each with its order
// number. Every totem shows what it does now, with his Spirit counted: what it does each turn, and what its spirit does when it acts
// (commanded, or pushed out of a full row) and leaves. Hover for its full text. A commanded totem's spirit rises from its position.
// Presentation only: the totems, their numbers and the order come from the combat view and the totems' own data.

import type { CombatDb, Op, TotemDef } from '@sr/combat';
import { tipAttrs } from '../ui/tip';
import { useTotemArt } from './totemArt';
import { totemLook } from './totemLook';

/** a totem commanded just now: its spirit shows over its position for a moment (`key` tells two commands of the same totem apart) */
export interface TotemSummon {
  totem: number;
  spirit: string;
  key: number;
}

/** The number an op shows, with Spirit counted where it scales with Spirit ("2 (+1 per Spirit)" reads 2 + Spirit). */
const num = (
  o: { amount: number; scale?: { by: string; mult?: number } },
  spirit: number,
): number => o.amount + (o.scale?.by === 'spirit' ? Math.floor(spirit * (o.scale.mult ?? 1)) : 0);

/** What a totem's ops do, short: "⚔3 ×2", "⚔8 all", "🛡6", "2 Primed", "+1 Spirit", "+2 Mana". */
function totemChips(ops: readonly Op[], spirit: number): string[] {
  const out: string[] = [];
  for (const o of ops) {
    if (o.op === 'when') out.push(...totemChips(o.ops, spirit));
    else if (o.op === 'damage') {
      const n = num(o, spirit);
      const spread = o.distinct && o.to === 'randomFoe' && (o.hits ?? 1) > 1;
      out.push(
        o.to === 'allFoes'
          ? `⚔${n} all`
          : spread
            ? `⚔${n} ×${o.hits}`
            : `⚔${n}${(o.hits ?? 1) > 1 ? ` ×${o.hits}` : ''}`,
      );
    } else if (o.op === 'barrier') out.push(`🛡${num(o, spirit)}`);
    else if (o.op === 'mana') out.push(`+${o.amount} Mana`);
    else if (o.op === 'status') {
      const n = num(o, spirit);
      if (o.status === 'vigor') out.push(`${n} Primed`);
      else if (o.status === 'spirit') out.push(`+${n} Spirit`);
      else if (o.status === 'spellcut') out.push('spell −1');
      else if (o.status === 'twinspell') out.push('spell ×2');
      else out.push(`${n} ${o.status}`);
    }
  }
  return out;
}

export function TotemArc(props: {
  db: CombatDb;
  totems: readonly (string | null)[];
  spirit: number;
  summon?: TotemSummon | null;
  /** host px: the arc's centre line (it bows out from here) and its vertical centre */
  x: number;
  cy: number;
  /** the size of one position, px (from the hero's height) */
  size: number;
  /** an opponent's arc, to the right of their hero, bowing the other way */
  mirror?: boolean;
}) {
  const art = useTotemArt();
  const n = props.totems.length;
  if (n === 0) return null;
  const s = props.size;
  const gap = s * 1.02;
  const dir = props.mirror ? 1 : -1;
  // (each position on the arc: the middle bows out away from the hero, the ends curl back towards him)
  const at = (i: number): { left: number; top: number; tilt: number } => {
    const t = n === 1 ? 0 : (i / (n - 1)) * 2 - 1; // -1 .. 1
    return {
      left: props.x + dir * (1 - t * t) * s * 0.45,
      top: props.cy + (i - (n - 1) / 2) * gap,
      tilt: -dir * t * 10,
    };
  };
  const help = Math.floor(props.spirit / 2);
  const spot = props.summon ? at(props.summon.totem) : null;
  return (
    <div
      className={`totemarc${props.mirror ? ' totemarc--mirror' : ''}`}
      aria-label="Totems, in order"
    >
      {props.totems.map((kind, i) => {
        const p = at(i);
        const def: TotemDef | undefined = kind ? props.db.totems?.[kind] : undefined;
        const look = kind ? totemLook(kind) : null;
        const pic = kind ? art.totems[kind] : undefined;
        const each = def?.passive ? totemChips(def.passive.ops, props.spirit) : [];
        const acts = def ? totemChips(def.command, props.spirit) : [];
        const live = def
          ? def.text.replace(/(\d+) \(\+1 per Spirit\)/g, (_, k: string) =>
              String(Number(k) + props.spirit),
            )
          : '';
        const next = i === 0 && !!kind;
        return (
          <div
            key={i}
            className={`totemarc__spot${kind ? ` totemarc__spot--${kind}` : ' is-empty'}${next ? ' is-next' : ''}`}
            style={{
              left: p.left,
              top: p.top,
              width: s,
              height: s,
              transform: `translate(-50%, -50%) rotate(${p.tilt}deg)`,
            }}
            aria-label={
              def && look
                ? `${i + 1}${next ? ', next to act' : ''}: ${look.name}. ${live}`
                : `Position ${i + 1}: empty`
            }
            {...(def && look
              ? tipAttrs({
                  kicker: next ? `Totem ${i + 1} · next to act` : `Totem ${i + 1}`,
                  title: look.name,
                  text: live,
                  // (what a totem is at all, under its own words: DECISIONS #448)
                  lines: [
                    {
                      title: 'Totems',
                      text: 'Each works every turn while it stands. A command makes the front totem act once more, and it is gone; planting into a full row pushes the front one out (it acts as it goes). Every Spirit adds 1 to their numbers (not the Elder Tree’s or the Moon Owl’s).',
                    },
                  ],
                })
              : tipAttrs({
                  kicker: `Totem position ${i + 1}`,
                  title: 'Empty',
                  text: 'A card that plants a totem puts it at the back of the row.',
                }))}
          >
            <span className="totemarc__order" aria-hidden="true">
              {next ? 'NEXT' : i + 1}
            </span>
            {pic ? (
              <img className="totemarc__img" src={pic} alt="" draggable={false} />
            ) : (
              <b className="totemarc__glyph" aria-hidden="true">
                {look ? look.glyph : ''}
              </b>
            )}
            {def && (
              <span className="totemarc__nums" aria-hidden="true">
                {each.length > 0 && (
                  <span className="totemarc__each" title="each turn">
                    ↻ {each.join(' ')}
                  </span>
                )}
                {acts.length > 0 && (
                  <span className="totemarc__acts" title="when it acts">
                    ✦ {acts.join(' ')}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}
      {props.summon && spot && (
        <span
          key={props.summon.key}
          className="totemarc__spirit"
          aria-hidden="true"
          style={{ left: spot.left, top: spot.top, width: s * 1.8, height: s * 1.8 }}
        >
          {art.spirits[props.summon.spirit] ? (
            <img src={art.spirits[props.summon.spirit]} alt="" draggable={false} />
          ) : (
            <b>{totemLook(props.summon.spirit).glyph}</b>
          )}
        </span>
      )}
      <div
        className={`totemarc__spiritBadge${props.spirit > 0 ? ' is-lit' : ''}`}
        style={{ left: at(n - 1).left, top: at(n - 1).top + s * 0.78 }}
        aria-label={`Spirit ${props.spirit}: every totem number +${props.spirit}`}
        {...tipAttrs({
          kicker: 'Spirit',
          title: `${props.spirit} Spirit`,
          text: 'Never goes down. Each point adds 1 to every number on your totems (not the Elder Tree’s Mana or the Moon Owl). The Hawk gives 1 when it acts.',
        })}
      >
        <span className="totemarc__orb">{props.spirit}</span>
        <small>Spirit{help >= 0 ? '' : ''}</small>
      </div>
    </div>
  );
}
