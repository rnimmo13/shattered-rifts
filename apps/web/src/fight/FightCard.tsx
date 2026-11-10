import { forwardRef, memo, useContext, useMemo, useState, type CSSProperties } from 'react';
import { HpCostMult } from './hpCost';
import {
  ELEMENTS,
  cardText,
  forgeLabel,
  type CardDef,
  type CombatDb,
  type Element,
  type LiveDamage,
} from '@sr/combat';
import { RIFTWALKERS } from '@sr/content/v2';
import { CARD_H, CARD_W } from '../cards/size';
import { markRollDiff, parseRules } from '../cards/cardText';
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
  /\b(Barrier|Exposed|Faltering|Might|Bleed|Shocked|Thorns|Shielded|Exhaust|Retain|Mana|Spirit|Edge|Fervor|Serene|Fury|Radiant|Spell Power|Fracture|Shatters?|Swords?|Spells?|Grows|Keen|Foresee|Sharpen|Sharpened|Precision|Consume|Lifesteal|Hold|Defer|Max Reserves|Reserves|Opening hand|Free Attack|Free Skill|Point Blank|Brittle|Ghostly|Steadfast|Cadence|Fate|Mirrored|Debilitated|Noose|Quarry|Unbound|Fortified|Plating|Hangover|Holdfast|Sapped|Cruelty|Sturdy|Unmovable|Hemorrhage|Honed|Fanned|Tracking|Guarded|Blur|Meld|Poised|Strangled|Planner|Premeditate|Stagger|Taunt|Fleeting|Unplayable|Traps?|Burn|Reverb|Wounds?|Voids?|Dry Tinder|Tinder|Owl Charge|Buffer|Bracing|Primed|Totems?|Hawks?|Bears?|Thunderbirds?|Elder Trees?|Moon Owls?)\b/g;

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

function rulesFor(
  db: CombatDb,
  c: CardDef,
  live?: ReadonlyMap<number, LiveDamage>,
  hpCostMult = 1,
): string {
  let text = cardText(db, c, live, { hpCostMult });
  const plainId = c.id.replace(/^(hi|lo)~/, '');
  const plain = plainId !== c.id ? db.cards[plainId] : undefined;
  if (plain) {
    // (the live numbers stand aside while the roll is compared, both texts losing the same ones, and come back after)
    const LIVE = /\[\[live:[^\]]+\]\]/g;
    const held = text.match(LIVE) ?? [];
    const HOLD = '\u0001';
    const base = cardText(db, plain, live, { hpCostMult }).replace(LIVE, HOLD);
    const parts = markRollDiff(text.replace(LIVE, HOLD), base).split(HOLD);
    text = parts.map((p, k) => p + (k < parts.length - 1 ? (held[k] ?? '') : '')).join('');
  }
  // (the element is the badge in the top right, with its own tip: the word is left off the face, DECISIONS #447)
  // (only the word standing as its own sentence: "Add a Gathering Storm." keeps its Storm)
  const el = ELEMENTS.find((e) => c.tags?.includes(e));
  if (el) {
    const word = el[0]!.toUpperCase() + el.slice(1);
    text = text.replace(new RegExp(`(^|[.)]\\s)${word}\\.(?:\\s|$)`), '$1').trim();
  }
  // (the Spellblade's kinds are badges there too, DECISIONS #481)
  const kind = kindOf(c);
  if (kind) {
    const word = KIND_NAME[kind];
    text = text.replace(new RegExp(`(^|[.)]\\s)${word}\\.(?:\\s|$)`), '$1').trim();
  }
  return text.replace(KEYWORDS, '**$1**');
}

/**
 * A card's kind as a badge like the Shaman's elements: the Spellblade's Swords and Spells (DECISIONS #481), a blade and a four-point
 * star, and the Drunkard's guns (DECISIONS #681), a shotgun shell.
 */
type Kind = 'sword' | 'spell' | 'gun' | 'command';
const kindOf = (c: Pick<CardDef, 'tags'>): Kind | null =>
  c.tags?.includes('sword')
    ? 'sword'
    : c.tags?.includes('spell')
      ? 'spell'
      : c.tags?.includes('gun')
        ? 'gun'
        : c.tags?.includes('command')
          ? 'command'
          : null;
const KIND_NAME: Record<Kind, string> = {
  sword: 'Sword',
  spell: 'Spell',
  gun: 'Gun',
  command: 'Command',
};
const KIND_OWNER: Record<Kind, string> = {
  sword: 'Spellblade',
  spell: 'Spellblade',
  gun: 'Drunkard',
  command: 'Necromancer, Engineer, Hunter',
};
const KIND_TEXT: Record<Kind, string> = {
  sword:
    'A sword strike. Most strike more times the more Spell Power you hold, and swinging spends none. Might and Primed add to every hit (half on a Sword that hits 3 or more times).',
  spell:
    'A magic card. Some Swords and Auras pay off when you play a Spell first: earlier this turn, or straight before them.',
  gun: 'A gun shot: the Old Twelve Gauge, every shell, and the other cards that fire. Cards that answer "whenever you play a gun" (The Twelve-Gauge Opera, Gun Oil) answer this one.',
  command:
    'A Command: it orders your companions to strike or act. Cards that count Commands (Death Grip) count this one.',
};
function KindIcon({ kind }: { kind: Kind }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      {kind === 'sword' ? (
        <path d="M20.5 2 21.9 3.4 21 8l-9.6 9.6 1.5 1.5-1.4 1.4-2.1-2.1-3.3 3.3-1.8.3-1-1 .3-1.8 3.3-3.3-2.1-2.1 1.4-1.4 1.5 1.5L16 3l4.5-1Z" />
      ) : kind === 'command' ? (
        // (an open hand, raised to order the dead: Robert 2026-11-08)
        <path d="M6 11V5.5a1.5 1.5 0 0 1 3 0V10h.5V3.5a1.5 1.5 0 0 1 3 0V10h.5V4.5a1.5 1.5 0 0 1 3 0V11h.5V7.5a1.5 1.5 0 0 1 3 0V14c0 4.4-3.1 8-7 8s-7-2.6-7-6.5V11Z" />
      ) : kind === 'spell' ? (
        <path d="M12 2c.8 5.6 3.4 8.6 10 10-6.6 1.4-9.2 4.4-10 10-.8-5.6-3.4-8.6-10-10 6.6-1.4 9.2-4.4 10-10Z" />
      ) : (
        // (a shotgun shell standing on its brass)
        <path d="M8.5 3.5C8.5 2.7 9.2 2 10 2h4c.8 0 1.5.7 1.5 1.5V15h-7V3.5ZM7 16.5h10v3c0 1.4-1.1 2.5-2.5 2.5h-5A2.5 2.5 0 0 1 7 19.5v-3Zm3-11h4v2h-4v-2Zm0 4h4v2h-4v-2Z" />
      )}
    </svg>
  );
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

/** Narrower than this (px), a card's rules are set larger for their size, so a phone's hand can be read (card.css). */
const SMALL_CARD = 130;

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
    const hpCostMult = useContext(HpCostMult);
    const text = useMemo(
      // (a sharpened card in your hand shows the sharpened damage itself; anywhere else the text says how much was added)
      () =>
        rulesFor(db, def, live, hpCostMult) +
        (bonus && !(live && [...live.values()].some((l) => !l.barrier && !l.shatter))
          ? ` ${forgeLabel(def.forgeWord ?? 'Sharpen')}: +${bonus}.`
          : '') +
        (note ? ` ${note.replace(KEYWORDS, '**$1**')}` : ''),
      [db, def, bonus, live, note, hpCostMult],
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
    const kind = kindOf(def);
    const rarity = def.rarity === 'basic' || !def.rarity ? 'common' : def.rarity;
    const rarityRaw = def.rarity ?? 'common';
    const upgraded = def.id.endsWith('+');
    const realm = def.realm === 'junk' || !def.realm ? 'neutral' : def.realm;
    // a class colour: the owner's, or Neutral grey (Warden gifts keep their realm's colours)
    const owner = def.hero && !def.source?.startsWith('boss:') ? def.hero : undefined;
    const frame = useMemo(() => frameOf(db, def), [db, def]);
    const style = { '--k': k, width, height: width * (CARD_H / CARD_W) } as CSSProperties;
    return (
      <div
        ref={ref}
        className={`card card--${realm}${owner ? ` card--hero-${owner}` : ''} card--${rarity} card--rar-${rarityRaw}${upgraded ? ' card--upgraded' : ''}${width < SMALL_CARD ? ' card--small' : ''}${element || kind ? ' card--element' : ''}${bonus ? ' card--sharpened' : ''}${playable ? ' is-playable' : ''}${dimmed ? ' is-dimmed' : ''}`}
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
          {kind && (
            <div
              className={`card__element card__element--${kind}`}
              aria-label={KIND_NAME[kind]}
              {...tipAttrs({
                kicker: KIND_OWNER[kind],
                title: KIND_NAME[kind],
                text: KIND_TEXT[kind],
              })}
            >
              <KindIcon kind={kind} />
            </div>
          )}
          {def.starCost || def.starX || def.starHalf ? (
            <div
              className={`card__stars card__stars--power${def.starHalf ? ' card__stars--half' : ''}`}
              aria-label={
                def.starX
                  ? 'Spends all your Spell Power'
                  : def.starHalf
                    ? 'Spends half your Spell Power'
                    : `Costs ${def.starCost} Spell Power`
              }
            >
              <span>{def.starX ? 'X' : def.starHalf ? 'X/2' : def.starCost}</span>
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
                title={`${FRAME_NAME[frame]}: takes ${frame} companion slot${frame === 1 ? '' : 's'}`}
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
