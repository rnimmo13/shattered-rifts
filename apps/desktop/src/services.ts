import {
  app,
  dialog,
  ipcMain,
  session,
  type BrowserWindow,
  type IpcMainInvokeEvent,
} from 'electron';
import { join } from 'node:path';
import { gameNavigation } from './policy.js';
import { SaveStore } from './saveStore.js';
import type { SteamService } from './steam.js';
import { cloudKey } from './saveData.js';

let store: SaveStore;
let steam: SteamService;
const ready = new Set<number>();

export function initializeServices(base: string, service: SteamService): void {
  steam = service;
  store = new SaveStore(join(base, 'saves', steam.owner), steam.owner);
  const authorized = (event: Pick<IpcMainInvokeEvent, 'sender' | 'senderFrame'>): void => {
    if (
      !event.senderFrame ||
      event.senderFrame !== event.sender.mainFrame ||
      !gameNavigation(event.senderFrame.url)
    )
      throw new Error('Desktop action is only available to the game');
  };
  const initialLogin = steam.login();
  ipcMain.handle('desktop:bootstrap', (event, keys: unknown) => {
    authorized(event);
    if (!Array.isArray(keys) || keys.length > 4000 || !keys.every((key) => typeof key === 'string'))
      throw new Error('Invalid storage keys');
    const data = store.load();
    steam.unlock(data?.earned ?? []);
    return { data, replace: keys.filter(cloudKey), steam: steam.status };
  });
  ipcMain.handle('desktop:save', (event, entries: unknown) => {
    authorized(event);
    if (!ready.has(event.sender.id)) throw new Error('Save restoration has not finished');
    const saved = store.save(entries);
    steam.unlock(saved.earned);
    return { savedAt: saved.savedAt, earned: saved.earned };
  });
  ipcMain.handle('desktop:ready', (event) => {
    authorized(event);
    ready.add(event.sender.id);
  });
  ipcMain.handle('desktop:status', async (event) => {
    authorized(event);
    await initialLogin;
    return { ...steam.status, online: !!steam.authorization() };
  });
  ipcMain.on('desktop:quit', (event) => {
    authorized(event);
    app.quit();
  });
  // Auth stays in the main process and is attached only to this game's trusted backend.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = new URL(details.url);
    const token = steam.authorization();
    if (
      token &&
      ['https:', 'wss:'].includes(url.protocol) &&
      url.host === 'shatteredrifts.app' &&
      (url.pathname.startsWith('/pvp/') || url.pathname === '/auth/me')
    )
      details.requestHeaders.Authorization = token;
    callback({ requestHeaders: details.requestHeaders });
  });
  const retry = setInterval(
    () => {
      void steam.login();
    },
    15 * 60 * 1000,
  );
  retry.unref();
  const retryAchievements = setInterval(() => {
    try {
      steam.unlock(store.load()?.earned ?? []);
    } catch {
      /* preserve unreadable saves */
    }
  }, 30000);
  retryAchievements.unref();
  app.on('before-quit', () => steam.dispose());
}

export function protectWindowSaves(win: BrowserWindow): void {
  let allowed = false;
  let saving = false;
  win.on('close', (event) => {
    if (allowed || !ready.has(win.webContents.id)) return;
    event.preventDefault();
    if (saving) return;
    saving = true;
    void (async () => {
      try {
        const raw: unknown = await Promise.race([
          win.webContents.executeJavaScript('Object.fromEntries(Object.entries(localStorage))'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Save timed out')), 5000)),
        ]);
        const saved = store.save(raw);
        steam.unlock(saved.earned);
        session.defaultSession.flushStorageData();
        allowed = true;
        win.close();
      } catch {
        const answer = await dialog.showMessageBox(win, {
          type: 'error',
          title: 'Could not save the game',
          message: 'The latest progress could not be written. Your previous save is preserved.',
          buttons: ['Keep playing', 'Quit without saving'],
          defaultId: 0,
          cancelId: 0,
        });
        saving = false;
        if (answer.response === 1) {
          allowed = true;
          win.close();
        }
      }
    })();
  });
}
