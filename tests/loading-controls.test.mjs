import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
test('loading reports real stages including connection, fails visibly and completes without a timed gate',()=>{
 const dom=new JSDOM(html,{runScripts:'outside-only'}),w=dom.window,d=w.document;w.matchMedia=()=>({matches:false});w.eval(fs.readFileSync(new URL('../dist/loading-state.js',import.meta.url),'utf8'));
 const loader=d.querySelector('#world-loading'),bar=loader.querySelector('progress');assert.equal(bar.value,1);
 for(const stage of ['world','interiors','frame'])w.labLoading.complete(stage);assert.equal(bar.value,4);assert.equal(loader.classList.contains('loaded'),false);assert.equal(loader.querySelector('p').textContent,'서버 연결');
 w.labLoading.complete('world');assert.equal(bar.value,4);w.labLoading.complete('connection');assert.equal(bar.value,5);assert.equal(loader.classList.contains('loaded'),true);
 loader.dispatchEvent(new w.Event('transitionend'));assert.equal(loader.hidden,true);w.labLoading.error('연결 오류');assert.equal(loader.hidden,false);assert.equal(loader.querySelector('button').hidden,false);dom.window.close();
});
test('crystal stays sixfold and shared; jump depicts a character instead of an arrow',()=>{
 const dom=new JSDOM(html),d=dom.window.document;assert.equal(d.querySelectorAll('#winter-crystal .crystal-branches use').length,6);assert.equal(d.querySelector('.brand-mark use').getAttribute('href'),'#winter-crystal');assert.equal(d.querySelector('.loading-emblem use').getAttribute('href'),'#winter-crystal');assert.equal(d.querySelectorAll('#jump-button circle').length,2);assert.ok(!d.querySelector('#jump-button').innerHTML.includes('M12 19V5'));dom.window.close();
});
test('emote menu cancels prior input and closes on selection, outside touch or Escape',()=>{
 const dom=new JSDOM('<body><canvas></canvas></body>',{runScripts:'outside-only'}),w=dom.window,d=w.document;let resets=0,emotion='';w.addEventListener('lab:pause',()=>resets++);w.addEventListener('lab:emote',e=>emotion=e.detail);w.eval(fs.readFileSync(new URL('../dist/emotes.js',import.meta.url),'utf8'));
 const button=d.querySelector('#emote-toggle'),panel=d.querySelector('#emote-panel');button.click();assert.equal(panel.hidden,false);assert.equal(d.body.classList.contains('emote-open'),true);assert.equal(resets,1);panel.querySelector('button').click();assert.equal(emotion,'heart');assert.equal(panel.hidden,true);assert.equal(d.body.classList.contains('emote-open'),false);button.click();d.querySelector('canvas').dispatchEvent(new w.Event('pointerdown',{bubbles:true}));assert.equal(panel.hidden,true);button.click();w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'}));assert.equal(panel.hidden,true);dom.window.close();
});
