import fs from 'node:fs/promises';
const {chromium}=await import('/tmp/winter-browser-qa/node_modules/playwright-core/index.mjs');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:'block'}),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))errors.push(m.text());});
await page.route('**/park.js*',async r=>{const response=await r.fetch();let body=(await response.text()).replace(/}\s*$/,';window.__artQA={renderer,scene,camera,world,fluff,lightingTheme,localLights};}');body=body.replace('if(glowPass)glowPass.render(scene,camera);','if(window.__artCamera){camera.position.fromArray(window.__artCamera.position);camera.lookAt(...window.__artCamera.target);camera.updateMatrixWorld();}if(glowPass)glowPass.render(scene,camera);');await r.fulfill({response,body});});
try{
 await page.goto('http://127.0.0.1:4184',{waitUntil:'domcontentloaded',timeout:90000});await page.waitForFunction(()=>window.__artQA&&window.labSocialJoined,null,{timeout:90000});await page.waitForTimeout(1500);await fs.mkdir('qa/browser-v32/art',{recursive:true});
 for(const [name,position,target] of [['overview',[-110,230,245],[-10,0,-50]],['tree',[-26,16,42],[0,8,79]],['rink',[-46,22,24],[-69,0,62]],['museum',[-107,20,34],[-148,8,18]],['market',[-24,12,36],[-24,1,15]]]){await page.evaluate(({position,target})=>{window.__artCamera={position,target};}, {position,target});await page.waitForTimeout(300);await page.screenshot({path:'qa/browser-v32/art/'+name+'.png'});}
 await page.evaluate(()=>{window.__artCamera={position:[10,7,26],target:[0,1,15]};});
 const results=[];
 for(const [name,color]of [['gold','#ffd5a1'],['blue','#91ccff'],['white','#eef7ff']]){
  await page.evaluate(()=>window.openWinterSettings('light'));const input=page.locator('#light-color');await input.evaluate((e,color)=>{e.value=color;e.dispatchEvent(new Event('input',{bubbles:true}));},color);await page.evaluate(()=>document.querySelector('#studio').close());await page.waitForTimeout(1400);
  results.push(await page.evaluate(()=>{const q=window.__artQA,colors=[],fixed=[],paint=[];q.scene.traverse(o=>{if(o.isPointLight&&o.layers.isEnabled(0))colors.push({name:o.name,color:o.color.getHexString()});if(o.isPointLight&&o.userData.lightingTheme!=='personal'&&!o.name.startsWith('pooled'))fixed.push(o.color.getHexString());if(o.isMesh&&o.material?.vertexColors&&o.geometry.attributes.color)paint.push(o.geometry.attributes.color.count);});return{theme:q.lightingTheme.color.getHexString(),colors,fixed,paintedMeshes:paint.length,render:q.renderer.info.render};}));await page.screenshot({path:'qa/browser-v32/art/light-'+name+'.png'});
 }
 await page.evaluate(()=>window.openWinterSettings('map'));await page.waitForTimeout(300);await page.screenshot({path:'qa/browser-v32/art/map.png'});await fs.writeFile('qa/browser-v32/art/lighting.json',JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));
}finally{await browser.close();}
