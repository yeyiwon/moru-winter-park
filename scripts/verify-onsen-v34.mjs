import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';
const origin=process.env.QA_URL||'http://127.0.0.1:4185',out=process.env.QA_OUTPUT||'qa/browser-v34/after';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Use isolated QA server');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report={checks:[],errors:[],physicalMobile:false},contexts=[];
async function open(mobile){const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});contexts.push(context);const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader|THREE|WebGL/.test(m.text()))report.errors.push(m.text());});
 page.on('response',async r=>{if(r.url().endsWith('/api/presence')&&r.status()===400)report.errors.push('presence400 '+await r.text());});
 await page.route('**/park.js*',async r=>{const s=await r.fetch();await r.fulfill({response:s,body:(await s.text()).replace('if(glowPass)glowPass.render(scene,camera);','if(window.__shot){camera.position.fromArray(window.__shot.position);camera.lookAt(...window.__shot.target);camera.updateMatrixWorld();}if(glowPass)glowPass.render(scene,camera);').replace(/}\s*$/,';window.__qa={scene,camera,renderer,experience,world,fluff,walkTo:moveTo};}')});});
 await page.goto(origin,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__qa&&window.labSocialJoined,null,{timeout:90000});await page.evaluate(()=>window.travelToIsland('spa'));await page.waitForTimeout(1200);return page;
}
async function walk(page,p){await page.evaluate(p=>window.__qa.walkTo(p.x,p.z),p);await page.waitForFunction(p=>Math.hypot(window.labPlayerState.x-p.x,window.labPlayerState.z-p.z)<.3,p,{timeout:30000});await page.waitForTimeout(400);}
async function sample(page){return page.evaluate(async()=>{const T=await import('/vendor/three.module.js'),q=window.__qa,p=window.labPlayerState,ndc=q.fluff.position.clone().add(new T.Vector3(0,.2,0)).project(q.camera);return{...p,ndc:ndc.toArray(),camera:q.camera.position.toArray(),lifecycle:q.experience.lifecycle.state};});}
async function shot(page,name,view){await page.evaluate(v=>window.__shot=v,view||null);await page.waitForTimeout(300);await page.screenshot({path:out+'/'+name+'.png'});await page.evaluate(()=>window.__shot=null);}
const check=(name,data)=>{report.checks.push({name,...data});console.log(name);};
try{
 for(const mobile of [false,true]){const page=await open(mobile),device=mobile?'mobile':'desktop',entries=await page.evaluate(async()=> (await import('/onsen-layout.js')).onsenEntrances);
  for(const [id,b]of Object.entries(entries)){
   await walk(page,id==='bath'?{x:b.access.x+.7,z:b.access.z-.5}:{x:b.access.x-.5,z:b.access.z+.6});
   const use=page.getByRole('button',{name:'온천 이용하기',exact:true});await use.waitFor({state:'visible'});await shot(page,device+'-'+id+'-entrance');
   const entry=[];await use[mobile?'tap':'click']();for(let i=0;i<30;i++){await page.waitForTimeout(100);entry.push(await sample(page));}
   assert.equal(entry.at(-1).mode,'bath');assert.equal(entry.at(-1).lifecycle,'Active');assert.ok(entry.some(p=>p.lifecycle==='Entering'));assert.ok(entry.every(p=>p.camera[1]>.65));
   const transitionPose=entry.find(p=>p.y>.4&&p.y<.8);assert.ok(transitionPose);const approval=await page.context().request.post(origin+'/api/presence',{headers:{Origin:origin},data:{...transitionPose,color:'#faf1e8',accessory:'none'}});assert.equal(approval.status(),200,'server accepts actual descending steps');
   const initial=await sample(page);
   if(mobile){const joy=await page.locator('#joystick').boundingBox(),cdp=await page.context().newCDPSession(page),finger={id:1,x:joy.x+joy.width/2,y:joy.y+joy.height/2};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});finger.x+=22;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[finger]});await page.waitForTimeout(350);const orbitFinger={id:2,x:170,y:320};await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger,orbitFinger]});orbitFinger.x+=26;await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[finger,orbitFinger]});await page.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
   else{await page.keyboard.down('KeyD');await page.waitForTimeout(1000);await page.keyboard.up('KeyD');}
   const moved=await sample(page);assert.ok(Math.hypot(initial.x-moved.x,initial.z-moved.z)>.4);assert.ok(Math.abs(moved.ndc[0])<1&&Math.abs(moved.ndc[1])<1);
   const ripples=await page.evaluate(()=>{const result=[];window.__qa.scene.traverse(o=>{if(o.name==='recessed-hot-spring')result.push(o.material.uniforms.ripples.value.filter(p=>p.w>0&&o.material.uniforms.time.value-p.z<4).length);});return result;});assert.ok(ripples.some(n=>n>0));await shot(page,device+'-'+id+'-water');
   await page.waitForTimeout(3900);const settled=await page.evaluate(()=>{let recent=0;window.__qa.scene.traverse(o=>{if(o.name==='recessed-hot-spring')recent+=o.material.uniforms.ripples.value.filter(p=>p.w>0&&o.material.uniforms.time.value-p.z<3.6).length;});return recent;});assert.equal(settled,0,'standing does not endlessly emit ripples');
   await page.locator('#stop-ride')[mobile?'tap':'click']();await page.waitForFunction(()=>!window.__qa.experience.active,null,{timeout:12000});await page.waitForTimeout(600);const exited=await sample(page);assert.equal(exited.mode,'');assert.ok(Math.hypot(exited.x-b.access.x,exited.z-b.access.z)<.15);assert.equal(await page.locator('#ride-hud').isVisible(),false);assert.equal(await use.isVisible(),false,'finished prompt dismissed');
   const response=await page.context().request.post(origin+'/api/presence',{headers:{Origin:origin},data:{...moved,color:'#faf1e8',accessory:'none'}});assert.equal(response.status(),200,'server accepts bath pose');
   check(device+' '+id+' approach, enter, move, settle, exit',{entry,initial,moved,exited,ripples});
  }
  if(!mobile){await page.evaluate(()=>window.travelToPlace('onsen',false));await page.waitForTimeout(800);for(const [name,local]of [['front',[-18.7,3,127]],['side',[-24,3.2,136]],['top',[-18.5,9,133]]]){const view=await page.evaluate(async local=>{const {spaToWorld}=await import('/spa-transform.js');const p=spaToWorld({x:local[0],z:local[2]}),q=spaToWorld({x:-18.7,z:135.1});return{position:[p.x,local[1],p.z],target:[q.x,1.2,q.z]};},local);await shot(page,'waterfall-'+name+'-a',view);await page.waitForTimeout(550);await shot(page,'waterfall-'+name+'-b',view);}
   await shot(page,'bath-overview',await page.evaluate(async()=>{const {spaToWorld}=await import('/spa-transform.js'),p=spaToWorld({x:-24,z:105}),q=spaToWorld({x:-10,z:124});return{position:[p.x,10,p.z],target:[q.x,.4,q.z]};}));
   await page.evaluate(()=>window.travelToPlace('sauna',false));await page.getByRole('button',{name:'입장',exact:true}).click();await page.waitForFunction(()=>window.labInterior==='ryokan');await shot(page,'ryokan-regression');await page.evaluate(()=>window.exitInterior());await page.waitForFunction(()=>!window.labInterior);check('existing ryokan entry and exit preserved',{});
  }
  await page.context().request.post(origin+'/api/leave',{data:{}});await page.context().close();contexts.splice(contexts.indexOf(page.context()),1);
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}finally{for(const c of contexts){await c.request.post(origin+'/api/leave',{data:{}}).catch(()=>{});await c.close();}await browser.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));}
