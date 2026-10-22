// The real duel screen: the Pixi battlefield, the hand, the HUD and every prompt, driven by a DuelSession.
// The screen never decides a rule: it shows the redacted view, offers only the engine's legal actions, and
// replays the engine's events (see replay.ts). Choosing an action calls session.submit(); the AI then answers
// and each of its actions is animated before the next one begins.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Action, CardDef, GameView } from '@sr/engine';
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
  endTurnAction,
  fieldActions,
  playableIds,
  windowOptions,
} from './actions';
import {
  ActionBar,
  Banner,
  FoePanel,
  GameOver,
  LogPanel,
  SelfPanel,
  WindowPanel,
  type Float,
} from './Hud';
import { ChoiceList, MulliganPrompt, YesNoPrompt } from './Prompts';
import { optionsFor, pendingTitle } from './promptHelpers';
import { reconcile, replayBatch, type HudBus } from './replay';
import { DuelSession, HUMAN, type DuelSetup } from './session';
import { fieldKeys, idAtKey } from './slots';

interface Chooser {
  title: string;
  options: { label: string; action: Action }[];
}

const SPEEDS = [1, 2, 4] as const;

export function DuelView(props: { setup: DuelSetup; onExit: () => void; onAgain: () => void }) {
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
  const [mode, setMode] = useState<EffectsMode>(loadEffectsMode);
  const modeAtMount = useRef(mode);
  const [speed, setSpeed] = useState<number>(1);
  const [showLog, setShowLog] = useState(true);

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
          window.setTimeout(() => {
            setBanner(null);
            resolve();
          }, 900 / speedRef.current);
        }),
      playerHit: (player, amount, kind) => {
        const f: Float = { id: ++floatId.current, player, text: String(amount), kind };
        setFloats((cur) => [...cur, f]);
        window.setTimeout(() => setFloats((cur) => cur.filter((x) => x.id !== f.id)), 1400);
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

  // the scene shows what can be attacked / what the selected card is
  useEffect(() => {
    const sc = scene.current;
    if (!sc) return;
    sc.highlightSlots(targetKeys.size > 0 ? targetKeys : null);
  }, [targetKeys, ready]);

  // ---- acting --------------------------------------------------------------------------------------
  const submit = useCallback(
    async (a: Action) => {
      const s = session.current;
      if (!s || busyRef.current) return;
      setBusy(true);
      setLegal([]);
      setChooser(null);
      clearSelection();
      scene.current?.setDragTargets(null);
      await s.submit(a);
    },
    [clearSelection, setBusy],
  );

  const onPlayCard = useCallback(
    (card: HandCard) => {
      const v = viewRef.current;
      const sc = session.current;
      if (!v || !sc) return;
      const plays = cardPlays(sc.legal(), card.uid);
      if (plays.length === 0) return;
      if (plays.length === 1) {
        void submit(plays[0] as Action);
        return;
      }
      setChooser({
        title: `Play ${card.def.name}`,
        options: plays.map((a) => ({ label: describeAction(a, v), action: a })),
      });
    },
    [submit],
  );

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
    (def: CardDef, x: number, y: number): Probe => {
      const sc = scene.current;
      if (!sc) return { valid: false };
      const kind = dropKind(def);
      if (kind === 'spell') return { valid: y < window.innerHeight * SPELL_CAST_LINE };
      const g = sc.slotAtClient(x, y);
      if (!g) return { valid: false };
      const key = slotKey(g);
      if (!freeKeys(kind === 'unit' ? 'unit' : 'trap').has(key)) return { valid: false };
      const snap = sc.slotClientCenter(key);
      return snap ? { valid: true, snap } : { valid: true };
    },
    [freeKeys],
  );

  // click on the board: select your card, or pick an attack target for the selected one
  const onStageDown = useCallback(
    (e: React.PointerEvent) => {
      const sc = scene.current;
      const v = viewRef.current;
      if (!sc || !v || busyRef.current) return;
      const g = sc.slotAtClient(e.clientX, e.clientY);
      const key = g ? slotKey(g) : null;
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

  const attackFace = useCallback(() => {
    if (selectedId && faceTargetable) {
      void submit({ type: 'attack', player: HUMAN, attacker: selectedId, target: 'face' });
    }
  }, [selectedId, faceTargetable, submit]);

  // ---- what the panels show ------------------------------------------------------------------------
  const pending = view?.pending && view.pending.player === HUMAN ? view.pending : null;
  const winOpts = view && view.window?.priority === HUMAN && !pending ? windowOptions(legal) : [];
  const showWindow = inputOpen && winOpts.length > 0;
  const end = endTurnAction(legal);
  const sel = selectedId ? fieldActions(legal, selectedId) : [];
  const echoes = echoPlays(legal);
  const barActions: Action[] = [...sel, ...(selectedId ? [] : echoes)];
  const attackHint =
    selectedId && canAttackWith(legal, selectedId)
      ? 'Click a glowing enemy, or the enemy portrait, to attack.'
      : undefined;
  const myName = character(setup.character).name;

  const concede = () =>
    setChooser({
      title: 'Concede this duel?',
      options: [{ label: 'Concede', action: { type: 'concede', player: HUMAN } }],
    });

  return (
    <div className={`duel play${mode === 'reduced' ? ' reduce-fx' : ''}`}>
      <div className="duel__stage" ref={host} onPointerDown={onStageDown} />
      {!ready && !error && <div className="loading">Opening the rift…</div>}
      {error && <div className="loading loading--error">The duel hit a problem: {error}</div>}

      {view && ready && (
        <>
          <header className="duel__top">
            <button className="btn btn--small" onClick={props.onExit}>
              <span>Leave</span>
            </button>
            <p className="duel__label">
              {view.active === HUMAN ? 'Your turn' : "Enemy's turn"} · Turn {view.turn}
              {busy && view.winner === null ? ' · …' : ''}
            </p>
          </header>

          <FoePanel
            view={view}
            name={enemy(setup.enemyId).name}
            targetable={inputOpen && faceTargetable}
            floats={floats}
            onFace={attackFace}
          />
          <SelfPanel view={view} name={myName} floats={floats} />

          {showLog && <LogPanel lines={log} />}

          <Hand
            cards={handCards}
            mana={(me?.mana ?? 0) + (me?.tempMana ?? 0)}
            locked={!inputOpen}
            canPlay={(c) => playable.has(c.uid)}
            probe={probe}
            onDragStart={(def) => {
              const kind = dropKind(def);
              scene.current?.setDragTargets(
                kind === 'spell' ? new Set() : freeKeys(kind === 'unit' ? 'unit' : 'trap'),
              );
            }}
            onDragEnd={() => {
              scene.current?.setDragTargets(null);
              if (targetKeys.size > 0) scene.current?.highlightSlots(targetKeys);
            }}
            onPlay={onPlayCard}
          />

          {inputOpen && selectedId && targetKeys.size + (faceTargetable ? 1 : 0) > 0 && (
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

          {inputOpen && end && !pending && (
            <button className="btn btn--primary endturn" onClick={() => void submit(end)}>
              <span>End turn</span>
            </button>
          )}

          {showWindow && (
            <WindowPanel
              view={view}
              options={winOpts}
              onPick={(a) => void submit(a)}
              onPass={() => {
                const pass = legal.find((a) => a.type === 'pass');
                if (pass) void submit(pass);
              }}
            />
          )}

          {banner && <Banner {...banner} />}

          <aside className="duel__panel play__panel" aria-label="Display settings">
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
            <button className="btn btn--small btn--ghost" disabled={!inputOpen} onClick={concede}>
              <span>Concede</span>
            </button>
          </aside>

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
            pending.kind !== 'chooseOptional' && (
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
            <GameOver winner={view.winner} onAgain={props.onAgain} onExit={props.onExit} />
          )}
        </>
      )}
    </div>
  );
}

/** The curved arrow from the selected unit to the pointer while choosing what to attack. */
function AttackArrow(props: {
  scene: React.RefObject<BattlefieldScene | null>;
  from: string | null;
  valid: ReadonlySet<string>;
}) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => setP({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', on);
    return () => window.removeEventListener('pointermove', on);
  }, []);
  const sc = props.scene.current;
  if (!sc || !props.from || !p) return null;
  const origin = sc.slotClientCenter(props.from);
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
