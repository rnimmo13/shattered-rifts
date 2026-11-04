import { app, BrowserWindow, dialog, Menu, net, protocol, session, shell } from 'electron';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { assetPath, externalLink, GAME_URL, gameNavigation, windowState } from './policy.js';
import { protectWindowSaves } from './services.js';

// A stable, secure origin keeps the existing asset URLs and local saves working offline.
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'srgame',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

export function initializeGame(): void {
  const root = app.isPackaged
    ? join(process.resourcesPath, 'game')
    : join(__dirname, '../../web/dist-desktop');
  if (!existsSync(join(root, 'index.html')))
    throw new Error('Game assets are missing. Run pnpm desktop:build first.');
  protocol.handle('srgame', async (request) => {
    const file = assetPath(root, request.url);
    if (!file) return new Response('Not found', { status: 404 });
    try {
      const response = await net.fetch(pathToFileURL(file).href);
      const headers = new Headers(response.headers);
      headers.set(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob:",
          "font-src 'self'",
          "connect-src 'self' https://shatteredrifts.app wss://shatteredrifts.app",
          "media-src 'self' data: blob:",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'none'",
          "frame-src 'none'",
        ].join('; '),
      );
      return new Response(response.body, { status: response.status, headers });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
  const localPermission = (contents: Electron.WebContents | null, permission: string): boolean =>
    !!contents &&
    gameNavigation(contents.getURL()) &&
    ['fullscreen', 'clipboard-sanitized-write'].includes(permission);
  session.defaultSession.setPermissionRequestHandler((contents, permission, callback) =>
    callback(localPermission(contents, permission)),
  );
  session.defaultSession.setPermissionCheckHandler((contents, permission) =>
    localPermission(contents, permission),
  );
  session.defaultSession.on('will-download', (_event, item) => {
    // Existing run/deck exports use the normal Save dialog, never a renderer-chosen path.
    item.setSaveDialogOptions({ title: 'Export Shattered Rifts save' });
  });
}

export async function createGameWindow(show = true): Promise<BrowserWindow> {
  const stateFile = join(app.getPath('userData'), 'window-v1.json');
  let saved = windowState(null);
  try {
    saved = windowState(JSON.parse(readFileSync(stateFile, 'utf8')));
  } catch {
    /* first launch */
  }
  const win = new BrowserWindow({
    title: 'Shattered Rifts',
    width: saved.width,
    height: saved.height,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b0c10',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      backgroundThrottling: show,
      offscreen: !show,
      devTools: !app.isPackaged,
      preload: join(__dirname, 'preload.cjs'),
    },
  });
  protectWindowSaves(win);
  const openExternal = (url: string): void => {
    if (externalLink(url)) void shell.openExternal(url).catch(() => undefined);
  };
  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!gameNavigation(url)) {
      event.preventDefault();
      openExternal(url);
    }
  });
  win.webContents.on('will-redirect', (event, url) => {
    if (!gameNavigation(url)) event.preventDefault();
  });
  win.webContents.on('will-attach-webview', (event) => event.preventDefault());
  win.webContents.on('page-title-updated', (event) => event.preventDefault());
  win.webContents.on('render-process-gone', (_event, details) => {
    if (show && details.reason !== 'clean-exit')
      dialog.showErrorBox(
        'Shattered Rifts stopped',
        'Please reopen the game. Your last saved campaign step is kept.',
      );
  });
  win.on('close', () => {
    try {
      const bounds = win.getNormalBounds();
      writeFileSync(
        stateFile,
        JSON.stringify(
          windowState({
            ...bounds,
            maximized: win.isMaximized(),
            fullscreen: win.isFullScreen(),
          }),
        ),
      );
      session.defaultSession.flushStorageData();
    } catch {
      /* a read-only profile must not prevent closing */
    }
  });
  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      {
        label: 'Game',
        submenu: [
          {
            label: 'Open save folder',
            click: () => {
              void shell.openPath(app.getPath('userData'));
            },
          },
          { type: 'separator' },
          { role: 'quit' },
        ],
      },
      {
        label: 'View',
        submenu: [
          { role: 'togglefullscreen', accelerator: 'F11' },
          {
            label: 'Toggle fullscreen',
            accelerator: 'Alt+Enter',
            visible: false,
            click: () => win.setFullScreen(!win.isFullScreen()),
          },
          ...(!app.isPackaged ? [{ role: 'toggleDevTools' as const }] : []),
        ],
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Shattered Rifts website',
            click: () => openExternal('https://shatteredrifts.app/'),
          },
        ],
      },
    ]),
  );
  await win.loadURL(GAME_URL);
  if (saved.maximized) win.maximize();
  if (saved.fullscreen) win.setFullScreen(true);
  if (show) win.show();
  return win;
}
