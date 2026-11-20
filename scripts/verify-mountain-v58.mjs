import fs from 'node:fs/promises';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4196',label=process.env.QA_LABEL||'after',mobile=process.env.QA_MOBILE==='1',out=`qa/mountain-v58/${label}-${mobile?'mobile':'desktop'}`;
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Isolated local verification only');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding']}),page=await browser.newPage({viewport:mobile?{width:412,height:915}:{width:1280,height:800},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile}),report={environment:'Mac Chrome GPU; '+(mobile?'412x915 DPR3 touch emulation':'1280x800 desktop'),label,physicalWindowsGalaxy:'UNKNOWN',views:[],errors:[]};
page.on('pageerror',e=>report.errors.push(e.message));await page.route('**/__dev/events',r=>r.abort());
await page.addInitScript(()=>{localStorage.setItem('winter-render-mode','auto');localStorage.setItem('lab-music','off');});
await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('localLights.update(dt,camera,target);','if(window.__mountainView){camera.position.set(...__mountainView.eye);camera.lookAt(...__mountainView.aim);}localLights.update(dt,camera,target);').replace(/}\s*$/,';window.__mountainQA={scene,camera,renderer,renderBudget,placePlayer,world};\n}')});});
try{
 await page.context().request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'설산검증'}});await page.goto(origin,{timeout:180000});await page.waitForFunction(()=>window.__mountainQA&&window.labSocialJoined,null,{timeout:180000});
 const views=await page.evaluate(async()=>{
  const m=await import('/resort-layout.js'),p=m.peakSummit,s=m.skiStarts[0],h=m.alpineHeight;
  const view=(id,x,z,dx,dz,dy=3,lookDown=0)=>({id,x,z,eye:[x,h(x,z)+dy,z],aim:[x+dx,h(x,z)+dy+lookDown,z+dz]});
  const cable=(id,pt)=>({id,x:pt[0],z:pt[2],eye:[pt[0]+4,pt[1]+3,pt[2]+8],aim:[pt[0]-5,pt[1]+4,pt[2]-90]});
  const z1=s.z+145,z2=(s.z+m.skiRuns[0].finish)/2,g=m.resortRides.gondola.points;
  return [view('01-base-uphill',-65,m.gondolaEntry.z+30,-15,-320,5,70),cable('02-chairlift',m.upperLiftPoint(.68)),cable('03-gondola',g[Math.floor(g.length*.72)]),view('04-summit-arrival',m.resortRides.gondola.exit[0],m.resortRides.gondola.exit[2],45,70,5,-8),view('05-summit-start',s.x-16,s.z-20,25,95,7,-10),view('06-summit-downhill',s.x,s.z+5,18,160,6,-34),view('07-first-turn',m.skiRunCenter(z1),z1,20,120,5,-25),view('08-middle-run',m.skiRunCenter(z2),z2,-20,140,5,-22),view('09-lower-base',20,m.gondolaEntry.z+70,-45,-210,5,38),{id:'10-castle-mountain',x:0,z:22,eye:[0,4,48],aim:[0,47,-200]},view('12-middle-concourse',m.middleSummit.x+23,m.middleSummit.z+12,25,-35,4,0),{id:'11-peak-ridge',x:p.x,z:p.z,eye:[p.x+55,p.height+16,p.z+45],aim:[p.x-60,p.height+8,p.z-55]}];
 });
 for(const view of views.filter(v=>!process.env.QA_VIEW_FILTER||v.id.includes(process.env.QA_VIEW_FILTER))){await page.evaluate(view=>{__mountainQA.placePlayer(view,0);window.__mountainView=view;const lighting=document.querySelector('#world-lighting-mode');lighting.value=view.id==='10-castle-mountain'?'night':'day';lighting.dispatchEvent(new Event('change'));},view);await page.waitForTimeout(4500);
  const measurement=await page.evaluate(async()=>{const ms=[];await new Promise(resolve=>{let last=performance.now(),start=last;function tick(now){ms.push(now-last);last=now;if(now-start>=2500)resolve();else requestAnimationFrame(tick);}requestAnimationFrame(tick);});ms.sort((a,b)=>a-b);const q=__mountainQA;return{fps:1000/(ms.reduce((a,b)=>a+b,0)/ms.length),p95:ms[Math.floor(ms.length*.95)],calls:q.renderer.info.render.calls,triangles:q.renderer.info.render.triangles,terrain:q.world.winter.mountainTerrain.stats(),quality:q.renderBudget.settings,memory:{...q.renderer.info.memory}};});
  await page.screenshot({path:out+'/'+view.id+'.png'});report.views.push({...view,...measurement});console.log(view.id,measurement.fps.toFixed(1),measurement.terrain.resident);
 }
 report.routes=await page.evaluate(async()=>{const m=await import('/resort-layout.js');return m.skiNetwork.map(({id,length,drop})=>({id,length,drop}));});
 if(report.errors.length)throw Error('Browser errors');
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{await page.context().request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
