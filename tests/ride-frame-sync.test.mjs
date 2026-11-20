import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createGondola} from '../dist/alpine-gondola.js';
import {gondolaSchedule,gondolaSeat,sharedSeatPose} from '../dist/ride-seats.js';
import {alpineShift} from '../dist/resort-layout.js';

test('gondola geometry and every passenger use the same supplied render timestamp',()=>{
 const prior=globalThis.window,parent=new T.Group();parent.position.z=alpineShift;
 const gondola=createGondola(parent),cabin=100*gondolaSchedule.interval,id=100%gondolaSchedule.count;
 try{
  for(const elapsed of [7,14,21,35,54,80,98,107,125,160,205,220]){
   const now=cabin+elapsed*1000,position=sharedSeatPose({kind:'gondola',cabin,startedAt:cabin+1500,seat:0},now);
   globalThis.window={labPlayerState:position};gondola.update(now);parent.updateMatrixWorld(true);
   const model=gondola.root.children.find(o=>o.userData.cabinId===id);assert.ok(model,'occupied cabin remains detailed');
   for(let seat=0;seat<6;seat++){
    const p=gondolaSeat(seat),actual=new T.Vector3(p.x,.82,p.z).applyMatrix4(model.matrixWorld),expected=sharedSeatPose({kind:'gondola',cabin,startedAt:cabin+1500,seat},now);
    assert.ok(actual.distanceTo(new T.Vector3(expected.x,expected.y,expected.z))<1e-7,`seat ${seat} at ${elapsed}s`);
   }
  }
 }finally{if(prior===undefined)delete globalThis.window;else globalThis.window=prior;const geometries=new Set(),materials=new Set();parent.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
});
