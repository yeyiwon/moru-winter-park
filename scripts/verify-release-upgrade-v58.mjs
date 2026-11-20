// Exercise a returning browser with a real old worker and open tabs, not a clean profile.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {releaseServiceWorker,stampReleaseHTML} from './production-assets.mjs';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs'));
const legacy=execFileSync('git',['show','6bc3c26d3f99a4ff7e8766b3fb4901d1f312782a:dist/sw.js'],{encoding:'utf8'});
const current=await fs.readFile('dist/sw.js','utf8'),theme=await fs.readFile('dist/ui-theme.js','utf8'),recovery=await fs.readFile('dist/refresh.html','utf8'),updater=await fs.readFile('dist/release-update.js','utf8');
const releases=[legacy,current,current].map((source,index)=>{
 const files={'/index.html':'<!doctype html><html><head><title>Release '+index+'</title><script src="/ui-theme.js"></script>'+ (index?'<script defer src="/release-update.js"></script>':'')+'</head><body data-version="'+index+'">'+(index?'<label>다크 모드<input id="ui-dark-mode" type="checkbox"></label><div id="pane-social"><div id="owner-panel">관리</div></div>':'이전 관리 화면')+'</body></html>','/app.js':'export const version='+index+';','/ui-theme.js':theme,'/release-update.js':updater};
 const worker=releaseServiceWorker(source,files);return{worker,files:{...files,'/index.html':stampReleaseHTML(files['/index.html'],worker)}};
});
let version=0;const server=http.createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname,release=releases[version];
 res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',path.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
 res.end(path==='/sw.js'?release.worker:path==='/refresh.html'?recovery:release.files[path==='/'||path==='/admin'?'/index.html':path]||'asset');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report={checks:[],errors:[]};
function check(name,ok){report.checks.push({name,ok});if(!ok)throw Error(name);console.log('PASS',name);}
async function oldBrowser(){
 version=0;const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.goto(origin);
 await page.evaluate(async()=>{localStorage.setItem('nickname','겨울친구');document.cookie='session=preserved; path=/';await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;});
 await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller);return{context,page};
}
try{
 const {context,page}=await oldBrowser(),peer=await context.newPage();await peer.goto(origin);
 version=1;
 await page.goto(origin+'/refresh.html');await page.waitForURL(origin+'/');await page.locator('#ui-dark-mode').waitFor();
 check('legacy returning visitor reaches the new dark-mode and inline management UI',await page.locator('#ui-dark-mode').count()===1&&await page.locator('#pane-social #owner-panel').count()===1);
 await page.locator('#ui-dark-mode').check();check('dark mode applies and saves',await page.evaluate(()=>document.documentElement.dataset.uiTheme==='dark'&&localStorage.getItem('winter-ui-theme')==='dark'));
 check('nickname and session survive the update',await page.evaluate(()=>localStorage.getItem('nickname')==='겨울친구'&&document.cookie.includes('session=preserved')));
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await peer.waitForFunction(()=>document.body.dataset.version==='1');check('other park tabs reload coherently instead of mixing old HTML and new modules',(await peer.evaluate(()=>fetch('/app.js').then(r=>r.text()))).includes('version=1'));
 version=2;await page.reload();await page.waitForFunction(()=>document.body.dataset.version==='2',null,{timeout:30000});
 check('later releases recover automatically on ordinary reload without closing other tabs',true);
 check('saved dark mode and session survive automatic recovery',await page.evaluate(()=>document.documentElement.dataset.uiTheme==='dark'&&localStorage.getItem('nickname')==='겨울친구'&&document.cookie.includes('session=preserved')));
 await context.close();
 const second=await oldBrowser();version=1;
 await second.page.goto(origin+'/refresh.html?return=/admin');await second.page.waitForURL(origin+'/admin');await second.page.locator('#ui-dark-mode').waitFor();
 check('recovery entry escapes an already-pinned old worker without clearing user data',await second.page.evaluate(()=>localStorage.getItem('nickname')==='겨울친구'&&document.cookie.includes('session=preserved')&&document.body.dataset.version==='1'));
 check('no browser exceptions',report.errors.length===0);await second.context.close();
}catch(e){report.states=[];for(const context of browser.contexts())for(const page of context.pages())report.states.push(await page.evaluate(async()=>({html:document.documentElement.outerHTML,version:document.body.dataset.version,app:await fetch('/app.js').then(r=>r.text()),controllerIsActive:navigator.serviceWorker.controller===(await navigator.serviceWorker.getRegistration())?.active,caches:await caches.keys()})).catch(()=>null));report.failure=e.stack;process.exitCode=1;console.error(e);}finally{await browser.close();await new Promise(resolve=>server.close(resolve));await fs.mkdir('qa/final-v58',{recursive:true});await fs.writeFile('qa/final-v58/release-upgrade.json',JSON.stringify(report,null,2));}
