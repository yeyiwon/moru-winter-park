// Local, isolated HTTP-presence integration; never calls an operating world's API.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs'));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4192';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Use an isolated localhost server');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const output=process.env.QA_OUTPUT||'qa/castle-show-v49';
const report={environment:'macOS Chrome, desktop and touch emulation, local HTTP presence; no physical mobile or operating WebSocket server validation'},errors=[];
async function open(name,mobile=false){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},deviceScaleFactor:1,isMobile:mobile,hasTouch:mobile});
 await context.addInitScript(()=>{localStorage.setItem('lab-music','off');localStorage.setItem('winter-render-mode','medium');});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(name+': '+e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))errors.push(m.text());});
 await page.route('**/__dev/events',r=>r.abort());
 await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/}\s*$/,';window.__showQA=fireworks;\n}')});});
 const joined=await context.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name}});if(!joined.ok())throw Error('Local join failed');
 await page.goto(origin,{timeout:180000});await page.waitForFunction(()=>window.__showQA&&window.labSocialJoined,null,{timeout:180000});return page;
}
async function snapshot(page){return page.evaluate(async()=>{const {serverNow}=await import('/server-clock.js');return{show:labFireworks,sampledAt:Date.now(),clock:serverNow(),renderAge:__showQA.root.material.uniforms.clock.value,castleAge:__showQA.castle.uniforms.showTime.value,castleMode:__showQA.castle.uniforms.showMode.value,castleRegions:Array.from(__showQA.castle.uniforms.showRegions.value),active:__showQA.active,camera:getWinterCameraState(),position:{x:labPlayerState.x,z:labPlayerState.z}};});}
try{
 const a=await open('공연동기화A'),b=await open('공연동기화B',true);report.before=await Promise.all([snapshot(a),snapshot(b)]);
 const reply=await a.evaluate(async()=>{const r=await fetch('/api/fireworks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'request'})});return{status:r.status,data:await r.json()};});
 if(reply.status!==200||!reply.data.show)throw Error('Show request unavailable: '+reply.status);report.server=reply.data.show;
 await Promise.all([a,b].map(p=>p.waitForFunction(id=>window.labFireworks?.id===id,report.server.id,{timeout:15000})));
 if(await a.locator('#firework-watch').count())throw Error('Removed camera control still exists');await a.waitForTimeout(Math.max(0,report.server.startsAt+4000-Date.now()));
 report.playing=await Promise.all([snapshot(a),snapshot(b)]);
 const unchanged=(x,y)=>Math.abs(x.yaw-y.yaw)<.01&&Math.abs(x.pitch-y.pitch)<.01&&Math.abs(x.distance-y.distance)<.1;
 if(!unchanged(report.before[1].camera,report.playing[1].camera))throw Error('Another guest camera changed automatically');
 if(report.playing.some(s=>Math.abs(s.castleAge-s.renderAge)>.05||!s.active||s.show.id!==report.server.id||s.show.seed!==report.server.seed||Math.abs((s.clock-s.show.startsAt)/1000-s.renderAge)>.6))throw Error('Shared render timeline mismatch');
 report.adminDenied=await b.evaluate(async()=>{const r=await fetch('/api/fireworks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start'})});return r.status;});if(report.adminDenied!==403)throw Error('Guest admin control was not blocked');
 const c=await open('공연늦은접속');await c.waitForFunction(()=>window.__showQA.active,null,{timeout:10000});report.lateJoin=await snapshot(c);
 if(report.lateJoin.show.id!==report.server.id||report.lateJoin.show.seed!==report.server.seed||report.lateJoin.renderAge<5||Math.abs((report.lateJoin.clock-report.server.startsAt)/1000-report.lateJoin.renderAge)>.6)throw Error('Late join restarted the show');
 await a.waitForTimeout(Math.max(0,report.server.endsAt+3500-Date.now()));report.after=await Promise.all([snapshot(a),snapshot(b),snapshot(c)]);
 if(report.after.some(s=>s.active)||!unchanged(report.before[0].camera,report.after[0].camera))throw Error('Show cleanup or camera restoration failed');
 if(JSON.stringify(report.before[0].position)!==JSON.stringify(report.after[0].position))throw Error('Watching moved the player');
 console.log('PASS shared ID/seed/clock, free camera, late join, guest permission, natural end');
}catch(e){report.failure=e.stack;process.exitCode=1;console.log('FAIL',e.stack);}finally{report.errors=errors;if(errors.length)process.exitCode=1;await fs.mkdir(output,{recursive:true});await fs.writeFile(output+'/sync.json',JSON.stringify(report,null,2));await browser.close();}
