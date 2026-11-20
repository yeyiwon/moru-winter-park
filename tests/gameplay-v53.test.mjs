import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import * as T from '../dist/vendor/three.module.js';
import {tileGeometry} from '../dist/mountain-tile.js';
import {alpineHeight,skiRuns} from '../dist/mountain-layout.js';
import {sharedSeatPose,gondolaSchedule,gondolaAtStation,canExitGondola} from '../dist/ride-seats.js';
import {resortRides} from '../dist/resort-layout.js';
import {sampleCableRide} from '../dist/winter-rides.js';
import {createChatViewport,chatShortcut,bubbleDuration} from '../dist/chat-policy.js';
import {nearbyLabel} from '../dist/world-labels.js';
import {showTracks,selectShowTrack} from '../dist/show-tracks.js';
import {winterTracks} from '../dist/music-catalog.js';
import {createFireworkScore} from '../dist/firework-score.js';

test('mixed terrain LODs share real snow heights without hiding the gap behind a skirt',()=>{
 const ray=new T.Raycaster(new T.Vector3(),new T.Vector3(0,-1,0));
 for(const [left,right] of [[12,24],[32,40],[24,40]]){
  const a=new T.Mesh(tileGeometry(2,-16,left),new T.MeshBasicMaterial()),b=new T.Mesh(tileGeometry(3,-16,right),a.material);
  a.updateMatrixWorld();b.updateMatrixWorld();
  for(const z of [-2040,-2039.2,-2025,-2010]){const heights=[];for(const [mesh,x] of [[a,384-.0001],[b,384+.0001]]){ray.ray.origin.set(x,2000,z);const hit=ray.intersectObject(mesh)[0];assert.ok(hit);heights.push(hit.point.y);}assert.ok(Math.abs(heights[0]-heights[1])<.1,heights.join(' vs '));}
  a.geometry.dispose();b.geometry.dispose();a.material.dispose();
 }
});
test('piste entry height stays continuous when crossing the old restoration boundary',()=>{
 for(const r of skiRuns)for(const x of [-80,-40,0,40])assert.ok(Math.abs(alpineHeight(x,r.startZ-.0001)-alpineHeight(x,r.startZ+.0001))<.02);
});
test('gondola boarding is closed until doors open and stops early enough to seat every guest',()=>{
 const cabin=gondolaSchedule.interval*1000;
 assert.equal(gondolaAtStation(cabin+1000).open,false);assert.equal(gondolaAtStation(cabin+3000).open,true);assert.equal(gondolaAtStation(cabin+8000).open,false);
 for(let seat=0;seat<6;seat++){
  const r={kind:'gondola',cabin,seat,startedAt:cabin+3000};let last=sharedSeatPose(r,r.startedAt);
  assert.equal(last.transition,'boarding');
  for(let ms=20;ms<=5000;ms+=20){const p=sharedSeatPose(r,r.startedAt+ms);assert.ok(Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z)<.13);last=p;}
  assert.equal(last.transition,'');
  const arrival=cabin+(resortRides.gondola.boardingSeconds+resortRides.gondola.duration)*1000;
  assert.equal(canExitGondola(r,arrival),false);assert.equal(canExitGondola(r,arrival+2500),true);
  const exiting={...r,startedAt:arrival+2500};last=sharedSeatPose(exiting,exiting.startedAt);
  for(let ms=20;ms<=5000;ms+=20){const p=sharedSeatPose(exiting,exiting.startedAt+ms);assert.ok(Math.hypot(p.x-last.x,p.y-last.y,p.z-last.z)<.13);last=p;}
  assert.equal(last.transitionDone,true);assert.ok(Math.hypot(last.x-resortRides.gondola.exit[0],last.z-resortRides.gondola.exit[2])<.001);
 }
});
test('gondola turnaround starts and ends at rest',()=>{
 const r=resortRides.gondola,start=r.boardingSeconds+r.duration+r.arrivalSeconds;
 for(const t of [start,start+9.5]){const a=sampleCableRide(r,t-.001),b=sampleCableRide(r,t+.001);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.0001);}
});
test('chat retains input ownership until the real keyboard viewport restores',()=>{
 const dom=new JSDOM('<input><button>game</button>',{pretendToBeVisual:true}),w=dom.window,d=w.document,input=d.querySelector('input');
 const vv=new w.EventTarget();vv.height=w.innerHeight;vv.offsetTop=0;w.visualViewport=vv;let restored=0;
 const chat=createChatViewport({win:w,input,onRestored:()=>restored++});chat.open();input.focus();vv.height-=300;chat.close();assert.equal(restored,0);assert.ok(d.body.classList.contains('chat-typing'));
 vv.height=w.innerHeight;chat.close();assert.equal(restored,1);assert.equal(d.body.classList.contains('chat-typing'),false);chat.dispose();dom.window.close();
});
test('Enter works from game buttons but IME, repeats and other form inputs retain ownership',()=>{
 const dom=new JSDOM('<input><button>game</button>'),d=dom.window.document;
 assert.equal(chatShortcut({key:'Enter',target:d.querySelector('button')},d),true);
 for(const extra of [{repeat:true},{isComposing:true},{keyCode:229},{ctrlKey:true},{target:d.querySelector('input')}])assert.equal(chatShortcut({key:'Enter',target:d.querySelector('button'),...extra},d),false);
 assert.equal(bubbleDuration(1000,2000),5500);assert.equal(bubbleDuration(1000,11000),3500);assert.equal(bubbleDuration(1000,20000),0);dom.window.close();
});
test('remote labels require nearby 3D player and camera positions with hysteresis',()=>{
 const subject={x:0,y:0,z:0},camera={x:0,y:2,z:5};
 assert.equal(nearbyLabel({subject,camera,player:{x:0,y:50,z:0},pixels:100}),false);
 assert.equal(nearbyLabel({subject,camera,player:{x:0,y:0,z:36},pixels:30}),false);
 assert.equal(nearbyLabel({subject,camera,player:{x:0,y:0,z:36},pixels:30,visible:true}),true);
});
test('only approved recordings play, BGM order is preserved, each finale ends before its coda',()=>{
 assert.deepEqual(showTracks.map(t=>t.id),['love','wedding-entrance']);assert.ok(Array.from({length:256},(_,i)=>selectShowTrack(i)).every(t=>showTracks.includes(t)));
 assert.deepEqual(winterTracks.slice(0,6).map(t=>t.id),['ethereal-winter-ballet-02','cinematic-christmas-piano-strings-bells','winter-waltz','winter-jazz','waltz-of-snowflakes','wonderful-night']);
 for(const t of showTracks){const score=createFireworkScore(51,t.id),coda=t.sections.find(s=>s.afterglow).start;assert.ok(score.every(s=>s.at+s.flight<coda));for(const pattern of ['comet','fountain','star','willow','double','peony','chrysanthemum'])assert.ok(score.some(s=>s.pattern===pattern),pattern);}
});
