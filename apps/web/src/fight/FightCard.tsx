import { forwardRef, memo, useMemo, type CSSProperties } from 'react';
import { cardText, type CardDef, type CombatDb } from '@sr/combat';
import { CARD_H, CARD_W } from '../cards/size';
import { parseRules } from '../cards/cardText';
import { RIFTWALKERS } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { cardArtV2 } from './art';
import '../cards/card.css';

const KIND_LABEL: Record<CardDef['kind'], string> = {
  attack: 'Attack',
  skill: 'Skill',
  power: 'Aura',
  summon: 'Summon',
  snare: 'Snare',
};

const RARITY_LABEL: Record<string, string> = {
  basic: 'Basic',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
  ancestral: 'Ancestral',
};

const KEYWORDS =
  /\b(Barrier|Exposed|Faltering|Might|Bleed|Stunned|Thorns|Shielded|Exhaust|Retain|Mana|Resonance|Edge|Fervor|Serene|Fury|Radiant|Lumen|Foresee|Sharpen|Sharpened|Consume|Hold|Fleeting|Unplayable)\b/g;

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
  /** the forge bonus this copy carries (shown, because the card text alone cannot) */
  bonus?: number;
  /** what it costs right now, when that differs from the printed cost */
  cost?: number;
}

/** A Combat v2 card, drawn with the shared card frame (same canonical size and scaling as every other card). */
export const FightCard = memo(
  forwardRef<HTMLDivElement, FightCardProps>(function FightCard(
    { db, def, width, playable, dimmed, bonus, cost },
    ref,
  ) {
    const k = width / CARD_W;
    const art = useMemo(() => cardArtV2(def), [def]);
    const text = useMemo(
      () => rulesFor(db, def) + (bonus ? ` Sharpened: +${bonus}.` : ''),
      [db, def, bonus],
    );
    const runs = useMemo(() => parseRules(text), [text]);
    const n = text.replace(/\*\*/g, '').length;
    const size = n <= 55 ? 's' : n <= 110 ? 'm' : n <= 170 ? 'l' : 'xl';
    const rarity = def.rarity === 'basic' || !def.rarity ? 'common' : def.rarity;
    const rarityRaw = def.rarity ?? 'common';
    const upgraded = def.id.endsWith('+');
    const realm = def.realm === 'junk' || !def.realm ? 'neutral' : def.realm;
    // a class colour: the owner's, or Neutral grey (Warden gifts keep their realm's colours)
    const owner = def.hero && !def.source?.startsWith('boss:') ? def.hero : undefined;
    const style = { '--k': k, width, height: width * (CARD_H / CARD_W) } as CSSProperties;
    return (
      <div
        ref={ref}
        className={`card card--${realm}${owner ? ` card--hero-${owner}` : ''} card--${rarity} card--rar-${rarityRaw}${upgraded ? ' card--upgraded' : ''}${playable ? ' is-playable' : ''}${dimmed ? ' is-dimmed' : ''}`}
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
          <div className="card__cost" aria-label={`Cost ${def.x ? 'X' : (cost ?? def.cost)}`}>
            <span>{def.x ? 'X' : (cost ?? def.cost)}</span>
          </div>
          {def.starCost ? (
            <div className="card__stars" aria-label={`Costs ${def.starCost} Lumen`}>
              <span>★ {def.starCost}</span>
            </div>
          ) : null}
          <div className="card__type">
            {KIND_LABEL[def.kind]}
            <span className="card__rar"> · {RARITY_LABEL[rarityRaw] ?? rarityRaw}</span>
          </div>
          <div className={`card__rules card__rules--${size}`}>
            <p>
              {runs.map((r, i) =>
                r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>,
              )}
            </p>
          </div>
          {owner && Object.hasOwn(RIFTWALKERS, owner) && (
            <div
              className="card__owner"
              title={RIFTWALKERS[owner as keyof typeof RIFTWALKERS].hero.name}
            >
              <HeroIcon hero={owner} size={118} tone="dark" />
            </div>
          )}
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
