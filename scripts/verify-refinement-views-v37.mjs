import fs from 'node:fs/promises';
import {chromium} from '/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs';
const origin='http://127.0.0.1:4185',out='qa/browser-v37/refinement';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
try{
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/Shader|VALIDATE_STATUS/.test(m.text()))errors.push(m.text());});
 await page.addInitScript(()=>localStorage.setItem('winter-render-mode','high'));
 await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replaceAll('if(glowPass)glowPass.render(scene,camera);','if(window.__photo){camera.position.set(...window.__photo.position);camera.lookAt(...window.__photo.target);camera.fov=44;camera.updateProjectionMatrix();}if(glowPass)glowPass.render(scene,camera);').replace(/}\s*$/,';window.__viewQA={scene,camera,renderer,experience};}')} );});
 await page.goto(origin,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__viewQA&&window.labSocialJoined&&document.querySelector('#world-loading').hidden,null,{timeout:120000});
 const views=await page.evaluate(async()=>{const {museumPoint,museumLayout}=await import('/district-layout.js'),{treeLayout:t}=await import('/tree-layout.js'),p=(x,z,y)=>{const a=museumPoint(x,z);return[a.x,y,a.z];};return[
 {id:'museum-front',place:'quiz',position:p(0,60,14),target:[museumLayout.x,8,museumLayout.z]},
 {id:'museum-detail',place:'quiz',position:p(26,29,20),target:[museumLayout.x,10,museumLayout.z]},
 {id:'tree-front',place:'tree',position:[t.x,8,t.z-51],target:[t.x,12,t.z]},
 {id:'tree-plaza',place:'tree',position:[t.x+34,42,t.z-34],target:[t.x,3,t.z]},
 {id:'post-office',place:'tree',position:[-2,6,61],target:[-17,2,65]},
 {id:'ski-entrance',place:'ski',position:[-1,4,-44],target:[8,2.7,-66]},
 {id:'tree-topper',place:'tree',position:[t.x+7,32,t.z-15],target:[t.x,31.4,t.z]},
 {id:'ski-beginner-arrival',place:'ski-middle',position:[-57,40,-188],target:[-77,29,-208]},
 {id:'ski-network',place:'ski',position:[125,138,-35],target:[0,35,-188]}
 ];});
 for(const view of views){await page.evaluate(view=>{travelToPlace(view.place,false);window.__photo=view;},view);await page.waitForTimeout(1000);await page.screenshot({path:`${out}/after-${view.id}.jpg`,quality:90});}
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Fixed-view screenshots captured without JS/shader errors');
}finally{await context.request.post(origin+'/api/leave',{headers:{Origin:origin},data:{}}).catch(()=>{});await browser.close();}
