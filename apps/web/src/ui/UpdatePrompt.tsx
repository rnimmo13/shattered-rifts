import { useEffect, useState, useSyncExternalStore } from 'react';
import { battleActive, subscribeBattle } from '../battleActivity';
import {
  pendingUpdate,
  subscribeUpdates,
  startAppUpdateChecks,
  refreshForUpdate,
} from '../appUpdates';
import { restartDesktopUpdate } from '../desktopBridge';
import './updatePrompt.css';

export function UpdatePrompt() {
  const update = useSyncExternalStore(subscribeUpdates, pendingUpdate);
  const fighting = useSyncExternalStore(subscribeBattle, battleActive);
  const [dismissed, setDismissed] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(startAppUpdateChecks, []);
  if (!update || fighting || dismissed === update.key) return null;
  return (
    <aside className="update-prompt" role="status" aria-label="Game update available">
      <div>
        <strong>
          {update.version ? `Version ${update.version} is ready` : 'A game update is ready'}
        </strong>
        <p>
          {update.kind === 'web'
            ? 'Save your progress and refresh to load the new version.'
            : 'The patch is downloaded. Save and restart to install it.'}
        </p>
      </div>
      <div className="update-prompt__actions">
        <button
          className="btn btn--small"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            setError('');
            void (update.kind === 'web' ? refreshForUpdate() : restartDesktopUpdate()).catch(() => {
              setError('Could not save and update. Your game is still open; please try again.');
              setBusy(false);
            });
          }}
        >
          {busy ? 'Saving…' : update.kind === 'web' ? 'Save and refresh' : 'Save and restart'}
        </button>
        <button
          className="btn btn--small btn--ghost"
          disabled={busy}
          onClick={() => setDismissed(update.key)}
        >
          Later
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </aside>
  );
}

export function WebUpdateControls() {
  const update = useSyncExternalStore(subscribeUpdates, pendingUpdate);
  const fighting = useSyncExternalStore(subscribeBattle, battleActive);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    'Updates are checked automatically while this page is open.',
  );
  return (
    <div className="desktop-updates">
      <p>{update?.kind === 'web' ? 'A newer website version is available.' : message}</p>
      {fighting && update && <small>Finish or leave the battle before refreshing.</small>}
      <button
        className="btn btn--small"
        disabled={busy || (fighting && !!update)}
        onClick={() => {
          setBusy(true);
          void (
            update
              ? refreshForUpdate()
              : import('../appUpdates').then(({ checkAppUpdates }) => checkAppUpdates())
          )
            .then(() =>
              setMessage('Version check finished. New releases will appear here when available.'),
            )
            .catch(() =>
              setMessage('Could not save and refresh. Your game is still open; try again.'),
            )
            .finally(() => setBusy(false));
        }}
      >
        {busy ? 'Please wait…' : update ? 'Save and refresh' : 'Check for updates'}
      </button>
    </div>
  );
}
