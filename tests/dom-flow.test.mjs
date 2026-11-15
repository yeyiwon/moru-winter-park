// DOM integration, not a real browser/GPU/layout test. Run with --experimental-vm-modules.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let JSDOM;try{({JSDOM}=require('jsdom'));}catch{({JSDOM}=require('/tmp/knowledge-qa/node_modules/jsdom'));}
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../dist');
async function boot(saved){const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://local.test/',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLElement.prototype.scrollTo=function({top}){this.scrollTop=top};w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'))};if(saved)w.localStorage.setItem('knowledge-lab-v3',saved);w.fetch=async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(root,url),'utf8'))});const modules=new Map(),context=dom.getInternalVMContext();async function module(file){file=file.split('?')[0];if(modules.has(file))return modules.get(file);const mod=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,mod);await mod.link(spec=>module(path.resolve(path.dirname(file),spec)));return mod;}const app=await module(path.join(root,'app.js'));await app.evaluate();await new Promise(r=>setTimeout(r,20));return{dom,w,document:w.document,click(selector){const e=w.document.querySelector(selector);assert.ok(e,`missing ${selector}`);assert.equal(e.disabled,false,`disabled ${selector}`);e.click();},text:()=>w.document.querySelector('#app').textContent};}
test('catalog, prediction, evidence, explanation, application and resume form a complete DOM flow',async()=>{const a=await boot();a.click('#open-library');assert.equal(a.document.querySelector('#learning').open,true);assert.equal(a.document.querySelectorAll('.content-card').length,80);a.click('[data-start=sci01]');a.click('[data-choice="0"]');assert.match(a.text(),/내 선택/);assert.equal(a.document.querySelector('.explanation'),null);a.click('[data-confirm]');assert.match(a.text(),/새로운 증거/);a.click('[data-choice="1"]');a.click('[data-confirm]');assert.match(a.text(),/내 선택 · 정답/);assert.match(a.document.querySelector('.core').textContent,/기울기/);a.click('[data-application="0"]');assert.match(a.text(),/새 상황에도 적용/);const stored=a.w.localStorage.getItem('knowledge-lab-v3');a.click('#close-learning');const b=await boot(stored);b.click('#open-library');b.click('[data-resume]');assert.ok(b.document.querySelector('.explanation'));assert.match(b.text(),/새 상황에도 적용/);a.dom.window.close();b.dom.window.close();});
test('all content renders, choices cannot submit before prediction, and hints progress',async()=>{const a=await boot();a.click('#open-library');const ids=[...a.document.querySelectorAll('[data-start]')].map(x=>x.dataset.start);assert.equal(ids.length,80);for(const id of ids){a.click(`[data-start="${id}"]`);assert.equal(a.document.querySelector('[data-confirm]').disabled,true);a.click('[data-hint]');assert.equal(a.document.querySelectorAll('.hint').length,1);a.click('[data-choice="0"]');a.click('[data-confirm]');if(!a.document.querySelector('.explanation'))a.click('[data-confirm]');assert.ok(a.document.querySelector('.core')?.textContent.length>20,id);assert.equal(a.document.querySelectorAll('.source-list a').length>0,true,id);a.click('#learning-back');}a.dom.window.close();});
test('coin and bridge controls update visible results after a prediction',async()=>{const a=await boot();a.click('#open-library');a.click('[data-start=rea01]');a.click('[data-choice="1"]');a.click('[data-sim=coin][data-count="100"]');assert.match(a.text(),/100회/);a.click('#learning-back');a.click('[data-start=rea03]');a.click('[data-choice="1"]');assert.deepEqual([...a.document.querySelectorAll('.bridge-row>div')].map(x=>x.dataset.open),['false','true','false']);const el=a.document.querySelector('#sim-lantern');el.checked=true;el.dispatchEvent(new a.w.Event('input',{bubbles:true}));assert.deepEqual([...a.document.querySelectorAll('.bridge-row>div')].map(x=>x.dataset.open),['true','true','false']);a.dom.window.close();});
test('a changed prediction is recorded and spaced review grades its own new situation',async()=>{
 const a=await boot(),q=JSON.parse(fs.readFileSync(path.join(root,'content/science.json'),'utf8'))[0];
 a.click('#open-library');a.click('[data-start=sci01]');a.click('[data-choice="0"]');a.click('[data-confirm]');a.click('[data-choice="1"]');a.click('[data-confirm]');a.click('[data-records]');
 assert.match(a.text(),/최초 예상: 다시 확인 → 근거 확인 후 정답/);
 a.click('[data-review=sci01]');assert.match(a.text(),new RegExp(q.review.situation.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));assert.ok(!a.text().includes(q.application.situation));
 a.click(`[data-choice="${q.review.answer}"]`);a.click('[data-confirm]');assert.ok(a.document.querySelector('.core').textContent.includes(q.review.explanation));
 const record=JSON.parse(a.w.localStorage.getItem('knowledge-lab-v3')).records.sci01;assert.equal(record.attempts[0].initialChoice,0);assert.equal(record.attempts[0].initialCorrect,false);assert.equal(record.attempts[0].correct,true);assert.equal(record.reviews[0].correct,true);
 a.click('[data-records]');assert.match(a.text(),/처음에는 놓쳤지만 새 상황에 적용/);a.dom.window.close();
});
test('each physical exhibit discovers a question from its own subject instead of a generic room',async()=>{
 const a=await boot(),{exhibits}=await import('../dist/world-layout.js');
 const items=['science','reasoning','humanities','perspectives'].flatMap(f=>JSON.parse(fs.readFileSync(path.join(root,'content',f+'.json'),'utf8')));
 for(const exhibit of exhibits.filter(e=>e.fields)){
  a.w.showParkDiscovery(exhibit);assert.equal(a.document.querySelector('#discovery-card').hidden,false);
  const title=a.document.querySelector('#discovery-question').textContent,q=items.find(x=>x.title===title);
  assert.ok(q&&exhibit.fields.includes(q.field),exhibit.id);
  a.click('#open-discovery');assert.equal(a.document.querySelector('.lesson h1').textContent,title);a.click('#close-learning');
 }
 a.dom.window.close();
});
test('timbre experiment requires prediction, reports unavailable audio, and connects the world instrument to its lesson',async()=>{
 const a=await boot();a.w.openSoundExperiment();assert.equal(a.document.activeElement.dataset.worldTone,'pure');
 a.click('[data-world-tone=pure]');await new Promise(r=>setTimeout(r,0));assert.match(a.document.querySelector('#world-sound-result').textContent,/효과음/);
 a.click('#world-sound-question');assert.equal(a.document.querySelector('#sound-experiment').hidden,true);assert.equal(a.document.querySelector('[data-sim=timbre-a]').disabled,true);
 a.click('[data-choice="0"]');a.click('[data-sim=timbre-a]');await new Promise(r=>setTimeout(r,0));assert.match(a.text(),/사용할 수 없어요/);
 const calls=[];a.w.labTone=async kind=>{calls.push(kind);return true};a.click('[data-sim=timbre-b]');await new Promise(r=>setTimeout(r,0));assert.deepEqual(calls,['rich']);assert.match(a.text(),/높이와 질감을 비교/);assert.match(a.text(),/220 Hz/);a.dom.window.close();
});
test('audio synthesis preserves the 220 Hz fundamental and mute prevents playback',async()=>{
 const a=await boot(),oscillators=[],gains=[];
 const param=()=>({value:0,setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},exponentialRampToValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v}});
 class Audio{constructor(){this.state='running';this.currentTime=0;this.destination={};}async resume(){}createGain(){const g={gain:param(),connect(){},disconnect(){}};gains.push(g);return g;}createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(){},stop(){}};oscillators.push(o);return o;}}
 a.w.AudioContext=Audio;vm.runInContext(fs.readFileSync(path.join(root,'effects.js'),'utf8'),a.dom.getInternalVMContext());
 assert.equal(await a.w.labTone('pure'),true);assert.deepEqual(oscillators.map(o=>o.frequency.value),[220]);oscillators.length=0;
 assert.equal(await a.w.labTone('rich'),true);assert.deepEqual(oscillators.map(o=>o.frequency.value),[220,440,660]);
 a.click('#sound');assert.equal(gains[0].gain.value,0);assert.equal(await a.w.labTone('pure'),false);assert.equal(oscillators.length,3);a.dom.window.close();
});
