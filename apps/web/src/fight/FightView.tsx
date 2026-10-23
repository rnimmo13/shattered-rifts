// The Combat v2 fight screen: the Pixi stage with the fighters in a line, DOM plates over them, the hand along the
// bottom, Mana, piles and End turn. It never decides a rule: it shows the engine's state, offers only legalActions(),
// and replays the engine's events one by one (display.ts) so numbers change exactly when the animation lands.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyAction,
  clone,
  createCombat,
  legalActions,
  viewFor,
  type Action,
  type CardDef,
  type CombatDb,
  type CombatEvent,
  type CombatSetup,
  type CombatState,
  type CombatView,
  type Op,
  type Winner,
} from '@sr/combat';
import { COMBAT_DB } from '@sr/content/v2';
import { BattlefieldScene } from '../duel/scene/BattlefieldScene';
import { loadEffectsMode, profileFor } from '../duel/effects';
import { setBaseSpeed } from '../duel/scene/timescale';
import { getSound, play, setSound } from '../audio/sfx';
import { SPEEDS, loadSpeed, saveSpeed } from '../play/prefs';
import { handCardWidth, handReserve } from '../hand/fanLayout';
import { reduceEvent, startingDisplay } from './display';
import { heroFigure, unitFigure, unitHeight } from './art';
import { FightHand, type HandCard } from './FightHand';
import { FightCard } from './FightCard';
import { UnitPlates, type Placed } from './Plates';
import { keywordsOf } from './info';
import { BoonChip } from './BoonChip';
import { preloadArt } from '../art/assets';
import { PotionButton } from './PotionChip';
import { PickModal } from './PickModal';
import { AuraList, LumenCounter, RuneArc } from './SidePanel';
import type { FighterSpec } from './Fighters';
import '../duel/duel.css';
import '../play/play.css';
import './fight.css';

export interface FightResult {
  winner: Winner;
  /** your hero's HP when it ended (for HP that carries between fights) */
  hp: number;
  /** the potions you did not use */
  potions: string[];
}

interface Float {
  id: number;
  x: number;
  y: number;
  text: string;
  tone: 'dmg' | 'block' | 'heal' | 'good' | 'bad';
}

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => window.setTimeout(r, Math.max(0, ms)));

function specsFrom(db: CombatDb, s: CombatState): FighterSpec[] {
  const out: FighterSpec[] = [];
  for (const side of ['a', 'b'] as const) {
    let slot = 0;
    for (const u of s.sides[side].units) {
      const hero = u.kind === 'hero';
      out.push({
        id: u.id,
        side,
        isHero: hero,
        slot: hero ? 0 : slot++,
        canvas: hero ? heroFigure(u.def) : unitFigure(u.def),
        height: unitHeight(db.units[u.def], u.kind),
      });
    }
  }
  return out;
}

export function FightView(props: {
  db: CombatDb;
  setup: CombatSetup;
  title: string;
  onDone: (r: FightResult) => void;
  onExit: () => void;
  exitLabel?: string;
}) {
  const { db, setup } = props;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BattlefieldScene | null>(null);
  const game = useRef<{ state: CombatState; display: CombatState } | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const pending = useRef({ all: 0, enemy: 0 });
  const speedRef = useRef(loadSpeed());
  const cancelledRef = useRef(false);
  const floatId = useRef(0);
  const refuseTimer = useRef<number | undefined>(undefined);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CombatView | null>(null);
  const [locked, setLocked] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [hoverCard, setHoverCard] = useState<HandCard | null>(null);
  const [hoverUnit, setHoverUnit] = useState<string | null>(null);
  const [dragTargets, setDragTargets] = useState<ReadonlySet<string> | null>(null);
  const [dragCard, setDragCard] = useState<HandCard | null>(null);
  const [aimPotion, setAimPotion] = useState<string | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [banner, setBanner] = useState<string | null>(null);
  const [flourish, setFlourish] = useState<CardDef | null>(null);
  const [result, setResult] = useState<FightResult | null>(null);
  const [speed, setSpeed] = useState(loadSpeed);
  const [sound, setSoundOn] = useState(getSound().on);
  const [pile, setPile] = useState<{ title: string; cards: CardDef[] } | null>(null);
  const [sceneObj, setSceneObj] = useState<BattlefieldScene | null>(null);
  const [, bump] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [legal, setLegal] = useState<Action[]>([]);
  // the engine's real state, for previews (the refs behind it must not be read while rendering)
  const [live, setLive] = useState<CombatState | null>(null);

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

  const show = useCallback((s: CombatState) => setView(viewFor(db, s, 'a')), [db]);

  // --- replaying events ---------------------------------------------------------------------------
  const wait = useCallback((ms: number) => sleep(ms / speedRef.current), []);

  const playEvent = useCallback(
    async (e: CombatEvent, all: CombatEvent[], i: number): Promise<void> => {
      const g = game.current;
      const sc = scene.current;
      if (!g || !sc) return;
      const d = g.display;
      const heroId = d.sides.a.units.find((u) => u.kind === 'hero')?.id ?? '';
      const respec = () => sc.fighters.sync(specsFrom(db, d));
      switch (e.type) {
        case 'turnStart': {
          reduceEvent(db, d, e);
          if (e.side === 'b') {
            setBanner('Enemy turn');
            await wait(650);
            setBanner(null);
          } else if (e.turn > 1) {
            setBanner('Your turn');
            play('turn');
            await wait(450);
            setBanner(null);
          }
          return;
        }
        case 'draw':
          reduceEvent(db, d, e);
          if (e.side === 'a') play('deal');
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
          if (e.side === 'a' && def) {
            setFlourish(def);
            window.setTimeout(
              () => setFlourish((c) => (c === def ? null : c)),
              650 / speedRef.current,
            );
            if (def.kind === 'attack') {
              if (e.target) await sc.fighters.attack(heroId, e.target);
              else await sc.fighters.attack(heroId, null);
            } else {
              sc.fighters.act(heroId);
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
              `${e.status[0]?.toUpperCase()}${e.status.slice(1)} ${e.amount}`,
              bad ? 'bad' : 'good',
            );
            await wait(110);
          }
          return;
        }
        case 'summon':
          reduceEvent(db, d, e);
          respec();
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
          const name = db.cards[e.card]?.name ?? 'Snare';
          setBanner(`Snare! ${name}`);
          play('trapReveal');
          await wait(800);
          setBanner(null);
          return;
        }
        case 'prevented':
          float(e.unit, 'Prevented!', 'good');
          await wait(220);
          return;
        case 'gameOver':
          reduceEvent(db, d, e);
          sc.fighters.finish(e.winner);
          play(e.winner === 'a' ? 'win' : 'lose');
          await wait(700);
          return;
        default:
          reduceEvent(db, d, e);
          return;
      }
    },
    [db, float, wait],
  );

  const runBatch = useCallback(
    async (events: CombatEvent[], after: CombatState) => {
      const g = game.current;
      const sc = scene.current;
      if (!g || !sc || cancelledRef.current) return;
      try {
        for (let i = 0; i < events.length; i++) {
          if (cancelledRef.current) return;
          await playEvent(events[i] as CombatEvent, events, i);
          show(g.display);
        }
      } catch (err) {
        console.warn('[fight] replay failed; resyncing', err);
      }
      if (cancelledRef.current) return;
      setBanner(null);
      // whatever happened, the screen ends exactly where the engine is
      try {
        g.display = clone(after);
        sc.fighters.sync(specsFrom(db, g.display), { instant: true });
        show(g.display);
        bump((n) => n + 1);
      } catch (err) {
        console.warn('[fight] resync failed', err);
      }
    },
    [db, playEvent, show],
  );

  const enqueue = useCallback(
    (events: CombatEvent[], after: CombatState) => {
      const enemyPhase = events.some((e) => e.type === 'turnStart' && e.side === 'b');
      pending.current.all++;
      if (enemyPhase) {
        pending.current.enemy++;
        setLocked(true);
      }
      chain.current = chain.current.then(async () => {
        try {
          await runBatch(events, after);
        } catch (err) {
          console.warn('[fight] batch failed', err);
        }
        pending.current.all--;
        if (enemyPhase) pending.current.enemy--;
        if (pending.current.enemy === 0 && !cancelledRef.current) setLocked(false);
        if (after.winner && pending.current.all === 0 && !cancelledRef.current) {
          const hero = after.sides.a.units.find((u) => u.kind === 'hero');
          window.setTimeout(
            () =>
              setResult({
                winner: after.winner as Winner,
                hp: hero?.hp ?? 0,
                potions: [...after.sides.a.potions],
              }),
            300,
          );
        }
      });
    },
    [runBatch],
  );

  // --- mount: build the scene and start the fight ---------------------------------------------------
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    cancelledRef.current = false;
    let cancelled = false; // this effect run only (StrictMode mounts, unmounts and mounts again)
    let created: BattlefieldScene | null = null;
    // real artwork (if any was supplied) is loaded before the first figure or card is drawn
    preloadArt()
      .then(() => BattlefieldScene.create(el, profileFor(loadEffectsMode())))
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
        s.setBottomReserve(handReserve(handCardWidth(window.innerWidth)));
        setBaseSpeed(speedRef.current);
        const start = createCombat(db, setup);
        game.current = { state: start.state, display: startingDisplay(start.state) };
        setLive(start.state);
        s.fighters.sync(specsFrom(db, game.current.display), { instant: true });
        show(game.current.display);
        setReady(true);
        enqueue(start.events, start.state);
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
      scene.current?.setBottomReserve(handReserve(handCardWidth(window.innerWidth)));
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
    setBaseSpeed(speed);
    speedRef.current = speed;
    saveSpeed(speed);
  }, [speed]);

  // --- acting ---------------------------------------------------------------------------------------------
  const act = useCallback(
    (a: Action) => {
      const g = game.current;
      if (!g || g.state.winner || cancelledRef.current) return;
      if (pending.current.enemy > 0) return; // the enemy turn is still playing out
      try {
        const r = applyAction(db, g.state, a);
        g.state = r.state;
        setLive(r.state);
        // the answer to a choice closes it on screen straight away (the display state lags the engine)
        if (a.type === 'pick') {
          g.display.pending = null;
          show(g.display);
        }
        setLegal(legalActions(db, r.state));
        setSelected(null);
        setAimPotion(null);
        enqueue(r.events, r.state);
      } catch (err) {
        console.warn('[fight] illegal action', err);
        play('refuse');
      }
    },
    [db, enqueue, show],
  );

  // keep the legal list fresh whenever the real state changes
  useEffect(() => {
    if (game.current) setLegal(legalActions(db, game.current.state));
  }, [db, ready]);

  const endTurn = useCallback(() => {
    if (locked || game.current?.state.pending) return;
    act({ type: 'endTurn' });
  }, [act, locked]);

  const me = view?.sides.a;
  const cw = handCardWidth(window.innerWidth);

  const handCards: HandCard[] = useMemo(() => {
    if (!view?.sides.a.hand) return [];
    return view.sides.a.hand.flatMap((inst) => {
      const def = db.cards[inst.card];
      if (!def) return [];
      const mine = legal.filter((a) => a.type === 'play' && a.card === inst.id);
      const targets = mine.flatMap((a) => (a.type === 'play' && a.target ? [a.target] : []));
      return [
        {
          inst,
          def,
          playable: mine.length > 0,
          targets,
          aim: def.target === 'ally' || def.target === 'friend',
        },
      ];
    });
  }, [view, legal, db]);

  const anyPlay = handCards.some((c) => c.playable);

  const selectedCard = handCards.find((c) => c.inst.id === selected) ?? null;
  const aimSet = useMemo(
    () =>
      aimPotion !== null
        ? new Set(
            legal.flatMap((a) =>
              a.type === 'potion' && a.potion === aimPotion && a.target ? [a.target] : [],
            ),
          )
        : (dragTargets ?? (selectedCard ? new Set(selectedCard.targets) : new Set<string>())),
    [selectedCard, dragTargets, aimPotion, legal],
  );

  useEffect(() => {
    scene.current?.fighters.setTargetable(aimSet.size ? aimSet : null);
  }, [aimSet]);

  const unitAt = useCallback((cx: number, cy: number): string | null => {
    const sc = scene.current;
    if (!sc) return null;
    const p = sc.clientToStage(cx, cy);
    return sc.fighters.hitTest(p.x, p.y);
  }, []);

  // aiming with a selected card: click a target, right-click or Esc cancels
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (selected) setPointer({ x: e.clientX, y: e.clientY });
      const u = unitAt(e.clientX, e.clientY);
      setHoverUnit(u);
      scene.current?.fighters.setHover(
        selected || dragTargets ? (u && aimSet.has(u) ? u : null) : null,
      );
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [unitAt, selected, dragTargets, aimSet]);

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
        }
      } else if (e.key === 'e' || e.key === 'E') endTurn();
      else if (/^[1-9]$/.test(e.key) && !locked) {
        const c = handCards[Number(e.key) - 1];
        if (!c) return;
        if (!c.playable) return void play('refuse');
        if (c.targets.length <= 1 && !c.aim)
          act({ type: 'play', card: c.inst.id, ...(c.targets[0] ? { target: c.targets[0] } : {}) });
        else setSelected(c.inst.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, endTurn, handCards, locked, pile]);

  const onStagePointerDown = (e: React.PointerEvent) => {
    if (aimPotion !== null) {
      if (e.button !== 0) return setAimPotion(null);
      const u = unitAt(e.clientX, e.clientY);
      if (u && aimSet.has(u)) {
        act({
          type: 'potion',
          index: me?.potions?.indexOf(aimPotion) ?? 0,
          potion: aimPotion,
          target: u,
        });
        setAimPotion(null);
      } else setAimPotion(null);
      return;
    }
    if (!selectedCard) return;
    if (e.button !== 0) return setSelected(null);
    const u = unitAt(e.clientX, e.clientY);
    if (u && selectedCard.targets.includes(u))
      act({ type: 'play', card: selectedCard.inst.id, target: u });
    else setSelected(null);
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
        placed.push({ unit: u, x: p.x, y: p.y, h: home.h * p.k, w: home.w * p.k });
      }
    }
  }
  const heroPlaced = placed.find((p) => p.unit.kind === 'hero' && p.unit.side === 'a') ?? null;
  const floatPos = (f: Float): { left: number; top: number } | null => {
    if (!sc) return null;
    const p = sc.stageToHost(f.x, f.y);
    return { left: p.x, top: p.y };
  };

  const openPile = (kind: 'draw' | 'discard' | 'exhausted') =>
    setPile({
      title:
        kind === 'draw'
          ? 'Draw pile (order hidden)'
          : kind === 'discard'
            ? 'Discard pile'
            : 'Consumed',
      cards: pileCards(game.current?.display ?? null, kind, db),
    });

  const heroUnit = view?.sides.a.units.find((u) => u.kind === 'hero');
  const usesStars = useMemo(() => deckUsesStars(db, setup), [db, setup]);
  const usesRunes = useMemo(() => deckUsesRunes(db, setup), [db, setup]);
  const showStars = usesStars || (me?.stars ?? 0) > 0;
  const showRunes = usesRunes || (me?.runes.length ?? 0) > 0;

  // what the card being aimed would do to the unit under the pointer
  const aimCard = dragCard ?? selectedCard;
  let preview: { id: string; text: string } | null = null;
  if (aimCard && hoverUnit && aimSet.has(hoverUnit) && view && heroUnit && live) {
    const dealt = previewDamage(db, live, aimCard.inst.id, hoverUnit, heroUnit.id);
    if (dealt && dealt.total > 0)
      preview = { id: hoverUnit, text: dealt.lethal ? `−${dealt.total} LETHAL` : `−${dealt.total}` };
  }
  const keywords = hoverCard
    ? keywordsOf(hoverCard.def, (unit) => db.units[unit]?.taunt === true)
    : [];
  const finished = result !== null;

  return (
    <div className="fight" style={{ '--cw': `${cw}px` } as React.CSSProperties}>
      <div
        className="fight__stage"
        ref={host}
        onPointerDown={onStagePointerDown}
        onContextMenu={(e) => {
          if (selected || aimPotion !== null) {
            e.preventDefault();
            setSelected(null);
            setAimPotion(null);
          }
        }}
      />
      {!ready && !error && <div className="loading">Opening the rift…</div>}
      {error && (
        <div className="loading loading--error">
          The fight hit a problem: {error}
          <button className="btn" onClick={props.onExit}>
            <span>{props.exitLabel ?? 'Leave'}</span>
          </button>
        </div>
      )}

      {view && ready && (
        <>
          <header className="fight__top">
            <button className="btn btn--small btn--ghost" onClick={props.onExit}>
              <span>{props.exitLabel ?? 'Leave'}</span>
            </button>
            <div className="fight__title">
              <b>{props.title}</b>
              <span>Turn {Math.max(1, Math.ceil(view.turn / (view.mode === 'pve' ? 2 : 1)))}</span>
            </div>
            {(setup.a.boons?.length ?? 0) > 0 && (
              <div className="fight__boons" aria-label="Boons">
                {setup.a.boons?.map((id) => (
                  <BoonChip key={id} id={id} />
                ))}
              </div>
            )}
            <div className="fight__opts">
              <select
                aria-label="Animation speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>
                    {s}×
                  </option>
                ))}
              </select>
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

          {banner && (
            <div className="fight__banner" role="status">
              <span>{banner}</span>
            </div>
          )}
          {flourish && (
            <div className="fight__flourish" aria-hidden>
              <FightCard db={db} def={flourish} width={Math.round(cw * 1.5)} />
            </div>
          )}

          <FightHand
            db={db}
            cards={handCards}
            cardWidth={cw}
            locked={locked || finished}
            selectedId={selected}
            unitAt={unitAt}
            onPlay={(c, target) => {
              act({ type: 'play', card: c.inst.id, ...(target ? { target } : {}) });
              setHoverCard(null);
            }}
            onSelect={(c) => {
              setAimPotion(null);
              setSelected(c ? c.inst.id : null);
            }}
            onDragTargets={(ids, c) => {
              setDragTargets(ids);
              setDragCard(c ?? null);
            }}
            onRefuse={(c) => {
              play('refuse');
              setBanner(
                c.def.cost > (game.current?.state.sides.a.mana ?? 0)
                  ? 'Not enough Mana'
                  : 'You cannot play that now',
              );
              if (refuseTimer.current) window.clearTimeout(refuseTimer.current);
              refuseTimer.current = window.setTimeout(() => setBanner(null), 700);
            }}
            onHover={setHoverCard}
          />
          {hoverCard && !selected && !dragCard && keywords.length > 0 && (
            <aside className="fight__tips" aria-hidden>
              {keywords.map((k) => (
                <p key={k.name}>
                  <b>{k.name}</b> {k.text}
                </p>
              ))}
            </aside>
          )}

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
          {(me?.potions?.length ?? 0) > 0 && (
            <div className="fight__potions" aria-label="Potions">
              {me?.potions?.map((id, i) => (
                <PotionButton
                  key={`${id}-${i}`}
                  id={id}
                  disabled={locked || finished}
                  active={aimPotion === id}
                  onUse={() => {
                    const needs = legal.some(
                      (a) => a.type === 'potion' && a.potion === id && a.target,
                    );
                    setSelected(null);
                    if (!needs) act({ type: 'potion', index: i, potion: id });
                    else setAimPotion(aimPotion === id ? null : id);
                  }}
                />
              ))}
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

          <div className="fight__mana" aria-label={`Mana ${me?.mana ?? 0} of ${me?.maxMana ?? 0}`}>
            <b>{me?.mana ?? 0}</b>
            <small>/{me?.maxMana ?? 0}</small>
          </div>
          <div className="fight__piles">
            <button className="pile pile--draw" onClick={() => openPile('draw')}>
              Draw <b>{me?.drawCount ?? 0}</b>
            </button>
            <button className="pile pile--discard" onClick={() => openPile('discard')}>
              Discard <b>{me?.discardCount ?? 0}</b>
            </button>
            {(me?.exhaustedCount ?? 0) > 0 && (
              <button className="pile pile--exhaust" onClick={() => openPile('exhausted')}>
                Consumed <b>{me?.exhaustedCount ?? 0}</b>
              </button>
            )}
          </div>
          {me && <AuraList db={db} me={me} />}
          {me && showStars && <LumenCounter value={me.stars} />}
          {me && showRunes && heroPlaced && (
            <RuneArc db={db} me={me} cx={heroPlaced.x} top={heroPlaced.y + 78} />
          )}
          {me && me.snares.length > 0 && (
            <div className="fight__snares" title="Face-down Snares spring on their own">
              {me.snares.map((s) => (
                <span
                  key={s.id}
                  className="snare"
                  title={s.card ? (db.cards[s.card]?.name ?? 'Snare') : 'Snare'}
                >
                  ✧
                </span>
              ))}
            </div>
          )}
          <button
            className={`btn btn--primary fight__end${!anyPlay && !locked ? ' is-ready' : ''}`}
            disabled={locked || finished || view.pending !== null}
            onClick={endTurn}
          >
            <span>{locked ? 'Enemy turn…' : 'End turn'}</span>
            <kbd>E</kbd>
          </button>

          {view.pending && !finished && (
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

          {result && (
            <div className="fight__result" role="dialog" aria-label="Fight over">
              <div className="fight__resultCard">
                <h2>
                  {result.winner === 'a' ? 'Victory' : result.winner === 'draw' ? 'Draw' : 'Defeat'}
                </h2>
                <p>
                  {result.winner === 'a'
                    ? `${result.hp} HP remaining.`
                    : 'The rift claims another.'}
                </p>
                <button className="btn btn--primary" onClick={() => props.onDone(result)}>
                  <span>Continue</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Every op the deck (and its hero's Sigil) can run, Powers' triggers included. */
function deckOps(db: CombatDb, setup: CombatSetup): Op[] {
  const nested = (ops: readonly Op[]): Op[] =>
    ops.flatMap((o) => (o.op === 'power' ? [o, ...nested(o.ops)] : [o]));
  return [
    ...nested(db.heroes[setup.a.hero]?.sigil ?? []),
    ...setup.a.deck.flatMap((id) => nested(db.cards[id]?.effects ?? [])),
  ];
}

/** Decides which parts of the side panel show: a Riftwalker without runes never sees an empty rune row. */
function deckUsesStars(db: CombatDb, setup: CombatSetup): boolean {
  return (
    deckOps(db, setup).some((o) => o.op === 'stars') ||
    setup.a.deck.some((id) => (db.cards[id]?.starCost ?? 0) > 0)
  );
}
function deckUsesRunes(db: CombatDb, setup: CombatSetup): boolean {
  return deckOps(db, setup).some((o) => o.op === 'channel');
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
    const alive = [...r.state.sides.a.units, ...r.state.sides.b.units].some((u) => u.id === targetId);
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
): CardDef[] {
  if (!d) return [];
  const list =
    pile === 'draw' ? d.sides.a.draw : pile === 'discard' ? d.sides.a.discard : d.sides.a.exhausted;
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
      <div className="fight__modalBody" onPointerDown={(e) => e.stopPropagation()}>
        <header>
          <h3>
            {props.title} <small>({props.cards.length})</small>
          </h3>
          <button className="btn btn--small" onClick={props.onClose}>
            <span>Close</span>
          </button>
        </header>
        <div className="fight__grid">
          {props.cards.map((c, i) => (
            <FightCard key={`${c.id}-${i}`} db={props.db} def={c} width={150} />
          ))}
          {props.cards.length === 0 && <p>Empty.</p>}
        </div>
      </div>
    </div>
  );
}
