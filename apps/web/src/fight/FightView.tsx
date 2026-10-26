// The Combat v2 fight screen: the Pixi stage with the fighters in a line, DOM plates over them, the hand along the
// bottom, Mana, piles and End turn. It never decides a rule: it shows the engine's state, offers only legalActions(),
// and replays the engine's events one by one (display.ts) so numbers change exactly when the animation lands.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  applyAction,
  costOf,
  clone,
  cardText,
  createCombat,
  hashState,
  legalActions,
  viewFor,
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
import { COMBAT_DB } from '@sr/content/v2';
import { BattlefieldScene } from '../duel/scene/BattlefieldScene';
import type { VenueId } from '../duel/scene/venue';
import { loadEffectsMode, profileFor } from '../duel/effects';
import { getBaseSpeed, setBaseSpeed } from '../duel/scene/timescale';
import { getSound, play, setSound } from '../audio/sfx';
import { DEFAULT_SPEED } from '../play/prefs';
import { handCardWidth, handReserve } from '../hand/fanLayout';
import { reduceEvent, startingDisplay } from './display';
import { heroFigure, heroProp, hoverOf, unitFigure, unitHeight } from './art';
import { FightHand, type HandCard } from './FightHand';
import { Grimoire } from './Grimoire';
import { UnitPlates, type Placed } from './Plates';
import { ErrorDetails } from '../ui/ErrorDetails';
import { packLine } from './lineLayout';
import { looksLikeNewVersion } from '../ui/errorReport';
import { keywordsOf } from './info';
import { BoonChip } from './BoonChip';
import { CardTips } from './CardTips';
import { CardHover } from './CardHover';
import { preloadAllArt } from '../art/assets';
import { PotionButton } from './PotionChip';
import { PickModal } from './PickModal';
import { tipAttrs, type TipContent } from '../ui/tip';
import { STATUS_INFO, UI_TIPS } from './info';
import { loadSeen, loadTipsOn, nextTip, saveSeen, saveTipsOn } from './tips';
import { AuraList, LumenCounter, RuneArc, SnareRow } from './SidePanel';
import { StanceAura, StanceChip } from './StanceAura';
import { BattleLog } from './BattleLog';
import { LOG_LIMIT, Namer, createDescriber, type LogLine } from './logLines';
import { FlourishCard, type Flourish } from './FlourishCard';
import { useClearOfBelt } from './clearOfBelt';
import type { FighterSpec } from './Fighters';
import { attackFor } from './attackStyles';
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

export interface FightResult {
  winner: Winner;
  /** your hero's HP when it ended (for HP that carries between fights) */
  hp: number;
  /** the potions you did not use */
  potions: string[];
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

/** In a pack, a wide creature (a raptor, a wolf) is kept to a width the line has room for, so the pack does not melt into one long beast. */
function fitHeight(canvas: HTMLCanvasElement, height: number, crowded: boolean): number {
  return !crowded ? height : Math.min(height, (MAX_FIGURE_W * canvas.height) / canvas.width);
}

const MAX_FIGURE_W = 300;
/** how far above the floor the top of a flyer's head may be (stage px) */
const MAX_TOP = 640;
/** where a side's line starts (nearest the middle) and the furthest it may reach, stage px */
const FOE_NEAR = 1010;
const FOE_FAR = 1850;
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
const FOE_HERO_X = 1690;
const FOE_FAR_PVP = 1480;

/** Which way a result reads from the point of view of the seat you sit in ('a' = you). */
const shown = (w: Winner, me: Side): Winner => (w === 'draw' ? 'draw' : w === me ? 'a' : 'b');

/**
 * What stands where. `me` is the seat the player sits in: that side stands on the left (display side 'a'), the other on the
 * right (display side 'b'). Only the display side reaches the stage; unit ids stay the engine's.
 */
function specsFrom(db: CombatDb, s: CombatState, me: Side = 'a'): FighterSpec[] {
  const out: FighterSpec[] = [];
  const pvp = s.mode === 'pvp';
  for (const side of ['a', 'b'] as const) {
    const ds: Side = side === me ? 'a' : 'b';
    // the opponent (and their companions) stand on the right and face left
    const flip = pvp && ds === 'b';
    const units = s.sides[side].units;
    const others = units.filter((x) => x.kind !== 'hero');
    // every figure's real size first: each side is then laid out from those widths, so nothing overlaps
    let airSlot = 0;
    const sized = units.map((u) => {
      const hero = u.kind === 'hero';
      const flies = !hero && hoverOf(u.def) > 0;
      const raw = hero ? heroFigure(u.def) : unitFigure(u.def);
      const canvas = flip && u.kind !== 'enemy' ? mirror(raw) : raw;
      const height = fitHeight(
        canvas,
        unitHeight(db.units[u.def], u.kind),
        !hero && others.length > 1,
      );
      // every other flyer rides higher, so a swarm stands in two layers instead of one tangle; a big one never rises so
      // far that its head (and the next move shown above it) leaves the screen
      const tier = flies ? 1 + (airSlot++ % 2) : 0;
      const hover = flies
        ? Math.min(hoverOf(u.def) + (tier - 1) * 75, Math.max(30, MAX_TOP - height))
        : 0;
      const width = (canvas.width * height) / canvas.height;
      return {
        u,
        hero,
        canvas,
        height,
        hover,
        tier,
        fw: Math.max(width * 0.78, flies ? 140 : 170),
      };
    });
    const line = sized.filter((e) => !e.hero);
    const fit =
      ds === 'b'
        ? packLine(line, FOE_NEAR, pvp ? FOE_FAR_PVP : FOE_FAR)
        : packLine(line, ALLY_NEAR, ALLY_FAR);
    let n = 0;
    for (const e of sized) {
      const prop = e.hero && !flip ? heroProp(e.u.def) : undefined;
      // the floating blade shows while a card tagged 'blade' is in her hand
      const holding = s.sides[side].hand.some((c) => db.cards[c.card]?.tags?.includes('blade'));
      const k = e.hero ? 1 : fit.scale;
      out.push({
        id: e.u.id,
        side: ds,
        isHero: e.hero,
        slot: e.hero ? 0 : n,
        count: line.length,
        ...(e.hero ? (flip ? { x: FOE_HERO_X } : {}) : { x: fit.xs[n++] as number }),
        canvas: e.canvas,
        height: e.height * k,
        ...(e.hover > 0 ? { hover: e.hover * k } : {}),
        attack: attackFor(e.u.def, e.hero),
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
      style={{ left: props.x, top: props.y }}
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

export function FightView(props: {
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
}) {
  const { db, setup, onMove, onResumeFailed } = props;
  const pvp = props.pvp ?? null;
  const watch = props.watch ?? null;
  const hideHand = watch?.hideHand === true;
  /** every move of the fight so far, both seats', in order (the recap and the replay are made from it) */
  const movesRef = useRef<FightMove[]>([]);
  /** watching: paused, and how fast */
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
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
  const refuseTimer = useRef<number | undefined>(undefined);

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
  const [releasing, setReleasing] = useState<{ card: string; target?: string } | null>(null);
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
  const [result, setResult] = useState<FightResult | null>(null);
  const speed = DEFAULT_SPEED;
  const [sound, setSoundOn] = useState(getSound().on);
  const [pile, setPile] = useState<{ title: string; cards: CardDef[] } | null>(null);
  const [sceneObj, setSceneObj] = useState<BattlefieldScene | null>(null);
  const [, bump] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [legal, setLegal] = useState<Action[]>([]);
  // the engine's real state, for previews (the refs behind it must not be read while rendering)
  const [live, setLive] = useState<CombatState | null>(null);
  const [seenTips, setSeenTips] = useState<Set<string>>(loadSeen);
  const [tipsOn, setTipsOn] = useState(loadTipsOn);

  // --- floating numbers ------------------------------------------------------------------------------
  const float = useCallback((unitId: string, text: string, tone: Float['tone']) => {
    const sc = scene.current;
    const home = sc?.fighters.home(unitId);
    if (!sc || !home) return;
    const id = ++floatId.current;
    const jitter = (Math.random() - 0.5) * 30;
    setFloats((f) => [
      ...f.slice(-14),
      { id, x: home.x + jitter, y: home.y - home.h * 0.65, text, tone },
    ]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100);
  }, []);

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
    while (pausedRef.current && !cancelledRef.current) await sleep(120);
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
      const respec = () => sc.fighters.sync(specsFrom(db, d, mySide));
      switch (e.type) {
        case 'turnStart': {
          reduceEvent(db, d, e);
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
          if (e.side === mySide) play('deal');
          await wait(70);
          return;
        case 'discard':
          reduceEvent(db, d, e);
          await wait(16);
          return;
        case 'shuffle':
          reduceEvent(db, d, e);
          await wait(150);
          return;
        case 'play': {
          reduceEvent(db, d, e);
          const def = db.cards[e.def];
          // (in PvE only your side plays cards; in PvP the opponent's cards show too, except a Trap they set)
          if (def) {
            const hero = heroOf(e.side);
            if (e.side === mySide || def.kind !== 'snare') {
              // the card stays on show a good while (it flies to the discard pile when it leaves: see FlourishCard)
              const id = flourishId.current++;
              setFlourishes((list) => [...list.slice(-3), { id, def, mine: e.side === mySide }]);
            }
            if (def.kind === 'attack') {
              if (e.target) await sc.fighters.attack(hero, e.target);
              else await sc.fighters.attack(hero, null);
            } else {
              sc.fighters.act(hero);
              play(def.kind === 'snare' ? 'trapSet' : 'cast');
              await wait(160);
            }
          }
          return;
        }
        case 'act': {
          reduceEvent(db, d, e);
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
          float(e.unit, 'Stunned', 'bad');
          await wait(320);
          return;
        case 'damage': {
          reduceEvent(db, d, e);
          if (e.shielded) {
            float(e.target, 'Shielded!', 'block');
            sc.fighters.pulse(e.target, '#a6f4ff');
            play('buff');
          } else if (e.lost > 0) {
            sc.fighters.hit(e.target, e.lost);
            if (e.lost >= 10 && e.target !== heroId) sc.fighters.pulse(e.target, '#ff8a3a');
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
          float(e.target, `+${e.amount} ⛨`, 'block');
          play('buff');
          await wait(110);
          return;
        case 'heal':
          reduceEvent(db, d, e);
          sc.fighters.pulse(e.target, '#6df0a8');
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
              e.status === 'stunned';
            sc.fighters.pulse(e.target, bad ? '#d12f48' : '#f6dc94');
            float(
              e.target,
              `${STATUS_INFO[e.status]?.name ?? e.status} ${e.amount}`,
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
          await wait(400);
          return;
        case 'died':
          await sc.fighters.die(e.unit);
          reduceEvent(db, d, e);
          respec();
          await wait(120);
          return;
        case 'snareSet':
          reduceEvent(db, d, e);
          await wait(120);
          return;
        case 'snareSprung': {
          reduceEvent(db, d, e);
          const name = db.cards[e.card]?.name ?? 'Trap';
          setBanner(`Trap! ${name}`, e.side === mySide ? 'good' : 'bad');
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
    [db, float, wait, mySide, pvp, foeName, setBanner],
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
        namer.current.register(e.unit, db.units[e.def]?.name ?? e.def, e.side);
      describer.current ??= createDescriber({
        db,
        me: mySide,
        nameOf: (id) => namer.current.nameOf(id),
        sideOf: (id) => namer.current.sideOf(id),
        who: (side) => (side === mySide ? 'You' : foeName),
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
    [db, mySide, foeName],
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
        sc.fighters.sync(specsFrom(db, g.display, mySide), { instant: true });
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
      chain.current = chain.current.then(async () => {
        try {
          // (watching, each move gets a moment to itself, so the eye can follow)
          if (watch && !cancelledRef.current) await wait(WATCH_GAP);
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
                hp: hero?.hp ?? 0,
                potions: [...after.sides[mySide].potions],
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
    let cancelled = false; // this effect run only (StrictMode mounts, unmounts and mounts again)
    let created: BattlefieldScene | null = null;
    // real artwork (if any was supplied) is loaded before the first figure or card is drawn
    preloadAllArt()
      .then(() => BattlefieldScene.create(el, profileFor(loadEffectsMode()), props.venue))
      .then((s) => {
        if (cancelled) {
          s.destroy();
          return;
        }
        created = s;
        scene.current = s;
        setSceneObj(s);
        s.onSound = play;
        s.onFit = () => bump((n) => n + 1);
        s.setBottomReserve(handReserve(handCardWidth(window.innerWidth, window.innerHeight)));
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
        if (resumedAt > 0 || finishing) {
          game.current = { state: from, display: clone(from) };
          setLive(from);
          s.fighters.sync(specsFrom(db, game.current.display, mySide), { instant: true });
          show(game.current.display);
          setReady(true);
          setLocked(false);
          // (the move that ended it is played once the screen is ready: see below)
          finishRef.current = finishing;
          return;
        }
        game.current = { state: start.state, display: startingDisplay(start.state) };
        setLive(start.state);
        s.fighters.sync(specsFrom(db, game.current.display, mySide), { instant: true });
        show(game.current.display);
        setReady(true);
        // (a player coming back to a match in progress skips the opening: the moves so far are replayed silently)
        if (!pvp || pvp.replay === 0) enqueue(start.events, start.state);
        // the opening: events replay the draw; then the player may act
        chain.current = chain.current.then(() => {
          if (!cancelledRef.current) setLocked(false);
        });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    const ro = new ResizeObserver(() => {
      // refitting the scene tells us (onFit) to place the plates again
      scene.current?.setBottomReserve(
        handReserve(handCardWidth(window.innerWidth, window.innerHeight)),
      );
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
        const r = applyAction(db, g.state, a);
        g.state = r.state;
        movesRef.current.push({ seat, action: a });
        setLive(r.state);
        // the answer to a choice closes it on screen straight away (the display state lags the engine)
        if (a.type === 'pick' && seat === mySide) {
          g.display.pending = null;
          show(g.display);
        }
        setLegal(legalFor(r.state));
        setSelected(null);
        setAimPotion(null);
        setReleasing(null);
        if (!history) enqueue(r.events, r.state, pvp ? seat !== mySide : undefined);
        // a campaign fight keeps every move, so a reload can resume it
        if (!history && !pvp) onMove?.(a);
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
        return;
      }
      if (m.hash && hashState(g.state) !== m.hash) setDesync(true);
      if (watchTotal !== null && m.seq >= watchTotal) setWatchedAll(true);
      // the last of the history: put the screen where the engine is
      if (item.history && pvp && m.seq === pvp.replay) {
        g.display = clone(g.state);
        sc.fighters.sync(specsFrom(db, g.display, mySide), { instant: true });
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
        setReleasing({ card: c.inst.id, ...(target ? { target } : {}) });
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
      const releases = [
        ...new Set(mine.flatMap((a) => (a.type === 'play' && a.release ? [a.release] : []))),
      ];
      return [
        {
          inst,
          def,
          playable: mine.length > 0,
          targets,
          releases,
          aim: def.target === 'ally' || def.target === 'friend',
          cost: costOf(db, mineView, inst),
        },
      ];
    });
  }, [view, legal, db, mySide, hideHand]);

  const anyPlay = handCards.some((c) => c.playable);

  const selectedCard = handCards.find((c) => c.inst.id === selected) ?? null;
  const releaseCard = releasing
    ? (handCards.find((c) => c.inst.id === releasing.card) ?? null)
    : null;
  const aimSet = useMemo(
    () =>
      releaseCard
        ? new Set(releaseCard.releases)
        : aimPotion !== null
          ? new Set(
              legal.flatMap((a) =>
                a.type === 'potion' && a.potion === aimPotion && a.target ? [a.target] : [],
              ),
            )
          : (dragTargets ?? (selectedCard ? new Set(selectedCard.targets) : new Set<string>())),
    [selectedCard, dragTargets, aimPotion, legal, releaseCard],
  );

  useEffect(() => {
    scene.current?.fighters.setTargetable(aimSet.size ? aimSet : null);
  }, [aimSet]);

  const unitAt = useCallback(
    (cx: number, cy: number, among?: ReadonlySet<string>): string | null => {
      const sc = scene.current;
      if (!sc) return null;
      const p = sc.clientToStage(cx, cy);
      return sc.fighters.hitTest(p.x, p.y, among);
    },
    [],
  );

  // aiming with a selected card: click a target, right-click or Esc cancels
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (selected) setPointer({ x: e.clientX, y: e.clientY });
      // while aiming, the nearest figure that can be chosen is the one pointed at
      const aiming =
        !!(selected || dragTargets || releasing || aimPotion !== null) && aimSet.size > 0;
      const u = unitAt(e.clientX, e.clientY, aiming ? aimSet : undefined);
      setHoverUnit(u);
      scene.current?.fighters.setHover(
        selected || dragTargets || releasing ? (u && aimSet.has(u) ? u : null) : null,
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
      else if (/^[1-9]$/.test(e.key) && !waiting && !watch) {
        const c = handCards[Number(e.key) - 1];
        if (!c) return;
        if (!c.playable) return void play('refuse');
        setReleasing(null);
        if (c.targets.length <= 1 && !c.aim) commit(c, c.targets[0] ?? null);
        else setSelected(c.inst.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, commit, endTurn, handCards, waiting, pile, watch]);

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (releasing) {
      if (e.button !== 0) return setReleasing(null);
      const u = unitAt(e.clientX, e.clientY, aimSet);
      if (u && aimSet.has(u)) {
        act({
          type: 'play',
          card: releasing.card,
          release: u,
          ...(releasing.target ? { target: releasing.target } : {}),
        });
        setReleasing(null);
        setHoverCard(null);
      }
      return; // a miss keeps aiming: right-click or Esc lets go
    }
    if (aimPotion !== null) {
      if (e.button !== 0) return setAimPotion(null);
      const u = unitAt(e.clientX, e.clientY, aimSet);
      if (u && aimSet.has(u)) {
        act({
          type: 'potion',
          index: me?.potions?.indexOf(aimPotion) ?? 0,
          potion: aimPotion,
          target: u,
        });
        setAimPotion(null);
      }
      return; // (a click that misses keeps aiming: right-click or Esc lets go)
    }
    if (!selectedCard) return;
    if (e.button !== 0) return setSelected(null);
    const u = unitAt(e.clientX, e.clientY, aimSet);
    // a click that misses every target keeps the card chosen: right-click, Esc or the card again lets go
    if (u && selectedCard.targets.includes(u)) commit(selectedCard, u);
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
  // the Obsidian Blade's sharpness (null when this deck has no blade): every copy carries the same bonus
  const ownSide = live?.sides[mySide];
  const blades = ownSide
    ? [...ownSide.hand, ...ownSide.draw, ...ownSide.discard, ...ownSide.exhausted].filter(
        (c) => c.card === 'starforged-blade',
      )
    : [];
  const blade = blades.length > 0 ? Math.max(...blades.map((c) => c.bonus ?? 0)) : null;
  const showRunes = usesRunes || (me?.runes.length ?? 0) > 0;
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
  const keywords = hoverCard
    ? keywordsOf(
        hoverCard.def,
        (unit) => db.units[unit]?.taunt === true,
        cardText(db, hoverCard.def),
      )
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

  return (
    <div className="fight" style={{ '--cw': `${cw}px` } as React.CSSProperties}>
      <div className="fight__rotate" role="alert">
        <span aria-hidden>↻</span>
        <p>Turn your phone sideways to fight.</p>
      </div>
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
          <header className="fight__top">
            {props.topFirst}
            <button className="btn btn--small btn--ghost" onClick={props.onExit}>
              <span>{props.exitLabel ?? 'Leave'}</span>
            </button>
            {props.topExtra}
            <div className="fight__title">
              <b>{props.title}</b>
              <span>Turn {Math.max(1, Math.ceil(view.turn / 2))}</span>
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
            <div className="fight__opts">
              <button
                className="btn btn--small btn--ghost"
                aria-pressed={tipsOn}
                onClick={() => {
                  saveTipsOn(!tipsOn);
                  setTipsOn(!tipsOn);
                }}
              >
                <span>{tipsOn ? 'Tips on' : 'Tips off'}</span>
              </button>
              <button
                className="btn btn--small btn--ghost"
                aria-pressed={sound}
                onClick={() => {
                  setSound({ on: !sound });
                  setSoundOn(!sound);
                }}
              >
                <span>{sound ? 'Sound on' : 'Sound off'}</span>
              </button>
            </div>
          </header>

          <UnitPlates
            preview={preview}
            items={placed}
            heroId={heroUnit?.id ?? null}
            targetable={aimSet}
            hover={hoverUnit}
            names
            sharp={blade}
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
          {pvp && <FoeBadge side={view.sides[foeSide]} name={foeName} />}
          {pvp && foePlaced && view.sides[foeSide].runes.length > 0 && (
            <RuneArc
              db={db}
              me={view.sides[foeSide]}
              x={foePlaced.x - 185}
              cy={foePlaced.y - 110}
              mirror
            />
          )}
          {desync && (
            <div className="fight__desync" role="alert">
              <b>This match has gone out of step with the server.</b>
              <span>Reload this page: you are put straight back into the match.</span>
            </div>
          )}
          <BattleLog lines={logLines} db={db} />
          {releasing && (
            <div className="fight__banner fight__banner--info" role="status">
              <span>Your companions are full. Choose one to release.</span>
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
              width={Math.round(cw * 1.5)}
              speed={speed}
              offset={(i - (flourishes.length - 1) / 2) * 56}
              onDone={(id) => setFlourishes((list) => list.filter((x) => x.id !== id))}
            />
          ))}

          <FightHand
            db={db}
            cards={handCards}
            cardWidth={cw}
            locked={waiting || finished}
            selectedId={selected}
            unitAt={unitAt}
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
              setBanner(
                (c.cost ?? c.def.cost) > (game.current?.state.sides[mySide].mana ?? 0)
                  ? 'Not enough Mana'
                  : 'You cannot play that now',
                'bad',
              );
              if (refuseTimer.current) window.clearTimeout(refuseTimer.current);
              refuseTimer.current = window.setTimeout(() => setBanner(null), 700);
            }}
            onHover={(c, r) => {
              setHoverCard(c);
              setHoverRect(c && r ? r : null);
            }}
          />
          {hoverCard && hoverRect && !selected && !dragCard && window.innerHeight < 600 && (
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
            keywords.length > 0 && <CardTips items={keywords} rect={hoverRect} cardWidth={cw} />}

          {selectedCard && (
            <svg className="fight__arrow" width="100%" height="100%" aria-hidden>
              <defs>
                <marker
                  id="ah"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                >
                  <path d="M0 0 L10 5 L0 10 z" fill="#f6dc94" />
                </marker>
              </defs>
              <path
                d={`M ${window.innerWidth / 2} ${window.innerHeight - cw * 1.1} Q ${(window.innerWidth / 2 + pointer.x) / 2} ${Math.min(pointer.y, window.innerHeight - cw * 1.1) - 140} ${pointer.x} ${pointer.y}`}
                fill="none"
                stroke="#f6dc94"
                strokeWidth="5"
                strokeDasharray="2 10"
                strokeLinecap="round"
                markerEnd="url(#ah)"
              />
            </svg>
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
                      disabled={waiting || finished || watch !== null}
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
              <b>{COMBAT_DB_POTION_NAME(aimPotion)}</b> <span>Click a glowing target.</span>
              <button className="btn btn--small btn--ghost" onClick={() => setAimPotion(null)}>
                <span>Cancel</span>
              </button>
            </div>
          )}
          {selectedCard && (
            <div className="fight__aimbar" role="status">
              <b>{selectedCard.def.name}</b> <span>Click a glowing target.</span>
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
              Draw <b>{me?.drawCount ?? 0}</b>
            </button>
            <button
              className="pile pile--discard"
              onClick={() => openPile('discard')}
              {...tipAttrs(UI_TIPS.discard)}
            >
              Discard <b>{me?.discardCount ?? 0}</b>
            </button>
            {(me?.exhaustedCount ?? 0) > 0 && (
              <button
                className="pile pile--exhaust"
                onClick={() => openPile('exhausted')}
                {...tipAttrs(UI_TIPS.consumed)}
              >
                Consumed <b>{me?.exhaustedCount ?? 0}</b>
              </button>
            )}
          </div>
          {/* your side of the screen, top left under the top bar: your Boons, then your Auras (clear of your HP and name) */}
          {((mine.boons?.length ?? 0) > 0 || (me?.powers.length ?? 0) > 0) && (
            <div className="fight__side">
              {(mine.boons?.length ?? 0) > 0 && (
                <div className="fight__boons" aria-label="Boons">
                  {mine.boons?.map((id) => (
                    <BoonChip key={id} id={id} />
                  ))}
                </div>
              )}
              {me && <AuraList db={db} me={me} />}
            </div>
          )}
          {me && showStars && <LumenCounter value={me.stars} />}
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
                text: 'Your opponent set this face down. You will not know what it does until it springs.',
                hint: 'It springs on its own when its trigger happens.',
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
          {view.pending && !finished && !watch && (
            <PickModal
              key={view.pending.pool.map((c) => c.id).join()}
              db={db}
              pending={view.pending}
              width={Math.min(190, cw)}
              onSubmit={(cards) => act({ type: 'pick', cards })}
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
                <div className="fight__resultActions">
                  <button
                    className="btn btn--small"
                    onClick={() => setRecapFor(result.replay ?? replayOf())}
                  >
                    <span>Recap and battle log</span>
                  </button>
                  <button className="btn btn--small btn--ghost" onClick={() => setPeek(true)}>
                    <span>Look at the board</span>
                  </button>
                  {!watch && result.replay && !(pvp?.series && !pvp.series.over) && (
                    <button
                      className="btn btn--small"
                      onClick={() => setReplaying(result.replay ?? null)}
                    >
                      <span>Watch the replay</span>
                    </button>
                  )}
                  {props.resultExtra?.(result)}
                </div>
                <button className="btn btn--primary" onClick={() => props.onDone(result)}>
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
    <div
      className="fight__modal"
      onPointerDown={props.onClose}
      role="dialog"
      aria-label={props.title}
    >
      <div
        className="fight__modalBody fight__modalBody--book"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <header>
          <h3>
            {props.title} <small>({props.cards.length})</small>
          </h3>
          <button className="btn btn--small" onClick={props.onClose}>
            <span>Close</span>
          </button>
        </header>
        <Grimoire cards={tallyDefs(props.cards)} emptyText="Empty." reading />
      </div>
    </div>
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
  if (winner === 'draw') return 'Nobody won this one.';
  // (results are shown from the seat watched from: 'a' is that seat)
  const seat: Side = winner === 'a' ? me : me === 'a' ? 'b' : 'a';
  const loser = names[seat === 'a' ? 'b' : 'a'];
  switch (reason) {
    case 'resign':
      return `${loser} gave up: ${names[seat]} wins.`;
    case 'timeout':
      return `${loser} ran out of time: ${names[seat]} wins.`;
    case 'disconnect':
      return `${loser} left: ${names[seat]} wins.`;
    default:
      return `${names[seat]} wins.`;
  }
}

/** What the result line says in a PvP match. */
function endLine(winner: Winner, reason: string | null, foe: string): string {
  const won = winner === 'a';
  if (winner === 'draw') return 'Both players left. Nobody wins.';
  switch (reason) {
    case 'resign':
      return won ? `${foe} gave up.` : 'You gave up.';
    case 'timeout':
      return won ? `${foe} ran out of time twice in a row.` : 'You ran out of time twice in a row.';
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
  return (
    <div className={`fight__clock${low ? ' is-low' : ''}${mine ? ' is-mine' : ''}`} role="timer">
      <span>{mine ? 'Your move' : `${foe}'s move`}</span>
      <b>
        {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
      </b>
    </div>
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
