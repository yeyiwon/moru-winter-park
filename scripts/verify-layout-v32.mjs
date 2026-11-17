import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const {chromium}=await import('/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs');
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4184',out=process.env.QA_LAYOUT_OUT||'qa/browser-v32/layout';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report={routes:[],errors:[],physicalMobile:false};
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/park.js*',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('if(glowPass)glowPass.render(scene,camera);',"if(window.__qaOverview){camera.position.set(-110,300,280);camera.lookAt(-10,0,-70);camera.updateMatrixWorld();}if(glowPass)glowPass.render(scene,camera);");body=body.replace(/}\s*$/,';window.__winterQA={camera,fluff,renderer,walkTo:moveTo,setPosition:p=>{experience.cancel();placePlayer(p,0);},state:()=>({route:route.length,velocity:velocity.toArray(),camera:camera.position.toArray(),player:fluff.position.toArray()})};}');await route.fulfill({response,body});});
 await page.goto(origin,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__winterQA&&window.labSocialJoined,null,{timeout:90000});
 if(!mobile){await page.evaluate(()=>window.__qaOverview=true);await page.waitForTimeout(1000);await page.screenshot({path:out+'/overview.png'});await page.evaluate(()=>window.__qaOverview=false);}
 const regions=await page.evaluate(async()=>(await import('/region-layout.js')).regions);
 for(const [from,to]of [['park','ski'],['ski','spa'],['park','tree'],['park','museum'],['park','spa']].filter(pair=>!process.env.QA_ROUTE||pair.join('-')===process.env.QA_ROUTE)){
  await page.evaluate(p=>window.__winterQA.setPosition(p),regions[from].arrival);await page.waitForTimeout(200);const goal=regions[to].arrival;await page.evaluate(p=>window.__winterQA.walkTo(p.x,p.z),goal);
  const start=Date.now();let complete=false,minClearance=Infinity,framing=[],last;
  for(let i=0;i<200;i++){
   await page.waitForTimeout(400);last=await page.evaluate(async()=>{const q=window.__winterQA,{surfaceHeight}=await import('/world-layout.js'),{canStandAt}=await import('/movement.js'),p=q.fluff.position,screen=p.clone().project(q.camera);return{...q.state(),safe:canStandAt(p.x,p.z),ground:surfaceHeight(p.x,p.z),screen:screen.toArray()};});
   assert.ok(last.safe,`${from}-${to} collision`);assert.ok(Math.abs(last.player[1]-last.ground-.86)<.05);assert.ok(last.camera.every(Number.isFinite));minClearance=Math.min(minClearance,last.player[1]-last.ground);framing.push(last.screen);
   if(i===20)await page.screenshot({path:out+`/${mobile?'mobile':'pc'}-${from}-${to}-crossing.png`});
   if(Math.hypot(last.player[0]-goal.x,last.player[2]-goal.z)<.3&&last.route===0){complete=true;break;}
  }
  const record={mobile,from,to,complete,seconds:(Date.now()-start)/1000,minClearance,visibleSamples:framing.filter(p=>Math.abs(p[0])<1&&Math.abs(p[1])<1&&Math.abs(p[2])<1).length,samples:framing.length,last};report.routes.push(record);console.log(JSON.stringify(record));await page.screenshot({path:out+`/${mobile?'mobile':'pc'}-${to}-arrival.png`});assert.ok(complete,`${from}-${to} failed to finish`);
 }
 await context.request.post(origin+'/api/leave',{data:{}});await context.close();
}assert.deepEqual(report.errors,[]);}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}finally{await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));await browser.close();}
