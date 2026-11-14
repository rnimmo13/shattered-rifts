import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { battleActive, subscribeBattle } from '../battleActivity';
import { desktopBridge, restartDesktopUpdate, type DesktopUpdateStatus } from '../desktopBridge';
import './desktopUpdates.css';

const DESKTOP_DOWNLOAD =
  'https://github.com/rnimmo13/shattered-rifts-releases/releases/latest/download/Shattered-Rifts-Setup.exe';

/**
 * "Download" in the home page's header: a small menu of the desktop apps. Windows downloads at once; Mac is listed as not ready yet
 * (Robert, 2026-11-10), so a Mac player knows it is coming rather than finding nothing.
 */
export function DesktopDownload() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // (a click anywhere else, or Escape, closes it)
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent): void => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  if (desktopBridge()) return null;
  return (
    <div className="desktop-download" ref={box}>
      <button
        type="button"
        className="btn btn--small"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title="Download the desktop app"
        aria-label="Download the desktop app"
      >
        <span>
          <img
            src={`${import.meta.env.BASE_URL}branding/logo-192.png`}
            width="24"
            height="24"
            alt=""
          />
          <span className="desktop-download__word">Download</span>
          <span className="desktop-download__caret" aria-hidden>
            ▾
          </span>
        </span>
      </button>
      {open && (
        <div className="desktop-download__menu" role="menu" aria-label="Download the desktop app">
          <a
            role="menuitem"
            className="desktop-download__item"
            href={DESKTOP_DOWNLOAD}
            onClick={() => setOpen(false)}
          >
            <b>Windows</b>
            <small>64-bit, with automatic updates</small>
          </a>
          <span
            role="menuitem"
            aria-disabled="true"
            className="desktop-download__item is-soon"
            title="The Mac app is not ready yet"
          >
            <b>
              Mac <i className="desktop-download__soon">Coming soon</i>
            </b>
            <small>Not ready yet: play here in the browser meanwhile</small>
          </span>
        </div>
      )}
    </div>
  );
}

export function DesktopUpdates({ compact = false }: { compact?: boolean }) {
  const fighting = useSyncExternalStore(subscribeBattle, battleActive);
  const [status, setStatus] = useState<DesktopUpdateStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const bridge = desktopBridge();
    if (!bridge) return;
    let live = true;
    const read = (): void => {
      void bridge
        .updateStatus()
        .then((s) => live && setStatus(s))
        .catch(() => undefined);
    };
    read();
    const timer = window.setInterval(read, 2000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);
  if (!status || (compact && !['ready', 'downloading'].includes(status.phase))) return null;
  const ready = status.phase === 'ready';
  return (
    <div className="desktop-updates" aria-live="polite">
      <p>
        {ready
          ? `Desktop update ${status.version ?? ''} is required. The app will save and restart automatically outside battle.`
          : status.phase === 'downloading'
            ? `Downloading desktop update: ${status.percent}%`
            : status.message}
      </p>
      {!compact && ready && (
        <small>{fighting ? 'Finish or leave the battle before restarting.' : status.message}</small>
      )}
      {status.phase === 'downloading' && (
        <progress max={100} value={status.percent} aria-label="Update download progress" />
      )}
      {(status.phase === 'installing' || (busy && ready)) && (
        <>
          <small>
            Installing the update. Shattered Rifts will close for a moment and reopen by itself.
          </small>
          <progress aria-label="Installing the update" />
        </>
      )}
      {status.phase !== 'unsupported' && (
        <button
          className="btn btn--small"
          type="button"
          disabled={
            busy ||
            (ready && fighting) ||
            ['checking', 'downloading', 'installing'].includes(status.phase)
          }
          onClick={() => {
            setBusy(true);
            setError('');
            void (ready ? restartDesktopUpdate() : desktopBridge()!.checkUpdate().then(setStatus))
              .catch(() =>
                setError(
                  'Could not save and restart, or check for updates. The game is still open; please try again.',
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          {busy ? 'Please wait…' : ready ? 'Restart to update' : 'Check for updates'}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
