// Isolated real-Electron account switching test. Excluded from packaged builds.
import { app, session, safeStorage } from 'electron';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { createGameWindow, initializeGame } from './app.js';
import { initializeServices } from './services.js';
import { SteamService } from './steam.js';
import { DesktopUpdates } from './updates.js';

const profile = process.argv[2]!,
  stage = process.argv[3]!;
app.setPath('userData', profile);
app.setName('Shattered Rifts account smoke');
let account = 'a'.repeat(64),
  challenge = '';
const authFetch: typeof fetch = async (input, init) => {
  await Promise.resolve();
  const path = new URL(
    typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
  ).pathname;
  const data =
    typeof init?.body === 'string' ? (JSON.parse(init.body) as Record<string, string>) : {};
  if (path === '/auth/desktop/start') {
    challenge = data.challenge!;
    return Response.json({
      id: 'e'.repeat(64),
      url: `https://shatteredrifts.app/auth/desktop/browser?id=${'e'.repeat(64)}`,
    });
  }
  if (path === '/auth/desktop/exchange') {
    const verifier = data.verifier!;
    assert.equal(createHash('sha256').update(verifier).digest('hex'), challenge);
    return Response.json({
      token: `d1.${account}.${'f'.repeat(64)}`,
      account,
      expires: Date.now() + 86400000,
    });
  }
  if (path === '/auth/me') {
    const token = new Headers(init?.headers).get('authorization') ?? '';
    const identity = /^Bearer d1\.([a-f0-9]{64})\./.exec(token)?.[1];
    return Response.json({ signedIn: !!identity, account: identity });
  }
  return Response.json({ ok: true });
};
app.on('window-all-closed', () => app.quit());
void app
  .whenReady()
  .then(async () => {
    assert(safeStorage.isEncryptionAvailable(), 'This smoke needs Windows credential encryption.');
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] },
      (_r, callback) => callback({ cancel: true }),
    );
    initializeGame();
    initializeServices(profile, new SteamService(null), new DesktopUpdates('test'), {
      open: (url) => {
        assert(url.startsWith('https://shatteredrifts.app/auth/desktop/browser?id='));
        return Promise.resolve();
      },
      fetcher: authFetch,
    });
    const win = await createGameWindow(false);
    const js = async (code: string): Promise<unknown> => {
      try {
        return await win.webContents.executeJavaScript(code);
      } catch (error) {
        console.error('Failed account smoke expression:', code);
        throw error;
      }
    };
    const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));
    const wait = async (expression: string): Promise<void> => {
      for (let i = 0; i < 200; i++) {
        try {
          if (await js(expression)) return;
        } catch {
          /* frame navigating */
        }
        await pause(100);
      }
      throw new Error(`Timed out: ${expression}`);
    };
    const status = (provider: string): string =>
      `window.shatteredRiftsDesktop.status().then(s=>s.provider===${JSON.stringify(provider)})`;
    const settings = async (): Promise<void> => {
      await wait(
        "[...document.querySelectorAll('button')].some(b=>b.textContent.includes('Settings'))",
      );
      await js(
        "[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Settings')).click()",
      );
      await wait("!!document.querySelector('.settings__panel')");
    };
    const saveHero = async (hero: string): Promise<void> => {
      await js(
        `localStorage.setItem('sr.hero',${JSON.stringify(hero)});window.shatteredRiftsDesktop.save(Object.fromEntries(Object.entries(localStorage)))`,
      );
    };
    await wait("!!document.querySelector('.home__play')");
    if (stage === 'write') {
      await saveHero('engineer');
      await settings();
      await js(
        "[...document.querySelectorAll('.settings button')].find(b=>b.textContent==='Sign in with Google').click()",
      );
      await wait("!!document.querySelector('.desktop-login')");
      await wait(status('google'));
      await wait(
        "!!document.querySelector('.home__play') && !document.querySelector('.desktop-login')",
      );
      assert.notEqual(await js("localStorage.getItem('sr.hero')"), 'engineer');
      await saveHero('hunter');
      // Mount a real sandbox fight, without playing it or running a balance simulation.
      await js(
        `(()=>{const original=window.fetch.bind(window);window.fetch=(input,init)=>String(input).startsWith('https://shatteredrifts.app/pvp/')?Promise.resolve(new Response(JSON.stringify({ok:true,token:'test-play',now:Date.now(),expires:Date.now()+45000,revision:0,runs:[],replays:{},decks:[]}))):original(input,init)})();location.hash='#/fight'`,
      );
      await wait("!!document.querySelector('.setup__go')");
      await js("document.querySelector('.setup__go').click()");
      await wait("!!document.querySelector('canvas')");
      const blocked = await js(
        "window.shatteredRiftsDesktop.googleLogout().then(()=>false,e=>e.message.includes('battle'))",
      );
      assert.equal(blocked, true);
      assert.equal(await js(status('google')), true);
      await js("location.hash='#/'");
      await wait("!!document.querySelector('.home__play')");
      await settings();
      await js(
        "[...document.querySelectorAll('.settings button')].find(b=>b.textContent==='Sign out').click()",
      );
      await wait('window.shatteredRiftsDesktop.status().then(s=>s.provider===null)');
      await wait("localStorage.getItem('sr.hero')==='engineer'");
      assert.equal(existsSync(join(profile, 'auth/google-v1.dat')), false);
      assert.equal(
        (
          JSON.parse(
            readFileSync(
              join(profile, `account-saves/google-${'a'.repeat(64)}/save-v1.json`),
              'utf8',
            ),
          ) as { entries: Record<string, string> }
        ).entries['sr.hero'],
        'hunter',
      );
      account = 'b'.repeat(64);
      await settings();
      await js(
        "[...document.querySelectorAll('.settings button')].find(b=>b.textContent==='Sign in with Google').click()",
      );
      await wait(status('google'));
      await wait(
        "!!document.querySelector('.home__play') && !document.querySelector('.desktop-login')",
      );
      assert.notEqual(await js("localStorage.getItem('sr.hero')"), 'hunter');
      await saveHero('spellblade');
      const encrypted = readFileSync(join(profile, 'auth/google-v1.dat'));
      assert.equal(encrypted.includes(Buffer.from('d1.')), false);
    } else {
      await wait(status('google'));
      assert.equal(await js("localStorage.getItem('sr.hero')"), 'spellblade');
    }
    await settings();
    await pause(500);
    writeFileSync(
      join(profile, `${stage}-account.png`),
      (await win.webContents.capturePage()).toPNG(),
    );
    await js(
      "[...document.querySelectorAll('.settings button')].find(b=>b.textContent==='Quit to Desktop').click()",
    );
    console.log(
      `PASS: native account ${stage}: encrypted login, account save isolation, battle guard and restoration.`,
    );
  })
  .catch((error) => {
    console.error(error);
    app.exit(1);
  });
setTimeout(() => app.exit(1), 120000).unref();
