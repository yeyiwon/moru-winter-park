import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {onsenEntrances,canUseOnsen,onsenTransitionValid} from '../dist/onsen-layout.js';
import {createSpaController} from '../dist/spa-experience.js';
import {spaPositionValid} from '../dist/resort-layout.js';
import {canStandAt} from '../dist/movement.js';
import {findPath,clearSegment} from '../dist/navigation.js';
import {regions} from '../dist/region-layout.js';
import {cascadeAnchors,cascadePoint,cascadePhase,createOnsenWaterfall} from '../dist/onsen-waterfall.js';
import {createOnsenWater} from '../dist/onsen-water.js';

test('both authored bath entrances have reachable standing space, not just one precise point',()=>{
 const start=regions.spa.arrival;
 for(const b of Object.values(onsenEntrances)){
  assert.ok(canStandAt(b.access.x,b.access.z));assert.ok(findPath(start,b.access).length);
  for(const delta of [-.8,0,.8]){const p=b.id==='bath'?{x:b.access.x+delta,z:b.access.z-.4}:{x:b.access.x-.4,z:b.access.z+delta};assert.ok(canStandAt(p.x,p.z));assert.ok(canUseOnsen(b.id,p));assert.ok(clearSegment(p,b.access));}
  assert.equal(canUseOnsen(b.id,{x:0,z:0}),false);
 }
});
test('entry and exit stay on the shared tread line, validate on the server and finish in walking space',()=>{
 for(const [id,b]of Object.entries(onsenEntrances)){
  const spa=createSpaController();assert.equal(spa.start(id,{x:0,z:0}),false);assert.equal(spa.start(id,b.access),true);assert.equal(spa.state,'Entering');let previous=b.access;
  for(let i=0;i<110;i++){const p=spa.update(1/60);assert.ok(spaPositionValid(p.x,p.y,p.z,p.mode),'entry pose accepted');assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y,p.z-previous.z)<.05,'no teleport');previous=p;}
  assert.equal(spa.state,'Active');for(let i=0;i<200;i++)spa.update(1/60,{x:.3,z:.7});assert.equal(spa.exit(),true);
  let finished;for(let i=0;i<400;i++){const p=spa.update(1/60);if(p?.finished){finished=p;break;}assert.ok(spaPositionValid(p.x,p.y,p.z,p.mode),'exit pose accepted');}
  assert.ok(finished);assert.equal(finished.mode,'');assert.ok(canStandAt(finished.x,finished.z));assert.equal(spa.state,'Idle');assert.equal(spa.active,false);assert.equal(spa.update(.1),null);
 }
});
test('water transition validation rejects arbitrary height, outside corridors and wrong modes',()=>{
 const b=onsenEntrances.bath;assert.equal(onsenTransitionValid(b.access.x,7,b.access.z,'bath'),false);assert.equal(onsenTransitionValid(b.access.x+6,.95,b.access.z,'bath'),false);assert.equal(onsenTransitionValid(b.access.x,.95,b.access.z,'ski'),false);
});
test('waterfall geometry, texture phase and particle fall all follow the downward axis',()=>{
 for(const a of cascadeAnchors){let previous=Infinity;for(let i=0;i<=100;i++){const p=cascadePoint(a,i/100);assert.ok(p.every(Number.isFinite));assert.ok(p[1]<previous);previous=p[1];}assert.ok(Math.abs(cascadePhase(.2,0)-cascadePhase(.3,.1))<1e-12);}
 const fall=createOnsenWaterfall(new T.Group());fall.root.traverse(o=>{if(o.name==='downward-water-sheet'){const uv=o.geometry.attributes.uv,p=o.geometry.attributes.position;assert.ok(p.getY(0)>p.getY(p.count-1));assert.ok(uv.getY(0)<uv.getY(uv.count-1));}});
});
test('water events use a fixed pool, quality limits and reduced motion freeze',()=>{
 const w=createOnsenWater({basin:[-10,124,7.4,6.4]});w.update(4);for(let i=0;i<100;i++)w.ripple(i,2,.7);const u=w.material.uniforms;assert.equal(u.ripples.value.length,8);assert.ok(u.ripples.value.every(r=>r.z===4));w.update(9,true);assert.equal(u.time.value,4);w.setQuality('low');assert.equal(u.rippleCount.value,4);w.clear();assert.ok(u.ripples.value.every(r=>r.z===-100));w.dispose();
});
