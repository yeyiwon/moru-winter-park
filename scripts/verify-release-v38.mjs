// Public, temporary QA guests only. No authentication bypass or production test hooks.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';
const origin=process.env.QA_URL||'http://127.0.0.1:4185',out=process.env.QA_OUTPUT||'qa/browser-v38/release-local';
if(!['127.0.0.1','moru-winter-park.vercel.app','bits-yeiwon-knowledge.expert-bass-1722.chatgpt.site'].includes(new URL(origin).hostname))throw Error('Unexpected release target');
await fs.mkdir(out,{recursive:true});
const report={origin,at:new Date().toISOString(),physicalMobile:false,checks:[],errors:[],requestsFailed:[]};
const check=value=>{report.checks.push(value);console.log(JSON.stringify(value));};
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{for(const mobile of [false,true]){
 const c=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile}),peer=await browser.newContext(),p=await c.newPage();p.setDefaultTimeout(30000);
 const api=(ctx,path,data)=>ctx.request.post(origin+'/api/'+path,{headers:{Origin:origin},data});
 try{
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/WebGL|Shader/.test(m.text()))report.errors.push(m.text());});p.on('response',r=>{if(r.status()>=500)report.requestsFailed.push({path:new URL(r.url()).pathname,status:r.status()});});
  assert.equal((await c.request.get(origin+'/api/health')).status(),200);
  assert.equal((await api(c,'join',{room:'winter-plaza',name:mobile?'검증모바일':'검증PC'})).status(),200);
  const started=Date.now();await p.goto(origin,{waitUntil:'domcontentloaded',timeout:120000});await p.waitForFunction(()=>window.labSocialJoined&&document.querySelector('#world-loading')?.hidden,null,{timeout:120000});
  check({mobile,check:'world ready',ms:Date.now()-started});
  const me=await(await c.request.get(origin+'/api/access')).json();assert.equal(me.admin,false);
  assert.equal((await api(c,'invite',{password:'release-test-unused'})).status(),403);
  await p.evaluate(()=>openWinterSettings('fluff'));await p.locator('[data-category=tail]').click();await p.locator('[data-accessory=tail-cat]').click();await p.locator('#wardrobe-save').click();await p.waitForFunction(()=>document.querySelector('#wardrobe-status').textContent==='저장했어요.');
  assert.ok((await(await c.request.get(origin+'/api/access')).json()).session.accessory.includes('tail-cat'));await p.locator('#close-studio').click();
  await api(peer,'join',{room:'winter-plaza',name:'동기화검증'});
  const pose=await p.evaluate(()=>({...labPlayerState}));
  let people;for(let i=0;i<5;i++){people=(await(await api(peer,'presence',{...pose,color:'#f4eee5',accessory:'none'})).json()).people;if(people?.find(x=>x.id===me.session.id)?.accessory.includes('tail-cat'))break;await p.waitForTimeout(700);}
  assert.ok(people.find(x=>x.id===me.session.id)?.accessory.includes('tail-cat'));
  await p.locator('#chat-toggle').click();await p.locator('#chat-input').fill('배포 동작 확인 중');const sent=p.waitForResponse(r=>r.url().endsWith('/api/chat')&&r.request().method()==='POST');await p.locator('#chat-input').press('Enter');assert.equal((await sent).status(),200);
  const received=await(await api(peer,'presence',{...pose,color:'#f4eee5',accessory:'none'})).json();assert.ok(received.people.some(x=>x.id===me.session.id&&x.chat==='배포 동작 확인 중'));await p.keyboard.press('Escape');
  check({mobile,check:'guest authorization, appearance save, second guest sync and chat'});
  report.stage='map';await p.evaluate(()=>openWinterSettings('map'));const marker=p.locator('.map-region[data-region=tree]');if(mobile){await marker.tap();assert.equal(await marker.getAttribute('aria-pressed'),'true');await marker.tap();}else await marker.click();await p.waitForFunction(()=>!document.querySelector('#studio').open);assert.equal(await p.evaluate(()=>labPlayerState.mode),'');
  await p.screenshot({path:out+`/tree-${mobile?'mobile':'pc'}.jpg`,quality:85});
  await p.evaluate(()=>openWishComposer());await p.locator('#wish-panel').waitFor({state:'visible'});assert.ok(await p.locator('#wish-panel').evaluate(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1;}));await p.evaluate(()=>document.querySelector('#wish-panel').close());
  for(const id of ['ferris','carousel','onsen']){report.stage=id;await p.evaluate(id=>travelToPlace(id),id);
   if(id==='ferris'){await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await api(peer,'presence',{...await p.evaluate(()=>({...labPlayerState})),color:'#f4eee5',accessory:'none'});}await p.locator('#place-actions button').first().click();await p.waitForFunction(mode=>labPlayerState.mode===mode,id==='onsen'?'bath':id);if(id==='ferris'&&new URL(origin).hostname==='127.0.0.1'){const a=await p.evaluate(()=>labRideReservation),b=await(await api(peer,'ride',{kind:'ferris'})).json();assert.equal(a.cabin,b.reservation.cabin);assert.notEqual(a.seat,b.reservation.seat);await peer.request.delete(origin+'/api/ride',{headers:{Origin:origin}});assert.equal(await p.evaluate(()=>labPlayerState.mode),'ferris');check({mobile,check:'two ferris seats and independent dismount'});}
   await p.waitForTimeout(500);await p.locator('#stop-ride').click();await p.waitForFunction(()=>labPlayerState.mode==='');assert.equal(await p.locator('#ride-hud').isVisible(),false);}
  for(const [place,interior]of [['sauna','ryokan'],['quiz','museum']]){report.stage=interior;await p.evaluate(({place,interior})=>{travelToPlace(place,false);return enterInterior(interior);},{place,interior});await p.waitForFunction(id=>labInterior===id,interior);await p.waitForFunction(()=>document.querySelector('#room-transition').style.opacity==='0'||!document.querySelector('#room-transition').classList.contains('active'));await p.waitForTimeout(500);await p.evaluate(()=>exitInterior());await p.waitForFunction(()=>!labInterior);}
  check({mobile,check:'map travel, ferris, carousel, bath, ryokan and museum enter/exit'});
  report.stage='music';await p.evaluate(()=>openWinterSettings('audio'));assert.equal(await p.locator('#music-select option').first().getAttribute('value'),'ethereal-winter-ballet-02');await p.locator('#music-select').selectOption('ethereal-winter-ballet-02');await p.locator('#music').click();if(await p.locator('#music').getAttribute('aria-checked')!=='true')await p.locator('#music').click();await p.waitForFunction(()=>[...document.querySelectorAll('audio')].some(a=>a.src.includes('ethereal-winter-ballet-02')&&!a.paused&&a.currentTime>.15));
  await p.evaluate(()=>openWinterSettings('social'));assert.ok(await p.locator('#owner-signin').isVisible());await p.screenshot({path:out+`/invite-${mobile?'mobile':'pc'}.jpg`,quality:85});
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.labSocialJoined&&document.querySelector('#world-loading')?.hidden,null,{timeout:120000});assert.ok(await p.evaluate(()=>labAppearance.accessory.includes('tail-cat')));
  check({mobile,check:'Ethereal first and playing, Invite login, reload saved appearance'});
 }catch(e){report.state=await p.evaluate(()=>({player:window.labPlayerState,interior:window.labInterior,actions:document.querySelector('#place-actions')?.textContent})).catch(()=>null);await p.screenshot({path:out+'/failure.jpg'}).catch(()=>{});throw e;}finally{await api(peer,'leave',{}).catch(()=>{});await api(c,'leave',{}).catch(()=>{});await peer.close();await c.close();}
}assert.deepEqual(report.errors,[]);assert.deepEqual(report.requestsFailed,[]);
}catch(e){report.failure=e.message.split('Call log:')[0];process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
