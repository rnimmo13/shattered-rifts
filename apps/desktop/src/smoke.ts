// Real Electron smoke test against bundled assets. Never included in the packaged app.
import { app, session, type BrowserWindow } from 'electron';
import { strict as assert } from 'node:assert';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createGameWindow, initializeGame } from './app.js';

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
    const win = await createGameWindow(false);
    win.webContents.on('console-message', (details) => {
      if (details.level === 'error') console.error('Renderer:', details.message);
    });
    await waitFor(win, "!!document.querySelector('.home__play')");
    assert.equal(await value(win, 'typeof window.require'), 'undefined');
    assert.equal(await value(win, 'typeof window.process'), 'undefined');
    assert.equal(await value(win, 'document.title'), 'Shattered Rifts');
    assert.equal(await value(win, "fetch('/art/manifest.json').then(r => r.ok)"), true);
    assert.equal(await value(win, "fetch('/missing-desktop-test-file').then(r => r.status)"), 404);

    if (stage === 'write') {
      await value(win, "document.querySelector('.home__play').click()");
      await waitFor(
        win,
        "[...document.querySelectorAll('button')].some(b => b.textContent.includes('Play offline without'))",
      );
      await value(
        win,
        "[...document.querySelectorAll('button')].find(b => b.textContent.includes('Play offline without')).click()",
      );
      await waitFor(win, "!!document.querySelector('.setup__go')");
      await value(win, "document.querySelector('.setup__go').click()");
      await waitFor(win, "JSON.parse(localStorage.getItem('sr.runs.v3') || '[]').length === 1");
      console.log('Created an offline campaign save');
      const raw = await value(win, "localStorage.getItem('sr.runs.v3')");
      assert.equal(typeof raw, 'string');
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
      await delay(1500);
      writeFileSync(resolve(profile, 'fight.png'), (await win.webContents.capturePage()).toPNG());
    } else {
      assert.equal(
        await value(
          win,
          "localStorage.getItem('sr.runs.v3') === localStorage.getItem('sr.desktop-smoke')",
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
    win.close();
    console.log(`Desktop offline ${stage} smoke passed`);
    app.quit();
  })
  .catch((error: unknown) => {
    console.error(error);
    app.exit(1);
  });
