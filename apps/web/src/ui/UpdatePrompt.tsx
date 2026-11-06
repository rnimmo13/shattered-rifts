import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { battleActive, subscribeBattle } from '../battleActivity';
import {
  pendingUpdate,
  subscribeUpdates,
  startAppUpdateChecks,
  applyRequiredUpdate,
} from '../appUpdates';
import './updatePrompt.css';

export function UpdatePrompt() {
  const update = useSyncExternalStore(subscribeUpdates, pendingUpdate);
  const fighting = useSyncExternalStore(subscribeBattle, battleActive);
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const attempted = useRef('');
  const install = useCallback(() => {
    setBusy(true);
    setError('');
    void applyRequiredUpdate().catch(() => {
      setError('Could not save and update. Your game is still open; please try again.');
      setBusy(false);
    });
  }, []);
  useEffect(startAppUpdateChecks, []);
  useEffect(() => {
    if (update && !fighting && !dialog.current?.open) dialog.current?.showModal();
  }, [update, fighting]);
  useEffect(() => {
    if (!update || fighting || attempted.current === update.key) return;
    attempted.current = update.key;
    install();
  }, [update, fighting, install]);
  if (!update || fighting) return null;
  return (
    <dialog
      ref={dialog}
      className="update-prompt"
      aria-modal="true"
      aria-label="Game update required"
      onCancel={(e) => e.preventDefault()}
    >
      <div>
        <strong>
          {update.version ? `Version ${update.version} is ready` : 'A game update is ready'}
        </strong>
        <p>
          {update.kind === 'web'
            ? 'Update required. Saving your progress and refreshing automatically.'
            : busy
              ? 'Saving and installing the update. Shattered Rifts will close for a moment and reopen by itself, usually within 30 seconds.'
              : 'Update required. Saving your progress and restarting automatically to install the patch.'}
        </p>
        {busy && (
          <progress className="update-prompt__progress" aria-label="Installing the update" />
        )}
      </div>
      <div className="update-prompt__actions">
        <button className="btn btn--small" disabled={busy} onClick={install}>
          {busy ? 'Saving and updating…' : 'Retry required update'}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </dialog>
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
              ? applyRequiredUpdate()
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
