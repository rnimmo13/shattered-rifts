// Real Electron smoke test against bundled assets. Never included in the packaged app.
import { app, session, type BrowserWindow } from 'electron';
import { strict as assert } from 'node:assert';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createGameWindow, initializeGame } from './app.js';
import { initializeServices } from './services.js';
import { SteamService } from './steam.js';
import { EventEmitter } from 'node:events';
import { DesktopUpdates } from './updates.js';

const profile = process.argv[2];
const stage = process.argv[3];
if (!profile || !['write', 'read'].includes(stage ?? ''))
  throw new Error('Expected profile and write/read stage');
mkdirSync(profile, { recursive: true });
app.setPath('userData', resolve(profile));

async function value(win: BrowserWindow, code: string): Promise<unknown> {
  const result: unknown = await win.webContents.executeJavaScript(code);
  return result;
}
async function waitFor(win: BrowserWindow, code: string): Promise<void> {
  for (let i = 0; i < 150; i++) {
    if (await value(win, code)) return;
    await delay(200);
  }
  console.error(await value(win, 'document.body.innerText.slice(0, 3000)'));
  throw new Error(`Renderer condition timed out: ${code}`);
}

void app
  .whenReady()
  .then(async () => {
    // No real requests, account changes or leaderboard submissions during this test.
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
      (_details, callback) => callback({ cancel: true }),
    );
    initializeGame();
    const updateEvents = new EventEmitter();
    let updateRequested = false;
    let expectedRun: unknown = null;
    const updates = new DesktopUpdates(
      app.getVersion(),
      stage === 'write'
        ? {
            on: (event, listener) => updateEvents.on(event, listener),
            checkForUpdates: () => Promise.resolve(null),
            quitAndInstall: (silent, runAfter) => {
              assert.equal(silent, true);
              assert.equal(runAfter, true);
              const saved = JSON.parse(
                readFileSync(resolve(profile, 'local-saves/standalone/save-v1.json'), 'utf8'),
              ) as { entries: Record<string, string> };
              assert.equal(saved.entries['sr.runs.v3'], expectedRun);
              updateRequested = true;
              app.quit();
            },
          }
        : undefined,
    );
    initializeServices(profile, new SteamService(null), updates);
    const win = await createGameWindow(false, stage !== 'write');
    win.webContents.on('console-message', (details) => {
      if (details.level === 'error') console.error('Renderer:', details.message);
    });
    await waitFor(win, "!!document.querySelector('.home__play')");
    assert.equal(await value(win, 'typeof window.require'), 'undefined');
    assert.equal(await value(win, 'typeof window.process'), 'undefined');
    assert.equal(await value(win, 'document.title'), 'Shattered Rifts');
    assert.equal(
      await value(win, 'window.shatteredRiftsDesktop.updateStatus().then(s => s.phase)'),
      stage === 'write' ? 'idle' : 'unsupported',
    );
    assert.equal(await value(win, "fetch('/art/manifest.json').then(r => r.ok)"), true);
    assert.equal(await value(win, "fetch('/missing-desktop-test-file').then(r => r.status)"), 404);
    // Music is served in byte ranges, so a track can restart from the beginning and loop.
    assert.match(
      String(
        await value(
          win,
          "fetch('/music/blackmoor-tides.mp3', { headers: { Range: 'bytes=0-9' } }).then(r => r.status + ' ' + r.headers.get('content-range'))",
        ),
      ),
      /^206 bytes 0-9\/\d+$/,
    );
    assert.equal(
      await value(
        win,
        `new Promise((done) => {
          const a = new Audio('/music/blackmoor-tides.mp3');
          a.addEventListener('error', () => done('error'));
          a.addEventListener('loadedmetadata', () => {
            a.addEventListener('seeked', () => done(a.seekable.length > 0 && a.currentTime > 29));
            a.currentTime = 30;
          });
          a.load();
        })`,
      ),
      true,
    );

    if (stage === 'write') {
      await value(win, "document.querySelector('.home__play').click()");
      await waitFor(
        win,
        "!!document.querySelector('.play-gate') && document.body.textContent.includes('Connect to the internet')",
      );
      assert.equal(await value(win, "!!document.querySelector('.setup__go')"), false);
      await value(win, "document.querySelector('.play-gate a').click()");
      await waitFor(win, "!!document.querySelector('.home__play')");
      await value(
        win,
        "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Settings')).click()",
      );
      await waitFor(
        win,
        "[...document.querySelectorAll('button')].some(b => b.textContent === 'Local offline play')",
      );
      await value(
        win,
        "[...document.querySelectorAll('button')].find(b => b.textContent === 'Local offline play').click()",
      );
      await waitFor(
        win,
        "location.hostname === 'local' && !!document.querySelector('.home__play')",
      );
      await value(win, "document.querySelector('.home__play').click()");
      await waitFor(win, "!!document.querySelector('.setup__go')");
      await value(win, "document.querySelector('.setup__go').click()");
      await waitFor(win, "JSON.parse(localStorage.getItem('sr.runs.v3') || '[]').length === 1");
      console.log('Created an offline campaign save');
      const raw = await value(win, "localStorage.getItem('sr.runs.v3')");
      assert.equal(typeof raw, 'string');
      expectedRun = raw;
      await value(
        win,
        "localStorage.setItem('sr.desktop-smoke', localStorage.getItem('sr.runs.v3'))",
      );
      await delay(500);
      writeFileSync(
        resolve(profile, 'campaign.png'),
        (await win.webContents.capturePage()).toPNG(),
      );
      // Exercise the standalone Pixi fight renderer with the same strict CSP and offline assets.
      await value(win, "location.hash = '#/fight'");
      await waitFor(win, "document.body.textContent.includes('Begin the fight')");
      await value(win, "document.querySelector('.setup__go').click()");
      await waitFor(win, "!!document.querySelector('canvas')");
      updateEvents.emit('update-downloaded', { version: '0.185.0' });
      await value(win, "window.dispatchEvent(new Event('focus'))");
      await delay(300);
      assert.equal(await value(win, "!!document.querySelector('.update-prompt')"), false);
      await delay(1500);
      writeFileSync(resolve(profile, 'fight.png'), (await win.webContents.capturePage()).toPNG());
      // Isolated fixture: render the new Ascendancy progress chip through the real campaign UI.
      await value(win, "location.hash = '#/'");
      await waitFor(win, "!!document.querySelector('.home__play')");
      await waitFor(win, "!!document.querySelector('.update-prompt')");
      assert.equal(await value(win, "!!document.querySelector('.buildbadge')"), false);
      writeFileSync(
        resolve(profile, 'update-prompt.png'),
        (await win.webContents.capturePage()).toPNG(),
      );
      await value(
        win,
        `(() => {
        const slots = JSON.parse(localStorage.getItem('sr.runs.v3'));
        const run = JSON.parse(slots[0].text);
        const node = run.map.nodes.find(n => n.enemyId && !n.ghost);
        run.character = 'necromancer'; run.ascendancy = 'necromancer:soulreaper';
        run.deck = ['gravesoul', 'gravesoul', 'strike', 'strike', 'defend', 'defend', 'raise-thrall', 'marked-for-the-grave', 'off-the-leash'];
        run.phase = 'duel'; run.at = node.id;
        run.context = { nodeId: node.id };
        slots[0].text = JSON.stringify(run);
        localStorage.setItem('sr.runs.v3', JSON.stringify(slots));
        location.hash = '#/run';
      })()`,
      );
      await waitFor(
        win,
        "!!document.querySelector('canvas') && [...document.querySelectorAll('.traitchip__progress')].some(n => n.textContent.includes('Harvest') && n.textContent.includes('Reap 4'))",
      );
      await delay(1000);
      writeFileSync(
        resolve(profile, 'ascendancy.png'),
        (await win.webContents.capturePage()).toPNG(),
      );
      await value(win, "location.hash = '#/'");
      await waitFor(win, "!!document.querySelector('.home__play')");
      await value(win, `localStorage.setItem('sr.runs.v3', ${JSON.stringify(raw)})`);
    } else {
      assert.equal(
        await value(
          win,
          `localStorage.getItem('sr.runs.v3') === ${JSON.stringify((JSON.parse(readFileSync(resolve(profile, 'local-saves/standalone/save-v1.json'), 'utf8')) as { entries: Record<string, string> }).entries['sr.runs.v3'])}`,
        ),
        true,
      );
      assert.equal(
        await value(win, "JSON.parse(localStorage.getItem('sr.runs.v3') || '[]').length"),
        1,
      );
      assert.equal(
        await value(
          win,
          "!!document.querySelector('.home__continue') || document.body.textContent.includes('Continue')",
        ),
        true,
      );
    }
    session.defaultSession.flushStorageData();
    // Test the real update save/IPC path with a fake installer; later stages use normal Quit.
    if (stage === 'write') updateEvents.emit('update-downloaded', { version: '0.185.0' });
    await value(
      win,
      "document.querySelector('button[aria-label=\"Settings\"]')?.click() || [...document.querySelectorAll('button')].find(b => b.textContent.includes('Settings'))?.click()",
    );
    await waitFor(
      win,
      "[...document.querySelectorAll('button')].some(b => b.textContent.includes('Quit to Desktop'))",
    );
    await delay(200);
    if (stage === 'write')
      await waitFor(win, "document.body.textContent.includes('Restart to update')");
    writeFileSync(resolve(profile, 'settings.png'), (await win.webContents.capturePage()).toPNG());
    const closed = new Promise<void>((resolve) => win.once('closed', () => resolve()));
    await value(
      win,
      stage === 'write'
        ? "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Restart to update')).click()"
        : "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Quit to Desktop')).click()",
    );
    await closed;
    assert.ok(
      readFileSync(resolve(profile, 'local-saves/standalone/save-v1.json'), 'utf8').includes(
        'sr.runs.v3',
      ),
    );
    if (stage === 'write') {
      assert.equal(updateRequested, true);
      const shared = JSON.parse(
        readFileSync(resolve(profile, 'saves/standalone/save-v1.json'), 'utf8'),
      ) as { entries: Record<string, string> };
      assert.equal(shared.entries['sr.runs.v3'], undefined);
    }
    console.log(`Desktop offline ${stage} smoke passed`);
    app.quit();
  })
  .catch((error: unknown) => {
    console.error(error);
    app.exit(1);
  });
