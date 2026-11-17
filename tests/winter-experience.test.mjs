import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {createWinterExperience} from '../dist/winter-experience.js';
import {resortRides,resortDestinations,skiStarts} from '../dist/resort-layout.js';
import {walkToStart} from './ski-driver.mjs';
function setup(t){const dom=new JSDOM(fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8'),{url:'https://winter.test'}),w=dom.window;t.after(()=>w.close());Object.assign(globalThis,{window:w,document:w.document,Event:w.Event,CustomEvent:w.CustomEvent,localStorage:w.localStorage});let trips=0;const winter={rides:resortRides,destinations:resortDestinations,rideChair:{visible:false,position:{set(){}},rotation:{set(){}}}},companion={gear:'ski',winterReady:true,equip(){}};return{e:createWinterExperience(winter,companion,()=>trips++),get trips(){return trips;},click(){document.querySelector('#place-actions button').click();}};}
test('marshmallow stays in hand, toasts at the fire, survives walking and can be eaten',t=>{
 const {e,click}=setup(t);e.rides.start('lift');e.update(45);e.proximity(10,-358.5);click();assert.equal(e.heldItem,'marshmallow');e.update(.1,{x:1});assert.equal(e.heldItem,'marshmallow');assert.equal(e.roast,0);
 e.proximity(-3,-347.5);click();e.update(2,{});assert.equal(e.gesture,'roast');assert.ok(e.roast>.3);e.update(.1,{x:1});assert.equal(e.gesture,'');const saved=e.roast;assert.equal(e.heldItem,'marshmallow');
 e.proximity(-3,-347.5);click();e.update(4,{});assert.ok(e.roast>saved);assert.equal(e.roast,1);assert.equal(e.gesture,'');e.proximity(-3,-347.5);assert.match(document.querySelector('#place-actions button').textContent,/먹기/);click();assert.equal(e.gesture,'eat');e.update(3,{});assert.equal(e.heldItem,'');
 e.proximity(-10,-358.5);click();assert.equal(e.heldItem,'odeng');assert.equal(e.gesture,'');e.useHeldItem();assert.equal(e.gesture,'eat');e.update(3,{});assert.equal(e.heldItem,'');
});
test('physical gates show one contextual action and stopping skis never teleports down',t=>{
 const app=setup(t),{e}=app;e.rides.start('lift');e.update(45);for(const gate of skiStarts){e.proximity(gate.x,gate.z);assert.equal(document.querySelector('#place-name').textContent,gate.name);assert.equal(document.querySelectorAll('#place-actions button').length,1);}
 const before=walkToStart(e.rides,'expert');e.proximity(before.x,before.z);app.click();const waiting=e.update(2,{});assert.equal(waiting.runId,'expert');assert.equal(waiting.x,before.x);assert.equal(waiting.z,before.z);assert.equal(waiting.speed,0);document.querySelector('#stop-ride').click();assert.equal(app.trips,0);assert.equal(e.rides.mode,'');
});
test('resting has no countdown and movement stands up',t=>{
 const {e}=setup(t);e.show('interior-tea');document.querySelector('#place-actions button').click();e.update(30,{});assert.equal(document.querySelector('#ride-label').textContent,'');assert.equal(document.querySelector('#stop-ride').textContent,'일어나기');assert.equal(e.update(.05,{x:1}),null);assert.equal(e.active,false);
});

test('portable items replace each other, bubbles keep blowing while walking, and map travel retains them',t=>{
 const {e}=setup(t);const click=(name)=>[...document.querySelectorAll('#place-actions button')].find(b=>b.getAttribute('aria-label')===name).click();e.show('bubbles');click('비눗방울');assert.equal(e.heldItem,'bubble-wand');e.update(.1,{x:1});assert.equal(e.gesture,'bubble');assert.equal(e.focusGesture,'');e.cancel();assert.equal(e.heldItem,'bubble-wand');e.show('bubbles');click('풍선');assert.equal(e.heldItem,'balloon');assert.equal(e.gesture,'');e.show('coffee');click('커피');assert.equal(e.heldItem,'coffee');e.proximity(0,30);assert.equal(document.querySelector('#place-card').hidden,true);assert.equal(e.useHeldItem(),true);assert.equal(e.gesture,'drink');e.update(3,{});assert.equal(e.heldItem,'coffee');e.show('icecream');click('아이스크림');assert.equal(e.heldItem,'icecream');
});

test('expired shared lift seats return the rider safely and release their reservation',async t=>{
 const app=setup(t);let releases=0;window.reserveRide=async()=>({kind:'lift',cabin:1,seat:0,startedAt:Date.now()});window.releaseRide=()=>releases++;
 app.e.show('ski');app.click();await new Promise(r=>setTimeout(r,0));assert.equal(app.e.rides.mode,'lift');
 window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:'lift'}));assert.equal(app.e.active,false);assert.equal(app.trips,1);assert.equal(releases,1);
 window.dispatchEvent(new CustomEvent('lab:ride-expired',{detail:'lift'}));assert.equal(app.trips,1);
});

test('leaving during an outstanding boarding request never reboards the player',async t=>{
 const app=setup(t);let resolveClaim,releases=0;window.reserveRide=()=>new Promise(resolve=>resolveClaim=resolve);window.releaseRide=()=>releases++;
 app.e.show('ski');app.click();app.e.cancel();resolveClaim({kind:'lift',cabin:1,seat:0,startedAt:Date.now()});await new Promise(r=>setTimeout(r,0));
 assert.equal(app.e.active,false);assert.equal(releases,1);assert.equal(app.trips,0);
});
