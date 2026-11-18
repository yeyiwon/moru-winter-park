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
