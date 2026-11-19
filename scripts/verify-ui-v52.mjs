import fs from 'node:fs/promises';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4191',stage=process.env.QA_STAGE||'after',out='qa/platform-v52';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local QA only');
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report={environment:'macOS Chrome; emulated Windows transparency preference and mobile viewport, not physical devices',checks:[],errors:[]};
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await context.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'화면검증'}});
  await page.route('**/__dev/events',r=>r.abort());await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/}\s*$/,';window.__winterUIReady=true;\n}')});});await page.goto(origin,{timeout:180000});
  await page.waitForFunction(()=>window.__winterUIReady&&window.labSocialJoined&&window.openWinterSettings&&!document.body.classList.contains('is-loading'),null,{timeout:180000});
  await page.evaluate(()=>openWinterSettings('fluff'));await page.waitForTimeout(1500);
  const cdp=await context.newCDPSession(page);
  for(const reduced of [false,true]){
   await cdp.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-transparency',value:reduced?'reduce':'no-preference'}]});
   report.checks.push(await page.evaluate(({mobile,reduced})=>{const panel=document.querySelector('#studio'),title=document.querySelector('.studio-section-title'),close=document.querySelector('#close-studio'),r=close.getBoundingClientRect(),s=getComputedStyle(panel);return{mobile,reduced,background:s.background,color:s.color,titleVisible:title.getBoundingClientRect().height>0,title:title.innerText,close:{w:r.width,h:r.height},swatches:[...document.querySelectorAll('[data-fur]')].map(b=>({color:b.dataset.fur,raster:!!b.querySelector('canvas.color-swatch-paint')}))};},{mobile,reduced}));
   await page.screenshot({path:`${out}/${stage}-${mobile?'mobile':'desktop'}-${reduced?'solid':'glass'}.png`});
  }
  await cdp.send('Emulation.setEmulatedMedia',{features:[]});
  await page.locator('#close-studio').click();await page.waitForTimeout(500);await page.locator('#chat-toggle').click();
  report.checks.push(await page.evaluate(mobile=>{const box=document.querySelector('.chat-entry').getBoundingClientRect(),button=document.querySelector('.chat-entry button').getBoundingClientRect(),input=document.querySelector('#chat-input').getBoundingClientRect();return{mobile,chat:{left:input.left-box.left,right:box.right-button.right,buttonCenterY:button.y+button.height/2,boxCenterY:box.y+box.height/2}};},mobile));
  await page.screenshot({path:`${out}/${stage}-${mobile?'mobile':'desktop'}-chat.png`});
  await context.request.post(origin+'/api/leave').catch(()=>{});await context.close();
 }
 await fs.writeFile(`${out}/${stage}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(stage==='after'&&(report.errors.length||report.checks.some(c=>c.titleVisible===false||c.close&&c.close.h<44||c.chat&&(Math.abs(c.chat.left-c.chat.right)>1||Math.abs(c.chat.boxCenterY-c.chat.buttonCenterY)>1))))throw Error('UI regression');
}finally{await browser.close();}
