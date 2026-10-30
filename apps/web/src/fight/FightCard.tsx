import { forwardRef, memo, useMemo, useState, type CSSProperties } from 'react';
import {
  ELEMENTS,
  cardText,
  forgeLabel,
  type CardDef,
  type CombatDb,
  type Element,
  type LiveDamage,
} from '@sr/combat';
import { CARD_H, CARD_W } from '../cards/size';
import { markRollDiff, parseRules } from '../cards/cardText';
import { BUILD_PATHS_SHOWN, RIFTWALKERS, pathName, pathOf, type HeroId } from '@sr/content/v2';
import { HeroIcon } from '../ui/HeroIcon';
import { cardArtV2, paintedCardArt } from './art';
import '../cards/card.css';
import { Arrow, WithArrows } from '../ui/Arrow';
import { STATUS_INFO } from './info';
import { tipAttrs } from '../ui/tip';

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
  /\b(Barrier|Exposed|Faltering|Might|Bleed|Stunned|Thorns|Shielded|Exhaust|Retain|Mana|Spirit|Edge|Fervor|Serene|Fury|Radiant|Arcana|Foresee|Sharpen|Sharpened|Precision|Consume|Lifesteal|Hold|Fleeting|Unplayable|Traps?)\b/g;

/**
 * Rules text with the keywords marked **bold** for the card renderer. A sanctified card ("hi~strike") also marks each number its roll
 * changed against the plain card, so the difference shows on the card itself.
 */
/** The biggest frame a card summons (1 Light, 2 Heavy, 3 Colossal: the companion slots it takes), or 0 when it summons nothing (#383). */
function frameOf(db: CombatDb, c: CardDef): number {
  let most = 0;
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    if (o['op'] === 'summon' && typeof o['unit'] === 'string')
      most = Math.max(most, db.units[o['unit']]?.slots ?? 1);
    Object.values(o).forEach(walk);
  };
  walk(c.effects);
  return Math.min(3, most);
}

const FRAME_NAME = ['', 'Light', 'Heavy', 'Colossal'];

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
  // (the element is the badge in the top right, with its own tip: the word is left off the face, DECISIONS #447)
  // (only the word standing as its own sentence: "Add a Gathering Storm." keeps its Storm)
  text = text.replace(/(^|[.)]\s)(?:Flame|Frost|Storm)\.(?:\s|$)/g, '$1').trim();
  return text.replace(KEYWORDS, '**$1**');
}

/** The Shaman's elements as a coloured badge in the card's top right (DECISIONS #447): a flame, a snowflake, a bolt. */
const ELEMENT_NAME: Record<Element, string> = { flame: 'Flame', frost: 'Frost', storm: 'Storm' };
const ELEMENT_TEXT: Record<Element, string> = {
  flame: 'Big hits on one enemy, and Burn.',
  frost: 'Barrier and Faltering.',
  storm:
    'Every enemy, or Forks (different random enemies, 25% more when only one stands), and Sapped.',
};
function ElementIcon({ el }: { el: Element }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {el === 'flame' ? (
        <path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.4 1.2-4 2.4-5.2.2 1.7 1 2.9 2.1 3.4C11 8.7 11.2 5.4 12 2Z" />
      ) : el === 'frost' ? (
        <g strokeWidth="2.2" strokeLinecap="round" fill="none" stroke="currentColor">
          <path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7" />
          <path d="m9 3.5 3 2.5 3-2.5M9 20.5l3-2.5 3 2.5M3.6 10.6l3.7-.7-1.2-3.6M17.9 17.7l-1.2-3.6 3.7-.7M6.1 17.7l1.2-3.6-3.7-.7M20.4 10.6l-3.7-.7 1.2-3.6" />
        </g>
      ) : (
        <path d="M13.5 2 5 13.5h5.5L9 22l9-12h-5.6L13.5 2Z" />
      )}
    </svg>
  );
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
  /** keywords another card gave this copy in the fight (Fleeting, Hold, Replay), added to its text */
  note?: string;
}

/** A Combat v2 card, drawn with the shared card frame (same canonical size and scaling as every other card). */
export const FightCard = memo(
  forwardRef<HTMLDivElement, FightCardProps>(function FightCard(
    { db, def, width, playable, dimmed, bonus, cost, live, note },
    ref,
  ) {
    const k = width / CARD_W;
    const art = useMemo(() => cardArtV2(def), [def]);
    // a picture that does not arrive (a dropped request, files swapped by a deploy) falls back to the painted one, never a blank
    const [artFailed, setArtFailed] = useState<string | null>(null);
    const shown = artFailed === def.id ? paintedCardArt(def) : art;
    const text = useMemo(
      // (a sharpened card in your hand shows the sharpened damage itself; anywhere else the text says how much was added)
      () =>
        rulesFor(db, def, live) +
        (bonus && !live?.size ? ` ${forgeLabel(def.forgeWord ?? 'Sharpen')}: +${bonus}.` : '') +
        (note ? ` ${note.replace(KEYWORDS, '**$1**')}` : ''),
      [db, def, bonus, live, note],
    );
    const runs = useMemo(() => parseRules(text), [text]);
    const n = text
      .replace(/\*\*/g, '')
      .replace(/\[\[(?:up|down):(\d+):\d+\]\]/g, '$1')
      .replace(/\[\[live:\w+:([\d-]+)\]\]/g, '$1').length;
    const size = n <= 55 ? 's' : n <= 110 ? 'm' : n <= 170 ? 'l' : 'xl';
    // how far the cost now is from the printed one (a cost change from a card, a Boon or Unbound): shown on the gem itself
    const costDelta = def.x || cost === undefined ? 0 : cost - def.cost;
    const element = ELEMENTS.find((e) => def.tags?.includes(e));
    const rarity = def.rarity === 'basic' || !def.rarity ? 'common' : def.rarity;
    const rarityRaw = def.rarity ?? 'common';
    const upgraded = def.id.endsWith('+');
    const realm = def.realm === 'junk' || !def.realm ? 'neutral' : def.realm;
    // a class colour: the owner's, or Neutral grey (Warden gifts keep their realm's colours)
    const owner = def.hero && !def.source?.startsWith('boss:') ? def.hero : undefined;
    const frame = useMemo(() => frameOf(db, def), [db, def]);
    const style = { '--k': k, width, height: width * (CARD_H / CARD_W) } as CSSProperties;
    // the build path the card belongs to, top right on the art; basics, glue and tokens have none (DECISIONS #342)
    const pathIdx =
      BUILD_PATHS_SHOWN && owner && Object.hasOwn(RIFTWALKERS, owner) ? pathOf(def.id) : undefined;
    const path = pathIdx === undefined ? null : pathName(owner as HeroId, pathIdx);
    return (
      <div
        ref={ref}
        className={`card card--${realm}${owner ? ` card--hero-${owner}` : ''} card--${rarity} card--rar-${rarityRaw}${upgraded ? ' card--upgraded' : ''}${element ? ' card--element' : ''}${bonus ? ' card--sharpened' : ''}${playable ? ' is-playable' : ''}${dimmed ? ' is-dimmed' : ''}`}
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
          {path && <div className="card__path">{path}</div>}
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
          {element && (
            <div
              className={`card__element card__element--${element}`}
              aria-label={`${ELEMENT_NAME[element]} spell`}
              {...tipAttrs({
                kicker: 'Shaman element',
                title: `${ELEMENT_NAME[element]} spell`,
                text: ELEMENT_TEXT[element],
              })}
            >
              <ElementIcon el={element} />
            </div>
          )}
          {def.starCost || def.starX ? (
            <div
              className="card__stars"
              aria-label={def.starX ? 'Spends all your Arcana' : `Costs ${def.starCost} Arcana`}
            >
              <span>◆ {def.starX ? 'X' : def.starCost}</span>
            </div>
          ) : null}
          {def.statusCost ? (
            <div
              className={`card__stars card__stars--${def.statusCost.status}`}
              aria-label={
                def.statusCost.x
                  ? `Spends all your ${STATUS_INFO[def.statusCost.status].name}`
                  : `Costs ${def.statusCost.amount} ${STATUS_INFO[def.statusCost.status].name}`
              }
            >
              <span>{def.statusCost.x ? 'X' : def.statusCost.amount}</span>
            </div>
          ) : null}
          <div className="card__type">
            {KIND_LABEL[def.kind]}
            {frame > 0 && (
              <span
                className="card__frame"
                title={`${FRAME_NAME[frame]}: takes ${frame} of your 3 companion slots`}
              >
                {' '}
                {'●'.repeat(frame)}
              </span>
            )}
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
            <div
              className="card__sharp"
              aria-label={`${forgeLabel(def.forgeWord ?? 'Sharpen')} +${bonus}`}
            >
              <Arrow dir="up" plain /> {forgeLabel(def.forgeWord ?? 'Sharpen')} +{bonus}
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
