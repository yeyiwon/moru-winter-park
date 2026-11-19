import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs'));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4191',out=process.env.QA_OUTPUT||'qa/alpine-v50';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local verification only');
await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))errors.push(m.text());});
await page.route('**/__dev/events',r=>r.abort());await page.route('**/park.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(/}\s*$/,';window.__winterQA={renderer,scene,camera,world,placePlayer,orbitCamera,zoomCamera,cameraPolicy};\n}')});});
const report={environment:'macOS Chrome, 1280x800; browser visual inspection; no physical mobile test'};
try{
 await page.context().request.post(origin+'/api/join',{headers:{Origin:origin},data:{name:'스키장조경검증'}});await page.goto(origin,{timeout:180000});await page.waitForFunction(()=>window.__winterQA&&window.labSocialJoined,null,{timeout:180000});
 async function view(point,yaw=0,pitch=.36,distance=24){await page.evaluate(({point,yaw,pitch,distance})=>{const q=__winterQA;q.placePlayer(point,0);q.cameraPolicy.adopt({yaw,pitch,distance});},{point,yaw,pitch,distance});await page.waitForTimeout(2300);}
 const layout=await page.evaluate(async()=>{const a=await import('/resort-layout.js'),m=await import('/mountain-layout.js');return{shift:a.alpineShift,gondola:a.gondolaEntry,signs:m.mountainWayfinders.map(p=>({...p,z:p.z+a.alpineShift})),peak:a.peakSummit};});
 await view({x:-12,z:-150+layout.shift},0,.55,64);await page.screenshot({path:out+'/compact-base.png'});
 await view({x:layout.gondola.x+2,z:layout.gondola.z+12},0,.28,24);await page.screenshot({path:out+'/gondola-approach.png'});
 const sign=layout.signs.find(p=>p.id==='forest-rest');await view({x:sign.x,z:sign.z+9},0,.24,16.5);await page.screenshot({path:out+'/forest-wayfinder.png'});
 const tree=await page.evaluate(()=>{const g=__winterQA.scene.getObjectByName('alpine-forest-fairy-lights'),p=g.geometry.attributes.position,i=Math.floor(p.count/84)*42;return{x:p.getX(i),z:p.getZ(i)+90};});
 await view({x:tree.x+4,z:tree.z+18},0,.28,24);await page.screenshot({path:out+'/forest-sparkles.png'});
 report.geometry=await page.evaluate(()=>{const scene=__winterQA.scene,lights=scene.getObjectByName('alpine-forest-fairy-lights'),fence=scene.getObjectByName('alpine-fence-illuminations'),stats=__winterQA.world.winter.mountainTerrain.stats();return{treeParticles:lights.geometry.attributes.position.count,treeDraws:1,fenceBulbs:fence.geometry.attributes.position.count,terrain:stats};});
 await page.evaluate(()=>openWinterSettings('map'));await page.waitForTimeout(800);report.map=await page.evaluate(()=>[...document.querySelectorAll('.map-region')].map(b=>({id:b.dataset.region,name:b.getAttribute('aria-label')})));await page.screenshot({path:out+'/compact-world-map.png'});
 if(report.geometry.treeParticles===0||report.geometry.treeParticles>220*42||report.map.length!==12||errors.length)throw Error('Visual/geometry/map regression');
 console.log('PASS compact base, wayfinding, tree/fence effects and 12 map destinations',report.geometry);
}catch(e){report.failure=e.message;process.exitCode=1;console.error(e.stack);}finally{report.errors=errors;await fs.writeFile(out+'/visual.json',JSON.stringify(report,null,2));await browser.close();}
