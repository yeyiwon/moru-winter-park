// Isolated local sessions only. Production has no QA hooks.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';
const origin='http://127.0.0.1:4185',out='qa/browser-v37',before=process.env.QA_STAGE==='before',mobile=process.env.QA_MOBILE==='1';
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={at:new Date().toISOString(),before,mobileEmulation:mobile,physicalMobile:false,checks:[],errors:[]};let context;
try{
 context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('winter-render-mode','high'));
 if(before){const files=execFileSync('git',['ls-tree','-r','--name-only','1b190ae','dist'],{encoding:'utf8'}).trim().split('\n'),baseline=new Map();for(const file of files.filter(f=>/\.(js|css|html|json)$/.test(f)&&!f.startsWith('dist/server/')))baseline.set(file.slice(5),execFileSync('git',['show','1b190ae:'+file],{encoding:'utf8',maxBuffer:16e6}));await page.route('**/*',r=>{const f=new URL(r.request().url()).pathname.slice(1)||'index.html';return baseline.has(f)?r.fulfill({contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':'text/html; charset=utf-8',body:baseline.get(f)}):r.continue();});}
 await page.route('**/park.js*',async route=>{const response=await route.fetch();let source=before?execFileSync('git',['show','1b190ae:dist/park.js'],{encoding:'utf8'}):await response.text();source=source.replaceAll('if(glowPass)glowPass.render(scene,camera);','if(window.__qaFireworkTime!==undefined){scene.getObjectByName("winter-firework-shells").material.uniforms.clock.value=window.__qaFireworkTime;}if(window.__qaPhoto){camera.position.set(...window.__qaPhoto.position);camera.lookAt(...window.__qaPhoto.target);camera.fov=window.__qaPhoto.fov||44;camera.updateProjectionMatrix();}if(glowPass)glowPass.render(scene,camera);').replace(/}\s*$/,';window.__qa={renderer,scene,camera,experience,world,interiors,fluff,walkTo:moveTo,setPosition:p=>{experience.cancel();placePlayer(p,0);}};}');await route.fulfill({response,body:source});});
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__qa&&window.labSocialJoined,null,{timeout:120000});await page.waitForTimeout(1500);
 async function shot(name,position,target){await page.evaluate(({position,target})=>{window.__qaPhoto={position,target};window.labWorldTime={hour:21};window.dispatchEvent(new CustomEvent('lab:time',{detail:window.labWorldTime}));}, {position,target});await page.waitForTimeout(800);await page.screenshot({path:`${out}/${name}-${before?'before':'after'}${mobile?'-mobile':''}.jpg`,quality:90});await page.evaluate(()=>delete window.__qaPhoto);}
 for(const name of ['museum','ryokan']){
  const coordinates=await page.evaluate(async name=>{const {museumLayout,museumPoint,interiorDoors}=await import('/district-layout.js'),{spaToWorld}=await import('/spa-transform.js');window.travelToPlace(name==='museum'?'quiz':'sauna',false);const a=name==='museum'?museumPoint(32,54):spaToWorld({x:54,z:73}),b=name==='museum'?museumLayout:spaToWorld({x:10,z:122});return{position:[a.x,name==='museum'?24:24,a.z],target:[b.x,name==='museum'?8:3.5,b.z]};},name);
  await shot(name+'-exterior',coordinates.position,coordinates.target);
  if(before)continue;
  // Hold the actual region request to observe readiness-controlled loading, not a timer.
  await page.route('**/api/region',async route=>{await new Promise(r=>setTimeout(r,700));await route.continue();});
  await page.evaluate(name=>{window.__entry=window.enterInterior(name);},name);await page.locator('#room-transition.active').waitFor();await page.screenshot({path:`${out}/${name}-loading${mobile?'-mobile':''}.jpg`,quality:85});await page.evaluate(()=>window.__entry);await page.unroute('**/api/region');
  assert.equal(await page.evaluate(()=>window.labInterior),name);assert.equal(await page.locator('#room-transition').getAttribute('aria-hidden'),'true');
  report.checks.push(name+' actual region entry/loading complete');
  await shot(name+'-interior',name==='museum'?[600,6,19]:[400,5,16],name==='museum'?[600,6,-8]:[400,2,-7]);
  const benchId=name==='museum'?'museum-bench-east':'ryokan-tatami';
  await page.evaluate(async id=>{const {benches,benchAccess}=await import('/bench-layout.js');window.__qa.setPosition(benchAccess(benches.find(b=>b.id===id)));},benchId);await page.waitForTimeout(500);await page.locator('#place-actions button[aria-label="앉기"]').click();await page.waitForFunction(()=>window.labPlayerState.mode==='rest');
  assert.equal((await page.evaluate(()=>window.labRideReservation)).kind,'bench');await page.waitForTimeout(1000);
  await page.screenshot({path:`${out}/${name}-seated${mobile?'-mobile':''}.jpg`,quality:90});report.checks.push(name+' reserved seated pose');
  await page.keyboard.down('w');await page.waitForTimeout(250);await page.keyboard.up('w');await page.waitForFunction(()=>window.labPlayerState.mode==='');assert.equal(await page.evaluate(()=>window.labRideReservation),null);
  await page.evaluate(()=>window.exitInterior());await page.waitForFunction(()=>window.labInterior===null);report.checks.push(name+' movement releases seat and exit restores outdoors');
 }
 if(!before){
  // Nickname input and API agree on ten visible graphemes.
  await page.evaluate(()=>window.openWinterSettings('fluff'));await page.locator('#profile-name').fill('하나둘셋넷다여일곱여덟');assert.equal(await page.locator('#profile-count').textContent(),'10 / 10');assert.equal(Array.from(await page.locator('#profile-name').inputValue()).length,10);
  await page.locator('#profile-name').fill('👩‍🚀'.repeat(11));assert.equal(await page.locator('#profile-name').inputValue(),'👩‍🚀'.repeat(10));await page.locator('#profile-name').fill('겨울친구37');await page.locator('#profile-form button').click();await page.waitForFunction(()=>document.querySelector('#profile-status').textContent==='저장됨');await page.keyboard.press('Escape');
  const invalid=await context.request.post(origin+'/api/name',{headers:{Origin:origin},data:{name:'가'.repeat(11)}});assert.equal(invalid.status(),400);report.checks.push('nickname grapheme cap, saved state and API rejection');
  // A second visitor occupies the other seat; the third must be refused.
  const other=await browser.newContext(),third=await browser.newContext();
  try{for(const [client,name]of [[other,'친구37'],[third,'대기37']]){assert.ok((await client.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name,room:'winter-plaza'}})).ok());}
   const spot=await page.evaluate(async()=>{const {benches,benchAccess}=await import('/bench-layout.js'),b=benches.find(b=>b.id==='park-bench-0');window.__qa.setPosition(benchAccess(b));return benchAccess(b);});await page.waitForTimeout(500);await page.locator('#place-actions button[aria-label="앉기"]').click();await page.waitForFunction(()=>window.labPlayerState.mode==='rest');
   const own=await page.evaluate(()=>window.labRideReservation);let otherSeat;
   for(const [client,expected]of [[other,200],[third,409]]){assert.ok((await client.request.post(origin+'/api/presence',{headers:{Origin:origin},data:{...spot,y:.95,yaw:0,mode:'',color:'#faf1e8',accessory:'none'}})).ok());const r=await client.request.post(origin+'/api/ride',{headers:{Origin:origin},data:{kind:'bench',benchId:'park-bench-0'}});assert.equal(r.status(),expected);if(expected===200)otherSeat=(await r.json()).reservation;}
   assert.notEqual(own.seat,otherSeat.seat);const remotePose=await page.evaluate(async r=>(await import('/ride-seats.js')).sharedSeatPose(r,Date.now()),otherSeat);
   await other.request.post(origin+'/api/presence',{headers:{Origin:origin},data:{...remotePose,color:'#d4e6e2',accessory:'cat-ears'}});await page.waitForFunction(()=>document.querySelector('#visitor-labels').textContent.includes('친구37'),null,{timeout:15000});
   await page.locator('#chat-toggle').click();await page.locator('#chat-input').fill('같이 앉았어요');await page.locator('#chat-input').press('Enter');assert.equal(await page.evaluate(()=>window.labPlayerState.mode),'rest');await page.keyboard.press('Escape');await page.screenshot({path:`${out}/two-seat-bench${mobile?'-mobile':''}.jpg`,quality:90});report.checks.push('two distinct shared seats, third refused, remote name, seated chat');
   await page.locator('#stop-ride').click();await page.waitForFunction(()=>window.labPlayerState.mode==='');const snapshot=await other.request.post(origin+'/api/presence',{headers:{Origin:origin},data:{...remotePose,color:'#d4e6e2',accessory:'cat-ears'}});assert.ok(snapshot.ok());report.checks.push('independent dismount');
  }finally{for(const client of [other,third]){await client.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await client.close();}}

 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}finally{if(context){await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});}await browser.close();await fs.writeFile(`${out}/world-${before?'before':'after'}${mobile?'-mobile':''}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));}
