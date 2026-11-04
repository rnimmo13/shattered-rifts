// Isolated Chromium presentation check; no player's saves, accounts, or battles are touched.
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const root = resolve('../..'),
  dist = join(root, 'apps/web/dist');
const work = join(root, '.wrangler/lore-smoke');
mkdirSync(work, { recursive: true });
const desktop = createRequire(join(root, 'apps/desktop/package.json'));
let mode = 'slow';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};
const server = createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost'),
    pathname = url.pathname;
  if (pathname === '/__qa/mode') {
    mode = url.searchParams.get('value');
    response.end('ok');
    return;
  }
  if (pathname.startsWith('/pvp/') || pathname.startsWith('/auth/')) {
    response.setHeader('content-type', 'application/json');
    response.end('{"signedIn":false,"available":false}');
    return;
  }
  if (pathname === '/art/manifest.json' && mode === 'missing') {
    response.writeHead(503);
    response.end();
    return;
  }
  const file = resolve(dist, `.${pathname === '/' ? '/index.html' : decodeURIComponent(pathname)}`);
  if (!file.startsWith(dist + sep) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404);
    response.end();
    return;
  }
  const send = () => {
    if (response.destroyed) return;
    response.setHeader('content-type', mime[extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(response);
  };
  const delay =
    mode === 'slow'
      ? pathname === '/art/manifest.json'
        ? 800
        : pathname.endsWith('/hero-knight.png')
          ? 10000
          : 0
      : 0;
  if (delay) setTimeout(send, delay);
  else send();
});
try {
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const script = join(work, 'browser.cjs');
  writeFileSync(
    script,
    `const {app,BrowserWindow,session}=require('electron'),assert=require('node:assert/strict'),fs=require('node:fs');
app.disableHardwareAcceleration();app.setPath('userData',${JSON.stringify(join(work, 'profile'))});
app.whenReady().then(async()=>{
 session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(d,c)=>c({cancel:!d.url.startsWith(${JSON.stringify(base + '/')})}));
 const win=new BrowserWindow({show:false,width:1440,height:1000,webPreferences:{sandbox:true,contextIsolation:true,offscreen:true,backgroundThrottling:false}});
 win.webContents.on('console-message',d=>{if(d.level==='error')console.error('Renderer:',d.message)});
 const js=async s=>{try{return await win.webContents.executeJavaScript(s)}catch(e){console.error('Expression:',s);throw e}},pause=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async s=>{for(let i=0;i<150;i++){try{if(await js(s))return}catch{}await pause(100)}throw Error('Timed out: '+s)};
 const snap=async name=>{await pause(400);fs.writeFileSync(${JSON.stringify(work)}+'/'+name+'.png',(await win.webContents.capturePage()).toPNG())};
 await session.defaultSession.clearCache();await win.loadURL(${JSON.stringify(base + '/')});
 await wait('!!document.querySelector(".startup")&&document.querySelector("#startup-progress").value>0');
 assert.equal(await js('document.querySelector("#startup-progress").value<document.querySelector("#startup-progress").max'),true);
 assert.equal(await js('document.querySelector("#startup-continue").hidden'),true);await snap('startup-desktop');
 win.setSize(390,844);await snap('startup-mobile');assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true);
 await wait('!document.querySelector("#startup-continue").hidden');await js('document.querySelector("#startup-continue").click()');
 await wait('!!document.querySelector(".home__story")');assert.equal(await js('!!document.querySelector(".startup")'),false);
 await js('fetch("/__qa/mode?value=fast").then(()=>location.hash="#/lore")');await wait('!!document.querySelector(".lore__hero")');
 assert.equal(await js('document.querySelectorAll(".lore__chapter").length'),6);assert.equal(await js('document.querySelectorAll(".lore__world").length'),8);
 assert.equal(await js('document.querySelectorAll(".lore__heroes img").length'),10);
 assert.equal(await js('[...document.querySelectorAll(".lore__heroes img")].every(i=>new URL(i.src).pathname.startsWith("/art/figures/hero-")&&new URL(i.src).pathname.endsWith(".png"))'),true);
 assert.equal(await js('document.querySelectorAll(".lore img[loading=lazy]").length'),34);
 await js('document.querySelectorAll(".lore img").forEach(i=>i.loading="eager")');
 await wait('[...document.querySelectorAll(".lore img")].every(i=>i.complete&&i.naturalWidth>0)');
 for(const [w,h,label] of [[1440,1000,'desktop'],[390,844,'mobile'],[320,740,'small-mobile'],[844,390,'landscape']]){
  win.setSize(w,h);await js('window.scrollTo(0,0)');await pause(200);assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true,label);await snap('lore-'+label);
  await js('document.querySelector(".lore__chapters button").click()');await pause(1000);await snap('story-'+label);
  await js('document.querySelector(".lore__art").click()');await wait('!!document.querySelector("dialog[open]")');await snap('viewer-'+label);
  const before=await js('document.querySelector("dialog h2").textContent');
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Right'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Right'});await pause(150);
  assert.notEqual(await js('document.querySelector("dialog h2").textContent'),before);
  win.webContents.sendInputEvent({type:'keyDown',keyCode:'Escape'});win.webContents.sendInputEvent({type:'keyUp',keyCode:'Escape'});await wait('!document.querySelector("dialog[open]")');
  await js('document.querySelector("#lore-worlds").scrollIntoView({behavior:"instant"})');await snap('worlds-'+label);
 }
 await js('localStorage.setItem("sr.graphics","low");location.reload()');await wait('!!document.querySelector(".lore__chapter")');
 assert.equal(await js('document.querySelectorAll(".lore__panel.is-observed").length'),0);
 await js('fetch("/__qa/mode?value=missing").then(()=>{location.hash="#/";location.reload()})');await wait('!!document.querySelector(".home__story")');
 assert.equal(await js('!!document.querySelector(".startup")'),false);
 console.log('PASS: real loading counts, slow-art continue, missing-manifest fallback, six chapters/eight worlds/ten default models, complete responsive art, desktop/mobile/landscape layout, keyboard viewer and low-motion mode.');
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
  console.log(`Screenshots: ${work}`);
} finally {
  server.closeAllConnections();
  server.close();
}
