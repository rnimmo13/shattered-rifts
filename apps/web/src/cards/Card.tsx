import { forwardRef, memo, useMemo, type CSSProperties } from 'react';
import type { CardDef } from '@sr/engine';
import { cardArtUrl } from '../art/proceduralArt';
import { parseRules } from './cardText';
import './card.css';

export const CARD_W = 750;
export const CARD_H = 1050;

export interface CardProps {
  def: CardDef;
  /** rendered width in px (height follows the 5:7 frame) */
  width: number;
  playable?: boolean;
  /** show the card as unaffordable/unplayable */
  dimmed?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  unit: 'Unit',
  spell: 'Spell',
  trap: 'Trap',
  relic: 'Relic',
  rift: 'Rift',
  token: 'Token',
  sigil: 'Sigil',
};

/**
 * A card, drawn at a canonical 750×1050 and scaled so every size stays crisp and identical.
 * The root exposes --rx/--ry (tilt, degrees) and --mx/--my (pointer position 0..1) for the hand to drive.
 */
export const Card = memo(
  forwardRef<HTMLDivElement, CardProps>(function Card({ def, width, playable, dimmed }, ref) {
    const k = width / CARD_W;
    const art = useMemo(() => cardArtUrl(def), [def]);
    const runs = useMemo(() => parseRules(def.text), [def.text]);
    // longer rules text gets a smaller type size so it always fits the box
    const n = def.text.replace(/\*\*/g, '').length;
    const size = n <= 55 ? 's' : n <= 110 ? 'm' : n <= 170 ? 'l' : 'xl';
    const isUnit = def.type === 'unit' || def.type === 'token';
    const style = { '--k': k, width, height: width * (CARD_H / CARD_W) } as CSSProperties;
    return (
      <div
        ref={ref}
        className={`card card--${def.realm} card--${def.rarity}${playable ? ' is-playable' : ''}${dimmed ? ' is-dimmed' : ''}`}
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
          <div className="card__type">
            {TYPE_LABEL[def.type] ?? def.type}
            {def.tribes && def.tribes.length > 0 ? ` · ${def.tribes.join(' ')}` : ''}
          </div>
          <div className={`card__rules card__rules--${size}`}>
            <p>
              {runs.map((r, i) =>
                r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>,
              )}
            </p>
            {def.flavor && width >= 300 && <p className="card__flavor">{def.flavor}</p>}
          </div>
          {isUnit && (
            <>
              <div className="card__stat card__stat--guard" aria-label={`HP ${def.guard ?? 0}`}>
                <span>{def.guard ?? 0}</span>
                <small>HP</small>
              </div>
              <div className="card__stat card__stat--power" aria-label={`Damage ${def.power ?? 0}`}>
                <span>{def.power ?? 0}</span>
                <small>DMG</small>
              </div>
            </>
          )}
          <div className="card__gem" title={def.rarity} />
          <div className="card__fx card__fx--shimmer" />
          <div className="card__fx card__fx--holo" />
          <div className="card__fx card__fx--gloss" />
        </div>
        <div className="card__edge" />
      </div>
    );
  }),
);
