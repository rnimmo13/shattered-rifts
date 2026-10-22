import { useEffect, useRef, useState } from 'react';
import { BattlefieldScene } from './scene/BattlefieldScene';
import { loadEffectsMode, profileFor, saveEffectsMode, type EffectsMode } from './effects';

/** Phase 1 preview: the battlefield on its own, with the effects settings and a slot-highlight demo. */
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
    <div className="duel">
      <div className="duel__stage" ref={host} />
      {!ready && !error && <div className="loading">Opening the rift…</div>}
      {error && (
        <div className="loading loading--error">The battlefield could not start: {error}</div>
      )}

      <header className="duel__top">
        <a className="btn btn--small" href="#/">
          <span>Back</span>
        </a>
        <p className="duel__label">Phase 1 · The battlefield</p>
      </header>

      {showFps && <p className="duel__fps">{fps}</p>}

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
