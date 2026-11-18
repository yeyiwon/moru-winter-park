import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {worldInputBlocked,isTextInput,createMouseLook} from '../dist/game-input.js';
test('world input follows UI and text focus, never platform or touch capabilities',t=>{
 const dom=new JSDOM('<body><canvas tabindex="0"></canvas><input><div contenteditable="true"><span id="edit"></span></div><dialog></dialog><dialog data-nonmodal></dialog></body>',{pretendToBeVisual:true});t.after(()=>dom.window.close());const d=dom.window.document;
 assert.equal(worldInputBlocked(d),false);for(const cls of ['invite-gate','studio-open','quiz-open','chat-typing','menu-open']){d.body.classList.add(cls);assert.equal(worldInputBlocked(d),true);d.body.classList.remove(cls);}
 d.querySelector('input').focus();assert.equal(worldInputBlocked(d),true);d.querySelector('canvas').focus();assert.equal(worldInputBlocked(d),false);assert.ok(isTextInput(d.querySelector('#edit')));
 d.querySelector('dialog').open=true;assert.equal(worldInputBlocked(d),true);d.querySelector('dialog').open=false;d.querySelector('[data-nonmodal]').open=true;assert.equal(worldInputBlocked(d),false);
});
test('free-look is explicit, releases on UI/Escape/blur, never relocks, and removes listeners',async t=>{
 const dom=new JSDOM('<body><details id="park-menu"><button id="start"></button></details><output></output><canvas></canvas></body>',{pretendToBeVisual:true});t.after(()=>dom.window.close());const win=dom.window,doc=win.document,canvas=doc.querySelector('canvas'),button=doc.querySelector('button'),status=doc.querySelector('output');let locks=0,orbit=0,blocked=false;
 canvas.requestPointerLock=async()=>{locks++;doc.pointerLockElement=canvas;doc.dispatchEvent(new win.Event('pointerlockchange'));};doc.exitPointerLock=()=>{doc.pointerLockElement=null;doc.dispatchEvent(new win.Event('pointerlockchange'));};
 const control=createMouseLook({canvas,button,status,doc,win,locked:()=>blocked,onOrbit:(x,y)=>orbit+=x+y});assert.equal(locks,0);button.click();await Promise.resolve();assert.equal(doc.pointerLockElement,canvas);
 doc.dispatchEvent(Object.assign(new win.Event('mousemove'),{movementX:4,movementY:2}));assert.equal(orbit,6);blocked=true;doc.dispatchEvent(Object.assign(new win.Event('mousemove'),{movementX:8,movementY:2}));assert.equal(orbit,6);blocked=false;
 win.dispatchEvent(new win.Event('lab:pause'));assert.equal(doc.pointerLockElement,null);win.dispatchEvent(new win.Event('lab:close'));assert.equal(locks,1);
 button.click();await Promise.resolve();win.dispatchEvent(new win.KeyboardEvent('keydown',{code:'Escape',cancelable:true}));assert.equal(doc.pointerLockElement,null);
 button.click();await Promise.resolve();win.dispatchEvent(new win.Event('blur'));assert.equal(doc.pointerLockElement,null);control.dispose();button.click();assert.equal(locks,3);
});
