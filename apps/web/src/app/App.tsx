import { Suspense, lazy, useEffect, useState } from 'react';
import { ART_READY_EVENT } from '../art/assets';
import { UpdatePrompt } from '../ui/UpdatePrompt';
import { ScreenErrorBoundary } from '../ui/ScreenErrorBoundary';
import { TooltipLayer } from '../ui/Tooltip';
import { SettingsPanel } from '../ui/SettingsPanel';
import { PerfRecorder } from '../ui/PerfRecorder';
import { Bestiary } from '../fight/Bestiary';
import { CardLibrary } from '../fight/CardLibrary';
import { DeckLookup } from './DeckLookup';
import { CreditsScreen } from './CreditsScreen';
import { StoreScreen } from './StoreScreen';
import { CosmeticsScreen } from './CosmeticsScreen';
import { NameGate } from '../pvp/NameClaim';
import { syncSavedRuns } from '../run/syncRuns';
import { LearnScreen } from './LearnScreen';
import { TitleScreen } from './TitleScreen';
import { PlayGate, PlayStatus } from '../PlayGate';
import { BUILD } from '../build';
import { EarnedPopup } from '../cosmetics/EarnedPopup';

// The duel screen pulls in the whole Pixi renderer, so it loads on demand.
const RunScreen = lazy(() => import('../run/RunScreen'));
const LoreScreen = lazy(() => import('./LoreScreen'));
const FightScreen = lazy(() => import('../fight/FightScreen'));
const TrialsPractice = lazy(() => import('../trials/TrialsPractice'));
const PvpScreen = lazy(() => import('../pvp/PvpScreen'));
const GhostDecksScreen = lazy(() => import('../pvp/GhostDecksScreen'));
const TrophyCaseScreen = lazy(() => import('../pvp/TrophyCaseScreen'));
const SavedDecksScreen = lazy(() => import('../pvp/SavedDecksScreen'));
const ArenaRulesScreen = lazy(() => import('../pvp/ArenaRulesScreen'));
const HistoryScreen = lazy(() => import('../run/HistoryScreen'));
const EarnedScreen = lazy(() => import('../cosmetics/EarnedScreen'));
const PatchNotesScreen = lazy(() => import('./PatchNotesScreen'));
const ReplayScreen = lazy(() => import('../pvp/ReplayScreen'));
const CampaignFightScreen = lazy(() => import('../run/CampaignFightScreen'));
const WatchScreen = lazy(() => import('../pvp/WatchScreen'));
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
      <ScreenErrorBoundary key={hash}>
        <Screens key={atHome ? artVersion : 0} hash={hash} />
      </ScreenErrorBoundary>
      <PlayStatus />
      {/* (DECISIONS #739) what the player has just earned, to acknowledge: on any page, once no fight is on screen */}
      <EarnedPopup />
      <UpdatePrompt />
      <TooltipLayer />
      {/* (one Settings menu for every screen, opened by a Settings button: DECISIONS #571) */}
      <SettingsPanel />
      <PerfRecorder />
      <small className="game-version" aria-label={`Game version ${BUILD.version}`}>
        v{BUILD.version}
      </small>
    </>
  );
}

function Screens({ hash }: { hash: string }) {
  if (hash === '#/lore')
    return (
      <Suspense fallback={<div className="loading">Opening the chronicle…</div>}>
        <LoreScreen />
      </Suspense>
    );
  if (hash === '#/run') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <RunErrorBoundary>
          <PlayGate>
            <NameGate>
              <RunScreen />
            </NameGate>
          </PlayGate>
        </RunErrorBoundary>
      </Suspense>
    );
  }
  if (hash === '#/learn') return <LearnScreen />;
  if (hash === '#/credits') return <CreditsScreen />;
  if (hash === '#/store') return <StoreScreen />;
  if (hash === '#/cosmetics') return <CosmeticsScreen />;
  if (hash === '#/cards') return <CardLibrary />;
  // (DECISIONS #723) unlisted: nothing links here
  if (hash === '#/deck-lookup') return <DeckLookup />;
  if (hash === '#/models') return <Bestiary />;
  // the PvP mode is called the Arena (#/pvp keeps working for links already shared)
  if (hash === '#/arena' || hash === '#/pvp') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <PlayGate arena>
          <PvpScreen />
        </PlayGate>
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
  // what makes a deck one the Arena takes (linked from every "not valid for the Arena" message)
  if (hash === '#/arena-rules') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <ArenaRulesScreen />
      </Suspense>
    );
  }
  if (hash === '#/trials') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <PlayGate>
          <TrialsPractice />
        </PlayGate>
      </Suspense>
    );
  }
  if (hash === '#/patch-notes') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <PatchNotesScreen />
      </Suspense>
    );
  }
  if (hash === '#/history') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <HistoryScreen />
      </Suspense>
    );
  }
  // (DECISIONS #739) everything the player has earned by playing
  if (hash === '#/earned') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <EarnedScreen />
      </Suspense>
    );
  }
  // a shared Arena replay, or a match to watch as it is played
  if (hash === '#/replay')
    return (
      <Suspense fallback={<div className="loading">Opening match record…</div>}>
        <ReplayScreen />
      </Suspense>
    );
  const replay = /^#\/replay\/([A-Za-z0-9]{10})$/.exec(hash)?.[1];
  if (replay) {
    return (
      <Suspense fallback={<div className="loading">Opening the replay…</div>}>
        <ReplayScreen key={replay} id={replay} />
      </Suspense>
    );
  }
  // a shared Campaign fight (DECISIONS #697), or a saved fight record to open
  if (hash === '#/campaign-fight')
    return (
      <Suspense fallback={<div className="loading">Opening fight record…</div>}>
        <CampaignFightScreen />
      </Suspense>
    );
  const sharedFight = /^#\/campaign-fight\/([A-Za-z0-9]{10})$/.exec(hash)?.[1];
  if (sharedFight)
    return (
      <Suspense fallback={<div className="loading">Opening the fight…</div>}>
        <CampaignFightScreen key={sharedFight} id={sharedFight} />
      </Suspense>
    );
  const watching = /^#\/watch\/([A-Za-z0-9]{4,12})$/.exec(hash)?.[1];
  if (watching) {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <WatchScreen key={watching} room={watching} />
      </Suspense>
    );
  }
  if (hash === '#/fight') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <PlayGate>
          <FightScreen />
        </PlayGate>
      </Suspense>
    );
  }
  return <TitleScreen />;
}
