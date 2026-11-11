import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/bebas-neue/400.css';
import { applyCssTokens } from './design/tokens';
import './app/global.css';
import './ui/controls.css';
import './duel/duel.css';
import { App } from './app/App';
import { loadSkin, preloadArt, observeArtProgress } from './art/assets';
import { startupSplash, showStartupError } from './startup';
import { claimSeasonRewards, cosmetics, syncCosmetics } from './cosmetics/cosmetics';
import { syncMastery } from './cosmetics/mastery';
import { markGraphicsQuality } from './duel/effects';
import { installPlayAccess } from './playAccess';
import { flagChangedAssets } from './appUpdates';
import { startMusic } from './audio/music';

installPlayAccess();

applyCssTokens();
// (Low graphics stops the looping decorations on every screen, not only in a fight: DECISIONS #570)
markGraphicsQuality();

// A tab left open across a deploy asks for chunks that no longer exist ("Failed to fetch dynamically imported module").
// Offer a safe update instead of reloading an active battle when an old chunk disappears.
window.addEventListener('vite:preloadError', (e) => {
  flagChangedAssets();
  e.preventDefault();
});

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// real artwork (if any was supplied) is fetched before the first screen, so no card or figure flashes its placeholder
// (with the skins your Riftwalkers wear, DECISIONS #406: a slow one shows the hero's own look until it arrives)
const wornSkins = (): Promise<unknown> =>
  Promise.race([
    Promise.all(Object.values(cosmetics().worn).flatMap((w) => (w.skin ? [loadSkin(w.skin)] : []))),
    new Promise((resolve) => window.setTimeout(resolve, 3000)),
  ]);
const splash = startupSplash();
const stopProgress = observeArtProgress(splash.update);
void Promise.race([preloadArt().then(wornSkins), splash.skip])
  .then(() => {
    splash.finish();
    stopProgress();
    startMusic();
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  })
  .catch((error: unknown) => {
    splash.finish();
    stopProgress();
    showStartupError(
      error instanceof Error ? error.message : 'The Rift could not open. Please try again.',
    );
  });

// your cosmetics follow you from device to device: this browser's copy is merged with your Vault's (and the skins that arrive load)
void syncCosmetics().then((ok) => {
  if (ok) for (const w of Object.values(cosmetics().worn)) if (w.skin) void loadSkin(w.skin);
  // (DECISIONS #737) season rewards earned since the last visit are given now (nothing is asked while no season has rewards)
  // (hero mastery is asked after them, so its reply carries the earned log with them in it)
  const claimed = ok ? claimSeasonRewards() : Promise.resolve([]);
  // (DECISIONS #739) hero mastery follows you too, and what it has earned is given without asking (one request; an offline profile
  // sends nothing)
  void claimed.then(() => syncMastery());
});
