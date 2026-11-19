import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
import {createTouchControls,joystickVector} from '../dist/game-input.js';import {moveVector} from '../dist/movement.js';import {createRenderBudget} from '../dist/render-budget.js';import {createLabelLayout} from '../dist/world-labels.js';
test('all analog angles retain magnitude, full deflection is normalized in every camera heading',()=>{
 for(let i=0;i<72;i++){const angle=i*Math.PI/36,dx=Math.cos(angle),dy=Math.sin(angle);for(const radius of [32,40,56]){
  const full=joystickVector(dx*radius,dy*radius,radius),beyond=joystickVector(dx*radius*5,dy*radius*5,radius),half=joystickVector(dx*radius*.5,dy*radius*.5,radius);
  assert.ok(Math.abs(Math.hypot(full.x,full.y)-1)<1e-12);assert.ok(Math.abs(full.x-beyond.x)+Math.abs(full.y-beyond.y)<1e-12);assert.ok(Math.hypot(half.x,half.y)>.4&&Math.hypot(half.x,half.y)<.6);
  for(const yaw of [0,.5,Math.PI,-2]){const p=moveVector(full.x,full.y,yaw);assert.ok(Math.abs(Math.hypot(p.x,p.z)-1)<1e-12);}
 }}
});
test('touch capture stays saturated outside the ring, separates fingers and stops on interruption',()=>{
 const dom=new JSDOM('<canvas></canvas><div id="joy" style="--joystick-radius:40px"><i class="joystick-stick"></i></div><button id="jump"></button><button id="run"></button><button id="brake"></button>',{pretendToBeVisual:true}),w=dom.window,d=w.document;Object.assign(globalThis,{window:w,document:d});
 w.HTMLElement.prototype.setPointerCapture=()=>{};const joystick=d.querySelector('#joy'),canvas=d.querySelector('canvas'),runButton=d.querySelector('#run'),jumpButton=d.querySelector('#jump'),brakeButton=d.querySelector('#brake');let reads=0;joystick.getBoundingClientRect=()=>{reads++;return{left:10,top:100,width:112,height:112};};let vector,orbits=0;
 const c=createTouchControls({joystick,canvas,runButton,jumpButton,brakeButton,canAdjustCamera:()=>true,onMove:(x,y)=>vector={x,y},onOrbit:()=>orbits++,onZoom:()=>{},onTap:()=>{},onJump:()=>{}}),send=(el,type,id,x=66,y=156)=>el.dispatchEvent(Object.assign(new w.Event(type,{cancelable:true}),{pointerId:id,clientX:x,clientY:y}));
 send(joystick,'pointerdown',1);assert.deepEqual(vector,{x:0,y:0});send(joystick,'pointermove',1,86,156);assert.ok(vector.x>.4&&vector.x<.6);send(joystick,'pointermove',1,400,156);assert.equal(vector.x,1);assert.equal(reads,1,'no synchronous bounds reads during dragging');
 send(runButton,'pointerdown',2);send(canvas,'pointerdown',3,250,200);send(canvas,'pointermove',3,270,215);send(joystick,'pointerup',4);assert.equal(vector.x,1);assert.equal(c.sprinting,true);assert.equal(orbits,1);
 for(const event of ['resize','blur','pagehide','lab:pause']){w.dispatchEvent(new w.Event(event));assert.deepEqual(vector,{x:0,y:0});assert.equal(c.sprinting,false);send(joystick,'pointerdown',1);send(joystick,'pointermove',1,-100,200);}
 c.setMode('ski');send(brakeButton,'pointerdown',8);send(brakeButton,'pointerup',9);assert.equal(c.braking,true);send(brakeButton,'pointercancel',8);assert.equal(c.braking,false);c.dispose();w.close();delete globalThis.window;delete globalThis.document;
});
test('mobile quality preserves native pixels and resolved edges, low load tier disables postprocessing',()=>{
 const b=createRenderBudget({pixelRatio:3,mobile:true});assert.equal(b.settings.pixelRatio,1.25);assert.equal(b.settings.samples,2);let now=1;for(let i=0;i<600;i++){now+=40;b.sample(40,now);}assert.equal(b.settings.quality,'low');assert.equal(b.settings.pixelRatio,1);const reduced={...b.settings};for(let i=0;i<30;i++){now+=16;b.sample(16,now);}assert.deepEqual(b.settings,reduced);b.setMode('high');assert.equal(b.settings.pixelRatio,1.5);assert.equal(b.settings.samples,2);
});
test('nickname and speech bounds fit all screen edges without remeasuring every frame',()=>{
 const dom=new JSDOM('<span><b>닉네임</b><div class="speech-bubble">길게 쓴 말풍선</div></span>'),el=dom.window.document.querySelector('span');el.getBoundingClientRect=()=>({left:0,top:100,right:70,bottom:120,width:70,height:20});el.querySelector('div').getBoundingClientRect=()=>({left:-55,top:30,right:125,bottom:95,width:180,height:65});const layout=createLabelLayout(el);
 for(const[x,y]of [[-5,20],[389,843],[195,420]]){const p=layout.fit(x,y,390,844);assert.ok(p.bounds.left>=10&&p.bounds.right<=380&&p.bounds.top>=10&&p.bounds.bottom<=834);}layout.dispose();dom.window.close();
});
