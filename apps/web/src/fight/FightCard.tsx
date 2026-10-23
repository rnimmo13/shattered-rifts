import { forwardRef, memo, useMemo, type CSSProperties } from 'react';
import { cardText, type CardDef, type CombatDb } from '@sr/combat';
import { CARD_H, CARD_W } from '../cards/Card';
import { parseRules } from '../cards/cardText';
import { cardArtV2 } from './art';
import '../cards/card.css';

const KIND_LABEL: Record<CardDef['kind'], string> = {
  attack: 'Attack',
  skill: 'Skill',
  power: 'Power',
  summon: 'Summon',
  snare: 'Snare',
};

const KEYWORDS =
  /\b(Barrier|Exposed|Faltering|Might|Seared|Stunned|Thorns|Shielded|Exhaust|Retain|Mana)\b/g;

/** Rules text with the keywords marked **bold** for the card renderer. */
function rulesFor(db: CombatDb, c: CardDef): string {
  return cardText(db, c).replace(KEYWORDS, '**$1**');
}

export interface FightCardProps {
  db: CombatDb;
  def: CardDef;
  width: number;
  playable?: boolean;
  dimmed?: boolean;
}

/** A Combat v2 card, drawn with the shared card frame (same canonical size and scaling as every other card). */
export const FightCard = memo(
  forwardRef<HTMLDivElement, FightCardProps>(function FightCard(
    { db, def, width, playable, dimmed },
    ref,
  ) {
    const k = width / CARD_W;
    const art = useMemo(() => cardArtV2(def), [def]);
    const text = useMemo(() => rulesFor(db, def), [db, def]);
    const runs = useMemo(() => parseRules(text), [text]);
    const n = text.replace(/\*\*/g, '').length;
    const size = n <= 55 ? 's' : n <= 110 ? 'm' : n <= 170 ? 'l' : 'xl';
    const rarity = def.rarity === 'basic' || !def.rarity ? 'common' : def.rarity;
    const realm = def.realm === 'junk' || !def.realm ? 'neutral' : def.realm;
    const style = { '--k': k, width, height: width * (CARD_H / CARD_W) } as CSSProperties;
    return (
      <div
        ref={ref}
        className={`card card--${realm} card--${rarity}${playable ? ' is-playable' : ''}${dimmed ? ' is-dimmed' : ''}`}
        style={style}
        data-card={def.id}
      >
        <div className="card__face">
          <div className="card__art">
            <img src={art} alt="" draggable={false} decoding="async" />
            <div className="card__artShade" />
          </div>
          <div className="card__banner">
            <span className="card__name">{def.name}</span>
          </div>
          <div className="card__cost" aria-label={`Cost ${def.cost}`}>
            <span>{def.cost}</span>
          </div>
          <div className="card__type">{KIND_LABEL[def.kind]}</div>
          <div className={`card__rules card__rules--${size}`}>
            <p>
              {runs.map((r, i) =>
                r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>,
              )}
            </p>
          </div>
          <div className="card__gem" title={rarity} />
          <div className="card__fx card__fx--shimmer" />
          <div className="card__fx card__fx--holo" />
          <div className="card__fx card__fx--gloss" />
        </div>
        <div className="card__edge" />
      </div>
    );
  }),
);
