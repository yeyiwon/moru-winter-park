import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';

const origin=process.env.QA_URL||'http://127.0.0.1:4185',stage=process.env.QA_STAGE||'after',out='qa/browser-v37';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Local QA only');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={stage,checks:[],errors:[],physicalMobile:false};
try{
 const page=await browser.newPage({viewport:{width:1100,height:500},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(e.message));
 if(stage==='before')await page.route('**/companion.js*',route=>route.fulfill({contentType:'text/javascript',body:execFileSync('git',['show','1b190ae:dist/companion.js'],{encoding:'utf8'})}));
 await page.route('**/__qa/eyes.html',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#e7ded2}canvas{display:block}.labels{position:absolute;bottom:32px;inset-inline:0;display:flex;justify-content:space-around;color:#4e4742;font:500 17px sans-serif}</style><div class="labels"><span>멍한 눈</span><span>하트 눈</span><span>별 눈</span></div><script type="module">
 import * as T from '/vendor/three.module.js';import {createCompanion} from '/companion.js';
 const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.setClearColor('#e7ded2');renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;document.body.append(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,innerWidth/innerHeight,.1,100);camera.position.set(0,.8,6.7);camera.lookAt(0,.1,0);
 scene.add(new T.HemisphereLight('#fff9f0','#a6a0c0',2));const key=new T.DirectionalLight('#ffffff',3);key.position.set(-3,5,6);scene.add(key);
 window.pets=['eyes-goofy','eyes-heart','eyes-star'].map((accessory,i)=>{const pet=createCompanion({detail:'full'});pet.customize({accessory});pet.group.position.x=(i-1)*2;pet.pose({still:true});scene.add(pet.group);return pet;});
 window.renderPose=state=>{for(const pet of pets)pet.pose(state);renderer.render(scene,camera);};renderPose({still:true});window.ready=true;
 </script>`}));
 await page.goto(origin+'/__qa/eyes.html');await page.waitForFunction(()=>window.ready);await page.screenshot({path:`${out}/eyes-${stage}.png`});
 for(const state of [{walking:true,phase:1.4,time:1},{mode:'ski',speed:12,lean:.6,time:2},{mode:'bath',still:true},{still:true}]){
  const valid=await page.evaluate(state=>{renderPose(state);return pets.every(p=>p.eyes.every(e=>[...e.position,...e.scale].every(Number.isFinite)));},state);assert.ok(valid);
 }
 if(stage==='after'){
  assert.ok(await page.evaluate(()=>{pets.forEach((p,i)=>p.customize({accessory:['eyes-goofy','eyes-heart','eyes-star'][i]+',helmet,goggles'}));renderPose({mode:'ski',still:true});return pets.every(p=>p.eyes.every(e=>!e.visible));}));
  await page.screenshot({path:`${out}/goggles-after.png`});
  assert.ok(await page.evaluate(()=>{renderPose({mode:'bath',still:true});return pets.every(p=>p.eyes.every(e=>e.visible));}));
  report.checks.push({interaction:'all three expressions covered by goggles, visible again in bath'});
 }
 await page.close();
 for(const [name,width,height,mobile]of stage==='before'||process.env.QA_DESKTOP_ONLY==='1'?[['desktop',1440,900,false]]:[['desktop',1440,900,false],['small-mobile',320,640,true],['mobile',390,844,true],['landscape',844,390,true]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  if(stage==='before')for(const file of ['companion.js','index.html','ui-system.css'])await page.route(file==='index.html'?origin+'/':'**/'+file+'*',route=>route.fulfill({contentType:file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript',body:execFileSync('git',['show','1b190ae:dist/'+file],{encoding:'utf8',maxBuffer:2e6})}));
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.openWinterSettings&&window.labSocialJoined&&document.body.classList.contains('world-ready'),null,{timeout:90000});
  await page.evaluate(()=>window.travelToPlace('tree',false));await page.waitForTimeout(1200);
  let frame;
  for(const id of stage==='before'?['fluff']:['map','light','fluff','audio','social']){
   await page.evaluate(id=>window.openWinterSettings(id),id);await page.waitForTimeout(250);
   if(stage==='after'){assert.equal(await page.locator('#studio-section-en').innerText(),({map:'MAP',light:'WEATHER & LIGHT',fluff:'CUSTOMIZE',audio:'SOUND',social:'INVITE'})[id]);assert.ok((await page.locator('#studio-section-name').innerText()).trim());}
   if(id==='fluff'){await page.locator('[data-custom-tab="eyes"]').click();await page.locator('[data-accessory="eyes-goofy"]').click();await page.evaluate(()=>document.body.classList.add('still'));await page.waitForTimeout(200);}
   const result=await page.evaluate(id=>{const s=document.querySelector('#studio'),pane=s.querySelector('#pane-'+id),rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};};return{id,frame:rect(s),title:rect(s.querySelector('.studio-head>span')),tabs:rect(s.querySelector('.studio-tabs')),overflow:pane.scrollWidth>pane.clientWidth+2,background:getComputedStyle(s).background,color:getComputedStyle(s).color,selected:getComputedStyle(s.querySelector('.studio-tabs [aria-selected=true]')).background};},id);
   assert.ok(result.frame.x>=0&&result.frame.y>=0&&result.frame.x+result.frame.w<=width+1&&result.frame.bottom<=height+1);assert.ok(result.title.bottom<=result.tabs.y);assert.equal(result.overflow,false);
   if(frame)assert.deepEqual(result.frame,frame);else frame=result.frame;
   report.checks.push({viewport:name,...result});
   if((name==='desktop'&&['fluff','map','audio','social'].includes(id))||(name==='mobile'&&id==='fluff')||(name==='landscape'&&id==='fluff'))await page.screenshot({path:`${out}/${name}-${id}-${stage}.jpg`,quality:86});
   if(stage==='after'&&id==='map'){
    assert.equal(await page.locator('.map-region').count(),8);
    const summitMarker=page.locator('.map-region[data-region="ski-peak"]');
    if(mobile)await summitMarker.tap();else await summitMarker.hover();await page.waitForTimeout(220);
    const tip=await summitMarker.locator('span').boundingBox(),mapBounds=await page.locator('#island-map').boundingBox();
    assert.ok(tip.y>=mapBounds.y&&tip.y+tip.height<=mapBounds.y+mapBounds.height,'summit tooltip is inside map vertically');
    assert.ok(tip.x>=mapBounds.x&&tip.x+tip.width<=mapBounds.x+mapBounds.width,'summit tooltip is inside map horizontally');
    assert.equal(await summitMarker.evaluate(b=>getComputedStyle(b).borderTopWidth),'0px');
    assert.equal(await summitMarker.evaluate(b=>getComputedStyle(b).backgroundColor),'rgba(0, 0, 0, 0)');
    assert.equal(await summitMarker.locator('span').evaluate(s=>getComputedStyle(s).borderTopWidth),'0px');
    if(['desktop','small-mobile'].includes(name))await page.screenshot({path:`${out}/${name}-map-tooltip.jpg`,quality:90});

    const marker=page.locator('.map-region[data-region="ski"]');
    if(mobile){await marker.tap();assert.equal(await marker.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('#studio').isVisible(),true);await marker.tap();}else{await marker.hover();assert.ok((await marker.innerText()).includes('초급 리프트'));await marker.click();}
    await page.locator('#studio').waitFor({state:'hidden'});
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(async()=>{const {alpineHeight,skiMapDestinations}=await import('/resort-layout.js'),p=skiMapDestinations.find(p=>p.id==='ski'),s=labPlayerState;return Math.hypot(s.x-p.x,s.z-p.z)<1&&s.y>=alpineHeight(s.x,s.z); }));
    for(const target of ['ski-right-base','ski-middle','ski-peak']){
     await page.evaluate(()=>window.openWinterSettings('map'));await page.waitForTimeout(200);
     const destination=page.locator('.map-region[data-region="'+target+'"]');assert.equal(await destination.isVisible(),true);
     if(mobile){await destination.tap();assert.equal(await destination.getAttribute('aria-pressed'),'true');await destination.tap();}else await destination.click();
     await page.locator('#studio').waitFor({state:'hidden'});await page.waitForTimeout(200);
     assert.ok(await page.evaluate(async id=>{const {skiMapDestinations,alpineHeight}=await import('/resort-layout.js'),p=skiMapDestinations.find(p=>p.id===id),s=labPlayerState;return Math.hypot(s.x-p.x,s.z-p.z)<1&&Math.abs(s.y-alpineHeight(s.x,s.z)-.86)<.2;},target));
    }
    report.checks.push({viewport:name,interaction:'eight visible markers; PC click/mobile two-tap reaches both lift bases and both dismounts at correct elevations'});
   }
   if(stage==='after'&&id==='audio'){
    await page.locator('#music-select + .select-trigger').click();
    const list=page.locator('.select-options:visible'),box=await list.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1);
    if(name==='desktop')await page.screenshot({path:`${out}/desktop-music-picker.jpg`,quality:86});
    await page.keyboard.press('Escape');assert.equal(await list.count(),0);report.checks.push({viewport:name,interaction:'music picker bounds and keyboard dismissal'});
   }
  }
  await page.keyboard.press('Escape');await page.locator('#studio').waitFor({state:'hidden'});
  if(stage==='after'&&name==='desktop'){
   await page.evaluate(()=>window.openWishComposer());await page.locator('#wish-form textarea').fill('반짝이는 겨울의 순간');
   await page.screenshot({path:`${out}/desktop-wish.jpg`,quality:86});await page.keyboard.press('Escape');
   report.checks.push({viewport:name,interaction:'wish composer shares glass theme; draft only, no submission'});
   await page.locator('#chat-toggle').click();await page.locator('#chat-input').fill('메시지 입력');
   assert.equal(await page.locator('#chat-input').evaluate(e=>getComputedStyle(e).outlineStyle),'none');
   await page.screenshot({path:`${out}/desktop-chat-focus.jpg`,quality:86});await page.keyboard.press('Escape');
   report.checks.push({viewport:name,interaction:'focused chat has no input outline; draft only, no send'});
  }
  await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await context.close();console.log(name+' '+stage+' passed');
 }
 assert.deepEqual(report.errors,[]);
}catch(error){report.failure=error.stack;console.error(error);process.exitCode=1;}finally{await browser.close();await fs.writeFile(`${out}/verification-${stage}${process.env.QA_DESKTOP_ONLY==='1'?'-desktop':''}.json`,JSON.stringify(report,null,2));}
