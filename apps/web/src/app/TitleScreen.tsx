// The home page: the Riftwalker you have picked on show, the three ways to play (New Run, Arena, Sandbox), and sign-in.

import { useEffect, useState, type CSSProperties } from 'react';
import { RIFTWALKERS, type HeroId } from '@sr/content/v2';
import { BUILD } from '../build';
import {
  RUN_SLOTS,
  clearSavedRun,
  listRuns,
  runCount,
  setActiveRun,
  unreadableRuns,
} from '../run/saves';
import { loseSavedDecks } from '../run/deckSave';
import { whoAmI, type Me } from '../pvp/vaultSync';
import { progressLabel } from '../pvp/deckLayout';
import { stagesCleared } from '../pvp/vault';
import { StoreIcon } from './StoreIcon';
import { HomeLinks } from './HomeLinks';
import { PlayerChip } from './PlayerChip';
import { HERO_COLOR } from '../art/emblems';
import { HeroShowcase } from './HeroShowcase';
import { getHero, rememberHero } from './heroChoice';
import { hasUnread } from './patchNotes';
import './home.css';

export function TitleScreen() {
  const [picked, setPicked] = useState(getHero);
  // (patch notes the player has not opened yet: the link says so)
  const [unread] = useState(hasUnread);
  const [me, setMe] = useState<Me>({ signedIn: false, available: false });
  const [runs, setRuns] = useState(listRuns);
  // saves this build cannot read: they still take a slot, so they are shown (to copy for a bug report, or remove)
  const [broken, setBroken] = useState(unreadableRuns);
  const [copied, setCopied] = useState<string | null>(null);
  const refreshRuns = (): void => {
    setRuns(listRuns());
    setBroken(unreadableRuns());
  };
  const [dropping, setDropping] = useState<string | null>(null);
  // a run that cannot be read still takes a slot, so it counts toward the limit
  const full = runs.length >= RUN_SLOTS || runCount() >= RUN_SLOTS;
  const hero = RIFTWALKERS[picked];
  const color = HERO_COLOR[picked] ?? '#d4a84b';

  // another window may have started, finished or abandoned a run
  useEffect(() => {
    const refresh = (): void => {
      setRuns(listRuns());
      setBroken(unreadableRuns());
    };
    window.addEventListener('focus', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  useEffect(() => {
    let live = true;
    void whoAmI().then((m) => {
      if (live) setMe(m);
    });
    return () => {
      live = false;
    };
  }, []);

  const pick = (h: HeroId): void => {
    setPicked(h);
    rememberHero(h);
  };
  const startNew = (): void => {
    // a fresh run (not one of the saved ones): it takes a slot when it is first saved
    setActiveRun(null);
    window.location.hash = '#/run';
  };

  return (
    <main className="home" style={{ '--accent': color } as CSSProperties}>
      <div className="home__bar">
        <span className="home__eyebrow">Friends alpha · working title</span>
        <PlayerChip me={me} onSignedOut={() => setMe({ signedIn: false, available: true })} />
      </div>

      <div className="home__body">
        <section className="home__menu" aria-label="Play">
          <h1 className="home__name">Shattered Rifts</h1>
          <p className="home__tagline">
            Walk the broken worlds. Build a deck. Read the rift. Spring the trap.
          </p>

          {/* (a few runs are big buttons; more than two become a compact list that scrolls, with how many of the slots are used) */}
          {runs.length + broken.length > 0 && (
            <div
              className={`home__runs${runs.length + broken.length > 2 ? ' home__runs--many' : ''}`}
            >
              {runs.length + broken.length > 2 && (
                <span className="home__runsHead">
                  Runs in progress · {runs.length + broken.length} of {RUN_SLOTS}
                </span>
              )}
              {broken.map((b) => (
                <div key={b.id} className="home__runrow home__runrow--broken">
                  <span className="home__broken">
                    <b>A saved run could not be loaded</b>
                    <small>
                      It still takes one of your {RUN_SLOTS} run slots. Copy it to send with a bug
                      report, or remove it to free the slot.
                    </small>
                  </span>
                  <span className="home__brokenActions">
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      onClick={() => {
                        void navigator.clipboard
                          ?.writeText(b.text)
                          .then(() => setCopied(b.id))
                          .catch(() => setCopied(null));
                      }}
                    >
                      <span>{copied === b.id ? 'Copied' : 'Copy save'}</span>
                    </button>
                    {dropping === b.id ? (
                      <button
                        type="button"
                        className="btn btn--small"
                        onClick={() => {
                          clearSavedRun(b.id);
                          refreshRuns();
                          setDropping(null);
                        }}
                      >
                        <span>Remove for good</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn--small btn--ghost"
                        onClick={() => setDropping(b.id)}
                      >
                        <span>Remove</span>
                      </button>
                    )}
                  </span>
                </div>
              ))}
              {runs.map((r) => (
                <div key={r.id} className="home__runrow">
                  <button
                    type="button"
                    className="home__play home__play--continue"
                    aria-label={`Continue the ${RIFTWALKERS[r.run.character].hero.name} run, ${progressLabel(r.run.tier, stagesCleared(r.run))}`}
                    onClick={() => {
                      setActiveRun(r.id);
                      window.location.hash = '#/run';
                    }}
                  >
                    <b>Continue run</b>
                    <small>
                      {RIFTWALKERS[r.run.character].hero.name} ·{' '}
                      {r.run.phase === 'banked'
                        ? `Tier ${r.run.tier} · Saved`
                        : progressLabel(r.run.tier, stagesCleared(r.run))}
                    </small>
                  </button>
                  {dropping === r.id ? (
                    <span
                      className="home__confirm"
                      role="alertdialog"
                      aria-label="Abandon this run?"
                    >
                      {r.run.phase === 'duel'
                        ? 'Abandon it mid-fight? That counts as falling: its deck leaves the Arena.'
                        : 'Abandon it for good? Its saved deck stays in the Arena.'}
                      <button
                        type="button"
                        className="btn btn--small"
                        onClick={() => {
                          // (given up in the middle of a fight it counts as falling, DECISIONS #270)
                          if (r.run.phase === 'duel') void loseSavedDecks(r.run);
                          clearSavedRun(r.id);
                          refreshRuns();
                          setDropping(null);
                        }}
                      >
                        <span>Abandon</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn--small"
                        autoFocus
                        onClick={() => setDropping(null)}
                      >
                        <span>Keep</span>
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--small btn--ghost"
                      aria-label={`Abandon the ${RIFTWALKERS[r.run.character].hero.name} run at Rift Tier ${r.run.tier}`}
                      onClick={() => setDropping(r.id)}
                    >
                      <span>Abandon</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            className={`home__play${runs.length > 0 ? ' home__play--quiet' : ' home__play--primary'}`}
            disabled={full}
            onClick={startNew}
          >
            <b>New Run</b>
            <small>
              {full
                ? `You have ${RUN_SLOTS} runs in progress. Finish or abandon one to start another.`
                : `Three stages as ${hero.hero.name}. Build a deck and face Vorthax.`}
            </small>
          </button>
          <a className="home__play" href="#/arena">
            <b>Arena</b>
            <small>Duel another player with a deck you saved.</small>
          </a>
          <a className="home__play" href="#/fight">
            <b>Sandbox</b>
            <small>Try any fight as {hero.hero.name}, no run needed. Elite events too.</small>
          </a>
          <a className="home__play home__play--store" href="#/store">
            <StoreIcon size={36} />
            <b>Store</b>
            <small>Cosmetics for your Riftwalkers and cards. Coming soon.</small>
          </a>

          <HomeLinks unreadNotes={unread} />
        </section>

        <HeroShowcase picked={picked} onPick={pick} />
      </div>

      <p className="home__footer">
        <a href="#/credits">Credits</a> · combat v2 preview · {BUILD.label}
      </p>
    </main>
  );
}
