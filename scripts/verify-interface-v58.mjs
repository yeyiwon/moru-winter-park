import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4196',out='qa/interface-v58';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local UI verification only');
await fs.mkdir(out,{recursive:true});const report={checks:[],contrast:[],lamps:[],errors:[],physicalDevices:'UNKNOWN'},browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
try{
 for(const mobile of [false,true]){
  const ctx=await browser.newContext({viewport:mobile?{width:412,height:915}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?3:1}),page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.route('**/__dev/events',r=>r.abort());
  await page.addInitScript(()=>{localStorage.setItem('lab-music','off');localStorage.setItem('winter-render-mode','auto');});
  await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/}\s*$/,';window.__interfaceQA={scene,lightingTheme,placePlayer};\n}')});});
  await ctx.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'화면검증'}});await page.goto(origin);await page.waitForFunction(()=>window.__interfaceQA&&window.labSocialJoined,null,{timeout:180000});await page.locator('#world-loading').waitFor({state:'hidden',timeout:180000});
  await page.evaluate(()=>openWinterSettings('light'));assert.equal(await page.locator('[data-light]').nth(3).getAttribute('aria-pressed'),'true');assert.ok(await page.locator('#tab-social').isHidden());assert.ok(await page.locator('#owner-signin').isHidden());
  for(const theme of ['glass','dark']){
   await page.locator('#ui-dark-mode').setChecked(theme==='dark');
   for(const sky of ['day','night']){
    await page.locator('#world-lighting-mode').selectOption(sky);await page.locator('#close-studio').click();await page.waitForTimeout(1300);await page.evaluate(()=>openWinterSettings('light'));await page.locator('#studio').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
    await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-${theme}-${sky}.jpg`,quality:88});
   }
   const tokens=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return{ink:s.getPropertyValue('--ui-ink').trim(),muted:s.getPropertyValue('--ui-muted').trim()};});
   for(const [role,hex]of Object.entries(tokens))for(const backdrop of [0,255]){
    const rgb=hex.match(/[0-9a-f]{2}/gi).map(v=>parseInt(v,16)),panel=theme==='glass'?[233,244,253].map(v=>v*.64+backdrop*.36):[23,31,45].map(v=>v*.89+backdrop*.11),contrast=ratio(rgb,panel);assert.ok(contrast>=4.5,`${theme}/${role} contrast ${contrast}`);report.contrast.push({mobile,theme,role,backdrop,ratio:contrast});
   }
   for(const pane of ['activities','audio','fluff']){await page.evaluate(p=>openWinterSettings(p),pane);await page.waitForTimeout(150);await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-${theme}-${pane}.jpg`,quality:85});}
   await page.locator('#close-studio').click();await page.locator('#chat-toggle').click();await page.evaluate(()=>dispatchEvent(new CustomEvent('lab:visitors',{detail:[{id:labGuestId,name:'내 닉네임',chat:'겨울밤 같이 걸어요',chatAt:Date.now()},{id:'qa-color-peer',name:'다른 방문자',chat:'좋아요!',chatAt:Date.now()}]})));const nameColors=await page.evaluate(()=>[...document.querySelectorAll('#chat-log .chat-author')].map(el=>({color:getComputedStyle(el).color,weight:Number(getComputedStyle(el).fontWeight)})));assert.notEqual(nameColors[0].color,nameColors[1].color);assert.ok(nameColors.every(s=>s.weight>=700));await page.locator('#chat-input').fill('입력 취소 확인');await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-${theme}-chat.jpg`,quality:85});await page.mouse.click(200,100);assert.equal(await page.locator('#chat-input').inputValue(),'');
   await page.evaluate(()=>openQuizJournal());await page.waitForTimeout(300);await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-${theme}-journal.jpg`,quality:85});await page.evaluate(()=>{document.querySelector('#quiz-journal').close();openWinterSettings('light');});
  }
  await page.locator('#ui-dark-mode').uncheck();
  if(!mobile)for(let i=0;i<5;i++){
   const swatch=page.locator('[data-light]').nth(i),expected=await swatch.getAttribute('data-light');await swatch.click();await page.locator('#close-studio').click();await page.waitForFunction(hex=>'#'+__interfaceQA.lightingTheme.color.getHexString()===hex,expected,{timeout:20000});
   const actual=await page.evaluate(()=>({hex:'#'+__interfaceQA.lightingTheme.color.getHexString(),targets:__interfaceQA.lightingTheme.count,sky:document.querySelector('#world-lighting-mode').value}));assert.equal(actual.hex,expected);assert.ok(actual.targets>10);assert.equal(actual.sky,'night');report.lamps.push({index:i+1,expected,...actual});await page.screenshot({path:`${out}/lamp-${i+1}.jpg`,quality:90});await page.evaluate(()=>openWinterSettings('light'));
  }
  report.checks.push({mobile,guestInviteHidden:true,defaultLamp:4,allThemesAndDayNight:true,chatCancellation:true});await ctx.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}});await ctx.close();
 }
 assert.deepEqual(report.errors,[]);
}catch(e){report.failure=e.stack;console.error(e.stack);process.exitCode=1;}finally{await fs.writeFile(out+'/report.json',JSON.stringify(report,null,2));for(const ctx of browser.contexts())await ctx.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});await browser.close();}console.log(JSON.stringify(report));
