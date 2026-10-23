import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/source-sans-3/400.css';
import '@fontsource/source-sans-3/600.css';
import '@fontsource/bebas-neue/400.css';
import { applyCssTokens } from './design/tokens';
import './app/global.css';
import './duel/duel.css';
import { App } from './app/App';
import { preloadArt } from './art/assets';

applyCssTokens();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

// real artwork (if any was supplied) is fetched before the first screen, so no card or figure flashes its placeholder
void preloadArt().then(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
