import { app, BrowserWindow, dialog } from 'electron';
import { join } from 'node:path';
import { createGameWindow, initializeGame } from './app.js';
import { initializeServices } from './services.js';
import { configuredAppId, SteamService } from './steam.js';
import { autoUpdater } from 'electron-updater';
import { DesktopUpdates } from './updates.js';

app.setName('Shattered Rifts');
// Fixed across app versions and installer locations. Browser saves remain separate.
const base = join(app.getPath('appData'), 'ShatteredRifts');
app.setPath('userData', base);
app.setAppUserModelId('app.shatteredrifts.desktop');

if (!app.requestSingleInstanceLock()) app.quit();
else {
  let steam: SteamService;
  try {
    steam = new SteamService(configuredAppId());
    if (steam.owner !== 'standalone') app.setPath('userData', join(base, 'profiles', steam.owner));
  } catch (error) {
    dialog.showErrorBox(
      'Steam is unavailable',
      `${error instanceof Error ? error.message : 'Could not start Steam.'}\nStart Steam and launch the game from your library.`,
    );
    app.exit(1);
    throw error;
  }
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
  app.on('window-all-closed', () => app.quit());
  void app
    .whenReady()
    .then(async () => {
      initializeGame();
      const enabled =
        app.isPackaged &&
        process.platform === 'win32' &&
        !process.windowsStore &&
        steam.appId === null;
      if (enabled) {
        autoUpdater.autoDownload = true;
        autoUpdater.autoInstallOnAppQuit = true;
        autoUpdater.allowPrerelease = false;
        autoUpdater.allowDowngrade = false;
        autoUpdater.disableWebInstaller = true;
      }
      const updates = new DesktopUpdates(
        app.getVersion(),
        enabled ? autoUpdater : undefined,
        steam.appId !== null ? 'Steam manages updates for this edition.' : undefined,
      );
      initializeServices(base, steam, updates);
      await createGameWindow();
      if (enabled) {
        const initial = setTimeout(() => void updates.check(), 15000);
        initial.unref();
        const periodic = setInterval(() => void updates.check(), 6 * 60 * 60 * 1000);
        periodic.unref();
      }
    })
    .catch((error: unknown) => {
      dialog.showErrorBox(
        'Cannot open Shattered Rifts',
        error instanceof Error ? error.message : 'Unknown startup error',
      );
      app.quit();
    });
}
