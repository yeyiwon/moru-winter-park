import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4196',out='qa/wardrobe-v58';
if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Local verification only');
await fs.mkdir(out,{recursive:true});
const report={checks:[],errors:[],physicalWindowsGalaxy:'UNKNOWN'},browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:mobile?{width:412,height:915}:{width:1280,height:800},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile}),page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.route('**/__dev/events',r=>r.abort());await page.route('**/character-accessories.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace('updateNoseLight(Date.now()/1000,','updateNoseLight(window.__noseLightTime??Date.now()/1000,')});});
  await ctx.addInitScript(()=>{localStorage.setItem('lab-music','off');localStorage.setItem('winter-render-mode','auto');});
  await ctx.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'겨울꾸미기'}});await page.goto(origin);await page.waitForFunction(()=>window.labSocialJoined&&window.openWinterSettings,null,{timeout:180000});await page.locator('#world-loading').waitFor({state:'hidden',timeout:180000});
  await page.evaluate(()=>openWinterSettings('fluff'));await page.locator('[data-category=head]').click();
  const choices=['crown','tree-star','pine-cap','witch-hat','pumpkin-cap','ghost-cap','antlers','moon-cap'];
  if(!mobile)for(const id of choices){await page.locator(`[data-accessory=${id}]`).click();await page.waitForTimeout(500);await page.locator('#fluff-preview').screenshot({path:out+'/'+id+'.jpg',quality:90});await page.locator('#fluff-preview').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.locator('#fluff-preview').screenshot({path:out+'/'+id+'-side.jpg',quality:90});await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');}
  await page.locator('[data-accessory=tree-star]').click();
  assert.equal(await page.locator('[data-category=hair]').count(),0);assert.equal(await page.locator('[data-accessory=mushroom-cap]').count(),0);
  await page.locator('[data-category=audio]').click();await page.locator('[data-accessory=cat-headphones]').click();
  assert.ok(!(await page.evaluate(()=>labDraftAppearance.accessory)).includes('tree-star'));
  await page.locator('#fluff-preview').screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-cat-headphones.jpg',quality:90});
  if(!mobile){await page.locator('#fluff-preview').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await page.locator('#fluff-preview').screenshot({path:out+'/cat-headphones-side.jpg',quality:90});await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');}
  await page.locator('[data-category=head]').click();await page.locator('[data-accessory=tree-star]').click();
  assert.ok(!(await page.evaluate(()=>labDraftAppearance.accessory)).includes('cat-headphones'));
  await page.locator('[data-category=audio]').click();await page.locator('[data-accessory=cat-headphones]').click();
  await page.locator('[data-category=nose]').click();await page.locator('[data-accessory=glow-nose]').click();await page.waitForTimeout(300);
  if(!mobile)for(const [index,color] of ['red','pink','violet','blue','mint','gold'].entries()){await page.evaluate(time=>window.__noseLightTime=time,index*4);await page.waitForTimeout(120);await page.locator('#fluff-preview').screenshot({path:out+'/nose-'+color+'.jpg',quality:92});}
  const draft=await page.evaluate(()=>labDraftAppearance);for(const id of ['glow-nose','cat-headphones'])assert.ok(draft.accessory.includes(id));
  const responsePromise=page.waitForResponse(r=>r.url().includes('/api/appearance')&&r.request().method()==='POST');await page.locator('#wardrobe-save').click();const response=await responsePromise;assert.equal(response.status(),200);await page.waitForFunction(()=>document.querySelector('#wardrobe-status').textContent==='저장했어요.');
  await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-settings.jpg',quality:88});
  const bounds=await page.locator('#studio').evaluate(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,blur:style.backdropFilter,background:style.backgroundImage};});assert.ok(bounds.left>=0&&bounds.right<=bounds.width&&bounds.top>=0&&bounds.bottom<=bounds.height);assert.match(bounds.blur,/18px/);
  await page.reload();await page.waitForFunction(()=>window.labSocialJoined&&window.labAppearance?.accessory.includes('cat-headphones'),null,{timeout:180000});assert.equal(await page.evaluate(()=>labAppearance.accessory),draft.accessory);report.checks.push({mobile,combination:draft.accessory,saved:true,restored:true,bounds});
  await page.evaluate(()=>openWinterSettings('light'));const sky=await page.locator('#world-lighting-mode').inputValue();await page.locator('#ui-dark-mode').check();assert.equal(await page.locator('html').getAttribute('data-ui-theme'),'dark');assert.equal(await page.locator('#world-lighting-mode').inputValue(),sky);await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-dark-settings.jpg',quality:90});await page.reload();await page.waitForFunction(()=>window.openWinterSettings);assert.equal(await page.locator('html').getAttribute('data-ui-theme'),'dark');await page.evaluate(()=>openWinterSettings('light'));await page.locator('#ui-dark-mode').uncheck();assert.equal(await page.locator('html').getAttribute('data-ui-theme'),'glass');report.checks.push({mobile,darkThemeSaved:true,worldLightingUnchanged:true,reversible:true});
  await ctx.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await ctx.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;process.exitCode=1;console.error(e.stack);}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));for(const ctx of browser.contexts())await ctx.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});await browser.close();}
console.log(JSON.stringify(report));
