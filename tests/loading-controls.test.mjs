import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {BRAND} from '../dist/brand-config.js';
import {loadingTreePath} from '../dist/luminous-loading.js';
import os from 'node:os';import path from 'node:path';import {execFileSync} from 'node:child_process';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('release branding preserves the early saved-theme script and exact share metadata',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'winter-brand-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const directory of ['dist','scripts'])fs.mkdirSync(path.join(root,directory));
 fs.writeFileSync(path.join(root,'package.json'),'{"type":"module"}');
 for(const file of ['dist/index.html','dist/brand-config.js','scripts/apply-brand.mjs'])fs.copyFileSync(new URL('../'+file,import.meta.url),path.join(root,file));
 execFileSync(process.execPath,['scripts/apply-brand.mjs'],{cwd:root});const built=fs.readFileSync(path.join(root,'dist/index.html'),'utf8'),dom=new JSDOM(built),d=dom.window.document;t.after(()=>dom.window.close());
 assert.equal(d.querySelectorAll('head script[src="/ui-theme.js"]').length,1);assert.ok(built.indexOf('src="/ui-theme.js"')<built.indexOf('rel="stylesheet"'));
 for(const name of ['description','twitter:description'])assert.equal(d.querySelector(`meta[name="${name}"]`).content,'내가 사랑하는 겨울');
 assert.equal(d.title,'WINTERLIGHT');assert.equal(d.querySelector('[property="og:description"]').content,'내가 사랑하는 겨울');
 const png=fs.readFileSync(new URL('../dist'+BRAND.assets.socialImage,import.meta.url));assert.equal(Number(d.querySelector('[property="og:image:width"]').content),png.readUInt32BE(16));assert.equal(Number(d.querySelector('[property="og:image:height"]').content),png.readUInt32BE(20));
 assert.equal(d.querySelector('[property="og:image"]').content,BRAND.url+BRAND.assets.socialImage+'?v='+BRAND.revision);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'dist/site.webmanifest'),'utf8')).description,'내가 사랑하는 겨울');
});
test('loading reports real stages including connection, fails visibly and completes without a timed gate',()=>{
 const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,d=w.document;w.matchMedia=()=>({matches:false});w.eval(fs.readFileSync(new URL('../dist/luminous-loading.js',import.meta.url),'utf8').replaceAll('export ',''));w.eval(fs.readFileSync(new URL('../dist/loading-backdrop.js',import.meta.url),'utf8').replaceAll('export ',''));w.eval(fs.readFileSync(new URL('../dist/loading-state.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,''));
 const loader=d.querySelector('#world-loading'),bar=loader.querySelector('progress');assert.equal(bar.value,1);assert.equal(loader.querySelector('p').textContent,'Loading ...');assert.ok(loader.querySelector('.luminous-tree'));assert.equal(loader.querySelector('.luminous-tree path').getAttribute('d'),loadingTreePath());assert.equal(loader.querySelector('.loading-spinner'),null);assert.equal(loader.querySelector('.winter-horizon'),null);assert.equal(loader.querySelector('.loading-snow'),null);
 for(const stage of ['world','interiors','frame'])w.labLoading.complete(stage);assert.equal(bar.value,4);assert.equal(loader.classList.contains('loaded'),false);assert.equal(loader.querySelector('#loading-stage').textContent,'서버 연결');
 w.labLoading.complete('world');assert.equal(bar.value,4);w.labLoading.complete('connection');assert.equal(bar.value,5);assert.equal(loader.classList.contains('loaded'),true);
 loader.dispatchEvent(new w.Event('transitionend'));assert.equal(loader.hidden,true);w.labLoading.error('연결 오류');assert.equal(loader.hidden,false);assert.equal(loader.querySelector('button').hidden,false);dom.window.close();
});
test('static uppercase branding reuses the exact loading-tree curve without animation',()=>{
 const dom=new JSDOM(html),d=dom.window.document;assert.equal(d.querySelector('.brand-word').textContent,BRAND.wordmark??BRAND.name);assert.equal(d.querySelector('.brand-word').textContent,BRAND.wordmark.toUpperCase());assert.equal(d.querySelector('.brand-mark img').getAttribute('src'),BRAND.assets.logoCompact+'?v='+BRAND.revision);const logo=fs.readFileSync(new URL('../dist'+BRAND.assets.logoCompact,import.meta.url),'utf8');assert.ok(!/<(?:animate|animateTransform|script)\b/.test(logo));assert.ok(logo.includes('d="'+loadingTreePath()+'"'));assert.equal(d.querySelectorAll('#winter-crystal').length,0);assert.equal(d.querySelector('#world-loading h1'),null);assert.equal(d.querySelector('#world-loading svg'),null);assert.equal(d.querySelector('.loading-spinner'),null);assert.ok(d.querySelector('#world-loading .loading-error'));assert.ok(!d.querySelector('#jump-button').innerHTML.includes('M12 19V5'));dom.window.close();
});
test('emote menu cancels prior input and closes on selection, outside touch or Escape',()=>{
 const dom=new JSDOM('<body><canvas></canvas></body>',{runScripts:'outside-only'}),w=dom.window,d=w.document;let resets=0,emotion='';w.addEventListener('lab:pause',()=>resets++);w.addEventListener('lab:emote',e=>emotion=e.detail);w.eval(fs.readFileSync(new URL('../dist/emotes.js',import.meta.url),'utf8'));
 const button=d.querySelector('#emote-toggle'),panel=d.querySelector('#emote-panel');button.click();assert.equal(panel.hidden,false);assert.equal(d.body.classList.contains('emote-open'),true);assert.equal(resets,1);panel.querySelector('[aria-label=하트]').click();assert.equal(emotion,'heart');assert.equal(panel.hidden,true);assert.equal(d.body.classList.contains('emote-open'),false);button.click();d.querySelector('canvas').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(panel.hidden,true);button.click();w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(panel.hidden,true);dom.window.close();
});
test('slow preparation recovers after its deadline but a genuine startup error stays visible',()=>{
 for(const recoverable of [true,false]){
  const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.matchMedia=()=>({matches:false});
  for(const file of ['luminous-loading.js','loading-backdrop.js','loading-state.js'])w.eval(fs.readFileSync(new URL('../dist/'+file,import.meta.url),'utf8').replaceAll('export ','').replace(/^import .*;\n/gm,''));
  w.labLoading.complete('connection');w.labLoading.error('late preparation',{canRecover:recoverable});
  for(const stage of ['world','interiors','frame'])w.labLoading.complete(stage);
  const loader=w.document.querySelector('#world-loading');assert.equal(loader.classList.contains('loaded'),recoverable);
  if(recoverable){loader.dispatchEvent(new w.Event('transitionend'));assert.equal(loader.hidden,true);}else assert.equal(loader.hidden,false);
  dom.window.close();
 }
});
