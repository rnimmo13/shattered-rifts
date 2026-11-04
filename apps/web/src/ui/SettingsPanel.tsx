// The Settings menu (DECISIONS #571): sound, graphics and gameplay preferences in one panel, opened from any screen. It is
// mounted once, at the app's root; a change is saved where that preference has always lived, and announced, so a fight in
// progress applies it at once.

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { getSound, setSound } from '../audio/sfx';
import {
  loadEffectsMode,
  loadGraphicsQuality,
  saveEffectsMode,
  saveGraphicsQuality,
  type GraphicsQuality,
} from '../duel/effects';
import { loadTipsOn, saveSeen, saveTipsOn } from '../fight/tips';
import { onSettingsOpen, settingsChanged } from '../app/settings';
import { isRecording, lastReport, startRecording } from '../app/perfReport';
import './settings.css';
import { DesktopUpdates } from './DesktopUpdates';
import { WebUpdateControls } from './UpdatePrompt';
import { BUILD } from '../build';
import { localOnly, releasePlayAccess } from '../playAccess';
import { battleActive, subscribeBattle } from '../battleActivity';
import {
  desktopBridge,
  desktopSaveError,
  flushDesktopSave,
  quitDesktop,
  type DesktopSteamStatus,
} from '../desktopBridge';

function Row(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="settings__row">
      <div className="settings__label">
        <span>{props.label}</span>
        {props.hint && <small>{props.hint}</small>}
      </div>
      <div className="settings__control">{props.children}</div>
    </div>
  );
}

/** Two or more choices side by side, one of them chosen (pressed buttons: each is reached with Tab and chosen with Enter). */
function Choice<T extends string>(props: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="settings__choice" role="group" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={props.value === o.value}
          className={`btn btn--small${props.value === o.value ? ' is-on' : ' btn--ghost'}`}
          onClick={() => props.onChange(o.value)}
        >
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

const fullscreenOn = (): boolean => typeof document !== 'undefined' && !!document.fullscreenElement;

export function SettingsPanel() {
  const fighting = useSyncExternalStore(subscribeBattle, battleActive);
  const [buildCopied, setBuildCopied] = useState(false);
  const [desktop, setDesktop] = useState<DesktopSteamStatus | null>(null);
  const [quitting, setQuitting] = useState(false);
  const [quitError, setQuitError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sound, setSoundState] = useState(getSound);
  const [graphics, setGraphics] = useState<GraphicsQuality>(loadGraphicsQuality);
  const [reduced, setReduced] = useState(() => loadEffectsMode() === 'reduced');
  const [tips, setTips] = useState(loadTipsOn);
  const [tipsReset, setTipsReset] = useState(false);
  const [full, setFull] = useState(fullscreenOn);
  const [report, setReport] = useState<string | null>(lastReport);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const pressedBackdrop = useRef(false);
  const reportBox = useRef<HTMLTextAreaElement>(null);

  useEffect(
    () =>
      onSettingsOpen(() => {
        // (read afresh: a quick toggle elsewhere may have changed one since)
        opener.current = document.activeElement;
        setSoundState(getSound());
        setGraphics(loadGraphicsQuality());
        setReduced(loadEffectsMode() === 'reduced');
        setTips(loadTipsOn());
        setTipsReset(false);
        setFull(fullscreenOn());
        setReport(lastReport());
        setCopied(false);
        setOpen(true);
      }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button, input')?.focus();
    // (while it is open, no key reaches the screen behind it: a fight's 1-9 and E would play cards and end the turn. Buttons and
    // the slider still work, as they answer to the key's default action, not to the event reaching anything)
    // (Tab goes round inside the panel: on a button behind it, Enter would end the turn)
    const onKey = (e: KeyboardEvent): void => {
      e.stopPropagation();
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab' || !panel.current) return;
      const stops = [
        ...panel.current.querySelectorAll<HTMLElement>('button, input, textarea'),
      ].filter((el) => !(el as HTMLButtonElement | HTMLInputElement).disabled);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (!first || !last) return;
      const inside = panel.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    const onFull = (): void => setFull(fullscreenOn());
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('fullscreenchange', onFull);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('fullscreenchange', onFull);
      // (a button in a menu that closed meanwhile is gone: focus stays where the browser puts it)
      if (opener.current instanceof HTMLElement && opener.current.isConnected)
        opener.current.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let live = true;
    void desktopBridge()
      ?.status()
      .then((status) => {
        if (live) setDesktop(status);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [open]);

  if (!open) return null;

  // (the sound module reads its setting on every sound: nothing else needs telling)
  const changeSound = (next: Partial<ReturnType<typeof getSound>>): void => {
    setSound(next);
    setSoundState(getSound());
  };

  return (
    <div
      className="settings"
      role="presentation"
      // (on the click, not the press: a tap that closes it must not also land on the screen behind; and only when the press was
      // on the backdrop too, so selecting the report's text and letting go outside the panel does not close it)
      onPointerDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) setOpen(false);
        pressedBackdrop.current = false;
      }}
    >
      <div
        className="settings__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={panel}
      >
        <header className="settings__head">
          <h2 id="settings-title" className="settings__title">
            Settings
          </h2>
          <button
            type="button"
            className="btn btn--small btn--ghost"
            onClick={() => setOpen(false)}
          >
            <span>Close</span>
          </button>
        </header>

        {desktopBridge() && (
          <section className="settings__group" aria-labelledby="settings-desktop">
            <h3 id="settings-desktop">Desktop</h3>
            <Row
              label="Save mode"
              hint="Local offline saves stay separate from your online account."
            >
              <button
                className="btn btn--small"
                disabled={quitting || fighting}
                onClick={() => {
                  setQuitting(true);
                  setQuitError(null);
                  void flushDesktopSave()
                    .then(() => releasePlayAccess())
                    .then(() => desktopBridge()?.switchMode(!localOnly()))
                    .catch(() => {
                      setQuitting(false);
                      setQuitError('Could not save and switch modes. Please try again.');
                    });
                }}
              >
                {localOnly() ? 'Online account' : 'Local offline play'}
              </button>
            </Row>
            <Row label="Quit game" hint="Save your current progress and close the game.">
              <button
                className="btn btn--small"
                type="button"
                disabled={quitting}
                onClick={() => {
                  setQuitting(true);
                  setQuitError(null);
                  void quitDesktop().catch(() => {
                    setQuitting(false);
                    setQuitError('Could not save. The game is still open; please try again.');
                  });
                }}
              >
                <span>{quitting ? 'Saving…' : 'Quit to Desktop'}</span>
              </button>
            </Row>
            {desktop && (
              <p className="settings__hint">
                {desktop.name ? `${desktop.name} — ` : ''}
                {desktop.message}
              </p>
            )}
            {(quitError || desktopSaveError()) && (
              <p role="alert">{quitError || desktopSaveError()}</p>
            )}
          </section>
        )}

        <section className="settings__group" aria-labelledby="settings-audio">
          <h3 id="settings-audio">Audio</h3>
          <Row label="Sound">
            <Choice
              label="Sound"
              value={sound.on ? 'on' : 'off'}
              options={[
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
              onChange={(v) => changeSound({ on: v === 'on' })}
            />
          </Row>
          <Row label="Volume">
            <span className="settings__range">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(sound.volume * 100)}
                disabled={!sound.on}
                aria-label="Volume"
                onChange={(e) => changeSound({ volume: Number(e.target.value) / 100 })}
              />
              <output>{Math.round(sound.volume * 100)}%</output>
            </span>
          </Row>
        </section>

        <section className="settings__group" aria-labelledby="settings-graphics">
          <h3 id="settings-graphics">Graphics</h3>
          <Row
            label="Quality"
            hint="Low stops the drifting fog, floating motes and other motion at rest, for a computer that is slow to draw. Cards, blows and effects play the same."
          >
            <Choice
              label="Graphics quality"
              value={graphics}
              options={[
                { value: 'high', label: 'High' },
                { value: 'low', label: 'Low' },
              ]}
              onChange={(v) => {
                saveGraphicsQuality(v);
                setGraphics(v);
                settingsChanged('graphics');
              }}
            />
          </Row>
          <Row
            label="Effects"
            hint="Reduced halves the shake of a heavy blow, skips the freeze on the biggest ones, shows fewer particles and shows a painted effect as one still picture."
          >
            <Choice
              label="Effects"
              value={reduced ? 'reduced' : 'full'}
              options={[
                { value: 'full', label: 'Full' },
                { value: 'reduced', label: 'Reduced' },
              ]}
              onChange={(v) => {
                saveEffectsMode(v);
                setReduced(v === 'reduced');
                settingsChanged('graphics');
              }}
            />
          </Row>
          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <Row label="Fullscreen">
              <Choice
                label="Fullscreen"
                value={full ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
                onChange={(v) => {
                  const go =
                    v === 'on'
                      ? document.documentElement.requestFullscreen()
                      : fullscreenOn()
                        ? document.exitFullscreen()
                        : Promise.resolve();
                  // (the browser may refuse; the choice shows what really happened)
                  void go.catch(() => undefined).finally(() => setFull(fullscreenOn()));
                }}
              />
            </Row>
          )}
        </section>

        <section className="settings__group" aria-labelledby="settings-play">
          <h3 id="settings-play">Gameplay</h3>
          <Row
            label="Tips"
            hint="Short notes in a fight that explain a rule the first time it comes up."
          >
            <Choice
              label="Tips"
              value={tips ? 'on' : 'off'}
              options={[
                { value: 'on', label: 'On' },
                { value: 'off', label: 'Off' },
              ]}
              onChange={(v) => {
                saveTipsOn(v === 'on');
                setTips(v === 'on');
                settingsChanged('tips');
              }}
            />
          </Row>
          <Row label="Tips already read">
            <button
              type="button"
              className="btn btn--small btn--ghost"
              disabled={tipsReset}
              onClick={() => {
                saveSeen(new Set());
                setTipsReset(true);
                settingsChanged('tips');
              }}
            >
              <span>{tipsReset ? 'Every tip will show again' : 'Show every tip again'}</span>
            </button>
          </Row>
        </section>

        {/* (a report of the stalls on this computer, to send in: DECISIONS #572) */}
        <section className="settings__group" aria-labelledby="settings-perf">
          <h3 id="settings-perf">Performance report</h3>
          <Row
            label="Record a report"
            hint="If the game stutters, record a report: play a fight or two as usual, press Stop at the bottom left, then copy the report and send it in. It holds only timings and this computer's graphics and browser details."
          >
            <button
              type="button"
              className="btn btn--small"
              disabled={isRecording()}
              onClick={() => {
                startRecording();
                setOpen(false);
              }}
            >
              <span>{isRecording() ? 'Recording…' : 'Start recording'}</span>
            </button>
          </Row>
          {report && (
            <div className="settings__report">
              <textarea
                ref={reportBox}
                readOnly
                value={report}
                aria-label="Performance report"
                onFocus={(e) => e.target.select()}
              />
              <div className="settings__reportRow">
                <button
                  type="button"
                  className="btn btn--small"
                  onClick={() => {
                    // (the clipboard API is missing on a page not served over https: copy the selected text the old way)
                    const oldWay = (): void => {
                      reportBox.current?.select();
                      setCopied(document.execCommand('copy'));
                    };
                    if (navigator.clipboard)
                      void navigator.clipboard
                        .writeText(report)
                        .then(() => setCopied(true), oldWay);
                    else oldWay();
                  }}
                >
                  <span>{copied ? 'Copied' : 'Copy the report'}</span>
                </button>
                <small className="settings__hint">
                  If copying does not work, select the text above and copy it.
                </small>
              </div>
            </div>
          )}
        </section>
        <section className="settings__group" aria-labelledby="settings-about">
          <h3 id="settings-about">About and updates</h3>
          <p className="settings__version">Version {BUILD.version}</p>
          {desktopBridge() ? <DesktopUpdates /> : <WebUpdateControls />}
          <details className="settings__build">
            <summary>Build details</summary>
            <p>
              Commit {BUILD.commit}
              {BUILD.dirty ? ' (local changes)' : ''}
              <br />
              Built {BUILD.date || 'locally'}
            </p>
            <button
              className="btn btn--small"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(BUILD.label)
                  .then(() => setBuildCopied(true))
                  .catch(() => setBuildCopied(false));
              }}
            >
              {buildCopied ? 'Copied' : 'Copy build details'}
            </button>
          </details>
        </section>
      </div>
    </div>
  );
}
