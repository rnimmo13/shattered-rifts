import { Suspense, lazy, useEffect, useState } from 'react';
import { TitleScreen } from './TitleScreen';

// The duel screen pulls in the whole Pixi renderer, so it loads on demand.
const DuelScreen = lazy(() => import('../duel/DuelScreen'));

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
  if (hash === '#/duel') {
    return (
      <Suspense fallback={<div className="loading">Opening the rift…</div>}>
        <DuelScreen />
      </Suspense>
    );
  }
  return <TitleScreen />;
}
