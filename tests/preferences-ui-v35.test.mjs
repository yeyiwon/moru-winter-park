import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
const tick=()=>new Promise(r=>setTimeout(r,10));
function setup(t){
 const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://winter.test',runScripts:'outside-only',pretendToBeVisual:true});t.after(()=>dom.window.close());
 const w=dom.window;w.matchMedia=()=>({matches:true});w.AbortController=AbortController;w.AbortSignal=AbortSignal;w.joinSharedActivity=async()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 let calls=[];w.fetch=async(url,options)=>{calls.push({url,options});if(url==='/content/daily-trivia.json')return Response.json(JSON.parse(fs.readFileSync('dist/content/daily-trivia.json')));if(url==='/api/quiz')return Response.json({overrides:[]});return Response.json({mode:'ai',cards:[{component:'RecommendationCard',item:{id:'winter-waltz'}}]});};
 const modules=new Map();function load(file){const full=path.resolve(file);if(modules.has(full))return modules.get(full);const mod=new vm.SourceTextModule(fs.readFileSync(full,'utf8'),{identifier:full,context:dom.getInternalVMContext()});modules.set(full,mod);return mod;}
 return{w,d:w.document,calls,async run(file){const m=load(file);if(m.status==='unlinked')await m.link((s,ref)=>load(path.resolve(path.dirname(ref.identifier),s)));await m.evaluate();return m.namespace;},change(selector,value){const e=w.document.querySelector(selector);if(e.type==='checkbox')e.checked=value;else e.value=value;e.dispatchEvent(new w.Event('change',{bubbles:true}));}};
}
test('music recommendation is opt-in, request-only, manually applied, and resettable',async t=>{
 const a=setup(t);await a.run('dist/personalization.js');const b=a.d.querySelector('#recommend-music');assert.equal(b.disabled,true);assert.equal(a.calls.length,0);
 a.change('#preference-style','jazz');assert.equal(a.calls.length,0);a.change('#ai-personalization',true);assert.equal(a.calls.length,0);b.click();await tick();
 assert.equal(a.calls.length,1);const payload=JSON.parse(a.calls[0].options.body);assert.equal(payload.style,'jazz');assert.equal(payload.consent,true);
 const music=a.d.querySelector('#music-select'),option=a.d.createElement('option');option.value='winter-waltz';music.append(option);let plays=0;music.addEventListener('change',()=>plays++);assert.equal(plays,0);a.d.querySelector('#music-recommendations button').click();assert.equal(plays,1);
 a.d.querySelector('#reset-preferences').click();assert.equal(a.d.querySelector('#ai-personalization').checked,false);assert.equal(b.disabled,true);assert.equal(a.d.querySelector('#music-recommendations').children.length,0);
});
test('opting out cancels pending AI and late results cannot return',async t=>{
 const a=setup(t);await a.run('dist/personalization.js');let respond,signal;a.w.fetch=(_,options)=>{signal=options.signal;return new Promise(r=>respond=r);};a.change('#ai-personalization',true);a.d.querySelector('#recommend-music').click();await tick();a.change('#ai-personalization',false);assert.equal(signal.aborted,true);
 respond(Response.json({mode:'ai',cards:[{component:'RecommendationCard',item:{id:'winter-waltz'}}]}));await tick();assert.equal(a.d.querySelector('#music-recommendations').children.length,0);
});
test('closing settings cancels its pending request without a hidden late UI update',async t=>{
 const a=setup(t);await a.run('dist/personalization.js');let respond,signal;a.w.fetch=(_,options)=>{signal=options.signal;return new Promise(r=>respond=r);};a.change('#ai-personalization',true);a.d.querySelector('#studio').showModal();a.d.querySelector('#recommend-music').click();await tick();a.d.querySelector('#studio').close();assert.equal(signal.aborted,true);respond(Response.json({mode:'ai',cards:[]}));await tick();assert.equal(a.d.querySelector('#recommendation-status').textContent,'');
});
test('physical exhibit opens sourced cards without an AI request, and its quiz uses the selected ID',async t=>{
 const a=setup(t);await a.run('dist/exhibit-cards.js');let quiz;a.w.openQuickQuiz=value=>quiz=value;await a.w.openKnowledgeExhibit('science');const panel=a.d.querySelector('#exhibit-panel');assert.equal(panel.open,true);assert.equal(a.calls.filter(c=>c.url==='/api/experience').length,0);assert.equal(panel.querySelectorAll('.experience-card').length,2);assert.ok(panel.querySelector('a').href.startsWith('https://'));panel.querySelector('.experience-card button').click();assert.equal(panel.open,false);assert.equal(quiz.gallery,'science');assert.match(quiz.questionId,/daily-sci/);assert.equal(a.d.body.classList.contains('quiz-open'),false);
});
test('unsupported voice input does not request permission or create hidden controls',async t=>{
 const a=setup(t);await a.run('dist/voice-controls.js');assert.equal(a.d.querySelector('#voice-settings'),null);assert.equal(a.calls.length,0);
});
