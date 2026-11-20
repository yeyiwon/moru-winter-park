import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.QA_GUEST_ORIGIN||'http://127.0.0.1:4205',owner=process.env.QA_OWNER_ORIGIN||'http://127.0.0.1:4206',out=process.env.QA_OUTPUT||'qa/final-v58/personal-audio';
for(const url of [origin,owner])assert.ok(['localhost','127.0.0.1'].includes(new URL(url).hostname));
await fs.mkdir(out,{recursive:true});const report={checks:[],errors:[],environment:'Mac Chrome; three independent desktop/touch contexts; real local WebSocket and server clock'},browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const check=(name,ok,details)=>{report.checks.push({name,ok,details});console.log(ok?'PASS':'FAIL',name);assert.ok(ok,name);};const clients=[];
const sample=p=>p.evaluate(()=>({track:document.querySelector('#music-select').value,repeat:document.querySelector('#music-repeat').getAttribute('aria-pressed'),muted:labAudio.state.muted,level:labAudio.state.music,show:labFireworks,background:[...document.querySelectorAll('audio')].filter(a=>a.src).map(a=>({src:new URL(a.src).pathname,time:a.currentTime,paused:a.paused})),performance:__media.filter(a=>a.src.includes('/audio/show/')).map(a=>({src:new URL(a.src).pathname,time:a.currentTime,paused:a.paused}))}));
const post=(c,base,path,data)=>c.request.post(base+'/api/'+path,{headers:{Origin:base},data});
try{
 for(let i=0;i<3;i++){
  const c=await browser.newContext({viewport:i?{width:390,height:844}:{width:1280,height:800},isMobile:i>0,hasTouch:i>0});clients.push(c);
  await c.addInitScript(()=>{localStorage.setItem('winter-render-mode','medium');localStorage.setItem('lab-music','on');window.__media=[];window.__audioSeeks=[];const original=AudioContext.prototype.createMediaElementSource;AudioContext.prototype.createMediaElementSource=function(a){__media.push(a);a.addEventListener('seeking',()=>__audioSeeks.push({src:a.src.split('/').pop(),time:a.currentTime,at:Date.now()}));return original.call(this,a);};});
  const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(origin);await p.waitForFunction(()=>window.labAudio&&window.labSocialJoined&&document.body.classList.contains('world-ready'),null,{timeout:120000});await p.locator('#world-loading').waitFor({state:'hidden',timeout:120000});await p.mouse.click(300,150);
  await p.evaluate(i=>{openWinterSettings('audio');const s=document.querySelector('#music-select');s.selectedIndex=i;s.dispatchEvent(new Event('change'));if(i===1)document.querySelector('#music-repeat').click();labAudio.settings({music:.45+i*.1,muted:i===2});},i);
  await p.waitForFunction(()=>[...document.querySelectorAll('audio')].filter(a=>!a.paused).length===1,null,{timeout:20000});await p.waitForTimeout(2800);
 }
 const pages=clients.map(c=>c.pages()[0]);
 check('first visits default to dark', (await Promise.all(pages.map(p=>p.evaluate(()=>document.documentElement.dataset.uiTheme)))).every(theme=>theme==='dark'));
 for(const p of pages)await p.evaluate(()=>{document.querySelector('#close-studio').click();window.__chatObserved={};new MutationObserver(()=>{for(const n of document.querySelectorAll('#chat-log p')){const text=n.textContent;if(text.includes('v59 즉시')&&!__chatObserved[text])__chatObserved[text]=Date.now();}}).observe(document.querySelector('#chat-log'),{childList:true,subtree:true,characterData:true});});
 for(let sender=0;sender<3;sender++){
  const message='v59 즉시 '+sender,p=pages[sender];await p.locator('#chat-toggle').click();await p.locator('#chat-input').fill(message);const start=Date.now();await p.locator('#chat-input').press('Enter');await Promise.all(pages.map(p=>p.waitForFunction(message=>document.querySelector('#chat-log').textContent.includes(message),message,{timeout:5000})));
  const observations=await Promise.all(pages.map(p=>p.evaluate(message=>({at:Object.entries(__chatObserved).find(([text])=>text.includes(message))?.[1],self:document.querySelector('#self-bubble').textContent,peers:[...document.querySelectorAll('.visitor-label .speech-bubble')].map(b=>b.textContent)}),message)));
  const arrivals=observations.map(o=>o.at);check('Enter once pushes chat to all three clients '+sender,arrivals.every(Number.isFinite)&&Math.max(...arrivals)-Math.min(...arrivals)<500&&observations[sender].self===message,{latencies:arrivals.map(at=>at-start),spread:Math.max(...arrivals)-Math.min(...arrivals)});await p.waitForTimeout(1600);
 }
 const before=await Promise.all(pages.map(sample));check('three independent selected BGM tracks',new Set(before.map(s=>s.track)).size===3,before.map(s=>({track:s.track,repeat:s.repeat,muted:s.muted,level:s.level})));
 await pages[0].evaluate(()=>{const s=document.querySelector('#music-select');s.value='winter-jazz-artmylife';s.dispatchEvent(new Event('change'));});await pages[0].waitForTimeout(2800);
 const changed=await Promise.all(pages.map(sample));check('A changing BGM never changes B or C',changed[0].track!==before[0].track&&changed.slice(1).every((s,i)=>s.track===before[i+1].track));
 const requests=await Promise.all(clients.map(c=>post(c,origin,'fireworks',{action:'request'}).then(async r=>({status:r.status(),...await r.json()}))));const show=requests[0].show;report.show=show;
 check('three simultaneous requests create exactly one shared show',requests.every(r=>r.status===200)&&requests.filter(r=>r.created).length===1&&new Set(requests.map(r=>r.show.id)).size===1,requests.map(r=>({created:r.created,id:r.show.id})));
 check('server countdown is five seconds and cooldown five minutes',show.startsAt-requests.find(r=>r.created).serverTime===5000&&show.nextRequestAt-show.endsAt===300000);
 await Promise.all(pages.map(p=>p.waitForFunction(id=>labFireworks?.id===id,show.id,{timeout:20000})));
 await pages[0].waitForTimeout(Math.max(0,show.startsAt+4000-Date.now()));const active=await Promise.all(pages.map(sample));
 check('all local BGM playheads pause during shared show',active.every(s=>s.background.every(a=>a.paused)),active);
 check('same show recording plays while C remains muted',active.slice(0,2).every(s=>s.performance.some(a=>!a.paused&&a.time>1))&&active[2].muted&&active[2].performance.every(a=>a.paused));
 const frozen=active.map(s=>s.background.map(a=>a.time));await pages[0].waitForTimeout(2000);check('paused personal playheads stay fixed', (await Promise.all(pages.map(sample))).every((s,i)=>s.background.every((a,j)=>Math.abs(a.time-frozen[i][j])<.05)));
 // Reconnect one real client mid-performance without restarting the shared clock.
 await clients[1].setOffline(true);await pages[1].waitForTimeout(1800);await clients[1].setOffline(false);await pages[1].evaluate(()=>dispatchEvent(new Event('online')));await pages[1].waitForFunction(()=>window.labRealtimeActive,null,{timeout:30000});const rejoined=await sample(pages[1]);check('reconnection joins the existing show and elapsed music',rejoined.show.id===show.id&&rejoined.performance.some(a=>a.time>5&&!a.paused),rejoined);
 while(Date.now()<show.endsAt+2000){console.log('Natural show finish in',Math.ceil((show.endsAt-Date.now())/1000),'seconds');await pages[0].waitForTimeout(Math.min(15000,Math.max(1,show.endsAt+2000-Date.now())));}
 report.audioSeeks=await Promise.all(pages.map(p=>p.evaluate(()=>__audioSeeks)));
 const after=await Promise.all(pages.map(sample));report.after=after;check('each visitor keeps their own track, volume, repeat and mute',after.every((s,i)=>s.track===changed[i].track&&s.repeat===changed[i].repeat&&s.level===changed[i].level&&s.muted===changed[i].muted));
 check('all visitors resume enabled personal BGM',after.every(s=>s.background.some(a=>!a.paused)));
 check('continuously connected BGM resumes its saved playhead', [0,2].every(i=>after[i].background.some((a,j)=>!a.paused&&a.time>=frozen[i][j]&&a.time-frozen[i][j]<5)));
 const cooling=await post(clients[0],origin,'fireworks',{action:'request'});check('normal visitors cannot bypass the cooldown',cooling.status()===429);
 const host=await browser.newContext();clients.push(host);await post(host,owner,'join',{name:'운영검증'});const admin=await post(host,owner,'fireworks',{action:'start'}),reply=await admin.json();check('administrator starts immediately during cooldown',admin.ok()&&reply.created&&reply.show.startsAt===reply.serverTime&&reply.phase==='playing');
 const twice=await post(host,owner,'fireworks',{action:'start'});check('administrator repeated start cannot duplicate show',twice.status()===409);await post(host,owner,'fireworks',{action:'stop'});
 check('no browser exceptions',report.errors.length===0,report.errors);
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));for(let i=0;i<clients.length;i++)await post(clients[i],i===3?owner:origin,'leave',{}).catch(()=>{});await browser.close();}
