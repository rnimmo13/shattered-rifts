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
import { loadSkin, preloadArt } from './art/assets';
import { cosmetics, syncCosmetics } from './cosmetics/cosmetics';

applyCssTokens();

// A tab left open across a deploy asks for chunks that no longer exist ("Failed to fetch dynamically imported module").
// Load the new version once instead of showing an error; a second failure within 30 s is shown as it is.
window.addEventListener('vite:preloadError', (e) => {
  try {
    const last = Number(sessionStorage.getItem('sr-chunk-reload') ?? 0);
    if (Date.now() - last < 30_000) return;
    sessionStorage.setItem('sr-chunk-reload', String(Date.now()));
    e.preventDefault();
    window.location.reload();
  } catch {
    /* no storage (private mode): let the error show, its Reload button works */
  }
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
void preloadArt()
  .then(wornSkins)
  .then(() => {
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });

// your cosmetics follow you from device to device: this browser's copy is merged with your Vault's (and the skins that arrive load)
void syncCosmetics().then((ok) => {
  if (ok) for (const w of Object.values(cosmetics().worn)) if (w.skin) void loadSkin(w.skin);
});
