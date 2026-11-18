// Read-only production access checks. No owner identity or invitation is fabricated.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';
const origin='https://moru-winter-park.vercel.app',backend='https://bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site',out='qa/browser-v39/production';
await fs.mkdir(out,{recursive:true});
const report={at:new Date().toISOString(),origin,physicalMobile:false,ownerOAuth:'UNKNOWN',validProductionInvitation:'UNKNOWN',checks:[],errors:[],serverErrors:[]};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 for(const target of [backend,origin]){
  const c=await browser.newContext();try{
   assert.equal((await c.request.get(target+'/api/health')).status(),200);
   const access=await(await c.request.get(target+'/api/access')).json();assert.equal(access.inviteRequired,true);assert.equal(access.admin,false);assert.equal(access.session,null);assert.equal(access.worldId,'winter-plaza');
   for(const [route,data,status]of [['join',{name:'접속검증'},403],['invite-check',{token:'0'.repeat(64)},403],['invite',{},403]])assert.equal((await c.request.post(target+'/api/'+route,{headers:{Origin:target},data})).status(),status);
   assert.equal((await c.request.get(target+'/api/tree')).status(),401);
   report.checks.push({target,check:'health, single world, no public entry, invalid token, guest admin rejection, protected wishes'});
  }finally{await c.close();}
 }
 for(const mobile of [false,true]){
  const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile});try{
   const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=500)report.serverErrors.push({path:new URL(r.url()).pathname,status:r.status()});});
   await p.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});await p.waitForFunction(()=>document.querySelector('#studio').open&&document.querySelector('#world-loading').hidden,null,{timeout:120000});
   assert.ok(await p.locator('body').evaluate(e=>e.classList.contains('invite-gate')));assert.equal(await p.locator('#join-form').isVisible(),false);assert.ok(await p.locator('#owner-signin').isVisible());assert.equal(await p.evaluate(()=>labSocialJoined),false);
   const rect=await p.locator('#studio').evaluate(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,within:r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight};});assert.ok(rect.within);
   assert.equal(await p.locator('#music-select option').first().getAttribute('value'),'ethereal-winter-ballet-02');
   await p.screenshot({path:out+`/gate-${mobile?'mobile':'pc'}.jpg`,quality:85});
   await p.goto(origin+'/#invite='+'0'.repeat(64));await p.waitForFunction(()=>!location.hash&&document.querySelector('#invite-description').textContent.includes('만료'));
   assert.equal(await p.locator('#join-form').isVisible(),false);report.checks.push({mobile,check:'gate, owner link, viewport, same-tab invalid invitation, Ethereal first',rect});
  }finally{await c.close();}
 }
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.serverErrors,[]);
}catch(e){report.failure=e.message;process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
