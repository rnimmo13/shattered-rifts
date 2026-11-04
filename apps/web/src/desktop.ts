// Pixi's CSP-compatible shader helpers avoid dynamic code evaluation in the desktop renderer.
import 'pixi.js/unsafe-eval';
import { startDesktop, desktopBridge } from './desktopBridge';

void startDesktop()
  .then(async () => {
    await import('./main');
    void import('./pvp/steamIdentity')
      .then(({ useSteamName }) => useSteamName())
      .catch(() => undefined);
  })
  .catch((error: unknown) => {
    const root = document.getElementById('root');
    if (!root) return;
    root.textContent = error instanceof Error ? error.message : 'Could not load desktop saves.';
    const quit = document.createElement('button');
    quit.textContent = 'Quit to Desktop';
    quit.onclick = () => desktopBridge()?.quit();
    root.appendChild(quit);
  });
