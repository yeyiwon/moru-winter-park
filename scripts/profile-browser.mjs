// QA-only: uses an externally installed Playwright, never a production dependency.
// Run against an isolated local DB and the production static build, not a live room.
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {productionAsset} from './production-assets.mjs';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4180',output=process.env.PROFILE_OUTPUT||'qa/browser-v30/before-desktop.json';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Use an isolated local server for automated travel and guest sessions.');
const mobile=process.env.PROFILE_MOBILE==='1',seconds=Number(process.env.PROFILE_SECONDS)||8;
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const baseline=new Map(),revision=process.env.PROFILE_SOURCE_REV;if(revision){
 if(!/^[a-f0-9]{7,40}$/.test(revision))throw Error('Use a verified commit SHA');
 // Keep the whole module graph and UI from one revision; mixing only selected
 // files with current coordinate helpers produces an invalid comparison.
 const files=execFileSync('git',['ls-tree','-r','--name-only',revision,'dist'],{encoding:'utf8'}).trim().split('\n');
 for(const file of files.filter(file=>/\.(js|css|html|json)$/.test(file)&&!file.startsWith('dist/server/')))baseline.set(file.slice(5),execFileSync('git',['show',revision+':'+file],{encoding:'utf8',maxBuffer:16*1024*1024}));
}
if(process.env.PROFILE_PRODUCTION==='1'){
 if(revision){for(const [name,source]of baseline)baseline.set(name,productionAsset(source,path.extname(name)));}
 else{const files=await fs.readdir('web-dist',{recursive:true});for(const name of files.filter(f=>/\.(js|css|html|json)$/.test(f)))baseline.set(name,await fs.readFile(path.join('web-dist',name),'utf8'));}
}
const errors=[],report={at:new Date().toISOString(),browser:browser.version(),mobileEmulation:mobile,physicalMobile:false,productionAssets:process.env.PROFILE_PRODUCTION==='1',sourceRevision:revision||'working-tree',requestedQuality:process.env.PROFILE_QUALITY||'auto',gpuTimingProbe:process.env.PROFILE_GPU==='1',fixedDpr:Number(process.env.PROFILE_DPR)||null,accessory:process.env.PROFILE_ACCESSORY||'none',seconds,scenarios:[],errors};
let crowdTimer=null,crowdSending=null,ownerContext=null,showAdmin=null;
try{
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});ownerContext=context;const page=await context.newPage();
 if(process.env.PROFILE_QUALITY)await page.addInitScript(mode=>localStorage.setItem('winter-render-mode',mode),process.env.PROFILE_QUALITY);
 page.on('pageerror',e=>{errors.push(e.message.split('Call log:')[0].trim());console.log('PAGEERROR',e.message);});
 if(baseline.size)await page.route('**/*',r=>{const file=new URL(r.request().url()).pathname.slice(1)||'index.html';return baseline.has(file)?r.fulfill({contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/javascript',body:baseline.get(file)}):r.continue();});
 await page.route('**/park.js*',async route=>{const response=await route.fetch(),source=baseline.get('park.js')||await response.text();await route.fulfill({response,body:source.replaceAll('if(glowPass)glowPass.render(scene,camera);','if(window.__profileShowView){camera.position.set(18,31,94);camera.lookAt(0,59,-96);camera.fov=48;camera.updateProjectionMatrix();}if(glowPass)glowPass.render(scene,camera);').replace(/}\s*$/, ';window.__winterQA={renderer,scene,camera,experience,world,interiors,companion,renderBudget};\n}')} );});
 await page.addInitScript(gpuEnabled=>{
  // Same instrumentation for both revisions. Records the actual game callback,
  // not an independent RAF which could count a frozen game as smooth rendering.
  const raf=window.requestAnimationFrame.bind(window);let previous=0,gl=null,ext=null,serial=0;const pending=[];
  window.requestAnimationFrame=callback=>raf(now=>{
   const game=callback.name==='animate',q=window.__winterQA,record=window.__frameCapture;let query=null;
   if(game&&q&&!gl&&gpuEnabled){gl=q.renderer.getContext();ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');}
   if(game&&ext){const disjoint=gl.getParameter(ext.GPU_DISJOINT_EXT);while(pending.length&&(disjoint||gl.getQueryParameter(pending[0],gl.QUERY_RESULT_AVAILABLE))){const item=pending.shift();if(!disjoint&&window.__gpuCapture)window.__gpuCapture.push(gl.getQueryParameter(item,gl.QUERY_RESULT)/1e6);gl.deleteQuery(item);}if(record&&serial++%4===0&&pending.length<4){query=gl.createQuery();gl.beginQuery(ext.TIME_ELAPSED_EXT,query);}}
   const start=performance.now();callback(now);
   if(query){gl.endQuery(ext.TIME_ELAPSED_EXT);pending.push(query);}if(!game)return;
   if(record&&q&&!document.hidden&&!document.body.matches('.studio-open,.quiz-open,.chat-typing')){if(previous)record.push({ms:now-previous,cpu:performance.now()-start,calls:q.renderer.info.render.calls,triangles:q.renderer.info.render.triangles});}previous=now;
  });
 },process.env.PROFILE_GPU==='1');
 if(process.env.PROFILE_PREJOIN==='1'){const joined=await context.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'성능검증'}});if(!joined.ok())throw Error('Profile join '+joined.status());}
 await page.addInitScript(()=>{window.__startupTasks=[];new PerformanceObserver(list=>{for(const task of list.getEntries())window.__startupTasks.push({start:task.startTime,duration:task.duration});}).observe({type:'longtask',buffered:true});});
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');await cdp.send('Network.enable');let bytes=0,requests=0;cdp.on('Network.loadingFinished',e=>bytes+=e.encodedDataLength);cdp.on('Network.requestWillBeSent',()=>requests++);
 const start=Date.now();await page.goto(origin,{waitUntil:'domcontentloaded',timeout:180000});await page.waitForFunction(()=>window.__winterQA&&window.labSocialJoined,null,{timeout:120000});report.readyMs=Date.now()-start;report.startupTasks=await page.evaluate(()=>window.__startupTasks);report.maxStartupTaskMs=Math.max(0,...report.startupTasks.map(t=>t.duration));
 if(process.env.PROFILE_DPR)await page.evaluate(dpr=>{const r=__winterQA.renderer;r.setPixelRatio(dpr);r.setSize(innerWidth,innerHeight,false);},Number(process.env.PROFILE_DPR));
 if(process.env.PROFILE_ACCESSORY)await page.evaluate(accessory=>{window.labAppearance={...window.labAppearance,accessory};window.dispatchEvent(new CustomEvent('lab:appearance',{detail:window.labAppearance}));},process.env.PROFILE_ACCESSORY);
 report.environment=await page.evaluate(()=>{const r=window.__winterQA.renderer,gl=r.getContext(),d=gl.getExtension('WEBGL_debug_renderer_info');return{viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,gpu:d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):'UNKNOWN',gpuTimerAvailable:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')};});
 if(process.env.PROFILE_TREE_FRAME==='1'){
  await page.evaluate(()=>{const q=window.__winterQA;q.experience.cancel();q.companion.group.position.set(0,.95,100);window.dispatchEvent(new Event('lab:tree-open'));});await page.waitForTimeout(2500);
  report.treeFrame=await page.evaluate(async()=>{const T=await import('/vendor/three.module.js'),q=window.__winterQA,s=window.labPlayerState,dock=document.querySelector('#tree-tools').getBoundingClientRect(),top=new T.Vector3(0,33,80).project(q.camera),player=new T.Vector3(s.x,s.y,s.z).project(q.camera);return{crown:top.toArray(),playerY:(1-player.y)*innerHeight/2,dockTop:dock.top};});
  if(Math.abs(report.treeFrame.crown[0])>=1||Math.abs(report.treeFrame.crown[1])>=.92||report.treeFrame.playerY>=report.treeFrame.dockTop-12)throw Error('Tree framing hides the crown or player');
  await page.screenshot({path:output.replace(/\.json$/, '-tree-frame.png')});await page.locator('#tree-tools [data-close]').click();
 }
 await page.waitForTimeout(8000);report.startupBytes=bytes;
 const snapshot=()=>page.evaluate(()=>{const q=window.__winterQA;const gs=new Set(),ts=new Set();let geometryBytes=0,textureBytesEstimate=0;q.scene.traverse(o=>{if(o.geometry)gs.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])for(const v of Object.values(m))if(v?.isTexture)ts.add(v);});for(const g of gs){for(const a of Object.values(g.attributes))geometryBytes+=a.array.byteLength;geometryBytes+=g.index?.array.byteLength||0;}for(const t of ts){const i=t.image;if(i?.width&&i?.height)textureBytesEstimate+=i.width*i.height*4*(t.generateMipmaps?4/3:1);}return{memory:{...q.renderer.info.memory},programs:q.renderer.info.programs?.length,geometryBytes,textureBytesEstimate,heap:performance.memory?.usedJSHeapSize??null,dpr:q.renderer.getPixelRatio(),quality:q.renderBudget.settings,peers:document.querySelectorAll('#visitor-labels > .visitor-label').length,mode:window.labPlayerState?.mode,state:window.labPlayerState};});
 const crowdContexts=[];
 async function refreshCrowd(){for(let i=0;i<crowdContexts.length;i++){const response=await crowdContexts[i].request.post(origin+'/api/presence',{headers:{Origin:origin},data:{x:(i%4)*1.3-2,y:.95,z:20-Math.floor(i/4)*1.4,yaw:0,mode:'',color:'#faf1e8',accessory:process.env.PROFILE_ACCESSORY||'none',gesture:''}});if(!response.ok())throw Error('Crowd heartbeat '+response.status());}}
 const scenarios=[['plaza',()=>page.evaluate(()=>window.travelToIsland('park'))],['tree',()=>page.evaluate(()=>window.travelToPlace('tree',false))],['castle',()=>page.evaluate(()=>window.travelToIsland('park'))],['ferris',()=>ride('ferris')],['carousel',()=>ride('carousel')],['lift',()=>ride('ski')],['ski',async()=>{await page.evaluate(async()=>{const {skiStarts}=await import('/resort-layout.js'),p=skiStarts[0];window.__winterQA.experience.cancel();window.__winterQA.companion.group.position.set(p.x,p.y||40,p.z);});await page.waitForTimeout(1000);const button=page.locator('#place-actions button[aria-label="스키 타기"]');await button.click({timeout:5000});await page.keyboard.down('KeyW');}],['bath',()=>ride('onsen')],['spa-garden',()=>page.evaluate(()=>window.travelToPlace('onsen',false))],['onsen',()=>page.evaluate(()=>{window.__winterQA.experience.cancel();window.travelToPlace('sauna',false);return window.enterInterior('ryokan');})],['quiz',()=>page.evaluate(()=>window.travelToPlace('quiz',false))],['crowd',async()=>{await page.evaluate(()=>window.travelToIsland('park'));for(let i=0;i<11;i++){const client=await browser.newContext();crowdContexts.push(client);const join=await client.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'QA '+i,room:'winter-plaza'}});if(!join.ok())throw Error('Crowd join '+join.status());const response=await client.request.post(origin+'/api/presence',{headers:{Origin:origin},data:{x:(i%4)*1.3-2,y:.95,z:20-Math.floor(i/4)*1.4,yaw:0,mode:'',color:'#faf1e8',accessory:process.env.PROFILE_ACCESSORY||'none',gesture:''}});if(!response.ok())throw Error('Crowd position '+response.status());}await refreshCrowd();crowdTimer=setInterval(()=>{if(!crowdSending)crowdSending=refreshCrowd().catch(e=>errors.push(e.message.split('Call log:')[0].trim())).finally(()=>crowdSending=null);},4000);await page.waitForFunction(()=>document.querySelectorAll('#visitor-labels > .visitor-label').length===11,null,{timeout:20000});}]];
 const showOrigin=process.env.PROFILE_FIREWORKS_ADMIN_URL;
 if(showOrigin){
  if(!['localhost','127.0.0.1'].includes(new URL(showOrigin).hostname)||showOrigin===origin)throw Error('Use a separate local admin QA endpoint');
  showAdmin=await browser.newContext();const joined=await showAdmin.request.post(showOrigin+'/api/join',{headers:{Origin:showOrigin},data:{room:'winter-plaza',name:'성능관리자'}});if(!joined.ok())throw Error('QA admin join '+joined.status());
  scenarios.push(['fireworks',async()=>{await page.evaluate(()=>{travelToIsland('park');window.__profileShowView=true;});const r=await showAdmin.request.post(showOrigin+'/api/fireworks',{headers:{Origin:showOrigin},data:{action:'start'}});if(!r.ok())throw Error('QA fireworks start '+r.status());await page.waitForFunction(()=>labFireworks?.state==='playing');await page.waitForTimeout(23000);}],['fireworks-off',async()=>{const r=await showAdmin.request.post(showOrigin+'/api/fireworks',{headers:{Origin:showOrigin},data:{action:'stop'}});if(!r.ok())throw Error('QA fireworks stop '+r.status());await page.waitForFunction(()=>labFireworks?.state==='stopped');}]);
 }
 async function ride(id){await page.evaluate(id=>window.travelToPlace(id),id);await page.locator('#place-actions button').first().click({timeout:5000});await page.waitForTimeout(1200);}
 for(const [name,setup]of scenarios.filter(([name])=>!process.env.PROFILE_SCENARIOS||process.env.PROFILE_SCENARIOS.split(',').includes(name))){
  try{await page.keyboard.up('KeyW');await setup();await page.waitForTimeout(3000);const before=await snapshot(),cpuBefore=await cdp.send('Performance.getMetrics'),networkBefore={bytes,requests};await page.evaluate(()=>{window.__frameCapture=[];window.__gpuCapture=[];});await page.waitForTimeout(seconds*1000);
   const gpu=await page.evaluate(()=>window.__gpuCapture||[]);const frames=await page.evaluate(()=>{const f=window.__frameCapture;window.__frameCapture=null;return f;}),after=await snapshot(),cpuAfter=await cdp.send('Performance.getMetrics');const values=frames.map(f=>f.ms).filter(n=>n>0).sort((a,b)=>a-b),mean=k=>frames.reduce((sum,f)=>sum+f[k],0)/(frames.length||1),metric=(metrics,key)=>metrics.metrics.find(m=>m.name===key)?.value;
   report.scenarios.push({name,frames:frames.length,fps:values.length?1000/(values.reduce((a,b)=>a+b,0)/values.length):null,minFps:values.length?1000/values.at(-1):null,p95:values[Math.floor(values.length*.95)]??null,p99:values[Math.floor(values.length*.99)]??null,gameCpuMs:mean('cpu'),mainThreadMs:(metric(cpuAfter,'TaskDuration')-metric(cpuBefore,'TaskDuration'))*1000,calls:mean('calls'),triangles:mean('triangles'),before,after,network:{bytes:bytes-networkBefore.bytes,requests:requests-networkBefore.requests},gpuMs:gpu.length?gpu.reduce((a,b)=>a+b,0)/gpu.length:null,gpuSamples:gpu.length});
   if(name==='crowd'&&(before.peers!==11||after.peers!==11))throw Error('Expected 11 live remote peers throughout crowd capture');
   console.log(JSON.stringify({name,fps:report.scenarios.at(-1).fps,p95:report.scenarios.at(-1).p95}));
   if(['plaza','tree','onsen','spa-garden','bath'].includes(name))await page.screenshot({path:output.replace(/\.json$/,`-${name}.png`)});
  }catch(e){const diagnostic=await page.evaluate(()=>({peers:document.querySelectorAll('#visitor-labels > .visitor-label').length,status:document.querySelector('#social-status')?.textContent,room:document.querySelector('#room-code')?.value})).catch(()=>null);report.scenarios.push({name,error:e.message.split('Call log:')[0].trim(),diagnostic});console.log('SCENARIO ERROR',name,e.message,diagnostic);}
 }
 clearInterval(crowdTimer);await crowdSending;for(const client of crowdContexts){await client.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await client.close();}report.totalBytes=bytes;report.totalRequests=requests;
}finally{clearInterval(crowdTimer);await crowdSending;if(showAdmin){await showAdmin.request.post(process.env.PROFILE_FIREWORKS_ADMIN_URL+'/api/fireworks',{headers:{Origin:process.env.PROFILE_FIREWORKS_ADMIN_URL},data:{action:'stop'}}).catch(()=>{});await showAdmin.request.post(process.env.PROFILE_FIREWORKS_ADMIN_URL+'/api/leave',{headers:{Origin:process.env.PROFILE_FIREWORKS_ADMIN_URL},data:{}}).catch(()=>{});await showAdmin.close();}if(ownerContext)await ownerContext.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});await browser.close();await fs.mkdir(path.dirname(output),{recursive:true});await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');}

if(report.errors.length||report.scenarios.some(s=>s.error))process.exitCode=1;
