import fs from 'node:fs/promises';
import {chromium} from '/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs';
const origin='http://127.0.0.1:4191',out='qa/platform-v52';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),report={environment:'macOS Chrome, desktop/mobile dimensions and emulated forced dark; physical Windows/Samsung UNKNOWN',checks:[],errors:[]};
try{for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));await page.route('**/__dev/events',r=>r.abort());
 await context.request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'UI검증'}});await page.goto(origin);await page.waitForFunction(()=>window.labSocialJoined&&window.openWinterSettings&&document.body.classList.contains('world-ready'),null,{timeout:180000});await page.waitForTimeout(3000);
 await page.evaluate(()=>openWinterSettings('social'));await page.locator('#open-admin').click();await page.waitForTimeout(1000);
 report.checks.push(await page.evaluate(mobile=>{const d=document.querySelector('#admin-panel'),r=d.getBoundingClientRect(),b=d.querySelector('.panel-heading .icon-button').getBoundingClientRect(),h=d.querySelector('h2').getBoundingClientRect();return{mobile,admin:{inside:r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight+1,button:{width:b.width,height:b.height},centerDifference:Math.abs(b.y+b.height/2-h.y-h.height/2)}};},mobile));await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-admin.png'});
 await page.locator('#admin-panel .panel-heading .icon-button').click();await page.waitForTimeout(500);await page.evaluate(()=>openWinterSettings('fluff'));await page.waitForTimeout(1500);
 const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setAutoDarkModeOverride',{enabled:true});await page.waitForTimeout(400);await page.screenshot({path:out+'/'+(mobile?'mobile':'desktop')+'-forced-dark.png'});
 report.checks.push(await page.evaluate(mobile=>({mobile,forcedDarkSwatches:[...document.querySelectorAll('[data-fur]')].map(b=>({color:b.dataset.fur,raster:!!b.querySelector('canvas.color-swatch-paint')}))}),mobile));
 await context.request.post(origin+'/api/leave');await context.close();
 }if(report.errors.length||report.checks.some(c=>c.admin&&(!c.admin.inside||c.admin.button.width!==44||c.admin.button.height!==44||c.admin.centerDifference>1)))throw Error('Platform UI failed');console.log('PASS admin close alignment, viewport, forced-dark samples');
}catch(e){report.failure=e.stack;process.exitCode=1;console.log(e.stack);}finally{await fs.writeFile(out+'/platform-extra.json',JSON.stringify(report,null,2));await browser.close();}
