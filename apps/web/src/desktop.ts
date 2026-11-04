// Pixi's CSP-compatible shader helpers avoid dynamic code evaluation in the desktop renderer.
import 'pixi.js/unsafe-eval';
import { startDesktop, desktopBridge } from './desktopBridge';
import { showStartupError } from './startup';

void startDesktop()
  .then(async () => {
    await import('./main');
    void import('./pvp/steamIdentity')
      .then(({ useSteamName }) => useSteamName())
      .catch(() => undefined);
  })
  .catch((error: unknown) => {
    showStartupError(
      error instanceof Error ? error.message : 'Could not load desktop saves.',
      () => {
        void desktopBridge()?.quit();
      },
    );
  });
