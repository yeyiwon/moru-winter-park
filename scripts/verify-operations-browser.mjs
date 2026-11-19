import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin='http://127.0.0.1:4189',owner='http://127.0.0.1:4190',out=process.env.QA_OUTPUT||'qa/operations-v46';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']});
const report={at:new Date().toISOString(),browser:browser.version(),physicalMobile:false,errors:[],consoleErrors:[],httpErrors:[],expectedNetworkFaults:[],checks:[]};
const check=(name,ok,details)=>{report.checks.push({name,ok,...(details?{details}:{})});if(!ok)throw Error(name);};
const offlinePages=new WeakSet();
async function pageFor(options={}){const context=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block',...options}),page=await context.newPage();page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()!=='error')return;const error={text:message.text(),url:message.location().url};if(offlinePages.has(page)&&/ERR_INTERNET_DISCONNECTED/.test(error.text))report.expectedNetworkFaults.push(error);else report.consoleErrors.push(error);});page.on('response',response=>{if(response.status()>=400)report.httpErrors.push({path:new URL(response.url()).pathname,status:response.status()});});return page;}
async function enter(page,url){await page.bringToFront();await page.goto(url,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.labSocialJoined&&document.body.classList.contains('world-ready'),null,{timeout:120000});try{await page.locator('#world-loading').waitFor({state:'hidden',timeout:30000});}catch(error){console.error('Loading diagnostics',await page.evaluate(()=>({hidden:document.hidden,stage:document.querySelector('#loading-stage')?.textContent,error:document.querySelector('.loading-error')?.textContent})));throw error;}}
try{
 const a=await pageFor(),b=await pageFor({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 // The game deliberately pauses rendering in hidden tabs. Linux headless
 // Chromium marks the first page hidden when the second context is opened.
 await enter(a,origin);await enter(b,origin);await a.bringToFront();await a.waitForFunction(()=>document.querySelectorAll('#visitor-labels > .visitor-label').length>=1,null,{timeout:20000});
 await b.bringToFront();await b.waitForFunction(()=>document.querySelectorAll('#visitor-labels > .visitor-label').length>=1,null,{timeout:20000});
 check('public guest entry and two rendered peers',await b.evaluate(()=>!!labGuestId&&document.querySelectorAll('#visitor-labels > .visitor-label').length>=1));
 await a.bringToFront();
 await a.keyboard.down('KeyD');await a.waitForTimeout(1300);await a.keyboard.up('KeyD');
 const pos=await a.evaluate(()=>({...labPlayerState}));await b.waitForTimeout(1000);
 check('walking updates through WebSocket',Math.abs(pos.x)>.1,pos);
 // CDP touch dispatch does not focus a background page as mouse/keyboard do.
 // A real phone remains visible; background tabs intentionally release input.
 await b.bringToFront();
 const joy=await b.locator('#joystick').boundingBox(),touch=await b.context().newCDPSession(b);
 const center={x:joy.x+joy.width/2,y:joy.y+joy.height/2,id:1};
 await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[center]});
 await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...center,x:center.x+95,y:center.y-70}]});await b.waitForTimeout(700);
 const touchState=await b.evaluate(()=>({pose:labPlayerState,hidden:document.hidden,body:document.body.className,active:document.querySelector('#joystick').classList.contains('active'),knob:document.querySelector('.joystick-stick').style.transform}));
 check('mobile joystick beyond rim keeps full walking input',touchState.pose.speed>4&&touchState.pose.speed<4.5,touchState);
 await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await b.waitForTimeout(500);
 check('mobile touch release stops movement',await b.evaluate(()=>labPlayerState.speed<.1));
 await a.bringToFront();
 for(const [place,mode]of [['ferris','ferris'],['ski','lift']]){
  await a.evaluate(id=>travelToPlace(id),place);await a.locator('#place-actions button').first().click();
  await a.waitForFunction(m=>labPlayerState.mode===m,mode,{timeout:15000});await a.waitForTimeout(2500);
  check(place+' reservation and motion survive live validation',await a.evaluate(m=>labPlayerState.mode===m&&!!labRideReservation,mode));
  await a.locator('.interaction-exit-control').click();await a.waitForFunction(()=>!labPlayerState.mode);
 }
 await a.evaluate(()=>travelToIsland('park'));
 const response=await a.request.post(origin+'/api/chat',{headers:{Origin:origin},data:{message:'실시간 공유 확인'}});check('chat persisted',response.ok());
 await b.waitForFunction(()=>document.querySelector('#chat-log').textContent.includes('실시간 공유 확인'),null,{timeout:12000});check('chat visible on other device',true);
 check('guest admin API denied',(await a.request.get(origin+'/api/operations')).status()===403);
 await a.evaluate(()=>openWinterSettings('activities'));await a.locator('#firework-request').click();await a.waitForFunction(()=>!!labFireworks?.id);
 const show=await a.evaluate(()=>labFireworks);await b.waitForFunction(id=>labFireworks?.id===id,show.id,{timeout:15000});check('same server countdown and seed',await b.evaluate(s=>labFireworks.seed===s.seed&&labFireworks.startsAt===s.startsAt,show));
 await a.screenshot({path:out+'/desktop-activities.png'});
 await b.bringToFront();await b.evaluate(()=>openWinterSettings('fluff'));await b.screenshot({path:out+'/mobile-customization.png'});
 const overflow=await b.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth,dialog:(()=>{const r=document.querySelector('#studio').getBoundingClientRect();return r.left<0||r.right>innerWidth||r.top<0||r.bottom>innerHeight+1;})()}));check('mobile panel inside viewport',!overflow.page&&!overflow.dialog,overflow);
 await b.evaluate(()=>openWinterSettings('map'));await b.screenshot({path:out+'/mobile-map.png'});
 await b.setViewportSize({width:844,height:390});await b.waitForTimeout(800);await b.screenshot({path:out+'/mobile-landscape.png'});check('landscape panel inside viewport',await b.evaluate(()=>{const r=document.querySelector('#studio').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight+1;}));
 offlinePages.add(b);await b.context().setOffline(true);await b.waitForTimeout(13000);await b.context().setOffline(false);await b.evaluate(()=>window.dispatchEvent(new Event('online')));await b.waitForFunction(()=>document.querySelector('#social-status').textContent.includes('접속 중'),null,{timeout:45000});check('offline reconnection',true);offlinePages.delete(b);
 const admin=await pageFor();await enter(admin,owner+'/admin');await admin.waitForFunction(()=>document.querySelector('#admin-panel')?.open,null,{timeout:15000});await admin.locator('[data-refresh]').click();await admin.waitForTimeout(1500);
 const metrics=await admin.request.get(owner+'/api/operations');const data=await metrics.json();check('admin metrics with authenticated sockets',metrics.ok()&&data.service==='healthy'&&data.realtime.connections>=3,{connections:data.realtime?.connections,service:data.service});
 await admin.screenshot({path:out+'/admin.png'});const stop=await admin.request.post(owner+'/api/fireworks',{headers:{Origin:owner},data:{action:'stop'}});check('owner controls same show',stop.ok());
 check('no browser exceptions',report.errors.length===0,report.errors);check('no unexpected console or shader errors',report.consoleErrors.length===0,report.consoleErrors);
}finally{await fs.writeFile(out+'/browser.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
