import {regionBridges,regions} from '../dist/region-layout.js';
import {spaShift} from '../dist/resort-layout.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {buildCastle} from '../dist/castle-model.js';
import {buildFerrisWheel} from '../dist/ferris-model.js';
import {castleLayout,castleView} from '../dist/castle-layout.js';
import {bridges,terrainAt,landforms,landDistance} from '../dist/world-layout.js';
import {canStandAt} from '../dist/movement.js';

test('castle dominates the wheel and its central silhouette stays clear from the promenades',()=>{
 const castle=buildCastle(),wheel=buildFerrisWheel();castle.root.updateMatrixWorld(true);wheel.root.updateMatrixWorld(true);
 const cb=new T.Box3().setFromObject(castle.root,true),wb=new T.Box3().setFromObject(wheel.root,true);assert.ok(cb.max.y>wb.max.y+10);assert.ok(wb.max.x<cb.min.x-6);
 const targets=[[0,43,-19],[-7.2,31,-20.5],[7.2,31,-20.5],[0,7,-14]];
 for(const [x,z]of [[0,24],[0,8],[20,24],[108,53]])for(const p of targets){const origin=new T.Vector3(x,2.2,z),delta=new T.Vector3(...p).sub(origin),ray=new T.Raycaster(origin,delta.clone().normalize(),0,delta.length());assert.equal(ray.intersectObject(wheel.root,true).length,0);}
 castle.dispose();
});
test('park arrival framing contains both the castle crown and the original character',()=>{
 const v=castleView,aim=new T.Vector3(0,12.1,22.2),camera=new T.PerspectiveCamera(v.fov,390/844,.1,1200);camera.position.set(Math.sin(v.yaw)*Math.cos(v.pitch)*v.distance,aim.y+Math.sin(v.pitch)*v.distance,aim.z+Math.cos(v.yaw)*Math.cos(v.pitch)*v.distance);camera.lookAt(aim);camera.updateMatrixWorld();
 for(const p of [[0,45,-19],[0,2,24],[0,.1,24]]){const screen=new T.Vector3(...p).project(camera);assert.ok(Math.abs(screen.y)<.9&&Math.abs(screen.x)<.9,JSON.stringify(screen));}
});
test('castle arch joins a short straight bridge and spa has both park and ski access',()=>{
 const north=regionBridges.find(b=>b.id==='park-ski');assert.equal(north.start.x,castleLayout.passage.x);assert.equal(north.end.x,castleLayout.passage.x);assert.ok(Math.hypot(north.end.x-north.start.x,north.end.z-north.start.z)<30);
 for(const id of ['park-spa','ski-spa']){const bridge=regionBridges.find(b=>b.id===id);assert.ok(bridge);assert.ok(Math.hypot(bridge.end.x-bridge.start.x,bridge.end.z-bridge.start.z)<(id==='park-spa'?30:60));}
 assert.ok(regions.spa.center.z>regions.ski.arrival.z);assert.ok(regions.spa.center.z<regions.tree.center.z);
});
