import { Suspense, lazy, useEffect, useState } from 'react';
import { ART_READY_EVENT } from '../art/assets';
import { BuildBadge } from '../ui/BuildBadge';
import { TooltipLayer } from '../ui/Tooltip';
import { Bestiary } from '../fight/Bestiary';
import { CardLibrary } from '../fight/CardLibrary';
import { CreditsScreen } from './CreditsScreen';
import { StoreScreen } from './StoreScreen';
import { NameGate } from '../pvp/NameClaim';
import { syncSavedRuns } from '../run/syncRuns';
import { LearnScreen } from './LearnScreen';
import { TitleScreen } from './TitleScreen';

// The duel screen pulls in the whole Pixi renderer, so it loads on demand.
const RunScreen = lazy(() => import('../run/RunScreen'));
const FightScreen = lazy(() => import('../fight/FightScreen'));
const TrialsPractice = lazy(() => import('../trials/TrialsPractice'));
const PvpScreen = lazy(() => import('../pvp/PvpScreen'));
const GhostDecksScreen = lazy(() => import('../pvp/GhostDecksScreen'));
const TrophyCaseScreen = lazy(() => import('../pvp/TrophyCaseScreen'));
const SavedDecksScreen = lazy(() => import('../pvp/SavedDecksScreen'));
const LeaderboardScreen = lazy(() =>
  import('../pvp/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);
import { RunErrorBoundary } from '../run/ErrorBoundary';

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export function App() {
  const hash = useHash();
  // the saved runs tell the leaderboard where they are once, when the app opens (a report that was missed is made up for)
  useEffect(() => {
    void syncSavedRuns();
  }, []);
  // figures that arrive after the first screen (a slow first visit) redraw the home screen, which is safe to do (it holds no game)
  const [artVersion, setArtVersion] = useState(0);
  useEffect(() => {
    const on = (): void => setArtVersion((v) => v + 1);
    window.addEventListener(ART_READY_EVENT, on);
    return () => window.removeEventListener(ART_READY_EVENT, on);
  }, []);
  const atHome = hash === '' || hash === '#' || hash === '#/';
  return (
    <>
      <Screens key={atHome ? artVersion : 0} hash={hash} />
      <BuildBadge />
      <TooltipLayer />
    </>
  );
}

function Screens({ hash }: { hash: string }) {
  if (hash === '#/run') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <RunErrorBoundary>
          <NameGate>
            <RunScreen />
          </NameGate>
        </RunErrorBoundary>
      </Suspense>
    );
  }
  if (hash === '#/learn') return <LearnScreen />;
  if (hash === '#/credits') return <CreditsScreen />;
  if (hash === '#/store') return <StoreScreen />;
  if (hash === '#/cards') return <CardLibrary />;
  if (hash === '#/models') return <Bestiary />;
  // the PvP mode is called the Arena (#/pvp keeps working for links already shared)
  if (hash === '#/arena' || hash === '#/pvp') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <PvpScreen />
      </Suspense>
    );
  }
  if (hash === '#/ghosts') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <GhostDecksScreen />
      </Suspense>
    );
  }
  if (hash === '#/trophies') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <TrophyCaseScreen />
      </Suspense>
    );
  }
  if (hash === '#/board') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <LeaderboardScreen />
      </Suspense>
    );
  }
  if (hash === '#/decks') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <SavedDecksScreen />
      </Suspense>
    );
  }
  if (hash === '#/trials') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <TrialsPractice />
      </Suspense>
    );
  }
  if (hash === '#/fight') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <FightScreen />
      </Suspense>
    );
  }
  return <TitleScreen />;
}
