// Local browser evidence: real map clicks, collision-aware walking and live boarding.
import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4191',out=process.env.QA_OUTPUT||'qa/alpine-v50/access-final';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Local test only');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[],report={environment:'macOS Chrome 1280x800, live map clicks and walking; no physical Windows/mobile test'};
page.on('pageerror',e=>errors.push(e.message));await page.route('**/__dev/events',r=>r.abort());await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/}\s*$/,';window.__winterQA={renderer,scene,camera,world,experience,placePlayer,cameraPolicy,moveTo};\n}')});});
const assert=(value,message)=>{if(!value)throw Error(message);};
try{
 await page.context().request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'동선검증'}});await page.goto(origin,{timeout:180000});await page.waitForFunction(()=>window.__winterQA&&window.labSocialJoined,null,{timeout:180000});
 const layout=await page.evaluate(async()=>{const m=await import('/resort-layout.js');return{stations:m.skiMapDestinations,approach:m.gondolaApproach,leftApproach:m.liftApproach,transfer:m.ridgeTransfers[0],summit:m.peakSummit};});
 async function travel(id){await page.evaluate(()=>openWinterSettings('map'));await page.waitForTimeout(300);await page.locator(`[data-region="${id}"]`).click();const p=layout.stations.find(p=>p.id===id);await page.waitForFunction(p=>Math.hypot(labPlayerState.x-p.x,labPlayerState.z-p.z)<1,p,{timeout:20000});await page.waitForTimeout(1800);return await page.evaluate(()=>({pose:labPlayerState,camera:getWinterCameraState()}));}
 report.peak=await travel('ski-peak');await page.screenshot({path:out+'/summit-map-arrival.png'});
 for(const [name,yaw]of [['downhill',Math.PI],['west',Math.PI/2],['east',-Math.PI/2]]){await page.evaluate(yaw=>__winterQA.cameraPolicy.adopt({yaw,pitch:.24,distance:24}),yaw);await page.waitForTimeout(1600);await page.screenshot({path:out+'/summit-'+name+'.png'});}
 await page.evaluate(p=>{__winterQA.experience.cancel();__winterQA.placePlayer(p,Math.PI);__winterQA.cameraPolicy.adopt({yaw:0,pitch:.38,distance:22});},layout.approach[0]);
 report.walk=[];
 async function walk(points){for(const p of points){await page.evaluate(p=>__winterQA.moveTo(p.x,p.z),p);await page.waitForFunction(p=>Math.hypot(labPlayerState.x-p.x,labPlayerState.z-p.z)<.3,p,{timeout:45000});report.walk.push(await page.evaluate(()=>({...labPlayerState})));}}
 await walk(layout.leftApproach.slice(1));report.leftPrompt=await page.locator('#place-card').innerText();assert(/리프트/.test(report.leftPrompt),'Left lift missing after walking');await page.screenshot({path:out+'/left-front-entry.png'});await walk([...layout.leftApproach].reverse().slice(1));
 await walk(layout.approach.slice(1));await page.waitForTimeout(600);await page.screenshot({path:out+'/gondola-front-entry.png'});
 const p=layout.stations.find(p=>p.id==='ski-gondola-base');assert(Math.hypot(report.walk.at(-1).x-p.x,report.walk.at(-1).z-p.z)<.3,'Walking missed boarding trigger');
 report.prompt=await page.locator('#place-card').innerText();assert(/곤돌라/.test(report.prompt),'Gondola prompt missing after walking');
 const buttons=page.locator('#place-actions button');report.actions=await buttons.allTextContents();
 // The actual client performs the reservation request; a closed door may wait for the next cabin.
 for(let i=0;i<8;i++){const button=page.locator('#place-actions button:not([disabled])').first();if(await button.count())await button.click();await page.waitForTimeout(2200);if(await page.evaluate(()=>window.labRideReservation?.kind==='gondola'))break;}
 report.boarding=await page.evaluate(()=>({pose:labPlayerState,reservation:window.labRideReservation}));assert(report.boarding.reservation?.kind==='gondola','Could not board gondola from promenade');await page.screenshot({path:out+'/gondola-boarded.png'});await page.evaluate(()=>__winterQA.experience.cancel());
 report.middle=await travel('ski-forest');await walk(layout.transfer.slice(1));await page.waitForTimeout(2000);report.transferCamera=await page.evaluate(()=>getWinterCameraState());const eye=report.transferCamera.eye,focus=report.transferCamera.focus;assert(Math.hypot(eye.x-focus.x,eye.y-focus.y,eye.z-focus.z)>18,'Station canopy collapsed walking camera');
 // Sample passing chairs, not just a lucky empty interval between them.
 report.transferCameraRange=await page.evaluate(async()=>{let min=Infinity,max=0,frames=0;await new Promise(resolve=>{const start=performance.now();function sample(now){const s=getWinterCameraState(),d=Math.hypot(s.eye.x-s.focus.x,s.eye.y-s.focus.y,s.eye.z-s.focus.z);min=Math.min(min,d);max=Math.max(max,d);frames++;if(now-start>=30000)resolve();else requestAnimationFrame(sample);}requestAnimationFrame(sample);});return{min,max,frames};});assert(report.transferCameraRange.min>18,'Passing chair collapsed waiting camera');
 report.transferPrompt=await page.locator('#place-card').innerText();assert(/정상.*리프트/.test(report.transferPrompt),'No summit lift at shared hub');await page.screenshot({path:out+'/shared-transfer-hub.png'});
 report.map=[];for(const id of ['ski','ski-right-base','ski-gondola-base','ski-middle','ski-ridge-base','ski-ridge-top'])report.map.push({id,...await travel(id)});
 await page.evaluate(()=>openWinterSettings('map'));await page.waitForTimeout(900);await page.screenshot({path:out+'/world-map.png'});
 report.render=await page.evaluate(()=>({...__winterQA.renderer.info.render}));assert(!errors.length,'Browser errors');console.log('PASS summit views, promenade walking, live gondola boarding, shared hub and eight map destinations');
}catch(e){report.failure=e.message;process.exitCode=1;console.error(e.stack);}finally{report.errors=errors;await fs.writeFile(out+'/access.json',JSON.stringify(report,null,2));await browser.close();}
