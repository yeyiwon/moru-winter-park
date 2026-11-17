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
test('north bridge is shorter and straight through the arch; spa bridge directly spans the removed greenhouse island',()=>{
 const north=bridges.find(([a,b])=>b.z< -30),garden=bridges.find(([a,b])=>b.z===91+spaShift);assert.equal(north[0].x,castleLayout.passage.x);assert.equal(north[1].x,castleLayout.passage.x);assert.ok(Math.abs(north[1].z-north[0].z)<40);assert.ok(garden[1].z-garden[0].z>=18);
 for(const [a,b]of [north,garden])for(let t=0;t<=1;t+=.01)for(const dx of [-2.8,0,2.8])assert.ok(canStandAt(a.x+(b.x-a.x)*t+dx,a.z+(b.z-a.z)*t));
 for(const p of [...north,...garden])assert.ok(landforms.some(f=>landDistance(p.x,p.z,f)<0),'bridge landing must meet snow');
 assert.equal(terrainAt(8,42),false,'air below the spa crossing');
});

test('compact park approaches reach the lift and baths without the old empty corridors',()=>{
 const north=bridges.find(([a,b])=>b.z< -30),south=bridges.find(([a,b])=>a.z===30);
 assert.ok(Math.hypot(north[1].x-north[0].x,north[1].z-north[0].z)<=18);
 assert.ok(Math.hypot(south[1].x-south[0].x,south[1].z-south[0].z)<=22);
 assert.ok(canStandAt(-36,-95));assert.ok(canStandAt(0,56));
});
