import { app, BrowserWindow, dialog } from 'electron';
import { join } from 'node:path';
import { createGameWindow, initializeGame } from './app.js';

app.setName('Shattered Rifts');
// Fixed across app versions and installer locations. Browser saves remain separate.
app.setPath('userData', join(app.getPath('appData'), 'ShatteredRifts'));
app.setAppUserModelId('app.shatteredrifts.desktop');

if (!app.requestSingleInstanceLock()) app.quit();
else {
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
      await createGameWindow();
    })
    .catch((error: unknown) => {
      dialog.showErrorBox(
        'Cannot open Shattered Rifts',
        error instanceof Error ? error.message : 'Unknown startup error',
      );
      app.quit();
    });
}
