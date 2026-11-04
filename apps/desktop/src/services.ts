import {
  app,
  dialog,
  ipcMain,
  session,
  BrowserWindow,
  webContents,
  type IpcMainInvokeEvent,
} from 'electron';
import { join } from 'node:path';
import { gameNavigation, localGame, LOCAL_GAME_URL, GAME_URL } from './policy.js';
import { SaveStore } from './saveStore.js';
import type { SteamService } from './steam.js';
import { cloudKey } from './saveData.js';
import { DesktopUpdates, installSavedUpdate } from './updates.js';

let store: SaveStore;
let localStore: SaveStore;
let steam: SteamService;
const ready = new Set<number>();
const saveBeforeUpdate = new Map<number, () => Promise<() => void>>();

export function initializeServices(
  base: string,
  service: SteamService,
  updates = new DesktopUpdates(app.getVersion()),
): void {
  steam = service;
  store = new SaveStore(join(base, 'saves', steam.owner), steam.owner);
  localStore = new SaveStore(join(base, 'local-saves', steam.owner), steam.owner);
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
    const local = localGame(event.senderFrame!.url);
    const data = (local ? localStore : store).load();
    if (!local) steam.unlock(data?.earned ?? []);
    return { data, replace: keys.filter(cloudKey), steam: steam.status };
  });
  ipcMain.handle('desktop:save', (event, entries: unknown) => {
    authorized(event);
    if (!ready.has(event.sender.id)) throw new Error('Save restoration has not finished');
    const local = localGame(event.senderFrame!.url);
    const saved = (local ? localStore : store).save(entries);
    if (!local) steam.unlock(saved.earned);
    return { savedAt: saved.savedAt, earned: saved.earned };
  });
  ipcMain.handle('desktop:ready', (event) => {
    authorized(event);
    ready.add(event.sender.id);
  });
  ipcMain.handle('desktop:status', async (event) => {
    authorized(event);
    if (localGame(event.senderFrame!.url))
      return {
        mode: 'standalone',
        appId: null,
        name: null,
        online: false,
        message: 'Local offline play. Progress stays on this device.',
      };
    await initialLogin;
    return { ...steam.status, online: !!steam.authorization() };
  });
  ipcMain.on('desktop:quit', (event) => {
    authorized(event);
    app.quit();
  });
  ipcMain.handle('desktop:update-status', (event) => {
    authorized(event);
    return updates.status();
  });
  ipcMain.handle('desktop:update-check', (event) => {
    authorized(event);
    return updates.check();
  });
  ipcMain.handle('desktop:update-install', async (event) => {
    authorized(event);
    if (updates.status().phase !== 'ready') throw new Error('No update is ready');
    const win = BrowserWindow.fromWebContents(event.sender);
    const persist = saveBeforeUpdate.get(event.sender.id);
    if (!win || !persist || !ready.has(event.sender.id))
      throw new Error('The game is not ready to save');
    // Freeze native input before the final snapshot; the installer can only start after it succeeds.
    const block = (input: Electron.Event): void => input.preventDefault();
    win.setIgnoreMouseEvents(true);
    win.webContents.on('before-input-event', block);
    try {
      await installSavedUpdate(updates, persist);
    } catch (error) {
      win.setIgnoreMouseEvents(false);
      win.webContents.removeListener('before-input-event', block);
      throw error;
    }
  });
  ipcMain.handle('desktop:switch-mode', async (event, local: unknown) => {
    authorized(event);
    if (typeof local !== 'boolean') throw new Error('Invalid mode');
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    ready.delete(event.sender.id);
    await win.loadURL(local ? LOCAL_GAME_URL : GAME_URL);
  });
  // Auth stays in the main process and is attached only to this game's trusted backend.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = new URL(details.url);
    const contents =
      details.webContentsId === undefined ? null : webContents.fromId(details.webContentsId);
    if (
      contents &&
      localGame(contents.getURL()) &&
      url.host === 'shatteredrifts.app' &&
      (url.pathname.startsWith('/pvp/') || url.pathname.startsWith('/auth/'))
    ) {
      callback({ cancel: true });
      return;
    }
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
  const persist = async (): Promise<() => void> => {
    const raw: unknown = await Promise.race([
      win.webContents.executeJavaScript('Object.fromEntries(Object.entries(localStorage))'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Save timed out')), 5000)),
    ]);
    const local = localGame(win.webContents.getURL());
    const saved = (local ? localStore : store).save(raw);
    if (!local) steam.unlock(saved.earned);
    session.defaultSession.flushStorageData();
    allowed = true;
    return () => {
      allowed = false;
    };
  };
  const contentsId = win.webContents.id;
  saveBeforeUpdate.set(contentsId, persist);
  win.once('closed', () => {
    saveBeforeUpdate.delete(contentsId);
    ready.delete(contentsId);
  });
  win.on('close', (event) => {
    if (allowed || !ready.has(win.webContents.id)) return;
    event.preventDefault();
    if (saving) return;
    saving = true;
    void (async () => {
      try {
        await persist();
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
