// Actual elapsed-time lift rides and native Chrome touch events; physical phones are not emulated hardware.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4191',out=process.env.QA_OUTPUT||'qa/alpine-v48';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Use an isolated localhost verification server');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const report={environment:'macOS headless Chrome; desktop 1280x800 and touch 390x844, DPR 1',physicalMobileVerified:false},errors=[];
async function open(name,mobile){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().includes('/api/'))errors.push(r.status()+' '+new URL(r.url()).pathname);});
 await page.route('**/__dev/events',r=>r.abort());
 await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/}\s*$/, ';window.__winterQA={experience,world,companion,placePlayer,joy,touchControls,renderer,scene,camera};\n}')});});
 await context.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name}});await page.goto(origin,{timeout:180000});await page.waitForFunction(()=>window.__winterQA&&window.labSocialJoined,null,{timeout:180000});console.log(name+' ready');return page;
}
async function board(page,kind){
 await page.evaluate(async kind=>{const m=await import('/resort-layout.js'),v=m.resortRides[kind].points[0],p={x:v[0],z:v[2]+6};__winterQA.experience.cancel();__winterQA.placePlayer(p,0);__winterQA.experience.proximity(p.x,p.z);__winterQA.experience.show(kind==='lift'?'ski':kind);window.__boardingEntry=p;},kind);
 await page.waitForFunction(()=>Math.hypot(labPlayerState.x-__boardingEntry.x,labPlayerState.z-__boardingEntry.z)<.1);
 await page.locator('#place-actions button').click();await page.waitForFunction(()=>!!window.labRideReservation,null,{timeout:10000});
 return page.evaluate(async()=>({startedAt:labRideReservation.startedAt,kind:labRideReservation.kind,duration:(await import('/resort-layout.js')).resortRides[labRideReservation.kind].duration}));
}
function ensure(value,message){if(!value)throw Error(message);}
try{
 const a=await open('왼쪽탑승검증',false);report.left=await board(a,'lift');
 const b=await open('오른쪽터치검증',true);report.right=await board(b,'upperlift');
 const cdp=await b.context().newCDPSession(b),touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(p=>({...p,radiusX:4,radiusY:4,force:1}))});
 const initial=await b.evaluate(()=>getWinterCameraState().yaw);await touch('touchStart',[{id:2,x:280,y:320}]);await touch('touchMove',[{id:2,x:330,y:340}]);await touch('touchEnd',[]);await b.waitForTimeout(1000);
 ensure(Math.abs((await b.evaluate(()=>getWinterCameraState().yaw))-initial)>.1,'Lift camera did not respond to touch');
 let leftDone=false;while(Date.now()<report.right.startedAt+(report.right.duration+4)*1000){
  await b.waitForTimeout(5000);
  if(!leftDone&&Date.now()>report.left.startedAt+(report.left.duration+3)*1000){report.left.exit=await a.evaluate(()=>({pose:labPlayerState,reservation:labRideReservation}));ensure(report.left.exit.pose.mode==='summit'&&!report.left.exit.reservation,'Left lift dismount failed');await a.screenshot({path:out+'/left-lift-arrival.png'});await a.evaluate(async()=>{(await import('/ski-map.js')).openSkiMap();});leftDone=true;console.log('left lift arrived');}
 }
 report.right.exit=await b.evaluate(()=>({pose:labPlayerState,reservation:labRideReservation}));ensure(report.right.exit.pose.mode==='summit'&&!report.right.exit.reservation,'Right lift dismount failed');await b.screenshot({path:out+'/mobile-right-lift-arrival.png'});
 await a.context().close();
 report.ridge=await board(b,'ridgelift');console.log('middle lift departed');await b.screenshot({path:out+'/mobile-ridge-departure.png'});while(Date.now()<report.ridge.startedAt+(report.ridge.duration+4)*1000)await b.waitForTimeout(5000);report.ridge.exit=await b.evaluate(()=>({pose:labPlayerState,reservation:labRideReservation}));ensure(report.ridge.exit.pose.mode==='summit'&&!report.ridge.exit.reservation,'Mid-mountain lift dismount failed');await b.screenshot({path:out+'/mobile-ridge-arrival.png'});
 await b.evaluate(async()=>{const m=await import('/resort-layout.js'),p=m.skiStarts.find(p=>p.id==='curve');__winterQA.experience.cancel();__winterQA.placePlayer(p,0);__winterQA.experience.proximity(p.x,p.z);__winterQA.experience.show('slope-curve');});
 await b.locator('#place-actions button[aria-label="스노보드"]').click();await b.waitForFunction(()=>labPlayerState.mode==='ski');
 const rect=await b.locator('#joystick').boundingBox(),cx=rect.x+rect.width/2,cy=rect.y+rect.height/2,joy={id:1,x:cx,y:cy-rect.height};
 await touch('touchStart',[{id:1,x:cx,y:cy}]);await touch('touchMove',[joy]);await b.waitForTimeout(4000);
 report.outsideRing=await b.evaluate(()=>({magnitude:__winterQA.joy.length(),speed:labPlayerState.speed}));ensure(report.outsideRing.magnitude>.99&&report.outsideRing.speed>1,'Full joystick input lost outside boundary');
 const before=await b.evaluate(()=>getWinterCameraState().yaw);await touch('touchStart',[joy,{id:2,x:280,y:330}]);await touch('touchMove',[joy,{id:2,x:325,y:345}]);await b.waitForTimeout(500);
 report.multitouch=await b.evaluate(()=>({magnitude:__winterQA.joy.length(),yaw:getWinterCameraState().yaw}));ensure(report.multitouch.magnitude>.99&&Math.abs(report.multitouch.yaw-before)>.1,'Camera stole joystick input');await touch('touchEnd',[]);
 const brake=await b.locator('#brake-button').boundingBox();ensure(brake,'Missing brake button');await touch('touchStart',[{id:3,x:brake.x+brake.width/2,y:brake.y+brake.height/2}]);await b.waitForTimeout(1500);report.brake=await b.evaluate(()=>({held:__winterQA.touchControls.braking,speed:labPlayerState.speed}));ensure(report.brake.held&&report.brake.speed<report.outsideRing.speed,'Brake did not slow the board');await touch('touchEnd',[]);
 await touch('touchStart',[{id:1,x:cx,y:cy}]);await touch('touchMove',[joy]);await b.waitForTimeout(2000);await touch('touchEnd',[]);
 await b.evaluate(()=>{window.__maxAir=0;window.__airUntil=performance.now()+3000;function sample(){__maxAir=Math.max(__maxAir,labPlayerState.air);if(performance.now()<__airUntil)requestAnimationFrame(sample);}sample();});
 await b.locator('#jump-button').tap();await b.waitForTimeout(2000);report.jump=await b.evaluate(()=>({maxAir:__maxAir,currentAir:labPlayerState.air,gear:__winterQA.companion.gear}));ensure(report.jump.maxAir>0&&report.jump.currentAir===0&&report.jump.gear==='board','Mobile jump/landing/gear check failed');
 await b.screenshot({path:out+'/mobile-board.png'});await b.locator('#stop-ride').tap();await b.waitForTimeout(700);report.stop=await b.evaluate(()=>({pose:labPlayerState,gear:__winterQA.companion.gear,input:__winterQA.joy.length()}));ensure(!report.stop.pose.mode&&report.stop.gear==='none'&&report.stop.input===0,'Stopping left ski state active');
 await b.evaluate(async()=>{(await import('/ski-map.js')).openSkiMap();});await b.screenshot({path:out+'/mobile-ski-map.png'});
 ensure(errors.length===0,'Browser/API errors occurred');console.log('mobile and both lifts passed');
}catch(error){report.failure=error.message;process.exitCode=1;console.error(error.stack);}finally{report.errors=errors;await fs.writeFile(out+'/mobile-controls.json',JSON.stringify(report,null,2));await browser.close();}
