import { useEffect, useState, useSyncExternalStore } from 'react';
import { battleActive, subscribeBattle } from '../battleActivity';
import { desktopBridge, restartDesktopUpdate, type DesktopUpdateStatus } from '../desktopBridge';
import './desktopUpdates.css';

const DESKTOP_DOWNLOAD =
  'https://github.com/rnimmo13/shattered-rifts/releases/latest/download/Shattered-Rifts-Setup.exe';

export function DesktopDownload() {
  if (desktopBridge()) return null;
  return (
    <div className="desktop-download">
      <a
        className="btn btn--small"
        href={DESKTOP_DOWNLOAD}
        aria-label="Download for Windows"
        title="Download the 64-bit Windows app with automatic updates"
      >
        <img
          src={`${import.meta.env.BASE_URL}branding/logo-192.png`}
          width="24"
          height="24"
          alt=""
        />
        <span className="desktop-download__full">Download for Windows</span>
        <span className="desktop-download__short" aria-hidden>
          Download
        </span>
      </a>
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
