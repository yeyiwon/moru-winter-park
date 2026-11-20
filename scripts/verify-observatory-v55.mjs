import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4195',stage=process.env.QA_STAGE||'before',out=`qa/experience-v55/performance/${stage}`;
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Isolated local verification only');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),report={environment:'macOS Chrome GPU; touch viewport emulation; physical Windows/Android/iOS UNKNOWN',views:[],errors:[]};
try{
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile}),p=await context.newPage();
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))report.errors.push(m.text());});
 await context.addInitScript(()=>{localStorage.setItem('lab-music','off');localStorage.setItem('winter-render-mode','medium');});
 if(process.env.QA_BASELINE==='1')for(const name of ['observatory-interior','observatory-layout','observatory-sky','bench-layout','interior-layout','winter-experience']){const source=execFileSync('git',['show','8fbde91:dist/'+name+'.js'],{encoding:'utf8'});await p.route('**/'+name+'.js*',r=>r.fulfill({contentType:'text/javascript',body:source}));}
 await p.route('**/__dev/events',r=>r.abort());await p.route('**/park.js*',async r=>{const response=await r.fetch(),s=process.env.QA_BASELINE==='1'?execFileSync('git',['show','8fbde91:dist/park.js'],{encoding:'utf8'}):await response.text();await r.fulfill({response,body:s.replace(/}\s*$/,';window.__qa={renderer,scene,camera,experience,world,companion,placePlayer,orbitCamera,interiors,cameraPolicy};\n}')});});
 await context.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:mobile?'관측모바일':'관측PC'}});await p.goto(origin);await p.waitForFunction(()=>window.__qa&&window.labSocialJoined&&document.body.classList.contains('world-ready'),null,{timeout:180000});await p.locator('#world-loading').waitFor({state:'hidden'});
 await p.evaluate(async()=>{const {interiorDoors}=await import('/district-layout.js');__qa.placePlayer(interiorDoors.museum,0);await enterInterior('museum');});await p.waitForFunction(()=>labInterior==='museum');await p.waitForTimeout(2500);
 const prefix=mobile?'mobile':'desktop';await p.screenshot({path:`${out}/${prefix}-entry.png`});
 await p.evaluate(()=>{__qa.placePlayer({x:594,y:.09,z:12},0);__qa.cameraPolicy.adopt({yaw:.45,pitch:-.4,distance:12});});await p.waitForTimeout(2000);
 report.views.push(await p.evaluate(async()=>{const times=[];let last=performance.now();await new Promise(resolve=>{function tick(now){times.push(now-last);last=now;if(times.length>=300)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});times.shift();times.sort((a,b)=>a-b);return {width:innerWidth,meanFPS:1000/(times.reduce((a,b)=>a+b,0)/times.length),p95ms:times[Math.floor(times.length*.95)],render:{...__qa.renderer.info.render},memory:{...__qa.renderer.info.memory},camera:getWinterCameraState()};}));
 await p.evaluate(()=>{__qa.placePlayer({x:594,y:.09,z:8},0);__qa.orbitCamera(-120,-450);});await p.waitForTimeout(1500);await p.screenshot({path:`${out}/${prefix}-sky.png`});
 await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await context.close();
}
}catch(e){report.failure=e.stack;process.exitCode=1;}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close();}
