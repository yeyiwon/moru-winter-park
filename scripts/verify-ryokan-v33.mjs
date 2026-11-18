import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL('/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin='http://127.0.0.1:4184',stage=process.env.QA_STAGE||'before',out=`qa/browser-v33/${stage}`;
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={checks:[],errors:[],physicalMobile:false},contexts=[];
async function open(mobile=false){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});contexts.push(context);const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))report.errors.push(m.text());});
 await page.route('**/park.js*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('if(glowPass)glowPass.render(scene,camera);','if(window.__qaShot){camera.position.fromArray(window.__qaShot.position);camera.lookAt(...window.__qaShot.target);camera.updateMatrixWorld();}if(glowPass)glowPass.render(scene,camera);');body=body.replace(/}\s*$/,';window.__qa={renderer,scene,camera,world,experience,interiors,fluff,walkTo:moveTo,setPosition:p=>{experience.cancel();placePlayer(p,0);}};}');await route.fulfill({response,body});});
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__qa&&window.labSocialJoined,null,{timeout:90000});await page.waitForTimeout(1500);return page;
}
async function screenshot(page,name,shot){await page.evaluate(s=>window.__qaShot=s,shot||null);await page.waitForTimeout(600);await page.screenshot({path:`${out}/${name}.png`});await page.evaluate(()=>window.__qaShot=null);}
const check=(name,result)=>{report.checks.push({name,...result});console.log(name,JSON.stringify(result));};
try{
 const page=await open();await page.evaluate(()=>window.travelToPlace('sauna',false));await page.waitForTimeout(1500);
 await screenshot(page,'exterior',{position:[78,24,-53],target:[108,2,-12]});
 await screenshot(page,'bath',{position:[77,12,-28],target:[90,.4,-8]});
 await page.evaluate(()=>window.__qa.setPosition({x:102,z:-41}));await page.evaluate(()=>window.__qa.walkTo(114,-23.4));
 await page.waitForFunction(()=>Math.hypot(window.labPlayerState.x-114,window.labPlayerState.z+23.4)<1,null,{timeout:30000});await page.waitForTimeout(650);
 const response=page.waitForResponse(r=>r.url().endsWith('/api/region')&&r.request().method()==='POST');
 await page.locator('#place-actions button').filter({hasText:'입장'}).click();const res=await response;check('walk to actual ryokan door and enter',{status:res.status(),body:await res.json()});await page.waitForFunction(()=>window.labInterior==='ryokan',null,{timeout:15000});
 await screenshot(page,'hall',{position:[401,4.3,12.5],target:[400,2,-6]});
 await screenshot(page,'aquarium',{position:[390,3.8,6.2],target:[388,2.2,14.7]});
 await screenshot(page,'tatami',{position:[404,3.6,-3.8],target:[415,1.5,-10]});

 if(stage!=='before'){
  for(const id of ['interior-tea','interior-dining','interior-rest','interior-footbath','interior-sauna','interior-aquarium']){
   const goal=await page.evaluate(async id=>(await import('/interior-layout.js')).interiorInteractions.find(p=>p.id===id),id);
   await page.evaluate(p=>window.__qa.walkTo(p.x,p.z),goal);await page.waitForFunction(p=>Math.hypot(window.labPlayerState.x-p.x,window.labPlayerState.z-p.z)<.85,goal,{timeout:25000});
   await page.evaluate(id=>window.__qa.experience.show(id),id);await page.locator('#place-actions button').first().click();await page.waitForTimeout(1100);
   assert.equal(await page.evaluate(()=>window.__qa.experience.active),true);assert.equal(await page.evaluate(()=>window.labInterior),'ryokan');
   const frame=await page.evaluate(async()=>{const T=await import('/vendor/three.module.js'),q=window.__qa;return q.fluff.position.clone().add(new T.Vector3(0,.3,0)).project(q.camera).toArray();});assert.ok(Math.abs(frame[0])<1&&Math.abs(frame[1])<1,id+' character visible');
   await screenshot(page,id);await page.locator('#stop-ride').click();await page.waitForTimeout(250);assert.equal(await page.locator('#ride-hud').isVisible(),false);check('walk and use '+id,{frame});
  }
  // A second server session verifies room/pose synchronization without a second renderer.
  const peer=await browser.newContext();contexts.push(peer);
  const req=async(path,data)=>{const r=await peer.request.post(origin+'/api/'+path,{headers:{Origin:origin},data});const body=await r.json();assert.ok(r.ok(),path+' '+r.status()+' '+JSON.stringify(body));return body;};
  await page.evaluate(()=>{window.__qaPeers=[];window.addEventListener('lab:visitors',e=>window.__qaPeers=e.detail);});
  const joined=await req('join',{name:'Ryokan QA peer',room:'winter-plaza'});
  await page.waitForTimeout(600);await req('presence',{x:114,y:.95,z:-23.4,yaw:0,mode:'',color:'#faf1e8',accessory:'none'});await req('region',{region:'ryokan'});
  await page.waitForFunction(id=>window.__qaPeers.some(p=>p.id===id),joined.id,{timeout:15000});check('peer appears in same interior',{id:joined.id});
  await req('region',{region:'outdoors'});await page.waitForTimeout(1200);await req('leave',{});await peer.close();contexts.splice(contexts.indexOf(peer),1);
 }
 await page.evaluate(()=>window.exitInterior());await page.waitForFunction(()=>!window.labInterior);check('exit returns to outdoor door',{player:await page.evaluate(()=>window.labPlayerState)});

 if(stage!=='before'){
  await page.evaluate(()=>{window.travelToPlace('onsen',false);window.__qa.experience.show('onsen','bath');});await page.locator('#place-actions button').first().click();await page.waitForTimeout(700);
  const initial=await page.evaluate(()=>window.labPlayerState);await page.keyboard.down('KeyD');await page.waitForTimeout(850);await page.keyboard.up('KeyD');const final=await page.evaluate(()=>window.labPlayerState);
  assert.equal(final.mode,'bath');assert.ok(Math.hypot(final.x-initial.x,final.z-initial.z)>.3);await screenshot(page,'large-bath-use');await page.locator('#stop-ride').click();check('large bath enters, wades, exits',{initial,final});
  await page.context().request.post(origin+'/api/leave',{data:{}});await page.context().close();contexts.splice(contexts.indexOf(page.context()),1);
  const phone=await open(true);await phone.evaluate(()=>window.travelToPlace('sauna',false));await phone.locator('#place-actions button').filter({hasText:'입장'}).tap();await phone.waitForFunction(()=>window.labInterior==='ryokan');
  await screenshot(phone,'mobile-entry');
  const joy=await phone.locator('#joystick').boundingBox(),cdp=await phone.context().newCDPSession(phone),finger={id:1,x:joy.x+joy.width/2,y:joy.y+joy.height/2},before=await phone.evaluate(()=>window.labPlayerState);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});finger.y-=26;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[finger]});await phone.waitForTimeout(700);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const after=await phone.evaluate(()=>window.labPlayerState);assert.ok(Math.hypot(after.x-before.x,after.z-before.z)>.4);
  await phone.evaluate(()=>window.exitInterior());await phone.waitForFunction(()=>!window.labInterior);assert.equal(await phone.locator('#ride-hud').isVisible(),false);check('mobile tap entry, joystick and exit',{before,after});
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}finally{for(const c of contexts){await c.request.post(origin+'/api/leave',{data:{}}).catch(()=>{});await c.close();}await browser.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));}
