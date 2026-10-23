import { Suspense, lazy, useEffect, useState } from 'react';
import { TitleScreen } from './TitleScreen';

// The duel screen pulls in the whole Pixi renderer, so it loads on demand.
const RunScreen = lazy(() => import('../run/RunScreen'));
const FightScreen = lazy(() => import('../fight/FightScreen'));
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
  if (hash === '#/run') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <RunErrorBoundary>
          <RunScreen />
        </RunErrorBoundary>
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
