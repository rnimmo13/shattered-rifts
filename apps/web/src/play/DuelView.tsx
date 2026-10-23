// The real duel screen: the Pixi battlefield, the hand, the HUD and every prompt, driven by a DuelSession.
// The screen never decides a rule: it shows the redacted view, offers only the engine's legal actions, and
// replays the engine's events (see replay.ts). Choosing an action calls session.submit(); the AI then answers
// and each of its actions is animated before the next one begins.

import { gsap } from 'gsap';
import { getSound, play, setSound } from '../audio/sfx';
import { setBaseSpeed } from '../duel/scene/timescale';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Action, CardDef, GameView, InstanceId } from '@sr/engine';
import { CARD_DB, character, enemy } from '@sr/content';
import { BattlefieldScene, slotKey } from '../duel/scene/BattlefieldScene';
import { loadEffectsMode, profileFor, saveEffectsMode, type EffectsMode } from '../duel/effects';
import { Hand, type HandCard, type Probe } from '../hand/Hand';
import { TargetingArrow } from '../hand/TargetingArrow';
import { handCardWidth, handReserve } from '../hand/fanLayout';
import { SPELL_CAST_LINE, dropKind } from '../hand/dropRules';
import {
  attackTargets,
  canAttackWith,
  cardName,
  cardPlays,
  describeAction,
  echoPlays,
  chooseTargetsOf,
  describeMode,
  endTurnAction,
  fieldActions,
  groupByMode,
  singleTargetMap,
  targetsOfAction,
  type PlayLike,
  playableIds,
  windowOptions,
} from './actions';
import {
  ActionBar,
  Banner,
  DamageFlash,
  TurnPill,
  FoePanel,
  GameOver,
  LogPanel,
  SelfPanel,
  WindowPanel,
  type Float,
} from './Hud';
import { ChoiceList, HelpPrompt, MulliganPrompt, YesNoPrompt } from './Prompts';
import { Inspector, type InspectInfo } from './Inspector';
import { chooseBotAction } from './bot';
import { optionsFor, pendingTitle } from './promptHelpers';
import { reconcile, replayBatch, type HudBus } from './replay';
import { DuelSession, HUMAN, type DuelSetup } from './session';
import { fieldKeys, idAtKey } from './slots';

interface Chooser {
  title: string;
  options: { label: string; action: Action }[];
}

const SPEEDS = [1, 2, 4] as const;

export function DuelView(props: {
  setup: DuelSetup;
  onExit: () => void;
  onAgain: () => void;
  /** Campaign mode: the duel's result goes to the run instead of the practice screen. */
  campaign?: { onResult: (won: boolean) => void };
}) {
  const { setup } = props;
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BattlefieldScene | null>(null);
  const session = useRef<DuelSession | null>(null);
  const viewRef = useRef<GameView | null>(null);
  const busyRef = useRef(true);
  const speedRef = useRef<number>(1);
  const floatId = useRef(0);
  const bannerId = useRef(0);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setViewState] = useState<GameView | null>(null);
  const [legal, setLegal] = useState<Action[]>([]);
  const [busy, setBusyState] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [banner, setBanner] = useState<{
    text: string;
    tone: 'me' | 'opp' | 'neutral';
    id: number;
  } | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [chooser, setChooser] = useState<Chooser | null>(null);
  /** Click-a-target mode: a targeted spell/unit was played and now needs its target chosen on the board. */
  const [targeting, setTargeting] = useState<{
    title: string;
    actions: Map<InstanceId, Action>;
  } | null>(null);
  const [forceList, setForceList] = useState(false);
  const legalRef = useRef<Action[]>([]);
  /** scene slot key -> the action that picks that target (kept in a ref for the pointer handler) */
  const targetRef = useRef<Map<string, Action> | null>(null);
  const [mode, setMode] = useState<EffectsMode>(loadEffectsMode);
  const modeAtMount = useRef(mode);
  const [speed, setSpeed] = useState<number>(1);
  const [showLog, setShowLog] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sound, setSoundState] = useState(getSound);
  const [flash, setFlash] = useState<{ id: number; kind: 'hurt' | 'strike' }>({
    id: 0,
    kind: 'hurt',
  });
  const [hoverHand, setHoverHand] = useState<HandCard | null>(null);
  const [hoverBoard, setHoverBoard] = useState<InspectInfo | null>(null);
  const hoverId = useRef<string | null>(null);
  /** ?bot in the address plays the human's side with a simple script, to watch a whole duel run. */
  const [botOn] = useState(() => window.location.search.includes('bot'));

  const selectedRef = useRef<string | null>(null);
  const clearSelection = useCallback(() => {
    scene.current?.monsters.select(null);
    scene.current?.traps.select(null);
    selectedRef.current = null;
    setSelected(null);
  }, []);
  const setView = useCallback(
    (v: GameView) => {
      viewRef.current = v;
      setViewState(v);
      // a selection that no longer points at a card (it died, the turn changed) is dropped
      if (selectedRef.current && idAtKey(v, selectedRef.current) === null) clearSelection();
    },
    [clearSelection],
  );
  const setBusy = useCallback((b: boolean) => {
    busyRef.current = b;
    setBusyState(b);
  }, []);

  useEffect(() => {
    speedRef.current = speed;
    setBaseSpeed(speed);
  }, [speed]);

  // ---- boot: the scene, then the session --------------------------------------------------------
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let created: BattlefieldScene | null = null;
    let sess: DuelSession | null = null;

    const bus: HudBus = {
      banner: (text, tone) =>
        new Promise<void>((resolve) => {
          setBanner({ text, tone, id: ++bannerId.current });
          play('turn');
          window.setTimeout(() => {
            setBanner(null);
            resolve();
          }, 900 / speedRef.current);
        }),
      playerHit: (player, amount, kind) => {
        const f: Float = { id: ++floatId.current, player, text: String(amount), kind };
        setFloats((cur) => [...cur, f]);
        window.setTimeout(() => setFloats((cur) => cur.filter((x) => x.id !== f.id)), 1400);
        if (kind === 'damage') {
          // taking a hit shakes the board and washes the screen red; dealing one is a gold flash
          scene.current?.impact(amount * 1.3);
          setFlash({ id: ++floatId.current, kind: player === HUMAN ? 'hurt' : 'strike' });
          play('hit');
        }
      },
      log: (line) => setLog((cur) => [...cur.slice(-80), line]),
    };

    BattlefieldScene.create(el, profileFor(modeAtMount.current))
      .then(async (s) => {
        if (cancelled) {
          s.destroy();
          return;
        }
        created = s;
        scene.current = s;
        s.setBottomReserve(handReserve(handCardWidth(window.innerWidth)));
        s.onSound = play;
        const env = {
          scene: s,
          hud: bus,
          speed: () => speedRef.current,
          cancelled: () => cancelled,
        };
        sess = new DuelSession(setup, {
          onBatch: async (b) => {
            // your own action updates the hand and Mana at once; the enemy's land after their animation
            if (b.actor === HUMAN) setView(b.after);
            // Animation is only a replay of an already-resolved game: if it throws or hangs, force the board
            // to match the real state and carry on. It must never end or freeze the duel.
            try {
              await Promise.race([
                replayBatch(b, env),
                new Promise<never>((_, reject) =>
                  window.setTimeout(() => reject(new Error('animation timed out')), 25_000),
                ),
              ]);
            } catch (e) {
              console.warn('[duel] replay failed; resyncing the board', e);
              try {
                await reconcile(s, b.after, env);
              } catch (e2) {
                console.warn('[duel] resync failed', e2);
              }
            }
            if (!cancelled) setView(b.after);
          },
          onIdle: () => {
            if (cancelled || !sess) return;
            setView(sess.view());
            setLegal(sess.legal());
            setBusy(false);
          },
          onError: (e) => {
            if (!cancelled) setError(e instanceof Error ? e.message : String(e));
          },
        });
        session.current = sess;
        setView(sess.view());
        setReady(true);
        await sess.start();
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
      sess?.stop();
      created?.destroy();
      scene.current = null;
      session.current = null;
    };
    // the setup is fixed for the lifetime of this screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scene.current?.setProfile(profileFor(mode));
    saveEffectsMode(mode);
  }, [mode, ready]);

  useEffect(() => {
    if (!ready) return;
    const apply = () =>
      scene.current?.setBottomReserve(handReserve(handCardWidth(window.innerWidth)));
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [ready]);

  // ---- derived, from the engine's view and legal actions -----------------------------------------
  const me = view?.players[HUMAN];
  const handCards: HandCard[] = useMemo(() => {
    const hand = view?.players[HUMAN].hand;
    if (!view || !hand) return [];
    const out: HandCard[] = [];
    for (const id of hand) {
      const def = CARD_DB[view.cards[id]?.cardId ?? ''];
      if (def) out.push({ uid: id, def });
    }
    return out;
  }, [view]);
  const playable = useMemo(() => playableIds(legal), [legal]);
  const inputOpen = !busy && legal.length > 0;

  const selectedId = view && selected ? idAtKey(view, selected) : null;
  const targets = useMemo(
    () => (selectedId ? attackTargets(legal, selectedId) : []),
    [legal, selectedId],
  );
  const targetKeys = useMemo(() => {
    if (!view) return new Set<string>();
    const m = fieldKeys(view);
    const out = new Set<string>();
    for (const t of targets) {
      if (t === 'face') continue;
      const k = m.get(t);
      if (k) out.add(k);
    }
    return out;
  }, [view, targets]);
  const faceTargetable = targets.includes('face');

  useEffect(() => {
    legalRef.current = legal;
  }, [legal]);

  // ---- acting --------------------------------------------------------------------------------------
  const submit = useCallback(
    async (a: Action) => {
      const s = session.current;
      if (!s || busyRef.current) return;
      setBusy(true);
      setLegal([]);
      setChooser(null);
      setTargeting(null);
      setForceList(false);
      clearSelection();
      scene.current?.setDragTargets(null);
      await s.submit(a);
    },
    [clearSelection, setBusy],
  );

  /**
   * Play a card that has several variants. Pick the mode first if there is more than one (Overclock, set face-down...),
   * then the target: dropped straight onto a target it just goes; otherwise click a glowing target on the board.
   * Targets that are not on the board fall back to a list.
   */
  const resolveActions = useCallback(
    function resolve(
      name: string,
      variants: Action[],
      drop: { x: number; y: number } | null,
    ): void {
      const v = viewRef.current;
      const sc = scene.current;
      if (!v || !sc) return;
      if (variants.length === 1) {
        void submit(variants[0] as Action);
        return;
      }
      const groups = groupByMode(variants);
      if (groups.length > 1) {
        setChooser({
          title: name,
          options: groups.map((g) => ({
            label: describeMode(g[0] as Action, v),
            action: g[0] as Action,
            run: () => resolve(name, g, null),
          })),
        });
        return;
      }
      const map = singleTargetMap(variants, targetsOfAction);
      const keys = fieldKeys(v);
      if (map && [...map.keys()].every((id) => keys.has(id))) {
        if (drop) {
          const g = sc.slotAtClient(drop.x, drop.y);
          const key = g ? slotKey(g) : null;
          const id = key ? idAtKey(v, key) : null;
          const hit = id ? map.get(id) : undefined;
          if (hit) {
            void submit(hit);
            return;
          }
        }
        setChooser(null);
        setTargeting({ title: name, actions: map });
        return;
      }
      setChooser({
        title: name,
        options: variants.map((a) => ({ label: describeAction(a, v), action: a })),
      });
    },
    [submit],
  );

  const onPlayCard = useCallback(
    (card: HandCard, x: number, y: number) => {
      const plays = cardPlays(legalRef.current, card.uid);
      if (plays.length > 0)
        resolveActions(
          `Play ${card.def.name}`,
          plays,
          dropKind(card.def) === 'spell' ? { x, y } : null,
        );
    },
    [resolveActions],
  );

  /** For a card whose plays differ only by a single target: target id -> the play that picks it. */
  const cardTargetMap = useCallback((card: HandCard): Map<InstanceId, PlayLike> | null => {
    const plays = cardPlays(legalRef.current, card.uid);
    if (plays.length < 2 || groupByMode(plays).length !== 1) return null;
    return singleTargetMap(plays, targetsOfAction);
  }, []);

  /**
   * Your slots of a kind. A drop may land on any of them: the engine decides the real slot (and whether the play is
   * legal at all, e.g. an Ascend with a full row), so the screen does not second-guess occupancy.
   */
  const freeKeys = useCallback((kind: 'unit' | 'trap'): Set<string> => {
    const out = new Set<string>();
    const n = kind === 'unit' ? 5 : 4;
    for (let i = 0; i < n; i++) out.add(`me-${kind}-${i}`);
    return out;
  }, []);

  const probe = useCallback(
    (def: CardDef, x: number, y: number, card: HandCard): Probe => {
      const sc = scene.current;
      const v = viewRef.current;
      if (!sc || !v) return { valid: false };
      const kind = dropKind(def);
      if (kind === 'spell') {
        // a targeted spell dropped right on a valid target casts at once
        const map = cardTargetMap(card);
        const g = map ? sc.slotAtClient(x, y) : null;
        const id = g ? idAtKey(v, slotKey(g)) : null;
        if (g && id && map?.has(id)) {
          const snap = sc.slotClientCenter(slotKey(g));
          return snap ? { valid: true, snap } : { valid: true };
        }
        return { valid: y < window.innerHeight * SPELL_CAST_LINE };
      }
      const g = sc.slotAtClient(x, y);
      if (!g) return { valid: false };
      const key = slotKey(g);
      if (!freeKeys(kind === 'unit' ? 'unit' : 'trap').has(key)) return { valid: false };
      const snap = sc.slotClientCenter(key);
      return snap ? { valid: true, snap } : { valid: true };
    },
    [freeKeys, cardTargetMap],
  );

  // click on the board: select your card, or pick an attack target for the selected one
  const onStageDown = useCallback(
    (e: React.PointerEvent) => {
      const sc = scene.current;
      const v = viewRef.current;
      if (e.button !== 0) return;
      if (!sc || !v || busyRef.current) return;
      const g = sc.slotAtClient(e.clientX, e.clientY);
      const key = g ? slotKey(g) : null;
      const tm = targetRef.current;
      if (tm) {
        // choosing a target: only a glowing target does anything
        const act = key ? tm.get(key) : undefined;
        if (act) {
          setTargeting(null);
          void submit(act);
        }
        return;
      }
      if (selectedId && key && targetKeys.has(key)) {
        const target = idAtKey(v, key);
        if (target) {
          void submit({ type: 'attack', player: HUMAN, attacker: selectedId, target });
          return;
        }
      }
      const id = key ? idAtKey(v, key) : null;
      if (key && id && key.startsWith('me-')) {
        sc.monsters.select(null);
        sc.traps.select(null);
        if (sc.monsters.has(key)) sc.monsters.select(key);
        else sc.traps.select(key);
        selectedRef.current = key;
        setSelected(key);
        return;
      }
      clearSelection();
    },
    [selectedId, targetKeys, submit, clearSelection],
  );

  /** Hovering a card on the board shows it in the reader (enemy face-down cards stay hidden). */
  const onStageMove = useCallback((e: React.PointerEvent) => {
    const sc = scene.current;
    const v = viewRef.current;
    if (!sc || !v) return;
    const g = sc.slotAtClient(e.clientX, e.clientY);
    const key = g ? slotKey(g) : null;
    const id = key ? idAtKey(v, key) : null;
    if (id === hoverId.current) return;
    hoverId.current = id;
    const c = id ? v.cards[id] : undefined;
    const def = c && c.cardId !== '?' ? CARD_DB[c.cardId] : undefined;
    if (!id || !def || !key) {
      setHoverBoard(null);
      return;
    }
    const st = v.stats[id];
    setHoverBoard({
      def,
      stats: st ? { power: st.power, guard: st.guard, maxGuard: st.maxGuard } : undefined,
      where: key.startsWith('me-') ? 'yours' : "enemy's",
    });
  }, []);

  const attackFace = useCallback(() => {
    if (selectedId && faceTargetable) {
      void submit({ type: 'attack', player: HUMAN, attacker: selectedId, target: 'face' });
    }
  }, [selectedId, faceTargetable, submit]);

  // ---- what the panels show ------------------------------------------------------------------------
  const pending = view?.pending && view.pending.player === HUMAN ? view.pending : null;
  const winAll = useMemo(
    () => (view && view.window?.priority === HUMAN && !pending ? windowOptions(legal) : []),
    [view, pending, legal],
  );
  // Spells in your hand are cast by dragging them (onto their target, if they have one); the panel lists the rest.
  const winButtons = useMemo(() => {
    if (!view) return [];
    const fast = winAll.filter((a) => a.type !== 'play');
    const groups = new Map<string, Action[]>();
    for (const a of fast) {
      const src =
        a.type === 'activateTrap' || a.type === 'activate'
          ? a.card
          : a.type === 'flip'
            ? a.unit
            : '';
      const k = `${a.type}:${src}:${a.type === 'activate' ? a.ability : ''}`;
      groups.set(k, [...(groups.get(k) ?? []), a]);
    }
    return [...groups.values()].map((g) => {
      const first = g[0] as Action;
      const label = describeMode(first, view);
      return { label, run: () => resolveActions(label, g, null) };
    });
  }, [view, winAll, resolveActions]);
  const showWindow = inputOpen && !pending && view?.window?.priority === HUMAN;

  // A pending "choose targets" prompt with simple board targets is answered by clicking the board, not a list.
  const pendingMap = useMemo(() => {
    if (forceList || !view || !pending || pending.kind !== 'chooseTargets') return null;
    const acts = legal.filter(
      (a): a is Extract<Action, { type: 'chooseTargets' }> => a.type === 'chooseTargets',
    );
    const m = singleTargetMap(acts, chooseTargetsOf);
    if (!m) return null;
    const keys = fieldKeys(view);
    for (const id of m.keys()) if (!keys.has(id)) return null;
    return m;
  }, [view, pending, legal, forceList]);
  const targetActions = targeting?.actions ?? pendingMap;
  const targetTitle = targeting
    ? `Choose a target for ${targeting.title.replace(/^(Play|Spring|Use|Flip) /, '')}`
    : view && pendingMap
      ? pendingTitle(view)
      : '';
  const targetByKey = useMemo(() => {
    if (!view || !targetActions) return null;
    const keys = fieldKeys(view);
    const out = new Map<string, Action>();
    for (const [id, act] of targetActions) {
      const k = keys.get(id);
      if (k) out.set(k, act);
    }
    return out;
  }, [view, targetActions]);
  const targetKeySet = useMemo(
    () => (targetByKey ? new Set(targetByKey.keys()) : null),
    [targetByKey],
  );
  useEffect(() => {
    targetRef.current = targetByKey;
  }, [targetByKey]);

  // the scene lights what can be attacked, or what can be targeted right now
  useEffect(() => {
    const sc = scene.current;
    if (!sc) return;
    const keys = targetKeySet ?? (targetKeys.size > 0 ? targetKeys : null);
    sc.highlightSlots(keys);
  }, [targetKeySet, targetKeys, ready]);

  // units that can act now get a glowing indicator
  const readyKeys = useMemo(() => {
    const out = new Set<string>();
    if (!view || !inputOpen || pending || targetActions) return out;
    view.players[HUMAN].units.forEach((id, i) => {
      if (id && (canAttackWith(legal, id) || fieldActions(legal, id).length > 0))
        out.add(`me-unit-${i}`);
    });
    return out;
  }, [view, legal, inputOpen, pending, targetActions]);
  useEffect(() => {
    scene.current?.monsters.setReady(readyKeys);
  }, [readyKeys, ready]);

  // Escape or a right-click backs out of choosing a target for a card you were playing
  useEffect(() => {
    if (!targeting) return;
    const on = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTargeting(null);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [targeting]);
  const end = endTurnAction(legal);
  const sel = selectedId ? fieldActions(legal, selectedId) : [];
  const echoes = echoPlays(legal);
  const barActions: Action[] = [...sel, ...(selectedId ? [] : echoes)];
  const attackHint =
    selectedId && canAttackWith(legal, selectedId)
      ? 'Click a glowing enemy, or the enemy portrait, to attack.'
      : undefined;
  const myName = character(setup.character).name;

  const idle = inputOpen && !pending && playable.size === 0 && !targets.length;
  const doEndTurn = useCallback(() => {
    if (end) void submit(end);
  }, [end, submit]);

  // E ends the turn when nothing else is open
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.key === 'e' || e.key === 'E') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t && /input|select|textarea/i.test(t.tagName)) return;
        if (inputOpen && end && !pending && !chooser && !showHelp && !showWindow && !targetActions)
          doEndTurn();
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  });

  // ?bot: play the human's side with the scripted bot (for watching a duel run end to end)
  useEffect(() => {
    if (!botOn) return;
    // watching a bot duel in a tab that is not drawing frames: also advance animations from a timer
    const id = window.setInterval(() => {
      gsap.globalTimeline.time(gsap.globalTimeline.time() + 0.033);
    }, 33);
    return () => window.clearInterval(id);
  }, [botOn]);

  useEffect(() => {
    if (!botOn || !inputOpen || !view) return;
    const t = window.setTimeout(() => {
      const a = chooseBotAction(legal, view);
      void submit(a);
    }, 250);
    return () => window.clearTimeout(t);
  }, [botOn, inputOpen, legal, view, submit]);

  const stuck = ready && !busy && !!view && view.winner === null && legal.length === 0 && !error;
  const concede = () =>
    setChooser({
      title: 'Concede this duel?',
      options: [{ label: 'Concede', action: { type: 'concede', player: HUMAN } }],
    });

  return (
    <div className={`duel play${mode === 'reduced' ? ' reduce-fx' : ''}`}>
      <div
        className="duel__stage"
        ref={host}
        onPointerDown={onStageDown}
        onPointerMove={onStageMove}
        onContextMenu={(e) => {
          if (targeting) {
            e.preventDefault();
            setTargeting(null);
          }
        }}
      />
      {!ready && !error && <div className="loading">Opening the rift…</div>}
      {error && (
        <div className="loading loading--error">
          The duel hit a problem: {error}
          {props.campaign && (
            <button className="btn" onClick={props.onExit}>
              <span>Forfeit duel</span>
            </button>
          )}
        </div>
      )}

      {view && ready && (
        <>
          <header className="duel__top">
            {!props.campaign && (
              <button className="btn btn--small" onClick={props.onExit}>
                <span>Leave</span>
              </button>
            )}
            {props.campaign && view.winner === null && (
              <button className="btn btn--small btn--ghost" onClick={props.onExit}>
                <span>Forfeit duel</span>
              </button>
            )}
            <TurnPill
              turn={view.turn}
              mine={view.active === HUMAN}
              thinking={busy && view.winner === null}
              over={view.winner !== null}
            />
          </header>

          <FoePanel
            view={view}
            name={enemy(setup.enemyId).name}
            realm={enemy(setup.enemyId).realm}
            targetable={inputOpen && faceTargetable}
            floats={floats}
            onFace={attackFace}
          />
          <SelfPanel
            view={view}
            name={myName}
            realm={character(setup.character).realm}
            floats={floats}
          />
          {mode !== 'reduced' && <DamageFlash id={flash.id} kind={flash.kind} />}

          {showLog && <LogPanel lines={log} />}

          <Hand
            onSound={play}
            cards={handCards}
            mana={(me?.mana ?? 0) + (me?.tempMana ?? 0)}
            locked={!inputOpen || !!targetActions}
            onHover={setHoverHand}
            canPlay={(c) => playable.has(c.uid)}
            probe={probe}
            onDragStart={(def, card) => {
              const kind = dropKind(def);
              const v = viewRef.current;
              const spellTargets = new Set<string>();
              if (kind === 'spell' && v) {
                const map = cardTargetMap(card);
                const keys = fieldKeys(v);
                for (const id of map?.keys() ?? []) {
                  const k = keys.get(id);
                  if (k) spellTargets.add(k);
                }
              }
              scene.current?.setDragTargets(
                kind === 'spell' ? spellTargets : freeKeys(kind === 'unit' ? 'unit' : 'trap'),
              );
            }}
            onDragEnd={() => {
              scene.current?.setDragTargets(null);
              if (targetKeys.size > 0) scene.current?.highlightSlots(targetKeys);
            }}
            onPlay={onPlayCard}
          />

          {inputOpen && targetKeySet && (
            <>
              <AttackArrow
                scene={scene}
                from={null}
                fromPoint={{ x: window.innerWidth / 2, y: window.innerHeight - 150 }}
                valid={targetKeySet}
              />
              <div className="targetbar" role="status">
                <b>{targetTitle}</b>
                <span>Click a glowing target.</span>
                {targeting ? (
                  <button className="btn btn--small btn--ghost" onClick={() => setTargeting(null)}>
                    <span>Cancel</span>
                  </button>
                ) : (
                  <button className="btn btn--small btn--ghost" onClick={() => setForceList(true)}>
                    <span>Choose from a list</span>
                  </button>
                )}
              </div>
            </>
          )}
          {inputOpen &&
            !targetKeySet &&
            selectedId &&
            targetKeys.size + (faceTargetable ? 1 : 0) > 0 && (
              <AttackArrow scene={scene} from={selected} valid={targetKeys} />
            )}

          {inputOpen && (barActions.length > 0 || attackHint) && (
            <ActionBar
              view={view}
              title={selectedId ? cardName(view, selectedId) : 'Echo'}
              {...(attackHint ? { hint: attackHint } : {})}
              actions={barActions}
              onPick={(a) => void submit(a)}
            />
          )}

          {showWindow && (
            <WindowPanel
              view={view}
              options={winButtons}
              dragHint={winAll.some((a) => a.type === 'play')}
              onPass={() => {
                const pass = legal.find((a) => a.type === 'pass');
                if (pass) void submit(pass);
              }}
            />
          )}

          {banner && <Banner {...banner} speed={speed} />}
          <Inspector
            info={
              hoverHand && handCards.some((c) => c.uid === hoverHand.uid)
                ? { def: hoverHand.def, where: 'in your hand' }
                : hoverBoard
            }
          />
          {showHelp && <HelpPrompt onClose={() => setShowHelp(false)} />}
          {stuck && (
            <div className="modal" role="alertdialog" aria-label="The duel stopped">
              <div className="modal__panel">
                <h2 className="modal__title">The duel stopped responding</h2>
                <p className="modal__hint">
                  Nothing is waiting for you, but the game is not over. This is a bug. You can leave
                  and start again.
                </p>
                <div className="modal__row">
                  <button className="btn" onClick={props.onAgain}>
                    <span>Start a new duel</span>
                  </button>
                  <button className="btn btn--ghost" onClick={props.onExit}>
                    <span>Leave</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="corner">
            {showSettings && (
              <div className="corner__settings" role="group" aria-label="Display settings">
                <label className="toggle">
                  <input
                    className="toggle__input"
                    type="checkbox"
                    checked={mode === 'reduced'}
                    onChange={(e) => setMode(e.target.checked ? 'reduced' : 'full')}
                  />
                  <span className="toggle__track" aria-hidden>
                    <span className="toggle__thumb" />
                  </span>
                  <span className="toggle__text">
                    <span className="toggle__label">Reduced effects</span>
                  </span>
                </label>
                <label className="toggle">
                  <input
                    className="toggle__input"
                    type="checkbox"
                    checked={showLog}
                    onChange={(e) => setShowLog(e.target.checked)}
                  />
                  <span className="toggle__track" aria-hidden>
                    <span className="toggle__thumb" />
                  </span>
                  <span className="toggle__text">
                    <span className="toggle__label">Duel log</span>
                  </span>
                </label>
                <label className="toggle">
                  <input
                    className="toggle__input"
                    type="checkbox"
                    checked={sound.on}
                    onChange={(e) => {
                      setSound({ on: e.target.checked });
                      setSoundState(getSound());
                      if (e.target.checked) play('click');
                    }}
                  />
                  <span className="toggle__track" aria-hidden>
                    <span className="toggle__thumb" />
                  </span>
                  <span className="toggle__text">
                    <span className="toggle__label">Sound</span>
                  </span>
                </label>
                <label className="play__volume">
                  <span className="toggle__label">Volume</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={sound.volume}
                    disabled={!sound.on}
                    onChange={(e) => {
                      setSound({ volume: Number(e.target.value) });
                      setSoundState(getSound());
                    }}
                    onPointerUp={() => play('hit')}
                    aria-label="Volume"
                  />
                </label>
                <div className="play__speed" role="group" aria-label="Animation speed">
                  <span className="toggle__label">Speed</span>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      className={`btn btn--small${speed === s ? ' is-on' : ''}`}
                      onClick={() => setSpeed(s)}
                    >
                      <span>{s}×</span>
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn--small btn--ghost"
                  disabled={!inputOpen}
                  onClick={concede}
                >
                  <span>Concede</span>
                </button>
              </div>
            )}
            <div className="corner__row">
              <button
                className="btn btn--small"
                onClick={() => setShowSettings((s) => !s)}
                aria-expanded={showSettings}
              >
                <span>Settings</span>
              </button>
              <button className="btn btn--small" onClick={() => setShowHelp(true)}>
                <span>How to play</span>
              </button>
            </div>
            {view.winner === null && (
              <div className={`turnbox${view.active === HUMAN ? '' : ' turnbox--foe'}`}>
                {inputOpen && end && !pending && !targetActions ? (
                  <button
                    className={`btn btn--primary endturn${idle ? ' is-pulsing' : ''}`}
                    onClick={doEndTurn}
                    aria-keyshortcuts="E"
                  >
                    <span>End turn</span>
                    <kbd>E</kbd>
                  </button>
                ) : (
                  <p className="turnbox__wait">
                    {view.active === HUMAN && inputOpen
                      ? 'Your move'
                      : busy
                        ? "Enemy's turn…"
                        : '…'}
                  </p>
                )}
                {idle && <p className="turnbox__hint">Nothing left to play. End your turn.</p>}
              </div>
            )}
          </div>

          {inputOpen && pending?.kind === 'mulligan' && (
            <MulliganPrompt view={view} legal={legal} onSubmit={(a) => void submit(a)} />
          )}
          {inputOpen && pending?.kind === 'chooseOptional' && (
            <YesNoPrompt
              title={pendingTitle(view)}
              yes={legal.find((a) => a.type === 'chooseOptional' && a.accept) as Action}
              no={legal.find((a) => a.type === 'chooseOptional' && !a.accept) as Action}
              onSubmit={(a) => void submit(a)}
            />
          )}
          {inputOpen &&
            pending &&
            pending.kind !== 'mulligan' &&
            pending.kind !== 'chooseOptional' &&
            !pendingMap && (
              <ChoiceList
                title={pendingTitle(view)}
                options={optionsFor(legal, view)}
                onPick={(a) => void submit(a)}
              />
            )}
          {inputOpen && !pending && chooser && (
            <ChoiceList
              title={chooser.title}
              options={chooser.options}
              onPick={(a) => void submit(a)}
              onCancel={() => setChooser(null)}
            />
          )}

          {!busy && view.winner !== null && (
            <GameOver
              winner={view.winner}
              onAgain={props.onAgain}
              onExit={props.onExit}
              {...(props.campaign
                ? { onContinue: () => props.campaign?.onResult(view.winner === HUMAN) }
                : {})}
            />
          )}
        </>
      )}
    </div>
  );
}

/** The curved arrow from the selected unit to the pointer while choosing what to attack. */
function AttackArrow(props: {
  scene: React.RefObject<BattlefieldScene | null>;
  from?: string | null;
  fromPoint?: { x: number; y: number };
  valid: ReadonlySet<string>;
}) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => setP({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', on);
    return () => window.removeEventListener('pointermove', on);
  }, []);
  const sc = props.scene.current;
  if (!sc || !p) return null;
  const origin = props.fromPoint ?? (props.from ? sc.slotClientCenter(props.from) : null);
  if (!origin) return null;
  const g = sc.slotAtClient(p.x, p.y);
  const key = g ? slotKey(g) : null;
  const over = key !== null && props.valid.has(key);
  const to = over && key ? (sc.slotClientCenter(key) ?? p) : p;
  return (
    <TargetingArrow
      from={{ x: origin.x, y: origin.y - 40 }}
      to={to}
      state={over ? 'valid' : 'neutral'}
    />
  );
}
