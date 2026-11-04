import { useEffect, useState } from 'react';
import { desktopBridge, restartDesktopUpdate, type DesktopUpdateStatus } from '../desktopBridge';
import './desktopUpdates.css';

const DESKTOP_DOWNLOAD =
  'https://github.com/rnimmo13/shattered-rifts/releases/latest/download/Shattered-Rifts-Setup.exe';

export function DesktopDownload() {
  if (desktopBridge()) return null;
  return (
    <div className="desktop-download">
      <a className="btn btn--small" href={DESKTOP_DOWNLOAD}>
        Download for Windows
      </a>
      <small>64-bit desktop playtest · automatic updates</small>
    </div>
  );
}

export function DesktopUpdates({ compact = false }: { compact?: boolean }) {
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
          ? `Desktop update ${status.version ?? ''} is ready.`
          : status.phase === 'downloading'
            ? `Downloading desktop update: ${status.percent}%`
            : status.message}
      </p>
      {!compact && (
        <small>
          Installed version {status.currentVersion}. {ready ? status.message : ''}
        </small>
      )}
      {status.phase === 'downloading' && (
        <progress max={100} value={status.percent} aria-label="Update download progress" />
      )}
      {status.phase !== 'unsupported' && (
        <button
          className="btn btn--small"
          type="button"
          disabled={busy || ['checking', 'downloading', 'installing'].includes(status.phase)}
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
