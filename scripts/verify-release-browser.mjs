// Local production-asset cache QA. Never mutates a hosted room.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin='http://127.0.0.1:4192',browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={at:new Date().toISOString(),checks:[]};
function check(name,ok){report.checks.push({name,ok});if(!ok)throw Error(name);}
try{
 const context=await browser.newContext(),page=await context.newPage();
 await page.route('**/__cache_qa__',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Release cache QA</title>'}));
 await page.goto(origin+'/__cache_qa__');
 await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;});
 await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller);
 const keys=await page.evaluate(()=>caches.keys());check('one complete release cache activates',keys.length===1&&keys[0].startsWith('winterlight-'));
 await context.setOffline(true);
 const offline=await page.evaluate(async()=>{const entries=[];for(const path of ['/park.js?v=qa','/spa-transform.js','/customization.css','/admin/']){const r=await fetch(path);entries.push({path,ok:r.ok,text:await r.text()});}return entries;});
 check('versioned modules, lazy imports, CSS and admin shell work offline',offline.every(r=>r.ok));
 check('admin shell retains root asset base and correct release stamp',offline.at(-1).text.includes('<base href="/">')&&offline.at(-1).text.includes(keys[0]));
 check('private API responses are never substituted from the asset cache',await page.evaluate(async()=>{try{await fetch('/api/access');return false;}catch{return true;}}));
}finally{await browser.close();await fs.writeFile('qa/operations-v46/cache-browser.json',JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report));
