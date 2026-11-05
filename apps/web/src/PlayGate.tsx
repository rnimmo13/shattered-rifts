import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import {
  canPlay,
  ensurePlay,
  localOnly,
  localRecoveryAvailable,
  playState,
  releasePlayAccess,
  subscribePlay,
} from './playAccess';
import { desktopBridge, flushDesktopSave, quitDesktop } from './desktopBridge';
import './playGate.css';
import { campaignSyncState, subscribeCampaignSync } from './run/runCloud';

export function PlayGate({ children, arena = false }: { children: ReactNode; arena?: boolean }) {
  const access = useSyncExternalStore(subscribePlay, playState);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!localOnly())
      void ensurePlay().then((ok) => {
        if (ok) setOpened(true);
      });
  }, []);
  if (localOnly() && !arena) return <>{children}</>;
  const allowed = canPlay() && access.phase === 'playing' && !(localOnly() && arena);
  return (
    <>
      {(opened || allowed) && (
        <div key={access.epoch} inert={!allowed}>
          {children}
        </div>
      )}
      {!allowed && (
        <div
          className="play-gate"
          role="dialog"
          aria-modal="true"
          aria-labelledby="play-gate-title"
        >
          <section>
            <h1 id="play-gate-title">
              {localOnly()
                ? 'Local offline mode'
                : access.phase === 'claiming' || access.phase === 'saving'
                  ? access.phase === 'saving'
                    ? 'Saving your campaign…'
                    : 'Connecting…'
                  : 'Gameplay unavailable'}
            </h1>
            <p>
              {localOnly()
                ? 'Arena requires your online account. Local campaigns stay on this device.'
                : access.message || 'Connecting your account for play on this device.'}
            </p>
            {!localOnly() && access.phase !== 'claiming' && access.phase !== 'saving' && (
              <button
                className="btn"
                onClick={() => {
                  void ensurePlay().then((ok) => {
                    if (ok) setOpened(true);
                  });
                }}
              >
                Try again
              </button>
            )}
            {localRecoveryAvailable() && (
              <button
                className="btn"
                onClick={() => {
                  void ensurePlay(true).then((ok) => {
                    if (ok) setOpened(true);
                  });
                }}
              >
                Recover newer local progress
              </button>
            )}
            <a className="btn btn--ghost" href="#/">
              Browse the game
            </a>
            {desktopBridge() && (
              <button
                className="btn btn--ghost"
                onClick={() => {
                  void quitDesktop();
                }}
              >
                Quit to Desktop
              </button>
            )}
            {desktopBridge() && (
              <button
                className="btn btn--ghost"
                onClick={() => {
                  void flushDesktopSave()
                    .then(() => releasePlayAccess())
                    .then(() => desktopBridge()?.switchMode(!localOnly()));
                }}
              >
                Switch to {localOnly() ? 'online account' : 'local offline play'}
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}
export function PlayStatus() {
  const access = useSyncExternalStore(subscribePlay, playState);
  const sync = useSyncExternalStore(subscribeCampaignSync, campaignSyncState);
  if (localOnly())
    return (
      <aside className="play-status">
        Local offline play — progress stays on this device.
        <button
          onClick={() => {
            void flushDesktopSave().then(() => desktopBridge()?.switchMode(false));
          }}
        >
          Online account
        </button>
      </aside>
    );
  if (access.phase === 'busy' || access.phase === 'paused')
    return <aside className="play-status">{access.message}</aside>;
  if (access.phase !== 'playing') return null;
  if (window.location.hash === '#/run')
    return (
      <aside className="play-status" role="status">
        {sync === 'saved'
          ? 'Saved to account'
          : sync === 'saving'
            ? 'Saving to account…'
            : 'Account save not confirmed'}
      </aside>
    );
  if (['#/arena', '#/pvp', '#/fight', '#/trials'].includes(window.location.hash)) return null;
  return (
    <aside className="play-status">
      Playing on this device.
      <button
        onClick={() => {
          void releasePlayAccess()
            .then(() => {
              window.location.hash = '#/';
            })
            .catch(() => undefined);
        }}
      >
        Save and stop playing
      </button>
    </aside>
  );
}
