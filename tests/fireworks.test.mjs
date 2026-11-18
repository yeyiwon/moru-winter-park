import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createFireworkScore,fireworkPatterns,fireworkConfig} from '../dist/firework-score.js';
import {createWinterFireworks} from '../dist/winter-fireworks.js';
import {encodeActivity,decodeActivity,activityGestures} from '../dist/activity-state.js';
import {sparklerEntrance} from '../dist/park-layout.js';import {canStandAt} from '../dist/movement.js';
test('seeded show has five distinct patterns, overlaps, depth and a bounded final fade',()=>{
 const score=createFireworkScore(42);assert.deepEqual(score,createFireworkScore(42));assert.notDeepEqual(score,createFireworkScore(43));assert.deepEqual([...new Set(score.map(s=>s.pattern))].sort(),[...fireworkPatterns].sort());assert.ok(score.every(s=>s.at+s.flight+s.life<fireworkConfig.duration));assert.ok(new Set(score.map(s=>s.z)).size>10);assert.ok(score.some((s,i)=>i&&s.at-score[i-1].at<1));assert.equal(fireworkConfig.auto,false);
});
test('show uses fixed buffers, late-join clock, lower mobile density and clears the draw at finish',()=>{
 const scene=new T.Scene(),show=createWinterFireworks(scene),state={id:'test',startsAt:1000,seed:42,state:'playing'};show.setShow(state);show.update(31000);assert.equal(show.root.material.uniforms.clock.value,30);assert.equal(show.root.visible,true);const buffer=show.root.geometry.attributes.position.array,full=show.root.geometry.drawRange.count;assert.ok([...buffer].every(Number.isFinite));
 show.setQuality('low');show.update(32000);assert.ok(show.root.geometry.drawRange.count<full);assert.equal(show.root.geometry.attributes.position.array,buffer);show.update(33000,{interior:true});assert.equal(show.root.visible,false);assert.equal(show.root.geometry.drawRange.count,0);show.update(100000);assert.equal(show.active,false);show.setShow({...state,state:'stopped'});show.update(4000);assert.equal(show.root.visible,false);show.dispose();assert.equal(scene.children.length,0);
});
test('sparkler activity synchronizes as an item and the unchanged kiosk entrance is walkable',()=>{
 assert.ok(activityGestures.includes('sparkler-carry'));assert.equal(encodeActivity({heldItem:'sparkler'}),'sparkler-carry');assert.deepEqual(decodeActivity('sparkler-carry'),{heldItem:'sparkler',gesture:''});assert.ok(canStandAt(sparklerEntrance.x,sparklerEntrance.z));
});
test('firework lighting reuses the world light with bounded pulses and respects reduced flashing',()=>{
 const scene=new T.Scene(),light=new T.DirectionalLight('#eef5ff',.8);scene.add(light);
 const show=createWinterFireworks(scene,{light}),first=createFireworkScore(42)[0],now=1000+(first.at+first.flight+.16)*1000;
 show.setShow({id:'light-test',startsAt:1000,seed:42,state:'playing'});
 const listener=new T.Vector3(first.x,first.y+first.height,first.z);
 show.update(now,{listener});assert.ok(light.intensity>.8&&light.intensity<=1.18);assert.equal(scene.children.filter(o=>o.isLight).length,1);
 // The world resets its ambient lighting every frame before the show adds a pulse.
 light.intensity=.8;light.color.set('#eef5ff');const color=light.color.clone();show.update(now+10,{listener,reduceFlash:true});
 assert.equal(light.intensity,.8);assert.ok(light.color.equals(color));show.dispose();assert.equal(scene.children.length,1);
});


test('embers finish in the sky with short tapered tails instead of long vertical rain',()=>{
 const score=createFireworkScore(42);assert.ok(score.every(s=>s.life<=5.6));assert.ok(score.filter(s=>s.pattern!=='willow').every(s=>s.life<=4.2));
 const scene=new T.Scene(),show=createWinterFireworks(scene);show.setShow({id:'tail-test',seed:42,startsAt:0,state:'playing'});
 const {position,velocity,timing,design}=show.root.geometry.attributes;for(let i=0;i<timing.count;i++){assert.ok(timing.getY(i)<=.551);assert.ok(design.getZ(i)<=5.601);}
 // Sample actual seeded trajectories at extinction: even the lowest ember stays above the ground.
 for(let i=0;i<timing.count;i+=12){const t=design.getZ(i);if(!t)continue;const willow=design.getX(i)===2,drag=willow?.19:.46;
  const height=position.getY(i)+timing.getW(i)+velocity.getY(i)*(1-Math.exp(-t*drag))/drag-(willow?1.15:1.8)*t*t;
  assert.ok(height>10,'embers must extinguish before descending into the park');
 }
 show.dispose();
});
