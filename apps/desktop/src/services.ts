import {
  app,
  dialog,
  ipcMain,
  session,
  BrowserWindow,
  webContents,
  type IpcMainInvokeEvent,
  safeStorage,
  shell,
} from 'electron';
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gameNavigation, localGame, LOCAL_GAME_URL, GAME_URL } from './policy.js';
import { SaveStore } from './saveStore.js';
import type { SteamService } from './steam.js';
import { cloudKey } from './saveData.js';
import { DesktopUpdates, installSavedUpdate } from './updates.js';
import { GoogleService, type CredentialCrypto } from './google.js';

let store: SaveStore;
let localStore: SaveStore;
let steam: SteamService;
const ready = new Set<number>();
const saveBeforeUpdate = new Map<number, () => Promise<() => void>>();

export function initializeServices(
  base: string,
  service: SteamService,
  updates = new DesktopUpdates(app.getVersion()),
  authPorts: {
    crypto?: CredentialCrypto;
    open?: (url: string) => Promise<void>;
    fetcher?: typeof fetch;
  } = {},
): void {
  steam = service;
  const google = new GoogleService(
    join(base, 'auth', 'google-v1.dat'),
    authPorts.crypto ?? safeStorage,
  );
  if (!steam.appId) google.restore();
  const selectedOwner = (): string => google.owner() ?? steam.owner;
  const storeFor = (owner: string): SaveStore =>
    new SaveStore(
      join(base, owner.startsWith('google-') ? 'account-saves' : 'saves', owner),
      owner,
    );
  store = storeFor(selectedOwner());
  // Fail before touching renderer storage if an account save cannot be restored.
  store.load();
  const ownerFile = join(base, 'active-online-owner.json');
  let resetOnline = false;
  if (existsSync(ownerFile)) resetOnline = readFileSync(ownerFile, 'utf8') !== selectedOwner();
  else resetOnline = google.owner() !== null;
  const recordOwner = (): void => {
    mkdirSync(base, { recursive: true });
    writeFileSync(ownerFile, selectedOwner(), { flush: true });
  };
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
  let changingAccount = false;
  const accountChange = async (run: () => Promise<void>): Promise<void> => {
    if (changingAccount) throw new Error('Another account change is already in progress.');
    changingAccount = true;
    try {
      await run();
    } finally {
      changingAccount = false;
    }
  };
  ipcMain.handle('desktop:bootstrap', (event, keys: unknown) => {
    authorized(event);
    if (!Array.isArray(keys) || keys.length > 4000 || !keys.every((key) => typeof key === 'string'))
      throw new Error('Invalid storage keys');
    const local = localGame(event.senderFrame!.url);
    const data = (local ? localStore : store).load();
    const reset = !local && resetOnline;
    if (!local) steam.unlock(data?.earned ?? []);
    return { data, replace: reset ? keys : keys.filter(cloudKey), reset, steam: steam.status };
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
    if (!localGame(event.senderFrame!.url)) {
      recordOwner();
      resetOnline = false;
    }
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
    const googleOnline = !steam.appId && (await google.validate(authPorts.fetcher));
    if (!steam.appId)
      return {
        ...steam.status,
        available: true,
        provider: google.owner() ? 'google' : null,
        online: googleOnline,
        message: googleOnline
          ? `Signed in with Google.${google.persistent ? '' : ' Sign-in lasts until this app closes because secure credential storage is unavailable.'}`
          : google.owner()
            ? 'Google account saved. Reconnect or sign in again to use online play.'
            : 'Sign in with Google to use your website account, or use a Vault code.',
      };
    return { ...steam.status, provider: 'steam', available: true, online: !!steam.authorization() };
  });
  const prepareSwitch = async (win: BrowserWindow, apply: () => Promise<void>): Promise<void> => {
    const block = (event: Electron.Event): void => event.preventDefault();
    win.setIgnoreMouseEvents(true);
    win.webContents.on('before-input-event', block);
    try {
      await win.webContents.executeJavaScript('window.shatteredRiftsPrepareAccountSwitch()');
      const raw: unknown = await win.webContents.executeJavaScript(
        'Object.fromEntries(Object.entries(localStorage))',
      );
      store.save(raw);
      ready.delete(win.webContents.id);
      try {
        await apply();
      } catch (error) {
        ready.add(win.webContents.id);
        throw error;
      }
      resetOnline = true;
      await win.webContents.executeJavaScript('localStorage.clear(); sessionStorage.clear()');
      await win.loadURL(GAME_URL);
    } finally {
      win.setIgnoreMouseEvents(false);
      win.webContents.removeListener('before-input-event', block);
    }
  };
  ipcMain.handle('desktop:google-login', async (event) => {
    authorized(event);
    return accountChange(async () => {
      if (localGame(event.senderFrame!.url))
        throw new Error('Switch to your online account before signing in.');
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win || !ready.has(event.sender.id)) throw new Error('Game is not ready');
      if (steam.appId && steam.status.linked) throw new Error('Steam is already linked.');
      // A link never imports a second native Steam save over existing Google progress.
      if (steam.appId) {
        const entries = store.load()?.entries ?? {};
        if (
          ['sr.runs.v3', 'sr-vault-v1', 'sr.runHistory', 'sr.matchHistory'].some(
            (key) => entries[key] && entries[key] !== '[]' && entries[key] !== '{}',
          )
        )
          throw new Error('Steam already has separate progress. Linking cannot overwrite it.');
      }
      if (steam.appId && !steam.authorization())
        throw new Error('Connect Steam before linking a Google account.');
      const result = await google.login(
        authPorts.open ?? ((url) => shell.openExternal(url)),
        steam.appId ? steam.authorization() : null,
        authPorts.fetcher,
      );
      if (steam.appId && !('linked' in result))
        throw new Error('Steam sign-in is unavailable. Try again after connecting Steam.');
      await prepareSwitch(win, async () => {
        if ('linked' in result) {
          await steam.login();
          if (!steam.status.linked)
            throw new Error('Link completed. Reconnect Steam to finish signing in.');
          store = storeFor(steam.owner);
        } else {
          const next = storeFor(`google-${result.account}`);
          next.load();
          google.commit(result);
          store = next;
        }
      });
    });
  });
  ipcMain.handle('desktop:google-cancel', (event) => {
    authorized(event);
    google.cancel();
  });
  ipcMain.handle('desktop:google-logout', async (event) => {
    authorized(event);
    return accountChange(async () => {
      if (steam.appId || localGame(event.senderFrame!.url))
        throw new Error('Google sign-out is available in online standalone mode.');
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;
      await prepareSwitch(win, async () => {
        const next = storeFor(steam.owner);
        next.load();
        await google.logout(authPorts.fetcher);
        store = next;
      });
    });
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
    if (changingAccount) throw new Error('Finish or cancel sign-in before switching save modes.');
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
    const token = google.authorization() ?? steam.authorization();
    if (
      token &&
      ['https:', 'wss:'].includes(url.protocol) &&
      url.host === 'shatteredrifts.app' &&
      (url.pathname.startsWith('/pvp/') || url.pathname === '/auth/me') &&
      !!contents &&
      gameNavigation(contents.getURL()) &&
      !localGame(contents.getURL())
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
      win.webContents.executeJavaScript(
        '(async () => { await window.shatteredRiftsConfirmOnlineSave?.(); return Object.fromEntries(Object.entries(localStorage)); })()',
      ),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Save timed out')), 15000)),
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
          message:
            'The latest progress could not be written or confirmed on your account. Your local save is preserved. Reconnect before switching devices.',
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
