import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';
import {createTouchControls} from '../dist/game-input.js';

test('world taps keep working while ordinary drags, pinch and hover cannot change the camera',t=>{
 const dom=new JSDOM('<canvas></canvas><div id="joystick"><span class="joystick-stick"></span></div><button id="jump"></button><button id="run"></button><button id="brake"></button>',{pretendToBeVisual:true}),w=dom.window,d=w.document;
 const previousWindow=globalThis.window,previousDocument=globalThis.document;Object.assign(globalThis,{window:w,document:d});
 t.after(()=>{w.close();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousDocument===undefined)delete globalThis.document;else globalThis.document=previousDocument;});
 w.HTMLElement.prototype.setPointerCapture=()=>{};
 const canvas=d.querySelector('canvas'),joystick=d.querySelector('#joystick');joystick.getBoundingClientRect=()=>({left:0,top:0,width:112,height:112});
 let manual=false,locked=false,taps=0,orbits=0,zooms=0,move={x:0,y:0};
 const controls=createTouchControls({canvas,joystick,jumpButton:d.querySelector('#jump'),runButton:d.querySelector('#run'),brakeButton:d.querySelector('#brake'),locked:()=>locked,canAdjustCamera:()=>manual,onMove:(x,y)=>move={x,y},onOrbit:()=>orbits++,onZoom:()=>zooms++,onTap:()=>taps++,onJump:()=>{}});
 const send=(element,type,id,x=200,y=200,extra={})=>element.dispatchEvent(Object.assign(new w.Event(type,{cancelable:true}),{pointerId:id,clientX:x,clientY:y,button:0,pointerType:'touch',...extra}));
 send(canvas,'pointermove',1,250,240,{pointerType:'mouse'});assert.equal(orbits,0);
 send(canvas,'pointerdown',1);send(canvas,'pointermove',1,240,260);send(canvas,'pointerup',1,240,260);assert.equal(orbits,0);assert.equal(taps,0);
 send(canvas,'pointerdown',2);send(canvas,'pointerup',2);assert.equal(taps,1);
 send(canvas,'pointerdown',3,100,100);send(canvas,'pointerdown',4,180,100);send(canvas,'pointermove',4,240,100);send(canvas,'pointerup',4,240,100);send(canvas,'pointerup',3,100,100);assert.equal(zooms,0);assert.equal(taps,1);
 manual=true;w.dispatchEvent(new w.CustomEvent('lab:camera-mode',{detail:{active:true}}));
 send(joystick,'pointerdown',10,56,56);send(joystick,'pointermove',10,100,56);
 send(canvas,'pointerdown',11);send(canvas,'pointermove',11,225,218);assert.equal(orbits,1);assert.equal(move.x,1);
 send(canvas,'pointerdown',12,300,218);send(canvas,'pointermove',12,340,218);assert.equal(zooms,1);
 manual=false;w.dispatchEvent(new w.CustomEvent('lab:camera-mode',{detail:{active:false}}));send(canvas,'pointermove',11,260,280);send(canvas,'pointerup',11,260,280);assert.equal(orbits,1);assert.equal(taps,1);assert.deepEqual(move,{x:0,y:0});
 send(canvas,'pointerdown',20,200,200,{pointerType:'mouse',button:2});send(canvas,'pointermove',20,230,230,{pointerType:'mouse',button:2});send(canvas,'pointerup',20,230,230,{pointerType:'mouse',button:2});assert.equal(orbits,2);assert.equal(taps,1);
 const contextMenu=new w.Event('contextmenu',{cancelable:true});canvas.dispatchEvent(contextMenu);assert.equal(contextMenu.defaultPrevented,true);
 manual=true;locked=true;send(canvas,'pointerdown',30);send(canvas,'pointermove',30,240,260);send(canvas,'pointerup',30,240,260);assert.equal(orbits,2);assert.equal(taps,1);
 controls.dispose();
});

async function ui(t,{canvas=true}={}){
 const dom=new JSDOM(`<body>${canvas?'<canvas id="park-canvas" tabindex="0"></canvas>':''}<dialog id="studio"><section id="pane-light"><div id="studio-public-actions"></div></section></dialog><input id="chat-input"></body>`,{url:'https://winter.test',runScripts:'outside-only',pretendToBeVisual:true});
 t.after(()=>dom.window.close());const w=dom.window,context=dom.getInternalVMContext(),modules=new Map();w.matchMedia=()=>({matches:true});
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){if(!this.open)return;this.open=false;this.dispatchEvent(new w.Event('close'));};
 async function mod(file){if(modules.has(file))return modules.get(file);const m=new vm.SourceTextModule(fs.readFileSync(file,'utf8'),{context,identifier:file});modules.set(file,m);await m.link(s=>mod(path.resolve(path.dirname(file),s)));return m;}
 await(await mod(path.resolve('dist/camera-controls.js'))).evaluate();
 return {w,d:w.document,ready(){w.labCameraReady=true;w.dispatchEvent(new w.Event('lab:camera-ready'));}};
}

test('manual camera UI waits for renderer readiness and done preserves the selected view',async t=>{
 const {w,d,ready}=await ui(t);const toggle=d.querySelector('#camera-toggle'),toolbar=d.querySelector('#camera-toolbar');let resets=0;w.addEventListener('lab:camera-reset',()=>resets++);
 assert.equal(toggle.hidden,true);assert.equal(d.querySelector('.camera-setting').hidden,true);toggle.click();assert.equal(w.labCameraAdjusting,false);
 ready();assert.equal(toggle.hidden,false);toggle.click();assert.equal(w.labCameraAdjusting,true);assert.equal(toolbar.hidden,false);assert.equal(toggle.getAttribute('aria-pressed'),'true');assert.equal(d.activeElement,d.querySelector('#park-canvas'));
 d.querySelector('#camera-done').click();assert.equal(w.labCameraAdjusting,false);assert.equal(toolbar.hidden,true);assert.equal(resets,0);
 toggle.click();w.dispatchEvent(new w.Event('lab:pause'));assert.equal(w.labCameraAdjusting,false);assert.equal(resets,0);
 toggle.click();d.querySelector('#camera-reset').click();assert.equal(resets,1);assert.equal(w.labCameraAdjusting,false);
 w.labCameraReady=false;w.dispatchEvent(new w.Event('lab:camera-ready'));assert.equal(toggle.hidden,true);
});

test('camera shortcuts respect text and modal focus; Escape ends adjustment before settings can open',async t=>{
 const {w,d,ready}=await ui(t);ready();let resets=0,settings=0;w.addEventListener('lab:camera-reset',()=>resets++);d.addEventListener('keydown',event=>{if(event.key==='Escape')settings++;});
 const key=(target,key,code,extra={})=>{const event=new w.KeyboardEvent('keydown',{key,code,bubbles:true,cancelable:true,...extra});target.dispatchEvent(event);return event;};
 const input=d.querySelector('#chat-input'),canvas=d.querySelector('#park-canvas'),studio=d.querySelector('#studio');
 input.focus();key(input,'r','KeyR');key(canvas,'r','KeyR',{isComposing:true});key(canvas,'r','KeyR',{ctrlKey:true});assert.equal(resets,0);
 studio.showModal();key(canvas,'r','KeyR');assert.equal(resets,0);studio.close();key(canvas,'r','KeyR');assert.equal(resets,1);
 d.querySelector('#camera-toggle').click();const event=key(canvas,'Escape','Escape');assert.equal(event.defaultPrevented,true);assert.equal(w.labCameraAdjusting,false);assert.equal(settings,0);assert.equal(resets,1);
 studio.showModal();d.querySelector('#camera-settings-edit').click();assert.equal(studio.open,false);assert.equal(w.labCameraAdjusting,true);
 studio.showModal();d.querySelector('#camera-settings-reset').click();assert.equal(studio.open,true);assert.equal(w.labCameraAdjusting,false);assert.equal(resets,2);
});

test('learning fallback without a world canvas has no camera controls or initialization error',async t=>{
 const {w,d,ready}=await ui(t,{canvas:false});ready();assert.equal(d.querySelector('#camera-toggle'),null);assert.equal(d.querySelector('#camera-toolbar'),null);assert.equal(w.labCameraAdjusting,undefined);
});

test('tree decoration keeps manual camera access and its nonmodal dock without resetting the view',async t=>{
 const {w,d,ready}=await ui(t);const style=d.createElement('style');style.textContent=fs.readFileSync('dist/camera-controls.css','utf8');d.head.append(style);
 const dock=d.createElement('div');dock.id='tree-tools';dock.setAttribute('role','toolbar');dock.textContent='트리 꾸미기';d.body.append(dock);
 const wishFeed=d.createElement('dialog');wishFeed.dataset.nonmodal='true';wishFeed.open=true;d.body.append(wishFeed);
 d.body.classList.add('tree-decorating');ready();let resets=0;w.addEventListener('lab:camera-reset',()=>resets++);
 const toggle=d.querySelector('#camera-toggle'),toolbar=d.querySelector('#camera-toolbar');
 assert.equal(toggle.hidden,false);assert.notEqual(w.getComputedStyle(toggle).display,'none');assert.equal(w.getComputedStyle(toggle).bottom,'auto');
 toggle.click();assert.equal(w.labCameraAdjusting,true);assert.equal(toolbar.hidden,false);assert.notEqual(w.getComputedStyle(toolbar).display,'none');assert.equal(w.getComputedStyle(toggle).display,'none');
 assert.equal(wishFeed.open,true);assert.equal(dock.hidden,false);assert.equal(d.body.classList.contains('tree-decorating'),true);
 d.querySelector('#camera-done').click();assert.equal(w.labCameraAdjusting,false);assert.notEqual(w.getComputedStyle(toggle).display,'none');assert.equal(toolbar.hidden,true);assert.equal(resets,0);assert.equal(wishFeed.open,true);
 d.querySelector('#studio').showModal();toggle.click();assert.equal(w.labCameraAdjusting,false);
});
