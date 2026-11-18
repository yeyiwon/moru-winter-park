// Local QA only. Set QA_PHASE=before and QA_SOURCE_REV=18a79b4 for a source baseline.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4185',phase=process.env.QA_PHASE||'after',revision=process.env.QA_SOURCE_REV;
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Use an isolated local QA database.');
if(!['before','after'].includes(phase))throw Error('Invalid QA phase');
const out=process.env.QA_OUTPUT||'qa/browser-v35/'+phase;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const report={phase,revision:revision||null,checks:[],errors:[],performance:[],physicalMobile:false,liveAI:false,liveMicrophone:false};
const contexts=[];const check=name=>{report.checks.push(name);console.log(name);};
async function open(mobile){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1,serviceWorkers:'block'});contexts.push(context);const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))report.errors.push(m.text());});
 if(revision){const cache=new Map();await page.route(origin+'/**',async route=>{const url=new URL(route.request().url()),name=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1));if(!/\.(js|css|html)$/.test(name)||name.includes('..'))return route.continue();try{if(!cache.has(name))cache.set(name,execFileSync('git',['show',revision+':dist/'+name],{encoding:'utf8',stdio:['ignore','pipe','ignore']}));return route.fulfill({status:200,contentType:name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html',body:cache.get(name)});}catch{return route.continue();}});}
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.labSocialJoined&&window.travelToPlace,null,{timeout:90000});await page.evaluate(()=>window.travelToPlace('tree',false));await page.waitForTimeout(2000);return page;
}
async function close(page){await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));await page.waitForTimeout(220);}
async function pane(page,id){await close(page);await page.evaluate(id=>window.openWinterSettings(id),id);await page.waitForTimeout(400);if(!revision){const header=await page.locator('.studio-header').boundingBox(),panel=await page.locator('#pane-'+id).boundingBox();assert.ok(header&&panel&&panel.y>=header.y+header.height-1,'header must not overlap content');if(id==='map'){const map=await page.locator('#island-map').boundingBox();assert.ok(map.height>Math.min(180,(await page.viewportSize()).height*.4),'map owns a visible content row');assert.equal(await page.locator('.map-region:visible').count(),5);}}}
async function frameSample(page,name,mobile){
 const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');const before=await cdp.send('Performance.getMetrics');
 const values=await page.evaluate(()=>new Promise(resolve=>{const intervals=[];let start,last;function frame(t){if(last)intervals.push(t-last);last=t;start??=t;if(t-start<5000)requestAnimationFrame(frame);else resolve(intervals);}requestAnimationFrame(frame);}));
 const after=await cdp.send('Performance.getMetrics'),metric=(m,key)=>m.metrics.find(v=>v.name===key)?.value||0;values.sort((a,b)=>a-b);
 report.performance.push({name,mobile,rafFps:1000/(values.reduce((a,b)=>a+b,0)/values.length),rafP95:values[Math.floor(values.length*.95)],mainThreadMs:(metric(after,'TaskDuration')-metric(before,'TaskDuration'))*1000,layouts:metric(after,'LayoutCount')-metric(before,'LayoutCount'),styleRecalculations:metric(after,'RecalcStyleCount')-metric(before,'RecalcStyleCount'),blur:await page.locator('#studio').evaluate(e=>getComputedStyle(e).backdropFilter)});await cdp.detach();
}
try{
 for(const mobile of [false,true]){
  const page=await open(mobile),device=mobile?'mobile':'desktop';await frameSample(page,'world',mobile);
  for(const id of ['light','map','fluff','audio','social']){await pane(page,id);await page.screenshot({path:path.join(out,device+'-'+id+'.png')});if(id==='light')await frameSample(page,'settings',mobile);}
  if(phase==='before')continue;
  let aiCalls=0;
  await page.route('**/api/experience',async route=>{aiCalls++;const body=route.request().postDataJSON();assert.equal(body.consent,true);await route.fulfill({json:{mode:'ai',cards:[{component:'RecommendationCard',item:{id:'winter-waltz'}}]}});});
  await pane(page,'audio');await page.locator('#personalization-settings summary').click();assert.equal(await page.locator('#recommend-music').isDisabled(),true);assert.equal(aiCalls,0);
  await page.locator('#ai-personalization').check();assert.equal(aiCalls,0);await page.locator('#recommend-music').click();await page.locator('#music-recommendations button').waitFor();assert.equal(aiCalls,1);await page.locator('#music-recommendations button').click();assert.equal(await page.locator('#music-select').inputValue(),'winter-waltz');
  await page.screenshot({path:path.join(out,device+'-recommendation.png')});await page.locator('#reset-preferences').click();assert.equal(await page.locator('#recommend-music').isDisabled(),true);check(device+' opt-in, explicit request, playback and preference reset');
  await close(page);await page.evaluate(()=>window.openKnowledgeExhibit('science'));await page.locator('#exhibit-panel .experience-card button').first().waitFor();assert.equal(aiCalls,1);await page.screenshot({path:path.join(out,device+'-exhibit.png')});await page.locator('#exhibit-panel .experience-card button').first().click();await page.locator('#quick-quiz .quiz-options button').first().waitFor();await page.locator('#quick-quiz .icon-button').click();check(device+' sourced exhibit to quiz and close');
  for(const [label,width,height]of (mobile?[['small',320,640],['landscape',844,390]]:[['laptop',1024,768],['tablet',768,1024]])){
   await page.setViewportSize({width,height});for(const id of ['light','map','fluff','audio','social']){await pane(page,id);const rect=await page.locator('#studio').boundingBox();assert.ok(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=width+1&&rect.y+rect.height<=height+1);assert.equal(await page.locator('#pane-'+id).evaluate(e=>e.scrollWidth>e.clientWidth+2),false);await page.screenshot({path:path.join(out,label+'-'+id+'.png')});}check(label+' settings frame and overflow');
  }
 }
 assert.deepEqual(report.errors,[]);
}catch(error){report.failure=error.stack;process.exitCode=1;console.error(error);}finally{for(const context of contexts){await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});await context.close();}await browser.close();await fs.writeFile(path.join(out,'verification.json'),JSON.stringify(report,null,2));}
