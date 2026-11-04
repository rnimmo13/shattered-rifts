import { useEffect, useState, useSyncExternalStore, useRef } from 'react';
import { createPortal } from 'react-dom';
import { desktopBridge, type DesktopSteamStatus } from '../desktopBridge';
import { battleActive, subscribeBattle } from '../battleActivity';
import { localOnly } from '../playAccess';
import './desktopAccount.css';

export function DesktopAccount() {
  const [status, setStatus] = useState<DesktopSteamStatus | null>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [operation, setOperation] = useState<'login' | 'logout' | 'link'>('login');
  const fighting = useSyncExternalStore(subscribeBattle, battleActive);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    void desktopBridge()?.status().then(setStatus);
  }, []);
  useEffect(() => {
    if (!busy) return;
    cancel.current?.focus();
    const key = (event: KeyboardEvent): void => {
      event.stopImmediatePropagation();
      if (event.key === 'Tab') {
        event.preventDefault();
        cancel.current?.focus();
      }
      if (event.key === 'Escape') void desktopBridge()?.googleCancel();
    };
    window.addEventListener('keydown', key, true);
    return () => window.removeEventListener('keydown', key, true);
  }, [busy]);
  if (!status || localOnly()) return null;
  const steam = status.mode === 'steam',
    signedIn = status.provider === 'google';
  return (
    <section className="pvp__account desktop-account" aria-label="Desktop account">
      <p>
        {steam
          ? status.linked
            ? 'Steam is linked to your Google game account.'
            : `Connected through Steam${status.name ? ` as ${status.name}` : ''}.`
          : status.message}
      </p>
      {steam && <small>{status.message}</small>}
      {(!steam || !status.linked) && (
        <button
          className="btn btn--small"
          disabled={busy || fighting || (steam && !status.online)}
          onClick={() => {
            setBusy(true);
            setOperation(signedIn ? 'logout' : steam ? 'link' : 'login');
            setError('');
            void (signedIn ? desktopBridge()!.googleLogout() : desktopBridge()!.googleLogin())
              .catch((cause: unknown) =>
                setError(
                  cause instanceof Error
                    ? cause.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
                    : 'Could not change accounts. Please try again.',
                ),
              )
              .finally(() => setBusy(false));
          }}
        >
          {signedIn ? 'Sign out' : steam ? 'Link existing Google account' : 'Sign in with Google'}
        </button>
      )}
      {fighting && <small>Finish or leave the battle before changing accounts.</small>}
      {signedIn && !status.online && (
        <button
          className="btn btn--small"
          disabled={busy || fighting}
          onClick={() => {
            setBusy(true);
            setOperation('login');
            setError('');
            void desktopBridge()!
              .googleLogin()
              .catch(() => setError('Could not reconnect. Try signing in again.'))
              .finally(() => setBusy(false));
          }}
        >
          Reconnect Google
        </button>
      )}
      {error && <p role="alert">{error}</p>}
      {busy &&
        createPortal(
          <div
            className="desktop-login"
            role="dialog"
            aria-modal="true"
            aria-labelledby="desktop-login-title"
          >
            <section>
              <h2 id="desktop-login-title">
                {operation === 'logout'
                  ? 'Signing out'
                  : operation === 'link'
                    ? 'Link your existing account'
                    : 'Sign in with Google'}
              </h2>
              <p>
                {operation === 'logout'
                  ? 'Saving your progress and signing out…'
                  : 'Continue in your browser, then return to the game. Your current saves stay separate.'}
              </p>
              {operation !== 'logout' && (
                <button
                  ref={cancel}
                  className="btn btn--small"
                  onClick={() => {
                    void desktopBridge()?.googleCancel();
                  }}
                >
                  Cancel waiting
                </button>
              )}
            </section>
          </div>,
          document.body,
        )}
    </section>
  );
}
