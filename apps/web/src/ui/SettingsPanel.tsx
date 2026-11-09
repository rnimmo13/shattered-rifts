// The Settings menu (DECISIONS #571): sound, graphics and gameplay preferences in one panel, opened from any screen. It is
// mounted once, at the app's root; a change is saved where that preference has always lived, and announced, so a fight in
// progress applies it at once.

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getSound, setSound } from '../audio/sfx';
import { getMusic, setMusic } from '../audio/music';
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
import { DesktopAccount } from '../pvp/DesktopAccount';
import { SettingsRow as Row } from './SettingsRow';
import { WebUpdateControls } from './UpdatePrompt';
import { BUILD } from '../build';
import { PerformanceReportShare } from './PerformanceReportShare';
import { downloadBalanceReport } from '../app/balanceJournal';
import { localOnly, releasePlayAccess } from '../playAccess';
import { battleActive, subscribeBattle } from '../battleActivity';
import {
  desktopBridge,
  desktopSaveError,
  flushDesktopSave,
  quitDesktop,
  type DesktopSteamStatus,
} from '../desktopBridge';

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
  const [music, setMusicState] = useState(getMusic);
  const [graphics, setGraphics] = useState<GraphicsQuality>(loadGraphicsQuality);
  const [reduced, setReduced] = useState(() => loadEffectsMode() === 'reduced');
  const [tips, setTips] = useState(loadTipsOn);
  const [tipsReset, setTipsReset] = useState(false);
  const [full, setFull] = useState(fullscreenOn);
  const [report, setReport] = useState<string | null>(lastReport);
  const [sharedReport, setSharedReport] = useState<{ report: string; link: string } | null>(null);
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
        ...panel.current.querySelectorAll<HTMLElement>('button, input, textarea, summary, a[href]'),
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
  const changeMusic = (next: Partial<ReturnType<typeof getMusic>>): void => {
    setMusic(next);
    setMusicState(getMusic());
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
          <div className="settings__heading">
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
          </div>
          {desktopBridge() && (
            <div className="settings__exit">
              <p>Save your progress and close the game.</p>
              <button
                className="btn btn--small btn--ghost settings__quit"
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
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 4H5v16h5M14 8l4 4-4 4M9 12h10" />
                </svg>
                <span>{quitting ? 'Saving…' : 'Quit to Desktop'}</span>
              </button>
            </div>
          )}
          {desktopBridge() && (quitError || desktopSaveError()) && (
            <p className="settings__error" role="alert">
              {quitError || desktopSaveError()}
            </p>
          )}
        </header>

        <div className="settings__body">
          {desktopBridge() && (
            <section className="settings__group" aria-labelledby="settings-desktop">
              <h3 id="settings-desktop">Account and saves</h3>
              <DesktopAccount layout="settings" />
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
              {desktop && localOnly() && (
                <p className="settings__hint">
                  {desktop.name ? `${desktop.name} — ` : ''}
                  {desktop.message}
                </p>
              )}
            </section>
          )}

          <section className="settings__group" aria-labelledby="settings-audio">
            <h3 id="settings-audio">Audio</h3>
            <Row label="Sound effects">
              <Choice
                label="Sound effects"
                value={sound.on ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
                onChange={(v) => changeSound({ on: v === 'on' })}
              />
            </Row>
            <Row label="Effects volume">
              <span className="settings__range">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(sound.volume * 100)}
                  disabled={!sound.on}
                  aria-label="Effects volume"
                  onChange={(e) => changeSound({ volume: Number(e.target.value) / 100 })}
                />
                <output>{Math.round(sound.volume * 100)}%</output>
              </span>
            </Row>
            <Row label="Music">
              <Choice
                label="Music"
                value={music.on ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'On' },
                  { value: 'off', label: 'Off' },
                ]}
                onChange={(v) => changeMusic({ on: v === 'on' })}
              />
            </Row>
            <Row label="Music volume">
              <span className="settings__range">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={Math.round(music.volume * 100)}
                  disabled={!music.on}
                  aria-label="Music volume"
                  onChange={(e) => changeMusic({ volume: Number(e.target.value) / 100 })}
                />
                <output>{Math.round(music.volume * 100)}%</output>
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
            <h3 id="settings-perf">Playtest and performance reports</h3>
            {/* (DECISIONS #714: what online play keeps for the developer's balance review) */}
            <Row
              label="Game data"
              hint="When you play online, your decks, card choices, Campaign fights (every move) and Arena games are kept on the server for 30 days so the developer can balance the game. They are tied to an anonymous id, never your name or email. Offline desktop play is never sent."
            >
              {null}
            </Row>
            <Row
              label="Balance playtest results"
              hint="Export recent fight results, class choices, deck quality and versions to share with the developer. Kept on this device; no names, account details or automatic uploads."
            >
              <button type="button" className="btn btn--small" onClick={downloadBalanceReport}>
                <span>Export playtest results</span>
              </button>
            </Row>
            <Row
              label="Record a report"
              hint="If the game stutters, record a report: play a fight or two as usual, press Stop at the bottom left, then choose Share report and send the short link. It holds timings and this computer's graphics and browser details."
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
                <PerformanceReportShare
                  key={report}
                  report={report}
                  existingLink={sharedReport?.report === report ? sharedReport.link : undefined}
                  onShared={(link) => setSharedReport({ report, link })}
                />
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
                    <span>{copied ? 'Copied' : 'Copy report text (optional)'}</span>
                  </button>
                  <small className="settings__hint">
                    Sharing the link avoids pasting a long report into chat. You can still copy the
                    raw text if needed.
                  </small>
                </div>
              </div>
            )}
          </section>
          <section className="settings__group" aria-labelledby="settings-about">
            <h3 id="settings-about">About and updates</h3>
            <p className="settings__version">Version {BUILD.version}</p>
            <nav className="settings__aboutLinks" aria-label="About the game">
              <a href="#/patch-notes" onClick={() => setOpen(false)}>
                Patch notes
              </a>
              <a href="#/credits" onClick={() => setOpen(false)}>
                Credits
              </a>
            </nav>
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
    </div>
  );
}
