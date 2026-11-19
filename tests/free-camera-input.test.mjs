import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {createTouchControls} from '../dist/game-input.js';

function fixture(t){
 const dom=new JSDOM('<canvas></canvas><div id="joy"><span class="joystick-stick"></span></div><button id="jump"></button><button id="brake"></button><button id="run"></button><dialog><button id="ui">설정</button></dialog>',{pretendToBeVisual:true});
 const w=dom.window,d=w.document,oldWindow=globalThis.window,oldDocument=globalThis.document,captures=new Map();
 Object.assign(globalThis,{window:w,document:d});
 w.HTMLElement.prototype.setPointerCapture=function(id){if(!captures.has(this))captures.set(this,new Set());captures.get(this).add(id);};
 w.HTMLElement.prototype.hasPointerCapture=function(id){return captures.get(this)?.has(id)||false;};
 w.HTMLElement.prototype.releasePointerCapture=function(id){if(!captures.get(this)?.delete(id))return;this.dispatchEvent(Object.assign(new w.Event('lostpointercapture'),{pointerId:id}));};
 const elements={canvas:d.querySelector('canvas'),joystick:d.querySelector('#joy'),jumpButton:d.querySelector('#jump'),brakeButton:d.querySelector('#brake'),runButton:d.querySelector('#run'),ui:d.querySelector('#ui')};
 elements.joystick.getBoundingClientRect=()=>({left:0,top:0,width:120,height:120});
 const state={locked:false,move:{x:0,y:0},orbits:[],zooms:[],taps:[],jumps:0,cancels:0};
 const controls=createTouchControls({...elements,locked:()=>state.locked,onMove:(x,y)=>state.move={x,y},onOrbit:(x,y)=>state.orbits.push({x,y}),onZoom:amount=>state.zooms.push(amount),onTap:e=>state.taps.push({x:e.clientX,y:e.clientY}),onJump:()=>state.jumps++,onCancel:()=>state.cancels++});
 t.after(()=>{controls.dispose();w.close();if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;});
 function pointer(target,type,id,x=100,y=100,extra={}){
  const {timeStamp,...fields}=extra,event=Object.assign(new w.Event(type,{bubbles:true,cancelable:true}),{pointerId:id,clientX:x,clientY:y,pointerType:'touch',button:0,buttons:['pointerup','pointercancel'].includes(type)?0:1,...fields});
  if(timeStamp!==undefined)Object.defineProperty(event,'timeStamp',{value:timeStamp});
  target.dispatchEvent(event);return event;
 }
 function wheel(deltaY,extra={},target=elements.canvas){const event=new w.WheelEvent('wheel',{bubbles:true,cancelable:true,deltaY,...extra});target.dispatchEvent(event);return event;}
 return{w,d,...elements,state,controls,pointer,wheel,captured:()=>[...captures.values()].reduce((n,ids)=>n+ids.size,0)};
}

test('mouse hover is inert, short primary clicks travel, and either mouse drag orbits without a mode',t=>{
 const f=fixture(t),{canvas,state,pointer}=f,mouse={pointerType:'mouse'};
 pointer(canvas,'pointermove',1,300,240,{...mouse,buttons:0});assert.equal(state.orbits.length,0);
 pointer(canvas,'pointerdown',1,100,100,mouse);pointer(canvas,'pointermove',1,106,101,mouse);pointer(canvas,'pointerup',1,106,101,mouse);
 assert.deepEqual(state.taps,[{x:106,y:101}]);assert.equal(state.orbits.length,0,'small click jitter does not turn the camera');
 pointer(canvas,'pointerdown',1,100,100,mouse);pointer(canvas,'pointermove',1,115,105,mouse);pointer(canvas,'pointermove',1,145,120,mouse);pointer(canvas,'pointerup',1,145,120,mouse);
 assert.deepEqual(state.orbits,[{x:15,y:5},{x:30,y:15}]);assert.equal(state.taps.length,1);
 const right={...mouse,button:2,buttons:2};
 pointer(canvas,'pointerdown',2,100,100,right);pointer(canvas,'pointerup',2,100,100,{...right,buttons:0});assert.equal(state.taps.length,1,'a right click never moves the player');
 pointer(canvas,'pointerdown',2,100,100,right);pointer(canvas,'pointermove',2,130,120,right);pointer(canvas,'pointerup',2,130,120,{...right,buttons:0});assert.equal(state.orbits.length,3);
 pointer(canvas,'pointerdown',3,100,100,{...mouse,button:1,buttons:4});pointer(canvas,'pointermove',3,200,200,{...mouse,buttons:4});pointer(canvas,'pointerup',3,200,200,{...mouse,button:1});
 assert.equal(state.orbits.length,3);assert.equal(f.captured(),0);
 const menu=new f.w.Event('contextmenu',{cancelable:true});canvas.dispatchEvent(menu);assert.equal(menu.defaultPrevented,true);
});

test('long presses, released drags without a move event, and mouse releases lost outside the canvas cannot travel',t=>{
 const {canvas,state,pointer}=fixture(t);
 pointer(canvas,'pointerdown',1,100,100,{timeStamp:100});pointer(canvas,'pointerup',1,100,100,{timeStamp:700});
 pointer(canvas,'pointerdown',2,100,100);pointer(canvas,'pointerup',2,160,150);
 assert.equal(state.taps.length,0);
 pointer(canvas,'pointerdown',3,100,100,{pointerType:'mouse'});pointer(canvas,'pointermove',3,150,120,{pointerType:'mouse',buttons:0});pointer(canvas,'pointermove',3,180,120,{pointerType:'mouse',buttons:0});pointer(canvas,'pointerup',3,180,120,{pointerType:'mouse'});
 assert.equal(state.orbits.length,0);assert.equal(state.taps.length,0);
 pointer(canvas,'pointerdown',4,100,100);pointer(canvas,'pointerup',4,100,100);assert.equal(state.taps.length,1,'a fresh click still works');
});

test('wheel zoom works directly, normalizes line/page mice, and leaves browser shortcuts and UI scrolling alone',t=>{
 const {wheel,state,ui,controls}=fixture(t);
 assert.equal(wheel(100).defaultPrevented,true);wheel(3,{deltaMode:1});wheel(1,{deltaMode:2});wheel(-100);
 assert.deepEqual(state.zooms,[2,.96,3,-2]);
 assert.equal(wheel(100,{ctrlKey:true}).defaultPrevented,false);assert.equal(wheel(100,{metaKey:true}).defaultPrevented,false);assert.equal(wheel(0,{deltaX:100}).defaultPrevented,false);assert.equal(wheel(100,{},ui).defaultPrevented,false);
 assert.equal(state.zooms.length,4);state.locked=true;wheel(100);assert.equal(state.zooms.length,4);
 state.locked=false;controls.dispose();assert.equal(wheel(100).defaultPrevented,false);assert.equal(state.zooms.length,4,'dispose removes the wheel listener');
});

test('joystick, jump, one-finger orbit and two-finger world pinch own independent pointers',t=>{
 const {canvas,joystick,jumpButton,state,pointer}=fixture(t);
 pointer(joystick,'pointerdown',1,60,60);pointer(joystick,'pointermove',1,150,60);assert.equal(state.move.x,1);
 pointer(canvas,'pointerdown',2,150,200);pointer(canvas,'pointermove',2,175,210);pointer(jumpButton,'pointerdown',3,0,0);
 assert.deepEqual(state.orbits,[{x:25,y:10}]);assert.equal(state.jumps,1);assert.equal(state.move.x,1);assert.equal(state.zooms.length,0,'joystick and jump fingers are not pinch pointers');
 pointer(canvas,'pointerdown',4,275,210);pointer(canvas,'pointermove',4,315,210);assert.ok(Math.abs(state.zooms[0]+2.8)<1e-9);assert.equal(state.orbits.length,1,'pinch does not also orbit');
 pointer(canvas,'pointerup',4,315,210);pointer(canvas,'pointermove',2,180,215);assert.deepEqual(state.orbits.at(-1),{x:5,y:5},'returning to one finger has no stale pinch delta');
 pointer(canvas,'pointerup',2,180,215);assert.equal(state.taps.length,0);assert.equal(state.move.x,1);
 pointer(jumpButton,'pointerup',99,0,0);pointer(jumpButton,'pointerdown',5,0,0);assert.equal(state.jumps,1,'another pointer cannot release the jump owner');
 pointer(jumpButton,'pointerup',3,0,0);pointer(joystick,'pointerup',1,150,60);assert.deepEqual(state.move,{x:0,y:0});
});

test('extra pinch fingers and pointer cancellation do not jump the camera or create a tap',t=>{
 const {canvas,joystick,state,pointer}=fixture(t);
 pointer(joystick,'pointerdown',10,100,60);assert.ok(state.move.x>0);
 pointer(canvas,'pointerdown',1,100,100);pointer(canvas,'pointerdown',2,200,100);pointer(canvas,'pointerdown',3,300,100);
 pointer(canvas,'pointermove',3,500,100);assert.equal(state.zooms.length,0,'an extra finger does not alter the active pinch pair');
 pointer(canvas,'pointercancel',1,100,100);pointer(canvas,'pointermove',3,510,100);assert.ok(Math.abs(state.zooms[0]+.7)<1e-9,'reselected pair starts from its current separation');
 pointer(canvas,'pointerup',2,200,100);pointer(canvas,'pointercancel',3,510,100);pointer(canvas,'pointerup',3,510,100);pointer(canvas,'pointermove',3,600,100);
 assert.equal(state.taps.length,0);assert.equal(state.orbits.length,0);assert.ok(state.move.x>0,'cancelling a world finger preserves the independent joystick');
});

test('modal locks and pause/blur release owned captures and cannot resume a stale drag',t=>{
 const f=fixture(t),{canvas,joystick,jumpButton,runButton,state,pointer,w,controls}=f;
 pointer(runButton,'pointerdown',1,0,0);pointer(runButton,'pointerup',1,0,0);assert.equal(controls.sprinting,true);
 pointer(joystick,'pointerdown',2,100,60);pointer(canvas,'pointerdown',3,100,100);pointer(jumpButton,'pointerdown',4,0,0);assert.equal(f.captured(),3);
 state.locked=true;pointer(canvas,'pointermove',3,160,120);assert.equal(f.captured(),0);assert.deepEqual(state.move,{x:0,y:0});assert.equal(controls.sprinting,false);assert.equal(state.orbits.length,0);
 pointer(canvas,'pointerdown',5,100,100);pointer(jumpButton,'pointerdown',6,0,0);pointer(canvas,'pointerup',5,100,100);assert.equal(state.taps.length,0);assert.equal(state.jumps,1);
 state.locked=false;pointer(canvas,'pointermove',3,200,140);pointer(canvas,'pointerup',3,200,140);assert.equal(state.orbits.length,0);assert.equal(state.taps.length,0);
 for(const event of ['lab:pause','blur']){
  pointer(joystick,'pointerdown',7,100,60);pointer(canvas,'pointerdown',8,100,100);w.dispatchEvent(new w.Event(event));assert.equal(f.captured(),0);assert.deepEqual(state.move,{x:0,y:0});pointer(canvas,'pointermove',8,160,120);pointer(canvas,'pointerup',8,160,120);
 }
 assert.equal(state.orbits.length,0);assert.equal(state.taps.length,0);
 pointer(canvas,'pointerdown',9,100,100);pointer(canvas,'pointermove',9,120,110);assert.deepEqual(state.orbits,[{x:20,y:10}]);
});

test('legacy learning open and close reset a held gesture even when no pointer moves while the modal is open',t=>{
 const f=fixture(t),{canvas,joystick,runButton,state,pointer,w,controls}=f;
 pointer(runButton,'pointerdown',1,0,0);pointer(runButton,'pointerup',1,0,0);
 pointer(joystick,'pointerdown',2,100,60);pointer(canvas,'pointerdown',3,100,100);
 assert.equal(f.captured(),2);assert.equal(controls.sprinting,true);
 // app.js opens the legacy learning dialog with lab:open, not lab:pause.
 state.locked=true;w.dispatchEvent(new w.Event('lab:open'));
 assert.equal(f.captured(),0);assert.equal(controls.sprinting,false);assert.deepEqual(state.move,{x:0,y:0});
 state.locked=false;w.dispatchEvent(new w.Event('lab:close'));
 pointer(canvas,'pointermove',3,160,120);pointer(canvas,'pointerup',3,160,120);
 assert.equal(state.orbits.length,0);assert.equal(state.taps.length,0);
 pointer(canvas,'pointerdown',4,100,100);w.dispatchEvent(new w.Event('lab:close'));
 assert.equal(f.captured(),0);pointer(canvas,'pointermove',4,140,120);pointer(canvas,'pointerup',4,140,120);
 assert.equal(state.orbits.length,0);assert.equal(state.taps.length,0);
 pointer(canvas,'pointerdown',5,100,100);pointer(canvas,'pointermove',5,120,110);assert.equal(state.orbits.length,1,'a new deliberate drag works after closing');
});

test('ride modes suppress locomotion but preserve deliberate camera gestures, and capture loss never becomes a tap',t=>{
 const {canvas,joystick,jumpButton,state,pointer,controls,w}=fixture(t);
 controls.setMode('ferris');pointer(joystick,'pointerdown',1,100,60);pointer(jumpButton,'pointerdown',2,0,0);pointer(canvas,'pointerdown',3,100,100);pointer(canvas,'pointermove',3,130,110);
 assert.deepEqual(state.move,{x:0,y:0});assert.equal(state.jumps,0);assert.deepEqual(state.orbits,[{x:30,y:10}]);
 canvas.releasePointerCapture(3);pointer(canvas,'pointermove',3,160,120);pointer(canvas,'pointerup',3,160,120);assert.equal(state.orbits.length,1);assert.equal(state.taps.length,0);
 controls.setMode('walk');pointer(canvas,'pointerdown',4,100,100);w.dispatchEvent(new w.Event('lab:camera-mode'));pointer(canvas,'pointermove',4,120,110);pointer(canvas,'pointerup',4,120,110);
 assert.equal(state.orbits.length,2,'obsolete camera-mode events no longer gate or cancel input');assert.equal(state.taps.length,0);
});
