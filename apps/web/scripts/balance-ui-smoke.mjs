import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root = resolve('../..'),
  dist = join(root, 'apps/web/dist'),
  work = join(root, '.wrangler/balance-ui-smoke');
mkdirSync(work, { recursive: true });
const desktop = createRequire(join(root, 'apps/desktop/package.json'));
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
    res.end('{"signedIn":false,"available":false}');
    return;
  }
  const report = url.pathname === '/report';
  const file = report
    ? join(root, '.wrangler/arena-report-preview/report.html')
    : resolve(
        dist,
        '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)),
      );
  if ((!report && !file.startsWith(dist + sep)) || !existsSync(file) || !statSync(file).isFile()) {
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
session.defaultSession.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']},(d,c)=>c({cancel:!d.url.startsWith(${JSON.stringify(base + '/')})}));
const win=new BrowserWindow({show:false,width:1360,height:960,webPreferences:{sandbox:true,contextIsolation:true,offscreen:true,backgroundThrottling:false}});
const js=s=>win.webContents.executeJavaScript(s),pause=ms=>new Promise(r=>setTimeout(r,ms));
const wait=async s=>{for(let i=0;i<200;i++){if(await js(s))return;await pause(100)}throw Error('Timed out: '+s)};
const snap=async n=>{await pause(300);fs.writeFileSync(${JSON.stringify(work)}+'/'+n+'.png',(await win.webContents.capturePage()).toPNG())};
await win.loadURL(${JSON.stringify(base + '/#/patch-notes')});await wait('!!document.querySelector("#patch-title")');
assert.equal(await js('document.querySelector("#patch-title").textContent'),'Twelve tiers, the Warden gauntlet and a true ending');
for(const [w,h,name] of [[1360,960,'desktop'],[390,844,'mobile'],[320,740,'small-mobile']]){
win.setSize(w,h);await pause(150);assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true,name);await snap('patch-current-'+name);
await js('[...document.querySelectorAll(".patch__ver")].find(b=>b.textContent.includes("0.199.0")).click()');
assert.equal(await js('document.querySelectorAll(".patch__entry").length'),21);
assert.equal(await js('document.querySelectorAll(".patch__value--buff").length>0&&document.querySelectorAll(".patch__value--nerf").length>0'),true);
await js('document.querySelectorAll(".patch__art").forEach(i=>i.loading="eager")');
await wait('[...document.querySelectorAll(".patch__art")].every(i=>i.complete&&i.naturalWidth>0)');
assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true,name+' detail');await snap('patch-cards-'+name);
await js('document.querySelector(".patch__ver").click()');}
await win.loadURL(${JSON.stringify(base + '/report')});await wait('document.querySelectorAll("details").length===2');
await js('document.querySelector("details").open=true');assert.equal(await js('document.querySelectorAll("details li").length'),4);await snap('deck-report-mobile');
await js('document.querySelector("#q").value="golemancer";document.querySelector("#q").dispatchEvent(new Event("input"))');assert.equal(await js('document.querySelectorAll("details").length'),1);
assert.equal(await js('document.documentElement.scrollWidth<=innerWidth'),true);
console.log('PASS: desktop/mobile/small-mobile patch notes, all card images, buff/nerf rows, exact-deck report and filtering. Report fixture is synthetic.');win.destroy();app.quit();
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
