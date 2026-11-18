import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {createWinterExperience} from '../dist/winter-experience.js';
import {resortRides,resortDestinations,skiStarts,skiRunCenter,alpineShift} from '../dist/resort-layout.js';
import {walkToStart} from './ski-driver.mjs';
import * as T from '../dist/vendor/three.module.js';
import {ferrisDimensions} from '../dist/ferris-layout.js';
import {treeLayout} from '../dist/tree-layout.js';
function setup(t){const dom=new JSDOM(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://winter.test'}),w=dom.window;t.after(()=>w.close());Object.assign(globalThis,{window:w,document:w.document,Event:w.Event,CustomEvent:w.CustomEvent,localStorage:w.localStorage});let trips=0;const winter={rides:resortRides,destinations:resortDestinations,rideChair:{visible:false,position:{set(){}},rotation:{set(){}}}},companion={gear:'ski',winterReady:true,equip(){}};return{e:createWinterExperience(winter,companion,()=>trips++),get trips(){return trips;},click(){document.querySelector('#place-actions button').click();}};}
test('tree decoration is available around the entire plaza, with its prompt near the visitor',t=>{
 setup(t);let opened=0;window.addEventListener('lab:tree-open',()=>opened++);
 const winter={rides:resortRides,destinations:[{id:'tree',name:'소원 트리',...treeLayout.arrival}],rideChair:{visible:false}},e=createWinterExperience(winter,{equip(){}},()=>{});
 for(let i=0;i<12;i++){const angle=i*Math.PI/6,x=treeLayout.x+Math.cos(angle)*20,z=treeLayout.z+Math.sin(angle)*20;e.proximity(x,z);assert.equal(document.querySelector('#place-card').hidden,false);assert.equal(document.querySelector('#place-actions button').getAttribute('aria-label'),'트리 꾸미기');assert.ok(Math.hypot(e.anchor.x-x,e.anchor.z-z)<3);document.querySelector('#place-actions button').click();}
 assert.equal(opened,12);e.proximity(treeLayout.x+40,treeLayout.z);assert.equal(document.querySelector('#place-card').hidden,true);
});
test('marshmallow stays in hand, toasts at the fire, survives walking and can be eaten',t=>{
 const {e,click}=setup(t);e.rides.start('lift');e.update(45);e.proximity(10,-358.5+alpineShift);click();assert.equal(e.heldItem,'marshmallow');e.update(.1,{x:1});assert.equal(e.heldItem,'marshmallow');assert.equal(e.roast,0);
 e.proximity(-3,-347.5+alpineShift);click();e.update(2,{});assert.equal(e.gesture,'roast');assert.ok(e.roast>.3);e.update(.1,{x:1});assert.equal(e.gesture,'');const saved=e.roast;assert.equal(e.heldItem,'marshmallow');
 e.proximity(-3,-340+alpineShift);e.proximity(-3,-347.5+alpineShift);click();e.update(4,{});assert.ok(e.roast>saved);assert.equal(e.roast,1);assert.equal(e.gesture,'');e.proximity(-3,-340+alpineShift);e.proximity(-3,-347.5+alpineShift);assert.match(document.querySelector('#place-actions button').textContent,/먹기/);click();assert.equal(e.gesture,'eat');e.update(3,{});assert.equal(e.heldItem,'');
 e.proximity(-10,-358.5+alpineShift);click();assert.equal(e.heldItem,'odeng');assert.equal(e.gesture,'');e.useHeldItem();assert.equal(e.gesture,'eat');e.update(3,{});assert.equal(e.heldItem,'');
});
test('physical gates show one contextual action and stopping skis never teleports down',t=>{
 const app=setup(t),{e}=app;e.rides.start('lift');e.update(45);for(const gate of skiStarts){e.proximity(gate.x,gate.z);assert.equal(document.querySelector('#place-name').textContent,gate.name);assert.equal(document.querySelectorAll('#place-actions button').length,1);}
 const before=walkToStart(e.rides,'expert');e.proximity(before.x,before.z);app.click();const waiting=e.update(2,{});assert.equal(waiting.runId,'expert');assert.equal(waiting.x,before.x);assert.equal(waiting.z,before.z);assert.equal(waiting.speed,0);document.querySelector('#stop-ride').click();assert.equal(app.trips,0);assert.equal(e.rides.mode,'');
});
test('resting has no countdown and movement stands up',t=>{
 const {e}=setup(t);e.show('interior-tea');document.querySelector('#place-actions button').click();e.update(30,{});assert.equal(document.querySelector('#ride-label').textContent,'');assert.equal(document.querySelector('#stop-ride').textContent,'일어나기');assert.equal(e.update(.05,{x:1}),null);assert.equal(e.active,false);
});

test('portable items replace each other, bubbles keep blowing while walking, and map travel retains them',t=>{
 const {e}=setup(t);const click=(name)=>[...document.querySelectorAll('#place-actions button')].find(b=>b.getAttribute('aria-label')===name).click();e.show('bubbles');click('비눗방울');assert.equal(e.heldItem,'bubble-wand');e.update(.1,{x:1});assert.equal(e.gesture,'');window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyE'}));e.update(.1,{x:1});assert.equal(e.gesture,'bubble');assert.equal(e.focusGesture,'');window.dispatchEvent(new window.KeyboardEvent('keyup',{code:'KeyE'}));assert.equal(e.gesture,'');e.cancel();assert.equal(e.heldItem,'bubble-wand');e.show('bubbles');click('풍선');assert.equal(e.heldItem,'balloon');assert.equal(e.gesture,'');e.show('coffee');click('커피');assert.equal(e.heldItem,'coffee');e.proximity(0,30);assert.equal(document.querySelector('#place-card').hidden,true);assert.equal(e.useHeldItem(),true);assert.equal(e.gesture,'drink');e.update(3,{});assert.equal(e.heldItem,'coffee');e.show('icecream');click('아이스크림');assert.equal(e.heldItem,'icecream');
});

test('expired shared lift seats return the rider safely and release their reservation',async t=>{
 const app=setup(t);let releases=0;window.reserveRide=async()=>({kind:'lift',cabin:1,seat:0,startedAt:Date.now()});window.releaseRide=()=>releases++;
 app.e.show('ski');app.click();await new Promise(r=>setTimeout(r,0));assert.equal(app.e.rides.mode,'lift');
 window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:'lift'}));assert.equal(app.e.active,false);assert.equal(app.trips,1);assert.equal(releases,1);
 window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:'lift'}));assert.equal(app.trips,1);
});

test('popcorn is picked up at its existing counter, carried while moving and replaced by another item',t=>{
 const {e,click}=setup(t);e.proximity(-32,18.5);assert.equal(document.querySelector('#place-actions button').getAttribute('aria-label'),'팝콘');click();assert.equal(e.heldItem,'popcorn');e.update(.1,{x:1});assert.equal(e.heldItem,'popcorn');e.cancel();assert.equal(e.heldItem,'popcorn');assert.equal(e.useHeldItem(),true);assert.equal(e.gesture,'eat');e.update(.1,{x:1});assert.equal(e.heldItem,'popcorn');assert.equal(e.gesture,'');e.show('coffee');click();assert.equal(e.heldItem,'coffee');
 e.show('popcorn');click();e.useHeldItem();e.update(3,{});assert.equal(e.heldItem,'');assert.equal(e.gesture,'');assert.equal(document.querySelector('#ride-hud').hidden,true);
});

test('bubble hold survives walking and releases on E up, touch cancel, blur, panels and item replacement',t=>{
 const {e}=setup(t);e.show('bubbles');[...document.querySelectorAll('#place-actions button')].find(b=>b.getAttribute('aria-label')==='비눗방울').click();assert.equal(e.gesture,'');
 const down=()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{code:'KeyE'}));down();e.update(9,{x:1,z:1});assert.equal(e.gesture,'bubble');assert.equal(e.active,false);assert.equal(e.focusGesture,'');
 window.dispatchEvent(new window.KeyboardEvent('keyup',{code:'KeyE'}));assert.equal(e.gesture,'');
 const control=document.querySelector('#bubble-hold');control.onpointerdown({preventDefault(){},stopPropagation(){},pointerId:3});assert.equal(e.gesture,'bubble');control.dispatchEvent(new Event('pointercancel'));assert.equal(e.gesture,'');
 for(const event of ['blur','lab:pause']){down();assert.equal(e.gesture,'bubble');window.dispatchEvent(new Event(event));assert.equal(e.gesture,'');}
 down();e.show('coffee');document.querySelector('#place-actions button').click();assert.equal(e.gesture,'');assert.equal(e.heldItem,'coffee');assert.equal(control.hidden,true);
});

test('leaving during an outstanding boarding request never reboards the player',async t=>{
 const app=setup(t);let resolveClaim,releases=0;window.reserveRide=()=>new Promise(resolve=>resolveClaim=resolve);window.releaseRide=()=>releases++;
 app.e.show('ski');app.click();app.e.cancel();resolveClaim({kind:'lift',cabin:1,seat:0,startedAt:Date.now()});await new Promise(r=>setTimeout(r,0));
 assert.equal(app.e.active,false);assert.equal(releases,1);assert.equal(app.trips,0);
});

test('the facing Ferris pair shares a camera focus between the seats',async t=>{
 setup(t);window.innerWidth=390;const claim={kind:'ferris',cabin:2,seat:1,startedAt:Date.now()};window.reserveRide=async()=>claim;
 const winter={rides:resortRides,destinations:[{id:'ferris',name:'관람차',...ferrisDimensions.entrance}],rideChair:{visible:false}},pet={equip(){}};
 const e=createWinterExperience(winter,pet,()=>{});e.show('ferris');document.querySelector('#place-actions button').click();await new Promise(r=>setTimeout(r,0));
 const pose=e.update(0,{}),offset=ferrisDimensions.seatDepth*ferrisDimensions.scale;assert.ok(Math.abs(pose.view.focus.x-(pose.x-Math.sin(ferrisDimensions.yaw)*offset))<1e-9);assert.ok(Math.abs(pose.view.focus.z-(pose.z-Math.cos(ferrisDimensions.yaw)*offset))<1e-9);
 const aim=new T.Vector3(pose.view.focus.x,pose.y+.65,pose.view.focus.z),v=pose.view,camera=new T.PerspectiveCamera(v.fov,390/844,.1,100);camera.position.set(aim.x+Math.sin(v.yaw)*Math.cos(v.pitch)*v.distance,aim.y+Math.sin(v.pitch)*v.distance,aim.z+Math.cos(v.yaw)*Math.cos(v.pitch)*v.distance);camera.lookAt(aim);camera.updateMatrixWorld();
 for(const side of [-1,1]){const anchor=aim.clone();anchor.x+=Math.sin(ferrisDimensions.yaw)*offset*side;anchor.z+=Math.cos(ferrisDimensions.yaw)*offset*side;anchor.y=pose.y;for(const dx of [-.9,.9])for(const dz of [-.9,.9])for(const dy of [-.65,.95]){const screen=anchor.clone().add(new T.Vector3(dx,dy,dz)).project(camera);assert.ok(Math.abs(screen.x)<.96&&Math.abs(screen.y)<.96);}}
});

test('ski completion zeros motion, returns gear and leaves no repeat-ride UI',t=>{
 const {e,click}=setup(t);let returns=0;window.addEventListener('lab:return-winter',()=>returns++);
 e.show('ski');click();e.update(45);const gate=walkToStart(e.rides,'main');e.proximity(gate.x,gate.z);click();let p=e.update(0,{});
 for(let i=0;i<10000&&!p.finished;i++){const desired=Math.atan2(skiRunCenter(p.z+6,'main')-p.x,6),delta=Math.atan2(Math.sin(p.heading-desired),Math.cos(p.heading-desired));p=e.update(.025,{push:true,steer:Math.max(-1,Math.min(1,delta*2.5))});}
 assert.ok(p.finished);assert.equal(p.speed,0);assert.equal(p.mode,'');assert.equal(e.active,false);assert.equal(returns,1);assert.equal(e.lifecycle.state,'Idle');
 for(const selector of ['#place-card','#ride-hud','#ski-controls'])assert.equal(document.querySelector(selector).hidden,true);
 assert.equal(document.querySelector('#ride-label').textContent,'');e.proximity(p.x,p.z);assert.equal(document.querySelector('#place-card').hidden,true);
 e.proximity(-36,-185+alpineShift);assert.equal(document.querySelector('#place-card').hidden,false);click();assert.equal(e.rides.mode,'lift');
});
test('dismissed facility prompts stay hidden until leaving, including after seated actions',t=>{
 const {e,click}=setup(t);e.proximity(387,8.7);click();assert.equal(e.active,true);e.update(.1,{x:1});e.proximity(387,8.7);assert.equal(document.querySelector('#place-card').hidden,true);e.proximity(400,12);e.proximity(387,8.7);assert.equal(document.querySelector('#place-card').hidden,false);
 document.querySelector('#close-place').click();e.proximity(387,8.7);assert.equal(document.querySelector('#place-card').hidden,true);
});

test('walking up to a fire faces it without creating a ride and movement releases facing',t=>{
 const {e,click}=setup(t);e.proximity(-3,-347.5+alpineShift);click();assert.equal(e.update(.1,{}),null);assert.equal(e.focusGesture,'warm');assert.equal(e.facing,Math.PI);assert.equal(e.rides.mode,'');e.update(.1,{x:1});assert.equal(e.facing,null);assert.equal(e.focusGesture,'');
});
