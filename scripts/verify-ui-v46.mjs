// Isolated local data only. Chrome's mobile viewport is not a physical phone.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const out='qa/operations-v46',origin=process.env.UI_ORIGIN||'http://127.0.0.1:4189';if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local data only');await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const report={at:new Date().toISOString(),physicalMobile:false,checks:[],errors:[]};
const check=(name,ok,details)=>{report.checks.push({name,ok,details});console.log(ok?'PASS':'FAIL',name);if(!ok)throw Error(name);};
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/park.js*',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace(/}\s*$/, ';window.__qa={camera,renderer,companion,experience};\n}')});});
 await page.goto(origin);await page.waitForFunction(()=>window.labSocialJoined&&window.__qa&&document.body.classList.contains('world-ready'),null,{timeout:120000});await page.locator('#world-loading').waitFor({state:'hidden',timeout:30000});
 const touch=await context.newCDPSession(page);
 const joy=await page.locator('#joystick').boundingBox(),center={x:joy.x+joy.width/2,y:joy.y+joy.height/2,id:1};
 const ring=()=>page.evaluate(()=>{const s=getComputedStyle(document.querySelector('#joystick'),'::before');return [s.left,s.top,s.transform];});
 const before=await ring();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...center,x:center.x+15}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...center,x:center.x+95,y:center.y-70}]});await page.waitForFunction(()=>labPlayerState.speed>4,null,{timeout:2500});
 check('fixed joystick ring, moving knob and full diagonal speed',JSON.stringify(before)===JSON.stringify(await ring())&&await page.evaluate(()=>document.querySelector('.joystick-stick').style.transform.includes('calc(')),{speed:await page.evaluate(()=>labPlayerState.speed)});
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>labPlayerState.speed<.1);
 await page.locator('#chat-toggle').click();await page.locator('#chat-input').fill('모바일 채팅 확인');await page.waitForTimeout(300);
 const chat=await page.evaluate(()=>({icons:['#hud-map','#chat-toggle','#emote-toggle','#joystick'].map(s=>getComputedStyle(document.querySelector(s)).visibility),box:document.querySelector('#chat-form').getBoundingClientRect().toJSON(),send:document.querySelector('#chat-form [type=submit]').getBoundingClientRect().toJSON()}));
 check('chat owns space without overlapping HUD icons',chat.icons.every(v=>v==='hidden')&&chat.box.right<=390&&chat.send.width<=44,chat);await page.screenshot({path:out+'/mobile-chat.png'});
 await page.locator('#chat-form [type=submit]').click();await page.waitForFunction(()=>document.querySelector('#chat-form').hidden&&!document.body.classList.contains('chat-typing'));
 await page.evaluate(()=>openWinterSettings('fluff'));await page.waitForTimeout(650);
 const panelBefore=await page.locator('#studio').boundingBox();await page.locator('#profile-edit').click();const panelAfter=await page.locator('#studio').boundingBox();
 check('nickname editor preserves panel dimensions',panelBefore.width===panelAfter.width&&panelBefore.height===panelAfter.height);
 check('mobile preview is larger and fur-length control removed',await page.evaluate(()=>document.querySelector('#fluff-preview').getBoundingClientRect().height>=200&&!document.querySelector('#fur-length')));
 await page.screenshot({path:out+'/mobile-nickname.png'});await page.keyboard.press('Escape');await page.keyboard.press('Escape');await page.waitForTimeout(400);
 await page.evaluate(()=>travelToPlace('tree'));await page.waitForTimeout(1000);const original=await page.evaluate(()=>getWinterCameraState());await page.locator('#place-actions button').first().click();await page.waitForTimeout(4500);
 const projection=await page.evaluate(async()=>{const T=await import('/vendor/three.module.js'),v=new T.Vector3(0,33,80).project(__qa.camera);return{x:v.x,y:v.y,eye:getWinterCameraState().eye};});
 check('tree crown visible above decoration dock',Math.abs(projection.x)<1&&Math.abs(projection.y)<.94,projection);await page.screenshot({path:out+'/mobile-tree.png'});
 // Tap the real upper canopy, not the helper API; server storage must retain height.
 const upper=await page.evaluate(async()=>{const T=await import('/vendor/three.module.js'),p=new T.Vector3(0,25,80).project(__qa.camera);return{x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};});
 const saved=page.waitForResponse(r=>r.url().endsWith('/api/tree')&&r.request().method()==='POST');await page.touchscreen.tap(upper.x,upper.y);const mutation=await saved;check('upper-canopy tap saves ornament',mutation.ok(),{height:mutation.request().postDataJSON().height});check('upper-canopy placement is not restricted to lower branches',mutation.request().postDataJSON().height>20);
 await page.waitForTimeout(1100);await page.evaluate(()=>openWishComposer({kind:'heart',color:'#df91aa'}));await page.locator('#wish-form textarea').fill('함께 만드는 겨울');await page.locator('#wish-form [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#wish-panel').open||document.querySelector('#wish-form output[role=status]').textContent);check('wish submission closes composer',await page.evaluate(()=>!document.querySelector('#wish-panel').open),await page.locator('#wish-form output[role=status]').textContent());
 await page.evaluate(()=>openWishList());await page.waitForFunction(()=>document.querySelector('#wish-list img.ornament-thumbnail')?.complete&&document.querySelector('#wish-list img').naturalWidth===96);check('wish list shows real ornament-rendered thumbnail',true);await page.screenshot({path:out+'/mobile-wishes.png'});
 await page.locator('#wish-feed .icon-button').click();await page.locator('#tree-tools [data-close]').click();await page.waitForTimeout(1800);const restored=await page.evaluate(()=>getWinterCameraState());
 check('tree close restores unmodified user view',Math.abs(restored.distance-original.distance)<.01&&Math.abs(restored.pitch-original.pitch)<.01);
 await page.evaluate(()=>travelToIsland('park'));await page.waitForTimeout(700);
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:280,y:610,id:2}]});await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:280,y:170,id:2}]});await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(2000);
 const sky=await page.evaluate(()=>getWinterCameraState());check('manual drag can look up at sky without camera going underground',sky.pitch<0&&sky.aim.y>sky.eye.y&&sky.eye.y>0,sky);await page.screenshot({path:out+'/mobile-sky.png'});
 await page.evaluate(async()=>{const {benchInteractions}=await import('/bench-layout.js'),p=benchInteractions.find(b=>b.id==='tree-bench-0');resetWinterCamera();__qa.experience.cancel();__qa.companion.group.position.set(p.x,.95,p.z);});await page.waitForTimeout(800);
 const actions=await page.locator('#place-actions button').evaluateAll(buttons=>buttons.map(b=>b.getAttribute('aria-label')));check('tree bench has one automatic sit action',actions.length===1&&actions[0]==='앉기',actions);
 const stable=[];for(let i=0;i<6;i++){stable.push(await page.locator('#place-card').boundingBox());await page.waitForTimeout(80);}check('nearby action no longer changes height each frame',stable.every(r=>r&&r.height===stable[0].height),stable);
 await page.locator('#place-actions button').click();await page.waitForFunction(()=>window.labRideReservation?.kind==='bench');check('automatic bench reservation from real UI',await page.evaluate(()=>[0,1].includes(window.labRideReservation.seat)));await page.locator('.interaction-exit-control').click();await page.waitForFunction(()=>!window.labRideReservation);
 check('no browser exceptions',!report.errors.length,report.errors);
 await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});
}finally{await fs.writeFile(out+'/ui.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
