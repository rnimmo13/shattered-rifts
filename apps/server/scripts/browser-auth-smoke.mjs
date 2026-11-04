// Real Chromium form submission through the actual Worker and Durable Object. Google alone is simulated.
import { createRequire } from 'node:module';
import { realpathSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve('../..'),
  work = join(root, '.wrangler/auth-browser-smoke');
mkdirSync(work, { recursive: true });
const wrangler = createRequire(realpathSync(resolve('node_modules/wrangler/package.json')));
const desktop = createRequire(join(root, 'apps/desktop/package.json'));
await wrangler('esbuild').build({
  entryPoints: [resolve('src/worker.ts')],
  bundle: true,
  keepNames: true,
  format: 'esm',
  platform: 'browser',
  external: ['cloudflare:workers'],
  outfile: join(work, 'worker.js'),
  logLevel: 'silent',
});
const { Miniflare, convertV4MiniflareOptions } = wrangler('miniflare');
const payload = Buffer.from(
  JSON.stringify({ sub: 'browser-fixture-user', aud: 'browser-test' }),
).toString('base64url');
const mf = new Miniflare(
  convertV4MiniflareOptions({
    workers: [
      {
        modules: true,
        modulesRoot: work,
        scriptPath: join(work, 'worker.js'),
        compatibilityDate: '2026-10-01',
        durableObjects: Object.fromEntries(
          [
            ['MATCHMAKER', 'Matchmaker'],
            ['MATCH', 'MatchRoom'],
            ['VAULT', 'Vault'],
            ['BOARD', 'Leaderboard'],
            ['IDENTITY', 'Identity'],
          ].map(([key, className]) => [key, { className, useSQLite: true }]),
        ),
        bindings: {
          GOOGLE_CLIENT_ID: 'browser-test',
          GOOGLE_CLIENT_SECRET: 'test-secret',
          SESSION_SECRET: 'local-browser-secret',
        },
        outboundService: (request) =>
          new URL(request.url).host === 'oauth2.googleapis.com'
            ? Response.json({ id_token: `x.${payload}.y` })
            : new Response('External network blocked in fixture', { status: 503 }),
      },
    ],
  }),
);
const origins = [];
const server = createServer(async (req, res) => {
  try {
    const base = `http://127.0.0.1:${server.address().port}`,
      url = new URL(req.url, base);
    if (url.pathname.startsWith('/branding/') || url.pathname === '/art/lore/key-art-clean.webp') {
      const file = join(root, 'apps/web/public', url.pathname);
      if (!existsSync(file)) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader('content-type', file.endsWith('.png') ? 'image/png' : 'image/webp');
      res.end(readFileSync(file));
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (url.pathname === '/auth/desktop/confirm') origins.push(req.headers.origin ?? null);
    const response = await mf.dispatchFetch(url, {
      method: req.method,
      headers: req.headers,
      ...(req.method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
      redirect: 'manual',
    });
    res.statusCode = response.status;
    for (const [key, value] of response.headers)
      if (key.toLowerCase() !== 'set-cookie') res.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader('set-cookie', cookies);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end('Test server error');
  }
});
try {
  await mf.ready;
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`,
    cases = [];
  for (const scenario of ['approve', 'cancel', 'missing-cookie']) {
    const verifier = randomBytes(32).toString('hex'),
      challenge = createHash('sha256').update(verifier).digest('hex');
    const start = await fetch(`${base}/auth/desktop/start`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ challenge }),
    });
    assert.equal(start.status, 200);
    const { id, url } = await start.json();
    cases.push({ scenario, id, url, verifier });
  }
  const script = join(work, 'browser.cjs');
  writeFileSync(
    script,
    `const {app,BrowserWindow,session}=require('electron');const assert=require('node:assert/strict'),fs=require('node:fs');
app.disableHardwareAcceleration();app.setPath('userData',${JSON.stringify(join(work, 'profile'))});
app.whenReady().then(async()=>{
 session.defaultSession.webRequest.onBeforeRequest({urls:['https://accounts.google.com/*']},(r,cb)=>{const state=new URL(r.url).searchParams.get('state');cb({redirectURL:${JSON.stringify(base)}+'/auth/google/callback?code=fake-provider-code&state='+state})});
 const win=new BrowserWindow({show:false,width:1000,height:850,webPreferences:{sandbox:true,contextIsolation:true,offscreen:true,backgroundThrottling:false}});
 const js=s=>win.webContents.executeJavaScript(s),pause=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async q=>{for(let i=0;i<150;i++){try{if(await js(q))return}catch{}await pause(100)}throw Error('Timeout '+q)};
 for(const c of ${JSON.stringify(cases)}){
  await win.loadURL(c.url);await wait('!!document.querySelector("form button")');await pause(350);
  if(c.scenario==='approve'){
   assert.equal(await js('document.querySelector("main").getBoundingClientRect().width<=620&&parseFloat(getComputedStyle(document.querySelector("main")).paddingTop)>=24'),true);
   fs.writeFileSync(${JSON.stringify(join(work, 'approval-desktop.png'))},(await win.webContents.capturePage()).toPNG());
   win.setSize(390,844);await pause(300);assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true);
   fs.writeFileSync(${JSON.stringify(join(work, 'approval-mobile.png'))},(await win.webContents.capturePage()).toPNG());
  }
  if(c.scenario==='missing-cookie')await session.defaultSession.cookies.remove(${JSON.stringify(base + '/auth/desktop')},'sr_desktop_confirm');
  await js(c.scenario==='cancel'?'document.querySelector("button[name=cancel]").click()':'document.querySelector("form button").click()');
  await wait('!document.querySelector("form")&&!!document.querySelector("main")');
  const text=await js('document.body.textContent');
  assert(text.includes(c.scenario==='approve'?'Sign-in approved':c.scenario==='cancel'?'Sign-in cancelled':'Sign-in could not finish'));
  assert.equal(await js('document.body.textContent.trim().startsWith("{")'),false);
  fs.writeFileSync(${JSON.stringify(work)}+'/'+c.scenario+'.png',(await win.webContents.capturePage()).toPNG());
 }
 win.destroy();app.quit();
}).catch(e=>{console.error(e);app.exit(1)});setTimeout(()=>app.exit(1),90000).unref();`,
  );
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(desktop('electron'), [script], { env, windowsHide: true, stdio: 'inherit' });
  const code = await new Promise((done, reject) => {
    child.on('close', done);
    child.on('error', reject);
  });
  assert.equal(code, 0);
  assert.deepEqual(origins, [base, base, base]);
  for (const c of cases) {
    const exchange = await fetch(`${base}/auth/desktop/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: c.id, verifier: c.verifier }),
    });
    assert.equal(
      exchange.status,
      c.scenario === 'approve' ? 200 : c.scenario === 'cancel' ? 410 : 202,
    );
    if (c.scenario === 'approve') assert.match((await exchange.json()).token, /^d1\./);
  }
  const rejected = await fetch(`${base}/auth/desktop/confirm`, {
    method: 'POST',
    headers: { origin: 'null', 'content-type': 'application/x-www-form-urlencoded' },
    body: 'id=invalid',
  });
  assert.equal(rejected.status, 403);
  assert(rejected.headers.get('content-type').includes('text/html'));
  console.log(
    'PASS: real-browser Google approval, same-origin form headers, native session exchange, cancellation, styled cookie/origin failures, desktop/mobile layout. Google provider simulated; no real account used.',
  );
  console.log(`Screenshots: ${work}`);
} finally {
  server.close();
  await mf.dispose();
}
