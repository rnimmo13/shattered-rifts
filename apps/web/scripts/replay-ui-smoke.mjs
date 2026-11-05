// Actual Chromium download/import and responsive replay screens. Synthetic games; no live services.
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve('../..'),
  dist = join(root, 'apps/web/dist'),
  work = join(root, '.wrangler/replay-ui-smoke');
mkdirSync(work, { recursive: true });
const desktop = createRequire(join(root, 'apps/desktop/package.json'));
const deck = [
  'strike',
  'strike',
  'strike',
  'strike',
  'defend',
  'defend',
  'sundering-blow',
  'brace-and-press',
  'set-your-shield',
  'heavy-swing',
];
const side = {
  mana: 3,
  maxMana: 3,
  reserves: 0,
  stars: 0,
  nextMana: 0,
  handCount: 0,
  drawCount: 10,
  discardCount: 0,
  consumedCount: 0,
  hand: [],
  units: [],
};
const replay = {
  id: 'Abcdef1234',
  at: Date.now(),
  rules: 83,
  seed: 'synthetic',
  a: { name: 'Fixture A', hero: 'knight', deck, boons: [], tier: 4 },
  b: { name: 'Fixture B', hero: 'knight', deck, boons: [], tier: 4 },
  log: [],
  winner: 'a',
  reason: 'resign',
  evidence: {
    schema: 1,
    totalActions: 0,
    truncated: false,
    frames: [{ seq: 0, turn: 1, active: 'a', events: [], a: side, b: side }],
  },
};
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/pvp/') || url.pathname.startsWith('/auth/')) {
    res.setHeader('content-type', 'application/json');
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', '*');
    if (req.method === 'OPTIONS') {
      res.end();
      return;
    }
    res.end(
      JSON.stringify(
        url.pathname.startsWith('/pvp/replay/')
          ? { ok: true, replay }
          : url.pathname === '/pvp/board/replays'
            ? { ok: true, replays: [{ ...replay, viewerSeat: 'b' }] }
            : url.pathname === '/pvp/reports'
              ? { ok: true, id: 'a'.repeat(32) }
              : { signedIn: false, available: false },
      ),
    );
    return;
  }
  const file = resolve(
    dist,
    '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)),
  );
  if (!file.startsWith(dist + sep) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('content-type', mime[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});
try {
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = 'http://127.0.0.1:' + server.address().port;
  const script = join(work, 'browser.cjs');
  writeFileSync(
    script,
    `
const {app,BrowserWindow,session}=require('electron'),assert=require('node:assert/strict'),fs=require('node:fs');
app.disableHardwareAcceleration();app.setPath('userData',${JSON.stringify(join(work, 'profile'))});
app.whenReady().then(async()=>{
const base=${JSON.stringify(base)};
session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(d,c)=>{
if(d.url.startsWith('https://shatteredrifts.app/'))return c({redirectURL:base+new URL(d.url).pathname+new URL(d.url).search});
c({cancel:!d.url.startsWith(base+'/')});});
const win=new BrowserWindow({show:false,width:1360,height:960,webPreferences:{sandbox:true,contextIsolation:true,offscreen:true,backgroundThrottling:false}});
const js=s=>win.webContents.executeJavaScript(s),pause=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async s=>{for(let i=0;i<200;i++){if(await js(s))return;await pause(100)}throw Error('Timed out: '+s)};
const click=text=>js('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==='+JSON.stringify(text)+').click()');
await win.loadURL(base+'/#/replay/Abcdef1234');await wait('!!document.querySelector("textarea")');
for(const [w,h,n] of [[1360,960,'desktop'],[390,844,'mobile'],[320,740,'small-mobile']]){
win.setSize(w,h);await pause(300);assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true,n);
assert.equal(await js('document.querySelector(".game-version").textContent.trim()'),'v0.205.0');
assert.equal(await js('getComputedStyle(document.querySelector(".game-version")).pointerEvents'),'none');
assert.equal(await js('(()=>{const r=document.querySelector(".game-version").getBoundingClientRect();return r.right<=innerWidth&&r.bottom<=innerHeight&&r.left>innerWidth-130&&r.top>innerHeight-40})()'),true,n+' version position');
fs.writeFileSync(${JSON.stringify(work)}+'/'+n+'.png',(await win.webContents.capturePage()).toPNG());}
await js('Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(document.querySelector("textarea"),"I wanted to build a defensive engine.");document.querySelector("textarea").dispatchEvent(new Event("input",{bubbles:true}))');
const saved=${JSON.stringify(join(work, 'download.json'))};
const downloaded=new Promise((done,reject)=>session.defaultSession.once('will-download',(_e,item)=>{item.setSavePath(saved);item.once('done',(_e,state)=>state==='completed'?done():reject(Error(state)))}));
await click('Save match record');await downloaded;
const archive=JSON.parse(fs.readFileSync(saved,'utf8'));assert.equal(archive.note,'I wanted to build a defensive engine.');assert.equal(archive.replay.evidence.frames.length,1);assert.equal(archive.contentRules,83);
await click('Watch replay');await wait('!!document.querySelector(".fight")');
await wait('!!document.querySelector(".fight__watch")');await pause(300);
assert.equal(await js('document.querySelector(".game-version").textContent.trim()'),'v0.205.0');
fs.writeFileSync(${JSON.stringify(work)}+'/battle-version-mobile.png',(await win.webContents.capturePage()).toPNG());
await win.loadURL(base+'/#/replay');await wait('!!document.querySelector("input[type=file]")');
win.webContents.debugger.attach('1.3');const doc=await win.webContents.debugger.sendCommand('DOM.getDocument');const input=await win.webContents.debugger.sendCommand('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'});
await win.webContents.debugger.sendCommand('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[saved]});
await wait('!!document.querySelector("textarea")');assert.equal(await js('document.querySelector("textarea").value'),archive.note);
win.webContents.debugger.detach();
await win.loadURL(base+'/#/history');await wait('[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="Arena matches")');await click('Arena matches');
await wait('document.querySelectorAll(".matchlist li").length===1');
assert.equal(await js('document.querySelector(".matchlist li").textContent.includes("Lost")'),true);
assert.equal(await js('document.querySelector(".matchlist li").textContent.includes("Fixture A")'),true);
await win.loadURL(base+'/#/');await wait('!!document.querySelector("button[aria-label=Settings]")');
await js('document.querySelector("button[aria-label=Settings]").click()');
await wait('[...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="Start recording")');
await click('Start recording');await pause(400);await click('Stop');
await wait('!!document.querySelector(".settings__report textarea")');
assert.equal(await js('!!document.querySelector(".settings__reportShare input")'),false);
await click('Share report');await wait('!!document.querySelector(".settings__reportShare input")');
assert.equal(await js('document.querySelector(".settings__reportShare input").value'), 'https://shatteredrifts.app/pvp/reports/'+ 'a'.repeat(32));
assert.equal(await js('document.querySelector(".settings__report textarea").value.startsWith("Shattered Rifts performance report (")'),true);
await js('document.querySelector(".settings__reportShare").scrollIntoView({block:"center"})');await pause(200);
assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true);
fs.writeFileSync(${JSON.stringify(work)}+'/performance-share-mobile.png',(await win.webContents.capturePage()).toPNG());
await click('Close');await js('document.querySelector("button[aria-label=Settings]").click()');
await wait('!!document.querySelector(".settings__reportShare input")');
assert.equal(await js('document.querySelector(".settings__reportShare input").value'), 'https://shatteredrifts.app/pvp/reports/'+ 'a'.repeat(32));
console.log('PASS: Chromium replays, responsive layouts, download/import, history seat and performance Start/Stop/Share/link retention. Synthetic fixtures only.');win.destroy();app.quit();
}).catch(e=>{console.error(e);app.exit(1)});setTimeout(()=>app.exit(1),90000).unref();`,
  );
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(desktop('electron'), [script], { env, windowsHide: true, stdio: 'inherit' });
  assert.equal(
    await new Promise((done, reject) => {
      child.on('close', done);
      child.on('error', reject);
    }),
    0,
  );
} finally {
  server.closeAllConnections();
  server.close();
}
