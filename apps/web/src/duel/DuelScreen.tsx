import { useCallback, useEffect, useRef, useState } from 'react';
import type { CardDef } from '@sr/engine';
import { CARD_DB } from '@sr/content';
import { BattlefieldScene, slotKey } from './scene/BattlefieldScene';
import { Hand, type HandCard, type Probe } from '../hand/Hand';
import { SPELL_CAST_LINE, dropKind, validSlotKeys } from '../hand/dropRules';
import { loadEffectsMode, profileFor, saveEffectsMode, type EffectsMode } from './effects';

// Phase 2 preview hands: a spread of rarities and card types, from the real card database.
const DEMO_HANDS = [
  ['AUR-01', 'NEX-06', 'AUR-09', 'NEU-10', 'UMB-13', 'AUR-12', 'WYL-05'],
  ['UMB-07', 'WYL-07', 'NEX-07', 'AUR-08', 'NEX-17', 'UMB-06', 'WYL-17'],
];
let uidCounter = 0;
function dealHand(n: number): HandCard[] {
  const ids = DEMO_HANDS[n % DEMO_HANDS.length] ?? [];
  const out: HandCard[] = [];
  for (const id of ids) {
    const def = CARD_DB[id];
    if (def) out.push({ uid: `h${++uidCounter}`, def });
  }
  return out;
}

/** Phase 2 preview: the battlefield plus a demo hand (fan, hover tilt, drag with a targeting arrow, rarity frames). */
export default function DuelScreen() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BattlefieldScene | null>(null);
  const [mode, setMode] = useState<EffectsMode>(loadEffectsMode);
  const modeAtMount = useRef(mode);
  const [lit, setLit] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showFps = window.location.search.includes('fps');
  const [fps, setFps] = useState('');
  const [hand, setHand] = useState<HandCard[]>(() => dealHand(0));
  const [mana, setMana] = useState(6);
  const dealNo = useRef(0);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let cancelled = false;
    let created: BattlefieldScene | null = null;
    BattlefieldScene.create(el, profileFor(modeAtMount.current))
      .then((s) => {
        if (cancelled) {
          s.destroy();
          return;
        }
        created = s;
        scene.current = s;
        setReady(true);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    return () => {
      cancelled = true;
      created?.destroy();
      scene.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    scene.current?.setProfile(profileFor(mode));
    saveEffectsMode(mode);
  }, [mode, ready]);

  // When the demo hand is emptied, deal another after a beat so it can be tried again.
  useEffect(() => {
    if (hand.length > 0) return;
    const t = window.setTimeout(() => setHand(dealHand(++dealNo.current)), 1200);
    return () => window.clearTimeout(t);
  }, [hand.length]);

  const probe = useCallback((def: CardDef, x: number, y: number): Probe => {
    const sc = scene.current;
    if (dropKind(def) === 'spell') return { valid: y < window.innerHeight * SPELL_CAST_LINE };
    const g = sc?.slotAtClient(x, y);
    if (!sc || !g) return { valid: false };
    const key = slotKey(g);
    if (!validSlotKeys(def).has(key)) return { valid: false };
    const snap = sc.slotClientCenter(key);
    return snap ? { valid: true, snap } : { valid: true };
  }, []);

  const onPlay = useCallback((card: HandCard) => {
    setMana((a) => Math.max(0, a - card.def.cost));
    setHand((h) => h.filter((c) => c.uid !== card.uid));
    setToast(`${card.def.name} played (preview: no rules yet)`);
    window.setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => {
    scene.current?.highlightSlots(lit ? 'all' : null);
  }, [lit, ready]);

  // add ?fps to the address (before the #) to see the frame rate and render resolution
  useEffect(() => {
    if (!showFps || !ready) return;
    const id = window.setInterval(() => {
      const st = scene.current?.getStats();
      if (st) setFps(`${st.fps.toFixed(0)} fps · render scale ${st.resolution.toFixed(2)}`);
    }, 500);
    return () => window.clearInterval(id);
  }, [showFps, ready]);

  return (
    <div className={`duel${mode === 'reduced' ? ' reduce-fx' : ''}`}>
      <div className="duel__stage" ref={host} />
      {!ready && !error && <div className="loading">Opening the rift…</div>}
      {error && (
        <div className="loading loading--error">The battlefield could not start: {error}</div>
      )}

      <header className="duel__top">
        <a className="btn btn--small" href="#/">
          <span>Back</span>
        </a>
        <p className="duel__label">Phase 2 · The hand and the cards</p>
      </header>

      {showFps && <p className="duel__fps">{fps}</p>}

      <Hand
        cards={hand}
        mana={mana}
        probe={probe}
        onDragStart={(def) =>
          scene.current?.setDragTargets(dropKind(def) === 'spell' ? new Set() : validSlotKeys(def))
        }
        onDragEnd={() => {
          scene.current?.setDragTargets(null);
          if (lit) scene.current?.highlightSlots('all');
        }}
        onPlay={onPlay}
      />

      <div className="mana" aria-label={`Mana ${mana}`}>
        <button
          className="mana__btn"
          onClick={() => setMana((a) => Math.max(0, a - 1))}
          aria-label="Less Mana"
        >
          −
        </button>
        <div className="mana__gem">
          <span>{mana}</span>
        </div>
        <button
          className="mana__btn"
          onClick={() => setMana((a) => Math.min(10, a + 1))}
          aria-label="More Mana"
        >
          +
        </button>
        <button
          className="btn btn--small mana__deal"
          onClick={() => setHand(dealHand(++dealNo.current))}
        >
          <span>Deal new hand</span>
        </button>
      </div>
      {toast && (
        <p className="duel__toast" role="status" aria-live="polite">
          {toast}
        </p>
      )}

      <aside className="duel__panel" aria-label="Display settings">
        <Toggle
          label="Reduced effects"
          hint="Fewer particles, no parallax, calmer pulses"
          on={mode === 'reduced'}
          onChange={(on) => setMode(on ? 'reduced' : 'full')}
        />
        <Toggle
          label="Show playable slots"
          hint="Preview the glow a card gives its valid slots"
          on={lit}
          onChange={setLit}
        />
      </aside>
    </div>
  );
}

function Toggle(props: {
  label: string;
  hint: string;
  on: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className="toggle">
      <input
        className="toggle__input"
        type="checkbox"
        checked={props.on}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
      <span className="toggle__text">
        <span className="toggle__label">{props.label}</span>
        <span className="toggle__hint">{props.hint}</span>
      </span>
    </label>
  );
}
