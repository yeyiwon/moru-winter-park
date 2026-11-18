import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createSimulationClock} from '../dist/simulation-clock.js';
import {createPlayerState} from '../dist/player-state.js';
import {mergePaintedGeometry,mergeMeshGeometry,spatialBatchKey} from '../dist/mesh-batch.js';
import {createPresenceCache,interestSnapshot,presenceDelay} from '../dist/presence-policy.js';
import {buildInteriors} from '../dist/interior-world.js';
import {createLocalLights} from '../dist/local-lights.js';
import {disposeOwnedScene} from '../dist/scene-resources.js';
import {summarizeFrames} from '../dist/frame-metrics.js';

test('fixed physics covers the same time at 30, 60 and 120 Hz and bounds stall recovery',()=>{
 for(const hz of [30,60,120]){const clock=createSimulationClock();let ticks=0,total=0;for(let i=0;i<hz*4;i++)clock.advance(1/hz,dt=>{ticks++;total+=dt;});assert.equal(ticks,240);assert.ok(Math.abs(total-4)<1e-9);clock.advance(10,()=>ticks++);assert.equal(ticks,244);clock.reset();assert.equal(clock.advance(1/120,()=>{}),0);}
});
test('exclusive ride/activity states gate jumping and recover on exit',()=>{
 const changes=[],state=createPlayerState(s=>changes.push(s));assert.ok(state.canJump());
 for(const mode of ['lift','ski','ferris','carousel','skate','bath']){state.update({mode,moving:true,jump:1});assert.equal(state.canJump(),false);state.reset();assert.ok(state.canJump());}
 assert.equal(state.update({moving:true,running:true,room:'ryokan'}),'Running');assert.equal(state.indoor,true);assert.equal(state.update({room:'ryokan'}),'Indoor');assert.ok(state.canJump());assert.equal(state.update({jump:1}),'Jumping');assert.equal(state.canJump(),false);assert.ok(changes.length>10);
});
test('painted batches retain every triangle, UV seam, normal and per-part colour',()=>{
 const parts=[{geometry:new T.SphereGeometry(1,12,8),color:new T.Color('#f0c89c')},{geometry:new T.BoxGeometry(2,3,4).translate(4,0,0),color:new T.Color('#a5d9e8')}],merged=mergePaintedGeometry(parts),plain=merged.toNonIndexed();let offset=0;
 for(const part of parts){const expected=part.geometry.toNonIndexed();for(const key of ['position','normal','uv']){const a=expected.attributes[key],b=plain.attributes[key];assert.deepEqual([...b.array.slice(offset*a.itemSize,(offset+a.count)*a.itemSize)],[...a.array]);}for(let i=offset;i<offset+expected.attributes.position.count;i++)assert.ok(Math.abs(plain.attributes.color.getX(i)-part.color.r)<1e-6);offset+=expected.attributes.position.count;}
 assert.ok(merged.attributes.position.count<plain.attributes.position.count/2);
 const a=new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),b=a.clone();b.position.z=150;a.updateMatrixWorld();b.updateMatrixWorld();assert.notEqual(spatialBatchKey(a),spatialBatchKey(b));
 const bare=new T.Mesh(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3)));bare.updateMatrixWorld();assert.doesNotThrow(()=>mergeMeshGeometry([bare]));
});
test('lazy rooms reuse assets, release after absence, restore lights and do not retain colliders',()=>{
 const scene=new T.Scene(),lights=createLocalLights(scene),asset=buildInteriors(scene,{lazy:true,retainMs:100,onLoad:lights.register,onRelease:lights.unregister});assert.equal(Object.keys(asset.rooms).length,0);const before=lights.sourceCount;
 for(let i=0;i<3;i++){const room=asset.ensure('ryokan');assert.equal(asset.ensure('ryokan'),room);assert.ok(lights.sourceCount>before);asset.setActive('ryokan');asset.maintain(200,true);assert.equal(asset.release('ryokan'),false);assert.ok(asset.occluders.length>0);asset.setActive(null);asset.maintain(301,false);assert.equal(asset.rooms.ryokan,undefined);assert.equal(asset.occluders.length,0);assert.equal(lights.sourceCount,before);}
 asset.dispose();lights.dispose();assert.equal(scene.children.length,0);
});
test('owned resources dispose once while explicitly shared assets remain alive',()=>{
 const root=new T.Group(),g=new T.BoxGeometry(),m=new T.MeshBasicMaterial(),shared=new T.MeshBasicMaterial();shared.userData.shared=true;let geometries=0,materials=0;g.addEventListener('dispose',()=>geometries++);m.addEventListener('dispose',()=>materials++);shared.addEventListener('dispose',()=>assert.fail('shared material disposed'));root.add(new T.Mesh(g,m),new T.Mesh(g,shared));disposeOwnedScene(root);assert.equal(geometries,1);assert.equal(materials,1);
});
test('network interest deltas preserve remote poses, propagate chat, refresh near peers and remove departures',()=>{
 const far={id:'far',name:'A',x:200,z:0,y:1,yaw:0,chat:'hello',chatAt:12},near={...far,id:'near',x:10},cache=createPresenceCache();const first=interestSnapshot([far,near],{x:0,z:0},cache.request(),10000);assert.equal(first.people[0].distant,undefined);cache.merge(first.people,first.farBucket);
 const second=interestSnapshot([{...far,x:210,chat:'new'},near],{x:0,z:0},cache.request(),11000);assert.equal(second.people[0].x,undefined);const merged=cache.merge(second.people,second.farBucket);assert.equal(merged[0].x,200);assert.equal(merged[0].chat,'new');assert.equal(second.people[1].x,10);
 assert.equal(interestSnapshot([far],{x:200,z:0},cache.request(),11000).people[0].x,200);assert.equal(interestSnapshot([far],{x:0,z:0},cache.request(),11000,[{id:'far'}]).people[0].x,200);assert.equal(interestSnapshot([far],{x:0,z:0},cache.request(),16000).people[0].x,200);
 assert.equal(cache.merge([],3).length,0);cache.reset();assert.equal(cache.request().farBucket,null);assert.ok(presenceDelay({hidden:true})<20000);assert.equal(presenceDelay({moving:true}),700);assert.equal(presenceDelay({failures:9}),8000);
});
test('frame metrics report measured percentiles and unavailable GPU as null',()=>{
 const m=summarizeFrames([10,20,40,80].map(ms=>({ms,cpu:4,calls:50,triangles:100})));assert.equal(m.p95Ms,80);assert.equal(m.p99Ms,80);assert.equal(m.fps,1000/37.5);assert.equal(m.gpuMeanMs,null);assert.equal(summarizeFrames([]).fps,null);
});
