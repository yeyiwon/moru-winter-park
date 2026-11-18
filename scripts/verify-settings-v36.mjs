import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';
const origin=process.env.QA_URL||'http://127.0.0.1:4185',out='qa/browser-v36/settings';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Local QA only');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report={checks:[],errors:[],physicalMobile:false};
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'}),page=await context.newPage();
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/park.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/}\s*$/,';window.__settingsRenderer=renderer;}')});});
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.openWinterSettings&&window.labSocialJoined&&window.travelToPlace&&document.body.classList.contains('world-ready'),null,{timeout:90000});await page.evaluate(()=>window.travelToPlace('tree',false));await page.waitForTimeout(1500);
  for(const [name,width,height]of mobile?[['mobile',390,844],['small',320,640],['landscape',844,390]]:[['desktop',1440,900],['laptop',1024,768],['tablet',768,1024]]){
   await page.setViewportSize({width,height});let frame;
   for(const id of ['map','light','fluff','audio','social']){
    await page.evaluate(id=>window.openWinterSettings(id),id);await page.waitForTimeout(300);
    const result=await page.evaluate(id=>{const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,bottom:r.bottom};},s=document.querySelector('#studio'),title=s.querySelector('.studio-head>span'),tabs=s.querySelector('.studio-tabs'),pane=s.querySelector('#pane-'+id),header=s.querySelector('.studio-header');return{frame:rect(s),title:rect(title),tabs:rect(tabs),pane:rect(pane),header:rect(header),close:rect(s.querySelector('#close-studio')),overflow:pane.scrollWidth>pane.clientWidth+2,titleSize:parseFloat(getComputedStyle(title).fontSize),tabSize:parseFloat(getComputedStyle(tabs.firstElementChild).fontSize),background:getComputedStyle(s).background,blur:getComputedStyle(s).backdropFilter,map:id==='map'?rect(s.querySelector('#island-map')):null};},id);
    assert.ok(result.frame.x>=0&&result.frame.y>=0&&result.frame.x+result.frame.w<=width+1&&result.frame.bottom<=height+1);
    assert.ok(result.title.bottom<=result.tabs.y,'title must be above category tabs');assert.ok(result.titleSize>result.tabSize+2);
    assert.ok(result.pane.y>=result.header.bottom-1,'header cannot cover content');assert.equal(result.overflow,false);
    report.checks.push({name,id,...result});
    if(frame)assert.deepEqual(result.frame,frame,'tabs keep one stable outer frame');else frame=result.frame;
    if(result.map){assert.ok(result.map.h>height*.3);assert.equal(await page.locator('.map-region:visible').count(),5);}
    if(id==='map'||id==='light'||id==='fluff')await page.screenshot({path:`${out}/${name}-${id}.png`});
   }
   const frozenFrame=await page.evaluate(()=>window.__settingsRenderer.info.render.frame);
   await page.setViewportSize({width:width-1,height});await page.waitForTimeout(250);
   const resizedFrame=await page.evaluate(()=>window.__settingsRenderer.info.render.frame);assert.ok(resizedFrame>frozenFrame,'resizing a paused menu must repaint its world background');
   await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__settingsRenderer.info.render.frame),resizedFrame,'paused background remains frozen after one redraw');
   await page.keyboard.press('Escape');await page.locator('#studio').waitFor({state:'hidden'});assert.equal(await page.locator('#studio').isVisible(),false);
   console.log(name+' title hierarchy, stable frame, map and content clearance');
  }
  await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await context.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;console.error(e);process.exitCode=1;}finally{await browser.close();await fs.writeFile(out+'/verification.json',JSON.stringify(report,null,2));}
