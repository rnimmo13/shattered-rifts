// The Combat v2 fight screen: the Pixi stage with the fighters in a line, DOM plates over them, the hand along the
// bottom, Mana, piles and End turn. It never decides a rule: it shows the engine's state, offers only legalActions(),
// and replays the engine's events one by one (display.ts) so numbers change exactly when the animation lands.

import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { enterBattle } from '../battleActivity';
import {
  applyAction,
  forgeWord,
  summonsThatFit,
  costOf,
  clone,
  cardText,
  opText,
  suitShown,
  createCombat,
  hashState,
  legalActions,
  viewFor,
  previewCardDamage,
  ON_OR_OFF,
  BLADE_TAG,
  EDGE_TAG,
  type LiveDamage,
  type Action,
  type CardDef,
  type CombatDb,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
  type CombatView,
  type HeroSetup,
  type Op,
  type Side,
  type Winner,
} from '@sr/combat';
import { COMBAT_DB, RIFTWALKERS, classTrait } from '@sr/content/v2';
import { BattlefieldScene } from '../duel/scene/BattlefieldScene';
import type { VenueId } from '../duel/scene/venue';
import { loadEffectsMode, loadGraphicsQuality, profileFor } from '../duel/effects';
import { useSettingsChanged, type SettingKind } from '../app/settings';
import { perfNote } from '../app/perfReport';
import { SettingsButton } from '../ui/SettingsButton';
import { LowGraphicsHint } from '../ui/LowGraphicsHint';
import { getBaseSpeed, setBaseSpeed } from '../duel/scene/timescale';
import { play } from '../audio/sfx';
import { DEFAULT_SPEED } from '../play/prefs';
import { handCardWidth, portraitHandBand } from '../hand/fanLayout';
import { reduceEvent, startingDisplay } from './display';
import {
  figureId,
  heroFigure,
  heroProp,
  hoverOf,
  isWardenFigure,
  prewarmCardArtV2,
  unitFigure,
  unitHeight,
} from './art';
import { FigureSession } from './figureSession';
import { FightHand, type HandCard } from './FightHand';
import { WardenRule } from './WardenRule';
import { playAnywayHelps, scrapChoices } from './scrapChoices';
import { FightCard } from './FightCard';
import { needsAim } from './targeting';
import { GrimoireModal } from './Grimoire';
import { AimArrow } from './AimArrow';
import { SuitTrack } from './SuitTrack';
import { EnchantSlots } from './EnchantSlots';
import { TotemArc, type TotemSummon } from './TotemArc';
import { FormPanel } from './FormPanel';
import { PileArt } from './PileArt';
import { UnitPlates, type Placed } from './Plates';
import { ErrorDetails } from '../ui/ErrorDetails';
import { selectionFormation } from './lineLayout';
import {
  COMPACT,
  PORTRAIT,
  boardReserve,
  figureScale,
  portraitMyY,
  foldsSide,
  frameFor,
  stageModeFor,
  type StageMode,
} from './stageLayout';
import { looksLikeNewVersion } from '../ui/errorReport';
import { keywordsOf, sanctifiedNote } from './info';
import { BoonPanel } from './BoonPanel';
import { mySkin } from '../cosmetics/cosmetics';
import { FloatPanel } from './FloatPanel';
import { CardTips } from './CardTips';
import { CardHover } from './CardHover';
import { preloadAllArt, preloadFigure, realSkinFigure } from '../art/assets';
import { PotionButton } from './PotionChip';
import { PickModal } from './PickModal';
import { isHandPick, pickStep, pickVerb, premeditateIn, prompt as pickPrompt } from './handPick';
import { tipAttrs, type TipContent } from '../ui/tip';
import { STATUS_INFO, UI_TIPS } from './info';
import { loadSeen, loadTipsOn, nextTip, saveSeen } from './tips';
import { AuraList, LumenCounter, ReservesCounter, RuneArc, SnareRow } from './SidePanel';
import { StanceAura, StanceChip } from './StanceAura';
import { ShieldBubble } from './ShieldBubble';
import { BattleLog } from './BattleLog';
import { LOG_LIMIT, Namer, createDescriber, type LogLine } from './logLines';
import { FlourishCard, type Flourish } from './FlourishCard';
import { useClearOfBelt } from './clearOfBelt';
import type { FighterSpec } from './Fighters';
import { attackFor, cardMotion } from './attackStyles';
import { loadWeaponArt } from './weaponArt';
import type { FeedItem, MoveFeed, PvpLink } from '../pvp/link';
import { replayFight, type FightMove, type FightReplay } from './recap';
import { FightRecap } from './FightRecap';
import { progressLabel } from '../pvp/deckLayout';
import { seriesLine } from '../pvp/seriesText';
import { TrophyBadges } from '../pvp/Trophies';
import type { RankBadge as RankBadgeData, TrophyCount } from '@sr/pvp';
import { RankBadge } from '../pvp/RankBadge';
import '../duel/duel.css';
import '../play/play.css';
import './fight.css';
import type { StatusId } from '@sr/combat';
import { hitFx, potionFx, potionHitsAllFoes, statusFx, tickOf, type FxId } from './fxMoments';
import {
  bump as bumpFx,
  centreOf,
  clearFx,
  trapJaws,
  flyCard,
  flyPicture,
  playFx,
  preloadFx,
  cardFxAt,
  loadCardFx,
  preloadCardFx,
  playCardFx,
  shake,
  swingIn,
  type Spot,
} from './fxPlayer';
import { PAINTED, iconUrl } from '../art/gameIcons';
import { cleansePreview } from './cleansePreview';

export interface FightResult {
  turns?: number;
  winner: Winner;
  /** your hero's HP when it ended (for HP that carries between fights) */
  hp: number;
  /** the potions you did not use */
  potions: string[];
  /** max HP your hero gained for good during the fight (Bloodfeast) */
  maxHpGained?: number;
  /** extra card rewards earned during the fight (Marked for Death) */
  extraRewards?: number;
  /** the fight as it was played (its setup and every move), to watch again or keep */
  replay?: FightReplay;
}

/** Watching a fight, not playing it: a replay, or someone else's match. Nobody here may act. */
export interface WatchMode {
  /** the moves, numbered from 1, as they are to be played (all at once for a replay, as they happen for a live match) */
  feed: MoveFeed;
  /** how many moves there are in all (a replay), so how it ended can be shown after the last; null for a live match */
  total: number | null;
  /** how a replay ended, when the engine alone cannot tell (a resignation, a missed clock) */
  end?: { winner: Side | 'draw'; reason: string } | null;
  /** someone else's live match: the hand of the seat watched from is not shown (no help can be passed to the other player) */
  hideHand?: boolean;
}

/** The replay screen, loaded only when a replay is watched. */
const ReplayPlayer = lazy(() => import('./ReplayPlayer'));
/** The pause between moves while watching (ms at normal speed), so each one can be followed. */
const WATCH_GAP = 450;
const WATCH_RATES = [1, 2, 4] as const;

interface Float {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: 'dmg' | 'block' | 'heal' | 'good' | 'bad';
}

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => window.setTimeout(r, Math.max(0, ms)));

/** Ordinary figures keep the same width cap at every population size; bosses retain their full scale. */
function fitHeight(canvas: HTMLCanvasElement, height: number, compactFigure: boolean): number {
  return !compactFigure ? height : Math.min(height, (MAX_FIGURE_W * canvas.height) / canvas.width);
}

const MAX_FIGURE_W = 300;
/** how far above the floor the top of a flyer's head may be (stage px) */
const MAX_TOP = 640;
/** where a side's line starts (nearest the middle) and the furthest it may reach, stage px */
// (pulled in from the edge, Robert 2026-10-30: the column of Boons, Omens and Auras on that side must never cover them; the group is
// a little smaller when it has to squeeze into the room that is left)
const FOE_NEAR = 990;
const FOE_FAR = 1840;
/** where the far edge of the enemy group stands: back toward their side, so a lone enemy stands where an Arena opponent would, but clear of that side's panel */
const ALLY_NEAR = 910;
const ALLY_FAR = 440;

/** A mirrored copy of a figure, for the opponent on the right in PvP (the art is drawn facing right). */
const mirrored = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
function mirror(c: HTMLCanvasElement): HTMLCanvasElement {
  let m = mirrored.get(c);
  if (!m) {
    m = document.createElement('canvas');
    m.width = c.width;
    m.height = c.height;
    const g = m.getContext('2d');
    if (g) {
      g.translate(c.width, 0);
      g.scale(-1, 1);
      g.drawImage(c, 0, 0);
    }
    mirrored.set(c, m);
  }
  return m;
}

/** In PvP the opponent's hero stands on the right, where yours stands on the left. */
const FOE_HERO_X = 1600;
const FOE_FAR_PVP = 1420;

/** Which way a result reads from the point of view of the seat you sit in ('a' = you). */
const shown = (w: Winner, me: Side): Winner => (w === 'draw' ? 'draw' : w === me ? 'a' : 'b');

/**
 * What stands where. `me` is the seat the player sits in: that side stands on the left (display side 'a'), the other on the
 * right (display side 'b'). Only the display side reaches the stage; unit ids stay the engine's.
 */
/** `skinOf`: the skin your own hero wears in this fight (none when watching someone else's match, DECISIONS #406). */
/** `mode`: the layout for the window (DECISIONS #443): smaller figures on a small screen, two rows on an upright one. */
function specsFrom(
  db: CombatDb,
  s: CombatState,
  me: Side = 'a',
  skinOf?: (hero: string) => string | undefined,
  mode: StageMode = 'wide',
  figures = new FigureSession<HTMLCanvasElement>(),
): FighterSpec[] {
  const out: FighterSpec[] = [];
  const pvp = s.mode === 'pvp';
  for (const side of ['a', 'b'] as const) {
    const ds: Side = side === me ? 'a' : 'b';
    // the opponent (and their companions) stand on the right and face left
    const flip = pvp && ds === 'b';
    const units = s.sides[side].units;
    // every figure's real size first: each side is then laid out from those widths, so nothing overlaps
    const sized = units.map((u) => {
      const hero = u.kind === 'hero';
      const flies = !hero && hoverOf(u.def) > 0;
      // (your own hero wears the skin you chose; the other side keeps its own look, DECISIONS #406)
      const raw = figures.get(u.id, hero ? u.def : figureId(u.def, u.maxHp), () =>
        hero
          ? heroFigure(u.def, side === me ? skinOf?.(u.def) : undefined)
          : unitFigure(u.def, u.maxHp),
      );
      const canvas = flip && u.kind !== 'enemy' ? mirror(raw) : raw;
      const k = figureScale(mode, hero);
      const height =
        fitHeight(
          canvas,
          unitHeight(db.units[u.def], u.kind, u.maxHp),
          !hero && u.def !== 'vorthax' && !isWardenFigure(u.def),
        ) * k;
      // Rows handle crowds; each flyer keeps its own altitude as others join or leave.
      const tier = flies ? 1 : 0;
      const hover = flies ? Math.min(hoverOf(u.def) * k, Math.max(30, MAX_TOP * k - height)) : 0;
      const width = (canvas.width * height) / canvas.height;
      return {
        u,
        boss: !hero && isWardenFigure(u.def),
        hero,
        canvas,
        height,
        hover,
        tier,
        fw: Math.max(width, mode === 'portrait' ? 180 : 200),
      };
    });
    const bosses = sized.filter((e) => e.boss);
    const line = sized.filter((e) => !e.hero && !e.boss);
    const upright = mode === 'portrait';
    const P = PORTRAIT;
    const bossWidth = Math.max(0, ...bosses.map((e) => e.fw));
    const bossX = upright
      ? Math.min(1220, P.x1 - bossWidth / 2 - 20)
      : Math.min(1690, 1880 - bossWidth / 2);
    const escortEdge = bossX - bossWidth / 2 - 32;
    const fit = upright
      ? ds === 'b'
        ? pvp
          ? selectionFormation(line, P.foeAllyNear, P.foeAllyFar)
          : selectionFormation(
              line,
              P.foeNearCrowd,
              bosses.length ? Math.max(P.foeNearCrowd + 200, escortEdge) : P.foeFar,
            )
        : selectionFormation(line, P.allyNear, P.allyFar)
      : ds === 'b'
        ? selectionFormation(
            line,
            FOE_NEAR,
            pvp ? FOE_FAR_PVP : bosses.length ? Math.max(FOE_NEAR + 200, escortEdge) : FOE_FAR,
          )
        : selectionFormation(line, ALLY_NEAR, mode === 'compact' ? COMPACT.allyFar : ALLY_FAR);
    let n = 0;
    for (const e of sized) {
      const prop = e.hero && !flip ? heroProp(e.u.def) : undefined;
      // the floating blade shows while a card tagged 'blade' is in her hand
      const holding = s.sides[side].hand.some((c) => db.cards[c.card]?.tags?.includes('blade'));
      const row = e.hero || e.boss ? 0 : (fit.rows[n] ?? 0);
      out.push({
        id: e.u.id,
        side: ds,
        isHero: e.hero,
        slot: e.hero ? 0 : n,
        count: line.length,
        ...(e.hero
          ? upright
            ? { x: flip ? P.foeHeroX : P.heroX }
            : flip
              ? { x: FOE_HERO_X }
              : mode === 'compact'
                ? { x: COMPACT.heroX }
                : {}
          : e.boss
            ? { x: bossX }
            : { x: fit.xs[n++] as number }),
        // (upright: the other side on the row behind, yours in front)
        ...(upright
          ? {
              y:
                ds === 'b'
                  ? P.foeY + (bosses.length && !e.boss ? 140 : 0) + row * 200
                  : portraitMyY() - row * 200,
            }
          : !e.hero
            ? { y: 830 + (bosses.length && !e.boss ? 60 : 0) - row * 220 }
            : {}),
        canvas: e.canvas,
        height: e.height * (e.hero || e.boss ? 1 : fit.scale),
        ...(e.hover > 0 ? { hover: e.hover * (e.boss ? 1 : fit.scale) } : {}),
        attack: attackFor(e.u.def, e.hero),
        ...(e.hero ? { hero: e.u.def } : {}),
        ...(prop ? { prop: { ...prop, on: holding } } : {}),
      });
    }
  }
  return out;
}

/** A player's name above their character in the Arena (with their progress and stance); it slides clear of the potion belt on a small screen. */
function WhoTag(props: {
  mine: boolean;
  x: number;
  y: number;
  name: string;
  progress: string;
  unit: Parameters<typeof StanceChip>[0]['unit'];
  trophies?: TrophyCount | undefined;
  rank?: RankBadgeData | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClearOfBelt(ref);
  return (
    <div
      ref={ref}
      className={`fight__who fight__who--${props.mine ? 'me' : 'foe'}`}
      // (centred on the figure, but kept on the screen when it stands near the edge)
      style={{ left: Math.max(72, Math.min(window.innerWidth - 72, props.x)), top: props.y }}
    >
      <b>
        {props.name} <TrophyBadges trophies={props.trophies} />
      </b>
      <small>
        {props.progress} <RankBadge rank={props.rank} />
      </small>
      <StanceChip unit={props.unit} />
    </div>
  );
}

/** The weapons Sharpen grows (the gun's is called Precision), shown as a buff on the hero (DECISIONS #399, #400; the Spellblade's
 * blade reads Spell Power now, not a Sharpen: DECISIONS #480). */
const SHARPENED = [{ card: 'old-twelve-gauge', name: 'The Old Twelve Gauge' }] as const;

/** How sharp a side's weapon is: its sharpest copy (a copy made later starts fresh, DECISIONS #441). */
function sharpOf(
  db: CombatDb,
  sd: CombatState['sides']['a'] | undefined,
): { weapon: string; word: string; amount: number } | null {
  if (!sd) return null;
  const cards = [...sd.hand, ...sd.draw, ...sd.discard, ...sd.exhausted];
  for (const weapon of SHARPENED) {
    const copies = cards.filter((c) => c.card.replace(/\+$/, '') === weapon.card);
    if (copies.length)
      return {
        weapon: weapon.name,
        word: forgeWord(db, weapon.card),
        amount: Math.max(0, ...copies.map((c) => c.bonus ?? 0)),
      };
  }
  return null;
}

const NONE_PICKED: string[] = [];

export function FightView(props: {
  /** Campaign's per-run clock; independent of Arena's turn/game clocks. */
  runTimer?: React.ReactNode;
  db: CombatDb;
  setup: CombatSetup;
  title: string;
  onDone: (r: FightResult) => void;
  onExit: () => void;
  exitLabel?: string;
  /** extra controls after the Leave button in the top bar (the campaign's Abandon run) */
  topExtra?: React.ReactNode;
  /** controls before the Leave button (the campaign's View map) */
  topFirst?: React.ReactNode;
  /** what is at stake, shown under the title for the whole fight (a Warden: the Resolve a loss would cost) */
  stakes?: { text: string; tone: 'info' | 'bad' };
  /** a Warden's rule, in a sentence */
  rule?: string;
  /** where the fight takes place (the Rift arena by default) */
  venue?: VenueId;
  /** a PvP match: you sit in one seat, the opponent's moves arrive from the server */
  pvp?: PvpLink;
  /** a campaign fight picked up again: the moves already made, replayed silently before the player carries on */
  resume?: Action[];
  /** every move the player makes in a campaign fight (kept so a reload can resume it) */
  onMove?: (a: Action) => void;
  /** the moves to resume could not be replayed (the rules changed under them): the fight starts again from the top */
  onResumeFailed?: () => void;
  /** watching (a replay or a live match) instead of playing */
  watch?: WatchMode;
  /** what the result's main button says (Continue, Next game, or when watching, the exit's label) */
  doneLabel?: string;
  /** more buttons on the result (the Arena's Share replay) */
  resultExtra?: (r: FightResult) => React.ReactNode;
  /** the Rift Tier's Omens (the campaign): shown on the enemies' side, like Auras, so their effects are always in view */
  omens?: { name: string; text: string }[];
}) {
  const { db, setup, onMove, onResumeFailed } = props;
  const finalBoss = 'enemies' in setup.b && setup.b.enemies.includes('vorthax');
  const fixedFigures = useRef(new FigureSession<HTMLCanvasElement>());
  useLayoutEffect(enterBattle, []);
  const pvp = props.pvp ?? null;
  const watch = props.watch ?? null;
  const hideHand = watch?.hideHand === true;
  // the skin your hero wears, decided once per fight and only if its figure is already in (so the figure never changes size mid-fight);
  // watching someone else's match or a replay draws everyone in their own look (DECISIONS #406)
  const skinOf = useRef<(hero: string) => string | undefined>(
    watch
      ? () => undefined
      : (() => {
          const fixed = new Map<string, string | undefined>();
          return (hero: string) => {
            if (!fixed.has(hero)) {
              const skin = mySkin(hero);
              fixed.set(hero, skin && realSkinFigure(skin) ? skin : undefined);
            }
            return fixed.get(hero);
          };
        })(),
  );
  /** every move of the fight so far, both seats', in order (the recap and the replay are made from it) */
  const movesRef = useRef<FightMove[]>([]);
  /** watching: paused, and how fast */
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  /** choices answered so far: two questions in a row with the same options still open a fresh choice window */
  const [pickCount, setPickCount] = useState(0);
  /** the cards marked so far in a choice made on the hand, and which choice they belong to */
  const [handPicked, setHandPicked] = useState<{ key: string; cards: string[] }>({
    key: '',
    cards: [],
  });
  // (DECISIONS #429) a totem commanded just now: its spirit rises over it on the totem panel for a moment
  const [summon, setSummon] = useState<(TotemSummon & { side: Side }) | null>(null);
  const summonTimer = useRef<number | null>(null);
  const summonKey = useRef(0);
  useEffect(
    () => () => {
      if (summonTimer.current !== null) window.clearTimeout(summonTimer.current);
    },
    [],
  );
  /** watching, paused: let the moves up to this one play, then hold again (the Step button) */
  const stepTo = useRef<number | null>(null);
  /** watching: the move on screen, for the move counter */
  const [shownMove, setShownMove] = useState(0);
  const [rate, setRate] = useState<(typeof WATCH_RATES)[number]>(1);
  /** the animation speed before this replay changed it (given back when it closes) */
  const [speedBefore] = useState(getBaseSpeed);
  /** the recap open over the result (the fight as it stood when it was opened) */
  const [recapFor, setRecapFor] = useState<FightReplay | null>(null);
  /** the result is set aside for a look at the board as the fight ended (the battle log is on it) */
  const [peek, setPeek] = useState(false);
  const [replaying, setReplaying] = useState<FightReplay | null>(null);
  /** the moves of a fight being resumed (read once, when the fight is made) */
  const [resumeMoves] = useState<Action[]>(() => props.resume ?? []);
  const mySide: Side = pvp?.seat ?? 'a';
  const foeName = pvp?.names[mySide === 'a' ? 'b' : 'a'] ?? 'Enemy';
  /** the deck and hero in your seat */
  const mine = (mySide === 'a' ? setup.a : setup.b) as HeroSetup;
  /** moves applied so far (PvP) and whether my last move is still with the server */
  const seqRef = useRef(0);
  const awaiting = useRef(false);
  const [desync, setDesync] = useState(false);
  /** the move at which a replay stopped playing out as the match did (its fingerprint did not match) */
  const [strayAt, setStrayAt] = useState<number | null>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BattlefieldScene | null>(null);
  const game = useRef<{ state: CombatState; display: CombatState } | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef({ all: 0, enemy: 0 });
  const speedRef = useRef(DEFAULT_SPEED);
  const cancelledRef = useRef(false);
  /** the move that ended a fight being resumed: played normally, so the result appears */
  const finishRef = useRef<Action | null>(null);
  const floatId = useRef(0);
  const floatStack = useRef(new Map<string, { n: number; at: number }>());
  const refuseTimer = useRef<number | undefined>(undefined);
  /** who is acting now: a status they put on someone else flies from them */
  const actor = useRef<string | null>(null);
  /** a potion is being used: what heals now is the potion */
  const drinking = useRef(false);
  /** the hero whose Spell is landing now: its blows show as a spell's (DECISIONS #565) */
  const castBy = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CombatView | null>(null);
  const [locked, setLocked] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<HandCard | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [hoverUnit, setHoverUnit] = useState<string | null>(null);
  const [dragTargets, setDragTargets] = useState<ReadonlySet<string> | null>(null);
  /** a card that summons, played with every companion slot taken: now choosing which companion leaves */
  // (the companions picked so far to scrap: a Heavy or Colossal can need several, DECISIONS #383)
  const [releasing, setReleasing] = useState<{
    card: string;
    target?: string;
    picked: string[];
  } | null>(null);
  const [dragCard, setDragCard] = useState<HandCard | null>(null);
  const [aimPotion, setAimPotion] = useState<string | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [banner, setBannerText] = useState<string | null>(null);
  /** a banner is good news (green), bad news (red) or just information */
  const [bannerTone, setBannerTone] = useState<'good' | 'bad' | 'info'>('info');
  const setBanner = useCallback((text: string | null, tone: 'good' | 'bad' | 'info' = 'info') => {
    setBannerTone(tone);
    setBannerText(text);
  }, []);
  /** the cards just played, on show in the middle of the board (each leaves on its own clock) */
  const [flourishes, setFlourishes] = useState<Flourish[]>([]);
  const flourishId = useRef(0);
  /** the same list, for the fight's events to read (they run outside rendering) */
  const onShow = useRef<Flourish[]>([]);
  useEffect(() => {
    onShow.current = flourishes;
  }, [flourishes]);
  const [result, setResult] = useState<FightResult | null>(null);
  const speed = DEFAULT_SPEED;
  const [pile, setPile] = useState<{ title: string; cards: CardDef[] } | null>(null);
  const [sceneObj, setSceneObj] = useState<BattlefieldScene | null>(null);
  const [, bump] = useState(0);
  // (DECISIONS #443) the layout for the window: wide, compact (a phone on its side, a tablet) or upright
  const [mode, setMode] = useState<StageMode>(() =>
    stageModeFor(window.innerWidth, window.innerHeight),
  );
  const modeRef = useRef(mode);
  const [sideOpen, setSideOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // a press anywhere else closes the menu and the drawer
  useEffect(() => {
    if (!menuOpen && !sideOpen) return;
    const away = (e: PointerEvent): void => {
      const t = e.target as HTMLElement | null;
      if (menuOpen && !t?.closest('.fight__menu, .fight__menuBtn')) setMenuOpen(false);
      if (sideOpen && !t?.closest('.fight__drawer, .fight__sideToggle')) setSideOpen(false);
    };
    const esc = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      setSideOpen(false);
    };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', esc);
    };
  }, [menuOpen, sideOpen]);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  /** the last press was a finger: there is no pointer to draw the aiming arrow to, the targets glow instead (DECISIONS #443) */
  const [touch, setTouch] = useState(false);
  useEffect(() => {
    const onDown = (e: PointerEvent): void => setTouch(e.pointerType === 'touch');
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, []);
  const [legal, setLegal] = useState<Action[]>([]);
  // the engine's real state, for previews (the refs behind it must not be read while rendering)
  const [live, setLive] = useState<CombatState | null>(null);
  const [seenTips, setSeenTips] = useState<Set<string>>(loadSeen);
  const [tipsOn, setTipsOn] = useState(loadTipsOn);
  // a change in the Settings menu applies at once, mid-fight (DECISIONS #571)
  const applySettings = useCallback((kind: SettingKind) => {
    if (kind === 'tips') {
      setTipsOn(loadTipsOn());
      setSeenTips(loadSeen());
    } else scene.current?.setProfile(profileFor(loadEffectsMode(), loadGraphicsQuality()));
  }, []);
  useSettingsChanged(applySettings);

  // --- floating numbers ------------------------------------------------------------------------------
  const float = useCallback((unitId: string, text: string, tone: Float['tone']) => {
    const sc = scene.current;
    const home = sc?.fighters.home(unitId);
    if (!sc || !home) return;
    const id = ++floatId.current;
    const jitter = (Math.random() - 0.5) * 30;
    // (numbers do not travel, so hits that land close together on one unit stack a line apart instead of on top of each other)
    const now = performance.now();
    const last = floatStack.current.get(unitId);
    const n = last && now - last.at < 600 ? (last.n + 1) % 4 : 0;
    floatStack.current.set(unitId, { n, at: now });
    setFloats((f) => [
      ...f.slice(-14),
      { id, x: home.x + jitter, y: home.y - home.h * 0.65 - n * 34, text, tone },
    ]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1450);
  }, []);

  // --- painted effects ----------------------------------------------------------------------------
  const stopArtWarm = useRef<(() => void) | null>(null);
  useEffect(() => {
    preloadFx();
    void loadCardFx();
    return () => {
      clearFx();
      stopArtWarm.current?.();
    };
  }, []);
  /** Where a unit stands on the page, and how big an effect on it is. */
  const spotOf = useCallback((unitId: string): (Spot & { size: number }) | null => {
    const sc = scene.current;
    const home = sc?.fighters.home(unitId);
    const box = host.current?.getBoundingClientRect();
    if (!sc || !home || !box) return null;
    const p = sc.stageToHost(home.x, home.y - home.h * 0.5);
    return {
      x: box.left + p.x,
      y: box.top + p.y,
      size: Math.max(110, Math.min(340, home.h * p.k * 0.95)),
    };
  }, []);
  const fxOn = useCallback(
    (id: FxId, unitId: string, o: { flip?: boolean; scale?: number } = {}) => {
      const at = spotOf(unitId);
      if (!at) return;
      playFx(id, at, { size: at.size * (o.scale ?? 1), ...(o.flip ? { flip: true } : {}) });
    },
    [spotOf],
  );
  /** A status landing: its icon flies from whoever put it there (not to themselves), and its effect plays on arrival. */
  const statusLands = useCallback(
    (target: string, status: StatusId, amount: number, total: number) => {
      const fx = statusFx(status, amount, total);
      const land = (): void => {
        if (fx) fxOn(fx, target);
      };
      const from = actor.current && actor.current !== target ? spotOf(actor.current) : null;
      const to = spotOf(target);
      if (from && to && PAINTED.has(status)) {
        flyPicture(iconUrl(status), from, to, { dur: 200, arc: 40, onArrive: land });
      } else land();
    },
    [fxOn, spotOf],
  );

  const show = useCallback((s: CombatState) => setView(viewFor(db, s, mySide)), [db, mySide]);

  /** The fight as played so far: enough to watch it again or add it up. */
  const replayOf = useCallback(
    (): FightReplay => ({
      setup,
      moves: [...movesRef.current],
      title: props.title,
      me: mySide,
      ...(pvp ? { names: pvp.names, progress: pvp.progress } : {}),
      ...(props.venue ? { venue: props.venue } : {}),
    }),
    [setup, props.title, mySide, pvp, props.venue],
  );

  // --- replaying events ---------------------------------------------------------------------------
  const wait = useCallback(async (ms: number) => {
    await sleep(ms / speedRef.current);
    // (a paused replay holds here, between two beats of the animation)
    while (pausedRef.current && stepTo.current === null && !cancelledRef.current) await sleep(120);
  }, []);

  const playEvent = useCallback(
    async (e: CombatEvent, all: CombatEvent[], i: number): Promise<void> => {
      const g = game.current;
      const sc = scene.current;
      if (!g || !sc) return;
      const d = g.display;
      const heroOf = (side: Side): string =>
        d.sides[side].units.find((u) => u.kind === 'hero')?.id ?? '';
      const heroId = heroOf(mySide);
      const respec = () =>
        sc.fighters.sync(
          specsFrom(db, d, mySide, skinOf.current, modeRef.current, fixedFigures.current),
        );
      const unitOf = (id: string) =>
        d.sides.a.units.concat(d.sides.b.units).find((u) => u.id === id);
      // (what is on screen, for a performance report's stalls: DECISIONS #572)
      perfNote(
        e.type === 'play'
          ? `shows ${e.side === mySide ? 'your' : 'their'} ${db.cards[e.def]?.name ?? 'card'}`
          : e.type === 'turnStart'
            ? `${e.side === mySide ? 'your' : 'their'} turn starts`
            : `shows ${e.type}`,
      );
      switch (e.type) {
        case 'turnStart': {
          reduceEvent(db, d, e);
          actor.current = null;
          drinking.current = false;
          if (e.side === mySide) document.querySelectorAll('.intent').forEach(swingIn);
          if (e.side !== mySide) {
            setBanner(pvp ? `${foeName}'s turn` : 'Enemy turn', 'bad');
            await wait(650);
            setBanner(null);
          } else if (e.turn > 1) {
            setBanner('Your turn', 'good');
            play('turn');
            await wait(450);
            setBanner(null);
          }
          return;
        }
        case 'draw':
          reduceEvent(db, d, e);
          if (e.side === mySide) {
            play('deal');
            const pile = document.querySelector('.pile--draw');
            const from = centreOf(pile);
            if (from) {
              bumpFx(pile);
              flyCard(from, handSpot(), { dur: 260, arc: 30, trail: 'trail-draw' });
            }
          }
          await wait(70);
          return;
        case 'discard':
          reduceEvent(db, d, e);
          // (a card set aside by Defer is not going to the discard pile)
          if (e.side === mySide && !e.defer) {
            const pile = document.querySelector('.pile--discard');
            const to = centreOf(pile);
            if (to)
              flyCard(handSpot(), to, {
                dur: 280,
                arc: 24,
                trail: 'trail-discard',
                onArrive: () => bumpFx(pile),
              });
          }
          await wait(16);
          return;
        case 'exhaust': {
          reduceEvent(db, d, e);
          if (e.side !== mySide || e.routine) return;
          // the card on show burns up where it stands, if it is the one going (see FlourishCard); otherwise it burns by the pile
          const going = onShow.current.find((f) => f.card === e.card && f.mine && !f.burn);
          if (going) {
            setFlourishes((list) =>
              list.map((f) => (f.id === going.id ? { ...f, burn: true } : f)),
            );
          } else {
            const at = centreOf(
              document.querySelector('.pile--exhaust') ?? document.querySelector('.pile--discard'),
            );
            if (at) playFx('card-burn', at, { size: 160, dur: 560 });
          }
          return;
        }
        case 'shuffle':
          reduceEvent(db, d, e);
          if (e.side === mySide) {
            const from = centreOf(document.querySelector('.pile--discard'));
            const pile = document.querySelector('.pile--draw');
            const to = centreOf(pile);
            if (from && to)
              for (let n = 0; n < 5; n++)
                flyCard(from, to, {
                  dur: 340,
                  delay: n * 50,
                  arc: 90,
                  onArrive: () => bumpFx(pile, 1.1),
                });
          }
          await wait(150);
          return;
        case 'mana':
          // (the gem gives a little as it is paid from)
          if (e.side === mySide && e.mana < d.sides[mySide].mana)
            bumpFx(document.querySelector('.fight__mana'), 0.86);
          reduceEvent(db, d, e);
          return;
        case 'potion': {
          // the bottle flies from the belt (it is about to leave it) to where it is used
          const p = db.potions[e.potion];
          const fx = potionFx(p, e.target !== null);
          // (one with no target is drunk, or breaks over all the enemies)
          const foes = potionHitsAllFoes(p)
            ? d.sides[e.side === 'a' ? 'b' : 'a'].units.filter((u) => u.hp > 0).map((u) => u.id)
            : [];
          const toIds = e.target ? [e.target] : foes.length > 0 ? foes : [heroOf(e.side)];
          const from =
            e.side === mySide
              ? centreOf(document.querySelectorAll('.fight__belt > *')[e.index])
              : spotOf(heroOf(e.side));
          const spots = toIds.map(spotOf).filter((s): s is NonNullable<typeof s> => s !== null);
          const to: Spot | null = spots.length
            ? {
                x: spots.reduce((n, s) => n + s.x, 0) / spots.length,
                y: spots.reduce((n, s) => n + s.y, 0) / spots.length,
              }
            : null;
          reduceEvent(db, d, e);
          actor.current = heroOf(e.side);
          drinking.current = true;
          const land = (): void => toIds.forEach((id) => fxOn(fx, id));
          if (from && to)
            flyPicture(iconUrl(`potion-${e.potion}`), from, to, {
              dur: 300,
              arc: 80,
              size: 54,
              onArrive: land,
            });
          else land();
          return;
        }
        case 'play': {
          reduceEvent(db, d, e);
          actor.current = heroOf(e.side);
          drinking.current = false;
          const def = db.cards[e.def];
          // (in PvE only your side plays cards; in PvP the opponent's cards show too, except a Trap they set)
          if (def) {
            const hero = heroOf(e.side);
            if (e.side === mySide || def.kind !== 'snare') {
              // the card stays on show a good while (it flies to the discard pile when it leaves: see FlourishCard)
              const id = flourishId.current++;
              setFlourishes((list) => [
                ...list.slice(-3),
                { id, def, mine: e.side === mySide, card: e.card },
              ]);
            }
            // a card aimed at someone lifts out of the hand and flies to them
            const to = e.target !== null && e.side === mySide ? spotOf(e.target) : null;
            if (to) flyCard(handSpot(), to, { dur: 200, arc: 50, size: 60, trail: 'trail-draw' });
            // a Rare's own painted effect (DECISIONS #567): on its target, on the hero, or over the enemy line; an attack's lands with
            // the blow, anything else as it is played (a Trap the other side set stays hidden)
            const fxAt = cardFxAt(def.id);
            const ownFx =
              fxAt && (e.side === mySide || def.kind !== 'snare')
                ? (): void => {
                    const foeIds = d.sides[e.side === 'a' ? 'b' : 'a'].units
                      .filter((u) => u.hp > 0)
                      .map((u) => u.id);
                    if (fxAt === 'self') {
                      const at = spotOf(hero);
                      if (at) playCardFx(def.id, at, { size: at.size * 1.3 });
                      return;
                    }
                    if (fxAt === 'all') {
                      const spots = foeIds
                        .map(spotOf)
                        .filter((s): s is NonNullable<typeof s> => !!s);
                      if (!spots.length) return;
                      const xs = spots.map((s) => s.x);
                      const big = Math.max(...spots.map((s) => s.size));
                      playCardFx(
                        def.id,
                        {
                          x: (Math.min(...xs) + Math.max(...xs)) / 2,
                          y: spots.reduce((n, s) => n + s.y, 0) / spots.length,
                        },
                        { size: Math.min(620, Math.max(...xs) - Math.min(...xs) + big * 1.2) },
                      );
                      return;
                    }
                    // (a card with no target of its own plays on the first enemy it strikes)
                    let aim = e.target;
                    for (let j = i + 1; !aim && j < all.length; j++) {
                      const n = all[j];
                      if (!n || n.type === 'play' || n.type === 'act' || n.type === 'turnEnd')
                        break;
                      if (n.type === 'damage' && n.source === hero) aim = n.target;
                    }
                    const at = spotOf(aim ?? foeIds[0] ?? hero);
                    if (at) playCardFx(def.id, at, { size: at.size * 1.25 });
                  }
                : null;
            if (def.kind === 'attack') {
              // (a Spell is cast and a card that hits them all plays across them all, DECISIONS #565)
              const by = unitOf(hero);
              const tags = def.tags ?? [];
              const spread =
                ((by?.statuses.fanned ?? 0) > 0 && tags.includes(EDGE_TAG)) ||
                ((by?.statuses.bladesweep ?? 0) > 0 && tags.includes(BLADE_TAG));
              const motion = cardMotion(by?.def ?? '', def, spread);
              castBy.current = motion.spell ? hero : null;
              const foes = d.sides[e.side === 'a' ? 'b' : 'a'].units
                .filter((u) => u.hp > 0)
                .map((u) => u.id);
              await sc.fighters.attack(
                hero,
                e.target ?? null,
                ownFx ?? undefined,
                def,
                motion,
                foes,
              );
            } else {
              castBy.current = null;
              ownFx?.();
              sc.fighters.act(hero);
              play(def.kind === 'snare' ? 'trapSet' : 'cast');
              await wait(160);
            }
          }
          return;
        }
        case 'act': {
          reduceEvent(db, d, e);
          actor.current = e.unit;
          drinking.current = false;
          castBy.current = null;
          // (its intent shakes as it goes)
          shake(document.querySelector(`[data-intent="${CSS.escape(e.unit)}"]`));
          // look ahead for what this unit hits, so the lunge goes the right way
          let target: string | null = null;
          for (let j = i + 1; j < all.length; j++) {
            const n = all[j];
            if (!n || n.type === 'act' || n.type === 'turnEnd' || n.type === 'play') break;
            if (n.type === 'damage' && n.source === e.unit && n.kind === 'attack') {
              target = n.target;
              break;
            }
          }
          if (target) await sc.fighters.attack(e.unit, target);
          else {
            sc.fighters.act(e.unit);
            await wait(240);
          }
          return;
        }
        case 'skip':
          reduceEvent(db, d, e);
          sc.fighters.pulse(e.unit, '#9aa3c4');
          fxOn('tick-static', e.unit);
          float(e.unit, 'Shocked', 'bad');
          await wait(320);
          return;
        case 'damage': {
          const hadFate = (unitOf(e.target)?.statuses.doom ?? 0) > 0;
          reduceEvent(db, d, e);
          const after = unitOf(e.target);
          // what it hit: Barrier breaking or holding, a stack ticking, a blow landing, or Fate coming due
          if (e.blocked > 0) {
            const broken = (after?.barrier ?? 0) <= 0;
            fxOn(broken ? 'barrier-break' : 'barrier-hit', e.target);
            if (broken) {
              const bar = centreOf(
                document.querySelector(`[data-unit="${CSS.escape(e.target)}"] .bar`),
              );
              if (bar) playFx('barrier-break', bar, { size: 110, dur: 380 });
            }
          }
          const tick = tickOf(all, i);
          if (tick) {
            fxOn(tick.fx, e.target, { scale: 0.8 });
            bumpFx(
              document.querySelector(
                `[data-unit="${CSS.escape(e.target)}"] [data-status="${tick.status}"]`,
              ),
              1.3,
            );
          } else if (e.source === null && hadFate && after && after.hp <= 0) {
            fxOn('fate-kills', e.target, { scale: 1.15 });
          } else if (e.kind === 'attack' && e.lost > 0) {
            const by = e.source ? unitOf(e.source) : undefined;
            const spec = by ? attackFor(by.def, by.kind === 'hero') : undefined;
            // (a Spell's blow lands as a spell, not a cut)
            const kind = by && castBy.current === by.id ? 'cast' : spec?.kind;
            fxOn(hitFx(e.lost, kind), e.target, {
              // (painted swinging to the right: an attack from the right of the screen is mirrored)
              flip: (by ? shown(by.side, mySide) : 'a') === 'b',
            });
          }
          if (e.shielded) {
            float(e.target, 'Shielded!', 'block');
            sc.fighters.pulse(e.target, '#a6f4ff');
            fxOn('barrier-hit', e.target);
            play('buff');
          } else if (e.lost > 0) {
            sc.fighters.hit(e.target, e.lost);
            if (e.lost >= 10 && e.target !== heroId) sc.fighters.pulse(e.target, '#ff8a3a');
            // (what Barrier soaked up shows in blue beside what got through in red)
            if (e.blocked > 0) float(e.target, `⛨ ${e.blocked}`, 'block');
            float(e.target, `-${e.lost}`, 'dmg');
            play('hit');
            if (e.target === heroId) sc.impact(e.lost * 1.4);
            else sc.impact(e.lost * 0.6);
          } else if (e.blocked > 0) {
            float(e.target, `Blocked ${e.blocked}`, 'block');
            sc.fighters.pulse(e.target, '#a6f4ff');
          }
          await wait(e.kind === 'direct' ? 220 : 170);
          return;
        }
        case 'barrier':
          reduceEvent(db, d, e);
          sc.fighters.pulse(e.target, '#36e0ff');
          fxOn('barrier-gain', e.target);
          float(e.target, `+${e.amount} ⛨`, 'block');
          play('buff');
          await wait(110);
          return;
        case 'heal':
          reduceEvent(db, d, e);
          sc.fighters.pulse(e.target, '#6df0a8');
          fxOn(drinking.current ? 'potion-heal' : 'unit-rest', e.target);
          float(e.target, `+${e.amount}`, 'heal');
          await wait(120);
          return;
        case 'status': {
          reduceEvent(db, d, e);
          if (e.amount > 0) {
            const bad =
              e.status === 'exposed' ||
              e.status === 'faltering' ||
              e.status === 'seared' ||
              e.status === 'burn' ||
              e.status === 'stunned';
            sc.fighters.pulse(e.target, bad ? '#d12f48' : '#f6dc94');
            statusLands(e.target, e.status, e.amount, e.total);
            float(
              e.target,
              `${STATUS_INFO[e.status]?.name ?? e.status}${ON_OR_OFF.has(e.status) ? '' : ` ${e.amount}`}`,
              bad ? 'bad' : 'good',
            );
            await wait(110);
          }
          return;
        }
        case 'summon':
          reduceEvent(db, d, e);
          respec();
          sc.fighters.pulse(e.unit, '#b07aff');
          fxOn('unit-summon', e.unit);
          await wait(400);
          return;
        case 'died':
          if (!e.released) fxOn('unit-death', e.unit);
          await sc.fighters.die(e.unit);
          reduceEvent(db, d, e);
          respec();
          await wait(120);
          return;
        case 'snareSet':
          reduceEvent(db, d, e);
          await wait(120);
          return;
        case 'command': {
          // the spirit manifests over its totem; the effects it causes come as their own events, a beat later
          reduceEvent(db, d, e);
          summonKey.current += 1;
          setSummon({ side: e.side, totem: e.totem, spirit: e.spirit, key: summonKey.current });
          if (summonTimer.current !== null) window.clearTimeout(summonTimer.current);
          summonTimer.current = window.setTimeout(() => {
            summonTimer.current = null;
            setSummon(null);
          }, 1100);
          await wait(340);
          return;
        }
        case 'suits':
          reduceEvent(db, d, e);
          if (e.full) {
            setBanner('Full Trick!', e.side === mySide ? 'good' : 'bad');
            await wait(260);
          }
          return;
        case 'snareSprung': {
          reduceEvent(db, d, e);
          const name = db.cards[e.card]?.name ?? 'Trap';
          setBanner(`Trap sprung: ${name}`, e.side === mySide ? 'good' : 'bad');
          // the card flips up, and jaws snap shut on whoever it caught: the one that set it off, or (a Trap that springs as their
          // turn begins) the first one on the other side its own effects touch, never anything after it
          {
            let caught = e.caught;
            for (let j = i + 1; !caught && j < Math.min(all.length, i + 8); j++) {
              const x = all[j]!;
              if (['act', 'play', 'turnStart', 'turnEnd', 'snareSprung', 'intent'].includes(x.type))
                break;
              const id = x.type === 'damage' || x.type === 'status' ? x.target : null;
              if (id && unitOf(id) && unitOf(id)!.side !== e.side) caught = id;
            }
            const at = caught ? spotOf(caught) : null;
            if (at) trapJaws(at, at.size * 0.9);
          }
          {
            const trap = db.cards[e.card];
            if (trap) {
              const id = flourishId.current++;
              setFlourishes((list) => [
                ...list.slice(-3),
                { id, def: trap, mine: e.side === mySide, flip: true },
              ]);
            }
          }
          play('trapReveal');
          await wait(800);
          setBanner(null);
          return;
        }
        case 'prevented':
          float(e.unit, 'Prevented!', 'good');
          await wait(220);
          return;
        case 'phase': {
          // an enemy reached its threshold and rises (an Omen's Second Wind): a beat to see it
          reduceEvent(db, d, e);
          const name = d.sides.a.units.concat(d.sides.b.units).find((u) => u.id === e.unit)?.name;
          fxOn('unit-phase', e.unit, { scale: 1.2 });
          float(e.unit, e.left > 0 ? 'It rises!' : 'Final phase!', 'bad');
          setBanner(
            `${name ?? 'The enemy'} rises: ${e.left > 0 ? 'its next phase' : 'its last phase'}!`,
            'bad',
          );
          play('trapReveal');
          await wait(900);
          setBanner(null);
          return;
        }
        case 'turnEnd':
          reduceEvent(db, d, e);
          actor.current = null;
          drinking.current = false;
          castBy.current = null;
          return;
        case 'gameOver':
          reduceEvent(db, d, e);
          sc.fighters.finish(shown(e.winner, mySide));
          play(e.winner === mySide ? 'win' : 'lose');
          await wait(700);
          return;
        default:
          reduceEvent(db, d, e);
          return;
      }
    },
    [db, float, wait, mySide, pvp, foeName, setBanner, fxOn, spotOf, statusLands],
  );

  // the battle log: events become lines as they play, using the names of units seen so far (so fallen ones are still named)
  const [logLines, setLogLines] = useState<LogLine[]>([]);
  const namer = useRef(new Namer(mySide, pvp ? foeName : null));
  const logId = useRef(0);
  const logBuf = useRef<LogLine[]>([]);
  const logTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (logTimer.current !== null) window.clearTimeout(logTimer.current);
    },
    [],
  );
  const learnUnits = useCallback((st: CombatState) => namer.current.learn(st), []);
  /** made on first use, so it is built outside rendering (it reads the namer, which is a ref) */
  const describer = useRef<ReturnType<typeof createDescriber> | null>(null);
  const logEvent = useCallback(
    (e: CombatEvent) => {
      // a unit that appears and falls within one batch is never in a state we see: name it from its event
      if (e.type === 'summon')
        namer.current.register(e.unit, db.units[e.def]?.name ?? e.def, e.side, e.def);
      describer.current ??= createDescriber({
        db,
        me: mySide,
        nameOf: (id) => namer.current.nameOf(id),
        sideOf: (id) => namer.current.sideOf(id),
        defOf: (id) => namer.current.defOf(id),
        who: (side) => (side === mySide ? 'You' : foeName),
        blind: hideHand,
      });
      const line = describer.current(e);
      if (!line) return;
      // lines gather and reach the screen together, so a long enemy turn is one redraw and not one per event
      logBuf.current.push({ id: logId.current++, ...line });
      if (logTimer.current === null)
        logTimer.current = window.setTimeout(() => {
          logTimer.current = null;
          const add = logBuf.current.splice(0);
          setLogLines((prev) => [...prev, ...add].slice(-LOG_LIMIT));
        }, 120);
    },
    [db, mySide, foeName, hideHand],
  );

  const runBatch = useCallback(
    async (events: CombatEvent[], after: CombatState) => {
      const g = game.current;
      const sc = scene.current;
      if (!g || !sc || cancelledRef.current) return;
      learnUnits(g.display);
      learnUnits(after);
      let logged = 0;
      try {
        for (let i = 0; i < events.length; i++) {
          if (cancelledRef.current) return;
          logEvent(events[i] as CombatEvent);
          logged = i + 1;
          await playEvent(events[i] as CombatEvent, events, i);
          show(g.display);
        }
      } catch (err) {
        console.warn('[fight] replay failed; resyncing', err);
        // the screen resyncs below, but the log keeps every line
        for (let j = logged; j < events.length; j++) logEvent(events[j] as CombatEvent);
      }
      if (cancelledRef.current) return;
      setBanner(null);
      // whatever happened, the screen ends exactly where the engine is
      try {
        g.display = clone(after);
        sc.fighters.sync(
          specsFrom(db, g.display, mySide, skinOf.current, modeRef.current, fixedFigures.current),
          {
            instant: true,
          },
        );
        show(g.display);
        bump((n) => n + 1);
      } catch (err) {
        console.warn('[fight] resync failed', err);
      }
    },
    [db, playEvent, show, mySide, learnUnits, logEvent, setBanner],
  );

  const enqueue = useCallback(
    (events: CombatEvent[], after: CombatState, foeMove?: boolean) => {
      // in PvE the whole enemy turn arrives in one batch; in PvP each of the opponent's moves is its own batch
      const enemyPhase = foeMove ?? events.some((e) => e.type === 'turnStart' && e.side !== mySide);
      pending.current.all++;
      if (enemyPhase) {
        pending.current.enemy++;
        setLocked(true);
      }
      // (watching: which move this batch shows; the moves all arrive at once, the screen plays them one after another)
      const moveNo = watch ? seqRef.current : 0;
      chain.current = chain.current.then(async () => {
        try {
          if (watch) {
            // a Step lets one move play: the one after it holds again
            if (stepTo.current !== null && moveNo > stepTo.current) stepTo.current = null;
          }
          // (watching, each move gets a moment to itself, so the eye can follow)
          if (watch && !cancelledRef.current) await wait(WATCH_GAP);
          if (watch) setShownMove(moveNo);
          await runBatch(events, after);
        } catch (err) {
          console.warn('[fight] batch failed', err);
        }
        pending.current.all--;
        if (enemyPhase) pending.current.enemy--;
        if (pending.current.enemy === 0 && !cancelledRef.current) setLocked(false);
        if (after.winner && pending.current.all === 0 && !cancelledRef.current) {
          const hero = after.sides[mySide].units.find((u) => u.kind === 'hero');
          window.setTimeout(
            () =>
              setResult({
                winner: shown(after.winner as Winner, mySide),
                turns: after.turn,
                hp: hero?.hp ?? 0,
                potions: [...after.sides[mySide].potions],
                maxHpGained: after.sides[mySide].maxHpGained ?? 0,
                extraRewards: after.sides[mySide].extraRewards ?? 0,
                replay: replayOf(),
              }),
            300,
          );
        }
      });
    },
    [runBatch, mySide, watch, wait, replayOf],
  );

  // --- mount: build the scene and start the fight ---------------------------------------------------
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    cancelledRef.current = false;
    fixedFigures.current = new FigureSession<HTMLCanvasElement>();
    let cancelled = false; // this effect run only (StrictMode mounts, unmounts and mounts again)
    let created: BattlefieldScene | null = null;
    // real artwork (if any was supplied) is loaded before the first figure or card is drawn; the weapons load alongside and are
    // used once they are in (an attack before then keeps its drawn effects)
    void loadWeaponArt();
    const opened = performance.now();
    perfNote('a fight is opening');
    Promise.all([
      preloadAllArt(),
      ...('enemies' in setup.b && setup.b.enemies.includes('vorthax')
        ? [preloadFigure('unit:vorthax', 'figures/vorthax.png')]
        : []),
    ])
      .then(() =>
        BattlefieldScene.create(
          el,
          profileFor(loadEffectsMode(), loadGraphicsQuality()),
          props.venue,
        ),
      )
      .then((s) => {
        perfNote(
          `the battlefield is built (${Math.round(performance.now() - opened)} ms after opening)`,
        );
        if (cancelled) {
          s.destroy();
          return;
        }
        created = s;
        scene.current = s;
        setSceneObj(s);
        s.onSound = play;
        s.onFit = () => bump((n) => n + 1);
        s.setFrame(frameFor(modeRef.current, undefined, finalBoss), boardReserve(modeRef.current));
        setBaseSpeed(speedRef.current);
        const start = createCombat(db, setup);
        // a fight picked up again (the page was reloaded): the moves made so far are replayed silently, from the same seed, so it is
        // exactly where it was. A move that ended the fight is left to play out normally, so the result still appears.
        let from = start.state;
        let resumedAt = 0;
        let finishing: Action | null = null;
        if (!pvp && resumeMoves.length > 0) {
          try {
            let st = start.state;
            for (let i = 0; i < resumeMoves.length; i++) {
              const move = resumeMoves[i] as Action;
              const next = applyAction(db, st, move).state;
              if (next.winner) {
                finishing = move;
                break;
              }
              st = next;
              resumedAt = i + 1;
              movesRef.current.push({ seat: mySide, action: move });
            }
            from = st;
          } catch (err) {
            console.warn('[fight] the saved moves could not be replayed; starting again', err);
            from = start.state;
            resumedAt = 0;
            finishing = null;
            movesRef.current = [];
            onResumeFailed?.();
          }
        }
        {
          const me = from.sides[mySide];
          const ids = [...me.hand, ...me.draw, ...me.discard].map((c) => c.card);
          void preloadCardFx(ids);
          // (each card's painted art, in idle moments, before it is first drawn: DECISIONS #572)
          stopArtWarm.current?.();
          stopArtWarm.current = prewarmCardArtV2(ids.flatMap((id) => db.cards[id] ?? []));
        }
        if (resumedAt > 0 || finishing) {
          game.current = { state: from, display: clone(from) };
          setLive(from);
          s.fighters.sync(
            specsFrom(
              db,
              game.current.display,
              mySide,
              skinOf.current,
              modeRef.current,
              fixedFigures.current,
            ),
            {
              instant: true,
            },
          );
          show(game.current.display);
          setReady(true);
          setLocked(false);
          // (the move that ended it is played once the screen is ready: see below)
          finishRef.current = finishing;
          return;
        }
        // (the opening events are replayed only when the player sees the opening; see below)
        const opening = !pvp || pvp.replay === 0;
        game.current = {
          state: start.state,
          display: startingDisplay(start.state, opening ? start.events : []),
        };
        setLive(start.state);
        s.fighters.sync(
          specsFrom(
            db,
            game.current.display,
            mySide,
            skinOf.current,
            modeRef.current,
            fixedFigures.current,
          ),
          {
            instant: true,
          },
        );
        show(game.current.display);
        setReady(true);
        // (a player coming back to a match in progress skips the opening: the moves so far are replayed silently)
        if (opening) enqueue(start.events, start.state);
        // the opening: events replay the draw; then the player may act
        chain.current = chain.current.then(() => {
          if (!cancelledRef.current) setLocked(false);
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    const ro = new ResizeObserver(() => {
      // refitting the scene tells us (onFit) to place the plates again; a turned screen may change the layout (see below)
      const m = stageModeFor(window.innerWidth, window.innerHeight);
      setMode(m);
      // (the drawer and the menu exist only on a small screen and upright)
      if (!foldsSide(m)) setSideOpen(false);
      if (m !== 'portrait') setMenuOpen(false);
      scene.current?.setFrame(frameFor(m, undefined, finalBoss), boardReserve(m));
    });
    ro.observe(el);
    return () => {
      cancelled = true;
      cancelledRef.current = true;
      ro.disconnect();
      created?.destroy();
      scene.current = null;
    };
    // the fight is created once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a turned screen: the figures move to the layout for it (the board was refitted as the window changed)
  useEffect(() => {
    if (modeRef.current === mode) return;
    modeRef.current = mode;
    const g = game.current;
    if (g)
      scene.current?.fighters.sync(
        specsFrom(db, g.display, mySide, skinOf.current, mode, fixedFigures.current),
        {
          instant: true,
        },
      );
  }, [mode, db, mySide]);

  useEffect(() => {
    if (watch) return; // (a replay keeps its own speed: see below)
    setBaseSpeed(speed);
    speedRef.current = speed;
  }, [speed, watch]);

  // PvP: the server can end a match the engine does not know is over (a resignation, a missed turn, a dropped player)
  const pvpEnd = pvp?.end ?? null;
  useEffect(() => {
    if (!pvpEnd || result) return;
    void chain.current.then(() => {
      if (cancelledRef.current) return;
      const hero = game.current?.state.sides[mySide].units.find((u) => u.kind === 'hero');
      setResult(
        (r) =>
          r ?? {
            winner: shown(pvpEnd.winner, mySide),
            hp: hero?.hp ?? 0,
            potions: [],
            replay: replayOf(),
          },
      );
    });
  }, [pvpEnd, result, mySide, replayOf]);

  // watching a replay that ended some other way than a win (a resignation, a missed clock): once its last move has played, say so
  const watchEnd = watch?.end ?? null;
  const watchTotal = watch?.total ?? null;
  const [watchedAll, setWatchedAll] = useState(false);
  useEffect(() => {
    if (!watchedAll || !watchEnd || result) return;
    void chain.current.then(() => {
      if (cancelledRef.current || game.current?.state.winner) return;
      const hero = game.current?.state.sides[mySide].units.find((u) => u.kind === 'hero');
      setResult(
        (r) =>
          r ?? {
            winner: shown(watchEnd.winner, mySide),
            hp: hero?.hp ?? 0,
            potions: [],
          },
      );
    });
  }, [watchedAll, watchEnd, result, mySide]);

  // --- acting ---------------------------------------------------------------------------------------------
  /** What I may do now: nothing while it is the other player's turn. */
  const legalFor = useCallback(
    (st: CombatState): Action[] => (st.active === mySide ? legalActions(db, st) : []),
    [db, mySide],
  );

  /** Apply a move to the engine's state and (unless it is history being replayed) play its events. */
  const applyMove = useCallback(
    (a: Action, seat: Side, history: boolean): boolean => {
      const g = game.current;
      if (!g || g.state.winner || cancelledRef.current) return false;
      try {
        // (the time each step takes goes in a performance report, if one is recording: DECISIONS #572)
        const played =
          a.type === 'play'
            ? g.state.sides[seat].hand.find((c) => c.id === a.card)?.card
            : undefined;
        const t0 = performance.now();
        const r = applyAction(db, g.state, a);
        const t1 = performance.now();
        g.state = r.state;
        movesRef.current.push({ seat, action: a });
        setLive(r.state);
        // the answer to a choice closes it on screen straight away (the display state lags the engine)
        if (a.type === 'pick' && seat === mySide) {
          g.display.pending = null;
          show(g.display);
        }
        setLegal(legalFor(r.state));
        const t2 = performance.now();
        setSelected(null);
        setAimPotion(null);
        setReleasing(null);
        if (!history) enqueue(r.events, r.state, pvp ? seat !== mySide : undefined);
        // a campaign fight keeps every move, so a reload can resume it
        if (!history && !pvp) onMove?.(a);
        if (!history)
          perfNote(
            `${a.type}${played ? ` ${db.cards[played]?.name ?? played}` : ''}: rules ${(t1 - t0).toFixed(1)} ms, legal moves ${(t2 - t1).toFixed(1)} ms, events ${r.events.length}, saving ${(performance.now() - t2).toFixed(1)} ms`,
          );
        return true;
      } catch (err) {
        console.warn('[fight] illegal action', err);
        return false;
      }
    },
    [db, enqueue, show, legalFor, mySide, pvp, onMove],
  );

  const act = useCallback(
    (a: Action) => {
      const g = game.current;
      if (!g || g.state.winner || cancelledRef.current) return;
      if (watch) return; // (watching: nobody here moves)
      if (pending.current.enemy > 0) return; // the enemy turn is still playing out
      if (pvp) {
        // the server decides: send the move, and play it when it comes back (with the opponent's)
        if (g.state.active !== mySide || awaiting.current) return;
        if (!pvp.send(seqRef.current + 1, a)) {
          // the connection is down: the move is not lost into the air, the player is told
          play('refuse');
          setBanner('Reconnecting…', 'bad');
          if (refuseTimer.current) window.clearTimeout(refuseTimer.current);
          refuseTimer.current = window.setTimeout(() => setBanner(null), 1200);
          return;
        }
        awaiting.current = true;
        // (if the answer never comes, my next click may try again: the server refuses a repeat)
        window.setTimeout(() => (awaiting.current = false), 4000);
        return;
      }
      if (!applyMove(a, mySide, false)) play('refuse');
    },
    [applyMove, mySide, pvp, setBanner, watch],
  );

  // PvP: every accepted move arrives here, mine included, in the server's order
  const onFeed = useCallback(
    (item: FeedItem) => {
      if (item.kind === 'refused') {
        awaiting.current = false;
        play('refuse');
        setBanner(item.message, 'bad');
        if (refuseTimer.current) window.clearTimeout(refuseTimer.current);
        refuseTimer.current = window.setTimeout(() => setBanner(null), 1200);
        return;
      }
      const m = item.move;
      const g = game.current;
      const sc = scene.current;
      if (!g || !sc) return;
      if (m.seq !== seqRef.current + 1) {
        setDesync(true);
        return;
      }
      seqRef.current = m.seq;
      if (m.seat === mySide) awaiting.current = false;
      if (!applyMove(m.action, m.seat, item.history)) {
        setDesync(true);
        setStrayAt((s) => s ?? m.seq);
        return;
      }
      if (m.hash && hashState(g.state) !== m.hash) {
        setDesync(true);
        setStrayAt((s) => s ?? m.seq);
      }
      if (watchTotal !== null && m.seq >= watchTotal) setWatchedAll(true);
      // the last of the history: put the screen where the engine is
      if (item.history && pvp && m.seq === pvp.replay) {
        g.display = clone(g.state);
        sc.fighters.sync(
          specsFrom(db, g.display, mySide, skinOf.current, modeRef.current, fixedFigures.current),
          {
            instant: true,
          },
        );
        show(g.display);
        setLocked(false);
        bump((n) => n + 1);
      }
    },
    [applyMove, db, mySide, pvp, show, setBanner, watchTotal],
  );

  // (a match is fed by the server; a replay or a watched match by its own feed)
  const feedFrom = pvp?.feed ?? watch?.feed ?? null;
  useEffect(() => {
    if (!ready || !feedFrom) return;
    return feedFrom.attach(onFeed);
  }, [ready, feedFrom, onFeed]);

  // watching: pause, and how fast
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    if (!watch) return;
    speedRef.current = DEFAULT_SPEED * rate;
    setBaseSpeed(speedRef.current);
    // (the animation speed is shared: a replay closed over a fight gives it back its own)
    return () => setBaseSpeed(speedBefore);
  }, [rate, watch, speedBefore]);

  // a resumed fight whose last move ended it: that move plays out now, so the win or loss shows as it did
  useEffect(() => {
    const a = finishRef.current;
    if (!ready || !a) return;
    finishRef.current = null;
    applyMove(a, mySide, false);
  }, [ready, applyMove, mySide]);

  // keep the legal list fresh whenever the real state changes
  useEffect(() => {
    if (game.current) setLegal(legalFor(game.current.state));
  }, [legalFor, ready]);

  // nothing to do while animations play, or while it is the opponent's move
  const myTurn = (live?.active ?? mySide) === mySide;
  const waiting = locked || !myTurn;

  /** Play a card at `target`; if it summons with every companion slot taken, the player is asked which companion leaves first. */
  const commit = useCallback(
    (c: HandCard, target: string | null | undefined) => {
      if (c.releases.length > 0) {
        setSelected(null);
        setReleasing({ card: c.inst.id, ...(target ? { target } : {}), picked: [] });
        return;
      }
      act({ type: 'play', card: c.inst.id, ...(target ? { target } : {}) });
    },
    [act],
  );

  const endTurn = useCallback(() => {
    if (waiting || game.current?.state.pending) return;
    setReleasing(null);
    act({ type: 'endTurn' });
  }, [act, waiting]);

  const me = view?.sides[mySide];
  // (the Arena has no Potions: the belt is only drawn when this seat was given some, as in a campaign ghost fight)
  const mySetup = mySide === 'a' ? setup.a : setup.b;
  const showBelt = !pvp || ('potions' in mySetup && (mySetup.potions?.length ?? 0) > 0);
  const cw = handCardWidth(window.innerWidth, window.innerHeight);

  const handCards: HandCard[] = useMemo(() => {
    const mineView = view?.sides[mySide];
    if (!mineView?.hand || hideHand) return [];
    return mineView.hand.flatMap((inst) => {
      const def = db.cards[inst.card];
      if (!def) return [];
      const mine = legal.filter((a) => a.type === 'play' && a.card === inst.id);
      const targets = [
        ...new Set(mine.flatMap((a) => (a.type === 'play' && a.target ? [a.target] : []))),
      ];
      // every smallest set of companions that could make room (a single id is a set of one), once each: a card with several
      // targets lists the same sets for every target
      const seen = new Set<string>();
      const releases = mine.flatMap((a) => {
        if (a.type !== 'play' || !a.release) return [];
        const set = Array.isArray(a.release) ? a.release : [a.release];
        const key = [...set].sort().join(',');
        if (seen.has(key)) return [];
        seen.add(key);
        return [set];
      });
      return [
        {
          inst,
          def,
          playable: mine.length > 0,
          targets,
          releases,
          cost: costOf(db, mineView, inst),
        },
      ];
    });
  }, [view, legal, db, mySide, hideHand]);

  const anyPlay = handCards.some((c) => c.playable);

  // (a choice of enchantments or totems has no cards: its kind and options tell two questions in a row apart)
  const pickKey = view?.pending
    ? `${view.pending.kind}:${view.pending.pool.map((c) => c.id).join()}:${(view.pending.charges ?? []).map((c) => c.id + c.kind).join()}:${(view.pending.spirits ?? []).map((c) => c.id + (c.spirit ?? '')).join()}:${view.pending.incoming ?? ''}${view.pending.planting ?? ''}:${pickCount}`
    : '';
  const handPickNow =
    view?.pending && !watch
      ? isHandPick(
          view.pending,
          handCards.map((c) => c.inst.id),
        )
      : false;
  const pickedNow = handPicked.key === pickKey ? handPicked.cards : NONE_PICKED;
  const pickPool = handPickNow && view?.pending ? view.pending.pool.map((c) => c.id) : null;
  const pickSynergy = handPickNow && view?.pending ? premeditateIn(view.pending, db) : [];
  // (a number key pressed just as a choice appears was meant for a card to play, not for this choice)
  const pickShownAt = useRef(0);
  useEffect(() => {
    if (handPickNow) pickShownAt.current = performance.now();
  }, [handPickNow, pickKey]);
  const submitPick = (cards: string[]): void => {
    setPickCount((n) => n + 1);
    // (the next card slides under the pointer: the chosen one's notes must not stay beside it)
    setHoverCard(null);
    act({ type: 'pick', cards });
  };
  const chooseInHand = (id: string): void => {
    const p = view?.pending;
    if (!p) return;
    const pool = p.pool.map((c) => c.id);
    if (!pool.includes(id)) return void play('refuse');
    const step = pickStep(pickedNow, id, { pool, max: p.max });
    if (step.submit) submitPick(step.chosen);
    else setHandPicked({ key: pickKey, cards: step.chosen });
  };

  const selectedCard = handCards.find((c) => c.inst.id === selected) ?? null;
  const releaseCard = releasing
    ? (handCards.find((c) => c.inst.id === releasing.card) ?? null)
    : null;
  // the sets still possible with what was picked, and the one the picks complete (if any)
  const releaseFits = useMemo(
    () =>
      releaseCard && releasing
        ? releaseCard.releases.filter((set) => releasing.picked.every((p) => set.includes(p)))
        : [],
    [releaseCard, releasing],
  );
  // a button for each way to make room, as well as clicking the companion itself (Robert, 2026-10-30: "i thought i would be able to scrap one")
  const scrapButtons = useMemo(() => {
    const crew = live?.sides[mySide].units ?? [];
    return scrapChoices(releaseFits, (id) => {
      const u = crew.find((x) => x.id === id);
      return u ? `${db.units[u.def]?.name ?? 'companion'} (${u.hp} HP)` : 'companion';
    });
  }, [releaseFits, live, mySide, db]);
  const sendRelease = useCallback(
    (set: string[]) => {
      if (!releasing) return;
      act({
        type: 'play',
        card: releasing.card,
        release: set.length === 1 ? (set[0] as string) : set,
        ...(releasing.target ? { target: releasing.target } : {}),
      });
      setReleasing(null);
      setHoverCard(null);
    },
    [act, releasing],
  );
  // how many of the card's companions would come if it is played as it is, with no room made (DECISIONS #405)
  const releaseFit = useMemo(() => {
    const side = live?.sides[mySide];
    return releaseCard && side ? summonsThatFit(db, side, releaseCard.def) : null;
  }, [releaseCard, db, mySide, live]);
  const playAnyway = useCallback(() => {
    if (!releasing) return;
    act({
      type: 'play',
      card: releasing.card,
      ...(releasing.target ? { target: releasing.target } : {}),
    });
    setReleasing(null);
    setHoverCard(null);
  }, [act, releasing]);
  const aimSet = useMemo(
    () =>
      releaseCard && releasing
        ? new Set(releaseFits.flatMap((set) => set.filter((u) => !releasing.picked.includes(u))))
        : aimPotion !== null
          ? new Set(
              legal.flatMap((a) =>
                a.type === 'potion' && a.potion === aimPotion && a.target ? [a.target] : [],
              ),
            )
          : (dragTargets ?? (selectedCard ? new Set(selectedCard.targets) : new Set<string>())),
    [selectedCard, dragTargets, aimPotion, legal, releaseCard, releasing, releaseFits],
  );
  // what each card in hand would really deal right now (Might, Sharpen, Faltering...), and the card being aimed at the unit under
  // the pointer (its Exposed too); a card that could hit several enemies shows the range
  const aiming = dragCard ?? selectedCard;
  const liveCard = aiming && hoverUnit && aimSet.has(hoverUnit) ? aiming.inst.id : null;
  const liveUnit = liveCard ? hoverUnit : null;
  const liveDamage = useMemo(() => {
    const out = new Map<string, ReadonlyMap<number, LiveDamage>>();
    if (!live || watch) return out;
    const st = live.active === mySide ? live : { ...live, active: mySide };
    for (const c of handCards) {
      const m = previewCardDamage(db, st, c.inst.id, liveCard === c.inst.id ? liveUnit : null);
      if (m.size) out.set(c.inst.id, m);
    }
    return out;
  }, [live, watch, mySide, handCards, db, liveCard, liveUnit]);

  useEffect(() => {
    scene.current?.fighters.setTargetable(aimSet.size ? aimSet : null);
    if (!aimSet.size) scene.current?.fighters.setHover(null);
  }, [aimSet]);

  // the centre of the figure being aimed at (client px), for the arrow to lock onto (measured as the pointer moves)
  const [lockOn, setLockOn] = useState<{ id: string; x: number; y: number } | null>(null);
  const lockAt =
    lockOn &&
    lockOn.id === hoverUnit &&
    aimSet.has(lockOn.id) &&
    (selected || dragTargets || releasing)
      ? lockOn
      : null;

  const [touchAimAt, setTouchAimAt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const first = touch && (selected || releasing) ? [...aimSet][0] : undefined;
    const sc = scene.current;
    const at = first ? sc?.fighters.anchor(first) : null;
    setTouchAimAt(sc && at ? sc.stageToClient(at.x, at.y - at.h * 0.5) : null);
  }, [touch, selected, releasing, aimSet]);

  const unitAt = useCallback(
    (cx: number, cy: number, among?: ReadonlySet<string>): string | null => {
      const sc = scene.current;
      if (!sc) return null;
      // A health/name plate is an unambiguous alternative to a model in a crowded rank.
      for (const element of document.elementsFromPoint(cx, cy)) {
        const id = element.closest<HTMLElement>('[data-unit]')?.dataset['unit'];
        if (id && (!among?.size || among.has(id))) return id;
      }
      const p = sc.clientToStage(cx, cy);
      return sc.fighters.hitTest(p.x, p.y, among);
    },
    [],
  );

  // aiming with a selected card: click a target, right-click or Esc cancels
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (selected || releasing) setPointer({ x: e.clientX, y: e.clientY });
      // while aiming, the nearest figure that can be chosen is the one pointed at
      const aiming =
        !!(selected || dragTargets || releasing || aimPotion !== null) && aimSet.size > 0;
      const u = unitAt(e.clientX, e.clientY, aiming ? aimSet : undefined);
      setHoverUnit(u);
      const sc = scene.current;
      const at = u && aimSet.has(u) ? sc?.fighters.anchor(u) : null;
      const c = sc && at ? sc.stageToClient(at.x, at.y - at.h * 0.5) : null;
      setLockOn((prev) =>
        prev && c && prev.id === u && prev.x === c.x && prev.y === c.y
          ? prev
          : u && c
            ? { id: u, ...c }
            : null,
      );
      scene.current?.fighters.setHover(
        selected || dragTargets || releasing || aimPotion !== null
          ? u && aimSet.has(u)
            ? u
            : null
          : null,
      );
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [unitAt, selected, dragTargets, releasing, aimPotion, aimSet]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
      if (pile && e.key !== 'Escape') return;
      if (e.key === 'Escape') {
        if (pile) setPile(null);
        else {
          setSelected(null);
          setAimPotion(null);
          setReleasing(null);
        }
      } else if (e.key === 'e' || e.key === 'E') endTurn();
      else if (/^[1-9]$/.test(e.key) && handPickNow) {
        const c = handCards[Number(e.key) - 1];
        if (c && performance.now() - pickShownAt.current > 150) chooseInHand(c.inst.id);
      } else if (/^[1-9]$/.test(e.key) && !waiting && !watch) {
        const c = handCards[Number(e.key) - 1];
        if (!c) return;
        if (!c.playable) return void play('refuse');
        setReleasing(null);
        if (!needsAim(c)) commit(c, c.targets[0] ?? null);
        else setSelected(c.inst.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chooseInHand is new each render, and pickKey and pickedNow change with it
  }, [act, commit, endTurn, handCards, waiting, pile, watch, handPickNow, pickKey, pickedNow]);

  const chooseAimedUnit = (unit: string) => {
    if (!aimSet.has(unit)) return;
    if (releasing) {
      const picked = [...releasing.picked, unit];
      const done = releaseFits.find(
        (set) => set.length === picked.length && picked.every((id) => set.includes(id)),
      );
      if (done) sendRelease(done);
      else setReleasing({ ...releasing, picked });
    } else if (aimPotion !== null) {
      act({
        type: 'potion',
        index: me?.potions?.indexOf(aimPotion) ?? 0,
        potion: aimPotion,
        target: unit,
      });
      setAimPotion(null);
    } else if (selectedCard?.targets.includes(unit)) commit(selectedCard, unit);
  };
  const friendlyTargets = (me?.units ?? []).filter((unit) => unit.hp > 0 && aimSet.has(unit.id));
  const onStagePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) {
      if (releasing) setReleasing(null);
      else if (aimPotion !== null) setAimPotion(null);
      else if (selectedCard) setSelected(null);
      return;
    }
    const unit = unitAt(e.clientX, e.clientY, aimSet);
    if (unit) chooseAimedUnit(unit);
  };

  // --- placing the DOM plates over the fighters ---------------------------------------------------------
  const placed: Placed[] = [];
  const sc = sceneObj;
  if (view && sc) {
    for (const side of ['a', 'b'] as const) {
      for (const u of view.sides[side].units) {
        const home = sc.fighters.home(u.id);
        if (!home) continue;
        const p = sc.stageToHost(home.x, home.y);
        // a flyer's plate and intent hang from the flyer itself, not from the floor under it
        placed.push({
          unit: u,
          x: p.x,
          y: p.y - home.hover * p.k,
          h: (home.h - home.hover) * p.k,
          w: home.w * p.k,
        });
      }
    }
  }
  const heroPlaced = placed.find((p) => p.unit.kind === 'hero' && p.unit.side === mySide) ?? null;
  const foeSide: Side = mySide === 'a' ? 'b' : 'a';
  const foePlaced = placed.find((p) => p.unit.kind === 'hero' && p.unit.side === foeSide) ?? null;
  const them = view?.sides[foeSide];
  const theirSetup = foeSide === 'a' ? setup.a : setup.b;
  const foeBoons: readonly string[] =
    'boons' in theirSetup && Array.isArray(theirSetup.boons) ? theirSetup.boons : [];
  const omens = props.omens ?? [];
  const floatPos = (f: Float): { left: number; top: number } | null => {
    if (!sc) return null;
    const p = sc.stageToHost(f.x, f.y);
    return { left: p.x, top: p.y };
  };

  const openPile = (kind: 'draw' | 'discard' | 'exhausted') =>
    // (watching someone's live match, their piles stay theirs)
    !hideHand &&
    setPile({
      title:
        kind === 'draw'
          ? 'Draw pile (order hidden)'
          : kind === 'discard'
            ? 'Discard pile'
            : 'Consumed',
      cards: pileCards(game.current?.display ?? null, kind, db, mySide),
    });

  const heroUnit = view?.sides[mySide].units.find((u) => u.kind === 'hero');
  const usesStars = useMemo(() => deckUsesStars(db, mine), [db, mine]);
  const usesRunes = useMemo(() => deckUsesRunes(db, mine), [db, mine]);
  const showStars = usesStars || (me?.stars ?? 0) > 0;
  // how sharp this deck's weapon is (the Old Twelve Gauge, the Obsidian Blade): its sharpest copy (a copy made later starts fresh, #441)
  const ownSide = live?.sides[mySide];
  const sharp = sharpOf(db, ownSide);
  // the Trickster's Suits, as a panel in that side's column (it used to float over the hero, under the Auras list)
  const suitsPanel = (side: Side): ReactNode => {
    const shown = view?.sides[side].suitsTurn;
    if (!shown) return null;
    const hero = view.sides[side].hero;
    const trick = hero ? db.heroes[hero]?.trait?.suits?.fullTrick : undefined;
    const aiming = side === mySide ? (dragCard ?? selectedCard ?? hoverCard) : null;
    // what the next Full Trick deals: its damage, with what the Full Tricks so far this fight have added (it is no attack, so that is all)
    const tricks = view.sides[side].fullTricks ?? 0;
    const trickDmg = (trick ?? []).reduce(
      (sum, o) =>
        o.op === 'damage'
          ? sum + o.amount + (o.scale?.by === 'fullTricks' ? (o.scale.mult ?? 1) * tricks : 0)
          : sum,
      0,
    );
    return (
      <FloatPanel
        id={side === mySide ? 'suits-mine' : 'suits-foe'}
        className="fight__aux fight__aux--suits"
        title={side === mySide ? 'Suits' : 'Their Suits'}
      >
        <SuitTrack
          shown={shown}
          preview={aiming ? suitShown(aiming.def, shown) : null}
          {...(trickDmg > 0 ? { damage: trickDmg } : {})}
          {...(trick ? { fullTrick: trick.map((o) => opText(db, o)).join(' ') } : {})}
        />
      </FloatPanel>
    );
  };
  // (the Spellblade's Obsidian Blade: its two enchantments, as a panel in that side's column, DECISIONS #417)
  const enchantPanel = (side: Side): ReactNode => {
    const held = view?.sides[side].enchants;
    if (!held) return null;
    const aiming = side === mySide ? (dragCard ?? selectedCard ?? hoverCard) : null;
    const ops = aiming?.def.effects ?? [];
    const dis = ops.find((o) => o.op === 'discharge');
    const imbues = ops.flatMap((o) => (o.op === 'imbue' ? [o.kind] : []));
    return (
      <FloatPanel
        id={side === mySide ? 'enchants-mine' : 'enchants-foe'}
        className="fight__aux fight__aux--enchants"
        title={side === mySide ? 'Obsidian Blade' : 'Their Blade'}
      >
        <EnchantSlots
          enchants={held}
          preview={
            dis || imbues.length
              ? {
                  ...(dis && dis.op === 'discharge' ? { discharge: dis.count } : {}),
                  ...(imbues.length ? { imbue: imbues } : {}),
                }
              : null
          }
        />
      </FloatPanel>
    );
  };
  // (the Shaman's totems in their order and his Spirit, as a panel in that side's column, DECISIONS #430: the totem cycle)
  const totemPanel = (side: Side): ReactNode => {
    const sv = view?.sides[side];
    const held = sv?.totems;
    if (!sv || !held) return null;
    const hero = sv.units.find((u) => u.kind === 'hero');
    // (DECISIONS #439) on the stage, in an arc beside the hero: to the left of mine (who faces right), to the right of an opponent's;
    // no panel. Sized from the figure, the next to act at the top.
    const at = side === mySide ? heroPlaced : foePlaced;
    if (!at) return null;
    const mirror = side !== mySide || mode === 'portrait';
    const size = Math.max(mode === 'portrait' ? 40 : 54, Math.round(at.h * 0.24));
    return (
      <TotemArc
        key={`totems-${side}`}
        db={db}
        totems={held}
        spirit={hero?.statuses.spirit ?? 0}
        summon={summon?.side === side ? summon : null}
        // (close beside the figure, and never off the edge of the stage: the arc bows out by half a position)
        x={
          mirror
            ? Math.min(window.innerWidth - size * 1.05 - 6, at.x + at.w * 0.38 + size * 0.45)
            : Math.max(size * 1.05 + 6, at.x - at.w * 0.38 - size * 0.45)
        }
        cy={at.y - at.h * 0.55}
        size={size}
        mirror={mirror}
      />
    );
  };
  // (the Monk's Martial Forms: his form, its progress this turn and his Mastery, as a panel in that side's column, DECISIONS #419)
  const formPanel = (side: Side): ReactNode => {
    const sv = view?.sides[side];
    if (!sv?.form) return null;
    const hero = sv.units.find((u) => u.kind === 'hero');
    return (
      <FloatPanel
        id={side === mySide ? 'form-mine' : 'form-foe'}
        className="fight__aux fight__aux--form"
        title={side === mySide ? 'Form' : 'Their Form'}
      >
        <FormPanel
          form={sv.form}
          progress={sv.formProgress ?? 0}
          done={!!sv.formDone}
          mastery={hero?.statuses.mastery ?? 0}
        />
      </FloatPanel>
    );
  };
  const showRunes = usesRunes || (me?.runes.length ?? 0) > 0;
  // what the drawer holds on a small screen, for its button (DECISIONS #443)
  const sideCount = (() => {
    const boons = (mine.boons?.length ?? 0) + (traitOf(setup[mySide]) ? 1 : 0);
    const auras = me?.powers.length ?? 0;
    const foe = omens.length + foeBoons.length + (them?.powers.length ?? 0);
    const extra =
      view?.sides[mySide].suitsTurn ||
      view?.sides[mySide].enchants ||
      view?.sides[mySide].form ||
      view?.sides[foeSide].suitsTurn ||
      view?.sides[foeSide].enchants ||
      view?.sides[foeSide].form ||
      pvp
        ? 1
        : 0;
    return { boons, auras, foe, total: boons + auras + foe + extra };
  })();
  const tip =
    view && tipsOn && !result && !view.pending
      ? nextTip(view, { usesRunes, usesStars }, seenTips)
      : null;
  const dismissTip = (id: string): void => {
    const next = new Set(seenTips).add(id);
    saveSeen(next);
    setSeenTips(next);
  };

  // what the card being aimed would do to the unit under the pointer
  const aimCard = dragCard ?? selectedCard;
  let preview: { id: string; text: string } | null = null;
  if (aimCard && hoverUnit && aimSet.has(hoverUnit) && view && heroUnit && live) {
    const dealt = previewDamage(db, live, aimCard.inst.id, hoverUnit, heroUnit.id);
    if (dealt && dealt.total > 0)
      preview = {
        id: hoverUnit,
        text: dealt.lethal ? `−${dealt.total} LETHAL` : `−${dealt.total}`,
      };
  }
  // (DECISIONS #432) how each damage number on the hovered card is made, step by step, when it is one number against one enemy
  const hoverLive = hoverCard ? liveDamage.get(hoverCard.inst.id) : undefined;
  const damageSteps = hoverLive
    ? [...hoverLive.values()]
        .filter((l) => l.how && l.how.length > 1)
        .map((l) => ({
          name: `${l.shatter ? 'Shatter' : 'Damage'}${l.lo === l.hi ? '' : ' (the highest)'}`,
          text: l.how!.join(' → '),
        }))
    : [];
  const keywords = hoverCard
    ? [
        ...(live && cleansePreview(hoverCard.def, live, mySide)
          ? [{ name: 'Cleanse now', text: cleansePreview(hoverCard.def, live, mySide)! }]
          : []),
        ...damageSteps,
        ...[sanctifiedNote(db, hoverCard.def)].filter((x) => x !== null),
        ...keywordsOf(
          hoverCard.def,
          (unit) => db.units[unit]?.taunt === true,
          cardText(db, hoverCard.def),
        ),
      ]
    : [];
  const finished = result !== null;
  // a lost fight says, in a line, what ended it (the whole recap is a button away)
  const deathLine = useMemo(() => {
    if (!result || result.winner !== 'b' || !result.replay || watch) return null;
    const { recap } = replayFight(
      db,
      result.replay.setup,
      result.replay.moves,
      mySide,
      pvp ? foeName : null,
    );
    const k = recap.killer;
    if (!k) return null;
    const top = recap.takenFrom[0];
    const most =
      top && top.name !== k.name
        ? ` Most of the harm came from ${top.name} (${top.amount} in all).`
        : '';
    return `The blow that ended it: ${k.name}, ${k.amount} damage on turn ${k.round} (${k.lastRound} lost that turn).${most}`;
  }, [result, watch, db, mySide, pvp, foeName]);

  // the top bar's buttons: in a row, or held upright in a menu (DECISIONS #443)
  const fightMenu = (
    <>
      {props.topFirst}
      <button className="btn btn--small btn--ghost" onClick={props.onExit}>
        <span>{props.exitLabel ?? 'Leave'}</span>
      </button>
      {props.topExtra}
    </>
  );
  // (sound, tips and graphics are in the Settings menu now: DECISIONS #571)
  const fightOpts = (
    <div className="fight__opts">
      <SettingsButton />
    </div>
  );

  return (
    <div
      className={`fight fight--${mode}${sideOpen ? ' is-sideOpen' : ''}${selected || dragTargets || releasing || aimPotion !== null ? ' is-aiming' : ''}`}
      style={
        {
          '--cw': `${cw}px`,
          '--hand-band': `${portraitHandBand(window.innerHeight)}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="fight__stage"
        ref={host}
        onPointerDown={onStagePointerDown}
        onContextMenu={(e) => {
          if (selected || aimPotion !== null || releasing) {
            e.preventDefault();
            setSelected(null);
            setAimPotion(null);
            setReleasing(null);
          }
        }}
      />
      {!ready && !error && <div className="loading">Opening the rift…</div>}
      {error && (
        <div className="loading loading--error">
          <span>The fight hit a problem.</span>
          {looksLikeNewVersion(error) && (
            <span className="errdetails__hint">
              A new version was released while this page was open. Reloading the page gets it.
            </span>
          )}
          <ErrorDetails message={error} />
          <span className="modal__row">
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              <span>Reload the page</span>
            </button>
            <button className="btn" onClick={props.onExit}>
              <span>{props.exitLabel ?? 'Leave'}</span>
            </button>
          </span>
        </div>
      )}

      {view && ready && (
        <>
          {/* (once, when the browser draws without the graphics card: DECISIONS #573) */}
          <LowGraphicsHint />
          <header className="fight__top">
            {mode === 'portrait' ? (
              // (DECISIONS #443) held upright there is no room for a row of buttons: they fold into a menu
              <>
                <button
                  className={`btn btn--small btn--ghost fight__menuBtn${menuOpen ? ' is-on' : ''}`}
                  aria-expanded={menuOpen}
                  {...(menuOpen ? { 'aria-controls': 'fight-menu' } : {})}
                  onClick={() => setMenuOpen((o) => !o)}
                >
                  <span>
                    <span aria-hidden>☰</span> Menu
                  </span>
                </button>
                {menuOpen && (
                  <div
                    id="fight-menu"
                    className="fight__menu"
                    // (any choice in it closes it)
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button')) setMenuOpen(false);
                    }}
                  >
                    {fightMenu}
                    {fightOpts}
                  </div>
                )}
              </>
            ) : (
              fightMenu
            )}
            <div className="fight__title">
              <b>{props.title}</b>
              <span>Turn {Math.max(1, Math.ceil(view.turn / 2))}</span>
              {/* (what is at stake and the Warden's rule share one line under the title, clear of the intents: DECISIONS #562) */}
              {(props.rule || props.stakes) && (
                <span className="fight__notes">
                  {props.stakes && (
                    <span
                      className={`fight__stakes fight__stakes--${props.stakes.tone}`}
                      role="note"
                    >
                      {props.stakes.text}
                    </span>
                  )}
                  {props.rule && (
                    <WardenRule key={props.rule} rule={props.rule} portrait={mode === 'portrait'} />
                  )}
                </span>
              )}
            </div>
            {pvp && !watch && <TurnClock link={pvp} mine={myTurn} foe={foeName} />}
            {watch && (
              <div className="fight__watch" role="group" aria-label="Replay controls">
                <span className="fight__watchTag">
                  {watch.total === null ? 'Watching' : 'Replay'}
                </span>
                <button
                  className="btn btn--small"
                  aria-pressed={paused}
                  onClick={() => setPaused(!paused)}
                >
                  <span>{paused ? 'Play' : 'Pause'}</span>
                </button>
                {/* for checking a game move by move: one move on, then hold again */}
                {paused && (watch.total === null || shownMove < watch.total) && (
                  <button
                    className="btn btn--small"
                    onClick={() => {
                      stepTo.current = shownMove + 1;
                    }}
                  >
                    <span>Step</span>
                  </button>
                )}
                <span className="fight__watchMove">
                  Move {shownMove}
                  {watch.total !== null ? ` / ${watch.total}` : ''}
                </span>
                {WATCH_RATES.map((x) => (
                  <button
                    key={x}
                    className={`btn btn--small btn--ghost${rate === x ? ' is-on' : ''}`}
                    aria-pressed={rate === x}
                    onClick={() => setRate(x)}
                  >
                    <span>{x}×</span>
                  </button>
                ))}
              </div>
            )}
            {mode !== 'portrait' && fightOpts}
            {props.runTimer && <span className="fight__runTimer">{props.runTimer}</span>}
          </header>

          {mode !== 'wide' && !watch && friendlyTargets.length > 0 && (
            <div
              className="fight__friendlyTargets"
              role="group"
              aria-label="Choose a friendly target"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <strong>Choose target</strong>
              <div>
                {friendlyTargets.map((unit, index) => (
                  <button
                    key={unit.id}
                    type="button"
                    className="fight__friendlyTarget"
                    data-friendly-target={unit.id}
                    aria-label={`Choose ${unit.name} ${index + 1}, ${unit.hp} of ${unit.maxHp} HP`}
                    onClick={(e) => {
                      e.stopPropagation();
                      chooseAimedUnit(unit.id);
                    }}
                  >
                    <b>
                      {unit.name} <small>#{index + 1}</small>
                    </b>
                    <span>
                      {unit.hp}/{unit.maxHp} HP
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <UnitPlates
            onTarget={chooseAimedUnit}
            scale={mode === 'portrait' ? 0.64 : mode === 'compact' ? 0.8 : 1}
            // (an intent hangs from this: room for the top bar and the intent itself)
            intentTop={mode === 'wide' ? '7.8rem' : mode === 'portrait' ? '5.8rem' : '6.6rem'}
            preview={preview}
            items={placed}
            heroId={heroUnit?.id ?? null}
            {...((setup[mySide] as { ascendancy?: string }).ascendancy
              ? { ascendancy: (setup[mySide] as { ascendancy?: string }).ascendancy as string }
              : {})}
            targetable={aimSet}
            hover={hoverUnit}
            names
            sharp={sharp}
          />
          <div className="floats" aria-hidden>
            {floats.map((f) => {
              const pos = floatPos(f);
              return pos ? (
                <span key={f.id} className={`float float--${f.tone}`} style={pos}>
                  {f.text}
                </span>
              ) : null;
            })}
          </div>

          {pvp &&
            ([mySide, foeSide] as const).map((s) => {
              const at = s === mySide ? heroPlaced : foePlaced;
              const p = pvp.progress[s];
              return at ? (
                <WhoTag
                  key={s}
                  mine={s === mySide}
                  x={at.x}
                  y={Math.max(4, at.y - at.h - 10)}
                  name={pvp.names[s]}
                  progress={progressLabel(p.tier, p.stage)}
                  unit={at.unit}
                  trophies={pvp.trophies?.[s]}
                  rank={pvp.ranks?.[s]}
                />
              ) : null;
            })}
          {/* the Shaman's totems, in an arc beside him (DECISIONS #439) */}
          {totemPanel(mySide)}
          {pvp && totemPanel(foeSide)}
          {/* a yellow bubble around every Shielded unit, gone with its last stack (DECISIONS #346) */}
          {placed.map((p) => (
            <ShieldBubble
              key={`shield-${p.unit.id}`}
              unit={p.unit}
              x={p.x}
              y={p.y}
              h={p.h}
              w={p.w}
            />
          ))}
          {([mySide, ...(pvp ? [foeSide] : [])] as const).map((s) => {
            const at = s === mySide ? heroPlaced : foePlaced;
            return at ? (
              <StanceAura
                key={s}
                unit={at.unit}
                x={at.x}
                y={at.y}
                h={at.h}
                w={at.w}
                banner={!pvp}
              />
            ) : null;
          })}
          {pvp && foePlaced && view.sides[foeSide].runes.length > 0 && (
            <RuneArc
              db={db}
              me={view.sides[foeSide]}
              x={foePlaced.x - 185}
              cy={foePlaced.y - 110}
              mirror
            />
          )}
          {desync &&
            (watch ? (
              // a replay that no longer plays out as the match did: say from which move, so a bug hunt does not chase what never happened
              <div className="fight__desync" role="alert">
                <b>From move {strayAt ?? '?'} this replay no longer matches the real game.</b>
                <span>
                  The cards have changed since it was played, or something went wrong: what you see
                  from here on is not what happened.
                </span>
              </div>
            ) : (
              <div className="fight__desync" role="alert">
                <b>This match has gone out of step with the server.</b>
                <span>Reload this page: you are put straight back into the match.</span>
              </div>
            ))}
          <BattleLog lines={logLines} db={db} />
          {releasing && (
            <div className="fight__banner fight__banner--info" role="status">
              <span>
                {releasing.picked.length > 0
                  ? 'Still not enough room. Scrap another companion.'
                  : 'Not enough room. Scrap a companion to make room.'}{' '}
                {releaseFit &&
                  releaseCard &&
                  playAnywayHelps(releaseCard.def, releaseFit.fit) &&
                  (releaseFit.fit === 0
                    ? `Or play it without ${releaseFit.total === 1 ? 'its companion' : 'its companions'}.`
                    : `Or play it with only ${releaseFit.fit} of its ${releaseFit.total} companions.`)}
              </span>
              {scrapButtons.map((c) => (
                <button
                  key={c.label}
                  className="btn btn--small btn--primary"
                  onClick={() => sendRelease(c.set)}
                >
                  <span>{c.label}</span>
                </button>
              ))}
              {releaseFit && releaseCard && playAnywayHelps(releaseCard.def, releaseFit.fit) && (
                <button className="btn btn--small" onClick={playAnyway}>
                  <span>
                    {releaseFit.fit > 0
                      ? 'Play anyway'
                      : releaseFit.total === 1
                        ? 'Play without it'
                        : 'Play without them'}
                  </span>
                </button>
              )}
              <button className="btn btn--small" onClick={() => setReleasing(null)}>
                <span>Cancel</span>
              </button>
            </div>
          )}
          {banner && !releasing && (
            <div className={`fight__banner fight__banner--${bannerTone}`} role="status">
              <span>{banner}</span>
            </div>
          )}
          {flourishes.map((f, i) => (
            <FlourishCard
              key={f.id}
              db={db}
              flourish={f}
              // (a played card shows in the right-hand column by the discard pile, a little smaller when watching)
              // (and short enough to stay in its column on a short screen: about 40% of the height)
              width={Math.round(
                Math.min(cw * (watch ? 0.9 : 1.05), 260, (window.innerHeight * 0.4) / 1.4),
              )}
              speed={speed}
              // (it sits at the right edge of the screen: older cards fan out to the left of the newest)
              offset={(i - (flourishes.length - 1)) * (watch ? 30 : 40)}
              onDone={(id) => setFlourishes((list) => list.filter((x) => x.id !== id))}
            />
          ))}

          <FightHand
            db={db}
            cards={handCards}
            live={liveDamage}
            cardWidth={cw}
            locked={handPickNow ? finished : waiting || finished}
            swallowPress={menuOpen || sideOpen}
            picking={
              pickPool
                ? {
                    pool: pickPool,
                    chosen: pickedNow,
                    synergy: pickSynergy,
                    verb: view?.pending ? pickVerb(view.pending) : 'Chosen',
                    onPick: (c) => chooseInHand(c.inst.id),
                  }
                : null
            }
            selectedId={selected}
            unitAt={unitAt}
            lockAt={lockAt}
            fill={mode === 'portrait'}
            onPlay={(c, target) => {
              commit(c, target);
              setHoverCard(null);
            }}
            onSelect={(c) => {
              setAimPotion(null);
              setReleasing(null);
              setSelected(c ? c.inst.id : null);
            }}
            onDragTargets={(ids, c) => {
              setDragTargets(ids);
              setDragCard(c ?? null);
            }}
            onRefuse={(c) => {
              play('refuse');
              shake(document.querySelector(`[data-inst="${CSS.escape(c.inst.id)}"]`));
              if (
                (c.cost ?? c.def.cost) >
                (game.current?.state.sides[mySide].mana ?? 0) +
                  (game.current?.state.sides[mySide].reserves ?? 0)
              )
                shake(document.querySelector('.fight__mana'));
              setBanner(
                (c.cost ?? c.def.cost) >
                  (game.current?.state.sides[mySide].mana ?? 0) +
                    (game.current?.state.sides[mySide].reserves ?? 0)
                  ? 'Not enough Mana'
                  : 'You cannot play that now',
                'bad',
              );
              if (refuseTimer.current) window.clearTimeout(refuseTimer.current);
              refuseTimer.current = window.setTimeout(() => setBanner(null), 700);
            }}
            onHover={(c, r) => {
              // (the hand lifts the card itself, at once; the rest of the screen, the tooltip and the previews, follows when it
              // can, so re-drawing it all never holds up the card under the pointer)
              startTransition(() => {
                setHoverCard(c);
                setHoverRect(c && r ? r : null);
              });
            }}
          />
          {hoverCard && hoverRect && !selected && !dragCard && mode === 'portrait' && (
            // held upright (DECISIONS #443): the card the finger is on is shown big above the hand, as it reads now, with its notes
            <div className="fight__peek" aria-hidden>
              <FightCard
                db={db}
                def={hoverCard.def}
                width={Math.round(Math.min(260, window.innerWidth * 0.56))}
                playable={
                  pickPool ? pickPool.includes(hoverCard.inst.id) : hoverCard.playable && !waiting
                }
                dimmed={pickPool ? !pickPool.includes(hoverCard.inst.id) : !hoverCard.playable}
                {...(hoverCard.inst.bonus ? { bonus: hoverCard.inst.bonus } : {})}
                {...(hoverCard.cost !== undefined && hoverCard.cost !== hoverCard.def.cost
                  ? { cost: hoverCard.cost }
                  : {})}
                {...(liveDamage.has(hoverCard.inst.id)
                  ? { live: liveDamage.get(hoverCard.inst.id)! }
                  : {})}
              />
              {keywords.length > 0 && (
                <ul className="fight__peekKeys">
                  {keywords.map((k) => (
                    <li key={k.name}>
                      <b>{k.name}</b> {k.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {hoverCard &&
            hoverRect &&
            !selected &&
            !dragCard &&
            mode !== 'portrait' &&
            window.innerHeight < 600 && (
              // a short screen (a phone on its side): the card is shown big, with its notes beside it, instead of notes alone
              <CardHover
                def={hoverCard.def}
                at={hoverRect}
                plus={false}
                {...(hoverCard.cost !== undefined ? { cost: hoverCard.cost } : {})}
              />
            )}
          {hoverCard &&
            hoverRect &&
            !selected &&
            !dragCard &&
            window.innerHeight >= 600 &&
            mode !== 'portrait' &&
            keywords.length > 0 && <CardTips items={keywords} rect={hoverRect} cardWidth={cw} />}

          {(selectedCard || releasing) && (!touch || touchAimAt) && (
            <AimArrow
              className="fight__arrow"
              from={{ x: window.innerWidth / 2, y: window.innerHeight - cw * 1.1 }}
              to={touchAimAt ?? pointer}
              lock={touch ? null : lockAt}
            />
          )}
          {me && showBelt && (
            <div className="fight__potions" aria-label="Potion belt">
              <span className="fight__beltLabel">Potions</span>
              <div className="fight__belt">
                {Array.from({ length: 3 }, (_, i) => {
                  const id = me.potions?.[i];
                  return id ? (
                    <PotionButton
                      key={`${id}-${i}`}
                      id={id}
                      disabled={
                        waiting || finished || watch !== null || (view?.pending ?? null) !== null
                      }
                      active={aimPotion === id}
                      onUse={() => {
                        const needs = legal.some(
                          (x) => x.type === 'potion' && x.potion === id && x.target,
                        );
                        setSelected(null);
                        if (!needs) act({ type: 'potion', index: i, potion: id });
                        else setAimPotion(aimPotion === id ? null : id);
                      }}
                    />
                  ) : (
                    <span
                      key={`empty-${i}`}
                      className="potionslot"
                      {...tipAttrs(UI_TIPS.potionSlot)}
                    />
                  );
                })}
              </div>
            </div>
          )}
          {aimPotion !== null && me?.potions?.includes(aimPotion) && (
            <div className="fight__aimbar" role="status">
              <b>{COMBAT_DB_POTION_NAME(aimPotion)}</b>{' '}
              <span>{touch ? 'Tap' : 'Click'} a glowing target.</span>
              <button className="btn btn--small btn--ghost" onClick={() => setAimPotion(null)}>
                <span>Cancel</span>
              </button>
            </div>
          )}
          {handPickNow && view.pending && !finished && (
            <div className="fight__aimbar fight__aimbar--pick" role="status">
              <b>{pickPrompt(view.pending)}</b>{' '}
              <span>{touch ? 'Tap' : 'Click'} a card ringed in gold.</span>
              {view.pending.max > 1 && (
                <span className="fight__pickCount">
                  {pickedNow.length} of {view.pending.max} chosen
                </span>
              )}
              {pickSynergy.length > 0 && (
                <em className="fight__pickSynergy">
                  Premeditate cards come back next turn at 0 Mana.
                </em>
              )}
              {view.pending.min < view.pending.max && (
                <button
                  className="btn btn--small btn--primary"
                  disabled={pickedNow.length < view.pending.min}
                  onClick={() => submitPick(pickedNow)}
                >
                  <span>{pickedNow.length === 0 ? 'Keep them all' : 'Done'}</span>
                </button>
              )}
            </div>
          )}
          {selectedCard && (
            <div className="fight__aimbar" role="status">
              <b>{selectedCard.def.name}</b>{' '}
              <span>{touch ? 'Tap' : 'Click'} a glowing target.</span>
              <button className="btn btn--small btn--ghost" onClick={() => setSelected(null)}>
                <span>Cancel</span>
              </button>
            </div>
          )}

          <div
            className="fight__mana"
            aria-label={`Mana ${me?.mana ?? 0} of ${me?.maxMana ?? 0}`}
            {...tipAttrs(UI_TIPS.mana(me?.mana ?? 0, me?.maxMana ?? 0))}
          >
            <b>{me?.mana ?? 0}</b>
            <small>/{me?.maxMana ?? 0}</small>
          </div>
          <div className="fight__piles">
            <button
              className="pile pile--draw"
              onClick={() => openPile('draw')}
              {...tipAttrs(UI_TIPS.draw)}
            >
              <PileArt kind="draw" count={me?.drawCount ?? 0} />
              <span className="pile__label">Draw</span> <b>{me?.drawCount ?? 0}</b>
            </button>
            <button
              className="pile pile--discard"
              onClick={() => openPile('discard')}
              {...tipAttrs(UI_TIPS.discard)}
            >
              <PileArt kind="discard" count={me?.discardCount ?? 0} />
              <span className="pile__label">Discard</span> <b>{me?.discardCount ?? 0}</b>
            </button>
            {(me?.exhaustedCount ?? 0) > 0 && (
              <button
                className="pile pile--exhaust"
                onClick={() => openPile('exhausted')}
                {...tipAttrs(UI_TIPS.consumed)}
              >
                <PileArt kind="exhaust" count={me?.exhaustedCount ?? 0} />
                <span className="pile__label">Consumed</span> <b>{me?.exhaustedCount ?? 0}</b>
              </button>
            )}
          </div>
          {/* (DECISIONS #443) on a small screen the two side columns fold into one drawer, opened by a button with their counts */}
          {mode === 'portrait' &&
            sideCount.boons + sideCount.auras + sideCount.foe > 0 &&
            !sideOpen && (
              // (your Boons and Auras at a glance in the room at the top left; tapping it opens the drawer with their whole text)
              <button
                className="fight__glance"
                aria-label="Boons and Auras: open the list"
                onClick={() => setSideOpen(true)}
              >
                {traitOf(setup[mySide]) && <b>{traitOf(setup[mySide])?.name}</b>}
                {(mine.boons?.length ?? 0) > 0 && (
                  <span className="fight__glanceRow">
                    ✦ {mine.boons?.length} {mine.boons?.length === 1 ? 'Boon' : 'Boons'}
                  </span>
                )}
                {[...new Set((me?.powers ?? []).map((p) => p.card))].map((card) => (
                  <span key={card} className="fight__glanceRow">
                    ◈ {db.cards[card]?.name ?? 'Aura'}
                  </span>
                ))}
                {sideCount.foe > 0 && (
                  <span className="fight__glanceRow is-foe">☾ {sideCount.foe} against you</span>
                )}
              </button>
            )}
          {foldsSide(mode) && sideCount.total > 0 && (
            <button
              className={`fight__sideToggle${sideOpen ? ' is-open' : ''}`}
              aria-expanded={sideOpen}
              {...(sideOpen ? { 'aria-controls': 'fight-drawer' } : {})}
              aria-label={`Boons and Auras: ${sideCount.boons} Boons and traits, ${sideCount.auras} Auras, ${sideCount.foe} on the other side`}
              onClick={() => setSideOpen((o) => !o)}
            >
              {sideCount.boons > 0 && (
                <span>
                  ✦ <b>{sideCount.boons}</b>
                </span>
              )}
              {sideCount.auras > 0 && (
                <span>
                  ◈ <b>{sideCount.auras}</b>
                </span>
              )}
              {sideCount.foe > 0 && (
                <span className="is-foe">
                  ☾ <b>{sideCount.foe}</b>
                </span>
              )}
              {sideCount.boons + sideCount.auras + sideCount.foe === 0 && <span>Info</span>}
            </button>
          )}
          {(!foldsSide(mode) || sideOpen) && (
            <div
              id="fight-drawer"
              className={foldsSide(mode) ? 'fight__drawer' : 'fight__sides'}
              {...(foldsSide(mode) ? { role: 'region', 'aria-label': 'Boons and Auras' } : {})}
            >
              {/* your side of the screen, top left under the top bar: your Boons, then your Auras (clear of your HP and name) */}
              {/* (your Riftwalker's innate trait is always shown first, so it can be read in the fight) */}
              {(traitOf(setup[mySide]) ||
                (mine.boons?.length ?? 0) > 0 ||
                view?.sides[mySide].suitsTurn ||
                (me?.powers.length ?? 0) > 0) && (
                <div className="fight__side">
                  <TraitChip setup={setup[mySide]} side={view.sides[mySide]} />
                  {(mine.boons?.length ?? 0) > 0 && (
                    <BoonPanel panel="boons-mine" title="Your Boons" boons={mine.boons ?? []} />
                  )}
                  {suitsPanel(mySide)}
                  {enchantPanel(mySide)}
                  {formPanel(mySide)}
                  {me && <AuraList db={db} me={me} panel="auras-mine" title="Your Auras" />}
                </div>
              )}
              {/* the other side, top right: the Omens of this Rift Tier, then an opponent's Boons and Auras (the Arena, a ghost Warden) */}
              {/* the other side, top right, stacked so nothing covers anything: an opponent's piles and trait first (the Arena, a ghost
              Warden), then the Rift Tier's Omens, their Boons and their Auras (a long list of Auras scrolls) */}
              {(pvp ||
                omens.length > 0 ||
                foeBoons.length > 0 ||
                view?.sides[foeSide].suitsTurn ||
                (them?.powers.length ?? 0) > 0) && (
                <div className="fight__side fight__side--foe">
                  {pvp && <FoeBadge side={view.sides[foeSide]} name={foeName} />}
                  {pvp && <TraitChip setup={setup[foeSide]} side={view.sides[foeSide]} />}
                  {omens.length > 0 && (
                    <div className="fight__omens" aria-label="Omens">
                      {omens.map((o) => (
                        <span
                          key={o.name}
                          className="omenchip"
                          tabIndex={0}
                          {...tipAttrs({
                            kicker: 'Omen',
                            title: o.name,
                            tone: 'bad',
                            text: o.text,
                            hint: 'An Omen of this Rift Tier: it lasts the whole run at this tier.',
                          })}
                        >
                          <span aria-hidden>☾</span> {o.name}
                        </span>
                      ))}
                    </div>
                  )}
                  {foeBoons.length > 0 && (
                    <BoonPanel panel="boons-foe" title="Their Boons" boons={foeBoons} />
                  )}
                  {suitsPanel(foeSide)}
                  {enchantPanel(foeSide)}
                  {formPanel(foeSide)}
                  {them && (
                    <AuraList
                      db={db}
                      me={them}
                      panel={pvp ? 'auras-opponent' : 'auras-foe'}
                      title={pvp ? 'Their Auras' : 'Enemy Auras'}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {me && showStars && <LumenCounter value={me.stars} />}
          {me && me.maxReserves > 0 && <ReservesCounter value={me.reserves} max={me.maxReserves} />}
          {me && showRunes && heroPlaced && (
            <RuneArc db={db} me={me} x={heroPlaced.x + 185} cy={heroPlaced.y - 110} />
          )}
          {me && (
            <SnareRow
              db={db}
              // (watching someone's live match: their Traps are face down to you, as to their opponent)
              me={hideHand ? { ...me, snares: me.snares.map((x) => ({ ...x, card: null })) } : me}
              cx={heroPlaced?.x ?? 140}
              top={Math.max(30, (heroPlaced?.y ?? 360) - 44)}
              // the totem column stands at +185 (its right edge about +230): the Traps start beyond it
              dx={showRunes ? 245 : 118}
              tip={(card) => snareTip(db, card)}
            />
          )}
          {pvp && foePlaced && (
            // the opponent's Traps: you can see that they are there (face down), never what they do
            <SnareRow
              db={db}
              me={view.sides[foeSide]}
              foe
              cx={foePlaced.x}
              top={Math.max(30, foePlaced.y - 44)}
              dx={view.sides[foeSide].runes.length > 0 ? 245 : 118}
              tip={() => ({
                kicker: "Opponent's Trap",
                title: 'A face-down Trap',
                text: 'Your opponent set this face down. You will not know what it does until it is triggered.',
                hint: 'It triggers on its own when its trigger happens.',
              })}
            />
          )}
          {!watch && (
            <button
              className={`btn btn--primary fight__end${!anyPlay && !waiting ? ' is-ready' : ''}`}
              disabled={waiting || finished || view.pending !== null}
              onClick={endTurn}
            >
              <span>{waiting ? (pvp ? `${foeName}'s turn…` : 'Enemy turn…') : 'End turn'}</span>
              <kbd>E</kbd>
            </button>
          )}

          {tip && flourishes.length === 0 && (
            <aside className="fight__tip" role="note" aria-live="polite">
              <b>{tip.title}</b>
              <p>{tip.text}</p>
              <button className="btn btn--small" onClick={() => dismissTip(tip.id)}>
                <span>Got it</span>
              </button>
            </aside>
          )}
          {view.pending && !finished && !watch && !handPickNow && (
            <PickModal
              key={pickKey}
              db={db}
              pending={view.pending}
              width={Math.min(190, cw)}
              onSubmit={submitPick}
            />
          )}
          {pile && (
            <PileModal
              db={db}
              title={pile.title}
              cards={pile.cards}
              onClose={() => setPile(null)}
            />
          )}

          {result && peek && (
            <button className="btn btn--primary fight__peekBack" onClick={() => setPeek(false)}>
              <span>Back to the result</span>
            </button>
          )}
          {result && !peek && (
            <div className="fight__result" role="dialog" aria-label="Fight over">
              <div className="fight__resultCard">
                <h2>
                  {watch && pvp
                    ? 'Match over'
                    : result.winner === 'a'
                      ? 'Victory'
                      : result.winner === 'draw'
                        ? 'Draw'
                        : 'Defeat'}
                </h2>
                {pvp?.series && !watch && (
                  <p className="fight__resultSeries">{seriesLine(pvp.series, mySide, foeName)}</p>
                )}
                <p>
                  {watch && pvp
                    ? watchLine(result.winner, watch.end?.reason ?? null, pvp.names, mySide)
                    : pvp
                      ? endLine(result.winner, pvp.end?.reason ?? null, foeName)
                      : result.winner === 'a'
                        ? `${result.hp} HP remaining.`
                        : 'The rift claims another.'}
                </p>
                {deathLine && <p className="fight__resultRecap">{deathLine}</p>}
                {/* Continue first, on top and full width; the replay options in a row under it, smaller (DECISIONS #290, #331) */}
                <div className="fight__resultButtons">
                  <button
                    className="btn btn--primary fight__resultGo"
                    onClick={() => props.onDone(result)}
                  >
                    <span>
                      {props.doneLabel
                        ? props.doneLabel
                        : watch
                          ? (props.exitLabel ?? 'Close')
                          : pvp?.series && !pvp.series.over
                            ? 'Next game'
                            : 'Continue'}
                    </span>
                  </button>
                  <div className="fight__resultActions">
                    <button
                      className="btn btn--small btn--ghost"
                      onClick={() => setRecapFor(result.replay ?? replayOf())}
                    >
                      <span>Recap and battle log</span>
                    </button>
                    <button className="btn btn--small btn--ghost" onClick={() => setPeek(true)}>
                      <span>Look at the board</span>
                    </button>
                    {!watch && result.replay && !(pvp?.series && !pvp.series.over) && (
                      <button
                        className="btn btn--small btn--ghost"
                        onClick={() => setReplaying(result.replay ?? null)}
                      >
                        <span>Watch the replay</span>
                      </button>
                    )}
                    {props.resultExtra?.(result)}
                  </div>
                </div>
              </div>
            </div>
          )}
          {recapFor && <FightRecap db={db} replay={recapFor} onClose={() => setRecapFor(null)} />}
          {replaying &&
            createPortal(
              <div className="fight__replayLayer">
                <Suspense fallback={<div className="loading">Opening the replay…</div>}>
                  <ReplayPlayer
                    replay={replaying}
                    // (an Arena game that ended by a resignation or a clock says so at the end, seen from this seat)
                    end={
                      pvp?.end && pvp.end.reason !== 'win'
                        ? { winner: pvp.end.winner, reason: pvp.end.reason }
                        : null
                    }
                    onClose={() => setReplaying(null)}
                  />
                </Suspense>
              </div>,
              document.body,
            )}
        </>
      )}
    </div>
  );
}

/** Every op the deck (and its hero's Sigil) can run, Powers' triggers included. */
function deckOps(db: CombatDb, hero: HeroSetup): Op[] {
  const nested = (ops: readonly Op[]): Op[] =>
    ops.flatMap((o) => (o.op === 'power' ? [o, ...nested(o.ops)] : [o]));
  return [
    ...nested(db.heroes[hero.hero]?.sigil ?? []),
    ...hero.deck.flatMap((id) => nested(db.cards[id]?.effects ?? [])),
  ];
}

/** Decides which parts of the side panel show: a Riftwalker without totems never sees an empty totem row. */
function deckUsesStars(db: CombatDb, hero: HeroSetup): boolean {
  return (
    deckOps(db, hero).some((o) => o.op === 'stars') ||
    hero.deck.some((id) => (db.cards[id]?.starCost ?? 0) > 0)
  );
}
function deckUsesRunes(db: CombatDb, hero: HeroSetup): boolean {
  return deckOps(db, hero).some((o) => o.op === 'channel');
}

/** What a card would deal to one unit right now: play it on a copy of the real state. Exact, scaling and all. */
function previewDamage(
  db: CombatDb,
  state: CombatState,
  cardId: string,
  targetId: string,
  heroId: string,
): { total: number; lethal: boolean } | null {
  try {
    const r = applyAction(db, state, { type: 'play', card: cardId, target: targetId });
    let total = 0;
    for (const e of r.events)
      if (e.type === 'damage' && e.target === targetId && e.source === heroId && !e.shielded)
        total += e.amount;
    const alive = [...r.state.sides.a.units, ...r.state.sides.b.units].some(
      (u) => u.id === targetId,
    );
    return { total, lethal: !alive };
  } catch {
    return null;
  }
}

const COMBAT_DB_POTION_NAME = (id: string): string => COMBAT_DB.potions[id]?.name ?? 'Potion';

function pileCards(
  d: CombatState | null,
  pile: 'draw' | 'discard' | 'exhausted',
  db: CombatDb,
  me: Side,
): CardDef[] {
  if (!d) return [];
  const sd = d.sides[me];
  const list = pile === 'draw' ? sd.draw : pile === 'discard' ? sd.discard : sd.exhausted;
  const defs = list.flatMap((c) => (db.cards[c.card] ? [db.cards[c.card] as CardDef] : []));
  // the draw pile's order is hidden: show it sorted
  return pile === 'draw' ? [...defs].sort((a, b) => a.name.localeCompare(b.name)) : defs;
}

function PileModal(props: { db: CombatDb; title: string; cards: CardDef[]; onClose: () => void }) {
  return (
    <GrimoireModal
      title={
        <>
          {props.title} <i>({props.cards.length})</i>
        </>
      }
      cards={tallyDefs(props.cards)}
      emptyText="Empty."
      onClose={props.onClose}
    />
  );
}

/** Cards (already resolved to definitions, one per copy) as counted book entries. */
function tallyDefs(cards: readonly CardDef[]): { def: CardDef; n: number }[] {
  const m = new Map<string, { def: CardDef; n: number }>();
  for (const c of cards) {
    const e = m.get(c.id);
    if (e) e.n++;
    else m.set(c.id, { def: c, n: 1 });
  }
  return [...m.values()];
}

/** The tooltip for a face-down Trap: its name and what it does when it springs. */
function snareTip(db: CombatDb, card: string | null): TipContent {
  const def = card ? db.cards[card] : undefined;
  return UI_TIPS.snare(def?.name ?? null, def ? cardText(db, def) : undefined);
}

/** What the result line says when watching someone's match. */
function watchLine(
  winner: Winner,
  reason: string | null,
  names: Record<Side, string>,
  me: Side,
): string {
  if (winner === 'draw' && reason === 'passes')
    return 'Draw: both players passed three turns in a row without playing a card.';
  if (winner === 'draw')
    return reason === 'time'
      ? 'Time was called with both even: nobody won this one.'
      : 'Nobody won this one.';
  // (results are shown from the seat watched from: 'a' is that seat)
  const seat: Side = winner === 'a' ? me : me === 'a' ? 'b' : 'a';
  const loser = names[seat === 'a' ? 'b' : 'a'];
  switch (reason) {
    case 'resign':
      return `${loser} gave up: ${names[seat]} wins.`;
    case 'timeout':
      return `${loser} ran out of time: ${names[seat]} wins.`;
    case 'time':
      return `Time was called: ${names[seat]} had more HP left and wins.`;
    case 'disconnect':
      return `${loser} left: ${names[seat]} wins.`;
    default:
      return `${names[seat]} wins.`;
  }
}

/** What the result line says in a PvP match. */
function endLine(winner: Winner, reason: string | null, foe: string): string {
  const won = winner === 'a';
  if (winner === 'draw' && reason === 'passes')
    return 'Draw: both players passed three turns in a row without playing a card.';
  if (winner === 'draw')
    return reason === 'time'
      ? 'Time was called with you both even. Nobody wins.'
      : 'Both players left. Nobody wins.';
  switch (reason) {
    case 'resign':
      return won ? `${foe} gave up.` : 'You gave up.';
    case 'timeout':
      return won ? `${foe} ran out of time twice in a row.` : 'You ran out of time twice in a row.';
    case 'time':
      return won
        ? `Time was called, and you had more of your HP left than ${foe}.`
        : `Time was called, and ${foe} had more of their HP left.`;
    case 'disconnect':
      return won ? `${foe} left the match.` : 'You left the match too long.';
    default:
      return won ? `You beat ${foe}.` : `${foe} wins this one.`;
  }
}

/** How long the active player has left, counted down from the server's deadline. */
function TurnClock(props: { link: PvpLink; mine: boolean; foe: string }) {
  const { link, mine, foe } = props;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  if (link.end || link.deadline === null) return null;
  const left = Math.max(0, Math.ceil((link.deadline - (now + link.skew)) / 1000));
  const low = left <= 10;
  const clock = (s: number): string => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  // the game's own clock: at 0 it is called for the larger share of HP left (DECISIONS #259)
  const game =
    link.gameEnds !== undefined && link.gameEnds !== null
      ? Math.max(0, Math.ceil((link.gameEnds - (now + link.skew)) / 1000))
      : null;
  return (
    <div className={`fight__clock${low ? ' is-low' : ''}${mine ? ' is-mine' : ''}`} role="timer">
      <span>{mine ? 'Your move' : `${foe}'s move`}</span>
      <b>{clock(left)}</b>
      {game !== null && (
        <small
          className={`fight__gameclock${game <= 120 ? ' is-low' : ''}`}
          title="When this runs out the game is called: whoever has the larger share of their HP left wins. From Turn 51 both heroes lose more HP every turn."
        >
          Game {clock(game)}
        </small>
      )}
    </div>
  );
}

/** About where the hand sits: what is drawn flies here, what is discarded and played leaves from here. */
function handSpot(): Spot {
  return (
    centreOf(document.querySelector('.fhand')) ?? {
      x: window.innerWidth / 2,
      y: window.innerHeight - 120,
    }
  );
}

/** A side's Riftwalker trait (none for a side of enemies). */
function traitOf(s: CombatSetup['a'] | CombatSetup['b']): { name: string; text: string } | null {
  const { hero, ascendancy } = s as { hero?: string; ascendancy?: string };
  return hero && Object.hasOwn(RIFTWALKERS, hero) ? classTrait(hero, ascendancy) : null;
}

/** A Riftwalker's innate trait as a chip in the side column: its name, and what it does on hover. */
function TraitChip(props: {
  setup: CombatSetup['a'] | CombatSetup['b'];
  side: CombatView['sides']['a'];
}) {
  const trait = traitOf(props.setup);
  if (!trait) return null;
  return (
    <span
      className="traitchip"
      tabIndex={0}
      {...tipAttrs({
        kicker: 'Innate',
        title: trait.name,
        tone: 'good',
        text: `${trait.text}${props.side.disciplineText ? `\n\n${props.side.disciplineText}` : ''}`,
      })}
    >
      <span aria-hidden>✧</span> {trait.name}
      {props.side.disciplineLabel && (
        <small className="traitchip__progress">{props.side.disciplineLabel}</small>
      )}
    </span>
  );
}

/** What you can see of the opponent: their hand, piles and set Traps (never the cards themselves). */
function FoeBadge(props: { side: CombatView['sides']['a']; name: string }) {
  const { side, name } = props;
  return (
    <aside className="fight__foe" aria-label="Opponent">
      <b>{name}</b>
      <span>Hand {side.handCount}</span>
      <span>Draw {side.drawCount}</span>
      <span>Discard {side.discardCount}</span>
      <span>Consumed {side.exhaustedCount}</span>
      <span>Mana {side.mana}</span>
      {side.snares.length > 0 && <span>Traps {side.snares.length}</span>}
    </aside>
  );
}
