import fs from 'node:fs/promises';import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_PATH||'/Users/yeiwon/Documents/Codex/winter-qa-tools/node_modules/playwright-core/index.mjs'));
const origin=process.env.PROFILE_URL||'http://127.0.0.1:4191';if(!['localhost','127.0.0.1'].includes(new URL(origin).hostname))throw Error('Local only');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true}),page=await browser.newPage(),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|Shader|WebGL/.test(m.text()))errors.push(m.text());});
await page.route('**/color-qa.html',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><script type="module">
import * as T from '/vendor/three.module.js';import {createGlowPass} from '/glow-pass.js';
const r=new T.WebGLRenderer({preserveDrawingBuffer:true});r.setSize(128,64);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.12;document.body.append(r.domElement);
const s=new T.Scene(),c=new T.OrthographicCamera(-2,2,1,-1,.1,100);s.background=new T.Color('#040b1a');s.fog=new T.Fog('#122038',2,4);
for(const [x,color,fog]of [[-1,'#89a1ba',true],[0,'#303d52',false],[1,'#c7b4e7',false]]){const m=new T.Mesh(new T.PlaneGeometry(.8,1.5),new T.MeshBasicMaterial({color,fog,toneMapped:false}));m.position.set(x,0,-3);s.add(m);}
const gl=r.getContext(),pixel=()=>{const p=new Uint8Array(128*64*4);gl.readPixels(0,0,128,64,gl.RGBA,gl.UNSIGNED_BYTE,p);return[32,64,96].map(x=>Array.from(p.slice((32*128+x)*4,(32*128+x)*4+3)));};
const pass=createGlowPass(r),results={};for(const q of ['high','low','high','low']){pass.setQuality(q);pass.render(s,c);results[q]=pixel();}pass.dispose();
const has=r.extensions.has;r.extensions.has=name=>name==='EXT_color_buffer_float'?false:has.call(r.extensions,name);const fallback=createGlowPass(r);r.extensions.has=has;fallback.setQuality('low');fallback.render(s,c);results.noFloat=pixel();fallback.dispose();r.dispose();window.result=results;
</script>`}));
try{await page.goto(origin+'/color-qa.html');await page.waitForFunction(()=>window.result);const report=await page.evaluate(()=>window.result);report.errors=errors;report.environment='Mac Chrome: actual HDR/low, simulated missing float-buffer capability, no Windows hardware';const delta=a=>Math.max(...report.high.flat().map((v,i)=>Math.abs(v-report[a].flat()[i])));report.maxByteDifference={low:delta('low'),noFloat:delta('noFloat')};const out=process.env.QA_OUTPUT||'qa/castle-show-v49';await fs.mkdir(out,{recursive:true});await fs.writeFile(out+'/color-output.json',JSON.stringify(report,null,2));if(errors.length||delta('low')>2||delta('noFloat')>6)throw Error('Colour paths differ: '+JSON.stringify(report));console.log(JSON.stringify(report));}finally{await browser.close();}
