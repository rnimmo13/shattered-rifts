import { forwardRef, memo, useMemo, useState, type CSSProperties } from 'react';
import { cardText, type CardDef, type CombatDb, type LiveDamage } from '@sr/combat';
import { CARD_H, CARD_W } from '../cards/size';
import { markRollDiff, parseRules } from '../cards/cardText';
import { RIFTWALKERS } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { cardArtV2, paintedCardArt } from './art';
import '../cards/card.css';
import { Arrow, WithArrows } from '../ui/Arrow';

const KIND_LABEL: Record<CardDef['kind'], string> = {
  attack: 'Attack',
  skill: 'Skill',
  power: 'Aura',
  summon: 'Summon',
  snare: 'Trap',
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
  /\b(Barrier|Exposed|Faltering|Might|Bleed|Stunned|Thorns|Shielded|Exhaust|Retain|Mana|Spirit|Edge|Fervor|Serene|Fury|Radiant|Arcana|Foresee|Sharpen|Sharpened|Consume|Hold|Fleeting|Unplayable)\b/g;

/**
 * Rules text with the keywords marked **bold** for the card renderer. A sanctified card ("hi~strike") also marks each number its roll
 * changed against the plain card, so the difference shows on the card itself.
 */
function rulesFor(db: CombatDb, c: CardDef, live?: ReadonlyMap<number, LiveDamage>): string {
  let text = cardText(db, c, live);
  const plainId = c.id.replace(/^(hi|lo)~/, '');
  const plain = plainId !== c.id ? db.cards[plainId] : undefined;
  if (plain) {
    // (the live numbers stand aside while the roll is compared, both texts losing the same ones, and come back after)
    const LIVE = /\[\[live:[^\]]+\]\]/g;
    const held = text.match(LIVE) ?? [];
    const HOLD = '\u0001';
    const base = cardText(db, plain, live).replace(LIVE, HOLD);
    const parts = markRollDiff(text.replace(LIVE, HOLD), base).split(HOLD);
    text = parts.map((p, k) => p + (k < parts.length - 1 ? (held[k] ?? '') : '')).join('');
  }
  return text.replace(KEYWORDS, '**$1**');
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
  /** what its damage would really be right now (a card in your hand), by effect index: shown in place of the printed numbers */
  live?: ReadonlyMap<number, LiveDamage>;
}

/** A Combat v2 card, drawn with the shared card frame (same canonical size and scaling as every other card). */
export const FightCard = memo(
  forwardRef<HTMLDivElement, FightCardProps>(function FightCard(
    { db, def, width, playable, dimmed, bonus, cost, live },
    ref,
  ) {
    const k = width / CARD_W;
    const art = useMemo(() => cardArtV2(def), [def]);
    // a picture that does not arrive (a dropped request, files swapped by a deploy) falls back to the painted one, never a blank
    const [artFailed, setArtFailed] = useState<string | null>(null);
    const shown = artFailed === def.id ? paintedCardArt(def) : art;
    const text = useMemo(
      // (a sharpened card in your hand shows the sharpened damage itself; anywhere else the text says how much was added)
      () => rulesFor(db, def, live) + (bonus && !live?.size ? ` Sharpened: +${bonus}.` : ''),
      [db, def, bonus, live],
    );
    const runs = useMemo(() => parseRules(text), [text]);
    const n = text
      .replace(/\*\*/g, '')
      .replace(/\[\[(?:up|down):(\d+):\d+\]\]/g, '$1')
      .replace(/\[\[live:\w+:([\d-]+)\]\]/g, '$1').length;
    const size = n <= 55 ? 's' : n <= 110 ? 'm' : n <= 170 ? 'l' : 'xl';
    // how far the cost now is from the printed one (a cost change from a card, a Boon or Unbound): shown on the gem itself
    const costDelta = def.x || cost === undefined ? 0 : cost - def.cost;
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
        className={`card card--${realm}${owner ? ` card--hero-${owner}` : ''} card--${rarity} card--rar-${rarityRaw}${upgraded ? ' card--upgraded' : ''}${bonus ? ' card--sharpened' : ''}${playable ? ' is-playable' : ''}${dimmed ? ' is-dimmed' : ''}`}
        style={style}
        data-card={def.id}
      >
        <div className="card__face">
          <div className="card__art">
            <img
              src={shown}
              alt=""
              draggable={false}
              decoding="async"
              onError={() => setArtFailed(def.id)}
            />
            <div className="card__artShade" />
          </div>
          <div className="card__banner">
            <span className="card__name">
              <WithArrows text={def.name} />
            </span>
          </div>
          <div
            className={`card__cost${costDelta < 0 ? ' is-down' : costDelta > 0 ? ' is-up' : ''}`}
            aria-label={`Cost ${def.x ? 'X' : (cost ?? def.cost)}${costDelta < 0 ? `, ${-costDelta} less than printed` : costDelta > 0 ? `, ${costDelta} more than printed` : ''}`}
            title={
              costDelta === 0
                ? undefined
                : `Costs ${Math.abs(costDelta)} ${costDelta < 0 ? 'less' : 'more'} than printed (${def.cost})`
            }
          >
            <span>{def.x ? 'X' : (cost ?? def.cost)}</span>
            {costDelta !== 0 && (
              <i className="card__costmod" aria-hidden>
                <Arrow dir={costDelta < 0 ? 'down' : 'up'} plain />
              </i>
            )}
          </div>
          {def.starCost ? (
            <div className="card__stars" aria-label={`Costs ${def.starCost} Arcana`}>
              <span>◆ {def.starCost}</span>
            </div>
          ) : null}
          <div className="card__type">
            {KIND_LABEL[def.kind]}
            <span className="card__rar"> · {RARITY_LABEL[rarityRaw] ?? rarityRaw}</span>
          </div>
          <div className={`card__rules card__rules--${size}`}>
            <p>
              {runs.map((r, i) => {
                if (r.live) {
                  // what it would really deal now: green above the printed number, red below, a range when it depends on the enemy
                  return (
                    <span key={i} className={`card__live card__live--${r.live}`}>
                      {r.text}
                    </span>
                  );
                }
                if (r.roll) {
                  // a number the Sanctum changed: the new value in colour (green up, red down); the hover notes say what it was
                  return (
                    <span key={i} className={`card__roll card__roll--${r.roll.dir}`}>
                      {r.text}
                    </span>
                  );
                }
                return r.bold ? <strong key={i}>{r.text}</strong> : <span key={i}>{r.text}</span>;
              })}
            </p>
          </div>
          {owner && Object.hasOwn(RIFTWALKERS, owner) && (
            <div
              className="card__owner"
              title={RIFTWALKERS[owner as keyof typeof RIFTWALKERS].hero.name}
            >
              <HeroIcon hero={owner} size={92} tone="dark" />
            </div>
          )}
          {bonus ? (
            <div className="card__sharp" aria-label={`Sharpened by ${bonus}`}>
              <Arrow dir="up" plain /> Sharpened +{bonus}
            </div>
          ) : null}
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
